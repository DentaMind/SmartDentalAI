import React from 'react';
import { Box, SvgIcon } from '@mui/material';

// Define the common dental conditions and their visual representations
export type DentalConditionType = 
  | 'missing' 
  | 'implant' 
  | 'crown' 
  | 'rootCanal' 
  | 'caries' 
  | 'filling' 
  | 'bridge' 
  | 'veneer'
  | 'extraction'
  | 'porcelain'
  | 'denture'
  | 'sealant'
  | 'postAndCore'
  | 'diastema';

export interface ToothCondition {
  type: DentalConditionType;
  surfaces?: string[]; // M, O, D, B, L for mesial, occlusal, distal, buccal, lingual
  notes?: string;
  date?: string;
  material?: string; // amalgam, composite, etc.
}

interface ConditionIconProps {
  condition: DentalConditionType;
  size?: number;
  color?: string;
}

// Create SVG icons for each condition
export const ConditionIcon: React.FC<ConditionIconProps> = ({ 
  condition, 
  size = 24,
  color
}) => {
  const getIconByCondition = () => {
    switch (condition) {
      case 'implant':
        return (
          <path 
            d="M15,2 L15,10 M15,14 L15,36 M10,10 L20,10 M10,14 L20,14 M12,36 L18,36" 
            stroke={color || "#2196f3"} 
            strokeWidth="2" 
            fill="none" 
          />
        );
      case 'crown':
        return (
          <path 
            d="M8,12 C8,8 15,4 15,4 C15,4 22,8 22,12 L22,22 C22,22 15,25 15,25 C15,25 8,22 8,22 L8,12 Z" 
            stroke={color || "#9c27b0"} 
            strokeWidth="2" 
            fill="none" 
          />
        );
      case 'rootCanal':
        return (
          <path 
            d="M15,4 L15,36 M10,12 L20,12 M10,20 L20,20 M10,28 L20,28" 
            stroke={color || "#f44336"} 
            strokeWidth="2" 
            fill="none" 
          />
        );
      case 'caries':
        return (
          <path 
            d="M12,12 C15,15 15,18 18,18 C21,18 21,15 24,12 C21,9 21,6 18,6 C15,6 15,9 12,12 Z" 
            stroke={color || "#ff9800"} 
            strokeWidth="2" 
            fill={color || "#ff9800"} 
            fillOpacity="0.3" 
          />
        );
      case 'filling':
        return (
          <path 
            d="M10,10 L20,10 L20,20 L10,20 Z" 
            stroke={color || "#607d8b"} 
            strokeWidth="2" 
            fill={color || "#607d8b"}
            fillOpacity="0.5" 
          />
        );
      case 'bridge':
        return (
          <path 
            d="M5,15 L25,15 M10,10 L10,20 M20,10 L20,20" 
            stroke={color || "#9e9e9e"} 
            strokeWidth="2" 
            fill="none" 
          />
        );
      case 'veneer':
        return (
          <path 
            d="M10,5 C10,5 15,2 20,5 C25,8 25,15 20,25 C15,35 10,25 10,15 C10,10 10,5 10,5 Z" 
            stroke={color || "#4caf50"} 
            strokeWidth="2" 
            fill="none" 
          />
        );
      case 'extraction':
        return (
          <path 
            d="M8,8 L22,22 M22,8 L8,22" 
            stroke={color || "#f44336"} 
            strokeWidth="2" 
            fill="none" 
          />
        );
      case 'porcelain':
        return (
          <path 
            d="M8,12 A7,10 0 0 1 22,12 A7,10 0 0 1 8,12 Z" 
            stroke={color || "#e91e63"} 
            strokeWidth="2" 
            fill="none" 
          />
        );
      case 'denture':
        return (
          <path 
            d="M5,12 L25,12 M10,8 L10,16 M20,8 L20,16 M15,8 L15,16" 
            stroke={color || "#ff5722"} 
            strokeWidth="2" 
            fill="none" 
          />
        );
      case 'postAndCore':
        return (
          <path 
            d="M15,4 L15,36 M10,12 L20,12 M12,20 A3,3 0 0 0 18,20 A3,3 0 0 0 12,20" 
            stroke={color || "#3f51b5"} 
            strokeWidth="2" 
            fill="none" 
          />
        );
      case 'missing':
      default:
        return (
          <path 
            d="M8,8 L22,22 M22,8 L8,22" 
            stroke={color || "#f44336"} 
            strokeWidth="2" 
            fill="none" 
          />
        );
    }
  };

  return (
    <Box
      component="svg"
      width={size}
      height={size}
      viewBox="0 0 30 40"
      sx={{
        overflow: 'visible',
      }}
    >
      {getIconByCondition()}
    </Box>
  );
};

