import { aiServiceManager } from './ai-service-manager';
import { aiRequestQueue } from './ai-request-queue';
import { AIServiceType } from './ai-service-types';
import { InsertPrescription, Prescription, PatientMedicalHistory } from '../../shared/schema';

/**
 * Input interface for prescription generation
 */
interface PrescriptionInput {
  patientId: number;
  patientName: string;
  patientAge?: number;
  patientWeight?: number;
  patientAllergies?: string[];
  conditions?: string[];
  medications?: string[];
  requestedMedication?: string;
  reason?: string;
  previousPrescriptions?: {
    drugName: string;
    lastPrescribed: string;
    wasEffective: boolean;
  }[];
  medicalHistory?: PatientMedicalHistory;
}

/**
 * Output from the AI prescription generation
 */
interface PrescriptionSuggestion {
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: string;
  refills: number;
  dispensedAs: string;
  instructions: string;
  reasonForPrescription: string;
  warnings: string[];
  interactions: string[];
  alternatives?: {
    drugName: string;
    reason: string;
  }[];
  confidence: number;
}

/**
 * Generates a prescription recommendation based on patient data
 * 
 * @param input Patient and prescription request data
 * @returns AI-generated prescription suggestion
 */
export async function generateAiPrescription(input: PrescriptionInput): Promise<PrescriptionSuggestion> {
  try {
    // Validate required inputs
    if (!input.patientId || !input.patientName || (!input.requestedMedication && !input.reason)) {
      throw new Error('Patient information and either medication or reason are required');
    }
    
    // Construct a prompt for the AI with all available details
    const prompt = constructPrescriptionPrompt(input);
    
    // Queue the request with the appropriate service type and priority
    const aiResponse = await aiRequestQueue.enqueueRequest(
      AIServiceType.TREATMENT_PLANNING,
      () => aiServiceManager.generateTreatmentNote(prompt),
      8 // Medium-high priority
    );
    
    // Parse the AI response to extract structured prescription data
    return parsePrescriptionResponse(aiResponse, input);
  } catch (error: any) {
    console.error('Error generating AI prescription:', error.message);
    // Return a basic fallback suggestion with warning
    return createFallbackSuggestion(input);
  }
}

/**
 * Generate a draft prescription object ready for database insertion
 */
export function createPrescriptionDraft(
  suggestion: PrescriptionSuggestion, 
  doctorId: number,
  patientId: number,
  promptText: string
): InsertPrescription {
  return {
    patientId,
    doctorId,
    drugName: suggestion.drugName,
    dosage: suggestion.dosage,
    frequency: suggestion.frequency,
    duration: suggestion.duration,
    quantity: suggestion.quantity,
    refills: suggestion.refills,
    dispensedAs: suggestion.dispensedAs,
    instructions: suggestion.instructions,
    status: 'active',
    reasonForPrescription: suggestion.reasonForPrescription,
    allergiesChecked: true,
    interactionsChecked: true,
    aiGenerationPrompt: promptText,
    aiGeneratedText: JSON.stringify(suggestion),
  };
}

/**
 * Check for potential adverse drug interactions and allergy conflicts
 * 
 * @param drugName Medication to check
 * @param patientData Patient medical data including allergies and current medications
 * @returns Analysis of potential issues
 */
