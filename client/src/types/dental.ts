/**
 * Dental charting type definitions
 */

// Perio chart specific types
export type ProbingSite = 'MB' | 'B' | 'DB' | 'DL' | 'L' | 'ML';
export type FurcationSite = 'Mesial' | 'Distal' | 'Buccal' | 'Lingual';

// Restorative chart specific types
export type ToothSurface = 'M' | 'O' | 'D' | 'F' | 'L' | 'I' | 'B';
export type RestorationMaterial = 
  'Amalgam' | 
  'Composite' | 
  'Gold' | 
  'PFM' | 
  'Ceramic' | 
  'Temporary' | 
  'Implant' |
  'Veneer' |
  'Zirconia' | 
  'Onlay' |
  'Root Canal';

export type ToothStatus = 
  'Normal' | 
  'Missing' | 
  'Impacted' | 
  'Extracted' | 
  'Implant' | 
  'Primary' | 
  'Erupting';

// Core data structures
export interface ProbingData {
  depth: number | null;
  recession: number | null;
  bleeding: boolean;
  suppuration: boolean;
  // Calculated from depth + recession
  cal?: number | null;
}

export interface FurcationData {
  grade: 0 | 1 | 2 | 3;
  site: FurcationSite;
}

export interface MobilityData {
  degree: 0 | 1 | 2 | 3;
}

export interface RestorationData {
  surfaces: ToothSurface[];
  material: RestorationMaterial;
  date?: string;
  notes?: string;
}

export interface ToothData {
  number: number;
  status: ToothStatus;
  // Perio data
  probing: Record<ProbingSite, ProbingData>;
  mobility?: MobilityData;
  furcations?: FurcationData[];
  // Restorative data
  restorations?: RestorationData[];
  notes?: string;
}

// Complete patient chart
export type DentalChart = Record<number, ToothData>;

// Chart mode for switching between different chart views
export type ChartMode = 'perio' | 'restorative' | 'comprehensive';

// Events
export interface ToothClickEvent {
  toothNumber: number;
  site?: ProbingSite | ToothSurface;
  action?: string;
}

// Voice command types
export interface VoiceCommand {
  tooth?: number;
  site?: ProbingSite | ToothSurface;
  value?: number | string;
  action?: string;
}

// Chart positions for reference
export const UPPER_RIGHT_TEETH = [1, 2, 3, 4, 5, 6, 7, 8];
export const UPPER_LEFT_TEETH = [9, 10, 11, 12, 13, 14, 15, 16];
export const LOWER_LEFT_TEETH = [17, 18, 19, 20, 21, 22, 23, 24];
export const LOWER_RIGHT_TEETH = [25, 26, 27, 28, 29, 30, 31, 32];
export const ALL_TEETH = [...UPPER_RIGHT_TEETH, ...UPPER_LEFT_TEETH, ...LOWER_LEFT_TEETH, ...LOWER_RIGHT_TEETH];

// Helper functions
export function calculateCAL(probingDepth: number | null, recession: number | null): number | null {
  if (probingDepth === null || recession === null) return null;
  return probingDepth + recession;
}

export function initializeEmptyToothData(toothNumber: number): ToothData {
  const emptyProbingData: ProbingData = {
    depth: null,
    recession: null,
    bleeding: false,
    suppuration: false,
    cal: null
  };
  
  return {
    number: toothNumber,
    status: 'Normal',
    probing: {
      'MB': {...emptyProbingData},
      'B': {...emptyProbingData},
      'DB': {...emptyProbingData},
      'DL': {...emptyProbingData},
      'L': {...emptyProbingData},
      'ML': {...emptyProbingData}
    },
    mobility: { degree: 0 },
    furcations: [],
    restorations: []
  };
}

export function initializeEmptyChart(): DentalChart {
  const chart: DentalChart = {};
  
  ALL_TEETH.forEach(toothNumber => {
    chart[toothNumber] = initializeEmptyToothData(toothNumber);
  });
  
  return chart;
} 