import { aiServiceManager } from './ai-service-manager';
import { aiRequestQueue } from './ai-request-queue';
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
    // Validate required inputs
    if (!input.procedure || !input.teeth || input.teeth.length === 0) {
      throw new Error('Procedure and teeth information are required');
    }
    
    // Construct a prompt for the AI with all available details
    const prompt = constructTreatmentNotePrompt(input);
    
    // Generate the note using AI service manager
    const generatedNote = await aiServiceManager.generateTreatmentNote(prompt);
    
    return generatedNote;
  } catch (error: any) {
    console.error('Error generating AI treatment note:', error.message);
    // If AI generation fails, create a basic structured note
    return createFallbackNote(input);
  }
}

/**
 * Constructs a detailed prompt for the AI based on the provided treatment details
 */
function constructTreatmentNotePrompt(input: TreatmentNoteInput): string {
  const teethStr = input.teeth.join(', ');
  const materialsStr = input.materials ? `Materials used: ${input.materials.join(', ')}` : '';
  const isolationStr = input.isolation ? `Isolation method: ${input.isolation}` : '';
  const anesthesiaStr = input.anesthesia ? `Anesthesia: ${input.anesthesia}` : '';
  const detailsStr = input.additionalDetails || '';
  const patientResponseStr = input.patientResponse ? `Patient response: ${input.patientResponse}` : '';
  
  return `Create a detailed dental treatment note for the following procedure:
Procedure: ${input.procedure}
Teeth/Area: ${teethStr}
${materialsStr}
${isolationStr}
${anesthesiaStr}
${detailsStr}
${patientResponseStr}

The note should include:
1. An introduction describing the procedure performed
2. Details on the preparation, including anesthesia (if applicable) and isolation
3. The step-by-step procedure with materials used
4. Post-procedure instructions given to the patient
5. Any relevant patient responses or feedback
6. Follow-up recommendations

Format the note in a professional clinical style suitable for inclusion in a patient's medical record.`;
}

/**
 * Creates a basic structured note if AI generation fails
 */
function createFallbackNote(input: TreatmentNoteInput): string {
  const date = new Date().toISOString().split('T')[0];
  const teeth = input.teeth.join(', ');
  
  return `DATE: ${date}
PROCEDURE: ${input.procedure}
TEETH/AREA: ${teeth}
${input.materials ? `MATERIALS: ${input.materials.join(', ')}` : ''}
${input.isolation ? `ISOLATION: ${input.isolation}` : ''}
${input.anesthesia ? `ANESTHESIA: ${input.anesthesia}` : ''}
${input.additionalDetails ? `ADDITIONAL DETAILS: ${input.additionalDetails}` : ''}
${input.patientResponse ? `PATIENT RESPONSE: ${input.patientResponse}` : ''}

[Note: This is a basic structured note created when AI-generated notes are unavailable. Please review and update as needed.]`;
}