import React from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Components
import EPrescriptionManager from "@/components/prescriptions/e-prescription-manager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

// Icons
import { 
  FilePlus, 
  Pill, 
  Clock, 
  Search, 
  RefreshCw,
  ClipboardList,
  UserRound,
  Building
} from "lucide-react";

export default function PrescriptionsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState("e-prescriptions");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Get current user - we'll use this to determine if user is a doctor
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['/user'],
    queryFn: () => apiRequest('/user')
  });

  const isDoctor = user?.role === 'doctor';

  return (
    <div className="container py-6 space-y-6">

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Pill className="h-7 w-7 text-primary" />
            {t("Prescription Management")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("Manage and track patient prescriptions, both electronic and printed")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-[260px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("Search prescriptions...")}
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {isDoctor && (
            <Button className="flex items-center gap-2">
              <FilePlus className="h-4 w-4" />
              {t("New Prescription")}
            </Button>
          )}
        </div>
      </div>

      <Separator />

      <Tabs defaultValue="e-prescriptions" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            <TabsTrigger value="e-prescriptions" className="flex items-center gap-2">
              <Pill className="h-4 w-4" />
              {t("E-Prescriptions")}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t("Prescription History")}
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              {t("Templates")}
            </TabsTrigger>
            <TabsTrigger value="pharmacies" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              {t("Pharmacy Directory")}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="e-prescriptions" className="space-y-6 mt-0">
          <EPrescriptionManager />
        </TabsContent>
        
        <TabsContent value="history" className="space-y-6 mt-0">
          <Card>
            <CardHeader>
              <CardTitle>{t("Prescription History")}</CardTitle>
              <CardDescription>
                {t("View a complete history of prescriptions for all patients")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-lg font-medium mb-2">{t("Coming Soon")}</p>
                <p>
                  {t("The prescription history feature is currently in development and will be available soon.")}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="templates" className="space-y-6 mt-0">
          <Card>
            <CardHeader>
              <CardTitle>{t("Prescription Templates")}</CardTitle>
              <CardDescription>
                {t("Create and manage templates for frequently prescribed medications")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-lg font-medium mb-2">{t("Coming Soon")}</p>
                <p>
                  {t("The prescription templates feature is currently in development and will be available soon.")}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="pharmacies" className="space-y-6 mt-0">
          <Card>
            <CardHeader>
              <CardTitle>{t("Pharmacy Directory")}</CardTitle>
              <CardDescription>
                {t("Browse and manage pharmacy information for e-prescriptions")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Building className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-lg font-medium mb-2">{t("Coming Soon")}</p>
                <p>
                  {t("The pharmacy directory feature is currently in development and will be available soon.")}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}