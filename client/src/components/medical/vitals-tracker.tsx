import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  Heart, 
  Thermometer, 
  Lungs, 
  CalendarClock, 
  Scale, 
  CircleDashed,
  Pencil,
  Save,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';

interface VitalsSummary {
  bloodPressure: string;
  pulse: number;
  respiratoryRate: number;
  temperature: number;
  oxygenSaturation: number;
  weight: number;
  height: number;
  bmi?: number;
  lastUpdated: Date;
}

interface VitalsTrackerProps {
  patientId: number;
  initialVitals?: Partial<VitalsSummary>;
  readOnly?: boolean;
  onSave?: (vitals: VitalsSummary) => void;
}

export function VitalsTracker({ 
  patientId, 
  initialVitals = {}, 
  readOnly = false,
  onSave 
}: VitalsTrackerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [vitals, setVitals] = useState<VitalsSummary>({
    bloodPressure: initialVitals.bloodPressure || "120/80",
    pulse: initialVitals.pulse || 72,
    respiratoryRate: initialVitals.respiratoryRate || 16,
    temperature: initialVitals.temperature || 98.6,
    oxygenSaturation: initialVitals.oxygenSaturation || 98,
    weight: initialVitals.weight || 70,
    height: initialVitals.height || 170,
    bmi: initialVitals.bmi,
    lastUpdated: initialVitals.lastUpdated || new Date()
  });
  
  const { toast } = useToast();
  
  // Helper function to calculate BMI
  const calculateBMI = (weight: number, height: number): number => {
    // Formula: weight(kg) / (height(m))²
    const heightInMeters = height / 100;
    return Number((weight / (heightInMeters * heightInMeters)).toFixed(1));
  };
  
  // Update a vital sign
  const updateVital = (key: keyof VitalsSummary, value: any) => {
    setVitals(prev => {
      const updated = { ...prev, [key]: value };
      
      // If weight or height changes, recalculate BMI
      if (key === 'weight' || key === 'height') {
        updated.bmi = calculateBMI(
          key === 'weight' ? value : prev.weight,
          key === 'height' ? value : prev.height
        );
      }
      
      return updated;
    });
  };
  
  // Save vitals
  const handleSave = () => {
    const updatedVitals = {
      ...vitals,
      lastUpdated: new Date()
    };
    
    setVitals(updatedVitals);
    setIsEditing(false);
    
    if (onSave) {
      onSave(updatedVitals);
    }
    
    toast({
      title: "Vitals Updated",
      description: "Patient vitals have been saved successfully.",
      variant: "default",
    });
  };
  
  // Cancel editing
  const handleCancel = () => {
    setVitals({
      bloodPressure: initialVitals.bloodPressure || "120/80",
      pulse: initialVitals.pulse || 72,
      respiratoryRate: initialVitals.respiratoryRate || 16,
      temperature: initialVitals.temperature || 98.6,
      oxygenSaturation: initialVitals.oxygenSaturation || 98,
      weight: initialVitals.weight || 70,
      height: initialVitals.height || 170,
      bmi: initialVitals.bmi,
      lastUpdated: initialVitals.lastUpdated || new Date()
    });
    setIsEditing(false);
  };
  
  // Get status color for vital sign
  const getVitalStatusColor = (key: keyof VitalsSummary): string => {
    switch (key) {
      case 'bloodPressure':
        const [systolic, diastolic] = vitals.bloodPressure.split('/').map(Number);
        if (systolic >= 140 || diastolic >= 90) return "text-red-500";
        if (systolic >= 130 || diastolic >= 85) return "text-amber-500";
        if (systolic <= 90 || diastolic <= 60) return "text-amber-500";
        return "text-green-500";
        
      case 'pulse':
        if (vitals.pulse > 100) return "text-red-500";
        if (vitals.pulse > 90) return "text-amber-500";
        if (vitals.pulse < 60) return "text-amber-500";
        return "text-green-500";
        
      case 'respiratoryRate':
        if (vitals.respiratoryRate > 20) return "text-amber-500";
        if (vitals.respiratoryRate < 12) return "text-amber-500";
        return "text-green-500";
        
      case 'temperature':
        if (vitals.temperature > 100.4) return "text-red-500";
        if (vitals.temperature > 99.5) return "text-amber-500";
        if (vitals.temperature < 97.0) return "text-amber-500";
        return "text-green-500";
        
      case 'oxygenSaturation':
        if (vitals.oxygenSaturation < 90) return "text-red-500";
        if (vitals.oxygenSaturation < 94) return "text-amber-500";
        return "text-green-500";
        
      case 'bmi':
        if (!vitals.bmi) return "text-muted-foreground";
        if (vitals.bmi >= 30) return "text-red-500";
        if (vitals.bmi >= 25) return "text-amber-500";
        if (vitals.bmi < 18.5) return "text-amber-500";
        return "text-green-500";
        
      default:
        return "text-muted-foreground";
    }
  };
  
  // Get units for vital signs
  const getUnits = (key: keyof VitalsSummary): string => {
    switch (key) {
      case 'bloodPressure': return "mmHg";
      case 'pulse': return "bpm";
      case 'respiratoryRate': return "breaths/min";
      case 'temperature': return "°F";
      case 'oxygenSaturation': return "%";
      case 'weight': return "kg";
      case 'height': return "cm";
      case 'bmi': return "kg/m²";
      default: return "";
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Vital Signs
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <CalendarClock className="h-3 w-3" />
              <span className="text-xs">
                {vitals.lastUpdated ? format(vitals.lastUpdated, "MMM d, yyyy") : "Not recorded"}
              </span>
            </Badge>
            
            {!readOnly && !isEditing && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsEditing(true)}
                className="h-8 w-8 p-0"
              >
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Button>
            )}
          </div>
        </div>
        <CardDescription>
          Patient vital signs and measurements
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Blood Pressure */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Heart className="h-3 w-3" />
                Blood Pressure
              </Label>
            </div>
            {isEditing ? (
              <Input
                value={vitals.bloodPressure}
                onChange={(e) => updateVital('bloodPressure', e.target.value)}
                className="h-8"
              />
            ) : (
              <div className="flex items-baseline gap-1">
                <span className={`text-lg font-medium ${getVitalStatusColor('bloodPressure')}`}>
                  {vitals.bloodPressure}
                </span>
                <span className="text-xs text-muted-foreground">{getUnits('bloodPressure')}</span>
              </div>
            )}
          </div>
          
          {/* Pulse */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Activity className="h-3 w-3" />
                Pulse
              </Label>
            </div>
            {isEditing ? (
              <Input
                type="number"
                value={vitals.pulse}
                onChange={(e) => updateVital('pulse', Number(e.target.value))}
                className="h-8"
              />
            ) : (
              <div className="flex items-baseline gap-1">
                <span className={`text-lg font-medium ${getVitalStatusColor('pulse')}`}>
                  {vitals.pulse}
                </span>
                <span className="text-xs text-muted-foreground">{getUnits('pulse')}</span>
              </div>
            )}
          </div>
          
          {/* Respiratory Rate */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Lungs className="h-3 w-3" />
                Respiratory Rate
              </Label>
            </div>
            {isEditing ? (
              <Input
                type="number"
                value={vitals.respiratoryRate}
                onChange={(e) => updateVital('respiratoryRate', Number(e.target.value))}
                className="h-8"
              />
            ) : (
              <div className="flex items-baseline gap-1">
                <span className={`text-lg font-medium ${getVitalStatusColor('respiratoryRate')}`}>
                  {vitals.respiratoryRate}
                </span>
                <span className="text-xs text-muted-foreground">{getUnits('respiratoryRate')}</span>
              </div>
            )}
          </div>
          
          {/* Temperature */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Thermometer className="h-3 w-3" />
                Temperature
              </Label>
            </div>
            {isEditing ? (
              <Input
                type="number"
                step="0.1"
                value={vitals.temperature}
                onChange={(e) => updateVital('temperature', Number(e.target.value))}
                className="h-8"
              />
            ) : (
              <div className="flex items-baseline gap-1">
                <span className={`text-lg font-medium ${getVitalStatusColor('temperature')}`}>
                  {vitals.temperature}
                </span>
                <span className="text-xs text-muted-foreground">{getUnits('temperature')}</span>
              </div>
            )}
          </div>
          
          {/* Oxygen Saturation */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <CircleDashed className="h-3 w-3" />
                O₂ Saturation
              </Label>
            </div>
            {isEditing ? (
              <Input
                type="number"
                value={vitals.oxygenSaturation}
                onChange={(e) => updateVital('oxygenSaturation', Number(e.target.value))}
                className="h-8"
              />
            ) : (
              <div className="flex items-baseline gap-1">
                <span className={`text-lg font-medium ${getVitalStatusColor('oxygenSaturation')}`}>
                  {vitals.oxygenSaturation}
                </span>
                <span className="text-xs text-muted-foreground">{getUnits('oxygenSaturation')}</span>
              </div>
            )}
          </div>
          
          {/* Weight */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Scale className="h-3 w-3" />
                Weight
              </Label>
            </div>
            {isEditing ? (
              <Input
                type="number"
                step="0.1"
                value={vitals.weight}
                onChange={(e) => updateVital('weight', Number(e.target.value))}
                className="h-8"
              />
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-medium">
                  {vitals.weight}
                </span>
                <span className="text-xs text-muted-foreground">{getUnits('weight')}</span>
              </div>
            )}
          </div>
          
          {/* Height */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Scale className="h-3 w-3 rotate-90" />
                Height
              </Label>
            </div>
            {isEditing ? (
              <Input
                type="number"
                value={vitals.height}
                onChange={(e) => updateVital('height', Number(e.target.value))}
                className="h-8"
              />
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-medium">
                  {vitals.height}
                </span>
                <span className="text-xs text-muted-foreground">{getUnits('height')}</span>
              </div>
            )}
          </div>
          
          {/* BMI */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Activity className="h-3 w-3" />
                BMI
              </Label>
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-lg font-medium ${getVitalStatusColor('bmi')}`}>
                {vitals.bmi || 'N/A'}
              </span>
              {vitals.bmi && (
                <span className="text-xs text-muted-foreground">{getUnits('bmi')}</span>
              )}
            </div>
          </div>
        </div>
        
        {isEditing && (
          <div className="flex justify-end gap-2 mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCancel}
              className="h-8 gap-1"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleSave}
              className="h-8 gap-1"
            >
              <Save className="h-4 w-4" />
              Save Vitals
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}