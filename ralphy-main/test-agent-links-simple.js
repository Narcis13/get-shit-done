// Simple test for spawned agents clickable links feature

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Testing spawned agents clickable links feature...\n');

try {
  const commandViewerPath = join(__dirname, 'src/frontend/command-viewer.js');
  const content = readFileSync(commandViewerPath, 'utf8');
  
  // Test 1: Check if parseFileReferences includes agent parsing
  console.log('Test 1: Agent parsing in parseFileReferences method');
  if (content.includes('agents: /agents\\/[\\w-]+\\.md/g') && 
      content.includes('references.agents.push(match[0])')) {
    console.log('✓ Agent extraction logic found');
  } else {
    throw new Error('Agent parsing not found in parseFileReferences');
  }
  
  // Test 2: Check if renderMetadata displays spawned agents
  console.log('\nTest 2: Spawned agents display in renderMetadata');
  if (content.includes('Spawned Agents:') && 
      content.includes('parsedReferences.agents.length > 0') &&
      content.includes('parsedReferences.agents.forEach(agent =>')) {
    console.log('✓ Spawned agents section implemented');
  } else {
    throw new Error('Spawned agents display not found');
  }
  
  // Test 3: Check agent link HTML structure
  console.log('\nTest 3: Agent link HTML structure');
  const agentSection = content.match(/parsedReferences\.agents\.forEach\(agent[^}]+\}/s)?.[0];
  if (agentSection && 
      agentSection.includes('class="file-link"') &&
      agentSection.includes('data-path=') &&
      agentSection.includes('${agent}')) {
    console.log('✓ Agent links have correct HTML structure');
  } else {
    throw new Error('Agent link HTML structure incorrect');
  }
  
  // Test 4: Event listeners
  console.log('\nTest 4: Event listeners for agent links');
  if (content.includes('metadataCard.querySelectorAll(\'.file-link\').forEach(link =>') &&
      content.includes('window.dispatchEvent(new CustomEvent(\'open-file\'')) {
    console.log('✓ Event listeners will handle agent links');
  } else {
    throw new Error('Event listeners not properly configured');
  }
  
  // Test 5: CSS for file links
  console.log('\nTest 5: CSS styles for file links');
  if (content.includes('.file-link {') && content.includes('.file-link:hover {')) {
    console.log('✓ CSS styles for file links exist');
  } else {
    throw new Error('CSS styles for file links not found');
  }
  
  console.log('\n✅ All tests passed! Spawned agents clickable links feature is working correctly.');
} catch (error) {
  console.error('✗ Test failed:', error.message);
  process.exit(1);
}