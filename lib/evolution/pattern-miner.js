// Design Ref: §2.1 — Pattern Miner: 3종 패턴 감지 엔진
// Plan SC: SC-1 (60% 프로젝트 스킬 제안 생성), SC-4 (감사 로그 100%)
'use strict';

const fs = require('fs');
const path = require('path');
const { read: stateRead } = require('../core/state-store');
const { STATE_PATHS } = require('../core/paths');

// Design Ref: §3.4 — bkit.config.json evolution 섹션 기본값
const DEFAULT_CONFIG = {
  minConfidence: 0.6,
  initialConfidence: 0.7,
  maxProposals: 5,
  minOccurrences: 3,
  btwSimilarityThreshold: 0.7,
};

/**
 * Load evolution config from bkit.config.json, falling back to defaults.
 */
function getConfig() {
  try {
    const configPath = path.join(process.cwd(), 'bkit.config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return { ...DEFAULT_CONFIG, ...(config.evolution || {}) };
    }
  } catch (_) { /* use defaults */ }
  return { ...DEFAULT_CONFIG };
}

// ─── Pattern A: Gap Frequency ──────────────────────────────────────────

/**
 * Mine gap analysis documents for recurring gap types.
 * Design Ref: §4.1 — mineGapPatterns(analysisDir?) → Pattern[]
 *
 * @param {string} [analysisDir] - path to analysis docs (default: docs/03-analysis/)
 * @returns {Pattern[]}
 */
function mineGapPatterns(analysisDir) {
  const dir = analysisDir || path.join(process.cwd(), 'docs', '03-analysis');
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.analysis.md'));
  if (files.length === 0) return [];

  // Extract gap items from analysis documents
  // Gap format: lines containing "gap", "missing", "not implemented", severity markers
  const gapCounts = {};   // { gapType: { count, evidence[] } }

  for (const file of files) {
    const content = fs.readFileSync(path.join(dir, file), 'utf8');
    const lines = content.split('\n');

    for (const line of lines) {
      const lower = line.toLowerCase();
      // Look for gap/issue indicators in analysis docs
      if (lower.includes('gap') || lower.includes('missing') ||
          lower.includes('not implemented') || lower.includes('placeholder')) {
        // Extract gap type by normalizing the line into a key
        const gapType = extractGapType(lower);
        if (!gapType) continue;

        if (!gapCounts[gapType]) {
          gapCounts[gapType] = { count: 0, evidence: [] };
        }
        gapCounts[gapType].count++;
        gapCounts[gapType].evidence.push({
          source: `docs/03-analysis/${file}`,
          excerpt: line.trim().slice(0, 120),
          timestamp: getFileTimestamp(path.join(dir, file)),
        });
      }
    }
  }

  const config = getConfig();
  return Object.entries(gapCounts)
    .filter(([, v]) => v.count >= config.minOccurrences)
    .map(([gapType, data]) => ({
      id: `gap-${slugify(gapType)}`,
      type: 'gap_frequency',
      name: gapType,
      description: `Gap "${gapType}" recurred ${data.count} times across ${new Set(data.evidence.map(e => e.source)).size} analysis documents`,
      occurrences: data.count,
      confidence: 0,  // scored later
      evidence: data.evidence,
      suggestedSkillName: `${slugify(gapType)}-guard`,
      detectedAt: new Date().toISOString(),
    }));
}

/**
 * Extract a normalized gap type from an analysis line.
 */
function extractGapType(line) {
  // Common gap patterns
  const patterns = [
    /missing[\s-]+([\w-]+(?:\s+[\w-]+)?)/,
    /gap[:\s]+([\w-]+(?:\s+[\w-]+)?)/,
    /not\s+implemented[:\s]+([\w-]+(?:\s+[\w-]+)?)/,
    /placeholder[:\s]+([\w-]+(?:\s+[\w-]+)?)/,
  ];

  const stopWords = new Set(['in', 'on', 'at', 'to', 'for', 'the', 'a', 'an', 'of', 'is', 'was', 'be']);
  for (const pat of patterns) {
    const match = line.match(pat);
    if (match && match[1]) {
      const words = match[1].trim().toLowerCase().split(/\s+/).filter(w => !stopWords.has(w));
      if (words.length > 0) return words.join('-');
    }
  }
  return null;
}

// ─── Pattern B: Metric Degradation ─────────────────────────────────────

/**
 * Mine quality-history.json for metrics that drop at specific PDCA phases.
 * Design Ref: §4.1 — mineMetricPatterns(historyPath?) → Pattern[]
 *
 * @param {string} [historyPath] - path to quality-history.json
 * @returns {Pattern[]}
 */
