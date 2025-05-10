import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  PlusCircle, 
  List, 
  CheckCircle, 
  Send, 
  FilePenLine, 
  Trash2, 
  ExternalLink,
  AlertTriangle 
} from 'lucide-react';
import { format } from 'date-fns';

interface PrescriptionItem {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  quantity: number;
  days_supply?: number;
  refills: number;
}

interface Prescription {
  id: string;
  patient_id: string;
  provider_id: string;
  prescription_date: string;
  status: string;
  items: PrescriptionItem[];
  sent_date?: string;
  filled_date?: string;
  notes?: string;
  has_warnings?: boolean;
}

interface PrescriptionListProps {
  prescriptions: Prescription[];
  onViewPrescription: (id: string) => void;
  onCreatePrescription: () => void;
  onValidatePrescription: (id: string) => void;
  onApprovePrescription: (id: string) => void;
  onDeletePrescription: (id: string) => void;
}

export const PrescriptionList: React.FC<PrescriptionListProps> = ({
  prescriptions,
  onViewPrescription,
  onCreatePrescription,
  onValidatePrescription,
  onApprovePrescription,
  onDeletePrescription
}) => {
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
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  // Count items in a prescription
  const countMedications = (items: PrescriptionItem[]) => {
    return items.length;
  };

  // Summarize medications
  const summarizeMedications = (items: PrescriptionItem[]) => {
    if (items.length === 0) return 'No medications';
    if (items.length === 1) return items[0].medication_name;
    return `${items[0].medication_name} +${items.length - 1} more`;
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Patient Prescriptions</h2>
        <Button onClick={onCreatePrescription}>
          <PlusCircle className="h-4 w-4 mr-2" />
          New Prescription
        </Button>
      </div>

      {prescriptions.length === 0 ? (
        <div className="text-center py-8 border rounded-md">
          <List className="h-12 w-12 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500">No prescriptions found</p>
          <Button variant="outline" className="mt-4" onClick={onCreatePrescription}>
            Create New Prescription
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Medications</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sent Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prescriptions.map((prescription) => (
              <TableRow key={prescription.id}>
                <TableCell>
                  {formatDate(prescription.prescription_date)}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{summarizeMedications(prescription.items)}</span>
                    <span className="text-sm text-gray-500">{countMedications(prescription.items)} medications</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(prescription.status)}
                    {prescription.has_warnings && (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {formatDate(prescription.sent_date || '')}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onViewPrescription(prescription.id)}
                      title="View Details"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>

                    {prescription.status === 'pending' && (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onValidatePrescription(prescription.id)}
                          title="Validate"
                          className="text-amber-600 hover:text-amber-700"
                        >
                          <AlertTriangle className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onApprovePrescription(prescription.id)}
                          title="Approve & Send"
                          className="text-green-600 hover:text-green-700"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onDeletePrescription(prescription.id)}
                          title="Delete"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}

                    {prescription.status === 'approved' && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onApprovePrescription(prescription.id)}
                        title="Send to Pharmacy"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}; 