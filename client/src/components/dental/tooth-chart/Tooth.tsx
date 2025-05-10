import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import {
  ToothData,
  ProbingSite,
  ToothSurface,
  ChartMode,
  ToothClickEvent
} from '../../../types/dental';

// Site positions for rendering
const SITE_POSITIONS: Record<ProbingSite, { top?: string; bottom?: string; left?: string; right?: string }> = {
  'MB': { top: '0', left: '0' },
  'B': { top: '0', left: '50%' },
  'DB': { top: '0', right: '0' },
  'ML': { bottom: '0', left: '0' },
  'L': { bottom: '0', left: '50%' },
  'DL': { bottom: '0', right: '0' }
};

// Surface positions for rendering
const SURFACE_POSITIONS: Record<ToothSurface, { top?: string; bottom?: string; left?: string; right?: string; center?: boolean }> = {
  'M': { left: '0', top: '50%' },
  'O': { top: '50%', left: '50%', center: true },
  'D': { right: '0', top: '50%' },
  'F': { top: '0', left: '50%' }, // Facial/Buccal
  'L': { bottom: '0', left: '50%' }, // Lingual
  'I': { top: '50%', left: '50%', center: true }, // Incisal
  'B': { top: '0', left: '50%' }  // Buccal (same as F)
};

