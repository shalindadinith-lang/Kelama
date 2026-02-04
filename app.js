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
    const container = document.getElementById('weather-info');
    if (!container) {
        console.warn("weather-info element හොයාගන්න බැරි වුණා");
        return;
    }

    const apiKey = "a711d55b1e89708be65819eb07c0eeba";

    // Loading message (කලින් තිබුණු එක තියාගත්තා)
    container.innerHTML = "📍 ඔබේ ස්ථානය ලබාගෙන කාලගුණය ලෝඩ් වෙමින්...";

    // Geolocation support තියෙනවද කියලා බලමු
    if (!navigator.geolocation) {
        container.innerHTML = '<p style="color:#e74c3c;">ඔබේ browser එක location support කරන්නේ නැහැ.</p>';
        return;
    }

    // Geolocation ඉල්ලමු
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;

            // API call කරමු
            fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=si`)
                .then((response) => {
                    // Response OK ද කියලා බලමු
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then((data) => {
                    // API එකෙන් error එකක් ආවද කියලා බලමු
                    if (data.cod && data.cod !== 200) {
                        throw new Error(data.message || "API එකෙන් දත්ත ආවේ නැහැ");
                    }

                    // සාර්ථක නම් UI update කරමු (කලින් තිබුණු format එක + කුඩා improvements)
                    container.innerHTML = `
                        <h3>${data.name || 'ඔබේ ප්‍රදේශය'}</h3>
                        <p>🌡️ ${Math.round(data.main.temp)} °C</p>
                        <p>${data.weather[0]?.description || 'විස්තරයක් නැහැ'}</p>
                        <p>💧 ආර්ද්‍රතාව: ${data.main.humidity}%</p>
                        <p>💨 සුළඟ: ${data.wind?.speed || '--'} m/s</p>
                        <small>අවසන් යාවත්කාලීනය: ${new Date().toLocaleTimeString('si-LK')}</small>
                    `;
                })
                .catch((err) => {
                    console.error("Weather fetch error:", err);

                    let errorMessage = "කාලගුණ තොරතුරු ලබාගත නොහැක.";
                    
                    // වෙනස් වරදවල් වලට වෙනස් messages
                    if (err.message.includes("401")) {
                        errorMessage += " (API key වැරදියි)";
                    } else if (err.message.includes("429")) {
                        errorMessage += " (API calls limit ඉක්මවලා - පසුව උත්සාහ කරන්න)";
                    } else if (err.message.includes("404")) {
                        errorMessage += " (ස්ථානය හොයාගන්න බැරි වුණා)";
                    } else {
                        errorMessage += ` (${err.message})`;
                    }

                    container.innerHTML = `<p style="color:#e74c3c;">${errorMessage}</p>`;
                });
        },

        // Geolocation error handling (කලින් තිබුණු එක improve කළා)
        (err) => {
            console.error("Geolocation error:", err);

            let msg = "ස්ථානය ලබාගැනීමට අවසර නැත.";

            switch (err.code) {
                case 1:
                    msg = "Location access ඉඩ දුන්නේ නැහැ. Browser settings එකෙන් Allow කරන්න.";
                    break;
                case 2:
                    msg = "ස්ථානය ලබාගන්න බැරි වුණා (position unavailable).";
                    break;
                case 3:
                    msg = "ස්ථානය ලබාගන්න ගියාම timeout උනා.";
                    break;
                default:
                    msg += ` (${err.message})`;
            }

            container.innerHTML = `<p style="color:#e74c3c;">${msg}</p>`;
        },

        // Options - ටිකක් accurate කරන්න
        {
            enableHighAccuracy: true,
            timeout: 12000,       // 12 seconds max wait කරනවා
            maximumAge: 0         // cache එක use කරන්න එපා
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





