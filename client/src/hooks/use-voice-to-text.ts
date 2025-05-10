import { useState, useEffect, useCallback } from 'react';

interface VoiceToTextOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (text: string) => void;
}

interface VoiceToTextResult {
  transcript: string;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  error?: Error;
  supported: boolean;
}

export function useVoiceToText({
  language = 'en-US',
  continuous = true,
  interimResults = true,
  onResult,
}: VoiceToTextOptions = {}): VoiceToTextResult {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<Error | undefined>();
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [supported, setSupported] = useState(false);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setSupported(false);
      setError(new Error('Speech recognition not supported in this browser'));
      return;
    }

    setSupported(true);
    const recognitionInstance = new SpeechRecognition();
    
    // Configure recognition
    recognitionInstance.continuous = continuous;
    recognitionInstance.interimResults = interimResults;
    recognitionInstance.lang = language;
    
    // Set up recognition event handlers
    recognitionInstance.onresult = (event) => {
      const currentTranscript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join(' ');
      
      setTranscript(currentTranscript);
      
      if (onResult) {
        onResult(currentTranscript);
      }
    };
    
    recognitionInstance.onerror = (event) => {
      setError(new Error(`Speech recognition error: ${event.error}`));
      setIsListening(false);
    };
    
    recognitionInstance.onend = () => {
      setIsListening(false);
    };
    
    setRecognition(recognitionInstance);
    
    // Cleanup on unmount
    return () => {
      if (recognitionInstance) {
        recognitionInstance.onresult = null;
        recognitionInstance.onerror = null;
        recognitionInstance.onend = null;
        
        if (isListening) {
          recognitionInstance.abort();
        }
      }
    };
  }, [continuous, interimResults, language, onResult]);

  // Start listening
  const startListening = useCallback(() => {
    if (!recognition) return;
    
    try {
      recognition.start();
      setIsListening(true);
      setError(undefined);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error starting speech recognition'));
    }
  }, [recognition]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (!recognition) return;
    
    try {
      recognition.stop();
      setIsListening(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error stopping speech recognition'));
    }
  }, [recognition]);

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    error,
    supported,
  };
}

// Add TypeScript declarations for the Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}