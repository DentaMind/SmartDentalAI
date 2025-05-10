import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

// This configures a Service Worker with the given request handlers.
export const worker = setupWorker(...handlers) 

// Export a function to start the MSW worker that's called from main.tsx
export const startMockServer = async () => {
  return await worker.start({
    onUnhandledRequest: 'bypass', // Don't warn about unhandled requests
  });
} 