# bkit + Claude Code Auto Mode 통합 워크플로우 매뉴얼

> **bkit v2.0.8 | Claude Code CLI v2.1.86+**
>
> Claude Code CLI의 Auto Mode / Permission Mode와 bkit PDCA 워크플로우를 결합하여
> 최소한의 사용자 개입으로 PM부터 Report까지 전체 개발 사이클을 자동화하는 완전 가이드입니다.

---

## 목차

1. [개요: 두 시스템의 관계](#1-개요-두-시스템의-관계)
2. [Claude Code CLI 자동화 기능 완전 가이드](#2-claude-code-cli-자동화-기능-완전-가이드)
3. [bkit 자동화 기능 완전 가이드](#3-bkit-자동화-기능-완전-가이드)
4. [두 시스템 통합: 조합 매트릭스](#4-두-시스템-통합-조합-매트릭스)
5. [실전 워크플로우: 레벨별 시나리오](#5-실전-워크플로우-레벨별-시나리오)
6. [추천 조합과 설정 가이드](#6-추천-조합과-설정-가이드)
7. [안전장치와 비상 정지](#7-안전장치와-비상-정지)
8. [CI/CD 파이프라인 통합](#8-cicd-파이프라인-통합)
9. [트러블슈팅](#9-트러블슈팅)
10. [부록: 명령어 치트시트](#10-부록-명령어-치트시트)

---

## 1. 개요: 두 시스템의 관계

### 1.1 핵심 개념

bkit과 Claude Code CLI는 **서로 다른 레이어**의 자동화를 담당합니다:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│   bkit Plugin Layer (개발 프로세스 자동화)                         │
│   ─────────────────────────────────────────                      │
│   PM → Plan → Design → Do → Check → Act → Report                │
│   "다음 개발 단계로 자동으로 넘어갈까?"                              │
│   "품질 기준에 미달하면 자동으로 수정할까?"                           │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                          │   │
│   │   Claude Code CLI Layer (도구 실행 자동화)                │   │
│   │   ────────────────────────────────────────               │   │
│   │   Read / Edit / Write / Bash / Agent                     │   │
│   │   "이 파일을 수정해도 될까?"                                │   │
│   │   "이 명령어를 실행해도 될까?"                               │   │
│   │                                                          │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   Hooks (18개) = 두 레이어를 연결하는 인터페이스                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

| 구분 | Claude Code CLI | bkit Plugin |
|------|----------------|-------------|
| **자동화 대상** | 도구 실행 권한 (Read/Edit/Bash) | 개발 단계 전환 (PDCA 7단계) |
| **판단 기준** | 보안 위험도 (파괴적 명령 차단) | 개발 품질 (Match Rate, 코드 품질) |
| **판단 주체** | Classifier 모델 (Sonnet) | State Machine + Quality Gate |
| **설정 방식** | Permission Mode (6종) | Automation Level (L0~L4) |

### 1.2 왜 두 시스템을 함께 써야 하는가?

- **CC CLI만 사용**: 파일은 자동으로 수정하지만, "뭘 만들지"에 대한 체계가 없음
- **bkit만 사용**: PDCA 프로세스는 체계적이지만, 매번 파일 수정 권한을 물어봄
- **함께 사용**: bkit이 "무엇을, 어떤 순서로" 결정하고, CC CLI가 "실행 권한을 자동 처리"

---

## 2. Claude Code CLI 자동화 기능 완전 가이드

### 2.1 Permission Mode (6종)

Claude Code CLI는 6가지 권한 모드를 제공합니다:

| 모드 | 자동 허용 범위 | 비용 | 적합한 상황 |
|------|--------------|------|------------|
| **`default`** | 파일 읽기만 | 표준 | 민감한 작업, 학습 단계 |
| **`plan`** | 파일 읽기만 (수정 불가) | 표준 | 탐색/설계 단계 |
| **`acceptEdits`** | 파일 읽기 + 수정 | 표준 | 코드 작성/리팩토링 |
| **`dontAsk`** | 사전 승인된 도구만 | 표준 | CI/CD 환경 |
| **`auto`** | Classifier 심사 후 대부분 | 높음 | 장시간 자율 작업 |
| **`bypassPermissions`** | 전부 (심사 없음) | 표준 | 격리된 VM/컨테이너만 |

#### 모드 전환 방법

```bash
# 세션 시작 시 지정
claude --permission-mode auto

# 세션 중 전환 (키보드)
Shift+Tab    # default → acceptEdits → plan → auto 순환

# -p 모드 (비대화형)
claude -p "리팩토링 해줘" --permission-mode acceptEdits
```

### 2.2 Auto Mode 상세

Auto Mode는 Claude Code CLI의 가장 강력한 자동화 기능입니다.

#### 동작 원리

```
사용자 요청
    ↓
Claude: 액션 생성 (Edit, Bash, etc.)
    ↓
┌─ 판단 순서 ─────────────────────────────────┐
│ 1. Allow/Deny 규칙 → 즉시 결정               │
│ 2. 읽기 전용 + 작업 디렉토리 내 수정 → 자동 허용 │
│ 3. 그 외 → Classifier(Sonnet) 심사            │
│ 4. Classifier 차단 → 대안 시도                 │
└─────────────────────────────────────────────┘
    ↓
실행 또는 차단
```

#### Classifier가 자동 허용하는 것

- 작업 디렉토리 내 파일 생성/수정/삭제
- 선언된 의존성 설치 (`npm install`, `pip install`)
- `.env` 읽기 및 해당 API로 인증 정보 전송
- 읽기 전용 HTTP 요청
- 본인 브랜치로 push

#### Classifier가 차단하는 것

- 다운로드 후 실행 (`curl | bash`, clone 후 스크립트 실행)
- 외부로 민감 정보 전송
- 프로덕션 배포/마이그레이션
- 클라우드 스토리지 대량 삭제
- IAM/레포 권한 변경
- `main` 브랜치로 force push

#### 안전 장치

- Classifier가 **3회 연속** 차단 → Auto Mode 일시 정지, 대화형 모드로 전환
- Classifier가 세션 내 **20회 총합** 차단 → Auto Mode 완전 정지
- `-p` (비대화형) 모드에서 차단 → 즉시 중단 (abort)

#### Auto Mode 활성화 조건

- **필수**: Team, Enterprise, 또는 API 플랜
- **모델**: Claude Sonnet 4.6 또는 Opus 4.6
- **불가**: 3rd party 프로바이더 (Bedrock, Vertex, Foundry)

### 2.3 `--dangerously-skip-permissions` vs `--permission-mode auto` 핵심 비교

이 두 옵션은 "권한 프롬프트를 줄인다"는 목적은 같지만, **안전성에서 근본적 차이**가 있습니다.

#### 한마디 비유

> `--dangerously-skip-permissions` = **안전벨트 없이 달리기**
> `--permission-mode auto` = **자율주행 모드 (안전장치 있음)**

#### `--dangerously-skip-permissions` (= `bypassPermissions` 모드)

```bash
claude -p "리팩토링 해줘" --dangerously-skip-permissions
# 또는
claude --permission-mode bypassPermissions
```

- 모든 권한 확인과 안전 체크를 **완전히 비활성화**
- 모든 도구 호출이 즉시 실행 (프롬프트 0건)
- 프롬프트 인젝션에 대한 보호가 **전혀 없음**
- **격리된 환경에서만 사용** (Docker 컨테이너, VM, 인터넷 없는 devcontainer)
- 보호 디렉토리(`.git/`, `.claude/`)에도 접근 가능

#### `--permission-mode auto` (자동 모드)

```bash
claude --permission-mode auto --enable-auto-mode
```

- 백그라운드 **분류기(Classifier, Sonnet 4.6)**가 각 액션을 자동으로 검토
- 요청 범위에 맞는 안전한 액션은 자동 승인, 위험한 액션은 차단
- 프롬프트 인젝션 보호가 **어느 정도 있음** (Classifier가 감지)
- 분류기가 차단하면 수동 확인으로 폴백 (대화형), 즉시 중단 (`-p` 모드)
- Team+ 플랜 필요, Sonnet 4.6/Opus 4.6에서만 사용 가능

#### 상세 비교표

```
┌──────────────────────┬────────────────────────────────┬────────────────────────────┐
│         항목         │ --dangerously-skip-permissions │   --permission-mode auto   │
├──────────────────────┼────────────────────────────────┼────────────────────────────┤
│ 안전 체크            │ 없음                           │ 분류기가 검토              │
├──────────────────────┼────────────────────────────────┼────────────────────────────┤
│ 권한 프롬프트        │ 0건                            │ 대폭 감소 (위험 시만 표시) │
├──────────────────────┼────────────────────────────────┼────────────────────────────┤
│ 프롬프트 인젝션 보호 │ 없음                           │ 있음 (분류기가 감지)       │
├──────────────────────┼────────────────────────────────┼────────────────────────────┤
│ 요구사항             │ 없음                           │ Team+ 플랜, 특정 모델      │
├──────────────────────┼────────────────────────────────┼────────────────────────────┤
│ 토큰 비용            │ 일반                           │ 더 높음 (분류기 오버헤드)  │
├──────────────────────┼────────────────────────────────┼────────────────────────────┤
│ 사용 환경            │ 격리된 VM/컨테이너 전용        │ 일반 개발 환경 OK          │
├──────────────────────┼────────────────────────────────┼────────────────────────────┤
│ 폴백 동작            │ 없음 (무조건 실행)             │ 차단 시 수동 확인 전환     │
├──────────────────────┼────────────────────────────────┼────────────────────────────┤
│ .git/.claude 보호    │ 일부 보호 (v2.1.78+)           │ 완전 보호                  │
└──────────────────────┴────────────────────────────────┴────────────────────────────┘
```

#### 언제 뭘 쓸까?

| 상황 | 추천 옵션 | 이유 |
|------|----------|------|
| Docker 컨테이너 CI/CD | `--dangerously-skip-permissions` | 파일시스템/네트워크 격리됨, 프롬프트 불가 |
| 일회용 VM 배치 작업 | `--dangerously-skip-permissions` | 환경 자체가 일회성 |
| 일반 로컬 개발 (장시간) | `--permission-mode auto` | 안전장치 유지하면서 프롬프트 피로 감소 |
| 팀 공유 서버 | `--permission-mode auto` | 다른 사람 파일/설정 보호 필요 |
| 민감 데이터 있는 프로젝트 | `--permission-mode auto` | 외부 유출 방지 Classifier 동작 |

#### bkit과 조합 시 권장 사항

```
┌────────────────────────────────┬───────────────┬─────────────────────────────┐
│ 환경                           │ CC 옵션       │ bkit 레벨                   │
├────────────────────────────────┼───────────────┼─────────────────────────────┤
│ 로컬 개발 (일반)               │ auto          │ L2 (Semi-Auto)              │
│ 로컬 개발 (숙련자)             │ auto          │ L3 (Auto)                   │
│ CI/CD (GitHub Actions)         │ bypass + bare │ L4 (Full-Auto)              │
│ Docker devcontainer            │ bypass        │ L3-L4                       │
│ 프로덕션 인접 환경             │ auto          │ L1-L2 (보수적)              │
└────────────────────────────────┴───────────────┴─────────────────────────────┘
```

> **주의**: `--dangerously-skip-permissions`와 bkit L4를 동시에 사용하면 **모든 안전장치가 해제**됩니다. bkit의 Quality Gate와 Loop Breaker는 동작하지만, 파일 시스템 레벨의 보호가 없으므로 반드시 격리 환경에서만 사용하세요.

### 2.4 Permission Rules (세밀한 제어)

Auto Mode보다 더 세밀하게 도구별 권한을 제어할 수 있습니다:

```json
// .claude/settings.json
{
  "permissions": {
    "allow": [
      "Read",
      "Edit",
      "Bash(npm test)",
      "Bash(npm run *)",
      "Bash(git log*)",
      "Bash(git status)",
      "Bash(git diff*)"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(git push --force*)"
    ]
  }
}
```

#### 규칙 문법

| 패턴 | 설명 | 예시 |
|------|------|------|
| `Tool` | 도구 전체 허용 | `Read`, `Edit` |
| `Tool(exact)` | 정확한 인자 매칭 | `Bash(npm test)` |
| `Tool(prefix *)` | 접두사 와일드카드 | `Bash(npm run *)` |
| `Tool(path/**)` | 경로 glob | `Read(/src/**)` |
| `Agent(name)` | 특정 에이전트 | `Agent(Explore)` |

#### 평가 우선순위

```
1. Deny 규칙 (최우선) → 무조건 차단
2. Allow 규칙 → 무조건 허용
3. Permission Mode → 모드에 따라 결정
```

### 2.5 Headless/CI 모드 (-p 플래그)

비대화형 환경(CI/CD, 스크립트)에서 Claude Code를 실행합니다:

```bash
# 기본 사용
claude -p "이 버그를 고쳐" --allowedTools "Read,Edit,Bash(npm test)"

# JSON 출력
claude -p "코드 분석해" --output-format json

# 플러그인/훅 없이 실행 (빠른 시작)
claude --bare -p "요약해" --allowedTools "Read"
```

| 플래그 | 설명 |
|-------|------|
| `-p "프롬프트"` | 비대화형 모드, 결과를 stdout으로 출력 |
| `--bare` | 훅, 스킬, 플러그인, MCP 서버 모두 스킵 |
| `--allowedTools` | 허용할 도구 목록 (쉼표 구분) |
| `--disallowedTools` | 차단할 도구 목록 |
| `--output-format json` | 구조화된 JSON 출력 |
| `--permission-mode auto` | Auto Mode로 실행 |

---

## 3. bkit 자동화 기능 완전 가이드

### 3.1 Automation Level (L0-L4)

bkit은 개발 프로세스 전환을 5단계로 제어합니다:

| 레벨 | 이름 | 설명 | 자동 전환 범위 |
|------|------|------|--------------|
| **L0** | Manual | 모든 단계에 승인 필요 | 없음 |
| **L1** | Guided | 읽기 자동, 쓰기 승인 | idle→pm, idle→plan |
| **L2** | Semi-Auto | 비파괴 자동, 파괴 승인 | + plan→design, design→do, check→act, act→check |
| **L3** | Auto | 대부분 자동, 고위험만 승인 | + do→check, report→archived |
| **L4** | Full-Auto | 전부 자동, 사후 리뷰만 | 모든 전환 자동 |

#### 레벨 변경

```bash
# 현재 레벨 확인
/control

# 레벨 변경
/control level 3

# 비상 정지 (어떤 레벨에서든)
/control stop
```

#### Phase 전환 Gate 설정

```
Phase 전환            필수 Gate    자동 승인 레벨
─────────────────────────────────────────────
idle → pm             아니오       L1+
idle → plan           아니오       L1+
pm → plan             예           L2+
plan → design         예           L2+
design → do           예           L2+
do → check            예           L3+
check → report        예           L2+
check → act           예           L2+
act → check           예           L2+
report → archived     예           L3+
```

### 3.2 PDCA State Machine (20개 전환)

bkit의 핵심은 **선언적 상태 머신**입니다:

```
                    ┌─────────┐
                    │  idle   │
                    └────┬────┘
                   START │ SKIP_PM
              ┌─────────┤
              ▼         ▼
          ┌──────┐  ┌──────┐
          │  pm  │  │ plan │◄──── REJECT (pm→idle)
          └──┬───┘  └──┬───┘
     PM_DONE │         │ PLAN_DONE
             ▼         ▼
          ┌──────┐  ┌────────┐
          │ plan │  │ design │
          └──┬───┘  └──┬─────┘
   PLAN_DONE │         │ DESIGN_DONE
             ▼         ▼
          ┌────────┐ ┌──────┐
          │ design │ │  do  │◄──── checkpoint 생성
          └────────┘ └──┬───┘
                        │ DO_COMPLETE
                        ▼
                    ┌────────┐
             ┌─────│ check  │─────┐
             │     └────────┘     │
    ITERATE  │   (matchRate?)     │ MATCH_PASS
    (<90%)   │                    │ (≥90%)
             ▼                    ▼
         ┌───────┐          ┌────────┐
         │  act  │          │ report │
         └───┬───┘          └────┬───┘
  ANALYZE_DONE│                   │ ARCHIVE
             ▼                    ▼
         ┌───────┐          ┌──────────┐
         │ check │          │ archived │
         └───────┘          └──────────┘
             ↑
       (최대 5회 반복)
```

#### Guard (전환 조건)

| Guard | 조건 | 실패 시 |
|-------|------|---------|
| `guardDeliverableExists` | 해당 Phase 문서가 존재 | 전환 차단 |
| `guardDesignApproved` | 설계 문서 존재 (L2+에서 자동 통과) | 전환 차단 |
| `guardDoComplete` | 구현 완료 감지 (3-layer) | 전환 차단 |
| `guardMatchRatePass` | Match Rate ≥ 90% | check→act (반복) |
| `guardCanIterate` | 반복 횟수 < 5 | 강제 report 생성 |
| `guardMaxIterReached` | 반복 횟수 ≥ 5 | 강제 report 생성 |

### 3.3 Quality Gate (7단계)

각 Phase 전환 시 품질 게이트가 평가됩니다:

| Phase | Pass 조건 | Retry 조건 | Fail 조건 |
|-------|----------|-----------|----------|
| **pm** | completeness ≥ 30% | < 30% | - |
| **plan** | completeness ≥ 50% | < 50% | - |
| **design** | completeness ≥ 80%, convention ≥ 70% | < 80% | < 40% |
| **do** | quality ≥ 60, critical = 0 | < 60 | critical > 3 |
| **check** | matchRate ≥ 90%, quality ≥ 70%, critical = 0 | < 90% | critical > 0 |
| **act** | efficiency ≥ 3, matchRate ≥ 85% | < 3 | matchRate < 60% |
| **report** | matchRate ≥ 90%, critical = 0 | - | < 90% |

#### 프로젝트 레벨별 임계값 차이

| 메트릭 | Starter | Dynamic (기본) | Enterprise |
|--------|---------|---------------|-----------|
| Match Rate | 80% | 90% | 95% |
| Code Quality | 60% | 70% | 80% |
| Design Completeness | 60% | 80% | 90% |

### 3.4 Auto-Fix Loop (pdca-iterator)

Match Rate가 임계값 미만일 때 자동으로 수정-재검증 루프를 실행합니다:

```
Check: Gap Analysis 실행
    ↓
Match Rate = 78% (< 90%)
    ↓ [자동 트리거: ITERATE]
Act: gap-detector 결과 기반 자동 수정 (iteration 1/5)
    ↓ [자동 트리거: ANALYZE_DONE]
Check: 재분석 → Match Rate = 85%
    ↓ [자동 트리거: ITERATE]
Act: 추가 수정 (iteration 2/5)
    ↓ [자동 트리거: ANALYZE_DONE]
Check: 재분석 → Match Rate = 94% ✅
    ↓ [자동 트리거: MATCH_PASS]
Report: 완료 보고서 자동 생성
```

#### 정지 조건

- Match Rate ≥ 90% → **성공**, report 단계로 이동
- 반복 5회 도달 → **강제 종료**, 현재 상태로 report 생성
- Loop Breaker 발동 → **비상 정지** (아래 참조)

### 3.5 Loop Breaker (무한 루프 방지)

| 규칙 | 감지 대상 | 최대 | 경고 | 조치 |
|------|----------|------|------|------|
| **LB-001** | check→act→check 반복 | 5회 | 3회 | abort |
| **LB-002** | 같은 파일 반복 수정 | 10회 | 7회 | pause |
| **LB-003** | Agent A→B→A 순환 호출 | 3회 | 2회 | abort |
| **LB-004** | 같은 에러 반복 발생 | 3회 | 2회 | pause |

- **warn**: 경고 로그, 계속 진행
- **pause**: 자동화 일시 정지, 사용자 개입 요청
- **abort**: 즉시 중단, 강제 report 생성

### 3.6 Trust Score (신뢰 점수)

bkit은 세션 내 행동을 추적하여 Trust Score(0-100)를 산출합니다:

```
Trust Score 계산 요소:
  + 승인 횟수 (approval)
  + 성공적 Phase 전환 횟수
  - 거부 횟수 (rejection)
  - 파괴적 명령 차단 횟수
  - 롤백 수행 횟수
```

Trust Score가 높아지면 자동화 레벨 상향을 제안합니다.

---

## 4. 두 시스템 통합: 조합 매트릭스

### 4.1 CC Permission Mode × bkit Level 매트릭스

아래 표는 CC CLI Permission Mode와 bkit Automation Level의 모든 조합에서 **사용자가 개입해야 하는 횟수**를 나타냅니다 (기능 1개 기준, PM~Report 전체):

```
                    CC CLI Permission Mode
                    ┌──────────┬────────────┬──────────┬──────────┐
                    │ default  │acceptEdits │  auto    │ bypass   │
bkit Level          │          │            │          │Permissions│
┌───────────────────┼──────────┼────────────┼──────────┼──────────┤
│ L0 (Manual)       │ ~50회    │ ~35회      │ ~25회    │ ~20회    │
│                   │ 최대 안전 │            │          │          │
├───────────────────┼──────────┼────────────┼──────────┼──────────┤
│ L1 (Guided)       │ ~40회    │ ~25회      │ ~18회    │ ~15회    │
│                   │          │            │          │          │
├───────────────────┼──────────┼────────────┼──────────┼──────────┤
│ L2 (Semi-Auto)    │ ~30회    │ ~15회      │ ~8회     │ ~5회     │
│                   │          │ ★ 추천     │          │          │
├───────────────────┼──────────┼────────────┼──────────┼──────────┤
│ L3 (Auto)         │ ~25회    │ ~10회      │ ~3회     │ ~2회     │
│                   │          │            │ ★★ 추천  │          │
├───────────────────┼──────────┼────────────┼──────────┼──────────┤
│ L4 (Full-Auto)    │ ~20회    │ ~8회       │ ~1회     │ 0회      │
│                   │          │            │ ★★★최대  │ ⚠ 위험   │
└───────────────────┴──────────┴────────────┴──────────┴──────────┘

★ = 안전성과 편의성의 균형점
```

### 4.2 추천 조합 3가지

#### 조합 A: 안전 우선 (학습/초보자)

```
CC CLI: acceptEdits + bkit: L2 (Semi-Auto)
```

- 파일 수정은 자동, Bash 실행은 물어봄
- PDCA 단계 전환은 대부분 자동, 파괴적 작업만 승인
- **사용자 개입: ~15회/기능**

#### 조합 B: 생산성 우선 (숙련 개발자)

```
CC CLI: auto + bkit: L3 (Auto)
```

- Classifier가 대부분의 도구 실행을 자동 심사
- PDCA 단계 전환도 대부분 자동
- **사용자 개입: ~3회/기능** (시작, 설계 승인, 최종 확인)

#### 조합 C: 완전 자동 (격리 환경/CI)

```
CC CLI: auto + bkit: L4 (Full-Auto)
```

- 거의 모든 것이 자동
- **사용자 개입: ~1회/기능** (시작 명령만)
- 주의: 반드시 격리 환경에서 사용

---

## 5. 실전 워크플로우: 레벨별 시나리오

### 5.1 시나리오 A: Starter 프로젝트 (포트폴리오 사이트)

> **추천 조합**: CC `acceptEdits` + bkit `L2`

#### Step 1: 세션 시작

```bash
claude --permission-mode acceptEdits
```

#### Step 2: PDCA 시작

```
사용자: /pdca plan my-portfolio
```

bkit이 자동으로:
1. Feature 초기화 (`idle → plan`)
2. Plan 문서 생성 (`docs/01-plan/features/my-portfolio.plan.md`)

#### Step 3: 설계

```
사용자: /pdca design my-portfolio
```

bkit이 자동으로:
1. Plan 문서 기반으로 Design 문서 생성
2. Quality Gate 평가 (completeness ≥ 60% for Starter)

#### Step 4: 구현

```
사용자: /pdca do my-portfolio
```

- CC CLI `acceptEdits`가 파일 생성/수정을 자동 허용
- Bash 명령 (`npm install` 등)은 사용자에게 물어봄

#### Step 5: 검증 → 자동 수정 → 보고서

```
사용자: /pdca analyze my-portfolio
```

이후 자동으로:
1. Gap Analysis 실행 → Match Rate 산출
2. < 80% (Starter 기준) → 자동 수정 루프 (최대 5회)
3. ≥ 80% → 완료 보고서 자동 생성

**총 사용자 입력: 4회** (`plan`, `design`, `do`, `analyze`)

---

### 5.2 시나리오 B: Dynamic 프로젝트 (풀스택 웹앱)

> **추천 조합**: CC `auto` + bkit `L3`

#### Step 1: 세션 시작

```bash
claude --permission-mode auto --enable-auto-mode
```

#### Step 2: PM + PDCA 전체 실행

```
사용자: /pdca team login-feature
```

CTO Agent Team이 자동으로 전체 워크플로우를 실행합니다:

```
[자동] PM Phase
  ├── pm-discovery: 고객 니즈 분석
  ├── pm-strategy: 가치 제안 + Lean Canvas
  ├── pm-research: 페르소나 + 경쟁사 분석
  └── pm-prd: PRD 문서 생성
      ↓ PM_DONE (L3 자동 전환)
[자동] Plan Phase
  └── Plan 문서 생성 (PRD 기반)
      ↓ PLAN_DONE (L3 자동 전환)
[자동] Design Phase
  └── Design 문서 생성 (API, 컴포넌트, 스키마)
      ↓ DESIGN_DONE (L3 자동 전환)
[자동] Do Phase
  ├── Frontend Agent: UI 컴포넌트 구현
  ├── Backend Agent: API 구현
  └── CC Auto Mode: 파일 수정/Bash 자동 허용
      ↓ DO_COMPLETE (L3 자동 전환)
[자동] Check Phase
  └── Gap Analysis → Match Rate 85%
      ↓ ITERATE (< 90%, 자동 트리거)
[자동] Act Phase (iteration 1)
  └── 자동 수정
      ↓ ANALYZE_DONE
[자동] Check Phase
  └── 재분석 → Match Rate 93% ✅
      ↓ MATCH_PASS (≥ 90%)
[자동] Report Phase
  └── 완료 보고서 자동 생성
```

**총 사용자 입력: 1회** (`/pdca team login-feature`)

> **주의**: L3에서도 `design` Phase는 기본적으로 리뷰 체크포인트(`reviewCheckpoints`)로 설정되어 있어, 설계 문서 확인 요청이 올 수 있습니다. 이는 의도된 안전장치입니다.

---

### 5.3 시나리오 C: Enterprise 프로젝트 (마이크로서비스)

> **추천 조합**: CC `auto` + bkit `L2` (Enterprise는 보수적으로)

```bash
claude --permission-mode auto --enable-auto-mode
```

```
사용자: /pdca team user-service
```

Enterprise 레벨에서는 Quality Gate 임계값이 높아집니다:
- Match Rate: **95%** (Dynamic 90%)
- Code Quality: **80%** (Dynamic 70%)
- Design Completeness: **90%** (Dynamic 80%)

```
[자동] PM → Plan → Design
    ↓
[사용자 승인] Design Review (L2에서는 gate)
    ↓
[자동] Do (swarm 패턴: 병렬 구현)
    ↓
[사용자 승인] Do → Check 전환 (L2에서는 gate)
    ↓
[자동] Check → Act → Check (최대 5회, 95% 목표)
    ↓
[자동] Report
```

**총 사용자 입력: 3회** (시작, 설계 승인, 구현 완료 확인)

---

### 5.4 시나리오 비교표

| 항목 | Starter | Dynamic | Enterprise |
|------|---------|---------|-----------|
| CC Mode | `acceptEdits` | `auto` | `auto` |
| bkit Level | L2 | L3 | L2 |
| 사용자 입력 | 4회 | 1회 | 3회 |
| PM Agent Team | 미사용 | 자동 실행 | 자동 실행 |
| CTO Agent Team | 미사용 | 자동 실행 | 자동 실행 |
| Match Rate 기준 | 80% | 90% | 95% |
| 자동 수정 루프 | 최대 5회 | 최대 5회 | 최대 5회 |
| 예상 소요 시간 | 5-10분 | 15-30분 | 30-60분 |

---

## 6. 추천 조합과 설정 가이드

### 6.1 Permission Rules 설정 (CC CLI)

bkit과 함께 사용할 때 추천하는 Permission Rules입니다:

```json
// .claude/settings.json
{
  "permissions": {
    "allow": [
      "Read",
      "Edit",
      "Write",
      "Glob",
      "Grep",
      "Bash(npm test*)",
      "Bash(npm run *)",
      "Bash(npx *)",
      "Bash(git log*)",
      "Bash(git status*)",
      "Bash(git diff*)",
      "Bash(git add *)",
      "Bash(ls *)",
      "Bash(node *)"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(git push --force*)",
      "Bash(git reset --hard*)",
      "Bash(curl * | bash)",
      "Bash(wget * | bash)"
    ]
  }
}
```

### 6.2 bkit 자동화 설정

```json
// bkit.config.json
{
  "automation": {
    "defaultLevel": 2,
    "reviewCheckpoints": ["design"],
    "trustScoreEnabled": true
  },
  "pdca": {
    "maxIterations": 5,
    "matchRateThreshold": 90,
    "autoStartThreshold": 100
  }
}
```

### 6.3 Permission Mode별 bkit 최적 조합

#### `default` + bkit (탐색/학습)

```bash
claude --permission-mode default
```

```
적합: 코드베이스 탐색, 분석, 학습
bkit 레벨: L0-L1
장점: 모든 수정을 사용자가 확인
단점: 매번 승인 필요, 느림
```

#### `acceptEdits` + bkit (일반 개발) — 가장 추천

```bash
claude --permission-mode acceptEdits
```

```
적합: 대부분의 개발 작업
bkit 레벨: L2 (기본값)
장점: 파일 수정 자동 + PDCA 프로세스 체계적
단점: Bash 명령마다 승인 필요
해결: Permission Rules로 안전한 명령 사전 허용
```

#### `auto` + bkit (생산성 극대화)

```bash
claude --permission-mode auto --enable-auto-mode
```

```
적합: 장시간 자율 개발, CTO Team 운영
bkit 레벨: L3
장점: 최소 개입으로 전체 PDCA 자동 진행
단점: Classifier 토큰 비용, Team 플랜 필요
주의: 반드시 bkit 안전장치(Loop Breaker, Quality Gate) 활성화
```

#### `bypassPermissions` + bkit (CI/CD 전용)

```bash
claude -p "feature 구현" --dangerously-skip-permissions
```

```
적합: 격리된 VM/컨테이너, CI 파이프라인
bkit 레벨: L4
장점: 완전 무인 실행
단점: 보안 보호 없음
필수: Docker 컨테이너 또는 일회용 VM에서만 사용
```

---

## 7. 안전장치와 비상 정지

### 7.1 다중 안전장치 레이어

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: CC CLI Classifier (Auto Mode)                       │
│   - 위험 명령 사전 차단                                       │
│   - 3회 연속 차단 시 Auto Mode 일시 정지                       │
│   - 20회 총합 차단 시 Auto Mode 완전 정지                      │
├─────────────────────────────────────────────────────────────┤
│ Layer 2: CC CLI Permission Rules                             │
│   - deny 규칙으로 명시적 차단 (rm -rf, force push 등)          │
│   - allow 규칙으로 안전 명령 사전 허용                          │
├─────────────────────────────────────────────────────────────┤
│ Layer 3: bkit Quality Gate (7단계)                            │
│   - Phase별 품질 임계값 미달 시 전환 차단                       │
│   - Fail 판정 시 hard stop                                    │
├─────────────────────────────────────────────────────────────┤
│ Layer 4: bkit Loop Breaker (4규칙)                            │
│   - PDCA 반복 5회 초과 → abort                                │
│   - 같은 파일 10회 수정 → pause                               │
│   - Agent 순환 3회 → abort                                    │
│   - 같은 에러 3회 → pause                                     │
├─────────────────────────────────────────────────────────────┤
│ Layer 5: bkit Destructive Detector (8규칙)                    │
│   - 파괴적 명령 사전 감지 및 차단                               │
│   - Automation Level에 따른 허용/차단 결정                      │
├─────────────────────────────────────────────────────────────┤
│ Layer 6: bkit Checkpoint/Rollback                            │
│   - Do Phase 진입 전 자동 체크포인트 생성                       │
│   - 문제 발생 시 이전 상태로 롤백 가능                           │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 비상 정지 방법

| 방법 | 범위 | 복구 |
|------|------|------|
| `Ctrl+C` | 현재 작업 중단, bkit 체크포인트 저장 | 자동 resume |
| `/control stop` | bkit 자동화 즉시 중단 | `/control level N`으로 복구 |
| `Shift+Tab` | CC Permission Mode 전환 | 즉시 반영 |
| `Esc` | 현재 Claude 응답 중단 | 다음 프롬프트에서 계속 |

### 7.3 파괴적 명령 분류

bkit이 감지하는 파괴적 명령과 레벨별 처리:

| 명령 유형 | 자동 허용 레벨 | 거부 하한 레벨 |
|----------|--------------|--------------|
| 파일 삭제 | L4만 | L0 이하 |
| 위험 Bash | L3+ | L2 미만 거부 |
| 파괴적 Bash | L4만 | L3 미만 거부 |
| git force push | L4만 | L4 미만 거부 |
| git push | L3+ | L2 미만 거부 |
| 설정 변경 | L4만 | L2 미만 거부 |
| 외부 API 호출 | L3+ | L2 미만 거부 |

---

## 8. CI/CD 파이프라인 통합

### 8.1 GitHub Actions에서 bkit 사용

```yaml
# .github/workflows/bkit-auto-fix.yml
name: bkit Auto-Fix on PR

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  auto-fix:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Claude Code
        run: npm install -g @anthropic-ai/claude-code

      - name: Run bkit analysis
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          claude -p "/pdca analyze ${{ github.head_ref }}" \
            --permission-mode acceptEdits \
            --allowedTools "Read,Edit,Write,Glob,Grep,Bash(npm test*)" \
            --output-format json
```

### 8.2 --bare 모드 (최소 실행)

CI에서 bkit 훅/플러그인 없이 실행해야 할 때:

```bash
# bkit 없이 순수 Claude Code만 실행
claude --bare -p "이 PR의 코드를 리뷰해" \
  --allowedTools "Read,Grep,Glob" \
  --output-format json
```

### 8.3 -p 모드 + bkit 활용

```bash
# bkit 포함 비대화형 실행 (훅/스킬 모두 로드)
claude -p "/pdca analyze my-feature" \
  --permission-mode acceptEdits \
  --allowedTools "Read,Edit,Write,Bash(npm test*)"
```

> **참고**: `-p` 모드에서 Auto Mode Classifier가 차단하면 즉시 중단됩니다. CI에서는 `--allowedTools`로 필요한 도구를 명시적으로 허용하는 것이 더 안정적입니다.

---

## 9. 트러블슈팅

### 9.1 자주 발생하는 문제

#### Q: Auto Mode에서 Classifier가 계속 차단해요

**원인**: Classifier가 명령을 위험하다고 판단
**해결**:

```json
// .claude/settings.json에 명시적 allow 추가
{
  "permissions": {
    "allow": ["Bash(npm run build)", "Bash(docker compose *)"]
  }
}
```

Allow 규칙은 Classifier보다 우선합니다.

#### Q: bkit Quality Gate에서 계속 retry 됩니다

**원인**: 품질 임계값 미달
**확인**:

```
/pdca status
```

**해결**: 해당 Phase의 문서/코드를 보완하거나, Starter 레벨로 임계값 낮추기:

```json
// bkit.config.json
{
  "pdca": {
    "matchRateThreshold": 80
  }
}
```

#### Q: Loop Breaker가 abort 했어요

**원인**: 같은 수정을 5회 이상 반복
**확인**: 감사 로그에서 반복 패턴 확인

```
/audit
```

**해결**: 설계 문서를 먼저 보완한 후 다시 시도

```
/pdca design my-feature    # 설계 보완
/pdca analyze my-feature   # 재분석
```

#### Q: CTO Team 에이전트가 중간에 멈췄어요

**원인**: 병렬 Agent OAuth 401 이슈 (#37520)
**해결**:

```
Ctrl+C                     # 현재 작업 중단
/pdca status               # 상태 확인
/pdca next                 # 다음 단계부터 재개
```

#### Q: CC Auto Mode + bkit L4를 쓰고 싶은데 안전한가요?

**권장하지 않습니다.** 두 시스템 모두 최대 자동화 상태에서는:
- CC Classifier의 차단이 유일한 안전장치
- bkit Quality Gate도 L4에서는 대부분 자동 통과
- 격리된 환경(Docker, VM)에서만 사용하세요

**대안**: CC `auto` + bkit `L3`이 실용적 최대치입니다.

### 9.2 디버깅 도구

| 도구 | 명령어 | 용도 |
|------|--------|------|
| PDCA 상태 확인 | `/pdca status` | 현재 Phase, Match Rate, 반복 횟수 |
| 감사 로그 | `/audit` | AI 의사결정 기록 추적 |
| 자동화 상태 | `/control` | 현재 Level, Trust Score |
| 체크포인트 목록 | `/rollback` | 복원 가능한 스냅샷 |
| 메트릭 이력 | MCP `bkit_metrics_history` | 품질 지표 변화 추이 |

---

## 10. 부록: 명령어 치트시트

### CC CLI 주요 플래그

```bash
# Permission Mode
claude --permission-mode default|plan|acceptEdits|dontAsk|auto|bypassPermissions

# Auto Mode 활성화
claude --permission-mode auto --enable-auto-mode

# 비대화형 실행
claude -p "프롬프트" --allowedTools "Read,Edit" --output-format json

# 최소 실행 (플러그인 없이)
claude --bare -p "프롬프트"

# 세션 중 모드 전환
Shift+Tab

# 도구 제한
claude --allowedTools "Read,Edit,Bash(npm test*)"
claude --disallowedTools "Bash(rm *)"
```

### bkit PDCA 명령어

```bash
# PDCA 사이클
/pdca plan {feature}       # Plan 문서 생성
/pdca design {feature}     # Design 문서 생성
/pdca do {feature}         # 구현 시작
/pdca analyze {feature}    # Gap Analysis (Check)
/pdca iterate {feature}    # 수동 반복 수정 (Act)
/pdca report {feature}     # 완료 보고서
/pdca status               # 현재 상태 확인
/pdca next                 # 다음 단계 자동 진행

# CTO Team (전체 자동화)
/pdca team {feature}       # PM→Report 전체 워크플로우

# PM Agent Team
/pdca pm {feature}         # PM 분석만 실행

# 브레인스토밍 포함 계획
/plan-plus {feature}       # 강화된 Plan 생성
```

### bkit 제어 명령어

```bash
# 자동화 레벨
/control                   # 현재 상태 확인
/control level 0|1|2|3|4   # 레벨 변경
/control stop              # 비상 정지

# 체크포인트
/rollback                  # 체크포인트 목록 및 복원

# 감사
/audit                     # 의사결정 기록 확인

# 상태
/pdca status               # PDCA 진행 상태
/bkit                      # 전체 기능 목록
```

### 빠른 시작 레시피

```bash
# 레시피 1: 안전한 첫 프로젝트
claude --permission-mode acceptEdits
> /pdca plan my-first-feature
> /pdca design my-first-feature
> /pdca do my-first-feature
> /pdca analyze my-first-feature

# 레시피 2: 숙련자 빠른 개발
claude --permission-mode auto --enable-auto-mode
> /control level 3
> /pdca team my-feature

# 레시피 3: CI/CD 자동 분석
claude -p "/pdca analyze my-feature" \
  --permission-mode acceptEdits \
  --allowedTools "Read,Edit,Bash(npm test*)"
```

---

> **문서 버전**: v1.0.0 (2026-03-30)
> **호환**: bkit v2.0.8, Claude Code CLI v2.1.86+
> **관련 문서**: [bkit v2.0.0 사용자 가이드](bkit-v2.0.0-user-guide.md)
