import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { BarChart2, Activity, ZoomIn, Upload, FileImage, AlertCircle, Camera } from 'lucide-react';

interface IntraoralScannerProps {
  patientId: number;
  patientName?: string;
  readOnly?: boolean;
  onSave?: (data: any) => void;
}

interface AnalysisResult {
  type: 'soft_tissue' | 'hard_tissue' | 'occlusion';
  findings: Finding[];
  recommendations: string[];
  overallRisk: 'low' | 'medium' | 'high';
  heatmapUrl?: string;
}

interface Finding {
  name: string;
  description: string;
  confidence: number;
  location: string;
  type: 'cancerous' | 'precancerous' | 'benign' | 'bone_loss' | 'wear' | 'other';
  severity: 'mild' | 'moderate' | 'severe';
}

export function IntraoralScanner({ patientId, patientName, readOnly = false }: IntraoralScannerProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null);
  
  // Simulated image list - in a real app this would come from an API
  const sampleImages = [
    { id: 1, name: 'Anterior View', date: '2025-03-01', type: 'intraoral' },
    { id: 2, name: 'Left Buccal', date: '2025-03-01', type: 'intraoral' },
    { id: 3, name: 'Right Buccal', date: '2025-03-01', type: 'intraoral' },
    { id: 4, name: 'Occlusal Upper', date: '2025-03-01', type: 'intraoral' },
    { id: 5, name: 'Occlusal Lower', date: '2025-03-01', type: 'intraoral' },
    { id: 6, name: 'Soft Palate', date: '2025-02-15', type: 'intraoral' },
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedImage(event.target.result.toString());
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleCaptureClick = () => {
    // This would interact with the intraoral camera
    alert('This would activate the intraoral camera. In a real implementation, this would access the connected scanner device.');
  };

  const analyzeImage = () => {
    if (!selectedImage) return;
    
    setAnalyzing(true);
    setProgress(0);
    
    // Simulate analysis progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          // Once "analysis" is complete, set mock results
          setAnalysisResults({
            type: 'soft_tissue',
            findings: [
              {
                name: 'Leukoplakia',
                description: 'White patch on lateral tongue border',
                confidence: 0.89,
                location: 'Left lateral border of tongue',
                type: 'precancerous',
                severity: 'moderate'
              },
              {
                name: 'Erythroplakia',
                description: 'Red patch on floor of mouth',
                confidence: 0.76,
                location: 'Floor of mouth, anterior',
                type: 'precancerous',
                severity: 'moderate'
              }
            ],
            recommendations: [
              'Biopsy recommended for the left lateral border lesion',
              'Follow-up in 2 weeks to reassess',
              'Tobacco cessation counseling',
              'Increase frequency of oral cancer screenings to every 3 months'
            ],
            overallRisk: 'medium',
            heatmapUrl: 'https://example.com/heatmap.jpg' // This would be a real image URL in production
          });
          setAnalyzing(false);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
    
    return () => clearInterval(interval);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="scanner" className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="scanner">Intraoral Scanner</TabsTrigger>
          <TabsTrigger value="library">Image Library</TabsTrigger>
          <TabsTrigger value="analysis">Analysis History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="scanner" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-primary" />
                  Intraoral Image Capture
                </CardTitle>
                <CardDescription>
                  Capture or upload an intraoral image for AI analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-video bg-muted rounded-md relative overflow-hidden">
                  {selectedImage ? (
                    <img 
                      src={selectedImage} 
                      alt="Intraoral view" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <FileImage className="h-16 w-16 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground text-sm">Select or capture an image</p>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={handleCaptureClick} className="flex-1">
                    <Camera className="h-4 w-4 mr-2" />
                    Capture Image
                  </Button>
                  <div className="relative flex-1">
                    <Button variant="outline" className="w-full" onClick={() => document.getElementById('image-upload')?.click()}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                    </Button>
                    <input 
                      id="image-upload" 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col items-stretch gap-4">
                <Button 
                  onClick={analyzeImage}
                  disabled={!selectedImage || analyzing} 
                  className="w-full"
                >
                  {analyzing ? 'Analyzing...' : 'Analyze with AI'}
                </Button>
                
                {analyzing && (
                  <div className="space-y-2">
                    <Progress value={progress} />
                    <p className="text-sm text-center text-muted-foreground">
                      Analyzing image... {progress}%
                    </p>
                  </div>
                )}
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  AI Analysis Results
                </CardTitle>
                <CardDescription>
                  AI-detected findings and recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analysisResults ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Overall Risk Assessment</h3>
                        <Badge variant={
                          analysisResults.overallRisk === 'high' ? 'destructive' :
                          analysisResults.overallRisk === 'medium' ? 'default' : 'outline'
                        }>
                          {analysisResults.overallRisk.toUpperCase()} RISK
                        </Badge>
                      </div>
                      
                      <Separator />
                      
                      <div className="mt-4">
                        <h3 className="font-medium mb-2">Detected Findings</h3>
                        <div className="space-y-2">
                          {analysisResults.findings.map((finding, i) => (
                            <div key={i} className="p-3 border rounded-md">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{finding.name}</p>
                                  <p className="text-sm text-muted-foreground">{finding.description}</p>
                                </div>
                                <Badge variant={
                                  finding.type === 'cancerous' ? 'destructive' :
                                  finding.type === 'precancerous' ? 'default' : 'outline'
                                }>
                                  {finding.type.replace('_', ' ')}
                                </Badge>
                              </div>
                              <div className="mt-2 flex justify-between text-sm">
                                <span className="text-muted-foreground">{finding.location}</span>
                                <span>{Math.round(finding.confidence * 100)}% confidence</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <h3 className="font-medium mb-2">Recommendations</h3>
                        <ul className="space-y-1 list-disc pl-5">
                          {analysisResults.recommendations.map((rec, i) => (
                            <li key={i} className="text-sm">{rec}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <BarChart2 className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Analysis Results</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Select or capture an intraoral image and click "Analyze with AI" 
                      to detect potential oral cancer signs, bone loss, and other conditions.
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                {analysisResults && (
                  <Button variant="outline" className="w-full">
                    Save to Patient Record
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Detection Capabilities</CardTitle>
              <CardDescription>
                Our AI can detect the following oral conditions from intraoral images
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    Soft Tissue Pathology
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Oral cancer lesions</li>
                    <li>• Leukoplakia</li>
                    <li>• Erythroplakia</li>
                    <li>• Lichen planus</li>
                    <li>• Candidiasis</li>
                    <li>• Aphthous ulcers</li>
                  </ul>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium flex items-center gap-2 mb-2">
                    <Activity className="h-5 w-5 text-blue-500" />
                    Periodontal Conditions
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Gingival recession</li>
                    <li>• Gingival inflammation</li>
                    <li>• Bone loss indicators</li>
                    <li>• Periodontal abscess</li>
                    <li>• Furcation involvement</li>
                    <li>• Mucogingival defects</li>
                  </ul>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium flex items-center gap-2 mb-2">
                    <ZoomIn className="h-5 w-5 text-green-500" />
                    Tooth Structure Analysis
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Enamel wear patterns</li>
                    <li>• Occlusal discrepancies</li>
                    <li>• Tooth fractures</li>
                    <li>• Enamel hypoplasia</li>
                    <li>• Erosion patterns</li>
                    <li>• Attrition analysis</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="library" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Intraoral Image Library</CardTitle>
              <CardDescription>Previously captured intraoral images for {patientName || `Patient #${patientId}`}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {sampleImages.map(image => (
                  <Card key={image.id} className="overflow-hidden">
                    <div className="aspect-video bg-muted relative">
                      {/* In a real app, this would be an actual image */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <FileImage className="h-12 w-12 text-muted-foreground" />
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <div className="text-sm font-medium">{image.name}</div>
                      <div className="text-xs text-muted-foreground">Taken: {image.date}</div>
                      <div className="mt-2 flex justify-between">
                        <Badge variant="outline">{image.type}</Badge>
                        <Button variant="ghost" size="sm" className="h-7 px-2">
                          <ZoomIn className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analysis History</CardTitle>
              <CardDescription>Previous AI analyses of intraoral images</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-md p-4">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-medium">Comprehensive Oral Examination</h3>
                      <p className="text-sm text-muted-foreground">March 1, 2025</p>
                    </div>
                    <Badge>Medium Risk</Badge>
                  </div>
                  <div className="mt-3 text-sm">
                    <p className="font-medium">Key Findings:</p>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      <li>Leukoplakic lesion on left lateral border of tongue</li>
                      <li>Moderate gingival recession, teeth #23-25</li>
                    </ul>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <Button variant="ghost" size="sm">View Details</Button>
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-medium">Oral Cancer Screening</h3>
                      <p className="text-sm text-muted-foreground">February 15, 2025</p>
                    </div>
                    <Badge variant="outline">Low Risk</Badge>
                  </div>
                  <div className="mt-3 text-sm">
                    <p className="font-medium">Key Findings:</p>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      <li>No suspicious lesions detected</li>
                      <li>Mild inflammation of gingiva in posterior regions</li>
                    </ul>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <Button variant="ghost" size="sm">View Details</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}