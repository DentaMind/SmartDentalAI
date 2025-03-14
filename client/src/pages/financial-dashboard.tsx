import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TaxReport } from "@/components/financial/tax-report";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DollarSign,
  TrendingUp,
  FileText,
  AlertCircle,
  Calendar,
  BarChart as BarChartIcon,
  PieChart,
  Clock,
  Calculator,
  BadgeDollarSign,
  Scale
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { BarChart, LineChart, PieChart as PieChartComponent } from "@/components/ui/visualizations";
import { TaxReporting } from '@/components/financial/tax-reporting';
import { InsuranceClaimTracker } from '@/components/financial/insurance-claim-tracker';
import { RevenueCalculator } from '@/components/financial/revenue-calculator';
import { TaxOptimization } from '@/components/financial/tax-optimization';
import { useAuth } from '@/hooks/use-auth';

export default function FinancialDashboardPage() {
  const today = new Date();
  const currentYear = today.getFullYear();
  
  // Date range for financial summary
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(subMonths(today, 12)),
    end: endOfMonth(today)
  });
  
  // Fetch financial summary data
  const { data: financialSummary } = useQuery({
    queryKey: ["/api/financial/summary", dateRange.start, dateRange.end],
    queryFn: () => api.get("/api/financial/summary", {
      params: {
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString()
      }
    }).then(res => res.data)
  });
  
  // Fetch financial forecast
  const { data: forecast } = useQuery({
    queryKey: ["/api/financial/forecast"],
    queryFn: () => api.get("/api/financial/forecast").then(res => res.data)
  });
  
  // Fetch aging report
  const { data: agingReport } = useQuery({
    queryKey: ["/api/financial/aging-report"],
    queryFn: () => api.get("/api/financial/aging-report").then(res => res.data)
  });
  
  // Fetch profitability report
  const { data: profitability } = useQuery({
    queryKey: ["/api/financial/profitability", currentYear],
    queryFn: () => api.get(`/api/financial/profitability/${currentYear}`).then(res => res.data)
  });
  
  // Prepare revenue by method chart data
  const revenueByMethodData = {
    labels: financialSummary?.paymentMethods ? 
      ["Cash", "Credit Card", "Check", "Insurance", "Other"] : [],
    datasets: [{
      label: "Revenue by Payment Method",
      data: financialSummary?.paymentMethods ? 
        [
          financialSummary.paymentMethods.cash,
          financialSummary.paymentMethods.creditCard,
          financialSummary.paymentMethods.check,
          financialSummary.paymentMethods.insurance,
          financialSummary.paymentMethods.other
        ] : [],
      backgroundColor: [
        "rgb(54, 162, 235, 0.7)",
        "rgb(255, 99, 132, 0.7)",
        "rgb(255, 206, 86, 0.7)",
        "rgb(75, 192, 192, 0.7)",
        "rgb(153, 102, 255, 0.7)"
      ]
    }]
  };
  
  // Prepare forecast chart data
  const forecastData = {
    labels: forecast?.forecastData.map((d: any) => d.month) || [],
    datasets: [{
      label: "Revenue Forecast",
      data: forecast?.forecastData.map((d: any) => d.revenue) || [],
      borderColor: "rgb(99, 102, 241)",
      backgroundColor: "rgba(99, 102, 241, 0.5)",
      tension: 0.3,
      fill: true
    }]
  };
  
  // Prepare aging report chart data
  const agingReportData = {
    labels: ["Current", "31-60 Days", "61-90 Days", "91-120 Days", "120+ Days"],
    datasets: [{
      label: "Outstanding Claims by Age",
      data: agingReport ? [
        agingReport.agingBuckets.current.value,
        agingReport.agingBuckets.thirtyDays.value,
        agingReport.agingBuckets.sixtyDays.value,
        agingReport.agingBuckets.ninetyDays.value,
        agingReport.agingBuckets.overNinetyDays.value
      ] : [],
      backgroundColor: [
        "rgb(16, 185, 129, 0.7)",
        "rgb(245, 158, 11, 0.7)",
        "rgb(249, 115, 22, 0.7)",
        "rgb(239, 68, 68, 0.7)",
        "rgb(220, 38, 38, 0.7)"
      ]
    }]
  };
  
  // Prepare profitability chart data
  const profitabilityData = {
    labels: profitability ? Object.keys(profitability.expenses) : [],
    datasets: [{
      label: "Expenses Breakdown",
      data: profitability ? Object.values(profitability.expenses) : [],
      backgroundColor: [
        "rgb(59, 130, 246, 0.7)",
        "rgb(16, 185, 129, 0.7)",
        "rgb(245, 158, 11, 0.7)",
        "rgb(239, 68, 68, 0.7)",
        "rgb(139, 92, 246, 0.7)",
        "rgb(236, 72, 153, 0.7)",
        "rgb(248, 113, 113, 0.7)",
        "rgb(52, 211, 153, 0.7)",
        "rgb(251, 191, 36, 0.7)",
        "rgb(129, 140, 248, 0.7)"
      ]
    }]
  };
  
  // Time period options
  const timePeriods = [
    { label: "Last 30 Days", value: "30days" },
    { label: "Last 90 Days", value: "90days" },
    { label: "Last 6 Months", value: "6months" },
    { label: "Last 12 Months", value: "12months" },
    { label: "Year to Date", value: "ytd" },
    { label: "All Time", value: "all" }
  ];
  
  // Change time period handler
  const handleTimePeriodChange = (value: string) => {
    let start = new Date();
    const end = endOfMonth(today);
    
    switch (value) {
      case "30days":
        start = subMonths(today, 1);
        break;
      case "90days":
        start = subMonths(today, 3);
        break;
      case "6months":
        start = subMonths(today, 6);
        break;
      case "12months":
        start = subMonths(today, 12);
        break;
      case "ytd":
        start = new Date(currentYear, 0, 1);
        break;
      case "all":
        start = new Date(2020, 0, 1); // Arbitrary start date for "all time"
        break;
    }
    
    setDateRange({ start, end });
  };
  
  return (
    <div className="container mx-auto p-4 py-6 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">Financial Dashboard</h1>
      
      <div className="mb-6 flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 inline-block mr-1" />
          <span>
            {format(dateRange.start, "MMM d, yyyy")} - {format(dateRange.end, "MMM d, yyyy")}
          </span>
        </div>
        
        <Select
          defaultValue="12months"
          onValueChange={handleTimePeriodChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time period" />
          </SelectTrigger>
          <SelectContent>
            {timePeriods.map(period => (
              <SelectItem key={period.value} value={period.value}>
                {period.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Tabs defaultValue="overview">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="tax">Tax Reports</TabsTrigger>
          <TabsTrigger value="claims">Insurance Claims</TabsTrigger>
          <TabsTrigger value="forecast">Forecasting</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${financialSummary?.revenue?.toLocaleString() || "0"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total Revenue
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Net Revenue
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${financialSummary?.netRevenue?.toLocaleString() || "0"}
                </div>
                <p className="text-xs text-muted-foreground">
                  After Refunds & Adjustments
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Transactions
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {financialSummary?.transactionCount?.toLocaleString() || "0"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total Transactions
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg. Transaction
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${financialSummary && financialSummary.transactionCount > 0
                    ? (financialSummary.revenue / financialSummary.transactionCount).toFixed(2)
                    : "0.00"
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  Average Transaction Value
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <PieChartComponent data={revenueByMethodData} />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Outstanding Claims Aging</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <BarChart data={agingReportData} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="claims" className="mt-6">
          <InsuranceClaimTracker />
        </TabsContent>
        
        <TabsContent value="tax" className="mt-6">
          <TaxReporting />
        </TabsContent>
        
        <TabsContent value="forecast">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Revenue Forecast</CardTitle>
              <CardDescription>
                Projected revenue for the next 12 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <LineChart data={forecastData} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}