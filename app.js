// Dark mode toggle & save
function toggleDarkMode() {
  document.body.classList.toggle('dark');
  localStorage.setItem('darkMode', document.body.classList.contains('dark') ? 'enabled' : 'disabled');
}
if (localStorage.getItem('darkMode') === 'enabled') {
  document.body.classList.add('dark');
}

// Load News (Ada Derana RSS + Search Filter)
let newsItems = [];
function loadNews() {
  const container = document.getElementById('news-container');
  if (!container) return;
  fetch("https://api.rss2json.com/v1/api.json?rss_url=https://www.adaderana.lk/rss.php")
    .then(res => res.json())
    .then(data => {
      container.innerHTML = '';
      newsItems = data.items.slice(0, 10);
      renderNews();
    })
    .catch(() => container.innerHTML = '<p style="color:red;">පුවත් ලබාගැනීමේ දෝෂයක් තිබෙනවා. පසුව උත්සාහ කරන්න.</p>');
}
function renderNews() {
  const container = document.getElementById('news-container');
  container.innerHTML = '';
  newsItems.forEach(item => {
    const div = document.createElement('div');
    div.className = 'news-item';
    div.innerHTML = `
      <h3><a href="${item.link}" target="_blank" style="color: inherit;">${item.title}</a></h3>
      <small>${new Date(item.pubDate).toLocaleString('si-LK')}</small>
      <p>${item.description.substring(0, 150)}...</p>
    `;
    container.appendChild(div);
  });
}
function filterNews() {
  const search = document.getElementById('news-search')?.value.toLowerCase() || '';
  const filtered = newsItems.filter(item => 
    item.title.toLowerCase().includes(search) || 
    item.description.toLowerCase().includes(search)
  );
  // Temporary render filtered (original list එක change නොකර)
  const container = document.getElementById('news-container');
  container.innerHTML = '';
  filtered.forEach(item => {
    const div = document.createElement('div');
    div.className = 'news-item';
    div.innerHTML = `
      <h3><a href="${item.link}" target="_blank" style="color: inherit;">${item.title}</a></h3>
      <small>${new Date(item.pubDate).toLocaleString('si-LK')}</small>
      <p>${item.description.substring(0, 150)}...</p>
    `;
    container.appendChild(div);
  });
}

// Load Fuel Prices (Updated for Feb 2026 - CPC Rs.2 reduce for 92 & Diesel)
function loadFuel() {
  const container = document.getElementById('fuel-container');
  if (!container) return;
  const prices = {
    petrol92: 292,
    petrol95: 340,
    diesel: 277,
    superDiesel: 323,
    updated: '2026-02-01 (CPC official - Rs.2 reduce for 92 Octane & Diesel)'
  };
  // Historical example data (ඔයාට real data add කරගන්න)
  const historical = {
    dates: ['2026-01-01', '2026-02-01'],
    petrol92: [294, 292],  // previous ≈294 → now 292
    diesel: [279, 277]
  };
  container.innerHTML = `
    <div class="fuel-item"><strong>Petrol 92 Octane:</strong> Rs. ${prices.petrol92} / ලීටරය</div>
    <div class="fuel-item"><strong>Petrol 95 Octane:</strong> Rs. ${prices.petrol95} / ලීටරය</div>
    <div class="fuel-item"><strong>Auto Diesel:</strong> Rs. ${prices.diesel} / ලීටරය</div>
    <div class="fuel-item"><strong>Super Diesel:</strong> Rs. ${prices.superDiesel} / ලීටරය</div>
    <small style="display:block; text-align:center; margin-top:10px;">අවසන් යාවත්කාලීන: ${prices.updated} • මිල වෙනස් වුණොත් update කරන්න</small>
  `;
  // Chart render (Chart.js CDN link තියෙනවනම් <script src="https://cdn.jsdelivr.net/npm/chart.js"></script> add කරන්න head එකට)
  const chartCanvas = document.getElementById('fuel-chart');
  if (chartCanvas) {
    const ctx = chartCanvas.getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: historical.dates,
        datasets: [
          { label: 'Petrol 92', data: historical.petrol92, borderColor: 'blue' },
          { label: 'Diesel', data: historical.diesel, borderColor: 'green' }
        ]
      },
      options: { responsive: true }
    });
  }
}

