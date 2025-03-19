/**
 * E-Prescription Service
 * 
 * This service handles electronic prescription functionality including:
 * - Sending prescriptions to pharmacies
 * - Tracking e-prescription status
 * - Managing pharmacy integrations
 * - Handling digital signatures for controlled substances
 */

import axios from 'axios';
import { db } from '../db';
import { prescriptions, prescriptionLogs, pharmacies } from '../../shared/schema';
import { Prescription, InsertPrescriptionLog } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';
import { aiRequestQueue } from './ai-request-queue';
import { AIServiceType } from './ai-service-types';

interface EPrescriptionResponse {
  success: boolean;
  message: string;
  confirmationCode?: string;
  details?: any;
  errorCode?: string;
}

export class EPrescriptionService {
  /**
   * Send a prescription electronically to a pharmacy
   */
  async sendPrescriptionToPharmacy(
    prescriptionId: number,
    pharmacyId: number,
    userId: number
  ): Promise<EPrescriptionResponse> {
    try {
      // Get prescription and pharmacy data
      const prescription = await db.query.prescriptions.findFirst({
        where: eq(prescriptions.id, prescriptionId)
      });

      if (!prescription) {
        return {
          success: false,
          message: "Prescription not found",
          errorCode: "PRESCRIPTION_NOT_FOUND"
        };
      }

      const pharmacy = await db.query.pharmacies.findFirst({
        where: eq(pharmacies.id, pharmacyId)
      });

      if (!pharmacy) {
        return {
          success: false,
          message: "Pharmacy not found",
          errorCode: "PHARMACY_NOT_FOUND"
        };
      }

      if (!pharmacy.supportsEPrescription) {
        return {
          success: false,
          message: "This pharmacy does not support e-prescriptions",
          errorCode: "EPRESCRIPTION_NOT_SUPPORTED"
        };
      }

      // Check if the prescription is for a controlled substance
      if (prescription.controlled) {
        // Verify digital signature requirements are met
        if (!prescription.digitalSignature || !prescription.digitalSignatureTimestamp) {
          return {
            success: false,
            message: "Controlled substance prescriptions require digital signatures",
            errorCode: "MISSING_DIGITAL_SIGNATURE"
          };
        }
      }

      // For demo purposes, we'll simulate the API call to the pharmacy
      // In production, this would integrate with actual pharmacy APIs
      // like Surescripts, RxChange, etc.
      
      // Simulated API response - in production this would be an actual integration
      const apiResponse = await this.simulatePharmacyApiCall(prescription, pharmacy);

      // If successful, update the prescription status
      if (apiResponse.success) {
        await db.update(prescriptions)
          .set({
            status: "sent_to_pharmacy",
            ePrescriptionSent: true,
            ePrescriptionSentAt: new Date(),
            ePrescriptionResponse: JSON.stringify(apiResponse),
            ePrescriptionConfirmationCode: apiResponse.confirmationCode,
            pharmacyId: pharmacyId,
            updatedAt: new Date()
          })
          .where(eq(prescriptions.id, prescriptionId));

        // Log the action
        const logEntry: InsertPrescriptionLog = {
          prescriptionId,
          action: "sent",
          performedBy: userId,
          performedAt: new Date(),
          details: {
            pharmacyId,
            confirmationCode: apiResponse.confirmationCode,
            response: apiResponse
          }
        };

        await db.insert(prescriptionLogs).values(logEntry);
      }

      return apiResponse;
    } catch (error) {
      console.error("Error sending prescription to pharmacy:", error);
      return {
        success: false,
        message: "Failed to send prescription to pharmacy",
        errorCode: "API_ERROR",
        details: error
      };
    }
  }

