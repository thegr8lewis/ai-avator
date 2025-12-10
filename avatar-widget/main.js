import * as THREE from 'three';
import languageManager from './language.js';
import { speak, speakThen, setSpeechHooks } from './voice.js';
import { buildVisemeTimeline } from './lipsync.js';
import { getWeatherSummary, fetchWeatherAndSpeak, startClothingRecommendationCache } from './weather.js';
import { initAvatar } from './avatar.js';
import { startVoiceInput, stopVoiceInput, isVoiceInputActive, updateVoiceInputLanguage } from './voice-input.js';

const container = document.getElementById('avatar-container');

// Fixed avatar display dimensions (can be changed via setAvatarDisplaySize)
let AVATAR_WIDTH = 220;
let AVATAR_HEIGHT = 420;

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(
  50,
  AVATAR_WIDTH / AVATAR_HEIGHT,
  0.1,
  100
);
// Start a bit back and up to frame the full body
camera.position.set(0, 0.3, 4.5);

// Renderer
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(AVATAR_WIDTH, AVATAR_HEIGHT);
renderer.setClearColor(0x000000, 0);
// Subtle realism via tone mapping
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
container.appendChild(renderer.domElement);

// Lights
const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
hemi.position.set(0, 1, 0);
scene.add(hemi);

const dir = new THREE.DirectionalLight(0xffffff, 1);
dir.position.set(2, 4, 3);
dir.castShadow = false;
scene.add(dir);

// Load the GLB from the same folder as this file (avatar-widget)
const AVATAR_URL = './Business_Professional_1112121706_texture.glb';

// Avatar controller
let avatarController = null;
let autoSequenceStarted = false; // ensure we only auto-speak sequence once
let speaking = false;
let currentUtterance = null;
let currentScale = 1.0; // UI-controlled scale (simple approach)
let currentLang = 'en';
try {
  languageManager.subscribe((lang) => { currentLang = lang; });
} catch {}
const lipSync = {
  active: false,
  t: 0,
  intensity: 0,
  timeline: null,
  startTime: 0,
  currentViseme: null,
  update(dt) {
    if (!this.active) return;
    this.t += dt;
    // Decay intensity between boundaries
    this.intensity = Math.max(0, this.intensity - dt * 1.5);
    const osc = Math.abs(Math.sin(this.t * 12));
    const mouth = Math.min(1, (0.1 + osc * 0.9) * (0.25 + this.intensity));
    // Mouth animation handled inside avatar controller
  },
  start(text) {
    console.log('🎤 LipSync started - Text:', text?.substring(0, 50));
    this.active = true;
    this.t = 0;
    this.intensity = 1;
    try {
      this.timeline = buildVisemeTimeline(text || '');
      this.startTime = performance.now();
      this.currentViseme = null;
      console.log('🎯 Viseme timeline generated:', this.timeline?.length || 0, 'segments');
      console.log('🎤 LipSync state - active:', this.active, 'intensity:', this.intensity);
    } catch (e) {
      console.error('❌ Error building viseme timeline:', e);
    }
  },
  peak() {
    console.log('🎤 LipSync peak');
    this.intensity = 1;
  },
  stop() { 
    console.log('🎤 LipSync stopped');
    this.active = false; 
    this.timeline = null;
    this.currentViseme = null;
  }
};

// Initialize avatar controller and load avatar
(async () => {
  try {
    avatarController = initAvatar({ scene, camera, url: AVATAR_URL, lipSync, enableProceduralGestures: false });
    await avatarController.load();
    if (avatarController.model) {
      avatarController.model.scale.set(currentScale, currentScale, currentScale);
    }
    setTimeout(() => attemptAutoSpeak(), 150);
  } catch (e) {
    console.error('Failed to initialize avatar:', e);
  }
})();


// Resize handling - keep avatar at fixed size
function onResize() {
  camera.aspect = AVATAR_WIDTH / AVATAR_HEIGHT;
  camera.updateProjectionMatrix();
  renderer.setSize(AVATAR_WIDTH, AVATAR_HEIGHT);
}
window.addEventListener('resize', onResize);

