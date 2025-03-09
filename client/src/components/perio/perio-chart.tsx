import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Save, 
  Printer, 
  Calendar, 
  Clock,
  PlusCircle,
  Activity
} from 'lucide-react';

// Adult tooth numbers (FDI Notation)
const ADULT_TEETH_UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const ADULT_TEETH_LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

// Surface positions for periodontal measurements
const POSITIONS = {
  FACIAL: ['distofacial', 'facial', 'mesiofacial'],
  LINGUAL: ['distolingual', 'lingual', 'mesiolingual'],
  ABBREVIATIONS: {
    'distofacial': 'DF',
    'facial': 'F',
    'mesiofacial': 'MF',
    'distolingual': 'DL',
    'lingual': 'L',
    'mesiolingual': 'ML'
  }
};

// Movement scale
const MOBILITY = [0, 1, 2, 3]; // 0 = No mobility, 3 = Severe mobility

// Furcation involvement scale
const FURCATION = [0, 1, 2, 3]; // 0 = None, 3 = Through and through

// Bleeding on probing
const BOP = {
  NONE: 'none',
  SLIGHT: 'slight',
  MODERATE: 'moderate',
  SEVERE: 'severe'
};

// Interface for a measurement position
interface PositionMeasurement {
  pocketDepth: number; // in mm
  recessionDepth: number; // in mm
  attachmentLoss: number; // pocketDepth + recessionDepth
  bleeding: boolean;
  suppuration: boolean; // pus
  plaque: boolean;
  calculus: boolean; // tartar
}

// Interface for tooth measurements
interface ToothMeasurement {
  toothId: number;
  positions: Record<string, PositionMeasurement>;
  mobility: number;
  furcation: Record<string, number>;
  notes: string;
}

// Interface for the entire periodontal chart
interface PerioChartData {
  patientId: number;
  date: string;
  lastUpdated: string;
  examinerId: number;
  examinerName: string;
  teeth: ToothMeasurement[];
  generalNotes: string;
  overallAssessment: {
    diagnosis: string;
    severityLevel: 'mild' | 'moderate' | 'severe';
    riskFactors: string[];
    recommendedTreatment: string[];
  };
}

// Function to generate an empty position measurement
const getEmptyPositionMeasurement = (): PositionMeasurement => {
  return {
    pocketDepth: 0,
    recessionDepth: 0,
    attachmentLoss: 0,
    bleeding: false,
    suppuration: false,
    plaque: false,
    calculus: false
  };
};

// Function to generate empty tooth measurements
const getEmptyToothMeasurement = (toothId: number): ToothMeasurement => {
  const positions: Record<string, PositionMeasurement> = {};
  
  // Add facial positions
  POSITIONS.FACIAL.forEach(pos => {
    positions[pos] = getEmptyPositionMeasurement();
  });
  
  // Add lingual positions
  POSITIONS.LINGUAL.forEach(pos => {
    positions[pos] = getEmptyPositionMeasurement();
  });
  
  return {
    toothId,
    positions,
    mobility: 0,
    furcation: {
      mesial: 0,
      buccal: 0,
      distal: 0,
      lingual: 0
    },
    notes: ''
  };
};

// Function to generate an empty periodontal chart
const generateEmptyPerioChart = (patientId: number): PerioChartData => {
  const teeth: ToothMeasurement[] = [];
  
  // Add upper teeth
  ADULT_TEETH_UPPER.forEach(toothId => {
    teeth.push(getEmptyToothMeasurement(toothId));
  });
  
  // Add lower teeth
  ADULT_TEETH_LOWER.forEach(toothId => {
    teeth.push(getEmptyToothMeasurement(toothId));
  });
  
  return {
    patientId,
    date: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    examinerId: 0, // This would be set from current user
    examinerName: 'Current Examiner', // This would be set from current user
    teeth,
    generalNotes: '',
    overallAssessment: {
      diagnosis: '',
      severityLevel: 'mild',
      riskFactors: [],
      recommendedTreatment: []
    }
  };
};

interface PerioChartProps {
  patientId: number;
  readOnly?: boolean;
  onSave?: (chartData: PerioChartData) => void;
}

