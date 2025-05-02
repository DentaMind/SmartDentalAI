import React, { useState } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent,
  CardFooter
} from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  AlertCircle, 
  Calendar, 
  User, 
  CheckCircle, 
  AlertTriangle, 
  FileText,
  Send,
  XCircle
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "../ui/alert";
import { format } from 'date-fns';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';

interface PrescriptionItem {
  id: string;
  medication_name: string;
  dosage: string;
  form: string;
  route: string;
  frequency: string;
  quantity: number;
  days_supply?: number;
  refills: number;
  dispense_as_written: boolean;
  notes?: string;
}

interface ValidationWarning {
  message: string;
  critical: boolean;
}

interface PrescriptionDetailsProps {
  prescription: {
    id: string;
    patient_id: string;
    provider_id: string;
    patient_name: string;
    provider_name: string;
    prescription_date: string;
    status: string;
    notes?: string;
    items: PrescriptionItem[];
    treatment_plan_id?: string;
    treatment_plan_name?: string;
    created_at: string;
    sent_date?: string;
    filled_date?: string;
  };
  validationWarnings?: ValidationWarning[];
  onApproveAndSend: (prescriptionId: string, overrideWarnings: boolean) => void;
  onCancel: (prescriptionId: string) => void;
  onClose: () => void;
}

export const PrescriptionDetails: React.FC<PrescriptionDetailsProps> = ({
  prescription,
  validationWarnings = [],
  onApproveAndSend,
  onCancel,
  onClose
}) => {
  const [overrideWarnings, setOverrideWarnings] = useState(false);
  
  // Get status badge variant based on prescription status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Approved</Badge>;
      case 'sent':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Sent</Badge>;
      case 'filled':
        return <Badge className="bg-green-600">Filled</Badge>;
      case 'declined':
        return <Badge variant="destructive">Declined</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format date to readable format
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (e) {
      return dateString;
    }
  };

  // Check if there are critical warnings
  const hasCriticalWarnings = validationWarnings.some(w => w.critical);
  
  // Calculate if we can send the prescription
  const canSend = prescription.status === 'pending' || prescription.status === 'approved';
  
  // Handle approve and send
  const handleApproveAndSend = () => {
    onApproveAndSend(prescription.id, overrideWarnings);
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Prescription Details</CardTitle>
            <CardDescription>
              Created on {formatDate(prescription.prescription_date)}
            </CardDescription>
          </div>
          <div>{getStatusBadge(prescription.status)}</div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Patient and Provider Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <User className="mr-2 h-4 w-4" />
              <span>Patient</span>
            </div>
            <p className="font-medium">{prescription.patient_name}</p>
            <p className="text-sm text-muted-foreground">ID: {prescription.patient_id}</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <User className="mr-2 h-4 w-4" />
              <span>Provider</span>
            </div>
            <p className="font-medium">{prescription.provider_name}</p>
            <p className="text-sm text-muted-foreground">ID: {prescription.provider_id}</p>
          </div>
        </div>
        
        {/* Treatment Plan Reference */}
        {prescription.treatment_plan_id && (
          <div className="bg-muted p-3 rounded-md">
            <div className="flex items-center text-sm">
              <FileText className="mr-2 h-4 w-4" />
              <span className="text-muted-foreground">Treatment Plan:</span>
              <span className="font-medium ml-2">{prescription.treatment_plan_name || prescription.treatment_plan_id}</span>
            </div>
          </div>
        )}
        
        {/* Prescription Items Table */}
        <div>
          <h3 className="text-lg font-medium mb-3">Medications</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medication</TableHead>
                <TableHead>Dosage</TableHead>
                <TableHead>Form & Route</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Refills</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prescription.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.medication_name}
                    {item.dispense_as_written && (
                      <Badge variant="outline" className="ml-2 text-xs">DAW</Badge>
                    )}
                  </TableCell>
                  <TableCell>{item.dosage}</TableCell>
                  <TableCell>{item.form} - {item.route}</TableCell>
                  <TableCell>{item.frequency}</TableCell>
                  <TableCell>{item.quantity} {item.days_supply && `(${item.days_supply} days)`}</TableCell>
                  <TableCell>{item.refills}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Notes */}
        {prescription.notes && (
          <div className="bg-muted p-4 rounded-md">
            <h3 className="text-sm font-medium mb-2">Notes</h3>
            <p className="text-sm whitespace-pre-line">{prescription.notes}</p>
          </div>
        )}
        
        {/* Validation Warnings */}
        {validationWarnings.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Safety Warnings</h3>
            
            {validationWarnings.map((warning, index) => (
              <Alert key={index} variant={warning.critical ? "destructive" : "default"}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>
                  {warning.critical ? 'Critical Warning' : 'Warning'}
                </AlertTitle>
                <AlertDescription>
                  {warning.message}
                </AlertDescription>
              </Alert>
            ))}
            
            {hasCriticalWarnings && (
              <div className="flex items-center space-x-2 pt-2">
                <Switch 
                  id="override-warnings"
                  checked={overrideWarnings}
                  onCheckedChange={setOverrideWarnings}
                />
                <Label htmlFor="override-warnings" className="font-medium text-red-600">
                  Override critical warnings (requires clinical judgment)
                </Label>
              </div>
            )}
          </div>
        )}
        
        {/* Status Timeline */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium mb-3">Prescription Timeline</h3>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground">Created</p>
              <p>{formatDate(prescription.created_at)}</p>
            </div>
            {prescription.sent_date && (
              <div>
                <p className="text-muted-foreground">Sent to Pharmacy</p>
                <p>{formatDate(prescription.sent_date)}</p>
              </div>
            )}
            {prescription.filled_date && (
              <div>
                <p className="text-muted-foreground">Filled</p>
                <p>{formatDate(prescription.filled_date)}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          
          {prescription.status === 'pending' && (
            <Button variant="outline" onClick={() => onCancel(prescription.id)} className="text-red-600">
              <XCircle className="mr-2 h-4 w-4" />
              Cancel Prescription
            </Button>
          )}
        </div>
        
        {canSend && (
          <Button
            onClick={handleApproveAndSend}
            disabled={hasCriticalWarnings && !overrideWarnings}
          >
            <Send className="mr-2 h-4 w-4" />
            {prescription.status === 'pending' ? 'Approve & Send' : 'Send to Pharmacy'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}; 