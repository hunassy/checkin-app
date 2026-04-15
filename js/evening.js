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

  // --- 影響要因の階層表示ロジック ---
  renderHierarchicalFactors(); 
};

// 関数を window.onload の外に出しておくと、コードがスッキリして管理しやすくなります
function renderHierarchicalFactors() {
  const container = document.getElementById("factorList");
  if (!container) return;

  function updateView() {
    // 現在の選択状態を保持
    const selectedIds = Array.from(container.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
    const customText = document.getElementById("custom_out_text")?.value || "";

    container.innerHTML = ""; 

    // 1. 基本項目（誰と・場所）を表示
    if (typeof FACTOR_STEPS !== "undefined") {
        [...FACTOR_STEPS.social, ...FACTOR_STEPS.location].forEach(factor => {
          createFactorTag(container, factor, selectedIds.includes(factor.id));
        });

        // 2. 「外出した」にチェックがある場合のみ詳細を表示
        if (selectedIds.includes("out")) {
          const detailSection = document.createElement("div");
          detailSection.style.width = "100%";
          detailSection.style.marginTop = "10px";
          detailSection.style.padding = "10px";
          detailSection.style.background = "#f9f9f9";
          detailSection.style.borderRadius = "8px";

          FACTOR_STEPS.outDetails.forEach(factor => {
            createFactorTag(detailSection, factor, selectedIds.includes(factor.id));
          });

          // 自由記述用のテキストボックスを追加
          const customInputDiv = document.createElement("div");
          customInputDiv.style.marginTop = "10px";
          customInputDiv.innerHTML = `<p style="font-size:12px; color:#666; margin-bottom:4px;">その他の外出内容（自由入力）</p><input type="text" id="custom_out_text" value="${customText}" placeholder="例：美容院、カフェなど" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px; box-sizing:border-box;">`;
          detailSection.appendChild(customInputDiv);
          container.appendChild(detailSection);
        }
    }
  }

  function createFactorTag(parent, factor, isChecked) {
    const label = document.createElement("label");
    label.className = "factor-item";
    if (typeof FACTOR_CATEGORY_COLOR !== "undefined") {
        label.style.background = FACTOR_CATEGORY_COLOR[factor.category] || "#eee";
    }

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = factor.id;
    cb.checked = isChecked;
    cb.onchange = updateView; // チェックを切り替えたら updateView だけを呼ぶ

    label.appendChild(cb);
    label.appendChild(document.createTextNode(" " + factor.label));
    parent.appendChild(label);
  }

  updateView(); // 最初の表示
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
  const selectedFactors = Array.from(document.querySelectorAll('#factorList input[type="checkbox"]:checked')).map(cb => cb.value);

  // 2. 自由入力のテキストボックスがあれば、その中身も取得して追加
  const customText = document.getElementById("custom_out_text")?.value;
  if (customText && customText.trim() !== "") {
    selectedFactors.push("自由入力:" + customText);
  }

  // 3. 天気情報の取得（既存のロジック）
  const wc = getFromStorage("weather_cache_" + pageTargetDate) || {};

  // 4. 送信データの作成
  const data = {
    date:            pageTargetDate,
    attendance:      document.getElementById("attendance") ? document.getElementById("attendance").value : "",
    weather:         wc.weather || "",
    temp:            wc.temp || "",
    pressure:        wc.pressure || "",
    pressureWarning: wc.pressureWarning || "",
    condition:       getScore("condition"),
    energy:          getScore("energy"),
    mental:          getScore("mental"),
    factors:         selectedFactors, // ここにまとめたリストを渡す
    comment:         document.getElementById("comment").value
  };

  // --- 以下、データの保存と送信処理（既存のまま） ---
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
    .then(result => {
      alert("記録を保存しました！"); // 成功がわかるように追加
      console.log("GAS送信完了:", result);
    })
    .catch(e => console.warn("GAS送信エラー:", e));
  }
}