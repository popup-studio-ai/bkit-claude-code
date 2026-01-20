# bkit Clean Architecture Refactoring Plan

> **Document Type**: Refactoring Plan
> **Project**: bkit-claude-code
> **Version**: 1.3.1
> **Date**: 2026-01-20
> **Reference**: [[../03-analysis/05-clean-architecture-refactoring-analysis]]

---

## 1. Overview

### 1.1 Purpose

`.claude/` 폴더를 클린 아키텍처 원칙에 맞게 리팩토링하여:
- 범용성 확보 (다양한 프로젝트 구조 지원)
- 확장성 향상 (설정 기반 커스터마이징)
- 유지보수성 개선 (중복 제거, 일관성 확보)

### 1.2 Current State vs Design Intent (Gap Analysis Summary)

| Category | Design Intent | Current State | Gap |
|----------|--------------|---------------|-----|
| **Skills** | 17개 | 26개 | +9 (초과) |
| **Agents** | 10~11개 | 11개 | ✅ 일치 |
| **Commands** | 17~18개 | 18개 | ✅ 일치 |
| **Scripts** | Not specified | 16개 | 신규 추가 |
| **Instructions** | Deprecated | 8개 파일 존재 | 삭제 필요 |
| **Hardcoded paths** | 0개 | 1개 확인 | 수정 필요 |
| **Hook 중복** | 없음 | 2개 skill 중복 | 정리 필요 |

### 1.3 Architecture Compliance Summary

```
설계 문서 대비 구현 상태:
├── 00-ARCHITECTURE.md
│   ├── System Structure: ✅ 대체로 일치
│   ├── PDCA Workflow: ✅ 구현됨
│   └── User Journey Flow: ✅ SessionStart hook으로 구현
│
├── 02-BKIT-PLUGIN-DESIGN.md
│   ├── Plugin Structure: ✅ .claude-plugin/plugin.json 존재
│   ├── Commands Namespacing: ⚠️ 로컬은 prefix 없음 (정상)
│   ├── Hooks Format: ✅ settings.json에 정의됨
│   └── Skills Integration: ✅ bkit-rules, bkit-templates 존재
│
├── 03-BKIT-FEATURES.md
│   ├── PDCA Auto-Apply: ✅ hooks 통해 구현
│   ├── Level Detection: ✅ skill + script 구현
│   ├── Agent Auto-Trigger: ✅ description triggers 활용
│   └── Zero Script QA: ✅ skill + command 존재
│
└── Clean Architecture Violations:
    ├── Hardcoding: 1개 (select-template.sh)
    ├── Code Duplication: 2개소 (소스 디렉토리 체크)
    ├── Dead Code: 8개 (instructions/ 폴더)
    └── Hook Conflicts: 2개 skill 동일 hook 정의
```

### 1.4 Refactoring Principles

1. **설정 외부화**: 하드코딩 → config.json
2. **공통 라이브러리**: 중복 코드 → common.sh
3. **단일 책임**: 하나의 모듈 = 하나의 역할
4. **일관성**: Naming, 출력 포맷, 에러 처리 통일

---

## 2. Phase 1: Immediate Cleanup (즉시 정리)

### 2.1 Delete Unnecessary Files

| File | Reason | Priority |
|------|--------|----------|
| `.claude/instructions/` 폴더 전체 | Deprecated (v1.2.0), 8개 파일 | HIGH |
| `.claude/hooks/test-hook.md` | 테스트용 파일 | HIGH |
| Root의 `firebase-debug.log` | 디버그 로그 | LOW |

**실행 명령**:
```bash
# Instructions 폴더 삭제
rm -rf .claude/instructions/

# 테스트 hook 삭제
rm .claude/hooks/test-hook.md

# 동기화
./scripts/sync-folders.sh
```

### 2.2 Fix Hardcoded Paths

**File**: `.claude/scripts/select-template.sh` (Line 36)

```bash
# Before (개인 경로 포함)
PLUGIN_TEMPLATE_DIR="${CLAUDE_PROJECT_DIR:-/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code}/templates"

# After (범용 fallback)
PLUGIN_TEMPLATE_DIR="${CLAUDE_PROJECT_DIR:-.}/templates"
```

**File**: Root `scripts/select-template.sh` - 동일하게 수정

### 2.3 Sync Folders

```bash
./scripts/sync-folders.sh
```

---

