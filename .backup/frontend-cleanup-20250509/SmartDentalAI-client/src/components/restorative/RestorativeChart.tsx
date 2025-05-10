import React, { useState, useEffect } from 'react';
import { ToothChart } from '../ui/ToothChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RestorativeChartProps {
  patientId: number;
  onUpdateNotes?: (note: string) => void;
  initialData?: any;
  readOnly?: boolean;
}

type ToothData = {
  toothNumber: number;
  restoration: string;
};

const initialChartState = Array.from({ length: 32 }, (_, index) => ({
  toothNumber: index + 1,
  restoration: '',
}));

export default function RestorativeChart({ 
  patientId, 
  onUpdateNotes,
  initialData,
  readOnly = false
}: RestorativeChartProps) {
  const [chartData, setChartData] = useState<ToothData[]>(initialData || initialChartState);
  const [previousChartData, setPreviousChartData] = useState<ToothData[]>(initialData || initialChartState);
  const { toast } = useToast();

  // Handle changes to tooth restoration values
  const handleChange = (toothNumber: number, value: string) => {
    // Store the previous state for note generation
    setPreviousChartData([...chartData]);
    
    // Update the chart data
    setChartData(prev => prev.map(tooth => 
      tooth.toothNumber === toothNumber ? { ...tooth, restoration: value } : tooth
    ));
  };

  // Generate notes based on changes in tooth restorations
  useEffect(() => {
    if (!onUpdateNotes || chartData === previousChartData) return;
    
    const changes: string[] = [];
    
    // Compare current and previous data to find changes
    chartData.forEach(current => {
      const previous = previousChartData.find(p => p.toothNumber === current.toothNumber);
      
      // US tooth number notation (1-32)
      const toothNumberUS = current.toothNumber;
      
      if (previous && previous.restoration !== current.restoration) {
        if (current.restoration && !previous.restoration) {
          changes.push(`Added ${current.restoration} on tooth #${toothNumberUS}`);
        } else if (!current.restoration && previous.restoration) {
          changes.push(`Removed ${previous.restoration} from tooth #${toothNumberUS}`);
        } else {
          changes.push(`Changed tooth #${toothNumberUS} from ${previous.restoration} to ${current.restoration}`);
        }
      }
    });
    
    if (changes.length > 0) {
      const noteText = changes.join('\n');
      onUpdateNotes(noteText);
    }
  }, [chartData, previousChartData, onUpdateNotes]);

  // Save chart data to database
  const saveChartData = async () => {
    try {
      // Filter out teeth with no restorations to save space
      const dataToSave = chartData.filter(tooth => tooth.restoration);
      
      const response = await fetch(`/api/patients/${patientId}/restorative-chart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chartData: dataToSave }),
      });
      
      if (response.ok) {
        toast({
          title: "Chart saved",
          description: "Restorative chart data has been saved successfully",
        });
      } else {
        toast({
          title: "Error saving chart",
          description: "There was a problem saving the chart data. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving chart data:', error);
      toast({
        title: "Error saving chart",
        description: "There was a problem saving the chart data. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Reset chart to initial state
  const resetChart = () => {
    if (confirm('Are you sure you want to reset the chart? All data will be lost.')) {
      setChartData(initialChartState);
      setPreviousChartData(initialChartState);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Restorative Chart</CardTitle>
          {!readOnly && (
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={resetChart}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button variant="default" size="sm" onClick={saveChartData}>
                <Save className="h-4 w-4 mr-2" />
                Save Chart
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <ToothChart
          chartData={chartData}
          onChange={handleChange}
          editable={!readOnly}
        />
        
        <div className="mt-4 text-xs text-muted-foreground">
          <p>Click on a tooth to select it, then choose a restoration type from the dropdown menu below it.</p>
          <p>All changes will be automatically added to patient notes.</p>
        </div>
      </CardContent>
    </Card>
  );
}