# bkit v2.0.8 — CC v2.1.86 대응 개선 계획

> **Status**: ✅ Complete
>
> **Project**: bkit Vibecoding Kit
> **Target Version**: v2.0.8
> **Author**: Plan Plus Workflow
> **Created**: 2026-03-28
> **PDCA Cycle**: #26
> **Branch**: feat/bkit-v208-cc-v2186-improvements

---

## Executive Summary

### 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **기능** | bkit v2.0.8 — CC v2.1.85~v2.1.86 대응 개선 |
| **시작일** | 2026-03-28 |
| **타깃 버전** | v2.0.8 |
| **CC 호환** | v2.1.34~v2.1.86 (52개 연속 호환) |
| **근거 보고서** | docs/04-report/features/cc-v2185-v2186-impact-analysis.report.md |

### 성과 목표

```
┌──────────────────────────────────────────────────────┐
│  bkit v2.0.8 개선 목표                                  │
├──────────────────────────────────────────────────────┤
│  📋 구현 항목:              5건 (ENH-160~164)          │
│  📝 변경 파일:              ~38개                      │
│  🔧 핵심 작업:                                         │
│     1. 34 skills description 250자 최적화 (ENH-162)    │
│     2. Hook `if` 필드 문서화 (ENH-160)                  │
│     3. 버전업 (v2.0.6 → v2.0.8)                        │
│     4. CC 권장 버전 v2.1.86+ 업데이트                    │
│     5. ENH-163/164 문서화 (자동 수혜/모니터링)           │
│  🎯 Match Rate 목표:        100%                       │
└──────────────────────────────────────────────────────┘
```

### 전달될 가치

| 관점 | 내용 |
|------|------|
| **문제** | CC v2.1.86에서 /skills description 250자 cap 도입 → bkit 34/36 skills 잘림. Hook `if` 필드 미문서화 |
| **해결 방법** | 34 skills description 250자 이내 최적화 + Hook `if` 필드 가이드 문서화 + 버전업 |
| **기능/UX 효과** | /skills 목록에서 모든 bkit skill의 핵심 정보가 완전히 표시됨. 향후 hook 설계에 `if` 활용 기반 |
| **핵심 가치** | CC v2.1.86 완전 대응 + skill 발견성(discoverability) 대폭 개선 + 52개 연속 호환 유지 |

---

## Plan Plus 브레인스토밍

### Phase 0: 의도 탐색 (Intent Discovery)

**핵심 질문과 답변**:

1. **이 업그레이드에서 bkit이 얻을 수 있는 최대 가치는?**
   → /skills 목록에서 34개 skill의 핵심 정보가 250자 cap으로 잘리는 문제 해결.
   사용자가 skill을 찾고 선택하는 경험(discoverability)이 핵심 가치.

2. **놓치면 안 되는 critical change는?**
   → ENH-162 (skills description 250자 cap). 이미 v2.1.86이 설치되어 있으므로
   사용자가 /skills를 실행하면 바로 잘린 description을 보게 됨.

3. **기존 workaround를 대체할 수 있는 native 기능은?**
   → Hook `if` 필드 (ENH-160). 기존에는 모든 Bash 명령에 hook script가 spawn되었으나,
   `if` 필드로 특정 패턴만 필터링 가능. 단, 현재 bkit 아키텍처에서는 적용 불필요.

### Phase 1: 대안 탐색 (Alternative Exploration)

**ENH-162 구현 방법 비교**:

| 방법 | 설명 | 장점 | 단점 |
|------|------|------|------|
| **A: 핵심 1줄 요약 + Triggers** | 첫 줄에 skill 핵심 1줄, 나머지 Triggers 리스트 | 250자 내 핵심 전달 | Trigger 키워드 일부 잘림 |
| **B: 2줄 요약 + 축약 Triggers** | 2줄로 설명 + Trigger 키워드 축약 | 더 풍부한 설명 | 여전히 250자 초과 가능 |
| **C: 핵심 1줄만** ✅ | 1줄 핵심 + Use/Do NOT 제거, 별도 섹션 활용 | 확실히 250자 이내 | Trigger 키워드 손실 |

**선택: 방법 A (핵심 1줄 요약 + Triggers)**
- description 필드: 핵심 목적 1줄 (영문) + 주요 Triggers 1~2줄
- 상세 Use/Do NOT은 SKILL.md 본문에 유지 (description 외부)
- 250자 이내를 확실히 보장

### Phase 2: YAGNI 검토

| ENH | 구현? | YAGNI 판정 | 이유 |
|-----|------|-----------|------|
| ENH-160 | ✅ 구현 | P2 문서화 | Hook `if` 필드 가이드 → 향후 설계에 실제 도움 |
| ENH-161 | ❌ 스킵 | P3 대기 | ENH-138 선행 필요. 단독 가치 없음 |
| ENH-162 | ✅ 구현 | **P1 필수** | 34/36 skills 잘림. 즉시 수정 필요 |
| ENH-163 | ❌ 스킵 | 자동 수혜 | 코드 변경 불필요 |
| ENH-164 | ✅ 문서화 | P3 간단 추가 | context-engineering.md에 1줄 추가 |

