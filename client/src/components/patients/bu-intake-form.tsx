import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updatePatient } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { patientIntakeFormSchema } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { BUIntakeFormPDF } from "./bu-intake-form-pdf";

type IntakeFormData = z.infer<typeof patientIntakeFormSchema>;

interface BUIntakeFormProps {
  patientId: number;
  initialData?: IntakeFormData;
  onClose?: () => void;
}

// Add these constants for the form options
const SYMPTOMS = [
  "Fainting or dizziness",
  "Seizures",
  "Diabetes",
  "High blood pressure",
  "Heart problems",
  "Lung problems",
  "Kidney problems",
  "Liver problems",
  "Stomach problems",
  "Blood disorders",
  "Cancer",
  "Radiation treatment",
  "Chemotherapy",
  "HIV/AIDS",
  "Hepatitis",
  "Tuberculosis",
  "Rheumatic fever",
  "Artificial heart valves",
  "Artificial joints",
  "Organ transplant",
  "Bleeding problems",
  "Allergies",
  "Asthma",
  "Arthritis",
  "Thyroid problems",
  "Epilepsy",
  "Mental illness",
  "Pregnancy",
  "Breastfeeding",
  "Other"
];

const MEDICAL_CONDITIONS = {
  cardiovascular: [
    "Heart attack",
    "Angina",
    "Heart failure",
    "Heart murmur",
    "High blood pressure",
    "Stroke",
    "Pacemaker",
    "Artificial heart valve",
    "Rheumatic fever"
  ],
  pulmonary: [
    "Asthma",
    "Emphysema",
    "Bronchitis",
    "Tuberculosis",
    "Other lung disease"
  ],
  nervousSystem: [
    "Epilepsy",
    "Seizures",
    "Stroke",
    "Multiple sclerosis",
    "Parkinson's disease",
    "Alzheimer's disease"
  ],
  bloodDisorders: [
    "Anemia",
    "Leukemia",
    "Hemophilia",
    "Sickle cell disease",
    "Clotting problems"
  ],
  gastrointestinal: [
    "Ulcers",
    "Hepatitis",
    "Cirrhosis",
    "Crohn's disease",
    "Colitis"
  ],
  stds: [
    "HIV/AIDS",
    "Syphilis",
    "Gonorrhea",
    "Herpes",
    "Other"
  ],
  hepatitis: [
    "Hepatitis A",
    "Hepatitis B",
    "Hepatitis C",
    "Other"
  ],
  hiv: [
    "HIV positive",
    "AIDS"
  ],
  endocrine: [
    "Diabetes",
    "Thyroid problems",
    "Adrenal problems",
    "Other"
  ],
  musculoskeletal: [
    "Arthritis",
    "Osteoporosis",
    "Artificial joints",
    "Back problems",
    "Other"
  ],
  femaleOnly: [
    "Pregnant",
    "Breastfeeding",
    "Menopause",
    "Hormone therapy"
  ]
};

