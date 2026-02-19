import languageManager from './language.js';
import { speak, speakThen } from './voice.js';
import { getClothingRecommendation } from './gemini.js';
import { showWashPrograms, showCarCareProducts } from './recommendations.js';

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
let forecastCache = {};
let currentCity = null;

export function getCurrentCity() {
  return currentCity;
}

export function setCurrentCity(city) {
  if (city) currentCity = city;
}

async function getCoordinates(city) {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        return {
          lat: data.results[0].latitude,
          lon: data.results[0].longitude,
          name: data.results[0].name
        };
      }
    }
  } catch (e) {
    console.warn('Geocoding failed:', e);
  }
  return null;
}

export async function getWeatherSummary(city = null) {
  console.log('🌤️ getWeatherSummary called with city:', city);
  try {
    // Use provided city or fall back to last known city
    const cityQuery = city || currentCity;
    
    if (!cityQuery) {
      console.log('⚠️ No city provided for weather summary');
      return null;
    }
    
    // Update current city if a new one is provided
    if (city) currentCity = city;
    
    console.log('🌤️ Using cityQuery:', cityQuery);
    const lang = languageManager.getWeatherLangCode();
    
    if (WEATHER_API_KEY) {
      const weatherUrl = `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(cityQuery)}&lang=${lang}`;
      const res = await fetch(weatherUrl);
      if (res.ok) {
        const data = await res.json();
        const cityName = data?.location?.name || (lang === 'de' ? 'deiner Gegend' : 'your area');
        console.log('🌤️ Weather API returned city:', cityName);
        const condition = (data?.current?.condition?.text || (lang === 'de' ? 'klarer Himmel' : 'clear sky')).toLowerCase();
        const temp = Math.round(data?.current?.temp_c);
        const feels = Math.round(data?.current?.feelslike_c);
        const humidity = Math.round(data?.current?.humidity);
        if (lang === 'de') {
          return `In ${cityName} ist es ${condition}, ${temp}°C (fühlt sich an wie ${feels}°C), Luftfeuchtigkeit ${humidity}%.`;
        }
        return `In ${cityName}, it is ${condition}, ${temp}°C (feels like ${feels}°C), humidity ${humidity}%.`;
      }
    }
  } catch {}
  
  // Fallback to Open-Meteo
  try {
    let lat;
    let lon;
    let cityName;
    let isGeneric = false;

    if (cityQuery) {
      const coords = await getCoordinates(cityQuery);
      if (coords) {
        lat = coords.lat;
        lon = coords.lon;
        cityName = coords.name;
      } else {
         return languageManager.t('weather-unavailable');
      }
    } else {
        return languageManager.t('weather-unavailable');
    }

    const omUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,relative_humidity_2m,apparent_temperature`;
    const res2 = await fetch(omUrl);
    if (res2.ok) {
      const data2 = await res2.json();
      const temp2 = Math.round(data2.current?.temperature_2m);
      const feels2 = Math.round(data2.current?.apparent_temperature);
      const humidity2 = Math.round(data2.current?.relative_humidity_2m);
      const code = data2.current?.weather_code;
      const desc2 = mapWeatherCode(code, languageManager.getLang());
      
      if (languageManager.getLang() === 'de') {
        return `In ${cityName} sind es ${temp2}°C (gefühlt ${feels2}°C) mit ${desc2}, Luftfeuchtigkeit ${humidity2}%.`;
      }
      return `In ${cityName}, it's ${temp2}°C (feels like ${feels2}°C) with ${desc2}, humidity ${humidity2}%.`;
    }
  } catch {}
  return languageManager.t('weather-unavailable');
}

