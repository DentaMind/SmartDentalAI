import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertCircle, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  FileText, 
  PieChart,
  Stethoscope,
  User,
  X, 
  ChevronRight,
  AlertTriangle
} from "lucide-react";
// Use a custom tooth icon since lucide-react doesn't have one built-in
const ToothIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5.5c1.5-2 3-3 6-3s4.5 1 5 2c.67 1.3 1 4 1 7 0 8-2 10-4 10-1.5 0-2-.5-3-2-1 1.5-1.5 2-3 2s-2-.5-3-2c-1 1.5-1.5 2-3 2-2 0-4-2-4-10 0-3 .33-5.7 1-7 .5-1 2-2 5-2s4.5 1 6 3z" />
  </svg>
);

interface AIHubPanelProps {
  patientId: string;
  onScheduleAppointment?: (reason: string) => void;
}

interface AIRiskAssessment {
  perioRisk: {
    level: "low" | "moderate" | "high";
    factors: string[];
    recommendations: string[];
  };
  cariesRisk: {
    level: "low" | "moderate" | "high";
    factors: string[];
    recommendations: string[];
  };
  systemicRisk: {
    level: "low" | "moderate" | "high";
    factors: string[];
    recommendations: string[];
  };
}

interface AITreatmentInsight {
  missedTreatments: Array<{
    id: number;
    treatment: string;
    recommendedDate: string;
    urgency: "low" | "medium" | "high";
    financialImpact: number;
    insuranceCoverage: number;
  }>;
  treatmentSequence: string[];
  insuranceOptimization: {
    remainingBenefits: number;
    expiringBenefits: string;
    recommendations: string[];
  };
  schedulingRecommendations: {
    nextAppointment: string;
    followUpNeeded: boolean;
    recommendedTimeFrame: string;
    reasons: string[];
  };
}

interface AIFinancialInsight {
  estimatedTotal: number;
  insuranceCoverage: number;
  patientResponsibility: number;
  paymentOptions: string[];
  financingAvailable: boolean;
  insuranceOptimization: string[];
}

