// ============================================
// メイン画面（index.html）のロジック
// ============================================

/**
 * 時間選択肢を生成
 */
function generateTimeOptions() {
  const bedtimeHourSelect = document.getElementById("bedtimeHour");
  const wakeuptimeHourSelect = document.getElementById("wakeuptimeHour");
  
  // 時間の選択肢を生成（0～23）
  for (let hour = 0; hour < 24; hour++) {
    const option1 = document.createElement("option");
    option1.value = String(hour);
    option1.textContent = `${String(hour).padStart(2, '0')}時`;
    bedtimeHourSelect.appendChild(option1);
    
    const option2 = document.createElement("option");
    option2.value = String(hour);
    option2.textContent = `${String(hour).padStart(2, '0')}時`;
    wakeuptimeHourSelect.appendChild(option2);
  }
}

/**
 * 本日の日付を表示
 */
function displayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const date = String(today.getDate()).padStart(2, '0');
  
  document.getElementById("dateSection").textContent = `本日の日付：${year}年${month}月${date}日`;
}

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
    label.className = "good-bad-item"; // label自体をgood-bad-itemにする
    label.style.display = "flex";
    label.style.alignItems = "center";
    label.style.margin = "0";
    
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = "good";
    const textContent = typeof sign === 'object' ? sign.text : sign;
    checkbox.value = textContent;

    const textSpan = document.createElement("span");
    textSpan.textContent = textContent;

    label.appendChild(checkbox);
    label.appendChild(textSpan);
    
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
    label.className = "good-bad-item"; // label自体をgood-bad-itemにする
    label.style.display = "flex";
    label.style.alignItems = "center";
    label.style.margin = "0";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = "bad";
    const textContent = typeof sign === 'object' ? sign.text : sign;
    checkbox.value = textContent;

    const textSpan = document.createElement("span");
    textSpan.textContent = textContent;

    label.appendChild(checkbox);
    label.appendChild(textSpan);
    
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
    const div = document.createElement("div");
    div.className = "good-bad-item";
    
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = "bad";
    const text = typeof sign === 'object' ? sign.text : sign;
    checkbox.value = text;
    
    const label = document.createElement("label");
    label.style.display = "flex";
    label.style.alignItems = "center";
    label.style.margin = "0";
    label.style.width = "100%";
    
    label.appendChild(checkbox);
    label.append(text);
    
    div.appendChild(label);
    container.appendChild(div);
  });
}

/**
 * 薬を読み込んで表示
 */
function loadMedicines() {
  const savedMedicines = localStorage.getItem("medicines");
  
  if (!savedMedicines) return;
  
  const medicines = JSON.parse(savedMedicines);
  const container = document.getElementById("medicineList");
  
  container.innerHTML = "";
  
  medicines.forEach(medicine => {
    const label = document.createElement("label");
    label.className = "medicine-item-label";
    
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = "medicine";
    checkbox.value = medicine;
    
    label.appendChild(checkbox);
    label.append(" " + medicine);
    
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
      
      // 完了時に緑色で色付け
      updateCompletionStatus();
    };
    
    container.appendChild(btn);
  }
}

/**
 * 睡眠タイプボタンを生成（テキスト表示版 + 〇△×）
 */