  /**
   * Check the status of an e-prescription
   */
  async checkPrescriptionStatus(prescriptionId: number): Promise<any> {
    try {
      const prescription = await db.query.prescriptions.findFirst({
        where: eq(prescriptions.id, prescriptionId)
      });

      if (!prescription) {
        return {
          success: false,
          message: "Prescription not found",
          errorCode: "PRESCRIPTION_NOT_FOUND"
        };
      }

      if (!prescription.ePrescriptionSent) {
        return {
          success: false,
          message: "Prescription has not been sent electronically",
          errorCode: "NOT_SENT_ELECTRONICALLY"
        };
      }

      // In production, this would check status with pharmacy API
      return {
        success: true,
        message: "Prescription status retrieved",
        status: prescription.status,
        details: {
          sentAt: prescription.ePrescriptionSentAt,
          confirmationCode: prescription.ePrescriptionConfirmationCode
        }
      };
    } catch (error) {
      console.error("Error checking prescription status:", error);
      return {
        success: false,
        message: "Failed to check prescription status",
        errorCode: "STATUS_CHECK_FAILED",
        details: error
      };
    }
  }

  /**
   * Update the status of an e-prescription
   */
  async updatePrescriptionStatus(
    prescriptionId: number,
    status: "active" | "completed" | "cancelled" | "on_hold" | "sent_to_pharmacy" | "filled",
    userId: number,
    notes?: string
  ): Promise<any> {
    try {
      const prescription = await db.query.prescriptions.findFirst({
        where: eq(prescriptions.id, prescriptionId)
      });

      if (!prescription) {
        return {
          success: false,
          message: "Prescription not found",
          errorCode: "PRESCRIPTION_NOT_FOUND"
        };
      }

      // Update the prescription status
      await db.update(prescriptions)
        .set({
          status,
          notes: notes ? (prescription.notes ? `${prescription.notes}\n\n${notes}` : notes) : prescription.notes,
          updatedAt: new Date()
        })
        .where(eq(prescriptions.id, prescriptionId));

      // Log the action
      const logEntry: InsertPrescriptionLog = {
        prescriptionId,
        action: status === "filled" ? "filled" : "updated",
        performedBy: userId,
        performedAt: new Date(),
        details: {
          oldStatus: prescription.status,
          newStatus: status,
          notes
        }
      };

      await db.insert(prescriptionLogs).values(logEntry);

      return {
        success: true,
        message: `Prescription status updated to ${status}`,
        details: {
          prescriptionId,
          status
        }
      };
    } catch (error) {
      console.error("Error updating prescription status:", error);
      return {
        success: false,
        message: "Failed to update prescription status",
        errorCode: "STATUS_UPDATE_FAILED",
        details: error
      };
    }
  }

