# 갭 분석 — Stop 훅 stdin-block (이슈 #139)

- **기능**: `stop-hook-stdin-block-139` · **대상**: bkit v2.1.30
- **매치율**: **100%** (모든 설계 항목 구현·검증 완료)

## 설계 → 구현 추적성

| # | 설계 항목 | 구현 | 검증 |
|---|---|---|---|
| C1 | `readStdinSync()` 유계 parse-early (중앙, 36 훅) | `lib/core/io.js` `readStdinSync()` 재작성: 증분 `fs.readSync` + parse-early + deadline | ✅ 15.5분 → ~1ms (실제 훅); 계약 보존(empty/malformed → `{}`) |
| C2 | Stop 훅용 async hard-timeout 리더 | `lib/core/io.js` `readStdinBounded()` (parse-early + hard timeout + `process.stdin.destroy()`); `scripts/unified-stop.js`가 async IIFE에서 await | ✅ no-data/truncated held-open ~2s 유계; unified-stop 8s held 파이프 대비 ~374ms |
| C3 | CPU 비소모 lock backoff | `lib/core/state-store.js` `sleepSync()` (`Atomics.wait`); `lock()` 스핀 교체 | ✅ sleepSync(300)=305ms; `lockedUpdate` 직렬화 유지(counter=20); state-store-perf 15/15 |
| C4 | `STDIN_READ_TIMEOUT_MS` 상수 + env 오버라이드 | `lib/core/constants.js` (기본 2000, `BKIT_STDIN_TIMEOUT_MS`) | ✅ 로드=2000; export됨 |
| C5 | 회귀 테스트 | `test/regression/issue-139-stdin-bounded.test.js` (16 TC) | ✅ 16/16, 5회 반복 안정 |
| — | 중앙 re-export | `lib/core/index.js`가 `readStdinBounded` 노출 | ✅ deadcode 0-new |

## 설계 대비 편차

없음. 구현 중 확인된 설계 시점 발견 2건은 설계 명세대로 정확히 처리됨:

1. **프로세스 exit 함정**(async 경로): parse-early만으로는 열린 `process.stdin`
   핸들이 EOF까지 이벤트 루프를 살려 프로세스가 lingering(측정 4885ms). resolve 시
   `process.stdin.destroy()`로 해소(→15ms). sync `fs.readSync` 경로는 cleanup 없이도
   즉시 exit 검증(raw fd, 스트림 핸들 없음).
2. **Sync 잔여**(문서화·수용): sync deadline은 best-effort(blocking read 사이에서만
   검사)라 no-data/truncated + held-open 파이프는 sync 리더로 hard-bound 안 됨 —
   그래서 턴-gate하는 Stop 훅이 `readStdinBounded`(C2)를 추가 사용.

## 계약 & 회귀 안전성

- `readStdinSync()` 반환 계약은 모든 정상 payload와 empty/malformed 입력에 대해
  바이트 단위로 보존; 유일한 동작 변화는 EOF *이후*가 아니라 *이전*에 반환.
- `main` 대비 신규 회귀 0건: qa-aggregate 13개 실패파일이 baseline과 동일하고,
  `state-store` 의존 유닛 테스트 3건(audit-logger AL-007, loop-breaker LB-013,
  trust-engine TE-001/025)이 clean `main`에서 동일하게 실패(이 fix와 무관한
  stale-count/로직 어서션).

## 아키텍처 영향

없음. 44 Skills · 34 Agents · 22 Hook Events / 25 blocks · 195 Lib Modules —
불변(기존 모듈 내부 변경 + 신규 테스트 1개).
