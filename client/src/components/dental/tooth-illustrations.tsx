import React from 'react';

interface ToothSvgProps {
  toothNumber: number;
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  className?: string;
  onClick?: () => void;
}

// Helper to determine tooth type
const getToothType = (toothNumber: number) => {
  // Molars
  if ([1, 2, 3, 14, 15, 16, 17, 18, 19, 30, 31, 32].includes(toothNumber)) {
    return 'molar';
  }
  // Premolars
  if ([4, 5, 12, 13, 20, 21, 28, 29].includes(toothNumber)) {
    return 'premolar';
  }
  // Canines
  if ([6, 11, 22, 27].includes(toothNumber)) {
    return 'canine';
  }
  // Incisors
  return 'incisor';
};

// Function to determine if tooth is in upper arch
const isUpperArch = (toothNumber: number) => {
  return toothNumber >= 1 && toothNumber <= 16;
};

// SVG paths for different tooth types from occlusal view
export const ToothSvgOcclusal: React.FC<ToothSvgProps> = ({
  toothNumber,
  width = 28,
  height = 28,
  fill = "white",
  stroke = "black",
  strokeWidth = 1,
  className = "",
  onClick
}) => {
  const toothType = getToothType(toothNumber);
  
  // SVG paths for occlusal view
  const paths = {
    molar: {
      outline: "M4,4 L24,4 C26,4 28,6 28,8 L28,20 C28,22 26,24 24,24 L4,24 C2,24 0,22 0,20 L0,8 C0,6 2,4 4,4 Z",
      grooves: "M7,10 L21,10 M7,18 L21,18 M14,6 L14,22"
    },
    premolar: {
      outline: "M8,4 L20,4 C24,4 28,8 28,12 L28,16 C28,20 24,24 20,24 L8,24 C4,24 0,20 0,16 L0,12 C0,8 4,4 8,4 Z",
      grooves: "M10,10 L18,10 M10,18 L18,18 M14,6 L14,22"
    },
    canine: {
      outline: "M14,2 C20,2 26,8 26,14 L26,18 C26,21 23,24 20,24 L8,24 C5,24 2,21 2,18 L2,14 C2,8 8,2 14,2 Z",
      grooves: "M14,6 L14,20"
    },
    incisor: {
      outline: "M8,4 L20,4 C24,4 28,8 28,12 L28,18 C28,21 25,24 22,24 L6,24 C3,24 0,21 0,18 L0,12 C0,8 4,4 8,4 Z",
      grooves: "M14,6 L14,20"
    }
  };

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 28 28"
      className={className}
      onClick={onClick}
    >
      <path
        d={paths[toothType].outline}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      <path
        d={paths[toothType].grooves}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth / 2}
        strokeLinecap="round"
      />
    </svg>
  );
};

// SVG for facial/buccal view
export const ToothSvgBuccal: React.FC<ToothSvgProps> = ({
  toothNumber,
  width = 28,
  height = 40,
  fill = "white",
  stroke = "black",
  strokeWidth = 1,
  className = "",
  onClick
}) => {
  const toothType = getToothType(toothNumber);
  const isUpper = isUpperArch(toothNumber);
  
  // SVG paths for buccal/facial view
  const paths = {
    molar: {
      upper: {
        crown: "M4,16 L24,16 C26,16 28,14 28,12 L28,4 C28,2 26,0 24,0 L4,0 C2,0 0,2 0,4 L0,12 C0,14 2,16 4,16 Z",
        root: "M6,16 L6,36 M14,16 L14,40 M22,16 L22,36"
      },
      lower: {
        crown: "M4,24 L24,24 C26,24 28,26 28,28 L28,36 C28,38 26,40 24,40 L4,40 C2,40 0,38 0,36 L0,28 C0,26 2,24 4,24 Z",
        root: "M6,24 L6,4 M14,24 L14,0 M22,24 L22,4"
      }
    },
    premolar: {
      upper: {
        crown: "M8,16 L20,16 C24,16 28,12 28,8 L28,4 C28,2 26,0 24,0 L4,0 C2,0 0,2 0,4 L0,8 C0,12 4,16 8,16 Z",
        root: "M10,16 L10,36 M18,16 L18,36"
      },
      lower: {
        crown: "M8,24 L20,24 C24,24 28,28 28,32 L28,36 C28,38 26,40 24,40 L4,40 C2,40 0,38 0,36 L0,32 C0,28 4,24 8,24 Z",
        root: "M10,24 L10,4 M18,24 L18,4"
      }
    },
    canine: {
      upper: {
        crown: "M14,16 C20,16 28,12 28,8 L28,4 C28,2 26,0 24,0 L4,0 C2,0 0,2 0,4 L0,8 C0,12 8,16 14,16 Z",
        root: "M14,16 L14,40"
      },
      lower: {
        crown: "M14,24 C20,24 28,28 28,32 L28,36 C28,38 26,40 24,40 L4,40 C2,40 0,38 0,36 L0,32 C0,28 8,24 14,24 Z",
        root: "M14,24 L14,0"
      }
    },
    incisor: {
      upper: {
        crown: "M8,16 L20,16 C24,16 28,12 28,8 L28,4 C28,2 26,0 24,0 L4,0 C2,0 0,2 0,4 L0,8 C0,12 4,16 8,16 Z",
        root: "M14,16 L14,38"
      },
      lower: {
        crown: "M8,24 L20,24 C24,24 28,28 28,32 L28,36 C28,38 26,40 24,40 L4,40 C2,40 0,38 0,36 L0,32 C0,28 4,24 8,24 Z",
        root: "M14,24 L14,2"
      }
    }
  };

  const view = isUpper ? "upper" : "lower";

  return (
    <svg
      width={width}
      height={height}
      viewBox={isUpper ? "0 0 28 40" : "0 0 28 40"}
      className={className}
      onClick={onClick}
    >
      <path
        d={paths[toothType][view].crown}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      <path
        d={paths[toothType][view].root}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
};

// SVG for lingual view
export const ToothSvgLingual: React.FC<ToothSvgProps> = ({
  toothNumber,
  width = 28,
  height = 40,
  fill = "white",
  stroke = "black",
  strokeWidth = 1,
  className = "",
  onClick
}) => {
  // For simplicity, lingual view is same as buccal but with minor differences
  return (
    <ToothSvgBuccal
      toothNumber={toothNumber}
      width={width}
      height={height}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      className={className}
      onClick={onClick}
    />
  );
};