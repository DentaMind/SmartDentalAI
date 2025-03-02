
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronRight, ChevronLeft, Save, PlayCircle, Mic } from "lucide-react";

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
}

type PerioData = Record<number, ToothMeasurements>; // tooth number to measurements

export function PerioChart() {
  const [activeArc, setActiveArc] = useState<"upper" | "lower">("upper");
  const [activeView, setActiveView] = useState<"facial" | "lingual">("facial");
  const [isRecording, setIsRecording] = useState(false);
  const [perioData, setPerioData] = useState<PerioData>({});
  const [activeTooth, setActiveTooth] = useState<number | null>(null);
  const [activePosition, setActivePosition] = useState<[string, number] | null>(null); // [surface, position]

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

  // Handle voice recording for perio probing
  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // In a real implementation, this would start/stop voice recognition
    // for hands-free perio charting
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

  // Render pocket depth input
  const renderPocketDepthCell = (tooth: number, surface: "facial" | "lingual", position: number) => {
    const isActive = activeTooth === tooth && activePosition?.[0] === surface && activePosition?.[1] === position;
    const value = getPocketDepth(tooth, surface, position);
    const bleeding = getBleeding(tooth, surface, position);
    
    return (
      <div 
        className={`relative flex items-center justify-center w-10 h-10 border ${
          isActive ? 'border-primary bg-primary/10' : 'border-gray-200'
        } ${bleeding ? 'bg-red-100' : ''}`}
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
            <CardTitle>Periodontal Chart</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={toggleRecording}>
                <Mic className={`h-4 w-4 mr-1 ${isRecording ? 'text-red-500' : ''}`} />
                {isRecording ? 'Recording...' : 'Voice Input'}
              </Button>
              <Button variant="outline" size="sm">
                <Save className="h-4 w-4 mr-1" />
                Save Chart
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
          </div>
        </CardContent>
      </Card>
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
