/**
 * DentaMind Chart Color Configuration
 * 
 * This file defines the color schemes for dental charts and periodontal charts
 * with proper support for light/dark modes and accessibility options.
 */

// Chart color profiles for different user needs
export type ColorProfile = 'standard' | 'highContrast' | 'colorblind' | 'monochrome';

// Color configuration type for dental charts
export interface DentalChartColors {
  // Tooth conditions
  filling: string;
  rootCanal: string;
  crown: string;
  implant: string;
  bridge: string;
  veneer: string;
  extraction: string;
  watch: string;
  missing: string;
  // Status indicators
  healthy: string;
  warning: string;
  urgent: string;
  completed: string;
  planned: string;
  inProgress: string;
}

// Color configuration type for periodontal charts
export interface PerioChartColors {
  // Probing depths by severity
  normal: string; // 1-3mm (healthy)
  mild: string;   // 4-5mm (early periodontitis)
  moderate: string; // 6-7mm (moderate periodontitis)
  severe: string;   // 8mm+ (severe periodontitis)
  // Indicators
  bleeding: string;
  suppuration: string;
  recession: string;
  attachment: string;
  // Visual cues
  mobilityBorder: string;
  furcationBorder: string;
  plaqueBg: string;
  calculusBg: string;
}

// Color settings for different modes and profiles
export const getDentalChartColors = (mode: 'light' | 'dark', profile: ColorProfile = 'standard'): DentalChartColors => {
  // Base color configurations
  const baseColors: Record<string, DentalChartColors> = {
    light: {
      filling: '#A0D6B4',      // Light green
      rootCanal: '#FFD3B5',    // Light orange
      crown: '#B2DFDB',        // Teal
      implant: '#B3E5FC',      // Light blue
      bridge: '#D1C4E9',       // Light purple
      veneer: '#F8BBD0',       // Pink
      extraction: '#FFCCBC',   // Light red
      watch: '#FFF9C4',        // Light yellow
      missing: '#EEEEEE',      // Light gray
      healthy: '#66BB6A',      // Green
      warning: '#FFA726',      // Orange
      urgent: '#EF5350',       // Red
      completed: '#42A5F5',    // Blue
      planned: '#AB47BC',      // Purple
      inProgress: '#26C6DA'    // Cyan
    },
    dark: {
      filling: '#2E7D32',      // Darker green
      rootCanal: '#E65100',    // Darker orange
      crown: '#00796B',        // Darker teal
      implant: '#0277BD',      // Darker blue
      bridge: '#512DA8',       // Darker purple
      veneer: '#C2185B',       // Darker pink
      extraction: '#D84315',   // Darker red
      watch: '#F9A825',        // Darker yellow
      missing: '#757575',      // Darker gray
      healthy: '#4CAF50',      // Darker green
      warning: '#FF9800',      // Darker orange
      urgent: '#F44336',       // Darker red
      completed: '#2196F3',    // Darker blue
      planned: '#9C27B0',      // Darker purple
      inProgress: '#00BCD4'    // Darker cyan
    }
  };
  
  // High contrast color profile
  const highContrastColors: Record<string, DentalChartColors> = {
    light: {
      filling: '#388E3C',      // Darker green for contrast
      rootCanal: '#E65100',    // Darker orange for contrast
      crown: '#00796B',        // Darker teal for contrast
      implant: '#01579B',      // Darker blue for contrast
      bridge: '#4527A0',       // Darker purple for contrast
      veneer: '#AD1457',       // Darker pink for contrast
      extraction: '#C62828',   // Darker red for contrast
      watch: '#F57F17',        // Darker yellow for contrast
      missing: '#616161',      // Darker gray for contrast
      healthy: '#2E7D32',      // Darker green for contrast
      warning: '#EF6C00',      // Darker orange for contrast
      urgent: '#C62828',       // Darker red for contrast
      completed: '#1565C0',    // Darker blue for contrast
      planned: '#6A1B9A',      // Darker purple for contrast
      inProgress: '#00838F'    // Darker cyan for contrast
    },
    dark: {
      filling: '#81C784',      // Brighter green for contrast
      rootCanal: '#FFCC80',    // Brighter orange for contrast
      crown: '#80CBC4',        // Brighter teal for contrast
      implant: '#81D4FA',      // Brighter blue for contrast
      bridge: '#B39DDB',       // Brighter purple for contrast
      veneer: '#F48FB1',       // Brighter pink for contrast
      extraction: '#FFAB91',   // Brighter red for contrast
      watch: '#FFF59D',        // Brighter yellow for contrast
      missing: '#E0E0E0',      // Brighter gray for contrast
      healthy: '#A5D6A7',      // Brighter green for contrast
      warning: '#FFB74D',      // Brighter orange for contrast
      urgent: '#E57373',       // Brighter red for contrast
      completed: '#90CAF9',    // Brighter blue for contrast
      planned: '#CE93D8',      // Brighter purple for contrast
      inProgress: '#80DEEA'    // Brighter cyan for contrast
    }
  };
  
  // Colorblind-friendly palette (deuteranopia/protanopia)
  const colorblindColors: Record<string, DentalChartColors> = {
    light: {
      filling: '#018571',      // Teal (distinguishable from red)
      rootCanal: '#A6611A',    // Brown
      crown: '#80CDC1',        // Light teal
      implant: '#74ADD1',      // Blue
      bridge: '#F6E8C3',       // Beige
      veneer: '#DFC27D',       // Tan
      extraction: '#D01C8B',   // Magenta
      watch: '#F1B6DA',        // Pink
      missing: '#B8B8B8',      // Gray
      healthy: '#4393C3',      // Blue
      warning: '#F1B6DA',      // Pink
      urgent: '#D01C8B',       // Magenta
      completed: '#92C5DE',    // Light blue
      planned: '#F7F7F7',      // White
      inProgress: '#D9EF8B'    // Light green-yellow
    },
    dark: {
      filling: '#01665E',      // Dark teal
      rootCanal: '#8C510A',    // Dark brown
      crown: '#35978F',        // Medium teal
      implant: '#3182BD',      // Medium blue
      bridge: '#D8B365',       // Medium tan
      veneer: '#BF812D',       // Dark tan
      extraction: '#8E0152',   // Dark magenta
      watch: '#C51B7D',        // Medium magenta
      missing: '#737373',      // Medium gray
      healthy: '#0571B0',      // Medium blue
      warning: '#CA0020',      // Dark red
      urgent: '#8E0152',       // Dark magenta
      completed: '#2166AC',    // Medium blue
      planned: '#FFFFFF',      // White
      inProgress: '#A6DBA0'    // Medium green
    }
  };
  
  // Monochrome palette (with different shades for accessibility)
  const monochromeColors: Record<string, DentalChartColors> = {
    light: {
      filling: '#BDBDBD',      // Light gray
      rootCanal: '#9E9E9E',    // Medium-light gray
      crown: '#757575',        // Medium gray
      implant: '#616161',      // Medium-dark gray
      bridge: '#424242',       // Dark gray
      veneer: '#BDBDBD',       // Light gray (repeated)
      extraction: '#212121',   // Very dark gray
      watch: '#E0E0E0',        // Very light gray
      missing: '#F5F5F5',      // Nearly white
      healthy: '#9E9E9E',      // Medium-light gray
      warning: '#757575',      // Medium gray
      urgent: '#212121',       // Very dark gray
      completed: '#616161',    // Medium-dark gray
      planned: '#E0E0E0',      // Very light gray
      inProgress: '#BDBDBD'    // Light gray
    },
    dark: {
      filling: '#757575',      // Medium gray
      rootCanal: '#9E9E9E',    // Medium-light gray
      crown: '#BDBDBD',        // Light gray
      implant: '#E0E0E0',      // Very light gray
      bridge: '#F5F5F5',       // Nearly white
      veneer: '#757575',       // Medium gray (repeated)
      extraction: '#E0E0E0',   // Very light gray
      watch: '#424242',        // Dark gray
      missing: '#212121',      // Very dark gray
      healthy: '#9E9E9E',      // Medium-light gray
      warning: '#BDBDBD',      // Light gray
      urgent: '#F5F5F5',       // Nearly white
      completed: '#E0E0E0',    // Very light gray
      planned: '#424242',      // Dark gray
      inProgress: '#757575'    // Medium gray
    }
  };
  
  // Select the appropriate color set based on profile
  switch (profile) {
    case 'highContrast':
      return highContrastColors[mode];
    case 'colorblind':
      return colorblindColors[mode];
    case 'monochrome':
      return monochromeColors[mode];
    case 'standard':
    default:
      return baseColors[mode];
  }
};

