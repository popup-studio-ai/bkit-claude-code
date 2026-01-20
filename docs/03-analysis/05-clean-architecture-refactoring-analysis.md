# bkit Clean Architecture Refactoring Analysis

> **Analysis Type**: Clean Architecture Violation & Refactoring Target Analysis
> **Project**: bkit-claude-code
> **Date**: 2026-01-20
> **Updated**: 2026-01-20 (v1.1 - Verified with actual codebase)
> **Purpose**: .claude/ 폴더의 클린아키텍처 위반 사항, 중복, 불필요 파일 식별

---

## 1. Executive Summary

### 1.1 분석 범위

```
.claude/
├── agents/          (11 files)
├── commands/        (18 files)
├── skills/          (26 folders)
├── scripts/         (16 files)
├── templates/       (20+ files)
├── hooks/           (3 files)
├── instructions/    (deprecated)
├── docs/            (prompts)
└── settings.json
```

### 1.2 핵심 문제 요약

| Category | Issue Count | Severity |
|----------|-------------|----------|
| 하드코딩 (Hardcoding) | 14개 | HIGH |
| 중복 정의 (Duplication) | 8개 | HIGH |
| 불필요 파일 (Dead Code) | 5개 | MEDIUM |
| 일관성 부재 (Inconsistency) | 6개 | MEDIUM |
| 확장성 제한 (Low Extensibility) | 4개 | MEDIUM |

---

## 2. Clean Architecture Violations

### 2.1 Dependency Inversion Violation (의존성 역전 위반)

**원칙**: 상위 모듈은 하위 모듈에 의존하면 안 됨. 추상화에 의존해야 함.

**위반 사례**:

#### 2.1.1 Scripts의 하드코딩된 경로 의존

```bash
# pdca-pre-write.sh (Line 41-44)
DESIGN_DOC="docs/02-design/features/${FEATURE}.design.md"
DESIGN_DOC_ALT="docs/02-design/${FEATURE}.design.md"
PLAN_DOC="docs/01-plan/features/${FEATURE}.plan.md"
PLAN_DOC_ALT="docs/01-plan/${FEATURE}.plan.md"
```

**문제**: 경로가 하드코딩되어 다른 프로젝트 구조에서 동작 불가

#### 2.1.2 소스 디렉토리 하드코딩

```bash
# pdca-pre-write.sh, task-classify.sh (동일 패턴 반복)
if [[ ! "$FILE_PATH" == src/* ]] && \
   [[ ! "$FILE_PATH" == lib/* ]] && \
   [[ ! "$FILE_PATH" == app/* ]] && \
   [[ ! "$FILE_PATH" == components/* ]] && \
   [[ ! "$FILE_PATH" == pages/* ]]; then
```

**문제**:
- 동일 로직이 2개 스크립트에 중복
- Next.js/React 구조만 지원, 다른 프레임워크 미지원

#### 2.1.3 개인 경로 하드코딩

```bash
# select-template.sh (Line 36)
PLUGIN_TEMPLATE_DIR="${CLAUDE_PROJECT_DIR:-/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code}/templates"
```

**문제**: 개발자 로컬 경로가 fallback으로 포함됨

---

### 2.2 Single Responsibility Violation (단일 책임 위반)

**원칙**: 하나의 모듈은 하나의 책임만 가져야 함.

**위반 사례**:

#### 2.2.1 select-template.sh의 다중 책임

```bash
# select-template.sh가 담당하는 것들:
1. 프로젝트 레벨 감지 (Starter/Dynamic/Enterprise)
2. 템플릿 경로 결정
3. 프로젝트 메타데이터 추출 (name, version)
4. JSON 출력 포맷팅
```

**문제**: 레벨 감지 로직이 여러 곳에 분산됨

#### 2.2.2 Skills의 중복 책임

| Skill | 책임 | 중복 대상 |
|-------|------|-----------|
| bkit-rules | PDCA 규칙 | pdca-methodology |
| task-classification | 작업 분류 | bkit-rules의 일부 |
| level-detection | 레벨 감지 | select-template.sh |

---

### 2.3 Open/Closed Violation (개방/폐쇄 위반)

**원칙**: 확장에는 열려있고, 수정에는 닫혀있어야 함.

**위반 사례**:

#### 2.3.1 임계값 하드코딩

```bash
# task-classify.sh
QUICK_FIX_THRESHOLD=50       # < 50 chars
MINOR_CHANGE_THRESHOLD=200   # < 200 chars
FEATURE_THRESHOLD=1000       # < 1000 chars
```

