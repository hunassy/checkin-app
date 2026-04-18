// ============================================
// 天気データ（fetchWeather で取得後に保存）
// ============================================

let weatherCache = {
  weather: "",
  temp: "",
  pressure: "",
  pressureWarning: ""
};

// ============================================
// 天気情報の取得
// ============================================
async function fetchWeather() {
  const zipcode = localStorage.getItem("zipcode");
  if (!zipcode) return;

  try {
    const addressData = await getCityFromZipcode(zipcode);
    if (!addressData) return;

    const weatherData = await getWeatherFromCity(addressData.cityOnly, addressData.fullAddress);

    const el = v => document.getElementById(v);
    if (el("weatherValue"))  el("weatherValue").textContent  = weatherData.weather;
    if (el("tempValue"))     el("tempValue").textContent     = weatherData.temp + "℃";
    if (el("pressureValue")) el("pressureValue").textContent = weatherData.pressure + "hPa";

    // 気圧注意度
    let pressureWarningText = "";
    const pw = el("pressureWarning");
    if (pw) {
      if (weatherData.pressure < 1000) {
        pressureWarningText = "⚠️ 低気圧";
        pw.textContent = pressureWarningText;
        pw.style.color = "#d32f2f";
      } else if (weatherData.pressure > 1015) {
        pressureWarningText = "↑ 高め";
        pw.textContent = pressureWarningText;
        pw.style.color = "#f57c00";
      } else {
        pressureWarningText = "✓ 安定";
        pw.textContent = pressureWarningText;
        pw.style.color = "#388e3c";
      }
    }

    // グローバル変数に保存（送信時に使用）
    weatherCache.weather         = weatherData.weather;
    weatherCache.temp            = weatherData.temp;
    weatherCache.pressure        = weatherData.pressure;
    weatherCache.pressureWarning = pressureWarningText;

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;

    localStorage.setItem(
      "weather_cache_" + today, JSON.stringify(weatherCache)
    );
  } catch (e) {
    console.warn("天気取得失敗:", e);
  }
}