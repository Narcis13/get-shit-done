import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simple test to verify GraphViewer implementation
console.log('Running graph parser tests...\n');

// Test 1: Check if graph-viewer.js exists
console.log('Test 1: graph-viewer.js file exists');
try {
  const graphViewerCode = readFileSync(join(__dirname, 'src/frontend/graph-viewer.js'), 'utf8');
  console.log('Result: PASS');
  
  // Test 2: Check class definition
  console.log('\nTest 2: GraphViewer class defined');
  console.log('Result:', graphViewerCode.includes('class GraphViewer') ? 'PASS' : 'FAIL');
  
  // Test 3: Check parseGraphData method
  console.log('\nTest 3: parseGraphData method exists');
  console.log('Result:', graphViewerCode.includes('parseGraphData()') ? 'PASS' : 'FAIL');
  
  // Test 4: Check extractFiles method
  console.log('\nTest 4: extractFiles method exists');
  console.log('Result:', graphViewerCode.includes('extractFiles(') ? 'PASS' : 'FAIL');
  
  // Test 5: Check parseFileRelationships method
  console.log('\nTest 5: parseFileRelationships method exists');
  console.log('Result:', graphViewerCode.includes('parseFileRelationships(') ? 'PASS' : 'FAIL');
  
  // Test 6: Check command parsing
  console.log('\nTest 6: parseCommandRelationships method exists');
  console.log('Result:', graphViewerCode.includes('parseCommandRelationships(') ? 'PASS' : 'FAIL');
  
  // Test 7: Check workflow parsing
  console.log('\nTest 7: parseWorkflowRelationships method exists');
  console.log('Result:', graphViewerCode.includes('parseWorkflowRelationships(') ? 'PASS' : 'FAIL');
  
  // Test 8: Check agent parsing
  console.log('\nTest 8: parseAgentRelationships method exists');
  console.log('Result:', graphViewerCode.includes('parseAgentRelationships(') ? 'PASS' : 'FAIL');
  
  // Test 9: Check pattern matching
  console.log('\nTest 9: File pattern matching implemented');
  const hasWorkflowPattern = graphViewerCode.includes('looppool\\/workflows\\/[\\w-]+\\.md');
  const hasAgentPattern = graphViewerCode.includes('agents\\/[\\w-]+\\.md');
  const hasTemplatePattern = graphViewerCode.includes('looppool\\/templates\\/[\\w-]+\\.md');
  console.log('Result:', (hasWorkflowPattern && hasAgentPattern && hasTemplatePattern) ? 'PASS' : 'FAIL');
  
  // Test 10: Check relationship types
  console.log('\nTest 10: Relationship types defined');
  const hasDelegatesTo = graphViewerCode.includes("'delegates-to'");
  const hasSpawns = graphViewerCode.includes("'spawns'");
  const hasUses = graphViewerCode.includes("'uses'");
  console.log('Result:', (hasDelegatesTo && hasSpawns && hasUses) ? 'PASS' : 'FAIL');
  
} catch (e) {
  console.log('Result: FAIL -', e.message);
}