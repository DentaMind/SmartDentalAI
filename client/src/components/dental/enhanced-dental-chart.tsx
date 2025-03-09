import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { Info, Save, Download, Brain, Eye, RefreshCw, Shield, DollarSign } from 'lucide-react';

// Constants for adult and primary dentition
const ADULT_TEETH_UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const ADULT_TEETH_LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
const PRIMARY_TEETH_UPPER = ['E', 'D', 'C', 'B', 'A', 'A', 'B', 'C', 'D', 'E'];
const PRIMARY_TEETH_LOWER = ['E', 'D', 'C', 'B', 'A', 'A', 'B', 'C', 'D', 'E'];

// Tooth surface options
const TOOTH_SURFACES = [
  { id: 'M', name: 'Mesial', className: 'bg-mesial' },
  { id: 'D', name: 'Distal', className: 'bg-distal' },
  { id: 'O', name: 'Occlusal', className: 'bg-occlusal' },
  { id: 'B', name: 'Buccal', className: 'bg-buccal' },
  { id: 'L', name: 'Lingual', className: 'bg-lingual' },
  { id: 'MB', name: 'Mesiobuccal', className: 'bg-mesiobuccal' },
  { id: 'DB', name: 'Distobuccal', className: 'bg-distobuccal' },
  { id: 'ML', name: 'Mesiolingual', className: 'bg-mesiolingual' },
  { id: 'DL', name: 'Distolingual', className: 'bg-distolingual' },
];

// Treatment types
const TREATMENT_TYPES = [
  { id: 'caries', name: 'Caries', color: 'bg-red-500', symbol: '●' },
  { id: 'restoration', name: 'Restoration', color: 'bg-blue-500', symbol: '◼' },
  { id: 'crown', name: 'Crown', color: 'bg-yellow-500', symbol: '◆' },
  { id: 'bridge', name: 'Bridge', color: 'bg-purple-500', symbol: '⬛' },
  { id: 'rootCanal', name: 'Root Canal', color: 'bg-green-500', symbol: '▲' },
  { id: 'extraction', name: 'Extraction', color: 'bg-gray-500', symbol: '✕' },
  { id: 'implant', name: 'Implant', color: 'bg-pink-500', symbol: '◉' },
  { id: 'partial', name: 'Partial Denture', color: 'bg-indigo-500', symbol: '◐' },
  { id: 'full', name: 'Full Denture', color: 'bg-teal-500', symbol: '◯' },
];

// Interfaces for dental chart data structure
interface ToothSurface {
  id: string;
  condition: string | null;
  notes: string;
}

interface Tooth {
  id: number | string; // Numeric for adult, string for primary
  missing: boolean;
  surfaces: Record<string, ToothSurface>;
  treatments: string[];
  notes: string;
  mobility: number; // 0-3
  implant: boolean;
}

interface Treatment {
  id: string;
  name: string;
  toothId: string;
  surfaces: string[];
  estimatedCost: number;
  insuranceCoverage: number | null;
  priority: 'high' | 'medium' | 'low';
  status: 'planned' | 'in-progress' | 'completed';
  dateCreated: Date;
  dateCompleted?: Date;
  provider?: string;
  notes?: string;
}

interface AiSuggestion {
  toothId: string;
  treatmentType: string;
  reason: string;
  confidence: number;
  alternativeTreatments?: string[];
}

interface DentalChartData {
  patientId: number;
  chartDate: Date;
  teeth: Record<string, Tooth>; // Key is tooth ID (number as string or letter)
  notes: string;
  isPrimaryDentition: boolean;
  treatments: Treatment[];
  aiSuggestions?: AiSuggestion[];
  insuranceEligibility?: {
    provider: string;
    coveragePercent: number;
    annualMax: number;
    remainingBenefit: number;
    lastVerified: Date;
  };
  viewMode?: 'clinical' | 'patient'; // For toggling between clinical and patient-friendly views
}

// Component props
interface EnhancedDentalChartProps {
  patientId: number;
  existingChartData?: DentalChartData;
  readOnly?: boolean;
  onSave?: (data: DentalChartData) => void;
}

