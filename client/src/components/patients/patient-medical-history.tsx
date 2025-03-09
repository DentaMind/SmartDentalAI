import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { 
  CalendarIcon, 
  CloudUpload, 
  Save, 
  AlertCircle, 
  Printer,
  FileDigit,
  FilePlus2
} from 'lucide-react';

interface PatientMedicalHistoryProps {
  patientId?: number;
  patientName?: string;
  readOnly?: boolean;
  onSave?: (data: any) => void;
}

export function PatientMedicalHistory({ 
  patientId, 
  patientName = "New Patient", 
  readOnly = false,
  onSave
}: PatientMedicalHistoryProps) {
  const [activeTab, setActiveTab] = useState("general");
  const [hasVisitedDentist, setHasVisitedDentist] = useState<boolean | null>(null);
  const [hasExperiencedIssue, setHasExperiencedIssue] = useState<boolean | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  // Array of dental conditions for checkboxes
  const dentalConditions = [
    { id: "gum-disease", label: "Gum Disease" },
    { id: "tooth-extractions", label: "Tooth Extractions" },
    { id: "dental-implants", label: "Dental Implants" },
    { id: "jaw-pain", label: "Jaw Pain & TMJ Disorders" },
    { id: "root-canal", label: "Root Canal Therapy" },
    { id: "orthodontic", label: "Orthodontic Treatment" },
    { id: "sensitivity", label: "Sensitivity to Hot/Cold" },
    { id: "grind-teeth", label: "Grind Teeth" },
    { id: "cosmetic-dentistry", label: "Interested in Cosmetic Dentistry" },
    { id: "periodontal-disease", label: "Periodontal Disease" },
    { id: "gingivitis", label: "Gingivitis" },
    { id: "receding-gums", label: "Receding Gums" },
    { id: "tooth-decay", label: "Tooth Decay/Cavities" },
    { id: "dental-abscesses", label: "Dental Abscesses" },
    { id: "oral-cancer", label: "Oral Cancer" },
    { id: "mouth-ulcers", label: "Mouth Ulcers/Canker Sores" },
    { id: "dry-mouth", label: "Dry Mouth" },
    { id: "halitosis", label: "Halitosis (Bad Breath)" },
    { id: "bruxism", label: "Bruxism (Teeth Grinding)" },
    { id: "temporomandibular", label: "Temporomandibular Joint Disorders (TMJ)" },
    { id: "malocclusion", label: "Malocclusion (Misaligned Teeth)" },
    { id: "tooth-sensitivity", label: "Tooth Sensitivity" },
    { id: "fluorosis", label: "Fluorosis" },
    { id: "enamel-hypoplasia", label: "Enamel Hypoplasia" }
  ];

  // Array of medical conditions for checkboxes
  const medicalConditions = [
    { id: "diabetes", label: "Diabetes" },
    { id: "heart-disease", label: "Heart Disease" },
    { id: "high-blood-pressure", label: "High Blood Pressure" },
    { id: "asthma", label: "Asthma" },
    { id: "arthritis", label: "Arthritis" },
    { id: "thyroid-disease", label: "Thyroid Disease" },
    { id: "cancer", label: "Cancer" },
    { id: "stroke", label: "Stroke" },
    { id: "kidney-disease", label: "Kidney Disease" },
    { id: "liver-disease", label: "Liver Disease" },
    { id: "epilepsy", label: "Epilepsy" },
    { id: "bleeding-disorder", label: "Bleeding Disorder" },
    { id: "hiv-aids", label: "HIV/AIDS" },
    { id: "hepatitis", label: "Hepatitis" },
    { id: "tuberculosis", label: "Tuberculosis" },
    { id: "rheumatic-fever", label: "Rheumatic Fever" },
    { id: "respiratory-problems", label: "Respiratory Problems" },
    { id: "autoimmune-disease", label: "Autoimmune Disease" },
    { id: "mental-health-condition", label: "Mental Health Condition" },
    { id: "osteoporosis", label: "Osteoporosis" },
    { id: "alzheimers", label: "Alzheimer's Disease" },
    { id: "parkinsons", label: "Parkinson's Disease" },
    { id: "multiple-sclerosis", label: "Multiple Sclerosis" },
    { id: "lupus", label: "Lupus" },
    { id: "crohns-disease", label: "Crohn's Disease" },
    { id: "ulcerative-colitis", label: "Ulcerative Colitis" },
    { id: "fibromyalgia", label: "Fibromyalgia" },
    { id: "chronic-fatigue", label: "Chronic Fatigue Syndrome" }
  ];

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...fileArray]);
    }
  };

  // Handle file upload
  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    setUploading(true);
    
    // Simulate upload delay
    setTimeout(() => {
      console.log("Uploaded files:", selectedFiles);
      setUploading(false);
      // In a real app, you would upload the files to a server here
    }, 1500);
  };

  // Handle form save
  const handleSave = () => {
    const formData = {
      // Form data would be collected here
      medicalDocuments: selectedFiles.map(file => file.name)
    };
    
    if (onSave) {
      onSave(formData);
    }
    
    console.log("Saving medical history:", formData);
  };
  
  // Remove a file from the selected files
  const removeFile = (fileName: string) => {
    setSelectedFiles(prev => prev.filter(file => file.name !== fileName));
  };

  return (
    <Card className="w-full max-h-[calc(100vh-80px)]">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Patient Medical History</CardTitle>
            <CardDescription>
              {patientId ? `Medical history for ${patientName}` : 'New patient medical history form'}
            </CardDescription>
          </div>
          
          {!readOnly && (
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button className="gap-2" onClick={handleSave}>
                <Save className="h-4 w-4" />
                Save
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-[calc(100vh-250px)] pr-4">
          <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="general">General Information</TabsTrigger>
              <TabsTrigger value="dental">Dental History</TabsTrigger>
              <TabsTrigger value="medical">Medical History</TabsTrigger>
              <TabsTrigger value="documents">Medical Documents</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="last-dental-visit">Last Dental Visit</Label>
                  <div className="relative">
                    <Input 
                      id="last-dental-visit" 
                      type="date" 
                      className="mt-1"
                      disabled={readOnly}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="issue-start">When did the issue start?</Label>
                  <Input 
                    id="issue-start" 
                    placeholder="e.g., 2 weeks ago" 
                    className="mt-1"
                    disabled={readOnly}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="chief-complaint">Chief Complaint</Label>
                <Textarea 
                  id="chief-complaint" 
                  placeholder="Main reason for visit" 
                  className="mt-1"
                  rows={3}
                  disabled={readOnly}
                />
              </div>
              
              <div>
                <div className="mb-2">Have you experienced this before?</div>
                <RadioGroup 
                  onValueChange={(val) => setHasExperiencedIssue(val === 'yes')}
                  disabled={readOnly}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="experienced-yes" />
                    <Label htmlFor="experienced-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="experienced-no" />
                    <Label htmlFor="experienced-no">No</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div>
                <Label htmlFor="current-symptoms">Current Symptoms</Label>
                <Textarea 
                  id="current-symptoms" 
                  placeholder="Describe any current dental symptoms" 
                  className="mt-1"
                  rows={4}
                  disabled={readOnly}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="dental" className="space-y-6">
              <h3 className="text-lg font-medium">Previous Dental Conditions</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {dentalConditions.map((condition) => (
                  <div key={condition.id} className="flex items-start space-x-2">
                    <Checkbox 
                      id={condition.id} 
                      disabled={readOnly}
                    />
                    <Label 
                      htmlFor={condition.id}
                      className="leading-tight"
                    >
                      {condition.label}
                    </Label>
                  </div>
                ))}
              </div>
              
              <Separator />
              
              <div>
                <Label htmlFor="dental-procedures">Previous Dental Procedures</Label>
                <Textarea 
                  id="dental-procedures" 
                  placeholder="List any previous dental work (fillings, crowns, root canals, etc.)" 
                  className="mt-1"
                  rows={4}
                  disabled={readOnly}
                />
              </div>
              
              <div>
                <Label htmlFor="dental-concerns">Current Dental Concerns</Label>
                <Textarea 
                  id="dental-concerns" 
                  placeholder="List any current dental concerns or problems" 
                  className="mt-1"
                  rows={3}
                  disabled={readOnly}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="medical" className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="allergies">Allergies</Label>
                  <Textarea 
                    id="allergies" 
                    placeholder="List any allergies (medications, latex, etc.)" 
                    className="mt-1"
                    rows={3}
                    disabled={readOnly}
                  />
                </div>
                
                <div>
                  <Label htmlFor="medications">Current Medications</Label>
                  <Textarea 
                    id="medications" 
                    placeholder="List all current medications and supplements" 
                    className="mt-1"
                    rows={3}
                    disabled={readOnly}
                  />
                </div>
              </div>
              
              <h3 className="text-lg font-medium mt-4">Medical Conditions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {medicalConditions.map((condition) => (
                  <div key={condition.id} className="flex items-start space-x-2">
                    <Checkbox 
                      id={condition.id} 
                      disabled={readOnly}
                    />
                    <Label 
                      htmlFor={condition.id}
                      className="leading-tight"
                    >
                      {condition.label}
                    </Label>
                  </div>
                ))}
              </div>
              
              <div>
                <Label htmlFor="other-conditions">Other Medical Conditions</Label>
                <Textarea 
                  id="other-conditions" 
                  placeholder="List any other medical conditions not mentioned above" 
                  className="mt-1"
                  rows={3}
                  disabled={readOnly}
                />
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block">Do you smoke or use tobacco products?</Label>
                  <RadioGroup defaultValue="no" disabled={readOnly}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="tobacco-yes" />
                      <Label htmlFor="tobacco-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="tobacco-no" />
                      <Label htmlFor="tobacco-no">No</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="former" id="tobacco-former" />
                      <Label htmlFor="tobacco-former">Former smoker</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div>
                  <Label className="mb-2 block">Do you drink alcohol?</Label>
                  <RadioGroup defaultValue="no" disabled={readOnly}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="alcohol-yes" />
                      <Label htmlFor="alcohol-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="alcohol-no" />
                      <Label htmlFor="alcohol-no">No</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="occasional" id="alcohol-occasional" />
                      <Label htmlFor="alcohol-occasional">Occasionally</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
              
              <div>
                <Label htmlFor="additional-info">Additional Information</Label>
                <Textarea 
                  id="additional-info" 
                  placeholder="Any additional medical information we should know about?" 
                  className="mt-1"
                  rows={3}
                  disabled={readOnly}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="documents" className="space-y-6">
              <h3 className="text-lg font-medium">Medical Documents</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload relevant medical documents such as lab work, x-rays, or other test results.
              </p>
              
              {!readOnly && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed rounded-md p-6 text-center">
                    <CloudUpload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm mb-2">Drag and drop files here or click to browse</p>
                    <div className="mt-2">
                      <label>
                        <Input 
                          type="file" 
                          className="hidden" 
                          onChange={handleFileSelect}
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                        />
                        <Button type="button" variant="outline" size="sm" className="mr-2">
                          Browse Files
                        </Button>
                      </label>
                      <Button 
                        type="button" 
                        size="sm"
                        disabled={selectedFiles.length === 0 || uploading}
                        onClick={handleFileUpload}
                      >
                        {uploading ? "Uploading..." : "Upload"}
                      </Button>
                    </div>
                    
                    <div className="text-xs text-muted-foreground mt-2">
                      Supported file types: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX
                    </div>
                  </div>
                  
                  {selectedFiles.length > 0 && (
                    <div className="border rounded-md p-4">
                      <h4 className="text-sm font-medium mb-2">Selected Files</h4>
                      <div className="space-y-2">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex justify-between items-center bg-muted/50 p-2 rounded-md">
                            <div className="flex items-center space-x-2">
                              <FileDigit className="h-4 w-4 text-blue-500" />
                              <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                              <span className="text-xs text-muted-foreground">
                                ({(file.size / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removeFile(file.name)}
                              className="h-8 w-8 p-0"
                            >
                              &times;
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="border rounded-md p-4">
                <h4 className="text-sm font-medium mb-2">Uploaded Documents</h4>
                
                <div className="divide-y">
                  <div className="py-3 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <FilePlus2 className="h-4 w-4 text-blue-500" />
                      <div>
                        <div className="font-medium text-sm">Blood Work Results.pdf</div>
                        <div className="text-xs text-muted-foreground">Uploaded on Jan 15, 2025</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">View</Button>
                  </div>
                  
                  <div className="py-3 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <FilePlus2 className="h-4 w-4 text-blue-500" />
                      <div>
                        <div className="font-medium text-sm">Vaccination Records.pdf</div>
                        <div className="text-xs text-muted-foreground">Uploaded on Dec 5, 2024</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">View</Button>
                  </div>
                  
                  <div className="py-3 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <FilePlus2 className="h-4 w-4 text-blue-500" />
                      <div>
                        <div className="font-medium text-sm">Allergy Test Results.pdf</div>
                        <div className="text-xs text-muted-foreground">Uploaded on Nov 20, 2024</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">View</Button>
                  </div>
                </div>
              </div>
              
              <Alert className="bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-800" />
                <AlertTitle className="text-amber-800">Important</AlertTitle>
                <AlertDescription className="text-amber-700">
                  All medical documents are kept confidential and stored securely in compliance with HIPAA regulations.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="border-t pt-4 flex justify-between">
        <div className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </div>
        
        {!readOnly && (
          <Button onClick={handleSave}>
            Save Information
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}