import React, { useState } from 'react';
import { AIFeedbackTrainer } from '../components/ai/AIFeedbackTrainer';
import { AIModelDashboard } from '../components/ai/AIModelDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { useToast } from '../hooks/use-toast';
import { Brain, ChevronDown, ChevronUp, BarChart4, Zap, Book } from 'lucide-react';

export default function AITrainingPage() {
  const { toast } = useToast();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  // Mock patient for demo
  const demoPatientId = 'demo-patient-123';
  
  const toggleSection = (sectionId: string) => {
    if (expandedSection === sectionId) {
      setExpandedSection(null);
    } else {
      setExpandedSection(sectionId);
    }
  };
  
  const handleFeedbackComplete = (count: number) => {
    toast({
      title: 'Feedback Complete',
      description: `You've provided feedback on ${count} AI findings. Thank you for helping improve our models!`,
    });
  };
  
  return (
    <div className="container py-6 max-w-7xl">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Training & Diagnostics</h1>
          <p className="text-muted-foreground mt-2">
            Improve DentaMind's AI through feedback and training
          </p>
        </div>
        
        <AIModelDashboard isAdmin={true} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <Zap className="mr-2 h-5 w-5 text-primary" />
                  AI Training Guide
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => toggleSection('guide')}
                >
                  {expandedSection === 'guide' ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <CardDescription>
                How the feedback system improves model performance
              </CardDescription>
            </CardHeader>
            
            {expandedSection === 'guide' && (
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">How AI Training Works</h3>
                    <p className="text-sm text-muted-foreground">
                      DentaMind's AI continuously improves through clinician feedback. Here's how:
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                      <li>Provide feedback on AI findings (correct or incorrect)</li>
                      <li>Specify the type of error when AI is incorrect</li>
                      <li>The system aggregates feedback across all users</li>
                      <li>When enough feedback is collected, models are retrained</li>
                      <li>Your clinic's specific feedback improves your localized model</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Timeline for Improvements</h3>
                    <p className="text-sm text-muted-foreground">
                      Model retraining occurs:
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                      <li>Every 100+ new pieces of feedback</li>
                      <li>When 10+ high-priority corrections are provided</li>
                      <li>Monthly for routine updates</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Improving Your Results</h3>
                    <p className="text-sm text-muted-foreground">
                      The best practices for getting more accurate results:
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                      <li>Provide detailed descriptions when correcting errors</li>
                      <li>Mark critical issues as "high priority"</li>
                      <li>Upload high-quality images for better analysis</li>
                      <li>Review diagnostic findings regularly</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
          
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <Book className="mr-2 h-5 w-5 text-primary" />
                  AI Knowledge Base
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => toggleSection('knowledge')}
                >
                  {expandedSection === 'knowledge' ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <CardDescription>
                Educational resources for AI diagnostics
              </CardDescription>
            </CardHeader>
            
            {expandedSection === 'knowledge' && (
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Understanding AI Diagnoses</h3>
                    <p className="text-sm text-muted-foreground">
                      AI diagnoses are based on pattern recognition from thousands of dental cases.
                      The system identifies features similar to those seen in previous diagnoses.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">How Confidence Scores Work</h3>
                    <p className="text-sm text-muted-foreground">
                      Confidence scores (0-100%) indicate how certain the AI is about a finding:
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                      <li>90%+ - Very high confidence</li>
                      <li>70-89% - High confidence</li>
                      <li>50-69% - Moderate confidence</li>
                      <li>&lt;50% - Low confidence (requires careful review)</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Common Error Types</h3>
                    <p className="text-sm text-muted-foreground">
                      Understanding common AI error patterns:
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                      <li><span className="font-medium">False positives</span>: AI detects a condition that isn't present</li>
                      <li><span className="font-medium">False negatives</span>: AI misses an existing condition</li>
                      <li><span className="font-medium">Misclassification</span>: AI identifies the wrong condition</li>
                      <li><span className="font-medium">Location errors</span>: AI identifies the correct condition but on the wrong tooth/surface</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
        
        <Separator />
        
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-6">
            AI Feedback Trainer
          </h2>
          
          <Tabs defaultValue="demo">
            <TabsList className="mb-4">
              <TabsTrigger value="demo">Demo Patient</TabsTrigger>
              <TabsTrigger value="current">Current Patient</TabsTrigger>
            </TabsList>
            
            <TabsContent value="demo">
              <AIFeedbackTrainer
                patientId={demoPatientId}
                onFeedbackComplete={handleFeedbackComplete}
              />
            </TabsContent>
            
            <TabsContent value="current">
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <p className="text-muted-foreground">
                    Please select a patient from the patient list to provide AI feedback.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 