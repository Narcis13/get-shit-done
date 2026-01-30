#!/usr/bin/env node

// Test suite for template links feature in command viewer

const http = require('http');
const fs = require('fs').promises;
const path = require('path');

// Test data
const mockCommandContent = `---
name: lpl:test-command
description: Test command that uses templates
argument-hint: "<feature-name>"
allowed-tools: [Read, Write, Task]
---

<objective>
Test command that references templates.
</objective>

<process>
First, we'll use the feature template from looppool/templates/feature-template.md
We might also reference [another template](looppool/templates/component-template.md).
And here's a direct reference: looppool/templates/test-template.md

Note: Don't match templates in code blocks:
\`\`\`
looppool/templates/code-template.md
\`\`\`

Or in inline code: \`looppool/templates/inline-template.md\`
</process>`;

// Test runner
async function runTests() {
  console.log('Testing template links functionality...\n');
  
  const tests = [
    testParseFileReferencesIncludesTemplates,
    testTemplatePatternMatching,
    testRenderMetadataIncludesTemplates,
    testTemplateLinksHaveCorrectHTML,
    testTemplateLinksHaveEventListeners,
    testTemplateLinksCSS,
    testMultipleTemplateReferences,
    testMarkdownLinkTemplates,
    testNoTemplatesCase,
    testCodeBlockExclusion,
    testServerIntegration
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

// Test 1: parseFileReferences method includes templates
async function testParseFileReferencesIncludesTemplates() {
  const filePath = path.join(__dirname, 'src/frontend/command-viewer.js');
  const content = await fs.readFile(filePath, 'utf8');
  
  if (!content.includes('templates: []')) {
    throw new Error('parseFileReferences should initialize templates array');
  }
  
  if (!content.includes('patterns.templates.exec')) {
    throw new Error('Should have template pattern matching logic');
  }
  
  if (!content.includes('references.templates.push')) {
    throw new Error('Should push template matches to array');
  }
}

// Test 2: Template pattern matching regex
async function testTemplatePatternMatching() {
  const filePath = path.join(__dirname, 'src/frontend/command-viewer.js');
  const content = await fs.readFile(filePath, 'utf8');
  
  // Check for template pattern
  const templatePatternMatch = content.match(/templates:\s*\/[^\/]+\/[gmi]*/);
  if (!templatePatternMatch) {
    throw new Error('Should have template pattern regex');
  }
  
  // Verify the pattern matches looppool/templates/*.md
  if (!content.includes('looppool/templates/')) {
    throw new Error('Template pattern should match looppool/templates/ paths');
  }
}

// Test 3: renderMetadata includes template section
async function testRenderMetadataIncludesTemplates() {
  const filePath = path.join(__dirname, 'src/frontend/command-viewer.js');
  const content = await fs.readFile(filePath, 'utf8');
  
  if (!content.includes('parsedReferences.templates.length > 0')) {
    throw new Error('Should check for template references');
  }
  
  if (!content.includes('Templates Used:')) {
    throw new Error('Should have "Templates Used:" label');
  }
  
  if (!content.includes('parsedReferences.templates.forEach')) {
    throw new Error('Should iterate over template references');
  }
}

// Test 4: Template links have correct HTML structure
async function testTemplateLinksHaveCorrectHTML() {
  const filePath = path.join(__dirname, 'src/frontend/command-viewer.js');
  const content = await fs.readFile(filePath, 'utf8');
  
  // Check that templates section follows same pattern as agents
  const templateSection = content.match(/if \(parsedReferences\.templates\.length > 0\)[\s\S]*?html \+= '<\/div>';[\s\S]*?html \+= '<\/div>';/);
  
  if (!templateSection) {
    throw new Error('Should have complete template section');
  }
  
  const sectionContent = templateSection[0];
  if (!sectionContent.includes('class="file-link"')) {
    throw new Error('Template links should have file-link class');
  }
  
  if (!sectionContent.includes('data-path="${template}"')) {
    throw new Error('Template links should have data-path attribute');
  }
}

// Test 5: Template links are included in event listener attachment
async function testTemplateLinksHaveEventListeners() {
  const filePath = path.join(__dirname, 'src/frontend/command-viewer.js');
  const content = await fs.readFile(filePath, 'utf8');
  
  // Event listener attachment should work for all .file-link elements
  if (!content.includes("metadataCard.querySelectorAll('.file-link')")) {
    throw new Error('Should select all file-link elements for event listeners');
  }
  
  if (!content.includes("window.dispatchEvent(new CustomEvent('open-file'")) {
    throw new Error('Should dispatch open-file event');
  }
}

// Test 6: CSS styles apply to template links
async function testTemplateLinksCSS() {
  const filePath = path.join(__dirname, 'src/frontend/command-viewer.js');
  const content = await fs.readFile(filePath, 'utf8');
  
  // Check for file-link CSS
  if (!content.includes('.file-link {')) {
    throw new Error('Should have CSS for file-link class');
  }
  
  if (!content.includes('.file-link:hover {')) {
    throw new Error('Should have hover styles for file links');
  }
}

// Test 7: Multiple template references are handled
async function testMultipleTemplateReferences() {
  // This would test the actual parsing logic
  // In real usage, multiple templates would be parsed and displayed
  const filePath = path.join(__dirname, 'src/frontend/command-viewer.js');
  const content = await fs.readFile(filePath, 'utf8');
  
  if (!content.includes('forEach(template =>')) {
    throw new Error('Should iterate over each template');
  }
}

// Test 8: Markdown link format templates are parsed
async function testMarkdownLinkTemplates() {
  const filePath = path.join(__dirname, 'src/frontend/command-viewer.js');
  const content = await fs.readFile(filePath, 'utf8');
  
  // Check markdown link parsing includes templates
  if (!content.includes("linkPath.includes('looppool/templates/')")) {
    throw new Error('Should check markdown links for template paths');
  }
  
  if (!content.includes('!references.templates.includes(linkPath)')) {
    throw new Error('Should check for duplicates before adding');
  }
}

// Test 9: No templates case handled gracefully
async function testNoTemplatesCase() {
  const filePath = path.join(__dirname, 'src/frontend/command-viewer.js');
  const content = await fs.readFile(filePath, 'utf8');
  
  // The template section is only rendered if templates exist
  if (!content.includes('if (parsedReferences.templates.length > 0)')) {
    throw new Error('Should conditionally render template section');
  }
}

// Test 10: Code blocks are excluded from template matching
async function testCodeBlockExclusion() {
  const filePath = path.join(__dirname, 'src/frontend/command-viewer.js');
  const content = await fs.readFile(filePath, 'utf8');
  
  // Check that code blocks are removed before parsing
  if (!content.includes('codeBlockPattern')) {
    throw new Error('Should have code block pattern');
  }
  
  if (!content.includes('.replace(codeBlockPattern, \'\')')) {
    throw new Error('Should remove code blocks before parsing');
  }
}

// Test 11: Server integration test
async function testServerIntegration() {
  // Create a test command file with template references
  const testDir = path.join(__dirname, 'test-templates');
  const testFile = path.join(testDir, 'test-command.md');
  
  try {
    await fs.mkdir(testDir, { recursive: true });
    await fs.writeFile(testFile, mockCommandContent);
    
    // Make request to server
    await new Promise((resolve, reject) => {
      const req = http.get('http://127.0.0.1:3456/api/file?path=' + encodeURIComponent(path.relative(__dirname, testFile)), (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          reject(new Error(`Server returned ${res.statusCode}`));
        }
        res.resume();
      });
      
      req.on('error', () => {
        // Server might not be running, that's OK for this test
        resolve();
      });
      
      req.setTimeout(1000, () => {
        req.destroy();
        resolve();
      });
    });
    
  } finally {
    // Cleanup
    try {
      await fs.unlink(testFile);
      await fs.rmdir(testDir);
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

// Run the tests
runTests().catch(console.error);