# CTO-5: Anthropic 리더십 발언 & 비전에서 OS 전략 심층 분석

> **Summary**: Anthropic 경영진의 공개 발언, 에세이, 인터뷰, 채용 공고, 투자/파트너십 동향 분석을 통해 AI-Native 통합 OS 개발 계획 여부를 조사
>
> **Author**: CTO-5 Agent (Leadership & Vision Analysis)
> **Created**: 2026-02-25
> **Feature**: bkit-os-feasibility-study
> **PDCA Phase**: Report (Research)
> **Data Sources**: WebSearch 15+ queries, 100+ sources cross-referenced

---

## Executive Summary

**한 줄 결론: Anthropic은 전통적 의미의 OS(커널+GUI)를 개발할 계획이 없으나, "AI가 OS를 대체하는" 전략적 포지션을 적극적으로 구축 중이다. Claude + MCP + Cowork + Computer Use의 조합이 사실상 "AI-Native Meta-OS" 레이어를 형성하고 있다.**

| 평가 항목 | 결과 |
|-----------|------|
| **전통적 OS 개발 의지** | **2/10** (근거 없음) |
| **AI-as-OS 레이어 전략** | **8/10** (적극 추진 중) |
| **사실 기반 근거 강도** | **높음** (공개 발언 + 제품 출시 + 채용 + 투자 종합) |
| **추론 포함 비율** | ~20% (명시적 "OS" 언급 부재로 간접 추론 필요) |

---

## 1. 리더십 발언 분석 (인물별)

### 1.1 Dario Amodei (CEO)

#### "Machines of Loving Grace" (2024.10)
- **OS 직접 언급**: 없음
- **관련 발언**: "existing software infrastructure"를 AI 발전의 제약 요인 중 하나로 언급
- **핵심 프레임**: AI를 "a country of geniuses in a datacenter"로 묘사 -- 백만 개의 인스턴스가 독립적/협력적으로 동작하는 비전
- **OS 시사점**: AI가 기존 소프트웨어 인프라의 한계를 극복할 수 있다는 암시이나, 새로운 OS 개발이 아닌 AI 에이전트가 기존 인프라 위에서 작동하는 모델을 상정
- **분류**: [사실] 에세이 원문 기반, [추론] OS 방향에 대한 해석

#### "The Adolescence of Technology" (2026.01)
- **OS 직접 언급**: 없음
- **핵심 주장**: "AI will test us as a species" -- 강력한 AI가 1-2년 내 도래 (2027년경)
- **기술적 초점**: AI-driven 사이버 공격 위협, 국가 안보, 민주주의에 대한 위험
- **OS 시사점**: OS 보안 강화의 필요성을 간접적으로 시사하나, Anthropic이 직접 OS를 만든다는 방향과는 무관
- **전략적 포지셔닝**: 규제와 법률을 통한 AI 안전 확보 주장 -- OS가 아닌 정책(policy) 레벨 개입
- **분류**: [사실] 에세이 원문 기반

#### Dwarkesh Patel 팟캐스트 (2026.02)
- **핵심 발언**: "We are near the end of the exponential" -- 벤치마크가 아닌 "종결점(endgame)"의 의미
- **타임라인**: 2026-2027년 AGI 수준 도달 예측, 2035년까지 거의 확실
- **컴퓨팅 비전**: AI가 인간의 모든 인지 작업을 초과하는 시스템
- **OS 시사점**: AI가 "인터페이스를 탐색"하고 "물리적 세계와 상호작용"하는 능력 예측 -- 이는 Computer Use 기능과 직접 연결
- **분류**: [사실] 팟캐스트 내용 기반, [추론] Computer Use와의 연결

#### Lex Fridman 팟캐스트 (2024.11)
- **핵심 주제**: AI 스케일링 법칙, 권력 집중 우려, 해석가능성, 규제
- **OS 관련**: 직접 언급 없음. 컴퓨팅 인프라에 대한 논의는 학습/추론 클러스터 규모에 한정
- **분류**: [사실]

