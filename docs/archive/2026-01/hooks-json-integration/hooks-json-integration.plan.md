# hooks-json-integration Planning Document

> **Summary**: Skills/Agents의 `${CLAUDE_PLUGIN_ROOT}` hooks를 hooks.json으로 통합하여 GitHub Issue #9354 문제 해결
>
> **Project**: bkit-claude-code
> **Version**: 1.4.4
> **Author**: Claude
> **Date**: 2026-01-27
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

Skills(SKILL.md)와 Agents(*.md) 파일의 frontmatter에 정의된 hooks가 `${CLAUDE_PLUGIN_ROOT}` 변수를 사용하고 있으나, Claude Code의 알려진 버그(GitHub Issue #9354)로 인해 **Markdown 파일에서는 해당 변수가 빈 문자열로 확장**되어 스크립트 실행이 실패합니다.

이를 해결하기 위해 모든 hooks를 JSON 파일(`hooks/hooks.json`)로 통합하여 정상 작동을 보장합니다.

### 1.2 Background

**문제 상황:**
- `${CLAUDE_PLUGIN_ROOT}`는 JSON 설정 파일에서만 정상 작동
- Markdown frontmatter의 hooks에서는 빈 문자열로 확장됨
- GitHub Issue #9354 (OPEN 상태) - Claude Code 팀의 수정 대기 중

**영향 범위:**
- Skills: 11개 파일에서 hooks 사용
- Agents: 5개 파일에서 hooks 사용
- 총 22개 이상의 hook 정의가 영향받음

### 1.3 Related Documents

- GitHub Issue: https://github.com/anthropics/claude-code/issues/9354
- 공식 문서: https://code.claude.com/docs/en/hooks
- 이전 분석: `docs/04-report/claude-code-v2.1.20-update.report.md`

---

## 2. Scope

### 2.1 In Scope

- [x] Skills/Agents의 모든 hooks 수집 및 분석
- [ ] hooks.json에 통합 구조 설계
- [ ] Skill/Agent별 조건부 실행 로직 설계
- [ ] 마이그레이션 계획 수립
- [ ] 기존 SKILL.md/agents/*.md에서 hooks 제거

### 2.2 Out of Scope

- GitHub Issue #9354 직접 해결 (Claude Code 팀 담당)
- 새로운 hooks 스크립트 개발
- 기존 스크립트 로직 변경

---

## 3. 현황 분석

### 3.1 수집된 Skills Hooks (11개 파일)

| Skill | Event | Matcher | Script | Timeout |
|-------|-------|---------|--------|---------|
| **pdca** | Stop | `.*` | `pdca-skill-stop.js` | 10000 |
| **code-review** | Stop | `.*` | `code-review-stop.js` | 10000 |
| **phase-8-review** | Stop | - | `phase8-review-stop.js` | - |
| **claude-code-learning** | Stop | - | `learning-stop.js` | 5000 |
| **phase-9-deployment** | PreToolUse | `Bash` | `phase9-deploy-pre.js` | 5000 |
| **phase-9-deployment** | Stop | - | `phase9-deploy-stop.js` | 5000 |
| **phase-6-ui-integration** | PostToolUse | `Write` | `phase6-ui-post.js` | 5000 |
| **phase-6-ui-integration** | Stop | - | `phase6-ui-stop.js` | 5000 |
| **phase-5-design-system** | PostToolUse | `Write` | `phase5-design-post.js` | 5000 |
| **phase-5-design-system** | Stop | - | `phase5-design-stop.js` | 5000 |
| **phase-4-api** | Stop | - | `phase4-api-stop.js` | - |
| **bkit-rules** | PreToolUse | `Write\|Edit` | `pre-write.js` | 5000 |
| **bkit-rules** | PostToolUse | `Write` | `pdca-post-write.js` | 5000 |
| **zero-script-qa** | PreToolUse | `Bash` | `qa-pre-bash.js` | 5000 |
| **zero-script-qa** | Stop | - | `qa-stop.js` | 5000 |
| **development-pipeline** | Stop | `.*` | `echo '{"continue": false}'` | - |

### 3.2 수집된 Agents Hooks (5개 파일)

| Agent | Event | Matcher | Script | Timeout |
|-------|-------|---------|--------|---------|
| **gap-detector** | Stop | - | `gap-detector-stop.js` | 5000 |
| **pdca-iterator** | Stop | - | `iterator-stop.js` | 5000 |
| **code-analyzer** | PreToolUse | `Write\|Edit` | `code-analyzer-pre.js` | 5000 |
| **code-analyzer** | Stop | - | `analysis-stop.js` | 5000 |
| **design-validator** | PreToolUse | `Write` | `design-validator-pre.js` | 5000 |
| **qa-monitor** | PreToolUse | `Bash` | `qa-pre-bash.js` | 5000 |
| **qa-monitor** | PostToolUse | `Write` | `qa-monitor-post.js` | 5000 |
| **qa-monitor** | PostToolUse | `Bash` | `qa-monitor-post.js` | 5000 |
| **qa-monitor** | Stop | - | `qa-stop.js` | 5000 |

### 3.3 현재 hooks.json 구조

```json
{
  "SessionStart": [1 hook - session-start.js],
  "PreToolUse": [1 hook - pre-write.js (Write|Edit)],
  "PostToolUse": [2 hooks - pdca-post-write.js, skill-post.js],
  "UserPromptSubmit": [1 hook - user-prompt-handler.js],
  "PreCompact": [1 hook - context-compaction.js]
}
```

### 3.4 중복 분석

| Script | 사용처 | 중복 여부 |
|--------|--------|----------|
| `pre-write.js` | hooks.json, bkit-rules | 중복 (제거 가능) |
| `pdca-post-write.js` | hooks.json, bkit-rules | 중복 (제거 가능) |
| `qa-pre-bash.js` | zero-script-qa, qa-monitor | 중복 (통합 필요) |
| `qa-stop.js` | zero-script-qa, qa-monitor | 중복 (통합 필요) |
| `qa-monitor-post.js` | qa-monitor (2회) | 내부 중복 |

---

## 4. 통합 설계

### 4.1 설계 원칙

1. **조건부 실행**: 스크립트 내부에서 현재 활성 Skill/Agent 확인
2. **중복 제거**: 동일 스크립트는 hooks.json에 한 번만 등록
3. **하위 호환성**: 기존 동작 유지
4. **확장성**: 새로운 Skill/Agent 추가 시 스크립트만 수정

### 4.2 제안 hooks.json 구조

```json
{
  "$schema": "https://json.schemastore.org/claude-code-hooks.json",
  "description": "bkit Vibecoding Kit - Unified hooks (v1.4.4)",
  "hooks": {
    "SessionStart": [
      {
        "once": true,
        "hooks": [{
          "type": "command",
          "command": "node ${CLAUDE_PLUGIN_ROOT}/hooks/session-start.js",
          "timeout": 5000
        }]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [{
          "type": "command",
          "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/pre-write.js",
          "timeout": 5000
        }]
      },
      {
        "matcher": "Bash",
        "hooks": [{
          "type": "command",
          "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/unified-bash-pre.js",
          "timeout": 5000
        }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [{
          "type": "command",
          "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/unified-write-post.js",
          "timeout": 5000
        }]
      },
      {
        "matcher": "Bash",
        "hooks": [{
          "type": "command",
          "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/unified-bash-post.js",
          "timeout": 5000
        }]
      },
      {
        "matcher": "Skill",
        "hooks": [{
          "type": "command",
          "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/skill-post.js",
          "timeout": 5000
        }]
      }
    ],
    "Stop": [
      {
        "hooks": [{
          "type": "command",
          "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/unified-stop.js",
          "timeout": 10000
        }]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [{
          "type": "command",
          "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/user-prompt-handler.js",
          "timeout": 3000
        }]
      }
    ],
    "PreCompact": [
      {
        "matcher": "auto|manual",
        "hooks": [{
          "type": "command",
          "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/context-compaction.js",
          "timeout": 5000
        }]
      }
    ]
  }
}
```

### 4.3 통합 스크립트 설계

#### unified-stop.js (새로 생성)

```javascript
// 현재 활성 Skill/Agent에 따라 적절한 stop 로직 실행
const activeSkill = getActiveSkill(); // hook input에서 추출
const activeAgent = getActiveAgent();

const SKILL_HANDLERS = {
  'pdca': require('./pdca-skill-stop'),
  'code-review': require('./code-review-stop'),
  'phase-8-review': require('./phase8-review-stop'),
  'claude-code-learning': require('./learning-stop'),
  'phase-9-deployment': require('./phase9-deploy-stop'),
  'phase-6-ui-integration': require('./phase6-ui-stop'),
  'phase-5-design-system': require('./phase5-design-stop'),
  'phase-4-api': require('./phase4-api-stop'),
  'zero-script-qa': require('./qa-stop'),
};

const AGENT_HANDLERS = {
  'gap-detector': require('./gap-detector-stop'),
  'pdca-iterator': require('./iterator-stop'),
  'code-analyzer': require('./analysis-stop'),
  'qa-monitor': require('./qa-stop'),
};

// 활성 컴포넌트에 해당하는 핸들러 실행
```

#### unified-bash-pre.js (새로 생성)

```javascript
// Bash PreToolUse: phase-9, zero-script-qa, qa-monitor 통합
const activeSkill = getActiveSkill();
const activeAgent = getActiveAgent();

if (activeSkill === 'phase-9-deployment') {
  require('./phase9-deploy-pre').run();
}
if (activeSkill === 'zero-script-qa' || activeAgent === 'qa-monitor') {
  require('./qa-pre-bash').run();
}
```

#### unified-write-post.js (새로 생성)

```javascript
// Write PostToolUse: pdca, phase-5, phase-6, qa-monitor 통합
const activeSkill = getActiveSkill();
const activeAgent = getActiveAgent();

// 기본: PDCA post-write
require('./pdca-post-write').run();

// 추가 조건부 실행
if (activeSkill === 'phase-5-design-system') {
  require('./phase5-design-post').run();
}
if (activeSkill === 'phase-6-ui-integration') {
  require('./phase6-ui-post').run();
}
if (activeAgent === 'qa-monitor') {
  require('./qa-monitor-post').run();
}
```

---

## 5. 마이그레이션 계획

### 5.1 Phase 1: 통합 스크립트 생성

| Task | 설명 | 우선순위 |
|------|------|:--------:|
| unified-stop.js | Stop 이벤트 통합 핸들러 | High |
| unified-bash-pre.js | Bash PreToolUse 통합 | Medium |
| unified-write-post.js | Write PostToolUse 통합 | Medium |
| unified-bash-post.js | Bash PostToolUse 통합 | Low |

### 5.2 Phase 2: hooks.json 업데이트

1. 새로운 통합 hooks 추가
2. 중복 hooks 제거
3. 테스트 실행

### 5.3 Phase 3: SKILL.md/agents/*.md 정리

각 파일에서 `hooks:` frontmatter 제거:
- 해당 hooks는 hooks.json에서 관리됨을 주석으로 명시
- 또는 완전히 제거 (통합 스크립트가 조건부로 처리)

### 5.4 검증 계획

| 검증 항목 | 방법 | 기대 결과 |
|----------|------|----------|
| Stop hooks 실행 | 각 Skill/Agent 종료 시 로그 확인 | 적절한 핸들러 실행 |
| PreToolUse 실행 | Bash/Write 실행 시 로그 확인 | 조건부 로직 정상 작동 |
| PostToolUse 실행 | Write 완료 후 로그 확인 | 중복 없이 실행 |
| 기존 기능 호환성 | 전체 PDCA 사이클 테스트 | 모든 기능 정상 |

---

## 6. 리스크 및 완화

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 활성 Skill/Agent 감지 실패 | High | Medium | hook input 데이터 구조 사전 분석 |
| 스크립트 로딩 오류 | Medium | Low | try-catch로 개별 핸들러 격리 |
| 성능 저하 (모든 hook에서 조건 체크) | Low | Medium | 캐싱 및 early return 최적화 |
| 기존 동작 변경 | High | Low | 단계별 마이그레이션, 충분한 테스트 |

---

## 7. Success Criteria

### 7.1 Definition of Done

- [ ] 모든 통합 스크립트 작성 완료
- [ ] hooks.json 업데이트 완료
- [ ] SKILL.md/agents/*.md hooks 정리 완료
- [ ] 전체 기능 테스트 통과
- [ ] 문서 업데이트 완료

### 7.2 Quality Criteria

- [ ] 모든 기존 hooks 기능 유지
- [ ] 중복 실행 없음
- [ ] 오류 시 graceful degradation
- [ ] 로그로 실행 상태 추적 가능

---

## 8. 대안 검토

### Option A: 통합 스크립트 방식 (권장)

**장점:**
- hooks.json 단순화
- 조건부 로직 중앙 관리
- 확장성 우수

**단점:**
- 추가 스크립트 개발 필요
- 복잡한 조건 분기

### Option B: 개별 hooks.json 등록 방식

**장점:**
- 기존 스크립트 변경 없음
- 명확한 매핑

**단점:**
- hooks.json 비대화 (30+ 항목)
- 관리 복잡

### Option C: 이슈 #9354 수정 대기

**장점:**
- 코드 변경 최소화

**단점:**
- 수정 시점 불명확
- 현재 기능 장애 지속

**결정: Option A 채택** - 즉각적인 문제 해결과 장기적 유지보수성 확보

---

## 9. Next Steps

1. [ ] Design 문서 작성 (`hooks-json-integration.design.md`)
2. [ ] 팀 리뷰 및 승인
3. [ ] 구현 시작

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-01-27 | Initial draft | Claude |
