import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { DatePickerWithRange } from './ui/date-range-picker';
import { RefreshCw, AlertTriangle, MapPin, BarChart, TrendingUp, Database } from 'lucide-react';
import {
  Chart as ChartJS,
  ArcElement,
  LineElement,
  BarElement,
  PointElement,
  BarController,
  LineController,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
  TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Bar, Line, Pie, Scatter } from 'react-chartjs-2';
import { websocketClientMetricsService, ClientMetricsSummary, GeographicMetric, AnomalySummary, Correlation } from '../services/websocketClientMetricsService';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  LineElement,
  BarElement,
  PointElement,
  BarController,
  LineController,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
  TimeScale
);

// Chart colors
const CHART_COLORS = {
  blue: 'rgba(53, 162, 235, 0.5)',
  green: 'rgba(75, 192, 192, 0.5)',
  purple: 'rgba(153, 102, 255, 0.5)',
  orange: 'rgba(255, 159, 64, 0.5)',
  red: 'rgba(255, 99, 132, 0.5)',
  yellow: 'rgba(255, 205, 86, 0.5)',
};

const WebSocketClientMetricsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for different metrics
  const [metricsSummary, setMetricsSummary] = useState<ClientMetricsSummary | null>(null);
  const [geoMetrics, setGeoMetrics] = useState<GeographicMetric[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalySummary | null>(null);
  const [correlation, setCorrelation] = useState<Correlation | null>(null);
  
  // Date range for filtering
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    to: new Date()
  });
  
  // Fetch all data on initial load
  useEffect(() => {
    fetchAllData();
  }, []);
  
  // Refetch when date range changes
  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      fetchAllData();
    }
  }, [dateRange]);
  
  // Function to fetch all data
  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Convert dates to ISO strings
      const startTime = dateRange.from?.toISOString();
      const endTime = dateRange.to?.toISOString();
      
      // Fetch all data in parallel
      const [summary, geo, anomalySummary, uxCorrelation] = await Promise.all([
        websocketClientMetricsService.getClientMetricsSummary(startTime, endTime),
        websocketClientMetricsService.getGeographicDistribution(),
        websocketClientMetricsService.getAnomaliesSummary(),
        websocketClientMetricsService.getUXCorrelation(startTime, endTime)
      ]);
      
      setMetricsSummary(summary);
      setGeoMetrics(geo);
      setAnomalies(anomalySummary);
      setCorrelation(uxCorrelation);
    } catch (err) {
      console.error('Error fetching WebSocket client metrics:', err);
      setError('Failed to fetch WebSocket client metrics. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Get severity badge color
  const getAnomalySeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-yellow-500 text-white';
      case 'medium':
        return 'bg-orange-500 text-white';
      case 'high':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };
  
  // Chart for geographic distribution
  const getGeoChartData = () => {
    return {
      labels: geoMetrics.map(m => m.region),
      datasets: [
        {
          label: 'Clients',
          data: geoMetrics.map(m => m.client_count),
          backgroundColor: CHART_COLORS.blue,
        },
        {
          label: 'Avg Latency (ms)',
          data: geoMetrics.map(m => m.avg_latency),
          backgroundColor: CHART_COLORS.orange,
        }
      ]
    };
  };
  
  // Chart for correlation data
  const getCorrelationChartData = () => {
    if (!correlation || !correlation.time_series.length) return null;
    
    return {
      labels: correlation.time_series.map(point => new Date(point.timestamp)),
      datasets: [
        {
          label: 'WebSocket Latency (ms)',
          data: correlation.time_series.map(point => point.websocket.avg_latency),
          borderColor: CHART_COLORS.blue,
          backgroundColor: CHART_COLORS.blue,
          yAxisID: 'y',
        },
        {
          label: 'Page Load Time (ms)',
          data: correlation.time_series.map(point => point.ux.page_load_time),
          borderColor: CHART_COLORS.green,
          backgroundColor: CHART_COLORS.green,
          yAxisID: 'y1',
        }
      ]
    };
  };
  
  // Chart options for correlation chart
  const correlationChartOptions = {
    responsive: true,
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'hour' as const,
          tooltipFormat: 'MMM d, h:mm a',
          displayFormats: {
            hour: 'MMM d, h:mm a'
          }
        },
        title: {
          display: true,
          text: 'Time'
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'WebSocket Latency (ms)'
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false
        },
        title: {
          display: true,
          text: 'Page Load Time (ms)'
        }
      }
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">WebSocket Client Metrics Dashboard</h1>
          <p className="text-muted-foreground">
            Analysis of client-side WebSocket performance and user experience impact
          </p>
        </div>
        <div className="flex items-center gap-4">
          <DatePickerWithRange 
            date={dateRange} 
            setDate={setDateRange} 
          />
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAllData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
          <p>{error}</p>
        </div>
      )}

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="geographic">Geographic Analysis</TabsTrigger>
          <TabsTrigger value="anomalies">Anomaly Detection</TabsTrigger>
          <TabsTrigger value="correlation">UX Correlation</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Unique Clients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? '...' : metricsSummary?.client_count ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Distinct clients reporting metrics
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Average Latency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? '...' : `${(metricsSummary?.avg_latency ?? 0).toFixed(1)} ms`}
                </div>
                <p className="text-xs text-muted-foreground">
                  Average client-side message latency
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Connection Stability
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? '...' : `${(metricsSummary?.connection_stability ?? 0).toFixed(1)}%`}
                </div>
                <p className="text-xs text-muted-foreground">
                  Percentage of stable connections
                </p>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full" 
                    style={{ width: `${metricsSummary?.connection_stability ?? 0}%` }}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Error Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? '...' : `${(metricsSummary?.error_rate ?? 0).toFixed(2)}%`}
                </div>
                <p className="text-xs text-muted-foreground">
                  Percentage of failed WebSocket messages
                </p>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500 rounded-full" 
                    style={{ width: `${Math.min(metricsSummary?.error_rate ?? 0, 100)}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Anomaly Summary</CardTitle>
                <CardDescription>
                  Recent anomalies detected in WebSocket metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex h-64 items-center justify-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : anomalies && Object.keys(anomalies.severity_counts).length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Total Anomalies</p>
                        <p className="text-3xl font-bold">{anomalies.total_anomalies}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getAnomalySeverityColor('low')}>
                          Low: {anomalies.severity_counts.low}
                        </Badge>
                        <Badge className={getAnomalySeverityColor('medium')}>
                          Medium: {anomalies.severity_counts.medium}
                        </Badge>
                        <Badge className={getAnomalySeverityColor('high')}>
                          High: {anomalies.severity_counts.high}
                        </Badge>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-2">Anomalies by Metric</p>
                      {Object.entries(anomalies.metrics).map(([metric, data]) => (
                        <div key={metric} className="flex justify-between items-center p-2 border-b">
                          <span className="font-medium">{metric}</span>
                          <div className="flex gap-4">
                            <span className="text-sm">{data.count} issues</span>
                            <span className="text-sm text-red-600">
                              {data.avg_deviation.toFixed(1)}% deviation
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex h-64 items-center justify-center flex-col">
                    <AlertTriangle className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-muted-foreground">No anomalies detected in the selected time period</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
                <CardDescription>
                  WebSocket performance by region
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex h-64 items-center justify-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : geoMetrics && geoMetrics.length > 0 ? (
                  <div className="h-64">
                    <Bar
                      data={getGeoChartData()}
                      options={{
                        responsive: true,
                        scales: {
                          y: {
                            beginAtZero: true,
                          },
                        },
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex h-64 items-center justify-center flex-col">
                    <MapPin className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-muted-foreground">No geographic data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Geographic Analysis Tab */}
        <TabsContent value="geographic">
          <Card>
            <CardHeader>
              <CardTitle>Geographic Performance Analysis</CardTitle>
              <CardDescription>
                Analysis of WebSocket performance metrics across different geographic regions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex h-96 items-center justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : geoMetrics && geoMetrics.length > 0 ? (
                <div className="space-y-8">
                  <div className="h-96">
                    <Bar
                      data={getGeoChartData()}
                      options={{
                        responsive: true,
                        scales: {
                          y: {
                            beginAtZero: true,
                          },
                        },
                      }}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Connection Success Rate by Region</h3>
                      <div className="space-y-2">
                        {geoMetrics.map((region) => (
                          <div key={region.region} className="flex flex-col">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium">{region.region}</span>
                              <span className="text-sm">
                                {(region.connection_success_rate * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-500 rounded-full" 
                                style={{ width: `${region.connection_success_rate * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Average Latency by Region</h3>
                      <div className="space-y-2">
                        {geoMetrics.map((region) => (
                          <div key={region.region} className="flex flex-col">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium">{region.region}</span>
                              <span className="text-sm">
                                {region.avg_latency.toFixed(1)} ms
                              </span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 rounded-full" 
                                style={{ width: `${Math.min(region.avg_latency / 10, 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-96 items-center justify-center flex-col">
                  <MapPin className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-muted-foreground">No geographic data available for the selected time period</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Anomalies Tab */}
        <TabsContent value="anomalies">
          <Card>
            <CardHeader>
              <CardTitle>Anomaly Detection</CardTitle>
              <CardDescription>
                Unusual patterns detected in WebSocket metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex h-96 items-center justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : anomalies && anomalies.total_anomalies > 0 ? (
                <div className="space-y-8">
                  <div className="flex flex-wrap gap-4">
                    <Card className="w-full md:w-auto">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Anomalies</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{anomalies.total_anomalies}</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="w-full md:w-auto">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">High Severity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-red-600">{anomalies.severity_counts.high}</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="w-full md:w-auto">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Medium Severity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{anomalies.severity_counts.medium}</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="w-full md:w-auto">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Low Severity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{anomalies.severity_counts.low}</div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Anomalies by Metric</h3>
                    <div className="space-y-4">
                      {Object.entries(anomalies.metrics).map(([metric, data]) => (
                        <Card key={metric}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base font-medium">{metric}</CardTitle>
                            <CardDescription>
                              {data.count} anomalies detected, average deviation {data.avg_deviation.toFixed(1)}%
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  data.avg_deviation > 50 ? 'bg-red-500' :
                                  data.avg_deviation > 20 ? 'bg-orange-500' : 'bg-yellow-500'
                                }`}
                                style={{ width: `${Math.min(data.avg_deviation, 100)}%` }}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-96 items-center justify-center flex-col">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-muted-foreground">No anomalies detected in the selected time period</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* UX Correlation Tab */}
        <TabsContent value="correlation">
          <Card>
            <CardHeader>
              <CardTitle>User Experience Correlation</CardTitle>
              <CardDescription>
                Analysis of how WebSocket performance affects user experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex h-96 items-center justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : correlation && correlation.time_series && correlation.time_series.length > 0 ? (
                <div className="space-y-8">
                  <div className="h-80">
                    <Line
                      data={getCorrelationChartData()}
                      options={correlationChartOptions}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-slate-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Latency vs Page Load</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(correlation.correlations.latency_vs_page_load * 100).toFixed(1)}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Correlation strength
                        </p>
                        <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{ width: `${Math.abs(correlation.correlations.latency_vs_page_load) * 100}%` }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-slate-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Error Rate vs UX Errors</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(correlation.correlations.error_rate_vs_ux_errors * 100).toFixed(1)}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Correlation strength
                        </p>
                        <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-orange-500 rounded-full" 
                            style={{ width: `${Math.abs(correlation.correlations.error_rate_vs_ux_errors) * 100}%` }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-slate-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Drops vs Interactions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(correlation.correlations.drops_vs_interactions * 100).toFixed(1)}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Correlation strength
                        </p>
                        <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full" 
                            style={{ width: `${Math.abs(correlation.correlations.drops_vs_interactions) * 100}%` }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {correlation.insights && correlation.insights.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Key Insights</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        {correlation.insights.map((insight, index) => (
                          <li key={index}>{insight}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-96 items-center justify-center flex-col">
                  <TrendingUp className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-muted-foreground">No correlation data available for the selected time period</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WebSocketClientMetricsDashboard; 