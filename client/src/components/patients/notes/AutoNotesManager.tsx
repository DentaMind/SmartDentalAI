import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useVoiceToText } from '@/hooks/use-voice-to-text';
import { Mic, MicOff, Save, Wand2, FileText, Bot, Clipboard } from 'lucide-react';

// The types of notes that can be created
const NOTE_TYPES = [
  { value: 'soap', label: 'SOAP Note' },
  { value: 'procedure', label: 'Procedure Note' },
  { value: 'followup', label: 'Follow-up Note' },
  { value: 'consultation', label: 'Consultation Note' },
  { value: 'general', label: 'General Note' }
];

// The categories that notes can be assigned to
const CATEGORIES = [
  { value: 'restorative', label: 'Restorative' },
  { value: 'periodontal', label: 'Periodontal' },
  { value: 'orthodontic', label: 'Orthodontic' },
  { value: 'endodontic', label: 'Endodontic' },
  { value: 'surgical', label: 'Surgical' },
  { value: 'prosthodontic', label: 'Prosthodontic' },
  { value: 'pediatric', label: 'Pediatric' },
  { value: 'preventive', label: 'Preventive' }
];

// Props for the component
interface AutoNotesManagerProps {
  patientId: number;
}

const AutoNotesManager: React.FC<AutoNotesManagerProps> = ({ patientId }) => {
  // State for the note being created
  const [content, setContent] = useState('');
  const [noteType, setNoteType] = useState<string>('general');
  const [category, setCategory] = useState<string>('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Voice-to-text functionality using custom hook
  const { 
    transcript, 
    isListening, 
    error: voiceError, 
    startRecording, 
    stopRecording, 
    reset, 
    processCommands 
  } = useVoiceToText();

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update content with transcript when it changes
  useEffect(() => {
    if (transcript) {
      const processedText = processCommands(transcript);
      setContent(prevContent => prevContent + (prevContent ? '\n' : '') + processedText);
    }
  }, [transcript, processCommands]);

  // Mutation for creating a new patient note
  const createNoteMutation = useMutation({
    mutationFn: async (noteData: any) => {
      const response = await fetch(`/api/patients/${patientId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(noteData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create note');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Clear the form
      setContent('');
      setNoteType('general');
      setCategory('');
      setIsPrivate(false);
      setAiGenerated(false);
      setIsExpanded(false);
      
      // Invalidate queries to refresh the notes list
      queryClient.invalidateQueries({ queryKey: ['patient-notes', patientId] });
      
      toast({
        title: 'Note Created',
        description: 'The note has been saved as a draft.',
        variant: 'default'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create note: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      });
    }
  });

  // Generate an AI-powered note
  const generateAiNote = async () => {
    if (!noteType) {
      toast({
        title: 'Missing Information',
        description: 'Please select a note type before generating AI content.',
        variant: 'default'
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Simulate AI note generation (replace with real API call)
      const response = await fetch(`/api/ai/generate-note`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        data: JSON.stringify({
          patientId,
          noteType,
          category,
          existingContent: content
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate AI content');
      }
      
      const result = await response.json();
      
      // Add AI generated content to existing content
      setContent(prev => {
        if (prev && prev.trim()) {
          return `${prev}\n\n${result.content}`;
        }
        return result.content;
      });
      
      setAiGenerated(true);
      
      toast({
        title: 'AI Content Generated',
        description: 'The note has been enhanced with AI-generated content.',
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to generate AI content: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle saving the note
  const handleSaveNote = () => {
    if (!content.trim()) {
      toast({
        title: 'Missing Content',
        description: 'Please add some content to your note before saving.',
        variant: 'default'
      });
      return;
    }
    
    // Create the note object
    const noteData = {
      patientId,
      content: content.trim(),
      noteType: noteType || null,
      category: category || null,
      private: isPrivate,
      aiGenerated,
      status: 'draft',
      tags: []
    };
    
    // Send mutation request
    createNoteMutation.mutate(noteData);
  };

  // Check if we can see the voice recording option (browser support)
  const canUseVoice = typeof window !== 'undefined' && 'webkitSpeechRecognition' in window;

  // Handle toggling voice recording
  const toggleRecording = () => {
    if (isListening) {
      stopRecording();
    } else {
      reset();
      startRecording();
    }
  };

  // Handle note template selection (simplified version)
  const handleTemplateSelect = (templateKey: string) => {
    // Simplified template system - in a real implementation, these would be loaded from the API
    const templates: Record<string, string> = {
      'comprehensive-exam': `COMPREHENSIVE EXAMINATION NOTE\n\nChief Complaint: \nHistory of Present Illness: \nRelevant Medical History: \nClinical Findings: \nDiagnosis: \nTreatment Plan: `,
      'perio-eval': `PERIODONTAL EVALUATION\n\nProbing Depths: \nRecession: \nFurcation Involvement: \nBleeding Points: \nPlaque Score: \nClinical Impression: \nTreatment Recommendations: `,
      'restorative': `RESTORATIVE PROCEDURE NOTE\n\nTeeth: \nProcedure: \nMaterials Used: \nAnesthesia: \nIsolation Method: \nPulpal Status: \nPost-op Instructions: `,
      'hygiene': `DENTAL HYGIENE VISIT\n\nProcedures Performed: \nFluoride Applied: \nOral Hygiene Assessment: \nHome Care Instructions: \nNext Recommended Cleaning: `
    };
    
    const template = templates[templateKey] || '';
    
    if (template) {
      // If there's already content, add a line break
      setContent(prev => prev ? `${prev}\n\n${template}` : template);
      
      // Set appropriate note type and category based on template
      if (templateKey === 'comprehensive-exam') {
        setNoteType('consultation');
        setCategory('general');
      } else if (templateKey === 'perio-eval') {
        setNoteType('soap');
        setCategory('periodontal');
      } else if (templateKey === 'restorative') {
        setNoteType('procedure');
        setCategory('restorative');
      } else if (templateKey === 'hygiene') {
        setNoteType('procedure');
        setCategory('preventive');
      }
      
      toast({
        title: 'Template Applied',
        description: 'The selected template has been added to your note.',
        variant: 'default'
      });
    }
  };

  // Render the component
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {isExpanded ? 'Create a New Patient Note' : 'Quick Note'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? 'Minimize' : 'Expand'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {!isExpanded ? (
          <div className="flex flex-col gap-4">
            <Textarea
              placeholder="Add a quick note for this patient..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {canUseVoice && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleRecording}
                    className={isListening ? 'bg-red-50 text-red-600 border-red-200' : ''}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="h-4 w-4 mr-1 animate-pulse" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4 mr-1" />
                        Record
                      </>
                    )}
                  </Button>
                )}
                <Select value={noteType} onValueChange={setNoteType}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Note Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTE_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSaveNote} disabled={!content.trim() || createNoteMutation.isPending}>
                {createNoteMutation.isPending ? 'Saving...' : 'Save Draft'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Full expanded note creation interface */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="note-type">Note Type</Label>
                  <Select value={noteType} onValueChange={setNoteType}>
                    <SelectTrigger id="note-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {NOTE_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is-private"
                      checked={isPrivate}
                      onCheckedChange={setIsPrivate}
                    />
                    <Label htmlFor="is-private">Private Note</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="ai-generated"
                      checked={aiGenerated}
                      onCheckedChange={setAiGenerated}
                    />
                    <Label htmlFor="ai-generated">AI Assisted</Label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <Label>Templates</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTemplateSelect('comprehensive-exam')}
                    className="justify-start"
                  >
                    <Clipboard className="h-4 w-4 mr-2" />
                    Comprehensive Exam
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTemplateSelect('perio-eval')}
                    className="justify-start"
                  >
                    <Clipboard className="h-4 w-4 mr-2" />
                    Perio Evaluation
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTemplateSelect('restorative')}
                    className="justify-start"
                  >
                    <Clipboard className="h-4 w-4 mr-2" />
                    Restorative
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTemplateSelect('hygiene')}
                    className="justify-start"
                  >
                    <Clipboard className="h-4 w-4 mr-2" />
                    Hygiene Visit
                  </Button>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Label>Tools</Label>
                  <div className="flex flex-wrap gap-2">
                    {canUseVoice && (
                      <Button
                        variant={isListening ? "destructive" : "outline"}
                        size="sm"
                        onClick={toggleRecording}
                      >
                        {isListening ? (
                          <>
                            <MicOff className="h-4 w-4 mr-1 animate-pulse" />
                            Stop Recording
                          </>
                        ) : (
                          <>
                            <Mic className="h-4 w-4 mr-1" />
                            Record Voice
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateAiNote}
                      disabled={isGenerating}
                    >
                      <Bot className="h-4 w-4 mr-1" />
                      {isGenerating ? 'Generating...' : 'Generate with AI'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="content">Note Content</Label>
              <Textarea
                id="content"
                placeholder="Enter the note content here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                className="min-h-[200px] resize-vertical"
              />
            </div>
            
            {voiceError && (
              <div className="text-sm text-red-500">
                Voice recognition error: {voiceError}
              </div>
            )}
            
            {isListening && (
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold">Listening:</span> {transcript || 'Say something...'}
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setContent('');
                  setNoteType('general');
                  setCategory('');
                  setIsPrivate(false);
                  setAiGenerated(false);
                }}
              >
                Clear
              </Button>
              <Button
                variant="default"
                onClick={handleSaveNote}
                disabled={!content.trim() || createNoteMutation.isPending}
              >
                <Save className="h-4 w-4 mr-1" />
                {createNoteMutation.isPending ? 'Saving...' : 'Save Draft'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AutoNotesManager;