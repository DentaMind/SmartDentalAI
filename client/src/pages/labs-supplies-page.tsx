import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LabsManager } from "@/components/labs/labs-manager";
import { SuppliesManager } from "@/components/supplies/supplies-manager";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Beaker, ShoppingCart } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";

export function LabsSuppliesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("lab-cases");
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Check if user has appropriate role to access this page
    if (user?.role === "doctor" || user?.role === "staff") {
      setIsAuthorized(true);
    }
  }, [user]);

  if (!isAuthorized) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You do not have permission to access this page.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <PageHeader 
          title="Labs & Supplies Management"
          description="Manage dental lab cases and inventory supplies"
          icon={activeTab === "lab-cases" ? <Beaker className="h-6 w-6" /> : <ShoppingCart className="h-6 w-6" />}
        />

        <Tabs 
          defaultValue="lab-cases" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="lab-cases">Lab Cases</TabsTrigger>
            <TabsTrigger value="supplies">Supplies</TabsTrigger>
          </TabsList>
          
          <TabsContent value="lab-cases" className="mt-6">
            <LabsManager />
          </TabsContent>
          
          <TabsContent value="supplies" className="mt-6">
            <SuppliesManager />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

export default LabsSuppliesPage;