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
// Import the logo directly to avoid potential issues
import dentaMindLogo from "../assets/dentamind-logo.png";
// Import smile images
import dentalSmile from "../assets/dental-smile.jpg";
import smileImage from "../assets/iStock-526222203.jpg";

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
    <div className="min-h-screen bg-gradient-to-b from-gray-800 to-gray-700 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle background gradient pattern - lightened for better contrast */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-800/10 via-gray-800/80 to-gray-800/80"></div>
      </div>
      
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-10 mx-auto">
        <div className="flex flex-col justify-center space-y-6 relative">
          <div className="flex flex-col items-center mb-4">
            {/* Enhanced logo with subtle glow effect - increased size */}
            <div className="flex items-center justify-center mb-2 relative">
              <div className="absolute inset-0 rounded-full blur-md bg-blue-500/10"></div>
              <img 
                src={dentaMindLogo} 
                alt="DentaMind Logo" 
                className="h-40 w-auto drop-shadow-lg relative z-10"
              />
            </div>
            <h1 className="text-4xl font-bold text-white mt-3 mb-3 font-sans tracking-wider">
              DentaMind
            </h1>
            <p className="text-lg text-blue-100 mt-2 text-center max-w-md leading-relaxed">
              Transforming dental practices with AI-driven diagnostics and intelligent patient management
            </p>
          </div>
          <div className="mt-4 space-y-6">
            {/* Enhanced info box with gradient and shadow */}
            <div className="bg-gradient-to-r from-blue-500/15 to-cyan-500/15 p-6 rounded-xl border border-blue-300/20 shadow-lg backdrop-blur-sm">
              <h3 className="font-semibold text-blue-300 text-lg flex items-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812a3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                AI-Powered Clinical Intelligence
              </h3>
              <p className="text-gray-100">Advanced diagnostic assistance, treatment planning, and clinical decision support powered by our specialized multi-domain AI system.</p>
            </div>
            
            {/* Improved image container with vibrant display - NO overlay to ensure bright teeth */}
            <div className="relative rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
              <img 
                src={smileImage}
                alt="Beautiful dental smile" 
                className="w-full h-[240px] object-cover brightness-125 contrast-110"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-900/40 to-transparent p-5">
                <p className="text-white text-sm font-medium drop-shadow-sm">Achieve perfect smiles with our advanced AI-powered dentistry</p>
              </div>
            </div>
          </div>
        </div>

        <Card className="w-full self-center bg-white shadow-[0_20px_60px_-15px_rgba(20,30,70,0.3)] rounded-xl border border-gray-100">
          <CardContent className="pt-8 px-8 pb-10">
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-4 mb-8 bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 p-1 gap-1">
                <TabsTrigger 
                  value="login" 
                  className="py-3 px-1 text-gray-700 data-[state=active]:bg-gradient-to-b data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white font-medium transition-all duration-200 hover:bg-blue-50/80 hover:text-blue-700 rounded-md"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger 
                  value="patient" 
                  className="py-3 px-1 text-gray-700 data-[state=active]:bg-gradient-to-b data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white font-medium transition-all duration-200 hover:bg-blue-50/80 hover:text-blue-700 rounded-md"
                >
                  Patient Sign Up
                </TabsTrigger>
                <TabsTrigger 
                  value="provider" 
                  className="py-3 px-1 text-gray-700 data-[state=active]:bg-gradient-to-b data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white font-medium transition-all duration-200 hover:bg-blue-50/80 hover:text-blue-700 rounded-md"
                >
                  Provider Sign Up
                </TabsTrigger>
                <TabsTrigger 
                  value="staff" 
                  className="py-3 px-1 text-gray-700 data-[state=active]:bg-gradient-to-b data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white font-medium transition-all duration-200 hover:bg-blue-50/80 hover:text-blue-700 rounded-md"
                >
                  Staff Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
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
                  })} className="space-y-8">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-gray-700">{t("auth.username")}</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              className="h-12 px-4 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all hover:border-blue-400 bg-white text-gray-900" 
                              placeholder="Enter your username"
                            />
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
                          <FormLabel className="text-sm font-semibold text-gray-700">{t("auth.password")}</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              {...field} 
                              className="h-12 px-4 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all hover:border-blue-400 bg-white text-gray-900"
                              placeholder="Enter your password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="remember-me"
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                        Remember me
                      </label>
                    </div>
                    
                    <div className="pt-4">
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-3 h-12 rounded-lg transition-all duration-300 hover:shadow-xl active:scale-[0.98] shadow-[0_4px_14px_0_rgba(59,130,246,0.4)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.6)]" 
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {t("common.loading")}
                          </span>
                        ) : (
                          t("auth.login")
                        )}
                      </Button>
                    </div>
                    
                    <div className="mt-4 text-center">
                      <p className="text-sm text-gray-600">
                        Don't have an account? Select "Patient Sign Up", "Provider Sign Up", or "Staff Sign Up"
                      </p>
                    </div>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="patient">
                <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-100">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">Patient Registration</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Register as a patient to access your dental records, appointment scheduling, and personalized care plans.
                      </p>
                    </div>
                  </div>
                </div>
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
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-3 h-12 rounded-lg transition-all duration-300 hover:shadow-xl active:scale-[0.98] shadow-[0_4px_14px_0_rgba(59,130,246,0.3)] hover:shadow-[0_6px_16px_rgba(59,130,246,0.5)]" 
                      disabled={isLoading}
                    >
                      {isLoading ? t("common.loading") : t("auth.register")}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="staff">
                <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">Staff Registration</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Sign up as staff member to assist with patient management, scheduling, and administrative tasks.
                      </p>
                    </div>
                  </div>
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
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-3 h-12 rounded-lg transition-all duration-300 hover:shadow-xl active:scale-[0.98] shadow-[0_4px_14px_0_rgba(59,130,246,0.3)] hover:shadow-[0_6px_16px_rgba(59,130,246,0.5)]" 
                      disabled={isLoading}
                    >
                      {isLoading ? t("common.loading") : "Register as Staff"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="provider">
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-100">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">Provider Registration</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Register as a dental professional to access all DentaMind features including AI diagnostics and advanced treatment planning. License number is required for verification.
                      </p>
                    </div>
                  </div>
                </div>
                <Form {...providerForm}>
                  <form onSubmit={providerForm.handleSubmit(onProviderRegister)} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FormField
                        control={providerForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-gray-700">First Name</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="h-12 px-4 rounded-lg border-gray-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400/20 transition-all"
                                placeholder="Enter first name"
                              />
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
                            <FormLabel className="text-sm font-semibold text-gray-700">Last Name</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="h-12 px-4 rounded-lg border-gray-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400/20 transition-all"
                                placeholder="Enter last name"
                              />
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
                      className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-3 h-12 rounded-lg transition-all duration-300 hover:shadow-xl active:scale-[0.98] shadow-[0_4px_14px_0_rgba(59,130,246,0.3)] hover:shadow-[0_6px_16px_rgba(59,130,246,0.5)]" 
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