function mineMetricPatterns(historyPath) {
  const filePath = historyPath || STATE_PATHS.qualityHistory();
  const history = stateRead(filePath);
  if (!history || !history.points || history.points.length < 3) return [];

  // Group data points by phase and detect metric drops
  // A "drop" = metric value decreased compared to previous data point for the same feature
  const phaseDrops = {};  // { 'M7-do': { count, evidence[] } }

  const metrics = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10'];
  // Higher-is-better metrics (drops are bad)
  const higherBetter = new Set(['M1', 'M2', 'M4', 'M7', 'M8', 'M9']);
  // Lower-is-better metrics (increases are bad)
  const lowerBetter = new Set(['M3', 'M5', 'M6', 'M10']);

  // Sort points by timestamp
  const sorted = [...history.points].sort((a, b) =>
    new Date(a.timestamp) - new Date(b.timestamp)
  );

  // Compare consecutive points for same feature
  const byFeature = {};
  for (const point of sorted) {
    const feat = point.feature || 'unknown';
    if (!byFeature[feat]) byFeature[feat] = [];
    byFeature[feat].push(point);
  }

  for (const [feature, points] of Object.entries(byFeature)) {
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      if (!curr.values || !prev.values) continue;

      for (const metric of metrics) {
        const prevVal = prev.values[metric];
        const currVal = curr.values[metric];
        if (prevVal == null || currVal == null) continue;

        const isDrop = (higherBetter.has(metric) && currVal < prevVal - 5) ||
                       (lowerBetter.has(metric) && currVal > prevVal + 5);

        if (isDrop && curr.phase) {
          const key = `${metric}-${curr.phase}`;
          if (!phaseDrops[key]) phaseDrops[key] = { metric, phase: curr.phase, count: 0, evidence: [] };
          phaseDrops[key].count++;
          phaseDrops[key].evidence.push({
            source: `quality-history/${feature}`,
            excerpt: `${metric}: ${prevVal} → ${currVal} at ${curr.phase} phase`,
            timestamp: curr.timestamp || new Date().toISOString(),
          });
        }
      }
    }
  }

  const config = getConfig();
  return Object.values(phaseDrops)
    .filter(d => d.count >= config.minOccurrences)
    .map(d => ({
      id: `metric-${d.metric.toLowerCase()}-${d.phase}`,
      type: 'metric_degradation',
      name: `${d.metric} degradation at ${d.phase}`,
      description: `${d.metric} dropped ${d.count} times at ${d.phase} phase across features`,
      occurrences: d.count,
      confidence: 0,
      evidence: d.evidence,
      suggestedSkillName: `${d.metric.toLowerCase()}-${d.phase}-guard`,
      detectedAt: new Date().toISOString(),
    }));
}

// ─── Pattern C: BTW Clustering ─────────────────────────────────────────

/**
 * Mine btw-suggestions.json for clusters of similar suggestions using Jaccard similarity.
 * Design Ref: §4.1 — mineBtwPatterns(btwPath?) → Pattern[]
 *
 * @param {string} [btwPath] - path to btw-suggestions.json
 * @returns {Pattern[]}
 */
function mineBtwPatterns(btwPath) {
  const filePath = btwPath || path.join(process.cwd(), '.bkit', 'btw-suggestions.json');
  if (!fs.existsSync(filePath)) return [];

  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_) { return []; }

  const suggestions = Array.isArray(data) ? data : (data.suggestions || []);
  if (suggestions.length < 3) return [];

  const config = getConfig();
  const clusters = clusterByJaccard(suggestions, config.btwSimilarityThreshold);

  return clusters
    .filter(c => c.items.length >= config.minOccurrences)
    .map(c => ({
      id: `btw-${slugify(c.label)}`,
      type: 'btw_cluster',
      name: c.label,
      description: `${c.items.length} btw suggestions clustered around "${c.label}"`,
      occurrences: c.items.length,
      confidence: 0,
      evidence: c.items.map(item => ({
        source: 'btw-suggestions.json',
        excerpt: (item.suggestion || item.text || JSON.stringify(item)).slice(0, 120),
        timestamp: item.timestamp || new Date().toISOString(),
      })),
      suggestedSkillName: `${slugify(c.label)}-reminder`,
      detectedAt: new Date().toISOString(),
    }));
}

