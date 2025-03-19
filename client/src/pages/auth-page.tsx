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
      console.log("Patient registration successful");
    } catch (err) {
      console.error("Registration failed:", err);
      
      // If the error is about username/email already existing
      if (err instanceof Error && err.message.includes("already exists")) {
        registerForm.setError("username", { 
          type: "manual", 
          message: "This username already exists. Please choose another." 
        });
      } else if (err instanceof Error && err.message.includes("email")) {
        registerForm.setError("email", { 
          type: "manual", 
          message: "This email is already registered." 
        });
      } else {
        // Generic error handling
        const errorMessage = err instanceof Error ? err.message : "Registration failed. Please try again.";
        console.error("Registration error:", errorMessage);
        // Create a form error at the form level
        registerForm.setError("root", { 
          type: "manual", 
          message: errorMessage 
        });
      }
    }
  };

  const onProviderRegister = async (data: UserRegistrationData) => {
    console.log("Registering provider with data:", data);
    try {
      await register({
        ...data,
        role: "doctor"
      });
      console.log("Provider registration successful");
    } catch (err) {
      console.error("Registration failed:", err);
      
      // If the error is about username/email already existing
      if (err instanceof Error && err.message.includes("already exists")) {
        providerForm.setError("username", { 
          type: "manual", 
          message: "This username already exists. Please choose another." 
        });
      } else if (err instanceof Error && err.message.includes("email")) {
        providerForm.setError("email", { 
          type: "manual", 
          message: "This email is already registered." 
        });
      } else if (err instanceof Error && err.message.includes("license")) {
        providerForm.setError("licenseNumber", { 
          type: "manual", 
          message: "Please provide a valid professional license number." 
        });
      } else {
        // Generic error handling
        const errorMessage = err instanceof Error ? err.message : "Registration failed. Please try again.";
        console.error("Provider registration error:", errorMessage);
        providerForm.setError("root", { 
          type: "manual", 
          message: errorMessage 
        });
      }
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
      } else if (errorMessage.includes("username") || errorMessage.includes("already exists")) {
        staffForm.setError("username", { 
          type: "manual", 
          message: "This username already exists. Please choose another." 
        });
      } else if (errorMessage.includes("email")) {
        staffForm.setError("email", { 
          type: "manual", 
          message: "This email is already registered." 
        });
      } else {
        // Generic error handling
        console.error("Staff registration error:", errorMessage);
        staffForm.setError("root", { 
          type: "manual", 
          message: errorMessage 
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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-gray-800 to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Enhanced background with multiple gradient layers */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-800/20 via-indigo-900/10 to-gray-900/30 backdrop-blur-3xl"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.08),transparent_70%)]"></div>
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
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
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

        <Card className="w-full self-center bg-white/95 backdrop-blur-md shadow-[0_20px_60px_-15px_rgba(20,30,70,0.4)] rounded-xl border border-white/50 hover:border-white transition-all duration-300">
          <CardContent className="pt-8 px-8 pb-10 relative">
            {/* Subtle card pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0)_0%,rgba(255,255,255,0.4)_100%)] opacity-30 pointer-events-none rounded-xl"></div>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-3 mb-8 bg-white/80 backdrop-blur-sm rounded-xl shadow-md overflow-hidden border border-blue-100/50 p-1.5 gap-3">
                <TabsTrigger 
                  value="login" 
                  className="py-3 px-0 text-gray-700 text-sm tracking-wider data-[state=active]:bg-gradient-to-b data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white font-medium transition-all duration-200 hover:bg-blue-50/80 hover:text-blue-700 rounded-md"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger 
                  value="provider" 
                  className="py-3 px-0 text-gray-700 text-xs leading-tight tracking-wider data-[state=active]:bg-gradient-to-b data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white font-medium transition-all duration-200 hover:bg-blue-50/80 hover:text-blue-700 rounded-md"
                >
                  <div className="flex flex-col items-center">
                    <span>Provider</span>
                    <span className="text-[10px] opacity-70">Register</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="staff" 
                  className="py-3 px-0 text-gray-700 text-xs leading-tight tracking-wider data-[state=active]:bg-gradient-to-b data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white font-medium transition-all duration-200 hover:bg-blue-50/80 hover:text-blue-700 rounded-md"
                >
                  <div className="flex flex-col items-center">
                    <span>Staff</span>
                    <span className="text-[10px] opacity-70">Register</span>
                  </div>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(async (data) => {
                    try {
                      console.log("Attempting login for:", data.username);
                      await login(data.username, data.password);
                      console.log("Login successful");
                    } catch (err) {
                      console.error("Login failed:", err);
                      // Add a manual form error to show on the UI
                      loginForm.setError("password", {
                        type: "manual",
                        message: "Invalid username or password. Please try again."
                      });
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
                              className="h-12 px-4 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-3 focus:ring-blue-500/50 transition-all hover:border-blue-400 bg-white/95 text-gray-900 text-[15px] font-medium" 
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
                              className="h-12 px-4 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-3 focus:ring-blue-500/50 transition-all hover:border-blue-400 bg-white/95 text-gray-900 text-[15px] font-medium"
                              placeholder="Enter your password"
                            />
                          </FormControl>
                          <FormMessage />
                          <div className="mt-1 text-right">
                            <a href="#" className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">
                              Forgot Password?
                            </a>
                          </div>
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
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-3 h-14 rounded-lg transition-all duration-300 hover:shadow-xl hover:brightness-110 active:scale-[0.98] shadow-[0_4px_14px_0_rgba(59,130,246,0.4)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.6)] text-[16px]" 
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
                          <span className="flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            {t("auth.login")}
                          </span>
                        )}
                      </Button>
                    </div>
                    
                    <div className="mt-4 text-center">
                      <p className="text-sm text-gray-600">
                        Don't have an account? Select "Provider" or "Staff" to register
                      </p>
                    </div>
                  </form>
                </Form>
              </TabsContent>

              {/* Patient tab was removed as per the new workflow 
                  where patients are registered by providers/staff */}

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
                    
                    <FormField
                      control={staffForm.control}
                      name="licenseNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            <span className="flex items-center">
                              Provider's License Number
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter the license number of the provider you work for" />
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-gray-500 mt-1">
                            Required to verify your connection to a dental provider.
                          </p>
                        </FormItem>
                      )}
                    />
                    
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
                    
                    {/* Account information section */}
                    <div className="pt-2">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Account Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <FormField
                          control={providerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold text-gray-700">Username</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  className="h-12 px-4 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 transition-all hover:border-blue-400 bg-white/95"
                                  placeholder="Create a username"
                                />
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
                              <FormLabel className="text-sm font-semibold text-gray-700">Password</FormLabel>
                              <FormControl>
                                <Input 
                                  type="password" 
                                  {...field} 
                                  className="h-12 px-4 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 transition-all hover:border-blue-400 bg-white/95"
                                  placeholder="Create a strong password"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Contact information section */}
                    <div className="pt-2">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Contact Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={providerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold text-gray-700">Email</FormLabel>
                              <FormControl>
                                <Input 
                                  type="email" 
                                  {...field} 
                                  className="h-12 px-4 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 transition-all hover:border-blue-400 bg-white/95"
                                  placeholder="Your professional email"
                                />
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
                              <FormLabel className="text-sm font-semibold text-gray-700">Phone Number</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  className="h-12 px-4 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 transition-all hover:border-blue-400 bg-white/95"
                                  placeholder="Your phone number"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    {/* Professional information section */}
                    <div className="pt-2">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Professional Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={providerForm.control}
                          name="specialization"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold text-gray-700">Specialization</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  className="h-12 px-4 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 transition-all hover:border-blue-400 bg-white/95"
                                  placeholder="e.g., General Dentistry, Orthodontics"
                                />
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
                              <FormLabel className="text-sm font-semibold text-gray-700">License Number *</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  className="h-12 px-4 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 transition-all hover:border-blue-400 bg-white/95"
                                  placeholder="Format: AB123456"
                                  required
                                />
                              </FormControl>
                              <FormMessage />
                              <p className="text-xs text-gray-500 mt-1">Required for verification purposes.</p>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    {/* Terms and conditions */}
                    <div className="mt-2">
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="terms"
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="terms" className="font-medium text-gray-700">
                            I agree to the 
                            <a href="#" className="text-blue-600 hover:text-blue-800"> Terms of Service</a>
                            {' '}and{' '}
                            <a href="#" className="text-blue-600 hover:text-blue-800">Privacy Policy</a>
                          </label>
                        </div>
                      </div>
                    </div>
                    
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
                        "Register as Provider"
                      )}
                    </Button>
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