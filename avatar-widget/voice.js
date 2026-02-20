import languageManager from './language.js';

// ElevenLabs Configuration - ONLY voice provider used (no browser speech synthesis)
const ELEVENLABS_API_KEY = window.ELEVENLABS_API_KEY || '';
const VOICE_ID = window.ELEVENLABS_VOICE_ID || 'Cs1wOITy9rzt9SkpOKnu'; // Your cloned voice ID
const ELEVENLABS_API_URL = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`;

// Log voice configuration
console.log('🎤 ElevenLabs Voice Configuration:', {
  voiceId: VOICE_ID,
  apiKeyPresent: !!ELEVENLABS_API_KEY
});

let hooks = { onStart: null, onBoundary: null, onEnd: null };
let currentAudio = null;
let boundaryInterval = null;

// Format temperature for speech - convert minus sign to word
function formatTemperatureForSpeech(temp, lang = 'de') {
  const tempNum = Number(temp);
  if (isNaN(tempNum)) return String(temp);
  
  if (tempNum < 0) {
    const absTemp = Math.abs(tempNum);
    return lang === 'de' ? `minus ${absTemp}` : `minus ${absTemp}`;
  }
  return String(tempNum);
}

// Sanitize text by removing markdown formatting and fixing temperature pronunciation
function sanitizeText(text) {
  if (!text) return text;
  
  let cleaned = text
    .replace(/\*\*/g, '')  // Remove bold **
    .replace(/\*/g, '')    // Remove italic *
    .replace(/\_\_/g, '')  // Remove bold __
    .replace(/\_/g, '')    // Remove italic _
    .replace(/\#\#\#/g, '') // Remove h3 ###
    .replace(/\#\#/g, '')  // Remove h2 ##
    .replace(/\#/g, '')    // Remove h1 #
    .trim();
  
  // Fix temperature pronunciation: convert "-5°C" to "minus 5°C"
  // Match patterns like: -5, -10, -15 followed by optional space and degree symbol
  cleaned = cleaned.replace(/(-\d+)\s*°/g, (match, tempWithMinus) => {
    const temp = parseInt(tempWithMinus);
    const absTemp = Math.abs(temp);
    return `minus ${absTemp}°`;
  });
  
  // Also handle temperatures without degree symbol: "-5 Grad" or "-5 degrees"
  cleaned = cleaned.replace(/(-\d+)\s+(Grad|degrees|degree)/gi, (match, tempWithMinus, unit) => {
    const temp = parseInt(tempWithMinus);
    const absTemp = Math.abs(temp);
    return `minus ${absTemp} ${unit}`;
  });
  
  return cleaned;
}

export function setSpeechHooks(newHooks) {
  hooks = { ...hooks, ...newHooks };
}

// Stop any currently playing audio
function stopCurrentAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if (boundaryInterval) {
    clearInterval(boundaryInterval);
    boundaryInterval = null;
  }
}

// Generate speech using ElevenLabs API
async function generateSpeech(text) {
  if (!ELEVENLABS_API_KEY) {
    console.error('❌ ElevenLabs API key not found. Please set window.ELEVENLABS_API_KEY or add it to env.js');
    throw new Error('ElevenLabs API key not configured');
  }

  const response = await fetch(ELEVENLABS_API_URL, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': ELEVENLABS_API_KEY
    },
    body: JSON.stringify({
      text: text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.75,
        similarity_boost: 0.85,
        style: 0.0,
        use_speaker_boost: true
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ ElevenLabs API error:', response.status, errorText);
    throw new Error(`ElevenLabs API error: ${response.status}`);
  }

  const audioBlob = await response.blob();
  return URL.createObjectURL(audioBlob);
}

// Play audio with hooks
function playAudio(audioUrl, text, onEndCallback = null) {
  stopCurrentAudio();

  currentAudio = new Audio(audioUrl);
  currentAudio.volume = 1.0; // Set volume to maximum
  
  // Trigger onStart when audio actually starts playing
  currentAudio.onplay = () => {
    console.log('🗣️ Speech started:', text.substring(0, 50) + '...');
    if (hooks.onStart) hooks.onStart(text);
    
    // Simulate boundary events every 100ms while playing
    boundaryInterval = setInterval(() => {
      if (currentAudio && !currentAudio.paused) {
        if (hooks.onBoundary) hooks.onBoundary({ charIndex: 0 });
      }
    }, 100);
  };

  currentAudio.onended = () => {
    console.log('🗣️ Speech ended');
    stopCurrentAudio();
    if (hooks.onEnd) hooks.onEnd();
    if (typeof onEndCallback === 'function') onEndCallback();
  };

  currentAudio.onerror = (e) => {
    console.error('❌ Audio playback error:', e);
    stopCurrentAudio();
    if (hooks.onEnd) hooks.onEnd();
    if (typeof onEndCallback === 'function') onEndCallback();
  };

  currentAudio.play().catch(err => {
    console.error('❌ Failed to play audio:', err);
    stopCurrentAudio();
    if (hooks.onEnd) hooks.onEnd();
    if (typeof onEndCallback === 'function') onEndCallback();
  });
}

export async function speak(text) {
  if (!text) return;
  
  try {
    stopCurrentAudio();
    const cleanText = sanitizeText(text);
    console.log('🎙️ Generating speech with ElevenLabs...');
    console.log('📝 Original text:', text.substring(0, 100));
    console.log('📝 Cleaned text:', cleanText.substring(0, 100));
    const audioUrl = await generateSpeech(cleanText);
    playAudio(audioUrl, cleanText);
  } catch (error) {
    console.error('❌ Speech generation failed:', error);
    // Fallback notification
    if (hooks.onEnd) hooks.onEnd();
  }
}

export async function speakThen(text, onEnd) {
  if (!text) return;
  
  try {
    stopCurrentAudio();
    const cleanText = sanitizeText(text);
    console.log('🎙️ Generating speech with ElevenLabs...');
    const audioUrl = await generateSpeech(cleanText);
    playAudio(audioUrl, cleanText, onEnd);
  } catch (error) {
    console.error('❌ Speech generation failed:', error);
    // Call onEnd even on error to prevent hanging
    if (typeof onEnd === 'function') onEnd();
    if (hooks.onEnd) hooks.onEnd();
  }
}

// ElevenLabs only - no browser voice selection needed
