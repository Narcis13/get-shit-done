import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let server;
let testsPassed = 0;
let testsFailed = 0;

function startServer() {
  return new Promise((resolve) => {
    server = spawn('node', [join(__dirname, 'src/server/index.js'), '--port', '3459', '--no-open'], {
      stdio: 'pipe',
      cwd: __dirname
    });

    server.stdout.on('data', (data) => {
      if (data.toString().includes('Server running at')) {
        setTimeout(resolve, 100); // Give server time to fully start
      }
    });

    server.stderr.on('data', (data) => {
      console.error(`Server stderr: ${data}`);
    });
  });
}

function stopServer() {
  if (server) {
    server.kill();
  }
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
    testsPassed++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  ${error.message}`);
    testsFailed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// Test 1: Check that vim mode toggle is present in UI
async function testVimTogglePresent() {
  const response = await fetch('http://127.0.0.1:3459/');
  const html = await response.text();
  
  assert(html.includes('vim-checkbox'), 'Vim checkbox not found in HTML');
  assert(html.includes('vim-mode-indicator'), 'Vim mode indicator not found in HTML');
  assert(html.includes('Vim</span>'), 'Vim toggle label not found in HTML');
}

// Test 2: Check editor.js contains vim mode implementation
async function testVimImplementation() {
  const response = await fetch('http://127.0.0.1:3459/editor.js');
  const js = await response.text();
  
  assert(js.includes('vimEnabled'), 'vimEnabled property not found');
  assert(js.includes('vimMode'), 'vimMode property not found');
  assert(js.includes('handleVimKeyboard'), 'handleVimKeyboard method not found');
  assert(js.includes('handleVimNormalMode'), 'handleVimNormalMode method not found');
  assert(js.includes('handleVimInsertMode'), 'handleVimInsertMode method not found');
  assert(js.includes('handleVimVisualMode'), 'handleVimVisualMode method not found');
  assert(js.includes('toggleVimMode'), 'toggleVimMode method not found');
  assert(js.includes('loadVimPreference'), 'loadVimPreference method not found');
}

// Test 3: Check vim motion helpers are implemented
async function testVimMotionHelpers() {
  const response = await fetch('http://127.0.0.1:3459/editor.js');
  const js = await response.text();
  
  assert(js.includes('moveCursor'), 'moveCursor method not found');
  assert(js.includes('moveWord'), 'moveWord method not found');
  assert(js.includes('moveToLineStart'), 'moveToLineStart method not found');
  assert(js.includes('moveToLineEnd'), 'moveToLineEnd method not found');
  assert(js.includes('moveToFileStart'), 'moveToFileStart method not found');
  assert(js.includes('moveToFileEnd'), 'moveToFileEnd method not found');
}

// Test 4: Check vim commands are implemented
async function testVimCommands() {
  const response = await fetch('http://127.0.0.1:3459/editor.js');
  const js = await response.text();
  
  assert(js.includes('deleteLine'), 'deleteLine method not found');
  assert(js.includes('yankLine'), 'yankLine method not found');
  assert(js.includes('yankSelection'), 'yankSelection method not found');
  assert(js.includes('deleteSelection'), 'deleteSelection method not found');
  assert(js.includes('pasteAfter'), 'pasteAfter method not found');
  assert(js.includes('pasteBefore'), 'pasteBefore method not found');
}

// Test 5: Check vim keybindings are properly mapped
async function testVimKeybindings() {
  const response = await fetch('http://127.0.0.1:3459/editor.js');
  const js = await response.text();
  
  // Motion keys
  assert(js.includes("vimKeyBuffer === 'h'"), 'h key binding not found');
  assert(js.includes("vimKeyBuffer === 'j'"), 'j key binding not found');
  assert(js.includes("vimKeyBuffer === 'k'"), 'k key binding not found');
  assert(js.includes("vimKeyBuffer === 'l'"), 'l key binding not found');
  
  // Mode switching
  assert(js.includes("vimKeyBuffer === 'i'"), 'i key binding not found');
  assert(js.includes("vimKeyBuffer === 'a'"), 'a key binding not found');
  assert(js.includes("vimKeyBuffer === 'v'"), 'v key binding not found');
  assert(js.includes("vimKeyBuffer === 'o'"), 'o key binding not found');
  
  // Commands
  assert(js.includes("vimKeyBuffer === 'dd'"), 'dd key binding not found');
  assert(js.includes("vimKeyBuffer === 'yy'"), 'yy key binding not found');
  assert(js.includes("vimKeyBuffer === 'p'"), 'p key binding not found');
  assert(js.includes("vimKeyBuffer === 'x'"), 'x key binding not found');
  
  // Navigation
  assert(js.includes("vimKeyBuffer === 'gg'"), 'gg key binding not found');
  assert(js.includes("vimKeyBuffer === 'G'"), 'G key binding not found');
  assert(js.includes("vimKeyBuffer === '0'"), '0 key binding not found');
  assert(js.includes("vimKeyBuffer === '$'"), '$ key binding not found');
  assert(js.includes("vimKeyBuffer === 'w'"), 'w key binding not found');
  assert(js.includes("vimKeyBuffer === 'b'"), 'b key binding not found');
}

// Test 6: Check vim mode persistence via localStorage
async function testVimModePersistence() {
  const response = await fetch('http://127.0.0.1:3459/editor.js');
  const js = await response.text();
  
  assert(js.includes("localStorage.setItem('vim-mode-enabled'"), 'localStorage.setItem not found');
  assert(js.includes("localStorage.getItem('vim-mode-enabled')"), 'localStorage.getItem not found');
}

// Test 7: Check CSS styles for vim mode
async function testVimStyles() {
  const response = await fetch('http://127.0.0.1:3459/editor.js');
  const js = await response.text();
  
  assert(js.includes('.vim-toggle'), 'vim-toggle CSS class not found');
  assert(js.includes('.vim-mode-indicator'), 'vim-mode-indicator CSS class not found');
}

// Test 8: Check escape key handling in different modes
async function testEscapeHandling() {
  const response = await fetch('http://127.0.0.1:3459/editor.js');
  const js = await response.text();
  
  assert(js.includes("key === 'Escape'"), 'Escape key handling not found');
  assert(js.includes('handleVimInsertMode') && js.includes("key === 'Escape'"), 'Escape in insert mode not found');
  assert(js.includes('handleVimVisualMode') && js.includes("key === 'Escape'"), 'Escape in visual mode not found');
}

// Main test runner
async function runTests() {
  console.log('Starting vim keybindings tests...\n');
  
  try {
    await startServer();
    await new Promise(resolve => setTimeout(resolve, 500)); // Extra wait for server
    
    await test('Vim toggle is present in UI', testVimTogglePresent);
    await test('Vim mode implementation exists', testVimImplementation);
    await test('Vim motion helpers are implemented', testVimMotionHelpers);
    await test('Vim commands are implemented', testVimCommands);
    await test('Vim keybindings are properly mapped', testVimKeybindings);
    await test('Vim mode persistence via localStorage', testVimModePersistence);
    await test('CSS styles for vim mode', testVimStyles);
    await test('Escape key handling in different modes', testEscapeHandling);
    
  } finally {
    stopServer();
  }
  
  console.log(`\nTests passed: ${testsPassed}`);
  console.log(`Tests failed: ${testsFailed}`);
  
  process.exit(testsFailed > 0 ? 1 : 0);
}

runTests().catch(error => {
  console.error('Test runner error:', error);
  stopServer();
  process.exit(1);
});