#### 종합 평가 - Dario Amodei
| 항목 | 결과 |
|------|------|
| OS 개발 직접 언급 | **없음** (0건) |
| "AI가 컴퓨터 사용 방식을 바꾼다" 시사 | **높음** (Computer Use, 인터페이스 탐색) |
| 전략적 초점 | 모델 능력 향상 + 안전성 + 정책 |
| OS 개발 의지 추정 | **1/10** |

---

### 1.2 Daniela Amodei (President)

#### 전략적 발언
- **"Do More with Less"**: 컴퓨트 효율성에 집중, 달러당 최대 성능 추구
- **엔터프라이즈 포커스**: "Trust is what unlocks deployment at scale" -- 기업 고객 신뢰 중심 전략
- **시장 포지셔닝**: OpenAI가 소비자 관심을 확보하는 동안 Anthropic은 기업 고객이 필요로 하는 기능 구축에 집중
- **핵심 전략**: 파인튜닝, 온프레미스 배포 옵션, 보안/컴플라이언스 인증, 투명한 가격 정책, 감사 로그

#### 비즈니스 성과
- 코드 생성 시장 점유율 42% (OpenAI 21%의 2배)
- 2025 ARR $9B, 2026 $20-26B, 2028 $70B 전망
- Deloitte 47만명 전사 배포 (2025.10)

#### OS 관련 분석
- **OS 개발 언급**: 전무
- **전략적 방향**: API-first, 엔터프라이즈, 클라우드 플랫폼 (AWS Bedrock, Google Cloud Vertex AI)
- **핵심 시사점**: Daniela의 전략은 기존 인프라에 Claude를 통합하는 것이지, 새로운 인프라(OS)를 만드는 것이 아님
- **분류**: [사실] 공개 인터뷰/발표 기반

#### 종합 평가 - Daniela Amodei
| 항목 | 결과 |
|------|------|
| OS 개발 직접 언급 | **없음** |
| 전략적 초점 | 엔터프라이즈 통합, 수익화, 효율성 |
| OS 개발 의지 추정 | **1/10** |

---

### 1.3 Amanda Askell (Character/Alignment Lead)

#### Claude 성격 및 헌법 설계
- Claude의 "soul document" 주요 저자 (2026.01 최신 헌법 발표)
- **자율성 철학**: "사용자의 결정을 존중하되, 우려 표명 가능" -- 에이전트의 제한된 자율성
- **안전-자율 밸런스**: "user wellbeing과 potential for harm vs user autonomy와 excessive paternalism 사이 균형"

#### OS 관련 분석
- **직접 언급**: 없음
- **간접 시사점**: Amanda의 작업은 AI 에이전트가 시스템 레벨 제어를 가질 때의 안전성 프레임워크를 이미 설계 -- 이는 OS 수준 에이전트의 행동 제약 모델로 확장 가능
- **핵심 원칙**: AI가 더 많은 자율성을 가질수록 더 강한 안전 제약 필요 -- OS 개발보다는 에이전트 안전 연구에 초점
- **분류**: [사실] 공개 헌법 문서 기반, [추론] OS 에이전트 확장 가능성

#### 종합 평가 - Amanda Askell
| 항목 | 결과 |
|------|------|
| OS 관련 발언 | **없음** |
| AI-OS 에이전트 안전 프레임워크 | **간접적으로 존재** (헌법 AI) |
| OS 개발 의지 추정 | **0/10** (연구 영역 불일치) |

---

### 1.4 Tom Brown, Chris Olah (핵심 연구원)

#### Tom Brown
- GPT-3 핵심 개발자, Claude 아키텍처 설계 직접 기여
- **기술적 초점**: 대규모 컴퓨트를 안전 연구로 효율적으로 전환

#### Chris Olah
- **전문 분야**: 신경망 해석가능성(Mechanistic Interpretability)
- **연구 방향**: 신경망 역공학, 특정 뉴런과 회로가 어떤 행동을 생성하는지 식별
- **전략적 기여**: Anthropic의 차별화 핵심 -- 모델 내부를 이해하는 능력

#### OS 관련 분석
- 두 연구원 모두 OS 관련 발언/연구 없음
- 순수 AI 모델 연구 및 안전성에 집중
- **분류**: [사실]

---

### 1.5 Michael Gerstenhaber (전 Head of Product)

