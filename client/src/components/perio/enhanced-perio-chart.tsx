import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  Printer, 
  FileText, 
  Settings 
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Define types for our periodontal chart data
interface ToothData {
  id: number;
  pocketDepths: {
    facial: number[];
    lingual: number[];
  };
  recessionValues: {
    facial: number[];
    lingual: number[];
  };
  mobilityGrade: number;
  bleeding: {
    facial: boolean[];
    lingual: boolean[];
  };
  plaque: {
    facial: boolean[];
    lingual: boolean[];
  };
  calculus: {
    facial: boolean[];
    lingual: boolean[];
  };
  suppuration: {
    facial: boolean[];
    lingual: boolean[];
  };
  furcation: {
    facial: number[];
    lingual: number[];
  };
  implant: boolean;
  restoration: {
    type: "none" | "amalgam" | "composite" | "crown" | "bridge" | "rootCanal" | "veneer" | "implant";
    surfaces: string[];
  };
}

interface PerioChartData {
  patientId: number;
  chartDate: Date;
  teeth: Record<number, ToothData>;
  notes: string;
  examinerId: number;
  bop: number; // Bleeding on probing percentage
  plaque: number; // Plaque percentage
}

// Component to render a single tooth in the chart
const ToothCell: React.FC<{
  toothNumber: number;
  data: ToothData;
  selectedMode: string;
  onUpdate: (toothNumber: number, updatedData: Partial<ToothData>) => void;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ toothNumber, data, selectedMode, onUpdate, isSelected, onSelect }) => {
  // Map tooth numbers to positions in the chart
  const isUpperTooth = toothNumber <= 16;
  const isAnterior = (toothNumber >= 6 && toothNumber <= 11) || (toothNumber >= 22 && toothNumber <= 27);

  // Determine tooth color based on restorations
  const getToothColor = () => {
    if (data.restoration.type === "none") return "#fff";
    if (data.restoration.type === "amalgam") return "#949494";
    if (data.restoration.type === "composite") return "#e0e0e0";
    if (data.restoration.type === "crown") return "#ffd700";
    if (data.restoration.type === "rootCanal") return "#ffcccc";
    if (data.restoration.type === "implant") return "#c0c0c0";
    return "#fff";
  };

  // Function to update the pocket depth value
  const updatePocketDepth = (side: 'facial' | 'lingual', index: number, value: number) => {
    const updatedPocketDepths = { ...data.pocketDepths };
    updatedPocketDepths[side][index] = value;
    onUpdate(toothNumber, { pocketDepths: updatedPocketDepths });
  };

  // Function to toggle bleeding at a specific site
  const toggleBleeding = (side: 'facial' | 'lingual', index: number) => {
    const updatedBleeding = { ...data.bleeding };
    updatedBleeding[side][index] = !updatedBleeding[side][index];
    onUpdate(toothNumber, { bleeding: updatedBleeding });
  };

  // Function to update mobility grade
  const updateMobility = (grade: number) => {
    onUpdate(toothNumber, { mobilityGrade: grade });
  };

  // Render different UI based on selected mode
  const renderDataBasedOnMode = () => {
    switch (selectedMode) {
      case 'pocketDepth':
        return (
          <div className="text-center">
            {/* Facial pocket depths */}
            <div className="flex justify-center space-x-1 mb-1">
              {data.pocketDepths.facial.map((depth, i) => (
                <div 
                  key={`facial-${i}`}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                    ${depth <= 3 ? 'bg-green-100' : 
                      depth <= 5 ? 'bg-yellow-100' : 'bg-red-100'}`}
                  onClick={() => updatePocketDepth('facial', i, (depth % 10) + 1)}
                >
                  {depth || '–'}
                </div>
              ))}
            </div>
            
            {/* Tooth representation */}
            <div 
              className={`w-12 h-16 mx-auto rounded-lg border ${isSelected ? 'border-primary-500 border-2' : 'border-gray-300'}`}
              style={{ backgroundColor: getToothColor() }}
              onClick={onSelect}
            >
              <div className="text-xs font-bold">{toothNumber}</div>
            </div>
            
            {/* Lingual pocket depths */}
            <div className="flex justify-center space-x-1 mt-1">
              {data.pocketDepths.lingual.map((depth, i) => (
                <div 
                  key={`lingual-${i}`}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                    ${depth <= 3 ? 'bg-green-100' : 
                      depth <= 5 ? 'bg-yellow-100' : 'bg-red-100'}`}
                  onClick={() => updatePocketDepth('lingual', i, (depth % 10) + 1)}
                >
                  {depth || '–'}
                </div>
              ))}
            </div>
          </div>
        );
        
      case 'bleeding':
        return (
          <div className="text-center">
            {/* Facial bleeding sites */}
            <div className="flex justify-center space-x-1 mb-1">
              {data.bleeding.facial.map((isBleeding, i) => (
                <div 
                  key={`facial-bleeding-${i}`}
                  className={`w-6 h-6 rounded-full flex items-center justify-center
                    ${isBleeding ? 'bg-red-500 text-white' : 'bg-gray-100'}`}
                  onClick={() => toggleBleeding('facial', i)}
                >
                  {isBleeding ? 'B' : '–'}
                </div>
              ))}
            </div>
            
            {/* Tooth representation */}
            <div 
              className={`w-12 h-16 mx-auto rounded-lg border ${isSelected ? 'border-primary-500 border-2' : 'border-gray-300'}`}
              style={{ backgroundColor: getToothColor() }}
              onClick={onSelect}
            >
              <div className="text-xs font-bold">{toothNumber}</div>
            </div>
            
            {/* Lingual bleeding sites */}
            <div className="flex justify-center space-x-1 mt-1">
              {data.bleeding.lingual.map((isBleeding, i) => (
                <div 
                  key={`lingual-bleeding-${i}`}
                  className={`w-6 h-6 rounded-full flex items-center justify-center
                    ${isBleeding ? 'bg-red-500 text-white' : 'bg-gray-100'}`}
                  onClick={() => toggleBleeding('lingual', i)}
                >
                  {isBleeding ? 'B' : '–'}
                </div>
              ))}
            </div>
          </div>
        );
        
      case 'mobility':
        return (
          <div className="text-center">
            <div className="mb-1">
              <div 
                className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center font-medium
                  ${data.mobilityGrade === 0 ? 'bg-gray-100' : 
                    data.mobilityGrade === 1 ? 'bg-yellow-100' : 
                    data.mobilityGrade === 2 ? 'bg-orange-100' : 'bg-red-100'}`}
                onClick={() => updateMobility((data.mobilityGrade + 1) % 4)}
              >
                {data.mobilityGrade || '–'}
              </div>
            </div>
            
            {/* Tooth representation */}
            <div 
              className={`w-12 h-16 mx-auto rounded-lg border ${isSelected ? 'border-primary-500 border-2' : 'border-gray-300'}`}
              style={{ backgroundColor: getToothColor() }}
              onClick={onSelect}
            >
              <div className="text-xs font-bold">{toothNumber}</div>
            </div>
          </div>
        );
        
      case 'plaque':
        return (
          <div className="text-center">
            {/* Facial plaque sites */}
            <div className="flex justify-center space-x-1 mb-1">
              {data.plaque.facial.map((hasPlaque, i) => (
                <div 
                  key={`facial-plaque-${i}`}
                  className={`w-6 h-6 rounded-full flex items-center justify-center
                    ${hasPlaque ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                  onClick={() => {
                    const updatedPlaque = {...data.plaque};
                    updatedPlaque.facial[i] = !hasPlaque;
                    onUpdate(toothNumber, { plaque: updatedPlaque });
                  }}
                >
                  {hasPlaque ? 'P' : '–'}
                </div>
              ))}
            </div>
            
            {/* Tooth representation */}
            <div 
              className={`w-12 h-16 mx-auto rounded-lg border ${isSelected ? 'border-primary-500 border-2' : 'border-gray-300'}`}
              style={{ backgroundColor: getToothColor() }}
              onClick={onSelect}
            >
              <div className="text-xs font-bold">{toothNumber}</div>
            </div>
            
            {/* Lingual plaque sites */}
            <div className="flex justify-center space-x-1 mt-1">
              {data.plaque.lingual.map((hasPlaque, i) => (
                <div 
                  key={`lingual-plaque-${i}`}
                  className={`w-6 h-6 rounded-full flex items-center justify-center
                    ${hasPlaque ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                  onClick={() => {
                    const updatedPlaque = {...data.plaque};
                    updatedPlaque.lingual[i] = !hasPlaque;
                    onUpdate(toothNumber, { plaque: updatedPlaque });
                  }}
                >
                  {hasPlaque ? 'P' : '–'}
                </div>
              ))}
            </div>
          </div>
        );
        
      case 'calculus':
        return (
          <div className="text-center">
            {/* Facial calculus sites */}
            <div className="flex justify-center space-x-1 mb-1">
              {data.calculus.facial.map((hasCalc, i) => (
                <div 
                  key={`facial-calc-${i}`}
                  className={`w-6 h-6 rounded-full flex items-center justify-center
                    ${hasCalc ? 'bg-amber-500 text-white' : 'bg-gray-100'}`}
                  onClick={() => {
                    const updatedCalc = {...data.calculus};
                    updatedCalc.facial[i] = !hasCalc;
                    onUpdate(toothNumber, { calculus: updatedCalc });
                  }}
                >
                  {hasCalc ? 'C' : '–'}
                </div>
              ))}
            </div>
            
            {/* Tooth representation */}
            <div 
              className={`w-12 h-16 mx-auto rounded-lg border ${isSelected ? 'border-primary-500 border-2' : 'border-gray-300'}`}
              style={{ backgroundColor: getToothColor() }}
              onClick={onSelect}
            >
              <div className="text-xs font-bold">{toothNumber}</div>
            </div>
            
            {/* Lingual calculus sites */}
            <div className="flex justify-center space-x-1 mt-1">
              {data.calculus.lingual.map((hasCalc, i) => (
                <div 
                  key={`lingual-calc-${i}`}
                  className={`w-6 h-6 rounded-full flex items-center justify-center
                    ${hasCalc ? 'bg-amber-500 text-white' : 'bg-gray-100'}`}
                  onClick={() => {
                    const updatedCalc = {...data.calculus};
                    updatedCalc.lingual[i] = !hasCalc;
                    onUpdate(toothNumber, { calculus: updatedCalc });
                  }}
                >
                  {hasCalc ? 'C' : '–'}
                </div>
              ))}
            </div>
          </div>
        );
        
      case 'restorations':
        return (
          <div className="text-center">
            {/* Tooth representation with restoration color */}
            <div 
              className={`w-16 h-20 mx-auto rounded-lg border flex items-center justify-center ${isSelected ? 'border-primary-500 border-2' : 'border-gray-300'}`}
              style={{ backgroundColor: getToothColor() }}
              onClick={onSelect}
            >
              <div className="flex flex-col items-center">
                <div className="text-xs font-bold">{toothNumber}</div>
                <div className="text-xs">
                  {data.restoration.type !== "none" && data.restoration.type}
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return (
          <div 
            className={`w-12 h-16 mx-auto rounded-lg border ${isSelected ? 'border-primary-500 border-2' : 'border-gray-300'}`}
            style={{ backgroundColor: getToothColor() }}
            onClick={onSelect}
          >
            <div className="text-xs font-bold">{toothNumber}</div>
          </div>
        );
    }
  };

  return (
    <div className="p-1">
      {renderDataBasedOnMode()}
    </div>
  );
};

// Function to create a default empty tooth data structure
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

// Main periodontal chart component
const EnhancedPerioChart: React.FC<{
  patientId: number;
  examinerId: number;
  existingChartData?: PerioChartData;
  onSave?: (chartData: PerioChartData) => void;
}> = ({ 
  patientId, 
  examinerId,
  existingChartData,
  onSave
}) => {
  // State for chart data
  const [chartData, setChartData] = useState<PerioChartData>(
    existingChartData || initializeEmptyChart(patientId, examinerId)
  );
  
  // State for UI controls
  const [selectedMode, setSelectedMode] = useState<string>('pocketDepth');
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [view, setView] = useState<'threeAtATime' | 'fullChart'>('fullChart');
  const [currentSection, setCurrentSection] = useState<number>(1);
  
  // Calculate sections for the "three at a time" view
  const sections = {
    1: [1, 2, 3, 4, 5, 6, 7, 8],
    2: [9, 10, 11, 12, 13, 14, 15, 16],
    3: [17, 18, 19, 20, 21, 22, 23, 24],
    4: [25, 26, 27, 28, 29, 30, 31, 32]
  };
  
  // Function to handle updating tooth data
  const handleToothUpdate = (toothNumber: number, updatedData: Partial<ToothData>) => {
    setChartData(prev => {
      const updatedTeeth = { ...prev.teeth };
      updatedTeeth[toothNumber] = { ...updatedTeeth[toothNumber], ...updatedData };
      
      return {
        ...prev,
        teeth: updatedTeeth
      };
    });
  };
  
  // Function to save the chart data
  const handleSaveChart = () => {
    if (onSave) {
      onSave(chartData);
    }
    
    // If no onSave function is provided, we'll just show a toast notification
    toast({
      title: "Chart Saved",
      description: "The periodontal chart has been saved successfully.",
    });
  };
  
  // Function to navigate between sections
  const navigateSection = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentSection < 4) {
      setCurrentSection(currentSection + 1);
    } else if (direction === 'prev' && currentSection > 1) {
      setCurrentSection(currentSection - 1);
    }
  };
  
  // Function to update restoration type for selected tooth
  const updateRestorationForSelectedTooth = (restorationType: ToothData['restoration']['type']) => {
    if (selectedTooth) {
      handleToothUpdate(selectedTooth, {
        restoration: {
          ...chartData.teeth[selectedTooth].restoration,
          type: restorationType
        }
      });
    }
  };
  
  // Calculate health indicators
  const calculateStats = () => {
    let bleedingSites = 0;
    let plaqueSites = 0;
    let totalSites = 0;
    
    Object.values(chartData.teeth).forEach(tooth => {
      // Count bleeding sites
      tooth.bleeding.facial.forEach(site => {
        if (site) bleedingSites++;
        totalSites++;
      });
      tooth.bleeding.lingual.forEach(site => {
        if (site) bleedingSites++;
        totalSites++;
      });
      
      // Count plaque sites
      tooth.plaque.facial.forEach(site => {
        if (site) plaqueSites++;
      });
      tooth.plaque.lingual.forEach(site => {
        if (site) plaqueSites++;
      });
    });
    
    setChartData(prev => ({
      ...prev,
      bop: totalSites > 0 ? Math.round((bleedingSites / totalSites) * 100) : 0,
      plaque: totalSites > 0 ? Math.round((plaqueSites / totalSites) * 100) : 0
    }));
  };
  
  // Calculate stats whenever chart data changes
  useEffect(() => {
    calculateStats();
  }, [chartData.teeth]);
  
  // Render the teeth grid for "full chart" view
  const renderFullChart = () => (
    <div className="mx-auto max-w-7xl">
      {/* Upper jaw (teeth 1-16) */}
      <div className="flex flex-wrap justify-center mb-4 border-b pb-4">
        {Array.from({ length: 16 }, (_, i) => i + 1).map(toothNumber => (
          <div key={`tooth-${toothNumber}`} className="w-1/8 p-1">
            <ToothCell
              toothNumber={toothNumber}
              data={chartData.teeth[toothNumber]}
              selectedMode={selectedMode}
              onUpdate={handleToothUpdate}
              isSelected={selectedTooth === toothNumber}
              onSelect={() => setSelectedTooth(toothNumber)}
            />
          </div>
        ))}
      </div>
      
      {/* Lower jaw (teeth 17-32) */}
      <div className="flex flex-wrap justify-center">
        {Array.from({ length: 16 }, (_, i) => i + 17).map(toothNumber => (
          <div key={`tooth-${toothNumber}`} className="w-1/8 p-1">
            <ToothCell
              toothNumber={toothNumber}
              data={chartData.teeth[toothNumber]}
              selectedMode={selectedMode}
              onUpdate={handleToothUpdate}
              isSelected={selectedTooth === toothNumber}
              onSelect={() => setSelectedTooth(toothNumber)}
            />
          </div>
        ))}
      </div>
    </div>
  );
  
  // Render the teeth grid for "three at a time" view
  const renderSectionView = () => {
    const teethInSection = sections[currentSection as keyof typeof sections];
    
    return (
      <div className="mx-auto max-w-3xl">
        <div className="flex justify-between items-center mb-4">
          <Button 
            onClick={() => navigateSection('prev')} 
            disabled={currentSection === 1}
            variant="outline"
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          
          <div className="text-lg font-medium">
            Section {currentSection} of 4
          </div>
          
          <Button 
            onClick={() => navigateSection('next')} 
            disabled={currentSection === 4}
            variant="outline"
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        
        <div className="flex flex-wrap justify-center">
          {teethInSection.map(toothNumber => (
            <div key={`tooth-section-${toothNumber}`} className="w-1/4 p-2">
              <ToothCell
                toothNumber={toothNumber}
                data={chartData.teeth[toothNumber]}
                selectedMode={selectedMode}
                onUpdate={handleToothUpdate}
                isSelected={selectedTooth === toothNumber}
                onSelect={() => setSelectedTooth(toothNumber)}
              />
            </div>
          ))}
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
              Record periodontal measurements and conditions
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => setView(view === 'fullChart' ? 'threeAtATime' : 'fullChart')}>
              {view === 'fullChart' ? 'Three-at-a-time View' : 'Full Chart View'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleSaveChart}>
              <Save className="h-4 w-4 mr-1" /> Save
            </Button>
            <Button variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-1" /> Print
            </Button>
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-1" /> Notes
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-1" /> Settings
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="mb-6">
          <Tabs value={selectedMode} onValueChange={setSelectedMode}>
            <TabsList className="mb-4">
              <TabsTrigger value="pocketDepth">Pocket Depth</TabsTrigger>
              <TabsTrigger value="bleeding">Bleeding</TabsTrigger>
              <TabsTrigger value="plaque">Plaque</TabsTrigger>
              <TabsTrigger value="calculus">Calculus</TabsTrigger>
              <TabsTrigger value="mobility">Mobility</TabsTrigger>
              <TabsTrigger value="restorations">Restorations</TabsTrigger>
            </TabsList>
            
            <TabsContent value="pocketDepth">
              <div className="flex justify-between items-center mb-4 bg-gray-50 p-3 rounded-lg">
                <div>
                  <span className="font-medium">Record probing depths</span>
                  <div className="text-sm text-gray-500">Click on each site to record measurements</div>
                </div>
                <div className="flex space-x-4">
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-green-100 mr-1"></div>
                    <span className="text-xs">1-3mm</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-yellow-100 mr-1"></div>
                    <span className="text-xs">4-5mm</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-red-100 mr-1"></div>
                    <span className="text-xs">6mm+</span>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="bleeding">
              <div className="flex justify-between items-center mb-4 bg-gray-50 p-3 rounded-lg">
                <div>
                  <span className="font-medium">Record bleeding points</span>
                  <div className="text-sm text-gray-500">Click on each site to toggle bleeding</div>
                </div>
                <div>
                  <span className="font-medium">Bleeding on Probing: {chartData.bop}%</span>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="plaque">
              <div className="flex justify-between items-center mb-4 bg-gray-50 p-3 rounded-lg">
                <div>
                  <span className="font-medium">Record plaque</span>
                  <div className="text-sm text-gray-500">Click on each site to toggle plaque presence</div>
                </div>
                <div>
                  <span className="font-medium">Plaque Index: {chartData.plaque}%</span>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="calculus">
              <div className="flex justify-between items-center mb-4 bg-gray-50 p-3 rounded-lg">
                <div>
                  <span className="font-medium">Record calculus</span>
                  <div className="text-sm text-gray-500">Click on each site to toggle calculus presence</div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="mobility">
              <div className="flex justify-between items-center mb-4 bg-gray-50 p-3 rounded-lg">
                <div>
                  <span className="font-medium">Record tooth mobility</span>
                  <div className="text-sm text-gray-500">Click on tooth to toggle mobility grade (0-3)</div>
                </div>
                <div className="flex space-x-4">
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-gray-100 mr-1"></div>
                    <span className="text-xs">0: None</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-yellow-100 mr-1"></div>
                    <span className="text-xs">1: Slight</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-orange-100 mr-1"></div>
                    <span className="text-xs">2: Moderate</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-red-100 mr-1"></div>
                    <span className="text-xs">3: Severe</span>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="restorations">
              <div className="flex justify-between items-center mb-4 bg-gray-50 p-3 rounded-lg">
                <div>
                  <span className="font-medium">Record dental restorations</span>
                  <div className="text-sm text-gray-500">Select a tooth, then choose restoration type</div>
                </div>
                {selectedTooth && (
                  <div className="flex space-x-2">
                    <Select onValueChange={(val) => updateRestorationForSelectedTooth(val as any)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Restoration Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="amalgam">Amalgam</SelectItem>
                        <SelectItem value="composite">Composite</SelectItem>
                        <SelectItem value="crown">Crown</SelectItem>
                        <SelectItem value="bridge">Bridge</SelectItem>
                        <SelectItem value="rootCanal">Root Canal</SelectItem>
                        <SelectItem value="implant">Implant</SelectItem>
                        <SelectItem value="veneer">Veneer</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center font-medium px-2">
                      Tooth #{selectedTooth}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {view === 'fullChart' ? renderFullChart() : renderSectionView()}
        
        {/* Voice input and notes section */}
        <div className="mt-6 border-t pt-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Clinical Notes</label>
              <textarea 
                className="w-full h-24 px-3 py-2 border rounded-md" 
                placeholder="Enter clinical notes here..."
                value={chartData.notes}
                onChange={(e) => setChartData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Voice Input</label>
              <Button className="h-24 w-full">
                Record Voice Notes
              </Button>
            </div>
          </div>
        </div>
        
        {/* Overall health indicators */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-gray-500">Bleeding on Probing</div>
                  <div className="text-2xl font-bold">{chartData.bop}%</div>
                </div>
                <div 
                  className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-white
                    ${chartData.bop < 10 ? 'bg-green-500' : 
                      chartData.bop < 30 ? 'bg-yellow-500' : 'bg-red-500'}`}
                >
                  {chartData.bop}%
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-gray-500">Plaque Index</div>
                  <div className="text-2xl font-bold">{chartData.plaque}%</div>
                </div>
                <div 
                  className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-white
                    ${chartData.plaque < 20 ? 'bg-green-500' : 
                      chartData.plaque < 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                >
                  {chartData.plaque}%
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Save button at bottom */}
        <div className="mt-6 flex justify-end">
          <Button onClick={handleSaveChart}>
            <Save className="h-4 w-4 mr-2" />
            Save Periodontal Chart
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedPerioChart;