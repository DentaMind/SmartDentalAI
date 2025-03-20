import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  Brain, 
  Calendar, 
  Download, 
  Eye, 
  FileDown, 
  FileUp, 
  ImagePlus, 
  Monitor, 
  MoreVertical,
  PenLine, 
  Plus, 
  ShareIcon, 
  Trash2, 
  Upload, 
  ZoomIn,
  SplitSquareVertical,
  ArrowLeftRight,
  Layers
} from "lucide-react";
import { XRayComparison, XRayImage } from "@/components/xray/xray-comparison";

interface PatientXraysProps {
  patientId: number;
}

interface Xray {
  id: number;
  patientId: number;
  imageUrl: string;
  thumbnailUrl: string;
  type: "panoramic" | "periapical" | "bitewing" | "cbct" | "intraoral";
  date: string;
  notes?: string;
  teeth?: string[];
  provider: string;
  aiAnalyzed?: boolean;
  aiFindings?: string[];
}

export function PatientXrays({ patientId }: PatientXraysProps) {
  const [activeTab, setActiveTab] = useState("all");
  const [selectedXray, setSelectedXray] = useState<Xray | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [xrayToCompare, setXrayToCompare] = useState<Xray | null>(null);
  const [selectedForComparison, setSelectedForComparison] = useState<Xray | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showDeviceDialog, setShowDeviceDialog] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState("");
  
  // Fetch patient xrays
  const { data: xrays, isLoading } = useQuery<Xray[]>({
    queryKey: ["/api/xrays", patientId],
    queryFn: async () => {
      try {
        const res = await apiRequest({
          method: "GET", 
          url: `/api/patients/${patientId}/xrays`
        });
        return res;
      } catch (error) {
        console.error("Failed to fetch xrays:", error);
        return [];
      }
    },
  });

  // Sample xrays for demonstration
  const sampleXrays: Xray[] = [
    {
      id: 1,
      patientId,
      imageUrl: "https://www.nidcr.nih.gov/sites/default/files/2017-09/panoramic-xray.jpg",
      thumbnailUrl: "https://www.nidcr.nih.gov/sites/default/files/2017-09/panoramic-xray.jpg",
      type: "panoramic",
      date: "2025-02-15T10:30:00Z",
      provider: "Dr. Johnson",
      aiAnalyzed: true,
      aiFindings: [
        "Mild bone loss evident in the posterior regions",
        "Potential caries detected on teeth #2, #15, #31",
        "No pathology detected in the TMJ region",
        "Normal root canal morphology observed"
      ]
    },
    {
      id: 2,
      patientId,
      imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQzy-R3-Zg-DJw2SwvbJvD3VxPDVmQE-GEWxA&usqp=CAU",
      thumbnailUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQzy-R3-Zg-DJw2SwvbJvD3VxPDVmQE-GEWxA&usqp=CAU",
      type: "periapical",
      date: "2025-02-15T10:45:00Z",
      teeth: ["#8", "#9"],
      provider: "Dr. Johnson"
    },
    {
      id: 3,
      patientId,
      imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ72GC-PoZkYQq-WPvTsQ-QGgsY3JtJm9S2Tg&usqp=CAU",
      thumbnailUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ72GC-PoZkYQq-WPvTsQ-QGgsY3JtJm9S2Tg&usqp=CAU",
      type: "bitewing",
      date: "2025-02-15T11:00:00Z",
      teeth: ["#18", "#19", "#20"],
      provider: "Dr. Johnson"
    },
    {
      id: 4,
      patientId,
      imageUrl: "https://www.orthoroentgen.com/wp-content/uploads/2021/10/cbct-scan.jpg",
      thumbnailUrl: "https://www.orthoroentgen.com/wp-content/uploads/2021/10/cbct-scan.jpg",
      type: "cbct",
      date: "2025-01-10T09:30:00Z",
      notes: "3D scan for implant planning on tooth #30",
      provider: "Dr. Smith",
      aiAnalyzed: true,
      aiFindings: [
        "Adequate bone volume for implant placement at site #30",
        "Inferior alveolar nerve approximately 4.2mm from proposed implant site",
        "No sinus involvement detected",
        "No pathology detected in the surrounding bone"
      ]
    }
  ];

  // Use the real data if available, otherwise use sample data
  const displayXrays = xrays || sampleXrays;

  // Filter xrays based on active tab
  const filteredXrays = displayXrays.filter(xray => 
    activeTab === "all" || 
    activeTab === "ai-analyzed" && xray.aiAnalyzed || 
    xray.type === activeTab
  );

  // Function to get the display name for xray type
  const getXrayTypeDisplayName = (type: string) => {
    const displayNames: Record<string, string> = {
      "panoramic": "Panoramic",
      "periapical": "Periapical",
      "bitewing": "Bitewing",
      "cbct": "CBCT 3D",
      "intraoral": "Intraoral Scan"
    };
    return displayNames[type] || type;
  };

  // Simulate connecting to a device
  const connectToDevice = (deviceId: string) => {
    console.log(`Connecting to device: ${deviceId}`);
    setSelectedDevice(deviceId);
    // In a real app, this would connect to the actual device
  };

  // Simulate capturing an image from a device
  const captureFromDevice = () => {
    console.log(`Capturing image from device: ${selectedDevice}`);
    // In a real app, this would trigger image capture from the selected device
    setShowDeviceDialog(false);
  };
  
  // Handle entering comparison mode
  const enterComparisonMode = () => {
    setCompareMode(true);
    setSelectedForComparison(null);
  };
  
  // Handle exiting comparison mode
  const exitComparisonMode = () => {
    setCompareMode(false);
    setSelectedForComparison(null);
  };
  
  // Handle selecting an X-ray for comparison
  const handleSelectForComparison = (xray: Xray) => {
    setSelectedForComparison(xray);
  };
  
  // Start comparison between two X-rays
  const startComparison = () => {
    if (selectedForComparison && xrayToCompare) {
      setCompareMode(false);
      setSelectedXray(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">X-Rays & Imaging</h2>
          <p className="text-muted-foreground">View and manage patient x-rays and intraoral scans</p>
        </div>
        <div className="flex gap-2">
          {compareMode ? (
            <Button 
              variant="outline" 
              className="gap-2" 
              onClick={exitComparisonMode}
            >
              <ArrowLeftRight className="h-4 w-4" />
              Cancel Comparison
            </Button>
          ) : (
            <Button 
              variant="outline" 
              className="gap-2" 
              onClick={enterComparisonMode}
            >
              <ArrowLeftRight className="h-4 w-4" />
              Compare X-Rays
            </Button>
          )}
          <Dialog open={showDeviceDialog} onOpenChange={setShowDeviceDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Monitor className="h-4 w-4" />
                Device Capture
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Connect to Imaging Device</DialogTitle>
                <DialogDescription>
                  Select a device to capture a new x-ray or intraoral scan
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <Card 
                  className={`cursor-pointer border-2 ${selectedDevice === "xray-unit" ? "border-primary" : "border-transparent"}`}
                  onClick={() => connectToDevice("xray-unit")}
                >
                  <CardContent className="p-4 flex flex-col items-center justify-center h-full">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                      <FileDown className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-medium text-center">X-Ray Unit</h3>
                    <p className="text-sm text-muted-foreground text-center mt-1">Dentsply Sirona Orthophos XG</p>
                  </CardContent>
                </Card>
                
                <Card 
                  className={`cursor-pointer border-2 ${selectedDevice === "intraoral-scanner" ? "border-primary" : "border-transparent"}`}
                  onClick={() => connectToDevice("intraoral-scanner")}
                >
                  <CardContent className="p-4 flex flex-col items-center justify-center h-full">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                      <ImagePlus className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-medium text-center">Intraoral Scanner</h3>
                    <p className="text-sm text-muted-foreground text-center mt-1">iTero Element 5D</p>
                  </CardContent>
                </Card>
                
                <Card 
                  className={`cursor-pointer border-2 ${selectedDevice === "cbct-unit" ? "border-primary" : "border-transparent"}`}
                  onClick={() => connectToDevice("cbct-unit")}
                >
                  <CardContent className="p-4 flex flex-col items-center justify-center h-full">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                      <FileDown className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-medium text-center">CBCT Unit</h3>
                    <p className="text-sm text-muted-foreground text-center mt-1">CS 9600 CBCT System</p>
                  </CardContent>
                </Card>
                
                <Card 
                  className={`cursor-pointer border-2 ${selectedDevice === "camera" ? "border-primary" : "border-transparent"}`}
                  onClick={() => connectToDevice("camera")}
                >
                  <CardContent className="p-4 flex flex-col items-center justify-center h-full">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                      <ImagePlus className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-medium text-center">Intraoral Camera</h3>
                    <p className="text-sm text-muted-foreground text-center mt-1">IRIS HD USB 3.0</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <p className="text-sm">
                  Make sure the selected device is powered on and properly connected to this computer.
                </p>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeviceDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={captureFromDevice} 
                  disabled={!selectedDevice}
                >
                  Connect & Capture
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Upload className="h-4 w-4" />
                Upload Images
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload X-Ray Images</DialogTitle>
                <DialogDescription>
                  Upload x-ray images or intraoral scans to the patient's record
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="border-2 border-dashed rounded-lg p-6 text-center bg-gray-50">
                  <div className="flex flex-col items-center justify-center">
                    <FileUp className="h-10 w-10 text-gray-400 mb-2" />
                    <h3 className="font-medium text-lg">Drop files here or click to upload</h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-4">
                      Supports DICOM, JPG, PNG files up to 50MB
                    </p>
                    <Button variant="outline" className="relative">
                      Select Files
                      <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" multiple />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <label className="text-sm font-medium">Image Type</label>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="cursor-pointer hover:bg-primary hover:text-primary-foreground px-3 py-1">Panoramic</Badge>
                    <Badge className="cursor-pointer hover:bg-primary hover:text-primary-foreground px-3 py-1">Periapical</Badge>
                    <Badge className="cursor-pointer hover:bg-primary hover:text-primary-foreground px-3 py-1">Bitewing</Badge>
                    <Badge className="cursor-pointer hover:bg-primary hover:text-primary-foreground px-3 py-1">CBCT</Badge>
                    <Badge className="cursor-pointer hover:bg-primary hover:text-primary-foreground px-3 py-1">Intraoral Scan</Badge>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <label className="text-sm font-medium">Analyze with AI</label>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="analyzeWithAi" className="h-4 w-4" defaultChecked />
                    <label htmlFor="analyzeWithAi" className="text-sm cursor-pointer">
                      Automatically analyze uploaded images with AI for potential findings
                    </label>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowUploadDialog(false)}>
                  Upload & Process
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Images</TabsTrigger>
          <TabsTrigger value="panoramic">Panoramic</TabsTrigger>
          <TabsTrigger value="periapical">Periapical</TabsTrigger>
          <TabsTrigger value="bitewing">Bitewing</TabsTrigger>
          <TabsTrigger value="cbct">CBCT 3D</TabsTrigger>
          <TabsTrigger value="intraoral">Intraoral</TabsTrigger>
          <TabsTrigger value="ai-analyzed">AI Analyzed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {isLoading ? (
            <div className="text-center py-10">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite] mb-3"></div>
              <p className="text-muted-foreground">Loading images...</p>
            </div>
          ) : filteredXrays.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredXrays.map((xray) => (
                <Card key={xray.id} className={`overflow-hidden ${xray.aiAnalyzed ? "border-primary/20" : ""}`}>
                  <div className="relative aspect-video bg-gray-100 overflow-hidden">
                    <img 
                      src={xray.thumbnailUrl} 
                      alt={`${xray.type} x-ray`} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/50">
                      <div className="flex gap-2">
                        {compareMode ? (
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className={`bg-white/90 hover:bg-white ${selectedForComparison?.id === xray.id ? 'border-primary border-2' : ''}`}
                            onClick={() => {
                              if (selectedForComparison?.id === xray.id) {
                                setSelectedForComparison(null);
                              } else if (!xrayToCompare) {
                                setXrayToCompare(xray);
                              } else if (!selectedForComparison) {
                                setSelectedForComparison(xray);
                              } else {
                                setXrayToCompare(selectedForComparison);
                                setSelectedForComparison(xray);
                              }
                            }}
                          >
                            <ArrowLeftRight className="h-4 w-4" />
                          </Button>
                        ) : (
                          <>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="bg-white/90 hover:bg-white"
                              onClick={() => setSelectedXray(xray)}
                            >
                              <ZoomIn className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="bg-white/90 hover:bg-white"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    {xray.aiAnalyzed && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-primary/90 hover:bg-primary flex items-center gap-1">
                          <Brain className="h-3 w-3" />
                          AI Analyzed
                        </Badge>
                      </div>
                    )}
                  </div>
                  <CardHeader className="p-4 pb-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">
                          {getXrayTypeDisplayName(xray.type)}
                        </CardTitle>
                        <CardDescription>
                          {new Date(xray.date).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    {xray.teeth && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {xray.teeth.map((tooth, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            Tooth {tooth}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {xray.notes && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {xray.notes}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-between">
                    <div className="text-xs text-muted-foreground">
                      Provider: {xray.provider}
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <PenLine className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <ShareIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded-lg border">
              <FileUp className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium">No Images Found</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mt-1">
                There are no {activeTab !== "all" && activeTab !== "ai-analyzed" ? activeTab : ""} 
                {activeTab === "ai-analyzed" ? "AI analyzed " : ""} 
                x-rays or scans available for this patient.
              </p>
              <div className="flex gap-2 justify-center mt-4">
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => setShowDeviceDialog(true)}
                >
                  <Monitor className="h-4 w-4" />
                  Device Capture
                </Button>
                <Button 
                  className="gap-2"
                  onClick={() => setShowUploadDialog(true)}
                >
                  <Upload className="h-4 w-4" />
                  Upload Images
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Comparison Message when in compare mode */}
      {compareMode && (
        <div className="bg-primary/10 p-4 rounded-lg border border-primary/30 mt-4">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-medium">X-Ray Comparison Mode</h3>
              <p className="text-sm text-muted-foreground">
                {!xrayToCompare && !selectedForComparison 
                  ? "Select the first X-ray to compare" 
                  : selectedForComparison 
                    ? "Click 'Start Comparison' to compare the selected X-rays" 
                    : "Now select the second X-ray to compare"}
              </p>
            </div>
          </div>
          
          {xrayToCompare && selectedForComparison && (
            <div className="flex justify-end mt-3">
              <Button 
                onClick={() => {
                  // Start comparison by ending compare mode and showing comparison dialog
                  setCompareMode(false);
                }}
                className="gap-2"
              >
                <ArrowLeftRight className="h-4 w-4" />
                Start Comparison
              </Button>
            </div>
          )}
        </div>
      )}

      {/* X-ray Viewer Dialog */}
      {selectedXray && (
        <Dialog open={!!selectedXray} onOpenChange={(open) => !open && setSelectedXray(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <div className="flex justify-between items-center">
                <div>
                  <DialogTitle>{getXrayTypeDisplayName(selectedXray.type)} X-Ray</DialogTitle>
                  <DialogDescription>
                    Taken on {new Date(selectedXray.date).toLocaleDateString()} by {selectedXray.provider}
                  </DialogDescription>
                </div>
                {selectedXray.aiAnalyzed && (
                  <Badge className="bg-primary/90 hover:bg-primary flex items-center gap-1">
                    <Brain className="h-3 w-3" />
                    AI Analyzed
                  </Badge>
                )}
              </div>
            </DialogHeader>
            
            <div className="overflow-hidden bg-black rounded-md">
              <img 
                src={selectedXray.imageUrl} 
                alt={`${selectedXray.type} x-ray`} 
                className="w-full h-auto object-contain max-h-[60vh]"
              />
            </div>
            
            {selectedXray.aiAnalyzed && selectedXray.aiFindings && (
              <div className="bg-primary/5 border border-primary/20 p-4 rounded-md">
                <div className="flex items-start gap-3">
                  <Brain className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h4 className="font-medium text-primary mb-2">AI Analysis Findings</h4>
                    <ul className="space-y-1">
                      {selectedXray.aiFindings.map((finding, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <span className="text-primary">•</span>
                          <span>{finding}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter className="flex justify-between">
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button variant="outline" className="gap-2">
                  <ShareIcon className="h-4 w-4" />
                  Share
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2">
                  <PenLine className="h-4 w-4" />
                  Annotate
                </Button>
                {!selectedXray.aiAnalyzed && (
                  <Button className="gap-2">
                    <Brain className="h-4 w-4" />
                    Analyze with AI
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* X-ray Comparison Dialog */}
      {xrayToCompare && selectedForComparison && (
        <Dialog 
          open={!!(xrayToCompare && selectedForComparison && !compareMode)} 
          onOpenChange={(open) => {
            if (!open) {
              setXrayToCompare(null);
              setSelectedForComparison(null);
            }
          }}
        >
          <DialogContent className="max-w-6xl">
            <XRayComparison 
              beforeXray={{
                id: xrayToCompare.id.toString(),
                imageUrl: xrayToCompare.imageUrl,
                type: xrayToCompare.type,
                date: xrayToCompare.date,
                provider: xrayToCompare.provider,
                aiAnalyzed: xrayToCompare.aiAnalyzed,
                aiFindings: xrayToCompare.aiFindings
              }}
              afterXray={{
                id: selectedForComparison.id.toString(),
                imageUrl: selectedForComparison.imageUrl,
                type: selectedForComparison.type,
                date: selectedForComparison.date,
                provider: selectedForComparison.provider,
                aiAnalyzed: selectedForComparison.aiAnalyzed,
                aiFindings: selectedForComparison.aiFindings
              }}
              patientName="Patient" 
              onClose={() => {
                setXrayToCompare(null);
                setSelectedForComparison(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}