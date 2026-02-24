// Complete Redesign - Weather-based Recommendations with New Design System
// Based on detailed specification with HSL colors, 3-column grid, hero banner, and sticky checkout

import { CIRCLE_K_PRODUCTS, getWeatherBasedRecommendations } from './products-database.js';
import languageManager from './language.js';

class RecommendationsRedesign {
  constructor() {
    this.container = null;
    this.defaultContent = null;
    this.initialized = false;
    this.selectedItems = new Map();
    this.currentWeather = null;
  }

  init() {
    if (this.initialized) return;
    
    const weatherOffersTab = document.getElementById('tab-weather-offers');
    if (!weatherOffersTab) {
      console.error('❌ Weather offers tab not found');
      return;
    }
    
    this.defaultContent = document.getElementById('weather-offers-default-content');
    
    this.container = document.getElementById('recommendations-section');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'recommendations-section';
      this.container.className = 'recommendations-redesign hidden';
      weatherOffersTab.appendChild(this.container);
    } else {
      // Normalize class on existing placeholder
      if (!this.container.classList.contains('recommendations-redesign')) {
        this.container.classList.add('recommendations-redesign');
      }
      if (!this.container.classList.contains('hidden')) {
        this.container.classList.add('hidden');
      }
    }
    this.injectStyles();
    this.initialized = true;
    console.log('✅ Recommendations Redesign initialized');
  }

  injectStyles() {
    if (document.getElementById('recommendations-redesign-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'recommendations-redesign-styles';
    styles.textContent = `
      /* Design Tokens - HSL Color System */
      :root {
        --primary: hsl(0, 78%, 45%);
        --primary-hover: hsl(0, 78%, 40%);
        --background: hsl(0, 0%, 97%);
        --card: hsl(0, 0%, 100%);
        --border: hsl(0, 0%, 88%);
        --muted: hsl(0, 0%, 92%);
        --muted-foreground: hsl(0, 0%, 45%);
        --foreground: hsl(0, 0%, 10%);
        --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.1);
        --shadow-card-hover: 0 8px 24px rgba(227, 6, 19, 0.15);
      }

      /* Hide default content */
      #weather-offers-default-content.hidden {
        display: none;
      }

      /* Main Container */
      .recommendations-redesign {
        width: 100%;
        max-width: 72rem;
        margin: 0 auto;
        padding: 0 2rem;
        background: var(--background);
        min-height: 100vh;
      }

      .recommendations-redesign.hidden {
        display: none;
      }

      .recommendations-redesign.active {
        display: block;
      }

      body.recommendations-active {
        background: linear-gradient(180deg, #fdf3f3 0%, #f8f9fa 100%);
      }
      #tab-weather-offers.recommendations-active {
        background: linear-gradient(180deg, #fff5f5 0%, #f8f9fa 100%);
      }

      /* Hero Banner */
      .hero-banner {
        width: 100%;
        height: 14rem;
        position: relative;
        border-radius: 1.5rem;
        overflow: hidden;
        margin-bottom: 3rem;
      }

      .hero-banner img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .hero-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(180deg, rgba(0, 0, 0, 0.7) 0%, transparent 100%);
        display: flex;
        align-items: center;
        padding: 0 3rem;
      }

      .hero-title {
        font-size: 3rem;
        font-weight: 800;
        color: white;
        letter-spacing: -1px;
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      }

      .back-button {
        position: absolute;
        top: 1.5rem;
        left: 1.5rem;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(8px);
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 0.75rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--foreground);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }

      .back-button:hover {
        background: white;
        transform: translateX(-4px);
      }

      /* Weather Widget */
      .weather-widget {
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1.5rem;
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 2rem;
        box-shadow: var(--shadow-card);
        margin-bottom: 2rem;
        font-size: 0.875rem;
        color: var(--foreground);
      }

      .weather-widget svg {
        width: 1.25rem;
        height: 1.25rem;
      }

      /* Section Header */
      .section-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin: 3rem 0 2rem;
      }

      .section-bar {
        width: 4px;
        height: 1.5rem;
        background: var(--primary);
        border-radius: 2px;
      }

      .section-title {
        font-size: 0.75rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.15em;
        color: var(--muted-foreground);
        flex: 1;
      }

      .section-line {
        flex: 1;
        height: 1px;
        background: var(--border);
      }

      /* 3-Column Grid */
      .products-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1.5rem;
        margin-bottom: 3rem;
      }

      /* Product Card */
      .product-card {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 1.5rem;
        padding: 1.5rem;
        box-shadow: var(--shadow-card);
        transition: all 0.3s ease;
        cursor: pointer;
        position: relative;
      }

      .product-card:hover {
        box-shadow: var(--shadow-card-hover);
        transform: translateY(-4px);
      }

      .product-card.selected {
        border-color: var(--primary);
        box-shadow: 0 0 0 1px hsla(0, 78%, 45%, 0.3);
      }

      .product-card.recommended {
        border-top: 3px solid var(--primary);
      }

      .product-card.recommended .recommended-badge {
        position: absolute;
        top: -0.75rem;
        right: 1rem;
        background: var(--primary);
        color: white;
        padding: 0.25rem 0.75rem;
        border-radius: 1rem;
        font-size: 0.625rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      /* Card Type Label */
      .card-type {
        position: absolute;
        top: 1rem;
        right: 1rem;
        font-size: 0.625rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--muted-foreground);
        border: 1px solid var(--border);
        padding: 0.25rem 0.5rem;
        border-radius: 0.375rem;
      }

      /* Icon Container */
      .card-icon {
        width: 3rem;
        height: 3rem;
        background: var(--muted);
        border-radius: 0.75rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        margin-bottom: 1rem;
        transition: all 0.3s ease;
      }

      .product-card.selected .card-icon {
        background: var(--primary);
        color: white;
      }

      /* Card Content */
      .card-name {
        font-size: 1rem;
        font-weight: 700;
        color: var(--foreground);
        margin-bottom: 0.5rem;
      }

      .card-description {
        font-size: 0.75rem;
        color: var(--muted-foreground);
        margin-bottom: 1rem;
        line-height: 1.5;
      }

      /* Price */
      .card-price {
        font-size: 1.5rem;
        font-weight: 900;
        color: var(--foreground);
        letter-spacing: -0.5px;
        margin-bottom: 0.5rem;
      }

      .card-duration {
        font-size: 0.75rem;
        color: var(--muted-foreground);
        margin-bottom: 1rem;
      }

      /* Features List */
      .features-list {
        list-style: none;
        padding: 0;
        margin: 1rem 0;
      }

      .features-list li {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.75rem;
        color: var(--muted-foreground);
        margin-bottom: 0.5rem;
      }

      .feature-check {
        width: 1rem;
        height: 1rem;
        border-radius: 50%;
        background: var(--muted);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.625rem;
        transition: all 0.3s ease;
      }

      .product-card.selected .feature-check {
        background: var(--primary);
        color: white;
      }

      /* Details Toggle */
      .details-toggle {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem 0;
        border-top: 1px solid var(--border);
        margin-top: 1rem;
        cursor: pointer;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--muted-foreground);
      }

      .details-toggle:hover {
        color: var(--primary);
      }

      .chevron {
        transition: transform 0.3s ease;
      }

      .details-toggle.open .chevron {
        transform: rotate(180deg);
      }

      /* Select Button */
      .select-button {
        width: 100%;
        padding: 0.75rem;
        border: 2px solid var(--border);
        background: transparent;
        border-radius: 0.75rem;
        font-weight: 700;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.3s ease;
        margin-top: 1rem;
      }

      .select-button:hover {
        border-color: var(--primary);
        color: var(--primary);
      }

      .product-card.selected .select-button {
        background: var(--primary);
        border-color: var(--primary);
        color: white;
        box-shadow: 0 4px 12px rgba(227, 6, 19, 0.3);
      }

      /* Coming Soon Placeholder */
      .coming-soon {
        border: 2px dashed var(--border);
        background: transparent;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--muted-foreground);
        font-size: 0.875rem;
        font-weight: 600;
        min-height: 20rem;
      }

      /* Sticky Checkout Bar */
      .checkout-bar {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: hsla(0, 0%, 100%, 0.95);
        backdrop-filter: blur(12px);
        border-top: 1px solid var(--border);
        padding: 1.5rem 2rem;
        box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.08);
        transform: translateY(100%);
        transition: transform 0.3s ease;
        z-index: 1000;
      }

      .checkout-bar.visible {
        transform: translateY(0);
      }

      .checkout-content {
        max-width: 72rem;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 2rem;
      }

      .checkout-info {
        display: flex;
        align-items: center;
        gap: 2rem;
      }

      .item-count {
        font-size: 0.875rem;
        color: var(--muted-foreground);
      }

      .total-price {
        font-size: 1.25rem;
        font-weight: 900;
        color: var(--foreground);
      }

      .continue-button {
        background: var(--primary);
        color: white;
        border: none;
        padding: 1rem 2rem;
        border-radius: 0.75rem;
        font-weight: 700;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(227, 6, 19, 0.3);
      }

      .continue-button:hover {
        background: var(--primary-hover);
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(227, 6, 19, 0.4);
      }

      /* Responsive Design */
      @media (max-width: 1024px) {
        .products-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      @media (max-width: 768px) {
        .recommendations-redesign {
          padding: 0 1rem;
        }

        .hero-title {
          font-size: 2rem;
        }

        .products-grid {
          grid-template-columns: 1fr;
        }

        .checkout-content {
          flex-direction: column;
          gap: 1rem;
        }

        .continue-button {
          width: 100%;
        }
      }

      /* Animations */
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .product-card {
        animation: fadeInUp 0.5s ease-out backwards;
      }

      .product-card:nth-child(1) { animation-delay: 0.05s; }
      .product-card:nth-child(2) { animation-delay: 0.1s; }
      .product-card:nth-child(3) { animation-delay: 0.15s; }
      .product-card:nth-child(4) { animation-delay: 0.2s; }
      .product-card:nth-child(5) { animation-delay: 0.25s; }
      .product-card:nth-child(6) { animation-delay: 0.3s; }
    `;
    
    document.head.appendChild(styles);
  }

  renderProductCard(item, type, lang, isFeatured = false) {
    if (!item) return '';

    const name = typeof item.name === 'object' ? (item.name[lang] || Object.values(item.name)[0]) : (item.name || '');
    const description = typeof item.description === 'object' ? (item.description[lang] || Object.values(item.description)[0]) : (item.description || '');
    const price = typeof item.price === 'number' ? item.price.toFixed(2) : '0.00';
    const duration = item.duration || '';
    const icon = item.icon || '✨';
    const features = Array.isArray(item.features?.[lang]) ? item.features[lang] : Array.isArray(item.features) ? item.features : [];
    const badge = item.badge || (isFeatured ? (lang === 'de' ? 'Empfohlen' : 'Featured') : '');
    const image = item.image || 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=600&h=600&fit=crop';

    return `
      <div class="product-card${isFeatured ? ' featured' : ''}" data-id="${item.id}" data-type="${type}">
        <div class="card-header">
          <div class="tag">${type === 'wash' ? (lang === 'de' ? 'Waschprogramm' : 'Wash Program') : (lang === 'de' ? 'Produkt' : 'Product')}</div>
          ${badge ? `<div class="tag">${badge}</div>` : ''}
        </div>
        <div class="card-body">
          <div class="product-image">
            <img src="${image}" alt="${name}" loading="lazy" />
          </div>
          <div class="product-content">
            <div class="product-title">
              <span class="product-icon">${icon}</span>
              <div>
                <h3>${name}</h3>
                <p>${description}</p>
              </div>
            </div>
            <div class="features">
              ${features.map(feat => `
                <div class="feature">
                  <span class="feature-icon">✓</span>
                  <span>${feat}</span>
                </div>
              `).join('')}
            </div>
            <div class="details">
              <div class="price">
                <span class="price-value">€${price}</span>
                ${duration ? `<span class="price-period">${duration}</span>` : ''}
              </div>
              <div class="cta">
                <button class="secondary">${lang === 'de' ? 'Details' : 'Details'}</button>
                <button class="primary" onclick="window.recommendationsRedesign.toggleSelection('${item.id}','${type}', ${item.price || 0})">${lang === 'de' ? 'Auswählen' : 'Select'}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Apply theme and render
    document.body.classList.add('recommendations-active');
    const tab = document.getElementById('tab-weather-offers');
    if (tab) tab.classList.add('recommendations-active');
    this.updateContent(content);
  }

  showWeatherRecommendations(weatherCondition, temperature) {
    console.log('🎬 Showing redesigned recommendations:', { weatherCondition, temperature });
    this.init();
    
    this.currentWeather = { condition: weatherCondition, temperature };
    const lang = languageManager.getLang();
    const recommendations = getWeatherBasedRecommendations(weatherCondition, temperature);
    
    // Add a third wash program to fill the grid
    const thirdProgram = {
      id: 'express-wash',
      name: { en: 'Express Wash', de: 'Express-Wäsche' },
      description: { en: 'Quick & efficient basic wash', de: 'Schnelle & effiziente Basiswäsche' },
      price: 8.90,
      duration: '5 min',
      icon: '⚡',
      features: {
        en: ['Exterior wash', 'Quick dry', 'Basic cleaning'],
        de: ['Außenwäsche', 'Schnelltrocknung', 'Grundreinigung']
      },
      weatherTags: ['sunny', 'cloudy']
    };
    
    const washPrograms = [...recommendations.washPrograms, thirdProgram];
    
    const content = `
      <div class="hero-banner">
        <img src="https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=1200&h=512&fit=crop" alt="Car wash" />
        <div class="hero-overlay">
          <button class="back-button" onclick="window.recommendationsRedesign.clearRecommendations()">
            ← ${lang === 'de' ? 'Zurück zu Angeboten' : 'Back to Offers'}
          </button>
          <h1 class="hero-title">${lang === 'de' ? 'Ihre persönlichen Empfehlungen' : 'Your Personal Recommendations'}</h1>
        </div>
      </div>

      <div class="weather-widget">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 16.2A4.5 4.5 0 0 0 17.5 8h-1.8A7 7 0 1 0 4 14.9" />
          <path d="M16 14v6m-4-6v6m-4-6v6" />
        </svg>
        <span>${weatherCondition || 'Patchy rain nearby'}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
        </svg>
        <span>${temperature ? `${Math.round(temperature)}°C` : '1°C'}</span>
      </div>

      <div class="section-header">
        <div class="section-bar"></div>
        <h2 class="section-title">${lang === 'de' ? 'Waschprogramme' : 'Wash Programs'}</h2>
        <div class="section-line"></div>
      </div>

      <div class="products-grid">
        ${washPrograms.map((program, index) => this.renderProductCard(program, 'wash', lang, index === 0)).join('')}
      </div>

      <div class="section-header">
        <div class="section-bar"></div>
        <h2 class="section-title">${lang === 'de' ? 'Autopflegeprodukte' : 'Car Care Products'}</h2>
        <div class="section-line"></div>
      </div>

      <div class="products-grid">
        ${recommendations.products.map((product, index) => this.renderProductCard(product, 'product', lang, false)).join('')}
        <div class="product-card coming-soon">
          ${lang === 'de' ? 'Weitere Programme in Kürze' : 'More programs coming soon'}
        </div>
      </div>

      <div class="checkout-bar" id="checkout-bar">
        <div class="checkout-content">
          <div class="checkout-info">
            <span class="item-count"><span id="item-count">0</span> ${lang === 'de' ? 'ausgewählt' : 'selected'}</span>
            <span class="total-price">€<span id="total-price">0.00</span></span>
          </div>
          <button class="continue-button">${lang === 'de' ? 'Weiter' : 'Continue'} →</button>
        </div>
      </div>
    `;
  }

  toggleSelection(id, type, price) {
    const card = document.querySelector(`[data-id="${id}"]`);
    const button = card.querySelector('.select-button');
    const lang = languageManager.getLang();
    
    if (this.selectedItems.has(id)) {
      this.selectedItems.delete(id);
      card.classList.remove('selected');
      button.textContent = lang === 'de' ? 'Auswählen' : 'Select';
    } else {
      this.selectedItems.set(id, { type, price });
      card.classList.add('selected');
      button.innerHTML = '✓ ' + (lang === 'de' ? 'Ausgewählt' : 'Selected');
    }
    
    this.updateCheckoutBar();
  }

  updateCheckoutBar() {
    const checkoutBar = document.getElementById('checkout-bar');
    const itemCount = document.getElementById('item-count');
    const totalPrice = document.getElementById('total-price');
    
    const count = this.selectedItems.size;
    const total = Array.from(this.selectedItems.values()).reduce((sum, item) => sum + item.price, 0);
    
    itemCount.textContent = count;
    totalPrice.textContent = total.toFixed(2);
    
    if (count > 0) {
      checkoutBar.classList.add('visible');
    } else {
      checkoutBar.classList.remove('visible');
    }
  }

  attachEventListeners() {
    // Event listeners are handled via onclick in HTML for simplicity
  }

  updateContent(htmlContent) {
    if (!this.container) return;
    
    if (this.defaultContent) {
      this.defaultContent.classList.add('hidden');
      this.defaultContent.style.display = 'none';
    }
    
    this.container.innerHTML = htmlContent;
    this.container.classList.remove('hidden');
    this.container.classList.add('active');
    this.container.style.display = 'block';
    console.log('✅ Recommendations content injected, container shown');
    
    setTimeout(() => {
      const weatherOffersTab = document.getElementById('tab-weather-offers');
      if (weatherOffersTab) {
        weatherOffersTab.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  clearRecommendations() {
    if (this.container) {
      this.container.classList.remove('active');
      this.container.classList.add('hidden');
      this.container.style.display = 'none';
      this.container.innerHTML = '';
    }
    if (this.defaultContent) {
      this.defaultContent.classList.remove('hidden');
      this.defaultContent.style.display = '';
    }
    document.body.classList.remove('recommendations-active');
    const tab = document.getElementById('tab-weather-offers');
    if (tab) tab.classList.remove('recommendations-active');
  }
}

// Singleton + exports
const recommendationsRedesign = new RecommendationsRedesign();
export function showWeatherRecommendations(weatherCondition, temperature) {
  recommendationsRedesign.showWeatherRecommendations(weatherCondition, temperature);
}
export function clearRecommendations() {
  recommendationsRedesign.clearRecommendations();
}
window.showWeatherRecommendations = showWeatherRecommendations;
window.clearRecommendations = clearRecommendations;
window.recommendationsRedesign = recommendationsRedesign;

export default RecommendationsRedesign;
