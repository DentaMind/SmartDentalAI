import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Cpu, Timer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';

interface DiagnosticPanelProps {
  toothNumber: string;
  findings: any[];
  loading?: boolean;
  onApprove?: (findingId: string) => void;
  onReject?: (findingId: string) => void;
}

type FindingSeverity = 'low' | 'medium' | 'high' | 'critical';

const getColorForSeverity = (severity: FindingSeverity) => {
  switch (severity) {
    case 'low':
      return 'text-green-600';
    case 'medium':
      return 'text-yellow-600'; 
    case 'high':
      return 'text-orange-600';
    case 'critical':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.9) return 'bg-green-500';
  if (confidence >= 0.7) return 'bg-yellow-500';
  if (confidence >= 0.5) return 'bg-orange-500';
  return 'bg-red-500';
};

export const DiagnosticPanel: React.FC<DiagnosticPanelProps> = ({
  toothNumber,
  findings,
  loading = false,
  onApprove,
  onReject
}) => {
  if (loading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-6">
          <Timer className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Analyzing tooth #{toothNumber}...</p>
        </CardContent>
      </Card>
    );
  }

  if (!findings || findings.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-6 text-muted-foreground">
          <CheckCircle2 className="h-8 w-8 mb-2 text-green-500" />
          <p>No findings detected for tooth #{toothNumber}</p>
          <p className="text-xs mt-2">AI analysis indicates this tooth appears normal.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Cpu className="mr-2 h-4 w-4 text-primary" />
          AI Diagnosis for Tooth #{toothNumber}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="findings">
          <TabsList className="mb-2">
            <TabsTrigger value="findings">Findings</TabsTrigger>
            <TabsTrigger value="suggestions">Treatment Suggestions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="findings">
            <div className="space-y-3">
              {findings.map((finding, index) => (
                <div key={index} className="border rounded-md p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      {finding.severity === 'high' || finding.severity === 'critical' ? (
                        <AlertTriangle className={`mr-2 h-4 w-4 ${getColorForSeverity(finding.severity)}`} />
                      ) : (
                        <AlertCircle className={`mr-2 h-4 w-4 ${getColorForSeverity(finding.severity)}`} />
                      )}
                      <span className="font-medium">{finding.type}</span>
                    </div>
                    <Badge variant={
                      finding.severity === 'low' ? 'outline' :
                      finding.severity === 'medium' ? 'secondary' :
                      finding.severity === 'high' ? 'destructive' : 'outline'
                    }>
                      {finding.severity}
                    </Badge>
                  </div>
                  
                  <div className="text-sm mb-2">
                    {finding.description || 'No detailed description available.'}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <span>AI Confidence:</span>
                    <Progress 
                      value={finding.confidence * 100} 
                      className={`h-2 ${getConfidenceColor(finding.confidence)}`}
                    />
                    <span className="font-medium">{Math.round(finding.confidence * 100)}%</span>
                  </div>
                  
                  {(onApprove || onReject) && (
                    <div className="flex gap-2 mt-3">
                      {onApprove && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => onApprove(finding.id)}
                        >
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Confirm
                        </Button>
                      )}
                      {onReject && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => onReject(finding.id)}
                        >
                          <AlertCircle className="mr-1 h-3 w-3" />
                          Dismiss
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="suggestions">
            <div className="space-y-3">
              {findings.some(f => f.treatmentSuggestions?.length) ? (
                findings.flatMap((finding, idx) => 
                  finding.treatmentSuggestions?.map((suggestion: any, sIdx: number) => (
                    <div key={`${idx}-${sIdx}`} className="border rounded-md p-3">
                      <div className="font-medium mb-1">{suggestion.procedure}</div>
                      <div className="text-sm text-muted-foreground mb-2">{suggestion.description}</div>
                      
                      {suggestion.alternatives && (
                        <>
                          <Separator className="my-2" />
                          <div className="text-xs text-muted-foreground mt-1">Alternative treatments:</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {suggestion.alternatives.map((alt: string, aIdx: number) => (
                              <Badge key={aIdx} variant="outline" className="text-xs">{alt}</Badge>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )) || []
                )
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No treatment suggestions available.</p>
                  <p className="text-xs mt-1">Treatment recommendations will appear when clinically indicated.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}; 