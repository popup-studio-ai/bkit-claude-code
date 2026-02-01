#!/usr/bin/env node
/**
 * archive-feature.js - Archive completed PDCA documents (v1.4.8)
 *
 * Purpose: Move completed PDCA documents to archive folder
 * Usage: node archive-feature.js <feature-name> [--preserve-summary]
 * Creates: docs/archive/YYYY-MM/{feature}/
 *
 * Options:
 *   --preserve-summary, --summary, -s: Keep summary info in status (FR-04)
 *
 * Converted from: scripts/archive-feature.sh
 */

const fs = require('fs');
const path = require('path');
const { PROJECT_DIR } = require('../lib/common.js');
const { deleteFeatureFromStatus, updatePdcaStatus, archiveFeatureToSummary } = require('../lib/pdca/status');

// FR-04: Parse --preserve-summary option
const preserveSummary = process.argv.includes('--preserve-summary') ||
                        process.argv.includes('--summary') ||
                        process.argv.includes('-s');

// Get feature name from argument (skip options)
const feature = process.argv.slice(2).find(arg => !arg.startsWith('-'));

if (!feature) {
  console.log('Usage: archive-feature.js <feature-name> [options]');
  console.log('');
  console.log('Options:');
  console.log('  --preserve-summary, --summary, -s  Keep summary info in status (FR-04)');
  console.log('');
  console.log('Examples:');
  console.log('  archive-feature.js login              # Complete deletion from status');
  console.log('  archive-feature.js login --summary    # Preserve summary in status');
  process.exit(1);
}

// Set up paths
const now = new Date();
const archiveDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
const archiveDir = path.join(PROJECT_DIR, 'docs', 'archive', archiveDate, feature);

// Document paths to check
const docPaths = {
  plan: path.join(PROJECT_DIR, `docs/01-plan/features/${feature}.plan.md`),
  design: path.join(PROJECT_DIR, `docs/02-design/features/${feature}.design.md`),
  analysis: path.join(PROJECT_DIR, `docs/03-analysis/${feature}.analysis.md`),
  analysisAlt: path.join(PROJECT_DIR, `docs/03-analysis/${feature}.gap-analysis.md`),
  report: path.join(PROJECT_DIR, `docs/04-report/${feature}.report.md`),
  reportAlt: path.join(PROJECT_DIR, `docs/04-report/${feature}.completion-report.md`)
};

// Count existing documents
const existingDocs = [];
if (fs.existsSync(docPaths.plan)) existingDocs.push({ type: 'plan', path: docPaths.plan });
if (fs.existsSync(docPaths.design)) existingDocs.push({ type: 'design', path: docPaths.design });
if (fs.existsSync(docPaths.analysis)) existingDocs.push({ type: 'analysis', path: docPaths.analysis });
else if (fs.existsSync(docPaths.analysisAlt)) existingDocs.push({ type: 'gap-analysis', path: docPaths.analysisAlt });
if (fs.existsSync(docPaths.report)) existingDocs.push({ type: 'report', path: docPaths.report });
else if (fs.existsSync(docPaths.reportAlt)) existingDocs.push({ type: 'completion-report', path: docPaths.reportAlt });

if (existingDocs.length === 0) {
  console.log(`Error: No PDCA documents found for feature '${feature}'`);
  console.log('');
  console.log('Checked paths:');
  console.log(`  - ${docPaths.plan}`);
  console.log(`  - ${docPaths.design}`);
  console.log(`  - ${docPaths.analysis}`);
  console.log(`  - ${docPaths.report}`);
  process.exit(1);
}

// Create archive directory
fs.mkdirSync(archiveDir, { recursive: true });

// Move documents
const movedDocs = [];
for (const doc of existingDocs) {
  const destPath = path.join(archiveDir, path.basename(doc.path));
  fs.renameSync(doc.path, destPath);
  movedDocs.push(`${doc.type}.md`);
}

// Update archive index
const indexDir = path.join(PROJECT_DIR, 'docs', 'archive', archiveDate);
const indexFile = path.join(indexDir, '_INDEX.md');

if (!fs.existsSync(indexFile)) {
  fs.mkdirSync(indexDir, { recursive: true });
  const header = `# Archive - ${archiveDate}

완료된 PDCA 문서 아카이브입니다.

| Feature | Archived Date | Status | Documents |
|---------|---------------|--------|-----------|
`;
  fs.writeFileSync(indexFile, header);
}

// Add entry to index
const today = now.toISOString().split('T')[0];
const docList = movedDocs.join(', ');
const entry = `| ${feature} | ${today} | Completed | ${docList} |\n`;
fs.appendFileSync(indexFile, entry);

// v1.4.8: Update PDCA status and cleanup feature from status
try {
  // Update phase to archived with archive path
  updatePdcaStatus(feature, 'archived', {
    archivedAt: now.toISOString(),
    archivedTo: archiveDir
  });

  // FR-04: Choose cleanup method based on option
  if (preserveSummary) {
    // FR-04: Preserve summary info (70% size reduction)
    const summaryResult = archiveFeatureToSummary(feature);
    if (!summaryResult.success) {
      console.warn(`⚠️  Warning: Could not summarize feature: ${summaryResult.reason}`);
      console.warn(`   Feature '${feature}' remains with full data in .pdca-status.json`);
    } else {
      console.log(`📊 Summary preserved in .pdca-status.json`);
    }
  } else {
    // Default: Complete deletion from status
    const cleanupResult = deleteFeatureFromStatus(feature);
    if (!cleanupResult.success) {
      console.warn(`⚠️  Warning: Could not cleanup feature from status: ${cleanupResult.reason}`);
      console.warn(`   Feature '${feature}' remains in .pdca-status.json`);
    } else {
      console.log(`🧹 Cleaned up feature from .pdca-status.json`);
    }
  }
} catch (e) {
  console.warn(`⚠️  Warning: Status update failed: ${e.message}`);
}

// Output result
console.log(`✅ Archived: ${feature}`);
console.log('');
console.log(`📁 Location: ${archiveDir}`);
console.log(`📄 Documents moved: ${movedDocs.length}`);
for (const doc of movedDocs) {
  console.log(`   - ${doc}`);
}
console.log('');
console.log(`📋 Index updated: ${indexFile}`);
