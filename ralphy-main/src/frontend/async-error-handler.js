// Async error handler for network and async operations
class AsyncErrorHandler {
  constructor() {
    this.errorHandlers = new Map();
    this.globalErrorHandler = null;
  }

  // Wrap fetch requests with error handling
  wrapFetch(url, options = {}) {
    return fetch(url, options)
      .then(response => {
        if (!response.ok) {
          throw new NetworkError(
            `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            url
          );
        }
        return response;
      })
      .catch(error => {
        if (error instanceof NetworkError) {
          throw error;
        }
        // Convert fetch errors to NetworkError
        throw new NetworkError(
          error.message || 'Network request failed',
          0,
          url,
          error
        );
      });
  }

  // Wrap async functions with error handling
  wrapAsync(fn, componentName, operationName) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        const asyncError = new AsyncOperationError(
          error.message,
          componentName,
          operationName,
          error
        );
        
        // Call component-specific handler if exists
        const handler = this.errorHandlers.get(componentName);
        if (handler) {
          const handled = await handler(asyncError);
          if (handled) return;
        }
        
        // Call global handler if exists
        if (this.globalErrorHandler) {
          const handled = await this.globalErrorHandler(asyncError);
          if (handled) return;
        }
        
        // Re-throw if not handled
        throw asyncError;
      }
    };
  }

  // Register error handler for a specific component
  registerHandler(componentName, handler) {
    this.errorHandlers.set(componentName, handler);
  }

  // Set global error handler
  setGlobalHandler(handler) {
    this.globalErrorHandler = handler;
  }

  // Show toast notification for errors
  showErrorToast(message, duration = 5000) {
    // Remove existing toast if any
    const existingToast = document.querySelector('.error-toast');
    if (existingToast) {
      existingToast.remove();
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.innerHTML = `
      <div class="error-toast-icon">⚠️</div>
      <div class="error-toast-content">
        <div class="error-toast-message">${this.escapeHtml(message)}</div>
      </div>
      <button class="error-toast-close">✕</button>
    `;

    // Add to body
    document.body.appendChild(toast);

    // Set up close button
    const closeBtn = toast.querySelector('.error-toast-close');
    closeBtn.onclick = () => toast.remove();

    // Auto remove after duration
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, duration);

    return toast;
  }

  // Show inline error message
  showInlineError(container, message) {
    // Remove existing error if any
    const existingError = container.querySelector('.inline-error');
    if (existingError) {
      existingError.remove();
    }

    // Create error element
    const error = document.createElement('div');
    error.className = 'inline-error';
    error.innerHTML = `
      <div class="inline-error-icon">⚠️</div>
      <div class="inline-error-message">${this.escapeHtml(message)}</div>
    `;

    // Insert at beginning of container
    container.insertBefore(error, container.firstChild);

    return error;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Custom error classes
class NetworkError extends Error {
  constructor(message, status, url, originalError = null) {
    super(message);
    this.name = 'NetworkError';
    this.status = status;
    this.url = url;
    this.originalError = originalError;
  }
}

class AsyncOperationError extends Error {
  constructor(message, component, operation, originalError = null) {
    super(message);
    this.name = 'AsyncOperationError';
    this.component = component;
    this.operation = operation;
    this.originalError = originalError;
  }
}

// Global instance
const asyncErrorHandler = new AsyncErrorHandler();

// Set up global handler to show toasts
asyncErrorHandler.setGlobalHandler((error) => {
  let message = error.message;
  
  if (error instanceof NetworkError) {
    if (error.status === 0) {
      message = 'Unable to connect to server. Please check your connection.';
    } else if (error.status === 429) {
      message = 'Too many requests. Please wait a moment and try again.';
    } else if (error.status === 500) {
      message = 'Server error. Please try again later.';
    } else if (error.status === 404) {
      message = 'The requested resource was not found.';
    }
  }
  
  asyncErrorHandler.showErrorToast(message);
  return true; // Mark as handled
});

// Add CSS styles
const style = document.createElement('style');
style.textContent = `
  .error-toast {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #f44336;
    color: white;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    padding: 12px 16px;
    min-width: 300px;
    max-width: 500px;
    z-index: 10001;
    animation: slideIn 0.3s ease-out;
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .error-toast-icon {
    font-size: 20px;
    margin-right: 12px;
  }

  .error-toast-content {
    flex: 1;
  }

  .error-toast-message {
    font-size: 14px;
    line-height: 1.4;
  }

  .error-toast-close {
    background: none;
    border: none;
    color: white;
    font-size: 18px;
    cursor: pointer;
    padding: 4px;
    margin-left: 12px;
    opacity: 0.8;
    transition: opacity 0.2s;
  }

  .error-toast-close:hover {
    opacity: 1;
  }

  .inline-error {
    background: #ffebee;
    border: 1px solid #ffcdd2;
    border-radius: 4px;
    padding: 12px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
  }

  .inline-error-icon {
    color: #d32f2f;
    font-size: 18px;
    margin-right: 12px;
  }

  .inline-error-message {
    color: #c62828;
    font-size: 14px;
    line-height: 1.4;
  }
`;
document.head.appendChild(style);