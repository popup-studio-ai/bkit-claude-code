# Claude Code 2.1.21 → 2.1.22 업그레이드 Gap 분석

> **분석 일자**: 2026-01-28
> **분석 대상**: bkit v1.4.6 + Claude Code 2.1.21 → 2.1.22
> **분석 범위**: 릴리즈 변경사항 ↔ bkit 플러그인 영향 범위

---

## 1. 릴리즈 변경사항 요약

### v2.1.22 (2026-01-28 06:59 UTC)

| 구분 | 내용 |
|------|------|
| **버그 수정** | Non-interactive 모드(-p)에서 structured outputs 수정 |
| **Breaking Changes** | 없음 |

### v2.1.21 (2026-01-28 02:25 UTC)

| 구분 | 항목 |
|------|------|
| **새 기능** | Japanese IME 전각 숫자 입력 지원 |
| **새 기능** | [VSCode] Python 가상환경 자동 활성화 (`claudeCode.usePythonEnvironment`) |
| **개선** | 파일 읽기/검색 진행 표시기 (Reading... → Read) |
| **개선** | 파일 작업 도구(Read/Edit/Write)를 bash(cat/sed/awk)보다 우선 사용 |
| **버그 수정** | Shell completion 캐시 파일 손상 수정 |
| **버그 수정** | 세션 재개 시 도구 실행 중 API 오류 수정 |
| **버그 수정** | Auto-compact 조기 트리거 수정 (대용량 출력 모델) |
| **버그 수정** | Task ID 삭제 후 재사용 취약점 수정 |
| **버그 수정** | [VSCode] Windows 파일 검색 기능 수정 |
| **버그 수정** | [VSCode] 메시지 액션 버튼 배경색 수정 |

---

## 2. bkit 플러그인 영향 범위 분석

### 2.1 Task 시스템 (높은 영향)

**변경사항**: Task ID 삭제 후 재사용 취약점 수정

| bkit 기능 | 영향도 | 상세 |
|-----------|--------|------|
| `TaskCreate` 사용 | ✅ 긍정적 | Task 생성 시 ID 충돌 위험 감소 |
| `TaskUpdate` (삭제) 사용 | ✅ 긍정적 | 삭제 후 새 Task 생성 안정성 향상 |
| `pdca-iterator` 에이전트 | ✅ 긍정적 | 반복 시 Task 관리 안정성 향상 |
| `gap-detector` 에이전트 | ✅ 긍정적 | Task 기반 워크플로우 안정성 |

**분석**: bkit는 Task 시스템을 핵심적으로 활용하므로 이 버그 수정으로 안정성이 향상됩니다.

```javascript
// bkit.config.json의 Task 사용
"pdca": {
  "autoIterate": true,
  "maxIterations": 5  // 각 반복마다 Task 생성
}
```

### 2.2 Hook 시스템 (중간 영향)

**변경사항**: 세션 재개 시 도구 실행 중 API 오류 수정

| bkit Hook | 영향도 | 상세 |
|-----------|--------|------|
| `SessionStart` | ✅ 긍정적 | 세션 재개 시 Hook 실행 안정성 |
| `PreToolUse` | ✅ 긍정적 | 도구 실행 중단 후 재개 시 안정성 |
| `PostToolUse` | ✅ 긍정적 | 도구 실행 후 Hook 처리 안정성 |
| `Stop` | ✅ 긍정적 | 응답 중단 후 재개 시 안정성 |

**hooks.json 영향받는 Hook 목록**:
```json
{
  "SessionStart": [/* session-start.js */],
  "PreToolUse": [/* pre-write.js, unified-bash-pre.js */],
  "PostToolUse": [/* unified-write-post.js, unified-bash-post.js, skill-post.js */],
  "Stop": [/* unified-stop.js */],
  "UserPromptSubmit": [/* user-prompt-handler.js */],
  "PreCompact": [/* context-compaction.js */]
}
```

### 2.3 Auto-compact 시스템 (중간 영향)

**변경사항**: Auto-compact 조기 트리거 수정 (대용량 출력 모델)

| bkit 기능 | 영향도 | 상세 |
|-----------|--------|------|
| `PreCompact` Hook | ✅ 긍정적 | 적절한 시점에 컨텍스트 압축 |
| `context-compaction.js` | ✅ 긍정적 | 압축 타이밍 정확성 향상 |
| 세션 Context 유지 | ✅ 긍정적 | 불필요한 조기 압축 방지 |

**bkit.config.json 관련 설정**:
```json
{
  "hooks": {
    "contextCompaction": {
      "enabled": true,
      "snapshotLimit": 10
    }
  }
}
```

### 2.4 파일 작업 도구 우선 사용 (낮은 영향)

**변경사항**: Claude가 bash(cat/sed/awk) 대신 Read/Edit/Write 우선 사용

| bkit 기능 | 영향도 | 상세 |
|-----------|--------|------|
| `PreToolUse:Bash` Hook | ⚠️ 간접 | Bash 호출 빈도 감소 예상 |
| `unified-bash-pre.js` | ⚠️ 간접 | 파일 작업 관련 Bash 검증 호출 감소 |
| `pre-write.js` | ✅ 긍정적 | Write/Edit 사용 증가로 Hook 활성화 증가 |

**분석**: Claude가 파일 작업에 전용 도구를 사용하면:
- `Bash` Hook 호출 빈도 ↓
- `Write/Edit` Hook 호출 빈도 ↑
- 전체적으로 bkit의 파일 검증 로직이 더 일관되게 동작

### 2.5 Non-interactive 모드 (낮은 영향)

**변경사항**: -p 모드에서 structured outputs 수정

