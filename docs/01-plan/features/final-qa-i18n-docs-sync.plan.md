# S5 — Final QA + i18n + Docs-Sync (LAST) 계획서 (PRD + Plan)

> **Sprint**: `final-qa-i18n-docs-sync` (마스터 플랜 S5, LAST) · **Branch**: `release/v2.1.22-hardening`
> **Trust**: L4 · **Scope**: P0 (릴리스 게이트) · **ENH**: ENH-355 ~ ENH-360
> **dependsOn**: S1·S2·S6·S3b·S4 (전부 archived) · **estTokens**: ~67K
> **Date**: 2026-06-02 · **Author**: kay kim
> **입력 근거**: 마스터 플랜 §10 S5 + §11 release gate + 본 세션 ground-truth 측정(docs-code-sync.js 실행 + fresh inventory)

---

## 1. Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | v2.1.22 cut 전 마지막 게이트: 전체 QA + 8-lang trigger 완비 + code=docs sync(docs/ 제외) + version bump. S1~S3b 코드 변경(특히 S3a god-file 분할: module 188→190, scripts→65, subdir 22) 반영. |
| **WHO** | 전체 bkit 사용자, 외부 dogfooder(문서 수치 신뢰), 컨트리뷰터. |
| **WHAT** | ENH-355 전체 QA / ENH-356 8-lang audit / ENH-357 doc drift 수정 / ENH-358 docs-code-sync 확장 / ENH-359 version bump / ENH-360 release gate. |
| **WHAT NOT** | docs/ 내부 한국어 문서 영어화 · **release-history immutable 스냅샷 변경**(at-the-time count 보존) · 신규 기능 · 8-lang 외 신규 언어. |
| **RISK** | (a) release-history 스냅샷을 current-state로 오인해 immutable 훼손 → 각 수치의 위치(current vs history) 분류 필수. (b) "226 assertions" 등 baseline-dependent 수치 추측 변경. (c) version bump 누락 site. |
| **SUCCESS** | §11 release gate 전부 충족: 7/7 archived · 0 current-state doc drift · QA L1-L5+S1 100 · 8-lang 완비 · simplicity invariant(S3a/b 확인) · 전 gate green · version 2.1.22 + CHANGELOG. |
| **SCOPE** | ENH-355~360. gate S1(=100)/M3(=0)/M10/docs-sync(=0 drift). |

---

## 2. Ground Truth (2026-06-02 측정 — 추측 아님)

