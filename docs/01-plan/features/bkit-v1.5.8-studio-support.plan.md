# Plan-Plus: bkit v1.5.8 Studio Support

> **Feature**: bkit-v1.5.8-studio-support
> **Created**: 2026-03-01
> **Methodology**: Plan-Plus (Intent -> Alternatives -> YAGNI -> Plan)
> **Status**: Draft
> **Author**: Plan-Plus Compiler (bkit v1.5.8 CTO Team)
> **Input**: 9개 리서치/브레인스톰/리뷰 문서 종합
> **Previous Version**: v1.5.7 (27 Skills, 16 Agents, 10 Hooks, 180 Exports)

---

## 1. Intent Discovery (의도 파악)

### 1.1 사용자 원래 요구사항

bkit v1.5.8에서 Studio 연동을 위한 기반을 마련하고, 분산된 상태 파일을 `.bkit/` 디렉토리로 통합하며, 커스터마이제이션 기초를 도입한다.

핵심 요청 3가지:
1. **상태 파일 통합**: `docs/` 에 분산된 상태 파일을 `.bkit/`로 중앙화
2. **경로 중앙화**: 11+ 곳에 하드코딩된 경로를 단일 Path Registry로 관리
3. **커스터마이제이션 기초**: `customization.mode` 등 사용자 경험 제어 필드 도입

### 1.2 핵심 의도 분석

| 측면 | 분석 |
|------|------|
| **What** | `.bkit/` 디렉토리 통합 + Path Registry + 커스터마이제이션 기초 |
| **Why** | Studio IPC 대비, 코드 유지보수성 향상, 사용자 경험 분화 기반 |
| **Who** | bkit 개발자 (P1: 팀 리드), bkit 사용자 (P2: 팀원), 미래 Studio 사용자 |
| **When** | v1.5.8 릴리스 (v1.5.7 직후, 3-4일 MVP) |
| **Risk** | CC 이슈 #29548/#29547 영향, git history 변경, 기존 설치 환경 호환 |

### 1.3 성공 기준

| # | 기준 | 측정 방법 |
|---|------|----------|
| SC-1 | 모든 상태 파일이 `.bkit/`에 위치 | 파일 존재 확인 |
| SC-2 | 하드코딩 경로 0개 (Path Registry 경유율 100%) | grep으로 잔여 하드코딩 검색 |
| SC-3 | 기존 설치 환경에서 auto-migration 성공 | SessionStart 테스트 |
| SC-4 | `.bkit/` 전체 gitignore 정상 작동 | `git status`에서 .bkit/ 파일 미표시 확인 |
| SC-5 | 기존 754+ TC 회귀 0건 | Comprehensive Test 실행 |
| SC-6 | `customization.mode` 필드 작동 (선택적) | SessionStart 분기 테스트 |

---

## 2. Research Summary (리서치 요약)

### 2.1 CC Context Engineering 현황 (8대 Surface)

Claude Code v2.1.63 기준 **8개 Context Engineering Surface가 모두 Stable API**에 도달:

| Surface | 안정성 | bkit 활용도 |
|---------|--------|------------|
| Skills (SKILL.md) | Stable (v2.1.45+) | 27개 (22 + 5 bkend) |
| Agents (.md) | Stable (v2.1.49+) | 16개 |
| Hooks (17 events) | Stable (v2.1.38+) | 10/17 events |
| Commands (Legacy) | Skills로 통합 | 마이그레이션 완료 |
| Auto-Memory | Stable (v2.1.59+) | bkit JSON과 분리, 충돌 0% |
| CLAUDE.md | Stable (v1.0+) | Active |
| Rules (.claude/rules/) | Stable | 미사용 (v1.6.x 검토) |
| Config (settings.json) | Stable (v2.1.38+) | 읽기 전용 참조 |

**핵심 인사이트**: CC는 **filesystem-based + convention over configuration** 원칙. 모든 커스터마이징은 파일 배치로 해결. bkit은 이 위에 **워크플로우 오케스트레이션**을 제공하는 포지셔닝.

### 2.2 Anthropic 미래 방향

Anthropic은 **인프라 프리미티브**에 집중 투자하고, **워크플로우 오케스트레이션**은 플러그인/사용자에게 위임:

- **Plugin Marketplace**: Git 기반 분산 배포, 사설 Enterprise 마켓플레이스
- **Agent Skills Open Standard**: 크로스 플랫폼 호환, 270,000+ 스킬 에코시스템
- **Enterprise Controls**: Managed settings, macOS plist/Windows Registry, BYOK (H1 2026)
- **$2.5B ARR**: Claude Code 급성장, GitHub 공개 커밋 4% 차지

**bkit 포지셔닝**: CC가 인프라를 제공하면, bkit은 그 위에 PDCA 워크플로우 + 의도 분류 + 한국어 우선 + CTO Team 패턴 오케스트레이션 제공. CC가 bkit 기능을 대체할 가능성은 매우 낮음 (opinionated workflow는 플랫폼이 제공하지 않음).

