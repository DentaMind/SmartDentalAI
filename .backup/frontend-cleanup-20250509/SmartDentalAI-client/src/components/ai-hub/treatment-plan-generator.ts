/**
 * Treatment Plan Generator
 * 
 * This service generates comprehensive treatment plans using multi-AI consensus
 * and provides various plan options based on different criteria.
 */

import { AIDomain } from './ai-domains';
import { MultiDomainConsensus } from './ai-domains';

// Treatment plan types 
export type TreatmentPlanType = 
  'gold' |      // Gold standard: ideal treatment regardless of cost
  'insurance' | // Insurance-optimized: maximizes insurance coverage
  'phased' |    // Phased treatment: spreads treatment over time
  'essential' | // Essential care: focuses on urgent/necessary treatment only
  'cosmetic';   // Cosmetic-focused: prioritizes esthetic outcomes

// Treatment procedure object
export interface TreatmentProcedure {
  id: string;
  name: string;
  cdtCode: string;
  description: string;
  domain: AIDomain;
  teeth: string[];
  cost: number;
  coverage: number;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  sequence: number;
  visit: number;
  provider?: string;
  notes?: string;
  alternatives?: Alternative[];
  hasPrerequisites?: boolean;
  prerequisites?: string[];
}

// Alternative treatment option
export interface Alternative {
  name: string;
  cdtCode: string;
  cost: number;
  coverage: number;
  pros: string[];
  cons: string[];
}

// Complete treatment plan
export interface TreatmentPlan {
  id: string;
  patientId: number;
  doctorId: number;
  name: string;
  description: string;
  type: TreatmentPlanType;
  procedures: TreatmentProcedure[];
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'presented' | 'accepted' | 'declined' | 'completed';
  notes?: string;
  costEstimate: number;
  insuranceCoverage: number;
  outOfPocket: number;
  visitCount: number;
  estimatedCompletionTime: string;
  acceptedBy?: string;
  acceptedAt?: string;
  patientConsent?: boolean;
}

// Insurance coverage information
export interface InsuranceCoverage {
  provider: string;
  planName: string;
  memberID: string;
  coveragePercentages: {
    preventive: number;
    basic: number;
    major: number;
    orthodontic?: number;
  };
  annualMaximum: number;
  remainingBenefit: number;
  deductible: {
    amount: number;
    remaining: number;
    familyDeductible?: number;
  };
  exclusions: string[];
  waitingPeriods: {
    basic?: string;
    major?: string;
    orthodontic?: string;
  };
  frequencyLimitations: {
    exams: string;
    cleanings: string;
    xrays: string;
    fluoride?: string;
    sealants?: string;
    crowns?: string;
    dentures?: string;
  };
}

/**
 * Generate treatment plans based on AI consensus
 */
export function generateTreatmentPlans(
  patientId: number,
  doctorId: number,
  consensus: MultiDomainConsensus,
  insuranceInfo?: InsuranceCoverage
): TreatmentPlan[] {
  // Extract and combine all procedures from all domains
  const allProcedures: TreatmentProcedure[] = [];
  let procedureCount = 0;

  // Process each active domain with findings
  Object.entries(consensus.domains).forEach(([domainKey, domainData]) => {
    if (domainData.active && domainData.findings.length > 0) {
      const domain = domainKey as AIDomain;
      
      // Process each finding within the domain
      domainData.findings.forEach(finding => {
        // Each finding may suggest multiple procedures
        if (finding.suggestedProcedures && finding.suggestedProcedures.length > 0) {
          finding.suggestedProcedures.forEach(procedureString => {
            // Parse procedure string (format: "D2392 - Resin-based composite, two surfaces, posterior")
            const match = procedureString.match(/^(D\d+)\s*-\s*(.+)$/);
            if (match) {
              const [_, cdtCode, name] = match;
              
              // Generate teeth involved (in a real system this would be parsed from the finding)
              const teeth = extractTeethFromFinding(finding.finding);
              
              // Calculate estimated cost and coverage
              const cost = estimateProcedureCost(cdtCode);
              const coverage = insuranceInfo ? estimateInsuranceCoverage(cdtCode, cost, insuranceInfo) : 0;
              
              // Create the procedure object
              const procedure: TreatmentProcedure = {
                id: `proc-${++procedureCount}`,
                name,
                cdtCode,
                description: finding.finding,
                domain,
                teeth,
                cost,
                coverage,
                priority: finding.urgency as 'urgent' | 'high' | 'medium' | 'low',
                sequence: procedureCount,
                visit: 1, // Default visit, will be adjusted later
                notes: finding.recommendations.join('. ')
              };
              
              // Add alternatives if appropriate
              procedure.alternatives = generateAlternatives(procedure);
              
              // Add to the combined procedures list
              allProcedures.push(procedure);
            }
          });
        }
      });
    }
  });
  
  // Generate different plan types using the combined procedures
  return [
    generateGoldStandardPlan(patientId, doctorId, allProcedures, consensus),
    generateInsuranceOptimizedPlan(patientId, doctorId, allProcedures, consensus, insuranceInfo),
    generatePhasedPlan(patientId, doctorId, allProcedures, consensus)
  ];
}

