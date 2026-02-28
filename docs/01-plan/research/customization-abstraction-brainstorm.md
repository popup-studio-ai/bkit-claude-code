# Customization Abstraction Layer - Architecture Brainstorm

> **Date**: 2026-03-01
> **Architect**: Architecture Designer (bkit v1.5.8 CTO Team, Task #5)
> **Purpose**: bkit을 기본 프레임워크로 제공하면서 조직별/프로젝트별/개인별 커스터마이징 추상화 계층 설계
> **Input**: cc-context-engineering-deep-dive.md, anthropic-future-direction.md, bkit-codebase-state-analysis.md

---

## 1. 리서치 문서 핵심 요약

### 1.1 CC Context Engineering 8대 Surface (Deep Dive 요약)

Claude Code는 8개의 Context Engineering Surface를 제공하며, v2.1.63 기준 **모든 Surface가 Stable API**에 도달:

| Surface | 안정성 | 커스터마이징 핵심 |
|---------|--------|------------------|
| **Skills** (SKILL.md) | Stable (v2.1.45+) | 파일시스템 기반, 네임스페이스 분리 (`plugin:skill`), 2% 컨텍스트 예산 |
| **Agents** (.md) | Stable (v2.1.49+) | 14개 frontmatter 필드, memory scope, background/isolation |
| **Hooks** (17 events) | Stable (v2.1.38+) | 4가지 타입 (command/http/prompt/agent), exit code 기반 제어 |
| **Commands** (Legacy) | Merged into Skills | Skills로 완전 통합, 하위 호환 유지 |
| **Auto-Memory** | Stable (v2.1.59+) | MEMORY.md 200줄 자동 로드, 프로젝트별 격리 |
| **CLAUDE.md** | Stable (v1.0+) | 7단계 우선순위, @import 지원, 경로별 rules |
| **Rules** (.claude/rules/) | Stable | glob 패턴 기반 경로 스코핑, 재귀 탐색 |
| **Config** (settings.json) | Stable (v2.1.38+) | 4-Tier Scope (Managed > Local > Project > User), 배열 merge |

**핵심 인사이트**: CC의 설정 시스템은 **filesystem-based + convention over configuration** 원칙. 모든 커스터마이징은 파일 배치로 해결되며, API 호출이 불필요.

### 1.2 Anthropic 미래 방향 (Future Direction 요약)

Anthropic은 **인프라 프리미티브**(hooks, agents, skills, memory)에 집중 투자하고, **워크플로우 오케스트레이션**은 플러그인/사용자에게 위임:

- **Plugin Marketplace**: Git 기반 분산 배포, 사설 Enterprise 마켓플레이스 지원
- **Agent Skills Open Standard**: 크로스 플랫폼 호환, 270,000+ 스킬 에코시스템
- **Enterprise Controls**: Managed settings, macOS plist/Windows Registry, BYOK 암호화 (H1 2026)
- **Multi-Agent Architecture**: Agent Teams (실험적), Background Agents, Remote Control
- **$2.5B ARR**: Claude Code 급성장, GitHub 공개 커밋 4% 차지

**bkit 포지셔닝**: CC가 인프라를 제공하면, bkit은 그 위에 **PDCA 워크플로우 + 의도 분류 + 한국어 우선 + CTO Team 패턴** 오케스트레이션 제공. CC가 bkit 기능을 대체할 가능성은 매우 낮음 (opinionated workflow는 플랫폼이 제공하지 않음).

### 1.3 bkit 코드베이스 상태 (Codebase Analysis 요약)

- **5개 상태 파일**: pdca-status.json (16+ readers), bkit-memory.json (5 readers/writers), agent-state.json, bkit.config.json, plugin.json
- **경로 중앙화 부족**: 3곳 독립 path 구성, dormant config key (`pdca.statusFile` 미사용)
- **이동 불가 파일**: plugin.json, hooks.json (CC 강제 경로)
- **.bkit/ 디렉토리**: agent-state.json만 존재, 나머지는 docs/에 분산
- **180개 export**: common.js 브릿지를 통한 중앙 접근
- **bkit.config.json**: 2-fallback (PROJECT_DIR > PLUGIN_ROOT), extends 미지원

---

## 2. 커스터마이제이션 계층 구조 설계

### 2.1 4-Layer Customization Hierarchy

```
Layer 0: bkit-defaults (Plugin 기본값)
  ├── 27 Skills, 16 Agents, 10 Hook Events
  ├── bkit.config.json (기본 설정)
  ├── PDCA 템플릿, 출력 스타일
  └── 의도 분류 엔진, 다국어 지원

Layer 1: org-overrides (조직 수준)
  ├── 조직 코딩 규칙 (CLAUDE.md)
  ├── 조직 전용 스킬/에이전트 추가
  ├── 보안 정책 (permissions, hooks)
  ├── 기본 모델/언어 설정
  └── CI/CD 통합 훅

Layer 2: project-overrides (프로젝트 수준)
  ├── 프로젝트별 PDCA 설정 (match rate, iterations)
  ├── 프로젝트별 스킬 활성화/비활성화
  ├── 빌드/테스트 스크립트 훅
  ├── 경로 규칙 (.claude/rules/)
  └── MCP 서버 연결

Layer 3: personal-overrides (개인 수준)
  ├── 선호 언어/출력 스타일
  ├── 가이드 모드 vs 전문가 모드
  ├── 개인 스킬/에이전트 추가
  └── 로컬 메모리 (gitignored)
```

### 2.2 CC Native 계층과의 매핑

| bkit Layer | CC Native 대응 | 구현 메커니즘 |
|------------|---------------|-------------|
| Layer 0 (bkit-defaults) | Plugin 디렉토리 | `.claude-plugin/`, skills/, agents/, hooks/ |
| Layer 1 (org-overrides) | Managed settings + User `~/.claude/` | managed-settings.json, `~/.claude/CLAUDE.md` |
| Layer 2 (project-overrides) | Project `.claude/` | `.claude/settings.json`, `.claude/rules/`, `bkit.config.json` |
| Layer 3 (personal-overrides) | Local (gitignored) | `.claude/settings.local.json`, `.claude/CLAUDE.local.md` |

**핵심**: CC는 이미 4-Tier Scope (Managed > Local > Project > User)를 제공. bkit은 이 위에 **의미적 계층** (조직 > 프로젝트 > 개인)을 추가하는 것이 목표.

---

## 3. 커스터마이징 패턴 상세 비교

### 패턴 A: Config Merge 패턴

**개요**: `bkit.config.json`에 `extends` 필드를 추가하여, 계층별 설정 파일을 deep merge.

**구조**:
```
~/.bkit/org-config.json          (조직 기본값)
  └── bkit.config.json extends   (프로젝트 오버라이드)
      └── .bkit/local.config.json (개인 오버라이드, gitignored)
```

**bkit.config.json 변경**:
```json
{
  "extends": "~/.bkit/acme-corp.config.json",
  "version": "1.5.8",
  "overrides": {
    "pdca.matchRateThreshold": 95,
    "team.maxTeammates": 3
  }
}
```

**Merge 규칙**:
- 스칼라 값: 하위 계층이 상위를 오버라이드
- 배열: CC settings.json과 동일하게 concatenate + deduplicate
- 객체: deep merge (재귀적)
- `null` 값: 상위 계층 키 삭제 (명시적 비활성화)

**장점**:
- CC의 settings.json 배열 merge 패턴과 일관성
- JSON 기반으로 도구 친화적 (schema validation 가능)
- 기존 `bkit.config.json` 구조 확장이므로 하위 호환
- 구현 복잡도 낮음 (deep-merge 라이브러리 1개)

**단점**:
- Skills/Agents/Hooks 등 파일시스템 기반 자원은 config merge로 해결 불가
- 조직 config 파일 배포 메커니즘 필요 (`~/.bkit/` 초기 셋업)
- config 충돌 디버깅이 복잡해질 수 있음 (어떤 계층에서 온 값인지)
- CC의 `settings.json`과 bkit의 `bkit.config.json` 이중 관리

**구현 복잡도**: **LOW** (2-3일)

---

### 패턴 B: Registry 패턴

**개요**: 중앙 레지스트리에 모든 컴포넌트(스킬, 에이전트, 훅, 규칙)를 등록하고, 계층별 오버레이로 활성화/비활성화/교체.

**구조**:
```javascript
// lib/core/registry.js
const registry = {
  skills: new Map(),      // name -> { source, layer, enabled, config }
  agents: new Map(),      // name -> { source, layer, enabled, config }
  hooks: new Map(),       // event+matcher -> { source, layer, handlers[] }
  rules: new Map(),       // path-pattern -> { source, layer, content }
  configs: new Map(),     // key -> { source, layer, value }
};
```

**등록 흐름**:
```
1. bkit plugin 로드 → Layer 0 컴포넌트 등록
2. ~/.bkit/org.registry.json 로드 → Layer 1 오버레이 적용
3. .bkit/project.registry.json 로드 → Layer 2 오버레이 적용
4. .bkit/local.registry.json 로드 → Layer 3 오버레이 적용
```

**오버레이 예시**:
```json
{
  "layer": "org",
  "overlays": {
    "skills": {
      "disable": ["phase-6-ui", "phase-8-qa"],
      "add": {
        "acme-deploy": { "path": "~/.bkit/skills/acme-deploy/SKILL.md" }
      }
    },
    "agents": {
      "replace": {
        "code-analyzer": { "model": "opus", "permissionMode": "acceptEdits" }
      }
    },
    "hooks": {
      "add": {
        "PreToolUse:Bash(npm publish*)": {
          "type": "command",
          "command": "~/.bkit/scripts/publish-gate.sh"
        }
      }
    }
  }
}
```

**충돌 해결 전략**:
- 동일 이름: 하위 계층이 상위 계층 **교체** (replace)
- disable/enable: 명시적 비활성화는 어떤 계층에서든 적용
- add: 모든 계층의 추가 항목을 merge
- 충돌 로그: SessionStart에서 충돌 감지 및 경고 출력

**장점**:
- 모든 Surface를 단일 추상화로 관리 (Skills + Agents + Hooks + Rules + Config)
- 세밀한 제어 가능 (개별 스킬 비활성화, 에이전트 모델 변경 등)
- 충돌 해결 전략 명시적 정의
- 계층 간 의존성 추적 가능 ("이 스킬은 org에서 비활성화됨")

**단점**:
- CC의 파일시스템 기반 발견 메커니즘과 이중 관리 (registry vs CC auto-discovery)
- 구현 복잡도 높음 (레지스트리 엔진 + 오버레이 시스템 + 충돌 해결)
- 런타임 오버헤드 (SessionStart에서 전체 레지스트리 빌드)
- CC 업데이트 시 레지스트리와 실제 파일시스템 간 동기화 문제
- 사용자가 CC의 네이티브 구조와 bkit 레지스트리 모두 이해해야 함

**구현 복잡도**: **HIGH** (7-10일)

---

### 패턴 C: Plugin-of-Plugin 패턴

**개요**: bkit을 base plugin으로 두고, 조직별 extension plugin을 CC의 기존 plugin 시스템 위에 계층화.

**구조**:
```
Installed Plugins:
  1. bkit (base plugin) — 27 skills, 16 agents, 10 hook events
  2. bkit-acme-corp (org extension) — 5 custom skills, 3 agents, 2 hooks
  3. bkit-frontend-team (project extension) — 3 skills, 1 agent
```

**Extension Plugin 구조**:
```
bkit-acme-corp/
├── .claude-plugin/
│   └── plugin.json      # { "name": "bkit-acme-corp", "extends": "bkit" }
├── skills/
│   └── acme-deploy/
│       └── SKILL.md     # 조직 전용 배포 스킬
├── agents/
│   └── acme-reviewer.md # 조직 코드 리뷰 에이전트
├── hooks/
│   └── hooks.json       # 조직 보안 훅
└── bkit-extension.json  # bkit 오버라이드 설정
```

**bkit-extension.json**:
```json
{
  "base": "bkit",
  "overrides": {
    "bkit.config": {
      "pdca.matchRateThreshold": 95,
      "team.maxTeammates": 5
    },
    "skills.disable": ["phase-6-ui"],
    "agents.replace": {
      "code-analyzer": { "model": "opus" }
    }
  }
}
```

**장점**:
- CC의 네이티브 plugin 시스템을 그대로 활용 (새로운 메커니즘 불필요)
- 네임스페이스 자동 분리 (`bkit:skill` vs `bkit-acme-corp:skill`)
- Plugin Marketplace를 통한 자연스러운 배포
- 각 extension은 독립적으로 버전 관리 가능
- Plugin hot reload (v2.1.45+) 지원

**단점**:
- CC plugin 시스템 한계: settings.json은 `agent` 키만 지원
- Extension plugin이 base plugin의 스킬/에이전트를 오버라이드하는 공식 메커니즘 없음
- `bkit-extension.json`은 CC가 인식하지 못하는 커스텀 파일 (bkit이 자체 파싱 필요)
- #17688 (Plugin hooks 미지원) 이슈 미해결 시, 훅 기반 제어 제한
- 사용자가 여러 plugin을 설치/관리해야 함 (UX 복잡)
- 개인 수준 커스터마이징은 별도 메커니즘 필요

**구현 복잡도**: **MEDIUM** (4-6일, CC plugin 시스템 의존도 높음)

---

### 패턴 D: Template 패턴

**개요**: `bkit-template-{org}` 형태의 프로젝트 템플릿으로 초기 구조를 생성하고, 이후 독립적으로 수정.

**구조**:
```
bkit-template-acme/
├── bkit.config.json         # 조직 기본 설정
├── .claude/
│   ├── CLAUDE.md            # 조직 코딩 규칙
│   ├── rules/
│   │   ├── security.md      # 보안 규칙
│   │   └── naming.md        # 명명 규칙
│   ├── skills/              # 조직 전용 스킬
│   └── agents/              # 조직 전용 에이전트
├── hooks/
│   └── hooks.json           # 조직 훅 설정
└── templates/
    └── *.template.md        # 조직 PDCA 템플릿
```

**Scaffolding 명령**:
```bash
# 새 프로젝트 초기화
/bkit-init --template acme-corp

# 기존 프로젝트에 조직 설정 적용
/bkit-apply-template acme-corp
```

**장점**:
- 가장 단순한 구현 (파일 복사 + 변수 치환)
- CC의 파일시스템 기반 구조와 완벽 호환
- 생성 후 완전한 독립성 (외부 의존성 0)
- Git으로 조직 템플릿 버전 관리
- 비개발자도 이해 가능한 구조

**단점**:
- 생성 후 업스트림 변경 반영 불가 (fork 분기 문제)
- bkit 버전 업그레이드 시 템플릿 재적용 필요
- 조직 정책 변경 시 모든 프로젝트에 개별 적용 필요
- 런타임 오버라이드 불가 (정적 파일 기반)
- "base bkit + org extension"이 아닌 "org-specific bkit instance" 생성

**구현 복잡도**: **VERY LOW** (1-2일)

---

### 패턴 E: Hybrid Layered 패턴 (신규 제안)

**개요**: Config Merge(패턴 A)를 기반으로, CC의 파일시스템 발견 메커니즘을 계층별로 활용하는 하이브리드 접근.

**핵심 원리**: "bkit의 config는 merge, CC의 컴포넌트(skills/agents/hooks)는 CC 네이티브 발견 메커니즘 활용"

**구조**:
```
CC Native Discovery (자동):
  ~/.claude/skills/           → 개인 스킬 (Layer 3)
  ~/.claude/agents/           → 개인 에이전트 (Layer 3)
  .claude/skills/             → 프로젝트 스킬 (Layer 2)
  .claude/agents/             → 프로젝트 에이전트 (Layer 2)
  <bkit-plugin>/skills/       → bkit 기본 스킬 (Layer 0)
  <bkit-plugin>/agents/       → bkit 기본 에이전트 (Layer 0)

bkit Config Merge (자체 구현):
  <bkit-plugin>/bkit.config.json       → Layer 0 (기본값)
  ~/.bkit/org.config.json              → Layer 1 (조직)
  ./bkit.config.json                   → Layer 2 (프로젝트)
  ./.bkit/local.config.json            → Layer 3 (개인, gitignored)

조직 스킬 배포:
  ~/.bkit/skills/ → symlink to ~/.claude/skills/bkit-org-*
  (또는 bkit-acme-corp extension plugin 통해 배포)
```

**bkit.config.json 확장**:
```json
{
  "extends": "~/.bkit/org.config.json",
  "version": "1.5.8",
  "customization": {
    "skills": {
      "disable": ["phase-6-ui"],
      "descriptions": {
        "pdca": "PDCA 사이클 관리 (조직 변형)"
      }
    },
    "agents": {
      "overrides": {
        "code-analyzer": { "model": "opus" }
      }
    },
    "mode": "expert"
  }
}
```

**동작 방식**:
1. **SessionStart**: bkit config 파일들을 계층 순서로 로드, deep merge
2. **Skills/Agents**: CC의 네이티브 발견 메커니즘이 자동 처리 (bkit은 disable/config만 관리)
3. **Hooks**: CC 네이티브 + bkit config의 `hooks.enabled` 플래그로 on/off 제어
4. **Rules**: CC의 `.claude/rules/` 그대로 활용, bkit은 관여하지 않음
5. **Output**: bkit config의 `mode` 설정에 따라 출력 스타일 자동 선택

**장점**:
- CC 네이티브 메커니즘 최대 활용 (이중 관리 최소화)
- Config merge만 구현하면 되므로 구현 복잡도 낮음
- CC 업데이트에 강건함 (CC 발견 메커니즘에 의존하므로)
- 조직 스킬은 CC 네이티브 경로(`~/.claude/skills/`)에 배치하면 자동 발견
- 단계적 도입 가능 (config merge 먼저, 이후 점진적 확장)

**단점**:
- 조직 스킬/에이전트 배포는 별도 메커니즘 필요 (수동 또는 extension plugin)
- CC가 스킬 disable을 지원하지 않으므로 bkit 자체 구현 필요 (SessionStart 훅에서 경고)
- 4개 config 파일 위치를 사용자가 알아야 함

**구현 복잡도**: **LOW-MEDIUM** (3-4일)

---

## 4. 패턴 비교 종합표

| 평가 항목 | A: Config Merge | B: Registry | C: Plugin-of-Plugin | D: Template | E: Hybrid Layered |
|-----------|:-:|:-:|:-:|:-:|:-:|
| **구현 복잡도** | LOW (2-3일) | HIGH (7-10일) | MEDIUM (4-6일) | VERY LOW (1-2일) | LOW-MEDIUM (3-4일) |
| **CC 호환성** | HIGH | MEDIUM | HIGH | HIGH | VERY HIGH |
| **CC 업데이트 강건성** | HIGH | LOW | MEDIUM | HIGH | VERY HIGH |
| **계층 제어 세밀도** | MEDIUM | VERY HIGH | MEDIUM | LOW | HIGH |
| **비개발자 접근성** | MEDIUM | LOW | LOW | HIGH | MEDIUM |
| **업스트림 반영** | YES | YES | YES | NO | YES |
| **런타임 유연성** | MEDIUM | HIGH | LOW | NONE | MEDIUM |
| **배포 용이성** | MEDIUM | LOW | HIGH (marketplace) | HIGH (git clone) | MEDIUM |
| **이중 관리 리스크** | LOW | HIGH | LOW | NONE | VERY LOW |
| **확장성** | MEDIUM | HIGH | HIGH | LOW | HIGH |
| **기존 코드 변경량** | 3-5 files | 15+ files | 2-3 files | 1-2 files | 5-7 files |

---

## 5. 추천 패턴 및 근거

### 5.1 Primary: 패턴 E (Hybrid Layered) - 추천

**추천 근거**:

1. **CC 철학과 정합**: Anthropic은 "convention over configuration" + 파일시스템 기반 설계를 일관되게 추구. 패턴 E는 CC의 네이티브 발견 메커니즘을 그대로 활용하므로 가장 자연스러움.

2. **미래 방향 정합**: Anthropic이 Skills/Agents/Hooks를 계속 확장하면, CC 네이티브 기능이 자동으로 bkit에도 적용됨. Registry 패턴(B)은 CC 업데이트마다 동기화 부담.

3. **구현 대비 효과**: Config merge 엔진만 구현하면 핵심 기능 제공 가능. CC가 컴포넌트 발견/로딩/실행을 처리하므로 bkit은 "설정 + 제어"만 담당.

4. **단계적 도입**: Phase 1(config merge) -> Phase 2(skill disable 로직) -> Phase 3(조직 스킬 배포 가이드) 순으로 점진적 구현 가능.

5. **bkit 포지셔닝**: bkit은 "오케스트레이션 레이어"이지 "인프라 레이어"가 아님. CC 인프라를 감싸지 않고 위에 얹는 접근이 올바름.

### 5.2 Secondary: 패턴 D (Template) - 보완

Template 패턴은 패턴 E와 **상호 보완**으로 사용:
- 초기 프로젝트 셋업: `/bkit-init --template acme-corp`
- 이후 런타임 커스터마이징: 패턴 E의 config merge
- 조직 표준 배포: Template으로 기본 구조 생성 + 조직 config 파일 포함

### 5.3 보류: 패턴 B (Registry), 패턴 C (Plugin-of-Plugin)

- **패턴 B**: 구현 복잡도 대비 이점 불충분. CC 업데이트 시 동기화 부담 큼. Agent Teams가 GA 되면 재평가.
- **패턴 C**: CC plugin 시스템이 extension plugin 오버라이드를 공식 지원할 때 재평가. 현재는 `bkit-extension.json` 자체 파싱 오버헤드.

---

## 6. Surface별 커스터마이징 설계도

### 6.1 Skills 커스터마이징

```
계층별 동작:
  Layer 0 (bkit): <plugin>/skills/ → CC가 bkit:skill-name으로 발견
  Layer 1 (org):  ~/.claude/skills/bkit-org-* → CC가 자동 발견
  Layer 2 (proj): .claude/skills/* → CC가 자동 발견
  Layer 3 (user): 추가 개인 스킬 → ~/.claude/skills/

bkit config 제어:
  "customization.skills.disable": ["phase-6-ui", "phase-8-qa"]
  → SessionStart 훅에서 비활성화된 스킬 목록을 context에 주입
  → "다음 스킬은 사용하지 마세요: phase-6-ui, phase-8-qa"

스킬 예산 관리:
  27 스킬 × description → 2% 컨텍스트 예산 (~16K chars) 근접
  → 조직이 스킬 추가 시 기본 스킬 비활성화 권장
  → disable-model-invocation: true 활용으로 예산 절약
```

### 6.2 Agents 커스터마이징

```
계층별 동작:
  Layer 0 (bkit): <plugin>/agents/ → CC가 bkit plugin agent로 발견
  Layer 2 (proj): .claude/agents/ → CC가 프로젝트 agent로 발견 (plugin보다 우선)
  Layer 3 (user): ~/.claude/agents/ → CC가 사용자 agent로 발견

bkit config 제어:
  "customization.agents.overrides": {
    "code-analyzer": { "model": "opus", "permissionMode": "acceptEdits" }
  }
  → 프로젝트에 .claude/agents/code-analyzer.md를 생성하여 오버라이드
  → SessionStart 훅에서 config 기반 자동 생성 가능 (향후)

CTO Team 커스터마이징:
  "team.orchestrationPatterns": 계층별 merge
  → 조직이 기본 팀 구성 정의
  → 프로젝트가 특정 PDCA 단계의 패턴 변경
```

### 6.3 Hooks 커스터마이징

```
계층별 동작:
  Layer 0 (bkit): <plugin>/hooks/hooks.json → bkit 기본 훅 (10 events)
  Layer 2 (proj): .claude/settings.json → hooks → 프로젝트 훅 추가
  Layer 3 (user): ~/.claude/settings.json → hooks → 개인 훅 추가

bkit config 제어:
  "hooks.userPromptSubmit.enabled": false  → 특정 훅 비활성화
  "hooks.customEvents": {
    "PreToolUse": {
      "matcher": "Bash(npm publish*)",
      "hooks": [{ "type": "command", "command": "scripts/publish-gate.sh" }]
    }
  }
  → SessionStart에서 .claude/settings.json에 merge (또는 가이드 출력)

#17688 제약:
  Plugin hooks 미지원 이슈 미해결 시:
  → 프로젝트 .claude/settings.json에 훅 추가 권장
  → /bkit-init 템플릿에 기본 훅 포함
```

### 6.4 Memory 커스터마이징

```
현재 구조:
  CC auto-memory: ~/.claude/projects/<p>/memory/MEMORY.md (CC 관리)
  bkit memory:    docs/.bkit-memory.json (bkit 관리)
  → 완전 분리, 충돌 0%

커스터마이징:
  Layer 1 (org):  ~/.bkit/memory-template.json → 조직 기본 메모리 구조
  Layer 2 (proj): bkit.config.json → pdca 설정으로 메모리 관리 방식 제어

Agent Memory:
  bkit의 16 agents는 현재 agent memory 미사용
  → v1.5.8에서 주요 에이전트에 memory scope 활성화 검토
  → project scope (.claude/agent-memory/) 권장 (팀 공유)
```

### 6.5 CLAUDE.md / Rules 커스터마이징

```
CC의 CLAUDE.md 계층 그대로 활용:
  Managed policy → 조직 (IT 관리자)
  ~/.claude/CLAUDE.md → 개인
  CLAUDE.md → 프로젝트
  .claude/CLAUDE.md → 프로젝트 (숨김)
  .claude/CLAUDE.local.md → 개인 (gitignored)

bkit의 역할:
  → /bkit-init 템플릿에 조직 CLAUDE.md 포함
  → .claude/rules/에 PDCA 단계별 규칙 파일 자동 생성
    예: .claude/rules/pdca-plan.md (paths: ["docs/01-plan/**"])
        .claude/rules/pdca-design.md (paths: ["docs/02-design/**"])
  → bkit이 추가 CLAUDE.md를 생성하지 않고, @import로 bkit 가이드 참조
```

### 6.6 Config 커스터마이징

```
4-Layer Config Merge:
  <bkit-plugin>/bkit.config.json  → Layer 0 (기본값)
  ~/.bkit/org.config.json         → Layer 1 (조직)
  ./bkit.config.json              → Layer 2 (프로젝트, 현재와 동일)
  ./.bkit/local.config.json       → Layer 3 (개인, gitignored)

Merge 함수:
  function loadMergedConfig() {
    const base = loadJSON(PLUGIN_ROOT + '/bkit.config.json');
    const org = loadJSON(HOME + '/.bkit/org.config.json');
    const project = loadJSON(PROJECT_DIR + '/bkit.config.json');
    const local = loadJSON(PROJECT_DIR + '/.bkit/local.config.json');
    return deepMerge(base, org, project, local);
  }

extends 필드:
  "extends" 필드는 선택적. 명시하면 해당 파일을 Layer 1 대신 로드.
  → 파일 경로, npm 패키지, git URL 지원 (향후 확장)
```

---

## 7. 비개발자 접근성 전략

### 7.1 가이드 모드 vs 전문가 모드

```json
// bkit.config.json
{
  "customization": {
    "mode": "guide"  // "guide" | "expert" | "auto"
  }
}
```

| 모드 | 대상 | 동작 |
|------|------|------|
| **guide** | PM, 디자이너, 기획자 | 단계별 안내, 선택지 제시, 확인 요청 |
| **expert** | 숙련 개발자 | 최소 설명, 빠른 실행, 자동화 우선 |
| **auto** | 모든 사용자 (기본값) | 의도 분류 결과에 따라 자동 전환 |

**구현**:
- `mode: "guide"` → 출력 스타일 `bkit-learning` 자동 적용
- `mode: "expert"` → 출력 스타일 `bkit-pdca-guide` 자동 적용
- Skills의 `disable-model-invocation: true` 활용하여 복잡한 스킬 숨김
- UserPromptSubmit 훅에서 mode에 따라 context 주입량 조절

### 7.2 자연어 기반 워크플로우 트리거

bkit의 기존 의도 분류 엔진 활용:
```
"기획서 작성해줘" → /pdca (plan phase)
"디자인 리뷰 좀" → /design-review
"배포 준비" → /pipeline (phase 9)
"코드 품질 확인" → /code-review
```

비개발자 확장:
```
"회의록 정리해줘" → /bkit-org:meeting-notes (조직 커스텀 스킬)
"스프린트 리뷰 준비" → /bkit-org:sprint-review
"PRD 작성" → /bkit-org:prd
```

### 7.3 스킬 디스커버리 UX

현재 CC의 `/` 메뉴는 모든 스킬을 나열. 27개 bkit 스킬은 사용자에게 압도적일 수 있음.

**개선 전략**:
- `mode: "guide"` 시 핵심 스킬만 노출 (10개 이내)
- 나머지 스킬은 `disable-model-invocation: true` + `user-invocable: false` 설정
- `/bkit-help` 스킬에서 현재 모드에 맞는 스킬 목록 제공
- PDCA 단계별 관련 스킬만 컨텍스트에 주입 (SessionStart 훅에서)

### 7.4 온보딩 경험

```
첫 실행 → SessionStart 훅 감지 (sessionCount === 1)
  → "bkit에 오신 것을 환영합니다! 현재 [guide/expert] 모드입니다."
  → "주요 명령어: /pdca, /pipeline, /code-review"
  → "모드 변경: bkit.config.json → customization.mode"

조직 첫 셋업 → /bkit-init
  → "조직 템플릿을 선택하세요: [default, startup, enterprise]"
  → 선택한 템플릿으로 .claude/ + bkit.config.json 생성
```

---

## 8. 기술적 제약 및 대응 방안

### 8.1 CC Plugin 시스템 한계

| 제약 | 영향 | 대응 |
|------|------|------|
| settings.json은 `agent` 키만 지원 | Plugin이 permissions/hooks를 직접 설정 불가 | 프로젝트 `.claude/settings.json`에 병합 또는 가이드 출력 |
| Plugin skills 네임스페이스 (`bkit:skill`) | 사용자가 `bkit:` 접두사 필요 | `name` 필드로 짧은 이름 제공, CC가 자동 매핑 |
| 스킬 예산 2% (~16K chars) | 27 스킬 description이 예산 근접 | `disable-model-invocation: true`로 선택적 로드 |
| `SLASH_COMMAND_TOOL_CHAR_BUDGET` env var | 예산 확장 가능하나 컨텍스트 소비 증가 | 기본값 유지 권장, 엔터프라이즈에서만 확장 |

### 8.2 Agent Teams 실험적 상태

| 제약 | 영향 | 대응 |
|------|------|------|
| `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` 필요 | CTO Team 패턴 사용 제한 | env var 가이드 + fallback to subagents |
| #25131 Agent Teams lifecycle | 장시간 세션에서 불안정 가능 | maxTeammates 제한, 세션 재시작 가이드 |
| #29441 Agent skills 미프리로드 | Teammate가 스킬 없이 시작 | skills frontmatter로 명시적 프리로드 |
| #29548 ExitPlanMode regression | Plan 모드 에이전트 승인 누락 | 패치 대기, workaround 문서화 |

### 8.3 #17688 Plugin Hooks 미지원

| 제약 | 영향 | 대응 |
|------|------|------|
| Plugin의 hooks/hooks.json이 CC에 의해 로드되지 않을 수 있음 | bkit의 10개 훅 이벤트 비활성화 위험 | 프로젝트 `.claude/settings.json`에 훅 복사 (fallback) |
| 커뮤니티 root cause 식별됨 | 수정 가능하나 Anthropic 미반영 | Monitor, 패치 시 즉시 활용 |

### 8.4 #29547 AskUserQuestion 빈 값

| 제약 | 영향 | 대응 |
|------|------|------|
| Plugin skills에서 AskUserQuestion 결과 빈 값 | 대화형 스킬 동작 불가 | allowed-tools에서 AskUserQuestion 제거 (workaround) |
| PreToolUse wildcard matcher가 input 손상 | 근본 원인 CC 측 버그 | CC 패치 대기 |

### 8.5 대응 우선순위

```
즉시 대응 (v1.5.8):
  1. Config merge 엔진 구현 (패턴 E 핵심)
  2. #29547 workaround 적용
  3. Template 시스템 기초 (/bkit-init)

CC 패치 후 대응:
  4. #17688 해결 시: Plugin hooks 전면 활용
  5. #29548 해결 시: Plan 모드 에이전트 정상화
  6. Agent Teams GA 시: CTO Team 패턴 공식화

장기 대응 (v1.6.x):
  7. HTTP hooks 통합 (PDCA 웹훅 알림)
  8. ConfigChange hook 활용 (bkit.config.json 실시간 감지)
  9. Skills marketplace 등록 준비
```

---

## 9. 구현 복잡도 추정

### 9.1 패턴 E (Hybrid Layered) 구현 로드맵

| Phase | 작업 | 파일 수 | 예상 기간 |
|-------|------|--------:|-----------|
| **Phase 1: Config Merge Engine** | `lib/core/config.js` 확장, deep merge 함수, 4-layer 로딩 | 2-3 files | 2일 |
| **Phase 2: Skill Control** | disable 로직, SessionStart context 주입, 예산 관리 | 2-3 files | 1일 |
| **Phase 3: Mode System** | guide/expert/auto 모드, 출력 스타일 자동 선택 | 3-4 files | 2일 |
| **Phase 4: Template System** | `/bkit-init` 스킬, 기본 템플릿 3종, scaffolding | 5-6 files | 2일 |
| **Phase 5: Agent Override** | config 기반 에이전트 오버라이드, 프로젝트 agent 생성 | 2-3 files | 1일 |
| **Phase 6: Documentation** | 커스터마이징 가이드, 조직 셋업 가이드 | 3-4 docs | 1일 |
| **Total** | | 17-23 files | **9일** |

### 9.2 최소 MVP (v1.5.8 범위)

Phase 1 + Phase 3만 구현하면 핵심 가치 전달 가능:
- Config merge: `extends` + 4-layer 로딩 (2일)
- Mode system: guide/expert (2일)
- **MVP 기간: 4일**

---

## 10. 결론 및 핵심 추천

### 10.1 아키텍처 결정

| 결정 사항 | 선택 | 근거 |
|-----------|------|------|
| 기본 패턴 | **Hybrid Layered (E)** | CC 네이티브 활용 + 낮은 구현 복잡도 + 미래 강건성 |
| 보조 패턴 | **Template (D)** | 초기 셋업 + 조직 표준 배포 |
| Config 형식 | **JSON (bkit.config.json 확장)** | 기존 구조 유지 + schema validation |
| 계층 수 | **4 Layers** | CC 4-Tier Scope와 일관 |
| 모드 시스템 | **guide / expert / auto** | 비개발자 접근성 확보 |

### 10.2 핵심 원칙

1. **CC 위에 얹기, 감싸지 않기** — bkit은 CC의 인프라를 추상화하지 않음. CC 네이티브 메커니즘을 그대로 활용하고, 워크플로우 오케스트레이션만 추가.

2. **Config는 Merge, 컴포넌트는 Discover** — bkit 설정은 계층별 deep merge, Skills/Agents/Hooks는 CC의 파일시스템 발견 메커니즘에 위임.

3. **점진적 도입** — MVP(config merge + mode)로 시작, CC 이슈 해결에 따라 점진적 확장.

4. **비개발자 우선** — guide 모드를 기본값으로, 복잡성은 expert 모드에 격리.

5. **조직 자율성** — bkit은 프레임워크를 제공하되, 조직이 자유롭게 커스터마이징. 강제 규칙 최소화.

---

## Sources

- `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/docs/01-plan/research/cc-context-engineering-deep-dive.md`
- `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/docs/01-plan/research/anthropic-future-direction.md`
- `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/docs/01-plan/research/bkit-codebase-state-analysis.md`
- `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/bkit.config.json`
- `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/.claude-plugin/plugin.json`
