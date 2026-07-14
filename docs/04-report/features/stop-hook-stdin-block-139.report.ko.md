# 완료 리포트 — Stop 훅 stdin-block (이슈 #139)

- **기능**: `stop-hook-stdin-block-139` · **버전**: bkit v2.1.30
- **이슈**: [#139](https://github.com/popup-studio-ai/bkit-claude-code/issues/139) (@thenopen, Claude Code `/doctor` 경유)
- **브랜치**: `feat/v2.1.30-issue-139` · **상태**: 구현·QA 완료, 사용자 머지/릴리스 승인 대기

## 요약

`Stop` 훅이 간헐적으로 자체 10초 타임아웃을 훨씬 초과해 최대 ~15.5분 stall되어 턴
완료를 차단했다. 근본원인(재현 확정, 추론 아님): 모든 bkit 훅이 `lib/core/io.js`
`readStdinSync()`로 payload를 읽는데, 이것이 `fs.readFileSync(0)` — **타임아웃 없는**
blocking stdin read로 EOF에서만 반환한다. Claude Code가 훅 stdin write-end를 열어두면
훅은 정확히 그만큼 blocking된다.

수정은 중앙(공유 함수 1곳 → 36개 훅) + 턴-gate하는 Stop 훅 방어심층.

## 변경 사항

| 파일 | 변경 |
|---|---|
| `lib/core/io.js` | `readStdinSync()` → 증분 `fs.readSync` + parse-early(EOF 전 반환); 신규 `readStdinBounded()` async 리더(parse-early + hard timeout + `stdin.destroy()`) |
| `scripts/unified-stop.js` | async IIFE 내에서 `readStdinBounded`로 읽기 |
| `lib/core/state-store.js` | `lock()` busy-wait 스핀 → `Atomics.wait` `sleepSync()` (CPU 비소모) |
| `lib/core/constants.js` | 신규 `STDIN_READ_TIMEOUT_MS` (2000ms, env `BKIT_STDIN_TIMEOUT_MS`) |
| `lib/core/index.js` | `readStdinBounded` re-export |
| `test/regression/issue-139-stdin-bounded.test.js` | 신규 16-TC 회귀 가드 |

## 사용자 체감 결과

- Stop 훅 stall로 턴 끝에서 멈추는 현상 해소. Stop 훅 최악 케이스가 ~15.5분에서
  유계 ~2초로(정상 케이스 ~ms) 감소.
- Stop뿐 아니라 **모든** bkit 훅 이벤트를 보호 — stdin을 읽는 모든 훅이 느린/held-open
  stdin close에 견고해짐.
- 정상 payload 동작 변화 없음; 설정 불필요(필요 시 `BKIT_STDIN_TIMEOUT_MS`로 조정).

## KPI

- 매치율: **100%** (모든 설계 항목 구현).
- 재현된 tail: **15.5분 → ~1ms**(parse) / ~374ms(전체 Stop 훅).
- `main` 대비 회귀: **신규 0건**.
- CI 게이트: **전부 green**; CC v2.1.208 라이브 `claude -p --plugin-dir .` OK.

## 교훈

1. 훅 내 blocking `fs.readFileSync(0)`은 무한 부채 — payload 존재만으로 불충분,
   EOF 대기가 함정. parse-early가 현실 케이스의 EOF 대기를 완전 제거.
2. async 이벤트 기반 read는 resolve 시 stdin을 `destroy()` 해야 함 — 안 하면
   프로세스가 EOF까지 lingering하여 read가 아닌 프로세스 exit로 stall이 재귀.
3. "짧은 시간엔 허용" 수준의 CPU-burn busy-wait도 경합 시 코어를 점유;
   `Atomics.wait`는 드롭인·이식성·무-CPU 동기 sleep.

## 후속 (비차단)

- `scripts/lint-skill-md.js`의 raw `fs.readFileSync(0)`을 일관성 위해 공유 유계 리더로
  경유 검토(현재는 취약하지 않음 — 리다이렉트로 파일 읽기).
- @thenopen의 `/doctor` 출처 제보에 대한 Hall of Fame / external-dogfood E2E 흡수
  검토(기존 dogfooder와 동일 프로그램).
