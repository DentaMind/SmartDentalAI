import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { CertificationBadge } from '@/components/training/certification-badge';
import { CheckCircle, AlertCircle, Clock, XCircle, ChevronRight, HelpCircle, Award, Users } from 'lucide-react';
import { CertificationTypeEnum } from 'shared/schema';

const TrainingDashboardPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('my-training');
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  // Fetch user's certifications
  const { data: myCertifications, isLoading: loadingMyCerts } = useQuery({
    queryKey: ['/api/certifications/my'],
    queryFn: () => apiRequest('/api/certifications/my'),
    enabled: !!user,
  });

  // Fetch all training modules (for admin view)
  const { data: allModules, isLoading: loadingModules } = useQuery({
    queryKey: ['/api/certifications/modules'],
    queryFn: () => apiRequest('/api/certifications/modules'),
    enabled: !!user && isAdmin,
  });

  // Calculate certification statistics
  const certStats = React.useMemo(() => {
    if (!myCertifications) return { completed: 0, inProgress: 0, expired: 0, notStarted: 0, total: 0 };
    
    const stats = {
      completed: myCertifications.filter(cert => cert.status === 'completed').length,
      inProgress: myCertifications.filter(cert => cert.status === 'in_progress').length,
      expired: myCertifications.filter(cert => cert.status === 'expired').length,
      notStarted: myCertifications.filter(cert => cert.status === 'not_started').length
    };
    
    return {
      ...stats,
      total: myCertifications.length
    };
  }, [myCertifications]);
  
  // Group certifications by type
  const certsByType = React.useMemo(() => {
    if (!myCertifications) return {};
    
    return myCertifications.reduce((acc, cert) => {
      const type = cert.module?.moduleType;
      if (!type) return acc;
      
      if (!acc[type]) {
        acc[type] = [];
      }
      
      acc[type].push(cert);
      return acc;
    }, {} as Record<string, typeof myCertifications>);
  }, [myCertifications]);

  // Redirect to specific training module
  const startTraining = (moduleId: number) => {
    navigate(`/assistant/module/${moduleId}`);
  };
  
  // Function to assign modules to a user (admin only)
  const assignModuleToUser = async (userId: number, moduleId: number) => {
    if (!isAdmin) return;
    
    try {
      await apiRequest(`/api/certifications/users/${userId}`, {
        method: 'POST',
        data: {
          moduleId,
          status: 'not_started'
        }
      });
      
      toast({
        title: 'Module Assigned',
        description: 'Training module has been assigned to user',
      });
    } catch (error) {
      console.error('Error assigning module:', error);
      toast({
        title: 'Assignment Failed',
        description: 'Failed to assign training module',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="container px-4 py-6 mx-auto max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">Training & Certifications</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Overall Stats Card */}
        <Card className="md:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle>Certification Status</CardTitle>
            <CardDescription>Your current training and certification progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-green-50 rounded-lg p-4 flex flex-col items-center">
                <CheckCircle className="h-8 w-8 mb-2 text-green-500" />
                <span className="text-2xl font-bold">{certStats.completed}</span>
                <span className="text-sm text-gray-600">Completed</span>
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-4 flex flex-col items-center">
                <Clock className="h-8 w-8 mb-2 text-yellow-500" />
                <span className="text-2xl font-bold">{certStats.inProgress}</span>
                <span className="text-sm text-gray-600">In Progress</span>
              </div>
              
              <div className="bg-red-50 rounded-lg p-4 flex flex-col items-center">
                <AlertCircle className="h-8 w-8 mb-2 text-red-500" />
                <span className="text-2xl font-bold">{certStats.expired}</span>
                <span className="text-sm text-gray-600">Expired</span>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 flex flex-col items-center">
                <XCircle className="h-8 w-8 mb-2 text-gray-500" />
                <span className="text-2xl font-bold">{certStats.notStarted}</span>
                <span className="text-sm text-gray-600">Not Started</span>
              </div>
            </div>
            
            <div className="mt-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm font-medium">
                  {certStats.total > 0 
                    ? Math.round((certStats.completed / certStats.total) * 100) 
                    : 0}%
                </span>
              </div>
              <Progress 
                value={certStats.total > 0 ? (certStats.completed / certStats.total) * 100 : 0} 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="my-training" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-auto">
          <TabsTrigger value="my-training" className="flex items-center gap-2">
            <Award size={16} />
            <span>My Training</span>
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Users size={16} />
              <span>Training Administration</span>
            </TabsTrigger>
          )}
        </TabsList>
        
        {/* My Training Tab */}
        <TabsContent value="my-training" className="mt-6">
          {loadingMyCerts ? (
            <div className="text-center py-10">
              <div className="inline-block p-2 rounded-full bg-gray-100 mb-4">
                <Clock className="h-8 w-8 text-gray-500 animate-pulse" />
              </div>
              <p>Loading your certifications...</p>
            </div>
          ) : myCertifications && myCertifications.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(certsByType).map(([type, certs]) => (
                <div key={type} className="space-y-4">
                  <h3 className="text-lg font-semibold capitalize flex items-center gap-2">
                    <CertificationBadge 
                      certType={type as CertificationTypeEnum}
                      status="completed"
                      showLabel={false}
                    />
                    {type.replace('_', ' ')} Certifications
                  </h3>
                  
                  {certs.map((cert) => (
                    <Card key={cert.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base">{cert.module.title}</CardTitle>
                          <CertificationBadge 
                            certType={cert.module.moduleType as CertificationTypeEnum}
                            status={cert.status}
                            progress={cert.progress}
                            expiresAt={cert.expiresAt}
                          />
                        </div>
                        <CardDescription className="line-clamp-2">
                          {cert.module.description || 'No description available'}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="pb-2">
                        {cert.status === 'in_progress' && (
                          <div className="mb-4">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span>{cert.progress || 0}%</span>
                            </div>
                            <Progress value={cert.progress || 0} className="h-2" />
                          </div>
                        )}
                        
                        {cert.status === 'completed' && cert.expiresAt && (
                          <div className="text-sm">
                            <span className="font-medium">Expires:</span>{' '}
                            {new Date(cert.expiresAt).toLocaleDateString()}
                          </div>
                        )}
                        
                        {cert.status === 'expired' && (
                          <div className="text-sm text-red-500 font-medium">
                            Certification has expired. Please renew.
                          </div>
                        )}
                      </CardContent>
                      
                      <CardFooter className="pt-2">
                        <Button 
                          onClick={() => startTraining(cert.moduleId)}
                          className="w-full"
                          variant={cert.status === 'expired' ? 'destructive' : 'default'}
                        >
                          {cert.status === 'not_started' ? 'Start Training' : 
                           cert.status === 'in_progress' ? 'Continue Training' : 
                           cert.status === 'expired' ? 'Renew Certification' : 
                           'View Certification'}
                           <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded-lg">
              <div className="inline-block p-2 rounded-full bg-gray-100 mb-4">
                <HelpCircle className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">No Certifications Found</h3>
              <p className="text-gray-500 mb-4">
                You don't have any certifications assigned yet. 
                {isAdmin ? ' Assign training modules from the admin tab.' : ''}
              </p>
            </div>
          )}
        </TabsContent>
        
        {/* Admin Tab */}
        {isAdmin && (
          <TabsContent value="admin" className="mt-6">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Training Module Management</CardTitle>
                  <CardDescription>
                    Manage training modules and user certifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-end mb-4">
                    <Button 
                      onClick={() => navigate('/assistant/module/new')}
                      className="flex items-center gap-2"
                    >
                      <span>Create New Module</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {loadingModules ? (
                    <div className="text-center py-4">
                      <p>Loading training modules...</p>
                    </div>
                  ) : allModules && allModules.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-2 text-left">Module</th>
                            <th className="px-4 py-2 text-left">Type</th>
                            <th className="px-4 py-2 text-left">Duration</th>
                            <th className="px-4 py-2 text-center">Required For</th>
                            <th className="px-4 py-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allModules.map((module) => (
                            <tr key={module.id} className="border-b hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div className="font-medium">{module.title}</div>
                                <div className="text-sm text-gray-500 line-clamp-1">
                                  {module.description || 'No description'}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <CertificationBadge 
                                  certType={module.moduleType as CertificationTypeEnum}
                                  status="completed"
                                />
                              </td>
                              <td className="px-4 py-3">
                                {module.estimatedDuration ? `${module.estimatedDuration} min` : 'Not set'}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {module.requiredRoles && Array.isArray(module.requiredRoles) ? (
                                  <div className="flex flex-wrap gap-1 justify-center">
                                    {(module.requiredRoles as string[]).map((role) => (
                                      <Badge key={role} variant="outline" className="capitalize">
                                        {role}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-gray-500">All roles</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => navigate(`/assistant/module/${module.id}/edit`)}
                                  >
                                    Edit
                                  </Button>
                                  <Button 
                                    variant="default" 
                                    size="sm"
                                    onClick={() => navigate(`/assistant/module/${module.id}`)}
                                  >
                                    View
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">No training modules found</p>
                      <Button 
                        onClick={() => navigate('/assistant/module/new')}
                        className="mt-4"
                      >
                        Create Your First Module
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Bulk Training Assignment</CardTitle>
                  <CardDescription>
                    Assign training modules to users based on their roles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button onClick={() => navigate('/assistant/bulk-assign')}>
                      Manage Training Assignments
                    </Button>
                    <p className="text-sm text-gray-500">
                      Bulk assign required training modules to staff members based on their roles
                      for new hire onboarding and regulatory compliance.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default TrainingDashboardPage;