/**
 * Extract teeth numbers from finding text
 */
function extractTeethFromFinding(findingText: string): string[] {
  // In a real implementation, this would use NLP to extract tooth numbers
  // For now, we'll use a simple regex to find patterns like "#30" or "teeth 18-20"
  const teeth: string[] = [];
  
  // Look for patterns like "#30" or "tooth #30"
  const singleToothPattern = /#(\d+)/g;
  let match;
  while ((match = singleToothPattern.exec(findingText)) !== null) {
    teeth.push(match[1]);
  }
  
  // If no teeth found, use a default
  if (teeth.length === 0) {
    // Check for common words that might indicate regions
    if (findingText.toLowerCase().includes('molar')) {
      // Add some typical molar numbers
      teeth.push('19', '30');
    } else if (findingText.toLowerCase().includes('anterior') || 
              findingText.toLowerCase().includes('front')) {
      // Add some typical anterior teeth
      teeth.push('8', '9');
    } else {
      // Just add a common tooth for example purposes
      teeth.push('30');
    }
  }
  
  return teeth;
}

/**
 * Estimate the cost of a procedure based on CDT code
 */
function estimateProcedureCost(cdtCode: string): number {
  // In a real implementation, this would use a database of procedure costs
  // For now, we'll use a simple mapping for demonstration purposes
  
  const codePrefixMap: Record<string, number> = {
    'D0': 100,   // Diagnostic
    'D1': 150,   // Preventive
    'D2': 250,   // Restorative
    'D3': 1000,  // Endodontics
    'D4': 300,   // Periodontics
    'D5': 1500,  // Prosthodontics (removable)
    'D6': 3000,  // Implant Services
    'D7': 500,   // Oral Surgery
    'D8': 5000,  // Orthodontics
    'D9': 200    // Adjunctive Services
  };
  
  // Get the first two characters of the CDT code for prefix match
  const prefix = cdtCode.substring(0, 2);
  
  // Return the mapped cost or a default
  return codePrefixMap[prefix] || 200;
}

/**
 * Estimate insurance coverage for a procedure
 */
function estimateInsuranceCoverage(
  cdtCode: string,
  cost: number,
  insuranceInfo: InsuranceCoverage
): number {
  // Determine coverage level based on CDT code
  let coverageCategory: 'preventive' | 'basic' | 'major' | 'orthodontic' = 'basic';
  let coveragePercentage = 0;
  
  // Map CDT code to coverage category
  if (cdtCode.startsWith('D00') || cdtCode.startsWith('D01') || 
      cdtCode.startsWith('D1')) {
    coverageCategory = 'preventive';
  } else if (cdtCode.startsWith('D2') && 
            !(cdtCode.startsWith('D27') || cdtCode.startsWith('D28') || cdtCode.startsWith('D29'))) {
    coverageCategory = 'basic';
  } else if (cdtCode.startsWith('D3') || cdtCode.startsWith('D4') || 
            cdtCode.startsWith('D5') || cdtCode.startsWith('D6') ||
            cdtCode.startsWith('D7') || cdtCode.startsWith('D27') ||
            cdtCode.startsWith('D28') || cdtCode.startsWith('D29')) {
    coverageCategory = 'major';
  } else if (cdtCode.startsWith('D8')) {
    coverageCategory = 'orthodontic';
  }
  
  // Get coverage percentage based on category
  switch (coverageCategory) {
    case 'preventive':
      coveragePercentage = insuranceInfo.coveragePercentages.preventive;
      break;
    case 'basic':
      coveragePercentage = insuranceInfo.coveragePercentages.basic;
      break;
    case 'major':
      coveragePercentage = insuranceInfo.coveragePercentages.major;
      break;
    case 'orthodontic':
      coveragePercentage = insuranceInfo.coveragePercentages.orthodontic || 0;
      break;
  }
  
  // Calculate coverage amount
  const coverageAmount = (cost * coveragePercentage) / 100;
  
  // Check if we're exceeding the remaining benefit
  if (coverageAmount > insuranceInfo.remainingBenefit) {
    return insuranceInfo.remainingBenefit;
  }
  
  return coverageAmount;
}

