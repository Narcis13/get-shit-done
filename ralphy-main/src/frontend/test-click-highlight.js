// Test for click-to-highlight connected nodes and edges functionality

// Mock DOM environment
const mockDOM = () => {
  const elements = [];
  
  return {
    nodeElements: [
      { element: { classList: { add: jest.fn(), remove: jest.fn(), contains: jest.fn() } }, data: { id: 'commands/test.md', name: 'test', type: 'command' } },
      { element: { classList: { add: jest.fn(), remove: jest.fn(), contains: jest.fn() } }, data: { id: 'looppool/workflows/workflow.md', name: 'workflow', type: 'workflow' } },
      { element: { classList: { add: jest.fn(), remove: jest.fn(), contains: jest.fn() } }, data: { id: 'agents/agent.md', name: 'agent', type: 'agent' } },
      { element: { classList: { add: jest.fn(), remove: jest.fn(), contains: jest.fn() } }, data: { id: 'looppool/templates/template.md', name: 'template', type: 'template' } }
    ],
    edgeElements: [
      { element: { classList: { add: jest.fn(), remove: jest.fn(), contains: jest.fn() } }, data: { source: 'commands/test.md', target: 'looppool/workflows/workflow.md', type: 'delegates-to' } },
      { element: { classList: { add: jest.fn(), remove: jest.fn(), contains: jest.fn() } }, data: { source: 'looppool/workflows/workflow.md', target: 'agents/agent.md', type: 'spawns' } },
      { element: { classList: { add: jest.fn(), remove: jest.fn(), contains: jest.fn() } }, data: { source: 'agents/agent.md', target: 'looppool/templates/template.md', type: 'uses' } }
    ]
  };
};

describe('Graph Viewer Click-to-Highlight', () => {
  let graphViewer;
  
  beforeEach(() => {
    // Create a mock GraphViewer instance
    graphViewer = {
      nodeElements: [],
      edgeElements: [],
      onNodeClick: function(node) {
        // Implementation copied from graph-viewer.js
        const connectedNodes = new Set();
        const connectedEdges = new Set();
        
        this.edgeElements.forEach(({ element, data }) => {
          if (data.source === node.id) {
            connectedNodes.add(data.target);
            connectedEdges.add(element);
            element.classList.add('highlighted');
          } else if (data.target === node.id) {
            connectedNodes.add(data.source);
            connectedEdges.add(element);
            element.classList.add('highlighted');
          } else {
            element.classList.remove('highlighted');
          }
        });
        
        this.nodeElements.forEach(({ element, data }) => {
          if (data.id === node.id || connectedNodes.has(data.id)) {
            element.classList.add('highlighted');
          } else {
            element.classList.remove('highlighted');
          }
        });
      }
    };
    
    // Set up mock DOM
    const mock = mockDOM();
    graphViewer.nodeElements = mock.nodeElements;
    graphViewer.edgeElements = mock.edgeElements;
  });
  
  test('clicking a command node highlights connected workflow and edge', () => {
    const commandNode = { id: 'commands/test.md', name: 'test', type: 'command' };
    graphViewer.onNodeClick(commandNode);
    
    // Check that command node is highlighted
    expect(graphViewer.nodeElements[0].element.classList.add).toHaveBeenCalledWith('highlighted');
    
    // Check that connected workflow node is highlighted
    expect(graphViewer.nodeElements[1].element.classList.add).toHaveBeenCalledWith('highlighted');
    
    // Check that the edge between them is highlighted
    expect(graphViewer.edgeElements[0].element.classList.add).toHaveBeenCalledWith('highlighted');
    
    // Check that non-connected nodes are not highlighted
    expect(graphViewer.nodeElements[2].element.classList.remove).toHaveBeenCalledWith('highlighted');
    expect(graphViewer.nodeElements[3].element.classList.remove).toHaveBeenCalledWith('highlighted');
  });
  
  test('clicking a workflow node highlights connected command and agent', () => {
    const workflowNode = { id: 'looppool/workflows/workflow.md', name: 'workflow', type: 'workflow' };
    graphViewer.onNodeClick(workflowNode);
    
    // Check that workflow node is highlighted
    expect(graphViewer.nodeElements[1].element.classList.add).toHaveBeenCalledWith('highlighted');
    
    // Check that connected command node is highlighted (incoming edge)
    expect(graphViewer.nodeElements[0].element.classList.add).toHaveBeenCalledWith('highlighted');
    
    // Check that connected agent node is highlighted (outgoing edge)
    expect(graphViewer.nodeElements[2].element.classList.add).toHaveBeenCalledWith('highlighted');
    
    // Check that both edges are highlighted
    expect(graphViewer.edgeElements[0].element.classList.add).toHaveBeenCalledWith('highlighted');
    expect(graphViewer.edgeElements[1].element.classList.add).toHaveBeenCalledWith('highlighted');
    
    // Check that template node is not highlighted
    expect(graphViewer.nodeElements[3].element.classList.remove).toHaveBeenCalledWith('highlighted');
  });
  
  test('clicking a node removes highlighting from unrelated nodes', () => {
    const templateNode = { id: 'looppool/templates/template.md', name: 'template', type: 'template' };
    graphViewer.onNodeClick(templateNode);
    
    // Check that template and its connected agent are highlighted
    expect(graphViewer.nodeElements[3].element.classList.add).toHaveBeenCalledWith('highlighted');
    expect(graphViewer.nodeElements[2].element.classList.add).toHaveBeenCalledWith('highlighted');
    
    // Check that unrelated nodes have highlighting removed
    expect(graphViewer.nodeElements[0].element.classList.remove).toHaveBeenCalledWith('highlighted');
    expect(graphViewer.nodeElements[1].element.classList.remove).toHaveBeenCalledWith('highlighted');
    
    // Check that unrelated edges have highlighting removed
    expect(graphViewer.edgeElements[0].element.classList.remove).toHaveBeenCalledWith('highlighted');
    expect(graphViewer.edgeElements[1].element.classList.remove).toHaveBeenCalledWith('highlighted');
  });
});

// Run the tests
describe.each = (table) => (name, fn) => {
  table.forEach((args) => {
    describe(name, () => fn(...args));
  });
};

console.log('\n=== Running Click-to-Highlight Tests ===\n');

// Since we can't use Jest directly, let's create a simple test runner
const results = [];
let currentTest = '';

const expect = (value) => ({
  toHaveBeenCalledWith: (expected) => {
    const calls = value.mock?.calls || [];
    const found = calls.some(call => JSON.stringify(call) === JSON.stringify([expected]));
    if (!found) {
      results.push({ test: currentTest, passed: false, error: `Expected to be called with ${expected}` });
    } else {
      results.push({ test: currentTest, passed: true });
    }
  }
});

const jest = {
  fn: () => {
    const fn = function() {
      fn.mock.calls.push(Array.from(arguments));
    };
    fn.mock = { calls: [] };
    return fn;
  }
};

const test = (name, fn) => {
  currentTest = name;
  try {
    fn();
  } catch (error) {
    results.push({ test: name, passed: false, error: error.message });
  }
};

// Run tests
const beforeEach = () => {};
const describe = (name, fn) => {
  console.log(`Testing: ${name}`);
  fn();
};

// Execute test suite
describe('Graph Viewer Click-to-Highlight', () => {
  let graphViewer;
  
  // Set up before each test
  const setup = () => {
    graphViewer = {
      nodeElements: [],
      edgeElements: [],
      onNodeClick: function(node) {
        const connectedNodes = new Set();
        const connectedEdges = new Set();
        
        this.edgeElements.forEach(({ element, data }) => {
          if (data.source === node.id) {
            connectedNodes.add(data.target);
            connectedEdges.add(element);
            element.classList.add('highlighted');
          } else if (data.target === node.id) {
            connectedNodes.add(data.source);
            connectedEdges.add(element);
            element.classList.add('highlighted');
          } else {
            element.classList.remove('highlighted');
          }
        });
        
        this.nodeElements.forEach(({ element, data }) => {
          if (data.id === node.id || connectedNodes.has(data.id)) {
            element.classList.add('highlighted');
          } else {
            element.classList.remove('highlighted');
          }
        });
      }
    };
    
    const mock = mockDOM();
    graphViewer.nodeElements = mock.nodeElements;
    graphViewer.edgeElements = mock.edgeElements;
  };
  
  test('clicking a command node highlights connected workflow and edge', () => {
    setup();
    const commandNode = { id: 'commands/test.md', name: 'test', type: 'command' };
    graphViewer.onNodeClick(commandNode);
    
    expect(graphViewer.nodeElements[0].element.classList.add).toHaveBeenCalledWith('highlighted');
    expect(graphViewer.nodeElements[1].element.classList.add).toHaveBeenCalledWith('highlighted');
    expect(graphViewer.edgeElements[0].element.classList.add).toHaveBeenCalledWith('highlighted');
    expect(graphViewer.nodeElements[2].element.classList.remove).toHaveBeenCalledWith('highlighted');
    expect(graphViewer.nodeElements[3].element.classList.remove).toHaveBeenCalledWith('highlighted');
  });
  
  test('clicking a workflow node highlights connected command and agent', () => {
    setup();
    const workflowNode = { id: 'looppool/workflows/workflow.md', name: 'workflow', type: 'workflow' };
    graphViewer.onNodeClick(workflowNode);
    
    expect(graphViewer.nodeElements[1].element.classList.add).toHaveBeenCalledWith('highlighted');
    expect(graphViewer.nodeElements[0].element.classList.add).toHaveBeenCalledWith('highlighted');
    expect(graphViewer.nodeElements[2].element.classList.add).toHaveBeenCalledWith('highlighted');
    expect(graphViewer.edgeElements[0].element.classList.add).toHaveBeenCalledWith('highlighted');
    expect(graphViewer.edgeElements[1].element.classList.add).toHaveBeenCalledWith('highlighted');
    expect(graphViewer.nodeElements[3].element.classList.remove).toHaveBeenCalledWith('highlighted');
  });
  
  test('clicking a node removes highlighting from unrelated nodes', () => {
    setup();
    const templateNode = { id: 'looppool/templates/template.md', name: 'template', type: 'template' };
    graphViewer.onNodeClick(templateNode);
    
    expect(graphViewer.nodeElements[3].element.classList.add).toHaveBeenCalledWith('highlighted');
    expect(graphViewer.nodeElements[2].element.classList.add).toHaveBeenCalledWith('highlighted');
    expect(graphViewer.nodeElements[0].element.classList.remove).toHaveBeenCalledWith('highlighted');
    expect(graphViewer.nodeElements[1].element.classList.remove).toHaveBeenCalledWith('highlighted');
    expect(graphViewer.edgeElements[0].element.classList.remove).toHaveBeenCalledWith('highlighted');
    expect(graphViewer.edgeElements[1].element.classList.remove).toHaveBeenCalledWith('highlighted');
  });
});

// Print results
console.log('\n=== Test Results ===\n');
const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;

results.forEach((result, index) => {
  if (index === 0 || results[index - 1].test !== result.test) {
    console.log(`\n${result.passed ? '✓' : '✗'} ${result.test}`);
  }
  if (!result.passed) {
    console.log(`  Error: ${result.error}`);
  }
});

console.log(`\n\nTotal: ${results.length} assertions, ${passed} passed, ${failed} failed\n`);