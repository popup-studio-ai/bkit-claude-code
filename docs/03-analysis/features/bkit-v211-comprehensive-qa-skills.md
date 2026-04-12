# bkit v2.1.1 Skills 전체 QA 리포트

- **Feature**: bkit-v211-comprehensive-qa-skills
- **Scope**: `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/skills/` 하위 전체 SKILL.md
- **Date**: 2026-04-09
- **QA Lead**: bkit:qa-lead
- **Test Levels**: L1 (정적 검증) + L2 (의존성 / 체인) + L3 (호출 가능성)
- **L4-L5**: N/A (스킬 정적 자산 특성상 UX Flow / Data Flow 해당 없음)

---

## Skills QA Report

### Summary

| 항목 | 값 |
|------|-----|
| Total skills | 38 |
| L1 Pass | 36 / 38 |
| L1 Fail | 2 / 38 |
| L2 Pass (imports) | 38 / 38 imports 전부 존재 |
| L2 Pass (next-skill chain) | 15 / 15 체인 전부 유효 |
| L2 Pass (agent refs) | 49 / 50 (1 MISSING) |
| L3 (user-invocable) | 22 skills |
| L3 (auto-triggered) | 16 skills |
| Description 길이 | 최대 181자 / 38개 모두 250자 이내 PASS |
| name↔디렉토리 일치 | 38 / 38 PASS |
| Critical Issues | 2 |
| Warnings | 5 |

#### 수치 요약
- **L1 Pass Rate**: 36/38 = **94.7%** (pass 기준 ≥95% 미달)
- **Critical Count**: **2** (0 요구)
- **L1 필드 유효성 (필수 필드 존재)**: 37/38 = 97.4%
- **L1 agent 참조 유효성**: 49/50 = 98.0%

---

### Critical Issues (즉시 수정 필요)

#### C1. `claude-code-learning` — 존재하지 않는 agent 참조
- **File**: `skills/claude-code-learning/SKILL.md`
- **Line**: `agent: claude-code-guide` (frontmatter 내)
- **문제**: `agents/` 디렉토리에 `claude-code-guide.md` 파일이 존재하지 않음
- **영향**: 스킬이 agent 호출 시 런타임 실패
- **현재 존재하는 유사 agent**: 없음 (bkit:pipeline-guide, bkit:starter-guide 등으로 대체 가능할 수도 있으나 명칭 불일치)
- **권장 수정**:
  - Option A: `skills/claude-code-learning/SKILL.md` frontmatter의 `agent: claude-code-guide` 를 `agent: bkit:pipeline-guide` 또는 `agent: bkit:starter-guide` 로 교체
  - Option B: `agents/claude-code-guide.md` 를 신규 생성 (Claude Code 학습 전용 agent)
  - Option C: `agent:` 필드 제거하고 skill 단독 실행으로 전환

#### C2. `zero-script-qa` — 필수 필드 `allowed-tools` 누락
- **File**: `skills/zero-script-qa/SKILL.md`
- **Line**: 1~13 (frontmatter 전체)
- **문제**: bkit의 다른 37개 스킬은 모두 `allowed-tools` 명시. 본 스킬만 누락
- **현재 frontmatter**:
  ```yaml
  ---
  name: zero-script-qa
  classification: workflow
  classification-reason: Process automation persists regardless of model advancement
  deprecation-risk: none
  effort: high
  description: |
    Zero Script QA — test without scripts using structured JSON logging and Docker monitoring.
    Triggers: zero-script-qa, log testing, docker logs, QA, 제로 스크립트 QA.
  context: fork
  agent: bkit:qa-monitor
  user-invocable: true
  ---
  ```
- **영향**: CC 기본값에 의존하게 되어 도구 권한 경계가 불명확. 일관성 위반
- **추가 이슈**: `context: fork` 는 bkit 표준 frontmatter 필드가 아님 (비표준)
- **권장 수정**: `agent` 필드 뒤에 `allowed-tools` 블록 추가
  ```yaml
  allowed-tools:
    - Read
    - Write
    - Edit
    - Glob
    - Grep
    - Bash
  ```
  그리고 `context: fork` 필드 제거 또는 정식 표준화 논의 필요

---

### Warnings (권장 수정)

#### W1. `user-invocable` 필드 중복 선언 (4개 스킬)
- **Files**:
  - `skills/phase-4-api/SKILL.md`
  - `skills/phase-5-design-system/SKILL.md`
  - `skills/phase-7-seo-security/SKILL.md`
  - `skills/phase-9-deployment/SKILL.md`
- **문제**: frontmatter 내 `user-invocable: false` 가 2회씩 선언됨
- **영향**: YAML 파서가 마지막 값을 채택하므로 동작상 문제는 없으나 정합성 위반
- **권장 수정**: 중복 선언 제거, 1회만 유지

