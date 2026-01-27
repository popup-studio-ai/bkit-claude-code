# pdca-archive-action Planning Document

> **Summary**: /pdca skill에 archive action 추가 - PDCA 사이클 완료 후 문서 아카이브 기능
>
> **Project**: bkit-claude-code
> **Version**: v1.4.5
> **Author**: Claude (PDCA Plan)
> **Date**: 2026-01-27
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

PDCA 사이클 완료 후 문서를 `docs/archive/YYYY-MM/{feature}/` 폴더로 이동하여 정리하는 기능을 `/pdca` skill의 action으로 추가합니다.

### 1.2 Background

- v1.4.4에서 commands를 skills로 마이그레이션하면서 `commands/archive.md`가 삭제됨
- 해당 기능이 `/pdca` skill의 action으로 이전되지 않음
- PDCA 사이클: Plan → Design → Do → Check → Act → **Report → Archive**
- Archive 단계가 누락되어 완료된 문서 정리 수동 작업 필요

### 1.3 Related Documents

- 삭제된 Command: `commands/archive.md` (commit 2df9b6c)
- 현재 Skill: `skills/pdca/SKILL.md`
- PDCA Status: `docs/.pdca-status.json`

---

## 2. Scope

### 2.1 In Scope

- [x] `/pdca archive {feature}` action 추가
- [x] SKILL.md 문서 업데이트
- [x] Task Flow 다이어그램 업데이트
- [x] .pdca-status.json phase = "archived" 업데이트 로직
- [x] commands/functions.md 업데이트

### 2.2 Out of Scope

- 별도 agent 생성 (archive는 단순 파일 이동이므로 불필요)
- Archive 롤백 기능 (restore)
- Archive 검색 기능

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | `/pdca archive {feature}` 명령어 지원 | High | Pending |
| FR-02 | Report 완료 상태(phase=completed 또는 matchRate>=90%) 확인 | High | Pending |
| FR-03 | PDCA 문서 존재 확인 (plan, design, analysis, report) | High | Pending |
| FR-04 | `docs/archive/YYYY-MM/{feature}/` 폴더 생성 | High | Pending |
| FR-05 | 문서 이동 (원본 삭제) | High | Pending |
| FR-06 | .pdca-status.json 업데이트 (phase=archived, archivedTo) | High | Pending |
| FR-07 | Archive Index 업데이트 (`_INDEX.md`) | Medium | Pending |
| FR-08 | allowed-tools에 Bash 추가 | High | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Reliability | 문서 이동 실패 시 원본 보존 | 수동 테스트 |
| Usability | 명확한 성공/실패 메시지 | 사용자 피드백 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [x] `/pdca archive {feature}` 실행 시 문서 이동 완료
- [x] .pdca-status.json에 archived 상태 기록
- [x] SKILL.md 문서에 archive action 설명 추가
- [x] functions.md 업데이트

### 4.2 Quality Criteria

- [x] 기존 action들과 일관된 동작
- [x] 에러 처리 (문서 없음, 권한 없음 등)

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 파일 이동 중 오류 | High | Low | 이동 전 복사 후 원본 삭제 순서로 진행 |
| 잘못된 feature명 입력 | Medium | Medium | 존재하는 문서 확인 후 진행 |
| Archive 폴더 권한 문제 | Low | Low | 폴더 생성 실패 시 명확한 에러 메시지 |

---

## 6. Architecture Considerations

### 6.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure | - | ☐ |
| **Dynamic** | Feature-based modules | bkit-claude-code 플러그인 | ☑ |
| **Enterprise** | Strict layer separation | - | ☐ |

### 6.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Agent 사용 | Agent / Skill 직접 처리 | Skill 직접 | 단순 파일 이동이므로 Agent 불필요 |
| 파일 이동 방식 | Bash mv / Node fs | Bash mv | 플러그인에서 Bash 사용 가능 |
| 상태 업데이트 | JSON 직접 수정 / Hook 사용 | JSON 직접 | 기존 패턴과 일관성 |

### 6.3 PDCA Flow Update

```
현재 Flow:
[Plan] → [Design] → [Do] → [Check] → [Act] → [Report] → (수동 archive)

개선 Flow:
[Plan] → [Design] → [Do] → [Check] → [Act] → [Report] → [Archive]
                                                            ↓
                                                    docs/archive/YYYY-MM/{feature}/
```

---

## 7. Implementation Details

### 7.1 SKILL.md 수정 사항

**1. Arguments 테이블 추가**:
```markdown
| `archive [feature]` | 완료된 PDCA 문서 아카이브 | `/pdca archive user-auth` |
```

**2. 새로운 Action 섹션**:
```markdown
### archive (아카이브 단계)

1. Report 완료 상태 확인 (phase = "completed" 또는 matchRate >= 90%)
2. PDCA 문서 존재 확인 (plan, design, analysis, report)
3. `docs/archive/YYYY-MM/{feature}/` 폴더 생성
4. 문서 이동 (원본 위치에서 삭제)
5. Archive Index 업데이트 (`docs/archive/YYYY-MM/_INDEX.md`)
6. .pdca-status.json 업데이트: phase = "archived", archivedTo 경로 기록

**출력 경로**: `docs/archive/YYYY-MM/{feature}/`
```

**3. Frontmatter 수정**:
```yaml
allowed-tools:
  - Bash  # 추가
```

**4. 단계별 가이드 테이블**:
```markdown
| report | archive | `/pdca archive [feature]` |
```

**5. 자동 트리거 키워드**:
```markdown
| "아카이브", "archive", "정리", "보관" | archive |
```

### 7.2 commands 파일 수정

**functions.md**:
```markdown
/pdca archive <feature>    Archive completed PDCA documents
```

---

## 8. Next Steps

1. [x] Design 문서 작성 (`pdca-archive-action.design.md`)
2. [ ] SKILL.md 수정
3. [ ] menu.md, functions.md 수정
4. [ ] 테스트 실행
5. [ ] Gap 분석

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-01-27 | Initial draft | Claude |
