class MarkdownEditor {
  constructor(container) {
    this.container = container;
    this.textarea = null;
    this.lineNumbers = null;
    this.statusBar = null;
    this.saveTimeout = null;
    this.saveDebounceTime = 2000;
    this.isDirty = false;
    this.currentFile = null;
    this.currentContent = '';
    this.findBar = null;
    this.currentFindIndex = -1;
    this.findMatches = [];
    this.highlightLayer = null;
    this.highlightTimeout = null;
    this.highlightDebounceTime = 100;
    this.setupEditor();
    this.setupKeyboardShortcuts();
  }

  setupEditor() {
    // Create editor structure
    this.container.innerHTML = `
      <div class="editor-container">
        <div class="find-bar" id="find-bar" style="display: none;">
          <div class="find-controls">
            <input type="text" id="find-input" placeholder="Find..." class="find-input">
            <span class="find-results">0/0</span>
            <button class="find-prev" title="Previous match (Shift+Enter)">↑</button>
            <button class="find-next" title="Next match (Enter)">↓</button>
            <label class="regex-toggle">
              <input type="checkbox" id="regex-checkbox">
              <span title="Use regular expressions">.*</span>
            </label>
            <button class="replace-toggle" title="Toggle replace">▼</button>
            <button class="find-close" title="Close (Esc)">×</button>
          </div>
          <div class="replace-controls" id="replace-controls" style="display: none;">
            <input type="text" id="replace-input" placeholder="Replace..." class="replace-input">
            <button class="replace-current" title="Replace current match">Replace</button>
            <button class="replace-all" title="Replace all matches">Replace All</button>
          </div>
        </div>
        <div class="editor-content">
          <div class="line-numbers"></div>
          <div class="editor-wrapper">
            <div class="highlight-layer"></div>
            <textarea class="editor-textarea" wrap="off" spellcheck="false"></textarea>
          </div>
        </div>
        <div class="status-bar">
          <span class="file-path"></span>
          <span class="save-status">Ready</span>
        </div>
      </div>
    `;

    // Get references to elements
    this.textarea = this.container.querySelector('.editor-textarea');
    this.lineNumbers = this.container.querySelector('.line-numbers');
    this.statusBar = this.container.querySelector('.status-bar');
    this.findBar = this.container.querySelector('#find-bar');
    this.findInput = this.container.querySelector('#find-input');
    this.findResults = this.container.querySelector('.find-results');
    this.replaceInput = this.container.querySelector('#replace-input');
    this.replaceControls = this.container.querySelector('#replace-controls');
    this.regexCheckbox = this.container.querySelector('#regex-checkbox');
    this.useRegex = false;
    this.highlightLayer = this.container.querySelector('.highlight-layer');

    // Set up event listeners
    this.textarea.addEventListener('input', () => this.handleInput());
    this.textarea.addEventListener('scroll', () => this.syncScroll());
    
    // Sync highlight layer dimensions with textarea
    const syncDimensions = () => {
      const { width, height } = this.textarea.getBoundingClientRect();
      this.highlightLayer.style.width = width + 'px';
      this.highlightLayer.style.height = height + 'px';
    };
    window.addEventListener('resize', syncDimensions);
    syncDimensions();
    
    // Find functionality event listeners
    this.findInput.addEventListener('input', () => this.performFind());
    this.findInput.addEventListener('keydown', (e) => this.handleFindKeydown(e));
    
    this.container.querySelector('.find-next').addEventListener('click', () => this.findNext());
    this.container.querySelector('.find-prev').addEventListener('click', () => this.findPrevious());
    this.container.querySelector('.find-close').addEventListener('click', () => this.closeFindBar());
    
    // Replace functionality event listeners
    this.replaceInput.addEventListener('keydown', (e) => this.handleReplaceKeydown(e));
    this.container.querySelector('.replace-toggle').addEventListener('click', () => this.toggleReplaceBar());
    this.container.querySelector('.replace-current').addEventListener('click', () => this.replaceCurrent());
    this.container.querySelector('.replace-all').addEventListener('click', () => this.replaceAll());
    
    // Regex toggle
    this.regexCheckbox.addEventListener('change', () => {
      this.useRegex = this.regexCheckbox.checked;
      this.performFind();
    });

    // Initial line numbers
    this.updateLineNumbers();
  }