### 2.3 현재 bkit 코드베이스 상태

| 지표 | 값 | 비고 |
|------|-----|------|
| 상태 파일 수 | 5개 | 3곳에 분산 (docs/, .bkit/, root) |
| 가장 많이 참조되는 파일 | `docs/.pdca-status.json` | 16+ readers, 5 writers |
| 하드코딩 경로 수 | 11+ | 3곳 독립 path 구성 |
| dormant config key | `pdca.statusFile` | 존재하지만 코드에서 미사용 |
| 이동 불가 파일 | 3개 | plugin.json, hooks.json, bkit.config.json |
| `.bkit/`에 이미 위치 | 1개 | agent-state.json |
| common.js exports | 180개 | 브릿지 패턴 |

**경로 중앙화 현황**:
- `getPdcaStatusPath()`: 12+ 참조가 1곳을 경유하지만, 3개의 독립적 `path.join`이 별도 존재
- `getMemoryFilePath()`: 2개 모듈에서 독립적 경로 구성
- `getAgentStatePath()`: 1곳에서 중앙 관리 (모범 사례)

---

## 3. Alternatives Explored (대안 탐색)

### 3.1 .bkit/ 디렉토리 구조 (4개 옵션 비교 → Option B 채택)

| Criteria | Weight | A: Flat | **B: Category (채택)** | C: Domain | D: Hybrid |
|----------|-------:|--------:|----------------------:|----------:|----------:|
| 구현 단순성 | 20% | 9 | 6 | 6 | **10** |
| Studio IPC 가독성 | 25% | 8 | **9** | 7 | 8 |
| Studio 감사 로그 확장성 | 20% | 4 | **10** | 6 | 5 |
| Migration 복잡도 (낮을수록 좋음) | 15% | 8 | 6 | 5 | **9** |
| 미래 확장성 | 15% | 5 | **9** | 7 | 7 |
| Git 관리 명확성 | 5% | 5 | **9** | 6 | 7 |
| **가중 합계** | 100% | 6.45 | **8.25** | 6.20 | 7.55 |

**채택: Option B (Category-Based)** — Studio 감사 로그 확장성 반영

채택 근거:
1. **Studio 감사 로그 대비**: `state/`, `runtime/`, `audit/`(v1.6.x) 카테고리별 분리로 Studio가 디렉토리 단위로 watch/read 가능
2. **보존 정책 용이**: 디렉토리 단위로 retention 정책 적용 (audit=90일, snapshots=7일 등)
3. **`.bkit/` 전체 gitignore**: 모든 상태 파일을 gitignore 처리하여 git 노이즈 제거
4. **디렉토리 구조는 변경 비용이 높음**: 이미 마이그레이션하는 시점에 올바른 구조를 선택하는 것이 추후 flat→categorized 재마이그레이션보다 합리적

**탈락:**
- Option D (Hybrid Flat): 초기에는 단순하지만, Studio 감사 로그 추가 시 파일 혼재 문제 발생
- Option C (Domain-Based): 도메인 경계가 유동적, cross-domain 파일(memory.json) 배치 모호
- Option A (Flat): 확장성 부족, 파일 수 증가 시 관리 어려움

**v1.5.8 디렉토리 구조:**
```
.bkit/                          # 전체 gitignored
├── state/                      # 영속 상태 (PDCA 상태, 메모리)
│   ├── memory.json             # [MIGRATE] docs/.bkit-memory.json
│   └── pdca-status.json        # [MIGRATE] docs/.pdca-status.json
├── runtime/                    # 런타임 상태 (에이전트, 세션)
│   └── agent-state.json        # [MIGRATE] .bkit/agent-state.json
└── snapshots/                  # 백업 (compaction snapshots)
    └── (auto-generated)        # [MIGRATE] docs/.pdca-snapshots/
```

**v1.6.x 확장 예시 (Studio 감사 로그):**
```
.bkit/
├── state/
├── runtime/
├── audit/                      # [FUTURE] Studio 감사 로그
│   ├── activity-{date}.jsonl   # 인간+AI 작업 이력
│   └── agent-actions-{date}.jsonl  # AI 작업 감사 로그
└── snapshots/
```

### 3.2 커스터마이제이션 패턴 (5개 패턴 비교)

| 평가 항목 | A: Config Merge | B: Registry | C: Plugin-of-Plugin | D: Template | **E: Hybrid Layered** |
|-----------|:-:|:-:|:-:|:-:|:-:|
| 구현 복잡도 | LOW (2-3일) | HIGH (7-10일) | MEDIUM (4-6일) | VERY LOW (1-2일) | **LOW-MEDIUM (3-4일)** |
| CC 호환성 | HIGH | MEDIUM | HIGH | HIGH | **VERY HIGH** |
| CC 업데이트 강건성 | HIGH | LOW | MEDIUM | HIGH | **VERY HIGH** |
| 이중 관리 리스크 | LOW | HIGH | LOW | NONE | **VERY LOW** |

