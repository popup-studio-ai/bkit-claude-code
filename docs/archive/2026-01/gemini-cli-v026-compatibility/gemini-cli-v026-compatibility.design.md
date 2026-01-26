# Gemini CLI v0.26+ 호환성 설계 문서

> **Summary**: Gemini CLI v0.26+ Breaking Changes 대응을 위한 bkit 훅 시스템 개선
>
> **Project**: bkit-claude-code
> **Version**: v1.4.3
> **Author**: Claude Opus 4.5
> **Date**: 2026-01-26
> **Status**: Draft
> **Planning Doc**: [gemini-cli-v026-compatibility.plan.md](../01-plan/features/gemini-cli-v026-compatibility.plan.md)

---

## 1. Overview

### 1.1 Design Goals

1. **Gemini CLI v0.26+ 완전 호환성 확보**
   - Hook context XML 래핑 환경에서 안전한 출력 보장
   - engines 버전 요구사항 정확히 명시

2. **기존 기능 무중단 유지**
   - Claude Code 호환성 유지
   - 기존 훅 동작 변경 없음

3. **방어적 코딩으로 미래 대비**
   - XML 특수문자 이스케이프 안전장치
   - 플랫폼 감지 로직 강화

### 1.2 Design Principles

- **Backward Compatibility**: 기존 v0.25.x 환경에서도 정상 동작
- **Fail-Safe**: XML 래핑 실패 시에도 훅 출력 유지
- **Minimal Change**: 최소한의 코드 변경으로 최대 호환성

---

## 2. Architecture

### 2.1 훅 시스템 구조

```
┌─────────────────────────────────────────────────────────────────┐
│                    bkit Hook System                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────────┐  │
│   │   Hook      │────▶│ lib/common  │────▶│   Platform      │  │
│   │  Scripts    │     │    .js      │     │   Output        │  │
│   └─────────────┘     └─────────────┘     └─────────────────┘  │
│         │                   │                     │              │
│         │                   ▼                     ▼              │
│         │           ┌─────────────┐     ┌─────────────────┐    │
│         │           │ xmlSafe     │     │  Claude Code    │    │
│         │           │ Output()    │     │  (JSON stdout)  │    │
│         │           └─────────────┘     └─────────────────┘    │
│         │                   │                                    │
│         │                   ▼                                    │
│         │           ┌─────────────────┐                         │
│         │           │  Gemini CLI     │                         │
│         │           │  (plain text)   │                         │
│         │           └─────────────────┘                         │
│         │                   │                                    │
│         │                   ▼                                    │
│         │           ┌─────────────────────────────────┐         │
│         │           │  XML Wrapper (v0.27+)           │         │
│         │           │  <hook-context source="...">    │         │
│         │           │    {escaped content}            │         │
│         │           │  </hook-context>                │         │
│         └──────────▶│                                 │         │
│                     └─────────────────────────────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
Hook Script 실행
    │
    ▼
outputAllow(context, hookEvent)
    │
    ├──▶ isGeminiCli() ? ───▶ xmlSafeOutput(context)
    │                              │
    │                              ▼
    │                        console.log(escaped)
    │
    └──▶ Claude Code ───▶ JSON.stringify({...})
                              │
                              ▼
                        console.log(json)
```

### 2.3 영향받는 파일 목록

| 파일 | 변경 유형 | 변경 내용 |
|------|----------|----------|
| `lib/common.js` | 수정 | xmlSafeOutput() 함수 추가, output 함수들 개선 |
| `gemini-extension.json` | 수정 | engines.gemini-cli 버전 업데이트 |
| `hooks/hooks.json` | 수정 (선택) | AgentStop 훅 추가 |

---

## 3. 상세 구현 명세

### 3.1 FR-1.1: xmlSafeOutput() 함수 추가

#### 3.1.1 함수 시그니처

```javascript
/**
 * XML 특수문자를 이스케이프하여 안전한 출력 생성
 * Gemini CLI v0.27+ XML 래핑 호환성 보장
 *
 * @param {string} content - 이스케이프할 콘텐츠
 * @returns {string} XML-safe 콘텐츠
 *
 * @example
 * xmlSafeOutput('<feature> & "test"')
 * // Returns: '&lt;feature&gt; &amp; &quot;test&quot;'
 */
function xmlSafeOutput(content) {
  if (!content || typeof content !== 'string') {
    return content;
  }

  return content
    .replace(/&/g, '&amp;')   // & → &amp; (먼저 처리해야 함)
    .replace(/</g, '&lt;')    // < → &lt;
    .replace(/>/g, '&gt;')    // > → &gt;
    .replace(/"/g, '&quot;')  // " → &quot;
    .replace(/'/g, '&#39;');  // ' → &#39;
}
```

#### 3.1.2 XML 특수문자 이스케이프 규칙