**문제**: 임계값 변경 시 스크립트 수정 필요

#### 2.3.2 레벨 감지 조건 하드코딩

```bash
# select-template.sh
elif [ -d "kubernetes" ] || [ -d "terraform" ] || [ -d "k8s" ]; then
    LEVEL="Enterprise"
```

**문제**: 새 인프라 도구 추가 시 스크립트 수정 필요

---

## 3. Duplication Analysis (중복 분석)

### 3.1 스크립트 간 중복 코드

| Pattern | Files | Lines |
|---------|-------|-------|
| 소스 디렉토리 체크 | pdca-pre-write.sh, task-classify.sh | 5 lines each |
| jq 파싱 로직 | 모든 스크립트 | 2-3 lines each |
| JSON 출력 포맷 | 모든 스크립트 | heredoc pattern |

**중복 코드 예시**:
```bash
# 2개 스크립트에서 동일하게 반복
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // ""')
```

### 3.2 Skill 간 중복 정의

#### 3.2.1 PDCA 규칙 중복

```
locations where PDCA rules are defined:
├── skills/bkit-rules/SKILL.md         (Main)
├── skills/pdca-methodology/SKILL.md   (Duplicate concepts)
├── skills/task-classification/SKILL.md (Overlapping)
└── instructions/_DEPRECATED.md        (Legacy)
```

#### 3.2.2 트리거 키워드 중복

| Keyword | Skills with this trigger |
|---------|-------------------------|
| "로그인", "login" | dynamic, phase-4-api, bkend-expert |
| "배포", "deploy" | phase-9-deployment, enterprise |
| "QA", "테스트" | zero-script-qa, analysis-patterns |
| "PDCA" | bkit-rules, pdca-methodology, task-classification |

**문제**: 동일 키워드가 여러 skill을 활성화하여 예측 불가

### 3.3 Agent-Skill 중복

| Agent | Skill with same purpose |
|-------|------------------------|
| gap-detector | analysis-patterns |
| qa-monitor | zero-script-qa |
| pipeline-guide | development-pipeline |

---

## 4. Dead Code Analysis (불필요 파일)

### 4.1 확인된 불필요 파일

| File | Reason | Action |
|------|--------|--------|
| `.claude/instructions/_DEPRECATED.md` | 명시적 deprecated | DELETE |
| `.claude/hooks/test-hook.md` | 테스트용 | DELETE |
| `.claude/docs/prompts/analysis-prompts.md` | 미사용 | REVIEW |

### 4.2 중복으로 인한 통합 대상

| Keep | Delete/Merge |
|------|--------------|
| bkit-rules | pdca-methodology 내용 병합 후 삭제 검토 |
| task-classification | bkit-rules에 통합 검토 |

### 4.3 Root vs .claude 동기화 불일치

```
Root only (not in .claude):
├── scripts/sync-folders.sh      ← Infrastructure (OK)
├── scripts/validate-plugin.sh   ← Infrastructure (OK)

.claude only (not in root):
├── instructions/_DEPRECATED.md  ← Should delete
├── hooks/test-hook.md           ← Should delete
```

---

## 5. Inconsistency Analysis (일관성 분석)

### 5.1 Naming Convention 불일치

| Category | Pattern 1 | Pattern 2 |
|----------|-----------|-----------|
| Scripts | `pdca-pre-write.sh` | `task-classify.sh` |
| Scripts | `phase2-convention-pre.sh` | `qa-pre-bash.sh` |
| Skills | `phase-1-schema` | `starter` |
| Skills | `zero-script-qa` | `analysis-patterns` |

**권장**: `{domain}-{action}.sh`, `{phase}-{domain}` 통일

### 5.2 Hook Output Format 불일치

```bash
# Pattern A: Full JSON with decision
{"decision": "allow", "hookSpecificOutput": {"additionalContext": "..."}}

# Pattern B: Empty object
{}

# Pattern C: Just context (some scripts)
{"additionalContext": "..."}
```

### 5.3 Error Handling 불일치

```bash
# Some scripts
set -e  # Exit on error

# Other scripts
# No error handling

# Missing in all
# - Input validation
# - jq command existence check
# - Fallback for missing tools
```

### 5.4 Template Naming 불일치

```
templates/
├── plan.template.md           # Default
├── design.template.md         # Default
├── design-starter.template.md # Level-specific
├── design-enterprise.template.md # Level-specific
└── analysis.template.md       # No level variants
```

