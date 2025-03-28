import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Edit, 
  AlertCircle, 
  FileCheck, 
  Check, 
  ClipboardCheck,
  Trash2,
  Plus,
  PenLine,
  DollarSign
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";

interface PatientTreatmentEditorProps {
  patientId: string;
}

interface TreatmentProcedure {
  code: string;
  description: string;
  fee: number;
  tooth?: string;
  surface?: string;
  quadrant?: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
}

interface StructuredTreatmentPlan {
  proceduresList: TreatmentProcedure[];
  estimatedTotalCost: number;
  appointmentsRequired: number;
  insuranceEstimate?: number;
  patientResponsibility?: number;
  urgency: 'urgent' | 'high' | 'normal' | 'low';
  complexity: 'simple' | 'moderate' | 'complex';
  notes: string;
  doctorEdited: boolean;
}

export default function PatientTreatmentEditor({ patientId }: PatientTreatmentEditorProps) {
  const [planText, setPlanText] = useState<string>("");
  const [confidence, setConfidence] = useState<number>(0);
  const [reasoning, setReasoning] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showStructuredView, setShowStructuredView] = useState<boolean>(true);
  const [structuredPlan, setStructuredPlan] = useState<StructuredTreatmentPlan>({
    proceduresList: [],
    estimatedTotalCost: 0,
    appointmentsRequired: 1,
    insuranceEstimate: 0,
    patientResponsibility: 0,
    urgency: 'normal',
    complexity: 'moderate',
    notes: '',
    doctorEdited: false
  });
  const [currentStatus, setCurrentStatus] = useState<string>("draft");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchTreatmentPlan = async () => {
      try {
        setLoading(true);
        setLoadingError(null);
        
        const response = await axios.get(`/api/treatment-plan/${patientId}`);
        const data = response.data;
        
        if (data) {
          setPlanText(data.planText || "");
          setConfidence(data.confidence || 0);
          setReasoning(data.reasoning || "");
          setCurrentStatus(data.status || "draft");
          
          // Parse structured plan if available
          if (data.structuredPlan) {
            try {
              const parsedPlan = JSON.parse(data.structuredPlan);
              setStructuredPlan(parsedPlan);
            } catch (e) {
              console.error("Error parsing structured plan:", e);
              createStructuredPlanFromText(data.planText);
            }
          } else {
            createStructuredPlanFromText(data.planText);
          }
        } else {
          setLoadingError("No treatment plan data available.");
        }
      } catch (error) {
        console.error("Error fetching treatment plan:", error);
        setLoadingError("Failed to fetch treatment plan data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchTreatmentPlan();
    }
  }, [patientId]);

  // This function attempts to parse the text plan into a structured format
  // In a real implementation, this would use AI to extract the structured data
  const createStructuredPlanFromText = (text: string) => {
    // Simple example implementation - in practice this would be more sophisticated
    // and likely use AI to extract the data from the text
    
    const newPlan: StructuredTreatmentPlan = {
      proceduresList: [],
      estimatedTotalCost: 0,
      appointmentsRequired: 1,
      insuranceEstimate: 0,
      patientResponsibility: 0,
      urgency: 'normal',
      complexity: 'moderate',
      notes: text,
      doctorEdited: false
    };
    
    // Extract any prices mentioned in the text (simple regex)
    const priceMatch = text.match(/\$(\d+,?\d*\.?\d*)/g);
    if (priceMatch && priceMatch.length > 0) {
      // Use the first price found as the estimated total
      const priceString = priceMatch[0].replace('$', '').replace(',', '');
      newPlan.estimatedTotalCost = parseFloat(priceString) || 0;
    }
    
    // Extract appointments required (simple regex)
    const appointmentsMatch = text.match(/(\d+)\s+appointment/i);
    if (appointmentsMatch && appointmentsMatch.length > 1) {
      newPlan.appointmentsRequired = parseInt(appointmentsMatch[1]) || 1;
    }
    
    // Extract priority/urgency keywords
    if (text.toLowerCase().includes('urgent') || text.toLowerCase().includes('emergency')) {
      newPlan.urgency = 'urgent';
    } else if (text.toLowerCase().includes('high priority')) {
      newPlan.urgency = 'high';
    }
    
    // Extract complexity keywords
    if (text.toLowerCase().includes('complex') || text.toLowerCase().includes('difficult')) {
      newPlan.complexity = 'complex';
    } else if (text.toLowerCase().includes('simple') || text.toLowerCase().includes('easy')) {
      newPlan.complexity = 'simple';
    }
    
    // Calculate patient responsibility
    newPlan.patientResponsibility = newPlan.estimatedTotalCost - (newPlan.insuranceEstimate || 0);
    
    // Try to extract procedures using a simple line-by-line approach
    const lines = text.split('\n');
    for (const line of lines) {
      // Look for patterns like "D2140 - Amalgam filling: $120"
      const procedureMatch = line.match(/([A-Z]\d{4})\s*-?\s*([^:$]+)(?:[:\s]+\$?(\d+))?/);
      
      if (procedureMatch) {
        const code = procedureMatch[1];
        const description = procedureMatch[2].trim();
        const fee = procedureMatch[3] ? parseFloat(procedureMatch[3]) : 0;
        
        // Extract tooth numbers if present
        const toothMatch = line.match(/tooth\s+#?(\d+)/i);
        const tooth = toothMatch ? toothMatch[1] : undefined;
        
        // Extract surface if present
        const surfaceMatch = line.match(/surface[s]?:?\s+([MODFLBO]+)/i);
        const surface = surfaceMatch ? surfaceMatch[1] : undefined;
        
        newPlan.proceduresList.push({
          code,
          description,
          fee,
          tooth,
          surface,
          priority: newPlan.urgency
        });
        
        // Add to total cost if not already calculated
        if (newPlan.estimatedTotalCost === 0) {
          newPlan.estimatedTotalCost += fee;
        }
      }
    }
    
    setStructuredPlan(newPlan);
  };

  const handleAddProcedure = () => {
    const newProcedure: TreatmentProcedure = {
      code: "",
      description: "",
      fee: 0,
      priority: 'normal'
    };
    
    setStructuredPlan({
      ...structuredPlan,
      proceduresList: [...structuredPlan.proceduresList, newProcedure],
      doctorEdited: true
    });
  };

  const handleRemoveProcedure = (index: number) => {
    const updatedProcedures = [...structuredPlan.proceduresList];
    updatedProcedures.splice(index, 1);
    
    const newTotalCost = updatedProcedures.reduce((total, proc) => total + proc.fee, 0);
    const newPatientResponsibility = newTotalCost - (structuredPlan.insuranceEstimate || 0);
    
    setStructuredPlan({
      ...structuredPlan,
      proceduresList: updatedProcedures,
      estimatedTotalCost: newTotalCost,
      patientResponsibility: newPatientResponsibility,
      doctorEdited: true
    });
  };

  const handleProcedureChange = (index: number, field: keyof TreatmentProcedure, value: any) => {
    const updatedProcedures = [...structuredPlan.proceduresList];
    updatedProcedures[index] = {
      ...updatedProcedures[index],
      [field]: value
    };
    
    // Recalculate total cost if fee changes
    let newTotalCost = structuredPlan.estimatedTotalCost;
    if (field === 'fee') {
      newTotalCost = updatedProcedures.reduce((total, proc) => total + proc.fee, 0);
    }
    
    const newPatientResponsibility = newTotalCost - (structuredPlan.insuranceEstimate || 0);
    
    setStructuredPlan({
      ...structuredPlan,
      proceduresList: updatedProcedures,
      estimatedTotalCost: newTotalCost,
      patientResponsibility: newPatientResponsibility,
      doctorEdited: true
    });
  };

  const handlePlanMetadataChange = (field: keyof StructuredTreatmentPlan, value: any) => {
    const updates: Partial<StructuredTreatmentPlan> = {
      [field]: value,
      doctorEdited: true
    };
    
    // Handle special cases
    if (field === 'estimatedTotalCost') {
      updates.patientResponsibility = value - (structuredPlan.insuranceEstimate || 0);
    } else if (field === 'insuranceEstimate') {
      updates.patientResponsibility = structuredPlan.estimatedTotalCost - value;
    }
    
    setStructuredPlan({
      ...structuredPlan,
      ...updates
    });
  };

  const approveTreatmentPlan = async () => {
    try {
      setSubmitting(true);
      
      // Create a textual representation of the structured plan
      let finalPlanText = planText;
      
      // If doctor edited the plan, update the text representation
      if (structuredPlan.doctorEdited) {
        finalPlanText = `# Treatment Plan\n\n`;
        
        // Add plan metadata
        finalPlanText += `## Overview\n`;
        finalPlanText += `Urgency: ${structuredPlan.urgency}\n`;
        finalPlanText += `Complexity: ${structuredPlan.complexity}\n`;
        finalPlanText += `Appointments Required: ${structuredPlan.appointmentsRequired}\n`;
        finalPlanText += `Estimated Total Cost: $${structuredPlan.estimatedTotalCost.toFixed(2)}\n`;
        
        if (structuredPlan.insuranceEstimate && structuredPlan.insuranceEstimate > 0) {
          finalPlanText += `Estimated Insurance Coverage: $${structuredPlan.insuranceEstimate.toFixed(2)}\n`;
          finalPlanText += `Patient Responsibility: $${structuredPlan.patientResponsibility?.toFixed(2)}\n`;
        }
        
        // Add procedures
        finalPlanText += `\n## Recommended Procedures\n`;
        
        structuredPlan.proceduresList.forEach((proc, i) => {
          finalPlanText += `${i+1}. ${proc.code} - ${proc.description}: $${proc.fee.toFixed(2)}\n`;
          
          if (proc.tooth) {
            finalPlanText += `   Tooth: #${proc.tooth}\n`;
          }
          
          if (proc.surface) {
            finalPlanText += `   Surface: ${proc.surface}\n`;
          }
          
          if (proc.quadrant) {
            finalPlanText += `   Quadrant: ${proc.quadrant}\n`;
          }
          
          if (proc.priority && proc.priority !== 'normal') {
            finalPlanText += `   Priority: ${proc.priority}\n`;
          }
          
          finalPlanText += `\n`;
        });
        
        // Add notes
        if (structuredPlan.notes) {
          finalPlanText += `\n## Notes\n${structuredPlan.notes}\n`;
        }
        
        // Add doctor edited note
        finalPlanText += `\n(This treatment plan has been edited and approved by the provider.)\n`;
      }
      
      // Prepare the structured plan JSON
      const structuredPlanJson = JSON.stringify(structuredPlan);
      
      const payload = {
        finalPlan: finalPlanText,
        structuredPlan: structuredPlanJson,
        providerId: 1, // This should be the actual logged-in provider ID
      };
      
      const response = await axios.post(`/api/treatment-plan/${patientId}/approve`, payload);
      
      if (response.data.success) {
        toast({
          title: "Treatment Plan Approved",
          description: "The treatment plan has been approved and saved to the patient's record.",
          variant: "default"
        });
        
        // Invalidate relevant queries to refresh data
        queryClient.invalidateQueries({
          queryKey: [`/api/treatment-plan/history/${patientId}`]
        });
        
        // Update local state
        setCurrentStatus("accepted");
        setIsEditing(false);
      } else {
        throw new Error(response.data.error || "Unknown error");
      }
    } catch (error) {
      console.error("Error approving treatment plan:", error);
      toast({
        variant: "destructive",
        title: "Approval Error",
        description: "Failed to approve treatment plan. Please try again."
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-green-600";
    if (confidence >= 75) return "text-emerald-600";
    if (confidence >= 60) return "text-amber-600";
    return "text-red-600";
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'urgent': return "text-red-600";
      case 'high': return "text-amber-600";
      case 'normal': return "text-slate-600";
      case 'low': return "text-slate-400";
      default: return "text-slate-600";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Treatment Plan Editor</h2>
          <p className="text-muted-foreground">Review, edit, and approve AI-generated treatment plans</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <LoadingSpinner className="h-8 w-8 text-primary" />
          <p className="mt-4 text-muted-foreground">Loading treatment plan data...</p>
        </div>
      ) : loadingError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{loadingError}</AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          <Card className={`border-l-4 ${currentStatus === "accepted" ? "border-l-green-500" : "border-l-primary"}`}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="flex items-center gap-2">
                  {currentStatus === "accepted" ? (
                    <FileCheck className="h-5 w-5 text-green-500" />
                  ) : (
                    <PenLine className="h-5 w-5 text-primary" />
                  )}
                  {currentStatus === "accepted" ? "Approved Treatment Plan" : "Treatment Plan (Draft)"}
                </CardTitle>
                <div className="flex gap-2">
                  {currentStatus !== "accepted" && (
                    <Badge 
                      className={getConfidenceColor(confidence)}
                      variant="outline"
                    >
                      {confidence}% Confidence
                    </Badge>
                  )}
                  <Badge variant="outline">
                    {currentStatus === "accepted" ? "Approved" : "Draft"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* View Selector */}
                <div className="flex justify-end mb-2">
                  <div className="inline-flex rounded-md shadow-sm" role="group">
                    <Button
                      variant={showStructuredView ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowStructuredView(true)}
                      className="rounded-r-none"
                    >
                      Structured View
                    </Button>
                    <Button
                      variant={!showStructuredView ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowStructuredView(false)}
                      className="rounded-l-none"
                    >
                      Text View
                    </Button>
                  </div>
                </div>
                
                {showStructuredView ? (
                  <div className="space-y-6">
                    {/* Tabs for structured plan sections */}
                    <Tabs defaultValue="procedures" className="w-full">
                      <TabsList className="mb-4">
                        <TabsTrigger value="procedures">Procedures</TabsTrigger>
                        <TabsTrigger value="financials">Financials</TabsTrigger>
                        <TabsTrigger value="details">Plan Details</TabsTrigger>
                      </TabsList>
                      
                      {/* Procedures Tab */}
                      <TabsContent value="procedures" className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-medium">Recommended Procedures</h3>
                          {isEditing && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleAddProcedure}
                              className="flex items-center gap-1"
                            >
                              <Plus className="h-4 w-4" /> Add Procedure
                            </Button>
                          )}
                        </div>
                        
                        <div className="border rounded-md">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Tooth/Area</TableHead>
                                <TableHead>Fee</TableHead>
                                <TableHead>Priority</TableHead>
                                {isEditing && <TableHead></TableHead>}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {structuredPlan.proceduresList.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={isEditing ? 6 : 5} className="text-center text-muted-foreground py-4">
                                    No procedures specified
                                  </TableCell>
                                </TableRow>
                              ) : (
                                structuredPlan.proceduresList.map((procedure, index) => (
                                  <TableRow key={index}>
                                    <TableCell>
                                      {isEditing ? (
                                        <Input
                                          value={procedure.code}
                                          onChange={(e) => handleProcedureChange(index, 'code', e.target.value)}
                                          className="w-24"
                                        />
                                      ) : (
                                        procedure.code
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {isEditing ? (
                                        <Input
                                          value={procedure.description}
                                          onChange={(e) => handleProcedureChange(index, 'description', e.target.value)}
                                        />
                                      ) : (
                                        procedure.description
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {isEditing ? (
                                        <div className="flex gap-2">
                                          <Input
                                            placeholder="Tooth #"
                                            value={procedure.tooth || ''}
                                            onChange={(e) => handleProcedureChange(index, 'tooth', e.target.value)}
                                            className="w-20"
                                          />
                                          <Input
                                            placeholder="Surface"
                                            value={procedure.surface || ''}
                                            onChange={(e) => handleProcedureChange(index, 'surface', e.target.value)}
                                            className="w-20"
                                          />
                                        </div>
                                      ) : (
                                        <div>
                                          {procedure.tooth && <span>Tooth #{procedure.tooth}</span>}
                                          {procedure.surface && <span> ({procedure.surface})</span>}
                                          {procedure.quadrant && <span> Quad: {procedure.quadrant}</span>}
                                          {!procedure.tooth && !procedure.surface && !procedure.quadrant && "-"}
                                        </div>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {isEditing ? (
                                        <div className="relative">
                                          <DollarSign className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
                                          <Input
                                            type="number"
                                            value={procedure.fee}
                                            onChange={(e) => handleProcedureChange(index, 'fee', parseFloat(e.target.value))}
                                            className="pl-7 w-24"
                                          />
                                        </div>
                                      ) : (
                                        `$${procedure.fee.toFixed(2)}`
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {isEditing ? (
                                        <Select
                                          value={procedure.priority}
                                          onValueChange={(value) => handleProcedureChange(index, 'priority', value as any)}
                                        >
                                          <SelectTrigger className="w-24">
                                            <SelectValue placeholder="Priority" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="urgent">Urgent</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="normal">Normal</SelectItem>
                                            <SelectItem value="low">Low</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      ) : (
                                        <Badge
                                          variant="outline"
                                          className={getPriorityColor(procedure.priority)}
                                        >
                                          {procedure.priority}
                                        </Badge>
                                      )}
                                    </TableCell>
                                    {isEditing && (
                                      <TableCell>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleRemoveProcedure(index)}
                                        >
                                          <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                      </TableCell>
                                    )}
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </TabsContent>
                      
                      {/* Financials Tab */}
                      <TabsContent value="financials">
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="totalCost">Total Estimated Cost</Label>
                              {isEditing ? (
                                <div className="relative">
                                  <DollarSign className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
                                  <Input
                                    id="totalCost"
                                    type="number"
                                    value={structuredPlan.estimatedTotalCost}
                                    onChange={(e) => handlePlanMetadataChange('estimatedTotalCost', parseFloat(e.target.value))}
                                    className="pl-7"
                                  />
                                </div>
                              ) : (
                                <div className="text-lg font-semibold">${structuredPlan.estimatedTotalCost.toFixed(2)}</div>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="insuranceEstimate">Estimated Insurance Coverage</Label>
                              {isEditing ? (
                                <div className="relative">
                                  <DollarSign className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
                                  <Input
                                    id="insuranceEstimate"
                                    type="number"
                                    value={structuredPlan.insuranceEstimate || 0}
                                    onChange={(e) => handlePlanMetadataChange('insuranceEstimate', parseFloat(e.target.value))}
                                    className="pl-7"
                                  />
                                </div>
                              ) : (
                                <div className="text-lg font-semibold">${(structuredPlan.insuranceEstimate || 0).toFixed(2)}</div>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="patientResponsibility">Patient Responsibility</Label>
                              <div className="text-lg font-semibold">${(structuredPlan.patientResponsibility || 0).toFixed(2)}</div>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="appointmentsRequired">Appointments Required</Label>
                              {isEditing ? (
                                <Input
                                  id="appointmentsRequired"
                                  type="number"
                                  value={structuredPlan.appointmentsRequired}
                                  onChange={(e) => handlePlanMetadataChange('appointmentsRequired', parseInt(e.target.value))}
                                />
                              ) : (
                                <div className="text-lg font-semibold">{structuredPlan.appointmentsRequired}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                      
                      {/* Plan Details Tab */}
                      <TabsContent value="details">
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="urgency">Urgency</Label>
                              {isEditing ? (
                                <Select
                                  value={structuredPlan.urgency}
                                  onValueChange={(value) => handlePlanMetadataChange('urgency', value as any)}
                                >
                                  <SelectTrigger id="urgency">
                                    <SelectValue placeholder="Select urgency" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="normal">Normal</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className={getPriorityColor(structuredPlan.urgency)}
                                >
                                  {structuredPlan.urgency}
                                </Badge>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="complexity">Complexity</Label>
                              {isEditing ? (
                                <Select
                                  value={structuredPlan.complexity}
                                  onValueChange={(value) => handlePlanMetadataChange('complexity', value as any)}
                                >
                                  <SelectTrigger id="complexity">
                                    <SelectValue placeholder="Select complexity" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="simple">Simple</SelectItem>
                                    <SelectItem value="moderate">Moderate</SelectItem>
                                    <SelectItem value="complex">Complex</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <div className="font-medium">{structuredPlan.complexity}</div>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="notes">Treatment Notes</Label>
                            {isEditing ? (
                              <Textarea
                                id="notes"
                                value={structuredPlan.notes}
                                onChange={(e) => handlePlanMetadataChange('notes', e.target.value)}
                                rows={5}
                              />
                            ) : (
                              <div className="p-3 border rounded-md bg-slate-50 whitespace-pre-line">
                                {structuredPlan.notes || "No additional notes provided."}
                              </div>
                            )}
                          </div>
                          
                          {structuredPlan.doctorEdited && (
                            <Alert>
                              <ClipboardCheck className="h-4 w-4" />
                              <AlertTitle>Provider Edited</AlertTitle>
                              <AlertDescription>
                                This treatment plan has been modified by a provider.
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                ) : (
                  /* Text View */
                  <div>
                    {isEditing ? (
                      <Textarea
                        value={planText}
                        onChange={(e) => setPlanText(e.target.value)}
                        rows={15}
                        className="font-mono text-sm"
                      />
                    ) : (
                      <div className="p-4 border rounded-md bg-slate-50 whitespace-pre-line">
                        {planText}
                      </div>
                    )}
                    
                    {reasoning && !isEditing && (
                      <div className="mt-4 p-4 border rounded-md bg-slate-50">
                        <h4 className="font-medium mb-2">AI Reasoning</h4>
                        <p className="text-sm text-muted-foreground">{reasoning}</p>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex justify-end space-x-2 pt-4">
                  {currentStatus === "accepted" ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-3 py-1.5">
                      <Check className="h-4 w-4 mr-2" />
                      Plan Approved
                    </Badge>
                  ) : isEditing ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        disabled={submitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="default"
                        onClick={approveTreatmentPlan}
                        disabled={submitting}
                        className="gap-2"
                      >
                        {submitting ? (
                          <><LoadingSpinner className="h-4 w-4 mr-2" /> Approving...</>
                        ) : (
                          <><Check className="h-4 w-4" /> Approve Plan</>
                        )}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(true)}
                        className="gap-2"
                      >
                        <Edit className="h-4 w-4" /> Edit Plan
                      </Button>
                      <Button
                        variant="default"
                        onClick={approveTreatmentPlan}
                        disabled={submitting}
                        className="gap-2"
                      >
                        {submitting ? (
                          <><LoadingSpinner className="h-4 w-4 mr-2" /> Approving...</>
                        ) : (
                          <><Check className="h-4 w-4" /> Approve As-Is</>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}