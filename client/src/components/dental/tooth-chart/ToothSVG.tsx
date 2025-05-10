import React from 'react';
import { ProbingSite, ToothSurface } from '../../../types/dental';

// Define different tooth types for anatomical accuracy
export type ToothType = 'molar' | 'premolar' | 'canine' | 'incisor';

interface ToothSVGProps {
  toothNumber: number;
  width?: number;
  height?: number;
  selected?: boolean;
  highlightedSite?: ProbingSite | ToothSurface;
  onClick?: () => void;
  onSiteClick?: (site: ProbingSite | ToothSurface) => void;
}

/**
 * Determines tooth type based on universal numbering system
 */
const getToothType = (toothNumber: number): ToothType => {
  // Universal numbering system (1-32)
  // 1-2, 15-16, 17-18, 31-32 are molars
  // 3-5, 12-14, 19-21, 28-30 are premolars
  // 6, 11, 22, 27 are canines
  // 7-10, 23-26 are incisors
  if ([1, 2, 15, 16, 17, 18, 31, 32].includes(toothNumber)) {
    return 'molar';
  } else if ([4, 5, 12, 13, 20, 21, 28, 29].includes(toothNumber)) {
    return 'premolar';
  } else if ([6, 11, 22, 27].includes(toothNumber)) {
    return 'canine';
  } else {
    return 'incisor';
  }
};

/**
 * Gets the clickable site paths for a specific tooth type in probing mode
 */
const getProbingSitePaths = (toothType: ToothType): Record<ProbingSite, string> => {
  // These paths describe the 6 probing sites (MB, B, DB, DL, L, ML)
  // Each path is designed to be anatomically positioned on the specific tooth type
  
  switch (toothType) {
    case 'molar':
      return {
        'MB': 'M 10,15 Q 15,10 20,15 L 15,30 L 10,30 Z', // Mesio-Buccal
        'B': 'M 20,15 Q 25,10 30,15 L 30,30 L 20,30 Z',  // Buccal
        'DB': 'M 30,15 Q 35,10 40,15 L 40,30 L 30,30 Z', // Disto-Buccal
        'DL': 'M 40,15 Q 35,20 40,30 L 40,45 L 30,45 Z', // Disto-Lingual
        'L': 'M 30,30 Q 25,35 20,30 L 20,45 L 30,45 Z',  // Lingual
        'ML': 'M 20,30 Q 15,35 10,30 L 10,45 L 20,45 Z'  // Mesio-Lingual
      };
    case 'premolar':
      return {
        'MB': 'M 15,15 Q 20,10 25,15 L 20,30 L 15,30 Z',
        'B': 'M 25,15 Q 30,13 35,15 L 30,30 L 25,30 Z',
        'DB': 'M 35,15 Q 40,17 45,15 L 45,30 L 35,30 Z',
        'DL': 'M 45,15 Q 40,20 45,30 L 45,45 L 35,45 Z',
        'L': 'M 35,30 Q 30,35 25,30 L 25,45 L 35,45 Z',
        'ML': 'M 25,30 Q 20,35 15,30 L 15,45 L 25,45 Z'
      };
    case 'canine':
      return {
        'MB': 'M 20,15 Q 25,10 30,15 L 25,35 L 20,35 Z',
        'B': 'M 30,15 Q 35,13 40,15 L 35,35 L 25,35 Z',
        'DB': 'M 40,15 Q 45,17 50,15 L 45,35 L 35,35 Z',
        'DL': 'M 50,15 Q 45,20 50,35 L 45,50 L 35,50 Z',
        'L': 'M 45,35 Q 35,40 25,35 L 25,50 L 35,50 Z',
        'ML': 'M 25,35 Q 20,40 20,35 L 20,50 L 25,50 Z'
      };
    case 'incisor':
      return {
        'MB': 'M 25,15 Q 30,10 35,15 L 30,35 L 25,35 Z',
        'B': 'M 35,15 Q 40,13 45,15 L 40,35 L 30,35 Z',
        'DB': 'M 45,15 Q 50,17 55,15 L 50,35 L 40,35 Z',
        'DL': 'M 55,15 Q 50,20 55,35 L 50,45 L 40,45 Z',
        'L': 'M 50,35 Q 40,40 30,35 L 30,45 L 40,45 Z',
        'ML': 'M 30,35 Q 25,40 25,35 L 25,45 L 30,45 Z'
      };
  }
};

/**
 * Gets the clickable surface paths for a specific tooth type in restorative mode
 */