#### W2. `bkit-rules` frontmatter 내 주석 삽입
- **File**: `skills/bkit-rules/SKILL.md`
- **문제**: YAML frontmatter 내부에 `# hooks: Managed by hooks/hooks.json ...` 주석 포함
- **영향**: YAML 표준상 유효하지만 bkit 일관성 관점에서 가독성/파싱 안정성 저하
- **권장 수정**: 주석을 SKILL.md 본문(---블록 바깥)으로 이동 또는 제거
- **동일 패턴**: `skills/development-pipeline/SKILL.md` 에도 유사한 `# hooks:` 주석 존재

#### W3. `pdca` 스킬 agents 맵에 `null` 값 다수
- **File**: `skills/pdca/SKILL.md`
- **문제**: `agents.team: null`, `agents.pm: null`, `agents.default: null` 등 null agent 선언
- **영향**: 의도적인 값이면 허용 가능하나, skill 내부 로직에서만 사용되는 경우 주석 또는 YAML 키 제거가 명확함
- **권장 수정**: null agent는 제거하거나 skill 본문에 "내부 로직 처리" 주석 명시

#### W4. 다국어 trigger 키워드 커버리지 편차
- **범위**: 전체 38개 스킬
- **문제**: CLAUDE.md 의 "8-language auto-trigger keywords (EN, KO, JA, ZH, ES, FR, DE, IT)" 정책상, 주요 트리거 스킬은 8개 언어 키워드를 포함해야 함
- **현황**:
  - **완전 준수 (8언어)**: `deploy`, `qa-phase` (2건)
  - **EN+KO만 (2언어)**: 나머지 36개 스킬
- **영향**: 글로벌 서비스 지향 정책상 auto-trigger 가 한국어·영어 사용자에게만 최적화됨
- **권장 수정**: P1 — 주요 user-invocable 스킬 (pdca, plan-plus, pm-discovery, code-review, dynamic, enterprise, starter) 에 JA/ZH/ES/FR/DE/IT 트리거 점진적 추가
- **참고**: 이는 bkit 표준 위반이 아닌 "정책 편차"이므로 Critical이 아닌 Warning

#### W5. `zero-script-qa` 비표준 필드 `context: fork`
- **File**: `skills/zero-script-qa/SKILL.md`
- **문제**: bkit 표준 SKILL.md frontmatter 스키마에 `context` 필드 정의 없음
- **영향**: CC가 무시할 가능성 높음 (unknown field)
- **권장 수정**: 용도 확인 후 공식 스키마에 추가하거나 필드 제거

---

### Detailed Results

#### L1 — Frontmatter 정적 검증

| 검증 항목 | 결과 | 비고 |
|----------|------|------|
| name 필드 존재 | 38/38 PASS | 전부 명시 |
| description 필드 존재 | 38/38 PASS | 전부 명시 |
| description ≤ 250자 (CC v2.1.86 제약) | 38/38 PASS | 최대 181자 (enterprise), 최소 109자 (pdca-batch) |
| allowed-tools 존재 | **37/38 FAIL** | zero-script-qa 누락 (C2) |
| name ↔ 디렉토리명 일치 | 38/38 PASS | 모두 일치 |
| classification 필드 | 38/38 PASS | workflow / capability / hybrid |
| effort 필드 (v2.1.80) | 38/38 PASS | low / medium / high 모두 유효값 |

#### L2 — 의존성 / 체인 검증

| 검증 항목 | 결과 | 비고 |
|----------|------|------|
| imports 파일 존재 | **38/38 PASS** | 모든 `${PLUGIN_ROOT}/templates/...` 경로 실재 |
| next-skill 체인 유효 | **15/15 PASS** | 9-phase pipeline 체인 (phase-1 → phase-9) 정상, pdca/plan/design 전환 정상 |
| agent 참조 유효 | **49/50 FAIL** | claude-code-learning → claude-code-guide 누락 (C1) |

**next-skill 체인 상세**:
- `cc-version-analysis` → `pdca plan` ✅
- `dynamic` → `phase-1-schema` ✅
- `enterprise` → `phase-1-schema` ✅
- `phase-1-schema` → `phase-2-convention` → `phase-3-mockup` → `phase-4-api` → `phase-5-design-system` → `phase-6-ui-integration` → `phase-7-seo-security` → `phase-8-review` → `phase-9-deployment` ✅ (9-phase 완주)
- `plan-plus` → `pdca design` ✅
- `pm-discovery` → `pdca plan` ✅
- `qa-phase` → `pdca` ✅
- `starter` → `phase-1-schema` ✅

