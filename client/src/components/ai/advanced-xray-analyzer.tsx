import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Upload, Zap, Loader2, XCircle, CheckCircle, AlertTriangle } from "lucide-react";

interface AnalysisResult {
  findings: Array<{
    type: string;
    location: string;
    severity: "low" | "medium" | "high";
    description: string;
    confidence: number;
  }>;
  recommendations: string[];
  overallAssessment: string;
}

export function AdvancedXRayAnalyzer() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);
    setAnalysisResult(null);
    
    if (file) {
      if (!file.type.includes("image")) {
        setError("Please upload an image file");
        setSelectedFile(null);
        setPreviewUrl(null);
        return;
      }
      
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    setError(null);
    setAnalysisResult(null);
    
    if (file) {
      if (!file.type.includes("image")) {
        setError("Please upload an image file");
        return;
      }
      
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeXRay = async () => {
    if (!selectedFile) {
      setError("Please select an X-Ray image to analyze");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // In a real implementation, this would be an API call to the AI service
      // For now, we'll simulate a response after a delay
      setTimeout(() => {
        // Mock analysis result
        const mockResult: AnalysisResult = {
          findings: [
            {
              type: "Caries",
              location: "Tooth 36, distal surface",
              severity: "medium",
              description: "Radiolucency consistent with carious lesion on distal surface of lower left first molar",
              confidence: 0.89,
            },
            {
              type: "Periodontal Bone Loss",
              location: "Teeth 31-33, buccal aspect",
              severity: "high",
              description: "Significant horizontal bone loss visible in the anterior mandibular region",
              confidence: 0.94,
            },
            {
              type: "Periapical Radiolucency",
              location: "Tooth 46, root apex",
              severity: "medium",
              description: "Small radiolucent area at the apex of lower right first molar, suggesting possible periapical inflammation",
              confidence: 0.78,
            },
          ],
          recommendations: [
            "Restorative treatment for carious lesion on tooth 36",
            "Periodontal evaluation and possible deep cleaning for areas 31-33",
            "Consider endodontic evaluation for tooth 46",
            "Follow-up radiograph in 6 months to assess treatment outcomes",
          ],
          overallAssessment: "Multiple dental pathologies detected requiring prompt attention. Periodontal status shows signs of moderate disease progression. Restorative needs include attention to carious lesions. Potential endodontic involvement in one tooth.",
        };
        
        setAnalysisResult(mockResult);
        setIsAnalyzing(false);
      }, 2500);
    } catch (err) {
      setError("An error occurred during analysis. Please try again.");
      setIsAnalyzing(false);
    }
  };

  // Get severity color for badges
  const getSeverityColor = (severity: "low" | "medium" | "high") => {
    switch (severity) {
      case "low":
        return "bg-blue-100 text-blue-800";
      case "medium":
        return "bg-amber-100 text-amber-800";
      case "high":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get confidence level text
  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.9) return "Very High";
    if (confidence >= 0.8) return "High";
    if (confidence >= 0.7) return "Moderate";
    if (confidence >= 0.6) return "Fair";
    return "Low";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Advanced X-Ray Analysis</CardTitle>
          <CardDescription>
            Upload a dental X-ray image for AI-powered analysis and detection of potential issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div 
            className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => document.getElementById("xray-upload")?.click()}
          >
            {previewUrl ? (
              <div className="space-y-4 w-full">
                <div className="relative max-w-md mx-auto">
                  <img 
                    src={previewUrl} 
                    alt="X-Ray preview" 
                    className="max-h-64 max-w-full mx-auto rounded-lg shadow-md"
                  />
                  <button 
                    className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      setAnalysisResult(null);
                    }}
                  >
                    <XCircle className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{selectedFile?.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedFile && (selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-primary/10 p-3 rounded-full mb-4">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Upload X-Ray Image</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Drag and drop or click to browse files
                </p>
                <p className="text-xs text-muted-foreground">
                  Supported formats: JPEG, PNG, DICOM
                </p>
              </>
            )}
            <Input 
              id="xray-upload" 
              type="file" 
              className="hidden" 
              onChange={handleFileChange}
              accept="image/*,.dcm"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-center">
            <Button 
              onClick={analyzeXRay} 
              disabled={!selectedFile || isAnalyzing}
              className="space-x-2"
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  <span>Analyze X-Ray</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>
              AI-detected findings and recommendations based on the uploaded X-ray
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Detected Findings</h3>
                <div className="space-y-3">
                  {analysisResult.findings.map((finding, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{finding.type}</h4>
                          <Badge className={getSeverityColor(finding.severity)}>
                            {finding.severity.charAt(0).toUpperCase() + finding.severity.slice(1)} Severity
                          </Badge>
                        </div>
                        <p className="text-sm mb-2">{finding.description}</p>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Location: {finding.location}</span>
                          <span>Confidence: {getConfidenceText(finding.confidence)} ({(finding.confidence * 100).toFixed(0)}%)</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-2">Recommendations</h3>
                <ul className="space-y-2">
                  {analysisResult.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span>{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-2">Overall Assessment</h3>
                <p className="text-sm">{analysisResult.overallAssessment}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}