import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Brain, 
  Calendar, 
  Camera, 
  Check, 
  Clipboard, 
  Clock, 
  Grid, 
  ImagePlus, 
  Info, 
  RefreshCw, 
  RotateCw, 
  Shuffle, 
  Upload 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Define the X-ray slot interface
export interface XRaySlot {
  id: string;
  position: string; // Example: "MAX-RM" for maxillary right molar
  region?: 'posterior' | 'anterior' | 'bitewing';
  arch?: 'maxillary' | 'mandibular' | 'both';
  side?: 'left' | 'right' | 'center';
  teeth: number[]; // Array of tooth numbers covered in this X-ray
  imageUrl?: string;
  date?: string;
  takenBy?: string;
  aiAnalyzed?: boolean;
  aiFindings?: string[];
  type?: 'bitewing' | 'periapical' | 'panoramic' | 'cbct' | 'endodontic' | 'fmx'; // Type of X-ray
  notes?: string; // Additional notes for the X-ray
}

// Position map for FMX (Full Mouth X-ray) slots
const FMX_POSITIONS = [
  { id: 'MAX-RM', label: 'Maxillary Right Molar', arch: 'maxillary', side: 'right', region: 'posterior', teeth: [1, 2, 3] },
  { id: 'MAX-RP', label: 'Maxillary Right Premolar', arch: 'maxillary', side: 'right', region: 'posterior', teeth: [4, 5] },
  { id: 'MAX-RC', label: 'Maxillary Right Canine', arch: 'maxillary', side: 'right', region: 'anterior', teeth: [6, 7, 8] },
  { id: 'MAX-LC', label: 'Maxillary Left Canine', arch: 'maxillary', side: 'left', region: 'anterior', teeth: [9, 10, 11] },
  { id: 'MAX-LP', label: 'Maxillary Left Premolar', arch: 'maxillary', side: 'left', region: 'posterior', teeth: [12, 13] },
  { id: 'MAX-LM', label: 'Maxillary Left Molar', arch: 'maxillary', side: 'left', region: 'posterior', teeth: [14, 15, 16] },
  { id: 'MAND-RM', label: 'Mandibular Right Molar', arch: 'mandibular', side: 'right', region: 'posterior', teeth: [17, 18, 19] },
  { id: 'MAND-RP', label: 'Mandibular Right Premolar', arch: 'mandibular', side: 'right', region: 'posterior', teeth: [20, 21] },
  { id: 'MAND-RC', label: 'Mandibular Right Canine', arch: 'mandibular', side: 'right', region: 'anterior', teeth: [22, 23, 24] },
  { id: 'MAND-LC', label: 'Mandibular Left Canine', arch: 'mandibular', side: 'left', region: 'anterior', teeth: [25, 26, 27] },
  { id: 'MAND-LP', label: 'Mandibular Left Premolar', arch: 'mandibular', side: 'left', region: 'posterior', teeth: [28, 29] },
  { id: 'MAND-LM', label: 'Mandibular Left Molar', arch: 'mandibular', side: 'left', region: 'posterior', teeth: [30, 31, 32] },
  { id: 'BW-R', label: 'Bitewing Right', arch: 'both', side: 'right', region: 'bitewing', teeth: [2, 3, 4, 5, 18, 19, 20, 21] },
  { id: 'BW-L', label: 'Bitewing Left', arch: 'both', side: 'left', region: 'bitewing', teeth: [12, 13, 14, 15, 28, 29, 30, 31] },
];

interface FMXLayoutProps {
  patientId: string | number;
  patientName?: string;
  xrays: XRaySlot[];
  onXRaySelected?: (xray: XRaySlot) => void;
  onAIAnalysis?: (xrayId: string) => void;
  lastUpdated?: string;
}

