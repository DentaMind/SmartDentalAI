import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/api';
import { 
  Check, 
  Edit, 
  AlertCircle, 
  Clock, 
  FileText, 
  Sparkles, 
  User,
  BrainCircuit,
  FileSignature,
  RefreshCw,
  ThumbsUp,
  Pencil
} from 'lucide-react';

interface TreatmentProcedure {
  code: string;
  description: string;
  price: number;
  priority: 'high' | 'medium' | 'low';
  timing: string;
  alternatives?: string[];
  notes?: string;
}

interface TreatmentPlan {
  id: string;
  patientId: string;
  title: string;
  diagnosis: string;
  procedures: TreatmentProcedure[];
  reasoning: string;
  confidence: number;
  totalCost: number;
  insuranceCoverage?: number;
  outOfPocket?: number;
  status: 'draft' | 'approved' | 'rejected' | 'modified';
  aiDraft: string;
  approvedPlan?: string;
  providerNote?: string;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

interface AdvancedTreatmentPlanProps {
  patientId: string;
  initialPlan?: TreatmentPlan;
  onSave?: (plan: TreatmentPlan) => void;
  readOnly?: boolean;
}

export const AdvancedTreatmentPlan: React.FC<AdvancedTreatmentPlanProps> = ({ 
  patientId, 
  initialPlan, 
  onSave,
  readOnly = false
}) => {
  const [isLoading, setIsLoading] = useState(!initialPlan);
  const [treatmentPlan, setTreatmentPlan] = useState<TreatmentPlan | null>(initialPlan || null);
  const [mode, setMode] = useState<'view' | 'edit'>(readOnly ? 'view' : 'edit');
  const [modified, setModified] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [editedDiagnosis, setEditedDiagnosis] = useState('');
  const [editedReasoning, setEditedReasoning] = useState('');
  const [editedProviderNote, setEditedProviderNote] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (!initialPlan) {
      fetchOrGeneratePlan();
    } else {
      setEditedDiagnosis(initialPlan.diagnosis);
      setEditedReasoning(initialPlan.reasoning);
      setEditedProviderNote(initialPlan.providerNote || '');
    }
  }, [initialPlan, patientId]);

  const fetchOrGeneratePlan = async () => {
    setIsLoading(true);
    try {
      // First try to fetch existing plans
      const existingPlans = await apiRequest(`/api/treatment-plans/${patientId}`, {
        method: 'GET'
      });
      
      if (existingPlans && existingPlans.length > 0) {
        // Use the most recent plan
        const latestPlan = existingPlans[0];
        setTreatmentPlan(latestPlan);
        setEditedDiagnosis(latestPlan.diagnosis);
        setEditedReasoning(latestPlan.reasoning);
        setEditedProviderNote(latestPlan.providerNote || '');
      } else {
        // Generate a new plan if none exists
        const newPlan = await apiRequest('/api/treatment-plans/generate-treatment-plan', {
          method: 'POST',
          data: {
            patientId,
            includeXrays: true,
            includePerio: true,
            includeRestorative: true
          }
        });
        
        setTreatmentPlan(newPlan);
        setEditedDiagnosis(newPlan.diagnosis);
        setEditedReasoning(newPlan.reasoning);
      }
    } catch (error) {
      console.error('Error fetching/generating treatment plan:', error);
      toast({
        title: "Failed to load treatment plan",
        description: "There was an error loading the treatment plan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!treatmentPlan) return;
    
    setSaving(true);
    try {
      const updatedPlan = await apiRequest('/api/treatment-plans/approve-treatment-plan', {
        method: 'POST',
        data: {
          planId: treatmentPlan.id,
          approvedPlan: JSON.stringify({
            diagnosis: editedDiagnosis,
            reasoning: editedReasoning,
            procedures: treatmentPlan.procedures,
          }),
          providerNote: editedProviderNote
        }
      });
      
      setTreatmentPlan(updatedPlan);
      setMode('view');
      setModified(false);
      
      toast({
        title: "Treatment plan approved",
        description: "The treatment plan has been approved and saved.",
        variant: "success"
      });
      
      if (onSave) {
        onSave(updatedPlan);
      }
    } catch (error) {
      console.error('Error approving treatment plan:', error);
      toast({
        title: "Failed to approve plan",
        description: "There was an error approving the treatment plan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.85) return "High";
    if (confidence >= 0.7) return "Moderate";
    return "Low";
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.85) return "text-green-600";
    if (confidence >= 0.7) return "text-amber-600";
    return "text-red-600";
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BrainCircuit className="mr-2 h-5 w-5" />
            Generating AI Treatment Plan...
          </CardTitle>
          <CardDescription>
            Analyzing patient data and generating personalized treatment recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[200px] flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">This may take a moment</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!treatmentPlan) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <AlertCircle className="mr-2 h-5 w-5" />
            Treatment Plan Unavailable
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Unable to generate or retrieve a treatment plan for this patient.</p>
        </CardContent>
        <CardFooter>
          <Button onClick={fetchOrGeneratePlan}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Treatment Plan
              {treatmentPlan.status === 'draft' && (
                <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">
                  Draft
                </Badge>
              )}
              {treatmentPlan.status === 'approved' && (
                <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                  Approved
                </Badge>
              )}
              {treatmentPlan.status === 'modified' && (
                <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">
                  Modified
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Created {new Date(treatmentPlan.createdAt).toLocaleDateString()} • 
              <span className={`ml-1 font-medium ${getConfidenceColor(treatmentPlan.confidence)}`}>
                {getConfidenceLabel(treatmentPlan.confidence)} confidence ({Math.round(treatmentPlan.confidence * 100)}%)
              </span>
            </CardDescription>
          </div>
          
          {!readOnly && (
            <div className="flex space-x-2">
              {mode === 'view' && treatmentPlan.status !== 'approved' && (
                <Button size="sm" variant="outline" onClick={() => setMode('edit')}>
                  <Edit className="mr-1 h-4 w-4" /> Edit Plan
                </Button>
              )}
              {mode === 'edit' && (
                <Button size="sm" variant="outline" onClick={() => {
                  setMode('view');
                  setEditedDiagnosis(treatmentPlan.diagnosis);
                  setEditedReasoning(treatmentPlan.reasoning);
                  setEditedProviderNote(treatmentPlan.providerNote || '');
                  setModified(false);
                }}>
                  Cancel
                </Button>
              )}
              {mode === 'edit' && (
                <Button 
                  size="sm" 
                  disabled={saving || !modified}
                  onClick={handleApprove}
                >
                  {saving ? (
                    <>
                      <RefreshCw className="mr-1 h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <FileSignature className="mr-1 h-4 w-4" /> Approve & Sign
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="procedures">Procedures</TabsTrigger>
            <TabsTrigger value="reasoning">AI Reasoning</TabsTrigger>
            {treatmentPlan.status === 'approved' && (
              <TabsTrigger value="provider">Provider Notes</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label htmlFor="diagnosis" className="text-base font-medium">
                  Diagnosis
                </Label>
                {mode === 'edit' && (
                  <Badge variant="outline" className="flex items-center">
                    <Pencil className="h-3 w-3 mr-1" /> Editable
                  </Badge>
                )}
              </div>
              
              {mode === 'edit' ? (
                <Textarea 
                  id="diagnosis"
                  value={editedDiagnosis}
                  onChange={(e) => {
                    setEditedDiagnosis(e.target.value);
                    setModified(true);
                  }}
                  className="min-h-[100px] mb-4"
                />
              ) : (
                <div className="p-3 bg-muted/50 rounded-md mb-4">
                  {treatmentPlan.diagnosis}
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-base font-medium mb-2">Recommended Procedures</h3>
              <div className="space-y-2">
                {treatmentPlan.procedures.map((procedure, index) => (
                  <div key={index} className="p-2 border rounded-md">
                    <div className="flex justify-between">
                      <div className="font-medium">{procedure.code}</div>
                      <div>${procedure.price.toFixed(2)}</div>
                    </div>
                    <div className="text-sm">{procedure.description}</div>
                    <div className="flex mt-1">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          procedure.priority === 'high' 
                            ? 'bg-red-50 text-red-700 border-red-200' 
                            : procedure.priority === 'medium'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {procedure.priority} priority
                      </Badge>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {procedure.timing}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 border rounded-md">
                <div className="flex justify-between font-medium">
                  <span>Total estimated cost:</span>
                  <span>${treatmentPlan.totalCost?.toFixed(2) || '0.00'}</span>
                </div>
                {treatmentPlan.insuranceCoverage !== undefined && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Estimated insurance coverage:</span>
                    <span>${treatmentPlan.insuranceCoverage.toFixed(2)}</span>
                  </div>
                )}
                {treatmentPlan.outOfPocket !== undefined && (
                  <div className="flex justify-between text-sm font-medium mt-1">
                    <span>Estimated out-of-pocket:</span>
                    <span>${treatmentPlan.outOfPocket.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
            
            {treatmentPlan.status === 'approved' && treatmentPlan.approvedAt && (
              <Alert className="mt-4 bg-green-50 border-green-200">
                <Check className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-700">Plan Approved</AlertTitle>
                <AlertDescription className="text-green-700">
                  Approved on {new Date(treatmentPlan.approvedAt).toLocaleDateString()} by Dr. {treatmentPlan.approvedBy}
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
          
          <TabsContent value="procedures">
            <div className="space-y-4">
              <h3 className="text-base font-medium">Detailed Procedure Information</h3>
              {treatmentPlan.procedures.map((procedure, index) => (
                <Card key={index}>
                  <CardHeader className="py-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">{procedure.code}</CardTitle>
                      <div className="font-medium">${procedure.price.toFixed(2)}</div>
                    </div>
                    <CardDescription>{procedure.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="py-2 space-y-3">
                    <div>
                      <span className="font-medium">Priority:</span> {procedure.priority}
                    </div>
                    <div>
                      <span className="font-medium">Recommended timing:</span> {procedure.timing}
                    </div>
                    {procedure.alternatives && procedure.alternatives.length > 0 && (
                      <div>
                        <span className="font-medium">Alternatives:</span> 
                        <ul className="list-disc list-inside">
                          {procedure.alternatives.map((alt, i) => (
                            <li key={i} className="text-sm">{alt}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {procedure.notes && (
                      <div>
                        <span className="font-medium">Notes:</span> 
                        <p className="text-sm">{procedure.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="reasoning">
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-base font-medium flex items-center">
                  <BrainCircuit className="mr-2 h-4 w-4" />
                  AI Reasoning & Analysis
                </h3>
                {mode === 'edit' && (
                  <Badge variant="outline" className="flex items-center">
                    <Pencil className="h-3 w-3 mr-1" /> Editable
                  </Badge>
                )}
              </div>
              
              {mode === 'edit' ? (
                <Textarea 
                  value={editedReasoning}
                  onChange={(e) => {
                    setEditedReasoning(e.target.value);
                    setModified(true);
                  }}
                  className="min-h-[300px]"
                />
              ) : (
                <div className="p-3 bg-muted/50 rounded-md whitespace-pre-wrap">
                  {treatmentPlan.reasoning}
                </div>
              )}
              
              <Alert className="mt-4 bg-blue-50 border-blue-200">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-700">AI-Generated Content</AlertTitle>
                <AlertDescription className="text-blue-700">
                  This reasoning was generated by artificial intelligence based on patient data, medical history, and dental standards of care.
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
          
          {treatmentPlan.status === 'approved' && (
            <TabsContent value="provider">
              <div className="space-y-4">
                <h3 className="text-base font-medium flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Provider Notes & Assessment
                </h3>
                
                {mode === 'edit' ? (
                  <Textarea 
                    value={editedProviderNote}
                    onChange={(e) => {
                      setEditedProviderNote(e.target.value);
                      setModified(true);
                    }}
                    placeholder="Add your clinical notes, recommendations, or comments about this treatment plan..."
                    className="min-h-[200px]"
                  />
                ) : (
                  <div className="p-3 bg-muted/50 rounded-md">
                    {treatmentPlan.providerNote || 'No provider notes available.'}
                  </div>
                )}
                
                {treatmentPlan.approvedAt && (
                  <div className="p-3 border rounded-md flex items-center text-sm text-muted-foreground">
                    <Clock className="mr-2 h-4 w-4" />
                    Approved on {new Date(treatmentPlan.approvedAt).toLocaleDateString()} by Dr. {treatmentPlan.approvedBy}
                  </div>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
      
      {mode === 'edit' && (
        <CardFooter className="border-t pt-4 flex justify-between">
          <div className="text-xs text-muted-foreground">
            All changes are tracked for legal and compliance purposes
          </div>
          <Button 
            onClick={handleApprove} 
            disabled={saving || !modified}
          >
            {saving ? (
              <>
                <RefreshCw className="mr-1 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <ThumbsUp className="mr-1 h-4 w-4" /> Approve & Sign Treatment Plan
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default AdvancedTreatmentPlan;