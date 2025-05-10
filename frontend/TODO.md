# Frontend Cleanup TODOs

This file tracks remaining cleanup tasks and improvements to be made to the DentaMind frontend after the initial May 2025 cleanup.

## High Priority

- [ ] Complete migration of remaining AI components:
  - [ ] `src/components/dental/AIAssistDiagnosis.tsx`
  - [ ] `src/components/xray/XRayAIAnalyzer.tsx`
  - [ ] `src/components/treatments/AITreatmentComparison.tsx`

- [ ] Fix remaining TypeScript errors:
  - [ ] Resolve component prop type issues in `src/components/dental/Tooth3D.tsx`
  - [ ] Fix type issues in `src/components/WebSocketAnalyticsDashboard.tsx`
  - [ ] Resolve any other TypeScript errors revealed by the build process

- [ ] Migrate patient-related components to feature structure:
  - [ ] Create `src/features/patient/` structure
  - [ ] Move patient components from `src/components/patient/` to the feature directory
  - [ ] Update imports across the codebase

## Medium Priority

- [ ] Expand test coverage:
  - [ ] Add Cypress tests for treatment planning flow
  - [ ] Add tests for the perio charting functionality
  - [ ] Add unit tests for key utility functions

- [ ] Improve performance:
  - [ ] Analyze and reduce bundle size with tools like `webpack-bundle-analyzer`
  - [ ] Implement code splitting for large components
  - [ ] Optimize large component renders with React.memo or useMemo

- [ ] Update styling:
  - [ ] Complete conversion to Tailwind CSS
  - [ ] Remove unused CSS files
  - [ ] Create a consistent theming system

## Low Priority

- [ ] Documentation improvements:
  - [ ] Add JSDoc comments to utility functions
  - [ ] Improve inline code documentation
  - [ ] Create API documentation for frontend services

- [ ] Developer experience:
  - [ ] Set up pre-commit hooks for linting and formatting
  - [ ] Improve development environment setup documentation
  - [ ] Create component templates for easier scaffolding

## Future Enhancements

- [ ] Implement feature flags system for gradual rollout
- [ ] Add accessibility improvements (ARIA attributes, keyboard navigation)
- [ ] Set up comprehensive performance monitoring
- [ ] Create a component library/design system
- [ ] Implement logging and error tracking integration 