**채택: 패턴 E (Hybrid Layered)** -- 단, v1.5.8에는 `extends` 필드만 구현 (YAGNI)
- CC 네이티브 발견 메커니즘 최대 활용
- Config merge만 구현하면 핵심 기능 제공 가능
- CC가 컴포넌트 발견/로딩/실행을 처리, bkit은 설정 + 제어만 담당

**탈락:**
- 패턴 B (Registry): 7-10일 구현, CC 업데이트마다 동기화 부담
- 패턴 C (Plugin-of-Plugin): CC가 extension override 미지원
- 패턴 D (Template): v1.6.x에서 보조 패턴으로 재검토

### 3.3 DX 접근 방식 (개발자/비개발자)

| 제안 항목 | v1.5.8 판정 | 근거 |
|-----------|------------|------|
| `customization.mode` (guide/expert/auto) | **SHOULD** | 1개 필드 + SessionStart 분기, 비용 낮고 UX 효과 큼 |
| `customization.role` (pm/designer/qa/lead) | COULD (v1.6.x) | 비개발자 사용자가 거의 없음, 수요 발생 시 추가 |
| 신규 스킬 5개 (/bkit-config, /bkit-init 등) | COULD (v1.6.x) | 기존 스킬로 충분, CC 네이티브 메커니즘 활용 |
| costProfile 프리셋 | COULD (v1.6.x) | 에이전트 모델 변경은 frontmatter 직접 수정으로 가능 |
| Template 라이브러리 7종 | WONT | 검증된 수요 없음 |

---

## 4. YAGNI Assessment (불필요한 것 제거)

> YAGNI 리뷰어의 판정을 존중하여, 전체 42개 제안 중 **60%를 v1.5.8에서 제외**.

### 4.1 삭제 항목 (WONT) -- 7개

| # | 항목 | 삭제 이유 |
|---|------|----------|
| 1 | `.bkit/session.json` (신규) | 3곳에 이미 세션 정보 존재 (`_sessionContext`, `lastSession`, `session`). 중복 상태 파일 |
| 2 | `.bkit/.lock` (신규) | Studio IPC 미개발. 현재 atomic write(tmp+rename)로 충분 |
| 3 | `.bkit/meta.json` (신규) | 각 파일에 `version` 필드 존재. 디렉토리 수준 메타 불필요 |
| 4 | `hook-log.json` (신규) | `debugLog()`로 충분. 문서 저자도 YAGNI 판정 |
| 5 | 4-Layer Config Merge 전체 구현 | org-level 사용자 0명. 수요 없는 기능 |
| 6 | Registry 패턴 | 7-10일 구현, CC 업데이트마다 동기화 부담 |
| 7 | Template 7종 + 가이드 문서 21개 | 검증된 수요 없음. 기능 확정 전 문서 작성은 낭비 |

### 4.2 미루기 항목 (COULD -> v1.6.x) -- 8개

| # | 항목 | 미루기 이유 | 수요 조건 |
|---|------|-----------|----------|
| 1 | `customization.role` (pm/designer/qa/lead) | 비개발자 사용자 거의 없음 | 비개발자 사용자 확보 후 |
| 2 | `/bkit-config` 스킬 | bkit.config.json 직접 편집으로 충분 | 설정 복잡도 증가 시 |
| 3 | `/bkit-init` 스킬 + 템플릿 | 현재 plugin 설치만으로 바로 사용 가능 | 조직 배포 수요 확인 후 |
| 4 | `costProfile` 프리셋 | frontmatter 직접 수정으로 가능 | 비용 최적화 수요 검증 후 |
| 5 | Config schema validation | config 오류 버그 보고 0건 | 설정 필드 증가 시 |
| 6 | 에이전트 override 자동 동기화 | `.claude/agents/` 직접 수정으로 가능 | 오버라이드 수요 증가 시 |
| 7 | `.bkit/local.config.json` (개인 설정) | CC `settings.local.json`이 동일 역할 | 이중 관리 리스크 해소 후 |
| 8 | 에이전트 메모리 활성화 (5개) | frontmatter 1줄이지만 효과 검증 필요 | 메모리 축적 효과 검증 후 |

### 4.3 최종 MVP 스코프

```
v1.5.8 MVP = MUST 4개 + SHOULD 3개
═════════════════════════════════════

MUST (필수, 4개):
  [M1] lib/core/paths.js 생성 (Path Registry)
  [M2] 상태 파일 3개 .bkit/{state,runtime,snapshots}/ 이동 (Option B)
  [M3] .bkit/ 전체 gitignore 유지 (상태 파일 git 추적 제거)
  [M4] bkit.config.json version bump + statusFile 업데이트

SHOULD (권장, 3개):
  [S1] SessionStart auto-migration 로직
  [S2] common.js bridge 업데이트 (paths 모듈 re-export)
  [S3] customization.mode 필드 (guide/expert) -- 여유 시

NOT in v1.5.8:
  - 신규 스킬 0개
  - 신규 상태 파일 0개 (session.json, .lock, meta.json 전부 제외)
  - 4-Layer config merge 전체 구현
  - role 시스템, costProfile, Template 라이브러리
  - 에이전트 override, Config schema validation
  - 커스터마이징 가이드 문서
```

