import languageManager from './language.js';
import { speak, speakThen } from './voice.js';
import { getClothingRecommendation } from './gemini.js';

const WEATHER_API_KEY = (typeof process !== 'undefined' && process.env && process.env.WEATHER_API_KEY)
  || (typeof window !== 'undefined' && window.ENV && window.ENV.WEATHER_API_KEY)
  || '';

// Log Weather API key status
console.log('🌤️ Weather API Status:', {
  keyPresent: !!WEATHER_API_KEY,
  keyLength: WEATHER_API_KEY ? WEATHER_API_KEY.length : 0,
  keyPreview: WEATHER_API_KEY ? `${WEATHER_API_KEY.substring(0, 8)}...` : 'Not set (will use Open-Meteo fallback)'
});

let fetchWeatherPromise = null;
let clothingRecommendationCache = null;
let lastWeatherData = null;
let clothingCacheInterval = null;

export async function getWeatherSummary() {
  try {
    const cityQuery = 'Berlin';
    const lang = languageManager.getWeatherLangCode();
    const weatherUrl = `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(cityQuery)}&lang=${lang}`;
    const res = await fetch(weatherUrl);
    if (res.ok) {
      const data = await res.json();
      const city = data?.location?.name || (lang === 'de' ? 'deiner Gegend' : 'your area');
      const condition = (data?.current?.condition?.text || (lang === 'de' ? 'klarer Himmel' : 'clear sky')).toLowerCase();
      const temp = Math.round(data?.current?.temp_c);
      const feels = Math.round(data?.current?.feelslike_c);
      const humidity = Math.round(data?.current?.humidity);
      if (lang === 'de') {
        return `In ${city} ist es ${condition}, ${temp}°C (fühlt sich an wie ${feels}°C), Luftfeuchtigkeit ${humidity}%.`;
      }
      return `In ${city}, it is ${condition}, ${temp}°C (feels like ${feels}°C), humidity ${humidity}%.`;
    }
  } catch {}
  try {
    const lat = 52.52;
    const lon = 13.405;
    const omUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`;
    const res2 = await fetch(omUrl);
    if (res2.ok) {
      const data2 = await res2.json();
      const temp2 = Math.round(data2.current?.temperature_2m);
      const code = data2.current?.weather_code;
      const desc2 = mapWeatherCode(code, languageManager.getLang());
      if (languageManager.getLang() === 'de') {
        return `In deiner Nähe sind es ${temp2}°C mit ${desc2}.`;
      }
      return `Near your location, it's ${temp2}°C with ${desc2}.`;
    }
  } catch {}
  return languageManager.t('weather-unavailable');
}

export async function fetchWeatherAndSpeak() {
  if (fetchWeatherPromise) return fetchWeatherPromise;
  try {
    fetchWeatherPromise = (async () => {
      const cityQuery = 'Berlin';
      const lang = languageManager.getWeatherLangCode();
      const currentLangCode = languageManager.getLang();
      if (WEATHER_API_KEY) {
        const weatherUrl = `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(cityQuery)}&lang=${lang}`;
        let res;
        try { res = await fetch(weatherUrl); } catch {}
        if (res && res.ok) {
          const data = await res.json();
          const city = data?.location?.name || (currentLangCode === 'de' ? 'deiner Gegend' : 'your area');
          const condition = (data?.current?.condition?.text || (currentLangCode === 'de' ? 'klarer Himmel' : 'clear sky')).toLowerCase();
          const temp = Math.round(data?.current?.temp_c);
          const feels = Math.round(data?.current?.feelslike_c);
          const humidity = Math.round(data?.current?.humidity);
          const weatherSummary = currentLangCode === 'de'
            ? `Guten Tag! In ${city} ist es derzeit ${condition} mit ${temp} Grad Celsius, fühlt sich an wie ${feels}. Die Luftfeuchtigkeit beträgt ${humidity} Prozent.`
            : `Good day! In ${city}, it is currently ${condition} with ${temp} degrees Celsius, feeling like ${feels}. Humidity is ${humidity} percent.`;
          await new Promise((resolve) => {
            speakThen(weatherSummary, async () => {
              const clothingAdvice = await getCachedClothingRecommendation(data, currentLangCode);
              if (clothingAdvice) {
                const promoMessage = currentLangCode === 'de' 
                  ? ' Kaufen Sie bei uns ein, wir haben alles für Sie!'
                  : ' Shop with us, we got you covered!';
                speak(clothingAdvice + promoMessage);
              }
              resolve();
            });
          });
          return { provider: 'weatherapi', data };
        }
      }
      const lat = 52.52;
      const lon = 13.405;
      const omUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`;
      const res2 = await fetch(omUrl);
      if (!res2.ok) throw new Error(`OpenMeteo HTTP ${res2.status}`);
      const data2 = await res2.json();
      const temp2 = Math.round(data2.current?.temperature_2m);
      const code = data2.current?.weather_code;
      const desc2 = mapWeatherCode(code, currentLangCode);
      const simplifiedData = { current: { temp_c: temp2, condition: { text: desc2 } } };
      const weatherSummary2 = currentLangCode === 'de'
        ? `Gerade jetzt in deiner Nähe sind es ${temp2} Grad Celsius mit ${desc2}.`
        : `Right now near you, it's ${temp2} degrees Celsius with ${desc2}.`;
      await new Promise((resolve) => {
        speakThen(weatherSummary2, async () => {
          const clothingAdvice = await getCachedClothingRecommendation(simplifiedData, currentLangCode);
          if (clothingAdvice) {
            const promoMessage = currentLangCode === 'de' 
              ? ' Kaufen Sie bei uns ein, wir haben alles für Sie!'
              : ' Shop with us, we got you covered!';
            speak(clothingAdvice + promoMessage);
          }
          resolve();
        });
      });
      return { provider: 'open-meteo', data: data2 };
    })();
    return await fetchWeatherPromise;
  } catch (e) {
    console.error('Weather error:', e);
    speak(languageManager.t('weather-error'));
  } finally {
    fetchWeatherPromise = null;
  }
}

