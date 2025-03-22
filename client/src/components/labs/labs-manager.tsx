import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Beaker, Plus, Search, FileText, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/api";

// Status badge mapping for visual states
const statusBadgeVariants = {
  draft: "outline",
  submitted: "secondary",
  in_progress: "default",
  shipped: "info", 
  delivered: "success",
  completed: "success",
  on_hold: "warning",
  cancelled: "destructive",
} as const;

// Lab case form schema
const labCaseSchema = z.object({
  patientId: z.number().positive("Please select a patient"),
  caseType: z.string().min(1, "Case type is required"),
  description: z.string().min(1, "Description is required"),
  dueDate: z.string().min(1, "Due date is required"),
  instructions: z.string().optional(),
  status: z.enum([
    "draft", "submitted", "in_progress", "shipped", 
    "delivered", "completed", "on_hold", "cancelled"
  ]),
  labId: z.number().positive("Please select a dental lab"),
  attachments: z.array(z.any()).optional(),
});

type LabCaseFormValues = z.infer<typeof labCaseSchema>;

export function LabsManager() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Setup form with default values
  const form = useForm<LabCaseFormValues>({
    resolver: zodResolver(labCaseSchema),
    defaultValues: {
      patientId: 0,
      caseType: "",
      description: "",
      dueDate: new Date().toISOString().split('T')[0],
      instructions: "",
      status: "draft",
      labId: 0,
      attachments: [],
    },
  });

  // Mock data for development - this will be replaced with actual API calls
  const mockLabCases = [
    {
      id: 1,
      patientId: 1,
      patientName: "John Doe",
      caseType: "crown",
      description: "Full porcelain crown for tooth #12",
      dueDate: "2025-04-15",
      labId: 1,
      labName: "Premier Dental Lab",
      status: "in_progress",
      createdAt: "2025-03-10",
      updatedAt: "2025-03-15"
    },
    {
      id: 2,
      patientId: 2,
      patientName: "Sarah Smith",
      caseType: "bridge",
      description: "3-unit bridge for teeth #4-6",
      dueDate: "2025-04-20",
      labId: 2,
      labName: "Advanced Prosthetics",
      status: "submitted",
      createdAt: "2025-03-15",
      updatedAt: "2025-03-15"
    },
    {
      id: 3,
      patientId: 3,
      patientName: "Michael Williams",
      caseType: "denture",
      description: "Full upper denture",
      dueDate: "2025-05-01",
      labId: 1,
      labName: "Premier Dental Lab",
      status: "draft",
      createdAt: "2025-03-20",
      updatedAt: "2025-03-20"
    }
  ];

  const mockPatients = [
    { id: 1, firstName: "John", lastName: "Doe" },
    { id: 2, firstName: "Sarah", lastName: "Smith" },
    { id: 3, firstName: "Michael", lastName: "Williams" },
    { id: 4, firstName: "Emma", lastName: "Johnson" }
  ];

  const mockDentalLabs = [
    { id: 1, name: "Premier Dental Lab" },
    { id: 2, name: "Advanced Prosthetics" },
    { id: 3, name: "Digital Smile Designs" },
    { id: 4, name: "Precision Implants" }
  ];

  // Simulated API calls with mock data
  const { 
    data: labCases = mockLabCases, 
    isLoading, 
    isError 
  } = useQuery({
    queryKey: ['/api/lab-cases'],
    enabled: false, // Disabled for now as we're using mock data
  });

  const { 
    data: patients = mockPatients, 
    isLoading: isPatientsLoading
  } = useQuery({
    queryKey: ['/api/patients'],
    enabled: false, // Disabled for now as we're using mock data
  });

  const { 
    data: dentalLabs = mockDentalLabs, 
    isLoading: isLabsLoading
  } = useQuery({
    queryKey: ['/api/dental-labs'],
    enabled: false, // Disabled for now as we're using mock data
  });

  // Handle form submission
  async function onSubmit(values: LabCaseFormValues) {
    try {
      // In a real implementation, this would submit to the API
      // await apiRequest('/api/lab-cases', 'POST', values);
      
      toast({
        title: "Lab case created",
        description: "Your lab case has been submitted successfully.",
      });
      
      setIsCreateDialogOpen(false);
      form.reset();
      
      // In a real implementation, we would invalidate queries to refresh data
      // queryClient.invalidateQueries({ queryKey: ['/api/lab-cases'] });
      
    } catch (error) {
      console.error("Error creating lab case:", error);
      toast({
        variant: "destructive",
        title: "Failed to create lab case",
        description: "There was an error submitting your lab case. Please try again.",
      });
    }
  }

  // Filter lab cases based on search query and status filter
  const filteredCases = labCases.filter((labCase: any) => {
    const matchesSearch = searchQuery === "" || 
      labCase.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      labCase.caseType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      labCase.patientName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === null || labCase.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Error Loading Lab Cases
          </CardTitle>
          <CardDescription>
            There was a problem loading the lab cases. Please try refreshing the page.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Beaker className="h-5 w-5" />
                Dental Lab Cases
              </CardTitle>
              <CardDescription>
                Track and manage dental lab cases, their status, and deliveries
              </CardDescription>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="shrink-0">
                  <Plus className="h-4 w-4 mr-2" />
                  New Lab Case
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Lab Case</DialogTitle>
                  <DialogDescription>
                    Fill out the details for the new lab case. Click save when you're done.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="patientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Patient</FormLabel>
                          <Select
                            disabled={isPatientsLoading}
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            defaultValue={field.value.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select patient" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel>Patients</SelectLabel>
                                {isPatientsLoading ? (
                                  <SelectItem value="loading" disabled>Loading patients...</SelectItem>
                                ) : (
                                  patients.map((patient: any) => (
                                    <SelectItem key={patient.id} value={patient.id.toString()}>
                                      {patient.firstName} {patient.lastName}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="labId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dental Lab</FormLabel>
                          <Select
                            disabled={isLabsLoading}
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            defaultValue={field.value.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select dental lab" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel>Dental Labs</SelectLabel>
                                {isLabsLoading ? (
                                  <SelectItem value="loading" disabled>Loading labs...</SelectItem>
                                ) : (
                                  dentalLabs.map((lab: any) => (
                                    <SelectItem key={lab.id} value={lab.id.toString()}>
                                      {lab.name}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="caseType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Case Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select case type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="crown">Crown</SelectItem>
                              <SelectItem value="bridge">Bridge</SelectItem>
                              <SelectItem value="denture">Denture</SelectItem>
                              <SelectItem value="implant">Implant</SelectItem>
                              <SelectItem value="veneer">Veneer</SelectItem>
                              <SelectItem value="inlay">Inlay</SelectItem>
                              <SelectItem value="onlay">Onlay</SelectItem>
                              <SelectItem value="night_guard">Night Guard</SelectItem>
                              <SelectItem value="retainer">Retainer</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input placeholder="Brief description of the case" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Due Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="instructions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instructions</FormLabel>
                          <FormControl>
                            <textarea
                              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="Detailed instructions for the lab"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="submitted">Submitted</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="shipped">Shipped</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="on_hold">On Hold</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button type="submit">Save Lab Case</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search lab cases..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select
              value={statusFilter || ""}
              onValueChange={(value) => setStatusFilter(value === "" ? null : value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : (
            filteredCases.length === 0 ? (
              <div className="text-center py-10">
                <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium">No lab cases found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || statusFilter 
                    ? "Try adjusting your search or filter criteria."
                    : "Get started by creating your first lab case."}
                </p>
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Case ID</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Dental Lab</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCases.map((labCase: any) => (
                      <TableRow key={labCase.id}>
                        <TableCell className="font-medium">#{labCase.id}</TableCell>
                        <TableCell>{labCase.patientName}</TableCell>
                        <TableCell className="capitalize">{labCase.caseType}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {labCase.description}
                        </TableCell>
                        <TableCell>{labCase.labName}</TableCell>
                        <TableCell>{new Date(labCase.dueDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={statusBadgeVariants[labCase.status as keyof typeof statusBadgeVariants]}
                            className="capitalize"
                          >
                            {labCase.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}