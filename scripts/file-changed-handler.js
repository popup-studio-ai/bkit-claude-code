#!/usr/bin/env node
/**
 * file-changed-handler.js - FileChanged Hook Handler (v2.1.1 H-04)
 *
 * Detects changes to PDCA documents (docs/01-plan/, docs/02-design/, etc.)
 * and suggests gap-detector re-run when design docs change during do+ phases.
 *
 * Hook: FileChanged (CC v2.1.83+)
 * Filter: if: "Write|Edit(docs/[star][star]/[star].md)"
 */

const { readStdinSync, outputAllow, outputEmpty } = require('../lib/core/io');
const { debugLog } = require('../lib/core/debug');
const { getPdcaStatusFull } = require('../lib/pdca/status');

// PDCA doc directories that trigger gap-detector suggestion
const PDCA_DOC_DIRS = ['docs/01-plan/', 'docs/02-design/'];

// Phases where design doc changes matter (do and later)
const ACTIVE_PHASES = ['do', 'check', 'act', 'report'];

debugLog('FileChanged', 'Hook started');

let input = {};
try {
  input = readStdinSync();
} catch (e) {
  debugLog('FileChanged', 'Failed to parse input', { error: e.message });
  outputEmpty();
  process.exit(0);
}

const filePath = input?.tool_input?.file_path || input?.file_path || '';

debugLog('FileChanged', 'File changed', { filePath });

// Check if changed file is a PDCA document
const isPdcaDoc = PDCA_DOC_DIRS.some(dir => filePath.includes(dir));
if (!isPdcaDoc) {
  outputEmpty();
  process.exit(0);
}

// Check current PDCA phase
const pdcaStatus = getPdcaStatusFull();
const currentPhase = pdcaStatus?.currentPhase || pdcaStatus?.session?.currentPhase || null;

if (currentPhase && ACTIVE_PHASES.includes(currentPhase.toLowerCase())) {
  outputAllow(
    `Design document changed: ${filePath}. Consider running gap-detector to check design-implementation alignment.`,
    'FileChanged'
  );
} else {
  outputEmpty();
}

debugLog('FileChanged', 'Hook completed', { filePath, currentPhase, isPdcaDoc });
