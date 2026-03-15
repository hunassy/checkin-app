// ============================================
// main.js — メイン画面（index_v10.html）のロジック
// ============================================

// ---- グローバル変数 ----
let goodSigns = [];
let badSigns = [];
let medicines = [];
let sleepTypes = [];
let sleepSymbols = [];

// スコアの定義（絵文字デザイン）
const SCORE_CONFIG = {
  condition: {
    label: "体調",
    items: [
      { emoji: "🤧", label: "とても悪い", value: 1, cls: "score-taichou-1" },
      { emoji: "😷", label: "悪い",       value: 2, cls: "score-taichou-2" },
      { emoji: "🙂", label: "普通",       value: 3, cls: "score-taichou-3" },
      { emoji: "😊", label: "良い",       value: 4, cls: "score-taichou-4" },
      { emoji: "😄", label: "とても良い", value: 5, cls: "score-taichou-5" }
    ]
  },
  energy: {
    label: "活力",
    items: [
      { battery: 20,  value: 1, cls: "score-katsu-1" },
      { battery: 40,  value: 2, cls: "score-katsu-2" },
      { battery: 60,  value: 3, cls: "score-katsu-3" },
      { battery: 80,  value: 4, cls: "score-katsu-4" },
      { battery: 100, value: 5, cls: "score-katsu-5" }
    ]
  },
  mental: {
    label: "メンタル",
    items: [
      { emoji: "⛈️", label: "最悪", value: 1, cls: "score-mental-1" },
      { emoji: "🌧️", label: "悪い", value: 2, cls: "score-mental-2" },
      { emoji: "☁️",  label: "普通", value: 3, cls: "score-mental-3" },
      { emoji: "🌤️", label: "良い", value: 4, cls: "score-mental-4" },
      { emoji: "☀️",  label: "最高", value: 5, cls: "score-mental-5" }
    ]
  }
};

// バッテリーの色設定
const BATTERY_COLORS = {
  20:  "#e57373",  // 赤
  40:  "#ffb74d",  // オレンジ
  60:  "#ffd54f",  // 黄
  80:  "#aed581",  // 黄緑
  100: "#4CAF50"   // 緑
};