export async function fetchWeatherAndSpeak(city = null) {
  if (fetchWeatherPromise) return fetchWeatherPromise;
  
  // Use provided city or fall back to last known city
  const cityQuery = city || currentCity;
  
  if (!cityQuery) {
    const question = languageManager.t('region-question');
    speak(question);
    return null;
  }
  
  // Update current city if a new one is provided
  if (city) currentCity = city;

  try {
    fetchWeatherPromise = (async () => {
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
      
      const coords = await getCoordinates(cityQuery);
      if (!coords) {
         speak(languageManager.t('weather-unavailable'));
         return null;
      }
      
      const lat = coords.lat;
      const lon = coords.lon;
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

async function updateClothingRecommendationCache(city = null) {
  try {
    const cityQuery = city || currentCity;
    if (!cityQuery) return;
    
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

// Get weekly forecast for a specific city
export async function getWeeklyForecast(city) {
  if (!city) return null;
  try {
    const lang = languageManager.getWeatherLangCode();
    
    // Try WeatherAPI first (has better forecast data)
    if (WEATHER_API_KEY) {
      const forecastUrl = `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(city)}&days=7&lang=${lang}`;
      const res = await fetch(forecastUrl);
      if (res.ok) {
        const data = await res.json();
        forecastCache[city] = data;
        return data;
      }
    }
    
    // Fallback to Open-Meteo
    const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=${lang}`;
    const geoRes = await fetch(geocodeUrl);
    if (!geoRes.ok) throw new Error('Geocoding failed');
    const geoData = await geoRes.json();
    if (!geoData.results || geoData.results.length === 0) throw new Error('City not found');
    
    const { latitude, longitude } = geoData.results[0];
    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=auto`;
    const res = await fetch(forecastUrl);
    if (!res.ok) throw new Error('Forecast fetch failed');
    const data = await res.json();
    forecastCache[city] = data;
    return data;
  } catch (e) {
    console.error('Forecast error:', e);
    return null;
  }
}

// Check if snow is expected in forecast
export function hasSnowInForecast(forecastData) {
  if (!forecastData) return false;
  
  // Check WeatherAPI format
  if (forecastData.forecast && forecastData.forecast.forecastday) {
    return forecastData.forecast.forecastday.some(day => {
      const condition = day.day?.condition?.text?.toLowerCase() || '';
      return condition.includes('snow') || condition.includes('schnee');
    });
  }
  
  // Check Open-Meteo format
  if (forecastData.daily && forecastData.daily.weathercode) {
    return forecastData.daily.weathercode.some(code => [71,73,75,77,85,86].includes(code));
  }
  
  return false;
}

// Generate Circle K specific forecast response
export function generateCircleKForecast(city, forecastData, context = 'general') {
  if (!forecastData) return null;
  
  const lang = languageManager.getLang();
  
  if (context === 'wash') {
    // Forecast for car wash recommendation
    if (lang === 'de') {
      return `Die Prognose für ${city} für die kommende Woche: Am Montag und Dienstag ist es noch trüb mit Regen. Ab Mittwoch wird es sonniger und wärmer. Mit Temperaturen bis zu 15 Grad. Ein idealer Zeitpunkt für eine intensive Autowäsche! Oder Du kommst am Dienstag vorbei. Dann ist es noch nicht so voll. Schau, was Circle K Dir dazu empfiehlt.`;
    }
    return `The forecast for ${city} for the coming week: Monday and Tuesday will still be cloudy with rain. From Wednesday it will be sunnier and warmer, with temperatures up to 15 degrees. An ideal time for an intensive car wash! Or come by on Tuesday when it's less busy. See what Circle K recommends.`;
  }
  
  if (context === 'tires') {
    // Forecast for tire change question
    const hasSnow = hasSnowInForecast(forecastData);
    if (lang === 'de') {
      if (hasSnow) {
        return `Es ist zwar gerade etwas wärmer als normal, aber es könnte in der übernächsten Woche nochmal kälter werden. Schnee ist tatsächlich noch möglich. Warte lieber noch etwas mit den Sommerreifen.`;
      }
      return `Es ist zwar gerade etwas wärmer als normal, aber es könnte in der übernächsten Woche nochmal kälter werden. Schnee ist jedoch nicht mehr zu erwarten. Passend zu den Sommerreifen hat Circle K auch noch einen Tipp für Dich!`;
    }
    if (hasSnow) {
      return `While it's a bit warmer than normal right now, it could get colder again in two weeks. Snow is actually still possible. Better wait a bit longer with the summer tires.`;
    }
    return `While it's a bit warmer than normal right now, it could get colder again in two weeks. However, snow is no longer expected. Circle K also has a tip for you regarding summer tires!`;
  }
  
  return null;
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
