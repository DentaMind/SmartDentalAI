import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Calculator,
  CircleDollarSign,
  TrendingUp,
  BarChart4,
  ArrowUp,
  ArrowDown,
  Clock,
  Settings,
  Save,
  RotateCcw,
  Calendar,
  AlertTriangle,
  Receipt,
  Building,
  Percent,
  StethoscopeIcon,
  FileText,
  TicketIcon,
  CheckCircle2,
  XCircle,
  UserIcon,
  Download
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface RevenueCalculatorProps {
  userId: number;
  restrictAccess?: boolean;
}

// Demo data for revenue calculator
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth();

// Procedure types with their average costs and procedure times
const procedureTypes = [
  { id: 1, name: 'Cleaning/Prophylaxis', code: 'D1110', fee: 120, duration: 60, category: 'preventive' },
  { id: 2, name: 'Basic Exam', code: 'D0120', fee: 80, duration: 30, category: 'preventive' },
  { id: 3, name: 'Comprehensive Exam', code: 'D0150', fee: 150, duration: 45, category: 'preventive' },
  { id: 4, name: 'X-ray (Full Mouth)', code: 'D0210', fee: 160, duration: 15, category: 'preventive' },
  { id: 5, name: 'X-ray (Bitewing)', code: 'D0274', fee: 70, duration: 10, category: 'preventive' },
  { id: 6, name: 'Basic Filling', code: 'D2140', fee: 190, duration: 45, category: 'restorative' },
  { id: 7, name: 'Two-Surface Filling', code: 'D2150', fee: 250, duration: 60, category: 'restorative' },
  { id: 8, name: 'Crown (Porcelain)', code: 'D2740', fee: 1200, duration: 90, category: 'restorative' },
  { id: 9, name: 'Root Canal (Anterior)', code: 'D3310', fee: 900, duration: 90, category: 'endodontic' },
  { id: 10, name: 'Root Canal (Molar)', code: 'D3330', fee: 1400, duration: 120, category: 'endodontic' },
  { id: 11, name: 'Extraction (Simple)', code: 'D7140', fee: 190, duration: 30, category: 'surgical' },
  { id: 12, name: 'Extraction (Surgical)', code: 'D7210', fee: 310, duration: 60, category: 'surgical' },
  { id: 13, name: 'Periodontal Scaling', code: 'D4341', fee: 280, duration: 60, category: 'periodontic' },
  { id: 14, name: 'Denture (Complete)', code: 'D5110', fee: 1800, duration: 60, category: 'prosthodontic' },
  { id: 15, name: 'Veneer', code: 'D2960', fee: 950, duration: 90, category: 'cosmetic' }
];

// Generate revenue data for the past 12 months
const generateRevenueData = () => {
  const baseRevenue = 45000; // Base monthly revenue
  const months = [];
  
  for (let i = 0; i < 12; i++) {
    const monthIndex = (currentMonth - 11 + i) % 12;
    const year = currentMonth - 11 + i < 0 ? currentYear - 1 : currentYear;
    
    // Apply seasonal variations
    const seasonalFactors = [0.85, 0.9, 1.0, 1.05, 1.1, 1.15, 1.2, 1.15, 1.05, 1.0, 0.95, 1.1];
    const randomVariation = 0.9 + Math.random() * 0.2; // Random factor between 0.9 and 1.1
    
    const revenue = Math.round(baseRevenue * seasonalFactors[monthIndex] * randomVariation);
    const expenses = Math.round(revenue * (0.5 + Math.random() * 0.15)); // 50-65% expense ratio
    const profit = revenue - expenses;
    
    // Generate procedure distribution data
    const procedures: Record<string, { count: number, revenue: number }> = {};
    let totalProcedures = Math.round(revenue / 300); // Approximate number of procedures
    
    procedureTypes.forEach(proc => {
      // Assign a random number of procedures based on category weights
      const categoryWeights: Record<string, number> = {
        preventive: 0.4,
        restorative: 0.25,
        endodontic: 0.1,
        surgical: 0.07,
        periodontic: 0.08,
        prosthodontic: 0.05,
        cosmetic: 0.05
      };
      
      const weight = categoryWeights[proc.category] || 0.05; // Default to 0.05 if category not found
      const count = Math.round(totalProcedures * weight * (0.8 + Math.random() * 0.4));
      procedures[proc.code] = {
        count,
        revenue: count * proc.fee
      };
    });
    
    // Calculate cancelations
    const cancelationRate = 0.05 + Math.random() * 0.05; // 5-10% cancelation rate
    const cancelations = Math.round(totalProcedures * cancelationRate);
    const cancelationCost = Math.round(cancelations * 200); // Average cost per cancelation
    
    months.push({
      monthName: new Date(year, monthIndex, 1).toLocaleString('default', { month: 'short' }),
      year,
      revenue,
      expenses,
      profit,
      procedures,
      totalProcedures: Object.values(procedures).reduce((sum: number, p: any) => sum + p.count, 0),
      cancelations,
      cancelationCost
    });
  }
  
  return months;
};

