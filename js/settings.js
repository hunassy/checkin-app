// ============================================
// 設定画面（settings.html）のロジック
// ============================================

let goodSigns = [];
let badSigns = [];
let medicines = [];
let sleepTypes = [];
let sleepSymbols = [];

/**
 * 郵便番号から市町村を取得して表示
 */
function displayCity() {
  const zipcode = document.getElementById("zipcode").value;
  
  if (!zipcode || zipcode.length !== 7) {
    document.getElementById("cityDisplay").textContent = "未設定";
    return;
  }
  
    // 郵便番号から市町村を取得
  getCityFromZipcode(zipcode).then(addressData => {
    if (addressData && addressData.fullAddress) {
      // city ではなく addressData.fullAddress を表示するように変更
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
 * 薬を追加
 */
function addMedicine() {
  const text = document.getElementById("medicineInput").value;
  
  if (!text) return;
  
  medicines.push(text);
  renderMedicineEditor();
  document.getElementById("medicineInput").value = "";
}

/**
 * 薬をレンダリング
 */
function renderMedicineEditor() {
  const list = document.getElementById("medicineList");
  list.innerHTML = "";
  
  medicines.forEach((medicine, index) => {
    const div = document.createElement("div");
    div.className = "item-row";
    
    const text = document.createElement("span");
    text.className = "item-text";
    text.textContent = medicine;
    
    const buttons = document.createElement("div");
    buttons.className = "item-buttons";
    
    const btn = document.createElement("button");
    btn.textContent = "削除";
    btn.onclick = function() {
      medicines.splice(index, 1);
      renderMedicineEditor();
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
    
    // 記号に応じたクラスを適用する関数
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
    
    // 初期表示時にもクラスを適用
    updateSelectClass(select);
    
    symbolDiv.appendChild(select);
    
    item.appendChild(label);
    item.appendChild(symbolDiv); // 記号を左側に
    item.appendChild(input);     // テキストを右側に
    editor.appendChild(item);
  });
}

/**
 * 設定を保存
 */
function saveSettings() {
  const zipcode = document.getElementById("zipcode").value;
  
  localStorage.setItem("zipcode", zipcode);
  localStorage.setItem("goodSigns", JSON.stringify(goodSigns));
  localStorage.setItem("badSigns", JSON.stringify(badSigns));
  localStorage.setItem("medicines", JSON.stringify(medicines));
  localStorage.setItem("sleepTypes", JSON.stringify(sleepTypes));
  localStorage.setItem("sleepSymbols", JSON.stringify(sleepSymbols));
  
  alert("保存しました");
  window.location.href = "index.html";
}

/**
 * ページ読み込み時の初期化
 */
window.onload = function() {
  const savedZip = localStorage.getItem("zipcode");
  const savedGood = localStorage.getItem("goodSigns");
  const savedBad = localStorage.getItem("badSigns");
  const savedMedicines = localStorage.getItem("medicines");
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
  
  if (savedMedicines) {
    medicines = JSON.parse(savedMedicines);
    renderMedicineEditor();
  }
  
    // 1. 睡眠タイプのテキストを読み込む
  if (savedSleepTypes) {
    sleepTypes = JSON.parse(savedSleepTypes);
  } else {
    // 【追加】保存データがない場合、デフォルト値をセットする
    sleepTypes = ["よく眠れた", "まあまあ眠れた", "そこそこ眠れた", "何とか眠れた", "眠れなかった"];
  }
  
  // 2. 睡眠タイプの記号を読み込む
  if (savedSleepSymbols) {
    sleepSymbols = JSON.parse(savedSleepSymbols);
  } else {
    // 【追加】保存データがない場合、デフォルトの記号をセットする
    sleepSymbols = ["◎", "〇", "△", "△", "✕"];
  }
  
  // 最後に表示を実行
  renderSleepTypeEditor();

};