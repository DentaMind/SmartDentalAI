import { db } from '../db.js';
import { aiTriageResults } from '../../shared/schema.js';
import { v4 as uuidv4 } from 'uuid';

const MODEL_VERSIONS = ['1.0.0', '1.1.0']; // Simulating A/B testing with two versions

const generateTestData = async () => {
  try {
    // Generate 50 test records with alternating model versions
    const testRecords = Array.from({ length: 50 }, (_, i) => ({
      id: uuidv4(),
      formId: uuidv4(),
      patientId: uuidv4(),
      modelVersion: MODEL_VERSIONS[i % 2], // Alternate between versions
      analysis: {
        symptoms: ['tooth pain', 'swelling', 'sensitivity'],
        riskFactors: ['smoking', 'diabetes'],
        conditions: ['cavity', 'gum disease']
      },
      outcome: i % 2 === 0 ? 'urgent' : 'routine', // Alternate outcomes
      nextStep: i % 2 === 0 ? 'immediate treatment' : 'schedule follow-up',
      xrayFindings: {
        hasXray: true,
        findings: ['cavity detected', 'bone loss']
      },
      createdAt: new Date(Date.now() - i * 86400000) // Stagger dates by 1 day
    }));

    // Insert test records
    await db.insert(aiTriageResults).values(testRecords);
    
    console.log('Successfully generated test data!');
    console.log(`Created ${testRecords.length} records with model versions: ${MODEL_VERSIONS.join(', ')}`);
  } catch (error) {
    console.error('Error generating test data:', error);
  }
};

generateTestData(); 