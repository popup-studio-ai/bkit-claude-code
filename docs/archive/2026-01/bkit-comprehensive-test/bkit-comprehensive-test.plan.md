# bkit Comprehensive Test Planning Document

> **Summary**: bkit 플러그인의 모든 기능(agents, commands, hooks, lib, scripts, skills, templates)에 대한 종합 테스트 계획
>
> **Project**: bkit-claude-code
> **Version**: v1.4.3
> **Author**: Claude
> **Date**: 2026-01-26
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

bkit 플러그인의 모든 기능이 Claude Code CLI와 Gemini CLI에서 임의 대화를 통해 의도한 대로 동작하는지 검증하는 테스트 계획을 수립합니다.

### 1.2 Background

- bkit v1.4.3은 85개 이상의 기능 컴포넌트로 구성된 복잡한 플러그인
- Claude Code와 Gemini CLI 양쪽 플랫폼 지원 필요
- 자연어 대화를 통한 기능 호출이 올바르게 동작하는지 검증 필요
- PDCA 방법론에 따른 품질 보증

### 1.3 Related Documents

- Requirements: `bkit.config.json`, `plugin.json`
- References: `CHANGELOG.md`, `README.md`

---

## 2. Scope

### 2.1 In Scope

- [x] **Agents (11개)**: 모든 전문 에이전트 테스트
- [x] **Commands (21개 Claude + 20개 Gemini = 41개)**: 모든 슬래시 커맨드 테스트
- [x] **Hooks (5개 이벤트)**: SessionStart, PreToolUse, PostToolUse, UserPromptSubmit, PreCompact
- [x] **Lib (6개 모듈)**: 핵심 라이브러리 함수 테스트
- [x] **Scripts (28개)**: Hook 스크립트 실행 테스트
- [x] **Skills (18개)**: 도메인 지식 컨텍스트 로딩 테스트
- [x] **Templates (12개 + 13개 하위 = 25개)**: 문서 생성 템플릿 테스트
- [x] **플랫폼 호환성 (4개)**: Claude Code CLI & Gemini CLI

### 2.2 Out of Scope

- 성능 벤치마크 (별도 테스트 필요)
- 부하 테스트 (동시 사용자 시나리오)
- 보안 침투 테스트

---

## 3. Test Requirements

### 3.1 Agents 테스트 요구사항 (11개)

| ID | Agent | 트리거 키워드 | 기대 동작 | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| AG-01 | bkend-expert | "로그인 구현해줘", "BaaS", "인증" | bkend.ai 기반 fullstack 가이드 제공 | High | Pending |
| AG-02 | code-analyzer | "코드 분석해줘", "품질 검사", "보안 스캔" | 코드 품질/보안 분석 결과 출력 | High | Pending |
| AG-03 | design-validator | "설계 검증해줘", "스펙 확인" | 설계 문서 완전성 검증 결과 | High | Pending |
| AG-04 | enterprise-expert | "마이크로서비스", "아키텍처 결정" | CTO급 전략 조언 제공 | Medium | Pending |
| AG-05 | gap-detector | "갭 분석", "설계대로야?", "검증해줘" | 설계-구현 매치율 분석 | High | Pending |
| AG-06 | infra-architect | "AWS", "Kubernetes", "Terraform" | 인프라 설계 가이드 | Medium | Pending |
| AG-07 | pdca-iterator | "자동 수정", "반복 개선", "iterate" | 자동 개선 사이클 실행 | High | Pending |
| AG-08 | pipeline-guide | "뭐부터 해야해?", "개발 순서" | 9단계 파이프라인 안내 | High | Pending |
| AG-09 | qa-monitor | "QA", "로그 분석", "테스트" | Docker 로그 기반 QA 실행 | High | Pending |
| AG-10 | report-generator | "보고서 작성", "뭐 했어?", "진행 상황" | PDCA 완료 보고서 생성 | High | Pending |
| AG-11 | starter-guide | "초보자", "처음", "도와줘" | 친근한 초보자 가이드 | High | Pending |

### 3.2 Commands 테스트 요구사항 (21개)

#### 3.2.1 PDCA Commands (8개)

