import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { format } from 'date-fns';
import { CalendarIcon, CheckCircle, Award, TrendingUp, DollarSign, Users, Bell } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import GoalManagement from './goal-management';
import ProductionProgress from './production-progress';
import BonusAchievements from './bonus-achievements';
import BonusNotifications from './bonus-notifications';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

const BonusSystemDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Get production totals for the selected timeframe
  const productionQuery = useQuery({
    queryKey: ['/api/bonus/production-totals', dateRange],
    queryFn: async () => {
      if (!dateRange.from || !dateRange.to) return null;
      
      const params = new URLSearchParams({
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
        timeframe: 'custom'
      });
      
      return apiRequest(`/api/bonus/production-totals?${params.toString()}`);
    },
    enabled: !!(dateRange.from && dateRange.to)
  });
  
  // Get all bonus goals
  const goalsQuery = useQuery({
    queryKey: ['/api/bonus/goals'],
    queryFn: () => apiRequest('/api/bonus/goals')
  });
  
  // Get all user's achievements
  const achievementsQuery = useQuery({
    queryKey: ['/api/bonus/achievements'],
    queryFn: () => apiRequest('/api/bonus/achievements')
  });
  
  // Get notifications for the current user
  const notificationsQuery = useQuery({
    queryKey: ['/api/bonus/notifications/user'],
    queryFn: async () => {
      // We'll need to get the current user's ID
      // This is a placeholder - replace with your actual user ID
      const userId = 1; // Replace with actual code to get current user ID
      return apiRequest(`/api/bonus/notifications/user/${userId}`);
    }
  });
  
  // Check eligibility for a bonus
  const checkEligibilityMutation = useMutation({
    mutationFn: (data: { goalId: number, startDate: string, endDate: string }) => {
      return apiRequest('/api/bonus/check-eligibility', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: (data) => {
      // Show success notification
      toast({
        title: data.achieved ? "Goal achieved!" : "Goal not yet achieved",
        description: data.achieved 
          ? `You've reached the production goal! Bonus amount: $${data.bonusAmount/100}` 
          : `You're $${data.shortfall/100} away from reaching this goal.`,
        variant: data.achieved ? "default" : "destructive",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/bonus/achievements'] });
    },
    onError: (error) => {
      toast({
        title: "Error checking eligibility",
        description: "There was an error checking your bonus eligibility.",
        variant: "destructive",
      });
    }
  });
  
  // Handle checking bonus eligibility
  const handleCheckEligibility = (goalId: number) => {
    if (!dateRange.from || !dateRange.to) {
      toast({
        title: "Date range required",
        description: "Please select a valid date range first.",
        variant: "destructive",
      });
      return;
    }
    
    setIsCheckingEligibility(true);
    setSelectedGoalId(goalId);
    
    checkEligibilityMutation.mutate({
      goalId,
      startDate: dateRange.from.toISOString(),
      endDate: dateRange.to.toISOString()
    });
  };
  
  // Format amount as currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100); // Assuming amount is in cents
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Production Bonus System</h1>
          <p className="text-muted-foreground">
            Track office production, set goals, and earn bonuses
          </p>
        </div>
        <DatePickerWithRange className="w-[300px]" value={dateRange} onChange={setDateRange} />
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="goals">Goal Management</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="notifications">
            Notifications
            {notificationsQuery.data && notificationsQuery.data.filter((n: any) => !n.isRead).length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {notificationsQuery.data.filter((n: any) => !n.isRead).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Current Production Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Current Production</CardTitle>
                <CardDescription>
                  {dateRange.from && dateRange.to ? (
                    <div className="flex items-center text-xs">
                      <CalendarIcon className="mr-1 h-3 w-3" />
                      <span>
                        {format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}
                      </span>
                    </div>
                  ) : (
                    "Select a date range"
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {productionQuery.isLoading ? (
                  <div className="flex justify-center py-6">Loading...</div>
                ) : productionQuery.error ? (
                  <div className="text-destructive">Error loading production data</div>
                ) : productionQuery.data ? (
                  <div className="text-center">
                    <div className="font-bold text-3xl mb-2">
                      {formatCurrency(productionQuery.data.totalProduction)}
                    </div>
                    <div className="flex items-center justify-center text-sm text-muted-foreground">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      <span>Office Production</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">No data available</div>
                )}
              </CardContent>
            </Card>
            
            {/* Active Goals Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Active Goals</CardTitle>
                <CardDescription>Current production targets</CardDescription>
              </CardHeader>
              <CardContent>
                {goalsQuery.isLoading ? (
                  <div className="flex justify-center py-6">Loading...</div>
                ) : goalsQuery.error ? (
                  <div className="text-destructive">Error loading goals</div>
                ) : goalsQuery.data && goalsQuery.data.length > 0 ? (
                  <div className="space-y-4">
                    <div className="font-bold text-3xl text-center mb-2">
                      {goalsQuery.data.filter((g: any) => g.isActive).length}
                    </div>
                    <div className="flex items-center justify-center text-sm text-muted-foreground">
                      <Award className="w-4 h-4 mr-1" />
                      <span>Active goals</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">No active goals</div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => setActiveTab('goals')}>
                  Manage Goals
                </Button>
              </CardFooter>
            </Card>
            
            {/* Achievements Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Achievements</CardTitle>
                <CardDescription>Bonuses earned</CardDescription>
              </CardHeader>
              <CardContent>
                {achievementsQuery.isLoading ? (
                  <div className="flex justify-center py-6">Loading...</div>
                ) : achievementsQuery.error ? (
                  <div className="text-destructive">Error loading achievements</div>
                ) : achievementsQuery.data && achievementsQuery.data.length > 0 ? (
                  <div className="space-y-4">
                    <div className="font-bold text-3xl text-center mb-2">
                      {achievementsQuery.data.length}
                    </div>
                    <div className="flex items-center justify-center text-sm text-muted-foreground">
                      <DollarSign className="w-4 h-4 mr-1" />
                      <span>Bonuses earned</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">No achievements yet</div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => setActiveTab('achievements')}>
                  View Achievements
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          {/* Production Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Production Progress</CardTitle>
              <CardDescription>Track progress toward bonus goals</CardDescription>
            </CardHeader>
            <CardContent>
              <ProductionProgress 
                productionData={productionQuery.data} 
                goals={goalsQuery.data} 
                onCheckEligibility={handleCheckEligibility}
                isLoading={productionQuery.isLoading || goalsQuery.isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="goals">
          <GoalManagement />
        </TabsContent>
        
        <TabsContent value="achievements">
          <BonusAchievements />
        </TabsContent>
        
        <TabsContent value="notifications">
          <BonusNotifications />
        </TabsContent>
      </Tabs>
      
      {/* Check Eligibility Dialog */}
      <Dialog open={isCheckingEligibility} onOpenChange={setIsCheckingEligibility}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Checking Bonus Eligibility</DialogTitle>
            <DialogDescription>
              Analyzing production data and goal criteria...
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {checkEligibilityMutation.isPending ? (
              <div className="space-y-4">
                <Progress value={65} className="w-full" />
                <p className="text-center text-sm">Checking if goal has been achieved</p>
              </div>
            ) : checkEligibilityMutation.isError ? (
              <div className="text-center text-destructive">
                <p>There was an error checking eligibility. Please try again.</p>
                <Button 
                  variant="outline" 
                  className="mt-4" 
                  onClick={() => setIsCheckingEligibility(false)}
                >
                  Close
                </Button>
              </div>
            ) : checkEligibilityMutation.data ? (
              <div className="space-y-4 text-center">
                {checkEligibilityMutation.data.achieved ? (
                  <div>
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                    <h3 className="text-xl font-bold">Goal Achieved!</h3>
                    <p>
                      Actual Production: {formatCurrency(checkEligibilityMutation.data.production)}
                    </p>
                    <p className="font-bold text-2xl mt-2">
                      Bonus Amount: {formatCurrency(checkEligibilityMutation.data.bonusAmount)}
                    </p>
                    <Button 
                      className="mt-4" 
                      onClick={() => setIsCheckingEligibility(false)}
                    >
                      Great!
                    </Button>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-xl font-bold">Goal Not Yet Achieved</h3>
                    <p>
                      Current Production: {formatCurrency(checkEligibilityMutation.data.production)}
                    </p>
                    <p>
                      Goal Amount: {formatCurrency(checkEligibilityMutation.data.targetAmount)}
                    </p>
                    <p className="font-bold mt-2">
                      Shortfall: {formatCurrency(checkEligibilityMutation.data.shortfall)}
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4" 
                      onClick={() => setIsCheckingEligibility(false)}
                    >
                      Close
                    </Button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BonusSystemDashboard;