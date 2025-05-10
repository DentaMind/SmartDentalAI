import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Slider } from '@/components/ui/slider';
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
  Upload,
  ZoomIn,
  ZoomOut,
  Layers,
  Move,
  PanelLeftClose,
  PanelRightClose,
  RotateCcw,
  Eye,
  EyeOff,
  Hourglass,
  History,
  ThermometerSnowflake
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
  
  // New enhanced features
  const [showSuperimposition, setShowSuperimposition] = useState(false);
  const [superimpositionOpacity, setSuperimpositionOpacity] = useState(50);
  const [viewMode, setViewMode] = useState<'xray' | 'tissue' | 'combined'>('xray');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showGrid, setShowGrid] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [selectedTimeframeXRays, setSelectedTimeframeXRays] = useState<XRaySlot[]>([]);

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
  
  // Get all X-rays for a specific position (for timeline/history view)
  const getXRayHistoryForPosition = (positionId: string): XRaySlot[] => {
    return xrays
      .filter(x => x.position === positionId)
      .sort((a, b) => {
        if (!a.date || !b.date) return 0;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  };
  
  // Get previous X-ray for superimposition (closest date before current)
  const getPreviousXRay = (xray: XRaySlot): XRaySlot | undefined => {
    if (!xray || !xray.date) return undefined;
    
    const currentDate = new Date(xray.date);
    const allPositionXRays = xrays
      .filter(x => x.position === xray.position && x.id !== xray.id && x.date)
      .sort((a, b) => {
        if (!a.date || !b.date) return 0;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      
    // Find closest date before current
    return allPositionXRays.find(x => new Date(x.date!) < currentDate);
  };
  
  // Toggle superimposition mode
  const toggleSuperimposition = () => {
    setShowSuperimposition(!showSuperimposition);
    
    if (!showSuperimposition && selectedSlotId) {
      const currentXRay = getXRayForPosition(selectedSlotId);
      if (currentXRay) {
        const previousXRay = getPreviousXRay(currentXRay);
        
        if (previousXRay) {
          toast({
            title: "Superimposition enabled",
            description: `Comparing with previous X-ray from ${new Date(previousXRay.date!).toLocaleDateString()}`,
          });
        } else {
          toast({
            description: "No previous X-rays found for comparison",
          });
        }
      }
    }
  };
  
  // Toggle view mode (X-ray, tissue overlay, combined)
  const handleViewModeChange = (mode: 'xray' | 'tissue' | 'combined') => {
    setViewMode(mode);
    
    toast({
      description: mode === 'xray' ? 
        "Standard X-ray view" : 
        mode === 'tissue' ? 
          "Soft tissue overlay" : 
          "Combined view (X-ray + tissue)",
    });
  };
  
  // Create pseudo-calendar view of X-ray history
  const loadTimelineView = (positionId: string) => {
    if (!positionId) return;
    
    const historyXRays = getXRayHistoryForPosition(positionId);
    setSelectedTimeframeXRays(historyXRays);
    setShowTimeline(true);
    
    toast({
      title: "Timeline view",
      description: `Showing ${historyXRays.length} historical X-rays for this position`,
    });
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
    
    // Get previous X-ray for superimposition if applicable
    const previousXRay = xray && showSuperimposition && isSelected ? getPreviousXRay(xray) : undefined;
    
    // Determine slot width for bitewing slots (they're wider)
    const slotWidth = isBitewing ? 'w-64' : 'w-full';
    
    // Style for X-ray based on view mode
    const getXRayStyle = () => {
      if (!isSelected) return {};
      
      // Default X-ray styles
      const baseStyle = {
        filter: viewMode === 'tissue' ? 'invert(1) hue-rotate(180deg)' : 'none',
        transform: `scale(${zoomLevel / 100})`,
        transition: 'all 0.3s ease-in-out',
      };
      
      return baseStyle;
    };
    
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
        
        <div className={`relative ${slotWidth} h-36 bg-black flex items-center justify-center overflow-hidden`}>
          {xray?.imageUrl ? (
            <div className="relative w-full h-full">
              {/* Current X-ray */}
              <img 
                src={xray.imageUrl} 
                alt={`${position?.label} X-ray`}
                className="w-full h-full object-contain"
                style={getXRayStyle()}
              />
              
              {/* Superimposed previous X-ray */}
              {previousXRay && previousXRay.imageUrl && showSuperimposition && isSelected && (
                <img 
                  src={previousXRay.imageUrl} 
                  alt={`Previous ${position?.label} X-ray`}
                  className="absolute top-0 left-0 w-full h-full object-contain"
                  style={{
                    opacity: superimpositionOpacity / 100,
                    mixBlendMode: 'difference',
                    transform: `scale(${zoomLevel / 100})`,
                  }}
                />
              )}
              
              {/* Tissue overlay (pseudo-generated for demo) */}
              {isSelected && (viewMode === 'tissue' || viewMode === 'combined') && (
                <div 
                  className="absolute top-0 left-0 w-full h-full"
                  style={{
                    backgroundImage: 'radial-gradient(rgba(255,0,0,0.1), rgba(255,100,100,0.2))',
                    opacity: viewMode === 'combined' ? 0.5 : 0.8,
                    mixBlendMode: 'screen',
                    transform: `scale(${zoomLevel / 100})`,
                  }}
                />
              )}
              
              {/* Grid overlay for measurements */}
              {isSelected && showGrid && (
                <div 
                  className="absolute top-0 left-0 w-full h-full"
                  style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)',
                    backgroundSize: '10px 10px',
                    opacity: 0.5,
                  }}
                />
              )}
              
              {/* Automatic orientation indicator */}
              {isSelected && autoRotate && (
                <div className="absolute top-1 left-1">
                  <Badge variant="outline" className="bg-black/30 backdrop-blur-sm text-white text-xs">
                    <RotateCw className="h-3 w-3 mr-1" />
                    Auto-oriented
                  </Badge>
                </div>
              )}
              
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
              {isSelected && (
                <div className="absolute bottom-1 left-1 flex gap-1">
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    className="h-6 w-6 bg-black/70 hover:bg-black/90 backdrop-blur-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSuperimposition();
                    }}
                  >
                    <Layers className="h-3 w-3 text-white" />
                  </Button>
                  
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    className="h-6 w-6 bg-black/70 hover:bg-black/90 backdrop-blur-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowGrid(!showGrid);
                    }}
                  >
                    <Grid className="h-3 w-3 text-white" />
                  </Button>
                  
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    className="h-6 w-6 bg-black/70 hover:bg-black/90 backdrop-blur-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      loadTimelineView(positionId);
                    }}
                  >
                    <History className="h-3 w-3 text-white" />
                  </Button>
                </div>
              )}
              
              {/* AI analysis button */}
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

  // Render timeline view (history of X-rays)
  const renderTimelineView = () => {
    if (!showTimeline) return null;
    
    return (
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base">
              X-ray History Timeline
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6" 
              onClick={() => setShowTimeline(false)}
            >
              <PanelLeftClose className="h-4 w-4 mr-1" />
              Close
            </Button>
          </div>
          <CardDescription>
            Click on any X-ray to view or select for comparison
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            {selectedTimeframeXRays.map((xray, index) => (
              <div 
                key={xray.id} 
                className="border rounded overflow-hidden cursor-pointer relative"
                onClick={() => {
                  if (compareMode) {
                    toggleXRaySelection(xray.id);
                  } else {
                    if (onXRaySelected) onXRaySelected(xray);
                  }
                }}
              >
                <div className="h-6 bg-muted/50 text-xs px-2 flex items-center justify-between">
                  <span>{new Date(xray.date!).toLocaleDateString()}</span>
                </div>
                <div className="h-24 bg-black">
                  {xray.imageUrl && (
                    <img 
                      src={xray.imageUrl} 
                      alt={`X-ray from ${xray.date}`}
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // Render enhancement controls when an X-ray is selected
  const renderEnhancementControls = () => {
    const selectedXRay = selectedSlotId ? getXRayForPosition(selectedSlotId) : null;
    if (!selectedXRay) return null;
    
    return (
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-base">
                X-ray Enhancement Tools
              </CardTitle>
              <CardDescription>
                {showSuperimposition 
                  ? "Superimposition active - viewing changes over time" 
                  : "Enhance visualization and orientation"}
              </CardDescription>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={() => setViewMode(viewMode === 'xray' ? 'tissue' : 'xray')}>
                    {viewMode === 'xray' 
                      ? <ThermometerSnowflake className="h-4 w-4" /> 
                      : <Eye className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {viewMode === 'xray' ? "Switch to tissue view" : "Switch to X-ray view"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="space-y-3">
            {/* Superimposition opacity control */}
            {showSuperimposition && (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium">Superimposition Opacity</span>
                  <span className="text-xs text-muted-foreground">{superimpositionOpacity}%</span>
                </div>
                <Slider
                  defaultValue={[superimpositionOpacity]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={(value) => setSuperimpositionOpacity(value[0])}
                  className="w-full"
                />
              </div>
            )}
            
            {/* Zoom control */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium">Zoom Level</span>
                <span className="text-xs text-muted-foreground">{zoomLevel}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-7 w-7" 
                  onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </Button>
                
                <Slider
                  value={[zoomLevel]}
                  min={50}
                  max={200}
                  step={10}
                  onValueChange={(value) => setZoomLevel(value[0])}
                  className="w-full"
                />
                
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-7 w-7" 
                  onClick={() => setZoomLevel(Math.min(200, zoomLevel + 10))}
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            
            {/* View mode controls */}
            <div className="flex flex-wrap gap-2 mt-2">
              <Button 
                variant={viewMode === 'xray' ? "default" : "outline"} 
                size="sm" 
                className="h-7 gap-1"
                onClick={() => handleViewModeChange('xray')}
              >
                <Eye className="h-3.5 w-3.5" />
                <span className="text-xs">X-ray View</span>
              </Button>
              
              <Button 
                variant={viewMode === 'tissue' ? "default" : "outline"} 
                size="sm" 
                className="h-7 gap-1"
                onClick={() => handleViewModeChange('tissue')}
              >
                <ThermometerSnowflake className="h-3.5 w-3.5" />
                <span className="text-xs">Tissue View</span>
              </Button>
              
              <Button 
                variant={viewMode === 'combined' ? "default" : "outline"} 
                size="sm" 
                className="h-7 gap-1"
                onClick={() => handleViewModeChange('combined')}
              >
                <Layers className="h-3.5 w-3.5" />
                <span className="text-xs">Combined View</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
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
              onCheckedChange={(val) => {
                setCompareMode(val);
                if (!val) {
                  setSelectedXRays([]);
                }
              }}
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
      
      {/* Timeline view */}
      {showTimeline && renderTimelineView()}
      
      {/* Enhancement controls */}
      {selectedSlotId && renderEnhancementControls()}
      
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