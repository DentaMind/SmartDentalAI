import React from "react";
import { useTranslation } from "react-i18next";
import { Mail } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import EmailReaderSetup from "@/components/email/email-reader-setup";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const EmailIntegrationPage: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      <PageHeader
        title={t("Practice Email Integration")}
        description={t("Connect your practice email to DentaMind's AI system")}
        icon={<Mail className="h-6 w-6" />}
      />
      
      <Tabs defaultValue="reader" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="reader">Email Reader</TabsTrigger>
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="reader" className="space-y-6">
          <EmailReaderSetup />
        </TabsContent>
        
        <TabsContent value="templates" className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-12 text-center">
            <h3 className="text-lg font-medium mb-2">Email Templates</h3>
            <p className="text-muted-foreground">
              Customize your practice email templates for patient communications.
              This feature is coming soon.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-12 text-center">
            <h3 className="text-lg font-medium mb-2">Email Analytics</h3>
            <p className="text-muted-foreground">
              View analytics about your practice email communication patterns,
              response times, and patient engagement. This feature is coming soon.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmailIntegrationPage;