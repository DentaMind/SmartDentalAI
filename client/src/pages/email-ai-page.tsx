import React from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { EmailAIManagement } from '@/components/email/email-ai-management';

export function EmailAIPage() {
  return (
    <DashboardLayout>
      <EmailAIManagement />
    </DashboardLayout>
  );
}

export default EmailAIPage;