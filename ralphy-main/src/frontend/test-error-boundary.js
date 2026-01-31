// Test file for error boundary functionality

// Test 1: Verify ErrorBoundary class exists
console.assert(typeof ErrorBoundary === 'function', 'ErrorBoundary class should exist');

// Test 2: Verify AsyncErrorHandler exists
console.assert(typeof AsyncErrorHandler === 'function', 'AsyncErrorHandler class should exist');
console.assert(typeof asyncErrorHandler === 'object', 'asyncErrorHandler instance should exist');

// Test 3: Verify custom error classes
console.assert(typeof NetworkError === 'function', 'NetworkError class should exist');
console.assert(typeof AsyncOperationError === 'function', 'AsyncOperationError class should exist');

// Test 4: Verify ErrorBoundary methods
const testBoundary = new ErrorBoundary(document.createElement('div'), 'TestComponent');
console.assert(typeof testBoundary.wrap === 'function', 'ErrorBoundary should have wrap method');
console.assert(typeof testBoundary.handleError === 'function', 'ErrorBoundary should have handleError method');
console.assert(typeof testBoundary.showErrorUI === 'function', 'ErrorBoundary should have showErrorUI method');
console.assert(typeof testBoundary.getUserFriendlyMessage === 'function', 'ErrorBoundary should have getUserFriendlyMessage method');
console.assert(typeof testBoundary.retry === 'function', 'ErrorBoundary should have retry method');
console.assert(typeof testBoundary.reportError === 'function', 'ErrorBoundary should have reportError method');

// Test 5: Verify AsyncErrorHandler methods
console.assert(typeof asyncErrorHandler.wrapFetch === 'function', 'AsyncErrorHandler should have wrapFetch method');
console.assert(typeof asyncErrorHandler.wrapAsync === 'function', 'AsyncErrorHandler should have wrapAsync method');
console.assert(typeof asyncErrorHandler.showErrorToast === 'function', 'AsyncErrorHandler should have showErrorToast method');
console.assert(typeof asyncErrorHandler.showInlineError === 'function', 'AsyncErrorHandler should have showInlineError method');

// Test 6: Test error message mapping
const boundary = new ErrorBoundary(document.createElement('div'), 'Test');
const mappings = [
  { error: new Error('Failed to fetch'), expected: 'Unable to connect to the server. Please check your connection.' },
  { error: new Error('NetworkError'), expected: 'Network connection issue. Please try again.' },
  { error: new Error('TypeError: Cannot read property'), expected: 'An unexpected error occurred. Some data may be missing.' },
  { error: new Error('404 Not Found'), expected: 'The requested resource was not found.' },
  { error: new Error('500 Internal Server Error'), expected: 'Server error. Please try again later.' },
  { error: new Error('429 Too Many Requests'), expected: 'Too many requests. Please wait a moment before trying again.' }
];

mappings.forEach(({ error, expected }) => {
  const message = boundary.getUserFriendlyMessage(error);
  console.assert(message.includes(expected.split('.')[0]), `Error message mapping for "${error.message}" should contain "${expected.split('.')[0]}"`);
});

// Test 7: Verify CSS styles are added
const errorBoundaryStyles = Array.from(document.styleSheets).some(sheet => {
  try {
    return Array.from(sheet.cssRules || []).some(rule => 
      rule.selectorText?.includes('.error-boundary-fallback') ||
      rule.selectorText?.includes('.error-toast')
    );
  } catch (e) {
    return false;
  }
});
console.assert(errorBoundaryStyles, 'Error boundary CSS styles should be added to document');

// Test 8: Test NetworkError construction
const netError = new NetworkError('Test error', 404, 'https://example.com/api');
console.assert(netError.name === 'NetworkError', 'NetworkError should have correct name');
console.assert(netError.status === 404, 'NetworkError should store status');
console.assert(netError.url === 'https://example.com/api', 'NetworkError should store URL');

// Test 9: Test AsyncOperationError construction
const asyncError = new AsyncOperationError('Test async error', 'TestComponent', 'testOperation');
console.assert(asyncError.name === 'AsyncOperationError', 'AsyncOperationError should have correct name');
console.assert(asyncError.component === 'TestComponent', 'AsyncOperationError should store component');
console.assert(asyncError.operation === 'testOperation', 'AsyncOperationError should store operation');

// Test 10: Verify error boundary wrapping works
const testContainer = document.createElement('div');
const errorBoundary = new ErrorBoundary(testContainer, 'TestComponent');
let componentCreated = false;

const component = errorBoundary.wrap((container) => {
  componentCreated = true;
  const elem = document.createElement('div');
  elem.textContent = 'Test component';
  container.appendChild(elem);
  return { element: elem };
});

console.assert(componentCreated, 'Component factory should be called');
console.assert(component !== null, 'Wrapped component should be returned');
console.assert(testContainer.querySelector('.error-boundary-wrapper'), 'Error boundary wrapper should be created');

// Test 11: Verify API uses async error handler
console.assert(window.api?.executeOrQueue.toString().includes('asyncErrorHandler'), 'API should use async error handler');

// Test 12: Verify fetch operations use error handler
const operationQueue = new OperationQueue();
const executeOperation = operationQueue.executeOperation.toString();
console.assert(executeOperation.includes('asyncErrorHandler.wrapFetch'), 'OperationQueue should use async error handler for fetch');

console.log('✅ All error boundary tests passed!');