## 3. Phase 2: Hook Conflict Resolution (Hook 충돌 해결)

### 3.1 Problem: Duplicate Hook Definitions

현재 **두 개의 skill**이 동일한 `PreToolUse(Write|Edit)` hook을 정의:

| Skill | Hook File | Purpose |
|-------|-----------|---------|
| `bkit-rules` | `pdca-pre-write.sh` | Design doc 체크 |
| `task-classification` | `task-classify.sh` | 작업 크기 분류 |

**문제점**: 둘 다 활성화되면 hook 실행 순서가 불명확하고, 중복 메시지 출력

### 3.2 Solution: Merge into Single Hook

**통합 스크립트**: `.claude/scripts/pre-write.sh`

```bash
#!/bin/bash
# scripts/pre-write.sh
# Purpose: Combined pre-write validation (PDCA + Task Classification)
# Replaces: pdca-pre-write.sh, task-classify.sh

set -e
source "$(dirname "$0")/lib/common.sh"

INPUT=$(cat)
parse_tool_input "$INPUT"

# Skip non-source files
if ! is_source_file "$FILE_PATH"; then
    output_empty
    exit 0
fi

# Task Classification
CONTENT_LENGTH=${#CONTENT}
CLASSIFICATION=""
PDCA_NOTICE=""

if [ "$CONTENT_LENGTH" -lt 50 ]; then
    CLASSIFICATION="Quick Fix"
elif [ "$CONTENT_LENGTH" -lt 200 ]; then
    CLASSIFICATION="Minor Change"
elif [ "$CONTENT_LENGTH" -lt 1000 ]; then
    CLASSIFICATION="Feature"
else
    CLASSIFICATION="Major Feature"
fi

# PDCA Document Check
FEATURE=$(get_feature_name "$FILE_PATH")
if [ -n "$FEATURE" ]; then
    DESIGN_DOC=$(find_design_doc "$FEATURE")
    if [ -n "$DESIGN_DOC" ]; then
        PDCA_NOTICE="Design doc: ${DESIGN_DOC}"
    elif [ "$CLASSIFICATION" != "Quick Fix" ] && [ "$CLASSIFICATION" != "Minor Change" ]; then
        PDCA_NOTICE="Consider: /pdca-design ${FEATURE}"
    fi
fi

# Output combined result
if [ -n "$PDCA_NOTICE" ]; then
    output_allow "Task: ${CLASSIFICATION} (${CONTENT_LENGTH} chars)\n${PDCA_NOTICE}"
else
    output_allow "Task: ${CLASSIFICATION} (${CONTENT_LENGTH} chars)"
fi
```

### 3.3 Update Skill Hooks

**`bkit-rules/SKILL.md`**: Hook 유지 (primary)
```yaml
hooks:
  PreToolUse:
    - matcher: "Write|Edit"
      hooks:
        - type: command
          command: "$CLAUDE_PROJECT_DIR/scripts/pre-write.sh"
```

**`task-classification/SKILL.md`**: Hook 제거
```yaml
# hooks 섹션 삭제 - bkit-rules에 통합됨
user-invocable: false
```

---

## 4. Phase 3: Common Library (공통 라이브러리)

### 4.1 Create Config File

**File**: `.claude/config/bkit.config.json`

```json
{
  "$schema": "./bkit.config.schema.json",
  "version": "1.2.1",

  "paths": {
    "docs": "docs",
    "plan": "01-plan",
    "design": "02-design",
    "analysis": "03-analysis",
    "features": "features"
  },

  "sourcePatterns": [
    "src/**",
    "lib/**",
    "app/**",
    "components/**",
    "pages/**",
    "features/**",
    "modules/**"
  ],

  "excludePatterns": [
    "node_modules/**",
    "dist/**",
    ".next/**",
    "coverage/**",
    "__tests__/**"
  ],

  "classification": {
    "quickFixMaxChars": 50,
    "minorChangeMaxChars": 200,
    "featureMaxChars": 1000
  },

  "levelDetection": {
    "enterprise": {
      "directories": ["kubernetes", "terraform", "k8s", "helm", "infra"],
      "files": ["docker-compose.prod.yml"]
    },
    "dynamic": {
      "directories": ["prisma", "api", "backend", "services"],
      "files": ["docker-compose.yml", ".env"],
      "packageKeywords": ["bkend", "@supabase", "firebase", "prisma"]
    }
  }
}
```

### 4.2 Create Common Library

