import * as THREE from 'three';

export interface Implant {
  position: [number, number, number];
  rotation: [number, number, number];
  diameter: number;
  length: number;
  system: string;
  sleeveHeight: number;
}

export interface NerveTrace {
  points: THREE.Vector3[];
  diameter: number;
  confidence: number;
}

export interface SurgicalGuideSettings {
  shellThickness: number;
  offset: number;
  sleeveDiameter: number;
  drillClearance: number;
  ventilationHoles: boolean;
  holeSpacing: number;
  holeDiameter: number;
}

export interface GuideAnalysis {
  recommendedSystem: string;
  boneType: 'D1' | 'D2' | 'D3' | 'D4';
  confidence: number;
  guideType: 'tooth' | 'mucosa' | 'bone';
  reasoning: string[];
  warnings: string[];
  suggestions: string[];
}

export interface GuideValidation {
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
  collisionPoints: THREE.Vector3[];
  safeDistance: number;
}

export interface NerveHeatmap {
  heatmap: Float32Array;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
} 