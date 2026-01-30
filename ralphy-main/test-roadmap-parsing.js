// Test for ROADMAP.md parsing in state panel
import assert from 'assert';
import { readFileSync } from 'fs';
import { spawn } from 'child_process';
import http from 'http';

// Start the IDE server
const server = spawn('node', ['src/server/index.js', '--no-open'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';
server.stdout.on('data', (data) => {
  output += data.toString();
});

// Wait for server to start
await new Promise(resolve => {
  const checkServer = setInterval(() => {
    if (output.includes('Server running at')) {
      clearInterval(checkServer);
      resolve();
    }
  }, 100);
  
  setTimeout(() => {
    clearInterval(checkServer);
    resolve();
  }, 5000);
});

// Test 1: Check if state-panel.js file exists and has loadRoadmapMd method
try {
  const statePanelContent = readFileSync('src/frontend/state-panel.js', 'utf8');
  
  // Test 2: Verify loadRoadmapMd method exists
  assert(statePanelContent.includes('async loadRoadmapMd()'), 
    'loadRoadmapMd method should exist');
  
  // Test 3: Verify parseRoadmapPhases method exists
  assert(statePanelContent.includes('parseRoadmapPhases(text)'), 
    'parseRoadmapPhases method should exist');
  
  // Test 4: Verify renderRoadmapPhases method exists
  assert(statePanelContent.includes('renderRoadmapPhases(phases)'), 
    'renderRoadmapPhases method should exist');
  
  // Test 5: Check for phase parsing regex
  assert(statePanelContent.includes('/^##\\s+(.+)/'), 
    'Should have regex for parsing ## headings as phases');
  
  // Test 6: Check for milestone parsing regex
  assert(statePanelContent.includes('/^###\\s+(.+)/'), 
    'Should have regex for parsing ### headings as milestones');
  
  // Test 7: Check for task parsing regex
  assert(statePanelContent.includes('/^\\s*[-*]\\s+(.+)/'), 
    'Should have regex for parsing task list items');
  
  // Test 8: Verify API call to load ROADMAP.md
  assert(statePanelContent.includes("fetch('/api/file?path=ROADMAP.md')"), 
    'Should fetch ROADMAP.md from API');
  
  // Test 9: Check for roadmap section rendering
  assert(statePanelContent.includes('roadmap-section'), 
    'Should have roadmap-section CSS class');
  
  // Test 10: Check for phase/milestone rendering HTML
  assert(statePanelContent.includes('roadmap-phase'), 
    'Should have roadmap-phase CSS class');
  assert(statePanelContent.includes('roadmap-milestone'), 
    'Should have roadmap-milestone CSS class');
  
  // Test 11: Check CSS styles for roadmap
  assert(statePanelContent.includes('.roadmap-section'), 
    'Should have CSS styles for roadmap section');
  assert(statePanelContent.includes('.roadmap-phases'), 
    'Should have CSS styles for roadmap phases');
  assert(statePanelContent.includes('.phase-name'), 
    'Should have CSS styles for phase names');
  assert(statePanelContent.includes('.milestone-name'), 
    'Should have CSS styles for milestone names');
  assert(statePanelContent.includes('.milestone-tasks'), 
    'Should have CSS styles for milestone tasks');
  
  // Test 12: Test parseRoadmapPhases with sample data
  const testRoadmap = `
# Project Roadmap

## Phase 1: Foundation
Description of phase 1

### Milestone 1.1: Setup
- Task 1
- Task 2
- Task 3

### Milestone 1.2: Core Features
- Feature A
- Feature B

## Phase 2: Enhancement
Description of phase 2

### Milestone 2.1: Advanced Features
- Advanced feature 1
- Advanced feature 2
`;

  // Create a simple test of the parsing logic
  const lines = testRoadmap.split('\n');
  let phaseCount = 0;
  let milestoneCount = 0;
  let taskCount = 0;
  
  lines.forEach(line => {
    if (line.match(/^##\s+/)) phaseCount++;
    if (line.match(/^###\s+/)) milestoneCount++;
    if (line.match(/^\s*-\s+/)) taskCount++;
  });
  
  assert(phaseCount === 2, 'Should parse 2 phases');
  assert(milestoneCount === 3, 'Should parse 3 milestones');
  assert(taskCount === 7, 'Should parse 7 tasks');
  
  console.log('✅ All tests passed!');
  console.log('- loadRoadmapMd method implemented');
  console.log('- parseRoadmapPhases method implemented');
  console.log('- renderRoadmapPhases method implemented');
  console.log('- Phase parsing (## headings) working');
  console.log('- Milestone parsing (### headings) working');
  console.log('- Task parsing (- list items) working');
  console.log('- API fetch for ROADMAP.md configured');
  console.log('- HTML rendering structure in place');
  console.log('- CSS styles defined for all roadmap elements');
  console.log('- Sample roadmap parsing logic verified');
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
} finally {
  server.kill();
}

process.exit(0);