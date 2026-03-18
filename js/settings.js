// ============================================
// 設定画面（settings.html）のロジック
// ============================================

let goodSigns = [];
let badSigns = [];
let sleepTypes = [];
let sleepSymbols = [];

const gasUrl = APP_CONFIG.GAS_URL;
/**
 * 郵便番号から市町村を取得して表示
 */
function displayCity( ) {
  const zipcode = document.getElementById("zipcode").value;
  
  if (!zipcode || zipcode.length !== 7) {
    document.getElementById("cityDisplay").textContent = "未設定";
    return;
  }
  
  getCityFromZipcode(zipcode).then(addressData => {
    if (addressData && addressData.fullAddress) {
      document.getElementById("cityDisplay").textContent = addressData.fullAddress;
    } else {
      document.getElementById("cityDisplay").textContent = "見つかりません";
    }
  }).catch(error => {
    console.error("市町村取得エラー:", error);
    document.getElementById("cityDisplay").textContent = "取得エラー";
  });
}

/**
 * Goodサインを追加
 */
function addGood() {
  const text = document.getElementById("goodInput").value;
  
  if (!text) return;
  if (goodSigns.length >= 10) {
    alert("Goodサインは10個までしか登録できません");
    return;
  }
  
  goodSigns.push(text);
  renderGood();
  document.getElementById("goodInput").value = "";
}

/**
 * Goodサインをレンダリング
 */
function renderGood() {
  const list = document.getElementById("goodList");
  list.innerHTML = "";
  
  goodSigns.forEach((sign, index) => {
    const div = document.createElement("div");
    div.className = "item-row";
    
    const text = document.createElement("span");
    text.className = "item-text";
    text.textContent = sign;
    
    const buttons = document.createElement("div");
    buttons.className = "item-buttons";
    
    const btn = document.createElement("button");
    btn.textContent = "削除";
    btn.onclick = function() {
      goodSigns.splice(index, 1);
      renderGood();
    };
    
    buttons.appendChild(btn);
    div.appendChild(text);
    div.appendChild(buttons);
    list.appendChild(div);
  });
}

/**
 * Badサインを追加
 */
function addBad() {
  const text = document.getElementById("badInput").value;
  
  if (!text) return;
  if (badSigns.length >= 10) {
    alert("Badサインは10個までしか登録できません");
    return;
  }
  
  badSigns.push(text);
  renderBad();
  document.getElementById("badInput").value = "";
}

/**
 * Badサインをレンダリング
 */
function renderBad() {
  const list = document.getElementById("badList");
  list.innerHTML = "";
  
  badSigns.forEach((sign, index) => {
    const div = document.createElement("div");
    div.className = "item-row";
    
    const text = document.createElement("span");
    text.className = "item-text";
    text.textContent = sign;
    
    const buttons = document.createElement("div");
    buttons.className = "item-buttons";
    
    const btn = document.createElement("button");
    btn.textContent = "削除";
    btn.onclick = function() {
      badSigns.splice(index, 1);
      renderBad();
    };
    
    buttons.appendChild(btn);
    div.appendChild(text);
    div.appendChild(buttons);
    list.appendChild(div);
  });
}

/**
 * 睡眠タイプを編集
 */
function renderSleepTypeEditor() {
  const editor = document.getElementById("sleepTypeEditor");
  editor.innerHTML = "";
  
  sleepTypes.forEach((type, index) => {
    const item = document.createElement("div");
    item.className = "sleep-type-item";
    
    const label = document.createElement("div");
    label.className = "sleep-type-label";
    label.textContent = `${index + 1}`;
    
    const input = document.createElement("input");
    input.className = "sleep-type-input";
    input.type = "text";
    input.value = type;
    input.onchange = function() {
      sleepTypes[index] = input.value;
    };
    
    const symbolDiv = document.createElement("div");
    symbolDiv.className = "sleep-type-symbol";
    
    const select = document.createElement("select");
    const options = ["◎", "〇", "△", "✕"];
    
    options.forEach(opt => {
      const option = document.createElement("option");
      option.value = opt;
      option.textContent = opt;
      if (opt === sleepSymbols[index]) {
        option.selected = true;
      }
      select.appendChild(option);
    });
    
    const updateSelectClass = (sel) => {
      sel.classList.remove("symbol-double-circle", "symbol-circle", "symbol-triangle", "symbol-cross");
      if (sel.value === "◎") sel.classList.add("symbol-double-circle");
      else if (sel.value === "〇") sel.classList.add("symbol-circle");
      else if (sel.value === "△") sel.classList.add("symbol-triangle");
      else if (sel.value === "✕") sel.classList.add("symbol-cross");
    };

    select.onchange = function() {
      sleepSymbols[index] = select.value;
      updateSelectClass(select);
    };
    
    updateSelectClass(select);
    
    symbolDiv.appendChild(select);
    
    item.appendChild(label);
    item.appendChild(symbolDiv);
    item.appendChild(input);
    editor.appendChild(item);
  });
}

/**
 * 設定を保存
 */
function saveSettings() {
  const zipcode = document.getElementById("zipcode").value;

  // ローカルに保存
  localStorage.setItem("zipcode", zipcode);
  localStorage.setItem("goodSigns", JSON.stringify(goodSigns));
  localStorage.setItem("badSigns", JSON.stringify(badSigns));
  localStorage.setItem("sleepTypes", JSON.stringify(sleepTypes));
  localStorage.setItem("sleepSymbols", JSON.stringify(sleepSymbols));

  // GASにも設定を同期保存
  const params = new URLSearchParams();
  params.append("recordType", "settings"); // doPostで分岐させるためのキー
  params.append("zipcode", zipcode);
  params.append("goodSigns", JSON.stringify(goodSigns));
  params.append("badSigns", JSON.stringify(badSigns));
  params.append("sleepTypes", JSON.stringify(sleepTypes));
  params.append("sleepSymbols", JSON.stringify(sleepSymbols));

  fetch(gasUrl, { 
    method: "POST", 
    body: params,
  })
  .then(response => response.json())
  .then(data => {
      if(data.status === 'ok'){
          alert("保存しました");
          window.location.href = "index.html";
      } else {
          throw new Error(data.message || '設定の保存に失敗しました。');
      }
  })
  .catch(err => {
      console.error("設定のGAS保存失敗:", err);
      alert("サーバーへの設定保存に失敗しました。\nネットワーク接続を確認してください。");
  });
}

/**
 * ページ読み込み時の初期化
 */
window.onload = function() {
  const savedZip = localStorage.getItem("zipcode");
  const savedGood = localStorage.getItem("goodSigns");
  const savedBad = localStorage.getItem("badSigns");
  const savedSleepTypes = localStorage.getItem("sleepTypes");
  const savedSleepSymbols = localStorage.getItem("sleepSymbols");
  
  if (savedZip) {
    document.getElementById("zipcode").value = savedZip;
    displayCity();
  }
  
  if (savedGood) {
    goodSigns = JSON.parse(savedGood);
    renderGood();
  }
  
  if (savedBad) {
    badSigns = JSON.parse(savedBad);
    renderBad();
  }
  
  if (savedSleepTypes) {
    sleepTypes = JSON.parse(savedSleepTypes);
  } else {
    sleepTypes = ["よく眠れた", "まあまあ眠れた", "そこそこ眠れた", "何とか眠れた", "眠れなかった"];
  }
  
  if (savedSleepSymbols) {
    sleepSymbols = JSON.parse(savedSleepSymbols);
  } else {
    sleepSymbols = ["◎", "〇", "△", "△", "✕"];
  }
  
  renderSleepTypeEditor();
};
