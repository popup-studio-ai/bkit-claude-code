# bkit v2.1.8 Hotfix 계획서 — Issue #81 대응 + CC v2.1.110~v2.1.112 통합 대응

> **작성일**: 2026-04-17
> **대상 버전**: bkit **v2.1.8** (v2.1.7 기반)
> **브랜치**: `feat/v218-issue-81-hotfix`
> **분석 방식**: CC Version Analysis (cc-version-researcher + bkit-impact-analyst) + Plan Plus 브레인스토밍
> **베이스 CC 버전**: v2.1.112 (72개 연속 호환, breaking 0건)
> **통합 스코프**: GitHub Issue #81 P0 hotfix + CC v2.1.111~v2.1.112 대응 + Docs=Code 철학 복원 + CC 회귀 4건 방어 갱신
> **선행 문서**:
> - `docs/04-report/features/cc-v2110-v2112-issue81-impact-analysis.report.md` (본 Plan의 분석 근거)

---

## 0. Executive Summary

### 0.1 통합의 배경

사용자 요청: "main에서 v2.1.8 작업 대응할 브랜치 생성해서 /pdca plan cc-v2110-v2112-issue81-response 진행하고 현재 코드베이스를 완벽하게 심층 분석하여 어떻게 개선할지 /pdca design으로 상세하게 작성"

본 Plan은 `cc-v2110-v2112-issue81-impact-analysis` 보고서에서 도출된 **7건 ENH** 중 **v2.1.8 hotfix 범위**(P0 + P1 + P3 필수, 4건) 및 **후속 릴리스 범위**(P1 + P2, 3건)를 구분하여 스케줄링.

### 0.2 통합 스코프 요약

v2.1.8은 **2대 축 + 1 모니터링 축**으로 정의:

1. **Issue #81 P0 hotfix** — `session-context.js` Docs=Code 가드 복원(ENH-238), compaction fingerprint dedup(ENH-239)
2. **선제적 재발 방지** — PersistedOutputGuard 8,000자 하드 캡(ENH-240), `once:true` 기술 부채 주석(ENH-244)
3. **[모니터링] CC v2.1.110 회귀 #48963** — MON-CC-05 신설 (Desktop app plugin skills 미표시, bkit 37 skills 영향 가능)

