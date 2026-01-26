# Skills vs Commands 분리 조사 보고서

> **조사 일자**: 2026-01-26
> **조사 대상**: Claude Code Skills/Commands 관계 및 bkit 마이그레이션 가능성
> **조사 방법**: 공식 문서 + GitHub CHANGELOG + bkit 코드베이스 분석

---

## 1. 핵심 질문과 답변

### Q1: Skills에서 `user-invocable: true`면 commands처럼 사용 가능한데, 왜 commands를 분리해야 하나?

**답변: 분리할 필요 없음. Commands는 Skills에 통합됨.**

Claude Code v2.1.3에서 공식적으로 통합되었습니다:

> "Merged slash commands and skills, simplifying the mental model with no change in behavior"

| 구분 | 이전 (v2.1.3 전) | 현재 (v2.1.3+) |
|------|-----------------|----------------|
| 개념 | 별도 시스템 | **단일 통합 시스템** |
| 동작 | 동일 | 동일 |
| 권장 | 혼용 | **Skills 권장** |

### Q2: Claude Code가 commands를 향후 없앨 가능성은?

**답변: 완전 폐지 가능성 낮음. 하위호환성 유지 중.**

공식 문서:
> "Your existing `.claude/commands/` files keep working."

**그러나 장기적으로:**
- 새 기능은 Skills에만 추가됨
- `context: fork`, `agent:`, `hooks:` 등은 Skills 전용
- Commands는 "레거시 호환성" 목적으로만 유지

### Q3: bkit commands를 skills로 변경하면 subagent 활용을 극대화할 수 있나?

**답변: 예, 크게 향상 가능.**

```
현재 (commands):
/pdca-plan → 단순 프롬프트 실행 (main context에서)

전환 후 (skills + agent):
/pdca-plan → pipeline-guide agent에서 격리 실행
           → 전용 도구/권한 세트
           → context: fork로 컨텍스트 분리
```

---

## 2. 공식 문서 분석

### 2.1 Skills와 Commands의 관계

```
┌─────────────────────────────────────────────────────────────┐
│                    Claude Code v2.1.3+                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐      ┌─────────────────┐              │
│  │    Commands     │ ───→ │     Skills      │              │
│  │  (레거시 호환)   │      │  (권장 표준)     │              │
│  └─────────────────┘      └─────────────────┘              │
│                                  │                          │
│                                  ▼                          │
│                    ┌─────────────────────────┐             │
│                    │    추가 기능 지원         │             │
│                    ├─────────────────────────┤             │
│                    │ • context: fork         │             │
│                    │ • agent: 필드           │             │
│                    │ • hooks: 지원           │             │
│                    │ • 지원 파일 (scripts/)  │             │
│                    │ • 자동 hot-reload       │             │
│                    └─────────────────────────┘             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 핵심 차이점

| 기능 | Commands | Skills |
|------|----------|--------|
| 파일 구조 | 단일 `.md` 파일 | 디렉토리 + `SKILL.md` |
| 지원 파일 | ❌ | ✅ (examples/, scripts/) |
| `context: fork` | ❌ | ✅ |
| `agent:` 필드 | ❌ | ✅ |
| `hooks:` 지원 | ❌ | ✅ |
| 자동 hot-reload | ❌ | ✅ (v2.1.0+) |
| 네스트 디렉토리 발견 | ❌ | ✅ |
| `/` 메뉴 표시 | ✅ (기본) | ✅ (`user-invocable: true`) |

### 2.3 통합 타임라인 (CHANGELOG 기반)

| 버전 | 변경 사항 |
|------|----------|
| v2.1.0 | Skills에 `context: fork`, `agent:`, `hooks:` 지원 추가 |
| v2.1.0 | Skills 자동 hot-reload 지원 |
| v2.1.0 | Skills `/` 메뉴 기본 표시 (`user-invocable`) |
| **v2.1.3** | **Skills와 Commands 공식 통합** |
| v2.1.3 | 개념 단순화, 동작 변경 없음 |

---

## 3. bkit commands 현황 분석

### 3.1 현재 commands 목록 (20개)

| 카테고리 | Commands | 관련 Agent |
|----------|----------|-----------|
| **PDCA** | pdca-plan, pdca-design, pdca-analyze, pdca-report, pdca-iterate, pdca-status, pdca-next | gap-detector, pdca-iterator, report-generator |
| **Pipeline** | pipeline-start, pipeline-next, pipeline-status | pipeline-guide |
| **Init** | init-starter, init-dynamic, init-enterprise | starter-guide, bkend-expert, infra-architect |
| **Utility** | archive, github-stats, zero-script-qa | qa-monitor |
| **Setup** | learn-claude-code, setup-claude-code, upgrade-claude-code, upgrade-level | - |

### 3.2 현재 commands 구조 예시

```yaml
# commands/pdca-plan.md (현재)
---
description: Generate Plan phase document
allowed-tools: ["Read", "Write", "Glob"]
---
# Plan Document Generation
...
```

**문제점:**
- `agent:` 필드 없음 → subagent 활용 불가
- `context: fork` 없음 → main context에서 실행
- `hooks:` 없음 → 생명주기 제어 불가

### 3.3 Skills로 전환 시 구조

```yaml
# skills/pdca-plan/SKILL.md (전환 후)
---
name: pdca-plan
description: Generate Plan phase document
agent: pipeline-guide          # ← subagent 활용
context: fork                  # ← 격리 실행
allowed-tools:
  - Read
  - Write
  - Glob
  - TodoWrite
