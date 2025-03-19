import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { InsuranceVerificationStatusType } from "@shared/schema";
import { Loader2 } from "lucide-react";

export type VerificationStatus = InsuranceVerificationStatusType;

interface InsuranceVerification {
  id: number;
  patientId: number;
  appointmentId?: number;
  patientName: string;
  insuranceProvider: string;
  insuranceMemberId: string;
  verificationDate: string;
  expirationDate?: string;
  status: VerificationStatus;
  coverage?: any;
  verifiedBy: number;
  notes?: string;
}

export function InsuranceVerificationDashboard() {
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  
  // Get all active insurance verifications
  const { data: activeVerifications, isLoading, error, refetch } = useQuery({
    queryKey: ['/insurance/active-verifications'],
    refetchInterval: 60000, // Refresh every minute
  });

  // Mutation for initiating a verification
  const verifyMutation = useMutation({
    mutationFn: async (patientId: number) => {
      return apiRequest(`/insurance/status-check`, {
        method: 'POST',
        body: JSON.stringify({ patientId }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Insurance verification initiated",
        description: "The verification process has been started.",
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Verification failed",
        description: error.message || "Could not initiate insurance verification",
        variant: "destructive",
      });
    },
  });

  // Function to initiate a verification
  const initiateVerification = (patientId: number) => {
    verifyMutation.mutate(patientId);
  };

  // Format verification status for display
  const formatStatus = (status: VerificationStatus) => {
    const statusMap: Record<VerificationStatus, { label: string, variant: "default" | "secondary" | "destructive" | "outline" }> = {
      "pending": { label: "Pending", variant: "secondary" },
      "in_progress": { label: "In Progress", variant: "default" },
      "verified": { label: "Verified", variant: "default" },
      "expired": { label: "Expired", variant: "destructive" },
      "inactive": { label: "Inactive", variant: "outline" },
    };
    
    const { label, variant } = statusMap[status] || { label: status, variant: "outline" };
    return <Badge variant={variant}>{label}</Badge>;
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  
  if (error) return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center text-destructive">
          Error loading insurance verifications: {(error as Error).message}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Insurance Verification Dashboard</CardTitle>
        <CardDescription>
          Manage insurance eligibility checks and verification statuses
        </CardDescription>
      </CardHeader>
      
      <Tabs defaultValue="active">
        <div className="px-6">
          <TabsList>
            <TabsTrigger value="active">Active Verifications</TabsTrigger>
            <TabsTrigger value="history">Verification History</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="active" className="mt-0">
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Insurance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeVerifications?.length > 0 ? (
                  activeVerifications.map((verification: InsuranceVerification) => (
                    <TableRow key={verification.id}>
                      <TableCell>{verification.patientName}</TableCell>
                      <TableCell>{verification.insuranceProvider}</TableCell>
                      <TableCell>{formatStatus(verification.status)}</TableCell>
                      <TableCell>{new Date(verification.verificationDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {verification.expirationDate 
                          ? new Date(verification.expirationDate).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={verification.status === 'in_progress'}
                          onClick={() => initiateVerification(verification.patientId)}
                        >
                          {verification.status === 'in_progress' 
                            ? 'Checking...' 
                            : verification.status === 'pending' 
                              ? 'Verify Now' 
                              : 'Refresh'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No active verifications found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </TabsContent>
        
        <TabsContent value="history" className="mt-0">
          <CardContent>
            <div className="text-center py-4 text-muted-foreground">
              Verification history will be shown here
            </div>
          </CardContent>
        </TabsContent>
      </Tabs>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => refetch()}>
          Refresh
        </Button>
        <Button>Start New Verification</Button>
      </CardFooter>
    </Card>
  );
}