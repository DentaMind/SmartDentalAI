# Patient Intake Features

This directory contains all functionality related to patient intake forms.

## Structure

- `/components`: UI components for intake forms
- `/services`: Services for saving and retrieving intake data
- `/hooks`: Custom React hooks for intake form functionality

## Integration with AI

The patient intake system integrates with AI through the `intakeAIService` to provide:

1. Auto-completion suggestions
2. Form field pre-filling
3. Medical history recommendations

Always use the AI service through the provided hooks for consistent behavior.
