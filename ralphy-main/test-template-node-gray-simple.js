#!/usr/bin/env node

/**
 * Test for verifying template nodes are styled as gray in graph visualization
 * ES module compatible version
 */

import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runTests() {
  const results = [];
  const graphViewerPath = join(__dirname, 'src/frontend/graph-viewer.js');
  
  try {
    const content = await readFile(graphViewerPath, 'utf8');
    
    // Test 1: Check getNodeColor method exists
    const hasMethod = content.includes('getNodeColor(type)');
    results.push({ 
      test: 'getNodeColor method exists', 
      passed: hasMethod
    });

    // Test 2: Verify template nodes return gray color
    const templateColorMatch = content.match(/case\s+'template':\s*return\s*'#9e9e9e'/);
    results.push({ 
      test: 'Template nodes return gray color (#9e9e9e)', 
      passed: !!templateColorMatch
    });

    // Test 3: Verify gray color comment
    const hasComment = content.includes("case 'template': return '#9e9e9e'; // gray");
    results.push({ 
      test: 'Template color has gray comment', 
      passed: hasComment
    });

    // Test 4: Verify getNodeColor is used in renderGraph
    const usesGetNodeColor = content.includes('this.getNodeColor(node.type)');
    results.push({ 
      test: 'renderGraph uses getNodeColor for node styling', 
      passed: usesGetNodeColor
    });

    // Test 5: Verify all node types have distinct colors
    const hasCommand = content.includes("case 'command': return '#2196f3'");
    const hasWorkflow = content.includes("case 'workflow': return '#4caf50'");
    const hasAgent = content.includes("case 'agent': return '#ff9800'");
    const hasTemplate = content.includes("case 'template': return '#9e9e9e'");
    
    const allDistinct = hasCommand && hasWorkflow && hasAgent && hasTemplate;
    results.push({ 
      test: 'All node types have distinct colors', 
      passed: allDistinct
    });

  } catch (error) {
    console.error('Error reading file:', error);
    return 1;
  }

  // Display results
  console.log('Template Node Gray Styling Test Results:');
  console.log('=====================================');
  
  let passedCount = 0;
  results.forEach(result => {
    if (result.passed) {
      console.log(`✓ ${result.test}`);
      passedCount++;
    } else {
      console.log(`✗ ${result.test}`);
    }
  });
  
  console.log(`\nTotal: ${passedCount}/${results.length} tests passed`);
  
  // Return exit code
  return passedCount === results.length ? 0 : 1;
}

// Run tests
runTests().then(exitCode => {
  process.exit(exitCode);
}).catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});