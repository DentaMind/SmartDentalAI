
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

const insuranceClaimSchema = z.object({
  patientId: z.number().int().positive(),
  treatmentPlanId: z.number().int().positive(),
  insuranceProvider: z.string().min(1, { message: "Insurance provider is required" }),
  procedures: z.array(
    z.object({
      code: z.string().min(1, { message: "Procedure code is required" }),
      fee: z.number().min(0.01, { message: "Fee must be greater than 0" }),
    })
  ).min(1, { message: "At least one procedure is required" }),
});

type InsuranceClaimFormData = z.infer<typeof insuranceClaimSchema>;

interface InsuranceClaimFormProps {
  patientId: number;
  treatmentPlanId: number;
  procedures: Array<{ code: string; description: string; fee: number }>;
  onSuccess?: () => void;
}

export function InsuranceClaimForm({ 
  patientId, 
  treatmentPlanId, 
  procedures, 
  onSuccess 
}: InsuranceClaimFormProps) {
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const [claimDetails, setClaimDetails] = useState<any>(null);
  const queryClient = useQueryClient();
  
  const form = useForm<InsuranceClaimFormData>({
    resolver: zodResolver(insuranceClaimSchema),
    defaultValues: {
      patientId,
      treatmentPlanId,
      insuranceProvider: "",
      procedures: procedures.map(p => ({ code: p.code, fee: p.fee })),
    },
  });
  
  const claimMutation = useMutation({
    mutationFn: (data: InsuranceClaimFormData) => 
      api.post("/api/financial/insurance-claim", data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients", patientId] });
      queryClient.invalidateQueries({ queryKey: ["/api/treatment-plans", treatmentPlanId] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial/summary"] });
      
      toast.success("Insurance claim submitted successfully");
      setSubmissionComplete(true);
      setClaimDetails(response.data);
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast.error("Claim submission failed", {
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    },
  });
  
  const onSubmit = (data: InsuranceClaimFormData) => {
    claimMutation.mutate(data);
  };
  
  const insuranceProviders = [
    "Delta Dental",
    "Cigna Dental",
    "Aetna Dental",
    "MetLife Dental",
    "Guardian Dental",
    "United Healthcare Dental",
    "Blue Cross Blue Shield Dental",
    "Humana Dental"
  ];
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Submit Insurance Claim</CardTitle>
        <CardDescription>Submit claim for treatment plan #{treatmentPlanId}</CardDescription>
      </CardHeader>
      <CardContent>
        {submissionComplete ? (
          <div className="flex flex-col items-center space-y-4 py-6">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <h3 className="text-xl font-semibold">Claim Submitted</h3>
            <div className="w-full max-w-md space-y-3 bg-muted p-4 rounded-md">
              <div className="flex justify-between">
                <span className="font-medium">Claim Number:</span>
                <span>{claimDetails?.claimNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Expected Reimbursement:</span>
                <span>${claimDetails?.expectedReimbursement?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Processing Time:</span>
                <span>{claimDetails?.estimatedProcessingTime}</span>
              </div>
            </div>
            <Button onClick={() => setSubmissionComplete(false)}>Submit Another Claim</Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="insuranceProvider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Insurance Provider</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select insurance provider" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {insuranceProviders.map(provider => (
                          <SelectItem key={provider} value={provider}>{provider}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div>
                <h3 className="text-sm font-medium mb-2">Procedures</h3>
                <div className="space-y-4">
                  {procedures.map((procedure, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 border rounded-md">
                      <div>
                        <span className="text-sm font-semibold">Code:</span>
                        <div className="text-sm">{procedure.code}</div>
                      </div>
                      <div>
                        <span className="text-sm font-semibold">Description:</span>
                        <div className="text-sm">{procedure.description}</div>
                      </div>
                      <div>
                        <span className="text-sm font-semibold">Fee:</span>
                        <div className="text-sm">${procedure.fee.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full"
                disabled={claimMutation.isPending}
              >
                {claimMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting Claim...
                  </>
                ) : (
                  "Submit Insurance Claim"
                )}
              </Button>
              
              {claimMutation.isError && (
                <div className="flex items-center gap-2 text-red-500 mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>Claim submission failed</span>
                </div>
              )}
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
