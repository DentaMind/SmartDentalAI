
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadButton } from "@/components/ui/upload-button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, BrainCircuit, Camera, FileImage, BarChart3, Ruler, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OrthodonticAnalysisProps {
  patientId?: number;
  onAnalysisComplete?: (analysis: any) => void;
}

export function OrthodonticAnalyzer({ patientId, onAnalysisComplete }: OrthodonticAnalysisProps) {
  const [activeTab, setActiveTab] = useState("capture");
  const [images, setImages] = useState<string[]>([]);
  const [measurements, setMeasurements] = useState<Record<string, number>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysis, setAnalysis] = useState<any>(null);
  const [patientType, setPatientType] = useState("adolescent");
  const { toast } = useToast();

  const handleImageUpload = (urls: string[]) => {
    setImages([...images, ...urls]);
    if (activeTab === "capture" && urls.length > 0) {
      setActiveTab("measurements");
    }
  };

  const handleCapture = async () => {
    // This would connect to a camera in a real implementation
    toast({
      title: "Camera activated",
      description: "Position the patient and capture the image.",
    });
    
    // Simulate image capture
    setTimeout(() => {
      const mockImageUrl = "https://example.com/mock-orthodontic-image.jpg";
      setImages([...images, mockImageUrl]);
      setActiveTab("measurements");
    }, 1500);
  };

  const handleMeasurementChange = (key: string, value: string) => {
    setMeasurements({
      ...measurements,
      [key]: parseFloat(value) || 0
    });
  };

  const analyzeCase = async () => {
    if (!patientId) {
      toast({
        title: "Patient ID required",
        description: "Please select a patient first.",
        variant: "destructive"
      });
      return;
    }

    if (images.length === 0) {
      toast({
        title: "Images required",
        description: "Please upload or capture at least one image.",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);

    // Simulate analysis process
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 10;
        if (newProgress >= 100) {
          clearInterval(interval);
          simulateAnalysisComplete();
        }
        return newProgress;
      });
    }, 400);
  };

  const simulateAnalysisComplete = () => {
    // Mock analysis result
    const mockAnalysis = {
      facialProfile: {
        analysis: "Class II skeletal pattern with mandibular retrognathia",
        recommendations: [
          "Consider functional appliance therapy",
          "Monitor growth pattern closely",
          "Evaluate TMJ function"
        ],
        indicators: [
          "Convex profile",
          "Retrognathic mandible",
          "Normal maxillary position"
        ]
      },
      dentalArchAnalysis: {
        archForm: "Tapered maxillary arch, ovoid mandibular arch",
        crowding: "Moderate maxillary crowding (4-6mm), mild mandibular crowding (2-3mm)",
        spacing: "No significant spacing",
        recommendations: [
          "Arch expansion in maxilla",
          "Interproximal reduction in mandible",
          "Maintain arch form during treatment"
        ]
      },
      cephalometricMeasurements: {
        snAngle: measurements.sna || 82,
        anBAngle: measurements.anb || 4.5,
        mandibularPlaneAngle: measurements.mandibularPlane || 25,
        frankfortMandibularAngle: measurements.frankfortMandibular || 27,
        interpretation: "Class II skeletal relationship with normal vertical dimensions"
      },
      treatmentOptions: [
        {
          option: "Fixed Appliances with Class II Elastics",
          duration: "24-30 months",
          pros: [
            "Comprehensive control of tooth movement",
            "Ability to correct significant malocclusions",
            "Well-established treatment approach"
          ],
          cons: [
            "Longer treatment time",
            "More frequent adjustments required",
            "Potential for decalcification if hygiene is poor"
          ],
          estimatedCost: 5500
        },
        {
          option: "Clear Aligners with Precision Cuts",
          duration: "24-36 months",
          pros: [
            "Improved aesthetics during treatment",
            "Better oral hygiene potential",
            "Fewer emergency visits"
          ],
          cons: [
            "May require longer treatment duration",
            "Relies heavily on patient compliance",
            "Higher cost"
          ],
          estimatedCost: 6800
        }
      ],
      growthPrediction: patientType !== "adult" ? {
        potentialGrowth: "Moderate mandibular growth expected over next 12-18 months",
        recommendations: [
          "Utilize growth for Class II correction",
          "Consider staged treatment approach",
          "Re-evaluate growth in 6 months"
        ],
        timeframe: "80% of remaining growth expected within next 24 months"
      } : undefined
    };
    
    setAnalysis(mockAnalysis);
    setIsAnalyzing(false);
    setActiveTab("results");
    
    if (onAnalysisComplete) {
      onAnalysisComplete(mockAnalysis);
    }
    
    toast({
      title: "Analysis complete",
      description: "Orthodontic analysis has been generated successfully.",
      variant: "default"
    });
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 text-primary" />
          Orthodontic AI Analyzer
        </CardTitle>
        <CardDescription>
          Advanced AI-powered orthodontic analysis and treatment planning
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="capture" disabled={isAnalyzing}>
              <FileImage className="h-4 w-4 mr-2" />
              Image Capture
            </TabsTrigger>
            <TabsTrigger value="measurements" disabled={isAnalyzing || images.length === 0}>
              <Ruler className="h-4 w-4 mr-2" />
              Measurements
            </TabsTrigger>
            <TabsTrigger value="results" disabled={!analysis}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Analysis
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="capture" className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="patientType">Patient Type</Label>
                <Select value={patientType} onValueChange={setPatientType}>
                  <SelectTrigger id="patientType">
                    <SelectValue placeholder="Select patient type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="child">Child (Under 12)</SelectItem>
                    <SelectItem value="adolescent">Adolescent (12-18)</SelectItem>
                    <SelectItem value="adult">Adult (18+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Upload or Capture Images</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-primary/20 rounded-lg p-6 space-y-2">
                    <FileImage className="h-8 w-8 text-primary/60" />
                    <div className="text-sm text-center text-muted-foreground">
                      Drag and drop images or click to upload
                    </div>
                    <UploadButton onUpload={handleImageUpload} accept="image/*" />
                  </div>
                  
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-primary/20 rounded-lg p-6 space-y-2">
                    <Camera className="h-8 w-8 text-primary/60" />
                    <div className="text-sm text-center text-muted-foreground">
                      Use camera to capture images
                    </div>
                    <Button onClick={handleCapture}>
                      Activate Camera
                    </Button>
                  </div>
                </div>
              </div>
              
              {images.length > 0 && (
                <div className="space-y-2">
                  <Label>{images.length} Image(s) Selected</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {images.map((image, index) => (
                      <div key={index} className="border rounded-md overflow-hidden">
                        <div className="bg-muted h-24 flex items-center justify-center">
                          <FileImage className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="p-2 text-xs truncate">Image {index + 1}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end">
              <Button 
                variant="default" 
                disabled={images.length === 0} 
                onClick={() => setActiveTab("measurements")}
              >
                Continue to Measurements
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="measurements" className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sna">SNA Angle (°)</Label>
                  <Input
                    id="sna"
                    type="number"
                    value={measurements.sna || ""}
                    onChange={(e) => handleMeasurementChange("sna", e.target.value)}
                    placeholder="82"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="snb">SNB Angle (°)</Label>
                  <Input
                    id="snb"
                    type="number"
                    value={measurements.snb || ""}
                    onChange={(e) => handleMeasurementChange("snb", e.target.value)}
                    placeholder="80"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="anb">ANB Angle (°)</Label>
                  <Input
                    id="anb"
                    type="number"
                    value={measurements.anb || ""}
                    onChange={(e) => handleMeasurementChange("anb", e.target.value)}
                    placeholder="2"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="wits">Wits Appraisal (mm)</Label>
                  <Input
                    id="wits"
                    type="number"
                    value={measurements.wits || ""}
                    onChange={(e) => handleMeasurementChange("wits", e.target.value)}
                    placeholder="0"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="frankfortMandibular">FMA (°)</Label>
                  <Input
                    id="frankfortMandibular"
                    type="number"
                    value={measurements.frankfortMandibular || ""}
                    onChange={(e) => handleMeasurementChange("frankfortMandibular", e.target.value)}
                    placeholder="25"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="mandibularPlane">MP-SN (°)</Label>
                  <Input
                    id="mandibularPlane"
                    type="number"
                    value={measurements.mandibularPlane || ""}
                    onChange={(e) => handleMeasurementChange("mandibularPlane", e.target.value)}
                    placeholder="32"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="overjet">Overjet (mm)</Label>
                  <Input
                    id="overjet"
                    type="number"
                    value={measurements.overjet || ""}
                    onChange={(e) => handleMeasurementChange("overjet", e.target.value)}
                    placeholder="2.5"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="overbite">Overbite (mm)</Label>
                  <Input
                    id="overbite"
                    type="number"
                    value={measurements.overbite || ""}
                    onChange={(e) => handleMeasurementChange("overbite", e.target.value)}
                    placeholder="2"
                  />
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>Optional: Add these measurements manually or let AI detect them from the images.</p>
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setActiveTab("capture")}
              >
                Back to Images
              </Button>
              <Button 
                variant="default" 
                onClick={analyzeCase}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? "Analyzing..." : "Generate Analysis"}
                {!isAnalyzing && <BrainCircuit className="ml-2 h-4 w-4" />}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="results" className="space-y-6">
            {isAnalyzing ? (
              <div className="space-y-4 py-8">
                <div className="text-center">
                  <BrainCircuit className="h-12 w-12 mx-auto animate-pulse text-primary" />
                  <h3 className="mt-2 text-lg font-medium">AI Analysis in Progress</h3>
                  <p className="text-sm text-muted-foreground">
                    Our AI is analyzing images and measurements for comprehensive orthodontic assessment
                  </p>
                </div>
                <Progress value={progress} className="w-full" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </div>
            ) : analysis ? (
              <>
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Facial Profile</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="font-medium">{analysis.facialProfile.analysis}</p>
                      <div className="mt-2">
                        <p className="text-sm font-medium text-muted-foreground">Key Indicators:</p>
                        <ul className="ml-6 mt-1 list-disc text-sm">
                          {analysis.facialProfile.indicators.map((indicator: string, i: number) => (
                            <li key={i}>{indicator}</li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Dental Arch Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Arch Form: </span>
                        <span>{analysis.dentalArchAnalysis.archForm}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Crowding: </span>
                        <span>{analysis.dentalArchAnalysis.crowding}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Spacing: </span>
                        <span>{analysis.dentalArchAnalysis.spacing}</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Cephalometric Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">SNA: </span>
                            <span>{analysis.cephalometricMeasurements.snAngle}°</span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">ANB: </span>
                            <span>{analysis.cephalometricMeasurements.anBAngle}°</span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">MP-SN: </span>
                            <span>{analysis.cephalometricMeasurements.mandibularPlaneAngle}°</span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">FMA: </span>
                            <span>{analysis.cephalometricMeasurements.frankfortMandibularAngle}°</span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm font-medium">Interpretation:</p>
                          <p className="text-sm">{analysis.cephalometricMeasurements.interpretation}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {analysis.growthPrediction && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Growth Prediction</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p>{analysis.growthPrediction.potentialGrowth}</p>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Timeframe:</p>
                          <p className="text-sm">{analysis.growthPrediction.timeframe}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Treatment Options</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {analysis.treatmentOptions.map((option: any, i: number) => (
                      <Card key={i}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{option.option}</CardTitle>
                          <CardDescription>Duration: {option.duration}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Advantages:</p>
                            <ul className="ml-6 mt-1 list-disc text-sm">
                              {option.pros.map((pro: string, j: number) => (
                                <li key={j}>{pro}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Disadvantages:</p>
                            <ul className="ml-6 mt-1 list-disc text-sm">
                              {option.cons.map((con: string, j: number) => (
                                <li key={j}>{con}</li>
                              ))}
                            </ul>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <div className="text-sm">
                            <span className="font-medium">Estimated Cost: </span>
                            <span>${option.estimatedCost.toLocaleString()}</span>
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setActiveTab("measurements")}>
                    Edit Measurements
                  </Button>
                  <Button>
                    Generate Treatment Plan
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <User className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="mt-2 text-lg font-medium">No Analysis Available</h3>
                <p className="text-sm text-muted-foreground">
                  Complete the previous steps to generate an orthodontic analysis
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