// Get perio chart colors based on mode and profile
export const getPerioChartColors = (mode: 'light' | 'dark', profile: ColorProfile = 'standard'): PerioChartColors => {
  // Base color configurations
  const baseColors: Record<string, PerioChartColors> = {
    light: {
      normal: '#FFFFFF',      // White (healthy)
      mild: '#FFF8E1',        // Light yellow (mild)
      moderate: '#FFE0B2',    // Light orange (moderate)
      severe: '#FFCCBC',      // Light red (severe)
      bleeding: '#EF5350',    // Red for bleeding
      suppuration: '#FF9800', // Orange for suppuration
      recession: '#29B6F6',   // Blue for recession
      attachment: '#7E57C2',  // Purple for CAL
      mobilityBorder: '#2196F3', // Blue for mobility
      furcationBorder: '#9C27B0', // Purple for furcation
      plaqueBg: '#E0F7FA',    // Light cyan for plaque
      calculusBg: '#EFEBE9'   // Light brown for calculus
    },
    dark: {
      normal: '#424242',      // Dark gray (healthy)
      mild: '#FBC02D',        // Darker yellow (mild)
      moderate: '#F57C00',    // Darker orange (moderate)
      severe: '#D32F2F',      // Darker red (severe)
      bleeding: '#F44336',    // Red for bleeding
      suppuration: '#FF9800', // Orange for suppuration
      recession: '#039BE5',   // Blue for recession
      attachment: '#673AB7',  // Purple for CAL
      mobilityBorder: '#1E88E5', // Blue for mobility
      furcationBorder: '#8E24AA', // Purple for furcation
      plaqueBg: '#006064',    // Dark cyan for plaque
      calculusBg: '#4E342E'   // Dark brown for calculus
    }
  };
  
  // High contrast color profile for periodontal charts
  const highContrastColors: Record<string, PerioChartColors> = {
    light: {
      normal: '#FFFFFF',      // White (healthy)
      mild: '#FDD835',        // Bright yellow (mild)
      moderate: '#FB8C00',    // Bright orange (moderate)
      severe: '#D50000',      // Bright red (severe)
      bleeding: '#B71C1C',    // Dark red for bleeding
      suppuration: '#E65100', // Dark orange for suppuration
      recession: '#0277BD',   // Dark blue for recession
      attachment: '#4527A0',  // Dark purple for CAL
      mobilityBorder: '#0D47A1', // Dark blue for mobility
      furcationBorder: '#4A148C', // Dark purple for furcation
      plaqueBg: '#006064',    // Dark cyan for plaque
      calculusBg: '#3E2723'   // Dark brown for calculus
    },
    dark: {
      normal: '#424242',      // Dark gray (healthy)
      mild: '#FFEB3B',        // Bright yellow (mild)
      moderate: '#FF9800',    // Bright orange (moderate)
      severe: '#FF1744',      // Bright red (severe)
      bleeding: '#FF8A80',    // Light red for bleeding
      suppuration: '#FFB74D', // Light orange for suppuration
      recession: '#81D4FA',   // Light blue for recession
      attachment: '#B39DDB',  // Light purple for CAL
      mobilityBorder: '#90CAF9', // Light blue for mobility
      furcationBorder: '#CE93D8', // Light purple for furcation
      plaqueBg: '#80DEEA',    // Light cyan for plaque
      calculusBg: '#BCAAA4'   // Light brown for calculus
    }
  };
  
  // Colorblind-friendly palette for periodontal charts
  const colorblindColors: Record<string, PerioChartColors> = {
    light: {
      normal: '#FFFFFF',      // White (healthy)
      mild: '#DEF6FF',        // Light blue (mild)
      moderate: '#91BFDB',    // Medium blue (moderate)
      severe: '#D73027',      // Red (severe) - distinguishable for most colorblind types
      bleeding: '#8E0152',    // Magenta for bleeding
      suppuration: '#BF812D', // Brown for suppuration
      recession: '#01665E',   // Teal for recession
      attachment: '#4D4D4D',  // Dark gray for CAL
      mobilityBorder: '#35978F', // Teal for mobility
      furcationBorder: '#8C510A', // Brown for furcation
      plaqueBg: '#C7EAE5',    // Light teal for plaque
      calculusBg: '#F6E8C3'   // Light tan for calculus
    },
    dark: {
      normal: '#424242',      // Dark gray (healthy)
      mild: '#74ADD1',        // Medium blue (mild)
      moderate: '#4393C3',    // Darker blue (moderate)
      severe: '#B2182B',      // Darker red (severe)
      bleeding: '#C51B7D',    // Darker magenta for bleeding
      suppuration: '#A6611A', // Darker brown for suppuration
      recession: '#01665E',   // Teal for recession
      attachment: '#999999',  // Medium gray for CAL
      mobilityBorder: '#018571', // Dark teal for mobility
      furcationBorder: '#8C510A', // Dark brown for furcation
      plaqueBg: '#80CDC1',    // Medium teal for plaque
      calculusBg: '#DFC27D'   // Medium tan for calculus
    }
  };
  
  // Monochrome palette for periodontal charts
  const monochromeColors: Record<string, PerioChartColors> = {
    light: {
      normal: '#FFFFFF',      // White (healthy)
      mild: '#E0E0E0',        // Very light gray (mild)
      moderate: '#9E9E9E',    // Medium-light gray (moderate)
      severe: '#424242',      // Dark gray (severe)
      bleeding: '#000000',    // Black for bleeding
      suppuration: '#616161', // Medium-dark gray for suppuration
      recession: '#BDBDBD',   // Light gray for recession
      attachment: '#757575',  // Medium gray for CAL
      mobilityBorder: '#212121', // Very dark gray for mobility
      furcationBorder: '#616161', // Medium-dark gray for furcation
      plaqueBg: '#F5F5F5',    // Nearly white for plaque
      calculusBg: '#EEEEEE'   // Very light gray for calculus
    },
    dark: {
      normal: '#424242',      // Dark gray (healthy)
      mild: '#616161',        // Medium-dark gray (mild)
      moderate: '#9E9E9E',    // Medium-light gray (moderate)
      severe: '#F5F5F5',      // Nearly white (severe)
      bleeding: '#FFFFFF',    // White for bleeding
      suppuration: '#E0E0E0', // Very light gray for suppuration
      recession: '#757575',   // Medium gray for recession
      attachment: '#BDBDBD',  // Light gray for CAL
      mobilityBorder: '#EEEEEE', // Very light gray for mobility
      furcationBorder: '#BDBDBD', // Light gray for furcation
      plaqueBg: '#212121',    // Very dark gray for plaque
      calculusBg: '#424242'   // Dark gray for calculus
    }
  };
  
  // Select the appropriate color set based on profile
  switch (profile) {
    case 'highContrast':
      return highContrastColors[mode];
    case 'colorblind':
      return colorblindColors[mode];
    case 'monochrome':
      return monochromeColors[mode];
    case 'standard':
    default:
      return baseColors[mode];
  }
}; 