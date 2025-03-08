import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { Brain, Calendar, Info, Upload, Wand, ZoomIn } from "lucide-react";
import { useTranslation } from "react-i18next";

interface PatientXraysProps {
  patientId: number;
}

interface XrayImage {
  id: number;
  patientId: number;
  imageUrl: string;
  type: string;
  takenAt: string;
  findings?: string;
  notes?: string;
}

export function PatientXrays({ patientId }: PatientXraysProps) {
  const { t } = useTranslation();
  const [selectedImage, setSelectedImage] = useState<XrayImage | null>(null);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  const [activeType, setActiveType] = useState("all");

  const { data: xrays, isLoading } = useQuery<XrayImage[]>({
    queryKey: ["/api/xrays", patientId],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/patients/${patientId}/xrays`);
        return res.json();
      } catch (error) {
        console.error("Failed to fetch x-rays:", error);
        return [];
      }
    },
  });

  // Mock AI analysis function (in production, this would call the API)
  const runAiAnalysis = async (xrayId: number) => {
    setAiAnalysisLoading(true);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    setAiAnalysisLoading(false);
    
    // In a real app, this would update the findings from the API response
    setSelectedImage(prev => {
      if (!prev) return null;
      return {
        ...prev,
        findings: "AI analysis detected potential early-stage caries on tooth #14 (mesial surface). Recommend closer evaluation and preventive treatment. No other significant findings."
      };
    });
  };

  const filteredXrays = xrays?.filter(xray => {
    if (activeType === "all") return true;
    return xray.type.toLowerCase() === activeType.toLowerCase();
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Patient X-Rays & Scans</h2>
          <p className="text-muted-foreground">View and analyze patient radiographs and intraoral scans</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-blue-200 text-blue-700 bg-blue-50 gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                Take New X-Ray
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Select X-Ray Device</DialogTitle>
                <DialogDescription>
                  Choose the X-ray equipment you want to use
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    className="p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-colors flex flex-col items-center text-center"
                    onClick={() => { /* Connect to device */ }}
                  >
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                      <svg className="h-8 w-8 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                      </svg>
                    </div>
                    <h3 className="font-medium">Dentsply Sirona OP 3D</h3>
                    <p className="text-sm text-muted-foreground mt-1">Panoramic & CBCT</p>
                    <Badge className="mt-2" variant="outline">Connected</Badge>
                  </div>
                  
                  <div 
                    className="p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-colors flex flex-col items-center text-center"
                    onClick={() => { /* Connect to device */ }}
                  >
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                      <svg className="h-8 w-8 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                    </div>
                    <h3 className="font-medium">Carestream CS 2200</h3>
                    <p className="text-sm text-muted-foreground mt-1">Intraoral X-ray</p>
                    <Badge className="mt-2" variant="secondary">Ready</Badge>
                  </div>
                </div>
                
                <div className="space-y-2 mt-2">
                  <label className="text-sm font-medium">X-Ray Type</label>
                  <select className="w-full p-2 border rounded-md">
                    <option value="panoramic">Panoramic</option>
                    <option value="bitewing">Bitewing</option>
                    <option value="periapical">Periapical</option>
                    <option value="cbct">CBCT</option>
                    <option value="cephalometric">Cephalometric</option>
                  </select>
                </div>
                
                <div className="flex justify-between mt-4">
                  <Button variant="outline">Cancel</Button>
                  <Button>Start X-Ray Capture</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-green-200 text-green-700 bg-green-50 gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Start Intraoral Scan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Select Intraoral Scanner</DialogTitle>
                <DialogDescription>
                  Choose the scanner you want to use for digital impressions
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    className="p-4 border rounded-lg hover:bg-green-50 hover:border-green-200 cursor-pointer transition-colors flex flex-col items-center text-center"
                    onClick={() => { /* Connect to device */ }}
                  >
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                      <svg className="h-8 w-8 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h3 className="font-medium">iTero Element 5D</h3>
                    <p className="text-sm text-muted-foreground mt-1">Full-arch scanner</p>
                    <Badge className="mt-2" variant="outline">Connected</Badge>
                  </div>
                  
                  <div 
                    className="p-4 border rounded-lg hover:bg-green-50 hover:border-green-200 cursor-pointer transition-colors flex flex-col items-center text-center"
                    onClick={() => { /* Connect to device */ }}
                  >
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                      <svg className="h-8 w-8 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                      </svg>
                    </div>
                    <h3 className="font-medium">3Shape TRIOS 4</h3>
                    <p className="text-sm text-muted-foreground mt-1">Wireless scanner</p>
                    <Badge className="mt-2" variant="secondary">Charging (89%)</Badge>
                  </div>
                </div>
                
                <div className="space-y-2 mt-2">
                  <label className="text-sm font-medium">Scan Type</label>
                  <select className="w-full p-2 border rounded-md">
                    <option value="full">Full Arch Scan</option>
                    <option value="quadrant">Quadrant Scan</option>
                    <option value="bite">Bite Registration</option>
                    <option value="preparation">Preparation Scan</option>
                  </select>
                </div>
                
                <div className="flex justify-between mt-4">
                  <Button variant="outline">Cancel</Button>
                  <Button variant="default" className="bg-green-600 hover:bg-green-700">Start Scanner</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Upload className="h-4 w-4" />
                Upload New Images
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload X-Ray Image</DialogTitle>
                <DialogDescription>
                  Add a new X-Ray to this patient's records
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-gray-400" />
                    <p className="font-medium">Click to upload or drag and drop</p>
                    <p className="text-sm text-muted-foreground">
                      Supports JPEG, PNG, and DICOM files
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="xray-type" className="text-sm font-medium">
                      X-Ray Type
                    </label>
                    <select id="xray-type" className="w-full p-2 border rounded-md">
                      <option value="panoramic">Panoramic</option>
                      <option value="bitewing">Bitewing</option>
                      <option value="periapical">Periapical</option>
                      <option value="cbct">CBCT</option>
                      <option value="cephalometric">Cephalometric</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="xray-date" className="text-sm font-medium">
                      Date Taken
                    </label>
                    <input
                      type="date"
                      id="xray-date"
                      className="w-full p-2 border rounded-md"
                      defaultValue={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="xray-notes" className="text-sm font-medium">
                    Notes
                  </label>
                  <textarea
                    id="xray-notes"
                    rows={3}
                    className="w-full p-2 border rounded-md"
                    placeholder="Add any relevant notes about this X-Ray"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancel</Button>
                <Button>Upload and Analyze</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="all" value={activeType} onValueChange={setActiveType}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Images</TabsTrigger>
          <TabsTrigger value="panoramic">Panoramic</TabsTrigger>
          <TabsTrigger value="bitewing">Bitewing</TabsTrigger>
          <TabsTrigger value="periapical">Periapical</TabsTrigger>
          <TabsTrigger value="cbct">CBCT</TabsTrigger>
          <TabsTrigger value="intraoral">Intraoral Scans</TabsTrigger>
        </TabsList>

        <TabsContent value={activeType}>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4].map((_, index) => (
                <Card key={index} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="pt-4">
                    <Skeleton className="h-5 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {filteredXrays && filteredXrays.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredXrays.map((xray) => (
                    <Card key={xray.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <div className="relative h-48 bg-gray-100">
                        <img
                          src={xray.imageUrl || '/placeholder-xray.png'}
                          alt={`${xray.type} X-Ray`}
                          className="w-full h-full object-contain cursor-pointer"
                          onClick={() => setSelectedImage(xray)}
                        />
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="text-xs">
                            {xray.type}
                          </Badge>
                        </div>
                        <button 
                          className="absolute bottom-2 right-2 bg-white/80 p-1.5 rounded-full hover:bg-white"
                          onClick={() => setSelectedImage(xray)}
                        >
                          <ZoomIn className="h-4 w-4" />
                        </button>
                      </div>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{xray.type} X-Ray</h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(xray.takenAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 h-auto"
                            onClick={() => setSelectedImage(xray)}
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg
                      className="h-10 w-10 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium">No X-Rays Found</h3>
                  <p className="text-muted-foreground max-w-sm mt-2">
                    There are no X-Rays in this category for this patient. Upload new X-Rays using the button above.
                  </p>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* X-Ray Detail Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-4xl max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedImage?.type} X-Ray</DialogTitle>
            <DialogDescription>
              Taken on {selectedImage?.takenAt ? new Date(selectedImage.takenAt).toLocaleDateString() : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="bg-black rounded-lg flex items-center justify-center p-2 h-[350px] mb-4">
                <img
                  src={selectedImage?.imageUrl || '/placeholder-xray.png'}
                  alt="X-Ray Detail View"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Notes</h4>
                  <p className="text-sm p-3 bg-muted rounded-md">
                    {selectedImage?.notes || "No notes available for this X-Ray."}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={() => selectedImage && runAiAnalysis(selectedImage.id)}
                  disabled={aiAnalysisLoading}
                >
                  {aiAnalysisLoading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4" />
                      Run AI Analysis
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Wand className="h-4 w-4" />
                Analysis Findings
              </h3>
              
              {selectedImage?.findings ? (
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-md text-sm">
                  {selectedImage.findings}
                </div>
              ) : (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>No analysis available</AlertTitle>
                  <AlertDescription>
                    Click "Run AI Analysis" to generate an automatic assessment of this X-Ray.
                  </AlertDescription>
                </Alert>
              )}

              <div className="mt-6">
                <h4 className="font-medium mb-2">Reference Anatomy</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-gray-50 rounded-md">
                    <div className="text-xs font-medium">Maxillary Sinus</div>
                    <div className="text-xs text-muted-foreground">Visible on upper quadrants</div>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-md">
                    <div className="text-xs font-medium">Mandibular Canal</div>
                    <div className="text-xs text-muted-foreground">Running through lower jaw</div>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-md">
                    <div className="text-xs font-medium">Mental Foramen</div>
                    <div className="text-xs text-muted-foreground">Lower premolar region</div>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-md">
                    <div className="text-xs font-medium">Alveolar Bone</div>
                    <div className="text-xs text-muted-foreground">Supporting tooth structure</div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-medium mb-2">Dentition Guide</h4>
                <div className="p-3 bg-gray-50 rounded-md text-sm">
                  <div className="grid grid-cols-8 gap-2 text-center">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div key={i} className="p-1 border rounded-md text-xs">
                        {i + 1}
                      </div>
                    ))}
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div key={i + 16} className="p-1 border rounded-md text-xs">
                        {i + 17}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}