// Audio context and buffer for notification sound
let audioContext = null;
let audioBuffer = null;

// Initialize audio context
const initAudio = async () => {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const response = await fetch('/notification.mp3');
    const arrayBuffer = await response.arrayBuffer();
    audioBuffer = await audioContext.decodeAudioBuffer(arrayBuffer);
  } catch (error) {
    console.error('Failed to initialize audio:', error);
  }
};

// Play notification sound
export const playNotificationSound = async () => {
  if (!audioContext || !audioBuffer) {
    await initAudio();
  }
  
  try {
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start(0);
  } catch (error) {
    console.error('Failed to play notification sound:', error);
  }
};