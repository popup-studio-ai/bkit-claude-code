# Korean to English Translation - Design Document

> **Summary**: Complete translation specification for internationalizing bkit codebase while preserving 8-language trigger keywords
>
> **Project**: bkit-claude-code
> **Version**: 1.4.5
> **Author**: bkit Team
> **Created**: 2026-01-27
> **Status**: Draft
> **Plan Reference**: [korean-to-english-translation.plan.md](../../01-plan/features/korean-to-english-translation.plan.md)

---

## 1. Overview

### 1.1 Purpose

This design document provides detailed specifications for translating all Korean content in the bkit plugin to English, while:
1. Preserving 8-language trigger keywords (EN, KO, JA, ZH, ES, FR, DE, IT)
2. Completing missing language triggers in agents and skills
3. Maintaining functional consistency

### 1.2 Scope

| Category | Files | Action |
|----------|-------|--------|
| hooks/ | 1 file | Translate UI strings |
| agents/ | 11 files | Translate content + complete triggers |
| skills/ | 21 files | Translate content + complete triggers |
| templates/ | 3 files | Translate all content |
| bkit-system/ | 4 files | Translate examples |

### 1.3 Design Principles

1. **Trigger Preservation**: All 8-language trigger keywords in `description:` and `Triggers:` sections are preserved
2. **Trigger Completion**: Missing language triggers are added to ensure full 8-language coverage
3. **Semantic Accuracy**: Translations maintain original meaning and technical accuracy
4. **Consistency**: Same Korean term → same English translation throughout

---

## 2. 8-Language Trigger Completion Specification

### 2.1 Agents Requiring Trigger Completion

#### 2.1.1 enterprise-expert.md

**Current Triggers (5 languages)**:
```
EN: CTO, AI Native, enterprise strategy, microservices, architecture decision
KO: 전략, 아키텍처, 마이크로서비스
JA: アーキテクチャ, マイクロサービス
ZH: 架构决策, 微服务
```

**Add Missing Triggers**:
```yaml
# Add to description: Triggers section
ES: estrategia empresarial, arquitectura, microservicios, decisión arquitectónica
FR: stratégie d'entreprise, architecture, microservices, décision architecturale
DE: Unternehmensstrategie, Architektur, Microservices, Architekturentscheidung
IT: strategia aziendale, architettura, microservizi, decisione architetturale
```

#### 2.1.2 pipeline-guide.md

**Current Triggers (4 languages)**:
```
EN: development pipeline, phase, development order, where to start, what to do first
KO: 개발 파이프라인, 뭐부터, 어디서부터, 순서, 시작
JA: 開発パイプライン, 何から, どこから
ZH: 开发流程, 从哪里开始
```

**Add Missing Triggers**:
```yaml
ES: pipeline de desarrollo, fase, orden de desarrollo, por dónde empezar, qué hacer primero
FR: pipeline de développement, phase, ordre de développement, par où commencer, que faire en premier
DE: Entwicklungs-Pipeline, Phase, Entwicklungsreihenfolge, wo anfangen, was zuerst tun
IT: pipeline di sviluppo, fase, ordine di sviluppo, da dove iniziare, cosa fare prima
```

#### 2.1.3 bkend-expert.md

**Current Triggers (5 languages)**:
```
EN: bkend, BaaS, authentication, login, signup, database, fullstack, backend
KO: 인증, 로그인, 회원가입, 데이터베이스, 풀스택, 백엔드
JA: 認証, ログイン, データベース
ZH: 身份验证, 数据库
ES: autenticación
```

**Add Missing Triggers**:
```yaml
FR: authentification, connexion, inscription, base de données, fullstack, backend
DE: Authentifizierung, Anmeldung, Registrierung, Datenbank, Fullstack, Backend
IT: autenticazione, accesso, registrazione, database, fullstack, backend
```

#### 2.1.4 design-validator.md

**Current Triggers (4 languages)**:
```
EN: design validation, document review, spec check, validate design, review spec
KO: 설계 검증, 문서 검토, 스펙 확인
JA: 設計検証, 仕様チェック
ZH: 设计验证, 规格检查
```

