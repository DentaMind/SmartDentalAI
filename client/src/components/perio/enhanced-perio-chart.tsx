import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

interface EnhancedPerioChartProps {
  patientId: number;
  readOnly?: boolean;
  onSave?: (data: any) => void;
}

export default function EnhancedPerioChart({
  patientId,
  readOnly = false,
  onSave
}: EnhancedPerioChartProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <Alert className="mb-4">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Enhanced Periodontal Chart</AlertTitle>
          <AlertDescription>
            This is an enhanced periodontal chart placeholder. The primary functionality is now in the Clinical Periodontal Chart.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}