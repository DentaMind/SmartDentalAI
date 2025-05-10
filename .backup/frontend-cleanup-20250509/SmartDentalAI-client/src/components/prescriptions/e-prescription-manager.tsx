import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Patient as PatientSchema } from "@shared/schema";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

// Icons
import {
  Search,
  FilePlus,
  Send,
  FileCheck,
  FileX,
  RefreshCw,
  PenTool,
  Check,
  Clock,
  AlertCircle,
  Pill,
  Building,
  Phone,
  XCircle,
  Star,
  StarHalf,
  CheckCircle2,
  Sparkles,
  BrainCircuit,
  ListChecks,
} from "lucide-react";

interface Prescription {
  id: number;
  patientId: number;
  doctorId: number;
  date: string;
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: string;
  refills: number;
  dispensedAs: string;
  instructions: string;
  status: "active" | "completed" | "cancelled" | "on_hold" | "sent_to_pharmacy" | "filled";
  reasonForPrescription: string;
  allergiesChecked: boolean;
  interactionsChecked: boolean;
  pharmacyId?: number;
  ePrescriptionSent?: boolean;
  ePrescriptionSentAt?: string;
  controlled?: boolean;
  controlledSubstanceSchedule?: string;
  digitalSignature?: string;
  patientName?: string;
}

// Using the Patient interface imported from schema

interface Pharmacy {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  supportsEPrescription: boolean;
}

interface PrescriptionFormData {
  patientId: number;
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: string;
  refills: number;
  dispensedAs: string;
  instructions: string;
  reasonForPrescription: string;
  notes?: string;
  controlled: boolean;
  controlledSubstanceSchedule?: string;
}

// Status badge component
const PrescriptionStatusBadge = ({ status }: { status: Prescription['status'] }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'on_hold':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'sent_to_pharmacy':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'filled':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Check className="h-3.5 w-3.5 mr-1" />;
      case 'completed':
        return <FileCheck className="h-3.5 w-3.5 mr-1" />;
      case 'cancelled':
        return <FileX className="h-3.5 w-3.5 mr-1" />;
      case 'on_hold':
        return <Clock className="h-3.5 w-3.5 mr-1" />;
      case 'sent_to_pharmacy':
        return <Send className="h-3.5 w-3.5 mr-1" />;
      case 'filled':
        return <CheckCircle2 className="h-3.5 w-3.5 mr-1" />;
      default:
        return <AlertCircle className="h-3.5 w-3.5 mr-1" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'on_hold':
        return 'On Hold';
      case 'sent_to_pharmacy':
        return 'Sent to Pharmacy';
      case 'filled':
        return 'Filled';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <Badge className={`flex items-center font-medium ${getStatusColor(status)}`}>
      {getStatusIcon(status)}
      {getStatusText(status)}
    </Badge>
  );
};

