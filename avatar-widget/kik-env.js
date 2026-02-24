// KiK Website API Configuration
// This file contains API keys for Gemini AI, ElevenLabs Voice, and Weather API
// Copy your actual API keys here

// Environment configuration object
window.ENV = {
  // Gemini API Key for AI chat responses
  // Get your key from: https://makersuite.google.com/app/apikey
  GEMINI_API_KEY: 'AIzaSyCgBtyi1WFG5w7TnWMOv6P99CRVe5X9j5w',
  
  // Weather API Key for weather data
  // Get your key from: https://www.weatherapi.com/
  WEATHER_API_KEY: '566a1abc3b4540bfaab104228250411',
  
  // ElevenLabs API Key for voice synthesis
  // Get your key from: https://elevenlabs.io/app/settings/api-keys
  ELEVENLABS_API_KEY: 'sk_7abe7f0cd04f778417241a6ace308d403144a2ff8f1318ad',
  
  // ElevenLabs Voice ID (default: Rachel voice)
  ELEVENLABS_VOICE_ID: 'Cs1wOITy9rzt9SkpOKnu'
};

// Also expose individual keys for backward compatibility
window.GEMINI_API_KEY = window.ENV.GEMINI_API_KEY;
window.WEATHER_API_KEY = window.ENV.WEATHER_API_KEY;
window.ELEVENLABS_API_KEY = window.ENV.ELEVENLABS_API_KEY;
window.ELEVENLABS_VOICE_ID = window.ENV.ELEVENLABS_VOICE_ID;
