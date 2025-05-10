import { apiRequest } from "@/lib/queryClient";

export interface TreatmentNoteInput {
  procedure: string;
  teeth: string[];
  materials?: string[];
  isolation?: string;
  anesthesia?: string;
  additionalDetails?: string;
  patientResponse?: string;
}

/**
 * Generates a detailed treatment note based on the procedure information
 */
export async function generateTreatmentNote(input: TreatmentNoteInput): Promise<string> {
  try {
    const response = await apiRequest(`/api/ai/generate-treatment-note`, {
      method: 'POST',
      body: JSON.stringify(input),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return response.note;
  } catch (error) {
    console.error('Error generating treatment note:', error);
    // Fallback to a template note format if the AI service fails
    return formatFallbackNote(input);
  }
}

/**
 * Creates a structured note based on input data in case the AI service is unavailable
 */
function formatFallbackNote(input: TreatmentNoteInput): string {
  const { procedure, teeth, materials, isolation, anesthesia, additionalDetails, patientResponse } = input;
  
  const date = new Date().toLocaleDateString();
  const teethList = teeth.join(', ');
  const materialsList = materials ? materials.join(', ') : 'standard materials';
  
  return `${date}: ${procedure} performed on tooth/teeth ${teethList}.
${isolation ? `Isolation: ${isolation}.` : ''}
${anesthesia ? `Anesthesia: ${anesthesia}.` : ''}
Materials used: ${materialsList}.
${additionalDetails ? `Additional details: ${additionalDetails}` : ''}
${patientResponse ? `Patient response: ${patientResponse}` : ''}
`;
}

export const commonProcedures = [
  "Composite Restoration",
  "Amalgam Restoration",
  "Root Canal Therapy",
  "Crown Preparation",
  "Crown Cementation",
  "Scaling and Root Planing",
  "Extraction",
  "Implant Placement",
  "Bridge Preparation",
  "Bridge Cementation",
  "Periodontal Maintenance",
  "Prophylaxis",
  "Sealant Application",
  "Pulpotomy",
  "Fluoride Application"
];

export const isolationMethods = [
  "Rubber Dam",
  "Cotton Rolls",
  "Isolite System",
  "Dri-Angles",
  "Parotid Shields",
  "None (not required)"
];

export const anesthesiaTypes = [
  "2% Lidocaine with 1:100,000 epinephrine",
  "4% Articaine with 1:100,000 epinephrine",
  "4% Articaine with 1:200,000 epinephrine",
  "3% Mepivacaine plain",
  "2% Mepivacaine with levonordefrin",
  "0.5% Marcaine with 1:200,000 epinephrine",
  "No anesthesia required"
];

export const commonMaterials = {
  "Composite Restoration": ["A1", "A2", "A3", "A3.5", "A4", "B1", "B2", "B3", "B4", "C1", "C2", "C3", "C4", "D2", "D3", "D4", "Bleach White"],
  "Amalgam Restoration": ["High Copper Admix", "Dispersed Phase", "Spherical"],
  "Root Canal Therapy": ["Gutta Percha", "Resilon", "AH Plus Sealer", "Kerr Pulp Canal Sealer", "EndoREZ", "Activ GP"],
  "Crown": ["Zirconia", "Lithium Disilicate", "PFM", "Full Gold", "Composite", "PMMA (Temporary)"],
  "Implant": ["Titanium", "Titanium-Zirconium Alloy"],
  "Cement": ["Resin Cement", "Glass Ionomer", "RMGI", "Zinc Phosphate", "Zinc Oxide Eugenol", "Polycarboxylate"],
  "Endodontic": ["ProTaper", "WaveOne", "Reciproc", "TF Adaptive", "EdgeFile", "K-Files", "H-Files"],
  "Surgical": ["Resorbable Sutures", "Non-resorbable Sutures", "PRF", "Bone Graft Material", "Collagen Membrane"]
};