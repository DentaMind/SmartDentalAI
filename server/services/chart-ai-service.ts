import { OpenAI } from 'openai';
import { z } from 'zod';
import { aiRequestQueue } from './ai-request-queue';
import { AIServiceType } from '../config/ai-keys';
import { 
  RestorativeChart, 
  PeriodontalChart,
  ChartingNote,
  Xray,
  PerioChart
} from '@shared/schema';
import { AuditLogService } from './audit';
import { StorageService } from './storage';
import { ToothNumber, ToothSurface, PerioMeasurementSite } from '../../shared/tooth-mapping';

// Schema for AI analysis results
const chartAnalysisSchema = z.object({
  findings: z.array(z.object({
    type: z.enum(['caries', 'periodontal', 'restorative', 'endodontic', 'other']),
    location: z.string(),
    description: z.string(),
    confidence: z.number().min(0).max(1),
    severity: z.enum(['mild', 'moderate', 'severe']).optional(),
    recommendations: z.array(z.string()).optional()
  })),
  overallAssessment: z.string(),
  recommendations: z.array(z.string()),
  confidenceScore: z.number().min(0).max(1),
  metadata: z.object({
    processingTime: z.number(),
    modelVersion: z.string(),
    analysisDate: z.string()
  })
});

export type ChartAnalysis = z.infer<typeof chartAnalysisSchema>;

export class ChartAIService {
  private openAI: OpenAI;
  private auditService: AuditLogService;
  private storageService: StorageService;

  constructor() {
    this.openAI = new OpenAI({
      apiKey: process.env.CHART_AI_KEY || ''
    });
    this.auditService = new AuditLogService();
    this.storageService = new StorageService();
  }

  /**
   * Analyze a restorative chart
   */
  async analyzeRestorativeChart(
    chart: RestorativeChart,
    xrays: Xray[] = [],
    previousChart?: RestorativeChart
  ): Promise<{
    findings: Array<{
      toothNumber: ToothNumber;
      surfaces: ToothSurface[];
      condition: string;
      confidence: number;
      notes: string;
    }>;
    recommendations: string[];
    riskFactors: string[];
  }> {
    try {
      // Convert chart data to AI-consumable format
      const chartData = this.formatRestorativeChartForAI(chart, xrays, previousChart);

      // Queue the analysis request
      const analysis = await aiRequestQueue.enqueueRequest(
        AIServiceType.CHART_ANALYSIS,
        async () => {
          const response = await this.openAI.chat.completions.create({
            model: 'gpt-4',
            messages: [
              {
                role: 'system',
                content: 'You are an expert dental AI assistant specializing in restorative chart analysis. Analyze the provided chart data and identify any issues, patterns, or recommendations.'
              },
              {
                role: 'user',
                content: JSON.stringify(chartData)
              }
            ],
            response_format: { type: 'json_object' }
          });

          return response.choices[0]?.message?.content || '';
        }
      );

      // Parse and validate the response
      const parsedAnalysis = JSON.parse(analysis);
      const findings = parsedAnalysis.findings.map((finding: any) => ({
        toothNumber: finding.toothNumber,
        surfaces: finding.surfaces,
        condition: finding.condition,
        confidence: finding.confidence,
        notes: finding.notes
      }));

      // Generate overall recommendations
      const recommendations = parsedAnalysis.recommendations;

      // Identify risk factors
      const riskFactors = await this.identifyRiskFactors(findings);

      // Log analysis
      await this.auditService.logAction({
        userId: chart.doctorId,
        action: 'analyze_chart',
        entityType: 'restorative_chart',
        entityId: chart.id,
        details: {
          findings,
          recommendations,
          riskFactors
        }
      });

      return {
        findings,
        recommendations,
        riskFactors
      };
    } catch (error) {
      console.error('Error analyzing restorative chart:', error);
      throw error;
    }
  }

  /**
   * Analyze a periodontal chart
   */
  async analyzePeriodontalChart(
    chart: PeriodontalChart,
    xrays: Xray[] = [],
    previousChart?: PeriodontalChart
  ): Promise<ChartAnalysis> {
    try {
      // Convert chart data to AI-consumable format
      const chartData = this.formatPeriodontalChartForAI(chart, xrays, previousChart);

      // Queue the analysis request
      const analysis = await aiRequestQueue.enqueueRequest(
        AIServiceType.CHART_ANALYSIS,
        async () => {
          const response = await this.openAI.chat.completions.create({
            model: 'gpt-4',
            messages: [
              {
                role: 'system',
                content: 'You are an expert dental AI assistant specializing in periodontal chart analysis. Analyze the provided chart data and identify any issues, patterns, or recommendations.'
              },
              {
                role: 'user',
                content: JSON.stringify(chartData)
              }
            ],
            response_format: { type: 'json_object' }
          });

          return response.choices[0]?.message?.content || '';
        }
      );

      // Parse and validate the response
      const parsedAnalysis = JSON.parse(analysis);
      return chartAnalysisSchema.parse(parsedAnalysis);
    } catch (error) {
      console.error('Error analyzing periodontal chart:', error);
      throw new Error('Failed to analyze periodontal chart');
    }
  }

  /**
   * Format restorative chart data for AI analysis
   */
  private formatRestorativeChartForAI(
    chart: RestorativeChart,
    xrays: Xray[],
    previousChart?: RestorativeChart
  ): any {
    return {
      type: 'restorative',
      teeth: chart.teethData,
      missingTeeth: chart.missingTeeth,
      modifications: chart.modifications,
      xrays: xrays.map(x => ({
        type: x.type,
        url: x.imageUrl,
        metadata: x.metadata
      })),
      previousChart: previousChart ? {
        teeth: previousChart.teethData,
        missingTeeth: previousChart.missingTeeth,
        modifications: previousChart.modifications
      } : null
    };
  }

  /**
   * Format periodontal chart data for AI analysis
   */
  private formatPeriodontalChartForAI(
    chart: PeriodontalChart,
    xrays: Xray[],
    previousChart?: PeriodontalChart
  ): any {
    return {
      type: 'periodontal',
      measurements: chart.measurements,
      bleedingPoints: chart.bleedingPoints,
      diseaseStatus: chart.diseaseStatus,
      xrays: xrays.map(x => ({
        type: x.type,
        url: x.imageUrl,
        metadata: x.metadata
      })),
      previousChart: previousChart ? {
        measurements: previousChart.measurements,
        bleedingPoints: previousChart.bleedingPoints,
        diseaseStatus: previousChart.diseaseStatus
      } : null
    };
  }

  private async identifyRiskFactors(findings: Array<{
    toothNumber: ToothNumber;
    surfaces: ToothSurface[];
    condition: string;
    confidence: number;
    notes: string;
  }>): Promise<string[]> {
    // TODO: Implement actual risk factor identification
    return ['High caries risk', 'Multiple restorations'];
  }
} 