**File**: `.claude/scripts/lib/common.sh`

```bash
#!/bin/bash
# scripts/lib/common.sh
# Purpose: Common functions for bkit scripts

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Config loading
CONFIG_FILE="${CLAUDE_PROJECT_DIR:-.}/.claude/config/bkit.config.json"
LOCAL_CONFIG="./bkit.config.json"

if [ -f "$LOCAL_CONFIG" ]; then
    BKIT_CONFIG="$LOCAL_CONFIG"
elif [ -f "$CONFIG_FILE" ]; then
    BKIT_CONFIG="$CONFIG_FILE"
else
    BKIT_CONFIG=""
fi

# Get config value with default
get_config() {
    local key=$1
    local default=$2
    if [ -z "$BKIT_CONFIG" ] || [ ! -f "$BKIT_CONFIG" ]; then
        echo "$default"
        return
    fi
    local value=$(jq -r "$key // empty" "$BKIT_CONFIG" 2>/dev/null)
    echo "${value:-$default}"
}

# Parse tool input from stdin
parse_tool_input() {
    local input=$1
    FILE_PATH=$(echo "$input" | jq -r '.tool_input.file_path // .tool_input.path // ""')
    CONTENT=$(echo "$input" | jq -r '.tool_input.content // .tool_input.new_string // ""')
    TOOL_NAME=$(echo "$input" | jq -r '.tool_name // ""')
}

# Check if file is a source file
is_source_file() {
    local file_path=$1
    local patterns="src/* lib/* app/* components/* pages/* features/* modules/*"

    for pattern in $patterns; do
        if [[ "$file_path" == $pattern ]]; then
            return 0
        fi
    done
    return 1
}

# Extract feature name from path
get_feature_name() {
    local file_path=$1
    local feature=$(echo "$file_path" | sed -n 's/.*features\/\([^\/]*\)\/.*$/\1/p')

    if [ -z "$feature" ]; then
        feature=$(basename "$(dirname "$file_path")")
    fi

    case "$feature" in
        src|lib|app|components|pages|features|modules|.)
            echo ""
            ;;
        *)
            echo "$feature"
            ;;
    esac
}

# Find design document for feature
find_design_doc() {
    local feature=$1
    local docs_path=$(get_config '.paths.docs' 'docs')
    local design_path=$(get_config '.paths.design' '02-design')

    local candidates=(
        "${docs_path}/${design_path}/features/${feature}.design.md"
        "${docs_path}/${design_path}/${feature}.design.md"
    )

    for doc in "${candidates[@]}"; do
        if [ -f "$doc" ]; then
            echo "$doc"
            return
        fi
    done
}

# Output functions for hooks
output_allow() {
    local message=$1
    if [ -z "$message" ]; then
        echo '{}'
    else
        cat << EOF
{"decision": "allow", "hookSpecificOutput": {"additionalContext": "$message"}}
EOF
    fi
}

output_block() {
    local reason=$1
    cat << EOF
{"decision": "block", "reason": "$reason"}
EOF
}

output_empty() {
    echo '{}'
}
```

### 4.3 Refactored Scripts Structure

```
.claude/scripts/
├── lib/
│   ├── common.sh          # 공통 함수
│   └── config.sh          # Config 로딩 (common.sh에 포함)
├── hooks/
│   ├── pre-write.sh       # 통합 PreToolUse hook
│   └── post-write.sh      # 통합 PostToolUse hook
├── utils/
│   ├── level-detect.sh    # 레벨 감지 유틸
│   └── template-select.sh # 템플릿 선택 유틸
└── phases/
    ├── phase2-pre.sh
    ├── phase4-stop.sh
    └── ...
```

---

## 5. Phase 4: Skill Consolidation (스킬 통합)

### 5.1 Current State: 26 Skills

| Category | Skills | Count |
|----------|--------|-------|
| Core Rules | bkit-rules, pdca-methodology, task-classification | 3 |
| Levels | starter, dynamic, enterprise | 3 |
| Phases | phase-1 ~ phase-9 | 9 |
| Support | development-pipeline, analysis-patterns, evaluator-optimizer, document-standards, bkit-templates | 5 |
| Platform | mobile-app, desktop-app, monorepo-architecture | 3 |
| Specialized | ai-native-development, level-detection, zero-script-qa | 3 |
| **Total** | | **26** |

### 5.2 Consolidation Plan: 26 → 18 Skills

