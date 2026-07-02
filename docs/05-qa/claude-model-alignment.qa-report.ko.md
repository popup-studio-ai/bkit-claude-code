# claude-model-alignment QA 보고서

> **기능**: claude-model-alignment · **브랜치**: `feat/v2.1.25-claude-model-alignment` · **날짜**: 2026-07-02
> **QA 리드**: qa-lead (Claude Fable 5) · **CC 런타임**: 헤드리스 `claude` **v2.1.198** (≥ 모델 플로어 2.1.170)
> **설계 SoT**: [claude-model-alignment.design.ko.md](../02-design/features/claude-model-alignment.design.ko.md) §8 테스트 계획
> **Check 단계**: [claude-model-alignment.analysis.ko.md](../03-analysis/claude-model-alignment.analysis.ko.md) — Match Rate **100%**
> **범위 참고**: bkit은 Claude Code **플러그인**(웹 서버 없음)입니다. L1–L5는 HTTP 계층이 아니라 플러그인 표면(정적 게이트 / 라이브 스킬 디스패치 / 라이브 MCP / 어드바이저리 경계 / docs=code)에 매핑됩니다.
> **판정**: **QA_PASS**

---

## 1. 테스트 요약

| 계층 | 의미 (플러그인 매핑) | 테스트 | 개수 | 결과 |
|---|---|---|:--:|:--:|
| **L1** | 플러그인 정적 게이트 (이미 green인 스위트 스팟체크) | `test/security/agent-frontmatter.test.js`; `contract-test-run.js --compare v2.1.16 --level L1,L4` | 55/55 + 255 어서션 | ✅ PASS |
| **L2** | 라이브 스킬 디스패치 (bkit 상태 머신) | `claude -p "/pdca status" --model haiku --plugin-dir .` | 1/1 | ✅ PASS |
| **L2b** | 신규 모델에서의 라이브 에이전트 스폰 | pdca-iterator (fable) + sprint-report-writer (sonnet) 프로브 | 2/2 | ✅ PASS |
| **L3** | 라이브 MCP 서버 + 도구 | `claude -p` 로 `bkit_pdca_status` MCP 호출 | 1/1 | ✅ PASS |
| **L4** | 어드바이저리 경계 (로직) | `test/e2e/external-dogfood/cc-min-version.test.js` | 9/9 | ✅ PASS |
| **L5** | Docs = Code | `scripts/docs-code-sync.js` + `tests/qa/bkit-full-system.test.js` | sync + 36/0 | ✅ PASS |

**종합**: 6/6 계층 PASS · **통과율 100%** · **critical 0** · **실패 0**.

L1 스팟체크는 분석 §5 수치를 정확히 재현했습니다(security **55/55**, contract v2.1.16 **255** 어서션). 이미 green인 전체 스위트(l2-smoke 101/101, l3-mcp 92+48, L5 210/210 등)는 지시에 따라 **재실행하지 않았습니다**.

---

## 2. 실패한 테스트

**없음.** 실행된 모든 검사가 통과했습니다. 기능 브랜치로 인한 회귀는 없습니다.

투명성을 위해 두 가지 행동적(실패 아님) 관찰을 §6에 기록합니다:
1. `sprint-report-writer`가 처음에는 내부 조회(introspection) 프롬프트를 임무 범위 밖으로 판단해 거부했습니다(임무 범위 거부 — 스폰은 성공, 모델 결함 아님).
2. MCP 도구는 헤드리스 모드에서 명시적 `--allowedTools` 허용이 필요했습니다(예상된 헤드리스 권한 동작, 결함 아님).

---

## 3. 치명적 이슈

**없음.** `qaCriticalCount = 0`.

보안 불변식 재확인: `security-architect` / `code-analyzer` / `self-healing`은 `opus` 유지(`fable` 아님) — SEC-AF 스위트 55/55 green(L1 스팟체크), 설계 §7과 일치.

---

## 4. 증거 (명령 출력 인용)

### L1-a — Security agent-frontmatter 스위트
```
=== Agent Frontmatter Security Test Summary ===
Total: 55 | Pass: 55 | Fail: 0
```
(SEC-AF-051 valid-model 화이트리스트에 `fable` 포함, SEC-AF-052 premium-model 읽기 전용 비용 가드 포함.)

