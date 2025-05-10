import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";

// ASA Physical Status Classification System
export type ASAClassification = 1 | 2 | 3 | 4 | 5 | 6 | 'E';
export type EmergencyStatus = 'routine' | 'urgent' | 'emergency';

interface ASAClassificationCardProps {
  asaClass: ASAClassification;
  emergencyStatus: EmergencyStatus;
}

export function ASAClassificationCard({ asaClass, emergencyStatus }: ASAClassificationCardProps) {
  const getASADescription = (asaClass: ASAClassification): string => {
    switch (asaClass) {
      case 1:
        return "A normal healthy patient";
      case 2:
        return "A patient with mild systemic disease";
      case 3:
        return "A patient with severe systemic disease";
      case 4:
        return "A patient with severe systemic disease that is a constant threat to life";
      case 5:
        return "A moribund patient who is not expected to survive without the operation";
      case 6:
        return "A declared brain-dead patient whose organs are being removed for donor purposes";
      case 'E':
        return "Emergency operation";
      default:
        return "Not classified";
    }
  };

  const getASAColor = (asaClass: ASAClassification): string => {
    switch (asaClass) {
      case 1:
        return "bg-green-100 text-green-800";
      case 2:
        return "bg-blue-100 text-blue-800";
      case 3:
        return "bg-yellow-100 text-yellow-800";
      case 4:
        return "bg-orange-100 text-orange-800";
      case 5:
        return "bg-red-100 text-red-800";
      case 6:
        return "bg-purple-100 text-purple-800";
      case 'E':
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getEmergencyIcon = (status: EmergencyStatus) => {
    switch (status) {
      case 'routine':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'urgent':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case 'emergency':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getEmergencyText = (status: EmergencyStatus): string => {
    switch (status) {
      case 'routine':
        return "Routine Care";
      case 'urgent':
        return "Urgent Care Needed";
      case 'emergency':
        return "Emergency Care";
      default:
        return "Unspecified";
    }
  };

  const getEmergencyVariant = (status: EmergencyStatus) => {
    switch (status) {
      case 'routine':
        return "outline";
      case 'urgent':
        return "secondary";
      case 'emergency':
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">ASA Classification</CardTitle>
        <CardDescription>Physical Status Classification</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-2">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getASAColor(asaClass)}`}>
              ASA {asaClass}
            </div>
            <span className="text-sm font-medium">{getASADescription(asaClass)}</span>
          </div>

          <div className="flex items-center space-x-2">
            {getEmergencyIcon(emergencyStatus)}
            <Badge variant={getEmergencyVariant(emergencyStatus)}>
              {getEmergencyText(emergencyStatus)}
            </Badge>
          </div>

          <div className="text-sm text-muted-foreground">
            {emergencyStatus === 'emergency' && (
              <p className="text-red-600 font-medium">
                Patient requires immediate attention. Alert doctor immediately.
              </p>
            )}
            {emergencyStatus === 'urgent' && (
              <p className="text-amber-600">
                Schedule treatment within 24-48 hours.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}