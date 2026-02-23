import * as THREE from 'three';
import languageManager from './language.js';
import { speak, speakThen, setSpeechHooks } from './voice.js';
import { buildVisemeTimeline } from './lipsync.js';
import { getWeatherSummary, fetchWeatherAndSpeak, startClothingRecommendationCache } from './weather.js';
import { initAvatar } from './avatar.js';
import { startVoiceInput, stopVoiceInput, isVoiceInputActive, updateVoiceInputLanguage } from './voice-input.js';
import './recommendations.js';

const container = document.getElementById('avatar-container');

// Fixed avatar display dimensions (can be changed via setAvatarDisplaySize)
let AVATAR_WIDTH = 200;
let AVATAR_HEIGHT = 160;

// Scene
const scene = new THREE.Scene();

// Camera - position will be calculated dynamically in avatar.js based on model bounds
const camera = new THREE.PerspectiveCamera(
  45,
  AVATAR_WIDTH / AVATAR_HEIGHT,
  0.1,
  100
);
// Initial position (will be overridden by avatar.js after model loads)
camera.position.set(0, 0, 2);
camera.lookAt(0, 0, 0);

// Renderer - CSS handles all styling via object-fit
const renderer = new THREE.WebGLRenderer({ 
  alpha: true, 
  antialias: true,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(AVATAR_WIDTH, AVATAR_HEIGHT);
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

container.appendChild(renderer.domElement);
console.log('✅ Renderer initialized:', AVATAR_WIDTH + 'x' + AVATAR_HEIGHT);

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
// Scale is now handled automatically in avatar.js using Box3 bounding box
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
    // Scale is now handled automatically in avatar.js using Box3
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

function sanitizeText(text) {
  if (!text) return text;
  // Remove markdown formatting
  return text
    .replace(/\*\*/g, '')  // Remove bold **
    .replace(/\*/g, '')    // Remove italic *
    .replace(/\_\_/g, '')  // Remove bold __
    .replace(/\_/g, '')    // Remove italic _
    .replace(/\#\#\#/g, '') // Remove h3 ###
    .replace(/\#\#/g, '')  // Remove h2 ##
    .replace(/\#/g, '')    // Remove h1 #
    .trim();
}

function showSpeechBubble(text) {
  if (!speechBubble) return;
  
  // Clear any existing timeout
  if (speechTimeout) {
    clearTimeout(speechTimeout);
    speechTimeout = null;
  }
  
  // Sanitize and update text, then show bubble
  speechBubble.textContent = sanitizeText(text);
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

// Wire voice hooks to lip sync (speech bubble disabled - responses show in chat)
setSpeechHooks({
  onStart: (text) => { 
    speaking = true; 
    lipSync.start(text);
    // Speech bubble disabled - responses now show in chat messages
  },
  onBoundary: () => lipSync.peak(),
  onEnd: () => { 
    speaking = false; 
    lipSync.stop(); 
    currentUtterance = null;
    // Speech bubble disabled
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

// Stop speech function
window.stopSpeech = () => {
  speaking = false;
  lipSync.stop();
  currentUtterance = null;
};

// Expose helpers for quick testing from console
window.say = (t) => speak(t);
window.sayWeather = () => fetchWeatherAndSpeak();
window.speak = speak;
window.getWeatherSummary = getWeatherSummary;
window.activateCircleKTab = activateCircleKTab;
window.speakCircleKGreeting = speakCircleKGreeting;

// Chat and language functions are exposed by their respective modules
// window.chatManager is exposed by chat.js
// languageManager.toggleLanguage() is available via languageManager

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

  // Scale controls removed - now handled automatically via Box3 in avatar.js
  
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
          
          // Open chat modal if not already open
          if (window.chatManager && !window.chatManager.isOpen) {
            window.chatManager.openChat();
          }
          
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

// Circle K greeting - only triggered on tab activation
function speakCircleKGreeting() {
  if (!avatarController || !avatarController.model) {
    console.warn('⚠️ Avatar not ready for speech');
    return;
  }
  
  const greeting = languageManager.t('circle-k-greeting');
  console.log('🎙️ Speaking Circle K greeting:', greeting);
  console.log('🎤 Avatar controller ready:', !!avatarController);
  console.log('🎤 Avatar model loaded:', !!avatarController.model);
  
  try {
    speak(greeting);
    console.log('✅ Speech initiated successfully');
  } catch (e) {
    console.error('❌ Speech error:', e);
  }
}

// Circle K tab activation handler - triggers greeting
function activateCircleKTab() {
  console.log('🔴 Circle K weather-offers tab activated');
  // Reset flag to allow greeting on every tab activation
  autoSequenceStarted = false;
  // Always speak greeting when tab is activated
  speakCircleKGreeting();
}

// DO NOT auto-speak on page load - only on tab activation
// Removed auto-speak gesture handlers to prevent unwanted greeting
['click', 'keydown', 'touchstart'].forEach((evt) => {
  const handler = () => {
    // No longer auto-speaking on first gesture
    window.removeEventListener(evt, handler);
  };
  window.addEventListener(evt, handler, { once: true });
});