export function BUIntakeForm({
  patientId,
  initialData,
  onClose,
}: BUIntakeFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<IntakeFormData>({
    resolver: zodResolver(patientIntakeFormSchema),
    defaultValues: initialData || {
      patientInfo: {
        firstName: "",
        middleName: "",
        lastName: "",
        age: "",
        height: "",
        weight: "",
        gender: "",
        dateOfBirth: "",
        phoneNumber: "",
      },
      generalMedical: {
        hasHeartCondition: false,
        hasHighBloodPressure: false,
        hasDiabetes: false,
        hasLiverDisease: false,
        hasKidneyDisease: false,
        hasLungDisease: false,
        hasNeurologicalCondition: false,
        hasBleedingDisorder: false,
        hasCancer: false,
        hasHIV: false,
        hasHepatitis: false,
        hasOtherConditions: false,
        otherConditions: "",
        medications: "",
        allergies: "",
      },
      symptoms: {
        hasFever: false,
        hasChills: false,
        hasFatigue: false,
        hasWeightLoss: false,
        hasNightSweats: false,
        hasCough: false,
        hasShortnessOfBreath: false,
        hasChestPain: false,
        hasPalpitations: false,
        hasSwelling: false,
        hasNausea: false,
        hasVomiting: false,
        hasDiarrhea: false,
        hasConstipation: false,
        hasAbdominalPain: false,
        hasHeadache: false,
        hasDizziness: false,
        hasFainting: false,
        hasSeizures: false,
        hasNumbness: false,
        hasTingling: false,
        hasWeakness: false,
        hasJointPain: false,
        hasMusclePain: false,
        hasRash: false,
        hasItching: false,
        hasBruising: false,
        hasBleeding: false,
        hasOtherSymptoms: false,
        otherSymptoms: "",
      },
      medicalConditions: {
        cardiovascular: [],
        pulmonary: [],
        neurological: [],
        gastrointestinal: [],
        endocrine: [],
        hematological: [],
        musculoskeletal: [],
        dermatological: [],
        other: [],
      },
      socialHistory: {
        tobaccoUse: {
          status: "",
          frequency: "",
          duration: "",
        },
        alcoholUse: {
          status: "",
          frequency: "",
          amount: "",
        },
        drugUse: {
          status: "",
          substances: "",
          frequency: "",
        },
      },
      dentalHistory: {
        lastVisit: "",
        frequency: "",
        brushingFrequency: "",
        flossingFrequency: "",
        hasBleedingGums: false,
        hasLooseTeeth: false,
        hasSensitiveTeeth: false,
        hasJawPain: false,
        hasClickingJaw: false,
        hasGrindingTeeth: false,
        hasPreviousDentalWork: false,
        previousDentalWork: "",
      },
      behavioralQuestions: {
        anxietyLevel: "",
        fearLevel: "",
        previousExperience: "",
        concerns: "",
      },
      additionalInfo: {
        notes: "",
        patientSignature: "",
        date: "",
        providerSignature: "",
        providerDate: "",
      },
    },
  });

  const mutation = useMutation({
    mutationFn: (data: IntakeFormData) =>
      updatePatient(patientId, { patientIntakeForm: data }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Intake form updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}`] });
      onClose?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update intake form",
        variant: "destructive",
      });
      console.error("Error updating intake form:", error);
    },
  });

  const onSubmit = (data: IntakeFormData) => {
    mutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Boston University Dental Intake Form</CardTitle>
        <div className="flex gap-2">
          <PDFDownloadLink
            document={
              <BUIntakeFormPDF
                patientName={`${initialData?.patientInfo.firstName} ${initialData?.patientInfo.lastName}`}
                formData={form.getValues()}
              />
            }
            fileName="patient-intake-form.pdf"
          >
            {({ loading }) => (
              <Button type="button" variant="outline" disabled={loading}>
                {loading ? "Generating PDF..." : "Export as PDF"}
              </Button>
            )}
          </PDFDownloadLink>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Tabs defaultValue="patientInfo" className="w-full">
              <TabsList className="grid w-full grid-cols-8">
                <TabsTrigger value="patientInfo">Patient Info</TabsTrigger>
                <TabsTrigger value="generalMedical">General Medical</TabsTrigger>
                <TabsTrigger value="symptoms">Symptoms</TabsTrigger>
                <TabsTrigger value="medicalConditions">Medical Conditions</TabsTrigger>
                <TabsTrigger value="socialHistory">Social History</TabsTrigger>
                <TabsTrigger value="dentalHistory">Dental History</TabsTrigger>
                <TabsTrigger value="behavioralQuestions">Behavioral</TabsTrigger>
                <TabsTrigger value="signatures">Signatures</TabsTrigger>
              </TabsList>

              {/* Patient Info Section */}
              <TabsContent value="patientInfo">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="patientInfo.firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="patientInfo.middleName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Middle Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="patientInfo.lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="patientInfo.age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="patientInfo.height"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Height</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="patientInfo.weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="patientInfo.gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                            <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="patientInfo.dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="patientInfo.phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* General Medical Section */}
              <TabsContent value="generalMedical">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="generalMedical.hasHeartCondition"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel>Heart Condition</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="generalMedical.hasHighBloodPressure"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel>High Blood Pressure</FormLabel>
                        </FormItem>
                      )}
                    />
                    {/* Add other medical conditions similarly */}
                  </div>
                  <FormField
                    control={form.control}
                    name="generalMedical.medications"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Medications</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="generalMedical.allergies"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Allergies</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Symptoms Section */}
              <TabsContent value="symptoms">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Symptoms Checklist (Past 6 Months)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {SYMPTOMS.map((symptom) => (
                      <FormField
                        key={symptom}
                        control={form.control}
                        name={`symptoms.${symptom}`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>{symptom}</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Medical Conditions Section */}
              <TabsContent value="medicalConditions">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Medical Conditions</h3>
                  {Object.entries(MEDICAL_CONDITIONS).map(([category, conditions]) => (
                    <div key={category} className="space-y-2">
                      <h4 className="font-medium capitalize">{category.replace(/([A-Z])/g, ' $1').trim()}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {conditions.map((condition) => (
                          <FormField
                            key={condition}
                            control={form.control}
                            name={`medicalConditions.${category}.${condition}`}
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>{condition}</FormLabel>
                                </div>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Social History Section */}
              <TabsContent value="socialHistory">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Social History</h3>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="socialHistory.tobaccoUse.status"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value === "current"}
                              onCheckedChange={(value) => field.onChange(value ? "current" : "never")}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Do you use tobacco products?</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="socialHistory.alcoholUse.status"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value === "current"}
                              onCheckedChange={(value) => field.onChange(value ? "current" : "never")}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Do you drink alcohol?</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    {form.watch("socialHistory.alcoholUse.status") === "current" && (
                      <>
                        <FormField
                          control={form.control}
                          name="socialHistory.alcoholUse.frequency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>How often do you drink alcohol?</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select frequency" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="daily">Daily</SelectItem>
                                  <SelectItem value="weekly">Weekly</SelectItem>
                                  <SelectItem value="monthly">Monthly</SelectItem>
                                  <SelectItem value="rarely">Rarely</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="socialHistory.alcoholUse.amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Amount of alcohol consumed</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="socialHistory.alcoholUse.duration"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Duration of alcohol consumption</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="socialHistory.alcoholUse.problem"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Have you ever had a problem with alcohol?</FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    <FormField
                      control={form.control}
                      name="socialHistory.drugUse.status"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value === "current"}
                              onCheckedChange={(value) => field.onChange(value ? "current" : "never")}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Do you use any illicit drugs?</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    {form.watch("socialHistory.drugUse.status") === "current" && (
                      <>
                        <FormField
                          control={form.control}
                          name="socialHistory.drugUse.substances"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Substances</FormLabel>
                              <FormControl>
                                <Textarea {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="socialHistory.drugUse.frequency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Frequency</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Dental History Section */}
              <TabsContent value="dentalHistory">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Dental History</h3>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="dentalHistory.lastVisit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Dental Visit</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dentalHistory.frequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dental Visit Frequency</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dentalHistory.brushingFrequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Brushing Frequency</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dentalHistory.flossingFrequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Flossing Frequency</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dentalHistory.hasBleedingGums"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Bleeding Gums</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dentalHistory.hasLooseTeeth"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Loose Teeth</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dentalHistory.hasSensitiveTeeth"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Sensitive Teeth</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dentalHistory.hasJawPain"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Jaw Pain</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dentalHistory.hasClickingJaw"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Clicking Jaw</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dentalHistory.hasGrindingTeeth"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Grinding Teeth</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dentalHistory.hasPreviousDentalWork"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Previous Dental Work</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    {form.watch("dentalHistory.hasPreviousDentalWork") && (
                      <FormField
                        control={form.control}
                        name="dentalHistory.previousDentalWork"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description of Previous Dental Work</FormLabel>
                            <FormControl>
                              <Textarea {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Behavioral Questions Section */}
              <TabsContent value="behavioralQuestions">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Behavioral Questions</h3>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="behavioralQuestions.anxietyLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Anxiety Level</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="behavioralQuestions.fearLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fear Level</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="behavioralQuestions.previousExperience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Previous Dental Experience</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="behavioralQuestions.concerns"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Concerns</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Signatures Section */}
              <TabsContent value="signatures">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Signatures</h3>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="additionalInfo.notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Notes</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="additionalInfo.patientSignature"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Patient Signature</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="additionalInfo.date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="additionalInfo.providerSignature"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Provider Signature</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="additionalInfo.providerDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Provider Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2">
              {onClose && (
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 