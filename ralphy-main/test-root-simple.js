import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function testRootArgument() {
  console.log('Testing --root CLI argument...\n');

  // Create test directory
  const testDir = path.join(__dirname, 'test-root-' + Date.now());
  await fs.mkdir(testDir, { recursive: true });
  await fs.mkdir(path.join(testDir, 'commands'), { recursive: true });
  await fs.writeFile(path.join(testDir, 'commands', 'test.md'), '# Test file');

  return new Promise((resolve) => {
    const server = spawn('node', ['src/server/index.js', '--root', testDir, '--no-open']);
    let output = '';
    let errorOutput = '';
    let resolved = false;

    server.stdout.on('data', (data) => {
      output += data.toString();
      console.log('Server output:', data.toString().trim());
    });

    server.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error('Server error:', data.toString().trim());
    });

    // Wait for both output lines
    const checkOutput = () => {
      if (!resolved && output.includes('LPL IDE server running') && output.includes('Project root:')) {
        resolved = true;
        
        if (output.includes(`Project root: ${testDir}`)) {
          console.log('\n✓ Test passed! Server correctly uses custom root directory.');
          console.log(`  Expected: ${testDir}`);
          console.log(`  Actual: ${testDir}`);
        } else {
          console.error('\n✗ Test failed! Server did not use custom root directory.');
          console.error('Full output:', output);
        }
        
        server.kill();
        fs.rm(testDir, { recursive: true }).catch(() => {});
        resolve();
      }
    };

    server.stdout.on('data', checkOutput);

    // Timeout after 5 seconds
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.error('\n✗ Test failed! Server startup timeout.');
        console.error('Output received:', output);
        console.error('Error output:', errorOutput);
        server.kill();
        fs.rm(testDir, { recursive: true }).catch(() => {});
        resolve();
      }
    }, 5000);

    server.on('error', (error) => {
      if (!resolved) {
        resolved = true;
        console.error('\n✗ Test failed! Server error:', error.message);
        fs.rm(testDir, { recursive: true }).catch(() => {});
        resolve();
      }
    });
  });
}

// Run the test
testRootArgument().catch(console.error);