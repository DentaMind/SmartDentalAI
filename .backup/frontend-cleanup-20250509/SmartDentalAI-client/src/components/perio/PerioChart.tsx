import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PeriodontalInput, ToothPerioData } from './PeriodontalInput';
import { Separator } from '@/components/ui/separator';
import { Save, FileDown, RefreshCw, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PerioChartProps {
  patientId: number;
  onUpdateNotes?: (note: string) => void;
  initialData?: any;
  readOnly?: boolean;
}

type QuadrantType = 'UR' | 'UL' | 'LL' | 'LR';

const quadrantMap: Record<QuadrantType, number[]> = {
  UR: [1, 2, 3, 4, 5, 6, 7, 8],        // Upper Right (teeth 1-8)
  UL: [9, 10, 11, 12, 13, 14, 15, 16], // Upper Left (teeth 9-16)
  LL: [17, 18, 19, 20, 21, 22, 23, 24], // Lower Left (teeth 17-24)
  LR: [25, 26, 27, 28, 29, 30, 31, 32]  // Lower Right (teeth 25-32)
};

// Generate initial perio data for all 32 teeth
const generateInitialPerioData = (): Record<number, ToothPerioData> => {
  const initialData: Record<number, ToothPerioData> = {};
  
  for (let i = 1; i <= 32; i++) {
    initialData[i] = {
      pocketDepths: {
        facial: [0, 0, 0],
        lingual: [0, 0, 0],
      },
      bleeding: {
        facial: [false, false, false],
        lingual: [false, false, false],
      },
      mobility: 0,
      furcation: [0, 0, 0, 0],
      recession: {
        facial: [0, 0, 0],
        lingual: [0, 0, 0],
      },
    };
  }
  
  return initialData;
};

export default function PerioChart({ 
  patientId, 
  onUpdateNotes,
  initialData,
  readOnly = false
}: PerioChartProps) {
  const [periosData, setPeriosData] = useState<Record<number, ToothPerioData>>(
    initialData || generateInitialPerioData()
  );
  const [activeQuadrant, setActiveQuadrant] = useState<QuadrantType>('UR');
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const { toast } = useToast();
  
  // Calculate bleeding on probing percentage
  const calculateBOP = (): number => {
    let totalSites = 0;
    let bleedingSites = 0;
    
    // Count all sites (6 per tooth) and bleeding sites
    Object.values(periosData).forEach(toothData => {
      // For each tooth, count 6 sites (3 facial, 3 lingual)
      totalSites += 6;
      
      // Count bleeding sites
      toothData.bleeding.facial.forEach(site => {
        if (site) bleedingSites++;
      });
      
      toothData.bleeding.lingual.forEach(site => {
        if (site) bleedingSites++;
      });
    });
    
    // Calculate percentage
    return totalSites > 0 ? Math.round((bleedingSites / totalSites) * 100) : 0;
  };
  
  // Calculate average pocket depth
  const calculateAveragePocketDepth = (): number => {
    let totalSites = 0;
    let depthSum = 0;
    
    // Sum up all pocket depths
    Object.values(periosData).forEach(toothData => {
      // Add facial pocket depths
      toothData.pocketDepths.facial.forEach(depth => {
        if (depth > 0) {
          depthSum += depth;
          totalSites++;
        }
      });
      
      // Add lingual pocket depths
      toothData.pocketDepths.lingual.forEach(depth => {
        if (depth > 0) {
          depthSum += depth;
          totalSites++;
        }
      });
    });
    
    // Calculate average
    return totalSites > 0 ? parseFloat((depthSum / totalSites).toFixed(1)) : 0;
  };
  
  // Handle tooth data update
  const handleToothDataUpdate = (toothNumber: number, data: ToothPerioData) => {
    setPeriosData(prev => {
      const newData = { ...prev, [toothNumber]: data };
      setLastUpdated(toothNumber);
      return newData;
    });
  };
  
  // Generate notes for significant findings
  useEffect(() => {
    if (!onUpdateNotes || lastUpdated === null) return;
    
    const toothNumber = lastUpdated;
    const toothData = periosData[toothNumber];
    const changes: string[] = [];
    
    // Check for significant pocket depths (> 3mm)
    toothData.pocketDepths.facial.forEach((depth, index) => {
      const position = index === 0 ? 'mesial' : index === 1 ? 'mid' : 'distal';
      if (depth > 3) {
        changes.push(`Tooth #${toothNumber}: ${depth}mm facial ${position} pocket depth`);
      }
    });
    
    toothData.pocketDepths.lingual.forEach((depth, index) => {
      const position = index === 0 ? 'mesial' : index === 1 ? 'mid' : 'distal';
      if (depth > 3) {
        changes.push(`Tooth #${toothNumber}: ${depth}mm lingual ${position} pocket depth`);
      }
    });
    
    // Check for bleeding points
    const facialBleeding = toothData.bleeding.facial.filter(Boolean).length;
    const lingualBleeding = toothData.bleeding.lingual.filter(Boolean).length;
    
    if (facialBleeding > 0 || lingualBleeding > 0) {
      changes.push(`Tooth #${toothNumber}: ${facialBleeding + lingualBleeding} bleeding sites (${facialBleeding} facial, ${lingualBleeding} lingual)`);
    }
    
    // Check for mobility
    if (toothData.mobility > 0) {
      changes.push(`Tooth #${toothNumber}: Class ${toothData.mobility} mobility`);
    }
    
    // Check for furcation involvement
    const hasFurcation = toothData.furcation.some(grade => grade > 0);
    if (hasFurcation) {
      changes.push(`Tooth #${toothNumber}: Furcation involvement detected`);
    }
    
    // Generate note text if there are changes
    if (changes.length > 0) {
      const noteText = `Perio Exam Update:\n${changes.join('\n')}`;
      onUpdateNotes(noteText);
    }
  }, [periosData, lastUpdated, onUpdateNotes]);
  
  // Save perio chart data to database
  const savePerioData = async () => {
    try {
      const response = await fetch(`/api/patients/${patientId}/perio-chart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ periosData }),
      });
      
      if (response.ok) {
        toast({
          title: "Chart saved",
          description: "Periodontal chart data has been saved successfully",
        });
      } else {
        toast({
          title: "Error saving chart",
          description: "There was a problem saving the chart data. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving perio data:', error);
      toast({
        title: "Error saving chart",
        description: "There was a problem saving the chart data. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Export chart data as CSV
  const exportCSV = () => {
    // Generate CSV header
    let csv = "Tooth Number,";
    csv += "Facial Mesial PD,Facial Mid PD,Facial Distal PD,";
    csv += "Lingual Mesial PD,Lingual Mid PD,Lingual Distal PD,";
    csv += "Facial Mesial BOP,Facial Mid BOP,Facial Distal BOP,";
    csv += "Lingual Mesial BOP,Lingual Mid BOP,Lingual Distal BOP,";
    csv += "Mobility,";
    csv += "Furcation MF,Furcation DF,Furcation ML,Furcation DL\n";
    
    // Add data rows
    for (let i = 1; i <= 32; i++) {
      const tooth = periosData[i];
      if (!tooth) continue;
      
      let row = `${i},`;
      // Pocket depths
      row += `${tooth.pocketDepths.facial[0]},${tooth.pocketDepths.facial[1]},${tooth.pocketDepths.facial[2]},`;
      row += `${tooth.pocketDepths.lingual[0]},${tooth.pocketDepths.lingual[1]},${tooth.pocketDepths.lingual[2]},`;
      
      // Bleeding
      row += `${tooth.bleeding.facial[0] ? 1 : 0},${tooth.bleeding.facial[1] ? 1 : 0},${tooth.bleeding.facial[2] ? 1 : 0},`;
      row += `${tooth.bleeding.lingual[0] ? 1 : 0},${tooth.bleeding.lingual[1] ? 1 : 0},${tooth.bleeding.lingual[2] ? 1 : 0},`;
      
      // Mobility
      row += `${tooth.mobility},`;
      
      // Furcation
      row += `${tooth.furcation[0]},${tooth.furcation[1]},${tooth.furcation[2]},${tooth.furcation[3]}\n`;
      
      csv += row;
    }
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `perio_chart_patient_${patientId}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };
  
  // Reset chart to initial state
  const resetChart = () => {
    if (confirm('Are you sure you want to reset the chart? All data will be lost.')) {
      setPeriosData(generateInitialPerioData());
      setLastUpdated(null);
    }
  };
  
  // Render teeth for the active quadrant
  const renderTeeth = () => {
    const teeth = quadrantMap[activeQuadrant];
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {teeth.map(toothNumber => (
          <PeriodontalInput
            key={toothNumber}
            toothNumber={toothNumber}
            initialData={periosData[toothNumber]}
            onUpdate={handleToothDataUpdate}
            readOnly={readOnly}
          />
        ))}
      </div>
    );
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Periodontal Chart</CardTitle>
          {!readOnly && (
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={resetChart}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <FileDown className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="default" size="sm" onClick={savePerioData}>
                <Save className="h-4 w-4 mr-2" />
                Save Chart
              </Button>
            </div>
          )}
        </div>
        
        <CardDescription>
          Enter 6-point probing depths, bleeding, mobility, and furcation data
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="ml-2 text-sm">
              <div className="font-medium">Summary Statistics:</div>
              <div className="flex space-x-4 mt-1">
                <div>BOP: {calculateBOP()}%</div>
                <div>Average PD: {calculateAveragePocketDepth()}mm</div>
              </div>
            </AlertDescription>
          </Alert>
        </div>
        
        <Tabs 
          defaultValue="UR" 
          value={activeQuadrant}
          onValueChange={(value) => setActiveQuadrant(value as QuadrantType)}
        >
          <TabsList className="mb-6">
            <TabsTrigger value="UR">Upper Right</TabsTrigger>
            <TabsTrigger value="UL">Upper Left</TabsTrigger>
            <TabsTrigger value="LL">Lower Left</TabsTrigger>
            <TabsTrigger value="LR">Lower Right</TabsTrigger>
          </TabsList>
          
          <TabsContent value="UR">
            {renderTeeth()}
          </TabsContent>
          
          <TabsContent value="UL">
            {renderTeeth()}
          </TabsContent>
          
          <TabsContent value="LL">
            {renderTeeth()}
          </TabsContent>
          
          <TabsContent value="LR">
            {renderTeeth()}
          </TabsContent>
        </Tabs>
        
        <Separator className="my-4" />
        
        <div className="text-xs text-muted-foreground mt-4">
          <p>Enter 3-digit values (e.g., 323) for pocket depths. Check the boxes for bleeding points.</p>
          <p>Mobility grades range from 0-3, and furcation grades from 0-3.</p>
          <p>All significant findings will be automatically added to patient notes.</p>
        </div>
      </CardContent>
    </Card>
  );
}