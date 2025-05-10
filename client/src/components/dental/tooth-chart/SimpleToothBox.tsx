import React from 'react';
import { Box, Typography } from '@mui/material';
import { ProbingSite, ToothSurface } from '../../../types/dental';

interface SimpleToothBoxProps {
  toothNumber: number;
  width?: number;
  height?: number;
  selected?: boolean;
  highlightedSite?: ProbingSite | ToothSurface;
  onClick?: () => void;
  onSiteClick?: (site: ProbingSite | ToothSurface) => void;
}

/**
 * SimpleToothBox renders a tooth as a simple box with clickable regions
 * for different sites instead of using anatomical SVG shapes
 */
const SimpleToothBox: React.FC<SimpleToothBoxProps> = ({
  toothNumber,
  width = 80,
  height = 100,
  selected = false,
  highlightedSite,
  onClick,
  onSiteClick
}) => {
  const isUpperTooth = toothNumber <= 16;
  
  // Handle tooth click
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };
  
  // Handle site click
  const handleSiteClick = (site: ProbingSite | ToothSurface) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSiteClick) {
      onSiteClick(site);
    }
  };
  
  return (
    <Box 
      sx={{
        width: width,
        height: height,
        position: 'relative',
        cursor: 'pointer'
      }}
      onClick={handleClick}
    >
      {/* Tooth number */}
      <Typography
        variant="caption"
        sx={{
          position: 'absolute',
          top: isUpperTooth ? 0 : 'auto',
          bottom: isUpperTooth ? 'auto' : 0,
          left: '50%',
          transform: 'translateX(-50%)',
          fontWeight: 'bold'
        }}
      >
        {toothNumber}
      </Typography>
      
      {/* Main tooth box */}
      <Box
        sx={{
          width: '60%',
          height: '70%',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          border: selected ? '2px solid #1976d2' : '1px solid #777',
          borderRadius: '2px',
          backgroundColor: '#f8f8f8'
        }}
      />
      
      {/* Probing sites as simple boxes */}
      {/* MB - Mesio-Buccal */}
      <Box
        sx={{
          position: 'absolute',
          top: isUpperTooth ? '20%' : '20%',
          left: '20%',
          width: '20%',
          height: '20%',
          border: '1px solid transparent',
          borderRadius: '2px',
          backgroundColor: highlightedSite === 'MB' ? 'rgba(25, 118, 210, 0.2)' : 'transparent',
          '&:hover': {
            backgroundColor: 'rgba(25, 118, 210, 0.1)'
          }
        }}
        onClick={handleSiteClick('MB')}
      />
      
      {/* B - Buccal */}
      <Box
        sx={{
          position: 'absolute',
          top: isUpperTooth ? '20%' : '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '20%',
          height: '20%',
          border: '1px solid transparent',
          borderRadius: '2px',
          backgroundColor: highlightedSite === 'B' ? 'rgba(25, 118, 210, 0.2)' : 'transparent',
          '&:hover': {
            backgroundColor: 'rgba(25, 118, 210, 0.1)'
          }
        }}
        onClick={handleSiteClick('B')}
      />
      
      {/* DB - Disto-Buccal */}
      <Box
        sx={{
          position: 'absolute',
          top: isUpperTooth ? '20%' : '20%',
          right: '20%',
          width: '20%',
          height: '20%',
          border: '1px solid transparent',
          borderRadius: '2px',
          backgroundColor: highlightedSite === 'DB' ? 'rgba(25, 118, 210, 0.2)' : 'transparent',
          '&:hover': {
            backgroundColor: 'rgba(25, 118, 210, 0.1)'
          }
        }}
        onClick={handleSiteClick('DB')}
      />
      
      {/* ML - Mesio-Lingual */}
      <Box
        sx={{
          position: 'absolute',
          bottom: isUpperTooth ? '20%' : '20%',
          left: '20%',
          width: '20%',
          height: '20%',
          border: '1px solid transparent',
          borderRadius: '2px',
          backgroundColor: highlightedSite === 'ML' ? 'rgba(25, 118, 210, 0.2)' : 'transparent',
          '&:hover': {
            backgroundColor: 'rgba(25, 118, 210, 0.1)'
          }
        }}
        onClick={handleSiteClick('ML')}
      />
      
      {/* L - Lingual */}
      <Box
        sx={{
          position: 'absolute',
          bottom: isUpperTooth ? '20%' : '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '20%',
          height: '20%',
          border: '1px solid transparent',
          borderRadius: '2px',
          backgroundColor: highlightedSite === 'L' ? 'rgba(25, 118, 210, 0.2)' : 'transparent',
          '&:hover': {
            backgroundColor: 'rgba(25, 118, 210, 0.1)'
          }
        }}
        onClick={handleSiteClick('L')}
      />
      
      {/* DL - Disto-Lingual */}
      <Box
        sx={{
          position: 'absolute',
          bottom: isUpperTooth ? '20%' : '20%',
          right: '20%',
          width: '20%',
          height: '20%',
          border: '1px solid transparent',
          borderRadius: '2px',
          backgroundColor: highlightedSite === 'DL' ? 'rgba(25, 118, 210, 0.2)' : 'transparent',
          '&:hover': {
            backgroundColor: 'rgba(25, 118, 210, 0.1)'
          }
        }}
        onClick={handleSiteClick('DL')}
      />
      
      {/* Restorative surfaces */}
      {/* M - Mesial */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '20%',
          transform: 'translateY(-50%)',
          width: '10%',
          height: '30%',
          border: '1px solid transparent',
          borderRadius: '2px',
          backgroundColor: highlightedSite === 'M' ? 'rgba(25, 118, 210, 0.2)' : 'transparent',
          '&:hover': {
            backgroundColor: 'rgba(25, 118, 210, 0.1)'
          }
        }}
        onClick={handleSiteClick('M')}
      />
      
      {/* O/I - Occlusal/Incisal */}
      <Box
        sx={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '30%',
          height: '10%',
          border: '1px solid transparent',
          borderRadius: '2px',
          backgroundColor: (highlightedSite === 'O' || highlightedSite === 'I') ? 'rgba(25, 118, 210, 0.2)' : 'transparent',
          '&:hover': {
            backgroundColor: 'rgba(25, 118, 210, 0.1)'
          }
        }}
        onClick={handleSiteClick(toothNumber <= 11 || (toothNumber >= 22 && toothNumber <= 27) ? 'I' : 'O')}
      />
      
      {/* D - Distal */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          right: '20%',
          transform: 'translateY(-50%)',
          width: '10%',
          height: '30%',
          border: '1px solid transparent',
          borderRadius: '2px',
          backgroundColor: highlightedSite === 'D' ? 'rgba(25, 118, 210, 0.2)' : 'transparent',
          '&:hover': {
            backgroundColor: 'rgba(25, 118, 210, 0.1)'
          }
        }}
        onClick={handleSiteClick('D')}
      />
      
      {/* F/B - Facial/Buccal */}
      <Box
        sx={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '30%',
          height: '10%',
          border: '1px solid transparent',
          borderRadius: '2px',
          backgroundColor: (highlightedSite === 'F' || highlightedSite === 'B') ? 'rgba(25, 118, 210, 0.2)' : 'transparent',
          '&:hover': {
            backgroundColor: 'rgba(25, 118, 210, 0.1)'
          }
        }}
        onClick={handleSiteClick('F')}
      />
      
      {/* L - Lingual (as surface) */}
      <Box
        sx={{
          position: 'absolute',
          bottom: '30%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '30%',
          height: '10%',
          border: '1px solid transparent',
          borderRadius: '2px',
          backgroundColor: (highlightedSite === 'L') ? 'rgba(25, 118, 210, 0.2)' : 'transparent',
          '&:hover': {
            backgroundColor: 'rgba(25, 118, 210, 0.1)'
          }
        }}
        onClick={handleSiteClick('L')}
      />
    </Box>
  );
};

export default SimpleToothBox; 