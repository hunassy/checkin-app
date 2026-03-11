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
 * 睡眠タイプボタンを生成（テキスト表示版）
 */
function createSleepTypeButtons() {
  const savedSleepTypes = localStorage.getItem("sleepTypes");
  const sleepTypes = savedSleepTypes ? JSON.parse(savedSleepTypes) : [
    "気持ちよく寝られた",
    "寝付きは悪いがすっきり寝られた",
    "すぐに寝付けたが朝起きるのがしんどかった",
    "なかなか寝付けず、起きるのもしんどかった",
    "布団には入ったが、ほぼ寝てない"
  ];
  
  const container = document.getElementById("sleepType");
  container.innerHTML = "";
  
  sleepTypes.forEach((type, index) => {
    const btn = document.createElement("button");
    btn.className = "sleep-type-btn";
    btn.textContent = type;
    btn.dataset.index = index;
    btn.dataset.value = type;
    
    btn.onclick = () => {
      container.querySelectorAll("button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    };
    
    container.appendChild(btn);
  });
}

/**
 * 睡眠時間を計算して表示
 */
function calculateSleepTime() {
  const bedtime = document.getElementById("bedtime").value;
  const wakeuptime = document.getElementById("wakeuptime").value;
  const wakeupDuration = parseInt(document.getElementById("wakeupDuration").value) || 0;
  
  if (!bedtime || !wakeuptime) {
    document.getElementById("sleepResult").textContent = "総睡眠時間：就寝・起床時刻を入力してください";
    return;
  }
  
  // 時刻を分に変換
  const [bedHour, bedMin] = bedtime.split(":").map(Number);
  const [wakeHour, wakeMin] = wakeuptime.split(":").map(Number);
  
  let bedMinutes = bedHour * 60 + bedMin;
  let wakeMinutes = wakeHour * 60 + wakeMin;
  
  // 起床時刻が就寝時刻より前の場合（翌日）
  if (wakeMinutes <= bedMinutes) {
    wakeMinutes += 24 * 60;
  }
  
  // 総睡眠時間を計算
  let totalSleep = wakeMinutes - bedMinutes - wakeupDuration;
  
  // 負の値の場合は0に
  if (totalSleep < 0) {
    totalSleep = 0;
  }
  
  // 時間と分に変換
  const hours = Math.floor(totalSleep / 60);
  const minutes = totalSleep % 60;
  
  // 表示
  const sleepText = minutes > 0 ? `${hours}時間${minutes}分` : `${hours}時間`;
  document.getElementById("sleepResult").textContent = `総睡眠時間：${sleepText}`;
  
  // グローバル変数に保存
  window.calculatedSleepTime = sleepText;
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
  
  // 睡眠データ
  const sleepType = document.querySelector(".sleep-type-btn.active")?.dataset.value || "";
  const bedtime = document.getElementById("bedtime").value || "";
  const wakeuptime = document.getElementById("wakeuptime").value || "";
  const wakeupDuration = document.getElementById("wakeupDuration").value || "0";
  const sleepTime = window.calculatedSleepTime || "";
  
  // 通所状況
  const attendance = document.getElementById("attendance").value || "";
  
  const comment = document.getElementById("comment").value;
  
  const good = getCheckedValues("good").join(",");
  const bad = getCheckedValues("bad").join(",");
  
  const data = {
    condition,
    energy,
    mental,
    weather,
    sleepType,
    bedtime,
    wakeuptime,
    wakeupDuration,
    sleepTime,
    attendance,
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
  createSleepTypeButtons();
  
  // 睡眠時間の計算を監視
  document.getElementById("bedtime").addEventListener("change", calculateSleepTime);
  document.getElementById("wakeuptime").addEventListener("change", calculateSleepTime);
  document.getElementById("wakeupDuration").addEventListener("change", calculateSleepTime);
  
  // ページ読み込み時に自動で天気を取得
  getWeather();
};