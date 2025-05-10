import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  Brain,
  BarChart,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCcw,
  TrendingUp,
  Table,
  Settings,
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

interface ModelMetrics {
  id: string;
  model_version: string;
  model_type: string;
  accuracy: number;
  precision?: number;
  recall?: number;
  f1_score?: number;
  false_positives?: number;
  false_negatives?: number;
  confusion_matrix?: Record<string, any>;
  total_samples: number;
  training_duration?: number;
  last_trained: string;
  trained_by?: string;
  clinic_id?: string;
}

interface FeedbackAnalytics {
  period: string;
  start_date: string;
  end_date: string;
  total_feedback: number;
  correct_count: number;
  incorrect_count: number;
  by_priority: Record<string, number>;
  by_correction_type: Record<string, number>;
  trend?: {
    previous_period_count: number;
    percentage_change: number;
  };
}

interface TrainingJob {
  id: string;
  model_version: string;
  status: string;
  started_at?: string;
  completed_at?: string;
  triggered_by?: string;
  feedback_count: number;
  parameters?: Record<string, any>;
  error_message?: string;
  created_at: string;
}

interface AIModelDashboardProps {
  clinicId?: string;
  isAdmin?: boolean;
}

export const AIModelDashboard: React.FC<AIModelDashboardProps> = ({
  clinicId,
  isAdmin = false,
}) => {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [feedbackAnalytics, setFeedbackAnalytics] = useState<FeedbackAnalytics | null>(null);
  const [trainingJobs, setTrainingJobs] = useState<TrainingJob[]>([]);
  const [loading, setLoading] = useState({
    metrics: true,
    analytics: true,
    jobs: true,
  });
  const [analyticsPeriod, setAnalyticsPeriod] = useState('month');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(prev => ({ ...prev, metrics: true }));
        const metricsResponse = await axios.get('/api/ai/metrics', {
          params: { clinicId },
        });
        setMetrics(metricsResponse.data);
      } catch (error) {
        console.error('Error fetching model metrics:', error);
        toast({
          variant: 'destructive',
          title: 'Failed to load model metrics',
          description: 'Please try again later',
        });
      } finally {
        setLoading(prev => ({ ...prev, metrics: false }));
      }

      try {
        setLoading(prev => ({ ...prev, analytics: true }));
        const analyticsResponse = await axios.get('/api/ai/analytics/feedback', {
          params: { period: analyticsPeriod, clinic_id: clinicId },
        });
        setFeedbackAnalytics(analyticsResponse.data);
      } catch (error) {
        console.error('Error fetching feedback analytics:', error);
      } finally {
        setLoading(prev => ({ ...prev, analytics: false }));
      }

      if (isAdmin) {
        try {
          setLoading(prev => ({ ...prev, jobs: true }));
          const jobsResponse = await axios.get('/api/ai/training', {
            params: { limit: 5 },
          });
          setTrainingJobs(jobsResponse.data);
        } catch (error) {
          console.error('Error fetching training jobs:', error);
        } finally {
          setLoading(prev => ({ ...prev, jobs: false }));
        }
      }
    };

    fetchData();
  }, [clinicId, analyticsPeriod, toast, isAdmin]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const [metricsResponse, analyticsResponse] = await Promise.all([
        axios.get('/api/ai/metrics', { params: { clinicId } }),
        axios.get('/api/ai/analytics/feedback', {
          params: { period: analyticsPeriod, clinic_id: clinicId },
        }),
      ]);

      setMetrics(metricsResponse.data);
      setFeedbackAnalytics(analyticsResponse.data);

      if (isAdmin) {
        const jobsResponse = await axios.get('/api/ai/training', {
          params: { limit: 5 },
        });
        setTrainingJobs(jobsResponse.data);
      }

      toast({
        title: 'Dashboard refreshed',
        description: 'AI metrics have been updated',
      });
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      toast({
        variant: 'destructive',
        title: 'Refresh failed',
        description: 'Could not update dashboard data',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateTrainingJob = async () => {
    if (!isAdmin) return;

    try {
      // Get latest model version
      const latestVersion = metrics?.model_version || '1.0.0';
      // Calculate next version
      const [major, minor, patch] = latestVersion.split('.').map(Number);
      const newVersion = `${major}.${minor}.${patch + 1}`;

      const response = await axios.post('/api/ai/training', {
        model_version: newVersion,
        triggered_by: 'admin',
        clinic_id: clinicId,
      });

      setTrainingJobs(prev => [response.data, ...prev]);

      toast({
        title: 'Training job created',
        description: `New model version ${newVersion} training initiated`,
      });
    } catch (error) {
      console.error('Error creating training job:', error);
      toast({
        variant: 'destructive',
        title: 'Job creation failed',
        description: 'Could not create training job. A job might already be in progress.',
      });
    }
  };

  // Helper to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Loading states
  if (loading.metrics && loading.analytics) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="flex flex-col items-center">
            <Clock className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">Loading AI metrics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center">
              <Brain className="mr-2 h-5 w-5 text-primary" />
              AI Model Dashboard
            </CardTitle>
            <CardDescription>
              Performance metrics and training data for diagnostic AI
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <Clock className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </CardHeader>

      <Tabs defaultValue="performance">
        <div className="px-6">
          <TabsList className="w-full">
            <TabsTrigger value="performance" className="flex-1">
              <BarChart className="mr-2 h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex-1">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Feedback
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="training" className="flex-1">
                <Settings className="mr-2 h-4 w-4" />
                Training
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="performance">
          <CardContent>
            {metrics ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Model Version
                    </h3>
                    <div className="flex items-center space-x-2">
                      <Badge>{metrics.model_version}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {metrics.model_type}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Last trained: {formatDate(metrics.last_trained)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Accuracy
                    </h3>
                    <div>
                      <span className="text-2xl font-bold">
                        {(metrics.accuracy * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress
                      value={metrics.accuracy * 100}
                      className="h-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Training Data
                    </h3>
                    <div>
                      <span className="text-2xl font-bold">{metrics.total_samples}</span>
                      <span className="text-sm text-muted-foreground ml-2">samples</span>
                    </div>
                    {metrics.training_duration && (
                      <p className="text-xs text-muted-foreground">
                        Training time: {(metrics.training_duration / 60).toFixed(1)} minutes
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-md font-medium">Additional Metrics</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-md">
                      <h4 className="text-sm font-medium mb-2">Precision</h4>
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold">
                          {metrics.precision
                            ? (metrics.precision * 100).toFixed(1) + '%'
                            : 'N/A'}
                        </span>
                        {metrics.precision && (
                          <Badge
                            variant={metrics.precision > 0.8 ? 'default' : 'secondary'}
                          >
                            {metrics.precision > 0.8 ? 'Good' : 'Needs Improvement'}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="p-4 border rounded-md">
                      <h4 className="text-sm font-medium mb-2">Recall</h4>
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold">
                          {metrics.recall
                            ? (metrics.recall * 100).toFixed(1) + '%'
                            : 'N/A'}
                        </span>
                        {metrics.recall && (
                          <Badge
                            variant={metrics.recall > 0.8 ? 'default' : 'secondary'}
                          >
                            {metrics.recall > 0.8 ? 'Good' : 'Needs Improvement'}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="p-4 border rounded-md">
                      <h4 className="text-sm font-medium mb-2">F1 Score</h4>
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold">
                          {metrics.f1_score
                            ? (metrics.f1_score * 100).toFixed(1) + '%'
                            : 'N/A'}
                        </span>
                        {metrics.f1_score && (
                          <Badge
                            variant={metrics.f1_score > 0.8 ? 'default' : 'secondary'}
                          >
                            {metrics.f1_score > 0.8 ? 'Good' : 'Needs Improvement'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p>No model metrics available.</p>
              </div>
            )}
          </CardContent>
        </TabsContent>

        <TabsContent value="feedback">
          <CardContent>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-md font-medium">Feedback Analysis</h3>
              <Select
                value={analyticsPeriod}
                onValueChange={setAnalyticsPeriod}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="quarter">Last Quarter</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading.analytics ? (
              <div className="flex justify-center py-8">
                <Clock className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : feedbackAnalytics ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-md flex flex-col">
                    <span className="text-sm text-muted-foreground">Total Feedback</span>
                    <span className="text-2xl font-bold">{feedbackAnalytics.total_feedback}</span>
                    {feedbackAnalytics.trend && (
                      <div className="flex items-center mt-1 text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        <span className={
                          feedbackAnalytics.trend.percentage_change > 0
                            ? 'text-green-500'
                            : 'text-red-500'
                        }>
                          {feedbackAnalytics.trend.percentage_change.toFixed(1)}% from previous period
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 border rounded-md">
                    <span className="text-sm text-muted-foreground">Correct Rate</span>
                    <div className="flex items-center">
                      <span className="text-2xl font-bold">
                        {feedbackAnalytics.total_feedback > 0
                          ? ((feedbackAnalytics.correct_count / feedbackAnalytics.total_feedback) * 100).toFixed(1) + '%'
                          : '0%'}
                      </span>
                    </div>
                    <Progress
                      value={feedbackAnalytics.total_feedback > 0
                        ? (feedbackAnalytics.correct_count / feedbackAnalytics.total_feedback) * 100
                        : 0}
                      className="h-2 mt-2"
                    />
                  </div>

                  <div className="p-4 border rounded-md">
                    <span className="text-sm text-muted-foreground">By Priority</span>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">High</span>
                        <Badge variant="destructive">{feedbackAnalytics.by_priority.high || 0}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Medium</span>
                        <Badge variant="secondary">{feedbackAnalytics.by_priority.medium || 0}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Low</span>
                        <Badge variant="outline">{feedbackAnalytics.by_priority.low || 0}</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {feedbackAnalytics.incorrect_count > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Correction Types</h4>
                    <div className="p-4 border rounded-md">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                        {Object.entries(feedbackAnalytics.by_correction_type).map(([type, count]) => (
                          <div key={type} className="flex justify-between items-center">
                            <span className="text-sm">{type.replace('_', ' ')}</span>
                            <div className="flex items-center">
                              <div className="w-32 mr-2">
                                <Progress
                                  value={(count / feedbackAnalytics.incorrect_count) * 100}
                                  className="h-2"
                                />
                              </div>
                              <span className="text-sm font-medium">{count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p>No feedback analytics available.</p>
              </div>
            )}
          </CardContent>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="training">
            <CardContent>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-md font-medium">Training Jobs</h3>
                <Button onClick={handleCreateTrainingJob}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  New Training Job
                </Button>
              </div>

              {loading.jobs ? (
                <div className="flex justify-center py-8">
                  <Clock className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : trainingJobs.length > 0 ? (
                <div className="space-y-4">
                  {trainingJobs.map((job) => (
                    <div key={job.id} className="p-4 border rounded-md">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <span className="font-medium">Version {job.model_version}</span>
                            <Badge
                              variant={
                                job.status === 'completed'
                                  ? 'default'
                                  : job.status === 'failed'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                              className="ml-2"
                            >
                              {job.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Created: {formatDate(job.created_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm">
                            {job.feedback_count} feedback items
                          </span>
                          {job.completed_at && (
                            <p className="text-sm text-muted-foreground">
                              Completed: {formatDate(job.completed_at)}
                            </p>
                          )}
                        </div>
                      </div>

                      {job.error_message && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded-sm text-sm text-red-800">
                          {job.error_message}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No training jobs found.</p>
                </div>
              )}
            </CardContent>
          </TabsContent>
        )}
      </Tabs>
    </Card>
  );
}; 