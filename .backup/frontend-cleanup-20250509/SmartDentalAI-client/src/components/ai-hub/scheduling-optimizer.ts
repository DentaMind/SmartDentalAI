/**
 * Scheduling Optimizer
 * 
 * This service optimizes appointment scheduling by grouping procedures efficiently,
 * reducing the number of visits, and maximizing provider productivity.
 */

import { AIDomain } from './ai-domains';
import { TreatmentProcedure, TreatmentPlan } from './treatment-plan-generator';

// Scheduling constraints
export interface SchedulingConstraints {
  maxAppointmentLength: number; // minutes
  providerAvailability: ProviderAvailability[];
  patientPreferences?: {
    preferredDays?: string[];
    preferredTimes?: string[];
    maxVisitLength?: number; // minutes
  };
  minTimeBetweenVisits?: number; // days
  patientMobility?: 'normal' | 'limited' | 'very-limited';
  urgentProcedureIds?: string[];
}

// Provider availability
export interface ProviderAvailability {
  providerId: number;
  name: string;
  availability: TimeSlot[];
  specialties: AIDomain[];
}

// Time slot
export interface TimeSlot {
  day: string; // 'monday', 'tuesday', etc.
  startTime: string; // 24h format, e.g. '09:00'
  endTime: string; // 24h format, e.g. '17:00'
  unavailable?: boolean;
}

// Optimized appointment
export interface OptimizedAppointment {
  visitNumber: number;
  procedures: TreatmentProcedure[];
  estimatedDuration: number; // minutes
  preferredProvider?: {
    id: number;
    name: string;
  };
  notes: string[];
  priority: 'urgent' | 'high' | 'medium' | 'low';
  readyToSchedule: boolean;
  dependsOnVisit?: number; // If this visit depends on the completion of another visit
  idealTimingAfterPrevious?: {
    min: number; // minimum days after previous visit
    max: number; // maximum days after previous visit
    reason: string;
  };
}

// Procedure time estimates
const procedureTimeEstimates: Record<string, number> = {
  // Default category times (minutes)
  'D0100-D0999': 30, // Diagnostic
  'D1000-D1999': 45, // Preventive
  'D2000-D2999': 60, // Restorative
  'D3000-D3999': 90, // Endodontic
  'D4000-D4999': 60, // Periodontic
  'D5000-D5899': 60, // Removable Prosthodontic
  'D5900-D5999': 60, // Maxillofacial Prosthetics
  'D6000-D6199': 90, // Implant Services
  'D6200-D6999': 90, // Fixed Prosthodontic
  'D7000-D7999': 60, // Oral Surgery
  'D8000-D8999': 60, // Orthodontics
  'D9000-D9999': 30, // Adjunctive Services
  
  // Specific procedure times
  'D0120': 20, // Periodic oral evaluation
  'D0150': 40, // Comprehensive oral evaluation
  'D0210': 20, // Intraoral - complete series
  'D0220': 10, // Intraoral - periapical first film
  'D0230': 5,  // Intraoral - periapical each additional film
  'D0274': 15, // Bitewings - four films
  'D0330': 15, // Panoramic film
  
  'D1110': 45, // Prophylaxis - adult
  'D1120': 30, // Prophylaxis - child
  'D1351': 20, // Sealant - per tooth
  
  'D2140': 30, // Amalgam - one surface
  'D2150': 45, // Amalgam - two surfaces
  'D2160': 60, // Amalgam - three surfaces
  'D2161': 60, // Amalgam - four or more surfaces
  'D2330': 30, // Resin - one surface, anterior
  'D2331': 45, // Resin - two surfaces, anterior
  'D2332': 60, // Resin - three surfaces, anterior
  'D2335': 75, // Resin - four or more surfaces or incisal angle
  'D2390': 75, // Resin crown, anterior
  'D2391': 45, // Resin - one surface, posterior
  'D2392': 60, // Resin - two surfaces, posterior
  'D2393': 75, // Resin - three surfaces, posterior
  'D2394': 90, // Resin - four or more surfaces, posterior
  
  'D2740': 90, // Crown - porcelain/ceramic substrate
  'D2750': 90, // Crown - porcelain fused to high noble metal
  'D2751': 90, // Crown - porcelain fused to predominantly base metal
  'D2752': 90, // Crown - porcelain fused to noble metal
  'D2950': 30, // Core buildup, including any pins
  'D2952': 45, // Post and core in addition to crown
  'D2954': 30, // Prefabricated post and core in addition to crown
  
  'D3310': 60, // Anterior root canal
  'D3320': 75, // Bicuspid root canal
  'D3330': 90, // Molar root canal
  
  'D4210': 60, // Gingivectomy or gingivoplasty - four or more teeth
  'D4211': 45, // Gingivectomy or gingivoplasty - one to three teeth
  'D4341': 60, // Periodontal scaling and root planing - four or more teeth per quadrant
  'D4342': 45, // Periodontal scaling and root planing - one to three teeth per quadrant
  'D4910': 45, // Periodontal maintenance
  
  'D5110': 90, // Complete denture - maxillary
  'D5120': 90, // Complete denture - mandibular
  
  'D6010': 90, // Surgical placement of implant body: endosteal implant
  'D6056': 45, // Prefabricated abutment - includes modification and placement
  'D6058': 60, // Abutment supported porcelain/ceramic crown
  
  'D7140': 20, // Extraction, erupted tooth or exposed root
  'D7210': 45, // Surgical extraction requiring removal of bone and/or sectioning of tooth
  'D7220': 45, // Removal of impacted tooth - soft tissue
  'D7230': 60, // Removal of impacted tooth - partially bony
  'D7240': 75, // Removal of impacted tooth - completely bony
  
  'D9110': 30, // Palliative (emergency) treatment
  'D9215': 5,  // Local anesthesia
  'D9230': 5,  // Inhalation of nitrous oxide / anxiolysis, analgesia
  'D9944': 60, // Occlusal guard - hard appliance, full arch
};