export function startClothingRecommendationCache() {
  if (clothingCacheInterval) {
    clearInterval(clothingCacheInterval);
  }
  updateClothingRecommendationCache();
  clothingCacheInterval = setInterval(() => {
    updateClothingRecommendationCache();
  }, 120000);
}

async function updateClothingRecommendationCache() {
  try {
    const cityQuery = 'Berlin';
    const lang = languageManager.getWeatherLangCode();
    const currentLangCode = languageManager.getLang();
    if (WEATHER_API_KEY) {
      const weatherUrl = `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(cityQuery)}&lang=${lang}`;
      let res;
      try { res = await fetch(weatherUrl); } catch {}
      if (res && res.ok) {
        const data = await res.json();
        lastWeatherData = data;
        const recommendation = await getClothingRecommendation(data, currentLangCode);
        if (recommendation) {
          clothingRecommendationCache = recommendation;
        }
      }
    }
  } catch {}
}

async function getCachedClothingRecommendation(weatherData, lang = 'en') {
  if (clothingRecommendationCache && lastWeatherData) {
    const cachedTemp = Math.round(lastWeatherData?.current?.temp_c);
    const currentTemp = Math.round(weatherData?.current?.temp_c);
    if (Math.abs(cachedTemp - currentTemp) <= 2) {
      return clothingRecommendationCache;
    }
  }
  return await getClothingRecommendation(weatherData, lang);
}

export function mapWeatherCode(code, lang = 'en') {
  if (lang === 'de') {
    if (code === 0) return 'klarem Himmel';
    if ([1,2,3].includes(code)) return 'teilweise bewölktem Himmel';
    if ([45,48].includes(code)) return 'nebligen Bedingungen';
    if ([51,53,55,56,57].includes(code)) return 'leichtem Nieselregen';
    if ([61,63,65,66,67].includes(code)) return 'Regen';
    if ([71,73,75,77].includes(code)) return 'Schnee';
    if ([80,81,82].includes(code)) return 'Regenschauern';
    if ([85,86].includes(code)) return 'Schneeschauern';
    if ([95,96,99].includes(code)) return 'Gewittern';
    return 'gemischten Bedingungen';
  }
  if (code === 0) return 'a clear sky';
  if ([1,2,3].includes(code)) return 'partly cloudy skies';
  if ([45,48].includes(code)) return 'foggy conditions';
  if ([51,53,55,56,57].includes(code)) return 'light drizzle';
  if ([61,63,65,66,67].includes(code)) return 'rain';
  if ([71,73,75,77].includes(code)) return 'snow';
  if ([80,81,82].includes(code)) return 'rain showers';
  if ([85,86].includes(code)) return 'snow showers';
  if ([95,96,99].includes(code)) return 'thunderstorms';
  return 'mixed conditions';
}
