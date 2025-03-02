
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

const paymentSchema = z.object({
  patientId: z.number().int().positive(),
  treatmentPlanId: z.number().int().positive(),
  amount: z.number().min(0.01, { message: "Amount must be greater than 0" }),
  method: z.enum(["cash", "credit_card", "check", "insurance", "other"]),
  description: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentProcessorProps {
  patientId: number;
  treatmentPlanId: number;
  amountDue: number;
  onSuccess?: () => void;
}

export function PaymentProcessor({ patientId, treatmentPlanId, amountDue, onSuccess }: PaymentProcessorProps) {
  const [paymentComplete, setPaymentComplete] = useState(false);
  const queryClient = useQueryClient();
  
  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      patientId,
      treatmentPlanId,
      amount: amountDue,
      method: "credit_card",
      description: "Payment for treatment",
    },
  });
  
  const paymentMutation = useMutation({
    mutationFn: (data: PaymentFormData) => api.post("/api/financial/payment", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients", patientId] });
      queryClient.invalidateQueries({ queryKey: ["/api/treatment-plans", treatmentPlanId] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial/summary"] });
      
      toast.success("Payment processed successfully");
      setPaymentComplete(true);
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast.error("Payment processing failed", {
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    },
  });
  
  const onSubmit = (data: PaymentFormData) => {
    paymentMutation.mutate(data);
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Process Payment</CardTitle>
        <CardDescription>Collect payment for treatment plan #{treatmentPlanId}</CardDescription>
      </CardHeader>
      <CardContent>
        {paymentComplete ? (
          <div className="flex flex-col items-center space-y-4 py-6">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <h3 className="text-xl font-semibold">Payment Complete</h3>
            <p className="text-muted-foreground text-center">
              Payment of ${form.getValues().amount.toFixed(2)} was successfully processed.
            </p>
            <Button onClick={() => setPaymentComplete(false)}>Process Another Payment</Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>Enter the payment amount</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="insurance">Insurance</SelectItem>
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
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>Optional payment description</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button
                type="submit"
                className="w-full"
                disabled={paymentMutation.isPending}
              >
                {paymentMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Process Payment"
                )}
              </Button>
              
              {paymentMutation.isError && (
                <div className="flex items-center gap-2 text-red-500 mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>Payment processing failed</span>
                </div>
              )}
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