// Generate overhead breakdown
const generateOverheadData = (revenue: number) => {
  return {
    staffSalaries: Math.round(revenue * 0.28),
    labFees: Math.round(revenue * 0.12),
    supplies: Math.round(revenue * 0.08),
    rent: Math.round(revenue * 0.08),
    utilities: Math.round(revenue * 0.03),
    insurance: Math.round(revenue * 0.04),
    marketing: Math.round(revenue * 0.03),
    equipment: Math.round(revenue * 0.05),
    software: Math.round(revenue * 0.02),
    other: Math.round(revenue * 0.02)
  };
};

// Generate staff productivity data
const generateStaffProductivityData = () => {
  const staff = [
    { id: 1, name: 'Dr. Smith', role: 'Dentist', hourlyRate: 125 },
    { id: 2, name: 'Dr. Johnson', role: 'Dentist', hourlyRate: 125 },
    { id: 3, name: 'Sarah', role: 'Dental Hygienist', hourlyRate: 45 },
    { id: 4, name: 'Mike', role: 'Dental Hygienist', hourlyRate: 42 },
    { id: 5, name: 'Jennifer', role: 'Dental Assistant', hourlyRate: 28 },
    { id: 6, name: 'Robert', role: 'Dental Assistant', hourlyRate: 26 },
    { id: 7, name: 'Lisa', role: 'Office Manager', hourlyRate: 35 },
    { id: 8, name: 'Carlos', role: 'Receptionist', hourlyRate: 22 }
  ];
  
  return staff.map(employee => {
    // Generate random productivity metrics
    const hoursWorked = 160 + Math.round(Math.random() * 20 - 10);
    const laborCost = hoursWorked * employee.hourlyRate;
    
    // Generate revenue only for revenue-producing roles
    let revenueGenerated = 0;
    let patientsServed = 0;
    let procedures = 0;
    
    if (['Dentist', 'Dental Hygienist'].includes(employee.role)) {
      const revenuePerHour = employee.role === 'Dentist' ? 550 : 200;
      revenueGenerated = Math.round(hoursWorked * revenuePerHour * (0.9 + Math.random() * 0.2));
      patientsServed = Math.round(hoursWorked * (employee.role === 'Dentist' ? 1.5 : 2) * (0.9 + Math.random() * 0.2));
      procedures = Math.round(patientsServed * (employee.role === 'Dentist' ? 2 : 1));
    }
    
    return {
      ...employee,
      hoursWorked,
      laborCost,
      revenueGenerated,
      patientsServed,
      procedures,
      cancelations: Math.round(patientsServed * 0.07),
      productivity: revenueGenerated > 0 ? (revenueGenerated / laborCost).toFixed(2) : 'N/A'
    };
  });
};

// Generate efficiency recommendations
const generateEfficiencyRecommendations = (data: any) => {
  const totalRevenue = data.reduce((sum: number, month: any) => sum + month.revenue, 0);
  const totalExpenses = data.reduce((sum: number, month: any) => sum + month.expenses, 0);
  const expenseRatio = totalExpenses / totalRevenue;
  
  const lastThreeMonths = data.slice(-3);
  const recentCancelationRate = lastThreeMonths.reduce((sum: number, month: any) => 
    sum + (month.cancelations / month.totalProcedures), 0) / 3;
  
  const recommendations = [
    {
      id: 1,
      category: 'staffing',
      title: 'Optimize Hygienist Scheduling',
      description: 'Adjusting hygienist schedules to match peak demand periods could increase productivity by 12%.',
      impact: expenseRatio > 0.6 ? 'high' : 'medium',
      potentialSavings: Math.round(totalRevenue * 0.03),
      implementation: 'Schedule hygienists based on historical appointment data patterns.',
      aiGenerated: true
    },
    {
      id: 2,
      category: 'cancelations',
      title: 'Implement Advanced Appointment Reminders',
      description: `Your cancelation rate of ${(recentCancelationRate * 100).toFixed(1)}% is costing approximately $${Math.round(lastThreeMonths.reduce((sum: number, month: any) => sum + month.cancelationCost, 0)).toLocaleString()} per quarter.`,
      impact: recentCancelationRate > 0.08 ? 'high' : 'medium',
      potentialSavings: Math.round(lastThreeMonths.reduce((sum: number, month: any) => sum + month.cancelationCost, 0) * 0.7),
      implementation: 'Set up automated 48-hour and 24-hour reminders via text and email.',
      aiGenerated: true
    },
    {
      id: 3,
      category: 'supplies',
      title: 'Consolidate Supply Ordering',
      description: 'Analysis shows you are ordering from 7 different vendors with overlapping products.',
      impact: 'medium',
      potentialSavings: Math.round(totalExpenses * 0.02),
      implementation: 'Consolidate orders with 2-3 preferred vendors for bulk discounts.',
      aiGenerated: true
    },
    {
      id: 4,
      category: 'procedures',
      title: 'Increase High-Margin Procedure Focus',
      description: 'Your ratio of surgical procedures to basic procedures is lower than optimal.',
      impact: 'high',
      potentialSavings: Math.round(totalRevenue * 0.07),
      implementation: 'Create treatment plans that properly sequence needed high-value procedures.',
      aiGenerated: true
    },
    {
      id: 5,
      category: 'marketing',
      title: 'Optimize Patient Retention Marketing',
      description: 'Patient retention could be improved by 15% with targeted recall campaigns.',
      impact: 'medium',
      potentialSavings: Math.round(totalRevenue * 0.04),
      implementation: 'Implement personalized recall reminders based on procedure history.',
      aiGenerated: true
    }
  ];
  
  return recommendations;
};

