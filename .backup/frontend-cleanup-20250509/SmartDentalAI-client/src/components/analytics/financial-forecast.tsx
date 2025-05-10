
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { InfoCircledIcon, DownloadIcon, ReloadIcon } from '@radix-ui/react-icons';
import { useToast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';

interface FinancialForecastProps {
  classname?: string;
}

export function FinancialForecast({ classname }: FinancialForecastProps) {
  const [forecastData, setForecastData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [forecastPeriod, setForecastPeriod] = useState(12);
  const { toast } = useToast();

  const fetchForecastData = async (months: number) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/financial/forecast?months=${months}`);
      setForecastData(response.data);
    } catch (error) {
      toast({
        title: "Error fetching forecast data",
        description: "There was a problem retrieving the financial forecast.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchForecastData(forecastPeriod);
  }, [forecastPeriod]);

  const exportForecast = async () => {
    try {
      const response = await api.get(`/financial/export-forecast?months=${forecastPeriod}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `DentaMind_Financial_Forecast_${new Date().getFullYear()}.xlsx`);
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was a problem exporting the forecast data.",
        variant: "destructive"
      });
    }
  };

  // Combine historical and forecast data for chart
  const chartData = forecastData ? [
    ...forecastData.historicalData.map((item: any) => ({
      ...item,
      month: item.month,
      actual: item.amount,
      forecast: null
    })),
    ...forecastData.forecastData.map((item: any) => ({
      ...item,
      month: item.month,
      actual: null,
      forecast: item.forecastedAmount
    }))
  ] : [];

  return (
    <Card className={classname}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Financial Forecast</CardTitle>
            <CardDescription>Predicted revenue for the next {forecastPeriod} months</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchForecastData(forecastPeriod)}
              disabled={isLoading}
            >
              {isLoading ? <ReloadIcon className="mr-2 h-4 w-4 animate-spin" /> : <ReloadIcon className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportForecast}
              disabled={isLoading || !forecastData}
            >
              <DownloadIcon className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="chart">
          <TabsList className="mb-4">
            <TabsTrigger value="chart">Chart</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>
          
          <TabsContent value="chart">
            <div className="h-[350px] w-full">
              {isLoading ? (
                <div className="h-full w-full flex items-center justify-center">
                  <ReloadIcon className="h-8 w-8 animate-spin text-primary/50" />
                </div>
              ) : forecastData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      angle={-45} 
                      textAnchor="end"
                      height={70}
                      tickMargin={15}
                    />
                    <YAxis 
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      formatter={(value: any) => [`$${value.toLocaleString()}`, '']}
                      labelFormatter={(label: any) => `Month: ${label}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="actual" 
                      name="Historical Revenue"
                      stroke="#0ea5e9" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="forecast" 
                      name="Forecasted Revenue"
                      stroke="#f97316" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                  No forecast data available
                </div>
              )}
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="font-medium text-sm">Forecast Period:</div>
                <div className="flex rounded-md overflow-hidden border">
                  <Button 
                    variant={forecastPeriod === 6 ? "default" : "ghost"}
                    size="sm"
                    className="h-8 rounded-none" 
                    onClick={() => setForecastPeriod(6)}
                  >
                    6 Months
                  </Button>
                  <Button 
                    variant={forecastPeriod === 12 ? "default" : "ghost"}
                    size="sm"
                    className="h-8 rounded-none" 
                    onClick={() => setForecastPeriod(12)}
                  >
                    12 Months
                  </Button>
                  <Button 
                    variant={forecastPeriod === 24 ? "default" : "ghost"}
                    size="sm"
                    className="h-8 rounded-none" 
                    onClick={() => setForecastPeriod(24)}
                  >
                    24 Months
                  </Button>
                </div>
              </div>
              
              {forecastData && (
                <div className="flex items-center text-sm gap-1">
                  <InfoCircledIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Growth rate: </span>
                  <span className={`font-medium ${forecastData.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(forecastData.growthRate * 100).toFixed(1)}%
                  </span>
                  <span className="text-muted-foreground ml-2">Confidence: </span>
                  <span className="font-medium capitalize">{forecastData.confidence}</span>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="details">
            {isLoading ? (
              <div className="h-[300px] w-full flex items-center justify-center">
                <ReloadIcon className="h-8 w-8 animate-spin text-primary/50" />
              </div>
            ) : forecastData ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Forecasted Revenue</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {forecastData.forecastData.slice(0, 6).map((item: any, index: number) => (
                      <div key={index} className="bg-muted/30 p-3 rounded-lg">
                        <div className="text-sm text-muted-foreground">{item.month}</div>
                        <div className="text-xl font-bold">${item.forecastedAmount.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-semibold mb-2">Analysis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <div className="text-sm font-medium mb-1">Growth Trend</div>
                      <div className="text-2xl font-bold mb-1 flex items-center">
                        {(forecastData.growthRate * 100).toFixed(1)}%
                        {forecastData.growthRate > 0 ? (
                          <span className="text-green-500 text-sm ml-2">↑ per month</span>
                        ) : (
                          <span className="text-red-500 text-sm ml-2">↓ per month</span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {forecastData.growthRate > 0 
                          ? "Positive growth trajectory indicates healthy business expansion." 
                          : "Negative growth trend requires attention and possible intervention."}
                      </div>
                    </div>
                    
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <div className="text-sm font-medium mb-1">Revenue Projection</div>
                      <div className="text-2xl font-bold mb-1">
                        ${forecastData.forecastData.reduce((sum: number, item: any) => sum + item.forecastedAmount, 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total projected revenue over the next {forecastPeriod} months
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Recommendations</h3>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <ul className="list-disc list-inside space-y-1">
                      {forecastData.growthRate > 0.1 && (
                        <li className="text-sm">
                          Consider investing in expanded capacity to accommodate growth
                        </li>
                      )}
                      {forecastData.growthRate < 0 && (
                        <li className="text-sm">
                          Implement patient retention strategies to reverse negative trend
                        </li>
                      )}
                      <li className="text-sm">
                        Review staffing levels based on projected patient load
                      </li>
                      <li className="text-sm">
                        Plan inventory and supplies according to projected business volume
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
                No forecast data available
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
