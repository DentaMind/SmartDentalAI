import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, TrendingUp, CalendarRange } from 'lucide-react';

interface ProductionData {
  totalProduction: number;
  startDate: string;
  endDate: string;
  timeframe: string;
  staffCount: number;
  averagePerStaff: number;
}

interface BonusGoal {
  id: number;
  name: string;
  description: string;
  targetAmount: number;
  bonusAmount: number;
  isActive: boolean;
  goalType: 'practice' | 'role' | 'individual';
  timeframe: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
}

interface ProductionProgressProps {
  productionData: ProductionData | null;
  goals: BonusGoal[] | null;
  onCheckEligibility: (goalId: number) => void;
  isLoading: boolean;
}

const ProductionProgress: React.FC<ProductionProgressProps> = ({
  productionData,
  goals,
  onCheckEligibility,
  isLoading
}) => {
  // Format amount as currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100); // Assuming amount is in cents
  };
  
  // Calculate progress percentage
  const calculateProgress = (current: number, target: number) => {
    return Math.min(Math.round((current / target) * 100), 100);
  };
  
  // Get the appropriate badge color based on progress
  const getProgressBadge = (progress: number) => {
    if (progress >= 100) {
      return (
        <Badge className="bg-green-500 hover:bg-green-600">
          <CheckCircle className="w-3 h-3 mr-1" />
          Achieved
        </Badge>
      );
    } else if (progress >= 75) {
      return (
        <Badge className="bg-amber-500 hover:bg-amber-600">
          <TrendingUp className="w-3 h-3 mr-1" />
          Almost There
        </Badge>
      );
    } else if (progress >= 50) {
      return (
        <Badge variant="outline" className="border-amber-500 text-amber-500">
          <TrendingUp className="w-3 h-3 mr-1" />
          In Progress
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="border-slate-500 text-slate-500">
          <CalendarRange className="w-3 h-3 mr-1" />
          Just Started
        </Badge>
      );
    }
  };
  
  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto"></div>
          <div className="h-16 bg-slate-200 rounded w-5/6 mx-auto"></div>
          <div className="h-16 bg-slate-200 rounded w-5/6 mx-auto"></div>
          <div className="h-16 bg-slate-200 rounded w-5/6 mx-auto"></div>
        </div>
      </div>
    );
  }
  
  if (!productionData || !goals || goals.length === 0) {
    return (
      <div className="py-12 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No data available</h3>
        <p className="text-muted-foreground">
          {!productionData ? "Production data not available for the selected period." : 
           !goals || goals.length === 0 ? "No bonus goals have been set up yet." : 
           "Something went wrong while loading data."}
        </p>
      </div>
    );
  }
  
  // Filter to only active goals
  const activeGoals = goals.filter(goal => goal.isActive);
  
  return (
    <div className="space-y-6">
      {activeGoals.length > 0 ? (
        activeGoals.map(goal => {
          const progress = calculateProgress(productionData.totalProduction, goal.targetAmount);
          return (
            <div key={goal.id} className="border rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-lg">{goal.name}</h3>
                  <p className="text-sm text-muted-foreground">{goal.description}</p>
                </div>
                {getProgressBadge(progress)}
              </div>
              
              <div className="space-y-2 my-4">
                <div className="flex justify-between text-sm">
                  <span>Current: {formatCurrency(productionData.totalProduction)}</span>
                  <span>Target: {formatCurrency(goal.targetAmount)}</span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{progress}% Complete</span>
                  {progress < 100 && (
                    <span>
                      {formatCurrency(goal.targetAmount - productionData.totalProduction)} remaining
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm">
                  <span className="font-medium">Bonus Amount: </span>
                  <span className="text-green-600 font-bold">{formatCurrency(goal.bonusAmount)}</span>
                </div>
                <Button 
                  variant={progress >= 100 ? "default" : "outline"} 
                  size="sm"
                  onClick={() => onCheckEligibility(goal.id)}
                >
                  {progress >= 100 ? "Claim Bonus" : "Check Eligibility"}
                </Button>
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center py-8">
          <h3 className="text-lg font-medium mb-2">No active goals</h3>
          <p className="text-muted-foreground">
            There are no active bonus goals for this period.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductionProgress;