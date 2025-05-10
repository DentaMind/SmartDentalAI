import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/api';
import { DiagnosisAuditLog, DiagnosisSuggestion } from '@/types/ai-diagnosis';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { BrainCircuit, TrendingUp, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

interface AuditLogTableRow extends DiagnosisAuditLog {
  formattedTimestamp: string;
  status: 'accepted' | 'rejected' | 'override';
}

interface PerformanceMetrics {
  totalSuggestions: number;
  acceptedSuggestions: number;
  rejectedSuggestions: number;
  overrides: number;
  averageConfidence: number;
  accuracyTrend: { date: string; accuracy: number }[];
}

export default function AIDashboard() {
  const [auditLogs, setAuditLogs] = useState<AuditLogTableRow[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    totalSuggestions: 0,
    acceptedSuggestions: 0,
    rejectedSuggestions: 0,
    overrides: 0,
    averageConfidence: 0,
    accuracyTrend: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest('/api/diagnosis/audit-logs', 'GET');
      
      // Process audit logs
      const processedLogs: AuditLogTableRow[] = response.logs.map((log: DiagnosisAuditLog) => ({
        ...log,
        formattedTimestamp: format(new Date(log.timestamp), 'PPpp'),
        status: log.override ? 'override' : 
          (log.feedback?.correctness === 'correct' ? 'accepted' : 'rejected')
      }));
      setAuditLogs(processedLogs);

      // Calculate metrics
      const metrics = calculateMetrics(processedLogs);
      setMetrics(metrics);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMetrics = (logs: AuditLogTableRow[]): PerformanceMetrics => {
    const accepted = logs.filter(log => log.status === 'accepted').length;
    const rejected = logs.filter(log => log.status === 'rejected').length;
    const overrides = logs.filter(log => log.status === 'override').length;
    const total = logs.length;

    // Calculate accuracy trend by day
    const trendMap = new Map<string, { correct: number; total: number }>();
    logs.forEach(log => {
      const date = format(new Date(log.timestamp), 'yyyy-MM-dd');
      const current = trendMap.get(date) || { correct: 0, total: 0 };
      trendMap.set(date, {
        correct: current.correct + (log.status === 'accepted' ? 1 : 0),
        total: current.total + 1
      });
    });

    const accuracyTrend = Array.from(trendMap.entries()).map(([date, stats]) => ({
      date,
      accuracy: (stats.correct / stats.total) * 100
    }));

    return {
      totalSuggestions: total,
      acceptedSuggestions: accepted,
      rejectedSuggestions: rejected,
      overrides,
      averageConfidence: accepted / total * 100,
      accuracyTrend
    };
  };

  const columns: ColumnDef<AuditLogTableRow>[] = [
    {
      accessorKey: "formattedTimestamp",
      header: "Timestamp"
    },
    {
      accessorKey: "diagnosis",
      header: "Diagnosis"
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge variant={
            status === 'accepted' ? "success" :
            status === 'rejected' ? "destructive" :
            "warning"
          }>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      }
    },
    {
      accessorKey: "feedback.feedback",
      header: "Feedback"
    }
  ];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading AI Performance Dashboard...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BrainCircuit className="mr-2 h-5 w-5" />
            AI Diagnosis Performance Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="accuracy">Accuracy Trend</TabsTrigger>
              <TabsTrigger value="audit">Audit Logs</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Total Suggestions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.totalSuggestions}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Acceptance Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.round(metrics.averageConfidence)}%
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Overrides</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.overrides}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Model Version</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">1.0.0</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="accuracy">
              <Card>
                <CardContent className="pt-6">
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={metrics.accuracyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="accuracy" 
                        stroke="#2563eb" 
                        name="Accuracy %" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="audit">
              <Card>
                <CardContent className="pt-6">
                  <DataTable 
                    columns={columns} 
                    data={auditLogs}
                    searchKey="diagnosis"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 