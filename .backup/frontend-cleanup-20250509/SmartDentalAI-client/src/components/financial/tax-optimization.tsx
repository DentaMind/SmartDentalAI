import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  CircleDollarSign,
  Receipt,
  FileArchive,
  Landmark,
  Building,
  Calculator,
  BarChart4,
  TrendingUp,
  Percent,
  ChevronRight,
  AlertTriangle,
  Check,
  Calendar,
  FileText,
  CreditCard,
  Inbox,
  Clock,
  PiggyBank,
  ArrowRight,
  Home,
  Shield
} from "lucide-react";
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";

interface TaxOptimizationProps {
  userId: number;
  restrictAccess?: boolean;
  currentYear?: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A288E3', '#FF6B6B'];

// This would typically come from your financial API or service
const generateDummyFinancialData = (year: number) => {
  const currentDate = new Date();
  const isCurrentYear = year === currentDate.getFullYear();
  const monthsToInclude = isCurrentYear ? currentDate.getMonth() + 1 : 12;
  
  // Base expenses to work with
  const baseExpenses = {
    rent: Math.round(3500 + Math.random() * 1000),
    utilities: Math.round(800 + Math.random() * 200),
    supplies: Math.round(2500 + Math.random() * 1000),
    labFees: Math.round(5000 + Math.random() * 2000),
    staffSalaries: Math.round(15000 + Math.random() * 3000),
    marketing: Math.round(1500 + Math.random() * 500),
    insurance: Math.round(2000 + Math.random() * 300),
    equipment: Math.round(1000 + Math.random() * 5000), // Higher variability for equipment
    software: Math.round(1000 + Math.random() * 200),
    professionalDues: Math.round(300 + Math.random() * 100),
  };
  
  const monthlyData = Array.from({ length: monthsToInclude }, (_, monthIndex) => {
    // Monthly variation factors (1-20% random variance)
    const variationFactors = {
      revenue: 1 + (Math.random() * 0.2 - 0.1), // -10% to +10%
      expenses: Object.keys(baseExpenses).reduce((acc, key) => {
        acc[key] = 1 + (Math.random() * 0.2 - 0.1); // -10% to +10%
        return acc;
      }, {} as Record<string, number>)
    };
    
    // Calculate monthly revenue (base + seasonal adjustments + variation)
    const seasonality = [0.9, 0.85, 0.95, 1.0, 1.05, 1.1, 1.15, 1.0, 0.95, 1.0, 0.95, 1.2]; // Monthly seasonality
    const baseRevenue = 40000; // Base monthly revenue
    const revenue = Math.round(baseRevenue * seasonality[monthIndex] * variationFactors.revenue);
    
    // Calculate expenses with variance
    const expenses = Object.entries(baseExpenses).reduce((acc, [key, value]) => {
      const factor = (variationFactors.expenses as any)[key];
      acc[key] = Math.round(value * factor);
      return acc;
    }, {} as Record<string, number>);
    
    // Calculate total expenses and net income
    const totalExpenses = Object.values(expenses).reduce((sum, value) => sum + value, 0);
    const netIncome = revenue - totalExpenses;
    
    // Tax calculations (simplified for demo)
    const estimatedTax = Math.round(netIncome * 0.3); // 30% tax rate
    const afterTaxIncome = netIncome - estimatedTax;
    
    return {
      month: monthIndex + 1,
      monthName: format(new Date(year, monthIndex, 1), 'MMM'),
      revenue,
      expenses: totalExpenses,
      ...expenses,
      netIncome,
      estimatedTax,
      afterTaxIncome,
    };
  });
  
  // Calculate totals and averages
  const totals = monthlyData.reduce((acc, month) => {
    Object.entries(month).forEach(([key, value]) => {
      if (typeof value === 'number' && key !== 'month') {
        acc[key] = (acc[key] || 0) + value;
      }
    });
    return acc;
  }, {} as Record<string, number>);
  
  // Calculate tax metrics
  const effectiveTaxRate = totals.revenue > 0 ? (totals.estimatedTax / totals.netIncome) * 100 : 0;
  
  // Potential tax savings
  const potentialSavings = {
    retirement: Math.round(totals.netIncome * 0.05), // 401(k) or SEP IRA contributions
    businessEntity: Math.round(totals.estimatedTax * 0.08), // S-Corp vs Sole Prop
    homeOffice: Math.round(totals.rent * 0.15), // Home office deduction
    equipmentDepreciation: Math.round(totals.equipment * 0.4), // Section 179 deduction
    vehicleExpenses: Math.round(totals.netIncome * 0.02), // Business vehicle use
    healthInsurance: Math.round(totals.netIncome * 0.03), // Self-employed health insurance
  };
  
  const totalPotentialSavings = Object.values(potentialSavings).reduce((sum, value) => sum + value, 0);
  
  // Return complete financial data
  return {
    year,
    monthlyData,
    totals,
    taxMetrics: {
      effectiveTaxRate,
      marginalTaxRate: 37, // Typical top bracket
      selfEmploymentTax: 15.3, // Standard SE tax
      estimatedYearlyTax: totals.estimatedTax,
      quarterlyPayments: Array(4).fill(0).map((_, i) => Math.round(totals.estimatedTax / 4))
    },
    potentialSavings,
    totalPotentialSavings,
    // Tax calendar events
    taxCalendar: [
      { date: `January 15, ${year + 1}`, event: 'Q4 Estimated Tax Payment Due', type: 'payment' },
      { date: `April 15, ${year + 1}`, event: 'Annual Tax Filing Deadline', type: 'filing' },
      { date: `April 15, ${year + 1}`, event: 'Q1 Estimated Tax Payment Due', type: 'payment' },
      { date: `June 15, ${year + 1}`, event: 'Q2 Estimated Tax Payment Due', type: 'payment' },
      { date: `September 15, ${year + 1}`, event: 'Q3 Estimated Tax Payment Due', type: 'payment' },
      { date: `December 31, ${year}`, event: 'Last Day for Tax-Deductible Expenses', type: 'planning' },
    ],
  };
};

// Mock AI recommendations based on financial data
const generateAIRecommendations = (financialData: any) => {
  const recommendations = [
    {
      id: 'retirement',
      title: 'Maximize Retirement Contributions',
      description: `Contributing the maximum to your retirement accounts can save approximately $${financialData.potentialSavings.retirement.toLocaleString()} in taxes.`,
      impact: 'high',
      steps: [
        'Set up a SEP IRA or Solo 401(k) if not already established',
        'Contribute up to $66,000 or 25% of income, whichever is less',
        'Consider backdoor Roth conversions for tax-free growth'
      ],
      saving: financialData.potentialSavings.retirement,
      implemented: false
    },
    {
      id: 'entity',
      title: 'Optimize Business Entity Structure',
      description: `Switching to an S-Corporation could save approximately $${financialData.potentialSavings.businessEntity.toLocaleString()} by reducing self-employment taxes.`,
      impact: 'high',
      steps: [
        'Consult with a CPA about entity conversion',
        'Establish reasonable salary vs. distribution ratio',
        'Set up payroll and tax withholding systems'
      ],
      saving: financialData.potentialSavings.businessEntity,
      implemented: false
    },
    {
      id: 'homeOffice',
      title: 'Home Office Deduction',
      description: `Properly documenting home office space could yield $${financialData.potentialSavings.homeOffice.toLocaleString()} in deductions.`,
      impact: 'medium',
      steps: [
        'Designate exclusive space for business use',
        'Measure square footage and calculate percentage of home',
        'Track all home-related expenses for proportional deduction'
      ],
      saving: financialData.potentialSavings.homeOffice,
      implemented: true
    },
    {
      id: 'equipment',
      title: 'Section 179 Equipment Deduction',
      description: `Accelerating depreciation on equipment purchases could yield $${financialData.potentialSavings.equipmentDepreciation.toLocaleString()} in immediate tax benefits.`,
      impact: 'medium',
      steps: [
        'Purchase necessary equipment before year-end',
        'Document business purpose for all purchases',
        'Track installation dates and costs separately'
      ],
      saving: financialData.potentialSavings.equipmentDepreciation,
      implemented: false
    },
    {
      id: 'vehicle',
      title: 'Vehicle Expense Tracking',
      description: `Properly tracking business vehicle use could result in $${financialData.potentialSavings.vehicleExpenses.toLocaleString()} in deductions.`,
      impact: 'low',
      steps: [
        'Maintain detailed mileage log with date, purpose, and distance',
        'Consider actual expense method vs. standard mileage rate',
        'Document parking fees and tolls separately'
      ],
      saving: financialData.potentialSavings.vehicleExpenses,
      implemented: false
    },
    {
      id: 'health',
      title: 'Self-Employed Health Insurance Deduction',
      description: `Deducting health insurance premiums could save $${financialData.potentialSavings.healthInsurance.toLocaleString()} in taxes.`,
      impact: 'medium',
      steps: [
        'Ensure health insurance is established in the business name',
        'Include dental and vision premiums in deduction',
        'Consider setting up a Qualified Small Employer Health Reimbursement Arrangement (QSEHRA)'
      ],
      saving: financialData.potentialSavings.healthInsurance,
      implemented: true
    }
  ];
  
  return recommendations;
};

// Audit risk assessment based on financial data
const generateAuditRiskAssessment = (financialData: any) => {
  // Calculate some basic risk factors
  const revenueToExpenseRatio = financialData.totals.revenue / financialData.totals.expenses;
  const homeOfficePercent = financialData.potentialSavings.homeOffice / financialData.totals.rent;
  const vehicleExpenseRatio = financialData.potentialSavings.vehicleExpenses / financialData.totals.netIncome;
  
  // Risk assessment areas
  const riskAreas = [
    {
      id: 'income',
      name: 'Income Reporting',
      risk: 'low',
      score: 15,
      description: 'Your reported income appears consistent with industry averages.',
      recommendations: [
        'Continue maintaining detailed records of all income sources',
        'Consider using accounting software to track all payments',
        'Reconcile reported income with 1099s and bank deposits regularly'
      ]
    },
    {
      id: 'expenses',
      name: 'Business Expenses',
      risk: revenueToExpenseRatio < 1.5 ? 'high' : (revenueToExpenseRatio < 2.0 ? 'medium' : 'low'),
      score: revenueToExpenseRatio < 1.5 ? 75 : (revenueToExpenseRatio < 2.0 ? 45 : 20),
      description: revenueToExpenseRatio < 1.5 
        ? 'Your expense-to-revenue ratio is higher than industry averages, which may trigger scrutiny.'
        : 'Your business expense claims appear reasonable relative to revenue.',
      recommendations: [
        'Ensure all expenses have clear business purpose documentation',
        'Separate personal and business expenses meticulously',
        'Keep receipts and invoices for all deductions claimed'
      ]
    },
    {
      id: 'homeOffice',
      name: 'Home Office Deduction',
      risk: homeOfficePercent > 0.3 ? 'high' : (homeOfficePercent > 0.15 ? 'medium' : 'low'),
      score: homeOfficePercent > 0.3 ? 80 : (homeOfficePercent > 0.15 ? 50 : 25),
      description: homeOfficePercent > 0.3
        ? 'Your home office deduction is substantial, which may attract IRS attention.'
        : 'Your home office deduction appears reasonable.',
      recommendations: [
        'Take photographs documenting the dedicated business space',
        'Maintain floor plans showing exact measurements',
        'Keep utility bills and other home expenses organized by year'
      ]
    },
    {
      id: 'vehicle',
      name: 'Vehicle Expense Claims',
      risk: vehicleExpenseRatio > 0.05 ? 'medium' : 'low',
      score: vehicleExpenseRatio > 0.05 ? 60 : 30,
      description: vehicleExpenseRatio > 0.05
        ? 'Your vehicle expense deductions are higher than typical, which may trigger questions.'
        : 'Your vehicle expense claims appear to be within normal ranges.',
      recommendations: [
        'Maintain a detailed mileage log with date, destination, purpose',
        'Document business vs. personal use percentage',
        'Keep all receipts for gas, maintenance, insurance, and repairs'
      ]
    },
    {
      id: 'entity',
      name: 'Business Entity Structure',
      risk: 'medium',
      score: 40,
      description: 'Your entity structure and income distribution should be reviewed for compliance.',
      recommendations: [
        'Ensure owner compensation is reasonable for the industry',
        'Document board meetings and business decisions formally',
        'Review state filing requirements for annual compliance'
      ]
    }
  ];
  
  // Calculate overall risk score (weighted average)
  const totalWeight = riskAreas.length;
  const overallScore = riskAreas.reduce((sum, area) => sum + area.score, 0) / totalWeight;
  
  let overallRisk = 'low';
  if (overallScore > 60) {
    overallRisk = 'high';
  } else if (overallScore > 40) {
    overallRisk = 'medium';
  }
  
  return {
    overallRisk,
    overallScore,
    riskAreas,
    auditTriggers: {
      schedule: overallRisk === 'high' ? 'C' : (overallRisk === 'medium' ? 'D' : 'E'),
      probability: overallRisk === 'high' ? '5.6%' : (overallRisk === 'medium' ? '1.2%' : '0.4%'),
      timeframe: '3 years'
    }
  };
};

function getRiskBadge(risk: string) {
  switch (risk) {
    case 'high':
      return <Badge variant="destructive">High Risk</Badge>;
    case 'medium':
      return <Badge variant="default" className="bg-amber-500">Medium Risk</Badge>;
    case 'low':
      return <Badge variant="outline" className="text-green-600 border-green-600">Low Risk</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
}

export function TaxOptimization({ userId, restrictAccess = true, currentYear = new Date().getFullYear() }: TaxOptimizationProps) {
  const { toast } = useToast();
  const [year, setYear] = useState(currentYear);
  const [financialData, setFinancialData] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [auditRisk, setAuditRisk] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRecommendation, setSelectedRecommendation] = useState<string | null>(null);
  
  // In a real app, this would make an API call to get financial data
  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const data = generateDummyFinancialData(year);
      setFinancialData(data);
      setRecommendations(generateAIRecommendations(data));
      setAuditRisk(generateAuditRiskAssessment(data));
      setLoading(false);
    }, 1000);
  }, [year, userId]);
  
  const handleImplementRecommendation = (id: string) => {
    setRecommendations(prev => prev.map(rec => 
      rec.id === id ? { ...rec, implemented: !rec.implemented } : rec
    ));
    
    toast({
      title: "Recommendation Status Updated",
      description: "Your tax strategy has been updated and recalculated.",
      variant: "default"
    });
    
    // In a real app, this would make an API call to update the recommendation status
  };
  
  const totalImplementedSavings = recommendations
    .filter(rec => rec.implemented)
    .reduce((sum, rec) => sum + rec.saving, 0);
  
  const totalPotentialSavings = recommendations
    .filter(rec => !rec.implemented)
    .reduce((sum, rec) => sum + rec.saving, 0);
  
  if (loading) {
    return (
      <Card className="w-full h-full min-h-[400px]">
        <CardContent className="flex items-center justify-center h-full p-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading financial data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CircleDollarSign className="h-6 w-6 text-primary" />
            <CardTitle>Tax Optimization AI</CardTitle>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setYear(year - 1)}
              disabled={year <= 2022}
            >
              Previous Year
            </Button>
            <Badge variant="outline" className="text-lg px-3 py-1.5">
              {year}
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setYear(year + 1)}
              disabled={year >= currentYear}
            >
              Next Year
            </Button>
          </div>
        </div>
        <CardDescription>
          AI-powered tax analysis and optimization strategies for your dental practice
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        {/* Tax Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />
                <span>Annual Revenue</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${financialData.totals.revenue.toLocaleString()}</div>
              <p className="text-muted-foreground text-sm mt-1">
                Total revenue for {year}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span>Net Income</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${financialData.totals.netIncome.toLocaleString()}</div>
              <p className="text-muted-foreground text-sm mt-1">
                After expenses, before taxes
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Landmark className="h-4 w-4 text-primary" />
                <span>Estimated Tax</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">
                ${financialData.taxMetrics.estimatedYearlyTax.toLocaleString()}
              </div>
              <p className="text-muted-foreground text-sm mt-1">
                Effective rate: {financialData.taxMetrics.effectiveTaxRate.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="overview">Tax Overview</TabsTrigger>
            <TabsTrigger value="strategies">Optimization Strategies</TabsTrigger>
            <TabsTrigger value="audit-risk">Audit Risk Analysis</TabsTrigger>
            <TabsTrigger value="tax-calendar">Tax Calendar</TabsTrigger>
          </TabsList>
          
          {/* Tax Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Monthly Income & Tax Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="h-[400px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={financialData.monthlyData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="monthName" />
                          <YAxis />
                          <RechartsTooltip 
                            formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                            labelFormatter={(label) => `Month: ${label}`}
                          />
                          <Legend />
                          <Bar dataKey="revenue" name="Revenue" fill="#8884d8" />
                          <Bar dataKey="expenses" name="Expenses" fill="#82ca9d" />
                          <Bar dataKey="estimatedTax" name="Estimated Tax" fill="#ff8042" />
                          <Bar dataKey="afterTaxIncome" name="After-Tax Income" fill="#4CAF50" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Expense Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Staff Salaries', value: financialData.totals.staffSalaries },
                              { name: 'Lab Fees', value: financialData.totals.labFees },
                              { name: 'Rent', value: financialData.totals.rent },
                              { name: 'Supplies', value: financialData.totals.supplies },
                              { name: 'Equipment', value: financialData.totals.equipment },
                              { name: 'Utilities', value: financialData.totals.utilities },
                              { name: 'Insurance', value: financialData.totals.insurance },
                              { name: 'Marketing', value: financialData.totals.marketing },
                              { name: 'Software', value: financialData.totals.software },
                              { name: 'Professional Dues', value: financialData.totals.professionalDues },
                            ]}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                          >
                            {[
                              { name: 'Staff Salaries', value: financialData.totals.staffSalaries },
                              { name: 'Lab Fees', value: financialData.totals.labFees },
                              { name: 'Rent', value: financialData.totals.rent },
                              { name: 'Supplies', value: financialData.totals.supplies },
                              { name: 'Equipment', value: financialData.totals.equipment },
                              { name: 'Utilities', value: financialData.totals.utilities },
                              { name: 'Insurance', value: financialData.totals.insurance },
                              { name: 'Marketing', value: financialData.totals.marketing },
                              { name: 'Software', value: financialData.totals.software },
                              { name: 'Professional Dues', value: financialData.totals.professionalDues },
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                            formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Tax Rates Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Effective Tax Rate</span>
                        <span className="font-medium">{financialData.taxMetrics.effectiveTaxRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={financialData.taxMetrics.effectiveTaxRate} max={40} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Marginal Tax Rate</span>
                        <span className="font-medium">{financialData.taxMetrics.marginalTaxRate}%</span>
                      </div>
                      <Progress value={financialData.taxMetrics.marginalTaxRate} max={40} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Self-Employment Tax</span>
                        <span className="font-medium">{financialData.taxMetrics.selfEmploymentTax}%</span>
                      </div>
                      <Progress value={financialData.taxMetrics.selfEmploymentTax} max={40} className="h-2" />
                    </div>
                    
                    <div className="mt-6">
                      <h4 className="font-medium mb-2">Quarterly Estimated Tax Payments</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {financialData.taxMetrics.quarterlyPayments.map((payment, i) => (
                          <div key={i} className="border rounded-md p-3">
                            <div className="text-sm text-muted-foreground">Q{i+1} Payment</div>
                            <div className="text-lg font-medium">${payment.toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>Tax Savings Summary</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700">AI Generated</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="rounded-md border p-4 bg-green-50">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span>Implemented Strategies</span>
                        </h3>
                        <span className="text-green-700 font-semibold text-lg">
                          ${totalImplementedSavings.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Tax savings from strategies you have already implemented
                      </p>
                    </div>
                    
                    <div className="rounded-md border p-4 bg-amber-50">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                          <span>Potential Additional Savings</span>
                        </h3>
                        <span className="text-amber-700 font-semibold text-lg">
                          ${totalPotentialSavings.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Additional tax savings you could achieve by implementing our recommendations
                      </p>
                    </div>
                    
                    <div className="border-t pt-4 mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">Improved After-Tax Income</h3>
                        <span className="font-semibold text-lg">
                          ${(financialData.totals.afterTaxIncome + totalImplementedSavings + totalPotentialSavings).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Your potential after-tax income with all optimization strategies implemented
                      </p>
                    </div>
                    
                    <Button 
                      className="w-full mt-4" 
                      onClick={() => {
                        const element = document.querySelector('[data-value="strategies"]');
                        if (element instanceof HTMLElement) {
                          element.click();
                        }
                      }}
                    >
                      View All Tax Strategies
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Tax Strategies Tab */}
          <TabsContent value="strategies" className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">AI-Recommended Tax Optimization Strategies</CardTitle>
                <CardDescription>
                  Customized strategies to reduce your tax burden and maximize after-tax income
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
                  <div className="md:col-span-2">
                    <div className="space-y-3">
                      {recommendations.map((rec) => (
                        <Card 
                          key={rec.id} 
                          className={`overflow-hidden cursor-pointer transition-all ${
                            selectedRecommendation === rec.id ? 'ring-2 ring-primary' : ''
                          } ${rec.implemented ? 'bg-green-50/50' : ''}`}
                          onClick={() => setSelectedRecommendation(rec.id)}
                        >
                          <div className="p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-medium text-sm">{rec.title}</h3>
                                <div className="flex items-center gap-1 mt-1">
                                  <Badge 
                                    variant={rec.impact === 'high' ? 'default' : (rec.impact === 'medium' ? 'secondary' : 'outline')}
                                    className="text-xs py-0"
                                  >
                                    {rec.impact.charAt(0).toUpperCase() + rec.impact.slice(1)} Impact
                                  </Badge>
                                  {rec.implemented && (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs py-0">
                                      Implemented
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="text-green-600 font-medium whitespace-nowrap">
                                ${rec.saving.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                  
                  <div className="md:col-span-5">
                    {selectedRecommendation ? (
                      <div className="space-y-6">
                        {recommendations
                          .filter(rec => rec.id === selectedRecommendation)
                          .map(rec => (
                            <div key={rec.id}>
                              <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold">{rec.title}</h2>
                                <Badge 
                                  variant={rec.impact === 'high' ? 'default' : (rec.impact === 'medium' ? 'secondary' : 'outline')}
                                >
                                  {rec.impact.charAt(0).toUpperCase() + rec.impact.slice(1)} Impact
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <Card>
                                  <CardHeader className="py-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                      <CircleDollarSign className="h-4 w-4 text-primary" />
                                      <span>Estimated Savings</span>
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="text-3xl font-bold text-green-600">
                                      ${rec.saving.toLocaleString()}
                                    </div>
                                    <p className="text-muted-foreground text-sm mt-1">
                                      Annual tax benefit
                                    </p>
                                  </CardContent>
                                </Card>
                                
                                <Card className="md:col-span-2">
                                  <CardHeader className="py-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                      <BarChart4 className="h-4 w-4 text-primary" />
                                      <span>Implementation Status</span>
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <div className="font-medium">
                                          {rec.implemented ? 'Currently Implemented' : 'Not Yet Implemented'}
                                        </div>
                                        <p className="text-muted-foreground text-sm mt-1">
                                          {rec.implemented 
                                            ? 'This strategy is already saving you money' 
                                            : 'Implement this strategy to start saving'}
                                        </p>
                                      </div>
                                      <Button
                                        variant={rec.implemented ? "outline" : "default"}
                                        onClick={() => handleImplementRecommendation(rec.id)}
                                      >
                                        {rec.implemented ? 'Mark as Not Implemented' : 'Mark as Implemented'}
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                              
                              <div className="space-y-6">
                                <div>
                                  <h3 className="font-medium text-lg mb-2">Description</h3>
                                  <p className="text-muted-foreground">{rec.description}</p>
                                </div>
                                
                                <div>
                                  <h3 className="font-medium text-lg mb-2">Implementation Steps</h3>
                                  <ul className="space-y-2">
                                    {rec.steps.map((step, i) => (
                                      <li key={i} className="flex items-start gap-2">
                                        <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                                          {i + 1}
                                        </div>
                                        <span>{step}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                
                                <div className="border-t pt-4">
                                  <h3 className="font-medium text-lg mb-2">Expected Outcome</h3>
                                  <div className="bg-muted p-4 rounded-md">
                                    <p>
                                      Implementing this strategy can save approximately <span className="font-bold text-green-600">${rec.saving.toLocaleString()}</span> in taxes annually.
                                      {rec.impact === 'high' && " This is one of the highest-impact strategies available to you."}
                                      {rec.impact === 'medium' && " This strategy provides a moderate but significant tax benefit."}
                                      {rec.impact === 'low' && " While this offers a smaller benefit, it's still worth considering as part of your overall tax strategy."}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full py-12 border-2 border-dashed rounded-lg">
                        <CircleDollarSign className="h-12 w-12 text-muted-foreground/50" />
                        <h3 className="mt-4 text-lg font-medium">Select a Strategy</h3>
                        <p className="mt-2 text-muted-foreground text-center max-w-md">
                          Choose a tax optimization strategy from the list to see detailed information and implementation steps
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Audit Risk Tab */}
          <TabsContent value="audit-risk" className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Audit Risk Assessment</CardTitle>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">AI Powered Analysis</Badge>
                </div>
                <CardDescription>
                  AI analysis of your audit risk exposure and preventative measures
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="overflow-hidden">
                    <div className={`h-2 w-full ${
                      auditRisk.overallRisk === 'high' ? 'bg-red-500' : 
                      auditRisk.overallRisk === 'medium' ? 'bg-amber-500' : 'bg-green-500'
                    }`}></div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Overall Audit Risk</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col items-center">
                        <div className="relative w-40 h-40 mt-2 mb-4">
                          <div className="w-full h-full rounded-full bg-muted flex items-center justify-center">
                            <div className="text-4xl font-bold">
                              {Math.round(auditRisk.overallScore)}%
                            </div>
                          </div>
                          <div className="absolute top-0 right-0">
                            {getRiskBadge(auditRisk.overallRisk)}
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <p className="text-muted-foreground mb-2">
                            Audit probability: {auditRisk.auditTriggers.probability}
                          </p>
                          <p className="text-muted-foreground">
                            IRS Schedule {auditRisk.auditTriggers.schedule} classification
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <div className="md:col-span-2">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Risk Analysis by Category</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {auditRisk.riskAreas.map((area) => (
                            <div key={area.id} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{area.name}</span>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        {getRiskBadge(area.risk)}
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="max-w-xs">{area.description}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <span className="text-sm">{area.score}% Risk Score</span>
                              </div>
                              <Progress value={area.score} max={100} className="h-2" />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <span>Preventative Measures & Documentation</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {auditRisk.riskAreas.map((area) => (
                          <div key={area.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium">{area.name}</h3>
                              {getRiskBadge(area.risk)}
                            </div>
                            <p className="text-muted-foreground text-sm mb-3">{area.description}</p>
                            <div>
                              <h4 className="text-sm font-medium mb-2">Recommended Actions:</h4>
                              <ul className="space-y-1">
                                {area.recommendations.map((rec, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm">
                                    <Check className="h-4 w-4 text-green-600 mt-0.5" />
                                    <span>{rec}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Tax Calendar Tab */}
          <TabsContent value="tax-calendar" className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Tax Calendar & Important Deadlines</CardTitle>
                <CardDescription>
                  Track upcoming tax deadlines and planning opportunities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-amber-50">
                      <CardHeader className="py-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-amber-600" />
                          <span>Next Deadline</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-lg font-semibold">
                          {financialData.taxCalendar[0].date}
                        </div>
                        <p className="text-muted-foreground">
                          {financialData.taxCalendar[0].event}
                        </p>
                        <Badge variant="outline" className="mt-2 bg-amber-100/50 text-amber-800">
                          {financialData.taxCalendar[0].type === 'payment' ? 'Payment Due' : 
                           financialData.taxCalendar[0].type === 'filing' ? 'Filing Deadline' : 'Planning Opportunity'}
                        </Badge>
                      </CardContent>
                    </Card>
                    
                    <Card className="md:col-span-2">
                      <CardHeader className="py-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          <span>Quarterly Estimated Tax Payments</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {['Q1 (April 15)', 'Q2 (June 15)', 'Q3 (September 15)', 'Q4 (January 15)'].map((quarter, i) => (
                            <div key={i} className="border rounded-md p-3 text-center">
                              <div className="text-sm text-muted-foreground">{quarter}</div>
                              <div className="text-lg font-medium mt-1">
                                ${financialData.taxMetrics.quarterlyPayments[i].toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Tax Calendar {year}/{year+1}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {financialData.taxCalendar.map((event, i) => (
                          <div key={i} className="flex items-start gap-4 pb-4 border-b last:border-b-0 last:pb-0">
                            <div className="rounded-full bg-primary/10 p-2 flex-shrink-0">
                              {event.type === 'payment' && <CreditCard className="h-4 w-4 text-primary" />}
                              {event.type === 'filing' && <FileText className="h-4 w-4 text-primary" />}
                              {event.type === 'planning' && <PiggyBank className="h-4 w-4 text-primary" />}
                            </div>
                            <div>
                              <div className="font-medium">{event.date}</div>
                              <p className="text-muted-foreground text-sm">{event.event}</p>
                              <Badge variant="outline" className="mt-1">
                                {event.type === 'payment' ? 'Payment Due' : 
                                 event.type === 'filing' ? 'Filing Deadline' : 'Planning Opportunity'}
                              </Badge>
                            </div>
                            <div className="ml-auto">
                              <Button variant="outline" size="sm">
                                <Calendar className="h-3.5 w-3.5 mr-1" />
                                Add Reminder
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Home className="h-4 w-4 text-primary" />
                        <span>Year-End Tax Planning Checklist</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <Button variant="outline" size="icon" className="h-5 w-5 rounded-full">
                            <Check className="h-3 w-3" />
                          </Button>
                          <div>
                            <div className="font-medium">Maximize Retirement Contributions</div>
                            <p className="text-muted-foreground text-sm">
                              Contribute to your retirement accounts (401(k), SEP IRA) before December 31
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <Button variant="outline" size="icon" className="h-5 w-5 rounded-full">
                            <Check className="h-3 w-3" />
                          </Button>
                          <div>
                            <div className="font-medium">Purchase Business Equipment</div>
                            <p className="text-muted-foreground text-sm">
                              Consider Section 179 purchases before year-end for immediate deduction
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <Button variant="outline" size="icon" className="h-5 w-5 rounded-full">
                            <Check className="h-3 w-3" />
                          </Button>
                          <div>
                            <div className="font-medium">Defer Income & Accelerate Expenses</div>
                            <p className="text-muted-foreground text-sm">
                              Delay revenue recognition and prepay expenses where possible
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <Button variant="outline" size="icon" className="h-5 w-5 rounded-full">
                            <Check className="h-3 w-3" />
                          </Button>
                          <div>
                            <div className="font-medium">Update Business Entity Structure</div>
                            <p className="text-muted-foreground text-sm">
                              Review your business structure to optimize tax advantages
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <Button variant="outline" size="icon" className="h-5 w-5 rounded-full">
                            <Check className="h-3 w-3" />
                          </Button>
                          <div>
                            <div className="font-medium">Contribute to HSA</div>
                            <p className="text-muted-foreground text-sm">
                              Maximize Health Savings Account contributions for tax advantages
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-6">
        <Button variant="outline">
          <FileArchive className="h-4 w-4 mr-2" />
          Export Tax Report
        </Button>
        <Button>
          <Building className="h-4 w-4 mr-2" />
          Consult with Tax Advisor
        </Button>
      </CardFooter>
    </Card>
  );
}