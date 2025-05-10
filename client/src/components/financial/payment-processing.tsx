import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  CreditCard, 
  FileText, 
  BanknoteIcon, 
  FileCheck, 
  Plus, 
  Calendar, 
  Building, 
  ArrowRight, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Receipt,
  Save,
  Search,
  User,
  Shield,
  Lock,
  BarChart
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from '@/components/ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface PaymentFormData {
  amount: string;
  paymentMethod: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  nameOnCard: string;
  saveCard: boolean;
  sendReceipt: boolean;
}

interface ClaimFormData {
  provider: string;
  serviceDate: string;
  procedureCodes: string[];
  totalAmount: string;
  subscriberId: string;
  groupNumber: string;
  claimNotes: string;
}

interface Patient {
  id: string;
  name: string;
  insuranceProvider: string | null;
  insuranceId: string | null;
  hasCreditCard: boolean;
  balance: number;
  treatments: string[];
}

export function PaymentProcessing() {
  const [activeTab, setActiveTab] = useState('payments');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [processingClaim, setProcessingClaim] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [paymentSuccessful, setPaymentSuccessful] = useState(false);
  const [claimSubmitted, setClaimSubmitted] = useState(false);
  const [newPaymentOpen, setNewPaymentOpen] = useState(false);
  const [newClaimOpen, setNewClaimOpen] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState<PaymentFormData>({
    amount: '',
    paymentMethod: 'credit-card',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: '',
    saveCard: true,
    sendReceipt: true
  });
  const [claimFormData, setClaimFormData] = useState<ClaimFormData>({
    provider: '',
    serviceDate: new Date().toISOString().split('T')[0],
    procedureCodes: ['D1110', 'D0120'],
    totalAmount: '',
    subscriberId: '',
    groupNumber: '',
    claimNotes: ''
  });
  
  const { toast } = useToast();
  
  // Mock patient data
  const patients: Patient[] = [
    {
      id: '1',
      name: 'John Doe',
      insuranceProvider: 'Delta Dental',
      insuranceId: 'DD123456789',
      hasCreditCard: true,
      balance: 425.75,
      treatments: ['Cleaning', 'X-Rays', 'Filling']
    },
    {
      id: '2',
      name: 'Jane Smith',
      insuranceProvider: 'Cigna Dental',
      insuranceId: 'CD987654321',
      hasCreditCard: false,
      balance: 1250.00,
      treatments: ['Root Canal', 'Crown']
    },
    {
      id: '3',
      name: 'Robert Johnson',
      insuranceProvider: null,
      insuranceId: null,
      hasCreditCard: true,
      balance: 180.50,
      treatments: ['Exam', 'Cleaning']
    },
    {
      id: '4',
      name: 'Sarah Williams',
      insuranceProvider: 'Aetna',
      insuranceId: 'AE567891234',
      hasCreditCard: true,
      balance: 0,
      treatments: []
    }
  ];
  
  // Mock payment transaction data
  const recentTransactions = [
    {
      id: 'tx-1',
      date: '2025-03-10',
      patientName: 'John Doe',
      amount: 125.00,
      method: 'Credit Card',
      status: 'Completed',
      type: 'Payment'
    },
    {
      id: 'tx-2',
      date: '2025-03-08',
      patientName: 'Jane Smith',
      amount: 750.00,
      method: 'Insurance',
      status: 'Pending',
      type: 'Claim'
    },
    {
      id: 'tx-3',
      date: '2025-03-05',
      patientName: 'Robert Johnson',
      amount: 180.50,
      method: 'Cash',
      status: 'Completed',
      type: 'Payment'
    },
    {
      id: 'tx-4',
      date: '2025-03-02',
      patientName: 'Jane Smith',
      amount: 450.00,
      method: 'Credit Card',
      status: 'Completed',
      type: 'Payment'
    },
    {
      id: 'tx-5',
      date: '2025-02-28',
      patientName: 'Sarah Williams',
      amount: 215.00,
      method: 'Insurance',
      status: 'Approved',
      type: 'Claim'
    }
  ];
  
  // Mock insurance claims data
  const insuranceClaims = [
    {
      id: 'claim-1',
      patientName: 'John Doe',
      provider: 'Delta Dental',
      amount: 875.00,
      submittedDate: '2025-03-01',
      status: 'Approved',
      paymentDate: '2025-03-10',
      paidAmount: 700.00
    },
    {
      id: 'claim-2',
      patientName: 'Jane Smith',
      provider: 'Cigna Dental',
      amount: 1500.00,
      submittedDate: '2025-03-08',
      status: 'Pending',
      paymentDate: null,
      paidAmount: null
    },
    {
      id: 'claim-3',
      patientName: 'Sarah Williams',
      provider: 'Aetna',
      amount: 215.00,
      submittedDate: '2025-02-25',
      status: 'Approved',
      paymentDate: '2025-02-28',
      paidAmount: 215.00
    },
    {
      id: 'claim-4',
      patientName: 'John Doe',
      provider: 'Delta Dental',
      amount: 350.00,
      submittedDate: '2025-02-15',
      status: 'Denied',
      paymentDate: null,
      paidAmount: null
    }
  ];
  
  // Process payment
  const handleProcessPayment = () => {
    if (!selectedPatient || !paymentFormData.amount) {
      toast({
        title: "Missing information",
        description: "Please select a patient and enter payment amount.",
        variant: "destructive"
      });
      return;
    }
    
    if (paymentFormData.paymentMethod === 'credit-card' && 
        (!paymentFormData.cardNumber || !paymentFormData.expiryDate || !paymentFormData.cvv)) {
      toast({
        title: "Missing card information",
        description: "Please enter all required credit card details.",
        variant: "destructive"
      });
      return;
    }
    
    setProcessingPayment(true);
    setProcessingProgress(0);
    
    // Simulate payment processing
    const interval = setInterval(() => {
      setProcessingProgress(prev => {
        const newProgress = prev + 10;
        
        if (newProgress >= 100) {
          clearInterval(interval);
          
          // Payment successful
          setTimeout(() => {
            setProcessingPayment(false);
            setPaymentSuccessful(true);
            
            toast({
              title: "Payment successful",
              description: `Payment of $${paymentFormData.amount} has been processed.`,
              variant: "default"
            });
            
            setNewPaymentOpen(false);
            
            // Reset form
            setTimeout(() => {
              setPaymentFormData({
                amount: '',
                paymentMethod: 'credit-card',
                cardNumber: '',
                expiryDate: '',
                cvv: '',
                nameOnCard: '',
                saveCard: true,
                sendReceipt: true
              });
              setPaymentSuccessful(false);
            }, 2000);
          }, 500);
          
          return 100;
        }
        
        return newProgress;
      });
    }, 250);
  };
  
  // Submit insurance claim
  const handleSubmitClaim = () => {
    if (!selectedPatient || !claimFormData.totalAmount || !claimFormData.provider) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    setProcessingClaim(true);
    setProcessingProgress(0);
    
    // Simulate claim submission process
    const interval = setInterval(() => {
      setProcessingProgress(prev => {
        const newProgress = prev + 7;
        
        if (newProgress >= 100) {
          clearInterval(interval);
          
          // Claim submitted successfully
          setTimeout(() => {
            setProcessingClaim(false);
            setClaimSubmitted(true);
            
            toast({
              title: "Claim submitted",
              description: `Insurance claim for $${claimFormData.totalAmount} has been submitted to ${claimFormData.provider}.`,
              variant: "default"
            });
            
            setNewClaimOpen(false);
            
            // Reset form
            setTimeout(() => {
              setClaimFormData({
                provider: '',
                serviceDate: new Date().toISOString().split('T')[0],
                procedureCodes: ['D1110', 'D0120'],
                totalAmount: '',
                subscriberId: '',
                groupNumber: '',
                claimNotes: ''
              });
              setClaimSubmitted(false);
            }, 2000);
          }, 500);
          
          return 100;
        }
        
        return newProgress;
      });
    }, 300);
  };
  
  // Get patient details
  const getSelectedPatient = () => {
    return patients.find(patient => patient.id === selectedPatient);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Payment & Insurance Management</h2>
          <p className="text-muted-foreground">
            Process payments and manage insurance claims
          </p>
        </div>
        
        <div className="flex gap-3">
          <Select
            value={selectedPatient || ''}
            onValueChange={setSelectedPatient}
          >
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Select patient" />
            </SelectTrigger>
            <SelectContent>
              {patients.map(patient => (
                <SelectItem key={patient.id} value={patient.id}>
                  {patient.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {selectedPatient && (
        <Card className="bg-muted/40">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div>
                <h3 className="font-semibold">{getSelectedPatient()?.name}</h3>
                {getSelectedPatient()?.insuranceProvider ? (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Insurance:</span> {getSelectedPatient()?.insuranceProvider} ({getSelectedPatient()?.insuranceId})
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No insurance on file</div>
                )}
              </div>
              
              <div className="flex flex-col md:items-end">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Balance Due:</span>
                  <span className="font-semibold text-lg">${getSelectedPatient()?.balance.toFixed(2)}</span>
                </div>
                {getSelectedPatient()?.hasCreditCard && (
                  <div className="text-xs flex items-center gap-1 mt-1">
                    <CreditCard className="h-3 w-3" />
                    <span>Card on file</span>
                  </div>
                )}
              </div>
            </div>
            
            {getSelectedPatient() && getSelectedPatient()?.balance > 0 && (
              <div className="flex gap-2 mt-4 justify-end">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    const patient = getSelectedPatient();
                    if (patient) {
                      setPaymentFormData({
                        ...paymentFormData,
                        amount: patient.balance.toFixed(2)
                      });
                      setNewPaymentOpen(true);
                    }
                  }}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay Balance
                </Button>
                {getSelectedPatient()?.insuranceProvider && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      const patient = getSelectedPatient();
                      if (patient) {
                        setClaimFormData({
                          ...claimFormData,
                          provider: patient.insuranceProvider || '',
                          subscriberId: patient.insuranceId || '',
                          totalAmount: patient.balance.toFixed(2)
                        });
                        setNewClaimOpen(true);
                      }
                    }}
                  >
                    <FileCheck className="h-4 w-4 mr-2" />
                    Submit to Insurance
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 md:w-auto md:inline-flex">
          <TabsTrigger value="payments">
            <DollarSign className="h-4 w-4 mr-2" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="insurance">
            <FileCheck className="h-4 w-4 mr-2" />
            Insurance
          </TabsTrigger>
          <TabsTrigger value="transactions">
            <Receipt className="h-4 w-4 mr-2" />
            Transactions
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="payments" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Process Payments</h3>
            
            <Dialog open={newPaymentOpen} onOpenChange={setNewPaymentOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Payment
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Process Payment</DialogTitle>
                  <DialogDescription>
                    Enter payment details to process a new payment
                  </DialogDescription>
                </DialogHeader>
                
                {paymentSuccessful ? (
                  <div className="py-6 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Payment Successful</h3>
                    <p className="text-muted-foreground mb-4">
                      Payment of ${paymentFormData.amount} has been processed successfully.
                    </p>
                    <div className="bg-muted p-3 rounded-md text-sm">
                      <div className="mb-2">Transaction Details:</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-muted-foreground">Amount:</div>
                        <div className="text-right">${paymentFormData.amount}</div>
                        <div className="text-muted-foreground">Patient:</div>
                        <div className="text-right">{getSelectedPatient()?.name}</div>
                        <div className="text-muted-foreground">Method:</div>
                        <div className="text-right">{paymentFormData.paymentMethod === 'credit-card' ? 'Credit Card' : 'Cash/Check'}</div>
                        <div className="text-muted-foreground">Date:</div>
                        <div className="text-right">{new Date().toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {processingPayment ? (
                      <div className="py-6 space-y-4">
                        <div className="text-center mb-4">
                          <h3 className="text-lg font-medium mb-2">Processing Payment</h3>
                          <p className="text-muted-foreground">Please wait while we process your payment...</p>
                        </div>
                        <Progress value={processingProgress} className="w-full" />
                        <div className="text-center text-sm text-muted-foreground">
                          {processingProgress < 30 ? "Connecting to payment gateway..." : 
                           processingProgress < 60 ? "Verifying card information..." :
                           processingProgress < 90 ? "Processing transaction..." : 
                           "Finalizing payment..."}
                        </div>
                      </div>
                    ) : (
                      <div className="py-4">
                        <div className="grid gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="amount">Payment Amount *</Label>
                            <div className="relative">
                              <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="amount"
                                type="text"
                                className="pl-8"
                                placeholder="0.00"
                                value={paymentFormData.amount}
                                onChange={(e) => setPaymentFormData({...paymentFormData, amount: e.target.value})}
                              />
                            </div>
                          </div>
                          
                          <div className="grid gap-2">
                            <Label htmlFor="payment-method">Payment Method *</Label>
                            <Select
                              value={paymentFormData.paymentMethod}
                              onValueChange={(value) => setPaymentFormData({...paymentFormData, paymentMethod: value})}
                            >
                              <SelectTrigger id="payment-method">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="credit-card">Credit/Debit Card</SelectItem>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="check">Check</SelectItem>
                                <SelectItem value="ach">Bank Transfer (ACH)</SelectItem>
                                <SelectItem value="carecredit">CareCredit</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {paymentFormData.paymentMethod === 'credit-card' && (
                            <>
                              <div className="grid gap-2">
                                <Label htmlFor="card-number">Card Number *</Label>
                                <Input
                                  id="card-number"
                                  placeholder="•••• •••• •••• ••••"
                                  value={paymentFormData.cardNumber}
                                  onChange={(e) => setPaymentFormData({...paymentFormData, cardNumber: e.target.value})}
                                />
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                  <Label htmlFor="expiry">Expiry Date *</Label>
                                  <Input
                                    id="expiry"
                                    placeholder="MM/YY"
                                    value={paymentFormData.expiryDate}
                                    onChange={(e) => setPaymentFormData({...paymentFormData, expiryDate: e.target.value})}
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="cvv">CVV *</Label>
                                  <Input
                                    id="cvv"
                                    placeholder="•••"
                                    value={paymentFormData.cvv}
                                    onChange={(e) => setPaymentFormData({...paymentFormData, cvv: e.target.value})}
                                  />
                                </div>
                              </div>
                              
                              <div className="grid gap-2">
                                <Label htmlFor="name">Name on Card *</Label>
                                <Input
                                  id="name"
                                  placeholder="John Doe"
                                  value={paymentFormData.nameOnCard}
                                  onChange={(e) => setPaymentFormData({...paymentFormData, nameOnCard: e.target.value})}
                                />
                              </div>
                              
                              <div className="flex items-center space-x-2 pt-2">
                                <Checkbox
                                  id="save-card"
                                  checked={paymentFormData.saveCard}
                                  onCheckedChange={(checked) => 
                                    setPaymentFormData({...paymentFormData, saveCard: checked as boolean})
                                  }
                                />
                                <label
                                  htmlFor="save-card"
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  Save card for future payments
                                </label>
                              </div>
                            </>
                          )}
                          
                          {paymentFormData.paymentMethod === 'check' && (
                            <div className="grid gap-2">
                              <Label htmlFor="check-number">Check Number *</Label>
                              <Input id="check-number" placeholder="Check #" />
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="send-receipt"
                              checked={paymentFormData.sendReceipt}
                              onCheckedChange={(checked) => 
                                setPaymentFormData({...paymentFormData, sendReceipt: checked as boolean})
                              }
                            />
                            <label
                              htmlFor="send-receipt"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Send receipt to patient email
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
                
                <DialogFooter>
                  {!paymentSuccessful && !processingPayment && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => setNewPaymentOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleProcessPayment}
                        disabled={!paymentFormData.amount}
                      >
                        Process Payment
                      </Button>
                    </>
                  )}
                  {paymentSuccessful && (
                    <Button onClick={() => setNewPaymentOpen(false)}>
                      Close
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Credit Card
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold">$5,425.50</p>
                  <p className="text-sm text-muted-foreground">Last 30 days</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">
                  <BanknoteIcon className="h-4 w-4 mr-2" />
                  Cash/Check
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold">$1,875.00</p>
                  <p className="text-sm text-muted-foreground">Last 30 days</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">
                  <Building className="h-4 w-4 mr-2" />
                  Insurance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold">$8,240.75</p>
                  <p className="text-sm text-muted-foreground">Last 30 days</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>
                Configure payment processing options and methods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Accordion type="single" collapsible>
                <AccordionItem value="card-processor">
                  <AccordionTrigger>
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 mr-2" />
                      Card Processing
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Badge className="mr-2">Active</Badge>
                          <span className="font-medium">Stripe</span>
                        </div>
                        <Button variant="outline" size="sm">Configure</Button>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <div className="flex items-start space-x-2">
                          <Lock className="h-4 w-4 mt-0.5" />
                          <span>Payment information is securely stored and processed in accordance with PCI compliance standards.</span>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="financing">
                  <AccordionTrigger>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Patient Financing
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <Badge className="mr-2">Active</Badge>
                          <span className="font-medium">CareCredit</span>
                        </div>
                        <Button variant="outline" size="sm">Configure</Button>
                      </div>
                      
                      <div className="flex justify-between items-center mt-3">
                        <div>
                          <Badge variant="outline" className="mr-2">Available</Badge>
                          <span className="font-medium">In-House Financing</span>
                        </div>
                        <Button variant="outline" size="sm">Enable</Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="recurring">
                  <AccordionTrigger>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Recurring Payments
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <div className="font-medium">Enable Recurring Payments</div>
                          <Checkbox defaultChecked id="enable-recurring" />
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          Allow patients to set up automated payments on a recurring schedule.
                        </p>
                        
                        <div className="pt-2">
                          <Button variant="outline" size="sm">Manage Payment Plans</Button>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="insurance" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Insurance Claims</h3>
            
            <Dialog open={newClaimOpen} onOpenChange={setNewClaimOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Claim
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                  <DialogTitle>Submit Insurance Claim</DialogTitle>
                  <DialogDescription>
                    Submit a new insurance claim for reimbursement
                  </DialogDescription>
                </DialogHeader>
                
                {claimSubmitted ? (
                  <div className="py-6 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Claim Submitted Successfully</h3>
                    <p className="text-muted-foreground mb-4">
                      The claim has been submitted to {claimFormData.provider} for processing.
                    </p>
                    <div className="bg-muted p-3 rounded-md text-sm">
                      <div className="mb-2">Claim Details:</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-muted-foreground">Amount:</div>
                        <div className="text-right">${claimFormData.totalAmount}</div>
                        <div className="text-muted-foreground">Patient:</div>
                        <div className="text-right">{getSelectedPatient()?.name}</div>
                        <div className="text-muted-foreground">Insurance:</div>
                        <div className="text-right">{claimFormData.provider}</div>
                        <div className="text-muted-foreground">Date:</div>
                        <div className="text-right">{new Date().toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {processingClaim ? (
                      <div className="py-6 space-y-4">
                        <div className="text-center mb-4">
                          <h3 className="text-lg font-medium mb-2">Processing Claim</h3>
                          <p className="text-muted-foreground">Please wait while we submit the insurance claim...</p>
                        </div>
                        <Progress value={processingProgress} className="w-full" />
                        <div className="text-center text-sm text-muted-foreground">
                          {processingProgress < 25 ? "Preparing claim data..." : 
                           processingProgress < 50 ? "Validating procedure codes..." :
                           processingProgress < 75 ? "Submitting to clearinghouse..." : 
                           "Finalizing submission..."}
                        </div>
                      </div>
                    ) : (
                      <div className="py-4">
                        <div className="grid gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="insurance-provider">Insurance Provider *</Label>
                            <Select
                              value={claimFormData.provider}
                              onValueChange={(value) => setClaimFormData({...claimFormData, provider: value})}
                            >
                              <SelectTrigger id="insurance-provider">
                                <SelectValue placeholder="Select provider" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Delta Dental">Delta Dental</SelectItem>
                                <SelectItem value="Cigna Dental">Cigna Dental</SelectItem>
                                <SelectItem value="Aetna">Aetna</SelectItem>
                                <SelectItem value="MetLife">MetLife</SelectItem>
                                <SelectItem value="Guardian">Guardian</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="grid gap-2">
                            <Label htmlFor="subscriber-id">Subscriber ID *</Label>
                            <Input
                              id="subscriber-id"
                              placeholder="Insurance Member ID"
                              value={claimFormData.subscriberId}
                              onChange={(e) => setClaimFormData({...claimFormData, subscriberId: e.target.value})}
                            />
                          </div>
                          
                          <div className="grid gap-2">
                            <Label htmlFor="group-number">Group Number</Label>
                            <Input
                              id="group-number"
                              placeholder="Insurance Group Number"
                              value={claimFormData.groupNumber}
                              onChange={(e) => setClaimFormData({...claimFormData, groupNumber: e.target.value})}
                            />
                          </div>
                          
                          <div className="grid gap-2">
                            <Label htmlFor="service-date">Date of Service *</Label>
                            <Input
                              id="service-date"
                              type="date"
                              value={claimFormData.serviceDate}
                              onChange={(e) => setClaimFormData({...claimFormData, serviceDate: e.target.value})}
                            />
                          </div>
                          
                          <div className="grid gap-2">
                            <Label>Procedure Codes *</Label>
                            <div className="flex flex-wrap gap-2">
                              {claimFormData.procedureCodes.map((code, index) => (
                                <Badge key={index} className="px-2 py-1">
                                  {code}
                                  <button 
                                    className="ml-2 text-xs" 
                                    onClick={() => {
                                      const newCodes = [...claimFormData.procedureCodes];
                                      newCodes.splice(index, 1);
                                      setClaimFormData({...claimFormData, procedureCodes: newCodes});
                                    }}
                                  >
                                    ×
                                  </button>
                                </Badge>
                              ))}
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  // In a real app, this would open a modal to select procedure codes
                                  setClaimFormData({
                                    ...claimFormData, 
                                    procedureCodes: [...claimFormData.procedureCodes, 'D2740']
                                  });
                                }}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add Code
                              </Button>
                            </div>
                          </div>
                          
                          <div className="grid gap-2">
                            <Label htmlFor="claim-amount">Claim Amount *</Label>
                            <div className="relative">
                              <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="claim-amount"
                                className="pl-8"
                                placeholder="0.00"
                                value={claimFormData.totalAmount}
                                onChange={(e) => setClaimFormData({...claimFormData, totalAmount: e.target.value})}
                              />
                            </div>
                          </div>
                          
                          <div className="grid gap-2">
                            <Label htmlFor="claim-notes">Notes</Label>
                            <Input
                              id="claim-notes"
                              placeholder="Additional information for this claim"
                              value={claimFormData.claimNotes}
                              onChange={(e) => setClaimFormData({...claimFormData, claimNotes: e.target.value})}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
                
                <DialogFooter>
                  {!claimSubmitted && !processingClaim && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => setNewClaimOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleSubmitClaim}
                        disabled={!claimFormData.provider || !claimFormData.totalAmount}
                      >
                        Submit Claim
                      </Button>
                    </>
                  )}
                  {claimSubmitted && (
                    <Button onClick={() => setNewClaimOpen(false)}>
                      Close
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {insuranceClaims.map(claim => (
                    <TableRow key={claim.id}>
                      <TableCell className="font-medium">{claim.patientName}</TableCell>
                      <TableCell>{claim.provider}</TableCell>
                      <TableCell>${claim.amount.toFixed(2)}</TableCell>
                      <TableCell>{new Date(claim.submittedDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge 
                          className={
                            claim.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' :
                            claim.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-red-50 text-red-700 border-red-200'
                          }
                        >
                          {claim.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <FileText className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View Details</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Real-Time Eligibility</CardTitle>
                <CardDescription>Verify patient insurance coverage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="check-eligibility">Patient Name / ID</Label>
                    <div className="flex gap-2">
                      <Input id="check-eligibility" placeholder="Enter patient name or ID" />
                      <Button>
                        <Search className="h-4 w-4 mr-2" />
                        Verify
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-muted p-3 rounded-md text-sm">
                    <p className="font-medium mb-2">Benefits at a Glance:</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Annual Maximum:</span>
                        <span className="font-medium">$1,500.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Used to Date:</span>
                        <span className="font-medium">$350.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Remaining:</span>
                        <span className="font-medium">$1,150.00</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span>Preventive Coverage:</span>
                        <span className="font-medium">100%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Basic Coverage:</span>
                        <span className="font-medium">80%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Major Coverage:</span>
                        <span className="font-medium">50%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Claim Analytics</CardTitle>
                <CardDescription>Understand your claims performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Approval Rate</p>
                      <p className="text-2xl font-bold">94.3%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Average Processing Time</p>
                      <p className="text-2xl font-bold">8.5 days</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Claims Pending</span>
                      <span className="font-medium">12</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Claims Approved</span>
                      <span className="font-medium">87</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Claims Denied</span>
                      <span className="font-medium">5</span>
                    </div>
                  </div>
                  
                  <Button variant="outline" className="w-full">
                    <BarChart className="h-4 w-4 mr-2" />
                    View Detailed Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                Recent payments and insurance claims
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map(transaction => (
                    <TableRow key={transaction.id}>
                      <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                      <TableCell>{transaction.patientName}</TableCell>
                      <TableCell>{transaction.type}</TableCell>
                      <TableCell>{transaction.method}</TableCell>
                      <TableCell>${transaction.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge 
                          className={
                            transaction.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' :
                            transaction.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            transaction.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' :
                            'bg-red-50 text-red-700 border-red-200'
                          }
                        >
                          {transaction.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}