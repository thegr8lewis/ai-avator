import languageManager from './language.js';
import { getCurrentCity, setCurrentCity } from './weather.js';

function getProductNames(brand, weatherSummary, lang) {
  try {
    const PRODUCT_DATA = {
      kik: {
        products: [
          { id: 'kik-parka', name: { de: 'Wasserfester Parka', en: 'Waterproof Parka' }, tags: ['rain', 'cold'] },
          { id: 'kik-tee', name: { de: 'Basic T-Shirts 3er Pack', en: 'Basic T-Shirts 3-pack' }, tags: ['sunny', 'warm'] },
          { id: 'kik-winterset', name: { de: 'Winter-Accessoires Set', en: 'Winter Accessories Set' }, tags: ['snow', 'cold'] }
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
  if (msg.includes('filiale') || msg.includes('store') || msg.includes('shop')) return 'store';
  if (msg.includes('sale') || msg.includes('angebot') || msg.includes('angebote') || msg.includes('deal')) return 'deals';
  if (msg.includes('mode') || msg.includes('fashion') || msg.includes('kleid') || msg.includes('shirt') || msg.includes('jeans')) return 'fashion';
  return 'general';
}

function extractCity(userMessage) {
  const msg = userMessage.toLowerCase();
  const cities = [
    'berlin', 'hamburg', 'münchen', 'munich', 'köln', 'cologne', 'frankfurt', 'stuttgart',
    'leipzig', 'dortmund', 'essen', 'bremen', 'dresden', 'hannover', 'nürnberg', 'nuremberg'
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

export async function getGeminiResponse(userMessage, context = '', brand = 'kik') {
  const lang = languageManager.getLang();
  const intent = detectIntent(userMessage);
  const city = extractCity(userMessage);
  if (city) setCurrentCity(city);
  const storeHint = city ? (lang === 'de' ? `Nächste Filiale in/bei ${city} erwähnen.` : `Mention nearest store in/near ${city}.`) : '';

  return await buildPrompt(userMessage, context, intent, storeHint);
}

async function buildPrompt(userMessage, extraContext = '', intent = 'general', storeHint = '') {
  const lang = languageManager.getLang();
  const langInstruction = languageManager.getGeminiLanguageInstruction();
  
  // Get matching product recommendations
  const productNames = getProductNames('kik', extraContext, lang);
  const productHint = productNames.length > 0
    ? (lang === 'de'
      ? `\nProduktempfehlungen basierend auf dem Wetter: ${productNames.join(', ')}. Integriere diese Produkte natürlich in deine Antwort, z.B. "Bei diesem Wetter passt perfekt..." oder "Ideal wäre jetzt..." - vermeide roboterhafte Auflistungen.`
      : `\nProduct recommendations based on weather: ${productNames.join(', ')}. Integrate these products naturally into your response, e.g., "This weather is perfect for..." or "You might want..." - avoid robotic lists.`)
    : '';
  
  const persona = lang === 'de'
    ? `Du bist der KiK Assistent. Fokus auf Mode, Angebote, Filialen und Schnäppchen. Antworte kurz, freundlich und nenne konkrete Tipps. Wenn du Produkte empfiehlst, integriere sie natürlich in den Gesprächsfluss.${productHint}`
    : `You are the KiK assistant. Focus on fashion, deals, stores, and bargains. Be brief, friendly, and provide concrete tips. When recommending products, integrate them naturally into the conversation flow.${productHint}`;

  const angle = intent === 'deals'
    ? (lang === 'de' ? 'Heb aktuelle Rabatte oder Sales hervor.' : 'Highlight current discounts or sales.')
    : intent === 'fashion'
      ? (lang === 'de' ? 'Gib Styling- oder Größenhinweise.' : 'Provide styling or sizing hints.')
      : intent === 'store'
        ? (lang === 'de' ? 'Hilf beim Finden einer Filiale.' : 'Help find a nearby store.')
        : '';

  const ctxLine = extraContext ? `\n${extraContext}` : '';
  const storeLine = storeHint ? `\n${storeHint}` : '';
  const prompt = `${langInstruction}${persona}\n${angle}${storeLine}\nUser: ${userMessage}${ctxLine}`;
  const requestBody = { message: userMessage, weatherContext: extraContext, brand: 'kik', intent, storeHint };

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
      console.error('Gemini KiK HTTP error', response.status, text);
      return lang === 'de'
        ? 'Etwas ist schiefgelaufen. Bitte versuche es erneut.'
        : 'Something went wrong. Please try again.';
    }
    const data = JSON.parse(text);
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (error) {
    console.error('Gemini KiK request failed:', error);
    return lang === 'de'
      ? 'Entschuldigung, ich konnte gerade keine Antwort generieren.'
      : 'Sorry, I could not generate a response right now.';
  }
}
