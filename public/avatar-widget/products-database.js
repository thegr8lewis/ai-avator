// Circle K Products Database
// Comprehensive product catalog with weather-based recommendations

export const CIRCLE_K_PRODUCTS = {
  washPrograms: [
    {
      id: 'wash-basic',
      name: { en: 'Basic Wash', de: 'Basis Wäsche' },
      description: { 
        en: 'Quick exterior wash with foam and rinse',
        de: 'Schnelle Außenwäsche mit Schaum und Spülung'
      },
      price: 7.90,
      duration: '5 min',
      icon: '💧',
      weatherConditions: ['sunny', 'cloudy', 'light-rain'],
      features: {
        en: ['Foam pre-wash', 'High-pressure rinse', 'Spot-free rinse'],
        de: ['Schaum-Vorwäsche', 'Hochdruck-Spülung', 'Fleckenfreie Spülung']
      },
      recommended: false
    },
    {
      id: 'wash-premium',
      name: { en: 'Premium Wash', de: 'Premium Wäsche' },
      description: { 
        en: 'Intensive cleaning with hot wax and shine dry',
        de: 'Intensive Reinigung mit Heißwachs und Glanztrocknung'
      },
      price: 12.90,
      duration: '8 min',
      icon: '🌟',
      weatherConditions: ['sunny', 'cloudy', 'after-rain'],
      features: {
        en: ['Hot wax protection', 'Underbody wash', 'Shine dry', 'Wheel cleaning'],
        de: ['Heißwachs-Schutz', 'Unterbodenwäsche', 'Glanztrocknung', 'Felgenreinigung']
      },
      recommended: true
    },
    {
      id: 'wash-deluxe',
      name: { en: 'Deluxe Wash', de: 'Deluxe Wäsche' },
      description: { 
        en: 'Complete package with underbody wash and wheel cleaning',
        de: 'Komplett-Paket mit Unterbodenwäsche und Felgenreinigung'
      },
      price: 16.90,
      duration: '12 min',
      icon: '💎',
      weatherConditions: ['sunny', 'after-rain', 'after-snow'],
      features: {
        en: ['Premium hot wax', 'Intensive underbody wash', 'Premium wheel cleaning', 'Bug remover', 'Shine dry', 'Rain repellent'],
        de: ['Premium Heißwachs', 'Intensive Unterbodenwäsche', 'Premium Felgenreinigung', 'Insektenentferner', 'Glanztrocknung', 'Regenabweiser']
      },
      recommended: false
    },
    {
      id: 'wash-winter-special',
      name: { en: 'Winter Protection', de: 'Winter-Schutz' },
      description: { 
        en: 'Special program for salt and grime removal',
        de: 'Spezialprogramm gegen Salz und Schmutz'
      },
      price: 14.90,
      duration: '10 min',
      icon: '❄️',
      weatherConditions: ['snow', 'after-snow', 'cold', 'salt-on-roads'],
      features: {
        en: ['Salt removal', 'Intensive underbody wash', 'Hot wax protection', 'Anti-freeze rinse'],
        de: ['Salzentfernung', 'Intensive Unterbodenwäsche', 'Heißwachs-Schutz', 'Frostschutz-Spülung']
      },
      recommended: false
    },
    {
      id: 'wash-spring-special',
      name: { en: 'Spring Fresh', de: 'Frühlings-Frische' },
      description: { 
        en: 'Perfect for sunny days - with bug remover',
        de: 'Perfekt für sonnige Tage - mit Insektenentferner'
      },
      price: 13.90,
      duration: '9 min',
      icon: '☀️',
      weatherConditions: ['sunny', 'warm', 'bugs'],
      features: {
        en: ['Bug remover', 'Pollen wash', 'Hot wax', 'Shine dry', 'UV protection'],
        de: ['Insektenentferner', 'Pollenwäsche', 'Heißwachs', 'Glanztrocknung', 'UV-Schutz']
      },
      recommended: false
    }
  ],

  carCareProducts: [
    {
      id: 'product-tire-care',
      name: { en: 'Tire Care Set', de: 'Reifenpflege-Set' },
      description: { 
        en: 'Tire shine and UV protection for summer tires',
        de: 'Reifenglanz und UV-Schutz für Sommerreifen'
      },
      price: 8.90,
      icon: '🛞',
      category: 'tires',
      weatherConditions: ['sunny', 'warm', 'tire-change-season'],
      features: {
        en: ['UV protection', 'Long-lasting shine', 'Easy application', 'Protects rubber'],
        de: ['UV-Schutz', 'Langanhaltender Glanz', 'Einfache Anwendung', 'Schützt Gummi']
      },
      inStock: true,
      recommended: false
    },
    {
      id: 'product-premium-wax',
      name: { en: 'Premium Car Wax', de: 'Premium Autowachs' },
      description: { 
        en: 'Long-lasting protection and high gloss',
        de: 'Langanhaltender Schutz und Hochglanz'
      },
      price: 12.90,
      icon: '🧽',
      category: 'protection',
      weatherConditions: ['sunny', 'after-wash'],
      features: {
        en: ['6-month protection', 'Deep shine', 'Water repellent', 'Easy to apply'],
        de: ['6-Monate Schutz', 'Tiefenglanz', 'Wasserabweisend', 'Einfach aufzutragen']
      },
      inStock: true,
      recommended: true
    },
    {
      id: 'product-spring-kit',
      name: { en: 'Spring Care Kit', de: 'Frühjahrs-Paket' },
      description: { 
        en: 'Complete set: Wax, wheel cleaner & cockpit spray',
        de: 'Komplett-Set: Wachs, Felgenreiniger & Cockpitspray'
      },
      price: 19.90,
      icon: '🌟',
      category: 'bundle',
      weatherConditions: ['spring', 'sunny', 'after-winter'],
      features: {
        en: ['Premium wax', 'Wheel cleaner', 'Cockpit spray', 'Microfiber cloth', 'Save €8'],
        de: ['Premium Wachs', 'Felgenreiniger', 'Cockpitspray', 'Mikrofasertuch', 'Spare €8']
      },
      inStock: true,
      recommended: false,
      discount: '30%'
    },
    {
      id: 'product-winter-kit',
      name: { en: 'Winter Protection Kit', de: 'Winter-Schutz-Set' },
      description: { 
        en: 'Everything for winter: De-icer, antifreeze, scraper',
        de: 'Alles für den Winter: Enteiser, Frostschutz, Eiskratzer'
      },
      price: 15.90,
      icon: '❄️',
      category: 'bundle',
      weatherConditions: ['cold', 'snow', 'frost', 'winter'],
      features: {
        en: ['De-icer spray', 'Windshield antifreeze', 'Ice scraper', 'Lock de-icer'],
        de: ['Enteiser-Spray', 'Scheibenfrostschutz', 'Eiskratzer', 'Schloss-Enteiser']
      },
      inStock: true,
      recommended: false
    },
    {
      id: 'product-rain-repellent',
      name: { en: 'Rain Repellent', de: 'Regenabweiser' },
      description: { 
        en: 'Crystal clear view in rain - lasts up to 6 months',
        de: 'Kristallklare Sicht bei Regen - hält bis zu 6 Monate'
      },
      price: 9.90,
      icon: '🌧️',
      category: 'visibility',
      weatherConditions: ['rain', 'rainy-season', 'autumn'],
      features: {
        en: ['6-month protection', 'Better visibility', 'Reduces wiping', 'Easy application'],
        de: ['6-Monate Schutz', 'Bessere Sicht', 'Weniger Wischen', 'Einfache Anwendung']
      },
      inStock: true,
      recommended: false
    },
    {
      id: 'product-interior-cleaner',
      name: { en: 'Interior Cleaner Set', de: 'Innenraum-Reiniger-Set' },
      description: { 
        en: 'Complete interior care: Cleaner, protectant, air freshener',
        de: 'Komplette Innenraumpflege: Reiniger, Pflege, Duft'
      },
      price: 14.90,
      icon: '✨',
      category: 'interior',
      weatherConditions: ['any'],
      features: {
        en: ['Multi-surface cleaner', 'UV protectant', 'Air freshener', 'Microfiber cloth'],
        de: ['Multi-Oberflächen-Reiniger', 'UV-Schutz', 'Lufterfrischer', 'Mikrofasertuch']
      },
      inStock: true,
      recommended: false
    }
  ]
};

