// Runtime environment variables for browser
// This file contains your API keys and should NOT be committed to version control

// ElevenLabs API Key (for voice synthesis)
window.ELEVENLABS_API_KEY = 'sk_e446955f8e2da819db889c566e8a5f070521c1e8fa765ebb';

// Legacy ENV object for other services
window.ENV = {
  WEATHER_API_KEY: '566a1abc3b4540bfaab104228250411',
  GEMINI_API_KEY: 'AIzaSyAWHTYH2cL5HQspwzPgj07TXvD297GDd8A'
};

// Log API key status for debugging
console.log('🔑 API Keys loaded:', {
  elevenLabsApiKey: window.ELEVENLABS_API_KEY ? '✅ Set' : '❌ Missing',
  weatherApiKey: window.ENV.WEATHER_API_KEY ? '✅ Set' : '❌ Missing',
  geminiApiKey: window.ENV.GEMINI_API_KEY ? '✅ Set' : '❌ Missing'
});
