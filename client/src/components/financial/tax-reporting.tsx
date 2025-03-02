
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  ChartData
} from 'chart.js';
import { Download } from 'lucide-react';
import { api } from '@/lib/api';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface TaxReport {
  year: number;
  totalRevenue: number;
  quarterlyRevenue: number[];
  categorizedRevenue: Record<string, number>;
  transactionCount: number;
}

const categoryLabels: Record<string, string> = {
  'preventive': 'Preventive Care',
  'diagnostic': 'Diagnostic',
  'restorative': 'Restorative',
  'endodontic': 'Endodontic',
  'periodontic': 'Periodontic',
  'prosthodontic': 'Prosthodontic',
  'surgical': 'Oral Surgery',
  'orthodontic': 'Orthodontic'
};

export function TaxReporting() {
  const { toast } = useToast();
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState<boolean>(false);
  const [taxReport, setTaxReport] = useState<TaxReport | null>(null);
  
  // Generate available years (current year and 5 years back)
  const availableYears = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);
  
  useEffect(() => {
    if (year) {
      fetchTaxReport();
    }
  }, [year]);
  
  const fetchTaxReport = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/financial/tax-report/${year}`);
      setTaxReport(response.data);
    } catch (error) {
      console.error('Failed to fetch tax report:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch tax report. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      const response = await api.get(`/financial/export/${year}?format=${format}`, {
        responseType: 'blob'
      });
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tax-report-${year}.${format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Success',
        description: `Tax report exported as ${format.toUpperCase()} successfully.`
      });
    } catch (error) {
      console.error('Failed to export tax report:', error);
      toast({
        title: 'Error',
        description: 'Failed to export tax report. Please try again.',
        variant: 'destructive'
      });
    }
  };
  
  // Prepare chart data for quarterly revenue
  const quarterlyChartData: ChartData<'bar'> = {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [
      {
        label: 'Revenue by Quarter',
        data: taxReport?.quarterlyRevenue || [0, 0, 0, 0],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)'
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)'
        ],
        borderWidth: 1
      }
    ]
  };
  
  // Prepare chart data for categorized revenue
  const prepareCategorizeeData = () => {
    if (!taxReport) return { labels: [], datasets: [] };
    
    const labels = [];
    const values = [];
    
    for (const [category, amount] of Object.entries(taxReport.categorizedRevenue)) {
      labels.push(categoryLabels[category] || category);
      values.push(amount);
    }
    
    return {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)'
          ],
          borderWidth: 1
        }
      ]
    };
  };
  
  const categoryChartData = prepareCategorizeeData();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Tax Reporting</h2>
        <div className="flex items-center space-x-4">
          <Select
            value={year.toString()}
            onValueChange={(value) => setYear(parseInt(value))}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleExport('csv')}
            >
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleExport('excel')}
            >
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleExport('pdf')}
            >
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : taxReport ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${taxReport.totalRevenue.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">For year {taxReport.year}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{taxReport.transactionCount}</div>
                <p className="text-sm text-muted-foreground">Total number of financial transactions</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Average Per Quarter</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  ${(taxReport.totalRevenue / 4).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
                <p className="text-sm text-muted-foreground">Average quarterly revenue</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quarterly Revenue</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <Bar
                  data={quarterlyChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return `$${context.raw}`;
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value) {
                            return '$' + value;
                          }
                        }
                      }
                    }
                  }}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Category</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <Pie
                  data={categoryChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const value = context.raw as number;
                            const percentage = ((value / taxReport.totalRevenue) * 100).toFixed(1);
                            return `$${value} (${percentage}%)`;
                          }
                        }
                      }
                    }
                  }}
                />
              </CardContent>
            </Card>
          </div>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Tax Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p>
                  This tax report provides a summary of financial transactions for the year {taxReport.year}.
                  The data is categorized by quarter and procedure category for tax reporting purposes.
                </p>
                <p>
                  For exact line-item details, please export the full report to CSV or Excel.
                  Consult with your accountant or financial advisor regarding tax implications.
                </p>
                <p className="text-sm text-muted-foreground">
                  Note: This report is provided for informational purposes only and should not be considered
                  tax advice. DentaMind is not responsible for tax filing accuracy.
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              Select a year to view tax report data
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
