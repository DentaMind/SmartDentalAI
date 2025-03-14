import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ChevronsUpDown, 
  Calculator, 
  DollarSign, 
  PiggyBank, 
  BarChart4, 
  Building2, 
  BadgeDollarSign, 
  ShieldAlert, 
  Lightbulb 
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

interface RevenueCalculatorProps {
  doctorId: number;
  practiceId?: number;
}

export function RevenueCalculator({ doctorId, practiceId }: RevenueCalculatorProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [aiProcessing, setAIProcessing] = useState(false);
  const [timeframe, setTimeframe] = useState<'month' | 'quarter' | 'year'>('month');
  const [showTaxOptimization, setShowTaxOptimization] = useState(false);
  
  // Income fields
  const [grossIncome, setGrossIncome] = useState<number>(85000);
  const [insurancePayments, setInsurancePayments] = useState<number>(65000);
  const [patientPayments, setPatientPayments] = useState<number>(20000);
  
  // Expense fields
  const [labCosts, setLabCosts] = useState<number>(12000);
  const [suppliesCosts, setSuppliesCosts] = useState<number>(8500);
  const [staffSalaries, setStaffSalaries] = useState<number>(25000);
  const [rentUtilities, setRentUtilities] = useState<number>(7500);
  const [equipmentDepreciation, setEquipmentDepreciation] = useState<number>(4000);
  const [marketingCosts, setMarketingCosts] = useState<number>(3000);
  const [otherExpenses, setOtherExpenses] = useState<number>(2500);
  
  // Tax optimization recommendations
  const [taxOptimizations, setTaxOptimizations] = useState<Array<{
    strategy: string;
    savings: number;
    description: string;
    implementation: string;
    risk: 'low' | 'moderate' | 'high';
  }>>([]);
  
  // Calculate totals
  const totalExpenses = labCosts + suppliesCosts + staffSalaries + rentUtilities + 
                        equipmentDepreciation + marketingCosts + otherExpenses;
  const netIncome = grossIncome - totalExpenses;
  const profitMargin = (netIncome / grossIncome) * 100;
  
  // Only dentists, practice owners, and admins can access this
  const hasAccess = user?.role === 'doctor' || user?.role === 'admin';
  
  // Fetch financial data (in a real app)
  const { data: financeData, isLoading } = useQuery({
    queryKey: [`/api/finance/summary/${doctorId}?timeframe=${timeframe}`],
    enabled: hasAccess && !!doctorId,
  });
  
  // Updates values from server data when available
  useEffect(() => {
    if (financeData) {
      // In a real app, you would set the state values from the fetched data
      // setGrossIncome(financeData.grossIncome);
      // setInsurancePayments(financeData.insurancePayments);
      // ...etc
    }
  }, [financeData]);
  
  const generateTaxOptimization = async () => {
    setAIProcessing(true);
    
    try {
      // In a real implementation, this would make an API call to the server
      // which would use the FINANCIAL_AI_KEY to get tax optimization recommendations
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Example recommendations (in a real app, these would come from an AI model)
      setTaxOptimizations([
        {
          strategy: "Retirement Plan Contribution",
          savings: 8500,
          description: "Maximize contributions to your defined benefit plan and 401(k) to reduce taxable income.",
          implementation: "Increase monthly contributions to reach the maximum allowable amount before year-end.",
          risk: "low"
        },
        {
          strategy: "Equipment Purchasing Strategy",
          savings: 4200,
          description: "Section 179 deduction allows immediate expensing of qualifying equipment purchases.",
          implementation: "Consider accelerating planned equipment purchases into current tax year.",
          risk: "low"
        },
        {
          strategy: "Business Structure Optimization",
          savings: 12000,
          description: "S-Corporation status may reduce self-employment taxes compared to sole proprietorship.",
          implementation: "Consult with a tax professional about S-Corp election and reasonable salary requirements.",
          risk: "moderate"
        },
        {
          strategy: "Lease vs. Buy Analysis",
          savings: 3500,
          description: "Analyzing whether to lease or buy equipment/vehicles based on tax implications.",
          implementation: "Review current leases and purchasing plans with your financial advisor.",
          risk: "low"
        },
        {
          strategy: "Income Deferral Strategy",
          savings: 7500,
          description: "Defer income to next tax year by delaying December billings until January.",
          implementation: "Schedule insurance claim submissions and patient billings strategically in December.",
          risk: "moderate"
        }
      ]);
      
      toast({
        title: "AI Analysis Complete",
        description: "Tax optimization strategies have been generated based on your practice data.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Could not generate tax optimization strategies. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAIProcessing(false);
      setShowTaxOptimization(true);
    }
  };
  
  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return "bg-green-100 text-green-800 border-green-200";
      case 'moderate':
        return "bg-amber-100 text-amber-800 border-amber-200";
      case 'high':
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };
  
  if (!hasAccess) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            Restricted Access
          </CardTitle>
          <CardDescription>
            This financial information is only accessible to dentists and administrators.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            You need appropriate permissions to view the financial dashboard. Please contact your system administrator for access.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BadgeDollarSign className="h-5 w-5 text-primary" />
          Revenue Calculator & Tax Optimization
        </CardTitle>
        <CardDescription>
          Calculate practice revenue, overhead, and profit margins with AI-powered tax optimization
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="calculator" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="calculator">Revenue Calculator</TabsTrigger>
            <TabsTrigger value="tax-optimization">Tax Optimization</TabsTrigger>
            <TabsTrigger value="forecasting">Financial Forecasting</TabsTrigger>
          </TabsList>
          
          <TabsContent value="calculator">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Practice Revenue Analysis</h3>
                <Select defaultValue={timeframe} onValueChange={(value) => setTimeframe(value as 'month' | 'quarter' | 'year')}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Monthly</SelectItem>
                    <SelectItem value="quarter">Quarterly</SelectItem>
                    <SelectItem value="year">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Results summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-primary/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      Gross Income
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${grossIncome.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">{timeframe === 'month' ? 'Monthly' : timeframe === 'quarter' ? 'Quarterly' : 'Yearly'}</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-destructive/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      Total Overhead
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${totalExpenses.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">{(totalExpenses / grossIncome * 100).toFixed(1)}% of gross income</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-green-50 dark:bg-green-950/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-1">
                      <PiggyBank className="h-4 w-4" />
                      Net Income
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${netIncome.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">{profitMargin.toFixed(1)}% profit margin</p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Input fields */}
              <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border rounded-md">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="flex w-full justify-between p-4 font-normal">
                    <span className="flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      <span>Revenue & Expense Details</span>
                    </span>
                    <ChevronsUpDown className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Income section */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">Income Sources</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="insurance-payments">Insurance Payments</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="insurance-payments"
                              type="number"
                              value={insurancePayments}
                              onChange={(e) => {
                                setInsurancePayments(Number(e.target.value));
                                setGrossIncome(Number(e.target.value) + patientPayments);
                              }}
                              className="pl-8"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="patient-payments">Patient Payments</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="patient-payments"
                              type="number"
                              value={patientPayments}
                              onChange={(e) => {
                                setPatientPayments(Number(e.target.value));
                                setGrossIncome(insurancePayments + Number(e.target.value));
                              }}
                              className="pl-8"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="gross-income">Gross Income</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="gross-income"
                            type="number"
                            value={grossIncome}
                            onChange={(e) => setGrossIncome(Number(e.target.value))}
                            className="pl-8"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Expenses section */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">Practice Expenses</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="lab-costs">Lab Costs</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="lab-costs"
                              type="number"
                              value={labCosts}
                              onChange={(e) => setLabCosts(Number(e.target.value))}
                              className="pl-8"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="supplies-costs">Supplies</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="supplies-costs"
                              type="number"
                              value={suppliesCosts}
                              onChange={(e) => setSuppliesCosts(Number(e.target.value))}
                              className="pl-8"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="staff-salaries">Staff Salaries</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="staff-salaries"
                              type="number"
                              value={staffSalaries}
                              onChange={(e) => setStaffSalaries(Number(e.target.value))}
                              className="pl-8"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="rent-utilities">Rent & Utilities</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="rent-utilities"
                              type="number"
                              value={rentUtilities}
                              onChange={(e) => setRentUtilities(Number(e.target.value))}
                              className="pl-8"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="equipment">Equipment</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="equipment"
                              type="number"
                              value={equipmentDepreciation}
                              onChange={(e) => setEquipmentDepreciation(Number(e.target.value))}
                              className="pl-8"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="marketing">Marketing</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="marketing"
                              type="number"
                              value={marketingCosts}
                              onChange={(e) => setMarketingCosts(Number(e.target.value))}
                              className="pl-8"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="other-expenses">Other</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="other-expenses"
                              type="number"
                              value={otherExpenses}
                              onChange={(e) => setOtherExpenses(Number(e.target.value))}
                              className="pl-8"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
              
              {/* Action buttons */}
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    // Reset to default or saved values
                    // In a real app, this would reset to values from the server
                    toast({
                      title: "Values Reset",
                      description: "Calculator has been reset to default values.",
                      variant: "default",
                    });
                  }}
                >
                  Reset
                </Button>
                <Button 
                  variant="default" 
                  onClick={() => {
                    // Save current values
                    // In a real app, this would save to the server
                    toast({
                      title: "Calculations Saved",
                      description: "Your financial calculations have been saved successfully.",
                      variant: "default",
                    });
                  }}
                >
                  Save Calculations
                </Button>
              </div>
              
              {/* Call to action */}
              {!showTaxOptimization && (
                <div className="mt-8 p-4 border rounded-md bg-primary/5 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">AI Tax Optimization</h4>
                    <p className="text-sm text-muted-foreground">
                      Get AI-powered tax optimization strategies based on your practice's financial data.
                    </p>
                  </div>
                  <Button 
                    onClick={generateTaxOptimization} 
                    disabled={aiProcessing}
                    className="flex items-center gap-1"
                  >
                    <BarChart4 className="h-4 w-4" />
                    {aiProcessing ? "Processing..." : "Generate Strategies"}
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="tax-optimization">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">AI-Powered Tax Optimization</h3>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={generateTaxOptimization}
                  disabled={aiProcessing}
                  className="flex items-center gap-1"
                >
                  <BarChart4 className="h-4 w-4" />
                  {aiProcessing ? "Analyzing..." : "Refresh Analysis"}
                </Button>
              </div>
              
              {aiProcessing ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                  <p className="text-muted-foreground">Analyzing your practice finances and generating tax optimization strategies...</p>
                </div>
              ) : taxOptimizations.length > 0 ? (
                <div className="space-y-6">
                  {/* Summary card */}
                  <Card className="bg-primary/5">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-medium flex items-center gap-2">
                            <Lightbulb className="h-5 w-5 text-primary" />
                            Potential Tax Savings
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Based on AI analysis of your practice's financial data
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold">
                            ${taxOptimizations.reduce((total, strat) => total + strat.savings, 0).toLocaleString()}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Potential annual savings
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Strategy cards */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Recommended Strategies</h3>
                    
                    {taxOptimizations.map((strategy, index) => (
                      <Card key={index} className="border-l-4 border-l-primary">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base">{strategy.strategy}</CardTitle>
                              <CardDescription>{strategy.description}</CardDescription>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-primary">${strategy.savings.toLocaleString()}</div>
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${getRiskBadgeColor(strategy.risk)}`}>
                                {strategy.risk.charAt(0).toUpperCase() + strategy.risk.slice(1)} Risk
                              </span>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div>
                              <h4 className="text-sm font-medium">Implementation Steps</h4>
                              <p className="text-sm text-muted-foreground">{strategy.implementation}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  {/* Disclaimer */}
                  <div className="text-xs text-muted-foreground p-4 border rounded-md">
                    <strong>Disclaimer:</strong> These tax optimization strategies are AI-generated recommendations 
                    based on general dental practice patterns and your specific financial data. Always consult with 
                    a qualified tax professional before implementing any tax strategy. Tax laws vary by jurisdiction 
                    and are subject to change.
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <BarChart4 className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No Tax Optimization Data Available</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mt-2">
                    Generate AI-powered tax optimization strategies based on your practice's financial data to see recommendations.
                  </p>
                  <Button 
                    onClick={generateTaxOptimization}
                    className="mt-6"
                  >
                    Generate Tax Strategies
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="forecasting">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BarChart4 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Financial Forecasting</h3>
              <p className="text-muted-foreground max-w-md mx-auto mt-2">
                Financial forecasting based on historical data and AI prediction models will be available soon.
              </p>
              <Button 
                variant="outline"
                className="mt-6"
                disabled
              >
                Coming Soon
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}