import React, { useState, useEffect, useCallback } from 'react';
import { Box, IconButton, Typography, Paper, CircularProgress } from '@mui/material';
import { Mic, MicOff, Replay, Clear } from '@mui/icons-material';
import { PerioVoiceCommand } from '@shared/schema';
import { PerioVoiceParser } from '@server/services/perio-voice-parser';

interface VoicePerioInputProps {
  onCommand: (command: PerioVoiceCommand) => void;
  currentTooth?: number;
  isRecording: boolean;
  onRecordingChange: (isRecording: boolean) => void;
}

export const VoicePerioInput: React.FC<VoicePerioInputProps> = ({
  onCommand,
  currentTooth,
  isRecording,
  onRecordingChange
}) => {
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const voiceParser = new PerioVoiceParser();

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setTranscript(transcript);
      };

      recognition.onerror = (event: SpeechRecognitionError) => {
        setError(`Error: ${event.error}`);
        onRecordingChange(false);
      };

      recognition.onend = () => {
        if (isRecording) {
          recognition.start();
        }
      };

      setRecognition(recognition);
    } else {
      setError('Speech recognition is not supported in this browser.');
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, []);

  // Process transcript when it changes
  useEffect(() => {
    if (transcript && !isProcessing) {
      setIsProcessing(true);
      const command = voiceParser.parseCommand(transcript);
      
      if (command && voiceParser.validateCommand(command)) {
        onCommand(command);
        setTranscript('');
      }
      
      setIsProcessing(false);
    }
  }, [transcript, onCommand]);

  // Toggle recording
  const toggleRecording = useCallback(() => {
    if (!recognition) return;

    if (isRecording) {
      recognition.stop();
    } else {
      recognition.start();
      setError(null);
    }
    onRecordingChange(!isRecording);
  }, [recognition, isRecording, onRecordingChange]);

  // Clear current transcript
  const clearTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  // Get current tooth status
  const getToothStatus = () => {
    if (!currentTooth) return 'Ready to start charting';
    
    const isMaxillary = currentTooth <= 16;
    const isBuccal = currentTooth <= 16 || currentTooth > 32;
    
    return `Charting ${isMaxillary ? 'Maxillary' : 'Mandibular'} ${isBuccal ? 'Buccal' : 'Lingual'} - Tooth ${currentTooth}`;
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Voice Charting
        </Typography>
        <IconButton
          onClick={toggleRecording}
          color={isRecording ? 'error' : 'default'}
          disabled={!!error}
        >
          {isRecording ? <Mic /> : <MicOff />}
        </IconButton>
        <IconButton onClick={clearTranscript} disabled={!transcript}>
          <Clear />
        </IconButton>
      </Box>

      {/* Status and current tooth */}
      <Typography variant="body1" sx={{ mb: 2 }}>
        {getToothStatus()}
      </Typography>

      {/* Live transcript */}
      {transcript && (
        <Paper sx={{ p: 2, mb: 2, backgroundColor: '#f5f5f5' }}>
          <Typography variant="body2">
            {transcript}
          </Typography>
        </Paper>
      )}

      {/* Error message */}
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {/* Processing indicator */}
      {isProcessing && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={20} />
          <Typography variant="body2">Processing command...</Typography>
        </Box>
      )}

      {/* Voice command examples */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Example Commands:
        </Typography>
        <Typography variant="body2" component="div">
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {voiceParser.getExampleCommands().map((cmd, i) => (
              <li key={i}>{cmd}</li>
            ))}
          </ul>
        </Typography>
      </Box>
    </Paper>
  );
}; 