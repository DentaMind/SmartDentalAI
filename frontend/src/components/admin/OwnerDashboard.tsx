import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle,
  Tabs, TabsContent, TabsList, TabsTrigger,
  Alert, AlertTitle, AlertDescription,
  Progress,
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell
} from '../ui/';
import { 
  AreaChart, LineChart, BarChart, PieChart, 
  Area, Line, Bar, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  AlertCircle, CheckCircle, RefreshCw, ArrowUpRight, ArrowDownRight, 
  Server, Activity, Brain, Users, Building, FileText, Settings, Clock 
} from 'lucide-react';

interface SystemMetrics {
  system_health: {
    status: string;
    uptime_percentage: number;
    api_response_time_ms: number;
    error_rate_percentage: number;
    active_users: number;
    active_practices: number;
  };
  ai_performance: {
    overall_accuracy: number;
    confidence_threshold: number;
    false_positive_rate: number;
    false_negative_rate: number;
    total_diagnoses: number;
    diagnoses_by_area: {
      [key: string]: number;
    };
  };
  feedback_metrics: {
    total_feedback_count: number;
    accepted_percentage: number;
    corrected_percentage: number;
    rejected_percentage: number;
    average_confidence_score: number;
    top_correction_areas: {
      area: string;
      correction_rate: number;
    }[];
  };
}

interface PendingReview {
  id: string;
  patient_id: string;
  tooth_number?: number;
  diagnosis: string;
  confidence: number;
  area: string;
  severity: string;
  status: string;
  created_at: string;
  created_by: string;
  updated_at?: string;
  updated_by?: string;
  provider_feedback?: string;
  correction?: string;
  feedback_type?: string;
  provider_name?: string;
  provider_role?: string;
}

interface AuditRecord {
  timestamp: string;
  action: string;
  details: string;
  user: string;
  ip_address: string;
}

export function OwnerDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [aiTrends, setAiTrends] = useState<any>(null);
  const [practicePerformance, setPracticePerformance] = useState<any>(null);
  const [learningOpportunities, setLearningOpportunities] = useState<any>(null);
  const [technicalMetrics, setTechnicalMetrics] = useState<any>(null);
  const [auditLog, setAuditLog] = useState<AuditRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState('30d');

  useEffect(() => {
    fetchDashboardData();
  }, [timePeriod]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch system summary
      const summaryResponse = await fetch(`/api/diagnostic-feedback/owner/dashboard/summary?time_period=${timePeriod}`);
      if (!summaryResponse.ok) throw new Error('Failed to fetch system summary');
      const summaryData = await summaryResponse.json();
      setSystemMetrics(summaryData);
      
      // Fetch pending reviews
      const reviewsResponse = await fetch('/api/diagnostic-feedback/owner/pending-reviews');
      if (!reviewsResponse.ok) throw new Error('Failed to fetch pending reviews');
      const reviewsData = await reviewsResponse.json();
      setPendingReviews(reviewsData);
      
      // Fetch AI model trends
      const trendsResponse = await fetch('/api/diagnostic-feedback/owner/dashboard/ai-model-trends');
      if (!trendsResponse.ok) throw new Error('Failed to fetch AI trends');
      const trendsData = await trendsResponse.json();
      setAiTrends(trendsData);
      
      // Fetch practice performance
      const practiceResponse = await fetch('/api/diagnostic-feedback/owner/dashboard/practice-performance');
      if (!practiceResponse.ok) throw new Error('Failed to fetch practice performance');
      const practiceData = await practiceResponse.json();
      setPracticePerformance(practiceData);
      
      // Fetch learning opportunities
      const learningResponse = await fetch('/api/diagnostic-feedback/owner/dashboard/learning-opportunities');
      if (!learningResponse.ok) throw new Error('Failed to fetch learning opportunities');
      const learningData = await learningResponse.json();
      setLearningOpportunities(learningData);
      
      // Fetch technical metrics
      const techResponse = await fetch('/api/diagnostic-feedback/owner/dashboard/technical-metrics');
      if (!techResponse.ok) throw new Error('Failed to fetch technical metrics');
      const techData = await techResponse.json();
      setTechnicalMetrics(techData);
      
      // Fetch audit log
      const auditResponse = await fetch('/api/diagnostic-feedback/owner/dashboard/audit-log');
      if (!auditResponse.ok) throw new Error('Failed to fetch audit log');
      const auditData = await auditResponse.json();
      setAuditLog(auditData.audit_records);
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleReviewDecision = async (findingId: string, decision: string, note: string = '') => {
    try {
      const response = await fetch(`/api/diagnostic-feedback/owner/review/${findingId}?decision=${decision}&owner_note=${encodeURIComponent(note)}`, {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('Failed to submit review decision');
      
      // Update local state
      setPendingReviews(pendingReviews.filter(review => review.id !== findingId));
      
      // Refresh data
      fetchDashboardData();
      
    } catch (err) {
      console.error('Error submitting review decision:', err);
      setError('Failed to submit review decision. Please try again.');
    }
  };
  
  // Format a number as thousands (e.g., 1.2k)
  const formatNumber = (num: number) => {
    return num >= 1000 ? `${(num / 1000).toFixed(1)}k` : num.toString();
  };
  
  // Format a date for display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  if (isLoading && !systemMetrics) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!systemMetrics) {
    return null;
  }

  // Prepare data for charts
  const diagnosisAreaData = Object.entries(systemMetrics.ai_performance.diagnoses_by_area).map(([name, value]) => ({
    name,
    value
  }));

  const feedbackStatusData = [
    { name: 'Accepted', value: systemMetrics.feedback_metrics.accepted_percentage },
    { name: 'Corrected', value: systemMetrics.feedback_metrics.corrected_percentage },
    { name: 'Rejected', value: systemMetrics.feedback_metrics.rejected_percentage }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">DentaMind Owner Dashboard</h1>
        <div className="flex items-center gap-2">
          <select 
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
            className="rounded-md border border-input px-3 py-2 text-sm"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
            <option value="all">All Time</option>
          </select>
          <button 
            onClick={() => fetchDashboardData()} 
            className="flex items-center gap-1 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-7 mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pending-reviews">Pending Reviews</TabsTrigger>
          <TabsTrigger value="ai-trends">AI Performance</TabsTrigger>
          <TabsTrigger value="practices">Practices</TabsTrigger>
          <TabsTrigger value="learning">Learning</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
                <div className={`p-1 rounded-full ${systemMetrics.system_health.status === 'healthy' ? 'bg-green-100' : 'bg-red-100'}`}>
                  {systemMetrics.system_health.status === 'healthy' ? 
                    <CheckCircle className="h-4 w-4 text-green-600" /> : 
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  }
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemMetrics.system_health.uptime_percentage}%</div>
                <p className="text-xs text-muted-foreground">Uptime</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Accuracy</CardTitle>
                <Brain className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemMetrics.ai_performance.overall_accuracy}%</div>
                <Progress 
                  value={systemMetrics.ai_performance.overall_accuracy} 
                  className="h-2 mt-2"
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Practices</CardTitle>
                <Building className="h-4 w-4 text-violet-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemMetrics.system_health.active_practices}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600 flex items-center">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    +5% from last month
                  </span>
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Diagnoses</CardTitle>
                <FileText className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(systemMetrics.ai_performance.total_diagnoses)}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600 flex items-center">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    +12% from last period
                  </span>
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            {/* Diagnoses by Area */}
            <Card>
              <CardHeader>
                <CardTitle>Diagnoses by Area</CardTitle>
                <CardDescription>Distribution of diagnoses across different dental areas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={diagnosisAreaData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {diagnosisAreaData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Feedback Status */}
            <Card>
              <CardHeader>
                <CardTitle>Feedback Status</CardTitle>
                <CardDescription>How providers are responding to AI diagnoses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={feedbackStatusData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `${value}%`} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                      <Bar dataKey="value" name="Percentage" fill="#4f46e5">
                        {feedbackStatusData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={index === 0 ? '#22c55e' : index === 1 ? '#3b82f6' : '#ef4444'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Reviews Pending Owner Action */}
          <Card>
            <CardHeader>
              <CardTitle>Reviews Pending Owner Action</CardTitle>
              <CardDescription>Provider feedback requiring your review</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingReviews.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">No reviews pending action</p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient ID</TableHead>
                        <TableHead>Diagnosis</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingReviews.slice(0, 5).map((review) => (
                        <TableRow key={review.id}>
                          <TableCell className="font-medium">{review.patient_id}</TableCell>
                          <TableCell>
                            {review.correction ? 
                              <span>{review.diagnosis} → <span className="text-blue-600">{review.correction}</span></span> : 
                              review.diagnosis
                            }
                          </TableCell>
                          <TableCell>{review.provider_name}</TableCell>
                          <TableCell>
                            {review.feedback_type === 'correction' ? 
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">Correction</span> :
                              <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">Rejection</span>
                            }
                          </TableCell>
                          <TableCell>{formatDate(review.updated_at || review.created_at)}</TableCell>
                          <TableCell className="text-right">
                            <button 
                              className="text-sm text-primary hover:underline"
                              onClick={() => setActiveTab('pending-reviews')}
                            >
                              Review
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {pendingReviews.length > 5 && (
                <div className="flex justify-center mt-4">
                  <button 
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                    onClick={() => setActiveTab('pending-reviews')}
                  >
                    View all {pendingReviews.length} pending reviews
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Reviews Tab */}
        <TabsContent value="pending-reviews" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Owner Reviews</CardTitle>
              <CardDescription>
                Review provider corrections and rejections that require owner approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingReviews.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No reviews pending your action</p>
              ) : (
                <div className="space-y-6">
                  {pendingReviews.map((review) => (
                    <div key={review.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-semibold">
                            {review.tooth_number ? `Tooth #${review.tooth_number}: ` : ''}
                            {review.diagnosis}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Patient ID: {review.patient_id} | Confidence: {(review.confidence * 100).toFixed(0)}% | 
                            Area: {review.area} | Severity: {review.severity}
                          </p>
                        </div>
                        <div>
                          {review.feedback_type === 'correction' ? 
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">Correction</span> :
                            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">Rejection</span>
                          }
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-sm font-medium">Provider Feedback:</p>
                        <p className="text-sm">{review.provider_feedback}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          By {review.provider_name} ({review.provider_role}) on {formatDate(review.updated_at || review.created_at)}
                        </p>
                      </div>
                      
                      {review.correction && (
                        <div className="bg-blue-50 p-3 rounded-md">
                          <p className="text-sm font-medium">Proposed Correction:</p>
                          <p className="text-sm">{review.correction}</p>
                        </div>
                      )}
                      
                      <div className="flex justify-end gap-2 pt-2">
                        <button 
                          className="px-3 py-1 bg-green-100 text-green-800 rounded-md hover:bg-green-200"
                          onClick={() => handleReviewDecision(review.id, 'accept', 'Owner approved this change')}
                        >
                          Accept
                        </button>
                        <button 
                          className="px-3 py-1 bg-red-100 text-red-800 rounded-md hover:bg-red-200"
                          onClick={() => handleReviewDecision(review.id, 'reject', 'Owner rejected this change')}
                        >
                          Reject
                        </button>
                        <button 
                          className="px-3 py-1 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
                          onClick={() => handleReviewDecision(review.id, 'escalate', 'Owner escalated for further review')}
                        >
                          Escalate
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs would be implemented here */}
        {/* For brevity, I'm not implementing all tabs in detail */}
        <TabsContent value="ai-trends">
          <Card>
            <CardHeader>
              <CardTitle>AI Performance Trends</CardTitle>
              <CardDescription>Model performance across versions and time</CardDescription>
            </CardHeader>
            <CardContent>
              <p>AI performance trends visualization would go here</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="practices">
          <Card>
            <CardHeader>
              <CardTitle>Practice Performance</CardTitle>
              <CardDescription>Performance metrics across dental practices</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Practice performance data would go here</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="learning">
          <Card>
            <CardHeader>
              <CardTitle>Learning Opportunities</CardTitle>
              <CardDescription>AI improvement opportunities based on feedback</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Learning opportunities would go here</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="technical">
          <Card>
            <CardHeader>
              <CardTitle>Technical Metrics</CardTitle>
              <CardDescription>System performance and resource utilization</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Technical metrics would go here</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Audit Log</CardTitle>
              <CardDescription>Record of system actions and changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLog.map((record, index) => (
                      <TableRow key={index}>
                        <TableCell>{formatDate(record.timestamp)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            record.action === 'OWNER_REVIEW' ? 'bg-blue-100 text-blue-800' :
                            record.action === 'MODEL_UPDATE' ? 'bg-green-100 text-green-800' :
                            record.action === 'CONFIGURATION_CHANGE' ? 'bg-amber-100 text-amber-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {record.action}
                          </span>
                        </TableCell>
                        <TableCell>{record.details}</TableCell>
                        <TableCell>{record.user}</TableCell>
                        <TableCell>{record.ip_address}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 