function createSleepTypeButtons() {
  const savedSleepTypes = localStorage.getItem("sleepTypes");
  const savedSleepSymbols = localStorage.getItem("sleepSymbols");
  
  const sleepTypes = savedSleepTypes ? JSON.parse(savedSleepTypes) : [];
  
  const sleepSymbols = savedSleepSymbols ? JSON.parse(savedSleepSymbols) : ["◎", "〇", "△", "✕", "✕"];
  
  const container = document.getElementById("sleepType");
  container.innerHTML = "";
  
  sleepTypes.forEach((type, index) => {
    const btn = document.createElement("button");
    btn.className = "sleep-type-btn";
    btn.dataset.index = index;
    btn.dataset.value = type;
    
    const textSpan = document.createElement("span");
    textSpan.className = "sleep-type-text";
    textSpan.textContent = type;
    
    const symbolSpan = document.createElement("span");
    const symbol = sleepSymbols[index] || "〇";
    let symbolClass = "";
    if (symbol === "◎") symbolClass = "symbol-double-circle";
    else if (symbol === "〇") symbolClass = "symbol-circle";
    else if (symbol === "△") symbolClass = "symbol-triangle";
    else if (symbol === "✕") symbolClass = "symbol-cross";
    
    symbolSpan.className = `sleep-type-symbol ${symbolClass}`;
    symbolSpan.textContent = symbol;
    
    btn.appendChild(symbolSpan);
    btn.appendChild(textSpan);
    
    btn.onclick = () => {
      container.querySelectorAll("button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      // 完了時に緑色で色付け
      updateCompletionStatus();
    };
    
    container.appendChild(btn);
  });
}

/**
 * 睡眠時間を計算して表示
 */
function calculateSleepTime() {
  const bedtimeHour = document.getElementById("bedtimeHour").value;
  const bedtimeMinute = document.getElementById("bedtimeMinute").value;
  const wakeuptimeHour = document.getElementById("wakeuptimeHour").value;
  const wakeuptimeMinute = document.getElementById("wakeuptimeMinute").value;
  
  let wakeupDuration = document.getElementById("wakeupDuration").value;
  // 数値に変換、NaNの場合は0に
  wakeupDuration = isNaN(parseInt(wakeupDuration)) ? 0 : parseInt(wakeupDuration);
  
  if (!bedtimeHour || bedtimeMinute === "" || !wakeuptimeHour || wakeuptimeMinute === "") {
    document.getElementById("sleepResult").textContent = "総睡眠時間：就寝・起床時刻を入力してください";
    return;
  }
  
  // 時刻を分に変換
  let bedMinutes = parseInt(bedtimeHour) * 60 + parseInt(bedtimeMinute);
  let wakeMinutes = parseInt(wakeuptimeHour) * 60 + parseInt(wakeuptimeMinute);
  
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
  
  // 完了時に緑色で色付け
  updateCompletionStatus();
}

/**
 * 完了状況を更新（緑色で色付け）
 */
function updateCompletionStatus() {
  const attendance = document.getElementById("attendance").value;
  const breakfast = document.getElementById("breakfast").value;
  const sleepType = document.querySelector(".sleep-type-btn.active");
  const condition = document.querySelector("#condition .active");
  const energy = document.querySelector("#energy .active");
  const mental = document.querySelector("#mental .active");
  
  // 通所/在宅・朝食セクション
  const attendanceSection = document.querySelector(".attendance-breakfast");
  if (attendance && breakfast) {
    attendanceSection.classList.add("completed");
  } else {
    attendanceSection.classList.remove("completed");
  }
  
  // 睡眠セクション
  const sleepSection = document.querySelector(".sleep-section");
  const bedtimeHour = document.getElementById("bedtimeHour").value;
  const bedtimeMinute = document.getElementById("bedtimeMinute").value;
  const wakeuptimeHour = document.getElementById("wakeuptimeHour").value;
  const wakeuptimeMinute = document.getElementById("wakeuptimeMinute").value;
  
  if (sleepType && bedtimeHour && bedtimeMinute !== "" && wakeuptimeHour && wakeuptimeMinute !== "") {
    sleepSection.classList.add("completed");
  } else {
    sleepSection.classList.remove("completed");
  }
  
  // スコアセクション
  const scoreCondition = document.querySelector(".score-section:nth-of-type(1)");
  const scoreEnergy = document.querySelector(".score-section:nth-of-type(2)");
  const scoreMental = document.querySelector(".score-section:nth-of-type(3)");
  
  if (condition) scoreCondition.classList.add("completed");
  else scoreCondition.classList.remove("completed");
  
  if (energy) scoreEnergy.classList.add("completed");
  else scoreEnergy.classList.remove("completed");
  
  if (mental) scoreMental.classList.add("completed");
  else scoreMental.classList.remove("completed");
}

/**
 * 天気を自動取得async function getWeather() {
  const zipcode = localStorage.getItem("zipcode");
  
  if (!zipcode) {
    document.getElementById("weatherValue").innerText = "未設定";
    document.getElementById("tempValue").innerText = "-";
    document.getElementById("pressureValue").innerText = "-";
    document.getElementById("pressureWarning").innerText = "-";
    return;
  }
  
  try {
    const addressData = await getCityFromZipcode(zipcode);
    // 天気取得には市区町村名(cityOnly)を使用し、表示にはフル住所(fullAddress)を使用
    const weatherData = await getWeatherFromCity(addressData.cityOnly, addressData.fullAddress);
    
    // 天気情報を表示
    document.getElementById("weatherValue").innerText = weatherData.weather;
    document.getElementById("tempValue").innerText = `${weatherData.temp}℃`;
    document.getElementById("pressureValue").innerText = `${weatherData.pressure}hPa`;
    
    // 気圧注意度を計算・表示
    const warning = calculatePressureWarning(weatherData.pressure);
    document.getElementById("pressureWarning").innerText = warning;
    
    // 住所を表示（栃木県宇都宮市など）
    document.getElementById("cityValue").innerText = addressData.fullAddress;
  } catch (error) {
    console.error("天気取得エラー:", error);
    document.getElementById("weatherValue").innerText = "取得失敗";
  }
}essureWarning = warning;
    
  } catch (error) {
    document.getElementById("weatherValue").innerText = "取得失敗";
    document.getElementById("tempValue").innerText = "-";
    document.getElementById("pressureValue").innerText = "-";
    document.getElementById("pressureWarning").innerText = "-";
    console.error(error);
  }
}

/**
 * データを送信
 */
function sendData() {
  const date = new Date();
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  
  const weather = window.currentWeather || "";
  const temp = window.currentTemp || "";
  const pressure = window.currentPressure || "";
  const pressureWarning = window.currentPressureWarning || "";
  
  const attendance = document.getElementById("attendance").value || "";
  const breakfast = document.getElementById("breakfast").value || "";
  
  // 睡眠データ
  const sleepType = document.querySelector(".sleep-type-btn.active")?.dataset.value || "";
  const bedtimeHour = document.getElementById("bedtimeHour").value || "";
  const bedtimeMinute = document.getElementById("bedtimeMinute").value || "";
  const bedtime = bedtimeHour && bedtimeMinute !== "" ? `${String(bedtimeHour).padStart(2, '0')}:${String(bedtimeMinute).padStart(2, '0')}` : "";
  
  const wakeuptimeHour = document.getElementById("wakeuptimeHour").value || "";
  const wakeuptimeMinute = document.getElementById("wakeuptimeMinute").value || "";
  const wakeuptime = wakeuptimeHour && wakeuptimeMinute !== "" ? `${String(wakeuptimeHour).padStart(2, '0')}:${String(wakeuptimeMinute).padStart(2, '0')}` : "";
  
  const wakeupDuration = document.getElementById("wakeupDuration").value || "0";
  const sleepTime = window.calculatedSleepTime || "";
  
  // 薬
  const medicines = getCheckedValues("medicine").join(",");
  
  const condition = document.querySelector("#condition .active")?.textContent || "";
  const energy = document.querySelector("#energy .active")?.textContent || "";
  const mental = document.querySelector("#mental .active")?.textContent || "";
  
  const comment = document.getElementById("comment").value;
  
  const good = getCheckedValues("good").join(",");
  const bad = getCheckedValues("bad").join(",");
  
  const data = {
    date: dateStr,
    weather,
    temp,
    pressure,
    pressureWarning,
    attendance,
    breakfast,
    sleepType,
    bedtime,
    wakeuptime,
    wakeupDuration,
    sleepTime,
    medicines,
    condition,
    energy,
    mental,
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
  generateTimeOptions();
  displayDate();
  loadGoodSigns();
  loadBadSigns();
  loadMedicines();
  createButtons("condition");
  createButtons("energy");
  createButtons("mental");
  createSleepTypeButtons();
  
  // 睡眠時間の計算を監視
  document.getElementById("bedtimeHour").addEventListener("change", calculateSleepTime);
  document.getElementById("bedtimeMinute").addEventListener("change", calculateSleepTime);
  document.getElementById("wakeuptimeHour").addEventListener("change", calculateSleepTime);
  document.getElementById("wakeuptimeMinute").addEventListener("change", calculateSleepTime);
  document.getElementById("wakeupDuration").addEventListener("change", calculateSleepTime);
  document.getElementById("wakeupDuration").addEventListener("input", calculateSleepTime);
  
  // 完了状況の監視
  document.getElementById("attendance").addEventListener("change", updateCompletionStatus);
  document.getElementById("breakfast").addEventListener("change", updateCompletionStatus);
  
  // ページ読み込み時に自動で天気を取得
  getWeather();
};

/**
 * 気圧注意度を計算
 * @param {number} pressure 気圧(hPa)
 * @returns {string} 注意度メッセージ
 */
function calculatePressureWarning(pressure) {
  if (pressure < 1000) {
    return "警戒（低気圧）";
  } else if (pressure < 1005) {
    return "注意";
  } else if (pressure > 1020) {
    return "注意（高気圧）";
  } else {
    return "通常";
  }
}