const FMXLayout: React.FC<FMXLayoutProps> = ({
  patientId,
  patientName = 'Patient',
  xrays,
  onXRaySelected,
  onAIAnalysis,
  lastUpdated
}) => {
  const { toast } = useToast();
  const [layoutType, setLayoutType] = useState<'fmx' | 'bw' | 'pax'>('fmx');
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedXRays, setSelectedXRays] = useState<string[]>([]);
  const [uploadingSlotId, setUploadingSlotId] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);

  // Get x-ray for a specific position
  const getXRayForPosition = (positionId: string): XRaySlot | undefined => {
    // Find the most recent X-ray for this position
    return xrays
      .filter(x => x.position === positionId)
      .sort((a, b) => {
        if (!a.date || !b.date) return 0;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      })[0];
  };

  // Select X-ray for comparison
  const toggleXRaySelection = (xrayId: string) => {
    if (selectedXRays.includes(xrayId)) {
      setSelectedXRays(selectedXRays.filter(id => id !== xrayId));
    } else {
      // Allow selection of max 2 X-rays
      if (selectedXRays.length < 2) {
        setSelectedXRays([...selectedXRays, xrayId]);
      } else {
        // Replace the oldest selected X-ray
        setSelectedXRays([selectedXRays[1], xrayId]);
        toast({
          description: "You can compare up to 2 X-rays at a time.",
        });
      }
    }
  };

  // Handle X-ray slot click
  const handleSlotClick = (positionId: string) => {
    const xray = getXRayForPosition(positionId);
    
    if (compareMode) {
      if (xray) {
        toggleXRaySelection(xray.id);
      }
      return;
    }
    
    setSelectedSlotId(positionId);
    
    if (xray && onXRaySelected) {
      onXRaySelected(xray);
    }
  };

  // Handle AI analysis request
  const handleAIAnalysis = (event: React.MouseEvent, xrayId: string) => {
    event.stopPropagation();
    if (onAIAnalysis) {
      onAIAnalysis(xrayId);
    }
  };

  // Handle upload button click
  const handleUploadClick = (event: React.MouseEvent, positionId: string) => {
    event.stopPropagation();
    setUploadingSlotId(positionId);
    // In a real implementation, this would trigger a file upload dialog
    // For now, just simulate upload complete
    setTimeout(() => {
      setUploadingSlotId(null);
      toast({
        title: "X-ray uploaded",
        description: `New X-ray for ${positionId} has been uploaded successfully.`,
      });
    }, 2000);
  };

  // Render FMX grid layout
  const renderFMXGrid = () => {
    return (
      <div className="grid grid-cols-6 gap-3">
        {/* Maxillary Row */}
        <div className="col-span-6 text-center text-sm font-semibold bg-muted/50 py-1 rounded">
          Maxillary Arch
        </div>
        <div className="col-span-3 grid grid-cols-3 gap-2">
          {['MAX-RM', 'MAX-RP', 'MAX-RC'].map(posId => renderXRaySlot(posId))}
        </div>
        <div className="col-span-3 grid grid-cols-3 gap-2">
          {['MAX-LC', 'MAX-LP', 'MAX-LM'].map(posId => renderXRaySlot(posId))}
        </div>
        
        {/* Bitewing Row */}
        <div className="col-span-6 text-center text-sm font-semibold bg-muted/50 py-1 rounded">
          Bitewing Views
        </div>
        <div className="col-span-3 flex justify-center">
          {renderXRaySlot('BW-R', true)}
        </div>
        <div className="col-span-3 flex justify-center">
          {renderXRaySlot('BW-L', true)}
        </div>
        
        {/* Mandibular Row */}
        <div className="col-span-6 text-center text-sm font-semibold bg-muted/50 py-1 rounded">
          Mandibular Arch
        </div>
        <div className="col-span-3 grid grid-cols-3 gap-2">
          {['MAND-RM', 'MAND-RP', 'MAND-RC'].map(posId => renderXRaySlot(posId))}
        </div>
        <div className="col-span-3 grid grid-cols-3 gap-2">
          {['MAND-LC', 'MAND-LP', 'MAND-LM'].map(posId => renderXRaySlot(posId))}
        </div>
      </div>
    );
  };
  
  // Render a single X-ray slot
  const renderXRaySlot = (positionId: string, isBitewing = false) => {
    const position = FMX_POSITIONS.find(p => p.id === positionId);
    const xray = getXRayForPosition(positionId);
    const isSelected = selectedSlotId === positionId;
    const isUploading = uploadingSlotId === positionId;
    const isSelectedForComparison = xray ? selectedXRays.includes(xray.id) : false;
    
    // Determine slot width for bitewing slots (they're wider)
    const slotWidth = isBitewing ? 'w-64' : 'w-full';
    
    return (
      <div 
        className={cn(
          "border rounded-md overflow-hidden relative cursor-pointer transition-all",
          isSelected && "ring-2 ring-primary",
          isSelectedForComparison && "ring-2 ring-yellow-500",
          isBitewing && "col-span-3"
        )}
        onClick={() => handleSlotClick(positionId)}
      >
        <div className="h-8 bg-muted/50 flex items-center justify-between px-2 text-xs">
          <div className="font-medium truncate mr-1">
            {position?.label || positionId}
          </div>
          {xray?.date && (
            <div className="text-muted-foreground whitespace-nowrap">
              {new Date(xray.date).toLocaleDateString()}
            </div>
          )}
        </div>
        
        <div className={`relative ${slotWidth} h-36 bg-black flex items-center justify-center`}>
          {xray?.imageUrl ? (
            <div className="relative w-full h-full">
              <img 
                src={xray.imageUrl} 
                alt={`${position?.label} X-ray`}
                className="w-full h-full object-contain"
              />
              
              {/* Indicator badges */}
              <div className="absolute top-1 right-1 flex flex-col gap-1">
                {xray.aiAnalyzed && (
                  <Badge className="bg-primary/90 text-white p-1 h-5 w-5 flex items-center justify-center">
                    <Brain className="h-3 w-3" />
                  </Badge>
                )}
                
                {compareMode && (
                  <Badge 
                    className={`${
                      isSelectedForComparison 
                        ? 'bg-yellow-500/90' 
                        : 'bg-muted/80'
                      } text-white p-1 h-5 w-5 flex items-center justify-center`}
                  >
                    {isSelectedForComparison ? selectedXRays.indexOf(xray.id) + 1 : <Check className="h-3 w-3" />}
                  </Badge>
                )}
              </div>
              
              {/* Action buttons */}
              {!compareMode && (
                <div className="absolute bottom-1 right-1 flex gap-1">
                  {!xray.aiAnalyzed && (
                    <Button 
                      size="icon" 
                      variant="secondary" 
                      className="h-6 w-6 bg-black/70 hover:bg-black/90 backdrop-blur-sm"
                      onClick={(e) => handleAIAnalysis(e, xray.id)}
                    >
                      <Brain className="h-3 w-3 text-primary" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              {isUploading ? (
                <RefreshCw className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <ImagePlus className="h-6 w-6 mb-1" />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs h-6 px-2 hover:bg-black/20"
                    onClick={(e) => handleUploadClick(e, positionId)}
                  >
                    Upload
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">{patientName}'s X-ray Series</h2>
          <p className="text-sm text-muted-foreground">
            {xrays.length > 0 ? 
              `Last updated: ${lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Unknown'}` : 
              'No X-rays available'
            }
          </p>
        </div>
        
        <div className="flex gap-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="compare-mode"
              checked={compareMode}
              onCheckedChange={setCompareMode}
            />
            <label 
              htmlFor="compare-mode" 
              className="text-sm font-medium cursor-pointer"
            >
              Compare Mode
            </label>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon">
                  <Upload className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Upload X-rays
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      {/* Layout selection tabs */}
      <Tabs value={layoutType} onValueChange={(v) => setLayoutType(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="fmx" className="gap-2">
            <Grid className="h-4 w-4" />
            Full Mouth Series
          </TabsTrigger>
          <TabsTrigger value="bw" className="gap-2">
            <Clipboard className="h-4 w-4" />
            Bitewings Only
          </TabsTrigger>
          <TabsTrigger value="pax" className="gap-2">
            <Camera className="h-4 w-4" />
            Panoramic
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="fmx">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">
                  Full Mouth X-ray (FMX) Layout
                </CardTitle>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Switch
                      id="auto-rotate"
                      checked={autoRotate}
                      onCheckedChange={setAutoRotate}
                      className="h-[18px] w-[32px]" // Use className instead of size
                    />
                    <label 
                      htmlFor="auto-rotate" 
                      className="text-xs text-muted-foreground flex items-center gap-1"
                    >
                      <RotateCw className="h-3 w-3" /> Auto-orient
                    </label>
                  </div>
                  
                  <Button variant="outline" size="sm" className="h-7 gap-1">
                    <Shuffle className="h-3 w-3" />
                    <span className="text-xs">Rearrange</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {renderFMXGrid()}
            </CardContent>
            
            <CardFooter className="text-xs text-muted-foreground flex justify-between pt-3">
              <div className="flex items-center gap-1">
                <Info className="h-3 w-3" />
                <span>Click on an X-ray to view details. Use Compare Mode to select multiple X-rays.</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Standard 14-film series</span>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="bw">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                {['BW-R', 'BW-L'].map(posId => (
                  <div key={posId} className="flex justify-center">
                    {renderXRaySlot(posId, true)}
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Recommended every 6-12 months for caries detection</span>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="pax">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2">
                <Camera className="h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">No panoramic X-ray available</p>
                <Button size="sm" className="mt-2">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Panoramic X-ray
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FMXLayout;