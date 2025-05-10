import { DiagnosisInput, DiagnosisSuggestion, DiagnosisAuditLog, DiagnosisFeedback } from '../types/ai-diagnosis';
import { MemStorage } from '../storage';
import { Notification } from '../../shared/schema';

export class AIDiagnosisService {
  private storage: MemStorage;

  constructor(storage: MemStorage) {
    this.storage = storage;
  }

  async getDiagnosisSuggestions(input: DiagnosisInput): Promise<DiagnosisSuggestion[]> {
    // TODO: Integrate with actual AI model
    // For now, return mock suggestions based on input data
    const suggestions: DiagnosisSuggestion[] = [];

    // Analyze chart data
    if (input.chart.restorative) {
      const caries = this.analyzeCaries(input.chart.restorative);
      if (caries) {
        suggestions.push({
          diagnosis: 'Dental Caries',
          confidence: 0.85,
          evidence: [{
            source: 'chart',
            details: 'Multiple carious lesions detected in posterior teeth'
          }]
        });
      }
    }

    // Analyze x-ray findings
    if (input.xrayFindings?.findings) {
      const perio = this.analyzePeriodontal(input.xrayFindings.findings);
      if (perio) {
        suggestions.push({
          diagnosis: 'Periodontitis',
          confidence: 0.75,
          evidence: [{
            source: 'xray',
            details: 'Bone loss detected in multiple quadrants'
          }]
        });
      }
    }

    // Analyze medical history
    if (input.medicalHistory?.conditions.includes('Diabetes')) {
      suggestions.push({
        diagnosis: 'Periodontal Disease (Diabetes-related)',
        confidence: 0.70,
        evidence: [{
          source: 'medical_history',
          details: 'Patient has diabetes, which is a risk factor for periodontal disease'
        }]
      });
    }

    // Analyze notes
    if (input.notes.toLowerCase().includes('pain')) {
      suggestions.push({
        diagnosis: 'Dental Pain',
        confidence: 0.80,
        evidence: [{
          source: 'notes',
          details: 'Patient reported pain in clinical notes'
        }]
      });
    }

    return suggestions;
  }

  async logDiagnosisSelection(
    patientId: number,
    providerId: number,
    suggestions: DiagnosisSuggestion[],
    selectedDiagnosis: string,
    override: boolean = false,
    feedback?: string
  ): Promise<DiagnosisAuditLog> {
    const log: DiagnosisAuditLog = {
      id: Date.now(), // Temporary ID until we implement proper ID generation
      patientId,
      providerId,
      timestamp: new Date(),
      originalSuggestions: suggestions,
      selectedDiagnosis,
      confidence: suggestions.find(s => s.diagnosis === selectedDiagnosis)?.confidence || 0,
      override,
      feedback
    };

    // Store the audit log
    await this.storage.create('diagnosis_audit_log', log);

    // Create notification for the patient if it's a significant diagnosis
    if (log.confidence > 0.7) {
      await this.storage.notify(
        patientId,
        'diagnosis',
        `Your dentist has diagnosed: ${selectedDiagnosis}`,
        { diagnosis: selectedDiagnosis, confidence: log.confidence }
      );
    }

    return log;
  }

  async submitFeedback(feedback: DiagnosisFeedback): Promise<void> {
    // Store the feedback
    await this.storage.create('diagnosis_feedback', feedback);

    // TODO: Use this feedback to improve the AI model
  }

  private analyzeCaries(chart: Record<string, any>): boolean {
    // Simple mock analysis - in reality, this would use ML
    return Object.values(chart).some((tooth: any) => 
      tooth?.condition?.toLowerCase().includes('caries')
    );
  }

  private analyzePeriodontal(findings: string[]): boolean {
    // Simple mock analysis - in reality, this would use ML
    return findings.some(finding => 
      finding.toLowerCase().includes('bone loss') || 
      finding.toLowerCase().includes('periodontal')
    );
  }
} 