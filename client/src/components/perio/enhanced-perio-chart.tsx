import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Info, Save, Download } from 'lucide-react';

// Define adult teeth numbering (standard dental notation)
const ADULT_TEETH_UPPER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
const ADULT_TEETH_LOWER = [32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17];

// Define tooth specific positions
const POSITIONS = [
  { id: 'MB', name: 'Mesio-Buccal' },
  { id: 'B', name: 'Buccal' },
  { id: 'DB', name: 'Disto-Buccal' },
  { id: 'ML', name: 'Mesio-Lingual' },
  { id: 'L', name: 'Lingual' },
  { id: 'DL', name: 'Disto-Lingual' }
];

// Define relevant perio measurements
const MEASUREMENT_TYPES = [
  { id: 'pocketDepth', name: 'Pocket Depth (mm)' },
  { id: 'recession', name: 'Recession (mm)' },
  { id: 'attachmentLoss', name: 'Attachment Loss (mm)' },
  { id: 'bleeding', name: 'Bleeding on Probing' },
  { id: 'suppuration', name: 'Suppuration' },
  { id: 'plaque', name: 'Plaque' },
  { id: 'mobility', name: 'Mobility' },
  { id: 'furcation', name: 'Furcation' }
];

// Interface for tooth data
interface ToothData {
  id: number;
  pocketDepths: {
    facial: [number, number, number]; // [Mesial, Mid, Distal]
    lingual: [number, number, number]; // [Mesial, Mid, Distal]
  };
  recessionValues: {
    facial: [number, number, number];
    lingual: [number, number, number];
  };
  mobilityGrade: number; // 0-3
  bleeding: {
    facial: [boolean, boolean, boolean];
    lingual: [boolean, boolean, boolean];
  };
  plaque: {
    facial: [boolean, boolean, boolean];
    lingual: [boolean, boolean, boolean];
  };
  calculus: {
    facial: [boolean, boolean, boolean];
    lingual: [boolean, boolean, boolean];
  };
  suppuration: {
    facial: [boolean, boolean, boolean];
    lingual: [boolean, boolean, boolean];
  };
  furcation: {
    facial: [number, number]; // Grade 0-3
    lingual: [number, number]; // Grade 0-3
  };
  implant: boolean;
  restoration: {
    type: string; // "none", "crown", "implant", "bridge", etc.
    surfaces: string[]; // "M", "D", "F", "L", "O"
  };
}

// Interface for perio chart data
interface PerioChartData {
  patientId: number;
  chartDate: Date;
  teeth: Record<number, ToothData>;
  notes: string;
  examinerId: number;
  bop: number; // Bleeding on probing percentage
  plaque: number; // Plaque index percentage
}

// Component props
interface EnhancedPerioChartProps {
  patientId: number;
  examinerId: number;
  existingChartData?: PerioChartData;
  readOnly?: boolean;
  onSave?: (data: PerioChartData) => void;
}

// Helper function to create an empty tooth data structure
const createEmptyToothData = (toothId: number): ToothData => ({
  id: toothId,
  pocketDepths: {
    facial: [0, 0, 0],
    lingual: [0, 0, 0]
  },
  recessionValues: {
    facial: [0, 0, 0],
    lingual: [0, 0, 0]
  },
  mobilityGrade: 0,
  bleeding: {
    facial: [false, false, false],
    lingual: [false, false, false]
  },
  plaque: {
    facial: [false, false, false],
    lingual: [false, false, false]
  },
  calculus: {
    facial: [false, false, false],
    lingual: [false, false, false]
  },
  suppuration: {
    facial: [false, false, false],
    lingual: [false, false, false]
  },
  furcation: {
    facial: [0, 0],
    lingual: [0, 0]
  },
  implant: false,
  restoration: {
    type: "none",
    surfaces: []
  }
});

// Initialize an empty periodontal chart
const initializeEmptyChart = (patientId: number, examinerId: number): PerioChartData => {
  const teeth: Record<number, ToothData> = {};
  
  // Create all teeth 1-32
  for (let i = 1; i <= 32; i++) {
    teeth[i] = createEmptyToothData(i);
  }
  
  return {
    patientId,
    chartDate: new Date(),
    teeth,
    notes: "",
    examinerId,
    bop: 0,
    plaque: 0
  };
};

// Calculate attachment loss (CAL = PD + Recession)
const calculateAttachmentLoss = (pocketDepth: number, recession: number): number => {
  return pocketDepth + recession;
};

