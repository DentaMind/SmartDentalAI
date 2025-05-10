import * as THREE from 'three';

export interface DentureSettings {
  system: 'full_plate' | 'horseshoe' | 'partial';
  palateShape: 'u_shaped' | 'v_shaped' | 'flat';
  borderExtension: number; // mm
  posteriorOcclusion: 'balanced' | 'lingualized' | 'monoplane';
  toothSetup: 'ai_recommended' | 'standard' | 'custom';
  material: 'acrylic' | 'flexible' | 'metal_base';
  shade: string;
  customSettings?: {
    toothSelection?: {
      anterior?: string[];
      posterior?: string[];
    };
    archConfiguration?: {
      type: 'conventional' | 'immediate' | 'overdenture';
      attachments?: string[];
    };
  };
}

export interface DentureAnalysis {
  recommendedSystem: DentureSettings['system'];
  recommendedMaterial: DentureSettings['material'];
  ridgeHeight: number; // mm
  ridgeWidth: number; // mm
  undercutAreas: {
    location: string;
    severity: 'mild' | 'moderate' | 'severe';
  }[];
  warnings: string[];
  suggestions: string[];
}

export interface DentureValidation {
  retentionScore: number; // 0-1
  occlusalClearance: number; // mm
  tissueAdaptation: number; // 0-1
  warnings: string[];
  suggestions: string[];
}

export interface DentureDesign {
  base: THREE.BufferGeometry;
  teeth: {
    position: [number, number, number];
    rotation: [number, number, number];
    toothId: string;
  }[];
  attachments?: {
    type: string;
    position: [number, number, number];
    rotation: [number, number, number];
  }[];
}

export interface DentureCase {
  id: string;
  patientId: string;
  upperScan: THREE.BufferGeometry;
  lowerScan: THREE.BufferGeometry;
  settings: DentureSettings;
  analysis: DentureAnalysis | null;
  design: DentureDesign | null;
  validation: DentureValidation | null;
  createdAt: Date;
  updatedAt: Date;
} 