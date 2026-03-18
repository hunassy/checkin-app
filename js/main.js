// ============================================
// main.js — メイン画面（index.html）のロジック
// ============================================

// ---- グローバル変数 ----
let goodSigns = [];
let badSigns = [];
let sleepTypes = [];
let sleepSymbols = [];

// 天気データ（fetchWeather で取得後に保存）
let weatherCache = {
  weather: "",
  temp: "",
  pressure: "",
  pressureWarning: ""
};

// ============================================
// ページ読み込み時の初期化
// ============================================
window.onload = function() {
  displayCurrentDate();
  loadSleepTypes();
  loadGoodSigns();
  loadBadSigns();
  createScoreButtons();
  initTimeSelects();
  fetchWeather();

　// 昨日との比較ボタンのクリック処理
  const compareBtns = document.querySelectorAll(".compare-btn");
  compareBtns.forEach(btn => {
    btn.addEventListener("click", function() {
      compareBtns.forEach(b => b.classList.remove("active"));
      this.classList.add("active");
    });
  });
};

// ============================================
// 日付表示
// ============================================
function displayCurrentDate() {
  const now = new Date();
  const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
  const el = document.getElementById("dateSection");
  if (el) {
    el.textContent = "本日の日付：" + now.toLocaleDateString('ja-JP', options);
  }
}

// ============================================
// 時刻セレクトボックスの初期化
// ============================================
function initTimeSelects() {
  // 就寝時刻（18時〜翌3時）
  const bedHours = [18,19,20,21,22,23,0,1,2,3];
  fillHourSelect("bedtimeHour", bedHours);

  // 起床時刻（3時〜13時）
  const wakeHours = [3,4,5,6,7,8,9,10,11,12,13];
  fillHourSelect("wakeuptimeHour", wakeHours);

  // 睡眠時間の自動計算
  ["bedtimeHour","bedtimeMinute","wakeuptimeHour","wakeuptimeMinute","wakeupDuration"]
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener("change", calcSleepTime);
    });
}

function fillHourSelect(id, hours) {
  const sel = document.getElementById(id);
  if (!sel) return;
  hours.forEach(h => {
    const opt = document.createElement("option");
    opt.value = h;
    opt.textContent = h + "時";
    sel.appendChild(opt);
  });
}

// ============================================
// 睡眠時間の計算
// ============================================
function calcSleepTime() {
  const bh = parseInt(document.getElementById("bedtimeHour").value);
  const bm = parseInt(document.getElementById("bedtimeMinute").value) || 0;
  const wh = parseInt(document.getElementById("wakeuptimeHour").value);
  const wm = parseInt(document.getElementById("wakeuptimeMinute").value) || 0;
  const wakeupDur = parseInt(document.getElementById("wakeupDuration").value) || 0;

  if (isNaN(bh) || isNaN(wh)) {
    document.getElementById("sleepResult").textContent = "総睡眠時間：（時刻を選択してください）";
    return;
  }

  let bedMin  = bh * 60 + bm;
  let wakeMin = wh * 60 + wm;

  // 就寝が深夜0時をまたぐ場合
  if (wakeMin <= bedMin) wakeMin += 24 * 60;

  let totalMin = wakeMin - bedMin - wakeupDur;
  if (totalMin < 0) totalMin = 0;

  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  document.getElementById("sleepResult").textContent =
    `総睡眠時間：${h}時間${m}分`;
}

// ============================================
// 睡眠タイプ
// ============================================
function loadSleepTypes() {
  const savedTypes   = localStorage.getItem("sleepTypes");
  const savedSymbols = localStorage.getItem("sleepSymbols");

  sleepTypes   = savedTypes   ? JSON.parse(savedTypes)   : (typeof DEFAULT_SLEEP_TYPES   !== "undefined" ? DEFAULT_SLEEP_TYPES   : ["よく眠れた","まあまあ眠れた","そこそこ眠れた","何とか眠れた","眠れなかった"]);
  sleepSymbols = savedSymbols ? JSON.parse(savedSymbols) : (typeof DEFAULT_SLEEP_SYMBOLS !== "undefined" ? DEFAULT_SLEEP_SYMBOLS : ["◎","○","△","△","×"]);

  createSleepTypeButtons();
}

function createSleepTypeButtons() {
  const container = document.getElementById("sleepType");
  if (!container) return;
  container.innerHTML = "";

  sleepTypes.forEach((type, index) => {
    const btn = document.createElement("button");
    btn.className = "sleep-type-btn";
    btn.dataset.value = type;

    const symbol = sleepSymbols[index] || "○";
    let symbolClass = "";
    if (symbol === "◎") symbolClass = "symbol-double-circle";
    else if (symbol === "○" || symbol === "〇") symbolClass = "symbol-circle";
    else if (symbol === "△") symbolClass = "symbol-triangle";
    else if (symbol === "✕" || symbol === "×") symbolClass = "symbol-cross";

    const symbolSpan = document.createElement("span");
    symbolSpan.className = `sleep-type-symbol ${symbolClass}`;
    symbolSpan.textContent = symbol;

    const textSpan = document.createElement("span");
    textSpan.className = "sleep-type-text";
    textSpan.textContent = type;

    btn.appendChild(symbolSpan);
    btn.appendChild(textSpan);

    btn.onclick = () => {
      container.querySelectorAll(".sleep-type-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    };

    container.appendChild(btn);
  });
}

// ============================================
// Good/Badサイン
// ============================================
function loadGoodSigns() {
  const saved = localStorage.getItem("goodSigns");
  goodSigns = saved ? JSON.parse(saved) : [];
  renderSignList("goodList", goodSigns, "good");
}

function loadBadSigns() {
  const saved = localStorage.getItem("badSigns");
  badSigns = saved ? JSON.parse(saved) : [];
  renderSignList("badList", badSigns, "bad");
}

function renderSignList(containerId, signs, type) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";

  if (signs.length === 0) {
    container.innerHTML = "<p style='color:#999;font-size:14px;'>登録されていません（設定画面で登録できます）</p>";
    return;
  }

  signs.forEach((sign, index) => {
    const label = document.createElement("label");
    label.className = "good-bad-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `${type}_${index}`;
    checkbox.value = sign;

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(" " + sign));
    container.appendChild(label);
  });
}

