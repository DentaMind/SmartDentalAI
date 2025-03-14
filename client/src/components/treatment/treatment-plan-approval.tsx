import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { TreatmentPlan } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Calendar, Check, FileText, Info } from 'lucide-react';
import { SignaturePad } from './signature-pad';

interface TreatmentPlanApprovalProps {
  plan: TreatmentPlan;
  patientId: number;
  onApproved: (planId: number) => void;
  onCancel: () => void;
}

// Treatment agreement options
interface TreatmentAgreement {
  id: string;
  title: string;
  content: string;
  required: boolean;
}

export function TreatmentPlanApproval({
  plan,
  patientId,
  onApproved,
  onCancel
}: TreatmentPlanApprovalProps) {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  // State
  const [activeTab, setActiveTab] = useState('plan');
  const [agreements, setAgreements] = useState<Record<string, boolean>>({});
  const [signaturePadOpen, setSignaturePadOpen] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  // Fetch patient details
  const { data: patientData, isLoading: patientLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}`],
    queryFn: async () => {
      return await apiRequest(`/api/patients/${patientId}`);
    }
  });
  
  // Fetch available treatment agreements
  const { data: agreementsData, isLoading: agreementsLoading } = useQuery({
    queryKey: ['/api/legal/treatment-agreements'],
    queryFn: async () => {
      return await apiRequest('/api/legal/treatment-agreements') as TreatmentAgreement[];
    },
    onSuccess: (data) => {
      // Initialize agreements state
      const initialAgreements: Record<string, boolean> = {};
      data.forEach(agreement => {
        initialAgreements[agreement.id] = false;
      });
      setAgreements(initialAgreements);
    }
  });
  
  // Approve treatment plan mutation
  const approvePlanMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/treatment-plans/${plan.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          signature,
          agreements: Object.keys(agreements).filter(id => agreements[id]),
          termsAccepted
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/treatment-plans/${plan.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/treatment-plans`] });
      toast({
        title: "Treatment Plan Approved",
        description: "The treatment plan has been successfully approved.",
        variant: "default"
      });
      onApproved(plan.id);
    },
    onError: (error: Error) => {
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve treatment plan. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Schedule treatment plan mutation
  const schedulePlanMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/treatment-plans/${plan.id}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          autoSchedule: true
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/treatment-plans/${plan.id}`] });
      toast({
        title: "Treatment Plan Scheduled",
        description: "The appointments have been automatically scheduled.",
        variant: "default"
      });
      setLocation(`/appointments?treatment=${plan.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Scheduling Failed",
        description: error.message || "Failed to schedule appointments. Please try again.",
        variant: "warning"
      });
    }
  });
  
  // Handle signature save
  const handleSaveSignature = (signatureData: string) => {
    setSignature(signatureData);
    setSignaturePadOpen(false);
  };
  
  // Handle agreement toggle
  const handleAgreementToggle = (id: string, checked: boolean) => {
    setAgreements(prev => ({
      ...prev,
      [id]: checked
    }));
  };
  
  // Handle approve plan
  const handleApprovePlan = () => {
    // Validate required inputs
    const requiredAgreements = agreementsData?.filter(a => a.required) || [];
    const allRequiredAgreed = requiredAgreements.every(a => agreements[a.id]);
    
    if (!signature) {
      toast({
        title: "Signature Required",
        description: "Please provide your signature to approve the treatment plan.",
        variant: "destructive"
      });
      return;
    }
    
    if (!allRequiredAgreed) {
      toast({
        title: "Agreements Required",
        description: "Please accept all required agreements before proceeding.",
        variant: "destructive"
      });
      return;
    }
    
    if (!termsAccepted) {
      toast({
        title: "Terms Acceptance Required",
        description: "Please accept the terms and conditions before proceeding.",
        variant: "destructive"
      });
      return;
    }
    
    approvePlanMutation.mutate();
  };
  
  // Extract procedures
  const procedures = Array.isArray(plan.procedures) 
    ? plan.procedures 
    : typeof plan.procedures === 'object' 
      ? Object.values(plan.procedures) 
      : [];
  
  // Calculate financial summary
  const totalCost = procedures.reduce((sum, proc: any) => sum + (proc.fee || 0), 0);
  const totalInsurance = procedures.reduce((sum, proc: any) => sum + (proc.insuranceCoverage || 0), 0);
  const totalPatient = procedures.reduce((sum, proc: any) => sum + (proc.patientResponsibility || 0), 0);
  
  return (
    <div className="flex flex-col">
      {/* Tabs for different sections */}
      <Tabs defaultValue="plan" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="plan">Treatment Plan</TabsTrigger>
          <TabsTrigger value="agreements">Agreements</TabsTrigger>
          <TabsTrigger value="signature">Signature & Approval</TabsTrigger>
        </TabsList>
        
        {/* Treatment Plan Tab */}
        <TabsContent value="plan" className="py-4">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Treatment Plan Details</h3>
              <Card>
                <CardHeader>
                  <CardTitle>{plan.planName || `Treatment Plan #${plan.id}`}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Diagnosis</h4>
                      <p className="text-muted-foreground">{plan.diagnosis}</p>
                      
                      <h4 className="font-medium mt-4 mb-2">Treatment Goals</h4>
                      <p className="text-muted-foreground">{plan.goals || "No specific goals provided"}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Financial Summary</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>Total Treatment Cost:</span>
                          <span className="font-medium">${totalCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Insurance Coverage:</span>
                          <span>${totalInsurance.toFixed(2)}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between">
                          <span className="font-medium">Your Responsibility:</span>
                          <span className="font-medium">${totalPatient.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Treatment Procedures</h3>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-3 text-left">Procedure</th>
                      <th className="p-3 text-right">Fee</th>
                      <th className="p-3 text-right">Insurance</th>
                      <th className="p-3 text-right">Your Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {procedures.map((procedure: any, index: number) => (
                      <tr key={index} className="border-t">
                        <td className="p-3">
                          <div className="font-medium">{procedure.description}</div>
                          <div className="text-xs text-muted-foreground">{procedure.code}</div>
                          {procedure.tooth && (
                            <Badge variant="outline" className="text-xs mt-1">
                              Tooth {procedure.tooth}
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 text-right">${procedure.fee?.toFixed(2) || '0.00'}</td>
                        <td className="p-3 text-right">${procedure.insuranceCoverage?.toFixed(2) || '0.00'}</td>
                        <td className="p-3 text-right">${procedure.patientResponsibility?.toFixed(2) || '0.00'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/50">
                    <tr>
                      <td className="p-3 font-medium">Total</td>
                      <td className="p-3 text-right font-medium">${totalCost.toFixed(2)}</td>
                      <td className="p-3 text-right font-medium">${totalInsurance.toFixed(2)}</td>
                      <td className="p-3 text-right font-medium">${totalPatient.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              <div className="mt-4 p-4 border rounded-md bg-muted/30">
                <div className="flex mb-2">
                  <Info className="h-5 w-5 mr-2 text-blue-500" />
                  <h4 className="font-medium">Insurance Information</h4>
                </div>
                <p className="text-sm mb-2">
                  Insurance coverage amounts are estimates based on the information available at
                  the time of treatment planning. Actual coverage may vary based on your plan's
                  specific provisions, annual maximums, and remaining benefits.
                </p>
                {patientData?.patient?.insuranceProvider && (
                  <p className="text-sm">
                    <span className="font-medium">Insurance Provider:</span> {patientData.patient.insuranceProvider}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <Button 
                onClick={() => setActiveTab('agreements')}
                className="flex items-center"
              >
                Next: Agreements
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </div>
          </div>
        </TabsContent>
        
        {/* Agreements Tab */}
        <TabsContent value="agreements" className="py-4">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Treatment Agreements</h3>
              
              {agreementsLoading ? (
                <div className="text-center p-8">
                  <p className="text-muted-foreground">Loading agreements...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {agreementsData && agreementsData.map(agreement => (
                    <Card key={agreement.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-base">{agreement.title}</CardTitle>
                          {agreement.required && (
                            <Badge className="ml-2" variant="outline">Required</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pb-4">
                        <div className="text-sm text-muted-foreground mb-4 max-h-32 overflow-y-auto border rounded-md p-3 bg-muted/10">
                          {agreement.content}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`agreement-${agreement.id}`}
                            checked={agreements[agreement.id] || false}
                            onCheckedChange={(checked) => 
                              handleAgreementToggle(agreement.id, checked === true)
                            }
                          />
                          <Label htmlFor={`agreement-${agreement.id}`} className="text-sm font-medium">
                            I have read and agree to the terms in this document
                          </Label>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {(!agreementsData || agreementsData.length === 0) && (
                    <Card>
                      <CardContent className="p-6 text-center">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p>No treatment agreements found.</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex justify-between pt-4">
              <Button 
                variant="outline" 
                onClick={() => setActiveTab('plan')}
                className="flex items-center"
              >
                <svg className="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Plan
              </Button>
              
              <Button 
                onClick={() => setActiveTab('signature')}
                className="flex items-center"
              >
                Next: Signature
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </div>
          </div>
        </TabsContent>
        
        {/* Signature & Approval Tab */}
        <TabsContent value="signature" className="py-4">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Signature & Approval</h3>
              
              {signaturePadOpen ? (
                <Card>
                  <CardContent className="p-6">
                    <h4 className="font-medium mb-4">Please sign below to approve the treatment plan</h4>
                    <SignaturePad
                      onSave={handleSaveSignature}
                      onCancel={() => setSignaturePadOpen(false)}
                    />
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium mb-2">Your Signature</h4>
                        {signature ? (
                          <div className="p-4 border rounded-md bg-white">
                            <img 
                              src={signature} 
                              alt="Signature" 
                              className="max-h-24 mx-auto"
                            />
                          </div>
                        ) : (
                          <div className="p-6 border rounded-md bg-muted/10 text-center">
                            <p className="text-muted-foreground">No signature provided</p>
                          </div>
                        )}
                      </div>
                      
                      <Button 
                        variant={signature ? "outline" : "default"}
                        onClick={() => setSignaturePadOpen(true)}
                        className="mt-1"
                      >
                        {signature ? "Edit Signature" : "Add Signature"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                  />
                  <Label htmlFor="terms" className="text-sm">
                    I confirm that I understand and agree to the treatment plan, associated costs, and all
                    the agreements I have signed. I authorize the dental practice to proceed with the treatment
                    as outlined above.
                  </Label>
                </div>
                
                <div className="p-4 border rounded-md bg-muted/10">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 mr-2 text-blue-500 mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                      <p className="mb-2">
                        By approving this treatment plan, you are giving consent to proceed with the 
                        recommended procedures outlined in this document. This is not a contract and 
                        you have the right to ask questions or withdraw consent at any time.
                      </p>
                      <p>
                        The estimated insurance coverage is based on the information available at this time
                        and may change based on your insurance provider's final determination.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-between pt-4">
              <Button 
                variant="outline" 
                onClick={() => setActiveTab('agreements')}
                className="flex items-center"
              >
                <svg className="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Agreements
              </Button>
              
              <div className="space-x-2">
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                
                <Button 
                  onClick={handleApprovePlan}
                  disabled={!signature || !termsAccepted || approvePlanMutation.isPending}
                  className="min-w-32"
                >
                  {approvePlanMutation.isPending ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Check className="mr-2 h-4 w-4" />
                      Approve Plan
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}