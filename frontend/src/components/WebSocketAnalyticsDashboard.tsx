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
import { DownloadIcon, RefreshCw, Bell, BellOff, Plus, Trash, Settings, AlertTriangle, Check, X, Activity, Server, MessageSquare } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "./ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Bar, Line, Pie } from 'react-chartjs-2';
import { websocketAnalyticsService, ConnectionTestResult } from '../services/websocketAnalyticsService';
import { 
  WebSocketPoolStats, 
  WebSocketMetrics, 
  WebSocketHealthStatus,
  WebSocketHistoricalSnapshot,
  WebSocketAlert,
  WebSocketAlertThreshold,
  WebSocketAlertSeverity
} from '../types/websocket';

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

const WebSocketAnalyticsDashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [poolStats, setPoolStats] = useState<WebSocketPoolStats | null>(null);
  const [metrics, setMetrics] = useState<WebSocketMetrics | null>(null);
  const [healthStatus, setHealthStatus] = useState<WebSocketHealthStatus | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(30); // seconds
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [error, setError] = useState<string | null>(null);
  const [historicalMetrics, setHistoricalMetrics] = useState<WebSocketHistoricalSnapshot[]>([]);
  const [historicalTimeRange, setHistoricalTimeRange] = useState<number>(7); // days
  const [loadingHistorical, setLoadingHistorical] = useState<boolean>(false);
  const [alerts, setAlerts] = useState<WebSocketAlert[]>([]);
  const [thresholds, setThresholds] = useState<WebSocketAlertThreshold[]>([]);
  const [includeAcknowledgedAlerts, setIncludeAcknowledgedAlerts] = useState<boolean>(false);
  const [loadingAlerts, setLoadingAlerts] = useState<boolean>(false);
  const [showThresholdDialog, setShowThresholdDialog] = useState<boolean>(false);
  const [editingThresholdIndex, setEditingThresholdIndex] = useState<number | null>(null);
  const [connectionTestResults, setConnectionTestResults] = useState<ConnectionTestResult | null>(null);
  const [poolTestResults, setPoolTestResults] = useState<ConnectionTestResult | null>(null);
  const [echoTestResults, setEchoTestResults] = useState<ConnectionTestResult | null>(null);
  const [echoMessage, setEchoMessage] = useState<string>('Test message');
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [testingPool, setTestingPool] = useState<boolean>(false);
  const [testingEcho, setTestingEcho] = useState<boolean>(false);
  
  const fetchData = async () => {
    setLoading(true);
    try {
      const [poolStatsData, metricsData, healthData] = await Promise.all([
        websocketAnalyticsService.getPoolStats(),
        websocketAnalyticsService.getMetrics(),
        websocketAnalyticsService.getHealthStatus(),
      ]);
      
      setPoolStats(poolStatsData);
      setMetrics(metricsData);
      setHealthStatus(healthData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch WebSocket analytics data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch historical metrics data
  const fetchHistoricalData = async () => {
    setLoadingHistorical(true);
    try {
      const data = await websocketAnalyticsService.getHistoricalMetrics(historicalTimeRange);
      setHistoricalMetrics(data);
    } catch (err) {
      setError('Failed to fetch historical WebSocket metrics');
      console.error(err);
    } finally {
      setLoadingHistorical(false);
    }
  };
  
  // Fetch alerts data
  const fetchAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const [alertsData, thresholdsData] = await Promise.all([
        websocketAnalyticsService.getAlerts(includeAcknowledgedAlerts),
        websocketAnalyticsService.getAlertThresholds(),
      ]);
      setAlerts(alertsData);
      setThresholds(thresholdsData);
    } catch (err) {
      setError('Failed to fetch WebSocket alerts');
      console.error(err);
    } finally {
      setLoadingAlerts(false);
    }
  };
  
  // Handle acknowledging an alert
  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await websocketAnalyticsService.acknowledgeAlert(alertId);
      // Update the UI optimistically
      setAlerts(currentAlerts => 
        currentAlerts.map(alert => 
          alert.id === alertId
            ? { ...alert, acknowledged: true }
            : alert
        )
      );
    } catch (err) {
      setError('Failed to acknowledge alert');
      console.error(err);
    }
  };
  
  useEffect(() => {
    fetchData();
    
    // Set up refresh interval
    const interval = setInterval(fetchData, refreshInterval * 1000);
    
    return () => clearInterval(interval);
  }, [refreshInterval]);
  
  // Fetch historical data when time range changes
  useEffect(() => {
    fetchHistoricalData();
  }, [historicalTimeRange]);
  
  // Fetch alerts when tab changes or includeAcknowledged changes
  useEffect(() => {
    if (activeTab === 'alerts') {
      fetchAlerts();
    }
  }, [activeTab, includeAcknowledgedAlerts]);
  
  const getHealthStatusColor = (status: string | undefined) => {
    if (!status) return 'bg-gray-500';
    
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'unhealthy':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  // Message type distribution chart data
  const getMessageTypeChartData = () => {
    if (!metrics?.messages.by_type) return null;
    
    const labels = Object.keys(metrics.messages.by_type);
    const data = Object.values(metrics.messages.by_type);
    
    return {
      labels,
      datasets: [
        {
          label: 'Message Count by Type',
          data,
          backgroundColor: Object.values(CHART_COLORS),
        },
      ],
    };
  };
  
  // Worker utilization chart data
  const getWorkerUtilizationData = () => {
    if (!poolStats?.workers) return null;
    
    return {
      labels: poolStats.workers.map(worker => worker.worker_id),
      datasets: [
        {
          label: 'Active Connections',
          data: poolStats.workers.map(worker => worker.active_connections),
          backgroundColor: CHART_COLORS.blue,
        },
        {
          label: 'Capacity',
          data: poolStats.workers.map(worker => worker.capacity),
          backgroundColor: CHART_COLORS.green,
          type: 'line',
        },
      ],
    };
  };
  
  // Function to export data as CSV
  const exportAsCSV = (data: any, filename: string) => {
    // Convert data to CSV format
    let csvContent = '';
    
    if (Array.isArray(data)) {
      // Handle array data (like historical metrics)
      if (data.length === 0) return;
      
      // Headers
      const headers = Object.keys(data[0]);
      csvContent += headers.join(',') + '\n';
      
      // Rows
      data.forEach(item => {
        const row = headers.map(header => {
          const value = item[header];
          
          // Handle nested objects
          if (typeof value === 'object' && value !== null) {
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          }
          
          // Handle strings with commas
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          
          return value;
        });
        
        csvContent += row.join(',') + '\n';
      });
    } else if (typeof data === 'object' && data !== null) {
      // Handle object data (like current metrics)
      // Flatten the object for CSV
      const flattenObject = (obj: any, prefix = '') => {
        return Object.keys(obj).reduce((acc: Record<string, any>, key) => {
          const pre = prefix.length ? `${prefix}.` : '';
          
          if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            Object.assign(acc, flattenObject(obj[key], pre + key));
          } else {
            acc[pre + key] = obj[key];
          }
          
          return acc;
        }, {});
      };
      
      const flatData = flattenObject(data);
      
      // Headers and values
      const headers = Object.keys(flatData);
      csvContent += headers.join(',') + '\n';
      
      const values = headers.map(header => {
        const value = flatData[header];
        
        // Handle arrays
        if (Array.isArray(value)) {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        
        // Handle strings with commas
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        
        return value;
      });
      
      csvContent += values.join(',') + '\n';
    }
    
    // Create a CSV Blob
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.display = 'none';
    document.body.appendChild(link);
    
    // Start download
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  // Function to export data as JSON
  const exportAsJSON = (data: any, filename: string) => {
    // Create a JSON string
    const jsonString = JSON.stringify(data, null, 2);
    
    // Create a JSON Blob
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.json`);
    link.style.display = 'none';
    document.body.appendChild(link);
    
    // Start download
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  // Export current metrics
  const handleExportCurrentMetrics = () => {
    if (!metrics) return;
    
    const exportData = {
      ...metrics,
      timestamp: new Date().toISOString(),
      poolStats: poolStats,
      healthStatus: healthStatus,
    };
    
    exportAsJSON(exportData, `websocket-metrics-${new Date().toISOString().split('T')[0]}`);
  };
  
  // Export historical metrics
  const handleExportHistoricalMetrics = () => {
    if (!historicalMetrics || historicalMetrics.length === 0) return;
    
    exportAsJSON(historicalMetrics, `websocket-historical-metrics-${new Date().toISOString().split('T')[0]}`);
  };
  
  // Export alerts
  const handleExportAlerts = () => {
    if (!alerts || alerts.length === 0) return;
    
    exportAsJSON(alerts, `websocket-alerts-${new Date().toISOString().split('T')[0]}`);
  };
  
  // Message type distribution chart data
  const getMessageTypeChartData = () => {
    if (!metrics?.messages.by_type) return null;
    
    const labels = Object.keys(metrics.messages.by_type);
    const data = Object.values(metrics.messages.by_type);
    
    return {
      labels,
      datasets: [
        {
          label: 'Message Count by Type',
          data,
          backgroundColor: Object.values(CHART_COLORS),
        },
      ],
    };
  };
  
  // Worker utilization chart data
  const getWorkerUtilizationData = () => {
    if (!poolStats?.workers) return null;
    
    return {
      labels: poolStats.workers.map(worker => worker.worker_id),
      datasets: [
        {
          label: 'Active Connections',
          data: poolStats.workers.map(worker => worker.active_connections),
          backgroundColor: CHART_COLORS.blue,
        },
        {
          label: 'Capacity',
          data: poolStats.workers.map(worker => worker.capacity),
          backgroundColor: CHART_COLORS.green,
          type: 'line',
        },
      ],
    };
  };
  
  // Function to export analytics data as JSON
  const exportAnalyticsData = () => {
    const data = {
      poolStats,
      metrics,
      healthStatus,
      timestamp: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `websocket-analytics-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Create historical connection count chart data
  const getHistoricalConnectionsData = () => {
    if (!historicalMetrics || historicalMetrics.length === 0) return null;
    
    return {
      labels: historicalMetrics.map(snapshot => new Date(snapshot.timestamp)),
      datasets: [
        {
          label: 'Total Connections',
          data: historicalMetrics.map(snapshot => snapshot.connections.total),
          borderColor: CHART_COLORS.blue,
          backgroundColor: CHART_COLORS.blue,
          tension: 0.4,
          fill: false,
        },
        {
          label: 'Unique Users',
          data: historicalMetrics.map(snapshot => snapshot.connections.unique_users),
          borderColor: CHART_COLORS.green,
          backgroundColor: CHART_COLORS.green,
          tension: 0.4,
          fill: false,
        }
      ]
    };
  };
  
  // Create historical message count chart data
  const getHistoricalMessagesData = () => {
    if (!historicalMetrics || historicalMetrics.length === 0) return null;
    
    return {
      labels: historicalMetrics.map(snapshot => new Date(snapshot.timestamp)),
      datasets: [
        {
          label: 'Messages Sent',
          data: historicalMetrics.map(snapshot => snapshot.messages.sent),
          borderColor: CHART_COLORS.green,
          backgroundColor: CHART_COLORS.green,
          tension: 0.4,
          fill: false,
        },
        {
          label: 'Messages Received',
          data: historicalMetrics.map(snapshot => snapshot.messages.received),
          borderColor: CHART_COLORS.blue,
          backgroundColor: CHART_COLORS.blue, 
          tension: 0.4,
          fill: false,
        },
        {
          label: 'Errors',
          data: historicalMetrics.map(snapshot => snapshot.messages.errors),
          borderColor: CHART_COLORS.red,
          backgroundColor: CHART_COLORS.red,
          tension: 0.4,
          fill: false,
        }
      ]
    };
  };
  
  // Create historical performance metrics chart data
  const getHistoricalPerformanceData = () => {
    if (!historicalMetrics || historicalMetrics.length === 0) return null;
    
    return {
      labels: historicalMetrics.map(snapshot => new Date(snapshot.timestamp)),
      datasets: [
        {
          label: 'Avg Message Latency (ms)',
          data: historicalMetrics.map(snapshot => snapshot.performance.avg_message_latency_ms),
          borderColor: CHART_COLORS.orange,
          backgroundColor: CHART_COLORS.orange,
          tension: 0.4,
          fill: false,
          yAxisID: 'y',
        },
        {
          label: 'Avg Broadcast Time (ms)',
          data: historicalMetrics.map(snapshot => snapshot.performance.avg_broadcast_time_ms),
          borderColor: CHART_COLORS.purple,
          backgroundColor: CHART_COLORS.purple,
          tension: 0.4,
          fill: false,
          yAxisID: 'y',
        }
      ]
    };
  };
  
  // Chart options for time-series data
  const timeSeriesOptions = {
    responsive: true,
    maintainAspectRatio: false,
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
        beginAtZero: true,
        title: {
          display: true,
          text: 'Count'
        }
      }
    },
    plugins: {
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      }
    }
  };

  // Get severity badge color
  const getAlertSeverityColor = (severity: WebSocketAlertSeverity | undefined) => {
    if (!severity) return 'bg-gray-500 text-white';
    
    switch (severity) {
      case 'info':
        return 'bg-blue-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-white';
      case 'error':
        return 'bg-orange-500 text-white';
      case 'critical':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };
  
  // Threshold form schema
  const thresholdFormSchema = z.object({
    metric: z.string().min(1, "Metric is required"),
    condition: z.enum(["gt", "lt", "eq", "gte", "lte"]),
    value: z.number().min(0, "Value must be positive"),
    severity: z.enum(["info", "warning", "error", "critical"]),
    enabled: z.boolean().default(true),
  });
  
  // React Hook Form setup
  const thresholdForm = useForm<z.infer<typeof thresholdFormSchema>>({
    resolver: zodResolver(thresholdFormSchema),
    defaultValues: {
      metric: "connections.utilization",
      condition: "gt",
      value: 0.8,
      severity: "warning",
      enabled: true,
    },
  });
  
  // Reset form when editing threshold changes
  useEffect(() => {
    if (editingThresholdIndex !== null && thresholds.length > editingThresholdIndex) {
      const threshold = thresholds[editingThresholdIndex];
      thresholdForm.reset({
        metric: threshold.metric,
        condition: threshold.condition as any,
        value: threshold.value,
        severity: threshold.severity as any,
        enabled: threshold.enabled,
      });
    } else {
      thresholdForm.reset({
        metric: "connections.utilization",
        condition: "gt",
        value: 0.8,
        severity: "warning",
        enabled: true,
      });
    }
  }, [editingThresholdIndex, thresholds]);
  
  // Handle threshold form submission
  const onThresholdSubmit = async (values: z.infer<typeof thresholdFormSchema>) => {
    try {
      if (editingThresholdIndex !== null) {
        // Update existing threshold
        await websocketAnalyticsService.updateAlertThreshold(editingThresholdIndex, values as WebSocketAlertThreshold);
      } else {
        // Add new threshold
        await websocketAnalyticsService.addAlertThreshold(values as WebSocketAlertThreshold);
      }
      
      // Refresh thresholds
      fetchAlerts();
      setShowThresholdDialog(false);
    } catch (err) {
      setError('Failed to save threshold');
      console.error(err);
    }
  };
  
  // Handle threshold deletion
  const handleDeleteThreshold = async (index: number) => {
    try {
      await websocketAnalyticsService.deleteAlertThreshold(index);
      fetchAlerts();
    } catch (err) {
      setError('Failed to delete threshold');
      console.error(err);
    }
  };
  
  // Open the edit threshold dialog
  const openEditThresholdDialog = (index: number) => {
    setEditingThresholdIndex(index);
    setShowThresholdDialog(true);
  };
  
  // Open the new threshold dialog
  const openNewThresholdDialog = () => {
    setEditingThresholdIndex(null);
    setShowThresholdDialog(true);
  };

  // Run connection test
  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const result = await websocketAnalyticsService.testConnection();
      setConnectionTestResults(result);
    } catch (err) {
      setError('Failed to run connection test');
      console.error(err);
    } finally {
      setTestingConnection(false);
    }
  };
  
  // Run connection pool test
  const handleTestConnectionPool = async () => {
    setTestingPool(true);
    try {
      const result = await websocketAnalyticsService.testConnectionPool();
      setPoolTestResults(result);
    } catch (err) {
      setError('Failed to run connection pool test');
      console.error(err);
    } finally {
      setTestingPool(false);
    }
  };
  
  // Run echo test
  const handleTestEcho = async () => {
    setTestingEcho(true);
    try {
      const result = await websocketAnalyticsService.testEchoMessage(echoMessage);
      setEchoTestResults(result);
    } catch (err) {
      setError('Failed to run echo test');
      console.error(err);
    } finally {
      setTestingEcho(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">WebSocket Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor real-time WebSocket connections and performance
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge 
            className={`px-2 py-1 ${getHealthStatusColor(healthStatus?.status)}`}
          >
            {healthStatus?.status || 'Unknown'} 
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCurrentMetrics}
            disabled={!metrics}
          >
            <DownloadIcon className="h-4 w-4 mr-2" />
            Export Metrics
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
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="historical">Historical</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Connections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {poolStats?.total_connections ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Max Capacity: {poolStats?.max_capacity ?? 0}
                </p>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full" 
                    style={{ width: `${(poolStats?.utilization ?? 0) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Utilization: {((poolStats?.utilization ?? 0) * 100).toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Message Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Sent</p>
                    <p className="text-xl font-bold">{metrics?.messages.sent ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Received</p>
                    <p className="text-xl font-bold">{metrics?.messages.received ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Errors</p>
                    <p className="text-xl font-bold">{metrics?.messages.errors ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Error Rate</p>
                    <p className="text-xl font-bold">
                      {healthStatus?.error_rate 
                        ? (healthStatus.error_rate * 100).toFixed(2) 
                        : 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Message Latency</p>
                    <p className="text-xl font-bold">
                      {metrics?.performance.avg_message_latency_ms?.toFixed(2) ?? 0} ms
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Broadcast Time</p>
                    <p className="text-xl font-bold">
                      {metrics?.performance.avg_broadcast_time_ms?.toFixed(2) ?? 0} ms
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Message Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {metrics?.messages.by_type && Object.keys(metrics.messages.by_type).length > 0 ? (
                    <Pie data={getMessageTypeChartData()} />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-muted-foreground">No message data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Worker Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {poolStats?.workers && poolStats.workers.length > 0 ? (
                    <Bar 
                      data={getWorkerUtilizationData()}
                      options={{
                        responsive: true,
                        scales: {
                          y: {
                            beginAtZero: true,
                          },
                        },
                      }}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-muted-foreground">No worker data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="connections">
          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Connection Pool</CardTitle>
                <CardDescription>
                  {poolStats?.worker_count ?? 0} workers with {poolStats?.total_connections ?? 0} active connections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {poolStats?.workers.map((worker) => (
                    <div key={worker.worker_id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">{worker.worker_id}</h3>
                        <Badge>{worker.active_connections} / {worker.capacity}</Badge>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${worker.utilization * 100}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div>
                          <span>Utilization:</span>
                          <span className="font-medium ml-1">{(worker.utilization * 100).toFixed(1)}%</span>
                        </div>
                        <div>
                          <span>Queue Size:</span>
                          <span className="font-medium ml-1">{worker.queue_size}</span>
                        </div>
                        <div>
                          <span>Messages:</span>
                          <span className="font-medium ml-1">{worker.messages_processed}</span>
                        </div>
                        <div>
                          <span>Broadcasts:</span>
                          <span className="font-medium ml-1">{worker.broadcast_count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="messages">
          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Message Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Message Type Distribution</h3>
                    <div className="h-64">
                      {metrics?.messages.by_type && Object.keys(metrics.messages.by_type).length > 0 ? (
                        <Pie data={getMessageTypeChartData()} />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <p className="text-muted-foreground">No message data available</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Message Counts</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Sent Messages:</span>
                        <span className="font-medium">{metrics?.messages.sent ?? 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Received Messages:</span>
                        <span className="font-medium">{metrics?.messages.received ?? 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Errors:</span>
                        <span className="font-medium">{metrics?.messages.errors ?? 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Error Rate:</span>
                        <span className="font-medium">
                          {healthStatus?.error_rate 
                            ? (healthStatus.error_rate * 100).toFixed(2) 
                            : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Errors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics?.errors.recent && metrics.errors.recent.length > 0 ? (
                    metrics.errors.recent.map((error, index) => (
                      <div key={index} className="p-2 bg-red-50 rounded border border-red-200">
                        <div className="flex justify-between">
                          <span className="font-medium">{error.type}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(error.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm">{error.message}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No recent errors</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-md">
                    <h3 className="text-sm font-medium mb-2">Avg Message Latency</h3>
                    <p className="text-2xl font-bold">{metrics?.performance.avg_message_latency_ms?.toFixed(2) ?? 0} ms</p>
                  </div>
                  
                  <div className="p-4 border rounded-md">
                    <h3 className="text-sm font-medium mb-2">Max Message Latency</h3>
                    <p className="text-2xl font-bold">{metrics?.performance.max_message_latency_ms?.toFixed(2) ?? 0} ms</p>
                  </div>
                  
                  <div className="p-4 border rounded-md">
                    <h3 className="text-sm font-medium mb-2">Avg Broadcast Time</h3>
                    <p className="text-2xl font-bold">{metrics?.performance.avg_broadcast_time_ms?.toFixed(2) ?? 0} ms</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="historical">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Historical Metrics</h2>
            <div className="flex items-center gap-4">
              <Select
                value={historicalTimeRange.toString()}
                onValueChange={(value) => setHistoricalTimeRange(parseInt(value))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Last 24 Hours</SelectItem>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="14">Last 14 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchHistoricalData}
                disabled={loadingHistorical}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingHistorical ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportHistoricalMetrics}
                disabled={!historicalMetrics || historicalMetrics.length === 0}
              >
                <DownloadIcon className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
          </div>

          {loadingHistorical ? (
            <div className="flex justify-center items-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : historicalMetrics.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">
                  <p>No historical data available for the selected time range.</p>
                  <p className="text-sm">Historical data is collected hourly. Check back later or adjust the time range.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Connection Trends</CardTitle>
                  <CardDescription>
                    Historical view of active connections and unique users over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <Line 
                      data={getHistoricalConnectionsData()}
                      options={timeSeriesOptions}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Message Statistics</CardTitle>
                  <CardDescription>
                    Message volume and error rates over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <Line 
                      data={getHistoricalMessagesData()}
                      options={timeSeriesOptions}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>
                    WebSocket latency and processing times over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <Line 
                      data={getHistoricalPerformanceData()}
                      options={{
                        ...timeSeriesOptions,
                        scales: {
                          ...timeSeriesOptions.scales,
                          y: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: 'Milliseconds'
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="alerts">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">WebSocket Alerts</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="includeAcknowledged" 
                  checked={includeAcknowledgedAlerts}
                  onCheckedChange={(checked) => setIncludeAcknowledgedAlerts(!!checked)}
                />
                <Label htmlFor="includeAcknowledged">Include acknowledged</Label>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchAlerts}
                disabled={loadingAlerts}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingAlerts ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportAlerts}
                disabled={!alerts || alerts.length === 0}
              >
                <DownloadIcon className="h-4 w-4 mr-2" />
                Export Alerts
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={openNewThresholdDialog}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Threshold
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Active Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Active Alerts</CardTitle>
                <CardDescription>
                  Alerts triggered by WebSocket metric thresholds
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingAlerts ? (
                  <div className="flex justify-center items-center h-40">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : alerts.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <AlertTriangle className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                    <p>No alerts found</p>
                    {!includeAcknowledgedAlerts && (
                      <p className="text-sm mt-2">Only showing unacknowledged alerts. Toggle "Include acknowledged" to see all alerts.</p>
                    )}
                  </div>
                ) : (
                  <div className="overflow-auto" style={{ maxHeight: '400px' }}>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Severity</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Message</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {alerts.map((alert) => (
                          <TableRow key={alert.id}>
                            <TableCell>
                              <Badge className={getAlertSeverityColor(alert.severity)}>
                                {alert.severity}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(alert.timestamp).toLocaleString()}
                            </TableCell>
                            <TableCell>{alert.message}</TableCell>
                            <TableCell>
                              {alert.acknowledged ? (
                                <Badge variant="outline" className="bg-gray-100">
                                  Acknowledged
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                  Active
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {!alert.acknowledged && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAcknowledgeAlert(alert.id)}
                                >
                                  <BellOff className="h-4 w-4 mr-2" />
                                  Acknowledge
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Alert Thresholds */}
            <Card>
              <CardHeader>
                <CardTitle>Alert Thresholds</CardTitle>
                <CardDescription>
                  Configure when alerts should be triggered
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingAlerts ? (
                  <div className="flex justify-center items-center h-40">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : thresholds.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <Settings className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                    <p>No alert thresholds configured</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={openNewThresholdDialog}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Threshold
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Metric</TableHead>
                        <TableHead>Condition</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {thresholds.map((threshold, index) => (
                        <TableRow key={index}>
                          <TableCell>{threshold.metric}</TableCell>
                          <TableCell>
                            {{
                              gt: '>',
                              lt: '<',
                              eq: '=',
                              gte: '>=',
                              lte: '<=',
                            }[threshold.condition] || threshold.condition}
                          </TableCell>
                          <TableCell>
                            {threshold.metric.includes('utilization') || threshold.metric.includes('error_rate')
                              ? `${(threshold.value * 100).toFixed(1)}%`
                              : threshold.value}
                          </TableCell>
                          <TableCell>
                            <Badge className={getAlertSeverityColor(threshold.severity)}>
                              {threshold.severity}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {threshold.enabled ? (
                              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                                Enabled
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-100">
                                Disabled
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditThresholdDialog(index)}
                            >
                              <Settings className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteThreshold(index)}
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="ml-auto"
                  onClick={openNewThresholdDialog}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Threshold
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="testing">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">WebSocket Connection Testing</h2>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setConnectionTestResults(null);
                  setPoolTestResults(null);
                  setEchoTestResults(null);
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear Results
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Basic Connection Test */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <div className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    WebSocket Server Test
                  </div>
                </CardTitle>
                <CardDescription>
                  Test the WebSocket server's ability to accept connections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      This test verifies that the WebSocket server is running and correctly accepting connections.
                    </p>
                    <Button 
                      onClick={handleTestConnection} 
                      disabled={testingConnection}
                      variant="default"
                    >
                      {testingConnection ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Activity className="h-4 w-4 mr-2" />
                      )}
                      Run Test
                    </Button>
                  </div>

                  {connectionTestResults && (
                    <div className={`mt-4 p-4 rounded-lg border ${
                      connectionTestResults.success 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {connectionTestResults.success ? (
                          <Check className="h-5 w-5 text-green-500" />
                        ) : (
                          <X className="h-5 w-5 text-red-500" />
                        )}
                        <h3 className="font-medium">
                          {connectionTestResults.message}
                        </h3>
                      </div>
                      
                      {connectionTestResults.latency_ms && (
                        <p className="text-sm mb-2">
                          <strong>Latency:</strong> {connectionTestResults.latency_ms.toFixed(2)} ms
                        </p>
                      )}
                      
                      {connectionTestResults.details && (
                        <div className="bg-white/50 p-3 rounded border text-sm mt-2">
                          <pre className="whitespace-pre-wrap break-all">{JSON.stringify(connectionTestResults.details, null, 2)}</pre>
                        </div>
                      )}
                      
                      <p className="text-xs text-muted-foreground mt-2">
                        Test run at {new Date(connectionTestResults.timestamp).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Connection Pool Test */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <div className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    Connection Pool Test
                  </div>
                </CardTitle>
                <CardDescription>
                  Test the WebSocket connection pool functionality
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      This test verifies that the connection pool and its workers are functioning correctly.
                    </p>
                    <Button 
                      onClick={handleTestConnectionPool} 
                      disabled={testingPool}
                      variant="default"
                    >
                      {testingPool ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Activity className="h-4 w-4 mr-2" />
                      )}
                      Run Test
                    </Button>
                  </div>

                  {poolTestResults && (
                    <div className={`mt-4 p-4 rounded-lg border ${
                      poolTestResults.success 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {poolTestResults.success ? (
                          <Check className="h-5 w-5 text-green-500" />
                        ) : (
                          <X className="h-5 w-5 text-red-500" />
                        )}
                        <h3 className="font-medium">
                          {poolTestResults.message}
                        </h3>
                      </div>
                      
                      {poolTestResults.latency_ms && (
                        <p className="text-sm mb-2">
                          <strong>Latency:</strong> {poolTestResults.latency_ms.toFixed(2)} ms
                        </p>
                      )}
                      
                      {poolTestResults.details && poolTestResults.details.workers && (
                        <div className="mt-3">
                          <h4 className="text-sm font-medium mb-2">Worker Status:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {poolTestResults.details.workers.map((worker: any) => (
                              <div 
                                key={worker.worker_id} 
                                className="p-2 bg-white/70 rounded border"
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">{worker.worker_id}</span>
                                  <Badge className="bg-green-500">
                                    {worker.status}
                                  </Badge>
                                </div>
                                <div className="text-xs mt-1">
                                  <div className="flex justify-between">
                                    <span>Connections:</span>
                                    <span>{worker.active_connections}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Utilization:</span>
                                    <span>{(worker.utilization * 100).toFixed(1)}%</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Queue Size:</span>
                                    <span>{worker.queue_size}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <p className="text-xs text-muted-foreground mt-2">
                        Test run at {new Date(poolTestResults.timestamp).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Echo Test */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Echo Message Test
                  </div>
                </CardTitle>
                <CardDescription>
                  Test message processing by sending an echo message
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="echoMessage">Test Message</Label>
                    <div className="flex gap-3">
                      <Input 
                        id="echoMessage"
                        value={echoMessage}
                        onChange={(e) => setEchoMessage(e.target.value)}
                        placeholder="Enter a test message"
                        className="flex-1"
                      />
                      <Button 
                        onClick={handleTestEcho} 
                        disabled={testingEcho}
                        variant="default"
                      >
                        {testingEcho ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Activity className="h-4 w-4 mr-2" />
                        )}
                        Send Echo
                      </Button>
                    </div>
                  </div>

                  {echoTestResults && (
                    <div className={`mt-4 p-4 rounded-lg border ${
                      echoTestResults.success 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {echoTestResults.success ? (
                          <Check className="h-5 w-5 text-green-500" />
                        ) : (
                          <X className="h-5 w-5 text-red-500" />
                        )}
                        <h3 className="font-medium">
                          {echoTestResults.message}
                        </h3>
                      </div>
                      
                      {echoTestResults.latency_ms && (
                        <p className="text-sm mb-2">
                          <strong>Latency:</strong> {echoTestResults.latency_ms.toFixed(2)} ms
                        </p>
                      )}
                      
                      {echoTestResults.details && echoTestResults.details.echo && (
                        <div className="bg-white/50 p-3 rounded border mt-2">
                          <p className="font-medium text-sm">Echo Response:</p>
                          <p className="text-sm mt-1">{echoTestResults.details.echo}</p>
                        </div>
                      )}
                      
                      <p className="text-xs text-muted-foreground mt-2">
                        Test run at {new Date(echoTestResults.timestamp).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Threshold Dialog */}
      <Dialog open={showThresholdDialog} onOpenChange={setShowThresholdDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingThresholdIndex !== null ? 'Edit Alert Threshold' : 'Add Alert Threshold'}
            </DialogTitle>
            <DialogDescription>
              Configure when alerts should be triggered based on WebSocket metrics.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...thresholdForm}>
            <form onSubmit={thresholdForm.handleSubmit(onThresholdSubmit)} className="space-y-4">
              <FormField
                control={thresholdForm.control}
                name="metric"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Metric</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select metric" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="connections.utilization">Connection Pool Utilization</SelectItem>
                        <SelectItem value="connections.total">Total Connections</SelectItem>
                        <SelectItem value="messages.error_rate">Message Error Rate</SelectItem>
                        <SelectItem value="performance.avg_message_latency_ms">Average Message Latency</SelectItem>
                        <SelectItem value="performance.max_message_latency_ms">Maximum Message Latency</SelectItem>
                        <SelectItem value="performance.avg_broadcast_time_ms">Average Broadcast Time</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={thresholdForm.control}
                name="condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condition</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="gt">Greater Than (>)</SelectItem>
                        <SelectItem value="lt">Less Than (&lt;)</SelectItem>
                        <SelectItem value="eq">Equal To (=)</SelectItem>
                        <SelectItem value="gte">Greater Than or Equal (>=)</SelectItem>
                        <SelectItem value="lte">Less Than or Equal (&lt;=)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={thresholdForm.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Threshold Value</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step={field.value < 1 ? 0.01 : 1}
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={thresholdForm.control}
                name="severity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Severity</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={thresholdForm.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Checkbox 
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Enabled</FormLabel>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowThresholdDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WebSocketAnalyticsDashboard; 