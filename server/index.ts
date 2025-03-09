import http from 'http';
import { setupWebSocketServer } from './websocket';
import dotenv from 'dotenv';
import app from './app';
import { setupVite, log } from "./vite";
import { securityService } from "./services/security";
import { schedulerService } from "./services/scheduler";
import { seedDatabase } from "./seed-data";

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
    
    // Initialize automated appointment reminders
    try {
      console.log('Initializing automated appointment reminders...');
      const reminderSetup = await schedulerService.setupAutomatedReminders();
      console.log(`Appointment reminders initialized: ${reminderSetup.message}`);
    } catch (error) {
      console.error('Failed to set up appointment reminders:', error);
      console.error('Full error details:', error instanceof Error ? error.stack : error);
      // Don't exit on reminder setup error, just log it
      console.warn('Continuing without automated reminders');
    }
    
    // Seed the database with test data if in development mode
    if (process.env.NODE_ENV !== 'production') {
      try {
        console.log('Seeding database with test data...');
        const seedData = await seedDatabase();
        console.log('Database seeding completed. Test credentials:');
        console.log('Dentist:', seedData.dentist);
        console.log('Patients:', seedData.patients);
      } catch (error) {
        console.error('Failed to seed database:', error);
        console.error('Full error details:', error instanceof Error ? error.stack : error);
        // Don't exit on seeding error, just log it
        console.warn('Continuing without seeding database');
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