**v2.1.9+로 연기** (본 Plan에도 명시되나 별도 PR):
- ENH-241 (Docs=Code 교차 검증 스킴 + QA 교정, 2h)
- ENH-243 (#48963 Desktop app 수동 검증, 1.5h)
- ENH-242 (Content Trimmer 예산 할당 시스템, 4h)

**의도적으로 제외** (YAGNI FAIL):
- v2.1.111 `xhigh` effort 지원 — bkit agents/skills `xhigh` 미사용
- v2.1.111 `/less-permission-prompts` 충돌 분석 — CC native skill, bkit permissions 독립
- v2.1.111 `/ultrareview` vs CTO Team 경계 문서화 — 수요 없음
- v2.1.111 `plugin_errors` stream-json init event — ENH-138 번들
- PreCompact 거부(ENH-203 의존) — 현 hotfix 범위 밖

### 0.3 최종 스코어카드

| 축 | 현재 (v2.1.7) | v2.1.8 목표 | Δ |
|---|:---:|:---:|:---:|
| SessionStart additionalContext 바이트 (Enterprise) | ~12,370 | **~500 (opt-out) / ~7,800 (trimmed)** | **-96% / -37%** |
| compaction 재주입 중복 | 2회 (#14281) | **1회 (fingerprint 차단)** | **-50%** |
| Docs=Code 철학 준수 (ENH-226) | 🔴 FAIL | 🟢 **PASS** | 복원 |
| 10K 세션 × 50 turn 토큰 낭비 | ~6.2M | ~0.25M / ~3.9M | **-96% / -37%** |
| 연속 호환 릴리스 | 72 (CC v2.1.112) | 72 유지 | - |
| CC 회귀 버그 방어 레이어 | 4 (MON-CC-01~04) | **5 (MON-CC-05 신설)** | +1 |
| 월간 비용 절감 (추정) | - | **$40~80** | 신규 ROI |

### 0.4 Executive 4-Perspective

| Perspective | v2.1.8 Hotfix 핵심 가치 |
|-------------|----------------------|
| **Technical** | ENH-238 Docs=Code 복원(철학 정합성) + ENH-239 fingerprint dedup + ENH-240 10,000자 cap 선제 대응 |
| **Operational** | 세션당 ~12KB 토큰 낭비 차단, compaction 후 중복 주입 차단, 장기 PDCA 세션 비용 절감 |
| **Strategic** | CC v2.1.111+ 추천 갱신, `<persisted-output>` 공식 메커니즘 이해 + MON-CC-05 신설로 Desktop app 회귀 방어 |
| **Quality** | OWASP A04(Insecure Design) + A08(Software Integrity) 지표 회복, QA 교차 검증 스킴 도입 기반 |

### 0.5 ENH 한 줄 요약 (7건)

**v2.1.8 hotfix 범위 (4건, ~3.25h)**:
- **ENH-238 [P0 🆕]**: `hooks/startup/session-context.js:346` build() 진입부에 `ui.contextInjection.enabled` + `sections[]` 가드 추가 (Docs=Code 위반 수정, 45min)
- **ENH-239 [P0 🆕]**: SessionStart additionalContext SHA-256 fingerprint dedup (`.bkit/runtime/session-ctx-fp.json`, 1.5h)
- **ENH-240 [P1 🆕]**: PersistedOutputGuard 8,000자 하드 캡 + priority-preserved 축약 (`lib/core/context-budget.js` 신규, 1.5h)
- **ENH-244 [P3 🆕]**: `hooks/hooks.json:7` `once:true` 기술 부채 주석 + CC 공식 문서 참조 (30min)

**v2.1.9+ 후속 범위 (3건, ~7.5h)**:
- **ENH-241 [P1 🆕]**: Docs=Code 교차 검증 스킴 + QA 보고서 교정 (ENH-226 status 복원, `docs/05-qa/` 교정, 매트릭스 템플릿, 2h)
- **ENH-243 [P1 🆕]**: #48963 Desktop app 검증 + CLI 권장 README 업데이트 (1.5h)
- **ENH-242 [P2 🆕]**: Content Trimmer — Dashboard 5섹션 vs session-context 9 builders priority-based 예산 할당 (ENH-240 의존, 4h)

**모니터링 1건 (신규)**:
- **MON-CC-05**: [#48963](https://github.com/anthropics/claude-code/issues/48963) v2.1.110 Desktop app plugin skills `/` 메뉴 미표시 — bkit 37 skills 영향 가능 (ENH-243 검증 대상)

---

## 1. 배경 및 문제 정의

### 1.1 Issue #81 요약

[GitHub Issue #81](https://github.com/popup-studio-ai/bkit-claude-code/issues/81) (2026-04-16, scokeepa) 신고:
- `session-start.js` generates ~12,921 bytes `additionalContext`
- CC의 `<persisted-output>` 메커니즘 임계값 초과 → 매 API call마다 system-reminder로 재주입
- compaction 후 `once: true`가 무시되어 두 번째 ~12.7KB 주입 발생

**Issue 제안 수정안**:
- Fix A: `session-context.js` build()가 3개 builder(onboarding/agentTeams/pdcaCoreRules)만 호출
- Fix B: 8시간 TTL `.bkit/runtime/session-start.lock`

### 1.2 분석 결과 핵심 발견

본 Plan의 근거 분석 보고서(`cc-v2110-v2112-issue81-impact-analysis.report.md`)에서 확인된 **4대 발견**:

| 발견 | 상세 | 파급 |
|------|------|------|
| **RC-1 정정** | 임계값은 **2KB가 아닌 10,000 문자** (공식 hooks docs), 메커니즘은 **프리뷰+파일경로 치환** (재주입 아님) | 🟡 본질 유지 (12,370 > 10,000) |
| **RC-2 확증** | `hooks.json:7` `once:true`는 matcher-group 레벨이며 compaction source 방어 불가 + bkit 측 dedup 부재 + `context-compaction.js`가 추가 주입 | 🔴 구조적 결함 |
| **Docs=Code 위반** | ENH-226 `ui.contextInjection.enabled` 가드가 `scripts/user-prompt-handler.js:82`에만 구현, **`hooks/startup/session-context.js`에는 누락** → ENH-226 "완료" 표기 오류, QA 보고서도 누락 | 🔴 **심각** |
| **CC 회귀 #48963** | v2.1.110에서 macOS Desktop app plugin skills 대부분 `/` 메뉴 미표시 (CLI 정상), bkit 37 skills 영향 가능 | 🔴 HIGH 모니터 |

### 1.3 Issue #81 Fix A/B 평가 결론

| 방안 | 평가 |
|------|------|
| Fix A 단독 | ❌ **불충분** — builder 9→3 전환 시 -2,160 bytes 감축, Dashboard 8,500 여전히 잔존 |
| Fix B 단독 | ❌ **부분 해결** — compaction 중복만 차단, 초기 1회 12KB 여전 |
| **ENH-238+239+240 조합** | ✅ **최적** — opt-out 시 -96% / 기본 trimmed 시 -37%, 철학 정합성 복원 |

---

## 2. ENH 상세 (v2.1.8 hotfix 범위)

### 2.1 ENH-238 [P0] — session-context.js Docs=Code 가드 복원

**문제**: `bkit.config.json`에 `ui.contextInjection.enabled: false` 설정해도 SessionStart hook의 12KB 주입이 차단되지 않음. ENH-226 설계 의도와 실구현 불일치.

**해결**:
- `hooks/startup/session-context.js:346` `build()` 함수 진입부에 guard 삽입
- `getUIConfig()` 호출 → `ui.contextInjection.enabled === false` 시 빈 문자열 반환
- `ui.contextInjection.sections[]` 배열 기반 per-section opt-in (기존 `ui.dashboard.sections` 패턴 복제)

**영향 파일**:
- `hooks/startup/session-context.js` (build() 수정)
- `bkit.config.json` (스키마 확장: `sections[]` 배열 선언)
- `scripts/user-prompt-handler.js:82` (일관성 확인, 변경 없음)

**공수**: 45min (실구현 30min + 스모크 테스트 15min)

**TC**:
- TC-B1: `enabled: true`, 모든 섹션 → 기본 출력 확인
- TC-B2: `enabled: false` → 빈 문자열 반환
- TC-B3: `enabled: true`, `sections: ["onboarding"]` → 1개 섹션만
- TC-B4: `enabled: true`, `sections: []` → 빈 문자열

### 2.2 ENH-239 [P0] — Compaction Fingerprint Dedup

**문제**: `hooks.json:7` `once: true`는 matcher-group 레벨이며 CC docs 상 **skills 전용** 가능성. compaction 후 재주입 방어 불가.

**해결**:
- `hooks/session-start.js` 끝부분에 fingerprint 저장:
  - `additionalContext` SHA-256 해시 계산
  - `.bkit/runtime/session-ctx-fp.json` 읽어 session ID + fingerprint 비교
  - 일치 시 빈 `additionalContext` 반환 (dedup)
- 세션 ID는 `process.env.CLAUDE_SESSION_ID` 활용
- try/catch 래핑 + fallback: 파일 손상 시 기존 경로 동작

**영향 파일**:
- `hooks/session-start.js` (response 생성 전 fingerprint 체크)
- `.bkit/runtime/session-ctx-fp.json` (신규 파일 — gitignore)
- `.gitignore` 확인 (이미 `.bkit/runtime/` 전체 제외)

**공수**: 1.5h (실구현 1h + TC 30min)

**TC**:
- TC-B5: 최초 세션 → fingerprint 저장 + 전체 출력
- TC-B6: 동일 세션 재호출 (compaction) → 빈 `additionalContext` 반환
- TC-B7: 파일 손상 → fallback 동작 (정상 출력)

### 2.3 ENH-240 [P1] — PersistedOutputGuard 8,000자 하드 캡

**문제**: CC 공식 `<persisted-output>` 10,000자 cap 초과 시 파일 저장 + 프리뷰 치환. bkit가 이 임계값을 모니터링하지 않아 향후 재발 가능.

**해결**:
- `lib/core/context-budget.js` 신규 모듈 (`applyBudget(context, maxChars, priorityKeys)`)
- `hooks/startup/session-context.js` build() 반환 전 호출:
  - 기본 `maxChars: 8000` (10,000 - 2,000 안전 마진)
  - `priorityKeys: ["MANDATORY", "onboardingData", "Previous Work Detected"]` 우선 보존
  - 초과 시 우선순위 낮은 섹션부터 잘라내기 + 경고 로그
- `bkit.config.json`: `ui.contextInjection.maxChars: 8000`, `priorityPreserve: [...]`

**영향 파일**:
- `lib/core/context-budget.js` (신규 ~80 LOC)
- `hooks/startup/session-context.js` (build() 최종 반환 래핑)
- `bkit.config.json` (스키마 확장)

**공수**: 1.5h (실구현 1h + TC 30min)

**TC**:
- TC-B8: 출력 < 8,000자 → 변경 없음
- TC-B9: 출력 = 8,000자 정확 → 변경 없음
- TC-B10: 출력 > 8,000자 → priority-preserved 축약 + 경고

### 2.4 ENH-244 [P3] — `once: true` 기술 부채 주석

**문제**: `hooks/hooks.json:7` `once: true`가 skills 전용(공식 문서)인지, settings-level hooks에서 동작하는지 불명확. 향후 개발자 혼란 유발.

**해결**:
- `hooks/hooks.json`에 주석 추가 (JSON5 spec 아님 — 별도 설명 파일로 대체)
- **대안**: `docs/context-engineering.md`에 "SessionStart once 한계 + ENH-239 fingerprint 방어 설명" 섹션 추가

**영향 파일**:
- `docs/context-engineering.md` (섹션 추가)

**공수**: 30min

**TC**: N/A (문서 전용)

---

## 3. ENH 상세 (v2.1.9+ 후속 범위)

### 3.1 ENH-241 [P1] — Docs=Code 교차 검증 스킴

**범위**:
- MEMORY.md ENH-226 status "완료 → 재작업 2026-04-17" 복원
- `docs/05-qa/bkit-v216-integrated-enhancement.qa-report.md:188-190` 교정
- `docs/context-engineering.md`에 "설계↔구현↔QA 추적 매트릭스 템플릿" 도입
- `/pdca design` 완료 시 자동 grep 검증 제안 (design.md의 ENH-XXX 참조 vs 실제 구현 파일의 ENH-XXX 주석)

**공수**: 2h

### 3.2 ENH-243 [P1] — #48963 Desktop app 검증

**범위**:
- Claude Desktop app (macOS) 환경에서 bkit 37 skills `/` 메뉴 표시 여부 수동 검증
- 결과에 따라 `README.md`에 "CC v2.1.110+ Desktop app 사용자는 CLI 권장" 명시
- `docs/01-plan/` CC 추천 버전 매트릭스 추가
- MON-CC-05 방어 레이어 활성화

**공수**: 1.5h

### 3.3 ENH-242 [P2] — Content Trimmer

**범위**:
- Dashboard 5섹션 + session-context 9 builders priority-based 예산 할당
- 각 섹션 타입에 기본 바이트 예산 배정 (예: onboarding 500, pdcaCoreRules 300, dashboard 3000)
- 사용자 config로 예산 조정 가능
- ENH-240 확장 (현재 "하드 캡" → "할당 예산 내 자동 축약")

**공수**: 4h

---

## 4. 타임라인 및 의존성

### 4.1 v2.1.8 hotfix 타임라인 (Day 0)

| 시간 | 작업 | ENH | 누적 공수 |
|------|------|-----|----------|
| T+0:00 | 브랜치 생성 (완료) | - | - |
| T+0:00~0:45 | ENH-238 구현 + TC-B1~B4 | ENH-238 | 45min |
| T+0:45~2:15 | ENH-239 구현 + TC-B5~B7 | ENH-239 | 2h |
| T+2:15~3:45 | ENH-240 구현 + TC-B8~B10 | ENH-240 | 3.5h |
| T+3:45~4:15 | ENH-244 문서 추가 + 통합 smoke | ENH-244 | 4h |
| T+4:15~4:45 | PR 생성 + gap 분석 | - | 4.5h |

**총 공수**: ~4.5h (여유 포함, 순수 구현은 3.25h)

### 4.2 의존성 그래프

```
ENH-238 (session-context.js 가드)
    ↓
ENH-240 (build() 최종 반환 래핑) — ENH-238 이후 build() 구조 안정화 필요
    
ENH-239 (session-start.js fingerprint) — 독립
    
ENH-244 (문서) — 독립
```

**병렬 가능**: ENH-239 ↔ ENH-244 (서로 독립)

### 4.3 후속 타임라인 (Week+1)

| 주차 | ENH | 공수 |
|------|-----|------|
| W1 | ENH-241 (Docs=Code 스킴 + QA 교정) + ENH-243 (#48963 검증) | 3.5h |
| W2~W3 | ENH-242 (Content Trimmer) | 4h |

---

## 5. 위험 분석 및 완화책 (Pre-mortem)

| # | 위험 | 확률 | 영향 | 완화책 |
|---|------|------|------|--------|
| R1 | ENH-238 가드 추가 시 Starter 사용자 UX 저하 | LOW | MEDIUM | 기본값 `enabled: true` 유지, opt-out 방식 |
| R2 | ENH-239 fingerprint dedup 오작동 → 세션 초기화 실패 | LOW | HIGH | try/catch 래핑 + fallback (기존 경로 동작), `.bkit/runtime/` 파일 GC 주기 명시 |
| R3 | ENH-240 하드 캡 시 중요 정보 누락 | MEDIUM | MEDIUM | priority-preserved 축약 (MANDATORY/onboarding 우선 보존), 경고 로그로 관측성 |
| R4 | v2.1.8 릴리스 후 CC v2.1.113 회귀 발생 | MEDIUM | MEDIUM | MON-CC-01~05 유지, v2.1.113+ 출시 시 즉시 재분석 |
| R5 | #48963 Desktop app 영향 확인 불가 | MEDIUM | HIGH | CLI 권장 문서 + ENH-243 검증 후 추가 조치 (예: 빌트인 skill 대체 제안) |
| R6 | RC-1 가설 정정으로 인한 Issue #81 reporter와의 커뮤니케이션 오류 | LOW | LOW | PR description에 "공식 메커니즘 정정" + "본질적 문제 유지" 명시 |

---

## 6. 품질 게이트 (M1~M10 매핑)

| 게이트 | 기준 | 검증 방법 |
|--------|------|----------|
| **M1** Plan 완성도 | 모든 ENH priority + 공수 + TC 명시 | 본 문서 ✅ |
| **M2** Design 완성도 | 각 ENH별 구현 상세 + 파일 경로 + 코드 스니펫 | `cc-v2110-v2112-issue81-response.design.md` 작성 |
| **M3** 철학 준수 | Docs=Code 복원 (ENH-238), Automation First (fingerprint auto), No Guessing (공식 문서 근거) | 각 ENH별 주석 |
| **M4** 보안 | OWASP A04/A08 회복 | ENH-239 SHA-256 검증, ENH-238 설계 정합 |
| **M5** 테스트 | 10 TC (L1: 7, L2: 3) 신규 | TC-B1~B10 |
| **M6** 성능 | SessionStart hook +15ms 이내 | fingerprint 계산 벤치 |
| **M7** 호환성 | CC v2.1.111+ 72 consecutive compatible 유지 | breaking 0건 |
| **M8** 문서화 | 본 Plan + Design + Report 3종 완비 | 3 파일 |
| **M9** QA 커버리지 | Match Rate ≥ 95% | gap-detector 실행 |
| **M10** Rollback 준비 | bkit plugin 재설치 경로 검증 | README 업데이트 (ENH-243 번들) |

---

## 7. 롤백 계획

| 시나리오 | 롤백 방법 | 소요 시간 |
|---------|----------|----------|
| ENH-239 fingerprint 파일 손상 | `.bkit/runtime/session-ctx-fp.json` 삭제 → fallback 동작 | 즉시 |
| ENH-240 하드 캡 오탐 | `bkit.config.json` `ui.contextInjection.maxChars: 999999` 설정 | 즉시 |
| ENH-238 가드 오류 | `ui.contextInjection.enabled: true` + `sections[]` 원복 | 즉시 |
| v2.1.8 전면 롤백 | `feat/v218-issue-81-hotfix` 브랜치 병합 revert + v2.1.7 재배포 | 5min |

---

## 8. 이해관계자 및 커뮤니케이션

| 역할 | 참여 | 책임 |
|------|------|------|
| **Issue #81 Reporter** (scokeepa) | Observer | PR comment로 "RC-1 가설 정정" + "본질적 문제 유지" 공지 |
| **Enterprise 사용자** (CTO Team 활성) | Impact HIGH | 최대 수혜자 (-96% 토큰 절감) |
| **Starter 사용자** | Impact LOW | 기본값 `enabled: true` 유지, 영향 미미 |
| **maintainer (kay kim)** | Owner | 구현 + QA + 릴리스 |

---

## 9. 성공 지표 (KPIs)

### 9.1 즉시 측정 (v2.1.8 릴리스 직후)

| KPI | Before (v2.1.7) | After (v2.1.8) 목표 |
|-----|----------------|-------------------|
| 세션당 `additionalContext` 바이트 | ~12,370 | ≤ 8,000 (기본) / ≤ 500 (opt-out) |
| compaction 후 중복 주입 | 2회 | 1회 |
| Docs=Code 위반 (ENH-226) | 🔴 FAIL | 🟢 PASS |
| 신규 TC 커버리지 | - | 10 (B1~B10) |
| Breaking changes | 0 | 0 (유지) |

### 9.2 장기 측정 (30일 후)

| KPI | 목표 |
|-----|------|
| Issue #81 reopen rate | 0% |
| 월간 토큰 비용 절감 | $40~80 (10K 세션 기준) |
| CC v2.1.113+ 호환 | 연속 호환 73+ |
| MON-CC-05 (#48963) 상태 | OPEN 유지 또는 resolved 확인 |

---

## 10. 결론

v2.1.8 hotfix는 **Issue #81 P0 대응**과 **Docs=Code 철학 복원**을 동시에 달성하는 필수 릴리스. ENH 4건(238/239/240/244) 총 ~3.25h 공수로 **세션당 ~96% 토큰 절감** + **철학 정합성 회복** + **선제적 재발 방지**를 확보.

다음 단계: **Design 문서** (`cc-v2110-v2112-issue81-response.design.md`) 작성 후 구현 진입.

---

**Plan 완성도**: M1 ✅
**다음 게이트**: M2 (Design 완성도)
**승인 대기**: Plan 리뷰 후 Design 진입
