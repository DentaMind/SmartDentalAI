import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PatientNameButton } from "@/components/patients/patient-name-button";
import { 
  AlertCircle, 
  Calendar, 
  Check, 
  ChevronRight, 
  Clock, 
  FileSymlink, 
  Loader2, 
  Pencil, 
  Phone, 
  Trash2, 
  User, 
  Video, 
  X 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, formatDate } from "@/lib/utils";
import { Link } from "wouter";

interface AppointmentDetailsProps {
  appointmentId: number;
  onClose?: () => void;
}

interface Appointment {
  id: number;
  patientId: number;
  doctorId: number;
  date: string | Date;
  status: "scheduled" | "confirmed" | "completed" | "cancelled";
  notes: string | null;
  isOnline: boolean | null;
  insuranceVerified: boolean | null;
}

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  email?: string;
  phoneNumber?: string;
  insuranceProvider?: string;
}

interface Provider {
  id: number;
  firstName: string;
  lastName: string;
  role: string;
  specialization?: string;
}

export function AppointmentDetails({ appointmentId, onClose }: AppointmentDetailsProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("details");
  
  // Fetch appointment details
  const { 
    data: appointment, 
    isLoading: isLoadingAppointment,
    error: appointmentError
  } = useQuery<Appointment>({
    queryKey: ["/api/appointments", appointmentId],
    queryFn: async () => {
      try {
        return await apiRequest<Appointment>(`/api/appointments/${appointmentId}`);
      } catch (error) {
        console.error("Failed to fetch appointment details:", error);
        throw error;
      }
    }
  });
  
  // Fetch patient details if we have an appointment
  const { 
    data: patient,
    isLoading: isLoadingPatient 
  } = useQuery<Patient>({
    queryKey: ["/api/patients", appointment?.patientId],
    queryFn: async () => {
      try {
        return await apiRequest<Patient>(`/api/patients/${appointment?.patientId}`);
      } catch (error) {
        console.error("Failed to fetch patient details:", error);
        throw error;
      }
    },
    enabled: !!appointment?.patientId
  });
  
  // Fetch provider details if we have an appointment
  const { 
    data: provider,
    isLoading: isLoadingProvider 
  } = useQuery<Provider>({
    queryKey: ["/api/providers", appointment?.doctorId],
    queryFn: async () => {
      try {
        return await apiRequest<Provider>(`/api/providers/${appointment?.doctorId}`);
      } catch (error) {
        console.error("Failed to fetch provider details:", error);
        throw error;
      }
    },
    enabled: !!appointment?.doctorId
  });
  
  // Mutation for updating appointment status
  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ status }: { status: Appointment["status"] }) => {
      return apiRequest({
        method: "PATCH",
        url: `/api/appointments/${appointmentId}`,
        body: { status }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments", appointmentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      
      toast({
        title: "Appointment updated",
        description: "The appointment status has been updated successfully",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Error updating appointment:", error);
      
      toast({
        title: "Error updating appointment",
        description: "There was an error updating the appointment status. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for deleting an appointment
  const deleteAppointmentMutation = useMutation({
    mutationFn: async () => {
      return apiRequest({
        method: "DELETE",
        url: `/api/appointments/${appointmentId}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      
      toast({
        title: "Appointment deleted",
        description: "The appointment has been deleted successfully",
        variant: "default",
      });
      
      if (onClose) {
        onClose();
      }
    },
    onError: (error) => {
      console.error("Error deleting appointment:", error);
      
      toast({
        title: "Error deleting appointment",
        description: "There was an error deleting the appointment. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Handle confirm appointment
  const handleConfirmAppointment = () => {
    updateAppointmentMutation.mutate({ status: "confirmed" });
  };
  
  // Handle complete appointment
  const handleCompleteAppointment = () => {
    updateAppointmentMutation.mutate({ status: "completed" });
  };
  
  // Handle cancel appointment
  const handleCancelAppointment = () => {
    if (window.confirm("Are you sure you want to cancel this appointment?")) {
      updateAppointmentMutation.mutate({ status: "cancelled" });
    }
  };
  
  // Handle delete appointment
  const handleDeleteAppointment = () => {
    if (window.confirm("Are you sure you want to delete this appointment? This action cannot be undone.")) {
      deleteAppointmentMutation.mutate();
    }
  };
  
  // Format appointment time
  const formatAppointmentTime = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Get the status color
  const getStatusColor = (status: Appointment["status"]) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-50 text-blue-600 border-blue-200";
      case "confirmed":
        return "bg-green-50 text-green-600 border-green-200";
      case "completed":
        return "bg-gray-50 text-gray-600 border-gray-200";
      case "cancelled":
        return "bg-red-50 text-red-600 border-red-200";
      default:
        return "bg-gray-50 text-gray-600";
    }
  };
  
  // Loading state
  if (isLoadingAppointment || (appointment && (isLoadingPatient || isLoadingProvider))) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">Loading appointment details...</p>
      </div>
    );
  }
  
  // Error state
  if (appointmentError) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-destructive">
        <AlertCircle className="h-8 w-8" />
        <p className="mt-2">Error loading appointment details</p>
        {onClose && (
          <Button onClick={onClose} variant="outline" className="mt-4">
            Close
          </Button>
        )}
      </div>
    );
  }
  
  // No appointment found
  if (!appointment) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-muted-foreground">Appointment not found</p>
        {onClose && (
          <Button onClick={onClose} variant="outline" className="mt-4">
            Close
          </Button>
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Appointment Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2">
            Appointment #{appointmentId}
            <Badge className={cn("ml-2", getStatusColor(appointment.status))}>
              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
            </Badge>
            {appointment.isOnline && (
              <Badge variant="secondary" className="gap-1">
                <Video className="h-3 w-3" />
                Virtual
              </Badge>
            )}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {formatDate(new Date(appointment.date))}
            <span className="text-muted-foreground">•</span>
            <Clock className="h-4 w-4" />
            {formatAppointmentTime(appointment.date)}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {appointment.status === "scheduled" && (
            <Button
              size="sm"
              onClick={handleConfirmAppointment}
              disabled={updateAppointmentMutation.isPending}
            >
              <Check className="h-4 w-4 mr-1" />
              Confirm
            </Button>
          )}
          
          {appointment.status === "confirmed" && (
            <Button
              size="sm"
              onClick={handleCompleteAppointment}
              disabled={updateAppointmentMutation.isPending}
            >
              <Check className="h-4 w-4 mr-1" />
              Complete
            </Button>
          )}
          
          {(appointment.status === "scheduled" || appointment.status === "confirmed") && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancelAppointment}
              disabled={updateAppointmentMutation.isPending}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          )}
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="patient">Patient Profile</TabsTrigger>
          <TabsTrigger value="actions">Quick Actions</TabsTrigger>
        </TabsList>
        
        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4 mt-4">
          {/* Provider Info */}
          <div className="rounded-md border p-4">
            <h4 className="text-sm font-medium mb-2">Provider</h4>
            {provider ? (
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  {provider.firstName[0]}{provider.lastName[0]}
                </div>
                <div>
                  <p className="font-medium">Dr. {provider.firstName} {provider.lastName}</p>
                  <p className="text-xs text-muted-foreground">
                    {provider.specialization || provider.role}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Provider information not available</p>
            )}
          </div>
          
          {/* Appointment Notes */}
          <div className="rounded-md border p-4">
            <h4 className="text-sm font-medium mb-2">Notes</h4>
            {appointment.notes ? (
              <p className="text-sm">{appointment.notes}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">No notes for this appointment</p>
            )}
          </div>
          
          {/* Insurance Verification */}
          <div className="rounded-md border p-4">
            <h4 className="text-sm font-medium mb-2">Insurance Verification</h4>
            <div className="flex items-center">
              {appointment.insuranceVerified === true ? (
                <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                  <Check className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              ) : appointment.insuranceVerified === false ? (
                <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                  <X className="h-3 w-3 mr-1" />
                  Not Verified
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Unknown
                </Badge>
              )}
            </div>
          </div>
        </TabsContent>
        
        {/* Patient Tab */}
        <TabsContent value="patient" className="space-y-4 mt-4">
          {patient ? (
            <>
              <div className="rounded-md border p-4">
                <div className="flex justify-between">
                  <h4 className="text-sm font-medium mb-2">Patient Information</h4>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link href={`/patients/${patient.id}`}>
                          <Button size="sm" variant="ghost">
                            <FileSymlink className="h-4 w-4 mr-1" />
                            View Full Chart
                          </Button>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Open patient's complete chart</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    {patient.firstName[0]}{patient.lastName[0]}
                  </div>
                  <div>
                    <PatientNameButton 
                      patientId={patient.id} 
                      patientName={`${patient.firstName} ${patient.lastName}`}
                      variant="link"
                      className="px-0 py-0 h-auto font-medium"
                    />
                    {patient.dateOfBirth && (
                      <p className="text-xs text-muted-foreground">
                        DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                
                <Separator className="my-3" />
                
                <div className="grid grid-cols-2 gap-4 mt-3">
                  {patient.email && (
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium">{patient.email}</p>
                    </div>
                  )}
                  
                  {patient.phoneNumber && (
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium">{patient.phoneNumber}</p>
                    </div>
                  )}
                  
                  {patient.insuranceProvider && (
                    <div>
                      <p className="text-xs text-muted-foreground">Insurance</p>
                      <p className="text-sm font-medium">{patient.insuranceProvider}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Link href={`/patients/${patient.id}/treatments`}>
                  <Button variant="outline" className="w-full justify-start">
                    <FileSymlink className="h-4 w-4 mr-2" />
                    Treatment History
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  </Button>
                </Link>
                
                <Link href={`/patients/${patient.id}/xrays`}>
                  <Button variant="outline" className="w-full justify-start">
                    <FileSymlink className="h-4 w-4 mr-2" />
                    X-Rays & Images
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  </Button>
                </Link>
                
                <Link href={`/patients/${patient.id}/notes`}>
                  <Button variant="outline" className="w-full justify-start">
                    <FileSymlink className="h-4 w-4 mr-2" />
                    Medical Notes
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  </Button>
                </Link>
                
                <Link href={`/patients/${patient.id}/billing`}>
                  <Button variant="outline" className="w-full justify-start">
                    <FileSymlink className="h-4 w-4 mr-2" />
                    Billing History
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <User className="h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">Patient information not available</p>
            </div>
          )}
        </TabsContent>
        
        {/* Actions Tab */}
        <TabsContent value="actions" className="space-y-4 mt-4">
          <div className="space-y-3">
            {appointment.isOnline && (
              <Button className="w-full justify-start" variant="default">
                <Video className="h-4 w-4 mr-2" />
                Start Virtual Appointment
              </Button>
            )}
            
            <Button className="w-full justify-start" variant="outline">
              <Phone className="h-4 w-4 mr-2" />
              Call Patient
            </Button>
            
            <Button className="w-full justify-start" variant="outline">
              <Pencil className="h-4 w-4 mr-2" />
              Edit Appointment
            </Button>
            
            <Button 
              className="w-full justify-start text-destructive hover:text-destructive" 
              variant="outline"
              onClick={handleDeleteAppointment}
              disabled={deleteAppointmentMutation.isPending}
            >
              {deleteAppointmentMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete Appointment
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}