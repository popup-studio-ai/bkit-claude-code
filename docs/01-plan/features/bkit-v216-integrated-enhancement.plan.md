# bkit v2.1.6 통합 고도화 계획서 — CC v2.1.107~108 대응 + 기존 v2.1.6 정비 릴리스 + GitHub Issue #77 대응 병합

> **작성일**: 2026-04-14 (최종 업데이트 2026-04-15)
> **대상 버전**: bkit v2.1.6 (v2.1.5 기반)
> **분석 방식**: CTO Team 11명 병렬 감사(기존) + CC v2.1.106-108 영향 조사 + Plan Plus 통합 브레인스토밍 + Issue #77 진단
> **베이스 CC 버전**: v2.1.108 (69개 연속 호환, breaking 0건)
> **통합 스코프**: 기존 v2.1.6 "정비 릴리스" + CC v2.1.107~108 대응 + 회귀 버그 4건 모니터링 + **GitHub Issue #77 (sessionTitle 덮어쓰기) P0 hotfix**
> **선행 문서**:
> - `docs/01-plan/features/bkit-v216-enhancement.plan.md` (기존 v2.1.6 정비 릴리스, 13 ENH, ~30h)
> - CC v2.1.107 영향 조사 결과 (본 문서에 인라인 수록)

---

## 0. Executive Summary

### 0.1 통합의 배경

사용자 요청: "bkit-v216-enhancement.plan.md 내용 포함 + v2.1.6 대응 필요 + 고도화/개선 모두 심층 분석 → 통합 plan 문서"

두 가지 흐름을 병합:

| 출처 | 핵심 | 스코프 |
|------|------|-------|
| 기존 v2.1.6 plan | CTO Team 11명 정비 감사 결과 | 13 ENH, ~30h (P0 3, P1 6, P2 4) |
| CC v2.1.106-107 영향 조사 | v2.1.106 **스킵** / v2.1.107 UX 1건 + 회귀 버그 4건 | 신규 ENH 1건, 모니터링 4건 |

### 0.2 통합 스코프 요약

v2.1.6은 **4대 축 + 1 모니터링 축**으로 재정의:

1. **Docs=Code 복원** — MEMORY/paths.js/design 정합 (기존)
2. **유기적 연동 강화** — unified-stop 정리, catch 래핑, dead code (기존)
3. **CC v2.1.105 신기능 선별 도입** — PreCompact blocking (기존)
4. **[신규] CC v2.1.107~108 대응 + 회귀 버그 방어** — Output style frontmatter 감사 + CTO Team 회귀 모니터
5. **[신규 P0] GitHub Issue #77 hotfix** — sessionTitle/Dashboard/Context injection UI hook opt-out + 단일화 + phase-change-only + stale TTL

**의도적으로 제외** (기존 유지):
- RTK 차용 → v2.2.0
- Clean Architecture T0~T5 → v3.0.0
- `context:fork` 전면 확대 → v2.2.0
- `monitors` manifest 실제 구현 → v2.2.0

### 0.3 최종 스코어카드

| 축 | 현재 | v2.1.6 통합 목표 | Δ |
|---|:---:|:---:|:---:|
| 아키텍처 등급 | 3.8/5 | 4.3/5 | +0.5 |
| 유기적 연동 품질 | 7.2/10 | 8.5/10 | +1.3 |
| CC 고급 기능 채택률 | ~70% | ~80% | +10% |
| OWASP 준수 | 6/10 | 9/10 | +3 |
| Match Rate | 75% | ≥95% | +20% |
| Breaking 연속 호환 | 68 | 69 | +1 |
| CC 회귀 버그 방어 | 0/4 | 2/4 | +2 |

### 0.4 Executive 4-Perspective