// Weather condition mapping for recommendations
export const WEATHER_RECOMMENDATIONS = {
  sunny: {
    washPrograms: ['wash-spring-special', 'wash-premium', 'wash-basic'],
    products: ['product-premium-wax', 'product-tire-care', 'product-spring-kit'],
    message: {
      en: 'Perfect weather for a car wash! Protect your car with our sunny day specials.',
      de: 'Perfektes Wetter für eine Autowäsche! Schütze dein Auto mit unseren Sonnentag-Specials.'
    }
  },
  rainy: {
    washPrograms: ['wash-premium', 'wash-deluxe'],
    products: ['product-rain-repellent', 'product-premium-wax'],
    message: {
      en: 'Rainy days ahead? Get our rain protection products for better visibility!',
      de: 'Regentage voraus? Hol dir unsere Regenschutz-Produkte für bessere Sicht!'
    }
  },
  snowy: {
    washPrograms: ['wash-winter-special', 'wash-deluxe'],
    products: ['product-winter-kit', 'product-premium-wax'],
    message: {
      en: 'Winter weather requires special care! Protect your car from salt and ice.',
      de: 'Winterwetter erfordert besondere Pflege! Schütze dein Auto vor Salz und Eis.'
    }
  },
  cold: {
    washPrograms: ['wash-winter-special', 'wash-premium'],
    products: ['product-winter-kit', 'product-interior-cleaner'],
    message: {
      en: 'Cold weather protection for your car. Keep it clean and protected!',
      de: 'Kälteschutz für dein Auto. Halte es sauber und geschützt!'
    }
  },
  warm: {
    washPrograms: ['wash-spring-special', 'wash-premium'],
    products: ['product-tire-care', 'product-spring-kit', 'product-premium-wax'],
    message: {
      en: 'Warm weather is perfect for car care! Get your spring cleaning done.',
      de: 'Warmes Wetter ist perfekt für Autopflege! Erledige deinen Frühjahrsputz.'
    }
  },
  cloudy: {
    washPrograms: ['wash-basic', 'wash-premium'],
    products: ['product-premium-wax', 'product-interior-cleaner'],
    message: {
      en: 'Great day for a wash! No harsh sun to worry about.',
      de: 'Toller Tag für eine Wäsche! Keine starke Sonne, um die man sich sorgen muss.'
    }
  }
};