/**
 * Get estimated time for a procedure
 */
function getEstimatedProcedureTime(cdtCode: string): number {
  // Check if we have a specific time estimate for this code
  if (procedureTimeEstimates[cdtCode]) {
    return procedureTimeEstimates[cdtCode];
  }
  
  // If not, find the category range
  const codeNum = parseInt(cdtCode.substring(1));
  for (const range in procedureTimeEstimates) {
    if (range.includes('-')) {
      const [start, end] = range.split('-');
      const startNum = parseInt(start.substring(1));
      const endNum = parseInt(end.substring(1));
      
      if (codeNum >= startNum && codeNum <= endNum) {
        return procedureTimeEstimates[range];
      }
    }
  }
  
  // Default fallback
  return 45;
}

/**
 * Check if two procedures can be performed during the same visit
 */
function areProceduresCompatible(proc1: TreatmentProcedure, proc2: TreatmentProcedure): boolean {
  // Check if they involve the same tooth
  const tooth1 = extractToothNumber(proc1.name);
  const tooth2 = extractToothNumber(proc2.name);
  
  // If both procedures involve the same tooth, they might be incompatible
  if (tooth1 && tooth2 && tooth1 === tooth2) {
    // Special cases where procedures on the same tooth shouldn't be done in the same visit
    
    // Don't do a filling and a crown on the same tooth in one visit
    if (
      (proc1.cdtCode.startsWith('D2') && !proc1.cdtCode.startsWith('D27') && proc2.cdtCode.startsWith('D27')) ||
      (proc2.cdtCode.startsWith('D2') && !proc2.cdtCode.startsWith('D27') && proc1.cdtCode.startsWith('D27'))
    ) {
      return false;
    }
    
    // Don't do root canal and crown on the same tooth in one visit (usually)
    if (
      (proc1.cdtCode.startsWith('D33') && proc2.cdtCode.startsWith('D27')) ||
      (proc2.cdtCode.startsWith('D33') && proc1.cdtCode.startsWith('D27'))
    ) {
      return false;
    }
  }
  
  // Check for domain compatibility
  const incompatibleDomains: [AIDomain, AIDomain][] = [
    ['endo', 'surgery'],  // Endodontics and surgery typically don't mix well
    ['endo', 'prostho'],  // Root canals and crown/bridge work usually separate
    ['prostho', 'surgery'] // Prosthodontics and surgery typically separate
  ];
  
  for (const [domain1, domain2] of incompatibleDomains) {
    if (
      (proc1.domain === domain1 && proc2.domain === domain2) ||
      (proc1.domain === domain2 && proc2.domain === domain1)
    ) {
      return false;
    }
  }
  
  // By default, assume they're compatible
  return true;
}

