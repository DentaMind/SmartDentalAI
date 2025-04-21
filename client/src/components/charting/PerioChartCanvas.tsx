import React, { useCallback, useState, useEffect } from 'react';
import { Box, Paper, Typography, Tooltip, IconButton, Popover, TextField, Slider, Select, MenuItem, FormControl, InputLabel, Grid, Alert, Snackbar } from '@mui/material';
import { Edit, Info, Add, Remove, Warning, Error, Mic, MicOff, TrendingUp, TrendingDown } from '@mui/icons-material';
import { PerioChart, PerioToothMeasurement, PerioVoiceCommand } from '@shared/schema';
import { toothNumberSchema } from '@shared/tooth-mapping';
import { usePerioVoiceCommands } from '@client/hooks/usePerioVoiceCommands';

interface PerioChartCanvasProps {
  chart: PerioChart;
  onUpdate: (chart: PerioChart) => void;
  onVoiceCommand: (command: PerioVoiceCommand) => void;
  isRecording: boolean;
  currentTooth?: number;
  chartingPhase?: 'maxillary_buccal' | 'maxillary_lingual' | 'mandibular_buccal' | 'mandibular_lingual';
}

interface MeasurementInputProps {
  toothNumber: number;
  surface: 'buccal' | 'lingual';
  site: 'mb' | 'b' | 'db' | 'ml' | 'l' | 'dl';
  measurement: PerioMeasurement;
  onUpdate: (value: number, field: 'pd' | 'rec') => void;
}

interface ValidationWarning {
  type: 'warning' | 'error';
  message: string;
}

interface SiteNavigation {
  surface: 'buccal' | 'lingual';
  site: 'mb' | 'b' | 'db' | 'ml' | 'l' | 'dl';
}

interface ToothNavigation {
  currentTooth: number;
  currentSurface: 'buccal' | 'lingual';
  currentSite: 'mb' | 'b' | 'db' | 'ml' | 'l' | 'dl';
}

const SITE_NAVIGATION_ORDER: SiteNavigation[] = [
  { surface: 'buccal', site: 'mb' },
  { surface: 'buccal', site: 'b' },
  { surface: 'buccal', site: 'db' },
  { surface: 'lingual', site: 'ml' },
  { surface: 'lingual', site: 'l' },
  { surface: 'lingual', site: 'dl' }
];

const FURCATION_SUPPORTED_TEETH = [1, 2, 3, 14, 15, 16, 17, 18, 19, 30, 31, 32];

// Add these constants after existing constants
const MAXILLARY_TEETH = Array.from({ length: 16 }, (_, i) => 16 - i);
const MANDIBULAR_TEETH = Array.from({ length: 16 }, (_, i) => 32 - i);
const ALL_TEETH = [...MAXILLARY_TEETH, ...MANDIBULAR_TEETH];

// Color mapping for probing depths
const getProbingColor = (pd: number) => {
  if (pd >= 7) return '#ff0000'; // Red for severe
  if (pd >= 5) return '#ff6b6b'; // Light red for moderate
  if (pd >= 3) return '#ffd700'; // Yellow for mild
  return '#90ee90'; // Green for normal
};