**Add Missing Triggers**:
```yaml
ES: validación de diseño, revisión de documentos, verificación de especificaciones
FR: validation de conception, revue de documents, vérification des spécifications
DE: Design-Validierung, Dokumentenprüfung, Spezifikationsprüfung
IT: validazione del design, revisione documenti, verifica delle specifiche
```

#### 2.1.5 qa-monitor.md

**Current Triggers (4 languages)**:
```
EN: zero script qa, log-based testing, docker logs, QA, testing, log analysis
KO: 제로 스크립트 QA, 테스트, 로그 분석
JA: ゼロスクリプトQA, ログ分析
ZH: 零脚本QA, 日志分析
```

**Add Missing Triggers**:
```yaml
ES: QA sin scripts, pruebas basadas en logs, registros de docker, pruebas, análisis de logs
FR: QA sans script, tests basés sur les logs, logs docker, tests, analyse de logs
DE: Script-freies QA, Log-basiertes Testen, Docker-Logs, Tests, Log-Analyse
IT: QA senza script, test basati su log, log docker, test, analisi dei log
```

#### 2.1.6 infra-architect.md

**Current Triggers (4 languages)**:
```
EN: AWS, Kubernetes, Terraform, infrastructure, CI/CD, EKS, RDS, cloud
KO: 인프라, 쿠버네티스, 클라우드
JA: インフラ, クラウド
ZH: 基础设施, 云架构
```

**Add Missing Triggers**:
```yaml
ES: infraestructura, nube, Kubernetes, despliegue, CI/CD
FR: infrastructure, cloud, Kubernetes, déploiement, CI/CD
DE: Infrastruktur, Cloud, Kubernetes, Bereitstellung, CI/CD
IT: infrastruttura, cloud, Kubernetes, distribuzione, CI/CD
```

### 2.2 Skills Requiring Trigger Completion

#### 2.2.1 pdca/SKILL.md

**Current Triggers (partial)**:
```
EN: pdca, plan, design, analyze, check, report, status, next, iterate, gap
KO: 계획, 설계, 분석, 검증, 보고서, 반복, 개선
JA: 計画, 設計, 分析, 検証, 報告
ZH: 计划, 设计, 分析, 验证, 报告
ES: planificar, diseño, analizar, verificar (partial)
```

**Add/Complete Missing Triggers**:
```yaml
ES: planificar, diseño, analizar, verificar, informe, estado, siguiente, iterar, brecha
FR: planifier, conception, analyser, vérifier, rapport, statut, suivant, itérer, écart
DE: planen, Design, analysieren, prüfen, Bericht, Status, nächster, iterieren, Lücke
IT: pianificare, progettazione, analizzare, verificare, rapporto, stato, prossimo, iterare, gap
```

#### 2.2.2 starter/SKILL.md

**Current Triggers (4 languages)**:
```
EN: beginner, first project, new to coding, learn to code, simple website, portfolio, landing page, HTML CSS
KO: 초보자, 입문, 처음, 코딩 배우기, 웹사이트 만들기, 이해 안 돼, 설명해, 어려워, 모르겠
JA: 初心者, 入門, ウェブサイト作成, わからない, 教えて, 難しい
ZH: 新手, 学习编程, 不懂, 不明白, 太难
```

**Add Missing Triggers**:
```yaml
ES: principiante, primer proyecto, nuevo en programación, aprender a programar, sitio web simple, no entiendo, explica, difícil
FR: débutant, premier projet, nouveau en programmation, apprendre à coder, site web simple, je ne comprends pas, explique, difficile
DE: Anfänger, erstes Projekt, neu beim Programmieren, Programmieren lernen, einfache Website, verstehe nicht, erkläre, schwierig
IT: principiante, primo progetto, nuovo alla programmazione, imparare a programmare, sito web semplice, non capisco, spiega, difficile
```

#### 2.2.3 dynamic/SKILL.md

