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
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Info, Save, Download, Brain } from 'lucide-react';

// Types for the perio chart data
interface PerioToothData {
  pocketDepths: {
    facial: [number, number, number];
    lingual: [number, number, number];
  };
  recessionValues: {
    facial: [number, number, number];
    lingual: [number, number, number];
  };
  bleeding: {
    facial: [boolean, boolean, boolean];
    lingual: [boolean, boolean, boolean];
  };
  suppuration: {
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
  mobilityGrade: number;
  furcation: {
    facial: [number, number];
    lingual: [number, number];
  };
}

interface PerioChartData {
  chartDate: Date;
  teeth: { [toothId: number]: PerioToothData };
  notes: string;
  
  // AI analysis fields
  riskLevel?: 'low' | 'moderate' | 'high';
  riskFactors: string[];
  bop: number; // Bleeding on probing percentage 
  plaque: number; // Plaque score percentage
  suppuration: number; // Suppuration percentage
  worstSites: Array<{ toothId: number; position: string; depth: number }>;
  recommendedRecallInterval?: number;
  nextRecallDate?: Date;
  needsSRP?: boolean;
  needsPerioSurgery?: boolean;
  needsLaserTherapy?: boolean;
  recommendedTreatments: string[];
  homeCarePlan?: string;
  aiSummary?: string;
}

// Define enhanced chart data type with patient and examiner info
interface EnhancedPerioChartDataWithMeta extends PerioChartData {
  patientId?: number;
  examinerId?: number;
  saveDate?: Date;
}

interface EnhancedPerioChartProps {
  initialData?: PerioChartData;
  readOnly?: boolean;
  patientId?: number;  // Added for tracking the associated patient
  examinerId?: number; // Added for tracking who performed the exam
  onSave?: (data: EnhancedPerioChartDataWithMeta) => void;
}

// Measurement type definitions
const MEASUREMENT_TYPES = [
  { id: 'pocketDepth', name: 'Pocket Depth' },
  { id: 'recession', name: 'Recession' },
  { id: 'attachmentLoss', name: 'Attachment Loss' },
  { id: 'bleeding', name: 'Bleeding' },
  { id: 'suppuration', name: 'Suppuration' },
  { id: 'plaque', name: 'Plaque' },
  { id: 'mobility', name: 'Mobility/Furcation' }
];

// Adult teeth numbering
const ADULT_TEETH_UPPER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
const ADULT_TEETH_LOWER = [32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17];

// Helper function to calculate clinical attachment loss
const calculateAttachmentLoss = (pocketDepth: number, recession: number): number => {
  return pocketDepth + recession;
};

// Create empty tooth data
const createEmptyToothData = (): PerioToothData => ({
  pocketDepths: {
    facial: [0, 0, 0],
    lingual: [0, 0, 0]
  },
  recessionValues: {
    facial: [0, 0, 0],
    lingual: [0, 0, 0]
  },
  bleeding: {
    facial: [false, false, false],
    lingual: [false, false, false]
  },
  suppuration: {
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
  mobilityGrade: 0,
  furcation: {
    facial: [0, 0],
    lingual: [0, 0]
  }
});

// Create empty chart data
const createEmptyChartData = (): PerioChartData => {
  const teeth: { [toothId: number]: PerioToothData } = {};
  
  // Create empty data for all teeth
  [...ADULT_TEETH_UPPER, ...ADULT_TEETH_LOWER].forEach(toothId => {
    teeth[toothId] = createEmptyToothData();
  });
  
  return {
    chartDate: new Date(),
    teeth,
    notes: '',
    riskFactors: [],
    bop: 0,
    plaque: 0,
    suppuration: 0,
    worstSites: [],
    recommendedTreatments: []
  };
};

const EnhancedPerioChart: React.FC<EnhancedPerioChartProps> = ({ 
  initialData, 
  readOnly = false,
  patientId,
  examinerId,
  onSave
}) => {
  // Chart data state
  const [chartData, setChartData] = useState<PerioChartData>(initialData || createEmptyChartData());
  
  // UI state
  const [selectedArch, setSelectedArch] = useState<'upper' | 'lower'>('upper');
  const [selectedSurface, setSelectedSurface] = useState<'facial' | 'lingual'>('facial');
  const [selectedMeasurement, setSelectedMeasurement] = useState<string>('pocketDepth');
  const [activeTab, setActiveTab] = useState<'chart' | 'aiAnalysis'>('chart');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(false);

  // Calculate statistics (BOP, plaque, etc.)
  const calculateStats = () => {
    let bleedingSites = 0;
    let plaqueSites = 0;
    let suppurationSites = 0;
    let totalSites = 0;
    
    Object.values(chartData.teeth).forEach(tooth => {
      // Count sites from facial and lingual surfaces
      ['facial', 'lingual'].forEach(surface => {
        const surfaceKey = surface as 'facial' | 'lingual';
        
        // Count bleeding sites
        tooth.bleeding[surfaceKey].forEach(site => {
          if (site) bleedingSites++;
          totalSites++;
        });
        
        // Count plaque sites
        tooth.plaque[surfaceKey].forEach(site => {
          if (site) plaqueSites++;
        });
        
        // Count suppuration sites
        tooth.suppuration[surfaceKey].forEach(site => {
          if (site) suppurationSites++;
        });
      });
    });
    
    // Update percentages
    setChartData(prev => ({
      ...prev,
      bop: totalSites > 0 ? Math.round((bleedingSites / totalSites) * 100) : 0,
      suppuration: totalSites > 0 ? Math.round((suppurationSites / totalSites) * 100) : 0,
      plaque: totalSites > 0 ? Math.round((plaqueSites / totalSites) * 100) : 0
    }));
  };
  
  // AI risk analysis with automatic tab switch to show insights
  const generateRiskAnalysis = () => {
    // Show success toast when analysis is complete
    toast({
      title: "AI Analysis initiated",
      description: "Analyzing periodontal chart data and generating insights...",
      variant: "default"
    });
    
    // Switch to AI insights tab after analysis is complete
    setTimeout(() => setActiveTab('aiAnalysis'), 1200);
    setIsAnalyzing(true);
    
    // Simulate AI analysis (in a real app, this would call an API)
    setTimeout(() => {
      // Count pockets >= 5mm (moderate to severe)
      let deepPocketCount = 0;
      let totalMobility = 0;
      let bleedingSiteCount = 0;
      let suppressionSiteCount = 0;
      let totalSites = 0;
      
      const worstSites: Array<{toothId: number, position: string, depth: number}> = [];
      
      // Analyze all teeth
      Object.entries(chartData.teeth).forEach(([toothIdStr, tooth]) => {
        const toothId = parseInt(toothIdStr);
        
        // Check each surface and position
        ['facial', 'lingual'].forEach((surface) => {
          const surfaceKey = surface as 'facial' | 'lingual';
          
          // Check pocket depths
          tooth.pocketDepths[surfaceKey].forEach((depth, index) => {
            totalSites++;
            
            // Track deep pockets
            if (depth >= 5) {
              deepPocketCount++;
              
              // Add to worst sites
              const positionNames = ['Mesial', 'Middle', 'Distal'];
              worstSites.push({
                toothId,
                position: `${surface === 'facial' ? 'Facial' : 'Lingual'} ${positionNames[index]}`,
                depth
              });
            }
            
            // Track bleeding sites
            if (tooth.bleeding[surfaceKey][index]) {
              bleedingSiteCount++;
            }
            
            // Track suppuration sites
            if (tooth.suppuration[surfaceKey][index]) {
              suppressionSiteCount++;
            }
          });
        });
        
        // Track mobility
        totalMobility += tooth.mobilityGrade;
      });
      
      // Sort worst sites by depth (descending)
      worstSites.sort((a, b) => b.depth - a.depth);
      
      // Keep only top 5 worst sites
      const topWorstSites = worstSites.slice(0, 5);
      
      // Calculate risk factors
      const riskFactors: string[] = [];
      if (deepPocketCount > 0) riskFactors.push(`${deepPocketCount} sites with pockets ≥ 5mm`);
      if (chartData.bop > 20) riskFactors.push(`${chartData.bop}% bleeding on probing`);
      if (suppressionSiteCount > 0) riskFactors.push(`${suppressionSiteCount} sites with suppuration`);
      if (totalMobility > 0) riskFactors.push(`${totalMobility} teeth with mobility`);
      if (chartData.plaque > 30) riskFactors.push(`${chartData.plaque}% plaque score`);
      
      // Determine risk level
      let riskLevel: 'low' | 'moderate' | 'high' = 'low';
      if (deepPocketCount > 8 || chartData.bop > 40 || suppressionSiteCount > 3) {
        riskLevel = 'high';
      } else if (deepPocketCount > 3 || chartData.bop > 20 || suppressionSiteCount > 0) {
        riskLevel = 'moderate';
      }
      
      // Determine recommended recall interval
      const recommendedRecallInterval = riskLevel === 'high' ? 3 : (riskLevel === 'moderate' ? 4 : 6);
      
      // Determine treatment recommendations
      const needsSRP = deepPocketCount > 2 || chartData.bop > 30;
      const needsPerioSurgery = deepPocketCount > 8 || (deepPocketCount > 4 && suppressionSiteCount > 0);
      const needsLaserTherapy = deepPocketCount > 4 && chartData.bop > 30;
      
      // Build treatment recommendations list
      const recommendedTreatments: string[] = [];
      if (needsSRP) recommendedTreatments.push("Scaling and Root Planing");
      if (needsPerioSurgery) recommendedTreatments.push("Periodontal Surgery Evaluation");
      if (needsLaserTherapy) recommendedTreatments.push("Laser Therapy");
      if (chartData.plaque > 40) recommendedTreatments.push("Enhanced Oral Hygiene Instruction");
      
      // Generate home care plan
      let homeCarePlan = "Regular brushing twice daily with fluoride toothpaste. ";
      
      if (chartData.plaque > 30) {
        homeCarePlan += "Recommend electric toothbrush with pressure sensor. ";
      }
      
      if (chartData.bop > 20) {
        homeCarePlan += "Daily flossing and interdental brushes for all contact areas. ";
      }
      
      if (riskLevel === 'high') {
        homeCarePlan += "Consider antimicrobial mouth rinse (e.g., chlorhexidine) for 2 weeks. ";
      }
      
      // Generate AI summary
      const aiSummary = `Patient presents with ${deepPocketCount} deep pocket sites (≥5mm) and ${chartData.bop}% bleeding on probing, indicating ${riskLevel} risk for periodontal disease progression. ${
        riskLevel === 'high' 
          ? 'Immediate intervention recommended.' 
          : (riskLevel === 'moderate' 
              ? 'Requires close monitoring and targeted therapy.' 
              : 'Maintain preventive care regimen.')
      }`;
      
      // Update chart data with AI analysis
      setChartData(prev => ({
        ...prev,
        riskLevel,
        riskFactors,
        recommendedRecallInterval,
        needsSRP,
        needsPerioSurgery,
        needsLaserTherapy,
        recommendedTreatments,
        worstSites: topWorstSites,
        homeCarePlan,
        aiSummary,
        // Set next recall date based on interval
        nextRecallDate: new Date(Date.now() + recommendedRecallInterval * 30 * 24 * 60 * 60 * 1000)
      }));
      
      setIsAnalyzing(false);
      setShowAIInsights(true);
    }, 1000); // Simulate 1 second processing time
  };
  
  // Update statistics when chart data changes
  useEffect(() => {
    calculateStats();
  }, [chartData.teeth]);
  
  // Save the periodontal chart
  const savePerioChart = () => {
    if (onSave) {
      // Include patient and examiner information if available
      const enhancedData = {
        ...chartData,
        patientId,
        examinerId,
        saveDate: new Date()
      };
      onSave(enhancedData);
    }
    console.log('Saving perio chart:', chartData, { patientId, examinerId });
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
      plaque: 'bg-green-100',
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
                        className="text-center p-0 cursor-pointer"
                        onClick={() => toggleBooleanValue(
                          toothId, 
                          measurementType, 
                          selectedSurface, 
                          position as 0 | 1 | 2
                        )}
                      >
                        <div 
                          className={`h-10 flex items-center justify-center text-sm ${
                            tooth[measurementType][selectedSurface][position] ? bgColorClass : ''
                          }`}
                        >
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
        <div>
          <h3 className="text-sm font-medium mb-2">Mobility and Furcation</h3>
          <p className="text-xs text-gray-500 mb-4">
            Mobility grades: 0 (normal), 1 (slight), 2 (moderate), 3 (severe)<br />
            Furcation grades: 0 (none), 1 (initial), 2 (partial), 3 (through and through)
          </p>
        </div>
        
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Tooth #</TableHead>
                <TableHead className="text-center">Mobility</TableHead>
                <TableHead className="text-center">Facial Furc.</TableHead>
                <TableHead className="text-center">Lingual Furc.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentTeeth.map(toothId => {
                const tooth = chartData.teeth[toothId];
                
                return (
                  <TableRow key={`tooth-${toothId}-mobility`}>
                    <TableCell className="font-medium">{toothId}</TableCell>
                    <TableCell className="p-0">
                      <Select
                        value={tooth.mobilityGrade.toString()} 
                        onValueChange={(value) => updateMobility(toothId, parseInt(value))}
                        disabled={readOnly}
                      >
                        <SelectTrigger className="border-0 h-10">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0</SelectItem>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="p-0">
                      <Select
                        value={tooth.furcation.facial[0].toString()} 
                        onValueChange={(value) => updateFurcation(toothId, 'facial', 0, parseInt(value))}
                        disabled={readOnly}
                      >
                        <SelectTrigger className="border-0 h-10">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0</SelectItem>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="p-0">
                      <Select
                        value={tooth.furcation.lingual[0].toString()} 
                        onValueChange={(value) => updateFurcation(toothId, 'lingual', 0, parseInt(value))}
                        disabled={readOnly}
                      >
                        <SelectTrigger className="border-0 h-10">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0</SelectItem>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
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
  
  // Get appropriate risk level color
  const getRiskLevelColor = () => {
    if (!chartData.riskLevel) return "";
    return chartData.riskLevel === 'high' 
      ? 'text-red-700'
      : chartData.riskLevel === 'moderate'
        ? 'text-yellow-700'
        : 'text-green-700';
  };
  
  // Render AI insights
  const renderAIInsights = () => {
    return (
      <div className="space-y-6">
        {/* Risk assessment */}
        <div className="border rounded-md p-4">
          <h3 className="text-base font-medium mb-2">Risk Assessment</h3>
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm">Overall Risk Level: 
                <span className={`font-bold ${getRiskLevelColor()}`}>
                  {chartData.riskLevel && chartData.riskLevel.charAt(0).toUpperCase() + chartData.riskLevel.slice(1)}
                </span>
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Risk Factors Identified:</h4>
              <ul className="list-disc pl-5 space-y-1">
                {chartData.riskFactors.map((factor, index) => (
                  <li key={index} className="text-sm">{factor}</li>
                ))}
              </ul>
            </div>
            
            {chartData.recommendedRecallInterval && (
              <div>
                <h4 className="text-sm font-medium mb-1">Recommended Recall Interval:</h4>
                <p className="text-sm">{chartData.recommendedRecallInterval} months</p>
                {chartData.nextRecallDate && (
                  <p className="text-sm text-gray-500 mt-1">
                    Next appointment: {new Date(chartData.nextRecallDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Treatment recommendations */}
        <div className="border rounded-md p-4">
          <h3 className="text-base font-medium mb-2">Treatment Recommendations</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Recommended Procedures:</h4>
              <ul className="list-disc pl-5 space-y-1">
                {chartData.recommendedTreatments.map((treatment, index) => (
                  <li key={index} className="text-sm">{treatment}</li>
                ))}
              </ul>
            </div>
            
            {chartData.homeCarePlan && (
              <div>
                <h4 className="text-sm font-medium mb-2">Home Care Plan:</h4>
                <p className="text-sm">{chartData.homeCarePlan}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Areas of concern */}
        <div className="border rounded-md p-4">
          <h3 className="text-base font-medium mb-2">Areas of Concern</h3>
          
          {chartData.worstSites.length > 0 ? (
            <div className="space-y-4">
              <h4 className="text-sm font-medium mb-2">Worst Sites:</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tooth #</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Pocket Depth</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chartData.worstSites.map((site, index) => (
                    <TableRow key={index}>
                      <TableCell>{site.toothId}</TableCell>
                      <TableCell>{site.position}</TableCell>
                      <TableCell>{site.depth} mm</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No deep pockets detected.</p>
          )}
        </div>
        
        {/* AI Summary */}
        <div className="border rounded-md p-4 bg-gray-50">
          <h3 className="text-base font-medium mb-2">AI Summary</h3>
          <p className="text-sm">
            {chartData.aiSummary || "Chart analysis complete. See recommendations above."}
          </p>
          <div className="mt-4 text-xs text-gray-500 flex items-center">
            <Brain className="h-3 w-3 mr-1" />
            <p>Chart assessment generated on {new Date(chartData.chartDate).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <Card className="w-full max-h-[calc(100vh-80px)]">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Periodontal Chart</CardTitle>
            <CardDescription>
              AI-powered periodontal assessment and analysis
            </CardDescription>
          </div>
          
          {!readOnly && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={savePerioChart}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Chart
              </Button>
              
              <Button 
                size="sm" 
                onClick={generateRiskAnalysis}
                disabled={isAnalyzing}
              >
                <Brain className="h-4 w-4 mr-2" />
                {isAnalyzing ? 'Analyzing...' : 'AI Analysis'}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="max-h-[calc(100vh-220px)] overflow-hidden">
        <ScrollArea className="h-[calc(100vh-240px)] pr-4">
        {/* Current statistics */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="rounded-lg bg-blue-50 p-3">
            <p className="text-xs text-blue-700 mb-1">Bleeding on Probing</p>
            <p className="text-xl font-semibold">{chartData.bop}%</p>
          </div>
          
          <div className="rounded-lg bg-green-50 p-3">
            <p className="text-xs text-green-700 mb-1">Plaque Score</p>
            <p className="text-xl font-semibold">{chartData.plaque}%</p>
          </div>
          
          <div className="rounded-lg bg-purple-50 p-3">
            <p className="text-xs text-purple-700 mb-1">Suppuration</p>
            <p className="text-xl font-semibold">{chartData.suppuration}%</p>
          </div>
        </div>
      
        {/* Tabs for chart data and AI insights */}
        <Tabs defaultValue="chart" value={activeTab} onValueChange={(value) => setActiveTab(value as 'chart' | 'aiAnalysis')}>
          <TabsList className="w-full">
            <TabsTrigger value="chart" className="flex-1">
              Chart Data
            </TabsTrigger>
            <TabsTrigger 
              value="aiAnalysis" 
              className="flex-1"
              disabled={chartData.worstSites.length === 0 && !showAIInsights}
            >
              AI Insights {chartData.riskLevel && (
                <Badge 
                  variant={chartData.riskLevel === 'high' ? 'destructive' : 'outline'}
                  className={`ml-2 ${
                    chartData.riskLevel === 'high' ? 'bg-red-100 text-red-800' : 
                    chartData.riskLevel === 'moderate' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-green-100 text-green-800'
                  }`}
                >
                  {chartData.riskLevel}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          {/* Chart Data Tab */}
          <TabsContent value="chart" className="mt-4 space-y-6">
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
                      <div className="w-4 h-4 mr-1 bg-green-100 border border-gray-300 flex items-center justify-center text-xs">✓</div>
                      <span className="text-xs">Plaque</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* AI Insights Tab */}
          <TabsContent value="aiAnalysis" className="mt-4">
            {chartData.worstSites.length > 0 || showAIInsights ? (
              renderAIInsights()
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="text-6xl mb-4">🧠</div>
                <h3 className="text-xl font-semibold mb-2">AI Analysis Not Generated</h3>
                <p className="text-gray-500 mb-6 max-w-md">
                  Use the AI Analysis button to generate intelligent insights, risk assessment, 
                  and personalized treatment recommendations based on your periodontal measurements.
                </p>
                <Button onClick={generateRiskAnalysis} disabled={isAnalyzing}>
                  {isAnalyzing ? 'Analyzing...' : 'Generate AI Analysis'}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
        </ScrollArea>
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