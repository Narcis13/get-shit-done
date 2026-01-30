import http from 'http';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Test CSP headers
async function testCSPHeaders() {
  console.log('Testing Content Security Policy headers...\n');
  
  // Start server
  const serverProcess = spawn('node', [path.join(__dirname, 'src/server/index.js'), '--no-open'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  // Wait for server to start
  await new Promise(resolve => {
    serverProcess.stdout.on('data', data => {
      if (data.toString().includes('running at')) {
        resolve();
      }
    });
  });
  
  try {
    // Test 1: Check CSP headers on main page
    console.log('Test 1: Checking CSP headers on main page...');
    const mainPageHeaders = await getHeaders('http://localhost:3456/');
    
    if (!mainPageHeaders['content-security-policy']) {
      throw new Error('CSP header missing on main page');
    }
    
    const csp = mainPageHeaders['content-security-policy'];
    const expectedDirectives = [
      'default-src', 'script-src', 'style-src', 'img-src',
      'connect-src', 'font-src', 'object-src', 'frame-src',
      'base-uri', 'form-action'
    ];
    
    for (const directive of expectedDirectives) {
      if (!csp.includes(directive)) {
        throw new Error(`CSP missing directive: ${directive}`);
      }
    }
    console.log('✓ CSP header contains all expected directives');
    
    // Test 2: Check other security headers
    console.log('\nTest 2: Checking other security headers...');
    const securityHeaders = {
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
      'x-xss-protection': '1; mode=block',
      'referrer-policy': 'no-referrer-when-downgrade'
    };
    
    for (const [header, expectedValue] of Object.entries(securityHeaders)) {
      const value = mainPageHeaders[header];
      if (value !== expectedValue) {
        throw new Error(`${header} expected '${expectedValue}', got '${value}'`);
      }
      console.log(`✓ ${header}: ${value}`);
    }
    
    // Test 3: Check API endpoints also have headers
    console.log('\nTest 3: Checking security headers on API endpoints...');
    const apiEndpoints = ['/api/tree', '/api/state'];
    
    for (const endpoint of apiEndpoints) {
      const headers = await getHeaders(`http://localhost:3456${endpoint}`);
      if (!headers['content-security-policy']) {
        throw new Error(`CSP header missing on ${endpoint}`);
      }
      console.log(`✓ ${endpoint} has CSP header`);
    }
    
    // Test 4: Verify CSP allows necessary resources
    console.log('\nTest 4: Verifying CSP policy details...');
    if (!csp.includes("script-src 'self' 'unsafe-inline'")) {
      throw new Error('CSP should allow inline scripts for development');
    }
    if (!csp.includes("connect-src 'self' http://localhost:* http://127.0.0.1:*")) {
      throw new Error('CSP should allow localhost connections');
    }
    if (!csp.includes("object-src 'none'")) {
      throw new Error('CSP should block object/embed elements');
    }
    console.log('✓ CSP policy correctly configured for IDE');
    
    console.log('\n✅ All CSP header tests passed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    serverProcess.kill();
  }
}

// Helper to get headers
function getHeaders(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      resolve(res.headers);
      res.resume();
    }).on('error', reject);
  });
}

// Run tests
testCSPHeaders().catch(console.error);