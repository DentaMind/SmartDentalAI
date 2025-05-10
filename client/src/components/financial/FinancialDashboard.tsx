import React, { useState, useEffect } from 'react';
import { PatientAPI } from '../../lib/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Button,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../ui/components';
import {
  DollarSign,
  FileText,
  CreditCard,
  Calendar,
  AlertCircle,
  Check,
  Clock,
  Download,
  Printer,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface FinancialDashboardProps {
  patientId: string;
}

interface InsuranceClaim {
  id: string;
  date_submitted: string;
  procedure_code: string;
  description: string;
  amount: number;
  insurance_paid: number;
  patient_portion: number;
  status: 'pending' | 'approved' | 'denied' | 'partial';
}

interface Payment {
  id: string;
  date: string;
  amount: number;
  method: string;
  reference: string;
  description: string;
}

interface TreatmentPlan {
  id: string;
  name: string;
  status: string;
  created_at: string;
  total_cost: number;
  insurance_portion: number;
  patient_portion: number;
  procedures: Array<{
    id: string;
    code: string;
    description: string;
    tooth_number?: string;
    surfaces?: string[];
    status: string;
    estimated_cost: number;
    insurance_coverage: number;
    patient_portion: number;
    scheduled_date?: string;
  }>;
}

export const FinancialDashboard: React.FC<FinancialDashboardProps> = ({
  patientId
}) => {
  // State for financial data
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const [activeTreatmentPlan, setActiveTreatmentPlan] = useState<string | null>(null);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('90days');
  
  // Summary calculations
  const [totalBilled, setTotalBilled] = useState(0);
  const [totalInsurancePaid, setTotalInsurancePaid] = useState(0);
  const [totalPatientPaid, setTotalPatientPaid] = useState(0);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  
  // Load financial data
  useEffect(() => {
    const fetchFinancialData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch treatment plans
        const treatmentPlansData = await PatientAPI.getPatientTreatmentPlans(patientId);
        setTreatmentPlans(treatmentPlansData);
        
        if (treatmentPlansData.length > 0) {
          // Set the first active treatment plan as default
          const activePlan = treatmentPlansData.find(plan => plan.status === 'active');
          setActiveTreatmentPlan(activePlan?.id || treatmentPlansData[0].id);
        }
        
        // Mock data for claims and payments (in a real app, these would come from the API)
        const mockClaims: InsuranceClaim[] = [
          {
            id: 'claim-001',
            date_submitted: '2023-06-01',
            procedure_code: 'D2150',
            description: 'Amalgam - two surfaces, primary or permanent',
            amount: 195.00,
            insurance_paid: 156.00,
            patient_portion: 39.00,
            status: 'approved'
          },
          {
            id: 'claim-002',
            date_submitted: '2023-05-15',
            procedure_code: 'D1110',
            description: 'Prophylaxis - adult',
            amount: 120.00,
            insurance_paid: 120.00,
            patient_portion: 0.00,
            status: 'approved'
          },
          {
            id: 'claim-003',
            date_submitted: '2023-06-15',
            procedure_code: 'D0220',
            description: 'Intraoral - periapical first radiographic image',
            amount: 45.00,
            insurance_paid: 0.00,
            patient_portion: 45.00,
            status: 'pending'
          }
        ];
        
        const mockPayments: Payment[] = [
          {
            id: 'payment-001',
            date: '2023-06-01',
            amount: 39.00,
            method: 'Credit Card',
            reference: 'CC-12345',
            description: 'Co-pay for amalgam filling'
          },
          {
            id: 'payment-002',
            date: '2023-05-15',
            amount: 25.00,
            method: 'Cash',
            reference: 'CASH-123',
            description: 'Partial payment for cleaning'
          }
        ];
        
        setClaims(mockClaims);
        setPayments(mockPayments);
        
        // Calculate summary totals
        const total = mockClaims.reduce((sum, claim) => sum + claim.amount, 0);
        const insurancePaid = mockClaims.reduce((sum, claim) => sum + claim.insurance_paid, 0);
        const patientPaid = mockPayments.reduce((sum, payment) => sum + payment.amount, 0);
        const outstanding = total - insurancePaid - patientPaid;
        
        setTotalBilled(total);
        setTotalInsurancePaid(insurancePaid);
        setTotalPatientPaid(patientPaid);
        setTotalOutstanding(outstanding);
        
      } catch (err) {
        console.error('Error loading financial data:', err);
        setError('Failed to load financial information');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFinancialData();
  }, [patientId]);
  
  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  // Get claim status badge style
  const getClaimStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'denied':
        return <Badge className="bg-red-100 text-red-800">Denied</Badge>;
      case 'partial':
        return <Badge className="bg-blue-100 text-blue-800">Partial</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  // Find the active treatment plan
  const getActivePlan = (): TreatmentPlan | undefined => {
    if (!activeTreatmentPlan) return undefined;
    return treatmentPlans.find(plan => plan.id === activeTreatmentPlan);
  };
  
  // Calculate procedure status counts for the active plan
  const getProcedureStatusCounts = () => {
    const plan = getActivePlan();
    if (!plan) return { completed: 0, planned: 0, inProgress: 0 };
    
    return plan.procedures.reduce(
      (counts, procedure) => {
        switch (procedure.status.toLowerCase()) {
          case 'completed':
            counts.completed += 1;
            break;
          case 'planned':
            counts.planned += 1;
            break;
          case 'in_progress':
            counts.inProgress += 1;
            break;
        }
        return counts;
      },
      { completed: 0, planned: 0, inProgress: 0 }
    );
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <Card className="w-full h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-blue-500 border-b-blue-500 border-l-transparent border-r-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading financial data...</p>
        </div>
      </Card>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Card className="w-full h-96 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="mt-4 text-gray-600">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Financial Dashboard</CardTitle>
            <CardDescription>
              Financial overview and insurance claims
            </CardDescription>
          </div>
          
          <div className="flex items-center space-x-2">
            <Select
              value={dateRange}
              onValueChange={setDateRange}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="icon"
              title="Print Statement"
            >
              <Printer className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              title="Download Statement"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="claims">Insurance Claims</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="treatment">Treatment Plans</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Billed</p>
                      <p className="text-2xl font-bold">{formatCurrency(totalBilled)}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Insurance Paid</p>
                      <p className="text-2xl font-bold">{formatCurrency(totalInsurancePaid)}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                      <Check className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Patient Paid</p>
                      <p className="text-2xl font-bold">{formatCurrency(totalPatientPaid)}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Outstanding</p>
                      <p className="text-2xl font-bold">{formatCurrency(totalOutstanding)}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Recent Claims</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Procedure</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {claims.slice(0, 3).map(claim => (
                      <TableRow key={claim.id}>
                        <TableCell>{new Date(claim.date_submitted).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="font-medium">{claim.procedure_code}</div>
                          <div className="text-sm text-gray-500">{claim.description}</div>
                        </TableCell>
                        <TableCell>{formatCurrency(claim.amount)}</TableCell>
                        <TableCell>{getClaimStatusBadge(claim.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-2 text-right">
                  <Button variant="link" onClick={() => setActiveTab('claims')}>
                    View all claims
                  </Button>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-3">Recent Payments</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.slice(0, 3).map(payment => (
                      <TableRow key={payment.id}>
                        <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                        <TableCell>{payment.method}</TableCell>
                        <TableCell>{payment.description}</TableCell>
                        <TableCell className="text-green-600">{formatCurrency(payment.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-2 text-right">
                  <Button variant="link" onClick={() => setActiveTab('payments')}>
                    View all payments
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="claims" className="mt-0">
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-medium">Insurance Claims</h3>
              <Button>
                Submit New Claim
              </Button>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Procedure</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Insurance Paid</TableHead>
                  <TableHead>Patient Portion</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {claims.map(claim => (
                  <TableRow key={claim.id}>
                    <TableCell>{new Date(claim.date_submitted).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="font-medium">{claim.procedure_code}</div>
                      <div className="text-sm text-gray-500">{claim.description}</div>
                    </TableCell>
                    <TableCell>{formatCurrency(claim.amount)}</TableCell>
                    <TableCell>{formatCurrency(claim.insurance_paid)}</TableCell>
                    <TableCell>{formatCurrency(claim.patient_portion)}</TableCell>
                    <TableCell>{getClaimStatusBadge(claim.status)}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
          
          <TabsContent value="payments" className="mt-0">
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-medium">Payment History</h3>
              <Button>
                Record Payment
              </Button>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map(payment => (
                  <TableRow key={payment.id}>
                    <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-green-600">{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>{payment.method}</TableCell>
                    <TableCell>{payment.reference}</TableCell>
                    <TableCell>{payment.description}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        Receipt
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
          
          <TabsContent value="treatment" className="mt-0">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium">Treatment Plans</h3>
                <Button>
                  Create New Plan
                </Button>
              </div>
              
              {treatmentPlans.length > 0 ? (
                <div className="mb-4">
                  <Select
                    value={activeTreatmentPlan || ''}
                    onValueChange={setActiveTreatmentPlan}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select treatment plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {treatmentPlans.map(plan => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} ({plan.status})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <Card className="mb-4">
                  <CardContent className="py-6">
                    <div className="text-center">
                      <FileText className="h-12 w-12 text-gray-300 mx-auto" />
                      <p className="mt-2 text-gray-500">No treatment plans available</p>
                      <Button className="mt-4">
                        Create Treatment Plan
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {getActivePlan() && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Total Cost</p>
                            <p className="text-2xl font-bold">{formatCurrency(getActivePlan()?.total_cost || 0)}</p>
                          </div>
                          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <DollarSign className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Insurance Portion</p>
                            <p className="text-2xl font-bold">{formatCurrency(getActivePlan()?.insurance_portion || 0)}</p>
                          </div>
                          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                            <ArrowDownRight className="h-6 w-6 text-green-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Patient Portion</p>
                            <p className="text-2xl font-bold">{formatCurrency(getActivePlan()?.patient_portion || 0)}</p>
                          </div>
                          <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                            <ArrowUpRight className="h-6 w-6 text-yellow-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-md font-medium mb-2">Procedures</h4>
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Tooth/Surface</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Insurance</TableHead>
                          <TableHead>Patient</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getActivePlan()?.procedures.map(procedure => (
                          <TableRow key={procedure.id}>
                            <TableCell>{procedure.code}</TableCell>
                            <TableCell>{procedure.description}</TableCell>
                            <TableCell>
                              {procedure.tooth_number ? `#${procedure.tooth_number}` : ''}
                              {procedure.surfaces?.length ? ` (${procedure.surfaces.join('')})` : ''}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  procedure.status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : procedure.status === 'in_progress'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                                }
                              >
                                {procedure.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatCurrency(procedure.estimated_cost)}</TableCell>
                            <TableCell>{formatCurrency(procedure.insurance_coverage)}</TableCell>
                            <TableCell>{formatCurrency(procedure.patient_portion)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}; 