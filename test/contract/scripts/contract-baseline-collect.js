#!/usr/bin/env node
/**
 * Contract Baseline Collector — v2.1.10
 *
 * Captures Invocation Surface (skills/agents/MCP tools/hooks/slash commands)
 * as deterministic JSON snapshots under test/contract/baseline/<version>/.
 *
 * Design Ref: bkit-v2110-invocation-contract-addendum.plan.md §9.2
 * Plan SC: 619 CI-gate TC + 5 L5 TC = 624 TC baseline.
 *
 * Usage:
 *   node test/contract/scripts/contract-baseline-collect.js --version v2.1.9
 *
 * @module test/contract/scripts/contract-baseline-collect
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const args = process.argv.slice(2);
const versionArgIdx = args.indexOf('--version');
const version = versionArgIdx >= 0 ? args[versionArgIdx + 1] : 'v2.1.9';
const BASE_DIR = path.join(PROJECT_ROOT, 'test', 'contract', 'baseline', version);

/** Minimal YAML frontmatter parser — supports scalars, lists, booleans, ints, strings (single line). */
function parseFrontmatter(markdown) {
  if (typeof markdown !== 'string') return {};
  const m = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const body = m[1];
  const lines = body.split(/\r?\n/);
  const out = {};
  let currentKey = null;
  let currentList = null;
  for (const rawLine of lines) {
    if (!rawLine.trim()) continue;
    const listMatch = rawLine.match(/^\s+-\s+(.*)$/);
    if (listMatch && currentList) {
      currentList.push(coerce(listMatch[1].trim()));
      continue;
    }
    const kv = rawLine.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.*)$/);
    if (kv) {
      currentKey = kv[1];
      const rawVal = kv[2].trim();
      if (rawVal === '') {
        currentList = [];
        out[currentKey] = currentList;
      } else {
        out[currentKey] = coerce(rawVal);
        currentList = null;
      }
    }
  }
  return out;
}