/**
 * Generate alternative treatment options
 */
function generateAlternatives(procedure: TreatmentProcedure): Alternative[] {
  const alternatives: Alternative[] = [];
  
  // Generate alternatives based on procedure type
  switch (procedure.cdtCode.substring(0, 3)) {
    case 'D274': // Crown - porcelain/ceramic
    case 'D275': // Crown - porcelain fused to metal
      // Add alternative crown types
      if (procedure.cdtCode === 'D2740') {
        // Porcelain/ceramic crown alternative: porcelain fused to metal
        alternatives.push({
          name: 'Crown - porcelain fused to high noble metal',
          cdtCode: 'D2750',
          cost: procedure.cost - 200,
          coverage: procedure.coverage + 100,
          pros: ['Lower cost', 'Higher insurance coverage'],
          cons: ['Less esthetic', 'Metal margin may show if gums recede']
        });
      } else if (procedure.cdtCode === 'D2750') {
        // PFM crown alternative: full metal crown
        alternatives.push({
          name: 'Crown - full cast high noble metal',
          cdtCode: 'D2790',
          cost: procedure.cost - 300,
          coverage: procedure.coverage + 150,
          pros: ['Most durable option', 'Requires less tooth reduction', 'Higher insurance coverage'],
          cons: ['Not esthetic - metallic appearance', 'Not suitable for front teeth']
        });
      }
      break;
      
    case 'D239': // Composite (white) fillings
      // Add amalgam (silver) filling as alternative
      const amalgamCode = procedure.cdtCode.replace(/^D239/, 'D214');
      alternatives.push({
        name: procedure.name.replace('Resin-based composite', 'Amalgam'),
        cdtCode: amalgamCode,
        cost: procedure.cost * 0.7,
        coverage: procedure.coverage * 1.2,
        pros: ['Lower cost', 'Higher insurance coverage', 'Very durable', 'Less technique-sensitive'],
        cons: ['Not tooth-colored', 'Requires more tooth removal', 'Contains mercury']
      });
      break;
      
    case 'D333': // Molar root canal
      // Add extraction as alternative
      alternatives.push({
        name: 'Extraction, erupted tooth requiring removal of bone and/or sectioning of tooth',
        cdtCode: 'D7210',
        cost: procedure.cost * 0.4,
        coverage: procedure.coverage * 1.1,
        pros: ['Lower initial cost', 'Shorter procedure time', 'No risk of root canal failure'],
        cons: ['Tooth loss', 'May require implant or bridge later (additional cost)', 'Adjacent teeth may shift']
      });
      break;
      
    case 'D601': // Implant
      // Add bridge as alternative
      alternatives.push({
        name: 'Bridge - pontic - porcelain fused to high noble metal',
        cdtCode: 'D6240',
        cost: procedure.cost * 0.8,
        coverage: procedure.coverage * 1.2,
        pros: ['Completed in less time', 'No surgery required', 'Higher insurance coverage'],
        cons: ['Requires reducing adjacent teeth', 'May not last as long as implant', 'Higher maintenance needs']
      });
      break;
  }
  
  return alternatives;
}

/**
 * Generate gold standard treatment plan
 */
