import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface PeriodontalInputProps {
  toothNumber: number;
  onUpdate: (toothNumber: number, data: ToothPerioData) => void;
  initialData?: ToothPerioData;
  readOnly?: boolean;
}

export interface ToothPerioData {
  pocketDepths: {
    facial: [number, number, number]; // [Mesial, Mid, Distal]
    lingual: [number, number, number]; // [Mesial, Mid, Distal]
  };
  bleeding: {
    facial: [boolean, boolean, boolean];
    lingual: [boolean, boolean, boolean];
  };
  mobility: number; // 0-3
  furcation: [number, number, number, number]; // Each value 0-3 (mesio-facial, disto-facial, mesio-lingual, disto-lingual)
  recession: {
    facial: [number, number, number];
    lingual: [number, number, number];
  };
}

// Initial data for a tooth
const initialToothData: ToothPerioData = {
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

export const PeriodontalInput: React.FC<PeriodontalInputProps> = ({ 
  toothNumber, 
  onUpdate,
  initialData,
  readOnly = false
}) => {
  // Initialize with provided data or defaults
  const [toothData, setToothData] = useState<ToothPerioData>(initialData || initialToothData);
  
  // Update parent when tooth data changes
  useEffect(() => {
    onUpdate(toothNumber, toothData);
  }, [toothData, toothNumber, onUpdate]);
  
  // Helper to update nested state
  const updateToothData = (key: keyof ToothPerioData, value: any) => {
    setToothData(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Handle pocket depth input changes with validation
  const handlePocketDepthChange = (
    surface: 'facial' | 'lingual',
    position: 0 | 1 | 2, // 0=Mesial, 1=Mid, 2=Distal
    value: string
  ) => {
    // Validate input (empty or number)
    const numValue = value === '' ? 0 : parseInt(value);
    
    if (isNaN(numValue) || numValue < 0 || numValue > 15) {
      return; // Invalid input
    }
    
    setToothData(prev => {
      const updatedPocketDepths = {
        ...prev.pocketDepths,
        [surface]: [...prev.pocketDepths[surface]] as [number, number, number]
      };
      
      updatedPocketDepths[surface][position] = numValue;
      
      return {
        ...prev,
        pocketDepths: updatedPocketDepths
      };
    });
  };
  
  // Handle recession input changes
  const handleRecessionChange = (
    surface: 'facial' | 'lingual',
    position: 0 | 1 | 2, // 0=Mesial, 1=Mid, 2=Distal
    value: string
  ) => {
    // Validate input (empty or number)
    const numValue = value === '' ? 0 : parseInt(value);
    
    if (isNaN(numValue) || numValue < 0 || numValue > 10) {
      return; // Invalid input
    }
    
    setToothData(prev => {
      const updatedRecession = {
        ...prev.recession,
        [surface]: [...prev.recession[surface]] as [number, number, number]
      };
      
      updatedRecession[surface][position] = numValue;
      
      return {
        ...prev,
        recession: updatedRecession
      };
    });
  };
  
  // Handle bleeding checkbox changes
  const handleBleedingChange = (
    surface: 'facial' | 'lingual',
    position: 0 | 1 | 2,
    checked: boolean
  ) => {
    setToothData(prev => {
      const updatedBleeding = {
        ...prev.bleeding,
        [surface]: [...prev.bleeding[surface]] as [boolean, boolean, boolean]
      };
      
      updatedBleeding[surface][position] = checked;
      
      return {
        ...prev,
        bleeding: updatedBleeding
      };
    });
  };
  
  // Handle mobility select change
  const handleMobilityChange = (value: string) => {
    updateToothData('mobility', parseInt(value));
  };
  
  // Handle furcation select change
  const handleFurcationChange = (position: 0 | 1 | 2 | 3, value: string) => {
    setToothData(prev => {
      const updatedFurcation = [...prev.furcation] as [number, number, number, number];
      updatedFurcation[position] = parseInt(value);
      
      return {
        ...prev,
        furcation: updatedFurcation
      };
    });
  };
  
  // Render the input card for a single tooth
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-md text-center">Tooth #{toothNumber}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Pocket Depths */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Pocket Depths (mm)</Label>
          
          {/* Facial Pocket Depths */}
          <div className="flex flex-row items-center gap-2">
            <Label className="w-14 text-xs">Facial:</Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min="0"
                max="15"
                value={toothData.pocketDepths.facial[0] || ''}
                onChange={(e) => handlePocketDepthChange('facial', 0, e.target.value)}
                className="w-12 h-8 text-center"
                disabled={readOnly}
              />
              <Input
                type="number"
                min="0"
                max="15"
                value={toothData.pocketDepths.facial[1] || ''}
                onChange={(e) => handlePocketDepthChange('facial', 1, e.target.value)}
                className="w-12 h-8 text-center"
                disabled={readOnly}
              />
              <Input
                type="number"
                min="0"
                max="15"
                value={toothData.pocketDepths.facial[2] || ''}
                onChange={(e) => handlePocketDepthChange('facial', 2, e.target.value)}
                className="w-12 h-8 text-center"
                disabled={readOnly}
              />
            </div>
          </div>
          
          {/* Lingual Pocket Depths */}
          <div className="flex flex-row items-center gap-2">
            <Label className="w-14 text-xs">Lingual:</Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min="0"
                max="15"
                value={toothData.pocketDepths.lingual[0] || ''}
                onChange={(e) => handlePocketDepthChange('lingual', 0, e.target.value)}
                className="w-12 h-8 text-center"
                disabled={readOnly}
              />
              <Input
                type="number"
                min="0"
                max="15"
                value={toothData.pocketDepths.lingual[1] || ''}
                onChange={(e) => handlePocketDepthChange('lingual', 1, e.target.value)}
                className="w-12 h-8 text-center"
                disabled={readOnly}
              />
              <Input
                type="number"
                min="0"
                max="15"
                value={toothData.pocketDepths.lingual[2] || ''}
                onChange={(e) => handlePocketDepthChange('lingual', 2, e.target.value)}
                className="w-12 h-8 text-center"
                disabled={readOnly}
              />
            </div>
          </div>
        </div>
        
        <Separator className="my-2" />
        
        {/* Bleeding */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Bleeding</Label>
          
          {/* Facial Bleeding */}
          <div className="flex flex-row items-center gap-2">
            <Label className="w-14 text-xs">Facial:</Label>
            <div className="flex items-center gap-3">
              <Checkbox
                checked={toothData.bleeding.facial[0]}
                onCheckedChange={(checked) => handleBleedingChange('facial', 0, !!checked)}
                disabled={readOnly}
              />
              <Checkbox
                checked={toothData.bleeding.facial[1]}
                onCheckedChange={(checked) => handleBleedingChange('facial', 1, !!checked)}
                disabled={readOnly}
              />
              <Checkbox
                checked={toothData.bleeding.facial[2]}
                onCheckedChange={(checked) => handleBleedingChange('facial', 2, !!checked)}
                disabled={readOnly}
              />
            </div>
          </div>
          
          {/* Lingual Bleeding */}
          <div className="flex flex-row items-center gap-2">
            <Label className="w-14 text-xs">Lingual:</Label>
            <div className="flex items-center gap-3">
              <Checkbox
                checked={toothData.bleeding.lingual[0]}
                onCheckedChange={(checked) => handleBleedingChange('lingual', 0, !!checked)}
                disabled={readOnly}
              />
              <Checkbox
                checked={toothData.bleeding.lingual[1]}
                onCheckedChange={(checked) => handleBleedingChange('lingual', 1, !!checked)}
                disabled={readOnly}
              />
              <Checkbox
                checked={toothData.bleeding.lingual[2]}
                onCheckedChange={(checked) => handleBleedingChange('lingual', 2, !!checked)}
                disabled={readOnly}
              />
            </div>
          </div>
        </div>
        
        <Separator className="my-2" />
        
        {/* Recession */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Recession (mm)</Label>
          
          {/* Facial Recession */}
          <div className="flex flex-row items-center gap-2">
            <Label className="w-14 text-xs">Facial:</Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min="0"
                max="10"
                value={toothData.recession.facial[0] || ''}
                onChange={(e) => handleRecessionChange('facial', 0, e.target.value)}
                className="w-12 h-8 text-center"
                disabled={readOnly}
              />
              <Input
                type="number"
                min="0"
                max="10"
                value={toothData.recession.facial[1] || ''}
                onChange={(e) => handleRecessionChange('facial', 1, e.target.value)}
                className="w-12 h-8 text-center"
                disabled={readOnly}
              />
              <Input
                type="number"
                min="0"
                max="10"
                value={toothData.recession.facial[2] || ''}
                onChange={(e) => handleRecessionChange('facial', 2, e.target.value)}
                className="w-12 h-8 text-center"
                disabled={readOnly}
              />
            </div>
          </div>
          
          {/* Lingual Recession */}
          <div className="flex flex-row items-center gap-2">
            <Label className="w-14 text-xs">Lingual:</Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min="0"
                max="10"
                value={toothData.recession.lingual[0] || ''}
                onChange={(e) => handleRecessionChange('lingual', 0, e.target.value)}
                className="w-12 h-8 text-center"
                disabled={readOnly}
              />
              <Input
                type="number"
                min="0"
                max="10"
                value={toothData.recession.lingual[1] || ''}
                onChange={(e) => handleRecessionChange('lingual', 1, e.target.value)}
                className="w-12 h-8 text-center"
                disabled={readOnly}
              />
              <Input
                type="number"
                min="0"
                max="10"
                value={toothData.recession.lingual[2] || ''}
                onChange={(e) => handleRecessionChange('lingual', 2, e.target.value)}
                className="w-12 h-8 text-center"
                disabled={readOnly}
              />
            </div>
          </div>
        </div>
        
        <Separator className="my-2" />
        
        {/* Mobility */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-semibold">Mobility:</Label>
            <Select
              value={toothData.mobility.toString()}
              onValueChange={handleMobilityChange}
              disabled={readOnly}
            >
              <SelectTrigger className="w-20">
                <SelectValue placeholder="0" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0</SelectItem>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Separator className="my-2" />
        
        {/* Furcation */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Furcation</Label>
          
          <div className="grid grid-cols-2 gap-1">
            {/* Mesio-Facial */}
            <div className="flex items-center gap-1">
              <Label className="text-xs">MF:</Label>
              <Select
                value={toothData.furcation[0].toString()}
                onValueChange={(val) => handleFurcationChange(0, val)}
                disabled={readOnly}
              >
                <SelectTrigger className="w-12 h-7">
                  <SelectValue placeholder="0" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0</SelectItem>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Disto-Facial */}
            <div className="flex items-center gap-1">
              <Label className="text-xs">DF:</Label>
              <Select
                value={toothData.furcation[1].toString()}
                onValueChange={(val) => handleFurcationChange(1, val)}
                disabled={readOnly}
              >
                <SelectTrigger className="w-12 h-7">
                  <SelectValue placeholder="0" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0</SelectItem>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Mesio-Lingual */}
            <div className="flex items-center gap-1">
              <Label className="text-xs">ML:</Label>
              <Select
                value={toothData.furcation[2].toString()}
                onValueChange={(val) => handleFurcationChange(2, val)}
                disabled={readOnly}
              >
                <SelectTrigger className="w-12 h-7">
                  <SelectValue placeholder="0" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0</SelectItem>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Disto-Lingual */}
            <div className="flex items-center gap-1">
              <Label className="text-xs">DL:</Label>
              <Select
                value={toothData.furcation[3].toString()}
                onValueChange={(val) => handleFurcationChange(3, val)}
                disabled={readOnly}
              >
                <SelectTrigger className="w-12 h-7">
                  <SelectValue placeholder="0" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0</SelectItem>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};