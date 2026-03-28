# CC v2.1.85~v2.1.86 영향 분석 보고서

> **Status**: ✅ Complete
>
> **Project**: bkit Vibecoding Kit
> **Version**: v2.0.6 (분석 시점)
> **Author**: CC Version Analysis Workflow
> **Completion Date**: 2026-03-28
> **PDCA Cycle**: #25

---

## Executive Summary

### 1.1 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **기능** | CC v2.1.85 + v2.1.86 (2개 릴리스) 영향 분석 |
| **시작일** | 2026-03-28 |
| **완료일** | 2026-03-28 |
| **기간** | 1회 분석 |
| **설치 CC 버전** | v2.1.86 |
| **분석 범위** | v2.1.84 → v2.1.86 |
| **v2.1.85 발행일** | 2026-03-26 |
| **v2.1.86 발행일** | 2026-03-27 |

### 1.2 성과 요약

```
┌──────────────────────────────────────────────────────┐
│  CC v2.1.85 + v2.1.86 영향 분석 결과                    │
├──────────────────────────────────────────────────────┤
│  📊 총 변경 건수:           ~57건 (v2.1.85 ~31 + v2.1.86 ~26) │
│  🆕 신규 기능:              11건                       │
│  🔧 버그 수정:              32건                       │
│  📈 개선/성능:              14건                       │
│  ⚠️  Breaking Changes:      0건 (bkit 기준)            │
│  🔴 신규 hook events:       0건 (CC 총 25, 변동 없음)   │
│  🔴 신규 hook 기능:         2건 (if 필드, AskUserQuestion) │
│  📝 시스템 프롬프트:        v2.1.85 +172 / v2.1.86 -157 │
│                              (순 변동: +15 tokens)      │
│  📋 신규 ENH 기회:          5건 (ENH-160~164)          │
│  🔢 연속 호환 릴리스:        52개 (v2.1.34~v2.1.86)    │
│  🔢 자동 수혜:              8건                        │
│  🔢 bkit 직접 영향:         2건 (config writes fix,     │
│                              프로젝트 외부 파일 접근 fix) │
└──────────────────────────────────────────────────────┘
```

### 1.3 전달된 가치

| 관점 | 내용 |
|------|------|
| **문제** | CC v2.1.85~v2.1.86에서 Hook `if` 필드 신규 추가, config disk writes 매 skill 호출 발생 fix, Read tool 토큰 절감, /skills description 250자 cap 등 ~57건 변경 |
| **해결 방법** | GitHub release notes + CHANGELOG.md + npm + 이슈 트래커 + bkit 코드베이스 교차 검증 |
| **기능/UX 효과** | Hook `if` 필드로 조건부 hook 실행 기반 확보, config writes fix로 37 skills 성능 개선, Read tool compact format으로 토큰 절감, /skills 250자 cap으로 description 점검 필요 |
| **핵심 가치** | 52개 연속 호환 릴리스 확인 + ENH 5건 도출(P1 1건/P2 1건/P3 3건) + 자동 수혜 8건 + bkit 직접 영향 2건(자동 해결) |

---

## 2. Version Verification

| 항목 | v2.1.85 | v2.1.86 |
|------|---------|---------|
| npm 발행 | 2026-03-26 | 2026-03-27 |
| GitHub Release | ✅ 확인 | ✅ 확인 |
| 스킵 여부 | **발행됨** | **발행됨** (현재 설치 버전) |

**참고**: v2.1.82는 미발행(스킵), v2.1.85와 v2.1.86은 모두 정상 발행됨.

---

## 3. Impact Summary

| 카테고리 | 건수 | HIGH | MEDIUM | LOW |
|----------|------|------|--------|-----|
| Features | 11 | 3 | 2 | 6 |
| Bug Fixes | 32 | 4 | 8 | 20 |
| Performance | 14 | 1 | 7 | 6 |
| System Prompt | 2 releases | — | — | — |
| **합계** | **~57** | **8** | **17** | **32** |

