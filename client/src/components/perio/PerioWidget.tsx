import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { CalendarClock, ChevronRight, FileDown, FileUp } from 'lucide-react';

interface PerioMeasurement {
  MB: number;
  B: number;
  DB: number;
  ML: number;
  L: number;
  DL: number;
}

interface ToothMeasurements {
  tooth_number: string;
  pocket_depths: PerioMeasurement;
  recession?: PerioMeasurement;
  mobility?: number;
  furcation?: Record<string, number>;
  bleeding?: Record<string, boolean>;
}

interface PerioChartProps {
  examDate: string;
  teeth: ToothMeasurements[];
  notes?: string;
  onViewFullChart?: () => void;
}

export const PerioWidget: React.FC<PerioChartProps> = ({
  examDate,
  teeth,
  notes,
  onViewFullChart,
}) => {
  const [expanded, setExpanded] = useState(false);

  // Format exam date
  const formatExamDate = (date: string): string => {
    const examDate = new Date(date);
    return examDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Find teeth with deep pockets (≥5mm)
  const teethWithDeepPockets = teeth.filter(tooth => {
    const depths = Object.values(tooth.pocket_depths);
    return depths.some(depth => depth >= 5);
  });

  // Calculate average pocket depth
  const calculateAveragePocketDepth = (): number => {
    let totalMeasurements = 0;
    let sumDepths = 0;
    
    teeth.forEach(tooth => {
      const depths = Object.values(tooth.pocket_depths);
      totalMeasurements += depths.length;
      sumDepths += depths.reduce((sum, depth) => sum + depth, 0);
    });
    
    return sumDepths / totalMeasurements;
  };

  // Count teeth with bleeding sites
  const countTeethWithBleeding = (): number => {
    return teeth.filter(tooth => 
      tooth.bleeding && Object.values(tooth.bleeding).some(site => site)
    ).length;
  };

  const averagePocketDepth = calculateAveragePocketDepth();
  const teethWithBleeding = countTeethWithBleeding();

  // Function to get severity level based on pocket depth
  const getSeverityLevel = (depth: number): string => {
    if (depth < 3) return 'healthy';
    if (depth < 5) return 'moderate';
    return 'severe';
  };

  const overallSeverity = getSeverityLevel(averagePocketDepth);
  
  // Color mapping for severity levels
  const severityColors = {
    healthy: 'text-green-600',
    moderate: 'text-amber-600',
    severe: 'text-red-600'
  };

  return (
    <Card className="w-full shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-bold">Periodontal Status</CardTitle>
            <CardDescription className="flex items-center gap-1">
              <CalendarClock size={14} />
              <span>Exam: {formatExamDate(examDate)}</span>
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setExpanded(!expanded)}>
            {expanded ? <FileUp size={16} /> : <FileDown size={16} />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-2 bg-slate-50 rounded">
            <div className="text-sm text-muted-foreground">Avg. Pocket Depth</div>
            <div className={`text-xl font-semibold ${severityColors[overallSeverity as keyof typeof severityColors]}`}>
              {averagePocketDepth.toFixed(1)} mm
            </div>
          </div>
          <div className="text-center p-2 bg-slate-50 rounded">
            <div className="text-sm text-muted-foreground">Deep Pockets</div>
            <div className="text-xl font-semibold text-amber-600">
              {teethWithDeepPockets.length}
            </div>
          </div>
          <div className="text-center p-2 bg-slate-50 rounded">
            <div className="text-sm text-muted-foreground">Bleeding Sites</div>
            <div className="text-xl font-semibold text-red-600">
              {teethWithBleeding}
            </div>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 border-t pt-4">
            <h4 className="text-sm font-semibold mb-2">Teeth with Deep Pockets (≥5mm)</h4>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {teethWithDeepPockets.length === 0 ? (
                <div className="text-sm text-muted-foreground col-span-full">No deep pockets found</div>
              ) : (
                teethWithDeepPockets.map(tooth => (
                  <div key={tooth.tooth_number} className="p-2 border rounded text-sm">
                    <div className="font-semibold">Tooth #{tooth.tooth_number}</div>
                    <div className="grid grid-cols-3 gap-1 text-xs mt-1">
                      <div></div>
                      <div className={`text-center ${tooth.pocket_depths.B >= 5 ? 'font-bold text-red-600' : ''}`}>
                        {tooth.pocket_depths.B}
                      </div>
                      <div></div>
                      <div className={`text-center ${tooth.pocket_depths.ML >= 5 ? 'font-bold text-red-600' : ''}`}>
                        {tooth.pocket_depths.ML}
                      </div>
                      <div className="text-center bg-slate-100 rounded-full p-1">
                        {tooth.tooth_number}
                      </div>
                      <div className={`text-center ${tooth.pocket_depths.DL >= 5 ? 'font-bold text-red-600' : ''}`}>
                        {tooth.pocket_depths.DL}
                      </div>
                      <div></div>
                      <div className={`text-center ${tooth.pocket_depths.L >= 5 ? 'font-bold text-red-600' : ''}`}>
                        {tooth.pocket_depths.L}
                      </div>
                      <div></div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {notes && (
              <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
                <span className="font-semibold">Notes:</span> {notes}
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={onViewFullChart}
        >
          View Full Perio Chart
          <ChevronRight size={16} className="ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
}; 