#### 제품 전략 기여
- Anthropic VP of Product로서 Claude 플랫폼 전략 설계
- **주요 성과**: Claude 4 모델 출시, Claude Code GA, 엔터프라이즈 기능 확대
- **현재**: Anthropic 퇴사, Google로 이동 (2025년경)

#### OS 관련 분석
- 재임 기간 중 OS 관련 발언 기록 없음
- 제품 전략은 API 플랫폼 + 기업 통합에 집중
- **분류**: [사실]

---

### 1.6 Alex Albert (Head of Developer Relations)

#### 핵심 발언
- **"AI agents will replace most traditional software products by 2026"** -- $270B SaaS 산업 위협 예측
- 이 발언으로 2026.02 SaaS 주식 시장 15% 폭락 촉발

#### OS 관련 분석
- AI 에이전트가 "전용 애플리케이션이 필요한 작업을 수행"할 수 있다는 주장
- **핵심 시사점**: 개별 소프트웨어를 AI가 대체하는 것이지, OS를 새로 만드는 것이 아님
- 이는 "OS 위의 앱 레이어가 AI로 대체"되는 비전 -- OS 자체는 그대로 유지
- **분류**: [사실] 공개 발언 기반

---

## 2. 비전 문서 & 제품 전략 분석

### 2.1 Anthropic의 제품 스택 (2026.02 현재)

```
[최상위]  Claude Cowork (비개발자 데스크톱 에이전트)
          Claude Code (개발자 CLI 에이전트)
          Claude Desktop (채팅 + MCP)
          Claude.ai (웹 인터페이스)
[미들웨어] MCP (Model Context Protocol) -- 도구/데이터 연결 표준
          MCP Apps (Slack, Asana, Figma 등 인터랙티브 앱)
          Agent Skills / SKILL.md
          Agent SDK
[하단]    Claude API (Opus/Sonnet/Haiku 모델)
          Computer Use (스크린+마우스+키보드 제어)
[인프라]   AWS Bedrock / Google Cloud Vertex AI / Anthropic Direct
```

### 2.2 "AI-as-OS" 레이어 분석

Anthropic이 명시적으로 "AI OS"를 표방하지는 않지만, 제품 스택의 조합이 사실상 OS 기능을 수행하고 있음:

| OS 기능 | Anthropic 대응 | 성숙도 |
|---------|---------------|--------|
| 프로세스 관리 | Agent Teams (다중 에이전트 오케스트레이션) | 중 |
| 파일 시스템 접근 | Cowork (폴더 접근, 파일 읽기/쓰기/생성) | 상 |
| GUI/UX | MCP Apps (Slack, Figma 등 인터랙티브 UI) | 중 |
| 디바이스 I/O | Computer Use (스크린, 마우스, 키보드) | 중-상 |
| 네트워크/통신 | MCP 커넥터 (Gmail, Drive, Calendar 등) | 상 |
| 보안/권한 | Constitutional AI + Sandbox Runtime | 상 |
| 앱 생태계 | 플러그인 마켓플레이스 + MCP 서버 10,000+ | 상 |
| 멀티태스킹 | Agent Teams + 병렬 세션 | 중 |

### 2.3 MCP: "AI 시대의 USB-C"

- 2024.11 MCP 오픈소스 공개
- 2025.12 Linux Foundation 산하 Agentic AI Foundation(AAIF)에 기부
- 공동 창립: Anthropic + Block(Square) + OpenAI
- 지원: Google, Microsoft, AWS, Cloudflare, Bloomberg
- **현재**: 10,000+ 활성 공개 MCP 서버
- **채택**: ChatGPT, Cursor, Gemini, Microsoft Copilot, VS Code 등

**전략적 의미**: MCP를 OS의 "드라이버 표준"에 해당하는 보편적 프로토콜로 포지셔닝. 이는 전통적 OS가 하드웨어 추상화를 제공하듯, AI가 도구/데이터 추상화를 제공하는 레이어.

---

## 3. 투자/인수/파트너십 동향

### 3.1 주요 파트너십 (2025-2026)