**agent 참조 매트릭스** (검증된 agent 목록):
bkend-expert, cc-version-researcher, bkit-impact-analyst, report-generator, code-analyzer, infra-architect, pipeline-guide, enterprise-expert, security-architect, cto-lead, gap-detector, pdca-iterator, qa-lead, qa-test-planner, qa-test-generator, qa-debug-analyst, qa-monitor, frontend-architect, design-validator, qa-strategist, pm-lead, starter-guide — 모두 `agents/*.md` 실존.

**유일한 누락**: `claude-code-guide` (skills/claude-code-learning 에서 참조) — agents/ 에 없음

#### L3 — 호출 가능성 (slash command)

| 구분 | 개수 | 예시 |
|------|------|------|
| user-invocable: true | 22 | pdca, plan-plus, pm-discovery, code-review, qa-phase, deploy, rollback, audit, btw, control, cc-version-analysis, claude-code-learning, desktop-app, development-pipeline, dynamic, enterprise, mobile-app, pdca-batch, skill-create, skill-status, starter, zero-script-qa |
| user-invocable: false | 16 | bkend-auth/cookbook/data/quickstart/storage (5), bkit-rules, bkit-templates, phase-1 ~ phase-9 (9) |

- CC Skills 2.0 자동 매핑에 의해 `user-invocable: true` 22개 스킬이 `/skill-name` 형태로 호출 가능
- `commands/` 디렉토리에 별도 등록 불필요 (plugin.json 기본 경로 자동 스캔)
- `plugin.json` 에 skills 경로 명시 없음 — CC 기본 동작 (`skills/` 디렉토리 자동 탐색) 의존

#### L4, L5 — N/A
스킬은 정적 마크다운 자산이므로 UX Flow / Data Flow 테스트 대상 아님. 해당 테스트 스킵.

---

### Pass Criteria 평가

| 기준 | 요구값 | 실제값 | 결과 |
|------|--------|--------|------|
| L1 Pass Rate ≥ 95% | 95% | 94.7% (36/38) | ❌ FAIL (-0.3%p) |
| Critical Count = 0 | 0 | 2 | ❌ FAIL |
| L2 imports 무결성 | 100% | 100% | ✅ PASS |
| L2 next-skill 체인 무결성 | 100% | 100% | ✅ PASS |
| L2 agent 참조 무결성 | ≥95% | 98.0% | ✅ PASS |
| description 길이 (≤250자) | 100% | 100% | ✅ PASS |
| name↔dir 일치 | 100% | 100% | ✅ PASS |

---

### Verdict: **QA_FAIL**

**근거**:
1. **Critical 2건 발생**: C1 (claude-code-learning agent 누락), C2 (zero-script-qa allowed-tools 누락)
2. **L1 Pass Rate 94.7%** — 기준 95% 미달 (0.3%p 부족)
3. 두 이슈 모두 수정 난이도 낮음 (각 파일 1~7 라인 수정)

**QA 통과 조건**:
- C1, C2 수정 후 재검증 시 L1 Pass Rate = 100% (38/38), Critical Count = 0 → **QA_PASS 전환 가능**

### 권장 Remediation (예상 소요: 5~10분)

1. **C1 수정** (`skills/claude-code-learning/SKILL.md`)
   - `agent: claude-code-guide` → `agent: bkit:pipeline-guide` 로 변경 (가장 보수적 선택)
   - 또는 `agents/claude-code-guide.md` 신규 생성

2. **C2 수정** (`skills/zero-script-qa/SKILL.md`)
   - `allowed-tools` 블록 추가 (Read, Write, Edit, Glob, Grep, Bash)
   - `context: fork` 필드 제거 또는 스키마 표준화

3. **W1 수정** (4개 phase-* 스킬)
   - 중복 `user-invocable: false` 1회 제거

4. **W2 수정** (bkit-rules, development-pipeline)
   - frontmatter 내 `# hooks: ...` 주석 → 본문으로 이동

5. **W3 수정** (pdca)
   - `agents.team/pm/default: null` 항목 제거

6. **W4 개선** (선택적, P1)
   - 핵심 user-invocable 스킬에 8언어 trigger 점진적 보강

7. **W5 수정** (zero-script-qa)
   - `context: fork` 필드 제거

### Chrome MCP Unavailable 고지
본 QA는 스킬 정적 자산 검증이므로 L3~L5 Chrome MCP 브라우저 테스트는 원천적으로 불필요합니다. 해당 레벨은 스킵으로 처리되었습니다.

---

### Artifacts
- **검증 대상 파일**: 38 SKILL.md (skills/*/SKILL.md)
- **참조 agent 파일**: 36 agents/*.md
- **참조 template 파일**: 38 imports 경로 (templates/**/*.md)

### Memory Note
차기 QA 사이클에서는 `lib/` 에 SKILL.md 정적 검증 스크립트 (scripts/qa/verify-skills.js) 추가 검토 권장. 본 QA의 awk/grep 검증 로직을 코드화하면 CI/CD hook 에서 자동 실행 가능.
