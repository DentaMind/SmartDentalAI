import { useState, useCallback, useEffect } from 'react';

export type AppView = 'splash' | 'login' | 'dashboard' | 'ai';

interface UseAppTransitionsProps {
  initialView?: AppView;
  transitionDuration?: number;
  onTransitionComplete?: (view: AppView) => void;
}

interface TransitionState {
  currentView: AppView;
  isAnimating: boolean;
  previousView: AppView | null;
}

export const useAppTransitions = ({
  initialView = 'splash',
  transitionDuration = 700,
  onTransitionComplete
}: UseAppTransitionsProps = {}) => {
  const [state, setState] = useState<TransitionState>({
    currentView: initialView,
    isAnimating: false,
    previousView: null
  });

  const [transitionQueue, setTransitionQueue] = useState<AppView[]>([]);

  const transition = useCallback((to: AppView) => {
    setTransitionQueue(prev => [...prev, to]);
  }, []);

  useEffect(() => {
    if (transitionQueue.length > 0 && !state.isAnimating) {
      const nextView = transitionQueue[0];
      
      setState(prev => ({
        currentView: nextView,
        isAnimating: true,
        previousView: prev.currentView
      }));

      setTransitionQueue(prev => prev.slice(1));

      const timer = setTimeout(() => {
        setState(prev => ({
          ...prev,
          isAnimating: false
        }));
        onTransitionComplete?.(nextView);
      }, transitionDuration);

      return () => clearTimeout(timer);
    }
  }, [transitionQueue, state.isAnimating, transitionDuration, onTransitionComplete]);

  const skipTransitions = useCallback(() => {
    const finalView = transitionQueue[transitionQueue.length - 1] || state.currentView;
    setTransitionQueue([]);
    setState({
      currentView: finalView,
      isAnimating: false,
      previousView: null
    });
    onTransitionComplete?.(finalView);
  }, [transitionQueue, state.currentView, onTransitionComplete]);

  // Skip transitions in development mode for faster feedback
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && initialView === 'splash') {
      const timer = setTimeout(() => {
        skipTransitions();
      }, 1000); // Show splash briefly in dev mode
      return () => clearTimeout(timer);
    }
  }, [initialView, skipTransitions]);

  return {
    currentView: state.currentView,
    isAnimating: state.isAnimating,
    previousView: state.previousView,
    transition,
    skipTransitions
  };
}; 