---

## 5. Final Plan (최종 계획)

### 5.1 Objective (목표)

bkit v1.5.8에서 분산된 상태 파일을 `.bkit/` 디렉토리로 통합하고, 중앙화된 Path Registry를 도입하여 코드 유지보수성을 향상시킨다. 부차적으로 `customization.mode` 필드를 추가하여 사용자 경험 분화의 기초를 마련한다.

### 5.2 Scope (범위)

#### 5.2.1 In Scope (v1.5.8)

| # | 항목 | 유형 | 파일 수 |
|---|------|------|--------:|
| M1 | `lib/core/paths.js` 생성 (Path Registry) | 신규 모듈 | 1 |
| M2-a | `docs/.pdca-status.json` -> `.bkit/state/pdca-status.json` 이동 | 경로 변경 | 3 |
| M2-b | `docs/.bkit-memory.json` -> `.bkit/state/memory.json` 이동 | 경로 변경 | 3 |
| M2-c | `docs/.pdca-snapshots/` -> `.bkit/snapshots/` 이동 | 경로 변경 | 1 |
| M2-d | `.bkit/agent-state.json` -> `.bkit/runtime/agent-state.json` 이동 | 경로 변경 | 1 |
| M3 | `.bkit/` 전체 gitignore 유지 (기존 blanket ignore 유지) | 설정 확인 | 0 |
| M4 | `bkit.config.json` version + statusFile 업데이트 | 설정 변경 | 1 |
| S1 | SessionStart auto-migration 로직 | 기능 추가 | 1 |
| S2 | `lib/common.js` bridge 업데이트 | 브릿지 확장 | 1 |
| S3 | `customization.mode` 필드 (guide/expert) | 기능 추가 | 2-3 |
| -- | Comprehensive Test | 검증 | - |

#### 5.2.2 Out of Scope (v1.6.x 이후)

- 신규 스킬: /bkit-config, /bkit-init, /bkit-help, /bkit-new-skill, /bkit-new-agent (5개 전부)
- 신규 상태 파일: session.json, .lock, meta.json, hook-log.json (4개 전부)
- 4-Layer config merge 전체 구현 (org/local config)
- `customization.role` 시스템 (pm/designer/qa/lead)
- `costProfile` 프리셋 (quality/balanced/economy)
- Template 라이브러리 (7종)
- 에이전트 override 자동 동기화
- Config schema validation
- Rules 시스템 도입 (.claude/rules/)
- 커스터마이징 가이드 문서 (21개)

### 5.3 구현 계획

#### Phase 1: Path Registry 생성 (`lib/core/paths.js`)

**목표**: 11+ 하드코딩 경로를 1곳에 중앙화

**신규 파일**: `lib/core/paths.js`

```javascript
// STATE_PATHS: .bkit/ 내 상태 파일 경로 (Option B: Category-Based)
const STATE_PATHS = {
  root:       () => path.join(PROJECT_DIR, '.bkit'),
  state:      () => path.join(PROJECT_DIR, '.bkit', 'state'),
  runtime:    () => path.join(PROJECT_DIR, '.bkit', 'runtime'),
  snapshots:  () => path.join(PROJECT_DIR, '.bkit', 'snapshots'),
  pdcaStatus: () => path.join(PROJECT_DIR, '.bkit', 'state', 'pdca-status.json'),
  memory:     () => path.join(PROJECT_DIR, '.bkit', 'state', 'memory.json'),
  agentState: () => path.join(PROJECT_DIR, '.bkit', 'runtime', 'agent-state.json'),
};

// LEGACY_PATHS: 마이그레이션용 구 경로
const LEGACY_PATHS = {
  pdcaStatus: () => path.join(PROJECT_DIR, 'docs', '.pdca-status.json'),
  memory:     () => path.join(PROJECT_DIR, 'docs', '.bkit-memory.json'),
  snapshots:  () => path.join(PROJECT_DIR, 'docs', '.pdca-snapshots'),
};

// CONFIG_PATHS: 이동 불가 설정 파일
const CONFIG_PATHS = {
  bkitConfig:  () => path.join(PROJECT_DIR, 'bkit.config.json'),
  pluginJson:  () => path.join(PLUGIN_ROOT, '.claude-plugin', 'plugin.json'),
  hooksJson:   () => path.join(PLUGIN_ROOT, 'hooks', 'hooks.json'),
};

// 유틸리티 함수
function ensureBkitDir() { ... }
function migrateStatFiles() { ... }  // -> { migrated: [], errors: [] }
```

**변경 파일**: 1개 (신규)
**행위 변경**: 없음 (이 단계에서는 경로 정의만)

---

#### Phase 2: .bkit/ 디렉토리 생성 + 파일 이동

**목표**: 분산된 상태 파일을 `.bkit/`로 이동

**이동 대상**:

