import { describe, it, expect, beforeEach } from 'vitest';
import { MLModelService } from '../services/mlModelService.js';
import { MemStorage } from '../storage.js';
import { DiagnosisInput } from '../types/ai-diagnosis.js';

describe('MLModelService', () => {
  let service: MLModelService;
  let storage: MemStorage;

  beforeEach(() => {
    storage = new MemStorage();
    service = new MLModelService(storage);
  });

  describe('getDiagnosisSuggestions', () => {
    it('should return caries suggestion when chart data indicates decay', async () => {
      const input: DiagnosisInput = {
        patientId: 1,
        chartData: [{ condition: 'caries', toothNumber: 19 }],
        xRayFindings: '',
        medicalHistory: [],
        notes: ''
      };

      const suggestions = await service.getDiagnosisSuggestions(input);
      
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0]).toMatchObject({
        diagnosis: 'Dental Caries',
        confidence: 0.85,
        evidence: [{
          source: 'Chart Data',
          details: expect.stringContaining('decay'),
          relevance: 0.9
        }]
      });
    });

    it('should return periodontal disease suggestion when x-ray shows bone loss', async () => {
      const input: DiagnosisInput = {
        patientId: 1,
        chartData: [],
        xRayFindings: 'bone loss in posterior region',
        medicalHistory: [],
        notes: ''
      };

      const suggestions = await service.getDiagnosisSuggestions(input);
      
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0]).toMatchObject({
        diagnosis: 'Periodontal Disease',
        confidence: 0.75,
        evidence: [{
          source: 'X-ray',
          details: expect.stringContaining('bone loss'),
          relevance: 0.8
        }]
      });
    });

    it('should return diabetes-related suggestion when medical history includes diabetes', async () => {
      const input: DiagnosisInput = {
        patientId: 1,
        chartData: [],
        xRayFindings: '',
        medicalHistory: ['diabetes'],
        notes: ''
      };

      const suggestions = await service.getDiagnosisSuggestions(input);
      
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0]).toMatchObject({
        diagnosis: 'Diabetes-Related Periodontal Disease',
        confidence: 0.65,
        evidence: [{
          source: 'Medical History',
          details: expect.stringContaining('diabetes'),
          relevance: 0.7
        }]
      });
    });

    it('should return pain-related suggestion when notes mention pain', async () => {
      const input: DiagnosisInput = {
        patientId: 1,
        chartData: [],
        xRayFindings: '',
        medicalHistory: [],
        notes: 'Patient reports severe pain in lower right molar'
      };

      const suggestions = await service.getDiagnosisSuggestions(input);
      
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0]).toMatchObject({
        diagnosis: 'Dental Pain',
        confidence: 0.7,
        evidence: [{
          source: 'Patient Notes',
          details: expect.stringContaining('pain'),
          relevance: 0.75
        }]
      });
    });

    it('should return multiple suggestions when multiple conditions are present', async () => {
      const input: DiagnosisInput = {
        patientId: 1,
        chartData: [{ condition: 'caries', toothNumber: 19 }],
        xRayFindings: 'bone loss',
        medicalHistory: ['diabetes'],
        notes: 'Patient reports pain'
      };

      const suggestions = await service.getDiagnosisSuggestions(input);
      
      expect(suggestions.length).toBeGreaterThan(1);
      expect(suggestions.map(s => s.diagnosis)).toContain('Dental Caries');
      expect(suggestions.map(s => s.diagnosis)).toContain('Periodontal Disease');
      expect(suggestions.map(s => s.diagnosis)).toContain('Diabetes-Related Periodontal Disease');
      expect(suggestions.map(s => s.diagnosis)).toContain('Dental Pain');
    });

    it('should return routine checkup suggestion when no specific conditions are found', async () => {
      const input: DiagnosisInput = {
        patientId: 1,
        chartData: [],
        xRayFindings: '',
        medicalHistory: [],
        notes: ''
      };

      const suggestions = await service.getDiagnosisSuggestions(input);
      
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0]).toMatchObject({
        diagnosis: 'Routine Checkup Recommended',
        confidence: 0.5,
        evidence: [{
          source: 'General Assessment',
          details: expect.stringContaining('routine checkup'),
          relevance: 0.6
        }]
      });
    });
  });

  describe('submitFeedback', () => {
    it('should accept feedback without throwing error', async () => {
      const feedback = {
        suggestionId: 1,
        correct: true,
        feedback: 'Accurate diagnosis',
        providerId: 1
      };

      await expect(service.submitFeedback(feedback)).resolves.not.toThrow();
    });
  });

  describe('getModelVersion', () => {
    it('should return model version', () => {
      const version = service.getModelVersion();
      expect(version).toBe('1.0.0');
    });
  });
}); 