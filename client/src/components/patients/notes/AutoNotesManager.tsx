import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mic, MicOff, Save, Check, Loader2 } from "lucide-react";
import { useVoiceToText } from "@/hooks/use-voice-to-text";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from '@/lib/api';

interface AutoNotesManagerProps {
  patientId: number;
  providerId: number;
  onNotePosted?: () => void;
}

type Template = {
  id: string;
  name: string;
  content: string;
  category: string;
};

const NOTE_TEMPLATES: Template[] = [
  {
    id: "soap-normal",
    name: "SOAP Note - Normal Visit",
    category: "soap",
    content: "S: Patient reports no issues or concerns. Regular checkup visit.\nO: Examination reveals healthy dentition. No signs of decay or periodontal disease.\nA: Healthy oral cavity with good hygiene practices.\nP: Continue regular 6-month cleaning and examination schedule."
  },
  {
    id: "soap-cavity",
    name: "SOAP Note - Cavity",
    category: "soap",
    content: "S: Patient reports sensitivity to cold in tooth region.\nO: Visual and radiographic examination reveals carious lesion.\nA: Dental caries requiring restoration.\nP: Schedule restorative appointment for composite filling."
  },
  {
    id: "procedure-filling",
    name: "Procedure - Composite Filling",
    category: "procedure",
    content: "Procedure: Composite filling\nTeeth: \nAnesthesia: 2% lidocaine with 1:100,000 epinephrine\nIsolation: Rubber dam\nPreparation: Class II preparation completed\nMaterials: 3M Filtek Supreme composite, 3M Single Bond adhesive\nCompletion: Restoration contoured, contacts verified, occlusion adjusted."
  },
  {
    id: "procedure-crown",
    name: "Procedure - Crown Prep",
    category: "procedure",
    content: "Procedure: Crown preparation\nTeeth: \nAnesthesia: 2% lidocaine with 1:100,000 epinephrine\nIsolation: Cotton rolls and retraction cord\nPreparation: Full coverage preparation with shoulder margin\nImpression: PVS material, dual-arch technique\nTemporary: Fabricated using bis-acryl material\nShade: \nLab: Sent to lab for fabrication."
  }
];

const AutoNotesManager: React.FC<AutoNotesManagerProps> = ({ patientId, providerId, onNotePosted }) => {
  const [noteContent, setNoteContent] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteType, setNoteType] = useState<string>("soap");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  
  const { 
    text: speechText, 
    isListening, 
    startListening, 
    stopListening, 
    resetText,
    hasRecognitionSupport,
    error: speechError
  } = useVoiceToText({
    continuous: true,
    language: 'en-US'
  });

  useEffect(() => {
    if (speechText) {
      setNoteContent(prev => `${prev}${prev ? ' ' : ''}${speechText}`);
    }
  }, [speechText]);

  const createNoteMutation = useMutation({
    mutationFn: async (newNote: {
      patientId: number;
      providerId: number;
      title: string;
      content: string;
      noteType: string;
    }) => {
      return apiRequest('/api/patient-notes', {
        method: 'POST',
        data: newNote
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-notes', patientId] });
      setNoteContent('');
      setNoteTitle('');
      resetText();
      
      // Call the onNotePosted callback if provided
      if (onNotePosted) {
        onNotePosted();
      }
    }
  });

  const generateAINoteContent = async () => {
    setIsGeneratingAI(true);
    try {
      const response = await fetch('/api/ai-generate/note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          patientId, 
          noteType,
          promptHint: noteTitle || noteType 
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setNoteContent(data.generatedContent);
      } else {
        console.error('Failed to generate AI note');
      }
    } catch (error) {
      console.error('Error generating AI note:', error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleApplyTemplate = (templateId: string) => {
    const template = NOTE_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setNoteContent(template.content);
      setNoteTitle(template.name);
      setNoteType(template.category);
    }
  };

  const handleSaveNote = () => {
    if (!noteContent.trim()) return;
    
    createNoteMutation.mutate({
      patientId,
      providerId,
      title: noteTitle || `${noteType.toUpperCase()} Note - ${new Date().toLocaleDateString()}`,
      content: noteContent,
      noteType
    });
  };

  const handleMicrophoneToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      resetText();
      startListening();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>New Patient Note</span>
          {hasRecognitionSupport && (
            <Button 
              variant={isListening ? "destructive" : "outline"} 
              size="sm"
              onClick={handleMicrophoneToggle}
            >
              {isListening ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
              {isListening ? 'Stop Dictation' : 'Start Dictation'}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="compose" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="compose">Compose</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="ai">AI Generate</TabsTrigger>
          </TabsList>
          
          <TabsContent value="compose" className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">Note Title</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Enter note title"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Note Type</label>
                <Select value={noteType} onValueChange={setNoteType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Note Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="soap">SOAP</SelectItem>
                    <SelectItem value="procedure">Procedure</SelectItem>
                    <SelectItem value="followup">Follow-up</SelectItem>
                    <SelectItem value="consultation">Consultation</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Note Content</label>
              <Textarea
                className="min-h-[200px]"
                placeholder={isListening ? "Listening for dictation..." : "Enter note content"}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
              />
              {speechError && <p className="text-sm text-destructive mt-1">{speechError}</p>}
              {isListening && <p className="text-xs text-muted-foreground mt-1">Speak clearly. Your words will appear here.</p>}
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button onClick={handleSaveNote} disabled={createNoteMutation.isPending}>
                {createNoteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Draft
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="templates">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Select a template to quickly create a structured note:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {NOTE_TEMPLATES.map((template) => (
                  <Card key={template.id} className="cursor-pointer hover:bg-accent/50" onClick={() => handleApplyTemplate(template.id)}>
                    <CardContent className="p-4">
                      <h3 className="font-medium">{template.name}</h3>
                      <p className="text-xs text-muted-foreground">{template.category}</p>
                      <div className="text-xs mt-2 line-clamp-3 text-muted-foreground">
                        {template.content.substring(0, 150)}...
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="ai">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Let AI generate a draft note based on the patient's history and your input.
              </p>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Prompt (optional)</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="E.g., 'Regular checkup' or 'Cavity on tooth 15'"
                />
              </div>
              
              <div>
                <Button 
                  onClick={generateAINoteContent} 
                  disabled={isGeneratingAI}
                  className="w-full"
                >
                  {isGeneratingAI ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Note...
                    </>
                  ) : (
                    'Generate AI Draft'
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AutoNotesManager;