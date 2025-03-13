import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Save,
  ArrowLeft,
  ArrowRight,
  Info,
  ClipboardEdit,
  Upload,
  Download,
  BarChart,
  AlertTriangle,
  Printer,
  Maximize2,
  PanelRight,
  Eye,
  FileText
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

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
  id?: number;
  patientId: number;
  date: string;
  examiner: string;
  notes: string;
  lastUpdated: string;
  teeth: ToothPerioData[];
}

interface PerioChartProps {
  patientId: number;
  patientName?: string;
  initialData?: PerioChartData;
  readOnly?: boolean;
  onSave?: (data: PerioChartData) => void;
}

interface AIAnalysis {
  healthScore: number;
  bleedingIndex: number;
  severeSites: number;
  findings: string[];
  recommendations: string[];
}

// Helper functions
const getColorForPocketDepth = (depth: number | null): string => {
  if (depth === null) return '';
  if (depth <= 3) return 'bg-green-100';
  if (depth <= 5) return 'bg-yellow-100';
  return 'bg-red-100';
};

const getColorForRecession = (recession: number | null): string => {
  if (recession === null || recession === 0) return '';
  if (recession <= 2) return 'bg-yellow-100';
  return 'bg-red-100';
};

export default function FixedEnhancedPerioChart({
  patientId,
  patientName = 'Patient',
  initialData,
  readOnly = false,
  onSave
}: PerioChartProps) {
  // Create an initial data structure if none is provided
  const createInitialData = useCallback(() => {
    const defaultMeasurement: PerioMeasurement = {
      pocketDepth: {
        facial: [null, null, null],
        lingual: [null, null, null]
      },
      recession: {
        facial: [null, null, null],
        lingual: [null, null, null]
      },
      bleeding: {
        facial: [false, false, false],
        lingual: [false, false, false]
      },
      suppuration: {
        facial: [false, false, false],
        lingual: [false, false, false]
      },
      mobility: null,
      furcation: {
        facial: null,
        lingual: null,
        mesial: null,
        distal: null
      },
      plaque: false,
      calculus: false
    };

    const upperTeeth = ADULT_TEETH_UPPER.map(id => ({
      id,
      measurements: { ...defaultMeasurement }
    }));

    const lowerTeeth = ADULT_TEETH_LOWER.map(id => ({
      id,
      measurements: { ...defaultMeasurement }
    }));

    return {
      patientId,
      date: new Date().toISOString().split('T')[0],
      examiner: 'Dr. Smith',
      notes: '',
      lastUpdated: new Date().toISOString(),
      teeth: [...upperTeeth, ...lowerTeeth]
    };
  }, [patientId]);

  // State management
  const [chartData, setChartData] = useState<PerioChartData>(initialData || createInitialData());
  
  // UI state
  const [selectedArch, setSelectedArch] = useState<'upper' | 'lower'>('upper');
  const [selectedAspect, setSelectedAspect] = useState<'facial' | 'lingual'>('facial');
  const [selectedView, setSelectedView] = useState<'all' | 'buccal' | 'lingual' | 'occlusal'>('all');
  const [selectedTab, setSelectedTab] = useState<'pocket' | 'recession' | 'mobility' | 'chart'>('pocket');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [inputMode, setInputMode] = useState<'numeric' | 'click'>('numeric');
  
  // Mock AI Analysis (in a real app this would come from an API call)
  const aiAnalysis: AIAnalysis = {
    healthScore: 75,
    bleedingIndex: 23,
    severeSites: 4,
    findings: [
      "23% of sites show bleeding on probing",
      "4 sites with pocket depths ≥ 6mm",
      "Localized recession on teeth 23, 24, 31, 41",
      "Mobility detected on teeth 31, 41"
    ],
    recommendations: [
      "Scaling and root planing for posterior sextants",
      "Improved oral hygiene instruction",
      "Re-evaluation in 6 weeks",
      "Consider maintenance interval of 3 months"
    ]
  };

  // Event handlers
  const updatePocketDepth = (toothId: number, aspect: 'facial' | 'lingual', position: number, value: string) => {
    if (readOnly) return;
    
    setChartData(prev => {
      const newTeeth = prev.teeth.map(tooth => {
        if (tooth.id === toothId) {
          const newMeasurements = { ...tooth.measurements };
          newMeasurements.pocketDepth[aspect][position] = value === '' ? null : parseInt(value);
          return { ...tooth, measurements: newMeasurements };
        }
        return tooth;
      });
      
      return {
        ...prev,
        teeth: newTeeth,
        lastUpdated: new Date().toISOString()
      };
    });
  };

  const updateRecession = (toothId: number, aspect: 'facial' | 'lingual', position: number, value: string) => {
    if (readOnly) return;
    
    setChartData(prev => {
      const newTeeth = prev.teeth.map(tooth => {
        if (tooth.id === toothId) {
          const newMeasurements = { ...tooth.measurements };
          newMeasurements.recession[aspect][position] = value === '' ? null : parseInt(value);
          return { ...tooth, measurements: newMeasurements };
        }
        return tooth;
      });
      
      return {
        ...prev,
        teeth: newTeeth,
        lastUpdated: new Date().toISOString()
      };
    });
  };

  const toggleBleeding = (toothId: number, aspect: 'facial' | 'lingual', position: number) => {
    if (readOnly) return;
    
    setChartData(prev => {
      const newTeeth = prev.teeth.map(tooth => {
        if (tooth.id === toothId) {
          const newMeasurements = { ...tooth.measurements };
          newMeasurements.bleeding[aspect][position] = !newMeasurements.bleeding[aspect][position];
          return { ...tooth, measurements: newMeasurements };
        }
        return tooth;
      });
      
      return {
        ...prev,
        teeth: newTeeth,
        lastUpdated: new Date().toISOString()
      };
    });
  };

  const toggleSuppuration = (toothId: number, aspect: 'facial' | 'lingual', position: number) => {
    if (readOnly) return;
    
    setChartData(prev => {
      const newTeeth = prev.teeth.map(tooth => {
        if (tooth.id === toothId) {
          const newMeasurements = { ...tooth.measurements };
          newMeasurements.suppuration[aspect][position] = !newMeasurements.suppuration[aspect][position];
          return { ...tooth, measurements: newMeasurements };
        }
        return tooth;
      });
      
      return {
        ...prev,
        teeth: newTeeth,
        lastUpdated: new Date().toISOString()
      };
    });
  };

  const updateMobility = (toothId: number, value: string) => {
    if (readOnly) return;
    
    setChartData(prev => {
      const newTeeth = prev.teeth.map(tooth => {
        if (tooth.id === toothId) {
          return {
            ...tooth,
            measurements: {
              ...tooth.measurements,
              mobility: value === '0' ? null : parseInt(value)
            }
          };
        }
        return tooth;
      });
      
      return {
        ...prev,
        teeth: newTeeth,
        lastUpdated: new Date().toISOString()
      };
    });
  };

  const updateFurcation = (toothId: number, location: 'facial' | 'lingual' | 'mesial' | 'distal', value: string) => {
    if (readOnly) return;
    
    setChartData(prev => {
      const newTeeth = prev.teeth.map(tooth => {
        if (tooth.id === toothId) {
          return {
            ...tooth,
            measurements: {
              ...tooth.measurements,
              furcation: {
                ...tooth.measurements.furcation,
                [location]: value === '0' ? null : parseInt(value)
              }
            }
          };
        }
        return tooth;
      });
      
      return {
        ...prev,
        teeth: newTeeth,
        lastUpdated: new Date().toISOString()
      };
    });
  };

  const togglePlaque = (toothId: number) => {
    if (readOnly) return;
    
    setChartData(prev => {
      const newTeeth = prev.teeth.map(tooth => {
        if (tooth.id === toothId) {
          return {
            ...tooth,
            measurements: {
              ...tooth.measurements,
              plaque: !tooth.measurements.plaque
            }
          };
        }
        return tooth;
      });
      
      return {
        ...prev,
        teeth: newTeeth,
        lastUpdated: new Date().toISOString()
      };
    });
  };

  const toggleCalculus = (toothId: number) => {
    if (readOnly) return;
    
    setChartData(prev => {
      const newTeeth = prev.teeth.map(tooth => {
        if (tooth.id === toothId) {
          return {
            ...tooth,
            measurements: {
              ...tooth.measurements,
              calculus: !tooth.measurements.calculus
            }
          };
        }
        return tooth;
      });
      
      return {
        ...prev,
        teeth: newTeeth,
        lastUpdated: new Date().toISOString()
      };
    });
  };

  const handleSave = () => {
    if (readOnly || !onSave) return;
    onSave(chartData);
  };

  // Helper function to get current teeth based on selected arch
  const getCurrentTeeth = () => {
    return chartData.teeth.filter(tooth => {
      if (selectedArch === 'upper') {
        return ADULT_TEETH_UPPER.includes(tooth.id);
      } else {
        return ADULT_TEETH_LOWER.includes(tooth.id);
      }
    });
  };

  // Function to render the pocket depth measurement table
  const renderPocketDepthTable = () => {
    const teeth = getCurrentTeeth();
    
    return (
      <div className="overflow-auto">
        <Table>
          <TableCaption className="mt-2 text-sm font-medium">
            Pocket Depth Measurements (mm) - {selectedAspect === 'facial' ? 'Facial' : 'Lingual'} Aspect
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Tooth #</TableHead>
              <TableHead>Mesial</TableHead>
              <TableHead>Mid</TableHead>
              <TableHead>Distal</TableHead>
              <TableHead>Mobility</TableHead>
              <TableHead>Plaque</TableHead>
              <TableHead>Calculus</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teeth.map(tooth => (
              <TableRow key={`pd-${tooth.id}`}>
                <TableCell className="font-medium text-center">{tooth.id}</TableCell>
                
                {/* Pocket Depth Cells */}
                {[0, 1, 2].map(position => (
                  <TableCell 
                    key={`pd-${tooth.id}-${position}`}
                    className={getColorForPocketDepth(tooth.measurements.pocketDepth[selectedAspect][position])}
                  >
                    {inputMode === 'numeric' ? (
                      <Input
                        type="number"
                        min="0"
                        max="15"
                        className="h-8 w-14 text-center"
                        value={tooth.measurements.pocketDepth[selectedAspect][position] === null ? '' : tooth.measurements.pocketDepth[selectedAspect][position] || ''}
                        onChange={(e) => updatePocketDepth(tooth.id, selectedAspect, position, e.target.value)}
                        disabled={readOnly}
                      />
                    ) : (
                      <div
                        onClick={() => {
                          if (readOnly) return;
                          const currentValue = tooth.measurements.pocketDepth[selectedAspect][position];
                          let newValue = 1;
                          if (currentValue !== null) {
                            newValue = currentValue + 1;
                            if (newValue > 15) newValue = 0;
                          }
                          updatePocketDepth(tooth.id, selectedAspect, position, newValue.toString());
                        }}
                        className="cursor-pointer h-8 w-full flex items-center justify-center"
                      >
                        {tooth.measurements.pocketDepth[selectedAspect][position] === null ? '-' : tooth.measurements.pocketDepth[selectedAspect][position]}
                      </div>
                    )}
                    
                    <div className="mt-1 flex justify-center">
                      <div 
                        className={`w-3 h-3 rounded-full ${tooth.measurements.bleeding[selectedAspect][position] ? 'bg-red-500' : 'bg-gray-200'} cursor-pointer`}
                        onClick={() => toggleBleeding(tooth.id, selectedAspect, position)}
                        title="Bleeding"
                      />
                      <div 
                        className={`ml-1 w-3 h-3 rounded-full ${tooth.measurements.suppuration[selectedAspect][position] ? 'bg-yellow-500' : 'bg-gray-200'} cursor-pointer`}
                        onClick={() => toggleSuppuration(tooth.id, selectedAspect, position)}
                        title="Suppuration"
                      />
                    </div>
                  </TableCell>
                ))}
                
                {/* Mobility */}
                <TableCell>
                  <Select
                    value={tooth.measurements.mobility === null ? '0' : tooth.measurements.mobility.toString()}
                    onValueChange={(value) => updateMobility(tooth.id, value)}
                    disabled={readOnly}
                  >
                    <SelectTrigger className="w-14 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">None</SelectItem>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                
                {/* Plaque */}
                <TableCell>
                  <div className="flex justify-center">
                    <Checkbox
                      checked={tooth.measurements.plaque}
                      onCheckedChange={() => togglePlaque(tooth.id)}
                      disabled={readOnly}
                      className={tooth.measurements.plaque ? 'bg-blue-100 text-blue-900' : ''}
                    />
                  </div>
                </TableCell>
                
                {/* Calculus */}
                <TableCell>
                  <div className="flex justify-center">
                    <Checkbox
                      checked={tooth.measurements.calculus}
                      onCheckedChange={() => toggleCalculus(tooth.id)}
                      disabled={readOnly}
                      className={tooth.measurements.calculus ? 'bg-gray-300 text-gray-900' : ''}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  // Function to render the recession measurement table
  const renderRecessionTable = () => {
    const teeth = getCurrentTeeth();
    
    return (
      <div className="overflow-auto">
        <Table>
          <TableCaption className="mt-2 text-sm font-medium">
            Gingival Recession Measurements (mm) - {selectedAspect === 'facial' ? 'Facial' : 'Lingual'} Aspect
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Tooth #</TableHead>
              <TableHead>Mesial</TableHead>
              <TableHead>Mid</TableHead>
              <TableHead>Distal</TableHead>
              <TableHead>Furcation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teeth.map(tooth => (
              <TableRow key={`rec-${tooth.id}`}>
                <TableCell className="font-medium text-center">{tooth.id}</TableCell>
                
                {/* Recession Cells */}
                {[0, 1, 2].map(position => (
                  <TableCell 
                    key={`rec-${tooth.id}-${position}`}
                    className={getColorForRecession(tooth.measurements.recession[selectedAspect][position])}
                  >
                    {inputMode === 'numeric' ? (
                      <Input
                        type="number"
                        min="0"
                        max="10"
                        className="h-8 w-14 text-center"
                        value={tooth.measurements.recession[selectedAspect][position] === null ? '' : tooth.measurements.recession[selectedAspect][position] || ''}
                        onChange={(e) => updateRecession(tooth.id, selectedAspect, position, e.target.value)}
                        disabled={readOnly}
                      />
                    ) : (
                      <div
                        onClick={() => {
                          if (readOnly) return;
                          const currentValue = tooth.measurements.recession[selectedAspect][position];
                          let newValue = 1;
                          if (currentValue !== null) {
                            newValue = currentValue + 1;
                            if (newValue > 10) newValue = 0;
                          }
                          updateRecession(tooth.id, selectedAspect, position, newValue.toString());
                        }}
                        className="cursor-pointer h-8 w-full flex items-center justify-center"
                      >
                        {tooth.measurements.recession[selectedAspect][position] === null ? '-' : tooth.measurements.recession[selectedAspect][position]}
                      </div>
                    )}
                  </TableCell>
                ))}
                
                {/* Furcation */}
                <TableCell>
                  <Select
                    value={tooth.measurements.furcation[selectedAspect] === null ? '0' : tooth.measurements.furcation[selectedAspect]?.toString()}
                    onValueChange={(value) => updateFurcation(tooth.id, selectedAspect, value)}
                    disabled={readOnly}
                  >
                    <SelectTrigger className="w-14 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">None</SelectItem>
                      <SelectItem value="1">I</SelectItem>
                      <SelectItem value="2">II</SelectItem>
                      <SelectItem value="3">III</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  // Function to render the mobility and furcation table
  const renderMobilityFurcationTable = () => {
    const teeth = getCurrentTeeth();
    
    return (
      <div className="overflow-auto">
        <Table>
          <TableCaption className="mt-2 text-sm font-medium">
            Mobility and Furcation Measurements
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Tooth #</TableHead>
              <TableHead>Mobility</TableHead>
              <TableHead>Furc. (Facial)</TableHead>
              <TableHead>Furc. (Lingual)</TableHead>
              <TableHead>Furc. (Mesial)</TableHead>
              <TableHead>Furc. (Distal)</TableHead>
              <TableHead>Plaque</TableHead>
              <TableHead>Calculus</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teeth.map(tooth => (
              <TableRow key={`mob-${tooth.id}`}>
                <TableCell className="font-medium text-center">{tooth.id}</TableCell>
                
                {/* Mobility */}
                <TableCell>
                  <Select
                    value={tooth.measurements.mobility === null ? '0' : tooth.measurements.mobility.toString()}
                    onValueChange={(value) => updateMobility(tooth.id, value)}
                    disabled={readOnly}
                  >
                    <SelectTrigger className="w-14 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">None</SelectItem>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                
                {/* Furcation Areas */}
                {['facial', 'lingual', 'mesial', 'distal'].map(location => (
                  <TableCell key={`furc-${tooth.id}-${location}`}>
                    <Select
                      value={tooth.measurements.furcation[location as keyof typeof tooth.measurements.furcation] === null ? '0' : tooth.measurements.furcation[location as keyof typeof tooth.measurements.furcation]?.toString()}
                      onValueChange={(value) => updateFurcation(tooth.id, location as 'facial' | 'lingual' | 'mesial' | 'distal', value)}
                      disabled={readOnly}
                    >
                      <SelectTrigger className="w-14 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">None</SelectItem>
                        <SelectItem value="1">I</SelectItem>
                        <SelectItem value="2">II</SelectItem>
                        <SelectItem value="3">III</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                ))}
                
                {/* Plaque */}
                <TableCell>
                  <div className="flex justify-center">
                    <Checkbox
                      checked={tooth.measurements.plaque}
                      onCheckedChange={() => togglePlaque(tooth.id)}
                      disabled={readOnly}
                      className={tooth.measurements.plaque ? 'bg-blue-100 text-blue-900' : ''}
                    />
                  </div>
                </TableCell>
                
                {/* Calculus */}
                <TableCell>
                  <div className="flex justify-center">
                    <Checkbox
                      checked={tooth.measurements.calculus}
                      onCheckedChange={() => toggleCalculus(tooth.id)}
                      disabled={readOnly}
                      className={tooth.measurements.calculus ? 'bg-gray-300 text-gray-900' : ''}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  // Function to render the visual chart view
  const renderVisualChart = () => {
    return (
      <div className="py-12 text-center text-gray-500">
        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium">Visual Chart View</h3>
        <p className="max-w-md mx-auto">
          Interactive visual dental chart will be displayed here,
          showing teeth with color-coded measurements.
        </p>
      </div>
    );
  };

  // Function to render the AI analysis panel
  const renderAIAnalysisPanel = () => {
    return (
      <div className="w-full lg:w-80 p-4 border-l">
        <h3 className="text-lg font-medium mb-4">AI Analysis</h3>
        
        <div className="space-y-6">
          {/* Health Score */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Overall Health Score</span>
              <span className={`text-sm font-bold ${aiAnalysis.healthScore > 70 ? 'text-green-600' : aiAnalysis.healthScore > 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                {aiAnalysis.healthScore}%
              </span>
            </div>
            <Progress value={aiAnalysis.healthScore} className="h-2" />
          </div>
          
          {/* Bleeding Index */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Bleeding Index</span>
              <span className={`text-sm font-bold ${aiAnalysis.bleedingIndex < 15 ? 'text-green-600' : aiAnalysis.bleedingIndex < 30 ? 'text-yellow-600' : 'text-red-600'}`}>
                {aiAnalysis.bleedingIndex}%
              </span>
            </div>
            <Progress value={aiAnalysis.bleedingIndex} className="h-2" />
          </div>
          
          {/* Severe Sites */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Severe Sites</span>
              <span className={`text-sm font-bold ${aiAnalysis.severeSites < 2 ? 'text-green-600' : aiAnalysis.severeSites < 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                {aiAnalysis.severeSites}
              </span>
            </div>
          </div>
          
          <Separator />
          
          {/* Key Findings */}
          <div>
            <h4 className="text-sm font-medium mb-2">Key Findings</h4>
            <ul className="text-sm space-y-1 list-disc pl-5">
              {aiAnalysis.findings.map((finding, index) => (
                <li key={index}>{finding}</li>
              ))}
            </ul>
          </div>
          
          {/* Recommendations */}
          <div>
            <h4 className="text-sm font-medium mb-2">Recommendations</h4>
            <ul className="text-sm space-y-1 list-disc pl-5">
              {aiAnalysis.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>
          
          <div className="pt-4">
            <Button className="w-full" variant="outline">
              <BarChart className="h-4 w-4 mr-2" />
              Generate Complete Report
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`${isFullScreen ? 'fixed inset-0 z-50 bg-background p-6 overflow-auto' : ''}`}>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-xl">Periodontal Chart</CardTitle>
            <CardDescription>{patientName}</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon" onClick={() => setIsFullScreen(!isFullScreen)}>
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShowAIPanel(!showAIPanel)}>
              <PanelRight className="h-4 w-4" />
            </Button>
            {!readOnly && (
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Chart
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
          
          <div className="flex flex-wrap items-center justify-between gap-y-2 mb-4">
            <div>
              <ToggleGroup type="single" value={selectedArch} onValueChange={(value) => value && setSelectedArch(value as 'upper' | 'lower')}>
                <ToggleGroupItem value="upper">Upper Arch</ToggleGroupItem>
                <ToggleGroupItem value="lower">Lower Arch</ToggleGroupItem>
              </ToggleGroup>
            </div>
            
            <div>
              <ToggleGroup type="single" value={selectedAspect} onValueChange={(value) => value && setSelectedAspect(value as 'facial' | 'lingual')}>
                <ToggleGroupItem value="facial">Facial</ToggleGroupItem>
                <ToggleGroupItem value="lingual">Lingual</ToggleGroupItem>
              </ToggleGroup>
            </div>
            
            <div>
              <ToggleGroup type="single" value={inputMode} onValueChange={(value) => value && setInputMode(value as 'numeric' | 'click')}>
                <ToggleGroupItem value="numeric" title="Numeric Input">
                  <span className="mr-1.5">123</span>
                </ToggleGroupItem>
                <ToggleGroupItem value="click" title="Click Input">
                  <span className="mr-1.5">👆</span>
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
          
          <div className="flex">
            <div className="flex-1 overflow-hidden">
              <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as 'pocket' | 'recession' | 'mobility' | 'chart')}>
                <TabsList className="mb-4">
                  <TabsTrigger value="pocket">Pocket Depth</TabsTrigger>
                  <TabsTrigger value="recession">Recession</TabsTrigger>
                  <TabsTrigger value="mobility">Mobility/Furcation</TabsTrigger>
                  <TabsTrigger value="chart">Visual Chart</TabsTrigger>
                </TabsList>
                
                <TabsContent value="pocket" className="pt-2">
                  {renderPocketDepthTable()}
                </TabsContent>
                
                <TabsContent value="recession" className="pt-2">
                  {renderRecessionTable()}
                </TabsContent>
                
                <TabsContent value="mobility" className="pt-2">
                  {renderMobilityFurcationTable()}
                </TabsContent>
                
                <TabsContent value="chart" className="pt-2">
                  {renderVisualChart()}
                </TabsContent>
              </Tabs>
            </div>
            
            {showAIPanel && renderAIAnalysisPanel()}
          </div>
          
          {/* Legend */}
          <div className="mt-6 pt-4 border-t">
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
                    <div className="w-4 h-4 mr-1 bg-white border border-gray-300"></div>
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
                <h4 className="text-xs font-semibold mb-1">Indicators</h4>
                <div className="space-y-1">
                  <div className="flex items-center">
                    <div className="w-4 h-4 mr-1 bg-red-500 rounded-full"></div>
                    <span className="text-xs">Bleeding</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 mr-1 bg-yellow-500 rounded-full"></div>
                    <span className="text-xs">Suppuration</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-xs font-semibold mb-1">Other</h4>
                <div className="space-y-1">
                  <div className="flex items-center">
                    <div className="w-4 h-4 mr-1 bg-blue-100 border border-gray-300"></div>
                    <span className="text-xs">Plaque</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 mr-1 bg-gray-300 border border-gray-300"></div>
                    <span className="text-xs">Calculus</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between pt-4 border-t">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Info className="h-4 w-4 mr-1" />
                  <span>Input tips</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p className="text-sm">
                  For pocket depth and recession, enter values in millimeters. Toggle bleeding and suppuration
                  indicators by clicking the colored dots. For mobility and furcation, select values from the dropdown.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" /> Export
            </Button>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-1" /> Import
            </Button>
            <Button variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-1" /> Print
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}