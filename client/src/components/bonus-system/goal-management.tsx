import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Check, Pencil, Plus, Trash2, Award, Calendar, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface BonusGoal {
  id: number;
  name: string;
  description: string;
  targetAmount: number;
  bonusAmount: number;
  isActive: boolean;
  goalType: 'practice' | 'role' | 'individual';
  timeframe: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
  roleId?: number;
  userId?: number;
  createdAt: string;
  createdBy: number;
  tiers?: BonusGoalTier[];
}

interface BonusGoalTier {
  id: number;
  goalId: number;
  targetAmount: number;
  bonusAmount: number;
  description: string;
}

// Create Form schema
const goalSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  description: z.string().min(5, { message: "Description must be at least 5 characters" }),
  targetAmount: z.coerce.number().min(1000, { message: "Target amount must be at least $1,000" }),
  bonusAmount: z.coerce.number().min(1, { message: "Bonus amount must be at least $1" }),
  isActive: z.boolean().default(true),
  goalType: z.enum(['practice', 'role', 'individual']),
  timeframe: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'annual']),
  roleId: z.number().optional(),
  userId: z.number().optional(),
  hasTiers: z.boolean().default(false),
  tiers: z.array(
    z.object({
      targetAmount: z.coerce.number().min(1000, { message: "Target amount must be at least $1,000" }),
      bonusAmount: z.coerce.number().min(1, { message: "Bonus amount must be at least $1" }),
      description: z.string().min(3, { message: "Description is required" })
    })
  ).optional()
});

type GoalFormValues = z.infer<typeof goalSchema>;

