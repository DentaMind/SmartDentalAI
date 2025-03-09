import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronRight, ChevronLeft, Save, PlayCircle, Mic, AlertTriangle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ToothMeasurements {
  pocketDepths: {
    facial: [number, number, number];  // [mesial, middle, distal]
    lingual: [number, number, number]; // [mesial, middle, distal]
  };
  bleeding: {
    facial: [boolean, boolean, boolean];
    lingual: [boolean, boolean, boolean];
  };
  mobility: number; // 0-3
  furcation: number; // 0-3
  recession: {
    facial: number;
    lingual: number;
  };
  calculusPresent?: boolean;
  plaqueIndex?: number; // 0-3
  attachmentLoss?: {
    facial: [number, number, number];
    lingual: [number, number, number];
  };
}

export interface PerioChartData {
  id?: number;
  patientId: number;
  doctorId: number;
  date?: string;
  pocketDepths: Record<string, any>; // JSON data
  bleedingPoints?: Record<string, any>; 
  recession?: Record<string, any>;
  mobility?: Record<string, any>;
  furcation?: Record<string, any>;
  plaqueIndices?: Record<string, any>;
  calculus?: Record<string, any>;
  attachmentLoss?: Record<string, any>;
  diseaseStatus?: string;
  diseaseSeverity?: "none" | "mild" | "moderate" | "severe";
  notes?: string;
  aiRecommendations?: Record<string, any>;
}

type PerioData = Record<number, ToothMeasurements>; // tooth number to measurements

interface EnhancedPerioChartProps {
  patientId: number;
  doctorId: number;
  existingData?: PerioChartData;
  onSave?: (data: PerioChartData) => void;
}

