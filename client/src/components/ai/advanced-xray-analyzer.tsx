
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { 
  ImagePlus, ZoomIn, ZoomOut, RotateCw, Scan, PanelLeftOpen, 
  PanelLeftClose, Save, Download
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface XRayAnalysisResult {
  findings: {
    region: string;
    description: string;
    confidence: number;
    boundingBox?: { x: number, y: number, width: number, height: number };
  }[];
  recommendations: string[];
  overallAssessment: string;
}

export function AdvancedXRayAnalyzer() {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<XRayAnalysisResult | null>(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [activeTab, setActiveTab] = useState('panoramic');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImage(event.target.result as string);
          setAnalysisResult(null);
          
          // Prepare image for rendering
          const img = new Image();
          img.src = event.target.result as string;
          imageRef.current = img;
          img.onload = () => drawImage();
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const analyzeImage = async () => {
    if (!image) return;
    
    setIsAnalyzing(true);
    
    try {
      // Simulate API call to analyze the image
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock analysis result
      const mockResult: XRayAnalysisResult = {
        findings: [
          {
            region: "Tooth #36",
            description: "Periapical radiolucency suggesting infection",
            confidence: 0.92,
            boundingBox: { x: 220, y: 150, width: 40, height: 30 }
          },
          {
            region: "Tooth #25",
            description: "Deep carious lesion with possible pulpal involvement",
            confidence: 0.87,
            boundingBox: { x: 320, y: 130, width: 35, height: 25 }
          },
          {
            region: "Maxillary Sinus",
            description: "Slight mucosal thickening, possible sinusitis",
            confidence: 0.78,
            boundingBox: { x: 380, y: 80, width: 60, height: 40 }
          }
        ],
        recommendations: [
          "Endodontic evaluation for tooth #36",
          "Consider root canal treatment for tooth #25",
          "Monitor maxillary sinus, correlate with clinical symptoms"
        ],
        overallAssessment: "Multiple dental pathologies detected. Patient would benefit from comprehensive endodontic and restorative evaluation."
      };
      
      setAnalysisResult(mockResult);
      drawImage(mockResult);
      
      toast({
        title: "Analysis Complete",
        description: "The X-ray image has been analyzed successfully.",
      });
    } catch (error) {
      console.error("Error analyzing image:", error);
      toast({
        title: "Analysis Failed",
        description: "Could not analyze the X-ray image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const drawImage = (result?: XRayAnalysisResult | null) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const img = imageRef.current;
    
    if (!canvas || !ctx || !img) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set canvas dimensions
    canvas.width = img.width;
    canvas.height = img.height;
    
    // Apply transformations
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom / 100, zoom / 100);
    ctx.translate(-img.width / 2, -img.height / 2);
    
    // Draw image
    ctx.drawImage(img, 0, 0);
    
    // Draw annotations if enabled and we have results
    if (showAnnotations && (result || analysisResult)) {
      const findings = result?.findings || analysisResult?.findings || [];
      
      findings.forEach(finding => {
        if (finding.boundingBox) {
          const { x, y, width, height } = finding.boundingBox;
          
          // Draw bounding box
          ctx.strokeStyle = 'red';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, width, height);
          
          // Draw label
          ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
          ctx.fillRect(x, y - 20, finding.region.length * 8, 20);
          ctx.fillStyle = 'white';
          ctx.font = '12px Arial';
          ctx.fillText(finding.region, x + 5, y - 5);
        }
      });
    }
    
    ctx.restore();
  };
  
  const handleZoomChange = (value: number[]) => {
    setZoom(value[0]);
    drawImage();
  };
  
  const rotateImage = () => {
    setRotation((prevRotation) => (prevRotation + 90) % 360);
    drawImage();
  };
  
  const toggleAnnotations = () => {
    setShowAnnotations(!showAnnotations);
    drawImage();
  };
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const downloadAnalysis = () => {
    if (!analysisResult) return;
    
    const element = document.createElement('a');
    const file = new Blob(
      [JSON.stringify(analysisResult, null, 2)],
      { type: 'application/json' }
    );
    element.href = URL.createObjectURL(file);
    element.download = `xray-analysis-${new Date().toISOString()}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="flex h-[calc(100vh-120px)]">
      {/* Main image viewer */}
      <div className={`flex-1 flex flex-col ${sidebarOpen ? 'mr-4' : ''}`}>
        <div className="bg-card rounded-lg p-4 mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">X-Ray Analysis</h2>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={toggleSidebar}>
              {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            </Button>
            <label htmlFor="image-upload">
              <Button variant="outline" size="icon" asChild>
                <span>
                  <ImagePlus className="h-4 w-4" />
                  <input
                    id="image-upload"
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </span>
              </Button>
            </label>
            {image && (
              <>
                <Button variant="outline" size="icon" onClick={() => handleZoomChange([zoom + 10])}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => handleZoomChange([zoom - 10])}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={rotateImage}>
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={toggleAnnotations}>
                  <Scan className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
        
        <Tabs defaultValue="panoramic" value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList>
            <TabsTrigger value="panoramic">Panoramic</TabsTrigger>
            <TabsTrigger value="bitewing">Bitewing</TabsTrigger>
            <TabsTrigger value="periapical">Periapical</TabsTrigger>
            <TabsTrigger value="cbct">CBCT</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex-1 bg-card rounded-lg overflow-hidden relative">
          {!image && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <ImagePlus className="h-16 w-16 mb-4" />
              <p>Upload an X-ray image to begin analysis</p>
            </div>
          )}
          
          {image && (
            <div className="relative h-full">
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-full object-contain mx-auto"
              />
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-background/90 rounded-full px-3 py-1.5 shadow-lg">
                <Slider
                  value={[zoom]}
                  min={50}
                  max={200}
                  step={5}
                  onValueChange={handleZoomChange}
                  className="w-40"
                />
              </div>
            </div>
          )}
          
          {image && !analysisResult && (
            <div className="absolute bottom-4 right-4">
              <Button 
                onClick={analyzeImage} 
                disabled={isAnalyzing}
                className="shadow-lg"
              >
                {isAnalyzing ? "Analyzing..." : "Analyze X-Ray"}
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Analysis sidebar */}
      {sidebarOpen && (
        <div className="w-80 flex flex-col">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="text-lg">Analysis Results</CardTitle>
            </CardHeader>
            <CardContent>
              {!analysisResult ? (
                <div className="text-center py-8 text-muted-foreground">
                  {image ? (
                    isAnalyzing ? (
                      <div className="space-y-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p>Analyzing X-ray image...</p>
                      </div>
                    ) : (
                      <p>Click "Analyze X-Ray" to begin AI analysis</p>
                    )
                  ) : (
                    <p>Upload an image to get started</p>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-2">Findings</h3>
                    <ul className="space-y-3">
                      {analysisResult.findings.map((finding, index) => (
                        <li key={index} className="border rounded-md p-2 text-sm">
                          <div className="font-medium">{finding.region}</div>
                          <div>{finding.description}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Confidence: {Math.round(finding.confidence * 100)}%
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Recommendations</h3>
                    <ul className="list-disc pl-4 text-sm space-y-1">
                      {analysisResult.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Overall Assessment</h3>
                    <p className="text-sm">{analysisResult.overallAssessment}</p>
                  </div>
                  
                  <div className="flex space-x-2 pt-4">
                    <Button variant="outline" size="sm" className="flex-1" onClick={downloadAnalysis}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                    <Button size="sm" className="flex-1">
                      <Save className="h-4 w-4 mr-2" />
                      Save to Record
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
