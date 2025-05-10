import React, { useState, useEffect } from 'react';
import { PatientAPI } from '../../lib/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
  ToggleGroup,
  ToggleGroupItem,
  Badge
} from '../ui/components';
import {
  Save,
  Printer,
  Download,
  RotateCcw,
  AlertTriangle,
  HelpCircle,
  Teeth,
  Calendar
} from 'lucide-react';

interface EnhancedPerioChartProps {
  patientId: string;
  existingChartId?: string;
  readOnly?: boolean;
  onSave?: (chartData: PerioChart) => void;
}

interface ToothMeasurements {
  tooth_number: string;
  pocket_depths: {
    MB: number;
    B: number;
    DB: number;
    ML: number;
    L: number;
    DL: number;
  };
  recession?: {
    MB: number;
    B: number;
    DB: number;
    ML: number;
    L: number;
    DL: number;
  };
  mobility?: number;
  furcation?: {
    B?: number;
    ML?: number;
    DL?: number;
  };
  bleeding?: {
    MB: boolean;
    B: boolean;
    DB: boolean;
    ML: boolean;
    L: boolean;
    DL: boolean;
  };
}

interface PerioChart {
  id: string;
  patient_id: string;
  exam_date: string;
  teeth: ToothMeasurements[];
  notes?: string;
}

// Define all teeth in the full mouth
const allTeeth = [
  // Upper Right
  '1', '2', '3', '4', '5', '6', '7', '8',
  // Upper Left
  '9', '10', '11', '12', '13', '14', '15', '16',
  // Lower Left
  '17', '18', '19', '20', '21', '22', '23', '24',
  // Lower Right
  '25', '26', '27', '28', '29', '30', '31', '32'
];

