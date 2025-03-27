import { useState, useEffect, useCallback } from 'react';

interface VoiceToTextOptions {
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
  autoStart?: boolean;
}

interface VoiceToTextReturn {
  text: string;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetText: () => void;
  hasRecognitionSupport: boolean;
  error: string | null;
}

export const useVoiceToText = (options: VoiceToTextOptions = {}): VoiceToTextReturn => {
  const [text, setText] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [hasRecognitionSupport, setHasRecognitionSupport] = useState<boolean>(false);

  const {
    continuous = false,
    interimResults = false,
    language = 'en-US',
    autoStart = false
  } = options;

  // Initialize speech recognition on component mount
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = continuous;
      recognitionInstance.interimResults = interimResults;
      recognitionInstance.lang = language;
      
      setRecognition(recognitionInstance);
      setHasRecognitionSupport(true);
      
      if (autoStart) {
        startListeningFn(recognitionInstance);
      }
    } else {
      setHasRecognitionSupport(false);
      setError('Your browser does not support speech recognition.');
    }

    // Cleanup function to stop recognition on unmount
    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Function to start listening
  const startListeningFn = useCallback((recognitionInstance: SpeechRecognition | null = recognition) => {
    if (!recognitionInstance) return;
    
    try {
      recognitionInstance.start();
      setIsListening(true);
      setError(null);
    } catch (err) {
      setError(`Error starting speech recognition: ${err instanceof Error ? err.message : String(err)}`);
      setIsListening(false);
    }
  }, [recognition]);

  // Function to stop listening
  const stopListeningFn = useCallback(() => {
    if (!recognition) return;
    
    try {
      recognition.stop();
      setIsListening(false);
    } catch (err) {
      setError(`Error stopping speech recognition: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [recognition]);

  // Reset the transcribed text
  const resetText = useCallback(() => {
    setText('');
  }, []);

  // Set up event listeners for the recognition instance
  useEffect(() => {
    if (!recognition) return;

    const handleResult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join(' ');
      
      setText(transcript);
    };

    const handleEnd = () => {
      setIsListening(false);
      
      // If continuous is true, restart recognition when it ends
      if (continuous && recognition) {
        startListeningFn();
      }
    };

    const handleError = (event: SpeechRecognitionErrorEvent) => {
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.addEventListener('result', handleResult);
    recognition.addEventListener('end', handleEnd);
    recognition.addEventListener('error', handleError);

    return () => {
      recognition.removeEventListener('result', handleResult);
      recognition.removeEventListener('end', handleEnd);
      recognition.removeEventListener('error', handleError);
    };
  }, [recognition, continuous, startListeningFn]);

  return {
    text,
    isListening,
    startListening: startListeningFn,
    stopListening: stopListeningFn,
    resetText,
    hasRecognitionSupport,
    error
  };
};

// Type declarations for SpeechRecognition API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}