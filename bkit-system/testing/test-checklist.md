# Test Checklist

> bkit 기능 검증을 위한 테스트 체크리스트

## 테스트 목적

1. **Hooks 발동 검증**: 예상한 시점에 hooks가 발동하는지
2. **Script 출력 검증**: 올바른 JSON이 출력되는지
3. **시나리오 검증**: 사용자 시나리오별 예상 동작 확인

---

## 1. PreToolUse Hooks 테스트

### 1.1 bkit-rules (pre-write.sh - unified hook)

| # | 테스트 케이스 | 예상 결과 | Pass |
|---|-------------|----------|------|
| 1.1.1 | src/features/auth/login.ts Write (design doc 있음) | "Design doc 참조" 안내 | [ ] |
| 1.1.2 | src/features/auth/login.ts Write (design doc 없음) | 빈 출력 | [ ] |
| 1.1.3 | src/features/auth/login.ts Write (plan doc만 있음) | "Design 먼저 만드세요" 경고 | [ ] |
| 1.1.4 | README.md Write | 빈 출력 (docs 파일) | [ ] |
| 1.1.5 | src/lib/utils.ts Write | 빈 출력 (feature 아님) | [ ] |

### 1.1.1 Multi-Language Support (v1.2.1)

| # | 테스트 케이스 | 예상 결과 | Pass |
|---|-------------|----------|------|
| 1.1.6 | internal/auth/handler.go Write | 소스 파일 감지 (Go) | [ ] |
| 1.1.7 | app/routers/users.py Write | 소스 파일 감지 (Python) | [ ] |
| 1.1.8 | src/main.rs Write | 소스 파일 감지 (Rust) | [ ] |
| 1.1.9 | packages/api/index.ts Write | 소스 파일 감지 (Monorepo) | [ ] |
| 1.1.10 | node_modules/pkg/index.js Write | 빈 출력 (exclude pattern) | [ ] |
| 1.1.11 | __pycache__/module.py Write | 빈 출력 (exclude pattern) | [ ] |

### 1.1.2 Language Tier Detection (v1.2.1)

| # | 테스트 케이스 | 예상 결과 | Pass |
|---|-------------|----------|------|
| 1.1.12 | get_language_tier "test.py" | "1" (Tier 1 - AI-Native) | [ ] |
| 1.1.13 | get_language_tier "test.ts" | "1" (Tier 1 - AI-Native) | [ ] |
| 1.1.14 | get_language_tier "test.go" | "2" (Tier 2 - Mainstream) | [ ] |
| 1.1.15 | get_language_tier "test.dart" | "2" (Tier 2 - Mainstream) | [ ] |
| 1.1.16 | get_language_tier "test.astro" | "2" (Tier 2 - Mainstream) | [ ] |
| 1.1.17 | get_language_tier "test.java" | "3" (Tier 3 - Domain) | [ ] |
| 1.1.18 | get_language_tier "test.php" | "4" (Tier 4 - Legacy) | [ ] |
| 1.1.19 | get_language_tier "test.mojo" | "experimental" | [ ] |
| 1.1.20 | get_language_tier "test.unknown" | "unknown" | [ ] |

### 1.1.3 New Extension Support (v1.2.1)

| # | 테스트 케이스 | 예상 결과 | Pass |
|---|-------------|----------|------|
| 1.1.21 | is_code_file "app.dart" | true (Flutter/Dart) | [ ] |
| 1.1.22 | is_code_file "page.astro" | true (Astro) | [ ] |
| 1.1.23 | is_code_file "doc.mdx" | true (MDX) | [ ] |
| 1.1.24 | is_code_file "ai.mojo" | true (Mojo) | [ ] |
| 1.1.25 | is_code_file "sys.zig" | true (Zig) | [ ] |
| 1.1.26 | is_ui_file "Hero.astro" | true (Astro UI) | [ ] |

### 1.2 Task Classification (integrated in pre-write.sh)

> **Note**: Task classification is now integrated into `pre-write.sh` (v1.2.0)

| # | 테스트 케이스 | 예상 결과 | Pass |
|---|-------------|----------|------|
| 1.2.1 | 30자 수정 | "Quick Fix" (no PDCA) | [ ] |
| 1.2.2 | 100자 수정 | "Minor Change" (check /pdca-status) | [ ] |
| 1.2.3 | 500자 수정 | "Feature" (design doc recommended) | [ ] |
| 1.2.4 | 1500자 수정 | "Major Feature" (design doc required, may block) | [ ] |
| 1.2.5 | docs/README.md 수정 | 빈 출력 (src/ 외부) | [ ] |

### 1.3 Convention Hints (integrated in pre-write.sh)

