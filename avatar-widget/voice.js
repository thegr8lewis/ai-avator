import languageManager from './language.js';

// ElevenLabs Configuration - routed through backend proxy
const PROXY_BASE = (typeof window !== 'undefined'
  ? (window.PROXY_BASE !== undefined ? window.PROXY_BASE : (window.location ? `${window.location.origin}` : ''))
  : 'http://localhost:3001');
const VOICE_ID = (window.ELEVENLABS_VOICE_ID && !String(window.ELEVENLABS_VOICE_ID).includes('REPLACE_WITH'))
  ? window.ELEVENLABS_VOICE_ID
  : null; // when null, proxy default voice is used

// Log voice configuration
console.log('🎤 ElevenLabs Voice Configuration (proxied):', {
  voiceId: VOICE_ID || 'proxy_default',
  proxy: PROXY_BASE
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
  
  // Fix temperature pronunciation: convert "-5°C" to "minus 5 degrees Celsius"
  // Match patterns like: -5, -10, -15 followed by optional space and degree symbol
  cleaned = cleaned.replace(/(-\d+)\s*°C/g, (match, tempWithMinus) => {
    const temp = parseInt(tempWithMinus);
    const absTemp = Math.abs(temp);
    return `minus ${absTemp} degrees Celsius`;
  });
  
  // Handle positive temperatures with °C
  cleaned = cleaned.replace(/(\d+)\s*°C/g, (match, temp) => {
    return `${temp} degrees Celsius`;
  });
  
  // Handle negative temperatures with just ° (no C)
  cleaned = cleaned.replace(/(-\d+)\s*°/g, (match, tempWithMinus) => {
    const temp = parseInt(tempWithMinus);
    const absTemp = Math.abs(temp);
    return `minus ${absTemp} degrees`;
  });
  
  // Handle positive temperatures with just ° (no C)
  cleaned = cleaned.replace(/(\d+)\s*°/g, (match, temp) => {
    return `${temp} degrees`;
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
  const response = await fetch(`${PROXY_BASE}/api/tts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text,
      voiceId: VOICE_ID || undefined,
      modelId: 'eleven_multilingual_v2'
    })
  });

  const json = await response.json().catch(() => null);
  if (!response.ok || !json || !json.audioBase64) {
    console.error('❌ ElevenLabs proxy error:', response.status, json);
    throw new Error(`ElevenLabs API error: ${response.status}`);
  }

  const audioBytes = Uint8Array.from(atob(json.audioBase64), c => c.charCodeAt(0));
  const audioBlob = new Blob([audioBytes], { type: json.contentType || 'audio/mpeg' });
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
