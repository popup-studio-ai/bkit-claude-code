// Design Ref: §2.1 — Evolution Tracker: 생애주기 관리 + 감사 로그
// Plan SC: SC-4 (모든 진화 액션 감사 로그 100% 기록)
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { read: stateRead, write: stateWrite } = require('../core/state-store');
const { writeAuditLog } = require('../audit/audit-logger');

// Design Ref: §3.4 — 데이터 파일 경로
const EVOLUTION_DIR = path.join(process.cwd(), '.bkit', 'evolution');
const PROPOSALS_PATH = path.join(EVOLUTION_DIR, 'proposals.json');
const HISTORY_PATH = path.join(EVOLUTION_DIR, 'history.json');
const STAGING_DIR = path.join(EVOLUTION_DIR, 'staging');

const MAX_HISTORY_ENTRIES = 200;

// ─── Internal Helpers ──────────────────────────────────────────────────

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readProposals() {
  ensureDir(EVOLUTION_DIR);
  return stateRead(PROPOSALS_PATH) || { version: '1.0', lastMined: null, proposals: [] };
}

function writeProposals(data) {
  ensureDir(EVOLUTION_DIR);
  stateWrite(PROPOSALS_PATH, data);
}

function readHistory() {
  ensureDir(EVOLUTION_DIR);
  return stateRead(HISTORY_PATH) || { version: '1.0', maxEntries: MAX_HISTORY_ENTRIES, entries: [] };
}

function writeHistory(data) {
  ensureDir(EVOLUTION_DIR);
  stateWrite(HISTORY_PATH, data);
}

function appendHistory(entry) {
  const history = readHistory();
  history.entries.push(entry);
  // Design Ref: §6 — FIFO 200건 초과 시 가장 오래된 항목 삭제
  if (history.entries.length > MAX_HISTORY_ENTRIES) {
    history.entries = history.entries.slice(-MAX_HISTORY_ENTRIES);
  }
  writeHistory(history);
}

// ─── Public API ────────────────────────────────────────────────────────

/**
 * Record staged skills as proposals.
 * Design Ref: §4.3 — propose(skills) → void
 *
 * @param {StagedSkill[]} skills - synthesized skills from skill-synthesizer
 */
function propose(skills) {
  if (!skills || skills.length === 0) return;

  const data = readProposals();
  data.lastMined = new Date().toISOString();

  for (const skill of skills) {
    // Remove existing proposal with same name (replace with newer)
    data.proposals = data.proposals.filter(p => p.name !== skill.name);

    data.proposals.push({
      name: skill.name,
      classification: skill.classification,
      description: skill.description,
      sourcePattern: {
        id: skill.sourcePattern.id,
        type: skill.sourcePattern.type,
        confidence: skill.sourcePattern.confidence,
        occurrences: skill.sourcePattern.occurrences,
      },
      status: 'proposed',
      proposedAt: new Date().toISOString(),
    });

    // Audit log
    writeAuditLog({
      action: 'evolution_proposed',
      category: 'evolution',
      target: skill.name,
      targetType: 'skill',
      details: {
        classification: skill.classification,
        patternType: skill.sourcePattern.type,
        confidence: skill.sourcePattern.confidence,
        occurrences: skill.sourcePattern.occurrences,
      },
      result: 'success',
      actor: 'system',
    });

    // Also record in history
    appendHistory({
      id: crypto.randomUUID(),
      skillName: skill.name,
      status: 'proposed',
      sourcePattern: skill.sourcePattern,
      proposedAt: new Date().toISOString(),
      resolvedAt: null,
      reason: null,
      metrics: null,
    });
  }

  writeProposals(data);
}

/**
 * Approve a proposed skill — move from staging to project skills.
 * Design Ref: §4.3 — approve(skillName) → { success, path }
 *
 * @param {string} skillName
 * @returns {{ success: boolean, path: string|null, error?: string }}
 */