**bkit 직접 영향**: 2건 (B-86-3 config writes fix, B-86-2 프로젝트 외부 파일 fix) — 모두 자동 수혜
**bkit ENH 기회**: 5건 (ENH-160~164)
**자동 수혜**: 8건
**코드 변경 필요**: 1건 (ENH-162: skills description 250자 점검)

---

## 4. v2.1.85 변경사항 분류 (~31건)

### 4.1 신규 기능 (8건)

| # | ID | 변경 | Impact | bkit 영향 |
|---|-----|------|--------|----------|
| 1 | F-85-1 | **Hook `if` 필드**: permission rule syntax (`Bash(git *)`) 로 hook 실행 조건 필터링 | **HIGH** | **ENH-160** — 향후 hook 설계 가이드 문서화 |
| 2 | F-85-2 | **PreToolUse AskUserQuestion updatedInput**: headless Q&A 자동 응답 가능 | **HIGH** | **ENH-161** — ENH-138 선행 필요 |
| 3 | F-85-3 | `CLAUDE_CODE_MCP_SERVER_NAME/URL` env vars | MEDIUM | 영향 없음 |
| 4 | F-85-4 | Hook `if` — 4개 tool events 전용 (PreToolUse, PostToolUse, PostToolUseFailure, PermissionRequest) | HIGH | F-85-1과 동일 |
| 5 | F-85-5 | Timestamp markers in `/loop` + `CronCreate` | LOW | 영향 없음 |
| 6 | F-85-6 | Plugins blocked by `managed-settings.json` org policy | MEDIUM | **ENH-164** — enterprise 문서화 |
| 7 | F-85-7 | Deep link queries 5,000자 지원 | LOW | 영향 없음 |
| 8 | F-85-8 | `OTEL_LOG_TOOL_DETAILS=1` 게이팅 | LOW | 영향 없음 |

### 4.2 버그 수정 (18건)

| # | ID | 변경 | Impact | bkit 영향 |
|---|-----|------|--------|----------|
| 1 | B-85-1 | **`/compact` "context exceeded" fix** | **HIGH** | 자동 수혜 — PreCompact/PostCompact 안정성 향상 |
| 2 | B-85-2 | `/plugin enable/disable` 경로 불일치 fix | MEDIUM | 자동 수혜 |
| 3 | B-85-3 | `--worktree` non-git 에러 fix | LOW | 영향 없음 |
| 4 | B-85-4 | `deniedMcpServers` claude.ai 차단 fix | LOW | 영향 없음 |
| 5 | B-85-5 | `switch_display` 멀티모니터 fix | LOW | 영향 없음 |
| 6 | B-85-6 | OTEL exporter `none` 크래시 fix | LOW | 영향 없음 |
| 7 | B-85-7 | MCP step-up authorization (403) fix | MEDIUM | 영향 없음 |
| 8 | B-85-8 | Remote session 메모리 누수 fix | MEDIUM | 자동 수혜 |
| 9 | B-85-9 | ECONNRESET fresh TCP 연결 fix | MEDIUM | 자동 수혜 |
| 10 | B-85-10 | Slash command 프롬프트 stuck fix | LOW | 영향 없음 |
| 11 | B-85-11 | Python SDK MCP `type:'sdk'` drop fix | LOW | 영향 없음 |
| 12 | B-85-12 | SSH/VSCode raw key sequences fix | LOW | 영향 없음 |
| 13 | B-85-13 | Remote Control "Requires Action" stuck fix | LOW | 영향 없음 |
| 14 | B-85-14 | shift+enter typeahead fix | LOW | 영향 없음 |
| 15 | B-85-15 | 스크롤 stale content bleeding fix | LOW | 영향 없음 |
| 16 | B-85-16 | Kitty keyboard protocol terminal exit fix | MEDIUM | 자동 수혜 |
| 17 | B-85-17 | Diff syntax highlighting non-native fix | LOW | 영향 없음 |
| 18 | B-85-18 | MCP OAuth RFC 9728 준수 | LOW | 영향 없음 |

### 4.3 개선/성능 (5건)

