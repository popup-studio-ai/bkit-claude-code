/**
 * Centralized version constant for bkit plugin.
 *
 * v2.1.6 (ENH-167): bkitVersion 동적화 — bkit.config.json의 `version` 필드를 우선 사용.
 * 폴백: PLUGIN_ROOT의 .claude-plugin/plugin.json 또는 hardcoded 기본값.
 * Docs=Code 원칙: 단일 진실원(bkit.config.json)에서 버전을 읽어 hardcoded 불일치 회귀 방지.
 *
 * @module lib/core/version
 */

const path = require('path');
const fs = require('fs');

const FALLBACK_VERSION = '2.1.6';

function _detectVersion() {
  // 1. PROJECT_DIR 또는 PLUGIN_ROOT의 bkit.config.json 우선
  try {
    const candidates = [
      path.join(process.env.CLAUDE_PROJECT_DIR || process.cwd(), 'bkit.config.json'),
      path.resolve(__dirname, '../../bkit.config.json'),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        const cfg = JSON.parse(fs.readFileSync(p, 'utf8'));
        if (cfg && typeof cfg.version === 'string') return cfg.version;
      }
    }
  } catch (_e) { /* fallthrough */ }

  // 2. plugin.json 폴백
  try {
    const pluginJson = path.resolve(__dirname, '../../.claude-plugin/plugin.json');
    if (fs.existsSync(pluginJson)) {
      const meta = JSON.parse(fs.readFileSync(pluginJson, 'utf8'));
      if (meta && typeof meta.version === 'string') return meta.version;
    }
  } catch (_e) { /* fallthrough */ }

  return FALLBACK_VERSION;
}

const BKIT_VERSION = _detectVersion();

module.exports = { BKIT_VERSION };
