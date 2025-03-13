import { useState, useEffect, useRef } from 'react';
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
  FileText,
  Printer,
  Maximize2,
  AlertTriangle,
  CheckCircle,
  BarChart2
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format } from 'date-fns';

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
  overallHealth: 'healthy' | 'gingivitis' | 'early_periodontitis' | 'moderate_periodontitis' | 'severe_periodontitis';
  riskLevel: 'low' | 'moderate' | 'high';
  keyFindings: string[];
  recommendations: string[];
  nextSteps: string[];
}

// Helper functions
const getColorForPocketDepth = (depth: number | null): string => {
  if (depth === null) return 'bg-white';
  if (depth <= 3) return 'bg-green-100';
  if (depth <= 5) return 'bg-yellow-100';
  return 'bg-red-100';
};

const getColorForRecession = (recession: number | null): string => {
  if (recession === null || recession === 0) return 'bg-white';
  if (recession <= 2) return 'bg-yellow-100';
  return 'bg-red-100';
};

export default function EnhancedPerioChart({
  patientId,
  patientName = 'Patient',
  initialData,
  readOnly = false,
  onSave
}: PerioChartProps) {
  // Initialize chart data with default values or load from initialData
  const [chartData, setChartData] = useState<PerioChartData>(() => {
    if (initialData) return initialData;

    // Create default data structure
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
      date: format(new Date(), 'yyyy-MM-dd'),
      examiner: 'Dr. Smith', // Should be replaced with actual logged-in user
      notes: '',
      lastUpdated: new Date().toISOString(),
      teeth: [...upperTeeth, ...lowerTeeth]
    };
  });

  // Auto save timer
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // UI state
  const [selectedArch, setSelectedArch] = useState<'upper' | 'lower'>('upper');
  const [selectedAspect, setSelectedAspect] = useState<'facial' | 'lingual'>('facial');
  const [selectedMeasurement, setSelectedMeasurement] = useState<'pocketDepth' | 'recession' | 'bleeding' | 'suppuration'>('pocketDepth');
  const [selectedView, setSelectedView] = useState<'measurements' | 'analysis' | 'history'>('measurements');
  const [fullScreen, setFullScreen] = useState(false);
  const [showNumberInput, setShowNumberInput] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // Calculate health scores based on measurements
  const calculateHealthScore = () => {
    // Count pockets greater than certain depths
    const pocketStats = chartData.teeth.reduce(
      (acc, tooth) => {
        // Check facial and lingual for each position
        ['facial', 'lingual'].forEach((aspect) => {
          tooth.measurements.pocketDepth[aspect as 'facial' | 'lingual'].forEach(depth => {
            if (depth !== null) {
              if (depth >= 4 && depth <= 5) acc.moderate++;
              if (depth >= 6) acc.severe++;
              acc.total++;
            }
          });
        });
        return acc;
      },
      { moderate: 0, severe: 0, total: 0 }
    );

    // Count bleeding sites
    const bleedingCount = chartData.teeth.reduce(
      (acc, tooth) => {
        ['facial', 'lingual'].forEach((aspect) => {
          tooth.measurements.bleeding[aspect as 'facial' | 'lingual'].forEach(isBleed => {
            if (isBleed) acc.bleeding++;
            acc.total++;
          });
        });
        return acc;
      },
      { bleeding: 0, total: 0 }
    );

    // Calculate percentages
    const moderatePocketPercentage = (pocketStats.moderate / pocketStats.total) * 100 || 0;
    const severePocketPercentage = (pocketStats.severe / pocketStats.total) * 100 || 0;
    const bleedingPercentage = (bleedingCount.bleeding / bleedingCount.total) * 100 || 0;

    return {
      moderatePocketPercentage,
      severePocketPercentage,
      bleedingPercentage
    };
  };

  // Generate AI analysis
  const generateAIAnalysis = () => {
    const scores = calculateHealthScore();
    
    // Determine overall periodontal health
    let overallHealth: AIAnalysis['overallHealth'] = 'healthy';
    let riskLevel: AIAnalysis['riskLevel'] = 'low';
    
    if (scores.bleedingPercentage > 30 && scores.moderatePocketPercentage < 10 && scores.severePocketPercentage < 5) {
      overallHealth = 'gingivitis';
      riskLevel = 'moderate';
    } else if (scores.moderatePocketPercentage >= 10 && scores.moderatePocketPercentage < 30 && scores.severePocketPercentage < 10) {
      overallHealth = 'early_periodontitis';
      riskLevel = 'moderate';
    } else if (scores.moderatePocketPercentage >= 30 || (scores.severePocketPercentage >= 10 && scores.severePocketPercentage < 30)) {
      overallHealth = 'moderate_periodontitis';
      riskLevel = 'high';
    } else if (scores.severePocketPercentage >= 30) {
      overallHealth = 'severe_periodontitis';
      riskLevel = 'high';
    }
    
    // Generate key findings based on the data
    const keyFindings = [];
    
    if (scores.bleedingPercentage > 20) {
      keyFindings.push(`${Math.round(scores.bleedingPercentage)}% of sites show bleeding on probing.`);
    }
    
    if (scores.moderatePocketPercentage > 10) {
      keyFindings.push(`${Math.round(scores.moderatePocketPercentage)}% of sites have pocket depths of 4-5mm.`);
    }
    
    if (scores.severePocketPercentage > 0) {
      keyFindings.push(`${Math.round(scores.severePocketPercentage)}% of sites have pocket depths of 6mm or greater.`);
    }
    
    // Add any teeth with mobility
    const teethWithMobility = chartData.teeth.filter(tooth => tooth.measurements.mobility !== null && tooth.measurements.mobility > 0);
    if (teethWithMobility.length > 0) {
      keyFindings.push(`${teethWithMobility.length} teeth exhibit mobility (${teethWithMobility.map(t => t.id).join(', ')}).`);
    }
    
    // Generate recommendations
    const recommendations = [];
    
    switch (overallHealth) {
      case 'healthy':
        recommendations.push('Continue current oral hygiene routine.');
        recommendations.push('Regular 6-month recall appointments.');
        break;
      case 'gingivitis':
        recommendations.push('Improved oral hygiene instruction.');
        recommendations.push('Professional scaling and root planing.');
        recommendations.push('Re-evaluation in 4-6 weeks.');
        break;
      case 'early_periodontitis':
        recommendations.push('Non-surgical periodontal therapy (deep scaling and root planing).');
        recommendations.push('Consider localized adjunctive antibiotics.');
        recommendations.push('Re-evaluation in 4-6 weeks.');
        break;
      case 'moderate_periodontitis':
        recommendations.push('Full-mouth disinfection protocol.');
        recommendations.push('Quadrant scaling and root planing with anesthesia.');
        recommendations.push('Consider systemic antibiotics.');
        recommendations.push('Re-evaluation in 4 weeks.');
        break;
      case 'severe_periodontitis':
        recommendations.push('Comprehensive periodontal therapy.');
        recommendations.push('Consider referral to periodontist.');
        recommendations.push('Potential surgical intervention for affected areas.');
        recommendations.push('Aggressive periodontal maintenance protocol.');
        break;
    }
    
    // Next steps
    const nextSteps = [
      'Schedule follow-up appointment.',
      'Review oral hygiene techniques with patient.',
      'Document baseline for future comparison.'
    ];
    
    if (riskLevel === 'high') {
      nextSteps.push('Consider referral to specialist for consultation.');
    }
    
    setAiAnalysis({
      overallHealth,
      riskLevel,
      keyFindings,
      recommendations,
      nextSteps
    });
  };

  useEffect(() => {
    // Generate AI analysis when chart data changes
    if (chartData.teeth.length > 0) {
      generateAIAnalysis();
    }
    
    // Set up auto-save
    if (autoSaveEnabled && !readOnly) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      
      autoSaveTimerRef.current = setTimeout(() => {
        savePerioChart();
      }, 30000); // Auto-save after 30 seconds of inactivity
    }
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [chartData, autoSaveEnabled]);

  // Update measurements for pocket depth and recession
  const updateMeasurement = (
    toothId: number,
    type: 'pocketDepth' | 'recession',
    aspect: 'facial' | 'lingual',
    position: number,
    value: number | null
  ) => {
    if (readOnly) return;
    
    setChartData(prev => {
      const newTeeth = prev.teeth.map(tooth => {
        if (tooth.id === toothId) {
          const newMeasurements = { ...tooth.measurements };
          newMeasurements[type][aspect][position] = value;
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

  // Toggle bleeding and suppuration
  const toggleBleedingSuppuration = (
    toothId: number,
    type: 'bleeding' | 'suppuration',
    aspect: 'facial' | 'lingual',
    position: number
  ) => {
    if (readOnly) return;
    
    setChartData(prev => {
      const newTeeth = prev.teeth.map(tooth => {
        if (tooth.id === toothId) {
          const newMeasurements = { ...tooth.measurements };
          const currentValue = newMeasurements[type][aspect][position];
          newMeasurements[type][aspect][position] = !currentValue;
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

  // Update mobility
  const updateMobility = (toothId: number, value: number | null) => {
    if (readOnly) return;
    
    setChartData(prev => {
      const newTeeth = prev.teeth.map(tooth => {
        if (tooth.id === toothId) {
          return {
            ...tooth,
            measurements: {
              ...tooth.measurements,
              mobility: value
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

  // Update furcation
  const updateFurcation = (
    toothId: number,
    location: 'facial' | 'lingual' | 'mesial' | 'distal',
    value: number | null
  ) => {
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
                [location]: value
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

  // Update plaque and calculus
  const updatePlaqueCalculus = (toothId: number, type: 'plaque' | 'calculus', value: boolean) => {
    if (readOnly) return;
    
    setChartData(prev => {
      const newTeeth = prev.teeth.map(tooth => {
        if (tooth.id === toothId) {
          return {
            ...tooth,
            measurements: {
              ...tooth.measurements,
              [type]: value
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

  // Save perio chart data
  const savePerioChart = () => {
    if (readOnly) return;
    
    setLastSaved(new Date());
    
    if (onSave) {
      onSave(chartData);
    }
  };

  // Get current teeth based on selected arch
  const getCurrentTeeth = () => {
    return chartData.teeth.filter(tooth => {
      if (selectedArch === 'upper') {
        return ADULT_TEETH_UPPER.includes(tooth.id);
      } else {
        return ADULT_TEETH_LOWER.includes(tooth.id);
      }
    });
  };

  // Render measurements table (pocket depth or recession)
  const renderMeasurementsTable = (type: 'pocketDepth' | 'recession', aspect: 'facial' | 'lingual') => {
    const teeth = getCurrentTeeth();
    const title = type === 'pocketDepth' ? 'Pocket Depth' : 'Recession';
    
    return (
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <Table>
            <TableCaption>{title} Measurements ({aspect})</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Tooth #</TableHead>
                <TableHead>Mesial</TableHead>
                <TableHead>Middle</TableHead>
                <TableHead>Distal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teeth.map(tooth => (
                <TableRow key={`${tooth.id}-${type}-${aspect}`}>
                  <TableCell className="font-medium">{tooth.id}</TableCell>
                  {[0, 1, 2].map(position => (
                    <TableCell 
                      key={`${tooth.id}-${type}-${aspect}-${position}`}
                      className={
                        type === 'pocketDepth' 
                          ? getColorForPocketDepth(tooth.measurements[type][aspect][position])
                          : getColorForRecession(tooth.measurements[type][aspect][position])
                      }
                    >
                      {showNumberInput ? (
                        <Input
                          type="number"
                          min="0"
                          max={type === 'pocketDepth' ? "15" : "10"}
                          step="1"
                          className="h-8 w-14 text-center"
                          value={tooth.measurements[type][aspect][position] === null ? '' : tooth.measurements[type][aspect][position]}
                          onChange={(e) => {
                            const value = e.target.value === '' ? null : parseInt(e.target.value);
                            updateMeasurement(tooth.id, type, aspect, position, value);
                          }}
                          disabled={readOnly}
                        />
                      ) : (
                        <div 
                          className="cursor-pointer h-8 w-14 flex items-center justify-center"
                          onClick={() => {
                            if (readOnly) return;
                            
                            let nextValue = 1;
                            if (tooth.measurements[type][aspect][position] !== null) {
                              nextValue = (tooth.measurements[type][aspect][position] || 0) + 1;
                              if (nextValue > (type === 'pocketDepth' ? 15 : 10)) {
                                nextValue = 0;
                              }
                            }
                            
                            updateMeasurement(tooth.id, type, aspect, position, nextValue || null);
                          }}
                        >
                          {tooth.measurements[type][aspect][position] === null ? '-' : tooth.measurements[type][aspect][position]}
                        </div>
                      )}
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

  // Render bleeding or suppuration table
  const renderIndicatorTable = (type: 'bleeding' | 'suppuration', aspect: 'facial' | 'lingual') => {
    const teeth = getCurrentTeeth();
    const title = type === 'bleeding' ? 'Bleeding on Probing' : 'Suppuration';
    const bgColor = type === 'bleeding' ? 'bg-red-100' : 'bg-yellow-100';
    
    return (
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <Table>
            <TableCaption>{title} ({aspect})</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Tooth #</TableHead>
                <TableHead>Mesial</TableHead>
                <TableHead>Middle</TableHead>
                <TableHead>Distal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teeth.map(tooth => (
                <TableRow key={`${tooth.id}-${type}-${aspect}`}>
                  <TableCell className="font-medium">{tooth.id}</TableCell>
                  {[0, 1, 2].map(position => (
                    <TableCell 
                      key={`${tooth.id}-${type}-${aspect}-${position}`}
                      className="text-center cursor-pointer"
                      onClick={() => {
                        if (!readOnly) {
                          toggleBleedingSuppuration(tooth.id, type, aspect, position);
                        }
                      }}
                    >
                      <div className="flex justify-center">
                        <Checkbox
                          checked={tooth.measurements[type][aspect][position]}
                          onCheckedChange={() => {
                            if (!readOnly) {
                              toggleBleedingSuppuration(tooth.id, type, aspect, position);
                            }
                          }}
                          className={tooth.measurements[type][aspect][position] ? bgColor : ''}
                          disabled={readOnly}
                        />
                      </div>
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
    const teeth = getCurrentTeeth();
    
    return (
      <div className="overflow-x-auto mt-6">
        <div className="inline-block min-w-full align-middle">
          <Table>
            <TableCaption>Mobility and Furcation</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Tooth #</TableHead>
                <TableHead>Mobility</TableHead>
                <TableHead>Furcation (Facial)</TableHead>
                <TableHead>Furcation (Lingual)</TableHead>
                <TableHead>Furcation (Mesial)</TableHead>
                <TableHead>Furcation (Distal)</TableHead>
                <TableHead>Plaque</TableHead>
                <TableHead>Calculus</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teeth.map(tooth => (
                <TableRow key={`${tooth.id}-mobility-furcation`}>
                  <TableCell className="font-medium">{tooth.id}</TableCell>
                  <TableCell>
                    <Select
                      value={tooth.measurements.mobility === null ? '0' : tooth.measurements.mobility.toString()}
                      onValueChange={(value) => {
                        const mobilityValue = value === '0' ? null : parseInt(value);
                        updateMobility(tooth.id, mobilityValue);
                      }}
                      disabled={readOnly}
                    >
                      <SelectTrigger className="w-full h-8">
                        <SelectValue placeholder="" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">None</SelectItem>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  {['facial', 'lingual', 'mesial', 'distal'].map(location => (
                    <TableCell key={`${tooth.id}-furcation-${location}`}>
                      <Select
                        value={tooth.measurements.furcation[location as keyof typeof tooth.measurements.furcation] === null ? '0' : tooth.measurements.furcation[location as keyof typeof tooth.measurements.furcation]?.toString()}
                        onValueChange={(value) => {
                          const furcationValue = value === '0' ? null : parseInt(value);
                          updateFurcation(tooth.id, location as 'facial' | 'lingual' | 'mesial' | 'distal', furcationValue);
                        }}
                        disabled={readOnly}
                      >
                        <SelectTrigger className="w-full h-8">
                          <SelectValue placeholder="" />
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
                  <TableCell
                    className={`text-center cursor-pointer ${tooth.measurements.plaque ? 'bg-blue-100' : 'bg-white'}`}
                  >
                    <div className="flex justify-center">
                      <Checkbox
                        checked={tooth.measurements.plaque}
                        onCheckedChange={(checked) => {
                          if (!readOnly) {
                            updatePlaqueCalculus(tooth.id, 'plaque', checked === true);
                          }
                        }}
                        disabled={readOnly}
                      />
                    </div>
                  </TableCell>
                  <TableCell
                    className={`text-center cursor-pointer ${tooth.measurements.calculus ? 'bg-gray-100' : 'bg-white'}`}
                  >
                    <div className="flex justify-center">
                      <Checkbox
                        checked={tooth.measurements.calculus}
                        onCheckedChange={(checked) => {
                          if (!readOnly) {
                            updatePlaqueCalculus(tooth.id, 'calculus', checked === true);
                          }
                        }}
                        disabled={readOnly}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  // Render AI analysis section
  const renderAIAnalysis = () => {
    if (!aiAnalysis) return null;
    
    // Helper function to get health status badge
    const getHealthStatusBadge = (status: AIAnalysis['overallHealth']) => {
      switch (status) {
        case 'healthy':
          return <Badge className="bg-green-100 text-green-800">Healthy</Badge>;
        case 'gingivitis':
          return <Badge className="bg-yellow-100 text-yellow-800">Gingivitis</Badge>;
        case 'early_periodontitis':
          return <Badge className="bg-orange-100 text-orange-800">Early Periodontitis</Badge>;
        case 'moderate_periodontitis':
          return <Badge className="bg-red-100 text-red-800">Moderate Periodontitis</Badge>;
        case 'severe_periodontitis':
          return <Badge className="bg-red-500 text-white">Severe Periodontitis</Badge>;
        default:
          return <Badge>Unknown</Badge>;
      }
    };
    
    // Helper function to get risk level badge
    const getRiskLevelBadge = (risk: AIAnalysis['riskLevel']) => {
      switch (risk) {
        case 'low':
          return <Badge className="bg-green-100 text-green-800">Low Risk</Badge>;
        case 'moderate':
          return <Badge className="bg-yellow-100 text-yellow-800">Moderate Risk</Badge>;
        case 'high':
          return <Badge className="bg-red-100 text-red-800">High Risk</Badge>;
        default:
          return <Badge>Unknown</Badge>;
      }
    };
    
    const scores = calculateHealthScore();
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-2">AI Assessment Summary</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Overall Periodontal Health:</span>
                {getHealthStatusBadge(aiAnalysis.overallHealth)}
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Risk Level:</span>
                {getRiskLevelBadge(aiAnalysis.riskLevel)}
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-2">Key Metrics</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Bleeding Sites</span>
                      <span className="text-sm">{Math.round(scores.bleedingPercentage)}%</span>
                    </div>
                    <Progress value={scores.bleedingPercentage} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Moderate Pockets (4-5mm)</span>
                      <span className="text-sm">{Math.round(scores.moderatePocketPercentage)}%</span>
                    </div>
                    <Progress value={scores.moderatePocketPercentage} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Severe Pockets (6mm+)</span>
                      <span className="text-sm">{Math.round(scores.severePocketPercentage)}%</span>
                    </div>
                    <Progress value={scores.severePocketPercentage} className="h-2" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Key Findings</h3>
            {aiAnalysis.keyFindings.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1">
                {aiAnalysis.keyFindings.map((finding, index) => (
                  <li key={index}>{finding}</li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No significant findings to report.</p>
            )}
          </div>
        </div>
        
        <Separator />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Recommendations</h3>
            {aiAnalysis.recommendations.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1">
                {aiAnalysis.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No specific recommendations at this time.</p>
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Next Steps</h3>
            {aiAnalysis.nextSteps.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1">
                {aiAnalysis.nextSteps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No specific next steps at this time.</p>
            )}
          </div>
        </div>
        
        {aiAnalysis.riskLevel === 'high' && (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>High Risk Assessment</AlertTitle>
            <AlertDescription>
              This patient has been identified as high risk for periodontal disease progression. 
              Consider specialist referral and aggressive therapy.
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  // Main component rendering
  return (
    <Card className={`w-full ${fullScreen ? 'fixed inset-0 z-50 overflow-auto' : ''}`}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Periodontal Chart</CardTitle>
            <CardDescription>
              {patientName} - Comprehensive periodontal assessment
            </CardDescription>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-500">
              {lastSaved 
                ? `Last saved: ${lastSaved.toLocaleString()}`
                : `Last updated: ${new Date(chartData.lastUpdated).toLocaleString()}`
              }
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setFullScreen(!fullScreen)}
            >
              <Maximize2 className="h-5 w-5" />
            </Button>
            
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
        
        <Tabs value={selectedView} onValueChange={(v) => setSelectedView(v as any)}>
          <TabsList className="mb-4">
            <TabsTrigger value="measurements">Measurements</TabsTrigger>
            <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="measurements">
            <div className="space-y-6">
              <div className="flex flex-wrap justify-between gap-2 mb-4">
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
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="input-mode"
                    checked={showNumberInput}
                    onCheckedChange={(checked) => setShowNumberInput(checked === true)}
                  />
                  <label
                    htmlFor="input-mode"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Number Input Mode
                  </label>
                </div>
              </div>
              
              <div className="perio-chart-content">
                {selectedMeasurement === 'pocketDepth' && renderMeasurementsTable('pocketDepth', selectedAspect)}
                {selectedMeasurement === 'recession' && renderMeasurementsTable('recession', selectedAspect)}
                {selectedMeasurement === 'bleeding' && renderIndicatorTable('bleeding', selectedAspect)}
                {selectedMeasurement === 'suppuration' && renderIndicatorTable('suppuration', selectedAspect)}
                
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
                    <h4 className="text-xs font-semibold mb-1">Bleeding & Suppuration</h4>
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <div className="w-4 h-4 mr-1 bg-red-100 border border-gray-300"></div>
                        <span className="text-xs">Bleeding Present</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 h-4 mr-1 bg-yellow-100 border border-gray-300"></div>
                        <span className="text-xs">Suppuration Present</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-semibold mb-1">Other Indicators</h4>
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <div className="w-4 h-4 mr-1 bg-blue-100 border border-gray-300"></div>
                        <span className="text-xs">Plaque Present</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 h-4 mr-1 bg-gray-100 border border-gray-300"></div>
                        <span className="text-xs">Calculus Present</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="analysis">
            {renderAIAnalysis()}
          </TabsContent>
          
          <TabsContent value="history">
            <div className="py-8 text-center text-gray-500">
              <BarChart2 className="mx-auto h-12 w-12 text-gray-300 mb-2" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No previous records</h3>
              <p>This is the first periodontal chart for this patient.</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="border-t pt-4 flex flex-wrap justify-between gap-2">
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
        
        <div className="flex items-center">
          <Checkbox
            id="auto-save"
            checked={autoSaveEnabled}
            onCheckedChange={(checked) => setAutoSaveEnabled(checked === true)}
            disabled={readOnly}
          />
          <label
            htmlFor="auto-save"
            className="ml-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Auto-save
          </label>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-1" /> Export
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
  );
}