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

// --------------------------------------------
// ① オンロード時の処理（画面の初期化のみ）
// --------------------------------------------
window.onload = function() {
  pageTargetDate = getTargetDateFromURL();

  if (!pageTargetDate) {
    pageTargetDate = getLogicalDate(); // ※getLogicalDateが他で定義されている前提
  }

  window.targetDate = pageTargetDate;

  if (!pageTargetDate) {
    alert("日付取得に失敗してます");
    return;
  }

  const dateParts = pageTargetDate.split("-");
  if (dateParts.length !== 3) {
    console.error("日付形式がおかしい:", pageTargetDate);
    return;
  }

  const targetDateObj = new Date(
    parseInt(dateParts[0]),
    parseInt(dateParts[1]) - 1,
    parseInt(dateParts[2])
  );

  if (isNaN(targetDateObj)) {
    console.error("Invalid Date:", pageTargetDate);
    return;
  }

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

  if (typeof fetchWeather === "function") {
    fetchWeather();
  }

  createScoreButtons(); // ※他で定義されている前提
  showMorningCompareBanner();
  renderHierarchicalFactors();
}; // ← 【重要】window.onload はここで確実に閉じます

// --------------------------------------------
// ② 各種関数（window.onload の外に出す）
// --------------------------------------------

function getFactorState() {
  const dynamicArea = document.getElementById("dynamicArea");

  const selectedIds = dynamicArea
    ? Array.from(dynamicArea.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value)
    : [];

  return {
    selectedIds,
    socialValue:   document.getElementById("select_social")?.value   || "",
    locationValue: document.getElementById("select_location")?.value || "",
    customText:    document.getElementById("custom_out_text")?.value || "",
  };
}

// 関数を window.onload の外に出しておくと、コードがスッキリして管理しやすくなります
function renderHierarchicalFactors() {
  const selectArea = document.getElementById("selectArea");
  const dynamicArea = document.getElementById("dynamicArea");

  if (!selectArea || !dynamicArea) return;

  // 初回のみ実行
  renderSelectArea(selectArea);
  renderMealSelector(dynamicArea);

  // セレクト変更時はfactorAreaだけ更新
  function onSelectChange() {
    const state = getFactorState();
    renderFactorArea(dynamicArea, state);
  }

  document.getElementById("select_social")?.addEventListener("change", onSelectChange);
  document.getElementById("select_location")?.addEventListener("change", onSelectChange);

  // 初回描画
  onSelectChange();
}

function renderSelectArea(selectArea) {
  const createSelect = (id, label, options) => {
    const wrapper = document.createElement("div");

    const p = document.createElement("p");
    p.textContent = label;

    const select = document.createElement("select");
    select.id = id;

    const def = document.createElement("option");
    def.value = "";
    def.textContent = "選択してください";
    select.appendChild(def);

    options.forEach(opt => {
      const o = document.createElement("option");
      o.value = opt.id;
      o.textContent = opt.label;
      select.appendChild(o);
    });

    wrapper.appendChild(p);
    wrapper.appendChild(select);
    selectArea.appendChild(wrapper);
  };

  createSelect("select_social",   "どのように過ごしましたか？", FACTOR_STEPS.social);
  createSelect("select_location", "外出しましたか？",           FACTOR_STEPS.location);
}

function renderFactorArea(dynamicArea, state) {
  const existing = document.getElementById("factorSection");
  if (existing) existing.remove();

  if (state.locationValue !== "out" && state.locationValue !== "home") return;

  const section = document.createElement("div");
  section.id = "factorSection";
  section.style.cssText =
    "margin-top:10px;padding:15px;background:#f9f9f9;border-radius:10px;border:1px solid #eee;";

  // 外出時のみ追加項目を表示
  if (state.locationValue === "out") {
    const outGrid = document.createElement("div");
    outGrid.className = "factor-list";
    FACTOR_STEPS.outDetails.forEach(f => {
      outGrid.appendChild(createFactorLabel(f, state.selectedIds.includes(f.id)));
    });
    section.appendChild(outGrid);

    // 自由記述
    const customDiv = document.createElement("div");
    customDiv.style.cssText = "margin-top:8px; width:100%;";
    customDiv.innerHTML = `
      <p style="font-size:12px;color:#666;margin-bottom:4px;">その他の外出内容</p>
      <input type="text" id="custom_out_text" value="${state.customText || ""}"
             placeholder="例：カフェ"
             style="width:100%;padding:10px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box;">
    `;
    section.appendChild(customDiv);
  }

  // 共通項目
  const commonGrid = document.createElement("div");
  commonGrid.className = "factor-list";
  commonGrid.style.marginTop = "16px";
  FACTOR_STEPS.commonDetails.forEach(f => {
    commonGrid.appendChild(createFactorLabel(f, state.selectedIds.includes(f.id)));
  });
  section.appendChild(commonGrid);

  dynamicArea.insertBefore(section, dynamicArea.firstChild);
}

