#!/usr/bin/env node
/**
 * pre-write.js — PreToolUse hook pipeline for Write|Edit operations.
 *
 * Design Ref: bkit-v2110-integrated-enhancement.design.md §4.2
 * Plan SC: Sprint 1 파이프라인화 — 순수 함수 체인으로 재구성, silent catch 4회 → debugLog 의무화,
 *   CC regression attribution (ENH-262/263) 통합.
 *
 * Philosophy: Automation First — Guide, don't block (exception: permission=deny / explicit danger).
 *
 * @module scripts/pre-write
 * @version 2.1.15
 */

const {
  readStdinSync,
  parseHookInput,
  outputAllow,
  outputBlock,
  outputEmpty,
} = require('../lib/core/io');
const { debugLog } = require('../lib/core/debug');
const { isSourceFile, isCodeFile, isEnvFile, extractFeature } = require('../lib/core/file');
const { findDesignDoc, findPlanDoc } = require('../lib/pdca/phase');
const { updatePdcaStatus, getPdcaStatusFull } = require('../lib/pdca/status');
const { classifyTaskByLines, getPdcaLevel } = require('../lib/task/classification');
const { generateTaskGuidance } = require('../lib/task/creator');

// Optional Permission Manager (v1.4.2 FR-05).
let permissionManager = null;
try {
  permissionManager = require('../lib/permission-manager.js');
} catch (e) {
  debugLog('PreToolUse', 'permissionManager not available', { error: e.message });
}

// CC Regression facade (v2.1.10 ENH-262/263 attribution).
let ccRegression = null;
try {
  ccRegression = require('../lib/cc-regression');
} catch (e) {
  debugLog('PreToolUse', 'cc-regression not available', { error: e.message });
}

const PDCA_DOC_PATTERNS = [
  /docs\/01-plan\/.*\.plan\.md$/,
  /docs\/02-design\/.*\.design\.md$/,
  /docs\/03-analysis\/.*\.analysis\.md$/,
  /docs\/04-report\/.*\.report\.md$/,
  /docs\/05-qa\/.*\.qa-report\.md$/,
  /docs\/00-pm\/.*\.prd\.md$/,
];

// ============================================================
// Pipeline stages (pure functions — side-effects localized)
// ============================================================

/**
 * Stage 0: Permission Manager check. Returns { deny, denyReason, askContext }.
 */
function runPermissionCheck(ctx) {
  if (!permissionManager) return {};
  const toolName = ctx.input.tool_name || 'Write';
  const permission = permissionManager.checkPermission(toolName, ctx.filePath);
  if (permission === 'deny') {
    return { deny: true, denyReason: `${toolName} to ${ctx.filePath} is denied by permission policy.` };
  }
  if (permission === 'ask') {
    return { askContext: `${toolName} to ${ctx.filePath} requires confirmation.` };
  }
  return {};
}

/**
 * Stage 1: Task classification via line count.
 */
function runTaskClassification(ctx) {
  if (!ctx.content) return { classification: 'quick_fix', pdcaLevel: 'none', lineCount: 0 };
  const lineCount = ctx.content.split('\n').length;
  const classification = classifyTaskByLines(ctx.content);
  const pdcaLevel = getPdcaLevel(classification);
  return { classification, pdcaLevel, lineCount };
}

/**
 * Stage 2: PDCA document check + phantom feature guard.
 */
function runPdcaDocCheck(ctx) {
  const out = { feature: '', designDoc: '', planDoc: '' };
  if (!isSourceFile(ctx.filePath)) return out;
  const feature = extractFeature(ctx.filePath);
  if (!feature) return out;

  out.feature = feature;
  out.designDoc = findDesignDoc(feature);
  out.planDoc = findPlanDoc(feature);

  // v2.1.7 (Issue #79 P4) + v2.1.15 (Issue #89): primaryFeature 정정.
  //   - currentFeature는 v2/v3 schema에 존재하지 않는 필드
  //     (status-migration.js:31,74에서 normalize됨 → primaryFeature)
  //   - 이전 코드는 항상 undefined를 읽어 phantom 차단이 false-true로 항상 작동했으나,
  //     `updatePdcaStatus`가 호출되지 않는 false-negative 부작용도 가짐.
  //     본 fix는 활성 feature 일치 시 정상 호출 + L3 게이트(plan/design 문서 존재)로 추가 방어.
  try {
    const currentStatus = getPdcaStatusFull();
    const activeFeature = currentStatus?.primaryFeature;
    if (activeFeature && activeFeature === feature) {
      // L3 게이트가 plan/design 문서 부재 시 silent no-op 보장
      updatePdcaStatus(feature, 'do', { lastFile: ctx.filePath });
      debugLog('PreToolUse', 'PDCA status updated', {
        feature,
        phase: 'do',
        hasDesignDoc: !!out.designDoc,
      });
    } else {
      debugLog('PreToolUse', 'Skipped phantom feature registration', {
        extracted: feature,
        active: activeFeature || 'none',
      });
    }
  } catch (e) {
    debugLog('PreToolUse', 'PDCA update failed', { error: e.message });
  }
  return out;
}

