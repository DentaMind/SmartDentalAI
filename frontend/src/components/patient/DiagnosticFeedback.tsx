import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardFooter, 
  CardDescription 
} from '../ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogTrigger 
} from '../ui/dialog';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  CheckCircle, 
  AlertTriangle, 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare, 
  Send, 
  Edit, 
  Eye, 
  RotateCw,
  ArrowRight,
  FileEdit
} from 'lucide-react';
import { useToast } from '../ui/use-toast';
import { Switch } from '../ui/switch';

// Types for our component
interface DiagnosticFinding {
  id: string;
  tooth_number?: number | string;
  diagnosis: string;
  confidence: number;
  ai_generated: boolean;
  status: 'pending' | 'accepted' | 'corrected' | 'rejected';
  provider_feedback?: string;
  correction?: string;
  created_at: string;
  created_by: string;
  updated_at?: string;
  updated_by?: string;
  global_status?: string;
  original_diagnosis?: string;
}

interface AiMessage {
  id: string;
  content: string;
  sender: 'ai' | 'provider';
  timestamp: string;
}

interface DiagnosticFeedbackProps {
  patientId: string;
  patientName: string;
  userRole: 'dentist' | 'hygienist' | 'assistant' | 'admin';
  userName: string;
  canApprove: boolean;
  onDiagnosisChange?: (diagnosisId: string, status: string, correction?: string) => void;
}

