import languageManager from './language.js';
import { getWeeklyForecast, getCurrentCity, setCurrentCity } from './weather.js';

function getProductNames(brand, weatherSummary, lang) {
  try {
    const PRODUCT_DATA = {
      obi: {
        products: [
          { id: 'obi-grill', name: { de: 'Gasgrill Torino', en: 'Torino Gas Grill' }, tags: ['sunny', 'warm'] },
          { id: 'obi-terrasse', name: { de: 'Terrassenreiniger', en: 'Patio Cleaner' }, tags: ['rain', 'cloudy'] },
          { id: 'obi-heizstrahler', name: { de: 'Infrarot-Heizstrahler', en: 'Infrared Heater' }, tags: ['cold', 'cloudy'] },
          { id: 'obi-markise', name: { de: 'Sonnenschutz-Markise', en: 'Sunshade Awning' }, tags: ['sunny', 'warm'] },
          { id: 'obi-entfeuchter', name: { de: 'Luftentfeuchter 20L', en: 'Dehumidifier 20L' }, tags: ['rain', 'cold', 'cloudy'] },
          { id: 'obi-pellet', name: { de: 'Pelletheizung Starter', en: 'Pellet Heating Starter' }, tags: ['snow', 'cold'] }
        ]
      }
    };
    const s = String(weatherSummary || '').toLowerCase();
    const de = {
      snow: ['schnee', 'schneeschauer', 'schneefall', 'schneesturm'],
      rain: ['regen', 'niesel', 'nieselregen', 'schauer', 'regnerisch'],
      cold: ['kalt', 'kälte', 'frost', 'frieren', 'gefrier'],
      sunny: ['sonnig', 'sonne', 'heiter', 'klar', 'klarem himmel'],
      warm: ['warm', 'heiß', 'heiss', 'hitze'],
      cloudy: ['wolkig', 'bewölkt', 'ueberwiegend bewölkt', 'überwiegend bewölkt', 'bedeckt']
    };
    const en = {
      snow: ['snow', 'snowy', 'snow showers'],
      rain: ['rain', 'drizzle', 'showers', 'rainy'],
      cold: ['cold', 'frost', 'freez'],
      sunny: ['sunny', 'sun', 'clear'],
      warm: ['warm', 'hot', 'heat'],
      cloudy: ['cloud', 'overcast']
    };
    const hasAny = (arr) => arr.some(w => s.includes(w));
    let tag = 'cloudy';
    if (hasAny(de.snow) || hasAny(en.snow)) tag = 'snow';
    else if (hasAny(de.rain) || hasAny(en.rain)) tag = 'rain';
    else if (hasAny(de.cold) || hasAny(en.cold)) tag = 'cold';
    else if (hasAny(de.sunny) || hasAny(en.sunny)) tag = 'sunny';
    else if (hasAny(de.warm) || hasAny(en.warm)) tag = 'warm';
    else if (hasAny(de.cloudy) || hasAny(en.cloudy)) tag = 'cloudy';
    else {
      const m = s.match(/(-?\d+)\s*(?:°\s*C|°c|°|grad|degrees|degree)/);
      if (m) {
        const t = parseInt(m[1], 10);
        if (!isNaN(t)) {
          if (t <= 5) tag = 'cold';
          else if (t >= 24) tag = 'warm';
        }
      }
    }
    const products = PRODUCT_DATA[brand]?.products.filter(p => p.tags.some(t => tag.includes(t) || t.includes(tag))) || [];
    const finalProducts = products.length ? products : (PRODUCT_DATA[brand]?.products || []);
    return finalProducts.slice(0, 3).map(p => p.name[lang] || p.name.en);
  } catch (e) {
    console.error('Error picking products:', e);
    return [];
  }
}

const GEMINI_API_KEY = (typeof window !== 'undefined' && window.GEMINI_API_KEY && !String(window.GEMINI_API_KEY).includes('REPLACE_WITH'))
  ? String(window.GEMINI_API_KEY)
  : '';

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
  
  // Get matching product recommendations
  const productNames = getProductNames('obi', weatherSummary, lang);
  const productHint = productNames.length > 0
    ? (lang === 'de'
      ? `\nProduktempfehlungen basierend auf dem Wetter: ${productNames.join(', ')}. Integriere diese Produkte natürlich in deine Antwort, z.B. "Bei diesem Wetter eignet sich..." oder "Perfekt für..." - vermeide roboterhafte Auflistungen.`
      : `\nProduct recommendations based on weather: ${productNames.join(', ')}. Integrate these products naturally into your response, e.g., "This weather is great for..." or "Perfect time for..." - avoid robotic lists.`)
    : '';
  
  const persona = lang === 'de'
    ? `Du bist der OBI Assistent. Antworte kurz, hilfsbereit und sachlich. Wenn du Produkte empfiehlst, integriere sie natürlich in den Gesprächsfluss.${productHint}`
    : `You are the OBI assistant. Reply briefly, helpfully, and to the point. When recommending products, integrate them naturally into the conversation flow.${productHint}`;
  const weatherLine = weatherSummary ? `\n${weatherSummary}` : '';
  const prompt = `${langInstruction}${persona}\nUser: ${userMessage}${weatherLine}`;
  const requestBody = { message: userMessage, weatherContext: weatherSummary, brand: 'obi' };

  if (!GEMINI_API_KEY) {
    return weatherSummary || (lang === 'de'
      ? 'GEMINI_API_KEY fehlt. Bitte setze ihn in deiner env-Datei.'
      : 'GEMINI_API_KEY is missing. Please set it in your env file.');
  }

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=' + encodeURIComponent(GEMINI_API_KEY);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const text = await response.text();
    if (!response.ok) {
      console.error('Gemini OBI HTTP error', response.status, text);
      return weatherSummary || (lang === 'de'
        ? 'Etwas ist schiefgelaufen. Bitte versuche es erneut.'
        : 'Something went wrong. Please try again.');
    }
    const data = JSON.parse(text);
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
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
