#!/usr/bin/env node

import http from 'http';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('Testing command viewer tabbed view...\n');

// Test 1: Check if CommandViewer creates tab structure
console.log('Test 1: Checking tab structure creation...');
try {
  const commandViewerPath = path.join(__dirname, 'src/frontend/command-viewer.js');
  const content = await fs.readFile(commandViewerPath, 'utf-8');
  
  // Check for tab HTML structure
  const hasTabStructure = content.includes('command-tabs') && 
                         content.includes('data-tab="metadata"') &&
                         content.includes('data-tab="raw"');
  
  if (hasTabStructure) {
    console.log('✓ Tab structure HTML is present');
  } else {
    console.log('✗ Tab structure HTML is missing');
  }
} catch (error) {
  console.error('✗ Failed to read command-viewer.js:', error.message);
}

// Test 2: Check for tab switching functionality
console.log('\nTest 2: Checking tab switching functionality...');
try {
  const commandViewerPath = path.join(__dirname, 'src/frontend/command-viewer.js');
  const content = await fs.readFile(commandViewerPath, 'utf-8');
  
  // Check for switchTab method
  const hasSwitchTab = content.includes('switchTab(tabName)');
  
  // Check for event listeners
  const hasTabListeners = content.includes("'.command-tab').forEach") &&
                         content.includes("addEventListener('click'");
  
  if (hasSwitchTab && hasTabListeners) {
    console.log('✓ Tab switching functionality is implemented');
  } else {
    console.log('✗ Tab switching functionality is missing');
  }
} catch (error) {
  console.error('✗ Failed to check tab switching:', error.message);
}

// Test 3: Check for panel visibility toggling
console.log('\nTest 3: Checking panel visibility toggling...');
try {
  const commandViewerPath = path.join(__dirname, 'src/frontend/command-viewer.js');
  const content = await fs.readFile(commandViewerPath, 'utf-8');
  
  // Check for panel toggling logic
  const hasPanelToggle = content.includes("'.command-panel').forEach") &&
                        content.includes("classList.toggle('active'");
  
  if (hasPanelToggle) {
    console.log('✓ Panel visibility toggling is implemented');
  } else {
    console.log('✗ Panel visibility toggling is missing');
  }
} catch (error) {
  console.error('✗ Failed to check panel toggling:', error.message);
}

// Test 4: Check CSS for tab styling
console.log('\nTest 4: Checking CSS for tab styling...');
try {
  const commandViewerPath = path.join(__dirname, 'src/frontend/command-viewer.js');
  const content = await fs.readFile(commandViewerPath, 'utf-8');
  
  // Check for tab CSS classes
  const hasTabCSS = content.includes('.command-tab {') &&
                   content.includes('.command-tab.active {') &&
                   content.includes('.command-panel {') &&
                   content.includes('.command-panel.active {');
  
  if (hasTabCSS) {
    console.log('✓ Tab CSS styling is present');
  } else {
    console.log('✗ Tab CSS styling is missing');
  }
} catch (error) {
  console.error('✗ Failed to check tab CSS:', error.message);
}

// Test 5: Check for both metadata and raw content panels
console.log('\nTest 5: Checking for both panels...');
try {
  const commandViewerPath = path.join(__dirname, 'src/frontend/command-viewer.js');
  const content = await fs.readFile(commandViewerPath, 'utf-8');
  
  // Check for both panels
  const hasMetadataPanel = content.includes('metadata-panel') &&
                          content.includes('data-panel="metadata"');
  const hasRawPanel = content.includes('raw-panel') &&
                     content.includes('data-panel="raw"') &&
                     content.includes('raw-content');
  
  if (hasMetadataPanel && hasRawPanel) {
    console.log('✓ Both metadata and raw content panels are present');
  } else {
    console.log('✗ One or both panels are missing');
  }
} catch (error) {
  console.error('✗ Failed to check panels:', error.message);
}

// Test 6: Check for raw content population
console.log('\nTest 6: Checking raw content population...');
try {
  const commandViewerPath = path.join(__dirname, 'src/frontend/command-viewer.js');
  const content = await fs.readFile(commandViewerPath, 'utf-8');
  
  // Check for raw content update in loadCommand
  const updatesRawContent = content.includes("'.raw-content').textContent = content");
  
  if (updatesRawContent) {
    console.log('✓ Raw content is populated when loading a command');
  } else {
    console.log('✗ Raw content population is missing');
  }
} catch (error) {
  console.error('✗ Failed to check raw content population:', error.message);
}

console.log('\n✅ Tabbed view tests completed!');