'use strict';
/**
 * automation-questions.js — PDCA AskUserQuestion / user-prompt builders.
 *
 * Extracted verbatim from lib/pdca/automation.js (v2.1.22 S3a ENH-345 god-file
 * split). These 3 builders are pure/self-contained (no getCore/getStatus, no
 * cross-calls) — behavior identical. lib/pdca/automation.js re-exports them so
 * all external consumers (lib/pdca/index.js + 5 Stop/prompt scripts) are unaffected.
 *
 * @module lib/pdca/automation-questions
 */

/**
 * Format user prompt output
 * @param {Object} options
 * @returns {string}
 */
function emitUserPrompt(options = {}) {
  const { message, feature, phase, suggestions } = options;

  let output = '';

  if (message) {
    output += message + '\n';
  }

  if (feature && phase) {
    output += `\n📍 Current: ${feature} (${phase})\n`;
  }

  if (suggestions?.length) {
    output += '\n💡 Suggestions:\n';
    suggestions.forEach((s, i) => {
      output += `  ${i + 1}. ${s}\n`;
    });
  }

  return output;
}

/**
 * Format ask user question payload
 * v1.5.9: Added preview field support (ENH-78 graceful degradation)
 * v1.6.0: ENH-92 AskUserQuestion preview performance optimized (CC v2.1.70 fix)
 * @param {Object} payload
 * @returns {Object}
 */
function formatAskUserQuestion(payload) {
  const defaultOptions = [
    { label: 'Continue', description: 'Proceed with current task' },
    { label: 'Skip', description: 'Skip this step' }
  ];

  const options = (payload.options || defaultOptions).map(opt => {
    const result = {
      label: opt.label,
      description: opt.description
    };
    // v1.5.9: preview field (CC v2.1.69+, silently ignored on older versions)
    // v1.6.0: ENH-92 performance improved by CC v2.1.70 AskUserQuestion preview fix
    if (opt.preview) {
      result.preview = opt.preview;
    }
    return result;
  });

  // v1.6.0 ENH-92: Include executive summary in preview when available
  if (payload.executiveSummary && options.length > 0 && !options[0].preview) {
    const es = payload.executiveSummary;
    options[0].preview = [
      '## Executive Summary',
      '',
      `**Problem**: ${es.problem || 'N/A'}`,
      `**Solution**: ${es.solution || 'N/A'}`,
      `**Impact**: ${es.impact || 'N/A'}`,
      `**Value**: ${es.value || 'N/A'}`
    ].join('\n');
  }

  return {
    questions: [
      {
        question: payload.question || 'How would you like to proceed?',
        header: payload.header || 'Action',
        options,
        multiSelect: payload.multiSelect || false
      }
    ]
  };
}

/**
 * v1.5.9: Build PDCA phase-specific Next Action AskUserQuestion
 * @param {string} phase - Completed PDCA phase ('plan'|'plan-plus'|'report'|'check')
 * @param {string} feature - Feature name
 * @param {Object} [context] - Additional context (matchRate, iterCount)
 * @returns {Object} formatAskUserQuestion compatible payload
 */
