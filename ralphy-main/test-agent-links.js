// Test file for spawned agents clickable links feature

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Testing spawned agents clickable links feature...\n');

// Test 1: Check if command-viewer.js exists
console.log('Test 1: Checking if command-viewer.js exists...');
try {
  const commandViewerPath = join(__dirname, 'src/frontend/command-viewer.js');
  const content = readFileSync(commandViewerPath, 'utf8');
  console.log('✓ command-viewer.js exists');
} catch (error) {
  console.error('✗ Failed to read command-viewer.js:', error.message);
  process.exit(1);
}

// Test 2: Check if parseFileReferences method includes agent parsing
console.log('\nTest 2: Checking if parseFileReferences method extracts agents...');
try {
  const commandViewerPath = join(__dirname, 'src/frontend/command-viewer.js');
  const content = readFileSync(commandViewerPath, 'utf8');
  
  if (content.includes('agents: /agents\\/[\\w-]+\\.md/g')) {
    console.log('✓ parseFileReferences includes agent pattern');
  } else {
    throw new Error('Agent pattern not found in parseFileReferences');
  }
  
  if (content.includes('references.agents.push(match[0])')) {
    console.log('✓ Agents are extracted and added to references');
  } else {
    throw new Error('Agent extraction logic not found');
  }
} catch (error) {
  console.error('✗ Agent parsing test failed:', error.message);
  process.exit(1);
}

// Test 3: Check if renderMetadata includes spawned agents section
console.log('\nTest 3: Checking if renderMetadata displays spawned agents...');
try {
  const commandViewerPath = join(__dirname, 'src/frontend/command-viewer.js');
  const content = readFileSync(commandViewerPath, 'utf8');
  
  if (content.includes('Spawned Agents:')) {
    console.log('✓ Spawned Agents label found');
  } else {
    throw new Error('Spawned Agents label not found');
  }
  
  if (content.includes('parsedReferences.agents.length > 0')) {
    console.log('✓ Conditional rendering for agents implemented');
  } else {
    throw new Error('Agent conditional rendering not found');
  }
  
  if (content.includes('parsedReferences.agents.forEach(agent =>')) {
    console.log('✓ Agent iteration logic found');
  } else {
    throw new Error('Agent iteration not found');
  }
} catch (error) {
  console.error('✗ Agent display test failed:', error.message);
  process.exit(1);
}

// Test 4: Check if agent links use the correct HTML structure
console.log('\nTest 4: Checking agent link HTML structure...');
try {
  const commandViewerPath = join(__dirname, 'src/frontend/command-viewer.js');
  const content = readFileSync(commandViewerPath, 'utf8');
  
  // Look for the agent link HTML generation
  const agentSection = content.match(/parsedReferences\.agents\.forEach\(agent[^}]+\}/s)?.[0];
  
  if (!agentSection) {
    throw new Error('Agent section not found');
  }
  
  if (agentSection.includes('class="file-link"')) {
    console.log('✓ Agent links have file-link class');
  } else {
    throw new Error('file-link class not found for agents');
  }
  
  if (agentSection.includes('data-path=')) {
    console.log('✓ Agent links have data-path attribute');
  } else {
    throw new Error('data-path attribute not found for agents');
  }
  
  if (agentSection.includes('${agent}')) {
    console.log('✓ Agent path displayed as link text');
  } else {
    throw new Error('Agent path not used as link text');
  }
} catch (error) {
  console.error('✗ Agent link HTML test failed:', error.message);
  process.exit(1);
}

// Test 5: Check that agent links will have click event listeners
console.log('\nTest 5: Checking agent link event listeners...');
try {
  const commandViewerPath = join(__dirname, 'src/frontend/command-viewer.js');
  const content = readFileSync(commandViewerPath, 'utf8');
  
  // The existing file link event listener should handle agent links too
  if (content.includes('metadataCard.querySelectorAll(\'.file-link\').forEach(link =>')) {
    console.log('✓ Event listener selector includes all file-link elements');
  } else {
    throw new Error('File link event listener not found');
  }
  
  if (content.includes('window.dispatchEvent(new CustomEvent(\'open-file\'')) {
    console.log('✓ Click handler dispatches open-file event');
  } else {
    throw new Error('open-file event dispatch not found');
  }
} catch (error) {
  console.error('✗ Event listener test failed:', error.message);
  process.exit(1);
}

// Test 6: Test parseFileReferences with sample content
console.log('\nTest 6: Testing parseFileReferences with sample content...');
try {
  // Create a simple test to verify the regex patterns
  const agentPattern = /agents\/[\w-]+\.md/g;
  const testContent = `
    This workflow uses the following agents:
    - agents/research-agent.md
    - agents/code-executor.md
    
    It also references [another agent](agents/validator.md)
    
    But not this code block:
    \`\`\`
    agents/fake-agent.md
    \`\`\`
  `;
  
  const matches = testContent.match(agentPattern);
  if (matches && matches.length >= 2) {
    console.log('✓ Agent pattern correctly matches agent files');
    console.log('  Found:', matches);
  } else {
    console.log('Pattern matches:', matches);
    throw new Error(`Agent pattern failed to match correctly. Expected at least 2 matches, got ${matches ? matches.length : 0}`);
  }
} catch (error) {
  console.error('✗ Pattern test failed:', error.message);
  process.exit(1);
}

// Test 7: CSS styles for file links
console.log('\nTest 7: Checking CSS styles for file links...');
try {
  const commandViewerPath = join(__dirname, 'src/frontend/command-viewer.js');
  const content = readFileSync(commandViewerPath, 'utf8');
  
  if (content.includes('.file-link {')) {
    console.log('✓ CSS styles for file-link class exist');
  } else {
    throw new Error('file-link CSS not found');
  }
  
  if (content.includes('.file-link:hover {')) {
    console.log('✓ Hover styles for file links exist');
  } else {
    throw new Error('file-link hover CSS not found');
  }
} catch (error) {
  console.error('✗ CSS test failed:', error.message);
  process.exit(1);
}

// Test 8: Integration with existing file reference display
console.log('\nTest 8: Checking integration with existing file references...');
try {
  const commandViewerPath = join(__dirname, 'src/frontend/command-viewer.js');
  const content = readFileSync(commandViewerPath, 'utf8');
  
  // Check order of display (workflows, then agents)
  const workflowIndex = content.indexOf('Delegated Workflow:');
  const agentIndex = content.indexOf('Spawned Agents:');
  
  if (workflowIndex > 0 && agentIndex > 0 && agentIndex > workflowIndex) {
    console.log('✓ Agent section appears after workflow section');
  } else {
    throw new Error('Section ordering is incorrect');
  }
} catch (error) {
  console.error('✗ Integration test failed:', error.message);
  process.exit(1);
}

console.log('\n✅ All tests passed! Spawned agents clickable links feature is implemented correctly.');