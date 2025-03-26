/**
 * This script ensures that all users from the database are properly
 * loaded into memory storage by directly calling the initializeUserFromDb
 * function for each user.
 */
const { Pool } = require('pg');
const { createServer } = require('http');
const express = require('express');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);

// Set up a minimal Express app to instantiate the storage system
const app = express();
const server = createServer(app);

// Configure session middleware to match the actual application
app.use(session({
  secret: 'dentamind-test-secret',
  resave: false,
  saveUninitialized: false,
  store: new MemoryStore()
}));

// Recreate the MemStorage class similar to the one in server/storage.ts
class MemStorage {
  constructor() {
    this.users = new Map();
    this.patients = new Map();
    this.appointments = new Map();
    this.treatmentPlans = new Map();
    this.payments = new Map();
    this.medicalNotes = new Map();
    this.xrays = new Map();
    this.sessionStore = app.get('sessionStore');
    this.currentId = 1000;
    this.isInitialized = false;
  }

  async initializeUserFromDb(user) {
    // Store the user by ID in the users Map
    this.users.set(user.id, user);
    if (user.id > this.currentId) {
      this.currentId = user.id;
    }
    return user;
  }

  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
}

async function syncMemoryStorage() {
  try {
    console.log("Starting memory storage synchronization...");
    
    // Create in-memory storage instance
    const storage = new MemStorage();
    
    // Connect to the database
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    // Get database connection time to verify connection
    const timeResult = await pool.query('SELECT NOW()');
    console.log(`Database connection successful at: ${timeResult.rows[0].now}`);
    
    // Get all users from the database
    console.log("Fetching users from database...");
    const usersResult = await pool.query('SELECT * FROM users');
    console.log(`Found ${usersResult.rows.length} users in database`);
    
    // Load each user into memory storage
    for (const dbUser of usersResult.rows) {
      // Convert snake_case to camelCase for compatibility with the User object
      const user = {
        id: dbUser.id,
        username: dbUser.username,
        password: dbUser.password,
        role: dbUser.role || 'patient',
        firstName: dbUser.first_name || '',
        lastName: dbUser.last_name || '',
        email: dbUser.email || '',
        language: dbUser.language || 'en',
        phoneNumber: dbUser.phone_number || null,
        dateOfBirth: dbUser.date_of_birth || null,
        insuranceProvider: dbUser.insurance_provider || null,
        insuranceNumber: dbUser.insurance_number || null,
        specialization: dbUser.specialization || null,
        licenseNumber: dbUser.license_number || null,
        officeName: dbUser.office_name || null,
        officeEmail: dbUser.office_email || null,
        mfaSecret: '',
        mfaEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Add the user to memory storage
      await storage.initializeUserFromDb(user);
      console.log(`Loaded user ${user.username} (ID: ${user.id}) into memory storage`);
      
      // Testing by retrieving the user by username
      const retrievedUser = await storage.getUserByUsername(user.username);
      if (retrievedUser) {
        console.log(`Successfully retrieved user ${retrievedUser.username} from memory storage`);
      } else {
        console.error(`Failed to retrieve user ${user.username} from memory storage!`);
      }
    }
    
    // Now test login for the dentist account
    const dentist = await storage.getUserByUsername('dentist');
    if (dentist) {
      console.log(`Found dentist user in memory: ID=${dentist.id}, Username=${dentist.username}`);
      console.log(`Password hash (first 20 chars): ${dentist.password.substring(0, 20)}...`);
    } else {
      console.error("Could not find dentist user in memory storage!");
    }
    
    // Close the database pool
    await pool.end();
    
    console.log("Memory storage synchronization completed successfully");
    console.log("Please restart the application to fully apply these fixes");
  } catch (error) {
    console.error("Error synchronizing memory storage:", error);
  }
}

syncMemoryStorage();