
import { WebSocketServer } from 'ws';
import http from 'http';
import { securityService } from './services/security';
import { notificationService } from './services/notifications';

interface WebSocketUser {
  userId: number;
  role: string;
}

export function setupWebSocketServer(server: http.Server) {
  const wss = new WebSocketServer({ server });
  
  // Map to store active connections
  const clients = new Map<string, { socket: WebSocket, user?: WebSocketUser }>();
  
  wss.on('connection', (socket: any) => {
    const id = crypto.randomUUID();
    clients.set(id, { socket });
    
    console.log(`WebSocket client connected: ${id}`);
    
    socket.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        
        // Handle auth messages
        if (data.type === 'auth') {
          // Verify the token
          const decoded = securityService.verifyJWT(data.token);
          if (!decoded) {
            socket.send(JSON.stringify({ 
              type: 'error', 
              message: 'Invalid authentication token' 
            }));
            return;
          }
          
          // Store user info with the connection
          clients.set(id, { 
            socket, 
            user: {
              userId: (decoded as any).userId,
              role: (decoded as any).role
            }
          });
          
          // Log authentication
          securityService.createAuditLog({
            userId: (decoded as any).userId,
            action: 'websocket_auth',
            resource: 'websocket',
            result: 'success'
          });
          
          // Confirm successful authentication
          socket.send(JSON.stringify({ 
            type: 'auth_success', 
            userId: (decoded as any).userId 
          }));
          
          // Send any pending notifications
          const pendingNotifications = await notificationService.getPendingNotifications(
            (decoded as any).userId
          );
          
          if (pendingNotifications.length > 0) {
            socket.send(JSON.stringify({
              type: 'notifications',
              notifications: pendingNotifications
            }));
          }
          
          return;
        }
        
        // For all other message types, ensure the client is authenticated
        const client = clients.get(id);
        if (!client?.user) {
          socket.send(JSON.stringify({ 
            type: 'error', 
            message: 'Authentication required' 
          }));
          return;
        }
        
        // Handle subscription messages
        if (data.type === 'subscribe') {
          // Check if user has permission for this topic
          const canSubscribe = await securityService.checkAccessPermission({
            userId: client.user.userId,
            role: client.user.role,
            resource: data.topic,
            action: 'read'
          });
          
          if (!canSubscribe.permitted) {
            socket.send(JSON.stringify({
              type: 'error',
              message: `Not permitted to subscribe to ${data.topic}`
            }));
            return;
          }
          
          // Add subscription handling here
          console.log(`User ${client.user.userId} subscribed to ${data.topic}`);
          
          socket.send(JSON.stringify({
            type: 'subscribe_success',
            topic: data.topic
          }));
          
          return;
        }
        
        // Handle other message types as needed
        console.log(`Received message from ${client.user.userId}:`, data);
        
      } catch (error) {
        console.error('WebSocket message error:', error);
        socket.send(JSON.stringify({ 
          type: 'error', 
          message: 'Invalid message format' 
        }));
      }
    });
    
    socket.on('close', () => {
      // Clean up when client disconnects
      clients.delete(id);
      console.log(`WebSocket client disconnected: ${id}`);
    });
    
    socket.on('error', (error) => {
      console.error(`WebSocket error for client ${id}:`, error);
      clients.delete(id);
    });
  });
  
  // Broadcast function - send to all authenticated users
  const broadcast = (message: any, filter?: (user: WebSocketUser) => boolean) => {
    const messageStr = JSON.stringify(message);
    
    for (const client of clients.values()) {
      // Skip unauthenticated clients
      if (!client.user) continue;
      
      // Apply filter if provided
      if (filter && !filter(client.user)) continue;
      
      client.socket.send(messageStr);
    }
  };
  
  // Send to specific user
  const sendToUser = (userId: number, message: any) => {
    const messageStr = JSON.stringify(message);
    
    for (const client of clients.values()) {
      if (client.user?.userId === userId) {
        client.socket.send(messageStr);
      }
    }
  };
  
  // Send to users with specific role
  const sendToRole = (role: string, message: any) => {
    const messageStr = JSON.stringify(message);
    
    for (const client of clients.values()) {
      if (client.user?.role === role) {
        client.socket.send(messageStr);
      }
    }
  };
  
  // Return methods that can be used elsewhere in the application
  return {
    broadcast,
    sendToUser,
    sendToRole
  };
}
