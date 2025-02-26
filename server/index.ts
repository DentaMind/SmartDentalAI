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

// Mount API routes before Vite middleware
server.use("/api", app);

// Error handling middleware
server.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Server error:", err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // Only send JSON responses for API routes
  if (_req.path.startsWith('/api')) {
    res.status(status).json({ message });
  } else {
    _next(err);
  }
});

// Initialize server
(async () => {
  try {
    const PORT = process.env.PORT || 5000;
    const httpServer = server.listen(Number(PORT), "0.0.0.0", () => {
      log(`Server running on port ${PORT}`);
    });

    // Setup Vite after API routes are mounted
    log("Setting up Vite development server...");
    await setupVite(server, httpServer);
  } catch (error) {
    console.error("Server startup error:", error);
    process.exit(1);
  }
})();