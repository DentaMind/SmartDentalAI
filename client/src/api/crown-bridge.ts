import { 
  CrownBridgeAnalysis, 
  CrownBridgeValidation, 
  CrownBridgeSettings,
  Tooth,
  CrownBridgeCase
} from '../../server/types/crown-bridge';
import * as THREE from 'three';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api';

// Convert THREE.BufferGeometry to JSON format
const geometryToJson = (geometry: THREE.BufferGeometry): string => {
  return JSON.stringify(geometry.toJSON());
};

// Convert JSON format to THREE.BufferGeometry
const jsonToGeometry = (json: string): THREE.BufferGeometry => {
  const data = JSON.parse(json);
  return new THREE.BufferGeometry().fromJSON(data);
};

export const analyzeCrownBridge = async (
  scan: THREE.BufferGeometry,
  settings: CrownBridgeSettings
): Promise<CrownBridgeAnalysis> => {
  const response = await fetch(`${API_BASE_URL}/crown-bridge/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      scan: geometryToJson(scan),
      settings
    })
  });

  if (!response.ok) {
    throw new Error('Failed to analyze crown/bridge case');
  }

  return response.json();
};

export const generateCrownBridge = async (
  scan: THREE.BufferGeometry,
  settings: CrownBridgeSettings
): Promise<THREE.BufferGeometry> => {
  const response = await fetch(`${API_BASE_URL}/crown-bridge/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      scan: geometryToJson(scan),
      settings
    })
  });

  if (!response.ok) {
    throw new Error('Failed to generate crown/bridge design');
  }

  const data = await response.json();
  return jsonToGeometry(data.design);
};

export const validateCrownBridge = async (
  design: THREE.BufferGeometry,
  settings: CrownBridgeSettings
): Promise<CrownBridgeValidation> => {
  const response = await fetch(`${API_BASE_URL}/crown-bridge/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      design: geometryToJson(design),
      settings
    })
  });

  if (!response.ok) {
    throw new Error('Failed to validate crown/bridge design');
  }

  return response.json();
};

export const exportPDF = async (
  design: THREE.BufferGeometry,
  settings: CrownBridgeSettings
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/crown-bridge/export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      design: geometryToJson(design),
      settings
    })
  });

  if (!response.ok) {
    throw new Error('Failed to export crown/bridge design');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'crown-bridge-design.pdf';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

export const saveCase = async (
  patientId: string,
  preparationScan: THREE.BufferGeometry,
  settings: CrownBridgeSettings,
  design: THREE.BufferGeometry | null
): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/crown-bridge/save-case`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      patientId,
      preparationScan: geometryToJson(preparationScan),
      settings,
      design: design ? geometryToJson(design) : null
    })
  });

  if (!response.ok) {
    throw new Error('Failed to save case');
  }

  const data = await response.json();
  return data.caseId;
};

/**
 * Load a specific crown & bridge case by ID
 * @param caseId The ID of the case to load
 * @returns The case data including geometry, settings, and design
 */
export const getCase = async (caseId: string): Promise<CrownBridgeCase> => {
  const response = await fetch(`${API_BASE_URL}/crown-bridge/${caseId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to load case');
  }

  const caseData = await response.json();
  
  // Convert geometry data to Three.js objects
  if (caseData.preparationScan) {
    caseData.preparationScan = jsonToGeometry(caseData.preparationScan);
  }
  if (caseData.opposingScan) {
    caseData.opposingScan = jsonToGeometry(caseData.opposingScan);
  }
  if (caseData.design) {
    caseData.design = jsonToGeometry(caseData.design);
  }

  return caseData;
};

/**
 * Get all cases for a patient
 * @param patientId The ID of the patient
 * @returns Array of cases
 */
export const getCasesByPatient = async (patientId: string): Promise<CrownBridgeCase[]> => {
  const response = await fetch(`${API_BASE_URL}/crown-bridge/patient/${patientId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get patient cases');
  }

  const cases = await response.json();
  
  // Convert geometry data to Three.js objects
  return cases.map((caseData: any) => ({
    ...caseData,
    preparationScan: caseData.preparationScan ? jsonToGeometry(caseData.preparationScan) : null,
    opposingScan: caseData.opposingScan ? jsonToGeometry(caseData.opposingScan) : null,
    design: caseData.design ? jsonToGeometry(caseData.design) : null
  }));
};

/**
 * Update a case
 * @param caseId The ID of the case to update
 * @param caseData The updated case data
 * @returns The updated case
 */
export const updateCase = async (
  caseId: string,
  caseData: Partial<CrownBridgeCase>
): Promise<CrownBridgeCase> => {
  const response = await fetch(`${API_BASE_URL}/crown-bridge/${caseId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...caseData,
      preparationScan: caseData.preparationScan ? geometryToJson(caseData.preparationScan) : null,
      opposingScan: caseData.opposingScan ? geometryToJson(caseData.opposingScan) : null,
      design: caseData.design ? geometryToJson(caseData.design) : null
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update case');
  }

  const updatedCase = await response.json();
  
  // Convert geometry data to Three.js objects
  return {
    ...updatedCase,
    preparationScan: updatedCase.preparationScan ? jsonToGeometry(updatedCase.preparationScan) : null,
    opposingScan: updatedCase.opposingScan ? jsonToGeometry(updatedCase.opposingScan) : null,
    design: updatedCase.design ? jsonToGeometry(updatedCase.design) : null
  };
};

/**
 * Delete a case
 * @param caseId The ID of the case to delete
 */
export const deleteCase = async (caseId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/crown-bridge/${caseId}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete case');
  }
};

/**
 * Export cases as CSV
 * @param patientId The ID of the patient
 */
export const exportCasesToCSV = async (patientId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/crown-bridge/patient/${patientId}/export/csv`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to export cases');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `crown-bridge-cases-${patientId}.csv`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

/**
 * Export cases as PDF
 * @param patientId The ID of the patient
 */
export const exportCasesToPDF = async (patientId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/crown-bridge/patient/${patientId}/export/pdf`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to export cases');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `crown-bridge-cases-${patientId}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}; 