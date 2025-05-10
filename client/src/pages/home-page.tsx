import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { LoadingAnimation } from "@/components/ui/loading-animation";

export default function HomePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirect to appointments page as soon as component mounts
    if (user) {
      setLocation("/appointments");
    }
  }, [user, setLocation]);

  return (
    <div className="flex h-screen items-center justify-center">
      <LoadingAnimation className="w-12 h-12" />
      <span className="ml-2 text-lg">Redirecting to scheduler...</span>
    </div>
  );
}