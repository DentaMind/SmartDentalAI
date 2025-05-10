import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FileText, Upload, AlertTriangle, LineChart, FilePlus2 } from "lucide-react";

// Define types for lab test data
export interface LabResult {
  id?: number;
  patientId: number;
  doctorId: number;
  date: Date;
  testType: string;
  testName: string;
  category: "blood" | "urine" | "imaging" | "other";
  results: Record<string, any>;
  units?: Record<string, string>;
  normalRanges?: Record<string, { min: number; max: number }>;
  notes?: string;
  orderedBy?: string;
  performedBy?: string;
  status: "pending" | "completed" | "reviewed";
  fileUrl?: string;
  aiAnalysis?: Record<string, any>;
}

// Schema for form validation
const labResultSchema = z.object({
  testType: z.string().min(1, "Test type is required"),
  testName: z.string().min(1, "Test name is required"),
  category: z.enum(["blood", "urine", "imaging", "other"]),
  date: z.string().min(1, "Date is required"),
  performedBy: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["pending", "completed", "reviewed"]).default("completed"),
  fileUrl: z.string().optional(),
});

// Blood test template forms
const bloodTestTemplates = {
  cbc: {
    name: "Complete Blood Count (CBC)",
    fields: [
      { name: "wbc", label: "White Blood Cell Count", unit: "K/µL", normalRange: { min: 4.5, max: 11.0 } },
      { name: "rbc", label: "Red Blood Cell Count", unit: "M/µL", normalRange: { min: 4.5, max: 5.9 } },
      { name: "hgb", label: "Hemoglobin", unit: "g/dL", normalRange: { min: 13.5, max: 17.5 } },
      { name: "hct", label: "Hematocrit", unit: "%", normalRange: { min: 41, max: 50 } },
      { name: "plt", label: "Platelet Count", unit: "K/µL", normalRange: { min: 150, max: 450 } },
    ]
  },
  chemistry: {
    name: "Basic Metabolic Panel",
    fields: [
      { name: "glucose", label: "Glucose", unit: "mg/dL", normalRange: { min: 70, max: 100 } },
      { name: "bun", label: "BUN", unit: "mg/dL", normalRange: { min: 7, max: 20 } },
      { name: "creatinine", label: "Creatinine", unit: "mg/dL", normalRange: { min: 0.7, max: 1.3 } },
      { name: "sodium", label: "Sodium", unit: "mmol/L", normalRange: { min: 135, max: 145 } },
      { name: "potassium", label: "Potassium", unit: "mmol/L", normalRange: { min: 3.5, max: 5.0 } },
      { name: "chloride", label: "Chloride", unit: "mmol/L", normalRange: { min: 98, max: 107 } },
      { name: "co2", label: "CO2", unit: "mmol/L", normalRange: { min: 22, max: 29 } },
    ]
  },
  lipid: {
    name: "Lipid Panel",
    fields: [
      { name: "totalChol", label: "Total Cholesterol", unit: "mg/dL", normalRange: { min: 0, max: 200 } },
      { name: "ldl", label: "LDL", unit: "mg/dL", normalRange: { min: 0, max: 100 } },
      { name: "hdl", label: "HDL", unit: "mg/dL", normalRange: { min: 40, max: 60 } },
      { name: "triglycerides", label: "Triglycerides", unit: "mg/dL", normalRange: { min: 0, max: 150 } },
    ]
  },
  thyroid: {
    name: "Thyroid Panel",
    fields: [
      { name: "tsh", label: "TSH", unit: "mIU/L", normalRange: { min: 0.4, max: 4.0 } },
      { name: "t4", label: "T4", unit: "µg/dL", normalRange: { min: 4.5, max: 12.0 } },
      { name: "t3", label: "T3", unit: "ng/dL", normalRange: { min: 80, max: 200 } },
    ]
  },
};

