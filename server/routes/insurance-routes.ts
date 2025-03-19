import express, { Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { z } from 'zod';
import { db } from '../db';
import { 
  patients, 
  insuranceClaims, 
  insuranceVerifications, 
  insertInsuranceVerificationSchema,
  InsertInsuranceVerification,
  InsuranceVerificationStatusEnum
} from '@shared/schema';
import { eq, and, desc, or } from 'drizzle-orm';
import { securityService } from '../services/security';

const router = express.Router();

// Define schema for insurance verification request
const verificationRequestSchema = z.object({
  procedures: z.array(z.object({
    code: z.string(),
    fee: z.number()
  }))
});

// Schema for sending insurance eligibility check
const eligibilityCheckSchema = z.object({
  patientId: z.number(),
  insuranceProvider: z.string(),
  insuranceMemberId: z.string(),
  insuranceGroupId: z.string().optional(),
  serviceDate: z.string().optional()
});

// API endpoint to verify insurance coverage for specific procedures
router.post('/insurance-verification/:patientId', requireAuth, async (req: Request, res: Response) => {
  try {
    const patientId = parseInt(req.params.patientId);
    const { procedures } = verificationRequestSchema.parse(req.body);
    
    // Get patient data including insurance info
    const patientData = await db.query.patients.findFirst({
      where: eq(patients.id, patientId),
      with: {
        user: true
      }
    });
    
    if (!patientData) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    // Get insurance details from the patient record
    const insuranceProvider = patientData.insuranceProvider;
    const insuranceNumber = patientData.insuranceNumber;
    
    if (!insuranceProvider || !insuranceNumber) {
      return res.status(400).json({ 
        error: 'Missing insurance information', 
        message: 'Patient does not have insurance provider or member ID information'
      });
    }
    
    // Create an audit log for this sensitive operation
    await securityService.createAuditLog({
      userId: req.user!.id,
      action: 'insurance_verification',
      resource: `patient/${patientId}`,
      result: 'success',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown',
      details: {
        insuranceProvider,
        procedureCodes: procedures.map(p => p.code)
      }
    });
    
    // Simulate real-time verification with insurance provider
    // In a production environment, this would call the actual insurance provider's API
    
    // Get already used benefits from processed claims
    const processedClaims = await db.query.insuranceClaims.findMany({
      where: eq(insuranceClaims.patientId, patientId),
      orderBy: (insuranceClaims, { desc }) => [desc(insuranceClaims.submissionDate)]
    });
    
    // Analyze previous claims to determine used benefits
    const usedBenefitsByCategory = {
      preventive: 0,
      basic: 0, 
      major: 0,
      orthodontic: 0
    };
    
    const usedProcedureCounts = new Map<string, number>();
    
    // Process previous claims to determine what's been used
    processedClaims.forEach(claim => {
      if (claim.procedures && claim.status !== 'denied') {
        const procedures = Array.isArray(claim.procedures) 
          ? claim.procedures 
          : typeof claim.procedures === 'object' 
            ? Object.values(claim.procedures) 
            : [];
            
        procedures.forEach((proc: any) => {
          if (proc.insuranceCategory && proc.insuranceCoverage > 0) {
            // Add to used benefits amount
            usedBenefitsByCategory[proc.insuranceCategory as keyof typeof usedBenefitsByCategory] += proc.insuranceCoverage;
            
            // Track procedure counts for frequency limitations
            const currentCount = usedProcedureCounts.get(proc.code) || 0;
            usedProcedureCounts.set(proc.code, currentCount + 1);
          }
        });
      }
    });
    
    // Define insurance plans with their coverage details
    // In a real system, this would come from the insurance provider's API
    const insurancePlans = {
      'Delta Dental': {
        preventive: { percentage: 100, annual_max: 2000, used: usedBenefitsByCategory.preventive },
        basic: { percentage: 80, annual_max: 2000, used: usedBenefitsByCategory.basic },
        major: { percentage: 50, annual_max: 2000, used: usedBenefitsByCategory.major },
        orthodontic: { percentage: 50, annual_max: 1500, used: usedBenefitsByCategory.orthodontic },
        deductible: { individual: 50, family: 150, remaining: 0 },
        limitations: {
          'D1110': { type: 'frequency', limit: 2, period: 'year', category: 'preventive' }, // Prophylaxis (cleaning)
          'D0120': { type: 'frequency', limit: 2, period: 'year', category: 'preventive' }, // Periodic oral evaluation
          'D0274': { type: 'frequency', limit: 1, period: 'year', category: 'preventive' }, // Bitewings - four films
          'D2391': { type: 'replacement', limit: 24, period: 'month', category: 'basic' }  // Posterior composite filling
        }
      },
      'Cigna Dental': {
        preventive: { percentage: 100, annual_max: 1500, used: usedBenefitsByCategory.preventive },
        basic: { percentage: 80, annual_max: 1500, used: usedBenefitsByCategory.basic },
        major: { percentage: 50, annual_max: 1500, used: usedBenefitsByCategory.major },
        orthodontic: { percentage: 50, annual_max: 1000, used: usedBenefitsByCategory.orthodontic },
        deductible: { individual: 50, family: 150, remaining: 0 },
        limitations: {
          'D1110': { type: 'frequency', limit: 2, period: 'year', category: 'preventive' },
          'D0120': { type: 'frequency', limit: 2, period: 'year', category: 'preventive' },
          'D0274': { type: 'frequency', limit: 1, period: 'year', category: 'preventive' },
          'D2391': { type: 'replacement', limit: 24, period: 'month', category: 'basic' }
        }
      },
      'MetLife': {
        preventive: { percentage: 100, annual_max: 1750, used: usedBenefitsByCategory.preventive },
        basic: { percentage: 80, annual_max: 1750, used: usedBenefitsByCategory.basic },
        major: { percentage: 50, annual_max: 1750, used: usedBenefitsByCategory.major },
        orthodontic: { percentage: 50, annual_max: 1200, used: usedBenefitsByCategory.orthodontic },
        deductible: { individual: 50, family: 150, remaining: 0 },
        limitations: {
          'D1110': { type: 'frequency', limit: 2, period: 'year', category: 'preventive' },
          'D0120': { type: 'frequency', limit: 2, period: 'year', category: 'preventive' },
          'D0274': { type: 'frequency', limit: 1, period: 'year', category: 'preventive' },
          'D2391': { type: 'replacement', limit: 24, period: 'month', category: 'basic' }
        }
      }
    };
    
    // Get the insurance plan for this patient
    const planDetails = insurancePlans[insuranceProvider as keyof typeof insurancePlans];
    
    if (!planDetails) {
      return res.status(400).json({
        error: 'Unsupported insurance provider',
        message: `No coverage information available for ${insuranceProvider}`
      });
    }
    
    // Verify coverage for each procedure
    const proceduresVerification = procedures.map(procedure => {
      // Find the limitation for this procedure code
      const limitation = planDetails.limitations[procedure.code as keyof typeof planDetails.limitations];
      
      let category = 'not-covered';
      let coveragePercentage = 0;
      let coverageAmount = 0;
      let patientAmount = procedure.fee;
      let limitations = '';
      let isExceeded = false;
      
      if (limitation) {
        category = limitation.category;
        
        // Make sure we're accessing only coverage categories (not deductible or limitations)
        const categoryData = planDetails[limitation.category as keyof typeof planDetails];
        
        // Type guard to ensure we're working with a category object that has the right properties
        if (categoryData && 'percentage' in categoryData && 'annual_max' in categoryData && 'used' in categoryData) {
          coveragePercentage = categoryData.percentage;
          
          // Check if the benefit maximum is reached
          const usedAmount = categoryData.used;
          const annualMax = categoryData.annual_max;
          const remainingBenefit = annualMax - usedAmount;
          
          // Check frequency limitations
          if (limitation.type === 'frequency') {
            const usedCount = usedProcedureCounts.get(procedure.code) || 0;
            if (usedCount >= limitation.limit) {
              isExceeded = true;
              limitations = `Frequency limit exceeded (${usedCount}/${limitation.limit} per ${limitation.period})`;
              coveragePercentage = 0;
            }
          }
          
          // Calculate coverage amount
          if (!isExceeded) {
            // Calculate the potential coverage amount
            coverageAmount = (procedure.fee * coveragePercentage) / 100;
            
            // Ensure we don't exceed the remaining benefit
            if (coverageAmount > remainingBenefit) {
              coverageAmount = remainingBenefit;
              limitations = `Annual maximum of $${annualMax} for ${category} services has been reached`;
            }
            
            // Calculate patient responsibility
            patientAmount = procedure.fee - coverageAmount;
          }
        }
      } else {
        limitations = 'Not a covered procedure';
      }
      
      return {
        code: procedure.code,
        fee: procedure.fee,
        coveragePercentage,
        coverageAmount,
        patientAmount,
        category,
        limitations,
        verified: true
      };
    });
    
    // Create organized benefits response
    const benefitsResponse = Object.entries(planDetails).map(([category, details]) => {
      if (category === 'limitations' || category === 'deductible') return null;
      
      const { percentage, annual_max, used } = details as { percentage: number, annual_max: number, used: number };
      
      return {
        category,
        coveragePercentage: percentage,
        annualMaximum: annual_max,
        usedAmount: used,
        remainingAmount: annual_max - used,
        limitations: getLimitationsForCategory(category, planDetails.limitations),
        deductible: planDetails.deductible
      };
    }).filter(Boolean);
    
    // Return the verification results
    return res.json({
      verified: true,
      insuranceProvider,
      proceduresVerification,
      benefits: benefitsResponse,
      message: 'Insurance coverage verified successfully'
    });
    
  } catch (error: any) {
    console.error('Insurance verification error:', error);
    return res.status(400).json({ 
      error: 'Verification failed', 
      message: error.message || 'Could not verify insurance coverage'
    });
  }
});

// API endpoint to check patient insurance eligibility
router.post('/insurance-eligibility', requireAuth, async (req: Request, res: Response) => {
  try {
    const { patientId, insuranceProvider, insuranceMemberId, insuranceGroupId, serviceDate } = 
      eligibilityCheckSchema.parse(req.body);
    
    // Create an audit log for this sensitive operation
    await securityService.createAuditLog({
      userId: req.user!.id,
      action: 'insurance_eligibility_check',
      resource: `patient/${patientId}`,
      result: 'success',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown',
      details: {
        insuranceProvider,
        insuranceMemberId,
        insuranceGroupId,
        serviceDate
      }
    });
    
    // In a production environment, this would connect to a clearinghouse or direct payer API
    // to perform a real-time eligibility check
    
    // Example response structure
    return res.json({
      verified: true,
      eligibilityDate: new Date().toISOString(),
      subscriber: {
        name: 'Patient Name',
        dateOfBirth: '1980-01-01',
        relationship: 'self',
        eligibilityStatus: 'active'
      },
      coverage: {
        planType: 'PPO',
        effectiveDate: '2023-01-01',
        terminationDate: null,
        preventiveCoverage: '100%',
        basicCoverage: '80%',
        majorCoverage: '50%',
        orthodonticCoverage: '50%',
        annualMaximum: 1500,
        usedToDate: 350,
        remainingBenefit: 1150,
        deductible: {
          individual: 50,
          family: 150,
          metToDate: 50,
          remaining: 0
        },
        waitingPeriods: {
          preventive: 'None',
          basic: 'None',
          major: '6 months',
          orthodontic: '12 months'
        },
        frequencies: [
          { service: 'Cleaning', frequency: '2 per 12 months' },
          { service: 'Exams', frequency: '2 per 12 months' },
          { service: 'X-rays (FMX)', frequency: '1 per 60 months' },
          { service: 'X-rays (BW)', frequency: '1 per 12 months' }
        ]
      }
    });
    
  } catch (error: any) {
    console.error('Insurance eligibility check error:', error);
    return res.status(400).json({
      error: 'Eligibility check failed',
      message: error.message || 'Could not verify insurance eligibility'
    });
  }
});

// Function to get limitations for a specific category
function getLimitationsForCategory(category: string, limitations: any) {
  const categoryLimitations: string[] = [];
  
  Object.entries(limitations).forEach(([code, limitation]: [string, any]) => {
    if (limitation.category === category) {
      if (limitation.type === 'frequency') {
        categoryLimitations.push(`${code}: Limited to ${limitation.limit} per ${limitation.period}`);
      } else if (limitation.type === 'replacement') {
        categoryLimitations.push(`${code}: Replacement limited to once every ${limitation.limit} ${limitation.period}s`);
      }
    }
  });
  
  return categoryLimitations;
}

// Schema for insurance verification status check
const statusCheckSchema = z.object({
  patientId: z.number(),
  appointmentId: z.number().optional(),
  insuranceProvider: z.string().optional(),
  insuranceMemberId: z.string().optional()
});

// Create a new insurance verification record
router.post('/verifications', requireAuth, async (req: Request, res: Response) => {
  try {
    // Validate the request body
    const verification = insertInsuranceVerificationSchema.parse(req.body);
    
    // Create a new verification record
    const newVerification = await db.insert(insuranceVerifications).values({
      ...verification,
      verifiedBy: req.user!.id,
      verificationDate: new Date(),
      status: 'pending' as any, // Using the enum value
    }).returning();

    // Create audit trail
    await securityService.createAuditLog({
      userId: req.user!.id,
      action: 'create_insurance_verification',
      resource: `verification/${newVerification[0].id}`,
      result: 'success',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown',
      details: {
        patientId: verification.patientId,
        insuranceProvider: verification.insuranceProvider
      }
    });

    return res.status(201).json(newVerification[0]);
  } catch (error: any) {
    console.error('Error creating insurance verification:', error);
    return res.status(400).json({
      error: 'Failed to create insurance verification',
      message: error.message
    });
  }
});

// Get all insurance verifications for a patient
router.get('/verifications/patient/:patientId', requireAuth, async (req: Request, res: Response) => {
  try {
    const patientId = parseInt(req.params.patientId);
    
    // Get all verifications for this patient, ordered by most recent first
    const verifications = await db.query.insuranceVerifications.findMany({
      where: eq(insuranceVerifications.patientId, patientId),
      orderBy: [desc(insuranceVerifications.verificationDate)]
    });
    
    return res.json(verifications);
  } catch (error: any) {
    console.error('Error retrieving insurance verifications:', error);
    return res.status(400).json({
      error: 'Failed to retrieve insurance verifications',
      message: error.message
    });
  }
});

// Update an insurance verification status
router.patch('/verifications/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    
    // Ensure only allowed fields are updated
    const allowedUpdates = ['status', 'verificationResponse', 'notes'];
    const filteredUpdates: Record<string, any> = {};
    
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });
    
    // Add last updated timestamp
    filteredUpdates.lastUpdated = new Date();
    
    // Update the verification record
    const updatedVerification = await db
      .update(insuranceVerifications)
      .set(filteredUpdates)
      .where(eq(insuranceVerifications.id, id))
      .returning();
    
    if (!updatedVerification.length) {
      return res.status(404).json({
        error: 'Verification not found',
        message: 'The specified verification record does not exist'
      });
    }
    
    // Create audit trail
    await securityService.createAuditLog({
      userId: req.user!.id,
      action: 'update_insurance_verification',
      resource: `verification/${id}`,
      result: 'success',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown',
      details: {
        updates: filteredUpdates
      }
    });
    
    return res.json(updatedVerification[0]);
  } catch (error: any) {
    console.error('Error updating insurance verification:', error);
    return res.status(400).json({
      error: 'Failed to update insurance verification',
      message: error.message
    });
  }
});

