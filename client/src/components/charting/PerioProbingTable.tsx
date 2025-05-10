import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, ArrowLeft } from "lucide-react";

interface PerioData {
  probing: number[]; // [MB, B, DB, ML, L, DL]
  bop: boolean[]; // [MB, B, DB, ML, L, DL]
  mobility: number; // 0-3
  furcation: number; // 0-3
}

interface PerioProbingTableProps {
  perioData: Record<string, PerioData>;
  onUpdate: (
    tooth: string, 
    probing: number[], 
    bop: boolean[], 
    mobility: number, 
    furcation: number
  ) => void;
}

// Tooth numbering follows standard dental notation (1-32)
// Quadrant order: Upper Right (1-8), Upper Left (9-16), Lower Left (17-24), Lower Right (25-32)
const UPPER_RIGHT = Array.from({ length: 8 }, (_, i) => String(i + 1));
const UPPER_LEFT = Array.from({ length: 8 }, (_, i) => String(i + 9));
const LOWER_LEFT = Array.from({ length: 8 }, (_, i) => String(i + 17));
const LOWER_RIGHT = Array.from({ length: 8 }, (_, i) => String(i + 25));

// Probing sites per tooth
const PROBING_SITES = ["MB", "B", "DB", "ML", "L", "DL"];
const BUCCAL_SITES = ["MB", "B", "DB"];
const LINGUAL_SITES = ["ML", "L", "DL"];