| ID | Command | 입력 예시 | 기대 동작 | Priority | Status |
|----|---------|----------|----------|----------|--------|
| CMD-01 | /pdca-plan | `/pdca-plan login` | docs/01-plan/features/login.plan.md 생성 | High | Pending |
| CMD-02 | /pdca-design | `/pdca-design login` | docs/02-design/features/login.design.md 생성 | High | Pending |
| CMD-03 | /pdca-analyze | `/pdca-analyze login` | Gap 분석 실행, 매치율 출력 | High | Pending |
| CMD-04 | /pdca-report | `/pdca-report login` | docs/04-report/features/login.report.md 생성 | High | Pending |
| CMD-05 | /pdca-iterate | `/pdca-iterate login` | 자동 개선 사이클 실행 | High | Pending |
| CMD-06 | /pdca-status | `/pdca-status` | PDCA 대시보드 출력 | High | Pending |
| CMD-07 | /pdca-next | `/pdca-next` | 다음 단계 안내 | Medium | Pending |
| CMD-08 | /archive | `/archive login` | 완료된 PDCA 문서 아카이브 | Low | Pending |

#### 3.2.2 Pipeline Commands (3개)

| ID | Command | 입력 예시 | 기대 동작 | Priority | Status |
|----|---------|----------|----------|----------|--------|
| CMD-09 | /pipeline-start | `/pipeline-start` | 9단계 파이프라인 시작 안내 | Medium | Pending |
| CMD-10 | /pipeline-next | `/pipeline-next` | 다음 Phase 안내 | Medium | Pending |
| CMD-11 | /pipeline-status | `/pipeline-status` | 파이프라인 진행 현황 | Medium | Pending |

#### 3.2.3 Init Commands (3개)

| ID | Command | 입력 예시 | 기대 동작 | Priority | Status |
|----|---------|----------|----------|----------|--------|
| CMD-12 | /init-starter | `/init-starter` | Starter 레벨 프로젝트 초기화 | High | Pending |
| CMD-13 | /init-dynamic | `/init-dynamic` | Dynamic 레벨 프로젝트 초기화 | High | Pending |
| CMD-14 | /init-enterprise | `/init-enterprise` | Enterprise 레벨 프로젝트 초기화 | Medium | Pending |

#### 3.2.4 Utility Commands (7개)

