// Circle K Recommendations Module
// Manages dynamic promotional content injection

class RecommendationsManager {
  constructor() {
    this.currentSection = null;
    this.container = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    
    // Create recommendations container if it doesn't exist
    this.container = document.getElementById('recommendations-section');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'recommendations-section';
      this.container.className = 'recommendations-container hidden';
      
      // Insert after avatar container
      const avatarContainer = document.getElementById('avatar-container');
      if (avatarContainer && avatarContainer.parentNode) {
        avatarContainer.parentNode.insertBefore(this.container, avatarContainer.nextSibling);
      } else {
        document.body.appendChild(this.container);
      }
    }
    
    this.initialized = true;
    console.log('✅ Recommendations Manager initialized');
  }

  showWashPrograms() {
    this.init();
    console.log('🚿 Showing wash programs recommendation');
    
    const content = `
      <div class="recommendation-card fade-in">
        <div class="recommendation-header">
          <h2>Waschprogramme | Circle K</h2>
          <div class="circle-k-logo">⭕ K</div>
        </div>
        <div class="recommendation-body">
          <div class="wash-program">
            <h3>🌟 Premium Wäsche</h3>
            <p>Intensive Reinigung mit Heißwachs und Glanztrocknung</p>
            <span class="price">€12.90</span>
          </div>
          <div class="wash-program">
            <h3>💎 Deluxe Wäsche</h3>
            <p>Komplett-Paket mit Unterbodenwäsche und Felgenreinigung</p>
            <span class="price">€16.90</span>
          </div>
          <div class="wash-program highlight">
            <h3>☀️ Frühlings-Special</h3>
            <p>Perfekt für sonnige Tage - mit Insektenentferner</p>
            <span class="price special">€14.90</span>
            <span class="badge">EMPFOHLEN</span>
          </div>
        </div>
        <div class="recommendation-footer">
          <p>💡 Jetzt ist der ideale Zeitpunkt für eine gründliche Autowäsche!</p>
        </div>
      </div>
    `;
    
    this.updateContent(content, 'wash-programs');
  }

  showCarCareProducts() {
    this.init();
    console.log('🧴 Showing car care products recommendation');
    
    const content = `
      <div class="recommendation-card fade-in">
        <div class="recommendation-header">
          <h2>Autopflegeprodukte | Circle K</h2>
          <div class="circle-k-logo">⭕ K</div>
        </div>
        <div class="recommendation-body">
          <div class="product-item">
            <h3>🛞 Reifenpflege-Set</h3>
            <p>Reifenglanz und UV-Schutz für Sommerreifen</p>
            <span class="price">€8.90</span>
          </div>
          <div class="product-item">
            <h3>🧽 Premium Autowachs</h3>
            <p>Langanhaltender Schutz und Hochglanz</p>
            <span class="price">€12.90</span>
          </div>
          <div class="product-item highlight">
            <h3>🌟 Frühjahrs-Paket</h3>
            <p>Komplett-Set: Wachs, Felgenreiniger & Cockpitspray</p>
            <span class="price special">€19.90</span>
            <span class="badge">SPAR-ANGEBOT</span>
          </div>
        </div>
        <div class="recommendation-footer">
          <p>🚗 Perfekt für den Reifenwechsel - Dein Auto verdient das Beste!</p>
        </div>
      </div>
    `;
    
    this.updateContent(content, 'car-care');
  }

  clearRecommendations() {
    if (!this.container) return;
    
    console.log('🧹 Clearing recommendations');
    this.container.classList.add('fade-out');
    
    setTimeout(() => {
      this.container.innerHTML = '';
      this.container.classList.remove('fade-out', 'active');
      this.container.classList.add('hidden');
      this.currentSection = null;
    }, 400);
  }

  updateContent(htmlContent, sectionType) {
    if (!this.container) return;
    
    // If switching sections, fade out first
    if (this.currentSection && this.currentSection !== sectionType) {
      this.container.classList.add('fade-out');
      setTimeout(() => {
        this.container.innerHTML = htmlContent;
        this.container.classList.remove('fade-out', 'hidden');
        this.container.classList.add('active');
        this.currentSection = sectionType;
      }, 400);
    } else {
      // First time showing or same section
      this.container.innerHTML = htmlContent;
      this.container.classList.remove('hidden', 'fade-out');
      this.container.classList.add('active');
      this.currentSection = sectionType;
    }
  }
}

// Create singleton instance
const recommendationsManager = new RecommendationsManager();

// Export functions
export function showWashPrograms() {
  recommendationsManager.showWashPrograms();
}

export function showCarCareProducts() {
  recommendationsManager.showCarCareProducts();
}

export function clearRecommendations() {
  recommendationsManager.clearRecommendations();
}

// Expose globally for easy access
window.showWashPrograms = showWashPrograms;
window.showCarCareProducts = showCarCareProducts;
window.clearRecommendations = clearRecommendations;
