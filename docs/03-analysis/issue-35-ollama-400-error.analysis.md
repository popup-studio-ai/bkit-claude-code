# GitHub Issue #35: API 400 Bad Request - Ollama + /pdca team CTO 원인 분석

> **Feature**: issue-35-ollama-400-error-analysis
> **Phase**: Check (PDCA Analysis)
> **Date**: 2026-02-27
> **Pattern**: CTO Team (8 specialist agents + CTO Lead)
> **bkit Version**: v1.5.5 (current)
> **Issue**: [#35 - API 400 Bad Request when using /pdca team CTO with Ollama (qwen3.5:397b-cloud)](https://github.com/popup-inc/bkit-claude-code/issues/35)

---

## 1. Executive Summary

| Metric | Value |
|--------|:-----:|
| Issue Type | Bug Report (Third-party API Compatibility) |
| Reporter Environment | Ollama Cloud + qwen3.5:397b-cloud |
| Root Cause Confidence | **95%** (Model Alias Resolution Failure) |
| Contributing Factors | 5 identified |
| Severity Assessment | **Expected Behavior** (third-party compatibility limitation) |
| bkit Code Defect | **None** (design limitation, not bug) |
| Claude Code Defect | **Partial** (Agent Teams model propagation issue) |
| Fix Responsibility | bkit: Documentation + Guard, Anthropic: Agent Teams model propagation |
| CTO Team Agents Used | 8 agents (43~47 tool calls each, 41K~141K tokens) |
| Investigation Duration | ~6 minutes (parallel execution) |

### Verdict: NOT A BUG (Third-party API Compatibility Limitation)

bkit의 Agent Teams(`/pdca team`)는 Anthropic API(직접/Bedrock/Vertex) 환경에서 설계 및 검증되었습니다. Ollama 등 third-party provider와의 조합은 Claude Code Agent Teams의 **구조적 한계**로 인해 현재 안정적으로 동작하지 않습니다. 이는 bkit의 코드 결함이 아닌, Claude Code Agent Teams 자체의 third-party 호환성 미비에 기인합니다.

---

## 2. Investigation Team & Methodology

### 2.1 CTO Team 구성 (8 Specialist Agents)

| Agent | Mission | Key Findings |
|-------|---------|-------------|
| **CTO-1** (Explore) | bkit `/pdca team` 내부 동작 코드 분석 | PDCA Skill → CTO-Lead Agent → Task(subagent) 호출 체인 완전 추적 |
| **CTO-2** (Explore) | Claude Code Agent Teams API 요구사항 분석 | Model validation: opus/sonnet/haiku enum 하드코딩, subagent-start-handler.js model normalization |
| **CTO-3** (general-purpose) | Ollama ↔ Anthropic API 호환성 분석 | 10개 확인된 사실 + 5개 추론, 95% 모델 이름 미스매치 확신도 |
| **CTO-4** (general-purpose) | qwen3.5 모델 Tool Use 지원 현황 | 397B-A17B MoE, OpenAI 형식 네이티브, 5개 tool 임계값 문제 |
| **CTO-5** (general-purpose) | Claude Code GitHub 유사 이슈 조사 | 15개 관련 이슈 발견, #23561이 가장 유사 (동일 패턴) |
| **CTO-6** (Explore) | 400 에러 페이로드 역추적 분석 | 에러 응답 = Anthropic API 정규 형식, 7개 의심 포인트 특정 |
| **CTO-7** (Explore) | bkit Agent 설정 & 모델 의존성 분석 | 16개 전 에이전트 model 필드 분석, 의존성 맵 완성 |
| **CTO-8** (general-purpose) | 해결방안 & 권고사항 설계 | 5개 가설, 5개 해결방안, GitHub 응답 초안 |

### 2.2 조사 방법론

- **Code Tracing**: bkit 소스코드 전체 호출 체인 추적 (skills → agents → lib/team → hooks)
- **API Comparison**: Anthropic Messages API vs Ollama Anthropic 호환 레이어 구조적 차이 분석
- **GitHub Mining**: anthropics/claude-code + ollama/ollama 이슈 15건+ 교차 검증
- **Web Research**: Ollama 공식 문서, Claude Code 공식 문서, Qwen 공식 문서, 커뮤니티 블로그
- **Model Analysis**: qwen3.5:397b-cloud 사양, tool calling 능력, 알려진 제한사항 조사

---

## 3. Root Cause Analysis

### 3.1 Primary Root Cause: Model Alias Resolution Failure (확신도 95%)

bkit의 16개 에이전트는 frontmatter에 Anthropic 모델 별칭(alias)을 하드코딩합니다:

| Model Alias | Agent Count | Agents |
|-------------|:-----------:|--------|
| `model: opus` | 7 (44%) | cto-lead, code-analyzer, design-validator, enterprise-expert, gap-detector, infra-architect, security-architect |
| `model: sonnet` | 7 (44%) | bkend-expert, frontend-architect, pdca-iterator, pipeline-guide, product-manager, qa-strategist, starter-guide |
| `model: haiku` | 2 (12%) | qa-monitor, report-generator |

**에러 발생 메커니즘:**

```
[사용자] /pdca team myfeature
    │
    ▼
[bkit PDCA Skill] agents.team: bkit:cto-lead  (skills/pdca/SKILL.md:25)
    │
    ▼
[CTO-Lead Agent] model: opus  (agents/cto-lead.md:24)
    │
    ▼
[Claude Code 내부] "opus" → ANTHROPIC_DEFAULT_OPUS_MODEL 미설정
                         → 기본값 "claude-opus-4-6" 사용
    │
    ▼
[ANTHROPIC_BASE_URL] → Ollama Cloud (qwen3.5:397b-cloud 환경)
    │
    ▼
[Ollama] POST /v1/messages { "model": "claude-opus-4-6", ... }
         → "claude-opus-4-6" 모델 없음
         → 400 Bad Request: {"type":"error","error":{"type":"invalid_request_error","message":"bad request"}}
```

**핵심**: 사용자가 `ANTHROPIC_BASE_URL`만 설정하고, `ANTHROPIC_DEFAULT_OPUS_MODEL` / `ANTHROPIC_DEFAULT_SONNET_MODEL` / `ANTHROPIC_DEFAULT_HAIKU_MODEL`을 설정하지 않으면, Claude Code는 Anthropic 기본 모델 ID(`claude-opus-4-6`)를 Ollama에 그대로 전송합니다. Ollama에는 이 모델이 존재하지 않으므로 400 에러가 발생합니다.

### 3.2 Contributing Factors (부차적 원인 5개)

| # | 원인 | 확신도 | 심각도 | 설명 |
|---|------|:------:|:------:|------|
| CF-1 | Tool 정의 과다 전송 (259+ tools) | 85% | HIGH | Claude Code가 모든 API 요청에 전체 도구 정의를 포함. Qwen3 계열은 5개 초과 시 XML 폴백 ([#25857](https://github.com/anthropics/claude-code/issues/25857), [#6883](https://github.com/block/goose/issues/6883)) |
| CF-2 | max_tokens 제한 (Cloud free tier: 16,384) | 75% | HIGH | Claude Code 시스템 프롬프트(18KB+) + 259개 도구 정의 = 입력 토큰 초과 가능 ([#13089](https://github.com/ollama/ollama/issues/13089)) |
| CF-3 | Token counting 엔드포인트 미지원 | 50% | MEDIUM | `/v1/messages/count_tokens?beta=true` → 404, 반복 404가 Ollama 불안정 유발 ([#13949](https://github.com/ollama/ollama/issues/13949)) |
| CF-4 | Agent Teams 환경변수 미전파 | 50% | HIGH | tmux 스폰 경로에서 `ANTHROPIC_BASE_URL` 등이 자식 프로세스에 전달 안 됨 ([#23561](https://github.com/anthropics/claude-code/issues/23561)) |
| CF-5 | tool_use/tool_result 순서 불일치 | 60% | MEDIUM | Agent Teams 병렬 실행 시 블록 순서 뒤섞임 가능 ([#5747](https://github.com/anthropics/claude-code/issues/5747)) |

### 3.3 Evidence Classification

#### Confirmed Facts (확인된 사실)

| # | Fact | Source |
|---|------|--------|
| F-1 | Ollama v0.14.0+ Anthropic Messages API 호환 지원 | [Ollama Blog](https://ollama.com/blog/claude) |
| F-2 | bkit 16개 에이전트 전원 `model: opus/sonnet/haiku` 하드코딩 | bkit 코드베이스 직접 확인 (agents/*.md) |
| F-3 | Claude Code `model: opus`는 내부적으로 실제 model ID로 변환 | [Claude Code Docs](https://code.claude.com/docs/en/model-config) |
| F-4 | `ANTHROPIC_DEFAULT_OPUS_MODEL` 등으로 alias 오버라이드 가능 | [Claude Code Docs](https://code.claude.com/docs/en/model-config) |
| F-5 | `/v1/messages/count_tokens` 미지원 (404 반환) | [Ollama Issue #13949](https://github.com/ollama/ollama/issues/13949) |
| F-6 | Claude Code가 259개 도구를 한 번에 전송 | [Claude Code Issue #25857](https://github.com/anthropics/claude-code/issues/25857) |
| F-7 | Qwen3 계열 5개 초과 도구에서 XML 폴백 | [Goose Issue #6883](https://github.com/block/goose/issues/6883) |
| F-8 | Ollama Cloud free tier max_tokens = 16,384 | [Ollama Issue #13089](https://github.com/ollama/ollama/issues/13089) |
| F-9 | Agent Teams에서 동일 패턴 400 에러 이미 보고됨 | [Claude Code Issue #23561](https://github.com/anthropics/claude-code/issues/23561) |
| F-10 | Sub-agent model enum: `['sonnet', 'opus', 'haiku']` 하드코딩 | [Claude Code Issue #15249](https://github.com/anthropics/claude-code/issues/15249) |

#### Inferences (추론)

| # | Inference | Basis | Confidence |
|---|-----------|-------|:----------:|
| I-1 | Agent Teams spawn 시 `model: opus` → `claude-opus-4-6`으로 변환되어 Ollama에 전송, 400 에러 | F-2 + F-3 | 95% |
| I-2 | `ANTHROPIC_DEFAULT_*_MODEL` 환경변수로 모델 이름 문제 해결 가능 | F-4 | 90% |
| I-3 | 모델 이름 해결 후에도 259개 도구 XML 폴백 문제 잔존 | F-6 + F-7 | 85% |
| I-4 | max_tokens 제한은 시스템 프롬프트 + 도구 정의만으로 초과 가능 | F-8 | 75% |
| I-5 | 모든 문제 해결 후에도 Qwen3.5 tool calling 정확도가 Claude 수준 미달 | 모델 능력 차이 | 70% |

---

## 4. Affected Code Paths

### 4.1 bkit 내부 호출 체인

```
skills/pdca/SKILL.md (line 25)
  └─ agents.team: bkit:cto-lead
       └─ agents/cto-lead.md (line 24: model: opus)
            ├─ tools: Task(enterprise-expert)  → model: opus
            ├─ tools: Task(infra-architect)    → model: opus
            ├─ tools: Task(bkend-expert)       → model: sonnet
            ├─ tools: Task(frontend-architect) → model: sonnet
            ├─ tools: Task(security-architect) → model: opus
            ├─ tools: Task(product-manager)    → model: sonnet
            ├─ tools: Task(qa-strategist)      → model: sonnet
            │    ├─ Task(qa-monitor)           → model: haiku
            │    ├─ Task(gap-detector)         → model: opus
            │    └─ Task(code-analyzer)        → model: opus
            ├─ tools: Task(code-analyzer)      → model: opus
            ├─ tools: Task(gap-detector)       → model: opus
            ├─ tools: Task(report-generator)   → model: haiku
            └─ tools: Task(Explore)            → model: inherit
```

### 4.2 bkit Team Infrastructure 파일

| File | Role | Relevant Lines |
|------|------|---------------|
| `skills/pdca/SKILL.md` | /pdca team 진입점 | L25 (agents.team), L147-194 (team subcommand) |
| `agents/cto-lead.md` | CTO 오케스트레이터 | L24 (model: opus), L32-41 (11 Task tools) |
| `lib/team/coordinator.js` | Team 가용성 확인 | `isTeamModeAvailable()`, `getTeamConfig()` |
| `lib/team/orchestrator.js` | Team 스폰 | `generateSpawnTeamCommand()` |
| `lib/team/strategy.js` | Team 전략 정의 | Dynamic: 3, Enterprise: 5 teammates |
| `lib/team/state-writer.js` | Agent 상태 기록 | model 기본값 'sonnet' (L191) |
| `scripts/subagent-start-handler.js` | SubagentStart hook | L61-67: model normalization (opus/sonnet/haiku only) |
| `bkit.config.json` | Team 설정 | team.enabled: true, team.maxTeammates: 5 |

---

## 5. Similar Issues in Claude Code GitHub

### 5.1 가장 유사한 이슈

| Issue | Title | Similarity | Status |
|-------|-------|:----------:|:------:|
| [#23561](https://github.com/anthropics/claude-code/issues/23561) | Agent Teams teammates spawned with non-Bedrock model ID | **99%** | CLOSED |
| [#15249](https://github.com/anthropics/claude-code/issues/15249) | InputValidationError: Expected 'sonnet'\|'opus'\|'haiku' | 90% | CLOSED |
| [#25857](https://github.com/anthropics/claude-code/issues/25857) | Small models fail with 259 tool definitions | 80% | CLOSED |
| [#5680](https://github.com/anthropics/claude-code/issues/5680) | Sub agents not getting custom model | 75% | CLOSED |
| [#25146](https://github.com/anthropics/claude-code/issues/25146) | Support multiple API endpoints for agents | 70% | OPEN |
| [ollama#13949](https://github.com/ollama/ollama/issues/13949) | API Compatibility Issue with Claude Code | 65% | OPEN |

### 5.2 Pattern Recognition

**Issue #23561과 Issue #35는 동일한 근본 원인**을 공유합니다:
- Agent Teams가 팀원 프로세스를 스폰할 때 Anthropic-native model ID를 사용
- `--model claude-opus-4-6` 형식으로 CLI 플래그가 전달됨
- Bedrock/Vertex/Ollama 등 non-Anthropic 환경에서 해당 model ID 인식 불가
- `ANTHROPIC_DEFAULT_*_MODEL` 환경변수가 Agent Teams 스폰 경로에서 무시됨

Anthropic 직원이 #23561에 "Fix coming in the next release" 코멘트했으나 완전 해결되지 않은 상태입니다.

---

## 6. qwen3.5:397b-cloud Model Assessment

### 6.1 Model Specifications

| Spec | Value |
|------|-------|
| Total Parameters | 397B |
| Active Parameters | 17B (MoE: 10 routed + 1 shared expert per token) |
| Architecture | Hybrid MoE + Gated DeltaNet (3:1 linear:softmax attention) |
| Context Window | 256K tokens |
| Max Output | 32,768 tokens (free tier: 16,384) |
| Tool Calling | Supported (OpenAI format native, Anthropic via Ollama) |
| Multimodal | Text + Image + Video |
| Release Date | 2026-02-16 |

### 6.2 Tool Calling Compatibility Matrix

| Capability | Claude (Anthropic) | qwen3.5 via Ollama | Gap |
|------------|:------------------:|:------------------:|:---:|
| Basic tool_use | Full | Supported | Low |
| 5+ tool definitions | Full | Unstable (XML fallback) | HIGH |
| 20+ tool definitions | Full | Likely fails | CRITICAL |
| 259 tool definitions | Full | Fails | CRITICAL |
| tool_choice: "any" | Full | Documented, unverified | MEDIUM |
| Multi-turn tool loops | Full | Unstable (JSON parse) | HIGH |
| Parallel tool_use | Full | Limited | HIGH |
| tool_use_id matching | Full | Occasional mismatch | MEDIUM |

### 6.3 Agent Teams Compatibility Verdict

| Feature | Anthropic API | Ollama + qwen3.5 |
|---------|:------------:|:-----------------:|
| Basic PDCA (/pdca plan, design) | Full | Workable |
| Single Agent (/pdca analyze) | Full | Limited |
| Agent Teams (/pdca team) | Full | **Not Supported** |
| CTO Team (8+ agents) | Full | **Not Supported** |

---

## 7. Ollama Anthropic Compatibility Gap Analysis

### 7.1 Supported vs Unsupported

**Supported:**
- `POST /v1/messages` (streaming + non-streaming)
- System prompts, multi-turn, vision, thinking blocks
- Tool calling (`tools`, `tool_use`, `tool_result`, `tool_choice`)
- `temperature`, `top_p`, `stop_sequences`, `max_tokens`

**Not Supported:**
- `POST /v1/messages/count_tokens` (Claude Code internally uses this)
- Batch API
- Prompt caching
- Citations / metadata
- Model alias resolution (opus → claude-opus-4-6)

### 7.2 Ollama Cloud-Specific Limitations

| Limitation | Impact on Agent Teams |
|-----------|----------------------|
| max_tokens: 16,384 (free tier) | System prompt + 259 tools > limit |
| Rate limits (hourly/weekly) | Multi-agent concurrent requests exceed |
| Cloud proxy latency | Agent Teams timeout risk |
| Model availability | Cloud-only tags may have different capabilities |

---

## 8. Recommended Actions

### 8.1 Immediate (P0): Issue #35 Response & Documentation

**Action**: GitHub Issue #35에 분석 결과와 Workaround 안내

**Workaround (즉시 적용 가능):**
```bash
export ANTHROPIC_BASE_URL="http://localhost:11434"  # or Ollama Cloud URL
export ANTHROPIC_AUTH_TOKEN="ollama"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="qwen3.5:397b-cloud"
export ANTHROPIC_DEFAULT_SONNET_MODEL="qwen3.5:397b-cloud"
export ANTHROPIC_DEFAULT_OPUS_MODEL="qwen3.5:397b-cloud"
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

**Caveats:**
- 위 설정으로도 Agent Teams의 안정적 동작은 보장되지 않음
- 단일 에이전트 PDCA(`/pdca plan`, `/pdca design`)는 Ollama에서 동작 가능
- Agent Teams는 Anthropic API 전용 기능으로 권장

### 8.2 Short-term (P1): Environment Detection Guard

**Target**: `lib/team/coordinator.js`의 `isTeamModeAvailable()`

**Logic**: `ANTHROPIC_BASE_URL` 설정 시 `ANTHROPIC_DEFAULT_*_MODEL` 환경변수 3개 모두 설정되었는지 확인. 미설정 시 명확한 에러 메시지와 함께 팀 모드 비활성화.

**Estimated effort**: 2-4 hours

### 8.3 Mid-term (P2): Graceful Degradation

**Logic**: Agent Teams 초기화 실패(400/404) 시 단일 에이전트 PDCA 모드로 자동 전환

**Estimated effort**: 4-8 hours

### 8.4 Mid-term (P2): Conditional Model Inheritance

**Logic**: `ANTHROPIC_BASE_URL` 감지 시 에이전트의 `model:` 필드를 무시하고 `inherit` 동작으로 전환하는 옵션

**Trade-off**: bkit의 의도적 설계(역할별 모델 차등 배치)를 해칠 수 있음

**Estimated effort**: 1-2 days

### 8.5 Long-term (P3): Provider-Aware Compatibility Matrix

**Action**: bkit 공식 지원 환경 매트릭스 관리

| Feature | Anthropic | Bedrock/Vertex | Ollama | LiteLLM |
|---------|:---------:|:--------------:|:------:|:-------:|
| Skills (27) | Full | Full | Full | Full |
| Agents (16) | Full | Full | Limited | Limited |
| Hooks (10) | Full | Full | Full | Full |
| Agent Teams | Full | Full | Not Supported | Not Supported |
| CTO Team | Full | Full | Not Supported | Not Supported |

---

## 9. Principle Statement

- bkit의 **핵심 지원 환경은 Anthropic API** (직접/Bedrock/Vertex)
- Third-party 호환성은 **best-effort** 수준 (공식 보증 아님)
- Agent Teams/CTO Team은 **Anthropic API 전용 기능**으로 문서화
- Ollama 사용자에게는 **단일 에이전트 PDCA** 사용 권장
- Claude Code Agent Teams 자체가 `EXPERIMENTAL` 상태이므로, third-party 지원은 Anthropic 측 안정화 이후 재평가

---

## 10. References

### bkit Code
- `agents/cto-lead.md` - CTO Lead agent (model: opus)
- `agents/*.md` (16 files) - All agent configurations
- `skills/pdca/SKILL.md` - /pdca team skill definition
- `lib/team/coordinator.js` - Team mode availability check
- `lib/team/orchestrator.js` - Team spawn logic
- `lib/team/strategy.js` - Team strategy (Dynamic/Enterprise)
- `lib/team/state-writer.js` - Agent state persistence
- `scripts/subagent-start-handler.js` - SubagentStart hook handler
- `bkit.config.json` - Team configuration

### Claude Code GitHub Issues
- [#23561](https://github.com/anthropics/claude-code/issues/23561) - Agent Teams model ID propagation (most similar)
- [#15249](https://github.com/anthropics/claude-code/issues/15249) - Sub-agent model enum validation
- [#25857](https://github.com/anthropics/claude-code/issues/25857) - 259 tool definitions flooding
- [#5747](https://github.com/anthropics/claude-code/issues/5747) - 400 error during parallel sub-agent
- [#25146](https://github.com/anthropics/claude-code/issues/25146) - Multiple API endpoints for agents
- [#22879](https://github.com/anthropics/claude-code/issues/22879) - tool_choice config per model
- [#5680](https://github.com/anthropics/claude-code/issues/5680) - Sub agents custom model
- [#4852](https://github.com/anthropics/claude-code/issues/4852) - LiteLLM sub-agent failure

### Ollama GitHub Issues
- [#13949](https://github.com/ollama/ollama/issues/13949) - API compatibility with Claude Code
- [#13089](https://github.com/ollama/ollama/issues/13089) - Cloud max_tokens limitation
- [#11662](https://github.com/ollama/ollama/issues/11662) - Qwen3 tool calling parse failure
- [#11621](https://github.com/ollama/ollama/issues/11621) - Qwen3-Coder missing tool template
- [#6883](https://github.com/block/goose/issues/6883) - Qwen3-coder XML fallback with many tools

### Official Documentation
- [Claude Code Model Configuration](https://code.claude.com/docs/en/model-config)
- [Claude Code Agent Teams](https://code.claude.com/docs/en/agent-teams)
- [Claude Code Subagents](https://code.claude.com/docs/en/sub-agents)
- [Ollama Anthropic Compatibility](https://docs.ollama.com/api/anthropic-compatibility)
- [Ollama Claude Code Integration](https://docs.ollama.com/integrations/claude-code)
- [Qwen3.5 on Ollama](https://ollama.com/library/qwen3.5:397b-cloud)
- [Qwen Function Calling](https://qwen.readthedocs.io/en/latest/framework/function_call.html)

### Community Resources
- [claude-code-router](https://github.com/musistudio/claude-code-router) - Multi-provider routing
- [claude-code-ollama-proxy](https://github.com/mattlqx/claude-code-ollama-proxy) - Ollama-specific proxy
- [claude-code-proxy](https://github.com/nielspeter/claude-code-proxy) - Lightweight HTTP proxy