| 현재 경로 | 신규 경로 | 변경 파일 수 | Git 추적 |
|----------|----------|:-----------:|:-------:|
| `docs/.pdca-status.json` | `.bkit/state/pdca-status.json` | 3 | No |
| `docs/.bkit-memory.json` | `.bkit/state/memory.json` | 3 | No |
| `docs/.pdca-snapshots/` | `.bkit/snapshots/` | 1 | No |
| `.bkit/agent-state.json` | `.bkit/runtime/agent-state.json` | 1 | No |

**파일별 변경 상세**:

**`docs/.pdca-status.json` → `.bkit/state/pdca-status.json` 이동 (3 파일 변경)**:

| 파일 | 라인 | 변경 내용 |
|------|------|----------|
| `lib/pdca/status.js:33` | `getPdcaStatusPath()` | `STATE_PATHS.pdcaStatus()` 사용 -- **16+ consumers 자동 적용** |
| `hooks/session-start.js:334` | `detectPdcaPhase()` | `process.cwd()` -> `getPdcaStatusPath()` 사용 |
| `lib/task/tracker.js:199` | `findPdcaStatus()` | 독립 path.join -> `getPdcaStatusPath()` 사용 |

**`docs/.bkit-memory.json` → `.bkit/state/memory.json` 이동 (3 파일 변경)**:

| 파일 | 라인 | 변경 내용 |
|------|------|----------|
| `lib/memory-store.js:28` | `getMemoryFilePath()` | `STATE_PATHS.memory()` 사용 |
| `lib/pdca/status.js:705,724` | `readBkitMemory()`, `writeBkitMemory()` | `STATE_PATHS.memory()` 사용 |
| `hooks/session-start.js:609` | 컨텍스트 문자열 | 경로 문자열 업데이트 |

**`docs/.pdca-snapshots/` → `.bkit/snapshots/` 이동 (1 파일 변경)**:

| 파일 | 라인 | 변경 내용 |
|------|------|----------|
| `scripts/context-compaction.js:46` | `snapshotDir` | `STATE_PATHS.snapshots()` 사용 |

**`.bkit/agent-state.json` → `.bkit/runtime/agent-state.json` 이동 (1 파일 변경)**:

| 파일 | 라인 | 변경 내용 |
|------|------|----------|
| `lib/team/state-writer.js:72` | `getAgentStatePath()` | `STATE_PATHS.agentState()` 사용 (경로 변경 + 중앙화) |

**총 변경**: 8개 파일, 대부분 1줄 path 변경

---

#### Phase 3: Auto-migration + .gitignore 확인

**목표**: 기존 설치 환경에서 자동 마이그레이션 + `.bkit/` 전체 gitignore 유지 확인

**3-1. SessionStart auto-migration** (`hooks/session-start.js`에 추가):

```javascript
function migrateToNewBkitDir() {
  const { STATE_PATHS, LEGACY_PATHS, ensureBkitDir } = require('../lib/core/paths');
  ensureBkitDir();  // .bkit/, .bkit/state/, .bkit/runtime/, .bkit/snapshots/ 생성

  // memory.json 마이그레이션 (docs/.bkit-memory.json → .bkit/state/memory.json)
  const legacyMemory = LEGACY_PATHS.memory();
  const newMemory = STATE_PATHS.memory();
  if (fs.existsSync(legacyMemory) && !fs.existsSync(newMemory)) {
    fs.renameSync(legacyMemory, newMemory);  // atomic on same filesystem
  }

  // pdca-status.json 마이그레이션 (docs/.pdca-status.json → .bkit/state/pdca-status.json)
  const legacyStatus = LEGACY_PATHS.pdcaStatus();
  const newStatus = STATE_PATHS.pdcaStatus();
  if (fs.existsSync(legacyStatus) && !fs.existsSync(newStatus)) {
    fs.renameSync(legacyStatus, newStatus);
  }

  // snapshots 디렉토리 마이그레이션 (docs/.pdca-snapshots/ → .bkit/snapshots/)
  const legacySnaps = LEGACY_PATHS.snapshots();
  const newSnaps = STATE_PATHS.snapshots();
  if (fs.existsSync(legacySnaps) && !fs.existsSync(newSnaps)) {
    fs.renameSync(legacySnaps, newSnaps);
  }

  // agent-state.json 마이그레이션 (.bkit/agent-state.json → .bkit/runtime/agent-state.json)
  const legacyAgent = path.join(STATE_PATHS.root(), 'agent-state.json');
  const newAgent = STATE_PATHS.agentState();
  if (fs.existsSync(legacyAgent) && !fs.existsSync(newAgent)) {
    fs.renameSync(legacyAgent, newAgent);
  }
}
```

**마이그레이션 전략**:
- v1.5.8: 구 경로에서 신 경로로 `fs.renameSync` (같은 파일시스템, atomic)
- v1.5.8: 실패 시 `fs.copyFileSync` + `fs.unlinkSync` fallback
- v1.5.8: 구 파일은 이동 후 삭제 (deprecation period 없이 즉시 전환)
- v1.6.0: `LEGACY_PATHS` 상수 및 마이그레이션 코드 제거

