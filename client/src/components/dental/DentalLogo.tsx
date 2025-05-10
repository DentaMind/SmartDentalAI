import React from 'react';
import { Box, SxProps } from '@mui/material';

interface DentalLogoProps {
  width?: number | string;
  height?: number | string;
  sx?: SxProps;
}

/**
 * DentaMind logo as an SVG
 * This ensures we always have the logo regardless of file access issues
 */
const DentalLogo: React.FC<DentalLogoProps> = ({ 
  width = 240, 
  height = 80,
  sx 
}) => {
  return (
    <Box
      component="svg"
      width={width}
      height={height}
      viewBox="0 0 240 80"
      xmlns="http://www.w3.org/2000/svg"
      sx={sx}
    >
      {/* Tooth icon */}
      <g transform="translate(10, 15) scale(1.5)">
        <path d="M25,2 C15,3 5,7 5,12 C5,18 7,28 7,45 C7,55 12,58 25,58 C38,58 43,55 43,45 C43,28 45,18 45,12 C45,7 35,3 25,2 Z" fill="#65FF65" stroke="#333" strokeWidth="2" />
        {/* Inner details */}
        <path d="M15,12 C15,12 25,15 35,12 M15,20 C15,20 25,23 35,20 M15,28 C15,28 25,31 35,28" stroke="#333" strokeWidth="1.5" fill="none" />
      </g>
      
      {/* Text "DENTAMIND" */}
      <text x="70" y="45" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="28" fill="#333">
        DENTA<tspan fill="#65FF65">MIND</tspan>
      </text>
      
      {/* Slogan */}
      <text x="70" y="60" fontFamily="Arial, sans-serif" fontStyle="italic" fontSize="12" fill="#666">
        Simplifying complexity in every case
      </text>
    </Box>
  );
};

export default DentalLogo; 