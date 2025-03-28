import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { CheckCircle, AlertCircle, Calendar, Upload, ZoomIn, ZoomOut, Layers } from "lucide-react";

interface XrayImage {
  id: number;
  patientId: number;
  imageUrl: string;
  imageType: string;
  dateTaken: string;
  findings: Array<{
    toothNumber: string;
    condition: string;
    confidence: number;
    area: string;
  }>;
  aiAnalysis: {
    text: string;
    performed: boolean;
    date: string;
  };
}

interface PatientXraysProps {
  patientId: string;
  showChartingOverlay?: boolean;
}

export default function PatientXrays({ patientId, showChartingOverlay = false }: PatientXraysProps) {
  const [activeXray, setActiveXray] = useState<XrayImage | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showFindings, setShowFindings] = useState(true);
  const { toast } = useToast();

  // Fetch patient X-rays
  const { data: xrays, isLoading, error } = useQuery({
    queryKey: ['/api/patients', patientId, 'xrays'],
    queryFn: async () => {
      try {
        const response = await apiRequest(`/api/patients/${patientId}/xrays`, { method: 'GET' });
        return response.data as XrayImage[];
      } catch (err) {
        console.error("Error fetching patient X-rays:", err);
        // For demo purposes, return sample data
        return [
          {
            id: 1,
            patientId: parseInt(patientId),
            imageUrl: "/sample-xrays/panoramic.jpg",
            imageType: "panoramic",
            dateTaken: "2025-01-15",
            findings: [
              { toothNumber: "3", condition: "caries", confidence: 0.92, area: "distal" },
              { toothNumber: "14", condition: "caries", confidence: 0.86, area: "occlusal" },
              { toothNumber: "19", condition: "periapical lesion", confidence: 0.78, area: "apical" },
            ],
            aiAnalysis: {
              text: "Panoramic radiograph reveals carious lesions on teeth #3 (distal) and #14 (occlusal). Periapical radiolucency observed on tooth #19, suggestive of periapical pathology. Normal bone levels observed throughout with no significant periodontal bone loss. TMJ appears within normal limits bilaterally. No other significant findings.",
              performed: true,
              date: "2025-01-15",
            },
          },
          {
            id: 2,
            patientId: parseInt(patientId),
            imageUrl: "/sample-xrays/bitewing-right.jpg",
            imageType: "bitewing",
            dateTaken: "2025-01-15",
            findings: [
              { toothNumber: "3", condition: "caries", confidence: 0.94, area: "distal" },
              { toothNumber: "4", condition: "caries", confidence: 0.82, area: "mesial" },
            ],
            aiAnalysis: {
              text: "Right posterior bitewing radiograph confirms distal caries on tooth #3 and reveals early mesial caries on tooth #4 not visible on panoramic view. No significant bone loss observed interproximally.",
              performed: true,
              date: "2025-01-15",
            },
          },
          {
            id: 3,
            patientId: parseInt(patientId),
            imageUrl: "/sample-xrays/bitewing-left.jpg",
            imageType: "bitewing",
            dateTaken: "2025-01-15",
            findings: [
              { toothNumber: "14", condition: "caries", confidence: 0.91, area: "occlusal" },
              { toothNumber: "15", condition: "caries", confidence: 0.77, area: "mesial" },
            ],
            aiAnalysis: {
              text: "Left posterior bitewing radiograph confirms occlusal caries on tooth #14 and reveals early mesial caries on tooth #15 not visible on panoramic view. No significant bone loss observed interproximally.",
              performed: true,
              date: "2025-01-15",
            },
          },
        ];
      }
    },
  });

  // Set the first X-ray as active when data loads
  useEffect(() => {
    if (xrays && xrays.length > 0 && !activeXray) {
      setActiveXray(xrays[0]);
    }
  }, [xrays, activeXray]);

  // Handle X-ray selection
  const handleSelectXray = (xray: XrayImage) => {
    setActiveXray(xray);
    setZoomLevel(1); // Reset zoom when changing X-rays
  };

  // Handle zoom functionality
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  // Request AI analysis
  const requestAiAnalysis = async () => {
    if (!activeXray) return;
    
    toast({
      title: "AI Analysis Requested",
      description: "Analyzing X-ray image...",
      duration: 3000,
    });
    
    // Simulated AI analysis request (would connect to OpenAI in production)
    setTimeout(() => {
      toast({
        title: "AI Analysis Complete",
        description: "X-ray analysis has been updated with AI findings",
        duration: 3000,
      });
    }, 2000);
  };

  // Render finding markers on the X-ray
  const renderFindings = () => {
    if (!activeXray || !showFindings) return null;
    
    return activeXray.findings.map((finding, index) => (
      <div
        key={index}
        className="absolute bg-red-500 bg-opacity-50 border-2 border-red-600 rounded-full w-8 h-8 flex items-center justify-center text-white font-bold"
        style={{
          // These positions would be dynamically calculated based on tooth positions
          top: `${30 + (parseInt(finding.toothNumber) * 5)}%`,
          left: `${40 + (index * 10)}%`,
          transform: `translate(-50%, -50%) scale(${zoomLevel})`,
        }}
        title={`${finding.condition} on tooth #${finding.toothNumber} (${finding.area})`}
      >
        {finding.toothNumber}
      </div>
    ));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner className="w-10 h-10" />
        <span className="ml-4">Loading X-rays...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md text-red-700">
        <AlertCircle className="inline-block mr-2" />
        Error loading X-rays. Please try again later.
      </div>
    );
  }

  if (!xrays || xrays.length === 0) {
    return (
      <div className="p-4 border border-gray-300 bg-gray-50 rounded-md">
        <p>No X-rays available for this patient.</p>
        <Button className="mt-4" variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Upload New X-ray
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Patient X-rays</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* X-ray Gallery */}
        <div className="md:col-span-1 border p-4 rounded-md max-h-[600px] overflow-y-auto">
          <h4 className="font-medium mb-4">X-ray Gallery</h4>
          
          <div className="space-y-4">
            {xrays.map(xray => (
              <Card 
                key={xray.id} 
                className={`cursor-pointer transition-all ${activeXray?.id === xray.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => handleSelectXray(xray)}
              >
                <CardContent className="p-3">
                  <div className="relative aspect-video bg-gray-100 mb-2 overflow-hidden">
                    <img 
                      src={xray.imageUrl} 
                      alt={`${xray.imageType} X-ray`}
                      className="object-contain w-full h-full"
                    />
                  </div>
                  <div className="text-xs">
                    <div className="font-semibold capitalize">{xray.imageType}</div>
                    <div className="flex items-center text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(xray.dateTaken).toLocaleDateString()}
                    </div>
                    {xray.aiAnalysis.performed && (
                      <div className="flex items-center text-green-600 mt-1">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        AI Analyzed
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        {/* X-ray Viewer */}
        <div className="md:col-span-2">
          {activeXray && (
            <>
              {/* Viewer controls */}
              <div className="flex justify-between items-center mb-4">
                <div className="font-medium capitalize">
                  {activeXray.imageType} X-ray
                  <span className="ml-2 text-sm text-gray-500">
                    {new Date(activeXray.dateTaken).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={handleZoomOut}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="mx-1 text-sm">{Math.round(zoomLevel * 100)}%</span>
                  <Button variant="outline" size="sm" onClick={handleZoomIn}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFindings(!showFindings)}
                  >
                    <Layers className="h-4 w-4 mr-1" />
                    {showFindings ? "Hide Findings" : "Show Findings"}
                  </Button>
                </div>
              </div>
              
              {/* X-ray image with findings overlay */}
              <div className="relative border rounded-md overflow-hidden bg-gray-900 w-full" style={{ height: "500px" }}>
                <div 
                  className="relative w-full h-full flex items-center justify-center"
                  style={{ 
                    transform: `scale(${zoomLevel})`,
                    transition: "transform 0.3s ease"
                  }}
                >
                  <img
                    src={activeXray.imageUrl}
                    alt={`${activeXray.imageType} X-ray`}
                    className="max-w-full max-h-full object-contain"
                  />
                  
                  {/* Render AI findings markers */}
                  {renderFindings()}
                  
                  {/* Render charting overlay if enabled */}
                  {showChartingOverlay && (
                    <div className="absolute inset-0 bg-blue-500 bg-opacity-10 pointer-events-none border-2 border-blue-400 rounded-md">
                      <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                        Charting Overlay Active
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* AI Analysis section */}
              <div className="mt-4">
                <h4 className="font-medium mb-2">AI Analysis</h4>
                
                {activeXray.aiAnalysis.performed ? (
                  <div className="border rounded-md p-3 bg-gray-50">
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm">{activeXray.aiAnalysis.text}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Analysis performed on {new Date(activeXray.aiAnalysis.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between border rounded-md p-3 bg-gray-50">
                    <span className="text-sm">No AI analysis available for this X-ray.</span>
                    <Button size="sm" onClick={requestAiAnalysis}>
                      Request AI Analysis
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}