**3-2. `.gitignore` 확인 (변경 없음)**:

기존 root `.gitignore`에 `.bkit/` blanket ignore가 이미 존재하므로 **변경 불필요**:

```gitignore
# bkit runtime state (전체 gitignore 유지)
.bkit/
```

모든 상태 파일(state/, runtime/, snapshots/)이 `.bkit/` 하위에 위치하므로 자동으로 git 추적에서 제외된다. 별도의 `.bkit/.gitignore` 생성도 불필요.

---

#### Phase 4: customization.mode 필드 추가 (선택적)

**목표**: 사용자 경험 분화의 기초 마련

**bkit.config.json 변경**:

```json
{
  "version": "1.5.8",
  "customization": {
    "mode": "auto"
  }
}
```

| 모드 | 대상 | 동작 |
|------|------|------|
| `guide` | 초보자, 비개발자 | 상세 안내 (15-20줄), 단계별 설명, 선택지 제시 |
| `expert` | 숙련 개발자 | 최소 안내 (3-5줄), 즉시 실행, 자동화 우선 |
| `auto` (기본값) | 모든 사용자 | 의도 분류 결과에 따라 동적 전환 |

**구현**:
- `hooks/session-start.js`: 모드 확인 -> 안내문 분기
- `guide` -> 출력 스타일 `bkit-learning` 자동 적용
- `expert` -> 출력 스타일 `bkit-pdca-guide` 자동 적용
- `auto` -> 기존 레벨 기반 자동 선택 (변경 없음)

**변경 파일**: 2-3개 (`bkit.config.json`, `hooks/session-start.js`, 선택적으로 `lib/core/config.js`)

---

### 5.4 파일 변경 목록 (전체)

| # | 파일 | 변경 유형 | Phase |
|---|------|----------|:-----:|
| 1 | `lib/core/paths.js` | **신규** (Path Registry + ensureBkitDir) | 1 |
| 2 | `lib/pdca/status.js` | 수정 (getPdcaStatusPath + readBkitMemory/writeBkitMemory) | 2 |
| 3 | `lib/memory-store.js` | 수정 (getMemoryFilePath) | 2 |
| 4 | `hooks/session-start.js` | 수정 (detectPdcaPhase + context string + migration) | 2, 3 |
| 5 | `lib/task/tracker.js` | 수정 (findPdcaStatus) | 2 |
| 6 | `scripts/context-compaction.js` | 수정 (snapshotDir) | 2 |
| 7 | `lib/team/state-writer.js` | 수정 (getAgentStatePath → runtime/ 하위로 이동) | 2 |
| 8 | `bkit.config.json` | 수정 (version, statusFile, customization.mode) | 4 |
| 9 | `lib/common.js` | 수정 (paths 모듈 re-export) | S2 |
| 10 | `.claude-plugin/plugin.json` | 수정 (version bump) | M4 |
| **총계** | | **9 수정 + 1 신규 = 10 파일** | |

> **참고**: `.gitignore`는 기존 `.bkit/` blanket ignore 유지로 변경 불필요. `.bkit/.gitignore`도 생성하지 않음.

### 5.5 리스크 및 대응

#### 5.5.1 기술적 리스크

| 리스크 | 심각도 | 확률 | 대응 |
|--------|:------:|:----:|------|
| `hooks/session-start.js:334`의 `process.cwd()` 사용 | HIGH | 기존 | paths.js로 통합 시 함께 수정 (`getPdcaStatusPath()` 사용) |
| 외부 스크립트가 `docs/.pdca-status.json` 참조 | LOW | 낮음 | auto-migration fallback으로 커버, CHANGELOG 명시 |
| auto-migration 실패 (파일 권한 등) | LOW | 낮음 | try/catch + 구 경로 fallback 유지 |
| `.bkit/` 하위 디렉토리 생성 실패 (권한) | LOW | 낮음 | `ensureBkitDir()`에서 recursive mkdir + try/catch |

#### 5.5.2 CC 이슈 영향

| 이슈 | 심각도 | bkit v1.5.8 영향 | 대응 |
|------|:------:|-----------------|------|
| #29548 ExitPlanMode regression | HIGH | plan mode 에이전트 7개 영향 | **v1.5.8 코드 변경과 무관**. CC 패치 대기 |
| #29547 AskUserQuestion empty | HIGH | plugin skills 대화형 기능 제한 | **v1.5.8 변경과 무관**. allowed-tools workaround |
| #17688 Plugin hooks 미지원 | MEDIUM | bkit hooks 작동 여부 | 기존 project hooks.json 우회 유지 |
| #25131 Agent Teams lifecycle | LOW | CTO Team 장시간 세션 | 실험적 기능, 기존 workaround 유지 |

**핵심**: v1.5.8의 변경 사항(Path Registry + 파일 이동)은 CC 이슈들과 **독립적**. CC 이슈가 해결되지 않아도 v1.5.8 릴리스에 영향 없음.

