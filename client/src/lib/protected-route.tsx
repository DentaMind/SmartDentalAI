import { useAuth } from "@/hooks/use-auth";
import { Redirect, Route, useLocation } from "wouter";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import { useEffect } from "react";

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
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gradient-to-b from-blue-50 to-white">
          <img 
            src="/images/dentamind-logo.webp" 
            alt="DentaMind Logo" 
            className="h-16 w-auto mb-4"
          />
          <LoadingAnimation />
          <p className="text-gray-600 animate-pulse">Loading DentaMind...</p>
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
          <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gradient-to-b from-blue-50 to-white">
            <img 
              src="/images/dentamind-logo.webp" 
              alt="DentaMind Logo" 
              className="h-16 w-auto mb-4"
            />
            <p className="text-red-600">Please log in to access this page.</p>
          </div>
        </Route>
      );
    }
  }

  // User is authenticated, render the protected component
  return <Route path={path} component={Component} />
}