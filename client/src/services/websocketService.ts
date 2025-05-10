/**
 * WebSocket Service
 * 
 * A robust WebSocket client implementation with auto-reconnection, message validation,
 * and type-safe message handling based on the defined contracts.
 */

import { 
  ServerMessage, 
  ServerMessageSchema, 
  ClientMessage,
  ClientMessageSchema,
  WebSocketStatus,
  MessageHandler,
  isMessageType
} from '../types/websocket-contracts';
import { getWebSocketUrl } from '../config/environment';

// WebSocket events
export interface WebSocketEvents {
  open: () => void;
  close: (event: CloseEvent) => void;
  error: (event: Event) => void;
  statusChange: (status: WebSocketStatus) => void;
  message: (message: ServerMessage) => void;
  reconnect: (attempt: number) => void;
}

// Configuration options for the WebSocket service
export interface WebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  autoReconnect?: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  debug?: boolean;
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onStatusChange?: (status: WebSocketStatus) => void;
  onMessage?: (message: ServerMessage) => void;
  onReconnect?: (attempt: number) => void;
}

/**
 * WebSocket Service class that provides a robust WebSocket client implementation
 */
export class WebSocketService {
  private ws: WebSocket | null = null;
  private status: WebSocketStatus = 'closed';
  private reconnectAttempt = 0;
  private reconnectTimer: number | null = null;
  private messageHandlers: Record<string, Set<MessageHandler<any>>> = {};
  private eventListeners: Record<keyof WebSocketEvents, Set<any>> = {
    open: new Set(),
    close: new Set(),
    error: new Set(),
    statusChange: new Set(),
    message: new Set(),
    reconnect: new Set()
  };
  
  private options: Required<Omit<WebSocketOptions, 'onOpen' | 'onClose' | 'onError' | 'onStatusChange' | 'onMessage' | 'onReconnect'>>;
  
  /**
   * Create a new WebSocket service instance
   */
  constructor(options: WebSocketOptions = {}) {
    // Set default options
    this.options = {
      url: options.url || getWebSocketUrl(),
      autoConnect: options.autoConnect !== undefined ? options.autoConnect : true,
      autoReconnect: options.autoReconnect !== undefined ? options.autoReconnect : true,
      reconnectAttempts: options.reconnectAttempts || 10,
      reconnectInterval: options.reconnectInterval || 2000,
      debug: options.debug || false
    };
    
    // Register event handlers if provided
    if (options.onOpen) this.on('open', options.onOpen);
    if (options.onClose) this.on('close', options.onClose);
    if (options.onError) this.on('error', options.onError);
    if (options.onStatusChange) this.on('statusChange', options.onStatusChange);
    if (options.onMessage) this.on('message', options.onMessage);
    if (options.onReconnect) this.on('reconnect', options.onReconnect);
    
    // Automatically connect if specified
    if (this.options.autoConnect) {
      this.connect();
    }
  }
  
  /**
   * Connect to the WebSocket server
   */
  public connect(): void {
    // Don't connect if already connected or connecting
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    
    this.log('Connecting to WebSocket server...');
    this.setStatus('connecting');
    
    try {
      // Create new WebSocket connection
      this.ws = new WebSocket(this.options.url);
      
      // Set up event handlers
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
    } catch (error) {
      this.log('Error creating WebSocket connection:', error);
      this.setStatus('error');
      this.reconnect();
    }
  }
  
  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    if (this.ws) {
      this.setStatus('closing');
      this.ws.close();
    }
    
    // Clear any pending reconnect timer
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
  
  /**
   * Send a message to the WebSocket server
   * 
   * @param message The message to send
   * @returns True if the message was sent, false otherwise
   */
  public send(message: ClientMessage): boolean {
    // Validate message against schema
    try {
      const result = ClientMessageSchema.safeParse(message);
      if (!result.success) {
        this.log('Invalid message format:', result.error);
        return false;
      }
    } catch (error) {
      this.log('Error validating message:', error);
      return false;
    }
    
    // Check if connection is open
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.log('Cannot send message: WebSocket is not open');
      return false;
    }
    
