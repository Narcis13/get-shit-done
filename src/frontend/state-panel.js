/**
 * State Panel Component
 * Displays project state from .planning/current-state.md
 */
export class StatePanel {
    constructor() {
        this.container = document.getElementById('state-content');
        this.refreshInterval = null;
        this.currentContent = null;
        this.isLoading = false;
        this.lastError = null;
    }
    
    async init() {
        // Initial load
        await this.loadState();
        
        // Set up periodic refresh every 5 seconds
        this.refreshInterval = setInterval(() => {
            this.loadState();
        }, 5000);
    }
    
    async loadState() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        
        try {
            const response = await fetch('/api/state');
            
            if (!response.ok) {
                throw new Error(`Failed to load state: ${response.statusText}`);
            }
            
            const state = await response.json();
            
            // Only update if content changed
            if (state.content !== this.currentContent) {
                this.currentContent = state.content;
                this.lastError = null;
                this.render();
            }
        } catch (error) {
            console.error('Error loading state:', error);
            this.lastError = error.message;
            this.renderError();
        } finally {
            this.isLoading = false;
        }
    }
    
    render() {
        if (!this.currentContent) {
            this.container.innerHTML = `
                <div class="empty-state">
                    <p>No project state available yet.</p>
                    <p class="muted">State will appear here when Ralph creates it.</p>
                </div>
            `;
            return;
        }
        
        // Parse the markdown content into sections
        const sections = this.parseState(this.currentContent);
        
        // Clear container
        this.container.innerHTML = '';
        
        // Render each section
        sections.forEach(section => {
            const sectionEl = this.createSection(section);
            this.container.appendChild(sectionEl);
        });
    }
    
    renderError() {
        this.container.innerHTML = `
            <div class="error-state">
                <p>Failed to load project state</p>
                <p class="error-message">${this.lastError}</p>
                <button onclick="window.ide.statePanel.loadState()">Retry</button>
            </div>
        `;
    }
    
    parseState(content) {
        const sections = [];
        const lines = content.split('\n');
        let currentSection = null;
        
        lines.forEach(line => {
            // Check for headers (## or ###)
            const h2Match = line.match(/^## (.+)/);
            const h3Match = line.match(/^### (.+)/);
            
            if (h2Match) {
                // New main section
                currentSection = {
                    title: h2Match[1],
                    level: 2,
                    content: [],
                    subsections: []
                };
                sections.push(currentSection);
            } else if (h3Match && currentSection) {
                // Subsection
                const subsection = {
                    title: h3Match[1],
                    level: 3,
                    content: []
                };
                currentSection.subsections.push(subsection);
                currentSection = subsection;
            } else if (currentSection && line.trim()) {
                // Content line
                currentSection.content.push(line);
            }
        });
        
        return sections;
    }
    
    createSection(section) {
        const sectionEl = document.createElement('section');
        sectionEl.className = `state-section level-${section.level}`;
        
        // Section header
        const headerEl = document.createElement(`h${section.level + 1}`);
        headerEl.className = 'section-title';
        headerEl.textContent = section.title;
        sectionEl.appendChild(headerEl);
        
        // Section content
        if (section.content.length > 0) {
            const contentEl = document.createElement('div');
            contentEl.className = 'section-content';
            
            // Process content based on section type
            if (section.title.toLowerCase().includes('progress')) {
                contentEl.appendChild(this.createProgressContent(section.content));
            } else if (section.title.toLowerCase().includes('activity') || 
                       section.title.toLowerCase().includes('recent')) {
                contentEl.appendChild(this.createActivityList(section.content));
            } else if (section.title.toLowerCase().includes('milestone') ||
                       section.title.toLowerCase().includes('phase')) {
                contentEl.appendChild(this.createMilestoneContent(section.content));
            } else {
                // Default rendering
                contentEl.innerHTML = this.renderMarkdown(section.content.join('\n'));
            }
            
            sectionEl.appendChild(contentEl);
        }
        
        // Render subsections
        if (section.subsections && section.subsections.length > 0) {
            section.subsections.forEach(subsection => {
                sectionEl.appendChild(this.createSection(subsection));
            });
        }
        
        return sectionEl;
    }
    
    createProgressContent(lines) {
        const container = document.createElement('div');
        container.className = 'progress-container';
        
        // Look for percentage or fraction patterns
        lines.forEach(line => {
            const percentMatch = line.match(/(\d+)%/);
            const fractionMatch = line.match(/(\d+)\s*\/\s*(\d+)/);
            
            if (percentMatch) {
                const percent = parseInt(percentMatch[1]);
                container.appendChild(this.createProgressBar(percent));
            } else if (fractionMatch) {
                const completed = parseInt(fractionMatch[1]);
                const total = parseInt(fractionMatch[2]);
                const percent = Math.round((completed / total) * 100);
                
                const progressEl = this.createProgressBar(percent);
                const labelEl = document.createElement('div');
                labelEl.className = 'progress-label';
                labelEl.textContent = `${completed} / ${total} completed`;
                
                container.appendChild(progressEl);
                container.appendChild(labelEl);
            } else {
                // Regular text
                const textEl = document.createElement('p');
                textEl.innerHTML = this.renderMarkdown(line);
                container.appendChild(textEl);
            }
        });
        
        return container;
    }
    
    createProgressBar(percent) {
        const progressEl = document.createElement('div');
        progressEl.className = 'progress-bar';
        progressEl.setAttribute('role', 'progressbar');
        progressEl.setAttribute('aria-valuenow', percent);
        progressEl.setAttribute('aria-valuemin', '0');
        progressEl.setAttribute('aria-valuemax', '100');
        
        const fillEl = document.createElement('div');
        fillEl.className = 'progress-fill';
        fillEl.style.width = `${percent}%`;
        
        const labelEl = document.createElement('span');
        labelEl.className = 'progress-percent';
        labelEl.textContent = `${percent}%`;
        
        fillEl.appendChild(labelEl);
        progressEl.appendChild(fillEl);
        
        return progressEl;
    }
    
    createActivityList(lines) {
        const listEl = document.createElement('ul');
        listEl.className = 'activity-list';
        
        lines.forEach(line => {
            if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
                const itemEl = document.createElement('li');
                itemEl.className = 'activity-item';
                
                // Remove list marker and render
                const content = line.replace(/^\s*[-*]\s*/, '');
                
                // Check for timestamp patterns
                const timestampMatch = content.match(/\[(.+?)\]/);
                if (timestampMatch) {
                    const timeEl = document.createElement('time');
                    timeEl.className = 'activity-time';
                    timeEl.textContent = timestampMatch[1];
                    itemEl.appendChild(timeEl);
                    
                    const textEl = document.createElement('span');
                    textEl.innerHTML = this.renderMarkdown(
                        content.replace(/\[.+?\]/, '').trim()
                    );
                    itemEl.appendChild(textEl);
                } else {
                    itemEl.innerHTML = this.renderMarkdown(content);
                }
                
                listEl.appendChild(itemEl);
            }
        });
        
        return listEl;
    }
    
    createMilestoneContent(lines) {
        const container = document.createElement('div');
        container.className = 'milestone-container';
        
        lines.forEach(line => {
            // Check for checkbox patterns
            const checkboxMatch = line.match(/^\s*-\s*\[([ x])\]\s*(.+)/i);
            if (checkboxMatch) {
                const itemEl = document.createElement('div');
                itemEl.className = 'milestone-item';
                
                const checkboxEl = document.createElement('input');
                checkboxEl.type = 'checkbox';
                checkboxEl.checked = checkboxMatch[1].toLowerCase() === 'x';
                checkboxEl.disabled = true; // Read-only display
                
                const labelEl = document.createElement('label');
                labelEl.innerHTML = this.renderMarkdown(checkboxMatch[2]);
                
                itemEl.appendChild(checkboxEl);
                itemEl.appendChild(labelEl);
                container.appendChild(itemEl);
            } else {
                const textEl = document.createElement('p');
                textEl.innerHTML = this.renderMarkdown(line);
                container.appendChild(textEl);
            }
        });
        
        return container;
    }
    
    renderMarkdown(text) {
        // Basic markdown rendering
        return text
            // Bold
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/__(.+?)__/g, '<strong>$1</strong>')
            // Italic
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/_(.+?)_/g, '<em>$1</em>')
            // Code
            .replace(/`(.+?)`/g, '<code>$1</code>')
            // Links
            .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>');
    }
    
    // Handle real-time updates from SSE
    handleFileChange(path) {
        if (path === '.planning/current-state.md') {
            console.log('State file changed, reloading...');
            this.loadState();
        }
    }
    
    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }
}