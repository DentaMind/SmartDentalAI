import React, { useState } from 'react';
import { Box, Grid, Typography, Paper, Divider, IconButton, Tooltip } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import EditIcon from '@mui/icons-material/Edit';
import RestoreIcon from '@mui/icons-material/Restore';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PrintIcon from '@mui/icons-material/Print';
import SaveIcon from '@mui/icons-material/Save';
import HistoryIcon from '@mui/icons-material/History';
import InfoIcon from '@mui/icons-material/Info';

import Tooth from './Tooth';
import {
  DentalChart,
  ToothData,
  ChartMode,
  ToothClickEvent,
  UPPER_RIGHT_TEETH,
  UPPER_LEFT_TEETH,
  LOWER_LEFT_TEETH,
  LOWER_RIGHT_TEETH,
  initializeEmptyChart,
  ProbingSite,
  ToothSurface
} from '../../../types/dental';

interface ToothChartEngineProps {
  initialData?: DentalChart;
  mode?: ChartMode;
  onDataChange?: (data: DentalChart) => void;
  onToothSelect?: (toothNumber: number, site?: ProbingSite | ToothSurface) => void;
  readOnly?: boolean;
  showVoiceCommands?: boolean;
  size?: 'small' | 'medium' | 'large';
  patientId?: string;
  examDate?: Date;
}

/**
 * ToothChartEngine is the main component for rendering a full dental chart
 * It handles the layout of all teeth and provides controls for interacting with the chart
 */
