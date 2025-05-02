import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { 
  Activity, AlertCircle, Brain, Check, Clock, Server, 
  BarChart, PieChart, LineChart, FileCheck, BookOpen, RotateCw 
} from 'lucide-react';
import { OwnerDashboard } from '../admin/OwnerDashboard';

interface AISystemDashboardProps {
  username: string;
  isOwner?: boolean;
}

const AISystemDashboard: React.FC<AISystemDashboardProps> = ({ username, isOwner = false }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [systemStatus, setSystemStatus] = useState<any>({
    aiSystem: 'online',
    database: 'online',
    trainingPipeline: 'online',
    lastModelVersion: '1.2.3',
    quality: {
      alertCount: 3,
      status: 'monitor',
      lastCheckTime: new Date().toISOString()
    }
  });

  // Only show the owner dashboard to Dr. Abdin
  const isOwnerAccount = isOwner || username === 'Dr.Abdin';

  useEffect(() => {
    // Load system status data
    fetchSystemStatus();
  }, []);

  const fetchSystemStatus = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, these would be actual API calls
      // Mock data for demonstration
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSystemStatus({
        aiSystem: 'online',
        database: 'online',
        trainingPipeline: 'online',
        lastModelVersion: '1.2.3',
        lastTrainingJob: {
          id: 'job-123',
          status: 'completed',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 2.9 * 24 * 60 * 60 * 1000).toISOString()
        },
        practiceAdaptations: {
          count: 15,
          lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOformat()
        },
        quality: {
          alertCount: 3,
          status: 'monitor',
          lastCheckTime: new Date().toISOString()
        }
      });
    } catch (err) {
      setError('Failed to load system status.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const runQualityCheck = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would call the QA API
      // Mock data for demonstration
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSystemStatus(prev => ({
        ...prev,
        quality: {
          alertCount: 2,
          status: 'monitor',
          lastCheckTime: new Date().toISOString()
        }
      }));
    } catch (err) {
      setError('Failed to run quality check.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">AI System Dashboard</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center mb-4">
          <AlertCircle className="mr-2" />
          <span>{error}</span>
        </div>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="adaptations">Practice Adaptations</TabsTrigger>
          <TabsTrigger value="quality">Quality Assurance</TabsTrigger>
          {isOwnerAccount && <TabsTrigger value="owner">Owner Dashboard</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <SystemStatusCard status={systemStatus} isLoading={isLoading} />
            <ModelInfoCard status={systemStatus} isLoading={isLoading} />
            <QualityStatusCard status={systemStatus} isLoading={isLoading} onRunCheck={runQualityCheck} />
          </div>
        </TabsContent>
        
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Model Performance</CardTitle>
              <CardDescription>Performance metrics for the current AI model</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border rounded-md p-4">
                <BarChart className="h-40 w-40 text-gray-400" />
                <div className="text-center">
                  <p>Performance charts would render here.</p>
                  <p className="text-sm text-gray-500">Statistics on accuracy, precision, recall, etc.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="training">
          <Card>
            <CardHeader>
              <CardTitle>AI Training</CardTitle>
              <CardDescription>Status of training jobs and model versions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Training Jobs</h3>
                  <Button variant="outline" size="sm">View All Jobs</Button>
                </div>
                <div className="border rounded-md p-4">
                  <div className="flex items-center mb-2">
                    <Check className="text-green-500 mr-2" />
                    <span className="font-medium">Latest Training Job: {systemStatus.lastModelVersion}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Completed 3 days ago • Processed 5,000 feedback items • Accuracy improved by 2.3%
                  </div>
                </div>
                <div className="flex justify-between mt-4">
                  <Button variant="secondary" size="sm">Schedule Training</Button>
                  <Button variant="primary" size="sm">Start Manual Training</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="adaptations">
          <Card>
            <CardHeader>
              <CardTitle>Practice Adaptations</CardTitle>
              <CardDescription>AI model adaptations for specific practices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <div className="border rounded-md p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">15 Practice Adaptations Active</span>
                    <span className="text-sm text-green-600">+2.1% Average Improvement</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Last update: 1 day ago
                  </div>
                </div>
                <div className="h-40 flex items-center justify-center border rounded-md">
                  <PieChart className="h-32 w-32 text-gray-400" />
                  <div className="text-center ml-4">
                    <p>Distribution chart would render here.</p>
                    <p className="text-sm text-gray-500">Practice adaptation stats</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">View All Practice Adaptations</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="quality">
          <Card>
            <CardHeader>
              <CardTitle>Quality Assurance</CardTitle>
              <CardDescription>System for monitoring diagnostic patterns and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <div className="border rounded-md p-4">
                  <div className="flex items-center mb-2">
                    <AlertCircle className={systemStatus.quality.status === 'healthy' ? 'text-green-500' : 'text-amber-500'} />
                    <span className="font-medium ml-2">
                      System Status: {systemStatus.quality.status === 'healthy' ? 'Healthy' : 'Needs Monitoring'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {systemStatus.quality.alertCount} active alerts • Last check: {new Date(systemStatus.quality.lastCheckTime).toLocaleString()}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="border rounded-md p-4">
                    <h4 className="font-medium mb-2">Recent Alerts</h4>
                    <ul className="text-sm space-y-2">
                      <li className="flex items-center text-amber-600">
                        <Activity className="h-4 w-4 mr-2" />
                        High rejection rate in periapical diagnoses
                      </li>
                      <li className="flex items-center text-amber-600">
                        <LineChart className="h-4 w-4 mr-2" />
                        Unusual pattern in caries detection
                      </li>
                    </ul>
                  </div>
                  <div className="border rounded-md p-4">
                    <h4 className="font-medium mb-2">Recommendations</h4>
                    <ul className="text-sm space-y-2">
                      <li className="flex items-center">
                        <RotateCw className="h-4 w-4 mr-2" />
                        Update model for periapical diagnoses
                      </li>
                      <li className="flex items-center">
                        <FileCheck className="h-4 w-4 mr-2" />
                        Review detection patterns
                      </li>
                    </ul>
                  </div>
                </div>
                <Button onClick={runQualityCheck} disabled={isLoading}>
                  {isLoading ? 'Running Check...' : 'Run Quality Check Now'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {isOwnerAccount && (
          <TabsContent value="owner">
            <OwnerDashboard />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

// Helper components
const SystemStatusCard = ({ status, isLoading }) => (
  <Card>
    <CardHeader>
      <CardTitle>System Status</CardTitle>
      <CardDescription>Current status of AI components</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Brain className="mr-2 h-4 w-4" />
            <span>AI System</span>
          </div>
          <div className="flex items-center">
            <div className={`h-2 w-2 rounded-full mr-2 ${status.aiSystem === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm">{status.aiSystem === 'online' ? 'Online' : 'Offline'}</span>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Server className="mr-2 h-4 w-4" />
            <span>Database</span>
          </div>
          <div className="flex items-center">
            <div className={`h-2 w-2 rounded-full mr-2 ${status.database === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm">{status.database === 'online' ? 'Online' : 'Offline'}</span>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Activity className="mr-2 h-4 w-4" />
            <span>Training Pipeline</span>
          </div>
          <div className="flex items-center">
            <div className={`h-2 w-2 rounded-full mr-2 ${status.trainingPipeline === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm">{status.trainingPipeline === 'online' ? 'Online' : 'Offline'}</span>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const ModelInfoCard = ({ status, isLoading }) => (
  <Card>
    <CardHeader>
      <CardTitle>Model Information</CardTitle>
      <CardDescription>Current AI model details</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span>Current Version</span>
          <span className="font-medium">{status.lastModelVersion}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Last Updated</span>
          <span>3 days ago</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Accuracy</span>
          <span>94.2%</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Total Diagnoses</span>
          <span>125,450</span>
        </div>
      </div>
    </CardContent>
  </Card>
);

const QualityStatusCard = ({ status, isLoading, onRunCheck }) => (
  <Card>
    <CardHeader>
      <CardTitle>Quality Metrics</CardTitle>
      <CardDescription>AI diagnostic quality status</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span>Status</span>
            <span className={status.quality.status === 'healthy' ? 'text-green-600' : 'text-amber-600'}>
              {status.quality.status === 'healthy' ? 'Healthy' : 'Needs Monitoring'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>Active Alerts</span>
            <span>{status.quality.alertCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Last Check</span>
            <span>{new Date(status.quality.lastCheckTime).toLocaleString()}</span>
          </div>
        </div>
        <Button onClick={onRunCheck} disabled={isLoading} variant="outline" size="sm" className="w-full">
          {isLoading ? 'Checking...' : 'Run Quality Check'}
        </Button>
      </div>
    </CardContent>
  </Card>
);

export default AISystemDashboard; 