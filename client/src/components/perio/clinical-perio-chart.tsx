import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Maximize2, Save, Mic } from 'lucide-react';

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

  const toggleVoiceInput = () => {
    if (!isRecording) {
      // Request microphone access and start recording
      if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = true;
        recognition.interimResults = true;
        
        recognition.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('');
          
          // Parse the voice input and update measurements
          const number = parseInt(transcript);
          if (!isNaN(number)) {
            // Update the currently focused input with the spoken number
            // Implementation needed based on current focus
          }
        };
        
        recognition.start();
        setIsRecording(true);
      } else {
        toast({
          title: "Voice Input Not Available",
          description: "Your browser doesn't support voice input. Please use keyboard input instead.",
          variant: "destructive"
        });
      }
    } else {
      // Stop recording
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
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Clinical Periodontal Chart</CardTitle>
          <div className="text-sm text-muted-foreground mt-1">
            Patient: {patientName}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleVoiceInput}
            className={isRecording ? 'bg-red-100' : ''}
          >
            <Mic className={`h-4 w-4 ${isRecording ? 'text-red-500' : ''}`} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setFullScreen(!fullScreen)}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          {!readOnly && (
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Chart
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-8">
          {/* Upper Arch */}
          <div className="relative">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Upper Arch (1-16)</span>
              <span className="text-sm text-muted-foreground">
                {currentSurface === 'buccal' ? 'Buccal View' : 'Lingual View'}
              </span>
            </div>
            
            <div className="grid grid-cols-16 gap-1">
              {Array.from({length: 16}, (_, i) => i + 1).map(tooth => (
                <div key={tooth} className="flex flex-col items-center">
                  <div className="text-xs font-medium mb-1">#{tooth}</div>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 16 16"
                    className="mb-1"
                  >
                    <path
                      d={getToothShape(tooth)}
                      fill="white"
                      stroke="currentColor"
                      strokeWidth="1"
                    />
                  </svg>
                  <div className="flex flex-col gap-1">
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
                        className="w-8 h-6 text-center p-0"
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
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Lower Arch (17-32)</span>
            </div>
            
            <div className="grid grid-cols-16 gap-1">
              {Array.from({length: 16}, (_, i) => i + 17).map(tooth => (
                <div key={tooth} className="flex flex-col items-center">
                  <div className="text-xs font-medium mb-1">#{tooth}</div>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 16 16"
                    className="mb-1"
                  >
                    <path
                      d={getToothShape(tooth)}
                      fill="white"
                      stroke="currentColor"
                      strokeWidth="1"
                    />
                  </svg>
                  <div className="flex flex-col gap-1">
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
                        className="w-8 h-6 text-center p-0"
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
          <div className="flex justify-center gap-4">
            <Button
              variant={currentSurface === 'buccal' ? 'default' : 'outline'}
              onClick={() => setCurrentSurface('buccal')}
            >
              Buccal Measurements
            </Button>
            <Button
              variant={currentSurface === 'lingual' ? 'default' : 'outline'}
              onClick={() => setCurrentSurface('lingual')}
            >
              Lingual Measurements
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}