---
title: Contract Baseline Rollforward 가이드
audience: bkit 메인테이너, 컨트리뷰터
status: Active
since: v2.1.17
last-updated: 2026-05-20
---

# Contract Baseline Rollforward 가이드

> bkit의 Invocation Contract Check가 사용하는 baseline snapshot을 **언제, 왜, 누가, 어떻게** 갱신할지 정의하는 운영 가이드. 5/12 ~ 5/20 누적 사고를 계기로 v2.1.17에 도입.

---

## 1. Baseline이란?

bkit의 **invocation surface** — Skills, Agents, MCP tools, Hooks, Slash Commands — 을 특정 시점에 정적 JSON으로 캡처한 snapshot입니다. 위치:

```
test/contract/baseline/<version>/
├── _MANIFEST.json
├── skills/<skill-name>.json
├── agents/<agent-name>.json
├── mcp-tools/<server>/<tool-name>.json
├── hook-events.json
└── slash-commands.json
```

CI는 현재 코드 surface와 baseline snapshot을 비교하여:

- **L1 Frontmatter Schema**: name/model/tools 같은 필드의 호환성 유지 검증
- **L4 Deprecation Detection**: baseline에 있던 항목이 사라졌다면 `deprecatedIn` frontmatter로 명시적 무덤화 여부 검증

`.github/workflows/contract-check.yml`이 매 push/PR마다 자동 실행합니다.

---

## 2. Baseline 정책: LTS vs Latest

bkit은 **Dual baseline** 정책을 사용합니다 (v2.1.17~).

| 종류 | 위치 | 용도 | 갱신 빈도 |
|------|------|------|----------|
| **LTS baseline** | `v2.1.9/` | Long-term drift 추적. 메이저 LTS 지정 시에만 이동. | 거의 변경 없음 (메이저 line별 1회) |
| **Latest baseline** | 가장 최근 minor release (예: `v2.1.16/`) | Noise floor — 직전 release 이후 변경 검출. | minor release마다 새로 캡처 |

Workflow는 **두 baseline 모두에 대해 contract test 실행**:

```yaml
- name: L1+L4 vs v2.1.9 LTS baseline (drift detection)
  run: node test/contract/scripts/contract-test-run.js --compare v2.1.9 --level L1,L4

- name: L1+L4 vs v2.1.16 Latest baseline (noise floor)
  run: node test/contract/scripts/contract-test-run.js --compare v2.1.16 --level L1,L4
```

### 2.1 왜 두 개를 운영하는가?

| 시나리오 | LTS만 | Latest만 | Dual ✅ |
|----------|:-:|:-:|:-:|
| v2.1.9 → v2.1.16 사이 누적 drift 추적 | ✅ | ❌ | ✅ |
| 직전 release 대비 회귀 즉시 검출 | ❌ | ✅ | ✅ |
| Deprecation governance 강제 | ✅ | ✅ | ✅ |
| Self-test 전락 방지 | ✅ | ❌ | ✅ |
| Workflow 복잡도 | 낮음 | 낮음 | 약간↑ (step 1개) |

---

## 3. 의사결정 트리

새 minor release를 완료한 직후, 작업자는 다음 결정을 내립니다.

```
┌────────────────────────────────────────────────────────┐
│ Q1: 이번에 invocation surface 변경이 있었는가?         │
│ (skill/agent/MCP tool/hook/slash command 추가·삭제·변경) │
└────────────────────┬───────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        Yes                       No
         │                         │
         ▼                         ▼
┌────────────────────┐   ┌─────────────────────┐
│ Q2: LTS baseline   │   │ Latest baseline 만  │
│ 도 영향 받는가?    │   │ 갱신 (또는 skip)    │
│ (메이저 LTS 변경)  │   │ — 작업자 판단       │
└────────┬───────────┘   └─────────────────────┘
         │
   ┌─────┴─────┐
  Yes         No
   │           │
   ▼           ▼
┌─────────────┐  ┌───────────────────────┐
│ 새 LTS 정책 │  │ Latest baseline만     │
│ ADR 작성 +  │  │ 캡처. LTS는 유지.     │
│ workflow    │  │                       │
│ --compare   │  │ deprecation stub은    │
│ 인자 변경   │  │ 새 Latest baseline에  │
│             │  │ 함께 캡처됨.          │
└─────────────┘  └───────────────────────┘
```

### 3.1 결정 가이드라인

