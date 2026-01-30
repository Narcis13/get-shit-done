import { GraphViewer } from '../graph-viewer.js';

// Mock DOM elements
const mockSvgElement = () => ({
  addEventListener: jest.fn(),
  querySelector: jest.fn(() => ({
    parentElement: {
      classList: { contains: jest.fn(() => false) }
    }
  })),
  style: {},
  setAttribute: jest.fn(),
  createElementNS: jest.fn(),
  appendChild: jest.fn()
});

// Test suite for zoom behavior
describe('GraphViewer zoom behavior', () => {
  let graphViewer;
  let mockContainer;
  let mockSvg;

  beforeEach(() => {
    // Create mock container
    mockContainer = document.createElement('div');
    mockContainer.id = 'graph-container';
    document.body.appendChild(mockContainer);
    
    // Mock canvas element
    const mockCanvas = document.createElement('div');
    mockCanvas.className = 'graph-canvas';
    mockContainer.appendChild(mockCanvas);
    
    graphViewer = new GraphViewer(mockContainer);
    mockSvg = mockSvgElement();
  });

  afterEach(() => {
    document.body.removeChild(mockContainer);
  });

  test('setupZoomPan method exists', () => {
    expect(typeof graphViewer.setupZoomPan).toBe('function');
  });

  test('zoom constraints are correctly set', () => {
    graphViewer.setupZoomPan(mockSvg);
    
    // Check that wheel event listener was added
    expect(mockSvg.addEventListener).toHaveBeenCalledWith('wheel', expect.any(Function));
  });

  test('zoom scale limits are min=0.1 and max=4', () => {
    // Create a more realistic mock SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    nodesGroup.setAttribute('class', 'nodes');
    const parentGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    parentGroup.appendChild(nodesGroup);
    svg.appendChild(parentGroup);
    
    let wheelHandler;
    svg.addEventListener = jest.fn((event, handler) => {
      if (event === 'wheel') wheelHandler = handler;
    });
    
    // Setup zoom
    graphViewer.setupZoomPan(svg);
    
    // Verify wheel handler was added
    expect(svg.addEventListener).toHaveBeenCalledWith('wheel', expect.any(Function));
    expect(wheelHandler).toBeDefined();
    
    // Test zoom limits by simulating wheel events
    const mockWheelEvent = (deltaY) => ({
      preventDefault: jest.fn(),
      deltaY
    });
    
    // Initial scale is 1
    let currentScale = 1;
    
    // Mock updateTransform to track scale changes
    graphViewer.updateTransform = jest.fn((svg, scale) => {
      currentScale = scale;
    });
    
    // Try to zoom out beyond min limit (0.1)
    for (let i = 0; i < 20; i++) {
      wheelHandler(mockWheelEvent(100)); // Zoom out
    }
    
    // Should not go below 0.1
    expect(currentScale).toBeGreaterThanOrEqual(0.1);
    
    // Reset scale
    currentScale = 1;
    
    // Try to zoom in beyond max limit (4)
    for (let i = 0; i < 20; i++) {
      wheelHandler(mockWheelEvent(-100)); // Zoom in
    }
    
    // Should not go above 4
    expect(currentScale).toBeLessThanOrEqual(4);
  });

  test('updateTransform method exists', () => {
    expect(typeof graphViewer.updateTransform).toBe('function');
  });

  test('pan functionality is set up', () => {
    graphViewer.setupZoomPan(mockSvg);
    
    // Check that mousedown, mousemove, and mouseup listeners were added
    expect(mockSvg.addEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
    expect(mockSvg.addEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(mockSvg.addEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
  });

  test('zoom calculation uses correct delta values', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    let wheelHandler;
    svg.addEventListener = jest.fn((event, handler) => {
      if (event === 'wheel') wheelHandler = handler;
    });
    
    graphViewer.setupZoomPan(svg);
    
    let capturedScale = 1;
    graphViewer.updateTransform = jest.fn((svg, scale) => {
      capturedScale = scale;
    });
    
    // Test zoom in (negative deltaY)
    wheelHandler({ preventDefault: jest.fn(), deltaY: -100 });
    expect(capturedScale).toBeCloseTo(1.1, 2);
    
    // Test zoom out (positive deltaY)
    capturedScale = 1;
    wheelHandler({ preventDefault: jest.fn(), deltaY: 100 });
    expect(capturedScale).toBeCloseTo(0.9, 2);
  });
});