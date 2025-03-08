import http from 'http';
import { setupWebSocketServer } from './websocket';
import dotenv from 'dotenv';
import app from './app';
import { setupVite, log } from "./vite";
import { securityService } from "./services/security";

dotenv.config();

const startServer = async () => {
  try {
    console.log('Starting server initialization...');

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

    console.log('Creating HTTP server...');
    // Create HTTP server from Express app
    const httpServer = http.createServer(app);

    console.log('Setting up WebSocket server...');
    // Setup WebSocket server
    const wsServer = setupWebSocketServer(httpServer);

    // Start the server first
    const PORT = Number(process.env.PORT) || 5000;
    console.log(`Attempting to start server on port ${PORT}...`);

    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`Server listening on port ${PORT}`);
      console.log(`http://localhost:${PORT}`);
      console.log(`WebSocket server available at ws://localhost:${PORT}`);
    });

    // After server is listening, setup Vite in development
    if (process.env.NODE_ENV !== 'production') {
      try {
        log("Setting up Vite development server...");
        await setupVite(app);
        console.log('Vite development server setup complete');
      } catch (error) {
        console.error("Vite setup error:", error);
        console.error("Full error details:", error instanceof Error ? error.stack : error);
        // Don't exit on Vite error, just log it
        console.warn("Continuing without Vite development server");
      }
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    console.error('Full error details:', error instanceof Error ? error.stack : error);
    process.exit(1);
  }
};

startServer().catch(error => {
  console.error('Unhandled startup error:', error);
  console.error('Full error details:', error instanceof Error ? error.stack : error);
  process.exit(1);
});