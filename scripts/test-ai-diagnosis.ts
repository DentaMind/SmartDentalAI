import { MemStorage } from '../server/storage';
import { AIDiagnosisService } from '../server/services/ai-diagnosis';
import { DiagnosisInput } from '../server/types/ai-diagnosis';

async function testAIDiagnosis() {
  console.log('Starting AI Diagnosis Test...\n');

  // Initialize storage and service
  const storage = new MemStorage();
  const aiService = new AIDiagnosisService(storage);

  // Create mock input data
  const mockInput: DiagnosisInput = {
    patientId: 1,
    chart: {
      restorative: {
        '18': { condition: 'caries', surface: 'MO' },
        '19': { condition: 'caries', surface: 'DO' }
      },
      perio: {
        '18': { pocket: 4 },
        '19': { pocket: 5 }
      }
    },
    xrayFindings: {
      findings: [
        'Bone loss detected in posterior region',
        'Periodontal pocketing present'
      ]
    },
    medicalHistory: {
      conditions: ['Diabetes', 'Hypertension'],
      medications: ['Metformin', 'Lisinopril'],
      allergies: ['Penicillin']
    },
    notes: 'Patient reports pain in lower left quadrant, especially when chewing'
  };

  console.log('Test 1: Getting Diagnosis Suggestions');
  console.log('------------------------------------');
  const suggestions = await aiService.getDiagnosisSuggestions(mockInput);
  console.log('Suggestions:', JSON.stringify(suggestions, null, 2));

  if (suggestions.length > 0) {
    console.log('\nTest 2: Logging Diagnosis Selection');
    console.log('----------------------------------');
    const selectedDiagnosis = suggestions[0].diagnosis;
    const log = await aiService.logDiagnosisSelection(
      1, // patientId
      2, // providerId
      suggestions,
      selectedDiagnosis,
      false, // override
      'Initial diagnosis based on clinical findings'
    );
    console.log('Diagnosis Log:', JSON.stringify(log, null, 2));

    console.log('\nTest 3: Submitting Feedback');
    console.log('-------------------------');
    const feedback = {
      suggestionId: 1,
      correct: true,
      feedback: 'AI suggestion was accurate and helpful',
      providerId: 2
    };
    await aiService.submitFeedback(feedback);
    console.log('Feedback submitted successfully');
  }

  console.log('\nTest 4: Verifying Notifications');
  console.log('-----------------------------');
  const notifications = await storage.getNotifications(1, { includeRead: true });
  console.log('Patient Notifications:', JSON.stringify(notifications, null, 2));

  console.log('\nAI Diagnosis Test Completed');
}

testAIDiagnosis().catch(console.error); 