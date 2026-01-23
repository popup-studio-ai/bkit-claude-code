# Claude Code 2.1.17 버전 대응 고도화 계획

> **Summary**: Claude Code 2.1.15 → 2.1.17 업데이트 대응 및 bkit 플러그인 고도화
>
> **Project**: bkit-claude-code
> **Version**: v1.3.0 → v1.3.1
> **Author**: Claude Code
> **Date**: 2026-01-23
> **Status**: Draft (Review Required)

---

## 1. Overview

### 1.1 Purpose

Claude Code 2.1.16 ~ 2.1.17 버전의 새로운 기능과 개선사항을 bkit 플러그인에 반영하여:
- 새로운 Task Management System과 PDCA 워크플로우 통합
- 안정성 개선사항 활용 (서브에이전트 OOM 수정)
- 버전 호환성 문서 최신화

### 1.2 Background

**현재 상태**:
- bkit v1.3.0은 Claude Code 2.1.15까지 대응 완료
- 기존 분석 문서: `docs/archive/12-claude-code-2.1.15-impact-analysis.md`

**새 버전 현황**:
- 2.1.16: 2025-01-22 릴리스 (Task Management System 등 4개 신규 기능)
- 2.1.17: 2025-01-22 릴리스 (하드웨어 호환성 수정)

### 1.3 Related Documents

- 기존 분석: `docs/archive/11-claude-code-2.1.14-impact-analysis.md`
- 기존 분석: `docs/archive/12-claude-code-2.1.15-impact-analysis.md`
- Claude Code CHANGELOG: https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md

---

## 2. 조사 계획

### 2.1 Claude Code 버전 업데이트 조사 (완료)

#### 2.1.1 2.1.16 주요 변경사항

| 분류 | 변경사항 | bkit 영향도 |
|------|---------|:-----------:|
| **신규 기능** | Task Management System (의존성 추적 포함) | ⭐⭐⭐⭐⭐ |
| **신규 기능** | VSCode 네이티브 플러그인 관리 | ⭐⭐⭐ |
| **신규 기능** | OAuth 원격 세션 브라우징/재개 (VSCode) | ⭐⭐ |
| **버그 수정** | 서브에이전트 세션 재개 시 OOM 크래시 | ⭐⭐⭐⭐⭐ |
| **버그 수정** | `/compact` 후 context 경고 미해제 | ⭐⭐⭐ |
| **버그 수정** | 세션 제목 언어 설정 미반영 | ⭐⭐ |
| **버그 수정** | Windows IDE 사이드바 레이스 컨디션 | ⭐⭐ |

#### 2.1.2 2.1.17 주요 변경사항

| 분류 | 변경사항 | bkit 영향도 |
|------|---------|:-----------:|
| **버그 수정** | AVX 명령어 미지원 프로세서 크래시 | ⭐ (간접) |

#### 2.1.3 핵심 영향 분석

```
bkit 영향도 매트릭스
─────────────────────────────────────────────────────────────
High Impact (즉각 활용 권장):
├── Task Management System
│   └── PDCA 워크플로우와 통합 가능
│   └── 작업 의존성 추적으로 순차/병렬 작업 관리
│
└── 서브에이전트 OOM 수정
    └── Multi-agent 워크플로우 안정성 향상
    └── gap-detector + code-analyzer 병렬 실행 안정화

Medium Impact (개선 기회):
├── VSCode 플러그인 관리
│   └── VSCode 사용자 경험 개선
│
└── /compact 경고 수정
    └── 2.1.15에서 이미 수정된 항목 유지 확인

Low Impact (문서 업데이트):
└── AVX 호환성, 언어 설정, Windows 수정
    └── 호환성 정보에 반영
─────────────────────────────────────────────────────────────
```

### 2.2 현재 코드베이스 분석 계획

#### 2.2.1 분석 대상 컴포넌트