// Float + gentle rotate
let clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  // Advance viseme based on timeline
  if (lipSync.active && lipSync.timeline && lipSync.timeline.length) {
    const elapsed = performance.now() - lipSync.startTime;
    let acc = 0;
    let current = null;
    for (const seg of lipSync.timeline) {
      if (elapsed >= seg.t && elapsed < seg.t + seg.dur) { current = seg; break; }
    }
    lipSync.currentViseme = current ? current.name : null;
  } else {
    lipSync.currentViseme = null;
  }
  if (avatarController) avatarController.update(dt);

  // Update lip sync animation
  lipSync.update(dt);

  renderer.render(scene, camera);
}
animate();

// Axes helper removed for cleaner view

// Speech bubble element
const speechBubble = document.getElementById('speech-bubble');
let speechTimeout = null;

function showSpeechBubble(text) {
  if (!speechBubble) return;
  
  // Clear any existing timeout
  if (speechTimeout) {
    clearTimeout(speechTimeout);
    speechTimeout = null;
  }
  
  // Update text and show bubble
  speechBubble.textContent = text;
  speechBubble.classList.add('active');
}

function hideSpeechBubble() {
  if (!speechBubble) return;
  
  // Add a small delay before hiding
  speechTimeout = setTimeout(() => {
    speechBubble.classList.remove('active');
    speechTimeout = null;
  }, 500);
}

// Wire voice hooks to lip sync and speech bubble
setSpeechHooks({
  onStart: (text) => { 
    speaking = true; 
    lipSync.start(text);
    showSpeechBubble(text);
  },
  onBoundary: () => lipSync.peak(),
  onEnd: () => { 
    speaking = false; 
    lipSync.stop(); 
    currentUtterance = null;
    hideSpeechBubble();
  }
});

// Weather functionality moved to weather.js

// fetchWeatherAndSpeak moved to weather.js

// clothing recommendation cache handled in weather.js

// recommendation retrieval moved to weather.js

// clothing recommendation via gemini moved to gemini.js/weather.js

// mapWeatherCode moved to weather.js

// Function to change avatar display size
window.setAvatarDisplaySize = (width, height) => {
  // Update constants
  AVATAR_WIDTH = width;
  AVATAR_HEIGHT = height;
  
  // Update camera and renderer
  camera.aspect = AVATAR_WIDTH / AVATAR_HEIGHT;
  camera.updateProjectionMatrix();
  renderer.setSize(AVATAR_WIDTH, AVATAR_HEIGHT);
  
  console.log(`✅ Avatar display size updated to ${width}x${height}px`);
};

// Expose helpers for quick testing from console
window.say = (t) => speak(t);
window.sayWeather = () => fetchWeatherAndSpeak();
window.speak = speak;
window.getWeatherSummary = getWeatherSummary;
window.showSpeechBubble = showSpeechBubble;
window.hideSpeechBubble = hideSpeechBubble;

// Processing indicator helpers
window.showProcessing = () => {
  const indicator = document.getElementById('processing-indicator');
  if (indicator) indicator.classList.remove('hidden');
};
window.hideProcessing = () => {
  const indicator = document.getElementById('processing-indicator');
  if (indicator) indicator.classList.add('hidden');
};
window.testMouth = () => {
  console.log('🧪 Testing mouth movement manually...');
  lipSync.active = true;
  lipSync.intensity = 1;
  setTimeout(() => {
    lipSync.active = false;
    console.log('🧪 Test complete');
  }, 3000);
};
window.getLipSyncState = () => {
  console.log('📊 LipSync State:', {
    active: lipSync.active,
    intensity: lipSync.intensity,
    currentViseme: lipSync.currentViseme,
    timelineLength: lipSync.timeline?.length || 0
  });
  if (avatarController) {
    console.log('📊 Avatar Controller exists:', !!avatarController.model);
  }
};