function coerce(v) {
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (/^-?\d+$/.test(v)) return parseInt(v, 10);
  if (/^-?\d+\.\d+$/.test(v)) return parseFloat(v);
  if (/^\[.*\]$/.test(v)) {
    try {
      return JSON.parse(v.replace(/'/g, '"'));
    } catch {
      /* fall through */
    }
  }
  return v.replace(/^['"]|['"]$/g, '');
}

function sortKeysDeep(obj) {
  if (Array.isArray(obj)) return obj.map(sortKeysDeep);
  if (obj !== null && typeof obj === 'object') {
    const sorted = {};
    for (const key of Object.keys(obj).sort()) {
      sorted[key] = sortKeysDeep(obj[key]);
    }
    return sorted;
  }
  return obj;
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function writeJSON(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(sortKeysDeep(data), null, 2) + '\n', 'utf8');
}

// v2.1.17: collect* functions accept { persist, baseDir } options for read-only invocation
// from contract-test-run.js. Default persist=true preserves backward-compat with main().
function collectSkills(opts = {}) {
  const { persist = true, baseDir = BASE_DIR } = opts;
  const skillsDir = path.join(PROJECT_ROOT, 'skills');
  if (!fs.existsSync(skillsDir)) return { count: 0 };
  const dirs = fs.readdirSync(skillsDir).filter((d) => {
    return fs.statSync(path.join(skillsDir, d)).isDirectory();
  });
  const out = { count: 0, names: [] };
  for (const name of dirs) {
    const skillMd = path.join(skillsDir, name, 'SKILL.md');
    if (!fs.existsSync(skillMd)) continue;
    const content = fs.readFileSync(skillMd, 'utf8');
    const fm = parseFrontmatter(content);
    const projected = {
      name: fm.name || name,
      dirName: name,
      effort: fm.effort || null,
      context: fm.context || null,
      userInvocable: fm['user-invocable'] !== undefined ? fm['user-invocable'] : null,
      descriptionLength: typeof fm.description === 'string' ? fm.description.length : 0,
      // v2.1.17: deprecation governance metadata (optional, captured when present)
      deprecatedIn: fm.deprecatedIn || null,
      replacedBy: fm.replacedBy || null,
    };
    if (persist) {
      writeJSON(path.join(baseDir, 'skills', `${projected.name}.json`), projected);
    }
    out.names.push(projected.name);
    out.count++;
  }
  return out;
}

function collectAgents(opts = {}) {
  const { persist = true, baseDir = BASE_DIR } = opts;
  const agentsDir = path.join(PROJECT_ROOT, 'agents');
  if (!fs.existsSync(agentsDir)) return { count: 0 };
  const files = fs.readdirSync(agentsDir).filter((f) => f.endsWith('.md'));
  const out = { count: 0, names: [] };
  for (const file of files) {
    const fullPath = path.join(agentsDir, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    const fm = parseFrontmatter(content);
    const baseName = file.replace(/\.md$/, '');
    const projected = {
      name: fm.name || baseName,
      fileName: baseName,
      model: fm.model || null,
      effort: fm.effort || null,
      hasTools: fm.tools !== undefined,
      descriptionLength: typeof fm.description === 'string' ? fm.description.length : 0,
      // v2.1.17: deprecation governance metadata (optional, captured when present)
      deprecatedIn: fm.deprecatedIn || null,
      replacedBy: fm.replacedBy || null,
    };
    if (persist) {
      writeJSON(path.join(baseDir, 'agents', `${projected.name}.json`), projected);
    }
    out.names.push(projected.name);
    out.count++;
  }
  return out;
}

function collectMCPTools(opts = {}) {
  const { persist = true, baseDir = BASE_DIR } = opts;
  const serversDir = path.join(PROJECT_ROOT, 'servers');
  const out = { count: 0, servers: {} };
  if (!fs.existsSync(serversDir)) return out;
  const servers = fs.readdirSync(serversDir).filter((s) => {
    return fs.statSync(path.join(serversDir, s)).isDirectory();
  });
  for (const server of servers) {
    const serverDir = path.join(serversDir, server);
    // Heuristic: grep tool name patterns from index.js
    const indexPath = path.join(serverDir, 'index.js');
    const toolNames = [];
    if (fs.existsSync(indexPath)) {
      const content = fs.readFileSync(indexPath, 'utf8');
      // Match unquoted-key `name: 'bkit_xxx'` (observed pattern in servers/*/index.js)
      // and also `"name": "bkit_xxx"` for future-proofing.
      const re = /(?:^|[\s{,])["']?name["']?\s*:\s*['"](bkit_[a-z_]+)['"]/gm;
      let m;
      while ((m = re.exec(content)) !== null) {
        if (!toolNames.includes(m[1])) toolNames.push(m[1]);
      }
    }
    toolNames.sort();
    if (persist) {
      for (const tn of toolNames) {
        writeJSON(path.join(baseDir, 'mcp-tools', server, `${tn}.json`), { server, name: tn });
      }
    }
    out.servers[server] = toolNames;
    out.count += toolNames.length;
  }
  return out;
}

function collectHooks(opts = {}) {
  const { persist = true, baseDir = BASE_DIR } = opts;
  const hooksJson = path.join(PROJECT_ROOT, 'hooks', 'hooks.json');
  if (!fs.existsSync(hooksJson)) return { events: 0, blocks: 0 };
  const data = JSON.parse(fs.readFileSync(hooksJson, 'utf8'));
  const summary = {};
  let blocks = 0;
  for (const [evt, entries] of Object.entries(data.hooks || {})) {
    summary[evt] = {
      blockCount: entries.length,
      matchers: entries.map((e) => e.matcher || null).filter(Boolean).sort(),
      handlerBasenames: entries
        .flatMap((e) => (e.hooks || []).map((h) => (h.command || '').split('/').pop()))
        .sort(),
    };
    blocks += entries.length;
  }
  if (persist) {
    writeJSON(path.join(baseDir, 'hook-events.json'), summary);
  }
  return { events: Object.keys(summary).length, blocks };
}

function collectSlashCommands(opts = {}) {
  const { persist = true, baseDir = BASE_DIR } = opts;
  const out = { plugin: [], custom: [] };
  // Plugin bundled: skill dirnames that are user-invocable
  const skillsDir = path.join(PROJECT_ROOT, 'skills');
  if (fs.existsSync(skillsDir)) {
    const dirs = fs.readdirSync(skillsDir).filter((d) => {
      return fs.statSync(path.join(skillsDir, d)).isDirectory();
    });
    for (const d of dirs) {
      const skillMd = path.join(skillsDir, d, 'SKILL.md');
      if (!fs.existsSync(skillMd)) continue;
      const fm = parseFrontmatter(fs.readFileSync(skillMd, 'utf8'));
      if (fm['user-invocable'] === false) continue;
      out.plugin.push(`/bkit:${fm.name || d}`);
    }
  }
  // Custom
  const cmdDir = path.join(PROJECT_ROOT, '.claude', 'commands');
  if (fs.existsSync(cmdDir)) {
    const files = fs.readdirSync(cmdDir).filter((f) => f.endsWith('.md'));
    for (const f of files) out.custom.push('/' + f.replace(/\.md$/, ''));
  }
  if (persist) {
    writeJSON(path.join(baseDir, 'slash-commands.json'), out);
  }
  return out;
}

function main() {
  ensureDir(BASE_DIR);
  const report = {
    version,
    collectedAt: new Date().toISOString(),
    skills: collectSkills(),
    agents: collectAgents(),
    mcpTools: collectMCPTools(),
    hooks: collectHooks(),
    slashCommands: collectSlashCommands(),
  };
  writeJSON(path.join(BASE_DIR, '_MANIFEST.json'), report);
  // eslint-disable-next-line no-console
  console.log(`[contract] Baseline collected: ${version}`);
  // eslint-disable-next-line no-console
  console.log(
    `  Skills: ${report.skills.count}, Agents: ${report.agents.count}, ` +
      `MCP: ${report.mcpTools.count}, Hooks: ${report.hooks.events} events / ${report.hooks.blocks} blocks, ` +
      `Slash: ${report.slashCommands.plugin.length + report.slashCommands.custom.length}`
  );
}

if (require.main === module) main();

module.exports = {
  parseFrontmatter,
  sortKeysDeep,
  collectSkills,
  collectAgents,
  collectMCPTools,
  collectHooks,
  collectSlashCommands,
  coerce,
};
