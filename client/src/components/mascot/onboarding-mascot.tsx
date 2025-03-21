import React, { useState, useEffect } from 'react';
import { MascotCharacter, MascotMessage } from './mascot-character';
import { onboardingService, TourArea, UserRole } from './onboarding-service';

interface OnboardingMascotProps {
  userRole?: UserRole;
  currentArea?: TourArea;
  onTourComplete?: (area: TourArea) => void;
  position?: 'left' | 'right' | 'bottom' | 'top';
  size?: 'sm' | 'md' | 'lg';
  autoStart?: boolean;
  hideWhenInactive?: boolean;
}

export const OnboardingMascot: React.FC<OnboardingMascotProps> = ({
  userRole = 'new',
  currentArea = 'login',
  onTourComplete,
  position = 'right',
  size = 'md',
  autoStart = true,
  hideWhenInactive = false,
}) => {
  const [currentMessage, setCurrentMessage] = useState<MascotMessage | undefined>(undefined);
  const [isVisible, setIsVisible] = useState(true);
  const [isActive, setIsActive] = useState(false);

  // Set up callbacks to handle step changes
  useEffect(() => {
    onboardingService.registerCallbacks({
      onStepChange: (step) => {
        if (step) {
          setCurrentMessage({
            id: step.id,
            text: step.message,
            emotion: step.emotion || 'happy',
            actionLabel: step.actionLabel,
            action: step.action || handleNextStep,
          });
          setIsActive(true);
          
          // Highlight the referenced element if specified
          if (step.element) {
            highlightElement(step.element);
          }
        } else {
          setCurrentMessage(undefined);
          setIsActive(false);
          clearHighlights();
        }
      },
      onComplete: (area) => {
        onTourComplete?.(area);
        setIsActive(false);
        clearHighlights();
      }
    });
  }, [onTourComplete]);

  // Start the tour when the area changes or on component mount (if autoStart is true)
  useEffect(() => {
    if (autoStart && currentArea) {
      startTourForCurrentArea();
    }
  }, [currentArea, userRole, autoStart]);

  // Manage visibility based on active state and configuration
  useEffect(() => {
    setIsVisible(!hideWhenInactive || isActive);
  }, [hideWhenInactive, isActive]);

  const startTourForCurrentArea = () => {
    // Don't start a new tour if we're already in an active tour
    if (isActive) return;
    
    onboardingService.startTour(currentArea, userRole);
    setIsActive(true);
  };

  const handleNextStep = () => {
    onboardingService.nextStep();
  };

  const handleSkipStep = () => {
    onboardingService.skipStep();
  };

  const handleDismiss = () => {
    onboardingService.endTour();
    setCurrentMessage(undefined);
    setIsActive(false);
    clearHighlights();
  };

  const handleMascotInteract = () => {
    // If a tour is not active, start one for this area
    if (!isActive) {
      startTourForCurrentArea();
    }
  };

  // Helper to add highlight effect to elements
  const highlightElement = (selector: string) => {
    clearHighlights(); // Remove any existing highlights
    
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (el instanceof HTMLElement) {
          // Add a pulsing highlight effect
          el.classList.add('mascot-highlight');
          
          // Scroll to the element if it's not in view
          if (!isElementInViewport(el)) {
            el.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
          }
        }
      });
    } catch (e) {
      console.error('Failed to highlight element:', e);
    }
  };

  // Helper to check if an element is in the viewport
  const isElementInViewport = (el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  };

  // Remove all highlights
  const clearHighlights = () => {
    const highlights = document.querySelectorAll('.mascot-highlight');
    highlights.forEach(el => {
      if (el instanceof HTMLElement) {
        el.classList.remove('mascot-highlight');
      }
    });
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Add CSS for highlighted elements */}
      <style>{`
        .mascot-highlight {
          position: relative;
          z-index: 5;
          box-shadow: 0 0 0 4px rgba(40, 199, 111, 0.5);
          animation: pulse-border 2s infinite;
        }
        
        @keyframes pulse-border {
          0% {
            box-shadow: 0 0 0 0 rgba(40, 199, 111, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(40, 199, 111, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(40, 199, 111, 0);
          }
        }
      `}</style>
      
      <MascotCharacter
        position={position}
        initialEmotion="happy"
        name="Denti"
        showMessage={currentMessage}
        size={size}
        onMessageDismiss={handleDismiss}
        onInteract={handleMascotInteract}
      />
    </>
  );
};