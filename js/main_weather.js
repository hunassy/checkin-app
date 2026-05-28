// ============================================
// main_weather.js — 天気情報の取得・表示
// ============================================

// DATA: 天気キャッシュ
let weatherCache = {
  weather: "",
  temp: "",
  pressure: "",
  pressureWarning: ""
};

// LOGIC: 気圧から警告テキストを返す
function getPressureWarning(pressure) {
  if (pressure < 1000) return { text: "⚠️ 低気圧", color: "#d32f2f" };
  if (pressure > 1015) return { text: "↑ 高め",   color: "#f57c00" };
  return { text: "✓ 安定", color: "#388e3c" };
}

// UI: DOM更新だけ担当
function updateWeatherUI(weatherData, warning) {
  const el = id => document.getElementById(id);

  if (el("weatherValue"))  el("weatherValue").textContent  = weatherData.weather;
  if (el("tempValue"))     el("tempValue").textContent     = weatherData.temp + "℃";
  if (el("pressureValue")) el("pressureValue").textContent = weatherData.pressure + "hPa";

  const pw = el("pressureWarning");
  if (pw) {
    pw.textContent = warning.text;
    pw.style.color = warning.color;
  }
}

// LOGIC: API通信・キャッシュ保存
async function fetchWeather() {
  const zipcode = localStorage.getItem("zipcode");
  if (!zipcode) return;

  try {
    const addressData = await getCityFromZipcode(zipcode);
    if (!addressData) return;

    const weatherData = await getWeatherFromCity(addressData.cityOnly, addressData.fullAddress);
    const warning = getPressureWarning(weatherData.pressure);

    updateWeatherUI(weatherData, warning);

    weatherCache.weather         = weatherData.weather;
    weatherCache.temp            = weatherData.temp;
    weatherCache.pressure        = weatherData.pressure;
    weatherCache.pressureWarning = warning.text;

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
    localStorage.setItem("weather_cache_" + today, JSON.stringify(weatherCache));

  } catch (e) {
    console.warn("天気取得失敗:", e);
  }
}