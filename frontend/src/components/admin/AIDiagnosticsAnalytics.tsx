import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Tabs, 
  Tab, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';
import { API_URL } from '../../config/constants';
import ModelTrainingMetrics from './ModelTrainingMetrics';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Define types for the metrics data
interface MetricsTrend {
  timestamp: string;
  value: number;
}

interface ModelMetrics {
  model_name: string;
  model_version: string;
  total_requests: number;
  avg_inference_time_ms: number;
  avg_confidence_score: number;
  error_rate: number;
  clinician_agreement_rate: number;
  data_points: number;
  performance_trend: MetricsTrend[];
  confidence_trend: MetricsTrend[];
  error_trend: MetricsTrend[];
  anomalies: {
    total: number;
    by_severity: {
      low: number;
      medium: number;
      high: number;
    };
    by_metric: Record<string, number>;
  };
}

interface MetricsSummary {
  time_range: {
    start: string;
    end: string;
  };
  models: ModelMetrics[];
  total_models: number;
  total_requests: number;
  anomalies: {
    total: number;
    by_severity: {
      low: number;
      medium: number;
      high: number;
    };
  };
}

interface RegionMetrics {
  region: string;
  country: string;
  request_count: number;
  avg_inference_time_ms: number;
  avg_confidence_score: number;
  avg_error_rate: number;
}

interface AnomalyData {
  time_range: {
    start: string;
    end: string;
  };
  total_anomalies: number;
  by_severity: {
    low: number;
    medium: number;
    high: number;
  };
  by_metric: Record<string, {
    count: number;
    avg_deviation: number;
  }>;
  by_model: Array<{
    model_name: string;
    model_version: string;
    count: number;
    by_severity: {
      low: number;
      medium: number;
      high: number;
    };
    by_metric: Record<string, number>;
  }>;
  time_series: Array<{
    timestamp: string;
    request_count: number;
    avg_inference_time_ms: number;
    avg_confidence_score: number;
    error_rate: number;
  }>;
}