/**
 * Stage 2.5: PDCA Skill bypass warning.
 */
function runPdcaBypassDetection(ctx) {
  if (!PDCA_DOC_PATTERNS.some((p) => p.test(ctx.filePath))) return null;
  if (process.env.CLAUDE_SKILL_NAME) return null; // invoked via skill → OK.
  debugLog('PreToolUse', 'PDCA skill bypass detected', { filePath: ctx.filePath });
  return (
    '[PDCA COMPLIANCE] This file is a PDCA document. ' +
    'Use /pdca command instead of direct Write/Edit. ' +
    'Direct writes bypass template injection, state tracking, and quality gates.'
  );
}

/**
 * Stage 3: PDCA guidance (no blocking).
 */
function runPdcaGuidance(ctx, pdcaCtx, taskCtx) {
  const { pdcaLevel, lineCount } = taskCtx;
  const { designDoc, planDoc, feature } = pdcaCtx;
  const parts = [];
  switch (pdcaLevel) {
    case 'none':
      break;
    case 'light':
      parts.push(`Minor change (${lineCount} lines). PDCA optional.`);
      break;
    case 'recommended':
      if (designDoc) parts.push(`Feature (${lineCount} lines). Design doc exists: ${designDoc}`);
      else if (feature)
        parts.push(
          `Feature (${lineCount} lines). Design doc recommended for '${feature}'. Consider /pdca-design ${feature}`
        );
      else parts.push(`Feature-level change (${lineCount} lines). Design doc recommended.`);
      break;
    case 'required':
      if (designDoc)
        parts.push(
          `Major feature (${lineCount} lines). Design doc exists: ${designDoc}. Refer during implementation.`
        );
      else if (feature)
        parts.push(
          `Major feature (${lineCount} lines) without design doc. Strongly recommend /pdca-design ${feature} first.`
        );
      else
        parts.push(
          `Major feature (${lineCount} lines). Design doc strongly recommended before implementation.`
        );
      break;
  }
  if (planDoc && !designDoc && pdcaLevel !== 'none' && pdcaLevel !== 'light') {
    parts.push(`Plan exists at ${planDoc}. Design doc not yet created.`);
  }
  return parts;
}

/**
 * Stage 4: Convention hints.
 */
function runConventionHints(ctx, taskCtx) {
  const { pdcaLevel } = taskCtx;
  if (isCodeFile(ctx.filePath)) {
    if (pdcaLevel === 'recommended' || pdcaLevel === 'required') {
      return 'Conventions: Components=PascalCase, Functions=camelCase, Constants=UPPER_SNAKE_CASE';
    }
  } else if (isEnvFile(ctx.filePath)) {
    return 'Env naming: NEXT_PUBLIC_* (client), DB_* (database), API_* (external), AUTH_* (auth)';
  }
  return null;
}

/**
 * Stage 5: Task system guidance (v1.3.1 FR-02).
 */
function runTaskSystemGuidance(ctx, pdcaCtx, taskCtx) {
  const { pdcaLevel } = taskCtx;
  const { feature } = pdcaCtx;
  if (feature && (pdcaLevel === 'recommended' || pdcaLevel === 'required')) {
    return generateTaskGuidance('do', feature, 'design');
  }
  return null;
}

/**
 * Stage 6: Destructive detector (v2.0.0 control module).
 */
function runDestructiveDetector(ctx) {
  try {
    const dd = require('../lib/control/destructive-detector');
    const toolInput = { file_path: ctx.filePath, content: ctx.content };
    const result = dd.detect('Write', toolInput);
    if (result.detected) {
      try {
        const audit = require('../lib/audit/audit-logger');
        audit.writeAuditLog({
          actor: 'hook',
          actorId: 'pre-write',
          action: 'destructive_blocked',
          category: 'control',
          target: toolInput.file_path || '',
          targetType: 'file',
          details: { rules: result.rules },
          result: 'blocked',
          destructiveOperation: true,
          blastRadius: 'medium',
        });
      } catch (e) {
        debugLog('PreToolUse', 'audit write failed (destructive)', { error: e.message });
      }
      return `Destructive operation detected: ${result.rules.map((r) => r.id || r.reason).join(', ')}`;
    }
  } catch (e) {
    debugLog('PreToolUse', 'destructive detector failed', { error: e.message });
  }
  return null;
}

/**
 * Stage 7: Blast radius.
 */
function runBlastRadius(ctx) {
  try {
    const br = require('../lib/control/blast-radius');
    const check = br.checkSingleFile(ctx.filePath, ctx.content?.length || 0);
    if (check.warning) return `Blast radius warning: ${check.warning}`;
  } catch (e) {
    debugLog('PreToolUse', 'blast radius failed', { error: e.message });
  }
  return null;
}

