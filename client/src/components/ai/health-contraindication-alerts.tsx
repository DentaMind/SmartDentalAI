import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { 
  AlertTriangle, 
  AlertCircle, 
  X, 
  Eye, 
  Info, 
  ThumbsUp, 
  ThumbsDown, 
  ArrowUpRight,
  Pill,
  Clipboard,
  Skull,
  HeartPulse
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Define types for contraindication alerts
export interface ContraindicationAlert {
  id: string;
  patientId: number;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: 'medication' | 'condition' | 'allergy' | 'lab' | 'xray' | 'ai';
  sourceId?: string;
  sourceName?: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'dismissed' | 'resolved';
  dismissedBy?: number;
  dismissedAt?: Date;
  resolvedBy?: number;
  resolvedAt?: Date;
  recommendedAction?: string;
  references?: string[];
  additionalData?: Record<string, any>;
}

// Icons for different alert sources
const sourceIcons = {
  medication: <Pill className="h-4 w-4" />,
  condition: <HeartPulse className="h-4 w-4" />,
  allergy: <AlertCircle className="h-4 w-4" />,
  lab: <Clipboard className="h-4 w-4" />,
  xray: <Skull className="h-4 w-4" />,
  ai: <AlertTriangle className="h-4 w-4" />
};

// Get severity color
const getSeverityColor = (severity: ContraindicationAlert['severity']) => {
  switch (severity) {
    case 'critical':
      return 'bg-red-500 text-white';
    case 'high':
      return 'bg-orange-500 text-white';
    case 'medium':
      return 'bg-amber-500 text-black';
    case 'low':
      return 'bg-yellow-500 text-black';
    default:
      return 'bg-gray-500 text-white';
  }
};

// Get severity text
const getSeverityText = (severity: ContraindicationAlert['severity']) => {
  switch (severity) {
    case 'critical':
      return 'Critical Risk';
    case 'high':
      return 'High Risk';
    case 'medium':
      return 'Medium Risk';
    case 'low':
      return 'Low Risk';
    default:
      return 'Unknown Risk';
  }
};

// Component for displaying and managing contraindication alerts
const HealthContraindicationAlerts: React.FC<{
  patientId: number;
  userId: number;
  compact?: boolean;
  onAlertSelected?: (alert: ContraindicationAlert) => void;
}> = ({ patientId, userId, compact = false, onAlertSelected }) => {
  const [selectedAlert, setSelectedAlert] = useState<ContraindicationAlert | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'helpful' | 'not-helpful'>>({});
  const queryClient = useQueryClient();
  
  // Fetch contraindication alerts
  const { data: alerts, isLoading, isError } = useQuery({
    queryKey: [`/api/patients/${patientId}/contraindications`],
    queryFn: async () => await apiRequest<ContraindicationAlert[]>(`/api/patients/${patientId}/contraindications`),
  });
  
  // Mutation to dismiss an alert
  const dismissAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      return await apiRequest<ContraindicationAlert>(`/api/patients/${patientId}/contraindications/${alertId}/dismiss`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/contraindications`] });
      toast({
        title: 'Alert dismissed',
        description: 'The alert has been marked as reviewed and dismissed.',
      });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error dismissing alert',
        description: 'There was an error dismissing the alert. Please try again.',
      });
      console.error('Error dismissing alert:', error);
    },
  });
  
  // Mutation to resolve an alert
  const resolveAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      return await apiRequest<ContraindicationAlert>(`/api/patients/${patientId}/contraindications/${alertId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/contraindications`] });
      toast({
        title: 'Alert resolved',
        description: 'The alert has been marked as resolved.',
      });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error resolving alert',
        description: 'There was an error resolving the alert. Please try again.',
      });
      console.error('Error resolving alert:', error);
    },
  });
  
  // Mutation to provide feedback on an alert
  const feedbackMutation = useMutation({
    mutationFn: async ({ alertId, feedback }: { alertId: string, feedback: 'helpful' | 'not-helpful' }) => {
      return await apiRequest<any>(`/api/patients/${patientId}/contraindications/${alertId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId,
          feedback
        }),
      });
    },
    onSuccess: (_, variables) => {
      setFeedbackGiven(prev => ({
        ...prev,
        [variables.alertId]: variables.feedback
      }));
      toast({
        title: 'Feedback submitted',
        description: 'Thank you for your feedback on this alert.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error submitting feedback',
        description: 'There was an error submitting your feedback. Please try again.',
      });
      console.error('Error submitting feedback:', error);
    },
  });
  
  // Handle alert selection
  const handleAlertClick = (alert: ContraindicationAlert) => {
    setSelectedAlert(alert);
    if (onAlertSelected) {
      onAlertSelected(alert);
    }
    if (!compact) {
      setIsDialogOpen(true);
    }
  };
  
  // Handle alert dismissal
  const handleDismissAlert = (alertId: string) => {
    if (compact) {
      // In compact mode, don't show confirmation, just dismiss
      dismissAlertMutation.mutate(alertId);
    } else {
      // In full mode, this is handled by the dialog
      dismissAlertMutation.mutate(alertId);
    }
  };
  
  // Handle alert resolution
  const handleResolveAlert = (alertId: string) => {
    resolveAlertMutation.mutate(alertId);
  };
  
  // Handle feedback submission
  const handleFeedback = (alertId: string, feedback: 'helpful' | 'not-helpful') => {
    feedbackMutation.mutate({ alertId, feedback });
  };
  
  // If no alerts data, use some mock data for demonstration
  const mockAlerts: ContraindicationAlert[] = [
    {
      id: "alert1",
      patientId,
      title: "Medication Interaction Risk",
      description: "Potential interaction between prescribed Amoxicillin and patient's current medication Warfarin. Risk of increased bleeding due to alteration of gut flora and reduction in vitamin K production.",
      severity: "high",
      source: "medication",
      sourceName: "Medication Interaction Check",
      createdAt: new Date("2025-03-05T10:30:00"),
      updatedAt: new Date("2025-03-05T10:30:00"),
      status: "active",
      recommendedAction: "Consider alternative antibiotic or adjust Warfarin dosage with close INR monitoring.",
      references: [
        "Johnson et al. (2022). Antibiotic-Warfarin Interactions. Journal of Clinical Pharmacy",
        "American Dental Association Guidelines (2024)"
      ],
      additionalData: {
        medications: ["Amoxicillin", "Warfarin"],
        interactionMechanism: "Antibiotic-induced alteration of vitamin K production",
        monitoringRecommendation: "Check INR within 3-5 days of starting antibiotic"
      }
    },
    {
      id: "alert2",
      patientId,
      title: "Uncontrolled Hypertension",
      description: "Patient's last recorded blood pressure was 165/95 mm Hg. Caution advised with vasoconstrictors in local anesthetics.",
      severity: "medium",
      source: "condition",
      sourceName: "Vital Signs Monitor",
      createdAt: new Date("2025-03-04T14:45:00"),
      updatedAt: new Date("2025-03-04T14:45:00"),
      status: "active",
      recommendedAction: "Limit epinephrine to no more than 2 carpules (1:100,000) per appointment. Consider medical consultation prior to extensive procedures.",
      references: [
        "American Heart Association (2023). Hypertension Management in Dental Settings",
        "Dental Management of the Medically Compromised Patient, 9th Edition"
      ]
    },
    {
      id: "alert3",
      patientId,
      title: "Abnormal Liver Function Test Results",
      description: "Recent lab results show elevated ALT (85 U/L) and AST (90 U/L), indicating potential liver function issues. Caution with hepatically metabolized medications.",
      severity: "medium",
      source: "lab",
      sourceName: "Laboratory Analysis",
      createdAt: new Date("2025-03-01T09:15:00"),
      updatedAt: new Date("2025-03-01T09:15:00"),
      status: "active",
      recommendedAction: "Avoid or reduce dosage of acetaminophen-containing analgesics. Consider medical consultation before prescribing NSAIDs.",
      additionalData: {
        labValues: {
          "ALT": "85 U/L (Normal: 7-55 U/L)",
          "AST": "90 U/L (Normal: 8-48 U/L)",
          "ALP": "150 U/L (Normal: 40-129 U/L)"
        }
      }
    },
    {
      id: "alert4",
      patientId,
      title: "Potential Periapical Pathology",
      description: "AI analysis of recent periapical radiograph detected radiolucency associated with tooth #19, suggesting possible periapical infection.",
      severity: "low",
      source: "xray",
      sourceName: "X-ray AI Analysis",
      createdAt: new Date("2025-02-15T11:20:00"),
      updatedAt: new Date("2025-02-15T11:20:00"),
      status: "active",
      recommendedAction: "Clinical evaluation of tooth #19 recommended. Consider pulp vitality testing and endodontic referral if symptomatic.",
      additionalData: {
        xrayDate: "2025-02-15",
        aiConfidence: "85%",
        location: "Tooth #19, periapical region",
        size: "Approximately 3.2mm in diameter"
      }
    }
  ];
  
  // Determine which alerts to display
  const displayAlerts = alerts?.length ? alerts : mockAlerts;
  const activeAlerts = displayAlerts.filter(alert => alert.status === 'active');
  
  // Render loading state
  if (isLoading) {
    return (
      <Card className={`w-full ${compact ? 'border-none shadow-none' : ''}`}>
        <CardContent className={compact ? 'p-0' : 'p-6'}>
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Render error state
  if (isError) {
    return (
      <Card className={`w-full ${compact ? 'border-none shadow-none' : ''}`}>
        <CardContent className={compact ? 'p-0' : 'p-6'}>
          <div className="text-center p-4 text-red-500">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Error loading health alerts. Please try again.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Render empty state
  if (activeAlerts.length === 0) {
    return (
      <Card className={`w-full ${compact ? 'border-none shadow-none' : ''}`}>
        {!compact && (
          <CardHeader>
            <CardTitle>Health Alerts</CardTitle>
            <CardDescription>
              No active contraindication alerts for this patient
            </CardDescription>
          </CardHeader>
        )}
        <CardContent className={compact ? 'p-0' : 'p-6'}>
          <div className="text-center p-4 text-gray-500">
            <div className="bg-green-50 rounded-full h-12 w-12 mx-auto mb-3 flex items-center justify-center">
              <Info className="h-6 w-6 text-green-500" />
            </div>
            <p className="font-medium text-gray-700">No Active Health Alerts</p>
            <p className="text-sm mt-1">
              This patient has no active contraindication alerts.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Compact version of the component (for embedding in other components)
  if (compact) {
    return (
      <div className="space-y-2">
        {activeAlerts.map((alert) => (
          <div 
            key={alert.id}
            className="flex items-start p-3 bg-red-50 border border-red-100 rounded-md"
          >
            <div className="mr-3 mt-1">
              <div className={`h-3 w-3 rounded-full ${getSeverityColor(alert.severity)}`}></div>
            </div>
            <div className="flex-grow">
              <div className="font-medium text-red-800 flex items-center">
                {sourceIcons[alert.source]} <span className="ml-1">{alert.title}</span>
              </div>
              <div className="text-sm text-red-700 mt-0.5 line-clamp-2">{alert.description}</div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-red-700 hover:text-red-800 hover:bg-red-100 p-1 h-auto"
              onClick={(e) => {
                e.stopPropagation();
                handleDismissAlert(alert.id);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    );
  }
  
  // Full version of the component
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Health Alerts</CardTitle>
            <CardDescription>
              {activeAlerts.length} active contraindication {activeAlerts.length === 1 ? 'alert' : 'alerts'} for this patient
            </CardDescription>
          </div>
          {activeAlerts.length > 0 && (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              {activeAlerts.length} Active {activeAlerts.length === 1 ? 'Alert' : 'Alerts'}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {activeAlerts.map((alert) => (
          <div 
            key={alert.id}
            className={`flex items-start p-4 border rounded-md cursor-pointer transition-all hover:shadow-md ${
              alert.severity === 'critical' ? 'bg-red-50 border-red-200' :
              alert.severity === 'high' ? 'bg-orange-50 border-orange-200' :
              alert.severity === 'medium' ? 'bg-amber-50 border-amber-200' :
              'bg-yellow-50 border-yellow-200'
            }`}
            onClick={() => handleAlertClick(alert)}
          >
            <div className="mr-4 mt-1">
              <div className={`h-4 w-4 rounded-full ${getSeverityColor(alert.severity)}`}></div>
            </div>
            
            <div className="flex-grow">
              <div className="flex items-center justify-between">
                <div className="font-medium flex items-center">
                  {sourceIcons[alert.source]} <span className="ml-1">{alert.title}</span>
                </div>
                <div className="flex space-x-1">
                  <Badge variant="outline" className={`${
                    alert.severity === 'critical' ? 'bg-red-100 text-red-800 border-red-200' :
                    alert.severity === 'high' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                    alert.severity === 'medium' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                    'bg-yellow-100 text-yellow-800 border-yellow-200'
                  }`}>
                    {getSeverityText(alert.severity)}
                  </Badge>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDismissAlert(alert.id);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Dismiss alert</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              
              <div className="text-sm mt-1">{alert.description}</div>
              
              {alert.recommendedAction && (
                <div className="mt-2 text-sm font-medium flex items-center">
                  <ArrowUpRight className="h-3.5 w-3.5 mr-1" /> Recommendation: {alert.recommendedAction}
                </div>
              )}
              
              <div className="mt-3 flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  Detected {new Date(alert.createdAt).toLocaleDateString()} 
                  {alert.sourceName && <> • Source: {alert.sourceName}</>}
                </div>
                
                <div className="flex space-x-1">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAlert(alert);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Eye className="h-3 w-3 mr-1" /> View Details
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
      
      <CardFooter className="text-sm text-gray-500 border-t pt-4">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
          <p>
            Health alerts are automatically generated by AI analysis of patient data, including medical history, 
            medications, lab results, and X-rays. Always verify with clinical judgment.
          </p>
        </div>
      </CardFooter>
      
      {/* Alert Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          {selectedAlert && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  {sourceIcons[selectedAlert.source]} 
                  <span className="ml-2">{selectedAlert.title}</span>
                  <Badge className={`ml-3 ${
                    selectedAlert.severity === 'critical' ? 'bg-red-100 text-red-800 border-red-200' :
                    selectedAlert.severity === 'high' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                    selectedAlert.severity === 'medium' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                    'bg-yellow-100 text-yellow-800 border-yellow-200'
                  }`}>
                    {getSeverityText(selectedAlert.severity)}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  Alert detected on {new Date(selectedAlert.createdAt).toLocaleDateString()} via {selectedAlert.sourceName || selectedAlert.source}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className={`p-4 rounded-md ${
                  selectedAlert.severity === 'critical' ? 'bg-red-50' :
                  selectedAlert.severity === 'high' ? 'bg-orange-50' :
                  selectedAlert.severity === 'medium' ? 'bg-amber-50' :
                  'bg-yellow-50'
                }`}>
                  <div className="text-base">{selectedAlert.description}</div>
                </div>
                
                {selectedAlert.recommendedAction && (
                  <div className="border-t pt-4">
                    <h3 className="text-base font-medium mb-2">Recommended Action</h3>
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-md">
                      {selectedAlert.recommendedAction}
                    </div>
                  </div>
                )}
                
                {selectedAlert.additionalData && (
                  <div className="border-t pt-4">
                    <h3 className="text-base font-medium mb-2">Additional Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(selectedAlert.additionalData).map(([key, value]) => {
                        if (typeof value === 'object' && value !== null) {
                          return (
                            <div key={key} className="col-span-2">
                              <h4 className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h4>
                              <div className="mt-1 p-3 bg-gray-50 rounded-md">
                                {Object.entries(value).map(([subKey, subValue]) => (
                                  <div key={subKey} className="text-sm">
                                    <span className="font-medium">{subKey}:</span> {subValue as string}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        
                        if (Array.isArray(value)) {
                          return (
                            <div key={key} className="col-span-2">
                              <h4 className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h4>
                              <ul className="mt-1 list-disc list-inside space-y-1">
                                {value.map((item, i) => (
                                  <li key={i} className="text-sm">{item}</li>
                                ))}
                              </ul>
                            </div>
                          );
                        }
                        
                        return (
                          <div key={key} className="p-3 bg-gray-50 rounded-md">
                            <div className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</div>
                            <div className="text-base">{value as string}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {selectedAlert.references && selectedAlert.references.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="text-base font-medium mb-2">References</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedAlert.references.map((reference, index) => (
                        <li key={index} className="text-sm">{reference}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="border-t pt-4">
                  <h3 className="text-base font-medium mb-2">Was this alert helpful?</h3>
                  <div className="flex space-x-3">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className={feedbackGiven[selectedAlert.id] === 'helpful' ? 'bg-green-100 border-green-300' : ''}
                      onClick={() => handleFeedback(selectedAlert.id, 'helpful')}
                      disabled={feedbackGiven[selectedAlert.id] === 'helpful'}
                    >
                      <ThumbsUp className="h-4 w-4 mr-2" /> Helpful
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className={feedbackGiven[selectedAlert.id] === 'not-helpful' ? 'bg-red-100 border-red-300' : ''}
                      onClick={() => handleFeedback(selectedAlert.id, 'not-helpful')}
                      disabled={feedbackGiven[selectedAlert.id] === 'not-helpful'}
                    >
                      <ThumbsDown className="h-4 w-4 mr-2" /> Not Helpful
                    </Button>
                  </div>
                </div>
              </div>
              
              <DialogFooter className="space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => handleDismissAlert(selectedAlert.id)}
                >
                  Dismiss Alert
                </Button>
                <Button 
                  onClick={() => handleResolveAlert(selectedAlert.id)}
                >
                  Mark as Resolved
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default HealthContraindicationAlerts;