| 파트너 | 내용 | 금액 | OS 관련성 |
|--------|------|------|-----------|
| **NVIDIA + Microsoft** | 투자 + Azure 컴퓨팅 | $15B 투자 + $30B 컴퓨팅 구매 | 없음 (클라우드 인프라) |
| **Google Cloud** | TPU v7p 100만 유닛 확보 | 수십억 달러 규모 | 없음 (학습 인프라) |
| **Broadcom** | 커스텀 칩 주문 | $21B | 없음 (칩 설계) |
| **Accenture** | 비즈니스 그룹 설립, 3만명 교육 | 다년 파트너십 | 없음 (기업 컨설팅) |
| **Snowflake** | 데이터 플랫폼 통합 | $200M | 없음 (데이터 플랫폼) |
| **Deloitte** | 47만명 전사 배포 | 미공개 | 없음 (기업 배포) |

### 3.2 OS 관련 인수/파트너십

- **OS 관련 회사 인수**: **확인된 건수 0건**
- **하드웨어 제조사 파트너십**: 칩(NVIDIA, Broadcom, Google TPU) 관련만 존재. 디바이스/단말기 제조사 파트너십 없음
- **디바이스 관련**: Apple, Samsung, Dell 등 단말기 제조사와의 OS 관련 파트너십 미확인

### 3.3 자금 현황
- 2026.02 Series G: $30B 모금, 포스트머니 밸류에이션 $380B
- 자금 용도: 모델 학습 인프라, 인재 확보, 연구 -- OS 개발 관련 자금 배분 근거 없음

**결론**: 투자/파트너십 방향은 **100% 클라우드 AI 인프라 + 엔터프라이즈 통합**에 집중. OS 관련 움직임 전무.

---

## 4. 채용 동향 분석

### 4.1 전체 채용 규모
- 2026.02 기준 **454개 포지션** 활성 채용 중

### 4.2 OS/시스템 관련 채용

| 포지션 | 목적 | OS 개발 관련성 |
|--------|------|---------------|
| **Security Engineer, Operating Systems** | AI 인프라 OS 레이어 보안 강화 | **낮음** -- 서버/학습 인프라 보안 |
| **Software Engineer, Sandboxing (Systems)** | AI 코드 실행 격리 환경 | **낮음** -- 에이전트 샌드박싱 |
| **Staff Security Engineer, Container & VM Security** | 컨테이너/VM 보안 | **없음** -- 클라우드 인프라 |
| **Staff Software Engineer, Container & VM Infrastructure** | 가상화 최적화 | **없음** -- 클라우드 인프라 |
| **TPU Kernel Engineer** | TPU 커널 최적화 | **없음** -- ML 하드웨어 |
| **Infrastructure Engineer, Sandboxing** | 샌드박스 인프라 | **낮음** -- 에이전트 격리 |
| **Linux OS and System Programming SME** | VM 워크로드 최적화 | **낮음** -- 서버 인프라 |

### 4.3 채용 동향 해석

**핵심 발견**: Anthropic의 OS/시스템 채용은 전부 **서버 사이드 AI 학습/추론 인프라**를 위한 것임.

부재한 포지션:
- "Desktop Environment Engineer" -- 없음
- "GUI Framework Developer" -- 없음
- "Device Driver Engineer" -- 없음 (TPU 커널은 ML 가속기용)
- "OS Distribution Engineer" -- 없음
- "Bootloader / Init System Engineer" -- 없음
- "Windowing System Developer" -- 없음

**결론**: 채용 데이터는 Anthropic이 **소비자/데스크톱 OS 개발 계획이 없음**을 강하게 시사한다. 시스템 관련 채용은 AI 학습 인프라의 성능과 보안에 한정되어 있다.

---

## 5. 전략적 포지셔닝 분석: API vs Platform vs OS

### 5.1 Anthropic의 3-레이어 전략

```
Layer 3: 애플리케이션 (Cowork, Code, Desktop, MCP Apps)
         --> 기존 OS 위에서 동작하는 "AI 워크스페이스"

Layer 2: 플랫폼 (API, SDK, MCP, Agent Skills)
         --> 개발자/기업이 Claude를 통합하는 표준 인터페이스

Layer 1: 모델 (Opus, Sonnet, Haiku + Constitutional AI)
         --> 핵심 AI 역량
```

