import { 
  DentureAnalysis, 
  DentureValidation, 
  DentureSettings,
  Tooth,
  ArchType
} from '../../server/types/denture';
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

export const analyzeDenture = async (
  archType: ArchType,
  remainingTeeth: Tooth[],
  occlusionMap: number[][],
  archScan: THREE.BufferGeometry,
  token: string
): Promise<DentureAnalysis> => {
  const res = await fetch('/api/denture/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      archType,
      remainingTeeth,
      occlusionMap,
      archScan: geometryToJson(archScan)
    })
  });

  if (!res.ok) throw new Error('Failed to analyze denture case');
  return res.json();
};

export const generateDenture = async (
  settings: DentureSettings,
  token: string
): Promise<Blob> => {
  const res = await fetch('/api/denture/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(settings)
  });

  if (!res.ok) throw new Error('Failed to generate denture');
  return res.blob();
};

export const validateDenture = async (
  dentureGeometry: THREE.BufferGeometry,
  settings: DentureSettings,
  token: string
): Promise<DentureValidation> => {
  const res = await fetch('/api/denture/validate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      dentureGeometry: geometryToJson(dentureGeometry),
      settings
    })
  });

  if (!res.ok) throw new Error('Denture validation failed');
  return res.json();
};

export const exportDenturePDF = async (
  dentureGeometry: THREE.BufferGeometry,
  settings: DentureSettings,
  token: string
): Promise<Blob> => {
  const res = await fetch('/api/denture/export-pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      dentureGeometry: geometryToJson(dentureGeometry),
      settings
    })
  });

  if (!res.ok) throw new Error('Failed to export PDF');
  return res.blob();
}; 