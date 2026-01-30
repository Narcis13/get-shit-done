const fs = require('fs');
const path = require('path');

// Mock fetch for testing
global.fetch = async (url) => {
  // Mock /api/tree response
  if (url === '/api/tree') {
    return {
      json: async () => ({
        name: 'root',
        type: 'directory',
        children: [
          {
            name: 'commands',
            type: 'directory',
            children: [
              {
                name: 'lpl',
                type: 'directory',
                children: [
                  { name: 'init.md', type: 'file' },
                  { name: 'run.md', type: 'file' }
                ]
              }
            ]
          },
          {
            name: 'looppool',
            type: 'directory',
            children: [
              {
                name: 'workflows',
                type: 'directory',
                children: [
                  { name: 'execute-plan.md', type: 'file' },
                  { name: 'create-project.md', type: 'file' }
                ]
              },
              {
                name: 'templates',
                type: 'directory',
                children: [
                  { name: 'project-structure.md', type: 'file' },
                  { name: 'readme.md', type: 'file' }
                ]
              }
            ]
          },
          {
            name: 'agents',
            type: 'directory',
            children: [
              { name: 'executor.md', type: 'file' },
              { name: 'planner.md', type: 'file' }
            ]
          }
        ]
      })
    };
  }
  
  // Mock file content responses
  if (url.startsWith('/api/file?path=')) {
    const filePath = decodeURIComponent(url.split('path=')[1]);
    
    // Mock content based on file type
    if (filePath.startsWith('commands/')) {
      return {
        text: async () => `# Command File\n\nThis delegates to looppool/workflows/execute-plan.md\n\nAnother reference: looppool/workflows/create-project.md`
      };
    } else if (filePath.startsWith('looppool/workflows/')) {
      return {
        text: async () => `# Workflow File\n\nThis spawns agents/executor.md\n\nAlso uses agents/planner.md`
      };
    } else if (filePath.startsWith('agents/')) {
      return {
        text: async () => `# Agent File\n\nUses template: looppool/templates/project-structure.md\n\nAlso: looppool/templates/readme.md`
      };
    }
    
    return { text: async () => '' };
  }
  
  throw new Error('Unknown URL: ' + url);
};

// Load the GraphViewer class
const graphViewerCode = fs.readFileSync(path.join(__dirname, 'src/frontend/graph-viewer.js'), 'utf8');
eval(graphViewerCode);

// Test the parser
async function runTests() {
  console.log('Running graph parser tests...\n');
  
  // Test 1: Check if GraphViewer class exists
  console.log('Test 1: GraphViewer class exists');
  console.log('Result:', typeof GraphViewer === 'function' ? 'PASS' : 'FAIL');
  
  // Test 2: Create instance
  console.log('\nTest 2: Create GraphViewer instance');
  const container = { innerHTML: '' };
  let viewer;
  try {
    viewer = new GraphViewer(container);
    console.log('Result: PASS');
  } catch (e) {
    console.log('Result: FAIL -', e.message);
    return;
  }
  
  // Test 3: Check parseGraphData method exists
  console.log('\nTest 3: parseGraphData method exists');
  console.log('Result:', typeof viewer.parseGraphData === 'function' ? 'PASS' : 'FAIL');
  
  // Test 4: Check extractFiles method exists
  console.log('\nTest 4: extractFiles method exists');
  console.log('Result:', typeof viewer.extractFiles === 'function' ? 'PASS' : 'FAIL');
  
  // Test 5: Check parseFileRelationships method exists
  console.log('\nTest 5: parseFileRelationships method exists');
  console.log('Result:', typeof viewer.parseFileRelationships === 'function' ? 'PASS' : 'FAIL');
  
  // Test 6: Check command parsing method exists
  console.log('\nTest 6: parseCommandRelationships method exists');
  console.log('Result:', typeof viewer.parseCommandRelationships === 'function' ? 'PASS' : 'FAIL');
  
  // Test 7: Check workflow parsing method exists
  console.log('\nTest 7: parseWorkflowRelationships method exists');
  console.log('Result:', typeof viewer.parseWorkflowRelationships === 'function' ? 'PASS' : 'FAIL');
  
  // Test 8: Check agent parsing method exists
  console.log('\nTest 8: parseAgentRelationships method exists');
  console.log('Result:', typeof viewer.parseAgentRelationships === 'function' ? 'PASS' : 'FAIL');
  
  // Test 9: Parse graph data
  console.log('\nTest 9: Parse graph data');
  try {
    const graphData = await viewer.parseGraphData();
    console.log('Nodes found:', graphData.nodes.length);
    console.log('Edges found:', graphData.edges.length);
    console.log('Result:', graphData.nodes.length > 0 && graphData.edges.length > 0 ? 'PASS' : 'FAIL');
    
    // Test 10: Verify node types
    console.log('\nTest 10: Verify node types');
    const nodeTypes = new Set(graphData.nodes.map(n => n.type));
    const expectedTypes = ['command', 'workflow', 'agent', 'template'];
    const hasAllTypes = expectedTypes.every(type => nodeTypes.has(type));
    console.log('Node types found:', Array.from(nodeTypes));
    console.log('Result:', hasAllTypes ? 'PASS' : 'FAIL');
    
    // Test 11: Verify edge types
    console.log('\nTest 11: Verify edge types');
    const edgeTypes = new Set(graphData.edges.map(e => e.type));
    const expectedEdgeTypes = ['delegates-to', 'spawns', 'uses'];
    const hasAllEdgeTypes = expectedEdgeTypes.every(type => edgeTypes.has(type));
    console.log('Edge types found:', Array.from(edgeTypes));
    console.log('Result:', hasAllEdgeTypes ? 'PASS' : 'FAIL');
    
  } catch (e) {
    console.log('Result: FAIL -', e.message);
  }
}

runTests().catch(console.error);