export default function PerioChart({ patientId, readOnly = false, onSave }: PerioChartProps) {
  // In a real app, fetch the chart data from an API
  const [chartData, setChartData] = useState<PerioChartData>(generateEmptyPerioChart(patientId));
  const [selectedTab, setSelectedTab] = useState<string>('upper');
  const [selectedTooth, setSelectedTooth] = useState<ToothMeasurement | null>(null);
  const [focusedPosition, setFocusedPosition] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  
  // Function to save chart data
  const saveChart = () => {
    if (onSave) {
      onSave(chartData);
    }
    // In a real app, save to server
    console.log('Saving perio chart data:', chartData);
  };
  
  // Function to handle pocket depth change
  const handlePocketDepthChange = (toothId: number, position: string, value: number) => {
    if (readOnly) return;
    
    setChartData(prevState => {
      const newTeeth = prevState.teeth.map(tooth => {
        if (tooth.toothId === toothId) {
          const newPositions = { ...tooth.positions };
          newPositions[position] = {
            ...newPositions[position],
            pocketDepth: value,
            attachmentLoss: value + newPositions[position].recessionDepth
          };
          
          return {
            ...tooth,
            positions: newPositions
          };
        }
        return tooth;
      });
      
      return {
        ...prevState,
        teeth: newTeeth,
        lastUpdated: new Date().toISOString()
      };
    });
  };
  
  // Function to handle recession depth change
  const handleRecessionChange = (toothId: number, position: string, value: number) => {
    if (readOnly) return;
    
    setChartData(prevState => {
      const newTeeth = prevState.teeth.map(tooth => {
        if (tooth.toothId === toothId) {
          const newPositions = { ...tooth.positions };
          newPositions[position] = {
            ...newPositions[position],
            recessionDepth: value,
            attachmentLoss: newPositions[position].pocketDepth + value
          };
          
          return {
            ...tooth,
            positions: newPositions
          };
        }
        return tooth;
      });
      
      return {
        ...prevState,
        teeth: newTeeth,
        lastUpdated: new Date().toISOString()
      };
    });
  };
  
  // Function to toggle bleeding
  const toggleBleeding = (toothId: number, position: string) => {
    if (readOnly) return;
    
    setChartData(prevState => {
      const newTeeth = prevState.teeth.map(tooth => {
        if (tooth.toothId === toothId) {
          const newPositions = { ...tooth.positions };
          newPositions[position] = {
            ...newPositions[position],
            bleeding: !newPositions[position].bleeding
          };
          
          return {
            ...tooth,
            positions: newPositions
          };
        }
        return tooth;
      });
      
      return {
        ...prevState,
        teeth: newTeeth,
        lastUpdated: new Date().toISOString()
      };
    });
  };
  
  // Function to update mobility
  const updateMobility = (toothId: number, value: number) => {
    if (readOnly) return;
    
    setChartData(prevState => {
      const newTeeth = prevState.teeth.map(tooth => {
        if (tooth.toothId === toothId) {
          return {
            ...tooth,
            mobility: value
          };
        }
        return tooth;
      });
      
      return {
        ...prevState,
        teeth: newTeeth,
        lastUpdated: new Date().toISOString()
      };
    });
  };
  
  // Function to update furcation
  const updateFurcation = (toothId: number, position: string, value: number) => {
    if (readOnly) return;
    
    setChartData(prevState => {
      const newTeeth = prevState.teeth.map(tooth => {
        if (tooth.toothId === toothId) {
          return {
            ...tooth,
            furcation: {
              ...tooth.furcation,
              [position]: value
            }
          };
        }
        return tooth;
      });
      
      return {
        ...prevState,
        teeth: newTeeth,
        lastUpdated: new Date().toISOString()
      };
    });
  };
  
  // Function to get measurement color based on pocket depth
  const getPocketDepthColor = (depth: number): string => {
    if (depth <= 3) return 'text-green-600';
    if (depth <= 5) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  // Function to render a tooth row in the chart
  const renderToothRow = (teethIds: number[]) => {
    // Get the teeth data
    const teethData = chartData.teeth.filter(tooth => teethIds.includes(tooth.toothId));
    
    return (
      <div className="grid grid-cols-16 gap-1 my-4">
        {teethData.map(tooth => (
          <div key={tooth.toothId} className="text-center">
            <div className="font-semibold text-xs mb-1">{tooth.toothId}</div>
            
            <div className="border border-gray-300 rounded-sm p-1 bg-white">
              {/* Top row - Facial measurements */}
              <div className="flex justify-between mb-1">
                {POSITIONS.FACIAL.map((position) => {
                  const measurement = tooth.positions[position];
                  return (
                    <div key={position} className="text-center w-full">
                      {/* Recession value */}
                      <input
                        type="text"
                        className={`w-full text-center text-xs border border-gray-200 rounded-none h-5 ${
                          measurement.recessionDepth > 0 ? 'text-blue-600' : ''
                        }`}
                        value={measurement.recessionDepth || ''}
                        placeholder="0"
                        onChange={(e) => handleRecessionChange(
                          tooth.toothId, 
                          position, 
                          Number(e.target.value) || 0
                        )}
                        disabled={readOnly}
                      />
                      
                      {/* Pocket depth */}
                      <input
                        type="text"
                        className={`w-full text-center text-xs border border-gray-200 rounded-none h-5 ${
                          getPocketDepthColor(measurement.pocketDepth)
                        }`}
                        value={measurement.pocketDepth || ''}
                        placeholder="0"
                        onChange={(e) => handlePocketDepthChange(
                          tooth.toothId, 
                          position, 
                          Number(e.target.value) || 0
                        )}
                        disabled={readOnly}
                      />
                      
                      {/* Bleeding indicator */}
                      <div
                        className={`w-full h-2 ${
                          measurement.bleeding ? 'bg-red-500' : 'bg-gray-100'
                        } cursor-pointer`}
                        onClick={() => toggleBleeding(tooth.toothId, position)}
                      />
                    </div>
                  );
                })}
              </div>
              
              {/* Middle - Tooth visualization */}
              <div className="h-10 flex items-center justify-center relative">
                <div className="tooth-graphic w-full h-full flex items-center justify-center">
                  {/* Simplified tooth shape */}
                  <div className="w-8 h-8 bg-gray-100 rounded-md relative flex items-center justify-center">
                    {/* Mobility badge if applicable */}
                    {tooth.mobility > 0 && (
                      <Badge 
                        variant="outline" 
                        className="absolute -top-1 -right-1 text-[9px] p-[2px]"
                      >
                        M{tooth.mobility}
                      </Badge>
                    )}
                    
                    {/* Tooth number */}
                    <span className="text-xs font-semibold">{tooth.toothId}</span>
                  </div>
                  
                  {/* Furcation indicators if applicable */}
                  {Object.entries(tooth.furcation).map(([position, value]) => {
                    if (value === 0) return null;
                    
                    // Position the indicator based on the position name
                    let positionClass = '';
                    switch(position) {
                      case 'mesial':
                        positionClass = 'absolute top-1/2 left-0 transform -translate-x-1/2 -translate-y-1/2';
                        break;
                      case 'distal':
                        positionClass = 'absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2';
                        break;
                      case 'buccal':
                        positionClass = 'absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2';
                        break;
                      case 'lingual':
                        positionClass = 'absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
                        break;
                    }
                    
                    return (
                      <div key={position} className={positionClass}>
                        <Badge variant="outline" className="text-[9px] p-[2px]">
                          F{value}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Bottom row - Lingual measurements */}
              <div className="flex justify-between mt-1">
                {POSITIONS.LINGUAL.map((position) => {
                  const measurement = tooth.positions[position];
                  return (
                    <div key={position} className="text-center w-full">
                      {/* Bleeding indicator */}
                      <div
                        className={`w-full h-2 ${
                          measurement.bleeding ? 'bg-red-500' : 'bg-gray-100'
                        } cursor-pointer`}
                        onClick={() => toggleBleeding(tooth.toothId, position)}
                      />
                      
                      {/* Pocket depth */}
                      <input
                        type="text"
                        className={`w-full text-center text-xs border border-gray-200 rounded-none h-5 ${
                          getPocketDepthColor(measurement.pocketDepth)
                        }`}
                        value={measurement.pocketDepth || ''}
                        placeholder="0"
                        onChange={(e) => handlePocketDepthChange(
                          tooth.toothId,
                          position,
                          Number(e.target.value) || 0
                        )}
                        disabled={readOnly}
                      />
                      
                      {/* Recession value */}
                      <input
                        type="text"
                        className={`w-full text-center text-xs border border-gray-200 rounded-none h-5 ${
                          measurement.recessionDepth > 0 ? 'text-blue-600' : ''
                        }`}
                        value={measurement.recessionDepth || ''}
                        placeholder="0"
                        onChange={(e) => handleRecessionChange(
                          tooth.toothId,
                          position,
                          Number(e.target.value) || 0
                        )}
                        disabled={readOnly}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Mobility control */}
            <div className="flex justify-center mt-2">
              <Select
                defaultValue={tooth.mobility.toString()}
                onValueChange={(value) => updateMobility(tooth.toothId, Number(value))}
                disabled={readOnly}
              >
                <SelectTrigger className="h-6 w-16 text-xs">
                  <SelectValue placeholder="M0" />
                </SelectTrigger>
                <SelectContent>
                  {MOBILITY.map((value) => (
                    <SelectItem key={value} value={value.toString()} className="text-xs">
                      M{value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Function to render the legend
  const renderLegend = () => {
    return (
      <div className="mt-4 border-t pt-4">
        <h4 className="text-sm font-medium mb-2">Legend</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <h5 className="text-xs font-medium">Pocket Depth</h5>
            <div className="flex items-center mt-1">
              <div className="w-4 h-4 bg-green-600 mr-1" />
              <span className="text-xs">1-3mm (Healthy)</span>
            </div>
            <div className="flex items-center mt-1">
              <div className="w-4 h-4 bg-yellow-600 mr-1" />
              <span className="text-xs">4-5mm (Moderate)</span>
            </div>
            <div className="flex items-center mt-1">
              <div className="w-4 h-4 bg-red-600 mr-1" />
              <span className="text-xs">6mm+ (Severe)</span>
            </div>
          </div>
          
          <div>
            <h5 className="text-xs font-medium">Recession</h5>
            <div className="flex items-center mt-1">
              <div className="w-4 h-4 bg-blue-600 mr-1" />
              <span className="text-xs">Gingival recession (mm)</span>
            </div>
          </div>
          
          <div>
            <h5 className="text-xs font-medium">Bleeding</h5>
            <div className="flex items-center mt-1">
              <div className="w-4 h-4 bg-red-500 mr-1" />
              <span className="text-xs">Bleeding on probing</span>
            </div>
          </div>
          
          <div>
            <h5 className="text-xs font-medium">Mobility</h5>
            <div className="flex items-center mt-1">
              <Badge variant="outline" className="mr-1">M1</Badge>
              <span className="text-xs">Slight mobility</span>
            </div>
            <div className="flex items-center mt-1">
              <Badge variant="outline" className="mr-1">M2</Badge>
              <span className="text-xs">Moderate mobility</span>
            </div>
            <div className="flex items-center mt-1">
              <Badge variant="outline" className="mr-1">M3</Badge>
              <span className="text-xs">Severe mobility</span>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Periodontal Chart</CardTitle>
            <CardDescription>
              Interactive periodontal chart for recording pocket depths, recession, and other measurements
            </CardDescription>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-500">
              Date: {new Date(chartData.date).toLocaleDateString()}
            </div>
            
            {!readOnly && (
              <Button onClick={saveChart}>
                <Save className="h-4 w-4 mr-1" /> Save Chart
              </Button>
            )}
            
            <Button variant="outline">
              <Printer className="h-4 w-4 mr-1" /> Print
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4 flex justify-between items-center">
          <div className="flex space-x-4">
            <div>
              <Label className="text-xs">Patient ID</Label>
              <div className="font-medium">{patientId}</div>
            </div>
            <div>
              <Label className="text-xs">Date</Label>
              <div className="font-medium">{new Date(chartData.date).toLocaleDateString()}</div>
            </div>
            <div>
              <Label className="text-xs">Examiner</Label>
              <div className="font-medium">{chartData.examinerName}</div>
            </div>
          </div>
          
          <div>
            <Label className="text-xs mb-1 block">Quick Assessment</Label>
            <Select
              defaultValue={chartData.overallAssessment.severityLevel}
              onValueChange={(value: 'mild' | 'moderate' | 'severe') => {
                setChartData(prev => ({
                  ...prev,
                  overallAssessment: {
                    ...prev.overallAssessment,
                    severityLevel: value
                  }
                }));
              }}
              disabled={readOnly}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mild">Mild Periodontitis</SelectItem>
                <SelectItem value="moderate">Moderate Periodontitis</SelectItem>
                <SelectItem value="severe">Severe Periodontitis</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Tabs defaultValue="upper" onValueChange={setSelectedTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="upper">Upper Teeth</TabsTrigger>
            <TabsTrigger value="lower">Lower Teeth</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upper">
            <div className="perio-chart p-4 bg-gray-50 rounded-md border border-gray-200 overflow-x-auto">
              <div className="min-w-fit">
                {/* Facial label */}
                <div className="flex justify-end mb-1">
                  <span className="text-xs text-gray-500 mr-4">Facial</span>
                </div>
                
                {/* Position labels for facial */}
                <div className="grid grid-cols-16 gap-1 mb-2">
                  {ADULT_TEETH_UPPER.map(toothId => (
                    <div key={toothId} className="text-center">
                      <div className="flex justify-between text-[8px] text-gray-500">
                        {POSITIONS.FACIAL.map(position => (
                          <span key={position} className="w-full">
                            {POSITIONS.ABBREVIATIONS[position as keyof typeof POSITIONS.ABBREVIATIONS]}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Upper teeth */}
                {renderToothRow(ADULT_TEETH_UPPER)}
                
                {/* Position labels for lingual */}
                <div className="grid grid-cols-16 gap-1 mt-2">
                  {ADULT_TEETH_UPPER.map(toothId => (
                    <div key={toothId} className="text-center">
                      <div className="flex justify-between text-[8px] text-gray-500">
                        {POSITIONS.LINGUAL.map(position => (
                          <span key={position} className="w-full">
                            {POSITIONS.ABBREVIATIONS[position as keyof typeof POSITIONS.ABBREVIATIONS]}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Lingual label */}
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-gray-500 mr-4">Lingual</span>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="lower">
            <div className="perio-chart p-4 bg-gray-50 rounded-md border border-gray-200 overflow-x-auto">
              <div className="min-w-fit">
                {/* Facial label */}
                <div className="flex justify-end mb-1">
                  <span className="text-xs text-gray-500 mr-4">Facial</span>
                </div>
                
                {/* Position labels for facial */}
                <div className="grid grid-cols-16 gap-1 mb-2">
                  {ADULT_TEETH_LOWER.map(toothId => (
                    <div key={toothId} className="text-center">
                      <div className="flex justify-between text-[8px] text-gray-500">
                        {POSITIONS.FACIAL.map(position => (
                          <span key={position} className="w-full">
                            {POSITIONS.ABBREVIATIONS[position as keyof typeof POSITIONS.ABBREVIATIONS]}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Lower teeth */}
                {renderToothRow(ADULT_TEETH_LOWER)}
                
                {/* Position labels for lingual */}
                <div className="grid grid-cols-16 gap-1 mt-2">
                  {ADULT_TEETH_LOWER.map(toothId => (
                    <div key={toothId} className="text-center">
                      <div className="flex justify-between text-[8px] text-gray-500">
                        {POSITIONS.LINGUAL.map(position => (
                          <span key={position} className="w-full">
                            {POSITIONS.ABBREVIATIONS[position as keyof typeof POSITIONS.ABBREVIATIONS]}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Lingual label */}
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-gray-500 mr-4">Lingual</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Notes */}
        <div className="mt-4">
          <Label htmlFor="notes" className="text-sm font-medium">Clinical Notes</Label>
          <textarea
            id="notes"
            className="w-full p-2 mt-1 border border-gray-300 rounded-md text-sm h-20"
            value={chartData.generalNotes}
            onChange={(e) => setChartData(prev => ({ ...prev, generalNotes: e.target.value }))}
            placeholder="Add clinical notes about periodontal condition..."
            disabled={readOnly}
          />
        </div>
        
        {/* Legend */}
        {renderLegend()}
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="text-xs text-gray-500">
          <p>Enter pocket depths and recession measurements in millimeters. Click on the red/gray bars to toggle bleeding status.</p>
        </div>
        
        {!readOnly && (
          <Button onClick={saveChart}>
            <Save className="h-4 w-4 mr-1" /> Save Chart
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}