- **Latest baseline 갱신**: minor release (예: v2.1.16 → v2.1.17) 시점에 기본 권장. 그러나 surface 변경 없으면 skip 가능.
- **LTS baseline 갱신**: 매우 보수적. **메이저 LTS 지정 시점에만** (예: v2.1.x → v2.2.0 LTS 전환). ADR 0003 또는 별도 ADR로 결정 기록.
- **Latest baseline의 deprecation stub 처리**:
  - stub은 새 Latest baseline 캡처 시 자동으로 포함됨 (`agents/pdca-eval-*.json`).
  - 향후 stub 제거 시 Latest baseline에서 fail이 다시 발생 — 그때는 **stub 자체에 추가 deprecation 단계** 필요. SOP 4.5 참조.

---

## 4. Baseline 캡처 절차

### 4.1 사전 체크리스트

- [ ] 새 invocation surface 변경 사항이 의도된 것임을 확인
- [ ] `bkit.config.json`의 `version` 필드가 새 release 버전 (예: 2.1.17)
- [ ] 6 stub agent 같은 deprecation tombstone이 작성 완료
- [ ] 로컬에서 `node test/contract/scripts/contract-test-run.js --compare <existing-LTS> --level L1,L4` PASS 확인

### 4.2 캡처 명령

```bash
# vX.X.X 자리에 새 Latest 버전 명시
node test/contract/scripts/contract-baseline-collect.js --version v2.1.17
```

출력 예:

```
[contract] Baseline collected: v2.1.17
  Skills: 44, Agents: 40, MCP: 19, Hooks: 21 events / 24 blocks, Slash: 29
```

### 4.3 git에 추가 (중요)

`.gitignore`의 `test/` 룰이 새 baseline 디렉터리를 자동 ignore합니다. **반드시 `-f` 옵션으로 강제 추가**:

```bash
git add -f test/contract/baseline/v2.1.17/
```

추가 후 `git status` 로 100+ 파일이 staged 상태인지 확인.

### 4.4 git diff visual review

```bash
# manifest 비교 (Skills/Agents count 변화 확인)
diff test/contract/baseline/v2.1.16/_MANIFEST.json test/contract/baseline/v2.1.17/_MANIFEST.json | less
```

기대치 않은 surface 변화가 있다면 **캡처 전에 코드를 점검**하고 baseline은 다시 캡처.

### 4.5 Workflow 업데이트

`.github/workflows/contract-check.yml` 에서:

- Latest baseline step: `--compare v2.1.16` → `--compare v2.1.17` 변경
- LTS step (`--compare v2.1.9`)은 **그대로 유지** (메이저 LTS 변경 시에만 이동)

---

## 5. Deprecation Stub 작성 절차

surface 항목 (agent/skill/MCP tool) 제거 시 **반드시 무덤화** 필요. 다음은 Agent 기준 예시.

### 5.1 Skip 가능 조건

- 해당 항목이 **현재 가장 최근 Latest baseline에도 없음**: 이미 cleanly removed. stub 불필요.
- 해당 항목이 **LTS baseline에만 있음**: stub 필수.

### 5.2 Stub 작성 예시

`agents/<deprecated-agent>.md`:

```yaml
---
name: pdca-eval-act
description: DEPRECATED in v2.1.13. [한 줄 사유]. This stub exists only to satisfy contract baseline vX.X.X deprecation governance (L4).
model: sonnet           # baseline의 model과 일치 필수 (L1-AG model 검사)
effort: medium          # baseline의 effort와 일치 (옵셔널)
tools: []               # baseline.hasTools=true이면 명시 필수
deprecatedIn: v2.1.13   # L4 우회 trigger
deprecatedReason: dead code cleanup — superseded by report-generator
replacedBy: report-generator
deprecationCommit: 967cd8f
---

# pdca-eval-act (DEPRECATED)

[1~2 paragraph 무덤 설명: 언제, 왜, 무엇으로 대체되었는지]
```

### 5.3 필수 frontmatter 필드 (Agent 기준)

| Field | 필수 | 검증 위치 |
|-------|:-:|----------|
| `name` | ✅ | L1-AG name match |
| `description` | ✅ | (검사 안 함, baseline.descriptionLength도 0 가능) |
| `model` | ⚠️ baseline.model이 non-null이면 필수 | L1-AG model match |
| `tools` | ⚠️ baseline.hasTools=true이면 필수 (`tools: []` 가능) | L1-AG tools presence |
| `deprecatedIn` | ✅ | L4 우회 (이 필드만 있으면 통과) |
| `deprecatedReason` | ⚠️ 권장 | governance docs |
| `replacedBy` | ⚠️ 권장 | 마이그레이션 경로 |
| `deprecationCommit` | ⚠️ 권장 | git archeology |

