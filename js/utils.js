// ============================================
// 共通ユーティリティ関数
// ============================================

/**
 * localStorageから値を取得
 * @param {string} key キー名
 * @returns {any} 保存されている値、またはnull
 */
function getFromStorage(key) {
  const value = localStorage.getItem(key);
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

/**
 * localStorageに値を保存
 * @param {string} key キー名
 * @param {any} value 保存する値
 */
function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/**
 * 郵便番号から都市名を取得
 * @param {string} zipcode 郵便番号
 * @returns {Promise<string>} 都市名
 */
async function getCityFromZipcode(zipcode) {
  try {
    const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zipcode}`);
    const data = await res.json();
    
    if (!data.results) {
      throw new Error("郵便番号が見つかりません");
    }
    
    return data.results[0].address1 + data.results[0].address2 + data.results[0].address3;
  } catch (error) {
    console.error("郵便番号取得エラー:", error);
    throw error;
  }
}

/**
 * 都市名から天気情報を取得
 * @param {string} city 都市名
 * @returns {Promise<object>} 天気情報（weather, temp, pressure）
 */
async function getWeatherFromCity(city) {
  const apiKey = "deddd1941a75455fe3e9c7206db41b10";
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city},JP&appid=${apiKey}&units=metric&lang=ja`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    
    return {
      weather: data.weather[0].description,
      temp: data.main.temp,
      pressure: data.main.pressure,
      city: city
    };
  } catch (error) {
    console.error("天気取得エラー:", error);
    throw error;
  }
}

/**
 * 天気情報を文字列にフォーマット
 * @param {object} weatherData 天気情報オブジェクト
 * @returns {string} フォーマットされた天気文字列
 */
function formatWeatherText(weatherData) {
  return `${weatherData.city} / ${weatherData.weather} / 気温 ${weatherData.temp}℃ / 気圧 ${weatherData.pressure}hPa`;
}

/**
 * 気圧から注意度を計算
 * @param {number} pressure 気圧（hPa）
 * @returns {string} 注意度（通常/やや注意/注意）
 */
function calculatePressureWarning(pressure) {
  if (pressure >= 1013) {
    return "通常";
  } else if (pressure >= 1000) {
    return "やや注意";
  } else {
    return "注意";
  }
}

/**
 * チェックボックスの選択値を配列で取得
 * @param {string} name チェックボックスのname属性
 * @returns {array} 選択されたチェックボックスの値の配列
 */
function getCheckedValues(name) {
  return [...document.querySelectorAll(`input[name="${name}"]:checked`)]
    .map(el => el.value);
}

/**
 * フォーム送信用のデータを作成
 * @param {object} data 送信するデータ
 * @returns {HTMLFormElement} フォーム要素
 */
function createFormForSubmit(data) {
  const form = document.createElement("form");
  form.action = "https://script.google.com/macros/s/AKfycbxGIYLe3G7Z74wWUVnzb1GGPOT-eVgaCJuIlbnoxbSyTtPI4cr_5z5RSH56XGpfXlzmIA/exec";
  form.method = "POST";
  
  for (const [key, value] of Object.entries(data)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    form.appendChild(input);
  }
  
  return form;
}

/**
 * フォームを送信
 * @param {HTMLFormElement} form フォーム要素
 */
function submitForm(form) {
  document.body.appendChild(form);
  form.submit();
}