function createFactorLabel(f, isChecked) {
  const label = document.createElement("label");
  label.className = `factor-item ${f.category}`;
  label.style.width = "calc(50% - 4px)";
  label.style.boxSizing = "border-box";

  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.value = f.id;
  cb.checked = isChecked;

  label.appendChild(cb);
  label.appendChild(document.createTextNode(" " + f.label));
  return label;
}

function renderMealSelector(dynamicArea) {
  const mealContainer = document.createElement("div");
  mealContainer.id = "mealContainerBox";

  mealContainer.innerHTML = `
    <label style="font-weight:bold;">🍴 食事回数</label>
    <div style="display:flex;gap:8px;">
      ${[0, 1, 2, 3].map(n => `
        <div style="flex:1;">
          <input type="radio" name="meal_count" id="meal_${n}" value="meal_${n}" ${n === 3 ? "checked" : ""} hidden>
          <label for="meal_${n}" class="meal-btn">${n === 0 ? "抜き" : n + "食"}</label>
        </div>
      `).join("")}
    </div>
  `;

  dynamicArea.appendChild(mealContainer);

  const buttons = mealContainer.querySelectorAll(".meal-btn");
  buttons.forEach(btn => {
    btn.onclick = () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    };
  });
}

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
  // 1. チェックされている項目をすべて取得
  const selectedFactors = Array.from(
    document.querySelectorAll('#factorSection input[type="checkbox"]:checked')
  ).map(cb => cb.value);

  // プルダウンの選択値を取得
  const socialVal = document.getElementById("select_social")?.value;
  const locationVal = document.getElementById("select_location")?.value;
  if (socialVal) selectedFactors.push(socialVal);
  if (locationVal) selectedFactors.push(locationVal);

  // 2. 自由入力のテキストボックスがあれば取得
  const customTextEl = document.getElementById("custom_out_text");
  if (customTextEl && customTextEl.value.trim() !== "") {
    selectedFactors.push("自由入力:" + customTextEl.value);
  }

  // 食事回数のラジオボタンの値を取得
  const selectedMeal = document.querySelector('input[name="meal_count"]:checked');
  if (selectedMeal) {
    selectedFactors.push(selectedMeal.value);
  }

  // 3. 天気情報の取得
  const wc = getFromStorage("weather_cache_" + pageTargetDate) || {}; // ※getFromStorageが定義されている前提

  // 4. 送信データの作成
  const data = {
    recordType: "evening",
    date:            pageTargetDate,
    attendance:      document.getElementById("attendance") ? document.getElementById("attendance").value : "",
    weather:         (typeof weatherCache !== "undefined" ? weatherCache.weather : "") || wc.weather || "",
    temp:            (typeof weatherCache !== "undefined" ? weatherCache.temp : "") || wc.temp || "",
    pressure:        (typeof weatherCache !== "undefined" ? weatherCache.pressure : "") || wc.pressure || "",
    pressureWarning: (typeof weatherCache !== "undefined" ? weatherCache.pressureWarning : "") || wc.pressureWarning || "",
    condition:       (typeof getScore === "function" ? getScore("condition") : "") ?? "",
    energy:          (typeof getScore === "function" ? getScore("energy") : "") ?? "",
    mental:          (typeof getScore === "function" ? getScore("mental") : "") ?? "",
    factors:         selectedFactors,
    comment:         document.getElementById("comment") ? document.getElementById("comment").value : ""
  };

  // データの保存
  localStorage.setItem("evening_" + pageTargetDate, JSON.stringify(data));
  localStorage.setItem("evening_" + pageTargetDate + "_done", "1");

  // GASへの送信処理
  const SEND_URL = (typeof APP_CONFIG !== "undefined" ? APP_CONFIG.GAS_URL : null);
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
    .then(result => {
      console.log("送信データ:", data);
      console.log("GAS送信完了:", result);
    })
    .catch(e => console.warn("GAS送信エラー:", e));
  }

  alert("夜の記録を保存しました！");
  window.location.href = "index.html";
}