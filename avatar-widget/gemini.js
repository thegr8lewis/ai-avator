import languageManager from './language.js';

const GEMINI_API_KEY = (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY)
  || (typeof window !== 'undefined' && window.ENV && window.ENV.GEMINI_API_KEY)
  || '';

// Log Gemini API key status
console.log('🤖 Gemini API Status:', {
  keyPresent: !!GEMINI_API_KEY,
  keyLength: GEMINI_API_KEY ? GEMINI_API_KEY.length : 0,
  keyPreview: GEMINI_API_KEY ? `${GEMINI_API_KEY.substring(0, 8)}...` : 'Not set'
});

const GEMINI_API_URLS = [
  'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent',
  'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent',
  'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent',
  'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro-latest:generateContent',
  'https://generativelanguage.googleapis.com/v1/models/gemini-1.0-pro:generateContent',
  'https://generativelanguage.googleapis.com/v1/models/gemini-1.0-pro-latest:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent'
];

export async function getGeminiResponse(userMessage, weatherContext = '') {
  console.log('🤖 Gemini Request:', { userMessage, hasWeatherContext: !!weatherContext });
  
  if (!GEMINI_API_KEY) {
    console.warn('❌ Gemini API key not found - returning offline message');
    const lang = languageManager.getLang();
    return lang === 'de'
      ? 'Die KI‑Antwort ist offline, weil kein API‑Schlüssel gesetzt ist.'
      : 'AI response is offline because no API key is set.';
  }
  const systemPrompt = languageManager.getSystemPrompt(!!weatherContext, weatherContext);
  const prompt = weatherContext
    ? `${systemPrompt}\nUser: "${userMessage}"`
    : `${systemPrompt}: "${userMessage}"`;

  const requestBody = { contents: [{ parts: [{ text: prompt }] }] };

  let discoveredModels = [];
  console.log('🔍 Discovering Gemini models...');
  try {
    const listV1 = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${GEMINI_API_KEY}`);
    if (listV1.ok) {
      const json = await listV1.json();
      discoveredModels = Array.isArray(json.models) ? json.models.map(m => m.name) : [];
      console.log('✅ Models discovered (v1):', discoveredModels.length);
    } else if (listV1.status === 404) {
      console.log('⚠️ v1 not found, trying v1beta...');
      const listV1b = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
      if (listV1b.ok) {
        const json = await listV1b.json();
        discoveredModels = Array.isArray(json.models) ? json.models.map(m => m.name) : [];
        console.log('✅ Models discovered (v1beta):', discoveredModels.length);
      }
    } else {
      console.warn('❌ Model discovery failed:', listV1.status);
    }
  } catch (e) {
    console.warn('❌ Model discovery error:', e.message);
  }

  const prefer = (name) =>
    name.includes('1.5-flash') ? 100 :
    name.includes('1.5-pro') ? 90 :
    name.includes('1.0-pro') ? 80 :
    name.includes('pro') ? 70 :
    0;

  const discoveredTargets = discoveredModels
    .filter(n => typeof n === 'string' && n.startsWith('models/'))
    .map(n => n.replace(/^models\//, ''))
    .filter(n => !n.includes('embedding'))
    .sort((a, b) => prefer(b) - prefer(a))
    .map(n => `https://generativelanguage.googleapis.com/v1/models/${n}:generateContent`);

  const targets = (discoveredTargets.length > 0 ? discoveredTargets : GEMINI_API_URLS);
  console.log('🎯 Trying', targets.length, 'API endpoints...');

  let lastError;
  for (let i = 0; i < targets.length; i++) {
    const baseUrl = targets[i];
    const modelName = baseUrl.split('/').pop().split(':')[0];
    console.log(`🔄 Trying model ${i + 1}/${targets.length}: ${modelName}`);
    
    try {
      const response = await fetch(`${baseUrl}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        console.warn(`❌ ${modelName} failed:`, response.status);
        lastError = new Error(`Gemini API error: ${response.status}`);
        if (response.status === 404) continue;
        throw lastError;
      }
      
      const data = await response.json();
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        console.log(`✅ ${modelName} succeeded!`);
        return data.candidates[0].content.parts[0].text;
      } else {
        console.warn(`❌ ${modelName} invalid response format`);
        lastError = new Error('Invalid response format from Gemini API');
        throw lastError;
      }
    } catch (e) {
      console.warn(`❌ ${modelName} error:`, e.message);
      lastError = e;
    }
  }

  try {
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${GEMINI_API_KEY}`);
    await listRes.text();
  } catch {}
  throw lastError || new Error('Gemini API request failed');
}

export async function getClothingRecommendation(weatherData, lang = 'en') {
  if (!GEMINI_API_KEY) return null;
  try {
    const temp = weatherData?.current?.temp_c;
    const condition = weatherData?.current?.condition?.text || '';
    const humidity = weatherData?.current?.humidity || 0;
    const windSpeed = weatherData?.current?.wind_kph || 0;

    const prompt = lang === 'de'
      ? `Basierend auf dem aktuellen Wetter (${temp}°C, ${condition}, Luftfeuchtigkeit ${humidity}%, Wind ${windSpeed} km/h), gib eine kurze, praktische Kleidungsempfehlung in 1-2 Sätzen. Sei freundlich und direkt.`
      : `Based on the current weather (${temp}°C, ${condition}, humidity ${humidity}%, wind ${windSpeed} km/h), provide a brief, practical clothing recommendation in 1-2 sentences. Be friendly and direct.`;

    const requestBody = { contents: [{ parts: [{ text: prompt }] }] };

    let discoveredModels = [];
    try {
      const listV1 = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${GEMINI_API_KEY}`);
      if (listV1.ok) {
        const json = await listV1.json();
        discoveredModels = Array.isArray(json.models) ? json.models.map(m => m.name) : [];
      } else if (listV1.status === 404) {
        const listV1b = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
        if (listV1b.ok) {
          const json = await listV1b.json();
          discoveredModels = Array.isArray(json.models) ? json.models.map(m => m.name) : [];
        }
      }
    } catch {}

    const prefer = (name) =>
      name.includes('1.5-flash') ? 100 :
      name.includes('1.5-pro') ? 90 :
      name.includes('1.0-pro') ? 80 :
      name.includes('pro') ? 70 :
      0;

    const discoveredTargets = discoveredModels
      .filter(n => typeof n === 'string' && n.startsWith('models/'))
      .map(n => n.replace(/^models\//, ''))
      .filter(n => !n.includes('embedding'))
      .sort((a, b) => prefer(b) - prefer(a))
      .map(n => `https://generativelanguage.googleapis.com/v1/models/${n}:generateContent`);

    const targets = (discoveredTargets.length > 0 ? discoveredTargets : [
      'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent',
      'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent',
      'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent',
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent'
    ]);

    let lastError;
    for (const apiUrl of targets) {
      try {
        const response = await fetch(`${apiUrl}?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
          lastError = new Error(`Gemini API error: ${response.status}`);
          if (response.status === 404) continue;
          throw lastError;
        }
        const data = await response.json();
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
          return data.candidates[0].content.parts[0].text;
        } else {
          lastError = new Error('Invalid response format from Gemini API');
          throw lastError;
        }
      } catch (e) {
        lastError = e;
      }
    }

    return null;
  } catch {
    return null;
  }
}
