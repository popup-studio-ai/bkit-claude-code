---
description: Claude Code settings upgrade
---

# Claude Code 설정 업그레이드

현재 설정을 분석하고 **최신 트렌드를 반영**하여 업그레이드를 제안합니다.
**어떤 프로젝트, 어떤 언어에서든** 동일하게 작동합니다.

## 사용법

```
/upgrade-claude-code
```

## 왜 이 커맨드가 필요한가?

```
문제 1: Claude Code 설정이 구식일 수 있음
문제 2: 새로운 기능이나 베스트 프랙티스를 놓칠 수 있음
문제 3: 설정 완성도를 객관적으로 평가하기 어려움

해결:
- 현재 설정 점수화 (100점 만점)
- WebSearch로 최신 트렌드 조사
- 구체적인 개선 제안
```

## 수행 작업

### 1단계: 마스터 가이드 참조

**반드시** 다음 문서를 먼저 읽습니다:

```
.claude/docs/CLAUDE-CODE-MASTERY.md           # 목차 및 핵심 개념
.claude/docs/mastery/05-advanced.md           # 최신 트렌드 분석 방법
.claude/docs/mastery/02-language-templates.md # 언어별 템플릿
.claude/docs/mastery/01-settings-guide.md     # 설정 요소별 상세 (MCP 추천 포함)
```

필요한 내용에 따라 해당 파일을 참조합니다.

### 2단계: 현재 설정 분석

```bash
# 분석 대상
1. CLAUDE.md - 규칙 수, 상세도
2. .claude/settings.local.json - 훅, 권한 설정
3. .claude/commands/ - 커맨드 수, 품질
4. .claude/agents/ - 에이전트 수, 전문성
5. .claude/skills/ - 스킬 수, 도메인 커버리지
6. .mcp.json - 연결된 외부 도구
7. .github/workflows/ - CI/CD 자동화
```

### 3단계: 설정 점수 산출

```markdown
## 점수 기준 (총 100점)

### CLAUDE.md (20점)
- 0점: 파일 없음
- 10점: 기본 규칙만 있음
- 15점: 상세 규칙 + 예시 포함
- 20점: 팀 지식 축적 + Git 관리

### Commands (15점)
- 0점: 폴더 없음
- 5점: 1-2개
- 10점: 3-5개
- 15점: 5개+ 및 인라인 Bash 활용

### Agents (15점)
- 0점: 폴더 없음
- 5점: 1-2개
- 10점: 3-4개
- 15점: 4개+ 및 전문화됨

### Skills (15점)
- 0점: 폴더 없음
- 5점: 1-2개
- 10점: 3-4개 (도메인별)
- 15점: 전체 도메인 커버

### Hooks (10점)
- 0점: 설정 없음
- 5점: 기본 포맷팅만
- 10점: 포맷팅 + 린트 + 추가 자동화

### Permissions (10점)
- 0점: 설정 없음 또는 전체 허용
- 5점: 기본 화이트리스트
- 10점: 세밀한 화이트리스트

### MCP (10점)
- 0점: 연결 없음
- 5점: 1-2개 서버
- 10점: 3개+ 외부 도구 연결

### GitHub Action (5점)
- 0점: 없음
- 5점: PR 자동 문서화 설정됨

### PDCA 문서 (보너스 10점)
- 0점: docs/ 폴더 없음
- 3점: 일부 폴더만 있음
- 7점: 전체 구조 (01-plan ~ 04-report)
- 10점: 전체 구조 + 활발한 문서 작성
```

### 4단계: 최신 트렌드 조사 (WebSearch)

다음 검색어로 최신 정보를 수집합니다:

```
- "Claude Code best practices 2026"
- "Claude Code configuration tips latest"
- "Claude MCP servers new"
- "anthropic claude code updates"
- "Boris Cherny Claude Code tips"
```

### 5단계: 개선점 식별

```markdown
## 개선점 우선순위

### 높음 (점수 향상 5점+)
- [x] CLAUDE.md 규칙 상세화
- [x] Skills 폴더 추가
- [x] 누락된 Agents 추가

### 중간 (점수 향상 3-5점)
- [ ] 새로운 MCP 서버 연결
- [ ] 커맨드 추가
- [ ] 훅 고도화

### 낮음 (점수 향상 1-2점)
- [ ] 기존 설정 최적화
- [ ] 문서 개선
```

### 6단계: 사용자에게 제안

```markdown
## 업그레이드 제안

### 현재 점수: XX/100

### 권장 업그레이드

1. **[높음]** Skills 폴더 추가
   - 예상 점수 향상: +15점
   - 효과: 도메인별 전문 컨텍스트 제공

2. **[중간]** 새 MCP 서버 연결
   - 예상 점수 향상: +5점
   - 효과: Jira/Confluence 연동

3. **[낮음]** 커맨드 추가
   - 예상 점수 향상: +2점
   - 효과: 추가 자동화

### 최신 트렌드

🔥 **2026년 트렌드**:
- {조사된 트렌드 1}
- {조사된 트렌드 2}
- {조사된 트렌드 3}

⚡ **새로운 기능**:
- {새 기능 1}
- {새 기능 2}
```

### 7단계: 사용자 승인 대기

```
업그레이드를 적용하시겠습니까?

1. 전체 적용
2. 선택적 적용 (번호 선택)
3. 취소
```

### 8단계: 업그레이드 적용

사용자 승인 시:
1. 백업 생성 (기존 파일)
2. 새 설정 적용
3. 변경 사항 요약

## 결과 출력

```
🚀 Claude Code 업그레이드 완료!

📊 점수 변화: XX/100 → YY/100 (+ZZ점)

📝 적용된 변경:
- Skills 폴더 생성 (4개)
- 새 MCP 서버 연결 (Jira)
- CLAUDE.md 규칙 추가

🔥 반영된 최신 트렌드:
- {트렌드 1}
- {트렌드 2}

🎯 다음 단계:
- 새로운 설정 테스트
- 팀원과 공유
- /learn-claude-code 로 새 기능 학습
```

## 롤백 방법

```bash
# 백업에서 복원
git checkout HEAD~1 -- .claude/
git checkout HEAD~1 -- CLAUDE.md
git checkout HEAD~1 -- .mcp.json
```

## 참고 문서

### Claude Code 마스터리
- .claude/docs/CLAUDE-CODE-MASTERY.md
- .claude/docs/mastery/05-advanced.md (트렌드 분석)
- .claude/docs/mastery/01-settings-guide.md (MCP 추천 전략 포함)

### PDCA 방법론
- .claude/docs/pdca/overview.md
- .claude/docs/levels/upgrade-guide.md (레벨 업그레이드)

### 분석 도구
- .claude/agents/gap-detector.md (Gap 분석)
- .claude/skills/analysis-patterns/ (분석 패턴)