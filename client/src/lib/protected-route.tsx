import { useAuth } from "@/hooks/use-auth";
import { Redirect, Route, useLocation } from "wouter";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import { useEffect } from "react";
import dentaMindLogo from "../assets/dentamind-logo.png";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading, refreshAuth } = useAuth();
  const [location] = useLocation();
  
  // Attempt to refresh authentication when component mounts or path changes
  useEffect(() => {
    // Only attempt to refresh if we're on this route path and not already authenticated
    if (location === path && !user && !isLoading) {
      console.log(`[protected-route] Attempting to refresh authentication for path: ${path}`);
      refreshAuth().catch(error => {
        console.error("[protected-route] Auth refresh failed:", error);
      });
    }
  }, [path, location, user, isLoading, refreshAuth]);

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gradient-to-b from-blue-900 to-gray-900 relative overflow-hidden">
          {/* Subtle animated pattern background */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px] animate-slow-pulse"></div>
          </div>
          
          {/* Logo with subtle glow effect */}
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full blur-md bg-blue-500/20 animate-pulse"></div>
            <img 
              src={dentaMindLogo} 
              alt="DentaMind Logo" 
              className="h-24 w-auto relative z-10 drop-shadow-lg"
            />
          </div>
          
          <LoadingAnimation className="mb-4" />
          
          <div className="flex flex-col items-center space-y-2">
            <p className="text-blue-400 font-medium text-lg animate-pulse">Initializing AI Systems...</p>
            
            {/* Progress bar */}
            <div className="w-64 h-1.5 bg-gray-700 rounded-full overflow-hidden mt-2">
              <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 animate-loading-progress rounded-full"></div>
            </div>
            
            <p className="text-gray-400 text-sm mt-1">Preparing your experience</p>
          </div>
        </div>
      </Route>
    );
  }

  if (!user) {
    // Prevent redirect loops by checking if already on auth page
    const isAuthPage = location.startsWith("/auth");
    if (!isAuthPage && sessionStorage.getItem("inAuthPage") !== "true") {
      // Store where we're redirecting from for post-login redirection
      sessionStorage.setItem("redirectedFrom", path);
      console.log(`[protected-route] Redirecting to auth page from: ${path}`);
      
      return (
        <Route path={path}>
          <Redirect to="/auth" />
        </Route>
      );
    } else {
      console.log("[protected-route] Skipping redirect to prevent loop");
      return (
        <Route path={path}>
          <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gradient-to-b from-blue-900 to-gray-900 relative overflow-hidden">
            {/* Subtle animated pattern background */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]"></div>
            </div>
            
            {/* Logo with subtle glow effect */}
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full blur-md bg-blue-500/20"></div>
              <img 
                src={dentaMindLogo} 
                alt="DentaMind Logo" 
                className="h-24 w-auto relative z-10 drop-shadow-lg"
              />
            </div>
            
            <p className="text-white text-lg font-medium mb-2">Authentication Required</p>
            <p className="text-blue-300">Please log in to access this page.</p>
          </div>
        </Route>
      );
    }
  }

  // User is authenticated, render the protected component
  return <Route path={path} component={Component} />
}