### L1-b — Contract compare v2.1.16 (L1,L4)
```
[contract] Runner v2.1.10 — compare against v2.1.16, levels: L1,L4
[contract] Assertions executed: 255
[contract] ✓ PASSED (255 assertions, 0 warnings)
```

### L2 — 라이브 `/pdca status` 스킬 디스패치 (`--model haiku --plugin-dir .`)
```
│  PM✓  PLAN✓  DESIGN✓  DO✓  CHECK✓  QA▶  REPORT·              │
└─ qa • last: 2m ago • matchRate: 100% • iter: 0/5               ┘
 Feature: claude-model-alignment · Phase: QA (6/9) · Match Rate: 100%
```
스킬이 로드되어 `claude-model-alignment` 기능을 **qa** 단계로 해석 — bkit 상태 머신 정상 동작. 모델 플로어 어드바이저리 미출력(CC 2.1.198 ≥ 2.1.170 — 정상); fable 에이전트가 하드 에러 없이 스폰됨.

### L2b — 신규 모델 핀에서의 라이브 에이전트 스폰 (`--model sonnet --plugin-dir . --allowedTools Task`)
```
# pdca-iterator (opus → fable, 프로브 R3 미포함 대상):
You are powered by the model named Fable 5. The exact model ID is claude-fable-5.

# sprint-report-writer (opus → sonnet):
bkit:sprint-report-writer … Sonnet 5 (모델 ID: claude-sonnet-5)
```
새로 재핀된 두 에이전트 모두 의도한 Claude 5 모델로 라이브 해석됨. `fable` 핀이 런타임 화이트리스트를 통과함(`sonnet`으로의 조용한 강등 없음 — NFR "No Silent Downgrade" 라이브 증거 확보).

### L3 — 라이브 MCP 도구 `bkit_pdca_status` (`--allowedTools mcp__plugin_bkit_bkit-pdca__bkit_pdca_status`)
```
version: 3.0 · lastUpdated: 2026-07-02T04:11:17.233Z
activeFeature: claude-model-alignment (1 active) · qa: 1 · plan: 3
```
MCP 서버(`bkit-pdca`) 부팅 및 도구가 **qa** 단계를 포함한 기능 상태를 반환. (첫 호출은 예상된 헤드리스 권한 프롬프트가 표시됨; 읽기 전용 도구를 allow-list하여 재실행하니 페이로드 반환.)

### L4 — 어드바이저리 경계 로직 (`cc-min-version.test.js`)
```
✓ TC-ENH368-1 v2.1.150 → model-floor advisory (fable agents + workaround)
✓ TC-ENH368-2 v2.1.170 → no advisory
✓ TC-ENH368-3 v2.1.198 → no advisory
✓ TC-ENH368-4 v2.1.142 → install-floor advisory only (precedence)
Total: 9 | PASS: 9 | FAIL: 0
```
이중 플로어 경계 유지: 모델 플로어 어드바이저리는 `2.1.143 ≤ CC < 2.1.170`에서만 발생; 플로어 이상에서는 침묵. TC-ENH368-3은 라이브 2.1.198 런타임에서 어드바이저리 부재를 독립적으로 확인.

### L5 — Docs = Code
```
[docs-code-sync] ✓ PASSED — all counts consistent across code + docs
  (skills 44 · agents 34 · One-Liner SSoT 5/5 synchronised)

[bkit-full-system.test] 36 PASS / 0 FAIL / 0 WARN
```

---

## 5. 성공 기준 & NFR 판정

### 5.1 Plan 성공 기준 (§4.1 SC-1..SC-5)

