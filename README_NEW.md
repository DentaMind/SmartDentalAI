# DentaMind Frontend

A modern, AI-powered dental practice management system that helps dental professionals streamline their workflow, improve patient care, and increase efficiency.

## Features

- **AI-Assisted Diagnosis**: Upload X-rays and intraoral photos for automated analysis and treatment suggestions
- **Patient Management**: Comprehensive patient profiles with medical history, treatment records, and communication preferences
- **Treatment Planning**: Multi-visit treatment plans with procedures, cost estimates, and insurance coverage
- **Periodontal Charting**: Digital periodontal charts with recording capabilities (integration with purchased UI)
- **Restorative Charting**: Digital odontogram with treatment status tracking
- **Appointment Scheduling**: Calendar view with patient booking and reminders
- **Billing & Insurance**: Insurance verification and patient billing
- **Analytics**: Practice performance and patient health metrics

## Tech Stack

- **Frontend**: React, React Router, Bootstrap
- **State Management**: React Context API, React Query
- **API Communication**: Axios
- **Authentication**: JWT
- **Styling**: CSS/SCSS, Bootstrap

## Getting Started

### Prerequisites

- Node.js v16 or higher
- npm v8 or higher
- Backend API running (see [DentaMind Backend](https://github.com/dentalmind/api))

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/dentalmind/frontend.git
   cd frontend
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env.local` file with your configuration
   ```
   REACT_APP_API_URL=http://localhost:8000
   REACT_APP_SOCKET_URL=ws://localhost:8000/ws
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) to view it in the browser

## Project Structure

```
src/
├── assets/         # Static assets (images, fonts, etc.)
├── components/     # Reusable UI components
├── contexts/       # React context providers
├── hooks/          # Custom React hooks
├── pages/          # Application pages
│   ├── AI/         # AI diagnostic pages
│   ├── ClinicalNotes/ # Clinical notes management
│   ├── PerioChart/ # Periodontal charting
│   ├── RestorativeChart/ # Restorative charting
│   ├── TreatmentPlans/ # Treatment planning
│   └── XRayViewer/ # X-ray viewing and management
├── services/       # API services
└── utils/          # Utility functions
```

## Integration with Purchased Periodontal UI

The periodontal charting module is designed to work with a purchased UI component. The integration is handled via the `PerioChart` component which serves as a wrapper around the purchased UI. See `src/pages/PerioChart/PerioChart.js` for implementation details.

## License

This project is proprietary and confidential. All rights reserved. 