| Action | Before | After | Reason |
|--------|--------|-------|--------|
| **MERGE** | bkit-rules + task-classification | bkit-core | 같은 hook 정의, 밀접한 관련 |
| **MERGE** | pdca-methodology + document-standards | pdca | 둘 다 PDCA 문서화 관련 |
| **MERGE** | analysis-patterns + evaluator-optimizer | analysis | 둘 다 Check 단계 관련 |
| **KEEP** | 9 phase skills | 9 phase skills | 각각 독립적 목적 |
| **KEEP** | 3 level skills | 3 level skills | 레벨별 분리 필요 |
| **KEEP** | bkit-templates | bkit-templates | 템플릿 관리 |
| **KEEP** | development-pipeline | development-pipeline | 파이프라인 가이드 |
| **KEEP** | level-detection | level-detection | 자동 레벨 감지 |
| **KEEP** | zero-script-qa | zero-script-qa | QA 전문 |
| **KEEP** | mobile-app, desktop-app | 2 platform skills | 플랫폼별 가이드 |
| **REVIEW** | ai-native-development | → docs로 이동 검토 | 참조 문서 성격 |
| **REVIEW** | monorepo-architecture | 유지 또는 통합 | 활용도 확인 필요 |

### 5.3 Target Structure (18 Skills)

```
skills/
├── core/
│   └── bkit-core/           # bkit-rules + task-classification
├── methodology/
│   ├── pdca/                # pdca-methodology + document-standards
│   └── analysis/            # analysis-patterns + evaluator-optimizer
├── levels/
│   ├── starter/
│   ├── dynamic/
│   └── enterprise/
├── phases/
│   ├── phase-1-schema/
│   ├── phase-2-convention/
│   ├── phase-3-mockup/
│   ├── phase-4-api/
│   ├── phase-5-design-system/
│   ├── phase-6-ui-integration/
│   ├── phase-7-seo-security/
│   ├── phase-8-review/
│   └── phase-9-deployment/
├── templates/
│   └── bkit-templates/
├── pipeline/
│   └── development-pipeline/
├── detection/
│   └── level-detection/
├── qa/
│   └── zero-script-qa/
└── platform/
    ├── mobile-app/
    └── desktop-app/
```

### 5.4 Trigger Keyword Deduplication

| Keyword | Assigned Skill | Remove From |
|---------|---------------|-------------|
| "PDCA", "계획", "설계" | bkit-core | pdca, task-classification |
| "code review", "quality" | analysis | bkit-core |
| "login", "authentication" | dynamic | phase-4-api |
| "deploy", "배포" | phase-9-deployment | enterprise |
| "QA", "test", "테스트" | zero-script-qa | analysis |

---

## 6. Phase 5: Consistency (일관성)

### 6.1 Script Naming Convention

**Pattern**: `{hook-type}-{domain}.sh` or `{domain}-{action}.sh`

| Current | Proposed | Reason |
|---------|----------|--------|
| `pdca-pre-write.sh` | `pre-write.sh` | 통합 hook |
| `task-classify.sh` | (삭제) | pre-write.sh에 통합 |
| `select-template.sh` | `template-select.sh` | 동사-명사 순서 통일 |
| `phase2-convention-pre.sh` | `phase2-pre.sh` | 간소화 |

### 6.2 Hook Output Format Standard

모든 hook 스크립트는 다음 형식 사용:

```json
// 허용 + 메시지
{"decision": "allow", "hookSpecificOutput": {"additionalContext": "Message"}}

// 허용 (메시지 없음)
{}

// 차단
{"decision": "block", "reason": "Reason"}
```

### 6.3 Error Handling Standard

```bash
#!/bin/bash
set -euo pipefail

# Dependency check
command -v jq >/dev/null 2>&1 || { echo '{}'; exit 0; }

# Input validation
INPUT=$(cat)
[ -z "$INPUT" ] && { echo '{}'; exit 0; }

# Main logic with error handling
{
    # ... script logic
} || {
    echo '{}' >&2
    exit 0
}
```

---

## 7. Implementation Schedule

### Week 1: Phase 1-2 (Cleanup & Hook Resolution)

| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | Phase 1: Cleanup | instructions/ 삭제, hardcode 수정 |
| 2 | Phase 2: Hook 통합 | pre-write.sh 작성 |
| 3 | Hook 테스트 | 통합 hook 검증 |
| 4-5 | 동기화 & 문서화 | sync-folders.sh 실행, README 업데이트 |