// ============================================
// ページ読み込み時の初期化
// ============================================
window.onload = function() {
  displayCurrentDate();
  loadSleepTypes();
  loadMedicines();
  loadGoodSigns();
  loadBadSigns();
  createScoreButtons();
  initTimeSelects();
  fetchWeather();
  restoreTodayData();
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
// 薬
// ============================================
function loadMedicines() {
  const saved = localStorage.getItem("medicines");
  medicines = saved ? JSON.parse(saved) : [];
  renderMedicines();
}

function renderMedicines() {
  const container = document.getElementById("medicineList");
  if (!container) return;
  container.innerHTML = "";

  if (medicines.length === 0) {
    container.innerHTML = "<p style='color:#999;font-size:14px;'>薬が登録されていません（設定画面で登録できます）</p>";
    return;
  }

  medicines.forEach((med, index) => {
    const label = document.createElement("label");
    label.className = "medicine-item-label";
    label.innerHTML = `
      <input type="checkbox" id="med_${index}" value="${med}">
      ${med}
    `;
    container.appendChild(label);
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
// スコアボタン（絵文字デザイン）
// ============================================
function createScoreButtons() {
  Object.keys(SCORE_CONFIG).forEach(scoreId => {
    const config = SCORE_CONFIG[scoreId];
    const container = document.getElementById(scoreId);
    if (!container) return;
    container.innerHTML = "";

    config.items.forEach(item => {
      const btn = document.createElement("button");
      btn.className = `score-emoji-btn ${item.cls}`;
      btn.dataset.value = item.value;
      btn.type = "button";

      if (scoreId === "energy") {
        // バッテリーアイコン
        btn.appendChild(createBatteryIcon(item.battery));
      } else {
        // 絵文字
        const emojiSpan = document.createElement("span");
        emojiSpan.className = "score-emoji";
        emojiSpan.textContent = item.emoji;
        btn.appendChild(emojiSpan);

        // ラベルテキスト
        const labelSpan = document.createElement("span");
        labelSpan.className = "score-label";
        labelSpan.textContent = item.label;
        btn.appendChild(labelSpan);
      }

      btn.onclick = () => {
        container.querySelectorAll(".score-emoji-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
      };

      container.appendChild(btn);
    });
  });
}

// バッテリーアイコンを生成する関数
function createBatteryIcon(percent) {
  const wrapper = document.createElement("div");
  wrapper.className = "battery-icon";

  const fill = document.createElement("div");
  fill.className = "battery-fill";
  fill.style.width = `calc(${percent}% - 2px)`;
  fill.style.background = BATTERY_COLORS[percent] || "#4CAF50";

  const text = document.createElement("span");
  text.className = "battery-text";
  text.textContent = percent + "%";

  wrapper.appendChild(fill);
  wrapper.appendChild(text);
  return wrapper;
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
    const pw = el("pressureWarning");
    if (pw) {
      if (weatherData.pressure < 1000) {
        pw.textContent = "⚠️ 低気圧";
        pw.style.color = "#d32f2f";
      } else if (weatherData.pressure > 1015) {
        pw.textContent = "↑ 高め";
        pw.style.color = "#f57c00";
      } else {
        pw.textContent = "✓ 安定";
        pw.style.color = "#388e3c";
      }
    }
  } catch (e) {
    console.warn("天気取得失敗:", e);
  }
}

// ============================================
// 今日のデータを復元（localStorage から）
// ============================================
function restoreTodayData() {
  const today = getTodayKey();
  const saved = localStorage.getItem("diary_" + today);
  if (!saved) return;

  try {
    const data = JSON.parse(saved);

    // 通所/在宅・朝食
    if (data.attendance) document.getElementById("attendance").value = data.attendance;
    if (data.breakfast)  document.getElementById("breakfast").value  = data.breakfast;

    // 就寝・起床時刻
    if (data.bedtimeHour)      document.getElementById("bedtimeHour").value      = data.bedtimeHour;
    if (data.bedtimeMinute)    document.getElementById("bedtimeMinute").value    = data.bedtimeMinute;
    if (data.wakeuptimeHour)   document.getElementById("wakeuptimeHour").value   = data.wakeuptimeHour;
    if (data.wakeuptimeMinute) document.getElementById("wakeuptimeMinute").value = data.wakeuptimeMinute;
    if (data.wakeupDuration)   document.getElementById("wakeupDuration").value   = data.wakeupDuration;
    calcSleepTime();

    // 睡眠タイプ
    if (data.sleepType) {
      document.querySelectorAll(".sleep-type-btn").forEach(btn => {
        if (btn.dataset.value === data.sleepType) btn.classList.add("active");
      });
    }

    // スコア
    ["condition","energy","mental"].forEach(id => {
      if (data[id]) {
        const container = document.getElementById(id);
        if (container) {
          container.querySelectorAll(".score-emoji-btn").forEach(btn => {
            if (parseInt(btn.dataset.value) === data[id]) btn.classList.add("active");
          });
        }
      }
    });

    // Good/Badサイン
    if (data.goodSigns) {
      data.goodSigns.forEach(sign => {
        document.querySelectorAll("#goodList input").forEach(cb => {
          if (cb.value === sign) cb.checked = true;
        });
      });
    }
    if (data.badSigns) {
      data.badSigns.forEach(sign => {
        document.querySelectorAll("#badList input").forEach(cb => {
          if (cb.value === sign) cb.checked = true;
        });
      });
    }

    // 薬
    if (data.medicines) {
      data.medicines.forEach(med => {
        document.querySelectorAll("#medicineList input").forEach(cb => {
          if (cb.value === med) cb.checked = true;
        });
      });
    }

    // コメント
    if (data.comment) document.getElementById("comment").value = data.comment;

  } catch (e) {
    console.warn("データ復元エラー:", e);
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

  // 薬
  const checkedMeds = [...document.querySelectorAll("#medicineList input:checked")].map(cb => cb.value);

  const data = {
    date:          today,
    attendance:    document.getElementById("attendance").value,
    breakfast:     document.getElementById("breakfast").value,
    sleepType:     sleepType,
    bedtimeHour:   document.getElementById("bedtimeHour").value,
    bedtimeMinute: document.getElementById("bedtimeMinute").value,
    wakeuptimeHour:   document.getElementById("wakeuptimeHour").value,
    wakeuptimeMinute: document.getElementById("wakeuptimeMinute").value,
    wakeupDuration:   document.getElementById("wakeupDuration").value,
    condition:     getScore("condition"),
    energy:        getScore("energy"),
    mental:        getScore("mental"),
    goodSigns:     getChecked("goodList"),
    badSigns:      getChecked("badList"),
    medicines:     checkedMeds,
    comment:       document.getElementById("comment").value
  };

  // localStorageに保存
  localStorage.setItem("diary_" + today, JSON.stringify(data));

  // Google Apps Script に送信（URLが設定されている場合）
  const GAS_URL = localStorage.getItem("gasUrl");
  if (GAS_URL) {
    const form = document.createElement("form");
    form.action = GAS_URL;
    form.method = "POST";
    form.target = "_blank";

    Object.entries(data).forEach(([key, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = Array.isArray(value) ? value.join(",") : (value ?? "");
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  }

  alert("✅ 記録を保存しました！");
}