/**
 * PDCA Template Validator
 * @module lib/pdca/template-validator
 * @version 2.1.10
 *
 * Validates PDCA documents against template required sections.
 * ENH-103: Ensures Executive Summary and other mandatory sections are present.
 */

// fs/path imports removed: unused by this validator (0 references).

/**
 * Template-to-required-sections mapping
 * Each PDCA document type must include these sections (## level headers).
 */
const REQUIRED_SECTIONS = {
  'plan': [
    'Executive Summary',
    'Overview',
    'Scope',
    'Requirements',
    'Success Criteria',
    'Risks and Mitigation',
    'Architecture Considerations',
    'Convention Prerequisites',
    'Next Steps',
    'Version History'
  ],
  'plan-plus': [
    'Executive Summary',
    'User Intent Discovery',
    'Alternatives Explored',
    'YAGNI Review',
    'Scope',
    'Requirements',
    'Success Criteria',
    'Risks and Mitigation',
    'Architecture Considerations',
    'Convention Prerequisites',
    'Next Steps',
    'Brainstorming Log',
    'Version History'
  ],
  'design': [
    'Executive Summary',
    'Overview',
    'Architecture',
    'Detailed Design',
    'Implementation Order',
    'Test Plan',
    'Version History'
  ],
  // M1 fix (audit): analysis docs previously returned null from detectDocumentType,
  // so the PDCA Check phase could proceed on a malformed gap report. These are the
  // structurally-mandatory sections of templates/analysis.template.md (the gap
  // analysis, the overall score, the recommended actions, and next steps) — kept
  // deliberately narrower than plan/design since the analysis template carries
  // many conditional sections (Performance/Clean-Arch/Convention) that aren't
  // universally applicable. 'Strategic Alignment Check' is the Phase-3 gate.
  'analysis': [
    'Strategic Alignment Check',
    'Gap Analysis',
    'Overall Score',
    'Recommended Actions',
    'Next Steps',
    'Version History'
  ],
  'report': [
    'Executive Summary',
    'Version History'
  ],
  'prd': [
    'Executive Summary',
    'Opportunity Discovery',
    'Value Proposition',
    'Market Research',
    'Go-To-Market',
    'Product Requirements',
    'Attribution'
  ]
};

/**
 * Detect PDCA document type from file path
 * @param {string} filePath - File path
 * @returns {string|null} 'plan' | 'plan-plus' | 'design' | 'analysis' | 'report' | 'prd' | null
 */
function detectDocumentType(filePath) {
  if (!filePath || !filePath.endsWith('.md')) return null;

  if (filePath.includes('docs/00-pm/') && filePath.includes('.prd.md')) {
    return 'prd';
  }
  if (filePath.includes('docs/01-plan/') && filePath.includes('.plan.md')) {
    return 'plan'; // Default; refined to plan-plus after content check
  }
  if (filePath.includes('docs/02-design/') && filePath.includes('.design.md')) {
    return 'design';
  }
  // M1 fix (audit): analysis docs are now detected + validated against the
  // analysis REQUIRED_SECTIONS entry. Accept both the canonical features/
  // subfolder layout and the legacy flat layout (see M2 path canonicalization).
  if (filePath.includes('docs/03-analysis/') && filePath.includes('.analysis.md')) {
    return 'analysis';
  }
  if (filePath.includes('docs/04-report/') && filePath.includes('.report.md')) {
    return 'report';
  }
  return null;
}

/**
 * Extract section headers from markdown content
 * Matches ## level headers with optional numbering prefix.
 * @param {string} content - Markdown content
 * @returns {string[]} Section header texts
 */
function extractSections(content) {
  const sectionPattern = /^##\s+(?:\d+[.\d]*\s+)?(.+)$/gm;
  const sections = [];
  let match;
  while ((match = sectionPattern.exec(content)) !== null) {
    sections.push(match[1].trim());
  }
  return sections;
}

/**
 * Detect if document is plan-plus type by content inspection
 * @param {string} content - Document content
 * @returns {boolean}
 */
function isPlanPlus(content) {
  return content.includes('Plan-Plus') ||
         content.includes('Plan Plus') ||
         content.includes('plan-plus') ||
         content.includes('Brainstorming-Enhanced') ||
         content.includes('Intent Discovery');
}

/**
 * Validate PDCA document against its template required sections
 * @param {string} filePath - Document file path
 * @param {string} content - Document content
 * @returns {{ valid: boolean, missing: string[], type: string|null }}
 */
function validateDocument(filePath, content) {
  let type = detectDocumentType(filePath);
  if (!type) return { valid: true, missing: [], type: null };

  // Refine plan type based on content
  if (type === 'plan' && isPlanPlus(content)) {
    type = 'plan-plus';
  }

  const required = REQUIRED_SECTIONS[type] || [];
  const actual = extractSections(content);

  const missing = required.filter(section => {
    return !actual.some(a =>
      a.toLowerCase().includes(section.toLowerCase())
    );
  });

  return { valid: missing.length === 0, missing, type };
}

/**
 * Format validation result as warning message
 * @param {{ valid: boolean, missing: string[], type: string|null }} result
 * @returns {string|null} Warning message or null if valid
 */
function formatValidationWarning(result) {
  if (!result || result.valid || !result.type) return null;

  return [
    'PDCA Document Template Compliance Warning:',
    `Document type: ${result.type}`,
    `Missing required sections: ${result.missing.join(', ')}`,
    'Please add the missing sections to comply with the template.'
  ].join('\n');
}

module.exports = {
  REQUIRED_SECTIONS,
  detectDocumentType,
  extractSections,
  isPlanPlus,
  validateDocument,
  formatValidationWarning
};
