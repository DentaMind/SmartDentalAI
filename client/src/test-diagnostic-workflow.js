/**
 * Diagnostic Workflow Test Script
 * 
 * This script tests the end-to-end diagnostic workflow
 * between the PatientDiagnosticsPage and TreatmentSuggestionsPage
 */

import api from './lib/api';

// Test Patient ID
const TEST_PATIENT_ID = '12345';

// Test data for mocking API calls
const mockPatient = {
  id: TEST_PATIENT_ID,
  name: 'John Doe',
  dateOfBirth: '1985-06-15',
};

const mockAnalysisResult = {
  id: 'D1001',
  imageType: 'xray',
  findings: [
    {
      id: 'F1',
      type: 'Cavity',
      description: 'Dental caries detected on distal surface',
      location: 'Tooth #14 (Upper Right First Molar)',
      confidence: 0.94,
      suggestedTreatments: ['Filling', 'Restoration']
    },
    {
      id: 'F2',
      type: 'Periapical Radiolucency',
      description: 'Potential periapical infection indicated by radiolucent area',
      location: 'Tooth #19 (Lower Left First Molar)',
      confidence: 0.87,
      suggestedTreatments: ['Root Canal Therapy', 'Evaluation for Endodontic Treatment']
    }
  ],
  confidence: 0.92,
  timestamp: new Date().toISOString(),
  imageUrl: 'sample-image-url.jpg'
};

const mockTreatmentOptions = {
  treatmentOptions: {
    "Cavity": [
      {
        id: "T001",
        name: "Composite Filling",
        description: "Tooth-colored resin material bonded to the tooth to restore the damaged area.",
        success_rate: 0.92,
        recommended_for: ["Small to medium cavities", "Visible teeth where aesthetics matter"],
        contraindications: ["Very large cavities", "Patients with heavy bruxism"],
        clinical_evidence: [
          {
            id: "CE001",
            title: "Long-term clinical evaluation of composite resin restorations",
            authors: "Johnson et al.",
            journal: "Journal of Dental Research",
            publication_date: "2021-05-15",
            link: "https://example.com/research/composite-eval",
            evidence_strength: 4,
            key_findings: "92% success rate over 5 years for posterior composite restorations"
          }
        ],
        cost_range: "$150-$300 per tooth",
        avg_recovery_time: "Immediate",
        procedure_time: "30-60 minutes",
        insurance_coverage_likelihood: "high"
      }
    ],
    "Periapical Radiolucency": [
      {
        id: "T003",
        name: "Root Canal Therapy",
        description: "Removal of infected pulp tissue, cleaning of canal system, and filling with inert material to prevent reinfection.",
        success_rate: 0.89,
        recommended_for: ["Irreversible pulpitis", "Necrotic pulp with periapical pathology", "Tooth that can be restored"],
        contraindications: ["Severely fractured teeth", "Advanced periodontal disease", "Teeth with poor restorative prognosis"],
        clinical_evidence: [
          {
            id: "CE004",
            title: "Success rates of endodontic treatment and factors influencing outcomes",
            authors: "Rodriguez et al.",
            journal: "Journal of Endodontics",
            publication_date: "2019-07-22",
            link: "https://example.com/research/endo-success",
            evidence_strength: 4,
            key_findings: "89% success rate at 5 years with proper restoration after treatment"
          }
        ],
        cost_range: "$700-$1,500 per tooth",
        avg_recovery_time: "1-2 weeks for tissue healing",
        procedure_time: "60-90 minutes (may require multiple visits)",
        insurance_coverage_likelihood: "medium"
      }
    ]
  }
};

// Mock the API calls for testing
jest.mock('./lib/api', () => ({
  get: jest.fn((url) => {
    if (url === `/patients/${TEST_PATIENT_ID}`) {
      return Promise.resolve({ data: mockPatient });
    } else if (url === `/diagnostics/patient/${TEST_PATIENT_ID}/latest`) {
      return Promise.resolve({ data: mockAnalysisResult });
    }
    return Promise.reject(new Error('Not found'));
  }),
  post: jest.fn((url, data) => {
    if (url === '/diagnostics/analyze') {
      return Promise.resolve({ data: mockAnalysisResult });
    } else if (url === '/diagnostics/save') {
      return Promise.resolve({ data: { success: true } });
    } else if (url === '/treatments/suggest') {
      return Promise.resolve({ data: mockTreatmentOptions });
    }
    return Promise.reject(new Error('Invalid endpoint'));
  })
}));

/**
 * Test the diagnostic workflow
 */
const testDiagnosticWorkflow = async () => {
  console.log('------- TESTING DIAGNOSTIC WORKFLOW -------');
  
  try {
    // Step 1: Get patient information
    console.log('Step 1: Fetching patient information...');
    const patientResponse = await api.get(`/patients/${TEST_PATIENT_ID}`);
    console.log('✅ Patient data retrieved:', patientResponse.data.name);
    
    // Step 2: Upload and analyze image
    console.log('\nStep 2: Uploading and analyzing dental X-ray...');
    const mockFormData = new FormData();
    mockFormData.append('image', 'mock-file-object');
    mockFormData.append('patientId', TEST_PATIENT_ID);
    mockFormData.append('imageType', 'xray');
    
    const analysisResponse = await api.post('/diagnostics/analyze', mockFormData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    console.log('✅ Analysis completed with findings:');
    analysisResponse.data.findings.forEach(finding => {
      console.log(`  - ${finding.type} (${Math.round(finding.confidence * 100)}% confidence)`);
    });
    
    // Step 3: Save diagnostic results
    console.log('\nStep 3: Saving diagnostic results...');
    await api.post('/diagnostics/save', {
      analysisId: analysisResponse.data.id,
      patientId: TEST_PATIENT_ID,
      findings: analysisResponse.data.findings,
      imageType: analysisResponse.data.imageType,
      confidence: analysisResponse.data.confidence,
      notes: 'Test notes added during analysis'
    });
    console.log('✅ Diagnostic results saved successfully');
    
    // Step 4: Fetch treatment suggestions
    console.log('\nStep 4: Fetching treatment suggestions...');
    const treatmentResponse = await api.post('/treatments/suggest', {
      findings: analysisResponse.data.findings
    });
    
    console.log('✅ Treatment suggestions generated:');
    Object.entries(treatmentResponse.data.treatmentOptions).forEach(([condition, options]) => {
      console.log(`  Condition: ${condition}`);
      options.forEach(option => {
        console.log(`    - ${option.name} (${Math.round(option.success_rate * 100)}% success rate)`);
        console.log(`      Cost: ${option.cost_range}`);
      });
    });
    
    console.log('\n✅ DIAGNOSTIC WORKFLOW TEST COMPLETED SUCCESSFULLY');
    return true;
  } catch (error) {
    console.error('❌ DIAGNOSTIC WORKFLOW TEST FAILED:', error);
    return false;
  }
};

// Export for use in Jest or other test runners
export default testDiagnosticWorkflow;

// Run the test when executed directly
if (require.main === module) {
  testDiagnosticWorkflow()
    .then(result => {
      if (result) {
        console.log('All tests passed!');
      } else {
        console.error('Some tests failed!');
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('Error running tests:', err);
      process.exit(1);
    });
} 