// Test suite for Progress Summary Quick Action feature

import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test configuration
const TESTS = {
  'generateProgressSummary method exists': async () => {
    const content = await fs.readFile(join(__dirname, 'src/frontend/state-panel.js'), 'utf-8');
    return content.includes('generateProgressSummary()') && content.includes('async generateProgressSummary()');
  },
  
  'showProgressSummary method exists': async () => {
    const content = await fs.readFile(join(__dirname, 'src/frontend/state-panel.js'), 'utf-8');
    return content.includes('showProgressSummary()');
  },
  
  'Progress summary button in HTML': async () => {
    const content = await fs.readFile(join(__dirname, 'src/frontend/state-panel.js'), 'utf-8');
    return content.includes('progress-summary-btn') && 
           content.includes('📊 Progress summary');
  },
  
  'Event handler for progress summary button': async () => {
    const content = await fs.readFile(join(__dirname, 'src/frontend/state-panel.js'), 'utf-8');
    return content.includes("e.target.classList.contains('progress-summary-btn')") &&
           content.includes('this.showProgressSummary()');
  },
  
  'CSS styles for progress summary button': async () => {
    const content = await fs.readFile(join(__dirname, 'src/frontend/state-panel.js'), 'utf-8');
    return content.includes('.progress-summary-btn {') &&
           content.includes('background: #f59e0b') &&
           content.includes('.progress-summary-btn:hover') &&
           content.includes('.progress-summary-btn:active');
  },
  
  'Data collection in generateProgressSummary': async () => {
    const content = await fs.readFile(join(__dirname, 'src/frontend/state-panel.js'), 'utf-8');
    return content.includes('if (this.projectData)') &&
           content.includes('if (this.planData)') &&
           content.includes('if (this.roadmapData)');
  },
  
  'Progress summary formatting in showProgressSummary': async () => {
    const content = await fs.readFile(join(__dirname, 'src/frontend/state-panel.js'), 'utf-8');
    return content.includes('📊 Project Progress Summary') &&
           content.includes('Task Completion:') &&
           content.includes('Roadmap Overview:') &&
           content.includes('alert(message)');
  },
  
  'Instance data storage in renderState': async () => {
    const content = await fs.readFile(join(__dirname, 'src/frontend/state-panel.js'), 'utf-8');
    return content.includes('this.projectData = projectHtml') &&
           content.includes('this.roadmapData = roadmapData') &&
           content.includes('this.planData = planData');
  },
  
  'Quick actions section includes all three buttons': async () => {
    const content = await fs.readFile(join(__dirname, 'src/frontend/state-panel.js'), 'utf-8');
    const quickActionsSection = content.match(/<div class="quick-action-buttons">[\s\S]*?<\/div>/);
    if (!quickActionsSection) return false;
    const section = quickActionsSection[0];
    return section.includes('resume-work-btn') &&
           section.includes('view-decisions-btn') &&
           section.includes('progress-summary-btn');
  },
  
  'Timestamp included in summary': async () => {
    const content = await fs.readFile(join(__dirname, 'src/frontend/state-panel.js'), 'utf-8');
    return content.includes("timestamp: new Date().toLocaleString()") &&
           content.includes("Generated: ${summary.timestamp}");
  }
};

// Test runner
async function runTests() {
  console.log('Running Progress Summary tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const [name, test] of Object.entries(TESTS)) {
    try {
      const result = await test();
      if (result) {
        console.log(`✅ ${name}`);
        passed++;
      } else {
        console.log(`❌ ${name}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${name} - Error: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(console.error);