| # | ID | 변경 | Impact | bkit 영향 |
|---|-----|------|--------|----------|
| 1 | P-85-1 | @-mention file autocomplete 성능 향상 | MEDIUM | 자동 수혜 |
| 2 | P-85-2 | PowerShell 위험 명령 감지 개선 | LOW | 영향 없음 |
| 3 | P-85-3 | WASM yoga-layout → TypeScript 교체 (스크롤 성능) | MEDIUM | 자동 수혜 |
| 4 | P-85-4 | Large session compaction UI stutter 감소 | MEDIUM | 자동 수혜 |
| 5 | P-85-5 | Trailing space after `[Image #N]` | LOW | 영향 없음 |

### 4.4 시스템 프롬프트 변경 (+172 tokens)

| 변경 | 상세 |
|------|------|
| **신규** | "Production Reads" 차단 카테고리 — autonomous agent의 production 시스템 읽기 차단 |
| **신규** | Fork naming 가이드 — teams panel에서 fork 식별용 `name` 필드 |
| **신규** | ultraplan 프롬프트 mechanics 비공개 지침 |
| **변경** | Remote shell writes/reads 분리 — 읽기 전용 검사 별도 승인 |

---

## 5. v2.1.86 변경사항 분류 (~26건)

### 5.1 신규 기능 (3건)

| # | ID | 변경 | Impact | bkit 영향 |
|---|-----|------|--------|----------|
| 1 | F-86-1 | `X-Claude-Code-Session-Id` header | LOW | 영향 없음 |
| 2 | F-86-2 | `.jj`(Jujutsu), `.sl`(Sapling) VCS 디렉토리 제외 | LOW | 영향 없음 |
| 3 | F-86-3 | **Read tool compact line-number + 중복 re-read 제거** | **HIGH** | 자동 수혜 — 전체 세션 토큰 절감 |

### 5.2 버그 수정 (14건)

| # | ID | 변경 | Impact | bkit 영향 |
|---|-----|------|--------|----------|
| 1 | B-86-1 | `--resume` tool_use ids 에러 fix | MEDIUM | 자동 수혜 |
| 2 | B-86-2 | **Write/Edit/Read 프로젝트 루트 외부 파일 fix** | **HIGH** | **bkit 직접 영향** — conditional skills 시 `~/.claude/CLAUDE.md` 접근 |
| 3 | B-86-3 | **Config disk writes 매 skill 호출 fix** | **HIGH** | **bkit 직접 영향** — 37 skills 성능 저하 해결 |
| 4 | B-86-4 | `/feedback` OOM 크래시 fix | MEDIUM | 자동 수혜 |
| 5 | B-86-5 | `--bare` MCP tools drop + mid-turn 유실 fix | MEDIUM | ENH-138 관련 |
| 6 | B-86-6 | OAuth URL `c` shortcut 절단 fix | LOW | 영향 없음 |
| 7 | B-86-7 | Masked input token 줄바꿈 누출 fix | LOW | 보안 수혜 |
| 8 | B-86-8 | **Marketplace plugin scripts "Permission denied" fix** | **HIGH** | bkit은 `node` 실행이라 영향 낮음 |
| 9 | B-86-9 | Statusline 다른 세션 모델 표시 fix | LOW | 영향 없음 |
| 10 | B-86-10 | Scroll auto-follow fix | LOW | 영향 없음 |
| 11 | B-86-11 | `/plugin` uninstall `n` 키 fix | LOW | 영향 없음 |
| 12 | B-86-12 | Enter 후 빈 화면 regression fix | LOW | 영향 없음 |
| 13 | B-86-13 | `ultrathink` 힌트 잔류 fix | LOW | 영향 없음 |
| 14 | B-86-14 | Markdown/highlight render cache 메모리 누수 fix | MEDIUM | 자동 수혜 |

### 5.3 개선/성능 (9건)