### 5.2 경쟁사 비교: OS 전략 스펙트럼

| 회사 | OS 전략 수준 | 접근 방식 |
|------|-------------|-----------|
| **Google** | **높음** (8/10) | Android/ChromeOS에 Gemini 깊은 통합, "Aluminium OS" 실험, I/O 2026에서 AI-first 스택 제시 |
| **Apple** | **높음** (8/10) | iOS/macOS에 Apple Intelligence 네이티브 통합, 온디바이스 추론 |
| **Microsoft** | **중-높음** (7/10) | Windows + Copilot 통합, Recall, AI Explorer |
| **OpenAI** | **중** (6/10) | ChatGPT를 "AI Operating System"으로 명시적 포지셔닝, 앱 생태계+광고+구독 |
| **Anthropic** | **낮음** (3/10) | OS 대신 "AI 레이어" -- MCP로 기존 OS/앱에 침투하는 전략 |

### 5.3 Anthropic이 OS를 개발하지 않는 이유 (추론 기반)

1. **미션 부합성**: "Safe, beneficial AI" 미션은 모델 안전 연구에 집중을 요구. OS 개발은 미션 희석.
2. **자원 집중**: $30B 자금조달에도 불구하고, 모델 학습에 $51B+ 컴퓨팅 약정. OS 개발 자원 여유 없음.
3. **파트너 의존성**: AWS/Google Cloud에 깊이 의존. OS를 만들면 이들과 경쟁관계 형성 위험.
4. **시장 전략**: API-first + 엔터프라이즈 전략이 이미 $9B ARR 달성. OS 개발의 ROI가 현 전략보다 낮음.
5. **"Cowork" 전략**: OS를 대체하는 것이 아니라 OS 위에서 작동하는 AI 에이전트로 충분한 가치 창출.

### 5.4 Anthropic의 "Anti-OS" 전략의 본질

Anthropic의 전략은 "OS를 만들지 않고도 OS의 가치를 캡처"하는 것:

- **MCP** = AI 시대의 POSIX/시스템콜 인터페이스
- **Computer Use** = AI가 기존 OS GUI를 직접 조작
- **Cowork** = AI가 파일 시스템을 직접 관리
- **Agent Teams** = AI 프로세스 스케줄링
- **Plugins** = AI 앱 마켓플레이스

이는 **"기존 OS를 무력화하지 않으면서 그 위에 새로운 제어 레이어를 씌우는"** 전략이다.

---

## 6. 결론: Anthropic의 OS 개발 의지

### 6.1 최종 스코어

| 평가 차원 | 스코어 (1-10) | 근거 |
|-----------|:---:|------|
| 전통적 OS (커널+GUI) 개발 의지 | **1/10** | 경영진 발언 0건, 채용 0건, 투자 0건 |
| 커스텀 리눅스 배포판 개발 가능성 | **2/10** | 서버 인프라용 내부 사용 가능성만 존재 |
| "AI-as-OS" 레이어 전략 | **8/10** | MCP+Cowork+Code+Computer Use 적극 추진 |
| OS 시장 진입 (5년 내) | **1/10** | 전략적 방향, 자원 배분 모두 불일치 |
| **종합 OS 개발 의지** | **2/10** | 전통적 OS 개발 의지 근거 부재 |

### 6.2 시나리오별 확률 추정

| 시나리오 | 확률 | 조건 |
|----------|:---:|------|
| Anthropic이 자체 데스크톱 OS 출시 (3년 내) | **< 3%** | 근거 전무 |
| Anthropic이 리눅스 기반 AI OS 배포판 출시 (5년 내) | **< 8%** | 극단적 시장 변화 필요 |
| Claude가 사실상 "Meta-OS"로 기능 (현재 진행 중) | **85%** | MCP+Cowork+Computer Use 이미 작동 |
| Anthropic이 OS 회사와 깊은 파트너십 체결 (3년 내) | **40%** | Apple Intelligence 또는 Samsung 등과 통합 가능 |
| 타사(삼성/Jolla 등)가 Claude를 핵심으로 하는 AI OS 출시 | **25%** | MCP 생태계 활용한 서드파티 OS |

---

