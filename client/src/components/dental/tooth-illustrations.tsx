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
  
  // SVG paths for occlusal view - more realistic with cusps and fissures
  const paths = {
    molar: {
      // Molar with 4-5 cusps and central fossa
      outline: "M3,14 C3,8 7,3 14,3 C21,3 25,8 25,14 C25,20 21,25 14,25 C7,25 3,20 3,14 Z",
      details: "M8,8 C10,6 12,10 14,8 C16,10 18,6 20,8 C22,10 20,14 20,16 C18,20 16,18 14,20 C12,18 10,20 8,16 C8,14 6,10 8,8 Z",
      grooves: "M8,10 C12,14 16,14 20,10 M8,18 C12,14 16,14 20,18"
    },
    premolar: {
      // Premolar with 2 cusps and central groove
      outline: "M5,14 C5,8 9,5 14,5 C19,5 23,8 23,14 C23,20 19,23 14,23 C9,23 5,20 5,14 Z",
      details: "M9,9 C11,7 13,11 14,9 C15,11 17,7 19,9 C21,11 19,16 19,18 C17,20 15,18 14,20 C13,18 11,20 9,18 C9,16 7,11 9,9 Z",
      grooves: "M10,10 C12,14 16,14 18,10 M14,8 L14,20"
    },
    canine: {
      // Canine with pointed cusp
      outline: "M7,14 C7,8 10,4 14,4 C18,4 21,8 21,14 C21,20 18,24 14,24 C10,24 7,20 7,14 Z",
      details: "M10,10 C12,6 16,6 18,10 C20,14 16,20 14,22 C12,20 8,14 10,10 Z",
      grooves: "M14,6 L14,22"
    },
    incisor: {
      // Incisor with flat edge
      outline: "M8,14 C8,8 10,5 14,5 C18,5 20,8 20,14 C20,20 18,23 14,23 C10,23 8,20 8,14 Z",
      details: "M10,8 C12,6 16,6 18,8 C20,12 18,18 14,20 C10,18 8,12 10,8 Z",
      grooves: "M14,5 L14,23"
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
      {/* Base tooth shape */}
      <path
        d={paths[toothType].outline}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      
      {/* Surface details to give 3D appearance */}
      <path
        d={paths[toothType].details}
        fill={fill === "white" ? "#f8f8f8" : fill}
        stroke={stroke}
        strokeWidth={strokeWidth / 2}
        strokeOpacity={0.7}
      />
      
      {/* Grooves and fissures */}
      <path
        d={paths[toothType].grooves}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth / 2}
        strokeOpacity={0.8}
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
  
  // More anatomically accurate SVG paths for buccal/facial view
  const paths = {
    molar: {
      upper: {
        // Upper molar with three roots and crown
        crown: "M4,16 C4,14 5,12 7,10 C9,8 11,6 14,6 C17,6 19,8 21,10 C23,12 24,14 24,16 L24,18 C24,20 22,22 20,22 L8,22 C6,22 4,20 4,18 L4,16 Z",
        roots: "M8,22 C7,24 6,30 8,36 M14,22 C14,24 14,34 14,38 M20,22 C21,24 22,30 20,36",
        details: "M8,10 C10,8 12,10 14,8 C16,10 18,8 20,10 C22,12 22,18 20,20 C18,22 16,20 14,22 C12,20 10,22 8,20 C6,18 6,12 8,10 Z"
      },
      lower: {
        // Lower molar with two roots and crown
        crown: "M4,18 C4,16 5,14 7,12 C9,10 11,8 14,8 C17,8 19,10 21,12 C23,14 24,16 24,18 L24,20 C24,22 22,24 20,24 L8,24 C6,24 4,22 4,20 L4,18 Z",
        roots: "M10,24 C8,26 6,32 8,36 M18,24 C20,26 22,32 20,36",
        details: "M8,12 C10,10 12,12 14,10 C16,12 18,10 20,12 C22,14 22,20 20,22 C18,24 16,22 14,24 C12,22 10,24 8,22 C6,20 6,14 8,12 Z"
      }
    },
    premolar: {
      upper: {
        // Upper premolar with one or two roots
        crown: "M6,16 C6,12 8,8 14,8 C20,8 22,12 22,16 L22,18 C22,20 20,22 18,22 L10,22 C8,22 6,20 6,18 L6,16 Z",
        roots: "M10,22 C9,24 8,30 10,34 M18,22 C19,24 20,30 18,34",
        details: "M10,10 C12,8 16,8 18,10 C20,12 20,18 18,20 C16,22 12,22 10,20 C8,18 8,12 10,10 Z"
      },
      lower: {
        // Lower premolar with one root
        crown: "M6,18 C6,14 8,10 14,10 C20,10 22,14 22,18 L22,20 C22,22 20,24 18,24 L10,24 C8,24 6,22 6,20 L6,18 Z",
        roots: "M14,24 C14,26 14,32 14,36",
        details: "M10,12 C12,10 16,10 18,12 C20,14 20,20 18,22 C16,24 12,24 10,22 C8,20 8,14 10,12 Z"
      }
    },
    canine: {
      upper: {
        // Upper canine with pointed cusp and single long root
        crown: "M7,16 C7,10 10,6 14,6 C18,6 21,10 21,16 L21,18 C21,20 19,22 17,22 L11,22 C9,22 7,20 7,18 L7,16 Z",
        roots: "M14,22 C14,26 14,34 14,38",
        details: "M10,8 C12,6 16,6 18,8 C20,12 18,18 16,20 C14,22 12,20 10,20 C8,18 8,12 10,8 Z"
      },
      lower: {
        // Lower canine
        crown: "M7,18 C7,12 10,8 14,8 C18,8 21,12 21,18 L21,20 C21,22 19,24 17,24 L11,24 C9,24 7,22 7,20 L7,18 Z",
        roots: "M14,24 C14,28 14,34 14,38",
        details: "M10,10 C12,8 16,8 18,10 C20,14 18,20 16,22 C14,24 12,22 10,22 C8,20 8,14 10,10 Z"
      }
    },
    incisor: {
      upper: {
        // Upper incisor with flat edge and single root
        crown: "M8,16 C8,10 10,4 14,4 C18,4 20,10 20,16 L20,18 C20,20 18,22 16,22 L12,22 C10,22 8,20 8,18 L8,16 Z",
        roots: "M14,22 C14,26 14,34 14,38",
        details: "M10,6 C12,4 16,4 18,6 C20,10 18,18 16,20 C14,22 12,20 10,20 C8,18 8,10 10,6 Z"
      },
      lower: {
        // Lower incisor
        crown: "M8,18 C8,12 10,6 14,6 C18,6 20,12 20,18 L20,20 C20,22 18,24 16,24 L12,24 C10,24 8,22 8,20 L8,18 Z",
        roots: "M14,24 C14,28 14,34 14,38",
        details: "M10,8 C12,6 16,6 18,8 C20,12 18,20 16,22 C14,24 12,22 10,22 C8,20 8,12 10,8 Z"
      }
    }
  };

  const view = isUpper ? "upper" : "lower";
  const viewBox = isUpper ? "0 0 28 40" : "0 0 28 40";

  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      className={className}
      onClick={onClick}
    >
      {/* Crown of the tooth */}
      <path
        d={paths[toothType][view].crown}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      
      {/* Roots of the tooth */}
      <path
        d={paths[toothType][view].roots}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      
      {/* Surface details for 3D effect */}
      <path
        d={paths[toothType][view].details}
        fill={fill === "white" ? "#f8f8f8" : fill}
        stroke={stroke}
        strokeWidth={strokeWidth / 3}
        strokeOpacity={0.5}
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
  const toothType = getToothType(toothNumber);
  const isUpper = isUpperArch(toothNumber);
  
  // Lingual view paths - similar to buccal but with different surface features
  const paths = {
    molar: {
      upper: {
        // Upper molar lingual view
        crown: "M4,16 C4,14 5,12 7,10 C9,8 11,6 14,6 C17,6 19,8 21,10 C23,12 24,14 24,16 L24,18 C24,20 22,22 20,22 L8,22 C6,22 4,20 4,18 L4,16 Z",
        roots: "M8,22 C7,24 6,30 8,36 M14,22 C14,24 14,34 14,38 M20,22 C21,24 22,30 20,36",
        details: "M8,12 C10,10 12,8 14,10 C16,8 18,10 20,12 C20,14 18,18 16,20 C14,18 12,20 10,18 C8,16 8,14 8,12 Z"
      },
      lower: {
        // Lower molar lingual view
        crown: "M4,18 C4,16 5,14 7,12 C9,10 11,8 14,8 C17,8 19,10 21,12 C23,14 24,16 24,18 L24,20 C24,22 22,24 20,24 L8,24 C6,24 4,22 4,20 L4,18 Z",
        roots: "M10,24 C8,26 6,32 8,36 M18,24 C20,26 22,32 20,36",
        details: "M8,14 C10,12 12,10 14,12 C16,10 18,12 20,14 C20,16 18,20 16,22 C14,20 12,22 10,20 C8,18 8,16 8,14 Z"
      }
    },
    premolar: {
      upper: {
        // Upper premolar lingual view
        crown: "M6,16 C6,12 8,8 14,8 C20,8 22,12 22,16 L22,18 C22,20 20,22 18,22 L10,22 C8,22 6,20 6,18 L6,16 Z",
        roots: "M10,22 C9,24 8,30 10,34 M18,22 C19,24 20,30 18,34",
        details: "M10,12 C12,10 14,8 16,10 C18,12 18,18 16,20 C14,18 12,20 10,18 C8,16 8,14 10,12 Z"
      },
      lower: {
        // Lower premolar lingual view
        crown: "M6,18 C6,14 8,10 14,10 C20,10 22,14 22,18 L22,20 C22,22 20,24 18,24 L10,24 C8,24 6,22 6,20 L6,18 Z",
        roots: "M14,24 C14,26 14,32 14,36",
        details: "M10,14 C12,12 14,10 16,12 C18,14 18,20 16,22 C14,20 12,22 10,20 C8,18 8,16 10,14 Z"
      }
    },
    canine: {
      upper: {
        // Upper canine lingual view
        crown: "M7,16 C7,10 10,6 14,6 C18,6 21,10 21,16 L21,18 C21,20 19,22 17,22 L11,22 C9,22 7,20 7,18 L7,16 Z",
        roots: "M14,22 C14,26 14,34 14,38",
        details: "M11,10 C12,8 16,8 17,10 C18,14 16,18 14,20 C12,18 10,14 11,10 Z"
      },
      lower: {
        // Lower canine lingual view
        crown: "M7,18 C7,12 10,8 14,8 C18,8 21,12 21,18 L21,20 C21,22 19,24 17,24 L11,24 C9,24 7,22 7,20 L7,18 Z",
        roots: "M14,24 C14,28 14,34 14,38",
        details: "M11,12 C12,10 16,10 17,12 C18,16 16,20 14,22 C12,20 10,16 11,12 Z"
      }
    },
    incisor: {
      upper: {
        // Upper incisor lingual view with cingulum
        crown: "M8,16 C8,10 10,4 14,4 C18,4 20,10 20,16 L20,18 C20,20 18,22 16,22 L12,22 C10,22 8,20 8,18 L8,16 Z",
        roots: "M14,22 C14,26 14,34 14,38",
        details: "M10,8 C12,6 16,6 18,8 C18,12 16,14 14,16 C12,14 10,12 10,8 Z M12,18 C13,20 15,20 16,18 C14,16 12,18 12,18 Z"
      },
      lower: {
        // Lower incisor lingual view
        crown: "M8,18 C8,12 10,6 14,6 C18,6 20,12 20,18 L20,20 C20,22 18,24 16,24 L12,24 C10,24 8,22 8,20 L8,18 Z",
        roots: "M14,24 C14,28 14,34 14,38",
        details: "M10,10 C12,8 16,8 18,10 C18,14 16,16 14,18 C12,16 10,14 10,10 Z M12,20 C13,22 15,22 16,20 C14,18 12,20 12,20 Z"
      }
    }
  };

  const view = isUpper ? "upper" : "lower";
  const viewBox = isUpper ? "0 0 28 40" : "0 0 28 40";

  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      className={className}
      onClick={onClick}
    >
      {/* Crown of the tooth */}
      <path
        d={paths[toothType][view].crown}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      
      {/* Roots of the tooth */}
      <path
        d={paths[toothType][view].roots}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      
      {/* Surface details for 3D effect - lingual has different features like cingulum */}
      <path
        d={paths[toothType][view].details}
        fill={fill === "white" ? "#f8f8f8" : fill}
        stroke={stroke}
        strokeWidth={strokeWidth / 3}
        strokeOpacity={0.5}
      />
    </svg>
  );
};