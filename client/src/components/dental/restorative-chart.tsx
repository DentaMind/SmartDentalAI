import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Maximize2, Save, List, Trash2, LockKeyhole, Check } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ToothSvgOcclusal, ToothSvgBuccal, ToothSvgLingual } from './tooth-illustrations';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';

interface Restoration {
  type: 'amalgam' | 'composite' | 'crown' | 'implant' | 'bridge' | 'root-canal' | 'sealant' | 'veneer' | 'none';
  surfaces: Array<'M' | 'O' | 'D' | 'B' | 'L'>;
  notes?: string;
  addedBy?: string;
  addedAt?: string;
}

interface ToothRestoration {
  restorations: Restoration[];
  missing: boolean;
}

interface ChartModification {
  id: string;
  toothNumber: number;
  modificationType: 'add' | 'remove' | 'missing' | 'present';
  restorationType?: Restoration['type'];
  surfaces?: Array<'M' | 'O' | 'D' | 'B' | 'L'>;
  provider: string;
  timestamp: string;
  notes?: string;
}

interface RestorativeChartProps {
  patientId: number;
  patientName: string;
  readOnly?: boolean;
  onSave?: (data: any) => void;
}

export function RestorativeChart({
  patientId,
  patientName,
  readOnly = false,
  onSave
}: RestorativeChartProps) {
  const { user } = useAuth();
  const [fullScreen, setFullScreen] = useState(false);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [selectedRestorationType, setSelectedRestorationType] = useState<Restoration['type']>('composite');
  const [restorations, setRestorations] = useState<Record<number, ToothRestoration>>({});
  const [modifications, setModifications] = useState<ChartModification[]>([]);
  
  // Authentication and confirmation modals
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    action: 'add' | 'remove' | 'missing' | 'save';
    data?: any;
  } | null>(null);
  const [password, setPassword] = useState('');
  const [confirmError, setConfirmError] = useState('');
  
  // Selected views state
  const [selectedView, setSelectedView] = useState<'occlusal' | 'buccal' | 'lingual'>('occlusal');
  const [showActivityLog, setShowActivityLog] = useState(false);
  
  // View toggle for different angles
  const toggleView = (view: 'occlusal' | 'buccal' | 'lingual') => {
    setSelectedView(view);
  };

  // Initialize restorations for all teeth
  React.useEffect(() => {
    const initialRestorations: Record<number, ToothRestoration> = {};
    // Initialize upper arch (1-16)
    for (let i = 1; i <= 16; i++) {
      initialRestorations[i] = {
        restorations: [],
        missing: false
      };
    }
    // Initialize lower arch (17-32)
    for (let i = 17; i <= 32; i++) {
      initialRestorations[i] = {
        restorations: [],
        missing: false
      };
    }
    setRestorations(initialRestorations);
  }, []);



  // Function to handle tooth click
  const handleToothClick = (toothNumber: number) => {
    setSelectedTooth(toothNumber);
  };

  // Function to request authentication before performing action
  const requestAuthentication = (action: 'add' | 'remove' | 'missing' | 'save', data?: any) => {
    setPendingAction({ action, data });
    setIsConfirmDialogOpen(true);
    setPassword('');
    setConfirmError('');
  };

  // Function to confirm action with password
  const confirmAction = () => {
    // In a real app, verify password on the server
    // For demo, let's assume password "password" works
    if (password === 'password') {
      if (pendingAction) {
        switch (pendingAction.action) {
          case 'add':
            executeAddRestoration();
            break;
          case 'remove':
            executeClearToothRestorations();
            break;
          case 'missing':
            executeMarkToothMissing();
            break;
          case 'save':
            executeSaveChart();
            break;
        }
      }
      setIsConfirmDialogOpen(false);
      setPendingAction(null);
    } else {
      setConfirmError('Incorrect password');
    }
  };

  // Function to add restoration to tooth
  const addRestoration = () => {
    if (selectedTooth === null) return;
    requestAuthentication('add');
  };

  // Execute add restoration after authentication
  const executeAddRestoration = () => {
    if (selectedTooth === null || !user) return;
    
    const timestamp = new Date().toISOString();
    const providerName = `${user.firstName} ${user.lastName}`;
    
    // Create modification record
    const modification: ChartModification = {
      id: `mod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      toothNumber: selectedTooth,
      modificationType: 'add',
      restorationType: selectedRestorationType,
      surfaces: ['O'], // Default to occlusal surface
      provider: providerName,
      timestamp: timestamp,
    };
    
    // Update restorations
    setRestorations(prev => {
      const updatedRestorations = { ...prev };
      updatedRestorations[selectedTooth].restorations.push({
        type: selectedRestorationType,
        surfaces: ['O'], // Default to occlusal surface
        addedBy: providerName,
        addedAt: timestamp
      });
      return updatedRestorations;
    });
    
    // Add to modifications history
    setModifications(prev => [...prev, modification]);
    
    toast({
      title: "Restoration Added",
      description: `Added ${selectedRestorationType} to tooth #${selectedTooth}`,
    });
  };

  // Function to mark tooth as missing
  const markToothMissing = () => {
    if (selectedTooth === null) return;
    requestAuthentication('missing');
  };

  // Execute mark tooth missing after authentication
  const executeMarkToothMissing = () => {
    if (selectedTooth === null || !user) return;
    
    const timestamp = new Date().toISOString();
    const providerName = `${user.firstName} ${user.lastName}`;
    const isMissing = !restorations[selectedTooth]?.missing;
    
    // Create modification record
    const modification: ChartModification = {
      id: `mod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      toothNumber: selectedTooth,
      modificationType: isMissing ? 'missing' : 'present',
      provider: providerName,
      timestamp: timestamp,
    };
    
    // Update restorations
    setRestorations(prev => {
      const updatedRestorations = { ...prev };
      updatedRestorations[selectedTooth].missing = isMissing;
      return updatedRestorations;
    });
    
    // Add to modifications history
    setModifications(prev => [...prev, modification]);
    
    toast({
      title: "Tooth Status Updated",
      description: `Tooth #${selectedTooth} marked as ${isMissing ? 'missing' : 'present'}`,
    });
  };

  // Function to clear all restorations from a tooth
  const clearToothRestorations = () => {
    if (selectedTooth === null) return;
    requestAuthentication('remove');
  };

  // Execute clear tooth restorations after authentication
  const executeClearToothRestorations = () => {
    if (selectedTooth === null || !user) return;
    
    const timestamp = new Date().toISOString();
    const providerName = `${user.firstName} ${user.lastName}`;
    
    // Create modification record
    const modification: ChartModification = {
      id: `mod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      toothNumber: selectedTooth,
      modificationType: 'remove',
      provider: providerName,
      timestamp: timestamp,
    };
    
    // Update restorations
    setRestorations(prev => {
      const updatedRestorations = { ...prev };
      updatedRestorations[selectedTooth].restorations = [];
      return updatedRestorations;
    });
    
    // Add to modifications history
    setModifications(prev => [...prev, modification]);
    
    toast({
      title: "Restorations Cleared",
      description: `Cleared all restorations from tooth #${selectedTooth}`,
    });
  };

  // Function to save the chart
  const handleSave = () => {
    requestAuthentication('save');
  };

  // Execute save chart after authentication
  const executeSaveChart = () => {
    if (!user) return;
    
    if (onSave) {
      onSave({
        patientId,
        restorations,
        modifications,
        timestamp: new Date().toISOString(),
        savedBy: `${user.firstName} ${user.lastName}`
      });
    }
    
    toast({
      title: "Chart Saved",
      description: "Restorative chart has been saved successfully.",
    });
  };

  // Function to get color for tooth based on restorations
  const getToothFill = (toothNumber: number) => {
    const tooth = restorations[toothNumber];
    
    if (!tooth) return "white";
    if (tooth.missing) return "#f0f0f0"; // Light gray for missing teeth
    
    // If tooth has restorations, apply specific material-based fill colors
    if (tooth.restorations.length > 0) {
      // Prioritize certain restoration types for coloring
      const priorityOrder = ['implant', 'crown', 'bridge', 'root-canal', 'amalgam', 'composite', 'sealant', 'veneer'];
      
      // Sort restorations by priority
      const sortedRestorations = [...tooth.restorations].sort((a, b) => {
        return priorityOrder.indexOf(a.type) - priorityOrder.indexOf(b.type);
      });
      
      const primaryRestoration = sortedRestorations[0];
      
      // Return color based on restoration type with enhanced material realism
      switch (primaryRestoration.type) {
        case 'amalgam': return "#a8a9ad"; // Metallic silver (more realistic for amalgam)
        case 'composite': return "#f0f0e8"; // Slightly off-white with yellow tint (realistic tooth-colored composite)
        case 'crown': return "#e0d0a0"; // Less saturated gold (more realistic for gold crowns)
        case 'implant': return "#d8d8d8"; // Titanium-like color
        case 'bridge': return "#eae0d0"; // Porcelain-like color
        case 'root-canal': return "#fff0e8"; // Slightly pink indicating treated area
        case 'sealant': return "#ffffff"; // White (clear sealant)
        case 'veneer': return "#f8f8ff"; // Very slightly off-white (realistic porcelain veneer)
        default: return "white";
      }
    }
    
    return "white"; // Default fill color
  };

  // Function to get tooth stroke based on restorations
  const getToothStroke = (toothNumber: number) => {
    const tooth = restorations[toothNumber];
    
    if (!tooth) return "black";
    if (tooth.missing) return "#999999"; // Gray for missing teeth
    
    // Apply appropriate outline colors based on restoration type
    if (tooth.restorations.length > 0) {
      // Prioritize certain restoration types for coloring
      const priorityOrder = ['implant', 'crown', 'bridge', 'root-canal', 'amalgam', 'composite', 'sealant', 'veneer'];
      
      // Sort restorations by priority
      const sortedRestorations = [...tooth.restorations].sort((a, b) => {
        return priorityOrder.indexOf(a.type) - priorityOrder.indexOf(b.type);
      });
      
      const primaryRestoration = sortedRestorations[0];
      
      // Return stroke color based on restoration type
      switch (primaryRestoration.type) {
        case 'amalgam': return "#777777"; // Darker gray outline for amalgam
        case 'composite': return "#909080"; // Subtle outline for composite
        case 'crown': return "#b0a060"; // Gold-like outline for crowns
        case 'implant': return "#606060"; // Dark gray for implant to show titanium distinction
        case 'bridge': return "#a08060"; // Brown undertone for bridge
        case 'root-canal': return "#bb6060"; // Slightly reddish for root canal
        case 'sealant': return "#60a0a0"; // Cyan-tint for sealant
        case 'veneer': return "#909090"; // Subtle gray for veneer edge
        default: return "black";
      }
    }
    
    return "black"; // Default stroke
  };

  // Helper to render the view-specific tooth SVG
  const renderToothView = (toothNumber: number, size = 24) => {
    switch (selectedView) {
      case 'buccal':
        return (
          <ToothSvgBuccal
            toothNumber={toothNumber}
            width={size}
            height={size}
            fill={getToothFill(toothNumber)}
            stroke={getToothStroke(toothNumber)}
            strokeWidth={1}
            className="cursor-pointer"
          />
        );
      case 'lingual':
        return (
          <ToothSvgLingual
            toothNumber={toothNumber}
            width={size}
            height={size}
            fill={getToothFill(toothNumber)}
            stroke={getToothStroke(toothNumber)}
            strokeWidth={1}
            className="cursor-pointer"
          />
        );
      case 'occlusal':
      default:
        return (
          <ToothSvgOcclusal
            toothNumber={toothNumber}
            width={size}
            height={size}
            fill={getToothFill(toothNumber)}
            stroke={getToothStroke(toothNumber)}
            strokeWidth={1}
            className="cursor-pointer"
          />
        );
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Helper function for selected tooth styling - using amber instead of blue
  const getSelectedToothClass = (tooth: number) => {
    return selectedTooth === tooth ? 'bg-amber-100 rounded p-1' : 'p-1';
  };
  
  return (
    <>
      <Card className={`w-full ${fullScreen ? 'fixed inset-0 z-50 overflow-auto' : ''}`}>
        <CardHeader className="flex flex-row items-center justify-between p-2 sm:p-4">
          <div>
            <CardTitle className="text-base sm:text-lg">
              Restorative Chart ({selectedView === 'occlusal' ? 'Occlusal' : selectedView === 'buccal' ? 'Buccal' : 'Lingual'} View)
            </CardTitle>
            <div className="text-xs sm:text-sm text-muted-foreground">
              Patient: {patientName}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowActivityLog(!showActivityLog)}
              className="h-7 text-xs mr-1"
            >
              <List className="h-3 w-3 mr-1" />
              {showActivityLog ? 'Hide Activity' : 'Activity Log'}
            </Button>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setFullScreen(!fullScreen)}
                    className="h-7 w-7"
                  >
                    <Maximize2 className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{fullScreen ? 'Exit Fullscreen' : 'Fullscreen Mode'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {!readOnly && (
              <Button onClick={handleSave} size="sm" className="h-7 text-xs">
                <Save className="h-3 w-3 mr-1" />
                Save
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-2 sm:p-4">
          <div className="space-y-6">
            {/* View Selector */}
            <div className="flex flex-wrap gap-2 justify-center">
              <Button 
                size="sm" 
                variant={selectedView === 'occlusal' ? 'default' : 'outline'}
                onClick={() => toggleView('occlusal')}
              >
                Occlusal View
              </Button>
              <Button 
                size="sm" 
                variant={selectedView === 'buccal' ? 'default' : 'outline'}
                onClick={() => toggleView('buccal')}
              >
                Buccal View
              </Button>
              <Button 
                size="sm" 
                variant={selectedView === 'lingual' ? 'default' : 'outline'}
                onClick={() => toggleView('lingual')}
              >
                Lingual View
              </Button>
            </div>
            
            {/* Restoration Type Selector */}
            {!readOnly && (
              <div className="flex flex-wrap gap-2 justify-center">
                <Button 
                  size="sm" 
                  variant={selectedRestorationType === 'amalgam' ? 'default' : 'outline'}
                  onClick={() => setSelectedRestorationType('amalgam')}
                  className="bg-gray-800 text-white border-gray-800 hover:bg-gray-700 hover:text-white"
                >
                  Amalgam
                </Button>
                <Button 
                  size="sm" 
                  variant={selectedRestorationType === 'composite' ? 'default' : 'outline'}
                  onClick={() => setSelectedRestorationType('composite')}
                  className="bg-gray-200 text-gray-800 border-gray-300 hover:bg-gray-300"
                >
                  Composite
                </Button>
                <Button 
                  size="sm" 
                  variant={selectedRestorationType === 'crown' ? 'default' : 'outline'}
                  onClick={() => setSelectedRestorationType('crown')}
                  className="bg-yellow-400 text-yellow-900 border-yellow-500 hover:bg-yellow-500"
                >
                  Crown
                </Button>
                <Button 
                  size="sm" 
                  variant={selectedRestorationType === 'bridge' ? 'default' : 'outline'}
                  onClick={() => setSelectedRestorationType('bridge')}
                  className="bg-blue-500 text-white border-blue-600 hover:bg-blue-600"
                >
                  Bridge
                </Button>
                <Button 
                  size="sm" 
                  variant={selectedRestorationType === 'implant' ? 'default' : 'outline'}
                  onClick={() => setSelectedRestorationType('implant')}
                  className="bg-purple-600 text-white border-purple-700 hover:bg-purple-700"
                >
                  Implant
                </Button>
                <Button 
                  size="sm" 
                  variant={selectedRestorationType === 'root-canal' ? 'default' : 'outline'}
                  onClick={() => setSelectedRestorationType('root-canal')}
                  className="bg-red-500 text-white border-red-600 hover:bg-red-600"
                >
                  Root Canal
                </Button>
              </div>
            )}
            
            {/* Selected Tooth Actions */}
            {selectedTooth !== null && !readOnly && (
              <div className="flex flex-wrap gap-2 justify-center">
                <Button 
                  size="sm" 
                  variant="default"
                  onClick={addRestoration}
                >
                  Add {selectedRestorationType} to Tooth #{selectedTooth}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={markToothMissing}
                >
                  {restorations[selectedTooth]?.missing ? 'Mark as Present' : 'Mark as Missing'}
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={clearToothRestorations}
                >
                  Clear Restorations
                </Button>
              </div>
            )}

            {/* Display selected tooth details if one is selected */}
            {selectedTooth !== null && (
              <div className="flex flex-col items-center p-2 border rounded-md">
                <div className="text-sm font-medium mb-2">Tooth #{selectedTooth}</div>
                <div className="flex gap-6 items-center justify-center mb-2">
                  <div className="flex flex-col items-center">
                    <div className="text-xs mb-1">Buccal</div>
                    <ToothSvgBuccal
                      toothNumber={selectedTooth}
                      width={60}
                      height={60}
                      fill={getToothFill(selectedTooth)}
                      stroke={getToothStroke(selectedTooth)}
                      strokeWidth={1.5}
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="text-xs mb-1">Occlusal</div>
                    <ToothSvgOcclusal
                      toothNumber={selectedTooth}
                      width={60}
                      height={60}
                      fill={getToothFill(selectedTooth)}
                      stroke={getToothStroke(selectedTooth)}
                      strokeWidth={1.5}
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="text-xs mb-1">Lingual</div>
                    <ToothSvgLingual
                      toothNumber={selectedTooth}
                      width={60}
                      height={60}
                      fill={getToothFill(selectedTooth)}
                      stroke={getToothStroke(selectedTooth)}
                      strokeWidth={1.5}
                    />
                  </div>
                </div>
                {/* Restorations on this tooth */}
                {restorations[selectedTooth]?.restorations.length > 0 && (
                  <div className="w-full mt-2">
                    <div className="text-xs font-medium mb-1">Restorations:</div>
                    <div className="text-xs space-y-1">
                      {restorations[selectedTooth].restorations.map((restoration, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{restoration.type} ({restoration.surfaces.join(',')})</span>
                          {restoration.addedBy && <span>By: {restoration.addedBy}</span>}
                          {restoration.addedAt && <span>On: {formatDate(restoration.addedAt)}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Upper and Lower Arch View - Full width */}
            <div className="space-y-4">
              {/* Upper Arch */}
              <div className="relative">
                <div className="flex justify-between mb-1">
                  <span className="text-xs sm:text-sm font-medium">Upper Arch (1-16)</span>
                </div>
                
                <div className="border rounded-md p-2 bg-gray-50">
                  {/* Buccal View */}
                  <div className="mb-1 text-xs text-center font-medium">Buccal View</div>
                  <div className="flex justify-between mb-3">
                    {Array.from({length: 16}, (_, i) => i + 1).map(tooth => (
                      <div 
                        key={`buccal-${tooth}`} 
                        className={`flex flex-col items-center ${selectedTooth === tooth ? 'bg-amber-100 rounded p-1' : 'p-1'}`}
                        onClick={() => !readOnly && handleToothClick(tooth)}
                      >
                        <div className="text-[10px] font-medium">#{tooth}</div>
                        <ToothSvgBuccal
                          toothNumber={tooth}
                          width={28}
                          height={28}
                          fill={getToothFill(tooth)}
                          stroke={getToothStroke(tooth)}
                          strokeWidth={1}
                          className="cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                  
                  {/* Occlusal View */}
                  <div className="mb-1 text-xs text-center font-medium">Occlusal View</div>
                  <div className="flex justify-between">
                    {Array.from({length: 16}, (_, i) => i + 1).map(tooth => (
                      <div 
                        key={`occlusal-${tooth}`} 
                        className={`flex flex-col items-center ${selectedTooth === tooth ? 'bg-amber-100 rounded p-1' : 'p-1'}`}
                        onClick={() => !readOnly && handleToothClick(tooth)}
                      >
                        <ToothSvgOcclusal
                          toothNumber={tooth}
                          width={28}
                          height={28}
                          fill={getToothFill(tooth)}
                          stroke={getToothStroke(tooth)}
                          strokeWidth={1}
                          className="cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Lower Arch */}
              <div className="relative">
                <div className="flex justify-between mb-1">
                  <span className="text-xs sm:text-sm font-medium">Lower Arch (17-32)</span>
                </div>
                
                <div className="border rounded-md p-2 bg-gray-50">
                  {/* Occlusal View */}
                  <div className="mb-1 text-xs text-center font-medium">Occlusal View</div>
                  <div className="flex justify-between mb-3">
                    {Array.from({length: 16}, (_, i) => i + 17).map(tooth => (
                      <div 
                        key={`occlusal-${tooth}`} 
                        className={`flex flex-col items-center ${selectedTooth === tooth ? 'bg-amber-100 rounded p-1' : 'p-1'}`}
                        onClick={() => !readOnly && handleToothClick(tooth)}
                      >
                        <ToothSvgOcclusal
                          toothNumber={tooth}
                          width={28}
                          height={28}
                          fill={getToothFill(tooth)}
                          stroke={getToothStroke(tooth)}
                          strokeWidth={1}
                          className="cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                  
                  {/* Buccal View */}
                  <div className="mb-1 text-xs text-center font-medium">Buccal View</div>
                  <div className="flex justify-between">
                    {Array.from({length: 16}, (_, i) => i + 17).map(tooth => (
                      <div 
                        key={`buccal-${tooth}`} 
                        className={`flex flex-col items-center ${selectedTooth === tooth ? 'bg-amber-100 rounded p-1' : 'p-1'}`}
                        onClick={() => !readOnly && handleToothClick(tooth)}
                      >
                        <ToothSvgBuccal
                          toothNumber={tooth}
                          width={28}
                          height={28}
                          fill={getToothFill(tooth)}
                          stroke={getToothStroke(tooth)}
                          strokeWidth={1}
                          className="cursor-pointer"
                        />
                        <div className="text-[10px] font-medium">#{tooth}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Log - Conditionally displayed */}
            {showActivityLog && (
              <div className="mt-4 border rounded-md p-2">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium">Activity Log</h3>
                </div>
                
                <ScrollArea className="h-60">
                  {modifications.length === 0 ? (
                    <div className="text-sm text-center py-4 text-muted-foreground">
                      No chart modifications recorded yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {modifications.map(mod => (
                        <div 
                          key={mod.id} 
                          className="text-xs border-b pb-2"
                        >
                          <div className="flex justify-between">
                            <span className="font-medium">
                              Tooth #{mod.toothNumber} | {mod.modificationType}
                              {mod.restorationType ? ` ${mod.restorationType}` : ''}
                            </span>
                            <span>{formatDate(mod.timestamp)}</span>
                          </div>
                          <div>Provider: {mod.provider}</div>
                          {mod.notes && <div>Notes: {mod.notes}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}

            {/* Legend */}
            <div className="border-t pt-4">
              <div className="text-xs sm:text-sm font-medium mb-2">Legend:</div>
              <div className="flex flex-wrap gap-3 justify-center text-xs">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gray-800 mr-1"></div>
                  <span>Amalgam</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gray-200 border border-gray-300 mr-1"></div>
                  <span>Composite</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-400 mr-1"></div>
                  <span>Crown</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-500 mr-1"></div>
                  <span>Bridge</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-purple-600 mr-1"></div>
                  <span>Implant</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 mr-1"></div>
                  <span>Root Canal</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gray-100 border border-gray-300 mr-1"></div>
                  <span>Missing</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Authentication Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Chart Modification</DialogTitle>
            <DialogDescription>
              For HIPAA compliance and audit trail purposes, please confirm your identity with your password.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="provider-password">Password</Label>
              <Input
                id="provider-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              {confirmError && (
                <p className="text-sm text-red-500">{confirmError}</p>
              )}
            </div>
          </div>
          
          <DialogFooter className="sm:justify-between">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsConfirmDialogOpen(false);
                setPendingAction(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={confirmAction}
              className="bg-green-600 hover:bg-green-700"
            >
              <LockKeyhole className="mr-2 h-4 w-4" />
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}