| Perspective | v2.1.6 통합 핵심 가치 |
|-------------|----------------------|
| **Technical** | PreCompact blocking으로 PDCA 무결성 + dead code 51→30% + Output style frontmatter 방어(#47482) |
| **Operational** | catch(_){} 43건 → 구조적 로깅, Hook chain 관측성 복원, CTO Team 회귀 리스크 사전 탐지(#47810) |
| **Strategic** | v2.2.0(RTK) / v3.0.0(Clean Arch) 전단계 안전 발판 + CC v2.1.108 hotfix 대기 가이드 |
| **Quality** | OWASP A01 FAIL 해결 + Bash 공격면 축소 + CC 1M context 사용자 가이드(#47855) |

### 0.5 신규 ENH 한 줄 요약 (통합 18건)

**기존 13건 (유지)**: ENH-201(MEMORY), 167(paths), 188(unified-stop), 202(fork READONLY 5), 203(PreCompact), 206(settings.deny), 207(catch 래핑), 208(Bash 확장), 209(agents disallowed), 210(handler docs), 211(lib/context/), 212(dead fallback), 213(permission-manager)

**CC v2.1.107 대응 1건**:
- **ENH-214 [P1 신규]**: Output styles YAML frontmatter 방어 감사 (CC #47482 회귀 대응)

**🆕 GitHub Issue #77 대응 4건 (Phase A hotfix)**:
- **ENH-226 [P0 🆕]**: `bkit.config.json` UI hook opt-out 3-way 토글 (`ui.sessionTitle.enabled` / `ui.dashboard.enabled` / `ui.contextInjection.enabled`) — 사용자 즉시 비활성화 경로 제공 (A1, 1h)
- **ENH-227 [P0 🆕]**: sessionTitle emit 단일화 — `lib/pdca/session-title.js` 신설, 6개 파일(user-prompt-handler, session-start, pdca-skill-stop, plan-plus-stop, iterator-stop, gap-detector-stop) 중복 로직 제거 (A2, 3h)
- **ENH-228 [P0 🆕]**: sessionTitle `phase-change-only` 갱신 — `.bkit/runtime/session-title-cache.json` 추가, 이전 emit과 동일한 phase+feature는 `undefined` 반환하여 CC 자동 타이틀 보존 (A3, 1.5h)
- **ENH-229 [P1 🆕]**: Stale feature TTL — `primaryFeature.timestamps.lastUpdated` > 24h 시 자동 `undefined` 반환, 과거 "ui" 같은 feature 누적 방지 (A4, 30m)

**모니터링 4건 (CC v2.1.107~108 회귀)**:
- **MON-CC-01**: #47810 `--dangerously-skip-permissions` + PreToolUse bypass — CTO Team 회귀 리스크 (v2.1.108 미해결)
- **MON-CC-02**: #47855 Opus 4.6 1M context + `/compact` REPL block — 사용자 가이드 (v2.1.108 미해결)
- **MON-CC-03**: #47828 SessionStart `systemMessage` + remoteControl — bkit 미사용 확인 완료 (v2.1.108 미해결)
- **🆕 MON-CC-04**: 회귀 4건 누적 미해결 모니터링 — v2.1.107 hotfix 대기 어긋남, **v2.1.109+ 대기 권고 갱신**

---

## 1. CC v2.1.106 ~ v2.1.107 영향 분석 (신규 통합 섹션)

### 1.1 Phase 1: 변경사항 조사 결과

#### v2.1.106 — 스킵 확인

| 검증 소스 | 결과 |
|---|---|
| CHANGELOG.md | v2.1.107 → v2.1.105 (entry 없음) |
| GitHub release tag `v2.1.106` | HTTP 404 |
| GitHub compare `v2.1.105...v2.1.107` | 커밋 1건 (`194736a`) |
| npm publish 기록 | 미발행 |

**결론**: 내부 빌드/테스트 취소 추정. 과거 7개 스킵 패턴(v2.1.82/93/95/99/102/103/**106**) 연속.

#### v2.1.107 변경사항

| # | 변경 내용 | 카테고리 | Impact | bkit 관련성 |
|---|---|---|---|---|
| 1 | Show thinking hints sooner during long operations | UX/Performance | LOW | **자동 수혜** (CTO Team 병렬, qa-monitor, phase-* 장시간 호출) |

**시스템 프롬프트 변화**: ~0 tokens (UX 렌더링 레이어).
**Hook/Tool/Frontmatter 카운트 변화**: **0건** (구조적 변경 없음).
**누적 연속 호환**: **68개** (v2.1.34 ~ v2.1.107, breaking 0).

### 1.2 Phase 2: bkit 영향 매핑

#### 1.2.1 직접 영향 — 없음

v2.1.107의 유일한 변경(thinking hints)은 코드 변경 불필요.

#### 1.2.2 회귀 버그 영향 — 4건 (신규 OPEN Issues)

| Issue | 심각도 | bkit 영향 | 확인 상태 |
|-------|:---:|----------|----------|
| **#47482** Output styles YAML frontmatter 미주입 (v2.1.104+) | MEDIUM | **직접 영향** — bkit 4 output style 전부 frontmatter 사용 | ⚠️ **ENH-214 부여** |
| **#47810** `--skip-permissions` + PreToolUse bypass | HIGH | 간접 — CTO Team에서 사용자가 bypass 시 bkit hook 미작동 가능 | ⚠️ **MON-CC-01 추적** |
| **#47855** Opus 4.6 1M context + `/compact` REPL block | HIGH | 간접 — 1M context 사용자(`[1m]` 모델) 직접 영향 | ⚠️ **MON-CC-02 문서화** |
| #47828 SessionStart `systemMessage` + remoteControl | MEDIUM | **무영향** — bkit SessionStart hook은 `systemMessage` 미사용 (검증 완료) | ✅ MON-CC-03 닫힘 |

#### 1.2.3 자동 수혜 — 1건

| 수혜 | 대상 |
|------|------|
| Thinking hints 조기 노출 | CTO Team 11명, qa-monitor, zero-script-qa, phase-* skills, pdca-iterator 등 장시간 tool 호출 UX 개선 |

### 1.3 bkit-v216 기존 plan에 통합되는 방식

| 구분 | 기존 v2.1.6 plan | 통합 후 (Issue #77 반영) |
|------|------------------|--------|
| IN (포함) | 13 ENH | **18 ENH** (+ENH-214 + ENH-226~229) |
| 공수 | ~30h | **~36h** (+30m ENH-214 + **+6h Issue #77 Phase A**) |
| 릴리스 블로커 | G1~G7 | **G1~G9** (+G8 Output style frontmatter, +G9 sessionTitle opt-out & single-source) |
| 모니터링 | 외부 이슈 9건 | **+4건** (MON-CC-01/02/03/04) |
| GitHub Issue 대응 | 0건 | **1건** (#77 P0 hotfix, Phase A 4 ENH) |

---

## 2. 기존 v2.1.6 plan 재확인 및 변경 내용

> **원문**: `docs/01-plan/features/bkit-v216-enhancement.plan.md` (711 lines).
> 본 섹션은 **변경된 부분만** 하이라이트. 변경 없는 섹션은 원문 참조.

### 2.1 유지되는 항목 (원문 그대로)

- §1 "11명 CTO Team 분석 종합" — 그대로
- §2 "Plan Plus 브레인스토밍 (CTO Team 기반)" — 그대로
- §4 "ENH별 상세 설계" (ENH-201~213, 167, 188, 202, 203) — 그대로
- §5 "유기적 연동 설계" — 그대로
- §6 "리스크 및 완화" — 그대로
- §7 "WBS" — ENH-214 1줄 추가(아래 §4.4)
- §9 "릴리스 체크리스트" — G8 추가(아래 §5)
- §10 "v2.2.0 / v3.0.0 경로" — 그대로

### 2.2 통합으로 갱신된 항목

- §0 Executive Summary — 본 문서 §0 로 대체
- §3 v2.1.6 스코프 정의 — 본 문서 §3 로 대체 (ENH-214 + ENH-226~229 포함)
- §8 품질 게이트 — 본 문서 §5 로 대체 (G8 + G9 포함)
- §11 결론 — 본 문서 §8 로 대체 (**18 ENH**, 68→69 호환, Issue #77 P0 hotfix)

---

## 3. 통합 v2.1.6 스코프 (18 ENH)

### 3.1 IN (포함)

| 카테고리 | 항목 | ENH | 우선순위 | 공수 | 출처 |
|---------|------|-----|:-----:|:----:|------|
| Docs=Code | MEMORY.md 정합 교정 (8건) | ENH-201 | P0 | 30m | 기존 |
| Docs=Code | paths.js bkitVersion 동적화 | ENH-167 | P0 | 15m | 기존 |
| Docs=Code | 3개 handler design 반영 | ENH-210 | P2 | 30m | 기존 |
| 보안 | settings.json permissions.deny | ENH-206 | P0 | 30m | 기존 |
| 보안 | Bash destructive 패턴 확장 (9→20+) | ENH-208 | P1 | 1h | 기존 |
| 보안 | agents disallowedTools 감사 | ENH-209 | P1 | 1h | 기존 |
| 유기적 연동 | unified-stop.js deprecated 제거 | ENH-188 | P1 | 1h+3h test | 기존 |
| 유기적 연동 | catch(_){} debugLog 래핑 (43건) | ENH-207 | P1 | 3h | 기존 |
| 유기적 연동 | detectActiveSkill dead fallback | ENH-212 | P2 | 30m | 기존 |
| 유기적 연동 | permission-manager dead branch | ENH-213 | P2 | 45m | 기존 |
| 유기적 연동 | lib/context/ 삭제 결정/실행 | ENH-211 | P2 | 1h | 기존 |
| CC 통합 | PreCompact decision:block | ENH-203 | P1 | 3h+3h test | 기존 |
| DX | context:fork READONLY 5 skills | ENH-202 | P1 | 2h | 기존 |
| 🆕 CC 회귀 방어 | Output styles frontmatter 감사 | ENH-214 | P1 | 30m | CC #47482 |
| **🆕 Issue #77 P0 hotfix** | **bkit.config.json UI opt-out 3-way** | **ENH-226** | **P0** | **1h** | **GitHub #77 (A1)** |
| **🆕 Issue #77 P0 hotfix** | **sessionTitle 단일화 (lib/pdca/session-title.js 신설, 6 파일 정리)** | **ENH-227** | **P0** | **3h** | **GitHub #77 (A2)** |
| **🆕 Issue #77 P0 hotfix** | **phase-change-only 갱신 (runtime 캐시)** | **ENH-228** | **P0** | **1.5h** | **GitHub #77 (A3)** |
| **🆕 Issue #77 P1 hotfix** | **Stale feature TTL (24h)** | **ENH-229** | **P1** | **30m** | **GitHub #77 (A4)** |
| QA | L1~L5 TC 74+4+6건 작성 | — | P1 | 8h+1h | 기존 + Issue #77 |
| 문서 | CHANGELOG, context-engineering, MON, **opt-out 가이드** | — | P0 | 1h+30m | 기존 + #77 |
| **합계** | | | | **~36h** | |

### 3.2 OUT (제외 — 원문 유지)

`monitors`/Skill desc 재확장/RTK/Clean Arch/fork 전면/state-machine 분할/audit-logger 정규화/PermissionDenied hook → **v2.2.0 또는 v3.0.0**.

### 3.3 MONITOR (문서화만, 구현 없음)

| # | 이슈 | 심각도 | 조치 | 공수 |
|---|------|:---:|------|:---:|
| **MON-CC-01** | #47810 `--skip-permissions` + PreToolUse bypass | HIGH | CHANGELOG에 "v2.1.107~108 사용 시 주의" 기재, **v2.1.109+** hotfix 대기 | 5m |
| **MON-CC-02** | #47855 Opus 4.6 1M context `/compact` block | HIGH | `docs/03-analysis/claude-code-v2-1-107-cautions.md` 신규 작성 | 15m |
| **MON-CC-03** | #47828 SessionStart systemMessage + remoteControl | LOW | **bkit 미사용 확인 완료** — no-op (문서만 참조) | 5m |
| **🆕 MON-CC-04** | v2.1.108 회귀 4건 전부 미해결 누적 | MEDIUM | v2.1.107 hotfix 대기 권고 어긋남 → **v2.1.109+ 대기 권고 갱신** (MEMORY + CHANGELOG) | 5m |

---

## 4. 신규 ENH-214 상세 설계

### 4.1 배경

CC #47482 (OPEN, MEDIUM): v2.1.104 이후 output style YAML frontmatter가 system prompt에 주입되지 않는 회귀. bkit은 **4개 output style** 전부 frontmatter 사용.

```bash
$ head -3 output-styles/*.md
==> bkit-enterprise.md <==       ---
==> bkit-pdca-enterprise.md <==  ---
==> bkit-learning.md <==         ---
==> bkit-pdca-guide.md <==       ---
```

### 4.2 목표

1. bkit 4개 output style이 frontmatter에 **의존하지 않도록** 본문에 핵심 규칙을 중복 서술 (self-contained 방어)
2. `scripts/audit-output-styles.js` 신규: CI에서 frontmatter ↔ 본문 동기화 검증
3. CHANGELOG에 "CC v2.1.108 이전 사용 시 주의" 기재

### 4.3 구현 상세

**1단계: 감사 (grep)**
```bash
for f in output-styles/*.md; do
  head -20 "$f" | grep -A5 "^description:" # frontmatter 범위 추출
done
```

**2단계: 방어적 중복 (각 output style 본문 첫 섹션 강화)**

```diff
# output-styles/bkit-pdca-enterprise.md
 ---
 name: bkit-pdca-enterprise
 description: |
   PDCA workflow tracking with enterprise architecture analysis.
 ---

+<!-- [v2.1.6 SELF-CONTAINED FALLBACK: CC #47482 대응]
+     이 스타일은 frontmatter 미주입 상황에서도 본문만으로 동작합니다. -->
+
 # bkit PDCA Enterprise Style
-
-## Response Rules
+
+**이 output style의 핵심 역할**: PDCA phase tracking([Plan]→[Design]→[Do]→[Check]→[Act]) + Enterprise analysis.
+
+## Response Rules
```

**3단계: audit 스크립트 (`scripts/audit-output-styles.js`, ~40 LOC)**

```js
// 검증:
// 1. 4개 파일 전부 frontmatter 보유
// 2. 각 파일 본문에 "핵심 역할" 또는 동급 self-description 존재
// 3. frontmatter name과 파일명 일치
// 실패 시 exit(1) — CI G8 게이트
```

**4단계: CHANGELOG 경고**

```markdown
## v2.1.6 (2026-04-21)

### ⚠️ Known Issue (CC v2.1.107)
`--output-style` 적용 시 CC v2.1.107에서 frontmatter 미주입 회귀(#47482)가 있습니다.
bkit 4개 output style은 self-contained 본문으로 방어되므로 영향 없습니다.
CC v2.1.108 hotfix 이후 정상화 예정.
```

### 4.4 WBS 1줄 추가

| Phase | 항목 | 담당 | 공수 | 의존 |
|-------|------|-----|:---:|------|
| P1. CC 회귀 방어 (30m) | ENH-214 output-styles audit + self-contained fallback | code-analyzer | 30m | — |

---

## 4A. 🆕 GitHub Issue #77 Phase A 상세 설계 (ENH-226~229)

> **원천 이슈**: https://github.com/popup-studio-ai/bkit-claude-code/issues/77 (psy891030, 2026-04-14, OPEN)
> **사용자 불만 요약**: sessionTitle이 `[bkit] <feature>` 형식으로 **매 메시지마다** 덮어써서 병렬 터미널 창 제목이 동일 → 배포 등 위험 작업 시 잘못된 창에 입력 가능.
> **사용자 우회책**: `hooks/hooks.json`을 빈 맵으로 수동 교체 — 일반 사용자 불가능.
> **MEMBER(tomo-kay) 응답**: "다음 업데이트 때 개선" 약속 (2026-04-14).

### 4A.1 Root Cause 매트릭스

| 원인 | 증거 파일:라인 | 현재 방어 | Phase A 대응 |
|------|---------------|----------|-------------|
| 6개 파일에서 sessionTitle 중복 emit | user-prompt-handler.js:252-265, session-start.js:199-216, pdca-skill-stop.js:330-348+363-374, plan-plus-stop.js:68-88, iterator-stop.js:324-341, gap-detector-stop.js:496-513 | ❌ 없음 | **ENH-227** 단일화 |
| `contextParts.length > 0` 조건 불충분 (PDCA 비사용자도 충족) | user-prompt-handler.js:249 | ⚠️ 부분 (`feature ? : undefined`) | **ENH-226** opt-out + **ENH-228** phase-change-only |
| PDCA 상태 3초 캐시 동적 갱신 | lib/pdca/status.js (getPdcaStatusFull, cache TTL 3000ms) | ❌ 없음 | **ENH-228** 이전 emit 캐시 비교 |
| Stale feature 누적 (사용자 사례: "ui") | `.bkit/state/pdca-status.json` lastUpdated 검증 부재 | ❌ 없음 | **ENH-229** 24h TTL |
| Opt-out 설정 부재 | `bkit.config.json` 스키마에 ui.* 항목 없음 | ❌ 없음 | **ENH-226** 3-way 토글 |

### 4A.2 ENH-226 (P0): bkit.config.json UI opt-out 3-way 토글

**목적**: PDCA 비사용자가 `bkit.config.json` 한 줄 편집으로 UI hook 완전 비활성화 가능하게.

**스키마 확장**:
```json
{
  "ui": {
    "sessionTitle": { "enabled": true },
    "dashboard": { "enabled": true },
    "contextInjection": { "enabled": true }
  }
}
```

**구현**:
- `lib/core/config.js`에 `getUIConfig()` 추가 (기본값 `true`로 기존 호환)
- 6개 emit 지점 및 session-start.js dashboard render, user-prompt-handler.js contextParts build 앞단에 `if (!ui.X.enabled) return earlyEmpty()` 가드
- README + `docs/02-design/config-schema.md`에 opt-out 가이드 명문화

**공수**: 1h (스키마 0.25 + 가드 0.5 + 문서 0.25)

### 4A.3 ENH-227 (P0): sessionTitle 단일화 — lib/pdca/session-title.js

**목적**: 6개 파일에 흩어진 sessionTitle 생성 로직을 단일 함수로 통합. 향후 CC v2.1.109+ 타이틀 정책 변경 시 1곳만 수정.

**신규 모듈**:
```javascript
// lib/pdca/session-title.js
export function generateSessionTitle({ action, feature, phase, reason }) {
  // ui.sessionTitle.enabled 체크
  // stale TTL 체크 (ENH-229 연동)
  // phase-change-only 캐시 체크 (ENH-228 연동)
  // 이전 emit과 동일 → undefined (CC auto-title 보존)
  // 반환: `[bkit] ${ACTION|PHASE} ${feature}` or undefined
}
```

**마이그레이션 대상 6 파일**:
1. `scripts/user-prompt-handler.js:252-265` — 기존 템플릿 로직 제거, `generateSessionTitle({ phase, feature })` 호출
2. `hooks/session-start.js:199-216` — 동일 교체
3. `scripts/pdca-skill-stop.js:330-348 + 363-374` — `generateSessionTitle({ action, feature })` 2곳
4. `scripts/plan-plus-stop.js:68-88` — 동일
5. `scripts/iterator-stop.js:324-341` — 동일
6. `scripts/gap-detector-stop.js:496-513` — 동일

**공수**: 3h (신규 모듈 1h + 6 파일 리팩터 1.5h + 회귀 테스트 0.5h)

### 4A.4 ENH-228 (P0): phase-change-only 갱신 + runtime 캐시

**목적**: 매 메시지 sessionTitle 재발행 제거. phase/feature가 이전과 동일하면 `undefined` 반환 → CC 자동 생성 타이틀 보존.

**신규 상태 파일**: `.bkit/runtime/session-title-cache.json`
```json
{
  "lastEmitted": {
    "feature": "cc-version-issue-response",
    "phase": "plan",
    "action": null,
    "sessionId": "abc123",
    "timestamp": "2026-04-15T12:00:00Z"
  }
}
```

**로직 (lib/pdca/session-title.js 내)**:
```
if (ui.sessionTitle.enabled === false) return undefined
if (staleTTLViolated(pdcaStatus)) return undefined  // ENH-229
cache = readSessionTitleCache()
if (cache.sessionId === currentSessionId &&
    cache.feature === feature &&
    cache.phase === phase &&
    cache.action === action) {
  return undefined  // ← 핵심: 재발행 안 함
}
writeSessionTitleCache({ sessionId, feature, phase, action })
return `[bkit] ${action || phase?.toUpperCase()} ${feature}`
```

**효과**: 기존 "매 메시지마다 emit" → "phase/feature/action 변경 시에만 emit" (평균 6회 중복 → 1~2회).

**공수**: 1.5h (캐시 I/O 0.5 + 로직 0.5 + 테스트 0.5)

### 4A.5 ENH-229 (P1): Stale feature TTL (24h)

**목적**: 사용자 사례 "ui" 같은 과거 feature가 `primaryFeature`에 남아 계속 타이틀 오염 → 24h 이상 미갱신 시 자동 무효화.

**로직**:
```javascript
// lib/pdca/session-title.js 내 staleTTLViolated()
const STALE_TTL_MS = 24 * 60 * 60 * 1000
const feature = pdcaStatus.features[pdcaStatus.primaryFeature]
const lastUpdated = new Date(feature?.timestamps?.lastUpdated || 0)
return Date.now() - lastUpdated.getTime() > STALE_TTL_MS
```

**설정 가능**: `bkit.config.json`의 `ui.sessionTitle.staleTTLHours` (기본 24, 0 = 비활성).

**공수**: 30m

### 4A.6 Phase A WBS (~6h)

| Task | ENH | 담당 | 공수 | 의존 |
|------|-----|-----|:----:|------|
| bkit.config.json ui 스키마 + 가드 | ENH-226 | frontend-architect | 1h | — |
| lib/pdca/session-title.js 신설 | ENH-227 | bkend-expert | 1h | ENH-226 |
| 6개 파일 마이그레이션 | ENH-227 | code-analyzer | 1.5h | ENH-227 모듈 |
| runtime cache 로직 | ENH-228 | bkend-expert | 1h | ENH-227 |
| stale TTL 로직 | ENH-229 | bkend-expert | 30m | ENH-227 |
| 회귀 TC L3×3 + L1×3 | — | qa-test-generator | 1h | 전체 |

**누적 공수**: 6h (1 + 2.5 + 1 + 0.5 + 1 = 6h). 순차 의존성 있음.

### 4A.7 Phase A 테스트 계획 (+6 TC)

| Level | TC | 검증 |
|-------|----|------|
| L1 | TC-A1: `ui.sessionTitle.enabled=false` 시 6 hook 모두 undefined 반환 | ENH-226 |
| L1 | TC-A2: `ui.dashboard.enabled=false` 시 SessionStart dashboard 박스 미출력 | ENH-226 |
| L1 | TC-A3: `ui.contextInjection.enabled=false` 시 UserPromptSubmit additionalContext 비어 있음 | ENH-226 |
| L3 | TC-A4: 동일 phase+feature 2회 연속 호출 시 1회만 emit (cache hit) | ENH-228 |
| L3 | TC-A5: phase 전환(plan→design) 시 재발행 1회 | ENH-228 |
| L3 | TC-A6: lastUpdated 25h 전 feature 시 undefined 반환 | ENH-229 |

### 4A.8 Phase A 위험 및 완화

| 위험 | 완화 |
|------|------|
| runtime 캐시 동시쓰기 경합 (CTO Team 12명 병렬 emit) | 기존 `pdca-status.json` concurrent write 패턴 재사용 (G4 게이트 적용) |
| 기존 PDCA 사용자 제목 사라짐 우려 | 기본값 `enabled: true` 유지, phase-change-only는 "동일 phase 반복 emit"만 제거 → 실제 변경 시엔 정상 emit |
| 24h TTL이 장기 PDCA 세션에 부적절 | `staleTTLHours: 0` 비활성 옵션, `staleTTLHours: 168`(1주) 등 사용자 조정 |
| 이슈 #77 사용자 피드백 루프 부재 | v2.1.6-rc 배포 후 이슈 #77 코멘트에 테스트 요청 |

### 4A.9 Phase B/C 연기 (본 plan 범위 밖)

- **Phase B (v2.2.0)**: PDCA 활성/비활성 자동 감지, Output Style `bkit-minimal`/`bkit-agents-only` 2종, Dashboard on-demand 전환 (`/bkit status`)
- **Phase C (v3.0.0)**: "bkit-lite" 모드 (hooks 완전 비활성), Plugin opt-in 원칙 전면 재설계

v2.1.6은 **긴급 hotfix (Phase A)**만 포함 — 사용자 이탈 즉시 차단 후 구조 재설계는 후속 릴리스.

---

## 5. 통합 품질 게이트 (G1 ~ G9)

### 5.1 게이트 목록

| Gate | 조건 | 블로킹 | 출처 |
|------|------|:---:|------|
| G1 | context:fork 5 skills description ≤ 250자 | Yes | 기존 |
| G2 | 36 agents frontmatter (effort+maxTurns+model) 완전성 | Yes | 기존 |
| G3 | PreCompact hook timeout < 3,000ms | Yes | 기존 |
| G4 | pdca-status.json concurrent write 테스트 pass | **Yes** | 기존 |
| G5 | Match Rate ≥ 90% | Yes | 기존 |
| G6 | Critical Issues = 0 (code-analyzer) | Yes | 기존 |
| G7 | **68연속 호환 유지** (CC v2.1.107 smoke) | **Yes** | 기존 (67→68) |
| **G8** | **`scripts/audit-output-styles.js` exit 0** | **Yes** | **🆕 ENH-214** |
| **G9** | **sessionTitle opt-out + single-source 검증** — (a) `ui.sessionTitle.enabled=false` 시 6 hook 모두 undefined, (b) `grep -r "sessionTitle" scripts/ hooks/` 결과가 `lib/pdca/session-title.js` import만 존재, (c) 동일 phase 반복 2회 시 emit 1회 | **Yes** | **🆕 ENH-226/227/228** |

### 5.2 QA 전략 (74 + 4 = 78 TC)

| Level | TC 수 | 범위 |
|:---:|:---:|------|
| L1 Unit | 22 | hook handler 함수 |
| L2 Integration | 14 | hook→script→lib 체인 |
| L3 Component | 28 + 2 | 5 fork skills + 16 agent frontmatter + **output-styles audit × 2** |
| L4 E2E | 6 + 1 | PDCA 완전 사이클 + **output-style 4 파일 로드 smoke** |
| L5 User | 4 + 1 | 실제 워크플로우 + **bkit-pdca-enterprise 출력 검증** |
| **합계** | **78 TC** | |

### 5.3 OWASP Top 10 목표 (유지)

| OWASP | 이전 | v2.1.6 | 방법 |
|-------|:---:|:---:|------|
| A01 Access Control | FAIL | **PASS** | ENH-206 |
| A03 Injection | 부분 | **PASS** | ENH-208 |
| A05 Misconfig | FAIL | **PASS** | ENH-206 |
| A09 Logging | 부분 | **개선** | ENH-207 |
| A10 SSRF | FAIL | **PASS** | ENH-208 |

---

## 6. Plan Plus 통합 브레인스토밍 결과

### 6.1 Phase 0: Intent Discovery — 재확인

| 가정 | 검증 | 결론 |
|------|------|------|
| "v2.1.6에 CC v2.1.107 신기능도 많이 포함" | CC 조사: v2.1.107은 UX 1건 + 회귀 4건, 신기능 0 | ❌ 신기능 추가 없음 |
| "회귀 버그 4건 전부 ENH 부여" | 영향 분석: 1건만 직접(#47482), 나머지 모니터링 | ✅ ENH-214 1건만 신규 |
| "v2.1.6 스코프를 v2.1.7로 분리" | 공수 +30m 불과, 릴리스 창 단축 의미 없음 | ❌ 통합 유지 |
| "v2.1.107 업그레이드 강제" | 4건 회귀 중 CTO Team 영향 가능성 (#47810) | ⚠️ **v2.1.108 hotfix 대기 권장** |

**결정된 통합 의도**:

> "v2.1.6은 CC v2.1.107 기반 정비 릴리스다. CC 신규 기능 채택(PreCompact)과 내부 부채 청산을 병행하되, **v2.1.107 회귀 버그는 ENH-214 한 건으로 최소 방어**하고 나머지는 모니터링으로 기록한다. v2.1.108 hotfix 이후 필요 시 v2.1.7에서 추가 대응."

### 6.2 Phase 1: Alternative Exploration (신규 분기만)

#### ENH-214 구현 전략 (3안)

| 전략 | 구현 범위 | 비용 | 리스크 |
|------|----------|------|------|
| A. 무시 (v2.1.108 대기) | 아무 조치 없음 | 0 | frontmatter 미주입 시 4 style 전부 동작 불명 |
| B. **self-contained 본문 강화 + audit** | 각 style 본문 중복 + CI 검증 | 30m | ✅ 권장 (회귀 버그 무관하게 안전) |
| C. frontmatter 제거, 전부 본문 이동 | 4 파일 대규모 재구성 | 2h | Plugin 선언 충돌 가능 |

**선택**: B — 최소 비용, CC v2.1.108 hotfix 전후 모두 안전.

### 6.3 Phase 2: YAGNI Review

| 항목 | 포함? | 이유 |
|------|:---:|------|
| ENH-214 (output-styles 방어) | ✅ | 4 파일 모두 영향, 30m로 방어 가능 |
| #47810 CTO Team bypass 감지 코드 | ❌ | 사용자가 `--skip-permissions` 자의 사용 시 책임 사용자, bkit 방어 불가 |
| #47855 1M context `/compact` 차단 | ❌ | CC 버그, bkit 영역 외. 문서만 |
| #47828 systemMessage 사용 금지 | ❌ | bkit 미사용 확인, 무영향 |
| v2.1.107 thinking hints 최적화 | ❌ | 자동 수혜, 코드 변경 불필요 |
| 전체 4 회귀에 공식 공지문 | ⚠️ | MON-CC-02 1건만 사용자 가이드 작성 (15m) |

### 6.4 Phase 3: Priority Assignment (통합)

**P0 블로커 (v2.1.6 필수, 유지)**:
- ENH-201, ENH-167, ENH-206

**P1 권장 (v2.1.6 릴리스 전)**:
- ENH-188, ENH-203, ENH-207, ENH-208, ENH-202, ENH-209
- **🆕 ENH-214** (CC #47482 방어)

**P2 Nice-to-Have (기존 유지)**:
- ENH-210, ENH-211, ENH-212, ENH-213

**MONITOR (구현 없음, 문서만)**:
- MON-CC-01 (#47810), MON-CC-02 (#47855), MON-CC-03 (#47828 무영향 기록)

### 6.5 Phase 4: Pre-mortem (신규 시나리오만)

| 실패 | 원인 | 예방책 |
|------|------|--------|
| v2.1.107 사용자가 output style 의도대로 안 나옴 | CC #47482 회귀 | ENH-214 self-contained 본문 + CHANGELOG 경고 |
| CTO Team 사용자가 `--skip-permissions` 썼다가 hook 미작동 | CC #47810 | MON-CC-01 CHANGELOG 경고, v2.1.108 대기 |
| Opus 4.6 1M 사용자가 `/compact` 후 멈춤 | CC #47855 | MON-CC-02 cautions 문서 |
| v2.1.108 hotfix가 새 회귀 유발 | CC 릴리스 리스크 | G7 smoke test를 v2.1.107 + v2.1.108 둘 다로 확장 |

---

## 7. 통합 일정 (1주일+α, 기존 + 30m + Issue #77 6h)

| Day | 작업 | 누적 공수 |
|:---:|------|:---:|
| 1 (월) | P1 Docs=Code + P2 보안 (5h) | 5h |
| 2 (화) | P3 유기적 연동 상반부 (ENH-188 작업 4h) | 9h |
| 3 (수) | P3 나머지 + P4 Dead Code (4h) | 13h |
| 4 (목) | P5 CC v2.1.105 통합 (6h) + **P8 ENH-214 (30m)** | 19.5h |
| 5 (금) | P6 DX + P7 QA 1차 (7h) | 26.5h |
| **5.5 (금 야간)** | **🆕 PA Issue #77 Phase A — ENH-226 opt-out (1h) + ENH-227 단일화 (3h)** | **30.5h** |
| **6 (토) 오전** | **🆕 PA 계속 — ENH-228 phase-cache (1.5h) + ENH-229 stale TTL (30m)** | **32.5h** |
| 6 (토) 오후 | 회귀 테스트 (**v2.1.107 + v2.1.108**) + Phase A QA (TC-A1~A6) | 34.5h |
| 7 (일) | 릴리스, CHANGELOG(**MON-CC-04 + Issue #77 Phase A 섹션**), 태그, **이슈 #77 코멘트로 v2.1.6-rc 테스트 요청** | **~36h** |

---

## 8. 결론 및 CTO 메시지

### 8.1 핵심 4줄

1. **v2.1.6은 CC v2.1.107~108 정비 릴리스 + GitHub Issue #77 P0 hotfix다** — 기존 13 ENH + ENH-214(CC #47482) + **ENH-226~229(Issue #77 Phase A)** = **18 ENH**, 공수 ~36h.
2. **v2.1.109+ hotfix 전에는 user-facing 경고 필수** — CHANGELOG MON 섹션 + cautions.md (v2.1.107 권고 어긋남 → v2.1.109+ 대기로 갱신).
3. **Breaking 0 기록 69연속 달성 — G7 + G8(output styles audit) + G9(sessionTitle opt-out & single-source) 블로킹.**
4. **🆕 GitHub Issue #77 사용자가 "삭제까지 고민"한 P0 위험 — Phase A 4건(opt-out 토글 + emit 단일화 + phase-change-only + stale TTL)으로 즉시 구제. Phase B/C는 v2.2.0/v3.0.0 연기.**

### 8.2 예상 효과 (통합)

| 지표 | Before | After | Δ |
|------|:---:|:---:|:---:|
| Critical Issues | 5 | 0 | −5 |
| Dead Code | 51% | ~30% | −21% |
| OWASP 준수 | 6/10 | 9/10 | +3 |
| catch(_){} 무조건삼킴 | 43건 | 0건 | −43 |
| hardcoded version | 2곳 | 0 | −2 |
| CC 고급기능 채택률 | ~70% | ~80% | +10% |
| 유기적 연동 품질 | 7.2/10 | 8.5/10 | +1.3 |
| Match Rate | ~75% | ≥95% | +20% |
| **CC 회귀 버그 방어** | **0/4** | **2/4** (ENH-214 + MON 문서화 3건 MON-CC-01/02/04) | **+2** |
| bkit 연속 호환 | 68 | **69** | +1 |
| **🆕 GitHub Issue #77 해결** | **OPEN** | **CLOSED (Phase A 4건)** | **−1 P0 위험** |
| **🆕 sessionTitle emit 중복** | **6건/메시지** | **1건/phase 변경** | **−5 (≈83% 감소)** |
| **🆕 사용자 opt-out 옵션** | **0건** | **3건** (ui.sessionTitle/dashboard/contextInjection) | **+3** |
| 신규 ENH (통합) | — | **18건** (201,167,188,202,203,206~214,**226~229**) | +18 |

### 8.3 릴리스 승인 조건

- [ ] 본 통합 계획서 검토 및 승인 (사용자)
- [ ] `docs/02-design/features/bkit-v216-integrated-enhancement.design.md` 작성 (Do phase 진입 전)
- [ ] CC v2.1.108 릴리스 상태 확인 (2026-04-21 이전) — 있으면 G7에 추가
- [ ] `/pdca team bkit-v216-enhancement` 실행 → 본 통합 plan 기반 구현

### 8.4 위임 표

| 작업 | 담당 agent (Do phase) | Effort |
|------|----------------------|--------|
| P0 Docs=Code (ENH-201/167) | cto-lead + code-analyzer | 45m |
| P0 보안 (ENH-206) | security-architect | 30m |
| P1 ENH-188 E2E | qa-strategist + qa-monitor | 4h |
| P1 PreCompact (ENH-203) | bkit-impact-analyst + code-analyzer | 5h |
| P1 catch 래핑 (ENH-207) | code-analyzer | 3h |
| P1 context:fork 5 (ENH-202) | Skills Architect (Explore) + qa-monitor | 2h |
| **P1 🆕 ENH-214 + MON 문서** | **code-analyzer + report-generator** | **50m** |
| **P0 🆕 ENH-226 opt-out 토글 (Issue #77 A1)** | **frontend-architect + code-analyzer** | **1h** |
| **P0 🆕 ENH-227 sessionTitle 단일화 (Issue #77 A2)** | **bkend-expert + code-analyzer** | **3h** |
| **P0 🆕 ENH-228 phase-change-only 캐시 (Issue #77 A3)** | **bkend-expert** | **1.5h** |
| **P1 🆕 ENH-229 stale TTL 24h (Issue #77 A4)** | **bkend-expert** | **30m** |
| P2 dead code/정리 (210~213) | code-analyzer + gap-detector | 3.5h |
| QA L1~L5 (78+6 TC) | qa-test-generator + qa-monitor | 8.5h+1h |
| 릴리스 준비 + **이슈 #77 reply** | cto-lead | 30m |
| **합계** | | **~36h** |

---

## 9. 참조 문서

- **기존 v2.1.6 plan (원문 유지)**: `docs/01-plan/features/bkit-v216-enhancement.plan.md`
- **CC v2.1.105 영향 보고서**: `docs/archive/2026-04/cc-v21105-impact-analysis/cc-v21105-impact-analysis.report.md`
- **CC v2.1.107 조사 원본**: 본 문서 §1 (cc-version-researcher agent 결과)
- **MEMORY**: `/Users/popup-kay/.claude/projects/-Users-popup-kay-Documents-GitHub-popup-bkit-claude-code/memory/MEMORY.md`
- **v2.2.0 roadmap**: `docs/archive/2026-04/rtk-inspired-bkit-enhancement/rtk-inspired-bkit-enhancement.plan.md`
- **v3.0.0 roadmap**: `docs/archive/2026-04/bkit-v300-clean-architecture-enhancement/bkit-v300-clean-architecture-enhancement.plan.md`

---

**CTO Team 참여 (기존 + CC 연구)**:
- Skills Architect, Agents Architect, Hooks Integrator, MCP Engineer (Explore × 4)
- CC Feature Integrator, Gap Detector, Code Quality Analyst
- QA Strategist, Security Architect, Enterprise Expert
- **🆕 CC Version Researcher** (v2.1.106-107 조사, 47 이슈 / 28 릴리스 / 68 연속 호환 검증)
- **총 12명, 전체 분석 시간 ~20분** (기존 18분 + CC 조사 2분)
