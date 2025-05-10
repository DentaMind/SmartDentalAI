import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { AlertCircle, Award, Calendar, Download, TrendingUp, UserCheck } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface BonusAchievement {
  id: number;
  goalId: number;
  userId: number;
  userName: string;
  userRole: string;
  amount: number;
  achievedAt: string;
  goalName: string;
  targetAmount: number;
  actualAmount: number;
  isPaid: boolean;
  paidAt: string | null;
  timeframe: string;
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

const BonusAchievements: React.FC = () => {
  const [dateRange, setDateRange] = React.useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth() - 3),
    to: new Date(),
  });
  
  const [filterOptions, setFilterOptions] = React.useState({
    timeframe: 'all',
    isPaid: 'all',
    userId: 'all',
  });
  
  // Get achievements within date range
  const achievementsQuery = useQuery({
    queryKey: ['/api/bonus/achievements', dateRange, filterOptions],
    queryFn: async () => {
      if (!dateRange.from || !dateRange.to) return [];
      
      const params = new URLSearchParams({
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
        timeframe: filterOptions.timeframe,
        isPaid: filterOptions.isPaid,
        userId: filterOptions.userId,
      });
      
      return apiRequest(`/api/bonus/achievements?${params.toString()}`);
    },
    enabled: !!(dateRange.from && dateRange.to)
  });
  
  // Get users for filtering
  const usersQuery = useQuery({
    queryKey: ['/api/users'],
    queryFn: () => apiRequest('/api/users')
  });
  
  // Format amount as currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100); // Assuming amount is in cents
  };
  
  // Calculate total bonuses in the current view
  const totalBonuses = React.useMemo(() => {
    if (!achievementsQuery.data) return 0;
    
    return achievementsQuery.data.reduce((total: number, achievement: BonusAchievement) => {
      return total + achievement.amount;
    }, 0);
  }, [achievementsQuery.data]);
  
  // Calculate unpaid bonuses in the current view
  const unpaidBonuses = React.useMemo(() => {
    if (!achievementsQuery.data) return 0;
    
    return achievementsQuery.data
      .filter((achievement: BonusAchievement) => !achievement.isPaid)
      .reduce((total: number, achievement: BonusAchievement) => {
        return total + achievement.amount;
      }, 0);
  }, [achievementsQuery.data]);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Bonus Achievements</h2>
          <p className="text-muted-foreground">
            Track all earned bonuses and their payment status
          </p>
        </div>
        <DatePickerWithRange className="w-full md:w-[300px]" value={dateRange} onChange={setDateRange} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Total Achievements</CardTitle>
            <CardDescription>
              Bonuses earned in selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            {achievementsQuery.isLoading ? (
              <div className="animate-pulse h-10 bg-slate-200 rounded"></div>
            ) : (
              <div className="text-center">
                <div className="font-bold text-3xl mb-2">
                  {achievementsQuery.data ? achievementsQuery.data.length : 0}
                </div>
                <div className="flex items-center justify-center text-sm text-muted-foreground">
                  <Award className="w-4 h-4 mr-1" />
                  <span>Goals achieved</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Total Bonus Amount</CardTitle>
            <CardDescription>
              Value of all bonuses earned
            </CardDescription>
          </CardHeader>
          <CardContent>
            {achievementsQuery.isLoading ? (
              <div className="animate-pulse h-10 bg-slate-200 rounded"></div>
            ) : (
              <div className="text-center">
                <div className="font-bold text-3xl mb-2 text-green-600">
                  {formatCurrency(totalBonuses)}
                </div>
                <div className="flex items-center justify-center text-sm text-muted-foreground">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span>Total value</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Unpaid Bonuses</CardTitle>
            <CardDescription>
              Bonuses pending payment
            </CardDescription>
          </CardHeader>
          <CardContent>
            {achievementsQuery.isLoading ? (
              <div className="animate-pulse h-10 bg-slate-200 rounded"></div>
            ) : (
              <div className="text-center">
                <div className="font-bold text-3xl mb-2">
                  {formatCurrency(unpaidBonuses)}
                </div>
                <div className="flex items-center justify-center text-sm text-muted-foreground">
                  <UserCheck className="w-4 h-4 mr-1" />
                  <span>Awaiting payment</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <CardTitle>Achievements History</CardTitle>
              <CardDescription>
                Complete record of all bonus milestones achieved
              </CardDescription>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select
                value={filterOptions.timeframe}
                onValueChange={(value) => setFilterOptions({ ...filterOptions, timeframe: value })}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Timeframes</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={filterOptions.isPaid}
                onValueChange={(value) => setFilterOptions({ ...filterOptions, isPaid: value })}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Payment Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="true">Paid</SelectItem>
                  <SelectItem value="false">Unpaid</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={filterOptions.userId}
                onValueChange={(value) => setFilterOptions({ ...filterOptions, userId: value })}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Staff Member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>
                  {usersQuery.data && usersQuery.data.map((user: any) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.firstName} {user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {achievementsQuery.isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-slate-200 rounded w-full"></div>
              <div className="h-20 bg-slate-200 rounded w-full"></div>
              <div className="h-20 bg-slate-200 rounded w-full"></div>
            </div>
          ) : achievementsQuery.error ? (
            <div className="flex py-12 justify-center items-center text-destructive">
              <AlertCircle className="mr-2 h-5 w-5" />
              Error loading achievements
            </div>
          ) : achievementsQuery.data && achievementsQuery.data.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date Achieved</TableHead>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Goal</TableHead>
                    <TableHead className="text-right">Target</TableHead>
                    <TableHead className="text-right">Actual</TableHead>
                    <TableHead className="text-right">Bonus Amount</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {achievementsQuery.data.map((achievement: BonusAchievement) => (
                    <TableRow key={achievement.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          {formatDate(achievement.achievedAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{achievement.userName}</div>
                          <div className="text-xs text-muted-foreground">{achievement.userRole}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{achievement.goalName}</div>
                          <div className="text-xs text-muted-foreground capitalize">{achievement.timeframe}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(achievement.targetAmount)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(achievement.actualAmount)}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(achievement.amount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={achievement.isPaid ? "default" : "outline"}>
                          {achievement.isPaid ? "Paid" : "Pending"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <Award className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
              <h3 className="text-lg font-medium">No achievements found</h3>
              <p className="text-muted-foreground mt-2">
                No bonus achievements match your current filters.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BonusAchievements;