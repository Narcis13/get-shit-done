#!/usr/bin/env node
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFile } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let totalTests = 0;
let passedTests = 0;

function test(description, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✓ ${description}`);
    passedTests++;
  } catch (error) {
    console.error(`✗ ${description}`);
    console.error(`  ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

async function runTests() {
  console.log('Testing Collapsible Planning Document Tree...\n');
  
  // Read the state panel file
  const statePanelPath = join(__dirname, 'src', 'frontend', 'state-panel.js');
  const statePanelContent = await readFile(statePanelPath, 'utf8');
  
  test('StatePanel has planning documents array', () => {
    assert(statePanelContent.includes('this.planningDocs = ['), 'Planning docs array not found');
    assert(statePanelContent.includes("{ name: 'PROJECT.md', path: 'PROJECT.md', expanded: true }"), 'PROJECT.md entry not found');
    assert(statePanelContent.includes("{ name: 'ROADMAP.md', path: 'ROADMAP.md', expanded: false }"), 'ROADMAP.md entry not found');
    assert(statePanelContent.includes("{ name: 'PLAN.md', path: 'PLAN.md', expanded: false }"), 'PLAN.md entry not found');
    assert(statePanelContent.includes("{ name: 'DECISIONS.md', path: 'DECISIONS.md', expanded: false }"), 'DECISIONS.md entry not found');
    assert(statePanelContent.includes("{ name: 'CONTINUE_HERE.md', path: 'CONTINUE_HERE.md', expanded: false }"), 'CONTINUE_HERE.md entry not found');
  });
  
  test('renderPlanningDocTree method exists', () => {
    assert(statePanelContent.includes('renderPlanningDocTree()'), 'renderPlanningDocTree method not found');
  });
  
  test('renderPlanningDocTree generates correct HTML structure', () => {
    assert(statePanelContent.includes('planning-docs-section'), 'Planning docs section class not found');
    assert(statePanelContent.includes('planning-doc-tree'), 'Planning doc tree class not found');
    assert(statePanelContent.includes('planning-doc-item'), 'Planning doc item class not found');
    assert(statePanelContent.includes('doc-toggle'), 'Doc toggle class not found');
    assert(statePanelContent.includes('doc-name'), 'Doc name class not found');
    assert(statePanelContent.includes('open-doc'), 'Open doc button class not found');
    assert(statePanelContent.includes('doc-content'), 'Doc content class not found');
  });
  
  test('loadDocumentContent method exists', () => {
    assert(statePanelContent.includes('async loadDocumentContent(docPath)'), 'loadDocumentContent method not found');
    assert(statePanelContent.includes('/api/file?path='), 'API call for loading document not found');
  });
  
  test('createDocumentPreview method exists', () => {
    assert(statePanelContent.includes('createDocumentPreview(text, docPath)'), 'createDocumentPreview method not found');
  });
  
  test('createDocumentPreview has special handling for PLAN.md', () => {
    assert(statePanelContent.includes("if (docPath === 'PLAN.md')"), 'PLAN.md special handling not found');
    assert(statePanelContent.includes('task-summary'), 'Task summary class not found');
    assert(statePanelContent.includes('tasks complete'), 'Task completion text not found');
  });
  
  test('createDocumentPreview has special handling for ROADMAP.md', () => {
    assert(statePanelContent.includes("if (docPath === 'ROADMAP.md')"), 'ROADMAP.md special handling not found');
    assert(statePanelContent.includes('phase-summary'), 'Phase summary class not found');
    assert(statePanelContent.includes('phases,'), 'Phase count text not found');
    assert(statePanelContent.includes('milestones'), 'Milestone count text not found');
  });
  
  test('setupPlanningDocHandlers method exists', () => {
    assert(statePanelContent.includes('setupPlanningDocHandlers()'), 'setupPlanningDocHandlers method not found');
  });
  
  test('setupPlanningDocHandlers handles toggle clicks', () => {
    assert(statePanelContent.includes("if (e.target.classList.contains('doc-toggle'))"), 'Toggle click handler not found');
    assert(statePanelContent.includes('docItem.expanded = !docItem.expanded'), 'Toggle state logic not found');
    assert(statePanelContent.includes("e.target.classList.toggle('expanded')"), 'Toggle class change not found');
    assert(statePanelContent.includes("contentDiv.classList.toggle('expanded')"), 'Content div toggle not found');
  });
  
  test('setupPlanningDocHandlers handles open document clicks', () => {
    assert(statePanelContent.includes("if (e.target.classList.contains('open-doc'))"), 'Open doc click handler not found');
    assert(statePanelContent.includes("new CustomEvent('open-file'"), 'Open file event not found');
    assert(statePanelContent.includes('document.dispatchEvent(event)'), 'Event dispatch not found');
  });
  
  test('CSS styles for planning doc tree are defined', () => {
    assert(statePanelContent.includes('.planning-docs-section'), 'Planning docs section style not found');
    assert(statePanelContent.includes('.planning-doc-tree'), 'Planning doc tree style not found');
    assert(statePanelContent.includes('.planning-doc-item'), 'Planning doc item style not found');
    assert(statePanelContent.includes('.doc-header'), 'Doc header style not found');
    assert(statePanelContent.includes('.doc-toggle'), 'Doc toggle style not found');
    assert(statePanelContent.includes('.doc-toggle.expanded'), 'Expanded toggle style not found');
    assert(statePanelContent.includes('.doc-content.collapsed'), 'Collapsed content style not found');
    assert(statePanelContent.includes('.doc-content.expanded'), 'Expanded content style not found');
    assert(statePanelContent.includes('.doc-preview-list'), 'Doc preview list style not found');
  });
  
  test('renderState integrates planning doc tree', () => {
    assert(statePanelContent.includes('// Add collapsible planning document tree'), 'Planning doc tree integration comment not found');
    assert(statePanelContent.includes('html += this.renderPlanningDocTree()'), 'renderPlanningDocTree call not found');
    assert(statePanelContent.includes('// Load initially expanded documents'), 'Initial load comment not found');
    assert(statePanelContent.includes('this.loadDocumentContent(doc.path)'), 'Initial document loading not found');
  });
  
  test('Init method sets up planning doc handlers', () => {
    assert(statePanelContent.includes('this.setupPlanningDocHandlers()'), 'setupPlanningDocHandlers call in init not found');
  });
  
  console.log(`\n${passedTests}/${totalTests} tests passed`);
  process.exit(passedTests === totalTests ? 0 : 1);
}

runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});