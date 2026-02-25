import languageManager from './language.js';
import { getWeeklyForecast, getCurrentCity, setCurrentCity } from './weather.js';

const PROXY_BASE = (typeof window !== 'undefined' && window.PROXY_BASE) || '';

function detectIntent(userMessage) {
  const msg = userMessage.toLowerCase();
  if (msg.includes('wetter') || msg.includes('weather') || msg.includes('vorhersage') || msg.includes('forecast')) return 'forecast';
  if (msg.includes('reifen') || msg.includes('tire')) return 'tires';
  if (msg.includes('schnee') || msg.includes('snow')) return 'snow';
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
  const lang = languageManager.getLang();
  const intent = detectIntent(userMessage);
  const city = extractCity(userMessage);
  if (city) setCurrentCity(city);
  const targetCity = city || getCurrentCity();

  if (intent === 'forecast' || intent === 'tires' || intent === 'snow') {
    if (!targetCity) {
      return lang === 'de'
        ? 'Für welche Region möchtest du die Vorhersage?'
        : 'Which region would you like the forecast for?';
    }
    const forecastData = await getWeeklyForecast(targetCity);
    const condition = forecastData?.forecast?.forecastday?.[0]?.day?.condition?.text || '';
    const temp = forecastData?.forecast?.forecastday?.[0]?.day?.avgtemp_c;
    const weatherSummary = forecastData ? `Weather for ${targetCity}: ${condition}, avg temp ${temp || ''}C.` : '';
    // Trigger UI recommendations even if condition is missing
    if (typeof window !== 'undefined' && typeof window.showWeatherRecommendations === 'function') {
      window.showWeatherRecommendations(condition || 'Current weather', temp);
    }
    const angle = intent === 'tires' ? 'Kleiner Tipp zu Reifen und Service.' : intent === 'snow' ? 'Hinweis auf Schnee & Sicherheit.' : 'Kurz zur Vorhersage & Service.';
    return await buildPrompt(userMessage, weatherSummary, angle);
  }

  return await buildPrompt(userMessage, weatherContext, 'Service & Angebote kurz anreißen.');
}

async function buildPrompt(userMessage, weatherSummary = '', angle = '') {
  const lang = languageManager.getLang();
  const langInstruction = languageManager.getGeminiLanguageInstruction();
  const persona = lang === 'de'
    ? 'Du bist Karsten von Circle K. Fokus auf Wetter, Services (Waschstraße, Tanken, Shop) und kurze hilfreiche Antworten. Sprich immer aus der Ich-Perspektive als Karsten von Circle K.'
    : 'You are Karsten from Circle K. Focus on weather, services (car wash, fuel, shop), and concise helpful replies. Always speak in first person as Karsten from Circle K.';
  const weatherLine = weatherSummary ? `\n${weatherSummary}` : '';
  const angleLine = angle ? `\n${angle}` : '';
  const prompt = `${langInstruction}${persona}${angleLine}\nUser: ${userMessage}${weatherLine}`;
  const requestBody = { message: userMessage, weatherContext: weatherSummary, brand: 'circlek', angle };

  try {
    const response = await fetch(`${PROXY_BASE}/api/gemini`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    if (!response.ok) {
      const text = await response.text();
      console.error('Gemini CircleK HTTP error', response.status, text);
      return lang === 'de'
        ? 'Etwas ist schiefgelaufen. Bitte versuche es erneut.'
        : 'Something went wrong. Please try again.';
    }
    const data = await response.json();
    return data?.reply || '';
  } catch (error) {
    console.error('Gemini CircleK request failed:', error);
    return lang === 'de'
      ? 'Entschuldigung, ich konnte gerade keine Antwort generieren.'
      : 'Sorry, I could not generate a response right now.';
  }
}
