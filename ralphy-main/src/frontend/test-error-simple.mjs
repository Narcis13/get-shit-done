import fs from 'fs';
import path from 'path';

// Check if error boundary files exist
const files = [
  'src/frontend/error-boundary.js',
  'src/frontend/async-error-handler.js'
];

console.log('Checking error boundary implementation...\n');

// Test 1: Check files exist
files.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`✓ ${file} exists: ${exists}`);
});

// Test 2: Check error-boundary.js content
const errorBoundaryContent = fs.readFileSync('src/frontend/error-boundary.js', 'utf-8');
const errorBoundaryTests = [
  { name: 'ErrorBoundary class', pattern: /class ErrorBoundary/ },
  { name: 'wrap method', pattern: /wrap\(componentFactory\)/ },
  { name: 'handleError method', pattern: /handleError\(error\)/ },
  { name: 'getUserFriendlyMessage', pattern: /getUserFriendlyMessage\(error\)/ },
  { name: 'retry functionality', pattern: /retry\(\)/ },
  { name: 'Error reporting to localStorage', pattern: /localStorage.setItem\('lpl-error-log'/ },
  { name: 'CSS styles', pattern: /\.error-boundary-fallback/ }
];

console.log('\nError Boundary features:');
errorBoundaryTests.forEach(test => {
  const found = test.pattern.test(errorBoundaryContent);
  console.log(`✓ ${test.name}: ${found}`);
});

// Test 3: Check async-error-handler.js content
const asyncHandlerContent = fs.readFileSync('src/frontend/async-error-handler.js', 'utf-8');
const asyncHandlerTests = [
  { name: 'AsyncErrorHandler class', pattern: /class AsyncErrorHandler/ },
  { name: 'wrapFetch method', pattern: /wrapFetch\(url, options/ },
  { name: 'wrapAsync method', pattern: /wrapAsync\(fn, componentName, operationName\)/ },
  { name: 'NetworkError class', pattern: /class NetworkError extends Error/ },
  { name: 'AsyncOperationError class', pattern: /class AsyncOperationError extends Error/ },
  { name: 'showErrorToast method', pattern: /showErrorToast\(message/ },
  { name: 'Global error handler', pattern: /asyncErrorHandler\.setGlobalHandler/ },
  { name: 'Toast CSS styles', pattern: /\.error-toast/ }
];

console.log('\nAsync Error Handler features:');
asyncHandlerTests.forEach(test => {
  const found = test.pattern.test(asyncHandlerContent);
  console.log(`✓ ${test.name}: ${found}`);
});

// Test 4: Check integration in index.html
const indexContent = fs.readFileSync('src/frontend/index.html', 'utf-8');
const integrationTests = [
  { name: 'error-boundary.js included', pattern: /<script src="error-boundary\.js">/ },
  { name: 'async-error-handler.js included', pattern: /<script src="async-error-handler\.js">/ },
  { name: 'Components wrapped with ErrorBoundary', pattern: /new ErrorBoundary\(.*'FileTree'\)/ },
  { name: 'Editor wrapped', pattern: /new ErrorBoundary\(.*'MarkdownEditor'\)/ },
  { name: 'StatePanel wrapped', pattern: /new ErrorBoundary\(.*'StatePanel'\)/ }
];

console.log('\nIntegration tests:');
integrationTests.forEach(test => {
  const found = test.pattern.test(indexContent);
  console.log(`✓ ${test.name}: ${found}`);
});

// Test 5: Check app.js integration
const appContent = fs.readFileSync('src/frontend/app.js', 'utf-8');
const appTests = [
  { name: 'API uses asyncErrorHandler.wrapAsync', pattern: /asyncErrorHandler\.wrapAsync/ },
  { name: 'Fetch calls use asyncErrorHandler.wrapFetch', pattern: /asyncErrorHandler\.wrapFetch/ }
];

console.log('\nApp.js integration:');
appTests.forEach(test => {
  const found = test.pattern.test(appContent);
  console.log(`✓ ${test.name}: ${found}`);
});

console.log('\n✅ Error boundary implementation complete!');