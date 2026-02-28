# YAGNI & Feasibility Assessment — bkit v1.5.8

> **Date**: 2026-03-01
> **Reviewer**: yagni-reviewer (bkit v1.5.8 CTO Team, Task #7)
> **Input**: 6개 리서치/브레인스톰 문서 + bkit.config.json + 코드베이스 현황
> **Principle**: YAGNI (You Aren't Gonna Need It) + 실현 가능성 + ROI

---

## 1. Executive Summary

**한 줄 요약**: 6개 문서에서 제안된 기능의 약 **60%가 v1.5.8에 불필요**하며, MVP는 `.bkit/` 디렉토리 통합 + path registry + config extends 3가지로 충분하다.

전체 제안 목록 중:
- **MUST** (v1.5.8 필수): 4개 — .bkit/ 파일 통합, path registry, config extends, .gitignore 변경
- **SHOULD** (v1.5.8 권장): 3개 — mode 시스템, auto-migration, bkit.config.json 버전 업
- **COULD** (v1.6.x 미루기): 8개 — 대부분의 신규 스킬, role 시스템, costProfile, template 7종
- **WONT** (제거): 7개 — session.json, .lock, meta.json, Registry 패턴, 4-layer config merge 전체 구현, org-level config, Plugin-of-Plugin

---

## 2. MUST / SHOULD / COULD / WONT 분류표

### 2.1 .bkit/ 디렉토리 구조 (from: directory-structure-brainstorm, directory-structure-design)

| # | 제안 항목 | 분류 | 근거 |
|---|----------|------|------|
| 1 | `.bkit/pdca-status.json` 이동 | **MUST** | 상태 파일 분산 해소, path 중앙화의 전제 조건. 16+ readers가 `getPdcaStatusPath()` 1곳만 변경하면 자동 적용 |
| 2 | `.bkit/memory.json` 이동 | **MUST** | 3 모듈만 변경. bkit-memory.json과 pdca-status.json은 같이 이동해야 일관성 유지 |
| 3 | `.bkit/snapshots/` 이동 | **MUST** | 1곳 변경. 이미 gitignored. 가장 간단한 이동 |
| 4 | `.bkit/agent-state.json` 유지 | **MUST** | 변경 없음. 이미 올바른 위치 |
| 5 | `.bkit/.gitignore` 생성 | **MUST** | blanket `.bkit/` ignore에서 선택적 ignore로 전환 필수 |
| 6 | `lib/core/paths.js` 생성 | **MUST** | 11+ hardcoded 경로를 1곳에 중앙화. 향후 모든 경로 변경의 기반 |
| 7 | auto-migration 로직 (SessionStart) | **SHOULD** | 기존 설치 환경 호환. 없으면 수동 파일 이동 필요 |
| 8 | `.bkit/session.json` (NEW) | **WONT** | **YAGNI**. 현재 `_sessionContext`(in-memory) + `lastSession`(memory.json) + `session`(pdca-status.json)으로 이미 3곳에 세션 정보 존재. 중복 |
| 9 | `.bkit/.lock` (NEW) | **WONT** | **YAGNI**. Studio IPC는 아직 개발 중. advisory lock이 필요해지면 그때 추가. 현재 agent-state.json의 atomic write(tmp+rename)로 충분 |
| 10 | `.bkit/meta.json` (NEW) | **WONT** | **YAGNI**. 각 파일에 `version` 필드가 이미 존재. 디렉토리 수준 메타 불필요 |
| 11 | `hook-log.json` (NEW) | **WONT** | **YAGNI**. `debugLog()`로 충분. 문서 자체도 "보류(YAGNI)" 판정 |
| 12 | Option D (Hybrid Flat) 채택 | **MUST** | 가중 합계 8.80 최고점. YAGNI 준수. 구현 최저 비용 |
| 13 | Option B (Category-Based) | **WONT** | 현재 5~6개 파일에 state/runtime/cache 3단계 디렉토리는 과도 |
| 14 | Option C (Domain-Based) | **WONT** | 도메인 2개(PDCA, Team)에 디렉토리 2개는 과도 |

### 2.2 커스터마이제이션 추상화 계층 (from: customization-abstraction-brainstorm)

| # | 제안 항목 | 분류 | 근거 |
|---|----------|------|------|
| 15 | 패턴 E (Hybrid Layered) 채택 | **COULD** | 좋은 아키텍처지만 전체 구현은 9일. v1.5.8에는 config extends만 필요 |
| 16 | `extends` 필드 (bkit.config.json) | **SHOULD** | 단순 deep merge 1개 함수. 조직 config 로드 기반 |
| 17 | 4-Layer Config Merge 전체 구현 | **WONT** | Layer 0~3 전체 구현은 과도. **현재 bkit 사용자 중 org-level config를 쓰는 사용자가 0명**. 수요 없는 기능 |
| 18 | `~/.bkit/org.config.json` (조직 설정) | **WONT** | 위와 동일. 실제 수요 없음. CC의 managed settings가 이 역할 수행 |
| 19 | `.bkit/local.config.json` (개인 설정) | **COULD** | CC의 `.claude/settings.local.json`이 동일 역할. 이중 관리 리스크 |
| 20 | `customization.skills.disable` 필드 | **COULD** | CC가 스킬 disable을 지원하지 않아 bkit 자체 구현 필요. SessionStart context injection으로 soft hide만 가능 — 확실한 비활성화 불가 |
| 21 | `customization.agents.overrides` 필드 | **COULD** | .claude/agents/에 복사+수정 필요. 에이전트 동기화 로직 복잡 |
| 22 | 패턴 B (Registry) | **WONT** | 구현 7-10일, CC 업데이트마다 동기화 부담. 이중 관리 |
| 23 | 패턴 C (Plugin-of-Plugin) | **WONT** | CC plugin 시스템이 extension override 미지원. `bkit-extension.json` 자체 파싱 오버헤드 |
| 24 | 패턴 D (Template) 보조 | **COULD** | /bkit-init과 결합하면 유용하나 v1.5.8에 필수는 아님 |

### 2.3 DX & 비개발자 접근성 (from: dx-accessibility-brainstorm)

| # | 제안 항목 | 분류 | 근거 |
|---|----------|------|------|
| 25 | `customization.mode` (guide/expert/auto) | **SHOULD** | bkit.config.json에 1개 필드 추가 + SessionStart 분기. 비용 낮고 UX 개선 효과 큼 |
| 26 | `customization.role` (pm/designer/qa/lead) | **COULD** | 역할별 스킬 필터링 로직 필요. **현재 비개발자 사용자가 거의 없음**. 수요 발생 시 추가 |
| 27 | `/bkit-config` 스킬 (NEW) | **COULD** | bkit.config.json을 직접 편집하면 되는 일. CLI 스킬까지 만들 필요성 낮음 |
| 28 | `/bkit-init` 스킬 (NEW) | **COULD** | 템플릿 7종 + scaffolding은 v1.6.x 범위. 현재 bkit은 plugin으로 설치하면 바로 사용 가능 |
| 29 | `/bkit-help` 스킬 (NEW) | **COULD** | CC의 `/help`와 기존 starter 스킬이 유사 역할 수행 |
| 30 | `/bkit-new-skill` 스킬 (NEW) | **COULD** | CC 네이티브 스킬 생성이 이미 간단 (SKILL.md 1개 파일 생성). 별도 도구 불필요 |
| 31 | `/bkit-new-agent` 스킬 (NEW) | **COULD** | 위와 동일. .claude/agents/ 에 .md 파일 1개 생성이 전부 |
| 32 | `costProfile` 프리셋 (quality/balanced/economy) | **COULD** | 좋은 아이디어지만 에이전트 모델 변경은 frontmatter 직접 수정으로 가능. 추상화 계층까지 필요한 수요 미검증 |
| 33 | 역할별 자연어 패턴 확장 | **COULD** | 기존 intent classification 엔진으로 충분. PM/디자이너 사용자 없는 상태에서 선제 구현은 YAGNI |
| 34 | Template 라이브러리 7종 | **WONT** | solo/startup/fullstack/enterprise/pm-team/design-team/qa-team — 7종은 과도. 검증된 수요 없음 |
| 35 | Config schema validation | **COULD** | JSON Schema 작성 + 검증 로직. 현재 config 오류로 인한 버그 보고 0건 |
| 36 | 커스터마이징 가이드 7문서 + 역할별 4문서 | **WONT** | v1.5.8에 21개 문서 작성은 과도. 기능이 확정된 후 작성 |
| 37 | 가이드 모드 상세 UX (단계별 안내) | **COULD** | SessionStart 안내문 분기만으로 MVP 달성 가능. 상세 UX는 v1.6.x |
| 38 | 에이전트 메모리 활성화 (5개 에이전트) | **COULD** | CC agent memory scope 추가는 frontmatter 1줄. 하지만 메모리 축적 효과 검증 필요 |

### 2.4 리서치 문서 자체 (from: cc-deep-dive, anthropic-future-direction, codebase-analysis)

| # | 제안 항목 | 분류 | 근거 |
|---|----------|------|------|
| 39 | CC 8대 Surface 분석 | **정보** | 훌륭한 레퍼런스. 구현 항목 아님 |
| 40 | Anthropic 방향 분석 | **정보** | 전략적 인사이트. "CC 위에 얹기" 원칙 검증 |
| 41 | Codebase 상태 분석 | **정보** | path registry 설계의 근거 데이터 |
| 42 | Rules 시스템 도입 (.claude/rules/) | **COULD** | PDCA 단계별 rules 파일은 흥미롭지만 현재 CLAUDE.md로 충분 |

---

## 3. 삭제 권고 목록

### 3.1 즉시 삭제 (v1.5.8 범위에서 제외)

| # | 항목 | 삭제 이유 |
|---|------|----------|
| 8 | `.bkit/session.json` | 3곳에 이미 세션 정보 존재. 중복 상태 파일 |
| 9 | `.bkit/.lock` | Studio IPC 미개발. 현재 atomic write로 충분 |
| 10 | `.bkit/meta.json` | 각 파일에 version 필드 존재. 메타 파일 불필요 |
| 11 | `hook-log.json` | debugLog()로 충분. 문서 저자도 YAGNI 판정 |
| 17 | 4-Layer Config Merge 전체 | org-level 사용자 0명. 수요 없는 기능 |
| 18 | `~/.bkit/org.config.json` | CC managed settings가 동일 역할. 이중 관리 |
| 22 | Registry 패턴 | 7-10일 구현, CC 업데이트마다 동기화 부담 |
| 23 | Plugin-of-Plugin 패턴 | CC가 extension override 미지원 |
| 34 | Template 7종 | 검증된 수요 없음. 1-2종이면 충분 |
| 36 | 가이드 문서 21개 | 기능 확정 전 문서 작성은 낭비 |

### 3.2 간소화 권고

| 항목 | 원래 제안 | 간소화 안 |
|------|----------|----------|
| 커스터마이제이션 패턴 | 5개 패턴 비교 → Hybrid Layered 전체 구현 (9일) | `extends` 필드 1개만 추가 (1일) |
| DX 신규 스킬 | 5개 (/bkit-config, /bkit-init, /bkit-help, /bkit-new-skill, /bkit-new-agent) | 0개. 기존 스킬로 충분 |
| Template 시스템 | 7종 사전 정의 + 사용자 정의 내보내기 | v1.6.x에서 1-2종으로 시작 |
| 모드 시스템 | guide/expert/auto + role(5종) + costProfile(3종) | mode 필드 1개만 (guide/expert) |
| 에이전트 override | config → .claude/agents/ 자동 동기화 | 사용자가 직접 .claude/agents/ 수정 |

---

## 4. v1.5.8 MVP 스코프 재정의

### 4.1 진짜 필요한 최소 범위

```
v1.5.8 MVP (예상 3-4일)
========================

1. lib/core/paths.js 생성 (Path Registry)
   - STATE_PATHS, LEGACY_PATHS, CONFIG_PATHS 정의
   - ensureBkitDir(), migrateStatFiles() 함수
   - 변경: 1개 새 파일

2. 상태 파일 .bkit/ 이동
   - docs/.pdca-status.json → .bkit/pdca-status.json
   - docs/.bkit-memory.json → .bkit/memory.json
   - docs/.pdca-snapshots/ → .bkit/snapshots/
   - 변경: 6개 파일 (path 참조 업데이트)

3. .gitignore 변경
   - root .gitignore에서 .bkit/ blanket ignore 제거
   - .bkit/.gitignore 생성 (agent-state.json, snapshots/ 만 ignore)
   - 변경: 2개 파일

4. bkit.config.json 업데이트
   - version: "1.5.8"
   - pdca.statusFile: ".bkit/pdca-status.json"
   - 변경: 1개 파일

5. SessionStart auto-migration
   - 구 경로 → 신 경로 자동 이동
   - 변경: hooks/session-start.js 1개

6. common.js bridge 업데이트
   - paths 모듈 re-export
   - 변경: 1개 파일
```

### 4.2 선택적 추가 (여유 있을 때)

```
Optional (추가 1-2일)
=====================

7. customization.mode 필드 (guide/expert)
   - bkit.config.json에 customization.mode 추가
   - SessionStart 안내문 분기 (guide: 상세, expert: 간결)
   - 변경: 2-3개 파일

8. bkit.config.json extends 필드
   - extends 경로의 config를 base로 deep merge
   - lib/core/config.js loadConfig() 확장
   - 변경: 1-2개 파일
```

### 4.3 v1.5.8에서 명시적으로 제외

```
NOT in v1.5.8
=============

- 신규 스킬 0개 (bkit-config, bkit-init, bkit-help, bkit-new-skill, bkit-new-agent 전부 제외)
- session.json, .lock, meta.json, hook-log.json (신규 상태 파일 0개)
- 4-Layer config merge (org/local config 불필요)
- role 시스템, costProfile 프리셋
- Template 라이브러리 (7종 전부)
- 에이전트 override 자동 동기화
- Config schema validation
- 커스터마이징 가이드 문서 (21개)
- Rules 시스템 도입
```

---

## 5. 리스크 항목

### 5.1 기술적 제약

| 리스크 | 심각도 | 영향 | 대응 |
|--------|--------|------|------|
| `docs/.pdca-status.json` git history 변경 | MEDIUM | 파일 이동 시 git blame 깨짐 | `git mv` 사용, PR에 명시 |
| `hooks/session-start.js:334` — `process.cwd()` 사용 | HIGH | PROJECT_DIR과 다를 수 있음 (이미 존재하는 버그) | paths.js로 통합 시 함께 수정 |
| 외부 스크립트가 `docs/.pdca-status.json` 참조 | LOW | 알려진 외부 의존 없음 | auto-migration fallback으로 커버 |
| `.bkit/` gitignore 전환 시 기존 clone 영향 | LOW | git pull 후 새 .gitignore 적용 | CHANGELOG에 명시 |

### 5.2 CC 이슈 영향

| 이슈 | 심각도 | bkit v1.5.8 영향 | 대응 |
|------|--------|-----------------|------|
| #29548 ExitPlanMode regression | HIGH | plan mode 에이전트 7개 영향 | CC 패치 대기. v1.5.8 코드 변경과 무관 |
| #29547 AskUserQuestion empty | HIGH | plugin skills 대화형 기능 제한 | allowed-tools에서 AskUserQuestion 제거 workaround. v1.5.8 변경과 무관 |
| #17688 Plugin hooks 미지원 | MEDIUM | bkit hooks 작동 여부 | 기존에도 project hooks.json으로 우회. v1.5.8 변경과 무관 |
| #25131 Agent Teams lifecycle | LOW | CTO Team 장시간 세션 | 실험적 기능, 기존 workaround 유지 |

### 5.3 CC 네이티브 기능 중복 위험

| bkit 제안 | CC 네이티브 대응 | 중복도 | 판정 |
|-----------|----------------|--------|------|
| org-level config (`~/.bkit/org.config.json`) | CC managed settings (JSON/plist/Registry) | **높음** | **WONT** — CC가 이미 제공 |
| local config (`.bkit/local.config.json`) | CC `.claude/settings.local.json` | **높음** | **WONT** — CC가 이미 제공 |
| 스킬 disable | CC는 미지원, 하지만 `disable-model-invocation: true` + `user-invocable: false`로 유사 효과 | **중간** | **COULD** — soft hide만 가능 |
| 에이전트 모델 override | CC `.claude/agents/` project-level override | **높음** | **WONT** — CC 네이티브 메커니즘 사용 안내 |
| `/bkit-help` | CC 네이티브 `/help` + starter 스킬 | **높음** | **WONT** — 중복 |
| `/bkit-new-skill` | SKILL.md 파일 1개 생성 (수동) | **높음** | **WONT** — 너무 간단한 작업에 스킬 불필요 |

---

## 6. 최종 권고사항

### 6.1 핵심 원칙

1. **파일 이동은 하되, 새 파일은 만들지 말라** — `.bkit/` 통합은 가치 있지만, session.json/.lock/meta.json 같은 신규 파일은 YAGNI
2. **CC 위에 얹되, CC를 감싸지 말라** — org config, 스킬 disable, 에이전트 override는 CC 네이티브 메커니즘 활용 안내로 충분
3. **수요 없는 기능을 만들지 말라** — org-level 사용자 0명, 비개발자 사용자 미검증, Template 수요 미확인
4. **코드 변경 최소화** — paths.js 1개 새 파일 + 6개 파일 path 업데이트 = 총 7개 파일 변경이 이상적

### 6.2 실행 권고

```
즉시 실행 (v1.5.8):
  [1] lib/core/paths.js 생성 (path registry)
  [2] 상태 파일 3개 .bkit/ 이동 + auto-migration
  [3] .gitignore 변경 (blanket → selective)
  [4] bkit.config.json version bump + statusFile 업데이트

선택 실행 (v1.5.8, 여유 시):
  [5] customization.mode 필드 (guide/expert)
  [6] bkit.config.json extends 필드

v1.6.x 이후:
  [7] /bkit-config 스킬 (수요 확인 후)
  [8] /bkit-init + Template 1-2종 (수요 확인 후)
  [9] role 시스템 (비개발자 사용자 확보 후)
  [10] costProfile (에이전트 비용 최적화 수요 확인 후)

영구 보류:
  - 4-Layer config merge 전체 구현
  - Registry 패턴
  - Plugin-of-Plugin 패턴
  - session.json, .lock, meta.json
  - Template 7종, 가이드 문서 21개
```

### 6.3 변경 영향 요약

| 지표 | 값 |
|------|-----|
| v1.5.8 필수 코드 변경 파일 수 | **~10개** (paths.js 1 신규 + 6 path 업데이트 + 2 gitignore + 1 config) |
| 삭제한 제안 수 | **7개** (전체 42개 중) |
| v1.6.x로 미룬 제안 수 | **8개** |
| 예상 구현 기간 | **3-4일** (원래 전체 구현 22일 대비 82% 절감) |
| 신규 스킬 수 | **0개** (원래 5개 제안에서) |
| 신규 상태 파일 수 | **0개** (원래 4개 제안에서) |

---

## Sources

- `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/docs/01-plan/research/cc-context-engineering-deep-dive.md`
- `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/docs/01-plan/research/anthropic-future-direction.md`
- `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/docs/01-plan/research/bkit-codebase-state-analysis.md`
- `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/docs/01-plan/research/bkit-directory-structure-brainstorm.md`
- `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/docs/01-plan/research/bkit-directory-structure-design.md`
- `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/docs/01-plan/research/customization-abstraction-brainstorm.md`
- `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/docs/01-plan/research/dx-accessibility-brainstorm.md`
- `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/bkit.config.json`
