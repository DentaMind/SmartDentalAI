import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, Info, AlertCircle, Calendar, DollarSign, BadgeCheck } from 'lucide-react';
import type { TreatmentPlan } from '@shared/schema';

interface ProcedureItem {
  code: string;
  description: string;
  fee: number;
  insuranceCoverage: number;
  patientResponsibility: number;
  sequenceOrder: number;
  appointmentDate?: string;
  insuranceCoverageVerified: boolean;
  insuranceCategory: 'preventive' | 'basic' | 'major' | 'orthodontic' | 'not-covered';
  limitationsAndNotes?: string;
}

interface InsuranceBenefit {
  category: string;
  coveragePercentage: number;
  annualMaximum: number;
  usedAmount: number;
  remainingAmount: number;
  limitations: string[];
  waitingPeriod?: string;
  deductible: {
    individual: number;
    family: number;
    remaining: number;
  };
}

interface TreatmentPlanApprovalProps {
  plan: TreatmentPlan;
  patientId: number;
  onApproved: (planId: number) => void;
  onCancel: () => void;
}

export function TreatmentPlanApproval({ plan, patientId, onApproved, onCancel }: TreatmentPlanApprovalProps) {
  const [selectedTab, setSelectedTab] = useState('plan');
  const [signature, setSignature] = useState<string | null>(null);
  const [isVerifyingInsurance, setIsVerifyingInsurance] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [insuranceBenefits, setInsuranceBenefits] = useState<InsuranceBenefit[]>([]);
  const [procedures, setProcedures] = useState<ProcedureItem[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<any>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Set up procedures from the plan
  useEffect(() => {
    if (plan && plan.procedures) {
      const proceduresData = Array.isArray(plan.procedures) 
        ? plan.procedures 
        : typeof plan.procedures === 'object' 
          ? Object.values(plan.procedures) 
          : [];
      
      setProcedures(proceduresData as ProcedureItem[]);
      
      // If there's a stored patient signature, use it
      if (plan.patientSignatureImage) {
        setSignature(plan.patientSignatureImage);
      }
    }
  }, [plan]);

  // Initialize signature pad when canvas is ready
  useEffect(() => {
    const initSignaturePad = async () => {
      if (canvasRef.current && !signaturePadRef.current) {
        const SignaturePad = (await import('signature_pad')).default;
        const signaturePad = new SignaturePad(canvasRef.current, {
          backgroundColor: 'rgb(255, 255, 255)',
          penColor: 'rgb(0, 0, 0)'
        });
        signaturePadRef.current = signaturePad;
      }
    };

    initSignaturePad();

    return () => {
      if (signaturePadRef.current) {
        signaturePadRef.current.off();
        signaturePadRef.current = null;
      }
    };
  }, [canvasRef]);

  // Clear signature method
  const clearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
      setSignature(null);
    }
  };

  // Save signature method
  const saveSignature = () => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      const signatureData = signaturePadRef.current.toDataURL();
      setSignature(signatureData);
    } else {
      toast({
        title: "Signature Required",
        description: "Please sign before submitting.",
        variant: "destructive"
      });
    }
  };

  // Verify insurance coverage for all procedures
  const verifyInsurance = async () => {
    try {
      setIsVerifyingInsurance(true);
      
      // Call the API to verify insurance coverage
      const response = await apiRequest(`/api/insurance-verification/${patientId}`, {
        method: 'POST',
        data: { procedures: procedures.map(p => ({ code: p.code, fee: p.fee })) }
      });
      
      if (response.verified) {
        // Update procedures with verified coverage information
        const updatedProcedures = procedures.map(proc => {
          const verified = response.proceduresVerification.find(v => v.code === proc.code);
          return {
            ...proc,
            insuranceCoverage: verified?.coverageAmount || 0,
            patientResponsibility: verified?.patientAmount || proc.fee,
            insuranceCoverageVerified: !!verified,
            insuranceCategory: verified?.category || 'not-covered',
            limitationsAndNotes: verified?.limitations || 'Not covered by insurance'
          };
        });
        
        setProcedures(updatedProcedures);
        setInsuranceBenefits(response.benefits);
        setVerificationComplete(true);
        
        toast({
          title: "Insurance Verification Complete",
          description: "Coverage information has been updated.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Insurance verification error:", error);
      toast({
        title: "Verification Failed",
        description: "Could not verify insurance coverage. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsVerifyingInsurance(false);
    }
  };

  // Approve treatment plan mutation
  const approveMutation = useMutation({
    mutationFn: async () => {
      if (!signature) {
        throw new Error("Signature is required");
      }
      
      return apiRequest(`/api/treatment-plans/${plan.id}/approve`, {
        method: 'POST',
        data: {
          patientSignature: signature,
          approvedProcedures: procedures,
          verifiedInsuranceBenefits: insuranceBenefits
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/treatment-plans`] });
      queryClient.invalidateQueries({ queryKey: [`/api/treatment-plans/${plan.id}`] });
      toast({
        title: "Treatment Plan Approved",
        description: "The treatment plan has been approved and scheduled.",
        variant: "default"
      });
      onApproved(plan.id);
    },
    onError: (error: Error) => {
      toast({
        title: "Approval Failed",
        description: error.message || "Could not approve treatment plan. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Calculate totals
  const calculateTotals = () => {
    return procedures.reduce(
      (acc, curr) => {
        acc.totalFee += curr.fee;
        acc.totalInsurance += curr.insuranceCoverage;
        acc.totalPatient += curr.patientResponsibility;
        return acc;
      },
      { totalFee: 0, totalInsurance: 0, totalPatient: 0 }
    );
  };

  const { totalFee, totalInsurance, totalPatient } = calculateTotals();

  // Handle approval submission
  const handleApprove = () => {
    if (!signature) {
      toast({
        title: "Signature Required",
        description: "Please sign the treatment plan before approving.",
        variant: "destructive"
      });
      setSelectedTab('signature');
      return;
    }
    
    if (!verificationComplete) {
      toast({
        title: "Insurance Verification Required",
        description: "Please verify insurance coverage before approving the treatment plan.",
        variant: "destructive"
      });
      return;
    }
    
    approveMutation.mutate();
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Treatment Plan Approval</CardTitle>
        <CardDescription>
          Review and approve your customized treatment plan
        </CardDescription>
      </CardHeader>
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="plan">Treatment Plan</TabsTrigger>
          <TabsTrigger value="insurance">Insurance</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="signature">Signature</TabsTrigger>
        </TabsList>
        
        {/* Treatment Plan Tab */}
        <TabsContent value="plan">
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold flex items-center">
                  {plan.planName || "Treatment Plan"} 
                  {plan.planType && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                      {plan.planType.charAt(0).toUpperCase() + plan.planType.slice(1)}
                    </span>
                  )}
                </h3>
                <p className="text-muted-foreground">{plan.diagnosis}</p>
              </div>
              
              <Separator />
              
              <ScrollArea className="h-[300px]">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="pb-2">Procedure</th>
                      <th className="pb-2">Fee</th>
                      <th className="pb-2">Insurance</th>
                      <th className="pb-2">Your Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {procedures.map((procedure, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-3">
                          <div className="font-medium">{procedure.description}</div>
                          <div className="text-xs text-muted-foreground">{procedure.code}</div>
                        </td>
                        <td className="py-3">${procedure.fee.toFixed(2)}</td>
                        <td className="py-3">
                          {procedure.insuranceCoverageVerified ? (
                            <span className="flex items-center text-green-600">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              ${procedure.insuranceCoverage.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-yellow-600 flex items-center">
                              <Info className="w-4 h-4 mr-1" />
                              Unverified
                            </span>
                          )}
                        </td>
                        <td className="py-3">${procedure.patientResponsibility.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold">
                      <td className="pt-3">Total</td>
                      <td className="pt-3">${totalFee.toFixed(2)}</td>
                      <td className="pt-3">${totalInsurance.toFixed(2)}</td>
                      <td className="pt-3">${totalPatient.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </ScrollArea>
              
              <Alert variant="default" className="bg-muted">
                <Info className="h-4 w-4" />
                <AlertTitle>Important Note</AlertTitle>
                <AlertDescription>
                  Insurance benefits shown are based on the information provided by your insurance company.
                  Actual coverage may vary. Final patient responsibility will be determined after insurance claim processing.
                </AlertDescription>
              </Alert>
              
              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="outline" onClick={verifyInsurance} disabled={isVerifyingInsurance}>
                  {isVerifyingInsurance ? "Verifying..." : "Verify Insurance"}
                </Button>
                <Button onClick={() => setSelectedTab('insurance')}>
                  Insurance Details
                </Button>
              </div>
            </div>
          </CardContent>
        </TabsContent>
        
        {/* Insurance Tab */}
        <TabsContent value="insurance">
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold">Insurance Benefits</h3>
                <p className="text-muted-foreground">Current status of your insurance coverage</p>
              </div>
              
              <Separator />
              
              {insuranceBenefits.length > 0 ? (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4">
                    {insuranceBenefits.map((benefit, index) => (
                      <Card key={index}>
                        <CardHeader className="py-4">
                          <CardTitle className="text-lg">{benefit.category} Coverage</CardTitle>
                        </CardHeader>
                        <CardContent className="py-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="text-sm">Coverage Percentage:</div>
                            <div className="text-sm font-medium">{benefit.coveragePercentage}%</div>
                            
                            <div className="text-sm">Annual Maximum:</div>
                            <div className="text-sm font-medium">${benefit.annualMaximum.toFixed(2)}</div>
                            
                            <div className="text-sm">Used Amount:</div>
                            <div className="text-sm font-medium">${benefit.usedAmount.toFixed(2)}</div>
                            
                            <div className="text-sm">Remaining Amount:</div>
                            <div className="text-sm font-medium">${benefit.remainingAmount.toFixed(2)}</div>
                            
                            <div className="text-sm">Individual Deductible:</div>
                            <div className="text-sm font-medium">${benefit.deductible.individual.toFixed(2)}</div>
                            
                            <div className="text-sm">Remaining Deductible:</div>
                            <div className="text-sm font-medium">${benefit.deductible.remaining.toFixed(2)}</div>
                          </div>
                          
                          {benefit.limitations.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm font-medium">Limitations:</p>
                              <ul className="text-sm list-disc pl-5">
                                {benefit.limitations.map((limitation, idx) => (
                                  <li key={idx}>{limitation}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center py-10">
                  <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No insurance information available</p>
                  <Button 
                    variant="default" 
                    className="mt-4" 
                    onClick={verifyInsurance}
                    disabled={isVerifyingInsurance}
                  >
                    {isVerifyingInsurance ? "Verifying..." : "Verify Insurance Now"}
                  </Button>
                </div>
              )}
              
              <Alert variant={verificationComplete ? "default" : "destructive"} className={verificationComplete ? "bg-green-50" : ""}>
                {verificationComplete ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <AlertTitle>{verificationComplete ? "Verification Complete" : "Verification Required"}</AlertTitle>
                <AlertDescription>
                  {verificationComplete 
                    ? "Insurance benefits have been verified in real-time. Coverage information is up to date."
                    : "Please verify your insurance coverage before approving the treatment plan."}
                </AlertDescription>
              </Alert>
              
              <div className="flex justify-end space-x-2 pt-2">
                <Button onClick={() => setSelectedTab('plan')}>
                  Back to Plan
                </Button>
                <Button onClick={() => setSelectedTab('schedule')}>
                  View Schedule
                </Button>
              </div>
            </div>
          </CardContent>
        </TabsContent>
        
        {/* Schedule Tab */}
        <TabsContent value="schedule">
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold flex items-center">
                  <Calendar className="mr-2 h-5 w-5" /> Treatment Schedule
                </h3>
                <p className="text-muted-foreground">Recommended sequence of appointments</p>
              </div>
              
              <Separator />
              
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {procedures
                    .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
                    .map((procedure, index) => (
                      <div key={index} className="flex items-start p-3 border rounded-md">
                        <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground mr-3">
                          {procedure.sequenceOrder}
                        </div>
                        <div className="flex-grow">
                          <h4 className="font-medium">{procedure.description}</h4>
                          <div className="text-sm text-muted-foreground">{procedure.code}</div>
                          {procedure.appointmentDate ? (
                            <div className="text-sm mt-1 flex items-center text-green-600">
                              <Calendar className="w-3 h-3 mr-1" />
                              Scheduled: {new Date(procedure.appointmentDate).toLocaleDateString()}
                            </div>
                          ) : (
                            <div className="text-sm mt-1 text-yellow-600">
                              Not yet scheduled
                            </div>
                          )}
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <div className="text-primary font-medium">${procedure.fee.toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground">
                            Insurance: ${procedure.insuranceCoverage.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </ScrollArea>
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Sequential Treatment</AlertTitle>
                <AlertDescription>
                  Your treatments will be sequenced in the optimal order for clinical success. After approving this plan,
                  you'll be able to schedule appointments for each procedure.
                </AlertDescription>
              </Alert>
              
              <div className="flex justify-end space-x-2 pt-2">
                <Button onClick={() => setSelectedTab('insurance')}>
                  Back to Insurance
                </Button>
                <Button onClick={() => setSelectedTab('signature')}>
                  Continue to Signature
                </Button>
              </div>
            </div>
          </CardContent>
        </TabsContent>
        
        {/* Signature Tab */}
        <TabsContent value="signature">
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold">Approve Treatment Plan</h3>
                <p className="text-muted-foreground">
                  Please sign below to approve this treatment plan
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="signature-canvas">Your Signature</Label>
                {signature ? (
                  <div className="border rounded-md p-4 bg-white">
                    <img src={signature} alt="Your signature" className="max-h-40 mx-auto" />
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => setSignature(null)}>
                      Clear Signature
                    </Button>
                  </div>
                ) : (
                  <div className="border rounded-md p-4 bg-white">
                    <canvas 
                      ref={canvasRef}
                      id="signature-canvas"
                      className="w-full h-40 border rounded-md touch-none"
                    />
                    <div className="flex justify-end space-x-2 mt-2">
                      <Button variant="outline" size="sm" onClick={clearSignature}>
                        Clear
                      </Button>
                      <Button size="sm" onClick={saveSignature}>
                        Save Signature
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Acknowledgment</Label>
                <div className="text-sm space-y-2 p-4 border rounded-md bg-muted/50">
                  <p>
                    By signing this form, I acknowledge that I have reviewed and understood the proposed treatment plan.
                    I authorize the dental providers to perform the procedures outlined in this plan.
                  </p>
                  <p>
                    I understand that this is an estimate based on information provided by my insurance company, and actual
                    coverage may vary. I agree to be financially responsible for any services not covered by my insurance.
                  </p>
                  <p>
                    I understand that multiple appointments may be required to complete my treatment, and I will work with
                    the office staff to schedule these appointments.
                  </p>
                </div>
              </div>
              
              {!verificationComplete && (
                <Alert variant="warning">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Insurance Verification Required</AlertTitle>
                  <AlertDescription>
                    Please verify your insurance coverage before approving the treatment plan to ensure accurate cost estimates.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setSelectedTab('schedule')}>
                Back
              </Button>
              <Button onClick={handleApprove} disabled={approveMutation.isPending || !signature || !verificationComplete}>
                {approveMutation.isPending ? "Processing..." : "Approve Treatment Plan"}
              </Button>
            </div>
          </CardFooter>
        </TabsContent>
      </Tabs>
    </Card>
  );
}