| # | ID | 변경 | Impact | bkit 영향 |
|---|-----|------|--------|----------|
| 1 | P-86-1 | macOS keychain cache 5s → 30s (startup 개선) | MEDIUM | 자동 수혜 |
| 2 | P-86-2 | @-mention 파일 토큰 절감 (JSON-escape 제거) | MEDIUM | 자동 수혜 |
| 3 | P-86-3 | Bedrock/Vertex/Foundry prompt cache hit rate 개선 | MEDIUM | 자동 수혜 (3P) |
| 4 | P-86-4 | Memory 파일명 hover highlight + click open | LOW | 영향 없음 |
| 5 | P-86-5 | **/skills description 250자 cap** | MEDIUM | **ENH-162** — 34/36 skills 초과 확인 |
| 6 | P-86-6 | `/skills` 알파벳 정렬 | LOW | 영향 없음 |
| 7 | P-86-7 | Auto mode "unavailable for your plan" 메시지 개선 | LOW | 영향 없음 |
| 8 | P-86-8 | [VSCode] "Not responding" 잘못 표시 fix | LOW | 영향 없음 |
| 9 | P-86-9 | [VSCode] Max plan Sonnet 기본값 regression fix | MEDIUM | 영향 없음 |

### 5.4 시스템 프롬프트 변경 (-157 tokens)

| 변경 | 상세 |
|------|------|
| **제거** | brute-forcing 대안 고려 가이드 |
| **제거** | Bash tool 명확한 명령 설명 지침 간소화 |
| **변경** | general-purpose agent 프롬프트 강화 |
| **변경** | no-premature-abstractions 확장 |
| **변경** | 임시 파일 가이드 간소화 (`$TMPDIR` 직접 사용) |
| **변경** | Edit tool 줄 번호 prefix → 동적 참조 |

---

## 6. ENH Opportunities

### ENH-160: Hook `if` 필드 활용 문서화 (P2)

| 항목 | 내용 |
|------|------|
| CC Feature | F-85-1, F-85-4: Hook conditional `if` field |
| Priority | P2 (Medium) |
| 근거 | 현재 hooks.json 변경 불필요. 향후 새 hook 추가 시 `if` 활용 가이드로 문서화 가치 |
| YAGNI | ✅ 통과 — 문서화만. bkit unified-bash-pre.js는 내부에서 모든 Bash 명령 검사하므로 현재 `if` 적용 부적절 |
| 구현 범위 | context-engineering.md에 `if` 필드 사용 가이드 추가 |
| 추정 LOC | +20 (문서만) |

### ENH-161: PreToolUse AskUserQuestion 자동 응답 (P3)

| 항목 | 내용 |
|------|------|
| CC Feature | F-85-2: PreToolUse AskUserQuestion updatedInput |
| Priority | P3 (Low) — ENH-138 선행 필요 |
| 근거 | headless/CI 모드에서만 의미. --bare 가이드 미구현 상태에서 단독 가치 없음 |
| YAGNI | ✅ 통과 (Monitor) |
| 판정 | ENH-138과 함께 진행 |

### ENH-162: Skills Description 250자 점검 (P1 ⬆️)

| 항목 | 내용 |
|------|------|
| CC Feature | P-86-5: /skills description 250자 cap |
| Priority | **P1 (승격)** — 원래 P2였으나 실사 결과 34/36 skills 초과 |
| 근거 | /skills 목록에서 34개 skill description이 250자로 잘림 → 사용자가 skill 목적 파악 어려움 |
| YAGNI | ✅ 통과 — 실측 데이터 기반 |
| 구현 범위 | 34개 SKILL.md description 첫 250자 내에 핵심 정보 배치 |
| 추정 LOC | ~50 (34 files × description 수정) |

#### ENH-162 상세 — 250자 초과 Skills (34/36건)

| Skill | 현재 길이 |
|-------|----------|
| enterprise | 944 |
| dynamic | 923 |
| plan-plus | 909 |
| starter | 877 |
| cc-version-analysis | 818 |
| claude-code-learning | 799 |
| development-pipeline | 877 |
| phase-8-review | 836 |
| pdca | 715 |
| ... (34건 전체 초과) | 504~944 |

**250자 이내**: skill-create (235), skill-status (239) — 2건만 통과

