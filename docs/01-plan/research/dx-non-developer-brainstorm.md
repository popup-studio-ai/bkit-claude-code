# Developer Experience & Non-developer Accessibility Brainstorm

> **Date**: 2026-03-01
> **Architect**: Architecture Designer (bkit v1.5.8 CTO Team, Task #6)
> **Dependency**: Task #5 (Customization Abstraction Layer — Hybrid Layered 패턴 채택)
> **Purpose**: bkit 커스터마이징의 개발자/비개발자 경험 설계
> **Related**: `dx-accessibility-brainstorm.md` (상세 기술 설계 참조)

---

## 1. 현재 상태 진단

### 1.1 기존 bkit DX 현황

| 항목 | 현재 상태 | 문제점 |
|------|----------|--------|
| **스킬 수** | 27개 | `/` 메뉴에 모두 노출, 초보자에게 압도적 |
| **에이전트 수** | 16개 | 자동 트리거 기반, 사용자 제어 어려움 |
| **설정 파일** | bkit.config.json 1개 | 계층화 없음, 조직/개인 분리 불가 |
| **온보딩** | SessionStart에서 세션 카운트 기반 분기 | 일회성, 지속적 가이드 부재 |
| **커스터마이징** | 직접 파일 수정만 가능 | CLI 도구, 위저드, 검증 없음 |
| **비개발자 지원** | starter-guide 에이전트 + starter 스킬 | Starter 레벨로 고정, 역할별 분화 없음 |
| **문서** | PDCA 가이드, 학습 스타일 | 커스터마이징 가이드 부재 |

### 1.2 사용자 페르소나

| 페르소나 | 설명 | 현재 경험 | 목표 경험 |
|----------|------|----------|----------|
| **P1: 팀 리드 (개발자)** | bkit을 팀에 도입, 커스터마이징 담당 | config.json 직접 수정, 시행착오 | CLI 도구 + schema validation + 가이드 |
| **P2: 팀원 (개발자)** | 설정된 bkit 사용 | 기본 워크플로우 따름 | 팀 표준 자동 적용, 개인 선호 커스텀 |
| **P3: PM/기획자** | 기획서 작성, 요구사항 관리 | 사용 불가 (복잡도 장벽) | 자연어로 PDCA plan 단계 활용 |
| **P4: 디자이너** | 디자인 리뷰, 스펙 확인 | 사용 불가 | 디자인 관련 스킬만 노출 |
| **P5: QA 엔지니어** | 테스트 전략, 품질 확인 | 일부 스킬 사용 | QA 관련 워크플로우 최적화 |
| **P6: 조직 관리자** | 전사 표준 수립, 정책 배포 | 지원 없음 | 조직 템플릿 + 정책 배포 도구 |

---

## 2. 개발자 커스터마이징 경험 (DX)

### 2.1 커스터마이징 진입점 — 3가지 경로

```
경로 A: CLI 스킬 (추천, 가장 빠름)
  /bkit-config                    → 현재 설정 확인/변경
  /bkit-config mode expert        → 모드 변경
  /bkit-config team.maxTeammates 5 → 특정 설정 변경
  /bkit-config --validate         → 설정 유효성 검증
  /bkit-config --diff             → 기본값 대비 변경 사항
  /bkit-config --reset            → 기본값으로 초기화

경로 B: 파일 직접 편집 (유연함)
  bkit.config.json                → 프로젝트 설정 (git 추적)
  .bkit/local.config.json         → 개인 설정 (gitignored)
  ~/.bkit/org.config.json         → 조직 설정

경로 C: 템플릿 초기화 (새 프로젝트)
  /bkit-init                      → 대화형 위저드
  /bkit-init --template startup   → 템플릿 지정
  /bkit-init --create-template    → 현재 설정을 템플릿으로 내보내기
```

**CC 워크플로우와의 통합**: bkit의 설정 도구는 CC 네이티브 메커니즘 위에 동작. `/bkit-config`는 SKILL.md 기반 CC 스킬이므로 CC의 permission 시스템, 자동완성, 도움말 인프라를 그대로 활용.

### 2.2 /bkit-config 스킬 — 자동완성 + 검증 + 프리뷰

```yaml
---
name: bkit-config
description: |
  bkit 설정을 조회하고 변경합니다.
  현재 4-layer 설정 상태를 보여주고, 프로젝트/개인 설정을 수정합니다.

  Triggers: bkit 설정, config, 설정 변경, 설정 확인, 구성 변경,
  bkit設定, 配置, configuración, configuration, Konfiguration, configurazione

argument-hint: "[key] [value] | --show | --reset | --validate"
user-invocable: true
disable-model-invocation: true
allowed-tools:
  - Read
  - Write
  - Edit
---
```

**자동완성**: `$ARGUMENTS`에서 key path 자동 완성
```
/bkit-config pdca.         → matchRateThreshold, maxIterations, autoIterate, ...
/bkit-config customization.  → mode, role, costProfile, skills, agents, ...
/bkit-config team.         → enabled, maxTeammates, ctoAgent, ...
```

**검증 (--validate)**:
```
bkit Configuration Validation
==============================
Layer 0 (bkit-defaults): OK
Layer 1 (org):           Not configured
Layer 2 (project):       OK (bkit.config.json)
  - pdca.matchRateThreshold: 90 (valid, range: 0-100)
  - team.maxTeammates: 5 (valid, range: 1-10)
  - customization.mode: "expert" (valid)
Layer 3 (personal):      Not configured

Merged Result: VALID
Warnings:
  - 27 skills active (budget: ~15,200 / 16,000 chars).
    Consider disabling unused skills.
```

**프리뷰 (--diff)**:
```
Changes from bkit defaults:
  + customization.mode: "auto" → "expert"
  + pdca.matchRateThreshold: 90 → 95
  + team.maxTeammates: 5 → 3
  (3 overrides in bkit.config.json)
```

### 2.3 /bkit-init — 대화형 위저드

```yaml
---
name: bkit-init
description: |
  프로젝트에 bkit 커스터마이징을 초기화합니다.
  대화형 위저드 또는 템플릿 기반으로 설정 파일을 생성합니다.

argument-hint: "[--template name] | [--wizard] | [--create-template name]"
user-invocable: true
disable-model-invocation: true
---
```

**대화형 위저드 플로우**:
```
/bkit-init

Step 1/5: 환경 감지
  [auto] 프로젝트 타입: Next.js (package.json 감지)
  [auto] CC 버전: v2.1.63
  [auto] 기존 bkit.config.json: 없음

Step 2/5: 팀 규모
  1) 개인 (solo)
  2) 소규모 2-5명 (startup)
  3) 중규모 5-10명 (fullstack)
  4) 대규모 10명+ (enterprise)
  → 선택: [사용자 입력]

Step 3/5: 주요 역할
  1) 개발자만
  2) 개발자 + PM/기획자
  3) 풀스택 팀 (개발+디자인+QA)
  4) 비개발자 포함 팀
  → 선택: [사용자 입력]

Step 4/5: PDCA 강도
  1) 간소화 (matchRate 80%, 자동 전환)
  2) 표준 (matchRate 90%, 반자동)
  3) 엄격 (matchRate 95%, 수동 확인)
  → 선택: [사용자 입력]

Step 5/5: 언어
  1) 한국어 (기본)
  2) English
  3) 日本語
  4) 기타
  → 선택: [사용자 입력]

설정 파일 생성 완료:
  bkit.config.json (프로젝트 설정)
  .bkit/local.config.json.example (개인 설정 예시)
  .gitignore 업데이트 완료

시작하려면 원하는 작업을 자연어로 입력하세요!
```

### 2.4 Config Schema Validation

`bkit.config.schema.json`에 `customization` 섹션 추가:

```json
{
  "customization": {
    "type": "object",
    "properties": {
      "mode": {
        "enum": ["guide", "expert", "auto"],
        "default": "auto",
        "description": "사용자 경험 모드"
      },
      "role": {
        "enum": ["developer", "pm", "designer", "qa", "lead"],
        "default": "developer",
        "description": "사용자 역할 (노출 스킬 필터링)"
      },
      "costProfile": {
        "enum": ["quality", "balanced", "economy"],
        "default": "balanced",
        "description": "에이전트 모델 비용 프로필"
      },
      "skills": {
        "type": "object",
        "properties": {
          "disable": {
            "type": "array",
            "items": { "type": "string" },
            "description": "비활성화할 스킬 이름 목록"
          }
        }
      },
      "agents": {
        "type": "object",
        "properties": {
          "overrides": {
            "type": "object",
            "description": "에이전트별 속성 오버라이드"
          }
        }
      }
    }
  }
}
```

---

## 3. 비개발자 경험 설계

### 3.1 guide / expert / auto 모드 상세 설계

| 측면 | guide 모드 | expert 모드 | auto 모드 |
|------|-----------|------------|----------|
| **대상** | 비개발자, 초보자, PM, 디자이너 | 숙련 개발자 | 모든 사용자 (기본) |
| **SessionStart** | 상세 안내 (15-20줄, 역할별 맞춤) | 최소 안내 (3-5줄) | 중간 (5-10줄) |
| **스킬 실행** | 단계별 안내, 확인 요청, 선택지 제시 | 즉시 실행, 최소 설명 | 의도 분류 결과에 따라 동적 전환 |
| **에러 발생** | 원인 + 해결방법 + 예시 | 에러 코드 + 간단 설명 | 상황에 따라 |
| **PDCA 전환** | 다음 단계 설명 + 선택지 | 자동 전환 | 컨텍스트 기반 |
| **스킬 추천** | 현재 상황 기반 3개 추천 | 추천 없음 | 필요 시 1개 추천 |
| **출력 스타일** | bkit-learning (학습 중심) | bkit-pdca-guide (효율 중심) | 레벨 기반 자동 |
| **용어** | 일상 언어, 비유 사용 | 기술 용어 직접 사용 | 상황 판단 |

**auto 모드 동작 원리**:
```
UserPromptSubmit 훅에서:
  1. 의도 분류 엔진이 사용자 입력 분석
  2. 기술적 복잡도 판단 (코드 키워드, CLI 명령어, 전문 용어 유무)
  3. 복잡도 높으면 → expert 스타일 응답
  4. 복잡도 낮으면 → guide 스타일 응답
  5. SessionStart에서 이전 세션 패턴 기반 초기 모드 추천
```

### 3.2 역할 기반 프리셋 (Role Presets)

```json
{
  "customization": {
    "mode": "guide",
    "role": "pm"
  }
}
```

| Role | 노출 스킬 | 숨김 스킬 | 기본 에이전트 | 출력 스타일 |
|------|----------|----------|-------------|------------|
| **developer** (기본) | 전체 27개 | 없음 | auto (레벨 기반) | auto |
| **pm** | pdca, plan-plus, code-review, bkit-rules, bkit-templates | pipeline phases (1-9), bkend-*, desktop/mobile-app | product-manager | bkit-learning |
| **designer** | pdca (design focus), bkit-templates, code-review | bkend-*, pipeline phases, zero-script-qa, enterprise | design-validator | bkit-learning |
| **qa** | zero-script-qa, code-review, pdca (check focus) | bkend-*, starter, desktop/mobile-app | qa-strategist | bkit-pdca-guide |
| **lead** | 전체 27개 | 없음 | cto-lead | bkit-pdca-guide |

**구현 방식** (SessionStart 훅):
```javascript
// hooks/session-start.js에 추가
const role = getConfig('customization.role', 'developer');
const ROLE_HIDDEN_SKILLS = {
  pm: ['phase-1-schema', 'phase-2-convention', ..., 'bkend-auth', ...],
  designer: ['bkend-auth', 'bkend-data', ..., 'zero-script-qa', ...],
  qa: ['bkend-auth', ..., 'starter', 'desktop-app', 'mobile-app'],
  developer: [],
  lead: [],
};
const hidden = ROLE_HIDDEN_SKILLS[role] || [];
if (hidden.length > 0) {
  // context에 주입: "다음 스킬은 현재 역할에서 사용하지 않습니다: ..."
  // soft hide: 사용자가 명시적으로 요청하면 사용 가능
}
```

### 3.3 자연어 기반 워크플로우 트리거

기존 의도 분류 엔진 (`lib/intent/language.js`)의 확장:

```
PM 자연어 패턴 (8개 언어):
  ko: "기획서 작성해줘", "요구사항 정리", "스프린트 리뷰"
  en: "write a spec", "organize requirements", "sprint review"
  ja: "企画書を書いて", "要件を整理", "スプリントレビュー"
  → /pdca plan | /pdca check | /pdca report 자동 라우팅

디자이너 자연어 패턴:
  ko: "UI 스펙 확인", "디자인 가이드라인", "컴포넌트 정리"
  en: "check UI spec", "design guidelines", "component list"
  → /pdca design → design-validator 에이전트 자동 위임

QA 자연어 패턴:
  ko: "테스트 케이스 작성", "버그 리포트", "품질 확인"
  en: "write test cases", "bug report", "quality check"
  → /zero-script-qa | /code-review 자동 라우팅
```

**라우팅 우선순위**:
1. 명시적 슬래시 명령 (`/pdca plan`) → 직접 실행
2. 역할 기반 자연어 매칭 → 관련 스킬 추천 + 확인
3. 범용 의도 분류 → 기존 bkit 로직

### 3.4 온보딩 경험 설계

#### 3.4.1 첫 세션 (sessionCount === 1)

**guide 모드 (비개발자)**:
```
bkit Vibecoding Kit에 오신 것을 환영합니다!

현재 모드: guide (단계별 안내)
역할: PM

할 수 있는 주요 작업:
  "기획서 작성해줘"     → 프로젝트 기획 문서 생성
  "진행 상황 정리해줘"  → 현재 상태 보고서 생성
  "설계 리뷰 부탁해"    → 설계 문서 검토

명령어로도 사용 가능합니다:
  /pdca plan    — 기획 단계
  /pdca check   — 확인 단계
  /pdca report  — 보고서 생성
  /bkit-help    — 도움말

자연어로 바로 요청하셔도 됩니다!
```

**expert 모드 (개발자)**:
```
bkit v1.5.8 | mode: expert | level: Dynamic
Skills: 27 | Agents: 16 | Hooks: 10/17
PDCA: matchRate 90% | team: 5 max
/bkit-config --help for configuration
```

#### 3.4.2 학습 곡선 최소화 전략

| 단계 | 세션 수 | 제공 경험 |
|------|:-------:|----------|
| **Discovery** | 1-3 | 핵심 스킬 3개만 소개, 자연어 입력 유도 |
| **Adoption** | 4-10 | 추가 스킬 점진적 소개, PDCA 사이클 안내 |
| **Proficiency** | 11-30 | 고급 기능 소개 (팀, 파이프라인, 커스터마이징) |
| **Mastery** | 30+ | expert 모드 전환 제안, 커스텀 스킬 작성 안내 |

구현: SessionStart 훅에서 `sessionCount` 기반 분기 (기존 로직 확장)

#### 3.4.3 점진적 기능 노출 (Progressive Disclosure)

```
세션 1-3 (Discovery):
  "팁: /pdca로 기획서를 작성할 수 있어요."

세션 4-10 (Adoption):
  "팁: /code-review로 코드 품질을 검토할 수 있어요."
  "팁: PDCA의 Check 단계에서 /zero-script-qa로 테스트 전략을 짤 수 있어요."

세션 11-30 (Proficiency):
  "팁: /bkit-config team.enabled true로 CTO Team을 활성화해보세요."
  "팁: /bkit-config mode expert로 전문가 모드를 사용해보세요."

세션 30+ (Mastery):
  "팁: /bkit-new-skill로 프로젝트 전용 스킬을 만들 수 있어요."
```

---

## 4. 사용 시나리오별 설계

### 시나리오 A: 신규 조직 온보딩 — "우리 팀에 bkit 도입하려면?"

**대상 페르소나**: P1 (팀 리드) + P6 (조직 관리자)

**Step-by-Step 여정**:

```
1. 팀 리드가 bkit 플러그인 설치
   $ claude /install bkit
   → CC가 bkit 플러그인 설치 + 활성화

2. 초기 설정 위저드 실행
   /bkit-init --wizard
   → 팀 규모, 역할 구성, PDCA 강도, 언어 선택
   → bkit.config.json + .bkit/ 디렉토리 자동 생성

3. 조직 표준 설정 (선택적)
   /bkit-init --create-template acme-corp
   → 현재 설정을 조직 템플릿으로 내보내기
   → ~/.bkit/org.config.json에 조직 기본값 저장

4. 팀원 온보딩
   팀 리드가 bkit.config.json을 git commit/push
   → 팀원이 pull하면 자동 적용
   → 각 팀원은 .bkit/local.config.json으로 개인 설정 추가 가능

5. 비개발자 팀원 온보딩
   bkit.config.json에 역할 프리셋 안내:
   "PM 팀원은 .bkit/local.config.json에 role: pm 설정하세요"
   → guide 모드 + PM 역할 → 필요한 스킬만 노출
```

**필요한 bkit 기능**:
- `/bkit-init` 위저드 (Phase 2)
- 4-layer config merge (Task #5 Hybrid Layered)
- `customization.role` 프리셋 (Phase 1)

**타임라인**: 팀 리드 15분, 팀원 각 5분

---

### 시나리오 B: 프로젝트 셋업 — "이 프로젝트에 bkit 적용하려면?"

**대상 페르소나**: P1 (팀 리드), P2 (팀원)

**Step-by-Step 여정**:

```
1. 프로젝트 디렉토리에서 bkit 초기화
   /bkit-init --template fullstack
   → 풀스택 팀 프리셋 적용
   → bkit.config.json, .claude/rules/bkit-workflow.md 생성

2. 프로젝트 맞춤 설정 조정
   /bkit-config pdca.matchRateThreshold 95    → PDCA 기준 상향
   /bkit-config team.maxTeammates 3           → 팀 규모 조정
   /bkit-config customization.skills.disable '["phase-6-ui", "mobile-app"]'
   → 사용하지 않는 스킬 비활성화

3. 프로젝트 CLAUDE.md 연동
   /bkit-init이 .claude/CLAUDE.md에 bkit 가이드 @import 자동 추가:
   "See @bkit-plugin/CLAUDE.md for bkit workflow guidelines."

4. PDCA 시작
   "이 프로젝트의 사용자 인증 기능을 기획해줘"
   → /pdca plan 자동 트리거
   → docs/01-plan/features/user-auth.plan.md 생성

5. 팀 협업
   /bkit-config team.enabled true
   → CTO Team 패턴 활성화
   → "팀을 구성해서 설계 리뷰를 진행해줘" → cto-lead 에이전트 트리거
```

**키 인사이트**: 프로젝트 셋업은 `bkit.config.json` + `.claude/` 디렉토리만으로 완결. 외부 의존성 없음.

---

### 시나리오 C: 개인 커스텀 — "내 워크플로우에 맞게 조정하려면?"

**대상 페르소나**: P2 (팀원), P5 (QA 엔지니어)

**Step-by-Step 여정**:

```
1. 개인 설정 파일 생성
   /bkit-config --personal mode expert
   → .bkit/local.config.json 생성 (자동 gitignored)

2. 개인 선호 설정
   /bkit-config --personal customization.role qa
   /bkit-config --personal automation.supportedLanguages '["ko", "en"]'

3. 개인 스킬 추가 (선택적)
   /bkit-new-skill my-qa-checklist --scope personal
   → ~/.claude/skills/my-qa-checklist/SKILL.md 생성
   → 모든 프로젝트에서 /my-qa-checklist 사용 가능

4. 에이전트 모델 변경 (비용 절감)
   /bkit-config --personal customization.costProfile economy
   → 개인 세션에서만 economy 프로필 적용
   → 팀 설정은 변경하지 않음

5. 설정 확인
   /bkit-config --show layers
   → Layer 0 (bkit-defaults): {...}
   → Layer 2 (project): {...}
   → Layer 3 (personal): { mode: "expert", role: "qa", costProfile: "economy" }
   → Merged: {...}
```

**키 인사이트**: 개인 설정은 `--personal` 플래그로 `.bkit/local.config.json`에 격리. 팀 설정에 영향 없음.

---

### 시나리오 D: 비개발자 첫 사용 — "코딩 모르는데 AI로 업무하려면?"

**대상 페르소나**: P3 (PM/기획자), P4 (디자이너)

**Step-by-Step 여정**:

```
1. 팀 리드가 사전 설정 (시나리오 A에서 완료)
   bkit.config.json에 customization.mode: "guide" 설정됨

2. PM이 처음 Claude Code 실행
   → SessionStart 훅이 guide 모드 감지
   → 역할 설정 안내:
     "안녕하세요! 역할을 선택해주세요:
      1) PM/기획자  2) 디자이너  3) QA  4) 개발자"
   → PM 선택 시 .bkit/local.config.json에 role: pm 저장

3. 첫 번째 작업 요청 (자연어)
   "다음 분기 신규 기능 기획서를 작성해줘"

   bkit 응답 (guide 모드):
   ═══════════════════════════════════
   기획서 작성을 시작합니다!

   다음 정보가 필요해요:
   1. 기능 이름: (예: "사용자 알림 시스템")
   2. 주요 목표: (예: "사용자 참여율 30% 향상")
   3. 대상 사용자: (예: "월간 활성 사용자")
   4. 예상 일정: (예: "Q2 2026")

   하나씩 알려주시면 기획서 초안을 작성해 드릴게요.
   한 번에 모두 알려주셔도 됩니다!
   ═══════════════════════════════════

4. PM이 정보 제공
   "알림 시스템이야. 푸시 알림이랑 이메일 알림 두 가지.
    이번 분기 안에 끝내야 해."

   → bkit이 자동으로:
     - 기능명: notification-system
     - docs/01-plan/features/notification-system.plan.md 생성
     - 기획서 초안 작성 + PM에게 확인 요청

5. 후속 작업
   "진행 상황 확인해줘"
   → /pdca check 자동 라우팅
   → 현재 PDCA 상태 + 다음 단계 안내

6. 디자인 리뷰 요청
   "디자인팀에 리뷰 요청할 설계서 만들어줘"
   → /pdca design 자동 라우팅
   → 설계 문서 초안 + design-validator 에이전트 자동 위임
```

**키 인사이트**:
- 슬래시 명령어를 모르는 비개발자도 자연어로 모든 기능 접근 가능
- guide 모드가 단계별로 정보를 수집하여 복잡도를 숨김
- PDCA 문서 경로, 파일 형식 등 기술적 세부사항은 자동 처리

---

## 5. 스킬 작성 경험 (Skill Authoring DX)

### 5.1 커스텀 스킬 생성 흐름

```
/bkit-new-skill deploy-check

→ 질문 1: 스킬 범위? [project] / personal
→ 질문 2: 템플릿? [basic] / advanced / agent-delegating
→ 생성: .claude/skills/deploy-check/SKILL.md
→ 안내: "SKILL.md를 편집한 후 /deploy-check로 테스트하세요."
```

### 5.2 SKILL.md 템플릿 (자동 생성)

```yaml
---
name: deploy-check
description: |
  [이 스킬이 하는 일을 설명하세요]

  Triggers: [트리거 키워드들 — 최소 한국어+영어]

  Do NOT use for: [부적절한 상황]

argument-hint: "[arguments]"
user-invocable: true
# disable-model-invocation: true
# context: fork
# agent: bkit:code-analyzer
allowed-tools:
  - Read
  - Write
  - Edit
---

## Instructions

[Claude가 따를 지침]

### Input
$ARGUMENTS

### Steps
1. [단계]

### Output
[출력 형식]
```

### 5.3 스킬 로컬 테스트

CC 네이티브 hot reload를 활용한 즉시 테스트 경험:

```
1. SKILL.md 저장 → CC가 자동 감지
2. /deploy-check 실행 → 즉시 테스트
3. 수정 → 재실행 → 반복 (restart 불필요)

검증 (/bkit-config --validate):
  - YAML frontmatter 문법
  - name 형식 (lowercase, hyphens, max 64 chars)
  - description 길이 경고 (>500 chars → 예산 영향)
  - allowed-tools 유효성
  - agent 참조 존재 확인
```

### 5.4 스킬 공유

```
팀 내 (프로젝트 스킬):
  .claude/skills/my-skill/ → git commit → git push
  → 팀원 pull 시 자동 적용

조직 내 (개인 → 조직):
  방법 1: ~/.claude/skills/에 symlink
  방법 2: 조직 extension plugin으로 패키징
  방법 3: CC Marketplace 등록 (향후)
```

---

## 6. 에이전트 커스터마이징 경험

### 6.1 에이전트 모델 오버라이드

```json
// bkit.config.json
{
  "customization": {
    "agents": {
      "overrides": {
        "code-analyzer": { "model": "sonnet", "permissionMode": "plan" },
        "cto-lead": { "model": "opus", "maxTurns": 30 }
      }
    }
  }
}
```

**구현**: bkit이 config의 overrides를 읽어 `.claude/agents/`에 오버라이드 파일 생성. CC의 "project > plugin" 우선순위에 의해 자동 적용.

### 6.2 비용 프로필 프리셋

| 프로필 | 설명 | opus | sonnet | haiku | 월 비용 (추정) |
|--------|------|:---:|:---:|:---:|:---:|
| **quality** | 최고 품질 | 7 | 7 | 2 | $$$ |
| **balanced** (기본) | 균형 | 3 | 9 | 4 | $$ |
| **economy** | 비용 절감 | 1 | 5 | 10 | $ |

```
/bkit-config customization.costProfile economy
→ 16 에이전트의 모델이 economy 프리셋으로 일괄 변경
→ cto-lead만 opus 유지, 나머지 haiku로 전환
```

### 6.3 커스텀 에이전트 추가

```
/bkit-new-agent api-reviewer
→ .claude/agents/api-reviewer.md 생성 (에이전트 템플릿 포함)
→ bkit.config.json의 agents.taskBased에 자동 등록
```

### 6.4 에이전트 메모리 관리

```json
{
  "customization": {
    "agentMemory": {
      "enable": ["cto-lead", "code-analyzer", "qa-strategist"],
      "scope": "project"
    }
  }
}
```

---

## 7. 문서화 계획

### 7.1 문서 체계

```
docs/guides/
├── customization/
│   ├── 01-quickstart.md           # 5분 시작 가이드
│   ├── 02-config-reference.md     # bkit.config.json 전체 레퍼런스
│   ├── 03-skills-authoring.md     # 커스텀 스킬 작성법
│   ├── 04-agents-customization.md # 에이전트 커스터마이징
│   ├── 05-templates.md            # 템플릿 라이브러리
│   ├── 06-org-setup.md            # 조직 수준 셋업
│   └── 07-troubleshooting.md      # 문제 해결
├── roles/
│   ├── for-developers.md          # 개발자용 가이드
│   ├── for-pms.md                 # PM/기획자용 가이드
│   ├── for-designers.md           # 디자이너용 가이드
│   └── for-qa.md                  # QA 엔지니어용 가이드
└── examples/
    ├── startup-config.json        # 스타트업 예시
    ├── enterprise-config.json     # 엔터프라이즈 예시
    └── custom-skill-example/      # 커스텀 스킬 예시
```

### 7.2 인라인 도움말

모든 스킬에 `--help` 지원:
```
/pdca --help        → PDCA 사용법
/bkit-config --help → 설정 스킬 사용법
```

### 7.3 역할별 가이드 핵심 내용

**for-pms.md**:
```
# PM/기획자를 위한 bkit 가이드

## 할 수 있는 것
- 기획서 작성 → "기획서 작성해줘"
- 요구사항 정리 → "요구사항을 정리해줘"
- 진행 상황 확인 → "현재 상태 보여줘"
- 보고서 생성 → "이번 주 보고서 만들어줘"

## 할 수 없는 것 (개발자에게 요청)
- 코드 작성/수정
- 배포
- 서버 설정
```

---

## 8. 구현 로드맵

### 8.1 v1.5.8 MVP 범위

| Phase | 항목 | 파일 수 | 기간 |
|-------|------|--------:|------|
| **Phase 1** | `customization.mode` (guide/expert/auto) | 3-4 | 2일 |
| | `customization.role` (5개 역할) | 2-3 | 1일 |
| | SessionStart 모드별 분기 | 1 | 0.5일 |
| **Phase 2** | `/bkit-config` 스킬 | 1 dir | 2일 |
| | `/bkit-init` 스킬 + 4종 템플릿 | 1 dir + templates | 2일 |
| | `/bkit-help` 스킬 | 1 dir | 1일 |
| **Total MVP** | | **8-10 files** | **8.5일** |

### 8.2 v1.6.x 확장

| Phase | 항목 | 파일 수 | 기간 |
|-------|------|--------:|------|
| **Phase 3** | `/bkit-new-skill`, `/bkit-new-agent` | 2 dirs | 2일 |
| | Config schema validation | 1-2 | 1일 |
| | Agent override 동기화 로직 | 2-3 | 2일 |
| **Phase 4** | 커스터마이징 가이드 7문서 | 7 | 3일 |
| | 역할별 가이드 4문서 | 4 | 2일 |
| | 템플릿 라이브러리 7종 | 7 dirs | 3일 |
| **Total v1.6.x** | | **25-28 files** | **13.5일** |

### 8.3 신규 스킬 예산 영향

현재: 27 skills, ~13,500 / 16,000 chars (84.4%)

| 추가 스킬 | disable-model-invocation | 예산 영향 |
|----------|:-:|:-:|
| bkit-config | true | 0 chars |
| bkit-init | true | 0 chars |
| bkit-help | **false** (자동 트리거 필요) | +250 chars |
| bkit-new-skill (Phase 3) | true | 0 chars |
| bkit-new-agent (Phase 3) | true | 0 chars |
| **Total** | | **+250 chars (86.0%)** |

안전한 범위 내 (16,000 chars 미만).

---

## 9. 핵심 설계 결정 요약

| 결정 사항 | 선택 | 근거 |
|-----------|------|------|
| 커스터마이징 진입 | 3가지 경로 (CLI 스킬 + 파일 + 템플릿) | 숙련도별 최적 경로 제공 |
| 비개발자 접근 | role + mode 조합 | 기존 27 스킬 재사용, 노출만 제어 |
| 모드 시스템 | guide / expert / auto (3종) | auto를 기본값으로, 사용자 명시 설정 가능 |
| 온보딩 | 점진적 기능 노출 (4단계) | 세션 카운트 기반, 기존 SessionStart 확장 |
| 자연어 라우팅 | 의도 분류 엔진 확장 | 기존 `lib/intent/language.js` 활용 |
| 스킬 작성 DX | 템플릿 자동 생성 + CC hot reload | 별도 빌드 도구 불필요 |
| 비용 최적화 | costProfile 프리셋 | 1개 설정으로 16 에이전트 일괄 변경 |
| 스킬 예산 | 신규 스킬은 대부분 disable-model-invocation | 예산 영향 최소화 |
| CC 통합 | CC 네이티브 메커니즘 위에 동작 | 이중 관리 회피, 업데이트 강건성 |

---

## Sources

- Task #5 결과: `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/docs/01-plan/research/customization-abstraction-brainstorm.md`
- 상세 기술 설계: `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/docs/01-plan/research/dx-accessibility-brainstorm.md`
- bkit.config.json: `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/bkit.config.json`
- Skills: `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/skills/` (27 skills)
- Agents: `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/agents/` (16 agents)
- Config 로직: `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/lib/core/config.js`
- SessionStart: `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/hooks/session-start.js`
- CC Deep Dive: `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/docs/01-plan/research/cc-context-engineering-deep-dive.md`
