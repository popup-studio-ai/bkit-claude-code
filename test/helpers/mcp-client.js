/**
 * MCP Client — JSON-RPC 2.0 client for testing MCP servers via stdio
 * @module test/helpers/mcp-client
 *
 * Design Ref: §3.2.2 — mcp-client.js
 * Spawns MCP server as child process and communicates via JSON-RPC over stdin/stdout.
 */
'use strict';

const { spawn } = require('child_process');
const path = require('path');
const readline = require('readline');

const ROOT = path.resolve(__dirname, '../..');

/**
 * Create an MCP client connected to a server
 * @param {string} serverPath - Relative path from project root
 * @param {Object} [options]
 * @param {Object} [options.env] - Extra env vars
 * @param {number} [options.timeout=10000] - Response timeout in ms
 * @returns {Promise<McpClient>}
 */
async function createMcpClient(serverPath, options = {}) {
  const fullPath = path.resolve(ROOT, serverPath);
  const env = {
    ...process.env,
    BKIT_ROOT: ROOT,
    ...(options.env || {}),
  };

  const child = spawn(process.execPath, [fullPath], {
    env,
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: options.cwd || ROOT,
  });

  let nextId = 1;
  const pending = new Map();
  let buffer = '';

  // Parse newline-delimited JSON from stdout
  child.stdout.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop(); // keep incomplete line
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line);
        const id = msg.id;
        if (id !== undefined && pending.has(id)) {
          const { resolve } = pending.get(id);
          pending.delete(id);
          resolve(msg);
        }
      } catch (_) { /* ignore non-JSON */ }
    }
  });

  const client = {
    /**
     * Send a JSON-RPC request and wait for response
     * @param {string} method
     * @param {Object} params
     * @returns {Promise<Object>}
     */
    send(method, params = {}) {
      const timeout = options.timeout || 10000;
      return new Promise((resolve, reject) => {
        const id = nextId++;
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(new Error(`MCP timeout: ${method} (${timeout}ms)`));
        }, timeout);

        pending.set(id, {
          resolve: (msg) => {
            clearTimeout(timer);
            resolve(msg.result !== undefined ? msg.result : msg);
          },
        });

        const request = JSON.stringify({
          jsonrpc: '2.0',
          id,
          method,
          params,
        }) + '\n';

        child.stdin.write(request);
      });
    },

    /**
     * Initialize the MCP connection
     * @returns {Promise<Object>}
     */
    async initialize() {
      return client.send('initialize', {
        protocolVersion: '2025-03-26',
        capabilities: {},
        clientInfo: { name: 'bkit-test', version: '1.0.0' },
      });
    },

    /**
     * List available tools
     * @returns {Promise<Object>}
     */
    async listTools() {
      return client.send('tools/list', {});
    },

    /**
     * Call a tool
     * @param {string} name
     * @param {Object} args
     * @returns {Promise<Object>}
     */
    async callTool(name, args = {}) {
      return client.send('tools/call', { name, arguments: args });
    },

    /**
     * Close the connection
     */
    async close() {
      child.stdin.end();
      child.kill('SIGTERM');
      // Wait for exit
      await new Promise((resolve) => {
        child.on('exit', resolve);
        setTimeout(resolve, 2000);
      });
    },

    /** @type {import('child_process').ChildProcess} */
    process: child,
  };

  return client;
}

module.exports = { createMcpClient, ROOT };
