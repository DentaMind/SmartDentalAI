import React, { useState } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Loader2, AlertTriangle, CheckCircle, Lightbulb, Eye, Zap } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { apiRequest } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/skeleton';
import { XRaySlot } from './fmx-layout';

interface XRayAIFindings {
  id: string;
  detections: Array<{
    type: 'caries' | 'periapical' | 'bone_loss' | 'restoration' | 'implant' | 'root_canal' | 'anomaly' | 'other';
    description: string;
    location: string; // Tooth number or area
    confidence: number;
    severity?: 'mild' | 'moderate' | 'severe';
    coordinates?: { x: number; y: number; width: number; height: number }; // For highlighting
  }>;
  diagnosticImpression: string;
  recommendedActions: string[];
  comparisonWithPrevious?: {
    changes: string[];
    progression: 'improved' | 'stable' | 'worsened';
  };
  date: string;
}

interface XRayAIAnalyzerProps {
  xray: XRaySlot;
  patientId: string | number;
  analysisCompleted?: (xrayId: string, findings: XRayAIFindings) => void;
  previousXRays?: XRaySlot[];
  onClose: () => void;
}

const XRayAIAnalyzer: React.FC<XRayAIAnalyzerProps> = ({
  xray,
  patientId,
  analysisCompleted,
  previousXRays,
  onClose
}) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [findings, setFindings] = useState<XRayAIFindings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [highlightDetections, setHighlightDetections] = useState(false);

  // Start the analysis process
  const startAnalysis = async () => {
    setAnalyzing(true);
    setError(null);
    
    try {
      // Find previous x-ray of same region if available for comparison
      const previousXRay = previousXRays?.find(px => 
        px.position === xray.position && 
        new Date(px.date!) < new Date(xray.date || '')
      );
      
      // Call the DICOM analysis API endpoint
      const response = await apiRequest<{
        success: boolean;
        message: string;
        analysis: any;
        xray: any;
      }>({
        url: `/api/dicom/analyze/${xray.id}`,
        method: 'POST',
        body: {
          patientId,
          previousXRayId: previousXRay?.id
        }
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Analysis failed');
      }
      
      // Process the AI analysis results into our findings format
      const analysisResult = processAnalysisResults(response.analysis, xray, previousXRay);
      
      setFindings(analysisResult);
      
      if (analysisCompleted) {
        analysisCompleted(xray.id, analysisResult);
      }
    } catch (err) {
      console.error('Error during X-ray analysis:', err);
      setError('Failed to analyze the X-ray. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Process the AI analysis results from the API into our findings format
  const processAnalysisResults = (
    analysisData: any,
    xray: XRaySlot,
    previousXRay?: XRaySlot
  ): XRayAIFindings => {
    // Start with an empty findings object
    const findings: XRayAIFindings = {
      id: `analysis-${xray.id}`,
      detections: [],
      diagnosticImpression: "",
      recommendedActions: [],
      date: new Date().toISOString()
    };
    
    try {
      if (analysisData) {
        // Parse the AI analysis data which might be stored as a JSON string
        const analysis = typeof analysisData.aiAnalysis === 'string' 
          ? JSON.parse(analysisData.aiAnalysis) 
          : analysisData.aiAnalysis;
          
        // Extract the diagnostic impression
        findings.diagnosticImpression = analysis.analysis || "";
        
        // Extract findings and convert to our detection format
        if (analysis.findings) {
          findings.detections = analysis.findings.map((finding: any) => {
            return {
              type: categorizeDetectionType(finding.type || finding.category || "other"),
              description: finding.description || finding.details || "",
              location: finding.location || finding.area || "",
              confidence: finding.confidence || 0.7,
              severity: finding.severity || "moderate",
              coordinates: finding.coordinates || undefined
            };
          });
        }
        
        // Extract recommendations
        if (analysis.recommendations) {
          findings.recommendedActions = Array.isArray(analysis.recommendations) 
            ? analysis.recommendations 
            : [analysis.recommendations];
        }
        
        // Add comparison data if available
        if (previousXRay && analysis.comparison) {
          findings.comparisonWithPrevious = {
            changes: Array.isArray(analysis.comparison.changes) 
              ? analysis.comparison.changes 
              : [analysis.comparison.changes],
            progression: analysis.comparison.progression || "stable"
          };
        }
      }
    } catch (error) {
      console.error('Error processing analysis results:', error);
    }
    
    return findings;
  };
  
  // Helper to categorize detection types from the AI response
  const categorizeDetectionType = (type: string): 'caries' | 'periapical' | 'bone_loss' | 'restoration' | 'implant' | 'root_canal' | 'anomaly' | 'other' => {
    const typeMap: Record<string, any> = {
      caries: 'caries',
      cavity: 'caries',
      decay: 'caries',
      periapical: 'periapical',
      'periapical lesion': 'periapical',
      'bone loss': 'bone_loss',
      'bone_loss': 'bone_loss',
      'boneloss': 'bone_loss',
      restoration: 'restoration',
      filling: 'restoration',
      crown: 'restoration',
      implant: 'implant',
      'root canal': 'root_canal',
      'rootcanal': 'root_canal',
      anomaly: 'anomaly'
    };
    
    // Try to match the type to our known categories
    const normalizedType = type.toLowerCase().trim();
    return typeMap[normalizedType] || 'other';
  };

  // Get appropriate color based on severity
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'mild': return 'text-yellow-500';
      case 'moderate': return 'text-orange-500';
      case 'severe': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  // Render a loading state during analysis
  const renderAnalyzing = () => (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Brain className="h-8 w-8 text-primary" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="animate-spin h-12 w-12" viewBox="0 0 24 24">
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="2" 
              fill="none"
            ></circle>
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      </div>
      <div className="text-center">
        <h3 className="text-lg font-medium">Analyzing X-ray</h3>
        <p className="text-sm text-muted-foreground">
          Our AI is analyzing the X-ray for pathologies, restorations, and other findings...
        </p>
      </div>
      
      <div className="space-y-2 w-full max-w-md">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );

  // Render error state
  const renderError = () => (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-medium">Analysis Failed</h3>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
      <Button variant="outline" onClick={startAnalysis}>
        Try Again
      </Button>
    </div>
  );

  // Render analysis results
  const renderResults = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Badge className="bg-primary/90 hover:bg-primary flex items-center gap-1">
            <Brain className="h-3 w-3" />
            AI Analysis
          </Badge>
          <span className="text-sm text-muted-foreground">
            {new Date(findings!.date).toLocaleString()}
          </span>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className={highlightDetections ? 'border-primary text-primary' : ''}
          onClick={() => setHighlightDetections(!highlightDetections)}
        >
          <Eye className="h-4 w-4 mr-1" />
          {highlightDetections ? 'Hide Highlights' : 'Show Highlights'}
        </Button>
      </div>
      
      <div className="relative border bg-black rounded-md overflow-hidden">
        <img 
          src={xray.imageUrl} 
          alt={`${xray.position} X-ray`} 
          className="w-full h-auto max-h-[400px] object-contain"
        />
        
        {/* Image annotations when highlighting is enabled */}
        {highlightDetections && findings?.detections.map((detection, index) => (
          // This would normally use the coordinates from the API
          // For now, we're just placing example boxes
          <div
            key={index}
            className={`absolute border-2 ${
              detection.type === 'caries' ? 'border-red-500' :
              detection.type === 'periapical' ? 'border-yellow-500' :
              detection.type === 'bone_loss' ? 'border-orange-500' :
              'border-blue-500'
            }`}
            style={{
              left: `${20 + (index * 15)}%`,
              top: `${30 + (index * 10)}%`,
              width: '20%',
              height: '20%',
              pointerEvents: 'none'
            }}
          />
        ))}
      </div>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Diagnostic Impression
          </h3>
          <p className="text-muted-foreground">{findings!.diagnosticImpression}</p>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-2">Detected Findings</h3>
          {findings!.detections.length > 0 ? (
            <div className="space-y-2">
              {findings!.detections.map((detection, index) => (
                <div 
                  key={index} 
                  className="border rounded-md p-3 flex items-start space-x-3"
                >
                  <div className={`mt-0.5 ${
                    detection.type === 'caries' ? 'text-red-500' :
                    detection.type === 'periapical' ? 'text-yellow-500' :
                    detection.type === 'bone_loss' ? 'text-orange-500' :
                    'text-blue-500'
                  }`}>
                    {detection.type === 'caries' && <div className="h-4 w-4 rounded-full bg-current" />}
                    {detection.type === 'periapical' && <div className="h-4 w-4 rounded-full bg-current" />}
                    {detection.type === 'bone_loss' && <div className="h-4 w-4 rounded-full bg-current" />}
                    {detection.type === 'restoration' && <div className="h-4 w-4 rounded-full bg-current" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div className="font-medium">
                        {detection.type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`${getSeverityColor(detection.severity || '')}`}
                      >
                        {detection.severity || 'Unknown'} 
                        <span className="ml-1 opacity-60">
                          ({Math.round(detection.confidence * 100)}%)
                        </span>
                      </Badge>
                    </div>
                    <div className="text-sm">{detection.description}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Location: {detection.location}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No significant findings detected.</p>
          )}
        </div>
        
        {/* Comparison with previous X-rays if available */}
        {findings!.comparisonWithPrevious && (
          <div>
            <h3 className="text-lg font-medium mb-2">Comparison with Previous X-rays</h3>
            <div className="border rounded-md p-3 bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className={`
                  ${findings!.comparisonWithPrevious.progression === 'improved' && 'text-green-500 border-green-200'} 
                  ${findings!.comparisonWithPrevious.progression === 'stable' && 'text-blue-500 border-blue-200'}
                  ${findings!.comparisonWithPrevious.progression === 'worsened' && 'text-red-500 border-red-200'}
                `}>
                  {findings!.comparisonWithPrevious.progression.toUpperCase()}
                </Badge>
              </div>
              <ul className="space-y-1">
                {findings!.comparisonWithPrevious.changes.map((change, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        
        {/* Recommended actions */}
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-primary" />
            Recommended Actions
          </h3>
          <div className="border rounded-md p-3">
            {findings!.recommendedActions.length > 0 ? (
              <ul className="space-y-1">
                {findings!.recommendedActions.map((action, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No specific actions recommended at this time.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge variant="outline" className="font-normal">
              {xray.position}
            </Badge>
            X-ray Analysis
          </DialogTitle>
          <DialogDescription>
            AI-powered analysis for dental pathologies, restorations, and comparisons with previous X-rays.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {analyzing && renderAnalyzing()}
          {error && renderError()}
          {!analyzing && !error && findings && renderResults()}
          {!analyzing && !error && !findings && (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium">AI Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Use AI to analyze this X-ray for dental pathologies, restorations, and other significant findings.
                </p>
              </div>
              <Button onClick={startAnalysis}>
                <Brain className="h-4 w-4 mr-2" />
                Start Analysis
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {findings && (
            <Button variant="default">
              Save to Patient Record
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default XRayAIAnalyzer;