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
let newsItems = [];

function loadNews() {
  const container = document.getElementById("news-container");
  if (!container) return;

  fetch("https://api.rss2json.com/v1/api.json?rss_url=https://www.adaderana.lk/rss.php")
    .then(res => res.json())
    .then(data => {
      if (!data.items) throw "No news";
      newsItems = data.items.slice(0, 10);
      renderNews();
    })
    .catch(() => {
      container.innerHTML = "<p style='color:red;'>පුවත් ලබාගත නොහැක.</p>";
    });
}

function renderNews() {
  const container = document.getElementById("news-container");
  if (!container) return;

  container.innerHTML = "";
  newsItems.forEach(item => {
    container.innerHTML += `
      <div class="news-item">
        <h3><a href="${item.link}" target="_blank">${item.title}</a></h3>
        <small>${new Date(item.pubDate).toLocaleString("si-LK")}</small>
        <p>${item.description.substring(0,150)}...</p>
      </div>`;
  });
}

// ================= FUEL =================
function loadFuel() {
  const container = document.getElementById("fuel-container");
  if (!container) return;

  const prices = {
    petrol92: 292,
    petrol95: 340,
    diesel: 277,
    superDiesel: 323
  };

  container.innerHTML = `
    <p>Petrol 92: Rs.${prices.petrol92}</p>
    <p>Petrol 95: Rs.${prices.petrol95}</p>
    <p>Diesel: Rs.${prices.diesel}</p>
    <p>Super Diesel: Rs.${prices.superDiesel}</p>
  `;
}

// ================= WEATHER =================
function loadWeather() {
  const box = document.getElementById("weather-info");
  if (!box) return;

  const apiKey = "a711d55b1e89708be65819eb07c0eeba";
  box.innerHTML = "📍 ඔබේ location අනුව weather load වෙමින්...";

  navigator.geolocation.getCurrentPosition(pos => {
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${apiKey}&units=metric&lang=si`)
      .then(res => res.json())
      .then(data => {
        box.innerHTML = `
          <h3>${data.name}</h3>
          <p>🌡️ ${Math.round(data.main.temp)}°C</p>
          <p>${data.weather[0].description}</p>
        `;
      });
  });
}


// ================= CURRENCY =================
function loadCurrency() {
  const container = document.getElementById("currency-container");
  if (!container) return;

  const apiKey = "d6853e194d8c83d637d92f65";

  fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/LKR`)
    .then(res => res.json())
    .then(data => {
      if (data.result !== "success") throw "API Error";

      const r = data.conversion_rates;
      container.innerHTML = `
        <h3>1 LKR =</h3>
        <p>USD: ${r.USD.toFixed(4)}</p>
        <p>EUR: ${r.EUR.toFixed(4)}</p>
        <p>GBP: ${r.GBP.toFixed(4)}</p>
        <p>INR: ${r.INR.toFixed(2)}</p>
        <small>${new Date(data.time_last_update_utc).toLocaleString("si-LK")}</small>
      `;
    })
    .catch(() => {
      container.innerHTML = "<p>Currency rates load වුණේ නැහැ.</p>";
    });
}

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
  loadNews();
  loadFuel();
  loadWeather();
  loadCurrency();
});


