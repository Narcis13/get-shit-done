import { readFile } from 'fs/promises';
import { join } from 'path';

async function testReplaceImplementation() {
  console.log('Testing replace functionality implementation...\n');
  
  try {
    // Read the editor.js file
    const editorPath = join(process.cwd(), 'src/frontend/editor.js');
    const editorContent = await readFile(editorPath, 'utf-8');
    
    let allPassed = true;
    
    // Test 1: Check for replace UI elements
    console.log('Test 1: Checking for replace UI elements...');
    const uiElements = [
      { name: 'Replace toggle button', pattern: 'replace-toggle' },
      { name: 'Replace controls div', pattern: 'replace-controls' },
      { name: 'Replace input field', pattern: 'replace-input' },
      { name: 'Replace button', pattern: 'replace-current' },
      { name: 'Replace All button', pattern: 'replace-all' }
    ];
    
    let uiPassed = true;
    for (const element of uiElements) {
      if (!editorContent.includes(element.pattern)) {
        console.log(`  ✗ Missing: ${element.name}`);
        uiPassed = false;
        allPassed = false;
      }
    }
    if (uiPassed) {
      console.log('  ✓ All replace UI elements present\n');
    }
    
    // Test 2: Check for replace methods
    console.log('Test 2: Checking for replace methods...');
    const methods = [
      { name: 'replaceCurrent()', pattern: 'replaceCurrent()' },
      { name: 'replaceAll()', pattern: 'replaceAll()' },
      { name: 'toggleReplaceBar()', pattern: 'toggleReplaceBar()' },
      { name: 'handleReplaceKeydown()', pattern: 'handleReplaceKeydown(' }
    ];
    
    let methodsPassed = true;
    for (const method of methods) {
      if (!editorContent.includes(method.pattern)) {
        console.log(`  ✗ Missing: ${method.name}`);
        methodsPassed = false;
        allPassed = false;
      }
    }
    if (methodsPassed) {
      console.log('  ✓ All replace methods implemented\n');
    }
    
    // Test 3: Check for regex support
    console.log('Test 3: Checking for regex support...');
    const regexFeatures = [
      { name: 'Regex checkbox', pattern: 'regex-checkbox' },
      { name: 'Regex toggle UI', pattern: 'regex-toggle' },
      { name: 'useRegex property', pattern: 'this.useRegex' },
      { name: 'RegExp usage', pattern: 'new RegExp(' },
      { name: 'Regex in replace', pattern: 'content.replace(regex' }
    ];
    
    let regexPassed = true;
    for (const feature of regexFeatures) {
      if (!editorContent.includes(feature.pattern)) {
        console.log(`  ✗ Missing: ${feature.name}`);
        regexPassed = false;
        allPassed = false;
      }
    }
    if (regexPassed) {
      console.log('  ✓ Regex support fully implemented\n');
    }
    
    // Test 4: Check for keyboard shortcuts
    console.log('Test 4: Checking for keyboard shortcuts...');
    const hasCtrlH = editorContent.includes("e.key === 'h'") && 
                     editorContent.includes('e.metaKey || e.ctrlKey');
    const hasOpenFindBarWithReplace = editorContent.includes('openFindBar(true)');
    
    if (hasCtrlH && hasOpenFindBarWithReplace) {
      console.log('  ✓ Cmd/Ctrl+H keyboard shortcut implemented\n');
    } else {
      console.log('  ✗ Keyboard shortcut missing or incomplete\n');
      allPassed = false;
    }
    
    // Test 5: Check event listeners
    console.log('Test 5: Checking event listeners...');
    const eventListeners = [
      { name: 'Replace toggle click', pattern: "('.replace-toggle').addEventListener('click'" },
      { name: 'Replace current click', pattern: "('.replace-current').addEventListener('click'" },
      { name: 'Replace all click', pattern: "('.replace-all').addEventListener('click'" },
      { name: 'Regex checkbox change', pattern: "regexCheckbox.addEventListener('change'" }
    ];
    
    let listenersPassed = true;
    for (const listener of eventListeners) {
      if (!editorContent.includes(listener.pattern)) {
        console.log(`  ✗ Missing: ${listener.name}`);
        listenersPassed = false;
        allPassed = false;
      }
    }
    if (listenersPassed) {
      console.log('  ✓ All event listeners properly attached\n');
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    if (allPassed) {
      console.log('✓ All tests passed! Replace functionality is properly implemented.');
    } else {
      console.log('✗ Some tests failed. Please check the implementation.');
    }
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('Error reading file:', error.message);
  }
}

// Run the test
testReplaceImplementation();