| bkit 기능 | 영향도 | 상세 |
|-----------|--------|------|
| CI/CD 통합 | ✅ 긍정적 | 자동화 파이프라인에서 bkit 사용 가능성 향상 |
| 프로그래매틱 호출 | ✅ 긍정적 | 스크립트에서 Claude Code 호출 안정성 |

---

## 3. Gap 분석 결과

### 3.1 호환성 매트릭스

| bkit 컴포넌트 | Claude Code 2.1.21 호환 | Claude Code 2.1.22 호환 | 변경 필요 |
|--------------|------------------------|------------------------|----------|
| `plugin.json` | ✅ 완전 호환 | ✅ 완전 호환 | 없음 |
| `bkit.config.json` | ✅ 완전 호환 | ✅ 완전 호환 | 없음 |
| `hooks.json` | ✅ 완전 호환 | ✅ 완전 호환 | 없음 |
| `session-start.js` | ✅ 완전 호환 | ✅ 완전 호환 | 없음 |
| 11개 에이전트 | ✅ 완전 호환 | ✅ 완전 호환 | 없음 |
| 21개 스킬 | ✅ 완전 호환 | ✅ 완전 호환 | 없음 |
| `lib/common.js` | ✅ 완전 호환 | ✅ 완전 호환 | 없음 |

### 3.2 Breaking Change 영향

**결론**: Breaking Changes 없음 - 완전 하위 호환

### 3.3 권장 조치 사항

| 우선순위 | 조치 | 이유 |
|---------|------|------|
| 📌 필수 | Claude Code 2.1.22로 업그레이드 | 안정성 버그 수정 혜택 |
| 📌 필수 | 기존 기능 회귀 테스트 | Task/Hook 시스템 동작 확인 |
| ⭐ 권장 | CHANGELOG.md 업데이트 | 2.1.22 호환성 명시 |
| ⭐ 권장 | plugin.json 버전 범위 확인 | Claude Code 최소 버전 요구사항 |
| 💡 선택 | Task 시스템 스트레스 테스트 | ID 재사용 버그 수정 검증 |
| 💡 선택 | 긴 세션 재개 테스트 | 세션 재개 안정성 검증 |

---

## 4. 개선 기회

### 4.1 활용 가능한 새 기능

| 기능 | bkit 활용 방안 |
|------|---------------|
| Python venv 자동 활성화 | Dynamic 레벨에서 Python 프로젝트 지원 강화 |
| 파일 도구 우선 사용 | Hook 로직 단순화 (Bash 검증 부담 감소) |
| 개선된 진행 표시기 | UX 일관성 향상 |

### 4.2 잠재적 최적화

1. **Hook 성능 최적화**
   - Bash Hook 호출 감소로 전체 Hook 오버헤드 감소 예상
   - `unified-bash-pre.js` 최적화 검토 가능

2. **Task 시스템 신뢰성**
   - ID 재사용 버그 수정으로 장시간 반복 작업 안정성 향상
   - `pdca-iterator`의 maxIterations 증가 검토 가능

3. **세션 관리 개선**
   - 세션 재개 안정성 향상으로 긴 작업 세션 지원 강화

---

## 5. 테스트 체크리스트

### 5.1 회귀 테스트

- [ ] SessionStart Hook 정상 실행
- [ ] PDCA 상태 파일 초기화 정상
- [ ] 기존 작업 재개 프롬프트 정상 표시
- [ ] TaskCreate/TaskUpdate 정상 동작
- [ ] PreToolUse:Write 정상 실행
- [ ] PreToolUse:Bash 정상 실행
- [ ] PostToolUse:Skill 정상 실행
- [ ] Stop Hook (bkit 기능 보고서) 정상 생성

### 5.2 새 기능 테스트

- [ ] 세션 중단 후 재개 시 안정성
- [ ] 긴 대화 후 auto-compact 적절한 타이밍
- [ ] Task 삭제 후 새 Task 생성 시 ID 정상
- [ ] 파일 작업 시 Read/Edit/Write 도구 사용 확인

---

## 6. 결론

### 6.1 종합 평가

| 항목 | 평가 |
|------|------|
| **호환성** | ✅ 100% 호환 (Breaking Changes 없음) |
| **영향도** | 📗 낮음 ~ 중간 (안정성 개선 중심) |
| **업그레이드 권장** | ✅ 강력 권장 |
| **코드 변경 필요** | ❌ 불필요 |

### 6.2 최종 권장사항

1. **즉시 업그레이드**: Claude Code 2.1.22는 안정성 버그 수정이 포함되어 있어 즉시 업그레이드를 권장합니다.

2. **코드 변경 불필요**: bkit v1.4.6은 2.1.22와 완전 호환되므로 코드 수정이 필요하지 않습니다.

3. **모니터링 권장**: Task 시스템과 Hook 시스템의 동작을 며칠간 모니터링하여 개선 효과를 확인합니다.

4. **버전 명시 고려**: `plugin.json` 또는 문서에 Claude Code 2.1.22+ 호환성을 명시하면 사용자에게 도움이 됩니다.

---

## 7. 참고 자료

### 7.1 공식 소스

- [GitHub Releases - anthropics/claude-code](https://github.com/anthropics/claude-code/releases)
- [CHANGELOG.md](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- [Claude Code Docs](https://code.claude.com/docs)

### 7.2 분석 대상 bkit 파일

- `.claude-plugin/plugin.json`
- `bkit.config.json`
- `hooks/hooks.json`
- `hooks/session-start.js`
- `lib/common.js` (102KB)
- `scripts/unified-stop.js`
- `agents/*.md` (11개)
- `skills/*/SKILL.md` (21개)

---

**Match Rate**: 100% (변경 필요 없음)
**분석 완료**: 2026-01-28
