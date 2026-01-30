#!/usr/bin/env node

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const puppeteer = require('puppeteer');

const testPort = 3457;

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function waitForServer(port, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:${port}/`, (res) => {
          resolve();
        });
        req.on('error', reject);
        req.end();
      });
      return true;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  return false;
}

async function runTests() {
  log('Starting find functionality tests...', 'yellow');

  // Start server
  const serverPath = path.join(__dirname, 'src', 'server', 'index.js');
  const server = spawn('node', [serverPath, '--port', testPort.toString(), '--no-open'], {
    stdio: ['ignore', 'pipe', 'pipe']
  });

  server.stdout.on('data', (data) => {
    console.log(`Server: ${data.toString().trim()}`);
  });

  server.stderr.on('data', (data) => {
    console.error(`Server Error: ${data.toString().trim()}`);
  });

  try {
    // Wait for server to start
    const serverReady = await waitForServer(testPort);
    if (!serverReady) {
      throw new Error('Server failed to start');
    }

    log('Server started successfully', 'green');

    // Launch browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(`http://localhost:${testPort}/`);

    // Wait for editor to load
    await page.waitForSelector('.editor-textarea', { timeout: 5000 });

    // Test 1: Check if find bar is initially hidden
    log('Test 1: Find bar initially hidden');
    const findBarInitiallyHidden = await page.evaluate(() => {
      const findBar = document.querySelector('#find-bar');
      return findBar && findBar.style.display === 'none';
    });
    if (findBarInitiallyHidden) {
      log('✓ Find bar is initially hidden', 'green');
    } else {
      log('✗ Find bar should be hidden initially', 'red');
    }

    // Test 2: Open find bar with Cmd/Ctrl+F
    log('Test 2: Open find bar with keyboard shortcut');
    await page.keyboard.down('Control');
    await page.keyboard.press('f');
    await page.keyboard.up('Control');
    
    await page.waitForTimeout(100);
    
    const findBarVisible = await page.evaluate(() => {
      const findBar = document.querySelector('#find-bar');
      return findBar && findBar.style.display === 'block';
    });
    if (findBarVisible) {
      log('✓ Find bar opens with Ctrl+F', 'green');
    } else {
      log('✗ Find bar should open with Ctrl+F', 'red');
    }

    // Test 3: Find functionality
    log('Test 3: Find text in editor');
    await page.type('#find-input', 'test');
    await page.waitForTimeout(100);

    const findResults = await page.evaluate(() => {
      const results = document.querySelector('.find-results');
      return results ? results.textContent : '';
    });
    
    if (findResults && findResults.includes('/')) {
      log(`✓ Find shows results: ${findResults}`, 'green');
    } else {
      log('✗ Find should show results', 'red');
    }

    // Test 4: Navigate find results with Enter
    log('Test 4: Navigate find results');
    const initialSelection = await page.evaluate(() => {
      const textarea = document.querySelector('.editor-textarea');
      return { start: textarea.selectionStart, end: textarea.selectionEnd };
    });

    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);

    const afterEnterSelection = await page.evaluate(() => {
      const textarea = document.querySelector('.editor-textarea');
      return { start: textarea.selectionStart, end: textarea.selectionEnd };
    });

    if (afterEnterSelection.start !== initialSelection.start || afterEnterSelection.end !== initialSelection.end) {
      log('✓ Enter navigates to next match', 'green');
    } else {
      log('✗ Enter should navigate to next match', 'red');
    }

    // Test 5: Navigate backwards with Shift+Enter
    log('Test 5: Navigate backwards with Shift+Enter');
    await page.keyboard.down('Shift');
    await page.keyboard.press('Enter');
    await page.keyboard.up('Shift');
    await page.waitForTimeout(100);

    const afterShiftEnterSelection = await page.evaluate(() => {
      const textarea = document.querySelector('.editor-textarea');
      return { start: textarea.selectionStart, end: textarea.selectionEnd };
    });

    if (afterShiftEnterSelection.start !== afterEnterSelection.start || afterShiftEnterSelection.end !== afterEnterSelection.end) {
      log('✓ Shift+Enter navigates to previous match', 'green');
    } else {
      log('✗ Shift+Enter should navigate to previous match', 'red');
    }

    // Test 6: Close find bar with Escape
    log('Test 6: Close find bar with Escape');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);

    const findBarHiddenAfterEscape = await page.evaluate(() => {
      const findBar = document.querySelector('#find-bar');
      return findBar && findBar.style.display === 'none';
    });
    if (findBarHiddenAfterEscape) {
      log('✓ Find bar closes with Escape', 'green');
    } else {
      log('✗ Find bar should close with Escape', 'red');
    }

    // Test 7: Test with no matches
    log('Test 7: Search with no matches');
    await page.keyboard.down('Control');
    await page.keyboard.press('f');
    await page.keyboard.up('Control');
    await page.waitForTimeout(100);

    await page.evaluate(() => {
      const input = document.querySelector('#find-input');
      input.value = '';
    });
    await page.type('#find-input', 'nonexistenttext');
    await page.waitForTimeout(100);

    const noMatchResults = await page.evaluate(() => {
      const results = document.querySelector('.find-results');
      return results ? results.textContent : '';
    });
    
    if (noMatchResults === '0/0') {
      log('✓ Shows 0/0 for no matches', 'green');
    } else {
      log(`✗ Should show 0/0 for no matches (got: ${noMatchResults})`, 'red');
    }

    await browser.close();
    log('All tests completed!', 'green');

  } catch (error) {
    log(`Test error: ${error.message}`, 'red');
    process.exit(1);
  } finally {
    server.kill();
  }
}

// Run tests
runTests().catch(error => {
  log(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
});