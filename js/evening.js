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

  if (typeof fetchWeather === "function"){
    console.log("夜：天気取得開始");
    fetchWeather();
  } 
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
    const selectedIds = Array.from(container.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
    const socialValue = document.getElementById("select_social")?.value || "";
    const locationValue = document.getElementById("select_location")?.value || "";
    const customText = document.getElementById("custom_out_text")?.value || "";

    container.innerHTML = ""; 

    // 1. プルダウン作成
    const createSelect = (id, label, options, currentValue) => {
      const wrapper = document.createElement("div");
      wrapper.style.marginBottom = "15px";
      const p = document.createElement("p");
      p.style = "font-size:14px; font-weight:bold; margin-bottom:8px;";
      p.textContent = label;
      const select = document.createElement("select");
      select.id = id;
      select.style = "width:100%; padding:12px; border:1px solid #ccc; border-radius:8px; font-size:16px;";
      select.onchange = updateView;

      const defOpt = document.createElement("option");
      defOpt.value = ""; defOpt.textContent = "選択してください";
      select.appendChild(defOpt);

      options.forEach(opt => {
        const o = document.createElement("option");
        o.value = opt.id; o.textContent = opt.label;
        if (opt.id === currentValue) o.selected = true;
        select.appendChild(o);
      });
      wrapper.appendChild(p); wrapper.appendChild(select);
      container.appendChild(wrapper);
    };

    createSelect("select_social", "どのように過ごしましたか？", FACTOR_STEPS.social, socialValue);
    createSelect("select_location", "外出しましたか？", FACTOR_STEPS.location, locationValue);

    // 2. 詳細エリア
    if (locationValue === "out" || locationValue === "home") {
      const detailSection = document.createElement("div");
      detailSection.id = "factorsSection";
      detailSection.style = "margin-top:10px; padding:15px; background:#f9f9f9; border-radius:10px; border:1px solid #eee;";

      if (locationValue === "out") {
        const outGrid = document.createElement("div");
        outGrid.className = "detail-grid";
        FACTOR_STEPS.outDetails.forEach(f => createFactorTag(outGrid, f, selectedIds.includes(f.id)));
        detailSection.appendChild(outGrid);

        // --- ここで自由記述ボックスを復活 ---
        const customInputDiv = document.createElement("div");
        customInputDiv.style.marginTop = "15px";
        customInputDiv.innerHTML = `
          <p style="font-size:12px; color:#666; margin-bottom:4px;">その他の外出内容</p>
          <input type="text" id="custom_out_text" value="${customText}" placeholder="例：カフェ" 
                 style="width:100%; padding:10px; border:1px solid #ddd; border-radius:4px; box-sizing:border-box;">
        `;
        detailSection.appendChild(customInputDiv);
      }

      // 共通項目
      const commonTitle = document.createElement("p");
      commonTitle.style = "font-size:12px; color:#666; margin:15px 0 8px;";
      commonTitle.textContent = "共通の項目";
      detailSection.appendChild(commonTitle);

      const commonGrid = document.createElement("div");
      commonGrid.className = "detail-grid";
      FACTOR_STEPS.commonDetails.forEach(f => createFactorTag(commonGrid, f, selectedIds.includes(f.id)));
      detailSection.appendChild(commonGrid);

      container.appendChild(detailSection);
    
      renderMealSelector();
    }else {
      // 場所が選ばれていない時は、食事ボタンがあれば消す
      const old = document.getElementById("mealContainerBox");
      if (old) old.remove();
    }
  }

  function createFactorTag(parent, f, isChecked) {
    const label = document.createElement("label");
    label.className = "factor-item";
    if (typeof FACTOR_CATEGORY_COLOR !== "undefined") {
      label.style.background = FACTOR_CATEGORY_COLOR[f.category] || "#eee";
    }
    const cb = document.createElement("input");
    cb.type = "checkbox"; cb.value = f.id; cb.checked = isChecked;
    cb.onchange = updateView;
    label.appendChild(cb);
    label.appendChild(document.createTextNode(" " + f.label));
    parent.appendChild(label);
  }

 // --- 食事セレクター（クリック判定を強化した修正版） ---
  function renderMealSelector() {
    const old = document.getElementById("mealContainerBox");
    if (old) old.remove();

    const mealContainer = document.createElement("div");
    mealContainer.id = "mealContainerBox";
    
    // スタイル：干渉を防ぐ設定
    mealContainer.style.clear = "both"; 
    mealContainer.style.display = "block";
    mealContainer.style.width = "100%";
    mealContainer.style.marginTop = "20px";
    mealContainer.style.position = "relative";
    mealContainer.style.zIndex = "1000"; 
    
    mealContainer.innerHTML = `
      <label style="display:block; font-size:14px; font-weight:bold; margin-bottom:12px; color:#333;">🍴 食事回数</label>
      <div id="mealBtnGroup" style="display: flex; gap: 8px; width: 100%; max-width: 400px; box-sizing: border-box;">
        ${[0, 1, 2, 3].map(n => `
          <div style="flex: 1;">
            <input type="radio" name="meal_count" id="meal_radio_${n}" value="meal_${n}" ${n === 3 ? "checked" : ""} style="display:none;">
            <label for="meal_radio_${n}" class="meal-btn" data-val="${n}" style="
              display: flex;
              align-items: center;
              justify-content: center;
              width: 100%;
              height: 45px;
              border: 1px solid #ddd;
              border-radius: 8px;
              text-align: center;
              font-size: 14px;
              background: white;
              cursor: pointer;
              box-sizing: border-box;
              white-space: nowrap;
              transition: all 0.2s;
            ">${n === 0 ? "抜き" : n + "食"}</label>
          </div>
        `).join("")}
      </div>
    `;

    // 白いボックス（factorsSection）の末尾に追加
    const factorsSection = document.getElementById("factorsSection");
    if (factorsSection) {
      factorsSection.appendChild(mealContainer);

      // --- 重要：クリックイベントをJavaScriptで直接制御する ---
      const buttons = mealContainer.querySelectorAll('.meal-btn');
      buttons.forEach(btn => {
        // PC版のクリック判定漏れを防ぐために明示的にイベントを追加
        btn.onclick = function(e) {
           // すべてのボタンの色をリセット
           buttons.forEach(b => {
              b.style.background = "white";
              b.style.borderColor = "#ddd";
              b.style.color = "#333";
            });
            // クリックされたボタンを青くする
            this.style.background = "#e3f2fd";
            this.style.borderColor = "#2196f3";
            this.style.color = "#1976d2";
                
            // 対応する隠しラジオボタンをチェック状態にする
            const radioId = this.getAttribute('for');
            const radio = document.getElementById(radioId);
            if (radio) radio.checked = true;
          };
      });

      // 初期状態で「3食」を青くしておく
      const defaultBtn = mealContainer.querySelector('[for="meal_radio_3"]');
      if (defaultBtn) defaultBtn.click();
    }
  }
  updateView();
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
  const customTextEl = document.getElementById("custom_out_text");
  if (customTextEl && customTextEl.value.trim() !== "") {
    selectedFactors.push("自由入力:" + customTextEl.value);
  }

  // ★食事回数のラジオボタンの値も取得して追加
  const selectedMeal = document.querySelector('input[name="meal_count"]:checked');
   if (selectedMeal) {
    selectedFactors.push(selectedMeal.value); // "meal_3" などが配列に入る
  }

  // 3. 天気情報の取得（既存のロジック）
  const wc = getFromStorage("weather_cache_" + pageTargetDate) || {};

  // 4. 送信データの作成
  const data = {
    recordType: "evening",

    date:            pageTargetDate,
    attendance:      document.getElementById("attendance") ? document.getElementById("attendance").value : "",
    weather:         weatherCache.weather || wc.weather || "",
    temp:            weatherCache.temp || wc.temp || "",
    pressure:        weatherCache.pressure || wc.pressure || "",
    pressureWarning: weatherCache.pressureWarning || wc.pressureWarning || "",
    condition:       getScore("condition")??"",
    energy:          getScore("energy")??"",
    mental:          getScore("mental")??"",
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
      console.log("送信データ:", data);
      console.log("GAS送信完了:", result);

      // 朝ページへ移動
      window.location.href = "index.html";
    })
    .catch(e => console.warn("GAS送信エラー:", e));
  }
}