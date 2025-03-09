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

// Helper function to create empty tooth data
const createEmptyToothData = (id: number | string): Tooth => {
  const surfaces: Record<string, ToothSurface> = {};
  
  TOOTH_SURFACES.forEach(surface => {
    surfaces[surface.id] = {
      id: surface.id,
      condition: null,
      notes: ''
    };
  });
  
  return {
    id,
    missing: false,
    surfaces,
    treatments: [],
    notes: '',
    mobility: 0,
    implant: false
  };
};

// Initialize an empty dental chart
const initializeEmptyChart = (patientId: number, isPrimary: boolean = false): DentalChartData => {
  const teeth: Record<string, Tooth> = {};
  
  // Create adult teeth if not primary
  if (!isPrimary) {
    // Upper adult teeth (1-16)
    for (let i = 1; i <= 4; i++) {
      for (let j = 8; j >= 1; j--) {
        const toothId = i === 1 ? j : (i === 2 ? j + 10 : (i === 3 ? j + 20 : j + 30));
        teeth[toothId.toString()] = createEmptyToothData(toothId);
      }
    }
  } else {
    // Primary teeth (A-T)
    const primaryTeeth = [...PRIMARY_TEETH_UPPER, ...PRIMARY_TEETH_LOWER];
    primaryTeeth.forEach((id, index) => {
      // Create unique id like "A1", "B2" etc. based on position
      const uniqueId = `${id}${Math.floor(index / 5) + 1}`;
      teeth[uniqueId] = createEmptyToothData(uniqueId);
    });
  }
  
  return {
    patientId,
    chartDate: new Date(),
    teeth,
    notes: '',
    isPrimaryDentition: isPrimary,
    treatments: [],
    aiSuggestions: [],
    viewMode: 'clinical'
  };
};

