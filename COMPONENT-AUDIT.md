# DentaMind Component Audit

This document maps the current component structure across the application and provides recommendations for reorganization based on feature-based architecture.

## Component Analysis

### Global Shared Components

These components are used across multiple features and should remain in `src/components/`:

| Component | Current Location | Used By | Recommendation |
|-----------|-----------------|---------|----------------|
| Navigation | `src/components/Navigation.tsx` | All pages | Keep as shared |
| Sidebar | `src/components/Sidebar.tsx` | Dashboard, patients, admin | Keep as shared |
| Layout | `src/components/Layout.tsx` | All pages | Keep as shared |
| Toast/Notifications | `src/components/notifications/` | Throughout application | Keep as shared |
| Dialog | `src/components/ui/dialog.tsx` | Throughout application | Keep as shared |
| Button | `src/components/ui/button.tsx` | Throughout application | Keep as shared |
| Calendar | `src/components/Calendar/` | Appointments, scheduling | Keep as shared |
| Form elements | `src/components/ui/` | Throughout application | Keep as shared |

### Feature-Specific Components

These components should be moved to their respective feature directories:

#### AI Feature (`src/features/ai/`)

| Component | Current Location | Recommendation |
|-----------|-----------------|----------------|
| AIFeedbackTrainer | `src/components/ai/AIFeedbackTrainer.tsx` | **Moved** to `features/ai/components/` |
| AITreatmentSuggestions | `src/components/ai/AITreatmentSuggestions.tsx` | **Moved** to `features/ai/components/` |
| ClinicalDecisionSupport | `src/components/ai/ClinicalDecisionSupport.tsx` | **Moved** to `features/ai/components/` |
| AIAssistDiagnosis | `src/components/dental/AIAssistDiagnosis.tsx` | Move to `features/ai/components/` |
| XRayAIAnalyzer | `src/components/xray/XRayAIAnalyzer.tsx` | Move to `features/ai/components/` |

#### Patient Intake Feature (`src/features/patientIntake/`)

| Component | Current Location | Recommendation |
|-----------|-----------------|----------------|
| PatientIntakeForm | `src/components/patient/intake/patient-intake-form.tsx` | **Moved** to `features/patientIntake/components/` |
| SendPatientIntake | `src/components/patient/intake/send-patient-intake-form.tsx` | **Moved** to `features/patientIntake/components/` |
| IntakeAIService | `src/features/patientIntake/services/intakeAIService.ts` | **Created** |

#### Dental Charting Feature (To Create: `src/features/dental/`)

| Component | Current Location | Recommendation |
|-----------|-----------------|----------------|
| PerioChartCanvas | `client/src/components/charting/PerioChartCanvas.tsx` | **Moved** to `src/components/dental/` (Move to `features/dental/components/`) |
| Tooth3D | `src/components/dental/Tooth3D.tsx` | Move to `features/dental/components/` |
| InteractiveDentalChart3D | `src/components/dental/InteractiveDentalChart3D.tsx` | Move to `features/dental/components/` |
| RestorativeChart | `client/src/components/restorative/RestorativeChart.tsx` | Move to `features/dental/components/` |

#### XRay Feature (To Create: `src/features/xray/`)

| Component | Current Location | Recommendation |
|-----------|-----------------|----------------|
| XrayViewer | `client/src/components/xray/XrayViewer.tsx` | Move to `features/xray/components/` |
| XrayTools | `client/src/components/xray/XrayTools.tsx` | Move to `features/xray/components/` |
| MeasurementTool | `client/src/components/xray/MeasurementTool.tsx` | Move to `features/xray/components/` |
| XrayComparison | `client/src/components/xray/xray-comparison.tsx` | Move to `features/xray/components/` |

#### Treatment Planning Feature (To Create: `src/features/treatment/`)

| Component | Current Location | Recommendation |
|-----------|-----------------|----------------|
| TreatmentPlanBuilder | `src/components/TreatmentPlanBuilder.tsx` | Move to `features/treatment/components/` |
| TreatmentPlanDetails | `src/components/TreatmentPlan/TreatmentPlanDetails.tsx` | Move to `features/treatment/components/` |
| ProcedureDialog | `src/components/TreatmentPlan/ProcedureDialog.tsx` | Move to `features/treatment/components/` |
| ConsentDialog | `src/components/TreatmentPlan/ConsentDialog.tsx` | Move to `features/treatment/components/` |

#### Patient Feature (To Create: `src/features/patient/`)

| Component | Current Location | Recommendation |
|-----------|-----------------|----------------|
| PatientChart | `src/components/patient/PatientChart.tsx` | Move to `features/patient/components/` |
| Profile | `src/components/patient/Profile.tsx` | Move to `features/patient/components/` |
| MedicalHistoryForm | `src/components/patient/MedicalHistoryForm.tsx` | Move to `features/patient/components/` |
| Patient | `src/components/patients/Patient.tsx` | Move to `features/patient/components/` |

### Duplicate Components to Consolidate

These components exist in multiple places and should be consolidated:

| Component | Locations | Recommendation |
|-----------|-----------|----------------|
| PrescriptionForm | `src/components/PrescriptionForm.tsx` and `src/components/prescriptions/PrescriptionForm.tsx` | Consolidate to `src/features/prescriptions/components/` |
| AppointmentForm | `src/components/AppointmentForm.tsx` and `src/components/appointments/AppointmentForm.tsx` | Consolidate to `src/features/appointments/components/` |
| TreatmentSuggestions | `src/components/ai/TreatmentSuggestions.tsx` and `src/components/treatment/TreatmentSuggestions.tsx` | Consolidate to `src/features/ai/components/` |

## Shared Hooks Analysis

| Hook | Current Location | Used By | Recommendation |
|------|-----------------|---------|----------------|
| usePerioVoiceCommands | `src/hooks/usePerioVoiceCommands.ts` | Perio charting | Move to `features/dental/hooks/` |
| useAIDiagnosis | `src/hooks/useAIDiagnosis.ts` | AI components | Move to `features/ai/hooks/` |
| useTreatmentPlan | `src/hooks/useTreatmentPlan.ts` | Treatment planning | Move to `features/treatment/hooks/` |
| usePatient | `src/hooks/usePatient.ts` | Patient components | Move to `features/patient/hooks/` |
| useChat | `src/hooks/useChat.ts` | Chat components | Keep as shared |
| useWebSocket | `src/hooks/useWebSocket.ts` | Multiple features | Keep as shared |

## Services Analysis

| Service | Current Location | Used By | Recommendation |
|---------|-----------------|---------|----------------|
| aiDiagnosticsService | `src/services/aiDiagnosticsService.ts` | AI components | **Moved** to `features/ai/services/` |
| aiFeedbackService | `src/services/aiFeedbackService.ts` | AI components | **Moved** to `features/ai/services/` |
| prescriptionService | `src/services/prescriptionService.ts` | Prescription components | Move to `features/prescriptions/services/` |
| treatmentService | `src/services/treatmentService.ts` | Treatment components | Move to `features/treatment/services/` |
| patientService | `src/services/patientService.ts` | Patient components | Move to `features/patient/services/` |
| authService | `src/services/authService.ts` | Authentication | Keep as shared |
| apiService | `src/services/apiService.ts` | All API calls | Keep as shared |

## Import Path Standardization

Current import patterns show inconsistency:

```tsx
// Different styles in use:
import { Button } from '../components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { usePatient } from '../hooks/usePatient';
import { useAI } from '../../contexts/AIContext';
```

Recommended standardization:

```tsx
// For shared components:
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';

// For feature-specific components:
import { PerioChart } from '@/features/dental/components/PerioChart';
import { useAIDiagnosis } from '@/features/ai/hooks/useAIDiagnosis';
import { treatmentService } from '@/features/treatment/services/treatmentService';
```

## Next Steps

1. Create any missing feature directories using the structure outlined in this audit
2. Move components to their new locations according to the recommendations
3. Update import paths throughout the codebase
4. Add feature-specific README files to document component usage
5. Run full test suite to verify everything still works as expected

## Component Visualization

```
frontend/src/
├── components/           # Shared components
│   ├── ui/               # Design system components
│   ├── Layout.tsx        # App layout shell
│   └── ...
├── features/             # Feature modules
│   ├── ai/               # AI feature
│   │   ├── components/   # AI-specific components
│   │   ├── hooks/        # AI-specific hooks
│   │   └── services/     # AI-specific services
│   ├── dental/           # Dental charting feature
│   ├── patientIntake/    # Patient intake feature
│   ├── treatment/        # Treatment planning feature
│   ├── xray/             # XRay feature
│   └── patient/          # Patient management feature
├── contexts/             # Shared contexts
├── hooks/                # Shared hooks
├── services/             # Shared services
├── pages/                # Page components
└── utils/                # Utility functions
``` 