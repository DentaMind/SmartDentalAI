import React from 'react';
import { Box, BoxProps } from '@mui/material';

interface ToothSvgProps extends BoxProps {
  position: 'upper' | 'lower';
  isAnterior?: boolean;
  isMolar?: boolean;
  selected?: boolean;
  missing?: boolean;
  width?: number;
  height?: number;
}

/**
 * ToothSvg component that renders an anatomically correct tooth SVG
 * Used in periodontal charts and dental charts
 */
const ToothSvg: React.FC<ToothSvgProps> = ({
  position,
  isAnterior = false,
  isMolar = false,
  selected = false,
  missing = false,
  width = 30,
  height = 40,
  sx,
  ...rest
}) => {
  
  // Choose the appropriate SVG path based on tooth type
  const renderToothPath = () => {
    if (missing) {
      return null; // Don't render a tooth if it's missing
    }

    if (position === 'upper') {
      if (isAnterior) {
        // Upper anterior tooth (incisor/canine)
        return (
          <path 
            d="M15,2 C10,3 5,5 5,8 C5,12 7,18 7,30 C7,38 10,40 15,40 C20,40 23,38 23,30 C23,18 25,12 25,8 C25,5 20,3 15,2 Z" 
            fill={selected ? "#a5d6a7" : "white"} 
            stroke="#666"
          />
        );
      } else if (isMolar) {
        // Upper molar
        return (
          <path 
            d="M15,2 C8,2 3,5 3,10 C3,15 5,22 5,30 C5,38 9,40 15,40 C21,40 25,38 25,30 C25,22 27,15 27,10 C27,5 22,2 15,2 Z M15,15 C13,15 8,15 8,20 C8,25 13,35 15,35 C17,35 22,25 22,20 C22,15 17,15 15,15 Z" 
            fill={selected ? "#a5d6a7" : "white"} 
            stroke="#666"
          />
        );
      } else {
        // Upper premolar
        return (
          <path 
            d="M15,2 C9,2 5,5 5,10 C5,15 7,20 7,30 C7,38 10,40 15,40 C20,40 23,38 23,30 C23,20 25,15 25,10 C25,5 21,2 15,2 Z" 
            fill={selected ? "#a5d6a7" : "white"} 
            stroke="#666"
          />
        );
      }
    } else {
      // Lower teeth
      if (isAnterior) {
        // Lower anterior tooth (incisor/canine)
        return (
          <path 
            d="M15,0 C10,0 7,2 7,10 C7,22 5,30 5,34 C5,37 10,38 15,38 C20,38 25,37 25,34 C25,30 23,22 23,10 C23,2 20,0 15,0 Z" 
            fill={selected ? "#a5d6a7" : "white"} 
            stroke="#666"
          />
        );
      } else if (isMolar) {
        // Lower molar
        return (
          <path 
            d="M15,0 C9,0 5,2 5,10 C5,20 3,25 3,30 C3,35 8,38 15,38 C22,38 27,35 27,30 C27,25 25,20 25,10 C25,2 21,0 15,0 Z M15,15 C13,15 8,17 8,22 C8,27 13,33 15,33 C17,33 22,27 22,22 C22,17 17,15 15,15 Z" 
            fill={selected ? "#a5d6a7" : "white"} 
            stroke="#666"
          />
        );
      } else {
        // Lower premolar
        return (
          <path 
            d="M15,0 C10,0 7,2 7,10 C7,20 5,25 5,30 C5,35 10,38 15,38 C20,38 25,35 25,30 C25,25 23,20 23,10 C23,2 20,0 15,0 Z" 
            fill={selected ? "#a5d6a7" : "white"} 
            stroke="#666"
          />
        );
      }
    }
  };

  // Render the missing tooth indicator if tooth is missing
  const renderMissingToothIndicator = () => {
    if (!missing) return null;
    
    return (
      <>
        <line x1="5" y1="5" x2="25" y2="35" stroke="#f44336" strokeWidth="2" />
        <line x1="25" y1="5" x2="5" y2="35" stroke="#f44336" strokeWidth="2" />
      </>
    );
  };

  return (
    <Box
      component="svg"
      width={width}
      height={height}
      viewBox="0 0 30 40"
      sx={{
        ...sx,
        opacity: missing ? 0.5 : 1,
      }}
      {...rest}
    >
      {renderToothPath()}
      {renderMissingToothIndicator()}
    </Box>
  );
};

export default ToothSvg; 