import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  AlertCircle, 
  CheckCircle2, 
  ClipboardCheck, 
  Download, 
  Edit, 
  FileSignature, 
  FileText, 
  Link2, 
  Mail, 
  Phone, 
  Plus, 
  Printer, 
  RefreshCw, 
  Send, 
  Share2, 
  User, 
  UserPlus 
} from "lucide-react";

interface PatientIntakeFormProps {
  patientId?: number;
}

interface PatientForm {
  id: number;
  patientId: number;
  status: "draft" | "sent" | "completed" | "reviewed";
  sentAt?: string;
  completedAt?: string;
  reviewedAt?: string;
  reviewedById?: number;
  reviewedByName?: string;
  formData?: any;
  formUrl?: string;
  sentToEmail?: string;
  sentToPhone?: string;
}

export function PatientIntakeForm({ patientId }: PatientIntakeFormProps) {
  const [activeTab, setActiveTab] = useState("forms");
  const [showNewPatientDialog, setShowNewPatientDialog] = useState(false);
  const [showSendFormDialog, setShowSendFormDialog] = useState(false);
  const [selectedForm, setSelectedForm] = useState<PatientForm | null>(null);
  const [sendMethod, setSendMethod] = useState<"email" | "sms">("email");
  const [emailAddress, setEmailAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [hipaaAccepted, setHipaaAccepted] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  // Fetch patient forms
  const { data: forms, isLoading } = useQuery<PatientForm[]>({
    queryKey: ["/api/patient-forms", patientId],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/patients/${patientId}/forms`);
        return res.json();
      } catch (error) {
        console.error("Failed to fetch patient forms:", error);
        return [];
      }
    },
    enabled: !!patientId
  });

  // Sample forms data for demonstration
  const sampleForms: PatientForm[] = [
    {
      id: 1,
      patientId: patientId || 0,
      status: "completed",
      sentAt: "2025-01-15T10:30:00Z",
      completedAt: "2025-01-16T14:22:00Z",
      reviewedAt: "2025-01-17T09:15:00Z",
      reviewedById: 1,
      reviewedByName: "Dr. Johnson",
      formUrl: "/forms/patient-1-intake",
      sentToEmail: "patient@example.com"
    },
    {
      id: 2,
      patientId: patientId || 0,
      status: "sent",
      sentAt: "2025-03-05T15:45:00Z",
      formUrl: "/forms/patient-1-update",
      sentToEmail: "patient@example.com"
    },
    {
      id: 3,
      patientId: patientId || 0,
      status: "draft",
      formUrl: "/forms/patient-1-specialty"
    }
  ];

  // Use the real data if available, otherwise use sample data
  const displayForms = forms || sampleForms;

  // Send form to patient
  const sendForm = async () => {
    // In a real app, this would call an API to send the form
    console.log("Sending form to patient:", {
      formId: selectedForm?.id,
      method: sendMethod,
      emailAddress: sendMethod === "email" ? emailAddress : undefined,
      phoneNumber: sendMethod === "sms" ? phoneNumber : undefined
    });
    
    // Reset form and close dialog
    setShowSendFormDialog(false);
  };

  // Create new patient account
  const createPatientAccount = async (formData: any) => {
    // In a real app, this would call an API to create a new patient
    console.log("Creating new patient account:", formData);
    
    // Reset form and close dialog
    setShowNewPatientDialog(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Patient Intake Forms</h2>
          <p className="text-muted-foreground">Manage and send patient intake and medical history forms</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showNewPatientDialog} onOpenChange={setShowNewPatientDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                New Patient
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Create New Patient Account</DialogTitle>
                <DialogDescription>
                  Create a new patient account and send them an invitation to complete their forms
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <h3 className="font-medium">Personal Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="First Name" />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Last Name" />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="patient@example.com" />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" placeholder="(123) 456-7890" />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input id="dob" type="date" />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select>
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="non-binary">Non-binary</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Separator className="my-2" />
                
                <h3 className="font-medium">Insurance Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="insuranceProvider">Insurance Provider</Label>
                    <Input id="insuranceProvider" placeholder="Insurance Provider" />
                  </div>
                  <div>
                    <Label htmlFor="insuranceNumber">Insurance ID/Number</Label>
                    <Input id="insuranceNumber" placeholder="Insurance ID/Number" />
                  </div>
                </div>
                
                <Separator className="my-2" />
                
                <h3 className="font-medium">Send Invitation</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="sendEmail" defaultChecked />
                    <Label htmlFor="sendEmail">Send email invitation to complete intake forms</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox id="sendText" />
                    <Label htmlFor="sendText">Send text message invitation to complete intake forms</Label>
                  </div>
                </div>
                
                <Alert className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Important</AlertTitle>
                  <AlertDescription>
                    The patient will receive a secure link to create their account and complete all necessary intake forms before their appointment.
                  </AlertDescription>
                </Alert>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewPatientDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => createPatientAccount({})}>
                  Create Patient & Send Forms
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {patientId && (
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              New Form
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="forms" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="forms">Patient Forms</TabsTrigger>
          <TabsTrigger value="templates">Form Templates</TabsTrigger>
          <TabsTrigger value="history">Submission History</TabsTrigger>
        </TabsList>

        <TabsContent value="forms">
          <div className="mb-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <div className="flex border rounded-md overflow-hidden">
                <Button 
                  variant={viewMode === "grid" ? "default" : "ghost"} 
                  size="sm" 
                  className="h-8 px-2 rounded-none"
                  onClick={() => setViewMode("grid")}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </Button>
                <Button 
                  variant={viewMode === "list" ? "default" : "ghost"} 
                  size="sm" 
                  className="h-8 px-2 rounded-none"
                  onClick={() => setViewMode("list")}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-10">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite] mb-3"></div>
              <p className="text-muted-foreground">Loading patient forms...</p>
            </div>
          ) : displayForms.length > 0 ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayForms.map((form) => (
                  <Card key={form.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <FileText className={`h-5 w-5 ${
                            form.status === "completed" ? "text-green-500" :
                            form.status === "sent" ? "text-blue-500" :
                            form.status === "reviewed" ? "text-purple-500" :
                            "text-gray-500"
                          }`} />
                          Intake Form
                        </div>
                        <Badge className={
                          form.status === "completed" ? "bg-green-100 text-green-800 hover:bg-green-100" :
                          form.status === "sent" ? "bg-blue-100 text-blue-800 hover:bg-blue-100" :
                          form.status === "reviewed" ? "bg-purple-100 text-purple-800 hover:bg-purple-100" :
                          "bg-gray-100 text-gray-800 hover:bg-gray-100"
                        }>
                          {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {form.status === "sent" && `Sent: ${new Date(form.sentAt!).toLocaleDateString()}`}
                        {form.status === "completed" && `Completed: ${new Date(form.completedAt!).toLocaleDateString()}`}
                        {form.status === "reviewed" && `Reviewed: ${new Date(form.reviewedAt!).toLocaleDateString()}`}
                        {form.status === "draft" && "Not yet sent"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {form.sentToEmail && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <Mail className="h-4 w-4" />
                          <span>{form.sentToEmail}</span>
                        </div>
                      )}
                      {form.sentToPhone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <Phone className="h-4 w-4" />
                          <span>{form.sentToPhone}</span>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-between pt-0">
                      <div className="space-x-1">
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                          <Link2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-x-1">
                        {form.status === "draft" && (
                          <Button 
                            size="sm"
                            onClick={() => {
                              setSelectedForm(form);
                              setShowSendFormDialog(true);
                            }}
                          >
                            Send
                          </Button>
                        )}
                        {form.status === "sent" && (
                          <Button variant="outline" size="sm">
                            Remind
                          </Button>
                        )}
                        {form.status === "completed" && (
                          <Button size="sm">
                            Review
                          </Button>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {displayForms.map((form) => (
                  <div 
                    key={form.id} 
                    className="flex items-center justify-between p-4 border rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        form.status === "completed" ? "bg-green-100" :
                        form.status === "sent" ? "bg-blue-100" :
                        form.status === "reviewed" ? "bg-purple-100" :
                        "bg-gray-100"
                      }`}>
                        <FileText className={`h-5 w-5 ${
                          form.status === "completed" ? "text-green-500" :
                          form.status === "sent" ? "text-blue-500" :
                          form.status === "reviewed" ? "text-purple-500" :
                          "text-gray-500"
                        }`} />
                      </div>
                      <div>
                        <h4 className="font-medium">Intake Form</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge className={
                            form.status === "completed" ? "bg-green-100 text-green-800 hover:bg-green-100" :
                            form.status === "sent" ? "bg-blue-100 text-blue-800 hover:bg-blue-100" :
                            form.status === "reviewed" ? "bg-purple-100 text-purple-800 hover:bg-purple-100" :
                            "bg-gray-100 text-gray-800 hover:bg-gray-100"
                          }>
                            {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                          </Badge>
                          {form.status === "sent" && (
                            <span>Sent: {new Date(form.sentAt!).toLocaleDateString()}</span>
                          )}
                          {form.status === "completed" && (
                            <span>Completed: {new Date(form.completedAt!).toLocaleDateString()}</span>
                          )}
                          {form.status === "reviewed" && (
                            <span>Reviewed: {new Date(form.reviewedAt!).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {form.status === "draft" && (
                        <Button 
                          size="sm"
                          onClick={() => {
                            setSelectedForm(form);
                            setShowSendFormDialog(true);
                          }}
                        >
                          Send
                        </Button>
                      )}
                      {form.status === "sent" && (
                        <Button variant="outline" size="sm">
                          Remind
                        </Button>
                      )}
                      {form.status === "completed" && (
                        <Button size="sm">
                          Review
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <Link2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded-lg border">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium">No Forms Available</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mt-1">
                There are no intake forms for this patient yet. Create a new form to get started.
              </p>
              <Button className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                New Form
              </Button>
            </div>
          )}

          {/* Send Form Dialog */}
          <Dialog open={showSendFormDialog} onOpenChange={setShowSendFormDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Send Form to Patient</DialogTitle>
                <DialogDescription>
                  Choose how you want to send this form to the patient
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Send Method</Label>
                  <div className="flex gap-4">
                    <div 
                      className={`flex-1 p-4 border rounded-md cursor-pointer flex flex-col items-center text-center gap-2 ${sendMethod === "email" ? "border-primary bg-primary/5" : ""}`}
                      onClick={() => setSendMethod("email")}
                    >
                      <Mail className={`h-6 w-6 ${sendMethod === "email" ? "text-primary" : "text-gray-500"}`} />
                      <Label className="cursor-pointer">Email</Label>
                    </div>
                    <div 
                      className={`flex-1 p-4 border rounded-md cursor-pointer flex flex-col items-center text-center gap-2 ${sendMethod === "sms" ? "border-primary bg-primary/5" : ""}`}
                      onClick={() => setSendMethod("sms")}
                    >
                      <Phone className={`h-6 w-6 ${sendMethod === "sms" ? "text-primary" : "text-gray-500"}`} />
                      <Label className="cursor-pointer">Text Message</Label>
                    </div>
                  </div>
                </div>
                
                {sendMethod === "email" && (
                  <div className="space-y-2">
                    <Label htmlFor="emailAddress">Email Address</Label>
                    <Input 
                      id="emailAddress" 
                      type="email" 
                      placeholder="patient@example.com" 
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                    />
                  </div>
                )}
                
                {sendMethod === "sms" && (
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input 
                      id="phoneNumber" 
                      placeholder="(123) 456-7890" 
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="message">Message (Optional)</Label>
                  <Textarea 
                    id="message" 
                    placeholder="Add a personal message to the patient..."
                    rows={3}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSendFormDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={sendForm} disabled={
                  (sendMethod === "email" && !emailAddress) || 
                  (sendMethod === "sms" && !phoneNumber)
                }>
                  Send Form
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Comprehensive Medical History
                </CardTitle>
                <CardDescription>
                  Full intake form for new patients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Includes medical history, dental history, insurance information, and all required legal consent forms.
                </p>
              </CardContent>
              <CardFooter className="flex justify-between pt-0">
                <Button variant="ghost" size="sm">
                  Preview
                </Button>
                <Button size="sm">
                  Use Template
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  Medical History Update
                </CardTitle>
                <CardDescription>
                  For returning patients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Shorter form for existing patients to update their medical information and medications.
                </p>
              </CardContent>
              <CardFooter className="flex justify-between pt-0">
                <Button variant="ghost" size="sm">
                  Preview
                </Button>
                <Button size="sm">
                  Use Template
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-500" />
                  Pediatric Dental Intake
                </CardTitle>
                <CardDescription>
                  For patients under 18
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Specialized form for pediatric patients with guardian information and child-specific health questions.
                </p>
              </CardContent>
              <CardFooter className="flex justify-between pt-0">
                <Button variant="ghost" size="sm">
                  Preview
                </Button>
                <Button size="sm">
                  Use Template
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-500" />
                  Orthodontic Assessment
                </CardTitle>
                <CardDescription>
                  For orthodontic consultations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Specialized form for orthodontic patients with questions about previous orthodontic treatment.
                </p>
              </CardContent>
              <CardFooter className="flex justify-between pt-0">
                <Button variant="ghost" size="sm">
                  Preview
                </Button>
                <Button size="sm">
                  Use Template
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="space-y-2">
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Form Submission History</h3>
              <div className="relative overflow-x-auto rounded-md border">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                    <tr>
                      <th scope="col" className="px-6 py-3">Form Type</th>
                      <th scope="col" className="px-6 py-3">Sent Date</th>
                      <th scope="col" className="px-6 py-3">Completed Date</th>
                      <th scope="col" className="px-6 py-3">Status</th>
                      <th scope="col" className="px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayForms.map((form) => (
                      <tr key={form.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">
                          Intake Form
                        </td>
                        <td className="px-6 py-4">
                          {form.sentAt ? new Date(form.sentAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4">
                          {form.completedAt ? new Date(form.completedAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={
                            form.status === "completed" ? "bg-green-100 text-green-800 hover:bg-green-100" :
                            form.status === "sent" ? "bg-blue-100 text-blue-800 hover:bg-blue-100" :
                            form.status === "reviewed" ? "bg-purple-100 text-purple-800 hover:bg-purple-100" :
                            "bg-gray-100 text-gray-800 hover:bg-gray-100"
                          }>
                            {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="h-8 px-3">
                              View
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 px-3">
                              Download
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Patient Intake Form Preview */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2 mt-4">
            <FileSignature className="h-4 w-4" />
            Preview Intake Form
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Comprehensive Patient Intake Form</DialogTitle>
            <DialogDescription>
              This is a preview of the patient intake form
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-8 py-4">
              <section>
                <h3 className="text-lg font-semibold border-b pb-2">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="preview-firstName">First Name</Label>
                    <Input id="preview-firstName" disabled />
                  </div>
                  <div>
                    <Label htmlFor="preview-lastName">Last Name</Label>
                    <Input id="preview-lastName" disabled />
                  </div>
                  <div>
                    <Label htmlFor="preview-dob">Date of Birth</Label>
                    <Input id="preview-dob" type="date" disabled />
                  </div>
                  <div>
                    <Label htmlFor="preview-gender">Gender</Label>
                    <Select disabled>
                      <SelectTrigger id="preview-gender">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="preview-email">Email</Label>
                    <Input id="preview-email" type="email" disabled />
                  </div>
                  <div>
                    <Label htmlFor="preview-phone">Phone</Label>
                    <Input id="preview-phone" disabled />
                  </div>
                </div>
              </section>
              
              <section>
                <h3 className="text-lg font-semibold border-b pb-2">Medical History</h3>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label className="text-base">Are you currently under a physician's care?</Label>
                    <RadioGroup disabled defaultValue="no" className="flex gap-4 mt-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="preview-physicianCare-yes" />
                        <Label htmlFor="preview-physicianCare-yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="preview-physicianCare-no" />
                        <Label htmlFor="preview-physicianCare-no">No</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div>
                    <Label htmlFor="preview-medications">List all medications you are currently taking</Label>
                    <Textarea id="preview-medications" placeholder="Medications" disabled />
                  </div>
                  
                  <div>
                    <Label className="text-base">Do you have any allergies to medications or substances?</Label>
                    <RadioGroup disabled defaultValue="no" className="flex gap-4 mt-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="preview-allergies-yes" />
                        <Label htmlFor="preview-allergies-yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="preview-allergies-no" />
                        <Label htmlFor="preview-allergies-no">No</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div>
                    <Label htmlFor="preview-allergiesList">If yes, please list your allergies</Label>
                    <Textarea id="preview-allergiesList" placeholder="Allergies" disabled />
                  </div>
                  
                  <div>
                    <Label className="text-base">Do you have or have you had any of the following? (Check all that apply)</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                      {[
                        "Heart Disease", "High Blood Pressure", "Diabetes", "Asthma", 
                        "Arthritis", "Cancer", "Epilepsy", "Hepatitis", "HIV/AIDS",
                        "Thyroid Problems", "Stroke", "Kidney Disease", "Liver Disease"
                      ].map((condition) => (
                        <div key={condition} className="flex items-center space-x-2">
                          <Checkbox id={`preview-condition-${condition.replace(/\s+/g, '-').toLowerCase()}`} disabled />
                          <Label htmlFor={`preview-condition-${condition.replace(/\s+/g, '-').toLowerCase()}`}>{condition}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
              
              <section>
                <h3 className="text-lg font-semibold border-b pb-2">Dental History</h3>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label className="text-base">When was your last dental visit?</Label>
                    <Select disabled>
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="within-6-months">Within 6 months</SelectItem>
                        <SelectItem value="6-12-months">6-12 months ago</SelectItem>
                        <SelectItem value="1-2-years">1-2 years ago</SelectItem>
                        <SelectItem value="over-2-years">Over 2 years ago</SelectItem>
                        <SelectItem value="never">Never</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-base">Do your gums bleed when you brush or floss?</Label>
                    <RadioGroup disabled defaultValue="no" className="flex gap-4 mt-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="preview-gumsBleed-yes" />
                        <Label htmlFor="preview-gumsBleed-yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="preview-gumsBleed-no" />
                        <Label htmlFor="preview-gumsBleed-no">No</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div>
                    <Label className="text-base">Are your teeth sensitive to cold, hot, sweets or pressure?</Label>
                    <RadioGroup disabled defaultValue="no" className="flex gap-4 mt-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="preview-sensitivity-yes" />
                        <Label htmlFor="preview-sensitivity-yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="preview-sensitivity-no" />
                        <Label htmlFor="preview-sensitivity-no">No</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div>
                    <Label htmlFor="preview-dentalConcerns">What are your primary dental concerns?</Label>
                    <Textarea id="preview-dentalConcerns" placeholder="Dental concerns" disabled />
                  </div>
                </div>
              </section>
              
              <section>
                <h3 className="text-lg font-semibold border-b pb-2">Insurance Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="preview-insuranceProvider">Insurance Provider</Label>
                    <Input id="preview-insuranceProvider" disabled />
                  </div>
                  <div>
                    <Label htmlFor="preview-insuranceId">Insurance ID/Member Number</Label>
                    <Input id="preview-insuranceId" disabled />
                  </div>
                  <div>
                    <Label htmlFor="preview-subscriberName">Subscriber Name (if not self)</Label>
                    <Input id="preview-subscriberName" disabled />
                  </div>
                  <div>
                    <Label htmlFor="preview-subscriberDob">Subscriber Date of Birth</Label>
                    <Input id="preview-subscriberDob" type="date" disabled />
                  </div>
                </div>
              </section>
              
              <section>
                <h3 className="text-lg font-semibold border-b pb-2">HIPAA Acknowledgment and Consent</h3>
                <div className="space-y-4 mt-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Health Information Privacy</AlertTitle>
                    <AlertDescription className="text-sm">
                      I acknowledge that I have received a copy of this dental practice's Notice of Privacy Practices. I understand that this information describes how my health information may be used and disclosed and how I can get access to this information.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="preview-hipaaConsent" 
                      checked={hipaaAccepted}
                      onCheckedChange={() => setHipaaAccepted(!hipaaAccepted)}
                    />
                    <Label htmlFor="preview-hipaaConsent" className="font-medium">
                      I have read and understand the HIPAA Privacy Policy
                    </Label>
                  </div>
                  
                  <Alert>
                    <ClipboardCheck className="h-4 w-4" />
                    <AlertTitle>Treatment Consent</AlertTitle>
                    <AlertDescription className="text-sm">
                      I authorize the dentist and any other qualified assistants or medical professionals to perform diagnostic procedures and treatment as may be necessary for proper dental care.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox id="preview-treatmentConsent" disabled />
                    <Label htmlFor="preview-treatmentConsent" className="font-medium">
                      I consent to dental treatment
                    </Label>
                  </div>
                  
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Financial Policy Acknowledgment</AlertTitle>
                    <AlertDescription className="text-sm">
                      I acknowledge that payment is due at the time of treatment unless other arrangements are made. I agree to be responsible for payment of all services rendered on my behalf or my dependents.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox id="preview-financialConsent" disabled />
                    <Label htmlFor="preview-financialConsent" className="font-medium">
                      I understand the financial policy
                    </Label>
                  </div>
                </div>
              </section>
            </div>
          </ScrollArea>
          
          <DialogFooter>
            <Button variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Print Form
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button>
              <Send className="h-4 w-4 mr-2" />
              Send to Patient
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}