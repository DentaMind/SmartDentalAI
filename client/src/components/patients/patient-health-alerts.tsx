import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  AlertCircle, 
  AlertTriangle, 
  Bell, 
  Check, 
  Heart, 
  HeartPulse, 
  Info, 
  Pill, 
  Plus,
  ShieldAlert
} from "lucide-react";

interface PatientHealthAlertsProps {
  patient: any;
}

interface HealthAlert {
  id: string;
  type: "allergy" | "medication" | "condition" | "contraindication" | "lab" | "vital";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  detail?: string;
  source?: string;
  timestamp: string;
  dismissed?: boolean;
}

interface MedicalCondition {
  condition: string;
  diagnosedDate?: string;
  status: "active" | "resolved" | "controlled";
  notes?: string;
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  purpose?: string;
  startDate?: string;
  prescribedBy?: string;
}

interface Allergy {
  allergen: string;
  reaction: string;
  severity: "mild" | "moderate" | "severe";
  notes?: string;
}

interface VitalSigns {
  bloodPressure?: {
    systolic: number;
    diastolic: number;
    timestamp: string;
    status: "normal" | "elevated" | "high";
  };
  heartRate?: {
    value: number;
    timestamp: string;
    status: "normal" | "abnormal";
  };
  temperature?: {
    value: number;
    timestamp: string;
    unit: "celsius" | "fahrenheit";
    status: "normal" | "elevated";
  };
  oxygenSaturation?: {
    value: number;
    timestamp: string;
    status: "normal" | "low";
  };
}

