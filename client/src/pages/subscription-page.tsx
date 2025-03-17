import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AIAssistant } from "@/components/ui/ai-assistant";
import { ArrowLeft, ArrowRight, Check, CreditCard, Sparkles, Stethoscope, Shield, CalendarDays, Users } from "lucide-react";

const subscriptionPlans = [
  {
    id: "basic",
    name: "Basic Plan",
    price: 99,
    billingCycle: "monthly",
    maxProviders: 1,
    maxPatients: 500,
    features: [
      "Single provider",
      "Up to 500 patients",
      "Basic AI diagnostics",
      "Email support"
    ]
  },
  {
    id: "professional",
    name: "Professional Plan",
    price: 199,
    billingCycle: "monthly",
    maxProviders: 3,
    maxPatients: 2000,
    features: [
      "Up to 3 providers",
      "Up to 2,000 patients",
      "Advanced AI diagnostics",
      "SMS & Email reminders",
      "Priority support"
    ]
  },
  {
    id: "enterprise",
    name: "Enterprise Plan",
    price: 349,
    billingCycle: "monthly",
    maxProviders: -1, // unlimited
    maxPatients: -1, // unlimited
    features: [
      "Unlimited providers",
      "Unlimited patients",
      "Premium AI features",
      "Multi-location support",
      "Dedicated account manager",
      "Custom integrations"
    ]
  }
];