#### 5.5.3 CC 네이티브 기능 중복 위험

| bkit 제안 | CC 네이티브 대응 | 중복도 | v1.5.8 판정 |
|-----------|----------------|:------:|:-----------:|
| org-level config | CC managed settings | 높음 | **WONT** |
| local config | CC `settings.local.json` | 높음 | **WONT** |
| `/bkit-help` | CC 네이티브 `/help` + starter 스킬 | 높음 | **WONT** |
| `/bkit-new-skill` | SKILL.md 파일 1개 생성 (수동) | 높음 | **WONT** |
| 에이전트 모델 override | CC `.claude/agents/` 직접 수정 | 높음 | **WONT** |
| 스킬 disable | CC 미지원, soft hide만 가능 | 중간 | **COULD** |

---

## 6. Success Metrics (성공 지표)

| # | 지표 | 목표값 | 측정 방법 |
|---|------|:------:|----------|
| SM-1 | 상태 파일 `.bkit/` 위치율 | **100%** (4/4) | `ls .bkit/state/*.json .bkit/runtime/*.json` |
| SM-2 | 하드코딩 경로 잔여 수 | **0개** | `grep -r "docs/.pdca-status" --include="*.js"` |
| SM-3 | auto-migration 성공률 | **100%** | SessionStart 테스트 (fresh + existing) |
| SM-4 | 기존 TC 회귀 수 | **0건** | Comprehensive Test 실행 |
| SM-5 | 코드 변경 파일 수 | **10개 이하** | `git diff --stat` |
| SM-6 | 신규 상태 파일 수 | **0개** | YAGNI 원칙 준수 확인 |
| SM-7 | 구현 기간 | **3-4일** | 원래 전체 22일 대비 82% 절감 |

---

## 7. Future Roadmap (v1.6.x)

### 7.1 커스터마이제이션 계층 확장

| 항목 | 우선순위 | 수요 조건 |
|------|:--------:|----------|
| `extends` 필드 (bkit.config.json) | P1 | 조직 config 배포 수요 발생 시 |
| `customization.role` (pm/designer/qa/lead) | P2 | 비개발자 사용자 확보 후 |
| `costProfile` 프리셋 (quality/balanced/economy) | P3 | 에이전트 비용 최적화 수요 확인 후 |
| `.bkit/local.config.json` (개인 설정) | P3 | CC `settings.local.json`과 중복 해소 후 |

### 7.2 신규 스킬 (수요 확인 후)

| 스킬 | 용도 | 수요 조건 |
|------|------|----------|
| `/bkit-config` | 설정 조회/변경 CLI | 설정 복잡도 증가 시 |
| `/bkit-init` + Template 1-2종 | 프로젝트 초기화 | 조직 배포 수요 확인 후 |
| `/bkit-help` | 맞춤 도움말 | 사용자 온보딩 수요 증가 시 |

### 7.3 비개발자 접근성 강화

| 항목 | 선행 조건 |
|------|----------|
| 역할별 스킬 필터링 | `customization.role` 구현 후 |
| 비개발자 자연어 패턴 확장 | PM/디자이너 사용자 확보 후 |
| 가이드 모드 상세 UX (단계별 안내) | `customization.mode: guide` 검증 후 |
| 역할별 가이드 문서 4종 | 역할 시스템 안정화 후 |

### 7.4 인프라 개선 (CC 이슈 해결 연동)

| 항목 | CC 선행 조건 |
|------|-------------|
| HTTP hooks 통합 (PDCA 웹훅 알림) | HTTP hooks 안정화 확인 후 |
| ConfigChange hook 활용 | bkit.config.json 실시간 감지 |
| LEGACY_PATHS 제거 + 마이그레이션 코드 삭제 | v1.5.8 배포 1 릴리스 후 |
| Plugin hooks 전면 활용 | #17688 해결 시 |

### 7.5 영구 보류

다음 항목들은 수요가 검증되지 않는 한 구현하지 않는다:

- 4-Layer Config Merge 전체 구현
- Registry 패턴
- Plugin-of-Plugin 패턴
- Template 7종 (1-2종이면 충분)
- 커스터마이징 가이드 21개 문서

---

## Appendix

### A. 리서치 문서 목록

| # | 문서 | 작성자 | Task |
|---|------|--------|------|
| 1 | `cc-context-engineering-deep-dive.md` | cc-researcher | #1 |
| 2 | `anthropic-future-direction.md` | strategy-analyst | #2 |
| 3 | `bkit-codebase-state-analysis.md` | codebase-analyst | #3 |
| 4 | `bkit-directory-structure-brainstorm.md` | infra-designer | #4 |
| 5 | `bkit-directory-structure-design.md` | codebase-analyst | #4 |
| 6 | `customization-abstraction-brainstorm.md` | arch-designer | #5 |
| 7 | `dx-accessibility-brainstorm.md` | arch-designer | #6 |
| 8 | `dx-non-developer-brainstorm.md` | arch-designer | #6 |
| 9 | `yagni-feasibility-review.md` | yagni-reviewer | #7 |

