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
  const search = document.getElementById('news-search').value.toLowerCase();
  const filtered = newsItems.filter(item => item.title.toLowerCase().includes(search) || item.description.toLowerCase().includes(search));
  newsItems = filtered; // Temporary filter
  renderNews();
}

// Load Fuel Prices (Manual + Historical Chart)
function loadFuel() {
  const container = document.getElementById('fuel-container');
  if (!container) return;
  const prices = {
    petrol92: 292,
    petrol95: 340,
    diesel: 277,
    superDiesel: 323,
    updated: '2026-02-01 (CPC official)'
  };
  // Historical data (example - add real data)
  const historical = {
    dates: ['2026-01-01', '2026-02-01'],
    petrol92: [280, 292],
    diesel: [270, 277]
  };
  container.innerHTML = `
    <div class="fuel-item"><strong>Petrol 92 Octane:</strong> Rs. ${prices.petrol92} / ලීටරය</div>
    <div class="fuel-item"><strong>Petrol 95 Octane:</strong> Rs. ${prices.petrol95} / ලීටරය</div>
    <div class="fuel-item"><strong>Auto Diesel:</strong> Rs. ${prices.diesel} / ලීටරය</div>
    <div class="fuel-item"><strong>Super Diesel:</strong> Rs. ${prices.superDiesel} / ලීටරය</div>
    <small style="display:block; text-align:center; margin-top:10px;">අවසන් යාවත්කාලීන: ${prices.updated} • මිල වෙනස් වුණොත් update කරන්න</small>
  `;
  // Render Chart
  const ctx = document.getElementById('fuel-chart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: historical.dates,
      datasets: [{ label: 'Petrol 92', data: historical.petrol92 }, { label: 'Diesel', data: historical.diesel }]
    }
  });
}

// Load Weather (Current + Forecast + Auto Location)
function loadWeather(city = 'Colombo') {
  const apiKey = 'a711d55b1e89708be65819eb07c0eeba'; // Replace with your key
  const container = document.getElementById('weather-info');
  const forecastContainer = document.getElementById('forecast-container');
  if (!container || !apiKey || apiKey === 'YOUR_OPENWEATHER_API_KEY') {
    container.innerHTML = '<p>API key දාන්න.</p>';
    return;
  }
  // Get user location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      fetchWeather(pos.coords.latitude, pos.coords.longitude);
    }, () => fetchWeatherByCity(city));
  } else {
    fetchWeatherByCity(city);
  }

  function fetchWeatherByCity(city) {
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city},LK&appid=${apiKey}&units=metric&lang=si`)
      .then(res => res.json())
      .then(data => renderCurrentWeather(data))
      .catch(err => container.innerHTML = '<p>දෝෂයක්.</p>');
    fetchForecast(city);
  }

  function fetchWeather(lat, lon) {
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=si`)
      .then(res => res.json())
      .then(data => renderCurrentWeather(data))
      .catch(err => container.innerHTML = '<p>දෝෂයක්.</p>');
    fetchForecast(`${lat},${lon}`); // For forecast, use coords or city
  }

  function renderCurrentWeather(data) {
    if (data.cod === 200) {
      container.innerHTML = `
        <h2>${data.name} කාලගුණය දැන්</h2>
        <img src="http://openweathermap.org/img/wn/${data.weather[0].icon}.png" alt="weather icon">
        <p>උෂ්ණත්වය: ${Math.round(data.main.temp)}°C</p>
        <p>තත්ත්වය: ${data.weather[0].description}</p>
        <p>අධික තෙතමනය: ${data.main.humidity}%</p>
        <p>සුළඟ වේගය: ${data.wind.speed} m/s</p>
      `;
    }
  }

  function fetchForecast(query) {
    const url = typeof query === 'string' ? `q=${query},LK` : `lat=${query.split(',')[0]}&lon=${query.split(',')[1]}`;
    fetch(`https://api.openweathermap.org/data/2.5/forecast?${url}&appid=${apiKey}&units=metric&lang=si&cnt=5`)
      .then(res => res.json())
      .then(data => {
        forecastContainer.innerHTML = '<h3>5-Day Forecast</h3>';
        data.list.forEach(item => {
          forecastContainer.innerHTML += `
            <p>${new Date(item.dt * 1000).toLocaleDateString('si-LK')}: ${Math.round(item.main.temp)}°C - ${item.weather[0].description}</p>
          `;
        });
      });
  }
}

// Load Currency Rates (New Feature on Index)
function loadCurrency() {
  const container = document.getElementById('currency-container');
  if (!container) return;
  const apiKey = 'YOUR_EXCHANGERATE_API_KEY'; // Get free from exchangerate-api.com
  fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/LKR`)
    .then(res => res.json())
    .then(data => {
      container.innerHTML = `
        <h3>Currency Rates (1 LKR = )</h3>
        <p>USD: ${data.conversion_rates.USD.toFixed(4)}</p>
        <p>EUR: ${data.conversion_rates.EUR.toFixed(4)}</p>
        <p>GBP: ${data.conversion_rates.GBP.toFixed(4)}</p>
      `;
    })
    .catch(() => container.innerHTML = '<p>දෝෂයක්.</p>');
}

// Load Power Cuts (Placeholder - Add real API if available)
function loadPowerCuts() {
  const district = document.getElementById('district-select').value;
  const container = document.getElementById('powercut-container');
  if (!district) return;
  container.innerHTML = `<p>${district} සඳහා schedule: No cuts today (placeholder - real data scrape කරන්න).</p>`;
}

// Load on page ready
document.addEventListener('DOMContentLoaded', () => {
  loadNews();   // news page
  loadFuel();   // fuel page
  loadCurrency(); // index page
  if (document.getElementById('district-select')) loadPowerCuts(); // powercut page
});