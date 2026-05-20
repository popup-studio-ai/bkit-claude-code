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
// v2.1.18: frontmatter parsing moved to lib/util/frontmatter.js (CO-5).
const { parseFrontmatter, coerce } = require('../../../lib/util/frontmatter');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const args = process.argv.slice(2);
const versionArgIdx = args.indexOf('--version');
const version = versionArgIdx >= 0 ? args[versionArgIdx + 1] : 'v2.1.9';

// v2.1.17 (CO-1.1): validate --version to prevent path-injection via
// concatenation into BASE_DIR. Only allow [A-Za-z0-9._-]+ — matches
// version tags (v2.1.9), simple identifiers (fixture, latest, dev),
// rejects path-like inputs (/tmp/foo, ../bar, baseline/x).
if (!/^[A-Za-z0-9._-]+$/.test(version)) {
  // eslint-disable-next-line no-console
  console.error(
    `[contract] Invalid --version '${version}'. ` +
      `Must match /^[A-Za-z0-9._-]+$/ (e.g., 'v2.1.9', 'fixture').`
  );
  process.exit(2);
}

const BASE_DIR = path.join(PROJECT_ROOT, 'test', 'contract', 'baseline', version);

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
  const { persist = true, baseDir = BASE_DIR, projectRoot = PROJECT_ROOT } = opts;
  const skillsDir = path.join(projectRoot, 'skills');
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
  const { persist = true, baseDir = BASE_DIR, projectRoot = PROJECT_ROOT } = opts;
  const agentsDir = path.join(projectRoot, 'agents');
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

/**
 * Parse MCP tool definition blocks from a server's index.js source.
 *
 * v2.1.18 (CO-2): Recognizes inline deprecation annotations placed in the
 * comment block immediately preceding the `name: 'bkit_xxx'` line:
 *
 *   // @deprecated since v2.1.13 replacedBy=bkit_new_tool reason="superseded"
 *   {
 *     name: 'bkit_old_tool',
 *     ...
 *   }
 *
 * @param {string} source — index.js full content
 * @returns {Array<{ name: string, deprecatedIn: string|null, replacedBy: string|null }>}
 */
function parseMCPToolBlocks(source) {
  const lines = source.split(/\r?\n/);
  const nameRe = /(?:^|[\s{,])["']?name["']?\s*:\s*['"](bkit_[a-z_]+)['"]/;
  const depRe = /@deprecated\s+since\s+(v[\d.]+)(?:\s+replacedBy=([\w-]+))?/i;
  const out = [];
  const seen = new Set();
  for (let i = 0; i < lines.length; i++) {
    const nameMatch = lines[i].match(nameRe);
    if (!nameMatch) continue;
    const toolName = nameMatch[1];
    if (seen.has(toolName)) continue;
    seen.add(toolName);
    // Look back up to 10 lines for @deprecated annotation
    let deprecatedIn = null;
    let replacedBy = null;
    const lookbackStart = Math.max(0, i - 10);
    for (let j = i - 1; j >= lookbackStart; j--) {
      const line = lines[j].trim();
      if (line.startsWith('//') || line.startsWith('*')) {
        const m = line.match(depRe);
        if (m) {
          deprecatedIn = m[1];
          replacedBy = m[2] || null;
          break;
        }
      } else if (line !== '' && line !== '{' && !line.startsWith('/*')) {
        // Hit a non-comment, non-empty line — stop scanning
        break;
      }
    }
    out.push({ name: toolName, deprecatedIn, replacedBy });
  }
  return out;
}

function collectMCPTools(opts = {}) {
  const { persist = true, baseDir = BASE_DIR, projectRoot = PROJECT_ROOT } = opts;
  const serversDir = path.join(projectRoot, 'servers');
  const out = { count: 0, servers: {} };
  if (!fs.existsSync(serversDir)) return out;
  const servers = fs.readdirSync(serversDir).filter((s) => {
    return fs.statSync(path.join(serversDir, s)).isDirectory();
  });
  for (const server of servers) {
    const serverDir = path.join(serversDir, server);
    const indexPath = path.join(serverDir, 'index.js');
    let tools = [];
    if (fs.existsSync(indexPath)) {
      const content = fs.readFileSync(indexPath, 'utf8');
      tools = parseMCPToolBlocks(content);
    }
    tools.sort((a, b) => a.name.localeCompare(b.name));
    if (persist) {
      for (const tool of tools) {
        writeJSON(path.join(baseDir, 'mcp-tools', server, `${tool.name}.json`), {
          server,
          name: tool.name,
          // v2.1.18 (CO-2): deprecation metadata captured from inline annotation
          deprecatedIn: tool.deprecatedIn || null,
          replacedBy: tool.replacedBy || null,
        });
      }
    }
    out.servers[server] = tools.map((t) => t.name);
    out.count += tools.length;
  }
  return out;
}

function collectHooks(opts = {}) {
  const { persist = true, baseDir = BASE_DIR, projectRoot = PROJECT_ROOT } = opts;
  const hooksJson = path.join(projectRoot, 'hooks', 'hooks.json');
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
  const { persist = true, baseDir = BASE_DIR, projectRoot = PROJECT_ROOT } = opts;
  const out = { plugin: [], custom: [] };
  // Plugin bundled: skill dirnames that are user-invocable
  const skillsDir = path.join(projectRoot, 'skills');
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
  const cmdDir = path.join(projectRoot, '.claude', 'commands');
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
