import { apiRequest } from '@/lib/queryClient';

interface DiagnosisResult {
  primaryDiagnosis: string;
  differentials: { diagnosis: string; confidence: number }[];
  explanation: string;
  requiresMoreInfo: boolean;
  questions?: string[];
}

/**
 * Runs the diagnosis engine for a specific patient
 * @param patientId The ID of the patient to diagnose
 * @returns A diagnosis result with primary diagnosis, differentials, and explanation
 */
export async function runDiagnosisEngine(patientId: string): Promise<DiagnosisResult> {
  try {
    // In a real implementation, this would make an API call to the server
    // For demo purposes, we'll simulate a response
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // This is where you would make the actual API call:
    // const response = await apiRequest(`/api/diagnosis/patient/${patientId}`, {
    //   method: 'POST'
    // });
    // return response;
    
    // Sample diagnosis data (for demo purposes)
    return {
      primaryDiagnosis: "Chronic Periodontitis (Moderate)",
      differentials: [
        { diagnosis: "Aggressive Periodontitis", confidence: 65 },
        { diagnosis: "Gingivitis with Localized Attachment Loss", confidence: 55 },
        { diagnosis: "Peri-implantitis", confidence: 35 }
      ],
      explanation: "The diagnosis of Chronic Periodontitis (Moderate) is based on several findings in the patient's clinical data:\n\n1. Consistent pocket depths of 4-5mm in multiple areas, particularly in the posterior segments\n2. Radiographic evidence of horizontal bone loss (approximately 30% in affected areas)\n3. Presence of subgingival calculus deposits\n4. Bleeding on probing in over 30% of sites\n5. Patient's age (45) and medical history (controlled Type 2 diabetes) are consistent with chronic periodontitis\n\nThe pattern of attachment loss appears to be consistent with a chronic inflammatory response to local factors rather than a rapidly progressive disease, ruling out aggressive periodontitis as the primary diagnosis.",
      requiresMoreInfo: true,
      questions: [
        "Has the patient experienced episodes of acute pain or abscess formation?",
        "Is there any family history of early tooth loss due to periodontal disease?",
        "When did the patient first notice symptoms of gum inflammation or bleeding?"
      ]
    };
  } catch (error) {
    console.error('Error running diagnosis engine:', error);
    throw new Error('Failed to generate diagnosis');
  }
}

/**
 * Submits doctor feedback on the diagnosis
 * @param patientId Patient ID
 * @param selectedDiagnosis The diagnosis selected by the doctor
 * @param wasCorrect Whether the AI's primary diagnosis was correct
 * @param comment Optional feedback comment
 */
export async function submitDoctorFeedback(
  patientId: string,
  selectedDiagnosis: string,
  wasCorrect: boolean,
  comment?: string
): Promise<void> {
  try {
    // In a real implementation, this would send the feedback to the server
    // For demo purposes, we'll just log it and simulate a delay
    
    console.log('Submitting diagnosis feedback:', {
      patientId,
      selectedDiagnosis,
      wasCorrect,
      comment
    });
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // This is where you would make the actual API call:
    // await apiRequest('/api/diagnosis/feedback', {
    //   method: 'POST',
    //   data: {
    //     patientId,
    //     selectedDiagnosis,
    //     wasCorrect,
    //     comment
    //   }
    // });
    
    return;
  } catch (error) {
    console.error('Error submitting diagnosis feedback:', error);
    throw new Error('Failed to submit feedback');
  }
}

/**
 * Gets the latest diagnosis for a patient
 * @param patientId Patient ID
 * @returns The latest diagnosis result
 */
export async function getLatestDiagnosis(patientId: string): Promise<DiagnosisResult | null> {
  try {
    // In a real implementation, this would make an API call to the server
    // For demo purposes, we'll simulate a response
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // This is where you would make the actual API call:
    // const response = await apiRequest(`/api/diagnosis/patient/${patientId}/latest`);
    // return response;
    
    // For demo purposes, return null to simulate no existing diagnosis
    return null;
  } catch (error) {
    console.error('Error getting latest diagnosis:', error);
    return null;
  }
}

/**
 * Utility to extract text for diagnosis from patient notes
 * @param notes Array of patient notes
 * @returns Preprocessed text for diagnosis
 */
export function extractDiagnosticText(notes: any[]): string {
  // This function would extract and preprocess text from patient notes
  // to prepare it for the diagnosis engine
  
  if (!notes || notes.length === 0) {
    return '';
  }
  
  // Simple implementation - concatenate all note content
  return notes.map(note => {
    if (typeof note === 'string') return note;
    return note.content || note.text || '';
  }).join('\n\n');
}

/**
 * Updates a diagnosis with additional information
 * @param diagnosisId Diagnosis ID to update
 * @param additionalInfo Additional information provided by the doctor
 */
export async function updateDiagnosisWithAdditionalInfo(
  diagnosisId: string,
  additionalInfo: string
): Promise<DiagnosisResult> {
  try {
    // In a real implementation, this would make an API call to the server
    // For demo purposes, we'll simulate a response
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // This is where you would make the actual API call:
    // const response = await apiRequest(`/api/diagnosis/${diagnosisId}/update`, {
    //   method: 'POST',
    //   data: { additionalInfo }
    // });
    // return response;
    
    // Sample updated diagnosis data (for demo purposes)
    return {
      primaryDiagnosis: "Chronic Periodontitis (Moderate)",
      differentials: [
        { diagnosis: "Aggressive Periodontitis", confidence: 45 }, // Lower confidence now
        { diagnosis: "Gingivitis with Localized Attachment Loss", confidence: 35 },
        { diagnosis: "Peri-implantitis", confidence: 25 }
      ],
      explanation: "The diagnosis of Chronic Periodontitis (Moderate) is now confirmed with additional information provided:\n\n1. Consistent pocket depths of 4-5mm in multiple areas, particularly in the posterior segments\n2. Radiographic evidence of horizontal bone loss (approximately 30% in affected areas)\n3. Presence of subgingival calculus deposits\n4. Bleeding on probing in over 30% of sites\n5. Patient's age (45) and medical history (controlled Type 2 diabetes) are consistent with chronic periodontitis\n6. No family history of early tooth loss, supporting chronic rather than aggressive nature\n7. Symptoms developed gradually over several years, consistent with chronic periodontitis\n\nThe pattern of attachment loss appears to be consistent with a chronic inflammatory response to local factors rather than a rapidly progressive disease.",
      requiresMoreInfo: false
    };
  } catch (error) {
    console.error('Error updating diagnosis with additional info:', error);
    throw new Error('Failed to update diagnosis');
  }
}