/**
 * Insurance Optimization Service
 * 
 * This service handles insurance verification, coverage analysis,
 * and treatment coding optimization to maximize patient benefits.
 */

import { InsuranceCoverage, TreatmentProcedure, TreatmentPlan } from './treatment-plan-generator';

// Insurance plan types
export type InsurancePlanType = 'PPO' | 'HMO' | 'Fee-for-Service' | 'Discount' | 'Medicare' | 'Medicaid' | 'Self-Pay';

// Insurance verification status
export type VerificationStatus = 'verified' | 'pending' | 'failed' | 'expired';

// Insurance plan details from provider
export interface InsurancePlanDetails {
  provider: string;
  planName: string;
  planType: InsurancePlanType;
  memberId: string;
  groupNumber?: string;
  coveragePercentages: {
    preventive: number; // Exams, cleanings, x-rays
    basic: number;      // Fillings, simple extractions
    major: number;      // Crowns, bridges, root canals, dentures
    orthodontic?: number;
  };
  deductible: {
    individual: number;
    family?: number;
    remaining: number;
  };
  maximums: {
    annual: number;
    lifetime?: number;
    orthodontic?: number;
    remaining: {
      annual: number;
      lifetime?: number;
      orthodontic?: number;
    };
  };
  effectiveDate: string;
  terminationDate?: string;
  verificationStatus: VerificationStatus;
  lastVerified?: string;
  primarySubscriber: {
    name: string;
    relationship: 'self' | 'spouse' | 'child' | 'other';
    dateOfBirth: string;
  };
  secondaryInsurance?: boolean;
}

// Insurance verification request
export interface VerificationRequest {
  provider: string;
  memberId: string;
  groupNumber?: string;
  patientName: string;
  patientDateOfBirth: string;
  subscriberName?: string;
  subscriberDateOfBirth?: string;
  subscriberRelationship?: 'self' | 'spouse' | 'child' | 'other';
}

// Insurance verification response
export interface VerificationResponse {
  status: VerificationStatus;
  planDetails?: InsurancePlanDetails;
  errors?: string[];
  warnings?: string[];
  timestamp: string;
}

// CDT Code Category
export type CDTCodeCategory = 'diagnostic' | 'preventive' | 'restorative' | 'endodontic' | 
                             'periodontic' | 'prosthodontic-removable' | 'prosthodontic-fixed' | 
                             'oral-surgery' | 'orthodontic' | 'adjunctive';

// CDT Code Information
export interface CDTCodeInfo {
  code: string;
  description: string;
  category: CDTCodeCategory;
  alternativeCodes?: string[];
  notes?: string[];
  typicalCoverage?: 'preventive' | 'basic' | 'major' | 'orthodontic' | 'not-covered';
  estimatedFee?: number;
}

// Benefit limitation
export interface BenefitLimitation {
  type: 'frequency' | 'age' | 'downgrade' | 'exclusion' | 'waiting-period' | 'pre-authorization';
  description: string;
  affectedCodes?: string[];
  frequency?: string; // e.g., "2 per 12 months"
  ageRange?: {min?: number; max?: number};
  downgradeTo?: string;
  waitingPeriod?: string; // e.g., "6 months"
  requiresPreAuth?: boolean;
}

/**
 * Verify patient's insurance coverage
 */
