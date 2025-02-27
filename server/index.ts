import express, { type Request, Response, NextFunction } from "express";
import { setupVite, log } from "./vite";
import app from "./app";

const server = express();

// Basic middleware
server.use(express.json());
server.use(express.urlencoded({ extended: false }));

// Logging middleware
server.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
  });
  next();
});

// Initialize server
const httpServer = server.listen(Number(process.env.PORT || 5000), "0.0.0.0", () => {
  log(`Server running on port ${process.env.PORT || 5000}`);
});

// Mount the API routes
server.use("/api", app);

// Error handling middleware
server.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Server error:", err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

// Setup Vite last
setupVite(server, httpServer).catch(console.error);