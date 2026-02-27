import languageManager from './language.js';
import { getWeeklyForecast, getCurrentCity, setCurrentCity } from './weather.js';

// Import product picker to get matching recommendations
let pickProductsFn = null;
try {
  const module = await import('./recommendations-multibrand.js');
  pickProductsFn = module.default?.pickProducts || null;
} catch (e) {
  console.warn('Could not load recommendations module:', e);
}

function getProductNames(brand, weatherSummary, lang) {
  if (!pickProductsFn) return [];
  try {
    const PRODUCT_DATA = {
      circlek: {
        products: [
          { id: 'ck-wash-premium', name: { de: 'Premium Autowäsche', en: 'Premium Car Wash' }, tags: ['rain', 'cloudy'] },
          { id: 'ck-wiper', name: { de: 'Scheibenwischer-Set', en: 'Wiper Blade Set' }, tags: ['rain', 'snow'] },
          { id: 'ck-rain-repellent', name: { de: 'Regenabweiser', en: 'Rain Repellent' }, tags: ['rain', 'cloudy'] },
          { id: 'ck-winter-kit', name: { de: 'Winter-Kit', en: 'Winter Kit' }, tags: ['snow', 'cold'] },
          { id: 'ck-coffee', name: { de: 'Heißgetränke To-Go', en: 'Hot Drinks To-Go' }, tags: ['rain', 'cold', 'snow'] }
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
  
  // Get matching product recommendations
  const productNames = getProductNames('circlek', weatherSummary, lang);
  const productHint = productNames.length > 0
    ? (lang === 'de'
      ? `\nProduktempfehlungen basierend auf dem Wetter: ${productNames.join(', ')}. Integriere diese Produkte natürlich in deine Antwort, z.B. "Bei diesem Wetter lohnt sich..." oder "Perfekt für eine..." - vermeide roboterhafte Auflistungen.`
      : `\nProduct recommendations based on weather: ${productNames.join(', ')}. Integrate these products naturally into your response, e.g., "With this weather, it's perfect for..." or "Great time for..." - avoid robotic lists.`)
    : '';
  
  const persona = lang === 'de'
    ? `Du bist ein freundlicher Circle K Assistent. Fokus auf Wetter, Services (Waschstraße, Tanken, Shop) und kurze hilfreiche Antworten. Wenn du Produkte empfiehlst, integriere sie natürlich in den Gesprächsfluss.${productHint}`
    : `You are a friendly Circle K assistant. Focus on weather, services (car wash, fuel, shop), and concise helpful replies. When recommending products, integrate them naturally into the conversation flow.${productHint}`;
  const weatherLine = weatherSummary ? `\n${weatherSummary}` : '';
  const angleLine = angle ? `\n${angle}` : '';
  const prompt = `${langInstruction}${persona}${angleLine}\nUser: ${userMessage}${weatherLine}`;
  const requestBody = { message: userMessage, weatherContext: weatherSummary, brand: 'circlek', angle };

  if (!GEMINI_API_KEY) {
    return lang === 'de'
      ? 'GEMINI_API_KEY fehlt. Bitte setze ihn in deiner env-Datei.'
      : 'GEMINI_API_KEY is missing. Please set it in your env file.';
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
      console.error('Gemini CircleK HTTP error', response.status, text);
      return lang === 'de'
        ? 'Etwas ist schiefgelaufen. Bitte versuche es erneut.'
        : 'Something went wrong. Please try again.';
    }
    const data = JSON.parse(text);
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (error) {
    console.error('Gemini CircleK request failed:', error);
    return lang === 'de'
      ? 'Entschuldigung, ich konnte gerade keine Antwort generieren.'
      : 'Sorry, I could not generate a response right now.';
  }
}