/**
 * Stage 8: Scope limiter.
 */
function runScopeLimiter(ctx) {
  try {
    const sl = require('../lib/control/scope-limiter');
    const ac = require('../lib/control/automation-controller');
    const level = ac.getCurrentLevel();
    const scopeCheck = sl.checkPathScope(ctx.filePath, level);
    if (!scopeCheck.allowed) {
      return `Scope limit: ${scopeCheck.reason || 'Path not allowed at current automation level'}`;
    }
  } catch (e) {
    debugLog('PreToolUse', 'scope limiter failed', { error: e.message });
  }
  return null;
}

/**
 * Stage 8.5 (v2.1.10 NEW): CC regression attribution — ENH-262/263.
 * bkit does NOT block — only provides user attribution when CC will surface a prompt.
 */
function runCCRegressionCheck(ctx) {
  if (!ccRegression) return null;
  try {
    const result = ccRegression.checkCCRegression({
      tool: ctx.input.tool_name || 'Write',
      filePath: ctx.filePath,
      bypassPermissions: !!ctx.input.bypassPermissions,
      permissionDecision: ctx.input.permissionDecision,
      envOverrides: ctx.input.envOverrides || {},
    });
    if (result.attributions && result.attributions.length > 0) {
      return result.attributions.join(' | ');
    }
  } catch (e) {
    debugLog('PreToolUse', 'cc-regression check failed', { error: e.message });
  }
  return null;
}

/**
 * Stage 9: Audit log (file_modified).
 */
function runAuditLog(ctx) {
  try {
    const audit = require('../lib/audit/audit-logger');
    audit.writeAuditLog({
      actor: 'hook',
      actorId: 'pre-write',
      action: 'file_modified',
      category: 'file',
      target: ctx.filePath || '',
      targetType: 'file',
      result: 'success',
      destructiveOperation: false,
    });
  } catch (e) {
    debugLog('PreToolUse', 'audit log failed', { error: e.message });
  }
}

// ============================================================
// Main orchestrator
// ============================================================

function main() {
  const input = readStdinSync();
  const { filePath, content } = parseHookInput(input);
  debugLog('PreToolUse', 'Hook started', { filePath: filePath || 'none' });

  if (!filePath) {
    debugLog('PreToolUse', 'Skipped - no file path');
    outputEmpty();
    process.exit(0);
  }

  const ctx = { input, filePath, content };
  const contextParts = [];

  // Stage 0: Permission
  const perm = runPermissionCheck(ctx);
  if (perm.deny) {
    debugLog('PreToolUse', 'Permission denied', { filePath });
    outputBlock(perm.denyReason);
    process.exit(2);
  }
  if (perm.askContext) contextParts.push(perm.askContext);

  // Stages 1-2
  const taskCtx = runTaskClassification(ctx);
  const pdcaCtx = runPdcaDocCheck(ctx);

  // Stage 2.5: PDCA bypass
  const bypass = runPdcaBypassDetection(ctx);
  if (bypass) contextParts.push(bypass);

  // Stage 3-5
  contextParts.push(...runPdcaGuidance(ctx, pdcaCtx, taskCtx));
  const conv = runConventionHints(ctx, taskCtx);
  if (conv) contextParts.push(conv);
  const taskGuide = runTaskSystemGuidance(ctx, pdcaCtx, taskCtx);
  if (taskGuide) contextParts.push(taskGuide);

  // Stage 6-8
  const dest = runDestructiveDetector(ctx);
  if (dest) contextParts.push(dest);
  const blast = runBlastRadius(ctx);
  if (blast) contextParts.push(blast);
  const scope = runScopeLimiter(ctx);
  if (scope) contextParts.push(scope);

  // Stage 8.5 (v2.1.10): CC regression attribution
  const ccAttr = runCCRegressionCheck(ctx);
  if (ccAttr) contextParts.push(ccAttr);

  // Stage 9: Audit log (non-blocking)
  runAuditLog(ctx);

  debugLog('PreToolUse', 'Hook completed', {
    classification: taskCtx.classification,
    pdcaLevel: taskCtx.pdcaLevel,
    feature: pdcaCtx.feature || 'none',
    contextCount: contextParts.length,
  });

  if (contextParts.length > 0) {
    outputAllow(contextParts.join(' | '), 'PreToolUse');
  } else {
    outputEmpty();
  }
}

// Export pipeline stages for unit testing (v2.1.10).
module.exports = {
  runPermissionCheck,
  runTaskClassification,
  runPdcaDocCheck,
  runPdcaBypassDetection,
  runPdcaGuidance,
  runConventionHints,
  runTaskSystemGuidance,
  runDestructiveDetector,
  runBlastRadius,
  runScopeLimiter,
  runCCRegressionCheck,
  runAuditLog,
  PDCA_DOC_PATTERNS,
};

if (require.main === module) main();