export function RevenueCalculator({ userId, restrictAccess = true }: RevenueCalculatorProps) {
  const { toast } = useToast();
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number>(11); // Default to current month
  const [staffData, setStaffData] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [customExpenses, setCustomExpenses] = useState<Record<string, number>>({});
  const [editingExpense, setEditingExpense] = useState<string | null>(null);
  const [showAddProcedureDialog, setShowAddProcedureDialog] = useState<boolean>(false);
  const [newProcedureData, setNewProcedureData] = useState({
    procedureId: '1',
    count: '1',
    date: new Date().toISOString().split('T')[0]
  });
  
  // Fetch revenue data
  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const data = generateRevenueData();
      setRevenueData(data);
      setStaffData(generateStaffProductivityData());
      setRecommendations(generateEfficiencyRecommendations(data));
      setLoading(false);
    }, 1000);
  }, [userId]);
  
  // Aggregate data based on view mode
  const getAggregatedData = () => {
    if (!revenueData.length) return [];
    
    if (viewMode === 'monthly') {
      return revenueData;
    } else if (viewMode === 'quarterly') {
      const quarters = [];
      for (let i = 0; i < 4; i++) {
        const quarterMonths = revenueData.slice(i * 3, (i + 1) * 3);
        if (quarterMonths.length === 0) continue;
        
        quarters.push({
          label: `Q${i + 1}`,
          revenue: quarterMonths.reduce((sum, month) => sum + month.revenue, 0),
          expenses: quarterMonths.reduce((sum, month) => sum + month.expenses, 0),
          profit: quarterMonths.reduce((sum, month) => sum + month.profit, 0),
          totalProcedures: quarterMonths.reduce((sum, month) => sum + month.totalProcedures, 0),
          cancelations: quarterMonths.reduce((sum, month) => sum + month.cancelations, 0),
          cancelationCost: quarterMonths.reduce((sum, month) => sum + month.cancelationCost, 0)
        });
      }
      return quarters;
    } else {
      // Yearly view
      return [{
        label: `Annual`,
        revenue: revenueData.reduce((sum, month) => sum + month.revenue, 0),
        expenses: revenueData.reduce((sum, month) => sum + month.expenses, 0),
        profit: revenueData.reduce((sum, month) => sum + month.profit, 0),
        totalProcedures: revenueData.reduce((sum, month) => sum + month.totalProcedures, 0),
        cancelations: revenueData.reduce((sum, month) => sum + month.cancelations, 0),
        cancelationCost: revenueData.reduce((sum, month) => sum + month.cancelationCost, 0)
      }];
    }
  };
  
  // Get current month's data
  const getCurrentMonthData = () => {
    if (!revenueData.length || selectedMonth === null) {
      return null;
    }
    return revenueData[selectedMonth];
  };
  
  const currentMonthData = getCurrentMonthData();
  
  // Calculate overhead percentages
  const getOverheadPercentages = () => {
    if (!currentMonthData) return [];
    
    const overheadData = generateOverheadData(currentMonthData.revenue);
    const total = Object.values(overheadData).reduce((sum: number, value: number) => sum + value, 0);
    
    return Object.entries(overheadData).map(([key, value]) => ({
      name: key,
      value,
      percentage: ((value / total) * 100).toFixed(1)
    }));
  };
  
  // Format procedures for table display
  const formatProceduresForTable = () => {
    if (!currentMonthData || !currentMonthData.procedures) return [];
    
    return Object.entries(currentMonthData.procedures).map(([code, data]: [string, any]) => {
      const procedureInfo = procedureTypes.find(p => p.code === code);
      return {
        code,
        name: procedureInfo?.name || 'Unknown Procedure',
        count: data.count,
        revenue: data.revenue,
        avgPerProcedure: Math.round(data.revenue / data.count),
        category: procedureInfo?.category || 'other'
      };
    }).sort((a, b) => b.revenue - a.revenue);
  };
  
  // Get the procedure category distribution
  const getProcedureCategoryDistribution = () => {
    if (!currentMonthData || !currentMonthData.procedures) return [];
    
    const categoryTotals: Record<string, number> = {};
    
    Object.entries(currentMonthData.procedures).forEach(([code, data]: [string, any]) => {
      const procedureInfo = procedureTypes.find(p => p.code === code);
      if (procedureInfo) {
        const category = procedureInfo.category;
        categoryTotals[category] = (categoryTotals[category] || 0) + data.revenue;
      }
    });
    
    return Object.entries(categoryTotals).map(([category, revenue]) => ({
      name: category.charAt(0).toUpperCase() + category.slice(1),
      value: revenue
    }));
  };
  
  // Handle expense editing
  const handleExpenseChange = (key: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setCustomExpenses({
        ...customExpenses,
        [key]: numValue
      });
    }
  };
  
  // Save edited expense
  const saveExpenseEdit = () => {
    setEditingExpense(null);
    
    toast({
      title: "Expense Updated",
      description: "Your expense changes have been saved.",
      variant: "default"
    });
  };
  
  // Handle adding new procedure
  const handleAddProcedure = () => {
    const procedureId = parseInt(newProcedureData.procedureId);
    const count = parseInt(newProcedureData.count);
    const procedure = procedureTypes.find(p => p.id === procedureId);
    
    if (procedure && count > 0) {
      toast({
        title: "Procedure Added",
        description: `Added ${count} ${procedure.name} procedures to your revenue.`,
        variant: "default"
      });
      
      setShowAddProcedureDialog(false);
      
      // In a real app, this would make an API call to update procedures
    }
  };
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A288E3', '#FF6B6B'];
  
  if (loading) {
    return (
      <Card className="w-full h-full min-h-[400px]">
        <CardContent className="flex items-center justify-center h-full p-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading revenue data...</p>
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
            <CardTitle>Revenue & Overhead Calculator</CardTitle>
          </div>
          
          <div className="flex items-center gap-2">
            <Select 
              value={viewMode} 
              onValueChange={(value) => setViewMode(value as 'monthly' | 'quarterly' | 'yearly')}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="View Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly View</SelectItem>
                <SelectItem value="quarterly">Quarterly View</SelectItem>
                <SelectItem value="yearly">Yearly View</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
            
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          Comprehensive analysis of practice revenue, expenses, and profitability metrics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        {/* Revenue Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />
                <span>Gross Revenue</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${currentMonthData.revenue.toLocaleString()}
              </div>
              <p className="text-muted-foreground text-sm mt-1">
                {viewMode === 'monthly' ? currentMonthData.monthName : viewMode === 'quarterly' ? 'Quarterly' : 'Annual'} revenue
              </p>
              <div className="flex items-center gap-1 mt-2">
                <Badge variant="outline" className="bg-green-50 text-green-600">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  {Math.round(Math.random() * 5 + 2)}% vs previous {viewMode}
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building className="h-4 w-4 text-primary" />
                <span>Total Expenses</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${currentMonthData.expenses.toLocaleString()}
              </div>
              <p className="text-muted-foreground text-sm mt-1">
                {((currentMonthData.expenses / currentMonthData.revenue) * 100).toFixed(1)}% of revenue
              </p>
              <div className="flex items-center gap-1 mt-2">
                <Badge variant="outline" className="bg-amber-50 text-amber-600">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  {Math.round(Math.random() * 3 + 1)}% vs previous {viewMode}
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span>Net Profit</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                ${currentMonthData.profit.toLocaleString()}
              </div>
              <p className="text-muted-foreground text-sm mt-1">
                {((currentMonthData.profit / currentMonthData.revenue) * 100).toFixed(1)}% profit margin
              </p>
              <div className="flex items-center gap-1 mt-2">
                <Badge variant="outline" className="bg-green-50 text-green-600">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  {Math.round(Math.random() * 7 + 3)}% vs previous {viewMode}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="trends" className="w-full">
          <TabsList className="grid grid-cols-5 mb-6">
            <TabsTrigger value="trends">Revenue Trends</TabsTrigger>
            <TabsTrigger value="overhead">Overhead Analysis</TabsTrigger>
            <TabsTrigger value="procedures">Procedure Analysis</TabsTrigger>
            <TabsTrigger value="staff">Staff Productivity</TabsTrigger>
            <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
          </TabsList>
          
          {/* Revenue Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Revenue vs. Expenses Trend</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={getAggregatedData()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey={viewMode === 'monthly' ? 'monthName' : 'label'} 
                        label={{ 
                          value: viewMode === 'monthly' ? 'Month' : viewMode === 'quarterly' ? 'Quarter' : 'Year', 
                          position: 'bottom',
                          offset: 0
                        }}
                      />
                      <YAxis 
                        label={{ 
                          value: 'Amount ($)', 
                          angle: -90, 
                          position: 'insideLeft',
                          offset: -10
                        }}
                      />
                      <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, '']} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        name="Revenue" 
                        stroke="#8884d8" 
                        activeDot={{ r: 8 }}
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="expenses" 
                        name="Expenses" 
                        stroke="#82ca9d" 
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="profit" 
                        name="Profit" 
                        stroke="#ff7300" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Procedure Volume Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={getAggregatedData()}
                        margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey={viewMode === 'monthly' ? 'monthName' : 'label'} 
                        />
                        <YAxis />
                        <Tooltip formatter={(value: number) => [value.toLocaleString(), '']} />
                        <Legend />
                        <Bar 
                          dataKey="totalProcedures" 
                          name="Procedures" 
                          fill="#8884d8" 
                        />
                        <Bar 
                          dataKey="cancelations" 
                          name="Cancelations" 
                          fill="#ff7300" 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Revenue Per Procedure</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={revenueData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="monthName" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number) => [`$${value.toLocaleString()}`, '']} 
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey={(data) => Math.round(data.revenue / data.totalProcedures)} 
                          name="Avg. Revenue Per Procedure" 
                          stroke="#82ca9d" 
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {viewMode === 'monthly' && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Select Month to View</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {revenueData.map((month, index) => (
                      <Button
                        key={index}
                        variant={selectedMonth === index ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedMonth(index)}
                      >
                        {month.monthName} {month.year}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Overhead Analysis Tab */}
          <TabsContent value="overhead" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Cost Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getOverheadPercentages()}
                            cx="50%"
                            cy="50%"
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percentage }) => `${name}: ${percentage}%`}
                            labelLine={false}
                          >
                            {getOverheadPercentages()?.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Overhead Details</CardTitle>
                      <Button variant="outline" size="sm" onClick={() => {
                        /* Implement overhead period comparison */
                      }}>
                        Compare Periods
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Expense Category</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">% of Revenue</TableHead>
                          <TableHead className="text-right">Industry Avg.</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getOverheadPercentages()?.map((expense) => {
                          const formattedName = expense.name
                            .replace(/([A-Z])/g, ' $1')
                            .replace(/^./, str => str.toUpperCase())
                            .replace(/([a-z])([A-Z])/g, '$1 $2');
                          
                          // Industry benchmarks (fictional)
                          const benchmarks: Record<string, number> = {
                            staffSalaries: 27,
                            labFees: 11,
                            supplies: 7.5,
                            rent: 7,
                            utilities: 2.5,
                            insurance: 3.5,
                            marketing: 3,
                            equipment: 4.5,
                            software: 2,
                            other: 2
                          };
                          
                          const benchmark = benchmarks[expense.name] || 0;
                          const currentPercentage = parseFloat(expense.percentage);
                          
                          return (
                            <TableRow key={expense.name}>
                              <TableCell className="font-medium">{formattedName}</TableCell>
                              <TableCell className="text-right">
                                {editingExpense === expense.name ? (
                                  <Input
                                    value={customExpenses[expense.name] || expense.value}
                                    onChange={(e) => handleExpenseChange(expense.name, e.target.value)}
                                    className="w-24 inline-block"
                                  />
                                ) : (
                                  `$${expense.value.toLocaleString()}`
                                )}
                              </TableCell>
                              <TableCell className="text-right">{expense.percentage}%</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {benchmark}%
                                  {currentPercentage > benchmark * 1.1 && (
                                    <Badge variant="outline" className="bg-red-50 text-red-600">Above</Badge>
                                  )}
                                  {currentPercentage < benchmark * 0.9 && (
                                    <Badge variant="outline" className="bg-green-50 text-green-600">Below</Badge>
                                  )}
                                  {currentPercentage >= benchmark * 0.9 && currentPercentage <= benchmark * 1.1 && (
                                    <Badge variant="outline" className="bg-blue-50 text-blue-600">On Target</Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                {editingExpense === expense.name ? (
                                  <Button size="sm" variant="default" onClick={saveExpenseEdit}>
                                    <Save className="h-4 w-4 mr-1" />
                                    Save
                                  </Button>
                                ) : (
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => setEditingExpense(expense.name)}
                                  >
                                    Edit
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    
                    <div className="mt-6 border-t pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm font-medium mb-1">Total Expenses</div>
                          <div className="text-2xl font-bold">${currentMonthData.expenses.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium mb-1">Expense-to-Revenue Ratio</div>
                          <div className="text-2xl font-bold">
                            {((currentMonthData.expenses / currentMonthData.revenue) * 100).toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium mb-1">Expense per Procedure</div>
                          <div className="text-2xl font-bold">
                            ${Math.round(currentMonthData.expenses / currentMonthData.totalProcedures).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Budget Planning & Forecasting</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span>Next Month Forecast</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div>
                        <div className="grid grid-cols-2 gap-4 mb-2">
                          <div>
                            <div className="text-sm text-muted-foreground">Revenue</div>
                            <div className="text-lg font-medium">${Math.round(currentMonthData.revenue * 1.04).toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Expenses</div>
                            <div className="text-lg font-medium">${Math.round(currentMonthData.expenses * 1.02).toLocaleString()}</div>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="text-sm text-muted-foreground">Projected Profit</div>
                          <div className="text-lg font-medium text-green-600">
                            ${Math.round(currentMonthData.revenue * 1.04 - currentMonthData.expenses * 1.02).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Percent className="h-4 w-4 text-blue-600" />
                        <span>Budget Adherence</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div>
                        <div className="text-sm text-muted-foreground mb-2">Overall Budget Status</div>
                        <div className="flex items-center gap-2">
                          <div className="text-lg font-medium">
                            {Math.random() > 0.5 ? 'Under Budget' : 'Over Budget'}
                          </div>
                          <Badge variant="outline" className="bg-green-50 text-green-600">
                            {(Math.random() * 5 + 1).toFixed(1)}%
                          </Badge>
                        </div>
                        <div className="mt-4">
                          <div className="text-sm font-medium mb-1">Top Variance:</div>
                          <div className="text-sm">Supplies: -7.2% under budget</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <StethoscopeIcon className="h-4 w-4 text-purple-600" />
                        <span>Procedure Target</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div>
                        <div className="text-sm text-muted-foreground mb-2">Monthly Goal Progress</div>
                        <div className="flex items-center gap-2">
                          <div className="text-lg font-medium">{Math.round(currentMonthData.totalProcedures / 3.2)} / 120</div>
                          <Badge variant="outline" className="bg-amber-50 text-amber-600">
                            {Math.round(currentMonthData.totalProcedures / 3.2 / 120 * 100)}%
                          </Badge>
                        </div>
                        <div className="mt-4">
                          <Button variant="outline" size="sm" onClick={() => setShowAddProcedureDialog(true)}>
                            <StethoscopeIcon className="h-3.5 w-3.5 mr-1" />
                            Add Procedure
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <CircleDollarSign className="h-4 w-4 text-amber-600" />
                        <span>Collection Rate</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div>
                        <div className="text-sm text-muted-foreground mb-2">Current Collection Rate</div>
                        <div className="flex items-center gap-2">
                          <div className="text-lg font-medium">{(92 + Math.random() * 5).toFixed(1)}%</div>
                          <Badge variant="outline" className="bg-green-50 text-green-600">
                            +{(Math.random() * 2.5).toFixed(1)}%
                          </Badge>
                        </div>
                        <div className="mt-4">
                          <div className="text-sm">Accounts receivable: $24,680</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Procedure Analysis Tab */}
          <TabsContent value="procedures" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
              <div className="lg:col-span-4">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Procedure Revenue Analysis</CardTitle>
                      <Dialog open={showAddProcedureDialog} onOpenChange={setShowAddProcedureDialog}>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <StethoscopeIcon className="h-4 w-4 mr-1" />
                            Add Procedure
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add New Procedure</DialogTitle>
                            <DialogDescription>
                              Record a new procedure to include in your revenue calculations.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="procedure" className="text-right">
                                Procedure
                              </Label>
                              <Select
                                value={newProcedureData.procedureId}
                                onValueChange={(value) => setNewProcedureData({
                                  ...newProcedureData,
                                  procedureId: value
                                })}
                              >
                                <SelectTrigger className="col-span-3">
                                  <SelectValue placeholder="Select procedure" />
                                </SelectTrigger>
                                <SelectContent>
                                  {procedureTypes.map(proc => (
                                    <SelectItem key={proc.id} value={proc.id.toString()}>
                                      {proc.name} (${proc.fee})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="count" className="text-right">
                                Count
                              </Label>
                              <Input
                                id="count"
                                value={newProcedureData.count}
                                onChange={(e) => setNewProcedureData({
                                  ...newProcedureData,
                                  count: e.target.value
                                })}
                                className="col-span-3"
                                type="number"
                                min="1"
                              />
                            </div>
                            
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="date" className="text-right">
                                Date
                              </Label>
                              <Input
                                id="date"
                                value={newProcedureData.date}
                                onChange={(e) => setNewProcedureData({
                                  ...newProcedureData,
                                  date: e.target.value
                                })}
                                className="col-span-3"
                                type="date"
                              />
                            </div>
                          </div>
                          
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setShowAddProcedureDialog(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleAddProcedure}>
                              Add Procedure
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Procedure</TableHead>
                          <TableHead className="text-right">Code</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                          <TableHead className="text-right">Avg Fee</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formatProceduresForTable().map((proc) => (
                          <TableRow key={proc.code}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={`
                                  ${proc.category === 'preventive' ? 'bg-blue-50 text-blue-600' : 
                                    proc.category === 'restorative' ? 'bg-purple-50 text-purple-600' :
                                    proc.category === 'endodontic' ? 'bg-red-50 text-red-600' :
                                    proc.category === 'surgical' ? 'bg-amber-50 text-amber-600' :
                                    proc.category === 'periodontic' ? 'bg-green-50 text-green-600' :
                                    proc.category === 'prosthodontic' ? 'bg-indigo-50 text-indigo-600' :
                                    'bg-gray-50 text-gray-600'
                                  }
                                `}>
                                  {proc.category.charAt(0).toUpperCase() + proc.category.slice(1)}
                                </Badge>
                                {proc.name}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{proc.code}</TableCell>
                            <TableCell className="text-right">{proc.count}</TableCell>
                            <TableCell className="text-right">${proc.revenue.toLocaleString()}</TableCell>
                            <TableCell className="text-right">${proc.avgPerProcedure.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
              
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Procedure Category Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getProcedureCategoryDistribution()}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                          >
                            {getProcedureCategoryDistribution().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="mt-6 border-t pt-4">
                      <h3 className="text-base font-medium mb-3">Category Insights</h3>
                      
                      <Accordion type="single" collapsible>
                        <AccordionItem value="insights-1">
                          <AccordionTrigger>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-amber-50 text-amber-600">Opportunity</Badge>
                              <span>Increase Restorative Services</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <p className="text-muted-foreground mb-2">
                              Your restorative procedure ratio is below industry average. Increasing restorative procedures by 15% could generate an additional $5,200 monthly revenue.
                            </p>
                            <Button variant="outline" size="sm">View Action Plan</Button>
                          </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="insights-2">
                          <AccordionTrigger>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-green-50 text-green-600">Strength</Badge>
                              <span>Strong Preventive Care Base</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <p className="text-muted-foreground">
                              Your preventive care ratio is excellent, providing a stable revenue foundation and patient retention. Continue to leverage this for treatment plan conversions.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="insights-3">
                          <AccordionTrigger>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-blue-50 text-blue-600">Recommendation</Badge>
                              <span>Adjust Fee Schedule</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <p className="text-muted-foreground mb-2">
                              Your crown fees are 8% below market average in your region. Consider a gradual fee increase to align with market rates.
                            </p>
                            <Button variant="outline" size="sm">View Fee Analysis</Button>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="mt-6">
                  <CardHeader className="py-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span>Appointment Utilization Analysis</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">No-Show/Cancellation Rate</div>
                          <div className="text-lg">{Math.round(currentMonthData.cancelations / currentMonthData.totalProcedures * 100)}%</div>
                        </div>
                        <Badge variant="outline" className={`
                          ${currentMonthData.cancelations / currentMonthData.totalProcedures > 0.1 ? 
                            'bg-red-50 text-red-600' : 
                            'bg-green-50 text-green-600'
                          }
                        `}>
                          {currentMonthData.cancelations / currentMonthData.totalProcedures > 0.1 ? 
                            'Above Target' : 
                            'Below Target'
                          }
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">Revenue Loss from Cancelations</div>
                          <div className="text-lg">${currentMonthData.cancelationCost.toLocaleString()}</div>
                        </div>
                        <Button variant="outline" size="sm">Reduce Loss</Button>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">Chair Utilization Rate</div>
                          <div className="text-lg">{(75 + Math.random() * 18).toFixed(1)}%</div>
                        </div>
                        <Button variant="outline" size="sm">Optimize</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* Staff Productivity Tab */}
          <TabsContent value="staff" className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Staff Productivity Analysis</CardTitle>
                  <Select defaultValue="revenue">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort Order" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="revenue">Sort by Revenue</SelectItem>
                      <SelectItem value="productivity">Sort by Productivity</SelectItem>
                      <SelectItem value="patients">Sort by Patients</SelectItem>
                      <SelectItem value="role">Sort by Role</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff Member</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Hours</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Labor Cost</TableHead>
                      <TableHead className="text-right">ROI</TableHead>
                      <TableHead className="text-right">Patients</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffData
                      .sort((a, b) => (b.revenueGenerated || 0) - (a.revenueGenerated || 0))
                      .map((staff) => (
                        <TableRow key={staff.id}>
                          <TableCell className="font-medium">{staff.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`
                              ${staff.role === 'Dentist' ? 'bg-blue-50 text-blue-600' : 
                                staff.role === 'Dental Hygienist' ? 'bg-green-50 text-green-600' :
                                staff.role === 'Dental Assistant' ? 'bg-purple-50 text-purple-600' :
                                'bg-gray-50 text-gray-600'
                              }
                            `}>
                              {staff.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{staff.hoursWorked}</TableCell>
                          <TableCell className="text-right">
                            {staff.revenueGenerated ? `$${staff.revenueGenerated.toLocaleString()}` : '—'}
                          </TableCell>
                          <TableCell className="text-right">${staff.laborCost.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            {staff.revenueGenerated ? staff.productivity + 'x' : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            {staff.patientsServed ? staff.patientsServed : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-primary" />
                        <span>Staff Cost Analysis</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Total Labor Cost</div>
                          <div className="text-2xl font-medium">
                            ${staffData.reduce((sum, staff) => sum + staff.laborCost, 0).toLocaleString()}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-muted-foreground">Labor as % of Revenue</div>
                          <div className="text-xl font-medium">
                            {(staffData.reduce((sum, staff) => sum + staff.laborCost, 0) / 
                              currentMonthData.revenue * 100).toFixed(1)}%
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Industry Avg: 27-32%
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <BarChart4 className="h-4 w-4 text-primary" />
                        <span>Provider Productivity</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Revenue per Provider Hour</div>
                          <div className="text-2xl font-medium">
                            ${Math.round(
                              staffData
                                .filter(staff => ['Dentist', 'Dental Hygienist'].includes(staff.role))
                                .reduce((sum, staff) => sum + staff.revenueGenerated, 0) / 
                              staffData
                                .filter(staff => ['Dentist', 'Dental Hygienist'].includes(staff.role))
                                .reduce((sum, staff) => sum + staff.hoursWorked, 0)
                            ).toLocaleString()}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-muted-foreground">Patients per Provider Hour</div>
                          <div className="text-xl font-medium">
                            {(
                              staffData
                                .filter(staff => ['Dentist', 'Dental Hygienist'].includes(staff.role))
                                .reduce((sum, staff) => sum + staff.patientsServed, 0) / 
                              staffData
                                .filter(staff => ['Dentist', 'Dental Hygienist'].includes(staff.role))
                                .reduce((sum, staff) => sum + staff.hoursWorked, 0)
                            ).toFixed(1)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Settings className="h-4 w-4 text-primary" />
                        <span>Optimization Opportunities</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm">Hygienist Scheduling</div>
                          <Badge variant="outline" className="bg-amber-50 text-amber-600">
                            +12% Potential
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-sm">Assistant Utilization</div>
                          <Badge variant="outline" className="bg-green-50 text-green-600">
                            +8% Potential
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-sm">Doctor Productivity</div>
                          <Badge variant="outline" className="bg-red-50 text-red-600">
                            -5% vs Target
                          </Badge>
                        </div>
                        
                        <Button variant="outline" size="sm" className="w-full mt-2">
                          View Staffing Recommendations
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* AI Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  AI-Powered Revenue & Efficiency Recommendations
                </CardTitle>
                <CardDescription>
                  Implement these data-driven recommendations to optimize revenue and reduce expenses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {recommendations.map(rec => (
                    <Card key={rec.id} className="overflow-hidden">
                      <div className={`h-1 w-full ${
                        rec.impact === 'high' ? 'bg-green-500' : 
                        rec.impact === 'medium' ? 'bg-amber-500' : 
                        'bg-blue-500'
                      }`}></div>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline" className={`
                            ${rec.category === 'staffing' ? 'bg-blue-50 text-blue-600' :
                              rec.category === 'cancelations' ? 'bg-red-50 text-red-600' :
                              rec.category === 'supplies' ? 'bg-purple-50 text-purple-600' :
                              rec.category === 'procedures' ? 'bg-green-50 text-green-600' :
                              'bg-amber-50 text-amber-600'
                            }
                          `}>
                            {rec.category.charAt(0).toUpperCase() + rec.category.slice(1)}
                          </Badge>
                          
                          <Badge variant="outline" className={`
                            ${rec.impact === 'high' ? 'bg-green-50 text-green-600' : 
                              rec.impact === 'medium' ? 'bg-amber-50 text-amber-600' : 
                              'bg-blue-50 text-blue-600'
                            }
                          `}>
                            {rec.impact.charAt(0).toUpperCase() + rec.impact.slice(1)} Impact
                          </Badge>
                        </div>
                        <CardTitle className="text-base">{rec.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground text-sm mb-3">{rec.description}</p>
                        
                        <div className="rounded-md bg-muted p-3 mb-3">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium">Potential Impact</div>
                            <div className="text-green-600 font-semibold">
                              ${rec.potentialSavings.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-sm font-medium mb-1">Implementation:</div>
                        <p className="text-sm text-muted-foreground mb-4">{rec.implementation}</p>
                        
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <FileText className="h-3.5 w-3.5 mr-1" />
                            View Details
                          </Button>
                          <Button size="sm" className="flex-1">
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            Implement
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <div className="mt-8">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Total Economic Impact</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Potential Revenue Increase</div>
                          <div className="text-2xl font-bold text-green-600">
                            ${Math.round(recommendations
                              .filter(rec => rec.category === 'procedures' || rec.category === 'cancelations')
                              .reduce((sum, rec) => sum + rec.potentialSavings, 0)
                            ).toLocaleString()}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {(Math.round(recommendations
                              .filter(rec => rec.category === 'procedures' || rec.category === 'cancelations')
                              .reduce((sum, rec) => sum + rec.potentialSavings, 0) / 
                              currentMonthData.revenue * 100
                            * 10) / 10).toFixed(1)}% of current revenue
                          </p>
                        </div>
                        
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Potential Cost Reduction</div>
                          <div className="text-2xl font-bold text-green-600">
                            ${Math.round(recommendations
                              .filter(rec => rec.category !== 'procedures' && rec.category !== 'cancelations')
                              .reduce((sum, rec) => sum + rec.potentialSavings, 0)
                            ).toLocaleString()}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {(Math.round(recommendations
                              .filter(rec => rec.category !== 'procedures' && rec.category !== 'cancelations')
                              .reduce((sum, rec) => sum + rec.potentialSavings, 0) / 
                              currentMonthData.expenses * 100
                            * 10) / 10).toFixed(1)}% of current expenses
                          </p>
                        </div>
                        
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Total Profit Improvement</div>
                          <div className="text-2xl font-bold text-green-600">
                            ${Math.round(recommendations
                              .reduce((sum, rec) => sum + rec.potentialSavings, 0)
                            ).toLocaleString()}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {(Math.round(recommendations
                              .reduce((sum, rec) => sum + rec.potentialSavings, 0) / 
                              currentMonthData.profit * 100
                            * 10) / 10).toFixed(1)}% profit increase potential
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-6 pt-6 border-t">
                        <Button className="w-full">
                          Generate Complete Revenue Optimization Plan
                        </Button>
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
          <TicketIcon className="h-4 w-4 mr-2" />
          Schedule Review Meeting
        </Button>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Download Full Report
        </Button>
      </CardFooter>
    </Card>
  );
}