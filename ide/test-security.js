/**
 * Test script for ide/lib/security.js
 */

import { validatePath, validateHost } from './lib/security.js';

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`PASS: ${name}`);
    passed++;
  } catch (err) {
    console.log(`FAIL: ${name}`);
    console.log(`  Error: ${err.message}`);
    failed++;
  }
}

async function expectThrows(fn, name) {
  try {
    await fn();
    throw new Error(`Expected ${name} to throw, but it did not`);
  } catch (err) {
    if (err.message.startsWith('Expected')) {
      throw err;
    }
    // Expected to throw, success
  }
}

// Test 1: Valid path in commands directory
await test('validatePath with valid path: commands/lpl/plan-phase.md', async () => {
  const result = await validatePath('commands/lpl/plan-phase.md');
  if (!result.includes('commands/lpl/plan-phase.md')) {
    throw new Error(`Expected path to contain commands/lpl/plan-phase.md, got: ${result}`);
  }
});

// Test 2: Traversal attack should throw
await test('validatePath with traversal attack: ../../../etc/passwd', async () => {
  await expectThrows(
    () => validatePath('../../../etc/passwd'),
    'traversal attack path'
  );
});

// Test 3: Valid path in looppool directory
await test('validatePath with allowed dir: looppool/workflows/execute-plan.md', async () => {
  const result = await validatePath('looppool/workflows/execute-plan.md');
  if (!result.includes('looppool/workflows/execute-plan.md')) {
    throw new Error(`Expected path to contain looppool/workflows/execute-plan.md, got: ${result}`);
  }
});

// Test 4: Disallowed directory should throw
await test('validatePath with disallowed dir: node_modules/esbuild/package.json', async () => {
  await expectThrows(
    () => validatePath('node_modules/esbuild/package.json'),
    'disallowed directory path'
  );
});

// Test 5: Valid host header
await test('validateHost with valid host: localhost:3456', () => {
  const result = validateHost({ headers: { host: 'localhost:3456' } });
  if (result !== true) {
    throw new Error(`Expected true, got: ${result}`);
  }
});

// Test 6: Invalid host header
await test('validateHost with invalid host: evil.com:3456', () => {
  const result = validateHost({ headers: { host: 'evil.com:3456' } });
  if (result !== false) {
    throw new Error(`Expected false, got: ${result}`);
  }
});

// Summary
console.log(`\n--- Results ---`);
console.log(`Passed: ${passed}/${passed + failed}`);
console.log(`Failed: ${failed}/${passed + failed}`);

if (failed > 0) {
  process.exit(1);
}
