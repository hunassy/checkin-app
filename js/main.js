// ============================================
// メイン画面（index.html）のロジック
// ============================================

/**
 * Good/Badサインを読み込んで表示
 */
function loadGoodSigns() {
  const savedGood = localStorage.getItem("goodSigns");
  
  if (!savedGood) return;
  
  const goodSigns = JSON.parse(savedGood);
  const container = document.getElementById("goodList");
  
  container.innerHTML = "";
  
  goodSigns.forEach(sign => {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    
    checkbox.type = "checkbox";
    checkbox.name = "good";
    checkbox.value = sign;
    
    label.appendChild(checkbox);
    label.append(" " + sign);
    
    container.appendChild(label);
  });
}

function loadBadSigns() {
  const savedBad = localStorage.getItem("badSigns");
  
  if (!savedBad) return;
  
  const badSigns = JSON.parse(savedBad);
  const container = document.getElementById("badList");
  
  container.innerHTML = "";
  
  badSigns.forEach(sign => {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    
    checkbox.type = "checkbox";
    checkbox.name = "bad";
    checkbox.value = sign;
    
    label.appendChild(checkbox);
    label.append(" " + sign);
    
    container.appendChild(label);
  });
}

/**
 * 1〜9のボタンを生成
 */
function createButtons(id) {
  const container = document.getElementById(id);
  
  for (let i = 1; i <= 9; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    
    btn.onclick = () => {
      container.querySelectorAll("button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    };
    
    container.appendChild(btn);
  }
}

/**
 * 天気を自動取得
 */
async function getWeather() {
  const zipcode = localStorage.getItem("zipcode");
  
  if (!zipcode) {
    document.getElementById("weatherResult").innerText = "郵便番号が設定されていません。初期設定から設定してください。";
    document.getElementById("weatherResult").className = "weather error";
    return;
  }
  
  try {
    const weatherDiv = document.getElementById("weatherResult");
    weatherDiv.className = "weather loading";
    weatherDiv.innerText = "天気を取得中...";
    
    const city = await getCityFromZipcode(zipcode);
    const weatherData = await getWeatherFromCity(city);
    
    const weatherText = formatWeatherText(weatherData);
    
    document.getElementById("weatherResult").innerText = weatherText;
    document.getElementById("weatherResult").className = "weather success";
    
    // 天気情報をグローバル変数に保存（送信時に使用）
    window.currentWeather = weatherText;
    
  } catch (error) {
    document.getElementById("weatherResult").innerText = "天気取得に失敗しました";
    document.getElementById("weatherResult").className = "weather error";
    console.error(error);
  }
}

/**
 * データを送信
 */
function sendData() {
  const condition = document.querySelector("#condition .active")?.textContent || "";
  const energy = document.querySelector("#energy .active")?.textContent || "";
  const mental = document.querySelector("#mental .active")?.textContent || "";
  
  const weather = window.currentWeather || document.getElementById("weatherResult").innerText;
  
  const comment = document.getElementById("comment").value;
  
  const good = getCheckedValues("good").join(",");
  const bad = getCheckedValues("bad").join(",");
  
  const data = {
    condition,
    energy,
    mental,
    weather,
    good,
    bad,
    comment
  };
  
  const form = createFormForSubmit(data);
  submitForm(form);
  
  alert("送信しました");
  
  // 送信後、メインページに戻る
  setTimeout(() => {
    window.location.href = "https://hunassy.github.io/checkin-app/";
  }, 1000);
}

/**
 * ページ読み込み時の初期化
 */
window.onload = function() {
  loadGoodSigns();
  loadBadSigns();
  createButtons("condition");
  createButtons("energy");
  createButtons("mental");
  
  // ページ読み込み時に自動で天気を取得
  getWeather();
};