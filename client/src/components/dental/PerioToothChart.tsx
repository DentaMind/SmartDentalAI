import React from 'react';
import { 
  Box, 
  Grid, 
  TextField, 
  Typography,
  Tooltip
} from '@mui/material';
import ToothSvg from './ToothSvg';
import { getPerioChartColors } from '../../theme/chartColors';

interface PerioToothProps {
  toothNumber: number;
  probingDepths?: Record<string, number | null>;
  recessions?: Record<string, number | null>;
  bleeding?: Record<string, boolean>;
  suppuration?: Record<string, boolean>;
  missing?: boolean;
  mobility?: number;
  furcation?: Record<string, number>;
  onProbingChange?: (site: string, value: number | null) => void;
  onBleedingToggle?: (site: string) => void;
  onSupurationToggle?: (site: string) => void;
  themeSettings: any;
}

/**
 * Component for displaying a single tooth in the periodontal chart
 * with probing depths, bleeding indicators, etc.
 */
const PerioTooth: React.FC<PerioToothProps> = ({
  toothNumber,
  probingDepths = {},
  recessions = {},
  bleeding = {},
  suppuration = {},
  missing = false,
  mobility = 0,
  furcation = {},
  onProbingChange,
  onBleedingToggle,
  onSupurationToggle,
  themeSettings
}) => {
  const perioColors = getPerioChartColors(themeSettings.mode, themeSettings.colorProfile);
  
  // Determine if the tooth is anterior (incisors, canines), or molar
  const isAnterior = (
    // Upper anteriors
    (toothNumber >= 6 && toothNumber <= 11) || 
    // Lower anteriors
    (toothNumber >= 22 && toothNumber <= 27)
  );
  
  const isMolar = (
    // Upper molars
    (toothNumber >= 1 && toothNumber <= 3) || 
    (toothNumber >= 14 && toothNumber <= 16) ||
    // Lower molars
    (toothNumber >= 17 && toothNumber <= 19) || 
    (toothNumber >= 30 && toothNumber <= 32)
  );
  
  // Determine if tooth is upper or lower
  const isUpper = toothNumber <= 16;
  
  const renderProbingCell = (site: string) => {
    const value = probingDepths[site];
    
    // Determine background color based on probing depth
    let bgColor = perioColors.normal; // Default for 0-3mm (healthy)
    
    if (value !== null && value !== undefined) {
      if (value >= 6) {
        bgColor = perioColors.severe; // 6mm+ (severe periodontitis)
      } else if (value >= 4) {
        bgColor = perioColors.mild; // 4-5mm (early periodontitis)
      }
    }
    
    return (
      <Box 
        component="div" 
        sx={{ 
          width: 36, 
          height: 36, 
          border: '1px solid #ccc',
          bgcolor: bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}
        onClick={() => onBleedingToggle && onBleedingToggle(site)}
        onContextMenu={(e) => {
          e.preventDefault();
          onSupurationToggle && onSupurationToggle(site);
        }}
      >
        <TextField
          size="small"
          inputProps={{ 
            min: 0, 
            max: 12,
            style: { 
              textAlign: 'center', 
              padding: '2px', 
              width: '100%', 
              height: '100%',
              backgroundColor: 'transparent'
            } 
          }}
          variant="standard"
          value={value === null ? '' : value}
          onChange={(e) => {
            const val = e.target.value === '' ? null : Number(e.target.value);
            onProbingChange && onProbingChange(site, val);
          }}
          sx={{ width: '100%' }}
        />
        {bleeding[site] && (
          <Box 
            sx={{ 
              position: 'absolute', 
              width: 6, 
              height: 6, 
              bgcolor: perioColors.bleeding, 
              borderRadius: '50%',
              top: 2, 
              right: 2 
            }} 
          />
        )}
        {suppuration[site] && (
          <Box 
            sx={{ 
              position: 'absolute', 
              width: 6, 
              height: 6, 
              bgcolor: perioColors.suppuration, 
              borderRadius: '50%',
              bottom: 2, 
              right: 2 
            }} 
          />
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      mb: 1
    }}>
      {/* Tooth number */}
      <Typography 
        variant="caption" 
        sx={{ 
          fontWeight: 'bold',
          mb: 0.5
        }}
      >
        {toothNumber}
      </Typography>
      
      {/* Tooth illustration */}
      <ToothSvg
        position={isUpper ? 'upper' : 'lower'}
        isAnterior={isAnterior}
        isMolar={isMolar}
        missing={missing}
        width={32}
        height={50}
        sx={{ mb: 1 }}
      />

      {/* Mobility indicator if present */}
      {mobility > 0 && (
        <Tooltip title={`Mobility Grade ${mobility}`}>
          <Typography 
            variant="caption" 
            sx={{ 
              bgcolor: perioColors.mobility,
              px: 1,
              borderRadius: 1,
              mb: 0.5,
              fontWeight: 'bold'
            }}
          >
            M{mobility}
          </Typography>
        </Tooltip>
      )}
    </Box>
  );
};

interface PerioToothRowProps {
  teethNumbers: number[];
  periosData: Record<string, any>;
  handleProbingChange: (toothNumber: number, site: string, value: number | null) => void;
  toggleBleeding: (toothNumber: number, site: string) => void;
  toggleSuppuration: (toothNumber: number, site: string) => void;
  sites: string[];
  themeSettings: any;
  reverse?: boolean;
}

/**
 * Row of teeth for the periodontal chart
 */
const PerioToothRow: React.FC<PerioToothRowProps> = ({
  teethNumbers,
  periosData,
  handleProbingChange,
  toggleBleeding,
  toggleSuppuration,
  sites,
  themeSettings,
  reverse = false
}) => {
  const orderedTeeth = reverse ? [...teethNumbers].reverse() : teethNumbers;
  
  return (
    <Grid 
      container
      spacing={0.5}
      justifyContent="center"
      alignItems="flex-start"
    >
      {orderedTeeth.map(toothNumber => (
        <Grid item key={`perio-tooth-${toothNumber}`}>
          <PerioTooth
            toothNumber={toothNumber}
            probingDepths={periosData[toothNumber]?.probing}
            recessions={periosData[toothNumber]?.recession}
            bleeding={periosData[toothNumber]?.bleeding}
            suppuration={periosData[toothNumber]?.suppuration}
            missing={periosData[toothNumber]?.missing}
            mobility={periosData[toothNumber]?.mobility}
            furcation={periosData[toothNumber]?.furcation}
            onProbingChange={(site, value) => handleProbingChange(toothNumber, site, value)}
            onBleedingToggle={(site) => toggleBleeding(toothNumber, site)}
            onSupurationToggle={(site) => toggleSuppuration(toothNumber, site)}
            themeSettings={themeSettings}
          />
        </Grid>
      ))}
    </Grid>
  );
};

interface PerioProbingSitesProps {
  teethNumbers: number[];
  periosData: Record<string, any>;
  handleProbingChange: (toothNumber: number, site: string, value: number | null) => void;
  toggleBleeding: (toothNumber: number, site: string) => void;
  toggleSuppuration: (toothNumber: number, site: string) => void;
  sites: string[];
  themeSettings: any;
  reverse?: boolean;
}

/**
 * Renders the probing sites for a row of teeth
 */
const PerioProbingSites: React.FC<PerioProbingSitesProps> = ({
  teethNumbers,
  periosData,
  handleProbingChange,
  toggleBleeding,
  toggleSuppuration,
  sites,
  themeSettings,
  reverse = false
}) => {
  const orderedTeeth = reverse ? [...teethNumbers].reverse() : teethNumbers;
  
  return (
    <>
      {sites.map(site => (
        <Grid 
          container 
          key={`probing-${site}`}
          spacing={0.5}
          justifyContent="center"
        >
          {orderedTeeth.map(toothNumber => (
            <Grid item key={`probing-${toothNumber}-${site}`}>
              {periosData[toothNumber] && (
                <Box 
                  component="div" 
                  sx={{ 
                    width: 36, 
                    height: 36, 
                    border: '1px solid #ccc',
                    bgcolor: (() => {
                      const value = periosData[toothNumber]?.probing[site];
                      const perioColors = getPerioChartColors(themeSettings.mode, themeSettings.colorProfile);
                      if (value === null || value === undefined) return 'background.paper';
                      if (value >= 6) return perioColors.severe;
                      if (value >= 4) return perioColors.mild;
                      return perioColors.normal;
                    })(),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}
                  onClick={() => toggleBleeding(toothNumber, site)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    toggleSuppuration(toothNumber, site);
                  }}
                >
                  <TextField
                    size="small"
                    inputProps={{ 
                      min: 0, 
                      max: 12,
                      style: { 
                        textAlign: 'center', 
                        padding: '2px', 
                        width: '100%', 
                        height: '100%',
                        backgroundColor: 'transparent'
                      } 
                    }}
                    variant="standard"
                    value={periosData[toothNumber]?.probing[site] === null ? '' : periosData[toothNumber]?.probing[site]}
                    onChange={(e) => {
                      const val = e.target.value === '' ? null : Number(e.target.value);
                      handleProbingChange(toothNumber, site, val);
                    }}
                    sx={{ width: '100%' }}
                    disabled={periosData[toothNumber]?.missing}
                  />
                  {periosData[toothNumber]?.bleeding[site] && (
                    <Box 
                      sx={{ 
                        position: 'absolute', 
                        width: 6, 
                        height: 6, 
                        bgcolor: getPerioChartColors(themeSettings.mode, themeSettings.colorProfile).bleeding, 
                        borderRadius: '50%',
                        top: 2, 
                        right: 2 
                      }} 
                    />
                  )}
                  {periosData[toothNumber]?.suppuration[site] && (
                    <Box 
                      sx={{ 
                        position: 'absolute', 
                        width: 6, 
                        height: 6, 
                        bgcolor: getPerioChartColors(themeSettings.mode, themeSettings.colorProfile).suppuration, 
                        borderRadius: '50%',
                        bottom: 2, 
                        right: 2 
                      }} 
                    />
                  )}
                </Box>
              )}
            </Grid>
          ))}
        </Grid>
      ))}
    </>
  );
};

export { PerioTooth, PerioToothRow, PerioProbingSites }; 