import { describe, it, expect, beforeEach } from 'vitest';
import { AIDiagnosisService } from '../services/aiDiagnosisService.js';
import { MemStorage } from '../storage.js';
import { DiagnosisFeedback } from '../types/ai-diagnosis.js';

describe('AIDiagnosisService', () => {
  let service: AIDiagnosisService;
  let storage: MemStorage;

  beforeEach(() => {
    storage = new MemStorage();
    service = new AIDiagnosisService(storage);
  });

  describe('getSuggestions', () => {
    it('should return diagnosis suggestions for a patient', async () => {
      const patientId = 1;
      const suggestions = await service.getSuggestions(patientId);
      
      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
      suggestions.forEach(suggestion => {
        expect(suggestion).toHaveProperty('diagnosis');
        expect(suggestion).toHaveProperty('confidence');
        expect(suggestion).toHaveProperty('evidence');
      });
    });

    it('should throw error for non-existent patient', async () => {
      const nonExistentPatientId = 999;
      await expect(service.getSuggestions(nonExistentPatientId)).rejects.toThrow('Patient not found');
    });
  });

  describe('submitFeedback', () => {
    it('should submit feedback successfully', async () => {
      const patientId = 1;
      const feedback: DiagnosisFeedback = {
        suggestionId: 1,
        correct: true,
        feedback: 'Accurate diagnosis',
        providerId: 1
      };

      await expect(service.submitFeedback(patientId, feedback)).resolves.not.toThrow();
    });

    it('should throw error for non-existent patient', async () => {
      const nonExistentPatientId = 999;
      const feedback: DiagnosisFeedback = {
        suggestionId: 1,
        correct: true,
        feedback: 'Accurate diagnosis',
        providerId: 1
      };

      await expect(service.submitFeedback(nonExistentPatientId, feedback)).rejects.toThrow('Patient not found');
    });
  });

  describe('submitDiagnosis', () => {
    it('should submit diagnosis successfully', async () => {
      const patientId = 1;
      const diagnosis = 'Caries';
      const notes = 'Requires filling';

      await expect(service.submitDiagnosis(patientId, diagnosis, notes)).resolves.not.toThrow();
    });

    it('should throw error for non-existent patient', async () => {
      const nonExistentPatientId = 999;
      const diagnosis = 'Caries';
      const notes = 'Requires filling';

      await expect(service.submitDiagnosis(nonExistentPatientId, diagnosis, notes)).rejects.toThrow('Patient not found');
    });
  });

  describe('getAuditLogs', () => {
    it('should return audit logs for a patient', async () => {
      const patientId = 1;
      const logs = await service.getAuditLogs(patientId);
      
      expect(logs).toBeDefined();
      expect(Array.isArray(logs)).toBe(true);
      logs.forEach(log => {
        expect(log).toHaveProperty('patientId');
        expect(log).toHaveProperty('providerId');
        expect(log).toHaveProperty('timestamp');
      });
    });

    it('should throw error for non-existent patient', async () => {
      const nonExistentPatientId = 999;
      await expect(service.getAuditLogs(nonExistentPatientId)).rejects.toThrow('Patient not found');
    });
  });
}); 