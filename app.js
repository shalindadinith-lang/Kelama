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
let currentCategory = "all";
const statusText = document.getElementById("status-text");

// RSS feeds
const rssFeeds = [
  "https://www.adaderana.lk/rss.php",
  "https://www.lankadeepa.lk/rss",
  "https://www.hirunews.lk/rss"
];

// Category keywords
const categories = {
  all: "",
  local: "sri lanka",
  world: "world",
  sports: "sports",
  business: "business"
};

// Translation cache
function getTranslationCache() {
  return JSON.parse(localStorage.getItem("translation_cache") || "{}");
}
function saveTranslationCache(cache) {
  localStorage.setItem("translation_cache", JSON.stringify(cache));
}

// Translate with cache
async function translateToSinhala(text) {
  if (!text) return "";
  const cache = getTranslationCache();
  if (cache[text]) return cache[text];

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|si`;
    const response = await fetch(url);
    const data = await response.json();
    const translated = data?.responseData?.translatedText || text;

    if (translated.toLowerCase().includes("used all available free translations")) {
      statusText.innerText = "⚠️ Translation limit exceeded (English shown)";
      return text;
    }

    cache[text] = translated;
    saveTranslationCache(cache);
    return translated;
  } catch (error) {
    console.log("Translation error:", error);
    return text;
  }
}

// Fetch RSS
async function fetchRSS(rssUrl) {
  try {
    const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`);
    const data = await response.json();
    return data.items || [];
  } catch {
    return [];
  }
}

// Extract highest-res image possible
function extractImage(description) {
  if (!description) return "";
  const imgMatch = description.match(/<img[^>]+src="([^">]+)"/);
  if (!imgMatch) return "";
  let url = imgMatch[1];

  // Try replace thumbnail URL pattern if feed uses "-thumb" or "-small"
  url = url.replace(/(-thumb|-small)/i, "");
  return url;
}

function cleanDescription(description) {
  if (!description) return "";
  return description.replace(/<[^>]*>/g, "").trim();
}

function shareToFacebook(title, link) {
  if (!link) return;
  const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}&quote=${encodeURIComponent(title)}`;
  window.open(url, "_blank");
}

// Filter by category
function filterByCategory(items, category) {
  const key = categories[category] || "";
  if (!key) return items;

  return items.filter(item => {
    const title = item.title || "";
    const desc = item.description || "";
    return (title + " " + desc).toLowerCase().includes(key);
  });
}

// Render news
async function renderNews(items) {
  const container = document.getElementById("news-container");
  if (!container) return;

  container.innerHTML = "";
  if (!items || items.length === 0) {
    container.innerHTML = "<p>මෙම කාණ්ඩය සඳහා පුවත් නොමැත.</p>";
    return;
  }

  items = items.slice(0, 25);

  for (let item of items) {
    const imgSrc = extractImage(item.description);
    const cleanDesc = cleanDescription(item.description);
    const titleSI = await translateToSinhala(item.title || "");

    container.innerHTML += `
      <div class="news-card">
        ${imgSrc ? `<img src="${imgSrc}" alt="News Image">` : ""}
        <h3><a href="${item.link}" target="_blank">${titleSI}</a></h3>
        <p>${cleanDesc.substring(0, 160)}...</p>
        <button onclick="shareToFacebook('${titleSI}', '${item.link}')">FB Share</button>
      </div>
    `;
  }
}

// Load news
async function loadNews(category = "all", forceRefresh = false) {
  currentCategory = category;
  const container = document.getElementById("news-container");
  if (!container) return;

  container.innerHTML = "<p>පුවත් ලෝඩ් වෙමින්...</p>";
  statusText.innerText = "Loading news...";

  const cachedNews = JSON.parse(localStorage.getItem("news_cache") || "[]");
  if (!forceRefresh && cachedNews.length > 0) {
    newsItems = cachedNews;
    statusText.innerText = "✅ Loaded from cache";
    renderNews(filterByCategory(newsItems, category));
    return;
  }

  try {
    let allNews = [];
    for (let feed of rssFeeds) {
      const items = await fetchRSS(feed);
      allNews = allNews.concat(items);
    }

    const unique = [];
    const seen = new Set();
    for (let item of allNews) {
      if (!seen.has(item.link)) {
        seen.add(item.link);
        unique.push(item);
      }
    }

    newsItems = unique;
    localStorage.setItem("news_cache", JSON.stringify(newsItems));
    statusText.innerText = "✅ Latest news loaded";

    renderNews(filterByCategory(newsItems, category));

  } catch (error) {
    console.log(error);
    container.innerHTML = "<p style='color:red;'>පුවත් ලබාගත නොහැක.</p>";
    statusText.innerText = "❌ Failed to load news";
  }
}

// Auto refresh every 10 minutes
setInterval(() => {
  loadNews(currentCategory, true);
}, 600000);

document.addEventListener("DOMContentLoaded", () => {
  loadNews();
});
