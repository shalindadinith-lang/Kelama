// ================= DARK MODE =================
function toggleDarkMode() {
  document.body.classList.toggle("dark");
  localStorage.setItem(
    "darkMode",
    document.body.classList.contains("dark") ? "enabled" : "disabled"
  );
}

if (localStorage.getItem("darkMode") === "enabled") {
  document.body.classList.add("dark");
}

// ================= NEWS =================
// ================= NEWS =================
let newsItems = [];

function loadNews() {
  const container = document.getElementById("news-container");
  if (!container) return;

  fetch("https://api.rss2json.com/v1/api.json?rss_url=https://www.adaderana.lk/rss.php")
    .then(res => res.json())
    .then(data => {
      if (!data.items) throw "No news";
      newsItems = data.items.slice(0, 20); // first 20 news
      renderNews();
    })
    .catch(() => {
      container.innerHTML = "<p style='color:red;'>පුවත් ලබාගත නොහැක.</p>";
    });
}

function renderNews(items = newsItems) {
  const container = document.getElementById("news-container");
  if (!container) return;

  container.innerHTML = "";
  items.forEach(item => {
    container.innerHTML += `
      <div class="news-item">
        <h3><a href="${item.link}" target="_blank">${item.title}</a></h3>
        <small>${new Date(item.pubDate).toLocaleString("si-LK")}</small>
        <p>${item.description.substring(0,150)}...</p>
      </div>
    `;
  });
}

// ================= SEARCH FILTER =================
function filterNews() {
  const query = document.getElementById("news-search").value.toLowerCase();
  const filtered = newsItems.filter(item =>
    item.title.toLowerCase().includes(query) ||
    item.description.toLowerCase().includes(query)
  );
  renderNews(filtered);
}

// Load news when DOM ready
document.addEventListener("DOMContentLoaded", () => {
  loadNews();
});


// ================= FUEL =================
function loadFuel() {
  const ctx = document.getElementById('fuelChart');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: [
        'Petrol 92',
        'Petrol 95',
        'Auto Diesel',
        'Super Diesel',
        'Kerosene'
      ],
      datasets: [{
        label: 'මිල (LKR)',
        data: [183, 245, 116, 155, 95], // update when price changes
        backgroundColor: ['#006600','#00aa00','#00cc00','#009900','#007700'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

// ================= WEATHER =================
function loadWeather() {
  const box = document.getElementById("weather-info");
  const mapDiv = document.getElementById("map");
  if (!box || !mapDiv) return;

  const apiKey = "a711d55b1e89708be65819eb07c0eeba";
  box.innerHTML = "📍 Location අනුව weather load වෙමින්...";

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      // Init Map
      const map = L.map('map').setView([lat, lon], 10);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      const marker = L.marker([lat, lon]).addTo(map)
        .bindPopup('ඔබේ location').openPopup();

      // Fetch Weather
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=si`)
        .then(res => res.json())
        .then(data => {
          const weather = data.weather[0].main.toLowerCase(); // rain, clouds, clear...
          const temp = Math.round(data.main.temp);
          const desc = data.weather[0].description;

          box.innerHTML = `
            <h3>${data.name}</h3>
            <p>🌡️ ${temp}°C</p>
            <p>${desc}</p>
          `;

          // Dynamic background color based on weather
          let bgColor = '#f4f6f8'; // default
          if (weather.includes('rain')) bgColor = '#6e8cd7';
          else if (weather.includes('cloud')) bgColor = '#aab4c2';
          else if (weather.includes('clear')) bgColor = '#ffd86f';
          else if (weather.includes('snow')) bgColor = '#ffffff';

          document.body.style.background = bgColor;

          // Add weather marker icon
          const iconUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
          const weatherIcon = L.icon({
            iconUrl,
            iconSize: [60, 60],
            iconAnchor: [30, 60]
          });
          L.marker([lat, lon], {icon: weatherIcon}).addTo(map)
            .bindPopup(`${temp}°C, ${desc}`);
        });

    }, () => {
      box.innerHTML = "<p>Location ලබාගත නොහැක.</p>";
    });
  } else {
    box.innerHTML = "<p>Geolocation not supported.</p>";
  }
}


// ================= CURRENCY =================
let currencyRates = {};

function loadCurrency() {
  const container = document.getElementById("currency-container");
  const fromSelect = document.getElementById("fromCurrency");
  const toSelect = document.getElementById("toCurrency");

  if (!container) return;

  const apiKey = "d6853e194d8c83d637d92f65";

  fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/LKR`)
    .then(res => res.json())
    .then(data => {
      if (data.result !== "success") throw "API Error";

      currencyRates = data.conversion_rates;

      container.innerHTML = `
        <p>1 LKR =</p>
        <p>USD: ${currencyRates.USD.toFixed(4)}</p>
        <p>EUR: ${currencyRates.EUR.toFixed(4)}</p>
        <p>GBP: ${currencyRates.GBP.toFixed(4)}</p>
        <p>INR: ${currencyRates.INR.toFixed(2)}</p>
        <small>${new Date(data.time_last_update_utc).toLocaleString("si-LK")}</small>
      `;

      for (let code in currencyRates) {
        fromSelect.innerHTML += `<option value="${code}">${code}</option>`;
        toSelect.innerHTML += `<option value="${code}">${code}</option>`;
      }

      fromSelect.value = "LKR";
      toSelect.value = "USD";
    })
    .catch(() => {
      container.innerHTML = "<p>Currency rates load වුණේ නැහැ.</p>";
    });
}

function convertCurrency() {
  const amount = parseFloat(document.getElementById("amount").value);
  const from = document.getElementById("fromCurrency").value;
  const to = document.getElementById("toCurrency").value;

  if (!currencyRates[from] || !currencyRates[to] || isNaN(amount)) return;

  const lkrValue = amount / currencyRates[from];
  const result = lkrValue * currencyRates[to];

  document.getElementById("convertResult").innerText =
    `${amount} ${from} = ${result.toFixed(2)} ${to}`;
}

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
  loadNews();
  loadFuel();
  loadWeather();
  loadCurrency();
});

//tv
const channels = [
  {
    name: "Ada Derana LIVE",
    url: "https://www.youtube.com/embed/5qap5aO4i9A?autoplay=1&mute=1"
  },
  {
    name: "Sirasa TV LIVE",
    url: "https://www.youtube.com/embed/2Vv-BfVoq4g?autoplay=1&mute=1"
  },
  {
    name: "Hiru TV LIVE",
    url: "https://www.youtube.com/embed/abc123XYZ?autoplay=1&mute=1"
  },

   {
    name: "Srilanka Cricket",
    url: "https://www.youtube.com/watch?v=LhDR57UXZ1w"
  }

  
];

function loadChannels() {
  const select = document.getElementById("tvSelect");
  const frame = document.getElementById("tvFrame");

  channels.forEach((ch, index) => {
    const option = document.createElement("option");
    option.value = ch.url;
    option.textContent = "📺 " + ch.name;
    select.appendChild(option);

    if (index === 0) frame.src = ch.url;
  });
}




//add kranna oni udata

function changeChannel() {
  const select = document.getElementById("tvSelect");
  const iframe = document.getElementById("tvFrame");
  iframe.src = select.value;
}

// Dark mode toggle (already in your app.js)
function toggleDarkMode() {
  document.body.classList.toggle("dark");
  localStorage.setItem(
    "darkMode",
    document.body.classList.contains("dark") ? "enabled" : "disabled"
  );
}

if (localStorage.getItem("darkMode") === "enabled") {
  document.body.classList.add("dark");
}











