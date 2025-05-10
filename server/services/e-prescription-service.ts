/**
 * E-Prescription Service
 * 
 * This service handles electronic prescription functionality including:
 * - Sending prescriptions to pharmacies
 * - Tracking e-prescription status
 * - Managing pharmacy integrations
 * - Handling digital signatures for controlled substances
 */

import { db } from '../db';
import { 
  prescriptions, 
  pharmacies, 
  favoritePharmacies, 
  prescriptionLogs,
  insertPrescriptionLogSchema 
} from '../../shared/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { InsertPrescriptionLog, Prescription } from '../../shared/schema';
import { aiServiceManager } from './ai-service-manager';
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
      // Get the prescription
      const prescription = await db.query.prescriptions.findFirst({
        where: eq(prescriptions.id, prescriptionId)
      });

      if (!prescription) {
        return {
          success: false,
          message: 'Prescription not found',
          errorCode: 'PRESCRIPTION_NOT_FOUND'
        };
      }

      // Get the pharmacy
      const pharmacy = await db.query.pharmacies.findFirst({
        where: eq(pharmacies.id, pharmacyId)
      });

      if (!pharmacy) {
        return {
          success: false,
          message: 'Pharmacy not found',
          errorCode: 'PHARMACY_NOT_FOUND'
        };
      }

      // Check if pharmacy supports e-prescriptions
      if (!pharmacy.supportsEPrescription) {
        return {
          success: false,
          message: 'This pharmacy does not support e-prescriptions',
          errorCode: 'PHARMACY_NO_EPRESCRIPTION_SUPPORT'
        };
      }

      // If it's a controlled substance, check if it has been digitally signed
      if (prescription.controlled && !prescription.digitalSignature) {
        return {
          success: false,
          message: 'Controlled substance prescriptions must be digitally signed before sending',
          errorCode: 'MISSING_DIGITAL_SIGNATURE'
        };
      }

      // Simulate sending to pharmacy (in a real implementation, this would be an API call to a pharmacy system)
      const pharmacyResult = await this.simulatePharmacyApiCall(prescription, pharmacy);

      if (!pharmacyResult.success) {
        return pharmacyResult;
      }

      // Update prescription status
      await db.update(prescriptions)
        .set({
          status: 'sent_to_pharmacy',
          pharmacyId: pharmacyId,
          ePrescriptionSent: true,
          ePrescriptionSentAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(prescriptions.id, prescriptionId));

      // Create a log entry
      const logEntry: InsertPrescriptionLog = {
        prescriptionId,
        action: "sent", // Using the allowed enum value
        performedBy: userId,
        performedAt: new Date(),
        details: {
          pharmacyId,
          pharmacyName: pharmacy.name,
          confirmationCode: pharmacyResult.confirmationCode
        }
      };

      await db.insert(prescriptionLogs).values(logEntry);

      return {
        success: true,
        message: `Prescription successfully sent to ${pharmacy.name}`,
        confirmationCode: pharmacyResult.confirmationCode,
        details: {
          pharmacy: {
            name: pharmacy.name,
            address: pharmacy.address,
            phone: pharmacy.phone
          }
        }
      };
    } catch (error) {
      console.error('Error sending prescription to pharmacy:', error);
      return {
        success: false,
        message: 'Failed to send prescription to pharmacy',
        errorCode: 'SEND_ERROR'
      };
    }
  }

  /**
   * Check the status of an e-prescription
   */
  async checkPrescriptionStatus(prescriptionId: number): Promise<any> {
    try {
      // Get the prescription
      const prescription = await db.query.prescriptions.findFirst({
        where: eq(prescriptions.id, prescriptionId)
      });

      if (!prescription) {
        return {
          success: false,
          message: 'Prescription not found',
          errorCode: 'PRESCRIPTION_NOT_FOUND'
        };
      }

      // If the prescription hasn't been sent to a pharmacy, return the local status
      if (!prescription.ePrescriptionSent) {
        return {
          success: true,
          status: prescription.status,
          details: {
            lastUpdated: prescription.updatedAt
          }
        };
      }

      // Get the pharmacy
      const pharmacy = prescription.pharmacyId ? 
        await db.query.pharmacies.findFirst({
          where: eq(pharmacies.id, prescription.pharmacyId)
        }) : null;

      // Get the latest log entry
      const latestLog = await db.query.prescriptionLogs.findFirst({
        where: eq(prescriptionLogs.prescriptionId, prescriptionId),
        orderBy: (logs, { desc }) => [desc(logs.performedAt)]
      });

      // In a real implementation, you would make an API call to the pharmacy system
      // to get the current status of the prescription
      // For now, we'll just return the current status from our database
      return {
        success: true,
        status: prescription.status,
        details: {
          lastUpdated: prescription.updatedAt,
          pharmacy: pharmacy ? {
            name: pharmacy.name,
            phone: pharmacy.phone
          } : null,
          lastAction: latestLog ? {
            action: latestLog.action,
            timestamp: latestLog.performedAt
          } : null
        }
      };
    } catch (error) {
      console.error('Error checking prescription status:', error);
      return {
        success: false,
        message: 'Failed to check prescription status',
        errorCode: 'STATUS_CHECK_ERROR'
      };
    }
  }

  /**
   * Update the status of an e-prescription
   */
  async updatePrescriptionStatus(
    prescriptionId: number,
    status: Prescription['status'],
    userId: number,
    notes?: string
  ): Promise<EPrescriptionResponse> {
    try {
      // Get the prescription
      const prescription = await db.query.prescriptions.findFirst({
        where: eq(prescriptions.id, prescriptionId)
      });

      if (!prescription) {
        return {
          success: false,
          message: 'Prescription not found',
          errorCode: 'PRESCRIPTION_NOT_FOUND'
        };
      }

      // Update prescription status
      await db.update(prescriptions)
        .set({
          status,
          updatedAt: new Date()
        })
        .where(eq(prescriptions.id, prescriptionId));

      // Create a log entry
      const logEntry: InsertPrescriptionLog = {
        prescriptionId,
        action: "updated", // Using the allowed enum value
        performedBy: userId,
        performedAt: new Date(),
        details: {
          previousStatus: prescription.status,
          newStatus: status,
          notes
        }
      };

      await db.insert(prescriptionLogs).values(logEntry);

      return {
        success: true,
        message: `Prescription status updated to ${status}`
      };
    } catch (error) {
      console.error('Error updating prescription status:', error);
      return {
        success: false,
        message: 'Failed to update prescription status',
        errorCode: 'UPDATE_STATUS_ERROR'
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
  ): Promise<EPrescriptionResponse> {
    try {
      // Get the prescription
      const prescription = await db.query.prescriptions.findFirst({
        where: eq(prescriptions.id, prescriptionId)
      });

      if (!prescription) {
        return {
          success: false,
          message: 'Prescription not found',
          errorCode: 'PRESCRIPTION_NOT_FOUND'
        };
      }

      // Verify that the prescription is for a controlled substance
      if (!prescription.controlled) {
        return {
          success: false,
          message: 'Only controlled substances require digital signatures',
          errorCode: 'NOT_CONTROLLED_SUBSTANCE'
        };
      }

      // Update prescription with digital signature
      await db.update(prescriptions)
        .set({
          digitalSignature: signature,
          digitalSignatureTimestamp: new Date(), // Using the correct field name
          updatedAt: new Date()
        })
        .where(eq(prescriptions.id, prescriptionId));

      // Create a log entry
      const logEntry: InsertPrescriptionLog = {
        prescriptionId,
        action: "updated", // Using a valid enum value
        performedBy: userId,
        performedAt: new Date(),
        details: {
          type: "digital_signature",
          signatureDate: new Date().toISOString()
        }
      };

      await db.insert(prescriptionLogs).values(logEntry);

      return {
        success: true,
        message: 'Prescription has been digitally signed'
      };
    } catch (error) {
      console.error('Error digitally signing prescription:', error);
      return {
        success: false,
        message: 'Failed to digitally sign prescription',
        errorCode: 'SIGNING_ERROR'
      };
    }
  }

  /**
   * Find nearby pharmacies based on patient address or zip code
   */
  async findNearbyPharmacies(query: string, limit: number = 10): Promise<any> {
    try {
      // In a real implementation, this would use a geocoding API and search for pharmacies
      // based on geographic proximity
      // For this implementation, we'll just do a simple search based on name, city, or zip code
      const searchResults = await db.query.pharmacies.findMany({
        where: (pharmacies, { or, like }) => or(
          like(pharmacies.name, `%${query}%`),
          like(pharmacies.city, `%${query}%`),
          like(pharmacies.zipCode, `%${query}%`),
          like(pharmacies.state, `%${query}%`)
        ),
        limit
      });

      return {
        success: true,
        pharmacies: searchResults
      };
    } catch (error) {
      console.error('Error finding nearby pharmacies:', error);
      return {
        success: false,
        message: 'Failed to find nearby pharmacies',
        errorCode: 'PHARMACY_SEARCH_ERROR'
      };
    }
  }

  /**
   * Get a patient's favorite pharmacies
   */
  async getPatientFavoritePharmacies(patientId: number): Promise<any> {
    try {
      // In a real database join, you would use db.select to join the two tables
      // For simplicity, we'll use two separate queries
      const favorites = await db.select().from(favoritePharmacies)
        .where(eq(favoritePharmacies.patientId, patientId));

      if (!favorites.length) {
        return {
          success: true,
          pharmacies: []
        };
      }

      // Get the pharmacy details
      const pharmacyIds = favorites.map(fav => fav.pharmacyId);
      const pharmacyDetails = await db.select().from(pharmacies)
        .where(inArray(pharmacies.id, pharmacyIds));

      // Combine the pharmacy details with the favorite information
      const detailedFavorites = pharmacyDetails.map(pharmacy => {
        const favorite = favorites.find(fav => fav.pharmacyId === pharmacy.id);
        return {
          ...pharmacy,
          isPrimary: favorite?.isPrimary || false,
          addedDate: favorite?.createdAt
        };
      });

      return {
        success: true,
        pharmacies: detailedFavorites
      };
    } catch (error) {
      console.error('Error getting patient favorite pharmacies:', error);
      return {
        success: false,
        message: 'Failed to get patient favorite pharmacies',
        errorCode: 'FAVORITE_PHARMACY_ERROR'
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
  ): Promise<EPrescriptionResponse> {
    try {
      // Check if the pharmacy exists
      const pharmacy = await db.select().from(pharmacies)
        .where(eq(pharmacies.id, pharmacyId))
        .limit(1);

      if (!pharmacy.length) {
        return {
          success: false,
          message: 'Pharmacy not found',
          errorCode: 'PHARMACY_NOT_FOUND'
        };
      }

      // Check if already a favorite
      const existingFavorites = await db.select().from(favoritePharmacies)
        .where(and(
          eq(favoritePharmacies.patientId, patientId),
          eq(favoritePharmacies.pharmacyId, pharmacyId)
        ))
        .limit(1);

      if (existingFavorites.length > 0) {
        const existingFavorite = existingFavorites[0];
        // If it's already a favorite, just update the isPrimary flag if needed
        if (existingFavorite.isPrimary !== isPrimary) {
          await db.update(favoritePharmacies)
            .set({ isPrimary: isPrimary })
            .where(eq(favoritePharmacies.id, existingFavorite.id));
        }

        return {
          success: true,
          message: isPrimary 
            ? 'Pharmacy set as primary favorite' 
            : 'Pharmacy preference updated'
        };
      }

      // If setting as primary, update any existing primary favorites
      if (isPrimary) {
        await db.update(favoritePharmacies)
          .set({ isPrimary: false })
          .where(and(
            eq(favoritePharmacies.patientId, patientId),
            eq(favoritePharmacies.isPrimary, true)
          ));
      }

      // Add the new favorite
      await db.insert(favoritePharmacies).values({
        patientId: patientId,
        pharmacyId: pharmacyId,
        isPrimary: isPrimary,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return {
        success: true,
        message: 'Pharmacy added to favorites'
      };
    } catch (error) {
      console.error('Error adding pharmacy to favorites:', error);
      return {
        success: false,
        message: 'Failed to add pharmacy to favorites',
        errorCode: 'ADD_FAVORITE_ERROR'
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
    try {
      // Simulate API latency
      await new Promise(resolve => setTimeout(resolve, 500));

      // Generate a random confirmation code
      const confirmationCode = Math.random().toString(36).substring(2, 10).toUpperCase();

      // Simulate a 5% chance of failure for demo purposes
      if (Math.random() < 0.05) {
        return {
          success: false,
          message: 'Pharmacy system temporarily unavailable',
          errorCode: 'PHARMACY_SYSTEM_UNAVAILABLE'
        };
      }

      return {
        success: true,
        message: 'Prescription sent successfully',
        confirmationCode
      };
    } catch (error) {
      console.error('Error in pharmacy API simulation:', error);
      return {
        success: false,
        message: 'Error communicating with pharmacy system',
        errorCode: 'PHARMACY_API_ERROR'
      };
    }
  }
}

export const ePrescriptionService = new EPrescriptionService();