export default function PerioProbingTable({ perioData, onUpdate }: PerioProbingTableProps) {
  const [activeQuadrant, setActiveQuadrant] = useState<"UR" | "UL" | "LL" | "LR">("UR");
  const [activeTooth, setActiveTooth] = useState<string>("1");
  const [activeSite, setActiveSite] = useState<string>("MB");

  // Get current quadrant's teeth
  const getQuadrantTeeth = () => {
    switch (activeQuadrant) {
      case "UR": return UPPER_RIGHT;
      case "UL": return UPPER_LEFT;
      case "LL": return LOWER_LEFT;
      case "LR": return LOWER_RIGHT;
    }
  };

  // Move to next site or tooth
  const moveToNextSite = () => {
    const currentSiteIndex = PROBING_SITES.indexOf(activeSite);
    if (currentSiteIndex < PROBING_SITES.length - 1) {
      // Move to next site on same tooth
      setActiveSite(PROBING_SITES[currentSiteIndex + 1]);
    } else {
      // Move to next tooth
      const currentQuadrantTeeth = getQuadrantTeeth();
      const currentToothIndex = currentQuadrantTeeth.indexOf(activeTooth);
      
      if (currentToothIndex < currentQuadrantTeeth.length - 1) {
        // Move to next tooth in same quadrant
        setActiveTooth(currentQuadrantTeeth[currentToothIndex + 1]);
        setActiveSite(PROBING_SITES[0]); // Reset to first site
      } else {
        // Move to next quadrant
        if (activeQuadrant === "UR") {
          setActiveQuadrant("UL");
          setActiveTooth("9");
        } else if (activeQuadrant === "UL") {
          setActiveQuadrant("LL");
          setActiveTooth("17");
        } else if (activeQuadrant === "LL") {
          setActiveQuadrant("LR");
          setActiveTooth("25");
        }
        setActiveSite(PROBING_SITES[0]); // Reset to first site
      }
    }
  };

  // Move to previous site or tooth
  const moveToPrevSite = () => {
    const currentSiteIndex = PROBING_SITES.indexOf(activeSite);
    if (currentSiteIndex > 0) {
      // Move to previous site on same tooth
      setActiveSite(PROBING_SITES[currentSiteIndex - 1]);
    } else {
      // Move to previous tooth
      const currentQuadrantTeeth = getQuadrantTeeth();
      const currentToothIndex = currentQuadrantTeeth.indexOf(activeTooth);
      
      if (currentToothIndex > 0) {
        // Move to previous tooth in same quadrant
        setActiveTooth(currentQuadrantTeeth[currentToothIndex - 1]);
        setActiveSite(PROBING_SITES[PROBING_SITES.length - 1]); // Set to last site
      } else {
        // Move to previous quadrant
        if (activeQuadrant === "UL") {
          setActiveQuadrant("UR");
          setActiveTooth("8");
        } else if (activeQuadrant === "LL") {
          setActiveQuadrant("UL");
          setActiveTooth("16");
        } else if (activeQuadrant === "LR") {
          setActiveQuadrant("LL");
          setActiveTooth("24");
        }
        setActiveSite(PROBING_SITES[PROBING_SITES.length - 1]); // Set to last site
      }
    }
  };

  // Handle probing depth input
  const handleProbingInput = (tooth: string, siteIndex: number, value: string) => {
    const numericValue = value === "" ? 0 : parseInt(value, 10);
    if (isNaN(numericValue) || numericValue < 0 || numericValue > 15) return;

    const currentProbing = perioData[tooth]?.probing || [0, 0, 0, 0, 0, 0];
    const updatedProbing = [...currentProbing];
    updatedProbing[siteIndex] = numericValue;

    onUpdate(
      tooth,
      updatedProbing,
      perioData[tooth]?.bop || [false, false, false, false, false, false],
      perioData[tooth]?.mobility || 0,
      perioData[tooth]?.furcation || 0
    );

    // Automatically move to next site after input
    if (value !== "") {
      moveToNextSite();
    }
  };

  // Handle bleeding on probing toggle
  const handleBOPToggle = (tooth: string, siteIndex: number, checked: boolean) => {
    const currentBOP = perioData[tooth]?.bop || [false, false, false, false, false, false];
    const updatedBOP = [...currentBOP];
    updatedBOP[siteIndex] = checked;

    onUpdate(
      tooth,
      perioData[tooth]?.probing || [0, 0, 0, 0, 0, 0],
      updatedBOP,
      perioData[tooth]?.mobility || 0,
      perioData[tooth]?.furcation || 0
    );
  };

  // Handle mobility input
  const handleMobilityChange = (tooth: string, value: string) => {
    const mobilityValue = parseInt(value, 10);
    
    onUpdate(
      tooth,
      perioData[tooth]?.probing || [0, 0, 0, 0, 0, 0],
      perioData[tooth]?.bop || [false, false, false, false, false, false],
      mobilityValue,
      perioData[tooth]?.furcation || 0
    );
  };

  // Handle furcation input
  const handleFurcationChange = (tooth: string, value: string) => {
    const furcationValue = parseInt(value, 10);
    
    onUpdate(
      tooth,
      perioData[tooth]?.probing || [0, 0, 0, 0, 0, 0],
      perioData[tooth]?.bop || [false, false, false, false, false, false],
      perioData[tooth]?.mobility || 0,
      furcationValue
    );
  };

  // Render the current quadrant's teeth
  const renderQuadrantTable = () => {
    const teeth = getQuadrantTeeth();
    
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Tooth</TableHead>
            {PROBING_SITES.map(site => (
              <TableHead key={site} className="text-center w-12">{site}</TableHead>
            ))}
            <TableHead className="text-center">Mobility</TableHead>
            <TableHead className="text-center">Furcation</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teeth.map(tooth => (
            <TableRow 
              key={tooth} 
              className={activeTooth === tooth ? "bg-secondary/20" : ""}
            >
              <TableCell className="font-medium text-center">#{tooth}</TableCell>
              
              {PROBING_SITES.map((site, index) => (
                <TableCell key={site} className="p-1">
                  <div className="flex flex-col items-center space-y-1">
                    <Input
                      type="number"
                      min={0}
                      max={15}
                      className={`h-8 w-12 text-center ${activeTooth === tooth && activeSite === site ? 'ring-2 ring-primary' : ''}`}
                      value={perioData[tooth]?.probing?.[index] || ""}
                      onChange={(e) => handleProbingInput(tooth, index, e.target.value)}
                      onFocus={() => {
                        setActiveTooth(tooth);
                        setActiveSite(site);
                      }}
                    />
                    <Checkbox 
                      checked={perioData[tooth]?.bop?.[index] || false} 
                      onCheckedChange={(checked) => handleBOPToggle(tooth, index, checked as boolean)}
                    />
                    <span className="text-xs text-red-500">BOP</span>
                  </div>
                </TableCell>
              ))}
              
              <TableCell>
                <Select 
                  value={String(perioData[tooth]?.mobility || 0)}
                  onValueChange={(value) => handleMobilityChange(tooth, value)}
                >
                  <SelectTrigger className="w-16">
                    <SelectValue placeholder="0" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0</SelectItem>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              
              <TableCell>
                <Select 
                  value={String(perioData[tooth]?.furcation || 0)}
                  onValueChange={(value) => handleFurcationChange(tooth, value)}
                >
                  <SelectTrigger className="w-16">
                    <SelectValue placeholder="0" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0</SelectItem>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  // Calculate statistics
  const calculateStatistics = () => {
    let totalSites = 0;
    let bleedingSites = 0;
    let pocketSum = 0;
    let pocketCount = 0;
    let pocketsOver4mm = 0;
    let pocketsOver6mm = 0;
    
    Object.entries(perioData).forEach(([_, data]) => {
      // Count bleeding sites
      data.bop.forEach((bleeding, index) => {
        totalSites++;
        if (bleeding) bleedingSites++;
        
        // Count pockets by depth
        const depth = data.probing[index] || 0;
        if (depth > 0) {
          pocketSum += depth;
          pocketCount++;
          
          if (depth >= 4) pocketsOver4mm++;
          if (depth >= 6) pocketsOver6mm++;
        }
      });
    });
    
    const bopPercentage = totalSites > 0 ? Math.round((bleedingSites / totalSites) * 100) : 0;
    const avgPocketDepth = pocketCount > 0 ? (pocketSum / pocketCount).toFixed(1) : "0.0";
    
    return {
      bopPercentage,
      avgPocketDepth,
      pocketsOver4mm,
      pocketsOver6mm
    };
  };

  const stats = calculateStatistics();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Periodontal Charting</h3>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setActiveQuadrant("UR")}
            className={activeQuadrant === "UR" ? "bg-primary text-primary-foreground" : ""}
          >
            UR (1-8)
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setActiveQuadrant("UL")}
            className={activeQuadrant === "UL" ? "bg-primary text-primary-foreground" : ""}
          >
            UL (9-16)
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setActiveQuadrant("LL")}
            className={activeQuadrant === "LL" ? "bg-primary text-primary-foreground" : ""}
          >
            LL (17-24)
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setActiveQuadrant("LR")}
            className={activeQuadrant === "LR" ? "bg-primary text-primary-foreground" : ""}
          >
            LR (25-32)
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Navigation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={moveToPrevSite}
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Prev Site
              </Button>
              
              <div className="text-sm">
                Current: Tooth #{activeTooth}, Site {activeSite}
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={moveToNextSite}
              >
                Next Site <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Perio Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>BOP: <span className="font-bold">{stats.bopPercentage}%</span></div>
              <div>Avg Depth: <span className="font-bold">{stats.avgPocketDepth}mm</span></div>
              <div>≥4mm pockets: <span className="font-bold">{stats.pocketsOver4mm}</span></div>
              <div>≥6mm pockets: <span className="font-bold">{stats.pocketsOver6mm}</span></div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="border rounded-md">
        {renderQuadrantTable()}
      </div>
      
      <div className="text-sm text-gray-500">
        <p>* Enter probing values in millimeters (0-15). Press Enter or Tab to automatically move to the next site.</p>
        <p>* Check the box under each site to mark Bleeding on Probing (BOP).</p>
        <p>* Mobility and Furcation values range from 0 (none) to 3 (severe).</p>
      </div>
    </div>
  );
}