// Urine test template forms
const urineTestTemplates = {
  urinalysis: {
    name: "Urinalysis",
    fields: [
      { name: "color", label: "Color", unit: "", normalRange: { min: 0, max: 0 } },
      { name: "clarity", label: "Clarity", unit: "", normalRange: { min: 0, max: 0 } },
      { name: "ph", label: "pH", unit: "", normalRange: { min: 4.5, max: 8.0 } },
      { name: "specificGravity", label: "Specific Gravity", unit: "", normalRange: { min: 1.005, max: 1.030 } },
      { name: "glucose", label: "Glucose", unit: "", normalRange: { min: 0, max: 0 } },
      { name: "protein", label: "Protein", unit: "", normalRange: { min: 0, max: 0 } },
      { name: "ketones", label: "Ketones", unit: "", normalRange: { min: 0, max: 0 } },
      { name: "blood", label: "Blood", unit: "", normalRange: { min: 0, max: 0 } },
      { name: "nitrite", label: "Nitrite", unit: "", normalRange: { min: 0, max: 0 } },
      { name: "leukocytes", label: "Leukocytes", unit: "", normalRange: { min: 0, max: 0 } },
    ]
  }
};

// Vitals template
const vitalsTemplate = {
  fields: [
    { name: "bloodPressureSystolic", label: "Blood Pressure (Systolic)", unit: "mmHg", normalRange: { min: 90, max: 120 } },
    { name: "bloodPressureDiastolic", label: "Blood Pressure (Diastolic)", unit: "mmHg", normalRange: { min: 60, max: 80 } },
    { name: "heartRate", label: "Heart Rate", unit: "bpm", normalRange: { min: 60, max: 100 } },
    { name: "respiratoryRate", label: "Respiratory Rate", unit: "breaths/min", normalRange: { min: 12, max: 20 } },
    { name: "temperature", label: "Temperature", unit: "°F", normalRange: { min: 97.7, max: 99.5 } },
    { name: "oxygenSaturation", label: "Oxygen Saturation", unit: "%", normalRange: { min: 95, max: 100 } },
    { name: "weight", label: "Weight", unit: "kg", normalRange: { min: 0, max: 0 } },
    { name: "height", label: "Height", unit: "cm", normalRange: { min: 0, max: 0 } },
    { name: "bmi", label: "BMI", unit: "kg/m²", normalRange: { min: 18.5, max: 24.9 } },
  ]
};

