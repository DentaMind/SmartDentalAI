
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { BarChart, LineChart } from "@/components/ui/visualizations";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import { useState } from "react";

export function TaxReport() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  
  const { data: taxReport, isLoading, error } = useQuery({
    queryKey: ["/api/financial/tax-report", selectedYear],
    queryFn: () => api.get(`/api/financial/tax-report/${selectedYear}`).then(res => res.data)
  });
  
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  
  // Prepare chart data for quarterly revenue
  const quarterlyRevenueData = {
    labels: ["Q1", "Q2", "Q3", "Q4"],
    datasets: [
      {
        label: `${selectedYear} Revenue`,
        data: taxReport?.quarterlyRevenue || [0, 0, 0, 0],
        backgroundColor: "rgb(99, 102, 241, 0.7)",
        borderColor: "rgb(99, 102, 241)",
        borderWidth: 1
      }
    ]
  };
  
  // Prepare chart data for categorized revenue
  const categorizedRevenueData = {
    labels: taxReport?.categorizedRevenue ? Object.keys(taxReport.categorizedRevenue) : [],
    datasets: [
      {
        label: `${selectedYear} Revenue by Category`,
        data: taxReport?.categorizedRevenue ? Object.values(taxReport.categorizedRevenue) : [],
        backgroundColor: [
          "rgb(59, 130, 246, 0.7)",
          "rgb(16, 185, 129, 0.7)",
          "rgb(245, 158, 11, 0.7)",
          "rgb(239, 68, 68, 0.7)",
          "rgb(139, 92, 246, 0.7)",
          "rgb(236, 72, 153, 0.7)",
        ],
        borderWidth: 1
      }
    ]
  };
  
  // Mock functionality for PDF export
  const exportAsPDF = () => {
    alert("This would export the tax report as PDF in a real implementation");
  };
  
  // Mock functionality for spreadsheet export
  const exportAsSpreadsheet = () => {
    alert("This would export the tax report as a spreadsheet in a real implementation");
  };
  
  // Mock functionality for printing
  const printReport = () => {
    window.print();
  };
  
  if (isLoading) {
    return <div className="text-center py-8">Loading tax report data...</div>;
  }
  
  if (error) {
    return <div className="text-center py-8 text-red-500">Failed to load tax report data.</div>;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Tax Report</h2>
        <div className="flex items-center gap-2">
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number(value))}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button onClick={exportAsPDF} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button onClick={exportAsSpreadsheet} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button onClick={printReport} variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${taxReport?.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {selectedYear} Total Revenue
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{taxReport?.transactionCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total transactions in {selectedYear}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Average Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${taxReport?.totalRevenue && taxReport?.transactionCount
                ? (taxReport.totalRevenue / taxReport.transactionCount).toFixed(2)
                : "0.00"
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Average transaction value
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="quarterly">
        <TabsList className="mb-4">
          <TabsTrigger value="quarterly">Quarterly Revenue</TabsTrigger>
          <TabsTrigger value="categories">Revenue by Category</TabsTrigger>
        </TabsList>
        
        <TabsContent value="quarterly">
          <Card>
            <CardHeader>
              <CardTitle>Quarterly Revenue Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <BarChart data={quarterlyRevenueData} />
              </div>
              
              <div className="grid grid-cols-4 gap-4 mt-8">
                {taxReport?.quarterlyRevenue?.map((amount, index) => (
                  <div key={index} className="space-y-1">
                    <h4 className="text-sm font-medium">Q{index + 1}</h4>
                    <div className="text-xl font-bold">${amount.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      {Math.round((amount / taxReport.totalRevenue) * 100)}% of annual
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <BarChart data={categorizedRevenueData} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                {taxReport?.categorizedRevenue && Object.entries(taxReport.categorizedRevenue).map(([category, amount]) => (
                  <div key={category} className="space-y-1">
                    <h4 className="text-sm font-medium">{category}</h4>
                    <div className="text-xl font-bold">${(amount as number).toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(((amount as number) / taxReport.totalRevenue) * 100)}% of annual
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="pt-4 border-t text-sm text-muted-foreground">
        <p className="mb-2">Tax Report Notes:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>This report is for informational purposes only and should be verified by an accountant.</li>
          <li>All amounts are shown in USD and rounded to the nearest dollar.</li>
          <li>This report does not include practice expenses, which would be required for tax filings.</li>
          <li>Consult with your CPA for complete tax preparation guidance.</li>
        </ul>
      </div>
    </div>
  );
}
