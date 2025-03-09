import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Save, ArrowLeft, ArrowRight, Info, ClipboardEdit, Upload } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Constants
const ADULT_TEETH_UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const ADULT_TEETH_LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

// Define perio chart data structure
interface PerioMeasurement {
  pocketDepth: {
    facial: [number | null, number | null, number | null]; // [Mesial, Middle, Distal]
    lingual: [number | null, number | null, number | null]; // [Mesial, Middle, Distal]
  };
  recession: {
    facial: [number | null, number | null, number | null];
    lingual: [number | null, number | null, number | null];
  };
  bleeding: {
    facial: [boolean, boolean, boolean];
    lingual: [boolean, boolean, boolean];
  };
  suppuration: {
    facial: [boolean, boolean, boolean];
    lingual: [boolean, boolean, boolean];
  };
  mobility: number | null;
  furcation: {
    facial: number | null;
    lingual: number | null;
    mesial: number | null;
    distal: number | null;
  };
  plaque: boolean;
  calculus: boolean;
}

interface ToothPerioData {
  id: number;
  measurements: PerioMeasurement;
}

interface PerioChartData {
  patientId: number;
  date: string;
  examiner: string;
  teeth: ToothPerioData[];
  notes: string;
  lastUpdated: string;
}

interface PerioChartProps {
  patientId: number;
  readOnly?: boolean;
  onSave?: (data: PerioChartData) => void;
}

// Helper to create a default measurement
const createDefaultMeasurement = (): PerioMeasurement => ({
  pocketDepth: {
    facial: [null, null, null],
    lingual: [null, null, null],
  },
  recession: {
    facial: [null, null, null],
    lingual: [null, null, null],
  },
  bleeding: {
    facial: [false, false, false],
    lingual: [false, false, false],
  },
  suppuration: {
    facial: [false, false, false],
    lingual: [false, false, false],
  },
  mobility: null,
  furcation: {
    facial: null,
    lingual: null,
    mesial: null,
    distal: null,
  },
  plaque: false,
  calculus: false,
});

// Helper to create default teeth data
const createDefaultTeethData = (): ToothPerioData[] => {
  const teeth: ToothPerioData[] = [];
  
  // Add upper teeth
  ADULT_TEETH_UPPER.forEach(id => {
    teeth.push({
      id,
      measurements: createDefaultMeasurement(),
    });
  });
  
  // Add lower teeth
  ADULT_TEETH_LOWER.forEach(id => {
    teeth.push({
      id,
      measurements: createDefaultMeasurement(),
    });
  });
  
  return teeth;
};