**Current Triggers (4 languages)**:
```
EN: bkend, BaaS, authentication, login, signup, database, fullstack, backend, API integration, data model
KO: 인증, 로그인, 회원가입, 데이터베이스, 풀스택, 백엔드
JA: 認証, ログイン, データベース
ZH: 身份验证, 数据库
```

**Add Missing Triggers**:
```yaml
ES: autenticación, inicio de sesión, registro, base de datos, fullstack, backend, integración API
FR: authentification, connexion, inscription, base de données, fullstack, backend, intégration API
DE: Authentifizierung, Anmeldung, Registrierung, Datenbank, Fullstack, Backend, API-Integration
IT: autenticazione, accesso, registrazione, database, fullstack, backend, integrazione API
```

#### 2.2.4 enterprise/SKILL.md

**Current Triggers (4 languages)**:
```
EN: CTO, AI Native, enterprise strategy, microservices, architecture decision
KO: 전략, 아키텍처, 마이크로서비스
JA: アーキテクチャ, マイクロサービス
ZH: 架构决策, 微服务
```

**Add Missing Triggers**:
```yaml
ES: estrategia empresarial, arquitectura, microservicios, CTO, nativo de IA
FR: stratégie d'entreprise, architecture, microservices, CTO, natif IA
DE: Unternehmensstrategie, Architektur, Microservices, CTO, KI-nativ
IT: strategia aziendale, architettura, microservizi, CTO, AI nativo
```

#### 2.2.5 claude-code-learning/SKILL.md

**Current Triggers (4 languages)**:
```
EN: claude code learning, tutorial, how to use, guide, learn
KO: 클로드 코드 배우기, 튜토리얼, 사용법, 가이드, 학습
JA: クロードコード学習, チュートリアル, 使い方, ガイド
ZH: claude code 学习, 教程, 如何使用, 指南
```

**Add Missing Triggers**:
```yaml
ES: aprender claude code, tutorial, cómo usar, guía, aprender
FR: apprendre claude code, tutoriel, comment utiliser, guide, apprendre
DE: Claude Code lernen, Tutorial, wie benutzen, Anleitung, lernen
IT: imparare claude code, tutorial, come usare, guida, imparare
```

#### 2.2.6 code-review/SKILL.md

**Current Triggers (4 languages)**:
```
EN: code review, review code, check code, analyze code, code quality
KO: 코드 리뷰, 코드 검토, 코드 분석, 코드 품질
JA: コードレビュー, コード分析, コード品質
ZH: 代码审查, 代码分析, 代码质量
```

**Add Missing Triggers**:
```yaml
ES: revisión de código, revisar código, analizar código, calidad del código
FR: revue de code, réviser le code, analyser le code, qualité du code
DE: Code-Review, Code überprüfen, Code analysieren, Code-Qualität
IT: revisione del codice, rivedere il codice, analizzare il codice, qualità del codice
```

#### 2.2.7 development-pipeline/SKILL.md

**Current Triggers (4 languages)**:
```
EN: development pipeline, phase, development order, where to start, what to do first, how to begin, new project
KO: 개발 파이프라인, 뭐부터, 어디서부터, 순서, 시작
JA: 開発パイプライン, 何から, どこから
ZH: 开发流程, 从哪里开始
```

**Add Missing Triggers**:
```yaml
ES: pipeline de desarrollo, fase, orden de desarrollo, por dónde empezar, proyecto nuevo
FR: pipeline de développement, phase, ordre de développement, par où commencer, nouveau projet
DE: Entwicklungs-Pipeline, Phase, Entwicklungsreihenfolge, wo anfangen, neues Projekt
IT: pipeline di sviluppo, fase, ordine di sviluppo, da dove iniziare, nuovo progetto
```

#### 2.2.8 github-integration/SKILL.md

**Current Triggers (4 languages)**:
```
EN: github stats, repository statistics, github metrics, repo report
KO: 깃허브 통계, 레포지토리 통계, 깃허브 메트릭스
JA: GitHub統計, リポジトリ統計
ZH: GitHub统计, 仓库统计
```

