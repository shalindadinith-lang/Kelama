// =============================================
// DARK MODE
// =============================================
function toggleDarkMode() {
  document.body.classList.toggle('dark');
  localStorage.setItem('darkMode', document.body.classList.contains('dark') ? 'dark' : 'light');
}

if (localStorage.getItem('darkMode') === 'dark' ||
    (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.body.classList.add('dark');
}

// =============================================
// CURRENCY RATES & CONVERTER
// =============================================
let exchangeRates = null;

function loadCurrencyRates() {
  const container = document.getElementById('currency-rates');
  if (!container) return;

  const apiKey = "d6853e194d8c83d637d92f65"; // ඔබේ API key

  fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/LKR`)
    .then(res => res.json())
    .then(data => {
      if (data.result !== "success") throw new Error("API error");
      
      exchangeRates = data.conversion_rates;
      const time = new Date(data.time_last_update_utc).toLocaleString('si-LK');

      container.innerHTML = `
        <p><strong>1 LKR =</strong></p>
        <p>USD: ${exchangeRates.USD?.toFixed(4) || '—'}</p>
        <p>EUR: ${exchangeRates.EUR?.toFixed(4) || '—'}</p>
        <p>GBP: ${exchangeRates.GBP?.toFixed(4) || '—'}</p>
        <p>INR: ${exchangeRates.INR?.toFixed(2) || '—'}</p>
        <small>අන්තිම යාවත්කාලීනය: ${time}</small>
      `;
    })
    .catch(err => {
      console.error(err);
      container.innerHTML = '<p style="color:#e74c3c;">මුදල් අනුපාත ලබාගත නොහැකි විය.</p>';
    });
}

function convertNow() {
  if (!exchangeRates) {
    document.getElementById('conversion-result').innerHTML = 
      '<span style="color:#e74c3c;">අනුපාත තවමත් ලෝඩ් වී නැත.</span>';
    return;
  }

  const amount = parseFloat(document.getElementById('amount').value);
  const currency = document.getElementById('to-currency').value;
  const resultEl = document.getElementById('conversion-result');

  if (!amount || amount <= 0) {
    resultEl.innerHTML = '<span style="color:#e74c3c;">කරුණාකර හරි ලෙස මුදලක් ඇතුලත් කරන්න.</span>';
    return;
  }

  const rate = exchangeRates[currency];
  if (!rate) {
    resultEl.textContent = 'මෙම මුදල සඳහා අනුපාතයක් නැත.';
    return;
  }

  const converted = amount * rate;
  resultEl.innerHTML = `${amount.toLocaleString('si-LK')} LKR = <strong>${converted.toFixed(4)} ${currency}</strong>`;
}

// =============================================
// NEWS (Ada Derana RSS)
// =============================================
let allNews = [];

function loadNews() {
  const container = document.getElementById('news-container');
  if (!container) return;

  fetch('https://api.rss2json.com/v1/api.json?rss_url=https://www.adaderana.lk/rss.php')
    .then(res => res.json())
    .then(data => {
      if (!data.items) throw new Error('No items');
      allNews = data.items.slice(0, 12);
      renderNews(allNews);
    })
    .catch(() => {
      container.innerHTML = '<p style="color:#e74c3c;">පුවත් ලබාගත නොහැකි විය.</p>';
    });
}

function renderNews(items) {
  const container = document.getElementById('news-container');
  if (!container) return;

  container.innerHTML = '';
  items.forEach(item => {
    container.innerHTML += `
      <div class="news-item">
        <h3><a href="${item.link}" target="_blank">${item.title}</a></h3>
        <small>${new Date(item.pubDate).toLocaleString('si-LK')}</small>
        <p>${item.description.substring(0,160)}${item.description.length > 160 ? '...' : ''}</p>
      </div>
    `;
  });
}

function filterNews() {
  const search = document.getElementById('news-search')?.value.toLowerCase() || '';
  if (!allNews.length) return;

  const filtered = allNews.filter(item =>
    item.title.toLowerCase().includes(search) ||
    item.description.toLowerCase().includes(search)
  );

  renderNews(filtered);
}

// =============================================
// WEATHER
// =============================================
// ---------------------
// WEATHER – advanced
// ---------------------
function loadWeather() {
  const cityName = document.getElementById('city-name');
  if (!cityName) return;

  // Test message දාලා බලමු කේතය run වෙනවද කියලා
  cityName.textContent = "TEST: කේතය ගියා";

  if (!navigator.geolocation) {
    cityName.textContent = "Location support නැහැ";
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => {
      cityName.textContent = "Location ගත්තා! API call කරන්න යනවා...";

      // API call skip කරලා dummy data දාමු
      setTimeout(() => {
        cityName.textContent = "කොළඹ";
        document.getElementById('temperature').textContent = "29";
        document.getElementById('description').textContent = "අඳුරු වලාකුළු";
        document.getElementById('humidity').textContent = "75";
        document.getElementById('wind').textContent = "3.2";
      }, 1500);
    },
    err => {
      cityName.textContent = "Location ගන්න බැහැ: " + err.message;
      console.log("Geolocation error:", err);
    }
  );
}
// ---------------------
// CURRENCY – nicer result
// ---------------------
function convertNow() {
  // ... (previous logic remains)

  // After successful conversion:
  const resultEl = document.getElementById('conversion-result');
  resultEl.innerHTML = `<span class="result-highlight">${amount.toLocaleString('si-LK')} LKR = ${converted.toFixed(4)} ${currency}</span>`;

  const shareDiv = document.getElementById('currency-share-buttons');
  shareDiv.innerHTML = `
    <button class="share-btn wa" onclick='shareToWhatsApp("${amount.toLocaleString('si-LK')} LKR = ${converted.toFixed(4)} ${currency} - Sri Lanka Info Hub")'>WhatsApp</button>
    <button class="share-btn fb" onclick='shareToFacebook()'>Facebook</button>
  `;
  shareDiv.style.display = 'flex';
}

// =============================================
// INIT
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  loadCurrencyRates();

  if (document.getElementById('news-container')) {
    loadNews();
  }

  if (document.getElementById('weather-info')) {
    loadWeather();
  }
});



