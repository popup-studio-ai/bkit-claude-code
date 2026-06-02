# S5 — Final QA + i18n + Docs-Sync 설계서

> **Sprint**: `final-qa-i18n-docs-sync` (S5, LAST) · **Trust**: L4 · **ENH**: ENH-355~360
> **Date**: 2026-06-02 · **선행**: plan(권위 drift 테이블) + ground-truth 측정

---

## 1. 설계 원칙
1. **current-state만 수정, release-history 불변**: 각 수치의 위치를 분류 — 아키텍처 요약/권고 표(current)는 수정, 버전 이력 스냅샷("at-the-time")은 보존.
2. **추측 금지**: baseline-dependent 수치("226 assertions")는 canonical 확인 전 미변경(carry).
3. **canonical version SoT**: `bkit.config.json:version`이 단일 진실. 나머지는 동기화.
4. **measure로 검증**: 모든 doc 수정 후 `docs-code-sync.js` 재실행 → drift 0 확인.
5. **8-lang 완비**: docs/ 외부 유일 허용 비영어 콘텐츠 = trigger keyword. 누락 보완.

## 2. 변경 매니페스트

### ENH-359 version bump (2.1.21→2.1.22)
| 파일 | 위치 | before→after |
|------|------|--------------|
| bkit.config.json | version | 2.1.21→2.1.22 (canonical) |
| .claude-plugin/plugin.json | version | 2.1.21→2.1.22 |
| .claude-plugin/marketplace.json | version (있으면) | 동기화 |
| README.md | badge Version-2.1.21 | 2.1.22 |
| hooks/hooks.json | description v2.1.21 | 2.1.22 |
| CHANGELOG.md | `## [2.1.22] - Unreleased` | 릴리스 날짜 확정 |

### ENH-357 doc drift (plan §3 테이블 — current-state만)
README.md(185,201) · AI-NATIVE-DEVELOPMENT.md(17,18,138,145-148,198,205확인) · README-FULL.md(669,684,816) · CUSTOMIZATION-GUIDE.md(검증) · bkit-system/(검증). 수치: modules 190 / subdirs 22 / scripts 61 / templates 40 / skills 44 / agents 34 / CC v2.1.159 / consecutive 112 / layers 8.

### ENH-356 8-lang audit
44 SKILL.md + 34 active agent .md의 trigger 블록에 EN/KO/JA/ZH/ES/FR/DE/IT 존재 검증(스크립트로 측정 → 누락 보완).

### ENH-355 QA
plugin 전체 정적+런타임: contract L1+L4(255/234), check-deadcode(0), verify-full-system(module/hook/agent/hooks.json), tests/qa+tests/contract 회귀(baseline 7), node --check 전 변경.

### ENH-358 docs-code-sync
이미 libModules/scripts 측정 + invariant 0. subdirs metric은 informational 추가 검토(현 설계 철학상 gate 제외 유지). consecutive는 narrative(scanner 부적합). → 현 도구 충분성 검증 + 문서화.

## 3. Test/검증 Plan
| 항목 | 방법 |
|------|------|
| version 일관 | docs-code-sync scanVersions mismatch 0 |
| doc drift 0 | docs-code-sync crossCheck(확장 타깃) + 수동 grep |
| 8-lang 완비 | 측정 스크립트 84 파일 |
| QA | contract 255/234 + deadcode 0 + verify-full-system + 회귀 0 |
| release gate | §11 7항목 |

## 4. API Contract (M4)
코드 변경은 version 문자열 + (필요시) docs-code-sync metric 추가. 공개 시그니처 불변. **M4 = 100**.

## 5. Self-Assessment (M8)
Context Anchor ✅ / ground-truth 측정 ✅ / current vs history 분류 ✅ / 변경 매니페스트 ✅ / 검증 plan ✅ / 추측 회피(226 carry) ✅. **M8 = 90**.

> **Status**: Design 완료 — do phase. 첫 체크포인트: ENH-359 version bump.
