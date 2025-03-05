import express, { type Request, Response, NextFunction } from "express";
import { setupVite, log } from "./vite";
import { securityService } from "./services/security"; // Import security service
import http from 'http';
import { setupWebSocketServer } from './websocket';
import dotenv from 'dotenv'; // Import dotenv
import app from './app';

dotenv.config(); // Load environment variables

const server = express();

// Basic middleware
server.use(express.json());
server.use(express.urlencoded({ extended: false }));

// Logging middleware
server.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

// Mount the API routes
server.use(app);

// Error handling middleware
server.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Server error:", err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

// Create HTTP server from Express app
const httpServer = http.createServer(server);

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

// Initialize server
(async () => {
  try {
    // In development, let Vite handle everything
    log("Setting up Vite development server...");
    await setupVite(server);

  } catch (error) {
    console.error("Server startup error:", error);
    process.exit(1);
  }
})();