| 문자 | 이스케이프 | 설명 |
|------|-----------|------|
| `&` | `&amp;` | 가장 먼저 처리 (다른 이스케이프 시퀀스 보호) |
| `<` | `&lt;` | XML 태그 시작 방지 |
| `>` | `&gt;` | XML 태그 종료 방지 |
| `"` | `&quot;` | 속성값 내 따옴표 |
| `'` | `&#39;` | 속성값 내 작은따옴표 |

#### 3.1.3 outputAllow() 함수 수정

```javascript
function outputAllow(context = '', hookEvent = 'PostToolUse') {
  const safeContext = truncateContext(context, MAX_CONTEXT_LENGTH);

  if (isGeminiCli()) {
    if (safeContext) {
      // v1.4.3: XML 래핑 호환성을 위해 이스케이프 적용
      const escapedContext = xmlSafeOutput(safeContext);
      console.log(`\x1b[36m💡 bkit Context:\x1b[0m ${escapedContext}`);
    }
    process.exit(0);
  } else {
    // Claude Code 로직 (기존 유지)
    // ...
  }
}
```

#### 3.1.4 outputBlock() 함수 수정

```javascript
function outputBlock(reason) {
  if (isGeminiCli()) {
    // v1.4.3: XML 래핑 호환성을 위해 이스케이프 적용
    const escapedReason = xmlSafeOutput(reason);
    console.error(`\x1b[31m🚫 bkit Blocked:\x1b[0m ${escapedReason}`);
    process.exit(1);
  } else {
    // Claude Code 로직 (기존 유지)
    console.error(reason);
    process.exit(2);
  }
}
```

### 3.2 FR-1.2: engines 버전 업데이트

#### 3.2.1 변경 사항

**파일**: `gemini-extension.json`

```diff
  "engines": {
-   "gemini-cli": ">=1.0.0",
+   "gemini-cli": ">=0.25.0",
    "node": ">=18.0.0"
  },
```

#### 3.2.2 버전 선택 근거

| 버전 | 훅 시스템 | bkit 호환성 |
|------|----------|-------------|
| < 0.25.0 | 훅 비활성화 | ❌ 미지원 |
| 0.25.0 | 훅 기본 활성화 | ✅ 최소 요구 |
| 0.26.0-preview | XML 래핑, 설정 변경 | ✅ 호환 (v1.4.3) |
| 0.27.0-nightly | AskUser, Plan Mode | ✅ 호환 (향후) |

### 3.3 추가 개선: AgentStop 훅 동기화 (선택)

#### 3.3.1 현재 상태

| 훅 이벤트 | hooks.json (Claude) | gemini-extension.json (Gemini) |
|-----------|---------------------|-------------------------------|
| SessionStart | ✅ | ✅ |
| PreToolUse | ✅ | ✅ (BeforeTool) |
| PostToolUse | ✅ | ✅ (AfterTool) |
| AgentStop | ❌ **없음** | ✅ 4개 에이전트 |
| UserPromptSubmit | ✅ | ❌ |
| PreCompact | ✅ | ❌ |

#### 3.3.2 hooks.json 추가 내용 (선택사항)

```json
{
  "Stop": [
    {
      "matcher": "gap-detector",
      "hooks": [
        {
          "type": "command",
          "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/gap-detector-stop.js",
          "timeout": 10000
        }
      ]
    },
    {
      "matcher": "pdca-iterator",
      "hooks": [
        {
          "type": "command",
          "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/iterator-stop.js",
          "timeout": 10000
        }
      ]
    },
    {
      "matcher": "code-analyzer",
      "hooks": [
        {
          "type": "command",
          "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/analysis-stop.js",
          "timeout": 10000
        }
      ]
    },
    {
      "matcher": "qa-monitor",
      "hooks": [
        {
          "type": "command",
          "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/qa-stop.js",
          "timeout": 10000
        }
      ]
    }
  ]
}
```

> **Note**: Claude Code에서 Stop 훅이 지원되는지 확인 필요. 지원되지 않으면 이 변경은 생략.

---

## 4. 구현 체크리스트

### 4.1 필수 구현 (v1.4.3)

- [ ] **lib/common.js**: `xmlSafeOutput()` 함수 추가
- [ ] **lib/common.js**: `outputAllow()` Gemini 분기에 XML 이스케이프 적용
- [ ] **lib/common.js**: `outputBlock()` Gemini 분기에 XML 이스케이프 적용
- [ ] **gemini-extension.json**: engines.gemini-cli를 `>=0.25.0`으로 변경
- [ ] **gemini-extension.json**: version을 `1.4.3`으로 업데이트

### 4.2 선택 구현 (v1.4.3)

- [ ] **hooks/hooks.json**: Stop 훅 추가 (Claude Code 지원 확인 후)

### 4.3 테스트

- [ ] XML 특수문자 포함 출력 테스트 (`<feature>`, `&`, `"` 등)
- [ ] 기존 훅 동작 회귀 테스트
- [ ] Claude Code 환경 호환성 테스트
- [ ] Gemini CLI v0.25, v0.26, v0.27 환경 테스트

---

## 5. 테스트 계획

### 5.1 단위 테스트

#### 5.1.1 xmlSafeOutput() 테스트

```javascript
// tests/xml-safe-output.test.js
describe('xmlSafeOutput', () => {
  test('이스케이프 없는 일반 텍스트', () => {
    expect(xmlSafeOutput('Hello World')).toBe('Hello World');
  });

  test('& 문자 이스케이프', () => {
    expect(xmlSafeOutput('A & B')).toBe('A &amp; B');
  });

  test('< > 문자 이스케이프', () => {
    expect(xmlSafeOutput('<tag>')).toBe('&lt;tag&gt;');
  });

  test('따옴표 이스케이프', () => {
    expect(xmlSafeOutput('"quoted"')).toBe('&quot;quoted&quot;');
  });

  test('복합 이스케이프', () => {
    expect(xmlSafeOutput('<a href="test">A & B</a>'))
      .toBe('&lt;a href=&quot;test&quot;&gt;A &amp; B&lt;/a&gt;');
  });

  test('null/undefined 처리', () => {
    expect(xmlSafeOutput(null)).toBe(null);
    expect(xmlSafeOutput(undefined)).toBe(undefined);
  });

  test('빈 문자열', () => {
    expect(xmlSafeOutput('')).toBe('');
  });
});
```

### 5.2 통합 테스트

#### 5.2.1 훅 출력 테스트 시나리오

| 시나리오 | 입력 | 예상 출력 (Gemini) |
|----------|------|-------------------|
| 일반 텍스트 | `PDCA Check completed` | `💡 bkit Context: PDCA Check completed` |
| 기능명에 특수문자 | `<login-feature>` | `💡 bkit Context: &lt;login-feature&gt;` |
| 에러 메시지에 & | `Failed: A & B` | `🚫 bkit Blocked: Failed: A &amp; B` |

### 5.3 호환성 테스트 매트릭스

| 테스트 항목 | Gemini v0.25 | v0.26-preview | v0.27-nightly | Claude Code |
|------------|--------------|---------------|---------------|-------------|
| SessionStart 훅 | ⬜ | ⬜ | ⬜ | ⬜ |
| PreToolUse 훅 | ⬜ | ⬜ | ⬜ | ⬜ |
| PostToolUse 훅 | ⬜ | ⬜ | ⬜ | ⬜ |
| XML 래핑 출력 | N/A | ⬜ | ⬜ | N/A |
| engines 버전 체크 | ⬜ | ⬜ | ⬜ | N/A |

---

## 6. 구현 순서

### 6.1 Phase 1: 핵심 기능 (필수)

1. `lib/common.js`에 `xmlSafeOutput()` 함수 추가
2. `outputAllow()` 함수 수정
3. `outputBlock()` 함수 수정
4. `gemini-extension.json` engines 버전 및 version 업데이트

### 6.2 Phase 2: 테스트 및 검증

5. 단위 테스트 작성 및 실행
6. 기존 훅 동작 회귀 테스트
7. 다중 Gemini CLI 버전 호환성 테스트

### 6.3 Phase 3: 문서화 및 배포

8. CHANGELOG.md 업데이트
9. 커밋 및 PR 생성

---

## 7. 리스크 및 대응

### 7.1 리스크 목록

| 리스크 | 영향도 | 가능성 | 대응 방안 |
|--------|--------|--------|----------|
| XML 이스케이프 누락 | Medium | Low | 모든 output 함수 검토 완료 |
| 기존 출력 포맷 변경 | Low | Low | 변경은 Gemini 분기에만 적용 |
| Claude Code 회귀 | Medium | Very Low | JSON 출력 로직 변경 없음 |

### 7.2 롤백 전략

1. `xmlSafeOutput()` 함수를 호출하지 않도록 주석 처리
2. engines 버전을 `>=1.0.0`으로 복원

---

## 8. 예상 결과

### 8.1 변경 전 (v1.4.2)

```
# Gemini CLI v0.27+ 환경에서 기능명에 <> 포함 시
<hook-context source="session-start">
💡 bkit Context: Feature <login> created  ← XML 파싱 오류 가능
</hook-context>
```

### 8.2 변경 후 (v1.4.3)

```
# Gemini CLI v0.27+ 환경에서 기능명에 <> 포함 시
<hook-context source="session-start">
💡 bkit Context: Feature &lt;login&gt; created  ← 정상 파싱
</hook-context>
```

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-01-26 | 초기 설계 문서 작성 | Claude Opus 4.5 |

---

**Design Generated By**: bkit PDCA Design Generator
**Co-Authored-By**: Claude Opus 4.5 <noreply@anthropic.com>
