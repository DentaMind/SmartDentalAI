import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  FileUp,
  ImagePlus,
  Info,
  Layers,
  List,
  Loader2,
  RadioTower,
  RotateCw,
  Zap,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

// X-ray analysis result type
interface XrayAnalysisResult {
  findings: string[];
  recommendations: string[];
  confidenceScore: number;
  detectedIssues: {
    type: string;
    location: string;
    severity: "low" | "medium" | "high";
    description: string;
    boundingBox?: { x: number; y: number; width: number; height: number };
  }[];
  patientId: number;
  imageUrl: string;
  timestamp: string;
  status: "completed" | "processing" | "failed";
  aiModels: {
    name: string;
    version: string;
    confidence: number;
    specialization: string;
  }[];
}

interface XrayAnalysisProps {
  patientId: number;
  patientName?: string;
}

export function XrayAnalysis({ patientId, patientName }: XrayAnalysisProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("findings");
  const [analysisResult, setAnalysisResult] = useState<XrayAnalysisResult | null>(null);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [isExpanded, setIsExpanded] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Upload and analyze X-ray mutation
  const analyzeXrayMutation = useMutation({
    mutationFn: async (file: File) => {
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append("xrayImage", file);
      formData.append("patientId", patientId.toString());

      // In a real implementation, this would call the API
      // Here we'll simulate the API call for demonstration
      try {
        // First, indicate that we're uploading/processing
        toast({
          title: "Processing X-ray",
          description: "Your X-ray is being analyzed by our AI system...",
          variant: "default",
        });
        
        // In a real application, this would be an actual API call
        // const response = await apiRequest<XrayAnalysisResult>({
        //   method: "POST",
        //   url: "/api/xray-analysis",
        //   body: formData,
        // });
        
        // For demo purposes, we'll simulate an API response
        // Wait for 2 seconds to simulate processing time
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Generate a simulated analysis result
        const mockAnalysisResult: XrayAnalysisResult = {
          findings: [
            "Evidence of moderate to severe periodontal bone loss in the posterior regions",
            "Radiolucency detected at the apex of tooth #30, consistent with periapical pathology",
            "Deep carious lesion observed on the distal surface of tooth #19",
            "Impacted third molar (tooth #32) with mesioangular orientation",
            "Widened periodontal ligament space around tooth #30"
          ],
          recommendations: [
            "Comprehensive periodontal evaluation and treatment recommended",
            "Endodontic consultation for tooth #30",
            "Restoration of carious lesion on tooth #19",
            "Consider surgical extraction of impacted third molar",
            "Follow-up radiographs in 6 months to monitor periapical healing"
          ],
          confidenceScore: 0.92,
          detectedIssues: [
            {
              type: "periapical",
              location: "Tooth #30",
              severity: "high",
              description: "Periapical radiolucency approximately 4mm in diameter",
              boundingBox: { x: 0.3, y: 0.65, width: 0.1, height: 0.1 }
            },
            {
              type: "caries",
              location: "Tooth #19 (distal)",
              severity: "medium",
              description: "Deep carious lesion extending near pulp chamber",
              boundingBox: { x: 0.62, y: 0.6, width: 0.08, height: 0.08 }
            },
            {
              type: "periodontal",
              location: "Posterior regions",
              severity: "medium",
              description: "Generalized horizontal bone loss of 4-6mm",
              boundingBox: { x: 0.2, y: 0.8, width: 0.6, height: 0.15 }
            },
            {
              type: "impaction",
              location: "Tooth #32",
              severity: "low",
              description: "Mesioangular impaction with partial bony coverage",
              boundingBox: { x: 0.15, y: 0.7, width: 0.12, height: 0.12 }
            }
          ],
          patientId: patientId,
          imageUrl: previewUrl || "",
          timestamp: new Date().toISOString(),
          status: "completed",
          aiModels: [
            {
              name: "DentalVisionNet",
              version: "3.2.1",
              confidence: 0.94,
              specialization: "General Dental Pathology"
            },
            {
              name: "PerioAnalyzer",
              version: "2.1.0",
              confidence: 0.89,
              specialization: "Periodontal Assessment"
            },
            {
              name: "EndoDetect",
              version: "1.5.4",
              confidence: 0.91,
              specialization: "Endodontic Conditions"
            }
          ]
        };
        
        return mockAnalysisResult;
      } catch (error) {
        console.error("Error analyzing X-ray:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      toast({
        title: "Analysis complete",
        description: "AI analysis has successfully identified findings in this X-ray.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Error analyzing X-ray:", error);
      toast({
        title: "Analysis failed",
        description: "There was an error analyzing this X-ray. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.includes('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (JPEG, PNG, etc.)",
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB max
        toast({
          title: "File too large",
          description: "Please select an image file under 10MB",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setAnalysisResult(null);
      
      // Clean up
      return () => URL.revokeObjectURL(objectUrl);
    }
  };
  
  // Handle upload button click
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Handle analysis button click
  const handleAnalyzeClick = () => {
    if (selectedFile) {
      analyzeXrayMutation.mutate(selectedFile);
    } else {
      toast({
        title: "No file selected",
        description: "Please select an X-ray image to analyze.",
        variant: "destructive",
      });
    }
  };
  
  // Get severity badge
  const getSeverityBadge = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">High</Badge>;
      case 'medium':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Medium</Badge>;
      case 'low':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Low</Badge>;
      default:
        return null;
    }
  };
  
  // Draw annotations on the X-ray image
  const renderAnnotations = () => {
    if (!analysisResult || !showAnnotations) return null;
    
    return (
      <div className="absolute inset-0 pointer-events-none">
        {analysisResult.detectedIssues.map((issue, index) => {
          if (!issue.boundingBox) return null;
          
          const { x, y, width, height } = issue.boundingBox;
          const borderColor = issue.severity === 'high' ? 'border-red-500' : 
                             issue.severity === 'medium' ? 'border-amber-500' : 
                             'border-blue-500';
          
          return (
            <div 
              key={index}
              className={`absolute border-2 ${borderColor} rounded-md`}
              style={{
                left: `${x * 100}%`,
                top: `${y * 100}%`,
                width: `${width * 100}%`,
                height: `${height * 100}%`,
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <div 
                className={`absolute -top-6 left-0 px-2 py-0.5 text-xs rounded ${
                  issue.severity === 'high' ? 'bg-red-500' : 
                  issue.severity === 'medium' ? 'bg-amber-500' : 
                  'bg-blue-500'
                } text-white whitespace-nowrap`}
              >
                {issue.location}
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  
  // Toggle section expansion
  const toggleSection = (section: string) => {
    setIsExpanded(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">X-ray Analysis</h2>
          <p className="text-muted-foreground">
            Upload and analyze dental X-rays using advanced AI
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleUploadClick} className="gap-2">
            <ImagePlus className="h-4 w-4" />
            Select X-ray
          </Button>
          
          <Button 
            onClick={handleAnalyzeClick}
            disabled={!selectedFile || analyzeXrayMutation.isPending}
            className="gap-2"
          >
            {analyzeXrayMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Analyze X-ray
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* X-ray Preview Panel */}
        <Card className="min-h-[400px] flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              X-ray Image
            </CardTitle>
            {analysisResult && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAnnotations(!showAnnotations)}
                  className="text-xs gap-1"
                >
                  {showAnnotations ? (
                    <>
                      <Layers className="h-3 w-3" />
                      Hide Annotations
                    </>
                  ) : (
                    <>
                      <Layers className="h-3 w-3" />
                      Show Annotations
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardHeader>
          
          <CardContent className="flex-grow flex flex-col items-center justify-center relative">
            {previewUrl ? (
              <div className="relative w-full h-full min-h-[300px] flex items-center justify-center bg-black/5 rounded-md overflow-hidden">
                <img 
                  src={previewUrl} 
                  alt="X-ray Preview" 
                  className="max-w-full max-h-full object-contain" 
                />
                {renderAnnotations()}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-lg border-gray-300 w-full h-full min-h-[300px]">
                <FileUp className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-center text-muted-foreground mb-1">
                  Drag & drop an X-ray image here or click "Select X-ray" button
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports PNG, JPG, DICOM up to 10MB
                </p>
              </div>
            )}
            
            {analyzeXrayMutation.isPending && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white rounded-md">
                <Loader2 className="h-10 w-10 animate-spin mb-3" />
                <p className="font-medium mb-1">Analyzing X-ray...</p>
                <p className="text-sm mb-4">Using AI to identify dental conditions</p>
                <Progress value={65} className="w-3/4 h-2" />
              </div>
            )}
          </CardContent>
          
          {analysisResult && (
            <CardFooter className="flex-col items-start space-y-2 pt-0">
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <RadioTower className="h-3 w-3 text-primary" />
                  <span>AI Confidence:</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={analysisResult.confidenceScore * 100} className="w-28 h-2" />
                  <span className="font-medium">{Math.round(analysisResult.confidenceScore * 100)}%</span>
                </div>
              </div>
            </CardFooter>
          )}
        </Card>
        
        {/* Analysis Results Panel */}
        <Card className="min-h-[400px] flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <List className="h-4 w-4 text-primary" />
              Analysis Results
            </CardTitle>
            <CardDescription>
              AI-powered interpretation of the dental X-ray
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex-grow pt-0">
            {!analysisResult ? (
              analyzeXrayMutation.isPending ? (
                <div className="h-full flex flex-col items-center justify-center py-10">
                  <Loader2 className="h-10 w-10 text-primary animate-spin mb-3" />
                  <p className="text-muted-foreground">
                    Processing X-ray with multiple AI models...
                  </p>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-10">
                  <Info className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground text-center">
                    {selectedFile 
                      ? "Click 'Analyze X-ray' to begin AI analysis" 
                      : "Upload an X-ray image to see analysis results"}
                  </p>
                </div>
              )
            ) : (
              <Tabs defaultValue="findings" value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <TabsList className="mb-4">
                  <TabsTrigger value="findings" className="gap-1">
                    <CircleAlert className="h-4 w-4" />
                    Findings
                  </TabsTrigger>
                  <TabsTrigger value="recommendations" className="gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    Recommendations
                  </TabsTrigger>
                  <TabsTrigger value="technical" className="gap-1">
                    <RotateCw className="h-4 w-4" />
                    AI Details
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="findings" className="flex-grow space-y-3 overflow-y-auto max-h-[300px] pr-2">
                  {analysisResult.detectedIssues.map((issue, index) => (
                    <div 
                      key={index} 
                      className={`border rounded-lg overflow-hidden transition-colors ${
                        issue.severity === 'high' ? 'border-red-200 bg-red-50' :
                        issue.severity === 'medium' ? 'border-amber-200 bg-amber-50' :
                        'border-blue-200 bg-blue-50'
                      }`}
                    >
                      <div 
                        className={`flex justify-between items-center p-3 cursor-pointer`}
                        onClick={() => toggleSection(`finding-${index}`)}
                      >
                        <div className="flex items-center gap-2">
                          {issue.severity === 'high' ? (
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          ) : issue.severity === 'medium' ? (
                            <AlertCircle className="h-5 w-5 text-amber-500" />
                          ) : (
                            <Info className="h-5 w-5 text-blue-500" />
                          )}
                          <div>
                            <div className="font-medium">{issue.location}</div>
                            <div className="text-sm text-muted-foreground">{issue.type}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getSeverityBadge(issue.severity)}
                          <ChevronDown className={`h-4 w-4 transition-transform ${
                            isExpanded[`finding-${index}`] ? 'transform rotate-180' : ''
                          }`} />
                        </div>
                      </div>
                      
                      <Collapsible
                        open={isExpanded[`finding-${index}`]}
                        onOpenChange={() => toggleSection(`finding-${index}`)}
                      >
                        <CollapsibleContent>
                          <div className={`p-3 pt-0 text-sm ${
                            issue.severity === 'high' ? 'text-red-800' :
                            issue.severity === 'medium' ? 'text-amber-800' :
                            'text-blue-800'
                          }`}>
                            {issue.description}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  ))}
                </TabsContent>
                
                <TabsContent value="recommendations" className="flex-grow space-y-4 overflow-y-auto max-h-[300px] pr-2">
                  <ul className="space-y-2">
                    {analysisResult.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start gap-3 p-3 border border-green-200 bg-green-50 rounded-lg">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </TabsContent>
                
                <TabsContent value="technical" className="flex-grow space-y-4 overflow-y-auto max-h-[300px] pr-2">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">AI Models Used</h4>
                      <div className="space-y-2">
                        {analysisResult.aiModels.map((model, index) => (
                          <div key={index} className="p-3 border rounded-lg bg-gray-50">
                            <div className="flex justify-between">
                              <div className="font-medium">{model.name} <span className="text-xs text-muted-foreground">v{model.version}</span></div>
                              <div className="text-sm">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger className="flex items-center gap-1">
                                      <span className="font-medium">{Math.round(model.confidence * 100)}%</span>
                                      <Info className="h-3 w-3 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>AI confidence score</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">{model.specialization}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Analysis Details</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 border rounded-lg bg-gray-50">
                          <div className="text-xs text-muted-foreground">Patient ID</div>
                          <div className="font-medium">{analysisResult.patientId}</div>
                        </div>
                        <div className="p-3 border rounded-lg bg-gray-50">
                          <div className="text-xs text-muted-foreground">Timestamp</div>
                          <div className="font-medium">
                            {new Date(analysisResult.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}