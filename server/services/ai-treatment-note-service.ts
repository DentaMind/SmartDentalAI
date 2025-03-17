import { aiRequestQueue } from './ai-request-queue';
import { aiServiceManager } from './ai-service-manager';
import { AIServiceType } from './ai-service-types';

interface TreatmentNoteInput {
  procedure: string;
  teeth: string[];
  materials?: string[];
  isolation?: string;
  anesthesia?: string;
  additionalDetails?: string;
  patientResponse?: string;
}

/**
 * Generates a detailed treatment note using AI based on procedure details
 * 
 * @param input Treatment procedure details
 * @returns A comprehensive formatted treatment note
 */
export async function generateAiTreatmentNote(input: TreatmentNoteInput): Promise<string> {
  try {
    // Create the prompt for the AI
    const prompt = constructTreatmentNotePrompt(input);
    
    // Use the AI service to generate the treatment note through the queue system
    const result = await aiRequestQueue.enqueueRequest(
      AIServiceType.TREATMENT,
      () => aiServiceManager.generateTreatmentNote(prompt),
      { timeout: 15000, priority: 8 }
    );
    
    return result;
  } catch (error) {
    console.error('Error generating AI treatment note:', error);
    // If AI generation fails, create a structured fallback note
    return createFallbackNote(input);
  }
}

/**
 * Constructs a detailed prompt for the AI based on the provided treatment details
 */
function constructTreatmentNotePrompt(input: TreatmentNoteInput): string {
  // Create a comprehensive, specific prompt for the AI to generate detailed dental treatment notes
  return `
Generate a detailed, professional dental treatment note based on the following information:

PROCEDURE: ${input.procedure}
TEETH: ${input.teeth.join(', ')}
${input.materials ? `MATERIALS: ${input.materials.join(', ')}` : ''}
${input.isolation ? `ISOLATION: ${input.isolation}` : ''}
${input.anesthesia ? `ANESTHESIA: ${input.anesthesia}` : ''}
${input.additionalDetails ? `ADDITIONAL DETAILS: ${input.additionalDetails}` : ''}
${input.patientResponse ? `PATIENT RESPONSE: ${input.patientResponse}` : ''}

The note should follow the SOAP format:
1. Subjective - Patient's presentation and chief complaint
2. Objective - Clinical observations and findings
3. Assessment - Diagnosis and evaluation
4. Plan - Treatment provided and future recommendations

Include specific details about:
- Clinical technique used
- Materials and equipment used
- Patient tolerance and response
- Any unusual findings or complications
- Post-operative instructions provided
- Follow-up recommendations

Format the note as a professional medical record entry that could be included in a patient's chart.
`;
}

/**
 * Creates a basic structured note if AI generation fails
 */
function createFallbackNote(input: TreatmentNoteInput): string {
  const date = new Date().toISOString().split('T')[0];
  
  return `
TREATMENT NOTE - ${date}

PROCEDURE: ${input.procedure}
TEETH: ${input.teeth.join(', ')}
${input.materials ? `MATERIALS: ${input.materials.join(', ')}` : ''}
${input.isolation ? `ISOLATION: ${input.isolation}` : ''}
${input.anesthesia ? `ANESTHESIA: ${input.anesthesia}` : ''}

SUBJECTIVE:
Patient presented for scheduled treatment.

OBJECTIVE:
Treatment performed on teeth ${input.teeth.join(', ')}.
${input.additionalDetails || ''}

ASSESSMENT:
Procedure completed as planned.

PLAN:
Monitor and follow-up as needed.
${input.patientResponse ? `PATIENT RESPONSE: ${input.patientResponse}` : 'Patient tolerated procedure well.'}
  `;
}