export const EnhancedPerioChart: React.FC<EnhancedPerioChartProps> = ({
  patientId,
  existingChartId,
  readOnly = false,
  onSave
}) => {
  // State for chart data
  const [chartData, setChartData] = useState<PerioChart | null>(null);
  const [previousCharts, setPreviousCharts] = useState<PerioChart[]>([]);
  const [comparisonChartId, setComparisonChartId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('pockets');
  const [activeAreas, setActiveAreas] = useState<string[]>(['upper', 'lower']);
  const [activeQuadrants, setActiveQuadrants] = useState<string[]>(['ur', 'ul', 'll', 'lr']);
  const [showMobilityAndFurcation, setShowMobilityAndFurcation] = useState(true);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [activeTooth, setActiveTooth] = useState<string | null>(null);
  
  // Load existing chart data or create new chart
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch previous charts
        const patientCharts = await PatientAPI.getPatientPerioCharts(patientId);
        setPreviousCharts(patientCharts);
        
        if (existingChartId) {
          // Load existing chart
          const chartToLoad = patientCharts.find(chart => chart.id === existingChartId);
          if (chartToLoad) {
            setChartData(chartToLoad);
            setNotes(chartToLoad.notes || '');
          } else {
            throw new Error('Chart not found');
          }
        } else {
          // Create new chart data
          const newChart: PerioChart = {
            id: `chart-${Date.now()}`, // Temporary ID
            patient_id: patientId,
            exam_date: new Date().toISOString(),
            teeth: createEmptyTeethData()
          };
          setChartData(newChart);
        }
      } catch (err) {
        console.error('Error loading chart data:', err);
        setError('Failed to load periodontal chart data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [patientId, existingChartId]);
  
  // Create empty teeth data for a new chart
  const createEmptyTeethData = (): ToothMeasurements[] => {
    return allTeeth.map(tooth_number => ({
      tooth_number,
      pocket_depths: { MB: 0, B: 0, DB: 0, ML: 0, L: 0, DL: 0 },
      recession: { MB: 0, B: 0, DB: 0, ML: 0, L: 0, DL: 0 },
      mobility: 0,
      furcation: {},
      bleeding: { MB: false, B: false, DB: false, ML: false, L: false, DL: false }
    }));
  };
  
  // Save the chart data
  const handleSave = async () => {
    if (!chartData) return;
    
    setIsSaving(true);
    
    try {
      // Add notes to chart data
      const chartWithNotes = {
        ...chartData,
        notes
      };
      
      // In a real app, this would save to the backend
      if (onSave) {
        onSave(chartWithNotes);
      }
      
      // Success feedback would go here
    } catch (err) {
      console.error('Error saving chart:', err);
      setError('Failed to save the chart. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle pocket depth input change
  const handlePocketDepthChange = (tooth: string, site: string, value: number) => {
    if (readOnly || !chartData) return;
    
    setChartData(prevData => {
      if (!prevData) return null;
      
      return {
        ...prevData,
        teeth: prevData.teeth.map(toothData => {
          if (toothData.tooth_number === tooth) {
            return {
              ...toothData,
              pocket_depths: {
                ...toothData.pocket_depths,
                [site]: value
              }
            };
          }
          return toothData;
        })
      };
    });
  };
  
  // Handle recession input change
  const handleRecessionChange = (tooth: string, site: string, value: number) => {
    if (readOnly || !chartData) return;
    
    setChartData(prevData => {
      if (!prevData) return null;
      
      return {
        ...prevData,
        teeth: prevData.teeth.map(toothData => {
          if (toothData.tooth_number === tooth) {
            return {
              ...toothData,
              recession: {
                ...toothData.recession,
                [site]: value
              }
            };
          }
          return toothData;
        })
      };
    });
  };
  
  // Handle bleeding toggle
  const handleBleedingToggle = (tooth: string, site: string) => {
    if (readOnly || !chartData) return;
    
    setChartData(prevData => {
      if (!prevData) return null;
      
      return {
        ...prevData,
        teeth: prevData.teeth.map(toothData => {
          if (toothData.tooth_number === tooth) {
            return {
              ...toothData,
              bleeding: {
                ...toothData.bleeding,
                [site]: !toothData.bleeding?.[site]
              }
            };
          }
          return toothData;
        })
      };
    });
  };
  
  // Handle mobility change
  const handleMobilityChange = (tooth: string, value: number) => {
    if (readOnly || !chartData) return;
    
    setChartData(prevData => {
      if (!prevData) return null;
      
      return {
        ...prevData,
        teeth: prevData.teeth.map(toothData => {
          if (toothData.tooth_number === tooth) {
            return {
              ...toothData,
              mobility: value
            };
          }
          return toothData;
        })
      };
    });
  };
  
  // Handle furcation change
  const handleFurcationChange = (tooth: string, site: string, value: number) => {
    if (readOnly || !chartData) return;
    
    setChartData(prevData => {
      if (!prevData) return null;
      
      return {
        ...prevData,
        teeth: prevData.teeth.map(toothData => {
          if (toothData.tooth_number === tooth) {
            return {
              ...toothData,
              furcation: {
                ...toothData.furcation,
                [site]: value
              }
            };
          }
          return toothData;
        })
      };
    });
  };
  
  // Get tooth data from chart
  const getToothData = (toothNumber: string): ToothMeasurements | undefined => {
    if (!chartData) return undefined;
    return chartData.teeth.find(tooth => tooth.tooth_number === toothNumber);
  };
  
  // Get comparison tooth data
  const getComparisonToothData = (toothNumber: string): ToothMeasurements | undefined => {
    if (!comparisonChartId) return undefined;
    const comparisonChart = previousCharts.find(chart => chart.id === comparisonChartId);
    if (!comparisonChart) return undefined;
    return comparisonChart.teeth.find(tooth => tooth.tooth_number === toothNumber);
  };
  
  // Calculate pocket depth change
  const getPocketDepthChange = (tooth: string, site: string): number => {
    const currentTooth = getToothData(tooth);
    const previousTooth = getComparisonToothData(tooth);
    
    if (!currentTooth || !previousTooth) return 0;
    
    return currentTooth.pocket_depths[site] - previousTooth.pocket_depths[site];
  };
  
  // Determine pocket depth class based on value
  const getPocketDepthClass = (value: number): string => {
    if (value <= 0) return 'text-gray-400';
    if (value <= 3) return 'text-green-600';
    if (value <= 5) return 'text-yellow-600';
    return 'text-red-600 font-bold';
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-t-blue-500 border-b-blue-500 border-l-transparent border-r-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading periodontal chart...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
            <p className="mt-4 text-gray-600">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Determine which teeth to display based on active areas and quadrants
  const getVisibleTeeth = (): string[] => {
    let teeth: string[] = [];
    
    if (activeAreas.includes('upper')) {
      if (activeQuadrants.includes('ur')) {
        teeth = teeth.concat(['1', '2', '3', '4', '5', '6', '7', '8']);
      }
      if (activeQuadrants.includes('ul')) {
        teeth = teeth.concat(['9', '10', '11', '12', '13', '14', '15', '16']);
      }
    }
    
    if (activeAreas.includes('lower')) {
      if (activeQuadrants.includes('ll')) {
        teeth = teeth.concat(['17', '18', '19', '20', '21', '22', '23', '24']);
      }
      if (activeQuadrants.includes('lr')) {
        teeth = teeth.concat(['25', '26', '27', '28', '29', '30', '31', '32']);
      }
    }
    
    return teeth;
  };
  
  // Get visible teeth
  const visibleTeeth = getVisibleTeeth();
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Periodontal Chart</CardTitle>
            <CardDescription>
              {existingChartId 
                ? `Exam date: ${new Date(chartData?.exam_date || '').toLocaleDateString()}`
                : 'New examination'}
            </CardDescription>
          </div>
          
          <div className="flex space-x-2">
            {!readOnly && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-1" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4 mr-1" />
              Print
            </Button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4">
          {/* Comparison chart selector */}
          {previousCharts.length > 1 && (
            <Select
              value={comparisonChartId || ''}
              onValueChange={setComparisonChartId}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Compare with..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No comparison</SelectItem>
                {previousCharts
                  .filter(chart => chart.id !== existingChartId)
                  .map(chart => (
                    <SelectItem key={chart.id} value={chart.id}>
                      {new Date(chart.exam_date).toLocaleDateString()}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
          
          {/* Area toggles */}
          <ToggleGroup 
            type="multiple" 
            value={activeAreas}
            onValueChange={(value) => {
              if (value.length > 0) setActiveAreas(value);
            }}
          >
            <ToggleGroupItem value="upper" aria-label="Upper Teeth">
              Upper
            </ToggleGroupItem>
            <ToggleGroupItem value="lower" aria-label="Lower Teeth">
              Lower
            </ToggleGroupItem>
          </ToggleGroup>
          
          {/* Quadrant toggles */}
          <ToggleGroup 
            type="multiple" 
            value={activeQuadrants}
            onValueChange={(value) => {
              if (value.length > 0) setActiveQuadrants(value);
            }}
          >
            <ToggleGroupItem value="ur" aria-label="Upper Right">
              UR
            </ToggleGroupItem>
            <ToggleGroupItem value="ul" aria-label="Upper Left">
              UL
            </ToggleGroupItem>
            <ToggleGroupItem value="ll" aria-label="Lower Left">
              LL
            </ToggleGroupItem>
            <ToggleGroupItem value="lr" aria-label="Lower Right">
              LR
            </ToggleGroupItem>
          </ToggleGroup>
          
          {/* Mobility & Furcation toggle */}
          <Button
            variant={showMobilityAndFurcation ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowMobilityAndFurcation(!showMobilityAndFurcation)}
          >
            <HelpCircle className="h-4 w-4 mr-1" />
            {showMobilityAndFurcation ? "Hide Mobility & Furcation" : "Show Mobility & Furcation"}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="pockets">Pocket Depths</TabsTrigger>
            <TabsTrigger value="recession">Recession</TabsTrigger>
            <TabsTrigger value="mobility">Mobility & Furcation</TabsTrigger>
            <TabsTrigger value="bleeding">Bleeding</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pockets" className="mt-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-2 border text-xs">Tooth #</th>
                    <th className="p-2 border text-xs">Distal Buccal</th>
                    <th className="p-2 border text-xs">Buccal</th>
                    <th className="p-2 border text-xs">Mesial Buccal</th>
                    <th className="p-2 border text-xs">Distal Lingual</th>
                    <th className="p-2 border text-xs">Lingual</th>
                    <th className="p-2 border text-xs">Mesial Lingual</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTeeth.map(tooth => {
                    const toothData = getToothData(tooth);
                    if (!toothData) return null;
                    
                    return (
                      <tr 
                        key={tooth}
                        className={activeTooth === tooth ? 'bg-blue-50' : ''}
                        onClick={() => setActiveTooth(activeTooth === tooth ? null : tooth)}
                      >
                        <td className="p-2 border text-center font-bold">{tooth}</td>
                        <td className="p-2 border text-center">
                          <div className={getPocketDepthClass(toothData.pocket_depths.DB)}>
                            {toothData.pocket_depths.DB || '0'}
                            {comparisonChartId && (
                              <span className="ml-1 text-xs">
                                {getPocketDepthChange(tooth, 'DB') > 0 && '+'}
                                {getPocketDepthChange(tooth, 'DB') !== 0 && getPocketDepthChange(tooth, 'DB')}
                              </span>
                            )}
                          </div>
                          {!readOnly && (
                            <Input
                              type="number"
                              min="0"
                              max="10"
                              value={toothData.pocket_depths.DB || 0}
                              onChange={(e) => handlePocketDepthChange(tooth, 'DB', parseInt(e.target.value) || 0)}
                              className="mt-1 w-16 h-6 text-xs"
                            />
                          )}
                        </td>
                        <td className="p-2 border text-center">
                          <div className={getPocketDepthClass(toothData.pocket_depths.B)}>
                            {toothData.pocket_depths.B || '0'}
                            {comparisonChartId && (
                              <span className="ml-1 text-xs">
                                {getPocketDepthChange(tooth, 'B') > 0 && '+'}
                                {getPocketDepthChange(tooth, 'B') !== 0 && getPocketDepthChange(tooth, 'B')}
                              </span>
                            )}
                          </div>
                          {!readOnly && (
                            <Input
                              type="number"
                              min="0"
                              max="10"
                              value={toothData.pocket_depths.B || 0}
                              onChange={(e) => handlePocketDepthChange(tooth, 'B', parseInt(e.target.value) || 0)}
                              className="mt-1 w-16 h-6 text-xs"
                            />
                          )}
                        </td>
                        <td className="p-2 border text-center">
                          <div className={getPocketDepthClass(toothData.pocket_depths.MB)}>
                            {toothData.pocket_depths.MB || '0'}
                            {comparisonChartId && (
                              <span className="ml-1 text-xs">
                                {getPocketDepthChange(tooth, 'MB') > 0 && '+'}
                                {getPocketDepthChange(tooth, 'MB') !== 0 && getPocketDepthChange(tooth, 'MB')}
                              </span>
                            )}
                          </div>
                          {!readOnly && (
                            <Input
                              type="number"
                              min="0"
                              max="10"
                              value={toothData.pocket_depths.MB || 0}
                              onChange={(e) => handlePocketDepthChange(tooth, 'MB', parseInt(e.target.value) || 0)}
                              className="mt-1 w-16 h-6 text-xs"
                            />
                          )}
                        </td>
                        <td className="p-2 border text-center">
                          <div className={getPocketDepthClass(toothData.pocket_depths.DL)}>
                            {toothData.pocket_depths.DL || '0'}
                            {comparisonChartId && (
                              <span className="ml-1 text-xs">
                                {getPocketDepthChange(tooth, 'DL') > 0 && '+'}
                                {getPocketDepthChange(tooth, 'DL') !== 0 && getPocketDepthChange(tooth, 'DL')}
                              </span>
                            )}
                          </div>
                          {!readOnly && (
                            <Input
                              type="number"
                              min="0"
                              max="10"
                              value={toothData.pocket_depths.DL || 0}
                              onChange={(e) => handlePocketDepthChange(tooth, 'DL', parseInt(e.target.value) || 0)}
                              className="mt-1 w-16 h-6 text-xs"
                            />
                          )}
                        </td>
                        <td className="p-2 border text-center">
                          <div className={getPocketDepthClass(toothData.pocket_depths.L)}>
                            {toothData.pocket_depths.L || '0'}
                            {comparisonChartId && (
                              <span className="ml-1 text-xs">
                                {getPocketDepthChange(tooth, 'L') > 0 && '+'}
                                {getPocketDepthChange(tooth, 'L') !== 0 && getPocketDepthChange(tooth, 'L')}
                              </span>
                            )}
                          </div>
                          {!readOnly && (
                            <Input
                              type="number"
                              min="0"
                              max="10"
                              value={toothData.pocket_depths.L || 0}
                              onChange={(e) => handlePocketDepthChange(tooth, 'L', parseInt(e.target.value) || 0)}
                              className="mt-1 w-16 h-6 text-xs"
                            />
                          )}
                        </td>
                        <td className="p-2 border text-center">
                          <div className={getPocketDepthClass(toothData.pocket_depths.ML)}>
                            {toothData.pocket_depths.ML || '0'}
                            {comparisonChartId && (
                              <span className="ml-1 text-xs">
                                {getPocketDepthChange(tooth, 'ML') > 0 && '+'}
                                {getPocketDepthChange(tooth, 'ML') !== 0 && getPocketDepthChange(tooth, 'ML')}
                              </span>
                            )}
                          </div>
                          {!readOnly && (
                            <Input
                              type="number"
                              min="0"
                              max="10"
                              value={toothData.pocket_depths.ML || 0}
                              onChange={(e) => handlePocketDepthChange(tooth, 'ML', parseInt(e.target.value) || 0)}
                              className="mt-1 w-16 h-6 text-xs"
                            />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>
          
          {/* Similar TabsContent sections for recession, mobility, and bleeding tabs would go here */}
          
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex flex-col items-start">
        <div className="w-full">
          <h3 className="text-sm font-medium mb-2">Notes</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full h-24 p-2 border rounded"
            placeholder="Enter clinical notes here..."
            disabled={readOnly}
          />
          
          {!readOnly && (
            <div className="flex justify-end mt-4">
              <Button
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Chart'}
              </Button>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}; 