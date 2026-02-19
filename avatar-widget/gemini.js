import languageManager from './language.js';
import { getWeeklyForecast, generateCircleKForecast, getCurrentCity, setCurrentCity, hasSnowInForecast } from './weather.js';
import { showWeatherRecommendations } from './recommendations-redesign.js';

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

// Detect Circle K specific intents
function detectIntent(userMessage) {
  const msg = userMessage.toLowerCase();
  
  // Forecast request
  if (msg.includes('wetter') && (msg.includes('woche') || msg.includes('vorhersage') || msg.includes('prognose'))) {
    return 'forecast';
  }
  if (msg.includes('weather') && (msg.includes('week') || msg.includes('forecast'))) {
    return 'forecast';
  }
  
  // Tire/summer tire question
  if (msg.includes('reifen') || msg.includes('sommerreifen') || msg.includes('tire')) {
    return 'tires';
  }
  
  // Snow question
  if (msg.includes('schnee') || msg.includes('snow')) {
    return 'snow';
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

export async function getGeminiResponse(userMessage, weatherContext = '') {
  try {
    console.log('🤖 Gemini Request:', { userMessage, hasWeatherContext: !!weatherContext });
    
    if (!GEMINI_API_KEY) {
    console.warn('❌ Gemini API key not found - returning offline message');
    const lang = languageManager.getLang();
    return lang === 'de'
      ? 'Die KI‑Antwort ist offline, weil kein API‑Schlüssel gesetzt ist.'
      : 'AI response is offline because no API key is set.';
  }
  
  // Detect intent for Circle K business logic
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
    const circleKResponse = generateCircleKForecast(targetCity, forecastData, lastIntent === 'tires' ? 'tires' : 'wash');
    if (circleKResponse) {
      // Trigger weather-based recommendations
      console.log('🎯 Setting up recommendations trigger (after city provided)...');
      setTimeout(() => {
        console.log('⏰ Timeout fired, showing recommendations');
        const currentWeather = forecastData?.forecast?.forecastday?.[0]?.day;
        const condition = currentWeather?.condition?.text || 'sunny';
        const temp = currentWeather?.avgtemp_c || 20;
        console.log('🌤️ Weather data:', { condition, temp });
        
        if (typeof showWeatherRecommendations === 'function') {
          console.log('✅ Calling showWeatherRecommendations');
          showWeatherRecommendations(condition, temp);
        } else {
          console.error('❌ showWeatherRecommendations is not a function');
        }
      }, 2000);
      lastIntent = null;
      return circleKResponse;
    }
  }
  
  // Handle forecast requests with Circle K logic
  if (intent === 'forecast') {
    if (!targetCity) {
      // Ask for city if not provided
      waitingForCity = true;
      lastIntent = 'forecast';
      console.log('⚠️ No city detected, asking user...');
      return languageManager.t('region-question');
    }
    
    // City provided - fetch forecast
    waitingForCity = false;
    console.log('✅ Fetching forecast for:', targetCity);
    const forecastData = await getWeeklyForecast(targetCity);
    const circleKResponse = generateCircleKForecast(targetCity, forecastData, 'wash');
    if (circleKResponse) {
      // Trigger weather-based recommendations after response
      console.log('🎯 Setting up recommendations trigger...');
      setTimeout(() => {
        console.log('⏰ Timeout fired, showing recommendations');
        const currentWeather = forecastData?.forecast?.forecastday?.[0]?.day;
        const condition = currentWeather?.condition?.text || 'sunny';
        const temp = currentWeather?.avgtemp_c || 20;
        console.log('🌤️ Weather data:', { condition, temp, forecastData });
        
        if (typeof showWeatherRecommendations === 'function') {
          console.log('✅ Calling showWeatherRecommendations');
          showWeatherRecommendations(condition, temp);
        } else {
          console.error('❌ showWeatherRecommendations is not a function:', typeof showWeatherRecommendations);
        }
      }, 2000);
      return circleKResponse;
    }
  }
  
  // Handle tire questions with Circle K logic
  if (intent === 'tires') {
    if (!targetCity) {
      // Ask for city if not provided
      waitingForCity = true;
      lastIntent = 'tires';
      console.log('⚠️ No city detected for tires, asking user...');
      return languageManager.t('region-question');
    }

    const forecastData = await getWeeklyForecast(targetCity);
    // Use the Circle K logic to generate the tire recommendation
    const circleKResponse = generateCircleKForecast(targetCity, forecastData, 'tires');
    
    if (circleKResponse) {
      // Trigger weather-based recommendations
      console.log('🎯 Setting up recommendations trigger (tires)...');
      setTimeout(() => {
        console.log('⏰ Timeout fired, showing recommendations');
        const currentWeather = forecastData?.forecast?.forecastday?.[0]?.day;
        const condition = currentWeather?.condition?.text || 'sunny';
        const temp = currentWeather?.avgtemp_c || 20;
        console.log('🌤️ Weather data:', { condition, temp });
        
        if (typeof showWeatherRecommendations === 'function') {
          console.log('✅ Calling showWeatherRecommendations');
          showWeatherRecommendations(condition, temp);
        } else {
          console.error('❌ showWeatherRecommendations is not a function');
        }
      }, 2000);
      return circleKResponse;
    }
  }
  
  // Use Circle K system prompt
  const systemPrompt = languageManager.getCircleKSystemPrompt(intent, { city: targetCity });
  const prompt = weatherContext
    ? `${systemPrompt}\n${weatherContext}\n"${userMessage}"`
    : `${systemPrompt}\n"${userMessage}"`;

  const requestBody = { contents: [{ parts: [{ text: prompt }] }] };

  console.log('🎯 Calling Gemini 2.5 Flash-Lite...');
  
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API error:', response.status, errorText);
      
      if (response.status === 429) {
        const lang = languageManager.getLang();
        return lang === 'de'
          ? 'Entschuldigung, ich bin gerade überlastet. Bitte versuche es in ein paar Minuten erneut.'
          : 'Sorry, I\'m currently overloaded. Please try again in a few minutes.';
      }
      
      throw new Error(`Gemini API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      console.log('✅ Success with Gemini 2.5 Flash-Lite');
      const response = data.candidates[0].content.parts[0].text;
      
      // Trigger recommendations for weather-related queries
      if (weatherContext && targetCity) {
        console.log('🎯 Weather query detected, setting up recommendations trigger...');
        setTimeout(async () => {
          console.log('⏰ Timeout fired, fetching weather for recommendations');
          try {
            const forecastData = await getWeeklyForecast(targetCity);
            const currentWeather = forecastData?.forecast?.forecastday?.[0]?.day;
            const condition = currentWeather?.condition?.text || 'sunny';
            const temp = currentWeather?.avgtemp_c || 20;
            console.log('🌤️ Weather data for recommendations:', { condition, temp });
            
            if (typeof showWeatherRecommendations === 'function') {
              console.log('✅ Calling showWeatherRecommendations');
              showWeatherRecommendations(condition, temp);
            } else {
              console.error('❌ showWeatherRecommendations is not a function');
            }
          } catch (error) {
            console.error('❌ Error fetching weather for recommendations:', error);
          }
        }, 2000);
      }
      
      return response;
    } else {
      console.warn('❌ Invalid response format from Gemini');
      throw new Error('Invalid response format from Gemini API');
    }
  } catch (error) {
    console.error('❌ Gemini API error:', error);
    const lang = languageManager.getLang();
    return lang === 'de'
      ? 'Entschuldigung, ich konnte keine Antwort generieren. Bitte versuche es erneut.'
      : 'Sorry, I couldn\'t generate a response. Please try again.';
  }
  } catch (finalError) {
    console.error('CRITICAL GEMINI ERROR:', finalError);
    if (finalError.message.includes('429')) {
      const lang = languageManager.getLang();
      return lang === 'de'
        ? 'Entschuldigung, ich bin gerade überlastet. Bitte versuche es in ein paar Minuten erneut.'
        : 'Sorry, I\'m currently overloaded. Please try again in a few minutes.';
    }
    throw finalError;
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