/**
 * Extract tooth number from procedure name
 */
function extractToothNumber(procedureName: string): string | null {
  // Look for patterns like "#30", "tooth #30", etc.
  const match = procedureName.match(/(?:tooth\s*)?#(\d+)/i);
  return match ? match[1] : null;
}

/**
 * Check dependencies between procedures
 */
function checkProcedureDependencies(proc1: TreatmentProcedure, proc2: TreatmentProcedure): {
  dependent: boolean;
  procBeforeId: string;
  procAfterId: string;
  minDays?: number;
  maxDays?: number;
  reason?: string;
} | null {
  const tooth1 = extractToothNumber(proc1.name);
  const tooth2 = extractToothNumber(proc2.name);
  
  // If procedures involve the same tooth, check for dependencies
  if (tooth1 && tooth2 && tooth1 === tooth2) {
    // Root Canal (D33xx) should be done before Crown (D27xx)
    if (proc1.cdtCode.startsWith('D33') && proc2.cdtCode.startsWith('D27')) {
      return {
        dependent: true,
        procBeforeId: proc1.id,
        procAfterId: proc2.id,
        minDays: 7,
        maxDays: 30,
        reason: 'Root canal should be completed before crown preparation'
      };
    }
    
    if (proc2.cdtCode.startsWith('D33') && proc1.cdtCode.startsWith('D27')) {
      return {
        dependent: true,
        procBeforeId: proc2.id,
        procAfterId: proc1.id,
        minDays: 7,
        maxDays: 30,
        reason: 'Root canal should be completed before crown preparation'
      };
    }
    
    // Extraction (D7xxx) should be done before Implant (D6xxx)
    if (proc1.cdtCode.startsWith('D7') && proc2.cdtCode.startsWith('D60')) {
      return {
        dependent: true,
        procBeforeId: proc1.id,
        procAfterId: proc2.id,
        minDays: 60,
        maxDays: 180,
        reason: 'Extraction site needs to heal before implant placement'
      };
    }
    
    if (proc2.cdtCode.startsWith('D7') && proc1.cdtCode.startsWith('D60')) {
      return {
        dependent: true,
        procBeforeId: proc2.id,
        procAfterId: proc1.id,
        minDays: 60,
        maxDays: 180,
        reason: 'Extraction site needs to heal before implant placement'
      };
    }
    
    // Implant placement (D6010) should be done before Implant crown (D6058)
    if (proc1.cdtCode === 'D6010' && proc2.cdtCode.startsWith('D605')) {
      return {
        dependent: true,
        procBeforeId: proc1.id,
        procAfterId: proc2.id,
        minDays: 90,
        maxDays: 180,
        reason: 'Implant needs to osseointegrate before restoration'
      };
    }
    
    if (proc2.cdtCode === 'D6010' && proc1.cdtCode.startsWith('D605')) {
      return {
        dependent: true,
        procBeforeId: proc2.id,
        procAfterId: proc1.id,
        minDays: 90,
        maxDays: 180,
        reason: 'Implant needs to osseointegrate before restoration'
      };
    }
  }
  
  // Scaling and Root Planing (D434x) should be done before restorative work
  if (proc1.cdtCode.startsWith('D434') && (proc2.cdtCode.startsWith('D2') || proc2.cdtCode.startsWith('D6'))) {
    return {
      dependent: true,
      procBeforeId: proc1.id,
      procAfterId: proc2.id,
      minDays: 14,
      maxDays: 30,
      reason: 'Periodontal therapy should be performed before restorative work'
    };
  }
  
  if (proc2.cdtCode.startsWith('D434') && (proc1.cdtCode.startsWith('D2') || proc1.cdtCode.startsWith('D6'))) {
    return {
      dependent: true,
      procBeforeId: proc2.id,
      procAfterId: proc1.id,
      minDays: 14,
      maxDays: 30,
      reason: 'Periodontal therapy should be performed before restorative work'
    };
  }
  
  // No dependencies found
  return null;
}

/**
 * Optimize a treatment plan into efficient appointments
 */
export function optimizeTreatmentSchedule(
  treatmentPlan: TreatmentPlan,
  constraints: SchedulingConstraints = {
    maxAppointmentLength: 120, // 2 hours
    providerAvailability: [],
    minTimeBetweenVisits: 7 // 1 week
  }
): OptimizedAppointment[] {
  // Sort procedures by priority and sequence
  const sortedProcedures = [...treatmentPlan.procedures].sort((a, b) => {
    // First by priority
    const priorityValues = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };
    const priorityDiff = 
      priorityValues[a.priority as keyof typeof priorityValues] - 
      priorityValues[b.priority as keyof typeof priorityValues];
    
    if (priorityDiff !== 0) return -priorityDiff; // Higher priority first
    
    // Then by sequence
    return a.sequence - b.sequence;
  });
  
  // Find procedure dependencies
  const dependencies: Record<string, {
    dependsOn: string;
    minDays?: number;
    maxDays?: number;
    reason?: string;
  }> = {};
  
  for (let i = 0; i < sortedProcedures.length; i++) {
    for (let j = i + 1; j < sortedProcedures.length; j++) {
      const dependency = checkProcedureDependencies(
        sortedProcedures[i],
        sortedProcedures[j]
      );
      
      if (dependency) {
        dependencies[dependency.procAfterId] = {
          dependsOn: dependency.procBeforeId,
          minDays: dependency.minDays,
          maxDays: dependency.maxDays,
          reason: dependency.reason
        };
      }
    }
  }
  
  // Group procedures into appointments
  const appointments: OptimizedAppointment[] = [];
  let currentAppointment: OptimizedAppointment = {
    visitNumber: 1,
    procedures: [],
    estimatedDuration: 0,
    notes: [],
    priority: 'medium',
    readyToSchedule: true
  };
  
  // Get preferred provider for each domain
  const domainProviders: Record<AIDomain, { id: number; name: string }> = {};
  constraints.providerAvailability?.forEach(provider => {
    provider.specialties.forEach(specialty => {
      if (!domainProviders[specialty] || Math.random() > 0.5) { // Just for variety in demo
        domainProviders[specialty] = {
          id: provider.providerId,
          name: provider.name
        };
      }
    });
  });
  
  let proceedToNextAppointment = false;
  
  // Process each procedure
  for (const procedure of sortedProcedures) {
    // Check if this procedure depends on another
    if (dependencies[procedure.id]) {
      const dep = dependencies[procedure.id];
      // Find which visit contains the dependency
      const dependencyVisit = appointments.find(appt => 
        appt.procedures.some(p => p.id === dep.dependsOn)
      );
      
      if (dependencyVisit) {
        // This procedure needs to be in a later visit
        proceedToNextAppointment = true;
        
        // If we've started an appointment, finalize it
        if (currentAppointment.procedures.length > 0) {
          finializeAppointment(currentAppointment);
          appointments.push(currentAppointment);
          
          // Start a new appointment
          currentAppointment = {
            visitNumber: appointments.length + 1,
            procedures: [],
            estimatedDuration: 0,
            notes: [],
            priority: 'medium',
            readyToSchedule: true,
            dependsOnVisit: dependencyVisit.visitNumber,
            idealTimingAfterPrevious: dep.minDays ? {
              min: dep.minDays,
              max: dep.maxDays || dep.minDays * 2,
              reason: dep.reason || 'Dependent procedure'
            } : undefined
          };
        }
      }
    }
    
    // Calculate time for this procedure
    const procedureTime = getEstimatedProcedureTime(procedure.cdtCode);
    
    // Check if this procedure would exceed max appointment length
    if (currentAppointment.estimatedDuration + procedureTime > constraints.maxAppointmentLength ||
        proceedToNextAppointment) {
      // If we've already added procedures, finalize the current appointment
      if (currentAppointment.procedures.length > 0) {
        finializeAppointment(currentAppointment);
        appointments.push(currentAppointment);
        
        // Reset for next appointment
        currentAppointment = {
          visitNumber: appointments.length + 1,
          procedures: [],
          estimatedDuration: 0,
          notes: [],
          priority: 'medium',
          readyToSchedule: true
        };
        
        proceedToNextAppointment = false;
      }
    }
    
    // Check compatibility with existing procedures in this appointment
    const isCompatible = currentAppointment.procedures.every(existingProc => 
      areProceduresCompatible(existingProc, procedure)
    );
    
    if (!isCompatible) {
      // If we've already added procedures, finalize the current appointment
      if (currentAppointment.procedures.length > 0) {
        finializeAppointment(currentAppointment);
        appointments.push(currentAppointment);
        
        // Reset for next appointment
        currentAppointment = {
          visitNumber: appointments.length + 1,
          procedures: [],
          estimatedDuration: 0,
          notes: [],
          priority: 'medium',
          readyToSchedule: true
        };
      }
    }
    
    // Add procedure to current appointment
    currentAppointment.procedures.push(procedure);
    currentAppointment.estimatedDuration += procedureTime;
    
    // If this is a high-priority or urgent procedure, elevate the appointment priority
    if (procedure.priority === 'urgent' || procedure.priority === 'high') {
      currentAppointment.priority = procedure.priority;
    }
    
    // Set preferred provider based on domain
    if (domainProviders[procedure.domain] && !currentAppointment.preferredProvider) {
      currentAppointment.preferredProvider = domainProviders[procedure.domain];
    }
  }
  
  // Add the last appointment if it has procedures
  if (currentAppointment.procedures.length > 0) {
    finializeAppointment(currentAppointment);
    appointments.push(currentAppointment);
  }
  
  // Post-processing to refine the schedule
  appointments.forEach((appointment, index) => {
    // Add notes about prep/seat appointments if relevant
    const hasCrownPrep = appointment.procedures.some(p => 
      p.cdtCode.startsWith('D27') && !p.name.toLowerCase().includes('seat')
    );
    
    if (hasCrownPrep) {
      appointment.notes.push('Crown prep appointment - schedule cementation 2-3 weeks later');
      
      // If this is not the last appointment, add a note to the next appointment
      if (index < appointments.length - 1) {
        const nextAppointment = appointments[index + 1];
        nextAppointment.notes.push('Consider scheduling as crown cementation appointment');
      }
    }
    
    // Adjust timing based on procedure types
    const hasImplantPlacement = appointment.procedures.some(p => p.cdtCode === 'D6010');
    if (hasImplantPlacement) {
      appointment.notes.push('Schedule follow-up in 1-2 weeks to check healing');
    }
    
    const hasSRP = appointment.procedures.some(p => p.cdtCode.startsWith('D434'));
    if (hasSRP) {
      appointment.notes.push('Schedule periodontal re-evaluation in 4-6 weeks');
    }
  });
  
  return appointments;
}

