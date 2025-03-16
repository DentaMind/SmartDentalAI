import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { AIRecommendations } from "../components/ai/ai-recommendations";

export default function AIRecommendationsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Only show to authorized staff
  if (!user) {
    return <Redirect to="/login" />;
  }

  if (user.role !== 'doctor' && user.role !== 'admin') {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Access Restricted</h1>
        <p className="mt-2 text-gray-600">
          You do not have permission to access AI recommendations. This area is restricted to doctors and administrators.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        <p className="mt-4 text-gray-600">Loading AI recommendations...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <AIRecommendations />
    </div>
  );
}