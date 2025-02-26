import { useAuth } from "@/hooks/use-auth";
import { Redirect, Route } from "wouter";
import { LoadingAnimation } from "@/components/ui/loading-animation";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gradient-to-b from-blue-50 to-white">
          <LoadingAnimation />
          <p className="text-gray-600 animate-pulse">Loading Smart Dental AI...</p>
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />
}