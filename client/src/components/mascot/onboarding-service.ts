import { MascotMessage } from './mascot-character';

// Define the different types of user roles for targeted onboarding
export type UserRole = 'new' | 'patient' | 'doctor' | 'staff' | 'admin';

// Define tour steps for different parts of the application
export type TourArea = 'login' | 'dashboard' | 'patient-profile' | 'appointments' | 'xrays' | 'perio-chart';

// Define a step in the onboarding tour
export interface OnboardingStep {
  id: string;
  message: string;
  emotion?: 'happy' | 'excited' | 'thinking' | 'explaining' | 'greeting';
  actionLabel?: string;
  action?: () => void;
  element?: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right';
  nextId?: string; // ID of the next step to show
  skipable?: boolean;
  area: TourArea;
  roles: UserRole[]; // Which user roles should see this step
}

// Store tour progress in localStorage
const STORAGE_KEY = 'dentamind_onboarding_progress';

class OnboardingService {
  private steps: OnboardingStep[] = [];
  private currentStepId: string | null = null;
  private callbacks: {
    onStepChange?: (step: OnboardingStep | null) => void;
    onComplete?: (area: TourArea) => void;
  } = {};

  constructor() {
    this.loadProgress();
  }

  // Initialize the tour steps
  initializeSteps(steps: OnboardingStep[]) {
    this.steps = steps;
    return this;
  }

  // Register callback functions
  registerCallbacks(callbacks: {
    onStepChange?: (step: OnboardingStep | null) => void;
    onComplete?: (area: TourArea) => void;
  }) {
    this.callbacks = { ...this.callbacks, ...callbacks };
    return this;
  }

  // Start a tour for a specific area
  startTour(area: TourArea, userRole: UserRole) {
    // Find the first step for this area and role
    const firstStep = this.steps.find(
      step => step.area === area && step.roles.includes(userRole) && 
        !this.isStepCompleted(step.id)
    );

    if (firstStep) {
      this.currentStepId = firstStep.id;
      this.callbacks.onStepChange?.(firstStep);
    }

    return this;
  }

  // Move to the next step
  nextStep() {
    if (!this.currentStepId) return null;
    
    const currentStep = this.getStepById(this.currentStepId);
    if (!currentStep) return null;
    
    // Mark current step as completed
    this.markStepCompleted(this.currentStepId);
    
    // Find next step based on nextId or sequence
    let nextStep: OnboardingStep | null = null;
    
    if (currentStep.nextId) {
      nextStep = this.getStepById(currentStep.nextId);
    } else {
      const currentIndex = this.steps.findIndex(step => step.id === this.currentStepId);
      const nextStepsInArea = this.steps.filter(
        (step, index) => 
          index > currentIndex && 
          step.area === currentStep.area && 
          !this.isStepCompleted(step.id)
      );
      
      nextStep = nextStepsInArea.length > 0 ? nextStepsInArea[0] : null;
    }
    
    if (nextStep) {
      this.currentStepId = nextStep.id;
      this.callbacks.onStepChange?.(nextStep);
      return nextStep;
    } else {
      // No more steps in this area
      this.currentStepId = null;
      this.callbacks.onStepChange?.(null);
      this.callbacks.onComplete?.(currentStep.area);
      return null;
    }
  }

  // Skip the current step
  skipStep() {
    if (!this.currentStepId) return null;
    
    const currentStep = this.getStepById(this.currentStepId);
    if (!currentStep || !currentStep.skipable) return null;
    
    // Mark as skipped but not completed
    this.markStepSkipped(this.currentStepId);
    
    return this.nextStep();
  }

  // End the tour
  endTour() {
    const currentStep = this.currentStepId ? this.getStepById(this.currentStepId) : null;
    this.currentStepId = null;
    
    if (currentStep) {
      this.callbacks.onComplete?.(currentStep.area);
    }
    
    this.callbacks.onStepChange?.(null);
  }

  // Get the current step
  getCurrentStep(): OnboardingStep | null {
    return this.currentStepId ? this.getStepById(this.currentStepId) : null;
  }

