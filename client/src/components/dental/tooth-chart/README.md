# Unified Dental Chart System for DentaMind

This directory contains a comprehensive, reusable tooth charting system that powers both periodontal and restorative views in DentaMind.

## Components

### 1. ToothChartEngine

The main component that handles the rendering and interaction with a full dental chart. It supports:

- Multiple modes (perio, restorative, comprehensive)
- Voice input integration
- Different sizing options
- Interactive tooth selection
- Complete data management

Usage:

```tsx
import ToothChartEngine from '@/components/dental/tooth-chart/ToothChartEngine';
import { DentalChart, initializeEmptyChart } from '@/types/dental';

// In your component:
const [chartData, setChartData] = useState<DentalChart>(initializeEmptyChart());

// Render the chart
<ToothChartEngine
  initialData={chartData}
  mode="perio" // or "restorative" or "comprehensive"
  onDataChange={handleChartDataChange}
  onToothSelect={handleToothSelection}
  patientId={patientId}
  examDate={examDate}
/>
```

### 2. Tooth

A standalone component for rendering a single tooth. This is used internally by ToothChartEngine but can also be used independently.

```tsx
import Tooth from '@/components/dental/tooth-chart/Tooth';
import { initializeEmptyToothData } from '@/types/dental';

// Render a single tooth
<Tooth
  data={initializeEmptyToothData(8)} // Tooth #8
  mode="perio"
  onToothClick={handleToothClick}
  active={isActive}
  size="medium"
/>
```

## Data Model

The chart uses TypeScript types defined in `src/types/dental.ts`:

- `DentalChart`: Complete patient chart data
- `ToothData`: Data for a single tooth
- `ProbingData`: Periodontal measurements for a specific site
- `RestorationData`: Restorative information for a tooth

## Features

1. **Unified Data Structure** - One data model supports both perio and restorative charting
2. **Interactive Visualization** - Click on teeth and sites to select and update
3. **Voice Input Ready** - Built-in support for voice commands
4. **Real-time Updates** - Synchronous data management
5. **Comprehensive Clinical Information** - All periodontal measurements in one view

## Voice Command Format

The system supports voice input with commands like:

- "Tooth 8, mesio-buccal, 3" (sets probing depth to 3mm)
- "Tooth 30, distal, recession 2" (sets recession to 2mm)
- "Tooth 19, mobility 2" (sets mobility to grade 2)
- "Tooth 3, mesial, furcation 1" (sets mesial furcation to grade 1)

## Example Implementation

See `src/pages/patient/EnhancedPatientPerioChart.tsx` for a complete implementation example.

## Customization

The system supports theming and customization through:

- Size options (small, medium, large)
- Color customization via CSS variables
- Layout adaptation for different screen sizes

## Future Enhancements

Planned enhancements include:

1. 3D tooth visualization
2. AI-powered auto-charting from images
3. Treatment planning integration
4. Historical comparison views
5. Print templates

## Contributing

When making changes:

1. Preserve the unified data model
2. Update this README when adding new features
3. Ensure backward compatibility
4. Add tests for new functionality

## Contact

For questions or improvements, contact the DentaMind development team. 