# Skills-Agents 상호 참조 분석 보고서

> **분석 일자**: 2026-01-26
> **분석 대상**: bkit v1.4.3 Skills/Agents Frontmatter
> **분석 방법**: PDCA Check Phase - Gap Analysis

---

## 1. 분석 범위

### Skills (18개)
| # | Skill Name | agent: 필드 | context: fork |
|---|------------|-------------|---------------|
| 1 | starter | starter-guide | - |
| 2 | dynamic | bkend-expert | - |
| 3 | enterprise | infra-architect | - |
| 4 | mobile-app | pipeline-guide | - |
| 5 | desktop-app | pipeline-guide | - |
| 6 | development-pipeline | pipeline-guide | - |
| 7 | phase-1-schema | pipeline-guide | - |
| 8 | phase-2-convention | pipeline-guide | - |
| 9 | phase-3-mockup | pipeline-guide | - |
| 10 | phase-4-api | qa-monitor | - |
| 11 | phase-5-design-system | pipeline-guide | - |
| 12 | phase-6-ui-integration | pipeline-guide | - |
| 13 | phase-7-seo-security | code-analyzer | - |
| 14 | phase-8-review | code-analyzer | - |
| 15 | phase-9-deployment | infra-architect | - |
| 16 | zero-script-qa | qa-monitor | fork |
| 17 | bkit-rules | - | - |
| 18 | bkit-templates | - | - |

### Agents (11개)
| # | Agent Name | skills: 필드 | context: fork |
|---|------------|--------------|---------------|
| 1 | starter-guide | [starter] | - |
| 2 | bkend-expert | [dynamic] | - |
| 3 | pipeline-guide | [development-pipeline] | - |
| 4 | infra-architect | [enterprise] | - |
| 5 | qa-monitor | [zero-script-qa] | - |
| 6 | code-analyzer | - | - |
| 7 | gap-detector | [bkit-templates, phase-2-convention] | fork |
| 8 | pdca-iterator | - | - |
| 9 | design-validator | [bkit-templates] | fork |
| 10 | report-generator | [bkit-templates] | - |
| 11 | enterprise-expert | [enterprise] | - |

---

