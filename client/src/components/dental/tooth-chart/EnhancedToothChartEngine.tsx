import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Divider, 
  Grid, 
  IconButton,
  Tooltip,
  Button,
  useTheme
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import EditIcon from '@mui/icons-material/Edit';
import RestoreIcon from '@mui/icons-material/Restore';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PrintIcon from '@mui/icons-material/Print';
import SaveIcon from '@mui/icons-material/Save';
import HistoryIcon from '@mui/icons-material/History';
import InfoIcon from '@mui/icons-material/Info';

import EnhancedTooth from './EnhancedTooth';
import { 
  DentalChart, 
  ToothData, 
  ChartMode, 
  ToothClickEvent,
  ProbingSite,
  ToothSurface,
  UPPER_RIGHT_TEETH,
  UPPER_LEFT_TEETH,
  LOWER_LEFT_TEETH,
  LOWER_RIGHT_TEETH,
  initializeEmptyChart
} from '../../../types/dental';

interface EnhancedToothChartEngineProps {
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
 * EnhancedToothChartEngine uses anatomical SVG teeth to render a complete dental chart
 * with interactive probing sites and restoration surfaces.
 */
const EnhancedToothChartEngine: React.FC<EnhancedToothChartEngineProps> = ({
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
  const theme = useTheme();
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
  
  // Handle saving the chart data
  const saveChartData = () => {
    if (onDataChange) {
      onDataChange(chartData);
    }
    
    console.log('Saving chart data for patient', patientId);
    // Here you would implement your save logic, e.g., API call
  };
  
  return (
    <Box>
      {/* Control Panel */}
      <Paper 
        elevation={2}
        sx={{ 
          p: 2, 
          mb: 3, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderRadius: '8px'
        }}
      >
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
        
        <Box>
          <Typography variant="h6" fontWeight="medium" color="primary">
            {activeMode === 'perio' ? 'Periodontal Chart' : 
             activeMode === 'restorative' ? 'Restorative Chart' : 
             'Comprehensive Dental Chart'}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="outlined" 
            size="small" 
            startIcon={<HistoryIcon />}
          >
            History
          </Button>
          
          <Button 
            variant="outlined" 
            size="small" 
            startIcon={<PrintIcon />}
          >
            Print
          </Button>
          
          <Button 
            variant="contained" 
            color="primary" 
            size="small" 
            startIcon={<SaveIcon />}
            onClick={saveChartData} 
            disabled={readOnly}
          >
            Save
          </Button>
        </Box>
      </Paper>
      
      {/* Voice Feedback Panel */}
      {isVoiceActive && (
        <Paper 
          elevation={2}
          sx={{ 
            p: 3, 
            mb: 3, 
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.15)' : 'rgba(25, 118, 210, 0.05)',
            border: '1px solid',
            borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(25, 118, 210, 0.2)',
            borderRadius: '8px'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box 
              sx={{ 
                display: 'inline-flex',
                animation: 'pulse 1.5s infinite',
                '@keyframes pulse': {
                  '0%': { opacity: 0.5 },
                  '50%': { opacity: 1 },
                  '100%': { opacity: 0.5 }
                }
              }}
            >
              <MicIcon color="error" sx={{ mr: 1 }} />
            </Box>
            <Typography variant="subtitle1" fontWeight="medium">
              Voice Input Active
            </Typography>
          </Box>
          
          <Typography variant="body2" sx={{ mb: 2 }}>
            Examples of voice commands:
          </Typography>
          
          <Box sx={{ ml: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              "Tooth 8, mesio-buccal, 3 millimeters"
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              "Tooth 19, bleeding on distal"
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              "Tooth 30, recession 2 millimeters"
            </Typography>
            <Typography variant="body2">
              "Tooth 14, mobility 2"
            </Typography>
          </Box>
        </Paper>
      )}
      
      {/* Patient Info Bar */}
      <Paper 
        elevation={3}
        sx={{ 
          p: 2, 
          mb: 3, 
          bgcolor: theme.palette.background.paper,
          borderRadius: '8px'
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {patientId && (
                <Typography variant="body1">
                  Patient ID: <strong>{patientId}</strong>
                </Typography>
              )}
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Typography variant="body2" color="text.secondary">
              Exam Date: {examDate.toLocaleDateString()}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Dental Chart */}
      <Paper 
        elevation={3}
        sx={{ 
          p: 3, 
          borderRadius: '8px',
          overflow: 'hidden'
        }}
      >
        {/* Upper Arch */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="subtitle2" 
            color="primary"
            sx={{ 
              pb: 1, 
              borderBottom: '1px solid',
              borderColor: theme.palette.divider,
              mb: 2 
            }}
          >
            Upper Teeth
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
            {UPPER_RIGHT_TEETH.map(toothNumber => (
              <Box key={`upper-right-${toothNumber}`} sx={{ m: 0.5 }}>
                <EnhancedTooth
                  data={chartData[toothNumber]}
                  mode={activeMode}
                  onToothClick={handleToothClick}
                  active={activeTooth === toothNumber}
                  size={size}
                />
              </Box>
            ))}
            
            {UPPER_LEFT_TEETH.map(toothNumber => (
              <Box key={`upper-left-${toothNumber}`} sx={{ m: 0.5 }}>
                <EnhancedTooth
                  data={chartData[toothNumber]}
                  mode={activeMode}
                  onToothClick={handleToothClick}
                  active={activeTooth === toothNumber}
                  size={size}
                />
              </Box>
            ))}
          </Box>
        </Box>
        
        <Divider sx={{ my: 4 }} />
        
        {/* Lower Arch */}
        <Box>
          <Typography 
            variant="subtitle2" 
            color="primary"
            sx={{ 
              pb: 1, 
              borderBottom: '1px solid',
              borderColor: theme.palette.divider,
              mb: 2 
            }}
          >
            Lower Teeth
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
            {LOWER_LEFT_TEETH.map(toothNumber => (
              <Box key={`lower-left-${toothNumber}`} sx={{ m: 0.5 }}>
                <EnhancedTooth
                  data={chartData[toothNumber]}
                  mode={activeMode}
                  onToothClick={handleToothClick}
                  active={activeTooth === toothNumber}
                  size={size}
                />
              </Box>
            ))}
            
            {LOWER_RIGHT_TEETH.map(toothNumber => (
              <Box key={`lower-right-${toothNumber}`} sx={{ m: 0.5 }}>
                <EnhancedTooth
                  data={chartData[toothNumber]}
                  mode={activeMode}
                  onToothClick={handleToothClick}
                  active={activeTooth === toothNumber}
                  size={size}
                />
              </Box>
            ))}
          </Box>
        </Box>
      </Paper>
      
      {/* Legend */}
      <Paper 
        elevation={2}
        sx={{ 
          p: 2, 
          mt: 3, 
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
          borderRadius: '8px'
        }}
      >
        <Typography 
          variant="subtitle2" 
          color="primary"
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 1 
          }}
        >
          <InfoIcon fontSize="small" sx={{ mr: 0.5 }} />
          Chart Legend
        </Typography>
        
        <Grid container spacing={2}>
          {activeMode === 'perio' && (
            <>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: 'rgba(76, 175, 80, 0.7)', mr: 1, borderRadius: '50%' }} />
                  <Typography variant="caption">1-3mm (Healthy)</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: 'rgba(255, 152, 0, 0.7)', mr: 1, borderRadius: '50%' }} />
                  <Typography variant="caption">4-5mm (Moderate)</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: 'rgba(244, 67, 54, 0.7)', mr: 1, borderRadius: '50%' }} />
                  <Typography variant="caption">6mm+ (Severe)</Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: 'white', border: '1px solid #ccc', mr: 1, borderRadius: '50%', position: 'relative' }}>
                    <Box sx={{ position: 'absolute', top: 0, right: 0, width: 6, height: 6, borderRadius: '50%', bgcolor: 'error.main' }} />
                  </Box>
                  <Typography variant="caption">Bleeding on Probing</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: 'white', border: '1px solid #ccc', mr: 1, borderRadius: '50%', position: 'relative' }}>
                    <Box sx={{ position: 'absolute', bottom: 0, right: 0, width: 6, height: 6, borderRadius: '50%', bgcolor: 'warning.main' }} />
                  </Box>
                  <Typography variant="caption">Suppuration</Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ display: 'inline-block', border: '1px solid', borderColor: 'warning.main', borderRadius: '4px', px: 0.5, mr: 1, color: 'warning.main' }}>M1</Typography>
                  <Typography variant="caption">Mobility Grade 1</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ display: 'inline-block', border: '1px solid', borderColor: 'error.main', borderRadius: '4px', px: 0.5, mr: 1, color: 'error.main' }}>F2</Typography>
                  <Typography variant="caption">Furcation Grade 2</Typography>
                </Box>
              </Grid>
            </>
          )}
          
          {activeMode === 'restorative' && (
            <>
              <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: '#a9a9a9', mr: 1, border: '1px solid rgba(0,0,0,0.2)' }} />
                  <Typography variant="caption">Amalgam (A)</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: '#f5f5dc', mr: 1, border: '1px solid rgba(0,0,0,0.2)' }} />
                  <Typography variant="caption">Composite (C)</Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: '#ffd700', mr: 1, border: '1px solid rgba(0,0,0,0.2)' }} />
                  <Typography variant="caption">Gold (G)</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: '#d3d3d3', mr: 1, border: '1px solid rgba(0,0,0,0.2)' }} />
                  <Typography variant="caption">PFM Crown (P)</Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: '#ffffff', mr: 1, border: '1px solid rgba(0,0,0,0.2)' }} />
                  <Typography variant="caption">Ceramic (E)</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: '#b0c4de', mr: 1, border: '1px solid rgba(0,0,0,0.2)' }} />
                  <Typography variant="caption">Implant (I)</Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Box sx={{ width: 4, height: 16, bgcolor: '#ff5252', mr: 1 }} />
                  <Typography variant="caption">Root Canal</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: '#f5f5f5', mr: 1, border: '1px solid #ccc', opacity: 0.3 }} />
                  <Typography variant="caption">Missing</Typography>
                </Box>
              </Grid>
            </>
          )}
          
          {activeMode === 'comprehensive' && (
            <Grid item xs={12}>
              <Typography variant="body2">
                This view combines periodontal and restorative information in a single chart.
                Both perio measurements and restoration materials are displayed simultaneously.
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>
    </Box>
  );
};

export default EnhancedToothChartEngine; 