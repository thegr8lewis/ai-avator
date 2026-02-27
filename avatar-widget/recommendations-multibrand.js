// Multibrand recommendations overlay for OBI and KiK
// Builds a lightweight full-screen panel with weather-aware picks

import languageManager from './language.js';

const PRODUCT_DATA = {
  obi: {
    theme: {
      primary: '#e07a15',
      gradient: 'linear-gradient(135deg, #fff4e8 0%, #ffe2c4 100%)',
      panelBorderRadius: '12px',
      cardBorderRadius: '8px',
      overlayBackground: 'rgba(0,0,0,0.7)',
      panelBackground: '#ffffff',
      contentBackground: '#fafafa',
      cardBorder: '2px solid #e0e0e0',
      cardHoverBorder: '3px solid #e07a15',
      headerBorder: '2px solid #e0e0e0',
      fontSize: '1rem',
      cardShadow: '0 8px 24px rgba(224, 122, 21, 0.15)',
    },
    products: [
      {
        id: 'obi-grill',
        name: { de: 'Gasgrill Torino', en: 'Torino Gas Grill' },
        desc: { de: '3-Brenner mit Seitenkocher, perfekt für sonnige Tage.', en: '3-burner with side stove, perfect for sunny days.' },
        price: '299,00 €',
        tags: ['sunny', 'warm'],
        image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop',
        fallbackImage: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop'
      },
      {
        id: 'obi-terrasse',
        name: { de: 'Terrassenreiniger', en: 'Patio Cleaner' },
        desc: { de: 'Hochdruckreiniger für Pollen und Regenrückstände.', en: 'Pressure washer for pollen and rain residue.' },
        price: '89,90 €',
        tags: ['rain', 'cloudy'],
        image: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=800&auto=format&fit=crop',
        fallbackImage: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop'
      },
      {
        id: 'obi-heizstrahler',
        name: { de: 'Infrarot-Heizstrahler', en: 'Infrared Heater' },
        desc: { de: 'Wärme auf Balkon & Terrasse für kühle Tage.', en: 'Outdoor warmth for cooler days.' },
        price: '119,00 €',
        tags: ['cold', 'cloudy'],
        image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop',
        fallbackImage: 'https://images.unsplash.com/photo-1545259741-2ea3ebf61fa3?w=800&auto=format&fit=crop'
      },
      {
        id: 'obi-markise',
        name: { de: 'Sonnenschutz-Markise', en: 'Sunshade Awning' },
        desc: { de: 'UV-Schutz & Schatten für heiße Tage.', en: 'UV shade for hot sunny days.' },
        price: '249,00 €',
        tags: ['sunny', 'warm'],
        image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&auto=format&fit=crop',
        fallbackImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop'
      },
      {
        id: 'obi-entfeuchter',
        name: { de: 'Luftentfeuchter 20L', en: 'Dehumidifier 20L' },
        desc: { de: 'Gegen feuchte Räume bei Regen & Kälte.', en: 'Tames damp rooms in rainy/cold days.' },
        price: '159,00 €',
        tags: ['rain', 'cold', 'cloudy'],
        image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&auto=format&fit=crop',
        fallbackImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop'
      },
      {
        id: 'obi-pellet',
        name: { de: 'Pelletheizung Starter', en: 'Pellet Heating Starter' },
        desc: { de: 'Effizient heizen bei Frost & Schnee.', en: 'Efficient heat for frost/snow days.' },
        price: '499,00 €',
        tags: ['snow', 'cold'],
        image: 'https://images.unsplash.com/photo-1470246973918-29a93221c455?w=800&auto=format&fit=crop',
        fallbackImage: 'https://images.unsplash.com/photo-1516528387618-afa90b13e000?w=800&auto=format&fit=crop'
      }
    ]
  },
  kik: {
    theme: {
      primary: '#cc0000',
      gradient: 'linear-gradient(135deg, #fff0f0 0%, #ffd9d9 100%)',
      panelBorderRadius: '0',
      cardBorderRadius: '0',
      overlayBackground: 'rgba(0,0,0,0.8)',
      panelBackground: '#ffffff',
      contentBackground: '#f5f5f5',
      cardBorder: '3px solid #cc0000',
      cardHoverBorder: '4px solid #cc0000',
      headerBorder: '3px solid #cc0000',
      fontSize: '0.95rem',
      cardShadow: '0 4px 16px rgba(204, 0, 0, 0.2)',
    },
    products: [
      {
        id: 'kik-parka',
        name: { de: 'Wasserfester Parka', en: 'Waterproof Parka' },
        desc: { de: 'Gefüttert, Kapuze, ideal bei Regen und Wind.', en: 'Lined parka with hood for rain and wind.' },
        price: '39,99 €',
        tags: ['rain', 'cold'],
        image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&auto=format&fit=crop',
        fallbackImage: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&auto=format&fit=crop'
      },
      {
        id: 'kik-tee',
        name: { de: 'Basic T-Shirts 3er Pack', en: 'Basic T-Shirts 3-pack' },
        desc: { de: 'Baumwolle, atmungsaktiv, sonnige Tage.', en: 'Cotton, breathable, sunny days.' },
        price: '9,99 €',
        tags: ['sunny', 'warm'],
        image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop',
        fallbackImage: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&auto=format&fit=crop'
      },
      {
        id: 'kik-winterset',
        name: { de: 'Winter-Accessoires Set', en: 'Winter Accessories Set' },
        desc: { de: 'Mütze, Schal, Handschuhe – warm & weich.', en: 'Hat, scarf, gloves – warm and soft.' },
        price: '14,99 €',
        tags: ['snow', 'cold'],
        image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=800&auto=format&fit=crop',
        fallbackImage: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800&auto=format&fit=crop'
      }
    ]
  },
  circlek: {
    theme: {
      primary: '#e30613',
      gradient: 'linear-gradient(135deg, #fff0f0 0%, #ffe5e5 100%)',
      panelBorderRadius: '16px',
      cardBorderRadius: '12px',
      overlayBackground: 'rgba(0,0,0,0.75)',
      panelBackground: '#ffffff',
      contentBackground: '#fafafa',
      cardBorder: '2px solid #e5e5e5',
      cardHoverBorder: '2px solid #e30613',
      headerBorder: '1px solid #e5e5e5',
      fontSize: '1rem',
      cardShadow: '0 12px 32px rgba(227, 6, 19, 0.18)',
    },
    products: [
      {
        id: 'ck-wash-premium',
        name: { de: 'Premium Autowäsche', en: 'Premium Car Wash' },
        desc: { de: 'Heißwachs & Felgenreinigung – ideal nach Regen.', en: 'Hot wax + wheel clean — great after rain.' },
        price: '12,90 €',
        tags: ['rain', 'cloudy'],
        image: 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&auto=format&fit=crop',
        fallbackImage: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800&auto=format&fit=crop'
      },
      {
        id: 'ck-wiper',
        name: { de: 'Scheibenwischer-Set', en: 'Wiper Blade Set' },
        desc: { de: 'Klare Sicht bei Regen & Schnee.', en: 'Clear vision for rain & snow.' },
        price: '24,90 €',
        tags: ['rain', 'snow'],
        image: 'https://images.unsplash.com/photo-1580041065738-e72023775cdc?w=800&auto=format&fit=crop',
        fallbackImage: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&auto=format&fit=crop'
      },
      {
        id: 'ck-rain-repellent',
        name: { de: 'Regenabweiser', en: 'Rain Repellent' },
        desc: { de: '6 Monate Schutz gegen Spritzwasser.', en: '6-month water beading protection.' },
        price: '9,90 €',
        tags: ['rain', 'cloudy'],
        image: 'https://images.unsplash.com/photo-1503377985300-7c1c39baabef?w=800&auto=format&fit=crop',
        fallbackImage: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&auto=format&fit=crop'
      },
      {
        id: 'ck-winter-kit',
        name: { de: 'Winter-Kit', en: 'Winter Kit' },
        desc: { de: 'Enteiser, Frostschutz, Eiskratzer für Frosttage.', en: 'De-icer, antifreeze, scraper for frosty days.' },
        price: '15,90 €',
        tags: ['snow', 'cold'],
        image: 'https://images.unsplash.com/photo-1512069283445-442360f1389c?w=800&auto=format&fit=crop',
        fallbackImage: 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=800&auto=format&fit=crop'
      },
      {
        id: 'ck-coffee',
        name: { de: 'Heißgetränke To-Go', en: 'Hot Drinks To-Go' },
        desc: { de: 'Perfekt bei kaltem, nassem Wetter.', en: 'Perfect for cold, wet weather.' },
        price: '2,90 €',
        tags: ['rain', 'cold', 'snow'],
        image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop',
        fallbackImage: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop'
      }
    ]
  }
};

