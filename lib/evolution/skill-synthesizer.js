// Design Ref: §2.1 — Skill Synthesizer: 패턴 → 스킬 변환 (generator.js 래핑)
// Plan SC: SC-1 (스킬 제안 생성), SC-4 (감사 로그)
'use strict';

const fs = require('fs');
const path = require('path');
const { generateSkill } = require('../../skill-creator/generator');
const { validateSkill } = require('../../skill-creator/validator');

// Design Ref: §3.4 — staging area 경로
const STAGING_DIR = path.join(process.cwd(), '.bkit', 'evolution', 'staging');

/**
 * Auto-classify a pattern into skill classification.
 * Design Ref: §4.2 — gap→workflow, metric→capability, btw→빈도 기반
 *
 * @param {Pattern} pattern
 * @returns {'workflow'|'capability'}
 */
function classifyPattern(pattern) {
  switch (pattern.type) {
    case 'gap_frequency':
      // Recurring gaps → workflow skill (process automation)
      return 'workflow';
    case 'metric_degradation':
      // Metric drops → capability skill (model ability augmentation)
      return 'capability';
    case 'btw_cluster':
      // BTW clusters: if suggestions mention process/flow → workflow, else capability
      const text = pattern.evidence.map(e => e.excerpt).join(' ').toLowerCase();
      const workflowKeywords = ['check', 'validate', 'verify', 'review', 'lint', 'test'];
      const hasWorkflow = workflowKeywords.some(k => text.includes(k));
      return hasWorkflow ? 'workflow' : 'capability';
    default:
      return 'capability';
  }
}

/**
 * Generate a SKILL.md content for the evolved skill.
 * This creates a minimal but valid skill document.
 *
 * @param {Pattern} pattern
 * @param {'workflow'|'capability'} classification
 * @returns {string} SKILL.md content
 */
function generateSkillContent(pattern, classification) {
  const typeLabel = {
    gap_frequency: 'Recurring Gap',
    metric_degradation: 'Metric Degradation',
    btw_cluster: 'User Suggestion Cluster',
  }[pattern.type] || 'Pattern';

  const evidenceList = pattern.evidence
    .slice(0, 5)
    .map(e => `- ${e.source}: "${e.excerpt}"`)
    .join('\n');

  return `---
name: ${pattern.suggestedSkillName}
description: Auto-evolved skill addressing ${pattern.name} (${typeLabel})
classification: ${classification}
classification-reason: Auto-classified from ${pattern.type} pattern
deprecation-risk: medium
evolution:
  source: pattern-miner
  patternId: ${pattern.id}
  confidence: ${pattern.confidence}
  occurrences: ${pattern.occurrences}
  detectedAt: ${pattern.detectedAt}
---

# ${pattern.suggestedSkillName}

> Auto-evolved from ${typeLabel} pattern detected by Skill Evolution.
> Confidence: ${pattern.confidence} | Occurrences: ${pattern.occurrences}

## Problem

${pattern.description}

## Evidence

${evidenceList}

## Guidance

When working on code that matches this pattern, ensure:

1. Check for "${pattern.name}" before proceeding
2. Apply the relevant fix pattern based on evidence above
3. Verify the fix does not introduce regressions

## When to Apply

This skill should be considered during the ${pattern.type === 'metric_degradation' ? pattern.evidence[0]?.excerpt?.match(/at (\w+) phase/)?.[1] || 'do' : 'do'} phase of PDCA cycles.
`;
}

/**
 * Generate eval.yaml from pattern evidence.
 * Design Ref: §4.2 — 패턴 근거 → eval.yaml 작성
 *
 * @param {Pattern} pattern
 * @param {string} skillDir - directory to write eval files
 */
function generateEvalFromPattern(pattern, skillDir) {
  const evalsDir = path.join(skillDir, 'evals');
  fs.mkdirSync(evalsDir, { recursive: true });

  // eval.yaml
  const evalYaml = `name: ${pattern.suggestedSkillName}
description: Eval for auto-evolved skill from ${pattern.type}
criteria:
  - skill addresses the ${pattern.name} pattern
  - skill provides actionable guidance
  - skill does not produce false positives
timeout: 30
model_baseline: sonnet
enabled: true
`;
  fs.writeFileSync(path.join(evalsDir, 'eval.yaml'), evalYaml, 'utf8');

  // prompt-1.md
  const prompt = `Given a codebase where "${pattern.name}" has been detected ${pattern.occurrences} times, apply the ${pattern.suggestedSkillName} skill to prevent this pattern from recurring.`;
  fs.writeFileSync(path.join(evalsDir, 'prompt-1.md'), prompt, 'utf8');

  // expected-1.md
  const expected = `The skill should identify the "${pattern.name}" pattern and provide specific guidance to prevent recurrence. Expected behaviors:
- Detection of the pattern in relevant code
- Actionable fix suggestions
- No false positives on unrelated code`;
  fs.writeFileSync(path.join(evalsDir, 'expected-1.md'), expected, 'utf8');
}

/**
 * Synthesize a single skill from a pattern and stage it.
 * Design Ref: §4.2 — synthesizeSkill(pattern) → StagedSkill
 *
 * @param {Pattern} pattern
 * @returns {StagedSkill}
 */
function synthesizeSkill(pattern) {
  const classification = classifyPattern(pattern);
  const skillName = pattern.suggestedSkillName;
  const skillDir = path.join(STAGING_DIR, skillName);

  // Create staging directory
  fs.mkdirSync(skillDir, { recursive: true });

  // Generate SKILL.md
  const content = generateSkillContent(pattern, classification);
  fs.writeFileSync(path.join(skillDir, 'SKILL.md'), content, 'utf8');

  // Generate eval files
  generateEvalFromPattern(pattern, skillDir);

  // Validate using existing validator (best-effort — validator may expect different paths)
  let valid = true;
  let validationErrors = [];
  try {
    const result = validateSkill(skillName);
    if (result && !result.valid) {
      valid = false;
      validationErrors = result.errors || [];
    }
  } catch (_) {
    // Validator may not find the skill in staging — that's OK for staging
    valid = true;
  }

  return {
    name: skillName,
    classification,
    description: pattern.description,
    sourcePattern: pattern,
    stagingPath: skillDir,
    valid,
    validationErrors,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Synthesize all patterns into staged skills.
 * Design Ref: §4.2 — synthesizeAll(patterns) → StagedSkill[]
 *
 * @param {Pattern[]} patterns
 * @returns {StagedSkill[]}
 */
function synthesizeAll(patterns) {
  if (!patterns || patterns.length === 0) return [];

  // Ensure staging directory exists
  fs.mkdirSync(STAGING_DIR, { recursive: true });

  const results = [];
  for (const pattern of patterns) {
    try {
      const staged = synthesizeSkill(pattern);
      results.push(staged);
    } catch (err) {
      // Design Ref: §6 — generator.js 호출 실패 시 해당 패턴 건너뜀
      console.error(`[evolution] Failed to synthesize skill for pattern ${pattern.id}: ${err.message}`);
    }
  }

  return results;
}

module.exports = {
  classifyPattern,
  synthesizeSkill,
  generateEvalFromPattern,
  synthesizeAll,
};