// Main dental chart component
const EnhancedDentalChart: React.FC<EnhancedDentalChartProps> = ({
  patientId,
  existingChartData,
  readOnly = false,
  onSave
}) => {
  // State
  const [chartData, setChartData] = useState<DentalChartData>(
    existingChartData || initializeEmptyChart(patientId)
  );
  const [selectedArch, setSelectedArch] = useState<'upper' | 'lower'>('upper');
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null);
  const [selectedTreatment, setSelectedTreatment] = useState<string>('caries');
  const [selectedSurface, setSelectedSurface] = useState<string>('O');
  
  // Toggle between adult and primary dentition
  const toggleDentitionType = () => {
    if (readOnly) return;
    
    setChartData(prevData => ({
      ...prevData,
      isPrimaryDentition: !prevData.isPrimaryDentition,
      teeth: initializeEmptyChart(patientId, !prevData.isPrimaryDentition).teeth
    }));
    
    // Reset selections
    setSelectedTooth(null);
  };
  
  // Toggle between clinical and patient-friendly view
  const toggleViewMode = () => {
    setChartData(prevData => ({
      ...prevData,
      viewMode: prevData.viewMode === 'clinical' ? 'patient' : 'clinical'
    }));
  };
  
  // Generate AI treatment suggestions based on missing teeth and current conditions
  const generateAiSuggestions = async () => {
    try {
      // Count missing teeth
      const missingTeeth = Object.entries(chartData.teeth)
        .filter(([_, tooth]) => tooth.missing)
        .map(([id]) => id);
      
      // Get teeth with conditions
      const teethWithConditions = Object.entries(chartData.teeth)
        .filter(([_, tooth]) => 
          Object.values(tooth.surfaces).some(surface => surface.condition !== null)
        )
        .map(([id, tooth]) => ({
          toothId: id,
          conditions: Object.entries(tooth.surfaces)
            .filter(([_, surface]) => surface.condition !== null)
            .map(([surfaceId, surface]) => ({
              surface: surfaceId,
              condition: surface.condition
            }))
        }));
      
      // Generate mock suggestions based on the dental conditions
      // In a real implementation, this would be an API call to the AI service
      const mockSuggestions: AiSuggestion[] = [];
      
      // For missing teeth, suggest implants or bridges
      missingTeeth.forEach(toothId => {
        // Check adjacent teeth for potential bridge support
        const toothNumber = parseInt(toothId);
        const adjacent = [toothNumber - 1, toothNumber + 1]
          .filter(n => n > 0 && n < 33) // Valid tooth range
          .map(n => n.toString())
          .filter(id => !chartData.teeth[id]?.missing);
          
        if (adjacent.length >= 1) {
          // Suggest bridge if there are adjacent teeth to support it
          mockSuggestions.push({
            toothId,
            treatmentType: 'bridge',
            reason: `Missing tooth with ${adjacent.length} adjacent support(s)`,
            confidence: 0.85,
            alternativeTreatments: ['implant', 'partial']
          });
        } else {
          // Suggest implant if no adjacent teeth
          mockSuggestions.push({
            toothId,
            treatmentType: 'implant',
            reason: 'Missing tooth without adjacent support',
            confidence: 0.9,
            alternativeTreatments: ['partial', 'full']
          });
        }
      });
      
      // For teeth with caries, suggest restorations
      teethWithConditions.forEach(({ toothId, conditions }) => {
        const cariesConditions = conditions.filter(c => c.condition === 'caries');
        if (cariesConditions.length > 0) {
          mockSuggestions.push({
            toothId,
            treatmentType: 'restoration',
            reason: `Caries detected on ${cariesConditions.length} surface(s)`,
            confidence: 0.95,
            alternativeTreatments: cariesConditions.length >= 3 ? ['crown'] : []
          });
          
          // If multiple surfaces have caries, suggest crown
          if (cariesConditions.length >= 3) {
            mockSuggestions.push({
              toothId,
              treatmentType: 'crown',
              reason: 'Extensive caries on multiple surfaces',
              confidence: 0.8,
              alternativeTreatments: ['restoration']
            });
          }
        }
      });
      
      // Update chart data with suggestions
      setChartData(prevData => ({
        ...prevData,
        aiSuggestions: mockSuggestions
      }));
      
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
    }
  };
  
  // Save the dental chart
  const saveDentalChart = () => {
    if (onSave) {
      onSave(chartData);
    }
    console.log('Saving dental chart:', chartData);
  };
  
  // Mark a tooth as missing
  const toggleToothMissing = (toothId: string) => {
    if (readOnly) return;
    
    setChartData(prevData => {
      const updatedTeeth = { ...prevData.teeth };
      const newMissingState = !updatedTeeth[toothId].missing;
      
      // When marking a tooth as missing, clear all treatments and conditions
      if (newMissingState) {
        updatedTeeth[toothId] = {
          ...updatedTeeth[toothId],
          missing: true,
          implant: false,  // Cannot be both missing and implant
          treatments: [],  // Clear treatments
          mobility: 0,     // Clear mobility
          // Reset all surfaces
          surfaces: Object.keys(updatedTeeth[toothId].surfaces).reduce((acc, surfaceId) => {
            acc[surfaceId] = {
              id: surfaceId,
              condition: null,
              notes: ''
            };
            return acc;
          }, {} as Record<string, ToothSurface>)
        };
      } else {
        // Just toggle the missing state when restoring
        updatedTeeth[toothId] = {
          ...updatedTeeth[toothId],
          missing: false
        };
      }
      
      return {
        ...prevData,
        teeth: updatedTeeth
      };
    });
    
    // Auto-close tooth details panel when marking as missing
    if (selectedTooth === toothId && chartData.teeth[toothId] && !chartData.teeth[toothId].missing) {
      setSelectedTooth(null);
    }
  };
  
  // Mark a tooth as implant
  const toggleToothImplant = (toothId: string) => {
    if (readOnly) return;
    
    setChartData(prevData => {
      const updatedTeeth = { ...prevData.teeth };
      updatedTeeth[toothId] = {
        ...updatedTeeth[toothId],
        implant: !updatedTeeth[toothId].implant
      };
      
      return {
        ...prevData,
        teeth: updatedTeeth
      };
    });
  };
  
  // Update tooth surface condition
  const updateToothSurface = (toothId: string, surfaceId: string, conditionId: string | null) => {
    if (readOnly) return;
    
    setChartData(prevData => {
      const updatedTeeth = { ...prevData.teeth };
      
      // Toggle condition if it's already set
      const currentCondition = updatedTeeth[toothId].surfaces[surfaceId].condition;
      const newCondition = currentCondition === conditionId ? null : conditionId;
      
      updatedTeeth[toothId] = {
        ...updatedTeeth[toothId],
        surfaces: {
          ...updatedTeeth[toothId].surfaces,
          [surfaceId]: {
            ...updatedTeeth[toothId].surfaces[surfaceId],
            condition: newCondition
          }
        }
      };
      
      return {
        ...prevData,
        teeth: updatedTeeth
      };
    });
  };
  
  // Add/remove tooth treatment
  const toggleTreatment = (toothId: string, treatmentId: string) => {
    if (readOnly) return;
    
    setChartData(prevData => {
      const updatedTeeth = { ...prevData.teeth };
      const currentTreatments = [...updatedTeeth[toothId].treatments];
      
      const index = currentTreatments.indexOf(treatmentId);
      if (index >= 0) {
        currentTreatments.splice(index, 1);
      } else {
        currentTreatments.push(treatmentId);
      }
      
      updatedTeeth[toothId] = {
        ...updatedTeeth[toothId],
        treatments: currentTreatments
      };
      
      return {
        ...prevData,
        teeth: updatedTeeth
      };
    });
  };
  
  // Update tooth mobility
  const updateToothMobility = (toothId: string, value: number) => {
    if (readOnly) return;
    
    setChartData(prevData => {
      const updatedTeeth = { ...prevData.teeth };
      updatedTeeth[toothId] = {
        ...updatedTeeth[toothId],
        mobility: value
      };
      
      return {
        ...prevData,
        teeth: updatedTeeth
      };
    });
  };
  
  // Handle tooth click
  const handleToothClick = (toothId: string) => {
    setSelectedTooth(selectedTooth === toothId ? null : toothId);
  };
  
  // Get the current teeth array based on selected arch and dentition type
  const getCurrentTeeth = () => {
    if (chartData.isPrimaryDentition) {
      return selectedArch === 'upper' ? PRIMARY_TEETH_UPPER.map((t, i) => `${t}${i < 5 ? 1 : 2}`) : PRIMARY_TEETH_LOWER.map((t, i) => `${t}${i < 5 ? 3 : 4}`);
    } else {
      return selectedArch === 'upper' ? ADULT_TEETH_UPPER.map(String) : ADULT_TEETH_LOWER.map(String);
    }
  };
  
  // Get color for a tooth surface based on its condition
  const getSurfaceColor = (toothId: string, surfaceId: string) => {
    const tooth = chartData.teeth[toothId];
    if (!tooth) return 'bg-white';
    
    const surface = tooth.surfaces[surfaceId];
    if (!surface || !surface.condition) return 'bg-white';
    
    const treatment = TREATMENT_TYPES.find(t => t.id === surface.condition);
    return treatment?.color || 'bg-white';
  };
  
  // Render the tooth details form
  const renderToothDetailsForm = () => {
    if (!selectedTooth || !chartData.teeth[selectedTooth]) return null;
    
    const tooth = chartData.teeth[selectedTooth];
    
    return (
      <div className="space-y-4 mt-4 p-4 border rounded-md">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">
            Tooth {chartData.isPrimaryDentition ? tooth.id : `#${tooth.id}`} Details
          </h3>
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => toggleToothMissing(selectedTooth)}
              disabled={readOnly}
            >
              {tooth.missing ? 'Mark as Present' : 'Mark as Missing'}
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => toggleToothImplant(selectedTooth)}
              disabled={readOnly || tooth.missing}
            >
              {tooth.implant ? 'Remove Implant' : 'Mark as Implant'}
            </Button>
          </div>
        </div>
        
        <Separator />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Surface selector */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Surfaces</h4>
            <div className="grid grid-cols-3 gap-2">
              {TOOTH_SURFACES.map(surface => (
                <Button
                  key={surface.id}
                  size="sm"
                  variant="outline"
                  className={`${selectedSurface === surface.id ? 'bg-primary text-white' : ''} ${getSurfaceColor(selectedTooth, surface.id)}`}
                  onClick={() => setSelectedSurface(surface.id)}
                  disabled={readOnly || tooth.missing}
                >
                  {surface.name}
                </Button>
              ))}
            </div>
            
            <h4 className="text-sm font-medium mt-4">Treatment</h4>
            <div className="grid grid-cols-3 gap-2">
              {TREATMENT_TYPES.map(treatment => (
                <Button
                  key={treatment.id}
                  size="sm"
                  variant="outline"
                  className={`${selectedTreatment === treatment.id ? 'bg-primary text-white' : ''}`}
                  onClick={() => setSelectedTreatment(treatment.id)}
                  disabled={readOnly || tooth.missing}
                >
                  <span className="mr-1">{treatment.symbol}</span>
                  {treatment.name}
                </Button>
              ))}
            </div>
            
            <Button
              className="w-full mt-2"
              disabled={readOnly || tooth.missing || !selectedSurface || !selectedTreatment}
              onClick={() => updateToothSurface(selectedTooth, selectedSurface, selectedTreatment)}
            >
              Apply to Surface
            </Button>
          </div>
          
          {/* Tooth properties */}
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Mobility</h4>
              <Select
                value={tooth.mobility.toString()}
                onValueChange={(value) => updateToothMobility(selectedTooth, parseInt(value))}
                disabled={readOnly || tooth.missing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select mobility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 - None</SelectItem>
                  <SelectItem value="1">1 - Slight</SelectItem>
                  <SelectItem value="2">2 - Moderate</SelectItem>
                  <SelectItem value="3">3 - Severe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Planned Treatments</h4>
              <div className="grid grid-cols-2 gap-2">
                {TREATMENT_TYPES.map(treatment => (
                  <div key={treatment.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`treatment-${treatment.id}`}
                      checked={tooth.treatments.includes(treatment.id)}
                      onChange={() => toggleTreatment(selectedTooth, treatment.id)}
                      disabled={readOnly || tooth.missing}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor={`treatment-${treatment.id}`} className="text-sm">
                      {treatment.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Notes</h4>
              <Textarea
                value={tooth.notes}
                onChange={(e) => {
                  if (readOnly) return;
                  
                  setChartData(prevData => {
                    const updatedTeeth = { ...prevData.teeth };
                    updatedTeeth[selectedTooth] = {
                      ...updatedTeeth[selectedTooth],
                      notes: e.target.value
                    };
                    
                    return {
                      ...prevData,
                      teeth: updatedTeeth
                    };
                  });
                }}
                placeholder="Add notes for this tooth"
                disabled={readOnly}
                className="h-20"
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
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <div className="w-4 h-8 bg-gray-400 rounded-full"></div>
            </div>
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
              className={`flex-1 ${getSurfaceColor(toothId, 'L')}`}
              onClick={(e) => {
                e.stopPropagation();
                updateToothSurface(toothId, 'L', selectedTreatment);
              }}
            ></div>
            <div className="flex-1"></div>
            <div 
              className={`flex-1 ${getSurfaceColor(toothId, 'B')}`}
              onClick={(e) => {
                e.stopPropagation();
                updateToothSurface(toothId, 'B', selectedTreatment);
              }}
            ></div>
          </div>
          
          {/* Bottom of tooth */}
          <div className="flex-1 flex">
            <div 
              className={`flex-1 ${getSurfaceColor(toothId, 'M')}`}
              onClick={(e) => {
                e.stopPropagation();
                updateToothSurface(toothId, 'M', selectedTreatment);
              }}
            ></div>
            <div 
              className={`flex-1 ${getSurfaceColor(toothId, 'MB')}`}
              onClick={(e) => {
                e.stopPropagation();
                updateToothSurface(toothId, 'MB', selectedTreatment);
              }}
            ></div>
            <div 
              className={`flex-1 ${getSurfaceColor(toothId, 'D')}`}
              onClick={(e) => {
                e.stopPropagation();
                updateToothSurface(toothId, 'D', selectedTreatment);
              }}
            ></div>
            <div 
              className={`flex-1 ${getSurfaceColor(toothId, 'DB')}`}
              onClick={(e) => {
                e.stopPropagation();
                updateToothSurface(toothId, 'DB', selectedTreatment);
              }}
            ></div>
          </div>
        </div>
        
        {/* Display indicators for treatments */}
        {tooth.treatments.length > 0 && (
          <div className="absolute top-0 right-0 bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs -mt-1 -mr-1">
            {tooth.treatments.length}
          </div>
        )}
        
        {/* Display mobility indicator if present */}
        {tooth.mobility > 0 && (
          <div className="absolute bottom-0 right-0 bg-yellow-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs -mb-1 -mr-1">
            {tooth.mobility}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Dental Chart</CardTitle>
            <CardDescription>
              Interactive dental chart with surface-specific conditions
            </CardDescription>
          </div>
          
          <div className="flex items-center space-x-4">
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
              <Button onClick={saveDentalChart}>
                <Save className="h-4 w-4 mr-2" />
                Save Chart
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
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

export default EnhancedDentalChart;