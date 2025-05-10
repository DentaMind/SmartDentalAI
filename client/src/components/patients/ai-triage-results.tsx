import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface TriageResult {
  id: number;
  formId: number;
  patientId: number;
  analysis: {
    riskFactors: string[];
    potentialConditions: string[];
    urgency: 'low' | 'medium' | 'high';
    symptoms: string[];
  };
  outcome: 'improved' | 'worsened' | 'stable';
  nextStep: string;
  xrayFindings: string | null;
  createdAt: string;
}

const urgencyColors = {
  low: 'bg-green-500',
  medium: 'bg-yellow-500',
  high: 'bg-red-500',
};

const outcomeColors = {
  improved: 'bg-green-500',
  worsened: 'bg-red-500',
  stable: 'bg-blue-500',
};

export function AITriageResults() {
  const { formId } = useParams<{ formId: string }>();
  const [result, setResult] = useState<TriageResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTriageResults = async () => {
      try {
        const response = await fetch(`/api/ai-triage/${formId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch triage results');
        }
        const data = await response.json();
        setResult(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTriageResults();
  }, [formId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!result) {
    return (
      <Alert>
        <AlertTitle>No Results</AlertTitle>
        <AlertDescription>No triage results found for this form.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>AI Triage Analysis</span>
            <div className="flex gap-2">
              <Badge className={urgencyColors[result.analysis.urgency]}>
                {result.analysis.urgency.toUpperCase()} URGENCY
              </Badge>
              <Badge className={outcomeColors[result.outcome]}>
                {result.outcome.toUpperCase()}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Risk Factors</h3>
            <div className="flex flex-wrap gap-2">
              {result.analysis.riskFactors.map((factor, index) => (
                <Badge key={index} variant="secondary">
                  {factor}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Potential Conditions</h3>
            <div className="flex flex-wrap gap-2">
              {result.analysis.potentialConditions.map((condition, index) => (
                <Badge key={index} variant="secondary">
                  {condition}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Symptoms</h3>
            <div className="flex flex-wrap gap-2">
              {result.analysis.symptoms.map((symptom, index) => (
                <Badge key={index} variant="secondary">
                  {symptom}
                </Badge>
              ))}
            </div>
          </div>

          {result.xrayFindings && (
            <div>
              <h3 className="font-semibold mb-2">X-Ray Findings</h3>
              <p className="text-sm text-muted-foreground">{result.xrayFindings}</p>
            </div>
          )}

          <div>
            <h3 className="font-semibold mb-2">Next Steps</h3>
            <p className="text-sm text-muted-foreground">{result.nextStep}</p>
          </div>

          <div className="text-sm text-muted-foreground">
            Analysis performed on {new Date(result.createdAt).toLocaleString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 