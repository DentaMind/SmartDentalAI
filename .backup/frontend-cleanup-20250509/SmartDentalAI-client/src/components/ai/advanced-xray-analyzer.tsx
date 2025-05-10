import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { FileUp, Plus, Play, AlertTriangle, Check, Info, X, Image, BarChart4, Brain, Database } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export function AdvancedXRayAnalyzer() {
  const [activeTab, setActiveTab] = useState('upload');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };
  
  const handleAnalyze = () => {
    if (!selectedFile) return;
    
    setAnalyzing(true);
    setAnalysisProgress(0);
    
    // Simulate analysis progress
    const interval = setInterval(() => {
      setAnalysisProgress(prev => {
        const newProgress = prev + (100 - prev) * 0.1;
        
        if (newProgress >= 99) {
          clearInterval(interval);
          setTimeout(() => {
            setAnalyzing(false);
            setAnalysisComplete(true);
          }, 500);
          return 100;
        }
        
        return newProgress;
      });
    }, 300);
  };
  
  const handleReset = () => {
    setSelectedFile(null);
    setAnalyzing(false);
    setAnalysisComplete(false);
    setAnalysisProgress(0);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced X-Ray Analysis</h2>
          <p className="text-muted-foreground">AI-powered diagnostics for radiographic images</p>
        </div>
        <Button variant="outline" onClick={handleReset}>
          New Analysis
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="upload" disabled={analyzing || analysisComplete}>
              <FileUp className="h-4 w-4 mr-2" />
              Upload X-Ray
            </TabsTrigger>
            <TabsTrigger value="analysis" disabled={!analysisComplete}>
              <Brain className="h-4 w-4 mr-2" />
              Analysis Results
            </TabsTrigger>
            <TabsTrigger value="history" disabled={analyzing}>
              <Database className="h-4 w-4 mr-2" />
              Previous Analyses
            </TabsTrigger>
          </TabsList>
          
          {selectedFile && !analyzing && !analysisComplete && (
            <Button onClick={handleAnalyze}>
              <Play className="h-4 w-4 mr-2" />
              Start Analysis
            </Button>
          )}
        </div>
        
        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              {!selectedFile ? (
                <div className="border-2 border-dashed rounded-lg p-12 text-center">
                  <Image className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-medium mb-2">Upload X-Ray Image</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Supported formats: JPG, PNG, DICOM
                  </p>
                  <div className="flex justify-center">
                    <Label htmlFor="xray-upload" className="cursor-pointer">
                      <div className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md inline-flex items-center">
                        <Plus className="h-4 w-4 mr-2" />
                        Select File
                      </div>
                      <Input
                        id="xray-upload"
                        type="file"
                        accept=".jpg,.jpeg,.png,.dcm"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </Label>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-blue-100 p-2 rounded">
                        <Image className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleReset}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {analyzing && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium">Analyzing X-Ray</p>
                        <p className="text-sm">{Math.round(analysisProgress)}%</p>
                      </div>
                      <Progress value={analysisProgress} />
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          Detecting structures
                        </Badge>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          Identifying anomalies
                        </Badge>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          Computing measurements
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Image Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <Check className="h-4 w-4 mr-2 text-green-600 mt-0.5" />
                    High resolution (min 1200x900px)
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 mr-2 text-green-600 mt-0.5" />
                    Proper contrast and brightness
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 mr-2 text-green-600 mt-0.5" />
                    Patient properly positioned
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 mr-2 text-green-600 mt-0.5" />
                    Minimum artifacts
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Analysis Capabilities</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <Check className="h-4 w-4 mr-2 text-green-600 mt-0.5" />
                    Caries detection
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 mr-2 text-green-600 mt-0.5" />
                    Periapical pathology
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 mr-2 text-green-600 mt-0.5" />
                    Bone density/loss analysis
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 mr-2 text-green-600 mt-0.5" />
                    Root morphology
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Accuracy Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start">
                    <Info className="h-4 w-4 mr-2 text-blue-600 mt-0.5" />
                    <p>95.7% accuracy for caries detection</p>
                  </div>
                  <div className="flex items-start">
                    <Info className="h-4 w-4 mr-2 text-blue-600 mt-0.5" />
                    <p>93.2% accuracy for periapical lesions</p>
                  </div>
                  <div className="flex items-start">
                    <AlertTriangle className="h-4 w-4 mr-2 text-amber-600 mt-0.5" />
                    <p>AI analysis is for decision support only</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="analysis" className="space-y-4">
          <div className="grid grid-cols-12 gap-4">
            <Card className="col-span-12 md:col-span-5">
              <CardHeader>
                <CardTitle>X-Ray Image</CardTitle>
                <CardDescription>
                  Image with AI annotations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-square bg-gray-50 rounded-md flex items-center justify-center">
                  <p className="text-muted-foreground">X-ray image would appear here</p>
                </div>
                <div className="flex justify-end mt-2">
                  <div className="flex gap-2">
                    <Badge variant="outline">Full resolution</Badge>
                    <Badge variant="outline">Toggle annotations</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="col-span-12 md:col-span-7 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle>Analysis Findings</CardTitle>
                    <Badge className="bg-green-50 text-green-700 border-green-200">
                      High confidence
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                      <h4 className="font-medium text-amber-800 flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Critical Finding - Distal Decay on #30
                      </h4>
                      <p className="text-sm text-amber-700 mt-1">
                        Visible radiolucency extending into dentin on the distal surface of tooth #30.
                        Risk of pulpal involvement. Recommend restoration.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900">Additional Findings</h4>
                      <div className="space-y-2">
                        <div className="p-2 border rounded-md flex items-start">
                          <div className="bg-blue-100 p-1 rounded mr-2">
                            <Info className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Periapical radiolucency on #19</p>
                            <p className="text-xs text-gray-500">
                              Diffuse periapical radiolucency approximately 3mm in diameter.
                              Suggests chronic apical periodontitis.
                            </p>
                          </div>
                        </div>
                        
                        <div className="p-2 border rounded-md flex items-start">
                          <div className="bg-blue-100 p-1 rounded mr-2">
                            <Info className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Horizontal bone loss</p>
                            <p className="text-xs text-gray-500">
                              Generalized horizontal bone loss of 2-3mm in posterior regions.
                              Consistent with moderate periodontitis.
                            </p>
                          </div>
                        </div>
                        
                        <div className="p-2 border rounded-md flex items-start">
                          <div className="bg-blue-100 p-1 rounded mr-2">
                            <Info className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Calculus deposits</p>
                            <p className="text-xs text-gray-500">
                              Visible calculus deposits on lingual surfaces of mandibular anterior teeth.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Button variant="outline" className="w-full">
                        View Detailed Report
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Treatment Suggestions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <Check className="h-4 w-4 mr-2 text-green-600 mt-0.5" />
                        Distal composite restoration for #30
                      </li>
                      <li className="flex items-start">
                        <Check className="h-4 w-4 mr-2 text-green-600 mt-0.5" />
                        Endodontic evaluation for #19
                      </li>
                      <li className="flex items-start">
                        <Check className="h-4 w-4 mr-2 text-green-600 mt-0.5" />
                        Scaling and root planing
                      </li>
                      <li className="flex items-start">
                        <Check className="h-4 w-4 mr-2 text-green-600 mt-0.5" />
                        Follow-up periapical radiograph in 6 months
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Comparative Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[120px] flex items-center justify-center bg-gray-50 rounded-md">
                      <p className="text-muted-foreground text-sm">No previous X-rays available</p>
                    </div>
                    <div className="mt-3">
                      <Button variant="outline" size="sm" className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Import Previous X-rays
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Previous Analyses</CardTitle>
              <CardDescription>
                History of X-ray analyses for this patient
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8">
                  <Database className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <h3 className="font-medium text-lg mb-1">No previous analyses found</h3>
                  <p className="text-muted-foreground">
                    X-ray analysis history will appear here once available
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}