  /**
   * Digitally sign a prescription for controlled substances
   */
  async digitallySignPrescription(
    prescriptionId: number,
    userId: number,
    signature: string
  ): Promise<any> {
    try {
      const prescription = await db.query.prescriptions.findFirst({
        where: eq(prescriptions.id, prescriptionId)
      });

      if (!prescription) {
        return {
          success: false,
          message: "Prescription not found",
          errorCode: "PRESCRIPTION_NOT_FOUND"
        };
      }

      // Update the prescription with digital signature
      await db.update(prescriptions)
        .set({
          digitalSignature: signature,
          digitalSignatureTimestamp: new Date(),
          signedBy: userId,
          signedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(prescriptions.id, prescriptionId));

      // Log the action
      const logEntry: InsertPrescriptionLog = {
        prescriptionId,
        action: "updated",
        performedBy: userId,
        performedAt: new Date(),
        details: {
          action: "digital_signature_added",
          timestamp: new Date()
        }
      };

      await db.insert(prescriptionLogs).values(logEntry);

      return {
        success: true,
        message: "Prescription digitally signed successfully",
        details: {
          prescriptionId,
          signedAt: new Date()
        }
      };
    } catch (error) {
      console.error("Error digitally signing prescription:", error);
      return {
        success: false,
        message: "Failed to digitally sign prescription",
        errorCode: "DIGITAL_SIGNATURE_FAILED",
        details: error
      };
    }
  }

  /**
   * Find nearby pharmacies based on patient address or zip code
   */
  async findNearbyPharmacies(query: string, limit: number = 10): Promise<any> {
    try {
      // In production, this would integrate with a pharmacy directory
      // or geocoding service to find nearby pharmacies
      
      // For demo purposes, search pharmacies by name, city, or zip
      const results = await db.query.pharmacies.findMany({
        where: (pharmacies, { or, like }) => or(
          like(pharmacies.name, `%${query}%`),
          like(pharmacies.city, `%${query}%`),
          like(pharmacies.zipCode, `%${query}%`)
        ),
        limit
      });

      return {
        success: true,
        message: `Found ${results.length} pharmacies`,
        pharmacies: results
      };
    } catch (error) {
      console.error("Error finding nearby pharmacies:", error);
      return {
        success: false,
        message: "Failed to find nearby pharmacies",
        errorCode: "PHARMACY_SEARCH_FAILED",
        details: error
      };
    }
  }

  /**
   * Get a patient's favorite pharmacies
   */
  async getPatientFavoritePharmacies(patientId: number): Promise<any> {
    try {
      // Query favorite pharmacies and join with pharmacy details
      const results = await db.query.favoritePharmacies.findMany({
        where: eq(favoritePharmacies.patientId, patientId),
        with: {
          pharmacy: true
        }
      });

      return {
        success: true,
        message: `Found ${results.length} favorite pharmacies`,
        pharmacies: results
      };
    } catch (error) {
      console.error("Error retrieving favorite pharmacies:", error);
      return {
        success: false,
        message: "Failed to retrieve favorite pharmacies",
        errorCode: "FAVORITE_PHARMACY_RETRIEVAL_FAILED",
        details: error
      };
    }
  }

  /**
   * Add a pharmacy to patient's favorites
   */
  async addPatientFavoritePharmacy(
    patientId: number,
    pharmacyId: number,
    isPrimary: boolean = false
  ): Promise<any> {
    try {
      // If setting as primary, update any existing primary pharmacy
      if (isPrimary) {
        await db.update(favoritePharmacies)
          .set({ isPrimary: false })
          .where(and(
            eq(favoritePharmacies.patientId, patientId),
            eq(favoritePharmacies.isPrimary, true)
          ));
      }

      // Add the new favorite pharmacy
      await db.insert(favoritePharmacies).values({
        patientId,
        pharmacyId,
        isPrimary,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return {
        success: true,
        message: "Pharmacy added to favorites",
        details: {
          patientId,
          pharmacyId,
          isPrimary
        }
      };
    } catch (error) {
      console.error("Error adding favorite pharmacy:", error);
      return {
        success: false,
        message: "Failed to add favorite pharmacy",
        errorCode: "FAVORITE_PHARMACY_ADD_FAILED",
        details: error
      };
    }
  }

  /**
   * Simulate a pharmacy API call (for demo purposes)
   * In production, this would be an actual API integration
   */
  private async simulatePharmacyApiCall(
    prescription: Prescription,
    pharmacy: any
  ): Promise<EPrescriptionResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate a random confirmation code
    const confirmationCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    // Simulate success with 95% probability, error with 5%
    const success = Math.random() > 0.05;

    if (success) {
      return {
        success: true,
        message: "Prescription successfully sent to pharmacy",
        confirmationCode,
        details: {
          pharmacyName: pharmacy.name,
          pharmacyPhone: pharmacy.phone,
          estimatedProcessingTime: "1-2 hours",
          prescriptionId: prescription.id
        }
      };
    } else {
      return {
        success: false,
        message: "Pharmacy system temporarily unavailable",
        errorCode: "PHARMACY_SYSTEM_UNAVAILABLE",
        details: {
          retryAfter: "15 minutes",
          pharmacyName: pharmacy.name
        }
      };
    }
  }
}

export const ePrescriptionService = new EPrescriptionService();