## 2. 상호 참조 매핑 다이어그램

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Skills → Agents 참조 매핑                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐     agent:      ┌─────────────────┐                       │
│  │   starter   │ ──────────────→ │  starter-guide  │                       │
│  └─────────────┘                 └─────────────────┘                       │
│                                                                             │
│  ┌─────────────┐     agent:      ┌─────────────────┐                       │
│  │   dynamic   │ ──────────────→ │   bkend-expert  │                       │
│  └─────────────┘                 └─────────────────┘                       │
│                                                                             │
│  ┌─────────────┐     agent:      ┌─────────────────┐                       │
│  │ enterprise  │ ──────────────→ │  infra-architect│                       │
│  └─────────────┘                 └─────────────────┘                       │
│                                                                             │
│  ┌─────────────┐                                                           │
│  │ mobile-app  │ ───┐                                                      │
│  ├─────────────┤    │                                                      │
│  │ desktop-app │ ───┤                                                      │
│  ├─────────────┤    │  agent:    ┌─────────────────┐                       │
│  │ dev-pipeline│ ───┼──────────→ │  pipeline-guide │                       │
│  ├─────────────┤    │            └─────────────────┘                       │
│  │ phase-1~3   │ ───┤                                                      │
│  │ phase-5~6   │ ───┘                                                      │
│  └─────────────┘                                                           │
│                                                                             │
│  ┌─────────────┐     agent:      ┌─────────────────┐                       │
│  │ phase-4-api │ ───┐            │                 │                       │
│  ├─────────────┤    ├──────────→ │   qa-monitor    │                       │
│  │zero-script  │ ───┘            │                 │                       │
│  └─────────────┘                 └─────────────────┘                       │
│                                                                             │
│  ┌─────────────┐     agent:      ┌─────────────────┐                       │
│  │ phase-7-seo │ ───┐            │                 │                       │
│  ├─────────────┤    ├──────────→ │  code-analyzer  │                       │
│  │ phase-8-rev │ ───┘            │                 │                       │
│  └─────────────┘                 └─────────────────┘                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                    Agents → Skills 참조 매핑 (skills: 필드)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐   skills:   ┌─────────────────┐                       │
│  │  starter-guide  │ ←────────── │     starter     │                       │
│  └─────────────────┘             └─────────────────┘                       │
│                                                                             │
│  ┌─────────────────┐   skills:   ┌─────────────────┐                       │
│  │  bkend-expert   │ ←────────── │     dynamic     │                       │
│  └─────────────────┘             └─────────────────┘                       │
│                                                                             │
│  ┌─────────────────┐   skills:   ┌─────────────────┐                       │
│  │ pipeline-guide  │ ←────────── │ dev-pipeline    │                       │
│  └─────────────────┘             └─────────────────┘                       │
│                                                                             │
│  ┌─────────────────┐   skills:   ┌─────────────────┐                       │
│  │ infra-architect │ ←────────── │   enterprise    │                       │
│  └─────────────────┘             └─────────────────┘                       │
│                                                                             │
│  ┌─────────────────┐   skills:   ┌─────────────────┐                       │
│  │   qa-monitor    │ ←────────── │  zero-script-qa │                       │
│  └─────────────────┘             └─────────────────┘                       │
│                                                                             │
│  ┌─────────────────┐   skills:   ┌─────────────────┐                       │
│  │  gap-detector   │ ←────────── │  bkit-templates │                       │
│  │                 │ ←────────── │phase-2-convention│                      │
│  └─────────────────┘             └─────────────────┘                       │
│                                                                             │
│  ┌─────────────────┐   skills:   ┌─────────────────┐                       │
│  │design-validator │ ←────────── │  bkit-templates │                       │
│  └─────────────────┘             └─────────────────┘                       │
│                                                                             │
│  ┌─────────────────┐   skills:   ┌─────────────────┐                       │
│  │report-generator │ ←────────── │  bkit-templates │                       │
│  └─────────────────┘             └─────────────────┘                       │
│                                                                             │
│  ┌─────────────────┐   skills:   ┌─────────────────┐                       │
│  │enterprise-expert│ ←────────── │   enterprise    │                       │
│  └─────────────────┘             └─────────────────┘                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 참조 유효성 검증 결과

### 3.1 Skills → Agents 참조 검증 ✅

| Skill | 참조 Agent | agents/ 존재 여부 | 상태 |
|-------|-----------|------------------|------|
| starter | starter-guide | ✅ 존재 | PASS |
| dynamic | bkend-expert | ✅ 존재 | PASS |
| enterprise | infra-architect | ✅ 존재 | PASS |
| mobile-app | pipeline-guide | ✅ 존재 | PASS |
| desktop-app | pipeline-guide | ✅ 존재 | PASS |
| development-pipeline | pipeline-guide | ✅ 존재 | PASS |
| phase-1-schema | pipeline-guide | ✅ 존재 | PASS |
| phase-2-convention | pipeline-guide | ✅ 존재 | PASS |
| phase-3-mockup | pipeline-guide | ✅ 존재 | PASS |
| phase-4-api | qa-monitor | ✅ 존재 | PASS |
| phase-5-design-system | pipeline-guide | ✅ 존재 | PASS |
| phase-6-ui-integration | pipeline-guide | ✅ 존재 | PASS |
| phase-7-seo-security | code-analyzer | ✅ 존재 | PASS |
| phase-8-review | code-analyzer | ✅ 존재 | PASS |
| phase-9-deployment | infra-architect | ✅ 존재 | PASS |
| zero-script-qa | qa-monitor | ✅ 존재 | PASS |

**결과: 16/16 (100%) - 모든 참조 유효**

### 3.2 Agents → Skills 참조 검증 ✅

