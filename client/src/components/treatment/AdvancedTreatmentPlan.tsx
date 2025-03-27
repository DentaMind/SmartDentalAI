import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Check, Edit, History, AlertTriangle, ThumbsUp, ThumbsDown, RotateCcw } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface TreatmentStep {
  id: number;
  description: string;
  aiGenerated: boolean;
  confidence: number; // 0-100
  justification: string;
  history: {
    timestamp: string;
    description: string;
    provider: string;
  }[];
}

interface TreatmentPlan {
  id: string;
  patientId: string;
  steps: TreatmentStep[];
  status: 'draft' | 'pending_approval' | 'approved' | 'revision_requested';
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

interface AdvancedTreatmentPlanProps {
  initialPlan?: TreatmentPlan;
  patientId: string;
  providerName: string;
  onSave?: (plan: TreatmentPlan) => void;
  readOnly?: boolean;
}

export function AdvancedTreatmentPlan({
  initialPlan,
  patientId,
  providerName,
  onSave,
  readOnly = false
}: AdvancedTreatmentPlanProps) {
  // Default plan if none provided
  const defaultPlan: TreatmentPlan = {
    id: `plan-${Date.now()}`,
    patientId,
    steps: [
      {
        id: 1,
        description: 'Initial comprehensive exam with full-mouth radiographs',
        aiGenerated: true,
        confidence: 95,
        justification: 'Standard of care for new patient evaluation to establish baseline.',
        history: [
          {
            timestamp: new Date().toISOString(),
            description: 'Initial comprehensive exam with full-mouth radiographs',
            provider: 'AI'
          }
        ]
      },
      {
        id: 2,
        description: 'Scaling and root planing, upper right quadrant',
        aiGenerated: true,
        confidence: 85,
        justification: 'Periodontal probing depths indicate moderate periodontitis in UR quadrant.',
        history: [
          {
            timestamp: new Date().toISOString(),
            description: 'Scaling and root planing, upper right quadrant',
            provider: 'AI'
          }
        ]
      },
      {
        id: 3,
        description: 'Composite restoration for tooth #14 (DO)',
        aiGenerated: true,
        confidence: 78,
        justification: 'X-ray findings show carious lesion on distal and occlusal of #14.',
        history: [
          {
            timestamp: new Date().toISOString(),
            description: 'Composite restoration for tooth #14 (DO)',
            provider: 'AI'
          }
        ]
      }
    ],
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const [plan, setPlan] = useState<TreatmentPlan>(initialPlan || defaultPlan);
  const [activeTab, setActiveTab] = useState('current');
  const [editingStepId, setEditingStepId] = useState<number | null>(null);
  const [revisionNote, setRevisionNote] = useState('');
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);

  // Track if there are unsaved changes
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (initialPlan) {
      setPlan(initialPlan);
    }
  }, [initialPlan]);

  const handleEdit = (id: number, value: string) => {
    setPlan(prev => {
      const updatedSteps = prev.steps.map(step => {
        if (step.id === id) {
          // Create a history entry for this edit
          const historyEntry = {
            timestamp: new Date().toISOString(),
            description: value,
            provider: providerName
          };
          
          return {
            ...step,
            description: value,
            history: [...step.history, historyEntry]
          };
        }
        return step;
      });
      
      return {
        ...prev,
        steps: updatedSteps,
        updatedAt: new Date().toISOString(),
        status: prev.status === 'approved' ? 'pending_approval' : prev.status
      };
    });
    
    setHasChanges(true);
    setEditingStepId(null);
  };

  const startEditing = (id: number) => {
    setEditingStepId(id);
  };

  const cancelEditing = () => {
    setEditingStepId(null);
  };

  const handleSubmitForApproval = () => {
    setPlan(prev => ({
      ...prev,
      status: 'pending_approval',
      updatedAt: new Date().toISOString()
    }));
    
    if (onSave) {
      onSave({
        ...plan,
        status: 'pending_approval',
        updatedAt: new Date().toISOString()
      });
    }
    
    setHasChanges(false);
  };

  const handleApprove = () => {
    setPlan(prev => ({
      ...prev,
      status: 'approved',
      approvedBy: providerName,
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    
    if (onSave) {
      onSave({
        ...plan,
        status: 'approved',
        approvedBy: providerName,
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    setHasChanges(false);
  };

  const handleRequestRevision = () => {
    setPlan(prev => ({
      ...prev,
      status: 'revision_requested',
      updatedAt: new Date().toISOString()
    }));
    
    if (onSave) {
      onSave({
        ...plan,
        status: 'revision_requested',
        updatedAt: new Date().toISOString()
      });
    }
    
    setRevisionDialogOpen(false);
    setHasChanges(false);
  };

  const handleAIFeedback = (stepId: number, helpful: boolean) => {
    // In a real app, this would send feedback to the AI system
    console.log(`AI feedback for step ${stepId}: ${helpful ? 'Helpful' : 'Not helpful'}`);
    
    // Show confirmation to the user
    alert(`Thank you for your feedback! This helps improve our AI recommendations.`);
  };

  // Render confidence indicator
  const renderConfidence = (confidence: number) => {
    let color = 'bg-gray-200';
    if (confidence >= 90) color = 'bg-green-500';
    else if (confidence >= 75) color = 'bg-green-300';
    else if (confidence >= 60) color = 'bg-yellow-300';
    else if (confidence < 60) color = 'bg-orange-300';
    
    return (
      <div className="flex items-center gap-1 text-xs">
        <div className={`h-2 w-12 rounded-full ${color}`}></div>
        <span>{confidence}%</span>
      </div>
    );
  };

  // Render status badge
  const renderStatusBadge = (status: TreatmentPlan['status']) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'pending_approval':
        return <Badge variant="secondary">Pending Approval</Badge>;
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'revision_requested':
        return <Badge variant="destructive">Revision Requested</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Treatment Plan</h2>
          <p className="text-sm text-muted-foreground">
            Patient ID: {patientId} | Last Updated: {new Date(plan.updatedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {renderStatusBadge(plan.status)}
          
          {!readOnly && plan.status !== 'approved' && (
            <Button 
              onClick={handleSubmitForApproval} 
              disabled={plan.status === 'pending_approval' || !hasChanges}
            >
              Submit for Approval
            </Button>
          )}
          
          {!readOnly && plan.status === 'pending_approval' && (
            <div className="flex gap-2">
              <Button onClick={handleApprove} variant="success">
                <Check className="h-4 w-4 mr-1" /> Approve
              </Button>
              
              <Dialog open={revisionDialogOpen} onOpenChange={setRevisionDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive">
                    <RotateCcw className="h-4 w-4 mr-1" /> Request Revision
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request Revision</DialogTitle>
                    <DialogDescription>
                      Explain what needs to be revised in this treatment plan.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Textarea
                    value={revisionNote}
                    onChange={(e) => setRevisionNote(e.target.value)}
                    placeholder="Please provide details about what needs to be changed..."
                    rows={4}
                  />
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setRevisionDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleRequestRevision}
                      disabled={!revisionNote.trim()}
                    >
                      Submit Revision Request
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </div>
      
      {plan.approvedBy && plan.approvedAt && (
        <div className="bg-green-50 p-2 rounded border border-green-200 text-sm">
          <span className="font-semibold">Approved by:</span> {plan.approvedBy} on {new Date(plan.approvedAt).toLocaleString()}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="current">Current Plan</TabsTrigger>
          <TabsTrigger value="history">Edit History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="current" className="space-y-4 mt-4">
          {plan.steps.map((step) => (
            <Card key={step.id} className={step.aiGenerated ? 'border-blue-100' : ''}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-grow">
                    {editingStepId === step.id ? (
                      <div className="space-y-2">
                        <Input
                          defaultValue={step.description}
                          autoFocus
                          onBlur={(e) => handleEdit(step.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleEdit(step.id, e.currentTarget.value);
                            } else if (e.key === 'Escape') {
                              cancelEditing();
                            }
                          }}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={cancelEditing}>
                            Cancel
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={(e) => {
                              const input = e.currentTarget.parentElement?.previousElementSibling as HTMLInputElement;
                              if (input) {
                                handleEdit(step.id, input.value);
                              }
                            }}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="font-medium">{step.description}</p>
                        
                        <div className="flex items-center gap-2 mt-1">
                          {step.aiGenerated && (
                            <Badge variant="outline" className="text-xs bg-blue-50">AI Suggested</Badge>
                          )}
                          {renderConfidence(step.confidence)}
                        </div>
                        
                        <div className="text-sm text-muted-foreground mt-2">
                          <strong>Justification:</strong> {step.justification}
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!readOnly && plan.status !== 'approved' && editingStepId !== step.id && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => startEditing(step.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {step.aiGenerated && (
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleAIFeedback(step.id, true)}
                          title="This AI suggestion was helpful"
                        >
                          <ThumbsUp className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleAIFeedback(step.id, false)}
                          title="This AI suggestion was not helpful"
                        >
                          <ThumbsDown className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4 mt-4">
          <div className="space-y-6">
            {plan.steps.map((step) => (
              <Card key={step.id}>
                <CardHeader>
                  <CardTitle className="text-md">Step #{step.id}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {step.history.map((entry, index) => (
                      <div key={index} className="border-l-2 pl-4 py-2 border-gray-200">
                        <p className="font-medium">{entry.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {entry.provider === 'AI' ? (
                            <span className="text-blue-600">AI Generated</span>
                          ) : (
                            <span>Modified by {entry.provider}</span>
                          )}
                          <span> • {new Date(entry.timestamp).toLocaleString()}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Warning for unsaved changes */}
      {hasChanges && !readOnly && (
        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">You have unsaved changes. Submit for approval to save.</span>
        </div>
      )}
    </div>
  );
}

export default AdvancedTreatmentPlan;