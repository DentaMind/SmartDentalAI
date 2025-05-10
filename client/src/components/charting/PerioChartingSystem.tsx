import React, { useState, useCallback, useMemo } from 'react';
import { Box, Paper, Typography, LinearProgress, Tooltip } from '@mui/material';
import { PerioChart, PerioVoiceCommand } from '@shared/schema';
import { PerioChartCanvas } from './PerioChartCanvas';
import { VoicePerioInput } from './VoicePerioInput';

interface PerioChartingSystemProps {
  initialChart?: PerioChart;
  onChartUpdate?: (chart: PerioChart) => void;
}

export const PerioChartingSystem: React.FC<PerioChartingSystemProps> = ({
  initialChart,
  onChartUpdate
}) => {
  const [chart, setChart] = useState<PerioChart>(initialChart || {
    id: '',
    patientId: '',
    doctorId: '',
    date: new Date(),
    measurements: [],
    status: 'in_progress'
  });
  const [isRecording, setIsRecording] = useState(false);
  const [currentTooth, setCurrentTooth] = useState<number | undefined>(undefined);
  const [chartingPhase, setChartingPhase] = useState<'maxillary_buccal' | 'maxillary_lingual' | 'mandibular_buccal' | 'mandibular_lingual'>('maxillary_buccal');

  // Calculate charting progress
  const chartingProgress = useMemo(() => {
    const totalSites = 192; // 6 sites per tooth * 32 teeth
    const completedSites = chart.measurements.reduce((count, tooth) => {
      const buccalSites = tooth.buccal.mb && tooth.buccal.b && tooth.buccal.db ? 3 : 0;
      const lingualSites = tooth.lingual.ml && tooth.lingual.l && tooth.lingual.dl ? 3 : 0;
      return count + buccalSites + lingualSites;
    }, 0);
    return (completedSites / totalSites) * 100;
  }, [chart]);

  // Get phase description
  const getPhaseDescription = useCallback(() => {
    switch (chartingPhase) {
      case 'maxillary_buccal':
        return 'Maxillary Buccal (1 → 16)';
      case 'maxillary_lingual':
        return 'Maxillary Lingual (16 → 1)';
      case 'mandibular_buccal':
        return 'Mandibular Buccal (32 → 17)';
      case 'mandibular_lingual':
        return 'Mandibular Lingual (17 → 32)';
    }
  }, [chartingPhase]);

  // Get current tooth status
  const getCurrentToothStatus = useCallback(() => {
    if (!currentTooth) return 'Ready to start charting';
    const isMaxillary = currentTooth <= 16;
    const isBuccal = chartingPhase.includes('buccal');
    return `Charting ${isMaxillary ? 'Maxillary' : 'Mandibular'} ${isBuccal ? 'Buccal' : 'Lingual'} - Tooth ${currentTooth}`;
  }, [currentTooth, chartingPhase]);

  // Update chart and notify parent
  const handleChartUpdate = useCallback((updatedChart: PerioChart) => {
    setChart(updatedChart);
    onChartUpdate?.(updatedChart);
  }, [onChartUpdate]);

  // Handle voice commands
  const handleVoiceCommand = useCallback((command: PerioVoiceCommand) => {
    if (command.type === 'measurement') {
      // Update the chart with new measurements
      const updatedChart = { ...chart };
      const toothIndex = updatedChart.measurements.findIndex(
        m => m.toothNumber === command.toothNumber
      );

      if (toothIndex === -1) {
        // Create new tooth measurement if it doesn't exist
        updatedChart.measurements.push({
          toothNumber: command.toothNumber,
          buccal: { mb: 0, b: 0, db: 0 },
          lingual: { ml: 0, l: 0, dl: 0 }
        });
      }

      const tooth = updatedChart.measurements[toothIndex];
      const isBuccal = chartingPhase.includes('buccal');
      const surface = isBuccal ? tooth.buccal : tooth.lingual;

      // Update measurements
      surface.mb = command.measurements[0];
      surface.b = command.measurements[1];
      surface.db = command.measurements[2];

      // Update flags
      if (command.flags?.includes('bleeding')) {
        surface.bleeding = true;
      }
      if (command.flags?.includes('suppuration')) {
        surface.suppuration = true;
      }

      handleChartUpdate(updatedChart);
      advanceToNextTooth();
    } else if (command.type === 'navigation') {
      handleNavigationCommand(command);
    }
  }, [chart, chartingPhase, handleChartUpdate]);

  // Handle navigation commands
  const handleNavigationCommand = useCallback((command: PerioVoiceCommand) => {
    if (command.action === 'next') {
      advanceToNextTooth();
    } else if (command.action === 'repeat') {
      // Keep current tooth
    } else if (command.action === 'clear') {
      // Clear current tooth measurements
      const updatedChart = { ...chart };
      const toothIndex = updatedChart.measurements.findIndex(
        m => m.toothNumber === currentTooth
      );
      
      if (toothIndex !== -1) {
        const tooth = updatedChart.measurements[toothIndex];
        const isBuccal = chartingPhase.includes('buccal');
        const surface = isBuccal ? tooth.buccal : tooth.lingual;
        
        // Reset measurements and flags
        surface.mb = 0;
        surface.b = 0;
        surface.db = 0;
        surface.bleeding = false;
        surface.suppuration = false;
        
        handleChartUpdate(updatedChart);
      }
    }
  }, [chart, currentTooth, chartingPhase, handleChartUpdate]);

  // Advance to next tooth in sequence
  const advanceToNextTooth = useCallback(() => {
    let nextTooth: number | undefined;
    let nextPhase = chartingPhase;

    switch (chartingPhase) {
      case 'maxillary_buccal':
        if (currentTooth === undefined) {
          nextTooth = 1;
        } else if (currentTooth < 16) {
          nextTooth = currentTooth + 1;
        } else {
          nextTooth = 16;
          nextPhase = 'maxillary_lingual';
        }
        break;
      case 'maxillary_lingual':
        if (currentTooth > 1) {
          nextTooth = currentTooth - 1;
        } else {
          nextTooth = 32;
          nextPhase = 'mandibular_buccal';
        }
        break;
      case 'mandibular_buccal':
        if (currentTooth > 17) {
          nextTooth = currentTooth - 1;
        } else {
          nextTooth = 17;
          nextPhase = 'mandibular_lingual';
        }
        break;
      case 'mandibular_lingual':
        if (currentTooth < 32) {
          nextTooth = currentTooth + 1;
        } else {
          // Charting complete
          nextTooth = undefined;
          nextPhase = 'maxillary_buccal';
        }
        break;
    }

    setCurrentTooth(nextTooth);
    setChartingPhase(nextPhase);
  }, [currentTooth, chartingPhase]);

  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Periodontal Charting
        </Typography>

        {/* Progress Bar */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">
              Charting Progress
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {Math.round(chartingProgress)}% Complete
            </Typography>
          </Box>
          <Tooltip title={`${Math.round(chartingProgress)}% of sites charted`}>
            <LinearProgress 
              variant="determinate" 
              value={chartingProgress}
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Tooltip>
        </Box>

        {/* Current Phase and Tooth Status */}
        <Box sx={{ mb: 2, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="subtitle1" color="primary">
            {getPhaseDescription()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {getCurrentToothStatus()}
          </Typography>
        </Box>
        
        {/* Voice input component */}
        <VoicePerioInput
          onCommand={handleVoiceCommand}
          currentTooth={currentTooth}
          isRecording={isRecording}
          onRecordingChange={setIsRecording}
        />

        {/* Chart canvas */}
        <PerioChartCanvas
          chart={chart}
          onUpdate={handleChartUpdate}
          onVoiceCommand={handleVoiceCommand}
          isRecording={isRecording}
          currentTooth={currentTooth}
          chartingPhase={chartingPhase}
        />
      </Paper>
    </Box>
  );
}; 