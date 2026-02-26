// Voice input functionality using Web Speech API
let recognition = null;
let isListening = false;

// Initialize speech recognition
function initSpeechRecognition() {
  // Check if browser supports speech recognition
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    console.warn('Speech recognition not supported in this browser');
    return null;
  }
  
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  
  // Set language based on current language setting
  try {
    const currentLang = localStorage.getItem('language') || 'en';
    recognition.lang = currentLang === 'ar' ? 'ar-SA' : 'en-US';
  } catch {
    recognition.lang = 'en-US';
  }
  
  return recognition;
}

// Start listening
export function startVoiceInput(onResult, onError) {
  if (!recognition) {
    recognition = initSpeechRecognition();
  }
  
  if (!recognition) {
    if (onError) onError('Speech recognition not supported');
    return false;
  }
  
  if (isListening) {
    stopVoiceInput();
    return false;
  }
  
  isListening = true;
  
  // Handle result
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    console.log('🎤 Voice input:', transcript);
    
    if (onResult) {
      onResult(transcript);
    }
    
    isListening = false;
  };
  
  // Handle errors
  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    isListening = false;
    
    if (onError) {
      onError(event.error);
    }
  };
  
  // Handle end
  recognition.onend = () => {
    isListening = false;
    console.log('🎤 Voice input ended');
  };
  
  try {
    recognition.start();
    console.log('🎤 Voice input started');
    return true;
  } catch (error) {
    console.error('Failed to start speech recognition:', error);
    isListening = false;
    if (onError) onError(error.message);
    return false;
  }
}

// Stop listening
export function stopVoiceInput() {
  if (recognition && isListening) {
    recognition.stop();
    isListening = false;
  }
}

// Check if currently listening
export function isVoiceInputActive() {
  return isListening;
}

// Update language
export function updateVoiceInputLanguage(lang) {
  if (recognition) {
    recognition.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
  }
}
