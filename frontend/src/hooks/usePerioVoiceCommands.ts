import { useState, useCallback, useEffect } from 'react';
import { PerioVoiceCommand } from '@shared/schema';
import { PerioVoiceParser } from '@server/services/perio-voice-parser';

interface UsePerioVoiceCommandsProps {
  onCommand: (command: PerioVoiceCommand) => void;
  isEnabled?: boolean;
}

export const usePerioVoiceCommands = ({ onCommand, isEnabled = true }: UsePerioVoiceCommandsProps) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (!isEnabled) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');

      setTranscript(transcript);

      // Only process final results
      if (event.results[event.results.length - 1].isFinal) {
        const command = PerioVoiceParser.parseCommand(transcript);
        if (command) {
          onCommand(command);
          setTranscript('');
        }
      }
    };

    setRecognition(recognition);

    return () => {
      recognition.stop();
    };
  }, [isEnabled, onCommand]);

  const startListening = useCallback(() => {
    if (recognition && !isListening) {
      recognition.start();
    }
  }, [recognition, isListening]);

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop();
    }
  }, [recognition, isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    toggleListening
  };
}; 