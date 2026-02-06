# bkit v1.5.2 Bridge Fix Design Document

> **Summary**: lib/pdca/index.js와 lib/common.js에서 누락된 2개 함수(detectPdcaFromTaskSubject, getNextPdcaActionAfterCompletion) re-export 추가 설계서
>
> **Project**: bkit-claude-code
> **Version**: 1.5.2
> **Author**: bkit Team
> **Date**: 2026-02-06
> **Status**: Finalized
> **Planning Doc**: [bkit-v1.5.2-bridge-fix.plan.md](../../01-plan/features/bkit-v1.5.2-bridge-fix.plan.md)

---

## 1. Problem Analysis

### 1.1 Export Chain (Before Fix)

```
lib/pdca/automation.js
  exports: 11 functions ✅
  ├── getAutomationLevel
  ├── isFullAutoMode
  ├── shouldAutoAdvance
  ├── generateAutoTrigger
  ├── shouldAutoStartPdca
  ├── autoAdvancePdcaPhase
  ├── getHookContext
  ├── emitUserPrompt
  ├── formatAskUserQuestion
  ├── detectPdcaFromTaskSubject      ← v1.5.1 NEW
  └── getNextPdcaActionAfterCompletion ← v1.5.1 NEW
          ↓
lib/pdca/index.js
  re-exports: 9 functions ❌ (2 missing)
  └── Automation 주석: "9 exports" (should be 11)
          ↓
lib/common.js
  re-exports: 9 functions ❌ (2 missing, inherited from index.js)
  └── Automation 주석: "9 exports" (should be 11)
```

### 1.2 Export Chain (After Fix)

```
lib/pdca/automation.js
  exports: 11 functions ✅
          ↓
lib/pdca/index.js
  re-exports: 11 functions ✅ (+2 added)
  └── Automation 주석: "11 exports"
          ↓
lib/common.js
  re-exports: 11 functions ✅ (auto-inherited from index.js)
  └── Automation 주석: "11 exports"
  └── PDCA Module 주석: "50 exports" (was 48 implied)
```

---

## 2. Modification Details

### 2.1 File 1: lib/pdca/index.js

**Current** (line 63-73):
```javascript
  // Automation (9 exports)
  getAutomationLevel: automation.getAutomationLevel,
  isFullAutoMode: automation.isFullAutoMode,
  shouldAutoAdvance: automation.shouldAutoAdvance,
  generateAutoTrigger: automation.generateAutoTrigger,
  shouldAutoStartPdca: automation.shouldAutoStartPdca,
  autoAdvancePdcaPhase: automation.autoAdvancePdcaPhase,
  getHookContext: automation.getHookContext,
  emitUserPrompt: automation.emitUserPrompt,
  formatAskUserQuestion: automation.formatAskUserQuestion,
};
```

**After**:
```javascript
  // Automation (11 exports)
  getAutomationLevel: automation.getAutomationLevel,
  isFullAutoMode: automation.isFullAutoMode,
  shouldAutoAdvance: automation.shouldAutoAdvance,
  generateAutoTrigger: automation.generateAutoTrigger,
  shouldAutoStartPdca: automation.shouldAutoStartPdca,
  autoAdvancePdcaPhase: automation.autoAdvancePdcaPhase,
  getHookContext: automation.getHookContext,
  emitUserPrompt: automation.emitUserPrompt,
  formatAskUserQuestion: automation.formatAskUserQuestion,
  detectPdcaFromTaskSubject: automation.detectPdcaFromTaskSubject,
  getNextPdcaActionAfterCompletion: automation.getNextPdcaActionAfterCompletion,
};
```

**Changes**:
1. Line 63: 주석 `(9 exports)` → `(11 exports)`
2. Line 72 뒤: 2개 re-export 추가
3. Line 5: `@version 1.4.7` → `@version 1.5.2`

---

### 2.2 File 2: lib/common.js

**Current** (line 138-148):
```javascript
  // Automation (9 exports)
  getAutomationLevel: pdca.getAutomationLevel,
  isFullAutoMode: pdca.isFullAutoMode,
  shouldAutoAdvance: pdca.shouldAutoAdvance,
  generateAutoTrigger: pdca.generateAutoTrigger,
  shouldAutoStartPdca: pdca.shouldAutoStartPdca,
  autoAdvancePdcaPhase: pdca.autoAdvancePdcaPhase,
  getHookContext: pdca.getHookContext,
  emitUserPrompt: pdca.emitUserPrompt,
  formatAskUserQuestion: pdca.formatAskUserQuestion,
```

**After**:
```javascript
  // Automation (11 exports)
  getAutomationLevel: pdca.getAutomationLevel,
  isFullAutoMode: pdca.isFullAutoMode,
  shouldAutoAdvance: pdca.shouldAutoAdvance,
  generateAutoTrigger: pdca.generateAutoTrigger,
  shouldAutoStartPdca: pdca.shouldAutoStartPdca,
  autoAdvancePdcaPhase: pdca.autoAdvancePdcaPhase,
  getHookContext: pdca.getHookContext,
  emitUserPrompt: pdca.emitUserPrompt,
  formatAskUserQuestion: pdca.formatAskUserQuestion,
  detectPdcaFromTaskSubject: pdca.detectPdcaFromTaskSubject,
  getNextPdcaActionAfterCompletion: pdca.getNextPdcaActionAfterCompletion,
```