function buildNextActionQuestion(phase, feature, context = {}) {
  const { matchRate = 0, iterCount = 0 } = context;

  const questionSets = {
    'pm': {
      question: 'PM analysis completed. Please select next step.',
      header: 'PM Complete',
      options: [
        {
          label: 'Start Plan (Recommended)',
          description: 'Create Plan document with PRD auto-reference',
          preview: [
            '## Plan Phase',
            '',
            `**Command**: \`/pdca plan ${feature}\``,
            '',
            `**PRD Auto-Reference**: docs/00-pm/${feature}.prd.md`,
            '',
            '**Duration**: 15-30 min',
            '',
            '**PDCA Status**:',
            '[PM] OK -> **[Plan]** -> [Design] -> [Do] -> [Check]'
          ].join('\n')
        },
        {
          label: 'Re-run PM Analysis',
          description: 'Run PM analysis again with different parameters',
          preview: [
            '## Re-run PM',
            '',
            `**Command**: \`/pdca pm ${feature}\``,
            '',
            '**Note**: Existing PRD will be overwritten'
          ].join('\n')
        },
        {
          label: 'Skip to Plan-Plus',
          description: 'Use brainstorming-enhanced planning instead',
          preview: [
            '## Plan Plus',
            '',
            `**Command**: \`/plan-plus ${feature}\``,
            '',
            '**Note**: PRD from PM will still be auto-referenced'
          ].join('\n')
        }
      ]
    },

    'plan-plus': {
      question: 'Plan Plus completed. Please select next step.',
      header: 'Next Action',
      options: [
        {
          label: 'Start Design (Recommended)',
          description: 'Start technical design document',
          preview: [
            '## Design Phase',
            '',
            `**Command**: \`/pdca design ${feature}\``,
            '',
            '**Duration**: 20-40 min',
            '',
            '**Output**:',
            `- \`docs/02-design/features/${feature}.design.md\``,
            '- API endpoint specs',
            '- DB schema and data model',
            '- UI component structure'
          ].join('\n')
        },
        {
          label: 'Revise Plan',
          description: 'Apply changes to current plan document',
          preview: [
            '## Revise Plan',
            '',
            `**Target**: \`docs/01-plan/features/${feature}.plan.md\``,
            '',
            '**Key areas**:',
            '- Scope (In/Out) adjustment',
            '- Add/remove functional requirements',
            '- Redefine success criteria'
          ].join('\n')
        },
        {
          label: 'Request Team Review',
          description: 'Request CTO Team plan review',
          preview: [
            '## CTO Team Review',
            '',
            `**Command**: \`/pdca team ${feature}\``,
            '',
            '**Requires**: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`',
            '',
            '**Duration**: 10-20 min'
          ].join('\n')
        }
      ]
    },

    'plan': {
      question: 'Plan completed. Please select next step.',
      header: 'Next Action',
      options: [
        {
          label: 'Start Design (Recommended)',
          description: 'Start technical design based on plan',
          preview: [
            '## Design Phase',
            '',
            `**Command**: \`/pdca design ${feature}\``,
            '',
            '**Duration**: 15-30 min',
            '',
            '**PDCA Status**:',
            '[Plan] OK -> **[Design]** -> [Do] -> [Check]'
          ].join('\n')
        },
        {
          label: 'Revise Plan',
          description: 'Apply additional changes to plan',
          preview: [
            '## Revise Plan',
            '',
            `**Target**: \`docs/01-plan/features/${feature}.plan.md\``,
            '',
            '**Tip**: For major scope changes, consider `/plan-plus` restart'
          ].join('\n')
        },
        {
          label: 'Other Feature First',
          description: 'Pause this feature, work on something else',
          preview: [
            '## Pause Feature',
            '',
            `**Current state**: ${feature} saved at "plan" phase`,
            '',
            `**Resume**: \`/pdca status\` then \`/pdca design ${feature}\``
          ].join('\n')
        }
      ]
    },

    'report': {
      question: `Report completed (Match Rate: ${matchRate}%). Please select next step.`,
      header: 'PDCA Complete',
      options: [
        {
          label: 'Archive (Recommended)',
          description: 'Archive completed PDCA documents',
          preview: [
            '## Archive',
            '',
            `**Command**: \`/pdca archive ${feature}\``,
            '',
            '**Documents** (4 files):',
            '- plan.md, design.md, analysis.md, report.md',
            '',
            `**Location**: \`docs/archive/YYYY-MM/${feature}/\``,
            '',
            '**Tip**: Use `--summary` to preserve metrics'
          ].join('\n')
        },
        {
          label: 'Further Improvement',
          description: 'Apply additional improvements to current feature',
          preview: [
            '## Additional Improvement',
            '',
            `**Current Match Rate**: ${matchRate}%`,
            `**Iterations completed**: ${iterCount}`,
            '',
            `**Command**: \`/pdca iterate ${feature}\``
          ].join('\n')
        },
        {
          label: 'Next Feature',
          description: 'Start new feature PDCA cycle',
          preview: [
            '## New Feature',
            '',
            '**Start commands**:',
            '- `/plan-plus {new-feature}` (recommended)',
            '- `/pdca plan {new-feature}`',
            '',
            `**Current feature**: ${feature} stays at "report" phase`
          ].join('\n')
        }
      ]
    }
  };

  // v2.1.1: QA phase question set
  questionSets['qa'] = {
    question: `QA Phase completed (Pass Rate: ${context.qaPassRate || 0}%). Please select next step.`,
    header: 'QA Complete',
    options: [
      {
        label: 'Generate Report (Recommended)',
        description: 'All QA tests passed, generate completion report',
        preview: [
          '## Report Phase',
          '',
          `**Command**: \`/pdca report ${feature}\``,
          '',
          `**QA Pass Rate**: ${context.qaPassRate || 0}%`,
          `**Critical Issues**: ${context.qaCriticalCount || 0}`,
          '',
          '**PDCA Status**:',
          '[Check] OK -> [QA] OK -> **[Report]**'
        ].join('\n')
      },
      {
        label: 'Fix & Retry QA',
        description: 'Fix failed tests and re-run QA phase',
        preview: [
          '## Fix & Retry',
          '',
          `**Command**: \`/pdca iterate ${feature}\` then \`/qa-phase ${feature}\``,
          '',
          '**Failed Tests**: Review docs/05-qa/ for details'
        ].join('\n')
      },
      {
        label: 'Skip QA → Report',
        description: 'Skip remaining QA tests and proceed to report',
        preview: [
          '## Skip QA',
          '',
          `**Command**: \`/pdca report ${feature}\``,
          '',
          '**Warning**: QA results will be recorded as "skipped"'
        ].join('\n')
      }
    ]
  };

  return questionSets[phase] || questionSets['plan'];
}

module.exports = {
  emitUserPrompt,
  formatAskUserQuestion,
  buildNextActionQuestion,
};
