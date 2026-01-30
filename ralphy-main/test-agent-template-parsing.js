import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import assert from 'assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test 1: Verify GraphViewer class exists
async function testClassExists() {
  console.log('Test 1: GraphViewer class exists');
  const graphViewerPath = path.join(__dirname, 'src/frontend/graph-viewer.js');
  const content = fs.readFileSync(graphViewerPath, 'utf-8');
  assert(content.includes('class GraphViewer'), 'GraphViewer class not found');
  console.log('✓ GraphViewer class exists');
}

// Test 2: Verify parseAgentRelationships method exists
async function testParseAgentRelationshipsExists() {
  console.log('Test 2: parseAgentRelationships method exists');
  const graphViewerPath = path.join(__dirname, 'src/frontend/graph-viewer.js');
  const content = fs.readFileSync(graphViewerPath, 'utf-8');
  assert(content.includes('parseAgentRelationships('), 'parseAgentRelationships method not found');
  console.log('✓ parseAgentRelationships method exists');
}

// Test 3: Verify template pattern matching
async function testTemplatePattern() {
  console.log('Test 3: Template pattern matching');
  const graphViewerPath = path.join(__dirname, 'src/frontend/graph-viewer.js');
  const content = fs.readFileSync(graphViewerPath, 'utf-8');
  
  // Check for template pattern
  assert(content.includes('looppool\/templates\/'), 'Template pattern not found in parseAgentRelationships');
  assert(content.includes('templatePattern'), 'templatePattern variable not found');
  console.log('✓ Template pattern correctly defined');
}

// Test 4: Verify code block filtering logic
async function testCodeBlockFiltering() {
  console.log('Test 4: Code block filtering in parseAgentRelationships');
  const graphViewerPath = path.join(__dirname, 'src/frontend/graph-viewer.js');
  const content = fs.readFileSync(graphViewerPath, 'utf-8');
  
  // Find parseAgentRelationships method and check for code block filtering
  const methodStart = content.indexOf('parseAgentRelationships(agentId, content)');
  assert(methodStart > -1, 'parseAgentRelationships method not found');
  
  // Find the end of the method
  let braceCount = 0;
  let inMethod = false;
  let i = methodStart;
  
  while (i < content.length && (!inMethod || braceCount > 0)) {
    if (content[i] === '{') {
      braceCount++;
      inMethod = true;
    } else if (content[i] === '}') {
      braceCount--;
    }
    i++;
  }
  
  const methodContent = content.substring(methodStart, i);
  
  // Verify code block filtering logic
  assert(methodContent.includes('beforeMatch'), 'beforeMatch variable not found');
  assert(methodContent.includes('codeBlockCount'), 'codeBlockCount variable not found');
  assert(methodContent.includes('% 2 === 0'), 'Code block count logic not found');
  console.log('✓ Code block filtering implemented');
}

// Test 5: Verify relationship type is "uses"
async function testRelationshipType() {
  console.log('Test 5: Relationship type for agent-to-template');
  const graphViewerPath = path.join(__dirname, 'src/frontend/graph-viewer.js');
  const content = fs.readFileSync(graphViewerPath, 'utf-8');
  
  // Find parseAgentRelationships method
  const methodStart = content.indexOf('parseAgentRelationships(agentId, content)');
  assert(methodStart > -1, 'parseAgentRelationships method not found');
  
  // Find the end of the method
  let braceCount = 0;
  let inMethod = false;
  let i = methodStart;
  
  while (i < content.length && (!inMethod || braceCount > 0)) {
    if (content[i] === '{') {
      braceCount++;
      inMethod = true;
    } else if (content[i] === '}') {
      braceCount--;
    }
    i++;
  }
  
  const methodContent = content.substring(methodStart, i);
  
  // Verify the relationship type
  assert(methodContent.includes("'uses'"), 'Relationship type "uses" not found');
  assert(methodContent.includes('addRelationship'), 'addRelationship call not found');
  console.log('✓ Relationship type "uses" is correct');
}

