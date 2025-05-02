# DentaMind Patient Intake + Medical History Module

This module handles comprehensive patient registration, medical history management, and related functionalities for the DentaMind dental practice management platform.

## Features

- **Patient Registration**: Capture comprehensive patient information including demographics and contact details
- **Medical History Management**: Track medical conditions, allergies, and medications
- **ASA Classification**: Automatically determine patient ASA classification for procedural risk assessment
- **Allergy Tracking**: Record allergies with type, reaction, and severity
- **Medication Management**: Track current medications with dosage and frequency
- **Medical Alerts**: Generate dental-relevant medical alerts based on patient health information
- **Real-time Medication-Allergy Checking**: Warn providers about potential medication allergies

## Component Overview

### Backend Components

1. **Models**:
   - `Patient`: Core patient information
   - `MedicalHistory`: Medical conditions and status
   - `MedicalCondition`: Specific medical conditions with dental considerations
   - `Allergy`: Patient allergies with type and reaction
   - `Medication`: Patient medications with dental considerations
   - `MedicalHistoryStatus`: Current status including ASA classification

2. **Services**:
   - `PatientIntakeService`: Business logic for patient intake and medical data management

3. **API Endpoints**:
   - `/api/patient-intake/register`: Register new patients
   - `/api/patient-intake/patient/{patient_id}/medical-profile`: Get comprehensive medical profile
   - `/api/patient-intake/patient/{patient_id}/medical-history`: Update medical history
   - `/api/patient-intake/patient/{patient_id}/allergies`: Add patient allergies
   - `/api/patient-intake/patient/{patient_id}/medications`: Add patient medications
   - `/api/patient-intake/patient/{patient_id}/alerts`: Get patient medical alerts
   - `/api/patient-intake/check-medication-allergies`: Check for medication allergies

### Frontend Components

1. **Components**:
   - `MedicalHistoryForm`: Dynamic form to capture all medical history data
   - `MedicalHistoryPage`: Page with tabs for form, summary, and alerts

2. **Hooks**:
   - `useMedicalHistory`: React hook to manage medical history data and API calls

3. **API Client**:
   - `patientIntakeApi.ts`: Functions to interact with the backend API

## Getting Started

### Running the Backend

1. Initialize the database and start the server:

   ```bash
   python run_backend.py
   ```

   This will:
   - Create the necessary database tables
   - Insert sample data for testing
   - Start the FastAPI server at http://localhost:8000

2. Test the API endpoints in a browser at http://localhost:8000/docs

### Running the Frontend

1. Start the frontend development server:

   ```bash
   node run_frontend.js
   ```

   This will start the React development server at http://localhost:3000

2. Navigate to the Medical History page at http://localhost:3000/patients/[patient-id]/medical-history

## Testing

Run backend tests with:

```bash
cd backend
python -m pytest tests/api/test_patient_intake.py -v
```

## Implementation Details

### Data Flow

1. Patient data is collected through the `MedicalHistoryForm`
2. Form submissions are processed by the `useMedicalHistory` hook
3. The hook makes API calls to the backend endpoints
4. Backend validation is handled by Pydantic schemas
5. The `PatientIntakeService` performs business logic operations
6. Data is stored in the PostgreSQL database via SQLAlchemy models
7. Medical alerts are generated based on conditions, medications, and allergies

### ASA Classification

The system automatically determines ASA classification based on:
- Presence of systemic diseases
- Severity of medical conditions
- Number of medications
- Control status of conditions

## Dental-Specific Features

1. **Dental Considerations**: Both medical conditions and medications can have dental-specific considerations
2. **Medical Alerts**: Generated alerts are specifically relevant to dental treatment
3. **Medication Interactions**: Special focus on medications that impact dental care (anticoagulants, bisphosphonates)
4. **Dental Allergens**: Special handling for allergies to common dental medications (lidocaine, epinephrine)

## License

This module is part of the DentaMind platform and is subject to the same licensing as the overall project. 