export default function AIHubPanel({ patientId, onScheduleAppointment }: AIHubPanelProps) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("risks");
  const [riskAssessment, setRiskAssessment] = useState<AIRiskAssessment | null>(null);
  const [treatmentInsights, setTreatmentInsights] = useState<AITreatmentInsight | null>(null);
  const [financialInsights, setFinancialInsights] = useState<AIFinancialInsight | null>(null);
  const [doctorFeedback, setDoctorFeedback] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (patientId) {
      loadAIHubData();
    }
  }, [patientId]);

  const loadAIHubData = async () => {
    setLoading(true);
    try {
      // Fetch all AI insights in parallel
      const [riskRes, treatmentRes, financialRes] = await Promise.all([
        axios.get(`/api/aihub/${patientId}/risk-assessment`),
        axios.get(`/api/aihub/${patientId}/treatment-insights`),
        axios.get(`/api/aihub/${patientId}/financial-insights`)
      ]);
      
      setRiskAssessment(riskRes.data);
      setTreatmentInsights(treatmentRes.data);
      setFinancialInsights(financialRes.data);
      
      // Load any previous doctor feedback
      const feedbackRes = await axios.get(`/api/aihub/${patientId}/doctor-feedback`);
      setDoctorFeedback(feedbackRes.data || {});
    } catch (error) {
      console.error("Error loading AI Hub data:", error);
      toast({
        title: "Error",
        description: "Failed to load AI insights. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorFeedback = async (insightId: string, approved: boolean) => {
    try {
      await axios.post(`/api/aihub/${patientId}/doctor-feedback`, {
        insightId,
        approved
      });
      
      setDoctorFeedback(prev => ({
        ...prev,
        [insightId]: approved
      }));
      
      toast({
        title: approved ? "Approved" : "Declined",
        description: `AI insight has been ${approved ? "approved" : "declined"} by provider.`,
        variant: approved ? "default" : "destructive"
      });
    } catch (error) {
      console.error("Error saving doctor feedback:", error);
      toast({
        title: "Error",
        description: "Failed to save feedback. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleScheduleAppointment = (reason: string) => {
    if (onScheduleAppointment) {
      onScheduleAppointment(reason);
    } else {
      toast({
        title: "Schedule Appointment",
        description: `Opening scheduler for: ${reason}`,
      });
    }
  };

  const handleSendReminder = async (treatmentId: number) => {
    try {
      await axios.post(`/api/aihub/${patientId}/send-reminder`, {
        treatmentId
      });
      
      toast({
        title: "Reminder Sent",
        description: "Patient reminder has been queued for delivery.",
      });
    } catch (error) {
      console.error("Error sending reminder:", error);
      toast({
        title: "Error",
        description: "Failed to send reminder. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "high": return "bg-red-100 text-red-800 border-red-200";
      case "moderate": return "bg-amber-100 text-amber-800 border-amber-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high": return "text-red-600";
      case "medium": return "text-amber-600";
      case "low": return "text-blue-600";
      default: return "text-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <LoadingSpinner className="h-8 w-8 text-primary mr-2" />
        <span>Loading AI insights...</span>
      </div>
    );
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">
          AI Hub - Patient Insights
        </CardTitle>
        <CardDescription>
          AI-powered analysis and recommendations for optimal care
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="risks" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="risks">Risk Assessment</TabsTrigger>
            <TabsTrigger value="treatments">Treatment Tracking</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
          </TabsList>

          {/* Risk Assessment Tab */}
          <TabsContent value="risks" className="space-y-4">
            {!riskAssessment ? (
              <div className="text-center text-muted-foreground py-8">
                No risk assessment data available
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Periodontal Risk */}
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-sm font-medium flex items-center gap-1">
                          <ToothIcon />
                          Periodontal Risk
                        </CardTitle>
                        <Badge className={getRiskColor(riskAssessment.perioRisk.level)}>
                          {riskAssessment.perioRisk.level.toUpperCase()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="text-xs">
                      <ul className="list-disc list-inside space-y-1">
                        {riskAssessment.perioRisk.factors.map((factor, idx) => (
                          <li key={idx}>{factor}</li>
                        ))}
                      </ul>
                      
                      {riskAssessment.perioRisk.recommendations.length > 0 && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="font-medium">Recommendations:</p>
                          <ul className="list-disc list-inside">
                            {riskAssessment.perioRisk.recommendations.map((rec, idx) => (
                              <li key={idx}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="pt-0 flex justify-between">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs h-8"
                        onClick={() => handleScheduleAppointment("Periodontal follow-up")}
                      >
                        Schedule Follow-up
                      </Button>
                      <div className="flex space-x-1">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7"
                          onClick={() => handleDoctorFeedback("perioRisk", true)}
                        >
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7"
                          onClick={() => handleDoctorFeedback("perioRisk", false)}
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>

                  {/* Caries Risk */}
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-sm font-medium flex items-center gap-1">
                          <ToothIcon />
                          Caries Risk
                        </CardTitle>
                        <Badge className={getRiskColor(riskAssessment.cariesRisk.level)}>
                          {riskAssessment.cariesRisk.level.toUpperCase()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="text-xs">
                      <ul className="list-disc list-inside space-y-1">
                        {riskAssessment.cariesRisk.factors.map((factor, idx) => (
                          <li key={idx}>{factor}</li>
                        ))}
                      </ul>
                      
                      {riskAssessment.cariesRisk.recommendations.length > 0 && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="font-medium">Recommendations:</p>
                          <ul className="list-disc list-inside">
                            {riskAssessment.cariesRisk.recommendations.map((rec, idx) => (
                              <li key={idx}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="pt-0 flex justify-between">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs h-8"
                        onClick={() => handleScheduleAppointment("Caries prevention")}
                      >
                        Schedule Visit
                      </Button>
                      <div className="flex space-x-1">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7"
                          onClick={() => handleDoctorFeedback("cariesRisk", true)}
                        >
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7"
                          onClick={() => handleDoctorFeedback("cariesRisk", false)}
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>

                  {/* Systemic Risk */}
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-sm font-medium flex items-center gap-1">
                          <Stethoscope className="h-4 w-4" />
                          Systemic Risk
                        </CardTitle>
                        <Badge className={getRiskColor(riskAssessment.systemicRisk.level)}>
                          {riskAssessment.systemicRisk.level.toUpperCase()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="text-xs">
                      <ul className="list-disc list-inside space-y-1">
                        {riskAssessment.systemicRisk.factors.map((factor, idx) => (
                          <li key={idx}>{factor}</li>
                        ))}
                      </ul>
                      
                      {riskAssessment.systemicRisk.recommendations.length > 0 && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="font-medium">Recommendations:</p>
                          <ul className="list-disc list-inside">
                            {riskAssessment.systemicRisk.recommendations.map((rec, idx) => (
                              <li key={idx}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="pt-0 flex justify-between">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs h-8"
                        onClick={() => handleScheduleAppointment("Health assessment")}
                      >
                        Medical Consult
                      </Button>
                      <div className="flex space-x-1">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7"
                          onClick={() => handleDoctorFeedback("systemicRisk", true)}
                        >
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7"
                          onClick={() => handleDoctorFeedback("systemicRisk", false)}
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                </div>

                {/* Provider Feedback Status */}
                {Object.keys(doctorFeedback).length > 0 && (
                  <Card className="bg-muted/50">
                    <CardContent className="py-3">
                      <div className="text-sm">
                        <span className="font-medium">Provider Feedback: </span>
                        {Object.entries(doctorFeedback).map(([key, value], idx) => (
                          <Badge 
                            key={idx} 
                            variant="outline" 
                            className={`ml-1 ${value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                          >
                            {key}: {value ? 'Approved' : 'Declined'}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Treatment Tracking Tab */}
          <TabsContent value="treatments" className="space-y-4">
            {!treatmentInsights ? (
              <div className="text-center text-muted-foreground py-8">
                No treatment tracking data available
              </div>
            ) : (
              <>
                {/* Missed Treatments */}
                {treatmentInsights.missedTreatments.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium flex items-center gap-1">
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        Missed Treatments
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {treatmentInsights.missedTreatments.map((treatment, idx) => (
                          <div 
                            key={idx} 
                            className="flex justify-between items-start pb-2 border-b last:border-0 last:pb-0"
                          >
                            <div>
                              <div className="font-medium flex items-center gap-1">
                                <AlertTriangle className={`h-3.5 w-3.5 ${getUrgencyColor(treatment.urgency)}`} />
                                <span>{treatment.treatment}</span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                <span>Recommended: {treatment.recommendedDate}</span>
                                <span className="mx-1">•</span>
                                <span>
                                  <DollarSign className="h-3 w-3 inline" />
                                  ${treatment.financialImpact.toFixed(2)}
                                </span>
                                <span className="mx-1">•</span>
                                <span>Insurance: {treatment.insuranceCoverage}%</span>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-7 text-xs"
                                onClick={() => handleScheduleAppointment(treatment.treatment)}
                              >
                                Schedule
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 text-xs"
                                onClick={() => handleSendReminder(treatment.id)}
                              >
                                Remind
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Insurance Optimization */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      Insurance Optimization
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Remaining Benefits:</span>
                      <span className="font-semibold">${treatmentInsights.insuranceOptimization.remainingBenefits.toFixed(2)}</span>
                    </div>
                    
                    {treatmentInsights.insuranceOptimization.expiringBenefits && (
                      <div className="flex items-start gap-2 text-sm bg-amber-50 p-2 rounded border border-amber-200">
                        <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                        <div>
                          <div className="font-medium">Expiring Benefits</div>
                          <div className="text-xs">{treatmentInsights.insuranceOptimization.expiringBenefits}</div>
                        </div>
                      </div>
                    )}
                    
                    {treatmentInsights.insuranceOptimization.recommendations.length > 0 && (
                      <div className="mt-2 text-sm">
                        <div className="font-medium mb-1">Recommendations:</div>
                        <ul className="list-disc list-inside text-xs space-y-1">
                          {treatmentInsights.insuranceOptimization.recommendations.map((rec, idx) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Scheduling Recommendations */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      Scheduling Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {treatmentInsights.schedulingRecommendations.followUpNeeded ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Recommended follow-up:</span>
                          <span className="font-medium">{treatmentInsights.schedulingRecommendations.recommendedTimeFrame}</span>
                        </div>
                        
                        <div className="text-sm">
                          <div className="font-medium mb-1">Reasons:</div>
                          <ul className="list-disc list-inside text-xs space-y-1">
                            {treatmentInsights.schedulingRecommendations.reasons.map((reason, idx) => (
                              <li key={idx}>{reason}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <Button 
                          className="w-full text-sm h-8"
                          onClick={() => handleScheduleAppointment("AI-recommended follow-up")}
                        >
                          Schedule Follow-up Now
                        </Button>
                      </div>
                    ) : (
                      <div className="py-2 text-center text-sm text-muted-foreground">
                        No immediate follow-up needed at this time.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-4">
            {!financialInsights ? (
              <div className="text-center text-muted-foreground py-8">
                No financial insights available
              </div>
            ) : (
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">
                      Treatment Financial Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-xs text-muted-foreground">Total</div>
                          <div className="text-xl font-semibold">${financialInsights.estimatedTotal.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Insurance</div>
                          <div className="text-xl font-semibold">${financialInsights.insuranceCoverage.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Patient</div>
                          <div className="text-xl font-semibold">${financialInsights.patientResponsibility.toFixed(2)}</div>
                        </div>
                      </div>
                      
                      <div className="text-xs space-y-1.5">
                        <div className="flex justify-between mb-1">
                          <span>Insurance Coverage</span>
                          <span>
                            {Math.round((financialInsights.insuranceCoverage / financialInsights.estimatedTotal) * 100)}%
                          </span>
                        </div>
                        <Progress 
                          value={(financialInsights.insuranceCoverage / financialInsights.estimatedTotal) * 100} 
                          className="h-2" 
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Payment Options */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">
                      Payment Options
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {financialInsights.paymentOptions.map((option, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span>{option}</span>
                        </div>
                      ))}
                      
                      {financialInsights.financingAvailable && (
                        <div className="mt-3 text-sm">
                          <div className="font-medium mb-1">Financing Available</div>
                          <Button variant="outline" size="sm" className="text-xs mt-1 h-7">
                            View Financing Options
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Insurance Optimization */}
                {financialInsights.insuranceOptimization.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium">
                        Insurance Optimization
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside text-sm space-y-1.5">
                        {financialInsights.insuranceOptimization.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}