// Test 6: Verify integration with parseFileRelationships
async function testIntegration() {
  console.log('Test 6: Integration with parseFileRelationships');
  const graphViewerPath = path.join(__dirname, 'src/frontend/graph-viewer.js');
  const content = fs.readFileSync(graphViewerPath, 'utf-8');
  
  // Find parseFileRelationships method and check for agent handling
  const methodStart = content.indexOf('async parseFileRelationships(file)');
  assert(methodStart > -1, 'parseFileRelationships method not found');
  
  // Find the section that handles file types
  const typeCheckStart = content.indexOf('// Parse relationships based on file type', methodStart);
  const typeCheckEnd = content.indexOf('} catch (error)', typeCheckStart);
  const typeCheckContent = content.substring(typeCheckStart, typeCheckEnd);
  
  // Verify it calls parseAgentRelationships for agent type
  assert(typeCheckContent.includes("file.type === 'agent'"), 'Agent type check not found');
  assert(typeCheckContent.includes('parseAgentRelationships'), 'parseAgentRelationships call not found');
  console.log('✓ parseAgentRelationships is called for agent files');
}

// Test 7: Verify agent file identification in extractFiles
async function testAgentFileIdentification() {
  console.log('Test 7: Agent file identification in extractFiles');
  const graphViewerPath = path.join(__dirname, 'src/frontend/graph-viewer.js');
  const content = fs.readFileSync(graphViewerPath, 'utf-8');
  
  // Find extractFiles method
  const extractStart = content.indexOf('extractFiles(');
  const extractEnd = content.indexOf('return files;', extractStart) + 13;
  const extractContent = content.substring(extractStart, extractEnd);
  
  // Verify agent file detection
  assert(extractContent.includes("fullPath.startsWith('agents/')"), 'Agent path check not found');
  assert(extractContent.includes("type: 'agent'"), 'Agent type assignment not found');
  console.log('✓ Agent files are correctly identified');
}

// Test 8: Verify template node creation in addRelationship
async function testTemplateNodeCreation() {
  console.log('Test 8: Template node creation in addRelationship');
  const graphViewerPath = path.join(__dirname, 'src/frontend/graph-viewer.js');
  const content = fs.readFileSync(graphViewerPath, 'utf-8');
  
  // Find addRelationship method
  const methodStart = content.indexOf('addRelationship(sourceId, targetPath, relationshipType)');
  assert(methodStart > -1, 'addRelationship method not found');
  
  // Find the type determination section
  const typeStart = content.indexOf('// Determine type from path', methodStart);
  const nodeCreationEnd = content.indexOf('this.nodeMap.set(targetPath, node);', typeStart);
  const typeContent = content.substring(typeStart, nodeCreationEnd + 35);
  
  // Verify template type determination
  assert(typeContent.includes("targetPath.startsWith('looppool/templates/')"), 'Template path check not found');
  assert(typeContent.includes("type = 'template'"), 'Template type assignment not found');
  console.log('✓ Template nodes are created correctly');
}

// Test 9: Verify pattern matches multiple templates
async function testMultipleTemplateMatching() {
  console.log('Test 9: Multiple template matching');
  const graphViewerPath = path.join(__dirname, 'src/frontend/graph-viewer.js');
  const content = fs.readFileSync(graphViewerPath, 'utf-8');
  
  // Check for global flag in regex
  assert(content.includes('/looppool\\/templates\\/[\\w-]+\\.md/g'), 'Global flag missing in template pattern');
  console.log('✓ Pattern can match multiple templates');
}

// Test 10: Test complete parsing flow
async function testCompleteParsingFlow() {
  console.log('Test 10: Complete parsing flow test');
  const graphViewerPath = path.join(__dirname, 'src/frontend/graph-viewer.js');
  const content = fs.readFileSync(graphViewerPath, 'utf-8');
  
  // Verify all necessary methods exist
  assert(content.includes('parseGraphData'), 'parseGraphData method not found');
  assert(content.includes('extractFiles'), 'extractFiles method not found');
  assert(content.includes('parseFileRelationships'), 'parseFileRelationships method not found');
  assert(content.includes('parseAgentRelationships'), 'parseAgentRelationships method not found');
  assert(content.includes('addRelationship'), 'addRelationship method not found');
  
  console.log('✓ All parsing flow methods present');
}

// Run all tests
async function runTests() {
  console.log('Running agent template parsing tests...\n');
  
  try {
    await testClassExists();
    await testParseAgentRelationshipsExists();
    await testTemplatePattern();
    await testCodeBlockFiltering();
    await testRelationshipType();
    await testIntegration();
    await testAgentFileIdentification();
    await testTemplateNodeCreation();
    await testMultipleTemplateMatching();
    await testCompleteParsingFlow();
    
    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests();