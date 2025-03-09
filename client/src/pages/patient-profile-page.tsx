import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import { 
  User, 
  FileText, 
  Calendar, 
  Activity, 
  Stethoscope, 
  Tooth, 
  Shield, 
  AlertCircle,
  Phone,
  Mail,
  Home,
  Clock,
  ChevronLeft,
  Edit
} from "lucide-react";

function getInitials(name: string) {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase();
}

export default function PatientProfilePage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("personal");
  
  // Fetch patient data
  const { data: patient, isLoading } = useQuery({
    queryKey: ["/api/patients", id],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/patients/${id}`);
        return await res.json();
      } catch (error) {
        console.error("Failed to fetch patient:", error);
        throw error;
      }
    },
    enabled: !!id
  });

  const handleBack = () => {
    setLocation("/patients");
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto py-8 max-w-7xl">
            <div className="flex flex-col items-center justify-center h-full">
              <LoadingAnimation />
              <p className="mt-4 text-gray-600">Loading patient profile...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto py-8 max-w-7xl">
            <div className="flex flex-col items-center justify-center h-full">
              <AlertCircle className="h-16 w-16 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">Patient not found</p>
              <Button onClick={handleBack} className="mt-4">
                Back to Patients
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const patientName = `${patient.firstName} ${patient.lastName}`;
  const patientAge = patient.dateOfBirth 
    ? Math.floor((new Date().getTime() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) 
    : null;
  
  // Calculate risk score based on medical conditions
  const calculateRiskScore = () => {
    let score = 0;
    
    // Add points for each medical condition
    if (patient.hypertension) score += 2;
    if (patient.diabetes) score += 3;
    if (patient.heartDisease) score += 3;
    if (patient.kidneyDisease) score += 2;
    if (patient.liverDisease) score += 2;
    if (patient.bleedingDisorders) score += 3;
    if (patient.autoimmune) score += 2;
    if (patient.smokesTobacco) score += 1;
    
    // Determine risk level based on score
    if (score >= 6) return { level: "High", color: "destructive" };
    if (score >= 3) return { level: "Moderate", color: "orange" };
    return { level: "Low", color: "green" };
  };
  
  const risk = calculateRiskScore();

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto py-6 max-w-7xl">
          {/* Header with Back button */}
          <div className="flex items-center mb-6">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleBack}
              className="mr-4"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <PageHeader
              title={
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary/10 text-primary text-xl">
                      {getInitials(patientName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-4xl font-bold">{patientName}</h1>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      {patient.dateOfBirth && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            {formatDate(patient.dateOfBirth)} ({patientAge} y/o)
                          </span>
                        </div>
                      )}
                      {patient.insuranceProvider && (
                        <div className="flex items-center gap-1">
                          <Shield className="h-3.5 w-3.5" />
                          <span>{patient.insuranceProvider}</span>
                        </div>
                      )}
                      <Badge className={`bg-${risk.color}`}>{risk.level} Risk</Badge>
                    </div>
                  </div>
                </div>
              }
              actions={
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    Schedule Appointment
                  </Button>
                  <Button className="gap-2">
                    <Edit className="h-4 w-4" />
                    Edit Profile
                  </Button>
                </div>
              }
            />
          </div>
          
          {/* Patient Summary Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Patient Summary</CardTitle>
                <CardDescription>Quick overview of patient information</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-2">Contact Information</h3>
                  {patient.phoneNumber && (
                    <div className="flex items-center gap-2 mb-1">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{patient.phoneNumber}</span>
                    </div>
                  )}
                  {patient.email && (
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{patient.email}</span>
                    </div>
                  )}
                  {patient.homeAddress && (
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      <span>{patient.homeAddress}</span>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-2">Insurance Details</h3>
                  <p><span className="font-medium">Provider:</span> {patient.insuranceProvider || 'N/A'}</p>
                  <p><span className="font-medium">Policy #:</span> {patient.insuranceNumber || 'N/A'}</p>
                  <p><span className="font-medium">Group #:</span> {patient.insuranceGroupNumber || 'N/A'}</p>
                  {patient.insurancePrimaryHolder && (
                    <p><span className="font-medium">Primary:</span> {patient.insurancePrimaryHolder}</p>
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-2">Emergency Contact</h3>
                  {patient.emergencyContactName ? (
                    <>
                      <p className="font-medium">{patient.emergencyContactName}</p>
                      <p>{patient.emergencyContactPhone || 'No phone number'}</p>
                      <p className="text-sm text-muted-foreground">
                        {patient.emergencyContactRelationship || 'Relationship not specified'}
                      </p>
                    </>
                  ) : (
                    <p className="text-muted-foreground">No emergency contact provided</p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Medical Alerts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {patient.allergies && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <p className="font-medium text-destructive">Allergies:</p>
                    <p>{patient.allergies}</p>
                  </div>
                )}
                
                {(patient.underPhysicianCare && patient.physicianConditions) && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <p className="font-medium text-amber-800">Under Physician Care:</p>
                    <p>{patient.physicianConditions}</p>
                  </div>
                )}
                
                {patient.adverseAnestheticReaction && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <p className="font-medium text-destructive">Anesthetic Reaction:</p>
                    <p>History of adverse reaction to anesthetics</p>
                  </div>
                )}
                
                {!patient.allergies && !patient.physicianConditions && !patient.adverseAnestheticReaction && (
                  <p className="text-muted-foreground">No immediate medical alerts</p>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 w-full">
              <TabsTrigger value="personal" className="gap-2">
                <User className="h-4 w-4" />
                <span>Personal</span>
              </TabsTrigger>
              <TabsTrigger value="medical" className="gap-2">
                <Stethoscope className="h-4 w-4" />
                <span>Medical History</span>
              </TabsTrigger>
              <TabsTrigger value="dental" className="gap-2">
                <Tooth className="h-4 w-4" />
                <span>Dental History</span>
              </TabsTrigger>
              <TabsTrigger value="records" className="gap-2">
                <FileText className="h-4 w-4" />
                <span>Records</span>
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-2">
                <Activity className="h-4 w-4" />
                <span>Activity</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Personal Information Tab */}
            <TabsContent value="personal" className="pt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                      <p className="text-lg">{patientName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                      <p className="text-lg">{patient.dateOfBirth ? formatDate(patient.dateOfBirth) : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Age</p>
                      <p className="text-lg">{patientAge ? `${patientAge} years` : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p className="text-lg">{patient.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Phone</p>
                      <p className="text-lg">{patient.phoneNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Address</p>
                      <p className="text-lg">{patient.homeAddress || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Social Security Number</p>
                      <p className="text-lg">{patient.socialSecurityNumber || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Emergency Contact Information</h3>
                    {patient.emergencyContactName ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Name</p>
                          <p className="text-lg">{patient.emergencyContactName}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Phone</p>
                          <p className="text-lg">{patient.emergencyContactPhone || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Relationship</p>
                          <p className="text-lg">{patient.emergencyContactRelationship || 'N/A'}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No emergency contact information provided</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Medical History Tab */}
            <TabsContent value="medical" className="pt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Medical History</CardTitle>
                  <CardDescription>Comprehensive health information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Physician Care Section */}
                  <div>
                    <h3 className="text-lg font-medium mb-3">Current Medical Care</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Under Physician Care</p>
                        <p>{patient.underPhysicianCare ? 'Yes' : 'No'}</p>
                      </div>
                      {patient.underPhysicianCare && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Physician Conditions</p>
                          <p>{patient.physicianConditions || 'None specified'}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Recent Hospitalization</p>
                        <p>{patient.hospitalizedRecently ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Adverse Anesthetic Reaction</p>
                        <p>{patient.adverseAnestheticReaction ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Medical Conditions */}
                  <div>
                    <h3 className="text-lg font-medium mb-3">Medical Conditions</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {[
                        { name: 'Hypertension', value: patient.hypertension },
                        { name: 'Diabetes', value: patient.diabetes },
                        { name: 'Heart Disease', value: patient.heartDisease },
                        { name: 'Asthma', value: patient.asthma },
                        { name: 'Arthritis', value: patient.arthritis },
                        { name: 'Cancer', value: patient.cancer },
                        { name: 'Stroke', value: patient.stroke },
                        { name: 'Kidney Disease', value: patient.kidneyDisease },
                        { name: 'Liver Disease', value: patient.liverDisease },
                        { name: 'Thyroid Disease', value: patient.thyroidDisease },
                        { name: 'Mental Illness', value: patient.mentalIllness },
                        { name: 'Seizures', value: patient.seizures },
                        { name: 'Bleeding Disorders', value: patient.bleedingDisorders },
                        { name: 'Autoimmune Disorder', value: patient.autoimmune },
                        { name: 'Hepatitis', value: patient.hepatitis },
                        { name: 'HIV/AIDS', value: patient.hivAids },
                        { name: 'Lung Disease', value: patient.lungDisease },
                        { name: 'Osteoporosis', value: patient.osteoporosis }
                      ].map((condition, i) => (
                        <div 
                          key={i} 
                          className={`p-3 rounded-md border ${condition.value ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{condition.name}</p>
                            <Badge variant={condition.value ? 'destructive' : 'outline'}>
                              {condition.value ? 'Yes' : 'No'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Medications & Allergies */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-3">Medications</h3>
                      {patient.currentMedications ? (
                        <div className="p-4 bg-muted rounded-md">
                          <p className="whitespace-pre-wrap">{patient.currentMedications}</p>
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No current medications listed</p>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-3">Allergies</h3>
                      {patient.allergies ? (
                        <div className="p-4 bg-red-50 rounded-md border border-red-100">
                          <p className="whitespace-pre-wrap">{patient.allergies}</p>
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No allergies listed</p>
                      )}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Past Surgeries */}
                  <div>
                    <h3 className="text-lg font-medium mb-3">Surgical History</h3>
                    {patient.pastSurgeries ? (
                      <div className="p-4 bg-muted rounded-md">
                        <p className="whitespace-pre-wrap">{patient.pastSurgeries}</p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No surgical history listed</p>
                    )}
                  </div>
                  
                  <Separator />
                  
                  {/* Lifestyle Factors */}
                  <div>
                    <h3 className="text-lg font-medium mb-3">Lifestyle Factors</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className={`p-3 rounded-md border ${patient.smokesTobacco ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                        <p className="font-medium">Tobacco Use</p>
                        <Badge variant={patient.smokesTobacco ? 'destructive' : 'outline'}>
                          {patient.smokesTobacco ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      <div className={`p-3 rounded-md border ${patient.useAlcohol ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
                        <p className="font-medium">Alcohol Use</p>
                        <Badge variant={patient.useAlcohol ? 'secondary' : 'outline'}>
                          {patient.useAlcohol ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      <div className={`p-3 rounded-md border ${patient.isPregnantOrNursing ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
                        <p className="font-medium">Pregnant/Nursing</p>
                        <Badge variant={patient.isPregnantOrNursing ? 'default' : 'outline'}>
                          {patient.isPregnantOrNursing ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Dental History Tab */}
            <TabsContent value="dental" className="pt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Dental History</CardTitle>
                  <CardDescription>Oral health information and history</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Current Dental Issues */}
                  <div>
                    <h3 className="text-lg font-medium mb-3">Current Dental Concerns</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Chief Complaint</p>
                        <p className="whitespace-pre-wrap">{patient.chiefComplaint || 'None specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Current Symptoms</p>
                        <p className="whitespace-pre-wrap">{patient.currentSymptoms || 'None specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">When Issue Started</p>
                        <p>{patient.whenIssueStarted || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Experienced Before</p>
                        <p>{patient.experiencedBefore ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Dental History */}
                  <div>
                    <h3 className="text-lg font-medium mb-3">Dental History</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Last Dental Visit</p>
                        <p>{patient.lastDentalVisit || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Previous Dental Procedures</p>
                        <p className="whitespace-pre-wrap">{patient.previousDentalProcedures || 'None listed'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Additional Dental History</p>
                        <p className="whitespace-pre-wrap">{patient.dentalHistory || 'None listed'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Dental Conditions */}
                  <div>
                    <h3 className="text-lg font-medium mb-3">Dental Conditions</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {[
                        { name: 'Gum Disease', value: patient.hadGumDisease },
                        { name: 'Extractions', value: patient.hadExtractions },
                        { name: 'Dental Implants', value: patient.hadDentalImplants },
                        { name: 'Orthodontic Treatment', value: patient.hadOrthodonticTreatment },
                        { name: 'Root Canal', value: patient.hadRootCanal },
                        { name: 'Jaw/TMJ Pain', value: patient.hadJawPain },
                        { name: 'Sensitivity to Hot/Cold', value: patient.sensitivityToHotCold },
                        { name: 'Teeth Grinding', value: patient.grindTeeth },
                        { name: 'Interest in Cosmetic', value: patient.interestedInCosmetic },
                      ].map((condition, i) => (
                        <div 
                          key={i} 
                          className={`p-3 rounded-md border ${condition.value ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{condition.name}</p>
                            <Badge variant={condition.value ? 'default' : 'outline'}>
                              {condition.value ? 'Yes' : 'No'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Records Tab */}
            <TabsContent value="records" className="pt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Patient Records</CardTitle>
                  <CardDescription>Medical records, dental records, and documentation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center p-8 bg-muted/30 border border-dashed rounded-lg">
                    <h3 className="text-lg font-medium mb-2">Records Coming Soon</h3>
                    <p className="text-muted-foreground mb-4">
                      This section will display X-rays, treatment plans, and other patient records.
                    </p>
                    <Button>
                      Upload Records
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Activity Tab */}
            <TabsContent value="activity" className="pt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Patient Activity</CardTitle>
                  <CardDescription>Recent appointments, treatments, and interactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center p-8 bg-muted/30 border border-dashed rounded-lg">
                    <h3 className="text-lg font-medium mb-2">Activity Coming Soon</h3>
                    <p className="text-muted-foreground mb-4">
                      This section will display recent appointments, treatments, and communications with the patient.
                    </p>
                    <Button>
                      Schedule Appointment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}