const ToothChartEngine: React.FC<ToothChartEngineProps> = ({
  initialData,
  mode = 'perio',
  onDataChange,
  onToothSelect,
  readOnly = false,
  showVoiceCommands = true,
  size = 'medium',
  patientId,
  examDate = new Date()
}) => {
  // Initialize chart data - either from props or create an empty chart
  const [chartData, setChartData] = useState<DentalChart>(initialData || initializeEmptyChart());
  const [activeMode, setActiveMode] = useState<ChartMode>(mode);
  const [activeTooth, setActiveTooth] = useState<number | null>(null);
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(false);
  
  // Handle tooth click events
  const handleToothClick = (event: ToothClickEvent) => {
    setActiveTooth(event.toothNumber);
    
    // Call the parent's onToothSelect callback if provided
    if (onToothSelect) {
      onToothSelect(event.toothNumber, event.site);
    }
  };
  
  // Toggle voice input
  const toggleVoiceInput = () => {
    setIsVoiceActive(!isVoiceActive);
    
    // Here you would implement voice recognition logic
    if (!isVoiceActive) {
      // Start voice recognition
      console.log('Starting voice recognition for dental charting');
    } else {
      // Stop voice recognition
      console.log('Stopping voice recognition');
    }
  };
  
  // Switch between perio and restorative modes
  const switchMode = (newMode: ChartMode) => {
    setActiveMode(newMode);
  };
  
  // Simulate saving the chart data
  const saveChartData = () => {
    if (onDataChange) {
      onDataChange(chartData);
    }
    
    console.log('Saving chart data for patient', patientId);
    // Here you would implement your save logic, e.g., API call
  };
  
  // Helper to update a tooth's data
  const updateToothData = (toothNumber: number, newData: Partial<ToothData>) => {
    if (readOnly) return;
    
    const updatedChart = { ...chartData };
    updatedChart[toothNumber] = {
      ...updatedChart[toothNumber],
      ...newData
    };
    
    setChartData(updatedChart);
    
    // Notify parent component of data change
    if (onDataChange) {
      onDataChange(updatedChart);
    }
  };
  
  // Render control panel with actions and mode switching
  const renderControlPanel = () => {
    return (
      <Paper sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Periodontal Mode">
            <IconButton 
              color={activeMode === 'perio' ? 'primary' : 'default'}
              onClick={() => switchMode('perio')}
            >
              <AssessmentIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Restorative Mode">
            <IconButton 
              color={activeMode === 'restorative' ? 'primary' : 'default'}
              onClick={() => switchMode('restorative')}
            >
              <RestoreIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Comprehensive Mode">
            <IconButton 
              color={activeMode === 'comprehensive' ? 'primary' : 'default'}
              onClick={() => switchMode('comprehensive')}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          
          {showVoiceCommands && (
            <Tooltip title={isVoiceActive ? "Stop Voice Input" : "Start Voice Input"}>
              <IconButton 
                color={isVoiceActive ? 'error' : 'default'}
                onClick={toggleVoiceInput}
              >
                {isVoiceActive ? <MicOffIcon /> : <MicIcon />}
              </IconButton>
            </Tooltip>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="View History">
            <IconButton>
              <HistoryIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Print Chart">
            <IconButton>
              <PrintIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Save Chart">
            <IconButton color="primary" onClick={saveChartData} disabled={readOnly}>
              <SaveIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>
    );
  };
  
  // Render voice input feedback panel
  const renderVoiceFeedback = () => {
    if (!isVoiceActive) return null;
    
    return (
      <Paper sx={{ p: 2, mb: 3, bgcolor: '#f8f9fa' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <MicIcon color="error" sx={{ mr: 1, animation: 'pulse 1.5s infinite' }} />
          <Typography variant="subtitle1" fontWeight="medium">
            Voice Input Active
          </Typography>
        </Box>
        
        <Typography variant="body2">
          Say commands like: "Tooth 8, mesio-buccal, 3mm" or "Tooth 30, distal, composite"
        </Typography>
        
        <Box sx={{ mt: 2, bgcolor: 'rgba(0,0,0,0.05)', p: 1, borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Last recognized: <span style={{ fontWeight: 'bold' }}>No commands yet</span>
          </Typography>
        </Box>
      </Paper>
    );
  };
  
  // Render legend for the current mode
  const renderLegend = () => {
    switch (activeMode) {
      case 'perio':
        return (
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Periodontal Chart Legend
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: 'rgba(76, 175, 80, 0.2)', mr: 1, border: '1px solid #ccc' }} />
                  <Typography variant="caption">1-3mm (Healthy)</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: 'rgba(255, 152, 0, 0.7)', mr: 1, border: '1px solid #ccc' }} />
                  <Typography variant="caption">4-5mm (Early Disease)</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: 'rgba(244, 67, 54, 0.7)', mr: 1, border: '1px solid #ccc' }} />
                  <Typography variant="caption">6mm+ (Severe Disease)</Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: 'white', mr: 1, border: '1px solid #ccc', position: 'relative' }}>
                    <Box sx={{ position: 'absolute', top: 0, right: 0, width: 6, height: 6, bgcolor: 'error.main', borderRadius: '50%' }} />
                  </Box>
                  <Typography variant="caption">Bleeding on Probing</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: 'white', mr: 1, border: '1px solid #ccc', position: 'relative' }}>
                    <Box sx={{ position: 'absolute', bottom: 0, right: 0, width: 6, height: 6, bgcolor: 'warning.main', borderRadius: '50%' }} />
                  </Box>
                  <Typography variant="caption">Suppuration</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ mr: 1, fontWeight: 'bold' }}>M1-M3</Typography>
                  <Typography variant="caption">Mobility Grades</Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" sx={{ mr: 1, fontWeight: 'bold' }}>F1-F3</Typography>
                  <Typography variant="caption">Furcation Grades</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: '#f5f5f5', mr: 1, border: '1px solid #ccc', opacity: 0.3 }} />
                  <Typography variant="caption">Missing Tooth</Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        );
      
      case 'restorative':
        return (
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Restorative Chart Legend
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: '#a9a9a9', mr: 1, border: '1px solid #ccc' }} />
                  <Typography variant="caption">Amalgam (A)</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: '#f5f5dc', mr: 1, border: '1px solid #ccc' }} />
                  <Typography variant="caption">Composite (C)</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: '#ffd700', mr: 1, border: '1px solid #ccc' }} />
                  <Typography variant="caption">Gold (G)</Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: '#d3d3d3', mr: 1, border: '1px solid #ccc' }} />
                  <Typography variant="caption">PFM Crown (P)</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: '#ffffff', mr: 1, border: '1px solid #ccc' }} />
                  <Typography variant="caption">Ceramic (E)</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: '#b0c4de', mr: 1, border: '1px solid #ccc' }} />
                  <Typography variant="caption">Implant (I)</Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ width: 4, height: 16, bgcolor: '#ff5252', mr: 1 }} />
                  <Typography variant="caption">Root Canal Treatment</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: '#f5f5f5', mr: 1, border: '1px solid #ccc', opacity: 0.3 }} />
                  <Typography variant="caption">Missing Tooth</Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        );
        
      case 'comprehensive':
        return (
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Comprehensive Chart Legend
            </Typography>
            <Typography variant="body2">
              <InfoIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
              This view combines periodontal and restorative information in a single chart.
            </Typography>
          </Paper>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <Box>
      {/* Control Panel */}
      {renderControlPanel()}
      
      {/* Voice Feedback */}
      {renderVoiceFeedback()}
      
      {/* Chart Legend */}
      {renderLegend()}
      
      {/* Main Chart */}
      <Paper sx={{ p: 3 }}>
        {/* Patient & Exam Info */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" fontWeight="medium">
              {activeMode === 'perio' ? 'Periodontal Chart' : 
               activeMode === 'restorative' ? 'Restorative Chart' : 
               'Comprehensive Dental Chart'}
            </Typography>
            {patientId && (
              <Typography variant="body2" color="text.secondary">
                Patient ID: {patientId}
              </Typography>
            )}
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Exam Date: {examDate.toLocaleDateString()}
            </Typography>
          </Box>
        </Box>
        
        {/* Upper Teeth (1-16) */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle2" gutterBottom>
            Upper Teeth - Facial View
          </Typography>
          
          <Grid container spacing={1} justifyContent="center">
            {/* Upper Right (1-8) */}
            {UPPER_RIGHT_TEETH.map(toothNumber => (
              <Grid item key={`upper-right-${toothNumber}`}>
                <Tooth
                  data={chartData[toothNumber]}
                  mode={activeMode}
                  onToothClick={handleToothClick}
                  active={activeTooth === toothNumber}
                  size={size}
                />
              </Grid>
            ))}
            
            {/* Upper Left (9-16) */}
            {UPPER_LEFT_TEETH.map(toothNumber => (
              <Grid item key={`upper-left-${toothNumber}`}>
                <Tooth
                  data={chartData[toothNumber]}
                  mode={activeMode}
                  onToothClick={handleToothClick}
                  active={activeTooth === toothNumber}
                  size={size}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
        
        <Divider sx={{ my: 4 }} />
        
        {/* Lower Teeth (17-32) */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Lower Teeth - Facial View
          </Typography>
          
          <Grid container spacing={1} justifyContent="center">
            {/* Lower Left (17-24) */}
            {LOWER_LEFT_TEETH.map(toothNumber => (
              <Grid item key={`lower-left-${toothNumber}`}>
                <Tooth
                  data={chartData[toothNumber]}
                  mode={activeMode}
                  onToothClick={handleToothClick}
                  active={activeTooth === toothNumber}
                  size={size}
                />
              </Grid>
            ))}
            
            {/* Lower Right (25-32) */}
            {LOWER_RIGHT_TEETH.map(toothNumber => (
              <Grid item key={`lower-right-${toothNumber}`}>
                <Tooth
                  data={chartData[toothNumber]}
                  mode={activeMode}
                  onToothClick={handleToothClick}
                  active={activeTooth === toothNumber}
                  size={size}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};

export default ToothChartEngine; 