// Function to get recommendations based on weather
export function getWeatherBasedRecommendations(weatherCondition, temperature) {
  let condition = 'cloudy'; // default
  
  // Determine weather condition
  if (weatherCondition) {
    const w = weatherCondition.toLowerCase();
    if (w.includes('sun') || w.includes('clear')) condition = 'sunny';
    else if (w.includes('rain') || w.includes('drizzle')) condition = 'rainy';
    else if (w.includes('snow') || w.includes('sleet')) condition = 'snowy';
    else if (w.includes('cloud') || w.includes('overcast')) condition = 'cloudy';
  }
  
  // Temperature-based adjustments
  if (temperature !== undefined) {
    if (temperature < 5) condition = 'cold';
    else if (temperature > 20) condition = 'warm';
  }
  
  const recommendations = WEATHER_RECOMMENDATIONS[condition] || WEATHER_RECOMMENDATIONS.cloudy;
  
  // Get recommended wash programs
  const washPrograms = recommendations.washPrograms.map(id => 
    CIRCLE_K_PRODUCTS.washPrograms.find(p => p.id === id)
  ).filter(Boolean);
  
  // Get recommended products
  const products = recommendations.products.map(id => 
    CIRCLE_K_PRODUCTS.carCareProducts.find(p => p.id === id)
  ).filter(Boolean);
  
  return {
    condition,
    washPrograms,
    products,
    message: recommendations.message
  };
}
