# DentaMind Architecture

This document provides an overview of the DentaMind platform architecture, explaining how the various components work together to provide a comprehensive dental practice management system.

## System Overview

DentaMind is built using a microservices architecture, with separate services handling different aspects of the application:

1. **Authentication Service** - Handles user login, JWT token management, and session validation
2. **Patient Service** - Manages patient records, appointments, and treatment plans
3. **Imaging Service** - Processes dental images (FMX, panoramic, CBCT) and provides AI-driven diagnoses
4. **Legacy API** - Provides backward compatibility for older components

The frontend is a React/TypeScript application that communicates with these services.

## Backend Services

### Authentication Service (`auth_server.py`)

- **Port**: 8085
- **Responsibility**: User authentication, JWT token generation and validation
- **Key Endpoints**:
  - `/login` - Authenticates users and issues tokens
  - `/me` - Returns current user information
  - `/verify` - Validates token validity

### Patient Service (`patient_server.py`)

- **Port**: 8086
- **Responsibility**: Patient data management
- **Key Endpoints**:
  - `/patients` - List and create patients
  - `/patients/{id}` - Get specific patient details
  - `/patients/{id}/appointments` - Get patient appointments
  - `/patients/{id}/treatment-plans` - Get patient treatment plans

### Imaging Service (`imaging_server.py`)

- **Port**: 8087
- **Responsibility**: Dental imaging processing and analysis
- **Key Endpoints**:
  - `/upload` - General image upload endpoint
  - `/fmx/upload` - FMX specific upload endpoint
  - `/panoramic/upload` - Panoramic specific upload endpoint
  - `/cbct/upload` - CBCT specific upload endpoint
  - `/diagnoses/image/{id}` - Get diagnosis for an image
  - `/diagnoses/patient/{id}` - Get all diagnoses for a patient

### Legacy API (`debug_routes.py`)

- **Port**: 8090
- **Responsibility**: Backward compatibility for older components
- **Key Endpoints**: Various endpoints mirroring the original monolithic API

## Frontend Components

### Authentication

The frontend uses a context-based authentication system with these key components:

- `AuthContext.tsx` - Provides authentication state and methods to all components
- `api.ts` - API client with token management for authenticating requests

### Dashboard

- `integrated-dashboard.tsx` - Main dashboard showing patient, appointment, and imaging data
- `Dashboard.tsx` - Page component that renders the dashboard when authenticated

### Imaging Components

- `EnhancedXrayViewer.tsx` - Displays dental X-rays with AI analysis results
- `XrayUpload.tsx` - Handles uploading and analyzing new X-ray images

### Periodontal Components

- `EnhancedPerioChart.tsx` - Interactive periodontal chart for measurements and diagnosis
- `PerioWidget.tsx` - Summary widget showing periodontal health status

### Financial Components

- `FinancialDashboard.tsx` - Shows patient financial information and insurance claims
- `InsuranceClaimForm.tsx` - Form for creating new insurance claims

## Communication Flow

1. User authenticates via the Authentication Service
2. Frontend stores the JWT token and includes it in all subsequent API requests
3. React components fetch data from the appropriate microservices:
   - Patient data from the Patient Service
   - Imaging data from the Imaging Service
4. Updates follow the same pattern, with components sending data to the appropriate service

## Database Integration

Each service connects to the same PostgreSQL database but operates on separate tables:

- Authentication Service: `users`, `roles`
- Patient Service: `patients`, `appointments`, `treatment_plans`
- Imaging Service: `images`, `image_diagnosis`

## Deployment

The platform is designed for both development and production environments:

- **Development**: Each service runs independently using the `start_dentamind.sh` script
- **Production**: Services can be containerized using Docker and orchestrated with Docker Compose or Kubernetes

## Security Considerations

- JWT tokens with short expiration times (30 minutes)
- CORS configured to accept requests only from trusted origins
- Passwords never stored in plain text
- Patient data handled according to HIPAA regulations

## Future Expansion

The microservices architecture makes it easy to add new services:

1. Create a new service file (e.g., `scheduling_server.py`)
2. Assign it a unique port
3. Update the startup scripts
4. Add client code to interact with the new service

## Troubleshooting

If a service isn't responding:

1. Check the logs in the `logs/` directory
2. Verify the service is running using `ps aux | grep uvicorn`
3. Test the endpoint directly using `curl` or Postman
4. Check for port conflicts using `lsof -i :<port_number>`

## Getting Started

To start all services:

```bash
./start_dentamind.sh
```

To stop all services:

```bash
./stop_dentamind.sh
``` 