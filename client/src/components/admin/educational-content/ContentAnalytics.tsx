import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  LineChart as LineChartIcon,
  BarChart2,
  PieChart as PieChartIcon,
  Calendar,
  FileText,
  Video,
  Share2,
  User,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

// Types for analytics data
interface ContentViewData {
  id: string;
  title: string;
  content_type: string;
  view_count: number;
  completion_rate: number;
  average_view_time: number;
  risk_factors: string[];
}

interface RiskFactorStats {
  risk_factor: string;
  content_count: number;
  total_views: number;
  avg_completion: number;
}

interface AnalyticsSummary {
  total_views: number;
  total_content: number;
  total_completed: number;
  avg_completion_rate: number;
  views_by_date: Array<{ date: string; count: number }>;
  views_by_content_type: Array<{ content_type: string; count: number }>;
  views_by_risk_factor: Array<{ risk_factor: string; count: number }>;
  top_content: ContentViewData[];
  risk_factor_stats: RiskFactorStats[];
}

// Colors for charts
const COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8",
  "#82CA9D", "#FF6B6B", "#747C92", "#A569BD", "#27AE60",
];

const ContentAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<string>("30");
  const [chartType, setChartType] = useState<string>("bar");
  
  // Fetch analytics data
  const { data, isLoading, error } = useQuery<AnalyticsSummary>({
    queryKey: ["educational-content-analytics", timeRange],
    queryFn: async () => {
      const response = await axios.get(`/api/educational-content/analytics?timeRange=${timeRange}`);
      return response.data;
    },
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingAnimation />
        <span className="ml-2">Loading analytics data...</span>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="text-center p-6 text-destructive">
        <p>Error loading analytics: {(error as any)?.message || "Unknown error"}</p>
        <Button variant="outline" className="mt-4">Try Again</Button>
      </div>
    );
  }

  // Mock data for demo purposes
  // This would be replaced by real data from the backend
  const mockData = {
    total_views: 2547,
    total_content: 32,
    total_completed: 1822,
    avg_completion_rate: 71.5,
    views_by_date: [
      { date: "2023-05-01", count: 120 },
      { date: "2023-05-02", count: 150 },
      { date: "2023-05-03", count: 142 },
      { date: "2023-05-04", count: 135 },
      { date: "2023-05-05", count: 167 },
      { date: "2023-05-06", count: 91 },
      { date: "2023-05-07", count: 82 },
      { date: "2023-05-08", count: 145 },
      { date: "2023-05-09", count: 156 },
      { date: "2023-05-10", count: 189 },
      { date: "2023-05-11", count: 201 },
      { date: "2023-05-12", count: 188 },
      { date: "2023-05-13", count: 120 },
      { date: "2023-05-14", count: 99 },
    ],
    views_by_content_type: [
      { content_type: "Article", count: 980 },
      { content_type: "Video", count: 845 },
      { content_type: "PDF", count: 412 },
      { content_type: "Infographic", count: 220 },
      { content_type: "Link", count: 90 },
    ],
    views_by_risk_factor: [
      { risk_factor: "Smoking", count: 520 },
      { risk_factor: "Diabetes", count: 415 },
      { risk_factor: "Poor Hygiene", count: 680 },
      { risk_factor: "Heart Disease", count: 210 },
      { risk_factor: "Periodontal Disease", count: 490 },
      { risk_factor: "Caries Risk", count: 430 },
      { risk_factor: "Dental Anxiety", count: 315 },
    ],
    top_content: [
      { 
        id: "1", 
        title: "How Smoking Affects Your Oral Health", 
        content_type: "article", 
        view_count: 342, 
        completion_rate: 88, 
        average_view_time: 240,
        risk_factors: ["smoking", "periodontal_disease"]
      },
      { 
        id: "2", 
        title: "Proper Brushing Technique Video", 
        content_type: "video", 
        view_count: 289, 
        completion_rate: 75, 
        average_view_time: 180,
        risk_factors: ["poor_hygiene", "caries_risk"]
      },
      { 
        id: "3", 
        title: "Diabetes and Periodontal Disease Connection", 
        content_type: "article", 
        view_count: 246, 
        completion_rate: 92, 
        average_view_time: 310,
        risk_factors: ["diabetes", "periodontal_disease"]
      },
      { 
        id: "4", 
        title: "Flossing Techniques Guide", 
        content_type: "infographic", 
        view_count: 201, 
        completion_rate: 96, 
        average_view_time: 120,
        risk_factors: ["poor_hygiene"]
      },
      { 
        id: "5", 
        title: "Understanding Periodontal Maintenance", 
        content_type: "pdf", 
        view_count: 187, 
        completion_rate: 64, 
        average_view_time: 420,
        risk_factors: ["periodontal_disease"]
      },
    ],
    risk_factor_stats: [
      { 
        risk_factor: "Smoking", 
        content_count: 5, 
        total_views: 520, 
        avg_completion: 85.2 
      },
      { 
        risk_factor: "Diabetes", 
        content_count: 4, 
        total_views: 415, 
        avg_completion: 82.7 
      },
      { 
        risk_factor: "Poor Hygiene", 
        content_count: 8, 
        total_views: 680, 
        avg_completion: 88.1 
      },
      { 
        risk_factor: "Heart Disease", 
        content_count: 3, 
        total_views: 210, 
        avg_completion: 72.4 
      },
      { 
        risk_factor: "Periodontal Disease", 
        content_count: 6, 
        total_views: 490, 
        avg_completion: 79.6 
      },
      { 
        risk_factor: "Caries Risk", 
        content_count: 5, 
        total_views: 430, 
        avg_completion: 81.2 
      },
      { 
        risk_factor: "Dental Anxiety", 
        content_count: 3, 
        total_views: 315, 
        avg_completion: 76.8 
      },
    ]
  };

  // For demo purposes, use the mock data
  const analyticsData = data || mockData;

  // Helper to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Helper to get content type icon
  const getContentTypeIcon = (type: string) => {
    type = type.toLowerCase();
    switch (type) {
      case "article":
        return <FileText className="h-4 w-4" />;
      case "video":
        return <Video className="h-4 w-4" />;
      case "pdf":
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6 dark:text-white">
      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Total Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.total_views}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span>+12.5% from previous period</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Content Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.total_content}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span>+3 new items this month</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Completed Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.total_completed}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
              <span>{analyticsData.avg_completion_rate}% completion rate</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Top Risk Factor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">
              {analyticsData.views_by_risk_factor.sort((a, b) => b.count - a.count)[0]?.risk_factor}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <User className="h-3 w-3 mr-1" />
              <span>{analyticsData.views_by_risk_factor.sort((a, b) => b.count - a.count)[0]?.count} views</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={chartType} onValueChange={setChartType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Chart Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bar">
                <div className="flex items-center">
                  <BarChart2 className="h-4 w-4 mr-2" />
                  Bar Chart
                </div>
              </SelectItem>
              <SelectItem value="line">
                <div className="flex items-center">
                  <LineChartIcon className="h-4 w-4 mr-2" />
                  Line Chart
                </div>
              </SelectItem>
              <SelectItem value="pie">
                <div className="flex items-center">
                  <PieChartIcon className="h-4 w-4 mr-2" />
                  Pie Chart
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content-performance">Content Performance</TabsTrigger>
          <TabsTrigger value="risk-factors">Risk Factor Analysis</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Views Over Time</CardTitle>
              <CardDescription>
                Content views trend for the selected time period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={analyticsData.views_by_date}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(label) => `Date: ${formatDate(label)}`}
                      formatter={(value) => [`${value} views`, 'Views']}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="Views"
                      stroke="#65FF65"
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Views by Content Type</CardTitle>
                <CardDescription>
                  Distribution of views across different content formats
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'pie' ? (
                      <PieChart>
                        <Pie
                          data={analyticsData.views_by_content_type}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="content_type"
                        >
                          {analyticsData.views_by_content_type.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} views`, 'Views']} />
                        <Legend />
                      </PieChart>
                    ) : (
                      <BarChart
                        data={analyticsData.views_by_content_type}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="content_type" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value} views`, 'Views']} />
                        <Legend />
                        <Bar dataKey="count" name="Views" fill="#65FF65" />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Views by Risk Factor</CardTitle>
                <CardDescription>
                  Content views grouped by targeted risk factors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'pie' ? (
                      <PieChart>
                        <Pie
                          data={analyticsData.views_by_risk_factor}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="risk_factor"
                        >
                          {analyticsData.views_by_risk_factor.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} views`, 'Views']} />
                        <Legend />
                      </PieChart>
                    ) : (
                      <BarChart
                        data={analyticsData.views_by_risk_factor}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="risk_factor" type="category" width={100} />
                        <Tooltip formatter={(value) => [`${value} views`, 'Views']} />
                        <Legend />
                        <Bar dataKey="count" name="Views" fill="#65FF65" />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Content Performance Tab */}
        <TabsContent value="content-performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Content</CardTitle>
              <CardDescription>
                Most viewed and completed educational resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {analyticsData.top_content.map((content) => (
                  <div key={content.id} className="border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-start gap-2">
                        <div className="mt-1">
                          {getContentTypeIcon(content.content_type)}
                        </div>
                        <div>
                          <div className="font-medium">{content.title}</div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {content.content_type.charAt(0).toUpperCase() + content.content_type.slice(1)}
                            </Badge>
                            <span>•</span>
                            <Clock className="h-3 w-3" />
                            <span>
                              {content.average_view_time > 60 
                                ? `${Math.floor(content.average_view_time / 60)}m ${content.average_view_time % 60}s` 
                                : `${content.average_view_time}s`
                              }
                            </span>
                            <span>•</span>
                            <span>Tags: </span>
                            {content.risk_factors.map((factor) => (
                              <Badge key={factor} variant="secondary" className="text-xs">
                                {factor.replace('_', ' ')}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{content.view_count} views</div>
                        <div className="text-xs text-muted-foreground">
                          {content.completion_rate}% completion rate
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Completion Rate</span>
                          <span>{content.completion_rate}%</span>
                        </div>
                        <Progress value={content.completion_rate} className="h-2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Risk Factor Analysis Tab */}
        <TabsContent value="risk-factors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Factor Content Effectiveness</CardTitle>
              <CardDescription>
                Analysis of content performance by targeted risk factors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {analyticsData.risk_factor_stats.map((stat) => (
                  <div key={stat.risk_factor} className="border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">{stat.risk_factor}</div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{stat.content_count} content items</span>
                          <span>•</span>
                          <span>{stat.total_views} total views</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{stat.avg_completion.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">
                          avg. completion rate
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Effectiveness</span>
                          <span>{stat.avg_completion.toFixed(1)}%</span>
                        </div>
                        <Progress value={stat.avg_completion} className="h-2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContentAnalytics; 