// ============================================
// 天気情報の取得
// ============================================
async function fetchWeather() {
  const zipcode = localStorage.getItem("zipcode");
  if (!zipcode) return;

  try {
    const addressData = await getCityFromZipcode(zipcode);
    if (!addressData) return;

    const weatherData = await getWeatherFromCity(addressData.cityOnly, addressData.fullAddress);

    const el = v => document.getElementById(v);
    if (el("weatherValue"))  el("weatherValue").textContent  = weatherData.weather;
    if (el("tempValue"))     el("tempValue").textContent     = weatherData.temp + "℃";
    if (el("pressureValue")) el("pressureValue").textContent = weatherData.pressure + "hPa";

    // 気圧注意度
    let pressureWarningText = "";
    const pw = el("pressureWarning");
    if (pw) {
      if (weatherData.pressure < 1000) {
        pressureWarningText = "⚠️ 低気圧";
        pw.textContent = pressureWarningText;
        pw.style.color = "#d32f2f";
      } else if (weatherData.pressure > 1015) {
        pressureWarningText = "↑ 高め";
        pw.textContent = pressureWarningText;
        pw.style.color = "#f57c00";
      } else {
        pressureWarningText = "✓ 安定";
        pw.textContent = pressureWarningText;
        pw.style.color = "#388e3c";
      }
    }

    // グローバル変数に保存（送信時に使用）
    weatherCache.weather         = weatherData.weather;
    weatherCache.temp            = weatherData.temp;
    weatherCache.pressure        = weatherData.pressure;
    weatherCache.pressureWarning = pressureWarningText;

  } catch (e) {
    console.warn("天気取得失敗:", e);
  }
}

// ============================================
// 今日の日付キーを取得
// ============================================
function getTodayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
}

// ============================================
// データ送信
// ============================================
function sendData() {
  const today = getTodayKey();

  // 睡眠タイプ
  const sleepTypeBtn = document.querySelector(".sleep-type-btn.active");
  const sleepType = sleepTypeBtn ? sleepTypeBtn.dataset.value : "";

  // スコア
  const getScore = id => {
    const btn = document.querySelector(`#${id} .score-emoji-btn.active`);
    return btn ? parseInt(btn.dataset.value) : null;
  };

  // Good/Badサイン
  const getChecked = id => {
    return [...document.querySelectorAll(`#${id} input:checked`)].map(cb => cb.value);
  };

  // 昨日との比較
  const compareBtn = document.querySelector(".compare-btn.active");
  const compareYesterday = compareBtn ? compareBtn.dataset.value : "";

  // 影響要因
  const factors = typeof getSelectedFactors === "function" ? getSelectedFactors() : [];

  const data = {
    date:            today,
    recordType:      "morning",
    sleepType:       sleepType,
    weather:         weatherCache.weather,
    temp:            weatherCache.temp,
    pressure:        weatherCache.pressure,
    pressureWarning: weatherCache.pressureWarning,
    bedtimeHour:   document.getElementById("bedtimeHour").value,
    bedtimeMinute: document.getElementById("bedtimeMinute").value,
    wakeuptimeHour:   document.getElementById("wakeuptimeHour").value,
    wakeuptimeMinute: document.getElementById("wakeuptimeMinute").value,
    wakeupDuration:   document.getElementById("wakeupDuration").value,
    condition:     getScore("condition"),
    energy:        getScore("energy"),
    mental:        getScore("mental"),
    compareYesterday: compareYesterday,
    factors:       factors,
    goodSigns:     getChecked("goodList"),
    badSigns:      getChecked("badList"),
    comment:       document.getElementById("comment").value
  };

  // localStorageに保存（朝の記録用キー）
  localStorage.setItem("morning_" + today, JSON.stringify(data));
  localStorage.setItem("morning_" + today + "_done", "1");

  // Google Apps Script に送信
  const GAS_URL = APP_CONFIG.GAS_URL;
  if (GAS_URL) {
    // GASはCORS対応のためfetch + URLSearchParamsで送信
    const params = new URLSearchParams();
    Object.entries(data).forEach(([key, value]) => {
      params.append(key, Array.isArray(value) ? value.join(",") : (value ?? ""));
    });

    fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString()
    })
    .then(res => res.json())
    .then(result => {console.log("GAS送信完了:", result);})
    .catch(e => console.warn("GAS送信エラー:", e));
  }

  alert("✅ 朝の記録を保存しました！");

  // 送信後にページをリロードして初期状態に戻す
  location.reload();
}
