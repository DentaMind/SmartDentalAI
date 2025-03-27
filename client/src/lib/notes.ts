import { ToothPerioData } from '@/components/perio/PeriodontalInput';

/**
 * Creates a formatted note for restorative treatment
 * @param toothNumber The tooth number in standard notation
 * @param restoration The restoration type
 * @returns Formatted note string
 */
export const createRestorativeNote = (toothNumber: number, restoration: string): string => {
  if (!restoration) return '';
  
  return `Restorative: Tooth #${toothNumber} - ${restoration}`;
};

/**
 * Creates a formatted perio note from a tooth's periodontal data
 * @param toothNumber The tooth number
 * @param data The periodontal data for the tooth
 * @returns Formatted note string
 */
export const createPerioNote = (toothNumber: number, data: ToothPerioData): string => {
  const notes: string[] = [];
  
  // Add pocket depth notes (only for depths > 3mm)
  const significantFacialDepths = data.pocketDepths.facial.filter(d => d > 3);
  const significantLingualDepths = data.pocketDepths.lingual.filter(d => d > 3);
  
  if (significantFacialDepths.length > 0) {
    notes.push(`Facial pocket depths: ${data.pocketDepths.facial.join(' ')}mm`);
  }
  
  if (significantLingualDepths.length > 0) {
    notes.push(`Lingual pocket depths: ${data.pocketDepths.lingual.join(' ')}mm`);
  }
  
  // Add bleeding notes
  const facialBleeding = data.bleeding.facial.filter(Boolean).length;
  const lingualBleeding = data.bleeding.lingual.filter(Boolean).length;
  
  if (facialBleeding > 0 || lingualBleeding > 0) {
    notes.push(`Bleeding on probing at ${facialBleeding + lingualBleeding} sites`);
  }
  
  // Add mobility notes
  if (data.mobility > 0) {
    notes.push(`Mobility grade ${data.mobility}`);
  }
  
  // Add furcation notes if applicable
  const hasFurcation = data.furcation.some(grade => grade > 0);
  if (hasFurcation) {
    const locations = ['mesio-facial', 'disto-facial', 'mesio-lingual', 'disto-lingual'];
    const furcationNotes = data.furcation
      .map((grade, index) => grade > 0 ? `${locations[index]} (grade ${grade})` : null)
      .filter(Boolean);
    
    if (furcationNotes.length > 0) {
      notes.push(`Furcation involvement: ${furcationNotes.join(', ')}`);
    }
  }
  
  // Add recession notes
  const hasRecession = data.recession.facial.some(r => r > 0) || 
    data.recession.lingual.some(r => r > 0);
    
  if (hasRecession) {
    if (data.recession.facial.some(r => r > 0)) {
      notes.push(`Facial recession: ${data.recession.facial.join(' ')}mm`);
    }
    
    if (data.recession.lingual.some(r => r > 0)) {
      notes.push(`Lingual recession: ${data.recession.lingual.join(' ')}mm`);
    }
  }
  
  // Compile the final note
  if (notes.length === 0) return '';
  
  return `Perio: Tooth #${toothNumber} - ${notes.join('; ')}`;
};

/**
 * Creates a medical alert note for significant periodontal findings
 * @param periosData Complete periodontal data for all teeth
 * @returns Alert note for significant findings
 */
export const createPerioAlertNote = (periosData: Record<number, ToothPerioData>): string => {
  const alerts: string[] = [];
  
  // Calculate BOP percentage
  let totalSites = 0;
  let bleedingSites = 0;
  
  Object.values(periosData).forEach(toothData => {
    totalSites += 6;
    
    toothData.bleeding.facial.forEach(site => {
      if (site) bleedingSites++;
    });
    
    toothData.bleeding.lingual.forEach(site => {
      if (site) bleedingSites++;
    });
  });
  
  const bopPercentage = Math.round((bleedingSites / totalSites) * 100);
  
  // Check for severe pocket depths (≥ 5mm)
  let teethWithSeverePD: number[] = [];
  
  Object.entries(periosData).forEach(([toothNumber, data]) => {
    const hasSeverePD = data.pocketDepths.facial.some(d => d >= 5) || 
      data.pocketDepths.lingual.some(d => d >= 5);
      
    if (hasSeverePD) {
      teethWithSeverePD.push(parseInt(toothNumber));
    }
  });
  
  // Check for mobility ≥ 2
  let teethWithSevereMobility: number[] = [];
  
  Object.entries(periosData).forEach(([toothNumber, data]) => {
    if (data.mobility >= 2) {
      teethWithSevereMobility.push(parseInt(toothNumber));
    }
  });
  
  // Generate alerts
  if (bopPercentage >= 30) {
    alerts.push(`HIGH BOP: ${bopPercentage}% of sites show bleeding on probing`);
  }
  
  if (teethWithSeverePD.length > 0) {
    alerts.push(`SEVERE POCKET DEPTHS: Teeth #${teethWithSeverePD.join(', ')} have pocket depths ≥ 5mm`);
  }
  
  if (teethWithSevereMobility.length > 0) {
    alerts.push(`SIGNIFICANT MOBILITY: Teeth #${teethWithSevereMobility.join(', ')} have mobility ≥ grade 2`);
  }
  
  // Compile the final alert note
  if (alerts.length === 0) return '';
  
  return `PERIO ALERT: ${alerts.join('; ')}`;
};

/**
 * Format date for notes
 * @returns Formatted date string
 */
export const getFormattedDate = (): string => {
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};