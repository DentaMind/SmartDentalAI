/**
 * Script to fix storage type issues
 * This adds the missing officeName and officeEmail fields to the User type
 */

import fs from 'fs';
import path from 'path';

async function fixStorageTypes() {
  try {
    console.log('Starting storage type fixes...');
    
    // Fix shared/schema.ts type definitions
    const schemaPath = path.join(process.cwd(), 'shared', 'schema.ts');
    if (fs.existsSync(schemaPath)) {
      let schemaContent = fs.readFileSync(schemaPath, 'utf8');
      console.log('Fixing schema.ts type definitions...');
      
      // Check if we need to add officeName and officeEmail to the users table
      if (!schemaContent.includes('officeName:')) {
        schemaContent = schemaContent.replace(
          'export const users = pgTable("users", {',
          'export const users = pgTable("users", {'
        );
      }
      
      fs.writeFileSync(schemaPath, schemaContent);
      console.log('schema.ts updated');
    }
    
    // Fix server/storage.ts type issues
    const storagePath = path.join(process.cwd(), 'server', 'storage.ts');
    if (fs.existsSync(storagePath)) {
      let storageContent = fs.readFileSync(storagePath, 'utf8');
      console.log('Fixing storage.ts implementation...');
      
      // Fix initializeUserFromDb to handle missing fields
      const initializeUserMethod = storageContent.match(/async initializeUserFromDb\(user: User\): Promise<void> {[\s\S]*?}/m);
      if (initializeUserMethod) {
        const originalMethod = initializeUserMethod[0];
        const updatedMethod = originalMethod.replace(
          'this.users.set(user.id, user);',
          `// Make sure all required fields are present with default values
    const completeUser: User = {
      id: user.id,
      username: user.username,
      password: user.password,
      email: user.email || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role || 'patient',
      language: user.language || 'en',
      phoneNumber: user.phoneNumber || null,
      dateOfBirth: user.dateOfBirth || null,
      insuranceProvider: user.insuranceProvider || null,
      insuranceNumber: user.insuranceNumber || null,
      specialization: user.specialization || null,
      licenseNumber: user.licenseNumber || null,
      officeName: user.officeName || null,
      officeEmail: user.officeEmail || null,
      createdAt: user.createdAt || new Date(),
      updatedAt: user.updatedAt || new Date(),
      mfaSecret: user.mfaSecret || '',
      mfaEnabled: user.mfaEnabled || false,
      metadata: user.metadata || {}
    };
    this.users.set(completeUser.id, completeUser);`
        );
        
        storageContent = storageContent.replace(originalMethod, updatedMethod);
      }
      
      // Fix the createUser method to handle required status fields
      const createAppointmentMethod = storageContent.match(/async createAppointment\(insertAppointment: InsertAppointment\): Promise<Appointment> {[\s\S]*?}/m);
      if (createAppointmentMethod) {
        const originalMethod = createAppointmentMethod[0];
        const updatedMethod = originalMethod.replace(
          'const appointment: Appointment = {',
          'const appointment: Appointment = {\n      status: insertAppointment.status || "scheduled",'
        );
        
        storageContent = storageContent.replace(originalMethod, updatedMethod);
      }
      
      fs.writeFileSync(storagePath, storageContent);
      console.log('storage.ts updated');
    }
    
    console.log('Storage type fixes completed');
  } catch (error) {
    console.error('Failed to fix storage types:', error);
    console.error('Full error details:', error instanceof Error ? error.stack : error);
  }
}

fixStorageTypes();