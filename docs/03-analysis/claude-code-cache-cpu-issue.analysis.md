# Claude Code 100% CPU Issue - Root Cause Analysis

**분석 일자**: 2026-02-01
**분석자**: Claude Opus 4.5
**대상 버전**: bkit v1.4.7 / Claude Code v2.1.27
**분석 유형**: Cache & Performance Deep Dive

---

## 1. Executive Summary

### 1.1 핵심 발견

| 구분 | 결과 |
|------|------|
| **근본 원인** | Claude Code 버그 (Issue #22079) |
| **bkit 코드 문제** | ❌ 없음 |
| **캐시 관련 문제** | Claude Code 플러그인 캐시 시스템 결함 |
| **해결 방법** | 캐시 삭제 후 재설치 (임시) / Claude Code 패치 대기 |

### 1.2 문제 요약

`.claude-plugin` 디렉토리가 있는 폴더에서 `claude --plugin-dir .` 실행 시 **Claude Code 자체 버그**로 인해 무한 루프가 발생하여 100% CPU가 됨.

---

## 2. 조사 소스

### 2.1 GitHub Issues (Critical)
- **[#22079](https://github.com/anthropics/claude-code/issues/22079)**: `.claude-plugin` directory causes 100% CPU freeze ⚠️ **정확히 동일한 문제**
- **[#15090](https://github.com/anthropics/claude-code/issues/15090)**: Plugin cache causes 10x startup slowdown
- **[#14061](https://github.com/anthropics/claude-code/issues/14061)**: `/plugin update` does not invalidate cache
- **[#5771](https://github.com/anthropics/claude-code/issues/5771)**: Claude Code using 100% of CPU and Memory
- **[#10997](https://github.com/anthropics/claude-code/issues/10997)**: SessionStart hooks don't execute on first run

### 2.2 공식 문서
- [Create plugins](https://code.claude.com/docs/en/plugins)
- [Plugins reference](https://code.claude.com/docs/en/plugins-reference)

---

## 3. 근본 원인 분석

### 3.1 Issue #22079 - 정확히 동일한 증상

**문제**: `.claude-plugin` 폴더가 있는 디렉토리에서 Claude Code 시작 시 즉시 100% CPU로 freeze

**증상**:
```bash
$ claude --plugin-dir .
# 결과: 100% CPU, 응답 없음, kill -9 필요
```

**원인**: Claude Code의 플러그인 발견/로딩 과정에서 **무한 루프** 발생

**영향 범위**:
- 모든 플러그인 비활성화해도 발생
- `.claude` 폴더 삭제해도 발생
- `CLAUDE.md` 삭제해도 발생
- `.claude-plugin` 폴더가 있으면 발생

**임시 해결책**:
```bash
mv .claude-plugin .claude-plugin.disabled
```

### 3.2 Issue #15090 - 캐시 역효과

**문제**: 플러그인 캐시가 시작 시간을 10배 느리게 만듦

| 조건 | 시작 시간 | CPU |
|------|----------|-----|
| 캐시 없음 | 4.4초 | 92% |
| 캐시 있음 (9개 플러그인) | 41-46초 | 12% |

**원인**: 동기식 플러그인 검증 (플러그인당 ~4초)

### 3.3 Issue #14061 - 캐시 무효화 실패

**문제**: `/plugin update` 후에도 캐시가 갱신되지 않음

**영향**:
- Git 저장소는 업데이트됨 ✅
- `~/.claude/plugins/cache/`는 그대로 ❌
- `installed_plugins.json`의 `gitCommitSha`도 이전 값 유지 ❌

---

## 4. bkit 코드베이스 분석

### 4.1 캐시 관련 코드 검토

#### lib/core/cache.js - ✅ 문제 없음
```javascript
// In-Memory Map with TTL - 정상적인 구현
const _store = new Map();
const DEFAULT_TTL = 5000;

function get(key, ttl = DEFAULT_TTL) {
  const entry = _store.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > ttl) {
    _store.delete(key);
    return null;
  }
  return entry.value;
}
```
- 순수 인메모리 캐시
- TTL 기반 자동 만료
- 파일 시스템 캐시 없음
- **문제 없음**

#### lib/memory-store.js - ✅ 문제 없음
```javascript
// docs/.bkit-memory.json에 세션 데이터 저장
function getMemoryFilePath() {
  return path.join(common.PROJECT_DIR, 'docs', '.bkit-memory.json');
}
```
- 단순 JSON 파일 저장
- 동기 I/O 사용 (소규모 데이터라 문제 없음)
- **문제 없음**

### 4.2 디버그 로그 분석 - ✅ 정상

```json
{"timestamp":"2026-01-31T15:14:26.894Z","category":"SessionStart","message":"Hook executed"}
// ... 6ms 후
{"timestamp":"2026-01-31T15:14:26.900Z","category":"SessionStart","message":"Enhanced onboarding"}
```

- Hook 실행 시간: **6ms** (정상)
- 모든 초기화 과정 정상 완료
- **bkit 훅 코드에 문제 없음**

### 4.3 플러그인 구조 - ✅ 정상

```
bkit-claude-code/
├── .claude-plugin/
│   ├── plugin.json     ✅ 올바른 위치
│   └── marketplace.json ✅ 마켓플레이스 정의
├── hooks/
│   └── hooks.json      ✅ 올바른 스키마
├── skills/             ✅ 21개 스킬
└── agents/             ✅ 에이전트 정의
```

---

## 5. 결론

### 5.1 문제 원인

| 구분 | 상태 | 설명 |
|------|------|------|
| bkit 캐시 코드 | ✅ 정상 | 인메모리 TTL 캐시, 문제 없음 |
| bkit 훅 코드 | ✅ 정상 | 6ms 내 정상 완료 |
| bkit 플러그인 구조 | ✅ 정상 | 공식 스펙 준수 |
| **Claude Code 버그** | ❌ 문제 | Issue #22079 - 무한 루프 |

### 5.2 Claude Code 알려진 캐시 문제들

1. **#22079**: `.claude-plugin` 디렉토리 감지 시 무한 루프
2. **#15090**: 캐시 존재 시 10배 느린 시작
3. **#14061**: 플러그인 업데이트 후 캐시 무효화 안됨
4. **#15642**: `CLAUDE_PLUGIN_ROOT`가 오래된 버전 가리킴
5. **#10997**: GitHub 마켓플레이스 첫 실행 시 SessionStart 훅 미실행
6. **#11509**: 로컬 플러그인 훅 발견 안됨
7. **#12634**: 플러그인에 hooks.json 추가해도 발견 안됨

---

## 6. 권장 조치

### 6.1 즉시 조치 (Workaround)

```bash
# 방법 1: 캐시 완전 삭제 후 재설치
rm -rf ~/.claude/cache/
rm -rf ~/.claude/plugins/cache/
rm -rf ~/.claude/debug/
npm uninstall -g @anthropic-ai/claude-code
curl -fsSL https://claude.ai/install.sh | bash

# 방법 2: .claude-plugin 임시 비활성화
mv .claude-plugin .claude-plugin.disabled
claude
# 작업 후 다시 활성화
mv .claude-plugin.disabled .claude-plugin
```

### 6.2 장기 조치

1. **Claude Code 업데이트 대기**: Issue #22079 패치 포함 버전 대기
2. **GitHub Issue 댓글 추가**: 재현 환경 정보 제공
3. **마켓플레이스 버전 사용**: `--plugin-dir` 대신 설치된 플러그인 사용

### 6.3 bkit 개선 사항 (Optional)

```bash
# .obsidian 폴더 .gitignore에 추가 (1.6MB 절약)
echo ".obsidian/" >> .gitignore
```

---

## 7. 자체 마켓플레이스 배포 구조 검증

### 7.1 조사 결과 요약

| 항목 | bkit 구현 | 공식 스펙 | 결과 |
|------|-----------|-----------|------|
| `.claude-plugin/` 위치 | 플러그인 루트 | 플러그인 루트 | ✅ 올바름 |
| `plugin.json` 스키마 | npm-like 패턴 | 표준 패턴 | ✅ 올바름 |
| `marketplace.json` 스키마 | Anthropic 공식 | `https://anthropic.com/claude-code/marketplace.schema.json` | ✅ 올바름 |
| 두 파일 공존 | 동일 디렉토리 | 권장 패턴 | ✅ 올바름 |

### 7.2 `.claude-plugin/` 디렉토리 구조

**공식 문서에 따른 올바른 구조**:
```
plugin-name/
├── .claude-plugin/           ✅ 플러그인 루트에 위치
│   ├── plugin.json          # 필수: 단일 플러그인 메타데이터
│   └── marketplace.json     # 선택: 마켓플레이스 카탈로그
├── agents/
├── skills/
├── commands/
├── hooks/
└── README.md
```

**bkit 구현**:
```
bkit-claude-code/
├── .claude-plugin/           ✅ 정확히 올바른 위치
│   ├── plugin.json          ✅ 536 bytes
│   └── marketplace.json     ✅ 1.8KB
```

### 7.3 `plugin.json` vs `marketplace.json` 역할 분리

| 파일 | 범위 | 용도 | 필수 여부 |
|------|------|------|----------|
| `plugin.json` | 단일 플러그인 | 플러그인 ID, 버전, 작성자 | ✅ 필수 |
| `marketplace.json` | 전체 마켓플레이스 | 다중 플러그인 카탈로그 | 마켓플레이스 호스팅 시만 필요 |

**bkit marketplace.json 구조** (검증됨):
```json
{
  "$schema": "https://anthropic.com/claude-code/marketplace.schema.json",
  "name": "bkit-marketplace",
  "version": "1.4.7",
  "plugins": [
    {
      "name": "bkit-starter",
      "source": { "source": "url", "url": "https://github.com/..." }
    },
    {
      "name": "bkit",
      "source": { "source": "url", "url": "https://github.com/..." }
    }
  ]
}
```

### 7.4 `--plugin-dir` vs 마켓플레이스 관계

**두 방식은 충돌하지 않음** - 서로 다른 용도:

| 방식 | 용도 | 우선순위 |
|------|------|----------|
| `--plugin-dir` | 개발/테스트용 로컬 로딩 | 🥇 최우선 |
| `extraKnownMarketplaces` | 프로덕션 배포 | 🥈 두 번째 |
| `~/.claude/plugins/` | 글로벌 설치 | 🥉 폴백 |

**실행 순서**:
```
--plugin-dir (CLI 인자)
    ↓ (미지정 시)
extraKnownMarketplaces (settings.json)
    ↓ (미발견 시)
~/.claude/plugins/ (글로벌)
```

### 7.5 마켓플레이스 등록 방법

**사용자 설치 방법** (README.md 문서화됨):
```bash
# 1. 마켓플레이스 등록
/plugin marketplace add popup-studio-ai/bkit-claude-code

# 2. 플러그인 설치
/plugin install bkit
```

**settings.json 직접 설정**:
```json
{
  "extraKnownMarketplaces": {
    "bkit-marketplace": {
      "source": {
        "source": "github",
        "repo": "popup-studio-ai/bkit-claude-code"
      }
    }
  },
  "enabledPlugins": {
    "bkit@bkit-marketplace": true
  }
}
```

### 7.6 핵심 결론

**bkit의 `.claude-plugin/` 구조는 100% 올바릅니다.**

- ✅ 공식 문서 구조 준수
- ✅ Anthropic 공식 스키마 사용
- ✅ `plugin.json` + `marketplace.json` 분리 (권장 패턴)
- ✅ 마켓플레이스 배포 가능 구조

**100% CPU 문제는 구조 문제가 아님** - Claude Code Issue #22079 버그가 원인

### 7.7 관련 GitHub Issues

- **[#9354](https://github.com/anthropics/claude-code/issues/9354)**: 플러그인 에이전트에 마켓플레이스 접두사 필요 (`bkit:gap-detector`)
- **[#11509](https://github.com/anthropics/claude-code/issues/11509)**: 로컬 파일 기반 마켓플레이스 훅 발견 안됨
- **[#10997](https://github.com/anthropics/claude-code/issues/10997)**: GitHub 마켓플레이스 첫 실행 시 SessionStart 훅 미실행

---

## 8. 참고 자료

### 공식 문서
- [Plugin Marketplaces](https://code.claude.com/docs/en/plugin-marketplaces) - 마켓플레이스 생성/배포
- [Plugins Reference](https://code.claude.com/docs/en/plugins-reference) - 기술 스키마
- [Discover Plugins](https://code.claude.com/docs/en/discover-plugins) - 플러그인 탐색
- [CLI Reference](https://code.claude.com/docs/en/cli-reference) - 명령줄 레퍼런스

### GitHub Issues (성능/캐시)
- [#22079: .claude-plugin causes 100% CPU](https://github.com/anthropics/claude-code/issues/22079) ⚠️ 핵심 버그
- [#15090: Plugin cache causes 10x delay](https://github.com/anthropics/claude-code/issues/15090)
- [#14061: Cache not invalidated on update](https://github.com/anthropics/claude-code/issues/14061)
- [#5771: 100% CPU and Memory](https://github.com/anthropics/claude-code/issues/5771)
- [#15642: CLAUDE_PLUGIN_ROOT points to stale version](https://github.com/anthropics/claude-code/issues/15642)

### GitHub Issues (마켓플레이스/훅)
- [#9354: Plugin agents require marketplace prefix](https://github.com/anthropics/claude-code/issues/9354)
- [#10997: SessionStart hooks fail on first marketplace run](https://github.com/anthropics/claude-code/issues/10997)
- [#11509: Local file-based marketplace hooks not discovered](https://github.com/anthropics/claude-code/issues/11509)
- [#12634: Plugin hooks.json not discovered after update](https://github.com/anthropics/claude-code/issues/12634)