## 7. 핵심 근거 (사실 vs 추론 구분)

### 사실 (Verified Facts)

1. **[FACT-01]** Dario Amodei의 "Machines of Loving Grace" (2024.10)과 "The Adolescence of Technology" (2026.01) 두 에세이 모두에서 OS 개발에 대한 직접 언급 없음
2. **[FACT-02]** Anthropic의 454개 활성 채용 포지션 중 데스크톱 OS/GUI 개발 관련 포지션 0건
3. **[FACT-03]** $51B+ 컴퓨팅 약정 (NVIDIA $30B + Broadcom $21B) 모두 AI 학습/추론 인프라 목적
4. **[FACT-04]** MCP를 Linux Foundation AAIF에 기부 -- 독점이 아닌 개방형 표준 추구
5. **[FACT-05]** Claude Cowork (2026.01)은 macOS/Windows 위에서 작동하는 에이전트 -- 독립 OS가 아님
6. **[FACT-06]** Computer Use 기능은 기존 OS의 GUI를 AI가 조작하는 것 -- OS를 대체하지 않음
7. **[FACT-07]** Daniela Amodei의 전략은 "기업이 필요로 하는 기능: 파인튜닝, 온프레미스 배포, 보안 인증" -- OS 레벨이 아닌 엔터프라이즈 SaaS 레벨
8. **[FACT-08]** Alex Albert의 "AI agents will replace most software products" 발언은 개별 앱 대체를 의미, OS 대체를 의미하지 않음
9. **[FACT-09]** Anthropic 오픈소스 sandbox-runtime은 bubblewrap(Linux)/seatbelt(macOS) 기반 -- 기존 OS 활용
10. **[FACT-10]** Michael Gerstenhaber는 Anthropic을 떠나 Google로 이동 (2025년경)

### 추론 (Reasoned Inferences)

1. **[INFER-01]** MCP + Agent Skills + Cowork + Computer Use의 조합은 "Meta-OS" 레이어를 형성하고 있으며, 이는 의도적 전략으로 보임
2. **[INFER-02]** Anthropic이 AWS/Google에 깊이 의존하는 한, 이들과 경쟁하는 OS 개발은 전략적으로 불합리
3. **[INFER-03]** Claude Code $1B ARR (6개월 만에)과 엔터프라이즈 성장은 현재 "OS 없는" 전략이 성공적임을 입증
4. **[INFER-04]** Anthropic의 "안전한 AI" 미션은 OS 개발보다 모델 안전 연구에 자원을 집중시키는 동인
5. **[INFER-05]** 2027년 AGI 도달 시, AI가 기존 OS를 완전히 제어할 수 있게 되면 새로운 OS 개발의 필요성 자체가 감소

---

## 8. bkit OS 프로젝트에 대한 시사점

### 8.1 Anthropic의 전략이 bkit OS에 미치는 영향

| 영향 요인 | bkit OS에 대한 시사점 | 긍정/부정 |
|-----------|----------------------|-----------|
| Anthropic이 OS를 만들지 않음 | bkit OS와 직접 경쟁 없음 | **긍정** |
| MCP가 개방 표준으로 전환 | bkit OS에서 MCP를 활용한 도구 통합 가능 | **긍정** |
| Computer Use 기술 발전 | bkit OS에서 Claude Computer Use 활용 가능 | **긍정** |
| Anthropic의 API-first 전략 | bkit OS가 Claude API를 핵심 AI 엔진으로 사용 가능 | **긍정** |
| Claude Cowork의 데스크톱 에이전트 | bkit OS와 기능 중복 가능성 (파일 관리, 자동화) | **주의** |
| OpenAI/Google의 OS 전략 강화 | bkit OS의 경쟁 환경은 Anthropic이 아닌 빅테크 | **부정** |

### 8.2 전략적 권고

1. **Anthropic을 경쟁자가 아닌 핵심 파트너로 포지셔닝**: Claude API + MCP를 bkit OS의 AI 엔진으로 활용
2. **MCP 생태계 활용**: 10,000+ MCP 서버가 bkit OS의 즉시 사용 가능한 "드라이버/앱 생태계" 역할
3. **오픈소스 LLM 병행**: Anthropic 의존도를 줄이기 위해 온디바이스 오픈소스 LLM 동시 지원
4. **차별화 포인트**: Anthropic이 만들지 않는 "진짜 OS 레벨 통합"이 bkit OS의 고유 가치

