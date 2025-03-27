/**
 * useVoiceToText Hook
 * 
 * This hook provides React components with access to the speech recognition service
 * for voice-to-text functionality in clinical notes and other areas.
 */

import { useState, useEffect, useCallback } from 'react';
import speechRecognitionService from '@/lib/speech-recognition';
import { useToast } from './use-toast';

interface UseVoiceToTextOptions {
  autoStart?: boolean;
  language?: string;
  enableCommands?: boolean;
  onError?: (error: string) => void;
}

export function useVoiceToText(options: UseVoiceToTextOptions = {}) {
  const {
    autoStart = false,
    language = 'en-US',
    enableCommands = true,
    onError
  } = options;
  
  const { toast } = useToast();
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    // Set up speech recognition callbacks
    speechRecognitionService.onResult = (text) => {
      setTranscript(text);
    };

    speechRecognitionService.onStart = () => {
      setIsListening(true);
    };

    speechRecognitionService.onEnd = () => {
      setIsListening(false);
    };

    speechRecognitionService.onError = (errorMsg) => {
      setError(errorMsg);
      if (onError) {
        onError(errorMsg);
      } else {
        toast({
          title: "Voice Recognition Error",
          description: errorMsg,
          variant: "destructive"
        });
      }
    };

    // Auto-start if configured
    if (autoStart) {
      startRecording();
    }

    // Cleanup
    return () => {
      if (isListening) {
        speechRecognitionService.stop();
      }
    };
  }, [autoStart, onError, toast]);

  // Start recording
  const startRecording = useCallback(() => {
    speechRecognitionService.clearTranscript();
    speechRecognitionService.start(language);
    
    toast({
      title: "Voice Recording Started",
      description: "Speak clearly to create your note",
      variant: "default"
    });
  }, [language, toast]);

  // Stop recording
  const stopRecording = useCallback(() => {
    speechRecognitionService.stop();
    
    toast({
      title: "Voice Recording Stopped",
      description: "Text has been captured",
      variant: "default"
    });
  }, [toast]);

  // Reset/clear transcript
  const reset = useCallback(() => {
    setTranscript('');
    speechRecognitionService.clearTranscript();
  }, []);

  // Process voice commands in the transcript (e.g., "new paragraph", "section subjective")
  const processCommands = useCallback((text: string) => {
    if (!enableCommands) return text;
    return speechRecognitionService.detectCommands(text);
  }, [enableCommands]);

  return {
    transcript,
    isListening,
    error,
    startRecording,
    stopRecording,
    reset,
    processCommands
  };
}