import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Container,
  Grid,
  Typography,
  Tabs,
  Tab,
  Divider,
  Paper,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  TextField,
  IconButton,
  Tooltip,
  Stack,
  Button,
  useTheme,
  useMediaQuery
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import BarChartIcon from '@mui/icons-material/BarChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import PieChartIcon from '@mui/icons-material/PieChart';
import ModelStatusBadge from '../../components/ai/ModelStatusBadge';
import AIConfigPanel from '../../components/admin/AIConfigPanel';
import DatabaseVersionIndicator from '../../components/admin/DatabaseVersionIndicator';
import DatabaseHealthBadge from '../../components/admin/DatabaseHealthBadge';
import API from '../../lib/api';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, subDays } from 'date-fns';

// Import chart components (you would need to install a chart library like recharts)
// For simplicity, we'll mock these components
const MockLineChart = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 2, 
        height: 300, 
        bgcolor: isDarkMode ? 'rgba(30, 30, 30, 0.6)' : '#f5f5f5', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        border: '1px solid',
        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        color: isDarkMode ? '#e0e0e0' : 'inherit',
        borderRadius: '8px'
      }}
    >
      <Typography 
        variant="body2" 
        color={isDarkMode ? "rgba(255, 255, 255, 0.7)" : "text.secondary"}
      >
        Line Chart Visualization
      </Typography>
    </Paper>
  );
};

const MockBarChart = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 2, 
        height: 300, 
        bgcolor: isDarkMode ? 'rgba(30, 30, 30, 0.6)' : '#f5f5f5', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        border: '1px solid',
        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        color: isDarkMode ? '#e0e0e0' : 'inherit',
        borderRadius: '8px'
      }}
    >
      <Typography 
        variant="body2" 
        color={isDarkMode ? "rgba(255, 255, 255, 0.7)" : "text.secondary"}
      >
        Bar Chart Visualization
      </Typography>
    </Paper>
  );
};

const MockPieChart = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 2, 
        height: 300, 
        bgcolor: isDarkMode ? 'rgba(30, 30, 30, 0.6)' : '#f5f5f5', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        border: '1px solid',
        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        color: isDarkMode ? '#e0e0e0' : 'inherit',
        borderRadius: '8px'
      }}
    >
      <Typography 
        variant="body2" 
        color={isDarkMode ? "rgba(255, 255, 255, 0.7)" : "text.secondary"}
      >
        Pie Chart Visualization
      </Typography>
    </Paper>
  );
};

interface AIMetrics {
  totalInferences: number;
  averageLatency: number;
  successRate: number;
  averageConfidence: number;
  modelUsage: Record<string, number>;
  feedbackSummary: {
    accepted: number;
    modified: number;
    rejected: number;
  };
  inferencesByType: Record<string, number>;
  dailyInferences: Record<string, number>;
}

const AIPerformanceDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<AIMetrics | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState('7days');
  const [startDate, setStartDate] = useState(subDays(new Date(), 7));
  const [endDate, setEndDate] = useState(new Date());
  const [modelType, setModelType] = useState<string>('all');
  
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleTimeRangeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const value = event.target.value as string;
    setTimeRange(value);
    
    const now = new Date();
    switch(value) {
      case '7days':
        setStartDate(subDays(now, 7));
        setEndDate(now);
        break;
      case '30days':
        setStartDate(subDays(now, 30));
        setEndDate(now);
        break;
      case '90days':
        setStartDate(subDays(now, 90));
        setEndDate(now);
        break;
      case 'custom':
        // Keep current dates for custom
        break;
    }
  };

  const handleModelTypeChange = (event: SelectChangeEvent) => {
    setModelType(event.target.value);
  };

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepare query params
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate.toISOString().split('T')[0]);
      if (endDate) params.append('end_date', endDate.toISOString().split('T')[0]);
      if (modelType !== 'all') params.append('model_type', modelType);
      
      // Use the imported API directly
      const response = await API.get(`/api/admin/ai-metrics?${params.toString()}`);
      setMetrics(response);
    } catch (err) {
      console.error('Error fetching AI metrics:', err);
      setError('Unable to load AI performance metrics');
      // Set mock data for demonstration
      setMetrics({
        totalInferences: 1247,
        averageLatency: 342.5,
        successRate: 97.2,
        averageConfidence: 0.83,
        modelUsage: {
          'mock': 825,
          'onnx': 312,
          'pytorch': 110
        },
        feedbackSummary: {
          accepted: 562,
          modified: 87,
          rejected: 25
        },
        inferencesByType: {
          'panoramic': 425,
          'bitewing': 732,
          'periapical': 90
        },
        dailyInferences: {
          '2023-05-01': 45,
          '2023-05-02': 52,
          '2023-05-03': 63,
          '2023-05-04': 47
          // Additional days would be included in real data
        }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [startDate, endDate, modelType]);

  const handleRefresh = () => {
    fetchMetrics();
  };

  const handleExport = () => {
    // In a real implementation, trigger a CSV/Excel export
    alert('Exporting data...');
  };

  const renderMetricCard = (title: string, value: string | number, subtitle?: string) => (
    <Card>
      <CardContent sx={{ textAlign: 'center', py: 2 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h3" component="div" sx={{ mb: 1 }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  if (loading && !metrics) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          AI Performance Dashboard
        </Typography>
        <Box display="flex" alignItems="center">
          <ModelStatusBadge />
          <DatabaseVersionIndicator />
          <DatabaseHealthBadge />
          <Tooltip title="Refresh data">
            <IconButton onClick={handleRefresh} sx={{ ml: 1 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export data">
            <IconButton onClick={handleExport} sx={{ ml: 1 }}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6} lg={3}>
          {metrics && renderMetricCard('Total Inferences', metrics.totalInferences, 'AI analyses performed')}
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          {metrics && renderMetricCard('Avg. Latency', `${metrics.averageLatency.toFixed(1)}ms`, 'Processing time')}
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          {metrics && renderMetricCard('Success Rate', `${metrics.successRate.toFixed(1)}%`, 'Completed without errors')}
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          {metrics && renderMetricCard('Avg. Confidence', `${(metrics.averageConfidence * 100).toFixed(1)}%`, 'Model certainty')}
        </Grid>
      </Grid>

      <Box mb={4}>
        <Paper sx={{ p: 2 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6">Filters</Typography>
            <Box display="flex" alignItems="center">
              <FormControl size="small" sx={{ minWidth: 120, mr: 2 }}>
                <InputLabel id="time-range-label">Time Range</InputLabel>
                <Select
                  labelId="time-range-label"
                  id="time-range"
                  value={timeRange}
                  label="Time Range"
                  onChange={handleTimeRangeChange}
                >
                  <MenuItem value="7days">Last 7 Days</MenuItem>
                  <MenuItem value="30days">Last 30 Days</MenuItem>
                  <MenuItem value="90days">Last 90 Days</MenuItem>
                  <MenuItem value="custom">Custom Range</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: 120, mr: 2 }}>
                <InputLabel id="model-type-label">Model Type</InputLabel>
                <Select
                  labelId="model-type-label"
                  id="model-type"
                  value={modelType}
                  label="Model Type"
                  onChange={handleModelTypeChange}
                >
                  <MenuItem value="all">All Models</MenuItem>
                  <MenuItem value="mock">Mock Data</MenuItem>
                  <MenuItem value="onnx">ONNX</MenuItem>
                  <MenuItem value="pytorch">PyTorch</MenuItem>
                  <MenuItem value="tensorflow">TensorFlow</MenuItem>
                  <MenuItem value="roboflow">Roboflow API</MenuItem>
                  <MenuItem value="openai">OpenAI API</MenuItem>
                </Select>
              </FormControl>
              
              {timeRange === 'custom' && (
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Start Date"
                      value={startDate}
                      onChange={(date) => date && setStartDate(date)}
                    />
                  </LocalizationProvider>
                  <Typography variant="body1">to</Typography>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="End Date"
                      value={endDate}
                      onChange={(date) => date && setEndDate(date)}
                    />
                  </LocalizationProvider>
                </Box>
              )}
            </Box>
          </Box>
        </Paper>
      </Box>

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        sx={{ mb: 3 }}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab icon={<TimelineIcon />} label="Usage Trends" />
        <Tab icon={<BarChartIcon />} label="Performance Analysis" />
        <Tab icon={<PieChartIcon />} label="Feedback Analysis" />
        <Tab label="Configuration" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Daily AI Inferences" />
              <Divider />
              <CardContent>
                <MockLineChart />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Inferences by Image Type" />
              <Divider />
              <CardContent>
                <MockBarChart />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Model Type Usage" />
              <Divider />
              <CardContent>
                <MockPieChart />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Latency Over Time" />
              <Divider />
              <CardContent>
                <MockLineChart />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Success Rate by Model Type" />
              <Divider />
              <CardContent>
                <MockBarChart />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Confidence Score Distribution" />
              <Divider />
              <CardContent>
                <MockBarChart />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Provider Feedback Summary" />
              <Divider />
              <CardContent>
                <MockPieChart />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Feedback by Diagnosis Type" />
              <Divider />
              <CardContent>
                <MockBarChart />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Feedback Trends Over Time" />
              <Divider />
              <CardContent>
                <MockLineChart />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <AIConfigPanel />
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default AIPerformanceDashboard; 