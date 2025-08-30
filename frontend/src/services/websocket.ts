// WebSocket service for real-time communication

export interface WebSocketMessage {
  type: string;
  data: any;
}

export type WebSocketEventHandler = (data: any) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectInterval: number = 1000;
  private maxReconnectInterval: number = 30000;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10; // Increased from 5
  private eventHandlers: Map<string, WebSocketEventHandler[]> = new Map();
  private url: string;
  private connectionHealthTimer: NodeJS.Timeout | null = null;
  private lastPongReceived: number = 0;
  private connectionValidated: boolean = false;
  private permanentFailureCallback: (() => void) | null = null;

  constructor() {
    // Use current origin with ws protocol in production, localhost:8080 in development
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.url = process.env.NODE_ENV === 'production' 
      ? `${protocol}//${window.location.host}/ws`
      : 'ws://localhost:8080/ws';
  }

  connect(): void {
    // Prevent multiple connections
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected, skipping connection attempt');
      return;
    }
    
    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.reconnectInterval = 1000;
        this.connectionValidated = false;
        this.startConnectionHealthCheck();
        // Send initial ping to validate connection
        setTimeout(() => this.validateConnection(), 500);
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.attemptReconnect();
    }
  }

  disconnect(): void {
    this.stopConnectionHealthCheck();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connectionValidated = false;
  }

  send(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  // Send ping to keep connection alive
  ping(): void {
    this.send({
      type: 'ping',
      data: Date.now()
    });
  }

  private handleMessage(message: WebSocketMessage): void {
    // Handle pong response for connection validation
    if (message.type === 'pong') {
      this.lastPongReceived = Date.now();
      if (!this.connectionValidated) {
        this.connectionValidated = true;
        console.log('✅ WebSocket connection validated');
      }
      return;
    }
    
    const handlers = this.eventHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message.data);
        } catch (error) {
          console.error(`Error in WebSocket handler for ${message.type}:`, error);
        }
      });
    }
  }

  private attemptReconnect(): void {
    this.stopConnectionHealthCheck();
    this.connectionValidated = false;
    
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached. Suggesting page refresh.');
      if (this.permanentFailureCallback) {
        this.permanentFailureCallback();
      } else {
        // Fallback: auto-refresh after 5 seconds
        console.warn('WebSocket permanently failed. Auto-refreshing page in 5 seconds...');
        setTimeout(() => {
          if (window.confirm('网络连接异常，是否刷新页面？')) {
            window.location.reload();
          }
        }, 5000);
      }
      return;
    }

    setTimeout(() => {
      console.log(`Attempting to reconnect... (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
      this.reconnectAttempts++;
      this.connect();
      
      // Exponential backoff
      this.reconnectInterval = Math.min(
        this.reconnectInterval * 2,
        this.maxReconnectInterval
      );
    }, this.reconnectInterval);
  }

  // Event subscription methods
  on(eventType: string, handler: WebSocketEventHandler): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    
    const handlers = this.eventHandlers.get(eventType)!;
    handlers.push(handler);

    // Return unsubscribe function
    return () => {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    };
  }

  off(eventType: string, handler: WebSocketEventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // Convenience methods for specific events
  onConfigUpdated(handler: WebSocketEventHandler): () => void {
    return this.on('config_updated', handler);
  }

  onSpinStarted(handler: WebSocketEventHandler): () => void {
    return this.on('spin_started', handler);
  }

  onSpinCompleted(handler: WebSocketEventHandler): () => void {
    return this.on('spin_completed', handler);
  }

  onStateUpdated(handler: WebSocketEventHandler): () => void {
    return this.on('state_updated', handler);
  }

  onConnected(handler: WebSocketEventHandler): () => void {
    return this.on('connected', handler);
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN && this.connectionValidated;
  }
  
  private startConnectionHealthCheck(): void {
    this.stopConnectionHealthCheck();
    this.connectionHealthTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // Send ping and check if pong was received recently
        const now = Date.now();
        if (this.lastPongReceived > 0 && now - this.lastPongReceived > 35000) {
          console.warn('Connection health check failed - no pong received');
          this.ws.close(); // This will trigger reconnection
          return;
        }
        this.ping();
      }
    }, 15000); // Check every 15 seconds
  }
  
  private stopConnectionHealthCheck(): void {
    if (this.connectionHealthTimer) {
      clearInterval(this.connectionHealthTimer);
      this.connectionHealthTimer = null;
    }
  }
  
  private validateConnection(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ping();
      // If no pong received within 10 seconds, consider connection invalid
      setTimeout(() => {
        if (!this.connectionValidated) {
          console.warn('Connection validation failed - no pong response');
          this.ws?.close(); // This will trigger reconnection
        }
      }, 10000);
    }
  }
  
  onPermanentFailure(callback: () => void): void {
    this.permanentFailureCallback = callback;
  }
  
  getConnectionStatus(): 'connected' | 'connecting' | 'disconnected' {
    if (!this.ws) return 'disconnected';
    if (this.ws.readyState === WebSocket.OPEN && this.connectionValidated) return 'connected';
    if (this.ws.readyState === WebSocket.CONNECTING || !this.connectionValidated) return 'connecting';
    return 'disconnected';
  }
}

export const wsService = new WebSocketService();