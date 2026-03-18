// ============================================
// evening.js — 夜の振り返りページのロジック
// ============================================

let pageTargetDate = "";

function getTargetDateFromURL() {
  const params = new URLSearchParams(window.location.search);
  const dateParam = params.get("date");
  if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    return dateParam;
  }
  return null;
}

window.onload = function() {
  pageTargetDate = getTargetDateFromURL();
  if (!pageTargetDate) {
    if (typeof getLogicalDate === "function") {
      pageTargetDate = getLogicalDate();
    } else {
      const now = new Date();
      pageTargetDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
    }
  }

  const dateParts = pageTargetDate.split("-");
  const targetDateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
  const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
  const el = document.getElementById("dateSection");

  const now = new Date();
  const actualToday = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;

  if (pageTargetDate !== actualToday) {
    el.textContent = "📅 " + targetDateObj.toLocaleDateString('ja-JP', options) + " の振り返り";
    el.style.background = "#fff8e1";
    el.style.border = "1px solid #f57f1744";
  } else {
    el.textContent = "本日の日付：" + targetDateObj.toLocaleDateString('ja-JP', options);
  }

  if (typeof fetchWeather === "function") fetchWeather();
  createScoreButtons();
  showMorningCompareBanner();
};

function showMorningCompareBanner() {
  const morningData = localStorage.getItem("morning_" + pageTargetDate);
  const banner = document.getElementById("morningCompareBanner");
  if (!banner) return;

  if (morningData) {
    try {
      const d = JSON.parse(morningData);
      const scoreEmoji = { 1:"🤧", 2:"😷", 3:"🙂", 4:"😊", 5:"😄" };
      const energyLabel = { 1:"20%", 2:"40%", 3:"60%", 4:"80%", 5:"100%" };
      const mentalEmoji = { 1:"⛈️", 2:"🌧️", 3:"☁️", 4:"🌤️", 5:"☀️" };

      banner.innerHTML = `
        <div style="font-size:12px;color:#555;margin-bottom:4px;">朝の記録</div>
        <div style="display:flex;gap:16px;font-size:14px;">
          <span>体調 ${scoreEmoji[d.condition] || "-"}</span>
          <span>活力 ${energyLabel[d.energy] || "-"}</span>
          <span>メンタル ${mentalEmoji[d.mental] || "-"}</span>
        </div>
      `;
      banner.style.display = "block";
    } catch(e) {}
  }
}

function sendEveningData() {
  if (!pageTargetDate) {
    alert("エラー：記録対象の日付が不明です。ページを再読み込みしてください。");
    return;
  }

  const getScore = id => {
    const btn = document.querySelector(`#${id} .score-emoji-btn.active`);
    return btn ? parseInt(btn.dataset.value) : null;
  };

  const factors = typeof getSelectedFactors === "function" ? getSelectedFactors() : [];
  const wc = typeof weatherCache !== "undefined" ? weatherCache : {};

  const data = {
    date:            pageTargetDate,
    recordType:      "evening",
    attendance:      document.getElementById("attendance") ? document.getElementById("attendance").value : "",
    weather:         wc.weather || "",
    temp:            wc.temp || "",
    pressure:        wc.pressure || "",
    pressureWarning: wc.pressureWarning || "",
    condition:       getScore("condition"),
    energy:          getScore("energy"),
    mental:          getScore("mental"),
    factors:         factors,
    comment:         document.getElementById("comment").value
  };

  localStorage.setItem("evening_" + pageTargetDate, JSON.stringify(data));
  localStorage.setItem("evening_" + pageTargetDate + "_done", "1");

  const SEND_URL = APP_CONFIG.GAS_URL;

  if (SEND_URL) {
    const params = new URLSearchParams();
    Object.entries(data).forEach(([key, value]) => {
      params.append(key, Array.isArray(value) ? value.join(",") : (value ?? ""));
    });

    fetch(SEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString()
    })
    .then(res => res.json())
    .then(result => { console.log("GAS送信完了:", result); })
    .catch(e => console.warn("GAS送信エラー:", e));
  }

  const now = new Date();
  const actualToday = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;

  if (pageTargetDate !== actualToday) {
    alert("✅ " + pageTargetDate + " の夜の振り返りを保存しました！");
  } else {
    alert("✅ 夜の振り返りを保存しました！");
  }
  window.location.href = "index.html";
}