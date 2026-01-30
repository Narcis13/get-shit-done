// Test for View Workflow button functionality

import { spawn } from 'child_process';
import http from 'http';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Function to wait for a condition
function waitFor(conditionFn, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      if (conditionFn()) {
        clearInterval(interval);
        resolve();
      } else if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        reject(new Error('Timeout waiting for condition'));
      }
    }, 100);
  });
}

// Function to make HTTP request
function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// Test suite
async function runTests() {
  const tests = [];
  let serverProcess;

  try {
    // Start server
    console.log('Starting server...');
    serverProcess = spawn('node', ['src/server/index.js', '--no-open'], {
      cwd: __dirname,
      stdio: 'pipe'
    });

    let serverReady = false;
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('Server output:', output);
      if (output.includes('Server running at')) {
        serverReady = true;
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error('Server error:', data.toString());
    });

    // Wait for server to start
    await waitFor(() => serverReady, 10000);
    console.log('Server is ready');

    // Test 1: Check if command-viewer.js contains view workflow button code
    const commandViewerPath = path.join(__dirname, 'src/frontend/command-viewer.js');
    const commandViewerContent = readFileSync(commandViewerPath, 'utf8');
    
    tests.push({
      name: 'View workflow button HTML generation',
      passed: commandViewerContent.includes('class="action-button view-workflow"') &&
              commandViewerContent.includes('View workflow →'),
      details: 'Command viewer includes view workflow button HTML'
    });

    // Test 2: Check if view workflow button styling exists
    tests.push({
      name: 'View workflow button styling',
      passed: commandViewerContent.includes('.action-button.view-workflow {') &&
              commandViewerContent.includes('background: #2196f3;'),
      details: 'View workflow button has custom styling'
    });

    // Test 3: Check if view workflow button event listener exists
    tests.push({
      name: 'View workflow button event listener',
      passed: commandViewerContent.includes(".querySelector('.view-workflow')?.addEventListener") &&
              commandViewerContent.includes("new CustomEvent('open-file'"),
      details: 'View workflow button has click event listener that dispatches open-file event'
    });

    // Test 4: Check if condition for showing button exists
    tests.push({
      name: 'View workflow button conditional rendering',
      passed: commandViewerContent.includes('if (parsedReferences.workflows.length > 0)') &&
              commandViewerContent.includes('data-workflow="${parsedReferences.workflows[0]}"'),
      details: 'View workflow button only shows when workflows are referenced'
    });

    // Test 5: Verify server serves command-viewer.js correctly
    const jsResponse = await makeRequest({
      hostname: '127.0.0.1',
      port: 3456,
      path: '/command-viewer.js',
      method: 'GET'
    });

    tests.push({
      name: 'Command viewer served correctly',
      passed: jsResponse.status === 200 && 
              jsResponse.body.includes('view-workflow') &&
              jsResponse.body.includes('View workflow →'),
      details: `Server response status: ${jsResponse.status}, includes view workflow: ${jsResponse.body.includes('view-workflow')}`
    });

    // Test 6: Test that index.html includes command-viewer.js
    const htmlResponse = await makeRequest({
      hostname: '127.0.0.1',
      port: 3456,
      path: '/',
      method: 'GET'
    });

    tests.push({
      name: 'Index.html includes command viewer',
      passed: htmlResponse.status === 200 && htmlResponse.body.includes('command-viewer.js'),
      details: 'Main page includes command viewer script'
    });

    // Test 7: Check workflow path attribute handling
    tests.push({
      name: 'Workflow path data attribute',
      passed: commandViewerContent.includes('e.target.dataset.workflow') &&
              commandViewerContent.includes('const workflowPath = e.target.dataset.workflow'),
      details: 'Event listener correctly retrieves workflow path from data attribute'
    });

    // Print results
    console.log('\n=== Test Results ===');
    tests.forEach((test, index) => {
      console.log(`${index + 1}. ${test.name}: ${test.passed ? '✓ PASSED' : '✗ FAILED'}`);
      if (test.details) {
        console.log(`   ${test.details}`);
      }
    });

    const passedTests = tests.filter(t => t.passed).length;
    console.log(`\nTotal: ${passedTests}/${tests.length} tests passed`);

    return passedTests === tests.length;
  } finally {
    // Clean up
    if (serverProcess) {
      console.log('\nStopping server...');
      serverProcess.kill('SIGTERM');
      await new Promise(resolve => setTimeout(resolve, 500));
      if (!serverProcess.killed) {
        serverProcess.kill('SIGKILL');
      }
    }
  }
}

// Run tests
runTests()
  .then(allPassed => {
    console.log(allPassed ? '\nAll tests passed!' : '\nSome tests failed!');
    process.exit(allPassed ? 0 : 1);
  })
  .catch(error => {
    console.error('Test error:', error);
    process.exit(1);
  });