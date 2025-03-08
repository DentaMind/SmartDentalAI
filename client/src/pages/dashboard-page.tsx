import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { UnifiedDashboard } from "@/components/dashboard/unified-dashboard";

export default function DashboardPage() {
  const { user } = useAuth();
  
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <UnifiedDashboard userRole={user?.role} />
      </main>
    </div>
  );
}