// Load Weather (Current + Forecast + Auto Location) - ඔයාගේ OpenWeather key එක දැනටමත් තියෙනවා
function loadWeather(city = 'Colombo') {
  const apiKey = 'a711d55b1e89708be65819eb07c0eeba'; // ඔයාගේ key
  const container = document.getElementById('weather-info');
  const forecastContainer = document.getElementById('forecast-container');
  if (!container) return;
  if (!apiKey) {
    container.innerHTML = '<p>OpenWeather API key දාන්න.</p>';
    return;
  }

  const showError = () => container.innerHTML = '<p>කාලගුණ තොරතුරු ලබාගත නොහැක. Internet හෝ API key check කරන්න.</p>';

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => fetchWeather(pos.coords.latitude, pos.coords.longitude),
      () => fetchWeatherByCity(city)
    );
  } else {
    fetchWeatherByCity(city);
  }

  function fetchWeatherByCity(cityName) {
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${cityName},LK&appid=${apiKey}&units=metric&lang=si`)
      .then(res => res.json())
      .then(data => {
        if (data.cod === 200) renderCurrentWeather(data);
        else showError();
      })
      .catch(showError);
    fetchForecast(`q=${cityName},LK`);
  }

  function fetchWeather(lat, lon) {
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=si`)
      .then(res => res.json())
      .then(data => {
        if (data.cod === 200) renderCurrentWeather(data);
        else showError();
      })
      .catch(showError);
    fetchForecast(`lat=${lat}&lon=${lon}`);
  }

  function renderCurrentWeather(data) {
    container.innerHTML = `
      <h2>${data.name} කාලගුණය දැන්</h2>
      <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="weather icon" style="width:80px;">
      <p>උෂ්ණත්වය: ${Math.round(data.main.temp)}°C</p>
      <p>තත්ත්වය: ${data.weather[0].description}</p>
      <p>අධික තෙතමනය: ${data.main.humidity}%</p>
      <p>සුළඟ වේගය: ${data.wind.speed} m/s</p>
    `;
  }

  function fetchForecast(queryPart) {
    if (!forecastContainer) return;
    fetch(`https://api.openweathermap.org/data/2.5/forecast?${queryPart}&appid=${apiKey}&units=metric&lang=si&cnt=40`)
      .then(res => res.json())
      .then(data => {
        forecastContainer.innerHTML = '<h3>5-Day Forecast (every 3 hours)</h3>';
        const daily = data.list.filter((item, idx) => idx % 8 === 0).slice(0, 5);
        daily.forEach(item => {
          forecastContainer.innerHTML += `
            <p>${new Date(item.dt * 1000).toLocaleDateString('si-LK')}: ${Math.round(item.main.temp)}°C - ${item.weather[0].description}</p>
          `;
        });
      })
      .catch(() => forecastContainer.innerHTML = '<p>Forecast ලබාගත නොහැක.</p>');
  }
}

// Load Currency Rates - NOW FIXED with your real key!
function loadCurrency() {
  const container = document.getElementById('currency-container');
  if (!container) return;
  
  const apiKey = 'd6853e194d8c83d637d92f65';  // ඔයාගේ real key මෙතන දැම්මා (placeholder check එක ඉවත් කළා)
  
  fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/LKR`)
    .then(res => res.json())
    .then(data => {
      if (data.result === 'success') {
        const rates = data.conversion_rates;
        container.innerHTML = `
          <h3>1 LKR = (Latest Rates)</h3>
          <p>USD: ${rates.USD?.toFixed(4) || 'N/A'}</p>
          <p>EUR: ${rates.EUR?.toFixed(4) || 'N/A'}</p>
          <p>GBP: ${rates.GBP?.toFixed(4) || 'N/A'}</p>
          <p>INR: ${rates.INR?.toFixed(2) || 'N/A'}</p>
          <p>AED: ${rates.AED?.toFixed(4) || 'N/A'}</p>
          <small>Updated: ${new Date(data.time_last_update_utc).toLocaleString('si-LK')}</small>
        `;
      } else {
        container.innerHTML = '<p>Currency rates ලබාගත නොහැක. API key හෝ internet check කරන්න. (Error: ' + (data['error-type'] || 'Unknown') + ')</p>';
      }
    })
    .catch(err => {
      console.error(err);
      container.innerHTML = '<p>දෝෂයක්: Internet හෝ API endpoint check කරන්න.</p>';
    });
}

// Power Cuts Placeholder
function loadPowerCuts() {
  const district = document.getElementById('district-select')?.value;
  const container = document.getElementById('powercut-container');
  if (!container || !district) return;
  container.innerHTML = `
    <p>${district} සඳහා අද schedule: දැනට scheduled cuts නැහැ (CEB map බලන්න latest එකට).</p>
    <p>Official: <a href="https://cebcare.ceb.lk/Incognito/outagemap" target="_blank">CEB Outage Map</a></p>
  `;
}

// DOM Loaded - All loaders call
document.addEventListener('DOMContentLoaded', () => {
  loadNews();          // news section/page
  loadFuel();          // fuel section
  loadWeather();       // weather section (auto location or Colombo)
  loadCurrency();      // currency section - මේක දැන් work වෙන්න ඕනේ!
  if (document.getElementById('district-select')) loadPowerCuts();

  // Optional: YouTube iframes error handling
  const iframes = document.querySelectorAll('iframe[src*="youtube.com"]');
  iframes.forEach(iframe => {
    iframe.addEventListener('error', () => {
      const parent = iframe.parentElement;
      if (parent) {
        parent.innerHTML += '<p style="color:red;">Live stream unavailable දැන්. Channel එකේ official YouTube බලන්න.</p>';
      }
    });
  });
});
