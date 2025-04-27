import { useContext } from 'react';
import { FeatureFlagContext } from '../providers/FeatureFlagProvider';

export function useFeatureFlag(flagKey: string): boolean {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlag must be used within a FeatureFlagProvider');
  }
  return context.isFeatureEnabled(flagKey);
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }
  return context;
} 