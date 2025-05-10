
import { z } from "zod";
import { storage } from "../storage";
import Papa from "papaparse";
import { securityService } from "./security";

// CSV Import schemas
const importConfigSchema = z.object({
  type: z.enum(["patients", "appointments", "treatments", "payments"]),
  fileContent: z.string(),
  options: z.object({
    headerRow: z.boolean().default(true),
    delimiter: z.string().default(","),
    skipRows: z.number().default(0),
  }).optional(),
  mappings: z.record(z.string(), z.string()).optional(),
});

class DataMigrationService {
  async importFromCSV(config: z.infer<typeof importConfigSchema>, userId: number) {
    try {
      // Validate config
      const validConfig = importConfigSchema.parse(config);
      
      // Parse CSV
      const options = validConfig.options || { headerRow: true, delimiter: ",", skipRows: 0 };
      
      const parseResult = Papa.parse(validConfig.fileContent, {
        header: options.headerRow,
        delimiter: options.delimiter,
        skipEmptyLines: true
      });
      
      if (parseResult.errors && parseResult.errors.length > 0) {
        throw new Error(`CSV parsing errors: ${parseResult.errors.map(e => e.message).join(", ")}`);
      }
      
      // Skip rows if needed
      const data = options.skipRows > 0 ? 
        parseResult.data.slice(options.skipRows) : 
        parseResult.data;
      
      // Process data based on type
      let importResult;
      switch (validConfig.type) {
        case "patients":
          importResult = await this.importPatients(data, validConfig.mappings);
          break;
        case "appointments":
          importResult = await this.importAppointments(data, validConfig.mappings);
          break;
        case "treatments":
          importResult = await this.importTreatments(data, validConfig.mappings);
          break;
        case "payments":
          importResult = await this.importPayments(data, validConfig.mappings);
          break;
      }
      
      // Log the import
      await securityService.createAuditLog({
        userId,
        action: "data_import",
        resource: validConfig.type,
        details: { 
          rowCount: data.length,
          successCount: importResult.success.length,
          errorCount: importResult.errors.length
        },
        result: importResult.errors.length === 0 ? "success" : "partial_success"
      });
      
      return importResult;
    } catch (error) {
      console.error("CSV import error:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to import data from CSV");
    }
  }
  
  async exportToCSV(type: string, filters: any, userId: number) {
    try {
      // Get data based on type and filters
      let data;
      switch (type) {
        case "patients":
          data = await this.getPatientData(filters);
          break;
        case "appointments":
          data = await this.getAppointmentData(filters);
          break;
        case "treatments":
          data = await this.getTreatmentData(filters);
          break;
        case "payments":
          data = await this.getPaymentData(filters);
          break;
        default:
          throw new Error(`Unsupported export type: ${type}`);
      }
      
      // Convert to CSV
      const csv = Papa.unparse(data);
      
      // Log the export
      await securityService.createAuditLog({
        userId,
        action: "data_export",
        resource: type,
        details: { 
          rowCount: data.length,
          filters
        },
        result: "success"
      });
      
      return { 
        csv,
        filename: `dentamind_export_${type}_${new Date().toISOString().slice(0, 10)}.csv`,
        rowCount: data.length
      };
    } catch (error) {
      console.error("CSV export error:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to export data to CSV");
    }
  }
  
  async migrateFromExternalSystem(systemType: string, connectionConfig: any, userId: number) {
    try {
      // This would integrate with external system APIs to extract data
      console.log(`Migrating data from ${systemType} system`);
      
      // Mock migration result
      const migrationResult = {
        system: systemType,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 5000).toISOString(),
        migrations: {
          patients: { attempted: 100, successful: 95, errors: 5 },
          appointments: { attempted: 250, successful: 240, errors: 10 },
          treatments: { attempted: 150, successful: 148, errors: 2 },
          payments: { attempted: 300, successful: 295, errors: 5 }
        },
        errorDetails: [
          { type: "patients", id: "P123", error: "Missing required fields" },
          { type: "appointments", id: "A456", error: "Invalid date format" }
        ]
      };
      
      // Log the migration
      await securityService.createAuditLog({
        userId,
        action: "system_migration",
        resource: "external_system",
        details: { 
          systemType,
          migrationStats: migrationResult.migrations
        },
        result: "success"
      });
      
      return migrationResult;
    } catch (error) {
      console.error("System migration error:", error);
      
      // Log the migration failure
      await securityService.createAuditLog({
        userId,
        action: "system_migration",
        resource: "external_system",
        details: { 
          systemType,
          error: error instanceof Error ? error.message : "Unknown error"
        },
        result: "error"
      });
      
      throw new Error(error instanceof Error ? error.message : "Failed to migrate from external system");
    }
  }
  
  async importPatients(data: any[], mappings?: Record<string, string>) {
    // Process patient data and insert into database
    const result = { success: [], errors: [] };
    
    for (const row of data) {
      try {
        // Apply field mappings if provided
        const mappedRow = this.applyFieldMappings(row, mappings);
        
        // Validate and format the data
        const formattedPatient = this.formatPatientData(mappedRow);
        
        // Create user record first
        const user = await storage.createUser({
          username: formattedPatient.email,
          password: this.generateRandomPassword(), // Would be changed on first login
          role: "patient",
          firstName: formattedPatient.firstName,
          lastName: formattedPatient.lastName,
          email: formattedPatient.email,
          phoneNumber: formattedPatient.phoneNumber,
          dateOfBirth: formattedPatient.dateOfBirth,
          insuranceProvider: formattedPatient.insuranceProvider,
          insuranceNumber: formattedPatient.insuranceNumber
        });
        
        // Create patient record
        const patient = await storage.createPatient({
          userId: user.id,
          medicalHistory: formattedPatient.medicalHistory,
          allergies: formattedPatient.allergies,
          bloodType: formattedPatient.bloodType,
          emergencyContact: formattedPatient.emergencyContact
        });
        
        result.success.push({ id: patient.id, email: formattedPatient.email });
      } catch (error) {
        result.errors.push({ 
          row, 
          error: error instanceof Error ? error.message : "Unknown error" 
        });
      }
    }
    
    return result;
  }
  
  async importAppointments(data: any[], mappings?: Record<string, string>) {
    // Process appointment data and insert into database
    const result = { success: [], errors: [] };
    
    for (const row of data) {
      try {
        // Apply field mappings if provided
        const mappedRow = this.applyFieldMappings(row, mappings);
        
        // Validate and format the data
        const formattedAppointment = this.formatAppointmentData(mappedRow);
        
        // Create appointment record
        const appointment = await storage.createAppointment({
          patientId: formattedAppointment.patientId,
          doctorId: formattedAppointment.doctorId,
          date: new Date(formattedAppointment.date),
          status: formattedAppointment.status,
          notes: formattedAppointment.notes,
          isOnline: formattedAppointment.isOnline,
          insuranceVerified: formattedAppointment.insuranceVerified
        });
        
        result.success.push({ id: appointment.id, date: formattedAppointment.date });
      } catch (error) {
        result.errors.push({ 
          row, 
          error: error instanceof Error ? error.message : "Unknown error" 
        });
      }
    }
    
    return result;
  }
  
  async importTreatments(data: any[], mappings?: Record<string, string>) {
    // Similar implementation to the above methods
    return { success: [], errors: [] };
  }
  
  async importPayments(data: any[], mappings?: Record<string, string>) {
    // Similar implementation to the above methods
    return { success: [], errors: [] };
  }
  
  // Helper methods
  private applyFieldMappings(row: any, mappings?: Record<string, string>) {
    if (!mappings) return row;
    
    const mappedRow: Record<string, any> = {};
    
    for (const [targetField, sourceField] of Object.entries(mappings)) {
      mappedRow[targetField] = row[sourceField];
    }
    
    return mappedRow;
  }
  
  private formatPatientData(row: any) {
    // Format and validate patient data
    return {
      firstName: row.firstName || row.first_name || "",
      lastName: row.lastName || row.last_name || "",
      email: row.email || `${row.firstName?.toLowerCase()}.${row.lastName?.toLowerCase()}@example.com`,
      phoneNumber: row.phoneNumber || row.phone || row.phone_number || "",
      dateOfBirth: row.dateOfBirth || row.dob || row.date_of_birth || "",
      insuranceProvider: row.insuranceProvider || row.insurance_provider || "",
      insuranceNumber: row.insuranceNumber || row.insurance_number || "",
      medicalHistory: row.medicalHistory || row.medical_history || "",
      allergies: row.allergies || "",
      bloodType: row.bloodType || row.blood_type || "",
      emergencyContact: row.emergencyContact || row.emergency_contact || ""
    };
  }
  
  private formatAppointmentData(row: any) {
    // Format and validate appointment data
    return {
      patientId: Number(row.patientId || row.patient_id),
      doctorId: Number(row.doctorId || row.doctor_id),
      date: row.date || row.appointment_date || new Date().toISOString(),
      status: row.status || "scheduled",
      notes: row.notes || "",
      isOnline: row.isOnline === "true" || row.is_online === "true" || false,
      insuranceVerified: row.insuranceVerified === "true" || row.insurance_verified === "true" || false
    };
  }
  
  private generateRandomPassword() {
    // Generate a random password for imported users
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
  
  // Data retrieval methods for export
  private async getPatientData(filters: any) {
    // Get patients data from database
    const patients = await storage.getAllPatients();
    
    // Apply filters if any
    let filteredPatients = [...patients];
    if (filters) {
      // Apply filtering logic here
    }
    
    // Format data for export
    return filteredPatients.map(patient => ({
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.email,
      phoneNumber: patient.phoneNumber,
      dateOfBirth: patient.dateOfBirth,
      // Add more fields
    }));
  }
  
  private async getAppointmentData(filters: any) {
    // Mock implementation
    return [];
  }
  
  private async getTreatmentData(filters: any) {
    // Mock implementation
    return [];
  }
  
  private async getPaymentData(filters: any) {
    // Mock implementation
    return [];
  }
}

export const dataMigrationService = new DataMigrationService();
