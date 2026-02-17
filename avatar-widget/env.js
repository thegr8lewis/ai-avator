// Runtime environment variables for browser
// This file contains your API keys and should NOT be committed to version control

// ElevenLabs API Key (for voice synthesis)
window.ELEVENLABS_API_KEY = 'sk_7abe7f0cd04f778417241a6ace308d403144a2ff8f1318ad';
window.ELEVENLABS_VOICE_ID = 'Cs1wOITy9rzt9SkpOKnu';

// Legacy ENV object for other services
window.ENV = {
  WEATHER_API_KEY: '566a1abc3b4540bfaab104228250411',
  GEMINI_API_KEY: 'AIzaSyBJBCamJiR72wdZbQABuLgJVeDBOAiyFxA'
};

// Log API key status for debugging
console.log('🔑 API Keys loaded:', {
  elevenLabsApiKey: window.ELEVENLABS_API_KEY ? '✅ Set' : '❌ Missing',
  weatherApiKey: window.ENV.WEATHER_API_KEY ? '✅ Set' : '❌ Missing',
  geminiApiKey: window.ENV.GEMINI_API_KEY ? '✅ Set' : '❌ Missing'
});