| ID | Command | 입력 예시 | 기대 동작 | Priority | Status |
|----|---------|----------|----------|----------|--------|
| CMD-15 | /zero-script-qa | `/zero-script-qa setup` | Zero Script QA 실행 | High | Pending |
| CMD-16 | /github-stats | `/github-stats` | GitHub 통계 수집 및 Confluence 업데이트 | Low | Pending |
| CMD-17 | /learn-claude-code | `/learn-claude-code` | Claude Code 학습 가이드 | Medium | Pending |
| CMD-18 | /setup-claude-code | `/setup-claude-code` | Claude Code 설정 자동 생성 | Medium | Pending |
| CMD-19 | /upgrade-claude-code | `/upgrade-claude-code` | 설정 업그레이드 제안 | Medium | Pending |
| CMD-20 | /upgrade-level | `/upgrade-level dynamic` | 프로젝트 레벨 업그레이드 | Medium | Pending |
| CMD-21 | /gemini/* (20개 TOML) | Gemini 전용 commands | Gemini CLI 호환 명령어 (아래 상세) | Medium | Pending |

#### 3.2.5 Gemini CLI Commands (20개 TOML 파일)

| ID | Command | TOML 파일 | Claude 대응 | Priority | Status |
|----|---------|----------|-------------|----------|--------|
| GEM-01 | archive | archive.toml | /archive | Low | Pending |
| GEM-02 | github-stats | github-stats.toml | /github-stats | Low | Pending |
| GEM-03 | init-dynamic | init-dynamic.toml | /init-dynamic | High | Pending |
| GEM-04 | init-enterprise | init-enterprise.toml | /init-enterprise | Medium | Pending |
| GEM-05 | init-starter | init-starter.toml | /init-starter | High | Pending |
| GEM-06 | learn-claude-code | learn-claude-code.toml | /learn-claude-code | Medium | Pending |
| GEM-07 | pdca-analyze | pdca-analyze.toml | /pdca-analyze | High | Pending |
| GEM-08 | pdca-design | pdca-design.toml | /pdca-design | High | Pending |
| GEM-09 | pdca-iterate | pdca-iterate.toml | /pdca-iterate | High | Pending |
| GEM-10 | pdca-next | pdca-next.toml | /pdca-next | Medium | Pending |
| GEM-11 | pdca-plan | pdca-plan.toml | /pdca-plan | High | Pending |
| GEM-12 | pdca-report | pdca-report.toml | /pdca-report | High | Pending |
| GEM-13 | pdca-status | pdca-status.toml | /pdca-status | High | Pending |
| GEM-14 | pipeline-next | pipeline-next.toml | /pipeline-next | Medium | Pending |
| GEM-15 | pipeline-start | pipeline-start.toml | /pipeline-start | Medium | Pending |
| GEM-16 | pipeline-status | pipeline-status.toml | /pipeline-status | Medium | Pending |
| GEM-17 | setup-claude-code | setup-claude-code.toml | /setup-claude-code | Medium | Pending |
| GEM-18 | upgrade-claude-code | upgrade-claude-code.toml | /upgrade-claude-code | Medium | Pending |
| GEM-19 | upgrade-level | upgrade-level.toml | /upgrade-level | Medium | Pending |
| GEM-20 | zero-script-qa | zero-script-qa.toml | /zero-script-qa | High | Pending |

### 3.3 Hooks 테스트 요구사항 (5개 이벤트)

| ID | Hook Event | 트리거 조건 | 기대 동작 | Priority | Status |
|----|-----------|------------|----------|----------|--------|
| HK-01 | SessionStart | 세션 시작 시 | PDCA 상태 초기화, 온보딩 프롬프트 | High | Pending |
| HK-02 | PreToolUse (Write/Edit) | 파일 작성/수정 전 | pre-write.js 실행, 검증 | High | Pending |
| HK-03 | PostToolUse (Write) | 파일 작성 후 | pdca-post-write.js 실행 | High | Pending |
| HK-04 | UserPromptSubmit | 사용자 메시지 제출 | user-prompt-handler.js 실행 | High | Pending |
| HK-05 | PreCompact | 컨텍스트 압축 전 | context-compaction.js 실행 | Medium | Pending |

### 3.4 Lib 모듈 테스트 요구사항 (6개)

| ID | Module | 핵심 함수 | 기대 동작 | Priority | Status |
|----|--------|----------|----------|----------|--------|
| LIB-01 | common.js | detectLevel(), getPdcaStatusFull(), xmlSafeOutput() | 프로젝트 레벨 감지, PDCA 상태 조회, XML 안전 출력 | High | Pending |
| LIB-02 | context-fork.js | forkContext(), mergeForkedContext() | 컨텍스트 격리 및 병합 | Medium | Pending |
| LIB-03 | context-hierarchy.js | getContextHierarchy(), setSessionContext() | 4레벨 컨텍스트 관리 | Medium | Pending |
| LIB-04 | import-resolver.js | resolveImports(), processMarkdownWithImports() | @import 지시문 해석 | Medium | Pending |
| LIB-05 | memory-store.js | getMemory(), setMemory() | 세션 영속 저장소 | Medium | Pending |
| LIB-06 | permission-manager.js | checkPermission(), shouldBlock() | 권한 체인 관리 | Medium | Pending |

### 3.5 Scripts 테스트 요구사항 (27개)

#### 3.5.1 Hook Scripts

| ID | Script | 트리거 | 기대 동작 | Priority | Status |
|----|--------|-------|----------|----------|--------|
| SC-01 | pre-write.js | Write/Edit 전 | PDCA 검증, 설계 문서 확인 | High | Pending |
| SC-02 | pdca-post-write.js | Write 후 | PDCA 상태 업데이트 | High | Pending |
| SC-03 | user-prompt-handler.js | UserPromptSubmit | 새 기능 감지, Agent 트리거 | High | Pending |
| SC-04 | context-compaction.js | PreCompact | 컨텍스트 최적화 | Medium | Pending |
| SC-05 | gap-detector-stop.js | gap-detector 종료 | 분석 결과 저장 | High | Pending |
| SC-05b | gap-detector-post.js | gap-detector 후처리 | 분석 후 추가 처리 | Medium | Pending |
| SC-06 | iterator-stop.js | pdca-iterator 종료 | 반복 결과 저장 | High | Pending |

#### 3.5.2 Phase Transition Scripts

| ID | Script | 트리거 | 기대 동작 | Priority | Status |
|----|--------|-------|----------|----------|--------|
| SC-07 | phase-transition.js | Phase 완료 시 | 다음 Phase로 전환 안내 | Medium | Pending |
| SC-08 | phase1-schema-stop.js | Phase 1 완료 | Schema 검증 | Medium | Pending |
| SC-09 | phase2-convention-pre.js | Phase 2 시작 전 | Convention 사전 검증 | Medium | Pending |
| SC-10 | phase2-convention-stop.js | Phase 2 완료 | Convention 완료 검증 | Medium | Pending |
| SC-11 | phase3-mockup-stop.js | Phase 3 완료 | Mockup 검증 | Medium | Pending |
| SC-12 | phase4-api-stop.js | Phase 4 완료 | API 검증 | Medium | Pending |
| SC-13 | phase5-design-post.js | Phase 5 디자인 후 | 디자인 시스템 검증 | Medium | Pending |
| SC-14 | phase6-ui-post.js | Phase 6 UI 후 | UI 통합 검증 | Medium | Pending |
| SC-15 | phase7-seo-stop.js | Phase 7 완료 | SEO/보안 검증 | Medium | Pending |
| SC-16 | phase8-review-stop.js | Phase 8 완료 | 리뷰 완료 검증 | Medium | Pending |
| SC-17 | phase9-deploy-pre.js | Phase 9 시작 전 | 배포 사전 검증 | Medium | Pending |

#### 3.5.3 Utility Scripts

| ID | Script | 용도 | 기대 동작 | Priority | Status |
|----|--------|-----|----------|----------|--------|
| SC-18 | archive-feature.js | 아카이브 | PDCA 문서 아카이브 실행 | Low | Pending |
| SC-19 | select-template.js | 템플릿 선택 | 레벨별 템플릿 선택 | Medium | Pending |
| SC-20 | sync-folders.js | 폴더 동기화 | 구조 동기화 | Low | Pending |
| SC-21 | validate-plugin.js | 플러그인 검증 | 플러그인 무결성 검증 | Low | Pending |
| SC-22 | analysis-stop.js | 분석 종료 | 분석 결과 처리 | Medium | Pending |
| SC-23 | code-analyzer-pre.js | 코드 분석 전 | 분석 사전 설정 | Medium | Pending |
| SC-24 | design-validator-pre.js | 설계 검증 전 | 검증 사전 설정 | Medium | Pending |
| SC-25 | qa-monitor-post.js | QA 모니터 후 | QA 결과 처리 | Medium | Pending |
| SC-26 | qa-pre-bash.js | QA Bash 전 | Bash 명령 검증 | Medium | Pending |
| SC-27 | qa-stop.js | QA 종료 | QA 결과 저장 | Medium | Pending |

### 3.6 Skills 테스트 요구사항 (18개)

#### 3.6.1 Level Skills (3개)

| ID | Skill | 트리거 키워드 | 기대 동작 | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| SK-01 | starter | "정적 웹", "포트폴리오", "HTML CSS" | Starter 레벨 개발 컨텍스트 | High | Pending |
| SK-02 | dynamic | "로그인", "fullstack", "BaaS" | Dynamic 레벨 개발 컨텍스트 | High | Pending |
| SK-03 | enterprise | "마이크로서비스", "k8s", "terraform" | Enterprise 레벨 개발 컨텍스트 | Medium | Pending |

#### 3.6.2 App Type Skills (2개)

| ID | Skill | 트리거 키워드 | 기대 동작 | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| SK-04 | mobile-app | "모바일 앱", "React Native", "Flutter" | 모바일 앱 개발 컨텍스트 | Medium | Pending |
| SK-05 | desktop-app | "데스크톱 앱", "Electron", "Tauri" | 데스크톱 앱 개발 컨텍스트 | Medium | Pending |

#### 3.6.3 Phase Skills (9개)

| ID | Skill | Phase | 기대 동작 | Priority | Status |
|----|-------|-------|----------|----------|--------|
| SK-06 | phase-1-schema | Phase 1 | Schema/용어 정의 가이드 | High | Pending |
| SK-07 | phase-2-convention | Phase 2 | 코딩 컨벤션 가이드 | High | Pending |
| SK-08 | phase-3-mockup | Phase 3 | 목업 개발 가이드 | High | Pending |
| SK-09 | phase-4-api | Phase 4 | API 설계/구현 가이드 | High | Pending |
| SK-10 | phase-5-design-system | Phase 5 | 디자인 시스템 가이드 | Medium | Pending |
| SK-11 | phase-6-ui-integration | Phase 6 | UI 통합 가이드 | High | Pending |
| SK-12 | phase-7-seo-security | Phase 7 | SEO/보안 가이드 | Medium | Pending |
| SK-13 | phase-8-review | Phase 8 | 리뷰 가이드 | Medium | Pending |
| SK-14 | phase-9-deployment | Phase 9 | 배포 가이드 | Medium | Pending |

#### 3.6.4 Utility Skills (4개)

| ID | Skill | 용도 | 기대 동작 | Priority | Status |
|----|-------|-----|----------|----------|--------|
| SK-15 | bkit-rules | 핵심 규칙 | PDCA 방법론 규칙 컨텍스트 | High | Pending |
| SK-16 | bkit-templates | 템플릿 | PDCA 문서 템플릿 컨텍스트 | High | Pending |
| SK-17 | development-pipeline | 파이프라인 | 9단계 파이프라인 컨텍스트 | High | Pending |
| SK-18 | zero-script-qa | QA | Zero Script QA 방법론 | Medium | Pending |

### 3.7 Templates 테스트 요구사항 (12개)

| ID | Template | 생성 위치 | 기대 동작 | Priority | Status |
|----|----------|----------|----------|----------|--------|
| TM-01 | plan.template.md | docs/01-plan/features/ | Plan 문서 생성 | High | Pending |
| TM-02 | design.template.md | docs/02-design/features/ | Design 문서 생성 | High | Pending |
| TM-03 | design-starter.template.md | docs/02-design/features/ | Starter 전용 Design | Medium | Pending |
| TM-04 | design-enterprise.template.md | docs/02-design/features/ | Enterprise 전용 Design | Medium | Pending |
| TM-05 | analysis.template.md | docs/03-analysis/ | Analysis 문서 생성 | High | Pending |
| TM-06 | report.template.md | docs/04-report/features/ | Report 문서 생성 | High | Pending |
| TM-07 | iteration-report.template.md | docs/03-analysis/ | 반복 개선 보고서 | Medium | Pending |
| TM-08 | _INDEX.template.md | docs/*/ | 인덱스 문서 생성 | Medium | Pending |
| TM-09 | CLAUDE.template.md | 프로젝트 루트 | CLAUDE.md 생성 | Medium | Pending |
| TM-10 | TEMPLATE-GUIDE.md | 참조용 | 템플릿 사용 가이드 | Low | Pending |
| TM-11 | pipeline/*.template.md | docs/ | 파이프라인 Phase 템플릿 | Medium | Pending |
| TM-12 | shared/*.md | 공유 컨텍스트 | 공유 패턴 문서 | Medium | Pending |

### 3.8 플랫폼 호환성 요구사항

| ID | 플랫폼 | 테스트 항목 | 기대 동작 | Priority | Status |
|----|-------|-----------|----------|----------|--------|
| PL-01 | Claude Code CLI | 모든 기능 | 정상 동작 | High | Pending |
| PL-02 | Gemini CLI v0.26+ | 모든 기능 | XML 안전 출력, 정상 동작 | High | Pending |
| PL-03 | 플랫폼 감지 | BKIT_PLATFORM 변수 | 자동 플랫폼 감지 | High | Pending |
| PL-04 | 출력 형식 | JSON vs Plain Text | 플랫폼별 올바른 출력 | High | Pending |

---

## 4. Test Scenarios

### 4.1 시나리오 1: PDCA 전체 사이클

```
입력: "로그인 기능을 만들어줘"
기대 흐름:
1. user-prompt-handler.js가 새 기능 감지
2. /pdca-plan 자동 제안 또는 실행
3. Plan 문서 생성 후 /pdca-design 안내
4. Design 문서 생성
5. 구현 후 /pdca-analyze 제안
6. Gap 분석 실행 (매치율 < 90% → /pdca-iterate)
7. 자동 개선 후 매치율 >= 90%
8. /pdca-report로 완료 보고서
```

### 4.2 시나리오 2: 8개 언어 트리거

```
입력 테스트:
- KO: "검증해줘", "개선해줘", "분석해줘"
- EN: "verify", "improve", "analyze"
- JA: "確認して", "改善して"
- ZH: "验证", "改进"
- ES: "verificar"
- FR: "vérifier"
- DE: "überprüfen"
- IT: "verificare"

기대: 각 언어로 적절한 Agent/Skill 트리거
```

### 4.3 시나리오 3: 레벨별 초기화

```
테스트 1: /init-starter
- docs/ 폴더 구조 생성
- .pdca-status.json 초기화 (level: "starter")

테스트 2: /init-dynamic
- 추가로 data-model.md 템플릿 생성
- .pdca-status.json (level: "dynamic")

테스트 3: /init-enterprise
- 확장된 docs/ 구조 생성
- 도메인별 CLAUDE.md 생성
- .pdca-status.json (level: "enterprise")
```

### 4.4 시나리오 4: Gemini CLI 호환성

```
입력: Gemini CLI에서 세션 시작
기대:
1. SessionStart hook이 Plain Text (ANSI 컬러) 출력
2. xmlSafeOutput()으로 특수 문자 이스케이프
3. Gemini 전용 권장 명령어 표시
```

---

## 5. Success Criteria

### 5.1 Definition of Done

- [ ] 모든 113개 테스트 케이스 통과 (11 Agents + 41 Commands + 5 Hooks + 6 Lib + 28 Scripts + 18 Skills + 4 Platform)
- [ ] Claude Code CLI에서 100% 기능 동작
- [ ] Gemini CLI에서 100% 기능 동작 (v0.26+ 호환)
- [ ] 8개 언어 트리거 동작 확인
- [ ] PDCA 전체 사이클 정상 완료

### 5.2 Quality Criteria

- [ ] 테스트 커버리지 100% (모든 기능)
- [ ] Zero critical bugs
- [ ] 플랫폼별 출력 형식 검증
- [ ] 문서 생성 무결성 확인

---

## 6. Test Execution Matrix

### 6.1 우선순위별 테스트 순서

| Phase | 대상 | 테스트 수 | 예상 소요 |
|-------|------|----------|----------|
| 1 | High Priority Agents (8개) | 8 | - |
| 2 | PDCA Commands (8개) | 8 | - |
| 3 | Core Hooks (4개) | 4 | - |
| 4 | High Priority Skills (7개) | 7 | - |
| 5 | Medium Priority 전체 | 40+ | - |
| 6 | Low Priority 전체 | 15+ | - |

### 6.2 테스트 환경

| 환경 | 설정 |
|------|-----|
| Claude Code CLI | 최신 버전 |
| Gemini CLI | v0.26+ |
| Node.js | v18+ |
| OS | macOS (darwin) |

---

## 7. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Gemini CLI 버전 호환성 | High | Medium | xmlSafeOutput() 적용, 버전 체크 |
| Hook 실행 순서 문제 | Medium | Low | 의존성 체인 검증 |
| 플랫폼별 출력 차이 | Medium | Medium | 조건부 출력 로직 검증 |
| 대용량 컨텍스트 | Low | Medium | context-compaction.js 테스트 |

---

## 8. Next Steps

1. [ ] 본 테스트 계획서 검토 및 승인
2. [ ] 테스트 케이스 실행 시작 (High Priority)
3. [ ] 결과 기록 및 버그 리포트
4. [ ] /pdca-iterate로 완전성 검증
5. [ ] /pdca-report로 최종 보고서 작성

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-01-26 | Initial comprehensive test plan | Claude |
| 0.2 | 2026-01-26 | Gap 분석 후 누락 항목 추가: Gemini TOML 20개, gap-detector-post.js | Claude |