hooks:
  Stop:
    - hooks:
        - type: command
          command: "node ${CLAUDE_PLUGIN_ROOT}/scripts/pdca-plan-stop.js"
---
# Plan Document Generation
...
```

---

## 4. 마이그레이션 분석

### 4.1 마이그레이션 이점

| 측면 | 현재 (commands) | 전환 후 (skills) |
|------|----------------|-----------------|
| **컨텍스트 관리** | main에서 실행 | 격리된 subagent |
| **전문성** | 범용 Claude | 특화된 agent |
| **도구 제어** | 기본 도구 | agent별 최적화 |
| **생명주기** | 없음 | hooks로 제어 |
| **확장성** | 파일 1개 | 디렉토리 + 지원파일 |

### 4.2 Commands → Skills 매핑 권장안

```
┌────────────────────────────────────────────────────────────────┐
│                    마이그레이션 매핑                             │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  pdca-plan     → skills/pdca-plan/     + agent: pipeline-guide │
│  pdca-design   → skills/pdca-design/   + agent: pipeline-guide │
│  pdca-analyze  → skills/pdca-analyze/  + agent: gap-detector   │
│  pdca-report   → skills/pdca-report/   + agent: report-generator│
│  pdca-iterate  → skills/pdca-iterate/  + agent: pdca-iterator  │
│                                                                │
│  pipeline-*    → skills/pipeline-*/    + agent: pipeline-guide │
│                                                                │
│  init-starter  → skills/init-starter/  + agent: starter-guide  │
│  init-dynamic  → skills/init-dynamic/  + agent: bkend-expert   │
│  init-enterprise→skills/init-enterprise/+agent: enterprise-expert│
│                                                                │
│  zero-script-qa→ skills/zero-script-qa/+ agent: qa-monitor     │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 4.3 마이그레이션 복잡도

| 복잡도 | Commands | 전환 난이도 |
|--------|----------|------------|
| 낮음 | pdca-status, pdca-next, pipeline-status | 단순 이동 |
| 중간 | pdca-plan, pdca-design, init-* | agent 연결 필요 |
| 높음 | pdca-analyze, pdca-iterate | context: fork + hooks 설정 필요 |

---

## 5. 권장 사항

### 5.1 단기 (현재 유지)

```
✅ 현재 commands 구조 유지
✅ 하위호환성으로 문제 없음
✅ 급한 마이그레이션 불필요
```

### 5.2 중기 (점진적 전환)

| 우선순위 | 대상 | 이유 |
|---------|------|------|
| 1 | pdca-analyze | gap-detector agent와 연동 시 분석 품질 향상 |
| 2 | pdca-iterate | pdca-iterator agent와 연동 시 자동화 강화 |
| 3 | init-* | 각 level agent와 연동 시 초기화 품질 향상 |

### 5.3 장기 (완전 마이그레이션)

```
목표: 모든 commands → skills 전환
효과:
  • Subagent 활용 극대화
  • 컨텍스트 격리로 안정성 향상
  • Hooks로 생명주기 제어
  • 지원 파일로 복잡한 로직 분리
```

---

## 6. 결론

### 6.1 핵심 발견

1. **Commands는 폐지되지 않음** - 하위호환성 유지
2. **Skills가 권장 표준** - 모든 새 기능은 Skills에만 추가
3. **마이그레이션은 선택적** - 필요에 따라 점진적 전환 가능
4. **Subagent 활용 가능** - `agent:` + `context: fork`로 극대화

### 6.2 bkit 권장 전략

```
┌─────────────────────────────────────────────────────────────┐
│                    bkit 마이그레이션 로드맵                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Phase 1 (v1.5.0): 핵심 PDCA commands 전환                  │
│    • pdca-analyze → skill + gap-detector                   │
│    • pdca-iterate → skill + pdca-iterator                  │
│    • pdca-report  → skill + report-generator               │
│                                                             │
│  Phase 2 (v1.6.0): Init commands 전환                       │
│    • init-starter  → skill + starter-guide                 │
│    • init-dynamic  → skill + bkend-expert                  │
│    • init-enterprise → skill + enterprise-expert           │
│                                                             │
│  Phase 3 (v1.7.0): 나머지 commands 전환                      │
│    • pipeline-* → skill + pipeline-guide                   │
│    • 기타 utility commands                                  │
│                                                             │
│  Phase 4 (v2.0.0): commands 폴더 제거 (breaking change)     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. 참고 자료

### 공식 문서
- [Claude Code Skills Documentation](https://code.claude.com/docs/en/skills)
- [Claude Code CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)

### 관련 릴리스 노트
- [v2.1.3 - Skills와 Commands 통합](https://releasebot.io/updates/anthropic/claude-code)
- [v2.1.0 - Skills context: fork, agent 지원](https://github.com/anthropics/claude-code/releases)

---

*Generated by bkit PDCA Check Phase - Investigation Report*
