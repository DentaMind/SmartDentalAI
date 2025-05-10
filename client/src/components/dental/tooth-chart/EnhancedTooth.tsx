import React, { useState } from 'react';
import { Box, Tooltip, Popover, Typography, Paper, Divider } from '@mui/material';
import ToothSVG from './ToothSVG';
import { 
  ToothData, 
  ProbingSite, 
  ToothSurface,
  ChartMode, 
  ToothClickEvent,
  ProbingData,
  RestorationData,
  FurcationData,
  MobilityData,
  ToothStatus
} from '../../../types/dental';

interface EnhancedToothProps {
  data: ToothData;
  mode: ChartMode;
  active?: boolean;
  onToothClick?: (event: ToothClickEvent) => void;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Color mapping for different values
 */
const getProbingDepthColor = (depth: number | null): string => {
  if (depth === null) return 'transparent';
  if (depth >= 6) return 'rgba(244, 67, 54, 0.7)'; // Red for 6+
  if (depth >= 4) return 'rgba(255, 152, 0, 0.7)'; // Orange for 4-5
  return 'rgba(76, 175, 80, 0.2)'; // Light green for 1-3
};

const getRestorationColor = (material: string): string => {
  switch (material) {
    case 'Amalgam': return '#a9a9a9';
    case 'Composite': return '#f5f5dc';
    case 'Gold': return '#ffd700';
    case 'PFM': return '#d3d3d3';
    case 'Ceramic': return '#ffffff';
    case 'Implant': return '#b0c4de';
    case 'Root Canal': return '#ff5252';
    default: return '#e0e0e0';
  }
};

/**
 * EnhancedTooth is a wrapper around ToothSVG that adds interactive
 * data overlays based on the chart mode (perio vs restorative)
 */
const EnhancedTooth: React.FC<EnhancedToothProps> = ({
  data,
  mode,
  active = false,
  onToothClick,
  size = 'medium'
}) => {
  const [highlightedSite, setHighlightedSite] = useState<ProbingSite | ToothSurface | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [popoverContent, setPopoverContent] = useState<React.ReactNode | null>(null);
  
  // Size mapping
  const sizeMap = {
    small: { width: 60, height: 80, fontSize: 10, overlaySize: 16 },
    medium: { width: 80, height: 100, fontSize: 12, overlaySize: 20 },
    large: { width: 100, height: 120, fontSize: 14, overlaySize: 24 }
  };
  
  const { width, height, fontSize, overlaySize } = sizeMap[size];
  
  // Handle tooth click
  const handleToothClick = () => {
    if (onToothClick) {
      onToothClick({ toothNumber: data.number });
    }
  };
  
  // Handle site click
  const handleSiteClick = (site: ProbingSite | ToothSurface) => {
    setHighlightedSite(site);
    
    if (onToothClick) {
      onToothClick({ 
        toothNumber: data.number, 
        site,
        action: mode === 'perio' ? 'probing' : 'restoration'
      });
    }
  };
  
  // Handle showing popover with site details
  const handleSiteHover = (
    site: ProbingSite | ToothSurface, 
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    // Get the element that was hovered
    const target = event.currentTarget;
    
    // Create content based on the site and mode
    let content: React.ReactNode = null;
    
    if (mode === 'perio' && Object.keys(data.probing).includes(site as string)) {
      const siteData = data.probing[site as ProbingSite];
      content = (
        <Box sx={{ p: 1, minWidth: 120 }}>
          <Typography variant="subtitle2" fontWeight="bold">
            Tooth #{data.number} - {site}
          </Typography>
          <Divider sx={{ my: 1 }} />
          <Typography variant="body2">Probing Depth: {siteData.depth ?? 'Not recorded'} mm</Typography>
          <Typography variant="body2">Recession: {siteData.recession ?? 'Not recorded'} mm</Typography>
          <Typography variant="body2">CAL: {siteData.cal ?? 'Not recorded'} mm</Typography>
          {siteData.bleeding && (
            <Typography variant="body2" color="error.main">Bleeding on Probing</Typography>
          )}
          {siteData.suppuration && (
            <Typography variant="body2" color="warning.main">Suppuration</Typography>
          )}
        </Box>
      );
    } else if (mode === 'restorative' || mode === 'comprehensive') {
      // Check if there's a restoration at this surface
      const restoration = data.restorations?.find(r => 
        r.surfaces.includes(site as ToothSurface)
      );
      
      if (restoration) {
        content = (
          <Box sx={{ p: 1, minWidth: 120 }}>
            <Typography variant="subtitle2" fontWeight="bold">
              Tooth #{data.number} - {site}
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body2">Material: {restoration.material}</Typography>
            {restoration.date && (
              <Typography variant="body2">Date: {restoration.date}</Typography>
            )}
            {restoration.notes && (
              <Typography variant="body2">Notes: {restoration.notes}</Typography>
            )}
          </Box>
        );
      } else {
        content = (
          <Box sx={{ p: 1, minWidth: 120 }}>
            <Typography variant="subtitle2" fontWeight="bold">
              Tooth #{data.number} - {site}
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body2">No restoration recorded</Typography>
          </Box>
        );
      }
    }
    
    if (content) {
      setAnchorEl(target);
      setPopoverContent(content);
    }
  };
  
  // Handle closing the popover
  const handlePopoverClose = () => {
    setAnchorEl(null);
    setPopoverContent(null);
  };
  
  // Render overlays for perio mode
  const renderPerioOverlays = () => {
    const sites: ProbingSite[] = ['MB', 'B', 'DB', 'DL', 'L', 'ML'];
    // Position mapping for overlays
    const positions: Record<ProbingSite, { top: string, left: string }> = {
      'MB': { top: '20%', left: '20%' },
      'B': { top: '20%', left: '50%' },
      'DB': { top: '20%', left: '80%' },
      'DL': { top: '80%', left: '80%' },
      'L': { top: '80%', left: '50%' },
      'ML': { top: '80%', left: '20%' }
    };
    
    return (
      <>
        {sites.map(site => {
          const siteData = data.probing[site];
          if (!siteData || siteData.depth === null) return null;
          
          return (
            <Box
              key={`overlay-${data.number}-${site}`}
              sx={{
                position: 'absolute',
                top: positions[site].top,
                left: positions[site].left,
                transform: 'translate(-50%, -50%)',
                width: `${overlaySize}px`,
                height: `${overlaySize}px`,
                borderRadius: '50%',
                bgcolor: getProbingDepthColor(siteData.depth),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: `${fontSize - 2}px`,
                fontWeight: 'bold',
                border: '1px solid rgba(0,0,0,0.2)',
                cursor: 'pointer',
                zIndex: 10
              }}
              onClick={() => handleSiteClick(site)}
              onMouseEnter={(e) => handleSiteHover(site, e)}
              onMouseLeave={handlePopoverClose}
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
          );
        })}
        
        {/* Mobility indicator */}
        {data.mobility && data.mobility.degree > 0 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: '-16px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: `${fontSize - 2}px`,
              fontWeight: 'bold',
              padding: '2px 4px',
              borderRadius: '4px',
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: data.mobility.degree >= 2 ? 'error.main' : 'warning.main',
              color: data.mobility.degree >= 2 ? 'error.main' : 'warning.main',
              zIndex: 5
            }}
            onMouseEnter={(e) => {
              setAnchorEl(e.currentTarget);
              setPopoverContent(
                <Box sx={{ p: 1 }}>
                  <Typography variant="subtitle2">Mobility Grade {data.mobility?.degree}</Typography>
                </Box>
              );
            }}
            onMouseLeave={handlePopoverClose}
          >
            M{data.mobility.degree}
          </Box>
        )}
        