| # | 테스트 케이스 | 예상 결과 | Pass |
|---|-------------|----------|------|
| 1.3.1 | .ts 파일 Write | TypeScript 컨벤션 안내 | [ ] |
| 1.3.2 | .tsx 파일 Write | TypeScript 컨벤션 안내 | [ ] |
| 1.3.3 | .env 파일 Write | 환경변수 컨벤션 안내 | [ ] |
| 1.3.4 | .md 파일 Write | 빈 출력 | [ ] |

### 1.4 zero-script-qa (qa-pre-bash.sh)

| # | 테스트 케이스 | 예상 결과 | Pass |
|---|-------------|----------|------|
| 1.4.1 | `docker compose logs -f` | Allow | [ ] |
| 1.4.2 | `rm -rf /tmp/*` | Block | [ ] |
| 1.4.3 | `DROP TABLE users` | Block | [ ] |
| 1.4.4 | `ls -la` | Allow | [ ] |

### 1.5 phase-9-deployment (phase9-deploy-pre.sh)

| # | 테스트 케이스 | 예상 결과 | Pass |
|---|-------------|----------|------|
| 1.5.1 | `vercel deploy` (.env.example 있음) | Allow + "✅ 체크 완료" | [ ] |
| 1.5.2 | `vercel deploy` (.env.example 없음) | Allow + "⚠️ 체크 필요" | [ ] |
| 1.5.3 | `npm install` | 빈 출력 (배포 아님) | [ ] |

---

## 2. PostToolUse Hooks 테스트

### 2.1 bkit-rules (pdca-post-write.sh)

| # | 테스트 케이스 | 예상 결과 | Pass |
|---|-------------|----------|------|
| 2.1.1 | src/features/auth/ Write (design doc 있음) | "/pdca-analyze 권장" | [ ] |
| 2.1.2 | src/features/auth/ Write (design doc 없음) | 빈 출력 | [ ] |
| 2.1.3 | src/lib/utils.ts Write | 빈 출력 | [ ] |

### 2.2 phase-5-design-system (phase5-design-post.sh)

> **Note**: Extension-based detection (v1.2.1) - .tsx, .jsx, .vue, .svelte

| # | 테스트 케이스 | 예상 결과 | Pass |
|---|-------------|----------|------|
| 2.2.1 | components/Button.tsx Write (하드코딩 색상 있음) | "⚠️ 디자인 토큰 사용" 경고 | [ ] |
| 2.2.2 | components/Button.tsx Write (하드코딩 없음) | "✅ 디자인 토큰 올바름" | [ ] |
| 2.2.3 | src/lib/api.ts Write | 빈 출력 (.ts는 UI 아님) | [ ] |
| 2.2.4 | src/App.vue Write (하드코딩 색상 있음) | "⚠️ 디자인 토큰 사용" 경고 | [ ] |
| 2.2.5 | src/Button.svelte Write | UI 파일 감지 | [ ] |

### 2.3 phase-6-ui-integration (phase6-ui-post.sh)

> **Note**: Extension-based UI detection (v1.2.1) + path-based layer detection

| # | 테스트 케이스 | 예상 결과 | Pass |
|---|-------------|----------|------|
| 2.3.1 | pages/login.tsx Write | "UI Layer Check" 안내 | [ ] |
| 2.3.2 | features/auth/LoginForm.tsx Write | "UI Layer Check" 안내 | [ ] |
| 2.3.3 | services/authService.ts Write | "Service Layer Check" 안내 | [ ] |
| 2.3.4 | lib/utils.ts Write | 빈 출력 | [ ] |
| 2.3.5 | src/components/Modal.vue Write | "UI Layer Check" 안내 | [ ] |
| 2.3.6 | src/Card.svelte Write | "UI Layer Check" 안내 | [ ] |

### 2.4 qa-monitor (qa-monitor-post.sh)

| # | 테스트 케이스 | 예상 결과 | Pass |
|---|-------------|----------|------|
| 2.4.1 | QA 보고서 Write (Critical 있음) | "🚨 Critical 감지, /pdca-iterate 권장" | [ ] |
| 2.4.2 | QA 보고서 Write (Critical 없음) | "✅ No critical issues" | [ ] |
| 2.4.3 | 일반 파일 Write | 빈 출력 | [ ] |

---

## 3. Stop Hooks 테스트

| # | Skill | 테스트 방법 | 예상 결과 | Pass |
|---|-------|-----------|----------|------|
| 3.1 | phase-4-api | API 작업 완료 후 | "Zero Script QA 안내" | [ ] |
| 3.2 | phase-8-review | 리뷰 작업 완료 후 | "리뷰 완료 요약" | [ ] |
| 3.3 | bkit-templates (via gap-detector) | 갭 분석 완료 후 | "분석 결과 안내" | [ ] |
| 3.4 | zero-script-qa | QA 세션 종료 | "다음 단계 안내" | [ ] |

---

## 4. SessionStart Hook 테스트

