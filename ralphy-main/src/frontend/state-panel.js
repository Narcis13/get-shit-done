class StatePanel {
  constructor(container) {
    this.container = container;
    this.refreshInterval = null;
    this.eventSource = null;
    this.projectData = null;
    this.roadmapData = null;
    this.planData = null;
    this.init();
  }

  init() {
    this.container.className = 'state-panel';
    this.render();
    this.startAutoRefresh();
    this.setupSSE();
  }

  render() {
    this.container.innerHTML = `
      <div class="state-panel-header">
        <h2>Project State</h2>
        <button class="refresh-btn" id="refresh-btn">⟳ Refresh</button>
      </div>
      <div class="state-panel-content">
        <div class="state-loading">Loading state...</div>
      </div>
    `;
    
    document.getElementById('refresh-btn').addEventListener('click', () => this.loadState());
  }

  async loadState() {
    try {
      const response = await fetch('/api/state');
      const data = await response.json();
      
      if (data.error) {
        this.renderError(data.error);
      } else {
        this.renderState(data.content);
      }
    } catch (error) {
      this.renderError(`Failed to load state: ${error.message}`);
    }
  }

  async renderState(content) {
    const contentDiv = this.container.querySelector('.state-panel-content');
    
    if (!content || content.trim() === '') {
      contentDiv.innerHTML = `
        <div class="empty-state">
          <h3>No current state file found</h3>
          <p>The planning state will appear here once a project is initialized.</p>
        </div>
      `;
      return;
    }

    // Load PROJECT.md
    const projectHtml = await this.loadProjectMd();
    
    // Load ROADMAP.md
    const roadmapData = await this.loadRoadmapMd();
    
    // Parse markdown sections
    const sections = this.parseSections(content);
    
    // Render sections
    let html = '<div class="state-sections">';
    
    // Add PROJECT.md section if available
    if (projectHtml) {
      html += `
        <div class="state-section project-section">
          <h3>Project Overview</h3>
          <div class="section-content markdown-content">${projectHtml}</div>
        </div>
      `;
    }
    
    // Add ROADMAP.md milestones if available
    if (roadmapData && roadmapData.phases.length > 0) {
      html += `
        <div class="state-section roadmap-section">
          <h3>Project Phases</h3>
          <div class="section-content">
            ${this.renderRoadmapPhases(roadmapData.phases)}
          </div>
        </div>
      `;
    }
    
    sections.forEach(section => {
      html += `<div class="state-section">`;
      html += `<h3>${this.escapeHtml(section.title)}</h3>`;
      
      if (section.content.includes('%') || section.content.match(/\d+\/\d+/)) {
        // Render progress bars
        html += this.renderProgressBars(section.content);
      } else if (section.content.match(/^\s*-\s+/m)) {
        // Render lists
        html += this.renderList(section.content);
      } else if (section.content.match(/^\s*\[[ x]\]/m)) {
        // Render checkboxes
        html += this.renderCheckboxes(section.content);
      } else {
        // Render as paragraphs
        html += `<div class="section-content">${this.escapeHtml(section.content)}</div>`;
      }
      
      html += `</div>`;
    });
    
    html += '</div>';
    contentDiv.innerHTML = html;
  }

  parseSections(content) {
    const sections = [];
    const lines = content.split('\n');
    let currentSection = null;
    
    lines.forEach(line => {
      const h2Match = line.match(/^##\s+(.+)/);
      const h3Match = line.match(/^###\s+(.+)/);
      
      if (h2Match || h3Match) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: (h2Match || h3Match)[1],
          level: h2Match ? 2 : 3,
          content: ''
        };
      } else if (currentSection) {
        currentSection.content += line + '\n';
      }
    });
    
    if (currentSection) {
      sections.push(currentSection);
    }
    
    return sections;
  }

  renderProgressBars(content) {
    const lines = content.split('\n');
    let html = '<div class="progress-items">';
    
    lines.forEach(line => {
      const percentMatch = line.match(/(.+?):\s*(\d+)%/);
      const fractionMatch = line.match(/(.+?):\s*(\d+)\/(\d+)/);
      
      if (percentMatch) {
        const [_, label, percent] = percentMatch;
        html += `
          <div class="progress-item">
            <span class="progress-label">${this.escapeHtml(label)}</span>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${percent}%"></div>
            </div>
            <span class="progress-value">${percent}%</span>
          </div>
        `;
      } else if (fractionMatch) {
        const [_, label, current, total] = fractionMatch;
        const percent = Math.round((current / total) * 100);
        html += `
          <div class="progress-item">
            <span class="progress-label">${this.escapeHtml(label)}</span>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${percent}%"></div>
            </div>
            <span class="progress-value">${current}/${total}</span>
          </div>
        `;
      }
    });
    
    html += '</div>';
    return html;
  }

  renderList(content) {
    const lines = content.split('\n');
    let html = '<ul class="activity-list">';
    
    lines.forEach(line => {
      const match = line.match(/^\s*-\s+(.+)/);
      if (match) {
        const text = match[1];
        // Check for timestamp
        const timestampMatch = text.match(/^(\[[\d:]+\])\s*(.+)/);
        if (timestampMatch) {
          html += `<li><span class="timestamp">${timestampMatch[1]}</span> ${this.escapeHtml(timestampMatch[2])}</li>`;
        } else {
          html += `<li>${this.escapeHtml(text)}</li>`;
        }
      }
    });
    
    html += '</ul>';
    return html;
  }

  renderCheckboxes(content) {
    const lines = content.split('\n');
    let html = '<div class="task-list">';
    
    lines.forEach(line => {
      const match = line.match(/^\s*\[([x ])\]\s+(.+)/);
      if (match) {
        const checked = match[1] === 'x';
        html += `
          <div class="task-item ${checked ? 'completed' : ''}">
            <span class="checkbox">${checked ? '☑' : '☐'}</span>
            <span class="task-text">${this.escapeHtml(match[2])}</span>
          </div>
        `;
      }
    });
    
    html += '</div>';
    return html;
  }

  renderRoadmapPhases(phases) {
    let html = '<div class="roadmap-phases">';
    
    phases.forEach(phase => {
      html += `
        <div class="roadmap-phase">
          <h4 class="phase-name">${this.escapeHtml(phase.name)}</h4>
      `;
      
      if (phase.milestones.length > 0) {
        html += '<div class="phase-milestones">';
        
        phase.milestones.forEach(milestone => {
          html += `
            <div class="roadmap-milestone">
              <h5 class="milestone-name">${this.escapeHtml(milestone.name)}</h5>
          `;
          
          if (milestone.tasks.length > 0) {
            html += '<ul class="milestone-tasks">';
            milestone.tasks.forEach(task => {
              html += `<li>${this.escapeHtml(task)}</li>`;
            });
            html += '</ul>';
          }
          
          html += '</div>';
        });
        
        html += '</div>';
      }
      
      html += '</div>';
    });
    
    html += '</div>';
    return html;
  }

  renderError(error) {
    const contentDiv = this.container.querySelector('.state-panel-content');
    contentDiv.innerHTML = `
      <div class="error-state">
        <h3>Error loading state</h3>
        <p>${this.escapeHtml(error)}</p>
        <button onclick="window.statePanel.loadState()">Retry</button>
      </div>
    `;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  startAutoRefresh() {
    // Load initial state
    this.loadState();
    
    // Refresh every 5 seconds
    this.refreshInterval = setInterval(() => {
      this.loadState();
    }, 5000);
  }

  setupSSE() {
    if (window.eventSource) {
      window.eventSource.addEventListener('file-change', (event) => {
        const data = JSON.parse(event.data);
        if (data.path && data.path.includes('current-state.md')) {
          this.loadState();
        }
      });
    }
  }

  async loadProjectMd() {
    try {
      const response = await fetch('/api/file?path=PROJECT.md');
      if (!response.ok) {
        return null;
      }
      const text = await response.text();
      return this.parseMarkdown(text);
    } catch (error) {
      console.error('Failed to load PROJECT.md:', error);
      return null;
    }
  }

  async loadRoadmapMd() {
    try {
      const response = await fetch('/api/file?path=ROADMAP.md');
      if (!response.ok) {
        return null;
      }
      const text = await response.text();
      return this.parseRoadmapPhases(text);
    } catch (error) {
      console.error('Failed to load ROADMAP.md:', error);
      return null;
    }
  }

  parseRoadmapPhases(text) {
    const phases = [];
    const lines = text.split('\n');
    let currentPhase = null;
    let currentMilestone = null;
    
    for (const line of lines) {
      // Check for phase (## heading)
      const phaseMatch = line.match(/^##\s+(.+)/);
      if (phaseMatch) {
        if (currentPhase) {
          phases.push(currentPhase);
        }
        currentPhase = {
          name: phaseMatch[1],
          milestones: []
        };
        currentMilestone = null;
        continue;
      }
      
      // Check for milestone (### heading)
      const milestoneMatch = line.match(/^###\s+(.+)/);
      if (milestoneMatch && currentPhase) {
        currentMilestone = {
          name: milestoneMatch[1],
          tasks: []
        };
        currentPhase.milestones.push(currentMilestone);
        continue;
      }
      
      // Check for task list item
      const taskMatch = line.match(/^\s*[-*]\s+(.+)/);
      if (taskMatch && currentMilestone) {
        currentMilestone.tasks.push(taskMatch[1]);
      }
    }
    
    // Add the last phase if exists
    if (currentPhase) {
      phases.push(currentPhase);
    }
    
    return { phases };
  }

  parseMarkdown(text) {
    // Basic markdown parsing
    let html = text;
    
    // Headers
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    
    // Bold and italic
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // Links
    html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
    
    // Code blocks
    html = html.replace(/```(.+?)```/gs, '<pre><code>$1</code></pre>');
    html = html.replace(/`(.+?)`/g, '<code>$1</code>');
    
    // Lists
    html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // Paragraphs
    html = html.split('\n\n').map(para => {
      if (!para.match(/^<[^>]+>/)) {
        return `<p>${para}</p>`;
      }
      return para;
    }).join('\n');
    
    return html;
  }

  destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }
}

// CSS styles for state panel
const statePanelStyles = `
<style>
.state-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.state-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #e0e0e0;
}

.state-panel-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.refresh-btn {
  padding: 5px 10px;
  border: 1px solid #ccc;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.refresh-btn:hover {
  background: #f5f5f5;
}

.state-panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.state-loading {
  text-align: center;
  color: #666;
  padding: 40px;
}

.empty-state {
  text-align: center;
  color: #666;
  padding: 40px;
}

.empty-state h3 {
  color: #333;
  margin-bottom: 10px;
}

.error-state {
  text-align: center;
  color: #d32f2f;
  padding: 40px;
}

.error-state button {
  margin-top: 15px;
  padding: 8px 16px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.state-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.state-section {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 15px;
}

.state-section h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #333;
}

.progress-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.progress-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-label {
  flex: 1;
  font-size: 14px;
  color: #666;
}

.progress-bar {
  width: 150px;
  height: 20px;
  background: #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #4caf50;
  transition: width 0.3s ease;
}

.progress-value {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  min-width: 50px;
  text-align: right;
}

.activity-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.activity-list li {
  padding: 5px 0;
  font-size: 14px;
  color: #666;
}

.timestamp {
  color: #999;
  font-size: 12px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.task-item.completed .task-text {
  text-decoration: line-through;
  color: #999;
}

.checkbox {
  font-size: 18px;
}

.section-content {
  font-size: 14px;
  color: #666;
  white-space: pre-wrap;
}

.markdown-content {
  color: #333;
}

.markdown-content h1 {
  font-size: 24px;
  margin: 20px 0 10px 0;
}

.markdown-content h2 {
  font-size: 20px;
  margin: 15px 0 10px 0;
}

.markdown-content h3 {
  font-size: 16px;
  margin: 10px 0 8px 0;
}

.markdown-content p {
  margin: 10px 0;
  line-height: 1.6;
}

.markdown-content ul {
  margin: 10px 0;
  padding-left: 20px;
}

.markdown-content li {
  margin: 5px 0;
}

.markdown-content code {
  background: #f5f5f5;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
}

.markdown-content pre {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
}

.markdown-content a {
  color: #2196f3;
  text-decoration: none;
}

.markdown-content a:hover {
  text-decoration: underline;
}

.project-section {
  background: #f9f9f9;
  border: 1px solid #2196f3;
}

.roadmap-section {
  background: #f5f9ff;
  border: 1px solid #64b5f6;
}

.roadmap-phases {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.roadmap-phase {
  border-left: 3px solid #2196f3;
  padding-left: 15px;
}

.phase-name {
  font-size: 15px;
  font-weight: 600;
  color: #1976d2;
  margin: 0 0 10px 0;
}

.phase-milestones {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.roadmap-milestone {
  margin-left: 20px;
  border-left: 2px solid #90caf9;
  padding-left: 12px;
}

.milestone-name {
  font-size: 14px;
  font-weight: 500;
  color: #424242;
  margin: 0 0 8px 0;
}

.milestone-tasks {
  list-style-type: disc;
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
  color: #666;
}

.milestone-tasks li {
  margin: 4px 0;
  line-height: 1.5;
}
</style>
`;

// Add styles to document if not already added
if (!document.getElementById('state-panel-styles')) {
  const styleElement = document.createElement('div');
  styleElement.id = 'state-panel-styles';
  styleElement.innerHTML = statePanelStyles;
  document.head.appendChild(styleElement);
}