// Main component
const AIDiagnosticsAnalytics: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metricsSummary, setMetricsSummary] = useState<MetricsSummary | null>(null);
  const [geographicData, setGeographicData] = useState<RegionMetrics[]>([]);
  const [anomalyData, setAnomalyData] = useState<AnomalyData | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('24h');

  // Function to fetch metrics data
  const fetchMetricsData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Calculate time range parameters
      const now = new Date();
      let startTime = new Date(now);
      
      if (timeRange === '24h') {
        startTime.setHours(now.getHours() - 24);
      } else if (timeRange === '7d') {
        startTime.setDate(now.getDate() - 7);
      } else if (timeRange === '30d') {
        startTime.setDate(now.getDate() - 30);
      }
      
      // Format dates for API
      const startParam = startTime.toISOString();
      const endParam = now.toISOString();
      
      // Fetch metrics summary
      const summaryResponse = await fetch(
        `${API_URL}/api/ai/diagnostics/metrics/summary?start_time=${startParam}&end_time=${endParam}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      
      if (!summaryResponse.ok) {
        throw new Error(`Failed to fetch metrics summary: ${summaryResponse.statusText}`);
      }
      
      const summaryData = await summaryResponse.json();
      setMetricsSummary(summaryData);
      
      // Fetch geographic metrics
      const modelParam = selectedModel !== 'all' ? `&model_name=${selectedModel}` : '';
      const geoResponse = await fetch(
        `${API_URL}/api/ai/diagnostics/metrics/geographic?start_time=${startParam}&end_time=${endParam}${modelParam}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      
      if (!geoResponse.ok) {
        throw new Error(`Failed to fetch geographic metrics: ${geoResponse.statusText}`);
      }
      
      const geoData = await geoResponse.json();
      setGeographicData(geoData);
      
      // Fetch anomaly data
      const daysParam = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
      const anomalyResponse = await fetch(
        `${API_URL}/api/ai/diagnostics/metrics/anomalies?days=${daysParam}${modelParam}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      
      if (!anomalyResponse.ok) {
        throw new Error(`Failed to fetch anomaly data: ${anomalyResponse.statusText}`);
      }
      
      const anomalyData = await anomalyResponse.json();
      setAnomalyData(anomalyData);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch data when component mounts or filters change
  useEffect(() => {
    fetchMetricsData();
  }, [selectedModel, timeRange]);
  
  // Handle tab change
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Handle model selection change
  const handleModelChange = (event: SelectChangeEvent) => {
    setSelectedModel(event.target.value);
  };
  
  // Handle time range change
  const handleTimeRangeChange = (event: SelectChangeEvent) => {
    setTimeRange(event.target.value);
  };
  
  // Prepare chart data for performance metrics
  const preparePerformanceChartData = (model: ModelMetrics): ChartData<'line'> => {
    return {
      labels: model.performance_trend.map(point => {
        const date = new Date(point.timestamp);
        return date.toLocaleTimeString();
      }),
      datasets: [
        {
          label: 'Inference Time (ms)',
          data: model.performance_trend.map(point => point.value),
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1
        }
      ]
    };
  };
  
  // Prepare chart data for confidence scores
  const prepareConfidenceChartData = (model: ModelMetrics): ChartData<'line'> => {
    return {
      labels: model.confidence_trend.map(point => {
        const date = new Date(point.timestamp);
        return date.toLocaleTimeString();
      }),
      datasets: [
        {
          label: 'Confidence Score',
          data: model.confidence_trend.map(point => point.value),
          borderColor: 'rgba(153, 102, 255, 1)',
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          tension: 0.1
        }
      ]
    };
  };
  
  // Prepare chart data for error rates
  const prepareErrorRateChartData = (model: ModelMetrics): ChartData<'line'> => {
    return {
      labels: model.error_trend.map(point => {
        const date = new Date(point.timestamp);
        return date.toLocaleTimeString();
      }),
      datasets: [
        {
          label: 'Error Rate',
          data: model.error_trend.map(point => point.value),
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.1
        }
      ]
    };
  };
  
  // Chart options
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };
  
  // Render loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        AI Diagnostics Analytics
      </Typography>
      
      {/* Filter controls */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Model</InputLabel>
          <Select
            value={selectedModel}
            label="Model"
            onChange={handleModelChange}
          >
            <MenuItem value="all">All Models</MenuItem>
            {metricsSummary?.models.map((model) => (
              <MenuItem key={`${model.model_name}_${model.model_version}`} value={model.model_name}>
                {model.model_name} ({model.model_version})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            label="Time Range"
            onChange={handleTimeRangeChange}
          >
            <MenuItem value="24h">Last 24 Hours</MenuItem>
            <MenuItem value="7d">Last 7 Days</MenuItem>
            <MenuItem value="30d">Last 30 Days</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {/* Summary cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">Total Models</Typography>
              <Typography variant="h4">{metricsSummary?.total_models || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">Total Requests</Typography>
              <Typography variant="h4">{metricsSummary?.total_requests || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">Total Anomalies</Typography>
              <Typography variant="h4">{metricsSummary?.anomalies.total || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">Time Range</Typography>
              <Typography variant="h6">
                {metricsSummary ? new Date(metricsSummary.time_range.start).toLocaleDateString() : ''}
                {' to '}
                {metricsSummary ? new Date(metricsSummary.time_range.end).toLocaleDateString() : ''}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Tabs for different views */}
      <Box sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Models Performance" />
          <Tab label="Geographic Analysis" />
          <Tab label="Anomaly Detection" />
          <Tab label="Model Training" />
        </Tabs>
      </Box>
      
      {/* Tab content */}
      <Box>
        {/* Models Performance Tab */}
        {tabValue === 0 && metricsSummary && (
          <Grid container spacing={3}>
            {metricsSummary.models.map((model) => (
              <Grid item xs={12} key={`${model.model_name}_${model.model_version}`}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {model.model_name} (v{model.model_version})
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={3}>
                        <Box>
                          <Typography variant="subtitle2">Requests</Typography>
                          <Typography variant="h6">{model.total_requests}</Typography>
                          
                          <Typography variant="subtitle2" sx={{ mt: 2 }}>Avg Inference Time</Typography>
                          <Typography variant="h6">{model.avg_inference_time_ms.toFixed(2)} ms</Typography>
                          
                          <Typography variant="subtitle2" sx={{ mt: 2 }}>Avg Confidence</Typography>
                          <Typography variant="h6">{(model.avg_confidence_score * 100).toFixed(1)}%</Typography>
                          
                          <Typography variant="subtitle2" sx={{ mt: 2 }}>Error Rate</Typography>
                          <Typography variant="h6" color={model.error_rate > 0.05 ? 'error' : 'inherit'}>
                            {(model.error_rate * 100).toFixed(1)}%
                          </Typography>
                          
                          <Typography variant="subtitle2" sx={{ mt: 2 }}>Clinician Agreement</Typography>
                          <Typography variant="h6">
                            {(model.clinician_agreement_rate * 100).toFixed(1)}%
                          </Typography>
                          
                          <Typography variant="subtitle2" sx={{ mt: 2 }}>Anomalies</Typography>
                          <Typography variant="h6">
                            {model.anomalies.total || 0} 
                            {model.anomalies.by_severity.high > 0 && (
                              <Chip 
                                label={`${model.anomalies.by_severity.high} High`} 
                                color="error" 
                                size="small"
                                sx={{ ml: 1 }}
                              />
                            )}
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} md={3}>
                        <Typography variant="subtitle2">Inference Time Trend</Typography>
                        <Box sx={{ height: 200 }}>
                          <Line 
                            data={preparePerformanceChartData(model)} 
                            options={chartOptions} 
                          />
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} md={3}>
                        <Typography variant="subtitle2">Confidence Score Trend</Typography>
                        <Box sx={{ height: 200 }}>
                          <Line 
                            data={prepareConfidenceChartData(model)} 
                            options={chartOptions} 
                          />
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} md={3}>
                        <Typography variant="subtitle2">Error Rate Trend</Typography>
                        <Box sx={{ height: 200 }}>
                          <Line 
                            data={prepareErrorRateChartData(model)} 
                            options={chartOptions} 
                          />
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
        
        {/* Geographic Analysis Tab */}
        {tabValue === 1 && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Region</TableCell>
                  <TableCell>Country</TableCell>
                  <TableCell align="right">Requests</TableCell>
                  <TableCell align="right">Avg. Inference Time (ms)</TableCell>
                  <TableCell align="right">Avg. Confidence</TableCell>
                  <TableCell align="right">Error Rate</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {geographicData.map((region) => (
                  <TableRow key={`${region.region}_${region.country}`}>
                    <TableCell>{region.region}</TableCell>
                    <TableCell>{region.country}</TableCell>
                    <TableCell align="right">{region.request_count}</TableCell>
                    <TableCell align="right">{region.avg_inference_time_ms.toFixed(2)}</TableCell>
                    <TableCell align="right">{(region.avg_confidence_score * 100).toFixed(1)}%</TableCell>
                    <TableCell align="right">{(region.avg_error_rate * 100).toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
                {geographicData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">No geographic data available</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        
        {/* Anomaly Detection Tab */}
        {tabValue === 2 && anomalyData && (
          <Grid container spacing={3}>
            {/* Summary */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Anomaly Summary</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2">Total Anomalies</Typography>
                      <Typography variant="h5">{anomalyData.total_anomalies}</Typography>
                    </Grid>
                    <Grid item xs={12} md={8}>
                      <Typography variant="subtitle2">By Severity</Typography>
                      <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                        <Chip 
                          label={`${anomalyData.by_severity.low} Low`} 
                          color="info" 
                          variant="outlined"
                        />
                        <Chip 
                          label={`${anomalyData.by_severity.medium} Medium`} 
                          color="warning" 
                          variant="outlined"
                        />
                        <Chip 
                          label={`${anomalyData.by_severity.high} High`} 
                          color="error" 
                          variant="outlined"
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            
            {/* By Metric */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Anomalies by Metric</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Metric</TableCell>
                          <TableCell align="right">Count</TableCell>
                          <TableCell align="right">Avg. Deviation</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(anomalyData.by_metric).map(([metric, data]) => (
                          <TableRow key={metric}>
                            <TableCell>{metric}</TableCell>
                            <TableCell align="right">{data.count}</TableCell>
                            <TableCell align="right">{data.avg_deviation.toFixed(2)}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
            
            {/* By Model */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Anomalies by Model</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Model</TableCell>
                          <TableCell align="right">Count</TableCell>
                          <TableCell align="right">High Severity</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {anomalyData.by_model.map((model) => (
                          <TableRow key={`${model.model_name}_${model.model_version}`}>
                            <TableCell>{model.model_name} (v{model.model_version})</TableCell>
                            <TableCell align="right">{model.count}</TableCell>
                            <TableCell align="right">
                              {model.by_severity.high > 0 ? (
                                <Chip 
                                  label={model.by_severity.high} 
                                  color="error" 
                                  size="small"
                                />
                              ) : (
                                0
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Time Series */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Metrics Timeline</Typography>
                  <Box sx={{ height: 300 }}>
                    <Line 
                      data={{
                        labels: anomalyData.time_series.map(point => {
                          const date = new Date(point.timestamp);
                          return date.toLocaleTimeString();
                        }),
                        datasets: [
                          {
                            label: 'Inference Time (ms)',
                            data: anomalyData.time_series.map(point => point.avg_inference_time_ms),
                            borderColor: 'rgba(75, 192, 192, 1)',
                            yAxisID: 'y',
                          },
                          {
                            label: 'Error Rate',
                            data: anomalyData.time_series.map(point => point.error_rate * 100),
                            borderColor: 'rgba(255, 99, 132, 1)',
                            yAxisID: 'y1',
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        interaction: {
                          mode: 'index',
                          intersect: false,
                        },
                        scales: {
                          y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: {
                              display: true,
                              text: 'Inference Time (ms)'
                            }
                          },
                          y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            grid: {
                              drawOnChartArea: false,
                            },
                            title: {
                              display: true,
                              text: 'Error Rate (%)'
                            }
                          },
                        },
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
        
        {/* Model Training Tab */}
        {tabValue === 3 && (
          <Box sx={{ mt: 2 }}>
            <ModelTrainingMetrics 
              modelName={selectedModel !== 'all' ? selectedModel : (metricsSummary?.models[0]?.model_name || '')}
              modelVersion={selectedModel !== 'all' ? 
                metricsSummary?.models.find(m => m.model_name === selectedModel)?.model_version : 
                undefined}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default AIDiagnosticsAnalytics; 