import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Mic,
  MicOff,
  Save,
  FileText,
  Check,
  RefreshCw,
  Edit,
  Copy,
  Clipboard,
  Play,
  Pause,
  Circle,
  Lock,
  AlertTriangle,
  ListChecks,
  MessageSquare,
  Stethoscope,
  ClipboardList
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from '@/components/ui/progress';

export function VoiceDictation() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [activeTab, setActiveTab] = useState('record');
  const [transcriptionText, setTranscriptionText] = useState('');
  const [formattedNotes, setFormattedNotes] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: ''
  });
  const [selectedPatient, setSelectedPatient] = useState('');
  const [autoGenerateEnabled, setAutoGenerateEnabled] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [notePreview, setNotePreview] = useState(false);
  const { toast } = useToast();
  
  // Mock patients data
  const patients = [
    { id: '1', name: 'John Doe', appointment: 'Cleaning & Exam' },
    { id: '2', name: 'Jane Smith', appointment: 'Root Canal Therapy' },
    { id: '3', name: 'Robert Johnson', appointment: 'Crown Preparation' },
    { id: '4', name: 'Sarah Williams', appointment: 'Implant Consultation' }
  ];
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      // In a real implementation, this would stop the voice recognition API
      if (autoGenerateEnabled) {
        generateSOAPNotes();
      }
    } else {
      if (!selectedPatient) {
        toast({
          title: "No patient selected",
          description: "Please select a patient before starting dictation.",
          variant: "destructive",
        });
        return;
      }
      
      setIsRecording(true);
      setRecordingTime(0);
      // In a real implementation, this would start the voice recognition API
    }
  };
  
  const generateSOAPNotes = () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    
    // Simulate the process of AI generating notes
    const interval = setInterval(() => {
      setGenerationProgress(prev => {
        const newProgress = prev + 5;
        
        if (newProgress >= 100) {
          clearInterval(interval);
          
          // Mock data for generated SOAP notes
          const mockNotes = {
            subjective: "Patient reports sensitivity on tooth #19 when consuming cold beverages. The discomfort began approximately two weeks ago and has gradually increased in intensity. Patient rates the pain as 5/10 and describes it as a sharp, brief sensation that subsides quickly after the stimulus is removed.",
            objective: "Clinical examination reveals a visible occlusal-distal cavity on tooth #19. Percussion test negative. Cold test positive with lingering sensitivity. X-ray shows radiolucency extending into the dentin but not approaching the pulp chamber. Periodontal probing depths are within normal limits.",
            assessment: "Diagnosis: Moderate caries on tooth #19 (occlusal-distal) with possible early pulpitis. The carious lesion has extended into the dentin layer but appears to have adequate remaining dentin thickness for pulpal protection.",
            plan: "Treatment plan: Composite restoration on tooth #19 (occlusal-distal) with composite resin (A2 shade). Local anesthesia: 1 carpule of 2% lidocaine with 1:100,000 epinephrine administered via infiltration. Procedure scheduled for next available appointment."
          };
          
          setFormattedNotes(mockNotes);
          setTranscriptionText(`Patient reports sensitivity on tooth #19 when consuming cold beverages. The discomfort began approximately two weeks ago and has gradually increased in intensity. Patient rates the pain as 5/10.

Clinical examination reveals a visible occlusal-distal cavity on tooth #19. Percussion test negative. Cold test positive with lingering sensitivity. X-ray shows radiolucency extending into the dentin but not approaching the pulp chamber.

Diagnosis: Moderate caries on tooth #19 (occlusal-distal) with possible early pulpitis.

Treatment plan: Composite restoration on tooth #19 (occlusal-distal) with composite resin (A2 shade). Local anesthesia: 1 carpule of 2% lidocaine with 1:100,000 epinephrine administered via infiltration.`);
          
          setActiveTab('notes');
          setIsGenerating(false);
          
          toast({
            title: "Notes generated",
            description: "AI has successfully generated SOAP-format clinical notes.",
            variant: "default",
          });
          
          return 100;
        }
        
        return newProgress;
      });
    }, 200);
  };
  
  const handleSaveNotes = () => {
    toast({
      title: "Notes saved",
      description: `Clinical notes have been saved to ${patients.find(p => p.id === selectedPatient)?.name}'s chart.`,
      variant: "default",
    });
  };
  
  const handleCopyNotes = () => {
    // In a real implementation, this would copy the notes to the clipboard
    toast({
      title: "Notes copied",
      description: "The formatted clinical notes have been copied to clipboard.",
      variant: "default",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">AI Voice Dictation</h2>
          <p className="text-muted-foreground">
            Automatically generate SOAP notes from your dictation
          </p>
        </div>
        
        <div className="flex-none">
          <Select
            value={selectedPatient}
            onValueChange={setSelectedPatient}
            disabled={isRecording}
          >
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Select patient" />
            </SelectTrigger>
            <SelectContent>
              {patients.map(patient => (
                <SelectItem key={patient.id} value={patient.id}>
                  {patient.name} - {patient.appointment}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="record" disabled={isGenerating}>
            <Mic className="h-4 w-4 mr-2" />
            Record
          </TabsTrigger>
          <TabsTrigger value="notes" disabled={isGenerating || !(formattedNotes.subjective || transcriptionText)}>
            <FileText className="h-4 w-4 mr-2" />
            Notes
          </TabsTrigger>
          <TabsTrigger value="settings" disabled={isRecording || isGenerating}>
            <ListChecks className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="record" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Voice Dictation</CardTitle>
              <CardDescription>
                Speak clearly and the AI will transcribe your words in real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isGenerating ? (
                <div className="space-y-4 py-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium">
                      {generationProgress < 30 ? "Transcribing audio..." : 
                       generationProgress < 60 ? "Analyzing clinical context..." :
                       generationProgress < 90 ? "Formatting SOAP notes..." :
                       "Finalizing documentation..."}
                    </p>
                    <p className="text-sm">{Math.round(generationProgress)}%</p>
                  </div>
                  <Progress value={generationProgress} />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className={`
                    p-6 rounded-lg border-2 border-dashed flex items-center justify-center flex-col
                    ${isRecording ? 'bg-red-50 border-red-200 animate-pulse' : 'bg-muted border-muted-foreground/20'}
                  `}>
                    <div className={`
                      w-16 h-16 rounded-full flex items-center justify-center mb-3 
                      ${isRecording ? 'bg-red-100' : 'bg-muted-foreground/10'}
                    `}>
                      {isRecording ? (
                        <Circle className="h-6 w-6 text-red-500 animate-pulse" fill="currentColor" />
                      ) : (
                        <Mic className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    
                    <p className="font-medium">
                      {isRecording ? (
                        <span className="text-red-700">Recording...</span>
                      ) : (
                        "Click the button below to start"
                      )}
                    </p>
                    
                    {isRecording && (
                      <>
                        <p className="text-sm text-muted-foreground mt-1">
                          AI is listening and transcribing
                        </p>
                        <div className="mt-3 font-mono text-xl">
                          {formatTime(recordingTime)}
                        </div>
                      </>
                    )}
                  </div>
                  
                  {transcriptionText && !isRecording && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">Transcription Preview</h3>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setTranscriptionText('')}>
                            Clear
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => generateSOAPNotes()}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Regenerate
                          </Button>
                        </div>
                      </div>
                      
                      <Textarea 
                        value={transcriptionText}
                        onChange={(e) => setTranscriptionText(e.target.value)}
                        className="min-h-[200px]"
                        placeholder="Transcription will appear here..."
                      />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button 
                size="lg"
                onClick={toggleRecording}
                variant={isRecording ? "destructive" : "default"}
                className="w-full md:w-auto"
                disabled={isGenerating || (!selectedPatient && !isRecording)}
              >
                {isRecording ? (
                  <>
                    <MicOff className="h-4 w-4 mr-2" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    Start Recording
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2 text-primary" />
                  Voice Commands
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">Try saying:</p>
                  <ul className="space-y-1">
                    <li className="flex items-center gap-2">
                      <Badge variant="outline">New paragraph</Badge>
                      <span className="text-muted-foreground">Starts a new paragraph</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="outline">Section subjective</Badge>
                      <span className="text-muted-foreground">Marks start of subjective section</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="outline">End note</Badge>
                      <span className="text-muted-foreground">Finalizes and saves the note</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Stethoscope className="h-5 w-5 mr-2 text-primary" />
                  Clinical Terms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  The AI is trained to recognize dental terminology, prescriptions, and procedure codes.
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <Badge variant="outline">D2390</Badge>
                  <Badge variant="outline">D3330</Badge>
                  <Badge variant="outline">Ibuprofen 800mg</Badge>
                  <Badge variant="outline">Amoxicillin 500mg</Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Lock className="h-5 w-5 mr-2 text-primary" />
                  HIPAA Compliant
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-2">
                  <div className="bg-green-50 p-1 rounded-full mt-0.5">
                    <Check className="h-3 w-3 text-green-600" />
                  </div>
                  <p className="text-xs">All audio is processed in real-time and never stored</p>
                </div>
                <div className="flex items-start gap-2 mt-2">
                  <div className="bg-green-50 p-1 rounded-full mt-0.5">
                    <Check className="h-3 w-3 text-green-600" />
                  </div>
                  <p className="text-xs">End-to-end encryption for all patient data</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>SOAP Notes</CardTitle>
                  <CardDescription>
                    {selectedPatient ? 
                      `AI-generated clinical notes for ${patients.find(p => p.id === selectedPatient)?.name}` : 
                      "AI-generated clinical notes"
                    }
                  </CardDescription>
                </div>
                
                <div className="flex gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={handleCopyNotes}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Copy notes</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={() => setNotePreview(!notePreview)}>
                          {notePreview ? (
                            <ClipboardList className="h-4 w-4" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{notePreview ? "Show SOAP format" : "Show preview"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={() => setActiveTab('record')}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit recording</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {notePreview ? (
                <div className="rounded-md border p-4 bg-muted/30">
                  <div className="space-y-4">
                    <div className="flex justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">
                          {patients.find(p => p.id === selectedPatient)?.name || "Patient Name"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {patients.find(p => p.id === selectedPatient)?.appointment || "Appointment Type"}
                        </p>
                      </div>
                      <p className="text-sm">{new Date().toLocaleDateString()}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <p>
                        {formattedNotes.subjective}
                      </p>
                      <p>
                        {formattedNotes.objective}
                      </p>
                      <p>
                        {formattedNotes.assessment}
                      </p>
                      <p>
                        {formattedNotes.plan}
                      </p>
                    </div>
                    
                    <div className="pt-2 text-sm">
                      <p>Note created by: Dr. [Current User]</p>
                      <p className="text-xs text-muted-foreground">
                        <em>This note was AI-assisted but fully reviewed and approved by the provider.</em>
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-semibold mr-2">S</Badge>
                      <h3 className="font-medium">Subjective</h3>
                    </div>
                    <Textarea 
                      value={formattedNotes.subjective}
                      onChange={(e) => setFormattedNotes({...formattedNotes, subjective: e.target.value})}
                      placeholder="Patient's reported symptoms and concerns..."
                      className="min-h-[100px]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-semibold mr-2">O</Badge>
                      <h3 className="font-medium">Objective</h3>
                    </div>
                    <Textarea 
                      value={formattedNotes.objective}
                      onChange={(e) => setFormattedNotes({...formattedNotes, objective: e.target.value})}
                      placeholder="Clinical findings, examination notes..."
                      className="min-h-[100px]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-semibold mr-2">A</Badge>
                      <h3 className="font-medium">Assessment</h3>
                    </div>
                    <Textarea 
                      value={formattedNotes.assessment}
                      onChange={(e) => setFormattedNotes({...formattedNotes, assessment: e.target.value})}
                      placeholder="Diagnosis and assessment..."
                      className="min-h-[100px]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 font-semibold mr-2">P</Badge>
                      <h3 className="font-medium">Plan</h3>
                    </div>
                    <Textarea 
                      value={formattedNotes.plan}
                      onChange={(e) => setFormattedNotes({...formattedNotes, plan: e.target.value})}
                      placeholder="Treatment plan, next steps, prescriptions..."
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="justify-between">
              <div className="flex items-center">
                <div className="flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <p className="text-xs text-muted-foreground">
                    Always review AI-generated notes before saving
                  </p>
                </div>
              </div>
              
              <Button onClick={handleSaveNotes}>
                <Save className="h-4 w-4 mr-2" />
                Save to Patient Chart
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Voice Dictation Settings</CardTitle>
              <CardDescription>
                Configure AI behavior and dictation preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-generate" className="flex flex-col space-y-1">
                    <span>Auto-generate SOAP Notes</span>
                    <span className="font-normal text-sm text-muted-foreground">
                      Automatically format notes when recording stops
                    </span>
                  </Label>
                  <Switch
                    id="auto-generate"
                    checked={autoGenerateEnabled}
                    onCheckedChange={setAutoGenerateEnabled}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-pause" className="flex flex-col space-y-1">
                    <span>Smart Pause Detection</span>
                    <span className="font-normal text-sm text-muted-foreground">
                      AI will automatically pause recording during sensitive discussions
                    </span>
                  </Label>
                  <Switch
                    id="auto-pause"
                    defaultChecked
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="code-suggestion" className="flex flex-col space-y-1">
                    <span>Auto-suggest CDT/ICD Codes</span>
                    <span className="font-normal text-sm text-muted-foreground">
                      AI will recommend appropriate billing codes based on dictation
                    </span>
                  </Label>
                  <Switch
                    id="code-suggestion"
                    defaultChecked
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Language</Label>
                <Select defaultValue="en-US">
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en-US">English (US)</SelectItem>
                    <SelectItem value="en-GB">English (UK)</SelectItem>
                    <SelectItem value="es-ES">Spanish</SelectItem>
                    <SelectItem value="fr-FR">French</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Voice recognition language setting (does not affect note output)
                </p>
              </div>
              
              <div className="pt-2">
                <div className="p-3 border rounded-md bg-amber-50 border-amber-200">
                  <div className="flex gap-2">
                    <div className="flex-shrink-0 mt-0.5">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-amber-800">Privacy Notice</h4>
                      <p className="text-xs text-amber-700">
                        Voice recordings are processed in real-time and never stored. All transcriptions follow 
                        HIPAA guidelines and are encrypted end-to-end. AI-generated notes are stored only within 
                        your secure practice management system.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Voice Command Shortcuts</CardTitle>
              <CardDescription>
                Custom commands to improve dictation workflow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 rounded-md bg-muted">
                  <div className="flex gap-2 items-center">
                    <Badge>Add post-op instructions</Badge>
                    <span className="text-sm text-muted-foreground">Adds standard post-op care text</span>
                  </div>
                  <Button variant="ghost" size="sm">Edit</Button>
                </div>
                
                <div className="flex items-center justify-between p-2 rounded-md bg-muted">
                  <div className="flex gap-2 items-center">
                    <Badge>Prescribe amoxicillin</Badge>
                    <span className="text-sm text-muted-foreground">Adds standard antibiotic prescription</span>
                  </div>
                  <Button variant="ghost" size="sm">Edit</Button>
                </div>
                
                <div className="flex items-center justify-between p-2 rounded-md bg-muted">
                  <div className="flex gap-2 items-center">
                    <Badge>Schedule follow-up</Badge>
                    <span className="text-sm text-muted-foreground">Adds follow-up booking information</span>
                  </div>
                  <Button variant="ghost" size="sm">Edit</Button>
                </div>
                
                <div className="flex justify-center pt-3">
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Custom Command
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}