  setupKeyboardShortcuts() {
    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Cmd/Ctrl+F - Open find
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        this.openFindBar();
      }
      
      // Cmd/Ctrl+H - Open replace
      if ((e.metaKey || e.ctrlKey) && e.key === 'h') {
        e.preventDefault();
        this.openFindBar(true);
      }

      // Cmd/Ctrl+S - Save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        this.save();
      }

      // Tab - Insert 2 spaces
      if (e.key === 'Tab' && document.activeElement === this.textarea) {
        e.preventDefault();
        this.insertAtCursor('  ');
      }

      // Escape - Close find bar if open
      if (e.key === 'Escape' && this.findBar.style.display !== 'none') {
        e.preventDefault();
        this.closeFindBar();
      }
    });
  }

  openFindBar(showReplace = false) {
    this.findBar.style.display = 'block';
    if (showReplace) {
      this.replaceControls.style.display = 'block';
    }
    this.findInput.focus();
    this.findInput.select();
    this.performFind();
  }

  closeFindBar() {
    this.findBar.style.display = 'none';
    this.replaceControls.style.display = 'none';
    this.clearFindHighlights();
    this.textarea.focus();
  }
  
  toggleReplaceBar() {
    const isVisible = this.replaceControls.style.display !== 'none';
    this.replaceControls.style.display = isVisible ? 'none' : 'block';
    if (!isVisible) {
      this.replaceInput.focus();
    }
  }

  performFind() {
    const searchText = this.findInput.value;
    if (!searchText) {
      this.findMatches = [];
      this.currentFindIndex = -1;
      this.updateFindResults();
      this.clearFindHighlights();
      return;
    }

    const content = this.textarea.value;
    this.findMatches = [];
    
    if (this.useRegex) {
      // Regex search
      try {
        const regex = new RegExp(searchText, 'g');
        let match;
        while ((match = regex.exec(content)) !== null) {
          this.findMatches.push({
            start: match.index,
            end: match.index + match[0].length,
            text: match[0]
          });
          // Prevent infinite loop for zero-width matches
          if (match[0].length === 0) {
            regex.lastIndex++;
          }
        }
      } catch (e) {
        // Invalid regex - clear matches
        this.findMatches = [];
      }
    } else {
      // Plain text search
      let index = 0;
      while (index < content.length) {
        const matchIndex = content.toLowerCase().indexOf(searchText.toLowerCase(), index);
        if (matchIndex === -1) break;
        
        this.findMatches.push({
          start: matchIndex,
          end: matchIndex + searchText.length,
          text: content.substring(matchIndex, matchIndex + searchText.length)
        });
        
        index = matchIndex + 1;
      }
    }

    if (this.findMatches.length > 0) {
      this.currentFindIndex = 0;
      this.highlightMatch(0);
    } else {
      this.currentFindIndex = -1;
    }
    
    this.updateFindResults();
  }

  findNext() {
    if (this.findMatches.length === 0) return;
    
    this.currentFindIndex = (this.currentFindIndex + 1) % this.findMatches.length;
    this.highlightMatch(this.currentFindIndex);
    this.updateFindResults();
  }

  findPrevious() {
    if (this.findMatches.length === 0) return;
    
    this.currentFindIndex = this.currentFindIndex - 1;
    if (this.currentFindIndex < 0) {
      this.currentFindIndex = this.findMatches.length - 1;
    }
    
    this.highlightMatch(this.currentFindIndex);
    this.updateFindResults();
  }

  highlightMatch(index) {
    if (index < 0 || index >= this.findMatches.length) return;
    
    const match = this.findMatches[index];
    
    // Select the match in the textarea
    this.textarea.setSelectionRange(match.start, match.end);
    
    // Scroll to make the match visible
    const lineHeight = 20; // Approximate line height
    const linesBeforeCursor = this.textarea.value.substring(0, match.start).split('\n').length - 1;
    const scrollTop = linesBeforeCursor * lineHeight;
    
    // Center the match in the viewport if possible
    const editorHeight = this.textarea.clientHeight;
    const targetScroll = scrollTop - (editorHeight / 2) + lineHeight;
    
    this.textarea.scrollTop = Math.max(0, targetScroll);
  }

  clearFindHighlights() {
    // Clear any selection
    if (this.textarea.selectionStart !== this.textarea.selectionEnd) {
      const currentPos = this.textarea.selectionEnd;
      this.textarea.setSelectionRange(currentPos, currentPos);
    }
  }

  updateFindResults() {
    if (this.findMatches.length === 0) {
      this.findResults.textContent = '0/0';
    } else {
      const current = this.currentFindIndex + 1;
      this.findResults.textContent = `${current}/${this.findMatches.length}`;
    }
  }

  handleFindKeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        this.findPrevious();
      } else {
        this.findNext();
      }
    }
  }
  
  handleReplaceKeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.replaceCurrent();
    }
  }
  
  replaceCurrent() {
    if (this.currentFindIndex < 0 || this.currentFindIndex >= this.findMatches.length) {
      return;
    }
    
    const replaceText = this.replaceInput.value;
    const match = this.findMatches[this.currentFindIndex];
    const content = this.textarea.value;
    
    // Replace the current match
    const newContent = content.substring(0, match.start) + 
                      replaceText + 
                      content.substring(match.end);
    
    this.textarea.value = newContent;
    
    // Adjust remaining matches
    const lengthDiff = replaceText.length - match.text.length;
    for (let i = this.currentFindIndex + 1; i < this.findMatches.length; i++) {
      this.findMatches[i].start += lengthDiff;
      this.findMatches[i].end += lengthDiff;
    }
    
    // Remove current match and re-find from this position
    this.findMatches.splice(this.currentFindIndex, 1);
    
    // If there are remaining matches, highlight the next one
    if (this.findMatches.length > 0) {
      if (this.currentFindIndex >= this.findMatches.length) {
        this.currentFindIndex = 0;
      }
      this.highlightMatch(this.currentFindIndex);
    } else {
      this.currentFindIndex = -1;
    }
    
    this.updateFindResults();
    this.handleInput(); // Mark as dirty and trigger auto-save
  }
  
  replaceAll() {
    if (this.findMatches.length === 0) {
      return;
    }
    
    const searchText = this.findInput.value;
    const replaceText = this.replaceInput.value;
    let content = this.textarea.value;
    
    if (this.useRegex) {
      try {
        const regex = new RegExp(searchText, 'g');
        content = content.replace(regex, replaceText);
      } catch (e) {
        return; // Invalid regex
      }
    } else {
      // Replace all occurrences (case-insensitive)
      const regex = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      content = content.replace(regex, replaceText);
    }
    
    this.textarea.value = content;
    this.performFind(); // Re-find to update matches
    this.handleInput(); // Mark as dirty and trigger auto-save
  }

  handleInput() {
    this.isDirty = true;
    this.updateLineNumbers();
    this.updateStatus('Unsaved');
    
    // Debounced auto-save
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => this.save(), this.saveDebounceTime);
    
    // Debounced syntax highlighting
    if (this.highlightTimeout) {
      clearTimeout(this.highlightTimeout);
    }
    this.highlightTimeout = setTimeout(() => this.updateSyntaxHighlighting(), this.highlightDebounceTime);
  }

  syncScroll() {
    this.lineNumbers.scrollTop = this.textarea.scrollTop;
    this.highlightLayer.scrollTop = this.textarea.scrollTop;
    this.highlightLayer.scrollLeft = this.textarea.scrollLeft;
  }

  updateLineNumbers() {
    const lines = this.textarea.value.split('\n').length;
    const numbers = [];
    for (let i = 1; i <= lines; i++) {
      numbers.push(`<div class="line-number">${i}</div>`);
    }
    this.lineNumbers.innerHTML = numbers.join('');
  }

  insertAtCursor(text) {
    const start = this.textarea.selectionStart;
    const end = this.textarea.selectionEnd;
    const value = this.textarea.value;
    
    this.textarea.value = value.substring(0, start) + text + value.substring(end);
    this.textarea.selectionStart = this.textarea.selectionEnd = start + text.length;
    
    this.handleInput();
  }

  loadFile(path, content) {
    this.currentFile = path;
    this.currentContent = content;
    this.textarea.value = content;
    this.isDirty = false;
    this.updateLineNumbers();
    this.updateStatus('Saved');
    this.container.querySelector('.file-path').textContent = path;
    this.updateSyntaxHighlighting();
  }

  async save() {
    if (!this.currentFile || !this.isDirty) return;
    
    this.updateStatus('Saving...');
    
    try {
      await window.api.saveFile(this.currentFile, this.textarea.value, {
        onSuccess: () => {
          this.isDirty = false;
          this.currentContent = this.textarea.value;
          this.updateStatus('Saved');
        },
        onError: (error) => {
          console.error('Failed to save file:', error);
          this.updateStatus('Save failed');
        }
      });
    } catch (error) {
      // Operation was queued
      this.updateStatus('Save queued');
    }
  }

  updateStatus(status) {
    this.statusBar.querySelector('.save-status').textContent = status;
  }

  handleExternalChange(newContent) {
    if (this.isDirty) {
      // TODO: Show conflict resolution UI
      console.warn('External change detected while file has unsaved changes');
    } else {
      this.textarea.value = newContent;
      this.currentContent = newContent;
      this.updateLineNumbers();
      this.updateSyntaxHighlighting();
    }
  }

  updateSyntaxHighlighting() {
    const content = this.textarea.value;
    if (!content) {
      this.highlightLayer.innerHTML = '';
      return;
    }

    // Process content line by line
    const lines = content.split('\n');
    const highlightedLines = lines.map(line => this.highlightLine(line));
    
    // Join with line breaks and wrap in pre tag to maintain formatting
    this.highlightLayer.innerHTML = `<pre class="highlight-content">${highlightedLines.join('\n')}</pre>`;
  }

  highlightLine(line) {
    // Escape HTML
    let html = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Headers (h1-h6)
    if (/^#{1,6}\s/.test(line)) {
      const level = line.match(/^(#{1,6})\s/)[1].length;
      html = html.replace(/^(#{1,6}\s)(.*)$/, `<span class="md-header md-h${level}">$1$2</span>`);
    }
    
    // Bold text
    html = html.replace(/\*\*([^*]+)\*\*/g, '<span class="md-bold">**$1**</span>');
    html = html.replace(/__([^_]+)__/g, '<span class="md-bold">__$1__</span>');
    
    // Italic text
    html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<span class="md-italic">*$1*</span>');
    html = html.replace(/(?<!_)_([^_]+)_(?!_)/g, '<span class="md-italic">_$1_</span>');
    
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<span class="md-code">`$1`</span>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<span class="md-link">[$1]($2)</span>');
    
    // Images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<span class="md-image">![$1]($2)</span>');
    
    // Lists
    if (/^[\s]*[-*+]\s/.test(line)) {
      html = html.replace(/^([\s]*)([-*+]\s)/, '$1<span class="md-list">$2</span>');
    }
    
    // Ordered lists
    if (/^[\s]*\d+\.\s/.test(line)) {
      html = html.replace(/^([\s]*)(\d+\.\s)/, '$1<span class="md-list">$2</span>');
    }
    
    // Blockquotes
    if (/^>/.test(line)) {
      html = `<span class="md-blockquote">${html}</span>`;
    }
    
    // Code blocks (simple detection for lines starting with 4 spaces or tab)
    if (/^(\t|    )/.test(line)) {
      html = `<span class="md-code-block">${html}</span>`;
    }
    
    // Triple backticks for code blocks
    if (/^```/.test(line)) {
      html = `<span class="md-fence">${html}</span>`;
    }
    
    // Horizontal rule
    if (/^([-_*]){3,}\s*$/.test(line)) {
      html = `<span class="md-hr">${html}</span>`;
    }
    
    // Task lists
    html = html.replace(/^([\s]*)(- \[[ x]\])/, '$1<span class="md-task">$2</span>');
    
    return html || '&nbsp;'; // Return non-breaking space for empty lines
  }
}

// Add editor styles
const style = document.createElement('style');
style.textContent = `
  .editor-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #fff;
  }
  
  .editor-wrapper {
    flex: 1;
    position: relative;
    overflow: hidden;
  }
  
  .highlight-layer {
    position: absolute;
    top: 0;
    left: 0;
    padding: 0 10px;
    pointer-events: none;
    overflow: hidden;
    white-space: pre;
    color: transparent;
    font-family: 'SF Mono', Monaco, 'Courier New', monospace;
    font-size: 13px;
    line-height: 20px;
  }
  
  .highlight-content {
    margin: 0;
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
  }
  
  /* Markdown syntax highlighting */
  .md-header {
    color: #0969da !important;
    font-weight: bold;
  }
  
  .md-h1 { font-size: 1.4em; }
  .md-h2 { font-size: 1.3em; }
  .md-h3 { font-size: 1.2em; }
  .md-h4 { font-size: 1.1em; }
  .md-h5 { font-size: 1.05em; }
  .md-h6 { font-size: 1em; }
  
  .md-bold {
    color: #24292e !important;
    font-weight: bold;
  }
  
  .md-italic {
    color: #24292e !important;
    font-style: italic;
  }
  
  .md-code {
    color: #032f62 !important;
    background: rgba(175, 184, 193, 0.2);
    padding: 0.1em 0.2em;
    border-radius: 3px;
  }
  
  .md-code-block,
  .md-fence {
    color: #032f62 !important;
    background: rgba(175, 184, 193, 0.1);
  }
  
  .md-link {
    color: #0969da !important;
    text-decoration: underline;
  }
  
  .md-image {
    color: #cf222e !important;
  }
  
  .md-list {
    color: #cf222e !important;
    font-weight: bold;
  }
  
  .md-blockquote {
    color: #57606a !important;
    border-left: 3px solid #d0d7de;
    padding-left: 0.5em;
  }
  
  .md-hr {
    color: #d0d7de !important;
  }
  
  .md-task {
    color: #0969da !important;
  }
  
  .find-bar {
    background: #f5f5f5;
    border-bottom: 1px solid #ddd;
    padding: 8px;
  }
  
  .find-controls,
  .replace-controls {
    display: flex;
    align-items: center;
    gap: 8px;
    max-width: 600px;
  }
  
  .replace-controls {
    margin-top: 8px;
  }
  
  .find-input,
  .replace-input {
    flex: 1;
    padding: 4px 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-family: inherit;
    font-size: 13px;
  }
  
  .find-input:focus,
  .replace-input:focus {
    outline: none;
    border-color: #2196f3;
  }
  
  .find-results {
    font-size: 12px;
    color: #666;
    min-width: 50px;
    text-align: center;
  }
  
  .regex-toggle {
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    font-size: 12px;
    color: #666;
  }
  
  .regex-toggle input[type="checkbox"] {
    cursor: pointer;
  }
  
  .regex-toggle span {
    font-family: monospace;
    font-weight: bold;
  }
  
  .find-prev,
  .find-next,
  .find-close,
  .replace-toggle,
  .replace-current,
  .replace-all {
    padding: 4px 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: white;
    cursor: pointer;
    font-size: 12px;
  }
  
  .find-prev:hover,
  .find-next:hover,
  .find-close:hover,
  .replace-toggle:hover,
  .replace-current:hover,
  .replace-all:hover {
    background: #f0f0f0;
  }
  
  .editor-content {
    flex: 1;
    display: flex;
    overflow: hidden;
    font-family: 'SF Mono', Monaco, 'Courier New', monospace;
    font-size: 13px;
    line-height: 20px;
  }
  
  .line-numbers {
    width: 50px;
    background: #f5f5f5;
    color: #999;
    text-align: right;
    padding-right: 10px;
    overflow-y: hidden;
    user-select: none;
    border-right: 1px solid #e0e0e0;
  }
  
  .line-number {
    height: 20px;
  }
  
  .editor-textarea {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    padding: 0 10px;
    border: none;
    resize: none;
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
    outline: none;
    background: transparent;
    z-index: 1;
  }
  
  .status-bar {
    height: 24px;
    background: #f5f5f5;
    border-top: 1px solid #e0e0e0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 10px;
    font-size: 12px;
    color: #666;
  }
  
  .save-status {
    margin-left: auto;
  }
`;
document.head.appendChild(style);

// Export for use
window.MarkdownEditor = MarkdownEditor;