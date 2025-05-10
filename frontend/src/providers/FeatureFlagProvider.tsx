import React, { createContext, useEffect, useState, useCallback } from 'react';
import { fetchFeatureFlags } from '../api/featureFlags';

interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string;
  user_groups: string[];
  percentage_rollout?: number;
  enterprise_only: boolean;
  killswitch_enabled: boolean;
  alert_on_error: boolean;
  metadata: Record<string, any>;
}

interface FeatureFlagContextType {
  isFeatureEnabled: (flagKey: string) => boolean;
  flags: FeatureFlag[];
  refreshFlags: () => Promise<void>;
  loading: boolean;
  error: Error | null;
}

export const FeatureFlagContext = createContext<FeatureFlagContextType | null>(null);

interface FeatureFlagProviderProps {
  children: React.ReactNode;
  refreshInterval?: number; // milliseconds
}

export const FeatureFlagProvider: React.FC<FeatureFlagProviderProps> = ({
  children,
  refreshInterval = 30000 // Default to 30 seconds
}) => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchFlags = useCallback(async () => {
    try {
      const response = await fetchFeatureFlags();
      setFlags(response);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch feature flags'));
      // Keep existing flags on error
      console.error('Failed to fetch feature flags:', err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  const refreshFlags = useCallback(async () => {
    setLoading(true);
    await fetchFlags();
  }, [fetchFlags]);
  
  useEffect(() => {
    fetchFlags();
    
    // Set up periodic refresh
    if (refreshInterval > 0) {
      const interval = setInterval(fetchFlags, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchFlags, refreshInterval]);
  
  const isFeatureEnabled = useCallback((flagKey: string): boolean => {
    const flag = flags.find(f => f.key === flagKey);
    return flag?.enabled ?? false;
  }, [flags]);
  
  const value = {
    isFeatureEnabled,
    flags,
    refreshFlags,
    loading,
    error
  };
  
  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  );
}; 