function deriveTag(weatherSummary = '') {
  const s = String(weatherSummary || '').toLowerCase();
  // German synonyms
  const de = {
    snow: ['schnee', 'schneeschauer', 'schneefall', 'schneesturm'],
    rain: ['regen', 'niesel', 'nieselregen', 'schauer', 'regnerisch'],
    cold: ['kalt', 'kälte', 'frost', 'frieren', 'gefrier'],
    sunny: ['sonnig', 'sonne', 'heiter', 'klar', 'klarem himmel'],
    warm: ['warm', 'heiß', 'heiss', 'hitze'],
    cloudy: ['wolkig', 'bewölkt', 'ueberwiegend bewölkt', 'überwiegend bewölkt', 'bedeckt']
  };
  // English synonyms
  const en = {
    snow: ['snow', 'snowy', 'snow showers'],
    rain: ['rain', 'drizzle', 'showers', 'rainy'],
    cold: ['cold', 'frost', 'freez'],
    sunny: ['sunny', 'sun', 'clear'],
    warm: ['warm', 'hot', 'heat'],
    cloudy: ['cloud', 'overcast']
  };
  const hasAny = (arr) => arr.some(w => s.includes(w));
  if (hasAny(de.snow) || hasAny(en.snow)) return 'snow';
  if (hasAny(de.rain) || hasAny(en.rain)) return 'rain';
  if (hasAny(de.cold) || hasAny(en.cold)) return 'cold';
  if (hasAny(de.sunny) || hasAny(en.sunny)) return 'sunny';
  if (hasAny(de.warm) || hasAny(en.warm)) return 'warm';
  if (hasAny(de.cloudy) || hasAny(en.cloudy)) return 'cloudy';

  // Temperature-based fallback (°C, Grad, degrees)
  const m = s.match(/(-?\d+)\s*(?:°\s*C|°c|°|grad|degrees|degree)/);
  if (m) {
    const t = parseInt(m[1], 10);
    if (!isNaN(t)) {
      if (t <= 5) return 'cold';
      if (t >= 24) return 'warm';
    }
  }
  return 'cloudy';
}