export async function checkMedicationSafety(
  drugName: string,
  patientData: {
    allergies?: string[];
    currentMedications?: string[];
    medicalConditions?: string[];
  }
): Promise<{
  isSafe: boolean;
  allergies: { detected: boolean; allergens: string[] };
  interactions: { detected: boolean; medications: string[]; severity: 'low' | 'medium' | 'high' }[];
  contraindications: { detected: boolean; conditions: string[] };
}> {
  try {
    const prompt = `
    Perform a safety analysis for prescribing ${drugName} to a patient with the following profile:
    
    Allergies: ${patientData.allergies?.join(', ') || 'None reported'}
    Current medications: ${patientData.currentMedications?.join(', ') || 'None reported'}
    Medical conditions: ${patientData.medicalConditions?.join(', ') || 'None reported'}
    
    Analyze and return a structured assessment of:
    1. Potential allergic reactions
    2. Drug interactions with current medications
    3. Contraindications with existing medical conditions
    
    Format your response as a structured JSON object with the following properties:
    - isSafe (boolean)
    - allergies: {detected: boolean, allergens: string[]}
    - interactions: {detected: boolean, medications: string[], severity: "low"|"medium"|"high"}
    - contraindications: {detected: boolean, conditions: string[]}
    `;
    
    // Queue the request with appropriate priority
    const aiResponse = await aiRequestQueue.enqueueRequest(
      AIServiceType.TREATMENT_PLANNING,
      () => aiServiceManager.generateTreatmentNote(prompt),
      9 // High priority for safety checks
    );
    
    // Parse the JSON response
    try {
      const parsedResponse = JSON.parse(aiResponse);
      return {
        isSafe: parsedResponse.isSafe || false,
        allergies: parsedResponse.allergies || { detected: false, allergens: [] },
        interactions: parsedResponse.interactions || { detected: false, medications: [], severity: 'low' },
        contraindications: parsedResponse.contraindications || { detected: false, conditions: [] }
      };
    } catch (parseError) {
      console.error('Failed to parse AI safety check response:', parseError);
      // Return cautious default if parsing fails
      return {
        isSafe: false,
        allergies: { detected: false, allergens: ['Unknown - verification required'] },
        interactions: [{ detected: true, medications: ['Unknown - verification required'], severity: 'high' }],
        contraindications: { detected: false, conditions: [] }
      };
    }
  } catch (error) {
    console.error('Error checking medication safety:', error);
    // Return cautious default on error
    return {
      isSafe: false,
      allergies: { detected: false, allergens: [] },
      interactions: [{ detected: true, medications: ['Verification required - system error'], severity: 'high' }],
      contraindications: { detected: false, conditions: [] }
    };
  }
}

/**
 * Constructs a detailed prompt for the AI based on the patient data
 */
function constructPrescriptionPrompt(input: PrescriptionInput): string {
  const allergiesStr = input.patientAllergies && input.patientAllergies.length > 0 
    ? `Allergies: ${input.patientAllergies.join(', ')}` 
    : 'No known allergies';
    
  const medications = input.medications && input.medications.length > 0
    ? `Current medications: ${input.medications.join(', ')}`
    : 'No current medications reported';
    
  const conditions = input.conditions && input.conditions.length > 0
    ? `Medical conditions: ${input.conditions.join(', ')}`
    : 'No medical conditions reported';
    
  const medicalHistoryStr = input.medicalHistory
    ? `Additional medical history:
      - Systemic conditions: ${input.medicalHistory.systemicConditions?.join(', ') || 'None'}
      - Surgical history: ${input.medicalHistory.surgicalHistory?.join(', ') || 'None'}
      - Smoking: ${input.medicalHistory.smoking ? 'Yes' : 'No'}
      - Alcohol use: ${input.medicalHistory.alcohol ? 'Yes' : 'No'}
      - Pregnancy status: ${input.medicalHistory.pregnancyStatus || 'Not applicable'}`
    : '';
    
  const previousPrescriptionsStr = input.previousPrescriptions && input.previousPrescriptions.length > 0
    ? `Previous relevant prescriptions:
      ${input.previousPrescriptions.map(p => 
        `- ${p.drugName} (Last prescribed: ${p.lastPrescribed}, Effective: ${p.wasEffective ? 'Yes' : 'No'})`
      ).join('\n')}`
    : 'No relevant prescription history';
    
  // Determine if this is a specific medication request or a condition-based prescription
  const prescriptionTypeStr = input.requestedMedication
    ? `Requested medication: ${input.requestedMedication}`
    : `Condition requiring medication: ${input.reason}`;
    
  return `Generate a dental prescription recommendation for the following patient:

Patient name: ${input.patientName}
Patient ID: ${input.patientId}
${input.patientAge ? `Age: ${input.patientAge}` : ''}
${input.patientWeight ? `Weight: ${input.patientWeight} kg` : ''}

${allergiesStr}
${medications}
${conditions}
${medicalHistoryStr}

${previousPrescriptionsStr}

${prescriptionTypeStr}

Please provide a complete prescription recommendation in the following format:
1. Drug name (both brand and generic)
2. Dosage (amount per dose)
3. Frequency (how often to take)
4. Duration (how long to take)
5. Total quantity to dispense
6. Number of refills
7. Dispensing instructions
8. Patient instructions
9. Reason for prescription
10. Warnings and precautions
11. Potential drug interactions
12. Alternative medications if appropriate

If the requested medication has any contraindications given the patient's profile, please recommend safer alternatives.
Format your response as a structured prescription that can be parsed programmatically.`;
}

