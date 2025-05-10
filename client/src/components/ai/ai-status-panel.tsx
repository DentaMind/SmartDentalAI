import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { RefreshCw, AlertCircle, CheckCircle, Clock } from "lucide-react";

export function AIStatusPanel() {
  const [activeTab, setActiveTab] = useState("services");

  const { data: aiStatus, isLoading: isStatusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['/api/ai/status'],
    queryFn: () => apiRequest('/api/ai/status'),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: queueStatus, isLoading: isQueueLoading, refetch: refetchQueue } = useQuery({
    queryKey: ['/api/ai/queue'],
    queryFn: () => apiRequest('/api/ai/queue'),
    refetchInterval: 15000, // Refresh more frequently
  });

  const handleRefresh = () => {
    refetchStatus();
    refetchQueue();
  };

  // Calculate overall system health
  const getSystemHealth = () => {
    if (!aiStatus) return { status: 'unknown', percentage: 0 };
    
    const services = Object.keys(aiStatus);
    if (services.length === 0) return { status: 'unknown', percentage: 0 };
    
    const availableCount = services.filter(
      service => aiStatus[service].status === 'available'
    ).length;
    
    const limitedCount = services.filter(
      service => aiStatus[service].status === 'limited'
    ).length;
    
    const percentage = Math.round(
      ((availableCount + (limitedCount * 0.5)) / services.length) * 100
    );
    
    if (percentage > 80) return { status: 'healthy', percentage };
    if (percentage > 50) return { status: 'limited', percentage };
    return { status: 'degraded', percentage };
  };

  const systemHealth = getSystemHealth();

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
      case 'healthy':
        return 'bg-green-500';
      case 'limited':
        return 'bg-yellow-500';
      case 'unavailable':
      case 'degraded':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'available': { variant: 'outline', className: 'border-green-500 text-green-500' },
      'healthy': { variant: 'outline', className: 'border-green-500 text-green-500' },
      'limited': { variant: 'outline', className: 'border-yellow-500 text-yellow-500' },
      'unavailable': { variant: 'outline', className: 'border-red-500 text-red-500' },
      'degraded': { variant: 'outline', className: 'border-red-500 text-red-500' },
      'unknown': { variant: 'outline', className: 'border-gray-500 text-gray-500' }
    };
    
    return variants[status] || variants.unknown;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'limited':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'unavailable':
      case 'degraded':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  // Format service name for display
  const formatServiceName = (name: string) => {
    return name
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-xl">AI System Status</CardTitle>
          <CardDescription>Real-time monitoring of AI services</CardDescription>
        </div>
        <button 
          onClick={handleRefresh}
          className="p-1 rounded hover:bg-muted"
          title="Refresh Status"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">
                System Health
              </p>
              <div className="flex items-center pt-1">
                {getStatusIcon(systemHealth.status)}
                <Badge 
                  {...getStatusBadge(systemHealth.status)}
                  className="ml-2"
                >
                  {systemHealth.status.toUpperCase()}
                </Badge>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {systemHealth.percentage}%
            </div>
          </div>
          <Progress 
            value={systemHealth.percentage} 
            className={`h-2 ${getStatusColor(systemHealth.status)}`} 
          />
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="queue">Queue</TabsTrigger>
            </TabsList>
            
            <TabsContent value="services" className="space-y-4 pt-3">
              {isStatusLoading ? (
                <div className="text-center py-4">Loading service status...</div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(aiStatus || {}).map(([service, data]: [string, any]) => (
                    <div key={service} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`h-3 w-3 rounded-full ${getStatusColor(data.status)}`} />
                        <span className="text-sm font-medium">{formatServiceName(service)}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-xs text-muted-foreground">
                          Usage: {data.usage.toFixed(0)}%
                        </span>
                        <Badge {...getStatusBadge(data.status)}>
                          {data.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="queue" className="space-y-4 pt-3">
              {isQueueLoading ? (
                <div className="text-center py-4">Loading queue status...</div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <div>Active Requests</div>
                    <div>{queueStatus?.activeRequests || 0}</div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <div>Queued Requests</div>
                    <div>{queueStatus?.queuedRequests || 0}</div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <div>Avg. Response Time</div>
                    <div>{queueStatus?.avgResponseTime 
                      ? `${Math.round(queueStatus.avgResponseTime)}ms` 
                      : '-'}</div>
                  </div>
                  
                  {queueStatus?.serviceQueues && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Queue by Service</p>
                      {Object.entries(queueStatus.serviceQueues).map(([service, count]: [string, any]) => (
                        <div key={service} className="flex justify-between text-xs text-muted-foreground py-1">
                          <div>{formatServiceName(service)}</div>
                          <div>{count}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}