import { 
  Implant, 
  NerveTrace, 
  SurgicalGuideSettings, 
  GuideAnalysis, 
  GuideValidation, 
  NerveHeatmap 
} from '../../server/types/surgical-guide';
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

export const analyzeGuide = async (
  implants: Implant[],
  tissueSurface: THREE.BufferGeometry,
  nerveTraces: NerveTrace[],
  token: string
): Promise<GuideAnalysis> => {
  const res = await fetch('/api/surgical-guide/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      implants,
      tissueSurface: geometryToJson(tissueSurface),
      nerveTraces
    })
  });

  if (!res.ok) throw new Error('Failed to analyze guide');
  return res.json();
};

export const generateGuide = async (
  implants: Implant[],
  tissueSurface: THREE.BufferGeometry,
  settings: SurgicalGuideSettings,
  token: string
): Promise<Blob> => {
  const res = await fetch('/api/surgical-guide/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      implants,
      tissueSurface: geometryToJson(tissueSurface),
      settings
    })
  });

  if (!res.ok) throw new Error('Failed to generate STL');
  return res.blob();
};

export const validateGuide = async (
  guideGeometry: THREE.BufferGeometry,
  implants: Implant[],
  nerveTraces: NerveTrace[],
  token: string
): Promise<GuideValidation> => {
  const res = await fetch('/api/surgical-guide/validate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      guideGeometry: geometryToJson(guideGeometry),
      implants,
      nerveTraces
    })
  });

  if (!res.ok) throw new Error('Guide validation failed');
  return res.json();
};

export const generateNerveHeatmap = async (
  nerveTraces: NerveTrace[],
  dimensions: { width: number; height: number; depth: number },
  token: string
): Promise<NerveHeatmap> => {
  const res = await fetch('/api/surgical-guide/nerve-heatmap', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      nerveTraces,
      dimensions
    })
  });

  if (!res.ok) throw new Error('Failed to generate nerve heatmap');
  return res.json();
}; 