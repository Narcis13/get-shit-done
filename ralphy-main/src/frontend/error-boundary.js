// Error Boundary component for graceful error handling
class ErrorBoundary {
  constructor(container, componentName, fallbackContent) {
    this.container = container;
    this.componentName = componentName;
    this.fallbackContent = fallbackContent || this.getDefaultFallback();
    this.errorState = null;
    this.childComponent = null;
    this.retryCount = 0;
    this.maxRetries = 3;
  }

  getDefaultFallback() {
    return `
      <div class="error-boundary-fallback">
        <div class="error-icon">⚠️</div>
        <h3>Something went wrong</h3>
        <p class="error-message"></p>
        <button class="error-retry-btn">Try Again</button>
        <details class="error-details">
          <summary>Error Details</summary>
          <pre class="error-stack"></pre>
        </details>
      </div>
    `;
  }

  wrap(componentFactory) {
    try {
      // Create wrapper element
      const wrapper = document.createElement('div');
      wrapper.className = 'error-boundary-wrapper';
      this.container.appendChild(wrapper);

      // Set up global error handler for this component
      const originalErrorHandler = window.onerror;
      const errorHandler = (message, source, lineno, colno, error) => {
        // Check if error is from our component
        if (this.isOurError(source)) {
          this.handleError(error || new Error(message));
          return true; // Prevent default error handling
        }
        // Call original handler if exists
        if (originalErrorHandler) {
          return originalErrorHandler(message, source, lineno, colno, error);
        }
        return false;
      };

      // Set up promise rejection handler
      const originalRejectionHandler = window.onunhandledrejection;
      const rejectionHandler = (event) => {
        // Try to determine if this rejection is from our component
        if (this.childComponent && this.isOurRejection(event)) {
          this.handleError(new Error(event.reason));
          event.preventDefault();
          return;
        }
        // Call original handler if exists
        if (originalRejectionHandler) {
          originalRejectionHandler(event);
        }
      };

      window.onerror = errorHandler;
      window.onunhandledrejection = rejectionHandler;

      // Create the component
      this.childComponent = componentFactory(wrapper);
      
      // Store cleanup function
      this.cleanup = () => {
        window.onerror = originalErrorHandler;
        window.onunhandledrejection = originalRejectionHandler;
      };

      return this.childComponent;
    } catch (error) {
      this.handleError(error);
      return null;
    }
  }

  isOurError(source) {
    // Check if error source matches our component
    return source && (
      source.includes(this.componentName.toLowerCase()) ||
      source.includes('error-boundary')
    );
  }

  isOurRejection(event) {
    // Try to determine if rejection is from our component
    // This is heuristic-based since we can't always determine the source
    const stack = event.reason?.stack || '';
    return stack.includes(this.componentName.toLowerCase());
  }

  handleError(error) {
    console.error(`Error in ${this.componentName}:`, error);
    
    this.errorState = {
      error,
      timestamp: new Date(),
      componentName: this.componentName,
      retryCount: this.retryCount
    };

    // Show error UI
    this.showErrorUI();
    
    // Report error to telemetry (localStorage-based)
    this.reportError(error);
  }

  showErrorUI() {
    const wrapper = this.container.querySelector('.error-boundary-wrapper');
    if (!wrapper) return;

    wrapper.innerHTML = this.fallbackContent;
    
    // Update error message
    const messageEl = wrapper.querySelector('.error-message');
    if (messageEl) {
      messageEl.textContent = this.getUserFriendlyMessage(this.errorState.error);
    }

    // Update error stack
    const stackEl = wrapper.querySelector('.error-stack');
    if (stackEl) {
      stackEl.textContent = this.errorState.error.stack || this.errorState.error.toString();
    }

    // Set up retry button
    const retryBtn = wrapper.querySelector('.error-retry-btn');
    if (retryBtn) {
      retryBtn.onclick = () => this.retry();
      
      // Disable retry after max attempts
      if (this.retryCount >= this.maxRetries) {
        retryBtn.disabled = true;
        retryBtn.textContent = 'Maximum retries exceeded';
      }
    }
  }