### Week 2: Phase 3 (Common Library)

| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | config/ 디렉토리 생성 | bkit.config.json |
| 2-3 | common.sh 작성 | lib/common.sh |
| 4-5 | 스크립트 리팩토링 | 16개 스크립트 수정 |

### Week 3: Phase 4 (Skill Consolidation)

| Day | Task | Deliverable |
|-----|------|-------------|
| 1-2 | Core skill 통합 | bkit-core (3→1) |
| 3-4 | Methodology 통합 | pdca, analysis (4→2) |
| 5 | 트리거 정리 | 키워드 중복 해소 |

### Week 4: Phase 5 & Testing

| Day | Task | Deliverable |
|-----|------|-------------|
| 1-2 | Naming 통일 | 스크립트/스킬 이름 변경 |
| 3-4 | 통합 테스트 | test-checklist 기준 검증 |
| 5 | 문서화 | CHANGELOG, README 업데이트 |

---

## 8. Success Criteria

| Metric | Current | Target | Measure |
|--------|---------|--------|---------|
| Skills 수 | 26개 | 18개 | 폴더 카운트 |
| 하드코딩 | 1개 | 0개 | `grep -r "popup-kay"` |
| Hook 중복 | 2개 skill | 0개 | SKILL.md hooks 섹션 확인 |
| Instructions | 8개 | 0개 | 폴더 삭제 확인 |
| 중복 코드 | 2개소 | 0개 | 코드 리뷰 |
| Config 커버리지 | 0% | 100% | 하드코딩 값 → config |

---

## 9. Risk & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| 기존 사용자 호환성 | HIGH | 마이그레이션 가이드 제공, CHANGELOG 명시 |
| Config 파일 누락 | MEDIUM | common.sh에 합리적인 기본값 포함 |
| Skill 통합 시 기능 손실 | HIGH | 통합 전 기능 매핑 검증, 테스트 체크리스트 |
| Hook 변경으로 인한 오류 | HIGH | 단계별 테스트, 롤백 계획 |

---

## 10. Checklist

### Phase 1: Immediate Cleanup
- [ ] `.claude/instructions/` 폴더 전체 삭제
- [ ] `.claude/hooks/test-hook.md` 삭제
- [ ] `scripts/select-template.sh` 개인 경로 수정 (both .claude/ and root)
- [ ] `sync-folders.sh` 실행

### Phase 2: Hook Conflict Resolution
- [ ] `scripts/lib/` 디렉토리 생성
- [ ] `scripts/lib/common.sh` 작성
- [ ] `scripts/pre-write.sh` 통합 hook 작성
- [ ] `bkit-rules/SKILL.md` hook 경로 수정
- [ ] `task-classification/SKILL.md` hooks 섹션 제거
- [ ] 기존 `pdca-pre-write.sh`, `task-classify.sh` 삭제 또는 보관

### Phase 3: Common Library
- [ ] `.claude/config/` 디렉토리 생성
- [ ] `bkit.config.json` 작성
- [ ] 나머지 스크립트에서 common.sh 사용
- [ ] 하드코딩된 값들 config로 이동

### Phase 4: Skill Consolidation
- [ ] bkit-core 통합 (bkit-rules + task-classification)
- [ ] pdca 통합 (pdca-methodology + document-standards)
- [ ] analysis 통합 (analysis-patterns + evaluator-optimizer)
- [ ] 트리거 키워드 정리
- [ ] ai-native-development 검토 (docs 이동 여부)
- [ ] monorepo-architecture 검토

### Phase 5: Consistency
- [ ] 스크립트 naming 통일
- [ ] Hook output format 통일
- [ ] Error handling 통일
- [ ] 문서 업데이트 (CHANGELOG, README)

---

## References

- [[../03-analysis/05-clean-architecture-refactoring-analysis]] - 분석 문서
- [[../03-analysis/04-codebase-comprehensive-gap-analysis]] - Gap 분석
- [[../../bkit-system/testing/test-checklist]] - 테스트 체크리스트
- [[../00-ARCHITECTURE]] - 아키텍처 설계
- [[../02-BKIT-PLUGIN-DESIGN]] - 플러그인 설계

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-20 | Initial plan based on analysis |
| 1.3.1 | 2026-01-20 | Comprehensive update with Gap analysis, Hook conflict resolution, detailed phases |
