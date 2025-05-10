import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

interface PerioChartProps {
  patientId: number;
  readOnly?: boolean;
  onSave?: (data: any) => void;
}

export default function PerioChart({
  patientId,
  readOnly = false,
  onSave
}: PerioChartProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <Alert className="mb-4">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Basic Periodontal Chart</AlertTitle>
          <AlertDescription>
            This is a basic periodontal chart placeholder. Please use the Clinical Periodontal Chart below for full functionality.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}