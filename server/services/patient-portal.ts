
import { z } from "zod";
import { storage } from "../storage";
import { aiCoordinator } from "./ai-coordinator";
import crypto from "crypto";

// Validation schemas
const messageSchema = z.object({
  patientId: z.number(),
  providerId: z.number().optional(),
  content: z.string().min(1),
  attachments: z.array(z.string()).optional()
});

const appointmentRequestSchema = z.object({
  patientId: z.number(),
  requestedDates: z.array(z.string()),
  reason: z.string(),
  preferredProvider: z.number().optional(),
  notes: z.string().optional(),
  urgency: z.enum(["low", "medium", "high"]).optional()
});

const documentShareSchema = z.object({
  patientId: z.number(),
  documentType: z.enum(["xray", "lab", "prescription", "consent", "other"]),
  documentUrl: z.string().url(),
  description: z.string().optional(),
  shareWithProvider: z.boolean().default(true)
});

class PatientPortalService {
  async sendMessage(messageData: unknown) {
    try {
      const validatedData = messageSchema.parse(messageData);
      
      // Check if patient exists
      const patient = await storage.getPatient(validatedData.patientId);
      if (!patient) {
        throw new Error("Patient not found");
      }
      
      // If provider specified, check if they exist
      if (validatedData.providerId) {
        const provider = await storage.getProvider(validatedData.providerId);
        if (!provider) {
          throw new Error("Provider not found");
        }
      }
      
      // Store message
      const message = await storage.createMessage({
        ...validatedData,
        timestamp: new Date().toISOString(),
        read: false
      });
      
      // In a real system, send notification to recipient
      
      return message;
    } catch (error) {
      console.error("Message sending error:", error);
      throw error;
    }
  }
  
  async requestAppointment(requestData: unknown) {
    try {
      const validatedData = appointmentRequestSchema.parse(requestData);
      
      // Check if patient exists
      const patient = await storage.getPatient(validatedData.patientId);
      if (!patient) {
        throw new Error("Patient not found");
      }
      
      // Validate dates (ensure they're in the future)
      const now = new Date();
      const validDates = validatedData.requestedDates.filter(date => {
        const requestDate = new Date(date);
        return requestDate > now;
      });
      
      if (validDates.length === 0) {
        throw new Error("All requested dates are invalid (must be in the future)");
      }
      
      // Create appointment request
      const appointmentRequest = await storage.createAppointmentRequest({
        ...validatedData,
        requestedDates: validDates,
        status: "pending",
        createdAt: new Date().toISOString()
      });
      
      // In a real system, send notification to staff/provider
      
      return appointmentRequest;
    } catch (error) {
      console.error("Appointment request error:", error);
      throw error;
    }
  }
  
  async shareDocument(documentData: unknown) {
    try {
      const validatedData = documentShareSchema.parse(documentData);
      
      // Check if patient exists
      const patient = await storage.getPatient(validatedData.patientId);
      if (!patient) {
        throw new Error("Patient not found");
      }
      
      // Generate a secure access token for the document
      const accessToken = crypto.randomBytes(16).toString("hex");
      
      // Store document in patient records
      const document = await storage.createPatientDocument({
        ...validatedData,
        accessToken,
        uploadedAt: new Date().toISOString()
      });
      
      return {
        documentId: document.id,
        accessUrl: `/api/documents/${document.id}?token=${accessToken}`
      };
    } catch (error) {
      console.error("Document sharing error:", error);
      throw error;
    }
  }
  
  async getPatientTimeline(patientId: number) {
    try {
      // Check if patient exists
      const patient = await storage.getPatient(patientId);
      if (!patient) {
        throw new Error("Patient not found");
      }
      
      // Get all patient interactions
      const appointments = await storage.getPatientAppointments(patientId);
      const treatments = await storage.getPatientTreatments(patientId);
      const messages = await storage.getPatientMessages(patientId);
      const payments = await storage.getPatientPayments(patientId);
      
      // Combine and sort by date
      const timelineEvents = [
        ...appointments.map(a => ({ type: "appointment", date: a.date, data: a })),
        ...treatments.map(t => ({ type: "treatment", date: t.date, data: t })),
        ...messages.map(m => ({ type: "message", date: m.timestamp, data: m })),
        ...payments.map(p => ({ type: "payment", date: p.date, data: p }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      return timelineEvents;
    } catch (error) {
      console.error("Patient timeline error:", error);
      throw error;
    }
  }
  
  async getPatientEducationResources(patientId: number, condition?: string) {
    try {
      // Check if patient exists
      const patient = await storage.getPatient(patientId);
      if (!patient) {
        throw new Error("Patient not found");
      }
      
      let targetConditions: string[] = [];
      
      // If condition is specified, use it
      if (condition) {
        targetConditions = [condition];
      } else {
        // Otherwise, get patient diagnoses from records
        const patientRecords = await storage.getPatientRecords(patientId);
        targetConditions = patientRecords.diagnoses?.map(d => d.condition) || [];
      }
      
      // Get education resources for these conditions
      const resources = await storage.getEducationalResources(targetConditions);
      
      return resources;
    } catch (error) {
      console.error("Education resources error:", error);
      throw error;
    }
  }
}

export const patientPortal = new PatientPortalService();
