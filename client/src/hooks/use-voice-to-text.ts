import { useState, useCallback, useEffect } from 'react';

type VoiceToTextHook = {
  transcript: string;
  isListening: boolean;
  error: string | null;
  startRecording: () => void;
  stopRecording: () => void;
  reset: () => void;
  processCommands: (text: string) => string;
};

export const useVoiceToText = (): VoiceToTextHook => {
  const [transcript, setTranscript] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check if the browser supports Web Speech API
  const browserSupportsRecognition = typeof window !== 'undefined' && 'webkitSpeechRecognition' in window;

  // Command processing
  const processCommands = useCallback((text: string) => {
    // Process special commands
    let processedText = text;

    // Special commands for common dental terms or formatting
    const commandPatterns = [
      { pattern: /new line/gi, replacement: '\n' },
      { pattern: /new paragraph/gi, replacement: '\n\n' },
      { pattern: /period$/gi, replacement: '.' },
      { pattern: /question mark$/gi, replacement: '?' },
      { pattern: /comma$/gi, replacement: ',' },
      { pattern: /exclamation mark$/gi, replacement: '!' },
      
      // Dental specific commands
      { pattern: /tooth number (\d+)/gi, replacement: 'tooth #$1' },
      { pattern: /probing depths?/gi, replacement: 'Probing Depths' },
      { pattern: /pocket depths?/gi, replacement: 'Pocket Depths' },
      { pattern: /bleeding on probing/gi, replacement: 'Bleeding on Probing (BOP)' },
      { pattern: /clinical attachment loss/gi, replacement: 'Clinical Attachment Loss (CAL)' },
      { pattern: /prescribed/gi, replacement: 'Prescribed' },
      { pattern: /amalgam/gi, replacement: 'amalgam' },
      { pattern: /composite/gi, replacement: 'composite' },
      { pattern: /caries/gi, replacement: 'caries' },
      { pattern: /periodontal/gi, replacement: 'periodontal' },
      { pattern: /gingivitis/gi, replacement: 'gingivitis' },
      { pattern: /periodontitis/gi, replacement: 'periodontitis' },
      
      // Common SOAP note commands
      { pattern: /start subjective/gi, replacement: '**SUBJECTIVE**\n' },
      { pattern: /start objective/gi, replacement: '**OBJECTIVE**\n' },
      { pattern: /start assessment/gi, replacement: '**ASSESSMENT**\n' },
      { pattern: /start plan/gi, replacement: '**PLAN**\n' },
    ];

    // Apply all command patterns
    commandPatterns.forEach(({ pattern, replacement }) => {
      processedText = processedText.replace(pattern, replacement);
    });

    return processedText;
  }, []);

  // Start recording
  const startRecording = useCallback(() => {
    if (browserSupportsRecognition) {
      setError(null);
      try {
        // Mock web speech API functionality for the browser environment
        // In a real implementation, this would use the actual Web Speech API
        console.log('Starting voice recording...');
        setIsListening(true);
        // In a real implementation, we would initialize the recognition engine here
      } catch (err) {
        setError('Error starting speech recognition');
        setIsListening(false);
      }
    } else {
      setError('Your browser does not support speech recognition');
    }
  }, [browserSupportsRecognition]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (isListening) {
      console.log('Stopping voice recording...');
      setIsListening(false);
      
      // Simulate receiving a transcript for demonstration purposes
      // In a real implementation, this would come from the Web Speech API
      const simulatedText = 'This is a simulated transcript for testing purposes';
      setTranscript(simulatedText);
    }
  }, [isListening]);

  // Reset the transcript
  const reset = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  // Clean up
  useEffect(() => {
    return () => {
      if (isListening) {
        stopRecording();
      }
    };
  }, [isListening, stopRecording]);

  return {
    transcript,
    isListening,
    error,
    startRecording,
    stopRecording,
    reset,
    processCommands
  };
};