**Add Missing Triggers**:
```yaml
ES: estadísticas de github, estadísticas del repositorio, métricas de github
FR: statistiques github, statistiques du dépôt, métriques github
DE: GitHub-Statistiken, Repository-Statistiken, GitHub-Metriken
IT: statistiche github, statistiche del repository, metriche github
```

---

## 3. Content Translation Specification

### 3.1 hooks/session-start.js

#### 3.1.1 Phase Display Mapping (Line ~50-70)

**Current Korean**:
```javascript
const phaseDisplay = {
  plan: '계획',
  design: '설계',
  do: '구현',
  check: '검증',
  act: '개선',
  completed: '완료',
  archived: '보관됨'
};
```

**Translation**:
```javascript
const phaseDisplay = {
  plan: 'Plan',
  design: 'Design',
  do: 'Implementation',
  check: 'Verification',
  act: 'Improvement',
  completed: 'Completed',
  archived: 'Archived'
};
```

#### 3.1.2 Onboarding Messages

**Current Korean Patterns**:
- `"이전 작업이 있습니다..."` → `"Previous work detected..."`
- `"계속 진행"` → `"Continue"`
- `"새 작업 시작"` → `"Start new task"`
- `"상태 확인"` → `"Check status"`

#### 3.1.3 UI Text Strings

| Korean | English |
|--------|---------|
| 기능 | Feature |
| 현재 단계 | Current Phase |
| 매치율 | Match Rate |
| 반복 | Iteration |
| 다음 단계 | Next Step |
| 완료됨 | Completed |

### 3.2 agents/ Content Translation

#### 3.2.1 enterprise-expert.md

**Prerequisites Section (Korean → English)**:

| Korean | English |
|--------|---------|
| 전제조건 확인 | Prerequisites Check |
| 팀 규모 | Team Size |
| 인프라 예산 | Infrastructure Budget |
| 기술 스택 경험 | Tech Stack Experience |
| 운영 역량 | Operational Capability |

#### 3.2.2 pipeline-guide.md

**User Interaction Examples (Korean → English)**:

| Korean | English |
|--------|---------|
| 사용자 상호작용 예시 | User Interaction Examples |
| 다음 단계로 | Next step |
| 현재 진행 상황 | Current progress |

### 3.3 skills/ Content Translation

#### 3.3.1 pdca/SKILL.md (Priority: HIGH)

**Description Translation**:
```yaml
# Current
description: |
  PDCA 사이클 전체를 관리하는 통합 skill.
  "계획", "설계", "분석", "보고서", "상태" 키워드로 자동 호출.
  기존 /pdca-* 명령어를 대체.

# Translation
description: |
  Unified skill managing the complete PDCA cycle.
  Auto-triggered by keywords: "plan", "design", "analyze", "report", "status".
  Replaces legacy /pdca-* commands.
```

**Arguments Table**:

| Korean | English |
|--------|---------|
| Plan 문서 생성 | Create Plan document |
| Design 문서 생성 | Create Design document |
| Do 단계 가이드 (구현 시작) | Do phase guide (start implementation) |
| Gap 분석 실행 (Check 단계) | Run Gap analysis (Check phase) |
| 자동 개선 반복 (Act 단계) | Auto-improvement iteration (Act phase) |
| 완료 보고서 생성 | Generate completion report |
| 완료된 PDCA 문서 아카이브 | Archive completed PDCA documents |
| 현재 PDCA 상태 표시 | Display current PDCA status |
| 다음 단계 가이드 | Guide to next step |

**Action Descriptions**:

