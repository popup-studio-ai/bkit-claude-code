# bkit v2.0.0 사용자 가이드

> **bkit — AI Native Development OS**
>
> Claude Code 플러그인으로, PDCA 방법론 기반의 체계적인 AI 네이티브 개발 환경을 제공합니다.
> 36개 스킬, 31개 에이전트, 18개 훅 이벤트, 2개 MCP 서버를 통해
> 계획부터 배포까지 전 개발 사이클을 AI와 함께 관리합니다.

---

## 목차

1. [시작하기](#1-시작하기)
2. [핵심 개념: PDCA 사이클](#2-핵심-개념-pdca-사이클)
3. [PDCA 명령어 완전 가이드](#3-pdca-명령어-완전-가이드)
4. [자동화 레벨 (L0-L4)](#4-자동화-레벨-l0-l4)
5. [프로젝트 레벨별 사용법](#5-프로젝트-레벨별-사용법)
6. [36개 스킬 완전 가이드](#6-36개-스킬-완전-가이드)
7. [31개 에이전트 완전 가이드](#7-31개-에이전트-완전-가이드)
8. [PM Agent Team — 제품 분석](#8-pm-agent-team--제품-분석)
9. [CTO Agent Team — 팀 개발](#9-cto-agent-team--팀-개발)
10. [품질 관리 시스템](#10-품질-관리-시스템)
11. [체크포인트와 롤백](#11-체크포인트와-롤백)
12. [안전장치 (Guardrails)](#12-안전장치-guardrails)
13. [감사 로그와 의사결정 추적](#13-감사-로그와-의사결정-추적)
14. [CLI 대시보드](#14-cli-대시보드)
15. [MCP 서버](#15-mcp-서버)
16. [출력 스타일](#16-출력-스타일)
17. [설정 파일 가이드](#17-설정-파일-가이드)
18. [메모리 시스템](#18-메모리-시스템)
19. [9-Phase 개발 파이프라인](#19-9-phase-개발-파이프라인)
20. [고급 기능](#20-고급-기능)
21. [자주 묻는 질문 (FAQ)](#21-자주-묻는-질문-faq)
22. [부록: 워크플로우 프리셋](#22-부록-워크플로우-프리셋)

---

## 1. 시작하기

### 1.1 bkit이란?

bkit(Vibecoding Kit)은 Claude Code CLI에 설치하는 **플러그인**입니다.
AI와 함께 소프트웨어를 개발할 때, "감"(vibe)에 의존하는 것이 아니라
**PDCA(Plan-Do-Check-Act) 사이클**이라는 체계적인 방법론을 적용하여
품질 높은 코드를 빠르게 만들어냅니다.

**핵심 가치:**
- **계획 먼저**: 코드를 작성하기 전에 반드시 Plan/Design 문서를 만듭니다
- **측정 기반 결정**: Match Rate, 품질 점수 등 숫자로 판단합니다
- **안전한 자동화**: L0(수동)부터 L4(완전자동)까지 단계적으로 AI에게 권한을 위임합니다
- **추적 가능한 AI**: 모든 AI 결정을 감사 로그로 기록합니다

### 1.2 설치 확인

bkit이 정상 설치되었는지 확인하려면 Claude Code에서 다음을 입력합니다:

```
/bkit
```

이 명령어를 실행하면 사용 가능한 모든 bkit 기능 목록이 표시됩니다.

### 1.3 첫 번째 프로젝트 시작

프로젝트를 처음 시작할 때는 프로젝트 레벨을 선택합니다:

| 레벨 | 대상 | 명령어 | 설명 |
|------|------|--------|------|
| **Starter** | 정적 웹사이트, 포트폴리오 | `/starter` | HTML/CSS/JS 기반 |
| **Dynamic** | 풀스택 웹앱, SaaS MVP | `/dynamic` | bkend.ai BaaS + Next.js |
| **Enterprise** | 대규모 시스템, MSA | `/enterprise` | K8s + Terraform + 모노레포 |

**예시: Dynamic 프로젝트 시작**
```
사용자: "로그인 기능이 있는 블로그 웹앱을 만들고 싶어"
→ bkit이 자동으로 Dynamic 레벨 감지
→ /dynamic init 실행 제안
```

### 1.4 기본 워크플로우 한눈에 보기

```
[PM 분석] → [계획(Plan)] → [설계(Design)] → [구현(Do)] → [검증(Check)] → [보고서(Report)]
                                                              ↕
                                                         [개선(Act)]
```

1. **PM 분석** (선택): 제품 발견, 시장 조사, PRD 작성
2. **Plan**: 기능 요구사항과 구현 방향 정리
3. **Design**: 상세 설계 (API, 스키마, 컴포넌트 구조)
4. **Do**: 실제 코드 구현
5. **Check**: 설계-구현 갭 분석 (Match Rate 측정)
6. **Act**: Match Rate < 90%이면 자동 개선 반복
7. **Report**: 완료 보고서 생성

---

## 2. 핵심 개념: PDCA 사이클

### 2.1 PDCA란?

PDCA는 **Plan-Do-Check-Act**의 약자로, 품질 관리의 핵심 방법론입니다.
bkit은 이 개념을 소프트웨어 개발에 적용하여, AI가 만든 코드의 품질을
체계적으로 보장합니다.

### 2.2 상태 머신

bkit의 PDCA는 **10개 상태**와 **20개 전환**으로 구성된 상태 머신입니다:

```
상태: idle → pm → plan → design → do → check → act → report → archived → error
```

각 상태 전환에는 **Guard(조건 검사)**가 있어서,
조건을 충족해야만 다음 단계로 넘어갑니다.

#### 주요 전환과 조건

| 현재 상태 | → 다음 상태 | 조건 |
|-----------|-------------|------|
| idle → pm | 새 Feature 시작 | 없음 |
| pm → plan | PRD 작성 완료 | 문서 존재 확인 |
| plan → design | Plan 문서 완료 | 문서 존재 확인 |
| design → do | 설계 승인 | L2 이상: 자동 승인 / L0-L1: 수동 승인 |
| do → check | 구현 완료 | Do 완료 감지 (3-layer 시스템) |
| check → report | 검증 통과 | **Match Rate ≥ 90%** |
| check → act | 개선 필요 | Match Rate < 90%, 반복 횟수 < 5 |
| act → check | 개선 후 재검증 | 없음 |
| report → archived | 보관 | 없음 |

#### 특수 전환

| 전환 | 설명 |
|------|------|
| * → error | 어떤 단계에서든 에러 발생 시 |
| error → (이전 상태) | resume point에서 복구 |
| * → idle | Feature 초기화 (RESET) |
| * → (이전 체크포인트) | 체크포인트로 롤백 (ROLLBACK) |
| * → archived | 7일 비활성 시 자동 보관 (TIMEOUT) |

### 2.3 Match Rate란?

**Match Rate**는 설계(Design) 문서와 실제 구현(코드) 사이의 일치율입니다.

- **90% 이상**: 통과 → Report 단계로 이동
- **90% 미만**: 자동 개선(Act) 시작 → 재검증(Check) → 반복 (최대 5회)

이 수치는 `gap-detector` 에이전트가 설계 문서의 항목과 실제 코드를
하나하나 대조하여 계산합니다.

### 2.4 문서 저장 위치

| 단계 | 경로 | 파일명 패턴 |
|------|------|-------------|
| PM 분석 | `docs/00-pm/` | `{feature}.prd.md` |
| Plan | `docs/01-plan/features/` | `{feature}.plan.md` |
| Design | `docs/02-design/features/` | `{feature}.design.md` |
| Analysis | `docs/03-analysis/` | `{feature}.analysis.md` |
| Report | `docs/04-report/features/` | `{feature}.report.md` |
| Archive | `docs/archive/{date}/{feature}/` | 전체 문서 복사본 |

---

## 3. PDCA 명령어 완전 가이드

### 3.1 통합 명령어: `/pdca`

`/pdca`는 PDCA 사이클의 모든 단계를 관리하는 통합 명령어입니다.

#### 기본 사용법

```
/pdca [action] [feature-name]
```

#### 사용 가능한 action

| Action | 설명 | 예시 |
|--------|------|------|
| `plan` | Plan 문서 생성 | `/pdca plan user-auth` |
| `design` | Design 문서 생성 | `/pdca design user-auth` |
| `do` | 구현 시작 | `/pdca do user-auth` |
| `analyze` | Gap 분석 실행 | `/pdca analyze user-auth` |
| `iterate` | 자동 개선 반복 | `/pdca iterate user-auth` |
| `report` | 완료 보고서 생성 | `/pdca report user-auth` |
| `status` | 현재 상태 확인 | `/pdca status` |
| `next` | 다음 단계 안내 | `/pdca next` |
| `pm` | PM 분석 시작 | `/pdca pm user-auth` |
| `team` | CTO 팀 모드 | `/pdca team user-auth` |
| `archive` | Feature 보관 | `/pdca archive user-auth` |

### 3.2 단계별 상세 사용법

#### Step 1: Plan 작성

```
/pdca plan user-auth
```

**무엇을 하나요?**
- Feature의 요구사항을 정리합니다
- 구현 범위(scope)를 정의합니다
- 기술 스택과 접근 방식을 결정합니다

**생성되는 문서:** `docs/01-plan/features/user-auth.plan.md`

**문서에 포함되는 내용:**
- Executive Summary (개요)
- 기능 요구사항 목록
- 기술 스택 결정
- 구현 우선순위
- 예상 파일 구조
- 제약 조건 및 리스크

#### Step 2: Design 작성

```
/pdca design user-auth
```

**무엇을 하나요?**
- Plan을 바탕으로 상세 설계를 합니다
- API 엔드포인트, DB 스키마, 컴포넌트 구조를 정의합니다

**생성되는 문서:** `docs/02-design/features/user-auth.design.md`

**문서에 포함되는 내용:**
- 아키텍처 다이어그램
- API 엔드포인트 설계
- 데이터 모델/스키마
- 컴포넌트 구조
- 에러 처리 전략
- 보안 고려사항

> **중요:** Design → Do 전환 시 자동으로 체크포인트가 생성됩니다.
> 이 체크포인트를 사용하면 언제든 설계 완료 시점으로 돌아갈 수 있습니다.

#### Step 3: 구현 (Do)

```
/pdca do user-auth
```

또는 자연어로:

```
"user-auth의 로그인 API를 구현해줘"
```

**무엇을 하나요?**
- Design 문서를 기반으로 실제 코드를 작성합니다
- bkit이 설계 문서를 참조하면서 코드를 생성합니다

#### Step 4: 검증 (Check)

```
/pdca analyze user-auth
```

또는 자연어로:

```
"구현이 설계대로 됐는지 검증해줘"
```

**무엇을 하나요?**
- `gap-detector` 에이전트가 설계 문서와 코드를 대조합니다
- Match Rate를 계산합니다
- 누락된 항목, 불일치 사항을 보고합니다

**결과 예시:**
```
─────────────────────────────────
📊 Gap Analysis Results
─────────────────────────────────
Match Rate: 87%
✅ Matched: 26/30 items
❌ Missing: 4 items
  - POST /api/auth/refresh 미구현
  - 비밀번호 재설정 플로우 누락
  - Rate limiting 미적용
  - Error response 형식 불일치
─────────────────────────────────
```

#### Step 5: 자동 개선 (Act)

Match Rate가 90% 미만이면 자동으로 개선 모드에 진입합니다.

```
/pdca iterate user-auth
```

또는 자연어로:

```
"자동으로 고쳐줘" / "개선해줘" / "iterate"
```

**무엇을 하나요?**
- 누락 항목을 자동으로 구현합니다
- 구현 후 다시 Gap 분석을 실행합니다
- Match Rate ≥ 90% 또는 최대 5회 반복까지 계속합니다

**반복 과정:**
```
Iteration 1: 87% → 구현 → 재분석
Iteration 2: 93% → 통과! → Report 단계로 이동
```

#### Step 6: 보고서 (Report)

```
/pdca report user-auth
```

**무엇을 하나요?**
- PDCA 사이클 전체를 요약하는 완료 보고서를 생성합니다
- 변경된 파일 목록, 품질 지표, 교훈 등을 정리합니다

**생성되는 문서:** `docs/04-report/features/user-auth.report.md`

### 3.3 상태 확인과 다음 단계

```
/pdca status      # 현재 모든 Feature의 PDCA 상태 표시
/pdca next        # 다음으로 해야 할 작업 안내
```

**상태 표시 예시:**
```
┌─── Workflow Map: user-auth ──────────────────────┐
│                                                    │
│  [PM ✓]──→[PLAN ✓]──→[DESIGN ✓]──→[DO ~]         │
│                                                    │
│  Iter: 0  •  matchRate: —                         │
└───────────────────────────────────────────────────┘
```

---

## 4. 자동화 레벨 (L0-L4)

### 4.1 5단계 자동화

bkit은 AI에게 위임하는 권한을 5단계로 조절할 수 있습니다.
처음에는 낮은 레벨에서 시작하고, 신뢰가 쌓이면 점진적으로 올릴 수 있습니다.

| 레벨 | 이름 | 설명 | 적합한 상황 |
|------|------|------|-------------|
| **L0** | Manual | 모든 작업에 사용자 승인 필요 | 처음 사용, 민감한 프로젝트 |
| **L1** | Guided | 읽기만 자동, 쓰기는 승인 | 코드베이스 파악 중 |
| **L2** | Semi-Auto | 비파괴적 작업 자동, 파괴적 작업만 승인 | **기본값, 일반 개발** |
| **L3** | Auto | 대부분 자동, 고위험 작업만 승인 | 익숙한 프로젝트 |
| **L4** | Full-Auto | 완전 자동, 사후 리뷰만 | 반복 작업, 자동화 파이프라인 |

### 4.2 레벨 변경 방법

```
/control level 3         # L3으로 변경
/control level semi-auto  # L2로 변경 (이름으로도 가능)
/control status          # 현재 레벨 확인
```

또는 자연어로:
```
"자동화 레벨을 올려줘"
"수동 모드로 전환해줘"
```

### 4.3 레벨별 PDCA 동작 차이

| PDCA 전환 | L0-L1 | L2 (기본) | L3-L4 |
|-----------|-------|-----------|-------|
| Plan → Design | 사용자 승인 | 자동 | 자동 |
| Design → Do | **사용자 승인** | 자동 | 자동 |
| Do → Check | 사용자 승인 | 자동 | 자동 |
| Check → Act (반복) | 사용자 승인 | 자동 | 자동 |
| Check → Report | 사용자 승인 | 자동 | 자동 |

### 4.4 Trust Score — 자동 레벨 조정

bkit은 **Trust Score (0-100점)**를 계산하여 자동 레벨 조정을 제안합니다.

**점수 구성 요소:**

| 요소 | 비중 | 설명 |
|------|------|------|
| PDCA 완료율 | 25% | 사이클을 끝까지 완료한 비율 |
| Gate 통과율 | 20% | 품질 게이트를 한번에 통과한 비율 |
| 롤백 빈도 | 15% | 낮을수록 좋음 |
| 파괴적 작업 차단율 | 15% | 위험한 작업이 차단된 비율 |
| 반복 효율성 | 15% | 적은 반복으로 통과한 비율 |
| 사용자 오버라이드율 | 10% | 낮을수록 좋음 |

**레벨 업그레이드 조건:**
- L0 → L1: 20점 이상
- L1 → L2: 40점 이상
- L2 → L3: 65점 이상
- L3 → L4: 85점 이상

```
/control trust    # 현재 Trust Score 확인
```

### 4.5 비상 정지

문제가 발생했을 때 즉시 안전 모드로 전환합니다:

```
/control stop     # 비상 정지 (L1으로 즉시 하강)
Ctrl+C            # 키보드 단축키로 비상 정지
```

비상 정지 후 복구:
```
/control resume   # 이전 레벨로 복구
```

---

## 5. 프로젝트 레벨별 사용법

### 5.1 Starter 레벨 — 정적 웹사이트

**대상:** 포트폴리오, 랜딩페이지, 회사 소개 사이트 등 백엔드 없는 프로젝트

**시작 명령어:**
```
/starter
```

또는:
```
"포트폴리오 웹사이트를 만들고 싶어"
→ bkit이 Starter 레벨 자동 감지
```

**주요 특징:**
- HTML/CSS/JavaScript 기반
- 서버/데이터베이스 불필요
- 간단한 PDCA 사이클 (Plan → Design → Do → Check → Report)
- Match Rate 기준: 80% (Enterprise보다 낮음)
- `bkit-learning` 출력 스타일 권장 (학습 포인트 자동 표시)

**사용 가능한 파이프라인 Phase:**
1. Phase 1: 스키마/용어 정의
2. Phase 2: 코딩 컨벤션
3. Phase 3: 목업/와이어프레임
5. Phase 5: 디자인 시스템
6. Phase 6: UI 구현
7. Phase 7: SEO/보안
9. Phase 9: 배포

### 5.2 Dynamic 레벨 — 풀스택 웹앱

**대상:** 로그인 기능이 있는 웹앱, SaaS MVP, 데이터베이스가 필요한 프로젝트

**시작 명령어:**
```
/dynamic
```

또는:
```
"회원가입이 있는 블로그를 만들어줘"
→ bkit이 Dynamic 레벨 자동 감지
```

**주요 특징:**
- bkend.ai BaaS 플랫폼 활용 (서버 관리 불필요)
- Next.js App Router 기반
- 인증(회원가입/로그인), DB, 파일 저장소 포함
- Match Rate 기준: 90%
- CTO Agent Team 사용 가능

**bkend.ai 관련 스킬:**

| 스킬 | 역할 | 주요 기능 |
|------|------|-----------|
| `bkend-quickstart` | 초기 설정 | MCP 연결, 프로젝트 생성 |
| `bkend-auth` | 인증 | 회원가입, 로그인, JWT, 소셜 로그인, RBAC |
| `bkend-data` | 데이터 | 테이블, CRUD, 필터링, 관계, 인덱스 |
| `bkend-storage` | 파일 저장 | Presigned URL 업로드, CDN, 버킷 |
| `bkend-cookbook` | 튜토리얼 | 10개 프로젝트 가이드 (투두앱~SaaS) |

### 5.3 Enterprise 레벨 — 대규모 시스템

**대상:** 마이크로서비스, 쿠버네티스, 고트래픽 시스템

**시작 명령어:**
```
/enterprise
```

**주요 특징:**
- Kubernetes + Terraform + AWS 인프라
- 모노레포 아키텍처
- Match Rate 기준: 95%
- Check 단계에서 병렬 분석 (Gap분석 + 코드품질 + 보안리뷰 동시 실행)
- 모든 Phase 전환에 사용자 승인 필요
- CTO Agent Team 5인 체제

---

## 6. 36개 스킬 완전 가이드

스킬(Skill)은 bkit의 **구조화된 전문 지식**입니다.
자연어로 대화하면 bkit이 적절한 스킬을 자동으로 활성화합니다.

### 6.1 Workflow 스킬 (9개) — 개발 프로세스 관리

Workflow 스킬은 AI 모델의 발전과 무관하게 항상 필요한 **프로세스 관리 도구**입니다.

| 스킬 | 명령어 | 설명 | 사용 예시 |
|------|--------|------|-----------|
| **pdca** | `/pdca [action] [feature]` | PDCA 사이클 전체 관리 | `/pdca plan user-auth` |
| **control** | `/control [action]` | 자동화 레벨 제어 | `/control level 3` |
| **audit** | `/audit [action]` | 감사 로그 조회 | `/audit search file_created` |
| **rollback** | `/rollback [action]` | 체크포인트/롤백 | `/rollback list` |
| **pdca-batch** | `/pdca-batch [action]` | 다중 Feature 관리 | `/pdca-batch status` |
| **btw** | `/btw [내용]` | 작업 중 개선 아이디어 기록 | `/btw 이 컴포넌트 재사용 가능하겠다` |
| **cc-version-analysis** | `/cc-version-analysis` | CC 버전 변경 영향 분석 | `/cc-version-analysis v2.1.78 v2.1.79` |
| **skill-create** | `/skill-create [name]` | 프로젝트 전용 스킬 생성 | `/skill-create my-api-helper` |
| **skill-status** | `/skill-status` | 스킬 상태/충돌 확인 | `/skill-status --detail` |

### 6.2 Capability 스킬 (25개) — 전문 기술 지식

#### 프로젝트 초기화 스킬

| 스킬 | 트리거 키워드 | 설명 |
|------|-------------|------|
| **starter** | 정적 사이트, 포트폴리오, 랜딩페이지 | Starter 레벨 프로젝트 초기화 |
| **dynamic** | 풀스택, 로그인, BaaS | Dynamic 레벨 프로젝트 초기화 |
| **enterprise** | 마이크로서비스, k8s, terraform | Enterprise 레벨 프로젝트 초기화 |
| **mobile-app** | 모바일 앱, React Native, Flutter | 모바일 앱 개발 가이드 |
| **desktop-app** | 데스크톱 앱, Electron, Tauri | 데스크톱 앱 개발 가이드 |

#### 9-Phase 개발 파이프라인 스킬

| Phase | 스킬 | 자동 트리거 키워드 |
|-------|------|------------------|
| 1 | **phase-1-schema** | 스키마, 용어, 데이터 모델 |
| 2 | **phase-2-convention** | 컨벤션, 코딩 스타일, 네이밍 |
| 3 | **phase-3-mockup** | 목업, 프로토타입, 와이어프레임 |
| 4 | **phase-4-api** | API 설계, REST API, 엔드포인트 |
| 5 | **phase-5-design-system** | 디자인 시스템, 컴포넌트, 디자인 토큰 |
| 6 | **phase-6-ui-integration** | UI 구현, API 연동, 상태 관리 |
| 7 | **phase-7-seo-security** | SEO, 보안, 메타태그, XSS |
| 8 | **phase-8-review** | 코드 리뷰, 아키텍처 검토, 갭 분석 |
| 9 | **phase-9-deployment** | 배포, CI/CD, Docker, Vercel |

#### bkend.ai BaaS 스킬 (5개)

| 스킬 | 트리거 키워드 | 주요 기능 |
|------|-------------|-----------|
| **bkend-quickstart** | bkend 시작, MCP 연결 | 플랫폼 온보딩, 프로젝트 생성 |
| **bkend-auth** | 로그인, 회원가입, JWT, 인증 | 이메일/소셜 로그인, 세션, RBAC |
| **bkend-data** | 테이블, CRUD, 필터, 쿼리 | 7종 컬럼, 8종 연산자, 관계/조인 |
| **bkend-storage** | 파일 업로드, CDN, 버킷 | Presigned URL, 4종 접근 수준 |
| **bkend-cookbook** | 튜토리얼, 예제, 블로그 만들기 | 10개 프로젝트 가이드 + FAQ |

#### 유틸리티 스킬

| 스킬 | 명령어 | 설명 |
|------|--------|------|
| **code-review** | `/code-review` | 코드 품질, 버그 탐지, 모범 사례 확인 |
| **zero-script-qa** | `/zero-script-qa` | 테스트 스크립트 없이 Docker 로그로 QA |
| **claude-code-learning** | `/claude-code-learning` | Claude Code 사용법 학습 |
| **development-pipeline** | `/development-pipeline` | 9-Phase 전체 파이프라인 안내 |
| **bkit-templates** | 자동 트리거 | PDCA 문서 템플릿 제공 |
| **bkit-rules** | 자동 트리거 | bkit 내부 규칙 참조 |

### 6.3 Hybrid 스킬 (2개) — 프로세스 + 전문 지식

| 스킬 | 명령어 | 설명 |
|------|--------|------|
| **plan-plus** | `/plan-plus [feature]` | 브레인스토밍 강화 Plan (5단계 의도 탐색) |
| **pm-discovery** | `/pdca pm [feature]` | PM 팀 기반 제품 발견 → PRD 생성 |

### 6.4 자동 트리거 (8개 언어 지원)

스킬은 명령어 없이도 **자연어 키워드**로 자동 활성화됩니다.
한국어, 영어, 일본어, 중국어, 스페인어, 프랑스어, 독일어, 이탈리아어를 지원합니다.

**예시:**
```
사용자: "로그인 기능을 설계해줘"
→ bkit이 "로그인" → bkend-auth 스킬 + "설계" → PDCA design 단계 감지
→ 적절한 스킬과 에이전트 자동 활성화
```

---

## 7. 31개 에이전트 완전 가이드

에이전트(Agent)는 **역할 기반으로 자율 작업하는 AI 전문가**입니다.
스킬이 "지식"이라면, 에이전트는 그 지식을 활용하여 "행동"하는 주체입니다.

### 7.1 에이전트 모델 분류

| 모델 | 수 | 특징 | 용도 |
|------|---|------|------|
| **Opus** | 10개 | 고성능, 복잡한 추론 | 아키텍처 결정, 품질 검증, 팀 리더 |
| **Sonnet** | 19개 | 균형, 효율적 | 일반 분석, 코드 생성, 모니터링 |
| **Haiku** | 2개 | 빠르고 경제적 | 파이프라인 가이드, 초보자 안내 |

### 7.2 핵심 에이전트 상세

#### CTO/리더 에이전트

| 에이전트 | 모델 | 역할 | 언제 활성화되나요? |
|---------|------|------|------------------|
| **cto-lead** | Opus | PDCA 전체 워크플로우 조율자 | `/pdca team` 실행 시 |
| **pm-lead** | Opus | PM 팀 오케스트레이터 | `/pdca pm` 실행 시 |

#### 아키텍처/전문가 에이전트

| 에이전트 | 모델 | 역할 | 자동 트리거 키워드 |
|---------|------|------|------------------|
| **enterprise-expert** | Opus | 마이크로서비스, K8s 전략 | CTO, 아키텍처, 마이크로서비스 |
| **infra-architect** | Opus | AWS/K8s/Terraform 설계 | AWS, 인프라, 쿠버네티스 |
| **security-architect** | Opus | 보안 취약점 분석, OWASP | 보안, 인증, 취약점 |
| **frontend-architect** | Sonnet | React/Next.js UI 설계 | 프론트엔드, UI 아키텍처, 컴포넌트 |
| **bkend-expert** | Sonnet | bkend.ai BaaS 전문 | BaaS, 백엔드, 풀스택 |

#### 품질 검증 에이전트

| 에이전트 | 모델 | 역할 | 자동 트리거 키워드 |
|---------|------|------|------------------|
| **gap-detector** | Opus | 설계-구현 갭 분석 | 검증, 맞아?, 확인해줘 |
| **code-analyzer** | Opus | 코드 품질/보안 분석 | 분석, 품질, 이상해 |
| **design-validator** | Opus | 설계 문서 일관성 검증 | 설계 검증, 문서 검토 |
| **qa-strategist** | Sonnet | 테스트 전략 수립 | 테스트 전략, QA 계획 |
| **qa-monitor** | Sonnet | Docker 로그 실시간 QA | 테스트, 로그 분석 |

#### 자동화/반복 에이전트

| 에이전트 | 모델 | 역할 | 자동 트리거 키워드 |
|---------|------|------|------------------|
| **pdca-iterator** | Sonnet | 자동 개선 반복 (max 5회) | 개선해줘, 고쳐줘, iterate |
| **report-generator** | Sonnet | PDCA 완료 보고서 생성 | 보고서, 요약, report |

#### PM 팀 에이전트

| 에이전트 | 모델 | 역할 |
|---------|------|------|
| **pm-discovery** | Sonnet | Opportunity Solution Tree 분석 |
| **pm-strategy** | Sonnet | JTBD (Jobs To Be Done) + Lean Canvas |
| **pm-research** | Sonnet | 페르소나, 경쟁사 분석, TAM/SAM/SOM |
| **pm-prd** | Sonnet | 최종 8-섹션 PRD 문서 생성 |

#### 가이드 에이전트

| 에이전트 | 모델 | 역할 | 자동 트리거 키워드 |
|---------|------|------|------------------|
| **starter-guide** | Haiku | 초보자 가이드 | 도움, 이해 안 돼, 어려워 |
| **pipeline-guide** | Haiku | 개발 파이프라인 안내 | 뭐부터, 어디서부터, 순서 |

#### PDCA 평가 에이전트 (6개)

각 PDCA 단계의 품질을 평가하는 전문 에이전트입니다:

| 에이전트 | 평가 대상 |
|---------|-----------|
| **pdca-eval-pm** | PM 분석 깊이, 스킬 니즈 추출 |
| **pdca-eval-plan** | 프로젝트 컨텍스트 인식, Plan 정확도 |
| **pdca-eval-design** | 설계 정확도, 도메인 특화 적용 |
| **pdca-eval-do** | 구현 속도, 첫 시도 정확도 |
| **pdca-eval-check** | 검증 범위, 도메인 특화 검증 |
| **pdca-eval-act** | 자기 개선 루프, 학습 보존 |

#### 버전 분석 에이전트

| 에이전트 | 모델 | 역할 |
|---------|------|------|
| **cc-version-researcher** | Opus | CC CLI 버전 변경 사항 조사 |
| **bkit-impact-analyst** | Opus | CC 변경이 bkit에 미치는 영향 분석 |

---

## 8. PM Agent Team — 제품 분석

### 8.1 개요

코드를 작성하기 전에 **"무엇을 만들 것인가"**를 분석하는 단계입니다.
4개의 PM 전문 에이전트가 병렬로 분석하여 PRD(제품 요구사항 문서)를 생성합니다.

### 8.2 사용 방법

```
/pdca pm user-auth
```

또는 자연어로:
```
"로그인 기능에 대해 PM 분석 해줘"
"PRD를 만들어줘"
```

### 8.3 PM 팀 워크플로우

```
pm-lead (오케스트레이터)
  ├── pm-discovery    → Opportunity Solution Tree 분석
  ├── pm-strategy     → JTBD 6-Part + Lean Canvas
  ├── pm-research     → 페르소나 + 경쟁사 + 시장 규모
  └── pm-prd          → 위 3개 결과를 종합하여 PRD 작성
```

**Phase별 작업:**

| Phase | 에이전트 | 산출물 |
|-------|---------|--------|
| 1. Discovery | pm-discovery | 기회 맵, 고객 니즈, 페인 포인트 |
| 2. Strategy | pm-strategy | 가치 제안, 비즈니스 모델 가설 |
| 3. Research | pm-research | 사용자 페르소나, 경쟁 분석, TAM/SAM/SOM |
| 4. PRD | pm-prd | **8-섹션 PRD 문서** |

### 8.4 PRD 문서 구조

생성되는 PRD (`docs/00-pm/{feature}.prd.md`)에는 다음이 포함됩니다:

1. Executive Summary
2. Problem Statement (해결할 문제)
3. Target Users (대상 사용자)
4. Solution Overview (솔루션 개요)
5. Feature Requirements (기능 요구사항)
6. Success Metrics (성공 지표)
7. Beachhead Segment (초기 타겟 세그먼트)
8. GTM Strategy (시장 진입 전략)

---

## 9. CTO Agent Team — 팀 개발

### 9.1 개요

복잡한 프로젝트에서는 **CTO가 이끄는 AI 팀**이 함께 작업합니다.
여러 전문 에이전트가 각자 역할을 수행하며, CTO 에이전트가 전체를 조율합니다.

### 9.2 사용 방법

```
/pdca team user-auth
```

> **요구사항:** 환경변수 `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` 설정 필요

### 9.3 팀 구성

**Dynamic 레벨 (4인 팀):**
```
cto-lead (Opus) — 총괄
├── frontend-architect (Sonnet) — UI 설계
├── product-manager (Sonnet) — 요구사항
└── qa-strategist (Sonnet) — 테스트 전략
```

**Enterprise 레벨 (5인 팀):**
```
cto-lead (Opus) — 총괄
├── frontend-architect (Sonnet) — UI 설계
├── product-manager (Sonnet) — 요구사항
├── qa-strategist (Sonnet) — 테스트 전략
└── security-architect (Opus) — 보안 검토
```

### 9.4 오케스트레이션 패턴

CTO 팀은 PDCA 단계에 따라 다른 패턴으로 작업합니다:

| 패턴 | 설명 | 사용 단계 |
|------|------|-----------|
| **Leader** | CTO가 순차적으로 지시 | Plan, Act |
| **Swarm** | 팀원들이 병렬로 작업 | Do (구현) |
| **Council** | 팀원들이 토론/투표로 결정 | Design, Check |
| **Watchdog** | 감시자가 모니터링 | Enterprise Act |

### 9.5 Agent Panel로 팀 상태 확인

```
┌─── Agent Panel ──────────────────────────────┐
│  Pattern: parallel swarm                      │
│                                               │
│  🟢 cto-lead        working   "구현 조율 중"  │
│  🟢 frontend-arch   working   "컴포넌트 생성" │
│  🟡 product-mgr     idle                      │
│  🟢 qa-strategist   working   "테스트 계획"   │
└───────────────────────────────────────────────┘
```

---

## 10. 품질 관리 시스템

### 10.1 7단계 품질 게이트

각 PDCA 단계마다 **품질 게이트**가 있어서, 기준을 충족해야 다음 단계로 넘어갑니다.

| 단계 | 통과 조건 | 실패 조건 (차단) |
|------|-----------|-----------------|
| **PM** | 설계 완성도 ≥ 30% | — |
| **Plan** | 설계 완성도 ≥ 50% | — |
| **Design** | 설계 완성도 ≥ 80% AND 컨벤션 준수율 ≥ 70% | 설계 완성도 < 40% |
| **Do** | 코드 품질 ≥ 60점 AND 치명적 이슈 0개 | 치명적 이슈 > 3개 |
| **Check** | Match Rate ≥ 90% AND 품질 ≥ 70점 AND 이슈 0개 AND API 준수율 ≥ 95% | 이슈 > 0 OR API < 80% |
| **Act** | 반복 효율 ≥ 3%p AND Match Rate ≥ 85% | Match Rate < 60% |
| **Report** | Match Rate ≥ 90% AND 이슈 0개 | Match Rate < 90% OR 이슈 > 0 |

#### 레벨별 기준 차이

| 지표 | Starter | Dynamic | Enterprise |
|------|---------|---------|-----------|
| Match Rate | 80% | 90% | 95% |
| 코드 품질 | 60점 | 60/70점 | 80점 |
| API 준수율 | 90% | 95% | 98% |
| 설계 완성도 | 60% | 80% | 90% |
| 컨벤션 준수율 | 60% | 70% | 90% |

### 10.2 10대 품질 지표 (M1-M10)

bkit은 10가지 지표를 자동으로 수집하고 추적합니다:

| ID | 지표 | 측정 주체 | 단위 | 좋은 방향 |
|----|------|-----------|------|-----------|
| M1 | **Match Rate** | gap-detector | % | 높을수록 |
| M2 | 코드 품질 점수 | code-analyzer | 0-100 | 높을수록 |
| M3 | 치명적 이슈 수 | code-analyzer | 개수 | 낮을수록 |
| M4 | API 준수율 | gap-detector | % | 높을수록 |
| M5 | 런타임 에러율 | qa-monitor | % | 낮을수록 |
| M6 | P95 응답 시간 | qa-monitor | ms | 낮을수록 |
| M7 | 컨벤션 준수율 | code-analyzer | % | 높을수록 |
| M8 | 설계 완성도 | design-validator | 0-100 | 높을수록 |
| M9 | 반복 효율성 | pdca-iterator | %p/반복 | 높을수록 |
| M10 | PDCA 소요 시간 | 자동 계산 | 시간 | 낮을수록 |

**지표 확인 방법:**
```
/pdca status    # 현재 Feature의 지표 표시
/audit summary  # 일별/주간 지표 요약
```

### 10.3 트렌드 분석 (6가지 경보)

bkit은 품질 지표의 추세를 분석하여 문제를 조기에 감지합니다:

| 경보 | 조건 | 의미 |
|------|------|------|
| Match Rate 연속 하락 | 3사이클 연속 하락 | 설계-구현 격차 증가 |
| 치명적 이슈 지속 | 2사이클 이상 이슈 > 0 | 근본 원인 미해결 |
| 코드 품질 저하 | 이동평균 < 75점 | 전반적 품질 저하 |
| 반복 효율 저하 | 이동평균 < 3%p | 개선이 효과 없음 |
| 시간 초과 | 소요시간 > 예산 × 150% | 일정 지연 위험 |
| 컨벤션 급락 | 전 사이클 대비 -10%p | 코딩 규칙 위반 증가 |

---

## 11. 체크포인트와 롤백

### 11.1 체크포인트란?

체크포인트는 PDCA 상태의 **스냅샷**입니다.
문제가 발생했을 때 이전 상태로 안전하게 되돌릴 수 있습니다.

### 11.2 자동 체크포인트 생성 시점

| 시점 | 타입 | 설명 |
|------|------|------|
| Design → Do 전환 | `phase_transition` | 설계 완료 시 자동 생성 |
| 파괴적 작업 감지 시 | `pre_destructive` | `rm -rf` 등 실행 전 자동 생성 |
| PDCA Phase 전환 시 | `phase_transition` | 각 단계 전환마다 (설정 시) |

### 11.3 체크포인트 명령어

```
/rollback list                      # 모든 체크포인트 목록 조회
/rollback to cp-1710842700000       # 특정 체크포인트로 복원
/rollback phase                     # 바로 이전 단계로 롤백
/rollback reset user-auth           # Feature를 idle 상태로 초기화
```

### 11.4 체크포인트 저장 정보

각 체크포인트에는 다음이 포함됩니다:
- PDCA 상태 스냅샷 (현재 단계, Match Rate, 반복 횟수 등)
- SHA-256 무결성 해시 (데이터 손상 방지)
- 생성 시간, 타입, Feature 이름
- 생성 이유 (예: "design→do 전환")

**저장 위치:** `.bkit/checkpoints/`

---

## 12. 안전장치 (Guardrails)

### 12.1 파괴적 작업 감지기 (8개 규칙)

bkit은 위험한 명령어를 자동으로 감지하고 차단합니다:

| 규칙 | 이름 | 감지 패턴 | 심각도 | 기본 조치 |
|------|------|-----------|--------|-----------|
| **G-001** | 재귀 삭제 | `rm -rf`, `rimraf` | 치명적 | **차단** |
| **G-002** | 강제 푸시 | `git push --force`, `git push -f` | 치명적 | **차단** |
| **G-003** | 하드 리셋 | `git reset --hard` | 높음 | 확인 요청 |
| **G-004** | 보호 브랜치 변경 | main/master/release 브랜치 push | 높음 | 확인 요청 |
| **G-005** | 환경 파일 수정 | `.env`, `.env.production` | 높음 | 확인 요청 |
| **G-006** | 비밀 키 접근 | `.key`, `.pem`, `.p12` | 높음 | 확인 요청 |
| **G-007** | 대량 파일 삭제 | 5개 이상 파일 rm 명령 | 중간 | 확인 요청 |
| **G-008** | 루트 디렉터리 작업 | `/` 경로 조작 | 치명적 | **차단** |

**작동 방식:**
```
사용자: "빌드 캐시 전체를 삭제해줘"
→ bkit이 rm -rf 패턴 감지 (G-001)
→ "⚠️ 재귀 삭제가 감지되었습니다. 이 작업을 실행하시겠습니까?"
→ 사용자 승인/거부
```

### 12.2 Blast Radius 분석기 (6개 규칙)

변경 사항의 **영향 범위**를 분석합니다:

| 규칙 | 감지 조건 | 심각도 |
|------|-----------|--------|
| **B-001** | 단일 파일 500줄 이상 변경 | 중간 |
| **B-002** | 10개 이상 파일 동시 변경 | 높음 |
| **B-003** | 20개 이상 신규 파일 생성 | 높음 |
| **B-004** | package.json/lock 파일 변경 | 높음 |
| **B-005** | DB 마이그레이션/스키마 변경 | 치명적 |
| **B-006** | 설정/config 파일 변경 | 중간 |

### 12.3 루프 브레이커 (4개 규칙)

무한 반복을 방지합니다:

| 규칙 | 감지 조건 | 최대 허용 | 조치 |
|------|-----------|-----------|------|
| **LB-001** | PDCA 반복 루프 | 5회 | 중단 |
| **LB-002** | 같은 파일 반복 수정 | 10회 | 일시정지 |
| **LB-003** | 에이전트 재귀 (A→B→A) | 3회 | 중단 |
| **LB-004** | 에러 재시도 루프 | 3회 | 일시정지 |

---

## 13. 감사 로그와 의사결정 추적

### 13.1 감사 로그 (Audit Log)

bkit의 모든 작업이 **시간순으로 기록**됩니다.

**저장 위치:** `.bkit/audit/YYYY-MM-DD.jsonl`
**보존 기간:** 30일

**기록되는 이벤트 유형 (16종):**

| 카테고리 | 이벤트 |
|---------|--------|
| **PDCA** | phase_transition, feature_created, feature_archived |
| **파일** | file_created, file_modified, file_deleted |
| **설정** | config_changed, automation_level_changed |
| **제어** | checkpoint_created, rollback_executed, destructive_blocked |
| **팀** | agent_spawned, agent_completed, agent_failed |
| **품질** | gate_passed, gate_failed |

**조회 방법:**

```
/audit log              # 오늘의 감사 로그 조회
/audit search file_created    # 특정 이벤트 타입 검색
/audit summary          # 일별/주간 요약
/audit trace            # 의사결정 추적 조회
```

### 13.2 의사결정 추적 (Decision Trace)

AI가 **왜 그런 결정을 했는지** 추적합니다.

**저장 위치:** `.bkit/decisions/YYYY-MM-DD.jsonl`

**추적되는 결정 유형 (15종):**

| 결정 타입 | 설명 |
|-----------|------|
| phase_advance | 다음 단계로 진행 결정 |
| iteration_continue | 반복 계속 결정 |
| automation_escalation | 자동화 레벨 상향 |
| file_generation | 파일 생성 결정 |
| architecture_choice | 아키텍처 선택 |
| error_recovery | 에러 복구 방식 결정 |
| rollback_trigger | 롤백 실행 결정 |
| gate_override | 게이트 우회 결정 |
| agent_selection | 에이전트 선택 |
| workflow_selection | 워크플로우 선택 |
| destructive_approval | 파괴적 작업 승인/거부 |
| emergency_stop | 비상 정지 실행 |

**각 결정에는 다음이 기록됩니다:**

```
- 질문: "Match Rate 87%인데 Report로 넘어갈까, Act로 갈까?"
- 선택: "Act (반복 개선)"
- 이유: "Match Rate가 90% 미만이므로 품질 게이트 기준 미달"
- 검토한 대안: "Report 강제 생성 (거부: 기준 미달)"
- 신뢰도: 0.95
- 영향도: medium
- 되돌릴 수 있는가: true
```

### 13.3 설명 생성기

의사결정 추적 데이터를 사람이 읽기 쉬운 형태로 변환합니다:

```
/audit trace --detail    # 상세 설명 포함
```

**설명 수준:**
- **brief**: 1줄 요약 ("Act 선택 — Match Rate 87%, 기준 90% 미달")
- **normal**: 단락 설명 (질문 + 선택 + 이유 + 신뢰도)
- **detailed**: 전체 추적 (ID + 시간 + 대안 + 영향받는 파일)

---

## 14. CLI 대시보드

### 14.1 5가지 대시보드 컴포넌트

bkit은 터미널에 시각적인 대시보드를 표시합니다.

#### 1) Progress Bar — 진행 상태 바

PDCA 6단계의 진행 상태를 한눈에 보여줍니다:

```
┌─── user-auth ────────────────────────────────── 67% ─┐
│  PM✓  PLAN✓  DESIGN✓  DO~  CHECK·  REPORT·          │
└─ do phase • last: 1h ago • iter: 0                   ┘
```

**상태 표시:**
- `✓` 완료
- `~` 진행 중
- `·` 대기
- `✗` 실패
- `⏳` 승인 대기

#### 2) Workflow Map — 워크플로우 맵

2D 박스 다이어그램으로 전체 흐름을 표시합니다:

```
┌─── Workflow Map: user-auth ──────────────────────────┐
│                                                       │
│  [PM ✓]──→[PLAN ✓]──→[DESIGN ✓]──→[DO ~]──→[CHECK]  │
│                                                       │
│  Iter: 0  •  matchRate: —                            │
└──────────────────────────────────────────────────────┘
```

#### 3) Control Panel — 제어 패널

자동화 레벨과 비상 정지를 표시합니다:

```
┌─── Control Panel ────────────────────────────────────┐
│                                                       │
│  Automation Level   L0 ───────────●────────── L4     │
│                     Manual  Semi-Auto  Full-Auto     │
│                     [Current: L2 Semi-Auto]          │
│                                                       │
│  No pending approvals                                │
│                                                       │
│  Emergency stop: /control stop  or  Ctrl+C           │
└──────────────────────────────────────────────────────┘
```

#### 4) Agent Panel — 에이전트 패널

CTO 팀의 작업 상태를 표시합니다:

```
┌─── Agent Panel ──────────────────────────────┐
│  Pattern: parallel swarm                      │
│                                               │
│  🟢 cto-lead        working   "조율 중"       │
│  🟢 frontend-arch   working   "컴포넌트 구현" │
│  🟡 product-mgr     idle                      │
│  🟢 qa-strategist   working   "테스트 계획"   │
└───────────────────────────────────────────────┘
```

#### 5) Impact View — 영향 분석 뷰

Gap 분석 결과와 변경 영향을 시각화합니다:

```
┌─── Impact View ──────────────────────────────┐
│                                               │
│  Match Rate: ████████████████████░░ 87%       │
│  Files Changed: 12  │  Lines: +456 / -23     │
│                                               │
│  Iteration Trend:                             │
│    #1: 72% → #2: 87% → #3: (in progress)    │
└───────────────────────────────────────────────┘
```

---

## 15. MCP 서버

### 15.1 MCP란?

MCP(Model Context Protocol)는 AI 모델이 외부 도구와 데이터에 접근하는 프로토콜입니다.
bkit은 2개의 MCP 서버를 제공합니다.

### 15.2 bkit-pdca-server (10개 도구)

PDCA 상태와 문서를 조회하는 서버입니다.

| 도구 | 설명 | 사용 예시 |
|------|------|-----------|
| `bkit_pdca_status` | 현재 PDCA 상태 조회 | Feature별 필터 가능 |
| `bkit_pdca_history` | PDCA 이력 이벤트 조회 | 기간/건수 필터 |
| `bkit_feature_list` | Feature 목록 조회 | active/completed/archived |
| `bkit_feature_detail` | 특정 Feature 상세 | 전체 메타데이터 포함 |
| `bkit_plan_read` | Plan 문서 읽기 | markdown 원문 반환 |
| `bkit_design_read` | Design 문서 읽기 | markdown 원문 반환 |
| `bkit_analysis_read` | Analysis 문서 읽기 | Gap 분석 결과 |
| `bkit_report_read` | Report 문서 읽기 | 완료 보고서 |
| `bkit_metrics_get` | 최신 품질 지표 | M1-M10 현재값 |
| `bkit_metrics_history` | 지표 시계열 이력 | 추세 분석용 |

### 15.3 bkit-analysis-server (6개 도구)

코드 분석과 감사를 위한 서버입니다.

| 도구 | 설명 |
|------|------|
| `bkit_code_quality` | 코드 품질 분석 결과 조회 |
| `bkit_gap_analysis` | 설계-구현 갭 분석 결과 |
| `bkit_regression_rules` | 회귀 방지 규칙 목록/추가 |
| `bkit_checkpoint_list` | 체크포인트 목록 |
| `bkit_checkpoint_detail` | 체크포인트 상세 |
| `bkit_audit_search` | 감사 로그 검색 |

---

## 16. 출력 스타일

### 16.1 4가지 출력 스타일

bkit은 상황에 맞는 **출력 스타일**을 제공합니다.
AI의 응답 형식을 목적에 맞게 변경할 수 있습니다.

| 스타일 | 트리거 키워드 | 특징 | 적합한 사용자 |
|--------|-------------|------|-------------|
| **bkit-learning** | 배우기, 초보, tutorial | 학습 포인트 자동 표시, TODO 마커 | 입문자, 학습 목적 |
| **bkit-pdca-guide** | PDCA, 워크플로우 | 단계별 체크리스트, 상태 뱃지 | 일반 개발자 |
| **bkit-enterprise** | 아키텍처, CTO | 트레이드오프 표, 비용 추정 | 시니어, 아키텍트 |
| **bkit-pdca-enterprise** | PDCA + Enterprise | 위 두 가지 결합 | Enterprise 팀 |

### 16.2 스타일 변경 방법

```
/output-style-setup     # 출력 스타일 초기 설치
/config                 # 설정에서 출력 스타일 변경
```

---

## 17. 설정 파일 가이드

### 17.1 bkit.config.json — 중앙 설정 파일

프로젝트 루트의 `bkit.config.json`이 bkit의 모든 동작을 제어합니다.

#### PDCA 설정

```json
{
  "pdca": {
    "matchRateThreshold": 90,       // Gap analysis 통과 기준 (%)
    "autoIterate": true,            // 자동 반복 개선 활성화
    "maxIterations": 5,             // 최대 반복 횟수
    "automationLevel": "semi-auto"  // 기본 자동화 레벨
  }
}
```

#### 자동화 설정

```json
{
  "automation": {
    "defaultLevel": 2,              // 기본 L-level (0-4)
    "emergencyStopEnabled": true,   // 비상 정지 활성화
    "autoDowngrade": true           // 문제 발생 시 자동 레벨 하강
  }
}
```

#### 안전장치 설정

```json
{
  "guardrails": {
    "destructiveDetection": true,           // 파괴적 작업 감지
    "blastRadiusLimit": "high",             // 최대 허용 영향 범위
    "checkpointOnDestructive": true,        // 파괴적 작업 전 자동 체크포인트
    "checkpointOnPhaseTransition": true     // Phase 전환 시 자동 체크포인트
  }
}
```

#### 품질 설정

```json
{
  "quality": {
    "metricsCollection": true,      // M1-M10 지표 수집
    "regressionGuard": true,        // 회귀 방지 규칙 활성화
    "thresholds": {
      "matchRate": 90,              // Match Rate 임계값
      "codeQuality": 60,            // 코드 품질 최소값
      "criticalIssues": 0           // 허용 치명적 이슈 수
    }
  }
}
```

#### 트리거 설정

```json
{
  "triggers": {
    "implicitEnabled": true,        // 암묵적 키워드 트리거 활성화
    "confidenceThreshold": 0.7      // 트리거 인식 신뢰도 최소값
  }
}
```

#### 팀 설정

```json
{
  "team": {
    "maxTeammates": 5,              // 최대 팀원 수
    "ctoAgent": "cto-lead"          // CTO 에이전트 이름
  }
}
```

### 17.2 plugin.json — 플러그인 메타데이터

`.claude-plugin/plugin.json`은 Claude Code에 bkit 플러그인 정보를 알립니다.

```json
{
  "name": "bkit",
  "version": "2.0.0",
  "displayName": "bkit — AI Native Development OS",
  "engines": { "claude-code": ">=2.1.78" },
  "outputStyles": "./output-styles/"
}
```

---

## 18. 메모리 시스템

### 18.1 3가지 메모리 스코프

bkit은 Claude Code의 에이전트 메모리 시스템을 활용합니다:

| 스코프 | 경로 | 공유 범위 | 용도 |
|--------|------|-----------|------|
| **Project** | `.claude/agent-memory/` | 프로젝트 팀 전체 | 프로젝트 규칙, 아키텍처 결정 |
| **User** | `~/.claude/agent-memory/` | 사용자 전체 프로젝트 | 개인 선호, Claude Code 설정 |
| **Local** | `.claude/agent-memory-local/` | 로컬 전용 (gitignore) | 민감한 정보, 로컬 환경 |

### 18.2 bkit 상태 파일

bkit 자체의 상태도 파일로 관리됩니다:

| 파일 | 설명 |
|------|------|
| `.bkit/state/pdca-status.json` | PDCA 상태 (단계, Match Rate, 반복 횟수) |
| `.bkit/state/memory.json` | bkit 메모리 (현재 Feature, 레벨, 컨텍스트) |
| `.bkit/state/trust-profile.json` | Trust Score 프로파일 |
| `.bkit/state/quality-metrics.json` | 최신 품질 지표 스냅샷 |
| `.bkit/state/quality-history.json` | 품질 지표 시계열 이력 |
| `.bkit/runtime/agent-state.json` | 에이전트 팀 상태 |
| `.bkit/runtime/control-state.json` | 자동화 제어 상태 |

### 18.3 메모리 관련 명령어

```
/memory           # Claude Code 메모리 관리 (보기/편집/삭제)
```

> **팁:** PDCA 사이클 완료 후 `/memory`를 사용하여 핵심 교훈을 저장하면
> 다음 세션에서도 맥락을 유지할 수 있습니다.

---

## 19. 9-Phase 개발 파이프라인

### 19.1 전체 파이프라인

프로젝트를 처음부터 끝까지 개발하는 9단계 가이드입니다.

```
Phase 1: 스키마 정의
    ↓
Phase 2: 코딩 컨벤션
    ↓
Phase 3: 목업/와이어프레임
    ↓
Phase 4: API 설계/구현
    ↓
Phase 5: 디자인 시스템
    ↓
Phase 6: UI 구현 + API 연동
    ↓
Phase 7: SEO + 보안
    ↓
Phase 8: 코드 리뷰 + 갭 분석
    ↓
Phase 9: 배포
```

### 19.2 각 Phase 상세

#### Phase 1: 스키마 정의 (`/phase-1-schema`)

**목적:** 프로젝트에서 사용할 용어와 데이터 구조를 정의합니다.

**산출물:**
- 도메인 용어 사전
- 엔티티(Entity) 정의
- 엔티티 간 관계(Relationship)
- ERD (Entity-Relationship Diagram)

**예시:**
```
사용자: "블로그 앱의 스키마를 설계해줘"
→ User, Post, Comment, Category 엔티티 정의
→ 관계: User 1:N Post, Post 1:N Comment
```

#### Phase 2: 코딩 컨벤션 (`/phase-2-convention`)

**목적:** 프로젝트의 코딩 규칙을 정의합니다.

**산출물:**
- 네이밍 규칙 (camelCase, PascalCase 등)
- 파일/디렉터리 구조 규칙
- 코드 포매팅 규칙
- 주석/문서화 규칙
- Git 커밋 메시지 규칙

#### Phase 3: 목업 (`/phase-3-mockup`)

**목적:** 디자이너 없이 UI를 미리 설계합니다.

**산출물:**
- HTML/CSS/JS 기반 프로토타입
- 반응형 디자인
- 인터랙션 프리뷰

**특징:** 최신 UI/UX 트렌드를 반영한 목업 생성

#### Phase 4: API 설계 (`/phase-4-api`)

**목적:** 백엔드 API를 설계하고 구현합니다.

**산출물:**
- RESTful API 엔드포인트 정의
- 요청/응답 스키마
- 인증/인가 미들웨어
- Zero Script QA 방법론으로 검증

#### Phase 5: 디자인 시스템 (`/phase-5-design-system`)

**목적:** 일관된 UI 컴포넌트 라이브러리를 구축합니다.

**산출물:**
- 디자인 토큰 (색상, 타이포그래피, 간격)
- 기본 컴포넌트 (Button, Input, Card 등)
- 레이아웃 컴포넌트

#### Phase 6: UI 구현 (`/phase-6-ui-integration`)

**목적:** UI 컴포넌트를 구현하고 API와 연동합니다.

**산출물:**
- 페이지 컴포넌트
- 상태 관리 (zustand, React Query 등)
- API 클라이언트 연동
- 에러 처리, 로딩 상태

#### Phase 7: SEO + 보안 (`/phase-7-seo-security`)

**목적:** 검색 최적화와 보안을 강화합니다.

**산출물:**
- 메타태그, Open Graph, 시맨틱 HTML
- XSS, CSRF, SQL Injection 방어
- Content Security Policy

#### Phase 8: 코드 리뷰 (`/phase-8-review`)

**목적:** 전체 코드베이스를 검토합니다.

**산출물:**
- 아키텍처 일관성 검증
- 컨벤션 준수 확인
- 설계-구현 갭 분석 보고서

#### Phase 9: 배포 (`/phase-9-deployment`)

**목적:** 프로덕션 환경에 배포합니다.

**산출물:**
- CI/CD 파이프라인 설정
- 환경 변수 관리
- 배포 스크립트 (Vercel, Docker, K8s)

### 19.3 파이프라인 명령어

```
/development-pipeline start          # 파이프라인 시작
/development-pipeline next           # 다음 Phase 안내
/development-pipeline status         # 현재 Phase 확인
```

---

## 20. 고급 기능

### 20.1 Plan Plus — 브레인스토밍 강화 Plan

일반 `/pdca plan`보다 더 깊이 있는 계획을 세울 때 사용합니다.

```
/plan-plus user-auth
```

**5단계 브레인스토밍:**

| 단계 | 이름 | 내용 |
|------|------|------|
| Phase 0 | 의도 탐색 | "정말로 원하는 것이 무엇인가?" |
| Phase 1 | 대안 발견 | 가능한 접근 방식 나열 |
| Phase 2 | 트레이드오프 분석 | 각 대안의 장단점 비교 |
| Phase 3 | YAGNI 검토 | "정말 이것이 필요한가?" 필터링 |
| Phase 4 | 결정 | 최적 방안 선택 |
| Phase 5 | Plan 문서 생성 | 결정을 반영한 Plan 작성 |

### 20.2 BTW (By-The-Way) — 아이디어 수집

작업 중에 떠오르는 개선 아이디어를 기록합니다.

```
/btw "이 API 응답 캐싱하면 성능 좋아지겠다"
/btw list                    # 수집된 아이디어 목록
/btw analyze                 # AI가 아이디어 분석
/btw promote 3               # 3번 아이디어를 정식 Feature로 승급
/btw stats                   # 통계 확인
```

### 20.3 Batch PDCA — 다중 Feature 동시 관리

여러 Feature를 동시에 관리합니다 (최대 3개).

```
/pdca-batch status           # 모든 Feature 상태
/pdca-batch plan             # 여러 Feature 동시 Plan
```

### 20.4 워크플로우 프리셋

bkit은 3가지 워크플로우 프리셋을 자동으로 선택합니다:

| 프리셋 | 자동 선택 조건 | Match Rate 기준 | 최대 반복 | 특징 |
|--------|---------------|-----------------|-----------|------|
| **default** | 일반 Feature | 90% | 5회 | 전체 PDCA 사이클 |
| **hotfix** | `hotfix-*`, `fix-*` Feature | 80% | 2회 | PM/Design 스킵 |
| **enterprise** | Enterprise 레벨 | 95% | 5회 | 병렬 Check, 수동 승인 |

**커스텀 워크플로우:**

`.bkit/workflows/` 디렉터리에 YAML 파일을 추가하면 커스텀 워크플로우를 만들 수 있습니다.

### 20.5 Zero Script QA

테스트 스크립트를 작성하지 않고 **Docker 로그**로 QA를 수행합니다.

```
/zero-script-qa
```

**작동 원리:**
1. Docker 컨테이너의 구조화된 JSON 로그를 실시간 모니터링
2. API 호출, 에러, 성능 이상을 자동 감지
3. 감지된 이슈를 리포트로 정리

### 20.6 /simplify — 코드 정리

Check 단계에서 Match Rate ≥ 90% 달성 후, Report 전에 코드를 정리합니다.

```
/simplify
```

**검사 항목:**
- 중복 코드 탐지
- 사용하지 않는 코드 제거
- 불필요한 복잡성 감소
- 재사용 가능한 패턴 추출

### 20.7 Skill Evals — 스킬 평가 프레임워크

스킬의 품질을 측정하고 모델 간 성능을 비교합니다.

```bash
# 모든 스킬 벤치마크 실행
node evals/runner.js --benchmark

# 모델 간 A/B 테스트
node evals/ab-tester.js --skill pdca --modelA sonnet --modelB opus

# Parity 테스트 (스킬 유무 차이 측정)
node evals/ab-tester.js --parity phase-3-mockup --model opus
```

### 20.8 /loop — 반복 실행

명령어를 주기적으로 반복 실행합니다.

```
/loop 5m /pdca status        # 5분마다 PDCA 상태 확인
/loop 10m /zero-script-qa    # 10분마다 QA 실행
```

---

## 21. 자주 묻는 질문 (FAQ)

### Q: bkit을 사용하려면 반드시 PDCA를 따라야 하나요?

**A:** 아닙니다. bkit은 PDCA를 강제하지 않습니다. 단순한 버그 수정이나 작은 변경은
일반 Claude Code처럼 자유롭게 작업할 수 있습니다. PDCA는 새로운 기능 개발이나
복잡한 작업에서 가장 효과적입니다.

### Q: Match Rate가 90%에 도달하지 않으면 어떻게 되나요?

**A:** 자동 반복(Act)이 최대 5회 실행됩니다. 5회 반복 후에도 90%에 도달하지 못하면
현재 상태로 강제 Report가 생성됩니다. 이 경우 보고서에 미달 사유가 기록됩니다.

### Q: CTO Agent Team을 사용하려면 어떻게 하나요?

**A:** 환경변수를 설정해야 합니다:
```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```
그 후 `/pdca team {feature}` 명령으로 팀 모드를 시작합니다.

### Q: bkit 설정을 초기화하고 싶어요.

**A:** `bkit.config.json`을 삭제하면 기본 설정으로 돌아갑니다.
PDCA 상태를 초기화하려면 `/rollback reset {feature}`를 사용하세요.

### Q: 자동화 레벨을 어떻게 선택해야 하나요?

**A:** 처음에는 **L2 (Semi-Auto)**로 시작하세요 (기본값).
bkit에 익숙해지면 L3으로, 반복 작업이 많으면 L4로 올려보세요.
민감한 프로젝트에서는 L0이나 L1을 사용하세요.

### Q: hotfix를 빠르게 적용하고 싶어요.

**A:** Feature 이름을 `hotfix-` 또는 `fix-`로 시작하면 자동으로
hotfix 워크플로우가 선택됩니다:
```
/pdca plan hotfix-login-error
→ PM/Design 단계 자동 스킵
→ Match Rate 기준 80% (낮춤)
→ 최대 2회 반복
```

### Q: 여러 Feature를 동시에 작업할 수 있나요?

**A:** 네, 최대 3개까지 동시에 관리할 수 있습니다.
```
/pdca-batch status    # 전체 Feature 상태 확인
```

### Q: 사용 중 문제가 발생하면?

**A:** 비상 정지로 안전하게 중단하세요:
```
/control stop         # 비상 정지 (L1로 하강)
Ctrl+C                # 키보드 단축키
```
그 후 `/audit log`으로 무슨 일이 있었는지 확인하고,
`/rollback list`로 복구 가능한 체크포인트를 찾아보세요.

### Q: bkend.ai를 사용하지 않고 다른 백엔드를 쓸 수 있나요?

**A:** 물론입니다. bkend.ai는 Dynamic 레벨의 **권장 옵션**이지,
필수가 아닙니다. 어떤 백엔드(Firebase, Supabase, 직접 구축 서버 등)든
사용할 수 있으며, Phase 4 (API 설계) 스킬이 범용적으로 도와줍니다.

### Q: Claude Code 어떤 버전이 필요한가요?

**A:** bkit v2.0.0은 **Claude Code v2.1.78 이상**이 필요합니다.
권장 버전은 **v2.1.79+**입니다 (/btw 스트리밍 수정, 시작 메모리 최적화 포함).

---

## 22. 부록: 워크플로우 프리셋

### A. Default 워크플로우

```
id: default-pdca
name: Default PDCA Workflow
trigger: auto (기본)

단계:
  start → pm(gate) → plan(gate) → design(gate) → do → check(gate) ↔ act → report(gate) → archive

설정:
  matchRateThreshold: 90
  maxIterations: 5
  automationLevel: semi-auto
  staleTimeout: 7일
```

### B. Hotfix 워크플로우

```
id: hotfix-pdca
name: Hotfix PDCA Workflow
trigger: feature 이름이 hotfix-* 또는 fix-*

단계:
  start → plan → do → check ↔ act → report → archive
  (PM, Design 단계 생략)

설정:
  matchRateThreshold: 80
  maxIterations: 2
  automationLevel: auto
  staleTimeout: 3일

모든 gate: 자동 승인
```

### C. Enterprise 워크플로우

```
id: enterprise-pdca
name: Enterprise PDCA Workflow
trigger: Enterprise 레벨 프로젝트

단계:
  start → pm(gate) → plan(gate) → design(gate) → do → check[병렬](gate) ↔ act → report(gate) → archive

Check 단계 병렬 실행:
  - gap-analysis (설계-구현 갭)
  - code-quality (코드 품질)
  - security-review (보안 리뷰)
  → 모두 완료 시 합산 (mergeStrategy: all)

설정:
  matchRateThreshold: 95
  maxIterations: 5
  automationLevel: guided
  staleTimeout: 14일

모든 주요 gate: 사용자 승인 필수
```

---

## 부록: 18개 Hook 이벤트

bkit은 Claude Code의 Hook 시스템을 통해 다양한 이벤트에 자동 반응합니다.

| Hook 이벤트 | 설명 | 주요 동작 |
|-------------|------|-----------|
| **SessionStart** | 세션 시작 | PDCA 상태 로드, 대시보드 표시 |
| **SessionEnd** | 세션 종료 | 상태 저장, 정리 |
| **UserPromptSubmit** | 사용자 입력 | 의도 감지, 언어 감지, 자동 트리거 |
| **PreToolUse (Write/Edit)** | 파일 쓰기 전 | 체크포인트 생성, 파괴적 작업 감지 |
| **PreToolUse (Bash)** | 명령 실행 전 | Guardrail 검사 |
| **PostToolUse (Write)** | 파일 쓰기 후 | 감사 로그, PDCA 상태 업데이트 |
| **PostToolUse (Bash)** | 명령 실행 후 | 감사 로그 |
| **PostToolUse (Skill)** | 스킬 실행 후 | 스킬 추적 |
| **PostToolUseFailure** | 도구 실행 실패 | 에러 분류, 복구 가이드 |
| **Stop** | 세션 정지 | 상태 저장, 보고서 제안 |
| **StopFailure** | API 에러 정지 | 에러 분류, 로깅, 복구 |
| **PreCompact** | 컨텍스트 압축 전 | 중요 상태 보존 |
| **PostCompact** | 컨텍스트 압축 후 | PDCA 상태 무결성 검증 |
| **TaskCompleted** | Task 완료 | PDCA 전환 처리 |
| **SubagentStart** | 서브에이전트 시작 | 추적 |
| **SubagentStop** | 서브에이전트 종료 | 추적 |
| **TeammateIdle** | 팀메이트 유휴 | 유휴 처리 |
| **InstructionsLoaded** | 지침 로드 완료 | 처리 |
| **ConfigChange** | 설정 변경 | 반영 |
| **PermissionRequest** | 권한 요청 | 자동 처리 |
| **Notification** | 알림 | 알림 처리 |

---

## 부록: 빠른 명령어 레퍼런스

### PDCA 핵심 명령어

| 명령어 | 설명 |
|--------|------|
| `/pdca plan {feature}` | Plan 문서 생성 |
| `/pdca design {feature}` | Design 문서 생성 |
| `/pdca do {feature}` | 구현 시작 |
| `/pdca analyze {feature}` | Gap 분석 실행 |
| `/pdca iterate {feature}` | 자동 개선 반복 |
| `/pdca report {feature}` | 완료 보고서 생성 |
| `/pdca pm {feature}` | PM 분석 시작 |
| `/pdca team {feature}` | CTO 팀 모드 시작 |
| `/pdca status` | 상태 확인 |
| `/pdca next` | 다음 단계 안내 |

### 제어 명령어

| 명령어 | 설명 |
|--------|------|
| `/control level {0-4}` | 자동화 레벨 변경 |
| `/control status` | 현재 레벨 확인 |
| `/control trust` | Trust Score 확인 |
| `/control stop` | 비상 정지 |
| `/control resume` | 복구 |

### 체크포인트/롤백

| 명령어 | 설명 |
|--------|------|
| `/rollback list` | 체크포인트 목록 |
| `/rollback to {checkpoint-id}` | 특정 체크포인트 복원 |
| `/rollback phase` | 이전 단계 롤백 |
| `/rollback reset {feature}` | Feature 초기화 |

### 감사/분석

| 명령어 | 설명 |
|--------|------|
| `/audit log` | 감사 로그 조회 |
| `/audit trace` | 의사결정 추적 |
| `/audit summary` | 요약 보고 |
| `/audit search {query}` | 로그 검색 |

### 유틸리티

| 명령어 | 설명 |
|--------|------|
| `/bkit` | bkit 기능 목록 |
| `/plan-plus {feature}` | 브레인스토밍 강화 Plan |
| `/btw {내용}` | 아이디어 기록 |
| `/code-review` | 코드 리뷰 |
| `/simplify` | 코드 정리 |
| `/zero-script-qa` | 스크립트 없는 QA |
| `/skill-status` | 스킬 상태 확인 |
| `/output-style-setup` | 출력 스타일 설치 |

### 프로젝트 초기화

| 명령어 | 설명 |
|--------|------|
| `/starter` | Starter 프로젝트 초기화 |
| `/dynamic` | Dynamic 프로젝트 초기화 |
| `/enterprise` | Enterprise 프로젝트 초기화 |
| `/mobile-app` | 모바일 앱 개발 가이드 |
| `/desktop-app` | 데스크톱 앱 개발 가이드 |

---

> **bkit v2.0.0** — AI Native Development OS
>
> 문의 및 피드백: https://github.com/anthropics/claude-code/issues
>
> bkit은 Apache 2.0 라이선스로 제공됩니다.
