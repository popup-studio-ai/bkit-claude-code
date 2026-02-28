# CTO Team Memory Management Guide

> bkit v1.5.8 | Claude Code v2.1.63+ 권장
> CTO-Led Agent Teams 패턴에서의 multi-agent 메모리 관리 best practice

---

## 1. Memory Systems Overview

bkit CTO Team 패턴은 3가지 독립된 메모리 시스템을 활용합니다:

| System | Path | Format | Writer | Purpose |
|--------|------|:------:|--------|---------|
| CC auto-memory | ~/.claude/projects/*/memory/MEMORY.md | Markdown | Claude (자동) | 세션 간 학습 컨텍스트 축적 |
| bkit memory-store | {project}/docs/.bkit-memory.json | JSON | bkit hooks (프로그래밍) | PDCA 상태, 세션 카운터 |
| bkit agent-memory | {project}/.claude/agent-memory/{agent}/MEMORY.md | Markdown | Claude agents (자동) | 에이전트별 학습 메모 |

**핵심**: 3개 시스템은 서로 다른 경로, 형식, 작성자를 가지며 **충돌 없음**.

---

## 2. CTO Team Agent Distribution

| Model | Count | Agents | Memory Scope |
|-------|:-----:|--------|:------------:|
| opus | 7 | cto-lead, code-analyzer, design-validator, gap-detector, enterprise-expert, infra-architect, security-architect | project |
| sonnet | 7 | bkend-expert, pipeline-guide, starter-guide, pdca-iterator, qa-strategist, frontend-architect, product-manager | project/user |
| haiku | 2 | report-generator, qa-monitor | project |

---

## 3. Memory Optimization (v2.1.50 + v2.1.59)

### 3.1 Subagent Task State Release (v2.1.59)

CC v2.1.59에서 **완료된 subagent의 task state가 자동 해제**됩니다:

- Plan phase agent 완료 → state 해제 → Design phase agent에 메모리 여유 확보
- Enterprise 5 teammates 중 완료된 teammate의 state가 즉시 GC
- 장시간 PDCA 사이클 (Plan→Design→Do→Check→Act)에서 누적 메모리 감소

### 3.2 Memory Leak Fixes (v2.1.50)

v2.1.50에서 수정된 9건의 메모리 누수:
1. Agent Teams task GC
2. TaskOutput buffer cleanup
3. CircularBuffer overflow
4. ChildProcess cleanup
5. LSP connection cleanup
6. File history trimming
7-9. 기타 minor leaks

---

## 4. Best Practices

### 4.1 Agent 수 권장 사항

| Level | Max Teammates | Recommended | Reason |
|-------|:------------:|:-----------:|--------|
| Dynamic | 3 | 2-3 | developer + qa + frontend |
| Enterprise | 5 | 3-5 | architect + developer + qa + reviewer + security |

**팁**: 전체 PDCA 사이클을 한 세션에서 실행할 때, 한 번에 활성 agent 수를 3개 이내로 유지하면 메모리 효율이 좋습니다.

### 4.2 장시간 세션 관리

1. **Phase별 Agent 재구성**: 동일 agent를 전 phase에 걸쳐 유지하기보다, phase 전환 시 `shouldRecomposeTeam()`으로 필요한 agent만 재구성
2. **중간 세션 정리**: `/pdca team cleanup` 후 재시작으로 메모리 초기화 가능
3. **auto-memory 활용**: 세션 간 컨텍스트는 auto-memory가 자동 보존하므로, 세션을 분리해도 학습 내용 유지

### 4.3 Agent Memory 관리

- agent-memory 파일은 200줄 제한 (system prompt에 전량 주입)
- 오래된 내용은 주기적으로 정리 필요
- `MEMORY.md` 파일 직접 편집 가능

---

## 5. Known Issues and Monitoring

| Issue | Status | Impact | Workaround |
|-------|:------:|--------|-----------|
| #25131 Agent Teams lifecycle | Open | Team 종료 시 cleanup 불완전 | `/pdca team cleanup` 수동 실행 |
| #24044 MEMORY.md 이중 로딩 | Open | System prompt 크기 증가 | 모니터링, 심각하면 auto-memory 비활성화 |
| #24130 Memory concurrency | Open | 동시 쓰기 시 데이터 손실 가능 | 서로 다른 파일에 쓰므로 bkit은 안전 |
| #27281 Agent infinite loop | Open | Agent가 무한 반복 | ctrl+f로 강제 종료 |

---

## 6. Configuration Reference

### bkit.config.json team 섹션

```json
{
  "team": {
    "enabled": true,
    "displayMode": "in-process",
    "maxTeammates": 5,
    "delegateMode": false,
    "ctoAgent": "cto-lead",
    "levelOverrides": {
      "Dynamic": { "maxTeammates": 3 },
      "Enterprise": { "maxTeammates": 5 }
    }
  }
}
```

### 환경 변수

| Variable | Purpose | Required |
|----------|---------|:--------:|
| `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` | Agent Teams 활성화 | Yes |
| `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` | auto-memory 비활성화 | No (기본: 활성) |
