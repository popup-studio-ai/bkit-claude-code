# CC v2.1.214 → v2.1.215 영향 분석 보고서

- **분석 사이클**: #27
- **분석일**: 2026-07-19
- **범위**: CC v2.1.215 (단일 릴리스, 1 bullet)
- **설치 버전**: 2.1.214 → **latest 2.1.215**
- **dist-tags**: `latest=2.1.215`, `next=2.1.215`, `stable=2.1.205`
- **결론**: **0 Breaking / 0 ENH / 전면 호환** — bkit 조치 불요

---

## 1. Executive Summary

CC v2.1.215는 **단일 bullet의 행동 변경 릴리스**입니다. Claude가 CC 내장 `/verify`
및 `/code-review` 스킬을 **스스로(자율적으로) 실행하지 않도록** 변경되었으며,
이제 사용자가 명시적으로 호출해야 합니다.

이 변경은 **CC 내장 스킬에만 적용**되며 플러그인 스킬(bkit 44종)의 자동 트리거에는
영향이 없습니다. bkit은 CC 내장 `/verify`·`/code-review`에 대한 **프로그래매틱
의존이 0건**(훅·orchestrator·lib 전 범위 grep 확인)이므로 **완전 면역**입니다.

### 4-관점 가치 표

| 관점 | 평가 | 근거 |
|------|------|------|
| **호환성** | ✅ 무영향 | bkit이 CC 내장 스킬 자동실행에 의존하는 코드 경로 0건 |
| **기능 기회** | ➖ 없음 | 신규 API·훅·설정 표면 없음 |
| **DX(간접 수혜)** | 🟢 소폭 개선 | PDCA check/qa 단계에서 CC 내장 리뷰가 무단 개입하던 중복 실행 소멸 → bkit `code-analyzer`/`gap-detector` 경로가 단독 수행 |
| **리스크** | 🟡 문서 정확도(경미) | 사내 문서가 `/code-review`를 bkit 스킬로 표기 (네임스페이스 미표기, **선재 이슈**) |

---

## 2. Phase 1: CC 변경사항 조사

### v2.1.215 전문 (verbatim)

```
## 2.1.215

- Claude no longer runs the `/verify` and `/code-review` skills on its own;
  invoke them with `/verify` or `/code-review` when you want them
```

| 분류 | 건수 |
|------|------|
| Breaking | 0 |
| Feature (Added) | 0 |
| Fix | 0 |
| **Behavior change** | **1** |
| **총 bullets** | **1** |

> CHANGELOG에 Added/Fixed 등 하위 헤딩 없음 — 평문 bullet 1건 구조.

---

## 3. Phase 1.5: Raw Source Verification Gate

메모리 교훈에 따라 model-WebFetch를 배제하고 **raw 바이트 직행**으로 확정했습니다.

| Field | Agent reported | Raw verified | Source | Verdict |
|-------|---------------|--------------|--------|---------|
| Added | — | 0 | raw CHANGELOG | match |
| Fixed | — | 0 | raw CHANGELOG | match |
| Improved | — | 0 | raw CHANGELOG | match |
| Breaking | — | 0 | raw CHANGELOG | match |
| **Total bullets** | 1 | **1** | raw CHANGELOG + release tag | **match** |

**교차 검증 소스 (2종, 완전 일치)**
1. `curl raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md`
   → 헤더 grep(`3:## 2.1.215`) + 행범위 sed → bullet 1건
2. `gh api repos/anthropics/claude-code/releases/tags/v2.1.215`
   → published_at `2026-07-19T02:56:01Z`, body 문구 바이트 일치

**Spot-check**: bullet 총 1건이므로 전량(100%) verbatim 대조 완료. **errata 0건**.

---

## 4. Phase 2: bkit 영향 분석

### 4.1 아키텍처 실측 (Bash 직접 측정)

| 항목 | 실측 | 메모리 기록 | 판정 |
|------|------|------------|------|
| Agents | 34 | 34 | 일치 |
| Skills | 44 | 44 | 일치 |
| Hook events | 22 | 22 | 일치 |

> 수치 보정 불요 (Numeric Correction Protocol 통과).

### 4.2 컴포넌트 매핑

| CC 변경 | bkit 컴포넌트 | 영향 | 판정 |
|---------|--------------|------|------|
| CC 내장 `/verify` 자율실행 중단 | PDCA check/qa 단계 | 없음 | **면역** — bkit은 `gap-detector` + `qa-*` 에이전트 체인 사용, CC 내장 `/verify` 미사용 |
| CC 내장 `/code-review` 자율실행 중단 | `skills/code-review/` (bkit 자체 스킬) | 없음 | **면역** — 별도 스킬(`bkit:code-review`), `agent: bkit:code-analyzer`로 자체 완결 |
| 동일 | `lib/orchestrator/skill-invocation-effects.js:124` | 없음 | code-review는 "untouched single-purpose skill"로 이미 분류됨 |
| 동일 | `hooks/`, `lib/` 전역 | 없음 | CC 내장 스킬을 호출하는 코드 경로 **0건** (grep 확인) |

