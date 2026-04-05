// Design Ref: §4.4 — lib/evolution/index.js 공개 API (14 exports)
// Skill Evolution: Auditable Self-Learning for bkit
'use strict';

const miner = require('./pattern-miner');
const synthesizer = require('./skill-synthesizer');
const tracker = require('./tracker');

module.exports = {
  // Pattern Miner (5 exports)
  mineGapPatterns: miner.mineGapPatterns,
  mineMetricPatterns: miner.mineMetricPatterns,
  mineBtwPatterns: miner.mineBtwPatterns,
  scorePattern: miner.scorePattern,
  mineAll: miner.mineAll,

  // Skill Synthesizer (4 exports)
  classifyPattern: synthesizer.classifyPattern,
  synthesizeSkill: synthesizer.synthesizeSkill,
  generateEvalFromPattern: synthesizer.generateEvalFromPattern,
  synthesizeAll: synthesizer.synthesizeAll,

  // Tracker (5 exports)
  propose: tracker.propose,
  approve: tracker.approve,
  reject: tracker.reject,
  getStatus: tracker.getStatus,
  getHistory: tracker.getHistory,
};
