import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from 'react';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Redirect } from "wouter";
import dentaMindLogo from "../assets/dentamind-logo-new.jpg";

// Define a simple login schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Define a simple provider schema
const providerSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email"),
  specialization: z.string().optional(),
  licenseNumber: z.string().optional(),
});

export default function SimpleAuthPage() {
  const { user, login, register, isLoading, error } = useAuth();
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("Invalid username or password. Please try again.");
  const [currentTab, setCurrentTab] = useState<'login' | 'provider'>('login');

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const providerForm = useForm({
    resolver: zodResolver(providerSchema),
    defaultValues: {
      username: "",
      password: "",
      firstName: "",
      lastName: "",
      email: "",
      specialization: "General Dentist",
      licenseNumber: "",
    },
  });

  const onLogin = async (data: any) => {
    setShowError(false);
    try {
      await login(data);
    } catch (err) {
      console.error("Login failed:", err);
      setErrorMessage("Invalid username or password. Please try again.");
      setShowError(true);
    }
  };

  const onProviderRegister = async (data: any) => {
    setShowError(false);
    try {
      // Create a provider account
      await register({
        ...data,
        role: "doctor"
      });
      // Auto-login after registration
      await login({
        username: data.username,
        password: data.password
      });
    } catch (err) {
      console.error("Provider registration failed:", err);
      setErrorMessage(err instanceof Error ? err.message : "Registration failed. Please try again.");
      setShowError(true);
    }
  };

  // Clear redirect flag when landing on auth page
  useEffect(() => {
    sessionStorage.removeItem("inAuthPage");
    console.log("Auth page loaded, redirect flag cleared");
  }, []);

  if (user) {
    const redirectTo = sessionStorage.getItem("redirectedFrom") || "/";
    sessionStorage.removeItem("redirectedFrom");
    return <Redirect to={redirectTo} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{backgroundColor: '#28C76F'}}>
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <img 
            src={dentaMindLogo} 
            alt="DentaMind Logo" 
            className="h-20 w-20 mb-4 rounded-full"
          />
          <h1 className="text-2xl font-bold text-gray-800">DentaMind</h1>
          <p className="text-gray-600 mt-1">AI-Powered Dental Excellence</p>
        </div>
        
        {showError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{errorMessage}</p>
          </div>
        )}
        
        {/* Tab selection */}
        <div className="flex mb-4 border-b">
          <button 
            className={`px-4 py-2 ${currentTab === 'login' ? 'text-green-600 border-b-2 border-green-600 font-medium' : 'text-gray-500'}`}
            onClick={() => setCurrentTab('login')}
          >
            Login
          </button>
          <button 
            className={`px-4 py-2 ${currentTab === 'provider' ? 'text-green-600 border-b-2 border-green-600 font-medium' : 'text-gray-500'}`}
            onClick={() => setCurrentTab('provider')}
          >
            Provider Signup
          </button>
        </div>
        
        {/* Login form */}
        {currentTab === 'login' && (
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
              <FormField
                control={loginForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your username" {...field} />
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <PasswordInput placeholder="Enter your password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full"
                style={{backgroundColor: '#28C76F'}}
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
              
              <div className="text-center mt-4">
                <p className="text-sm text-gray-600">
                  Test accounts: dentist/password, drabdin/password
                </p>
              </div>
            </form>
          </Form>
        )}
        
        {/* Provider registration form */}
        {currentTab === 'provider' && (
          <Form {...providerForm}>
            <form onSubmit={providerForm.handleSubmit(onProviderRegister)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={providerForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="First name" {...field} />
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
                        <Input placeholder="Last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={providerForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Your email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={providerForm.control}
                name="specialization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specialization</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., General Dentist, Orthodontist" {...field} />
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
                    <FormLabel>License Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Professional license number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={providerForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Choose a username" {...field} />
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
                      <PasswordInput placeholder="Choose a password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full"
                style={{backgroundColor: '#28C76F'}}
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Create Provider Account"}
              </Button>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
}