### B. CTO Team 구성

| 역할 | Task | 모델 | 산출물 |
|------|:----:|:----:|--------|
| cc-researcher | #1 | opus | CC Context Engineering Deep Dive |
| strategy-analyst | #2 | opus | Anthropic Future Direction |
| codebase-analyst | #3, #4 | opus | Codebase Analysis, Directory Design |
| infra-designer | #4 | opus | Directory Structure Brainstorm |
| arch-designer | #5, #6 | opus | Customization Abstraction, DX Brainstorm |
| yagni-reviewer | #7 | opus | YAGNI & Feasibility Assessment |
| plan-compiler | #8 | opus | Plan-Plus Document (본 문서) |

### C. YAGNI 전체 분류표

| 분류 | 항목 수 | 비율 |
|------|--------:|-----:|
| **MUST** (v1.5.8 필수) | 4개 | 10% |
| **SHOULD** (v1.5.8 권장) | 3개 | 7% |
| **COULD** (v1.6.x 미루기) | 8개 | 19% |
| **WONT** (제거) | 7개 | 17% |
| **정보** (구현 항목 아님) | 4개 | 10% |
| **기타 DX 제안** (Phase 2-4) | 16개 | 38% |
| **합계** | 42개 | 100% |

v1.5.8 MVP 스코프: **7개 항목 (MUST 4 + SHOULD 3)** = 전체의 17%
삭제/미루기: **15개 항목** = 전체의 36%
v1.5.8에 불필요: **약 60%** (YAGNI 리뷰어 결론과 일치)

### D. 디렉토리 구조 Before/After

```
BEFORE (v1.5.7):                        AFTER (v1.5.8, Option B):
========================                ========================
docs/                                   docs/
├── .bkit-memory.json    [MOVE]         ├── 01-plan/
├── .pdca-status.json    [MOVE]         ├── 02-design/
├── .pdca-snapshots/     [MOVE]         ├── 03-analysis/
├── 01-plan/                            └── 04-report/
├── 02-design/
├── 03-analysis/                        .bkit/                   (전체 gitignored)
└── 04-report/                          ├── state/               [카테고리: 영속 상태]
                                        │   ├── memory.json      [MIGRATED]
.bkit/                                  │   └── pdca-status.json [MIGRATED]
└── agent-state.json                    ├── runtime/             [카테고리: 런타임]
                                        │   └── agent-state.json [MIGRATED]
                                        └── snapshots/           [카테고리: 백업]
                                            └── (auto-generated) [MIGRATED]
```

### E. 구현 실행 순서 (Checklist)

```
Phase 1: Path Registry (파일 이동 없음)
  [ ] lib/core/paths.js 생성 (STATE_PATHS, LEGACY_PATHS, CONFIG_PATHS)
  [ ] ensureBkitDir() — .bkit/, state/, runtime/, snapshots/ 디렉토리 생성
  [ ] lib/core/index.js 에서 paths export
  [ ] lib/common.js bridge에 paths re-export

Phase 2: Consumer Refactoring + 파일 이동
  [ ] lib/pdca/status.js:33 — getPdcaStatusPath() → STATE_PATHS.pdcaStatus()
  [ ] lib/memory-store.js:28 — getMemoryFilePath() → STATE_PATHS.memory()
  [ ] lib/pdca/status.js:705,724 — readBkitMemory/writeBkitMemory → STATE_PATHS.memory()
  [ ] hooks/session-start.js:334 — detectPdcaPhase() → getPdcaStatusPath()
  [ ] lib/task/tracker.js:199 — findPdcaStatus() → getPdcaStatusPath()
  [ ] scripts/context-compaction.js:46 — snapshotDir → STATE_PATHS.snapshots()
  [ ] lib/team/state-writer.js:72 — getAgentStatePath() → STATE_PATHS.agentState()

Phase 3: Migration + .gitignore 확인
  [ ] hooks/session-start.js에 migrateToNewBkitDir() 추가
  [ ] agent-state.json → runtime/ 하위로 마이그레이션 포함
  [ ] .gitignore 확인 (.bkit/ blanket ignore 기존 유지, 변경 없음)
  [ ] bkit.config.json — version, statusFile 업데이트
  [ ] .claude-plugin/plugin.json — version bump

Phase 4: customization.mode (선택적)
  [ ] bkit.config.json에 customization.mode 필드 추가
  [ ] hooks/session-start.js에 모드별 분기 추가
  [ ] (선택) lib/core/config.js에 getCustomizationMode() 추가

Verification:
  [ ] grep으로 잔여 하드코딩 경로 0개 확인
  [ ] .bkit/state/, .bkit/runtime/ 디렉토리 정상 생성 확인
  [ ] auto-migration 테스트 (구 경로 → 신 경로)
  [ ] 기존 TC 회귀 테스트 실행
  [ ] CHANGELOG 업데이트
```
