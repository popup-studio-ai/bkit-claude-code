# Skills 자동완성 문제 심층 조사 보고서

> **조사 일자**: 2026-01-27
> **조사 대상**: Claude Code Skills vs Commands 자동완성 문제
> **관련 버전**: Claude Code v2.1.x, bkit v1.4.4

---

## Executive Summary

bkit 플러그인 사용자들이 경험하는 두 가지 핵심 문제를 심층 조사했습니다:

1. **`/bkit:DEPRECATED` 표시 문제** - bkit 전체가 폐기된 것처럼 보이는 UX 혼란
2. **Skills 자동완성 부재 문제** - CLI에서 플러그인 skills가 `/` 자동완성에 나타나지 않음

**결론**: 이 두 문제는 Claude Code의 알려진 제한사항이며, 공식적인 해결책이 아직 제공되지 않았습니다. bkit 측에서 취할 수 있는 대응 전략을 제안합니다.

---

## 1. 문제 분석

### 1.1 `/bkit:DEPRECATED` 표시 문제

**원인**: `commands/DEPRECATED.md` 파일이 slash command로 인식됨

```
commands/
└── DEPRECATED.md  ← 이 파일이 /bkit:DEPRECATED로 표시됨
```

**영향**: 사용자가 `/` 입력 시 자동완성 메뉴에 `/bkit:DEPRECATED - Commands Deprecation Notice (v1.4.4)`가 표시되어 bkit 플러그인 전체가 폐기된 것으로 오해할 수 있음.

**실제 상황**: bkit은 폐기되지 않았으며, 기존 commands를 skills로 마이그레이션한 것일 뿐입니다.

### 1.2 Skills 자동완성 부재 문제

**핵심 발견사항**:

| 환경 | 자동완성 지원 |
|------|-------------|
| VS Code Extension | ✅ Skills가 `/` 메뉴에 표시됨 |
| CLI (터미널) | ❌ Skills가 표시되지 않음 |
| 마켓플레이스 플러그인 Skills | ❌ 어디서도 표시되지 않음 |

**관련 GitHub 이슈들**:

| 이슈 번호 | 제목 | 상태 |
|----------|------|------|
| [#10246](https://github.com/anthropics/claude-code/issues/10246) | [FEATURE] Add Skill Autocomplete to CLI (Parity with VS Code Extension) | 🟡 OPEN |
| [#18949](https://github.com/anthropics/claude-code/issues/18949) | Skills from marketplace plugins don't appear in slash command autocomplete | 🟡 OPEN |
| [#20998](https://github.com/anthropics/claude-code/issues/20998) | [Bug] Plugin skill autocomplete not working for invokable skills | 🟡 OPEN |
| [#21124](https://github.com/anthropics/claude-code/issues/21124) | Plugin skills with user-invocable: true not appearing in slash command autocomplete | 🟡 OPEN |
| [#16336](https://github.com/anthropics/claude-code/issues/16336) | Feature Request: Tab autocomplete for slash commands | 🟡 OPEN |

---

## 2. 기술적 배경

### 2.1 Commands와 Skills의 통합 (v2.1.3)

2026년 1월 24일, Anthropic은 slash commands를 skills 시스템으로 통합했습니다:

> "Custom slash commands have been merged into skills. A file at `.claude/commands/review.md` and a skill at `.claude/skills/review/SKILL.md` both create `/review` and work the same way."
> — [Claude Code 공식 문서](https://code.claude.com/docs/en/skills)

**주요 변경사항**:
- Commands는 **폐기되지 않음** - 여전히 작동
- Skills가 **권장됨** - 추가 기능 지원 (subagents, fork context, supporting files)
- 동일 이름의 skill과 command가 있으면 **skill이 우선**

### 2.2 자동완성의 기술적 차이

**VS Code Extension**:
```
When typing `/`:
  /clear
  /context
  /my-skill       ← ~/.claude/skills/에서 자동 로드
  /plugin:skill   ← 플러그인 skills도 표시 (이론상)
```

**CLI (터미널)**:
```
When typing `/`:
  /clear
  /context
  [Skills가 표시되지 않음]
```

**근본 원인**: CLI와 VS Code Extension의 구현이 다름. CLI 팀에서 skill 자동완성을 아직 구현하지 않음.

---

## 3. 공식 입장 분석

### 3.1 Anthropic의 공식 응답

Issue #10246에서 이전 논의(#9710)를 참조하면, Anthropic 유지관리자는 다음을 제안했습니다:

> "adding a separate syntax for autocompleting skills" (예: `@skill-name` 또는 `#skill-name`)

그러나 커뮤니티는 이에 반대했습니다:
- `/skill-name` 문법이 이미 존재하고 작동함
- 다른 문법은 인지적 부담 증가
- VS Code Extension에서 이미 `/`로 skills를 표시하므로 일관성 필요

### 3.2 현재 로드맵

**공식적으로 발표된 타임라인 없음**. 다만 여러 이슈가 `enhancement` 또는 `bug` 라벨로 열려 있어 인지하고 있음을 시사합니다.

---

## 4. 해결 방안

### 4.1 bkit에서 즉시 적용 가능한 해결책

#### 해결책 A: `DEPRECATED.md` 파일 이름 변경

**문제**: `commands/DEPRECATED.md`가 `/bkit:DEPRECATED` 명령어로 인식됨

**해결**:
```bash
# 옵션 1: 파일을 commands 폴더 밖으로 이동
mv commands/DEPRECATED.md docs/migration/commands-deprecation-notice.md

# 옵션 2: 언더스코어 접두사로 숨김 처리 (테스트 필요)
mv commands/DEPRECATED.md commands/_DEPRECATED.md

# 옵션 3: commands 폴더 자체 제거 (skills로 완전 마이그레이션)
rm -rf commands/
```

**권장**: 옵션 1 - 문서를 docs 폴더로 이동

#### 해결책 B: 사용자에게 `/bkit:` 네임스페이스 안내

Skills는 `plugin-name:skill-name` 네임스페이스를 사용합니다. 사용자에게 다음을 안내:

```
사용 가능한 bkit skills:
/bkit:pdca
/bkit:starter
/bkit:dynamic
/bkit:enterprise
/bkit:development-pipeline
... (22개 skills)
```

#### 해결책 C: 문서화된 Workaround 제공

Issue #18949에서 제안된 workaround:

```bash
# 마켓플레이스 skill을 ~/.claude/skills/에 심볼릭 링크
ln -s /path/to/bkit/skills/pdca ~/.claude/skills/bkit-pdca
```

이렇게 하면 자동완성에 나타나지만, 플러그인 업데이트 시 깨질 수 있음.

### 4.2 중장기 대응 전략

#### 전략 1: GitHub 이슈 참여

기존 이슈에 bkit 사용자 관점의 코멘트 추가:
- [#10246](https://github.com/anthropics/claude-code/issues/10246) - CLI skill autocomplete
- [#18949](https://github.com/anthropics/claude-code/issues/18949) - Plugin skills autocomplete

커뮤니티 지지(👍)로 우선순위 상승에 기여.

#### 전략 2: `/bkit help` 또는 `/bkit list` Skill 추가

자동완성이 안 되더라도, 사용자가 `/bkit help`를 알고 있으면 모든 skills 목록을 볼 수 있도록:

```yaml
---
name: help
description: Show all available bkit skills and usage
user-invocable: true
---

# bkit Available Skills

## PDCA Skills
- `/bkit:pdca plan {feature}` - Start planning
- `/bkit:pdca design {feature}` - Design phase
...
```

#### 전략 3: SessionStart Hook에서 안내 메시지

현재 bkit의 SessionStart hook을 활용하여 사용 가능한 skills 목록을 세션 시작 시 표시:

```javascript
// 이미 구현됨 - 개선 가능
// 자동완성이 안 되어도 사용자가 참조할 수 있도록
```

### 4.3 대안적 접근법

#### Skills 대신 Commands 유지

현재 Claude Code에서 **commands는 자동완성이 됨**. Skills가 자동완성되지 않는 문제가 해결될 때까지 commands를 유지하는 것도 방법:

```
commands/
├── pdca-plan.md
├── pdca-design.md
├── starter.md
└── ...
```

**Trade-off**:
- ✅ 자동완성 작동
- ❌ Skills의 추가 기능(subagents, supporting files) 사용 불가
- ❌ 향후 skills로 재마이그레이션 필요

---

## 5. 권장 조치 사항

### 즉시 조치 (Priority: High)

| 조치 | 설명 | 예상 효과 |
|------|------|----------|
| `DEPRECATED.md` 이동 | `commands/` → `docs/migration/` | `/bkit:DEPRECATED` 표시 제거 |
| `/bkit help` skill 추가 | 사용 가능한 skills 목록 표시 | 사용자 discoverability 개선 |
| README 업데이트 | Skills 목록 및 사용법 명시 | 신규 사용자 온보딩 |

### 단기 조치 (1-2주)

| 조치 | 설명 |
|------|------|
| GitHub 이슈 참여 | #10246, #18949에 코멘트 추가 |
| 사용자 피드백 수집 | 어떤 방식이 더 선호되는지 조사 |

### 중기 대응 (Claude Code 업데이트 대기)

| 조치 | 조건 |
|------|------|
| Skills 자동완성 활용 | Claude Code에서 plugin skills autocomplete 지원 시 |
| Commands 폴더 제거 | Skills 자동완성이 안정화된 후 |

---

## 6. 결론

### 핵심 발견

1. **bkit은 폐기되지 않음** - `/bkit:DEPRECATED`는 마이그레이션 안내 문서일 뿐
2. **Skills 자동완성 문제는 Claude Code의 알려진 제한사항**
3. **공식 해결책은 아직 없음** - 여러 GitHub 이슈가 열려 있음
4. **Workaround 존재** - symlink, 문서화, hook 활용

### bkit의 방향성 제안

Skills 기반 아키텍처는 올바른 방향입니다. 자동완성 문제는 Claude Code 측에서 해결될 것으로 예상되며, 그 전까지는:

1. `DEPRECATED.md`를 commands 폴더에서 제거하여 혼란 방지
2. `/bkit help` skill로 discoverability 보완
3. 문서화를 통한 사용자 안내 강화

---

## 참고 자료

### 공식 문서
- [Claude Code Skills 문서](https://code.claude.com/docs/en/skills)
- [Claude Code Changelog](https://code.claude.com/docs/en/changelog)

### GitHub 이슈
- [#10246 - CLI Skill Autocomplete](https://github.com/anthropics/claude-code/issues/10246)
- [#18949 - Marketplace Plugin Skills](https://github.com/anthropics/claude-code/issues/18949)
- [#20998 - Plugin Skill Autocomplete Bug](https://github.com/anthropics/claude-code/issues/20998)
- [#21124 - user-invocable Skills](https://github.com/anthropics/claude-code/issues/21124)
- [#16336 - Tab Autocomplete](https://github.com/anthropics/claude-code/issues/16336)
- [#17288 - Confusing Changelog Entry](https://github.com/anthropics/claude-code/issues/17288)

### 참고 블로그
- [Claude Code Merges Slash Commands Into Skills](https://medium.com/@joe.njenga/claude-code-merges-slash-commands-into-skills-dont-miss-your-update-8296f3989697)
- [Skills vs Commands vs Agents](https://danielmiessler.com/blog/when-to-use-skills-vs-commands-vs-agents)

---

*이 보고서는 2026-01-27 기준 조사 결과입니다. Claude Code 업데이트에 따라 상황이 변경될 수 있습니다.*
