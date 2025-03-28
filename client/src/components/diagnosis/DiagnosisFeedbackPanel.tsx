import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Mic, AlertTriangle } from "lucide-react";

interface DiagnosisFeedbackPanelProps {
  patientId: string;
  onDiagnosisComplete?: () => void;
}

export default function DiagnosisFeedbackPanel({ patientId, onDiagnosisComplete }: DiagnosisFeedbackPanelProps) {
  const [diagnosisData, setDiagnosisData] = useState<any>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const [reasoningOverride, setReasoningOverride] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  let recognition: any;

  useEffect(() => {
    fetchDiagnosis();
  }, [patientId]);

  const fetchDiagnosis = async () => {
    try {
      const res = await axios.get(`/api/diagnosis/${patientId}`);
      setDiagnosisData(res.data);
    } catch (err) {
      setError("Failed to load diagnosis data. Please try again later.");
      console.error("Error fetching diagnosis:", err);
    }
  };

  const submitFeedback = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`/api/diagnosis/${patientId}/feedback`, {
        selected,
        feedback,
        reasoningOverride
      });
      
      toast({
        title: "Feedback Submitted",
        description: "Your feedback has been saved and will help improve future diagnoses."
      });
      
      // If the submission was successful and onDiagnosisComplete is provided, call it
      if (onDiagnosisComplete) {
        onDiagnosisComplete();
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "There was a problem submitting your feedback."
      });
    } finally {
      setLoading(false);
    }
  };

  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast({ title: "Unsupported", description: "Voice input is not supported in this browser." });
      return;
    }
    
    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setFeedback((prev) => prev + ' ' + transcript);
    };

    recognition.onerror = () => setRecording(false);
    recognition.onend = () => setRecording(false);

    recognition.start();
    setRecording(true);
  };

  if (error) {
    return (
      <Card className="p-4">
        <div className="flex items-center text-amber-600 gap-2 mb-4">
          <AlertTriangle size={18} />
          <span>Error</span>
        </div>
        <p>{error}</p>
        <Button variant="outline" className="mt-4" onClick={fetchDiagnosis}>
          Retry
        </Button>
      </Card>
    );
  }

  if (!diagnosisData) {
    return <div className="p-4 text-center">Loading diagnosis data...</div>;
  }

  return (
    <Card className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">AI Diagnosis Suggestions</h2>
      
      {diagnosisData.suggestions && diagnosisData.suggestions.length > 0 ? (
        diagnosisData.suggestions.map((item: any, i: number) => (
          <div
            key={i}
            className={`p-3 rounded border cursor-pointer ${selected === item.label ? "border-green-600 bg-green-50" : "border-gray-300"}`}
            onClick={() => setSelected(item.label)}
          >
            <div className="flex justify-between items-center">
              <strong>{item.label}</strong>
              <Badge>{item.confidence}%</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Reasoning: {item.reasoning}</p>
          </div>
        ))
      ) : (
        <div className="text-center p-4 border rounded-md text-muted-foreground">
          No diagnosis suggestions available. Please check the patient's data.
        </div>
      )}

      <Textarea
        placeholder="Optional feedback or reason for override..."
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        className="min-h-[80px]"
      />

      <Textarea
        placeholder="Optional: Your reasoning or alternate diagnosis explanation"
        value={reasoningOverride}
        onChange={(e) => setReasoningOverride(e.target.value)}
        className="min-h-[60px]"
      />

      <div className="flex items-center gap-2">
        <Button disabled={!selected || loading} onClick={submitFeedback}>
          {loading ? "Submitting..." : "Submit Feedback"}
        </Button>
        <Button variant="outline" onClick={startVoiceInput} disabled={recording}>
          <Mic className="w-4 h-4 mr-2" /> {recording ? "Listening..." : "Voice Input"}
        </Button>
      </div>
    </Card>
  );
}