| Section | Korean | English |
|---------|--------|---------|
| plan | 존재 여부 확인 | Check existence |
| plan | 없으면 생성 | Create if not exists |
| plan | 있으면 내용 표시 및 수정 제안 | Display and suggest modifications if exists |
| design | 필수 - 없으면 plan 먼저 실행 안내 | Required - guide to run plan first if missing |
| do | Design 문서 존재 확인 | Verify Design document exists |
| do | 구현 순서 체크리스트 | Implementation order checklist |
| do | 주요 파일/컴포넌트 목록 | Key files/components list |
| do | 의존성 설치 명령어 | Dependency installation commands |
| analyze | Do 완료 상태 확인 | Verify Do completion status |
| analyze | Match Rate 계산 및 Gap 목록 생성 | Calculate Match Rate and generate Gap list |
| iterate | Gap 목록 기반 자동 코드 수정 | Auto code fix based on Gap list |
| iterate | 수정 후 자동으로 Check 재실행 | Auto re-run Check after fixes |
| iterate | 최대 반복 | Maximum iterations |
| iterate | 종료 조건 | Exit condition |
| report | Check >= 90% 확인 (미달 시 경고) | Verify Check >= 90% (warn if below) |
| report | 통합 보고서 | Consolidated report |
| archive | Report 완료 상태 확인 | Verify Report completion status |
| archive | 폴더 생성 | Create folder |
| archive | 문서 이동 | Move documents |
| archive | 원본 위치에서 삭제 | Delete from original location |

**Status Output Example**:
```
# Current
📊 PDCA 현황
─────────────────────────────
기능: user-authentication
단계: Check (Gap Analysis)
매치율: 85%
반복: 2/5
─────────────────────────────

# Translation
📊 PDCA Status
─────────────────────────────
Feature: user-authentication
Phase: Check (Gap Analysis)
Match Rate: 85%
Iteration: 2/5
─────────────────────────────
```

**Next Step Guide Table**:

| Korean Current | Korean Next | English Current | English Next |
|----------------|-------------|-----------------|--------------|
| 없음 | plan | None | plan |
| plan | design | plan | design |
| design | do | design | do |
| do | check | do | check |
| check (<90%) | act | check (<90%) | act |
| check (>=90%) | report | check (>=90%) | report |
| report | archive | report | archive |

**Auto-Trigger Keywords Table**:

| Korean Keyword | Suggested Action | English Keyword | Suggested Action |
|----------------|------------------|-----------------|------------------|
| 계획, 기획 | plan | plan, planning | plan |
| 설계, 아키텍처 | design | design, architecture | design |
| 구현, 개발 | do | implement, develop | do |
| 검증, 분석 | analyze | verify, analyze | analyze |
| 개선, 반복 | iterate | improve, iterate | iterate |
| 완료, 보고서 | report | complete, report | report |
| 아카이브, 정리, 보관 | archive | archive, cleanup, store | archive |

#### 3.3.2 starter/SKILL.md

**Description Translation**:
```yaml
# Current
"init starter" 또는 "starter init"으로 프로젝트 초기화

# Translation
Project initialization with "init starter" or "starter init"
```

**Actions Table**:

| Korean | English |
|--------|---------|
| 프로젝트 초기화 | Project initialization |
| 폴더 구조 생성 | Create folder structure |
| 기본 파일 생성 | Create base files |
| 다음 단계 안내 | Guide to next steps |

#### 3.3.3 dynamic/SKILL.md

**Similar pattern to starter/SKILL.md**

#### 3.3.4 enterprise/SKILL.md

**Similar pattern to starter/SKILL.md**

#### 3.3.5 claude-code-learning/SKILL.md (Priority: HIGH)

**Learning Levels Content**:

| Section | Korean | English |
|---------|--------|---------|
| Level 1 | 기본 개념 이해 | Understanding Basic Concepts |
| Level 2 | 도구 활용법 | Tool Usage |
| Level 3 | 프로젝트 구조화 | Project Structuring |
| Level 4 | 고급 기능 | Advanced Features |
| Level 5 | 마스터리 | Mastery |

#### 3.3.6 code-review/SKILL.md

**Review Categories**:

| Korean | English |
|--------|---------|
| 중복 코드 탐지 | Duplicate Code Detection |
| 함수/파일 복잡도 분석 | Function/File Complexity Analysis |
| 미사용 코드 발견 | Unused Code Discovery |
| 보안 취약점 검사 | Security Vulnerability Check |
| 성능 이슈 탐지 | Performance Issue Detection |

