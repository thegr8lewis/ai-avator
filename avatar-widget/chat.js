// Chat functionality with Gemini AI integration
import languageManager from './language.js';
import { getGeminiResponse as geminiGetResponse } from './gemini.js';

class ChatManager {
  constructor() {
    this.isOpen = false;
    this.messages = [];
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
    this.chatInput?.focus();
    
    // Welcome message if no previous messages
    if (this.messages.length === 0) {
      this.addMessage('avatar', languageManager.t('welcome-message'));
    }
  }

  closeChat() {
    this.isOpen = false;
    this.chatPopup?.classList.add('hidden');
  }

  async sendMessage(messageText = null) {
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
      // Detect weather intent and gather context
      const isWeather = this.isWeatherQuery(message);
      let weatherContext = '';
      if (isWeather && typeof window.getWeatherSummary === 'function') {
        try { weatherContext = await window.getWeatherSummary(); } catch {}
      }

      // Get AI response
      const response = await this.getGeminiResponse(message, weatherContext);
      
      // Remove typing indicator
      this.hideTypingIndicator();
      
      // Add AI response
      this.addMessage('avatar', response);
      
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
          const summary = await window.getWeatherSummary();
          this.addMessage('avatar', summary);
          if (window.speak) window.speak(summary);
          return;
        } catch {}
      }
      this.addMessage('avatar', languageManager.t('error-message'));
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

  async getGeminiResponse(userMessage, weatherContext = '') {
    return await geminiGetResponse(userMessage, weatherContext);
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