        {/* Furcation indicators */}
        {data.furcations && data.furcations.length > 0 && data.furcations.map((furcation, index) => {
          // Position mapping for furcation indicators
          const furcationPositions: Record<string, { top?: string, bottom?: string, left?: string, right?: string }> = {
            'Mesial': { left: '-12px', top: '50%' },
            'Distal': { right: '-12px', top: '50%' },
            'Buccal': { top: '-12px', left: '50%' },
            'Lingual': { bottom: '-12px', left: '50%' }
          };
          
          const position = furcationPositions[furcation.site];
          
          return (
            <Box
              key={`furcation-${data.number}-${index}`}
              sx={{
                position: 'absolute',
                ...position,
                transform: 'translate(-50%, -50%)',
                fontSize: `${fontSize - 2}px`,
                fontWeight: 'bold',
                padding: '2px 4px',
                borderRadius: '4px',
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: furcation.grade >= 2 ? 'error.main' : 'warning.main',
                color: furcation.grade >= 2 ? 'error.main' : 'warning.main',
                zIndex: 5
              }}
              onMouseEnter={(e) => {
                setAnchorEl(e.currentTarget);
                setPopoverContent(
                  <Box sx={{ p: 1 }}>
                    <Typography variant="subtitle2">
                      {furcation.site} Furcation: Grade {furcation.grade}
                    </Typography>
                  </Box>
                );
              }}
              onMouseLeave={handlePopoverClose}
            >
              F{furcation.grade}
            </Box>
          );
        })}
      </>
    );
  };
  
  // Render overlays for restorative mode
  const renderRestorativeOverlays = () => {
    if (!data.restorations || data.restorations.length === 0) return null;
    
    // Group restorations by surface for easier rendering
    const surfacesWithRestorations: Record<string, string> = {};
    
    data.restorations.forEach(restoration => {
      restoration.surfaces.forEach(surface => {
        surfacesWithRestorations[surface] = restoration.material;
      });
    });
    
    // Position mapping for overlays
    const positions: Record<string, { top: string, left: string }> = {
      'M': { top: '50%', left: '20%' },
      'O': { top: '30%', left: '50%' },
      'I': { top: '30%', left: '50%' },
      'D': { top: '50%', left: '80%' },
      'F': { top: '15%', left: '50%' },
      'B': { top: '15%', left: '50%' }, // Same as F
      'L': { top: '85%', left: '50%' }
    };
    
    return (
      <>
        {Object.entries(surfacesWithRestorations).map(([surface, material]) => (
          <Box
            key={`overlay-${data.number}-${surface}`}
            sx={{
              position: 'absolute',
              top: positions[surface].top,
              left: positions[surface].left,
              transform: 'translate(-50%, -50%)',
              width: surface === 'O' || surface === 'I' ? `${overlaySize * 1.5}px` : `${overlaySize}px`,
              height: surface === 'O' || surface === 'I' ? `${overlaySize * 1.5}px` : `${overlaySize}px`,
              borderRadius: surface === 'O' || surface === 'I' ? '50%' : '4px',
              bgcolor: getRestorationColor(material),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: `${fontSize - 4}px`,
              fontWeight: 'bold',
              border: '1px solid rgba(0,0,0,0.2)',
              cursor: 'pointer',
              opacity: 0.8,
              zIndex: 10
            }}
            onClick={() => handleSiteClick(surface as ToothSurface)}
            onMouseEnter={(e) => handleSiteHover(surface as ToothSurface, e)}
            onMouseLeave={handlePopoverClose}
          >
            {surface}
          </Box>
        ))}
        
        {/* Root canal indicator */}
        {data.restorations.some(r => r.material === 'Root Canal') && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '4px',
              height: '60%',
              bgcolor: '#ff5252',
              zIndex: 5
            }}
            onMouseEnter={(e) => {
              setAnchorEl(e.currentTarget);
              setPopoverContent(
                <Box sx={{ p: 1 }}>
                  <Typography variant="subtitle2">Root Canal Treatment</Typography>
                </Box>
              );
            }}
            onMouseLeave={handlePopoverClose}
          />
        )}
      </>
    );
  };
  
  // Render comprehensive mode
  const renderComprehensiveOverlays = () => {
    return (
      <>
        {renderPerioOverlays()}
        {/* We could add specialized rendering for comprehensive view
           that combines elements from both perio and restorative */}
      </>
    );
  };
  
  return (
    <Box
      sx={{
        position: 'relative',
        width,
        height: height + 20, // Extra space for indicators
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* Base SVG tooth */}
      <ToothSVG
        toothNumber={data.number}
        width={width}
        height={height}
        selected={active}
        highlightedSite={highlightedSite || undefined}
        onClick={handleToothClick}
        onSiteClick={handleSiteClick}
      />
      
      {/* Status indicator (missing, implant, etc.) */}
      {data.status !== 'Normal' && (
        <Box 
          sx={{ 
            position: 'absolute',
            top: 0,
            right: 0,
            bgcolor: 
              data.status === 'Missing' ? 'error.main' :
              data.status === 'Implant' ? 'info.main' :
              'warning.main',
            color: 'white',
            fontSize: `${fontSize - 4}px`,
            lineHeight: 1,
            padding: '2px 4px',
            borderRadius: '0 4px 0 4px',
            zIndex: 20
          }}
          onMouseEnter={(e) => {
            setAnchorEl(e.currentTarget);
            setPopoverContent(
              <Box sx={{ p: 1 }}>
                <Typography variant="subtitle2">Status: {data.status}</Typography>
              </Box>
            );
          }}
          onMouseLeave={handlePopoverClose}
        >
          {data.status.substring(0, 1)}
        </Box>
      )}
      
      {/* Render overlays based on mode */}
      {mode === 'perio' && renderPerioOverlays()}
      {mode === 'restorative' && renderRestorativeOverlays()}
      {mode === 'comprehensive' && renderComprehensiveOverlays()}
      
      {/* Popover for details */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handlePopoverClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        sx={{ 
          pointerEvents: 'none',
          '& .MuiPopover-paper': { 
            boxShadow: 3
          }
        }}
      >
        {popoverContent}
      </Popover>
    </Box>
  );
};

export default EnhancedTooth; 