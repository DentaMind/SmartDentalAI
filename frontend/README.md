# DentaMind Frontend

Modern, AI-enhanced frontend for the DentaMind dental practice management system.

## Structure Overview

After the May 2025 cleanup, the frontend codebase has been reorganized for better maintainability and consistency.

### Key Directories

- `src/` - Main source code
  - `features/` - Feature-based organization for major functionality
    - `ai/` - All AI-related functionality (consolidated)
    - `patientIntake/` - Patient intake form functionality
  - `components/` - Shared UI components
  - `contexts/` - React context providers, including AIContext
  - `hooks/` - Custom React hooks
  - `services/` - API services and external integrations
  - `pages/` - Page components for routing
  - `types/` - TypeScript type definitions
  - `utils/` - Utility functions

### Features-Based Organization

We've adopted a feature-based organization for major system capabilities. Each feature directory contains:

- `components/` - UI components specific to the feature
- `hooks/` - Custom hooks for the feature
- `services/` - Services specific to the feature
- `types/` - TypeScript types for the feature
- `README.md` - Documentation specific to the feature

### AI Integration

AI functionality has been consolidated in `src/features/ai/`, with the following structure:

- `components/` - AI-specific UI components
- `services/` - AI-related services for diagnosis, treatment plans, etc.
- `hooks/` - AI-specific hooks

Global AI state is managed through the `AIContext` provider in `src/contexts/AIContext.tsx`.

## Development

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
cd frontend
npm install
```

### Running the Development Server

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

### Testing

#### Running Cypress Tests

```bash
npx cypress open
```

or for headless testing:

```bash
npx cypress run
```

## Integration with Backend

The frontend connects to the backend API running on `localhost:8000` by default. This can be configured in the environment variables.

## Styling

We use a combination of:

- TailwindCSS for utility-first styling
- Component-specific CSS where appropriate

## TypeScript

This project uses TypeScript for type safety. Please ensure all new components and functions have proper type definitions. 