function generateGoldStandardPlan(
  patientId: number,
  doctorId: number,
  procedures: TreatmentProcedure[],
  consensus: MultiDomainConsensus
): TreatmentPlan {
  // Clone procedures to avoid modifying original
  const goldProcedures = JSON.parse(JSON.stringify(procedures)) as TreatmentProcedure[];
  
  // Process each procedure
  goldProcedures.forEach(procedure => {
    // For gold standard, we always choose the highest quality option
    // If this procedure has alternatives, evaluate them
    if (procedure.alternatives && procedure.alternatives.length > 0) {
      // Check if any alternative is more premium (often more expensive)
      const premiumAlternative = procedure.alternatives.find(alt => alt.cost > procedure.cost);
      if (premiumAlternative) {
        // Replace with premium alternative
        procedure.name = premiumAlternative.name;
        procedure.cdtCode = premiumAlternative.cdtCode;
        procedure.cost = premiumAlternative.cost;
        procedure.coverage = premiumAlternative.coverage;
        
        // Move original to alternatives
        const originalAlt = {
          name: procedure.name,
          cdtCode: procedure.cdtCode,
          cost: procedure.cost,
          coverage: procedure.coverage,
          pros: ['Lower cost', 'Faster procedure'],
          cons: ['May not be as durable', 'Less ideal esthetic outcome']
        };
        
        procedure.alternatives = [originalAlt];
      }
    }
  });
  
  // Arrange visits in optimal sequence (priority-based)
  const visitPlan = arrangeVisits(goldProcedures, 'priority');
  
  // Calculate totals
  const costEstimate = visitPlan.reduce((sum, proc) => sum + proc.cost, 0);
  const insuranceCoverage = visitPlan.reduce((sum, proc) => sum + proc.coverage, 0);
  const outOfPocket = costEstimate - insuranceCoverage;
  
  // Get the total number of visits
  const visitCount = Math.max(...visitPlan.map(p => p.visit));
  
  // Create the treatment plan
  return {
    id: `plan-gold-${Date.now()}`,
    patientId,
    doctorId,
    name: 'Gold Standard Treatment Plan',
    description: 'Comprehensive care plan providing optimal long-term health outcomes without financial constraints',
    type: 'gold',
    procedures: visitPlan,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'draft',
    notes: 'This plan provides the highest quality materials and techniques for optimal long-term dental health.',
    costEstimate,
    insuranceCoverage,
    outOfPocket,
    visitCount,
    estimatedCompletionTime: `${visitCount} visits over ${estimateCompletionTimeInMonths(visitCount)} months`
  };
}

/**
 * Generate insurance-optimized treatment plan
 */
function generateInsuranceOptimizedPlan(
  patientId: number,
  doctorId: number,
  procedures: TreatmentProcedure[],
  consensus: MultiDomainConsensus,
  insuranceInfo?: InsuranceCoverage
): TreatmentPlan {
  // Clone procedures to avoid modifying original
  const insuranceProcedures = JSON.parse(JSON.stringify(procedures)) as TreatmentProcedure[];
  
  // Process each procedure
  insuranceProcedures.forEach(procedure => {
    // For insurance-optimized plan, choose options with better coverage
    if (procedure.alternatives && procedure.alternatives.length > 0) {
      // Find alternative with best coverage or coverage-to-cost ratio
      const bestCoverageAlt = procedure.alternatives
        .sort((a, b) => {
          // Calculate coverage percentage for each
          const aCoveragePercent = a.coverage / a.cost;
          const bCoveragePercent = b.coverage / b.cost;
          return bCoveragePercent - aCoveragePercent; // Higher percentage first
        })[0];
      
      if (bestCoverageAlt && (bestCoverageAlt.coverage / bestCoverageAlt.cost) > 
          (procedure.coverage / procedure.cost)) {
        // Replace with alternative that has better coverage
        procedure.name = bestCoverageAlt.name;
        procedure.cdtCode = bestCoverageAlt.cdtCode;
        procedure.cost = bestCoverageAlt.cost;
        procedure.coverage = bestCoverageAlt.coverage;
        
        // Update alternatives
        procedure.alternatives = procedure.alternatives.filter(
          alt => alt.cdtCode !== bestCoverageAlt.cdtCode
        );
      }
    }
  });
  
  // Arrange visits to maximize insurance benefits
  const visitPlan = arrangeVisits(insuranceProcedures, 'insurance');
  
  // Calculate totals
  const costEstimate = visitPlan.reduce((sum, proc) => sum + proc.cost, 0);
  const insuranceCoverage = visitPlan.reduce((sum, proc) => sum + proc.coverage, 0);
  const outOfPocket = costEstimate - insuranceCoverage;
  
  // Get the total number of visits
  const visitCount = Math.max(...visitPlan.map(p => p.visit));
  
  // Create the treatment plan
  return {
    id: `plan-insurance-${Date.now()}`,
    patientId,
    doctorId,
    name: 'Insurance-Optimized Treatment Plan',
    description: 'Treatment plan designed to maximize insurance benefits and minimize out-of-pocket costs',
    type: 'insurance',
    procedures: visitPlan,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'draft',
    notes: 'This plan is optimized to reduce your out-of-pocket costs while providing effective treatment.',
    costEstimate,
    insuranceCoverage,
    outOfPocket,
    visitCount,
    estimatedCompletionTime: `${visitCount} visits over ${estimateCompletionTimeInMonths(visitCount)} months`
  };
}