const getToothSurfacePaths = (toothType: ToothType): Record<ToothSurface, string> => {
  // These paths describe the 5 surfaces (M, O, D, F, L)
  // Each path is designed to be anatomically positioned on the specific tooth type
  
  switch (toothType) {
    case 'molar':
      return {
        'M': 'M 10,15 Q 15,10 20,15 L 15,45 L 10,45 Z', // Mesial
        'O': 'M 20,15 Q 25,10 30,15 L 30,30 Q 25,35 20,30 Z', // Occlusal
        'D': 'M 30,15 Q 35,10 40,15 L 40,45 L 30,45 Z', // Distal
        'F': 'M 10,15 L 40,15 Q 35,10 25,5 Q 15,10 10,15 Z', // Facial/Buccal
        'L': 'M 10,45 L 40,45 Q 35,50 25,55 Q 15,50 10,45 Z' // Lingual
      };
    case 'premolar':
      return {
        'M': 'M 15,15 Q 20,10 25,15 L 20,45 L 15,45 Z',
        'O': 'M 25,15 Q 30,13 35,15 L 35,30 Q 30,35 25,30 Z',
        'D': 'M 35,15 Q 40,10 45,15 L 45,45 L 35,45 Z',
        'F': 'M 15,15 L 45,15 Q 40,10 30,5 Q 20,10 15,15 Z',
        'L': 'M 15,45 L 45,45 Q 40,50 30,55 Q 20,50 15,45 Z'
      };
    case 'canine':
      return {
        'M': 'M 20,15 Q 25,10 30,15 L 25,50 L 20,50 Z',
        'I': 'M 30,15 Q 35,13 40,15, L 40,25 Q 35,30 30,25 Z', // Incisal (instead of Occlusal)
        'D': 'M 40,15 Q 45,10 50,15 L 45,50 L 40,50 Z',
        'F': 'M 20,15 L 50,15 Q 45,10, 35,5 Q 25,10 20,15 Z',
        'L': 'M 20,50 L 45,50 Q 40,55 35,60 Q 25,55 20,50 Z'
      };
    case 'incisor':
      return {
        'M': 'M 25,15 Q 30,10 35,15 L 30,45 L 25,45 Z',
        'I': 'M 35,15 Q 40,13 45,15 L 45,25 Q 40,30 35,25 Z', // Incisal
        'D': 'M 45,15 Q 50,10 55,15 L 50,45 L 45,45 Z',
        'F': 'M 25,15 L 55,15 Q 50,10 40,5 Q 30,10 25,15 Z',
        'L': 'M 25,45 L 50,45 Q 45,50 40,55 Q 30,50 25,45 Z'
      };
  }
};

/**
 * Gets the base tooth outline path for a specific tooth type
 */
const getToothOutlinePath = (toothType: ToothType): string => {
  switch (toothType) {
    case 'molar':
      return 'M 10,15 Q 15,10 25,5 Q 35,10 40,15 L 40,45 Q 35,50 25,55 Q 15,50 10,45 Z';
    case 'premolar':
      return 'M 15,15 Q 20,10 30,5 Q 40,10 45,15 L 45,45 Q 40,50 30,55 Q 20,50 15,45 Z';
    case 'canine':
      return 'M 20,15 Q 25,10 35,5 Q 45,10 50,15 L 45,50 Q 40,55 35,60 Q 25,55 20,50 Z';
    case 'incisor':
      return 'M 25,15 Q 30,10 40,5 Q 50,10 55,15 L 50,45 Q 45,50 40,55 Q 30,50 25,45 Z';
  }
};

/**
 * ToothSVG component renders an anatomically correct SVG of a tooth
 * based on the universal numbering system and supports interactive
 * sites for both perio and restorative modes.
 */
const ToothSVG: React.FC<ToothSVGProps> = ({
  toothNumber,
  width = 80,
  height = 100,
  selected = false,
  highlightedSite,
  onClick,
  onSiteClick
}) => {
  const toothType = getToothType(toothNumber);
  const toothOutlinePath = getToothOutlinePath(toothType);
  const probingSitePaths = getProbingSitePaths(toothType);
  const toothSurfacePaths = getToothSurfacePaths(toothType);
  
  // For upper teeth we need to flip the SVG
  const isUpperTooth = toothNumber <= 16;
  const transformValue = isUpperTooth ? 'scale(1, -1) translate(0, -60)' : '';
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };
  
  const handleSiteClick = (site: ProbingSite | ToothSurface) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSiteClick) {
      onSiteClick(site);
    }
  };
  
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 60 60"
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    >
      {/* Tooth number label */}
      <text
        x="30"
        y={isUpperTooth ? "10" : "58"}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="12"
        fontWeight="bold"
        fill="#333"
      >
        {toothNumber}
      </text>
      
      {/* Main tooth group with transform for upper/lower orientation */}
      <g transform={transformValue}>
        {/* Tooth outline */}
        <path
          d={toothOutlinePath}
          fill="#f8f8f8"
          stroke={selected ? "#1976d2" : "#777"}
          strokeWidth={selected ? "2" : "1"}
        />
        
        {/* Probing sites - create clickable areas for each site */}
        {Object.entries(probingSitePaths).map(([site, path]) => (
          <path
            key={`probe-${toothNumber}-${site}`}
            d={path}
            fill="transparent"
            stroke="transparent"
            strokeWidth="1"
            onClick={handleSiteClick(site as ProbingSite)}
            style={{ 
              cursor: 'pointer',
              fillOpacity: highlightedSite === site ? 0.2 : 0
            }}
            className={`site-${site}`}
          />
        ))}
        
        {/* Tooth surfaces - create clickable areas for each surface */}
        {Object.entries(toothSurfacePaths).map(([surface, path]) => (
          <path
            key={`surface-${toothNumber}-${surface}`}
            d={path}
            fill="transparent"
            stroke="transparent"
            strokeWidth="1"
            onClick={handleSiteClick(surface as ToothSurface)}
            style={{ 
              cursor: 'pointer',
              fillOpacity: highlightedSite === surface ? 0.2 : 0
            }}
            className={`surface-${surface}`}
          />
        ))}
      </g>
    </svg>
  );
};

export default ToothSVG; 