| 컴포넌트 | 파일 수 | 분석 목적 |
|---------|:------:|----------|
| **Agents** | 11개 | Task System 통합 포인트 식별 |
| **Skills** | 18개 | 워크플로우 개선 기회 |
| **Commands** | 20개 | 신규 기능 연동 가능성 |
| **Hooks** | 2개 | 기존 메커니즘과 충돌 점검 |
| **Templates** | 10+개 | Task 연동 템플릿 |

#### 2.2.2 Task System 통합 분석

| 분석 항목 | 목적 |
|----------|------|
| pdca-iterator 에이전트 | 반복 작업 추적을 Task System으로 전환 |
| gap-detector 에이전트 | 분석 결과를 Task로 등록 |
| pipeline-guide 에이전트 | 9단계 파이프라인을 Task 의존성으로 관리 |
| PDCA 워크플로우 | Plan → Design → Do → Check → Act 순차 관리 |

#### 2.2.3 Multi-Agent 안정성 분석

| 에이전트 조합 | 현재 실행 방식 | 개선 가능성 |
|-------------|--------------|------------|
| gap-detector + code-analyzer | 순차/병렬 혼합 | OOM 수정으로 병렬 안정화 |
| pdca-iterator 반복 루프 | 순차 | 메모리 안정성 향상 |
| Enterprise 복잡 분석 | 제한적 병렬 | 완전 병렬화 검토 |

---

## 3. Scope

### 3.1 In Scope

- [x] Claude Code 2.1.16/2.1.17 변경사항 조사 (완료)
- [ ] Task Management System 통합 설계
- [ ] PDCA 워크플로우 - Task System 연동
- [ ] Multi-Agent 병렬 실행 최적화
- [ ] 버전 호환성 문서 업데이트
- [ ] README 및 CHANGELOG 업데이트

### 3.2 Out of Scope

- VSCode 전용 기능 개발 (플러그인 관리 UI 등)
- OAuth 세션 관리 직접 연동
- Claude Code 내부 구현 변경 요청

### 3.3 🚨 크로스플랫폼 호환성 이슈 (In Scope로 전환)

**문제**: 현재 bkit의 모든 hooks 스크립트(21개)가 `.sh` (bash) 형식

| 환경 | Claude Code | 현재 bkit hooks |
|-----|:-----------:|:---------------:|
| **macOS** | ✅ | ✅ |
| **Linux** | ✅ | ✅ |
| **Windows (WSL)** | ✅ | ✅ |
| **Windows (Native)** | ✅ | ❌ **미동작** |

