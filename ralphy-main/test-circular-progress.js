import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runTests() {
  console.log('Testing circular progress indicators implementation...\n');
  
  // Test 1: Check state-panel.js exists
  console.log('Test 1: Verify state-panel.js file exists');
  try {
    const statePanelPath = join(__dirname, 'src', 'frontend', 'state-panel.js');
    const content = await readFile(statePanelPath, 'utf8');
    console.log('✓ state-panel.js exists');
    
    // Test 2: Check createCircularProgress method exists
    console.log('\nTest 2: Verify createCircularProgress method is implemented');
    if (content.includes('createCircularProgress(percentage, size = 80)')) {
      console.log('✓ createCircularProgress method found');
    } else {
      throw new Error('createCircularProgress method not found');
    }
    
    // Test 3: Check SVG structure
    console.log('\nTest 3: Verify SVG structure in createCircularProgress');
    if (content.includes('<svg width="${size}" height="${size}" class="circular-progress">') &&
        content.includes('stroke-dasharray="${circumference}"') &&
        content.includes('stroke-dashoffset="${strokeDashoffset}"')) {
      console.log('✓ SVG structure is correct');
    } else {
      throw new Error('SVG structure is incorrect');
    }
    
    // Test 4: Check circle elements
    console.log('\nTest 4: Verify two circle elements (background and progress)');
    const circleMatches = content.match(/<circle/g);
    if (circleMatches && circleMatches.length >= 2) {
      console.log('✓ Two circle elements found');
    } else {
      throw new Error('Missing circle elements');
    }
    
    // Test 5: Check text element for percentage display
    console.log('\nTest 5: Verify text element for percentage display');
    if (content.includes('<text') && content.includes('>${percentage}%</text>')) {
      console.log('✓ Text element with percentage found');
    } else {
      throw new Error('Text element for percentage not found');
    }
    
    // Test 6: Check integration in renderProgressBars
    console.log('\nTest 6: Verify circular progress integrated in renderProgressBars');
    if (content.includes('${this.createCircularProgress(percent, 60)}')) {
      console.log('✓ Circular progress integrated in renderProgressBars');
    } else {
      throw new Error('Circular progress not integrated in renderProgressBars');
    }
    
    // Test 7: Check integration in task completion section
    console.log('\nTest 7: Verify circular progress in task completion section');
    if (content.includes('${this.createCircularProgress(percentage, 100)}')) {
      console.log('✓ Circular progress integrated in task completion');
    } else {
      throw new Error('Circular progress not integrated in task completion');
    }
    
    // Test 8: Check CSS styles for circular progress
    console.log('\nTest 8: Verify CSS styles for circular progress');
    if (content.includes('.circular-progress {') &&
        content.includes('.progress-circle {') &&
        content.includes('transition: stroke-dashoffset 0.5s ease;')) {
      console.log('✓ CSS styles for circular progress defined');
    } else {
      throw new Error('CSS styles for circular progress missing');
    }
    
    // Test 9: Check progress-indicators CSS
    console.log('\nTest 9: Verify progress-indicators layout CSS');
    if (content.includes('.progress-indicators {') &&
        content.includes('display: flex;') &&
        content.includes('align-items: center;')) {
      console.log('✓ Progress indicators layout CSS defined');
    } else {
      throw new Error('Progress indicators layout CSS missing');
    }
    
    // Test 10: Check mathematical calculations
    console.log('\nTest 10: Verify SVG math calculations');
    if (content.includes('const radius = (size - 4) / 2;') &&
        content.includes('const circumference = 2 * Math.PI * radius;') &&
        content.includes('const strokeDashoffset = circumference - (percentage / 100) * circumference;')) {
      console.log('✓ SVG mathematical calculations are correct');
    } else {
      throw new Error('SVG mathematical calculations are incorrect');
    }
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    process.exit(1);
  }
}

runTests();