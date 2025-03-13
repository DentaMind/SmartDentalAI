import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Maximize2, Save, Mic } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ToothMeasurements {
  pocketDepth: {
    buccal: [number | null, number | null, number | null];
    lingual: [number | null, number | null, number | null];
  };
  bleeding: {
    buccal: [boolean, boolean, boolean];
    lingual: [boolean, boolean, boolean];
  };
  suppuration: {
    buccal: [boolean, boolean, boolean];
    lingual: [boolean, boolean, boolean];
  };
  mobility: number | null;
  furcation: {
    buccal: number | null;
    lingual: number | null;
  };
}

interface ClinicalPerioChartProps {
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
}: ClinicalPerioChartProps) {
  const [fullScreen, setFullScreen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentSurface, setCurrentSurface] = useState<'buccal' | 'lingual'>('buccal');
  const [currentArch, setCurrentArch] = useState<'upper' | 'lower'>('upper');
  const [measurements, setMeasurements] = useState<Record<number, ToothMeasurements>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement>>({});

  // Initialize measurements for all teeth
  useEffect(() => {
    const initialMeasurements: Record<number, ToothMeasurements> = {};
    // Initialize upper arch (1-16)
    for (let i = 1; i <= 16; i++) {
      initialMeasurements[i] = {
        pocketDepth: {
          buccal: [null, null, null],
          lingual: [null, null, null]
        },
        bleeding: {
          buccal: [false, false, false],
          lingual: [false, false, false]
        },
        suppuration: {
          buccal: [false, false, false],
          lingual: [false, false, false]
        },
        mobility: null,
        furcation: {
          buccal: null,
          lingual: null
        }
      };
    }
    // Initialize lower arch (17-32)
    for (let i = 17; i <= 32; i++) {
      initialMeasurements[i] = {
        pocketDepth: {
          buccal: [null, null, null],
          lingual: [null, null, null]
        },
        bleeding: {
          buccal: [false, false, false],
          lingual: [false, false, false]
        },
        suppuration: {
          buccal: [false, false, false],
          lingual: [false, false, false]
        },
        mobility: null,
        furcation: {
          buccal: null,
          lingual: null
        }
      };
    }
    setMeasurements(initialMeasurements);
  }, []);

  // Function to get tooth shape SVG path based on tooth number
  const getToothShape = (toothNumber: number) => {
    // Define tooth shapes based on tooth type
    const shapes = {
      molar: "M4,0 L12,0 C14,0 16,2 16,4 L16,12 C16,14 14,16 12,16 L4,16 C2,16 0,14 0,12 L0,4 C0,2 2,0 4,0 Z",
      premolar: "M4,0 L12,0 C14,0 16,2 16,4 L16,10 C16,13 13,16 10,16 L6,16 C3,16 0,13 0,10 L0,4 C0,2 2,0 4,0 Z",
      canine: "M8,0 C12,0 16,4 16,8 L16,12 C16,14 14,16 12,16 L4,16 C2,16 0,14 0,12 L0,8 C0,4 4,0 8,0 Z",
      incisor: "M6,0 L10,0 C13,0 16,3 16,6 L16,10 C16,13 13,16 10,16 L6,16 C3,16 0,13 0,10 L0,6 C0,3 3,0 6,0 Z"
    };

    // Determine tooth type based on number
    let shape;
    if ([1,2,3,16,15,14,17,18,19,30,31,32].includes(toothNumber)) {
      shape = shapes.molar;
    } else if ([4,5,12,13,20,21,28,29].includes(toothNumber)) {
      shape = shapes.premolar;
    } else if ([6,11,22,27].includes(toothNumber)) {
      shape = shapes.canine;
    } else {
      shape = shapes.incisor;
    }

    return shape;
  };

  // Get color for measurement based on depth
  const getMeasurementColor = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined || value === '') return '';
    const numValue = typeof value === 'string' ? Number(value) : value;
    if (isNaN(numValue)) return '';
    if (numValue <= 3) return 'bg-green-100 text-green-800 border-green-300'; // Healthy
    if (numValue <= 5) return 'bg-yellow-100 text-yellow-800 border-yellow-300'; // Warning
    return 'bg-red-100 text-red-800 border-red-300'; // Danger
  };

  const handleMeasurementInput = (
    toothNumber: number,
    surface: 'buccal' | 'lingual',
    position: number,
    value: string
  ) => {
    const numValue = value === '' ? null : Number(value);
    if (numValue !== null && (numValue < 0 || numValue > 15)) {
      return; // Invalid measurement
    }

    setMeasurements(prev => ({
      ...prev,
      [toothNumber]: {
        ...prev[toothNumber],
        pocketDepth: {
          ...prev[toothNumber].pocketDepth,
          [surface]: prev[toothNumber].pocketDepth[surface].map(
            (v, i) => i === position ? numValue : v
          ) as [number | null, number | null, number | null]
        }
      }
    }));

    // Auto-advance logic
    if (value !== '') {
      const nextToothNumber = getNextToothNumber(toothNumber);
      const nextInputRef = inputRefs.current[`${nextToothNumber}-${surface}-${position}`];
      if (nextInputRef) {
        nextInputRef.focus();
      }
    }
  };

  const getNextToothNumber = (current: number): number => {
    if (currentSurface === 'buccal') {
      if (currentArch === 'upper') {
        return current < 16 ? current + 1 : 17;
      } else {
        return current < 32 ? current + 1 : 1;
      }
    } else { // lingual
      if (currentArch === 'lower') {
        return current > 17 ? current - 1 : 32;
      } else {
        return current > 1 ? current - 1 : 16;
      }
    }
  };

  // Using any type for browser compatibility
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  const toggleVoiceInput = () => {
    if (!isRecording) {
      try {
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          
          recognition.continuous = true;
          recognition.interimResults = true;
          
          recognition.onresult = (event: any) => {
            const results = event.results;
            const transcript = Array.from({ length: results.length }, (_, i) => 
              results[i][0].transcript
            ).join('');
            
            // Parse the voice input and update measurements
            const number = parseInt(transcript);
            if (!isNaN(number) && number >= 0 && number <= 15) {
              // Find the currently focused input and update its value
              const activeElement = document.activeElement as HTMLInputElement;
              if (activeElement?.tagName === 'INPUT' && activeElement.type === 'number') {
                activeElement.value = number.toString();
                activeElement.dispatchEvent(new Event('change', { bubbles: true }));
              }
            }
          };
          
          recognition.onend = () => {
            setIsRecording(false);
          };
          
          recognition.start();
          setIsRecording(true);
        } else {
          throw new Error('Speech recognition not supported');
        }
      } catch (error) {
        toast({
          title: "Voice Input Not Available",
          description: "Your browser doesn't support voice input. Please use keyboard input instead.",
          variant: "destructive"
        });
        setIsRecording(false);
      }
    } else {
      setIsRecording(false);
    }
  };

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

  return (
    <Card className={`w-full ${fullScreen ? 'fixed inset-0 z-50 overflow-auto' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between p-2 sm:p-4">
        <div>
          <CardTitle className="text-base sm:text-lg">Clinical Periodontal Chart</CardTitle>
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
                  onClick={toggleVoiceInput}
                  className={`h-7 w-7 ${isRecording ? 'bg-red-100' : ''}`}
                >
                  <Mic className={`h-3 w-3 ${isRecording ? 'text-red-500' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isRecording ? 'Stop Voice Input' : 'Start Voice Input'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
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
          {/* Upper Arch */}
          <div className="relative">
            <div className="flex justify-between mb-1">
              <span className="text-xs sm:text-sm font-medium">Upper Arch (1-16)</span>
              <span className="text-xs sm:text-sm text-muted-foreground">
                {currentSurface === 'buccal' ? 'Buccal View' : 'Lingual View'}
              </span>
            </div>
            
            <div className="grid grid-cols-8 sm:grid-cols-16 gap-0.5">
              {Array.from({length: 16}, (_, i) => i + 1).map(tooth => (
                <div key={tooth} className="flex flex-col items-center">
                  <div className="text-[10px] font-medium">#{tooth}</div>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 16 16"
                    className="mb-0"
                  >
                    <path
                      d={getToothShape(tooth)}
                      fill="white"
                      stroke="currentColor"
                      strokeWidth="1"
                    />
                  </svg>
                  <div className="flex flex-row sm:flex-col gap-0.5">
                    {[0, 1, 2].map(pos => (
                      <Input
                        key={`${tooth}-${currentSurface}-${pos}`}
                        ref={el => {
                          if (el) {
                            inputRefs.current[`${tooth}-${currentSurface}-${pos}`] = el;
                          }
                        }}
                        type="number"
                        min="0"
                        max="15"
                        className={`w-5 h-5 text-center p-0 text-[10px] ${getMeasurementColor(measurements[tooth]?.pocketDepth[currentSurface][pos])}`}
                        value={measurements[tooth]?.pocketDepth[currentSurface][pos] ?? ''}
                        onChange={(e) => handleMeasurementInput(tooth, currentSurface, pos, e.target.value)}
                        disabled={readOnly}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lower Arch */}
          <div className="relative">
            <div className="flex justify-between mb-1">
              <span className="text-xs sm:text-sm font-medium">Lower Arch (17-32)</span>
            </div>
            
            <div className="grid grid-cols-8 sm:grid-cols-16 gap-0.5">
              {Array.from({length: 16}, (_, i) => i + 17).map(tooth => (
                <div key={tooth} className="flex flex-col items-center">
                  <div className="text-[10px] font-medium">#{tooth}</div>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 16 16"
                    className="mb-0"
                  >
                    <path
                      d={getToothShape(tooth)}
                      fill="white"
                      stroke="currentColor"
                      strokeWidth="1"
                    />
                  </svg>
                  <div className="flex flex-row sm:flex-col gap-0.5">
                    {[0, 1, 2].map(pos => (
                      <Input
                        key={`${tooth}-${currentSurface}-${pos}`}
                        ref={el => {
                          if (el) {
                            inputRefs.current[`${tooth}-${currentSurface}-${pos}`] = el;
                          }
                        }}
                        type="number"
                        min="0"
                        max="15"
                        className={`w-5 h-5 text-center p-0 text-[10px] ${getMeasurementColor(measurements[tooth]?.pocketDepth[currentSurface][pos])}`}
                        value={measurements[tooth]?.pocketDepth[currentSurface][pos] ?? ''}
                        onChange={(e) => handleMeasurementInput(tooth, currentSurface, pos, e.target.value)}
                        disabled={readOnly}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Surface Toggle */}
          <div className="flex justify-center gap-2">
            <Button
              variant={currentSurface === 'buccal' ? 'default' : 'outline'}
              onClick={() => setCurrentSurface('buccal')}
              size="sm"
              className="text-xs h-8"
            >
              Buccal
            </Button>
            <Button
              variant={currentSurface === 'lingual' ? 'default' : 'outline'}
              onClick={() => setCurrentSurface('lingual')}
              size="sm"
              className="text-xs h-8"
            >
              Lingual
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}