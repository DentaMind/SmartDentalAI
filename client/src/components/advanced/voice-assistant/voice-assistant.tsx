import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Volume2, StopCircle, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

type VoiceAssistantProps = {
  onTranscriptComplete?: (transcript: string) => void;
  context?: 'patient_notes' | 'prescription' | 'treatment_plan' | 'general';
  patientInfo?: {
    id: number;
    name: string;
    age?: number;
    gender?: string;
  };
}

type VoiceCommand = {
  trigger: string;
  action: 'create_note' | 'check_schedule' | 'add_prescription' | 'check_patient_history' | 'template' | 'other';
  description: string;
  template?: string;
  requires_confirmation?: boolean;
}

const VOICE_COMMANDS: VoiceCommand[] = [
  {
    trigger: 'create note',
    action: 'create_note',
    description: 'Creates a new clinical note',
  },
  {
    trigger: 'schedule for',
    action: 'check_schedule',
    description: 'Shows schedule for a specific date',
  },
  {
    trigger: 'add prescription',
    action: 'add_prescription',
    description: 'Adds a prescription',
  },
  {
    trigger: 'patient history',
    action: 'check_patient_history',
    description: 'Shows patient history',
  },
  {
    trigger: 'template soap',
    action: 'template',
    description: 'Uses SOAP note template',
    template: 'Subjective:\n\nObjective:\n\nAssessment:\n\nPlan:\n',
  },
  {
    trigger: 'template procedure',
    action: 'template',
    description: 'Uses procedure note template',
    template: 'Procedure: \nAnesthesia: \nIsolation: \nMaterials: \nFindings: \nPostoperative Instructions: ',
  }
];

/**
 * Voice Assistant component for hands-free operation
 * 
 * This component provides a voice interface for providers to create notes,
 * check schedules, add prescriptions, and more, all hands-free.
 */
