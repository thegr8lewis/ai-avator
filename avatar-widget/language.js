// Language Manager - Handles UI translations and language state
class LanguageManager {
  constructor() {
    this.currentLang = localStorage.getItem('preferredLanguage') || 'de'; // Circle K: German-first
    this.translations = {
      en: {
        'chat-button': 'Chat',
        'chat-header': 'Chat with Avatar',
        'chat-placeholder': 'Ask me anything...',
        'send-button': 'Send',
        'welcome-message': 'I am your AI assistant. Ask me anything!',
        'typing-indicator': 'Avatar is thinking...',
        'error-message': 'Sorry, I encountered an error. Please try again.',
        'weather-unavailable': 'Weather data is currently unavailable.',
        'weather-error': 'Sorry, I could not fetch the weather right now.',
        'circle-k-greeting': 'Let the weather of the coming days inspire your car wash! Simply ask me anything you\'d like to know about the weather, and I\'ll respond. For example, are you interested in what the weather will be like next weekend?'
      },
      de: {
        'chat-button': 'Chat',
        'chat-header': 'Chat mit Karsten',
        'chat-placeholder': 'Frag mich etwas über das Wetter...',
        'send-button': 'Senden',
        'welcome-message': 'Ich bin Karsten, dein digitaler Assistent.',
        'typing-indicator': 'Karsten denkt nach...',
        'error-message': 'Entschuldigung, es ist ein Fehler aufgetreten. Bitte versuche es erneut.',
        'circle-k-greeting': 'Lass dich vom Wetter der kommenden Tage zu deiner Autowäsche inspirieren! Frag mich einfach, was du über das Wetter wissen möchtest, und ich antworte dir. Interessiert dich zum Beispiel, wie das Wetter am kommenden Wochenende wird?',
        'weather-unavailable': 'Wetterdaten sind derzeit nicht verfügbar.',
        'weather-error': 'Entschuldigung, ich konnte das Wetter gerade nicht abrufen.',
        'tab-label': 'Angebote – passend zum Wetter',
        'region-question': 'Ok. Für welche Region hättest Du denn gerne die Vorhersage?'
      }
    };
    this.observers = [];
    // Ensure valid language on startup
    if (!this.translations[this.currentLang]) {
      this.currentLang = 'en';
      localStorage.setItem('preferredLanguage', this.currentLang);
    }
  }

  // Get current language
  getLang() {
    return this.currentLang;
  }

  // Get language code for APIs (en-US, de-DE)
  getLangCode() {
    return this.currentLang === 'de' ? 'de-DE' : 'en-US';
  }

  // Get short language code for weather API
  getWeatherLangCode() {
    return this.currentLang === 'de' ? 'de' : 'en';
  }

  // Toggle between English and German
  toggleLanguage() {
    this.currentLang = this.currentLang === 'en' ? 'de' : 'en';
    localStorage.setItem('preferredLanguage', this.currentLang);
    this.updateUI();
    this.notifyObservers();
    return this.currentLang;
  }

  // Set specific language
  setLanguage(lang) {
    if (lang !== 'en' && lang !== 'de') return;
    this.currentLang = lang;
    localStorage.setItem('preferredLanguage', this.currentLang);
    this.updateUI();
    this.notifyObservers();
  }

  // Get translation for a key
  t(key) {
    const pack = this.translations[this.currentLang] || this.translations.en;
    return (pack && pack[key]) || this.translations.en[key] || key;
  }

  // Update all UI elements with translations
  updateUI() {
    // Update elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key);
    });

    // Update placeholder attributes
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = this.t(key);
    });

    // Update language toggle button
    const langBtn = document.getElementById('lang-toggle');
    if (langBtn) {
      langBtn.textContent = `🌐 ${this.currentLang.toUpperCase()}`;
      langBtn.title = this.currentLang === 'en' ? 'Switch to German' : 'Auf Englisch wechseln';
    }
  }

  // Subscribe to language changes
  subscribe(callback) {
    this.observers.push(callback);
  }

  // Notify all observers of language change
  notifyObservers() {
    this.observers.forEach(callback => callback(this.currentLang));
  }

  // Get Gemini prompt instruction based on language
  getGeminiLanguageInstruction() {
    if (this.currentLang === 'de') {
      return 'Antworte auf Deutsch (German). ';
    }
    return 'Respond in English. ';
  }

  // Get Circle K specific system prompt for Gemini
  getCircleKSystemPrompt(intent = 'general', context = {}) {
    const langInstruction = this.getGeminiLanguageInstruction();
    
    if (this.currentLang === 'de') {
      if (intent === 'forecast') {
        return `${langInstruction}Du bist Karsten von Circle K. Kurze Antworten (2 Sätze). ${context.city ? 'Bestätige Stadt.' : 'Frage: "Für welche Region?"'}`;
      }
      
      if (intent === 'tires') {
        return `${langInstruction}Du bist Karsten von Circle K. Kurze Wetterauskunft + "Circle K hat einen Tipp für Dich!"`;
      }
      
      return `${langInstruction}Du bist Karsten von Circle K. Freundlich, kurz (2 Sätze).`;
    }
    
    // English
    return `${langInstruction}You're Karsten from Circle K. Brief, friendly (2 sentences).`;
  }

  // Get system prompt for Gemini (legacy compatibility)
  getSystemPrompt(includeWeather = false, weatherContext = '') {
    const langInstruction = this.getGeminiLanguageInstruction();
    
    if (includeWeather && weatherContext) {
      return this.currentLang === 'de'
        ? `${langInstruction}Karsten von Circle K. Kontext: ${weatherContext}. Kurz (2 Sätze).`
        : `${langInstruction}Karsten from Circle K. Context: ${weatherContext}. Brief (2 sentences).`;
    }

    return this.currentLang === 'de'
      ? `${langInstruction}Karsten von Circle K. Kurz, freundlich (2 Sätze).`
      : `${langInstruction}Karsten from Circle K. Brief, friendly (2 sentences).`;
  }
}

// Create singleton instance
const languageManager = new LanguageManager();

// Initialize UI on DOM load
document.addEventListener('DOMContentLoaded', () => {
  languageManager.updateUI();

  // Bind language toggle button
  const langBtn = document.getElementById('lang-toggle');
  if (langBtn) {
    langBtn.addEventListener('click', () => {
      languageManager.toggleLanguage();
    });
  }
});

// Export for use in other modules
export default languageManager;
