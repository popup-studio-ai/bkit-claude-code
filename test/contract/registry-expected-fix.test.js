#!/usr/bin/env node
/*
 * L1 — Registry expectedFix + semverLt Test
 *
 * Verifies cc-regression/registry.js has seeded expectedFix for >=4 guards and
 * semverLt correctly filters getActive() by CC version.
 *
 * Design Ref: bkit-v2110-gap-closure.design.md §3.1.2 T7
 * Plan SC: D7 (Registry expectedFix seed ≥ 4)
 */

const path = require('path');
const {
  CC_REGRESSIONS,
  listActive,
  lookup,
  getActive,
  semverLt,
} = require(path.resolve(__dirname, '..', '..', 'lib', 'cc-regression', 'registry'));

let pass = 0;
let fail = 0;

function assert(cond, msg) {
  if (cond) {
    pass++;
    console.log(`  ✓ ${msg}`);
  } else {
    fail++;
    console.error(`  ✗ ${msg}`);
  }
}

console.log('=== Registry expectedFix + semverLt Test (v2.1.10 D7) ===');

// 1. Total guard count >= 21 (current floor)
assert(CC_REGRESSIONS.length >= 21, `CC_REGRESSIONS.length >= 21 (actual: ${CC_REGRESSIONS.length})`);

// 2. expectedFix seeded for >=4 guards
const seeded = CC_REGRESSIONS.filter((g) => g.expectedFix !== null);
assert(seeded.length >= 4, `guards with expectedFix >= 4 (actual: ${seeded.length})`);

// 3. Specific guards have expectedFix
const mustHaveFix = ['MON-CC-02', 'ENH-262', 'ENH-263', 'ENH-264'];
for (const id of mustHaveFix) {
  const g = lookup(id);
  assert(g && g.expectedFix !== null, `${id} has expectedFix`);
}

// 4. semverLt comparisons
assert(semverLt('2.1.117', '2.1.118') === true, 'semverLt("2.1.117", "2.1.118") == true');
assert(semverLt('2.1.118', '2.1.117') === false, 'semverLt("2.1.118", "2.1.117") == false');
assert(semverLt('2.1.117', '2.1.117') === false, 'semverLt equal versions == false');
assert(semverLt('2.0.0', '2.1.0') === true, 'semverLt major.minor diff');
assert(semverLt('2.1.10', '2.1.9') === false, 'semverLt("2.1.10","2.1.9") == false (10 > 9 numeric)');

// 5. getActive filtering
const activeAtOld = getActive('2.1.100');
const e262AtOld = activeAtOld.find((g) => g.id === 'ENH-262');
assert(e262AtOld !== undefined, 'ENH-262 is active at CC v2.1.100');

const activeAtFuture = getActive('3.0.0');
const e262AtFuture = activeAtFuture.find((g) => g.id === 'ENH-262');
assert(e262AtFuture === undefined, 'ENH-262 auto-deactivated at CC v3.0.0 (>= expectedFix 2.1.118)');

// 6. Null expectedFix means always active
const e214 = lookup('ENH-214');
if (e214) {
  const atAny = getActive('99.0.0').find((g) => g.id === 'ENH-214');
  assert(atAny !== undefined, 'ENH-214 (expectedFix=null) stays active at any CC version');
}

// 7. listActive returns only resolvedAt === null
const active = listActive();
assert(
  active.every((g) => g.resolvedAt === null),
  'listActive returns only guards with resolvedAt === null'
);

// Summary
const total = pass + fail;
console.log(`\nTests: ${pass}/${total} PASSED, ${fail} FAILED, 0 SKIPPED`);
process.exit(fail > 0 ? 1 : 0);