### 2.1 실측 inventory (docs-code-sync.js measure + fresh count)
| metric | 실측값 | 비고 |
|--------|--------|------|
| skills | **44** | countSkills (SKILL.md) |
| agents (active) | **34** | countAgents (deprecated tombstone 6 제외) |
| agents (total .md) | **40** | 34 active + 6 deprecated(pdca-eval) |
| hook events | **21** | hooks.json keys |
| hook blocks | **24** | matcher-separated entries |
| MCP servers / tools | **2 / 19** | servers/ |
| lib modules | **190** | S3a +2 (automation-questions, state-transitions) |
| lib subdirs | **22** | |
| scripts | **61** | scripts/*.js top-level (scripts/lib/ 4 별도) |
| templates | **40** | templates/*.md |
| lib/domain modules | **18** | |
| consecutive compatible | **112** | S1 ENH-325 carry |
| CC 권고 | balanced **v2.1.159** / conservative **v2.1.150** | S1 ENH-325 carry |
| bkit version | 2.1.21 → **2.1.22** | bump 대상 |

### 2.2 도구 상태 (docs-code-sync.js 실행 결과)
- **invariant drift 0** (EXPECTED_COUNTS = measured; agents:34 active 정답 — master plan "agents:34 하드코딩 drift"는 오진단).
- scanner.measure()가 **이미 libModules(190)+scripts(61) 측정**(master plan "미추적"은 stale).
- crossCheck()는 의도적으로 skills/agents/hooks/mcp만 gate(libModules/scripts는 "release마다 변동"이라 제외 — line 168-171).
- **유일 실패**: CHANGELOG 헤더 2.1.22 vs canonical 2.1.21 → ENH-359 version bump으로 해소.
- One-Liner 5/5 sync.

---

## 3. ENH 상세

### ENH-357 — Doc drift 수정 (current-state만, release-history 보존)
**확정 current-state drift** (위치 검증 완료):
| 파일:라인 | 주장 | → 수정 |
|----------|------|--------|
| README.md:185 | v2.1.139 balanced, 94 consecutive | v2.1.159, 112 |
| README.md:201 | 163 lib modules / 19 subdirs / 51 scripts / 39 templates | 190 / 22 / 61 / 40 |
| AI-NATIVE:17,18 | 43 Skills / 36 Agents (mermaid) | 44 / 34 |
| AI-NATIVE:138 | 6 layers | 8 layers (line 205-212 일관) |
| AI-NATIVE:145-148 | 43 Skills/36 Agents/142 modules/16 subdirs/49 scripts | 44/34/190/22/61 |
| AI-NATIVE:198 | lib/ (142 modules) 16 subdirectories + 20개 subdir 리스트 | 190 modules/22 subdirs + 22 리스트 |
| README-FULL:684 | 163 / 19 | 190 / 22 |
| README-FULL:816 | v2.1.139, 94 consecutive | v2.1.159, 112 |
| README-FULL:669 | lib/domain (12 modules) | 18 modules |
- **skills 44 / agents 34 / hooks 21·24 / mcp 2·19**: README:201·AI-NATIVE:205 이미 정확(유지).
- **"226 CI-gated assertions"**: contract-test-run는 255(v2.1.16)/234(v2.1.9) 실행 — baseline-dependent. 추측 변경 금지 → **carry/검증 대상**(canonical 정의 확인 후 별도 판단).
- **CUSTOMIZATION-GUIDE.md / bkit-system/**: 수치 주장 추가 검증 필요.

### ENH-359 — Version bump 2.1.21 → 2.1.22
sites: `bkit.config.json`(canonical), `.claude-plugin/plugin.json`, README badge(2.1.21), hooks/hooks.json description, marketplace.json. CHANGELOG 헤더는 이미 2.1.22(Unreleased→릴리스 날짜 확정).

### ENH-356 — 8-lang trigger audit
44 skill(SKILL.md) + 40 agent(.md, deprecated 6 포함? active 34 대상) trigger keyword에 EN/KO/JA/ZH/ES/FR/DE/IT 완비 검증. 누락 site 식별·보완.

### ENH-355 — 전체 QA
qa-lead L1-L5 + S1 dataFlowIntegrity. criticalIssue 0. (메인 세션은 Task tool 보유 → qa 실행 가능. plugin 전체 대상.)

### ENH-358 — docs-code-sync 확장 (대부분 기구현)
libModules/scripts 이미 측정. 추가 검토: subdirs metric(informational), consecutive(narrative라 scanner 부적합 — 별도). → 최소 변경, 현 도구가 이미 충분함을 검증·문서화.

### ENH-360 — Release gate (§11)
7/7 archived + 0 current drift + QA PASS + 8-lang + invariant + gates green + version+CHANGELOG.

---

## 4. 실행 순서 (체크포인트)
1. ENH-359 version bump (clean, 1 failure 해소) → 검증+commit
2. ENH-357 doc drift 수정 (README/AI-NATIVE/README-FULL/CUSTOMIZATION/bkit-system) → docs-code-sync 재실행+commit
3. ENH-356 8-lang audit → commit
4. ENH-355 전체 QA → commit
5. ENH-358 docs-code-sync 검증/문서화 + ENH-360 release gate → 최종 commit + archive

> **Status**: Plan 완료 — design phase.