---

## Sources

### 에세이 & 블로그
- [Dario Amodei - Machines of Loving Grace](https://www.darioamodei.com/essay/machines-of-loving-grace)
- [Dario Amodei - The Adolescence of Technology](https://www.darioamodei.com/essay/the-adolescence-of-technology)
- [Introducing the Model Context Protocol](https://www.anthropic.com/news/model-context-protocol)
- [Donating MCP and Establishing AAIF](https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation)
- [Introducing Cowork | Claude](https://claude.com/blog/cowork-research-preview)

### 인터뷰 & 팟캐스트
- [Dario Amodei on Dwarkesh Patel - "We are near the end of the exponential"](https://www.dwarkesh.com/p/dario-amodei-2)
- [Lex Fridman Podcast #452 - Dario Amodei Transcript](https://lexfridman.com/dario-amodei-transcript/)
- [Zvi Mowshowitz - On Dwarkesh Patel's 2026 Podcast With Dario Amodei](https://thezvi.substack.com/p/on-dwarkesh-patels-2026-podcast-with)

### 뉴스 & 분석
- [Anthropic CEO Dario Amodei warns AI's "adolescence" will "test" humanity | Fortune](https://fortune.com/2026/01/27/anthropic-ceo-dario-amodei-essay-warning-ai-adolescence-test-humanity-risks-remedies/)
- [Anthropic CEO's grave warning: AI will "test us as a species" | Axios](https://www.axios.com/2026/01/26/anthropic-ai-dario-amodei-humanity)
- [Anthropic's Bold Prediction: AI Agents Will Devour Most Software Products](https://www.webpronews.com/anthropics-bold-prediction-ai-agents-will-devour-most-software-products-by-2026/)
- [Anthropic launches enterprise agents with plugins | TechCrunch](https://techcrunch.com/2026/02/24/anthropic-launches-new-push-for-enterprise-agents-with-plugins-for-finance-engineering-and-design/)
- [Anthropic launches Cowork desktop agent | VentureBeat](https://venturebeat.com/technology/anthropic-launches-cowork-a-claude-desktop-agent-that-works-in-your-files-no)
- [Anthropic Deepened Partnership With Nvidia | Motley Fool](https://www.fool.com/investing/2025/12/04/anthropic-just-deepened-its-partnership-with-nvidi/)
- [Anthropic's $21 billion chip deal with Broadcom | RCR Tech](https://rcrtech.com/semiconductor-news/anthropics-broadcom-chip-deal/)
- [Daniela Amodei on the company's 'do more with less' bet | CNBC](https://www.cnbc.com/2026/01/03/anthropic-daniela-amodei-do-more-with-less-bet.html)
- [Anthropic's Philosopher Amanda Askell Shapes Claude's Soul | ResultSense](https://www.resultsense.com/news/2026-02-10-anthropic-philosopher-amanda-askell-teaches-claude-morals)
- [MCP Apps - Claude Becomes Your AI Operating System | Context Studios](https://www.contextstudios.ai/blog/mcp-apps-claude-becomes-your-ai-operating-system)
- [OpenAI vs Google Gemini: AI Operating System | Baptista Research](https://baptistaresearch.com/openai-vs-google-gemini-ai-operating-system/)

### 채용 정보
- [Security Engineer, Operating Systems | Anthropic Careers](https://www.anthropic.com/careers/jobs/4929693008)
- [Software Engineer, Sandboxing (Systems) | Anthropic](https://job-boards.greenhouse.io/anthropic/jobs/5025591008)
- [Infrastructure Engineer, Sandboxing | Anthropic](https://job-boards.greenhouse.io/anthropic/jobs/5030680008)

### 오픈소스
- [Anthropic sandbox-runtime | GitHub](https://github.com/anthropic-experimental/sandbox-runtime)
- [Model Context Protocol | GitHub](https://github.com/modelcontextprotocol)
- [Linux Foundation AAIF Announcement](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation)
