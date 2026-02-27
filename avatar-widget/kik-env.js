// KiK Website API Configuration (placeholder only)
// Use the backend proxy (proxy-server.js or serverless) to keep real keys server-side.

window.ENV = {
  GEMINI_API_KEY: 'AIzaSyBXIw7PzIUxvR7xa3iYLKN8Lpu9xW0oNts',
  WEATHER_API_KEY: '566a1abc3b4540bfaab104228250411',
  ELEVENLABS_API_KEY: 'sk_7abe7f0cd04f778417241a6ace308d403144a2ff8f1318ad',
  ELEVENLABS_VOICE_ID: 'Cs1wOITy9rzt9SkpOKnu'
};

// Also expose individual keys for backward compatibility
window.GEMINI_API_KEY = window.ENV.GEMINI_API_KEY;
window.WEATHER_API_KEY = window.ENV.WEATHER_API_KEY;
window.ELEVENLABS_API_KEY = window.ENV.ELEVENLABS_API_KEY;
window.ELEVENLABS_VOICE_ID = window.ENV.ELEVENLABS_VOICE_ID;
