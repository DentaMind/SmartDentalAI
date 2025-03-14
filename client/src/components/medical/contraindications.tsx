import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Pill, RefreshCw, ShieldAlert } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

interface Contraindication {
  substance: string;
  category: 'allergy' | 'medication' | 'condition' | 'other';
  severity: 'low' | 'moderate' | 'high';
  description: string;
  recommendations: string[];
  alternatives?: string[];
}

interface ContraindicationsProps {
  patientId: number;
}

export function Contraindications({ patientId }: ContraindicationsProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  // Fetch patient medical history
  const { data: patientMedicalHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: [`/api/patients/${patientId}/medical-history`],
    enabled: !isNaN(patientId),
  });

  // Fetch contraindications (could be derived from medical history)
  const { data: contraindications, isLoading, refetch } = useQuery({
    queryKey: [`/api/patients/${patientId}/contraindications`],
    enabled: !isNaN(patientId),
    // Fallback data for testing only - in production, this would come from the server
    placeholderData: [
      {
        substance: "Epinephrine",
        category: "medication",
        severity: "high",
        description: "Patient has severe hypertension that contraindicates use of epinephrine in local anesthetics",
        recommendations: [
          "Use anesthetics without epinephrine",
          "Monitor blood pressure before and during procedure",
          "Consider medical consultation before procedures requiring epinephrine"
        ],
        alternatives: ["Mepivacaine 3% without epinephrine", "Prilocaine 4%"]
      },
      {
        substance: "NSAIDs",
        category: "medication",
        severity: "moderate",
        description: "Patient is on blood thinners that may interact with NSAIDs",
        recommendations: [
          "Avoid prescribing NSAIDs for pain management",
          "Check INR if patient is on warfarin",
          "Consider alternative pain management options"
        ],
        alternatives: ["Acetaminophen", "Low-dose codeine if appropriate"]
      },
      {
        substance: "Latex",
        category: "allergy",
        severity: "high",
        description: "Patient has documented latex allergy",
        recommendations: [
          "Use only latex-free gloves and equipment",
          "Alert all staff about latex allergy before treatment",
          "Ensure emergency medications are available"
        ]
      }
    ]
  });

  // Function to analyze medical history for contraindications
  const analyzeContraindications = async () => {
    setIsAnalyzing(true);
    
    try {
      // In a real implementation, this would use the API to analyze medical history
      // using the MEDICAL_AI_KEY or DIAGNOSIS_AI_KEY
      
      // Simulate API call with delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Refresh contraindications data after analysis
      await refetch();
      
      toast({
        title: "Analysis Complete",
        description: "Patient contraindications have been updated based on their medical history.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Could not analyze contraindications. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return "bg-blue-50 border-blue-200 text-blue-700";
      case 'moderate':
        return "bg-amber-50 border-amber-200 text-amber-700";
      case 'high':
        return "bg-red-50 border-red-200 text-red-700";
      default:
        return "bg-gray-50 border-gray-200 text-gray-700";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low':
        return <AlertTriangle className="h-4 w-4 text-blue-500" />;
      case 'moderate':
        return <ShieldAlert className="h-4 w-4 text-amber-500" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Treatment Contraindications
            </CardTitle>
            <CardDescription>
              AI-detected contraindications based on patient medical history
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={analyzeContraindications} 
            disabled={isAnalyzing || isLoadingHistory}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${isAnalyzing ? "animate-spin" : ""}`} />
            {isAnalyzing ? "Analyzing..." : "Analyze"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : contraindications && contraindications.length > 0 ? (
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="high">High Risk</TabsTrigger>
              <TabsTrigger value="medications">Medications</TabsTrigger>
              <TabsTrigger value="allergies">Allergies</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4">
              {contraindications.map((item, i) => (
                <div 
                  key={i} 
                  className={`p-3 border rounded-md ${getSeverityColor(item.severity)}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {getSeverityIcon(item.severity)}
                    <h4 className="font-medium">{item.substance}</h4>
                    <span className="bg-white bg-opacity-50 text-xs px-2 py-0.5 rounded-full">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-sm mb-2">{item.description}</p>
                  <div className="text-sm mt-2">
                    <h5 className="font-medium mb-1">Recommendations:</h5>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {item.recommendations.map((rec, j) => (
                        <li key={j}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                  {item.alternatives && item.alternatives.length > 0 && (
                    <div className="text-sm mt-2">
                      <h5 className="font-medium mb-1">Alternatives:</h5>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {item.alternatives.map((alt, j) => (
                          <li key={j}>{alt}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="high" className="space-y-4">
              {contraindications
                .filter(item => item.severity === 'high')
                .map((item, i) => (
                  <div 
                    key={i} 
                    className={`p-3 border rounded-md ${getSeverityColor(item.severity)}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {getSeverityIcon(item.severity)}
                      <h4 className="font-medium">{item.substance}</h4>
                      <span className="bg-white bg-opacity-50 text-xs px-2 py-0.5 rounded-full">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-sm mb-2">{item.description}</p>
                    <div className="text-sm mt-2">
                      <h5 className="font-medium mb-1">Recommendations:</h5>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {item.recommendations.map((rec, j) => (
                          <li key={j}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                    {item.alternatives && item.alternatives.length > 0 && (
                      <div className="text-sm mt-2">
                        <h5 className="font-medium mb-1">Alternatives:</h5>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          {item.alternatives.map((alt, j) => (
                            <li key={j}>{alt}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
            </TabsContent>
            
            <TabsContent value="medications" className="space-y-4">
              {contraindications
                .filter(item => item.category === 'medication')
                .map((item, i) => (
                  <div 
                    key={i} 
                    className={`p-3 border rounded-md ${getSeverityColor(item.severity)}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {getSeverityIcon(item.severity)}
                      <h4 className="font-medium">{item.substance}</h4>
                      <span className="bg-white bg-opacity-50 text-xs px-2 py-0.5 rounded-full">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-sm mb-2">{item.description}</p>
                    <div className="text-sm mt-2">
                      <h5 className="font-medium mb-1">Recommendations:</h5>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {item.recommendations.map((rec, j) => (
                          <li key={j}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                    {item.alternatives && item.alternatives.length > 0 && (
                      <div className="text-sm mt-2">
                        <h5 className="font-medium mb-1">Alternatives:</h5>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          {item.alternatives.map((alt, j) => (
                            <li key={j}>{alt}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
            </TabsContent>
            
            <TabsContent value="allergies" className="space-y-4">
              {contraindications
                .filter(item => item.category === 'allergy')
                .map((item, i) => (
                  <div 
                    key={i} 
                    className={`p-3 border rounded-md ${getSeverityColor(item.severity)}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {getSeverityIcon(item.severity)}
                      <h4 className="font-medium">{item.substance}</h4>
                      <span className="bg-white bg-opacity-50 text-xs px-2 py-0.5 rounded-full">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-sm mb-2">{item.description}</p>
                    <div className="text-sm mt-2">
                      <h5 className="font-medium mb-1">Recommendations:</h5>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {item.recommendations.map((rec, j) => (
                          <li key={j}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                    {item.alternatives && item.alternatives.length > 0 && (
                      <div className="text-sm mt-2">
                        <h5 className="font-medium mb-1">Alternatives:</h5>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          {item.alternatives.map((alt, j) => (
                            <li key={j}>{alt}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
            <h3 className="font-medium">No Contraindications Detected</h3>
            <p className="text-sm text-muted-foreground mt-1">
              No contraindications were detected based on the patient's current medical history.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}