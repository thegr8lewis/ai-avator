// Chat functionality with Gemini AI integration
import languageManager from './language.js';

class ChatManager {
  constructor(brand) {
    this.brand = brand || this.resolveBrand();
    this.isOpen = false;
    this.messages = [];
    this.welcomeShown = false;
    this.geminiModulePromise = this.loadGeminiModule();
    if (typeof window !== 'undefined' && !window.PROXY_BASE) {
      window.PROXY_BASE = 'http://localhost:3001';
    }
    this.initializeElements();
    this.bindEvents();
    
    // Subscribe to language changes
    languageManager.subscribe((lang) => {
      this.onLanguageChange(lang);
    });
  }

  initializeElements() {
    this.chatPopup = document.getElementById('chat-popup');
    this.chatBtn = document.getElementById('chat-btn');
    this.closeBtn = document.getElementById('close-chat');
    this.chatInput = document.getElementById('chat-input');
    this.sendBtn = document.getElementById('send-message');
    this.messagesContainer = document.getElementById('chat-messages');
  }

  resolveBrand() {
    if (window.CHAT_BRAND) return String(window.CHAT_BRAND).toLowerCase();
    const bodyBrand = document.body?.dataset?.brand;
    return bodyBrand ? String(bodyBrand).toLowerCase() : 'obi';
  }

  async loadGeminiModule() {
    try {
      if (this.brand === 'circlek') return await import('./gemini-circlek.js');
      if (this.brand === 'kik') return await import('./gemini-kik.js');
      return await import('./gemini-obi.js');
    } catch (err) {
      console.error('Failed to load Gemini module for brand:', this.brand, err);
      // Fallback to OBI module
      return await import('./gemini-obi.js');
    }
  }

  bindEvents() {
    // Open chat popup
    this.chatBtn?.addEventListener('click', () => this.openChat());
    
    // Close chat popup
    this.closeBtn?.addEventListener('click', () => this.closeChat());
    
    // Send message on button click
    this.sendBtn?.addEventListener('click', () => this.sendMessage());
    
    // Send message on Enter key
    this.chatInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Close on outside click
    this.chatPopup?.addEventListener('click', (e) => {
      if (e.target === this.chatPopup) {
        this.closeChat();
      }
    });
  }

  openChat() {
    this.isOpen = true;
    this.chatPopup?.classList.remove('hidden');
    this.chatPopup?.classList.add('visible');
    this.chatInput?.focus();
    
    // Hide attention indicators on first open
    const attentionPointer = document.getElementById('attention-pointer');
    const attentionText = document.getElementById('attention-text');
    if (attentionPointer) attentionPointer.classList.add('hidden-indicator');
    if (attentionText) attentionText.classList.add('hidden-indicator');
    
    // Welcome message (once per session)
    if (!this.welcomeShown) {
      const welcomeMap = {
        circlek: {
          de: 'Lass dich vom Wetter der nächsten Tage zu einer Autowäsche inspirieren! Frag mich einfach, was du zum Wetter wissen möchtest. Zum Beispiel: Wie wird das Wetter am nächsten Wochenende?',
          en: 'Let the weather over the next few days inspire your car wash! Just ask me anything you’d like to know about the weather, and I’ll respond. For example, are you interested in what the weather will be like next weekend?'
        },
        kik: {
          de: 'Lass dich vom Wetter der nächsten Tage zu einer Autowäsche inspirieren! Frag mich einfach, was du zum Wetter wissen möchtest. Zum Beispiel: Wie wird das Wetter am nächsten Wochenende?',
          en: 'Let the weather over the next few days inspire your car wash! Just ask me anything you’d like to know about the weather, and I’ll respond. For example, are you interested in what the weather will be like next weekend?'
        },
        obi: {
          de: 'Lass dich vom Wetter der nächsten Tage zu einer Autowäsche inspirieren! Frag mich einfach, was du zum Wetter wissen möchtest. Zum Beispiel: Wie wird das Wetter am nächsten Wochenende?',
          en: 'Let the weather over the next few days inspire your car wash! Just ask me anything you’d like to know about the weather, and I’ll respond. For example, are you interested in what the weather will be like next weekend?'
        }
      };
      const lang = languageManager.getLang() === 'de' ? 'de' : 'en';
      const key = welcomeMap[this.brand] ? this.brand : 'obi';
      const welcome = welcomeMap[key][lang] || languageManager.t('welcome-message');
      this.addMessage('avatar', welcome);
      if (window.speak) window.speak(welcome);
      this.welcomeShown = true;
    }
  }

  closeChat() {
    this.isOpen = false;
    this.chatPopup?.classList.add('hidden');
    this.chatPopup?.classList.remove('visible');
    
    // Stop any playing speech when closing
    if (window.stopSpeech) {
      window.stopSpeech();
    }
  }

