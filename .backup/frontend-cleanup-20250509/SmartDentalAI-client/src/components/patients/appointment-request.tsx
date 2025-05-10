import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, isBefore, isSameDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Bell, CalendarIcon, CalendarPlus, CheckCircle2, CircleDashed, Clock } from "lucide-react";

interface AppointmentRequestProps {
  patientId?: number;
}

interface AppointmentRequest {
  patientId: number;
  requestedDate: Date;
  requestedTime: string;
  reason: string;
  insuranceProvider?: string;
  insuranceMemberId?: string;
  notes: string;
  preferredDoctorId?: number;
  isUrgent: boolean;
}

export function AppointmentRequest({ patientId }: AppointmentRequestProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [insuranceProvider, setInsuranceProvider] = useState<string>("");
  const [insuranceMemberId, setInsuranceMemberId] = useState<string>("");
  const [preferredDoctor, setPreferredDoctor] = useState<string>("");
  const [isUrgent, setIsUrgent] = useState<boolean>(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  // Submit request mutation
  const submitRequestMutation = useMutation({
    mutationFn: async () => {
      if (!date || !time || !reason) {
        throw new Error("Please fill out all required fields");
      }

      const data: AppointmentRequest = {
        patientId: patientId || user?.id || 0,
        requestedDate: date,
        requestedTime: time,
        reason,
        insuranceProvider: insuranceProvider || undefined,
        insuranceMemberId: insuranceMemberId || undefined,
        notes,
        preferredDoctorId: preferredDoctor ? parseInt(preferredDoctor) : undefined,
        isUrgent
      };

      return await apiRequest({
        url: '/api/appointments/request',
        method: 'POST',
        body: data
      });
    },
    onSuccess: () => {
      toast({
        title: "Appointment Requested",
        description: "Your appointment request has been submitted successfully.",
      });
      setIsSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to submit request: ${error.message}`,
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitRequestMutation.mutate();
  };

  const timeSlots = [
    "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", 
    "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
    "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
    "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM"
  ];

  const appointmentReasons = [
    "Regular Check-up",
    "Cleaning",
    "Toothache/Pain",
    "Filling",
    "Crown/Bridge Work",
    "Root Canal",
    "Extraction",
    "Cosmetic Procedure",
    "Denture Adjustment",
    "Emergency",
    "Other"
  ];

  const insuranceProviders = [
    "Delta Dental",
    "Cigna",
    "Aetna",
    "BlueCross BlueShield",
    "MetLife",
    "Guardian",
    "United Healthcare",
    "Humana",
    "Principal",
    "Other"
  ];

  const doctors = [
    { id: 1, name: "Dr. Sarah Johnson", specialty: "General Dentistry" },
    { id: 2, name: "Dr. Michael Chen", specialty: "Orthodontics" },
    { id: 3, name: "Dr. Amelia Rodriguez", specialty: "Endodontics" },
    { id: 4, name: "Dr. James Williams", specialty: "Periodontics" },
    { id: 5, name: "No preference", specialty: "" }
  ];

  // Function to check if a date is disabled
  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Disable dates in the past
    if (isBefore(date, today) && !isSameDay(date, today)) {
      return true;
    }
    
    // Disable weekends (0 is Sunday, 6 is Saturday)
    const day = date.getDay();
    if (day === 0 || day === 6) {
      return true;
    }
    
    // Disable dates more than 3 months in the future
    const threeMonthsFromNow = addDays(today, 90);
    if (isBefore(threeMonthsFromNow, date)) {
      return true;
    }
    
    return false;
  };

  // Already submitted view
  if (isSubmitted) {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle>Appointment Requested</CardTitle>
          <CardDescription>
            Your appointment request has been submitted successfully
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-gray-500">
            We have received your request for an appointment on
          </p>
          <div className="font-medium text-lg">
            {date ? format(date, "MMMM d, yyyy") : ""} at {time}
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Our staff will review your request and contact you to confirm the appointment.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-primary">
            <Bell className="h-4 w-4" />
            <span>You will receive a notification when your appointment is confirmed</span>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            variant="outline" 
            onClick={() => {
              setDate(undefined);
              setTime("");
              setReason("");
              setNotes("");
              setInsuranceProvider("");
              setInsuranceMemberId("");
              setPreferredDoctor("");
              setIsUrgent(false);
              setStep(1);
              setIsSubmitted(false);
            }}
          >
            Request Another Appointment
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-md bg-primary/10">
            <CalendarPlus className="h-5 w-5 text-primary" />
          </div>
          <CardTitle>Request an Appointment</CardTitle>
        </div>
        <CardDescription>
          {step === 1 && "Select your preferred date and time"}
          {step === 2 && "Tell us why you're visiting"}
          {step === 3 && "Review and confirm your appointment request"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? "bg-primary text-white" : "bg-gray-200 text-gray-500"}`}>
                1
              </div>
              <div className={`h-0.5 w-6 ${step >= 2 ? "bg-primary" : "bg-gray-200"}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? "bg-primary text-white" : "bg-gray-200 text-gray-500"}`}>
                2
              </div>
              <div className={`h-0.5 w-6 ${step >= 3 ? "bg-primary" : "bg-gray-200"}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? "bg-primary text-white" : "bg-gray-200 text-gray-500"}`}>
                3
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Step {step} of 3
            </div>
          </div>

          {/* Step 1: Select date and time */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Select Date<span className="text-red-500">*</span></Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Select a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      disabled={isDateDisabled}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Select Time<span className="text-red-500">*</span></Label>
                <Select value={time} onValueChange={setTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Preferred Doctor</Label>
                <Select value={preferredDoctor} onValueChange={setPreferredDoctor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a doctor (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id.toString()}>
                        {doctor.name}{doctor.specialty ? ` - ${doctor.specialty}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 mt-4">
                <input
                  type="checkbox"
                  id="urgent"
                  checked={isUrgent}
                  onChange={() => setIsUrgent(!isUrgent)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="urgent" className="text-sm text-gray-700">
                  This is an urgent request
                </label>
              </div>
            </div>
          )}

          {/* Step 2: Reason for visit */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Visit<span className="text-red-500">*</span></Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {appointmentReasons.map((item) => (
                      <SelectItem key={item} value={item}>{item}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="insurance">Insurance Provider</Label>
                <Select value={insuranceProvider} onValueChange={setInsuranceProvider}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your insurance (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {insuranceProviders.map((provider) => (
                      <SelectItem key={provider} value={provider}>{provider}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {insuranceProvider && (
                <div className="space-y-2">
                  <Label htmlFor="memberId">Insurance Member ID</Label>
                  <Input
                    id="memberId"
                    value={insuranceMemberId}
                    onChange={(e) => setInsuranceMemberId(e.target.value)}
                    placeholder="Enter your member ID"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional information we should know"
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">Appointment Details</h3>
                    <p className="text-sm text-gray-500">Please review the details below</p>
                  </div>
                  {isUrgent && (
                    <Badge variant="destructive">Urgent</Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Date</p>
                    <p className="font-medium">{date ? format(date, "MMMM d, yyyy") : "-"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Time</p>
                    <p className="font-medium">{time || "-"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Reason</p>
                    <p className="font-medium">{reason || "-"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Preferred Doctor</p>
                    <p className="font-medium">
                      {preferredDoctor ? doctors.find(d => d.id.toString() === preferredDoctor)?.name || "-" : "-"}
                    </p>
                  </div>
                  {insuranceProvider && (
                    <>
                      <div>
                        <p className="text-gray-500">Insurance</p>
                        <p className="font-medium">{insuranceProvider}</p>
                      </div>
                      {insuranceMemberId && (
                        <div>
                          <p className="text-gray-500">Member ID</p>
                          <p className="font-medium">{insuranceMemberId}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {notes && (
                  <div className="border-t pt-3 mt-3">
                    <p className="text-gray-500 text-sm">Additional Notes</p>
                    <p className="text-sm mt-1">{notes}</p>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 p-4 rounded-lg flex gap-3">
                <div className="text-blue-500 mt-0.5">
                  <CircleDashed className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-blue-800 font-medium text-sm">Appointment Verification</h4>
                  <p className="text-blue-700 text-sm mt-1">
                    After submission, our staff will review your request and confirm your appointment within 24 hours.
                  </p>
                </div>
              </div>
            </div>
          )}
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        {step > 1 ? (
          <Button variant="outline" onClick={() => setStep(prev => prev === 3 ? 2 : 1 as 1 | 2 | 3)}>
            Back
          </Button>
        ) : (
          <div></div> // Empty div to maintain spacing with justify-between
        )}
        
        {step < 3 ? (
          <Button 
            onClick={() => {
              if (step === 1 && (!date || !time)) {
                toast({
                  variant: "destructive",
                  title: "Required Fields",
                  description: "Please select both a date and time to continue.",
                });
                return;
              }
              if (step === 2 && !reason) {
                toast({
                  variant: "destructive",
                  title: "Required Fields",
                  description: "Please select a reason for your visit to continue.",
                });
                return;
              }
              setStep(prev => prev === 1 ? 2 : 3 as 1 | 2 | 3);
            }}
          >
            Continue
          </Button>
        ) : (
          <Button 
            type="submit" 
            onClick={handleSubmit}
            disabled={submitRequestMutation.isPending}
          >
            {submitRequestMutation.isPending ? "Submitting..." : "Submit Request"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}