### Phase 3: 우선순위 및 구현 순서

```
Step 1: ENH-162 — 34 skills description 250자 최적화
        (핵심 작업, ~34 files)

Step 2: ENH-160 — Hook `if` 필드 문서화
        (context-engineering.md 수정, 1 file)

Step 3: ENH-164 — Org policy 주의사항 추가
        (context-engineering.md에 함께 추가, 0 추가 files)

Step 4: 버전업
        - bkit.config.json: 2.0.6 → 2.0.8
        - .claude-plugin/plugin.json: 2.0.6 → 2.0.8
        - hooks/hooks.json: description 버전 업데이트
        - CC recommended version: v2.1.86+
```

---

## 구현 범위 상세

### 1. ENH-162: Skills Description 250자 최적화 (P1)

**대상**: 34 skills (btw, deploy 제외)

**description 작성 규칙**:
1. 첫 줄: skill 핵심 목적 1문장 (영문, ~80자)
2. 둘째 줄: 주요 Trigger keywords (축약)
3. 총 250자 이내 엄수
4. "Use proactively", "Do NOT use for" 문구는 description에서 제거 → SKILL.md 본문 유지
5. 8개국어 Trigger keywords는 description에서 제거 → SKILL.md 본문 유지

**변경 패턴**:
```yaml
# Before (715자):
description: |
  Unified skill for managing the entire PDCA cycle.
  Auto-triggered by keywords: "plan", "design", "analyze", "report", "status".
  Replaces legacy /pdca-* commands.

  Use proactively when user mentions PDCA cycle...

  Triggers: pdca, 계획, 설계, 분석, ...

  Do NOT use for: simple queries without PDCA context...

# After (≤250자):
description: |
  Unified PDCA cycle management — plan, design, do, analyze, iterate, report.
  Triggers: pdca, plan, design, analyze, report, status, next, iterate.
```

### 2. ENH-160: Hook `if` 필드 문서화 (P2)

**파일**: `bkit-system/philosophy/context-engineering.md`

**추가 내용**:
- Hook `if` 필드 설명 (CC v2.1.85+)
- permission rule syntax 예제 (`Bash(git *)`, `Edit(*.ts)`)
- bkit hooks에서의 적용 가능성 분석
- 현재 미적용 이유 (unified-bash-pre.js 내부 검사)

### 3. ENH-164: Org Policy 주의사항 (P3)

**파일**: `bkit-system/philosophy/context-engineering.md` (ENH-160과 동일 파일)

**추가 내용**:
- `managed-settings.json` org policy로 plugin 차단 가능성 언급
- Enterprise 환경 설치 시 주의사항

### 4. 버전업

| 파일 | 변경 |
|------|------|
| `bkit.config.json` | version: "2.0.6" → "2.0.8" |
| `.claude-plugin/plugin.json` | version: "2.0.6" → "2.0.8" |
| `hooks/hooks.json` | description: "bkit Vibecoding Kit v2.0.6" → "v2.0.8" |

---

## 파일 변경 매트릭스

| # | 파일 | 변경 유형 | ENH | 추정 LOC |
|---|------|----------|-----|---------|
| 1 | skills/pdca/SKILL.md | MODIFY (desc) | ENH-162 | ~-15 |
| 2 | skills/starter/SKILL.md | MODIFY (desc) | ENH-162 | ~-15 |
| 3 | skills/enterprise/SKILL.md | MODIFY (desc) | ENH-162 | ~-15 |
| 4 | skills/dynamic/SKILL.md | MODIFY (desc) | ENH-162 | ~-15 |
| 5-34 | skills/*/SKILL.md (30 more) | MODIFY (desc) | ENH-162 | ~-15 each |
| 35 | bkit-system/philosophy/context-engineering.md | MODIFY | ENH-160,164 | +40 |
| 36 | bkit.config.json | MODIFY (version) | — | 1 |
| 37 | .claude-plugin/plugin.json | MODIFY (version) | — | 1 |
| 38 | hooks/hooks.json | MODIFY (version) | — | 1 |

**총**: ~38 files, 순 LOC 변경: ~-460 (description 축소) + ~43 (문서/버전) = ~-417

---

## 리스크 및 완화

| 리스크 | 영향 | 완화 |
|--------|------|------|
| Description 축소로 Trigger 정보 손실 | skill 자동 감지 정확도 저하 가능 | Trigger keywords는 SKILL.md 본문에 유지. CC는 description 외 본문도 참조 |
| 250자 이내 작성이 어려운 skill | 핵심 정보 누락 | 1줄 목적 + 주요 키워드만 유지하는 엄격한 규칙 적용 |
| CC가 description만 인덱싱하면 8개국어 Trigger 미작동 | i18n 자동 감지 실패 | CC는 전체 SKILL.md를 로드함. description은 /skills 목록 표시용 |

---

## 성공 기준

- [ ] 36/36 skills description이 250자 이내
- [ ] /skills 목록에서 모든 skill의 핵심 목적이 읽힘
- [ ] context-engineering.md에 Hook `if` 필드 가이드 추가
- [ ] 버전 v2.0.8로 일괄 업데이트
- [ ] Gap Analysis Match Rate ≥ 100%
