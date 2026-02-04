// DARK MODE
function toggleDarkMode() {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", document.body.classList.contains("dark")?"enabled":"disabled");
}
if(localStorage.getItem("darkMode")==="enabled") document.body.classList.add("dark");

// NEWS VARIABLES
let newsItems=[], currentCategory="all";
const statusText = document.getElementById("status-text");
const rssFeeds=["https://www.adaderana.lk/rss.php","https://www.lankadeepa.lk/rss","https://www.hirunews.lk/rss"];
const categories={all:"", local:"sri lanka", world:"world", sports:"sports", business:"business"};

// TRANSLATION CACHE
function getTranslationCache(){ return JSON.parse(localStorage.getItem("translation_cache")||"{}"); }
function saveTranslationCache(cache){ localStorage.setItem("translation_cache", JSON.stringify(cache)); }
async function translateToSinhala(text){
  if(!text) return "";
  const cache=getTranslationCache();
  if(cache[text]) return cache[text];
  try{
    const url=`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|si`;
    const res=await fetch(url);
    const data=await res.json();
    const translated=data?.responseData?.translatedText||text;
    cache[text]=translated; saveTranslationCache(cache);
    return translated;
  }catch(e){ console.log(e); return text; }
}

// FETCH RSS
async function fetchRSS(url){ try{ const res=await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`); const data=await res.json(); return data.items||[]; }catch(e){ return []; } }
function extractImage(desc){ const m=desc?.match(/<img[^>]+src="([^">]+)"/); return m?m[1]:""; }
function cleanDescription(desc){ return desc?.replace(/<[^>]*>/g,"").trim()||""; }
function shareToFacebook(title,link){ if(!link) return; window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}&quote=${encodeURIComponent(title)}`,"_blank"); }
function filterByCategory(items,category){ const key=categories[category]||""; if(!key) return items; return items.filter(it=>((it.title+it.description).toLowerCase().includes(key))); }

async function renderNews(items){
  const container=document.getElementById("news-container"); if(!container) return;
  container.innerHTML="";
  if(!items || items.length===0){ container.innerHTML="<p>මෙම කාණ්ඩය සඳහා පුවත් නොමැත.</p>"; return; }
  items=items.slice(0,25);
  for(let it of items){
    const img=extractImage(it.description);
    const desc=cleanDescription(it.description);
    const titleSI=await translateToSinhala(it.title||"");
    container.innerHTML+=`
      <div class="news-card">
        ${img?`<img src="${img}" alt="News">`:''}
        <h3><a href="${it.link}" target="_blank">${titleSI}</a></h3>
        <p>${desc.substring(0,160)}...</p>
        <button onclick="shareToFacebook('${titleSI}','${it.link}')">FB Share</button>
      </div>
    `;
  }
}

async function loadNews(category="all",force=false){
  currentCategory=category;
  const container=document.getElementById("news-container");
  if(!container) return;
  container.innerHTML="<p>පුවත් ලෝඩ් වෙමින්...</p>"; statusText.innerText="Loading...";
  const cached=JSON.parse(localStorage.getItem("news_cache")||"[]");
  if(!force && cached.length>0){ newsItems=cached; statusText.innerText="✅ Loaded from cache"; renderNews(filterByCategory(newsItems,category)); return; }
  try{
    let allNews=[];
    for(let f of rssFeeds){ const items=await fetchRSS(f); allNews=allNews.concat(items); }
    const unique=[]; const seen=new Set();
    for(let it of allNews){ if(!seen.has(it.link)){ seen.add(it.link); unique.push(it); } }
    newsItems=unique; localStorage.setItem("news_cache",JSON.stringify(newsItems)); statusText.innerText="✅ Latest news loaded";
    renderNews(filterByCategory(newsItems,category));
  }catch(e){ console.log(e); container.innerHTML="<p style='color:red;'>පුවත් ලබාගත නොහැක.</p>"; statusText.innerText="❌ Failed"; }
}

document.addEventListener("DOMContentLoaded",()=>{ loadNews(); });
setInterval(()=>{ loadNews(currentCategory,true); },600000);
