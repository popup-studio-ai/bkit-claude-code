# 설계 — Stop 훅 stdin-block (이슈 #139)

- **기능**: `stop-hook-stdin-block-139` · **대상**: bkit v2.1.30
- **접근**: 하이브리드(Design 체크포인트에서 선택) — 모든 훅용 중앙 sync parse-early
  + 턴을 gate하는 Stop 훅용 async hard-timeout + CPU 비소모 lock backoff.

## 0. 재현 원장 (설계의 근거 증거)

| # | 시나리오 | 현재 `readFileSync(0)` | Sync parse-early | Async parse-early + hard-timeout |
|---|---|---|---|---|
| T1 | stdin 즉시 닫힘 (정상) | 0.19초 | 0ms | 14ms |
| T2 | **payload 전송, 파이프 5초 held-open (재현된 #139 케이스)** | **~5초 (운영선 15.5분)** | **1ms** | 14ms |
| T3 | 데이터 없음, 파이프 5초 held-open | ~5초 | ~5초 (blocking syscall) | 1502ms (hard cap) |
| T4 | 200KB 멀티청크, 3초 held-open | ~3초 | 2ms | 14ms |
| T5 | truncated JSON, 5초 held-open | ~5초 | ~5초 | 1502ms (hard cap) |

**프로세스 exit 함정(검증됨)**: async 이벤트 기반 리더는 parse-early로 payload를
resolve해도 *부족*하다 — 열린 `process.stdin` 핸들이 EOF까지 이벤트 루프를 살려
프로세스가 lingering(테스트에서 4885ms 지연). 리더는 resolve 시 반드시
`process.stdin.destroy()` 해야 한다(그러면 프로세스가 15ms에 exit). sync `fs.readSync`
경로는 raw fd(libuv 스트림 핸들 없음)라 cleanup 없이도 즉시(8ms) exit — 검증됨.

## 1. 변경 1 — `lib/core/io.js` `readStdinSync()` → 유계 parse-early (중앙)

**36개 훅 스크립트 전부**를 한 번에 보호.

```js
function readStdinSync() {
  const deadline = Date.now() + STDIN_READ_TIMEOUT_MS;   // env 오버라이드 가능
  const CHUNK = 65536;
  let buf = Buffer.alloc(0);
  const tmp = Buffer.alloc(CHUNK);
  try {
    while (true) {
      // parse-early: 버퍼가 완전한 JSON 값을 담는 즉시 반환 — EOF 대기 안 함
      // (EOF 대기가 #139 stall의 원인).
      if (buf.length > 0) {
        try { return JSON.parse(buf.toString('utf8')); } catch (_) { /* 더 필요 */ }
      }
      if (Date.now() > deadline) break;          // 읽기 사이 best-effort 유계
      let n = 0;
      try {
        n = fs.readSync(0, tmp, 0, CHUNK, null);
      } catch (e) {
        if (e.code === 'EAGAIN') continue;        // 논블로킹 fd, 재시도
        if (e.code === 'EOF') { n = 0; }          // 일부 플랫폼은 EOF를 throw로 표면화
        else throw e;
      }
      if (n === 0) break;                          // 실제 EOF
      buf = Buffer.concat([buf, tmp.slice(0, n)]);
    }
    return JSON.parse(buf.toString('utf8'));       // 최종 시도 (빈 값 → throw → {})
  } catch (e) {
    getDebug().debugLog('io', 'readStdinSync parse failure', {
      error: e && e.message, strict: process.env.BKIT_STRICT_STDIN === '1',
    });
    if (process.env.BKIT_STRICT_STDIN === '1') throw e;
    return {};
  }
}
```

**계약 보존**: 빈 stdin → `JSON.parse('')` throw → `{}`; malformed → debugLog + `{}`
(또는 `BKIT_STRICT_STDIN`에서 rethrow). 모든 정상 payload에 대해 반환값 동일. 유일한
동작 변화는 유효 payload가 EOF *이후*가 아니라 *이전*에 반환된다는 것 — 이것이 곧 fix.

**잔여(수용·문서화)**: sync deadline은 best-effort — blocking `readSync` 호출 *사이*
에서만 검사되므로, 진짜로 비어있는-held-open 파이프(T3)나 truncated-held 파이프(T5)는
한 번의 `readSync` 안에서 EOF까지 여전히 block될 수 있다. 그래서 턴-gate하는 Stop
훅은 변경 2를 추가로 받는다. 나머지 35개 훅은 이 잔여를 수용(실무상 payload는 항상
존재하며, CC 자체 훅 타임아웃이 외곽 경계).

## 2. 변경 2 — `scripts/unified-stop.js` → async hard-timeout read (방어 심층)

`io.js` 신규 export:

```js
function readStdinBounded(timeoutMs) {
  return new Promise((resolve) => {
    let data = '', done = false;
    const cleanup = () => {
      clearTimeout(timer);
      try { process.stdin.pause(); } catch (_) {}
      process.stdin.removeAllListeners('data');
      process.stdin.removeAllListeners('end');
      process.stdin.removeAllListeners('error');
      try { process.stdin.destroy(); } catch (_) {}   // 핸들 해제 → 즉시 exit
    };
    const finish = (v) => { if (done) return; done = true; cleanup(); resolve(v); };
    const timer = setTimeout(() => {
      getDebug().debugLog('io', 'readStdinBounded hard timeout', { timeoutMs, bytes: data.length });
      try { finish(JSON.parse(data)); } catch (_) { finish({}); }
    }, timeoutMs != null ? timeoutMs : STDIN_READ_TIMEOUT_MS);
    if (timer.unref) timer.unref();
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => { data += c; try { finish(JSON.parse(data)); } catch (_) {} });
    process.stdin.on('end', () => { try { finish(JSON.parse(data)); } catch (_) { finish({}); } });
    process.stdin.on('error', () => finish({}));
  });
}
```

`unified-stop.js`는 본문을 async IIFE로 감싸고 최상단에서 유계 read를 await(read가
첫 연산이므로 타이머가 발화할 수 있게 이벤트 루프가 자유롭다). read 이후 전부 async
함수 내부에서 동기 유지 — 구조 변경 최소, 로직 변경 없음. 이로써 Stop 훅은 T3/T5
에서도 `STDIN_READ_TIMEOUT_MS`를 초과할 수 없다.

## 3. 변경 3 — `lib/core/state-store.js` `lock()` → CPU 비소모 backoff

CPU를 태우는 busy-wait 스핀을 `Atomics.wait` 기반 실제 동기 sleep으로 교체(이식성,
Node ≥ 8.10, 네이티브 의존 없음, CPU 비소모):

```js
// 기존: const waitUntil = Date.now() + LOCK_RETRY_INTERVAL_MS;
//       while (Date.now() < waitUntil) { /* spin */ }
sleepSync(LOCK_RETRY_INTERVAL_MS);   // Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
```

동일한 wall-clock 경계(락당 최악 ~5초)이나 대기 중 CPU 코어를 점유하지 않음 — Stop
체인의 ~4개 `lockedUpdate` 호출에 대한 이슈의 "lock-wait / retry-without-backoff"
지적 해소.

## 4. 변경 4 — `lib/core/constants.js`

I/O 섹션에 추가:

```js
/** 유계 stdin read 타임아웃(ms) — env 오버라이드: BKIT_STDIN_TIMEOUT_MS */
const STDIN_READ_TIMEOUT_MS = Number(process.env.BKIT_STDIN_TIMEOUT_MS) > 0
  ? Number(process.env.BKIT_STDIN_TIMEOUT_MS)
  : 2000;
```

2000ms는 관측된 정상 평균(0.8초)의 ~2.5배이면서 bkit `HOOK_TIMEOUT_MS`(5000)와 CC
Stop 훅 `timeout`(10000)보다 충분히 작아, 두 외곽 타임아웃 발화 전에 bkit이 read를
유계화한다.

## 5. 회귀 테스트 (`test/regression/issue-139-stdin-bounded.test.js`)

1. writer가 파이프를 held-open할 때 `readStdinSync`가 유효 payload를 즉시 반환
   (경과 시간 ≪ held-open 시간 assert).
2. `readStdinSync` 빈 stdin → `{}`; malformed → `{}` (계약 보존).
3. `readStdinBounded`가 payload에 parse-early로 resolve; no-data/truncated 입력에
   hard timeout(유계)으로 resolve; stdin destroy로 프로세스 exit 가능.
4. `state-store` `lock()`/`lockedUpdate`가 동시 writer를 여전히 직렬화하고 스핀이
   교체됨(소스에 busy-wait 토큰 부재).
5. 라이브: held-open 파이프에서 `node scripts/unified-stop.js`가 유계 반환.

## 6. 범위 외 (근거)

- `scripts/lint-skill-md.js:26` raw `fs.readFileSync(0)` — **stdin 리다이렉트로
  markdown 파일**을 읽음(훅 JSON payload 아님, held-open 파이프 아님); 취약하지 않음.
  scope creep 방지 위해 미변경.
- Stop 서브핸들러 fire-and-forget화 — 확정 원인은 stdin blocking이지 서브핸들러
  비용이 아님(정상 실행 0.19초). 불필요.

## 7. 아키텍처 카운트 영향

없음. 모든 변경은 기존 lib 모듈 / 스크립트 1개 내부. Skills 44 · Agents 34 · Hooks
22 ev / 25 blk · Lib 195 모듈 **불변**(QA에서 docs-code-sync로 검증).
