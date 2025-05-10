# Contributing to DentaMind

Thank you for your interest in contributing to DentaMind, the AI-powered dental practice management system. This guide will help you understand how to work with our codebase, particularly after the May 2025 frontend cleanup.

## Project Structure

DentaMind follows a modular architecture with a FastAPI backend and a React (TypeScript) frontend:

```
DentaMind/
├── backend/            # FastAPI backend code
├── frontend/           # React TypeScript frontend (newly organized)
├── server/             # Node.js server components
└── shared/             # Shared types and utilities
```

### Frontend Organization

The frontend uses a feature-based organization pattern:

```
frontend/
├── src/
│   ├── features/       # Feature modules (NEW)
│   │   ├── ai/         # AI-related features
│   │   └── patientIntake/ # Patient intake features
│   ├── components/     # Shared components
│   ├── contexts/       # React context providers
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page components
│   ├── services/       # API service layer
│   └── types/          # TypeScript definitions
```

## Development Workflow

### Setting Up Your Environment

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/dentamind.git
   cd dentamind
   ```

2. Install dependencies:
   ```bash
   # Backend dependencies
   cd backend
   pip install -r requirements.txt
   
   # Frontend dependencies
   cd ../frontend
   npm install
   ```

3. Start the development servers:
   ```bash
   # In one terminal, start the backend
   cd backend
   python run_backend.py
   
   # In another terminal, start the frontend
   cd frontend
   npm run dev
   ```

### Adding New Features

When adding new functionality to DentaMind, follow these guidelines:

1. **For major features**:
   - Create a new directory under `frontend/src/features/`
   - Include components, services, hooks, and types specific to the feature
   - Add a README.md explaining the feature's purpose and structure

2. **For new components**:
   - If the component is specific to a feature, place it in that feature's `components/` directory
   - If the component is shared across features, place it in `src/components/`
   - Use TypeScript for all component definitions
   - Include prop type definitions

3. **For new API integrations**:
   - Feature-specific API services go in the feature's `services/` directory
   - Shared API services go in `src/services/`

### Code Style and Linting

- Follow the established TypeScript and React patterns
- Use async/await for asynchronous code
- Prefer functional components with hooks
- Keep components focused on a single responsibility

## Testing

### Writing Tests

- Place Cypress tests in `frontend/cypress/integration/`
- Create component tests for critical functionality
- Test both happy paths and error states

### Running Tests

```bash
# Run Cypress tests in headless mode
cd frontend
npx cypress run

# Open Cypress Test Runner
npx cypress open
```

## Pull Request Process

1. Create a new branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following the contribution guidelines

3. Test your changes thoroughly:
   ```bash
   # Run backend tests
   cd backend
   pytest
   
   # Run frontend tests
   cd frontend
   npx cypress run
   ```

4. Push your branch and create a Pull Request:
   ```bash
   git push -u origin feature/your-feature-name
   ```

5. Ensure the PR description explains:
   - What changes you've made
   - Why you're making the changes
   - Any considerations for reviewers

## Clinical Considerations

DentaMind is used in dental practices with real patient data. Always:

- Maintain HIPAA compliance in all code changes
- Use clinically accurate terminology
- Never store or log patient identifiable information
- Ensure all code handling patient data is properly reviewed
- Consider security implications of any changes

## Further Help

If you need assistance:
- Check the documentation in the `docs/` directory
- Review the READMEs in feature directories
- Reach out to the maintainers

Thank you for contributing to DentaMind! 