function pickProducts(brand, weatherSummary = '') {
  const data = PRODUCT_DATA[brand];
  if (!data) return { theme: {}, products: [] };
  const tag = deriveTag(weatherSummary);
  const products = data.products.filter(p => p.tags.some(t => tag.includes(t) || t.includes(tag)));
  return { theme: data.theme, products: products.length ? products : data.products };
}

function ensureOverlay() {
  let overlay = document.getElementById('brand-reco-overlay');
  if (overlay) return overlay;
  overlay = document.createElement('div');
  overlay.id = 'brand-reco-overlay';
  overlay.innerHTML = `
    <style id="brand-reco-styles">
      #brand-reco-overlay { position: fixed; inset:0; background: var(--overlay-bg, rgba(0,0,0,0.75)); display:none; z-index: 9000; backdrop-filter: blur(8px); }
      #brand-reco-panel { position: absolute; inset: 5% 8%; background: var(--panel-bg, #ffffff); border-radius: var(--panel-radius, 0); overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3); display: flex; flex-direction: column; }
      #brand-reco-close { position:absolute; top:20px; right:20px; border:none; background:#000; color:#fff; width:36px; height:36px; cursor:pointer; font-size:24px; z-index:10; transition: all 0.2s; }
      #brand-reco-close:hover { background:#333; transform: scale(1.1); }
      .reco-header { background: var(--hero-gradient, linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)); padding: 32px 40px; border-bottom: var(--header-border, 2px solid #e0e0e0); }
      .reco-hero { display:flex; gap:16px; align-items:center; justify-content: space-between; }
      .reco-hero-left { flex: 1; }
      .reco-hero .pill { display:inline-flex; align-items:center; gap:6px; padding:8px 16px; background: rgba(0,0,0,0.08); font-weight:700; font-size: calc(var(--base-font, 1rem) * 0.75); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
      .reco-hero h2 { margin: 0 0 8px 0; font-size: calc(var(--base-font, 1rem) * 2); font-weight: 800; color: #1a1a1a; }
      .reco-hero p { margin: 0; color: #666; font-size: calc(var(--base-font, 1rem) * 0.95); }
      .reco-content { flex: 1; overflow-y: auto; padding: 40px; background: var(--content-bg, #fafafa); }
      #brand-reco-grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(280px,1fr)); gap:24px; }
      .reco-card { border: var(--card-border, 2px solid #e0e0e0); background:#fff; padding:0; overflow: hidden; transition: all 0.3s ease; cursor: pointer; border-radius: var(--card-radius, 0); }
      .reco-card:hover { border: var(--card-hover-border, 2px solid #000); box-shadow: var(--card-shadow, 0 8px 24px rgba(0,0,0,0.15)); transform: translateY(-4px); }
      .reco-card-image { width:100%; height:220px; overflow: hidden; background: #f5f5f5; border-radius: var(--card-radius, 0) var(--card-radius, 0) 0 0; }
      .reco-card img { width:100%; height:100%; object-fit:cover; transition: transform 0.3s; }
      .reco-card:hover img { transform: scale(1.05); }
      .reco-card-body { padding: 20px; }
      .reco-card h3 { margin:0 0 8px; font-size: calc(var(--base-font, 1rem) * 1.15); font-weight: 700; color: #1a1a1a; }
      .reco-card p { margin:0 0 16px; color:#666; font-size: calc(var(--base-font, 1rem) * 0.9); line-height: 1.5; }
      .reco-price { font-weight:800; margin-bottom:16px; font-size: calc(var(--base-font, 1rem) * 1.3); color: var(--primary, #000); }
      .reco-tags { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:16px; }
      .reco-tag { padding:6px 12px; background:#f0f0f0; font-size: calc(var(--base-font, 1rem) * 0.75); font-weight:600; text-transform: uppercase; letter-spacing: 0.3px; color: #555; }
      .reco-cta { display:flex; gap:12px; }
      .reco-cta button { flex:1; padding:14px 16px; border:2px solid #e0e0e0; cursor:pointer; font-weight:700; background: #fff; transition: all 0.2s; font-size: calc(var(--base-font, 1rem) * 0.9); text-transform: uppercase; letter-spacing: 0.5px; }
      .reco-cta button:hover { background: #f5f5f5; border-color: #999; }
      .reco-cta button.primary { color:#fff; border:none; background: var(--primary, #000); }
      .reco-cta button.primary:hover { opacity: 0.9; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
      #brand-reco-detail { position: absolute; inset: 0; background: #fff; display: none; flex-direction: column; z-index: 5; }
      #brand-reco-detail.active { display: flex; }
      .detail-header { background: #1a1a1a; color: #fff; padding: 24px 40px; display: flex; align-items: center; gap: 20px; }
      .detail-back { background: transparent; border: 2px solid #fff; color: #fff; padding: 10px 20px; cursor: pointer; font-weight: 700; transition: all 0.2s; text-transform: uppercase; font-size: calc(var(--base-font, 1rem) * 0.85); }
      .detail-back:hover { background: #fff; color: #1a1a1a; }
      .detail-header h2 { margin: 0; flex: 1; font-size: calc(var(--base-font, 1rem) * 1.5); }
      .detail-content { flex: 1; overflow-y: auto; padding: 40px; background: var(--content-bg, #fafafa); }
      .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; max-width: 1200px; margin: 0 auto; }
      .detail-image { width: 100%; border: 2px solid #e0e0e0; background: #fff; border-radius: var(--card-radius, 0); }
      .detail-image img { width: 100%; display: block; }
      .detail-info { background: #fff; padding: 32px; border: 2px solid #e0e0e0; border-radius: var(--card-radius, 0); }
      .detail-info h3 { margin: 0 0 16px; font-size: calc(var(--base-font, 1rem) * 1.8); font-weight: 800; color: #1a1a1a; }
      .detail-info .price { font-size: calc(var(--base-font, 1rem) * 2); font-weight: 800; color: var(--primary, #000); margin-bottom: 24px; }
      .detail-info p { color: #666; line-height: 1.7; margin-bottom: 24px; }
      .detail-specs { margin: 24px 0; padding: 24px; background: #f5f5f5; border-left: 4px solid var(--primary, #000); }
      .detail-specs h4 { margin: 0 0 12px; font-size: var(--base-font, 1rem); text-transform: uppercase; letter-spacing: 0.5px; }
      .detail-specs ul { margin: 0; padding-left: 20px; }
      .detail-specs li { margin-bottom: 8px; color: #555; }
      .detail-actions { display: flex; gap: 16px; margin-top: 32px; }
      .detail-actions button { flex: 1; padding: 18px 24px; font-weight: 700; font-size: var(--base-font, 1rem); cursor: pointer; transition: all 0.2s; text-transform: uppercase; letter-spacing: 0.5px; }
      .detail-actions .btn-secondary { background: #fff; border: 2px solid #e0e0e0; }
      .detail-actions .btn-secondary:hover { background: #f5f5f5; border-color: #999; }
      .detail-actions .btn-primary { background: var(--primary, #000); color: #fff; border: none; }
      .detail-actions .btn-primary:hover { opacity: 0.9; transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.3); }
    </style>
    <div id="brand-reco-panel">
      <button id="brand-reco-close">×</button>
      <div class="reco-header">
        <div class="reco-hero">
          <div class="reco-hero-left">
            <div class="pill" id="brand-reco-pill">Weather fit</div>
            <h2 id="brand-reco-title">Empfehlungen</h2>
            <p id="brand-reco-sub">Wetterbasierte Vorschläge</p>
          </div>
        </div>
      </div>
      <div class="reco-content">
        <div id="brand-reco-grid"></div>
      </div>
      <div id="brand-reco-detail">
        <div class="detail-header">
          <button class="detail-back" id="detail-back-btn">← Back</button>
          <h2 id="detail-title">Product Details</h2>
        </div>
        <div class="detail-content">
          <div class="detail-grid">
            <div class="detail-image">
              <img id="detail-img" src="" alt="" />
            </div>
            <div class="detail-info">
              <h3 id="detail-name">Product Name</h3>
              <div class="price" id="detail-price">€0.00</div>
              <p id="detail-desc">Product description</p>
              <div class="detail-specs">
                <h4 id="detail-specs-title">Specifications</h4>
                <ul id="detail-specs-list"></ul>
              </div>
              <div class="detail-actions">
                <button class="btn-secondary" id="detail-save-btn">Save for Later</button>
                <button class="btn-primary" id="detail-checkout-btn">Checkout</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#brand-reco-close').addEventListener('click', hideOverlay);
  overlay.querySelector('#detail-back-btn').addEventListener('click', hideDetailPage);
  return overlay;
}

function hideOverlay() {
  const overlay = document.getElementById('brand-reco-overlay');
  if (overlay) {
    overlay.style.display = 'none';
    hideDetailPage();
  }
}

function showDetailPage(product, lang, theme) {
  const detailPage = document.getElementById('brand-reco-detail');
  if (!detailPage) return;
  
  const detailImg = document.getElementById('detail-img');
  detailImg.src = product.image;
  detailImg.alt = product.name[lang] || product.name.en;
  detailImg.onerror = function() {
    if (this.src !== (product.fallbackImage || product.image)) {
      this.src = product.fallbackImage || product.image;
    }
  };
  document.getElementById('detail-name').textContent = product.name[lang] || product.name.en;
  document.getElementById('detail-price').textContent = product.price;
  document.getElementById('detail-desc').textContent = product.desc?.[lang] || product.desc?.en || '';
  
  const specsTitle = document.getElementById('detail-specs-title');
  const specsList = document.getElementById('detail-specs-list');
  specsTitle.textContent = lang === 'de' ? 'Spezifikationen' : 'Specifications';
  
  const specs = product.specs || [
    lang === 'de' ? 'Hochwertige Qualität' : 'High quality',
    lang === 'de' ? 'Wetterbeständig' : 'Weather resistant',
    lang === 'de' ? 'Einfache Anwendung' : 'Easy to use'
  ];
  specsList.innerHTML = specs.map(s => `<li>${s}</li>`).join('');
  
  document.getElementById('detail-title').textContent = lang === 'de' ? 'Produktdetails' : 'Product Details';
  document.getElementById('detail-save-btn').textContent = lang === 'de' ? 'Für später merken' : 'Save for Later';
  document.getElementById('detail-checkout-btn').textContent = lang === 'de' ? 'Jetzt kaufen' : 'Buy Now';
  
  const primaryColor = theme?.primary || '#000';
  document.getElementById('detail-checkout-btn').style.background = primaryColor;
  document.querySelector('.detail-specs').style.borderLeftColor = primaryColor;
  
  detailPage.classList.add('active');
}

function hideDetailPage() {
  const detailPage = document.getElementById('brand-reco-detail');
  if (detailPage) detailPage.classList.remove('active');
}

export function showBrandRecommendations(weatherSummary = '', brand = 'obi') {
  const { theme, products } = pickProducts(brand, weatherSummary);
  const overlay = ensureOverlay();
  const grid = overlay.querySelector('#brand-reco-grid');
  const lang = languageManager.getLang() === 'de' ? 'de' : 'en';
  overlay.querySelector('#brand-reco-title').textContent = lang === 'de' ? 'Ihre Empfehlungen' : 'Your Recommendations';
  overlay.querySelector('#brand-reco-sub').textContent = weatherSummary || (lang === 'de' ? 'Basierend auf dem Wetter' : 'Based on the weather');
  const pill = overlay.querySelector('#brand-reco-pill');
  if (pill) pill.textContent = lang === 'de' ? 'Passt zum Wetter' : 'Fits the weather';
  
  grid.innerHTML = products.map((p, idx) => `
    <div class="reco-card" data-product-idx="${idx}">
      <div class="reco-card-image">
        <img src="${p.image}" alt="${p.name[lang] || p.name.en || ''}" 
             onerror="if(this.src!=='${p.fallbackImage || p.image}'){this.src='${p.fallbackImage || p.image}';}" />
      </div>
      <div class="reco-card-body">
        <h3>${p.name[lang] || p.name.en || ''}</h3>
        <p>${p.desc?.[lang] || p.desc?.en || ''}</p>
        <div class="reco-price">${p.price}</div>
        <div class="reco-tags">
          ${(p.tags || []).map(t => `<span class="reco-tag">${t}</span>`).join('')}
        </div>
        <div class="reco-cta">
          <button class="save-btn">${lang === 'de' ? 'Merken' : 'Save'}</button>
          <button class="primary checkout-btn" style="background:${theme.primary || '#000'}">${lang === 'de' ? 'Details' : 'Details'}</button>
        </div>
      </div>
    </div>`).join('');
  
  grid.querySelectorAll('.reco-card').forEach((card, idx) => {
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.save-btn') && !e.target.closest('.checkout-btn')) {
        showDetailPage(products[idx], lang, theme);
      }
    });
    
    const checkoutBtn = card.querySelector('.checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showDetailPage(products[idx], lang, theme);
      });
    }
    
    const saveBtn = card.querySelector('.save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        saveBtn.textContent = lang === 'de' ? '✓ Gemerkt' : '✓ Saved';
        saveBtn.style.background = '#4caf50';
        saveBtn.style.color = '#fff';
        saveBtn.style.borderColor = '#4caf50';
      });
    }
  });
  
  const backBtn = overlay.querySelector('#detail-back-btn');
  if (backBtn) {
    backBtn.replaceWith(backBtn.cloneNode(true));
    overlay.querySelector('#detail-back-btn').addEventListener('click', hideDetailPage);
  }
  
  const checkoutDetailBtn = overlay.querySelector('#detail-checkout-btn');
  if (checkoutDetailBtn) {
    checkoutDetailBtn.replaceWith(checkoutDetailBtn.cloneNode(true));
    overlay.querySelector('#detail-checkout-btn').addEventListener('click', () => {
      alert(lang === 'de' ? 'Weiterleitung zum Checkout...' : 'Redirecting to checkout...');
    });
  }
  
  const saveDetailBtn = overlay.querySelector('#detail-save-btn');
  if (saveDetailBtn) {
    saveDetailBtn.replaceWith(saveDetailBtn.cloneNode(true));
    overlay.querySelector('#detail-save-btn').addEventListener('click', () => {
      const btn = overlay.querySelector('#detail-save-btn');
      btn.textContent = lang === 'de' ? '✓ Gemerkt' : '✓ Saved';
      btn.style.background = '#4caf50';
      btn.style.color = '#fff';
      btn.style.borderColor = '#4caf50';
    });
  }
  
  const panel = overlay.querySelector('#brand-reco-panel');
  if (panel) {
    panel.style.setProperty('--primary', theme.primary || '#000');
    panel.style.setProperty('--overlay-bg', theme.overlayBackground || 'rgba(0,0,0,0.75)');
    panel.style.setProperty('--panel-bg', theme.panelBackground || '#ffffff');
    panel.style.setProperty('--panel-radius', theme.panelBorderRadius || '0');
    panel.style.setProperty('--content-bg', theme.contentBackground || '#fafafa');
    panel.style.setProperty('--card-border', theme.cardBorder || '2px solid #e0e0e0');
    panel.style.setProperty('--card-hover-border', theme.cardHoverBorder || '2px solid #000');
    panel.style.setProperty('--card-radius', theme.cardBorderRadius || '0');
    panel.style.setProperty('--header-border', theme.headerBorder || '2px solid #e0e0e0');
    panel.style.setProperty('--base-font', theme.fontSize || '1rem');
    panel.style.setProperty('--card-shadow', theme.cardShadow || '0 8px 24px rgba(0,0,0,0.15)');
    panel.style.setProperty('--hero-gradient', theme.gradient || 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)');
  }
  overlay.style.setProperty('--overlay-bg', theme.overlayBackground || 'rgba(0,0,0,0.75)');
  overlay.style.display = 'block';
}

window.showBrandRecommendations = showBrandRecommendations;
window.hideBrandRecommendations = hideOverlay;

export default showBrandRecommendations;
