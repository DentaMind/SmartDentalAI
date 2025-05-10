import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, ThumbsUp, ThumbsDown, ArrowUpFromLine } from "lucide-react";

interface AIRecommendation {
  id: string;
  aiDomain: 'diagnosis' | 'treatment' | 'xray' | 'financial' | 'scheduling' | 'communication';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  impact: string;
  implementation: string;
  dateCreated: Date;
  status: 'pending' | 'approved' | 'rejected' | 'implemented';
}

export function AIRecommendations() {
  const { toast } = useToast();
  const [userFeedback, setUserFeedback] = useState("");
  
  // Mock data - in a real implementation, this would come from the AI
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([
    {
      id: "rec-1",
      aiDomain: "diagnosis",
      title: "Enhanced Periodontal Disease Detection",
      description: "Integrate deeper analysis of gum recession patterns with bone loss indicators for more accurate periodontal disease staging.",
      severity: "medium",
      impact: "Would improve early detection of periodontal disease by approximately 22% based on comparative studies.",
      implementation: "Add new analysis parameters to the periodontal chart scoring system and train model on additional 500 cases.",
      dateCreated: new Date(),
      status: "pending"
    },
    {
      id: "rec-2",
      aiDomain: "xray",
      title: "Improved Root Fracture Detection Algorithm",
      description: "Current system has 78% accuracy for detecting vertical root fractures. Implement wavelet transformation pre-processing to enhance detection.",
      severity: "high",
      impact: "Could increase fracture detection accuracy by 11-15% and reduce false negatives in endodontic cases.",
      implementation: "Requires updating image preprocessing pipeline and retraining model with 300+ annotated fracture cases.",
      dateCreated: new Date(),
      status: "pending"
    },
    {
      id: "rec-3",
      aiDomain: "financial",
      title: "Predictive Insurance Coverage Analysis",
      description: "Add capability to predict insurance coverage probability for advanced procedures based on historical claim data.",
      severity: "low",
      impact: "Could reduce unexpected patient payments by providing more accurate cost estimates before treatment.",
      implementation: "Create a new ML model trained on anonymized claim approval/denial patterns from major insurance providers.",
      dateCreated: new Date(),
      status: "pending"
    }
  ]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'implemented': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleApprove = (id: string) => {
    setRecommendations(recommendations.map(rec => 
      rec.id === id ? { ...rec, status: 'approved' } : rec
    ));
    toast({
      title: "Recommendation approved",
      description: "The AI recommendation has been approved for implementation.",
    });
  };

  const handleReject = (id: string) => {
    setRecommendations(recommendations.map(rec => 
      rec.id === id ? { ...rec, status: 'rejected' } : rec
    ));
    toast({
      title: "Recommendation rejected",
      description: "The AI recommendation has been rejected.",
    });
  };

  const handleImplement = (id: string) => {
    setRecommendations(recommendations.map(rec => 
      rec.id === id ? { ...rec, status: 'implemented' } : rec
    ));
    toast({
      title: "Marked as implemented",
      description: "The AI recommendation has been marked as implemented.",
    });
  };

  const handleSubmitFeedback = () => {
    if (!userFeedback.trim()) {
      toast({
        title: "Feedback is empty",
        description: "Please provide some feedback before submitting.",
        variant: "destructive"
      });
      return;
    }

    // In a real implementation, this would send the feedback to the server
    toast({
      title: "Feedback submitted",
      description: "Your feedback has been sent to the AI team. Thank you!",
    });
    setUserFeedback("");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">AI Self-Improvement Recommendations</h2>
          <p className="text-gray-500">
            AI-generated suggestions to enhance system performance and capabilities
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1 flex items-center gap-1">
          <Lightbulb className="h-4 w-4" />
          <span>{recommendations.length} Recommendations</span>
        </Badge>
      </div>

      {/* User feedback section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Submit Your Improvement Idea</CardTitle>
          <CardDescription>
            Share your thoughts on how we can improve our AI systems
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea 
            placeholder="Describe your idea for improving our AI systems..." 
            value={userFeedback}
            onChange={(e) => setUserFeedback(e.target.value)}
            rows={4}
          />
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleSubmitFeedback}
            className="bg-primary text-white hover:bg-primary-600 flex items-center gap-2"
          >
            <ArrowUpFromLine className="h-4 w-4" />
            Submit Feedback
          </Button>
        </CardFooter>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((recommendation) => (
          <Card key={recommendation.id} className="overflow-hidden border-l-4" style={{ 
            borderLeftColor: recommendation.status === 'implemented' ? '#9333ea' : 
                             recommendation.status === 'approved' ? '#22c55e' : 
                             recommendation.status === 'rejected' ? '#ef4444' : 
                             recommendation.severity === 'high' ? '#ef4444' : 
                             recommendation.severity === 'medium' ? '#eab308' : '#3b82f6'
          }}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{recommendation.title}</CardTitle>
                <div className="flex space-x-2">
                  <Badge 
                    variant="secondary" 
                    className={getSeverityColor(recommendation.severity)}
                  >
                    {recommendation.severity.charAt(0).toUpperCase() + recommendation.severity.slice(1)} Priority
                  </Badge>
                  <Badge 
                    variant="secondary" 
                    className={getStatusColor(recommendation.status)}
                  >
                    {recommendation.status.charAt(0).toUpperCase() + recommendation.status.slice(1)}
                  </Badge>
                </div>
              </div>
              <Badge variant="outline" className="w-fit">
                {recommendation.aiDomain.charAt(0).toUpperCase() + recommendation.aiDomain.slice(1)} AI
              </Badge>
              <CardDescription className="text-sm mt-1">
                {recommendation.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-0">
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Expected Impact</h4>
                  <p className="text-sm">{recommendation.impact}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Implementation Notes</h4>
                  <p className="text-sm">{recommendation.implementation}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-4 pb-4 flex justify-end space-x-2">
              {recommendation.status === 'pending' && (
                <>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleReject(recommendation.id)}
                    className="flex items-center gap-1"
                  >
                    <ThumbsDown className="h-4 w-4" />
                    Reject
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => handleApprove(recommendation.id)}
                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    Approve
                  </Button>
                </>
              )}
              {recommendation.status === 'approved' && (
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => handleImplement(recommendation.id)}
                  className="flex items-center gap-1"
                >
                  Mark as Implemented
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}