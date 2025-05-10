import React from 'react';
import { useLocation } from 'wouter';
import { TreatmentPlan } from '@shared/schema';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Calendar,
  ClipboardList,
  DollarSign,
  File,
  FileText,
  MoreHorizontal,
  PenTool,
  UserCheck,
  ChevronRight
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface TreatmentPlanCardProps {
  plan: TreatmentPlan;
  onViewDetails?: (plan: TreatmentPlan) => void;
  onApprove?: (plan: TreatmentPlan) => void;
  onSchedule?: (plan: TreatmentPlan) => void;
  onSign?: (plan: TreatmentPlan) => void;
  compact?: boolean;
}

export function TreatmentPlanCard({
  plan,
  onViewDetails,
  onApprove,
  onSchedule,
  onSign,
  compact = false
}: TreatmentPlanCardProps) {
  const [_, setLocation] = useLocation();
  
  // Extract procedures
  const procedures = Array.isArray(plan.procedures) 
    ? plan.procedures 
    : typeof plan.procedures === 'object' 
        ? Object.values(plan.procedures) 
        : [];
  
  // Calculate completed procedures
  const completedProcedures = procedures.filter((proc: any) => proc.completed).length;
  const totalProcedures = procedures.length;
  const progressPercentage = totalProcedures > 0 ? (completedProcedures / totalProcedures) * 100 : 0;
  
  // Calculate financial summary
  const totalCost = procedures.reduce((sum: number, proc: any) => sum + (proc.fee || 0), 0);
  const totalInsurance = procedures.reduce((sum: number, proc: any) => sum + (proc.insuranceCoverage || 0), 0);
  const totalPatient = procedures.reduce((sum: number, proc: any) => sum + (proc.patientResponsibility || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'proposed':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Proposed</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Accepted</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const handleCardClick = () => {
    if (onViewDetails) {
      onViewDetails(plan);
    } else {
      setLocation(`/treatment-plans/${plan.id}`);
    }
  };
  
  // If compact, show simpler view
  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">
              {plan.planName || `Treatment Plan #${plan.id}`}
            </CardTitle>
            {getStatusBadge(plan.status)}
          </div>
          <CardDescription className="line-clamp-1">{plan.diagnosis}</CardDescription>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="flex justify-between mb-2 text-sm">
            <span>Progress: {completedProcedures}/{totalProcedures} procedures</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          
          <div className="flex justify-between mt-3 text-sm text-muted-foreground">
            <span>Created: {new Date(plan.createdAt).toLocaleDateString()}</span>
            <span>${totalCost.toFixed(2)}</span>
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <Button variant="ghost" size="sm" className="ml-auto" onClick={handleCardClick}>
            View Details <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  // Full card view
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>
              {plan.planName || `Treatment Plan #${plan.id}`} 
              {plan.planType && (
                <Badge className="ml-2" variant="secondary">
                  {plan.planType.charAt(0).toUpperCase() + plan.planType.slice(1)}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-1">{plan.diagnosis}</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(plan.status)}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewDetails?.(plan)}>
                  <FileText className="mr-2 h-4 w-4" /> View Details
                </DropdownMenuItem>
                {plan.status === 'proposed' && (
                  <DropdownMenuItem onClick={() => onApprove?.(plan)}>
                    <UserCheck className="mr-2 h-4 w-4" /> Approve Plan
                  </DropdownMenuItem>
                )}
                {plan.status === 'proposed' && !plan.signedByPatient && (
                  <DropdownMenuItem onClick={() => onSign?.(plan)}>
                    <PenTool className="mr-2 h-4 w-4" /> Sign Plan
                  </DropdownMenuItem>
                )}
                {plan.status === 'accepted' && (
                  <DropdownMenuItem onClick={() => onSchedule?.(plan)}>
                    <Calendar className="mr-2 h-4 w-4" /> Schedule Appointments
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => setLocation(`/treatment-plans/${plan.id}/print`)}>
                  <File className="mr-2 h-4 w-4" /> Print Plan
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Progress: {completedProcedures}/{totalProcedures} procedures</span>
            <span className="text-sm font-medium">{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-1">
            <span className="text-sm text-muted-foreground">Created</span>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
              <span>{new Date(plan.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="space-y-1">
            <span className="text-sm text-muted-foreground">Doctor</span>
            <div className="flex items-center">
              <UserCheck className="h-4 w-4 mr-1 text-muted-foreground" />
              <span>Dr. ID #{plan.doctorId}</span>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center">
            <ClipboardList className="h-4 w-4 mr-1" />
            Procedures Summary
          </h4>
          
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <span className="text-muted-foreground">Total Procedures:</span>
            <span>{totalProcedures}</span>
            
            <span className="text-muted-foreground">Completed:</span>
            <span>{completedProcedures}</span>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center">
            <DollarSign className="h-4 w-4 mr-1" />
            Financial Summary
          </h4>
          
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <span className="text-muted-foreground">Total Cost:</span>
            <span className="font-medium">${totalCost.toFixed(2)}</span>
            
            <span className="text-muted-foreground">Insurance:</span>
            <span>${totalInsurance.toFixed(2)}</span>
            
            <span className="text-muted-foreground">Patient Responsibility:</span>
            <span className="font-medium">${totalPatient.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => onViewDetails?.(plan)}>
          View Details
        </Button>
        
        {plan.status === 'proposed' && !plan.signedByPatient && (
          <Button onClick={() => onSign?.(plan)}>
            <PenTool className="mr-2 h-4 w-4" /> Sign & Approve
          </Button>
        )}
        
        {plan.status === 'accepted' && (
          <Button onClick={() => onSchedule?.(plan)}>
            <Calendar className="mr-2 h-4 w-4" /> Schedule Appointments
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}