import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ToothData {
  toothNumber: number;
  restoration: string;
}

interface ToothChartProps {
  chartData: ToothData[];
  onChange: (toothNumber: number, value: string) => void;
  editable: boolean;
}

// Helper to convert tooth number to FDI notation (EU standard)
const toFDI = (toothNumber: number): string => {
  if (toothNumber <= 8) return `1${toothNumber}`; // Upper Right
  if (toothNumber <= 16) return `2${toothNumber - 8}`; // Upper Left
  if (toothNumber <= 24) return `3${toothNumber - 16}`; // Lower Left
  return `4${toothNumber - 24}`; // Lower Right
};

// Helper to get standard US notation
const toUS = (toothNumber: number): number => {
  // Convert from 1-32 index to US standard notation
  if (toothNumber <= 8) return 9 - toothNumber; // UR (1-8)
  if (toothNumber <= 16) return 17 - toothNumber + 8; // UL (9-16)
  if (toothNumber <= 24) return toothNumber + 8; // LL (17-24)
  return toothNumber; // LR (25-32)
};

// Restoration options
const restorationOptions = [
  { value: '', label: 'None' },
  { value: 'Filling', label: 'Filling' },
  { value: 'Crown', label: 'Crown' },
  { value: 'RCT', label: 'Root Canal' },
  { value: 'Post/Core', label: 'Post & Core' },
  { value: 'Bridge', label: 'Bridge' },
  { value: 'Implant', label: 'Implant' },
  { value: 'Missing', label: 'Missing' },
  { value: 'Extraction', label: 'Extraction' },
  { value: 'Veneer', label: 'Veneer' },
  { value: 'Sealant', label: 'Sealant' },
];

// Color coding for different restorations
const getToothColor = (restoration: string): string => {
  switch (restoration) {
    case 'Filling': return 'bg-blue-200 border-blue-400';
    case 'Crown': return 'bg-yellow-200 border-yellow-400';
    case 'RCT': return 'bg-red-200 border-red-400';
    case 'Post/Core': return 'bg-orange-200 border-orange-400';
    case 'Bridge': return 'bg-purple-200 border-purple-400';
    case 'Implant': return 'bg-emerald-200 border-emerald-400';
    case 'Missing': return 'bg-gray-300 border-gray-500';
    case 'Extraction': return 'bg-gray-200 border-gray-400 opacity-50';
    case 'Veneer': return 'bg-pink-200 border-pink-400';
    case 'Sealant': return 'bg-teal-200 border-teal-400';
    default: return 'bg-white border-gray-300';
  }
};

export const ToothChart: React.FC<ToothChartProps> = ({ chartData, onChange, editable }) => {
  const renderToothRow = (start: number, end: number) => {
    return (
      <div className="flex justify-center space-x-2 my-2">
        {Array.from({ length: end - start + 1 }, (_, i) => {
          const toothNumber = start + i;
          const tooth = chartData.find(t => t.toothNumber === toothNumber) || { toothNumber, restoration: '' };
          const toothColor = getToothColor(tooth.restoration);
          
          return (
            <TooltipProvider key={toothNumber}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center">
                    <div 
                      className={`w-12 h-12 border-2 rounded flex items-center justify-center ${toothColor} cursor-pointer`}
                      onClick={() => editable && onChange(toothNumber, '')} // Reset when clicking directly on tooth
                    >
                      <span className="text-xs font-semibold">{toUS(toothNumber)}</span>
                    </div>
                    {editable ? (
                      <Select
                        value={tooth.restoration}
                        onValueChange={(value) => onChange(toothNumber, value)}
                      >
                        <SelectTrigger className="w-20 h-8 mt-1 text-xs">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {restorationOptions.map(option => (
                            <SelectItem key={option.value} value={option.value} className="text-xs">
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-xs mt-1 w-20 text-center">
                        {tooth.restoration || 'None'}
                      </span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Tooth #{toUS(toothNumber)} (FDI: {toFDI(toothNumber)})</p>
                  <p>Status: {tooth.restoration || 'No treatment'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    );
  };

  return (
    <div className="tooth-chart p-4 bg-white rounded-lg border">
      <div className="text-center mb-2 font-medium">Upper Teeth</div>
      {renderToothRow(1, 8)} {/* Upper Right (1-8) */}
      {renderToothRow(9, 16)} {/* Upper Left (9-16) */}
      
      <div className="border-t border-b border-gray-300 my-4"></div>
      
      {renderToothRow(17, 24)} {/* Lower Left (17-24) */}
      {renderToothRow(25, 32)} {/* Lower Right (25-32) */}
      <div className="text-center mt-2 font-medium">Lower Teeth</div>
      
      <div className="mt-6 flex flex-wrap gap-2 justify-center">
        {restorationOptions.filter(o => o.value).map(option => (
          <div key={option.value} className="flex items-center gap-1">
            <div className={`w-4 h-4 ${getToothColor(option.value)} border rounded`}></div>
            <span className="text-xs">{option.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};