**Changes**:
1. Line 138: 주석 `(9 exports)` → `(11 exports)`
2. Line 147 뒤: 2개 re-export 추가
3. Line 4: `@version 1.5.1` → `@version 1.5.2`
4. Line 86: 주석 `PDCA Module (50 exports)` 확인 (이미 50으로 표기되어 있으나, 실제 48이었음 → 이제 50이 됨)

---

## 3. Verification Design

### 3.1 Node.js 직접 검증 스크립트

수정 후 아래 명령으로 즉시 검증:

```bash
node -e "
  const c = require('./lib/common.js');
  const checks = [
    ['detectPdcaFromTaskSubject', typeof c.detectPdcaFromTaskSubject],
    ['getNextPdcaActionAfterCompletion', typeof c.getNextPdcaActionAfterCompletion],
  ];
  checks.forEach(([name, type]) => {
    console.log(type === 'function' ? '✅ PASS' : '❌ FAIL', name, ':', type);
  });

  // Export count verification
  const total = Object.keys(c).length;
  console.log(total === 138 ? '✅ PASS' : '❌ FAIL', 'Total exports:', total, '(expected 138)');
"
```

### 3.2 기능 검증

```bash
node -e "
  const { detectPdcaFromTaskSubject, getNextPdcaActionAfterCompletion } = require('./lib/common.js');

  // D2-11 검증
  const r1 = detectPdcaFromTaskSubject('[Plan] login-feature');
  console.log(r1?.phase === 'plan' && r1?.feature === 'login-feature' ? '✅ D2-11 PASS' : '❌ D2-11 FAIL', JSON.stringify(r1));

  const r2 = detectPdcaFromTaskSubject('[Act-3] my-feature');
  console.log(r2?.phase === 'act' && r2?.feature === 'my-feature' ? '✅ D2-11b PASS' : '❌ D2-11b FAIL', JSON.stringify(r2));

  const r3 = detectPdcaFromTaskSubject('일반 task');
  console.log(r3 === null ? '✅ D2-11c PASS' : '❌ D2-11c FAIL', JSON.stringify(r3));

  // D2-12 검증
  const r4 = getNextPdcaActionAfterCompletion('plan', 'test-feature');
  console.log(r4?.nextPhase === 'design' ? '✅ D2-12 PASS' : '❌ D2-12 FAIL', JSON.stringify(r4));
"
```

### 3.3 중간 모듈 검증

```bash
node -e "
  const pdca = require('./lib/pdca');
  const total = Object.keys(pdca).length;
  console.log(total === 50 ? '✅ PASS' : '❌ FAIL', 'lib/pdca/index.js exports:', total, '(expected 50)');
  console.log(typeof pdca.detectPdcaFromTaskSubject === 'function' ? '✅ PASS' : '❌ FAIL', 'detectPdcaFromTaskSubject in pdca index');
  console.log(typeof pdca.getNextPdcaActionAfterCompletion === 'function' ? '✅ PASS' : '❌ FAIL', 'getNextPdcaActionAfterCompletion in pdca index');
"
```

### 3.4 회귀 검증

```bash
node -e "
  const c = require('./lib/common.js');
  // 기존 automation 함수들 정상 확인
  const existing = ['getAutomationLevel','isFullAutoMode','shouldAutoAdvance','generateAutoTrigger','shouldAutoStartPdca','autoAdvancePdcaPhase','getHookContext','emitUserPrompt','formatAskUserQuestion'];
  existing.forEach(name => {
    console.log(typeof c[name] === 'function' ? '✅' : '❌', name);
  });
"
```

---

## 4. Change Summary

| File | Type | Lines Changed | Risk |
|------|------|:------------:|:----:|
| lib/pdca/index.js | Edit | 4 lines | Very Low |
| lib/common.js | Edit | 4 lines | Very Low |
| **Total** | | **8 lines** | **Very Low** |

### 4.1 Export Count Changes

| Module | Before | After | Delta |
|--------|:------:|:-----:|:-----:|
| lib/pdca/automation.js | 11 | 11 | 0 |
| lib/pdca/index.js | 50 | 52 | +2 |
| lib/common.js | 142 | 144 | +2 |

> **Note**: 이전 보고서에서 export 수를 138로 추정했으나, 실제 검증 결과 core(41)+pdca(50→52)+intent(19)+task(26)+team(6)=142→144입니다. status.js의 17→17 export와 core 모듈의 실제 41개가 주석의 37보다 4개 많았습니다.

---

## 5. Implementation Order

1. Edit `lib/pdca/index.js` - 2개 re-export 추가 + 주석 + 버전
2. Edit `lib/common.js` - 2개 re-export 추가 + 주석 + 버전
3. Run verification script (Section 3.1)
4. Run functional test (Section 3.2)
5. Run intermediate module test (Section 3.3)
6. Run regression test (Section 3.4)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-06 | Initial design - 2 file edit specification | bkit Team |

---

*Generated by bkit PDCA Skill | 2026-02-06*
