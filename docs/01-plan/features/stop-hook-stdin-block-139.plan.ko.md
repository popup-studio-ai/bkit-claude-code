# 계획 — Stop 훅 stdin-block (이슈 #139)

- **기능(Feature)**: `stop-hook-stdin-block-139`
- **대상 bkit 버전**: v2.1.30
- **출처**: GitHub 이슈 [#139](https://github.com/popup-studio-ai/bkit-claude-code/issues/139) (@thenopen, Claude Code `/doctor` 헬스체크로 발견)
- **브랜치**: `feat/v2.1.30-issue-139` (`main` @ `76bd1af` = v2.1.29 기반)

## 1. 문제 정의

`Stop` 이벤트 훅(`scripts/unified-stop.js`, `hooks/hooks.json`에 `timeout: 10000`으로
배선)이 간헐적으로 자체 10초 타임아웃을 훨씬 초과하여 stall된다.

제보자 집계 증거(~50세션 / 5일 구간, Claude Code transcript 훅-어태치먼트 기록):

| 지표 | 값 |
|---|---|
| Stop 훅 실행 횟수 | 2,223 |
| 평균 소요 | ~0.8초 (정상) |
| **최대 소요** | **928,551ms (~15.5분)** |
| 타임아웃 취소(`timedOut: true`, `timeoutMs: 10000`) | 14회 |

Stop 훅은 턴 완료를 gate하므로, 모든 stall이 그 시간만큼 턴 종료를 차단한다.

## 2. 근본 원인 (재현으로 확정 — 추측 아님)

`lib/core/io.js`의 `readStdinSync()`는 훅 payload를 다음으로 읽는다:

```js
const input = fs.readFileSync(0, 'utf8');
```

`fs.readFileSync(0)`은 **타임아웃 없는 stdin(fd 0) blocking read**이다. stdin이
EOF에 도달할 때까지(= Claude Code가 훅 stdin 파이프의 write-end를 닫을 때까지)
반환하지 않는다. CC가 write-end를 계속 열어두면(바쁨/백프레셔/지연 close) 훅은
정확히 그만큼 blocking된다.

**재현**(`node scripts/unified-stop.js`, 실제 훅):

| 조건 | 실제 시간 | user CPU |
|---|---|---|
| stdin 즉시 닫힘 (정상) | 0.19초 | 0.19초 |
| payload 전송 후 writer가 stdin 파이프 4초 유지 | **4.07초** | 0.19초 |

`user` CPU는 0.19초로 고정인 채 wall time만 held-open 시간을 추종 → 프로세스가
**I/O 대기로 blocking**됨(CPU 소모 아님)을 증명. 이슈 프로파일(정상 평균 · 극단
tail · 낮은 CPU = 일관된 성능 저하가 아닌 간헐적 blocking I/O 대기)과 정확히 일치.

## 3. Blast radius (Rule 4 — 연관·유사 코드)

`readStdinSync()`는 **36개 파일**이 호출 — 사실상 모든 bkit 훅 스크립트
(`unified-stop`, `skill-post`, `unified-bash-pre/post`, `unified-write-post`,
`user-prompt-handler`, `session-end-handler`, 모든 `*-stop.js` 등). 이슈는
`unified-stop.js`로 제기됐으나 결함은 **공유** 함수에 있다. 따라서
**io.js 단일 중앙 수정이 모든 훅 이벤트를 보호**한다(Stop뿐 아니라 PreToolUse /
PostToolUse / SessionEnd 등).

추가 raw 발생 1건: `scripts/lint-skill-md.js:26`이 `fs.readFileSync(0)`을 직접
사용하나, 런타임 훅이 아닌 CI/개발 lint 도구(저우선, 일관성 차원에서 함께 처리).

## 4. 2차 기여 요인 (코드 확인; 15분 원인은 아님)

`lib/core/state-store.js`의 `lock()`(약 158-160행)은 재시도를 **CPU를 태우는 동기
busy-wait 스핀**으로 구현:

```js
const waitUntil = Date.now() + LOCK_RETRY_INTERVAL_MS;
while (Date.now() < waitUntil) { /* spin */ }
```

상수(`lib/core/constants.js`): `LOCK_TIMEOUT_MS=5000`, `LOCK_STALE_MS=10000`,
`LOCK_RETRY_INTERVAL_MS=100`, `LOCK_MAX_RETRIES=50`. 단일 `lock()`은 ~5초로
상한되어 그 자체로 15분을 설명할 수 없으나, Stop 체인의 ~4개 `lockedUpdate`
호출(checkpoint-manager, metrics-collector, trust-engine, automation-controller)
경합 시 CPU 코어를 점유하고 지연을 더한다. 이슈의 "lock-wait / retry-without-backoff"
의심과 정확히 부합하는 유효한 hardening 대상.

## 5. 목표 & 비목표

**목표**
- Stop 훅(및 모든 bkit 훅)은 stdin에서 절대 무한 blocking되지 않아야 한다.
- 재현된 케이스(payload 전송 · 파이프 held-open)는 ~ms 내 해소되어야 한다.
- `readStdinSync()`의 반환 계약 보존(parse 실패 → `{}`, 단 `BKIT_STRICT_STDIN=1`은
  rethrow; 실패 시 debugLog).
- CI 신규 회귀 0건; `--plugin-dir .` 라이브 검증.

**비목표**
- Stop 서브핸들러 파이프라인 전체 async/fire-and-forget 재작성(확정된 원인은 stdin
  blocking이지 서브핸들러 비용이 아님). 선택적 계측만.
- 사용자 승인 없는 버전 릴리스(Rule 11).

## 6. 인수 기준

1. 유효 payload + 지연 EOF(파이프 held-open) → 훅 즉시(~ms) 반환. 회귀 테스트 +
   라이브 재현(전/후 타이밍)으로 검증.
2. 36개 훅 전부 정상 payload를 동일하게 파싱하고 핸들러 디스패치.
3. 전 CI 게이트 green, `main` 기준선 대비 신규 실패 0건.
4. Docs = Code 동기화; 버전 2.1.29 → 2.1.30 정규 surface 전반 bump.

## 7. 배포

단일 브랜치 · 단일 커밋(GitHub Actions 비용 최소화), PR → CI 모니터 →
**사용자 승인 게이트** → 머지 → 태그 `v2.1.30` → GitHub Release(영어) → #139 답변·close.
