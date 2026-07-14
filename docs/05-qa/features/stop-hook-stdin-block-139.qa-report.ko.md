# QA 리포트 — Stop 훅 stdin-block (이슈 #139)

- **기능**: `stop-hook-stdin-block-139` · **대상**: bkit v2.1.30
- **판정**: **PASS** — 근본원인 수정·재현, 전 게이트 green, 신규 회귀 0건.

## 1. 재현 (전 → 후)

| 시나리오 | 전 (`readFileSync(0)`) | 후 |
|---|---|---|
| 정상 (stdin 닫힘) | 0.19초 | 0.17초 |
| payload + 파이프 held-open (#139 케이스) | ~held 시간 (→ 운영선 15.5분) | **~1ms parse / ~374ms 훅** |
| no-data + 파이프 held-open | ~held 시간 | ~2.0초 hard cap (유계) |
| truncated + 파이프 held-open | ~held 시간 | ~2.0초 hard cap (유계) |

## 2. 기능 / 회귀 테스트

| 스위트 | 결과 |
|---|---|
| `test/regression/issue-139-stdin-bounded.test.js` (신규, 16 TC) | 16/16 PASS (5회 안정) |
| contract L1+L4 vs v2.1.9 / v2.1.16 | 222 / 243 어서션 PASS |
| integration-runtime | 23/23 |
| l2-smoke | 105/105 |
| l2-hook-attribution (Stop turn 기록) | 13/13 |
| l3-mcp-compat / l3-mcp-runtime | 92/92 · 48/48 |
| hooks-22 (훅 배선 + JS 문법) | 25/25 |
| hook-cold-start / hook-real-execution | PASS · 8/8 |
| state-store-perf (lock backoff) | 15/15 |
| invocation-inventory | 213/213 |

## 3. 릴리스 게이트

| 게이트 | 결과 |
|---|---|
| check-domain-purity | OK (18파일, 0 forbidden) |
| check-deadcode | 신규 dead code 0 |
| docs-code-sync (+ .test) | PASS · 36/36 |
| check-guards | 24 guards, 0 warn |
| check-test-tracking | 346파일, 0 untracked |
| validate-plugin --strict | 0 errors, 0 warnings |
| bkit-full-system (버전 동기화 v2.1.30 × 7파일) | 36 PASS / 0 FAIL |

## 4. 무회귀 증명

`qa-aggregate`가 실패파일 13개 보고 — `main` baseline과 **완전 동일**. `state-store`
의존 유닛 테스트 3건(audit-logger AL-007, loop-breaker LB-013, trust-engine
TE-001/TE-025)을 `git stash`로 clean `main`에서 실행 → **동일하게** 실패(이 변경과
무관한 기존 stale-count/로직 어서션).

## 5. 라이브 검증

Claude Code **v2.1.208**에서 `claude -p --plugin-dir .` → 총 5.65초에 `PONG` 반환;
`Stop` 훅(현 `readStdinBounded`)이 턴 종료 시 stall 없이 발화.

## 6. 잔여 / 수용

sync `readStdinSync`는 no-data/truncated + held-open 파이프를 hard-bound 불가(blocking
syscall); 턴-gate하는 Stop 훅은 `readStdinBounded`가 담당하며, 나머지 35개 훅의
payload는 실무상 항상 존재(CC 자체 훅 타임아웃이 외곽 경계). 설계에 문서화.