export async function verifyInsurance(
  request: VerificationRequest
): Promise<VerificationResponse> {
  // In a real implementation, this would make an API call to an insurance verification service
  // For development purposes, we'll mock the response
  
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // TODO: In production, this would be replaced with a real API call
    // For demo, we'll return a mock response
    const mockPlanDetails: InsurancePlanDetails = {
      provider: request.provider,
      planName: `${request.provider} Dental Complete`,
      planType: 'PPO',
      memberId: request.memberId,
      groupNumber: request.groupNumber,
      coveragePercentages: {
        preventive: 100,
        basic: 80,
        major: 50,
        orthodontic: 50
      },
      deductible: {
        individual: 50,
        family: 150,
        remaining: 0 // Deductible met
      },
      maximums: {
        annual: 1500,
        lifetime: 5000,
        orthodontic: 1500,
        remaining: {
          annual: 1200,
          lifetime: 4500,
          orthodontic: 1500
        }
      },
      effectiveDate: '2025-01-01',
      verificationStatus: 'verified',
      lastVerified: new Date().toISOString(),
      primarySubscriber: {
        name: request.subscriberName || request.patientName,
        relationship: request.subscriberRelationship || 'self',
        dateOfBirth: request.subscriberDateOfBirth || request.patientDateOfBirth
      }
    };
    
    return {
      status: 'verified',
      planDetails: mockPlanDetails,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error verifying insurance:', error);
    return {
      status: 'failed',
      errors: ['Failed to connect to insurance verification service'],
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get insurance coverage for a specific CDT code
 */
export function getCodeCoverage(
  code: string,
  planDetails: InsurancePlanDetails,
  patientHistory: any
): {
  covered: boolean;
  coverageCategory: 'preventive' | 'basic' | 'major' | 'orthodontic' | 'not-covered';
  coveragePercent: number;
  limitations?: BenefitLimitation[];
  frequency?: string;
  lastServiceDate?: string;
  waitingPeriod?: string;
  requiresPreAuth?: boolean;
  alternative?: {
    code: string;
    description: string;
    coveragePercent: number;
  };
} {
  // In a real implementation, this would query a database of CDT codes
  // and match against the specific insurance plan's coverage rules
  
  // For demo purposes, we'll use a simple mapping
  const codeMapping: Record<string, {
    category: 'preventive' | 'basic' | 'major' | 'orthodontic' | 'not-covered',
    description: string
  }> = {
    // Diagnostic
    'D0120': { category: 'preventive', description: 'Periodic oral evaluation' },
    'D0150': { category: 'preventive', description: 'Comprehensive oral evaluation' },
    'D0210': { category: 'preventive', description: 'Intraoral - complete series of radiographic images' },
    'D0220': { category: 'preventive', description: 'Intraoral - periapical first radiographic image' },
    'D0230': { category: 'preventive', description: 'Intraoral - periapical each additional radiographic image' },
    'D0274': { category: 'preventive', description: 'Bitewings - four radiographic images' },
    
    // Preventive
    'D1110': { category: 'preventive', description: 'Prophylaxis - adult' },
    'D1120': { category: 'preventive', description: 'Prophylaxis - child' },
    'D1351': { category: 'preventive', description: 'Sealant - per tooth' },
    'D1352': { category: 'preventive', description: 'Preventive resin restoration' },
    
    // Restorative
    'D2140': { category: 'basic', description: 'Amalgam - one surface, primary or permanent' },
    'D2150': { category: 'basic', description: 'Amalgam - two surfaces, primary or permanent' },
    'D2160': { category: 'basic', description: 'Amalgam - three surfaces, primary or permanent' },
    'D2330': { category: 'basic', description: 'Resin-based composite - one surface, anterior' },
    'D2331': { category: 'basic', description: 'Resin-based composite - two surfaces, anterior' },
    'D2332': { category: 'basic', description: 'Resin-based composite - three surfaces, anterior' },
    'D2391': { category: 'basic', description: 'Resin-based composite - one surface, posterior' },
    'D2392': { category: 'basic', description: 'Resin-based composite - two surfaces, posterior' },
    'D2393': { category: 'basic', description: 'Resin-based composite - three surfaces, posterior' },
    'D2740': { category: 'major', description: 'Crown - porcelain/ceramic' },
    'D2750': { category: 'major', description: 'Crown - porcelain fused to high noble metal' },
    'D2751': { category: 'major', description: 'Crown - porcelain fused to predominantly base metal' },
    'D2752': { category: 'major', description: 'Crown - porcelain fused to noble metal' },
    'D2790': { category: 'major', description: 'Crown - full cast high noble metal' },
    
    // Endodontics
    'D3310': { category: 'major', description: 'Endodontic therapy, anterior tooth' },
    'D3320': { category: 'major', description: 'Endodontic therapy, premolar tooth' },
    'D3330': { category: 'major', description: 'Endodontic therapy, molar tooth' },
    
    // Periodontics
    'D4210': { category: 'major', description: 'Gingivectomy or gingivoplasty - four or more contiguous teeth' },
    'D4341': { category: 'basic', description: 'Periodontal scaling and root planing - four or more teeth per quadrant' },
    'D4342': { category: 'basic', description: 'Periodontal scaling and root planing - one to three teeth per quadrant' },
    'D4910': { category: 'basic', description: 'Periodontal maintenance' },
    
    // Prosthodontics, removable
    'D5110': { category: 'major', description: 'Complete denture - maxillary' },
    'D5120': { category: 'major', description: 'Complete denture - mandibular' },
    'D5130': { category: 'major', description: 'Immediate denture - maxillary' },
    'D5140': { category: 'major', description: 'Immediate denture - mandibular' },
    'D5211': { category: 'major', description: 'Maxillary partial denture - resin base' },
    'D5212': { category: 'major', description: 'Mandibular partial denture - resin base' },
    
    // Prosthodontics, fixed
    'D6210': { category: 'major', description: 'Pontic - cast high noble metal' },
    'D6240': { category: 'major', description: 'Pontic - porcelain fused to high noble metal' },
    'D6750': { category: 'major', description: 'Retainer crown - porcelain fused to high noble metal' },
    
    // Implant Services
    'D6010': { category: 'major', description: 'Surgical placement of implant body: endosteal implant' },
    'D6056': { category: 'major', description: 'Prefabricated abutment - includes modification and placement' },
    'D6058': { category: 'major', description: 'Abutment supported porcelain/ceramic crown' },
    'D6059': { category: 'major', description: 'Abutment supported porcelain fused to metal crown (high noble metal)' },
    
    // Oral Surgery
    'D7140': { category: 'basic', description: 'Extraction, erupted tooth or exposed root' },
    'D7210': { category: 'basic', description: 'Extraction, erupted tooth requiring removal of bone and/or sectioning of tooth' },
    'D7220': { category: 'basic', description: 'Removal of impacted tooth - soft tissue' },
    'D7230': { category: 'basic', description: 'Removal of impacted tooth - partially bony' },
    'D7240': { category: 'basic', description: 'Removal of impacted tooth - completely bony' },
    
    // Orthodontics
    'D8080': { category: 'orthodontic', description: 'Comprehensive orthodontic treatment of the adolescent dentition' },
    'D8090': { category: 'orthodontic', description: 'Comprehensive orthodontic treatment of the adult dentition' },
    
    // Adjunctive
    'D9110': { category: 'basic', description: 'Palliative (emergency) treatment of dental pain - minor procedure' },
    'D9215': { category: 'basic', description: 'Local anesthesia in conjunction with operative or surgical procedures' },
    'D9944': { category: 'basic', description: 'Occlusal guard - hard appliance, full arch' },
  };
  
  // Get code info or default to "not-covered"
  const codeInfo = codeMapping[code] || { category: 'not-covered', description: 'Unknown procedure' };
  
  // Get coverage percentage based on category
  let coveragePercent = 0;
  if (codeInfo.category === 'preventive') {
    coveragePercent = planDetails.coveragePercentages.preventive;
  } else if (codeInfo.category === 'basic') {
    coveragePercent = planDetails.coveragePercentages.basic;
  } else if (codeInfo.category === 'major') {
    coveragePercent = planDetails.coveragePercentages.major;
  } else if (codeInfo.category === 'orthodontic' && planDetails.coveragePercentages.orthodontic) {
    coveragePercent = planDetails.coveragePercentages.orthodontic;
  }
  
  // Check for limitations
  const limitations: BenefitLimitation[] = [];
  
  // Frequency limitations (would be from the plan in a real implementation)
  if (code.startsWith('D01') || code === 'D0210' || code === 'D0274') {
    limitations.push({
      type: 'frequency',
      description: 'Limited to 2 per 12 months',
      affectedCodes: ['D0120', 'D0150', 'D0210', 'D0274'],
      frequency: '2 per 12 months'
    });
  }
  
  if (code === 'D1110') {
    limitations.push({
      type: 'frequency',
      description: 'Limited to 2 per 12 months',
      affectedCodes: ['D1110'],
      frequency: '2 per 12 months'
    });
  }
  
  if (code.startsWith('D27') || code.startsWith('D67')) {
    limitations.push({
      type: 'frequency',
      description: 'Limited to once per tooth every 5 years',
      affectedCodes: ['D2740', 'D2750', 'D2751', 'D2752', 'D2790', 'D6750'],
      frequency: '1 per 5 years per tooth'
    });
  }
  
  if (code === 'D4341' || code === 'D4342') {
    limitations.push({
      type: 'frequency',
      description: 'Limited to once per quadrant every 24 months',
      affectedCodes: ['D4341', 'D4342'],
      frequency: '1 per quadrant per 24 months'
    });
  }
  
  // Pre-authorization requirements
  if (code.startsWith('D2') && !code.startsWith('D21') && !code.startsWith('D23')) {
    limitations.push({
      type: 'pre-authorization',
      description: 'Pre-authorization recommended for crowns',
      affectedCodes: ['D2740', 'D2750', 'D2751', 'D2752', 'D2790'],
      requiresPreAuth: true
    });
  }
  
  if (code.startsWith('D6')) {
    limitations.push({
      type: 'pre-authorization',
      description: 'Pre-authorization required for implants and fixed prosthodontics',
      affectedCodes: ['D6010', 'D6056', 'D6058', 'D6059', 'D6210', 'D6240', 'D6750'],
      requiresPreAuth: true
    });
  }
  
  // Downgrade clauses
  if (code === 'D2750' || code === 'D2752' || code === 'D2790') {
    limitations.push({
      type: 'downgrade',
      description: 'Benefits for posterior crowns are limited to the benefit for a predominantly base metal crown',
      affectedCodes: ['D2750', 'D2752', 'D2790'],
      downgradeTo: 'D2751'
    });
  }
  
  // Alternative benefit provisions
  let alternative = undefined;
  if (code === 'D2740') {
    alternative = {
      code: 'D2751',
      description: 'Crown - porcelain fused to predominantly base metal',
      coveragePercent: planDetails.coveragePercentages.major
    };
  } else if (code === 'D6059') {
    alternative = {
      code: 'D6060',
      description: 'Abutment supported porcelain fused to metal crown (predominantly base metal)',
      coveragePercent: planDetails.coveragePercentages.major
    };
  } else if (code === 'D6010') {
    alternative = {
      code: 'D6210',
      description: 'Pontic - cast high noble metal (bridge)',
      coveragePercent: planDetails.coveragePercentages.major
    };
  }
  
  return {
    covered: coveragePercent > 0,
    coverageCategory: codeInfo.category,
    coveragePercent,
    limitations,
    alternative
  };
}

/**
 * Get the estimated coverage for a treatment procedure
 */
export function estimateProcedureCoverage(
  procedure: TreatmentProcedure,
  planDetails: InsurancePlanDetails,
  patientHistory: any
): {
  estimatedCoverage: number;
  limitations: BenefitLimitation[];
  notes: string[];
} {
  // Get basic coverage info for the procedure's CDT code
  const coverageInfo = getCodeCoverage(procedure.cdtCode, planDetails, patientHistory);
  
  // Calculate estimated coverage
  let estimatedCoverage = (procedure.cost * coverageInfo.coveragePercent) / 100;
  
  // Apply any limitations that would affect coverage
  let notes: string[] = [];
  
  // Check if we've exceeded annual maximum
  if (estimatedCoverage > planDetails.maximums.remaining.annual) {
    estimatedCoverage = planDetails.maximums.remaining.annual;
    notes.push(`Coverage limited by remaining annual maximum of $${planDetails.maximums.remaining.annual}`);
  }
  
  // Check for frequency limitations
  const frequencyLimitation = coverageInfo.limitations?.find(l => l.type === 'frequency');
  if (frequencyLimitation) {
    // In a real implementation, we would check patient history to see if
    // the patient has already had this procedure within the frequency limitation period
    // For now, we'll just add a note
    notes.push(`Frequency limitation: ${frequencyLimitation.description}`);
  }
  
  // Check for pre-authorization requirements
  const preAuthLimitation = coverageInfo.limitations?.find(l => l.type === 'pre-authorization');
  if (preAuthLimitation) {
    notes.push(`Pre-authorization ${preAuthLimitation.requiresPreAuth ? 'required' : 'recommended'}`);
  }
  
  // Check for downgrade clauses
  const downgradeLimitation = coverageInfo.limitations?.find(l => l.type === 'downgrade');
  if (downgradeLimitation && downgradeLimitation.downgradeTo) {
    const downgradeInfo = getCodeCoverage(downgradeLimitation.downgradeTo, planDetails, patientHistory);
    // Adjust coverage based on downgrade
    estimatedCoverage = (procedure.cost * downgradeInfo.coveragePercent) / 100;
    notes.push(`Benefit downgraded to ${downgradeLimitation.downgradeTo} (${downgradeInfo.coveragePercent}% coverage)`);
  }
  
  return {
    estimatedCoverage,
    limitations: coverageInfo.limitations || [],
    notes
  };
}

/**
 * Get the optimized treatment plan based on insurance coverage
 */
export function optimizeTreatmentPlan(
  originalPlan: TreatmentPlan,
  planDetails: InsurancePlanDetails,
  patientHistory: any
): TreatmentPlan {
  // Create a copy of the original plan
  const optimizedPlan: TreatmentPlan = {
    ...originalPlan,
    id: `${originalPlan.id}-optimized`,
    name: `${originalPlan.name} (Insurance Optimized)`,
    description: 'Plan optimized for maximum insurance coverage and lower out-of-pocket costs',
    procedures: JSON.parse(JSON.stringify(originalPlan.procedures)), // Deep copy
    type: 'insurance'
  };
  
  // Optimize each procedure for better insurance coverage
  optimizedPlan.procedures = optimizedPlan.procedures.map(proc => {
    // Get coverage info for this procedure
    const coverageInfo = getCodeCoverage(proc.cdtCode, planDetails, patientHistory);
    
    // If there's an alternative with better coverage, use it
    if (coverageInfo.alternative && 
        (coverageInfo.alternative.coveragePercent > coverageInfo.coveragePercent)) {
      // Create a copy of the procedure with the alternative
      const optimizedProc = { ...proc };
      optimizedProc.cdtCode = coverageInfo.alternative.code;
      optimizedProc.name = coverageInfo.alternative.description;
      
      // Save the original as an alternative
      if (!optimizedProc.alternatives) {
        optimizedProc.alternatives = [];
      }
      optimizedProc.alternatives.push({
        name: proc.name,
        cdtCode: proc.cdtCode,
        cost: proc.cost,
        coverage: proc.coverage,
        pros: ['Better quality', 'More durable', 'Better esthetics'],
        cons: ['Higher out-of-pocket cost', 'Less insurance coverage']
      });
      
      return optimizedProc;
    }
    
    return proc;
  });
  
  // Recalculate costs and coverage
  let totalCost = 0;
  let totalCoverage = 0;
  
  optimizedPlan.procedures.forEach(proc => {
    totalCost += proc.cost;
    totalCoverage += proc.coverage;
  });
  
  optimizedPlan.costEstimate = totalCost;
  optimizedPlan.insuranceCoverage = totalCoverage;
  optimizedPlan.outOfPocket = totalCost - totalCoverage;
  
  return optimizedPlan;
}

/**
 * Generate a patient-friendly explanation of insurance coverage
 */
export function generateInsuranceExplanation(
  planDetails: InsurancePlanDetails,
  selectedPlan: TreatmentPlan
): string {
  // Calculate remaining benefits after this treatment plan
  const remainingAfterTreatment = Math.max(
    0,
    planDetails.maximums.remaining.annual - selectedPlan.insuranceCoverage
  );
  
  const coveragePercentage = Math.round((selectedPlan.insuranceCoverage / selectedPlan.costEstimate) * 100);
  
  return `Insurance Coverage Explanation for ${selectedPlan.name}:

Your insurance plan (${planDetails.planName}) covers:
• Preventive services: ${planDetails.coveragePercentages.preventive}%
• Basic services: ${planDetails.coveragePercentages.basic}%
• Major services: ${planDetails.coveragePercentages.major}%

For this treatment plan:
• Total treatment cost: $${selectedPlan.costEstimate.toLocaleString()}
• Insurance will cover: $${selectedPlan.insuranceCoverage.toLocaleString()} (${coveragePercentage}%)
• Your out-of-pocket cost: $${selectedPlan.outOfPocket.toLocaleString()}

Your annual maximum benefit is $${planDetails.maximums.annual.toLocaleString()}.
You have $${planDetails.maximums.remaining.annual.toLocaleString()} remaining before this treatment.
You will have $${remainingAfterTreatment.toLocaleString()} remaining after this treatment.

Important limitations:
• Frequency limitations for exams and cleanings: 2 per 12 months
• Crowns limited to once per tooth every 5 years
• Pre-authorization required for implants and major procedures

Payment options:
• Pay in full: $${selectedPlan.outOfPocket.toLocaleString()} (5% discount available)
• Monthly payments: $${Math.round(selectedPlan.outOfPocket / 12).toLocaleString()}/month for 12 months (no interest)
`;
}