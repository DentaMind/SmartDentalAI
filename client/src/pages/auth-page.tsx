import { useAuth } from "@/hooks/use-auth";
import { useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Redirect } from "wouter";
import dentalSmile from "../../../attached_assets/iStock-526222203.jpg";

type UserRegistrationData = {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  specialization?: string;
  licenseNumber?: string;
};

export default function AuthPage() {
  const { t } = useTranslation();
  const { user, login, register, isLoading, error } = useAuth();
  
  const staffForm = useForm<UserRegistrationData>({
    resolver: zodResolver(
      insertUserSchema.omit({ 
        role: true,
        language: true,
        insuranceProvider: true,
        insuranceNumber: true
      })
    ),
    defaultValues: {
      username: "",
      password: "",
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      specialization: "Staff",
      licenseNumber: "",
    },
  });

  const loginForm = useForm({
    resolver: zodResolver(insertUserSchema.pick({ username: true, password: true })),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<UserRegistrationData>({
    resolver: zodResolver(
      insertUserSchema.omit({ 
        role: true, 
        language: true,
        specialization: true,
        licenseNumber: true
      })
    ),
    defaultValues: {
      username: "",
      password: "",
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      dateOfBirth: "",
      insuranceProvider: "",
      insuranceNumber: "",
    },
  });

  const providerForm = useForm<UserRegistrationData>({
    resolver: zodResolver(
      insertUserSchema.omit({ 
        role: true,
        language: true,
        insuranceProvider: true,
        insuranceNumber: true
      })
    ),
    defaultValues: {
      username: "",
      password: "",
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      specialization: "",
      licenseNumber: "",
    },
  });

  const onRegister = async (data: UserRegistrationData) => {
    console.log("Registering patient with data:", data);
    try {
      await register({
        ...data,
        role: "patient"
      });
    } catch (err) {
      console.error("Registration failed:", err);
    }
  };

  const onProviderRegister = async (data: UserRegistrationData) => {
    console.log("Registering provider with data:", data);
    try {
      await register({
        ...data,
        role: "doctor"
      });
    } catch (err) {
      console.error("Registration failed:", err);
    }
  };
  
  const onStaffRegister = async (data: UserRegistrationData) => {
    console.log("Registering staff with data:", data);
    
    // Verify the license number is in proper format
    const licenseNumberRegex = /^[A-Z]{2}\d{6}$/;
    if (data.licenseNumber && !licenseNumberRegex.test(data.licenseNumber)) {
      staffForm.setError("licenseNumber", { 
        type: "manual", 
        message: "License number must be in format: 2 letters followed by 6 digits (e.g., AB123456)" 
      });
      return;
    }
    
    try {
      // In a real implementation, we would first verify the license number with a database
      // before allowing registration
      await register({
        ...data,
        role: "staff"
      });
    } catch (err) {
      console.error("Registration failed:", err);
      
      // Handle specific error for invalid license
      const errorMessage = err instanceof Error ? err.message : "Registration failed";
      if (errorMessage.includes("license")) {
        staffForm.setError("licenseNumber", { 
          type: "manual", 
          message: "License number not found in our system. Please contact administration." 
        });
      }
    }
  };

  // Clear redirect flag when landing on auth page
  useEffect(() => {
    sessionStorage.removeItem("inAuthPage");
    console.log("Auth page loaded, redirect flag cleared");
    
    // Get redirected path for better user experience
    const redirectedFrom = sessionStorage.getItem("redirectedFrom");
    if (redirectedFrom) {
      console.log("User was redirected from:", redirectedFrom);
    }
  }, []);

  if (user) {
    const redirectTo = sessionStorage.getItem("redirectedFrom") || "/";
    sessionStorage.removeItem("redirectedFrom");
    return <Redirect to={redirectTo} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8">
        <div className="flex flex-col justify-center space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-1 rounded-xl shadow-lg hover:scale-105 transition-transform duration-300">
              <img 
                src="/assets/smartdental_logo.svg" 
                alt="SmartDental AI Logo" 
                className="h-16 w-auto"
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-4xl font-bold tracking-tight text-primary">
                SmartDental AI
              </h1>
              <span className="text-sm text-gray-500 font-medium">
                AI-Powered Care
              </span>
            </div>
          </div>
          <p className="text-xl text-gray-600">
            Experience next-generation dental care with AI assistance and advanced patient management.
          </p>
          <div className="relative mt-8 rounded-2xl overflow-hidden shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5"></div>
            <img 
              src={dentalSmile}
              alt="Professional dental clinic" 
              className="w-full h-[300px] object-cover"
            />
          </div>
        </div>

        <Card className="w-full self-center bg-white shadow-lg">
          <CardContent className="pt-6">
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="provider" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                  Provider Sign Up
                </TabsTrigger>
                <TabsTrigger value="staff" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                  Staff Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                    {error}
                  </div>
                )}
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(async (data) => {
                    try {
                      await login(data.username, data.password);
                    } catch (err) {
                      console.error("Login failed:", err);
                    }
                  })} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("auth.username")}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("auth.password")}</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isLoading}
                    >
                      {isLoading ? t("common.loading") : t("auth.login")}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("auth.username")}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("auth.password")}</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="insuranceProvider"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Insurance Provider</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="insuranceNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Insurance Number</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isLoading}
                    >
                      {isLoading ? t("common.loading") : t("auth.register")}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="staff">
                <div className="mb-4 p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700">
                    Sign up as staff member to assist with patient management, scheduling, and administrative tasks.
                  </p>
                </div>
                <Form {...staffForm}>
                  <form onSubmit={staffForm.handleSubmit(onStaffRegister)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={staffForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={staffForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={staffForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={staffForm.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={staffForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={staffForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-green-600 hover:bg-green-700" 
                      disabled={isLoading}
                    >
                      {isLoading ? t("common.loading") : "Register as Staff"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="provider">
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    Sign up as a dental provider to access all SmartDental AI features. License number is required for verification.
                  </p>
                </div>
                <Form {...providerForm}>
                  <form onSubmit={providerForm.handleSubmit(onProviderRegister)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={providerForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={providerForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={providerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={providerForm.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={providerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={providerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={providerForm.control}
                        name="specialization"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Specialization</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., General Dentistry, Orthodontics" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={providerForm.control}
                        name="licenseNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>License Number *</FormLabel>
                            <FormControl>
                              <Input {...field} required />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="mt-8 border-t pt-6">
                      <h3 className="text-lg font-medium mb-4">Subscription Plan</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="border rounded-lg p-4 hover:border-primary hover:bg-blue-50 cursor-pointer relative">
                          <input type="radio" name="plan" className="absolute right-2 top-2" defaultChecked />
                          <h4 className="font-medium mb-1">Basic</h4>
                          <p className="text-xl font-bold mb-2">$499<span className="text-sm font-normal">/month</span></p>
                          <ul className="text-sm space-y-1 text-gray-600">
                            <li>• Up to 500 patients</li>
                            <li>• Basic AI diagnostics</li>
                            <li>• Email support</li>
                          </ul>
                        </div>
                        <div className="border rounded-lg p-4 hover:border-primary hover:bg-blue-50 cursor-pointer relative">
                          <input type="radio" name="plan" className="absolute right-2 top-2" />
                          <h4 className="font-medium mb-1">Professional</h4>
                          <p className="text-xl font-bold mb-2">$699<span className="text-sm font-normal">/month</span></p>
                          <ul className="text-sm space-y-1 text-gray-600">
                            <li>• Unlimited patients</li>
                            <li>• Advanced AI tools</li>
                            <li>• Priority support</li>
                          </ul>
                        </div>
                        <div className="border rounded-lg p-4 hover:border-primary hover:bg-blue-50 cursor-pointer relative">
                          <input type="radio" name="plan" className="absolute right-2 top-2" />
                          <h4 className="font-medium mb-1">Enterprise</h4>
                          <p className="text-xl font-bold mb-2">$1499<span className="text-sm font-normal">/month</span></p>
                          <ul className="text-sm space-y-1 text-gray-600">
                            <li>• Multi-location support</li>
                            <li>• Full AI suite access</li>
                            <li>• 24/7 dedicated support</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium mb-4">Payment Method</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormItem>
                            <FormLabel>Card Number</FormLabel>
                            <FormControl>
                              <Input placeholder="•••• •••• •••• ••••" />
                            </FormControl>
                          </FormItem>
                          <div className="grid grid-cols-2 gap-4">
                            <FormItem>
                              <FormLabel>Expiry Date</FormLabel>
                              <FormControl>
                                <Input placeholder="MM/YY" />
                              </FormControl>
                            </FormItem>
                            <FormItem>
                              <FormLabel>CVC</FormLabel>
                              <FormControl>
                                <Input placeholder="•••" />
                              </FormControl>
                            </FormItem>
                          </div>
                        </div>
                        <FormItem>
                          <FormLabel>Cardholder Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Name as it appears on card" />
                          </FormControl>
                        </FormItem>
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full mt-6" 
                      disabled={isLoading}
                    >
                      {isLoading ? "Processing..." : "Complete Sign Up & Subscribe"}
                    </Button>
                    <p className="text-center text-xs text-gray-500 mt-2">
                      By signing up, you agree to our Terms of Service and Privacy Policy
                    </p>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}