const MeasurementInput: React.FC<MeasurementInputProps> = ({
  toothNumber,
  surface,
  site,
  measurement,
  onUpdate
}) => {
  const siteLabels = {
    mb: 'Mesiobuccal',
    b: 'Buccal',
    db: 'Distobuccal',
    ml: 'Mesiolingual',
    l: 'Lingual',
    dl: 'Distolingual'
  };

  const [validationWarning, setValidationWarning] = useState<ValidationWarning | null>(null);
  const [showWarning, setShowWarning] = useState(false);

  const validateMeasurement = (value: number, field: 'pd' | 'rec') => {
    const warnings: ValidationWarning[] = [];
    
    // PD validation
    if (field === 'pd' && value > 8) {
      warnings.push({
        type: 'warning',
        message: 'Probing depth > 8mm - Please verify measurement'
      });
    }
    
    // CAL validation
    const cal = field === 'pd' ? value + measurement.rec : measurement.pd + value;
    if (cal > 12) {
      warnings.push({
        type: 'warning',
        message: 'CAL > 12mm - Please verify measurements'
      });
    }
    
    // Impossible CAL validation
    if (cal < measurement.pd) {
      warnings.push({
        type: 'error',
        message: 'CAL cannot be less than PD - Please check recession value'
      });
    }

    return warnings[0] || null;
  };

  const handleUpdate = (value: number, field: 'pd' | 'rec') => {
    const warning = validateMeasurement(value, field);
    setValidationWarning(warning);
    setShowWarning(!!warning);
    onUpdate(value, field);
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: 'pd' | 'rec') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Find next input field
      const currentIndex = SITE_NAVIGATION_ORDER.findIndex(
        s => s.surface === surface && s.site === site
      );
      const nextIndex = (currentIndex + 1) % SITE_NAVIGATION_ORDER.length;
      const nextSite = SITE_NAVIGATION_ORDER[nextIndex];
      
      // Focus next input
      const nextInput = document.querySelector(
        `input[data-surface="${nextSite.surface}"][data-site="${nextSite.site}"][data-field="${field}"]`
      ) as HTMLInputElement;
      
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        {siteLabels[site]}
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Typography variant="caption">Probing Depth (mm)</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              size="small"
              type="number"
              value={measurement.pd}
              onChange={(e) => handleUpdate(Number(e.target.value), 'pd')}
              onKeyDown={(e) => handleKeyDown(e, 'pd')}
              inputProps={{ 
                min: 0, 
                max: 10, 
                step: 0.5,
                'data-surface': surface,
                'data-site': site,
                'data-field': 'pd'
              }}
              sx={{ width: 80 }}
            />
            <Slider
              value={measurement.pd}
              onChange={(_, value) => handleUpdate(value as number, 'pd')}
              min={0}
              max={10}
              step={0.5}
              marks
              sx={{ flex: 1 }}
            />
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="caption">Recession (mm)</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              size="small"
              type="number"
              value={measurement.rec}
              onChange={(e) => handleUpdate(Number(e.target.value), 'rec')}
              onKeyDown={(e) => handleKeyDown(e, 'rec')}
              inputProps={{ 
                min: 0, 
                max: 10, 
                step: 0.5,
                'data-surface': surface,
                'data-site': site,
                'data-field': 'rec'
              }}
              sx={{ width: 80 }}
            />
            <Slider
              value={measurement.rec}
              onChange={(_, value) => handleUpdate(value as number, 'rec')}
              min={0}
              max={10}
              step={0.5}
              marks
              sx={{ flex: 1 }}
            />
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="caption" color="text.secondary">
            CAL: {measurement.pd + measurement.rec}mm
          </Typography>
        </Grid>
      </Grid>
      <Snackbar
        open={showWarning}
        autoHideDuration={6000}
        onClose={() => setShowWarning(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity={validationWarning?.type === 'error' ? 'error' : 'warning'}
          icon={validationWarning?.type === 'error' ? <Error /> : <Warning />}
          onClose={() => setShowWarning(false)}
        >
          {validationWarning?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Add this function to get the next tooth in sequence
const getNextTooth = (currentTooth: number, surface: 'buccal' | 'lingual'): number | null => {
  const currentIndex = ALL_TEETH.indexOf(currentTooth);
  if (currentIndex === -1) return null;

  if (surface === 'buccal') {
    if (currentTooth <= 16) {
      // Maxillary buccal: 1 → 16
      return currentTooth < 16 ? currentTooth + 1 : null;
    } else {
      // Mandibular buccal: 32 → 17
      return currentTooth > 17 ? currentTooth - 1 : null;
    }
  } else {
    if (currentTooth <= 16) {
      // Maxillary lingual: 16 → 1
      return currentTooth > 1 ? currentTooth - 1 : null;
    } else {
      // Mandibular lingual: 17 → 32
      return currentTooth < 32 ? currentTooth + 1 : null;
    }
  }
};

// Update the PerioChartCanvas component
export const PerioChartCanvas: React.FC<PerioChartCanvasProps> = ({
  chart,
  onUpdate,
  onVoiceCommand,
  isRecording,
  currentTooth,
  chartingPhase
}) => {
  const [editingTooth, setEditingTooth] = useState<number | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [currentNavigation, setCurrentNavigation] = useState<ToothNavigation | null>(null);
  const [toothNavigation, setToothNavigation] = useState<ToothNavigation>({
    currentTooth: 1,
    currentSurface: 'buccal',
    currentSite: 'mb'
  });

  // Get measurement for a specific tooth and site
  const getMeasurement = useCallback((toothNumber: number, surface: 'buccal' | 'lingual', site: 'mb' | 'b' | 'db' | 'ml' | 'l' | 'dl') => {
    const tooth = chart.measurements.find(m => m.toothNumber === toothNumber);
    if (!tooth) return null;
    return tooth[surface][site];
  }, [chart]);

  // Handle tooth click
  const handleToothClick = useCallback((toothNumber: number, event: React.MouseEvent<HTMLElement>) => {
    setEditingTooth(toothNumber);
    setAnchorEl(event.currentTarget);
  }, []);

  // Handle measurement update
  const handleMeasurementUpdate = useCallback((toothNumber: number, surface: 'buccal' | 'lingual', site: 'mb' | 'b' | 'db' | 'ml' | 'l' | 'dl', field: 'pd' | 'rec', value: number) => {
    const updatedChart = { ...chart };
    let tooth = updatedChart.measurements.find(m => m.toothNumber === toothNumber);
    
    if (!tooth) {
      tooth = {
        toothNumber,
        buccal: { mb: { pd: 0, rec: 0, cal: 0 }, b: { pd: 0, rec: 0, cal: 0 }, db: { pd: 0, rec: 0, cal: 0 } },
        lingual: { ml: { pd: 0, rec: 0, cal: 0 }, l: { pd: 0, rec: 0, cal: 0 }, dl: { pd: 0, rec: 0, cal: 0 } }
      };
      updatedChart.measurements.push(tooth);
    }

    tooth[surface][site][field] = value;
    tooth[surface][site].cal = tooth[surface][site].pd + tooth[surface][site].rec;
    
    onUpdate(updatedChart);
  }, [chart, onUpdate]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!editingTooth) return;

    const currentIndex = ALL_TEETH.indexOf(editingTooth);
    let nextTooth: number | null = null;

    switch (e.key) {
      case 'ArrowLeft':
        nextTooth = currentIndex > 0 ? ALL_TEETH[currentIndex - 1] : null;
        break;
      case 'ArrowRight':
        nextTooth = currentIndex < ALL_TEETH.length - 1 ? ALL_TEETH[currentIndex + 1] : null;
        break;
      case 'Escape':
        setEditingTooth(null);
        setAnchorEl(null);
        return;
      default:
        return;
    }

    if (nextTooth) {
      // Find the tooth element
      const nextToothElement = document.querySelector(
        `[data-tooth-number="${nextTooth}"]`
      ) as HTMLElement;

      if (nextToothElement) {
        // Close current popover
        setEditingTooth(null);
        setAnchorEl(null);

        // Open new popover after a short delay
        setTimeout(() => {
          setEditingTooth(nextTooth);
          setAnchorEl(nextToothElement);
          
          // Focus on the first input field (MB buccal PD)
          const firstInput = document.querySelector(
            'input[data-surface="buccal"][data-site="mb"][data-field="pd"]'
          ) as HTMLInputElement;
          
          if (firstInput) {
            firstInput.focus();
            firstInput.select();
          }
        }, 100);
      }
    }
  }, [editingTooth]);

  // Add keyboard event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Update the handleVoiceCommand function
  const handleVoiceCommand = useCallback((command: PerioVoiceCommand) => {
    if (command.type === 'measurement' && editingTooth) {
      const updatedChart = { ...chart };
      let tooth = updatedChart.measurements.find(m => m.toothNumber === editingTooth);
      
      if (!tooth) {
        tooth = {
          toothNumber: editingTooth,
          buccal: { mb: { pd: 0, rec: 0, cal: 0 }, b: { pd: 0, rec: 0, cal: 0 }, db: { pd: 0, rec: 0, cal: 0 } },
          lingual: { ml: { pd: 0, rec: 0, cal: 0 }, l: { pd: 0, rec: 0, cal: 0 }, dl: { pd: 0, rec: 0, cal: 0 } }
        };
        updatedChart.measurements.push(tooth);
      }

      // Update measurements based on voice command
      const sites = ['mb', 'b', 'db', 'ml', 'l', 'dl'];
      command.measurements.forEach((pd, index) => {
        if (index < sites.length) {
          const site = sites[index];
          const surface = command.surface;
          tooth[surface][site].pd = pd;
          tooth[surface][site].cal = tooth[surface][site].pd + tooth[surface][site].rec;
        }
      });

      onUpdate(updatedChart);

      // Auto-advance to next site
      const nextSite = getNextSite(toothNavigation.currentSite);
      if (nextSite) {
        setToothNavigation(prev => ({
          ...prev,
          currentSite: nextSite
        }));
      } else {
        // Move to next tooth
        const nextTooth = getNextTooth(editingTooth, toothNavigation.currentSurface);
        if (nextTooth) {
          setEditingTooth(nextTooth);
          setToothNavigation(prev => ({
            currentTooth: nextTooth,
            currentSurface: prev.currentSurface,
            currentSite: 'mb'
          }));
        }
      }
    } else if (command.type === 'recession' && editingTooth) {
      const updatedChart = { ...chart };
      let tooth = updatedChart.measurements.find(m => m.toothNumber === editingTooth);
      
      if (!tooth) {
        tooth = {
          toothNumber: editingTooth,
          buccal: { mb: { pd: 0, rec: 0, cal: 0 }, b: { pd: 0, rec: 0, cal: 0 }, db: { pd: 0, rec: 0, cal: 0 } },
          lingual: { ml: { pd: 0, rec: 0, cal: 0 }, l: { pd: 0, rec: 0, cal: 0 }, dl: { pd: 0, rec: 0, cal: 0 } }
        };
        updatedChart.measurements.push(tooth);
      }

      // Update recession values
      const sites = ['mb', 'b', 'db', 'ml', 'l', 'dl'];
      command.values.forEach((rec, index) => {
        if (index < sites.length) {
          const site = sites[index];
          const surface = index < 3 ? 'buccal' : 'lingual';
          tooth[surface][site].rec = rec;
          tooth[surface][site].cal = tooth[surface][site].pd + rec;
        }
      });

      onUpdate(updatedChart);
    } else if (command.type === 'mobility' && editingTooth) {
      const updatedChart = { ...chart };
      let tooth = updatedChart.measurements.find(m => m.toothNumber === editingTooth);
      
      if (!tooth) {
        tooth = {
          toothNumber: editingTooth,
          buccal: { mb: { pd: 0, rec: 0, cal: 0 }, b: { pd: 0, rec: 0, cal: 0 }, db: { pd: 0, rec: 0, cal: 0 } },
          lingual: { ml: { pd: 0, rec: 0, cal: 0 }, l: { pd: 0, rec: 0, cal: 0 }, dl: { pd: 0, rec: 0, cal: 0 } }
        };
        updatedChart.measurements.push(tooth);
      }

      tooth.mobility = { grade: command.grade };
      onUpdate(updatedChart);
    } else if (command.type === 'furcation' && editingTooth) {
      if (!FURCATION_SUPPORTED_TEETH.includes(editingTooth)) {
        setError('Furcation not typically present on this tooth');
        return;
      }

      const updatedChart = { ...chart };
      let tooth = updatedChart.measurements.find(m => m.toothNumber === editingTooth);
      
      if (!tooth) {
        tooth = {
          toothNumber: editingTooth,
          buccal: { mb: { pd: 0, rec: 0, cal: 0 }, b: { pd: 0, rec: 0, cal: 0 }, db: { pd: 0, rec: 0, cal: 0 } },
          lingual: { ml: { pd: 0, rec: 0, cal: 0 }, l: { pd: 0, rec: 0, cal: 0 }, dl: { pd: 0, rec: 0, cal: 0 } }
        };
        updatedChart.measurements.push(tooth);
      }

      if (!tooth.furcation) {
        tooth.furcation = [];
      }

      // Update or add furcation involvement
      const existingIndex = tooth.furcation.findIndex(f => f.location === command.location);
      if (existingIndex >= 0) {
        tooth.furcation[existingIndex].grade = command.grade;
      } else {
        tooth.furcation.push({
          grade: command.grade,
          location: command.location
        });
      }

      onUpdate(updatedChart);
    } else if (command.type === 'navigation') {
      switch (command.action) {
        case 'next':
          // Find next tooth in sequence
          const currentIndex = ALL_TEETH.indexOf(editingTooth || 0);
          if (currentIndex < ALL_TEETH.length - 1) {
            const nextTooth = ALL_TEETH[currentIndex + 1];
            const nextToothElement = document.querySelector(
              `[data-tooth-number="${nextTooth}"]`
            ) as HTMLElement;
            if (nextToothElement) {
              setEditingTooth(nextTooth);
              setAnchorEl(nextToothElement);
            }
          }
          break;
        case 'back':
          // Find previous tooth in sequence
          const prevIndex = ALL_TEETH.indexOf(editingTooth || 0);
          if (prevIndex > 0) {
            const prevTooth = ALL_TEETH[prevIndex - 1];
            const prevToothElement = document.querySelector(
              `[data-tooth-number="${prevTooth}"]`
            ) as HTMLElement;
            if (prevToothElement) {
              setEditingTooth(prevTooth);
              setAnchorEl(prevToothElement);
            }
          }
          break;
        case 'clear':
          // Clear current tooth measurements
          if (editingTooth) {
            const updatedChart = { ...chart };
            const toothIndex = updatedChart.measurements.findIndex(m => m.toothNumber === editingTooth);
            if (toothIndex !== -1) {
              updatedChart.measurements.splice(toothIndex, 1);
              onUpdate(updatedChart);
            }
          }
          break;
        case 'repeat':
          // Repeat last tooth (no action needed as we're already on it)
          break;
      }
    }
  }, [chart, editingTooth, onUpdate, toothNavigation]);

  // Initialize voice commands
  const {
    isListening,
    transcript,
    error,
    toggleListening
  } = usePerioVoiceCommands({
    onCommand: handleVoiceCommand,
    isEnabled: true
  });

  // Add this function to get the next site in sequence
  const getNextSite = (currentSite: string): 'mb' | 'b' | 'db' | 'ml' | 'l' | 'dl' | null => {
    const sites = ['mb', 'b', 'db', 'ml', 'l', 'dl'];
    const currentIndex = sites.indexOf(currentSite);
    return currentIndex < sites.length - 1 ? sites[currentIndex + 1] as any : null;
  };

  // Update the renderTooth function
  const renderTooth = useCallback((toothNumber: number) => {
    const isMaxillary = toothNumber <= 16;
    const isCurrent = toothNumber === currentTooth;
    const isBuccal = chartingPhase?.includes('buccal');
    const isActiveSurface = (isMaxillary && isBuccal) || (!isMaxillary && !isBuccal);

    return (
      <Box
        key={toothNumber}
        data-tooth-number={toothNumber}
        sx={{
          position: 'relative',
          border: isCurrent ? '2px solid #1976d2' : '1px solid #ccc',
          borderRadius: '4px',
          p: 1,
          m: 0.5,
          bgcolor: isCurrent ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'rgba(0, 0, 0, 0.04)'
          }
        }}
        onClick={(e) => handleToothClick(toothNumber, e)}
      >
        <Typography variant="body2" sx={{ textAlign: 'center', mb: 1 }}>
          {toothNumber}
        </Typography>

        {/* Buccal measurements */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {['mb', 'b', 'db'].map((site) => {
            const measurement = getMeasurement(toothNumber, 'buccal', site as 'mb' | 'b' | 'db');
            return (
              <Tooltip
                key={site}
                title={measurement ? `PD: ${measurement.pd}mm, REC: ${measurement.rec}mm, CAL: ${measurement.cal}mm` : 'No measurement'}
              >
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    bgcolor: measurement ? getProbingColor(measurement.pd) : '#f5f5f5',
                    border: '1px solid #ccc',
                    borderRadius: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {measurement?.pd || '-'}
                </Box>
              </Tooltip>
            );
          })}
        </Box>

        {/* Lingual measurements */}
        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
          {['ml', 'l', 'dl'].map((site) => {
            const measurement = getMeasurement(toothNumber, 'lingual', site as 'ml' | 'l' | 'dl');
            return (
              <Tooltip
                key={site}
                title={measurement ? `PD: ${measurement.pd}mm, REC: ${measurement.rec}mm, CAL: ${measurement.cal}mm` : 'No measurement'}
              >
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    bgcolor: measurement ? getProbingColor(measurement.pd) : '#f5f5f5',
                    border: '1px solid #ccc',
                    borderRadius: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {measurement?.pd || '-'}
                </Box>
              </Tooltip>
            );
          })}
        </Box>

        {/* Furcation and Mobility indicators */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
          <Tooltip title="Furcation">
            <Typography variant="caption" sx={{ mr: 1 }}>
              F: {getMeasurement(toothNumber, 'buccal', 'mb')?.furcation || '-'}
            </Typography>
          </Tooltip>
          <Tooltip title="Mobility">
            <Typography variant="caption">
              M: {getMeasurement(toothNumber, 'buccal', 'mb')?.mobility || '-'}
            </Typography>
          </Tooltip>
        </Box>
      </Box>
    );
  }, [currentTooth, chartingPhase, getMeasurement, handleToothClick]);

  // Add keyboard navigation instructions to the popover
  const renderKeyboardInstructions = () => (
    <Box sx={{ mt: 2, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
      <Typography variant="caption" color="text.secondary">
        Keyboard Navigation:
      </Typography>
      <Box component="ul" sx={{ mt: 0.5, pl: 2, mb: 0 }}>
        <Typography component="li" variant="caption">
          ← → : Navigate between teeth
        </Typography>
        <Typography component="li" variant="caption">
          Enter : Next measurement site
        </Typography>
        <Typography component="li" variant="caption">
          Esc : Close popover
        </Typography>
      </Box>
    </Box>
  );

  // Add these components after existing components
  const renderSiteInputs = (surface: 'buccal' | 'lingual', sites: ('mb' | 'b' | 'db' | 'ml' | 'l' | 'dl')[]) => {
    return sites.map((site) => {
      const measurement = getMeasurement(editingTooth, surface, site);
      if (!measurement) return null;

      return (
        <Grid container spacing={2} key={`${surface}-${site}`} sx={{ mb: 2 }}>
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {site.toUpperCase()} Site
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <TextField
              fullWidth
              label="PD (mm)"
              type="number"
              value={measurement.pd}
              onChange={(e) => handleMeasurementUpdate(editingTooth, surface, site, 'pd', Number(e.target.value))}
              inputProps={{ min: 0, max: 10, step: 0.5 }}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              fullWidth
              label="Rec (mm)"
              type="number"
              value={measurement.rec}
              onChange={(e) => handleMeasurementUpdate(editingTooth, surface, site, 'rec', Number(e.target.value))}
              inputProps={{ min: 0, max: 10, step: 0.5 }}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              fullWidth
              label="CAL (mm)"
              value={measurement.cal}
              InputProps={{ readOnly: true }}
            />
          </Grid>
        </Grid>
      );
    });
  };

  const renderMobilityInput = () => {
    const tooth = chart.measurements.find(m => m.toothNumber === editingTooth);
    const mobility = tooth?.mobility?.grade ?? 0;

    return (
      <FormControl fullWidth sx={{ mt: 2 }}>
        <InputLabel>Mobility</InputLabel>
        <Select
          value={mobility}
          onChange={(e) => {
            const updatedChart = { ...chart };
            let tooth = updatedChart.measurements.find(m => m.toothNumber === editingTooth);
            
            if (!tooth) {
              tooth = {
                toothNumber: editingTooth,
                buccal: { mb: { pd: 0, rec: 0, cal: 0 }, b: { pd: 0, rec: 0, cal: 0 }, db: { pd: 0, rec: 0, cal: 0 } },
                lingual: { ml: { pd: 0, rec: 0, cal: 0 }, l: { pd: 0, rec: 0, cal: 0 }, dl: { pd: 0, rec: 0, cal: 0 } }
              };
              updatedChart.measurements.push(tooth);
            }

            tooth.mobility = { grade: e.target.value as 0 | 1 | 2 | 3 };
            onUpdate(updatedChart);
          }}
        >
          {MOBILITY_LABELS.map((label, index) => (
            <MenuItem key={index} value={index}>
              {index} - {label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  };

  const renderFurcationInput = () => {
    if (!FURCATION_SUPPORTED_TEETH.includes(editingTooth)) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          Furcation not typically present on this tooth
        </Alert>
      );
    }

    const tooth = chart.measurements.find(m => m.toothNumber === editingTooth);
    const furcation = tooth?.furcation ?? [];

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Furcation Involvement
        </Typography>
        <Grid container spacing={2}>
          {['buccal', 'lingual', 'mesial', 'distal'].map((location) => {
            const involvement = furcation.find(f => f.location === location);
            const grade = involvement?.grade ?? 0;

            return (
              <Grid item xs={6} key={location}>
                <FormControl fullWidth>
                  <InputLabel>{location.charAt(0).toUpperCase() + location.slice(1)}</InputLabel>
                  <Select
                    value={grade}
                    onChange={(e) => {
                      const updatedChart = { ...chart };
                      let tooth = updatedChart.measurements.find(m => m.toothNumber === editingTooth);
                      
                      if (!tooth) {
                        tooth = {
                          toothNumber: editingTooth,
                          buccal: { mb: { pd: 0, rec: 0, cal: 0 }, b: { pd: 0, rec: 0, cal: 0 }, db: { pd: 0, rec: 0, cal: 0 } },
                          lingual: { ml: { pd: 0, rec: 0, cal: 0 }, l: { pd: 0, rec: 0, cal: 0 }, dl: { pd: 0, rec: 0, cal: 0 } }
                        };
                        updatedChart.measurements.push(tooth);
                      }

                      if (!tooth.furcation) {
                        tooth.furcation = [];
                      }

                      const existingIndex = tooth.furcation.findIndex(f => f.location === location);
                      if (existingIndex >= 0) {
                        tooth.furcation[existingIndex].grade = e.target.value as 0 | 1 | 2 | 3;
                      } else {
                        tooth.furcation.push({
                          grade: e.target.value as 0 | 1 | 2 | 3,
                          location: location as 'buccal' | 'lingual' | 'mesial' | 'distal'
                        });
                      }

                      onUpdate(updatedChart);
                    }}
                  >
                    {FURCATION_GRADES.map((label, index) => (
                      <MenuItem key={index} value={index}>
                        {label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    );
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* Maxillary teeth (1-16) */}
        <Box sx={{ display: 'flex', flexDirection: 'row-reverse', mb: 2 }}>
          {MAXILLARY_TEETH.map(renderTooth)}
        </Box>

        {/* Mandibular teeth (17-32) */}
        <Box sx={{ display: 'flex', flexDirection: 'row-reverse' }}>
          {MANDIBULAR_TEETH.map(renderTooth)}
        </Box>
      </Box>

      {/* Measurement Popover */}
      <Popover
        open={!!editingTooth}
        anchorEl={anchorEl}
        onClose={() => {
          setEditingTooth(null);
          setAnchorEl(null);
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 3, minWidth: 400 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Edit Measurements - Tooth {editingTooth}
            </Typography>
            <IconButton
              onClick={toggleListening}
              color={isListening ? 'error' : 'default'}
              sx={{ ml: 2 }}
            >
              {isListening ? <MicOff /> : <Mic />}
            </IconButton>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {isListening && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Listening... {transcript && `"${transcript}"`}
            </Alert>
          )}
          
          {editingTooth && (
            <>
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                Buccal
              </Typography>
              {renderSiteInputs('buccal', ['mb', 'b', 'db'])}

              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                Lingual
              </Typography>
              {renderSiteInputs('lingual', ['ml', 'l', 'dl'])}

              {renderMobilityInput()}
              {renderFurcationInput()}
            </>
          )}
          
          {renderKeyboardInstructions()}

          <Box sx={{ mt: 2, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Voice Commands:
            </Typography>
            <Box component="ul" sx={{ mt: 0.5, pl: 2, mb: 0 }}>
              <Typography component="li" variant="caption">
                "Tooth 14 MB 3" - Record 3mm on MB site
              </Typography>
              <Typography component="li" variant="caption">
                "Tooth 30 lingual 4 4 5" - Bulk input for lingual sites
              </Typography>
              <Typography component="li" variant="caption">
                "Tooth 14 recession 1 2 1" - Record recession values
              </Typography>
              <Typography component="li" variant="caption">
                "Tooth 18 mobility 2" - Set mobility grade
              </Typography>
              <Typography component="li" variant="caption">
                "Tooth 2 furcation buccal 2" - Set furcation grade
              </Typography>
              <Typography component="li" variant="caption">
                "Next tooth", "Back", "Clear", "Repeat"
              </Typography>
            </Box>
          </Box>
        </Box>
      </Popover>
    </Paper>
  );
}; 