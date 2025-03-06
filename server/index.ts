import http from 'http';
import { setupWebSocketServer } from './websocket';
import dotenv from 'dotenv'; // Import dotenv
import app from './app';
import { setupVite, log } from "./vite";
import { securityService } from "./services/security"; // Import security service

dotenv.config(); // Load environment variables

// Create HTTP server from Express app
const httpServer = http.createServer(app);

// Setup WebSocket server
const wsServer = setupWebSocketServer(httpServer);

// Start the HTTP server (which hosts both Express and WebSocket)
const PORT = process.env.PORT || 3000;

// Perform initial security checks
const startServer = async () => {
  try {
    // Check file integrity before starting
    const integrityCheck = await securityService.performIntegrityCheck();
    if (integrityCheck.status === 'compromised') {
      console.error('CRITICAL SECURITY ALERT: File integrity check failed before startup!');
      console.error('Compromised files:', integrityCheck.compromisedFiles);

      if (process.env.NODE_ENV === 'production') {
        console.error('Refusing to start server due to security concerns.');
        process.exit(1);
      } else {
        console.warn('Starting anyway because we are in development mode');
      }
    }

    // Initialize server
    try {
      // In development, let Vite handle everything
      log("Setting up Vite development server...");
      await setupVite(app, httpServer);
    } catch (error) {
      console.error("Vite setup error:", error);
    }

    httpServer.listen(PORT, '0.0.0.0', () => { // Listen on 0.0.0.0
      console.log(`Server listening on port ${PORT}`);
      console.log(`http://localhost:${PORT}`);
      console.log(`WebSocket server available at ws://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();