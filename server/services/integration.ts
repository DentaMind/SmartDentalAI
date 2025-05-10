
import axios from "axios";
import { z } from "zod";

// Lab integration schemas
const labRequestSchema = z.object({
  patientId: z.number(),
  doctorId: z.number(),
  labType: z.enum(["prosthetic", "orthodontic", "surgical", "other"]),
  requestDetails: z.object({
    type: z.string(),
    description: z.string(),
    specifications: z.record(z.string(), z.any()).optional(),
    notes: z.string().optional(),
    dueDate: z.string().optional(),
    priority: z.enum(["normal", "high", "urgent"]).default("normal"),
  }),
  attachments: z.array(z.string()).optional(),
});

// Insurance integration schemas
const insuranceEligibilitySchema = z.object({
  patientId: z.number(),
  insuranceProvider: z.string(),
  memberId: z.string(),
  groupNumber: z.string().optional(),
  subscriberName: z.string().optional(),
  subscriberDob: z.string().optional(),
  procedureCodes: z.array(z.string()).optional(),
});

// Pharmacy integration schemas
const prescriptionSchema = z.object({
  patientId: z.number(),
  doctorId: z.number(),
  medications: z.array(z.object({
    name: z.string(),
    dosage: z.string(),
    frequency: z.string(),
    duration: z.string(),
    quantity: z.number(),
    refills: z.number().default(0),
    notes: z.string().optional(),
  })),
  pharmacy: z.object({
    name: z.string().optional(),
    address: z.string().optional(),
    phoneNumber: z.string().optional(),
    preferElectronic: z.boolean().default(true),
  }).optional(),
});