### 4.3 파일 영향 매트릭스

| 파일 | 변경 필요 | 사유 |
|------|----------|------|
| — | **0건** | 수정 대상 없음 |

### 4.4 테스트 영향

- 신규/수정 TC **0건**. 기존 회귀 스위트 영향 없음.

### 4.5 철학 준수

해당 없음 (구현 항목 0건).

---

## 5. Phase 3: 브레인스토밍 & YAGNI

### 5.1 의도 탐색
- **최대 가치**: 없음. 신규 표면이 없어 bkit이 활성화할 native 기능 부재.
- **놓치면 안 되는 변경**: 없음. 0 breaking.
- **workaround 대체 기회**: 없음.

### 5.2 대안 탐색
후보 개선안 1건이 도출되었으나 아래에서 YAGNI 탈락 및 선재 이슈로 재분류.

**후보 (탈락)**: 문서 내 `/code-review` 표기를 `/bkit:code-review`로 네임스페이스 명시
- **탈락 사유**: (a) v2.1.215가 유발한 문제가 **아님** — CC 내장 스킬과의 이름 겹침은
  215 이전부터 존재하는 **선재 이슈**이며, 215는 *자율 실행*만 껐을 뿐 `/code-review`
  **명령 해석(resolution)은 변경하지 않음**. (b) 이미 이슈 #125(네임스페이스 스킬명)
  트랙에서 관리 중.
- **처리**: 신규 ENH 미발행, **MF-3(경미 발견)** 으로 모니터 등록.

### 5.3 YAGNI 검토 결과
- 통과 ENH: **0건**
- **신규 ENH 발행 없음 → 27사이클 연속 0-ENH**

### 5.4 우선순위 배정
| ID | 항목 | 우선순위 |
|----|------|---------|
| — | 없음 | — |

---

## 6. 모니터 상태 갱신

| 모니터 | 이전 | 현재 | 비고 |
|--------|------|------|------|
| **MF-2** (`lib/infra/cc-version-checker.js:42` `RECOMMENDED_VERSION='2.1.198'`) | OPEN, 16-release stale | **OPEN, 17-release stale** | **2.1.215 bump 권장** (maintainer 결정 사항, 미구현) |
| MF-3 (신규, LOW) | — | OPEN | 문서상 `/code-review` 네임스페이스 미표기 (`skills/bkit/SKILL.md:55`, `hooks/startup/session-context.js:574`) — 선재 이슈, #125 트랙 |
| BG-OTEL-DROP (#64436) | OPEN 격상 | OPEN 유지 | 215에 관련 bullet 없음 |
| PLUGIN-HOOK-DROP (#57317) | ACTIVE | ACTIVE 유지 | 변동 없음 |
| CHOICE-LOOP (#64447) | DUP-TRACKED | 유지 | 변동 없음 |
| STOP-SCHEMA-STRICT (ENH-366) | RESOLVED | 유지 | 214-b 선반영 재확증 상태 유지 |
| 차별화 streak (#56293·#57317·#58904) | intact | **intact (+1 릴리스 연장)** | 215에 code-fix bullet 없음 |

**버전 상수 현황**: `MIN='2.1.78'`, `RECOMMENDED='2.1.198'`(stale), `FABLE_MODEL_FLOOR='2.1.170'`

---

## 7. 누적 지표

| 지표 | 값 |
|------|-----|
| 누적 연속 호환 릴리스 | **158** (v2.1.34 ~ v2.1.215) |
| 신규 ENH 0건 연속 사이클 | **27** |
| 전역 마지막 ENH | ENH-366 (ENH-367 예약, 미소비) |
| CC-cycle 마지막 ENH | ENH-328 (미소비) |
| 권장 CC 버전 | **v2.1.215** 허용/권장 |

---

## 8. 품질 체크리스트

- [x] 범위 내 CC 변경 전량 포착 (1/1)
- [x] 모든 변경에 영향 등급 부여
- [x] ENH 우선순위 부여 (0건)
- [x] 철학 준수 검증 (해당 없음)
- [x] 파일 영향 매트릭스 완결 (0건)
- [x] 테스트 영향 평가 (0건)
- [x] 한국어 작성
- [x] Raw 검증 게이트 통과 (2 소스, errata 0)
- [x] §3 Verification 표 포함
- [x] MEMORY 갱신
