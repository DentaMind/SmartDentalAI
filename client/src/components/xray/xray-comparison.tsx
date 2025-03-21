import React, { useState, useEffect, useRef } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  ToggleGroup,
} from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Brain, 
  Layers, 
  Download, 
  Maximize, 
  ArrowLeft, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  ImageDown, 
  Ruler, 
  PanelTopOpen,
  RotateCw,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Move,
  Shuffle,
  ThermometerSnowflake,
  Grid,
  History
} from 'lucide-react';

// Define types for the components
export interface XRayImage {
  id: string;
  imageUrl: string;
  type: string;
  date: string;
  provider: string;
  description?: string;
  aiAnalyzed?: boolean;
  aiFindings?: string[];
}

interface XRayComparisonProps {
  beforeXray: XRayImage;
  afterXray: XRayImage;
  patientName: string;
  onClose?: () => void;
}

export interface XRayOrientation {
  flipped: boolean;
  rotated: number; // degrees 0, 90, 180, 270
}

export function XRayComparison({ beforeXray, afterXray, patientName, onClose }: XRayComparisonProps) {
  // State for comparison settings
  const [viewMode, setViewMode] = useState<'side-by-side' | 'overlay' | 'slider'>('side-by-side');
  const [sliderPosition, setSliderPosition] = useState(50);
  const [opacity, setOpacity] = useState(50);
  const [zoom, setZoom] = useState(100);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [showMeasurements, setShowMeasurements] = useState(false);
  const [showTissueOverlay, setShowTissueOverlay] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [autoOrient, setAutoOrient] = useState(true);
  
  // Orientation controls
  const [beforeOrientation, setBeforeOrientation] = useState<XRayOrientation>({ flipped: false, rotated: 0 });
  const [afterOrientation, setAfterOrientation] = useState<XRayOrientation>({ flipped: false, rotated: 0 });
  
  // Enhanced view options
  const [tissueMode, setTissueMode] = useState<'none' | 'overlay' | 'combined'>('none');
  const [showHistory, setShowHistory] = useState(false);
  
  // References to image containers for manipulation
  const beforeImageRef = useRef<HTMLImageElement>(null);
  const afterImageRef = useRef<HTMLImageElement>(null);
  const overlayContainerRef = useRef<HTMLDivElement>(null);
  
  // Calculate the difference in time between the two X-rays
  const beforeDate = new Date(beforeXray.date);
  const afterDate = new Date(afterXray.date);
  const daysBetween = Math.round((afterDate.getTime() - beforeDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Automatically detect and correct orientation on component mount
  useEffect(() => {
    if (autoOrient) {
      // This would normally use AI to detect proper orientation
      // For this demo, we just simulate auto-orientation with a timeout
      const timer = setTimeout(() => {
        // Simulate AI-based orientation detection
        // In real implementation, this would analyze the images and set correct orientation
        console.log('Auto-orienting images based on dental landmarks');
        setBeforeOrientation({ flipped: false, rotated: 0 });
        setAfterOrientation({ flipped: false, rotated: 0 });
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [autoOrient]);
  
  // Handle view mode changes
  useEffect(() => {
    if (viewMode === 'overlay' && overlayContainerRef.current) {
      // Set the opacity of the overlay image
      const overlayImage = overlayContainerRef.current.querySelector('.overlay-image') as HTMLElement;
      if (overlayImage) {
        overlayImage.style.opacity = (opacity / 100).toString();
      }
    }
  }, [viewMode, opacity]);
  
  // Handle zoom changes and orientation
  useEffect(() => {
    const zoomScale = zoom / 100;
    
    if (beforeImageRef.current) {
      const flipTransform = beforeOrientation.flipped ? 'scaleX(-1)' : '';
      const rotateTransform = beforeOrientation.rotated ? `rotate(${beforeOrientation.rotated}deg)` : '';
      beforeImageRef.current.style.transform = `scale(${zoomScale}) ${flipTransform} ${rotateTransform}`;
    }
    
    if (afterImageRef.current) {
      const flipTransform = afterOrientation.flipped ? 'scaleX(-1)' : '';
      const rotateTransform = afterOrientation.rotated ? `rotate(${afterOrientation.rotated}deg)` : '';
      afterImageRef.current.style.transform = `scale(${zoomScale}) ${flipTransform} ${rotateTransform}`;
    }
  }, [zoom, beforeOrientation, afterOrientation]);
  
  // Handle tissue visualization modes
  useEffect(() => {
    const applyFilter = (imgElement: HTMLImageElement | null, mode: 'none' | 'overlay' | 'combined') => {
      if (!imgElement) return;
      
      // Reset filters first
      imgElement.style.filter = '';
      
      if (mode === 'overlay') {
        // Soft tissue mode - enhance visibility of soft tissues
        imgElement.style.filter = 'contrast(1.2) brightness(1.1) saturate(0.8)';
      } else if (mode === 'combined') {
        // Thermal-like view for density visualization
        imgElement.style.filter = 'hue-rotate(180deg) saturate(1.5) contrast(1.3)';
      }
    };
    
    applyFilter(beforeImageRef.current, tissueMode);
    applyFilter(afterImageRef.current, tissueMode);
    
    // Apply grid overlay if enabled
    if (beforeImageRef.current && afterImageRef.current) {
      const beforeParent = beforeImageRef.current.parentElement;
      const afterParent = afterImageRef.current.parentElement;
      
      if (beforeParent && afterParent) {
        beforeParent.style.backgroundImage = showGrid ? 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)' : 'none';
        beforeParent.style.backgroundSize = '20px 20px';
        
        afterParent.style.backgroundImage = showGrid ? 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)' : 'none';
        afterParent.style.backgroundSize = '20px 20px';
      }
    }
  }, [tissueMode, showGrid]);
  
  // Handle timeline view
  useEffect(() => {
    // This would connect to a real timeline service in production
    // to retrieve historical X-rays for the same tooth/area
    if (showHistory) {
      console.log('Loading historical X-ray timeline data');
      // In a real implementation, this would fetch the patient's
      // X-ray history for this specific tooth or region
    }
  }, [showHistory]);
  
  // Export comparison as image
  const exportComparison = () => {
    // In a real implementation, this would capture the current view
    // as an image and download it
    console.log('Exporting comparison');
    alert('Comparison exported to patient record');
  };
  
  return (
    <Card className="w-full max-w-7xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg md:text-xl">X-Ray Comparison</CardTitle>
            <CardDescription>
              {beforeXray.type} X-rays for {patientName} - {daysBetween} days between captures
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            {(beforeXray.aiAnalyzed || afterXray.aiAnalyzed) && (
              <Badge className="bg-primary hover:bg-primary flex items-center gap-1">
                <Brain className="h-3 w-3" />
                AI Analysis Applied
              </Badge>
            )}
            
            <Button variant="outline" size="sm" onClick={onClose}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>
        </div>
        
        {/* Timeline view */}
        {showHistory && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
              <History className="h-4 w-4" />
              X-Ray Timeline History
            </h4>
            <div className="relative">
              {/* Timeline bar */}
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full" 
                  style={{ width: '100%' }}
                ></div>
              </div>
              
              {/* Timeline markers */}
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-primary rounded-full mb-1"></div>
                  <span>{new Date(beforeXray.date).toLocaleDateString()}</span>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-primary rounded-full mb-1"></div>
                  <span>{new Date(afterXray.date).toLocaleDateString()}</span>
                </div>
                
                {/* In a real implementation, this would show additional historical X-rays */}
                <div className="flex flex-col items-center opacity-50">
                  <div className="w-3 h-3 bg-gray-400 rounded-full mb-1"></div>
                  <span>{new Date(new Date().setDate(new Date().getDate() - 365)).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="mt-2 text-xs text-muted-foreground italic">
                Additional historical X-rays available in patient records
              </div>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* View control tabs */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="side-by-side">Side by Side</TabsTrigger>
              <TabsTrigger value="overlay">Overlay</TabsTrigger>
              <TabsTrigger value="slider">Slider</TabsTrigger>
            </TabsList>
            
            {/* Side by side view */}
            <TabsContent value="side-by-side" className="mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black rounded-lg overflow-hidden relative">
                  <div className="absolute top-2 left-2 z-10">
                    <Badge variant="outline" className="bg-black/70 text-white border-none">
                      Before: {new Date(beforeXray.date).toLocaleDateString()}
                    </Badge>
                  </div>
                  <div className="overflow-hidden" style={{ height: '400px' }}>
                    <img 
                      ref={beforeImageRef}
                      src={beforeXray.imageUrl} 
                      alt={`Before ${beforeXray.type} x-ray`}
                      className="w-full h-full object-contain transition-transform duration-300 origin-center"
                    />
                  </div>
                </div>
                
                <div className="bg-black rounded-lg overflow-hidden relative">
                  <div className="absolute top-2 left-2 z-10">
                    <Badge variant="outline" className="bg-black/70 text-white border-none">
                      After: {new Date(afterXray.date).toLocaleDateString()}
                    </Badge>
                  </div>
                  <div className="overflow-hidden" style={{ height: '400px' }}>
                    <img 
                      ref={afterImageRef}
                      src={afterXray.imageUrl} 
                      alt={`After ${afterXray.type} x-ray`}
                      className="w-full h-full object-contain transition-transform duration-300 origin-center"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Overlay view */}
            <TabsContent value="overlay" className="mt-4">
              <div className="bg-black rounded-lg overflow-hidden relative" style={{ height: '400px' }}>
                <div className="absolute top-2 left-2 z-10">
                  <Badge variant="outline" className="bg-black/70 text-white border-none mr-2">
                    Before: {new Date(beforeXray.date).toLocaleDateString()}
                  </Badge>
                  <Badge variant="outline" className="bg-black/70 text-white border-none">
                    After: {new Date(afterXray.date).toLocaleDateString()}
                  </Badge>
                </div>
                
                <div ref={overlayContainerRef} className="relative w-full h-full">
                  <img 
                    src={beforeXray.imageUrl} 
                    alt={`Before ${beforeXray.type} x-ray`}
                    className="w-full h-full object-contain absolute top-0 left-0 z-0"
                  />
                  <img 
                    src={afterXray.imageUrl} 
                    alt={`After ${afterXray.type} x-ray`}
                    className="w-full h-full object-contain absolute top-0 left-0 z-10 overlay-image"
                    style={{ opacity: opacity / 100 }}
                  />
                </div>
                
                <div className="absolute bottom-4 left-0 right-0 px-4">
                  <div className="flex items-center gap-2 text-white text-xs mb-1">
                    <span>Before</span>
                    <div className="flex-1"></div>
                    <span>After</span>
                  </div>
                  <Slider 
                    value={[opacity]} 
                    min={0} 
                    max={100} 
                    step={1}
                    onValueChange={(vals) => setOpacity(vals[0])}
                    className="opacity-slider"
                  />
                </div>
              </div>
            </TabsContent>
            
            {/* Slider view */}
            <TabsContent value="slider" className="mt-4">
              <div className="bg-black rounded-lg overflow-hidden relative" style={{ height: '400px' }}>
                <div className="absolute top-2 left-2 z-20">
                  <Badge variant="outline" className="bg-black/70 text-white border-none mr-2">
                    Before: {new Date(beforeXray.date).toLocaleDateString()}
                  </Badge>
                  <Badge variant="outline" className="bg-black/70 text-white border-none">
                    After: {new Date(afterXray.date).toLocaleDateString()}
                  </Badge>
                </div>
                
                <div className="relative w-full h-full overflow-hidden">
                  <img 
                    src={beforeXray.imageUrl} 
                    alt={`Before ${beforeXray.type} x-ray`}
                    className="w-full h-full object-contain absolute top-0 left-0 z-0"
                  />
                  
                  <div 
                    className="absolute top-0 right-0 h-full z-10 overflow-hidden" 
                    style={{ width: `${sliderPosition}%` }}
                  >
                    <img 
                      src={afterXray.imageUrl} 
                      alt={`After ${afterXray.type} x-ray`}
                      className="w-full h-full object-contain absolute top-0 left-0"
                      style={{ 
                        width: `${100 / (sliderPosition / 100)}%`,
                        right: 0,
                        position: 'absolute'
                      }}
                    />
                  </div>
                  
                  {/* The slider divider line */}
                  <div 
                    className="absolute top-0 bottom-0 w-1 bg-primary z-20 cursor-ew-resize"
                    style={{ left: `${sliderPosition}%` }}
                  ></div>
                </div>
                
                <div className="absolute bottom-4 left-0 right-0 px-4">
                  <Slider 
                    value={[sliderPosition]} 
                    min={0} 
                    max={100} 
                    step={1}
                    onValueChange={(vals) => setSliderPosition(vals[0])}
                    className="slider-control"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          {/* Controls */}
          <div className="bg-muted p-3 rounded-lg">
            <div className="mb-3 flex justify-between items-center">
              <h4 className="text-sm font-medium">View Controls</h4>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={exportComparison}>
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Export this comparison to patient record</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Zoom: {zoom}%</Label>
                </div>
                <Slider 
                  value={[zoom]} 
                  min={50} 
                  max={200} 
                  step={5}
                  onValueChange={(vals) => setZoom(vals[0])}
                />
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block">Display Options</Label>
                  <div className="flex flex-wrap gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant={showAnnotations ? "default" : "outline"} 
                            size="sm"
                            onClick={() => setShowAnnotations(!showAnnotations)}
                            className={showAnnotations ? "bg-primary text-primary-foreground" : ""}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Annotations
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Show or hide AI annotations</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant={showMeasurements ? "default" : "outline"} 
                            size="sm"
                            onClick={() => setShowMeasurements(!showMeasurements)}
                            className={showMeasurements ? "bg-primary text-primary-foreground" : ""}
                          >
                            <Ruler className="h-4 w-4 mr-1" />
                            Measurements
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Show or hide measurements</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant={showGrid ? "default" : "outline"} 
                            size="sm"
                            onClick={() => setShowGrid(!showGrid)}
                            className={showGrid ? "bg-primary text-primary-foreground" : ""}
                          >
                            <Grid className="h-4 w-4 mr-1" />
                            Grid
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Show measurement grid overlay</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant={showHistory ? "default" : "outline"} 
                            size="sm"
                            onClick={() => setShowHistory(!showHistory)}
                            className={showHistory ? "bg-primary text-primary-foreground" : ""}
                          >
                            <History className="h-4 w-4 mr-1" />
                            Timeline
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Show historical timeline comparison</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                
                <div>
                  <Label className="mb-2 block">Tissue Visualization</Label>
                  <div className="flex flex-wrap gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant={tissueMode === 'none' ? "default" : "outline"} 
                            size="sm"
                            onClick={() => setTissueMode('none')}
                            className={tissueMode === 'none' ? "bg-primary text-primary-foreground" : ""}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Normal
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Standard X-ray view</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant={tissueMode === 'overlay' ? "default" : "outline"} 
                            size="sm"
                            onClick={() => setTissueMode('overlay')}
                            className={tissueMode === 'overlay' ? "bg-primary text-primary-foreground" : ""}
                          >
                            <Layers className="h-4 w-4 mr-1" />
                            Soft Tissue
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Highlight soft tissue structures</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant={tissueMode === 'combined' ? "default" : "outline"} 
                            size="sm"
                            onClick={() => setTissueMode('combined')}
                            className={tissueMode === 'combined' ? "bg-primary text-primary-foreground" : ""}
                          >
                            <ThermometerSnowflake className="h-4 w-4 mr-1" />
                            Thermal View
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Enhanced density visualization</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                
                <div>
                  <Label className="mb-2 block">Orientation Controls</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Before Image</div>
                      <div className="flex gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => setBeforeOrientation(prev => ({ ...prev, rotated: (prev.rotated - 90 + 360) % 360 }))}
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Rotate counterclockwise</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => setBeforeOrientation(prev => ({ ...prev, rotated: (prev.rotated + 90) % 360 }))}
                              >
                                <RotateCw className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Rotate clockwise</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => setBeforeOrientation(prev => ({ ...prev, flipped: !prev.flipped }))}
                              >
                                <Shuffle className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Flip horizontally</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">After Image</div>
                      <div className="flex gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => setAfterOrientation(prev => ({ ...prev, rotated: (prev.rotated - 90 + 360) % 360 }))}
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Rotate counterclockwise</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => setAfterOrientation(prev => ({ ...prev, rotated: (prev.rotated + 90) % 360 }))}
                              >
                                <RotateCw className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Rotate clockwise</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => setAfterOrientation(prev => ({ ...prev, flipped: !prev.flipped }))}
                              >
                                <Shuffle className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Flip horizontally</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Analysis results comparison */}
          {(beforeXray.aiAnalyzed || afterXray.aiAnalyzed) && (
            <div className="border rounded-lg">
              <div className="bg-primary/10 p-3 border-b rounded-t-lg">
                <h3 className="font-medium flex items-center">
                  <Brain className="h-4 w-4 mr-2 text-primary" />
                  AI Analysis Comparison
                </h3>
              </div>
              
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {beforeXray.aiAnalyzed && (
                    <div>
                      <h4 className="font-medium mb-2 text-sm text-muted-foreground">Before ({new Date(beforeXray.date).toLocaleDateString()})</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {beforeXray.aiFindings?.map((finding, i) => (
                          <li key={i}>{finding}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {afterXray.aiAnalyzed && (
                    <div>
                      <h4 className="font-medium mb-2 text-sm text-muted-foreground">After ({new Date(afterXray.date).toLocaleDateString()})</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {afterXray.aiFindings?.map((finding, i) => (
                          <li key={i}>{finding}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Label component for the slider
function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-sm font-medium mb-1 ${className}`}>{children}</div>;
}