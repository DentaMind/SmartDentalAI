import { MemStorage } from '../storage.js';
import { DiagnosisSuggestion, DiagnosisInput, DiagnosisAuditLog, DiagnosisFeedback } from '../types/ai-diagnosis.js';
import { MLModelService } from './mlModelService.js';

interface ProviderMetrics {
  providerId: number;
  totalSuggestions: number;
  acceptedSuggestions: number;
  rejectedSuggestions: number;
  overrides: number;
  accuracy: number;
  averageResponseTime: number;
  accuracyTrend: { date: string; accuracy: number }[];
}

interface ModelVersionComparison {
  currentVersion: string;
  previousVersion: string;
  accuracyChange: number;
  confidenceChange: number;
  overrideRateChange: number;
  comparisonPeriod: {
    start: string;
    end: string;
  };
}

export class AIDiagnosisService {
  private storage: MemStorage;
  private mlModelService: MLModelService;

  constructor(storage: MemStorage) {
    this.storage = storage;
    this.mlModelService = new MLModelService(storage);
  }

  async getSuggestions(patientId: number): Promise<DiagnosisSuggestion[]> {
    const patient = await this.storage.getEntity('patient', patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }

    // Get patient data for ML model input
    const chartData = await this.storage.getEntities('chart_entry').then(entries => 
      entries.filter(entry => entry.patientId === patientId)
    );
    const xRayFindings = await this.storage.getEntities('x_ray').then(xRays =>
      xRays.filter(xRay => xRay.patientId === patientId)
    );
    const medicalHistory = patient.medicalHistory || [];
    const notes = patient.notes || '';

    const input: DiagnosisInput = {
      patientId,
      chartData,
      xRayFindings: xRayFindings.map(xRay => xRay.findings).join(', '),
      medicalHistory,
      notes
    };

    // Get suggestions from ML model
    const suggestions = await this.mlModelService.getDiagnosisSuggestions(input);

    // Log the suggestions for audit purposes
    await this.logDiagnosisSuggestions(patientId, suggestions);

    return suggestions;
  }

  async submitFeedback(patientId: number, feedback: DiagnosisFeedback): Promise<void> {
    const patient = await this.storage.getEntity('patient', patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }

    // Store feedback in audit log
    const auditLog: DiagnosisAuditLog = {
      patientId,
      providerId: feedback.providerId,
      timestamp: new Date().toISOString(),
      feedback,
      override: feedback.correctness === 'incorrect'
    };

    await this.storage.createEntity('diagnosis_audit_log', auditLog);

    // Submit feedback to ML model for improvement
    await this.mlModelService.submitFeedback({
      suggestionId: feedback.suggestionId,
      correct: feedback.correctness === 'correct',
      feedback: feedback.feedback,
      providerId: feedback.providerId
    });
  }

  async submitDiagnosis(patientId: number, diagnosis: string, notes?: string): Promise<void> {
    const patient = await this.storage.getEntity('patient', patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }

    // Create diagnosis record
    const diagnosisRecord = {
      patientId,
      diagnosis,
      notes,
      timestamp: new Date().toISOString()
    };

    await this.storage.createEntity('diagnosis', diagnosisRecord);

    // If this was an override of an AI suggestion, log it
    if (notes?.includes('override')) {
      const auditLog: DiagnosisAuditLog = {
        patientId,
        providerId: 1, // TODO: Get actual provider ID from auth
        timestamp: new Date().toISOString(),
        feedback: {
          suggestionId: 0,
          correctness: 'incorrect',
          feedback: 'Provider overrode AI suggestion',
          providerId: 1
        },
        override: true
      };

      await this.storage.createEntity('diagnosis_audit_log', auditLog);
    }
  }

  async getAuditLogs(patientId: number): Promise<DiagnosisAuditLog[]> {
    const patient = await this.storage.getEntity('patient', patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }

    // Get all audit logs for the patient
    const logs = await this.storage.getEntities('diagnosis_audit_log');
    return logs.filter(log => log.patientId === patientId);
  }