const LabResultsUpload: React.FC<{
  patientId: number;
  doctorId: number;
  onLabResultAdded?: (result: LabResult) => void;
}> = ({ patientId, doctorId, onLabResultAdded }) => {
  const [testTemplate, setTestTemplate] = useState<string>("");
  const [templateFields, setTemplateFields] = useState<any[]>([]);
  const [testFieldValues, setTestFieldValues] = useState<Record<string, any>>({});
  const [selectedTab, setSelectedTab] = useState<string>("upload");
  const [fileSelected, setFileSelected] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>("");
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof labResultSchema>>({
    resolver: zodResolver(labResultSchema),
    defaultValues: {
      testType: "",
      testName: "",
      category: "blood",
      date: new Date().toISOString().split("T")[0],
      status: "completed",
      notes: "",
    },
  });

  const addLabResultMutation = useMutation({
    mutationFn: async (data: LabResult) => {
      return await apiRequest<LabResult>(`/api/patients/${patientId}/lab-results`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/lab-results`] });
      toast({
        title: "Lab result added",
        description: "The lab result has been successfully added to the patient record.",
      });
      if (onLabResultAdded) {
        onLabResultAdded(data);
      }
      form.reset();
      setTestFieldValues({});
      setTestTemplate("");
      setTemplateFields([]);
      setFileSelected(false);
      setFileName("");
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error adding lab result",
        description: "There was an error adding the lab result. Please try again.",
      });
      console.error("Error adding lab result:", error);
    },
  });

  const handleTemplateChange = (templateId: string, category: string) => {
    setTestTemplate(templateId);
    form.setValue("testType", category);
    
    let template;
    if (category === "blood") {
      template = bloodTestTemplates[templateId as keyof typeof bloodTestTemplates];
      form.setValue("category", "blood");
    } else if (category === "urine") {
      template = urineTestTemplates[templateId as keyof typeof urineTestTemplates];
      form.setValue("category", "urine");
    }

    if (template) {
      form.setValue("testName", template.name);
      setTemplateFields(template.fields);
      
      // Initialize test field values with empty strings
      const initialValues: Record<string, any> = {};
      template.fields.forEach(field => {
        initialValues[field.name] = "";
      });
      setTestFieldValues(initialValues);
    } else if (templateId === "vitals") {
      form.setValue("testName", "Vital Signs");
      form.setValue("testType", "vitals");
      form.setValue("category", "other");
      setTemplateFields(vitalsTemplate.fields);
      
      // Initialize test field values with empty strings
      const initialValues: Record<string, any> = {};
      vitalsTemplate.fields.forEach(field => {
        initialValues[field.name] = "";
      });
      setTestFieldValues(initialValues);
    }
  };

  const handleTestFieldChange = (fieldName: string, value: string) => {
    setTestFieldValues((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFileSelected(true);
      setFileName(files[0].name);
      // Note: In a real app, you would upload the file to a server here
    } else {
      setFileSelected(false);
      setFileName("");
    }
  };

  const onSubmit = (values: z.infer<typeof labResultSchema>) => {
    // Prepare units and normal ranges
    const units: Record<string, string> = {};
    const normalRanges: Record<string, { min: number; max: number }> = {};
    
    templateFields.forEach(field => {
      units[field.name] = field.unit;
      normalRanges[field.name] = field.normalRange;
    });

    const labResult: LabResult = {
      patientId,
      doctorId,
      date: new Date(values.date),
      testType: values.testType,
      testName: values.testName,
      category: values.category,
      results: testFieldValues,
      units,
      normalRanges,
      notes: values.notes,
      performedBy: values.performedBy,
      status: values.status,
      fileUrl: fileSelected ? `/mock-url/${fileName}` : undefined,
    };

    addLabResultMutation.mutate(labResult);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Add Lab Result</CardTitle>
        <CardDescription>
          Upload a new lab result or enter test values manually
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="upload">
              <FileText className="h-4 w-4 mr-2" />
              Upload Results
            </TabsTrigger>
            <TabsTrigger value="manual">
              <FilePlus2 className="h-4 w-4 mr-2" />
              Manual Entry
            </TabsTrigger>
            <TabsTrigger value="vitals">
              <LineChart className="h-4 w-4 mr-2" />
              Vital Signs
            </TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="date"
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
                  name="performedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Performed By</FormLabel>
                      <FormControl>
                        <Input placeholder="Lab Name or Technician" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="reviewed">Reviewed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <TabsContent value="upload" className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">Upload Lab Result</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Drag and drop your file here, or click to browse
                  </p>
                  <Input
                    type="file"
                    className="hidden"
                    id="file-upload"
                    onChange={handleFileChange}
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById("file-upload")?.click()}
                    className="mx-auto"
                  >
                    Select File
                  </Button>
                  {fileSelected && (
                    <div className="mt-4 text-sm text-green-600">
                      File selected: {fileName}
                    </div>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="testName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Test Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Complete Blood Count (CBC)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="blood">Blood</SelectItem>
                          <SelectItem value="urine">Urine</SelectItem>
                          <SelectItem value="imaging">Imaging</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Add any notes about this lab result" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="manual" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="testType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Test Type</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            if (value === "cbc" || value === "chemistry" || value === "lipid" || value === "thyroid") {
                              handleTemplateChange(value, "blood");
                            } else if (value === "urinalysis") {
                              handleTemplateChange(value, "urine");
                            } else {
                              field.onChange(value);
                            }
                          }}
                          value={testTemplate || field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select test type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cbc">Complete Blood Count (CBC)</SelectItem>
                            <SelectItem value="chemistry">Basic Metabolic Panel</SelectItem>
                            <SelectItem value="lipid">Lipid Panel</SelectItem>
                            <SelectItem value="thyroid">Thyroid Panel</SelectItem>
                            <SelectItem value="urinalysis">Urinalysis</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="testName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Test Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Complete Blood Count (CBC)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {templateFields.length > 0 && (
                  <div className="border rounded-md p-4">
                    <h3 className="text-lg font-medium mb-4">Test Results</h3>
                    
                    <div className="grid grid-cols-4 gap-4">
                      {templateFields.map((field, index) => (
                        <div key={index} className="space-y-1">
                          <label className="text-sm font-medium">
                            {field.label}
                            {field.unit && <span className="text-gray-500 text-xs ml-1">({field.unit})</span>}
                          </label>
                          <div className="flex items-center">
                            <Input
                              value={testFieldValues[field.name] || ""}
                              onChange={(e) => handleTestFieldChange(field.name, e.target.value)}
                              className={
                                field.normalRange && testFieldValues[field.name] !== "" && !isNaN(parseFloat(testFieldValues[field.name]))
                                  ? parseFloat(testFieldValues[field.name]) < field.normalRange.min ||
                                    parseFloat(testFieldValues[field.name]) > field.normalRange.max
                                    ? "border-red-300 focus:border-red-500"
                                    : "border-green-300 focus:border-green-500"
                                  : ""
                              }
                            />
                            {field.normalRange && 
                             testFieldValues[field.name] !== "" && 
                             !isNaN(parseFloat(testFieldValues[field.name])) && (
                              parseFloat(testFieldValues[field.name]) < field.normalRange.min ||
                              parseFloat(testFieldValues[field.name]) > field.normalRange.max
                                ? <AlertTriangle className="h-4 w-4 ml-2 text-red-500" />
                                : null
                            )}
                          </div>
                          {field.normalRange && field.normalRange.min !== 0 && field.normalRange.max !== 0 && (
                            <p className="text-xs text-gray-500">
                              Normal range: {field.normalRange.min} - {field.normalRange.max}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Add any notes about this lab result" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="vitals" className="space-y-4">
                <div className="border rounded-md p-4">
                  <h3 className="text-lg font-medium mb-4">Vital Signs</h3>
                  
                  <div className="grid grid-cols-4 gap-4">
                    {handleTemplateChange("vitals", "other") && vitalsTemplate.fields.map((field, index) => (
                      <div key={index} className="space-y-1">
                        <label className="text-sm font-medium">
                          {field.label}
                          {field.unit && <span className="text-gray-500 text-xs ml-1">({field.unit})</span>}
                        </label>
                        <div className="flex items-center">
                          <Input
                            value={testFieldValues[field.name] || ""}
                            onChange={(e) => handleTestFieldChange(field.name, e.target.value)}
                            className={
                              field.normalRange && 
                              field.normalRange.min !== 0 && 
                              field.normalRange.max !== 0 && 
                              testFieldValues[field.name] !== "" && 
                              !isNaN(parseFloat(testFieldValues[field.name]))
                                ? parseFloat(testFieldValues[field.name]) < field.normalRange.min ||
                                  parseFloat(testFieldValues[field.name]) > field.normalRange.max
                                  ? "border-red-300 focus:border-red-500"
                                  : "border-green-300 focus:border-green-500"
                                : ""
                            }
                          />
                          {field.normalRange && 
                           field.normalRange.min !== 0 && 
                           field.normalRange.max !== 0 && 
                           testFieldValues[field.name] !== "" && 
                           !isNaN(parseFloat(testFieldValues[field.name])) && (
                            parseFloat(testFieldValues[field.name]) < field.normalRange.min ||
                            parseFloat(testFieldValues[field.name]) > field.normalRange.max
                              ? <AlertTriangle className="h-4 w-4 ml-2 text-red-500" />
                              : null
                          )}
                        </div>
                        {field.normalRange && field.normalRange.min !== 0 && field.normalRange.max !== 0 && (
                          <p className="text-xs text-gray-500">
                            Normal range: {field.normalRange.min} - {field.normalRange.max}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Add any notes about vital signs" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <div className="mt-6">
                <Button type="submit" disabled={addLabResultMutation.isPending}>
                  {addLabResultMutation.isPending ? "Saving..." : "Save Lab Result"}
                </Button>
              </div>
            </form>
          </Form>
        </Tabs>
      </CardContent>
      
      <CardFooter className="text-sm text-gray-500 border-t pt-4">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
          <p>
            Lab results are automatically analyzed by AI to detect abnormalities and potential health concerns. 
            Results outside normal ranges will be flagged for provider review.
          </p>
        </div>
      </CardFooter>
    </Card>
  );
};

export default LabResultsUpload;