### 5.4 검증

```bash
node test/contract/scripts/contract-test-run.js --compare <baseline-with-deprecated-item> --level L1,L4
```

PASS 확인 후 commit.

### 5.5 Tombstone Removal (장기 stub 정리)

LTS baseline이 메이저 line 변경으로 rollforward되면, 기존 deprecation stub은 더 이상 필요 없을 수 있습니다. 다음 조건 모두 만족 시 stub 자체를 삭제:

- 새 LTS baseline에도 해당 항목이 없음
- Latest baseline에도 해당 항목이 없음 (stub 캡처 후 다음 minor에서 stub 제거 → 새 Latest 캡처)
- 1 메이저 line 이상 stub 상태로 존속

---

## 6. Checklist (PR 전 self-review)

`feature/vX-baseline-rollforward` PR 작성 전:

- [ ] `node test/contract/scripts/contract-test-run.js --compare <LTS> --level L1,L4` PASS
- [ ] `node test/contract/scripts/contract-test-run.js --compare <Latest> --level L1,L4` PASS
- [ ] `node test/contract/integration-runtime.test.js` PASS
- [ ] `node test/contract/l2-smoke.test.js` PASS
- [ ] `node test/contract/l3-mcp-compat.test.js` PASS
- [ ] `node test/contract/l3-mcp-runtime.test.js` PASS
- [ ] `node tests/qa/bkit-full-system.test.js` PASS (agent/skill count drift 없음)
- [ ] `node test/contract/scripts/qa-aggregate.js` 회귀 없음
- [ ] 새 baseline 디렉터리가 `git status`에 staged
- [ ] Workflow yaml의 Latest compare 인자 갱신 (필요 시)
- [ ] CHANGELOG.md에 surface 변경 기록
- [ ] 이 가이드 (`contract-baseline-rollforward.guide.md`)에 사고 사례 추가 (필요 시)

---

## 7. 사고 기록

### 7.1 2026-05-12 ~ 2026-05-20 — 6 Agent removal without deprecation

**원인**: commit `967cd8f` (refactor v2.1.13)에서 `agents/pdca-eval-{act,check,design,do,plan,pm}.md` 6개를 dead code cleanup으로 제거. baseline v2.1.9 manifest는 갱신되지 않음. Agent에 `deprecatedIn` governance가 부재했음.

**영향**: 5/12 이후 8일간 main 브랜치 `Invocation Contract Check` 무조건 red. v2.1.15, v2.1.16 GA가 red 상태로 릴리스.

**조치 (v2.1.17 — 본 PDCA)**:
- contract-test-run.js의 L4 Agents 분기에 Skills와 동일 `deprecatedIn` 우회 추가
- contract-baseline-collect.js의 collect 함수에 `{ persist, baseDir }` 옵션 추가 (read-only 호출 지원)
- 6 stub agent 작성 (deprecation tombstone)
- v2.1.16 Latest baseline 추가 캡처 + workflow dual 비교 도입
- 본 SOP 가이드 신설

**Lesson learned**:
1. Skill에 있던 `deprecatedIn` 메커니즘이 Agent에는 없었음 — surface 비대칭. v2.1.17에서 모든 surface 종류 (Skill/Agent/MCP tool)에 통일 적용.
2. `collect*` 함수가 호출 시마다 baseline에 write하는 부작용. PDCA 진행 중 발견 → `persist: false` 옵션 도입.
3. baseline rollforward 절차가 명문화되지 않아 작업자별 임시 결정. 본 가이드로 정형화.

---

## 8. 관련 문서

- `.github/workflows/contract-check.yml` — 실제 CI gate 정의
- `test/contract/scripts/contract-test-run.js` — runner 구현
- `test/contract/scripts/contract-baseline-collect.js` — collector 구현
- `docs/01-plan/features/v2117-ci-cd-hardening.plan.md` — 본 가이드 도입 PDCA
- `docs/02-design/features/v2117-ci-cd-hardening.design.md` — 설계 상세
- `docs/archive/2026-05/01-plan/features/bkit-v2110-invocation-contract-addendum.plan.md` — 최초 contract framework 도입

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-05-20 | Initial guide (v2.1.17 도입 시점) | kay |
