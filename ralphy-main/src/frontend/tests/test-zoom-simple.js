// Simple test for zoom behavior without external dependencies

console.log('Testing GraphViewer zoom behavior...\n');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ ${message}`);
    testsPassed++;
  } else {
    console.error(`✗ ${message}`);
    testsFailed++;
  }
}

// Test 1: Check if GraphViewer is available
try {
  const scriptContent = require('fs').readFileSync('../graph-viewer.js', 'utf8');
  assert(scriptContent.includes('class GraphViewer'), 'GraphViewer class exists');
} catch (e) {
  assert(false, 'Could not load graph-viewer.js');
}

// Test 2: Check if setupZoomPan method exists
try {
  const scriptContent = require('fs').readFileSync('../graph-viewer.js', 'utf8');
  assert(scriptContent.includes('setupZoomPan(svg)'), 'setupZoomPan method exists');
} catch (e) {
  assert(false, 'setupZoomPan method not found');
}

// Test 3: Check zoom constraints are defined
try {
  const scriptContent = require('fs').readFileSync('../graph-viewer.js', 'utf8');
  assert(scriptContent.includes('const minScale = 0.1'), 'Min scale constraint is 0.1');
  assert(scriptContent.includes('const maxScale = 4'), 'Max scale constraint is 4');
} catch (e) {
  assert(false, 'Zoom constraints not properly defined');
}

// Test 4: Check wheel event listener
try {
  const scriptContent = require('fs').readFileSync('../graph-viewer.js', 'utf8');
  assert(scriptContent.includes("svg.addEventListener('wheel'"), 'Wheel event listener is set up');
  assert(scriptContent.includes('e.preventDefault()'), 'Wheel event prevents default behavior');
} catch (e) {
  assert(false, 'Wheel event listener not properly set up');
}

// Test 5: Check scale constraint logic
try {
  const scriptContent = require('fs').readFileSync('../graph-viewer.js', 'utf8');
  assert(scriptContent.includes('if (newScale >= minScale && newScale <= maxScale)'), 'Scale constraint check exists');
} catch (e) {
  assert(false, 'Scale constraint logic not found');
}

// Test 6: Check zoom delta calculation
try {
  const scriptContent = require('fs').readFileSync('../graph-viewer.js', 'utf8');
  assert(scriptContent.includes('const delta = e.deltaY > 0 ? 0.9 : 1.1'), 'Zoom delta calculation exists');
} catch (e) {
  assert(false, 'Zoom delta calculation not found');
}

// Test 7: Check updateTransform method
try {
  const scriptContent = require('fs').readFileSync('../graph-viewer.js', 'utf8');
  assert(scriptContent.includes('updateTransform(svg, scale, translateX, translateY)'), 'updateTransform method exists');
} catch (e) {
  assert(false, 'updateTransform method not found');
}

// Test 8: Check transform attribute setting
try {
  const scriptContent = require('fs').readFileSync('../graph-viewer.js', 'utf8');
  assert(scriptContent.includes("zoomGroup.setAttribute('transform'"), 'Transform attribute is set on zoom group');
  assert(scriptContent.includes('translate(${translateX}, ${translateY}) scale(${scale})'), 'Transform includes both translate and scale');
} catch (e) {
  assert(false, 'Transform attribute not properly set');
}

// Test 9: Check pan functionality
try {
  const scriptContent = require('fs').readFileSync('../graph-viewer.js', 'utf8');
  assert(scriptContent.includes("svg.addEventListener('mousedown'"), 'Mousedown event listener exists for panning');
  assert(scriptContent.includes("svg.addEventListener('mousemove'"), 'Mousemove event listener exists for panning');
  assert(scriptContent.includes("svg.addEventListener('mouseup'"), 'Mouseup event listener exists for panning');
} catch (e) {
  assert(false, 'Pan event listeners not found');
}

// Test 10: Check that setupZoomPan is called in renderGraph
try {
  const scriptContent = require('fs').readFileSync('../graph-viewer.js', 'utf8');
  assert(scriptContent.includes('this.setupZoomPan(svg)'), 'setupZoomPan is called in renderGraph');
} catch (e) {
  assert(false, 'setupZoomPan not called in renderGraph');
}

// Summary
console.log(`\n========================================`);
console.log(`Total tests: ${testsPassed + testsFailed}`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);
console.log(`========================================`);

if (testsFailed > 0) {
  process.exit(1);
}