#!/usr/bin/env node
/**
 * TC-B5~B7: ENH-239 SessionStart fingerprint dedup tests (L2 Integration).
 * Run: node tests/qa/session-ctx-fingerprint.test.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PROJECT_ROOT = path.resolve(__dirname, '../..');

let pass = 0;
let fail = 0;
function tc(id, fn) {
  try {
    fn();
    console.log(`✅ ${id} PASS`);
    pass++;
  } catch (e) {
    console.error(`❌ ${id} FAIL — ${e.message}`);
    fail++;
  }
}

function withTmpCwd(fn) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-fp-'));
  const origCwd = process.cwd();
  // 모듈 캐시 삭제 (cwd 의존 경로 재계산)
  const modPath = path.join(PROJECT_ROOT, 'lib/core/session-ctx-fp.js');
  delete require.cache[require.resolve(modPath)];
  try {
    process.chdir(tmp);
    const mod = require(modPath);
    fn(mod, tmp);
  } finally {
    process.chdir(origCwd);
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_e) {}
    delete require.cache[require.resolve(modPath)];
  }
}

// TC-B5: 동일 content 2회 → 2번째는 dedup hit
tc('TC-B5', () => {
  withTmpCwd((mod) => {
    const ctx = 'hello world';
    const sid = 'sess-A';
    const fp = mod.computeFingerprint(ctx);

    // 1회차 — 저장 없음, dedup miss
    assert.strictEqual(mod.shouldDedup(sid, fp), false, 'TC-B5 first should miss');
    mod.record(sid, fp);

    // 2회차 — 동일 fp, dedup hit
    assert.strictEqual(mod.shouldDedup(sid, fp), true, 'TC-B5 second should hit');
  });
});

// TC-B6: TTL 경과 모의 → dedup miss (ts를 과거로 조작)
tc('TC-B6', () => {
  withTmpCwd((mod, tmp) => {
    const ctx = 'hello world';
    const sid = 'sess-B';
    const fp = mod.computeFingerprint(ctx);
    mod.record(sid, fp);

    // TTL 초과 모의: ts를 2시간 전으로 수동 변경
    const storePath = mod._internal.getStorePath();
    const store = JSON.parse(fs.readFileSync(storePath, 'utf-8'));
    store.sessions[sid].ts = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    fs.writeFileSync(storePath, JSON.stringify(store));

    assert.strictEqual(mod.shouldDedup(sid, fp), false, 'TC-B6 stale should miss');
  });
});

// TC-B7: multi-session 격리
tc('TC-B7', () => {
  withTmpCwd((mod) => {
    const fpA = mod.computeFingerprint('content-A');
    const fpB = mod.computeFingerprint('content-B');
    mod.record('sess-A', fpA);
    mod.record('sess-B', fpB);

    assert.strictEqual(mod.shouldDedup('sess-A', fpA), true, 'sess-A matches own fp');
    assert.strictEqual(mod.shouldDedup('sess-B', fpB), true, 'sess-B matches own fp');
    assert.strictEqual(mod.shouldDedup('sess-A', fpB), false, 'sess-A rejects B fp');
    assert.strictEqual(mod.shouldDedup('sess-B', fpA), false, 'sess-B rejects A fp');
  });
});

// TC-B7b: corrupt store → clean recovery
tc('TC-B7b', () => {
  withTmpCwd((mod) => {
    const storePath = mod._internal.getStorePath();
    fs.mkdirSync(path.dirname(storePath), { recursive: true });
    fs.writeFileSync(storePath, '!!! not json !!!');

    // corrupt 상태에서도 첫 호출 정상 (miss)
    const fp = mod.computeFingerprint('ctx');
    assert.strictEqual(mod.shouldDedup('sid', fp), false, 'corrupt store → miss');

    // record 후 정상 동작
    mod.record('sid', fp);
    assert.strictEqual(mod.shouldDedup('sid', fp), true, 'post-record hit');
  });
});

// TC-B7c: fingerprint 결정성 (같은 input → 같은 fp)
tc('TC-B7c', () => {
  const mod = require(path.join(PROJECT_ROOT, 'lib/core/session-ctx-fp'));
  const fp1 = mod.computeFingerprint('hello');
  const fp2 = mod.computeFingerprint('hello');
  assert.strictEqual(fp1, fp2, 'deterministic');
  assert.strictEqual(fp1.length, 16, '64-bit truncated hex');
});

console.log(`\n[session-ctx-fingerprint.test] ${pass} PASS / ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
