import React, { useState, useEffect, useRef } from 'react';
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
  ClipboardList,
  Plus
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
import speechRecognitionService from '@/lib/speech-recognition';

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
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const { toast } = useToast();
  
  // Timer ref for recording duration
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Mock patients data
  const patients = [
    { id: '1', name: 'John Doe', appointment: 'Cleaning & Exam' },
    { id: '2', name: 'Jane Smith', appointment: 'Root Canal Therapy' },
    { id: '3', name: 'Robert Johnson', appointment: 'Crown Preparation' },
    { id: '4', name: 'Sarah Williams', appointment: 'Implant Consultation' }
  ];
  
  // Available recognition languages
  const languages = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'es-ES', name: 'Spanish' },
    { code: 'fr-FR', name: 'French' },
    { code: 'de-DE', name: 'German' },
    { code: 'zh-CN', name: 'Chinese (Simplified)' },
    { code: 'ja-JP', name: 'Japanese' },
    { code: 'ru-RU', name: 'Russian' },
    { code: 'hi-IN', name: 'Hindi' },
    { code: 'ar-SA', name: 'Arabic' }
  ];
  
  useEffect(() => {
    // Initialize speech recognition handlers
    speechRecognitionService.onResult = (text) => {
      setTranscriptionText(text);
    };
    
    speechRecognitionService.onEnd = () => {
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // If auto-generate is enabled, generate SOAP notes when recording ends
      if (autoGenerateEnabled && transcriptionText.trim().length > 0) {
        generateSOAPNotes();
      }
    };
    
    speechRecognitionService.onError = (error) => {
      toast({
        title: "Speech Recognition Error",
        description: `An error occurred: ${error}. Please try again.`,
        variant: "destructive",
      });
      
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    
    // Cleanup on component unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      if (speechRecognitionService.isListening) {
        speechRecognitionService.stop();
      }
    };
  }, [autoGenerateEnabled, toast, transcriptionText]);
  
  // Recording timer effect
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording
      speechRecognitionService.stop();
      setIsRecording(false);
    } else {
      // Start recording
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
      
      // Clear previous transcription if starting a new recording session
      if (transcriptionText.trim() === '') {
        setTranscriptionText('');
      }
      
      // Start speech recognition with the selected language
      speechRecognitionService.start(selectedLanguage);
    }
  };
  
  const generateSOAPNotes = () => {
    if (transcriptionText.trim() === '') {
      toast({
        title: "Empty transcription",
        description: "Cannot generate notes from empty transcription.",
        variant: "destructive",
      });
      return;
    }
    
    setIsGenerating(true);
    setGenerationProgress(0);
    
    // Simulate the process of AI generating notes
    const interval = setInterval(() => {
      setGenerationProgress(prev => {
        const newProgress = prev + 5;
        
        if (newProgress >= 100) {
          clearInterval(interval);
          
          // Use the transcription to generate structured notes
          // In a real implementation, this would call an AI service
          const formattedResult = processTranscriptionToSOAP(transcriptionText);
          
          setFormattedNotes(formattedResult);
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
  
  const processTranscriptionToSOAP = (text: string) => {
    // This is a simple implementation that would be replaced by a real AI service
    // that properly structures clinical notes in SOAP format
    
    const sections = {
      subjective: "",
      objective: "",
      assessment: "",
      plan: ""
    };
    
    // Simple rule-based categorization
    const lines = text.split('\n');
    let currentSection = 'subjective'; // Default starting section
    
    for (const line of lines) {
      // Check for section markers
      const lowerLine = line.toLowerCase();
      
      if (lowerLine.includes('subjective') || lowerLine.includes('chief complaint') || lowerLine.includes('patient reports')) {
        currentSection = 'subjective';
        // Skip this line if it's just a section header
        if (lowerLine.trim() === 'subjective:') continue;
      } 
      else if (lowerLine.includes('objective') || lowerLine.includes('examination') || lowerLine.includes('clinical findings')) {
        currentSection = 'objective';
        if (lowerLine.trim() === 'objective:') continue;
      }
      else if (lowerLine.includes('assessment') || lowerLine.includes('diagnosis')) {
        currentSection = 'assessment';
        if (lowerLine.trim() === 'assessment:') continue;
      }
      else if (lowerLine.includes('plan') || lowerLine.includes('treatment') || lowerLine.includes('recommendation')) {
        currentSection = 'plan';
        if (lowerLine.trim() === 'plan:') continue;
      }
      
      // Add line to the appropriate section
      if (line.trim() !== '') {
        sections[currentSection as keyof typeof sections] += 
          (sections[currentSection as keyof typeof sections] ? '\n' : '') + line.trim();
      }
    }
    
    // Ensure each section has content
    if (!sections.subjective) {
      sections.subjective = "No subjective information provided.";
    }
    
    if (!sections.objective) {
      sections.objective = "No objective findings recorded.";
    }
    
    if (!sections.assessment) {
      sections.assessment = "Assessment pending further evaluation.";
    }
    
    if (!sections.plan) {
      sections.plan = "Treatment plan to be determined following complete evaluation.";
    }
    
    return sections;
  };
  
  const handleSaveNotes = () => {
    // In a real implementation, this would save the notes to the patient's record in the database
    toast({
      title: "Notes saved",
      description: `Clinical notes have been saved to ${patients.find(p => p.id === selectedPatient)?.name}'s chart.`,
      variant: "default",
    });
  };
  
  const handleCopyNotes = () => {
    // In a real implementation, this would copy the notes to the clipboard
    const formattedSOAP = `SUBJECTIVE:\n${formattedNotes.subjective}\n\nOBJECTIVE:\n${formattedNotes.objective}\n\nASSESSMENT:\n${formattedNotes.assessment}\n\nPLAN:\n${formattedNotes.plan}`;
    
    navigator.clipboard.writeText(formattedSOAP).then(() => {
      toast({
        title: "Notes copied",
        description: "The formatted clinical notes have been copied to clipboard.",
        variant: "default",
      });
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      toast({
        title: "Copy failed",
        description: "Unable to copy notes to clipboard.",
        variant: "destructive",
      });
    });
  };
  
  const resetRecording = () => {
    if (isRecording) {
      speechRecognitionService.stop();
    }
    
    setIsRecording(false);
    setRecordingTime(0);
    setTranscriptionText('');
    setFormattedNotes({
      subjective: '',
      objective: '',
      assessment: '',
      plan: ''
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
                  
                  {transcriptionText && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">Transcription Preview</h3>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setTranscriptionText('')}
                            disabled={isRecording}
                          >
                            Clear
                          </Button>
                          {!isRecording && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => generateSOAPNotes()}
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Regenerate
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <Textarea 
                        value={transcriptionText}
                        onChange={(e) => setTranscriptionText(e.target.value)}
                        className="min-h-[200px]"
                        placeholder="Transcription will appear here..."
                        readOnly={isRecording}
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
                  <p className="text-xs">Private secure processing with multi-layer encryption</p>
                </div>
                <div className="flex items-start gap-2 mt-2">
                  <div className="bg-green-50 p-1 rounded-full mt-0.5">
                    <Check className="h-3 w-3 text-green-600" />
                  </div>
                  <p className="text-xs">Complies with all HIPAA requirements for PHI</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI-Generated SOAP Notes</CardTitle>
              <CardDescription>
                Review and edit the AI-generated notes before saving
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!notePreview ? (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-semibold mr-2">S</Badge>
                        <h3 className="font-medium">Subjective</h3>
                      </div>
                      <Textarea 
                        value={formattedNotes.subjective}
                        onChange={(e) => setFormattedNotes({...formattedNotes, subjective: e.target.value})}
                        placeholder="Patient's reported symptoms, complaints, and history..."
                        className="min-h-[100px]"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-semibold mr-2">O</Badge>
                        <h3 className="font-medium">Objective</h3>
                      </div>
                      <Textarea 
                        value={formattedNotes.objective}
                        onChange={(e) => setFormattedNotes({...formattedNotes, objective: e.target.value})}
                        placeholder="Clinical findings, examination results, measurements..."
                        className="min-h-[100px]"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-semibold mr-2">A</Badge>
                        <h3 className="font-medium">Assessment</h3>
                      </div>
                      <Textarea 
                        value={formattedNotes.assessment}
                        onChange={(e) => setFormattedNotes({...formattedNotes, assessment: e.target.value})}
                        placeholder="Diagnosis, interpretation of findings..."
                        className="min-h-[100px]"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
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
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <h3 className="text-blue-700">SUBJECTIVE</h3>
                    <p>{formattedNotes.subjective}</p>
                    
                    <h3 className="text-green-700 mt-4">OBJECTIVE</h3>
                    <p>{formattedNotes.objective}</p>
                    
                    <h3 className="text-amber-700 mt-4">ASSESSMENT</h3>
                    <p>{formattedNotes.assessment}</p>
                    
                    <h3 className="text-purple-700 mt-4">PLAN</h3>
                    <p>{formattedNotes.plan}</p>
                  </div>
                )}
              </div>
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
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setNotePreview(!notePreview)}>
                  {notePreview ? <Edit className="h-4 w-4 mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                  {notePreview ? "Edit" : "Preview"}
                </Button>
                
                <Button variant="outline" onClick={handleCopyNotes}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                
                <Button onClick={handleSaveNotes}>
                  <Save className="h-4 w-4 mr-2" />
                  Save to Patient Chart
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Voice Dictation Settings</CardTitle>
              <CardDescription>
                Configure recognition options and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-generate" className="flex flex-col space-y-1">
                    <span>Auto-generate SOAP notes</span>
                    <span className="font-normal text-sm text-muted-foreground">
                      Automatically generate notes when dictation ends
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
                  <Label htmlFor="auto-punctuate" className="flex flex-col space-y-1">
                    <span>Auto-punctuation</span>
                    <span className="font-normal text-sm text-muted-foreground">
                      Intelligently add periods and commas
                    </span>
                  </Label>
                  <Switch
                    id="auto-punctuate"
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
                <Label>Recognition Language</Label>
                <Select 
                  value={selectedLanguage} 
                  onValueChange={setSelectedLanguage}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map(language => (
                      <SelectItem key={language.code} value={language.code}>
                        {language.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Voice recognition language setting (does not affect note output)
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Microphone</Label>
                <Select defaultValue="default">
                  <SelectTrigger>
                    <SelectValue placeholder="Select microphone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default Device</SelectItem>
                    <SelectItem value="headset">Headset Microphone</SelectItem>
                    <SelectItem value="webcam">Webcam Microphone</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select which microphone to use for dictation
                </p>
              </div>
              
              <div className="pt-4 border-t">
                <Button 
                  variant="destructive" 
                  className="w-full" 
                  onClick={resetRecording}
                  disabled={isRecording}
                >
                  Reset Dictation Session
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}