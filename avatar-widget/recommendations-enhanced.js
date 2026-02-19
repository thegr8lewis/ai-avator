// Enhanced Circle K Recommendations Module
// Weather-based product recommendations with beautiful animations and interactive features

import { CIRCLE_K_PRODUCTS, getWeatherBasedRecommendations } from './products-database.js';
import languageManager from './language.js';

class EnhancedRecommendationsManager {
  constructor() {
    this.currentSection = null;
    this.container = null;
    this.initialized = false;
    this.cart = [];
    this.currentWeather = null;
  }

  init() {
    if (this.initialized) return;
    
    // Find or create recommendations container within the weather-offers tab
    const weatherOffersTab = document.getElementById('tab-weather-offers');
    if (!weatherOffersTab) {
      console.error('❌ Weather offers tab not found');
      return;
    }
    
    // Store reference to default content
    this.defaultContent = document.getElementById('weather-offers-default-content');
    
    this.container = document.getElementById('recommendations-section');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'recommendations-section';
      this.container.className = 'recommendations-container hidden';
      // Append to the weather-offers tab content
      weatherOffersTab.appendChild(this.container);
    }
    
    // Add styles if not already present
    this.injectStyles();
    
    this.initialized = true;
    console.log('✅ Enhanced Recommendations Manager initialized');
  }

  injectStyles() {
    if (document.getElementById('recommendations-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'recommendations-styles';
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
      
      /* Hide default content when recommendations are shown */
      #weather-offers-default-content {
        transition: opacity 0.3s ease;
      }

      #weather-offers-default-content.hidden {
        display: none;
      }

      /* Main container - inline section within page */
      .recommendations-container {
        width: 100%;
        max-width: 1400px;
        margin: 3rem auto;
        padding: 0 40px;
        box-sizing: border-box;
        transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        background: transparent;
        min-height: 200px;
      }

      .recommendations-container.hidden {
        display: none;
      }

      .recommendations-container.active {
        opacity: 1;
        display: block;
      }

      /* No divider needed since we're replacing content */
      .recommendations-container::before {
        display: none;
      }

      /* Header section - professional design */
      .recommendation-header {
        text-align: center;
        margin-bottom: 4rem;
        padding: 4rem 3rem;
        background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
        border-radius: 24px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
        animation: slideDown 0.6s ease-out;
        position: relative;
        border: 1px solid #e8e8e8;
      }

      .back-to-offers-btn {
        position: absolute;
        top: 2rem;
        left: 2rem;
        background: white;
        border: 2px solid #E30613;
        color: #E30613;
        padding: 0.75rem 1.5rem;
        border-radius: 12px;
        font-size: 0.95rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        gap: 0.5rem;
        box-shadow: 0 2px 8px rgba(227, 6, 19, 0.1);
      }

      .back-to-offers-btn:hover {
        background: #E30613;
        color: white;
        transform: translateX(-4px);
        box-shadow: 0 4px 16px rgba(227, 6, 19, 0.25);
      }

      .recommendation-header h2 {
        font-size: 2.75rem;
        color: #1a1a1a;
        margin-bottom: 1.25rem;
        font-weight: 800;
        letter-spacing: -1px;
        line-height: 1.2;
      }

      .recommendation-header p {
        color: #666;
        font-size: 1.2rem;
        line-height: 1.6;
        max-width: 700px;
        margin: 0 auto 1.5rem;
      }

      .weather-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem 2rem;
        background: linear-gradient(135deg, #E30613, #B00510);
        color: white;
        border-radius: 50px;
        font-size: 1rem;
        font-weight: 600;
        margin-top: 1rem;
        box-shadow: 0 6px 20px rgba(227, 6, 19, 0.25);
        letter-spacing: 0.5px;
        text-transform: uppercase;
        font-size: 0.9rem;
      }

      .weather-badge::before {
        content: '';
        width: 8px;
        height: 8px;
        background: white;
        border-radius: 50%;
        animation: pulse 2s ease-in-out infinite;
      }

      /* Section titles */
      .recommendations-container h3 {
        font-size: 1.75rem;
        color: #1a1a1a;
        margin: 4rem 0 2.5rem;
        font-weight: 700;
        text-align: left;
        position: relative;
        padding-bottom: 1.5rem;
        padding-left: 1.5rem;
        border-left: 4px solid #E30613;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-size: 1.1rem;
      }

      .recommendations-container h3::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, #E30613 0%, transparent 100%);
      }

      /* Products grid - matches page card grid */
      .products-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 2rem;
        margin-bottom: 4rem;
        width: 100%;
      }

      /* Product cards - premium design */
      .product-card {
        background: #ffffff;
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: pointer;
        position: relative;
        animation: fadeInUp 0.6s ease-out backwards;
        width: 100%;
        border: 1px solid #f0f0f0;
        display: flex;
        flex-direction: column;
        min-height: 420px;
      }

      .product-card:nth-child(1) { animation-delay: 0.1s; }
      .product-card:nth-child(2) { animation-delay: 0.2s; }
      .product-card:nth-child(3) { animation-delay: 0.3s; }
      .product-card:nth-child(4) { animation-delay: 0.4s; }
      .product-card:nth-child(5) { animation-delay: 0.5s; }
      .product-card:nth-child(6) { animation-delay: 0.6s; }

      .product-card:hover {
        transform: translateY(-12px);
        box-shadow: 0 16px 48px rgba(227, 6, 19, 0.12);
        border-color: #E30613;
      }

      .product-card.recommended {
        box-shadow: 0 4px 16px rgba(227, 6, 19, 0.2);
      }
      
      .product-card-content {
        padding: 2rem;
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .product-card.recommended::before {
        content: '⭐ EMPFOHLEN';
        position: absolute;
        top: 15px;
        right: -35px;
        background: linear-gradient(135deg, #E30613, #B00510);
        color: white;
        padding: 6px 45px;
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.5px;
        transform: rotate(45deg);
        box-shadow: 0 4px 12px rgba(227, 6, 19, 0.4);
      }

      .product-icon {
        font-size: 4rem;
        margin-bottom: 1.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100px;
        background: linear-gradient(135deg, #fff5f5, #ffffff);
        border-radius: 16px;
        filter: drop-shadow(0 2px 8px rgba(227, 6, 19, 0.08));
      }

      .product-card:hover .product-icon {
        background: linear-gradient(135deg, #ffebeb, #fff5f5);
        transform: scale(1.05);
      }

      .product-name {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1a1a1a;
        margin-bottom: 1rem;
        line-height: 1.3;
        letter-spacing: -0.3px;
      }

      .product-description {
        color: #666;
        font-size: 1rem;
        margin-bottom: 1.5rem;
        line-height: 1.7;
        min-height: 48px;
        font-weight: 400;
      }

      .product-features {
        list-style: none;
        padding: 0;
        margin: 1.5rem 0;
        background: linear-gradient(135deg, #fafafa, #ffffff);
        border-radius: 16px;
        padding: 1.5rem;
        border: 1px solid #f0f0f0;
      }

      .product-features li {
        padding: 0.75rem 0;
        color: #444;
        font-size: 0.95rem;
        display: flex;
        align-items: flex-start;
        border-bottom: 1px solid #f5f5f5;
        line-height: 1.5;
      }

      .product-features li:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }

      .product-features li::before {
        content: '';
        width: 6px;
        height: 6px;
        background: #E30613;
        border-radius: 50%;
        margin-right: 1rem;
        margin-top: 0.5rem;
        flex-shrink: 0;
      }

      .product-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 2rem;
        padding-top: 1.5rem;
        border-top: 2px solid #f0f0f0;
        gap: 1rem;
      }

      .product-price {
        font-size: 2.5rem;
        font-weight: 800;
        color: #E30613;
        line-height: 1;
        letter-spacing: -1px;
      }

      .product-price .currency {
        font-size: 1.5rem;
        font-weight: 700;
        vertical-align: super;
        font-size: 1.2rem;
      }

      .product-duration {
        color: #999;
        font-size: 0.85rem;
        margin-top: 0.5rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .product-actions {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
      }

      .btn {
        padding: 0.85rem 1.75rem;
        border: none;
        border-radius: 12px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        font-size: 0.95rem;
        letter-spacing: 0.3px;
        white-space: nowrap;
      }

      .btn-primary {
        background: linear-gradient(135deg, #E30613, #B00510);
        color: white;
        box-shadow: 0 4px 15px rgba(227, 6, 19, 0.3);
      }

      .btn-primary:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 20px rgba(227, 6, 19, 0.4);
        background: linear-gradient(135deg, #ff0717, #E30613);
      }

      .btn-primary:active {
        transform: translateY(-1px);
      }

      .btn-secondary {
        background: white;
        color: #E30613;
        border: 2px solid #E30613;
      }

      .btn-secondary:hover {
        background: #E30613;
        color: white;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(227, 6, 19, 0.2);
      }

      .discount-badge {
        position: absolute;
        top: 15px;
        left: 15px;
        background: linear-gradient(135deg, #ff9800, #f57c00);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 10px;
        font-weight: 700;
        font-size: 0.9rem;
        box-shadow: 0 4px 12px rgba(255, 152, 0, 0.4);
        letter-spacing: 0.5px;
      }

      /* Modal Styles - for product details and cart */
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.85);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      }

      .modal-overlay.active {
        display: flex;
      }

      .modal-content {
        background: white;
        border-radius: 20px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        padding: 2rem;
        position: relative;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        animation: modalSlideIn 0.3s ease-out;
      }

      @keyframes modalSlideIn {
        from {
          transform: translateY(-20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      .modal-close {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: none;
        border: none;
        font-size: 2rem;
        cursor: pointer;
        color: var(--circle-k-gray);
        transition: color 0.3s ease;
      }

      .modal-close:hover {
        color: var(--circle-k-red);
      }

      .modal-icon {
        font-size: 4rem;
        text-align: center;
        margin-bottom: 1rem;
      }

      .modal-title {
        font-size: 1.8rem;
        font-weight: 700;
        color: var(--circle-k-dark);
        margin-bottom: 0.5rem;
        text-align: center;
      }

      .modal-description {
        color: var(--circle-k-gray);
        text-align: center;
        margin-bottom: 2rem;
      }

      .cart-summary {
        background: var(--circle-k-light-gray);
        border-radius: 12px;
        padding: 1.5rem;
        margin-top: 2rem;
      }

      .cart-item {
        display: flex;
        justify-content: space-between;
        padding: 0.75rem 0;
        border-bottom: 1px solid #ddd;
      }

      .cart-item:last-child {
        border-bottom: none;
      }

      .cart-total {
        display: flex;
        justify-content: space-between;
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--circle-k-red);
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 2px solid var(--circle-k-red);
      }

      /* Animations */
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes pulse {
        0%, 100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.05);
        }
      }

      @keyframes bounce {
        0%, 100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-10px);
        }
      }

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      /* Responsive Design - Mobile First */
      @media (max-width: 480px) {
        .recommendations-container {
          padding: 0 20px;
          margin: 2rem auto;
        }

        .recommendations-container::before {
          margin-bottom: 2rem;
        }

        .recommendation-header {
          padding: 4rem 1rem 1.5rem;
          margin-bottom: 2rem;
        }

        .back-to-offers-btn {
          position: static;
          margin: 0 auto 1.5rem;
          width: fit-content;
        }

        .recommendation-header h2 {
          font-size: 1.8rem;
        }

        .recommendation-header p {
          font-size: 1rem;
        }

        .weather-badge {
          padding: 0.6rem 1.2rem;
          font-size: 0.85rem;
        }

        .recommendations-container h3 {
          font-size: 1.4rem;
          margin: 2rem 0 1rem;
        }

        .products-grid {
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        .product-card {
          padding: 1.5rem;
          max-width: 100%;
        }

        .product-icon {
          font-size: 2.5rem;
        }

        .product-name {
          font-size: 1.2rem;
        }

        .product-description {
          font-size: 0.9rem;
          min-height: auto;
        }

        .product-footer {
          flex-direction: column;
          align-items: flex-start;
          gap: 1rem;
        }

        .product-actions {
          width: 100%;
          flex-direction: column;
        }

        .btn {
          width: 100%;
          text-align: center;
        }

        .product-price {
          font-size: 1.8rem;
        }
      }

      @media (min-width: 481px) and (max-width: 768px) {
        .recommendations-container {
          padding: 0 1.5rem;
        }

        .recommendation-header h2 {
          font-size: 2rem;
        }

        .products-grid {
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .product-card {
          max-width: 100%;
        }
      }

      @media (min-width: 769px) and (max-width: 1024px) {
        .products-grid {
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
        }

        .product-card {
          max-width: 100%;
        }
      }

      @media (min-width: 1025px) {
        .products-grid {
          grid-template-columns: repeat(3, 1fr);
        }
      }

      @media (min-width: 1400px) {
        .recommendations-container {
          max-width: 1600px;
        }
      }
    `;
    
    document.head.appendChild(styles);
  }

  showWeatherRecommendations(weatherCondition, temperature) {
    console.log('🎬 showWeatherRecommendations called with:', { weatherCondition, temperature });
    this.init();
    console.log('✅ Init complete, container:', this.container);
    this.currentWeather = { condition: weatherCondition, temperature };
    
    const lang = languageManager.getLang();
    console.log('🌍 Language:', lang);
    const recommendations = getWeatherBasedRecommendations(weatherCondition, temperature);
    
    console.log('🌤️ Showing weather-based recommendations:', recommendations);
    
    const content = `
      <div class="recommendation-header">
        <button class="back-to-offers-btn" onclick="window.recommendationsManager.clearRecommendations()">
          ← ${lang === 'de' ? 'Zurück zu Angeboten' : 'Back to Offers'}
        </button>
        <h2>${lang === 'de' ? 'Ihre persönlichen Empfehlungen' : 'Your Personal Recommendations'}</h2>
        <p>${recommendations.message[lang]}</p>
        <span class="weather-badge">
          ${weatherCondition || 'Perfect weather'} 
          ${temperature ? `• ${Math.round(temperature)}°C` : ''}
        </span>
      </div>

      <h3>
        ${lang === 'de' ? 'Waschprogramme' : 'Wash Programs'}
      </h3>
      <div class="products-grid">
        ${recommendations.washPrograms.map((program, index) => this.renderProductCard(program, 'wash', lang, index)).join('')}
      </div>

      <h3>
        ${lang === 'de' ? 'Autopflegeprodukte' : 'Car Care Products'}
      </h3>
      <div class="products-grid">
        ${recommendations.products.map((product, index) => this.renderProductCard(product, 'product', lang, index + 3)).join('')}
      </div>
    `;
    
    this.updateContent(content);
    this.attachEventListeners();
  }

  renderProductCard(item, type, lang, index) {
    const isRecommended = item.recommended;
    const hasDiscount = item.discount;
    
    return `
      <div class="product-card ${isRecommended ? 'recommended' : ''}" data-product-id="${item.id}" data-type="${type}">
        ${hasDiscount ? `<div class="discount-badge">-${item.discount}</div>` : ''}
        <div class="product-card-content">
          <span class="product-icon">${item.icon}</span>
          <div class="product-name">${item.name[lang]}</div>
          <div class="product-description">${item.description[lang]}</div>
          
          <ul class="product-features">
            ${item.features[lang].slice(0, 3).map(feature => `<li>${feature}</li>`).join('')}
          </ul>
          
          <div class="product-footer">
            <div>
              <div class="product-price">
                <span class="currency">€</span>${item.price.toFixed(2)}
              </div>
              ${item.duration ? `<div class="product-duration">⏱️ ${item.duration}</div>` : ''}
            </div>
            <div class="product-actions">
              <button class="btn btn-secondary view-details" data-product-id="${item.id}" data-type="${type}">
                ${lang === 'de' ? 'Details' : 'Details'}
              </button>
              <button class="btn btn-primary add-to-cart" data-product-id="${item.id}" data-type="${type}">
                ${lang === 'de' ? 'Wählen' : 'Select'}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    // View details buttons
    document.querySelectorAll('.view-details').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const productId = btn.dataset.productId;
        const type = btn.dataset.type;
        this.showProductDetails(productId, type);
      });
    });

    // Add to cart buttons
    document.querySelectorAll('.add-to-cart').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const productId = btn.dataset.productId;
        const type = btn.dataset.type;
        this.addToCart(productId, type);
      });
    });

    // Product card click
    document.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', () => {
        const productId = card.dataset.productId;
        const type = card.dataset.type;
        this.showProductDetails(productId, type);
      });
    });
  }

  showProductDetails(productId, type) {
    const lang = languageManager.getLang();
    const product = this.getProduct(productId, type);
    if (!product) return;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <button class="modal-close">&times;</button>
        <div class="modal-icon">${product.icon}</div>
        <h2 class="modal-title">${product.name[lang]}</h2>
        <p class="modal-description">${product.description[lang]}</p>
        
        <h3 style="margin-top: 1.5rem; margin-bottom: 0.75rem; color: var(--circle-k-dark);">
          ${lang === 'de' ? 'Leistungen:' : 'Features:'}
        </h3>
        <ul class="product-features">
          ${product.features[lang].map(feature => `<li>${feature}</li>`).join('')}
        </ul>
        
        <div style="text-align: center; margin-top: 2rem;">
          <div class="product-price" style="margin-bottom: 1rem;">
            <span class="currency">€</span>${product.price.toFixed(2)}
          </div>
          <button class="btn btn-primary" style="width: 100%;" onclick="window.recommendationsManager.addToCart('${productId}', '${type}'); this.closest('.modal-overlay').remove();">
            ${lang === 'de' ? '✓ Auswählen & Weiter' : '✓ Select & Continue'}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    modal.classList.add('active');

    modal.querySelector('.modal-close').addEventListener('click', () => {
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  addToCart(productId, type) {
    const product = this.getProduct(productId, type);
    if (!product) return;

    this.cart.push({ ...product, type });
    console.log('🛒 Added to cart:', product);
    
    this.showCartSummary();
  }

  showCartSummary() {
    const lang = languageManager.getLang();
    const total = this.cart.reduce((sum, item) => sum + item.price, 0);

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <button class="modal-close">&times;</button>
        <div class="modal-icon">🛒</div>
        <h2 class="modal-title">${lang === 'de' ? 'Ihre Auswahl' : 'Your Selection'}</h2>
        
        <div class="cart-summary">
          ${this.cart.map(item => `
            <div class="cart-item">
              <span>${item.icon} ${item.name[lang]}</span>
              <span style="font-weight: 600;">€${item.price.toFixed(2)}</span>
            </div>
          `).join('')}
          
          <div class="cart-total">
            <span>${lang === 'de' ? 'Gesamt:' : 'Total:'}</span>
            <span>€${total.toFixed(2)}</span>
          </div>
        </div>
        
        <div style="margin-top: 2rem; display: flex; gap: 1rem;">
          <button class="btn btn-secondary" style="flex: 1;" onclick="this.closest('.modal-overlay').remove();">
            ${lang === 'de' ? 'Weiter einkaufen' : 'Continue Shopping'}
          </button>
          <button class="btn btn-primary" style="flex: 1;" onclick="window.recommendationsManager.checkout();">
            ${lang === 'de' ? 'Zur Kasse' : 'Checkout'}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    modal.classList.add('active');

    modal.querySelector('.modal-close').addEventListener('click', () => {
      modal.remove();
    });
  }

  checkout() {
    const lang = languageManager.getLang();
    const total = this.cart.reduce((sum, item) => sum + item.price, 0);

    // Close cart modal
    document.querySelector('.modal-overlay')?.remove();

    // Show checkout modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-icon">✅</div>
        <h2 class="modal-title">${lang === 'de' ? 'Vielen Dank!' : 'Thank You!'}</h2>
        <p class="modal-description">
          ${lang === 'de' 
            ? 'Ihre Bestellung wurde erfolgreich aufgegeben. Besuchen Sie uns an einer Circle K Waschanlage in Ihrer Nähe!' 
            : 'Your order has been successfully placed. Visit us at a Circle K car wash near you!'}
        </p>
        
        <div style="background: var(--circle-k-light-gray); padding: 1.5rem; border-radius: 12px; margin: 1.5rem 0;">
          <div style="font-size: 1.2rem; color: var(--circle-k-gray); margin-bottom: 0.5rem;">
            ${lang === 'de' ? 'Gesamtbetrag:' : 'Total Amount:'}
          </div>
          <div style="font-size: 2.5rem; font-weight: 700; color: var(--circle-k-red);">
            €${total.toFixed(2)}
          </div>
        </div>
        
        <button class="btn btn-primary" style="width: 100%;" onclick="this.closest('.modal-overlay').remove(); window.recommendationsManager.cart = [];">
          ${lang === 'de' ? 'Schließen' : 'Close'}
        </button>
      </div>
    `;

    document.body.appendChild(modal);
  }

  getProduct(productId, type) {
    if (type === 'wash') {
      return CIRCLE_K_PRODUCTS.washPrograms.find(p => p.id === productId);
    } else {
      return CIRCLE_K_PRODUCTS.carCareProducts.find(p => p.id === productId);
    }
  }

  updateContent(htmlContent) {
    if (!this.container) {
      console.error('❌ Container not found!');
      return;
    }
    
    // Hide default content immediately
    if (this.defaultContent) {
      this.defaultContent.classList.add('hidden');
      console.log('🙈 Hiding default content');
    }
    
    // Show recommendations immediately
    this.container.innerHTML = htmlContent;
    this.container.classList.remove('hidden');
    this.container.classList.add('active');
    console.log('✨ Showing recommendations');
    console.log('📦 Container HTML length:', htmlContent.length);
    console.log('📦 Container classes:', this.container.className);
    console.log('📦 Container visible:', this.container.offsetHeight > 0);
    
    // Smooth scroll to top of tab after content is rendered
    setTimeout(() => {
      const weatherOffersTab = document.getElementById('tab-weather-offers');
      if (weatherOffersTab) {
        weatherOffersTab.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  clearRecommendations() {
    if (!this.container) return;
    
    console.log('🧹 Clearing recommendations');
    this.container.classList.remove('active');
    this.container.classList.add('hidden');
    
    // Restore default content
    setTimeout(() => {
      this.container.innerHTML = '';
      if (this.defaultContent) {
        this.defaultContent.classList.remove('hidden');
        console.log('👁️ Restoring default content');
      }
    }, 500);
  }
}

// Create singleton instance
const recommendationsManager = new EnhancedRecommendationsManager();

// Export functions
export function showWeatherRecommendations(weatherCondition, temperature) {
  recommendationsManager.showWeatherRecommendations(weatherCondition, temperature);
}

export function clearRecommendations() {
  recommendationsManager.clearRecommendations();
}

// Expose globally
window.recommendationsManager = recommendationsManager;
window.showWeatherRecommendations = showWeatherRecommendations;
window.clearRecommendations = clearRecommendations;
