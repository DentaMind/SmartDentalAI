
import { WebSocketServer } from 'ws';
import http from 'http';
import jwt from 'jsonwebtoken';
import { securityService } from './services/security';
import { notificationService } from './services/notifications';

export function setupWebSocketServer(server: http.Server) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws, req) => {
    let userId: number | null = null;
    
    // Extract token from URL
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    
    if (!token) {
      // Close connection if no token provided
      ws.close(1008, 'Authentication required');
      return;
    }
    
    // Verify token
    try {
      const decoded = securityService.verifyAccessToken(token);
      
      if (!decoded) {
        ws.close(1008, 'Invalid token');
        return;
      }
      
      userId = decoded.userId;
      
      // Register connection with notification service
      notificationService.registerConnection(userId, ws);
      
      // Send success message
      ws.send(JSON.stringify({
        type: 'connection',
        status: 'established',
        userId
      }));
      
      // Handle ping messages to keep connection alive
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          
          if (data.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong' }));
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });
      
      // Handle connection close
      ws.on('close', () => {
        if (userId !== null) {
          notificationService.removeConnection(userId, ws);
        }
      });
    } catch (error) {
      console.error('WebSocket authentication error:', error);
      ws.close(1008, 'Authentication failed');
    }
  });
  
  console.log('WebSocket server initialized');
  
  return wss;
}