export default function EPrescriptionManager({ patientId }: { patientId?: number }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  
  // State for prescription form and dialog
  const [isPrescriptionDialogOpen, setIsPrescriptionDialogOpen] = useState(false);
  const [isSigningDialogOpen, setIsSigningDialogOpen] = useState(false);
  const [isPharmacyDialogOpen, setIsPharmacyDialogOpen] = useState(false);
  const [isPatientSelectDialogOpen, setIsPatientSelectDialogOpen] = useState(false);
  const [isCommonMedsDialogOpen, setIsCommonMedsDialogOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [signature, setSignature] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<PatientSchema | null>(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  
  // Form data for new prescription
  const [prescriptionFormData, setPrescriptionFormData] = useState<PrescriptionFormData>({
    patientId: patientId || 0,
    drugName: "",
    dosage: "",
    frequency: "",
    duration: "",
    quantity: "",
    refills: 0,
    dispensedAs: "As Written",
    instructions: "",
    reasonForPrescription: "",
    controlled: false,
  });
  
  // Common dental medication abbreviations
  const commonMedications = [
    { name: "Amoxicillin", dosage: "500mg", frequency: "TID", duration: "7 days", quantity: "21", instructions: "Take 1 capsule by mouth three times daily until completed." },
    { name: "Amoxicillin/Clavulanate (Augmentin)", dosage: "875/125mg", frequency: "BID", duration: "7 days", quantity: "14", instructions: "Take 1 tablet by mouth twice daily until completed." },
    { name: "Clindamycin", dosage: "300mg", frequency: "QID", duration: "7 days", quantity: "28", instructions: "Take 1 capsule by mouth four times daily until completed." },
    { name: "Penicillin VK", dosage: "500mg", frequency: "QID", duration: "7 days", quantity: "28", instructions: "Take 1 tablet by mouth four times daily until completed." },
    { name: "Ibuprofen", dosage: "800mg", frequency: "TID", duration: "5 days", quantity: "15", instructions: "Take 1 tablet by mouth three times daily with food as needed for pain." },
    { name: "Acetaminophen/Codeine (Tylenol #3)", dosage: "300/30mg", frequency: "q4-6h", duration: "3 days", quantity: "12", instructions: "Take 1-2 tablets by mouth every 4-6 hours as needed for pain.", controlled: true, controlledSubstanceSchedule: "III" },
    { name: "Azithromycin (Z-Pak)", dosage: "250mg", frequency: "Daily per instructions", duration: "5 days", quantity: "6", instructions: "Take 2 tablets on first day, then 1 tablet daily for 4 more days." },
    { name: "Chlorhexidine Gluconate", dosage: "0.12%", frequency: "BID", duration: "14 days", quantity: "1 bottle (473ml)", instructions: "Rinse with 15ml for 30 seconds twice daily. Do not swallow." },
  ];
  
  // Fetch prescriptions - if patientId is provided, fetch only that patient's prescriptions
  const { data: prescriptions, isLoading } = useQuery({
    queryKey: patientId ? ['/prescriptions/patient', patientId] : ['/prescriptions'],
    queryFn: () => 
      patientId 
        ? apiRequest(`/prescriptions/patient/${patientId}`)
        : apiRequest('/prescriptions')
  });
  
  // Mutation for creating a new prescription
  const createPrescriptionMutation = useMutation({
    mutationFn: (data: PrescriptionFormData) => 
      apiRequest('/prescriptions', { 
        method: 'POST', 
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      }),
    onSuccess: () => {
      toast({
        title: "Prescription Created",
        description: "The prescription has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['/prescriptions/patient', patientId] });
      setIsPrescriptionDialogOpen(false);
      resetPrescriptionForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create prescription. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Mutation for signing a prescription digitally
  const signPrescriptionMutation = useMutation({
    mutationFn: ({ id, signature }: { id: number, signature: string }) => 
      apiRequest(`/prescriptions/${id}/sign`, { 
        method: 'POST',
        body: JSON.stringify({ signature }),
        headers: { 'Content-Type': 'application/json' }
      }),
    onSuccess: () => {
      toast({
        title: "Prescription Signed",
        description: "The prescription has been digitally signed.",
      });
      queryClient.invalidateQueries({ queryKey: ['/prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['/prescriptions/patient', patientId] });
      setIsSigningDialogOpen(false);
      setSignature("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to sign prescription. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Mutation for sending a prescription to a pharmacy
  const sendToPharmacyMutation = useMutation({
    mutationFn: ({ id, pharmacyId }: { id: number, pharmacyId: number }) => 
      apiRequest(`/prescriptions/${id}/send`, { 
        method: 'POST',
        body: JSON.stringify({ pharmacyId }),
        headers: { 'Content-Type': 'application/json' }
      }),
    onSuccess: () => {
      toast({
        title: "Prescription Sent",
        description: "The prescription has been sent to the pharmacy.",
      });
      queryClient.invalidateQueries({ queryKey: ['/prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['/prescriptions/patient', patientId] });
      setIsPharmacyDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send prescription to pharmacy. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Mutation for updating a prescription's status
  const updatePrescriptionStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: number, status: Prescription['status'], notes?: string }) => 
      apiRequest(`/prescriptions/${id}/status`, { 
        method: 'PUT', 
        body: JSON.stringify({ status, notes }),
        headers: { 'Content-Type': 'application/json' }
      }),
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "The prescription status has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['/prescriptions/patient', patientId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update prescription status. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Search for pharmacies
  const { data: pharmacies, isLoading: isLoadingPharmacies } = useQuery({
    queryKey: ['pharmacies', searchQuery],
    queryFn: () => apiRequest(`/pharmacies/search?query=${encodeURIComponent(searchQuery)}`),
    enabled: searchQuery.length > 2 && isPharmacyDialogOpen,
  });
  
  // Search for patients
  const { data: patients, isLoading: isLoadingPatients } = useQuery({
    queryKey: ['patients', patientSearchQuery],
    queryFn: () => apiRequest(`/patients/search?query=${encodeURIComponent(patientSearchQuery)}`),
    enabled: patientSearchQuery.length > 2 && isPatientSelectDialogOpen,
  });
  
  // Fetch patient details
  const { data: patientDetails, isLoading: isLoadingPatientDetails } = useQuery({
    queryKey: ['patient', prescriptionFormData.patientId],
    queryFn: () => apiRequest(`/patients/${prescriptionFormData.patientId}`),
    enabled: !!prescriptionFormData.patientId && prescriptionFormData.patientId > 0,
  });
  
  // AI Prescription Recommendation - This will send patient data to get recommendations
  const aiPrescriptionMutation = useMutation({
    mutationFn: (patientId: number) => 
      apiRequest('/ai/prescription-recommendation', { 
        method: 'POST', 
        body: JSON.stringify({ patientId }),
        headers: { 'Content-Type': 'application/json' }
      }),
    onSuccess: (data) => {
      const recommendation = data.recommendation;
      setPrescriptionFormData(prev => ({
        ...prev,
        drugName: recommendation.drugName || prev.drugName,
        dosage: recommendation.dosage || prev.dosage,
        frequency: recommendation.frequency || prev.frequency,
        duration: recommendation.duration || prev.duration,
        quantity: recommendation.quantity || prev.quantity,
        refills: recommendation.refills || prev.refills,
        instructions: recommendation.instructions || prev.instructions,
        reasonForPrescription: recommendation.reasonForPrescription || prev.reasonForPrescription,
        controlled: recommendation.controlled || prev.controlled,
        controlledSubstanceSchedule: recommendation.controlledSubstanceSchedule || prev.controlledSubstanceSchedule,
      }));
      
      toast({
        title: "AI Recommendation Generated",
        description: "The prescription has been pre-filled based on patient history and procedures.",
      });
      setAiGenerating(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate AI recommendation. Falling back to manual entry.",
        variant: "destructive",
      });
      setAiGenerating(false);
    }
  });
  
  // Reset prescription form
  const resetPrescriptionForm = () => {
    setPrescriptionFormData({
      patientId: patientId || 0,
      drugName: "",
      dosage: "",
      frequency: "",
      duration: "",
      quantity: "",
      refills: 0,
      dispensedAs: "As Written",
      instructions: "",
      reasonForPrescription: "",
      controlled: false,
    });
  };
  
  // Handle prescription form changes
  const handlePrescriptionFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPrescriptionFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  
  // Handle checkbox changes
  const handleCheckboxChange = (name: string, checked: boolean) => {
    setPrescriptionFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };
  
  // Handle prescription form submission
  const handlePrescriptionFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPrescriptionMutation.mutate(prescriptionFormData);
  };
  
  // Open the signing dialog
  const handleOpenSigningDialog = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setIsSigningDialogOpen(true);
  };
  
  // Handle signing form submission
  const handleSigningSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPrescription && signature) {
      signPrescriptionMutation.mutate({
        id: selectedPrescription.id,
        signature,
      });
    }
  };
  
  // Open the pharmacy dialog
  const handleOpenPharmacyDialog = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setIsPharmacyDialogOpen(true);
  };
  
  // Handle pharmacy selection
  const handleSelectPharmacy = (pharmacy: Pharmacy) => {
    setSelectedPharmacy(pharmacy);
  };
  
  // Handle sending to pharmacy
  const handleSendToPharmacy = () => {
    if (selectedPrescription && selectedPharmacy) {
      sendToPharmacyMutation.mutate({
        id: selectedPrescription.id,
        pharmacyId: selectedPharmacy.id,
      });
    }
  };
  
  // Handle status update
  const handleStatusUpdate = (id: number, status: Prescription['status'], notes?: string) => {
    updatePrescriptionStatusMutation.mutate({ id, status, notes });
  };
  
  // Handle patient selection
  const handlePatientSelect = (patient: PatientSchema) => {
    setSelectedPatient(patient);
    setPrescriptionFormData(prev => ({
      ...prev,
      patientId: patient.id
    }));
    setIsPatientSelectDialogOpen(false);
    
    // Generate AI recommendations if a patient is selected
    if (patient.id) {
      setAiGenerating(true);
      aiPrescriptionMutation.mutate(patient.id);
    }
  };
  
  // Handle medication selection from common medications
  const handleMedicationSelect = (medication: any) => {
    setPrescriptionFormData(prev => ({
      ...prev,
      drugName: medication.name,
      dosage: medication.dosage,
      frequency: medication.frequency,
      duration: medication.duration,
      quantity: medication.quantity,
      instructions: medication.instructions,
      controlled: medication.controlled || false,
      controlledSubstanceSchedule: medication.controlledSubstanceSchedule || "",
    }));
  };
  
  // Generate AI recommendations
  const handleGenerateAIRecommendation = () => {
    if (prescriptionFormData.patientId) {
      setAiGenerating(true);
      aiPrescriptionMutation.mutate(prescriptionFormData.patientId);
    } else {
      toast({
        title: "Error",
        description: "Please select a patient first to generate AI recommendations.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-blue-600" />
            {t("E-Prescription Management")}
          </CardTitle>
          <CardDescription>
            {patientId 
              ? t("Manage electronic prescriptions for this patient")
              : t("Manage electronic prescriptions for all patients")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-6">
            <Button
              variant="default"
              className="flex items-center gap-2"
              onClick={() => {
                if (!patientId) {
                  setIsPatientSelectDialogOpen(true);
                } else {
                  setPrescriptionFormData(prev => ({
                    ...prev,
                    patientId: patientId
                  }));
                  setIsPrescriptionDialogOpen(true);
                  setAiGenerating(true);
                  aiPrescriptionMutation.mutate(patientId);
                }
              }}
            >
              <FilePlus className="h-4 w-4" />
              {t("New Prescription")}
            </Button>
          </div>
          
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : !prescriptions?.prescriptions?.length ? (
            <div className="text-center py-10 text-muted-foreground">
              <Pill className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-lg font-medium mb-1">No prescriptions found</p>
              <p>Create a new prescription to get started.</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("Medication")}</TableHead>
                    <TableHead>{t("Patient")}</TableHead>
                    <TableHead>{t("Dosage")}</TableHead>
                    <TableHead>{t("Date")}</TableHead>
                    <TableHead>{t("Status")}</TableHead>
                    <TableHead className="text-right">{t("Actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prescriptions.prescriptions.map((prescription: Prescription) => (
                    <TableRow key={prescription.id}>
                      <TableCell className="font-medium">
                        <div>
                          {prescription.drugName}
                          {prescription.controlled && (
                            <Badge className="ml-2 bg-orange-100 text-orange-800 border-orange-200">
                              Controlled {prescription.controlledSubstanceSchedule}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">{prescription.reasonForPrescription}</div>
                      </TableCell>
                      <TableCell>
                        {prescription.patientName || `Patient #${prescription.patientId}`}
                      </TableCell>
                      <TableCell>
                        <div>{prescription.dosage}</div>
                        <div className="text-sm text-muted-foreground">{prescription.frequency}</div>
                      </TableCell>
                      <TableCell>
                        {new Date(prescription.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <PrescriptionStatusBadge status={prescription.status} />
                        {prescription.ePrescriptionSent && (
                          <div className="text-xs text-muted-foreground mt-1.5">
                            e-Sent: {new Date(prescription.ePrescriptionSentAt!).toLocaleDateString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {prescription.controlled && !prescription.digitalSignature && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8"
                              onClick={() => handleOpenSigningDialog(prescription)}
                            >
                              <PenTool className="h-3.5 w-3.5 mr-1" />
                              {t("Sign")}
                            </Button>
                          )}
                          
                          {(prescription.status === 'active' || prescription.status === 'on_hold') && 
                            (!prescription.controlled || (prescription.controlled && prescription.digitalSignature)) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8"
                              onClick={() => handleOpenPharmacyDialog(prescription)}
                            >
                              <Send className="h-3.5 w-3.5 mr-1" />
                              {t("Send")}
                            </Button>
                          )}
                          
                          {prescription.status === 'active' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                >
                                  <XCircle className="h-3.5 w-3.5 mr-1" />
                                  {t("Cancel")}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{t("Cancel Prescription")}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t("Are you sure you want to cancel this prescription? This action cannot be undone.")}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{t("No, keep it")}</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleStatusUpdate(prescription.id, 'cancelled')}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    {t("Yes, cancel")}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          
                          {prescription.status === 'sent_to_pharmacy' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                              onClick={() => handleStatusUpdate(prescription.id, 'filled')}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                              {t("Mark Filled")}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
      
      {/* New Prescription Dialog */}
      <Dialog open={isPrescriptionDialogOpen} onOpenChange={setIsPrescriptionDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t("Create New Prescription")}</DialogTitle>
            <DialogDescription>
              {t("Fill out the prescription details below. Required fields are marked with *")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePrescriptionFormSubmit}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="drugName">
                    {t("Medication Name")} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="drugName"
                    name="drugName"
                    value={prescriptionFormData.drugName}
                    onChange={handlePrescriptionFormChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dosage">
                    {t("Dosage")} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="dosage"
                    name="dosage"
                    value={prescriptionFormData.dosage}
                    onChange={handlePrescriptionFormChange}
                    placeholder="e.g., 10mg"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="frequency">
                    {t("Frequency")} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="frequency"
                    name="frequency"
                    value={prescriptionFormData.frequency}
                    onChange={handlePrescriptionFormChange}
                    placeholder="e.g., Once daily"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="duration">
                    {t("Duration")} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="duration"
                    name="duration"
                    value={prescriptionFormData.duration}
                    onChange={handlePrescriptionFormChange}
                    placeholder="e.g., 10 days"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="quantity">
                    {t("Quantity")} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    value={prescriptionFormData.quantity}
                    onChange={handlePrescriptionFormChange}
                    placeholder="e.g., 30 tablets"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="refills">
                    {t("Refills")} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="refills"
                    name="refills"
                    type="number"
                    min="0"
                    value={prescriptionFormData.refills}
                    onChange={handlePrescriptionFormChange}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                {/* AI Recommendation and Common Medication Buttons */}
                <div className="flex gap-2 mb-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center gap-2 bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                    onClick={handleGenerateAIRecommendation}
                    disabled={aiGenerating || !prescriptionFormData.patientId}
                  >
                    {aiGenerating ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        {t("Generating...")}
                      </>
                    ) : (
                      <>
                        <BrainCircuit className="h-4 w-4" />
                        {t("AI Recommendation")}
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center gap-2"
                    onClick={() => setIsCommonMedsDialogOpen(true)}
                  >
                    <ListChecks className="h-4 w-4" />
                    {t("Common Medications")}
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dispensedAs">
                    {t("Dispense As")} <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    name="dispensedAs"
                    value={prescriptionFormData.dispensedAs}
                    onValueChange={(value) => 
                      setPrescriptionFormData((prev) => ({ ...prev, dispensedAs: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="As Written">As Written</SelectItem>
                      <SelectItem value="Generic Substitution Permitted">Generic Substitution Permitted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reasonForPrescription">
                    {t("Reason for Prescription")} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="reasonForPrescription"
                    name="reasonForPrescription"
                    value={prescriptionFormData.reasonForPrescription}
                    onChange={handlePrescriptionFormChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="instructions">
                    {t("Patient Instructions")} <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="instructions"
                    name="instructions"
                    value={prescriptionFormData.instructions}
                    onChange={handlePrescriptionFormChange}
                    rows={3}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">{t("Additional Notes")}</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={prescriptionFormData.notes || ""}
                    onChange={handlePrescriptionFormChange}
                    rows={2}
                  />
                </div>
                
                <div className="flex items-center space-x-2 mt-4">
                  <Checkbox
                    id="controlled"
                    checked={prescriptionFormData.controlled}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange("controlled", checked as boolean)
                    }
                  />
                  <Label htmlFor="controlled" className="font-medium text-amber-700">
                    {t("This is a controlled substance")}
                  </Label>
                </div>
                
                {prescriptionFormData.controlled && (
                  <div className="space-y-2 mt-2">
                    <Label htmlFor="controlledSubstanceSchedule">
                      {t("Schedule")} <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      name="controlledSubstanceSchedule"
                      value={prescriptionFormData.controlledSubstanceSchedule || ""}
                      onValueChange={(value) => 
                        setPrescriptionFormData((prev) => ({ ...prev, controlledSubstanceSchedule: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select schedule" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="II">Schedule II</SelectItem>
                        <SelectItem value="III">Schedule III</SelectItem>
                        <SelectItem value="IV">Schedule IV</SelectItem>
                        <SelectItem value="V">Schedule V</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPrescriptionDialogOpen(false)}>
                {t("Cancel")}
              </Button>
              <Button type="submit" disabled={createPrescriptionMutation.isPending}>
                {createPrescriptionMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    {t("Creating...")}
                  </>
                ) : (
                  t("Create Prescription")
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Digital Signature Dialog */}
      <Dialog open={isSigningDialogOpen} onOpenChange={setIsSigningDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Digital Signature Required")}</DialogTitle>
            <DialogDescription>
              {t("This prescription requires your digital signature because it is a controlled substance.")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSigningSubmit}>
            <div className="space-y-4 py-4">
              <div className="border border-amber-200 rounded-lg p-3 bg-amber-50">
                <h4 className="text-sm font-medium text-amber-800 mb-1 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {t("Controlled Substance")}
                </h4>
                <p className="text-sm text-amber-700">
                  {t("By signing this prescription, you certify that this is a valid prescription for a legitimate medical purpose, issued in the normal course of professional practice.")}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signature">
                  {t("Signature")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="signature"
                  name="signature"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder={t("Type your full name as your electronic signature")}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {t("Your typed signature is legally binding and will be recorded with a timestamp.")}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSigningDialogOpen(false)}>
                {t("Cancel")}
              </Button>
              <Button 
                type="submit" 
                className="bg-amber-600 hover:bg-amber-700"
                disabled={!signature || signPrescriptionMutation.isPending}
              >
                {signPrescriptionMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    {t("Signing...")}
                  </>
                ) : (
                  <>
                    <PenTool className="h-4 w-4 mr-2" />
                    {t("Digitally Sign Prescription")}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Pharmacy Selection Dialog */}
      <Dialog open={isPharmacyDialogOpen} onOpenChange={setIsPharmacyDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t("Send to Pharmacy")}</DialogTitle>
            <DialogDescription>
              {t("Search for a pharmacy to send this prescription electronically.")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by pharmacy name, city, or zip code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>
            
            {searchQuery.length > 0 && searchQuery.length < 3 && (
              <p className="text-sm text-muted-foreground">
                {t("Please enter at least 3 characters to search")}
              </p>
            )}
            
            {isLoadingPharmacies ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : pharmacies?.pharmacies?.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Building className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-lg font-medium mb-1">{t("No pharmacies found")}</p>
                <p>{t("Try a different search term")}</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {pharmacies?.pharmacies?.map((pharmacy: Pharmacy) => (
                  <div
                    key={pharmacy.id}
                    className={`border rounded-lg p-3 cursor-pointer transition-all ${
                      selectedPharmacy?.id === pharmacy.id
                        ? "border-blue-500 bg-blue-50"
                        : "hover:border-blue-200 hover:bg-blue-50/50"
                    }`}
                    onClick={() => handleSelectPharmacy(pharmacy)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-base font-medium flex items-center">
                        {pharmacy.name}
                        {selectedPharmacy?.id === pharmacy.id && (
                          <Check className="h-4 w-4 ml-2 text-blue-600" />
                        )}
                      </h4>
                      {pharmacy.supportsEPrescription ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          <Sparkles className="h-3 w-3 mr-1" />
                          {t("E-Prescription Ready")}
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                          {t("Fax Only")}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {pharmacy.address}, {pharmacy.city}, {pharmacy.state} {pharmacy.zipCode}
                    </p>
                    <div className="flex items-center mt-2 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 mr-1.5" />
                      {pharmacy.phone}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPharmacyDialogOpen(false)}>
              {t("Cancel")}
            </Button>
            <Button
              onClick={handleSendToPharmacy}
              disabled={!selectedPharmacy || sendToPharmacyMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {sendToPharmacyMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {t("Sending...")}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {t("Send to")} {selectedPharmacy?.name || t("Pharmacy")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Patient Selection Dialog */}
      <Dialog open={isPatientSelectDialogOpen} onOpenChange={setIsPatientSelectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Select Patient")}</DialogTitle>
            <DialogDescription>
              {t("Select a patient to create a prescription for")}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isLoadingPatients ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : !patients || patients.length === 0 ? (
              <div className="text-center py-4">
                <p>{t("No patients found.")}</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {patients?.map((patient) => (
                    <Button
                      key={patient.id}
                      variant="outline"
                      className="w-full justify-start text-left h-auto py-3"
                      onClick={() => handlePatientSelect(patient)}
                    >
                      <div>
                        <div className="font-medium">
                          {patient.firstName} {patient.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {t("DOB")}: {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'} | {t("ID")}: {patient.id}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPatientSelectDialogOpen(false)}>
              {t("Cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Common Medications Dialog */}
      <Dialog open={isCommonMedsDialogOpen} onOpenChange={setIsCommonMedsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Common Dental Medications")}</DialogTitle>
            <DialogDescription>
              {t("Select a common medication to quickly fill the prescription form")}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {commonMedications.map((medication, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-3"
                    onClick={() => {
                      handleMedicationSelect(medication);
                      setIsCommonMedsDialogOpen(false);
                    }}
                  >
                    <div>
                      <div className="font-medium">{medication.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {medication.dosage} | {medication.frequency}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCommonMedsDialogOpen(false)}>
              {t("Cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}