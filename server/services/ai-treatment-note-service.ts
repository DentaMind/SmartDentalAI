import OpenAI from 'openai';
import { aiServiceManager } from './ai-service-manager';
import { AIServiceType } from './ai-service-types';
import { aiRequestQueue } from './ai-request-queue';

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
    // Queue the request with appropriate priority
    return await aiRequestQueue.enqueueRequest(
      AIServiceType.TREATMENT,
      async () => {
        const { procedure, teeth, materials, isolation, anesthesia, additionalDetails, patientResponse } = input;

        // Create a structured prompt for the AI
        const teethStr = teeth.join(', ');
        const materialsStr = materials?.join(', ') || 'standard materials';
        const today = new Date().toLocaleDateString();
        
        const prompt = `
Generate a detailed, professional dental treatment note for the following procedure:
- Date: ${today}
- Procedure: ${procedure}
- Tooth/Teeth Involved: ${teethStr}
- Isolation Method: ${isolation || 'Not specified'}
- Anesthesia Used: ${anesthesia || 'Not specified'}
- Materials Used: ${materialsStr}
- Additional Details: ${additionalDetails || 'None provided'}
- Patient Response: ${patientResponse || 'Not recorded'}

The treatment note should:
1. Be written in proper medical/dental terminology
2. Include standard procedural steps for this treatment
3. Note any complications or specific observations if mentioned
4. Be detailed but concise (maximum 200-300 words)
5. Follow standard clinical documentation format
6. Mention the tooth numbering using the FDI notation system
7. Include proper documentation of materials, isolation, and anesthesia used
8. Note the patient's response to treatment
9. NOT include diagnosis information unless explicitly provided
10. NOT include any invented or hallucinated information

Output the treatment note in a simple paragraph format without headings.
`;

        // Call the OpenAI API through the service manager
        const response = await aiServiceManager.generateTreatmentNote(prompt);
        
        return response.trim();
      },
      8 // Priority level (medium-high)
    );
  } catch (error) {
    console.error('Error generating AI treatment note:', error);
    // Fallback to a basic note format
    return createFallbackNote(input);
  }
}

/**
 * Creates a basic structured note if AI generation fails
 */
function createFallbackNote(input: TreatmentNoteInput): string {
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