**근본 원인**:
- Claude Code hooks는 **shebang 기반**으로 인터프리터 실행
- `#!/bin/bash`는 Windows Native에서 bash가 없으면 실패
- [GitHub Issue #5049, #6453](https://github.com/anthropics/claude-code/issues/5049): Windows bash/PowerShell 혼동 알려진 이슈

**영향받는 파일** (scripts/ 디렉토리 21개):
```
pre-write.sh, pdca-post-write.sh, gap-detector-post.sh,
qa-monitor-post.sh, design-validator-pre.sh, ...
```

---

### 3.4 해결 방안: Node.js 전환 (B안 확정)

**선택 근거**:

| 요소 | Node.js 전환 장점 |
|------|------------------|
| **Claude Code 호환** | Claude Code 자체가 Node.js 기반 → Node.js 이미 설치됨 |
| **크로스플랫폼** | Windows, Mac, Linux 모두 동일 코드 |
| **유지보수** | .sh + .ps1 이중 관리 불필요, 단일 코드베이스 |
| **JSON 처리** | hooks 입출력이 JSON → JavaScript 네이티브 지원 |
| **shebang 지원** | `#!/usr/bin/env node` → 모든 플랫폼에서 동작 |

**전환 예시**:

```bash
# Before: pre-write.sh
#!/bin/bash
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path')
```

```javascript
// After: pre-write.js
#!/usr/bin/env node
const input = JSON.parse(require('fs').readFileSync(0, 'utf8'));
const filePath = input.tool_input?.file_path ?? '';
```

**추가 이점**:
- `jq` 외부 의존성 제거 (Windows에서 jq 설치 필요 없음)
- 에러 핸들링 개선 (try-catch)
- 타입 안정성 (TypeScript 전환 가능성)

---

## 4. Requirements

### 4.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | Task System과 PDCA 상태 동기화 | High | Pending |
| FR-02 | PDCA 각 단계를 Task로 등록/추적 | High | Pending |
| FR-03 | Task 의존성으로 워크플로우 순서 강제 | Medium | Pending |
| FR-04 | gap-detector 결과를 Task로 자동 생성 | Medium | Pending |
| FR-05 | pdca-iterator 반복을 Task로 추적 | Medium | Pending |
| **FR-06** | **모든 hooks를 Node.js로 전환** | **Critical** | Pending |
| **FR-07** | **Windows Native 환경에서 완전 동작** | **Critical** | Pending |
| FR-08 | jq 외부 의존성 제거 | High | Pending |

### 4.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| **크로스플랫폼** | Windows/Mac/Linux 모두 동작 | 각 OS 테스트 |
| **외부 의존성** | jq, bash 불필요 (Node.js만) | 설치 검증 |
| 호환성 | Claude Code 2.1.15+ 지원 | 버전 테스트 |
| 안정성 | Multi-agent 병렬 실행 안정 | OOM 발생 없음 |
| 성능 | Task System 오버헤드 최소화 | 응답 시간 측정 |

---

## 5. Success Criteria

### 5.1 Definition of Done

- [ ] **모든 hooks Node.js 전환 완료 (21개)**
- [ ] **Windows Native 환경 테스트 통과**
- [ ] Task Management System 통합 설계 문서 완료
- [ ] 주요 에이전트 Task 연동 구현
- [ ] 버전 호환성 테스트 통과
- [ ] 문서 업데이트 완료

### 5.2 Quality Criteria

- [ ] **Windows, Mac, Linux 모두 동일 동작**
- [ ] **외부 의존성 없음 (jq, bash 불필요)**
- [ ] 기존 기능 회귀 없음
- [ ] Claude Code 2.1.15 ~ 2.1.17 모두 호환
- [ ] Multi-agent 시나리오 안정성 확인

---

## 6. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **Node.js 전환 시 버그** | High | Medium | 단계적 전환, 철저한 테스트 |
| **bash 전용 로직 손실** | Medium | Low | 기능 동등성 검증 체크리스트 |
| Task API 변경 가능성 | High | Medium | 추상화 레이어 도입 |
| 기존 워크플로우 호환성 | High | Low | 점진적 마이그레이션 |
| 복잡성 증가 | Medium | Medium | 선택적 활성화 옵션 |

---

## 7. Architecture Considerations

### 7.1 Task System 통합 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    PDCA Task Integration                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  pdca-plan  │───▶│ pdca-design │───▶│   Do (code) │     │
│  │   (Task 1)  │    │   (Task 2)  │    │   (Task 3)  │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                  │                  │             │
│         │    blockedBy     │    blockedBy     │             │
│         ▼                  ▼                  ▼             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                Claude Code Task System               │   │
│  │  - TaskCreate: PDCA 단계별 Task 생성                 │   │
│  │  - TaskUpdate: 상태 업데이트 (pending→in_progress)   │   │
│  │  - Dependency: blockedBy로 순서 강제                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │  gap-detector   │───▶│  pdca-iterator  │                │
│  │   (Task 4)      │    │   (Task 5~9)    │                │
│  │   Check Phase   │    │   Act Phase     │                │
│  └─────────────────┘    └─────────────────┘                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 구현 방향

| 접근 방식 | 장점 | 단점 | 선택 |
|----------|------|------|:----:|
| **A. 완전 통합** | 일관성, 추적성 | 복잡성, 기존 호환성 | |
| **B. 선택적 통합** | 유연성, 점진적 도입 | 이중 관리 | ✅ |
| **C. 래퍼 방식** | 최소 변경 | 기능 제한 | |

**선택 근거**: 기존 PDCA 워크플로우를 유지하면서 Task System 이점 활용

---

## 8. 구현 단계 제안

### Phase 1: 조사 및 설계 (현재)

- [x] Claude Code 2.1.16/2.1.17 변경사항 조사
- [x] 현재 코드베이스 구조 파악
- [ ] Task System API 상세 분석
- [ ] 통합 설계 문서 작성

### Phase 2: 핵심 통합

- [ ] PDCA 상태 ↔ Task 동기화 유틸리티
- [ ] pdca-plan 명령 Task 생성 연동
- [ ] gap-detector 결과 Task 자동 생성

### Phase 3: 고도화

- [ ] pdca-iterator Task 기반 반복 관리
- [ ] pipeline-guide Task 의존성 통합
- [ ] Multi-agent 병렬 최적화

### Phase 4: 크로스플랫폼 전환 (Node.js)

**목표**: 모든 .sh 스크립트를 .js로 전환하여 Windows/Mac/Linux 완전 호환

#### 4.1 공통 라이브러리 전환
- [ ] `lib/common.sh` → `lib/common.js` (유틸리티 함수)
- [ ] JSON 입출력 헬퍼 함수
- [ ] 파일 경로 처리 (크로스플랫폼)

#### 4.2 핵심 Hooks 전환 (우선순위 High)
- [ ] `pre-write.sh` → `pre-write.js`
- [ ] `pdca-post-write.sh` → `pdca-post-write.js`
- [ ] `gap-detector-post.sh` → `gap-detector-post.js`

#### 4.3 나머지 Hooks 전환 (우선순위 Medium)
- [ ] qa-monitor-post, qa-pre-bash, qa-stop
- [ ] design-validator-pre, phase2-convention-pre
- [ ] phase4-api-stop, phase5-design-post, phase6-ui-post
- [ ] phase8-review-stop, phase9-deploy-pre
- [ ] iterator-stop, analysis-stop
- [ ] archive-feature, sync-folders, validate-plugin, select-template

#### 4.4 Skills/Agents 참조 업데이트
- [ ] `skills/bkit-rules/SKILL.md` hooks 경로 수정 (.sh → .js)
- [ ] 기타 hooks 참조 파일 업데이트

#### 4.5 테스트
- [ ] macOS 테스트
- [ ] Linux 테스트
- [ ] Windows Native (PowerShell) 테스트
- [ ] 기존 기능 회귀 테스트

### Phase 5: 문서화 및 릴리스

- [ ] 버전 호환성 매트릭스 업데이트
- [ ] README, CHANGELOG 업데이트
- [ ] v1.3.1 릴리스

---

## 9. 다음 단계 (After Plan Approval)

1. **Design 문서 작성** (`claude-code-2.1.17-upgrade.design.md`)
   - Task System API 상세 명세
   - 통합 인터페이스 설계
   - 에이전트별 구현 상세

2. **구현 진행**
   - Phase 2 → Phase 3 순차 진행

3. **Gap Analysis**
   - 설계 대비 구현 검증

---

## 10. Appendix: 조사 출처

### 10.1 Claude Code 공식 자료

- GitHub CHANGELOG: https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md
- GitHub Releases: https://github.com/anthropics/claude-code/releases
- 공식 문서: https://code.claude.com/docs

### 10.2 버전별 변경사항 원문

#### 2.1.17 (2025-01-22)
```
Bug fixes:
- Fixed crashes on processors without AVX instruction support
```

#### 2.1.16 (2025-01-22)
```
New features:
- Added new task management system with new capabilities including dependency tracking
- [VSCode] Added native plugin management support
- [VSCode] Added ability for OAuth users to browse and resume remote Claude sessions from the Sessions dialog

Bug fixes:
- Fixed out-of-memory crashes when resuming sessions with heavy subagent usage
- Fixed an issue where the "context remaining" warning was not hidden after running /compact
- Fixed session titles on the resume screen not respecting the user's language setting
- [IDE] Fixed a race condition on Windows where the Claude Code sidebar view container would not appear on start
```

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-01-23 | 초안 작성 - 조사 완료, 계획 수립 | Claude Code |
