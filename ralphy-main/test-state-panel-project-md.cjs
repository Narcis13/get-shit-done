#!/usr/bin/env node

/**
 * Test for StatePanel PROJECT.md parsing and display
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3456;
const testResults = [];
let server = null;

function log(message) {
  console.log(`[TEST] ${message}`);
}

function addResult(test, passed, details = '') {
  testResults.push({ test, passed, details });
  console.log(`[${passed ? 'PASS' : 'FAIL'}] ${test}${details ? ': ' + details : ''}`);
}

async function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: PORT,
      path: path,
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ 
          statusCode: res.statusCode, 
          headers: res.headers,
          body: data 
        });
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testStatePanelLoaded() {
  log('Testing if state panel is loaded...');
  
  const response = await makeRequest('/');
  const html = response.body;
  
  // Check if state panel script is included
  if (!html.includes('<script src="state-panel.js"></script>')) {
    addResult('State panel script included', false, 'state-panel.js script tag not found');
    return false;
  }
  
  // Check if state panel container exists
  if (!html.includes('id="state-panel-container"')) {
    addResult('State panel container exists', false, 'state-panel-container not found');
    return false;
  }
  
  // Check if state panel is initialized
  if (!html.includes('new StatePanel(statePanelContainer)')) {
    addResult('State panel initialized', false, 'StatePanel initialization not found');
    return false;
  }
  
  addResult('State panel loaded', true);
  return true;
}

async function testStatePanelCode() {
  log('Testing state panel code...');
  
  const response = await makeRequest('/state-panel.js');
  
  if (response.statusCode !== 200) {
    addResult('State panel code accessible', false, `Status code: ${response.statusCode}`);
    return false;
  }
  
  const code = response.body;
  
  // Check for PROJECT.md loading method
  if (!code.includes('loadProjectMd')) {
    addResult('loadProjectMd method exists', false);
    return false;
  }
  
  // Check for markdown parsing
  if (!code.includes('parseMarkdown')) {
    addResult('parseMarkdown method exists', false);
    return false;
  }
  
  // Check if PROJECT.md is fetched
  if (!code.includes('/api/file?path=PROJECT.md')) {
    addResult('PROJECT.md fetch implemented', false);
    return false;
  }
  
  // Check if project section is rendered
  if (!code.includes('project-section')) {
    addResult('Project section rendering', false);
    return false;
  }
  
  // Check for markdown rendering implementation
  const markdownFeatures = [
    'h1', 'h2', 'h3',  // Headers
    'strong',          // Bold
    'em',              // Italic
    'code',            // Code
    'pre',             // Code blocks
    'href'             // Links
  ];
  
  let missingFeatures = [];
  markdownFeatures.forEach(feature => {
    if (!code.includes(feature)) {
      missingFeatures.push(feature);
    }
  });
  
  if (missingFeatures.length > 0) {
    addResult('Markdown rendering features', false, `Missing: ${missingFeatures.join(', ')}`);
    return false;
  }
  
  // Check for CSS styles
  if (!code.includes('markdown-content')) {
    addResult('Markdown content styles', false);
    return false;
  }
  
  addResult('State panel code implementation', true);
  return true;
}

async function createTestProjectMd() {
  log('Creating test PROJECT.md...');
  
  const projectContent = `# Test Project

This is a **test project** for the LPL IDE.

## Features

- Feature 1
- Feature 2
- Feature 3

## Code Example

\`\`\`javascript
function hello() {
  console.log("Hello World");
}
\`\`\`

### Links

Visit [our website](https://example.com) for more info.
`;
  
  fs.writeFileSync(path.join(__dirname, 'PROJECT.md'), projectContent);
  addResult('Test PROJECT.md created', true);
  return true;
}

async function testProjectMdDisplay() {
  log('Testing PROJECT.md display...');
  
  // First ensure PROJECT.md exists
  await createTestProjectMd();
  
  // Wait a moment for the server to be able to serve it
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Test if PROJECT.md can be fetched via API
  const response = await makeRequest('/api/file?path=PROJECT.md');
  
  if (response.statusCode !== 200) {
    addResult('PROJECT.md accessible via API', false, `Status code: ${response.statusCode}`);
    return false;
  }
  
  const content = response.body;
  if (!content.includes('# Test Project')) {
    addResult('PROJECT.md content correct', false);
    return false;
  }
  
  addResult('PROJECT.md accessible', true);
  return true;
}

async function cleanupTestFiles() {
  log('Cleaning up test files...');
  
  const projectPath = path.join(__dirname, 'PROJECT.md');
  if (fs.existsSync(projectPath)) {
    fs.unlinkSync(projectPath);
  }
  
  addResult('Test files cleaned up', true);
}

async function runTests() {
  log('Starting state panel PROJECT.md tests...');
  
  try {
    await testStatePanelLoaded();
    await testStatePanelCode();
    await testProjectMdDisplay();
  } catch (error) {
    console.error('Test error:', error);
    addResult('Test execution', false, error.message);
  } finally {
    await cleanupTestFiles();
  }
  
  // Summary
  console.log('\n=== TEST SUMMARY ===');
  const passed = testResults.filter(r => r.passed).length;
  const total = testResults.length;
  console.log(`Passed: ${passed}/${total}`);
  
  testResults.forEach(result => {
    console.log(`${result.passed ? '✓' : '✗'} ${result.test}${result.details ? ': ' + result.details : ''}`);
  });
  
  process.exit(passed === total ? 0 : 1);
}

// Start server first
const { spawn } = require('child_process');
log('Starting server...');

server = spawn('node', ['src/server/index.js', '--no-open'], {
  cwd: __dirname,
  stdio: ['ignore', 'pipe', 'pipe']
});

server.stdout.on('data', (data) => {
  const message = data.toString();
  if (message.includes('Server running')) {
    // Give it a moment to fully start
    setTimeout(() => {
      runTests();
    }, 500);
  }
});

server.stderr.on('data', (data) => {
  console.error('Server error:', data.toString());
});

server.on('close', (code) => {
  if (code !== null && code !== 0) {
    console.error(`Server exited with code ${code}`);
    process.exit(1);
  }
});

// Cleanup on exit
process.on('exit', () => {
  if (server && !server.killed) {
    server.kill();
  }
});

process.on('SIGINT', () => {
  if (server && !server.killed) {
    server.kill();
  }
  process.exit(1);
});