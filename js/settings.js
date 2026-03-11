// ============================================
// 初期設定画面（settings.html）のロジック
// ============================================

let goodSigns = [];
let badSigns = [];

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
 * 設定を保存
 */
function saveSettings() {
  const zipcode = document.getElementById("zipcode").value;
  
  localStorage.setItem("zipcode", zipcode);
  localStorage.setItem("goodSigns", JSON.stringify(goodSigns));
  localStorage.setItem("badSigns", JSON.stringify(badSigns));
  
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
};