export function PatientHealthAlerts({ patient }: PatientHealthAlertsProps) {
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const [showMedications, setShowMedications] = useState(true);
  const [showConditions, setShowConditions] = useState(true);
  const [showAllergies, setShowAllergies] = useState(true);

  // Fetch patient health alerts
  const { data: healthAlerts, isLoading: alertsLoading } = useQuery<HealthAlert[]>({
    queryKey: ["/api/health-alerts", patient?.id],
    queryFn: async () => {
      try {
        const data = await apiRequest<HealthAlert[]>(`/api/patients/${patient.id}/health-alerts`);
        return data;
      } catch (error) {
        console.error("Failed to fetch health alerts:", error);
        return [];
      }
    },
    enabled: !!patient?.id
  });

  // Fetch patient medical information
  const { data: medicalInfo, isLoading: medicalLoading } = useQuery<{
    conditions: MedicalCondition[];
    medications: Medication[];
    allergies: Allergy[];
    vitalSigns: VitalSigns;
  }>({
    queryKey: ["/api/medical-info", patient?.id],
    queryFn: async () => {
      try {
        const data = await apiRequest<{
          conditions: MedicalCondition[];
          medications: Medication[];
          allergies: Allergy[];
          vitalSigns: VitalSigns;
        }>(`/api/patients/${patient.id}/medical-info`);
        return data;
      } catch (error) {
        console.error("Failed to fetch medical information:", error);
        return {
          conditions: [],
          medications: [],
          allergies: [],
          vitalSigns: {}
        };
      }
    },
    enabled: !!patient?.id
  });

  // In case we don't have real data yet, use this sample
  const sampleAlerts: HealthAlert[] = [
    {
      id: "1",
      type: "allergy",
      severity: "high",
      description: "Penicillin Allergy",
      detail: "Patient reported anaphylactic reaction to penicillin",
      timestamp: new Date().toISOString(),
    },
    {
      id: "2",
      type: "medication",
      severity: "medium",
      description: "Blood Thinner Medication",
      detail: "Patient is taking Warfarin - monitor for excessive bleeding during procedures",
      timestamp: new Date().toISOString(),
    },
    {
      id: "3",
      type: "condition",
      severity: "medium",
      description: "Diabetes Type 2",
      detail: "Patient has controlled Type 2 Diabetes - check glucose levels before procedures",
      timestamp: new Date().toISOString(),
    },
    {
      id: "4",
      type: "contraindication",
      severity: "critical",
      description: "Contraindication for Epinephrine",
      detail: "Patient has cardiac arrhythmia - avoid epinephrine in local anesthetics",
      timestamp: new Date().toISOString(),
    }
  ];

  const sampleMedicalInfo = {
    conditions: [
      {
        condition: "Hypertension",
        diagnosedDate: "2020-05-15",
        status: "controlled",
        notes: "Managed with medication and diet"
      },
      {
        condition: "Type 2 Diabetes",
        diagnosedDate: "2019-01-10",
        status: "active",
        notes: "HbA1c: 7.2 (Last checked: 3 months ago)"
      }
    ],
    medications: [
      {
        name: "Lisinopril",
        dosage: "10mg",
        frequency: "Once daily",
        purpose: "Hypertension",
        startDate: "2020-05-20",
        prescribedBy: "Dr. Johnson"
      },
      {
        name: "Metformin",
        dosage: "500mg",
        frequency: "Twice daily",
        purpose: "Diabetes",
        startDate: "2019-02-01",
        prescribedBy: "Dr. Smith"
      },
      {
        name: "Aspirin",
        dosage: "81mg",
        frequency: "Once daily",
        purpose: "Heart health",
        startDate: "2020-01-15",
        prescribedBy: "Dr. Johnson"
      }
    ],
    allergies: [
      {
        allergen: "Penicillin",
        reaction: "Anaphylaxis",
        severity: "severe",
        notes: "Patient experienced severe reaction requiring emergency care"
      },
      {
        allergen: "Latex",
        reaction: "Skin rash, itching",
        severity: "moderate",
        notes: "Use latex-free gloves and equipment"
      }
    ],
    vitalSigns: {
      bloodPressure: {
        systolic: 135,
        diastolic: 85,
        timestamp: new Date().toISOString(),
        status: "elevated"
      },
      heartRate: {
        value: 72,
        timestamp: new Date().toISOString(),
        status: "normal"
      },
      temperature: {
        value: 98.6,
        timestamp: new Date().toISOString(),
        unit: "fahrenheit",
        status: "normal"
      },
      oxygenSaturation: {
        value: 97,
        timestamp: new Date().toISOString(),
        status: "normal"
      }
    }
  };

  // Use the real data if available, otherwise use sample data
  const displayAlerts = healthAlerts || sampleAlerts;
  const displayMedicalInfo = medicalInfo || sampleMedicalInfo;

  // Filter alerts by priority (show only high/critical by default)
  const filteredAlerts = showAllAlerts 
    ? displayAlerts 
    : displayAlerts.filter(alert => ["high", "critical"].includes(alert.severity));

  // Function to get icon based on alert type
  const getAlertIcon = (type: string, severity: string) => {
    switch (type) {
      case "allergy":
        return severity === "critical" || severity === "high" 
          ? <AlertCircle className="h-5 w-5 text-red-500" /> 
          : <AlertCircle className="h-5 w-5 text-amber-500" />;
      case "medication":
        return <Pill className="h-5 w-5 text-blue-500" />;
      case "condition":
        return <HeartPulse className="h-5 w-5 text-purple-500" />;
      case "contraindication":
        return <ShieldAlert className="h-5 w-5 text-red-500" />;
      case "lab":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "vital":
        return <Heart className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  // Function to get alert style based on severity
  const getAlertStyle = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-50 border-red-400 text-red-800";
      case "high":
        return "bg-amber-50 border-amber-400 text-amber-800";
      case "medium":
        return "bg-yellow-50 border-yellow-400 text-yellow-800";
      case "low":
        return "bg-blue-50 border-blue-400 text-blue-700";
      default:
        return "bg-gray-50 border-gray-400 text-gray-800";
    }
  };

  // Function to get badge style for allergy severity
  const getAllergySeverityBadge = (severity: string) => {
    switch (severity) {
      case "severe":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Severe</Badge>;
      case "moderate":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Moderate</Badge>;
      case "mild":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Mild</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Function to format blood pressure
  const formatBloodPressure = (bp: { systolic: number; diastolic: number; status: string }) => {
    return (
      <div className="flex items-center gap-2">
        <span>{bp.systolic}/{bp.diastolic} mmHg</span>
        {bp.status === "elevated" && 
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Elevated</Badge>}
        {bp.status === "high" && 
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">High</Badge>}
        {bp.status === "normal" && 
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Normal</Badge>}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Critical Health Alerts */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Health Alerts
          </h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowAllAlerts(!showAllAlerts)}
          >
            {showAllAlerts ? "Show High Priority Only" : "Show All Alerts"}
          </Button>
        </div>

        <div className="space-y-3">
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert) => (
              <Alert 
                key={alert.id} 
                className={`border ${getAlertStyle(alert.severity)}`}
              >
                <div className="flex gap-3">
                  {getAlertIcon(alert.type, alert.severity)}
                  <div>
                    <AlertTitle className="font-semibold">{alert.description}</AlertTitle>
                    <AlertDescription className="mt-1">
                      {alert.detail}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ))
          ) : (
            <div className="bg-green-50 p-4 rounded-md flex items-center gap-3">
              <Check className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium text-green-800">No Critical Health Alerts</p>
                <p className="text-sm text-green-700">
                  There are no critical health alerts for this patient at this time.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Vital Signs */}
      {displayMedicalInfo.vitalSigns && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <HeartPulse className="h-5 w-5 text-primary" />
                Vital Signs
              </h3>
              <Button variant="ghost" size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                Update
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-2">
              {displayMedicalInfo.vitalSigns.bloodPressure && (
                <div>
                  <p className="text-sm text-muted-foreground">Blood Pressure</p>
                  <div className="mt-1">
                    {formatBloodPressure(displayMedicalInfo.vitalSigns.bloodPressure)}
                  </div>
                </div>
              )}
              
              {displayMedicalInfo.vitalSigns.heartRate && (
                <div>
                  <p className="text-sm text-muted-foreground">Heart Rate</p>
                  <div className="mt-1">
                    {displayMedicalInfo.vitalSigns.heartRate.value} bpm
                    {displayMedicalInfo.vitalSigns.heartRate.status !== "normal" && (
                      <Badge className="ml-2 bg-amber-100 text-amber-800">Abnormal</Badge>
                    )}
                  </div>
                </div>
              )}

              {displayMedicalInfo.vitalSigns.temperature && (
                <div>
                  <p className="text-sm text-muted-foreground">Temperature</p>
                  <div className="mt-1">
                    {displayMedicalInfo.vitalSigns.temperature.value}°{displayMedicalInfo.vitalSigns.temperature.unit === "fahrenheit" ? "F" : "C"}
                    {displayMedicalInfo.vitalSigns.temperature.status !== "normal" && (
                      <Badge className="ml-2 bg-amber-100 text-amber-800">Elevated</Badge>
                    )}
                  </div>
                </div>
              )}

              {displayMedicalInfo.vitalSigns.oxygenSaturation && (
                <div>
                  <p className="text-sm text-muted-foreground">Oxygen Saturation</p>
                  <div className="mt-1">
                    {displayMedicalInfo.vitalSigns.oxygenSaturation.value}% SpO₂
                    {displayMedicalInfo.vitalSigns.oxygenSaturation.status !== "normal" && (
                      <Badge className="ml-2 bg-amber-100 text-amber-800">Low</Badge>
                    )}
                  </div>
                </div>
              )}
            </div>

            {displayMedicalInfo.vitalSigns.bloodPressure?.timestamp && (
              <p className="text-xs text-muted-foreground mt-3">
                Last updated: {new Date(displayMedicalInfo.vitalSigns.bloodPressure.timestamp).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Medical Information */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* Allergies Section */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  Allergies
                </h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowAllergies(!showAllergies)}
                >
                  {showAllergies ? "Hide" : "Show"}
                </Button>
              </div>

              {showAllergies && (
                <div className="space-y-2">
                  {displayMedicalInfo.allergies.length > 0 ? (
                    displayMedicalInfo.allergies.map((allergy, index) => (
                      <div 
                        key={`allergy-${index}`} 
                        className="p-3 border rounded-md hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{allergy.allergen}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Reaction: {allergy.reaction}
                            </p>
                            {allergy.notes && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {allergy.notes}
                              </p>
                            )}
                          </div>
                          <div>
                            {getAllergySeverityBadge(allergy.severity)}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm p-3 bg-gray-50 rounded-md">
                      No known allergies
                    </div>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Medications Section */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Pill className="h-5 w-5 text-blue-500" />
                  Current Medications
                </h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowMedications(!showMedications)}
                >
                  {showMedications ? "Hide" : "Show"}
                </Button>
              </div>

              {showMedications && (
                <div className="space-y-2">
                  {displayMedicalInfo.medications.length > 0 ? (
                    displayMedicalInfo.medications.map((medication, index) => (
                      <div 
                        key={`medication-${index}`} 
                        className="p-3 border rounded-md hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{medication.name}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {medication.dosage} - {medication.frequency}
                            </p>
                            {medication.purpose && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Purpose: {medication.purpose}
                              </p>
                            )}
                          </div>
                          {medication.prescribedBy && (
                            <p className="text-xs text-muted-foreground">
                              {medication.prescribedBy}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm p-3 bg-gray-50 rounded-md">
                      No current medications
                    </div>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Medical Conditions Section */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <HeartPulse className="h-5 w-5 text-purple-500" />
                  Medical Conditions
                </h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowConditions(!showConditions)}
                >
                  {showConditions ? "Hide" : "Show"}
                </Button>
              </div>

              {showConditions && (
                <div className="space-y-2">
                  {displayMedicalInfo.conditions.length > 0 ? (
                    displayMedicalInfo.conditions.map((condition, index) => (
                      <div 
                        key={`condition-${index}`} 
                        className="p-3 border rounded-md hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{condition.condition}</p>
                            {condition.notes && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {condition.notes}
                              </p>
                            )}
                          </div>
                          <Badge 
                            className={
                              condition.status === "active" ? "bg-blue-100 text-blue-800 hover:bg-blue-100" :
                              condition.status === "controlled" ? "bg-green-100 text-green-800 hover:bg-green-100" :
                              "bg-gray-100 text-gray-800 hover:bg-gray-100"
                            }
                          >
                            {condition.status.charAt(0).toUpperCase() + condition.status.slice(1)}
                          </Badge>
                        </div>
                        {condition.diagnosedDate && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Diagnosed: {new Date(condition.diagnosedDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm p-3 bg-gray-50 rounded-md">
                      No medical conditions recorded
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}