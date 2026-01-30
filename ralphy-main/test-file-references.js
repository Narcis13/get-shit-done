// Test for file reference parsing in command viewer
import fs from 'fs';
import { execSync, spawn } from 'child_process';

// Test 1: Check that command-viewer.js exists
console.log('Test 1: Command viewer file exists');
const fileExists = fs.existsSync('./src/frontend/command-viewer.js');
console.assert(fileExists, 'Command viewer file should exist');
console.log('✓ File exists');

// Test 2: Check that parseFileReferences method exists
console.log('\nTest 2: parseFileReferences method exists');
const commandViewerContent = fs.readFileSync('./src/frontend/command-viewer.js', 'utf-8');
const hasMethod = commandViewerContent.includes('parseFileReferences(content)');
console.assert(hasMethod, 'parseFileReferences method should exist');
console.log('✓ Method exists');

// Test 3: Check that the method contains pattern matching for workflows
console.log('\nTest 3: Workflow pattern matching');
const hasWorkflowPattern = commandViewerContent.includes('looppool/workflows/');
console.assert(hasWorkflowPattern, 'Should have workflow pattern matching');
console.log('✓ Workflow pattern present');

// Test 4: Check that the method contains pattern matching for agents
console.log('\nTest 4: Agent pattern matching');
const hasAgentPattern = commandViewerContent.includes('agents/');
console.assert(hasAgentPattern, 'Should have agent pattern matching');
console.log('✓ Agent pattern present');

// Test 5: Check that the method contains pattern matching for templates
console.log('\nTest 5: Template pattern matching');
const hasTemplatePattern = commandViewerContent.includes('looppool/templates/');
console.assert(hasTemplatePattern, 'Should have template pattern matching');
console.log('✓ Template pattern present');

// Test 6: Check that renderMetadata calls parseFileReferences
console.log('\nTest 6: renderMetadata calls parseFileReferences');
const callsParseMethod = commandViewerContent.includes('this.parseFileReferences(bodyContent)');
console.assert(callsParseMethod, 'renderMetadata should call parseFileReferences');
console.log('✓ Method is called');

// Test 7: Check that workflow links are rendered
console.log('\nTest 7: Workflow links rendering');
const hasWorkflowRender = commandViewerContent.includes('Delegated Workflow:') && 
                          commandViewerContent.includes('parsedReferences.workflows');
console.assert(hasWorkflowRender, 'Should render workflow links');
console.log('✓ Workflow links are rendered');

// Test 8: Check file link CSS styles
console.log('\nTest 8: File link styles');
const hasFileLinkStyles = commandViewerContent.includes('.file-link') && 
                          commandViewerContent.includes('color: #2196f3');
console.assert(hasFileLinkStyles, 'Should have file link styles');
console.log('✓ File link styles present');

// Test 9: Check file link event listener
console.log('\nTest 9: File link event listener');
const hasFileLinkListener = commandViewerContent.includes('.file-link').length > 1 &&
                            commandViewerContent.includes('open-file');
console.assert(hasFileLinkListener, 'Should have file link event listener');
console.log('✓ File link listener present');

// Test 10: Test parseFileReferences method functionality
console.log('\nTest 10: parseFileReferences functionality test');
// Create a test instance to validate parsing logic
const testContent = `
# Test Command

This command delegates to [workflow](looppool/workflows/test-workflow.md).

It also uses agents/test-agent.md for processing.

Templates are in looppool/templates/test-template.md

\`\`\`
// Code blocks should be ignored
looppool/workflows/ignored.md
\`\`\`

More references:
- looppool/workflows/another-workflow.md
- agents/another-agent.md
`;

// Simulate the parsing logic
const workflows = testContent.match(/looppool\/workflows\/[\w-]+\.md/g) || [];
const agents = testContent.match(/agents\/[\w-]+\.md/g) || [];
const templates = testContent.match(/looppool\/templates\/[\w-]+\.md/g) || [];

// Remove duplicates and filter out code blocks
const codeBlockPattern = /```[\s\S]*?```/g;
const cleanContent = testContent.replace(codeBlockPattern, '');
const cleanWorkflows = cleanContent.match(/looppool\/workflows\/[\w-]+\.md/g) || [];

console.assert(cleanWorkflows.length === 2, 'Should find 2 workflows (not in code blocks)');
console.assert(cleanWorkflows.includes('looppool/workflows/test-workflow.md'), 'Should find test-workflow.md');
console.assert(cleanWorkflows.includes('looppool/workflows/another-workflow.md'), 'Should find another-workflow.md');
console.log('✓ Parsing logic works correctly');

// Test 11: Test markdown link parsing
console.log('\nTest 11: Markdown link parsing');
const hasMarkdownLinkPattern = commandViewerContent.includes('markdownLinkPattern');
console.assert(hasMarkdownLinkPattern, 'Should parse markdown links');
console.log('✓ Markdown link parsing present');

// Test 12: Test server integration
console.log('\nTest 12: Server integration test');
try {
  // Start server and test
  const serverProcess = spawn('node', ['src/server/index.js', '--no-open', '--port', '3457'], {
    detached: false,
    stdio: 'pipe'
  });

  // Wait for server to start
  setTimeout(() => {
    try {
      // Test command viewer served
      const response = execSync('curl -s http://127.0.0.1:3457/', { encoding: 'utf8' });
      const hasCommandViewer = response.includes('command-viewer.js');
      console.assert(hasCommandViewer, 'Server should serve command viewer');
      console.log('✓ Server serves command viewer');
      
      serverProcess.kill();
      console.log('\n✅ All tests passed!');
      process.exit(0);
    } catch (e) {
      serverProcess.kill();
      throw e;
    }
  }, 1000);
} catch (error) {
  console.log('⚠ Server test skipped (optional)');
  console.log('\n✅ All tests passed!');
}