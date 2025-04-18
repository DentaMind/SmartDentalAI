import { 
  CrownBridgeAnalysis, 
  CrownBridgeValidation, 
  CrownBridgeSettings,
  Tooth
} from '../../server/types/crown-bridge';
import * as THREE from 'three';

// Convert THREE.BufferGeometry to JSON format
const geometryToJson = (geometry: THREE.BufferGeometry) => {
  const position = geometry.getAttribute('position');
  const indices = geometry.getIndex();
  return {
    vertices: Array.from(position.array),
    indices: indices ? Array.from(indices.array) : []
  };
};

// Convert JSON format to THREE.BufferGeometry
const jsonToGeometry = (json: any): THREE.BufferGeometry => {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(json.vertices, 3));
  geometry.setIndex(json.indices);
  return geometry;
};

export const analyzeCrownBridge = async (
  preparationScan: THREE.BufferGeometry,
  opposingScan: THREE.BufferGeometry,
  adjacentTeeth: Tooth[],
  token: string
): Promise<CrownBridgeAnalysis> => {
  const res = await fetch('/api/crown-bridge/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      preparationScan: geometryToJson(preparationScan),
      opposingScan: geometryToJson(opposingScan),
      adjacentTeeth
    })
  });

  if (!res.ok) throw new Error('Failed to analyze crown & bridge case');
  return res.json();
};

export const generateCrownBridge = async (
  settings: CrownBridgeSettings,
  token: string
): Promise<Blob> => {
  const res = await fetch('/api/crown-bridge/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(settings)
  });

  if (!res.ok) throw new Error('Failed to generate crown & bridge design');
  return res.blob();
};

export const validateCrownBridge = async (
  preparationScan: THREE.BufferGeometry,
  settings: CrownBridgeSettings,
  token: string
): Promise<CrownBridgeValidation> => {
  const res = await fetch('/api/crown-bridge/validate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      preparationScan: geometryToJson(preparationScan),
      settings
    })
  });

  if (!res.ok) throw new Error('Crown & bridge validation failed');
  return res.json();
};

export const exportCrownBridgePDF = async (
  preparationScan: THREE.BufferGeometry,
  settings: CrownBridgeSettings,
  token: string
): Promise<Blob> => {
  const res = await fetch('/api/crown-bridge/export-pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      preparationScan: geometryToJson(preparationScan),
      settings
    })
  });

  if (!res.ok) throw new Error('Failed to export PDF');
  return res.blob();
}; 