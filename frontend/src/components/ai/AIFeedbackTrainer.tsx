import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Brain,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  BarChart3,
  Send,
  History,
  ImagePlus,
  ChevronDown,
  ChevronUp,
  Archive,
  User,
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

interface AIFinding {
  id: string;
  tooth: string;
  type: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  location?: Record<string, any>;
  model_version?: string;
  created_at: string;
}

interface AIFeedbackItem {
  id: string;
  finding_id: string;
  provider_id: string;
  is_correct: boolean;
  correction_type?: string;
  correction_details?: string;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
}

interface AIModelMetrics {
  model_version: string;
  accuracy: number;
  false_positives: number;
  false_negatives: number;
  confusion_matrix?: Record<string, any>;
  total_samples: number;
  last_trained: string;
}

interface AIFeedbackTrainerProps {
  patientId: string;
  imageId?: string;
  onFeedbackComplete?: (feedbackCount: number) => void;
  clinicId?: string;
  providerId?: string;
}

export const AIFeedbackTrainer: React.FC<AIFeedbackTrainerProps> = ({
  patientId,
  imageId,
  onFeedbackComplete,
  clinicId = 'default-clinic',
  providerId = 'current-provider',
}) => {
  const { toast } = useToast();
  const [findings, setFindings] = useState<AIFinding[]>([]);
  const [feedbackItems, setFeedbackItems] = useState<AIFeedbackItem[]>([]);
  const [modelMetrics, setModelMetrics] = useState<AIModelMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentFindingIndex, setCurrentFindingIndex] = useState(0);
  const [userFeedback, setUserFeedback] = useState<{
    isCorrect: boolean | null;
    correctionType: string;
    correctionDetails: string;
    priority: 'low' | 'medium' | 'high';
  }>({
    isCorrect: null,
    correctionType: '',
    correctionDetails: '',
    priority: 'medium',
  });
  const [showMetrics, setShowMetrics] = useState(false);
  const [enableTrainingMode, setEnableTrainingMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');

  // Load findings and feedback for this patient/image
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch AI findings
        const findingsParams = imageId ? { imageId } : {};
        const findingsResponse = await axios.get(`/api/ai/diagnosis/${patientId}/findings`, {
          params: findingsParams,
        });

        if (findingsResponse.status === 200) {
          setFindings(findingsResponse.data);
        }

        // Fetch existing feedback
        const feedbackResponse = await axios.get(`/api/ai/feedback`, {
          params: { patientId, providerId },
        });

        if (feedbackResponse.status === 200) {
          setFeedbackItems(feedbackResponse.data);
        }

        // Fetch model metrics if training mode enabled
        if (enableTrainingMode) {
          const metricsResponse = await axios.get(`/api/ai/metrics`, {
            params: { clinicId },
          });

          if (metricsResponse.status === 200) {
            setModelMetrics(metricsResponse.data);
          }
        }
      } catch (error) {
        console.error('Error fetching AI data:', error);
        
        // Generate mock data for development
        if (process.env.NODE_ENV === 'development') {
          const mockFindings: AIFinding[] = [
            {
              id: 'finding-1',
              tooth: '3',
              type: 'Recurrent Caries',
              confidence: 0.92,
              severity: 'high',
              description: 'Recurrent decay detected at the margin of existing crown on distal surface.',
              location: {
                surface: 'D',
                area: 'cervical',
              },
              model_version: '2.1.0',
              created_at: new Date().toISOString(),
            },
            {
              id: 'finding-2',
              tooth: '14',
              type: 'Periapical Radiolucency',
              confidence: 0.86,
              severity: 'medium',
              description: 'Apical radiolucency detected, approximately 3mm in diameter.',
              location: {
                area: 'apical',
              },
              model_version: '2.1.0',
              created_at: new Date().toISOString(),
            },
            {
              id: 'finding-3',
              tooth: '19',
              type: 'Crown Fracture',
              confidence: 0.78,
              severity: 'medium',
              description: 'Hairline fracture detected on mesial-lingual cusp of existing PFM crown.',
              location: {
                surface: 'ML',
                area: 'occlusal',
              },
              model_version: '2.1.0',
              created_at: new Date().toISOString(),
            },
          ];

          const mockFeedback: AIFeedbackItem[] = [
            {
              id: 'feedback-1',
              finding_id: 'finding-1',
              provider_id: providerId,
              is_correct: true,
              priority: 'high',
              created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            },
          ];

          const mockMetrics: AIModelMetrics = {
            model_version: '2.1.0',
            accuracy: 0.87,
            false_positives: 12,
            false_negatives: 8,
            confusion_matrix: {
              caries: { true_positive: 45, false_positive: 5, false_negative: 3, true_negative: 47 },
              periapical: { true_positive: 28, false_positive: 3, false_negative: 2, true_negative: 67 },
              fracture: { true_positive: 15, false_positive: 4, false_negative: 3, true_negative: 78 },
            },
            total_samples: 100,
            last_trained: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          };

          setFindings(mockFindings);
          setFeedbackItems(mockFeedback);
          setModelMetrics(mockMetrics);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [patientId, imageId, providerId, clinicId, enableTrainingMode]);

  const getCurrentFinding = () => {
    return findings[currentFindingIndex] || null;
  };

  const hasExistingFeedback = (findingId: string) => {
    return feedbackItems.some(feedback => feedback.finding_id === findingId);
  };

  const getFeedbackForFinding = (findingId: string) => {
    return feedbackItems.find(feedback => feedback.finding_id === findingId);
  };

  const resetFeedbackForm = () => {
    setUserFeedback({
      isCorrect: null,
      correctionType: '',
      correctionDetails: '',
      priority: 'medium',
    });
  };

  const handleNext = () => {
    if (currentFindingIndex < findings.length - 1) {
      setCurrentFindingIndex(prevIndex => prevIndex + 1);
      resetFeedbackForm();
    }
  };

  const handlePrevious = () => {
    if (currentFindingIndex > 0) {
      setCurrentFindingIndex(prevIndex => prevIndex - 1);
      resetFeedbackForm();
    }
  };

  const handleSubmitFeedback = async () => {
    const currentFinding = getCurrentFinding();
    if (!currentFinding || userFeedback.isCorrect === null) return;

    setSubmitting(true);
    try {
      const feedbackData = {
        finding_id: currentFinding.id,
        provider_id: providerId,
        is_correct: userFeedback.isCorrect,
        correction_type: !userFeedback.isCorrect ? userFeedback.correctionType : undefined,
        correction_details: !userFeedback.isCorrect ? userFeedback.correctionDetails : undefined,
        priority: userFeedback.priority,
        patient_id: patientId,
        model_version: currentFinding.model_version,
      };

      const response = await axios.post('/api/ai/feedback', feedbackData);

      if (response.status === 200 || response.status === 201) {
        // Add the new feedback to our local state
        const newFeedback: AIFeedbackItem = {
          ...feedbackData,
          id: response.data.id || `temp-${Date.now()}`,
          created_at: new Date().toISOString(),
        } as AIFeedbackItem;

        setFeedbackItems(prev => [...prev, newFeedback]);

        toast({
          title: 'Feedback submitted',
          description: 'Thank you for helping improve our AI model',
        });

        // Move to next finding or complete
        if (currentFindingIndex < findings.length - 1) {
          handleNext();
        } else {
          if (onFeedbackComplete) {
            onFeedbackComplete(findings.length);
          }
          toast({
            title: 'All findings reviewed',
            description: 'You have provided feedback on all AI findings',
          });
        }
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        variant: 'destructive',
        title: 'Submission failed',
        description: 'Could not submit feedback. Please try again.',
      });
      
      // For development, simulate successful feedback
      if (process.env.NODE_ENV === 'development') {
        const mockFeedback: AIFeedbackItem = {
          id: `feedback-dev-${Date.now()}`,
          finding_id: currentFinding.id,
          provider_id: providerId,
          is_correct: userFeedback.isCorrect,
          correction_type: !userFeedback.isCorrect ? userFeedback.correctionType : undefined,
          correction_details: !userFeedback.isCorrect ? userFeedback.correctionDetails : undefined,
          priority: userFeedback.priority,
          created_at: new Date().toISOString(),
        };
        
        setFeedbackItems(prev => [...prev, mockFeedback]);
        
        if (currentFindingIndex < findings.length - 1) {
          handleNext();
        } else {
          if (onFeedbackComplete) {
            onFeedbackComplete(findings.length);
          }
        }
      }
    } finally {
      setSubmitting(false);
      resetFeedbackForm();
    }
  };

  const toggleTrainingMode = () => {
    setEnableTrainingMode(prev => !prev);
  };

  const getProgressPercentage = () => {
    if (findings.length === 0) return 0;
    return ((currentFindingIndex + 1) / findings.length) * 100;
  };

  // If loading or no findings, render accordingly
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="flex flex-col items-center">
            <Clock className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">Loading AI findings...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (findings.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-6">
          <CheckCircle2 className="h-10 w-10 text-green-500 mb-2" />
          <p className="text-center">No AI findings available for review.</p>
          <p className="text-sm text-muted-foreground text-center mt-1">
            Upload new images to generate AI diagnoses.
          </p>
          <Button className="mt-4" variant="outline" disabled>
            <ImagePlus className="mr-2 h-4 w-4" />
            Upload new image
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentFinding = getCurrentFinding();

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center">
              <Brain className="mr-2 h-5 w-5 text-primary" />
              AI Feedback Trainer
            </CardTitle>
            <CardDescription>
              Help improve our AI by providing feedback on diagnoses
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="training-mode" className="text-sm text-muted-foreground">
              Training Mode
            </Label>
            <Switch
              id="training-mode"
              checked={enableTrainingMode}
              onCheckedChange={toggleTrainingMode}
            />
          </div>
        </div>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'current' | 'history')}>
        <div className="px-6">
          <TabsList className="w-full">
            <TabsTrigger value="current" className="flex-1">
              Current Finding
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1">
              Feedback History
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="current">
          <CardContent>
            {/* Progress indicator */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>
                  Finding {currentFindingIndex + 1} of {findings.length}
                </span>
                <span className="text-muted-foreground">
                  {feedbackItems.length} feedbacks provided
                </span>
              </div>
              <Progress value={getProgressPercentage()} className="h-2" />
            </div>

            {/* Current finding */}
            {currentFinding && (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <div>
                    <h3 className="text-lg font-medium">
                      Tooth #{currentFinding.tooth}: {currentFinding.type}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(currentFinding.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    variant={
                      currentFinding.severity === 'high' || currentFinding.severity === 'critical'
                        ? 'destructive'
                        : currentFinding.severity === 'medium'
                        ? 'secondary'
                        : 'outline'
                    }
                  >
                    {currentFinding.severity} severity
                  </Badge>
                </div>

                <div className="bg-muted p-3 rounded-md text-sm">
                  <p>{currentFinding.description}</p>
                  {currentFinding.location && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {Object.entries(currentFinding.location).map(([key, value]) => (
                        <Badge key={key} variant="outline" className="text-xs">
                          {key}: {value}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span>AI Confidence:</span>
                  <Progress
                    value={currentFinding.confidence * 100}
                    className={`h-2 ${
                      currentFinding.confidence >= 0.9
                        ? 'bg-green-500'
                        : currentFinding.confidence >= 0.7
                        ? 'bg-yellow-500'
                        : 'bg-orange-500'
                    }`}
                  />
                  <span className="font-medium">
                    {Math.round(currentFinding.confidence * 100)}%
                  </span>
                </div>

                {/* Existing feedback for this finding */}
                {hasExistingFeedback(currentFinding.id) && (
                  <div className="border rounded-md p-3 bg-muted/50">
                    <h4 className="text-sm font-medium flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      Previous Feedback
                    </h4>
                    {(() => {
                      const feedback = getFeedbackForFinding(currentFinding.id);
                      return feedback ? (
                        <div className="mt-2">
                          <div className="flex items-center text-sm">
                            <Badge
                              variant={feedback.is_correct ? 'outline' : 'destructive'}
                              className="mr-2"
                            >
                              {feedback.is_correct ? 'Correct' : 'Incorrect'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(feedback.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {!feedback.is_correct && feedback.correction_details && (
                            <p className="mt-1 text-sm">{feedback.correction_details}</p>
                          )}
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}

                {/* Feedback form */}
                {!hasExistingFeedback(currentFinding.id) && (
                  <div className="space-y-4 mt-4">
                    <div className="flex space-x-2">
                      <Button
                        variant={userFeedback.isCorrect === true ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1"
                        onClick={() =>
                          setUserFeedback(prev => ({ ...prev, isCorrect: true }))
                        }
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Correct
                      </Button>
                      <Button
                        variant={userFeedback.isCorrect === false ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1"
                        onClick={() =>
                          setUserFeedback(prev => ({ ...prev, isCorrect: false }))
                        }
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Incorrect
                      </Button>
                    </div>

                    {userFeedback.isCorrect === false && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="correction-type">Correction Type</Label>
                          <Select
                            value={userFeedback.correctionType}
                            onValueChange={(value) =>
                              setUserFeedback(prev => ({ ...prev, correctionType: value }))
                            }
                          >
                            <SelectTrigger id="correction-type">
                              <SelectValue placeholder="Select correction type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="false_positive">False Positive</SelectItem>
                              <SelectItem value="wrong_location">Wrong Location</SelectItem>
                              <SelectItem value="wrong_classification">Wrong Classification</SelectItem>
                              <SelectItem value="wrong_severity">Wrong Severity</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="correction-details">Details</Label>
                          <Textarea
                            id="correction-details"
                            placeholder="Please explain what is incorrect..."
                            value={userFeedback.correctionDetails}
                            onChange={(e) =>
                              setUserFeedback(prev => ({
                                ...prev,
                                correctionDetails: e.target.value,
                              }))
                            }
                            rows={3}
                          />
                        </div>
                      </>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="priority">How important is this feedback?</Label>
                      <Select
                        value={userFeedback.priority}
                        onValueChange={(value) =>
                          setUserFeedback(prev => ({
                            ...prev,
                            priority: value as 'low' | 'medium' | 'high',
                          }))
                        }
                      >
                        <SelectTrigger id="priority">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low - Minor issue</SelectItem>
                          <SelectItem value="medium">Medium - Notable issue</SelectItem>
                          <SelectItem value="high">High - Critical issue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Model metrics for trainers */}
            {enableTrainingMode && modelMetrics && (
              <div className="mt-6">
                <button
                  className="flex items-center justify-between w-full py-2 text-sm font-medium"
                  onClick={() => setShowMetrics(prev => !prev)}
                >
                  <div className="flex items-center">
                    <BarChart3 className="mr-2 h-4 w-4 text-primary" />
                    <span>AI Model Performance Metrics</span>
                  </div>
                  {showMetrics ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                {showMetrics && (
                  <div className="mt-2 p-3 bg-muted rounded-md text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-muted-foreground">Model Version</p>
                        <p className="font-medium">{modelMetrics.model_version}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Overall Accuracy</p>
                        <p className="font-medium">{(modelMetrics.accuracy * 100).toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">False Positives</p>
                        <p className="font-medium">{modelMetrics.false_positives}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">False Negatives</p>
                        <p className="font-medium">{modelMetrics.false_negatives}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Samples Analyzed</p>
                        <p className="font-medium">{modelMetrics.total_samples}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Last Trained</p>
                        <p className="font-medium">
                          {new Date(modelMetrics.last_trained).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={currentFindingIndex === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={currentFindingIndex === findings.length - 1}
              >
                Next
              </Button>
            </div>

            {!hasExistingFeedback(currentFinding?.id || '') && (
              <Button
                size="sm"
                onClick={handleSubmitFeedback}
                disabled={
                  submitting ||
                  userFeedback.isCorrect === null ||
                  (userFeedback.isCorrect === false &&
                    (!userFeedback.correctionType || !userFeedback.correctionDetails))
                }
              >
                {submitting ? (
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Submit Feedback
              </Button>
            )}
          </CardFooter>
        </TabsContent>

        <TabsContent value="history">
          <CardContent>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Feedback History</h3>
              
              {feedbackItems.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Archive className="h-8 w-8 mx-auto mb-2" />
                  <p>No feedback has been provided yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {feedbackItems.map(feedback => {
                    const relatedFinding = findings.find(f => f.id === feedback.finding_id);
                    if (!relatedFinding) return null;

                    return (
                      <div key={feedback.id} className="border rounded-md p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-medium">
                              Tooth #{relatedFinding.tooth}: {relatedFinding.type}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(feedback.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <Badge
                            variant={feedback.is_correct ? 'outline' : 'destructive'}
                          >
                            {feedback.is_correct ? 'Correct' : 'Incorrect'}
                          </Badge>
                        </div>

                        {!feedback.is_correct && (
                          <>
                            {feedback.correction_type && (
                              <div className="text-sm">
                                <span className="text-muted-foreground">Correction Type:</span>{' '}
                                <Badge variant="secondary" className="mt-1">
                                  {feedback.correction_type.replace('_', ' ')}
                                </Badge>
                              </div>
                            )}
                            {feedback.correction_details && (
                              <div className="mt-2 text-sm">
                                <span className="text-muted-foreground">Details:</span>
                                <p className="mt-1">{feedback.correction_details}</p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
}; 