  async getAllAuditLogs(): Promise<DiagnosisAuditLog[]> {
    // Get all audit logs
    return await this.storage.getEntities('diagnosis_audit_log');
  }

  getModelVersion(): string {
    return this.mlModelService.getModelVersion();
  }

  private async logDiagnosisSuggestions(patientId: number, suggestions: DiagnosisSuggestion[]): Promise<void> {
    const auditLog: DiagnosisAuditLog = {
      patientId,
      providerId: 0, // System-generated
      timestamp: new Date().toISOString(),
      suggestions,
      override: false
    };

    await this.storage.createEntity('diagnosis_audit_log', auditLog);
  }

  async getProviderMetrics(): Promise<ProviderMetrics[]> {
    const logs = await this.storage.getEntities('diagnosis_audit_log');
    const providerMap = new Map<number, ProviderMetrics>();

    logs.forEach(log => {
      if (!log.providerId) return;

      const metrics = providerMap.get(log.providerId) || {
        providerId: log.providerId,
        totalSuggestions: 0,
        acceptedSuggestions: 0,
        rejectedSuggestions: 0,
        overrides: 0,
        accuracy: 0,
        averageResponseTime: 0,
        accuracyTrend: []
      };

      metrics.totalSuggestions++;
      if (log.feedback?.correctness === 'correct') {
        metrics.acceptedSuggestions++;
      } else if (log.feedback?.correctness === 'incorrect') {
        metrics.rejectedSuggestions++;
      }
      if (log.override) {
        metrics.overrides++;
      }

      // Calculate accuracy trend
      const date = new Date(log.timestamp).toISOString().split('T')[0];
      const trendEntry = metrics.accuracyTrend.find(t => t.date === date) || { date, accuracy: 0 };
      trendEntry.accuracy = (metrics.acceptedSuggestions / metrics.totalSuggestions) * 100;
      if (!metrics.accuracyTrend.find(t => t.date === date)) {
        metrics.accuracyTrend.push(trendEntry);
      }

      providerMap.set(log.providerId, metrics);
    });

    // Calculate final metrics
    return Array.from(providerMap.values()).map(metrics => ({
      ...metrics,
      accuracy: (metrics.acceptedSuggestions / metrics.totalSuggestions) * 100
    }));
  }

  async compareModelVersions(): Promise<ModelVersionComparison> {
    const logs = await this.storage.getEntities('diagnosis_audit_log');
    const currentVersion = this.mlModelService.getModelVersion();
    const previousVersion = '1.0.0'; // This should be stored in the database

    // Split logs by version
    const currentVersionLogs = logs.filter(log => 
      new Date(log.timestamp) > new Date('2024-01-01') // Example date, should be configurable
    );
    const previousVersionLogs = logs.filter(log => 
      new Date(log.timestamp) <= new Date('2024-01-01')
    );

    // Calculate metrics for each version
    const calculateMetrics = (versionLogs: DiagnosisAuditLog[]) => {
      const total = versionLogs.length;
      const accepted = versionLogs.filter(log => log.feedback?.correctness === 'correct').length;
      const overrides = versionLogs.filter(log => log.override).length;
      const averageConfidence = versionLogs.reduce((sum, log) => 
        sum + (log.suggestions?.[0]?.confidence || 0), 0
      ) / total;

      return {
        accuracy: (accepted / total) * 100,
        overrideRate: (overrides / total) * 100,
        averageConfidence
      };
    };

    const currentMetrics = calculateMetrics(currentVersionLogs);
    const previousMetrics = calculateMetrics(previousVersionLogs);

    return {
      currentVersion,
      previousVersion,
      accuracyChange: currentMetrics.accuracy - previousMetrics.accuracy,
      confidenceChange: currentMetrics.averageConfidence - previousMetrics.averageConfidence,
      overrideRateChange: currentMetrics.overrideRate - previousMetrics.overrideRate,
      comparisonPeriod: {
        start: '2024-01-01', // Should be configurable
        end: new Date().toISOString()
      }
    };
  }
} 