| # | 테스트 케이스 | 예상 결과 | Pass |
|---|-------------|----------|------|
| 4.1 | 새 세션 시작 | session-start.sh 실행, 인사 메시지 | [ ] |
| 4.2 | once: true 설정 | 한 번만 실행 | [ ] |

---

## 5. Skill 활성화 테스트

### 5.1 키워드 매칭

| # | 사용자 입력 | 활성화 예상 Skill | Pass |
|---|-----------|------------------|------|
| 5.1.1 | "정적 웹사이트 만들어줘" | starter | [ ] |
| 5.1.2 | "로그인 기능 구현해줘" | dynamic, phase-4-api | [ ] |
| 5.1.3 | "쿠버네티스 배포 설정해줘" | enterprise, phase-9-deployment | [ ] |
| 5.1.4 | "API 설계해줘" | phase-4-api | [ ] |
| 5.1.5 | "디자인 시스템 구축해줘" | phase-5-design-system | [ ] |
| 5.1.6 | "갭 분석해줘" | bkit-templates, gap-detector agent | [ ] |
| 5.1.7 | "QA 해줘" | zero-script-qa | [ ] |

### 5.2 Level 감지

| # | 프로젝트 구조 | 감지 레벨 | Pass |
|---|-------------|----------|------|
| 5.2.1 | index.html만 있음 | Starter | [ ] |
| 5.2.2 | package.json + bkend 설정 | Dynamic | [ ] |
| 5.2.3 | kubernetes/ + terraform/ | Enterprise | [ ] |
| 5.2.4 | CLAUDE.md에 "Level: Dynamic" | Dynamic | [ ] |

---

## 6. Agent 자동 호출 테스트

| # | 조건 | 호출 Agent | Pass |
|---|------|-----------|------|
| 6.1 | Level=Starter + 코딩 요청 | starter-guide | [ ] |
| 6.2 | Level=Dynamic + 백엔드 작업 | bkend-expert | [ ] |
| 6.3 | Level=Enterprise + 아키텍처 | enterprise-expert | [ ] |
| 6.4 | "코드 리뷰해줘" | code-analyzer | [ ] |
| 6.5 | "갭 분석해줘" | gap-detector | [ ] |
| 6.6 | "QA 해줘" | qa-monitor | [ ] |
| 6.7 | 구현 완료 후 | Gap Analysis 제안 | [ ] |
| 6.8 | 갭 분석 < 70% 후 | pdca-iterator 제안 | [ ] |

---

## 7. 시나리오 통합 테스트

### 7.1 새 기능 구현 전체 플로우

```
1. "로그인 기능 만들어줘" 요청
2. design doc 확인 → 없으면 생성 제안
3. 구현 중 Write hooks 발동 확인
4. 구현 완료 후 Gap Analysis 제안
5. 분석 후 iterate 또는 report 제안
```

| # | 단계 | 확인 항목 | Pass |
|---|------|---------|------|
| 7.1.1 | 요청 | bkit-rules skill 활성화 | [ ] |
| 7.1.2 | 문서 확인 | design doc 존재 여부 체크 | [ ] |
| 7.1.3 | Write | pdca-pre-write 발동 | [ ] |
| 7.1.4 | Write | task-classify 발동 | [ ] |
| 7.1.5 | Write 후 | pdca-post-write 발동 | [ ] |
| 7.1.6 | 완료 | Gap Analysis 제안 | [ ] |

### 7.2 Zero Script QA 전체 플로우

```
1. "/zero-script-qa" 요청
2. Docker 환경 확인
3. 로그 모니터링
4. 이슈 감지 및 보고
5. 보고서 생성
```

| # | 단계 | 확인 항목 | Pass |
|---|------|---------|------|
| 7.2.1 | 요청 | zero-script-qa skill 활성화 | [ ] |
| 7.2.2 | Bash | qa-pre-bash 발동 | [ ] |
| 7.2.3 | 보고서 Write | qa-monitor-post 발동 | [ ] |
| 7.2.4 | 종료 | qa-stop 발동 | [ ] |

---

## 테스트 실행 방법

### Script 단위 테스트

```bash
# 직접 script 실행 (scripts are at root level, not in .claude/)
echo '{"tool_input":{"file_path":"src/features/auth/login.ts","content":"test"}}' | \
  scripts/pre-write.sh
```

### 통합 테스트

```bash
# Claude Code 세션에서 실제 시나리오 실행
# 1. 새 세션 시작
# 2. 테스트 케이스 입력
# 3. 예상 동작 확인
```

---

## 관련 문서

- [[../triggers/trigger-matrix]] - 트리거 매트릭스
- [[../scenarios/scenario-write-code]] - 코드 작성 시나리오
- [[../scenarios/scenario-new-feature]] - 새 기능 시나리오
- [[../scenarios/scenario-qa]] - QA 시나리오
