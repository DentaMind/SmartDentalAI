/**
 * AI Request Queue Manager
 * 
 * This service implements request prioritization, batching, and queuing
 * to optimize API usage and prevent rate limiting errors.
 */

import { AIServiceType, SERVICE_TYPE_PRIORITY } from './ai-service-types';

// Request queue item interface
interface QueueItem {
  id: string;
  serviceType: AIServiceType;
  priority: number;
  createdAt: number;
  request: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timeoutId?: NodeJS.Timeout;
}

class AIRequestQueue {
  private queue: QueueItem[] = [];
  private processing = false;
  private batchSize = 3; // Process multiple requests in parallel
  private maxQueueSize = 100; // Maximum queue size to prevent memory issues
  private defaultTimeout = 30000; // 30 seconds timeout for requests
  
  /**
   * Add a request to the queue with appropriate priority based on service type
   */
  async enqueueRequest<T>(
    serviceType: AIServiceType, 
    requestFn: () => Promise<T>, 
    options: { 
      timeout?: number,
      priority?: number 
    } = {}
  ): Promise<T> {
    // Generate a unique ID for this request
    const id = `${serviceType}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Check if queue is full
    if (this.queue.length >= this.maxQueueSize) {
      throw new Error('AI request queue is full. Please try again later.');
    }
    
    return new Promise<T>((resolve, reject) => {
      // Get base priority from service type
      const basePriority = SERVICE_TYPE_PRIORITY[serviceType] || 5;
      
      // Create the queue item
      const queueItem: QueueItem = {
        id,
        serviceType,
        priority: options.priority || basePriority,
        createdAt: Date.now(),
        request: requestFn,
        resolve,
        reject
      };
      
      // Add timeout if specified
      if (options.timeout || this.defaultTimeout) {
        queueItem.timeoutId = setTimeout(() => {
          // Remove from queue if still there
          this.removeFromQueue(id);
          reject(new Error(`Request timed out after ${options.timeout || this.defaultTimeout}ms`));
        }, options.timeout || this.defaultTimeout);
      }
      
      // Add to queue and sort by priority
      this.queue.push(queueItem);
      this.sortQueue();
      
      // Start processing if not already
      if (!this.processing) {
        this.processQueue();
      }
    });
  }
  
  /**
   * Remove a request from the queue by ID
   */
  private removeFromQueue(id: string): boolean {
    const initialLength = this.queue.length;
    this.queue = this.queue.filter(item => {
      if (item.id === id) {
        // Clear any timeout
        if (item.timeoutId) {
          clearTimeout(item.timeoutId);
        }
        return false;
      }
      return true;
    });
    return this.queue.length < initialLength;
  }
  
  /**
   * Sort the queue by priority (higher number = higher priority)
   * For equal priorities, sort by creation time (older first)
   */
  private sortQueue(): void {
    this.queue.sort((a, b) => {
      // First by priority (descending)
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      // Then by age (ascending - older first)
      return a.createdAt - b.createdAt;
    });
  }
  
  /**
   * Process requests in the queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }
    
    this.processing = true;
    
    try {
      // Take up to batchSize items from queue
      const batch = this.queue.slice(0, this.batchSize);
      
      // Remove these items from the queue
      this.queue = this.queue.slice(this.batchSize);
      
      // Process all items in parallel
      await Promise.all(batch.map(async item => {
        try {
          // Clear timeout if set
          if (item.timeoutId) {
            clearTimeout(item.timeoutId);
          }
          
          // Execute the request
          const result = await item.request();
          
          // Resolve the promise
          item.resolve(result);
        } catch (error) {
          // Reject the promise on error
          item.reject(error);
        }
      }));
      
      // If there are more items, continue processing
      if (this.queue.length > 0) {
        this.processQueue();
      } else {
        this.processing = false;
      }
    } catch (error) {
      console.error('Error processing AI request queue:', error);
      this.processing = false;
      
      // Continue processing other items if there's an error
      if (this.queue.length > 0) {
        this.processQueue();
      }
    }
  }
  
  /**
   * Get current queue status for monitoring
   */
  getQueueStatus() {
    const serviceTypeCounts: Record<string, number> = {};
    
    // Count items by service type
    this.queue.forEach(item => {
      const serviceType = item.serviceType;
      serviceTypeCounts[serviceType] = (serviceTypeCounts[serviceType] || 0) + 1;
    });
    
    return {
      queueLength: this.queue.length,
      processingActive: this.processing,
      serviceTypeCounts,
      oldestRequestAge: this.queue.length > 0 
        ? Date.now() - Math.min(...this.queue.map(item => item.createdAt))
        : 0
    };
  }
  
  /**
   * Change batch size for queue processing
   */
  setBatchSize(size: number) {
    if (size < 1) {
      throw new Error('Batch size must be at least 1');
    }
    this.batchSize = size;
  }
  
  /**
   * Set the default timeout for requests
   */
  setDefaultTimeout(timeoutMs: number) {
    this.defaultTimeout = timeoutMs;
  }
}

// Export a singleton instance
export const aiRequestQueue = new AIRequestQueue();