export function DiagnosticFeedback({ 
  patientId, 
  patientName, 
  userRole, 
  userName,
  canApprove = false,
  onDiagnosisChange 
}: DiagnosticFeedbackProps) {
  const [findings, setFindings] = useState<DiagnosticFinding[]>([]);
  const [selectedFinding, setSelectedFinding] = useState<DiagnosticFinding | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackText, setFeedbackText] = useState('');
  const [correctionText, setCorrectionText] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCorrectingMode, setIsCorrectingMode] = useState(false);
  const [isFeedbackMode, setIsFeedbackMode] = useState(false);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [diagnosisNeedsMoreInfo, setDiagnosisNeedsMoreInfo] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchFindings();
  }, [patientId]);

  // Fetch diagnostic findings
  const fetchFindings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/patients/${patientId}/diagnostic-findings`);
      if (!response.ok) throw new Error('Failed to fetch findings');
      
      const data = await response.json();
      setFindings(data);
    } catch (error) {
      console.error('Error fetching findings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load diagnostic findings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Submit feedback for a finding
  const submitFeedback = async (findingId: string, feedback: string, status: 'accepted' | 'rejected') => {
    try {
      const response = await fetch(`/api/diagnostic-findings/${findingId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedback,
          status,
          provider_name: userName,
          provider_role: userRole,
          practice_id: sessionStorage.getItem('practiceId') || localStorage.getItem('practiceId') || 'unknown'
        }),
      });

      if (!response.ok) throw new Error('Failed to submit feedback');
      
      const updatedFinding = await response.json();
      
      // Update local state
      const updatedFindings = findings.map(finding => 
        finding.id === findingId ? { 
          ...finding, 
          status, 
          provider_feedback: feedback, 
          updated_by: userName, 
          updated_at: new Date().toISOString(),
          global_status: updatedFinding.global_status
        } : finding
      );
      setFindings(updatedFindings);
      
      // Call the parent handler if provided
      if (onDiagnosisChange) {
        onDiagnosisChange(findingId, status);
      }
      
      let toastMessage = '';
      if (status === 'rejected') {
        toastMessage = 'Rejection applied to your practice and submitted to DentaMind for review';
      } else {
        toastMessage = 'Feedback submitted successfully';
      }
      
      toast({
        title: 'Success',
        description: toastMessage,
      });
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit feedback',
        variant: 'destructive',
      });
    }
  };

  // Submit a correction for a finding
  const submitCorrection = async (findingId: string, correction: string) => {
    try {
      const response = await fetch(`/api/diagnostic-findings/${findingId}/correct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          correction,
          provider_name: userName,
          provider_role: userRole,
          practice_id: sessionStorage.getItem('practiceId') || localStorage.getItem('practiceId') || 'unknown'
        }),
      });

      if (!response.ok) throw new Error('Failed to submit correction');
      
      const updatedFinding = await response.json();
      
      // Update local state
      const updatedFindings = findings.map(finding => 
        finding.id === findingId ? { 
          ...finding, 
          status: 'corrected', 
          diagnosis: correction,  // Update diagnosis locally
          original_diagnosis: finding.diagnosis, // Save original diagnosis
          correction, 
          updated_by: userName, 
          updated_at: new Date().toISOString(),
          global_status: updatedFinding.global_status
        } : finding
      );
      setFindings(updatedFindings);
      
      // Call the parent handler if provided
      if (onDiagnosisChange) {
        onDiagnosisChange(findingId, 'corrected', correction);
      }
      
      toast({
        title: 'Success',
        description: 'Correction applied to your practice and submitted to DentaMind for review',
      });
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error submitting correction:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit correction',
        variant: 'destructive',
      });
    }
  };

  // Request additional information from AI
  const requestMoreInfo = async (findingId: string, message: string) => {
    // Add user message to the conversation
    const userMessage: AiMessage = {
      id: `msg-${Date.now()}`,
      content: message,
      sender: 'provider',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    
    // Simulate AI responding
    setIsAiResponding(true);
    
    // In a real implementation, we would send this to our AI API
    try {
      const response = await fetch(`/api/diagnostic-findings/${findingId}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          provider_name: userName,
          provider_role: userRole
        }),
      });

      if (!response.ok) throw new Error('Failed to get AI response');
      
      const data = await response.json();
      
      // Add AI response to the conversation
      setTimeout(() => {
        const aiMessage: AiMessage = {
          id: `msg-${Date.now()}`,
          content: data.response || "I need more information to refine this diagnosis. Can you provide additional details about the patient's symptoms or history?",
          sender: 'ai',
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMessage]);
        setIsAiResponding(false);
      }, 1000); // Simulated delay for realism
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Simulate AI response for demo
      setTimeout(() => {
        const aiMessage: AiMessage = {
          id: `msg-${Date.now()}`,
          content: "I need more information to refine this diagnosis. Can you provide additional details about the patient's symptoms or history?",
          sender: 'ai',
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMessage]);
        setIsAiResponding(false);
      }, 1000);
      
      toast({
        title: 'Warning',
        description: 'There was an issue communicating with the AI. Using fallback response.',
        variant: 'default',
      });
    }
  };

  // Open finding details dialog
  const openFindingDetails = (finding: DiagnosticFinding) => {
    setSelectedFinding(finding);
    setFeedbackText('');
    setCorrectionText('');
    setIsCorrectingMode(false);
    setIsFeedbackMode(false);
    // Reset conversation for each finding
    setMessages([
      {
        id: 'initial',
        content: `I've diagnosed tooth #${finding.tooth_number || 'N/A'} with ${finding.diagnosis} with ${(finding.confidence * 100).toFixed(0)}% confidence. Would you like me to explain the basis for this diagnosis or do you have questions?`,
        sender: 'ai',
        timestamp: new Date().toISOString()
      }
    ]);
    setIsDialogOpen(true);
  };

  // Mark all findings as needing more information
  const markAllNeedMoreInfo = () => {
    setDiagnosisNeedsMoreInfo(true);
    toast({
      title: 'Information Requested',
      description: 'These diagnoses have been marked as needing more information.',
    });
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  // Get status badge
  const getStatusBadge = (status: string, globalStatus?: string) => {
    // If there's a pending global review, show a badge indicating that
    if (globalStatus === 'pending_owner_review') {
      if (status === 'corrected') {
        return (
          <div className="flex gap-1">
            <Badge variant="outline" className="bg-blue-100 text-blue-800">Corrected</Badge>
            <Badge variant="outline" className="bg-amber-100 text-amber-800">Pending Global Review</Badge>
          </div>
        );
      } else if (status === 'rejected') {
        return (
          <div className="flex gap-1">
            <Badge variant="outline" className="bg-red-100 text-red-800">Rejected</Badge>
            <Badge variant="outline" className="bg-amber-100 text-amber-800">Pending Global Review</Badge>
          </div>
        );
      }
    }
    
    // Otherwise, show the standard status badges
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending Review</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Accepted</Badge>;
      case 'corrected':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Corrected</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Diagnostic Findings</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="needs-more-info"
              checked={diagnosisNeedsMoreInfo}
              onCheckedChange={markAllNeedMoreInfo}
            />
            <Label htmlFor="needs-more-info">Needs More Information</Label>
          </div>
          <Button variant="outline" onClick={fetchFindings}>
            <RotateCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <p>Loading diagnostic findings...</p>
        </div>
      ) : findings.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-gray-500">No diagnostic findings available for this patient.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {findings.map(finding => (
            <Card key={finding.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {finding.tooth_number ? `Tooth #${finding.tooth_number}: ` : ''} 
                      {finding.diagnosis}
                    </CardTitle>
                    <CardDescription>
                      Confidence: {(finding.confidence * 100).toFixed(0)}% | Created by: {finding.created_by} | {formatDate(finding.created_at)}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 items-center">
                    {finding.ai_generated && (
                      <Badge variant="outline" className="bg-purple-100 text-purple-800">AI Generated</Badge>
                    )}
                    {getStatusBadge(finding.status, finding.global_status)}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-1 pb-2">
                {finding.provider_feedback && (
                  <div className="mt-2 p-2 bg-gray-50 rounded-md">
                    <p className="text-sm font-medium">Provider Feedback:</p>
                    <p className="text-sm">{finding.provider_feedback}</p>
                    {finding.updated_by && (
                      <p className="text-xs text-gray-500 mt-1">
                        Updated by {finding.updated_by} on {formatDate(finding.updated_at || '')}
                      </p>
                    )}
                  </div>
                )}
                
                {finding.correction && (
                  <div className="mt-2 p-2 bg-blue-50 rounded-md">
                    <p className="text-sm font-medium">Correction:</p>
                    <p className="text-sm">{finding.correction}</p>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="pt-0 pb-3 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => openFindingDetails(finding)}>
                  <Eye className="h-4 w-4 mr-1" />
                  Details
                </Button>
                
                {finding.status === 'pending' && canApprove && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-green-600 border-green-600" 
                      onClick={() => submitFeedback(finding.id, "Diagnosis accepted as accurate", 'accepted')}
                    >
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 border-red-600"
                      onClick={() => openFindingDetails(finding)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Correct/Reject
                    </Button>
                  </>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Finding Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedFinding?.tooth_number ? `Tooth #${selectedFinding.tooth_number}: ` : ''}
              {selectedFinding?.original_diagnosis ? (
                <span>
                  <span className="line-through text-gray-500 mr-1">{selectedFinding.original_diagnosis}</span>
                  {selectedFinding.diagnosis}
                </span>
              ) : (
                selectedFinding?.diagnosis
              )}
              {selectedFinding?.ai_generated && (
                <Badge variant="outline" className="bg-purple-100 text-purple-800 ml-2">AI Generated</Badge>
              )}
              {selectedFinding?.global_status === 'pending_owner_review' && (
                <div className="mt-1">
                  <Badge variant="outline" className="bg-amber-100 text-amber-800">Pending DentaMind Review for Global Learning</Badge>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto">
            <div className="space-y-4 p-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Confidence</p>
                  <p className="font-medium">{selectedFinding ? (selectedFinding.confidence * 100).toFixed(0) : 0}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium">{selectedFinding?.status.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created By</p>
                  <p className="font-medium">{selectedFinding?.created_by}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created At</p>
                  <p className="font-medium">{selectedFinding ? formatDate(selectedFinding.created_at) : ''}</p>
                </div>
              </div>
              
              <Accordion type="single" collapsible defaultValue="ai-conversation">
                <AccordionItem value="ai-conversation">
                  <AccordionTrigger>AI Conversation</AccordionTrigger>
                  <AccordionContent>
                    <div className="bg-gray-50 rounded-md p-4 h-[200px] overflow-y-auto flex flex-col space-y-3">
                      {messages.map(message => (
                        <div 
                          key={message.id} 
                          className={`p-3 rounded-lg max-w-[80%] ${
                            message.sender === 'ai' 
                              ? 'bg-blue-100 text-blue-800 self-start' 
                              : 'bg-gray-200 self-end'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs text-gray-500 mt-1">{formatDate(message.timestamp)}</p>
                        </div>
                      ))}
                      {isAiResponding && (
                        <div className="bg-blue-100 text-blue-800 p-3 rounded-lg max-w-[80%] self-start">
                          <p className="text-sm">Thinking...</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-3 flex gap-2">
                      <Input 
                        value={newMessage} 
                        onChange={(e) => setNewMessage(e.target.value)} 
                        placeholder="Ask AI for clarification..."
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newMessage.trim() && selectedFinding) {
                            requestMoreInfo(selectedFinding.id, newMessage);
                          }
                        }}
                      />
                      <Button 
                        variant="outline" 
                        disabled={!newMessage.trim() || !selectedFinding || isAiResponding} 
                        onClick={() => selectedFinding && requestMoreInfo(selectedFinding.id, newMessage)}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                {/* Show if there's existing feedback */}
                {selectedFinding?.provider_feedback && (
                  <AccordionItem value="existing-feedback">
                    <AccordionTrigger>Existing Feedback</AccordionTrigger>
                    <AccordionContent>
                      <div className="bg-gray-50 rounded-md p-4">
                        <p className="text-sm">{selectedFinding.provider_feedback}</p>
                        {selectedFinding.updated_by && (
                          <p className="text-xs text-gray-500 mt-2">
                            By {selectedFinding.updated_by} on {formatDate(selectedFinding.updated_at || '')}
                          </p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
                
                {/* Show if there's a correction */}
                {selectedFinding?.correction && (
                  <AccordionItem value="correction">
                    <AccordionTrigger>Correction</AccordionTrigger>
                    <AccordionContent>
                      <div className="bg-blue-50 rounded-md p-4">
                        <p className="text-sm">{selectedFinding.correction}</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
              
              {/* Show feedback form only when in feedback mode */}
              {isFeedbackMode && (
                <div className="mt-4">
                  <Label htmlFor="feedback">Add Feedback</Label>
                  <Textarea 
                    id="feedback"
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Provide feedback on this diagnosis..."
                    className="mt-1 h-32"
                  />
                </div>
              )}
              
              {/* Show correction form only when in correction mode */}
              {isCorrectingMode && (
                <div className="mt-4">
                  <Label htmlFor="correction">Correct Diagnosis</Label>
                  <Textarea 
                    id="correction"
                    value={correctionText}
                    onChange={(e) => setCorrectionText(e.target.value)}
                    placeholder="Provide the correct diagnosis..."
                    className="mt-1 h-32"
                  />
                </div>
              )}

              {isCorrectingMode && (
                <div className="bg-amber-50 p-3 rounded-md mt-3">
                  <p className="text-sm">
                    <AlertTriangle className="h-4 w-4 inline mr-1 text-amber-600" />
                    Your correction will be immediately applied in your practice. It will also be sent to DentaMind owners 
                    for review before being incorporated into the global AI model.
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="mt-4">
            <div className="flex flex-col w-full gap-2">
              <div className="flex justify-between items-center">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Close
                </Button>
                
                {selectedFinding?.status === 'pending' && canApprove && !isFeedbackMode && !isCorrectingMode && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="text-green-600 border-green-600" 
                      onClick={() => submitFeedback(selectedFinding.id, "Diagnosis accepted as accurate", 'accepted')}
                    >
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-amber-600 text-amber-600"
                      onClick={() => setIsFeedbackMode(true)}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Add Feedback
                    </Button>
                    <Button 
                      variant="outline" 
                      className="text-blue-600 border-blue-600"
                      onClick={() => setIsCorrectingMode(true)}
                    >
                      <FileEdit className="h-4 w-4 mr-1" />
                      Correct
                    </Button>
                    <Button 
                      variant="outline" 
                      className="text-red-600 border-red-600"
                      onClick={() => submitFeedback(selectedFinding.id, "Diagnosis rejected", 'rejected')}
                    >
                      <ThumbsDown className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Show appropriate action buttons for feedback mode */}
              {isFeedbackMode && selectedFinding && (
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsFeedbackMode(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => submitFeedback(selectedFinding.id, feedbackText, 'accepted')}
                    disabled={!feedbackText.trim()}
                  >
                    Submit Feedback
                  </Button>
                </div>
              )}
              
              {/* Show appropriate action buttons for correction mode */}
              {isCorrectingMode && selectedFinding && (
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCorrectingMode(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => submitCorrection(selectedFinding.id, correctionText)}
                    disabled={!correctionText.trim()}
                  >
                    Submit Correction
                  </Button>
                </div>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 