import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

interface EnhancedDentalChartProps {
  patientId: number;
  readOnly?: boolean;
  onSave?: (data: any) => void;
}

export default function EnhancedDentalChart({
  patientId,
  readOnly = false,
  onSave
}: EnhancedDentalChartProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <Alert className="mb-4">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Enhanced Dental Chart</AlertTitle>
          <AlertDescription>
            This is an enhanced dental chart placeholder. The primary functionality is now in the Restorative Chart above.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}