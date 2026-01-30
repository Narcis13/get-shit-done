/**
 * Test script for ide/routes/tree.js and ide/routes/file.js
 */

import { handleTree } from './routes/tree.js';
import { handleFile } from './routes/file.js';

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

// Mock response object
function createMockRes() {
  return {
    statusCode: null,
    headers: {},
    body: '',
    writeHead(code, headers) {
      this.statusCode = code;
      this.headers = { ...this.headers, ...headers };
    },
    end(data) {
      this.body = data;
    },
  };
}

// Test 1: handleTree returns array of 3 directory trees
await test('handleTree returns array of 3 directory trees', async () => {
  const req = {};
  const res = createMockRes();

  await handleTree(req, res);

  if (res.statusCode !== 200) {
    throw new Error(`Expected status 200, got: ${res.statusCode}`);
  }

  const trees = JSON.parse(res.body);
  if (!Array.isArray(trees)) {
    throw new Error(`Expected array, got: ${typeof trees}`);
  }

  if (trees.length !== 3) {
    throw new Error(`Expected 3 trees, got: ${trees.length}`);
  }

  const names = trees.map(t => t.name);
  if (!names.includes('commands') || !names.includes('looppool') || !names.includes('agents')) {
    throw new Error(`Expected commands, looppool, agents. Got: ${names.join(', ')}`);
  }
});

// Test 2: handleFile read mode with valid path
await test('handleFile read mode with valid path returns file content', async () => {
  const req = {
    url: '/api/file?path=commands/lpl/plan-phase.md',
    headers: { host: 'localhost:3456' },
  };
  const res = createMockRes();

  await handleFile(req, res, 'read');

  if (res.statusCode !== 200) {
    throw new Error(`Expected status 200, got: ${res.statusCode}. Body: ${res.body}`);
  }

  if (!res.body || res.body.length === 0) {
    throw new Error('Expected file content, got empty body');
  }
});

// Test 3: handleFile write mode with valid path
await test('handleFile write mode with valid path returns success', async () => {
  // Create an async iterator for request body
  const testContent = 'Test content for write';
  const req = {
    url: '/api/file?path=.planning/test-write-file.md',
    headers: { host: 'localhost:3456' },
    [Symbol.asyncIterator]: async function* () {
      yield Buffer.from(testContent);
    },
  };
  const res = createMockRes();

  await handleFile(req, res, 'write');

  if (res.statusCode !== 200) {
    throw new Error(`Expected status 200, got: ${res.statusCode}. Body: ${res.body}`);
  }

  const result = JSON.parse(res.body);
  if (!result.success) {
    throw new Error(`Expected success: true, got: ${JSON.stringify(result)}`);
  }

  // Clean up test file
  const { unlink } = await import('node:fs/promises');
  const { resolve } = await import('node:path');
  try {
    await unlink(resolve(process.cwd(), '.planning/test-write-file.md'));
  } catch {
    // Ignore cleanup errors
  }
});

// Test 4: handleFile with invalid path returns 403
await test('handleFile with invalid path returns 403', async () => {
  const req = {
    url: '/api/file?path=../../../etc/passwd',
    headers: { host: 'localhost:3456' },
  };
  const res = createMockRes();

  await handleFile(req, res, 'read');

  if (res.statusCode !== 403) {
    throw new Error(`Expected status 403, got: ${res.statusCode}`);
  }
});

// Test 5: handleFile with missing path returns 400
await test('handleFile with missing path returns 400', async () => {
  const req = {
    url: '/api/file',
    headers: { host: 'localhost:3456' },
  };
  const res = createMockRes();

  await handleFile(req, res, 'read');

  if (res.statusCode !== 400) {
    throw new Error(`Expected status 400, got: ${res.statusCode}`);
  }
});

// Summary
console.log(`\n--- Results ---`);
console.log(`Passed: ${passed}/${passed + failed}`);
console.log(`Failed: ${failed}/${passed + failed}`);

if (failed > 0) {
  process.exit(1);
}
