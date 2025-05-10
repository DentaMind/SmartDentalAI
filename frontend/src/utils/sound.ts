// Create an audio context for playing sounds
let audioContext: AudioContext | null = null;

// Initialize audio context on first user interaction
const initAudioContext = () => {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
};

// Function to generate a beep sound
const generateBeep = async (frequency: number = 440, duration: number = 200, volume: number = 0.5) => {
  if (!audioContext) {
    initAudioContext();
  }

  if (!audioContext) {
    console.error('AudioContext not available');
    return;
  }

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  gainNode.gain.value = volume;

  oscillator.start();
  setTimeout(() => {
    oscillator.stop();
    oscillator.disconnect();
    gainNode.disconnect();
  }, duration);
};

// Play alert sound with increasing frequency for urgency
export const playAlertSound = async () => {
  try {
    await generateBeep(440, 100, 0.3);
    setTimeout(() => generateBeep(880, 100, 0.3), 150);
    setTimeout(() => generateBeep(1760, 100, 0.3), 300);
  } catch (error) {
    console.error('Failed to play alert sound:', error);
  }
};

// Play a success sound
export const playSuccessSound = async () => {
  try {
    await generateBeep(523.25, 100, 0.3); // C5
    setTimeout(() => generateBeep(659.25, 100, 0.3), 100); // E5
    setTimeout(() => generateBeep(783.99, 200, 0.3), 200); // G5
  } catch (error) {
    console.error('Failed to play success sound:', error);
  }
};

// Play a warning sound
export const playWarningSound = async () => {
  try {
    await generateBeep(440, 200, 0.3);
    setTimeout(() => generateBeep(440, 200, 0.3), 300);
  } catch (error) {
    console.error('Failed to play warning sound:', error);
  }
}; 