import { useQuery } from "@tanstack/react-query";
import { Bar, Line } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar,
  DollarSign,
  TrendingUp,
  FileText,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";

export function FinancialDashboard() {
  const startOfYear = new Date(new Date().getFullYear(), 0, 1);
  const endOfYear = new Date(new Date().getFullYear(), 11, 31);

  const { data: financialSummary } = useQuery({
    queryKey: ["/api/financial/summary", startOfYear, endOfYear],
  });

  const { data: taxReport } = useQuery({
    queryKey: ["/api/financial/tax-report", new Date().getFullYear()],
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${financialSummary?.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              YTD Revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Insurance Pending
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${financialSummary?.pendingInsurance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting Insurance Payment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Patient Collections
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${financialSummary?.patientPayments.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Direct Patient Payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Write-offs
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${financialSummary?.writeOffs.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Total Adjustments & Write-offs
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="revenue" className="w-full">
        <TabsList>
          <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
          <TabsTrigger value="insurance">Insurance Claims</TabsTrigger>
          <TabsTrigger value="tax">Tax Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <Bar
                data={{
                  labels: taxReport?.quarterlyTotals 
                    ? Object.keys(taxReport.quarterlyTotals).map(q => `Q${q}`)
                    : [],
                  datasets: [{
                    label: "Quarterly Revenue",
                    data: taxReport?.quarterlyTotals 
                      ? Object.values(taxReport.quarterlyTotals)
                      : [],
                    backgroundColor: "rgba(54, 162, 235, 0.5)",
                  }]
                }}
                options={{
                  responsive: true,
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: "Amount ($)"
                      }
                    }
                  }
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insurance">
          <Card>
            <CardHeader>
              <CardTitle>Insurance Claims Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* Add insurance claims table/chart here */}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax">
          <Card>
            <CardHeader>
              <CardTitle>Tax Categories Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {taxReport?.categorizedTotals && (
                <div className="space-y-4">
                  {Object.entries(taxReport.categorizedTotals).map(([category, amount]) => (
                    <div key={category} className="flex justify-between items-center">
                      <span className="font-medium capitalize">
                        {category.replace('_', ' ')}
                      </span>
                      <span>${amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