// Main periodontal chart component
const EnhancedPerioChart: React.FC<EnhancedPerioChartProps> = ({
  patientId,
  examinerId,
  existingChartData,
  readOnly = false,
  onSave
}) => {
  // State
  const [chartData, setChartData] = useState<PerioChartData>(
    existingChartData || initializeEmptyChart(patientId, examinerId)
  );
  const [selectedArch, setSelectedArch] = useState<'upper' | 'lower'>('upper');
  const [selectedMeasurement, setSelectedMeasurement] = useState('pocketDepth');
  const [selectedSurface, setSelectedSurface] = useState<'facial' | 'lingual'>('facial');
  
  // Calculate statistics
  const calculateStats = () => {
    // Count BOP sites
    let bleedingSites = 0;
    let totalSites = 0;
    let plaqueSites = 0;
    
    Object.values(chartData.teeth).forEach(tooth => {
      // Count facial sites
      for (let i = 0; i < 3; i++) {
        totalSites += 2; // Facial + Lingual = 2 sites per position
        
        if (tooth.bleeding.facial[i]) bleedingSites++;
        if (tooth.bleeding.lingual[i]) bleedingSites++;
        
        if (tooth.plaque.facial[i]) plaqueSites++;
        if (tooth.plaque.lingual[i]) plaqueSites++;
      }
    });
    
    // Update percentages
    setChartData(prev => ({
      ...prev,
      bop: totalSites > 0 ? Math.round((bleedingSites / totalSites) * 100) : 0,
      plaque: totalSites > 0 ? Math.round((plaqueSites / totalSites) * 100) : 0
    }));
  };
  
  // Update statistics when chart data changes
  useEffect(() => {
    calculateStats();
  }, [chartData.teeth]);
  
  // Save the periodontal chart
  const savePerioChart = () => {
    if (onSave) {
      onSave(chartData);
    }
    console.log('Saving perio chart:', chartData);
  };
  
  // Update pocket depth value
  const updatePocketDepth = (
    toothId: number,
    surface: 'facial' | 'lingual',
    position: 0 | 1 | 2, // 0: Mesial, 1: Middle, 2: Distal
    value: number
  ) => {
    if (readOnly) return;
    
    setChartData(prev => {
      const updatedTeeth = { ...prev.teeth };
      updatedTeeth[toothId] = {
        ...updatedTeeth[toothId],
        pocketDepths: {
          ...updatedTeeth[toothId].pocketDepths,
          [surface]: [0, 0, 0].map((_, i) => i === position ? value : updatedTeeth[toothId].pocketDepths[surface][i]) as [number, number, number]
        }
      };
      
      return {
        ...prev,
        teeth: updatedTeeth
      };
    });
  };
  
  // Update recession value
  const updateRecession = (
    toothId: number,
    surface: 'facial' | 'lingual',
    position: 0 | 1 | 2,
    value: number
  ) => {
    if (readOnly) return;
    
    setChartData(prev => {
      const updatedTeeth = { ...prev.teeth };
      updatedTeeth[toothId] = {
        ...updatedTeeth[toothId],
        recessionValues: {
          ...updatedTeeth[toothId].recessionValues,
          [surface]: [0, 0, 0].map((_, i) => i === position ? value : updatedTeeth[toothId].recessionValues[surface][i]) as [number, number, number]
        }
      };
      
      return {
        ...prev,
        teeth: updatedTeeth
      };
    });
  };
  
  // Toggle bleeding, suppuration, plaque, calculus
  const toggleBooleanValue = (
    toothId: number,
    property: 'bleeding' | 'suppuration' | 'plaque' | 'calculus',
    surface: 'facial' | 'lingual',
    position: 0 | 1 | 2
  ) => {
    if (readOnly) return;
    
    setChartData(prev => {
      const updatedTeeth = { ...prev.teeth };
      const currentValue = updatedTeeth[toothId][property][surface][position];
      
      updatedTeeth[toothId] = {
        ...updatedTeeth[toothId],
        [property]: {
          ...updatedTeeth[toothId][property],
          [surface]: [false, false, false].map((_, i) => i === position ? !currentValue : updatedTeeth[toothId][property][surface][i]) as [boolean, boolean, boolean]
        }
      };
      
      return {
        ...prev,
        teeth: updatedTeeth
      };
    });
  };
  
  // Update mobility grade
  const updateMobility = (toothId: number, value: number) => {
    if (readOnly) return;
    
    setChartData(prev => {
      const updatedTeeth = { ...prev.teeth };
      updatedTeeth[toothId] = {
        ...updatedTeeth[toothId],
        mobilityGrade: value
      };
      
      return {
        ...prev,
        teeth: updatedTeeth
      };
    });
  };
  
  // Update furcation grade
  const updateFurcation = (
    toothId: number,
    surface: 'facial' | 'lingual',
    position: 0 | 1,
    value: number
  ) => {
    if (readOnly) return;
    
    setChartData(prev => {
      const updatedTeeth = { ...prev.teeth };
      updatedTeeth[toothId] = {
        ...updatedTeeth[toothId],
        furcation: {
          ...updatedTeeth[toothId].furcation,
          [surface]: [0, 0].map((_, i) => i === position ? value : updatedTeeth[toothId].furcation[surface][i]) as [number, number]
        }
      };
      
      return {
        ...prev,
        teeth: updatedTeeth
      };
    });
  };
  
  // Get the background color for pocket depth cells
  const getPocketDepthColor = (value: number) => {
    if (value <= 3) return "bg-green-100";
    if (value <= 5) return "bg-yellow-100";
    return "bg-red-100";
  };
  
  // Get the background color for recession cells
  const getRecessionColor = (value: number) => {
    if (value === 0) return "bg-green-100";
    if (value <= 2) return "bg-yellow-100";
    return "bg-red-100";
  };
  
  // Get the background color for attachment loss cells
  const getAttachmentLossColor = (value: number) => {
    if (value <= 2) return "bg-green-100";
    if (value <= 4) return "bg-yellow-100";
    return "bg-red-100";
  };
  
  // Get the current teeth array based on selected arch
  const currentTeeth = selectedArch === 'upper' ? ADULT_TEETH_UPPER : ADULT_TEETH_LOWER;
  
  // Render the measurement table for pocket depth, recession, attachment loss
  const renderNumericMeasurementTable = (
    measurementType: 'pocketDepth' | 'recession' | 'attachmentLoss'
  ) => {
    const isAttachmentLoss = measurementType === 'attachmentLoss';
    const getColorFn = measurementType === 'pocketDepth' 
      ? getPocketDepthColor 
      : measurementType === 'recession' 
        ? getRecessionColor 
        : getAttachmentLossColor;
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium">
            {measurementType === 'pocketDepth' 
              ? 'Pocket Depth (mm)' 
              : measurementType === 'recession' 
                ? 'Recession (mm)' 
                : 'Attachment Loss (mm)'} - {selectedSurface === 'facial' ? 'Facial' : 'Lingual'}
          </h3>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSelectedSurface('facial')}
              className={selectedSurface === 'facial' ? 'bg-primary text-white' : ''}
            >
              Facial
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSelectedSurface('lingual')}
              className={selectedSurface === 'lingual' ? 'bg-primary text-white' : ''}
            >
              Lingual
            </Button>
          </div>
        </div>
        
        <div className="border rounded-md">
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
              {currentTeeth.map(toothId => {
                const tooth = chartData.teeth[toothId];
                
                // Calculate values for each position
                const values = [0, 1, 2].map(position => {
                  if (isAttachmentLoss) {
                    const pd = tooth.pocketDepths[selectedSurface][position];
                    const rec = tooth.recessionValues[selectedSurface][position];
                    return calculateAttachmentLoss(pd, rec);
                  }
                  return tooth[measurementType === 'pocketDepth' ? 'pocketDepths' : 'recessionValues'][selectedSurface][position];
                });
                
                return (
                  <TableRow key={`tooth-${toothId}-${measurementType}`}>
                    <TableCell className="font-medium">{toothId}</TableCell>
                    {[0, 1, 2].map(position => (
                      <TableCell
                        key={`tooth-${toothId}-${measurementType}-${position}`}
                        className={`text-center p-0 ${getColorFn(values[position])}`}
                      >
                        {isAttachmentLoss ? (
                          <div className="h-10 flex items-center justify-center text-sm">
                            {values[position]}
                          </div>
                        ) : (
                          <Input
                            type="number"
                            min="0"
                            max="15"
                            className="h-10 border-0 text-center bg-transparent"
                            value={values[position]}
                            onChange={(e) => {
                              const newValue = e.target.value === '' ? 0 : parseInt(e.target.value);
                              if (measurementType === 'pocketDepth') {
                                updatePocketDepth(toothId, selectedSurface, position as 0 | 1 | 2, newValue);
                              } else {
                                updateRecession(toothId, selectedSurface, position as 0 | 1 | 2, newValue);
                              }
                            }}
                            disabled={readOnly || isAttachmentLoss}
                          />
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };
  
  // Render the boolean measurement table (bleeding, suppuration, plaque, calculus)
  const renderBooleanMeasurementTable = (
    measurementType: 'bleeding' | 'suppuration' | 'plaque' | 'calculus'
  ) => {
    const title = {
      bleeding: 'Bleeding on Probing',
      suppuration: 'Suppuration',
      plaque: 'Plaque',
      calculus: 'Calculus'
    }[measurementType];
    
    const bgColorClass = {
      bleeding: 'bg-red-100',
      suppuration: 'bg-yellow-100',
      plaque: 'bg-blue-100',
      calculus: 'bg-gray-100'
    }[measurementType];
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium">
            {title} - {selectedSurface === 'facial' ? 'Facial' : 'Lingual'}
          </h3>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSelectedSurface('facial')}
              className={selectedSurface === 'facial' ? 'bg-primary text-white' : ''}
            >
              Facial
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSelectedSurface('lingual')}
              className={selectedSurface === 'lingual' ? 'bg-primary text-white' : ''}
            >
              Lingual
            </Button>
          </div>
        </div>
        
        <div className="border rounded-md">
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
              {currentTeeth.map(toothId => {
                const tooth = chartData.teeth[toothId];
                
                return (
                  <TableRow key={`tooth-${toothId}-${measurementType}`}>
                    <TableCell className="font-medium">{toothId}</TableCell>
                    {[0, 1, 2].map(position => (
                      <TableCell
                        key={`tooth-${toothId}-${measurementType}-${position}`}
                        className={`text-center p-0 cursor-pointer ${
                          tooth[measurementType][selectedSurface][position] ? bgColorClass : 'bg-white'
                        }`}
                        onClick={() => toggleBooleanValue(
                          toothId, 
                          measurementType, 
                          selectedSurface, 
                          position as 0 | 1 | 2
                        )}
                      >
                        <div className="h-10 flex items-center justify-center">
                          {tooth[measurementType][selectedSurface][position] ? '✓' : ''}
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };
  
  // Render the mobility and furcation table
  const renderMobilityFurcationTable = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-medium">
          Mobility & Furcation
        </h3>
        
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Tooth #</TableHead>
                <TableHead className="text-center">Mobility Grade</TableHead>
                <TableHead className="text-center">Furcation - Facial</TableHead>
                <TableHead className="text-center">Furcation - Lingual</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentTeeth.map(toothId => {
                const tooth = chartData.teeth[toothId];
                
                return (
                  <TableRow key={`tooth-${toothId}-mobility-furcation`}>
                    <TableCell className="font-medium">{toothId}</TableCell>
                    <TableCell className="text-center p-0">
                      <Select 
                        value={tooth.mobilityGrade.toString()} 
                        onValueChange={(value) => updateMobility(toothId, parseInt(value))}
                        disabled={readOnly}
                      >
                        <SelectTrigger className="h-10 border-0 text-center bg-transparent">
                          <SelectValue placeholder="0" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0</SelectItem>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-center p-0">
                      <Select 
                        value={tooth.furcation.facial[0].toString()} 
                        onValueChange={(value) => updateFurcation(toothId, 'facial', 0, parseInt(value))}
                        disabled={readOnly}
                      >
                        <SelectTrigger className="h-10 border-0 text-center bg-transparent">
                          <SelectValue placeholder="0" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0</SelectItem>
                          <SelectItem value="1">I</SelectItem>
                          <SelectItem value="2">II</SelectItem>
                          <SelectItem value="3">III</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-center p-0">
                      <Select 
                        value={tooth.furcation.lingual[0].toString()} 
                        onValueChange={(value) => updateFurcation(toothId, 'lingual', 0, parseInt(value))}
                        disabled={readOnly}
                      >
                        <SelectTrigger className="h-10 border-0 text-center bg-transparent">
                          <SelectValue placeholder="0" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0</SelectItem>
                          <SelectItem value="1">I</SelectItem>
                          <SelectItem value="2">II</SelectItem>
                          <SelectItem value="3">III</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })}
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
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="text-sm font-medium">BOP: <span className="text-primary">{chartData.bop}%</span></div>
              <div className="text-sm font-medium">PI: <span className="text-primary">{chartData.plaque}%</span></div>
              <div className="text-sm text-muted-foreground">
                {new Date(chartData.chartDate).toLocaleDateString()}
              </div>
            </div>
            
            {!readOnly && (
              <Button onClick={savePerioChart}>
                <Save className="h-4 w-4 mr-2" />
                Save Chart
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Select Arch</h3>
            <div className="flex space-x-2">
              <Button 
                variant={selectedArch === 'upper' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setSelectedArch('upper')}
              >
                Upper Arch (1-16)
              </Button>
              <Button 
                variant={selectedArch === 'lower' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setSelectedArch('lower')}
              >
                Lower Arch (17-32)
              </Button>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-2">Select Measurement</h3>
            <ScrollArea className="h-10 whitespace-nowrap">
              <div className="flex space-x-1">
                {MEASUREMENT_TYPES.map(type => (
                  <Button 
                    key={type.id} 
                    variant={selectedMeasurement === type.id ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setSelectedMeasurement(type.id)}
                  >
                    {type.name}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
        
        <Separator />
        
        {/* Display teeth diagram */}
        <div className="border rounded-md p-4 bg-gray-50">
          <div className="flex justify-center mb-4">
            <div className="text-center">
              <h3 className="text-sm font-medium mb-2">
                {selectedArch === 'upper' ? 'Upper Arch' : 'Lower Arch'}
              </h3>
              <div className="flex justify-center gap-1 p-2">
                {currentTeeth.map(toothId => (
                  <div 
                    key={`tooth-icon-${toothId}`}
                    className="w-8 h-12 border border-gray-300 rounded flex items-center justify-center bg-white"
                  >
                    <span className="text-sm font-medium">{toothId}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Measurement tables */}
        {selectedMeasurement === 'pocketDepth' && renderNumericMeasurementTable('pocketDepth')}
        {selectedMeasurement === 'recession' && renderNumericMeasurementTable('recession')}
        {selectedMeasurement === 'attachmentLoss' && renderNumericMeasurementTable('attachmentLoss')}
        {selectedMeasurement === 'bleeding' && renderBooleanMeasurementTable('bleeding')}
        {selectedMeasurement === 'suppuration' && renderBooleanMeasurementTable('suppuration')}
        {selectedMeasurement === 'plaque' && renderBooleanMeasurementTable('plaque')}
        {selectedMeasurement === 'mobility' && renderMobilityFurcationTable()}
        
        {/* Chart notes */}
        <div className="border rounded-md p-4">
          <h3 className="text-sm font-medium mb-2">Chart Notes</h3>
          <Textarea 
            placeholder="Enter notes about this periodontal examination..."
            value={chartData.notes}
            onChange={(e) => setChartData(prev => ({ ...prev, notes: e.target.value }))}
            disabled={readOnly}
            className="min-h-[100px]"
          />
        </div>
        
        {/* Legend */}
        <div className="border rounded-md p-4">
          <h3 className="text-sm font-medium mb-2">Legend</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <h4 className="text-xs font-medium mb-1">Pocket Depth</h4>
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
              <h4 className="text-xs font-medium mb-1">Recession</h4>
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
              <h4 className="text-xs font-medium mb-1">Clinical Attachment Loss</h4>
              <div className="space-y-1">
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-1 bg-green-100 border border-gray-300"></div>
                  <span className="text-xs">0-2 mm (Mild)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-1 bg-yellow-100 border border-gray-300"></div>
                  <span className="text-xs">3-4 mm (Moderate)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-1 bg-red-100 border border-gray-300"></div>
                  <span className="text-xs">5+ mm (Severe)</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-xs font-medium mb-1">Other Indicators</h4>
              <div className="space-y-1">
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-1 bg-red-100 border border-gray-300 flex items-center justify-center text-xs">✓</div>
                  <span className="text-xs">Bleeding on Probing (BOP)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-1 bg-yellow-100 border border-gray-300 flex items-center justify-center text-xs">✓</div>
                  <span className="text-xs">Suppuration</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-1 bg-blue-100 border border-gray-300 flex items-center justify-center text-xs">✓</div>
                  <span className="text-xs">Plaque</span>
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
                <p>Click on cells to toggle bleeding, suppuration, and plaque indicators</p>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs text-xs">
                For pocket depth and recession, enter values directly in millimeters.
                Click on bleeding, suppuration, and plaque cells to toggle them on/off.
                Select mobility and furcation values from the dropdown menus.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {!readOnly && (
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Chart
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default EnhancedPerioChart;