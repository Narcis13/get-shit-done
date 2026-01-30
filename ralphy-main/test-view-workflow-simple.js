// Simple test for View Workflow button functionality

import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function runTests() {
  const tests = [];
  
  // Read the command-viewer.js file
  const commandViewerPath = path.join(__dirname, 'src/frontend/command-viewer.js');
  const commandViewerContent = readFileSync(commandViewerPath, 'utf8');
  
  // Test 1: Check if view workflow button HTML is generated
  tests.push({
    name: 'View workflow button HTML generation',
    passed: commandViewerContent.includes('class="action-button view-workflow"') &&
            commandViewerContent.includes('View workflow →') &&
            commandViewerContent.includes('data-workflow="${parsedReferences.workflows[0]}"'),
    details: 'Checks if button HTML with correct class, text, and data attribute is generated'
  });

  // Test 2: Check if button is conditionally rendered
  tests.push({
    name: 'Conditional rendering based on workflow references',
    passed: commandViewerContent.includes('if (parsedReferences.workflows.length > 0)') &&
            commandViewerContent.includes('view-workflow'),
    details: 'Button only appears when workflows are referenced'
  });

  // Test 3: Check if button styling exists
  tests.push({
    name: 'View workflow button custom styling',
    passed: commandViewerContent.includes('.action-button.view-workflow {') &&
            commandViewerContent.includes('background: #2196f3;') &&
            commandViewerContent.includes('color: white;'),
    details: 'Button has blue background and white text'
  });

  // Test 4: Check hover styling
  tests.push({
    name: 'View workflow button hover effect',
    passed: commandViewerContent.includes('.action-button.view-workflow:hover {') &&
            commandViewerContent.includes('background: #1976d2;'),
    details: 'Button has darker blue background on hover'
  });

  // Test 5: Check event listener attachment
  tests.push({
    name: 'View workflow button event listener',
    passed: commandViewerContent.includes("metadataCard.querySelector('.view-workflow')?.addEventListener('click'") &&
            commandViewerContent.includes('const workflowPath = e.target.dataset.workflow;'),
    details: 'Click event listener is attached to button'
  });

  // Test 6: Check if open-file event is dispatched
  tests.push({
    name: 'Open file event dispatching',
    passed: commandViewerContent.includes("window.dispatchEvent(new CustomEvent('open-file', { detail: { path: workflowPath } }));"),
    details: 'Button click dispatches open-file event with workflow path'
  });

  // Test 7: Check null safety
  tests.push({
    name: 'Null safety check',
    passed: commandViewerContent.includes("metadataCard.querySelector('.view-workflow')?.addEventListener") &&
            commandViewerContent.includes('if (workflowPath) {'),
    details: 'Code safely handles missing button or workflow path'
  });

  // Test 8: Check button position in action buttons
  tests.push({
    name: 'Button placement in action buttons group',
    passed: commandViewerContent.includes('Test in terminal</button>') &&
            commandViewerContent.match(/Test in terminal<\/button>[\s\S]*?view-workflow/),
    details: 'View workflow button appears after test in terminal button'
  });

  // Print results
  console.log('=== View Workflow Button Test Results ===\n');
  tests.forEach((test, index) => {
    console.log(`${index + 1}. ${test.name}: ${test.passed ? '✓ PASSED' : '✗ FAILED'}`);
    console.log(`   ${test.details}`);
  });

  const passedTests = tests.filter(t => t.passed).length;
  console.log(`\nTotal: ${passedTests}/${tests.length} tests passed`);

  return passedTests === tests.length;
}

// Run tests
const allPassed = runTests();
console.log(allPassed ? '\nAll tests passed!' : '\nSome tests failed!');
process.exit(allPassed ? 0 : 1);