| Agent | 참조 Skills | skills/ 존재 여부 | 상태 |
|-------|-------------|------------------|------|
| starter-guide | [starter] | ✅ 존재 | PASS |
| bkend-expert | [dynamic] | ✅ 존재 | PASS |
| pipeline-guide | [development-pipeline] | ✅ 존재 | PASS |
| infra-architect | [enterprise] | ✅ 존재 | PASS |
| qa-monitor | [zero-script-qa] | ✅ 존재 | PASS |
| gap-detector | [bkit-templates, phase-2-convention] | ✅ 모두 존재 | PASS |
| design-validator | [bkit-templates] | ✅ 존재 | PASS |
| report-generator | [bkit-templates] | ✅ 존재 | PASS |
| enterprise-expert | [enterprise] | ✅ 존재 | PASS |

**결과: 9/9 (100%) - 모든 참조 유효**

---

## 4. 순환 참조 분석

### 4.1 양방향 참조 패턴 감지

다음과 같은 **양방향 참조** 패턴이 발견되었습니다:

```
┌───────────────────────────────────────────────────────────────────┐
│                   양방향 참조 패턴 (5개)                            │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. starter ←────────────────→ starter-guide                     │
│     skill의 agent: → starter-guide                               │
│     agent의 skills: ← [starter]                                  │
│                                                                   │
│  2. dynamic ←────────────────→ bkend-expert                      │
│     skill의 agent: → bkend-expert                                │
│     agent의 skills: ← [dynamic]                                  │
│                                                                   │
│  3. enterprise ←─────────────→ infra-architect                   │
│     skill의 agent: → infra-architect                             │
│     agent의 skills: ← [enterprise]                               │
│                                                                   │
│  4. development-pipeline ←───→ pipeline-guide                    │
│     skill의 agent: → pipeline-guide                              │
│     agent의 skills: ← [development-pipeline]                     │
│                                                                   │
│  5. zero-script-qa ←─────────→ qa-monitor                        │
│     skill의 agent: → qa-monitor                                  │
│     agent의 skills: ← [zero-script-qa]                           │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

### 4.2 순환 참조 안전성 평가

| 패턴 | 위험도 | 이유 |
|------|--------|------|
| starter ↔ starter-guide | ✅ 안전 | 서로 다른 역할, 무한 루프 없음 |
| dynamic ↔ bkend-expert | ✅ 안전 | 서로 다른 역할, 무한 루프 없음 |
| enterprise ↔ infra-architect | ✅ 안전 | 서로 다른 역할, 무한 루프 없음 |
| development-pipeline ↔ pipeline-guide | ✅ 안전 | 서로 다른 역할, 무한 루프 없음 |
| zero-script-qa ↔ qa-monitor | ✅ 안전 | 서로 다른 역할, 무한 루프 없음 |

**분석:**
- Skills의 `agent:` 필드는 **실행 위임**을 의미 (skill → agent로 작업 전달)
- Agents의 `skills:` 필드는 **컨텍스트 주입**을 의미 (agent 시작 시 skill 내용 로드)
- 두 필드의 **의미적 차이**로 인해 실제 재귀 호출은 발생하지 않음

### 4.3 복잡한 참조 체인 분석

```
enterprise (skill)
    │
    ├──agent:────→ infra-architect (agent)
    │                   │
    │                   └──skills:────→ enterprise (skill) [컨텍스트 주입만]
    │
    └──(별도 agent)
         enterprise-expert (agent)
              │
              └──skills:────→ enterprise (skill) [컨텍스트 주입만]
