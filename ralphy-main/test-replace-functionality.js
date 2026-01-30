import { spawn } from 'child_process';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SERVER_PORT = 4567;
const SERVER_URL = `http://127.0.0.1:${SERVER_PORT}`;

function startServer() {
  return new Promise((resolve, reject) => {
    const serverProcess = spawn('node', [join(__dirname, 'src/server/index.js'), '--port', String(SERVER_PORT), '--no-open'], {
      stdio: 'pipe'
    });

    let output = '';
    serverProcess.stdout.on('data', (data) => {
      output += data.toString();
      if (output.includes('Server running at')) {
        setTimeout(() => resolve(serverProcess), 100);
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error('Server error:', data.toString());
    });

    serverProcess.on('error', reject);
    
    setTimeout(() => {
      reject(new Error('Server failed to start within 3 seconds'));
    }, 3000);
  });
}

async function testReplaceFeatures() {
  console.log('Testing replace functionality...\n');
  
  let serverProcess;
  
  try {
    // Start server
    console.log('Starting server...');
    serverProcess = await startServer();
    console.log(`✓ Server started on port ${SERVER_PORT}\n`);
    
    // Test 1: Check if editor.js is served correctly
    console.log('Test 1: Checking if editor.js is served...');
    const editorResponse = await fetch(`${SERVER_URL}/src/frontend/editor.js`);
    if (editorResponse.ok) {
      const editorContent = await editorResponse.text();
      
      // Test 2: Check for replace functionality code
      console.log('Test 2: Checking for replace functionality...');
      const hasReplaceToggle = editorContent.includes('replace-toggle');
      const hasReplaceControls = editorContent.includes('replace-controls');
      const hasReplaceInput = editorContent.includes('replace-input');
      const hasReplaceCurrent = editorContent.includes('replaceCurrent');
      const hasReplaceAll = editorContent.includes('replaceAll');
      
      if (hasReplaceToggle && hasReplaceControls && hasReplaceInput && hasReplaceCurrent && hasReplaceAll) {
        console.log('✓ Replace functionality code found\n');
      } else {
        console.log('✗ Replace functionality code missing');
        console.log(`  - Replace toggle: ${hasReplaceToggle}`);
        console.log(`  - Replace controls: ${hasReplaceControls}`);
        console.log(`  - Replace input: ${hasReplaceInput}`);
        console.log(`  - Replace current method: ${hasReplaceCurrent}`);
        console.log(`  - Replace all method: ${hasReplaceAll}\n`);
      }
      
      // Test 3: Check for regex support
      console.log('Test 3: Checking for regex support...');
      const hasRegexToggle = editorContent.includes('regex-toggle');
      const hasRegexCheckbox = editorContent.includes('regex-checkbox');
      const hasUseRegex = editorContent.includes('useRegex');
      const hasRegexInPerformFind = editorContent.includes('new RegExp(searchText');
      
      if (hasRegexToggle && hasRegexCheckbox && hasUseRegex && hasRegexInPerformFind) {
        console.log('✓ Regex support found\n');
      } else {
        console.log('✗ Regex support missing');
        console.log(`  - Regex toggle: ${hasRegexToggle}`);
        console.log(`  - Regex checkbox: ${hasRegexCheckbox}`);
        console.log(`  - useRegex property: ${hasUseRegex}`);
        console.log(`  - RegExp in performFind: ${hasRegexInPerformFind}\n`);
      }
      
      // Test 4: Check for keyboard shortcuts
      console.log('Test 4: Checking for keyboard shortcuts...');
      const hasCtrlH = editorContent.includes("e.key === 'h'") && editorContent.includes('e.metaKey || e.ctrlKey');
      const hasOpenFindBarWithReplace = editorContent.includes('openFindBar(true)');
      
      if (hasCtrlH && hasOpenFindBarWithReplace) {
        console.log('✓ Cmd/Ctrl+H shortcut configured\n');
      } else {
        console.log('✗ Keyboard shortcut missing');
        console.log(`  - Ctrl+H handler: ${hasCtrlH}`);
        console.log(`  - openFindBar(true) call: ${hasOpenFindBarWithReplace}\n`);
      }
      
      // Test 5: Check UI elements in HTML template
      console.log('Test 5: Checking UI elements...');
      const htmlTemplate = editorContent.match(/innerHTML = `([^`]+)`/s);
      if (htmlTemplate) {
        const html = htmlTemplate[1];
        const hasReplaceButton = html.includes('replace-toggle');
        const hasReplaceSection = html.includes('replace-controls');
        const hasRegexOption = html.includes('regex-checkbox');
        
        if (hasReplaceButton && hasReplaceSection && hasRegexOption) {
          console.log('✓ All UI elements present in template\n');
        } else {
          console.log('✗ Some UI elements missing');
          console.log(`  - Replace button: ${hasReplaceButton}`);
          console.log(`  - Replace section: ${hasReplaceSection}`);
          console.log(`  - Regex option: ${hasRegexOption}\n`);
        }
      }
      
      console.log('All tests completed!');
    } else {
      console.log('✗ Failed to fetch editor.js:', editorResponse.status);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    if (serverProcess) {
      serverProcess.kill();
      console.log('\nServer stopped');
    }
  }
}

// Run the tests
testReplaceFeatures().catch(console.error);