**문제**: 일부 템플릿만 레벨별 분리

---

## 6. Extensibility Issues (확장성 문제)

### 6.1 설정 외부화 부재

**현재**: 모든 설정이 스크립트 내부에 하드코딩

**필요**: `config.json` 또는 환경변수 기반 설정

```json
// 필요한 config.json 예시
{
  "paths": {
    "docs": "docs",
    "design": "02-design",
    "plan": "01-plan",
    "source": ["src", "lib", "app", "components", "pages"]
  },
  "thresholds": {
    "quickFix": 50,
    "minorChange": 200,
    "feature": 1000
  },
  "levelDetection": {
    "enterprise": ["kubernetes", "terraform", "k8s", "helm"],
    "dynamic": ["docker-compose.yml", "prisma", ".env"],
    "starter": []
  }
}
```

### 6.2 공통 함수 라이브러리 부재

**필요**: `scripts/lib/common.sh`

```bash
# 필요한 공통 함수들
is_source_file()
detect_project_level()
get_feature_name()
output_hook_response()
validate_input()
```

### 6.3 프레임워크 확장성 부재

**현재 지원**:
- Next.js (src/, app/, pages/)
- React (components/)

**미지원**:
- Vue (src/views/, src/store/)
- Angular (src/app/)
- Python (src/, lib/, app/)
- Go (cmd/, internal/, pkg/)

### 6.4 다국어 메시지 하드코딩

```bash
# 현재: 영어 메시지 하드코딩
"Task Classification: Quick Fix"
"PDCA Notice: This file belongs to..."

# 필요: i18n 지원
```

---

## 7. Refactoring Targets Summary

### 7.1 즉시 수정 (Immediate)

| # | Target | Action | Files |
|---|--------|--------|-------|
| 1 | 개인 경로 제거 | select-template.sh fallback 수정 | 1 |
| 2 | deprecated 파일 삭제 | _DEPRECATED.md, test-hook.md 삭제 | 2 |
| 3 | 중복 코드 추출 | common.sh 생성 | 1 (new) |

### 7.2 단기 수정 (Short-term)

| # | Target | Action | Files |
|---|--------|--------|-------|
| 4 | 설정 외부화 | config.json 생성 및 적용 | 5+ |
| 5 | Naming 통일 | 스크립트 명명 규칙 통일 | 16 |
| 6 | Error handling 통일 | 모든 스크립트에 일관된 에러 처리 | 16 |

### 7.3 중기 수정 (Medium-term)

| # | Target | Action | Files |
|---|--------|--------|-------|
| 7 | Skill 통합 | 26개 → 12~15개 | 26 → 12 |
| 8 | 트리거 정리 | 중복 키워드 해소 | 26 |
| 9 | 템플릿 정리 | 레벨별 템플릿 전략 통일 | 20 |

---

## 8. Recommended Architecture

### 8.1 Target Structure

```
.claude/
├── config/
│   └── bkit.config.json       # 중앙 설정 (NEW)
├── scripts/
│   ├── lib/
│   │   └── common.sh          # 공통 함수 (NEW)
│   ├── hooks/
│   │   ├── pre-write.sh       # 통합 pre-write hook
│   │   └── post-write.sh      # 통합 post-write hook
│   └── utils/
│       ├── level-detect.sh    # 레벨 감지 전용
│       └── template-select.sh # 템플릿 선택 전용
├── skills/                    # 12~15개로 통합
│   ├── core/                  # 핵심 (bkit-rules, pdca)
│   ├── phases/                # 9 phases
│   └── levels/                # Starter, Dynamic, Enterprise
├── agents/                    # 11개 유지
├── commands/                  # 18개 유지
├── templates/
│   ├── default/               # 기본 템플릿
│   └── levels/                # 레벨별 오버라이드
└── hooks/
    └── session-start.sh
```

### 8.2 Config-Driven Design

```json
// .claude/config/bkit.config.json
{
  "version": "1.2.1",
  "paths": {
    "docs": "docs",
    "design": "02-design",
    "plan": "01-plan",
    "analysis": "03-analysis",
    "sourcePatterns": ["src/**", "lib/**", "app/**"]
  },
  "classification": {
    "quickFixMaxChars": 50,
    "minorChangeMaxChars": 200,
    "featureMaxChars": 1000
  },
  "levels": {
    "enterprise": {
      "indicators": ["kubernetes/", "terraform/", "k8s/", "helm/"]
    },
    "dynamic": {
      "indicators": ["docker-compose.yml", "prisma/", ".env"]
    }
  },
  "i18n": {
    "default": "en",
    "supported": ["en", "ko", "ja", "zh"]
  }
}
```

