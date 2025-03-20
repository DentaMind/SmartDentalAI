import React from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { EmailAIManagement } from '@/components/email/email-ai-management';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function EmailAIPage() {
  return (
    <DashboardLayout 
      title="Email AI Management" 
      description="Configure email automation, monitoring, and AI responses"
      actions={
        <Button className="gap-1">
          <Plus className="h-4 w-4" />
          New Template
        </Button>
      }
    >
      <EmailAIManagement />
    </DashboardLayout>
  );
}

export default EmailAIPage;