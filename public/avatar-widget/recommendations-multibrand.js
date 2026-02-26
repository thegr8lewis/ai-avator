// Multibrand recommendations overlay for OBI and KiK
// Builds a lightweight full-screen panel with weather-aware picks

import languageManager from './language.js';

const PRODUCT_DATA = {
  obi: {
    theme: {
      primary: '#e07a15',
      gradient: 'linear-gradient(135deg, #fff4e8 0%, #ffe2c4 100%)',
    },
    products: [
      {
        id: 'obi-grill',
        name: { de: 'Gasgrill Torino', en: 'Torino Gas Grill' },
        desc: { de: '3-Brenner mit Seitenkocher, perfekt für sonnige Tage.', en: '3-burner with side stove, perfect for sunny days.' },
        price: '299,00 €',
        tags: ['sunny', 'warm'],
        image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop'
      },
      {
        id: 'obi-terrasse',
        name: { de: 'Terrassenreiniger', en: 'Patio Cleaner' },
        desc: { de: 'Hochdruckreiniger für Pollen und Regenrückstände.', en: 'Pressure washer for pollen and rain residue.' },
        price: '89,90 €',
        tags: ['rain', 'cloudy'],
        image: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=800&auto=format&fit=crop'
      },
      {
        id: 'obi-heizstrahler',
        name: { de: 'Infrarot-Heizstrahler', en: 'Infrared Heater' },
        desc: { de: 'Wärme auf Balkon & Terrasse für kühle Tage.', en: 'Outdoor warmth for cooler days.' },
        price: '119,00 €',
        tags: ['cold', 'cloudy'],
        image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop'
      },
      {
        id: 'obi-markise',
        name: { de: 'Sonnenschutz-Markise', en: 'Sunshade Awning' },
        desc: { de: 'UV-Schutz & Schatten für heiße Tage.', en: 'UV shade for hot sunny days.' },
        price: '249,00 €',
        tags: ['sunny', 'warm'],
        image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&auto=format&fit=crop'
      },
      {
        id: 'obi-entfeuchter',
        name: { de: 'Luftentfeuchter 20L', en: 'Dehumidifier 20L' },
        desc: { de: 'Gegen feuchte Räume bei Regen & Kälte.', en: 'Tames damp rooms in rainy/cold days.' },
        price: '159,00 €',
        tags: ['rain', 'cold', 'cloudy'],
        image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&auto=format&fit=crop'
      },
      {
        id: 'obi-pellet',
        name: { de: 'Pelletheizung Starter', en: 'Pellet Heating Starter' },
        desc: { de: 'Effizient heizen bei Frost & Schnee.', en: 'Efficient heat for frost/snow days.' },
        price: '499,00 €',
        tags: ['snow', 'cold'],
        image: 'https://images.unsplash.com/photo-1470246973918-29a93221c455?w=800&auto=format&fit=crop'
      }
    ]
  },
  kik: {
    theme: {
      primary: '#cc0000',
      gradient: 'linear-gradient(135deg, #fff0f0 0%, #ffd9d9 100%)',
    },
    products: [
      {
        id: 'kik-parka',
        name: { de: 'Wasserfester Parka', en: 'Waterproof Parka' },
        desc: { de: 'Gefüttert, Kapuze, ideal bei Regen und Wind.', en: 'Lined parka with hood for rain and wind.' },
        price: '39,99 €',
        tags: ['rain', 'cold'],
        image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&auto=format&fit=crop'
      },
      {
        id: 'kik-tee',
        name: { de: 'Basic T-Shirts 3er Pack', en: 'Basic T-Shirts 3-pack' },
        desc: { de: 'Baumwolle, atmungsaktiv, sonnige Tage.', en: 'Cotton, breathable, sunny days.' },
        price: '9,99 €',
        tags: ['sunny', 'warm'],
        image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop'
      },
      {
        id: 'kik-winterset',
        name: { de: 'Winter-Accessoires Set', en: 'Winter Accessories Set' },
        desc: { de: 'Mütze, Schal, Handschuhe – warm & weich.', en: 'Hat, scarf, gloves – warm and soft.' },
        price: '14,99 €',
        tags: ['snow', 'cold'],
        image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=800&auto=format&fit=crop'
      }
    ]
  },
  circlek: {
    theme: {
      primary: '#e30613',
      gradient: 'linear-gradient(135deg, #fff0f0 0%, #ffe5e5 100%)',
    },
    products: [
      {
        id: 'ck-wash-premium',
        name: { de: 'Premium Autowäsche', en: 'Premium Car Wash' },
        desc: { de: 'Heißwachs & Felgenreinigung – ideal nach Regen.', en: 'Hot wax + wheel clean — great after rain.' },
        price: '12,90 €',
        tags: ['rain', 'cloudy'],
        image: 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&auto=format&fit=crop'
      },
      {
        id: 'ck-wiper',
        name: { de: 'Scheibenwischer-Set', en: 'Wiper Blade Set' },
        desc: { de: 'Klare Sicht bei Regen & Schnee.', en: 'Clear vision for rain & snow.' },
        price: '24,90 €',
        tags: ['rain', 'snow'],
        image: 'https://images.unsplash.com/photo-1580041065738-e72023775cdc?w=800&auto=format&fit=crop'
      },
      {
        id: 'ck-rain-repellent',
        name: { de: 'Regenabweiser', en: 'Rain Repellent' },
        desc: { de: '6 Monate Schutz gegen Spritzwasser.', en: '6-month water beading protection.' },
        price: '9,90 €',
        tags: ['rain', 'cloudy'],
        image: 'https://images.unsplash.com/photo-1503377985300-7c1c39baabef?w=800&auto=format&fit=crop'
      },
      {
        id: 'ck-winter-kit',
        name: { de: 'Winter-Kit', en: 'Winter Kit' },
        desc: { de: 'Enteiser, Frostschutz, Eiskratzer für Frosttage.', en: 'De-icer, antifreeze, scraper for frosty days.' },
        price: '15,90 €',
        tags: ['snow', 'cold'],
        image: 'https://images.unsplash.com/photo-1512069283445-442360f1389c?w=800&auto=format&fit=crop'
      },
      {
        id: 'ck-coffee',
        name: { de: 'Heißgetränke To-Go', en: 'Hot Drinks To-Go' },
        desc: { de: 'Perfekt bei kaltem, nassem Wetter.', en: 'Perfect for cold, wet weather.' },
        price: '2,90 €',
        tags: ['rain', 'cold', 'snow'],
        image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop'
      }
    ]
  }
};

