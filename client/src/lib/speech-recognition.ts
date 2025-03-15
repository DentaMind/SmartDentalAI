/**
 * Real-time speech recognition service using the Web Speech API
 * This service provides voice-to-text functionality for dental clinical notes
 */

// Define interface for Speech Recognition
interface ISpeechRecognitionService {
  isListening: boolean;
  start: (language?: string) => void;
  stop: () => void;
  onResult?: (text: string) => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
}

// Define the SpeechRecognition type for TypeScript
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: Event) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface Window {
  SpeechRecognition: new () => SpeechRecognition;
  webkitSpeechRecognition: new () => SpeechRecognition;
}

/**
 * Speech recognition service implementation
 */
class SpeechRecognitionService implements ISpeechRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private _isListening = false;
  private lastTranscript = '';
  
  // Dental terms and phrases to help improve recognition accuracy
  private dentalTerms = [
    'amalgam', 'composite', 'crown', 'bridge', 'implant', 'denture',
    'extraction', 'scaling', 'root planing', 'prophylaxis', 'prophy',
    'periodontal', 'endodontic', 'orthodontic', 'occlusal', 'caries',
    'cavity', 'restoration', 'pulpitis', 'periapical', 'radiograph',
    'x-ray', 'CBCT', 'bitewing', 'panoramic', 'mandible', 'maxilla',
    'buccal', 'lingual', 'palatal', 'mesial', 'distal', 'gingival',
    'molar', 'premolar', 'canine', 'incisor', 'dentin', 'enamel',
    'pulp', 'apex', 'cusp', 'fissure', 'anesthesia', 'lidocaine',
    'articaine', 'epinephrine', 'carpule', 'infiltration', 'block'
  ];
  
  // Dental voice commands to enhance dictation
  private voiceCommands = {
    'new paragraph': '\n\n',
    'new line': '\n',
    'section subjective': '\n\nSUBJECTIVE:\n',
    'section objective': '\n\nOBJECTIVE:\n',
    'section assessment': '\n\nASSESSMENT:\n',
    'section plan': '\n\nPLAN:\n',
    'section diagnosis': '\n\nDIAGNOSIS:\n',
    'section treatment': '\n\nTREATMENT:\n',
    'section medications': '\n\nMEDICATIONS:\n',
    'section follow-up': '\n\nFOLLOW-UP:\n',
    'delete last sentence': ''
  };
  
  constructor() {
    this.initializeSpeechRecognition();
  }
  
  /**
   * Initialize the Web Speech API
   */
  private initializeSpeechRecognition() {
    // Check if the browser supports the Web Speech API
    if (typeof window !== 'undefined') {
      // Use the appropriate Speech Recognition API based on browser support
      const SpeechRecognition = (window as any).SpeechRecognition ||
                              (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.configureRecognition();
      } else {
        console.error('Speech recognition is not supported in this browser');
      }
    }
  }
  
  /**
   * Configure the speech recognition service
   */
  private configureRecognition() {
    if (!this.recognition) return;
    
    // Set recognition parameters
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;
    this.recognition.lang = 'en-US'; // Default language, can be changed
    
    // Handle recognition results
    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const resultIndex = event.resultIndex;
      const transcript = event.results[resultIndex][0].transcript;
      
      // Check for dental voice commands
      const processedText = this.processDentalCommands(transcript);
      
      // Send result to callback
      if (this.onResult) {
        this.onResult(processedText);
      }
      
      this.lastTranscript = processedText;
    };
    
    // Handle recognition end
    this.recognition.onend = () => {
      this._isListening = false;
      if (this.onEnd) {
        this.onEnd();
      }
    };
    
    // Handle recognition errors
    this.recognition.onerror = (event: any) => {
      this._isListening = false;
      if (this.onError) {
        this.onError(event.error);
      }
    };
  }
  
  /**
   * Process dental-specific commands in the transcript
   */
  private processDentalCommands(text: string): string {
    let processedText = text;
    
    // Apply voice commands
    Object.entries(this.voiceCommands).forEach(([command, replacement]) => {
      if (command === 'delete last sentence' && text.toLowerCase().includes(command)) {
        // Special case: delete last sentence
        const sentences = this.lastTranscript.split(/(?<=[.!?])\s+/);
        if (sentences.length > 1) {
          sentences.pop(); // Remove the last sentence
          processedText = sentences.join(' ');
        } else {
          processedText = '';
        }
      } else if (text.toLowerCase().includes(command)) {
        // Replace the command with its formatted equivalent
        const regex = new RegExp(command, 'gi');
        processedText = text.replace(regex, replacement);
      }
    });
    
    // Improve dental term recognition (capitalize specific dental terms)
    this.dentalTerms.forEach(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      processedText = processedText.replace(regex, match => {
        // Preserve the capitalization if it's already capitalized
        if (match === match.toUpperCase()) {
          return match;
        }
        // Check if this is a proper name or the start of a sentence
        const isStart = processedText.indexOf(match) === 0 || 
                       /[.!?]\s+\w*/.test(processedText.substring(0, processedText.indexOf(match)));
        return isStart ? match.charAt(0).toUpperCase() + match.slice(1) : match;
      });
    });
    
    return processedText;
  }
  
  /**
   * Get listening status
   */
  get isListening(): boolean {
    return this._isListening;
  }
  
  /**
   * Start speech recognition
   * @param language The language code to use for recognition
   */
  start(language?: string): void {
    if (!this.recognition) {
      console.error('Speech recognition is not supported or initialized');
      return;
    }
    
    // Update language if specified
    if (language) {
      this.recognition.lang = language;
    }
    
    try {
      this.recognition.start();
      this._isListening = true;
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      this._isListening = false;
      if (this.onError) {
        this.onError(error);
      }
    }
  }
  
  /**
   * Stop speech recognition
   */
  stop(): void {
    if (!this.recognition) {
      return;
    }
    
    try {
      this.recognition.stop();
      this._isListening = false;
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
      if (this.onError) {
        this.onError(error);
      }
    }
  }
  
  /**
   * Event handler for recognition results
   */
  onResult?: (text: string) => void;
  
  /**
   * Event handler for recognition end
   */
  onEnd?: () => void;
  
  /**
   * Event handler for recognition errors
   */
  onError?: (error: any) => void;
}

