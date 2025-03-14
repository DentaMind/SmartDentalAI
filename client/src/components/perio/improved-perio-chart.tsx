import React, { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { ToothSvgBuccal, ToothSvgLingual } from '../dental/tooth-illustrations';

// Define all measurement types we need to capture
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
}

// Define the props for the component
interface ImprovedPerioChartProps {
  patientId: number;
  patientName: string;
  readOnly?: boolean;
  onSave?: (data: any) => void;
}

export function ImprovedPerioChart({
  patientId,
  patientName,
  readOnly = false,
  onSave
}: ImprovedPerioChartProps) {
  const [fullScreen, setFullScreen] = useState(false);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [selectedMeasurementType, setSelectedMeasurementType] = useState<'probingDepth' | 'gingivalMargin' | 'mobility' | 'furcation'>('probingDepth');
  const [selectedSurface, setSelectedSurface] = useState<'buccal' | 'lingual' | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<'mesial' | 'mid' | 'distal' | null>(null);
  
  // State to hold all measurements for all teeth
  const [measurements, setMeasurements] = useState<Record<number, PerioMeasurements>>({});

  // Initialize measurements for all teeth (1-32)
  useEffect(() => {
    const initialMeasurements: Record<number, PerioMeasurements> = {};
    
    // Upper teeth (1-16) and lower teeth (17-32)
    for (let i = 1; i <= 32; i++) {
      initialMeasurements[i] = {
        mobility: null,
        implant: false,
        furcation: null,
        bleedingOnProbing: false,
        plaque: false,
        gingivalMargin: null,
        probingDepth: {
          buccal: { mesial: null, mid: null, distal: null },
          lingual: { mesial: null, mid: null, distal: null },
        }
      };
    }
    
    // Pre-populate with sample data from the reference image
    // This is just for demonstration, you would normally load real data from an API
    if (!readOnly) {
      // Sample upper teeth values
      [11, 12, 13, 14, 15, 21, 22, 23, 24, 25, 26].forEach(tooth => {
        initialMeasurements[tooth].probingDepth.buccal = { mesial: 3, mid: 2, distal: 3 };
        initialMeasurements[tooth].gingivalMargin = 0;
      });
      
      // Sample mobility values
      [16, 15, 14, 13, 12, 11].forEach(tooth => {
        initialMeasurements[tooth].mobility = 0;
      });
      
      // Sample bleeding values (from reference image)
      [15, 14, 13, 21, 24, 25, 26].forEach(tooth => {
        initialMeasurements[tooth].bleedingOnProbing = true;
      });
      
      // Sample plaque values
      [16, 15, 14, 13, 12, 21, 23, 26].forEach(tooth => {
        initialMeasurements[tooth].plaque = true;
      });
      
      // Sample furcation values
      initialMeasurements[16].furcation = 1;
      initialMeasurements[26].furcation = 1;
    }
    
    setMeasurements(initialMeasurements);
  }, [readOnly]);

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

  // Function to update probing depth value
  const updateProbingDepthValue = (value: number) => {
    if (selectedTooth === null || selectedSurface === null || selectedPosition === null) return;
    
    setMeasurements(prev => {
      const updatedMeasurements = { ...prev };
      updatedMeasurements[selectedTooth].probingDepth[selectedSurface][selectedPosition] = value;
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

  // Function to determine next tooth in sequence
  const getNextTooth = (currentTooth: number) => {
    // Upper arch (1-16) from left to right
    if (currentTooth >= 1 && currentTooth < 16) return currentTooth + 1;
    if (currentTooth === 16) return 17;
    // Lower arch (17-32) from right to left
    if (currentTooth >= 17 && currentTooth < 32) return currentTooth + 1;
    return null; // No next tooth after 32
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

  // Function to set gingival margin
  const setGingivalMargin = (tooth: number, value: number | null) => {
    setMeasurements(prev => {
      const updatedMeasurements = { ...prev };
      updatedMeasurements[tooth].gingivalMargin = value;
      return updatedMeasurements;
    });
  };

  // Function to save the chart
  const handleSave = () => {
    if (onSave) {
      onSave({
        patientId,
        measurements,
        timestamp: new Date().toISOString()
      });
    }
    toast({
      title: "Chart Saved",
      description: "Periodontal chart has been saved successfully.",
    });
  };

  // Helper function to get cell background based on pocket depth
  const getPocketDepthColor = (depth: number | null) => {
    if (depth === null) return 'bg-white';
    if (depth <= 3) return 'bg-green-100';
    if (depth <= 5) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  // Render teeth numbers for upper arch (1-16)
  const renderUpperTeethNumbers = () => {
    return Array.from({length: 16}, (_, i) => i + 1).map(tooth => (
      <div key={`upper-tooth-${tooth}`} className="text-center font-medium text-xs">
        {tooth}
      </div>
    ));
  };

  // Render teeth numbers for lower arch (17-32) from right to left
  const renderLowerTeethNumbers = () => {
    return Array.from({length: 16}, (_, i) => 32 - i).map(tooth => (
      <div key={`lower-tooth-${tooth}`} className="text-center font-medium text-xs">
        {tooth}
      </div>
    ));
  };

  // Render furcation values with circle symbols
  const renderFurcation = (tooth: number) => {
    const value = measurements[tooth]?.furcation;
    
    if (value === null) return null;
    
    // Return circle character with increasing fill based on grade (1, 2, 3)
    if (value === 1) return <span>○</span>; // Empty circle
    if (value === 2) return <span>◐</span>; // Half-filled circle
    if (value === 3) return <span>●</span>; // Filled circle
    
    return null;
  };

  // Create an array of upper teeth (1-16)
  const upperTeeth = Array.from({length: 16}, (_, i) => i + 1);
  
  // Create an array of lower teeth (17-32) in reverse order (right to left)
  const lowerTeeth = Array.from({length: 16}, (_, i) => 32 - i);

  return (
    <Card className={`w-full ${fullScreen ? 'fixed inset-0 z-50 overflow-auto bg-background' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between p-2 sm:p-4">
        <div>
          <CardTitle className="text-base sm:text-lg">Periodontal Chart</CardTitle>
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

      <CardContent className="p-2 sm:p-4 overflow-auto">
        <div className="space-y-4">
          {/* Measurement Type Selection */}
          {!readOnly && (
            <div className="flex flex-wrap gap-2 justify-start">
              <Button 
                size="sm" 
                variant={selectedMeasurementType === 'probingDepth' ? 'default' : 'outline'}
                onClick={() => setSelectedMeasurementType('probingDepth')}
              >
                Probing Depth
              </Button>
              <Button 
                size="sm" 
                variant={selectedMeasurementType === 'gingivalMargin' ? 'default' : 'outline'}
                onClick={() => setSelectedMeasurementType('gingivalMargin')}
              >
                Gingival Margin
              </Button>
              <Button 
                size="sm" 
                variant={selectedMeasurementType === 'mobility' ? 'default' : 'outline'}
                onClick={() => setSelectedMeasurementType('mobility')}
              >
                Mobility
              </Button>
              <Button 
                size="sm" 
                variant={selectedMeasurementType === 'furcation' ? 'default' : 'outline'}
                onClick={() => setSelectedMeasurementType('furcation')}
              >
                Furcation
              </Button>
            </div>
          )}

          {/* Value Selection Controls */}
          {selectedTooth !== null && !readOnly && (
            <div className="flex flex-wrap gap-2 items-center">
              <div className="text-xs font-medium">
                Tooth #{selectedTooth}, {selectedMeasurementType.charAt(0).toUpperCase() + selectedMeasurementType.slice(1)}:
              </div>
              <div className="flex gap-1">
                {selectedMeasurementType === 'probingDepth' && selectedSurface && selectedPosition && (
                  <>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(value => (
                      <Button 
                        key={value}
                        size="sm"
                        variant="outline"
                        className={`h-6 w-6 p-0 ${measurements[selectedTooth]?.probingDepth[selectedSurface][selectedPosition] === value ? 'bg-blue-100' : ''}`}
                        onClick={() => updateProbingDepthValue(value)}
                      >
                        {value}
                      </Button>
                    ))}
                  </>
                )}
                
                {selectedMeasurementType === 'gingivalMargin' && (
                  <>
                    {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map(value => (
                      <Button 
                        key={value}
                        size="sm"
                        variant="outline"
                        className={`h-6 w-6 p-0 ${measurements[selectedTooth]?.gingivalMargin === value ? 'bg-blue-100' : ''}`}
                        onClick={() => setGingivalMargin(selectedTooth, value)}
                      >
                        {value}
                      </Button>
                    ))}
                  </>
                )}
                
                {selectedMeasurementType === 'mobility' && (
                  <>
                    {[0, 1, 2, 3].map(value => (
                      <Button 
                        key={value}
                        size="sm"
                        variant="outline"
                        className={`h-6 w-6 p-0 ${measurements[selectedTooth]?.mobility === value ? 'bg-blue-100' : ''}`}
                        onClick={() => setMobility(selectedTooth, value)}
                      >
                        {value}
                      </Button>
                    ))}
                  </>
                )}
                
                {selectedMeasurementType === 'furcation' && (
                  <>
                    {[1, 2, 3].map(value => (
                      <Button 
                        key={value}
                        size="sm"
                        variant="outline"
                        className={`h-6 w-6 p-0 ${measurements[selectedTooth]?.furcation === value ? 'bg-blue-100' : ''}`}
                        onClick={() => setFurcation(selectedTooth, value)}
                      >
                        {value === 1 ? '○' : value === 2 ? '◐' : '●'}
                      </Button>
                    ))}
                    <Button 
                      size="sm"
                      variant="outline"
                      className="h-6 p-0 px-2"
                      onClick={() => setFurcation(selectedTooth, null)}
                    >
                      Clear
                    </Button>
                  </>
                )}
              </div>
              
              {/* Toggle controls for boolean properties */}
              <div className="flex gap-2 ml-4">
                <Button 
                  size="sm"
                  variant={measurements[selectedTooth]?.bleedingOnProbing ? 'default' : 'outline'}
                  className="h-7 text-xs"
                  onClick={() => toggleBleeding(selectedTooth)}
                >
                  {measurements[selectedTooth]?.bleedingOnProbing ? 'Bleeding ✓' : 'Bleeding'}
                </Button>
                
                <Button 
                  size="sm"
                  variant={measurements[selectedTooth]?.plaque ? 'default' : 'outline'}
                  className="h-7 text-xs"
                  onClick={() => togglePlaque(selectedTooth)}
                >
                  {measurements[selectedTooth]?.plaque ? 'Plaque ✓' : 'Plaque'}
                </Button>
                
                <Button 
                  size="sm"
                  variant={measurements[selectedTooth]?.implant ? 'default' : 'outline'}
                  className="h-7 text-xs"
                  onClick={() => toggleImplant(selectedTooth)}
                >
                  {measurements[selectedTooth]?.implant ? 'Implant ✓' : 'Implant'}
                </Button>
              </div>
            </div>
          )}

          {/* UPPER ARCH */}
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-medium mb-2">Upper Arch (1-16)</h3>
            
            {/* Measurement Grid - Structure matches reference image */}
            <div className="w-full relative overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="w-28 border p-1"></th>
                    {upperTeeth.map(tooth => (
                      <th key={`head-${tooth}`} className="border p-1 min-w-8 text-center">{tooth}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Mobility Row */}
                  <tr>
                    <td className="border p-1 font-medium">Mobility</td>
                    {upperTeeth.map(tooth => (
                      <td 
                        key={`mobility-${tooth}`} 
                        className={`border p-1 text-center cursor-pointer ${selectedTooth === tooth ? 'bg-blue-50' : ''}`}
                        onClick={() => {
                          setSelectedTooth(tooth);
                          setSelectedMeasurementType('mobility');
                        }}
                      >
                        {measurements[tooth]?.mobility !== null ? measurements[tooth].mobility : ''}
                      </td>
                    ))}
                  </tr>
                  
                  {/* Implant Row */}
                  <tr>
                    <td className="border p-1 font-medium">Implant</td>
                    {upperTeeth.map(tooth => (
                      <td 
                        key={`implant-${tooth}`} 
                        className={`border p-1 text-center cursor-pointer ${selectedTooth === tooth ? 'bg-blue-50' : ''}`}
                        onClick={() => {
                          setSelectedTooth(tooth);
                          toggleImplant(tooth);
                        }}
                      >
                        {measurements[tooth]?.implant ? '✓' : ''}
                      </td>
                    ))}
                  </tr>
                  
                  {/* Furcation Row */}
                  <tr>
                    <td className="border p-1 font-medium">Furcation</td>
                    {upperTeeth.map(tooth => (
                      <td 
                        key={`furcation-${tooth}`} 
                        className={`border p-1 text-center cursor-pointer ${selectedTooth === tooth ? 'bg-blue-50' : ''}`}
                        onClick={() => {
                          setSelectedTooth(tooth);
                          setSelectedMeasurementType('furcation');
                        }}
                      >
                        {renderFurcation(tooth)}
                      </td>
                    ))}
                  </tr>
                  
                  {/* Bleeding on Probing Row */}
                  <tr>
                    <td className="border p-1 font-medium">Bleeding on Probing</td>
                    {upperTeeth.map(tooth => (
                      <td 
                        key={`bleeding-${tooth}`} 
                        className={`border p-1 text-center cursor-pointer ${measurements[tooth]?.bleedingOnProbing ? 'bg-red-200' : ''} ${selectedTooth === tooth ? 'bg-blue-50' : ''}`}
                        onClick={() => {
                          setSelectedTooth(tooth);
                          toggleBleeding(tooth);
                        }}
                      >
                        {measurements[tooth]?.bleedingOnProbing ? '✓' : ''}
                      </td>
                    ))}
                  </tr>
                  
                  {/* Plaque Row */}
                  <tr>
                    <td className="border p-1 font-medium">Plaque</td>
                    {upperTeeth.map(tooth => (
                      <td 
                        key={`plaque-${tooth}`} 
                        className={`border p-1 text-center cursor-pointer ${measurements[tooth]?.plaque ? 'bg-blue-200' : ''} ${selectedTooth === tooth ? 'bg-blue-50' : ''}`}
                        onClick={() => {
                          setSelectedTooth(tooth);
                          togglePlaque(tooth);
                        }}
                      >
                        {measurements[tooth]?.plaque ? '✓' : ''}
                      </td>
                    ))}
                  </tr>
                  
                  {/* Gingival Margin Row */}
                  <tr>
                    <td className="border p-1 font-medium">Gingival Margin</td>
                    {upperTeeth.map(tooth => (
                      <td 
                        key={`gm-${tooth}`} 
                        className={`border p-1 text-center cursor-pointer ${selectedTooth === tooth ? 'bg-blue-50' : ''}`}
                        onClick={() => {
                          setSelectedTooth(tooth);
                          setSelectedMeasurementType('gingivalMargin');
                        }}
                      >
                        {measurements[tooth]?.gingivalMargin !== null ? measurements[tooth].gingivalMargin : ''}
                      </td>
                    ))}
                  </tr>
                  
                  {/* Probing Depth Row */}
                  <tr>
                    <td className="border p-1 font-medium">Probing Depth</td>
                    {upperTeeth.map(tooth => (
                      <td key={`pd-${tooth}`} className="border p-0 px-0.5">
                        <div className="grid grid-cols-3 gap-0.5">
                          <div 
                            className={`${getPocketDepthColor(measurements[tooth]?.probingDepth.buccal.distal)} p-1 text-center cursor-pointer ${selectedTooth === tooth && selectedSurface === 'buccal' && selectedPosition === 'distal' ? 'ring-2 ring-blue-400' : ''}`}
                            onClick={() => {
                              handlePositionClick(tooth, 'buccal', 'distal');
                              setSelectedMeasurementType('probingDepth');
                            }}
                          >
                            {measurements[tooth]?.probingDepth.buccal.distal}
                          </div>
                          <div 
                            className={`${getPocketDepthColor(measurements[tooth]?.probingDepth.buccal.mid)} p-1 text-center cursor-pointer ${selectedTooth === tooth && selectedSurface === 'buccal' && selectedPosition === 'mid' ? 'ring-2 ring-blue-400' : ''}`}
                            onClick={() => {
                              handlePositionClick(tooth, 'buccal', 'mid');
                              setSelectedMeasurementType('probingDepth');
                            }}
                          >
                            {measurements[tooth]?.probingDepth.buccal.mid}
                          </div>
                          <div 
                            className={`${getPocketDepthColor(measurements[tooth]?.probingDepth.buccal.mesial)} p-1 text-center cursor-pointer ${selectedTooth === tooth && selectedSurface === 'buccal' && selectedPosition === 'mesial' ? 'ring-2 ring-blue-400' : ''}`}
                            onClick={() => {
                              handlePositionClick(tooth, 'buccal', 'mesial');
                              setSelectedMeasurementType('probingDepth');
                            }}
                          >
                            {measurements[tooth]?.probingDepth.buccal.mesial}
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
              
              {/* Teeth Illustrations - Buccal View */}
              <div className="flex w-full mt-4 mb-4 justify-between">
                <div className="w-28 flex items-center justify-center text-sm font-medium">Buccal</div>
                <div className="flex-1 flex justify-between">
                  {upperTeeth.map(tooth => (
                    <div 
                      key={`tooth-buccal-${tooth}`} 
                      className={`flex justify-center ${selectedTooth === tooth ? 'bg-blue-50' : ''}`}
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
              </div>
              
              {/* Teeth Illustrations - Lingual View */}
              <div className="flex w-full mt-4 mb-4 justify-between">
                <div className="w-28 flex items-center justify-center text-sm font-medium">Palatal</div>
                <div className="flex-1 flex justify-between">
                  {upperTeeth.map(tooth => (
                    <div 
                      key={`tooth-lingual-${tooth}`} 
                      className={`flex justify-center ${selectedTooth === tooth ? 'bg-blue-50' : ''}`}
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
              </div>
              
              {/* Lingual Measurements */}
              <table className="w-full border-collapse text-xs mt-4">
                <tbody>
                  {/* Gingival Margin Row */}
                  <tr>
                    <td className="border p-1 font-medium">Gingival Margin</td>
                    {upperTeeth.map(tooth => (
                      <td 
                        key={`gm-lingual-${tooth}`} 
                        className={`border p-1 text-center cursor-pointer ${selectedTooth === tooth ? 'bg-blue-50' : ''}`}
                        onClick={() => {
                          setSelectedTooth(tooth);
                          setSelectedMeasurementType('gingivalMargin');
                        }}
                      >
                        {measurements[tooth]?.gingivalMargin !== null ? measurements[tooth].gingivalMargin : ''}
                      </td>
                    ))}
                  </tr>
                  
                  {/* Probing Depth Row - Lingual */}
                  <tr>
                    <td className="border p-1 font-medium">Probing Depth</td>
                    {upperTeeth.map(tooth => (
                      <td key={`pd-lingual-${tooth}`} className="border p-0 px-0.5">
                        <div className="grid grid-cols-3 gap-0.5">
                          <div 
                            className={`${getPocketDepthColor(measurements[tooth]?.probingDepth.lingual.mesial)} p-1 text-center cursor-pointer ${selectedTooth === tooth && selectedSurface === 'lingual' && selectedPosition === 'mesial' ? 'ring-2 ring-blue-400' : ''}`}
                            onClick={() => {
                              handlePositionClick(tooth, 'lingual', 'mesial');
                              setSelectedMeasurementType('probingDepth');
                            }}
                          >
                            {measurements[tooth]?.probingDepth.lingual.mesial}
                          </div>
                          <div 
                            className={`${getPocketDepthColor(measurements[tooth]?.probingDepth.lingual.mid)} p-1 text-center cursor-pointer ${selectedTooth === tooth && selectedSurface === 'lingual' && selectedPosition === 'mid' ? 'ring-2 ring-blue-400' : ''}`}
                            onClick={() => {
                              handlePositionClick(tooth, 'lingual', 'mid');
                              setSelectedMeasurementType('probingDepth');
                            }}
                          >
                            {measurements[tooth]?.probingDepth.lingual.mid}
                          </div>
                          <div 
                            className={`${getPocketDepthColor(measurements[tooth]?.probingDepth.lingual.distal)} p-1 text-center cursor-pointer ${selectedTooth === tooth && selectedSurface === 'lingual' && selectedPosition === 'distal' ? 'ring-2 ring-blue-400' : ''}`}
                            onClick={() => {
                              handlePositionClick(tooth, 'lingual', 'distal');
                              setSelectedMeasurementType('probingDepth');
                            }}
                          >
                            {measurements[tooth]?.probingDepth.lingual.distal}
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>
                  
                  {/* Plaque Row */}
                  <tr>
                    <td className="border p-1 font-medium">Plaque</td>
                    {upperTeeth.map(tooth => (
                      <td 
                        key={`plaque-lingual-${tooth}`} 
                        className={`border p-1 text-center cursor-pointer ${measurements[tooth]?.plaque ? 'bg-blue-200' : ''} ${selectedTooth === tooth ? 'bg-blue-50' : ''}`}
                        onClick={() => {
                          setSelectedTooth(tooth);
                          togglePlaque(tooth);
                        }}
                      >
                        {measurements[tooth]?.plaque ? '✓' : ''}
                      </td>
                    ))}
                  </tr>
                  
                  {/* Bleeding on Probing Row */}
                  <tr>
                    <td className="border p-1 font-medium">Bleeding on Probing</td>
                    {upperTeeth.map(tooth => (
                      <td 
                        key={`bleeding-lingual-${tooth}`} 
                        className={`border p-1 text-center cursor-pointer ${measurements[tooth]?.bleedingOnProbing ? 'bg-red-200' : ''} ${selectedTooth === tooth ? 'bg-blue-50' : ''}`}
                        onClick={() => {
                          setSelectedTooth(tooth);
                          toggleBleeding(tooth);
                        }}
                      >
                        {measurements[tooth]?.bleedingOnProbing ? '✓' : ''}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          {/* LOWER ARCH */}
          <div className="border rounded-lg p-4 mt-6">
            <h3 className="text-sm font-medium mb-2">Lower Arch (17-32)</h3>
            
            {/* Measurement Grid - Lower Arch */}
            <div className="w-full relative overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="w-28 border p-1"></th>
                    {lowerTeeth.map(tooth => (
                      <th key={`head-${tooth}`} className="border p-1 min-w-8 text-center">{tooth}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Mobility Row */}
                  <tr>
                    <td className="border p-1 font-medium">Mobility</td>
                    {lowerTeeth.map(tooth => (
                      <td 
                        key={`mobility-${tooth}`} 
                        className={`border p-1 text-center cursor-pointer ${selectedTooth === tooth ? 'bg-blue-50' : ''}`}
                        onClick={() => {
                          setSelectedTooth(tooth);
                          setSelectedMeasurementType('mobility');
                        }}
                      >
                        {measurements[tooth]?.mobility !== null ? measurements[tooth].mobility : ''}
                      </td>
                    ))}
                  </tr>
                  
                  {/* Implant Row */}
                  <tr>
                    <td className="border p-1 font-medium">Implant</td>
                    {lowerTeeth.map(tooth => (
                      <td 
                        key={`implant-${tooth}`} 
                        className={`border p-1 text-center cursor-pointer ${selectedTooth === tooth ? 'bg-blue-50' : ''}`}
                        onClick={() => {
                          setSelectedTooth(tooth);
                          toggleImplant(tooth);
                        }}
                      >
                        {measurements[tooth]?.implant ? '✓' : ''}
                      </td>
                    ))}
                  </tr>
                  
                  {/* Furcation Row */}
                  <tr>
                    <td className="border p-1 font-medium">Furcation</td>
                    {lowerTeeth.map(tooth => (
                      <td 
                        key={`furcation-${tooth}`} 
                        className={`border p-1 text-center cursor-pointer ${selectedTooth === tooth ? 'bg-blue-50' : ''}`}
                        onClick={() => {
                          setSelectedTooth(tooth);
                          setSelectedMeasurementType('furcation');
                        }}
                      >
                        {renderFurcation(tooth)}
                      </td>
                    ))}
                  </tr>
                  
                  {/* Bleeding on Probing Row */}
                  <tr>
                    <td className="border p-1 font-medium">Bleeding on Probing</td>
                    {lowerTeeth.map(tooth => (
                      <td 
                        key={`bleeding-${tooth}`} 
                        className={`border p-1 text-center cursor-pointer ${measurements[tooth]?.bleedingOnProbing ? 'bg-red-200' : ''} ${selectedTooth === tooth ? 'bg-blue-50' : ''}`}
                        onClick={() => {
                          setSelectedTooth(tooth);
                          toggleBleeding(tooth);
                        }}
                      >
                        {measurements[tooth]?.bleedingOnProbing ? '✓' : ''}
                      </td>
                    ))}
                  </tr>
                  
                  {/* Plaque Row */}
                  <tr>
                    <td className="border p-1 font-medium">Plaque</td>
                    {lowerTeeth.map(tooth => (
                      <td 
                        key={`plaque-${tooth}`} 
                        className={`border p-1 text-center cursor-pointer ${measurements[tooth]?.plaque ? 'bg-blue-200' : ''} ${selectedTooth === tooth ? 'bg-blue-50' : ''}`}
                        onClick={() => {
                          setSelectedTooth(tooth);
                          togglePlaque(tooth);
                        }}
                      >
                        {measurements[tooth]?.plaque ? '✓' : ''}
                      </td>
                    ))}
                  </tr>
                  
                  {/* Gingival Margin Row */}
                  <tr>
                    <td className="border p-1 font-medium">Gingival Margin</td>
                    {lowerTeeth.map(tooth => (
                      <td 
                        key={`gm-${tooth}`} 
                        className={`border p-1 text-center cursor-pointer ${selectedTooth === tooth ? 'bg-blue-50' : ''}`}
                        onClick={() => {
                          setSelectedTooth(tooth);
                          setSelectedMeasurementType('gingivalMargin');
                        }}
                      >
                        {measurements[tooth]?.gingivalMargin !== null ? measurements[tooth].gingivalMargin : ''}
                      </td>
                    ))}
                  </tr>
                  
                  {/* Probing Depth Row */}
                  <tr>
                    <td className="border p-1 font-medium">Probing Depth</td>
                    {lowerTeeth.map(tooth => (
                      <td key={`pd-${tooth}`} className="border p-0 px-0.5">
                        <div className="grid grid-cols-3 gap-0.5">
                          <div 
                            className={`${getPocketDepthColor(measurements[tooth]?.probingDepth.buccal.distal)} p-1 text-center cursor-pointer ${selectedTooth === tooth && selectedSurface === 'buccal' && selectedPosition === 'distal' ? 'ring-2 ring-blue-400' : ''}`}
                            onClick={() => {
                              handlePositionClick(tooth, 'buccal', 'distal');
                              setSelectedMeasurementType('probingDepth');
                            }}
                          >
                            {measurements[tooth]?.probingDepth.buccal.distal}
                          </div>
                          <div 
                            className={`${getPocketDepthColor(measurements[tooth]?.probingDepth.buccal.mid)} p-1 text-center cursor-pointer ${selectedTooth === tooth && selectedSurface === 'buccal' && selectedPosition === 'mid' ? 'ring-2 ring-blue-400' : ''}`}
                            onClick={() => {
                              handlePositionClick(tooth, 'buccal', 'mid');
                              setSelectedMeasurementType('probingDepth');
                            }}
                          >
                            {measurements[tooth]?.probingDepth.buccal.mid}
                          </div>
                          <div 
                            className={`${getPocketDepthColor(measurements[tooth]?.probingDepth.buccal.mesial)} p-1 text-center cursor-pointer ${selectedTooth === tooth && selectedSurface === 'buccal' && selectedPosition === 'mesial' ? 'ring-2 ring-blue-400' : ''}`}
                            onClick={() => {
                              handlePositionClick(tooth, 'buccal', 'mesial');
                              setSelectedMeasurementType('probingDepth');
                            }}
                          >
                            {measurements[tooth]?.probingDepth.buccal.mesial}
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
              
              {/* Teeth Illustrations - Buccal View (Lower) */}
              <div className="flex w-full mt-4 mb-4 justify-between">
                <div className="w-28 flex items-center justify-center text-sm font-medium">Buccal</div>
                <div className="flex-1 flex justify-between">
                  {lowerTeeth.map(tooth => (
                    <div 
                      key={`tooth-buccal-${tooth}`} 
                      className={`flex justify-center ${selectedTooth === tooth ? 'bg-blue-50' : ''}`}
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
              </div>
              
              {/* Teeth Illustrations - Lingual View (Lower) */}
              <div className="flex w-full mt-4 mb-4 justify-between">
                <div className="w-28 flex items-center justify-center text-sm font-medium">Lingual</div>
                <div className="flex-1 flex justify-between">
                  {lowerTeeth.map(tooth => (
                    <div 
                      key={`tooth-lingual-${tooth}`} 
                      className={`flex justify-center ${selectedTooth === tooth ? 'bg-blue-50' : ''}`}
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
              </div>
              
              {/* Lingual Measurements (Lower) */}
              <table className="w-full border-collapse text-xs mt-4">
                <tbody>
                  {/* Gingival Margin Row */}
                  <tr>
                    <td className="border p-1 font-medium">Gingival Margin</td>
                    {lowerTeeth.map(tooth => (
                      <td 
                        key={`gm-lingual-${tooth}`} 
                        className={`border p-1 text-center cursor-pointer ${selectedTooth === tooth ? 'bg-blue-50' : ''}`}
                        onClick={() => {
                          setSelectedTooth(tooth);
                          setSelectedMeasurementType('gingivalMargin');
                        }}
                      >
                        {measurements[tooth]?.gingivalMargin !== null ? measurements[tooth].gingivalMargin : ''}
                      </td>
                    ))}
                  </tr>
                  
                  {/* Probing Depth Row - Lingual */}
                  <tr>
                    <td className="border p-1 font-medium">Probing Depth</td>
                    {lowerTeeth.map(tooth => (
                      <td key={`pd-lingual-${tooth}`} className="border p-0 px-0.5">
                        <div className="grid grid-cols-3 gap-0.5">
                          <div 
                            className={`${getPocketDepthColor(measurements[tooth]?.probingDepth.lingual.mesial)} p-1 text-center cursor-pointer ${selectedTooth === tooth && selectedSurface === 'lingual' && selectedPosition === 'mesial' ? 'ring-2 ring-blue-400' : ''}`}
                            onClick={() => {
                              handlePositionClick(tooth, 'lingual', 'mesial');
                              setSelectedMeasurementType('probingDepth');
                            }}
                          >
                            {measurements[tooth]?.probingDepth.lingual.mesial}
                          </div>
                          <div 
                            className={`${getPocketDepthColor(measurements[tooth]?.probingDepth.lingual.mid)} p-1 text-center cursor-pointer ${selectedTooth === tooth && selectedSurface === 'lingual' && selectedPosition === 'mid' ? 'ring-2 ring-blue-400' : ''}`}
                            onClick={() => {
                              handlePositionClick(tooth, 'lingual', 'mid');
                              setSelectedMeasurementType('probingDepth');
                            }}
                          >
                            {measurements[tooth]?.probingDepth.lingual.mid}
                          </div>
                          <div 
                            className={`${getPocketDepthColor(measurements[tooth]?.probingDepth.lingual.distal)} p-1 text-center cursor-pointer ${selectedTooth === tooth && selectedSurface === 'lingual' && selectedPosition === 'distal' ? 'ring-2 ring-blue-400' : ''}`}
                            onClick={() => {
                              handlePositionClick(tooth, 'lingual', 'distal');
                              setSelectedMeasurementType('probingDepth');
                            }}
                          >
                            {measurements[tooth]?.probingDepth.lingual.distal}
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>
                  
                  {/* Plaque Row */}
                  <tr>
                    <td className="border p-1 font-medium">Plaque</td>
                    {lowerTeeth.map(tooth => (
                      <td 
                        key={`plaque-lingual-${tooth}`} 
                        className={`border p-1 text-center cursor-pointer ${measurements[tooth]?.plaque ? 'bg-blue-200' : ''} ${selectedTooth === tooth ? 'bg-blue-50' : ''}`}
                        onClick={() => {
                          setSelectedTooth(tooth);
                          togglePlaque(tooth);
                        }}
                      >
                        {measurements[tooth]?.plaque ? '✓' : ''}
                      </td>
                    ))}
                  </tr>
                  
                  {/* Bleeding on Probing Row */}
                  <tr>
                    <td className="border p-1 font-medium">Bleeding on Probing</td>
                    {lowerTeeth.map(tooth => (
                      <td 
                        key={`bleeding-lingual-${tooth}`} 
                        className={`border p-1 text-center cursor-pointer ${measurements[tooth]?.bleedingOnProbing ? 'bg-red-200' : ''} ${selectedTooth === tooth ? 'bg-blue-50' : ''}`}
                        onClick={() => {
                          setSelectedTooth(tooth);
                          toggleBleeding(tooth);
                        }}
                      >
                        {measurements[tooth]?.bleedingOnProbing ? '✓' : ''}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Color Legend */}
          <div className="mt-6 border rounded-lg p-4">
            <h3 className="text-sm font-medium mb-2">Legend</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="mb-2">Probing Depth Colors:</div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-4 h-4 bg-green-100 border"></div>
                  <span>1-3mm (Healthy)</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-4 h-4 bg-yellow-100 border"></div>
                  <span>4-5mm (Moderate)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-100 border"></div>
                  <span>6mm+ (Severe)</span>
                </div>
              </div>
              
              <div>
                <div className="mb-2">Indicators:</div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-4 h-4 bg-red-200 border flex items-center justify-center">✓</div>
                  <span>Bleeding on Probing</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-4 h-4 bg-blue-200 border flex items-center justify-center">✓</div>
                  <span>Plaque</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Furcation: ○ (Grade 1), ◐ (Grade 2), ● (Grade 3)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}