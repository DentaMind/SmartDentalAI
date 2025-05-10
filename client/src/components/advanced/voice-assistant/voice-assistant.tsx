import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { apiRequest } from '@/lib/queryClient';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface VoiceAssistantProps {
  onTranscriptGenerated: (transcript: string) => void;
  patientId: number;
  disabled?: boolean;
  category?: string;
  addContextFromNotes?: boolean;
}

export function VoiceAssistant({
  onTranscriptGenerated,
  patientId,
  disabled = false,
  category = 'general',
  addContextFromNotes = false,
}: VoiceAssistantProps) {
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [confidenceScore, setConfidenceScore] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const recognition = useRef<SpeechRecognition | null>(null);
  const processingTimer = useRef<NodeJS.Timeout | null>(null);

  // Initialize speech recognition if supported
  useEffect(() => {
    if (typeof window !== 'undefined' && 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = true;
      recognition.current.interimResults = true;
      recognition.current.lang = 'en-US';

      recognition.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
            setConfidenceScore(event.results[i][0].confidence * 100);
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript((prev) => {
          const updatedTranscript = prev + finalTranscript;
          return updatedTranscript;
        });
      };

      recognition.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setErrorMessage(event.error);
        setIsListening(false);
        toast({
          title: 'Speech Recognition Error',
          description: `Error: ${event.error}. Please try again.`,
          variant: 'destructive',
        });
      };

      recognition.current.onend = () => {
        if (isListening) {
          // Restart if it ended but we're still supposed to be listening
          recognition.current?.start();
        }
      };
    } else {
      setErrorMessage('Speech recognition not supported in this browser');
      toast({
        title: 'Browser Not Supported',
        description: 'Speech recognition is not supported in your browser. Please try using Chrome, Edge, or Safari.',
        variant: 'destructive',
      });
    }

    return () => {
      if (recognition.current && isListening) {
        recognition.current.stop();
      }
      
      if (processingTimer.current) {
        clearInterval(processingTimer.current);
      }
    };
  }, [isListening, toast]);

  const toggleListening = () => {
    if (!recognition.current) {
      toast({
        title: 'Speech Recognition Not Available',
        description: 'Your browser does not support speech recognition. Please try using Chrome, Edge, or Safari.',
        variant: 'destructive',
      });
      return;
    }

    if (isListening) {
      recognition.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setErrorMessage('');
      setConfidenceScore(0);
      try {
        recognition.current.start();
        setIsListening(true);
        toast({
          title: 'Listening',
          description: 'Speak clearly and the assistant will transcribe your voice.',
        });
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        toast({
          title: 'Failed to Start',
          description: 'There was an error starting speech recognition. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  const processTranscript = async () => {
    if (!transcript.trim()) {
      toast({
        title: 'Empty Transcript',
        description: 'Please record some speech before processing.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);
    
    // Simulated progress for UX feedback
    processingTimer.current = setInterval(() => {
      setProcessingProgress((prev) => {
        const newProgress = prev + Math.random() * 10;
        return newProgress >= 95 ? 95 : newProgress;
      });
    }, 300);

    try {
      // Send the transcript to the AI for enhancement and structuring
      const response = await apiRequest('/api/voice-assistant/process', {
        method: 'POST',
        body: JSON.stringify({
          transcript,
          patientId,
          category,
          addContextFromNotes,
        }),
      });

      clearInterval(processingTimer.current as NodeJS.Timeout);
      setProcessingProgress(100);
      
      if (response && response.enhancedTranscript) {
        // Pass the enhanced transcript back to the parent component
        onTranscriptGenerated(response.enhancedTranscript);
        
        toast({
          title: 'Processing Complete',
          description: 'Your dictation has been processed and enhanced with AI assistance.',
        });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error processing transcript:', error);
      clearInterval(processingTimer.current as NodeJS.Timeout);
      
      // Fallback to using raw transcript if AI processing fails
      onTranscriptGenerated(transcript);
      
      toast({
        title: 'Processing Warning',
        description: 'Could not enhance transcript with AI. Using raw transcript instead.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setIsListening(false);
      setTranscript('');
      if (recognition.current) {
        recognition.current.stop();
      }
    }
  };

  const cancelRecording = () => {
    if (recognition.current) {
      recognition.current.stop();
    }
    setIsListening(false);
    setTranscript('');
    toast({
      title: 'Recording Cancelled',
      description: 'Voice recording has been cancelled.',
    });
  };

  return (
    <Card className="w-full border-2 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          {isListening ? (
            <Mic className="h-5 w-5 text-primary animate-pulse" />
          ) : (
            <Mic className="h-5 w-5 text-muted-foreground" />
          )}
          Voice Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex flex-col space-y-2">
          {isListening && (
            <Badge 
              variant="outline" 
              className="self-start bg-red-50 text-red-800 border-red-200 animate-pulse"
            >
              Listening...
            </Badge>
          )}
          {isProcessing && (
            <Badge 
              variant="outline" 
              className="self-start bg-blue-50 text-blue-800 border-blue-200"
            >
              Processing with AI...
            </Badge>
          )}
          
          <div className={`min-h-[60px] p-3 rounded-md border bg-muted/20 ${isListening ? 'border-primary' : ''}`}>
            {transcript ? (
              <p className="text-sm">{transcript}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                {isListening 
                  ? 'Speak now... Your words will appear here.' 
                  : 'Click the microphone button and speak clearly to record your notes.'}
              </p>
            )}
          </div>
          
          {isProcessing && (
            <div className="w-full space-y-1">
              <Progress value={processingProgress} className="h-2 w-full" />
              <p className="text-xs text-muted-foreground text-right">
                {processingProgress.toFixed(0)}% complete
              </p>
            </div>
          )}
          
          {confidenceScore > 0 && !isProcessing && (
            <p className="text-xs text-muted-foreground">
              Speech recognition confidence: {confidenceScore.toFixed(0)}%
            </p>
          )}
          
          {errorMessage && (
            <p className="text-xs text-destructive">Error: {errorMessage}</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-1">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={cancelRecording}
          disabled={!isListening || isProcessing || disabled}
        >
          <X className="h-4 w-4 mr-1" />
          Cancel
        </Button>
        
        <div className="flex gap-2">
          <Button
            variant={isListening ? "destructive" : "outline"}
            size="sm"
            onClick={toggleListening}
            disabled={isProcessing || disabled}
            className="gap-1"
          >
            {isListening ? (
              <>
                <MicOff className="h-4 w-4" />
                Stop
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" />
                Record
              </>
            )}
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onClick={processTranscript}
            disabled={!transcript || isListening || isProcessing || disabled}
            className="gap-1"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Use Transcript
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

// TypeScript augmentation for the SpeechRecognition API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}