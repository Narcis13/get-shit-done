class GraphViewer {
  constructor(container) {
    this.container = container;
    this.nodes = [];
    this.edges = [];
    this.nodeMap = new Map();
    this.setupHTML();
  }

  setupHTML() {
    this.container.innerHTML = `
      <div class="graph-viewer">
        <div class="graph-header">
          <h2>System Graph</h2>
          <div class="graph-filters">
            <label><input type="checkbox" class="filter-commands" checked> Commands</label>
            <label><input type="checkbox" class="filter-workflows" checked> Workflows</label>
            <label><input type="checkbox" class="filter-agents" checked> Agents</label>
            <label><input type="checkbox" class="filter-templates" checked> Templates</label>
          </div>
          <input type="text" class="graph-search" placeholder="Search nodes...">
        </div>
        <div class="graph-canvas"></div>
      </div>
    `;

    this.canvas = this.container.querySelector('.graph-canvas');
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Filter checkboxes
    const filterCheckboxes = this.container.querySelectorAll('[type="checkbox"]');
    filterCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => this.updateFilters());
    });

    // Search input
    const searchInput = this.container.querySelector('.graph-search');
    searchInput.addEventListener('input', (e) => this.searchNodes(e.target.value));
  }

  // Parse graph data from file relationships
  async parseGraphData() {
    this.nodes = [];
    this.edges = [];
    this.nodeMap.clear();

    try {
      // Fetch file tree
      const response = await fetch('/api/tree');
      const tree = await response.json();
      
      // Extract command, workflow, agent, and template files
      const files = this.extractFiles(tree);
      
      // Parse relationships from each file
      for (const file of files) {
        await this.parseFileRelationships(file);
      }
      
      return { nodes: this.nodes, edges: this.edges };
    } catch (error) {
      console.error('Error parsing graph data:', error);
      return { nodes: [], edges: [] };
    }
  }

  extractFiles(node, path = '', files = []) {
    if (node.type === 'file') {
      const fullPath = path ? `${path}/${node.name}` : node.name;
      
      // Check if it's a relevant file type
      if (fullPath.startsWith('commands/') && fullPath.endsWith('.md')) {
        files.push({ path: fullPath, type: 'command' });
      } else if (fullPath.startsWith('looppool/workflows/') && fullPath.endsWith('.md')) {
        files.push({ path: fullPath, type: 'workflow' });
      } else if (fullPath.startsWith('agents/') && fullPath.endsWith('.md')) {
        files.push({ path: fullPath, type: 'agent' });
      } else if (fullPath.startsWith('looppool/templates/') && fullPath.endsWith('.md')) {
        files.push({ path: fullPath, type: 'template' });
      }
    } else if (node.children) {
      const currentPath = path ? `${path}/${node.name}` : node.name;
      for (const child of node.children) {
        this.extractFiles(child, currentPath, files);
      }
    }
    
    return files;
  }

  async parseFileRelationships(file) {
    try {
      // Fetch file content
      const response = await fetch(`/api/file?path=${encodeURIComponent(file.path)}`);
      const content = await response.text();
      
      // Add node for this file
      const nodeId = file.path;
      const nodeName = file.path.split('/').pop().replace('.md', '');
      
      if (!this.nodeMap.has(nodeId)) {
        const node = {
          id: nodeId,
          name: nodeName,
          type: file.type,
          path: file.path
        };
        this.nodes.push(node);
        this.nodeMap.set(nodeId, node);
      }
      
      // Parse relationships based on file type
      if (file.type === 'command') {
        this.parseCommandRelationships(nodeId, content);
      } else if (file.type === 'workflow') {
        this.parseWorkflowRelationships(nodeId, content);
      } else if (file.type === 'agent') {
        this.parseAgentRelationships(nodeId, content);
      }
      
    } catch (error) {
      console.error(`Error parsing file ${file.path}:`, error);
    }
  }

  parseCommandRelationships(commandId, content) {
    // Extract workflow references from command files
    // Pattern: references to workflows/*.md files
    const workflowPattern = /looppool\/workflows\/[\w-]+\.md/g;
    const matches = content.match(workflowPattern) || [];
    
    for (const match of matches) {
      // Filter out matches that appear in code blocks
      const beforeMatch = content.substring(0, content.indexOf(match));
      const codeBlockCount = (beforeMatch.match(/```/g) || []).length;
      if (codeBlockCount % 2 === 0) { // Not in a code block
        this.addRelationship(commandId, match, 'delegates-to');
      }
    }
  }

  parseWorkflowRelationships(workflowId, content) {
    // Extract agent references from workflow files
    const agentPattern = /agents\/[\w-]+\.md/g;
    const matches = content.match(agentPattern) || [];
    
    for (const match of matches) {
      // Filter out matches that appear in code blocks
      const beforeMatch = content.substring(0, content.indexOf(match));
      const codeBlockCount = (beforeMatch.match(/```/g) || []).length;
      if (codeBlockCount % 2 === 0) { // Not in a code block
        this.addRelationship(workflowId, match, 'spawns');
      }
    }
  }

  parseAgentRelationships(agentId, content) {
    // Extract template references from agent files
    const templatePattern = /looppool\/templates\/[\w-]+\.md/g;
    const matches = content.match(templatePattern) || [];
    
    for (const match of matches) {
      // Filter out matches that appear in code blocks
      const beforeMatch = content.substring(0, content.indexOf(match));
      const codeBlockCount = (beforeMatch.match(/```/g) || []).length;
      if (codeBlockCount % 2 === 0) { // Not in a code block
        this.addRelationship(agentId, match, 'uses');
      }
    }
  }

  addRelationship(sourceId, targetPath, relationshipType) {
    // Ensure target node exists
    if (!this.nodeMap.has(targetPath)) {
      // Determine type from path
      let type = 'unknown';
      if (targetPath.startsWith('looppool/workflows/')) type = 'workflow';
      else if (targetPath.startsWith('agents/')) type = 'agent';
      else if (targetPath.startsWith('looppool/templates/')) type = 'template';
      
      const nodeName = targetPath.split('/').pop().replace('.md', '');
      const node = {
        id: targetPath,
        name: nodeName,
        type: type,
        path: targetPath
      };
      this.nodes.push(node);
      this.nodeMap.set(targetPath, node);
    }
    
    // Add edge
    this.edges.push({
      source: sourceId,
      target: targetPath,
      type: relationshipType
    });
  }

  updateFilters() {
    // Implementation for filter updates
    console.log('Filters updated');
  }

  searchNodes(query) {
    // Implementation for node search
    console.log('Searching for:', query);
  }

  async loadGraph() {
    const graphData = await this.parseGraphData();
    console.log('Graph data parsed:', graphData);
    // TODO: Render graph with d3 or other visualization library
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GraphViewer;
}