### 3.4 templates/ Content Translation

#### 3.4.1 do.template.md

**Checklist Items**:

| Korean | English |
|--------|---------|
| 레벨에 맞는 레이어 구조 준수 | Follow layer structure appropriate for level |
| 의존성 방향 준수 | Follow dependency direction |
| 코딩 컨벤션 준수 여부 확인 | Verify coding convention compliance |
| 보안 취약점 확인 | Check for security vulnerabilities |
| 테스트 작성 | Write tests |
| 문서 업데이트 | Update documentation |

#### 3.4.2 schema.template.md

**Field Descriptions**:

| Korean | English |
|--------|---------|
| 데이터 구조 및 용어 정의 | Data Structure and Terminology Definition |
| 시스템 사용자 | System User |
| 입력값 검증 실패 | Input Validation Failure |
| 필수 필드 | Required Field |
| 선택 필드 | Optional Field |

#### 3.4.3 convention.template.md

**Folder Descriptions**:

| Korean | English |
|--------|---------|
| UI 컴포넌트 | UI Components |
| 기능별 모듈 | Feature Modules |
| 유틸리티 | Utilities |
| 공통 타입 | Common Types |
| 상수 정의 | Constants Definition |

### 3.5 bkit-system/ Content Translation

Translate Korean examples in code blocks while preserving the 8-language trigger patterns.

---

## 4. Terminology Consistency Table

| Korean | English | Context |
|--------|---------|---------|
| 계획 | Plan | PDCA phase |
| 설계 | Design | PDCA phase |
| 구현 | Implementation | PDCA Do phase |
| 검증 | Verification / Check | PDCA phase |
| 분석 | Analysis | Gap analysis |
| 개선 | Improvement | PDCA Act phase |
| 보고서 | Report | Completion report |
| 단계 | Phase / Stage | Pipeline stage |
| 기능 | Feature | PDCA feature name |
| 초보자 | Beginner | User level |
| 가이드 | Guide | Documentation |
| 프로젝트 초기화 | Project initialization | Setup |
| 폴더 구조 | Folder structure | Project layout |
| 환경변수 | Environment variables | Config |
| 코딩 컨벤션 | Coding conventions | Standards |
| 레이어 구조 | Layer structure | Architecture |
| 의존성 방향 | Dependency direction | Architecture |
| 보안 취약점 | Security vulnerabilities | Security |
| 매치율 | Match Rate | Gap analysis metric |
| 반복 | Iteration | PDCA iteration |
| 트리거 | Trigger | Auto-activation keyword |

---

## 5. Implementation Order

### Phase 1: hooks/ (1 file) - Priority: HIGH
1. [ ] Translate session-start.js UI strings
2. [ ] Update phase display mapping
3. [ ] Translate onboarding prompts

### Phase 2: agents/ (11 files) - Priority: HIGH
1. [ ] Add 8-language triggers to 6 incomplete agents
2. [ ] Translate content in enterprise-expert.md
3. [ ] Translate content in pipeline-guide.md
4. [ ] Verify trigger preservation in all agents

### Phase 3: skills/ (21 files) - Priority: HIGH
1. [ ] pdca/SKILL.md - Full translation + trigger completion
2. [ ] starter/SKILL.md - Translation + trigger completion
3. [ ] dynamic/SKILL.md - Translation + trigger completion
4. [ ] enterprise/SKILL.md - Translation + trigger completion
5. [ ] claude-code-learning/SKILL.md - Full translation + trigger completion
6. [ ] code-review/SKILL.md - Translation + trigger completion
7. [ ] development-pipeline/SKILL.md - Trigger completion only
8. [ ] github-integration/SKILL.md - Translation + trigger completion
9. [ ] Verify remaining 13 skills (trigger-only files)

### Phase 4: templates/ (3 files) - Priority: MEDIUM
1. [ ] do.template.md - Full translation
2. [ ] schema.template.md - Full translation
3. [ ] convention.template.md - Full translation

