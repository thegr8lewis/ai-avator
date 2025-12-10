// Auto-generate env.js from .env file
// Usage: node generate-env.js

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const outPath = path.join(__dirname, 'env.js');

function parseDotEnv(content) {
  const out = {};
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    // Remove quotes if present
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

try {
  if (!fs.existsSync(envPath)) {
    console.error('❌ No .env found at', envPath);
    console.log('💡 Create a .env file with your API keys first');
    process.exit(1);
  }
  
  const raw = fs.readFileSync(envPath, 'utf8');
  const env = parseDotEnv(raw);
  
  const elevenlabs = env.ELEVENLABS_API_KEY || '';
  const weather = env.WEATHER_API_KEY || '';
  const gemini = env.GEMINI_API_KEY || '';

  const js = `// Runtime environment variables for browser
// This file contains your API keys and should NOT be committed to version control

// ElevenLabs API Key (for voice synthesis)
window.ELEVENLABS_API_KEY = ${JSON.stringify(elevenlabs)};

// Legacy ENV object for other services
window.ENV = {
  WEATHER_API_KEY: ${JSON.stringify(weather)},
  GEMINI_API_KEY: ${JSON.stringify(gemini)}
};

// Log API key status for debugging
console.log('🔑 API Keys loaded:', {
  elevenLabsApiKey: window.ELEVENLABS_API_KEY ? '✅ Set' : '❌ Missing',
  weatherApiKey: window.ENV.WEATHER_API_KEY ? '✅ Set' : '❌ Missing',
  geminiApiKey: window.ENV.GEMINI_API_KEY ? '✅ Set' : '❌ Missing'
});
`;

  fs.writeFileSync(outPath, js, 'utf8');
  console.log('✅ Generated env.js successfully!');
  console.log('📊 API Keys status:');
  console.log('  - ElevenLabs:', elevenlabs ? '✅ Set' : '❌ Missing');
  console.log('  - Weather:', weather ? '✅ Set' : '❌ Missing');
  console.log('  - Gemini:', gemini ? '✅ Set' : '❌ Missing');
} catch (err) {
  console.error('❌ Error generating env.js:', err.message);
  process.exit(1);
}
