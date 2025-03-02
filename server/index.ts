import express, { type Request, Response, NextFunction } from "express";
import { setupVite, log } from "./vite";
import app from "./app";
import http from 'http';
import { setupWebSocketServer } from './websocket';

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

// Start the HTTP server (which hosts both Express and WebSocket)
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});

// Create HTTP server from Express app
const httpServer = http.createServer(server);

// Setup WebSocket server
const wsServer = setupWebSocketServer(httpServer);
const httpServer = http.createServer(server);

// Setup WebSocket server
setupWebSocketServer(httpServer);


// Initialize server
(async () => {
  try {
    // In development, let Vite handle everything
    log("Setting up Vite development server...");
    await setupVite(server);

    const PORT = process.env.PORT || 5000;
    httpServer.listen(Number(PORT), "0.0.0.0", () => {
      log(`Server running on port ${PORT}`);
      console.log(`WebSocket server available at ws://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup error:", error);
    process.exit(1);
  }
})();