### Phase 5: bkit-system/ (4 files) - Priority: LOW
1. [ ] context-engineering.md - Translate examples
2. [ ] _skills-overview.md - Verify/translate if needed
3. [ ] _agents-overview.md - Verify/translate if needed
4. [ ] _scripts-overview.md - Verify/translate if needed

### Phase 6: Verification
1. [ ] Run `grep -rn '[가-힣]'` to find remaining Korean
2. [ ] Exclude trigger keywords from results
3. [ ] Verify 8-language trigger completeness
4. [ ] Functional testing

---

## 6. File-by-File Change Specification

### 6.1 Summary Table

| File | Korean Lines | Trigger Status | Action |
|------|-------------|----------------|--------|
| hooks/session-start.js | ~50 | N/A | Translate UI |
| agents/enterprise-expert.md | ~10 | 5/8 | Translate + Add 3 |
| agents/pipeline-guide.md | ~15 | 4/8 | Translate + Add 4 |
| agents/bkend-expert.md | 0 | 5/8 | Add 3 triggers |
| agents/design-validator.md | 0 | 4/8 | Add 4 triggers |
| agents/qa-monitor.md | 0 | 4/8 | Add 4 triggers |
| agents/infra-architect.md | 0 | 4/8 | Add 4 triggers |
| skills/pdca/SKILL.md | ~150 | 5/8 | Full translate + Add 3 |
| skills/starter/SKILL.md | ~30 | 4/8 | Translate + Add 4 |
| skills/dynamic/SKILL.md | ~30 | 4/8 | Translate + Add 4 |
| skills/enterprise/SKILL.md | ~30 | 4/8 | Translate + Add 4 |
| skills/claude-code-learning/SKILL.md | ~100 | 4/8 | Full translate + Add 4 |
| skills/code-review/SKILL.md | ~20 | 4/8 | Translate + Add 4 |
| skills/development-pipeline/SKILL.md | 0 | 4/8 | Add 4 triggers |
| skills/github-integration/SKILL.md | ~15 | 4/8 | Translate + Add 4 |
| templates/do.template.md | ~30 | N/A | Full translate |
| templates/schema.template.md | ~40 | N/A | Full translate |
| templates/convention.template.md | ~25 | N/A | Full translate |
| bkit-system/philosophy/context-engineering.md | ~5 | N/A | Translate examples |
| bkit-system/components/*-overview.md | ~5 each | N/A | Verify/translate |

### 6.2 Estimated Changes

- **Total files**: 40
- **Lines to translate**: ~600
- **Triggers to add**: ~100 (across 14 files)
- **Estimated effort**: Medium

---

## 7. Validation Criteria

### 7.1 Completion Checklist

- [ ] All Korean content translated (except triggers)
- [ ] All 8-language triggers preserved
- [ ] Missing triggers added to all agents/skills
- [ ] Terminology consistency verified
- [ ] `grep -rn '[가-힣]'` shows only trigger keywords
- [ ] No functional changes introduced
- [ ] Version updated to 1.4.5

### 7.2 Quality Checks

| Check | Method | Expected Result |
|-------|--------|-----------------|
| Korean content | `grep -rn '[가-힣]'` | Only trigger keywords |
| Trigger count | Manual review | 8 languages in all agents/skills |
| Terminology | Search consistency | Same term → same translation |
| Functionality | Manual test | No behavior changes |

---

## 8. Risk Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Accidental trigger deletion | High | Medium | Pre-list all triggers before translation |
| Meaning lost in translation | Medium | Low | Review each translation carefully |
| Code comment damage | Low | Low | Only translate description text, not code |
| Missing file | Medium | Low | Use file list from plan document |

---

## 9. Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-01-27 | Initial draft | bkit Team |

---

## 10. Related Documents

- [Plan Document](../../01-plan/features/korean-to-english-translation.plan.md)
- [README.md](../../../README.md) - Language Support section
- [CHANGELOG.md](../../../CHANGELOG.md) - v1.4.0 changes
- [context-engineering.md](../../../bkit-system/philosophy/context-engineering.md)