export function EnhancedPerioChart({ patientId, doctorId, existingData, onSave }: EnhancedPerioChartProps) {
  const [activeArc, setActiveArc] = useState<"upper" | "lower">("upper");
  const [activeView, setActiveView] = useState<"facial" | "lingual">("facial");
  const [isRecording, setIsRecording] = useState(false);
  const [perioData, setPerioData] = useState<PerioData>(existingData ? convertFromApiFormat(existingData) : {});
  const [activeTooth, setActiveTooth] = useState<number | null>(null);
  const [activePosition, setActivePosition] = useState<[string, number] | null>(null); // [surface, position]
  const [notes, setNotes] = useState(existingData?.notes || "");
  const [diseaseStatus, setDiseaseStatus] = useState<string>(existingData?.diseaseStatus || "");
  const [diseaseSeverity, setDiseaseSeverity] = useState<"none" | "mild" | "moderate" | "severe">(
    existingData?.diseaseSeverity || "none"
  );
  const [aiRecommendations, setAiRecommendations] = useState<string[]>(
    existingData?.aiRecommendations?.recommendations || []
  );
  const [showAiPanel, setShowAiPanel] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Helper to convert API data to component format
  function convertFromApiFormat(apiData: PerioChartData): PerioData {
    const result: PerioData = {};
    
    // Process pocket depths
    if (apiData.pocketDepths) {
      Object.entries(apiData.pocketDepths).forEach(([toothNum, depths]: [string, any]) => {
        const tooth = parseInt(toothNum);
        if (!result[tooth]) {
          result[tooth] = createEmptyToothMeasurements();
        }
        if (depths.facial) result[tooth].pocketDepths.facial = depths.facial;
        if (depths.lingual) result[tooth].pocketDepths.lingual = depths.lingual;
      });
    }
    
    // Process bleeding points
    if (apiData.bleedingPoints) {
      Object.entries(apiData.bleedingPoints).forEach(([toothNum, bleeding]: [string, any]) => {
        const tooth = parseInt(toothNum);
        if (!result[tooth]) {
          result[tooth] = createEmptyToothMeasurements();
        }
        if (bleeding.facial) result[tooth].bleeding.facial = bleeding.facial;
        if (bleeding.lingual) result[tooth].bleeding.lingual = bleeding.lingual;
      });
    }
    
    // Process mobility
    if (apiData.mobility) {
      Object.entries(apiData.mobility).forEach(([toothNum, mobility]: [string, any]) => {
        const tooth = parseInt(toothNum);
        if (!result[tooth]) {
          result[tooth] = createEmptyToothMeasurements();
        }
        result[tooth].mobility = mobility;
      });
    }
    
    // Process furcation
    if (apiData.furcation) {
      Object.entries(apiData.furcation).forEach(([toothNum, furcation]: [string, any]) => {
        const tooth = parseInt(toothNum);
        if (!result[tooth]) {
          result[tooth] = createEmptyToothMeasurements();
        }
        result[tooth].furcation = furcation;
      });
    }
    
    // Process recession
    if (apiData.recession) {
      Object.entries(apiData.recession).forEach(([toothNum, recession]: [string, any]) => {
        const tooth = parseInt(toothNum);
        if (!result[tooth]) {
          result[tooth] = createEmptyToothMeasurements();
        }
        if (recession.facial) result[tooth].recession.facial = recession.facial;
        if (recession.lingual) result[tooth].recession.lingual = recession.lingual;
      });
    }
    
    return result;
  }

  // Helper to convert component data to API format
  function convertToApiFormat(): PerioChartData {
    const pocketDepths: Record<string, any> = {};
    const bleedingPoints: Record<string, any> = {};
    const mobility: Record<string, any> = {};
    const furcation: Record<string, any> = {};
    const recession: Record<string, any> = {};
    const calculus: Record<string, any> = {};
    const plaqueIndices: Record<string, any> = {};
    
    // Convert all teeth data to the appropriate format
    Object.entries(perioData).forEach(([toothNum, data]) => {
      const tooth = toothNum;
      
      // Pocket depths
      pocketDepths[tooth] = {
        facial: data.pocketDepths.facial,
        lingual: data.pocketDepths.lingual
      };
      
      // Bleeding points
      bleedingPoints[tooth] = {
        facial: data.bleeding.facial,
        lingual: data.bleeding.lingual
      };
      
      // Mobility
      mobility[tooth] = data.mobility;
      
      // Furcation
      furcation[tooth] = data.furcation;
      
      // Recession
      recession[tooth] = {
        facial: data.recession.facial,
        lingual: data.recession.lingual
      };
      
      // Calculus (if present)
      if (data.calculusPresent !== undefined) {
        calculus[tooth] = data.calculusPresent;
      }
      
      // Plaque index (if present)
      if (data.plaqueIndex !== undefined) {
        plaqueIndices[tooth] = data.plaqueIndex;
      }
    });
    
    // Construct the full chart data
    const chartData: PerioChartData = {
      patientId,
      doctorId,
      pocketDepths,
      bleedingPoints,
      mobility,
      furcation,
      recession,
      calculus,
      plaqueIndices,
      diseaseStatus,
      diseaseSeverity,
      notes,
      aiRecommendations: {
        recommendations: aiRecommendations,
        date: new Date().toISOString()
      }
    };
    
    // If we're editing an existing chart, include the ID
    if (existingData?.id) {
      chartData.id = existingData.id;
    }
    
    return chartData;
  }

  // Save chart data to the server
  const saveChartMutation = useMutation({
    mutationFn: (data: PerioChartData) => {
      if (data.id) {
        // Update existing chart
        return apiRequest(`/api/periodontal-charts/${data.id}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        });
      } else {
        // Create new chart
        return apiRequest('/api/periodontal-charts', {
          method: 'POST',
          body: JSON.stringify(data)
        });
      }
    },
    onSuccess: (data) => {
      toast({
        title: 'Chart saved successfully',
        description: 'The periodontal chart has been saved to the patient record.',
      });
      
      // Update cache and call callback if provided
      queryClient.invalidateQueries({ queryKey: ['/api/patients', patientId, 'periodontal-charts'] });
      if (onSave) onSave(data);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error saving chart',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Get AI recommendations based on current perio data
  const getAiRecommendationsMutation = useMutation({
    mutationFn: (data: PerioChartData) => {
      return apiRequest('/api/ai/perio-recommendations', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (data) => {
      setAiRecommendations(data.recommendations || []);
      setDiseaseStatus(data.diseaseStatus || diseaseStatus);
      setDiseaseSeverity(data.diseaseSeverity || diseaseSeverity);
      setShowAiPanel(true);
      
      toast({
        title: 'AI Analysis Complete',
        description: 'Periodontal analysis and recommendations generated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error generating recommendations',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Helper to create empty tooth measurements
  const createEmptyToothMeasurements = (): ToothMeasurements => ({
    pocketDepths: {
      facial: [0, 0, 0],
      lingual: [0, 0, 0]
    },
    bleeding: {
      facial: [false, false, false],
      lingual: [false, false, false]
    },
    mobility: 0,
    furcation: 0,
    recession: {
      facial: 0,
      lingual: 0
    }
  });

  // Get teeth numbers based on current arc
  const getTeethNumbers = () => {
    return activeArc === "upper" 
      ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
      : [32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17];
  };

  // Handle pocket depth input
  const handleDepthChange = (tooth: number, surface: "facial" | "lingual", position: number, value: number) => {
    setPerioData(prev => {
      const toothData = prev[tooth] || createEmptyToothMeasurements();
      const updatedToothData = { ...toothData };
      
      updatedToothData.pocketDepths[surface][position] = value;
      
      return {
        ...prev,
        [tooth]: updatedToothData
      };
    });
  };

  // Toggle bleeding point
  const toggleBleeding = (tooth: number, surface: "facial" | "lingual", position: number) => {
    setPerioData(prev => {
      const toothData = prev[tooth] || createEmptyToothMeasurements();
      const updatedToothData = { ...toothData };
      
      updatedToothData.bleeding[surface][position] = !updatedToothData.bleeding[surface][position];
      
      return {
        ...prev,
        [tooth]: updatedToothData
      };
    });
  };

  // Handle recession input
  const handleRecessionChange = (tooth: number, surface: "facial" | "lingual", value: number) => {
    setPerioData(prev => {
      const toothData = prev[tooth] || createEmptyToothMeasurements();
      const updatedToothData = { ...toothData };
      
      updatedToothData.recession[surface] = value;
      
      return {
        ...prev,
        [tooth]: updatedToothData
      };
    });
  };

  // Handle voice recording for perio probing
  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // In a real implementation, this would start/stop voice recognition
    // for hands-free perio charting
    
    if (isRecording) {
      toast({
        title: 'Voice recording stopped',
        description: 'Voice input has been stopped.'
      });
    } else {
      toast({
        title: 'Voice recording started',
        description: 'Speak clearly to record periodontal measurements.'
      });
    }
  };

  // Set active position for data entry
  const selectPosition = (tooth: number, surface: "facial" | "lingual", position: number) => {
    setActiveTooth(tooth);
    setActivePosition([surface, position]);
  };

  // Get a specific pocket depth value
  const getPocketDepth = (tooth: number, surface: "facial" | "lingual", position: number): number => {
    return perioData[tooth]?.pocketDepths[surface][position] || 0;
  };

  // Get bleeding status
  const getBleeding = (tooth: number, surface: "facial" | "lingual", position: number): boolean => {
    return perioData[tooth]?.bleeding[surface][position] || false;
  };

  // Get recession value
  const getRecession = (tooth: number, surface: "facial" | "lingual"): number => {
    return perioData[tooth]?.recession[surface] || 0;
  };

  // Calculate disease severity based on pocket depths and bleeding
  const analyzePeriodontalStatus = () => {
    let maxPocketDepth = 0;
    let bleedingPoints = 0;
    let totalPoints = 0;
    
    Object.values(perioData).forEach(tooth => {
      // Check all pocket depths
      tooth.pocketDepths.facial.forEach(depth => {
        if (depth > maxPocketDepth) maxPocketDepth = depth;
        totalPoints++;
      });
      
      tooth.pocketDepths.lingual.forEach(depth => {
        if (depth > maxPocketDepth) maxPocketDepth = depth;
        totalPoints++;
      });
      
      // Count bleeding points
      tooth.bleeding.facial.forEach(bleeding => {
        if (bleeding) bleedingPoints++;
      });
      
      tooth.bleeding.lingual.forEach(bleeding => {
        if (bleeding) bleedingPoints++;
      });
    });
    
    const bleedingPercentage = totalPoints > 0 ? (bleedingPoints / totalPoints) * 100 : 0;
    
    // Determine disease status and severity
    let status = "healthy";
    let severity: "none" | "mild" | "moderate" | "severe" = "none";
    
    if (maxPocketDepth <= 3 && bleedingPercentage < 10) {
      status = "healthy";
      severity = "none";
    } else if (maxPocketDepth <= 4 && bleedingPercentage < 30) {
      status = "gingivitis";
      severity = "mild";
    } else if (maxPocketDepth <= 5 && bleedingPercentage < 50) {
      status = "periodontitis";
      severity = "moderate";
    } else {
      status = "periodontitis";
      severity = "severe";
    }
    
    setDiseaseStatus(status);
    setDiseaseSeverity(severity);
  };

  // Get severity color for badges
  const getSeverityColor = (severity: "none" | "mild" | "moderate" | "severe") => {
    switch (severity) {
      case "none":
        return "bg-green-100 text-green-800";
      case "mild":
        return "bg-blue-100 text-blue-800";
      case "moderate":
        return "bg-amber-100 text-amber-800";
      case "severe":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Generate AI recommendations
  const generateRecommendations = () => {
    // Analyze the current data first
    analyzePeriodontalStatus();
    
    // Then send to the AI
    const chartData = convertToApiFormat();
    getAiRecommendationsMutation.mutate(chartData);
  };

  // Save chart data
  const saveChart = () => {
    analyzePeriodontalStatus();
    const chartData = convertToApiFormat();
    saveChartMutation.mutate(chartData);
  };

  // Render pocket depth input
  const renderPocketDepthCell = (tooth: number, surface: "facial" | "lingual", position: number) => {
    const isActive = activeTooth === tooth && activePosition?.[0] === surface && activePosition?.[1] === position;
    const value = getPocketDepth(tooth, surface, position);
    const bleeding = getBleeding(tooth, surface, position);
    const cellColorClass = value >= 7 ? 'bg-red-50' : 
                           value >= 5 ? 'bg-amber-50' : 
                           value >= 4 ? 'bg-yellow-50' : '';
    
    return (
      <div 
        className={`relative flex items-center justify-center w-10 h-10 border ${
          isActive ? 'border-primary bg-primary/10' : 'border-gray-200'
        } ${bleeding ? 'bg-red-100' : cellColorClass}`}
        onClick={() => selectPosition(tooth, surface, position)}
      >
        <Input
          type="number"
          min="0"
          max="15"
          value={value || ""}
          onChange={(e) => handleDepthChange(tooth, surface, position, parseInt(e.target.value) || 0)}
          className="w-full h-full text-center p-0 border-0 focus:ring-0"
        />
        <button 
          className={`absolute -bottom-1 right-0 w-3 h-3 rounded-full ${bleeding ? 'bg-red-500' : 'bg-gray-200'}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleBleeding(tooth, surface, position);
          }}
        />
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Periodontal Chart</CardTitle>
              <CardDescription>Record pocket depths, bleeding points, and other periodontal measurements</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={toggleRecording}>
                <Mic className={`h-4 w-4 mr-1 ${isRecording ? 'text-red-500' : ''}`} />
                {isRecording ? 'Recording...' : 'Voice Input'}
              </Button>
              <Button variant="outline" size="sm" onClick={generateRecommendations} disabled={getAiRecommendationsMutation.isPending}>
                {getAiRecommendationsMutation.isPending ? (
                  <>
                    <div className="h-4 w-4 mr-1 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <PlayCircle className="h-4 w-4 mr-1" />
                    AI Analysis
                  </>
                )}
              </Button>
              <Button variant="default" size="sm" onClick={saveChart} disabled={saveChartMutation.isPending}>
                {saveChartMutation.isPending ? (
                  <>
                    <div className="h-4 w-4 mr-1 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1" />
                    Save Chart
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setActiveArc(activeArc === "upper" ? "lower" : "upper")}
              >
                {activeArc === "upper" ? (
                  <span className="flex items-center">
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Switch to Lower Arch
                  </span>
                ) : (
                  <span className="flex items-center">
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Switch to Upper Arch
                  </span>
                )}
              </Button>
              
              <Tabs value={activeView} onValueChange={(v) => setActiveView(v as "facial" | "lingual")}>
                <TabsList>
                  <TabsTrigger value="facial">Facial View</TabsTrigger>
                  <TabsTrigger value="lingual">Lingual View</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-1 py-2 text-center">Tooth</th>
                    <th className="px-1 py-2 text-center" colSpan={3}>Mesial</th>
                    <th className="px-1 py-2 text-center" colSpan={3}>Middle</th>
                    <th className="px-1 py-2 text-center" colSpan={3}>Distal</th>
                    <th className="px-1 py-2 text-center">Recession</th>
                    <th className="px-1 py-2 text-center">Mobility</th>
                    <th className="px-1 py-2 text-center">Furcation</th>
                  </tr>
                </thead>
                <tbody>
                  {getTeethNumbers().map(toothNumber => (
                    <tr key={toothNumber} className="border-b">
                      <td className="px-2 py-2 text-center font-medium">{toothNumber}</td>
                      {[0, 1, 2].map(position => (
                        <td key={`${toothNumber}-${position}`} className="p-1">
                          {renderPocketDepthCell(toothNumber, activeView, position)}
                        </td>
                      ))}
                      <td className="px-2 text-center">
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          value={getRecession(toothNumber, activeView) || ""}
                          onChange={(e) => handleRecessionChange(toothNumber, activeView, parseInt(e.target.value) || 0)}
                          className="w-12 p-1 border border-gray-200 rounded text-center"
                        />
                      </td>
                      <td className="px-2 text-center">
                        <select 
                          className="w-12 p-1 border border-gray-200 rounded text-center"
                          value={perioData[toothNumber]?.mobility || 0}
                          onChange={(e) => {
                            const mobility = parseInt(e.target.value);
                            setPerioData(prev => ({
                              ...prev,
                              [toothNumber]: {
                                ...(prev[toothNumber] || createEmptyToothMeasurements()),
                                mobility
                              }
                            }));
                          }}
                        >
                          <option value={0}>0</option>
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                          <option value={3}>3</option>
                        </select>
                      </td>
                      <td className="px-2 text-center">
                        <select 
                          className="w-12 p-1 border border-gray-200 rounded text-center"
                          value={perioData[toothNumber]?.furcation || 0}
                          onChange={(e) => {
                            const furcation = parseInt(e.target.value);
                            setPerioData(prev => ({
                              ...prev,
                              [toothNumber]: {
                                ...(prev[toothNumber] || createEmptyToothMeasurements()),
                                furcation
                              }
                            }));
                          }}
                        >
                          <option value={0}>0</option>
                          <option value={1}>I</option>
                          <option value={2}>II</option>
                          <option value={3}>III</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div>
                <h3 className="text-sm font-medium mb-2">Periodontal Status</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge className={getSeverityColor(diseaseSeverity)}>
                    {diseaseSeverity.charAt(0).toUpperCase() + diseaseSeverity.slice(1)}
                  </Badge>
                  <Badge variant="outline">
                    {diseaseStatus || 'Not assessed'}
                  </Badge>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Notes</h3>
                <textarea 
                  className="w-full h-24 p-2 border border-gray-200 rounded-md"
                  placeholder="Add clinical notes about the periodontal examination..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {showAiPanel && (
        <Card>
          <CardHeader>
            <CardTitle>AI Periodontal Analysis</CardTitle>
            <CardDescription>
              AI-generated recommendations based on the periodontal examination
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <h3 className="font-medium">Estimated Disease Status:</h3>
                <Badge className={getSeverityColor(diseaseSeverity)}>
                  {diseaseStatus} ({diseaseSeverity})
                </Badge>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Recommendations:</h3>
                <ul className="space-y-2 pl-5 list-disc">
                  {aiRecommendations.length > 0 ? (
                    aiRecommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))
                  ) : (
                    <li className="text-muted-foreground">No recommendations available. Generate AI analysis first.</li>
                  )}
                </ul>
              </div>
              
              {aiRecommendations.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-amber-800">
                      AI recommendations are for reference only. Clinical judgment should always take precedence.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

const ChevronUp = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polyline points="18 15 12 9 6 15"></polyline>
  </svg>
);

const ChevronDown = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);