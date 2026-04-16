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
    // 現在の選択状態（チェックボックス分）を取得
    const selectedIds = Array.from(container.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
    
    // 現在のプルダウンの選択値を取得（再描画時に値を保持するため）
    const socialValue = document.getElementById("select_social")?.value || "";
    const locationValue = document.getElementById("select_location")?.value || "";
    const customText = document.getElementById("custom_out_text")?.value || "";

    container.innerHTML = ""; 

    // --- 1. プルダウンの作成 ---
    const createSelect = (id, label, options, currentValue) => {
      const wrapper = document.createElement("div");
      wrapper.style.marginBottom = "15px";
      wrapper.style.width = "100%"; // 親の幅いっぱいに広げる
      
      const p = document.createElement("p");
      p.style = "font-size:14px; font-weight:bold; color:#333; margin-bottom:8px;"; // ラベルを少し太く見やすく
      p.textContent = label;
      
      const select = document.createElement("select");
      select.id = id;
      // スタイルを強化：幅100%、高さをしっかり確保、背景色など
      select.style = `
        width: 100%; 
        padding: 12px; 
        border: 1px solid #ccc; 
        border-radius: 8px; 
        background-color: #fff; 
        font-size: 16px;
        display: block;
        appearance: none; /* ブラウザ標準の矢印をリセット（任意） */
        -webkit-appearance: none;
        background-image: url('data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>');
        background-repeat: no-repeat;
        background-position: right 12px center;
        background-size: 16px;
      `;
      select.onchange = updateView;

      const defOpt = document.createElement("option");
      defOpt.value = "";
      defOpt.textContent = "選択してください";
      select.appendChild(defOpt);

      options.forEach(opt => {
        const o = document.createElement("option");
        o.value = opt.id;
        o.textContent = opt.label;
        if (opt.id === currentValue) o.selected = true;
        select.appendChild(o);
      });

      wrapper.appendChild(p);
      wrapper.appendChild(select);
      container.appendChild(wrapper);
    };

    // 「誰と」プルダウン
    createSelect("select_social", "どのように過ごしましたか？", FACTOR_STEPS.social, socialValue);
    
    // 「場所」プルダウン
    createSelect("select_location", "外出しましたか？", FACTOR_STEPS.location, locationValue);

    // --- 2. 詳細エリア（場所が選ばれたら表示） ---
// ... (場所が選ばれた後の詳細表示エリア)
  if (locationValue === "out" || locationValue === "home") {
    const detailSection = document.createElement("div");
    detailSection.style = "margin-top:10px; padding:15px; background:#f9f9f9; border-radius:10px; border:1px solid #eee;";

    // --- 外出時詳細（買い物・通院など）を2列にする ---
   if (locationValue === "out") {
     const outGrid = document.createElement("div");
     outGrid.className = "detail-grid"; // CSSで定義した2列設定を適用
    
     FACTOR_STEPS.outDetails.forEach(factor => {
       createFactorTag(outGrid, factor, selectedIds.includes(factor.id));
     });
     detailSection.appendChild(outGrid);
    
     // 自由記述（これは1列でOK）
     const customInputDiv = document.createElement("div");
     customInputDiv.style.marginTop = "10px";
     customInputDiv.innerHTML = `<p style="font-size:12px; color:#666; margin-bottom:4px;">その他の外出内容</p><input type="text" id="custom_out_text" value="${customText}" placeholder="例：カフェ" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:4px; box-sizing:border-box;">`;
     detailSection.appendChild(customInputDiv);
   }

  // --- 共通項目（よく食べられた等）を2列にする ---
  const commonTitle = document.createElement("p");
  commonTitle.style = "font-size:12px; color:#666; margin:15px 0 8px;";
  commonTitle.textContent = "共通の項目";
  detailSection.appendChild(commonTitle);

  const commonGrid = document.createElement("div");
  commonGrid.className = "detail-grid"; // ここも2列設定を適用
  
  FACTOR_STEPS.commonDetails.forEach(factor => {
    createFactorTag(commonGrid, factor, selectedIds.includes(factor.id));
  });
  detailSection.appendChild(commonGrid);

  container.appendChild(detailSection);
  }
}

  // 縦並び専用のタグ作成関数
  function createVerticalTag(parent, factor, isChecked) {
    const label = document.createElement("label");
    label.className = "factor-item";
    
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = factor.id;
    cb.checked = isChecked;
    cb.onchange = updateView;

    const span = document.createElement("span");
    span.textContent = factor.label;

    label.appendChild(cb);
    label.appendChild(span);
    parent.appendChild(label);
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

  // プルダウンの選択値を取得
  const socialVal = document.getElementById("select_social")?.value;
  const locationVal = document.getElementById("select_location")?.value;
  if (socialVal) selectedFactors.push(socialVal);
  if (locationVal) selectedFactors.push(locationVal);

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