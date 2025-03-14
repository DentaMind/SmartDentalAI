import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle, Clock, DollarSign, FileText, PenTool, AlertTriangle } from 'lucide-react';
import { SignaturePad } from '@/components/treatment/signature-pad';
import { TreatmentPlanApproval } from '@/components/treatment/treatment-plan-approval';
import { TreatmentPlan } from '@shared/schema';

export default function TreatmentPlanDetailsPage() {
  const [_, params] = useRoute('/treatment-plans/:id');
  const [location, setLocation] = useLocation();
  const planId = params?.id ? parseInt(params.id) : null;
  
  const [isSigningDialogOpen, setIsSigningDialogOpen] = useState(false);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  
  const queryClient = useQueryClient();
  
  // Fetch treatment plan details
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/treatment-plans/${planId}`],
    queryFn: async () => {
      if (!planId) return null;
      return await apiRequest(`/api/treatment-plans/${planId}`);
    },
    enabled: !!planId
  });
  
  // Extract data
  const plan = data?.treatmentPlan as TreatmentPlan | undefined;
  const appointments = data?.appointments || [];
  const insuranceClaims = data?.insuranceClaims || [];
  const treatmentAgreements = data?.treatmentAgreements || [];
  
  // Sign treatment plan mutation
  const signPlanMutation = useMutation({
    mutationFn: async (signatureData: string) => {
      return await apiRequest(`/api/treatment-plans/${planId}/sign`, {
        method: 'POST',
        data: { signature: signatureData }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/treatment-plans/${planId}`] });
      toast({
        title: "Treatment plan signed",
        description: "Your signature has been saved.",
        variant: "default"
      });
      setIsSigningDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to sign treatment plan",
        variant: "destructive"
      });
    }
  });
  
  // Cancel treatment plan mutation
  const cancelPlanMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/treatment-plans/${planId}/cancel`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/treatment-plans/${planId}`] });
      toast({
        title: "Treatment plan cancelled",
        description: "The treatment plan has been cancelled.",
        variant: "default"
      });
      setIsConfirmingCancel(false);
      setLocation('/treatment-plans');
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel treatment plan",
        variant: "destructive"
      });
    }
  });
  
  // Handle signature save
  const handleSaveSignature = (signatureData: string) => {
    setSignature(signatureData);
    signPlanMutation.mutate(signatureData);
  };
  
  // Handle plan approval
  const handleApproveComplete = (planId: number) => {
    setIsApprovalDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: [`/api/treatment-plans/${planId}`] });
    toast({
      title: "Treatment Plan Approved",
      description: "The treatment plan has been approved and scheduled.",
      variant: "default"
    });
  };
  
  // If loading
  if (isLoading) {
    return (
      <div className="container max-w-4xl py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Treatment Plan Details</h1>
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center h-40">
              <Clock className="h-8 w-8 mb-4 text-muted-foreground animate-pulse" />
              <p className="text-muted-foreground">Loading treatment plan details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // If error
  if (error || !plan) {
    return (
      <div className="container max-w-4xl py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Treatment Plan Details</h1>
          <Button variant="outline" onClick={() => setLocation('/treatment-plans')}>
            Back to Treatment Plans
          </Button>
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center h-40">
              <AlertTriangle className="h-8 w-8 mb-4 text-destructive" />
              <p className="text-destructive font-medium">Failed to load treatment plan</p>
              <p className="text-muted-foreground mt-2">
                {(error as Error)?.message || "The treatment plan could not be found"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Extract procedures
  const procedures = Array.isArray(plan.procedures) 
    ? plan.procedures 
    : typeof plan.procedures === 'object' 
        ? Object.values(plan.procedures) 
        : [];
  
  // Calculate financial summary
  const totalCost = procedures.reduce((sum: number, proc: any) => sum + (proc.fee || 0), 0);
  const totalInsurance = procedures.reduce((sum: number, proc: any) => sum + (proc.insuranceCoverage || 0), 0);
  const totalPatient = procedures.reduce((sum: number, proc: any) => sum + (proc.patientResponsibility || 0), 0);
  
  // Calculate completed procedures
  const completedProcedures = procedures.filter((proc: any) => proc.completed).length;
  
  // Format status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'proposed':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Proposed</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Accepted</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Main render
  return (
    <div className="container max-w-4xl py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Treatment Plan Details</h1>
        <Button variant="outline" onClick={() => setLocation('/treatment-plans')}>
          Back to Treatment Plans
        </Button>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">
                {plan.planName || `Treatment Plan #${plan.id}`} 
                {plan.planType && (
                  <Badge className="ml-2" variant="secondary">
                    {plan.planType.charAt(0).toUpperCase() + plan.planType.slice(1)}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-1 text-base">{plan.diagnosis}</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusBadge(plan.status)}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Treatment Information</h3>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Created Date</Label>
                  <div className="font-medium flex items-center mt-1">
                    <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                    {new Date(plan.createdAt).toLocaleDateString()}
                  </div>
                </div>
                
                {plan.signedByPatient && (
                  <div>
                    <Label className="text-muted-foreground">Signed Date</Label>
                    <div className="font-medium flex items-center mt-1">
                      <PenTool className="h-4 w-4 mr-1 text-muted-foreground" />
                      {plan.patientSignatureDate 
                        ? new Date(plan.patientSignatureDate).toLocaleDateString()
                        : 'Unknown date'}
                    </div>
                  </div>
                )}
                
                <div>
                  <Label className="text-muted-foreground">Patient ID</Label>
                  <div className="font-medium mt-1">#{plan.patientId}</div>
                </div>
                
                <div>
                  <Label className="text-muted-foreground">Doctor ID</Label>
                  <div className="font-medium mt-1">#{plan.doctorId}</div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-4">Financial Summary</h3>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Total Cost</Label>
                  <div className="font-medium text-xl mt-1">${totalCost.toFixed(2)}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Insurance Coverage</Label>
                    <div className="font-medium mt-1">${totalInsurance.toFixed(2)}</div>
                  </div>
                  
                  <div>
                    <Label className="text-muted-foreground">Patient Responsibility</Label>
                    <div className="font-medium mt-1">${totalPatient.toFixed(2)}</div>
                  </div>
                </div>
                
                <div>
                  <Label className="text-muted-foreground">Completion Status</Label>
                  <div className="font-medium mt-1">
                    {completedProcedures} of {procedures.length} procedures completed
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <Separator className="my-6" />
          
          <h3 className="text-lg font-medium mb-4">Procedures ({procedures.length})</h3>
          
          <div className="border rounded-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3 text-left">Procedure</th>
                  <th className="p-3 text-right">Fee</th>
                  <th className="p-3 text-right">Insurance</th>
                  <th className="p-3 text-right">Patient Cost</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {procedures.map((procedure: any, index: number) => (
                  <tr key={index} className="border-t">
                    <td className="p-3">
                      <div className="font-medium">{procedure.description}</div>
                      <div className="text-xs text-muted-foreground">{procedure.code}</div>
                    </td>
                    <td className="p-3 text-right">${procedure.fee?.toFixed(2) || '0.00'}</td>
                    <td className="p-3 text-right">${procedure.insuranceCoverage?.toFixed(2) || '0.00'}</td>
                    <td className="p-3 text-right">${procedure.patientResponsibility?.toFixed(2) || '0.00'}</td>
                    <td className="p-3 text-center">
                      {procedure.completed ? (
                        <span className="inline-flex items-center text-green-700">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Completed
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/50">
                <tr>
                  <td className="p-3 font-medium">Total</td>
                  <td className="p-3 text-right font-medium">${totalCost.toFixed(2)}</td>
                  <td className="p-3 text-right font-medium">${totalInsurance.toFixed(2)}</td>
                  <td className="p-3 text-right font-medium">${totalPatient.toFixed(2)}</td>
                  <td className="p-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          {treatmentAgreements.length > 0 && (
            <>
              <Separator className="my-6" />
              
              <h3 className="text-lg font-medium mb-4">Treatment Agreements</h3>
              
              <div className="space-y-3">
                {treatmentAgreements.map((agreement: any) => (
                  <Card key={agreement.id}>
                    <CardContent className="p-4 flex justify-between items-center">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{agreement.title}</div>
                          <div className="text-xs text-muted-foreground">
                            Signed: {agreement.patientSignatureDate 
                              ? new Date(agreement.patientSignatureDate).toLocaleDateString() 
                              : 'Not signed'}
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row sm:justify-between gap-3 pt-6">
          {plan.status === 'proposed' && (
            <>
              <Button variant="outline" onClick={() => setIsConfirmingCancel(true)}>
                Cancel Plan
              </Button>
              
              <div className="flex gap-3">
                {!plan.signedByPatient && (
                  <Button 
                    variant="secondary" 
                    className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                    onClick={() => setIsSigningDialogOpen(true)}
                  >
                    <PenTool className="h-4 w-4 mr-2" />
                    Sign Plan
                  </Button>
                )}
                
                <Button 
                  onClick={() => setIsApprovalDialogOpen(true)}
                  disabled={plan.signedByPatient}
                >
                  Approve Plan
                </Button>
              </div>
            </>
          )}
          
          {plan.status === 'accepted' && (
            <>
              <Button variant="outline" onClick={() => setLocation(`/treatment-plans/${plan.id}/print`)}>
                <FileText className="h-4 w-4 mr-2" />
                Print Plan
              </Button>
              
              <Button onClick={() => setLocation(`/treatment-plans/${plan.id}/schedule`)}>
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Appointments
              </Button>
            </>
          )}
          
          {plan.status === 'in_progress' && (
            <>
              <Button variant="outline" onClick={() => setLocation(`/treatment-plans/${plan.id}/print`)}>
                <FileText className="h-4 w-4 mr-2" />
                Print Plan
              </Button>
              
              <Button onClick={() => setLocation(`/appointments?treatment=${plan.id}`)}>
                <Calendar className="h-4 w-4 mr-2" />
                View Appointments
              </Button>
            </>
          )}
          
          {plan.status === 'completed' && (
            <>
              <Button variant="outline" onClick={() => setLocation(`/treatment-plans/${plan.id}/print`)}>
                <FileText className="h-4 w-4 mr-2" />
                Print Plan
              </Button>
              
              <Button variant="secondary" onClick={() => setLocation(`/insurance-claims?treatment=${plan.id}`)}>
                <DollarSign className="h-4 w-4 mr-2" />
                View Insurance Claims
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
      
      {/* Appointments Section (if any) */}
      {appointments.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">Scheduled Appointments</CardTitle>
            <CardDescription>Appointments related to this treatment plan</CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-3">
              {appointments.map((appointment: any) => (
                <Card key={appointment.id}>
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <div className="font-medium">
                        {new Date(appointment.date).toLocaleDateString()} 
                        {' '}at{' '}
                        {new Date(appointment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {appointment.type.charAt(0).toUpperCase() + appointment.type.slice(1)}
                        {appointment.procedureCode && ` - ${appointment.procedureCode}`}
                      </div>
                    </div>
                    <Badge>{appointment.status}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Insurance Claims Section (if any) */}
      {insuranceClaims.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Insurance Claims</CardTitle>
            <CardDescription>Insurance claims related to this treatment plan</CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-3">
              {insuranceClaims.map((claim: any) => (
                <Card key={claim.id}>
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <div className="font-medium">
                        Claim #{claim.claimNumber || claim.id}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Submitted: {new Date(claim.submissionDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <Badge className="mb-1">
                        {claim.status.split('_').map((word: string) => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </Badge>
                      <span className="text-sm">${claim.approvedAmount?.toFixed(2) || '0.00'}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Signature Dialog */}
      <Dialog open={isSigningDialogOpen} onOpenChange={setIsSigningDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign Treatment Plan</DialogTitle>
          </DialogHeader>
          
          <SignaturePad
            onSave={handleSaveSignature}
            onCancel={() => setIsSigningDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Approval Dialog */}
      <Dialog 
        open={isApprovalDialogOpen} 
        onOpenChange={setIsApprovalDialogOpen}
        modal={true}
      >
        <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Approve Treatment Plan</DialogTitle>
          </DialogHeader>
          
          <TreatmentPlanApproval
            plan={plan}
            patientId={plan.patientId}
            onApproved={handleApproveComplete}
            onCancel={() => setIsApprovalDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Confirm Cancel Dialog */}
      <AlertDialog open={isConfirmingCancel} onOpenChange={setIsConfirmingCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Treatment Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this treatment plan? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, Keep Plan</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => cancelPlanMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Cancel Plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}