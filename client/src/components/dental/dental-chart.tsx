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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  Activity, 
  History, 
  ClipboardEdit, 
  Save, 
  Plus, 
  RefreshCw, 
  Calendar, 
  Clock,
  PlusCircle
} from 'lucide-react';

// Tooth statuses
const TOOTH_STATUSES = {
  HEALTHY: 'healthy',
  MISSING: 'missing',
  CROWN: 'crown',
  IMPLANT: 'implant',
  FILLING: 'filling',
  ROOT_CANAL: 'root_canal',
  VENEER: 'veneer',
  BRIDGE: 'bridge',
  EXTRACTION_NEEDED: 'extraction_needed',
  CARIES: 'caries',
  SEALANT: 'sealant',
};

// Surface statuses
const SURFACE_STATUSES = {
  HEALTHY: 'healthy',
  FILLING: 'filling',
  CARIES: 'caries',
  SEALANT: 'sealant',
};

// Adult tooth numbers (FDI Notation)
const ADULT_TEETH_UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const ADULT_TEETH_LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

// Child tooth letters (FDI Notation)
const CHILD_TEETH_UPPER = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65];
const CHILD_TEETH_LOWER = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75];

// Surface names and positions
const SURFACES = ['mesial', 'occlusal', 'distal', 'buccal', 'lingual'];
const POSITIONS = [
  'mesial_buccal', 'mid_buccal', 'distal_buccal',
  'mesial_lingual', 'mid_lingual', 'distal_lingual',
  'mb', 'ml', 'db', 'dl'
];

// Treatment types with colors
const TREATMENT_TYPES = [
  { id: 'filling', name: 'Filling', color: '#4caf50' },
  { id: 'crown', name: 'Crown', color: '#2196f3' },
  { id: 'root_canal', name: 'Root Canal', color: '#f44336' },
  { id: 'extraction', name: 'Extraction', color: '#ff9800' },
  { id: 'implant', name: 'Implant', color: '#9c27b0' },
  { id: 'veneer', name: 'Veneer', color: '#00bcd4' },
  { id: 'bridge', name: 'Bridge', color: '#607d8b' },
  { id: 'denture', name: 'Denture', color: '#795548' },
  { id: 'sealant', name: 'Sealant', color: '#8bc34a' },
  { id: 'cleaning', name: 'Cleaning', color: '#03a9f4' },
];

// Interface representing a tooth
interface ToothData {
  id: number; // Tooth number
  status: string; // Overall tooth status
  surfaces: {
    mesial: string;
    occlusal: string;
    distal: string;
    buccal: string;
    lingual: string;
  };
  positions: {
    mesial_buccal: string;
    mid_buccal: string;
    distal_buccal: string;
    mesial_lingual: string;
    mid_lingual: string;
    distal_lingual: string;
    mb: string;
    ml: string;
    db: string;
    dl: string;
  };
  notes: string;
  treatments: Array<{
    id: string;
    type: string;
    surfaces: string[];
    positions: string[];
    date: string;
    provider: string;
    notes: string;
  }>;
  mobility?: number; // 0-3 scale
  recession?: number; // in mm
  furcation?: number; // 0-3 scale
}

// Interface for dental chart
interface DentalChartData {
  patientId: number;
  adultTeeth: ToothData[];
  childTeeth: ToothData[];
  lastUpdated: string;
  updatedBy: string;
}

// Function to generate empty tooth data
const generateEmptyToothData = (id: number): ToothData => {
  return {
    id,
    status: TOOTH_STATUSES.HEALTHY,
    surfaces: {
      mesial: SURFACE_STATUSES.HEALTHY,
      occlusal: SURFACE_STATUSES.HEALTHY,
      distal: SURFACE_STATUSES.HEALTHY,
      buccal: SURFACE_STATUSES.HEALTHY,
      lingual: SURFACE_STATUSES.HEALTHY,
    },
    notes: '',
    treatments: [],
    mobility: 0,
    recession: 0,
    furcation: 0,
  };
};

// Function to generate empty dental chart
const generateEmptyDentalChart = (patientId: number): DentalChartData => {
  const adultTeeth = [...ADULT_TEETH_UPPER, ...ADULT_TEETH_LOWER].map(id => generateEmptyToothData(id));
  const childTeeth = [...CHILD_TEETH_UPPER, ...CHILD_TEETH_LOWER].map(id => generateEmptyToothData(id));
  
  return {
    patientId,
    adultTeeth,
    childTeeth,
    lastUpdated: new Date().toISOString(),
    updatedBy: 'System',
  };
};