  getUserFriendlyMessage(error) {
    const message = error.message || error.toString();
    
    // Map technical errors to user-friendly messages
    const errorMappings = {
      'Failed to fetch': 'Unable to connect to the server. Please check your connection.',
      'NetworkError': 'Network connection issue. Please try again.',
      'SyntaxError': 'There was an issue processing the data. Please refresh the page.',
      'TypeError: Cannot read property': 'An unexpected error occurred. Some data may be missing.',
      'RangeError': 'A value was outside the expected range. Please check your input.',
      'QuotaExceededError': 'Storage limit exceeded. Please clear some data.',
      'out of memory': 'The application ran out of memory. Please refresh the page.',
      '404': 'The requested resource was not found.',
      '500': 'Server error. Please try again later.',
      '429': 'Too many requests. Please wait a moment before trying again.',
    };

    // Check for known error patterns
    for (const [pattern, friendlyMessage] of Object.entries(errorMappings)) {
      if (message.includes(pattern)) {
        return friendlyMessage;
      }
    }

    // Default message
    return `An error occurred in the ${this.componentName}. ${message}`;
  }

  retry() {
    this.retryCount++;
    
    // Clear error state
    this.errorState = null;
    
    // Clear the container
    const wrapper = this.container.querySelector('.error-boundary-wrapper');
    if (wrapper) {
      wrapper.innerHTML = '';
    }

    // Try to recreate the component
    if (this.childComponent && this.childComponent.constructor) {
      try {
        this.childComponent = new this.childComponent.constructor(wrapper);
      } catch (error) {
        this.handleError(error);
      }
    }
  }

  reportError(error) {
    try {
      // Get existing error log from localStorage
      const errorLog = JSON.parse(localStorage.getItem('lpl-error-log') || '[]');
      
      // Add new error
      errorLog.push({
        timestamp: new Date().toISOString(),
        component: this.componentName,
        message: error.message,
        stack: error.stack,
        userAgent: navigator.userAgent,
        url: window.location.href
      });
      
      // Keep only last 50 errors
      if (errorLog.length > 50) {
        errorLog.splice(0, errorLog.length - 50);
      }
      
      // Save back to localStorage
      localStorage.setItem('lpl-error-log', JSON.stringify(errorLog));
    } catch (e) {
      // Silently fail if localStorage is not available
      console.error('Failed to report error:', e);
    }
  }

  destroy() {
    if (this.cleanup) {
      this.cleanup();
    }
    
    // Clear container
    this.container.innerHTML = '';
  }
}

// Add CSS styles
const style = document.createElement('style');
style.textContent = `
  .error-boundary-wrapper {
    width: 100%;
    height: 100%;
  }

  .error-boundary-fallback {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    text-align: center;
    height: 100%;
    color: #333;
  }

  .error-icon {
    font-size: 48px;
    margin-bottom: 20px;
  }

  .error-boundary-fallback h3 {
    margin: 0 0 10px 0;
    font-size: 20px;
    font-weight: 500;
  }

  .error-message {
    margin: 0 0 20px 0;
    color: #666;
    max-width: 500px;
    line-height: 1.5;
  }

  .error-retry-btn {
    padding: 8px 20px;
    background: #2196f3;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .error-retry-btn:hover:not(:disabled) {
    background: #1976d2;
  }

  .error-retry-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .error-details {
    margin-top: 20px;
    text-align: left;
    max-width: 600px;
    width: 100%;
  }

  .error-details summary {
    cursor: pointer;
    padding: 8px;
    background: #f5f5f5;
    border-radius: 4px;
    font-size: 14px;
  }

  .error-details summary:hover {
    background: #e0e0e0;
  }

  .error-stack {
    margin-top: 10px;
    padding: 10px;
    background: #f5f5f5;
    border-radius: 4px;
    font-size: 12px;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-word;
  }
`;
document.head.appendChild(style);