---

## 9. Action Items

### Phase 1: Cleanup (1-2 hours)

- [ ] `_DEPRECATED.md` 삭제
- [ ] `test-hook.md` 삭제
- [ ] 개인 경로 제거 (select-template.sh)
- [ ] sync-folders.sh로 동기화

### Phase 2: Common Library (2-3 hours)

- [ ] `scripts/lib/common.sh` 생성
- [ ] 공통 함수 추출 (is_source_file, detect_level 등)
- [ ] 기존 스크립트에서 common.sh 사용하도록 수정

### Phase 3: Config Externalization (3-4 hours)

- [ ] `config/bkit.config.json` 생성
- [ ] 스크립트들이 config 읽도록 수정
- [ ] 하드코딩된 값들 config로 이동

### Phase 4: Skill Consolidation (4-6 hours)

- [ ] Skill 통합 계획 수립 (26 → 12~15)
- [ ] 중복 트리거 정리
- [ ] 테스트 및 검증

---

## 10. References

- [[04-codebase-comprehensive-gap-analysis]] - 기능 활용도 분석
- [[../bkit-system/triggers/trigger-matrix]] - 트리거 매트릭스
- [[../bkit-system/testing/test-checklist]] - 테스트 체크리스트

---

## 11. Design Document Compliance Verification

### 11.1 00-ARCHITECTURE.md Compliance

| Component | Design | Implementation | Status |
|-----------|--------|----------------|--------|
| System Structure | Auto-Apply + Runtime + On-Demand + Output layers | ✅ 구현됨 | PASS |
| PDCA Workflow | Plan → Design → Do → Check → Act | ✅ commands + agents로 구현 | PASS |
| User Journey | SessionStart → Options → Level Select → PDCA | ✅ session-start.sh hook | PASS |
| 18 Commands | Learning(4) + Init(3) + PDCA(7) + Pipeline(3) + QA(1) | ✅ 18개 존재 | PASS |
| 11 Agents | gap-detector, pdca-iterator 등 | ✅ 11개 존재 | PASS |
| 6 Templates | plan, design, analysis, report, _INDEX, CLAUDE | ✅ + 추가 템플릿 | PASS |

### 11.2 02-BKIT-PLUGIN-DESIGN.md Compliance

| Spec | Design | Implementation | Status |
|------|--------|----------------|--------|
| Plugin Manifest | `.claude-plugin/plugin.json` | ✅ 존재 (v1.2.0) | PASS |
| Instructions Integration | Skills로 통합 | ⚠️ instructions/ 아직 존재 | PARTIAL |
| Templates Integration | bkit-templates skill | ✅ 존재 | PASS |
| Hooks Format | `hooks/hooks.json` 또는 skill frontmatter | ✅ skill frontmatter 사용 | PASS |
| Path Portability | `$CLAUDE_PROJECT_DIR` 사용 | ⚠️ 1개 개인 경로 존재 | PARTIAL |

### 11.3 03-BKIT-FEATURES.md Compliance

| Feature | Design | Implementation | Status |
|---------|--------|----------------|--------|
| PDCA Auto-Apply | Hooks로 자동 적용 | ✅ bkit-rules skill hooks | PASS |
| Level Detection | CLAUDE.md + 파일 구조 감지 | ✅ level-detection skill | PASS |
| Agent Auto-Trigger | Description triggers | ✅ 모든 agents에 적용 | PASS |
| Task Classification | Quick Fix/Minor/Feature/Major | ✅ task-classification skill | PASS |
| Zero Script QA | Log-based QA | ✅ zero-script-qa skill + command | PASS |

### 11.4 Newly Identified Issues (Not in Original Design)

| Issue | Severity | Location | Action |
|-------|----------|----------|--------|
| Hook 중복 정의 | HIGH | bkit-rules + task-classification | 통합 필요 |
| Skills 초과 | MEDIUM | 26개 (설계 17개) | 통합 필요 |
| Skill 파일 크기 초과 | LOW | phase-6, zero-script-qa (700+ lines) | 500줄 이내 권장 |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-20 | Initial clean architecture analysis |
| 1.1 | 2026-01-20 | Added design document compliance verification, actual codebase verification |