/**
 * Cluster suggestions by keyword-based Jaccard similarity.
 * Design Ref: §10.1 — 키워드 Jaccard (외부 의존성 없음)
 */
function clusterByJaccard(suggestions, threshold) {
  // Tokenize each suggestion
  const tokenized = suggestions.map(s => {
    const text = (s.suggestion || s.text || '').toLowerCase();
    return {
      original: s,
      tokens: new Set(text.split(/\s+/).filter(t => t.length > 2)),
    };
  });

  // Simple greedy clustering
  const used = new Set();
  const clusters = [];

  for (let i = 0; i < tokenized.length; i++) {
    if (used.has(i)) continue;

    const cluster = [tokenized[i]];
    used.add(i);

    for (let j = i + 1; j < tokenized.length; j++) {
      if (used.has(j)) continue;

      const sim = jaccardSimilarity(tokenized[i].tokens, tokenized[j].tokens);
      if (sim >= threshold) {
        cluster.push(tokenized[j]);
        used.add(j);
      }
    }

    if (cluster.length >= 2) {
      // Find most common tokens as label
      const allTokens = {};
      for (const c of cluster) {
        for (const t of c.tokens) {
          allTokens[t] = (allTokens[t] || 0) + 1;
        }
      }
      const topTokens = Object.entries(allTokens)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([t]) => t);

      clusters.push({
        label: topTokens.join(' '),
        items: cluster.map(c => c.original),
      });
    }
  }

  return clusters;
}

/**
 * Calculate Jaccard similarity between two token sets.
 */
function jaccardSimilarity(setA, setB) {
  if (setA.size === 0 && setB.size === 0) return 0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// ─── Scoring ───────────────────────────────────────────────────────────

/**
 * Score a raw pattern to compute confidence.
 * Design Ref: §4.1 — confidence = occurrences * evidence_strength * recency_weight
 *
 * @param {Pattern} pattern - raw pattern without confidence
 * @returns {Pattern} - pattern with computed confidence (0.0-1.0)
 */
function scorePattern(pattern) {
  // Base: normalize occurrences (3→0.6, 5→0.8, 10+→1.0)
  const occNorm = Math.min(1.0, 0.4 + (pattern.occurrences / 15));

  // Evidence strength: based on evidence count and diversity
  const sources = new Set(pattern.evidence.map(e => e.source));
  const evStrength = Math.min(1.0, sources.size / 3);

  // Recency weight: newer patterns score higher
  const latestEvidence = pattern.evidence
    .map(e => new Date(e.timestamp).getTime())
    .filter(t => !isNaN(t));
  const now = Date.now();
  const daysSinceLatest = latestEvidence.length > 0
    ? (now - Math.max(...latestEvidence)) / (1000 * 60 * 60 * 24)
    : 30;
  const recency = Math.max(0.3, 1.0 - (daysSinceLatest / 90));

  return {
    ...pattern,
    confidence: Math.round(occNorm * evStrength * recency * 100) / 100,
  };
}

// ─── Unified Mining ────────────────────────────────────────────────────

/**
 * Run all 3 pattern miners, score, filter by confidence, return top N.
 * Design Ref: §4.1 — mineAll(options?) → Pattern[]
 *
 * @param {Object} [options]
 * @param {string} [options.analysisDir]
 * @param {string} [options.historyPath]
 * @param {string} [options.btwPath]
 * @returns {Pattern[]}
 */
function mineAll(options = {}) {
  const config = getConfig();

  // Run all 3 miners
  const gapPatterns = mineGapPatterns(options.analysisDir);
  const metricPatterns = mineMetricPatterns(options.historyPath);
  const btwPatterns = mineBtwPatterns(options.btwPath);

  // Combine and score
  const allPatterns = [...gapPatterns, ...metricPatterns, ...btwPatterns]
    .map(p => scorePattern(p));

  // Filter by confidence threshold
  const threshold = config.initialConfidence || config.minConfidence;
  const filtered = allPatterns.filter(p => p.confidence >= threshold);

  // Sort by confidence descending, take top N
  return filtered
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, config.maxProposals);
}

// ─── Helpers ───────────────────────────────────────────────────────────

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function getFileTimestamp(filePath) {
  try {
    return fs.statSync(filePath).mtime.toISOString();
  } catch (_) {
    return new Date().toISOString();
  }
}

module.exports = {
  mineGapPatterns,
  mineMetricPatterns,
  mineBtwPatterns,
  scorePattern,
  mineAll,
  // Exported for testing
  jaccardSimilarity,
  clusterByJaccard,
  extractGapType,
};