// Color mapping for tooth status visualization
const statusColors = {
  [TOOTH_STATUSES.HEALTHY]: '#ffffff',
  [TOOTH_STATUSES.MISSING]: '#eeeeee',
  [TOOTH_STATUSES.CROWN]: '#2196f3',
  [TOOTH_STATUSES.IMPLANT]: '#9c27b0',
  [TOOTH_STATUSES.FILLING]: '#4caf50',
  [TOOTH_STATUSES.ROOT_CANAL]: '#f44336',
  [TOOTH_STATUSES.VENEER]: '#00bcd4',
  [TOOTH_STATUSES.BRIDGE]: '#607d8b',
  [TOOTH_STATUSES.EXTRACTION_NEEDED]: '#ff9800',
  [TOOTH_STATUSES.CARIES]: '#ffeb3b',
  [TOOTH_STATUSES.SEALANT]: '#8bc34a',
};

interface DentalChartProps {
  patientId: number;
  readOnly?: boolean;
  onSave?: (chartData: DentalChartData) => void;
}

export default function DentalChart({ patientId, readOnly = false, onSave }: DentalChartProps) {
  // In a real app, fetch the chart data from an API
  const [chartData, setChartData] = useState<DentalChartData>(generateEmptyDentalChart(patientId));
  const [selectedTab, setSelectedTab] = useState<string>('adult');
  const [selectedTooth, setSelectedTooth] = useState<ToothData | null>(null);
  const [selectedSurface, setSelectedSurface] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isAddingTreatment, setIsAddingTreatment] = useState<boolean>(false);
  const [newTreatment, setNewTreatment] = useState<{
    type: string;
    surfaces: string[];
    notes: string;
  }>({
    type: '',
    surfaces: [],
    notes: '',
  });

  // Function to handle tooth selection
  const handleToothSelect = (tooth: ToothData) => {
    setSelectedTooth(tooth);
    setSelectedSurface(null);
    setIsDialogOpen(true);
  };

  // Function to handle surface selection
  const handleSurfaceSelect = (toothId: number, surface: string) => {
    const teeth = selectedTab === 'adult' ? chartData.adultTeeth : chartData.childTeeth;
    const tooth = teeth.find(t => t.id === toothId);
    
    if (tooth) {
      setSelectedTooth(tooth);
      setSelectedSurface(surface);
      setIsDialogOpen(true);
    }
  };

  // Function to update tooth status
  const updateToothStatus = (toothId: number, status: string) => {
    if (readOnly) return;
    
    const updateTeeth = (teeth: ToothData[]) => {
      return teeth.map(tooth => {
        if (tooth.id === toothId) {
          return {
            ...tooth,
            status,
          };
        }
        return tooth;
      });
    };
    
    setChartData(prevState => {
      if (selectedTab === 'adult') {
        return {
          ...prevState,
          adultTeeth: updateTeeth(prevState.adultTeeth),
          lastUpdated: new Date().toISOString(),
        };
      } else {
        return {
          ...prevState,
          childTeeth: updateTeeth(prevState.childTeeth),
          lastUpdated: new Date().toISOString(),
        };
      }
    });
  };

  // Function to update surface status
  const updateSurfaceStatus = (toothId: number, surface: string, status: string) => {
    if (readOnly) return;
    
    const updateTeeth = (teeth: ToothData[]) => {
      return teeth.map(tooth => {
        if (tooth.id === toothId) {
          return {
            ...tooth,
            surfaces: {
              ...tooth.surfaces,
              [surface]: status,
            },
          };
        }
        return tooth;
      });
    };
    
    setChartData(prevState => {
      if (selectedTab === 'adult') {
        return {
          ...prevState,
          adultTeeth: updateTeeth(prevState.adultTeeth),
          lastUpdated: new Date().toISOString(),
        };
      } else {
        return {
          ...prevState,
          childTeeth: updateTeeth(prevState.childTeeth),
          lastUpdated: new Date().toISOString(),
        };
      }
    });
  };

  // Function to add a new treatment
  const addTreatment = () => {
    if (!selectedTooth || !newTreatment.type) return;
    
    const newTreatmentData = {
      id: `treatment-${Date.now()}`,
      type: newTreatment.type,
      surfaces: newTreatment.surfaces,
      date: new Date().toISOString(),
      provider: 'Current Provider', // In a real app, get the current provider
      notes: newTreatment.notes,
    };
    
    const updateTeeth = (teeth: ToothData[]) => {
      return teeth.map(tooth => {
        if (tooth.id === selectedTooth.id) {
          return {
            ...tooth,
            treatments: [...tooth.treatments, newTreatmentData],
          };
        }
        return tooth;
      });
    };
    
    setChartData(prevState => {
      if (selectedTab === 'adult') {
        return {
          ...prevState,
          adultTeeth: updateTeeth(prevState.adultTeeth),
          lastUpdated: new Date().toISOString(),
        };
      } else {
        return {
          ...prevState,
          childTeeth: updateTeeth(prevState.childTeeth),
          lastUpdated: new Date().toISOString(),
        };
      }
    });
    
    setIsAddingTreatment(false);
    setNewTreatment({
      type: '',
      surfaces: [],
      notes: '',
    });
  };

  // Function to save the dental chart
  const saveDentalChart = () => {
    if (onSave) {
      onSave(chartData);
    }
    // In a real app, make an API call to save the chart data
    // For now, we'll just show a console log
    console.log('Saving dental chart:', chartData);
  };

  // Render tooth surfaces
  const renderToothSurfaces = (tooth: ToothData) => {
    return (
      <div className="tooth-surfaces relative">
        <div
          className="surface surface-mesial absolute cursor-pointer"
          style={{
            top: '0',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '50%',
            height: '20%',
            backgroundColor: statusColors[tooth.surfaces.mesial as keyof typeof statusColors] || '#ffffff',
            border: '1px solid #ccc',
          }}
          onClick={() => handleSurfaceSelect(tooth.id, 'mesial')}
        />
        <div
          className="surface surface-occlusal absolute cursor-pointer"
          style={{
            top: '20%',
            left: '25%',
            width: '50%',
            height: '60%',
            backgroundColor: statusColors[tooth.surfaces.occlusal as keyof typeof statusColors] || '#ffffff',
            border: '1px solid #ccc',
          }}
          onClick={() => handleSurfaceSelect(tooth.id, 'occlusal')}
        />
        <div
          className="surface surface-distal absolute cursor-pointer"
          style={{
            bottom: '0',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '50%',
            height: '20%',
            backgroundColor: statusColors[tooth.surfaces.distal as keyof typeof statusColors] || '#ffffff',
            border: '1px solid #ccc',
          }}
          onClick={() => handleSurfaceSelect(tooth.id, 'distal')}
        />
        <div
          className="surface surface-buccal absolute cursor-pointer"
          style={{
            top: '20%',
            left: '0',
            width: '25%',
            height: '60%',
            backgroundColor: statusColors[tooth.surfaces.buccal as keyof typeof statusColors] || '#ffffff',
            border: '1px solid #ccc',
          }}
          onClick={() => handleSurfaceSelect(tooth.id, 'buccal')}
        />
        <div
          className="surface surface-lingual absolute cursor-pointer"
          style={{
            top: '20%',
            right: '0',
            width: '25%',
            height: '60%',
            backgroundColor: statusColors[tooth.surfaces.lingual as keyof typeof statusColors] || '#ffffff',
            border: '1px solid #ccc',
          }}
          onClick={() => handleSurfaceSelect(tooth.id, 'lingual')}
        />
      </div>
    );
  };

  // Render a row of teeth
  const renderTeethRow = (teeth: number[]) => {
    const teethData = selectedTab === 'adult'
      ? chartData.adultTeeth.filter(tooth => teeth.includes(tooth.id))
      : chartData.childTeeth.filter(tooth => teeth.includes(tooth.id));
    
    return (
      <div className="flex justify-between w-full my-4">
        {teethData.map(tooth => (
          <div
            key={tooth.id}
            className={`tooth flex flex-col items-center mx-1 ${tooth.status === TOOTH_STATUSES.MISSING ? 'opacity-50' : ''}`}
            onClick={() => handleToothSelect(tooth)}
          >
            <div className="tooth-number mb-1 text-xs font-semibold">{tooth.id}</div>
            <div
              className="tooth-body relative w-12 h-14 cursor-pointer rounded-sm flex items-center justify-center overflow-hidden"
              style={{
                backgroundColor: statusColors[tooth.status as keyof typeof statusColors] || '#ffffff',
                border: '1px solid #ccc',
              }}
            >
              {tooth.status === TOOTH_STATUSES.MISSING ? (
                <div className="absolute inset-0 border-2 border-red-500 flex items-center justify-center">
                  <span className="text-red-500 font-bold text-xl">X</span>
                </div>
              ) : (
                renderToothSurfaces(tooth)
              )}
              
              {/* Show badges for treatments */}
              {tooth.treatments.length > 0 && (
                <Badge 
                  variant="secondary" 
                  className="absolute -bottom-1 -right-1 text-[9px] p-[2px] h-4 min-w-4 flex items-center justify-center"
                >
                  {tooth.treatments.length}
                </Badge>
              )}
            </div>
            
            {/* Show mobility indicator if applicable */}
            {tooth.mobility && tooth.mobility > 0 && (
              <div className="mt-1">
                <Badge variant="outline" className="text-[9px] p-[2px]">
                  M{tooth.mobility}
                </Badge>
              </div>
            )}
          </div>
        ))}
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
              Interactive tooth chart for recording dental conditions and treatments
            </CardDescription>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-500">
              Last updated: {new Date(chartData.lastUpdated).toLocaleString()}
            </div>
            
            {!readOnly && (
              <Button onClick={saveDentalChart}>
                <Save className="h-4 w-4 mr-1" /> Save Chart
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="adult" onValueChange={setSelectedTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="adult">Adult Dentition</TabsTrigger>
            <TabsTrigger value="child">Primary Dentition</TabsTrigger>
          </TabsList>
          
          <TabsContent value="adult">
            <div className="dental-chart p-4 bg-gray-50 rounded-md border border-gray-200">
              {/* Upper teeth */}
              <div className="upper-teeth">
                {renderTeethRow(ADULT_TEETH_UPPER)}
              </div>
              
              <div className="teeth-separator my-6 border-t border-dashed border-gray-300 relative">
                <div className="absolute left-0 right-0 text-center -top-3">
                  <span className="bg-gray-50 px-2 text-xs text-gray-500">Upper / Lower</span>
                </div>
              </div>
              
              {/* Lower teeth */}
              <div className="lower-teeth">
                {renderTeethRow(ADULT_TEETH_LOWER)}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="child">
            <div className="dental-chart p-4 bg-gray-50 rounded-md border border-gray-200">
              {/* Upper primary teeth */}
              <div className="upper-teeth">
                {renderTeethRow(CHILD_TEETH_UPPER)}
              </div>
              
              <div className="teeth-separator my-6 border-t border-dashed border-gray-300 relative">
                <div className="absolute left-0 right-0 text-center -top-3">
                  <span className="bg-gray-50 px-2 text-xs text-gray-500">Upper / Lower</span>
                </div>
              </div>
              
              {/* Lower primary teeth */}
              <div className="lower-teeth">
                {renderTeethRow(CHILD_TEETH_LOWER)}
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Legend */}
        <div className="legend mt-4 border-t pt-4">
          <h4 className="text-sm font-medium mb-2">Legend</h4>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {Object.entries(TOOTH_STATUSES).map(([key, value]) => (
              <div key={key} className="flex items-center">
                <div
                  className="w-4 h-4 mr-1"
                  style={{ backgroundColor: statusColors[value as keyof typeof statusColors] || '#ffffff', border: '1px solid #ccc' }}
                />
                <span className="text-xs">{key.replace('_', ' ').toLowerCase()}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="text-xs text-gray-500">
          <p>Click on a tooth or surface to view details and add treatments.</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <History className="h-4 w-4 mr-1" /> View History
          </Button>
          <Button variant="outline" size="sm">
            <ClipboardEdit className="h-4 w-4 mr-1" /> Print Chart
          </Button>
        </div>
      </CardFooter>
      
      {/* Tooth detail dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          {selectedTooth && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Tooth #{selectedTooth.id} {selectedSurface ? `- ${selectedSurface.charAt(0).toUpperCase() + selectedSurface.slice(1)} Surface` : ''}
                </DialogTitle>
                <DialogDescription>
                  Current status: {selectedSurface 
                    ? selectedTooth.surfaces[selectedSurface as keyof typeof selectedTooth.surfaces] 
                    : selectedTooth.status}
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                {!isAddingTreatment ? (
                  <div className="space-y-4">
                    {/* Tooth status selection */}
                    {!selectedSurface && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Tooth Status</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {Object.entries(TOOTH_STATUSES).map(([key, value]) => (
                            <Button
                              key={key}
                              variant={selectedTooth.status === value ? "default" : "outline"}
                              size="sm"
                              className="h-auto py-1 justify-start"
                              onClick={() => updateToothStatus(selectedTooth.id, value)}
                              disabled={readOnly}
                            >
                              <div
                                className="w-3 h-3 mr-2"
                                style={{ 
                                  backgroundColor: statusColors[value as keyof typeof statusColors] || '#ffffff', 
                                  border: '1px solid #ccc' 
                                }}
                              />
                              <span className="text-xs whitespace-nowrap overflow-hidden text-ellipsis">
                                {key.replace('_', ' ').toLowerCase()}
                              </span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Surface status selection */}
                    {selectedSurface && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Surface Status</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(SURFACE_STATUSES).map(([key, value]) => (
                            <Button
                              key={key}
                              variant={selectedTooth.surfaces[selectedSurface as keyof typeof selectedTooth.surfaces] === value ? "default" : "outline"}
                              size="sm"
                              className="h-auto py-1 justify-start"
                              onClick={() => updateSurfaceStatus(selectedTooth.id, selectedSurface, value)}
                              disabled={readOnly}
                            >
                              <div
                                className="w-3 h-3 mr-2"
                                style={{ 
                                  backgroundColor: statusColors[value as keyof typeof statusColors] || '#ffffff', 
                                  border: '1px solid #ccc' 
                                }}
                              />
                              <span className="text-xs">{key.replace('_', ' ').toLowerCase()}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Treatments */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium">Treatments</h4>
                        {!readOnly && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setIsAddingTreatment(true)}
                            className="h-6 px-2 text-xs"
                          >
                            <PlusCircle className="h-3 w-3 mr-1" /> Add
                          </Button>
                        )}
                      </div>
                      
                      {selectedTooth.treatments.length > 0 ? (
                        <ScrollArea className="h-40">
                          <div className="space-y-2">
                            {selectedTooth.treatments.map(treatment => (
                              <div
                                key={treatment.id}
                                className="p-2 rounded-md border border-gray-200 bg-gray-50"
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="font-medium text-sm">
                                      {TREATMENT_TYPES.find(t => t.id === treatment.type)?.name || treatment.type}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {new Date(treatment.date).toLocaleDateString()} • {treatment.provider}
                                    </div>
                                  </div>
                                  <div>
                                    {treatment.surfaces.length > 0 && (
                                      <div className="flex">
                                        {treatment.surfaces.map(surface => (
                                          <Badge key={surface} variant="outline" className="mr-1 text-[9px]">
                                            {surface.charAt(0).toUpperCase()}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {treatment.notes && (
                                  <div className="mt-1 text-xs">
                                    {treatment.notes}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      ) : (
                        <div className="text-center p-4 text-gray-500 text-sm">
                          No treatments recorded
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // Add treatment form
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Treatment Type</h4>
                      <Select
                        onValueChange={(value) => setNewTreatment({...newTreatment, type: value})}
                        defaultValue={newTreatment.type}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select treatment type" />
                        </SelectTrigger>
                        <SelectContent>
                          {TREATMENT_TYPES.map(type => (
                            <SelectItem key={type.id} value={type.id}>
                              <div className="flex items-center">
                                <div
                                  className="w-3 h-3 mr-2 rounded-full"
                                  style={{ backgroundColor: type.color }}
                                />
                                <span>{type.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Surfaces (Optional)</h4>
                      <div className="flex flex-wrap gap-2">
                        {SURFACES.map(surface => (
                          <Button
                            key={surface}
                            variant={newTreatment.surfaces.includes(surface) ? "default" : "outline"}
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => {
                              const surfaces = newTreatment.surfaces.includes(surface)
                                ? newTreatment.surfaces.filter(s => s !== surface)
                                : [...newTreatment.surfaces, surface];
                              setNewTreatment({...newTreatment, surfaces});
                            }}
                          >
                            {surface.charAt(0).toUpperCase()}{surface.slice(1)}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Notes (Optional)</h4>
                      <textarea
                        className="w-full h-20 p-2 border border-gray-300 rounded-md text-sm"
                        placeholder="Add treatment notes..."
                        value={newTreatment.notes}
                        onChange={(e) => setNewTreatment({...newTreatment, notes: e.target.value})}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                {isAddingTreatment ? (
                  <>
                    <Button variant="outline" onClick={() => setIsAddingTreatment(false)}>
                      Cancel
                    </Button>
                    <Button onClick={addTreatment} disabled={!newTreatment.type}>
                      Add Treatment
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Close
                    </Button>
                    <Button disabled={readOnly} onClick={saveDentalChart}>
                      Save Changes
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}