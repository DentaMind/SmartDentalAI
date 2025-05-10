import { Module } from './AIEngine';

export interface FeedbackData {
  suggestionId: string;
  accepted: boolean;
  module: Module;
  notes?: string;
  timestamp: number;
  userAction?: string;
}

export const FeedbackLogger = {
  async logSuggestionFeedback(
    suggestionId: string,
    accepted: boolean,
    module: Module,
    notes?: string,
    userAction?: string
  ): Promise<void> {
    const feedback: FeedbackData = {
      suggestionId,
      accepted,
      module,
      notes,
      timestamp: Date.now(),
      userAction
    };

    try {
      // TODO: Replace with actual API call
      console.log('[AI Feedback]', feedback);
      
      // Example API call (commented out until implemented)
      /*
      await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedback)
      });
      */
    } catch (error) {
      console.error('Failed to log AI feedback:', error);
    }
  },

  async logUserAction(
    module: Module,
    action: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      // TODO: Replace with actual API call
      console.log('[User Action]', { module, action, details, timestamp: Date.now() });
    } catch (error) {
      console.error('Failed to log user action:', error);
    }
  },

  async logError(
    module: Module,
    error: Error,
    context?: Record<string, any>
  ): Promise<void> {
    try {
      // TODO: Replace with actual API call
      console.error('[AI Error]', {
        module,
        error: error.message,
        stack: error.stack,
        context,
        timestamp: Date.now()
      });
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
    }
  }
}; 