/**
 * Generate phased treatment plan
 */
function generatePhasedPlan(
  patientId: number,
  doctorId: number,
  procedures: TreatmentProcedure[],
  consensus: MultiDomainConsensus
): TreatmentPlan {
  // Clone procedures to avoid modifying original
  const phasedProcedures = JSON.parse(JSON.stringify(procedures)) as TreatmentProcedure[];
  
  // Arrange by priority first, then spread over more visits
  const visitPlan = arrangeVisits(phasedProcedures, 'phased');
  
  // Calculate totals
  const costEstimate = visitPlan.reduce((sum, proc) => sum + proc.cost, 0);
  const insuranceCoverage = visitPlan.reduce((sum, proc) => sum + proc.coverage, 0);
  const outOfPocket = costEstimate - insuranceCoverage;
  
  // Get the total number of visits
  const visitCount = Math.max(...visitPlan.map(p => p.visit));
  
  // Create the treatment plan
  return {
    id: `plan-phased-${Date.now()}`,
    patientId,
    doctorId,
    name: 'Phased Treatment Plan',
    description: 'Treatment plan divided into phases to address urgent needs first and spread costs over time',
    type: 'phased',
    procedures: visitPlan,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'draft',
    notes: 'This plan spreads treatment over time, focusing on the most urgent needs first.',
    costEstimate,
    insuranceCoverage,
    outOfPocket,
    visitCount,
    estimatedCompletionTime: `${visitCount} visits over ${estimateCompletionTimeInMonths(visitCount) + 4} months`
  };
}

/**
 * Arrange procedures into visits
 */