/**
 * Parses the AI response to extract structured prescription data
 */
function parsePrescriptionResponse(aiResponse: string, input: PrescriptionInput): PrescriptionSuggestion {
  try {
    // Try to parse as JSON first
    try {
      const jsonResponse = JSON.parse(aiResponse);
      if (jsonResponse.drugName && jsonResponse.dosage) {
        return {
          ...jsonResponse,
          confidence: jsonResponse.confidence || 0.85
        };
      }
    } catch (e) {
      // Not a JSON response, continue with text parsing
    }
    
    // Extract fields using regex patterns
    const drugNameMatch = aiResponse.match(/drug name:?\s*([^\n]+)/i);
    const dosageMatch = aiResponse.match(/dosage:?\s*([^\n]+)/i);
    const frequencyMatch = aiResponse.match(/frequency:?\s*([^\n]+)/i);
    const durationMatch = aiResponse.match(/duration:?\s*([^\n]+)/i);
    const quantityMatch = aiResponse.match(/quantity:?\s*([^\n]+)/i);
    const refillsMatch = aiResponse.match(/refills:?\s*([^\n]+)/i);
    const dispensedAsMatch = aiResponse.match(/dispens(ed|ing):?\s*([^\n]+)/i);
    const instructionsMatch = aiResponse.match(/instructions:?\s*([^\n]+)/i);
    const reasonMatch = aiResponse.match(/reason:?\s*([^\n]+)/i);
    
    const drugName = drugNameMatch ? drugNameMatch[1].trim() : input.requestedMedication || 'Medication not specified';
    
    // Parse refills as a number
    let refills = 0;
    if (refillsMatch) {
      const refillText = refillsMatch[1].trim();
      const refillNumber = parseInt(refillText);
      refills = isNaN(refillNumber) ? 0 : refillNumber;
    }
    
    return {
      drugName,
      dosage: dosageMatch ? dosageMatch[1].trim() : '',
      frequency: frequencyMatch ? frequencyMatch[1].trim() : '',
      duration: durationMatch ? durationMatch[1].trim() : '',
      quantity: quantityMatch ? quantityMatch[1].trim() : '',
      refills,
      dispensedAs: dispensedAsMatch ? (dispensedAsMatch[2] || '').trim() : 'As written',
      instructions: instructionsMatch ? instructionsMatch[1].trim() : '',
      reasonForPrescription: reasonMatch ? reasonMatch[1].trim() : input.reason || '',
      warnings: [],
      interactions: [],
      confidence: 0.7 // Lower confidence for regex-parsed responses
    };
  } catch (error) {
    console.error('Error parsing AI prescription response:', error);
    return createFallbackSuggestion(input);
  }
}

/**
 * Creates a basic prescription suggestion for fallback
 */
function createFallbackSuggestion(input: PrescriptionInput): PrescriptionSuggestion {
  return {
    drugName: input.requestedMedication || 'Not specified',
    dosage: 'Not specified - requires doctor review',
    frequency: 'Not specified - requires doctor review',
    duration: 'Not specified - requires doctor review',
    quantity: 'Not specified - requires doctor review',
    refills: 0,
    dispensedAs: 'As written',
    instructions: 'Not specified - requires doctor review',
    reasonForPrescription: input.reason || 'Not specified - requires doctor review',
    warnings: ['This is a fallback prescription. Doctor review required before signing.'],
    interactions: ['Manual verification required'],
    confidence: 0
  };
}