| ID | 기준 | 판정 | 증거 |
|---|---|:--:|---|
| **SC-1** | 40개 `agents/*.md` `model:` = 승인된 매트릭스 | ✅ 충족 | 분석 100% + contract v2.1.16 255 어서션(L1-b) + SEC-AF 55/55(L1-a) |
| **SC-2** | fable 핀 에이전트 프로브 → `claude-fable-5`; haiku 핀 → `claude-haiku-4-5-*` (헤드리스) | ✅ 충족(확장) | R3: gap-detector→fable, report-generator→haiku; **본 QA**에서 pdca-iterator→`claude-fable-5`로 라이브 확장(L2b) |
| **SC-3** | 전체 로컬 게이트 스위트 green | ✅ 충족 | 분석 §5 전체 스위트 + 재현 스팟체크(L1-a/b) + L4 9/9 + L5 |
| **SC-4** | token-report가 fable 클래스 + $10/$50 + Claude 5 classing 증명 | ✅ 충족(분석 기반) | 분석 token-report 24/24(스팟체크 예산 내에서 재실행 안 함); fable 스폰으로 라이브 비용 경로 수행 |
| **SC-5** | docs=code 드리프트 0; 3개 레거시 버그 수정; 카운트 일관 | ✅ 충족 | `docs-code-sync.js` PASS + `bkit-full-system` 36/0(L5) |

> SC-6(push 시 GitHub Actions)과 SC-7(릴리스 노트)는 **릴리스 단계** 기준으로 QA 범위 밖; SC-7 초안은 분석 §1 기준 이미 존재.

### 5.2 비기능 요구사항 (§3.2)

| NFR | 판정 | 증거 |
|---|:--:|---|
| CI 무결성 (contract L1-L5 + security + unit + release gates) | ✅ Pass | L1-a/b 재현 + 분석 §5 전체 green |
| Docs = Code (드리프트 0) | ✅ Pass | L5 docs-code-sync + bkit-full-system green |
| 하위 호환 (플로어에서 하드 에러 없음; 플로어 미만 어드바이저리) | ✅ Pass | L4 9/9 (ENH-368 경계 포함) |
| 비용 정확성 (Claude 5가 `unknown` 아님; fable $10/$50) | ✅ Pass | 분석 token-report 24/24; 라이브 fable 원장 경로 |
| No Silent Downgrade (fable가 핸들러 강등 통과) | ✅ Pass | I-2 화이트리스트 + 라이브 pdca-iterator가 sonnet 아닌 fable로 해석(L2b) |
| 보안 태세 (security-architect ≠ fable) | ✅ Pass | SEC-AF 55/55(L1-a) + 설계 §7 |
| 추적성 (R1 유지 + QA에서 재검증) | ✅ Pass | 본 QA 단계 라이브 프로브(L2/L2b/L3) |

---

## 6. 권장 사항

1. **Report 단계로 진행** (`/pdca report claude-model-alignment`) — 모든 QA 게이트 green.
2. **릴리스 단계 후속 작업** (QA 범위 밖): SC-6(push 시 GitHub Actions contract-check green) 확인 및 기존 초안 기반 SC-7 릴리스 노트 확정.
3. **버전**: `.claude-plugin/plugin.json`은 `2.1.24` 유지(`docs-code-sync` 기준 canonical) — `2.1.25` 헤딩은 잠정 라벨이며, 릴리스 버전은 메인테이너가 지정(레포 규칙).
4. **행동 관찰(조치 불필요)**: `sprint-report-writer`와 메인 세션 모두 적대적으로 구성된 introspection 프롬프트를 올바르게 거부했고, 중립적인 모델 해석 프롬프트에는 정상 응답. 바람직한 안전 동작이며 결함 아님 — 변경 불필요.
5. **헤드리스 MCP**: `bkit_pdca_status` 도구는 헤드리스(`claude -p`) 모드에서 명시적 allow-list가 필요. 예상된 CC 권한 동작; 향후 헤드리스 MCP 자동화 추가 시 문서화 권장.

---

## 판정

**QA_PASS** — 6/6 계층 green, 통과율 100%, critical 0, 실패 0. 모든 라이브 기능 계층(스킬 디스패치, MCP, 신규 Fable/Sonnet 5 핀에서의 에이전트 스폰)이 CC v2.1.198에서 모델 정렬 기능이 설계대로 동작함을 확인했으며, 이미 green인 정적/contract 스위트를 보완합니다.

---

## 버전 이력

| 버전 | 날짜 | 변경 사항 | 작성자 |
|---------|------|---------|--------|
| 0.1 | 2026-07-02 | 초기 QA 보고서 — green Check 스위트 위에 L1-L5 라이브 기능 계층; QA_PASS | qa-lead |
