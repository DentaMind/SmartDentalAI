import { db } from '../db';
import { aiTriageResults, aiModelVersions } from '../../shared/schema';
import { NewAiTriageResult } from '../../shared/types';
import { eq, desc } from 'drizzle-orm';

function assignModelVersion(): Promise<string> {
  return db
    .select()
    .from(aiModelVersions)
    .orderBy(desc(aiModelVersions.createdAt))
    .then((models) => {
      const deployed = models.find((m) => m.status === 'deployed');
      const ready = models.find((m) => m.status === 'ready');
      if (deployed && ready) {
        // A/B split
        return Math.random() < 0.5 ? deployed.version : ready.version;
      }
      return deployed?.version || ready?.version || '1.0.0';
    });
}

export class AITriageService {
  static async analyzeForm(formId: number, patientId: number, currentSymptoms: any) {
    try {
      const version = await assignModelVersion();

      // Get previous results for comparison
      const previousResults = await db
        .select()
        .from(aiTriageResults)
        .where(eq(aiTriageResults.patientId, patientId))
        .orderBy(desc(aiTriageResults.createdAt))
        .limit(1);

      const previousSymptoms = previousResults[0]?.analysis?.symptoms || {};

      // Compare symptoms and determine outcome
      const outcome = this.compareSymptoms(previousSymptoms, currentSymptoms);
      const nextStep = this.determineNextStep(outcome);
      const riskFactors = this.assessRiskFactors(currentSymptoms);
      const conditions = this.identifyConditions(currentSymptoms);
      const xrayFindings = this.analyzeXrayFindings(currentSymptoms);

      const result = {
        formId,
        patientId,
        analysis: {
          symptoms: currentSymptoms,
          riskFactors,
          conditions,
        },
        outcome,
        nextStep,
        xrayFindings,
        modelVersion: version, // log version used
        createdAt: new Date(),
      };

      const [savedResult] = await db.insert(aiTriageResults).values(result).returning();
      return savedResult;
    } catch (err) {
      console.error('Triage failed:', err);
      throw err;
    }
  }

  private static compareSymptoms(previous: any, current: any): 'improved' | 'worsened' | 'stable' {
    // Implement symptom comparison logic
    // This is a simplified example
    const previousCount = Object.values(previous).filter(Boolean).length;
    const currentCount = Object.values(current).filter(Boolean).length;

    if (currentCount < previousCount) return 'improved';
    if (currentCount > previousCount) return 'worsened';
    return 'stable';
  }

  private static determineNextStep(outcome: string): string {
    // Implement next step determination logic
    switch (outcome) {
      case 'improved':
        return 'monitor';
      case 'worsened':
        return 're-eval';
      case 'stable':
        return 'recall';
      default:
        return 'monitor';
    }
  }

  private static assessRiskFactors(symptoms: any): string[] {
    // Implement risk factor assessment logic
    const riskFactors: string[] = [];
    if (symptoms.pain) riskFactors.push('pain');
    if (symptoms.swelling) riskFactors.push('swelling');
    if (symptoms.bleeding) riskFactors.push('bleeding');
    return riskFactors;
  }

  private static identifyConditions(symptoms: any): string[] {
    // Implement condition identification logic
    const conditions: string[] = [];
    if (symptoms.pain && symptoms.swelling) conditions.push('infection');
    if (symptoms.bleeding && symptoms.swelling) conditions.push('gum_disease');
    return conditions;
  }

  private static analyzeXrayFindings(symptoms: any): any {
    // Implement X-ray analysis logic
    return {
      boneLoss: symptoms.boneLoss,
      cavities: symptoms.cavities,
      rootIssues: symptoms.rootIssues,
    };
  }

  static async getTriageResult(formId: number) {
    try {
      return await db.query.aiTriageResults.findFirst({
        where: (results, { eq }) => eq(results.formId, formId),
      });
    } catch (error) {
      console.error('Failed to fetch triage result:', error);
      throw error;
    }
  }

  static async getPatientTriageHistory(patientId: number) {
    try {
      return await db.query.aiTriageResults.findMany({
        where: (results, { eq }) => eq(results.patientId, patientId),
        orderBy: (results, { desc }) => desc(results.createdAt),
      });
    } catch (error) {
      console.error('Failed to fetch patient triage history:', error);
      throw error;
    }
  }
} 