// Check if the browser supports speech recognition
const isSpeechRecognitionSupported = (): boolean => {
  if (typeof window !== 'undefined') {
    return !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
  }
  return false;
};

// Fallback mock implementation for browsers without support
class MockSpeechRecognitionService implements ISpeechRecognitionService {
  private _isListening = false;
  private timeoutId: NodeJS.Timeout | null = null;
  private transcriptParts = [
    "Patient reports pain on tooth number",
    " 19. Pain started approximately two weeks ago.",
    " Clinical examination reveals deep caries",
    " extending into dentin. Recommended composite restoration."
  ];
  
  get isListening(): boolean {
    return this._isListening;
  }
  
  start(): void {
    this._isListening = true;
    this.simulateRecognition();
  }
  
  stop(): void {
    this._isListening = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.onEnd) {
      this.onEnd();
    }
  }
  
  private simulateRecognition(): void {
    let currentIndex = 0;
    let fullTranscript = '';
    
    const simulateNext = () => {
      if (currentIndex < this.transcriptParts.length && this._isListening) {
        fullTranscript += this.transcriptParts[currentIndex];
        
        if (this.onResult) {
          this.onResult(fullTranscript);
        }
        
        currentIndex++;
        this.timeoutId = setTimeout(simulateNext, 2000);
      } else {
        this._isListening = false;
        if (this.onEnd) {
          this.onEnd();
        }
      }
    };
    
    this.timeoutId = setTimeout(simulateNext, 1000);
  }
  
  onResult?: (text: string) => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
}

// Create and export the appropriate service based on browser support
export const speechRecognitionService: ISpeechRecognitionService = 
  isSpeechRecognitionSupported() 
    ? new SpeechRecognitionService() 
    : new MockSpeechRecognitionService();

export default speechRecognitionService;