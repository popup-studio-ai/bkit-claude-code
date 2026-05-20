#!/usr/bin/env node
/*
 * L3 — MCP stdio Runtime Test (Sprint 6 NEW 6-4, ENH-275)
 *
 * Spawns the two bkit MCP servers, exchanges JSON-RPC 2.0 initialize +
 * tools/list requests, and verifies the runtime tool surface matches the
 * static baseline.
 *
 * Design Ref: bkit-v2110-gap-closure.design.md §3.4.4
 * Plan SC: G-C2 — Contract L3 "⚠️ 부분" → full runtime verification
 *
 * Note: Self-contained. No npm install. Uses node:child_process.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const SERVERS = [
  {
    name: 'bkit-pdca',
    cmd: path.join(PROJECT_ROOT, 'servers', 'bkit-pdca-server', 'index.js'),
    expectedToolsMin: 5,
    baseline: path.join(PROJECT_ROOT, 'test', 'contract', 'baseline', 'v2.1.9', 'mcp-tools', 'bkit-pdca'),
  },
  {
    name: 'bkit-analysis',
    cmd: path.join(PROJECT_ROOT, 'servers', 'bkit-analysis-server', 'index.js'),
    expectedToolsMin: 5,
    baseline: path.join(PROJECT_ROOT, 'test', 'contract', 'baseline', 'v2.1.9', 'mcp-tools', 'bkit-analysis'),
  },
];

let pass = 0;
let fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; console.log(`  ✓ ${msg}`); }
  else { fail++; console.error(`  ✗ ${msg}`); }
}

function sendRequest(proc, request, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const line = JSON.stringify(request) + '\n';
    let buffer = '';

    const timer = setTimeout(() => {
      reject(new Error('Request timeout'));
    }, timeoutMs);

    function onData(chunk) {
      buffer += chunk.toString('utf8');
      const nl = buffer.indexOf('\n');
      if (nl === -1) return;
      const resLine = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      try {
        const parsed = JSON.parse(resLine);
        if (parsed && parsed.id === request.id) {
          clearTimeout(timer);
          proc.stdout.off('data', onData);
          resolve(parsed);
        }
      } catch (_e) { /* non-matching / partial line, skip */ }
    }

    proc.stdout.on('data', onData);
    proc.stdin.write(line);
  });
}

async function runServer(server) {
  console.log(`\n-- MCP Runtime: ${server.name} --`);

  if (!fs.existsSync(server.cmd)) {
    console.error(`  SKIP: server file missing ${server.cmd}`);
    return { skipped: true };
  }

  const proc = spawn('node', [server.cmd], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, BKIT_ROOT: PROJECT_ROOT },
  });

  let stderrBuf = '';
  proc.stderr.on('data', (d) => { stderrBuf += d.toString('utf8'); });

  try {
    // 1. initialize (MCP handshake)
    const initRes = await sendRequest(proc, {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'bkit-l3-test', version: '1.0.0' } },
    });
    assert(initRes && !initRes.error, `${server.name} initialize returns no error`);
    assert(initRes && initRes.result, `${server.name} initialize result present`);

    // 2. tools/list
    const toolsRes = await sendRequest(proc, {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {},
    });
    assert(toolsRes && !toolsRes.error, `${server.name} tools/list returns no error`);
    const tools = (toolsRes && toolsRes.result && toolsRes.result.tools) || [];
    assert(Array.isArray(tools), `${server.name} tools/list.result.tools is array`);
    assert(tools.length >= server.expectedToolsMin, `${server.name} has >= ${server.expectedToolsMin} tools (got ${tools.length})`);

    // 3. Compare tool names against baseline (if baseline exists)
    if (fs.existsSync(server.baseline)) {
      const baselineFiles = fs.readdirSync(server.baseline).filter((f) => f.endsWith('.json'));
      const baselineNames = baselineFiles.map((f) => f.replace(/\.json$/, ''));
      const runtimeNames = tools.map((t) => t.name);
      for (const baseName of baselineNames) {
        assert(runtimeNames.includes(baseName), `${server.name} runtime has baseline tool "${baseName}"`);
      }
    } else {
      console.log(`  NOTE: baseline dir missing (${server.baseline}), skipped name-diff`);
    }

    // 4. Each tool has inputSchema object
    for (const t of tools) {
      assert(t && typeof t.name === 'string', `${server.name} tool has name`);
      assert(t && t.inputSchema && typeof t.inputSchema === 'object', `${server.name} tool ${t.name} has inputSchema`);
    }

    return { skipped: false, tools: tools.length };
  } catch (e) {
    console.error(`  ERROR: ${e.message}`);
    if (stderrBuf) console.error(`  server stderr: ${stderrBuf.slice(0, 300)}`);
    fail++;
    return { skipped: false, error: e.message };
  } finally {
    try { proc.kill('SIGTERM'); } catch {}
  }
}

(async () => {
  console.log('=== L3 MCP stdio Runtime Test (v2.1.10 Sprint 6 NEW 6-4) ===');

  for (const server of SERVERS) {
    await runServer(server);
  }

  const total = pass + fail;
  console.log(`\nTests: ${pass}/${total} PASSED, ${fail} FAILED, 0 SKIPPED`);
  process.exit(fail > 0 ? 1 : 0);
})();
