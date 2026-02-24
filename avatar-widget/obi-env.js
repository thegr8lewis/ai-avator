// OBI Website API Configuration (placeholder only)
// Use the backend proxy (proxy-server.js or serverless) to keep real keys server-side.

window.ENV = {
  GEMINI_API_KEY: 'REPLACE_WITH_YOUR_KEY',
  WEATHER_API_KEY: 'REPLACE_WITH_YOUR_KEY',
  ELEVENLABS_API_KEY: 'REPLACE_WITH_YOUR_KEY',
  ELEVENLABS_VOICE_ID: 'REPLACE_WITH_VOICE_ID'
};

// Also expose individual keys for backward compatibility
window.GEMINI_API_KEY = window.ENV.GEMINI_API_KEY;
window.WEATHER_API_KEY = window.ENV.WEATHER_API_KEY;
window.ELEVENLABS_API_KEY = window.ENV.ELEVENLABS_API_KEY;
window.ELEVENLABS_VOICE_ID = window.ENV.ELEVENLABS_VOICE_ID;
