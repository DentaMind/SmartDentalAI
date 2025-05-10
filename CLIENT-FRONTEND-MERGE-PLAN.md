# Client and Frontend Merge Plan

This document outlines the strategy and steps for merging the `client/` and `frontend/` directories to complete the frontend consolidation.

## Background

Currently, DentaMind has two primary frontend codebases:
- `frontend/` - The newly reorganized React/TypeScript codebase with feature-based organization
- `client/` - Legacy frontend code with some unique components

The goal is to consolidate these into a single frontend codebase under `frontend/` to eliminate duplication, reduce maintenance burden, and provide a clear single source of truth.

## Analysis

Before proceeding with the merge, a thorough analysis should be performed:

### 1. Unique Component Identification
| Component Type | Current Location | Status |
|---------------|-----------------|--------|
| Dental Charting | `client/src/components/charting/` | Partially migrated |
| Patient Intake | `client/src/components/intake/` | Migrated |
| Voice Commands | `client/src/hooks/usePerioVoiceCommands.ts` | Migrated |
| UI Components | `client/src/components/ui/` | Not migrated |
| XRay Viewers | `client/src/components/xray/` | Not migrated |

### 2. Dependency Analysis
- `client/` uses largely the same dependencies as `frontend/`
- Notable package differences: [analyze with `npm-diff` or similar]
- Configuration differences: [analyze build configs]

## Migration Strategy

The migration will follow a phased approach to minimize disruption:

### Phase 1: Setup and Preparation (Week 1)

1. Create feature directories for all remaining major features in `frontend/src/features/`:
   ```
   mkdir -p frontend/src/features/dental
   mkdir -p frontend/src/features/xray
   mkdir -p frontend/src/features/treatment
   ```

2. Update the build configuration to handle merged assets:
   - Update import paths in TypeScript config
   - Ensure build scripts handle the consolidated structure
   - Verify that tests can run on the merged codebase

3. Set up feature flags to allow gradual migration:
   ```typescript
   // In frontend/src/config/featureFlags.ts
   export const FEATURES = {
     USE_NEW_DENTAL_CHART: process.env.USE_NEW_DENTAL_CHART === 'true',
     USE_NEW_XRAY_VIEWER: process.env.USE_NEW_XRAY_VIEWER === 'true',
   }
   ```

### Phase 2: Component Migration (Weeks 2-3)

For each set of components, follow these steps:

1. **Identify and Assess**:
   - Is the component used in production?
   - What dependencies does it have?
   - Are there tests covering its functionality?

2. **Migrate**:
   - Copy the component to the appropriate feature directory
   - Update imports within the component
   - Add/update tests to verify functionality

3. **Test**:
   - Run component tests
   - Manually test the component in development
   - If possible, run Cypress tests that exercise the component

4. **Deploy**:
   - Deploy the updated code with feature flags OFF
   - Verify production still works with old components
   - Turn feature flags ON for testing environments

#### Migration Order

Migrate in this priority order to minimize risk:

1. Simple UI components (`client/src/components/ui/`)
2. XRay viewers (`client/src/components/xray/`)
3. Dental charting components (`client/src/components/charting/`)
4. Complex interactive components and forms

### Phase 3: Integration and Verification (Week 4)

1. With all components migrated, run full test suite:
   ```bash
   cd frontend
   npm run test:all
   npx cypress run
   ```

2. Update all import paths in the codebase:
   - Create a script to automate import updates
   - Use [codeshift](https://github.com/facebook/jscodeshift) if needed for complex transformations

3. Enable feature flags in a staging environment:
   ```
   USE_NEW_DENTAL_CHART=true
   USE_NEW_XRAY_VIEWER=true
   ```

4. Conduct user acceptance testing to verify all functionality works as expected

### Phase 4: Cutover and Cleanup (Week 5)

1. Enable all feature flags in production:
   ```
   USE_NEW_DENTAL_CHART=true
   USE_NEW_XRAY_VIEWER=true
   ```

2. Monitor for any issues or bugs

3. Once stable, remove feature flags and old code:
   - Remove the flag conditionals
   - Delete the `client/` directory after backing it up
   - Update all imports to point directly to new components

4. Update documentation to reflect the new structure

## Backup Strategy

Before deleting any code:

1. Create a full repository backup:
   ```bash
   mkdir -p .backup/client-frontend-merge-$(date +"%Y%m%d")
   cp -R client .backup/client-frontend-merge-$(date +"%Y%m%d")/
   ```

2. Ensure the backup is included in the next Git commit

## Rollback Plan

If issues arise during the migration:

1. Revert feature flags to use original components
2. For emergency rollbacks, revert the PR that removed client code
3. In extreme cases, restore the entire codebase from backup

## Testing Throughout Migration

1. Run unit tests on each migrated component
2. Run Cypress tests regularly to verify application flows
3. Conduct manual testing focused on:
   - Dental chart interactions
   - XRay viewer functionality
   - Treatment planning workflows
   - Patient intake forms

## Communication Plan

1. Send weekly updates to the development team
2. Document progress in the project management tool
3. Hold daily standup meetings during the migration period
4. Create a Slack channel for rapid issue resolution

## Success Criteria

The migration will be considered successful when:

1. All unique functionality from `client/` is available in `frontend/`
2. The application passes all automated tests
3. The `client/` directory has been removed
4. Documentation has been updated to reflect the new structure
5. No regressions are reported after 1 week in production 