class IntegrationService {
  // DENTAL LAB INTEGRATIONS
  async submitLabRequest(requestData: z.infer<typeof labRequestSchema>) {
    try {
      // Validate request data
      const validData = labRequestSchema.parse(requestData);
      
      // In a real system, this would connect to a lab API or service
      // For demo purposes, we'll simulate the lab integration
      
      console.log(`Submitting lab request for patient ${validData.patientId}`);
      
      // Generate a tracking number
      const trackingNumber = `LAB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Simulate lab API response
      const labResponse = {
        success: true,
        requestId: trackingNumber,
        estimatedCompletionDate: this.calculateLabCompletionDate(validData.labType, validData.requestDetails.priority),
        labName: "DentaMind Partner Lab",
        status: "submitted",
      };
      
      return {
        ...labResponse,
        originalRequest: validData
      };
    } catch (error) {
      console.error("Lab request submission error:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to submit lab request");
    }
  }
  
  async getLabRequestStatus(requestId: string) {
    try {
      // In a real system, this would query the lab's API for status
      // For demo purposes, we'll simulate random statuses
      
      const statuses = ["received", "in_progress", "quality_check", "shipped", "delivered"];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      
      return {
        requestId,
        status: randomStatus,
        updatedAt: new Date().toISOString(),
        estimatedDeliveryDate: randomStatus === "shipped" ? this.addDays(new Date(), 2).toISOString() : null,
        trackingNumber: randomStatus === "shipped" ? `TRACK-${Math.floor(Math.random() * 1000000)}` : null,
        notes: "Processing according to specifications"
      };
    } catch (error) {
      console.error("Lab status check error:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to check lab request status");
    }
  }
  
  // INSURANCE INTEGRATIONS
  async checkInsuranceEligibility(eligibilityData: z.infer<typeof insuranceEligibilitySchema>) {
    try {
      // Validate eligibility request data
      const validData = insuranceEligibilitySchema.parse(eligibilityData);
      
      // In a real system, this would connect to a clearinghouse or insurance API
      // For demo purposes, we'll simulate the eligibility response
      
      console.log(`Checking eligibility for patient ${validData.patientId} with ${validData.insuranceProvider}`);
      
      // Mock eligibility response
      const eligibilityResponse = {
        status: "active",
        planName: `${validData.insuranceProvider} Dental Plan`,
        effectiveDate: "2023-01-01",
        terminationDate: "2023-12-31",
        benefits: {
          preventive: {
            coverage: "100%",
            remainingBenefit: "$1000",
            waitingPeriod: "None",
            frequency: "Twice per year"
          },
          basic: {
            coverage: "80%",
            remainingBenefit: "$800",
            waitingPeriod: "None",
            frequency: "As needed"
          },
          major: {
            coverage: "50%",
            remainingBenefit: "$1500",
            waitingPeriod: "None",
            frequency: "As needed"
          },
          orthodontic: {
            coverage: "50%",
            remainingBenefit: "$1500",
            waitingPeriod: "12 months",
            frequency: "Lifetime maximum"
          }
        },
        deductible: {
          individual: "$50",
          familyMax: "$150",
          remaining: "$0"
        },
        annualMaximum: "$2000",
        remainingAnnualMaximum: "$1200",
        verificationDateTime: new Date().toISOString(),
        transactionId: `ELIG-${Date.now()}`
      };
      
      // If procedure codes were provided, add procedure-specific estimates
      if (validData.procedureCodes && validData.procedureCodes.length > 0) {
        const procedureEstimates = validData.procedureCodes.map(code => {
          // This would normally look up the procedure details from a fee schedule
          return {
            code,
            description: this.getProcedureDescription(code),
            coverage: this.getProcedureCoverage(code, eligibilityResponse.benefits),
            patientEstimate: this.calculatePatientEstimate(code)
          };
        });
        
        return {
          ...eligibilityResponse,
          procedureEstimates
        };
      }
      
      return eligibilityResponse;
    } catch (error) {
      console.error("Eligibility check error:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to check insurance eligibility");
    }
  }
  
  async submitElectronicClaim(claimData: any) {
    try {
      console.log(`Submitting electronic claim for patient ${claimData.patientId}`);
      
      // Mock claim submission response
      return {
        success: true,
        claimId: `CLAIM-${Date.now()}`,
        receivedBy: claimData.insuranceProvider,
        submissionDate: new Date().toISOString(),
        estimatedProcessingTime: "14-21 days",
        status: "submitted"
      };
    } catch (error) {
      console.error("Claim submission error:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to submit electronic claim");
    }
  }
  
  // PHARMACY INTEGRATIONS
  async sendElectronicPrescription(prescriptionData: z.infer<typeof prescriptionSchema>) {
    try {
      // Validate prescription data
      const validData = prescriptionSchema.parse(prescriptionData);
      
      console.log(`Sending electronic prescription for patient ${validData.patientId}`);
      
      // Mock prescription response
      return {
        success: true,
        prescriptionId: `RX-${Date.now()}`,
        sentTo: validData.pharmacy?.name || "Patient's preferred pharmacy",
        status: "sent",
        sentDate: new Date().toISOString(),
        medications: validData.medications.map(med => ({
          name: med.name,
          status: "processing"
        }))
      };
    } catch (error) {
      console.error("Prescription submission error:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to send electronic prescription");
    }
  }
  
  // REFERRAL NETWORK
  async createReferral(referralData: any) {
    try {
      console.log(`Creating referral to ${referralData.specialistType} for patient ${referralData.patientId}`);
      
      // Mock referral response
      return {
        success: true,
        referralId: `REF-${Date.now()}`,
        specialist: {
          name: "Dr. Specialist Name",
          practice: "Specialist Practice",
          address: "123 Specialist St, City, ST 12345",
          phone: "(555) 123-4567"
        },
        status: "sent",
        appointmentInfo: {
          requested: referralData.requestAppointment || false,
          status: referralData.requestAppointment ? "pending" : "not_requested"
        },
        createdDate: new Date().toISOString()
      };
    } catch (error) {
      console.error("Referral creation error:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to create referral");
    }
  }
  
  // UTILITY METHODS
  private calculateLabCompletionDate(labType: string, priority: string) {
    const now = new Date();
    let daysToAdd = 7; // Default for normal priority
    
    // Adjust based on lab type
    switch (labType) {
      case "prosthetic":
        daysToAdd = 10;
        break;
      case "orthodontic":
        daysToAdd = 14;
        break;
      case "surgical":
        daysToAdd = 5;
        break;
      default:
        daysToAdd = 7;
    }
    
    // Adjust based on priority
    switch (priority) {
      case "high":
        daysToAdd = Math.max(3, Math.floor(daysToAdd * 0.7));
        break;
      case "urgent":
        daysToAdd = Math.max(1, Math.floor(daysToAdd * 0.4));
        break;
    }
    
    return this.addDays(now, daysToAdd).toISOString();
  }
  
  private addDays(date: Date, days: number) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
  
  private getProcedureDescription(code: string) {
    // This would normally look up the procedure description from a database
    const procedures: Record<string, string> = {
      "D0120": "Periodic oral evaluation",
      "D0150": "Comprehensive oral evaluation",
      "D0210": "Intraoral - complete series of radiographic images",
      "D0220": "Intraoral - periapical first radiographic image",
      "D0230": "Intraoral - periapical each additional radiographic image",
      "D0274": "Bitewings - four radiographic images",
      "D1110": "Prophylaxis - adult",
      "D1120": "Prophylaxis - child",
      "D1351": "Sealant - per tooth",
      "D2140": "Amalgam - one surface, primary or permanent",
      "D2150": "Amalgam - two surfaces, primary or permanent",
      "D2160": "Amalgam - three surfaces, primary or permanent",
      "D2161": "Amalgam - four or more surfaces, primary or permanent",
      "D2330": "Resin-based composite - one surface, anterior",
      "D2391": "Resin-based composite - one surface, posterior",
      "D2750": "Crown - porcelain fused to high noble metal",
      "D3310": "Endodontic therapy, anterior tooth (excluding final restoration)",
      "D4341": "Periodontal scaling and root planing - four or more teeth per quadrant",
      "D4910": "Periodontal maintenance",
      "D7140": "Extraction, erupted tooth or exposed root",
    };
    
    return procedures[code] || `Procedure code ${code}`;
  }
  
  private getProcedureCoverage(code: string, benefits: any) {
    // Determine procedure category from code
    let category = "basic";
    
    if (code.startsWith("D0") || code.startsWith("D1")) {
      category = "preventive";
    } else if (code.startsWith("D2") || code.startsWith("D3") || code.startsWith("D4") || code.startsWith("D5") || code.startsWith("D6") || code.startsWith("D7")) {
      category = code.startsWith("D7") ? "basic" : "major";
    } else if (code.startsWith("D8")) {
      category = "orthodontic";
    }
    
    // Return coverage from benefits
    return benefits[category]?.coverage || "0%";
  }
  
  private calculatePatientEstimate(code: string) {
    // This would normally calculate based on fee schedules and insurance coverage
    // Mock fee schedule
    const fees: Record<string, number> = {
      "D0120": 50,
      "D0150": 95,
      "D0210": 120,
      "D0220": 30,
      "D0230": 25,
      "D0274": 65,
      "D1110": 95,
      "D1120": 75,
      "D1351": 45,
      "D2140": 125,
      "D2150": 165,
      "D2160": 195,
      "D2161": 225,
      "D2330": 150,
      "D2391": 165,
      "D2750": 950,
      "D3310": 750,
      "D4341": 225,
      "D4910": 110,
      "D7140": 150,
    };
    
    // Mock calculation - in reality this would use the coverage data from benefits
    const fee = fees[code] || 100;
    const coverage = this.getProcedureCoverage(code, {
      preventive: { coverage: "100%" },
      basic: { coverage: "80%" },
      major: { coverage: "50%" },
      orthodontic: { coverage: "50%" }
    });
    
    // Extract coverage percentage
    const coveragePercent = parseInt(coverage.replace("%", "")) / 100;
    
    // Calculate patient portion
    return Math.round((1 - coveragePercent) * fee);
  }
}

export const integrationService = new IntegrationService();