const subscriptionSchema = z.object({
  planId: z.string().min(1, "Please select a plan"),
  practiceId: z.string().min(1, "Practice ID is required"),
  practiceName: z.string().min(1, "Practice name is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  cardNumber: z.string().regex(/^\d{16}$/, "Card number must be 16 digits"),
  cardExpiry: z.string().regex(/^\d{2}\/\d{2}$/, "Expiry must be in MM/YY format"),
  cardCvc: z.string().regex(/^\d{3,4}$/, "CVC must be 3 or 4 digits"),
  billingAddress: z.string().min(1, "Billing address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "ZIP code is required"),
  country: z.string().min(1, "Country is required"),
  autoRenew: z.boolean().default(true),
});

type FormValues = z.infer<typeof subscriptionSchema>;

export default function SubscriptionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [step, setStep] = useState<'plan' | 'payment'>('plan');

  const form = useForm<FormValues>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      planId: "",
      practiceId: "",
      practiceName: "",
      paymentMethod: "credit_card",
      cardNumber: "",
      cardExpiry: "",
      cardCvc: "",
      billingAddress: "",
      city: "",
      state: "",
      zipCode: "",
      country: "US",
      autoRenew: true,
    },
  });

  // Handle plan selection
  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    form.setValue("planId", planId);
  };

  // Continue to payment step
  const handleContinueToPayment = () => {
    if (!selectedPlan) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a subscription plan to continue",
      });
      return;
    }
    setStep('payment');
    window.scrollTo(0, 0);
  };

  // Go back to plan selection
  const handleBackToPlan = () => {
    setStep('plan');
    window.scrollTo(0, 0);
  };

  // Complete subscription mutation
  const completeMutation = useMutation({
    mutationFn: (data: FormValues) => 
      apiRequest('/api/subscription', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({
        title: "Subscription Complete",
        description: "Your subscription has been activated successfully!",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to complete subscription: ${error.message}`,
      });
    }
  });

  // Form submission
  const onSubmit = (data: FormValues) => {
    completeMutation.mutate(data);
  };

  // Placeholder for feature icon
  const getFeatureIcon = (feature: string) => {
    if (feature.includes("provider")) return Users;
    if (feature.includes("patient")) return Users;
    if (feature.includes("AI")) return Sparkles;
    if (feature.includes("support")) return Shield;
    return Check;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center mb-4">
            <div className="p-2 rounded-xl bg-primary text-white shadow-lg">
              <Stethoscope className="h-8 w-8" />
            </div>
            <h1 className="ml-3 text-3xl font-bold text-primary">DentaMind</h1>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            {step === 'plan' ? 'Choose Your Subscription Plan' : 'Complete Your Subscription'}
          </h2>
          <p className="mt-2 text-gray-600">
            {step === 'plan' 
              ? 'Select the plan that best fits your practice needs'
              : 'Enter your payment details to activate your subscription'
            }
          </p>
        </div>

        {step === 'plan' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {subscriptionPlans.map((plan) => (
              <Card 
                key={plan.id}
                className={`overflow-hidden ${selectedPlan === plan.id ? 'ring-2 ring-primary' : 'border'}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription>
                        {plan.maxProviders === -1 ? 'Unlimited providers' : `Up to ${plan.maxProviders} provider${plan.maxProviders > 1 ? 's' : ''}`}
                      </CardDescription>
                    </div>
                    {selectedPlan === plan.id && (
                      <Badge className="bg-primary text-white">Selected</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="mb-4">
                    <span className="text-3xl font-bold">${plan.price}</span>
                    <span className="text-gray-500">/{plan.billingCycle}</span>
                  </div>
                  <ul className="space-y-2">
                    {plan.features.map((feature, idx) => {
                      const Icon = getFeatureIcon(feature);
                      return (
                        <li key={idx} className="flex items-start">
                          <Icon className="h-5 w-5 text-primary mr-2 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
                <CardFooter className="pt-3">
                  <Button 
                    className="w-full" 
                    variant={selectedPlan === plan.id ? "default" : "outline"}
                    onClick={() => handlePlanSelect(plan.id)}
                  >
                    {selectedPlan === plan.id ? "Selected" : "Select Plan"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {step === 'plan' && selectedPlan && (
          <div className="flex justify-center mt-6">
            <Button 
              size="lg" 
              onClick={handleContinueToPayment}
              className="flex items-center px-6"
            >
              Continue to Payment
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {step === 'payment' && (
          <Card className="mx-auto">
            <CardHeader>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBackToPlan}
                className="w-fit flex items-center mb-4"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to Plans
              </Button>
              <CardTitle>Payment Information</CardTitle>
              <CardDescription>
                Enter your billing details to complete subscription
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 p-4 bg-blue-50 rounded-lg flex items-start">
                <Sparkles className="h-5 w-5 text-blue-500 mt-0.5 mr-2" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">
                    You've selected: {subscriptionPlans.find(p => p.id === selectedPlan)?.name}
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    ${subscriptionPlans.find(p => p.id === selectedPlan)?.price}/{subscriptionPlans.find(p => p.id === selectedPlan)?.billingCycle}
                  </p>
                </div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Practice Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="practiceName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Practice Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="practiceId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Practice ID/Tax ID</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Payment Method</h3>
                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Method</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select payment method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="credit_card">Credit Card</SelectItem>
                              <SelectItem value="ach" disabled>ACH Bank Transfer (Coming Soon)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch("paymentMethod") === "credit_card" && (
                      <div className="space-y-4 p-4 border rounded-lg">
                        <FormField
                          control={form.control}
                          name="cardNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Card Number</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="1234 5678 9012 3456"
                                  onChange={(e) => {
                                    // Keep only digits
                                    const value = e.target.value.replace(/\D/g, '');
                                    if (value.length <= 16) {
                                      field.onChange(value);
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="cardExpiry"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Expiry Date</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field}
                                    placeholder="MM/YY"
                                    onChange={(e) => {
                                      const input = e.target.value.replace(/\D/g, '');
                                      let formatted = '';
                                      
                                      if (input.length <= 2) {
                                        formatted = input;
                                      } else {
                                        formatted = `${input.slice(0, 2)}/${input.slice(2, 4)}`;
                                      }
                                      
                                      field.onChange(formatted);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="cardCvc"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>CVC</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field}
                                    placeholder="123"
                                    onChange={(e) => {
                                      const value = e.target.value.replace(/\D/g, '');
                                      if (value.length <= 4) {
                                        field.onChange(value);
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Billing Address</h3>
                    <FormField
                      control={form.control}
                      name="billingAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="zipCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ZIP Code</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="US">United States</SelectItem>
                              <SelectItem value="CA">Canada</SelectItem>
                              <SelectItem value="UK">United Kingdom</SelectItem>
                              <SelectItem value="AU">Australia</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="autoRenew"
                      checked={form.watch("autoRenew")}
                      onChange={() => 
                        form.setValue("autoRenew", !form.watch("autoRenew"))
                      }
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="autoRenew" className="text-sm text-gray-700">
                      Enable auto-renewal for uninterrupted service
                    </label>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full flex items-center justify-center py-6" 
                    size="lg"
                    disabled={completeMutation.isPending}
                  >
                    <CreditCard className="mr-2 h-5 w-5" />
                    {completeMutation.isPending ? "Processing..." : "Complete Subscription"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </div>
      
      <AIAssistant contextType="provider" initialSuggestions={[
        "What plan is right for my practice?",
        "Can I change plans later?",
        "How does billing work?"
      ]} />
    </div>
  );
}