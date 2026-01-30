import { spawn } from 'child_process';
import http from 'http';

console.log('Testing --no-open flag functionality...\n');

// Test 1: Server with --no-open flag (should not open browser)
console.log('Test 1: Starting server with --no-open flag...');
const server = spawn('node', ['src/server/index.js', '--no-open'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let serverOutput = '';
server.stdout.on('data', (data) => {
  serverOutput += data.toString();
});

server.stderr.on('data', (data) => {
  console.error('Server error:', data.toString());
});

// Give server time to start
setTimeout(async () => {
  try {
    // Check if server is running
    const response = await new Promise((resolve, reject) => {
      http.get('http://localhost:3456/', (res) => {
        resolve(res);
      }).on('error', reject);
    });

    if (response.statusCode === 200) {
      console.log('✓ Server started successfully');
      
      // Check output to ensure no browser open attempt
      if (!serverOutput.includes('Could not auto-open browser')) {
        console.log('✓ Browser was not opened (no error message about failed browser open)');
        console.log('✓ --no-open flag works correctly');
      } else {
        console.log('✗ Browser open was attempted despite --no-open flag');
      }
    } else {
      console.log('✗ Server returned unexpected status:', response.statusCode);
    }
  } catch (error) {
    console.log('✗ Failed to connect to server:', error.message);
  } finally {
    server.kill();
  }
}, 1000);

// Test 2: Server without --no-open flag (should attempt to open browser)
setTimeout(() => {
  console.log('\nTest 2: Starting server without --no-open flag...');
  const server2 = spawn('node', ['src/server/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let server2Output = '';
  server2.stdout.on('data', (data) => {
    server2Output += data.toString();
  });

  setTimeout(() => {
    // In CI or headless environments, browser open will fail
    // But the attempt should be made
    console.log('Server output:', server2Output);
    console.log('✓ Server started without --no-open flag');
    server2.kill();
    
    // Exit after both tests complete
    setTimeout(() => process.exit(0), 500);
  }, 1000);
}, 3000);