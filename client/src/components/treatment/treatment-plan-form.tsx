import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { insertTreatmentPlanSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TreatmentPlanFormProps {
  patientId: number;
  doctorId: number;
  onSuccess?: () => void;
}

export function TreatmentPlanForm({
  patientId,
  doctorId,
  onSuccess,
}: TreatmentPlanFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(insertTreatmentPlanSchema),
    defaultValues: {
      patientId,
      doctorId,
      diagnosis: "",
      procedures: [],
      cost: 0,
      status: "proposed",
    },
  });

  const createTreatmentPlan = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/treatment-plans", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/treatment-plans/patient", patientId] });
      toast({
        title: "Success",
        description: "Treatment plan created successfully",
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    createTreatmentPlan.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="diagnosis"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("treatment.diagnosis")}</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="procedures"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("treatment.procedures")}</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  onChange={(e) =>
                    field.onChange(e.target.value.split("\n"))
                  }
                  value={Array.isArray(field.value) ? field.value.join("\n") : ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("treatment.cost")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={createTreatmentPlan.isPending}
        >
          {createTreatmentPlan.isPending
            ? "Creating..."
            : t("treatment.create")}
        </Button>
      </form>
    </Form>
  );
}
