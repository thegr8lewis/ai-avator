import languageManager from './language.js';
import { getCurrentCity, setCurrentCity } from './weather.js';

const GEMINI_API_KEY = (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY)
  || (typeof window !== 'undefined' && window.ENV && window.ENV.GEMINI_API_KEY)
  || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

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
  if (!GEMINI_API_KEY) {
    return lang === 'de'
      ? 'Die KI‑Antwort ist offline, weil kein API‑Schlüssel gesetzt ist.'
      : 'AI response is offline because no API key is set.';
  }

  const intent = detectIntent(userMessage);
  const city = extractCity(userMessage);
  if (city) setCurrentCity(city);
  const storeHint = city ? (lang === 'de' ? `Nächste Filiale in/bei ${city} erwähnen.` : `Mention nearest store in/near ${city}.`) : '';

  return await buildPrompt(userMessage, context, intent, storeHint);
}

async function buildPrompt(userMessage, extraContext = '', intent = 'general', storeHint = '') {
  const lang = languageManager.getLang();
  const langInstruction = languageManager.getGeminiLanguageInstruction();
  const persona = lang === 'de'
    ? 'Du bist der KiK Assistent. Fokus auf Mode, Angebote, Filialen und Schnäppchen. Antworte kurz, freundlich und nenne konkrete Tipps.'
    : 'You are the KiK assistant. Focus on fashion, deals, stores, and bargains. Be brief, friendly, and provide concrete tips.';

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
  const requestBody = { contents: [{ parts: [{ text: prompt }] }] };

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    if (!response.ok) {
      return lang === 'de'
        ? 'Etwas ist schiefgelaufen. Bitte versuche es erneut.'
        : 'Something went wrong. Please try again.';
    }
    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (error) {
    console.error('Gemini KiK request failed:', error);
    return lang === 'de'
      ? 'Entschuldigung, ich konnte gerade keine Antwort generieren.'
      : 'Sorry, I could not generate a response right now.';
  }
}