/**
 * Helper function to finalize appointment details
 */
function finializeAppointment(appointment: OptimizedAppointment): void {
  // Add anesthesia time
  appointment.estimatedDuration += 15;
  
  // Round up to nearest 15 minutes
  appointment.estimatedDuration = Math.ceil(appointment.estimatedDuration / 15) * 15;
  
  // Add notes based on procedures
  const domains = new Set(appointment.procedures.map(p => p.domain));
  
  if (domains.size > 1) {
    appointment.notes.push(`Combined visit for ${Array.from(domains).join(' and ')} procedures`);
  }
  
  // Add a note about the duration
  const hours = Math.floor(appointment.estimatedDuration / 60);
  const minutes = appointment.estimatedDuration % 60;
  
  const durationText = hours > 0 
    ? `${hours} hour${hours > 1 ? 's' : ''}${minutes > 0 ? ` ${minutes} minutes` : ''}` 
    : `${minutes} minutes`;
    
  appointment.notes.push(`Estimated appointment duration: ${durationText}`);
}

/**
 * Calculate scheduling efficiency improvements
 */
export function calculateSchedulingEfficiency(
  originalPlan: TreatmentPlan,
  optimizedAppointments: OptimizedAppointment[]
): {
  originalVisits: number;
  optimizedVisits: number;
  visitReduction: number;
  visitReductionPercentage: number;
  originalChairTime: number;
  optimizedChairTime: number;
  timeReduction: number;
  timeReductionPercentage: number;
  efficiencyGains: string[];
} {
  // In the original plan, each unique visit number is a separate appointment
  const uniqueOriginalVisits = new Set(originalPlan.procedures.map(p => p.visit));
  const originalVisits = uniqueOriginalVisits.size;
  
  // Count optimized visits
  const optimizedVisits = optimizedAppointments.length;
  
  // Calculate visit reduction
  const visitReduction = originalVisits - optimizedVisits;
  const visitReductionPercentage = (visitReduction / originalVisits) * 100;
  
  // Calculate original chair time (estimated)
  let originalChairTime = 0;
  uniqueOriginalVisits.forEach(visitNum => {
    const visitProcedures = originalPlan.procedures.filter(p => p.visit === visitNum);
    let visitTime = 0;
    visitProcedures.forEach(proc => {
      visitTime += getEstimatedProcedureTime(proc.cdtCode);
    });
    // Add anesthesia time and round up to nearest 15 minutes
    visitTime += 15;
    visitTime = Math.ceil(visitTime / 15) * 15;
    originalChairTime += visitTime;
  });
  
  // Calculate optimized chair time
  const optimizedChairTime = optimizedAppointments.reduce(
    (total, appt) => total + appt.estimatedDuration, 0
  );
  
  // Calculate time reduction
  const timeReduction = originalChairTime - optimizedChairTime;
  const timeReductionPercentage = (timeReduction / originalChairTime) * 100;
  
  // Identify specific efficiency gains
  const efficiencyGains: string[] = [];
  
  if (visitReduction > 0) {
    efficiencyGains.push(`Reduced total visits by ${visitReduction} appointment${visitReduction !== 1 ? 's' : ''}`);
  }
  
  if (timeReduction > 0) {
    const hours = Math.floor(timeReduction / 60);
    const minutes = timeReduction % 60;
    const timeText = hours > 0 
      ? `${hours} hour${hours > 1 ? 's' : ''}${minutes > 0 ? ` ${minutes} minutes` : ''}` 
      : `${minutes} minutes`;
      
    efficiencyGains.push(`Saved approximately ${timeText} of chair time`);
  }
  
  // Check for specific procedural efficiencies
  const combinedRestorative = optimizedAppointments.some(appt => {
    const procedures = appt.procedures;
    return procedures.filter(p => p.cdtCode.startsWith('D2')).length > 1;
  });
  
  if (combinedRestorative) {
    efficiencyGains.push('Combined multiple restorative procedures into single visits');
  }
  
  const combinedSRPAndRestorative = optimizedAppointments.some(appt => {
    const procedures = appt.procedures;
    return procedures.some(p => p.cdtCode.startsWith('D434')) && 
           procedures.some(p => p.cdtCode.startsWith('D2'));
  });
  
  if (combinedSRPAndRestorative) {
    efficiencyGains.push('Combined SRP and restorative work where appropriate');
  }
  
  return {
    originalVisits,
    optimizedVisits,
    visitReduction,
    visitReductionPercentage,
    originalChairTime,
    optimizedChairTime,
    timeReduction,
    timeReductionPercentage,
    efficiencyGains
  };
}