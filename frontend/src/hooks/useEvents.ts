import { useAuth } from './useAuth';
import { eventQueue } from '@/lib/eventQueue';

export interface EventMetadata {
  source: string;
  userId?: string;
  sessionId?: string;
  deviceInfo?: string;
  [key: string]: any;
}

export const useEvents = () => {
  const { user, sessionId } = useAuth();

  const collectEvent = async (
    type: string,
    payload: any,
    metadata: Partial<EventMetadata> = {}
  ) => {
    // Enrich metadata with user and session info
    const enrichedMetadata = {
      ...metadata,
      userId: user?.id,
      sessionId,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    };

    // Queue the event for batched sending
    await eventQueue.enqueue(type, payload, enrichedMetadata);
  };

  return {
    collectEvent,
    queueLength: eventQueue.getQueueLength(),
    queuedEvents: eventQueue.getQueuedEvents(),
    clearQueue: eventQueue.clearQueue
  };
};

// Re-export event queue types
export type { QueuedEvent } from '@/lib/eventQueue'; 