export function VoiceAssistant({ onTranscriptComplete, context = 'general', patientInfo }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [processing, setProcessing] = useState(false);
  const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  // Set up speech recognition
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;
        setTranscript((prev) => prev + ' ' + transcriptText);
        
        // Check for voice commands in real-time
        checkForCommands(transcriptText);
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        toast({
          title: 'Voice Assistant Error',
          description: `Error: ${event.error}. Please try again.`,
          variant: 'destructive',
        });
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        if (isListening) {
          try {
            recognitionRef.current?.start();
          } catch (e) {
            console.error('Could not restart recognition', e);
          }
        }
      };
    } else {
      toast({
        title: 'Voice Assistant Not Supported',
        description: 'Your browser does not support speech recognition.',
        variant: 'destructive',
      });
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [toast, isListening]);
  
  // Toggle listening state
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (e) {
          console.error('Could not start recognition', e);
          toast({
            title: 'Voice Assistant Error',
            description: 'Could not start voice recognition. Please try again.',
            variant: 'destructive',
          });
        }
      }
    }
  };
  
  // Check for voice commands in the transcript
  const checkForCommands = (text: string) => {
    const lowerText = text.toLowerCase();
    
    for (const command of VOICE_COMMANDS) {
      if (lowerText.includes(command.trigger)) {
        setLastCommand(command);
        executeCommand(command);
        break;
      }
    }
  };
  
  // Execute a voice command
  const executeCommand = async (command: VoiceCommand) => {
    setProcessing(true);
    
    try {
      switch (command.action) {
        case 'template':
          if (command.template) {
            setTranscript(command.template);
            speakText(`Template applied: ${command.description}`);
          }
          break;
          
        case 'create_note':
          // This would typically integrate with your note creation system
          setAiResponse("Ready to create a new clinical note. What would you like to include?");
          speakText("Ready to create a new clinical note. What would you like to include?");
          break;
          
        case 'check_schedule':
          // This would fetch the schedule from your backend
          const today = new Date().toLocaleDateString();
          setAiResponse(`Checking schedule for ${today}. You have 3 appointments today.`);
          speakText(`Checking schedule for ${today}. You have 3 appointments today.`);
          break;
          
        case 'add_prescription':
          if (patientInfo) {
            setAiResponse(`Ready to add prescription for ${patientInfo.name}. What medication would you like to prescribe?`);
            speakText(`Ready to add prescription for ${patientInfo.name}. What medication would you like to prescribe?`);
          } else {
            setAiResponse("Please select a patient first before adding a prescription.");
            speakText("Please select a patient first before adding a prescription.");
          }
          break;
          
        case 'check_patient_history':
          if (patientInfo) {
            setAiResponse(`Retrieving patient history for ${patientInfo.name}. Please wait...`);
            speakText(`Retrieving patient history for ${patientInfo.name}.`);
            // Here you would fetch patient history
            setTimeout(() => {
              setAiResponse(`${patientInfo.name}'s last visit was on March 15, 2025 for a routine cleaning. Previous procedures include fillings on teeth 14 and 15 in January 2025.`);
              speakText(`${patientInfo.name}'s last visit was on March 15 for a routine cleaning. Previous procedures include fillings in January.`);
            }, 1500);
          } else {
            setAiResponse("Please select a patient first to check their history.");
            speakText("Please select a patient first to check their history.");
          }
          break;
          
        default:
          setAiResponse("Command recognized but not implemented yet.");
          speakText("Command recognized but not implemented yet.");
      }
    } catch (error) {
      console.error('Error executing command', error);
      toast({
        title: 'Command Execution Error',
        description: 'Error executing voice command. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };
  
  // Use the Web Speech API to speak text back to the user
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1; // Slightly faster than normal
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };
  
  // Clear the transcript
  const clearTranscript = () => {
    setTranscript('');
    setAiResponse(null);
    setLastCommand(null);
  };
  
  // Complete the transcript and pass it to parent component
  const completeTranscript = () => {
    if (onTranscriptComplete && transcript) {
      onTranscriptComplete(transcript);
      clearTranscript();
    }
  };
  
  // Process the transcript with AI to get insights
  const processWithAI = async () => {
    if (!transcript.trim()) return;
    
    setProcessing(true);
    try {
      // You would make an API call to process this with OpenAI
      const response = await apiRequest('/api/ai/process-speech', {
        method: 'POST',
        data: {
          transcript,
          context,
          patientInfo
        }
      });
      
      setAiResponse(response.result || 'No insights available from AI for this transcript.');
      
    } catch (error) {
      console.error('Error processing with AI', error);
      toast({
        title: 'AI Processing Error',
        description: 'Could not process text with AI. Please try again.',
        variant: 'destructive',
      });
      setAiResponse('Error processing with AI. Please try again.');
    } finally {
      setProcessing(false);
    }
  };
  
  return (
    <div className={`voice-assistant ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg flex items-center">
              {isListening ? (
                <Mic className="h-5 w-5 mr-2 text-green-500 animate-pulse" />
              ) : (
                <MicOff className="h-5 w-5 mr-2 text-gray-400" />
              )}
              Voice Assistant
            </CardTitle>
            <div className="flex gap-1">
              {lastCommand && (
                <Badge variant="outline" className="bg-blue-50">
                  {lastCommand.description}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 w-6"
              >
                {isExpanded ? (
                  <span className="text-xs">▼</span>
                ) : (
                  <span className="text-xs">▲</span>
                )}
              </Button>
            </div>
          </div>
          {isExpanded && (
            <CardDescription>
              Hands-free voice control for DentaMind. Say commands like "create note" or "patient history".
            </CardDescription>
          )}
        </CardHeader>
        
        {isExpanded && (
          <>
            <CardContent className="space-y-2">
              <div className="min-h-[100px] max-h-[200px] overflow-y-auto bg-gray-50 rounded p-2 text-sm">
                {transcript ? transcript : <span className="text-gray-400">Your speech will appear here...</span>}
              </div>
              
              {aiResponse && (
                <div className="bg-blue-50 rounded p-2 text-sm border-l-4 border-blue-500">
                  <h4 className="font-medium text-xs text-blue-700 mb-1">Assistant Response:</h4>
                  {aiResponse}
                </div>
              )}
              
              {isExpanded && (
                <div className="text-xs text-gray-500">
                  <h4 className="font-medium mb-1">Available Commands:</h4>
                  <ul className="list-disc pl-4 space-y-1">
                    {VOICE_COMMANDS.map((cmd, i) => (
                      <li key={i}>"{cmd.trigger}" - {cmd.description}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex justify-between pt-2">
              <div className="flex gap-2">
                <Button
                  onClick={toggleListening}
                  variant={isListening ? "destructive" : "default"}
                  size="sm"
                  className="gap-1"
                >
                  {isListening ? (
                    <>
                      <StopCircle className="h-4 w-4" /> Stop
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4" /> Listen
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={processWithAI}
                  variant="outline"
                  size="sm"
                  disabled={!transcript || processing}
                  className="gap-1"
                >
                  <Volume2 className="h-4 w-4" /> Process
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={clearTranscript}
                  variant="ghost"
                  size="sm"
                  className="gap-1"
                >
                  <RotateCcw className="h-4 w-4" /> Clear
                </Button>
                
                {onTranscriptComplete && (
                  <Button
                    onClick={completeTranscript}
                    variant="secondary"
                    size="sm"
                    disabled={!transcript}
                  >
                    Use Text
                  </Button>
                )}
              </div>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}

// Add window type definition for WebkitSpeechRecognition
declare global {
  interface Window {
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export default VoiceAssistant;