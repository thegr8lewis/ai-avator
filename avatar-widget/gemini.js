import languageManager from './language.js';
import { getWeeklyForecast, getCurrentCity, setCurrentCity, hasSnowInForecast } from './weather.js';
// Removed generateCircleKForecast; we will craft brand-specific responses directly

const GEMINI_API_KEY = (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY)
  || (typeof window !== 'undefined' && window.ENV && window.ENV.GEMINI_API_KEY)
  || '';

// Log Gemini API key status
console.log('🤖 Gemini API Status (v3.5):', {
  keyPresent: !!GEMINI_API_KEY,
  keyLength: GEMINI_API_KEY ? GEMINI_API_KEY.length : 0,
  keyPreview: GEMINI_API_KEY ? `${GEMINI_API_KEY.substring(0, 8)}...` : 'Not set'
});

// Use only Gemini 2.5 Flash-Lite (ultra-low latency, cost efficient)
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

// Detect simple intents (weather-focused)
function detectIntent(userMessage) {
  const msg = userMessage.toLowerCase();
  if (msg.includes('wetter') || msg.includes('weather') || msg.includes('vorhersage') || msg.includes('forecast')) {
    return 'forecast';
  }
  return 'general';
}

// Extract city from message - expanded list
function extractCity(userMessage) {
  const msg = userMessage.toLowerCase();
  const cities = [
    'frankfurt', 'berlin', 'münchen', 'munich', 'hamburg', 'köln', 'cologne',
    'stuttgart', 'düsseldorf', 'dortmund', 'essen', 'leipzig', 'dresden',
    'hannover', 'nürnberg', 'nuremberg', 'duisburg', 'bochum', 'wuppertal',
    'bielefeld', 'bonn', 'münster', 'karlsruhe', 'mannheim', 'augsburg',
    'wiesbaden', 'gelsenkirchen', 'mönchengladbach', 'braunschweig', 'chemnitz',
    'kiel', 'aachen', 'halle', 'magdeburg', 'freiburg', 'krefeld', 'lübeck',
    'oberhausen', 'erfurt', 'mainz', 'rostock', 'kassel', 'hagen', 'saarbrücken',
    'potsdam', 'ludwigshafen', 'oldenburg', 'leverkusen', 'osnabrück', 'solingen'
  ];
  
  for (const city of cities) {
    if (msg.includes(city)) {
      // Normalize city names
      if (city === 'munich') return 'München';
      if (city === 'cologne') return 'Köln';
      if (city === 'nuremberg') return 'Nürnberg';
      return city.charAt(0).toUpperCase() + city.slice(1);
    }
  }
  
  return null;
}

// Track conversation state
let waitingForCity = false;
let lastIntent = null;

const BRAND_PROMPTS = {
  obi: {
    de: 'Du bist der OBI Assistent. Antworte kurz, hilfsbereit und sachlich.',
    en: 'You are the OBI assistant. Reply briefly, helpfully, and to the point.'
  },
  kik: {
    de: 'Du bist der KiK Assistent. Fokus auf Mode, Angebote und Filialen. Antworte kurz und freundlich.',
    en: 'You are the KiK assistant. Focus on fashion, deals, and stores. Be brief and friendly.'
  },
  circlek: {
    de: 'Du bist Karsten von Circle K. Fokus auf Wetter, Services und kurze hilfreiche Antworten.',
    en: 'You are Karsten from Circle K. Focus on weather, services, and concise helpful replies.'
  }
};

export async function getGeminiResponse(userMessage, weatherContext = '', brand = 'obi') {
  try {
    console.log('🤖 Gemini Request:', { userMessage, hasWeatherContext: !!weatherContext });
    
    if (!GEMINI_API_KEY) {
      console.warn('❌ Gemini API key not found - returning offline message');
      const lang = languageManager.getLang();
      return lang === 'de'
        ? 'Die KI‑Antwort ist offline, weil kein API‑Schlüssel gesetzt ist.'
        : 'AI response is offline because no API key is set.';
    }
  
    // Detect intent
    const intent = detectIntent(userMessage);
    const city = extractCity(userMessage);
  
    // Update global city context if a new city is mentioned
    if (city) {
      setCurrentCity(city);
      console.log('🏙️ Updated global city context to:', city);
    }
  
    // Use detected city or fallback to stored context
    const targetCity = city || getCurrentCity();
  
    console.log('🎯 Detected intent:', intent, 'City:', city, 'Target City:', targetCity, 'Waiting for city:', waitingForCity);
  
    // If we're waiting for a city and user provides one
    if (waitingForCity && targetCity) {
      console.log('✅ City provided after request:', targetCity);
      waitingForCity = false;
      // Fetch forecast for the provided city
      const forecastData = await getWeeklyForecast(targetCity);
      const weatherSummary = weatherContext || (forecastData ? `Weather for ${targetCity}: ${forecastData?.forecast?.forecastday?.[0]?.day?.condition?.text || ''}, avg temp ${forecastData?.forecast?.forecastday?.[0]?.day?.avgtemp_c || ''}C.` : '');
      return await buildPrompt(userMessage, intent, targetCity, weatherSummary, brand);
    }
  
    // Handle forecast requests
    if (intent === 'forecast') {
      if (!targetCity) {
        waitingForCity = true;
        lastIntent = 'forecast';
        console.log('⚠️ No city detected, asking user...');
        return languageManager.getLang() === 'de'
          ? 'Für welche Stadt möchtest du das Wetter wissen?'
          : 'Which city would you like the weather for?';
      }
  
      waitingForCity = false;
      const forecastData = await getWeeklyForecast(targetCity);
      const weatherSummary = forecastData ? `Weather for ${targetCity}: ${forecastData?.forecast?.forecastday?.[0]?.day?.condition?.text || ''}, avg temp ${forecastData?.forecast?.forecastday?.[0]?.day?.avgtemp_c || ''}C.` : '';
      return await buildPrompt(userMessage, intent, targetCity, weatherSummary, brand);
    }
  
    // General intent
    return await buildPrompt(userMessage, intent, targetCity, weatherContext, brand);
  
  } catch (err) {
    console.error('❌ Gemini handler failed:', err);
    const lang = languageManager.getLang();
    return lang === 'de'
      ? 'Entschuldigung, etwas ist schiefgelaufen.'
      : 'Sorry, something went wrong.';
  }
}

async function buildPrompt(userMessage, intent, city, weatherSummary, brand = 'obi') {
  const lang = languageManager.getLang();
  const langInstruction = languageManager.getGeminiLanguageInstruction();
  const brandKey = brand && BRAND_PROMPTS[brand] ? brand : 'obi';
  const persona = BRAND_PROMPTS[brandKey][lang === 'de' ? 'de' : 'en'];
  const weatherLine = weatherSummary ? `\n${weatherSummary}` : '';
  const prompt = `${langInstruction}${persona}\nUser: ${userMessage}${weatherLine}`;

  const requestBody = { contents: [{ parts: [{ text: prompt }] }] };

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      console.error('❌ Gemini API error status:', response.status, response.statusText);
      return lang === 'de'
        ? 'Etwas ist schiefgelaufen. Bitte versuche es erneut.'
        : 'Something went wrong. Please try again.';
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('✅ Gemini Response:', text);
    return text;
  } catch (error) {
    console.error('❌ Gemini request failed:', error);
    return lang === 'de'
      ? 'Entschuldigung, ich konnte gerade keine Antwort generieren.'
      : 'Sorry, I could not generate a response right now.';
  }
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
          if (response.status === 404 || response.status === 429) continue; // Skip 404 and 429
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