    try {
      // Add timestamp if not present
      if (!message.timestamp) {
        message.timestamp = new Date().toISOString();
      }
      
      // Send the message
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      this.log('Error sending message:', error);
      return false;
    }
  }
  
  /**
   * Register a message handler for a specific message type
   * 
   * @param type The message type to handle
   * @param handler The handler function
   */
  public on<T extends keyof WebSocketEvents>(
    event: T,
    handler: WebSocketEvents[T]
  ): void {
    this.eventListeners[event].add(handler);
  }
  
  /**
   * Remove an event handler
   * 
   * @param event The event to unregister from
   * @param handler The handler to remove
   */
  public off<T extends keyof WebSocketEvents>(
    event: T,
    handler: WebSocketEvents[T]
  ): void {
    this.eventListeners[event].delete(handler);
  }
  
  /**
   * Register a handler for a specific message type
   * 
   * @param type The message type to handle
   * @param handler The handler function
   */
  public onMessageType<T extends ServerMessage['type']>(
    type: T,
    handler: MessageHandler<Extract<ServerMessage, { type: T }>>
  ): void {
    if (!this.messageHandlers[type]) {
      this.messageHandlers[type] = new Set();
    }
    this.messageHandlers[type].add(handler);
  }
  
  /**
   * Remove a message type handler
   * 
   * @param type The message type to unregister from
   * @param handler The handler to remove
   */
  public offMessageType<T extends ServerMessage['type']>(
    type: T,
    handler: MessageHandler<Extract<ServerMessage, { type: T }>>
  ): void {
    if (this.messageHandlers[type]) {
      this.messageHandlers[type].delete(handler);
    }
  }
  
  /**
   * Get the current connection status
   */
  public getStatus(): WebSocketStatus {
    return this.status;
  }
  
  /**
   * Check if the WebSocket is connected
   */
  public isConnected(): boolean {
    return this.status === 'open';
  }
  
  /**
   * Handle WebSocket open event
   */
  private handleOpen(event: Event): void {
    this.log('WebSocket connection opened');
    this.setStatus('open');
    this.reconnectAttempt = 0;
    
    // Notify listeners
    this.emit('open', event);
  }
  
  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    this.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
    this.setStatus('closed');
    this.ws = null;
    
    // Notify listeners
    this.emit('close', event);
    
    // Attempt to reconnect if enabled
    this.reconnect();
  }
  
  /**
   * Handle WebSocket error event
   */
  private handleError(event: Event): void {
    this.log('WebSocket error:', event);
    this.setStatus('error');
    
    // Notify listeners
    this.emit('error', event);
  }
  
  /**
   * Handle WebSocket message event
   */
  private handleMessage(event: MessageEvent): void {
    let message: ServerMessage;
    
    try {
      // Parse and validate the message
      const data = JSON.parse(event.data);
      const result = ServerMessageSchema.safeParse(data);
      
      if (!result.success) {
        this.log('Received invalid message format:', result.error);
        return;
      }
      
      message = result.data;
    } catch (error) {
      this.log('Error parsing WebSocket message:', error);
      return;
    }
    
    // Notify all message listeners
    this.emit('message', message);
    
    // Call type-specific handlers
    this.handleMessageByType(message);
  }
  
  /**
   * Dispatch a message to type-specific handlers
   */
  private handleMessageByType(message: ServerMessage): void {
    const handlers = this.messageHandlers[message.type];
    
    if (handlers && handlers.size > 0) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          this.log(`Error in message handler for type "${message.type}":`, error);
        }
      });
    }
  }
  
  /**
   * Attempt to reconnect to the WebSocket server
   */
  private reconnect(): void {
    // Don't reconnect if not enabled or max attempts reached
    if (!this.options.autoReconnect || this.reconnectAttempt >= this.options.reconnectAttempts) {
      return;
    }
    
    // Clear any existing reconnect timer
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Increment reconnect attempt counter
    this.reconnectAttempt++;
    
    // Calculate backoff delay (with exponential backoff)
    const delay = Math.min(
      this.options.reconnectInterval * Math.pow(1.5, this.reconnectAttempt - 1),
      30000 // Maximum delay of 30 seconds
    );
    
    this.log(`Reconnecting... Attempt ${this.reconnectAttempt} of ${this.options.reconnectAttempts} in ${delay}ms`);
    
    // Notify listeners
    this.emit('reconnect', this.reconnectAttempt);
    
    // Set reconnect timer
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }
  
  /**
   * Set the connection status and notify listeners
   */
  private setStatus(status: WebSocketStatus): void {
    if (this.status !== status) {
      this.status = status;
      
      // Notify listeners
      this.emit('statusChange', status);
    }
  }
  
  /**
   * Emit an event to all registered listeners
   */
  private emit<T extends keyof WebSocketEvents>(
    event: T,
    ...args: Parameters<WebSocketEvents[T]>
  ): void {
    this.eventListeners[event].forEach(handler => {
      try {
        handler(...args);
      } catch (error) {
        this.log(`Error in ${event} event handler:`, error);
      }
    });
  }
  
  /**
   * Log a message to the console if debug is enabled
   */
  private log(...args: any[]): void {
    if (this.options.debug) {
      console.log('[WebSocketService]', ...args);
    }
  }
}

/**
 * Create a singleton instance of the WebSocket service
 */
export const websocketService = new WebSocketService();

export default websocketService; 