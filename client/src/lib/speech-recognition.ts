/**
 * Speech Recognition Service
 * 
 * This service provides a wrapper around the Web Speech API's SpeechRecognition
 * interface, adding support for:
 * - Multiple languages
 * - Real-time transcription with continuous mode
 * - Voice command detection
 * - Error handling and recovery
 * - Sentence boundary detection
 */

interface SpeechRecognitionService {
  isListening: boolean;
  transcript: string;
  onResult: (text: string) => void;
  onStart: () => void;
  onEnd: () => void;
  onError: (error: string) => void;
  start: (language?: string) => void;
  stop: () => void;
  abort: () => void;
  pauseListening: () => void;
  resumeListening: () => void;
  clearTranscript: () => void;
  detectCommands: (text: string) => string;
}

class WebSpeechRecognitionService implements SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private interimTranscript = '';
  private finalTranscript = '';
  private currentLanguage = 'en-US';
  private voiceCommandsEnabled = true;
  private autoRestartOnError = true;
  private restartAttempts = 0;
  private maxRestartAttempts = 3;
  
  public isListening = false;
  public transcript = '';
  
  // Callbacks
  public onResult: (text: string) => void = () => {};
  public onStart: () => void = () => {};
  public onEnd: () => void = () => {};
  public onError: (error: string) => void = () => {};
  
  constructor() {
    this.initializeRecognition();
  }
  
  private initializeRecognition() {
    // Check browser support for Speech Recognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech recognition not supported in this browser');
      return;
    }
    
    // Initialize recognition object
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    // Configure recognition
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;
    this.recognition.lang = this.currentLanguage;
    
    // Set up event handlers
    this.recognition.onstart = this.handleStart.bind(this);
    this.recognition.onend = this.handleEnd.bind(this);
    this.recognition.onerror = this.handleError.bind(this);
    this.recognition.onresult = this.handleResult.bind(this);
  }
  
  /**
   * Start the speech recognition service
   * @param language Language code (e.g., 'en-US', 'es-ES')
   */
  public start(language?: string) {
    if (!this.recognition) {
      this.initializeRecognition();
      if (!this.recognition) {
        this.onError('Speech recognition not supported');
        return;
      }
    }
    
    // Update language if provided
    if (language && language !== this.currentLanguage) {
      this.currentLanguage = language;
      this.recognition.lang = language;
    }
    
    try {
      this.recognition.start();
      this.restartAttempts = 0;
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      this.onError('Failed to start speech recognition');
    }
  }
  
  /**
   * Stop the speech recognition service
   */
  public stop() {
    if (!this.recognition || !this.isListening) return;
    
    try {
      this.recognition.stop();
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }
  }
  
  /**
   * Abort the speech recognition service immediately
   */
  public abort() {
    if (!this.recognition) return;
    
    try {
      this.recognition.abort();
      this.isListening = false;
    } catch (error) {
      console.error('Error aborting speech recognition:', error);
    }
  }
  
  /**
   * Temporarily pause listening (without stopping the recognition)
   */
  public pauseListening() {
    if (!this.recognition || !this.isListening) return;
    
    try {
      this.recognition.stop();
      // Don't reset isListening flag here, as we're just pausing
    } catch (error) {
      console.error('Error pausing speech recognition:', error);
    }
  }
  
  /**
   * Resume listening after pausing
   */
  public resumeListening() {
    if (!this.recognition || this.isListening) return;
    
    try {
      this.recognition.start();
    } catch (error) {
      console.error('Error resuming speech recognition:', error);
      this.onError('Failed to resume speech recognition');
    }
  }
  
  /**
   * Clear the current transcript
   */
  public clearTranscript() {
    this.interimTranscript = '';
    this.finalTranscript = '';
    this.transcript = '';
    this.onResult('');
  }
  
  /**
   * Detects and processes voice commands in the transcript
   * @param text The transcript text to check for commands
   * @returns The modified text with commands processed
   */
  public detectCommands(text: string): string {
    if (!this.voiceCommandsEnabled) return text;
    
    // Simple command detection
    const lowerText = text.toLowerCase();
    
    // New paragraph command
    if (lowerText.includes('new paragraph') || lowerText.includes('new line')) {
      return text.replace(/new paragraph|new line/gi, '\n\n');
    }
    
    // SOAP section commands
    if (lowerText.includes('section subjective')) {
      return text.replace(/section subjective/gi, '\n\nSUBJECTIVE:\n');
    }
    
    if (lowerText.includes('section objective')) {
      return text.replace(/section objective/gi, '\n\nOBJECTIVE:\n');
    }
    
    if (lowerText.includes('section assessment')) {
      return text.replace(/section assessment/gi, '\n\nASSESSMENT:\n');
    }
    
    if (lowerText.includes('section plan')) {
      return text.replace(/section plan/gi, '\n\nPLAN:\n');
    }
    
    // End note command
    if (lowerText.includes('end note')) {
      // Special command to trigger completion
      setTimeout(() => {
        this.stop();
      }, 500);
      return text.replace(/end note/gi, '');
    }
    
    return text;
  }
  
  // Event handlers
  
  private handleStart() {
    this.isListening = true;
    this.onStart();
  }
  
  private handleEnd() {
    this.isListening = false;
    this.onEnd();
  }
  
  private handleError(event: SpeechRecognitionErrorEvent) {
    const errorMessage = this.getErrorMessage(event);
    console.error('Speech recognition error:', errorMessage);
    
    // Handle specific error types
    if (event.error === 'network' || event.error === 'service-not-allowed') {
      this.onError(`Network error: ${errorMessage}. Check your internet connection.`);
    } else if (event.error === 'no-speech') {
      // No speech detected - common error, so we try to restart
      if (this.autoRestartOnError && this.restartAttempts < this.maxRestartAttempts) {
        this.restartAttempts++;
        setTimeout(() => {
          if (!this.isListening) this.start();
        }, 300);
        return;
      }
      this.onError('No speech detected. Please try speaking again.');
    } else if (event.error === 'aborted') {
      // Ignore abort errors as they're usually intentional
      return;
    } else {
      this.onError(`Recognition error: ${errorMessage}`);
    }
  }
  
  private handleResult(event: SpeechRecognitionEvent) {
    this.interimTranscript = '';
    
    // Process recognition results
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        // Process voice commands in final results
        const finalResult = event.results[i][0].transcript;
        const processedResult = this.detectCommands(finalResult);
        this.finalTranscript += processedResult + ' ';
      } else {
        this.interimTranscript += event.results[i][0].transcript;
      }
    }
    
    // Update full transcript
    this.transcript = this.finalTranscript + this.interimTranscript;
    
    // Trim extra spaces
    this.transcript = this.transcript.trim();
    
    // Send update
    this.onResult(this.transcript);
  }
  
  private getErrorMessage(event: SpeechRecognitionErrorEvent): string {
    switch (event.error) {
      case 'no-speech':
        return 'No speech detected';
      case 'aborted':
        return 'Recognition aborted';
      case 'audio-capture':
        return 'Microphone not available';
      case 'network':
        return 'Network error';
      case 'not-allowed':
        return 'Microphone access denied';
      case 'service-not-allowed':
        return 'Recognition service unavailable';
      case 'bad-grammar':
        return 'Grammar error';
      case 'language-not-supported':
        return 'Language not supported';
      default:
        return `Unknown error: ${event.error}`;
    }
  }
}

// Add missing types to Window interface
declare global {
  interface Window {
    SpeechRecognition?: typeof SpeechRecognition;
    webkitSpeechRecognition?: typeof SpeechRecognition;
  }
}

// Create and export service singleton
const speechRecognitionService = new WebSpeechRecognitionService();
export default speechRecognitionService;