function pickProducts(brand, weatherSummary = '') {
  const data = PRODUCT_DATA[brand];
  if (!data) return { theme: {}, products: [] };
  const summary = (weatherSummary || '').toLowerCase();
  const tag = summary.includes('snow') ? 'snow'
    : summary.includes('rain') ? 'rain'
    : summary.includes('cold') || summary.includes('frost') ? 'cold'
    : summary.includes('sun') || summary.includes('clear') ? 'sunny'
    : summary.includes('warm') || summary.includes('hot') ? 'warm'
    : summary.includes('cloud') || summary.includes('overcast') ? 'cloudy'
    : 'cloudy';
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
      #brand-reco-overlay { position: fixed; inset:0; background: rgba(0,0,0,0.6); display:none; z-index: 9999; }
      #brand-reco-panel { position: absolute; inset: 4% 6%; background: #fff; border-radius: 18px; overflow: auto; box-shadow: 0 30px 80px rgba(0,0,0,0.22); padding: 28px; }
      #brand-reco-close { position:absolute; top:16px; right:16px; border:none; background:rgba(0,0,0,0.08); border-radius: 50%; width:40px; height:40px; cursor:pointer; font-size:20px; }
      .reco-hero { border-radius: 14px; padding: 18px; display:flex; gap:16px; align-items:center; background: var(--hero-bg, #fff4e8); }
      .reco-hero .pill { display:inline-flex; align-items:center; gap:6px; padding:8px 12px; border-radius:999px; background: rgba(0,0,0,0.05); font-weight:700; }
      #brand-reco-grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(240px,1fr)); gap:18px; margin-top:20px; }
      .reco-card { border:1px solid #eee; border-radius:14px; padding:14px; background:#fff; box-shadow: 0 10px 24px rgba(0,0,0,0.08); transition: transform .2s ease, box-shadow .2s ease; }
      .reco-card:hover { transform: translateY(-2px); box-shadow:0 16px 28px rgba(0,0,0,0.12); }
      .reco-card img { width:100%; border-radius:12px; object-fit:cover; height:170px; }
      .reco-card h3 { margin:10px 0 4px; font-size:1.05rem; }
      .reco-card p { margin:0 0 10px; color:#444; font-size:0.92rem; }
      .reco-price { font-weight:800; margin-bottom:10px; font-size:1rem; }
      .reco-tags { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:10px; }
      .reco-tag { padding:6px 10px; border-radius:12px; background:rgba(0,0,0,0.05); font-size:0.8rem; font-weight:700; }
      .reco-cta { display:flex; gap:10px; }
      .reco-cta button { flex:1; padding:11px 12px; border-radius:12px; border:1px solid #ddd; cursor:pointer; font-weight:800; }
      .primary { color:#fff; border:none; }
    </style>
    <div id="brand-reco-panel">
      <button id="brand-reco-close">×</button>
      <div class="reco-hero">
        <div>
          <div class="pill" id="brand-reco-pill">Weather fit</div>
          <h2 id="brand-reco-title">Empfehlungen</h2>
          <p id="brand-reco-sub">Wetterbasierte Vorschläge</p>
        </div>
      </div>
      <div id="brand-reco-grid"></div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#brand-reco-close').addEventListener('click', hideOverlay);
  return overlay;
}

function hideOverlay() {
  const overlay = document.getElementById('brand-reco-overlay');
  if (overlay) overlay.style.display = 'none';
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
  grid.innerHTML = products.map(p => `
    <div class="reco-card">
      <img src="${p.image}" alt="${p.name[lang] || p.name.en || ''}" />
      <h3>${p.name[lang] || p.name.en || ''}</h3>
      <p>${p.desc?.[lang] || p.desc?.en || ''}</p>
      <div class="reco-price">${p.price}</div>
      <div class="reco-tags">
        ${(p.tags || []).map(t => `<span class="reco-tag">${t}</span>`).join('')}
      </div>
      <div class="reco-cta">
        <button>${lang === 'de' ? 'Merken' : 'Save'}</button>
        <button class="primary" style="background:${theme.primary || '#d33'}">${lang === 'de' ? 'Zum Angebot' : 'View'}</button>
      </div>
    </div>`).join('');
  const panel = overlay.querySelector('#brand-reco-panel');
  panel.style.background = '#fff';
  panel.style.borderColor = theme.primary || '#e07a15';
  document.getElementById('brand-reco-styles').innerHTML = document.getElementById('brand-reco-styles').innerHTML.replace(/var\(--primary\)/g, theme.primary || '#d33');
  document.body.style.background = theme.gradient || document.body.style.background;
  const hero = overlay.querySelector('.reco-hero');
  if (hero) hero.style.setProperty('--hero-bg', theme.gradient || '#fff4e8');
  overlay.style.display = 'block';
}

window.showBrandRecommendations = showBrandRecommendations;
window.hideBrandRecommendations = hideOverlay;

export default showBrandRecommendations;