  // Convert current step to mascot message format
  getCurrentStepAsMascotMessage(): MascotMessage | null {
    const step = this.getCurrentStep();
    
    if (!step) return null;
    
    return {
      id: step.id,
      text: step.message,
      emotion: step.emotion || 'happy',
      action: step.action,
      actionLabel: step.actionLabel,
      duration: undefined // Don't auto-dismiss onboarding steps
    };
  }

  // Check if a specific tour area is completed
  isTourAreaCompleted(area: TourArea, userRole: UserRole): boolean {
    const stepsInArea = this.steps.filter(
      step => step.area === area && step.roles.includes(userRole)
    );
    
    return stepsInArea.every(step => this.isStepCompleted(step.id));
  }

  // Private helper methods
  private getStepById(id: string): OnboardingStep | null {
    return this.steps.find(step => step.id === id) || null;
  }

  private isStepCompleted(id: string): boolean {
    const progress = this.getStoredProgress();
    return progress.completed.includes(id);
  }

  private markStepCompleted(id: string) {
    const progress = this.getStoredProgress();
    
    if (!progress.completed.includes(id)) {
      progress.completed.push(id);
      this.saveProgress(progress);
    }
  }

  private markStepSkipped(id: string) {
    const progress = this.getStoredProgress();
    
    if (!progress.skipped.includes(id)) {
      progress.skipped.push(id);
      this.saveProgress(progress);
    }
  }

  private getStoredProgress(): { completed: string[]; skipped: string[] } {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : { completed: [], skipped: [] };
    } catch (e) {
      return { completed: [], skipped: [] };
    }
  }

  private saveProgress(progress: { completed: string[]; skipped: string[] }) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      console.error('Failed to save onboarding progress:', e);
    }
  }

  private loadProgress() {
    // Just ensure the progress object exists
    this.getStoredProgress();
  }

  // Reset all progress (for testing)
  resetProgress() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      this.currentStepId = null;
      this.callbacks.onStepChange?.(null);
    } catch (e) {
      console.error('Failed to reset onboarding progress:', e);
    }
  }
}

// Export a singleton instance
export const onboardingService = new OnboardingService();

// Default onboarding steps for the login/registration screen
export const loginOnboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    message: "Hi there! I'm Denti, your friendly guide to DentaMind! Ready to get started?",
    emotion: 'greeting',
    actionLabel: "Let's Go!",
    area: 'login',
    roles: ['new', 'patient', 'doctor', 'staff', 'admin'],
    skipable: true,
    nextId: 'choose-login-type'
  },
  {
    id: 'choose-login-type',
    message: "First, choose whether you're logging in or registering as a patient or provider.",
    emotion: 'explaining',
    element: '.tabs-list', // CSS selector to highlight
    position: 'right',
    area: 'login',
    roles: ['new', 'patient', 'doctor', 'staff'],
    skipable: true
  },
  {
    id: 'patient-registration',
    message: "As a patient, you'll get access to your dental records, appointments, and treatment plans!",
    emotion: 'excited',
    element: 'form', // CSS selector to highlight
    position: 'bottom',
    area: 'login',
    roles: ['new', 'patient'],
    skipable: true
  },
  {
    id: 'provider-registration',
    message: "As a dental provider, you'll have AI-powered tools to enhance your practice and patient care.",
    emotion: 'explaining',
    element: 'form', // CSS selector to highlight
    position: 'bottom',
    area: 'login',
    roles: ['doctor'],
    skipable: true
  },
  {
    id: 'staff-registration',
    message: "Welcome to the staff portal! You'll help manage patient records, appointments, and communications.",
    emotion: 'happy',
    element: 'form', // CSS selector to highlight
    position: 'bottom',
    area: 'login',
    roles: ['staff'],
    skipable: true
  },
  {
    id: 'login-end',
    message: "Once you're logged in, I'll show you around the dashboard. Can't wait to help you explore DentaMind!",
    emotion: 'excited',
    actionLabel: "Got it!",
    area: 'login',
    roles: ['new', 'patient', 'doctor', 'staff', 'admin'],
    skipable: true
  }
];

// Initialize service with the login steps
onboardingService.initializeSteps(loginOnboardingSteps);