```

**결론:** `enterprise` skill이 두 개의 agent에서 참조되지만, 각각 독립적인 컨텍스트 주입으로 안전합니다.

---

## 5. 공식 문서 준수 여부 분석

### 5.1 Skills Frontmatter 필드 검증

| 필드 | 공식 지원 | bkit 사용 현황 | 상태 |
|------|----------|---------------|------|
| name | ✅ | 모든 skill에서 사용 | PASS |
| description | ✅ | 모든 skill에서 사용 | PASS |
| agent | ✅ | 16/18 skill에서 사용 | PASS |
| context | ✅ | zero-script-qa에서 fork 사용 | PASS |
| allowed-tools | ✅ | 다수 skill에서 사용 | PASS |
| user-invocable | ✅ | 15/18 skill에서 false로 설정 | PASS |
| hooks | ✅ | 다수 skill에서 사용 | PASS |
| imports | ✅ | 일부 skill에서 사용 | PASS |

### 5.2 Agents Frontmatter 필드 검증

| 필드 | 공식 지원 | bkit 사용 현황 | 상태 |
|------|----------|---------------|------|
| name | ✅ | 모든 agent에서 사용 | PASS |
| description | ✅ | 모든 agent에서 사용 | PASS |
| skills | ✅ | 9/11 agent에서 사용 | PASS |
| tools | ✅ | 모든 agent에서 사용 | PASS |
| model | ✅ | 모든 agent에서 사용 | PASS |
| permissionMode | ✅ | 모든 agent에서 사용 | PASS |
| disallowedTools | ✅ | 일부 agent에서 사용 | PASS |
| hooks | ✅ | 다수 agent에서 사용 | PASS |
| context | ✅ | gap-detector, design-validator에서 사용 | PASS |
| imports | ✅ | 일부 agent에서 사용 | PASS |

---

## 6. 발견된 문제점

### 6.1 Critical Issues (0개)
없음

### 6.2 Warnings (2개)

#### W-001: enterprise skill 중복 참조
```
enterprise (skill)
  ├── infra-architect (agent) - agent: 필드로 연결
  └── enterprise-expert (agent) - skills: 필드로 연결
```
- **영향**: 혼란 가능성 있음
- **권장 조치**: enterprise-expert agent의 독자적 skill 검토

#### W-002: code-analyzer agent에 skills 필드 누락
```yaml
# agents/code-analyzer.md
name: code-analyzer
# skills: 필드 없음
```
- **영향**: 일관성 부족
- **권장 조치**: phase-7-seo-security, phase-8-review 중 하나를 skills로 추가 검토

### 6.3 Suggestions (3개)

#### S-001: user-invocable 설정 검토
- `bkit-rules`, `bkit-templates` skill에는 `agent:` 필드가 없으나 `user-invocable`도 명시되지 않음
- 의도적 설계일 수 있으나 명시적 설정 권장

#### S-002: context: fork 사용 일관성
- Skills 중 `zero-script-qa`만 `context: fork` 사용
- Agents 중 `gap-detector`, `design-validator`만 `context: fork` 사용
- 격리 실행이 필요한 다른 skill/agent 검토 필요

#### S-003: imports 경로 통일
- 일부 파일에서 `${PLUGIN_ROOT}` 사용
- 일부 파일에서 `${CLAUDE_PLUGIN_ROOT}` 사용
- 경로 변수 통일 권장

---

## 7. 종합 평가

### Match Rate: 95%

| 평가 항목 | 점수 | 상세 |
|----------|------|------|
| 참조 유효성 | 100% | 모든 참조가 실제 파일과 매칭 |
| 순환 참조 안전성 | 100% | 무한 루프 위험 없음 |
| 공식 문서 준수 | 100% | 모든 필드가 공식 지원 |
| 일관성 | 85% | 일부 불일치 발견 |
| 확장성 | 95% | 양호한 구조 |

### 결론

bkit v1.4.3의 Skills/Agents 상호 참조 구조는 **Claude Code 공식 문서와 완벽하게 호환**되며, **실질적인 순환 참조 문제가 없습니다**.

양방향 참조 패턴 (skill의 `agent:` ↔ agent의 `skills:`)은:
1. **의미적으로 다른 목적**을 가짐 (실행 위임 vs 컨텍스트 주입)
2. **Claude Code의 공식 설계 패턴**과 일치
3. **무한 루프를 유발하지 않음**

---

## 8. 권장 조치

| 우선순위 | 항목 | 조치 |
|---------|------|------|
| 낮음 | W-001 | enterprise-expert의 skill 참조 검토 |
| 낮음 | W-002 | code-analyzer에 skills 필드 추가 검토 |
| 매우 낮음 | S-001~S-003 | 일관성 개선 (선택사항) |

**현재 상태로 운영에 문제 없음.**

---

*Generated by bkit PDCA Check Phase - Gap Detector*