export default function PerioChart({ patientId, readOnly = false, onSave }: PerioChartProps) {
  const [chartData, setChartData] = useState<PerioChartData>({
    patientId,
    date: new Date().toISOString().split('T')[0],
    examiner: 'Dr. Smith', // In a real app, get the current user
    teeth: createDefaultTeethData(),
    notes: '',
    lastUpdated: new Date().toISOString(),
  });
  
  const [selectedArch, setSelectedArch] = useState<'upper' | 'lower'>('upper');
  const [selectedAspect, setSelectedAspect] = useState<'facial' | 'lingual'>('facial');
  const [selectedMeasurement, setSelectedMeasurement] = useState<'pocketDepth' | 'recession' | 'bleeding' | 'suppuration'>('pocketDepth');
  
  // Fetch existing perio chart data if available
  useEffect(() => {
    // In a real app, fetch from API
    // For demo, we'll use the default data
  }, [patientId]);
  
  // Update a tooth measurement
  const updateMeasurement = (
    toothId: number,
    aspect: 'facial' | 'lingual',
    type: 'pocketDepth' | 'recession' | 'bleeding' | 'suppuration',
    position: 0 | 1 | 2, // 0: Mesial, 1: Middle, 2: Distal
    value: number | boolean | null
  ) => {
    if (readOnly) return;
    
    setChartData(prevData => {
      const newTeeth = prevData.teeth.map(tooth => {
        if (tooth.id === toothId) {
          const newMeasurements = { ...tooth.measurements };
          
          if (typeof value === 'boolean') {
            // For boolean values (bleeding, suppuration)
            (newMeasurements[type][aspect] as boolean[])[position] = value;
          } else {
            // For numeric values (pocket depth, recession)
            (newMeasurements[type][aspect] as (number | null)[])[position] = value;
          }
          
          return {
            ...tooth,
            measurements: newMeasurements,
          };
        }
        return tooth;
      });
      
      return {
        ...prevData,
        teeth: newTeeth,
        lastUpdated: new Date().toISOString(),
      };
    });
  };
  
  // Update mobility
  const updateMobility = (toothId: number, value: number | null) => {
    if (readOnly) return;
    
    setChartData(prevData => {
      const newTeeth = prevData.teeth.map(tooth => {
        if (tooth.id === toothId) {
          return {
            ...tooth,
            measurements: {
              ...tooth.measurements,
              mobility: value,
            },
          };
        }
        return tooth;
      });
      
      return {
        ...prevData,
        teeth: newTeeth,
        lastUpdated: new Date().toISOString(),
      };
    });
  };
  
  // Update furcation
  const updateFurcation = (toothId: number, location: 'facial' | 'lingual' | 'mesial' | 'distal', value: number | null) => {
    if (readOnly) return;
    
    setChartData(prevData => {
      const newTeeth = prevData.teeth.map(tooth => {
        if (tooth.id === toothId) {
          return {
            ...tooth,
            measurements: {
              ...tooth.measurements,
              furcation: {
                ...tooth.measurements.furcation,
                [location]: value,
              },
            },
          };
        }
        return tooth;
      });
      
      return {
        ...prevData,
        teeth: newTeeth,
        lastUpdated: new Date().toISOString(),
      };
    });
  };
  
  // Update plaque/calculus
  const updatePlaqueCalculus = (toothId: number, type: 'plaque' | 'calculus', value: boolean) => {
    if (readOnly) return;
    
    setChartData(prevData => {
      const newTeeth = prevData.teeth.map(tooth => {
        if (tooth.id === toothId) {
          return {
            ...tooth,
            measurements: {
              ...tooth.measurements,
              [type]: value,
            },
          };
        }
        return tooth;
      });
      
      return {
        ...prevData,
        teeth: newTeeth,
        lastUpdated: new Date().toISOString(),
      };
    });
  };
  
  // Save perio chart
  const savePerioChart = () => {
    if (onSave) {
      onSave(chartData);
    }
    // In a real app, make an API call to save the chart data
    console.log('Saving perio chart:', chartData);
  };
  
  // Determine the cell background color based on pocket depth
  const getPocketDepthColor = (value: number | null) => {
    if (value === null) return 'bg-white';
    if (value <= 3) return 'bg-green-100';
    if (value <= 5) return 'bg-yellow-100';
    return 'bg-red-100';
  };
  
  // Determine the cell background color based on recession
  const getRecessionColor = (value: number | null) => {
    if (value === null) return 'bg-white';
    if (value === 0) return 'bg-green-100';
    if (value <= 2) return 'bg-yellow-100';
    return 'bg-red-100';
  };
  
  // Get teeth for current view
  const currentTeeth = chartData.teeth.filter(tooth => 
    selectedArch === 'upper' 
      ? ADULT_TEETH_UPPER.includes(tooth.id)
      : ADULT_TEETH_LOWER.includes(tooth.id)
  ).sort((a, b) => {
    // Sort teeth for left-to-right display in the table
    if (selectedArch === 'upper') {
      if (a.id <= 18 && b.id <= 18) return b.id - a.id; // Right quadrant, descending
      if (a.id >= 21 && b.id >= 21) return a.id - b.id; // Left quadrant, ascending
      return a.id - b.id; // Mixed, default to ascending
    } else {
      if (a.id <= 38 && b.id <= 38) return a.id - b.id; // Left quadrant, ascending
      if (a.id >= 41 && b.id >= 41) return b.id - a.id; // Right quadrant, descending
      return a.id - b.id; // Mixed, default to ascending
    }
  });
  
  // Render table for pocket depth or recession measurements
  const renderMeasurementsTable = (
    type: 'pocketDepth' | 'recession',
    aspect: 'facial' | 'lingual'
  ) => {
    const getColorFn = type === 'pocketDepth' ? getPocketDepthColor : getRecessionColor;
    const title = type === 'pocketDepth' ? 'Pocket Depth' : 'Recession';
    const surfaceTitle = aspect === 'facial' ? 'Facial' : 'Lingual';
    
    return (
      <div className="mt-4">
        <h3 className="text-sm font-medium mb-2">{title} - {surfaceTitle} (mm)</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Tooth #</TableHead>
                <TableHead className="text-center">Mesial</TableHead>
                <TableHead className="text-center">Middle</TableHead>
                <TableHead className="text-center">Distal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentTeeth.map(tooth => (
                <TableRow key={`${tooth.id}-${type}-${aspect}`}>
                  <TableCell className="font-medium">{tooth.id}</TableCell>
                  {[0, 1, 2].map((position) => (
                    <TableCell 
                      key={`${tooth.id}-${type}-${aspect}-${position}`}
                      className={`text-center ${getColorFn(tooth.measurements[type][aspect][position])} p-0`}
                    >
                      <Input
                        type="number"
                        min="0"
                        max="15"
                        className="border-0 text-center h-8 bg-transparent"
                        value={tooth.measurements[type][aspect][position] === null ? '' : tooth.measurements[type][aspect][position]}
                        onChange={(e) => {
                          const value = e.target.value === '' ? null : parseInt(e.target.value);
                          updateMeasurement(tooth.id, aspect, type, position as 0 | 1 | 2, value);
                        }}
                        disabled={readOnly}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };
  
  // Render bleeding table
  const renderBleedingTable = (aspect: 'facial' | 'lingual') => {
    const surfaceTitle = aspect === 'facial' ? 'Facial' : 'Lingual';
    
    return (
      <div className="mt-4">
        <h3 className="text-sm font-medium mb-2">Bleeding - {surfaceTitle}</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Tooth #</TableHead>
                <TableHead className="text-center">Mesial</TableHead>
                <TableHead className="text-center">Middle</TableHead>
                <TableHead className="text-center">Distal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentTeeth.map(tooth => (
                <TableRow key={`${tooth.id}-bleeding-${aspect}`}>
                  <TableCell className="font-medium">{tooth.id}</TableCell>
                  {[0, 1, 2].map((position) => (
                    <TableCell 
                      key={`${tooth.id}-bleeding-${aspect}-${position}`}
                      className={`text-center ${tooth.measurements.bleeding[aspect][position] ? 'bg-red-100' : 'bg-white'} cursor-pointer`}
                      onClick={() => {
                        if (!readOnly) {
                          updateMeasurement(
                            tooth.id, 
                            aspect, 
                            'bleeding', 
                            position as 0 | 1 | 2, 
                            !tooth.measurements.bleeding[aspect][position]
                          );
                        }
                      }}
                    >
                      {tooth.measurements.bleeding[aspect][position] ? '✓' : ''}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };
  
  // Render suppuration table
  const renderSuppurationTable = (aspect: 'facial' | 'lingual') => {
    const surfaceTitle = aspect === 'facial' ? 'Facial' : 'Lingual';
    
    return (
      <div className="mt-4">
        <h3 className="text-sm font-medium mb-2">Suppuration - {surfaceTitle}</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Tooth #</TableHead>
                <TableHead className="text-center">Mesial</TableHead>
                <TableHead className="text-center">Middle</TableHead>
                <TableHead className="text-center">Distal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentTeeth.map(tooth => (
                <TableRow key={`${tooth.id}-suppuration-${aspect}`}>
                  <TableCell className="font-medium">{tooth.id}</TableCell>
                  {[0, 1, 2].map((position) => (
                    <TableCell 
                      key={`${tooth.id}-suppuration-${aspect}-${position}`}
                      className={`text-center ${tooth.measurements.suppuration[aspect][position] ? 'bg-yellow-100' : 'bg-white'} cursor-pointer`}
                      onClick={() => {
                        if (!readOnly) {
                          updateMeasurement(
                            tooth.id, 
                            aspect, 
                            'suppuration', 
                            position as 0 | 1 | 2, 
                            !tooth.measurements.suppuration[aspect][position]
                          );
                        }
                      }}
                    >
                      {tooth.measurements.suppuration[aspect][position] ? '✓' : ''}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };
  
  // Render mobility and furcation table
  const renderMobilityFurcationTable = () => {
    return (
      <div className="mt-4">
        <h3 className="text-sm font-medium mb-2">Mobility & Furcation</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Tooth #</TableHead>
                <TableHead className="text-center">Mobility</TableHead>
                <TableHead className="text-center">Furcation (F)</TableHead>
                <TableHead className="text-center">Furcation (L)</TableHead>
                <TableHead className="text-center">Furcation (M)</TableHead>
                <TableHead className="text-center">Furcation (D)</TableHead>
                <TableHead className="text-center">Plaque</TableHead>
                <TableHead className="text-center">Calculus</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentTeeth.map(tooth => (
                <TableRow key={`${tooth.id}-mobility-furcation`}>
                  <TableCell className="font-medium">{tooth.id}</TableCell>
                  <TableCell>
                    <Select
                      value={tooth.measurements.mobility === null ? '' : tooth.measurements.mobility.toString()}
                      onValueChange={(value) => {
                        const mobilityValue = value === '' ? null : parseInt(value);
                        updateMobility(tooth.id, mobilityValue);
                      }}
                      disabled={readOnly}
                    >
                      <SelectTrigger className="w-full h-8">
                        <SelectValue placeholder="" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  {['facial', 'lingual', 'mesial', 'distal'].map(location => (
                    <TableCell key={`${tooth.id}-furcation-${location}`}>
                      <Select
                        value={tooth.measurements.furcation[location as keyof typeof tooth.measurements.furcation] === null ? '' : tooth.measurements.furcation[location as keyof typeof tooth.measurements.furcation]?.toString()}
                        onValueChange={(value) => {
                          const furcationValue = value === '' ? null : parseInt(value);
                          updateFurcation(tooth.id, location as 'facial' | 'lingual' | 'mesial' | 'distal', furcationValue);
                        }}
                        disabled={readOnly}
                      >
                        <SelectTrigger className="w-full h-8">
                          <SelectValue placeholder="" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          <SelectItem value="1">I</SelectItem>
                          <SelectItem value="2">II</SelectItem>
                          <SelectItem value="3">III</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  ))}
                  <TableCell
                    className={`text-center cursor-pointer ${tooth.measurements.plaque ? 'bg-blue-100' : 'bg-white'}`}
                    onClick={() => {
                      if (!readOnly) {
                        updatePlaqueCalculus(tooth.id, 'plaque', !tooth.measurements.plaque);
                      }
                    }}
                  >
                    {tooth.measurements.plaque ? '✓' : ''}
                  </TableCell>
                  <TableCell
                    className={`text-center cursor-pointer ${tooth.measurements.calculus ? 'bg-gray-100' : 'bg-white'}`}
                    onClick={() => {
                      if (!readOnly) {
                        updatePlaqueCalculus(tooth.id, 'calculus', !tooth.measurements.calculus);
                      }
                    }}
                  >
                    {tooth.measurements.calculus ? '✓' : ''}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
              Record comprehensive periodontal measurements
            </CardDescription>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-500">
              Last updated: {new Date(chartData.lastUpdated).toLocaleString()}
            </div>
            
            {!readOnly && (
              <Button onClick={savePerioChart}>
                <Save className="h-4 w-4 mr-1" /> Save Chart
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="exam-date">Exam Date</Label>
            <Input
              id="exam-date"
              type="date"
              value={chartData.date}
              onChange={(e) => setChartData({ ...chartData, date: e.target.value })}
              disabled={readOnly}
            />
          </div>
          <div>
            <Label htmlFor="examiner">Examiner</Label>
            <Input
              id="examiner"
              type="text"
              value={chartData.examiner}
              onChange={(e) => setChartData({ ...chartData, examiner: e.target.value })}
              disabled={readOnly}
            />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              type="text"
              value={chartData.notes}
              onChange={(e) => setChartData({ ...chartData, notes: e.target.value })}
              disabled={readOnly}
              placeholder="Add chart notes..."
            />
          </div>
        </div>
        
        <div className="flex justify-between mb-4">
          <div className="space-x-2">
            <Button
              variant={selectedArch === 'upper' ? 'default' : 'outline'}
              onClick={() => setSelectedArch('upper')}
            >
              Upper Arch
            </Button>
            <Button
              variant={selectedArch === 'lower' ? 'default' : 'outline'}
              onClick={() => setSelectedArch('lower')}
            >
              Lower Arch
            </Button>
          </div>
          
          <div className="space-x-2">
            <Button
              variant={selectedAspect === 'facial' ? 'default' : 'outline'}
              onClick={() => setSelectedAspect('facial')}
              size="sm"
            >
              Facial
            </Button>
            <Button
              variant={selectedAspect === 'lingual' ? 'default' : 'outline'}
              onClick={() => setSelectedAspect('lingual')}
              size="sm"
            >
              Lingual
            </Button>
          </div>
          
          <div className="space-x-2">
            <Button
              variant={selectedMeasurement === 'pocketDepth' ? 'default' : 'outline'}
              onClick={() => setSelectedMeasurement('pocketDepth')}
              size="sm"
            >
              Pocket Depth
            </Button>
            <Button
              variant={selectedMeasurement === 'recession' ? 'default' : 'outline'}
              onClick={() => setSelectedMeasurement('recession')}
              size="sm"
            >
              Recession
            </Button>
            <Button
              variant={selectedMeasurement === 'bleeding' ? 'default' : 'outline'}
              onClick={() => setSelectedMeasurement('bleeding')}
              size="sm"
            >
              Bleeding
            </Button>
            <Button
              variant={selectedMeasurement === 'suppuration' ? 'default' : 'outline'}
              onClick={() => setSelectedMeasurement('suppuration')}
              size="sm"
            >
              Suppuration
            </Button>
          </div>
        </div>
        
        <div className="perio-chart-content">
          {selectedMeasurement === 'pocketDepth' && renderMeasurementsTable('pocketDepth', selectedAspect)}
          {selectedMeasurement === 'recession' && renderMeasurementsTable('recession', selectedAspect)}
          {selectedMeasurement === 'bleeding' && renderBleedingTable(selectedAspect)}
          {selectedMeasurement === 'suppuration' && renderSuppurationTable(selectedAspect)}
          
          {renderMobilityFurcationTable()}
        </div>
        
        {/* Legend */}
        <div className="mt-6 border-t pt-4">
          <h3 className="text-sm font-medium mb-2">Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <h4 className="text-xs font-semibold mb-1">Pocket Depth</h4>
              <div className="space-y-1">
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-1 bg-green-100 border border-gray-300"></div>
                  <span className="text-xs">1-3 mm (Healthy)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-1 bg-yellow-100 border border-gray-300"></div>
                  <span className="text-xs">4-5 mm (Moderate)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-1 bg-red-100 border border-gray-300"></div>
                  <span className="text-xs">6+ mm (Severe)</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-xs font-semibold mb-1">Recession</h4>
              <div className="space-y-1">
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-1 bg-green-100 border border-gray-300"></div>
                  <span className="text-xs">0 mm (None)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-1 bg-yellow-100 border border-gray-300"></div>
                  <span className="text-xs">1-2 mm (Mild)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-1 bg-red-100 border border-gray-300"></div>
                  <span className="text-xs">3+ mm (Severe)</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-xs font-semibold mb-1">Bleeding & Suppuration</h4>
              <div className="space-y-1">
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-1 bg-red-100 border border-gray-300 flex items-center justify-center text-xs">✓</div>
                  <span className="text-xs">Bleeding Present</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-1 bg-yellow-100 border border-gray-300 flex items-center justify-center text-xs">✓</div>
                  <span className="text-xs">Suppuration Present</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-xs font-semibold mb-1">Other Indicators</h4>
              <div className="space-y-1">
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-1 bg-blue-100 border border-gray-300 flex items-center justify-center text-xs">✓</div>
                  <span className="text-xs">Plaque Present</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-1 bg-gray-100 border border-gray-300 flex items-center justify-center text-xs">✓</div>
                  <span className="text-xs">Calculus Present</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="border-t pt-4 flex justify-between">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center text-xs text-muted-foreground">
                <Info className="h-3 w-3 mr-1" />
                <p>Click on cells to toggle bleeding, suppuration, plaque, and calculus indicators</p>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs text-xs">
                For pocket depth and recession, enter values in millimeters. 
                For bleeding and suppuration, click the cell to mark as present.
                For mobility and furcation, select values from the dropdown.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-1" /> Import
          </Button>
          <Button variant="outline" size="sm">
            <ClipboardEdit className="h-4 w-4 mr-1" /> Print
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}