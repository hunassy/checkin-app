// ============================================
// 初期設定画面（settings.html）のロジック
// ============================================

let goodSigns = [];
let badSigns = [];
let sleepTypes = [
  "気持ちよく寝られた",
  "寝付きは悪いがすっきり寝られた",
  "すぐに寝付けたが朝起きるのがしんどかった",
  "なかなか寝付けず、起きるのもしんどかった",
  "布団には入ったが、ほぼ寝てない"
];
let medicines = [];

/**
 * Goodサインを追加
 */
function addGood() {
  const text = document.getElementById("goodInput").value;
  
  if (!text) return;
  
  goodSigns.push(text);
  renderGood();
  document.getElementById("goodInput").value = "";
}

/**
 * Goodサインを表示
 */
function renderGood() {
  const list = document.getElementById("goodList");
  list.innerHTML = "";
  
  goodSigns.forEach((sign, index) => {
    const div = document.createElement("div");
    
    const text = document.createElement("span");
    text.textContent = sign;
    
    const btn = document.createElement("button");
    btn.textContent = "削除";
    btn.onclick = function() {
      goodSigns.splice(index, 1);
      renderGood();
    };
    
    div.appendChild(text);
    div.appendChild(btn);
    list.appendChild(div);
  });
}

/**
 * Badサインを追加
 */
function addBad() {
  const text = document.getElementById("badInput").value;
  
  if (!text) return;
  
  badSigns.push(text);
  renderBad();
  document.getElementById("badInput").value = "";
}

/**
 * Badサインを表示
 */
function renderBad() {
  const list = document.getElementById("badList");
  list.innerHTML = "";
  
  badSigns.forEach((sign, index) => {
    const div = document.createElement("div");
    
    const text = document.createElement("span");
    text.textContent = sign;
    
    const btn = document.createElement("button");
    btn.textContent = "削除";
    btn.onclick = function() {
      badSigns.splice(index, 1);
      renderBad();
    };
    
    div.appendChild(text);
    div.appendChild(btn);
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
  renderMedicine();
  document.getElementById("medicineInput").value = "";
}

/**
 * 薬を表示
 */
function renderMedicine() {
  const list = document.getElementById("medicineList");
  list.innerHTML = "";
  
  medicines.forEach((medicine, index) => {
    const div = document.createElement("div");
    
    const text = document.createElement("span");
    text.textContent = medicine;
    
    const btn = document.createElement("button");
    btn.textContent = "削除";
    btn.onclick = function() {
      medicines.splice(index, 1);
      renderMedicine();
    };
    
    div.appendChild(text);
    div.appendChild(btn);
    list.appendChild(div);
  });
}

/**
 * 睡眠タイプエディタを表示
 */
function renderSleepTypeEditor() {
  const editor = document.getElementById("sleepTypeEditor");
  editor.innerHTML = "";
  
  sleepTypes.forEach((type, index) => {
    const item = document.createElement("div");
    item.className = "sleep-type-item";
    
    const label = document.createElement("div");
    label.className = "sleep-type-label";
    label.textContent = (index + 1);
    
    const input = document.createElement("input");
    input.type = "text";
    input.value = type;
    input.id = `sleepType_${index}`;
    
    item.appendChild(label);
    item.appendChild(input);
    editor.appendChild(item);
  });
}

/**
 * 睡眠タイプを更新
 */
function updateSleepTypes() {
  sleepTypes = [];
  for (let i = 0; i < 5; i++) {
    const input = document.getElementById(`sleepType_${i}`);
    if (input) {
      sleepTypes.push(input.value);
    }
  }
}

/**
 * 設定を保存
 */
function saveSettings() {
  const zipcode = document.getElementById("zipcode").value;
  
  updateSleepTypes();
  
  localStorage.setItem("zipcode", zipcode);
  localStorage.setItem("goodSigns", JSON.stringify(goodSigns));
  localStorage.setItem("badSigns", JSON.stringify(badSigns));
  localStorage.setItem("sleepTypes", JSON.stringify(sleepTypes));
  localStorage.setItem("medicines", JSON.stringify(medicines));
  
  alert("保存しました");
  window.location.href = "index.html";
}

/**
 * ページ読み込み時に保存されたデータを復元
 */
window.onload = function() {
  const savedZip = localStorage.getItem("zipcode");
  const savedGood = localStorage.getItem("goodSigns");
  const savedBad = localStorage.getItem("badSigns");
  const savedSleepTypes = localStorage.getItem("sleepTypes");
  const savedMedicines = localStorage.getItem("medicines");
  
  if (savedZip) {
    document.getElementById("zipcode").value = savedZip;
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
  }
  
  if (savedMedicines) {
    medicines = JSON.parse(savedMedicines);
    renderMedicine();
  }
  
  renderSleepTypeEditor();
};