  async sendMessage(messageText = null) {
    if (this.isSending) return;
    this.isSending = true;
    // Use provided message or get from input field
    const message = messageText || this.chatInput?.value.trim();
    if (!message) return;

    // Clear input only if using the input field
    if (!messageText && this.chatInput) {
      this.chatInput.value = '';
    }

    // Add user message
    this.addMessage('user', message);

    // Show typing indicator
    this.showTypingIndicator();

    try {
      // Extract city from message
      const city = this.extractCity(message);
      console.log('🏙️ City detected in chat:', city);
      
      // Detect weather intent and gather context
      const isWeather = this.isWeatherQuery(message);
      let weatherContext = '';
      if (isWeather && typeof window.getWeatherSummary === 'function') {
        try { 
          // Pass city to weather summary if detected
          weatherContext = await window.getWeatherSummary(city); 
        } catch {}
      }

      // Get AI response
      const response = await this.getGeminiResponse(message, weatherContext);
      
      // Remove typing indicator
      this.hideTypingIndicator();
      
      // Add AI response
      this.addMessage('avatar', response);

      // Force recommendations UI after a weather-like exchange
      try {
        const summary = weatherContext || response || '';
        if (this.brand === 'circlek' && typeof window.showWeatherRecommendations === 'function') {
          window.showWeatherRecommendations(summary || 'Current weather', undefined);
          if (typeof window.showBrandRecommendations === 'function') {
            window.showBrandRecommendations(summary, 'circlek');
          }
        } else if ((this.brand === 'obi' || this.brand === 'kik') && typeof window.showBrandRecommendations === 'function') {
          window.showBrandRecommendations(summary, this.brand);
        }
      } catch (err) {
        console.error('Failed to force recommendations UI', err);
      }

      // Make avatar speak the response
      if (window.speak) {
        window.speak(response);
      }
      
    } catch (error) {
      console.error('Chat error:', error);
      this.hideTypingIndicator();
      // Fallback: if user asked for weather, speak the summary directly
      if (this.isWeatherQuery(message) && typeof window.getWeatherSummary === 'function') {
        try {
          const city = this.extractCity(message);
          const summary = await window.getWeatherSummary(city);
          this.addMessage('avatar', summary);
          if (window.speak) window.speak(summary);
          return;
        } catch {}
      }
      this.addMessage('avatar', languageManager.t('error-message'));
    } finally {
      this.isSending = false;
    }
  }

  isWeatherQuery(text) {
    if (!text) return false;
    const t = text.toLowerCase();
    // English and German weather keywords
    return (
      t.includes('weather') || t.includes('wetter') ||
      t.includes('temperature') || t.includes('temperatur') ||
      t.includes('forecast') || t.includes('vorhersage') ||
      t.includes('rain') || t.includes('regen') ||
      t.includes('sunny') || t.includes('sonnig') ||
      t.includes('cloud') || t.includes('wolke') || t.includes('bewölkt')
    );
  }

  extractCity(userMessage) {
    if (!userMessage) return null;
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
        // Normalize city names
        if (city === 'munich') return 'München';
        if (city === 'cologne') return 'Köln';
        if (city === 'nuremberg') return 'Nürnberg';
        return city.charAt(0).toUpperCase() + city.slice(1);
      }
    }
    
    return null;
  }

  async getGeminiResponse(userMessage, weatherContext = '') {
    const module = await this.geminiModulePromise;
    const fn = module?.getGeminiResponse;
    if (typeof fn !== 'function') {
      console.error('Gemini module missing getGeminiResponse');
      return languageManager.t('error-message');
    }
    const response = await fn(userMessage, weatherContext, this.brand);
    return this.sanitizeResponse(response);
  }

  sanitizeResponse(text) {
    if (!text) return text;
    // Remove markdown formatting
    return text
      .replace(/\*\*/g, '')  // Remove bold **
      .replace(/\*/g, '')    // Remove italic *
      .replace(/\_\_/g, '')  // Remove bold __
      .replace(/\_/g, '')    // Remove italic _
      .replace(/\#\#\#/g, '') // Remove h3 ###
      .replace(/\#\#/g, '')  // Remove h2 ##
      .replace(/\#/g, '')    // Remove h1 #
      .trim();
  }

  addMessage(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    messageDiv.textContent = text;
    
    this.messagesContainer?.appendChild(messageDiv);
    if (this.messagesContainer) this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    
    // Store message
    this.messages.push({ sender, text, timestamp: Date.now() });
  }

  showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message typing-indicator';
    typingDiv.id = 'typing-indicator';
    
    // Create three animated dots
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('span');
      dot.className = 'dot';
      typingDiv.appendChild(dot);
    }
    
    this.messagesContainer?.appendChild(typingDiv);
    if (this.messagesContainer) this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    typingIndicator?.remove();
  }

  // Method to clear chat history
  clearChat() {
    this.messages = [];
    if (this.messagesContainer) {
      this.messagesContainer.innerHTML = '';
    }
  }

  // Handle language change
  onLanguageChange(lang) {
    // Update typing indicator if visible
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
      typingIndicator.textContent = languageManager.t('typing-indicator');
    }
    
    // Optionally: add a system message about language change
    // this.addMessage('avatar', lang === 'de' ? 'Sprache auf Deutsch gewechselt.' : 'Language switched to English.');
  }
}

// Initialize chat when DOM is loaded
let chatManager;
document.addEventListener('DOMContentLoaded', () => {
  chatManager = new ChatManager();
  // Expose globally for voice input integration
  window.chatManager = chatManager;
});

// Export for use in other modules
export { ChatManager };
