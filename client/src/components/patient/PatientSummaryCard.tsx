import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Calendar, Clock, Phone, Mail, User, Heart, AlertCircle } from 'lucide-react';

interface PatientSummaryCardProps {
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    date_of_birth: string;
    medical_history?: {
      conditions?: string[];
      allergies?: string[];
      medications?: string[];
    };
  };
  onViewDetails?: () => void;
  onScheduleAppointment?: () => void;
}

export const PatientSummaryCard: React.FC<PatientSummaryCardProps> = ({
  patient,
  onViewDetails,
  onScheduleAppointment,
}) => {
  // Calculate age from date of birth
  const calculateAge = (dob: string): number => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(patient.date_of_birth);
  
  // Format date of birth
  const formatDOB = (dob: string): string => {
    const date = new Date(dob);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Card className="w-full max-w-md shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold">
          {patient.first_name} {patient.last_name}
        </CardTitle>
        <CardDescription className="flex items-center gap-1">
          <User size={14} />
          <span>Patient ID: {patient.id}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-muted-foreground" />
            <span className="text-sm">
              {formatDOB(patient.date_of_birth)} ({age} years)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Phone size={16} className="text-muted-foreground" />
            <span className="text-sm">{patient.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-muted-foreground" />
            <span className="text-sm">{patient.email}</span>
          </div>
        </div>

        {patient.medical_history && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
              <Heart size={16} className="text-red-500" />
              Medical History
            </h4>
            <div className="space-y-2">
              {patient.medical_history.conditions && patient.medical_history.conditions.length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground">Conditions:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {patient.medical_history.conditions.map((condition, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {patient.medical_history.allergies && patient.medical_history.allergies.length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground">Allergies:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {patient.medical_history.allergies.map((allergy, index) => (
                      <Badge key={index} variant="outline" className="text-xs bg-red-50 text-red-700 border-red-300">
                        <AlertCircle size={10} className="mr-1" />
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" onClick={onViewDetails}>
          View Details
        </Button>
        <Button size="sm" onClick={onScheduleAppointment}>
          Schedule Appointment
        </Button>
      </CardFooter>
    </Card>
  );
}; 