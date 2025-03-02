
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { CalendarIcon, DownloadIcon, BarChartIcon, LineChartIcon, PieChartIcon } from '@radix-ui/react-icons';
import { Separator } from '@/components/ui/separator';
import { FinancialForecast } from '@/components/analytics/financial-forecast';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { addDays, format, subMonths } from 'date-fns';

export default function FinancialDashboardPage() {
  const [activeTab, setActiveTab] = useState('summary');
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: subMonths(new Date(), 6),
    to: new Date()
  });
  const [summaryData, setSummaryData] = useState<any>(null);
  const [yearlyData, setYearlyData] = useState<any>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { toast } = useToast();
  
  const fetchFinancialSummary = async () => {
    if (!dateRange.from || !dateRange.to) return;
    
    setIsLoading(true);
    try {
      const response = await api.get('/financial/summary', {
        params: {
          startDate: format(dateRange.from, 'yyyy-MM-dd'),
          endDate: format(dateRange.to, 'yyyy-MM-dd')
        }
      });
      setSummaryData(response.data);
    } catch (error) {
      toast({
        title: "Error fetching data",
        description: "Failed to load financial summary",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchYearlyData = async (year: number) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/financial/tax-report/${year}`);
      setYearlyData(response.data);
    } catch (error) {
      toast({
        title: "Error fetching data",
        description: "Failed to load yearly financial data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  React.useEffect(() => {
    fetchFinancialSummary();
  }, [dateRange.from, dateRange.to]);
  
  React.useEffect(() => {
    fetchYearlyData(selectedYear);
  }, [selectedYear]);
  
  // Payment method chart data
  const paymentMethodsData = summaryData ? [
    { name: 'Cash', value: summaryData.paymentMethods.cash },
    { name: 'Credit Card', value: summaryData.paymentMethods.creditCard },
    { name: 'Check', value: summaryData.paymentMethods.check },
    { name: 'Insurance', value: summaryData.paymentMethods.insurance },
    { name: 'Other', value: summaryData.paymentMethods.other }
  ] : [];
  
  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  // Quarterly revenue data for bar chart
  const quarterlyRevenueData = yearlyData ? [
    { name: 'Q1', revenue: yearlyData.quarterlyRevenue[0] },
    { name: 'Q2', revenue: yearlyData.quarterlyRevenue[1] },
    { name: 'Q3', revenue: yearlyData.quarterlyRevenue[2] },
    { name: 'Q4', revenue: yearlyData.quarterlyRevenue[3] }
  ] : [];
  
  const exportFinancialData = async () => {
    try {
      const response = await api.get(`/financial/export/${selectedYear}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `DentaMind_Financial_${selectedYear}.xlsx`);
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was a problem exporting the financial data.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive financial analytics and reporting</p>
        </div>
        
        <div className="flex items-center gap-2">
          <DatePickerWithRange 
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
          <Button variant="outline" onClick={exportFinancialData}>
            <DownloadIcon className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-1 md:grid-cols-4 h-auto">
          <TabsTrigger value="summary" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <BarChartIcon className="h-4 w-4" />
            <span>Summary</span>
          </TabsTrigger>
          <TabsTrigger value="yearly" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <PieChartIcon className="h-4 w-4" />
            <span>Yearly Analysis</span>
          </TabsTrigger>
          <TabsTrigger value="forecast" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <LineChartIcon className="h-4 w-4" />
            <span>Forecast</span>
          </TabsTrigger>
          <TabsTrigger value="tax" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <CalendarIcon className="h-4 w-4" />
            <span>Tax Reports</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${summaryData?.revenue ? (summaryData.revenue / 100).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}
                </div>
                <p className="text-xs text-muted-foreground">
                  For period {dateRange.from ? format(dateRange.from, 'MMM d, yyyy') : ''} - {dateRange.to ? format(dateRange.to, 'MMM d, yyyy') : ''}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Net Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${summaryData?.netRevenue ? (summaryData.netRevenue / 100).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}
                </div>
                <p className="text-xs text-muted-foreground">
                  After adjustments and refunds
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Refunds</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${summaryData?.refunds ? (summaryData.refunds / 100).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total refunds processed
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summaryData?.transactionCount || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total number of transactions
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Distribution of payments by method</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {isLoading ? (
                    <div className="h-full flex items-center justify-center">
                      <span>Loading...</span>
                    </div>
                  ) : summaryData ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={paymentMethodsData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {paymentMethodsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `$${(value / 100).toFixed(2)}`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>Recent transaction activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {/* This would be populated with actual transaction data */}
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    Transaction history visualization will appear here
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="yearly" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Yearly Financial Analysis</h2>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedYear(selectedYear - 1)}
              >
                Previous Year
              </Button>
              <div className="font-bold px-4">{selectedYear}</div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedYear(selectedYear + 1)}
                disabled={selectedYear >= new Date().getFullYear()}
              >
                Next Year
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${yearlyData?.totalRevenue ? (yearlyData.totalRevenue / 100).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}
                </div>
                <p className="text-xs text-muted-foreground">
                  For year {selectedYear}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Average Per Quarter</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${yearlyData?.totalRevenue ? ((yearlyData.totalRevenue / 4) / 100).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Quarterly average
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Transaction Count</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {yearlyData?.transactionCount || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total transactions
                </p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Quarterly Revenue</CardTitle>
              <CardDescription>Revenue breakdown by quarter</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <span>Loading...</span>
                  </div>
                ) : yearlyData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={quarterlyRevenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value) => `$${(value / 100).toFixed(2)}`} />
                      <Legend />
                      <Bar dataKey="revenue" name="Revenue" fill="#0ea5e9" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Category</CardTitle>
              <CardDescription>Breakdown by procedure category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <span>Loading...</span>
                  </div>
                ) : yearlyData && yearlyData.categorizedRevenue ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={Object.entries(yearlyData.categorizedRevenue).map(([category, amount]) => ({
                          name: category,
                          value: amount
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {Object.keys(yearlyData.categorizedRevenue).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `$${(value / 100).toFixed(2)}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No category data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="forecast">
          <FinancialForecast classname="" />
        </TabsContent>
        
        <TabsContent value="tax" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Tax Reports</h2>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedYear(selectedYear - 1)}
              >
                Previous Year
              </Button>
              <div className="font-bold px-4">{selectedYear}</div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedYear(selectedYear + 1)}
                disabled={selectedYear >= new Date().getFullYear()}
              >
                Next Year
              </Button>
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Annual Tax Summary</CardTitle>
              <CardDescription>Tax information for year {selectedYear}</CardDescription>
            </CardHeader>
            <CardContent>
              {yearlyData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground">Total Revenue</div>
                      <div className="text-2xl font-bold">
                        ${(yearlyData.totalRevenue / 100).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </div>
                    </div>
                    
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground">Transactions</div>
                      <div className="text-2xl font-bold">{yearlyData.transactionCount}</div>
                    </div>
                    
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground">Year</div>
                      <div className="text-2xl font-bold">{yearlyData.year}</div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Quarterly Breakdown</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {yearlyData.quarterlyRevenue.map((amount: number, index: number) => (
                        <div key={index} className="bg-muted/30 p-4 rounded-lg">
                          <div className="text-sm font-medium text-muted-foreground">Q{index + 1}</div>
                          <div className="text-xl font-bold">${(amount / 100).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Category Breakdown</h3>
                    {yearlyData.categorizedRevenue && Object.keys(yearlyData.categorizedRevenue).length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(yearlyData.categorizedRevenue).map(([category, amount]: [string, any], index: number) => (
                          <div key={index} className="bg-muted/30 p-4 rounded-lg">
                            <div className="text-sm font-medium text-muted-foreground">{category}</div>
                            <div className="text-xl font-bold">${(amount / 100).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-muted-foreground">No category data available</div>
                    )}
                  </div>
                  
                  <div className="flex justify-end mt-4">
                    <Button onClick={exportFinancialData}>
                      <DownloadIcon className="mr-2 h-4 w-4" />
                      Export Tax Report
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  {isLoading ? "Loading tax data..." : "No tax data available for selected year"}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