export const getDentalConditionColor = (condition: DentalConditionType, theme: 'light' | 'dark' = 'light'): string => {
  const colors = {
    light: {
      missing: '#f44336',     // Red
      implant: '#2196f3',     // Blue
      crown: '#9c27b0',       // Purple
      rootCanal: '#f44336',   // Red
      caries: '#ff9800',      // Orange
      filling: '#607d8b',     // Blue grey
      bridge: '#9e9e9e',      // Grey
      veneer: '#4caf50',      // Green
      extraction: '#f44336',  // Red
      porcelain: '#e91e63',   // Pink
      denture: '#ff5722',     // Deep orange
      sealant: '#00bcd4',     // Cyan
      postAndCore: '#3f51b5', // Indigo
      diastema: '#ffeb3b'     // Yellow
    },
    dark: {
      missing: '#ef9a9a',     // Lighter red
      implant: '#90caf9',     // Lighter blue
      crown: '#ce93d8',       // Lighter purple
      rootCanal: '#ef9a9a',   // Lighter red
      caries: '#ffcc80',      // Lighter orange
      filling: '#b0bec5',     // Lighter blue grey
      bridge: '#e0e0e0',      // Lighter grey
      veneer: '#a5d6a7',      // Lighter green
      extraction: '#ef9a9a',  // Lighter red
      porcelain: '#f48fb1',   // Lighter pink
      denture: '#ffab91',     // Lighter deep orange
      sealant: '#80deea',     // Lighter cyan
      postAndCore: '#9fa8da', // Lighter indigo
      diastema: '#fff59d'     // Lighter yellow
    }
  };

  return colors[theme][condition] || '#9e9e9e';
};

// Component to render surface markings for teeth
export const SurfaceMarker: React.FC<{
  surface: string;
  condition: DentalConditionType;
  theme?: 'light' | 'dark';
}> = ({ surface, condition, theme = 'light' }) => {
  const color = getDentalConditionColor(condition, theme);
  
  // Position the marker based on the surface
  const getPosition = () => {
    switch (surface.toUpperCase()) {
      case 'M': // Mesial
        return { top: '50%', left: '0', width: '20%', height: '50%' };
      case 'O': // Occlusal
        return { top: '0', left: '20%', width: '60%', height: '50%' };
      case 'D': // Distal
        return { top: '50%', right: '0', width: '20%', height: '50%' };
      case 'B': // Buccal/Facial
        return { top: '50%', left: '20%', width: '60%', height: '25%' };
      case 'L': // Lingual
        return { bottom: '0', left: '20%', width: '60%', height: '25%' };
      default:
        return { display: 'none' };
    }
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        bgcolor: color,
        opacity: 0.7,
        border: `1px solid ${color}`,
        ...getPosition()
      }}
    />
  );
};

// Legend item component for the dental chart
export const DentalLegendItem: React.FC<{
  condition: DentalConditionType;
  label: string;
  theme?: 'light' | 'dark';
}> = ({ condition, label, theme = 'light' }) => {
  const color = getDentalConditionColor(condition, theme);
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
      <ConditionIcon condition={condition} color={color} size={16} />
      <Box sx={{ fontSize: '0.875rem' }}>{label}</Box>
    </Box>
  );
};

// Export a full dental chart legend component
export const DentalChartLegend: React.FC<{
  theme?: 'light' | 'dark';
}> = ({ theme = 'light' }) => {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 1 }}>
      <DentalLegendItem condition="missing" label="Missing Tooth" theme={theme} />
      <DentalLegendItem condition="implant" label="Implant" theme={theme} />
      <DentalLegendItem condition="crown" label="Crown" theme={theme} />
      <DentalLegendItem condition="rootCanal" label="Root Canal" theme={theme} />
      <DentalLegendItem condition="caries" label="Caries" theme={theme} />
      <DentalLegendItem condition="filling" label="Filling" theme={theme} />
      <DentalLegendItem condition="bridge" label="Bridge" theme={theme} />
      <DentalLegendItem condition="veneer" label="Veneer" theme={theme} />
      <DentalLegendItem condition="porcelain" label="Porcelain" theme={theme} />
      <DentalLegendItem condition="denture" label="Denture" theme={theme} />
      <DentalLegendItem condition="postAndCore" label="Post & Core" theme={theme} />
    </Box>
  );
};

export default {
  ConditionIcon,
  getDentalConditionColor,
  SurfaceMarker,
  DentalLegendItem,
  DentalChartLegend
}; 