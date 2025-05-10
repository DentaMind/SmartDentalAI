import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

const outcomeColors = {
  improved: 'bg-green-500',
  worsened: 'bg-red-500',
  stable: 'bg-blue-500',
};

interface AiTriageTimelineProps {
  patientId: number;
}

export function AiTriageTimeline({ patientId }: AiTriageTimelineProps) {
  const { data: results, isLoading, error } = useQuery<TriageResult[]>({
    queryKey: ['aiTriage', 'patient', patientId],
    queryFn: async () => {
      const res = await fetch(`/api/ai-triage/patient/${patientId}`);
      if (!res.ok) throw new Error('Failed to fetch triage results');
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-1/4" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load triage history. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (!results || results.length === 0) {
    return (
      <Alert>
        <AlertTitle>No History</AlertTitle>
        <AlertDescription>
          No triage history available for this patient.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {results.map((result) => (
        <Card key={result.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {format(new Date(result.createdAt), 'MMM d, yyyy h:mm a')}
              </CardTitle>
              <Badge className={outcomeColors[result.outcome]}>
                {result.outcome.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <h3 className="font-semibold mb-2">Next Step</h3>
              <p className="text-sm text-muted-foreground">{result.nextStep}</p>
            </div>

            {result.xrayFindings && (
              <div>
                <h3 className="font-semibold mb-2">X-Ray Findings</h3>
                <p className="text-sm text-muted-foreground">
                  {result.xrayFindings}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 