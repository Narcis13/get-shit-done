import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Test configuration
const serverPath = path.join(__dirname, 'src', 'server', 'index.js');
const testTimeout = 5000;

// Helper function to start server with arguments
async function startServer(args = []) {
  return new Promise((resolve, reject) => {
    const server = spawn('node', [serverPath, ...args]);
    let output = '';
    let errorOutput = '';
    let resolved = false;

    const checkComplete = () => {
      if (!resolved && output.includes('LPL IDE server running') && output.includes('Project root:')) {
        resolved = true;
        resolve({ server, output });
      }
    };

    server.stdout.on('data', (data) => {
      output += data.toString();
      checkComplete();
    });

    server.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    server.on('error', (err) => {
      if (!resolved) {
        resolved = true;
        reject(err);
      }
    });
    
    server.on('exit', (code) => {
      if (!resolved && code !== 0 && code !== null) {
        resolved = true;
        reject(new Error(`Server exited with code ${code}: ${errorOutput}`));
      }
    });

    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        server.kill();
        reject(new Error('Server startup timeout'));
      }
    }, testTimeout);
  });
}

// Helper to create a test directory
async function createTestDir() {
  const testDir = path.join(__dirname, 'test-root-' + Date.now());
  await fs.mkdir(testDir, { recursive: true });
  await fs.mkdir(path.join(testDir, 'commands'), { recursive: true });
  await fs.writeFile(path.join(testDir, 'commands', 'test.md'), '# Test file');
  return testDir;
}

// Test 1: Default root (current directory)
async function testDefaultRoot() {
  console.log('Test 1: Default root directory...');
  try {
    const { server, output } = await startServer();
    const expectedRoot = process.cwd();
    
    if (output.includes(`Project root: ${expectedRoot}`)) {
      console.log('✓ Default root test passed');
      server.kill();
      return true;
    } else {
      console.error('✗ Default root test failed: incorrect root path');
      console.error('Output:', output);
      server.kill();
      return false;
    }
  } catch (error) {
    console.error('✗ Default root test failed:', error.message);
    return false;
  }
}

// Test 2: Custom root with --root argument
async function testCustomRoot() {
  console.log('\nTest 2: Custom root directory...');
  const testDir = await createTestDir();
  
  try {
    const { server, output } = await startServer(['--root', testDir]);
    
    if (output.includes(`Project root: ${testDir}`)) {
      console.log('✓ Custom root test passed');
      server.kill();
      await fs.rm(testDir, { recursive: true });
      return true;
    } else {
      console.error('✗ Custom root test failed: incorrect root path');
      console.error('Output:', output);
      server.kill();
      await fs.rm(testDir, { recursive: true });
      return false;
    }
  } catch (error) {
    console.error('✗ Custom root test failed:', error.message);
    await fs.rm(testDir, { recursive: true }).catch(() => {});
    return false;
  }
}

// Test 3: Invalid root path
async function testInvalidRoot() {
  console.log('\nTest 3: Invalid root path...');
  
  return new Promise((resolve) => {
    const server = spawn('node', [serverPath, '--root', '/nonexistent/path']);
    let errorOutput = '';

    server.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    server.on('exit', (code) => {
      if (code === 1 && errorOutput.includes('does not exist or is not accessible')) {
        console.log('✓ Invalid root test passed (correctly rejected)');
        resolve(true);
      } else {
        console.error('✗ Invalid root test failed: should have rejected invalid path');
        console.error('Exit code:', code);
        console.error('Error output:', errorOutput);
        resolve(false);
      }
    });

    setTimeout(() => {
      server.kill();
      console.error('✗ Invalid root test failed: timeout');
      resolve(false);
    }, testTimeout);
  });
}

// Test 4: File as root (should fail)
async function testFileAsRoot() {
  console.log('\nTest 4: File as root (should fail)...');
  const testFile = path.join(__dirname, 'test-file.tmp');
  await fs.writeFile(testFile, 'test');
  
  return new Promise((resolve) => {
    const server = spawn('node', [serverPath, '--root', testFile]);
    let errorOutput = '';

    server.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    server.on('exit', async (code) => {
      await fs.unlink(testFile).catch(() => {});
      
      if (code === 1 && errorOutput.includes('is not a directory')) {
        console.log('✓ File as root test passed (correctly rejected)');
        resolve(true);
      } else {
        console.error('✗ File as root test failed: should have rejected file path');
        console.error('Exit code:', code);
        console.error('Error output:', errorOutput);
        resolve(false);
      }
    });

    setTimeout(() => {
      server.kill();
      console.error('✗ File as root test failed: timeout');
      resolve(false);
    }, testTimeout);
  });
}

// Test 5: Combined --root and --port arguments
async function testCombinedArgs() {
  console.log('\nTest 5: Combined --root and --port arguments...');
  const testDir = await createTestDir();
  
  try {
    const { server, output } = await startServer(['--root', testDir, '--port', '8080', '--no-open']);
    
    const hasCorrectRoot = output.includes(`Project root: ${testDir}`);
    const hasCorrectPort = output.includes('http://localhost:8080');
    
    if (hasCorrectRoot && hasCorrectPort) {
      console.log('✓ Combined arguments test passed');
      server.kill();
      await fs.rm(testDir, { recursive: true });
      return true;
    } else {
      console.error('✗ Combined arguments test failed');
      console.error('Output:', output);
      server.kill();
      await fs.rm(testDir, { recursive: true });
      return false;
    }
  } catch (error) {
    console.error('✗ Combined arguments test failed:', error.message);
    await fs.rm(testDir, { recursive: true }).catch(() => {});
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('Running CLI argument tests for LPL IDE server...\n');
  
  const results = [];
  results.push(await testDefaultRoot());
  results.push(await testCustomRoot());
  results.push(await testInvalidRoot());
  results.push(await testFileAsRoot());
  results.push(await testCombinedArgs());
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`\n${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('\nAll tests passed! ✨');
    process.exit(0);
  } else {
    console.log('\nSome tests failed.');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});