interface ToothProps {
  data: ToothData;
  mode: ChartMode;
  onToothClick?: (event: ToothClickEvent) => void;
  showNumbers?: boolean;
  active?: boolean;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Tooth component represents a single tooth in the dental chart
 * It can display probing measurements, recession, mobility, and restorations
 * depending on the chart mode
 */
const Tooth: React.FC<ToothProps> = ({
  data,
  mode,
  onToothClick,
  showNumbers = true,
  active = false,
  size = 'medium'
}) => {
  const sizeMap = {
    small: { width: 60, height: 60, fontSize: 10 },
    medium: { width: 80, height: 80, fontSize: 12 },
    large: { width: 100, height: 100, fontSize: 14 }
  };
  
  const { width, height, fontSize } = sizeMap[size];
  
  // Handle tooth click events
  const handleToothClick = () => {
    if (onToothClick) {
      onToothClick({ toothNumber: data.number });
    }
  };
  
  // Handle site click events
  const handleSiteClick = (site: ProbingSite) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToothClick) {
      onToothClick({ toothNumber: data.number, site, action: 'probing' });
    }
  };
  
  // Handle surface click events
  const handleSurfaceClick = (surface: ToothSurface) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToothClick) {
      onToothClick({ toothNumber: data.number, site: surface, action: 'restoration' });
    }
  };
  
  // Helper to get background color based on probing depth
  const getProbingColor = (depth: number | null): string => {
    if (depth === null) return 'transparent';
    if (depth >= 6) return 'rgba(244, 67, 54, 0.7)'; // Red for 6+
    if (depth >= 4) return 'rgba(255, 152, 0, 0.7)'; // Orange for 4-5
    return 'rgba(76, 175, 80, 0.2)'; // Light green for 1-3
  };
  
  // Helper to get background color for bleeding sites
  const getBleedingIndicator = (bleeding: boolean): string => {
    return bleeding ? 'rgba(244, 67, 54, 0.9)' : 'transparent';
  };
  
  // Helper to get background color based on restoration material
  const getRestorationColor = (material: string): string => {
    switch (material) {
      case 'Amalgam': return '#a9a9a9';
      case 'Composite': return '#f5f5dc';
      case 'Gold': return '#ffd700';
      case 'PFM': return '#d3d3d3';
      case 'Ceramic': return '#ffffff';
      case 'Implant': return '#b0c4de';
      default: return '#e0e0e0';
    }
  };
  
  // Get the rendering style based on tooth status
  const getToothBaseStyle = (): React.CSSProperties => {
    switch (data.status) {
      case 'Missing':
        return { opacity: 0.3, background: '#f5f5f5' };
      case 'Implant':
        return { border: '2px solid #b0c4de' };
      case 'Extracted':
        return { background: '#f5f5f5', textDecoration: 'line-through' };
      default:
        return {};
    }
  };
  
  // Render perio mode (probing, recession, etc)
  const renderPerioMode = () => {
    return (
      <>
        {/* Probing sites */}
        {Object.entries(data.probing).map(([site, siteData]) => {
          const siteKey = site as ProbingSite;
          const position = SITE_POSITIONS[siteKey];
          
          return (
            <Tooltip
              key={`probing-${data.number}-${site}`}
              title={
                <Box>
                  <Typography variant="caption">
                    Probing: {siteData.depth ?? '-'} mm
                  </Typography>
                  <br />
                  <Typography variant="caption">
                    Recession: {siteData.recession ?? '-'} mm
                  </Typography>
                  <br />
                  <Typography variant="caption">
                    CAL: {siteData.cal ?? '-'} mm
                  </Typography>
                  {siteData.bleeding && (
                    <>
                      <br />
                      <Typography variant="caption" color="error">
                        Bleeding on Probing
                      </Typography>
                    </>
                  )}
                  {siteData.suppuration && (
                    <>
                      <br />
                      <Typography variant="caption" color="warning.main">
                        Suppuration
                      </Typography>
                    </>
                  )}
                </Box>
              }
            >
              <Box
                onClick={handleSiteClick(siteKey)}
                sx={{
                  position: 'absolute',
                  width: '30%',
                  height: '30%',
                  ...position,
                  transform: position.left === '50%' ? 'translateX(-50%)' : 
                             position.top === '50%' ? 'translateY(-50%)' : undefined,
                  backgroundColor: getProbingColor(siteData.depth),
                  border: '1px solid #ccc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: `${fontSize - 2}px`,
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.5)'
                  },
                  zIndex: 1
                }}
              >
                {siteData.depth}
                {/* Bleeding indicator */}
                {siteData.bleeding && (
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      top: 0, 
                      right: 0, 
                      width: '25%', 
                      height: '25%', 
                      borderRadius: '50%', 
                      bgcolor: 'error.main' 
                    }} 
                  />
                )}
                {/* Suppuration indicator */}
                {siteData.suppuration && (
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      bottom: 0, 
                      right: 0, 
                      width: '25%', 
                      height: '25%', 
                      borderRadius: '50%', 
                      bgcolor: 'warning.main' 
                    }} 
                  />
                )}
              </Box>
            </Tooltip>
          );
        })}
        
        {/* Mobility indicator */}
        {data.mobility && data.mobility.degree > 0 && (
          <Tooltip
            title={`Mobility: Grade ${data.mobility.degree}`}
          >
            <Box
              sx={{
                position: 'absolute',
                bottom: '-16px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: `${fontSize - 2}px`,
                fontWeight: 'bold',
                color: data.mobility.degree >= 2 ? 'error.main' : 'warning.main'
              }}
            >
              M{data.mobility.degree}
            </Box>
          </Tooltip>
        )}
        
        {/* Furcation indicators */}
        {data.furcations && data.furcations.length > 0 && data.furcations.map((furcation, index) => (
          <Tooltip
            key={`furcation-${data.number}-${index}`}
            title={`Furcation: Grade ${furcation.grade} (${furcation.site})`}
          >
            <Box
              sx={{
                position: 'absolute',
                ...(furcation.site === 'Mesial' ? { left: '-12px', top: '50%', transform: 'translateY(-50%)' } :
                   furcation.site === 'Distal' ? { right: '-12px', top: '50%', transform: 'translateY(-50%)' } :
                   furcation.site === 'Buccal' ? { top: '-12px', left: '50%', transform: 'translateX(-50%)' } :
                                                { bottom: '-12px', left: '50%', transform: 'translateX(-50%)' }),
                fontSize: `${fontSize - 2}px`,
                fontWeight: 'bold',
                color: furcation.grade >= 2 ? 'error.main' : 'warning.main'
              }}
            >
              F{furcation.grade}
            </Box>
          </Tooltip>
        ))}
      </>
    );
  };
  
  // Render restorative mode (surfaces, materials, etc)
  const renderRestorativeMode = () => {
    // If no restorations, return empty
    if (!data.restorations || data.restorations.length === 0) {
      // Render empty surface indicators for clicking
      return (
        <>
          {Object.entries(SURFACE_POSITIONS).map(([surface, position]) => {
            const surfaceKey = surface as ToothSurface;
            
            return (
              <Box
                key={`surface-${data.number}-${surface}`}
                onClick={handleSurfaceClick(surfaceKey)}
                sx={{
                  position: 'absolute',
                  width: position.center ? '40%' : '30%',
                  height: position.center ? '40%' : '30%',
                  ...position,
                  transform: position.left === '50%' ? 'translateX(-50%)' : 
                             position.top === '50%' ? 'translateY(-50%)' : 
                             position.center ? 'translate(-50%, -50%)' : undefined,
                  border: '1px dashed #ccc',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.1)'
                  }
                }}
              />
            );
          })}
        </>
      );
    }
    
    // Group restorations by surface for easier rendering
    const surfacesWithRestorations: Record<ToothSurface, string> = {} as Record<ToothSurface, string>;
    
    data.restorations.forEach(restoration => {
      restoration.surfaces.forEach(surface => {
        surfacesWithRestorations[surface] = restoration.material;
      });
    });
    
    return (
      <>
        {Object.entries(SURFACE_POSITIONS).map(([surface, position]) => {
          const surfaceKey = surface as ToothSurface;
          const material = surfacesWithRestorations[surfaceKey];
          
          return (
            <Tooltip
              key={`restoration-${data.number}-${surface}`}
              title={material ? `${surfaceKey}: ${material}` : `Surface ${surfaceKey}`}
            >
              <Box
                onClick={handleSurfaceClick(surfaceKey)}
                sx={{
                  position: 'absolute',
                  width: position.center ? '40%' : '30%',
                  height: position.center ? '40%' : '30%',
                  ...position,
                  transform: position.left === '50%' ? 'translateX(-50%)' : 
                             position.top === '50%' ? 'translateY(-50%)' : 
                             position.center ? 'translate(-50%, -50%)' : undefined,
                  border: '1px solid #ccc',
                  backgroundColor: material ? getRestorationColor(material) : 'transparent',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.5)'
                  }
                }}
              >
                {material && (
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: `${fontSize - 4}px`,
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%'
                    }}
                  >
                    {material.substring(0, 1)}
                  </Typography>
                )}
              </Box>
            </Tooltip>
          );
        })}
        
        {/* Root canal indicator */}
        {data.restorations.some(r => r.material === 'Root Canal') && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '15%',
              height: '50%',
              backgroundColor: '#ff5252',
              borderRadius: '2px'
            }}
          />
        )}
      </>
    );
  };
  
  // Render comprehensive mode (all data)
  const renderComprehensiveMode = () => {
    return (
      <>
        {renderPerioMode()}
        {/* Add specialized rendering for comprehensive view */}
        {/* This would combine elements from both perio and restorative */}
      </>
    );
  };
  
  return (
    <Box 
      sx={{
        position: 'relative',
        width,
        height,
        border: active ? '2px solid #1976d2' : '1px solid #ccc',
        borderRadius: '4px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.paper',
        transition: 'all 0.2s',
        cursor: 'pointer',
        '&:hover': {
          boxShadow: '0 0 5px rgba(25, 118, 210, 0.3)'
        },
        ...getToothBaseStyle()
      }}
      onClick={handleToothClick}
    >
      {/* Tooth number */}
      {showNumbers && (
        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            top: '-20px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize,
            fontWeight: 'bold'
          }}
        >
          {data.number}
        </Typography>
      )}
      
      {/* Render based on mode */}
      {mode === 'perio' && renderPerioMode()}
      {mode === 'restorative' && renderRestorativeMode()}
      {mode === 'comprehensive' && renderComprehensiveMode()}
    </Box>
  );
};

export default Tooth; 