import * as THREE from 'three';

export type MaterialType = 'zirconia' | 'e-max' | 'pfm' | 'gold' | 'composite';
export type DesignType = 'full-coverage' | 'onlay' | 'inlay' | 'veneer' | 'bridge';
export type MarginType = 'chamfer' | 'shoulder' | 'feather' | 'bevel';
export type OcclusionType = 'centric' | 'eccentric' | 'balanced';

export interface Tooth {
  position: [number, number, number];
  rotation: [number, number, number];
  width: number;
  height: number;
  depth: number;
  type: string;
  number: number;
}

export interface CrownBridgeSettings {
  material: string;
  designType: string;
  marginType: string;
  occlusionType: string;
  minimumThickness: number;
  connectorSize: number;
  ponticDesign: string;
}

export interface CrownBridgeAnalysis {
  recommendedMaterial: string;
  recommendedDesign: string;
  marginLine: THREE.BufferGeometry;
  prepClearance: number;
  confidence: number;
  reasoning: string[];
  warnings: string[];
  suggestions: {
    id: string;
    label: string;
    recommended: boolean;
    settings: Partial<CrownBridgeSettings>;
  }[];
}

export interface CrownBridgeValidation {
  marginFit: number;
  occlusionClearance: number;
  connectorStrength: number;
  warnings: string[];
  suggestions: string[];
}

export interface CrownBridgeGeometry {
  preparation: THREE.BufferGeometry;
  design: THREE.BufferGeometry;
  marginLine: THREE.BufferGeometry;
  connectors?: THREE.BufferGeometry[];
} 