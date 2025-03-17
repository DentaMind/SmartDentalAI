
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { SymptomPrediction } from '@shared/schema';
import { FileText, Download } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

interface ReportGeneratorProps {
  prediction: SymptomPrediction;
  patientId?: string;
}

export function ReportGenerator({ prediction, patientId }: ReportGeneratorProps) {
  const [includeImages, setIncludeImages] = useState(true);
  const [includeDomainInsights, setIncludeDomainInsights] = useState(true);
  const [includeRecommendations, setIncludeRecommendations] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const generateReport = async () => {
    setIsGenerating(true);
    setProgress(10);
    
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prediction,
          options: {
            includeImages,
            includeDomainInsights,
            includeRecommendations,
            patientId,
          },
        }),
      });
      
      setProgress(50);
      
      if (!response.ok) {
        throw new Error('Failed to generate report');
      }
      
      setProgress(80);
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // Create a link and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `DentaMind-Report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      setProgress(100);
      toast({
        title: "Report Generated",
        description: "Your diagnostic report has been generated and downloaded.",
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate the report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      // Reset progress after a delay
      setTimeout(() => setProgress(0), 2000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Diagnostic Report
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="includeImages" 
                checked={includeImages} 
                onCheckedChange={() => setIncludeImages(!includeImages)} 
              />
              <Label htmlFor="includeImages">Include Images</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="includeDomainInsights" 
                checked={includeDomainInsights} 
                onCheckedChange={() => setIncludeDomainInsights(!includeDomainInsights)} 
              />
              <Label htmlFor="includeDomainInsights">Include Domain Insights</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="includeRecommendations" 
                checked={includeRecommendations} 
                onCheckedChange={() => setIncludeRecommendations(!includeRecommendations)} 
              />
              <Label htmlFor="includeRecommendations">Include Recommendations</Label>
            </div>
          </div>
          
          {isGenerating && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Generating report...</p>
              <Progress value={progress} className="h-2" />
            </div>
          )}
          
          <Button 
            onClick={generateReport} 
            disabled={isGenerating}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
