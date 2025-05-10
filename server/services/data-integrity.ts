
import { z } from "zod";
import { storage } from "../storage";

class DataIntegrityService {
  // Validate patient data and ensure it meets requirements
  async validatePatientData(patientData: any): Promise<{ valid: boolean; errors: string[] }> {
    try {
      const patientSchema = z.object({
        firstName: z.string().min(1, "First name is required"),
        lastName: z.string().min(1, "Last name is required"),
        dateOfBirth: z.string().refine(val => {
          const date = new Date(val);
          return !isNaN(date.getTime());
        }, "Invalid date of birth"),
        email: z.string().email("Invalid email address").optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
        insuranceInfo: z.object({
          provider: z.string().optional(),
          policyNumber: z.string().optional(),
          groupNumber: z.string().optional()
        }).optional()
      });
      
      patientSchema.parse(patientData);
      return { valid: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        return { valid: false, errors };
      }
      return { valid: false, errors: ["Unknown validation error"] };
    }
  }
  
  // Validate dental chart data
  async validateDentalChart(chartData: any): Promise<{ valid: boolean; errors: string[] }> {
    try {
      const toothSchema = z.object({
        number: z.string().or(z.number()),
        condition: z.string(),
        notes: z.string().optional(),
        procedures: z.array(z.object({
          type: z.string(),
          date: z.string(),
          provider: z.number().optional(),
          notes: z.string().optional()
        })).optional()
      });
      
      const chartSchema = z.object({
        patientId: z.number(),
        teeth: z.array(toothSchema),
        lastUpdated: z.string().optional()
      });
      
      chartSchema.parse(chartData);
      return { valid: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        return { valid: false, errors };
      }
      return { valid: false, errors: ["Unknown validation error"] };
    }
  }
  
  // Validate appointment data
  async validateAppointment(appointmentData: any): Promise<{ valid: boolean; errors: string[] }> {
    try {
      const appointmentSchema = z.object({
        patientId: z.number(),
        providerId: z.number(),
        date: z.string().refine(val => {
          const date = new Date(val);
          return !isNaN(date.getTime());
        }, "Invalid appointment date"),
        duration: z.number().min(5, "Duration must be at least 5 minutes"),
        reason: z.string().optional(),
        notes: z.string().optional()
      });
      
      appointmentSchema.parse(appointmentData);
      
      // Additional validation: check if the provider is available
      const isProviderAvailable = await this.checkProviderAvailability(
        appointmentData.providerId,
        appointmentData.date,
        appointmentData.duration
      );
      
      if (!isProviderAvailable) {
        return { 
          valid: false, 
          errors: ["Provider is not available at the requested time"] 
        };
      }
      
      return { valid: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        return { valid: false, errors };
      }
      return { valid: false, errors: ["Unknown validation error"] };
    }
  }
  
  // Check for data inconsistencies across the system
  async checkSystemIntegrity(): Promise<{ status: string; issues: any[] }> {
    const issues = [];
    
    // Check for patients without required data
    const patients = await storage.getAllPatients();
    for (const patient of patients) {
      if (!patient.dateOfBirth) {
        issues.push({
          type: "missing_data",
          entity: "patient",
          id: patient.id,
          field: "dateOfBirth",
          message: "Patient is missing date of birth"
        });
      }
    }
    
    // Check for appointments with non-existent providers or patients
    // Implementation would depend on the storage API
    
    // Check for duplicate patient records
    // Implementation would depend on the storage API
    
    return {
      status: issues.length === 0 ? "healthy" : "issues_found",
      issues
    };
  }
  
  // Helper method to check provider availability
  private async checkProviderAvailability(
    providerId: number,
    requestedDate: string,
    duration: number
  ): Promise<boolean> {
    // In a real implementation, this would check the provider's schedule
    // For now, we'll return true for simplicity
    return true;
  }
  
  // Sanitize and format data before storage
  sanitizePatientData(data: any): any {
    // Remove any sensitive fields that shouldn't be stored
    const { ssn, creditCardNumber, ...sanitizedData } = data;
    
    // Format phone numbers consistently
    if (sanitizedData.phone) {
      sanitizedData.phone = this.formatPhoneNumber(sanitizedData.phone);
    }
    
    // Format names (capitalize first letter)
    if (sanitizedData.firstName) {
      sanitizedData.firstName = this.capitalizeFirstLetter(sanitizedData.firstName);
    }
    
    if (sanitizedData.lastName) {
      sanitizedData.lastName = this.capitalizeFirstLetter(sanitizedData.lastName);
    }
    
    return sanitizedData;
  }
  
  // Helper method to format phone numbers
  private formatPhoneNumber(phone: string): string {
    // Remove non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    
    // Return as-is if not 10 digits
    return phone;
  }
  
  // Helper method to capitalize first letter
  private capitalizeFirstLetter(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }
}

export const dataIntegrity = new DataIntegrityService();
