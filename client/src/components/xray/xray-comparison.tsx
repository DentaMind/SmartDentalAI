import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { differenceInMonths, format, parseISO } from 'date-fns';

// Define types for the component props
interface XRayComparisonProps {
  beforeXray: {
    id: string;
    imageUrl: string;
    date: string;
    type: string;
    provider?: string;
    description?: string;
    aiAnalyzed?: boolean;
    aiFindings?: string[];
  };
  afterXray: {
    id: string;
    imageUrl: string;
    date: string;
    type: string;
    provider?: string;
    description?: string;
    aiAnalyzed?: boolean;
    aiFindings?: string[];
  };
  patientName: string;
  onClose: () => void;
}

// Define a comparative finding type
interface ComparativeFinding {
  text: string;
  type: 'improvement' | 'deterioration' | 'unchanged' | 'new';
}

export function XRayComparison({ beforeXray, afterXray, patientName, onClose }: XRayComparisonProps) {
  const [mode, setMode] = useState<'side-by-side' | 'overlay' | 'slider'>('side-by-side');
  const [opacity, setOpacity] = useState(0.5);
  const [sliderPosition, setSliderPosition] = useState(50);
  const beforeRef = useRef<HTMLImageElement>(null);
  const afterRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sliderContainerRef = useRef<HTMLDivElement>(null);
  
  // Calculate time difference between X-rays
  const timeDifference = calculateTimeDifference(beforeXray.date, afterXray.date);
  
  // Generate comparative findings
  const comparativeFindings = generateComparativeFindings(beforeXray, afterXray);
  
  // Handle slider mode
  useEffect(() => {
    if (mode === 'slider' && sliderContainerRef.current) {
      const handleSliderMove = (e: MouseEvent) => {
        const container = sliderContainerRef.current;
        if (!container) return;
        
        const rect = container.getBoundingClientRect();
        const position = ((e.clientX - rect.left) / rect.width) * 100;
        setSliderPosition(Math.max(0, Math.min(100, position)));
      };
      
      const handleMouseDown = () => {
        document.addEventListener('mousemove', handleSliderMove);
        document.addEventListener('mouseup', handleMouseUp);
      };
      
      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleSliderMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      sliderContainerRef.current.addEventListener('mousedown', handleMouseDown);
      
      return () => {
        if (sliderContainerRef.current) {
          sliderContainerRef.current.removeEventListener('mousedown', handleMouseDown);
        }
        document.removeEventListener('mousemove', handleSliderMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [mode]);
  
  return (
    <div className="bg-background flex flex-col h-full w-full overflow-hidden">
      <div className="bg-card p-4 border-b flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{patientName} - X-ray Comparison</h2>
          <p className="text-muted-foreground">
            Comparing {beforeXray.type} from {formatDate(beforeXray.date)} with {afterXray.type} from {formatDate(afterXray.date)}
            {timeDifference && (
              <span className="ml-2">
                ({timeDifference.value} {timeDifference.unit}{timeDifference.value !== 1 ? 's' : ''} apart)
              </span>
            )}
          </p>
        </div>
        <Button variant="ghost" onClick={onClose} size="sm">
          Close
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 h-full overflow-auto">
        <div className="md:col-span-2 h-full flex flex-col">
          <div className="mb-4 flex space-x-2">
            <TabsList>
              <TabsTrigger 
                value="side-by-side" 
                onClick={() => setMode('side-by-side')}
                className={mode === 'side-by-side' ? 'bg-primary text-primary-foreground' : ''}
              >
                Side by Side
              </TabsTrigger>
              <TabsTrigger 
                value="overlay" 
                onClick={() => setMode('overlay')}
                className={mode === 'overlay' ? 'bg-primary text-primary-foreground' : ''}
              >
                Overlay
              </TabsTrigger>
              <TabsTrigger 
                value="slider" 
                onClick={() => setMode('slider')}
                className={mode === 'slider' ? 'bg-primary text-primary-foreground' : ''}
              >
                Slider
              </TabsTrigger>
            </TabsList>
            
            {mode === 'overlay' && (
              <div className="flex items-center space-x-2 min-w-[180px]">
                <span className="text-xs">Opacity:</span>
                <Slider 
                  value={[opacity * 100]} 
                  onValueChange={(value) => setOpacity(value[0] / 100)}
                  min={0} 
                  max={100} 
                  step={1}
                  className="w-full"
                />
              </div>
            )}
          </div>
          
          <div 
            ref={containerRef}
            className="relative flex-1 rounded-md overflow-hidden border shadow-lg bg-black"
          >
            {mode === 'side-by-side' && (
              <div className="flex h-full">
                <div className="w-1/2 h-full relative">
                  <div className="absolute top-2 left-2 bg-card/80 rounded-md px-2 py-1 text-xs">
                    {formatDate(beforeXray.date)}
                  </div>
                  <img 
                    ref={beforeRef}
                    src={beforeXray.imageUrl} 
                    alt={`${beforeXray.type} from ${beforeXray.date}`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="w-1/2 h-full relative">
                  <div className="absolute top-2 left-2 bg-card/80 rounded-md px-2 py-1 text-xs">
                    {formatDate(afterXray.date)}
                  </div>
                  <img 
                    ref={afterRef}
                    src={afterXray.imageUrl} 
                    alt={`${afterXray.type} from ${afterXray.date}`}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}
            
            {mode === 'overlay' && (
              <div className="relative w-full h-full">
                <img 
                  ref={beforeRef}
                  src={beforeXray.imageUrl} 
                  alt={`${beforeXray.type} from ${beforeXray.date}`}
                  className="absolute top-0 left-0 w-full h-full object-contain z-10"
                />
                <img 
                  ref={afterRef}
                  src={afterXray.imageUrl} 
                  alt={`${afterXray.type} from ${afterXray.date}`}
                  className="absolute top-0 left-0 w-full h-full object-contain z-20"
                  style={{ opacity: opacity }}
                />
                <div className="absolute top-2 left-2 bg-card/80 rounded-md px-2 py-1 text-xs z-30 flex space-x-2">
                  <span className="bg-primary/20 px-1 rounded">{formatDate(beforeXray.date)} (base)</span>
                  <span className="bg-secondary/20 px-1 rounded">{formatDate(afterXray.date)} (overlay)</span>
                </div>
              </div>
            )}
            
            {mode === 'slider' && (
              <div 
                ref={sliderContainerRef}
                className="relative w-full h-full cursor-col-resize"
              >
                <div className="absolute top-0 left-0 h-full w-full overflow-hidden">
                  <img 
                    ref={beforeRef}
                    src={beforeXray.imageUrl} 
                    alt={`${beforeXray.type} from ${beforeXray.date}`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div 
                  className="absolute top-0 left-0 h-full overflow-hidden"
                  style={{ width: `${sliderPosition}%` }}
                >
                  <img 
                    ref={afterRef}
                    src={afterXray.imageUrl} 
                    alt={`${afterXray.type} from ${afterXray.date}`}
                    className="w-full h-full object-contain"
                    style={{ 
                      width: `${100 * (100 / sliderPosition)}%`,
                      maxWidth: 'none'
                    }}
                  />
                </div>
                
                {/* Slider handle */}
                <div 
                  className="absolute top-0 bottom-0 w-1 bg-white cursor-col-resize z-30"
                  style={{ left: `calc(${sliderPosition}% - 0.5px)` }}
                >
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white shadow-lg flex items-center justify-center">
                    <div className="w-1 h-10 bg-gray-400 rounded-full"></div>
                  </div>
                </div>
                
                {/* Labels */}
                <div className="absolute top-2 left-2 bg-card/80 rounded-md px-2 py-1 text-xs z-40">
                  {formatDate(beforeXray.date)}
                </div>
                <div className="absolute top-2 right-2 bg-card/80 rounded-md px-2 py-1 text-xs z-40">
                  {formatDate(afterXray.date)}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-col h-full overflow-y-auto">
          <Card className="flex-1">
            <CardHeader className="pb-2">
              <CardTitle>Analysis</CardTitle>
              <CardDescription>
                Comparing X-rays taken {timeDifference?.value} {timeDifference?.unit}{timeDifference?.value !== 1 ? 's' : ''} apart
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 text-sm">Key Findings</h4>
                <ul className="space-y-2">
                  {comparativeFindings.map((finding, index) => (
                    <li key={index} className="flex items-start">
                      <Badge 
                        className={`mt-0.5 mr-2 ${
                          finding.type === 'improvement' ? 'bg-green-500' :
                          finding.type === 'deterioration' ? 'bg-red-500' :
                          finding.type === 'new' ? 'bg-blue-500' : 'bg-gray-500'
                        }`}
                      >
                        {finding.type}
                      </Badge>
                      <span className="text-sm">{finding.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-2 text-sm">Original X-ray ({formatDate(beforeXray.date)})</h4>
                <ul className="space-y-1 ml-5 list-disc text-sm text-muted-foreground">
                  {beforeXray.aiFindings?.map((finding, index) => (
                    <li key={index}>{finding}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2 text-sm">Current X-ray ({formatDate(afterXray.date)})</h4>
                <ul className="space-y-1 ml-5 list-disc text-sm text-muted-foreground">
                  {afterXray.aiFindings?.map((finding, index) => (
                    <li key={index}>{finding}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
              <Button size="sm">
                Export Report
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper function to format date
function formatDate(dateString: string) {
  try {
    return format(parseISO(dateString), 'MMM d, yyyy');
  } catch {
    return dateString;
  }
}

// Calculate time difference between two dates
function calculateTimeDifference(date1: string, date2: string): { value: number; unit: string } | null {
  try {
    const d1 = parseISO(date1);
    const d2 = parseISO(date2);
    
    const monthsDiff = Math.abs(differenceInMonths(d2, d1));
    
    if (monthsDiff < 1) {
      return { value: 0, unit: 'month' };
    } else if (monthsDiff < 12) {
      return { value: monthsDiff, unit: 'month' };
    } else {
      const years = Math.floor(monthsDiff / 12);
      return { value: years, unit: 'year' };
    }
  } catch {
    return null;
  }
}

// Generate comparative findings between two X-rays
function generateComparativeFindings(
  beforeXray: XRayComparisonProps['beforeXray'], 
  afterXray: XRayComparisonProps['afterXray']
): ComparativeFinding[] {
  const findings: ComparativeFinding[] = [];
  
  // Function to detect improvements between findings
  const findImprovements = () => {
    const beforeConditions = new Set(beforeXray.aiFindings || []);
    const afterConditions = new Set(afterXray.aiFindings || []);
    
    // Simple heuristic to detect improvements
    if (beforeConditions.size > 0 && afterConditions.size > 0) {
      // Look for improvements in bone loss
      const beforeBoneLoss = Array.from(beforeConditions).find(c => c.toLowerCase().includes('bone loss'));
      const afterBoneLoss = Array.from(afterConditions).find(c => c.toLowerCase().includes('bone loss'));
      
      if (beforeBoneLoss && afterBoneLoss) {
        const beforeSeverity = getSeverity(beforeBoneLoss);
        const afterSeverity = getSeverity(afterBoneLoss);
        
        if (beforeSeverity > afterSeverity) {
          findings.push({
            text: 'Reduction in bone loss severity',
            type: 'improvement'
          });
        } else if (beforeSeverity < afterSeverity) {
          findings.push({
            text: 'Increased bone loss severity',
            type: 'deterioration'
          });
        }
      }
      
      // Check for caries that have been restored
      const beforeCaries = Array.from(beforeConditions).filter(c => 
        c.toLowerCase().includes('caries') || c.toLowerCase().includes('decay')
      );
      
      const afterRestorations = Array.from(afterConditions).filter(c => 
        c.toLowerCase().includes('restoration') || c.toLowerCase().includes('filled')
      );
      
      if (beforeCaries.length > 0 && afterRestorations.length > 0) {
        findings.push({
          text: 'Previous caries appear to have been restored',
          type: 'improvement'
        });
      }
      
      // Check for new conditions
      Array.from(afterConditions).forEach(condition => {
        const isNew = !Array.from(beforeConditions).some(bc => 
          bc.toLowerCase().includes(condition.toLowerCase().split(' ').slice(-1)[0])
        );
        
        if (isNew && !condition.toLowerCase().includes('normal')) {
          findings.push({
            text: `New finding: ${condition}`,
            type: 'new'
          });
        }
      });
    }
  };
  
  findImprovements();
  
  // If no findings were generated, add default findings
  if (findings.length === 0) {
    findings.push({
      text: 'No significant changes detected between these X-rays',
      type: 'unchanged'
    });
  }
  
  return findings;
}

// Helper function to get severity level from text
function getSeverity(text: string): number {
  if (text.toLowerCase().includes('severe')) return 3;
  if (text.toLowerCase().includes('moderate')) return 2;
  if (text.toLowerCase().includes('mild')) return 1;
  return 0;
}