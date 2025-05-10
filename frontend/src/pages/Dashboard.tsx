import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useAIModel } from '../contexts/AIModelContext';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Button } from '../components/ui/button';
import { 
  Brain, 
  Calendar, 
  Users, 
  Activity, 
  Clock, 
  ArrowRight,
  BarChart 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { globalModel, clinicModel, isLoading } = useAIModel();
  
  // Mock data for dashboard stats
  const stats = {
    patients: {
      total: 847,
      today: 12,
      pending: 3
    },
    appointments: {
      today: 18,
      completed: 10,
      upcoming: 8
    },
    diagnoses: {
      today: 16,
      pending: 5
    }
  };
  
  return (
    <div className="container py-6 max-w-7xl">
      <div className="flex flex-col space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome to DentaMind. Here's an overview of your practice and AI insights.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <Users className="mr-2 h-5 w-5 text-primary" />
                Patients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.patients.total}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {stats.patients.today} new today
              </div>
              <div className="flex mt-4 justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {stats.patients.pending} pending records
                </span>
                <Link to="/patients">
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <Calendar className="mr-2 h-5 w-5 text-primary" />
                Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.appointments.today}</div>
              <div className="text-sm text-muted-foreground mt-1">
                Today's appointments
              </div>
              <div className="flex mt-4 justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {stats.appointments.completed} completed, {stats.appointments.upcoming} upcoming
                </span>
                <Link to="/schedule">
                  <Button variant="ghost" size="sm">
                    Schedule
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <Activity className="mr-2 h-5 w-5 text-primary" />
                AI Diagnoses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.diagnoses.today}</div>
              <div className="text-sm text-muted-foreground mt-1">
                Diagnoses today
              </div>
              <div className="flex mt-4 justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {stats.diagnoses.pending} pending review
                </span>
                <Link to="/ai-diagnostics">
                  <Button variant="ghost" size="sm">
                    Review
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="mr-2 h-5 w-5 text-primary" />
              AI Model Insights
            </CardTitle>
            <CardDescription>
              Current performance of your diagnostic AI models
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Clock className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Global Model</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Version:</span>
                        <Badge>{globalModel?.version || 'Unknown'}</Badge>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-muted-foreground">Accuracy:</span>
                          <span className="text-sm font-medium">
                            {globalModel ? (globalModel.accuracy * 100).toFixed(1) + '%' : 'N/A'}
                          </span>
                        </div>
                        <Progress
                          value={globalModel ? globalModel.accuracy * 100 : 0}
                          className="h-2"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Training Samples:</span>
                        <span className="text-sm font-medium">
                          {globalModel?.sampleSize?.toLocaleString() || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Last Updated:</span>
                        <span className="text-sm">
                          {globalModel?.lastUpdated 
                            ? new Date(globalModel.lastUpdated).toLocaleDateString() 
                            : 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Your Clinic's Model</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Version:</span>
                        <Badge variant="secondary">{clinicModel?.version || 'Not available'}</Badge>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-muted-foreground">Accuracy:</span>
                          <span className="text-sm font-medium">
                            {clinicModel ? (clinicModel.accuracy * 100).toFixed(1) + '%' : 'N/A'}
                          </span>
                        </div>
                        <Progress
                          value={clinicModel ? clinicModel.accuracy * 100 : 0}
                          className="h-2"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Your Samples:</span>
                        <span className="text-sm font-medium">
                          {clinicModel?.sampleSize?.toLocaleString() || '0'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Last Updated:</span>
                        <span className="text-sm">
                          {clinicModel?.lastUpdated 
                            ? new Date(clinicModel.lastUpdated).toLocaleDateString() 
                            : 'Never'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="text-md font-medium">Improve AI Performance</h3>
                    <p className="text-sm text-muted-foreground">
                      Help train the AI by providing feedback on diagnostic findings.
                    </p>
                  </div>
                  <Link to="/ai-training">
                    <Button>
                      <BarChart className="mr-2 h-4 w-4" />
                      Go to AI Training
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard; 