const GoalManagement: React.FC = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<BonusGoal | null>(null);
  const [activeTab, setActiveTab] = useState('active');
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Form setup
  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: '',
      description: '',
      targetAmount: 100000, // $1,000.00
      bonusAmount: 10000, // $100.00
      isActive: true,
      goalType: 'practice',
      timeframe: 'monthly',
      hasTiers: false,
      tiers: [{
        targetAmount: 100000,
        bonusAmount: 10000,
        description: 'First tier'
      }]
    }
  });
  
  // Setup edit form
  const editForm = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: '',
      description: '',
      targetAmount: 0,
      bonusAmount: 0,
      isActive: true,
      goalType: 'practice',
      timeframe: 'monthly',
      hasTiers: false,
      tiers: []
    }
  });
  
  // Fetch all goals
  const goalsQuery = useQuery({
    queryKey: ['/api/bonus/goals'],
    queryFn: () => apiRequest('/api/bonus/goals')
  });
  
  // Fetch users for individual goals
  const usersQuery = useQuery({
    queryKey: ['/api/users'],
    queryFn: () => apiRequest('/api/users')
  });
  
  // Fetch roles for role-based goals
  const rolesQuery = useQuery({
    queryKey: ['/api/roles'],
    queryFn: () => apiRequest('/api/roles')
  });
  
  // Create new goal
  const createGoalMutation = useMutation({
    mutationFn: (data: GoalFormValues) => {
      // Convert dollar amounts to cents for storage
      const processedData = {
        ...data,
        targetAmount: Math.round(data.targetAmount),
        bonusAmount: Math.round(data.bonusAmount),
        tiers: data.hasTiers && data.tiers ? data.tiers.map(tier => ({
          ...tier,
          targetAmount: Math.round(tier.targetAmount),
          bonusAmount: Math.round(tier.bonusAmount)
        })) : undefined
      };
      
      return apiRequest('/api/bonus/goals', {
        method: 'POST',
        body: JSON.stringify(processedData),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Goal created",
        description: "The bonus goal has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bonus/goals'] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error creating goal",
        description: "There was an error creating the bonus goal.",
        variant: "destructive",
      });
    }
  });
  
  // Update existing goal
  const updateGoalMutation = useMutation({
    mutationFn: (data: GoalFormValues & { id: number }) => {
      const { id, ...rest } = data;
      
      // Convert dollar amounts to cents for storage
      const processedData = {
        ...rest,
        targetAmount: Math.round(rest.targetAmount),
        bonusAmount: Math.round(rest.bonusAmount),
        tiers: rest.hasTiers && rest.tiers ? rest.tiers.map(tier => ({
          ...tier,
          targetAmount: Math.round(tier.targetAmount),
          bonusAmount: Math.round(tier.bonusAmount)
        })) : undefined
      };
      
      return apiRequest(`/api/bonus/goals/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(processedData),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Goal updated",
        description: "The bonus goal has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bonus/goals'] });
      setIsEditDialogOpen(false);
      setSelectedGoal(null);
      editForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error updating goal",
        description: "There was an error updating the bonus goal.",
        variant: "destructive",
      });
    }
  });
  
  // Delete goal
  const deleteGoalMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest(`/api/bonus/goals/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: "Goal deleted",
        description: "The bonus goal has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bonus/goals'] });
      setIsDeleteDialogOpen(false);
      setSelectedGoal(null);
    },
    onError: (error) => {
      toast({
        title: "Error deleting goal",
        description: "There was an error deleting the bonus goal.",
        variant: "destructive",
      });
    }
  });
  
  // Handle form submission
  const onSubmit = (data: GoalFormValues) => {
    createGoalMutation.mutate(data);
  };
  
  // Handle edit form submission
  const onEditSubmit = (data: GoalFormValues) => {
    if (selectedGoal) {
      updateGoalMutation.mutate({ ...data, id: selectedGoal.id });
    }
  };
  
  // Handle edit button click
  const handleEdit = (goal: BonusGoal) => {
    setSelectedGoal(goal);
    
    // Populate edit form with goal data
    editForm.reset({
      name: goal.name,
      description: goal.description,
      targetAmount: goal.targetAmount,
      bonusAmount: goal.bonusAmount,
      isActive: goal.isActive,
      goalType: goal.goalType,
      timeframe: goal.timeframe,
      roleId: goal.roleId,
      userId: goal.userId,
      hasTiers: goal.tiers && goal.tiers.length > 0,
      tiers: goal.tiers || [{
        targetAmount: goal.targetAmount,
        bonusAmount: goal.bonusAmount,
        description: 'Base tier'
      }]
    });
    
    setIsEditDialogOpen(true);
  };
  
  // Handle delete button click
  const handleDelete = (goal: BonusGoal) => {
    setSelectedGoal(goal);
    setIsDeleteDialogOpen(true);
  };
  
  // Format amount as currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100); // Assuming amount is in cents
  };
  
  // Format timeframe for display
  const formatTimeframe = (timeframe: string) => {
    const timeframes: Record<string, string> = {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      annual: 'Annual'
    };
    
    return timeframes[timeframe] || timeframe;
  };
  
  // Format goal type for display
  const formatGoalType = (type: string) => {
    const types: Record<string, string> = {
      practice: 'Practice-wide',
      role: 'Role-based',
      individual: 'Individual'
    };
    
    return types[type] || type;
  };
  
  // Filter goals based on active tab
  const filteredGoals = React.useMemo(() => {
    if (!goalsQuery.data) return [];
    
    return goalsQuery.data.filter((goal: BonusGoal) => {
      if (activeTab === 'active') return goal.isActive;
      if (activeTab === 'inactive') return !goal.isActive;
      return true; // 'all' tab
    });
  }, [goalsQuery.data, activeTab]);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Bonus Goals</h2>
          <p className="text-muted-foreground">
            Manage production goals and bonus criteria
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Goal
        </Button>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
              <TabsTrigger value="all">All Goals</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {goalsQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <p>Loading goals...</p>
            </div>
          ) : goalsQuery.error ? (
            <div className="flex justify-center py-8 text-destructive">
              <AlertCircle className="h-6 w-6 mr-2" />
              <p>Error loading goals</p>
            </div>
          ) : filteredGoals.length === 0 ? (
            <div className="text-center py-12">
              <Award className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
              <h3 className="text-lg font-medium">No {activeTab !== 'all' ? activeTab + ' ' : ''}goals found</h3>
              <p className="text-muted-foreground mt-2">
                {activeTab === 'active' 
                  ? "There are no active bonus goals. Create a new goal to get started."
                  : activeTab === 'inactive'
                    ? "There are no inactive goals."
                    : "There are no bonus goals. Create a new goal to get started."}
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Goal
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Timeframe</TableHead>
                    <TableHead className="text-right">Target</TableHead>
                    <TableHead className="text-right">Bonus Amount</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGoals.map((goal: BonusGoal) => (
                    <TableRow key={goal.id}>
                      <TableCell className="font-medium">
                        {goal.name}
                        <div className="text-xs text-muted-foreground">{goal.description}</div>
                      </TableCell>
                      <TableCell>{formatGoalType(goal.goalType)}</TableCell>
                      <TableCell>{formatTimeframe(goal.timeframe)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(goal.targetAmount)}</TableCell>
                      <TableCell className="text-right text-green-600 font-medium">
                        {formatCurrency(goal.bonusAmount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={goal.isActive ? "default" : "outline"}>
                          {goal.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEdit(goal)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDelete(goal)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Create Goal Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Bonus Goal</DialogTitle>
            <DialogDescription>
              Set up a new production goal with bonus criteria
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Goal Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Monthly Production Goal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between space-y-0 rounded-md border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Enable or disable this goal
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="col-span-1 md:col-span-2">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Monthly office production goal with staff bonus" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="goalType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Goal Type</FormLabel>
                      <FormControl>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select goal type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="practice">Practice-wide</SelectItem>
                            <SelectItem value="role">Role-based</SelectItem>
                            <SelectItem value="individual">Individual</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>
                        Who this goal applies to
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="timeframe"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timeframe</FormLabel>
                      <FormControl>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select timeframe" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="annual">Annual</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>
                        How often the goal resets
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {form.watch('goalType') === 'role' && (
                  <FormField
                    control={form.control}
                    name="roleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Role</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            value={field.value?.toString()}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                              {rolesQuery.data ? (
                                rolesQuery.data.map((role: any) => (
                                  <SelectItem key={role.id} value={role.id.toString()}>
                                    {role.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="loading">Loading roles...</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                {form.watch('goalType') === 'individual' && (
                  <FormField
                    control={form.control}
                    name="userId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Staff Member</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            value={field.value?.toString()}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a staff member" />
                            </SelectTrigger>
                            <SelectContent>
                              {usersQuery.data ? (
                                usersQuery.data.map((user: any) => (
                                  <SelectItem key={user.id} value={user.id.toString()}>
                                    {user.firstName} {user.lastName}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="loading">Loading users...</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <FormField
                  control={form.control}
                  name="targetAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Amount</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                          <Input 
                            type="number" 
                            placeholder="10000.00" 
                            className="pl-8" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Production goal amount in dollars
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="bonusAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bonus Amount</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                          <Input 
                            type="number" 
                            placeholder="100.00" 
                            className="pl-8" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Bonus amount per staff member
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="hasTiers"
                  render={({ field }) => (
                    <FormItem className="col-span-1 md:col-span-2 flex items-center justify-between space-y-0 rounded-md border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Multiple Bonus Tiers</FormLabel>
                        <FormDescription>
                          Create multiple production targets with different bonus amounts
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              {form.watch('hasTiers') && (
                <div className="space-y-4 border rounded-md p-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Bonus Tiers</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentTiers = form.getValues('tiers') || [];
                        form.setValue('tiers', [
                          ...currentTiers,
                          {
                            targetAmount: 100000,
                            bonusAmount: 10000,
                            description: `Tier ${currentTiers.length + 1}`
                          }
                        ]);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Tier
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {form.watch('tiers')?.map((_, index) => (
                      <div key={index} className="grid grid-cols-12 gap-4 items-end border-b pb-4">
                        <div className="col-span-12 md:col-span-3">
                          <Label>Description</Label>
                          <Input
                            placeholder={`Tier ${index + 1}`}
                            {...form.register(`tiers.${index}.description`)}
                          />
                        </div>
                        <div className="col-span-6 md:col-span-4">
                          <Label>Target Amount ($)</Label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                            <Input
                              type="number"
                              placeholder="10000.00"
                              className="pl-8"
                              {...form.register(`tiers.${index}.targetAmount`)}
                            />
                          </div>
                        </div>
                        <div className="col-span-6 md:col-span-4">
                          <Label>Bonus Amount ($)</Label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                            <Input
                              type="number"
                              placeholder="100.00"
                              className="pl-8"
                              {...form.register(`tiers.${index}.bonusAmount`)}
                            />
                          </div>
                        </div>
                        <div className="col-span-12 md:col-span-1 flex justify-end">
                          {index > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const currentTiers = form.getValues('tiers') || [];
                                form.setValue(
                                  'tiers',
                                  currentTiers.filter((_, i) => i !== index)
                                );
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createGoalMutation.isPending}>
                  {createGoalMutation.isPending ? "Creating..." : "Create Goal"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Goal Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Bonus Goal</DialogTitle>
            <DialogDescription>
              Update this production goal and bonus criteria
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
              {/* Same form fields as create dialog, with values from selectedGoal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Goal Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Monthly Production Goal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between space-y-0 rounded-md border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Enable or disable this goal
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                {/* Repeat other form fields as in create dialog */}
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="col-span-1 md:col-span-2">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Monthly office production goal with staff bonus" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="goalType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Goal Type</FormLabel>
                      <FormControl>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select goal type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="practice">Practice-wide</SelectItem>
                            <SelectItem value="role">Role-based</SelectItem>
                            <SelectItem value="individual">Individual</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="targetAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Amount</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                          <Input 
                            type="number" 
                            placeholder="10000.00" 
                            className="pl-8" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="bonusAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bonus Amount</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                          <Input 
                            type="number" 
                            placeholder="100.00" 
                            className="pl-8" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setSelectedGoal(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateGoalMutation.isPending}>
                  {updateGoalMutation.isPending ? "Updating..." : "Update Goal"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Bonus Goal</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this bonus goal? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="border rounded-md p-4 my-4">
            {selectedGoal && (
              <div className="space-y-2">
                <p><strong>Goal:</strong> {selectedGoal.name}</p>
                <p><strong>Description:</strong> {selectedGoal.description}</p>
                <p><strong>Target Amount:</strong> {formatCurrency(selectedGoal.targetAmount)}</p>
                <p><strong>Bonus Amount:</strong> {formatCurrency(selectedGoal.bonusAmount)}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedGoal(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedGoal && deleteGoalMutation.mutate(selectedGoal.id)}
              disabled={deleteGoalMutation.isPending}
            >
              {deleteGoalMutation.isPending ? "Deleting..." : "Delete Goal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GoalManagement;