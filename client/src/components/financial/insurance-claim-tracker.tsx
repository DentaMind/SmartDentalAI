
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import { api } from '@/lib/api';
import { Eye, RefreshCw, Send, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

interface InsuranceClaim {
  id: number;
  patientId: number;
  patientName?: string;
  claimNumber: string;
  insuranceProvider?: string;
  submissionDate: string;
  status: 'submitted' | 'pending' | 'approved' | 'denied' | 'partial';
  approvedAmount: number;
  denialReason?: string;
  expectedReimbursement?: number;
  procedures?: Array<{code: string, description: string, fee: number}>;
  notes?: string;
}

export function InsuranceClaimTracker() {
  const { toast } = useToast();
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewClaim, setViewClaim] = useState<InsuranceClaim | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  
  useEffect(() => {
    fetchClaims();
  }, []);
  
  const fetchClaims = async () => {
    setLoading(true);
    try {
      const response = await api.get('/insurance/claims');
      setClaims(response.data);
    } catch (error) {
      console.error('Failed to fetch insurance claims:', error);
      toast({
        title: 'Error',
        description: 'Failed to load insurance claims',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleCheckStatus = async (claimId: number) => {
    try {
      const response = await api.get(`/insurance/claims/${claimId}/status`);
      
      // Update the claim in the list
      setClaims(claims.map(claim => 
        claim.id === claimId ? { ...claim, ...response.data } : claim
      ));
      
      toast({
        title: 'Status Updated',
        description: `Claim status updated to ${response.data.status}`,
      });
    } catch (error) {
      console.error('Failed to check claim status:', error);
      toast({
        title: 'Error',
        description: 'Failed to check insurance claim status',
        variant: 'destructive'
      });
    }
  };
  
  const handleResendClaim = async (claimId: number) => {
    try {
      await api.post(`/insurance/claims/${claimId}/resend`);
      
      // Update the claim status in the list
      setClaims(claims.map(claim => 
        claim.id === claimId ? { ...claim, status: 'submitted' } : claim
      ));
      
      toast({
        title: 'Claim Resent',
        description: 'Insurance claim has been resent successfully',
      });
    } catch (error) {
      console.error('Failed to resend claim:', error);
      toast({
        title: 'Error',
        description: 'Failed to resend insurance claim',
        variant: 'destructive'
      });
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Submitted</Badge>;
      case 'pending':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'denied':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Denied</Badge>;
      case 'partial':
        return <Badge variant="warning"><AlertTriangle className="h-3 w-3 mr-1" />Partial</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const filteredClaims = activeTab === 'all' 
    ? claims 
    : claims.filter(claim => claim.status === activeTab);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Insurance Claims</h2>
        <Button onClick={fetchClaims}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Claims</TabsTrigger>
          <TabsTrigger value="submitted">Submitted</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="denied">Denied</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredClaims.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Claim Number</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Submission Date</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expected Amount</TableHead>
                      <TableHead>Approved Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClaims.map(claim => (
                      <TableRow key={claim.id}>
                        <TableCell className="font-medium">{claim.claimNumber}</TableCell>
                        <TableCell>{claim.patientName || `Patient #${claim.patientId}`}</TableCell>
                        <TableCell>{formatDate(new Date(claim.submissionDate))}</TableCell>
                        <TableCell>{claim.insuranceProvider || 'Unknown'}</TableCell>
                        <TableCell>{getStatusBadge(claim.status)}</TableCell>
                        <TableCell>${claim.expectedReimbursement?.toFixed(2) || 'N/A'}</TableCell>
                        <TableCell>${claim.approvedAmount.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setViewClaim(claim)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl">
                                {viewClaim && (
                                  <>
                                    <DialogHeader>
                                      <DialogTitle>Claim Details: {viewClaim.claimNumber}</DialogTitle>
                                    </DialogHeader>
                                    <div className="grid grid-cols-2 gap-4 py-4">
                                      <div>
                                        <h4 className="font-medium text-sm">Patient ID</h4>
                                        <p>{viewClaim.patientName || `Patient #${viewClaim.patientId}`}</p>
                                      </div>
                                      <div>
                                        <h4 className="font-medium text-sm">Insurance Provider</h4>
                                        <p>{viewClaim.insuranceProvider || 'Unknown'}</p>
                                      </div>
                                      <div>
                                        <h4 className="font-medium text-sm">Submission Date</h4>
                                        <p>{formatDate(new Date(viewClaim.submissionDate))}</p>
                                      </div>
                                      <div>
                                        <h4 className="font-medium text-sm">Status</h4>
                                        <p>{getStatusBadge(viewClaim.status)}</p>
                                      </div>
                                      <div>
                                        <h4 className="font-medium text-sm">Expected Reimbursement</h4>
                                        <p>${viewClaim.expectedReimbursement?.toFixed(2) || 'N/A'}</p>
                                      </div>
                                      <div>
                                        <h4 className="font-medium text-sm">Approved Amount</h4>
                                        <p>${viewClaim.approvedAmount.toFixed(2)}</p>
                                      </div>
                                    </div>
                                    
                                    {viewClaim.procedures && viewClaim.procedures.length > 0 && (
                                      <div className="mt-4">
                                        <h4 className="font-medium mb-2">Procedures</h4>
                                        <Table>
                                          <TableHeader>
                                            <TableRow>
                                              <TableHead>Code</TableHead>
                                              <TableHead>Description</TableHead>
                                              <TableHead className="text-right">Fee</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {viewClaim.procedures.map((proc, index) => (
                                              <TableRow key={index}>
                                                <TableCell>{proc.code}</TableCell>
                                                <TableCell>{proc.description}</TableCell>
                                                <TableCell className="text-right">${proc.fee.toFixed(2)}</TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      </div>
                                    )}
                                    
                                    {viewClaim.status === 'denied' && viewClaim.denialReason && (
                                      <div className="mt-4">
                                        <h4 className="font-medium text-sm text-red-500">Denial Reason</h4>
                                        <p className="text-red-500">{viewClaim.denialReason}</p>
                                      </div>
                                    )}
                                    
                                    {viewClaim.notes && (
                                      <div className="mt-4">
                                        <h4 className="font-medium text-sm">Notes</h4>
                                        <p>{viewClaim.notes}</p>
                                      </div>
                                    )}
                                  </>
                                )}
                              </DialogContent>
                            </Dialog>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCheckStatus(claim.id)}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            
                            {(claim.status === 'denied' || claim.status === 'partial') && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleResendClaim(claim.id)}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Claims Found</CardTitle>
                <CardDescription>
                  {activeTab === 'all' 
                    ? 'No insurance claims have been submitted yet.'
                    : `No ${activeTab} insurance claims found.`
                  }
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
