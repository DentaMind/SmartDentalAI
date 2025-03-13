import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Maximize2, Save } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ToothSvgOcclusal } from './tooth-illustrations';

interface Restoration {
  type: 'amalgam' | 'composite' | 'crown' | 'implant' | 'bridge' | 'root-canal' | 'sealant' | 'veneer' | 'none';
  surfaces: Array<'M' | 'O' | 'D' | 'B' | 'L'>;
  notes?: string;
}

interface ToothRestoration {
  restorations: Restoration[];
  missing: boolean;
}

interface RestorativeChartProps {
  patientId: number;
  patientName: string;
  readOnly?: boolean;
  onSave?: (data: any) => void;
}

export function RestorativeChart({
  patientId,
  patientName,
  readOnly = false,
  onSave
}: RestorativeChartProps) {
  const [fullScreen, setFullScreen] = useState(false);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [selectedRestorationType, setSelectedRestorationType] = useState<Restoration['type']>('composite');
  const [restorations, setRestorations] = useState<Record<number, ToothRestoration>>({});

  // Initialize restorations for all teeth
  React.useEffect(() => {
    const initialRestorations: Record<number, ToothRestoration> = {};
    // Initialize upper arch (1-16)
    for (let i = 1; i <= 16; i++) {
      initialRestorations[i] = {
        restorations: [],
        missing: false
      };
    }
    // Initialize lower arch (17-32)
    for (let i = 17; i <= 32; i++) {
      initialRestorations[i] = {
        restorations: [],
        missing: false
      };
    }
    setRestorations(initialRestorations);
  }, []);



  // Function to handle tooth click
  const handleToothClick = (toothNumber: number) => {
    setSelectedTooth(toothNumber);
  };

  // Function to add restoration to tooth
  const addRestoration = () => {
    if (selectedTooth === null) return;
    
    setRestorations(prev => {
      const updatedRestorations = { ...prev };
      updatedRestorations[selectedTooth].restorations.push({
        type: selectedRestorationType,
        surfaces: ['O'] // Default to occlusal surface
      });
      return updatedRestorations;
    });
    
    toast({
      title: "Restoration Added",
      description: `Added ${selectedRestorationType} to tooth #${selectedTooth}`,
    });
  };

  // Function to mark tooth as missing
  const markToothMissing = () => {
    if (selectedTooth === null) return;
    
    setRestorations(prev => {
      const updatedRestorations = { ...prev };
      updatedRestorations[selectedTooth].missing = !updatedRestorations[selectedTooth].missing;
      return updatedRestorations;
    });
    
    toast({
      title: "Tooth Status Updated",
      description: `Tooth #${selectedTooth} marked as ${restorations[selectedTooth]?.missing ? 'present' : 'missing'}`,
    });
  };

  // Function to clear all restorations from a tooth
  const clearToothRestorations = () => {
    if (selectedTooth === null) return;
    
    setRestorations(prev => {
      const updatedRestorations = { ...prev };
      updatedRestorations[selectedTooth].restorations = [];
      return updatedRestorations;
    });
    
    toast({
      title: "Restorations Cleared",
      description: `Cleared all restorations from tooth #${selectedTooth}`,
    });
  };

  // Function to save the chart
  const handleSave = () => {
    if (onSave) {
      onSave({
        patientId,
        restorations,
        timestamp: new Date().toISOString()
      });
    }
    toast({
      title: "Chart Saved",
      description: "Restorative chart has been saved successfully.",
    });
  };

  // Function to get color for tooth based on restorations
  const getToothFill = (toothNumber: number) => {
    const tooth = restorations[toothNumber];
    
    if (!tooth) return "white";
    if (tooth.missing) return "#f0f0f0"; // Light gray for missing teeth
    
    // For simplicity, just use the first restoration to color the tooth
    if (tooth.restorations.length > 0) {
      const firstRestoration = tooth.restorations[0];
      switch (firstRestoration.type) {
        case 'amalgam': return "#555555"; // Dark gray for amalgam
        case 'composite': return "#e0e0e0"; // Light gray for composite
        case 'crown': return "#FFD700"; // Gold for crown
        case 'implant': return "#8A2BE2"; // Purple for implant
        case 'bridge': return "#4169E1"; // Royal blue for bridge
        case 'root-canal': return "#FF4500"; // Red-orange for root canal
        case 'sealant': return "#87CEEB"; // Sky blue for sealant
        case 'veneer': return "#FAFAD2"; // Light yellow for veneer
        default: return "white";
      }
    }
    
    return "white"; // Default fill
  };

  // Function to get tooth stroke based on restorations
  const getToothStroke = (toothNumber: number) => {
    const tooth = restorations[toothNumber];
    
    if (!tooth) return "black";
    if (tooth.missing) return "#999999"; // Gray for missing teeth
    
    // For simplicity, just use the first restoration to color the tooth stroke
    if (tooth.restorations.length > 0) {
      const firstRestoration = tooth.restorations[0];
      if (firstRestoration.type === 'bridge') return "#0000FF"; // Blue for bridge
    }
    
    return "black"; // Default stroke
  };

  return (
    <Card className={`w-full ${fullScreen ? 'fixed inset-0 z-50 overflow-auto' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between p-2 sm:p-4">
        <div>
          <CardTitle className="text-base sm:text-lg">Restorative Chart (Occlusal View)</CardTitle>
          <div className="text-xs sm:text-sm text-muted-foreground">
            Patient: {patientName}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setFullScreen(!fullScreen)}
                  className="h-7 w-7"
                >
                  <Maximize2 className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{fullScreen ? 'Exit Fullscreen' : 'Fullscreen Mode'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {!readOnly && (
            <Button onClick={handleSave} size="sm" className="h-7 text-xs">
              <Save className="h-3 w-3 mr-1" />
              Save
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-2 sm:p-4">
        <div className="space-y-8">
          {/* Restoration Type Selector */}
          {!readOnly && (
            <div className="flex flex-wrap gap-2 justify-center">
              <Button 
                size="sm" 
                variant={selectedRestorationType === 'amalgam' ? 'default' : 'outline'}
                onClick={() => setSelectedRestorationType('amalgam')}
                className="bg-gray-800 text-white border-gray-800 hover:bg-gray-700 hover:text-white"
              >
                Amalgam
              </Button>
              <Button 
                size="sm" 
                variant={selectedRestorationType === 'composite' ? 'default' : 'outline'}
                onClick={() => setSelectedRestorationType('composite')}
                className="bg-gray-200 text-gray-800 border-gray-300 hover:bg-gray-300"
              >
                Composite
              </Button>
              <Button 
                size="sm" 
                variant={selectedRestorationType === 'crown' ? 'default' : 'outline'}
                onClick={() => setSelectedRestorationType('crown')}
                className="bg-yellow-400 text-yellow-900 border-yellow-500 hover:bg-yellow-500"
              >
                Crown
              </Button>
              <Button 
                size="sm" 
                variant={selectedRestorationType === 'bridge' ? 'default' : 'outline'}
                onClick={() => setSelectedRestorationType('bridge')}
                className="bg-blue-500 text-white border-blue-600 hover:bg-blue-600"
              >
                Bridge
              </Button>
              <Button 
                size="sm" 
                variant={selectedRestorationType === 'implant' ? 'default' : 'outline'}
                onClick={() => setSelectedRestorationType('implant')}
                className="bg-purple-600 text-white border-purple-700 hover:bg-purple-700"
              >
                Implant
              </Button>
              <Button 
                size="sm" 
                variant={selectedRestorationType === 'root-canal' ? 'default' : 'outline'}
                onClick={() => setSelectedRestorationType('root-canal')}
                className="bg-red-500 text-white border-red-600 hover:bg-red-600"
              >
                Root Canal
              </Button>
            </div>
          )}
          
          {/* Selected Tooth Actions */}
          {selectedTooth !== null && !readOnly && (
            <div className="flex flex-wrap gap-2 justify-center">
              <Button 
                size="sm" 
                variant="default"
                onClick={addRestoration}
              >
                Add {selectedRestorationType} to Tooth #{selectedTooth}
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={markToothMissing}
              >
                {restorations[selectedTooth]?.missing ? 'Mark as Present' : 'Mark as Missing'}
              </Button>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={clearToothRestorations}
              >
                Clear Restorations
              </Button>
            </div>
          )}

          {/* Upper Arch */}
          <div className="relative">
            <div className="flex justify-between mb-1">
              <span className="text-xs sm:text-sm font-medium">Upper Arch (1-16)</span>
            </div>
            
            <div className="grid grid-cols-8 sm:grid-cols-16 gap-1 pb-2">
              {Array.from({length: 16}, (_, i) => i + 1).map(tooth => (
                <div 
                  key={tooth} 
                  className={`flex flex-col items-center ${selectedTooth === tooth ? 'bg-blue-100 rounded' : ''}`}
                  onClick={() => !readOnly && handleToothClick(tooth)}
                >
                  <div className="text-[10px] font-medium">#{tooth}</div>
                  <ToothSvgOcclusal
                    toothNumber={tooth}
                    width={24}
                    height={24}
                    fill={getToothFill(tooth)}
                    stroke={getToothStroke(tooth)}
                    strokeWidth={1}
                    className="cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Lower Arch */}
          <div className="relative">
            <div className="flex justify-between mb-1">
              <span className="text-xs sm:text-sm font-medium">Lower Arch (17-32)</span>
            </div>
            
            <div className="grid grid-cols-8 sm:grid-cols-16 gap-1">
              {Array.from({length: 16}, (_, i) => i + 17).map(tooth => (
                <div 
                  key={tooth} 
                  className={`flex flex-col items-center ${selectedTooth === tooth ? 'bg-blue-100 rounded' : ''}`}
                  onClick={() => !readOnly && handleToothClick(tooth)}
                >
                  <ToothSvgOcclusal
                    toothNumber={tooth}
                    width={24}
                    height={24}
                    fill={getToothFill(tooth)}
                    stroke={getToothStroke(tooth)}
                    strokeWidth={1}
                    className="cursor-pointer"
                  />
                  <div className="text-[10px] font-medium">#{tooth}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="border-t pt-4">
            <div className="text-xs sm:text-sm font-medium mb-2">Legend:</div>
            <div className="flex flex-wrap gap-3 justify-center text-xs">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-800 mr-1"></div>
                <span>Amalgam</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-200 border border-gray-300 mr-1"></div>
                <span>Composite</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-400 mr-1"></div>
                <span>Crown</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-500 mr-1"></div>
                <span>Bridge</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-purple-600 mr-1"></div>
                <span>Implant</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-500 mr-1"></div>
                <span>Root Canal</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-100 border border-gray-300 mr-1"></div>
                <span>Missing</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}