import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Maximize2, Save, Tooth, ArrowLeft, ArrowRight } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ToothSvgBuccal, ToothSvgLingual } from '../dental/tooth-illustrations';

/**
 * Enhanced periodontal assessment chart with realistic tooth visuals and clinically accurate color coding
 */

// Define an interface for the pocket depth measuring points
interface PocketDepthMeasurement {
  mesial: number | null;
  mid: number | null;
  distal: number | null;
}

// Define comprehensive tooth measurements structure
interface ToothMeasurements {
  // General assessment
  mobility: 0 | 1 | 2 | 3 | null;
  bleeding: boolean;
  suppuration: boolean;
  plaque: boolean;
  calculus: boolean;
  
  // Pocket depth measurements
  buccal: PocketDepthMeasurement;
  lingual: PocketDepthMeasurement;
  
  // Additional periodontal assessments
  furcation: 0 | 1 | 2 | 3 | null;
  recession: PocketDepthMeasurement;
  attachmentLoss: PocketDepthMeasurement;
  
  // Tooth status (for visualization purposes)
  missing: boolean;
  implant: boolean;
}

// Component props definition
interface PerioChartProps {
  patientId: number;
  patientName: string;
  readOnly?: boolean;
  onSave?: (data: any) => void;
}

export function ClinicalPerioChart({
  patientId,
  patientName,
  readOnly = false,
  onSave
}: PerioChartProps) {
  // UI state management
  const [fullScreen, setFullScreen] = useState(false);
  const [activeTab, setActiveTab] = useState('probingDepth');
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<'mesial' | 'mid' | 'distal' | null>(null);
  const [selectedSurface, setSelectedSurface] = useState<'buccal' | 'lingual' | null>(null);
  const [selectedMeasurementType, setSelectedMeasurementType] = useState<'pocket' | 'recession' | 'attachment'>('pocket');
  const [measurements, setMeasurements] = useState<Record<number, ToothMeasurements>>({});
  
  // Exam type state
  const [examType, setExamType] = useState<'initial' | 'followup' | 'maintenance'>('initial');

  // Initialize measurements for all teeth (1-32)
  React.useEffect(() => {
    const initialMeasurements: Record<number, ToothMeasurements> = {};
    
    // Upper and lower teeth (1-32)
    for (let i = 1; i <= 32; i++) {
      initialMeasurements[i] = {
        mobility: null,
        bleeding: false,
        suppuration: false,
        plaque: false,
        calculus: false,
        buccal: { mesial: null, mid: null, distal: null },
        lingual: { mesial: null, mid: null, distal: null },
        furcation: null,
        recession: { mesial: null, mid: null, distal: null },
        attachmentLoss: { mesial: null, mid: null, distal: null }
      };
    }
    
    setMeasurements(initialMeasurements);
  }, []);

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
  const updateMeasurementValue = (value: number) => {
    if (selectedTooth === null || selectedSurface === null || selectedPosition === null) return;
    
    setMeasurements(prev => {
      const updatedMeasurements = { ...prev };
      
      switch (selectedMeasurementType) {
        case 'pocket':
          updatedMeasurements[selectedTooth][selectedSurface][selectedPosition] = value;
          break;
        case 'recession':
          updatedMeasurements[selectedTooth].recession[selectedPosition] = value;
          break;
        case 'attachment':
          updatedMeasurements[selectedTooth].attachmentLoss[selectedPosition] = value;
          break;
      }
      
      return updatedMeasurements;
    });
    
    // Auto-advance to next position or tooth for better workflow
    if (selectedPosition === 'mesial') {
      setSelectedPosition('mid');
    } else if (selectedPosition === 'mid') {
      setSelectedPosition('distal');
    } else if (selectedPosition === 'distal') {
      // Logic to move to next tooth or site
      if (selectedSurface === 'buccal') {
        setSelectedSurface('lingual');
        setSelectedPosition('mesial');
      } else {
        // Move to next tooth
        const nextTooth = getNextTooth(selectedTooth);
        if (nextTooth) {
          setSelectedTooth(nextTooth);
          setSelectedSurface('buccal');
          setSelectedPosition('mesial');
        }
      }
    }
  };

  // Function to determine next tooth in sequence
  const getNextTooth = (currentTooth: number) => {
    // Upper arch (1-16) from left to right
    if (currentTooth < 16) return currentTooth + 1;
    if (currentTooth === 16) return 17;
    // Lower arch (17-32) from right to left
    if (currentTooth === 17) return 18;
    if (currentTooth < 32) return currentTooth + 1;
    return null; // No next tooth after 32
  };

  // Function to toggle bleeding
  const toggleBleeding = () => {
    if (selectedTooth === null) return;
    
    setMeasurements(prev => {
      const updatedMeasurements = { ...prev };
      updatedMeasurements[selectedTooth].bleeding = !updatedMeasurements[selectedTooth].bleeding;
      return updatedMeasurements;
    });
  };

  // Function to set mobility
  const setMobility = (value: 0 | 1 | 2 | 3) => {
    if (selectedTooth === null) return;
    
    setMeasurements(prev => {
      const updatedMeasurements = { ...prev };
      updatedMeasurements[selectedTooth].mobility = value;
      return updatedMeasurements;
    });
  };

  // Function to save the chart
  const handleSave = () => {
    if (onSave) {
      onSave({
        patientId,
        measurements,
        timestamp: new Date().toISOString(),
        chartType: pretreatment ? 'pretreatment' : (reevaluation ? 'reevaluation' : 'recall')
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

  return (
    <Card className={`w-full ${fullScreen ? 'fixed inset-0 z-50 overflow-auto' : ''}`}>
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

      <CardContent className="p-2 sm:p-4">
        <div className="space-y-4">
          {/* Chart Type Selection */}
          <div className="flex gap-4 justify-start">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={pretreatment}
                onChange={() => {
                  setPretreatment(true);
                  setReevaluation(false);
                  setRecall(false);
                }}
                className="form-checkbox h-3 w-3"
              />
              <span className="text-xs">Pre-treatment</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={reevaluation}
                onChange={() => {
                  setPretreatment(false);
                  setReevaluation(true);
                  setRecall(false);
                }}
                className="form-checkbox h-3 w-3"
              />
              <span className="text-xs">Re-evaluation</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={recall}
                onChange={() => {
                  setPretreatment(false);
                  setReevaluation(false);
                  setRecall(true);
                }}
                className="form-checkbox h-3 w-3"
              />
              <span className="text-xs">Recall maintenance</span>
            </label>
          </div>

          {/* Measurement Type Selection */}
          {!readOnly && (
            <div className="flex flex-wrap gap-2 justify-start">
              <Button 
                size="sm" 
                variant={selectedMeasurementType === 'pocket' ? 'default' : 'outline'}
                onClick={() => setSelectedMeasurementType('pocket')}
              >
                Pocket Depth
              </Button>
              <Button 
                size="sm" 
                variant={selectedMeasurementType === 'recession' ? 'default' : 'outline'}
                onClick={() => setSelectedMeasurementType('recession')}
              >
                Recession
              </Button>
              <Button 
                size="sm" 
                variant={selectedMeasurementType === 'attachment' ? 'default' : 'outline'}
                onClick={() => setSelectedMeasurementType('attachment')}
              >
                Attachment Loss
              </Button>
            </div>
          )}

          {/* Selected Position Actions */}
          {selectedTooth !== null && selectedSurface !== null && selectedPosition !== null && !readOnly && (
            <div className="flex flex-wrap gap-2 items-center">
              <div className="text-xs font-medium">
                Tooth #{selectedTooth}, {selectedSurface.charAt(0).toUpperCase() + selectedSurface.slice(1)} {selectedPosition.charAt(0).toUpperCase() + selectedPosition.slice(1)} {selectedMeasurementType.charAt(0).toUpperCase() + selectedMeasurementType.slice(1)}:
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(value => (
                  <Button 
                    key={value}
                    size="sm"
                    variant="outline"
                    className="h-6 w-6 p-0"
                    onClick={() => updateMeasurementValue(value)}
                  >
                    {value}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Upper Arch */}
          <div className="relative border rounded-md p-2">
            <div className="flex justify-between mb-1 border-b pb-1">
              <span className="text-xs font-medium">Upper Arch (1-16)</span>
            </div>

            {/* Diagnosis Rows */}
            <div className="grid grid-cols-[8rem_repeat(16,minmax(2rem,1fr))] gap-px text-xs">
              <div className="font-medium">CAL, BOP</div>
              {Array.from({length: 16}, (_, i) => i + 1).map(tooth => (
                <div key={`cal-${tooth}`} className="h-6 flex justify-center items-center border">
                  {measurements[tooth]?.bleeding ? '✓' : ''}
                </div>
              ))}
              
              <div className="font-medium">PD, PL, Calc</div>
              {Array.from({length: 16}, (_, i) => i + 1).map(tooth => (
                <div key={`pd-${tooth}`} className="h-6 flex justify-center items-center border">
                  {measurements[tooth]?.plaque || measurements[tooth]?.calculus ? '✓' : ''}
                </div>
              ))}
              
              <div className="font-medium">CEJ-GM</div>
              {Array.from({length: 16}, (_, i) => i + 1).map(tooth => (
                <div key={`cej-${tooth}`} className="h-6 flex justify-center items-center border"></div>
              ))}
            </div>

            {/* Tooth Numbers */}
            <div className="grid grid-cols-[8rem_repeat(16,minmax(2rem,1fr))] gap-px text-xs mt-2">
              <div></div>
              {Array.from({length: 16}, (_, i) => i + 1).map(tooth => (
                <div key={`tooth-num-${tooth}`} className="text-center font-medium">
                  {tooth}
                </div>
              ))}
            </div>

            {/* Facial View */}
            <div className="grid grid-cols-[8rem_repeat(16,minmax(2rem,1fr))] gap-px text-xs mt-1">
              <div className="font-medium flex items-center">FACIAL</div>
              {Array.from({length: 16}, (_, i) => i + 1).map(tooth => (
                <div 
                  key={`facial-${tooth}`} 
                  className={`flex justify-center ${selectedTooth === tooth ? 'bg-green-50' : ''}`}
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

            {/* Mobility */}
            <div className="grid grid-cols-[8rem_repeat(16,minmax(2rem,1fr))] gap-px text-xs mt-1">
              <div className="font-medium flex items-center">Mobility</div>
              {Array.from({length: 16}, (_, i) => i + 1).map(tooth => (
                <div 
                  key={`mobility-${tooth}`} 
                  className="flex justify-center items-center h-8 border"
                >
                  {measurements[tooth]?.mobility !== null ? measurements[tooth]?.mobility : ''}
                </div>
              ))}
            </div>

            {/* Facial Pocket Depths */}
            <div className="grid grid-cols-[8rem_repeat(16,minmax(2rem,1fr))] gap-px text-xs">
              <div></div>
              {Array.from({length: 16}, (_, i) => i + 1).map(tooth => (
                <div key={`facial-pd-${tooth}`} className="grid grid-cols-3 gap-px">
                  <div 
                    className={`h-6 flex justify-center items-center border ${getPocketDepthColor(measurements[tooth]?.buccal.distal)} ${selectedTooth === tooth && selectedSurface === 'buccal' && selectedPosition === 'distal' ? 'bg-green-200' : ''}`}
                    onClick={() => !readOnly && handlePositionClick(tooth, 'buccal', 'distal')}
                  >
                    {measurements[tooth]?.buccal.distal}
                  </div>
                  <div 
                    className={`h-6 flex justify-center items-center border ${getPocketDepthColor(measurements[tooth]?.buccal.mid)} ${selectedTooth === tooth && selectedSurface === 'buccal' && selectedPosition === 'mid' ? 'bg-green-200' : ''}`}
                    onClick={() => !readOnly && handlePositionClick(tooth, 'buccal', 'mid')}
                  >
                    {measurements[tooth]?.buccal.mid}
                  </div>
                  <div 
                    className={`h-6 flex justify-center items-center border ${getPocketDepthColor(measurements[tooth]?.buccal.mesial)} ${selectedTooth === tooth && selectedSurface === 'buccal' && selectedPosition === 'mesial' ? 'bg-green-200' : ''}`}
                    onClick={() => !readOnly && handlePositionClick(tooth, 'buccal', 'mesial')}
                  >
                    {measurements[tooth]?.buccal.mesial}
                  </div>
                </div>
              ))}
            </div>

            {/* Lingual View */}
            <div className="grid grid-cols-[8rem_repeat(16,minmax(2rem,1fr))] gap-px text-xs mt-4">
              <div className="font-medium flex items-center">LINGUAL</div>
              {Array.from({length: 16}, (_, i) => i + 1).map(tooth => (
                <div 
                  key={`lingual-${tooth}`} 
                  className={`flex justify-center ${selectedTooth === tooth ? 'bg-green-50' : ''}`}
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

            {/* Lingual Pocket Depths */}
            <div className="grid grid-cols-[8rem_repeat(16,minmax(2rem,1fr))] gap-px text-xs">
              <div></div>
              {Array.from({length: 16}, (_, i) => i + 1).map(tooth => (
                <div key={`lingual-pd-${tooth}`} className="grid grid-cols-3 gap-px">
                  <div 
                    className={`h-6 flex justify-center items-center border ${getPocketDepthColor(measurements[tooth]?.lingual.mesial)} ${selectedTooth === tooth && selectedSurface === 'lingual' && selectedPosition === 'mesial' ? 'bg-green-200' : ''}`}
                    onClick={() => !readOnly && handlePositionClick(tooth, 'lingual', 'mesial')}
                  >
                    {measurements[tooth]?.lingual.mesial}
                  </div>
                  <div 
                    className={`h-6 flex justify-center items-center border ${getPocketDepthColor(measurements[tooth]?.lingual.mid)} ${selectedTooth === tooth && selectedSurface === 'lingual' && selectedPosition === 'mid' ? 'bg-green-200' : ''}`}
                    onClick={() => !readOnly && handlePositionClick(tooth, 'lingual', 'mid')}
                  >
                    {measurements[tooth]?.lingual.mid}
                  </div>
                  <div 
                    className={`h-6 flex justify-center items-center border ${getPocketDepthColor(measurements[tooth]?.lingual.distal)} ${selectedTooth === tooth && selectedSurface === 'lingual' && selectedPosition === 'distal' ? 'bg-green-200' : ''}`}
                    onClick={() => !readOnly && handlePositionClick(tooth, 'lingual', 'distal')}
                  >
                    {measurements[tooth]?.lingual.distal}
                  </div>
                </div>
              ))}
            </div>

            {/* Diagnosis Rows Continued */}
            <div className="grid grid-cols-[8rem_repeat(16,minmax(2rem,1fr))] gap-px text-xs mt-2">
              <div className="font-medium">CEJ-GM</div>
              {Array.from({length: 16}, (_, i) => i + 1).map(tooth => (
                <div key={`cej-b-${tooth}`} className="h-6 flex justify-center items-center border"></div>
              ))}
              
              <div className="font-medium">PD, PL, Calc</div>
              {Array.from({length: 16}, (_, i) => i + 1).map(tooth => (
                <div key={`pd-b-${tooth}`} className="h-6 flex justify-center items-center border"></div>
              ))}
              
              <div className="font-medium">CAL, BOP</div>
              {Array.from({length: 16}, (_, i) => i + 1).map(tooth => (
                <div key={`cal-b-${tooth}`} className="h-6 flex justify-center items-center border"></div>
              ))}
            </div>
          </div>

          {/* Lower Arch */}
          <div className="relative border rounded-md p-2">
            <div className="flex justify-between mb-1 border-b pb-1">
              <span className="text-xs font-medium">Lower Arch (17-32)</span>
            </div>

            {/* Diagnosis Rows */}
            <div className="grid grid-cols-[8rem_repeat(16,minmax(2rem,1fr))] gap-px text-xs">
              <div className="font-medium">CAL, BOP</div>
              {Array.from({length: 16}, (_, i) => 32 - i).map(tooth => (
                <div key={`cal-${tooth}`} className="h-6 flex justify-center items-center border">
                  {measurements[tooth]?.bleeding ? '✓' : ''}
                </div>
              ))}
              
              <div className="font-medium">PD, PL, Calc</div>
              {Array.from({length: 16}, (_, i) => 32 - i).map(tooth => (
                <div key={`pd-${tooth}`} className="h-6 flex justify-center items-center border">
                  {measurements[tooth]?.plaque || measurements[tooth]?.calculus ? '✓' : ''}
                </div>
              ))}
              
              <div className="font-medium">CEJ-GM</div>
              {Array.from({length: 16}, (_, i) => i + 17).map(tooth => (
                <div key={`cej-${tooth}`} className="h-6 flex justify-center items-center border"></div>
              ))}
            </div>

            {/* Tooth Numbers */}
            <div className="grid grid-cols-[8rem_repeat(16,minmax(2rem,1fr))] gap-px text-xs mt-2">
              <div></div>
              {Array.from({length: 16}, (_, i) => i + 17).map(tooth => (
                <div key={`tooth-num-${tooth}`} className="text-center font-medium">
                  {tooth}
                </div>
              ))}
            </div>

            {/* Facial View */}
            <div className="grid grid-cols-[8rem_repeat(16,minmax(2rem,1fr))] gap-px text-xs mt-1">
              <div className="font-medium flex items-center">FACIAL</div>
              {Array.from({length: 16}, (_, i) => i + 17).map(tooth => (
                <div 
                  key={`facial-${tooth}`} 
                  className={`flex justify-center ${selectedTooth === tooth ? 'bg-green-50' : ''}`}
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

            {/* Mobility */}
            <div className="grid grid-cols-[8rem_repeat(16,minmax(2rem,1fr))] gap-px text-xs mt-1">
              <div className="font-medium flex items-center">Mobility</div>
              {Array.from({length: 16}, (_, i) => i + 17).map(tooth => (
                <div 
                  key={`mobility-${tooth}`} 
                  className="flex justify-center items-center h-8 border"
                >
                  {measurements[tooth]?.mobility !== null ? measurements[tooth]?.mobility : ''}
                </div>
              ))}
            </div>

            {/* Facial Pocket Depths */}
            <div className="grid grid-cols-[8rem_repeat(16,minmax(2rem,1fr))] gap-px text-xs">
              <div></div>
              {Array.from({length: 16}, (_, i) => i + 17).map(tooth => (
                <div key={`facial-pd-${tooth}`} className="grid grid-cols-3 gap-px">
                  <div 
                    className={`h-6 flex justify-center items-center border ${getPocketDepthColor(measurements[tooth]?.buccal.distal)} ${selectedTooth === tooth && selectedSurface === 'buccal' && selectedPosition === 'distal' ? 'bg-green-200' : ''}`}
                    onClick={() => !readOnly && handlePositionClick(tooth, 'buccal', 'distal')}
                  >
                    {measurements[tooth]?.buccal.distal}
                  </div>
                  <div 
                    className={`h-6 flex justify-center items-center border ${getPocketDepthColor(measurements[tooth]?.buccal.mid)} ${selectedTooth === tooth && selectedSurface === 'buccal' && selectedPosition === 'mid' ? 'bg-green-200' : ''}`}
                    onClick={() => !readOnly && handlePositionClick(tooth, 'buccal', 'mid')}
                  >
                    {measurements[tooth]?.buccal.mid}
                  </div>
                  <div 
                    className={`h-6 flex justify-center items-center border ${getPocketDepthColor(measurements[tooth]?.buccal.mesial)} ${selectedTooth === tooth && selectedSurface === 'buccal' && selectedPosition === 'mesial' ? 'bg-green-200' : ''}`}
                    onClick={() => !readOnly && handlePositionClick(tooth, 'buccal', 'mesial')}
                  >
                    {measurements[tooth]?.buccal.mesial}
                  </div>
                </div>
              ))}
            </div>

            {/* Lingual View */}
            <div className="grid grid-cols-[8rem_repeat(16,minmax(2rem,1fr))] gap-px text-xs mt-4">
              <div className="font-medium flex items-center">LINGUAL</div>
              {Array.from({length: 16}, (_, i) => i + 17).map(tooth => (
                <div 
                  key={`lingual-${tooth}`} 
                  className={`flex justify-center ${selectedTooth === tooth ? 'bg-green-50' : ''}`}
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

            {/* Lingual Pocket Depths */}
            <div className="grid grid-cols-[8rem_repeat(16,minmax(2rem,1fr))] gap-px text-xs">
              <div></div>
              {Array.from({length: 16}, (_, i) => i + 17).map(tooth => (
                <div key={`lingual-pd-${tooth}`} className="grid grid-cols-3 gap-px">
                  <div 
                    className={`h-6 flex justify-center items-center border ${getPocketDepthColor(measurements[tooth]?.lingual.mesial)} ${selectedTooth === tooth && selectedSurface === 'lingual' && selectedPosition === 'mesial' ? 'bg-green-200' : ''}`}
                    onClick={() => !readOnly && handlePositionClick(tooth, 'lingual', 'mesial')}
                  >
                    {measurements[tooth]?.lingual.mesial}
                  </div>
                  <div 
                    className={`h-6 flex justify-center items-center border ${getPocketDepthColor(measurements[tooth]?.lingual.mid)} ${selectedTooth === tooth && selectedSurface === 'lingual' && selectedPosition === 'mid' ? 'bg-green-200' : ''}`}
                    onClick={() => !readOnly && handlePositionClick(tooth, 'lingual', 'mid')}
                  >
                    {measurements[tooth]?.lingual.mid}
                  </div>
                  <div 
                    className={`h-6 flex justify-center items-center border ${getPocketDepthColor(measurements[tooth]?.lingual.distal)} ${selectedTooth === tooth && selectedSurface === 'lingual' && selectedPosition === 'distal' ? 'bg-green-200' : ''}`}
                    onClick={() => !readOnly && handlePositionClick(tooth, 'lingual', 'distal')}
                  >
                    {measurements[tooth]?.lingual.distal}
                  </div>
                </div>
              ))}
            </div>

            {/* Diagnosis Rows Continued */}
            <div className="grid grid-cols-[8rem_repeat(16,minmax(2rem,1fr))] gap-px text-xs mt-2">
              <div className="font-medium">CEJ-GM</div>
              {Array.from({length: 16}, (_, i) => i + 17).map(tooth => (
                <div key={`cej-b-${tooth}`} className="h-6 flex justify-center items-center border"></div>
              ))}
              
              <div className="font-medium">PD, PL, Calc</div>
              {Array.from({length: 16}, (_, i) => i + 17).map(tooth => (
                <div key={`pd-b-${tooth}`} className="h-6 flex justify-center items-center border"></div>
              ))}
              
              <div className="font-medium">CAL, BOP</div>
              {Array.from({length: 16}, (_, i) => i + 17).map(tooth => (
                <div key={`cal-b-${tooth}`} className="h-6 flex justify-center items-center border"></div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="border rounded-md p-2 mt-4">
            <div className="text-xs font-medium mb-2">Legend:</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div>GM- Gingival Margin</div>
              <div>CAL- Clinical Attachment Loss</div>
              <div>CEJ- Cementoenamel Junction</div>
              <div>PD- Probing Depth</div>
              <div>PL- Plaque, if present put '+'</div>
              <div>Calc- Calculus, if present put '+'</div>
              <div>BOP- Bleeding on probing, if present put '+'</div>
            </div>
            
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-green-100 border mr-1"></div>
                <span className="text-xs">1-3mm (Healthy)</span>
              </div>
              <div className="flex items-center">
                <div className="w-5 h-5 bg-yellow-100 border mr-1"></div>
                <span className="text-xs">4-5mm (Moderate)</span>
              </div>
              <div className="flex items-center">
                <div className="w-5 h-5 bg-red-100 border mr-1"></div>
                <span className="text-xs">6mm+ (Severe)</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}