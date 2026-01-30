// Server-Sent Events client with automatic reconnection
export class SSEClient {
    constructor(url, options = {}) {
        this.url = url;
        this.options = {
            reconnectDelay: 1000,
            maxReconnectDelay: 30000,
            reconnectDecay: 1.5,
            ...options
        };
        
        this.eventSource = null;
        this.reconnectTimeout = null;
        this.reconnectAttempts = 0;
        this.listeners = new Map();
        this.connectionListeners = [];
    }
    
    connect() {
        if (this.eventSource && this.eventSource.readyState !== EventSource.CLOSED) {
            return;
        }
        
        try {
            this.eventSource = new EventSource(this.url);
            
            this.eventSource.onopen = () => {
                console.log('SSE connection established');
                this.reconnectAttempts = 0;
                this.notifyConnectionListeners('connected');
            };
            
            this.eventSource.onerror = (error) => {
                console.error('SSE connection error:', error);
                this.notifyConnectionListeners('error');
                
                if (this.eventSource.readyState === EventSource.CLOSED) {
                    this.scheduleReconnect();
                }
            };
            
            this.eventSource.onmessage = (event) => {
                this.handleMessage(event);
            };
            
            // Re-attach all existing event listeners
            this.listeners.forEach((handlers, eventType) => {
                handlers.forEach(handler => {
                    this.eventSource.addEventListener(eventType, handler);
                });
            });
            
        } catch (error) {
            console.error('Failed to create EventSource:', error);
            this.scheduleReconnect();
        }
    }
    
    disconnect() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
            this.notifyConnectionListeners('disconnected');
        }
    }
    
    scheduleReconnect() {
        if (this.reconnectTimeout) {
            return;
        }
        
        const delay = Math.min(
            this.options.reconnectDelay * Math.pow(this.options.reconnectDecay, this.reconnectAttempts),
            this.options.maxReconnectDelay
        );
        
        console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);
        this.notifyConnectionListeners('reconnecting', { delay, attempt: this.reconnectAttempts + 1 });
        
        this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            this.reconnectAttempts++;
            this.connect();
        }, delay);
    }
    
    on(eventType, handler) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, new Set());
        }
        
        this.listeners.get(eventType).add(handler);
        
        // If already connected, add listener to current EventSource
        if (this.eventSource && this.eventSource.readyState === EventSource.OPEN) {
            if (eventType === 'message') {
                // Default message event is already handled
            } else {
                this.eventSource.addEventListener(eventType, handler);
            }
        }
        
        return () => this.off(eventType, handler);
    }
    
    off(eventType, handler) {
        const handlers = this.listeners.get(eventType);
        if (handlers) {
            handlers.delete(handler);
            if (handlers.size === 0) {
                this.listeners.delete(eventType);
            }
        }
        
        if (this.eventSource && eventType !== 'message') {
            this.eventSource.removeEventListener(eventType, handler);
        }
    }
    
    onConnection(listener) {
        this.connectionListeners.push(listener);
        return () => {
            const index = this.connectionListeners.indexOf(listener);
            if (index > -1) {
                this.connectionListeners.splice(index, 1);
            }
        };
    }
    
    notifyConnectionListeners(status, data = {}) {
        this.connectionListeners.forEach(listener => {
            listener({ status, ...data });
        });
    }
    
    handleMessage(event) {
        const handlers = this.listeners.get('message');
        if (handlers) {
            handlers.forEach(handler => handler(event));
        }
    }
    
    getState() {
        if (!this.eventSource) {
            return 'disconnected';
        }
        
        switch (this.eventSource.readyState) {
            case EventSource.CONNECTING:
                return 'connecting';
            case EventSource.OPEN:
                return 'connected';
            case EventSource.CLOSED:
                return 'disconnected';
            default:
                return 'unknown';
        }
    }
}