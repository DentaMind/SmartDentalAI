import { useState, useCallback, useEffect } from 'react';
import API, { TypedAPI } from '../lib/api';
import { isAPIClient } from '../types/api-types';

/**
 * @deprecated Use the API client directly (import API from '../lib/api').
 * This hook adds unnecessary complexity and has been a source of bugs.
 * If you need React Query features, use React Query's useQuery instead.
 */
interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: (...args: any[]) => Promise<T>;
}

// Export the API instance so it can be imported in other files
export const apiInstance = API;

/**
 * @deprecated Use the API client directly (import API from '../lib/api').
 * This hook adds unnecessary complexity and has been a source of bugs.
 * If you need React Query features, use React Query's useQuery instead.
 */
export function useApi<T>(
  apiMethod: (...args: any[]) => Promise<T>,
  immediate = false,
  ...args: any[]
): UseApiReturn<T> {
  // Console warning for deprecated hook
  console.warn(
    'useApi hook is deprecated. ' +
    'Use the API client directly (import API from "../lib/api") ' +
    'or React Query\'s useQuery for better performance and caching.'
  );

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(immediate);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (...executeArgs: any[]): Promise<T> => {
      try {
        setLoading(true);
        setError(null);
        const argsToUse = executeArgs.length > 0 ? executeArgs : args;
        const result = await apiMethod(...argsToUse);
        setData(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [apiMethod, ...args]
  );

  // Execute immediately if requested
  useEffect(() => {
    if (immediate) {
      execute(...args);
    }
  }, [immediate, execute]);

  return { data, loading, error, execute };
}

/**
 * Type guard to check if the API is being used correctly
 * @param obj The object to check
 */
export function ensureValidApiClient(obj: any): void {
  if (!isAPIClient(obj)) {
    throw new Error(
      'Invalid API client. Import the API client directly using: ' +
      'import API from "../lib/api"'
    );
  }
}

export default useApi; 