function arrangeVisits(
  procedures: TreatmentProcedure[],
  planType: 'priority' | 'insurance' | 'phased'
): TreatmentProcedure[] {
  // Sort procedures by priority
  const sortedProcedures = [...procedures].sort((a, b) => {
    // Sort by priority
    const priorityMap: Record<string, number> = {
      'urgent': 4,
      'high': 3,
      'medium': 2,
      'low': 1
    };
    
    const priorityA = priorityMap[a.priority] || 0;
    const priorityB = priorityMap[b.priority] || 0;
    
    // For priority plan, priority is the main factor
    if (planType === 'priority') {
      if (priorityA !== priorityB) return priorityB - priorityA;
    }
    
    // For phased plan, we strictly adhere to priority order
    if (planType === 'phased') {
      if (priorityA !== priorityB) return priorityB - priorityA;
      return a.cost - b.cost; // Lower cost first within same priority
    }
    
    // For insurance plan, we factor in both priority and coverage
    if (planType === 'insurance') {
      // Use a weighted score combining priority and coverage percentage
      const coveragePercentA = a.coverage / a.cost;
      const coveragePercentB = b.coverage / b.cost;
      
      const scoreA = (priorityA * 0.7) + (coveragePercentA * 0.3 * 10);
      const scoreB = (priorityB * 0.7) + (coveragePercentB * 0.3 * 10);
      
      return scoreB - scoreA;
    }
    
    // Default sorting: priority, then domain
    if (priorityA !== priorityB) return priorityB - priorityA;
    return a.domain.localeCompare(b.domain);
  });
  
  // Determine how many procedures per visit based on plan type
  let proceduresPerVisit: number;
  let maxVisits: number;
  
  switch (planType) {
    case 'priority':
      proceduresPerVisit = 3; // More procedures per visit
      maxVisits = 6;
      break;
    case 'insurance':
      proceduresPerVisit = 2; // Balance between visits and procedures
      maxVisits = 8;
      break;
    case 'phased':
      proceduresPerVisit = 1; // Fewer procedures per visit, more spread out
      maxVisits = 12;
      break;
    default:
      proceduresPerVisit = 2;
      maxVisits = 8;
  }
  
  // Assign visits
  let currentVisit = 1;
  let proceduresInCurrentVisit = 0;
  let currentPriority: string | null = null;
  
  // Helper function to check if two procedures can be done in the same visit
  const areCompatible = (proc1: TreatmentProcedure, proc2: TreatmentProcedure) => {
    // Check if they involve the same teeth
    const teethOverlap = proc1.teeth.some(tooth => proc2.teeth.includes(tooth));
    
    // Some domain combinations should be avoided in the same visit
    const incompatibleDomains = [
      ['endo', 'surgery'],
      ['endo', 'prostho']
    ];
    
    const domainsIncompatible = incompatibleDomains.some(
      pair => (proc1.domain === pair[0] && proc2.domain === pair[1]) || 
             (proc1.domain === pair[1] && proc2.domain === pair[0])
    );
    
    // If teeth overlap and domains are not compatible, they should be in different visits
    return !(teethOverlap && domainsIncompatible);
  };
  
  sortedProcedures.forEach((procedure, index) => {
    // Check if this procedure is compatible with previous procedures in this visit
    const isCompatibleWithCurrentVisit = sortedProcedures
      .filter(p => p.visit === currentVisit)
      .every(p => areCompatible(p, procedure));
    
    // Check if we need to start a new visit
    if (
      // Start new visit if we've reached the limit for this visit
      proceduresInCurrentVisit >= proceduresPerVisit ||
      // Or if this procedure is not compatible with current visit
      !isCompatibleWithCurrentVisit ||
      // For phased plan, put each priority level in separate visits
      (planType === 'phased' && currentPriority !== null && procedure.priority !== currentPriority)
    ) {
      currentVisit++;
      proceduresInCurrentVisit = 0;
      currentPriority = procedure.priority;
    }
    
    // Assign this procedure to the current visit
    procedure.visit = currentVisit;
    proceduresInCurrentVisit++;
    
    // Track current priority
    if (currentPriority === null) {
      currentPriority = procedure.priority;
    }
    
    // For insurance plan, we might want to split high-cost items across benefit years
    if (planType === 'insurance' && procedure.cost > 1000 && currentVisit < maxVisits - 1) {
      currentVisit++;
      proceduresInCurrentVisit = 0;
    }
  });
  
  // Handle prerequisites
  const finalProcedures = [...sortedProcedures];
  
  // Check for sequential treatment requirements (e.g., endo before crown)
  finalProcedures.forEach(proc1 => {
    finalProcedures.forEach(proc2 => {
      // If same tooth and one is endo and one is prostho, ensure endo is first
      const sameTeeth = proc1.teeth.some(tooth => proc2.teeth.includes(tooth));
      
      if (sameTeeth) {
        if (proc1.domain === 'endo' && proc2.domain === 'prostho') {
          // Ensure endo comes before prostho
          if (proc1.visit > proc2.visit) {
            // Swap visits
            const temp = proc2.visit;
            proc2.visit = proc1.visit;
            proc1.visit = temp;
          }
          
          // Mark dependency
          proc2.hasPrerequisites = true;
          if (!proc2.prerequisites) proc2.prerequisites = [];
          proc2.prerequisites.push(proc1.id);
        }
        else if (proc2.domain === 'endo' && proc1.domain === 'prostho') {
          // Ensure endo comes before prostho
          if (proc2.visit > proc1.visit) {
            // Swap visits
            const temp = proc1.visit;
            proc1.visit = proc2.visit;
            proc2.visit = temp;
          }
          
          // Mark dependency
          proc1.hasPrerequisites = true;
          if (!proc1.prerequisites) proc1.prerequisites = [];
          proc1.prerequisites.push(proc2.id);
        }
      }
    });
  });
  
  return finalProcedures;
}

/**
 * Estimate time to complete treatment in months
 */
function estimateCompletionTimeInMonths(visitCount: number): number {
  // Simple estimation based on visits
  if (visitCount <= 2) return 1;
  if (visitCount <= 4) return 2;
  if (visitCount <= 6) return 3;
  if (visitCount <= 8) return 4;
  return Math.ceil(visitCount / 2);
}