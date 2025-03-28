import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { 
  Save, 
  Mic, 
  MicOff, 
  RefreshCw, 
  Brain,
  ClipboardCheck 
} from "lucide-react";

interface ChartData {
  restorative?: Record<string, { 
    surfaces: string[], 
    procedures: string[] 
  }>;
  perio?: Record<string, { 
    probing: number[], 
    bop: boolean[], 
    mobility: number, 
    furcation: number 
  }>;
}

interface AutoNoteBoxProps {
  patientId: string;
  title?: string;
  source: "charting" | "xray" | "ai" | "voice" | "manual";
  chartData?: ChartData;
  initialContent?: string;
  onSave?: (noteContent: string) => void;
}

export function AutoNoteBox({
  patientId,
  title = "Chart Note",
  source,
  chartData,
  initialContent = "",
  onSave
}: AutoNoteBoxProps) {
  const [content, setContent] = useState(initialContent);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize speech recognition
  useEffect(() => {
    // Check if browser supports SpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      
      recognitionInstance.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join("");
        
        setContent(prev => prev + " " + transcript);
      };
      
      recognitionInstance.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        toast({
          title: "Speech Recognition Error",
          description: `Error: ${event.error}`,
          variant: "destructive"
        });
      };
      
      setRecognition(recognitionInstance);
    }
    
    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, []);

  // Toggle voice recognition
  const toggleVoiceRecognition = () => {
    if (!recognition) {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser does not support speech recognition.",
        variant: "destructive"
      });
      return;
    }
    
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
      toast({
        title: "Voice Recording Started",
        description: "Speak clearly to record your note."
      });
    }
  };

  // Generate note from chart data
  const generateNoteFromChart = () => {
    if (!chartData) return;
    
    setIsGenerating(true);
    
    // Process restorative chart data
    let restorativeNote = "";
    if (chartData.restorative) {
      Object.entries(chartData.restorative).forEach(([tooth, data]) => {
        if (data.procedures && data.procedures.length > 0) {
          restorativeNote += `\n- Tooth #${tooth}: ${data.procedures.join(", ")}`;
          
          if (data.surfaces && data.surfaces.length > 0) {
            restorativeNote += ` (Surfaces: ${data.surfaces.join(", ")})`;
          }
        } else if (data.surfaces && data.surfaces.length > 0) {
          restorativeNote += `\n- Tooth #${tooth}: ${data.surfaces.join(", ")} surfaces`;
        }
      });
    }
    
    // Process perio chart data
    let perioNote = "";
    if (chartData.perio) {
      // Find teeth with deep pockets (≥4mm)
      const deepPocketTeeth = Object.entries(chartData.perio)
        .filter(([_, data]) => data.probing.some(depth => depth >= 4))
        .map(([tooth, data]) => {
          const maxDepth = Math.max(...data.probing);
          return `#${tooth} (${maxDepth}mm)`;
        });
      
      // Calculate BOP percentage
      let totalSites = 0;
      let bleedingSites = 0;
      
      Object.values(chartData.perio).forEach(data => {
        data.bop.forEach(isBleeding => {
          totalSites++;
          if (isBleeding) bleedingSites++;
        });
      });
      
      const bopPercentage = totalSites > 0 
        ? Math.round((bleedingSites / totalSites) * 100) 
        : 0;
      
      // Generate perio note
      if (deepPocketTeeth.length > 0) {
        perioNote += `\n- Periodontal pockets ≥4mm: ${deepPocketTeeth.join(", ")}`;
      }
      
      perioNote += `\n- Bleeding on probing: ${bopPercentage}%`;
      
      // Add mobility and furcation
      const teethWithMobility = Object.entries(chartData.perio)
        .filter(([_, data]) => data.mobility > 0)
        .map(([tooth, data]) => `#${tooth} (Class ${data.mobility})`);
      
      const teethWithFurcation = Object.entries(chartData.perio)
        .filter(([_, data]) => data.furcation > 0)
        .map(([tooth, data]) => `#${tooth} (Grade ${data.furcation})`);
      
      if (teethWithMobility.length > 0) {
        perioNote += `\n- Mobility: ${teethWithMobility.join(", ")}`;
      }
      
      if (teethWithFurcation.length > 0) {
        perioNote += `\n- Furcation: ${teethWithFurcation.join(", ")}`;
      }
    }
    
    // Construct complete note
    const today = new Date().toISOString().slice(0, 10);
    const noteTemplate = `CHART NOTE (${today})

RESTORATIVE FINDINGS:${restorativeNote || "\n- No restorative issues noted"}

PERIODONTAL FINDINGS:${perioNote || "\n- No periodontal issues noted"}

PLAN:
- 

PROVIDER NOTES:
- 
`;
    
    setContent(noteTemplate);
    setIsGenerating(false);
    
    toast({
      title: "Note Generated",
      description: "Chart data has been converted to a clinical note."
    });
  };

  // Save note to database
  const saveMutation = useMutation({
    mutationFn: async (note: {
      patientId: string;
      content: string;
      source: string;
      title: string;
    }) => {
      return apiRequest('/api/patient-notes', {
        method: 'POST',
        data: note
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/patients', patientId, 'notes'] });
      toast({
        title: "Note Saved",
        description: "Clinical note has been saved successfully."
      });
      
      if (onSave) {
        onSave(content);
      }
    },
    onError: (error) => {
      console.error("Error saving note:", error);
      toast({
        title: "Error Saving Note",
        description: "There was a problem saving your note. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Handle save
  const handleSave = () => {
    if (!content.trim()) {
      toast({
        title: "Empty Note",
        description: "Please enter some content before saving.",
        variant: "destructive"
      });
      return;
    }
    
    saveMutation.mutate({
      patientId,
      content: content.trim(),
      source,
      title: `${title} - ${new Date().toLocaleDateString()}`,
    });
  };

  // Copy to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied",
      description: "Note copied to clipboard."
    });
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center">
          <span>{title}</span>
          <div className="flex space-x-2">
            {chartData && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={generateNoteFromChart}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Brain className="h-4 w-4 mr-2" />
                )}
                Generate from Chart
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleVoiceRecognition}
              className={isListening ? "bg-red-100" : ""}
            >
              {isListening ? (
                <>
                  <MicOff className="h-4 w-4 mr-2" />
                  Stop Dictation
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  Dictate
                </>
              )}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter clinical notes here or use voice dictation..."
            className="min-h-[200px] font-mono text-sm"
          />
          
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={copyToClipboard}
            >
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button 
              variant="default" 
              size="sm"
              onClick={handleSave}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Note
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}