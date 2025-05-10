import React from 'react';
import { AlertTriangle, Activity, Heart, Shield, X, Info } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface MedicalAlertProps {
  alerts: string[];
  patientName?: string;
  onDismiss?: () => void;
  showDismiss?: boolean;
}

export const MedicalAlertBanner: React.FC<MedicalAlertProps> = ({
  alerts,
  patientName,
  onDismiss,
  showDismiss = true
}) => {
  if (!alerts || alerts.length === 0) return null;

  // Categorize alerts into critical and non-critical
  const criticalAlerts = alerts.filter(alert => 
    alert.toLowerCase().includes('bleeding risk') ||
    alert.toLowerCase().includes('allergies') ||
    alert.toLowerCase().includes('pregnant') ||
    alert.toLowerCase().includes('asa iv') ||
    alert.toLowerCase().includes('anticoagulant')
  );
  
  const standardAlerts = alerts.filter(alert => !criticalAlerts.includes(alert));

  // Helper function to get appropriate icon for an alert
  const getAlertIcon = (alert: string) => {
    const alertLower = alert.toLowerCase();
    
    if (alertLower.includes('bleeding') || alertLower.includes('anticoagulant')) {
      return <Activity className="h-4 w-4 text-red-500" />;
    } else if (alertLower.includes('heart') || alertLower.includes('hypertension')) {
      return <Heart className="h-4 w-4 text-red-500" />;
    } else if (alertLower.includes('allergies')) {
      return <Shield className="h-4 w-4 text-amber-500" />;
    } else if (alertLower.includes('pregnant')) {
      return <Info className="h-4 w-4 text-blue-500" />;
    } else {
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    }
  };

  return (
    <Card className="border-red-500 bg-red-50 mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <h3 className="font-bold text-red-700">
              Medical Alerts {patientName ? `for ${patientName}` : ''}
            </h3>
          </div>
          
          {showDismiss && onDismiss && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onDismiss}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Dismiss</span>
            </Button>
          )}
        </div>
        
        <div className="mt-3 space-y-2">
          {criticalAlerts.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-sm font-medium text-red-700">Critical Alerts</h4>
              <div className="flex flex-wrap gap-2">
                {criticalAlerts.map((alert, index) => (
                  <Badge 
                    key={index} 
                    variant="outline"
                    className="bg-white border-red-300 text-red-800 flex items-center gap-1"
                  >
                    {getAlertIcon(alert)}
                    {alert}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {standardAlerts.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-sm font-medium text-amber-700">Standard Alerts</h4>
              <div className="flex flex-wrap gap-2">
                {standardAlerts.map((alert, index) => (
                  <Badge 
                    key={index} 
                    variant="outline"
                    className="bg-white border-amber-300 text-amber-800 flex items-center gap-1"
                  >
                    {getAlertIcon(alert)}
                    {alert}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <p className="text-xs text-red-700 mt-3">
          These medical conditions may affect treatment decisions. Please review before proceeding.
        </p>
      </CardContent>
    </Card>
  );
}; 