### ENH-163: /compact Context Exceeded Fix 활용 (P3)

| 항목 | 내용 |
|------|------|
| CC Feature | B-85-1: /compact "context exceeded" fix |
| Priority | P3 (자동 수혜) |
| YAGNI | 코드 변경 불필요 |

### ENH-164: Org Policy Plugin Blocking 문서화 (P3)

| 항목 | 내용 |
|------|------|
| CC Feature | F-85-6: managed-settings.json org policy |
| Priority | P3 (Monitor) |
| YAGNI | ✅ 통과 — enterprise 고객 요청 시 대응 |

---

## 7. 기존 ENH 영향 재검토

| 기존 ENH | v2.1.85-86 영향 | 변경 사항 |
|----------|-----------------|----------|
| ENH-134 (skills effort) | 영향 없음 | 여전히 P0 미구현 |
| ENH-138 (--bare CI/CD) | B-86-5 (--bare MCP fix) | --bare 안정성 향상, 가이드 작성 시 반영 |
| ENH-143 (병렬 agent spawn) | 영향 없음 | #37520 여전히 OPEN, 관련 이슈 추가 |
| ENH-148 (SessionStart env) | 영향 없음 | #37729 여전히 OPEN |
| **ENH-154 (#38651 Stop hook -p)** | **CLOSED** | v2.1.84에서 수정 확인, 사용자 보고 |

### 기존 이슈 상태 변경

| 이슈 | 이전 상태 | 현재 상태 | 비고 |
|------|----------|----------|------|
| #38651 (Stop hook -p) | OPEN (monitor) | **사실상 RESOLVED** (v2.1.84) | ENH-154 종료 |
| #38655 (fake plugin tip) | OPEN (보안) | **FALSE ALARM** | 합법 플러그인 확인 |
| #37520 (병렬 agent OAuth) | OPEN | OPEN (**악화**) | 관련 이슈 #38752, #40047 추가 |

---

## 8. GitHub Issues 모니터링 업데이트

| Issue | 상태 | v2.1.85-86 변경 |
|-------|------|----------------|
| #29423 (task subagents ignore CLAUDE.md) | **OPEN** | 변동 없음 |
| #34197 (CLAUDE.md ignored) | **OPEN** | 변동 없음 |
| #37520 (병렬 agent OAuth 401) | **OPEN** | 관련 이슈 추가 (#38752, #40047) |
| #37745 (PreToolUse + skip-permissions) | **OPEN** | 변동 없음 |
| #38651 (Stop hook -p 모드) | **사실상 RESOLVED** | v2.1.84에서 수정 확인 |
| #38655 (fake plugin install tip) | **FALSE ALARM** | 합법 플러그인 |
| #37729 (SessionStart env /clear) | **OPEN** | 변동 없음 |
| #37730 (subagent permission 미상속) | **OPEN** | 변동 없음 |

---

## 9. Component Mapping (CC 변경 → bkit 컴포넌트)

### 9.1 HIGH Impact Changes

| CC 변경 | ID | bkit 컴포넌트 | 영향 분류 | 상세 |
|---------|-----|--------------|----------|------|
| **Hook `if` 필드** | F-85-1 | hooks/hooks.json | Enhancement | 조건부 hook 실행 기반. 현재 변경 불필요, 향후 가이드 |
| **AskUserQuestion updatedInput** | F-85-2 | hooks/scripts/ | Enhancement (대기) | headless Q&A. ENH-138 선행 |
| **/compact context exceeded fix** | B-85-1 | hooks/ (PreCompact, PostCompact) | 자동 수혜 | compact 실패 시 hook 미실행 방지 |
| **Read tool compact format** | F-86-3 | 전체 세션 | 자동 수혜 | 토큰 절감 |
| **Config disk writes fix** | B-86-3 | 전체 (37 skills) | **bkit 직접 영향** | 매 skill 호출 불필요 I/O 제거 |
| **프로젝트 외부 파일 fix** | B-86-2 | conditional skills | **bkit 직접 영향** | ~/.claude/CLAUDE.md 접근 |
| **Plugin Permission denied fix** | B-86-8 | hooks/scripts/ | 낮은 영향 | bkit은 node 실행 방식 |
| **/skills description 250자 cap** | P-86-5 | 37 x skills/*/SKILL.md | **ENH-162** | 34/36 skills 초과 |

---

## 10. Compatibility Assessment

| 항목 | 상태 |
|------|------|
| Breaking changes | **0건** (bkit 기준) |
| 연속 호환 릴리스 | **52번째** (v2.1.34 ~ v2.1.86) |
| Migration 필요 | **NO** |
| CC 권장 버전 | **v2.1.86+** |
| plugin.json engines | `">=2.1.78"` 유지 (변경 불필요) |
| Hook events | CC 25개, bkit 18개 (변동 없음) |
| CC tools | 30개 (변동 없음) |

**v2.1.86 업그레이드 강력 권장 이유**:
1. B-86-3: config disk writes fix → bkit 37 skills 성능 개선
2. B-86-2: 프로젝트 외부 파일 접근 fix → conditional skills 안정성
3. B-85-1: /compact context exceeded fix → PreCompact/PostCompact 안정성
4. F-86-3: Read tool 토큰 절감 → 전체 세션 효율성 향상
5. B-86-14: 장시간 세션 메모리 누수 fix

---

## 11. File Impact Matrix

| 파일 | 변경 유형 | ENH | Priority | 추정 LOC |
|------|----------|-----|----------|---------|
| `bkit-system/philosophy/context-engineering.md` | MODIFY (if 필드 가이드) | ENH-160 | P2 | +20 |
| 34 x `skills/*/SKILL.md` | MODIFY (description 250자 조정) | ENH-162 | P1 | ~50 |

**총 변경**: 35 files, ~70 LOC

---

## 12. 결론 및 권장 사항

### 즉시 조치 (P1)
- **ENH-162**: 34개 skills description 250자 이내 최적화 (~1h)

### 단기 조치 (P2)
- **ENH-160**: Hook `if` 필드 활용 문서화 (~30min)

### 모니터링 (P3)
- ENH-161: AskUserQuestion 자동 응답 — ENH-138 선행 필요
- ENH-163: /compact fix — 자동 수혜, 코드 변경 불필요
- ENH-164: Org policy plugin blocking — enterprise 요청 시 대응

### CC 버전 권장
- **v2.1.86** 즉시 업그레이드 (이미 설치 확인)
- **52번째 연속 호환 릴리스** 확인 (v2.1.34 ~ v2.1.86)

---

## Appendix A: ENH Summary Table

| ENH | Priority | CC Feature | bkit Impact | 상태 |
|-----|----------|------------|-------------|------|
| ENH-160 | P2 | Hook `if` field | 문서화 가이드 | 신규 |
| ENH-161 | P3 | AskUserQuestion updatedInput | headless Q&A (ENH-138 선행) | 신규 (대기) |
| ENH-162 | **P1** | /skills description 250자 cap | 34/36 skills description 조정 | **신규** |
| ENH-163 | P3 | /compact context exceeded fix | 자동 수혜 | 신규 (자동 해결) |
| ENH-164 | P3 | Org policy plugin blocking | enterprise 문서화 | 신규 (monitor) |
| ENH-154 | — | Stop hook -p 모드 | **CLOSED** (v2.1.84에서 해결) | 종료 |

## Appendix B: Sources

- [GitHub Releases](https://github.com/anthropics/claude-code/releases)
- [CHANGELOG.md](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- [Official Changelog (code.claude.com)](https://code.claude.com/docs/en/changelog)
- [Hooks Guide (code.claude.com)](https://code.claude.com/docs/en/hooks-guide)
- [npm @anthropic-ai/claude-code](https://www.npmjs.com/package/@anthropic-ai/claude-code)
- [#37520 - Parallel agents OAuth 401](https://github.com/anthropics/claude-code/issues/37520)
- [#38651 - Stop hook -p mode](https://github.com/anthropics/claude-code/issues/38651)
