import React, { useEffect, useState } from 'react';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CertificationAlertsProps {
  scheduleData: Array<{
    time: string;
    patient: string;
    staff: string;
    isCertified: boolean;
    missingCertifications?: string[];
  }>;
  onSendReminder: (staffName: string) => Promise<void>;
  onViewTraining: (staffName: string) => void;
}

export function CertificationAlerts({ 
  scheduleData, 
  onSendReminder,
  onViewTraining
}: CertificationAlertsProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<{
    name: string;
    time: string;
    patient: string;
    missingCertifications?: string[];
  } | null>(null);
  const [isReminding, setIsReminding] = useState(false);

  // Find uncertified staff in schedule
  const uncertifiedStaff = scheduleData.filter(slot => !slot.isCertified);
  
  // Count uncertified staff
  const uncertifiedCount = uncertifiedStaff.length;

  // Send reminder to staff member
  const sendReminder = async () => {
    if (!currentStaff) return;
    
    setIsReminding(true);
    try {
      await onSendReminder(currentStaff.name);
      toast({
        title: "Reminder sent",
        description: `Training reminder sent to ${currentStaff.name}`,
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Failed to send reminder",
        description: "There was an error sending the reminder.",
        variant: "destructive",
      });
    } finally {
      setIsReminding(false);
    }
  };

  // View training details
  const viewTraining = () => {
    if (!currentStaff) return;
    
    onViewTraining(currentStaff.name);
    setOpen(false);
  };

  // Format time string
  const formatTime = (time: string) => {
    return time;
  };

  return (
    <>
      {uncertifiedCount > 0 && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-amber-800">
              {uncertifiedCount === 1 
                ? "1 staff member scheduled today is missing required certifications"
                : `${uncertifiedCount} staff members scheduled today are missing required certifications`
              }
            </h3>
            <p className="text-sm text-amber-700 mt-1">
              Staff without complete certifications may not be compliant with mandatory regulations.
            </p>
            <div className="mt-3 space-y-2">
              {uncertifiedStaff.map((staff, index) => (
                <div key={index} className="flex justify-between items-center text-sm p-2 bg-white rounded border border-amber-200">
                  <div>
                    <span className="font-medium">{staff.staff}</span>
                    <span className="text-gray-500 mx-1">•</span>
                    <span className="text-gray-500">{formatTime(staff.time)}</span>
                    <span className="text-gray-500 mx-1">•</span>
                    <span>{staff.patient}</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setCurrentStaff({
                        name: staff.staff,
                        time: staff.time,
                        patient: staff.patient,
                        missingCertifications: staff.missingCertifications
                      });
                      setOpen(true);
                    }}
                  >
                    Resolve
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span>Certification Alert</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              {currentStaff && (
                <div className="space-y-3 mt-2">
                  <p>
                    <strong>{currentStaff.name}</strong> is scheduled at <strong>{formatTime(currentStaff.time)}</strong> with patient <strong>{currentStaff.patient}</strong> but is missing required certifications.
                  </p>
                  
                  {currentStaff.missingCertifications && currentStaff.missingCertifications.length > 0 && (
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      <p className="font-medium mb-1">Missing certifications:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        {currentStaff.missingCertifications.map((cert, idx) => (
                          <li key={idx}>{cert}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <p>How would you like to resolve this issue?</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={viewTraining}
            >
              View Training Status
            </Button>
            <AlertDialogAction
              disabled={isReminding}
              onClick={(e) => {
                e.preventDefault();
                sendReminder();
              }}
            >
              {isReminding ? "Sending..." : "Send Reminder"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}