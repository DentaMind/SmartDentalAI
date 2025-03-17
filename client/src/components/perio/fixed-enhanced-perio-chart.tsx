import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Maximize2, Save } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { ToothSvgBuccal, ToothSvgLingual } from '../dental/tooth-illustrations';

// Define the data structure for periodontal measurements
interface PerioMeasurements {
  mobility: number | null;
  implant: boolean;
  furcation: number | null;
  bleedingOnProbing: boolean;
  plaque: boolean;
  gingivalMargin: number | null;
  probingDepth: {
    buccal: {
      distal: number | null;
      mid: number | null;
      mesial: number | null;
    };
    lingual: {
      distal: number | null;
      mid: number | null;
      mesial: number | null;
    };
  };
  attachmentLoss: {
    buccal: {
      distal: number | null;
      mid: number | null;
      mesial: number | null;
    };
    lingual: {
      distal: number | null;
      mid: number | null;
      mesial: number | null;
    };
  };
}

// Define the component props
interface FixedEnhancedPerioChartProps {
  patientId: number;
  patientName: string;
  readOnly?: boolean;
  onSave?: (data: any) => void;
}

export function FixedEnhancedPerioChart({
  patientId,
  patientName,
  readOnly = false,
  onSave
}: FixedEnhancedPerioChartProps) {
  // UI state
  const [fullScreen, setFullScreen] = useState(false);
  const [activeTab, setActiveTab] = useState('probingDepth');
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [selectedMeasurementType, setSelectedMeasurementType] = useState<'probingDepth' | 'gingivalMargin' | 'attachmentLoss' | 'mobility' | 'furcation'>('probingDepth');
  const [selectedSurface, setSelectedSurface] = useState<'buccal' | 'lingual' | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<'mesial' | 'mid' | 'distal' | null>(null);
  const [examType, setExamType] = useState<'initial' | 'followup' | 'maintenance'>('initial');
  
  // Measurements data
  const [measurements, setMeasurements] = useState<Record<number, PerioMeasurements>>({});

  // Initialize measurements for all teeth using FDI notation system
  useEffect(() => {
    const initialMeasurements: Record<number, PerioMeasurements> = {};
    
    // Upper right quadrant (18-11)
    for (let i = 18; i >= 11; i--) {
      initialMeasurements[i] = createEmptyMeasurement();
    }
    
    // Upper left quadrant (21-28)
    for (let i = 21; i <= 28; i++) {
      initialMeasurements[i] = createEmptyMeasurement();
    }
    
    // Lower right quadrant (48-41)
    for (let i = 48; i >= 41; i--) {
      initialMeasurements[i] = createEmptyMeasurement();
    }
    
    // Lower left quadrant (31-38)
    for (let i = 31; i <= 38; i++) {
      initialMeasurements[i] = createEmptyMeasurement();
    }
    
    setMeasurements(initialMeasurements);
  }, []);

  // Helper function to create an empty measurement object
  const createEmptyMeasurement = (): PerioMeasurements => ({
    mobility: null,
    implant: false,
    furcation: null,
    bleedingOnProbing: false,
    plaque: false,
    gingivalMargin: null,
    probingDepth: {
      buccal: { mesial: null, mid: null, distal: null },
      lingual: { mesial: null, mid: null, distal: null },
    },
    attachmentLoss: {
      buccal: { mesial: null, mid: null, distal: null },
      lingual: { mesial: null, mid: null, distal: null },
    }
  });

  // Function to handle tooth click
  const handleToothClick = (toothNumber: number) => {
    setSelectedTooth(toothNumber);
    setSelectedPosition(null);
    setSelectedSurface(null);
  };

  // Function to handle position click (mesial, mid, distal)
  const handlePositionClick = (
    tooth: number, 
    surface: 'buccal' | 'lingual', 
    position: 'mesial' | 'mid' | 'distal'
  ) => {
    setSelectedTooth(tooth);
    setSelectedSurface(surface);
    setSelectedPosition(position);
  };

  // Function to update measurement value
  const updateProbingDepthValue = (value: number) => {
    if (selectedTooth === null || selectedSurface === null || selectedPosition === null) return;
    
    setMeasurements(prev => {
      const updatedMeasurements = { ...prev };
      
      if (selectedMeasurementType === 'probingDepth') {
        updatedMeasurements[selectedTooth].probingDepth[selectedSurface][selectedPosition] = value;
      } else if (selectedMeasurementType === 'attachmentLoss') {
        updatedMeasurements[selectedTooth].attachmentLoss[selectedSurface][selectedPosition] = value;
      } else if (selectedMeasurementType === 'gingivalMargin') {
        updatedMeasurements[selectedTooth].gingivalMargin = value;
      }
      
      return updatedMeasurements;
    });
    
    // Auto-advance to next position for better workflow
    if (selectedPosition === 'distal') {
      setSelectedPosition('mid');
    } else if (selectedPosition === 'mid') {
      setSelectedPosition('mesial');
    } else if (selectedPosition === 'mesial') {
      // Move to next tooth or surface
      if (selectedSurface === 'buccal') {
        setSelectedSurface('lingual');
        setSelectedPosition('distal');
      } else {
        // Move to next tooth
        const nextTooth = getNextTooth(selectedTooth);
        if (nextTooth) {
          setSelectedTooth(nextTooth);
          setSelectedSurface('buccal');
          setSelectedPosition('distal');
        }
      }
    }
  };

  // Function to determine next tooth in sequence using FDI notation
  const getNextTooth = (currentTooth: number) => {
    // Upper right quadrant (18-11)
    if (currentTooth > 11 && currentTooth <= 18) return currentTooth - 1;
    
    // Transition from upper right to upper left quadrant
    if (currentTooth === 11) return 21;
    
    // Upper left quadrant (21-28)
    if (currentTooth >= 21 && currentTooth < 28) return currentTooth + 1;
    
    // Transition from upper left to lower right quadrant
    if (currentTooth === 28) return 48;
    
    // Lower right quadrant (48-41)
    if (currentTooth > 41 && currentTooth <= 48) return currentTooth - 1;
    
    // Transition from lower right to lower left quadrant
    if (currentTooth === 41) return 31;
    
    // Lower left quadrant (31-38)
    if (currentTooth >= 31 && currentTooth < 38) return currentTooth + 1;
    
    return null; // End of sequence
  };

  // Function to toggle bleeding
  const toggleBleeding = (tooth: number) => {
    setMeasurements(prev => {
      const updatedMeasurements = { ...prev };
      updatedMeasurements[tooth].bleedingOnProbing = !updatedMeasurements[tooth].bleedingOnProbing;
      return updatedMeasurements;
    });
  };

  // Function to toggle plaque
  const togglePlaque = (tooth: number) => {
    setMeasurements(prev => {
      const updatedMeasurements = { ...prev };
      updatedMeasurements[tooth].plaque = !updatedMeasurements[tooth].plaque;
      return updatedMeasurements;
    });
  };

  // Function to toggle implant
  const toggleImplant = (tooth: number) => {
    setMeasurements(prev => {
      const updatedMeasurements = { ...prev };
      updatedMeasurements[tooth].implant = !updatedMeasurements[tooth].implant;
      return updatedMeasurements;
    });
  };

  // Function to set mobility
  const setMobility = (tooth: number, value: number | null) => {
    setMeasurements(prev => {
      const updatedMeasurements = { ...prev };
      updatedMeasurements[tooth].mobility = value;
      return updatedMeasurements;
    });
  };

  // Function to set furcation
  const setFurcation = (tooth: number, value: number | null) => {
    setMeasurements(prev => {
      const updatedMeasurements = { ...prev };
      updatedMeasurements[tooth].furcation = value;
      return updatedMeasurements;
    });
  };

  // Function to save the chart
  const handleSave = () => {
    if (onSave) {
      onSave({
        patientId,
        measurements,
        examType,
        timestamp: new Date().toISOString()
      });
    }
  };

  // Helper function to get cell background based on pocket depth with improved clinical color standard
  const getPocketDepthColor = (depth: number | null) => {
    if (depth === null) return 'bg-white';
    if (depth < 3) return 'bg-green-100'; // Healthy (<3mm)
    if (depth < 5) return 'bg-yellow-100'; // Mild inflammation (3-4mm)
    if (depth < 7) return 'bg-orange-100'; // Moderate periodontitis (5-6mm)
    return 'bg-red-100'; // Severe periodontitis (7mm+)
  };

  // Render teeth numbers for upper arch using FDI/ISO system (18-11, 21-28)
  const renderUpperTeethNumbers = () => {
    // Upper right quadrant (18-11)
    const upperRightTeeth = Array.from({length: 8}, (_, i) => 18 - i);
    // Upper left quadrant (21-28)
    const upperLeftTeeth = Array.from({length: 8}, (_, i) => 21 + i);
    
    return [...upperRightTeeth, ...upperLeftTeeth].map(tooth => (
      <div key={`upper-tooth-${tooth}`} className="text-center font-medium text-xs">
        {tooth}
      </div>
    ));
  };

  // Render teeth numbers for lower arch using FDI/ISO system (48-41, 31-38)
  const renderLowerTeethNumbers = () => {
    // Lower right quadrant (48-41)
    const lowerRightTeeth = Array.from({length: 8}, (_, i) => 48 - i);
    // Lower left quadrant (31-38)
    const lowerLeftTeeth = Array.from({length: 8}, (_, i) => 31 + i);
    
    return [...lowerRightTeeth, ...lowerLeftTeeth].map(tooth => (
      <div key={`lower-tooth-${tooth}`} className="text-center font-medium text-xs">
        {tooth}
      </div>
    ));
  };

  // Function to render furcation values with symbols
  const renderFurcation = (tooth: number) => {
    const value = measurements[tooth]?.furcation;
    
    if (value === null) return null;
    
    // Return character based on furcation grade
    if (value === 1) return <span className="text-yellow-500">○</span>; // Grade I
    if (value === 2) return <span className="text-orange-500">◐</span>; // Grade II
    if (value === 3) return <span className="text-red-500">●</span>; // Grade III
    
    return null;
  };

  // Prepare teeth arrays using FDI/ISO system
  // Upper teeth: right quadrant (18-11) followed by left quadrant (21-28)
  const upperRightTeeth = Array.from({length: 8}, (_, i) => 18 - i);
  const upperLeftTeeth = Array.from({length: 8}, (_, i) => 21 + i);
  const upperTeeth = [...upperRightTeeth, ...upperLeftTeeth];
  
  // Lower teeth: right quadrant (48-41) followed by left quadrant (31-38)
  const lowerRightTeeth = Array.from({length: 8}, (_, i) => 48 - i);
  const lowerLeftTeeth = Array.from({length: 8}, (_, i) => 31 + i);
  const lowerTeeth = [...lowerRightTeeth, ...lowerLeftTeeth];

  return (
    <Card className={`w-full overflow-hidden ${fullScreen ? 'fixed inset-0 z-50 overflow-auto' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between bg-card border-b p-2 sm:p-4">
        <div>
          <CardTitle className="text-base sm:text-lg text-foreground">Periodontal Chart</CardTitle>
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-4 pt-4">
          <TabsList className="w-full mb-4 bg-gray-100 grid grid-cols-3">
            <TabsTrigger value="probingDepth" className={`data-[state=active]:bg-white`}>
              Probing Depth
            </TabsTrigger>
            <TabsTrigger value="attachmentLoss" className={`data-[state=active]:bg-white`}>
              Attachment Loss
            </TabsTrigger>
            <TabsTrigger value="overview" className={`data-[state=active]:bg-white`}>
              Complete View
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="probingDepth" className="p-2 sm:p-4 overflow-auto">
          <div className="space-y-4">
            {/* Exam Type Selection */}
            {!readOnly && (
              <div className="flex flex-wrap gap-4 justify-start">
                <Button 
                  size="sm" 
                  variant={examType === 'initial' ? 'default' : 'outline'}
                  onClick={() => setExamType('initial')}
                >
                  Initial Exam
                </Button>
                <Button 
                  size="sm" 
                  variant={examType === 'followup' ? 'default' : 'outline'}
                  onClick={() => setExamType('followup')}
                >
                  Follow-up Visit
                </Button>
                <Button 
                  size="sm" 
                  variant={examType === 'maintenance' ? 'default' : 'outline'}
                  onClick={() => setExamType('maintenance')}
                >
                  Maintenance
                </Button>
              </div>
            )}

            {/* Value Selection Controls */}
            {selectedTooth !== null && !readOnly && (
              <div className="flex flex-wrap gap-2 items-center bg-gray-50 p-3 rounded-md">
                <div className="text-xs font-medium">
                  Tooth #{selectedTooth} {selectedSurface && selectedPosition && `${selectedSurface.charAt(0).toUpperCase() + selectedSurface.slice(1)} ${selectedPosition.charAt(0).toUpperCase() + selectedPosition.slice(1)}`}:
                </div>
                <div className="flex gap-1">
                  {selectedMeasurementType === 'probingDepth' && selectedSurface && selectedPosition && (
                    <>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(value => (
                        <Button 
                          key={value}
                          size="sm"
                          variant="outline"
                          className={`h-6 w-6 p-0 ${measurements[selectedTooth]?.probingDepth[selectedSurface][selectedPosition] === value ? 'bg-green-50 font-bold border-green-600' : ''}`}
                          onClick={() => updateProbingDepthValue(value)}
                        >
                          {value}
                        </Button>
                      ))}
                    </>
                  )}
                </div>
                
                <div className="flex gap-1 ml-auto">
                  <Button 
                    size="sm"
                    variant={measurements[selectedTooth]?.bleedingOnProbing ? 'destructive' : 'outline'}
                    onClick={() => toggleBleeding(selectedTooth)}
                  >
                    Bleeding
                  </Button>
                  <Button 
                    size="sm"
                    variant={measurements[selectedTooth]?.plaque ? 'default' : 'outline'}
                    onClick={() => togglePlaque(selectedTooth)}
                  >
                    Plaque
                  </Button>
                </div>
              </div>
            )}

            <div className="border rounded-lg overflow-hidden shadow-sm">
              {/* Upper Arch */}
              <div className="bg-white p-2">
                <div className="border-b pb-1 mb-2">
                  <h3 className="text-sm font-medium">Upper Arch</h3>
                </div>
                
                {/* Teeth numbers */}
                <div className="grid grid-cols-[8rem_repeat(16,minmax(1.5rem,1fr))] gap-1 text-xs">
                  <div></div>
                  {renderUpperTeethNumbers()}
                </div>
                
                {/* Bleeding & Plaque Indicators */}
                <div className="grid grid-cols-[8rem_repeat(16,minmax(1.5rem,1fr))] gap-1 text-xs mt-1">
                  <div className="flex items-center font-medium">Bleeding</div>
                  {upperTeeth.map(tooth => (
                    <div key={`bleeding-${tooth}`} className="flex justify-center items-center h-6 border">
                      {measurements[tooth]?.bleedingOnProbing && (
                        <span className="text-red-500 font-bold">✓</span>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-[8rem_repeat(16,minmax(1.5rem,1fr))] gap-1 text-xs mt-1">
                  <div className="flex items-center font-medium">Plaque</div>
                  {upperTeeth.map(tooth => (
                    <div key={`plaque-${tooth}`} className="flex justify-center items-center h-6 border">
                      {measurements[tooth]?.plaque && (
                        <span className="text-blue-500 font-bold">✓</span>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Tooth Visualizations */}
                <div className="grid grid-cols-[8rem_repeat(16,minmax(1.5rem,1fr))] gap-1 text-xs mt-1">
                  <div className="flex items-center font-medium">Buccal</div>
                  {upperTeeth.map(tooth => (
                    <div 
                      key={`buccal-${tooth}`} 
                      className={`flex justify-center ${selectedTooth === tooth ? 'border border-green-300 bg-green-50 rounded' : ''}`}
                      onClick={() => !readOnly && handleToothClick(tooth)}
                    >
                      <ToothSvgBuccal
                        toothNumber={tooth}
                        width={24}
                        height={40}
                        className="cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
                
                {/* Probing Depths - Buccal */}
                <div className="grid grid-cols-[8rem_repeat(16,minmax(1.5rem,1fr))] gap-1 text-xs">
                  <div></div>
                  {upperTeeth.map(tooth => (
                    <div key={`buccal-pd-${tooth}`} className="grid grid-cols-3 gap-px">
                      <div 
                        className={`h-6 flex justify-center items-center border ${getPocketDepthColor(measurements[tooth]?.probingDepth.buccal.distal)} ${selectedTooth === tooth && selectedSurface === 'buccal' && selectedPosition === 'distal' ? 'ring-2 ring-green-400' : ''}`}
                        onClick={() => !readOnly && handlePositionClick(tooth, 'buccal', 'distal')}
                      >
                        {measurements[tooth]?.probingDepth.buccal.distal}
                      </div>
                      <div 
                        className={`h-6 flex justify-center items-center border ${getPocketDepthColor(measurements[tooth]?.probingDepth.buccal.mid)} ${selectedTooth === tooth && selectedSurface === 'buccal' && selectedPosition === 'mid' ? 'ring-2 ring-green-400' : ''}`}
                        onClick={() => !readOnly && handlePositionClick(tooth, 'buccal', 'mid')}
                      >
                        {measurements[tooth]?.probingDepth.buccal.mid}
                      </div>
                      <div 
                        className={`h-6 flex justify-center items-center border ${getPocketDepthColor(measurements[tooth]?.probingDepth.buccal.mesial)} ${selectedTooth === tooth && selectedSurface === 'buccal' && selectedPosition === 'mesial' ? 'ring-2 ring-green-400' : ''}`}
                        onClick={() => !readOnly && handlePositionClick(tooth, 'buccal', 'mesial')}
                      >
                        {measurements[tooth]?.probingDepth.buccal.mesial}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Furcation */}
                <div className="grid grid-cols-[8rem_repeat(16,minmax(1.5rem,1fr))] gap-1 text-xs mt-2">
                  <div className="flex items-center font-medium">Furcation</div>
                  {upperTeeth.map(tooth => (
                    <div 
                      key={`furc-${tooth}`} 
                      className="flex justify-center items-center h-6 border"
                      onClick={() => !readOnly && selectedTooth === tooth && setFurcation(tooth, (measurements[tooth]?.furcation === null || measurements[tooth]?.furcation === 3) ? 1 : (measurements[tooth]?.furcation || 0) + 1)}
                    >
                      {renderFurcation(tooth)}
                    </div>
                  ))}
                </div>
                
                {/* Mobility */}
                <div className="grid grid-cols-[8rem_repeat(16,minmax(1.5rem,1fr))] gap-1 text-xs mt-1">
                  <div className="flex items-center font-medium">Mobility</div>
                  {upperTeeth.map(tooth => (
                    <div 
                      key={`mobility-${tooth}`} 
                      className="flex justify-center items-center h-6 border"
                      onClick={() => !readOnly && selectedTooth === tooth && setMobility(tooth, (measurements[tooth]?.mobility === null || measurements[tooth]?.mobility === 3) ? 0 : (measurements[tooth]?.mobility || 0) + 1)}
                    >
                      {measurements[tooth]?.mobility !== null ? measurements[tooth]?.mobility : ''}
                    </div>
                  ))}
                </div>
                
                {/* Tooth Visualizations - Lingual */}
                <div className="grid grid-cols-[8rem_repeat(16,minmax(1.5rem,1fr))] gap-1 text-xs mt-4">
                  <div className="flex items-center font-medium">Lingual</div>
                  {upperTeeth.map(tooth => (
                    <div 
                      key={`lingual-${tooth}`} 
                      className={`flex justify-center ${selectedTooth === tooth ? 'border border-green-300 bg-green-50 rounded' : ''}`}
                      onClick={() => !readOnly && handleToothClick(tooth)}
                    >
                      <ToothSvgLingual
                        toothNumber={tooth}
                        width={24}
                        height={40}
                        className="cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
                
                {/* Probing Depths - Lingual */}
                <div className="grid grid-cols-[8rem_repeat(16,minmax(1.5rem,1fr))] gap-1 text-xs">
                  <div></div>
                  {upperTeeth.map(tooth => (
                    <div key={`lingual-pd-${tooth}`} className="grid grid-cols-3 gap-px">
                      <div 
                        className={`h-6 flex justify-center items-center border ${getPocketDepthColor(measurements[tooth]?.probingDepth.lingual.distal)} ${selectedTooth === tooth && selectedSurface === 'lingual' && selectedPosition === 'distal' ? 'ring-2 ring-green-400' : ''}`}
                        onClick={() => !readOnly && handlePositionClick(tooth, 'lingual', 'distal')}
                      >
                        {measurements[tooth]?.probingDepth.lingual.distal}
                      </div>
                      <div 
                        className={`h-6 flex justify-center items-center border ${getPocketDepthColor(measurements[tooth]?.probingDepth.lingual.mid)} ${selectedTooth === tooth && selectedSurface === 'lingual' && selectedPosition === 'mid' ? 'ring-2 ring-green-400' : ''}`}
                        onClick={() => !readOnly && handlePositionClick(tooth, 'lingual', 'mid')}
                      >
                        {measurements[tooth]?.probingDepth.lingual.mid}
                      </div>
                      <div 
                        className={`h-6 flex justify-center items-center border ${getPocketDepthColor(measurements[tooth]?.probingDepth.lingual.mesial)} ${selectedTooth === tooth && selectedSurface === 'lingual' && selectedPosition === 'mesial' ? 'ring-2 ring-green-400' : ''}`}
                        onClick={() => !readOnly && handlePositionClick(tooth, 'lingual', 'mesial')}
                      >
                        {measurements[tooth]?.probingDepth.lingual.mesial}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            
              {/* Lower Arch */}
              <div className="bg-white p-2 mt-6">
                <div className="border-b pb-1 mb-2">
                  <h3 className="text-sm font-medium">Lower Arch</h3>
                </div>
                
                {/* Probing Depths - Lingual (Lower) */}
                <div className="grid grid-cols-[8rem_repeat(16,minmax(1.5rem,1fr))] gap-1 text-xs">
                  <div></div>
                  {lowerTeeth.map(tooth => (
                    <div key={`lower-lingual-pd-${tooth}`} className="grid grid-cols-3 gap-px">
                      <div 
                        className={`h-6 flex justify-center items-center border ${getPocketDepthColor(measurements[tooth]?.probingDepth.lingual.distal)} ${selectedTooth === tooth && selectedSurface === 'lingual' && selectedPosition === 'distal' ? 'ring-2 ring-green-400' : ''}`}
                        onClick={() => !readOnly && handlePositionClick(tooth, 'lingual', 'distal')}
                      >
                        {measurements[tooth]?.probingDepth.lingual.distal}
                      </div>
                      <div 
                        className={`h-6 flex justify-center items-center border ${getPocketDepthColor(measurements[tooth]?.probingDepth.lingual.mid)} ${selectedTooth === tooth && selectedSurface === 'lingual' && selectedPosition === 'mid' ? 'ring-2 ring-green-400' : ''}`}
                        onClick={() => !readOnly && handlePositionClick(tooth, 'lingual', 'mid')}
                      >
                        {measurements[tooth]?.probingDepth.lingual.mid}
                      </div>
                      <div 
                        className={`h-6 flex justify-center items-center border ${getPocketDepthColor(measurements[tooth]?.probingDepth.lingual.mesial)} ${selectedTooth === tooth && selectedSurface === 'lingual' && selectedPosition === 'mesial' ? 'ring-2 ring-green-400' : ''}`}
                        onClick={() => !readOnly && handlePositionClick(tooth, 'lingual', 'mesial')}
                      >
                        {measurements[tooth]?.probingDepth.lingual.mesial}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Tooth Visualizations - Lingual (Lower) */}
                <div className="grid grid-cols-[8rem_repeat(16,minmax(1.5rem,1fr))] gap-1 text-xs mt-1">
                  <div className="flex items-center font-medium">Lingual</div>
                  {lowerTeeth.map(tooth => (
                    <div 
                      key={`lower-lingual-${tooth}`} 
                      className={`flex justify-center ${selectedTooth === tooth ? 'border border-green-300 bg-green-50 rounded' : ''}`}
                      onClick={() => !readOnly && handleToothClick(tooth)}
                    >
                      <ToothSvgLingual
                        toothNumber={tooth}
                        width={24}
                        height={40}
                        className="cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
                
                {/* Furcation (Lower) */}
                <div className="grid grid-cols-[8rem_repeat(16,minmax(1.5rem,1fr))] gap-1 text-xs mt-1">
                  <div className="flex items-center font-medium">Furcation</div>
                  {lowerTeeth.map(tooth => (
                    <div 
                      key={`lower-furc-${tooth}`} 
                      className="flex justify-center items-center h-6 border"
                      onClick={() => !readOnly && selectedTooth === tooth && setFurcation(tooth, (measurements[tooth]?.furcation === null || measurements[tooth]?.furcation === 3) ? 1 : (measurements[tooth]?.furcation || 0) + 1)}
                    >
                      {renderFurcation(tooth)}
                    </div>
                  ))}
                </div>
                
                {/* Mobility (Lower) */}
                <div className="grid grid-cols-[8rem_repeat(16,minmax(1.5rem,1fr))] gap-1 text-xs mt-1">
                  <div className="flex items-center font-medium">Mobility</div>
                  {lowerTeeth.map(tooth => (
                    <div 
                      key={`lower-mobility-${tooth}`} 
                      className="flex justify-center items-center h-6 border"
                      onClick={() => !readOnly && selectedTooth === tooth && setMobility(tooth, (measurements[tooth]?.mobility === null || measurements[tooth]?.mobility === 3) ? 0 : (measurements[tooth]?.mobility || 0) + 1)}
                    >
                      {measurements[tooth]?.mobility !== null ? measurements[tooth]?.mobility : ''}
                    </div>
                  ))}
                </div>
                
                {/* Tooth Visualizations - Buccal (Lower) */}
                <div className="grid grid-cols-[8rem_repeat(16,minmax(1.5rem,1fr))] gap-1 text-xs mt-2">
                  <div className="flex items-center font-medium">Buccal</div>
                  {lowerTeeth.map(tooth => (
                    <div 
                      key={`lower-buccal-${tooth}`} 
                      className={`flex justify-center ${selectedTooth === tooth ? 'border border-green-300 bg-green-50 rounded' : ''}`}
                      onClick={() => !readOnly && handleToothClick(tooth)}
                    >
                      <ToothSvgBuccal
                        toothNumber={tooth}
                        width={24}
                        height={40}
                        className="cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
                
                {/* Probing Depths - Buccal (Lower) */}
                <div className="grid grid-cols-[8rem_repeat(16,minmax(1.5rem,1fr))] gap-1 text-xs">
                  <div></div>
                  {lowerTeeth.map(tooth => (
                    <div key={`lower-buccal-pd-${tooth}`} className="grid grid-cols-3 gap-px">
                      <div 
                        className={`h-6 flex justify-center items-center border ${getPocketDepthColor(measurements[tooth]?.probingDepth.buccal.distal)} ${selectedTooth === tooth && selectedSurface === 'buccal' && selectedPosition === 'distal' ? 'ring-2 ring-green-400' : ''}`}
                        onClick={() => !readOnly && handlePositionClick(tooth, 'buccal', 'distal')}
                      >
                        {measurements[tooth]?.probingDepth.buccal.distal}
                      </div>
                      <div 
                        className={`h-6 flex justify-center items-center border ${getPocketDepthColor(measurements[tooth]?.probingDepth.buccal.mid)} ${selectedTooth === tooth && selectedSurface === 'buccal' && selectedPosition === 'mid' ? 'ring-2 ring-green-400' : ''}`}
                        onClick={() => !readOnly && handlePositionClick(tooth, 'buccal', 'mid')}
                      >
                        {measurements[tooth]?.probingDepth.buccal.mid}
                      </div>
                      <div 
                        className={`h-6 flex justify-center items-center border ${getPocketDepthColor(measurements[tooth]?.probingDepth.buccal.mesial)} ${selectedTooth === tooth && selectedSurface === 'buccal' && selectedPosition === 'mesial' ? 'ring-2 ring-green-400' : ''}`}
                        onClick={() => !readOnly && handlePositionClick(tooth, 'buccal', 'mesial')}
                      >
                        {measurements[tooth]?.probingDepth.buccal.mesial}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Bleeding & Plaque (Lower) */}
                <div className="grid grid-cols-[8rem_repeat(16,minmax(1.5rem,1fr))] gap-1 text-xs mt-1">
                  <div className="flex items-center font-medium">Plaque</div>
                  {lowerTeeth.map(tooth => (
                    <div key={`lower-plaque-${tooth}`} className="flex justify-center items-center h-6 border">
                      {measurements[tooth]?.plaque && (
                        <span className="text-blue-500 font-bold">✓</span>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-[8rem_repeat(16,minmax(1.5rem,1fr))] gap-1 text-xs mt-1">
                  <div className="flex items-center font-medium">Bleeding</div>
                  {lowerTeeth.map(tooth => (
                    <div key={`lower-bleeding-${tooth}`} className="flex justify-center items-center h-6 border">
                      {measurements[tooth]?.bleedingOnProbing && (
                        <span className="text-red-500 font-bold">✓</span>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Teeth numbers (Lower) */}
                <div className="grid grid-cols-[8rem_repeat(16,minmax(1.5rem,1fr))] gap-1 text-xs mt-1">
                  <div></div>
                  {renderLowerTeethNumbers()}
                </div>
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap gap-2 mt-4 p-2 bg-gray-50 rounded-md text-xs">
              <div className="font-medium">Legend:</div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-100 mr-1"></div>
                <span>1-2mm (Healthy)</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-100 mr-1"></div>
                <span>3-4mm (Gingivitis)</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-orange-100 mr-1"></div>
                <span>5-6mm (Moderate Periodontitis)</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-100 mr-1"></div>
                <span>7mm+ (Severe Periodontitis)</span>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="attachmentLoss" className="p-2 sm:p-4 overflow-auto">
          <div className="p-4 text-center">
            <h3 className="text-lg font-medium">Attachment Loss Measurement</h3>
            <p className="text-muted-foreground">
              This tab will show the clinical attachment loss measurements, calculated as probing depth plus recession.
            </p>
            <Button className="mt-4">Load Attachment Loss Data</Button>
          </div>
        </TabsContent>

        <TabsContent value="overview" className="p-2 sm:p-4 overflow-auto">
          <div className="p-4 text-center">
            <h3 className="text-lg font-medium">Complete Periodontal Assessment</h3>
            <p className="text-muted-foreground">
              This view will show a comprehensive view of all periodontal measurements, including pocket depths, attachment loss, and other indicators.
            </p>
            <Button className="mt-4">Generate Complete Overview</Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Instructions for Users */}
      {!readOnly && (
        <div className="px-4 pb-4 text-xs text-muted-foreground">
          <p>Click on a tooth or specific position to record measurements. Use the toolbar to toggle between different measurement types.</p>
        </div>
      )}
    </Card>
  );
}

// Add default export to fix imports
export default FixedEnhancedPerioChart;