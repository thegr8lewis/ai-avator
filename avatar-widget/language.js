// Language Manager - Handles UI translations and language state
class LanguageManager {
  constructor() {
    this.currentLang = localStorage.getItem('preferredLanguage') || 'en';
    this.translations = {
      en: {
        'chat-button': 'Chat',
        'chat-header': 'Chat with Avatar',
        'chat-placeholder': 'Ask me anything...',
        'send-button': 'Send',
        'welcome-message': 'Hello! I am your AI assistant. Ask me anything!',
        'typing-indicator': 'Avatar is thinking...',
        'error-message': 'Sorry, I encountered an error. Please try again.',
        'weather-greeting': 'Hi! I\'m your assistant. Let me check the weather for you.',
        'weather-unavailable': 'Weather data is currently unavailable.',
        'weather-error': 'Sorry, I could not fetch the weather right now.'
      },
      de: {
        'chat-button': 'Chat',
        'chat-header': 'Chat mit Avatar',
        'chat-placeholder': 'Frag mich etwas...',
        'send-button': 'Senden',
        'welcome-message': 'Hallo! Ich bin dein KI-Assistent. Frag mich etwas!',
        'typing-indicator': 'Avatar denkt nach...',
        'error-message': 'Entschuldigung, es ist ein Fehler aufgetreten. Bitte versuche es erneut.',
        'weather-greeting': 'Hallo! Ich bin dein Assistent. Lass mich das Wetter für dich prüfen.',
        'weather-unavailable': 'Wetterdaten sind derzeit nicht verfügbar.',
        'weather-error': 'Entschuldigung, ich konnte das Wetter gerade nicht abrufen.'
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

  // Get system prompt for Gemini
  getSystemPrompt(includeWeather = false, weatherContext = '') {
    const langInstruction = this.getGeminiLanguageInstruction();
    
    if (includeWeather && weatherContext) {
      return this.currentLang === 'de'
        ? `${langInstruction}Du bist ein hilfreicher KI-Assistent-Avatar.
Kontext: ${weatherContext}
Aufgabe: Gib eine natürliche, gesprächige Antwort auf die Nachricht des Benutzers und beziehe dich bei Bedarf auf den Kontext. Halte die Antworten kurz (maximal 2-3 Sätze).`
        : `${langInstruction}You are a helpful AI assistant avatar.
Context: ${weatherContext}
Task: Provide a natural, conversational response to the user's message, optionally referencing the context if relevant. Keep responses concise (max 2-3 sentences).`;
    }

    return this.currentLang === 'de'
      ? `${langInstruction}Du bist ein hilfreicher KI-Assistent-Avatar. Bitte gib eine natürliche, gesprächige Antwort auf diese Nachricht. Halte die Antworten kurz aber informativ (maximal 2-3 Sätze).`
      : `${langInstruction}You are a helpful AI assistant avatar. Please provide a natural, conversational response to this message. Keep responses concise but informative (max 2-3 sentences).`;
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