// Hook up a button if present in the DOM
window.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('speak-weather');
  if (btn) btn.addEventListener('click', () => window.sayWeather());

  const inc = document.getElementById('increase');
  const dec = document.getElementById('decrease');
  const label = document.getElementById('scale-label');

  function refreshLabel() {
    if (label) label.textContent = `Scale: ${currentScale.toFixed(2)}`;
  }

  window.setAvatarScale = (s) => {
    currentScale = Math.max(0.6, Math.min(5.0, s));
    if (avatarController && avatarController.model) {
      avatarController.model.scale.set(currentScale, currentScale, currentScale);
    }
    refreshLabel();
  };

  if (inc) inc.addEventListener('click', () => window.setAvatarScale(currentScale + 0.1));
  if (dec) dec.addEventListener('click', () => window.setAvatarScale(currentScale - 0.1));

  // Initialize label
  refreshLabel();
  
  // Mic button for voice input
  const micBtn = document.getElementById('mic-btn');
  const processingIndicator = document.getElementById('processing-indicator');
  const voiceActivity = document.getElementById('voice-activity');
  
  if (micBtn) {
    micBtn.addEventListener('click', async () => {
      if (isVoiceInputActive()) {
        // Stop listening
        stopVoiceInput();
        micBtn.classList.remove('listening');
        if (voiceActivity) voiceActivity.classList.add('hidden');
        return;
      }
      
      // Start listening
      const started = startVoiceInput(
        async (transcript) => {
          // Handle voice input result
          micBtn.classList.remove('listening');
          if (voiceActivity) voiceActivity.classList.add('hidden');
          console.log('📝 User said:', transcript);
          
          // Show processing indicator
          if (processingIndicator) {
            processingIndicator.classList.remove('hidden');
          }
          
          try {
            // Send to chat AI (if chat module exists)
            if (window.chatManager && window.chatManager.sendMessage) {
              await window.chatManager.sendMessage(transcript);
            } else {
              // Fallback: just speak back the transcript
              speak(`You said: ${transcript}`);
            }
          } catch (error) {
            console.error('Error processing voice input:', error);
            speak('Sorry, there was an error processing your request.');
          } finally {
            // Hide processing indicator
            if (processingIndicator) {
              processingIndicator.classList.add('hidden');
            }
          }
        },
        (error) => {
          // Handle error
          micBtn.classList.remove('listening');
          if (voiceActivity) voiceActivity.classList.add('hidden');
          console.error('Voice input error:', error);
          
          if (error === 'not-allowed') {
            speak('Microphone permission denied. Please allow microphone access.');
          } else if (error === 'no-speech') {
            speak('No speech detected. Please try again.');
          } else {
            speak('Voice input error. Please try again.');
          }
        }
      );
      
      if (started) {
        micBtn.classList.add('listening');
        if (voiceActivity) voiceActivity.classList.remove('hidden');
      }
    });
  }
  
  // Update voice input language when language changes
  try {
    languageManager.subscribe((lang) => {
      updateVoiceInputLanguage(lang);
    });
  } catch {}
  
  // Start background caching of clothing recommendations
  startClothingRecommendationCache();
});

function attemptAutoSpeak() {
  if (autoSequenceStarted || !avatarController || !avatarController.model) return;
  autoSequenceStarted = true;
  const greeting = languageManager.t('weather-greeting');
  try {
    // Use ElevenLabs directly - no browser voice loading needed
    speakThen(greeting, () => fetchWeatherAndSpeak());
  } catch (e) {
    // Likely blocked by autoplay policies; set gesture fallback
    autoSequenceStarted = false; // allow retry via gesture
  }
}

// If autoplay is blocked, trigger auto-speak on first user gesture
['click', 'keydown', 'touchstart'].forEach((evt) => {
  const handler = () => {
    attemptAutoSpeak();
    window.removeEventListener(evt, handler);
  };
  window.addEventListener(evt, handler, { once: true });
});
