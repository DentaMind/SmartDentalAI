import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
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
import { cn } from "@/lib/utils";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Beaker, Plus, Search, FileText, AlertCircle, ArrowLeft, Building, Mail, MapPin, FileSpreadsheet, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/api";

// Status badge mapping for visual states
const statusBadgeVariants: Record<string, "outline" | "secondary" | "default" | "destructive"> = {
  draft: "outline",
  submitted: "secondary",
  in_progress: "default",
  shipped: "default", 
  delivered: "default",
  completed: "default",
  on_hold: "outline",
  cancelled: "destructive",
};

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
  const [_, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedLabCase, setSelectedLabCase] = useState<any>(null);
  const [isLabDetailsOpen, setIsLabDetailsOpen] = useState(false);
  const [isPrescriptionDialogOpen, setIsPrescriptionDialogOpen] = useState(false);
  const [isLabContactDialogOpen, setIsLabContactDialogOpen] = useState(false);

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
  } = useQuery<typeof mockPatients>({
    queryKey: ['/api/patients'],
    enabled: false, // Disabled for now as we're using mock data
  });

  const { 
    data: dentalLabs = mockDentalLabs, 
    isLoading: isLabsLoading
  } = useQuery<typeof mockDentalLabs>({
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
  const filteredCases = (labCases as any[]).filter((labCase: any) => {
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
                            variant={statusBadgeVariants[labCase.status as keyof typeof statusBadgeVariants] || "default"}
                            className="capitalize"
                          >
                            {labCase.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              setSelectedLabCase(labCase);
                              setIsLabDetailsOpen(true);
                            }}
                          >
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
    
      {/* Lab Details Dialog */}
      <Dialog open={isLabDetailsOpen} onOpenChange={setIsLabDetailsOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          {selectedLabCase && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setIsLabDetailsOpen(false)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <DialogTitle>Lab Case #{selectedLabCase.id}: {selectedLabCase.description}</DialogTitle>
                </div>
                <DialogDescription>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant={statusBadgeVariants[selectedLabCase.status as keyof typeof statusBadgeVariants] || "default"} className="capitalize">
                      {selectedLabCase.status.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline">{selectedLabCase.caseType}</Badge>
                    <Badge variant="outline">Due: {new Date(selectedLabCase.dueDate).toLocaleDateString()}</Badge>
                  </div>
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="details">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Case Details</TabsTrigger>
                  <TabsTrigger value="prescription">Prescription</TabsTrigger>
                  <TabsTrigger value="lab-contact">Lab Contact</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Patient Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-lg font-semibold">{selectedLabCase.patientName}</div>
                        <div className="text-sm text-muted-foreground">Patient ID: {selectedLabCase.patientId}</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Provider Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-lg font-semibold">Dr. John Smith</div>
                        <div className="text-sm text-muted-foreground">Provider ID: 1001</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="md:col-span-2">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Lab Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-lg font-semibold">{selectedLabCase.labName}</div>
                        <div className="text-sm text-muted-foreground">Lab ID: {selectedLabCase.labId}</div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Case Instructions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">
                        {selectedLabCase.instructions || "No specific instructions provided for this case."}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="w-24 justify-center">Created</Badge>
                          <span className="text-sm">{new Date(selectedLabCase.createdAt).toLocaleString()}</span>
                        </div>
                        {selectedLabCase.updatedAt && selectedLabCase.updatedAt !== selectedLabCase.createdAt && (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="w-24 justify-center">Updated</Badge>
                            <span className="text-sm">{new Date(selectedLabCase.updatedAt).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="prescription" className="space-y-4 pt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5" />
                        Lab Prescription
                      </CardTitle>
                      <CardDescription>
                        Specify detailed requirements for the lab
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="material">Material</Label>
                            <Select defaultValue="porcelain">
                              <SelectTrigger>
                                <SelectValue placeholder="Select material" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="porcelain">Porcelain</SelectItem>
                                <SelectItem value="zirconia">Zirconia</SelectItem>
                                <SelectItem value="emax">E.max</SelectItem>
                                <SelectItem value="pfm">PFM</SelectItem>
                                <SelectItem value="composite">Composite</SelectItem>
                                <SelectItem value="metal">Metal</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="shade">Shade</Label>
                            <Select defaultValue="a2">
                              <SelectTrigger>
                                <SelectValue placeholder="Select shade" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="a1">A1</SelectItem>
                                <SelectItem value="a2">A2</SelectItem>
                                <SelectItem value="a3">A3</SelectItem>
                                <SelectItem value="a3.5">A3.5</SelectItem>
                                <SelectItem value="a4">A4</SelectItem>
                                <SelectItem value="b1">B1</SelectItem>
                                <SelectItem value="b2">B2</SelectItem>
                                <SelectItem value="custom">Custom</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="teeth">Teeth Numbers</Label>
                          <Input id="teeth" placeholder="e.g. 12, 13, 14" />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="special-instructions">Special Instructions</Label>
                          <Textarea 
                            id="special-instructions" 
                            placeholder="Enter any special instructions or notes for the lab"
                            className="min-h-[100px]"
                          />
                        </div>
                        
                        <div className="pt-4 flex justify-end">
                          <Button className="flex items-center gap-2">
                            <Send className="h-4 w-4" />
                            Send to Lab
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="lab-contact" className="space-y-4 pt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5" />
                        Lab Contact Information
                      </CardTitle>
                      <CardDescription>
                        Contact details for {selectedLabCase.labName}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-start gap-2">
                          <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <div className="font-medium">{selectedLabCase.labName}</div>
                            <div className="text-sm text-muted-foreground">123 Lab Avenue, Suite 200</div>
                            <div className="text-sm text-muted-foreground">San Francisco, CA 94107</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Mail className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="text-sm">contact@{selectedLabCase.labName.toLowerCase().replace(/\s+/g, '')}.com</div>
                          </div>
                        </div>
                        
                        <div className="pt-4">
                          <Label className="mb-2 block">Physical Address</Label>
                          <div className="rounded-md border h-[200px] bg-muted flex items-center justify-center text-muted-foreground text-sm">
                            <MapPin className="h-4 w-4 mr-2" />
                            Map view would be displayed here
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
              
              <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
                <div className="flex space-x-2 mt-4 sm:mt-0">
                  <Button variant="outline" onClick={() => setIsLabDetailsOpen(false)}>
                    Close
                  </Button>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsPrescriptionDialogOpen(true);
                      setIsLabDetailsOpen(false);
                    }}
                  >
                    Send Prescription
                  </Button>
                  <Button>
                    Update Status
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Lab Contact Dialog */}
      <Dialog open={isLabContactDialogOpen} onOpenChange={setIsLabContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lab Contact Information</DialogTitle>
            <DialogDescription>
              Contact details for the dental lab
            </DialogDescription>
          </DialogHeader>
          {selectedLabCase && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Lab Name</Label>
                <Input value={selectedLabCase.labName} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input 
                  placeholder="lab@example.com" 
                  value={`contact@${selectedLabCase.labName.toLowerCase().replace(/\s+/g, '')}.com`}
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input placeholder="(555) 123-4567" value="(555) 123-4567" readOnly />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea 
                  readOnly
                  value="123 Lab Avenue, Suite 200&#10;San Francisco, CA 94107"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLabContactDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
    </div>
  );
}