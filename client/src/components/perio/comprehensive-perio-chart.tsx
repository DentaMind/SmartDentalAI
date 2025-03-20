import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Maximize2, Save, Mic, MicOff, ExternalLink } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { ToothSvgBuccal, ToothSvgLingual } from '../dental/tooth-illustrations';
import { apiRequest } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Speech recognition API type
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// Define the data structure for periodontal measurements
interface PerioMeasurements {
  mobility: number | null;
  implant: boolean;
  furcation: number | null;
  bleedingOnProbing: boolean;
  plaque: boolean;
  recession: {
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
  attachmentLevel: {
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
  masticatoryMucosa: number | null;
  attachedMucosa: number | null;
}

// Define the component props
interface ComprehensivePerioChartProps {
  patientId: number;
  patientName: string;
  readOnly?: boolean;
  onSave?: (data: any) => void;
  chartId?: number;
}

export function ComprehensivePerioChart({
  patientId,
  patientName,
  readOnly = false,
  onSave,
  chartId
}: ComprehensivePerioChartProps) {
  // UI state
  const [fullScreen, setFullScreen] = useState(false);
  const [activeTab, setActiveTab] = useState('maxillary');
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [selectedMeasurementType, setSelectedMeasurementType] = useState<'probingDepth' | 'recession' | 'attachmentLevel' | 'mobility' | 'furcation'>('probingDepth');
  const [selectedSurface, setSelectedSurface] = useState<'buccal' | 'lingual' | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<'mesial' | 'mid' | 'distal' | null>(null);
  const [examType, setExamType] = useState<'initial' | 'followup' | 'maintenance'>('initial');
  const [listening, setListening] = useState(false);
  const [aiAnalysisVisible, setAiAnalysisVisible] = useState(false);

  // Speech recognition
  const recognitionRef = useRef<any>(null);
  
  // Measurements data
  const [measurements, setMeasurements] = useState<Record<number, PerioMeasurements>>({});

  // Define a query client for cache invalidation
  const queryClient = useQueryClient();

  // Fetch existing chart data if chartId is provided
  const { data: chartData, isLoading: isLoadingChart } = useQuery({
    queryKey: ['/api/periodontal-charts', chartId],
    queryFn: async () => {
      if (!chartId) return null;
      const response = await apiRequest(`/api/periodontal-charts/${chartId}`);
      return response;
    },
    enabled: !!chartId
  });

  // Set up speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript.trim();
        processVoiceCommand(transcript);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        toast({
          title: 'Voice Recognition Error',
          description: `Error: ${event.error}. Please try again.`,
          variant: 'destructive'
        });
        setListening(false);
      };
      
      recognitionRef.current.onend = () => {
        if (listening) {
          recognitionRef.current.start();
        }
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Process voice commands for periodontal charting
  const processVoiceCommand = (transcript: string) => {
    console.log('Transcript:', transcript);
    
    // Extract numbers from the transcript
    const numbers = transcript.match(/\\d+/g);
    if (!numbers || !selectedTooth || !selectedSurface) return;
    
    // Simple mapping for single number (typically used for pocket depths)
    const value = parseInt(numbers[0], 10);
    if (!isNaN(value) && value >= 0 && value <= 10) {
      if (selectedMeasurementType === 'probingDepth') {
        updateMeasurementValue(selectedMeasurementType, value);
      } else if (selectedMeasurementType === 'recession') {
        updateMeasurementValue(selectedMeasurementType, value);
      }
    }
  };

  // Toggle speech recognition
  const toggleSpeechRecognition = () => {
    if (listening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setListening(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setListening(true);
        } catch (error) {
          console.error('Speech recognition error:', error);
          toast({
            title: 'Voice Recognition Error',
            description: 'Could not start voice recognition. Please try again.',
            variant: 'destructive'
          });
        }
      } else {
        toast({
          title: 'Voice Recognition Not Available',
          description: 'Your browser does not support voice recognition.',
          variant: 'destructive'
        });
      }
    }
  };

  // Initialize measurements for all teeth using FDI notation system
  useEffect(() => {
    if (chartData) {
      // If we have existing chart data, use it
      setMeasurements(chartData.measurements || {});
      setExamType(chartData.examType || 'initial');
    } else {
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
    }
  }, [chartData]);

  // Helper function to create an empty measurement object
  const createEmptyMeasurement = (): PerioMeasurements => ({
    mobility: null,
    implant: false,
    furcation: null,
    bleedingOnProbing: false,
    plaque: false,
    recession: {
      buccal: { mesial: null, mid: null, distal: null },
      lingual: { mesial: null, mid: null, distal: null },
    },
    probingDepth: {
      buccal: { mesial: null, mid: null, distal: null },
      lingual: { mesial: null, mid: null, distal: null },
    },
    attachmentLevel: {
      buccal: { mesial: null, mid: null, distal: null },
      lingual: { mesial: null, mid: null, distal: null },
    },
    masticatoryMucosa: null,
    attachedMucosa: null
  });

  // Function to handle tooth click
  const handleToothClick = (toothNumber: number) => {
    setSelectedTooth(toothNumber);
    setSelectedPosition(null);
    setSelectedSurface(null);
  };

  // Function to handle surface+position click (mesial, mid, distal on buccal or lingual)
  const handlePositionClick = (
    tooth: number, 
    surface: 'buccal' | 'lingual', 
    position: 'mesial' | 'mid' | 'distal'
  ) => {
    setSelectedTooth(tooth);
    setSelectedSurface(surface);
    setSelectedPosition(position);
  };

  // Calculate clinical attachment level
  const calculateAttachmentLevel = (tooth: number, surface: 'buccal' | 'lingual', position: 'mesial' | 'mid' | 'distal') => {
    const pdValue = measurements[tooth]?.probingDepth[surface][position];
    const recValue = measurements[tooth]?.recession[surface][position];
    
    if (pdValue !== null && recValue !== null) {
      // Calculate CAL as probing depth + recession (recession is positive if gingival margin 
      // is apical to CEJ, negative if coronal to CEJ)
      return pdValue + recValue;
    }
    return null;
  };

  // Function to update measurement value
  const updateMeasurementValue = (type: 'probingDepth' | 'recession' | 'attachmentLevel' | 'mobility' | 'furcation', value: number) => {
    if (selectedTooth === null) return;
    
    setMeasurements(prev => {
      const updatedMeasurements = { ...prev };
      
      if (type === 'probingDepth' && selectedSurface && selectedPosition) {
        updatedMeasurements[selectedTooth].probingDepth[selectedSurface][selectedPosition] = value;
        
        // Auto-calculate attachment level if recession value exists
        const recValue = updatedMeasurements[selectedTooth].recession[selectedSurface][selectedPosition];
        if (recValue !== null) {
          updatedMeasurements[selectedTooth].attachmentLevel[selectedSurface][selectedPosition] = value + recValue;
        }
      } 
      else if (type === 'recession' && selectedSurface && selectedPosition) {
        updatedMeasurements[selectedTooth].recession[selectedSurface][selectedPosition] = value;
        
        // Auto-calculate attachment level if probing depth value exists
        const pdValue = updatedMeasurements[selectedTooth].probingDepth[selectedSurface][selectedPosition];
        if (pdValue !== null) {
          updatedMeasurements[selectedTooth].attachmentLevel[selectedSurface][selectedPosition] = pdValue + value;
        }
      }
      else if (type === 'mobility') {
        updatedMeasurements[selectedTooth].mobility = value;
      }
      else if (type === 'furcation') {
        updatedMeasurements[selectedTooth].furcation = value;
      }
      
      return updatedMeasurements;
    });
    
    // Auto-advance to next position for better workflow
    if (selectedPosition === 'distal' && selectedSurface) {
      setSelectedPosition('mid');
    } else if (selectedPosition === 'mid' && selectedSurface) {
      setSelectedPosition('mesial');
    } else if (selectedPosition === 'mesial' && selectedSurface) {
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

  // Function to update masticatory mucosa value
  const updateMasticatoryMucosa = (tooth: number, value: number) => {
    setMeasurements(prev => {
      const updatedMeasurements = { ...prev };
      updatedMeasurements[tooth].masticatoryMucosa = value;
      return updatedMeasurements;
    });
  };

  // Function to update attached mucosa value
  const updateAttachedMucosa = (tooth: number, value: number) => {
    setMeasurements(prev => {
      const updatedMeasurements = { ...prev };
      updatedMeasurements[tooth].attachedMucosa = value;
      return updatedMeasurements;
    });
  };

  // Function to save the chart
  const handleSave = async () => {
    try {
      const chartData = {
        patientId,
        measurements,
        examType,
        timestamp: new Date().toISOString()
      };
      
      if (chartId) {
        // Update existing chart
        await apiRequest(`/api/periodontal-charts/${chartId}`, {
          method: 'PATCH',
          data: chartData
        });
      } else {
        // Create new chart
        await apiRequest('/api/periodontal-charts', {
          method: 'POST',
          data: chartData
        });
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/periodontal-charts'] });
      
      toast({
        title: 'Chart Saved',
        description: 'Periodontal chart has been saved successfully.',
      });
      
      if (onSave) {
        onSave(chartData);
      }
    } catch (error) {
      console.error('Error saving chart:', error);
      toast({
        title: 'Error Saving Chart',
        description: 'There was an error saving the chart. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Helper function to get cell background based on pocket depth with clinical color standard
  const getPocketDepthColor = (depth: number | null) => {
    if (depth === null) return 'bg-white';
    if (depth <= 3) return 'bg-green-100'; // Healthy (≤3mm)
    if (depth <= 5) return 'bg-yellow-100'; // Mild inflammation (4-5mm)
    if (depth <= 7) return 'bg-orange-100'; // Moderate periodontitis (6-7mm)
    return 'bg-red-100'; // Severe periodontitis (>7mm)
  };

  // Helper function to get text color based on attachment loss with clinical color standard
  const getAttachmentLossColor = (loss: number | null) => {
    if (loss === null) return 'text-gray-500';
    if (loss <= 2) return 'text-green-600'; // Minimal loss
    if (loss <= 4) return 'text-yellow-600'; // Mild loss
    if (loss <= 6) return 'text-orange-600'; // Moderate loss
    return 'text-red-600'; // Severe loss
  };

  // Helper function to get color for recession values
  const getRecessionColor = (value: number | null) => {
    if (value === null) return 'text-gray-500';
    if (value <= 0) return 'text-blue-600'; // No recession or coronal
    if (value <= 2) return 'text-green-600'; // Mild recession
    if (value <= 4) return 'text-yellow-600'; // Moderate recession
    return 'text-red-600'; // Severe recession
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

  // Render maxillary teeth chart
  const renderMaxillaryChart = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-16 gap-1">
          {/* Teeth Numbers */}
          {upperTeeth.map(tooth => (
            <div key={`upper-tooth-${tooth}`} className="text-center font-medium text-xs">
              {tooth}
            </div>
          ))}
        </div>

        {/* Probing Depths - Buccal Side */}
        <div className="pt-2 border-t border-gray-200">
          <div className="text-sm font-medium text-red-500 mb-2">Buccal</div>
          
          {/* Probing Depths Table */}
          <div className="mb-2">
            <div className="text-xs font-medium text-gray-600 mb-1">Probing Depth</div>
            <div className="grid grid-cols-16 gap-1">
              {upperTeeth.map(tooth => (
                <div key={`upper-pd-buccal-${tooth}`} className="flex flex-col gap-1">
                  <div 
                    className={`h-6 border text-center cursor-pointer ${getPocketDepthColor(measurements[tooth]?.probingDepth.buccal.distal)}`}
                    onClick={() => handlePositionClick(tooth, 'buccal', 'distal')}
                  >
                    {measurements[tooth]?.probingDepth.buccal.distal || ''}
                  </div>
                  <div 
                    className={`h-6 border text-center cursor-pointer ${getPocketDepthColor(measurements[tooth]?.probingDepth.buccal.mid)}`}
                    onClick={() => handlePositionClick(tooth, 'buccal', 'mid')}
                  >
                    {measurements[tooth]?.probingDepth.buccal.mid || ''}
                  </div>
                  <div 
                    className={`h-6 border text-center cursor-pointer ${getPocketDepthColor(measurements[tooth]?.probingDepth.buccal.mesial)}`}
                    onClick={() => handlePositionClick(tooth, 'buccal', 'mesial')}
                  >
                    {measurements[tooth]?.probingDepth.buccal.mesial || ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Recession Table */}
          <div className="mb-2">
            <div className="text-xs font-medium text-gray-600 mb-1">Recession</div>
            <div className="grid grid-cols-16 gap-1">
              {upperTeeth.map(tooth => (
                <div key={`upper-rec-buccal-${tooth}`} className="flex flex-col gap-1">
                  <div 
                    className={`h-6 border text-center cursor-pointer ${getRecessionColor(measurements[tooth]?.recession.buccal.distal)}`}
                    onClick={() => {
                      setSelectedTooth(tooth);
                      setSelectedSurface('buccal');
                      setSelectedPosition('distal');
                      setSelectedMeasurementType('recession');
                    }}
                  >
                    {measurements[tooth]?.recession.buccal.distal !== null ? measurements[tooth]?.recession.buccal.distal : ''}
                  </div>
                  <div 
                    className={`h-6 border text-center cursor-pointer ${getRecessionColor(measurements[tooth]?.recession.buccal.mid)}`}
                    onClick={() => {
                      setSelectedTooth(tooth);
                      setSelectedSurface('buccal');
                      setSelectedPosition('mid');
                      setSelectedMeasurementType('recession');
                    }}
                  >
                    {measurements[tooth]?.recession.buccal.mid !== null ? measurements[tooth]?.recession.buccal.mid : ''}
                  </div>
                  <div 
                    className={`h-6 border text-center cursor-pointer ${getRecessionColor(measurements[tooth]?.recession.buccal.mesial)}`}
                    onClick={() => {
                      setSelectedTooth(tooth);
                      setSelectedSurface('buccal');
                      setSelectedPosition('mesial');
                      setSelectedMeasurementType('recession');
                    }}
                  >
                    {measurements[tooth]?.recession.buccal.mesial !== null ? measurements[tooth]?.recession.buccal.mesial : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Attachment Level Table (calculated) */}
          <div className="mb-4">
            <div className="text-xs font-medium text-gray-600 mb-1">Attachment Level</div>
            <div className="grid grid-cols-16 gap-1">
              {upperTeeth.map(tooth => (
                <div key={`upper-al-buccal-${tooth}`} className="flex flex-col gap-1">
                  <div 
                    className={`h-6 border text-center cursor-pointer ${getAttachmentLossColor(calculateAttachmentLevel(tooth, 'buccal', 'distal'))}`}
                  >
                    {calculateAttachmentLevel(tooth, 'buccal', 'distal') !== null ? calculateAttachmentLevel(tooth, 'buccal', 'distal') : ''}
                  </div>
                  <div 
                    className={`h-6 border text-center cursor-pointer ${getAttachmentLossColor(calculateAttachmentLevel(tooth, 'buccal', 'mid'))}`}
                  >
                    {calculateAttachmentLevel(tooth, 'buccal', 'mid') !== null ? calculateAttachmentLevel(tooth, 'buccal', 'mid') : ''}
                  </div>
                  <div 
                    className={`h-6 border text-center cursor-pointer ${getAttachmentLossColor(calculateAttachmentLevel(tooth, 'buccal', 'mesial'))}`}
                  >
                    {calculateAttachmentLevel(tooth, 'buccal', 'mesial') !== null ? calculateAttachmentLevel(tooth, 'buccal', 'mesial') : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Tooth Illustrations */}
          <div className="grid grid-cols-16 gap-1 mb-4">
            {upperTeeth.map(tooth => (
              <div 
                key={`upper-tooth-illustration-${tooth}`} 
                className={`cursor-pointer ${selectedTooth === tooth ? 'bg-blue-50 rounded' : ''}`}
                onClick={() => handleToothClick(tooth)}
              >
                <ToothSvgBuccal 
                  toothNumber={tooth} 
                  bleeding={measurements[tooth]?.bleedingOnProbing} 
                  plaque={measurements[tooth]?.plaque}
                  implant={measurements[tooth]?.implant}
                  isUpper={true}
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Probing Depths - Lingual Side */}
        <div className="pt-2 border-t border-gray-200">
          <div className="text-sm font-medium text-blue-500 mb-2">Lingual</div>
          
          {/* Tooth Illustrations */}
          <div className="grid grid-cols-16 gap-1 mb-4">
            {upperTeeth.map(tooth => (
              <div 
                key={`upper-tooth-lingual-${tooth}`} 
                className={`cursor-pointer ${selectedTooth === tooth ? 'bg-blue-50 rounded' : ''}`}
                onClick={() => handleToothClick(tooth)}
              >
                <ToothSvgLingual 
                  toothNumber={tooth} 
                  bleeding={measurements[tooth]?.bleedingOnProbing} 
                  plaque={measurements[tooth]?.plaque}
                  implant={measurements[tooth]?.implant}
                  isUpper={true}
                />
              </div>
            ))}
          </div>
          
          {/* Attachment Level Table (calculated) */}
          <div className="mb-2">
            <div className="text-xs font-medium text-gray-600 mb-1">Attachment Level</div>
            <div className="grid grid-cols-16 gap-1">
              {upperTeeth.map(tooth => (
                <div key={`upper-al-lingual-${tooth}`} className="flex flex-col gap-1">
                  <div 
                    className={`h-6 border text-center cursor-pointer ${getAttachmentLossColor(calculateAttachmentLevel(tooth, 'lingual', 'mesial'))}`}
                  >
                    {calculateAttachmentLevel(tooth, 'lingual', 'mesial') !== null ? calculateAttachmentLevel(tooth, 'lingual', 'mesial') : ''}
                  </div>
                  <div 
                    className={`h-6 border text-center cursor-pointer ${getAttachmentLossColor(calculateAttachmentLevel(tooth, 'lingual', 'mid'))}`}
                  >
                    {calculateAttachmentLevel(tooth, 'lingual', 'mid') !== null ? calculateAttachmentLevel(tooth, 'lingual', 'mid') : ''}
                  </div>
                  <div 
                    className={`h-6 border text-center cursor-pointer ${getAttachmentLossColor(calculateAttachmentLevel(tooth, 'lingual', 'distal'))}`}
                  >
                    {calculateAttachmentLevel(tooth, 'lingual', 'distal') !== null ? calculateAttachmentLevel(tooth, 'lingual', 'distal') : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Recession Table */}
          <div className="mb-2">
            <div className="text-xs font-medium text-gray-600 mb-1">Recession</div>
            <div className="grid grid-cols-16 gap-1">
              {upperTeeth.map(tooth => (
                <div key={`upper-rec-lingual-${tooth}`} className="flex flex-col gap-1">
                  <div 
                    className={`h-6 border text-center cursor-pointer ${getRecessionColor(measurements[tooth]?.recession.lingual.mesial)}`}
                    onClick={() => {
                      setSelectedTooth(tooth);
                      setSelectedSurface('lingual');
                      setSelectedPosition('mesial');
                      setSelectedMeasurementType('recession');
                    }}
                  >
                    {measurements[tooth]?.recession.lingual.mesial !== null ? measurements[tooth]?.recession.lingual.mesial : ''}
                  </div>
                  <div 
                    className={`h-6 border text-center cursor-pointer ${getRecessionColor(measurements[tooth]?.recession.lingual.mid)}`}
                    onClick={() => {
                      setSelectedTooth(tooth);
                      setSelectedSurface('lingual');
                      setSelectedPosition('mid');
                      setSelectedMeasurementType('recession');
                    }}
                  >
                    {measurements[tooth]?.recession.lingual.mid !== null ? measurements[tooth]?.recession.lingual.mid : ''}
                  </div>
                  <div 
                    className={`h-6 border text-center cursor-pointer ${getRecessionColor(measurements[tooth]?.recession.lingual.distal)}`}
                    onClick={() => {
                      setSelectedTooth(tooth);
                      setSelectedSurface('lingual');
                      setSelectedPosition('distal');
                      setSelectedMeasurementType('recession');
                    }}
                  >
                    {measurements[tooth]?.recession.lingual.distal !== null ? measurements[tooth]?.recession.lingual.distal : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Probing Depths Table */}
          <div className="mb-2">
            <div className="text-xs font-medium text-gray-600 mb-1">Probing Depth</div>
            <div className="grid grid-cols-16 gap-1">
              {upperTeeth.map(tooth => (
                <div key={`upper-pd-lingual-${tooth}`} className="flex flex-col gap-1">
                  <div 
                    className={`h-6 border text-center cursor-pointer ${getPocketDepthColor(measurements[tooth]?.probingDepth.lingual.mesial)}`}
                    onClick={() => handlePositionClick(tooth, 'lingual', 'mesial')}
                  >
                    {measurements[tooth]?.probingDepth.lingual.mesial || ''}
                  </div>
                  <div 
                    className={`h-6 border text-center cursor-pointer ${getPocketDepthColor(measurements[tooth]?.probingDepth.lingual.mid)}`}
                    onClick={() => handlePositionClick(tooth, 'lingual', 'mid')}
                  >
                    {measurements[tooth]?.probingDepth.lingual.mid || ''}
                  </div>
                  <div 
                    className={`h-6 border text-center cursor-pointer ${getPocketDepthColor(measurements[tooth]?.probingDepth.lingual.distal)}`}
                    onClick={() => handlePositionClick(tooth, 'lingual', 'distal')}
                  >
                    {measurements[tooth]?.probingDepth.lingual.distal || ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Additional measurements */}
        <div className="pt-2 border-t border-gray-200">
          <div className="grid grid-cols-16 gap-1">
            {upperTeeth.map(tooth => (
              <div key={`upper-tooth-additional-${tooth}`} className="text-center text-xs">
                <div className="mb-1">
                  <span className="font-medium">M:</span> {measurements[tooth]?.mobility || '-'}
                </div>
                <div>
                  <span className="font-medium">F:</span> {measurements[tooth]?.furcation || '-'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render mandibular teeth chart
  const renderMandibularChart = () => {
    return (
      <div className="space-y-6">
        {/* Additional measurements */}
        <div className="pt-2 border-gray-200">
          <div className="grid grid-cols-16 gap-1">
            {lowerTeeth.map(tooth => (
              <div key={`lower-tooth-additional-${tooth}`} className="text-center text-xs">
                <div className="mb-1">
                  <span className="font-medium">M:</span> {measurements[tooth]?.mobility || '-'}
                </div>
                <div>
                  <span className="font-medium">F:</span> {measurements[tooth]?.furcation || '-'}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Probing Depths - Buccal Side */}
        <div className="pt-2 border-t border-gray-200">
          <div className="text-sm font-medium text-red-500 mb-2">Buccal</div>
          
          {/* Probing Depths Table */}
          <div className="mb-2">
            <div className="text-xs font-medium text-gray-600 mb-1">Probing Depth</div>
            <div className="grid grid-cols-16 gap-1">
              {lowerTeeth.map(tooth => (
                <div key={`lower-pd-buccal-${tooth}`} className="flex flex-col gap-1">
                  <div 
                    className={`h-6 border text-center cursor-pointer ${getPocketDepthColor(measurements[tooth]?.probingDepth.buccal.distal)}`}
                    onClick={() => handlePositionClick(tooth, 'buccal', 'distal')}
                  >
                    {measurements[tooth]?.probingDepth.buccal.distal || ''}
                  </div>
                  <div 
                    className={`h-6 border text-center cursor-pointer ${getPocketDepthColor(measurements[tooth]?.probingDepth.buccal.mid)}`}
                    onClick={() => handlePositionClick(tooth, 'buccal', 'mid')}
                  >
                    {measurements[tooth]?.probingDepth.buccal.mid || ''}
                  </div>
                  <div 
                    className={`h-6 border text-center cursor-pointer ${getPocketDepthColor(measurements[tooth]?.probingDepth.buccal.mesial)}`}
                    onClick={() => handlePositionClick(tooth, 'buccal', 'mesial')}
                  >
                    {measurements[tooth]?.probingDepth.buccal.mesial || ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Recession Table */}
          <div className="mb-2">
            <div className="text-xs font-medium text-gray-600 mb-1">Recession</div>
            <div className="grid grid-cols-16 gap-1">
              {lowerTeeth.map(tooth => (
                <div key={`lower-rec-buccal-${tooth}`} className="flex flex-col gap-1">
                  <div 
                    className={`h-6 border text-center cursor-pointer ${getRecessionColor(measurements[tooth]?.recession.buccal.distal)}`}
                    onClick={() => {
                      setSelectedTooth(tooth);
                      setSelectedSurface('buccal');
                      setSelectedPosition('distal');
                      setSelectedMeasurementType('recession');
                    }}
                  >
                    {measurements[tooth]?.recession.buccal.distal !== null ? measurements[tooth]?.recession.buccal.distal : ''}
                  </div>
                  <div 
                    className={`h-6 border text-center cursor-pointer ${getRecessionColor(measurements[tooth]?.recession.buccal.mid)}`}
                    onClick={() => {
                      setSelectedTooth(tooth);
                      setSelectedSurface('buccal');
                      setSelectedPosition('mid');
                      setSelectedMeasurementType('recession');
                    }}
                  >
                    {measurements[tooth]?.recession.buccal.mid !== null ? measurements[tooth]?.recession.buccal.mid : ''}
                  </div>
                  <div 
                    className={`h-6 border text-center cursor-pointer ${getRecessionColor(measurements[tooth]?.recession.buccal.mesial)}`}
                    onClick={() => {
                      setSelectedTooth(tooth);
                      setSelectedSurface('buccal');
                      setSelectedPosition('mesial');
                      setSelectedMeasurementType('recession');
                    }}
                  >
                    {measurements[tooth]?.recession.buccal.mesial !== null ? measurements[tooth]?.recession.buccal.mesial : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Attachment Level Table (calculated) */}
          <div className="mb-4">
            <div className="text-xs font-medium text-gray-600 mb-1">Attachment Level</div>
            <div className="grid grid-cols-16 gap-1">
              {lowerTeeth.map(tooth => (
                <div key={`lower-al-buccal-${tooth}`} className="flex flex-col gap-1">
                  <div 
                    className={`h-6 border text-center cursor-pointer ${getAttachmentLossColor(calculateAttachmentLevel(tooth, 'buccal', 'distal'))}`}
                  >
                    {calculateAttachmentLevel(tooth, 'buccal', 'distal') !== null ? calculateAttachmentLevel(tooth, 'buccal', 'distal') : ''}
                  </div>
                  <div 
                    className={`h-6 border text-center cursor-pointer ${getAttachmentLossColor(calculateAttachmentLevel(tooth, 'buccal', 'mid'))}`}
                  >
                    {calculateAttachmentLevel(tooth, 'buccal', 'mid') !== null ? calculateAttachmentLevel(tooth, 'buccal', 'mid') : ''}
                  </div>
                  <div 
                    className={`h-6 border text-center cursor-pointer ${getAttachmentLossColor(calculateAttachmentLevel(tooth, 'buccal', 'mesial'))}`}
                  >
                    {calculateAttachmentLevel(tooth, 'buccal', 'mesial') !== null ? calculateAttachmentLevel(tooth, 'buccal', 'mesial') : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Tooth Illustrations */}
          <div className="grid grid-cols-16 gap-1 mb-4">
            {lowerTeeth.map(tooth => (
              <div 
                key={`lower-tooth-illustration-${tooth}`} 
                className={`cursor-pointer ${selectedTooth === tooth ? 'bg-blue-50 rounded' : ''}`}
                onClick={() => handleToothClick(tooth)}
              >
                <ToothSvgBuccal 
                  toothNumber={tooth} 
                  bleeding={measurements[tooth]?.bleedingOnProbing} 
                  plaque={measurements[tooth]?.plaque}
                  implant={measurements[tooth]?.implant}
                  isUpper={false}
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Probing Depths - Lingual Side */}
        <div className="pt-2 border-t border-gray-200">
          <div className="text-sm font-medium text-blue-500 mb-2">Lingual</div>
          
          {/* Tooth Illustrations */}
          <div className="grid grid-cols-16 gap-1 mb-4">
            {lowerTeeth.map(tooth => (
              <div 
                key={`lower-tooth-lingual-${tooth}`} 
                className={`cursor-pointer ${selectedTooth === tooth ? 'bg-blue-50 rounded' : ''}`}
                onClick={() => handleToothClick(tooth)}
              >
                <ToothSvgLingual 
                  toothNumber={tooth} 
                  bleeding={measurements[tooth]?.bleedingOnProbing} 
                  plaque={measurements[tooth]?.plaque}
                  implant={measurements[tooth]?.implant}
                  isUpper={false}
                />
              </div>
            ))}
          </div>
          
          {/* Attachment Level Table (calculated) */}
          <div className="mb-2">
            <div className="text-xs font-medium text-gray-600 mb-1">Attachment Level</div>
            <div className="grid grid-cols-16 gap-1">
              {lowerTeeth.map(tooth => (
                <div key={`lower-al-lingual-${tooth}`} className="flex flex-col gap-1">
                  <div 
                    className={`h-6 border text-center cursor-pointer ${getAttachmentLossColor(calculateAttachmentLevel(tooth, 'lingual', 'mesial'))}`}
                  >
                    {calculateAttachmentLevel(tooth, 'lingual', 'mesial') !== null ? calculateAttachmentLevel(tooth, 'lingual', 'mesial') : ''}
                  </div>
                  <div 
                    className={`h-6 border text-center cursor-pointer ${getAttachmentLossColor(calculateAttachmentLevel(tooth, 'lingual', 'mid'))}`}
                  >
                    {calculateAttachmentLevel(tooth, 'lingual', 'mid') !== null ? calculateAttachmentLevel(tooth, 'lingual', 'mid') : ''}
                  </div>
                  <div 
                    className={`h-6 border text-center cursor-pointer ${getAttachmentLossColor(calculateAttachmentLevel(tooth, 'lingual', 'distal'))}`}
                  >
                    {calculateAttachmentLevel(tooth, 'lingual', 'distal') !== null ? calculateAttachmentLevel(tooth, 'lingual', 'distal') : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Recession Table */}
          <div className="mb-2">
            <div className="text-xs font-medium text-gray-600 mb-1">Recession</div>
            <div className="grid grid-cols-16 gap-1">
              {lowerTeeth.map(tooth => (
                <div key={`lower-rec-lingual-${tooth}`} className="flex flex-col gap-1">
                  <div 
                    className={`h-6 border text-center cursor-pointer ${getRecessionColor(measurements[tooth]?.recession.lingual.mesial)}`}
                    onClick={() => {
                      setSelectedTooth(tooth);
                      setSelectedSurface('lingual');
                      setSelectedPosition('mesial');
                      setSelectedMeasurementType('recession');
                    }}
                  >
                    {measurements[tooth]?.recession.lingual.mesial !== null ? measurements[tooth]?.recession.lingual.mesial : ''}
                  </div>
                  <div 
                    className={`h-6 border text-center cursor-pointer ${getRecessionColor(measurements[tooth]?.recession.lingual.mid)}`}
                    onClick={() => {
                      setSelectedTooth(tooth);
                      setSelectedSurface('lingual');
                      setSelectedPosition('mid');
                      setSelectedMeasurementType('recession');
                    }}
                  >
                    {measurements[tooth]?.recession.lingual.mid !== null ? measurements[tooth]?.recession.lingual.mid : ''}
                  </div>
                  <div 
                    className={`h-6 border text-center cursor-pointer ${getRecessionColor(measurements[tooth]?.recession.lingual.distal)}`}
                    onClick={() => {
                      setSelectedTooth(tooth);
                      setSelectedSurface('lingual');
                      setSelectedPosition('distal');
                      setSelectedMeasurementType('recession');
                    }}
                  >
                    {measurements[tooth]?.recession.lingual.distal !== null ? measurements[tooth]?.recession.lingual.distal : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Probing Depths Table */}
          <div className="mb-2">
            <div className="text-xs font-medium text-gray-600 mb-1">Probing Depth</div>
            <div className="grid grid-cols-16 gap-1">
              {lowerTeeth.map(tooth => (
                <div key={`lower-pd-lingual-${tooth}`} className="flex flex-col gap-1">
                  <div 
                    className={`h-6 border text-center cursor-pointer ${getPocketDepthColor(measurements[tooth]?.probingDepth.lingual.mesial)}`}
                    onClick={() => handlePositionClick(tooth, 'lingual', 'mesial')}
                  >
                    {measurements[tooth]?.probingDepth.lingual.mesial || ''}
                  </div>
                  <div 
                    className={`h-6 border text-center cursor-pointer ${getPocketDepthColor(measurements[tooth]?.probingDepth.lingual.mid)}`}
                    onClick={() => handlePositionClick(tooth, 'lingual', 'mid')}
                  >
                    {measurements[tooth]?.probingDepth.lingual.mid || ''}
                  </div>
                  <div 
                    className={`h-6 border text-center cursor-pointer ${getPocketDepthColor(measurements[tooth]?.probingDepth.lingual.distal)}`}
                    onClick={() => handlePositionClick(tooth, 'lingual', 'distal')}
                  >
                    {measurements[tooth]?.probingDepth.lingual.distal || ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Teeth numbers */}
        <div className="grid grid-cols-16 gap-1">
          {lowerTeeth.map(tooth => (
            <div key={`lower-tooth-${tooth}`} className="text-center font-medium text-xs">
              {tooth}
            </div>
          ))}
        </div>
      </div>
    );
  };

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
          {!readOnly && (
            <Button
              variant={listening ? 'destructive' : 'outline'}
              size="icon"
              onClick={toggleSpeechRecognition}
              className="h-7 w-7 mr-1"
              title={listening ? 'Stop Voice Input' : 'Start Voice Input'}
            >
              {listening ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
            </Button>
          )}
          
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
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setAiAnalysisVisible(!aiAnalysisVisible)}
                  className="h-7 w-7"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Open X-Ray AI Analysis</p>
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
          <TabsList className="w-full mb-4 bg-gray-100 grid grid-cols-2">
            <TabsTrigger value="maxillary" className={`data-[state=active]:bg-white`}>
              Maxillary
            </TabsTrigger>
            <TabsTrigger value="mandibular" className={`data-[state=active]:bg-white`}>
              Mandibular
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Value Selection Controls */}
        {selectedTooth !== null && !readOnly && (
          <div className="flex flex-wrap gap-2 items-center bg-gray-50 p-3 mx-4 mb-4 rounded-md">
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
                      onClick={() => updateMeasurementValue('probingDepth', value)}
                    >
                      {value}
                    </Button>
                  ))}
                </>
              )}
              
              {selectedMeasurementType === 'recession' && selectedSurface && selectedPosition && (
                <>
                  {[-2, -1, 0, 1, 2, 3, 4, 5, 6, 7].map(value => (
                    <Button 
                      key={value}
                      size="sm"
                      variant="outline"
                      className={`h-6 w-6 p-0 ${measurements[selectedTooth]?.recession[selectedSurface][selectedPosition] === value ? 'bg-green-50 font-bold border-green-600' : ''}`}
                      onClick={() => updateMeasurementValue('recession', value)}
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
              <Button 
                size="sm"
                variant={measurements[selectedTooth]?.implant ? 'default' : 'outline'}
                onClick={() => toggleImplant(selectedTooth)}
              >
                Implant
              </Button>
            </div>
          </div>
        )}

        <TabsContent value="maxillary" className="p-2 sm:p-4 overflow-auto">
          {renderMaxillaryChart()}
        </TabsContent>

        <TabsContent value="mandibular" className="p-2 sm:p-4 overflow-auto">
          {renderMandibularChart()}
        </TabsContent>
      </Tabs>
      
      {/* Status indicators */}
      <div className="flex justify-between items-center px-4 py-2 bg-gray-50 border-t">
        <div className="flex items-center gap-2">
          <Badge variant={listening ? 'default' : 'outline'} className="h-5 text-xs">
            {listening ? 'Voice Active' : 'Voice Off'}
          </Badge>
          <Badge variant="outline" className="h-5 text-xs">
            Selected: {selectedMeasurementType}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground">
          {selectedTooth ? `Tooth #${selectedTooth} selected` : 'No tooth selected'}
        </div>
      </div>
    </Card>
  );
}