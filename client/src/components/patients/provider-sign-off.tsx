import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CheckCircle2, Fingerprint, LockKeyhole, ShieldAlert } from "lucide-react";

// Schema for provider sign-off
const signOffSchema = z.object({
  licenseNumber: z.string().min(3, {
    message: "License number is required for chart verification",
  }),
  acknowledgeChanges: z.boolean().refine(value => value === true, {
    message: "You must acknowledge that you've reviewed all changes",
  }),
});

type SignOffFormValues = z.infer<typeof signOffSchema>;

interface ProviderSignOffProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  patientId: number;
  patientName: string;
  hasChanges: boolean;
}

export function ProviderSignOff({
  open,
  onClose,
  onSuccess,
  patientId,
  patientName,
  hasChanges,
}: ProviderSignOffProps) {
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<SignOffFormValues>({
    resolver: zodResolver(signOffSchema),
    defaultValues: {
      licenseNumber: "",
      acknowledgeChanges: false,
    },
  });

  // Mutation for submitting sign-off
  const signOffMutation = useMutation({
    mutationFn: async (data: SignOffFormValues) => {
      return apiRequest("POST", "/api/provider/sign-off", {
        body: JSON.stringify({
          licenseNumber: data.licenseNumber,
          patientId,
          providerId: user?.id,
          acknowledgeChanges: data.acknowledgeChanges,
          timestamp: new Date().toISOString(),
        }),
      });
    },
    onSuccess: () => {
      setVerificationSuccess(true);
      
      // Show success toast
      toast({
        title: "Chart signed off successfully",
        description: `You have successfully verified and signed off on ${patientName}'s chart.`,
        variant: "default",
      });
      
      // Reset form
      form.reset();
      
      // After a delay, close dialog and trigger success callback
      setTimeout(() => {
        onSuccess();
      }, 1500);
    },
    onError: (error) => {
      console.error("Error signing off chart:", error);
      
      toast({
        title: "Verification failed",
        description: "License number verification failed. Please check and try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SignOffFormValues) => {
    signOffMutation.mutate(data);
  };

  // Handle dialog close with confirmation if there are unsaved changes
  const handleClose = () => {
    if (hasChanges && !verificationSuccess) {
      const confirmExit = window.confirm(
        "You have unsaved changes in this patient's chart. Exiting without sign-off may result in loss of data. Are you sure you want to exit?"
      );
      
      if (confirmExit) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LockKeyhole className="h-5 w-5 text-primary" />
            Provider Sign-Off Required
          </DialogTitle>
          <DialogDescription>
            {hasChanges
              ? "You've made changes to this patient's chart. Provider verification is required before exiting."
              : "Provider verification is required to maintain chart access records."}
          </DialogDescription>
        </DialogHeader>
        
        {verificationSuccess ? (
          <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="font-medium text-lg">Verification Successful</h3>
            <p className="text-muted-foreground">
              Your license has been verified and the chart has been signed off.
            </p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {hasChanges && (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex gap-3">
                  <ShieldAlert className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">Changes Detected</p>
                    <p>
                      You've made changes to this patient's chart that require your 
                      professional verification before they can be saved.
                    </p>
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="licenseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider License Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Fingerprint className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            {...field} 
                            className="pl-10" 
                            placeholder="Enter your professional license number" 
                            autoComplete="off"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Your dental license number is required to verify your identity.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {hasChanges && (
                  <FormField
                    control={form.control}
                    name="acknowledgeChanges"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            I acknowledge that I have reviewed all changes made to this patient's chart 
                            and approve them as the responsible provider.
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                )}
              </div>
              
              <DialogFooter className="flex justify-between sm:justify-between">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClose}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={signOffMutation.isPending}
                >
                  {signOffMutation.isPending ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Verifying...
                    </>
                  ) : (
                    "Verify & Sign Off"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}