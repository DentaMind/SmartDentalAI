import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Define tooth numbers in dental notation (1-32)
const TOOTH_NUMBERS = [
  "1", "2", "3", "4", "5", "6", "7", "8",
  "9", "10", "11", "12", "13", "14", "15", "16",
  "17", "18", "19", "20", "21", "22", "23", "24",
  "25", "26", "27", "28", "29", "30", "31", "32",
];

// Define tooth surfaces
const SURFACES = ["M", "O", "D", "B", "L"];

// Define common dental procedures
const PROCEDURES = [
  "Filling", 
  "Crown", 
  "Bridge", 
  "Implant", 
  "RCT", 
  "Post & Core", 
  "Extraction",
  "Missing"
];

interface RestorativeToothChartProps {
  selectedTooth: string | null;
  onSelectTooth: (tooth: string) => void;
  chartData: Record<string, { surfaces: string[]; procedures: string[] }>;
  onSurfaceClick: (tooth: string, surface: string) => void;
  onProcedureClick: (tooth: string, procedure: string) => void;
}

export default function RestorativeToothChart({
  selectedTooth,
  onSelectTooth,
  chartData,
  onSurfaceClick,
  onProcedureClick,
}: RestorativeToothChartProps) {
  // Helper to render the upper and lower arches
  const renderArch = (start: number, end: number) => {
    const teeth = TOOTH_NUMBERS.slice(start, end);
    return (
      <div className="grid grid-cols-8 gap-1 mb-4">
        {teeth.map((tooth) => {
          const isSelected = selectedTooth === tooth;
          const hasAnyProcedure = chartData[tooth]?.procedures?.length > 0;
          const hasSurfaces = chartData[tooth]?.surfaces?.length > 0;
          
          return (
            <Button
              key={tooth}
              variant={isSelected ? "secondary" : hasAnyProcedure || hasSurfaces ? "default" : "outline"}
              onClick={() => onSelectTooth(tooth)}
              className={cn(
                "p-1 h-auto flex flex-col items-center",
                isSelected && "ring-2 ring-primary",
                hasAnyProcedure && !isSelected && "bg-blue-100 text-blue-900",
                hasSurfaces && !hasAnyProcedure && !isSelected && "bg-green-100 text-green-900"
              )}
            >
              <span className="text-xs font-bold mb-1">{tooth}</span>
              
              {/* Visual representation of tooth surfaces */}
              <div className="grid grid-cols-3 gap-px bg-gray-200 w-full p-0.5">
                <div className={cn("h-2 w-full", chartData[tooth]?.surfaces?.includes("B") ? "bg-green-500" : "bg-white")}></div>
                <div className={cn("h-2 w-full", chartData[tooth]?.surfaces?.includes("O") ? "bg-green-500" : "bg-white")}></div>
                <div className={cn("h-2 w-full", chartData[tooth]?.surfaces?.includes("L") ? "bg-green-500" : "bg-white")}></div>
                <div className={cn("h-2 w-full", chartData[tooth]?.surfaces?.includes("M") ? "bg-green-500" : "bg-white")}></div>
                <div className="h-2 w-full bg-gray-400"></div>
                <div className={cn("h-2 w-full", chartData[tooth]?.surfaces?.includes("D") ? "bg-green-500" : "bg-white")}></div>
              </div>
              
              {/* Icons for procedures */}
              {chartData[tooth]?.procedures?.includes("Crown") && (
                <span className="text-yellow-500 mt-1">👑</span>
              )}
              {chartData[tooth]?.procedures?.includes("RCT") && (
                <span className="text-red-500 mt-1">⚡</span>
              )}
              {chartData[tooth]?.procedures?.includes("Missing") && (
                <span className="text-gray-500 mt-1">✕</span>
              )}
            </Button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Restorative Charting</h3>
      
      {/* Upper Arch (1-16) */}
      <div className="border-b pb-4">
        <div className="text-sm font-medium mb-2 text-center">Upper Arch</div>
        {renderArch(0, 16)}
      </div>
      
      {/* Lower Arch (17-32) */}
      <div>
        <div className="text-sm font-medium mb-2 text-center">Lower Arch</div>
        {renderArch(16, 32)}
      </div>
      
      {/* Selected tooth details */}
      {selectedTooth && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Surface selection */}
              <div>
                <h4 className="font-semibold mb-3">Surfaces for Tooth #{selectedTooth}</h4>
                <div className="flex flex-wrap gap-2">
                  {SURFACES.map((surface) => (
                    <Button
                      key={surface}
                      variant={chartData[selectedTooth]?.surfaces?.includes(surface) ? "default" : "outline"}
                      onClick={() => onSurfaceClick(selectedTooth, surface)}
                      size="sm"
                    >
                      {surface}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Procedure selection */}
              <div>
                <h4 className="font-semibold mb-3">Procedures</h4>
                <div className="flex flex-wrap gap-2">
                  {PROCEDURES.map((procedure) => (
                    <Button
                      key={procedure}
                      variant={chartData[selectedTooth]?.procedures?.includes(procedure) ? "default" : "outline"}
                      onClick={() => onProcedureClick(selectedTooth, procedure)}
                      size="sm"
                    >
                      {procedure}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Legend */}
      <div className="text-sm text-gray-500 mt-4">
        <p>* Select a tooth to chart surfaces or procedures</p>
        <p>* Surfaces: M (Mesial), O (Occlusal), D (Distal), B (Buccal), L (Lingual)</p>
        <p>* Green highlight indicates surface treatment</p>
        <p>* Blue highlight indicates procedure performed</p>
      </div>
    </div>
  );
}