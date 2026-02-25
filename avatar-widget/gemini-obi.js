import languageManager from './language.js';
import { getWeeklyForecast, getCurrentCity, setCurrentCity } from './weather.js';

const PROXY_BASE = (typeof window !== 'undefined' && window.PROXY_BASE) || '';

function detectIntent(userMessage) {
  const msg = userMessage.toLowerCase();
  if (msg.includes('wetter') || msg.includes('weather') || msg.includes('vorhersage') || msg.includes('forecast')) {
    return 'forecast';
  }
  return 'general';
}

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
      if (city === 'munich') return 'München';
      if (city === 'cologne') return 'Köln';
      if (city === 'nuremberg') return 'Nürnberg';
      return city.charAt(0).toUpperCase() + city.slice(1);
    }
  }
  return null;
}

export async function getGeminiResponse(userMessage, weatherContext = '') {
  const intent = detectIntent(userMessage);
  const city = extractCity(userMessage);
  if (city) setCurrentCity(city);
  const targetCity = city || getCurrentCity();

  if (intent === 'forecast') {
    if (!targetCity) {
      return languageManager.getLang() === 'de'
        ? 'Für welche Stadt möchtest du das Wetter wissen?'
        : 'Which city would you like the weather for?';
    }
    const forecastData = await getWeeklyForecast(targetCity);
    const weatherSummary = forecastData ? `Weather for ${targetCity}: ${forecastData?.forecast?.forecastday?.[0]?.day?.condition?.text || ''}, avg temp ${forecastData?.forecast?.forecastday?.[0]?.day?.avgtemp_c || ''}C.` : '';
    return await buildPrompt(userMessage, weatherSummary);
  }

  return await buildPrompt(userMessage, weatherContext);
}

async function buildPrompt(userMessage, weatherSummary = '') {
  const lang = languageManager.getLang();
  const langInstruction = languageManager.getGeminiLanguageInstruction();
  const persona = lang === 'de'
    ? 'Du bist der OBI Assistent. Antworte kurz, hilfsbereit und sachlich.'
    : 'You are the OBI assistant. Reply briefly, helpfully, and to the point.';
  const weatherLine = weatherSummary ? `\n${weatherSummary}` : '';
  const prompt = `${langInstruction}${persona}\nUser: ${userMessage}${weatherLine}`;
  const requestBody = { message: userMessage, weatherContext: weatherSummary, brand: 'obi' };

  try {
    const response = await fetch(`${PROXY_BASE}/api/gemini`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    if (!response.ok) {
      const text = await response.text();
      console.error('Gemini OBI HTTP error', response.status, text);
      return weatherSummary || (lang === 'de'
        ? 'Etwas ist schiefgelaufen. Bitte versuche es erneut.'
        : 'Something went wrong. Please try again.');
    }
    const data = await response.json();
    return data?.reply || '';
  } catch (error) {
    console.error('Gemini OBI request failed:', error);
    return weatherSummary || (lang === 'de'
      ? 'Entschuldigung, ich konnte gerade keine Antwort generieren.'
      : 'Sorry, I could not generate a response right now.');
  }
}

export async function getClothingRecommendation(weatherData, lang = 'en') {
  // Reuse OBI logic for clothing suggestions
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
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch {
    return null;
  }
}
