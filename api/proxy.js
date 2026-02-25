// Vercel serverless proxy for Gemini, WeatherAPI, and ElevenLabs TTS
// Reads environment variables from Vercel project settings:
//   GEMINI_API_KEY, WEATHER_API_KEY, ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID
// Routes:
//   POST /api/gemini
//   GET  /api/weather?city=Berlin
//   POST /api/tts

function sendJson(res, status, data, headers = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
  res.end(JSON.stringify(data));
}

async function parseBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1e6) req.destroy();
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}

function parseQuery(urlStr) {
  try {
    return new URL(urlStr, 'http://localhost').searchParams;
  } catch {
    return new URLSearchParams();
  }
}

async function handleGemini(res, body) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
  if (!GEMINI_API_KEY) return sendJson(res, 500, { error: 'GEMINI_API_KEY missing on server' });
  const { message, weatherContext = '', brand = 'generic' } = body || {};
  if (!message) return sendJson(res, 400, { error: 'message required' });

  const persona = brand === 'circlek'
    ? 'You are Karsten from Circle K. Be brief and helpful.'
    : brand === 'obi'
      ? 'You are the OBI assistant. Be brief and helpful.'
      : brand === 'kik'
        ? 'You are the KiK assistant. Be brief and helpful.'
        : 'Be brief and helpful.';
  const prompt = `${persona}\nUser: ${message}${weatherContext ? `\n${weatherContext}` : ''}`;
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=' + GEMINI_API_KEY;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const text = await response.text();
    if (!response.ok) return sendJson(res, response.status, { error: 'gemini_error', detail: text });
    const data = JSON.parse(text);
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return sendJson(res, 200, { reply });
  } catch (err) {
    return sendJson(res, 500, { error: 'gemini_request_failed', detail: String(err) });
  }
}

async function handleElevenLabs(res, body) {
  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';
  if (!ELEVENLABS_API_KEY) return sendJson(res, 500, { error: 'ELEVENLABS_API_KEY missing on server' });
  const requestedVoice = body?.voiceId;
  const chosenVoice = requestedVoice || process.env.ELEVENLABS_VOICE_ID || 'Cs1wOITy9rzt9SkpOKnu';
  const modelId = body?.modelId || 'eleven_multilingual_v2';
  const { text } = body || {};
  if (!text) return sendJson(res, 400, { error: 'text required' });
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${chosenVoice}/stream`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.85,
          style: 0.0,
          use_speaker_boost: true
        }
      })
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    if (!response.ok) {
      return sendJson(res, response.status, { error: 'elevenlabs_error', detail: buffer.toString('utf-8') });
    }
    const b64 = buffer.toString('base64');
    return sendJson(res, 200, { audioBase64: b64, contentType: 'audio/mpeg' });
  } catch (err) {
    return sendJson(res, 500, { error: 'elevenlabs_request_failed', detail: String(err) });
  }
}

async function handleWeather(res, query) {
  const WEATHER_API_KEY = process.env.WEATHER_API_KEY || '';
  if (!WEATHER_API_KEY) return sendJson(res, 500, { error: 'WEATHER_API_KEY missing on server' });
  const city = query.get('city');
  if (!city) return sendJson(res, 400, { error: 'city required' });
  const url = `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(city)}&days=3&aqi=no&alerts=no`;
  try {
    const response = await fetch(url);
    const text = await response.text();
    if (!response.ok) return sendJson(res, response.status, { error: 'weather_error', detail: text });
    return sendJson(res, 200, JSON.parse(text));
  } catch (err) {
    return sendJson(res, 500, { error: 'weather_request_failed', detail: String(err) });
  }
}

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;

  if (pathname.startsWith('/api/gemini') && req.method === 'POST') {
    const body = await parseBody(req);
    return handleGemini(res, body);
  }

  if (pathname.startsWith('/api/weather') && req.method === 'GET') {
    const query = parseQuery(req.url);
    return handleWeather(res, query);
  }

  if (pathname.startsWith('/api/tts') && req.method === 'POST') {
    const body = await parseBody(req);
    return handleElevenLabs(res, body);
  }

  return sendJson(res, 404, { error: 'not_found' });
}
