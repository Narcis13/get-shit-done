import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
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

// Test 1: Check that editor.js file exists
test('Editor file exists', () => {
  const editorPath = join(__dirname, 'src/frontend/editor.js');
  assert(fs.existsSync(editorPath), 'editor.js file not found');
});

// Test 2: Check vim mode implementation in editor.js
test('Vim mode implementation exists', () => {
  const editorPath = join(__dirname, 'src/frontend/editor.js');
  const content = fs.readFileSync(editorPath, 'utf-8');
  
  assert(content.includes('vimEnabled'), 'vimEnabled property not found');
  assert(content.includes('vimMode'), 'vimMode property not found');
  assert(content.includes('vimKeyBuffer'), 'vimKeyBuffer property not found');
  assert(content.includes('vimRegisters'), 'vimRegisters property not found');
});

// Test 3: Check vim keyboard handler methods
test('Vim keyboard handlers implemented', () => {
  const editorPath = join(__dirname, 'src/frontend/editor.js');
  const content = fs.readFileSync(editorPath, 'utf-8');
  
  assert(content.includes('handleVimKeyboard'), 'handleVimKeyboard method not found');
  assert(content.includes('handleVimNormalMode'), 'handleVimNormalMode method not found');
  assert(content.includes('handleVimInsertMode'), 'handleVimInsertMode method not found');
  assert(content.includes('handleVimVisualMode'), 'handleVimVisualMode method not found');
});

// Test 4: Check vim motion helpers
test('Vim motion helpers implemented', () => {
  const editorPath = join(__dirname, 'src/frontend/editor.js');
  const content = fs.readFileSync(editorPath, 'utf-8');
  
  assert(content.includes('moveCursor'), 'moveCursor method not found');
  assert(content.includes('moveWord'), 'moveWord method not found');
  assert(content.includes('moveToLineStart'), 'moveToLineStart method not found');
  assert(content.includes('moveToLineEnd'), 'moveToLineEnd method not found');
  assert(content.includes('moveToFileStart'), 'moveToFileStart method not found');
  assert(content.includes('moveToFileEnd'), 'moveToFileEnd method not found');
});

// Test 5: Check vim commands
test('Vim commands implemented', () => {
  const editorPath = join(__dirname, 'src/frontend/editor.js');
  const content = fs.readFileSync(editorPath, 'utf-8');
  
  assert(content.includes('deleteLine'), 'deleteLine method not found');
  assert(content.includes('yankLine'), 'yankLine method not found');
  assert(content.includes('yankSelection'), 'yankSelection method not found');
  assert(content.includes('deleteSelection'), 'deleteSelection method not found');
  assert(content.includes('pasteAfter'), 'pasteAfter method not found');
  assert(content.includes('pasteBefore'), 'pasteBefore method not found');
});

// Test 6: Check vim keybindings
test('Vim keybindings mapped', () => {
  const editorPath = join(__dirname, 'src/frontend/editor.js');
  const content = fs.readFileSync(editorPath, 'utf-8');
  
  // Motion keys
  assert(content.includes("vimKeyBuffer === 'h'"), 'h key binding not found');
  assert(content.includes("vimKeyBuffer === 'j'"), 'j key binding not found');
  assert(content.includes("vimKeyBuffer === 'k'"), 'k key binding not found');
  assert(content.includes("vimKeyBuffer === 'l'"), 'l key binding not found');
  
  // Mode switching
  assert(content.includes("vimKeyBuffer === 'i'"), 'i key binding not found');
  assert(content.includes("vimKeyBuffer === 'a'"), 'a key binding not found');
  assert(content.includes("vimKeyBuffer === 'v'"), 'v key binding not found');
  
  // Commands
  assert(content.includes("vimKeyBuffer === 'dd'"), 'dd key binding not found');
  assert(content.includes("vimKeyBuffer === 'yy'"), 'yy key binding not found');
  assert(content.includes("vimKeyBuffer === 'x'"), 'x key binding not found');
});

// Test 7: Check vim UI elements
test('Vim UI elements present', () => {
  const editorPath = join(__dirname, 'src/frontend/editor.js');
  const content = fs.readFileSync(editorPath, 'utf-8');
  
  assert(content.includes('vim-checkbox'), 'vim-checkbox element not found');
  assert(content.includes('vim-mode-indicator'), 'vim-mode-indicator element not found');
  assert(content.includes('toggleVimMode'), 'toggleVimMode method not found');
  assert(content.includes('updateVimModeIndicator'), 'updateVimModeIndicator method not found');
});

// Test 8: Check persistence
test('Vim mode persistence implemented', () => {
  const editorPath = join(__dirname, 'src/frontend/editor.js');
  const content = fs.readFileSync(editorPath, 'utf-8');
  
  assert(content.includes("localStorage.setItem('vim-mode-enabled'"), 'localStorage.setItem not found');
  assert(content.includes("localStorage.getItem('vim-mode-enabled')"), 'localStorage.getItem not found');
  assert(content.includes('loadVimPreference'), 'loadVimPreference method not found');
});

// Test 9: Check CSS styles
test('Vim CSS styles defined', () => {
  const editorPath = join(__dirname, 'src/frontend/editor.js');
  const content = fs.readFileSync(editorPath, 'utf-8');
  
  assert(content.includes('.vim-toggle'), 'vim-toggle CSS class not found');
  assert(content.includes('.vim-mode-indicator'), 'vim-mode-indicator CSS class not found');
});

// Summary
console.log('\n=== Test Summary ===');
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);

if (testsFailed > 0) {
  process.exit(1);
}