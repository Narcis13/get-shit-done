#!/usr/bin/env node

import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test runner
async function runTests() {
  console.log('Testing template links functionality...\n');
  
  const tests = [
    testTemplateReferencesParsing,
    testTemplateRenderingLogic,
    testTemplateHTMLStructure,
    testTemplateEventHandling,
    testTemplateStyling
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      await test();
      console.log(`✓ ${test.name}`);
      passed++;
    } catch (error) {
      console.log(`✗ ${test.name}: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\nTests: ${passed} passed, ${failed} failed, ${tests.length} total`);
  process.exit(failed > 0 ? 1 : 0);
}

// Test 1: Template references are parsed in parseFileReferences
async function testTemplateReferencesParsing() {
  const filePath = join(__dirname, 'src/frontend/command-viewer.js');
  const content = await readFile(filePath, 'utf8');
  
  // Check that templates array is initialized
  if (!content.includes('templates: []')) {
    throw new Error('parseFileReferences should initialize templates array');
  }
  
  // Check for template pattern regex
  if (!content.includes('templates: /looppool\\/templates\\/[\\w-]+\\.md/g')) {
    throw new Error('Should have template pattern regex');
  }
  
  // Check template matching logic
  if (!content.includes('patterns.templates.exec')) {
    throw new Error('Should have template pattern execution');
  }
  
  // Check templates are added to results
  if (!content.includes('references.templates.push')) {
    throw new Error('Should push template matches to results');
  }
}

// Test 2: Template rendering logic in renderMetadata
async function testTemplateRenderingLogic() {
  const filePath = join(__dirname, 'src/frontend/command-viewer.js');
  const content = await readFile(filePath, 'utf8');
  
  // Check for template section conditional
  if (!content.includes('if (parsedReferences.templates.length > 0)')) {
    throw new Error('Should conditionally render template section');
  }
  
  // Check for Templates Used label
  if (!content.includes('Templates Used:')) {
    throw new Error('Should have "Templates Used:" label');
  }
  
  // Check forEach iteration
  if (!content.includes('parsedReferences.templates.forEach(template =>')) {
    throw new Error('Should iterate over template references');
  }
}

// Test 3: Template HTML structure matches other file links
async function testTemplateHTMLStructure() {
  const filePath = join(__dirname, 'src/frontend/command-viewer.js');
  const content = await readFile(filePath, 'utf8');
  
  // Find the template rendering section
  const templateSection = content.match(/Templates Used:[\s\S]*?parsedReferences\.templates\.forEach[\s\S]*?\}\);/);
  
  if (!templateSection) {
    throw new Error('Could not find template rendering section');
  }
  
  const sectionContent = templateSection[0];
  
  // Check for correct HTML structure
  if (!sectionContent.includes('class="file-link"')) {
    throw new Error('Template links should have file-link class');
  }
  
  if (!sectionContent.includes('data-path="${template}"')) {
    throw new Error('Template links should have data-path attribute');
  }
  
  if (!sectionContent.includes('>${template}</a>')) {
    throw new Error('Template links should display the template path');
  }
}

// Test 4: Event handling for template links
async function testTemplateEventHandling() {
  const filePath = join(__dirname, 'src/frontend/command-viewer.js');
  const content = await readFile(filePath, 'utf8');
  
  // Check that event listeners are attached to all file links
  if (!content.includes("metadataCard.querySelectorAll('.file-link')")) {
    throw new Error('Should select all file-link elements');
  }
  
  // Check that open-file event is dispatched
  if (!content.includes("window.dispatchEvent(new CustomEvent('open-file'")) {
    throw new Error('Should dispatch open-file event for file links');
  }
  
  // Verify event includes file path
  if (!content.includes('detail: { path: filePath }')) {
    throw new Error('Event should include file path in detail');
  }
}

// Test 5: Styling for template links
async function testTemplateStyling() {
  const filePath = join(__dirname, 'src/frontend/command-viewer.js');
  const content = await readFile(filePath, 'utf8');
  
  // Check for file-link CSS rules
  if (!content.includes('.file-link {')) {
    throw new Error('Should have CSS rules for file-link class');
  }
  
  // Check for hover styles
  if (!content.includes('.file-link:hover {')) {
    throw new Error('Should have hover styles for file links');
  }
  
  // Verify specific styles
  if (!content.includes('color: #2196f3')) {
    throw new Error('File links should have blue color');
  }
  
  if (!content.includes('font-family: monospace')) {
    throw new Error('File links should use monospace font');
  }
}

// Run the tests
runTests().catch(console.error);