function approve(skillName) {
  const data = readProposals();
  const proposal = data.proposals.find(p => p.name === skillName);

  if (!proposal) {
    return { success: false, path: null, error: `'${skillName}' 제안을 찾을 수 없습니다.` };
  }

  if (proposal.status === 'approved') {
    return { success: false, path: null, error: '이미 배포된 스킬입니다.' };
  }

  // Check staging directory exists
  const stagingPath = path.join(STAGING_DIR, skillName);
  if (!fs.existsSync(stagingPath)) {
    return { success: false, path: null, error: `Staging directory not found: ${stagingPath}` };
  }

  // Design Ref: §10.2 — Deploy to .claude/skills/project/{name}/
  const deployDir = path.join(process.cwd(), '.claude', 'skills', 'project', skillName);
  fs.mkdirSync(deployDir, { recursive: true });

  // Copy files from staging to deploy
  copyDirRecursive(stagingPath, deployDir);

  // Update proposal status
  proposal.status = 'approved';
  writeProposals(data);

  // Record in history
  appendHistory({
    id: crypto.randomUUID(),
    skillName,
    status: 'approved',
    sourcePattern: proposal.sourcePattern,
    proposedAt: proposal.proposedAt,
    resolvedAt: new Date().toISOString(),
    reason: null,
    metrics: null,
  });

  // Audit log
  writeAuditLog({
    action: 'evolution_approved',
    category: 'evolution',
    target: skillName,
    targetType: 'skill',
    details: {
      deployPath: deployDir,
      classification: proposal.classification,
    },
    result: 'success',
    actor: 'user',
  });

  // Clean up staging
  rmDirRecursive(stagingPath);

  return { success: true, path: deployDir };
}

/**
 * Reject a proposed skill with a reason.
 * Design Ref: §4.3 — reject(skillName, reason) → void
 *
 * @param {string} skillName
 * @param {string} reason
 * @returns {{ success: boolean, error?: string }}
 */
function reject(skillName, reason) {
  const data = readProposals();
  const proposal = data.proposals.find(p => p.name === skillName);

  if (!proposal) {
    return { success: false, error: `'${skillName}' 제안을 찾을 수 없습니다.` };
  }

  // Update status
  proposal.status = 'rejected';
  writeProposals(data);

  // Record in history
  appendHistory({
    id: crypto.randomUUID(),
    skillName,
    status: 'rejected',
    sourcePattern: proposal.sourcePattern,
    proposedAt: proposal.proposedAt,
    resolvedAt: new Date().toISOString(),
    reason: reason || 'No reason provided',
    metrics: null,
  });

  // Audit log
  writeAuditLog({
    action: 'evolution_rejected',
    category: 'evolution',
    target: skillName,
    targetType: 'skill',
    details: { reason: reason || 'No reason provided' },
    result: 'success',
    actor: 'user',
  });

  // Clean up staging
  const stagingPath = path.join(STAGING_DIR, skillName);
  if (fs.existsSync(stagingPath)) {
    rmDirRecursive(stagingPath);
  }

  return { success: true };
}

/**
 * Get current evolution status.
 * Design Ref: §4.3 — getStatus() → EvolutionStatus
 *
 * @returns {EvolutionStatus}
 */
function getStatus() {
  const data = readProposals();
  const history = readHistory();

  const pending = data.proposals.filter(p => p.status === 'proposed');
  const approved = history.entries.filter(e => e.status === 'approved');
  const rejected = history.entries.filter(e => e.status === 'rejected');

  return {
    lastMined: data.lastMined,
    pending: pending.length,
    approved: approved.length,
    rejected: rejected.length,
    proposals: pending,
    totalHistoryEntries: history.entries.length,
  };
}

/**
 * Get evolution history entries.
 * Design Ref: §4.3 — getHistory(limit?) → EvolutionEntry[]
 *
 * @param {number} [limit=20]
 * @returns {EvolutionEntry[]}
 */
function getHistory(limit = 20) {
  const history = readHistory();
  return history.entries.slice(-limit).reverse();
}

// ─── File Helpers ──────────────────────────────────────────────────────

function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function rmDirRecursive(dir) {
  if (!fs.existsSync(dir)) return;
  fs.rmSync(dir, { recursive: true, force: true });
}

module.exports = {
  propose,
  approve,
  reject,
  getStatus,
  getHistory,
};