// Check real-time status of insurance policy
router.post('/check-status', requireAuth, async (req: Request, res: Response) => {
  try {
    const { patientId, appointmentId, insuranceProvider, insuranceMemberId } = statusCheckSchema.parse(req.body);
    
    // Get the patient's insurance information if not provided
    let provider = insuranceProvider;
    let memberId = insuranceMemberId;
    
    if (!provider || !memberId) {
      const patientData = await db.query.patients.findFirst({
        where: eq(patients.id, patientId)
      });
      
      if (!patientData) {
        return res.status(404).json({ error: 'Patient not found' });
      }
      
      // Handle null or undefined values from the database
      provider = patientData.insuranceProvider ? patientData.insuranceProvider : undefined;
      memberId = patientData.insuranceNumber ? patientData.insuranceNumber : undefined;
      
      if (!provider || !memberId) {
        return res.status(400).json({
          error: 'Missing insurance information',
          message: 'Patient does not have insurance provider or member ID information'
        });
      }
    }
    
    // In a production environment, this would connect to an insurance verification API
    // to check the real-time status of the insurance policy
    
    // Simulate a real verification response
    const verificationResponse = {
      status: 'active',
      policyNumber: memberId,
      provider: provider,
      effectiveDate: '2023-01-01',
      terminationDate: null,
      coverageDetails: {
        deductibleMet: true,
        annualMaximum: 1500,
        usedAmount: 350,
        eligibleFor: ['preventive', 'basic', 'major']
      },
      subscriber: {
        name: 'Test Patient',
        relationship: 'self',
        employerName: 'Example Corp'
      },
      verificationTimestamp: new Date().toISOString()
    };
    
    // Save verification information
    const verificationDetails = {
      planType: 'PPO',
      coverage: {
        preventive: 100,
        basic: 80,
        major: 50,
        annual_maximum: 1500,
        remaining: 1150
      },
      deductible: {
        individual: 50,
        family: 150,
        met: true
      }
    };
    
    // Create a verification record if appointmentId is provided
    if (appointmentId) {
      // Note: We need to match the schema fields exactly
      const verificationData: InsertInsuranceVerification = {
        patientId,
        insuranceProvider: provider,
        memberId: memberId,
        status: 'verified' as any, // Cast to match enum
        verificationDate: new Date(),
        verificationDetails: verificationResponse,
        verifiedBy: req.user!.id,
        subscriberName: 'Test Patient',
        subscriberRelationship: 'self',
        planType: 'PPO',
        coverage: verificationDetails.coverage,
        deductible: verificationDetails.deductible
      };
      
      await db.insert(insuranceVerifications).values(verificationData);
    }
    
    // Return the verification results
    return res.json({
      verified: true,
      ...verificationResponse
    });
    
  } catch (error: any) {
    console.error('Insurance status check error:', error);
    return res.status(400).json({
      error: 'Status check failed',
      message: error.message || 'Could not verify insurance status'
    });
  }
});

// Get all active insurance verifications for dashboard
router.get('/active-verifications', requireAuth, requireRole(['admin', 'manager', 'assistant']), async (req: Request, res: Response) => {
  try {
    // Get pending and in-progress verifications
    const activeVerifications = await db.query.insuranceVerifications.findMany({
      where: (insuranceVerifications) => {
        return or(
          eq(insuranceVerifications.status, 'pending' as any),
          eq(insuranceVerifications.status, 'in_progress' as any)
        );
      },
      orderBy: [desc(insuranceVerifications.verificationDate)],
      limit: 100 // Limit to prevent excessive data
    });
    
    return res.json(activeVerifications);
  } catch (error: any) {
    console.error('Error retrieving active verifications:', error);
    return res.status(400).json({
      error: 'Failed to retrieve active verifications',
      message: error.message
    });
  }
});

export default router;