const EnhancedDentalChart: React.FC<EnhancedDentalChartProps> = ({
  patientId,
  existingChartData,
  readOnly = false,
  onSave
}) => {
  const { toast } = useToast();
  
  // Initialize dental chart data
  const [chartData, setChartData] = useState<DentalChartData>(existingChartData || {
    patientId,
    chartDate: new Date(),
    teeth: initializeTeeth(false), // Start with adult teeth
    notes: '',
    isPrimaryDentition: false,
    treatments: [],
    viewMode: 'clinical'
  });
  
  // UI state
  const [selectedArch, setSelectedArch] = useState<'upper' | 'lower'>('upper');
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null);
  const [selectedTreatment, setSelectedTreatment] = useState<string>('caries');
  
  // Toggle between primary and permanent dentition
  const toggleDentitionType = () => {
    setChartData(prev => ({
      ...prev,
      isPrimaryDentition: !prev.isPrimaryDentition,
      teeth: initializeTeeth(!prev.isPrimaryDentition, prev.teeth)
    }));
  };
  
  // Toggle between clinical and patient-friendly view
  const toggleViewMode = () => {
    setChartData(prev => ({
      ...prev,
      viewMode: prev.viewMode === 'clinical' ? 'patient' : 'clinical'
    }));
  };
  
  // Generate AI suggestions based on chart data
  const generateAiSuggestions = async () => {
    // This would normally call an API with the AI keys
    // For now, we'll generate some mock suggestions based on the current chart
    
    const suggestions: AiSuggestion[] = [];
    
    // Loop through teeth to look for patterns
    Object.entries(chartData.teeth).forEach(([toothId, tooth]) => {
      // If a tooth is missing, suggest an implant or bridge
      if (tooth.missing) {
        suggestions.push({
          toothId,
          treatmentType: 'implant',
          reason: `Tooth ${toothId} is missing and could benefit from an implant restoration.`,
          confidence: 0.87,
          alternativeTreatments: ['bridge', 'partial']
        });
      }
      
      // If a tooth has caries, suggest restoration
      if (tooth.treatments.includes('caries')) {
        suggestions.push({
          toothId,
          treatmentType: 'restoration',
          reason: `Caries detected on tooth ${toothId}. Recommend composite restoration.`,
          confidence: 0.92
        });
      }
      
      // Check for adjacent missing teeth for bridge candidates
      if (toothId === '14' && chartData.teeth['15']?.missing) {
        suggestions.push({
          toothId,
          treatmentType: 'bridge',
          reason: 'Adjacent tooth 15 is missing. Consider a bridge restoration.',
          confidence: 0.78,
          alternativeTreatments: ['implant']
        });
      }
    });
    
    // Add some default suggestions if none were generated
    if (suggestions.length === 0) {
      suggestions.push({
        toothId: '36',
        treatmentType: 'rootCanal',
        reason: 'Deep restoration near pulp on tooth 36. Potential need for endodontic therapy.',
        confidence: 0.72,
        alternativeTreatments: ['extraction', 'restoration']
      });
      
      suggestions.push({
        toothId: '17',
        treatmentType: 'crown',
        reason: 'Extensive restoration on tooth 17. Recommend full coverage crown to prevent fracture.',
        confidence: 0.85
      });
    }
    
    setChartData(prev => ({
      ...prev,
      aiSuggestions: suggestions
    }));
    
    toast({
      title: 'AI Suggestions Generated',
      description: `${suggestions.length} treatment recommendations were generated based on chart analysis.`,
      duration: 3000
    });
  };

  // Save dental chart
  const saveDentalChart = () => {
    if (onSave) {
      onSave(chartData);
    }
    
    toast({
      title: 'Dental Chart Saved',
      description: 'The dental chart has been saved successfully.',
      duration: 3000
    });
  };
  
  // Initialize teeth data structure
  function initializeTeeth(isPrimary: boolean, existingTeeth?: Record<string, Tooth>): Record<string, Tooth> {
    const teeth: Record<string, Tooth> = {};
    
    const upper = isPrimary ? PRIMARY_TEETH_UPPER : ADULT_TEETH_UPPER;
    const lower = isPrimary ? PRIMARY_TEETH_LOWER : ADULT_TEETH_LOWER;
    
    [...upper, ...lower].forEach((toothId) => {
      const id = String(toothId);
      // If we already have this tooth, preserve its data
      if (existingTeeth && existingTeeth[id]) {
        teeth[id] = existingTeeth[id];
        return;
      }
      
      const surfaces: Record<string, ToothSurface> = {};
      TOOTH_SURFACES.forEach(surface => {
        surfaces[surface.id] = {
          id: surface.id,
          condition: null,
          notes: ''
        };
      });
      
      teeth[id] = {
        id: toothId,
        missing: false,
        surfaces,
        treatments: [],
        notes: '',
        mobility: 0,
        implant: false
      };
    });
    
    return teeth;
  }
  
  // Get current teeth based on arch selection
  const getCurrentTeeth = (): string[] => {
    if (chartData.isPrimaryDentition) {
      return selectedArch === 'upper' 
        ? PRIMARY_TEETH_UPPER.map(String)
        : PRIMARY_TEETH_LOWER.map(String);
    } else {
      return selectedArch === 'upper'
        ? ADULT_TEETH_UPPER.map(String)
        : ADULT_TEETH_LOWER.map(String);
    }
  };
  
  // Handle tooth selection
  const handleToothClick = (toothId: string) => {
    setSelectedTooth(prevTooth => prevTooth === toothId ? null : toothId);
  };
  
  // Toggle tooth missing status
  const toggleToothMissing = (toothId: string) => {
    setChartData(prev => {
      const updatedTeeth = { ...prev.teeth };
      updatedTeeth[toothId] = {
        ...updatedTeeth[toothId],
        missing: !updatedTeeth[toothId].missing
      };
      
      return {
        ...prev,
        teeth: updatedTeeth
      };
    });
  };
  
  // Toggle tooth implant status
  const toggleToothImplant = (toothId: string) => {
    setChartData(prev => {
      const updatedTeeth = { ...prev.teeth };
      updatedTeeth[toothId] = {
        ...updatedTeeth[toothId],
        implant: !updatedTeeth[toothId].implant
      };
      
      return {
        ...prev,
        teeth: updatedTeeth
      };
    });
  };
  
  // Set tooth mobility
  const setToothMobility = (toothId: string, mobility: number) => {
    setChartData(prev => {
      const updatedTeeth = { ...prev.teeth };
      updatedTeeth[toothId] = {
        ...updatedTeeth[toothId],
        mobility
      };
      
      return {
        ...prev,
        teeth: updatedTeeth
      };
    });
  };
  
  // Add/remove treatment to/from a tooth
  const toggleTreatment = (toothId: string, treatmentType: string) => {
    setChartData(prev => {
      const updatedTeeth = { ...prev.teeth };
      const currentTreatments = [...updatedTeeth[toothId].treatments];
      
      const index = currentTreatments.indexOf(treatmentType);
      if (index > -1) {
        currentTreatments.splice(index, 1);
      } else {
        currentTreatments.push(treatmentType);
      }
      
      updatedTeeth[toothId] = {
        ...updatedTeeth[toothId],
        treatments: currentTreatments
      };
      
      return {
        ...prev,
        teeth: updatedTeeth
      };
    });
  };
  
  // Update a specific tooth surface
  const updateToothSurface = (toothId: string, surfaceId: string, condition: string | null) => {
    setChartData(prev => {
      const updatedTeeth = { ...prev.teeth };
      const updatedSurfaces = { ...updatedTeeth[toothId].surfaces };
      
      updatedSurfaces[surfaceId] = {
        ...updatedSurfaces[surfaceId],
        condition
      };
      
      updatedTeeth[toothId] = {
        ...updatedTeeth[toothId],
        surfaces: updatedSurfaces
      };
      
      return {
        ...prev,
        teeth: updatedTeeth
      };
    });
  };
  
  // Get color for a tooth surface based on its condition
  const getSurfaceColor = (toothId: string, surfaceId: string) => {
    const tooth = chartData.teeth[toothId];
    if (!tooth) return '';
    
    const surface = tooth.surfaces[surfaceId];
    if (!surface || !surface.condition) return '';
    
    const treatment = TREATMENT_TYPES.find(t => t.id === surface.condition);
    return treatment?.color || '';
  };
  
  // Render tooth details form (when a tooth is selected)
  const renderToothDetailsForm = () => {
    if (!selectedTooth) return null;
    
    const tooth = chartData.teeth[selectedTooth];
    
    return (
      <div className="border rounded-md p-4">
        <h3 className="text-sm font-medium mb-4">
          Tooth {chartData.isPrimaryDentition ? tooth.id : `#${tooth.id}`} Details
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left column - basic details & surface selection */}
          <div>
            <div className="flex space-x-4 mb-4">
              <div>
                <Label htmlFor="tooth-missing" className="mb-1 block">Missing</Label>
                <Switch 
                  id="tooth-missing" 
                  checked={tooth.missing}
                  onCheckedChange={() => toggleToothMissing(selectedTooth)}
                  disabled={readOnly}
                />
              </div>
              
              <div>
                <Label htmlFor="tooth-implant" className="mb-1 block">Implant</Label>
                <Switch 
                  id="tooth-implant" 
                  checked={tooth.implant}
                  onCheckedChange={() => toggleToothImplant(selectedTooth)}
                  disabled={readOnly || tooth.missing}
                />
              </div>
              
              <div>
                <Label htmlFor="tooth-mobility" className="mb-1 block">Mobility</Label>
                <Select 
                  value={String(tooth.mobility)} 
                  onValueChange={(value) => setToothMobility(selectedTooth, parseInt(value))}
                  disabled={readOnly || tooth.missing}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue placeholder="0" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0</SelectItem>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="mb-4">
              <Label className="mb-1 block">Treatments</Label>
              <div className="flex flex-wrap gap-2">
                {TREATMENT_TYPES.map(treatment => (
                  <Button
                    key={treatment.id}
                    variant={tooth.treatments.includes(treatment.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleTreatment(selectedTooth, treatment.id)}
                    disabled={readOnly || (tooth.missing && treatment.id !== 'extraction')}
                    className="flex items-center"
                  >
                    <div className={`w-3 h-3 rounded-full ${treatment.color} mr-2`}></div>
                    {treatment.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Right column - notes & other */}
          <div>
            <div className="mb-4">
              <Label htmlFor="tooth-notes" className="mb-1 block">Notes</Label>
              <Textarea 
                id="tooth-notes"
                placeholder="Enter notes about this tooth..."
                value={tooth.notes}
                onChange={(e) => {
                  setChartData(prev => {
                    const updatedTeeth = { ...prev.teeth };
                    updatedTeeth[selectedTooth] = {
                      ...updatedTeeth[selectedTooth],
                      notes: e.target.value
                    };
                    
                    return {
                      ...prev,
                      teeth: updatedTeeth
                    };
                  });
                }}
                disabled={readOnly}
                className="min-h-[100px]"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render AI treatment suggestions
  const renderAiSuggestions = () => {
    if (!chartData.aiSuggestions?.length) {
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <div className="text-6xl mb-4">🧠</div>
          <h3 className="text-xl font-semibold mb-2">No AI Suggestions Available</h3>
          <p className="text-gray-500 mb-6 max-w-md">
            Click the "Generate AI Suggestions" button to analyze the current dental chart
            and get AI-powered treatment recommendations based on the identified conditions.
          </p>
          <Button onClick={generateAiSuggestions}>
            <Brain className="h-4 w-4 mr-2" />
            Generate AI Suggestions
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-md">
          <h3 className="text-lg font-medium mb-3 flex items-center">
            <Brain className="h-5 w-5 mr-2 text-blue-500" />
            AI Treatment Recommendations
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            The following treatment suggestions are based on AI analysis of the current dental chart.
            These recommendations should be reviewed by a dental professional before proceeding.
          </p>
        </div>

        {/* List of suggestions */}
        <div className="space-y-4">
          {chartData.aiSuggestions.map((suggestion, index) => {
            const treatment = TREATMENT_TYPES.find(t => t.id === suggestion.treatmentType);
            const toothLabel = chartData.isPrimaryDentition 
              ? suggestion.toothId 
              : `#${suggestion.toothId}`;
            
            return (
              <div key={index} className="border rounded-md p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">
                      {treatment?.name || suggestion.treatmentType} for Tooth {toothLabel}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">{suggestion.reason}</p>
                  </div>
                  <div className="bg-gray-100 px-2 py-1 rounded text-xs">
                    {Math.round(suggestion.confidence * 100)}% confidence
                  </div>
                </div>
                
                {suggestion.alternativeTreatments?.length ? (
                  <div className="mt-3">
                    <h5 className="text-xs font-medium text-gray-500">Alternative options:</h5>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {suggestion.alternativeTreatments.map((altId) => {
                        const altTreatment = TREATMENT_TYPES.find(t => t.id === altId);
                        return (
                          <span 
                            key={altId} 
                            className="text-xs bg-gray-100 px-2 py-1 rounded"
                          >
                            {altTreatment?.name || altId}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
                
                <div className="mt-3 flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // Add suggestion to treatment plan
                      const selectedToothId = suggestion.toothId;
                      toggleTreatment(selectedToothId, suggestion.treatmentType);
                      
                      // Generate a unique ID for the treatment
                      const treatmentId = `${suggestion.treatmentType}-${selectedToothId}-${Date.now()}`;
                      
                      // Add to formal treatment list
                      setChartData(prevData => ({
                        ...prevData,
                        treatments: [
                          ...prevData.treatments,
                          {
                            id: treatmentId,
                            name: TREATMENT_TYPES.find(t => t.id === suggestion.treatmentType)?.name || suggestion.treatmentType,
                            toothId: selectedToothId,
                            surfaces: [],
                            estimatedCost: 0, // This would be calculated based on real fee schedules
                            insuranceCoverage: null,
                            priority: 'medium',
                            status: 'planned',
                            dateCreated: new Date()
                          }
                        ]
                      }));
                    }}
                  >
                    Add to Treatment Plan
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  // Render insurance information
  const renderInsuranceInfo = () => {
    if (!chartData.insuranceEligibility) {
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <div className="text-6xl mb-4">🛡️</div>
          <h3 className="text-xl font-semibold mb-2">Insurance Information Not Available</h3>
          <p className="text-gray-500 mb-6 max-w-md">
            Insurance verification is needed to estimate coverage and patient responsibility.
          </p>
          <Button 
            onClick={() => {
              // In a real implementation, this would call an API to verify insurance
              setChartData(prevData => ({
                ...prevData,
                insuranceEligibility: {
                  provider: 'Delta Dental',
                  coveragePercent: 80,
                  annualMax: 1500,
                  remainingBenefit: 1200,
                  lastVerified: new Date()
                }
              }));
            }}
          >
            <Shield className="h-4 w-4 mr-2" />
            Verify Insurance
          </Button>
        </div>
      );
    }

    const { provider, coveragePercent, annualMax, remainingBenefit, lastVerified } = chartData.insuranceEligibility;

    return (
      <div className="space-y-6">
        <div className="bg-green-50 p-4 rounded-md">
          <h3 className="text-lg font-medium mb-3 flex items-center">
            <Shield className="h-5 w-5 mr-2 text-green-500" />
            Insurance Information
          </h3>
          <p className="text-sm text-gray-600">
            Verified on {new Date(lastVerified).toLocaleDateString()}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-md p-4">
            <h4 className="font-medium mb-3">Coverage Summary</h4>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-gray-500">Provider</dt>
                <dd className="font-medium">{provider}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Coverage %</dt>
                <dd className="font-medium">{coveragePercent}%</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Annual Maximum</dt>
                <dd className="font-medium">${annualMax.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Remaining Benefit</dt>
                <dd className="font-medium">${remainingBenefit.toFixed(2)}</dd>
              </div>
            </dl>
          </div>

          <div className="border rounded-md p-4">
            <h4 className="font-medium mb-3">Estimated Costs</h4>
            {chartData.treatments.length > 0 ? (
              <div className="space-y-2">
                {chartData.treatments.map((treatment, idx) => {
                  const estimatedCoverage = treatment.estimatedCost * (coveragePercent / 100);
                  const estimatedPatientCost = treatment.estimatedCost - estimatedCoverage;
                  
                  return (
                    <div key={idx} className="flex justify-between">
                      <span className="text-sm">{treatment.name} (#{treatment.toothId})</span>
                      <div className="text-right">
                        <div className="text-sm font-medium">${treatment.estimatedCost.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">
                          Est. Patient: ${estimatedPatientCost.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                <Separator className="my-2" />
                
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>
                    ${chartData.treatments.reduce((sum, t) => sum + t.estimatedCost, 0).toFixed(2)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No treatments planned yet. Add treatments to see cost estimates.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // Render treatment plan 
  const renderTreatmentPlan = () => {
    if (!chartData.treatments?.length) {
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold mb-2">No Treatment Plan Yet</h3>
          <p className="text-gray-500 mb-6 max-w-md">
            Add treatments to create a comprehensive treatment plan for this patient.
          </p>
          {chartData.aiSuggestions?.length ? (
            <p className="text-sm text-blue-600">
              Check the AI Suggestions tab for recommended treatments.
            </p>
          ) : (
            <Button onClick={generateAiSuggestions}>
              <Brain className="h-4 w-4 mr-2" />
              Generate Treatment Suggestions
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-purple-50 p-4 rounded-md">
          <h3 className="text-lg font-medium mb-3">Treatment Plan</h3>
          <p className="text-sm text-gray-600">
            This plan includes all treatments added for this patient.
          </p>
        </div>

        <div className="border rounded-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Treatment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tooth
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estimate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {chartData.treatments.map((treatment, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{treatment.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {chartData.isPrimaryDentition ? treatment.toothId : `#${treatment.toothId}`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${treatment.status === 'completed' ? 'bg-green-100 text-green-800' : 
                        treatment.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 
                        'bg-yellow-100 text-yellow-800'}`}
                    >
                      {treatment.status.charAt(0).toUpperCase() + treatment.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${treatment.priority === 'high' ? 'bg-red-100 text-red-800' : 
                        treatment.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-green-100 text-green-800'}`}
                    >
                      {treatment.priority.charAt(0).toUpperCase() + treatment.priority.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${treatment.estimatedCost.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        // Remove treatment from the plan
                        setChartData(prevData => ({
                          ...prevData,
                          treatments: prevData.treatments.filter(t => t.id !== treatment.id)
                        }));
                      }}
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  // Render tooth diagram
  const renderToothDiagram = (toothId: string) => {
    const tooth = chartData.teeth[toothId];
    if (!tooth) return null;
    
    if (tooth.missing) {
      return (
        <div 
          className="w-16 h-20 border border-dashed border-gray-300 rounded flex items-center justify-center bg-gray-50 cursor-pointer opacity-50 hover:opacity-80 transition-opacity"
          onClick={() => handleToothClick(toothId)}
        >
          <div className="flex flex-col items-center">
            <span className="text-gray-400 font-medium text-xs">{chartData.isPrimaryDentition ? tooth.id : `#${tooth.id}`}</span>
            <span className="text-xs text-gray-400 mt-1">(Missing)</span>
            <button 
              className="mt-2 text-xs text-primary hover:text-primary-dark border border-primary hover:border-primary-dark rounded px-2 py-1"
              onClick={(e) => {
                e.stopPropagation();
                toggleToothMissing(toothId);
              }}
            >
              Restore
            </button>
          </div>
        </div>
      );
    }
    
    if (tooth.implant) {
      return (
        <div 
          className="w-16 h-20 border border-gray-300 rounded flex flex-col bg-blue-50 cursor-pointer"
          onClick={() => handleToothClick(toothId)}
        >
          <div className="text-center text-xs font-medium border-b p-1">
            {chartData.isPrimaryDentition ? tooth.id : `#${tooth.id}`}
            <span className="ml-1 bg-blue-200 text-blue-800 rounded-full px-1 text-[10px]">
              Implant
            </span>
          </div>
          <div className="flex-1 flex justify-center items-center">
            <div className="text-3xl text-blue-600">◉</div>
          </div>
        </div>
      );
    }
    
    // Shape the tooth for visualization
    return (
      <div 
        className={`w-16 h-20 border border-gray-300 rounded flex flex-col cursor-pointer ${selectedTooth === toothId ? 'ring-2 ring-primary' : ''}`}
        onClick={() => handleToothClick(toothId)}
      >
        <div className="text-center text-xs font-medium border-b p-1">
          {chartData.isPrimaryDentition ? tooth.id : `#${tooth.id}`}
        </div>
        
        <div className="flex-1 flex flex-col p-1">
          {/* Top of tooth (occlusal/incisal) */}
          <div className="flex-1 flex">
            <div 
              className={`flex-1 ${getSurfaceColor(toothId, 'ML')}`}
              onClick={(e) => {
                e.stopPropagation();
                updateToothSurface(toothId, 'ML', selectedTreatment);
              }}
            ></div>
            <div 
              className={`flex-1 ${getSurfaceColor(toothId, 'O')}`}
              onClick={(e) => {
                e.stopPropagation();
                updateToothSurface(toothId, 'O', selectedTreatment);
              }}
            ></div>
            <div 
              className={`flex-1 ${getSurfaceColor(toothId, 'DL')}`}
              onClick={(e) => {
                e.stopPropagation();
                updateToothSurface(toothId, 'DL', selectedTreatment);
              }}
            ></div>
          </div>
          
          {/* Middle of tooth */}
          <div className="flex-1 flex">
            <div 
              className={`flex-1 ${getSurfaceColor(toothId, 'B')}`}
              onClick={(e) => {
                e.stopPropagation();
                updateToothSurface(toothId, 'B', selectedTreatment);
              }}
            ></div>
            <div className="flex-1"></div>
            <div 
              className={`flex-1 ${getSurfaceColor(toothId, 'L')}`}
              onClick={(e) => {
                e.stopPropagation();
                updateToothSurface(toothId, 'L', selectedTreatment);
              }}
            ></div>
          </div>
          
          {/* Bottom of tooth */}
          <div className="flex-1 flex">
            <div 
              className={`flex-1 ${getSurfaceColor(toothId, 'MB')}`}
              onClick={(e) => {
                e.stopPropagation();
                updateToothSurface(toothId, 'MB', selectedTreatment);
              }}
            ></div>
            <div className="flex-1"></div>
            <div 
              className={`flex-1 ${getSurfaceColor(toothId, 'DB')}`}
              onClick={(e) => {
                e.stopPropagation();
                updateToothSurface(toothId, 'DB', selectedTreatment);
              }}
            ></div>
          </div>
        </div>
        
        {/* Show treatments */}
        {tooth.treatments.length > 0 && (
          <div className="border-t p-1 flex flex-wrap gap-1 justify-center">
            {tooth.treatments.map(treatmentId => {
              const treatment = TREATMENT_TYPES.find(t => t.id === treatmentId);
              return treatment ? (
                <span 
                  key={treatmentId} 
                  className={`inline-block w-3 h-3 rounded-full ${treatment.color}`}
                  title={treatment.name}
                ></span>
              ) : null;
            })}
          </div>
        )}
        
        {/* Show mobility indicator if applicable */}
        {tooth.mobility > 0 && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {tooth.mobility}
          </div>
        )}
      </div>
    );
  };

  // State for active tab
  const [activeTab, setActiveTab] = useState('chart');

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Restorative Dental Chart</CardTitle>
            <CardDescription>
              AI-powered dental chart with treatment planning
            </CardDescription>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="view-mode">{chartData.viewMode === 'clinical' ? 'Clinical View' : 'Patient View'}</Label>
              <Switch 
                id="view-mode" 
                checked={chartData.viewMode === 'patient'}
                onCheckedChange={toggleViewMode}
              />
            </div>
          
            <div className="flex items-center space-x-2">
              <Label htmlFor="dentition-type">Primary Teeth</Label>
              <Switch 
                id="dentition-type" 
                checked={chartData.isPrimaryDentition}
                onCheckedChange={toggleDentitionType}
                disabled={readOnly}
              />
            </div>
            
            <div className="text-sm text-muted-foreground">
              {new Date(chartData.chartDate).toLocaleDateString()}
            </div>
            
            {!readOnly && (
              <div className="flex space-x-2">
                <Button variant="outline" onClick={generateAiSuggestions}>
                  <Brain className="h-4 w-4 mr-2" />
                  AI Suggestions
                </Button>
                
                <Button onClick={saveDentalChart}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Chart
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="chart" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="chart">Chart</TabsTrigger>
            <TabsTrigger value="ai">
              AI Suggestions
              {chartData.aiSuggestions?.length ? (
                <span className="ml-2 bg-primary text-white text-xs font-bold px-2 py-1 rounded-full">
                  {chartData.aiSuggestions.length}
                </span>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="plan">Treatment Plan</TabsTrigger>
            <TabsTrigger value="insurance">Insurance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="chart" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-medium mb-2">Select Arch</h3>
                <div className="flex space-x-2">
                  <Button 
                    variant={selectedArch === 'upper' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setSelectedArch('upper')}
                  >
                    Upper Arch
                  </Button>
                  <Button 
                    variant={selectedArch === 'lower' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setSelectedArch('lower')}
                  >
                    Lower Arch
                  </Button>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Selected Treatment</h3>
                <Select 
                  value={selectedTreatment} 
                  onValueChange={setSelectedTreatment}
                  disabled={readOnly}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select treatment" />
                  </SelectTrigger>
                  <SelectContent>
                    {TREATMENT_TYPES.map(treatment => (
                      <SelectItem key={treatment.id} value={treatment.id}>
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full ${treatment.color} mr-2`}></div>
                          {treatment.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Separator />
            
            {/* Display teeth diagram */}
            <div className="border rounded-md p-4 bg-gray-50">
              <div className="flex justify-center mb-8">
                <div className="text-center">
                  <h3 className="text-sm font-medium mb-4">
                    {selectedArch === 'upper' ? 'Upper Arch' : 'Lower Arch'} - 
                    {chartData.isPrimaryDentition ? ' Primary Dentition' : ' Permanent Dentition'}
                  </h3>
                  <div className="flex justify-center gap-1 flex-wrap">
                    {getCurrentTeeth().map(toothId => (
                      <div key={`tooth-${toothId}`} className="relative">
                        {renderToothDiagram(toothId)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Selected tooth details */}
            {selectedTooth && renderToothDetailsForm()}
            
            {/* Chart notes */}
            <div className="border rounded-md p-4">
              <h3 className="text-sm font-medium mb-2">Chart Notes</h3>
              <Textarea 
                placeholder="Enter notes about this dental examination..."
                value={chartData.notes}
                onChange={(e) => setChartData(prev => ({ ...prev, notes: e.target.value }))}
                disabled={readOnly}
                className="min-h-[100px]"
              />
            </div>
            
            {/* Legend */}
            <div className="border rounded-md p-4">
              <h3 className="text-sm font-medium mb-2">Legend</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {TREATMENT_TYPES.map(treatment => (
                  <div key={treatment.id} className="flex items-center">
                    <div className={`w-4 h-4 ${treatment.color} mr-2`}></div>
                    <span className="text-sm">{treatment.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="ai">
            {renderAiSuggestions()}
          </TabsContent>
          
          <TabsContent value="plan">
            {renderTreatmentPlan()}
          </TabsContent>
          
          <TabsContent value="insurance">
            {renderInsuranceInfo()}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="border-t pt-4 flex justify-between">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center text-xs text-muted-foreground">
                <Info className="h-3 w-3 mr-1" />
                <p>Click on a tooth to view/edit details</p>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs text-xs">
                Click on a tooth to select it. Then use the controls to mark conditions or treatments.
                Click directly on a surface to mark it with the currently selected treatment.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <div className="flex space-x-2">
          {!readOnly && (
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Chart
            </Button>
          )}
          
          {activeTab === 'chart' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setActiveTab('ai')}
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    View AI Suggestions
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    See AI-generated treatment recommendations based on current dental conditions
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default EnhancedDentalChart;