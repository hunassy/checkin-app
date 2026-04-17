// ============================================
// analysis.js 分析画面(analysis.html)のロジック
// ============================================

import { messages,getMindBodySummaryMessage } from "./js/messages.js";

const GAS_URL_KEY = "gasUrl";
const FIXED_GAS_URL = APP_CONFIG.GAS_URL;
let allRecords = [];
let allEveningRecords = [];
let allMergedByDate = [];
let currentPeriod = 30; // 表示期間（日数）

window.onload = function() {
  loadData();
};

// ---- データ取得 ----
async function loadData() {
  const gasUrl = FIXED_GAS_URL || localStorage.getItem(GAS_URL_KEY);

  if (!gasUrl) {
    showUrlForm();
    return;
  }

  try {
    const url = gasUrl + "?action=getData";
    const res = await fetch(url);
    const json = await res.json();

    if (json.error) {
      showError(json.error);
      return;
    }

    allRecords = json.records || [];
    allEveningRecords = json.eveningRecords || [];
    allMergedByDate = json.mergedByDate || [];

    if (allRecords.length === 0) {
      document.getElementById("mainContent").innerHTML =
        '<div class="loading-msg">まだデータがありません。<br>記録を送信してから確認してください。</div>';
      return;
    }

      renderAll();
  } catch(e) {
    console.error("エラー内容:", e);
    showError("データの取得に失敗しました。<br>GAS URLが正しいか確認してください。<br><small>" + e.message + "</small>");
  }
}

// ---- 全セクションを描画 ----
function renderAll() {
  const records = filterByPeriod(allRecords, currentPeriod);
  const eveningRecords = filterByPeriod(allEveningRecords, currentPeriod);
  const mergedData = filterMergedByPeriod(allMergedByDate, currentPeriod);

  document.getElementById("mainContent").innerHTML = `
    <!-- 期間タブ -->
    <div class="period-tabs">
      <div class="period-tab ${currentPeriod===7?'active':''}"  onclick="changePeriod(7)">7日間</div>
      <div class="period-tab ${currentPeriod===30?'active':''}" onclick="changePeriod(30)">30日間</div>
      <div class="period-tab ${currentPeriod===90?'active':''}" onclick="changePeriod(90)">90日間</div>
    </div>

    <!-- 平均スコア -->
    <div class="analysis-section" id="sec-avg"></div>

    <!-- 推移グラフ -->
    <div class="analysis-section" id="sec-chart"></div>

    <!-- アラート -->
    <div class="analysis-section" id="sec-alert"></div>

    <!-- 気圧×体調 -->
    <div class="analysis-section" id="sec-pressure"></div>

    <!-- 睡眠×スコア -->
    <div class="analysis-section" id="sec-sleep"></div>

    <!-- 食事分析 -->
    <div class="analysis-section" id="sec-meal"></div>

    <!-- 曜日パターン -->
    <div class="analysis-section" id="sec-dow"></div>

    <!-- 通所/在宅 -->
    <div class="analysis-section" id="sec-attend"></div>

    <!-- Good/Badサイン -->
    <div class="analysis-section" id="sec-signs"></div>

    <!-- 低空飛行期間 -->
    <div class="analysis-section" id="sec-lowflight"></div>

    <!-- 週間エネルギーグラフ -->
    <div class="analysis-section" id="sec-weekly-energy"></div>

    <!-- 体と心のズレ -->
    <div class="analysis-section" id="sec-bodymind"></div>

    <!-- 良い日のパターン -->
    <div class="analysis-section" id="sec-goodday"></div>

    <!-- 気温・気圧分析 -->
    <div class="analysis-section" id="sec-weather-detail"></div>
  `;

  renderAvgScores(records);
  renderTrendChart(records);
  renderAlerts(records);
  renderPressureCorrelation(records);
  renderSleepCorrelation(records);
  renderDayOfWeekPattern(records);
  //renderAttendanceCorrelation(records);
  renderEnvironmentSocialAnalysis(eveningRecords);
  renderSignPattern(records);
  renderLowFlightPeriod(records, eveningRecords, mergedData);
  renderBodyMindGap(records, eveningRecords, mergedData);
  renderGoodDayPattern(records, eveningRecords, mergedData);
  renderWeatherDetail(records, eveningRecords);
  renderWeeklyEnergyChart(records, eveningRecords);
  renderMealEnergyAnalysis(eveningRecords)
}

window.changePeriod = function(days) {
  currentPeriod = days;
  renderAll();
}

function filterByPeriod(records, days) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return records.filter(r => r.date && new Date(r.date) >= cutoff);
}

function filterMergedByPeriod(merged, days) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return merged.filter(d => d.date && new Date(d.date) >= cutoff);
}

// ---- 平均スコア ----
function renderAvgScores(records) {
  const sec = document.getElementById("sec-avg");
  const valid = records.filter(r => r.condition && r.energy && r.mental);
  if (valid.length === 0) {
    sec.innerHTML = '<h3>📊 平均スコア</h3><p style="color:#888;font-size:13px">データ不足</p>';
    return;
  }

  const avgC = valid.reduce((s,r) => s + Number(r.condition), 0) / valid.length;
  const avgE = valid.reduce((s,r) => s + Number(r.energy),    0) / valid.length;
  const avgM = valid.reduce((s,r) => s + Number(r.mental),    0) / valid.length;

  sec.innerHTML = `
    <h3>📊 平均スコア（${valid.length}日分）</h3>
    <div class="score-avg-grid">
      <div class="score-avg-card" style="background:${scoreColor(avgC)}">
        <div class="label">体調</div>
        <div class="value">${avgC.toFixed(1)}</div>
        <div class="sub">${scoreLabel(avgC)}</div>
      </div>
      <div class="score-avg-card" style="background:${scoreColor(avgE)}">
        <div class="label">活力</div>
        <div class="value">${avgE.toFixed(1)}</div>
        <div class="sub">${scoreLabel(avgE)}</div>
      </div>
      <div class="score-avg-card" style="background:${scoreColor(avgM)}">
        <div class="label">メンタル</div>
        <div class="value">${avgM.toFixed(1)}</div>
        <div class="sub">${scoreLabel(avgM)}</div>
      </div>
    </div>
  `;
}

// ---- 推移グラフ ----
function renderTrendChart(records) {
  const sec = document.getElementById("sec-chart");
  const valid = records.filter(r => r.condition || r.energy || r.mental).slice(-30);

  sec.innerHTML = `<h3>📈 体調・活力・メンタル 推移</h3><div class="chart-wrap"><canvas id="trendChart"></canvas></div>`;

  if (valid.length < 2) {
    sec.innerHTML += '<p style="color:#888;font-size:13px;text-align:center">グラフ表示には2件以上のデータが必要です</p>';
    return;
  }

  const labels = valid.map(r => r.date ? r.date.slice(5) : "");
  const condData  = valid.map(r => r.condition ? Number(r.condition) : null);
  const energyData = valid.map(r => r.energy    ? Number(r.energy)    : null);
  const mentalData = valid.map(r => r.mental    ? Number(r.mental)    : null);

  new Chart(document.getElementById("trendChart"), {
    type: "line",
    data: {
      labels,
      datasets: [
        { label: "体調",   data: condData,   borderColor: "#e53935", backgroundColor: "rgba(229,57,53,0.1)",  tension: 0.3, pointRadius: 4, spanGaps: true },
        { label: "活力",   data: energyData, borderColor: "#43a047", backgroundColor: "rgba(67,160,71,0.1)",  tension: 0.3, pointRadius: 4, spanGaps: true },
        { label: "メンタル", data: mentalData, borderColor: "#1e88e5", backgroundColor: "rgba(30,136,229,0.1)", tension: 0.3, pointRadius: 4, spanGaps: true }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        y: { min: 0, max: 5, ticks: { stepSize: 1 } },
        x: { ticks: { maxRotation: 45, font: { size: 10 } } }
      },
      plugins: { legend: { position: "bottom" } }
    }
  });
}

// ---- アラート ----
function renderAlerts(records) {
  const sec = document.getElementById("sec-alert");
  sec.innerHTML = '<h3>🚨 体調アラート</h3>';

  const alerts = [];
  const recent7 = filterByPeriod(records, 7);

  const lowCond   = recent7.filter(r => Number(r.condition) <= 2).length;
  const lowEnergy = recent7.filter(r => Number(r.energy)    <= 2).length;
  const lowMental = recent7.filter(r => Number(r.mental)    <= 2).length;

  if (lowCond   >= 3) alerts.push({type: "bad",text: messages.lowScore("体調", lowCond)});
  if (lowEnergy >= 3) alerts.push({type: "warn",text: messages.lowScore("活力", lowEnergy) });
  if (lowMental >= 3) alerts.push({type: "bad",text: messages.lowScore("メンタル", lowMental) });

  // 低気圧の日の体調
  const lowPDays = records.filter(r => r.pressure && Number(r.pressure) < 1000 && r.condition);
  if (lowPDays.length >= 3) {
    const avg = lowPDays.reduce((s,r) => s + Number(r.condition), 0) / lowPDays.length;
    if (avg < 2.5) alerts.push({ type: "warn", text: messages.lowPressure(lowPDays.length, avg) });
  }
  // 眠れなかった日のメンタル
  const badSleep = records.filter(r => r.sleepType && r.sleepType.includes("眠れなかった") && r.mental);
  if (badSleep.length >= 2) {
    const avg = badSleep.reduce((s,r) => s + Number(r.mental), 0) / badSleep.length;
    if (avg < 3) {alerts.push({type: "warn",text: messages.sleepMental(avg)});
    }
  }
 //console.log("alertsの中身", alerts);
  if (alerts.length === 0) {
    alerts.push({ type: "ok", text: messages.noIssues() });
  }
 //console.log("描画直前", alerts);
  alerts.forEach(a => {
    sec.innerHTML += `<div class="alert-item alert-${a.type}">${a.text}</div>`;
  });
}

// ---- 気圧×体調 ----
function renderPressureCorrelation(records) {
  const sec = document.getElementById("sec-pressure");
  sec.innerHTML = '<h3>📉 気圧 × 体調スコアの相関</h3>';

  const valid = records.filter(r => r.pressure && r.condition && !isNaN(Number(r.pressure)));
  if (valid.length < 5) {
    sec.innerHTML += '<p style="color:#888;font-size:13px">気圧データが5件未満のため分析できません</p>';
    return;
  }

  const low  = valid.filter(r => Number(r.pressure) < 1000);
  const mid  = valid.filter(r => Number(r.pressure) >= 1000 && Number(r.pressure) <= 1015);
  const high = valid.filter(r => Number(r.pressure) > 1015);

  const avg = arr => arr.length > 0 ? (arr.reduce((s,r) => s + Number(r.condition), 0) / arr.length).toFixed(2) : "-";

  const rows = [
    ["低気圧（1000hPa未満）", low.length,  avg(low)],
    ["通常（1000〜1015hPa）", mid.length,  avg(mid)],
    ["高気圧（1015hPa超）",   high.length, avg(high)]
  ];

  sec.innerHTML += `
    <table class="analysis-table">
      <tr><th>気圧帯</th><th>件数</th><th>体調平均</th></tr>
      ${rows.map(r => `<tr>
        <td>${r[0]}</td>
        <td>${r[1]}</td>
        <td style="background:${isNaN(r[2]) ? '#fff' : scoreColor(Number(r[2]))}">${r[2]}</td>
      </tr>`).join("")}
    </table>
  `;

  // ピアソン相関
  const xs = valid.map(r => Number(r.pressure));
  const ys = valid.map(r => Number(r.condition));
  const corr = pearson(xs, ys);

  let level;
  if (corr > 0.3) {level = "positive";} 
  else if (corr < -0.3) {level = "negative";} 
  else {level = "weak";}

  //console.log("相関レベル:", level);

  sec.innerHTML += `<p class="corr-value">
  ${messages.correlation("気圧と体調", level)}
  </p>`;
  //let corrText = `気圧と体調の相関係数：${corr.toFixed(3)}`;
  //if (corr > 0.3)       corrText += "（正の相関：気圧が高いほど体調が良い傾向）";
  //else if (corr < -0.3) corrText += "（負の相関：気圧が低いほど体調が悪い傾向）";
  //else                  corrText += "（相関は弱い）";

  //sec.innerHTML += `<p class="corr-value">${corrText}</p>`;
}

// ---- 睡眠×スコア ----
function renderSleepCorrelation(records) {
  const sec = document.getElementById("sec-sleep");
  sec.innerHTML = '<h3>😴 睡眠タイプ別のスコア傾向</h3>';

  const map = {};
  records.forEach(r => {
    if (!r.sleepType) return;
    if (!map[r.sleepType]) map[r.sleepType] = { c:[], e:[], m:[] };
    if (r.condition) map[r.sleepType].c.push(Number(r.condition));
    if (r.energy)    map[r.sleepType].e.push(Number(r.energy));
    if (r.mental)    map[r.sleepType].m.push(Number(r.mental));
  });

  const avg = arr => arr.length > 0 ? (arr.reduce((s,v)=>s+v,0)/arr.length).toFixed(2) : "-";

  const tableRows = Object.entries(map)
    .map(([type, d]) => [type, d.c.length, avg(d.c), avg(d.e), avg(d.m)])
    .sort((a,b) => Number(b[2]) - Number(a[2]));

  if (tableRows.length === 0) {
    sec.innerHTML += '<p style="color:#888;font-size:13px">データ不足</p>';
    return;
  }

  sec.innerHTML += `
    <table class="analysis-table">
      <tr><th>睡眠タイプ</th><th>件数</th><th>体調</th><th>活力</th><th>メンタル</th></tr>
      ${tableRows.map(r => `<tr>
        <td style="text-align:left">${r[0]}</td>
        <td>${r[1]}</td>
        <td style="background:${isNaN(r[2]) ? '#fff' : scoreColor(Number(r[2]))}">${r[2]}</td>
        <td style="background:${isNaN(r[3]) ? '#fff' : scoreColor(Number(r[3]))}">${r[3]}</td>
        <td style="background:${isNaN(r[4]) ? '#fff' : scoreColor(Number(r[4]))}">${r[4]}</td>
      </tr>`).join("")}
    </table>
  `;
}

// ---- 曜日パターン ----
function renderDayOfWeekPattern(records) {
  const sec = document.getElementById("sec-dow");
  sec.innerHTML = '<h3>📅 曜日別 体調パターン</h3>';

  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
  const map = {};
  for (let i = 0; i < 7; i++) map[i] = { c:[], e:[], m:[] };

  records.forEach(r => {
    if (!r.date) return;
    const dow = new Date(r.date).getDay();
    if (r.condition) map[dow].c.push(Number(r.condition));
    if (r.energy)    map[dow].e.push(Number(r.energy));
    if (r.mental)    map[dow].m.push(Number(r.mental));
  });

  const avg = arr => arr.length > 0 ? (arr.reduce((s,v)=>s+v,0)/arr.length).toFixed(2) : "-";

  const tableRows = [1,2,3,4,5,6,0].map(dow => [
    dayNames[dow] + "曜日", map[dow].c.length,
    avg(map[dow].c), avg(map[dow].e), avg(map[dow].m)
  ]);

  sec.innerHTML += `
    <table class="analysis-table">
      <tr><th>曜日</th><th>件数</th><th>体調</th><th>活力</th><th>メンタル</th></tr>
      ${tableRows.map(r => `<tr>
        <td>${r[0]}</td>
        <td>${r[1]}</td>
        <td style="background:${isNaN(r[2]) ? '#fff' : scoreColor(Number(r[2]))}">${r[2]}</td>
        <td style="background:${isNaN(r[3]) ? '#fff' : scoreColor(Number(r[3]))}">${r[3]}</td>
        <td style="background:${isNaN(r[4]) ? '#fff' : scoreColor(Number(r[4]))}">${r[4]}</td>
      </tr>`).join("")}
    </table>
  `;
}

function getEveningRecords() {
  const result = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);

    if (!key.startsWith("evening_")) continue;
    if (key.endsWith("_done")) continue;

    try {
      const data = JSON.parse(localStorage.getItem(key));
      if (data) result.push(data);
    } catch (e) {
      console.warn("JSON変換失敗:", key);
    }
  }

  return result;
}

// ---- 通所/在宅×スコア（ソート付き） ----
function renderEnvironmentSocialAnalysis(eveningRecords) {
  const sec = document.getElementById("sec-attend"); 
  if (!sec) return;
  sec.innerHTML = '<h3>🏠 環境 × 👥 対人別のスコア傾向</h3>';

  const stats = {
    "在宅・一人": { c:[], e:[], m:[] },
    "在宅・誰かと": { c:[], e:[], m:[] },
    "外出・一人": { c:[], e:[], m:[] },
    "外出・誰かと": { c:[], e:[], m:[] }
  };

  eveningRecords.forEach(r => {
    // factorsがない場合はスキップ
    if (!r.factors) return;

    // データが文字列なら配列に変換、配列ならそのまま使う
    let fList = [];
    if (Array.isArray(r.factors)) {
      fList = r.factors;
    } else if (typeof r.factors === 'string') {
      fList = r.factors.split(',').map(f => f.trim());
    }

    // 「キーワードが含まれているか」をより柔軟に判定
    // (out, home, alone, someone などの単語が含まれていればOKとする)
    const fString = fList.join(" "); 
    const isOut   = fString.includes("out");
    const isHome  = fString.includes("home");
    const isAlone = fString.includes("alone");
    const isSome  = fString.includes("someone");

    // 場所と対人の判定（どちらかが不明な場合はスキップ）
    if (!(isOut || isHome) || !(isAlone || isSome)) return;

    let key = (isOut ? "外出" : "在宅") + "・" + (isAlone ? "一人" : "誰かと");
    
    if (r.condition) stats[key].c.push(Number(r.condition));
    if (r.energy)    stats[key].e.push(Number(r.energy));
    if (r.mental)    stats[key].m.push(Number(r.mental));
  });

  const avg = arr => arr.length > 0 ? (arr.reduce((s,v)=>s+v,0)/arr.length).toFixed(2) : "-";
  const scoreColor = s => s >= 4 ? '#e8f5e9' : (s <= 2 ? '#ffebee' : 'transparent');

  let html = `
    <table class="analysis-table">
      <tr><th>パターン</th><th>件数</th><th>体調</th><th>活力</th><th>メンタル</th></tr>
      ${Object.entries(stats).map(([label, d]) => `
        <tr>
          <td style="text-align:left">${label}</td>
          <td>${d.c.length}</td>
          <td style="background:${scoreColor(Number(avg(d.c)))}">${avg(d.c)}</td>
          <td style="background:${scoreColor(Number(avg(d.e)))}">${avg(d.e)}</td>
          <td style="background:${scoreColor(Number(avg(d.m)))}">${avg(d.m)}</td>
        </tr>
      `).join("")}
    </table>`;
    
  // データが1件もない場合の警告
  const totalCount = Object.values(stats).reduce((acc, d) => acc + d.c.length, 0);
  if (totalCount === 0) {
    html += `<p style="color:red; font-size:12px; margin-top:10px;">⚠️ 判定可能なデータが見つかりません。factorsの内容を確認してください。</p>`;
  }

  sec.innerHTML += html;
}

// ---- Good/Badサインパターン ----
function renderSignPattern(records) {
  const sec = document.getElementById("sec-signs");
  sec.innerHTML = '<h3>🟢 Good/Badサイン 出現パターン</h3>';

  const badDays  = records.filter(r => Number(r.condition) <= 2 && r.bad);
  const goodDays = records.filter(r => Number(r.condition) >= 4 && r.good);

  const countSigns = (days, field) => {
    const cnt = {};
    days.forEach(r => {
      r[field].split(",").forEach(s => {
        const t = s.trim();
        if (t) cnt[t] = (cnt[t] || 0) + 1;
      });
    });
    return Object.entries(cnt).sort((a,b) => b[1]-a[1]).slice(0, 6);
  };

  const badSigns  = countSigns(badDays,  "bad");
  const goodSigns = countSigns(goodDays, "good");

  sec.innerHTML += `
    <p style="font-size:13px;font-weight:bold;color:#c62828;margin:8px 0 4px">体調が悪い日（スコア1〜2）に多いBadサイン：</p>
    <div class="sign-list">
      ${badSigns.length > 0
        ? badSigns.map(([s,n]) => `<span class="sign-tag bad">${s} (${n}回)</span>`).join("")
        : '<span style="color:#888;font-size:13px">データ不足</span>'}
    </div>
    <p style="font-size:13px;font-weight:bold;color:#2e7d32;margin:12px 0 4px">体調が良い日（スコア4〜5）に多いGoodサイン：</p>
    <div class="sign-list">
      ${goodSigns.length > 0
        ? goodSigns.map(([s,n]) => `<span class="sign-tag good">${s} (${n}回)</span>`).join("")
        : '<span style="color:#888;font-size:13px">データ不足</span>'}
    </div>
  `;
}

// ---- 低空飛行期間の可視化 ----
function renderLowFlightPeriod(records, eveningRecords, mergedData) {
  const sec = document.getElementById("sec-lowflight");
  sec.innerHTML = '<h3>🟡 低空飛行期間の可視化</h3>';

  // 朝・夜の平均スコアで判定（夜データがある日は朝夜平均、ない日は朝のみ）
  const dateScoreMap = {};
  records.filter(r => r.date && r.mental).forEach(r => {
    if (!dateScoreMap[r.date]) dateScoreMap[r.date] = { scores: [] };
    dateScoreMap[r.date].scores.push(Number(r.mental));
  });
  eveningRecords.filter(r => r.date && r.mental).forEach(r => {
    if (!dateScoreMap[r.date]) dateScoreMap[r.date] = { scores: [] };
    dateScoreMap[r.date].scores.push(Number(r.mental));
  });

  const sorted = Object.keys(dateScoreMap).sort().map(date => ({
    date,
    avgMental: dateScoreMap[date].scores.reduce((s,v)=>s+v,0) / dateScoreMap[date].scores.length
  }));

  if (sorted.length < 3) {
    sec.innerHTML += '<p style="color:#888;font-size:13px">データ不足</p>';
    return;
  }

  const THRESHOLD = 2;
  let maxStreak = 0, currentStreak = 0, streakStart = null, maxStart = null, maxEnd = null;
  let lowDays = 0;

  sorted.forEach((r) => {
    if (r.avgMental <= THRESHOLD) {
      if (currentStreak === 0) streakStart = r.date;
      currentStreak++;
      lowDays++;
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
        maxStart = streakStart;
        maxEnd = r.date;
      }
    } else {
      currentStreak = 0;
    }
  });

  // 現在進行中の連続日数
  let ongoingStreak = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].avgMental <= THRESHOLD) ongoingStreak++;
    else break;
  }

  const totalDays = sorted.length;
  const lowPercent = Math.round(lowDays / totalDays * 100);

  let html = `
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:12px">
      <div style="background:#fff3e0;border-radius:10px;padding:12px;text-align:center">
        <div style="font-size:11px;color:#e65100">低空飛行日の割合</div>
        <div style="font-size:24px;font-weight:bold;color:#e65100">${lowPercent}%</div>
        <div style="font-size:11px;color:#888">${lowDays}/${totalDays}日</div>
      </div>
      <div style="background:#fde8e8;border-radius:10px;padding:12px;text-align:center">
        <div style="font-size:11px;color:#c62828">最長連続低調期間</div>
        <div style="font-size:24px;font-weight:bold;color:#c62828">${maxStreak}日</div>
        <div style="font-size:11px;color:#888">${maxStart ? maxStart.slice(5)+'〜'+maxEnd.slice(5) : '-'}</div>
      </div>
    </div>
  `;

  if (ongoingStreak >= 3) {
    html += `<div class="alert-item alert-bad">⚠️ 現在進行中：メンタルスコアが低い日が${ongoingStreak}日連続しています。支援者への共有を検討してください。</div>`;
  } else if (ongoingStreak > 0) {
    html += `<div class="alert-item alert-warn">🟡 現在進行中：メンタルスコアが低い日が${ongoingStreak}日連続しています。</div>`;
  } else {
    html += `<div class="alert-item alert-ok">✅ 現在は低空飛行期間ではありません。</div>`;
  }

  sec.innerHTML += html;
}

// ---- 週間エネルギーグラフ ----
function renderWeeklyEnergyChart(records, eveningRecords) {
  const sec = document.getElementById("sec-weekly-energy");
  sec.innerHTML = '<h3>🔋 日別の活力変化（朝と夜の比較）</h3>';

  const sorted = [...records].filter(r => r.date && r.energy).sort((a,b) => a.date.localeCompare(b.date)).slice(-28);
  if (sorted.length < 5) {
    sec.innerHTML += '<p style="color:#888;font-size:13px">データ不足（5件以上必要）</p>';
    return;
  }

  sec.innerHTML += `<div class="chart-wrap"><canvas id="weeklyEnergyChart"></canvas></div>`;
  
  // 曜日別の平均エネルギー
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
  const dayMap = {};
  for (let i = 0; i < 7; i++) dayMap[i] = [];
  sorted.forEach(r => {
    const dow = new Date(r.date).getDay();
    dayMap[dow].push(Number(r.energy));
  });
  const weekAvg = [1,2,3,4,5,6,0].map(d => {
    const arr = dayMap[d];
    return arr.length > 0 ? arr.reduce((s,v)=>s+v,0)/arr.length : null;
  });

  const labels = sorted.map(r => r.date.slice(5));
  const morningEnergyData = sorted.map(r => Number(r.energy));

  // 夜の活力データを日付マップに
  const eveningEnergyMap = {};
  eveningRecords.filter(r => r.date && r.energy).forEach(r => {
    eveningEnergyMap[r.date] = Number(r.energy);
  });
  const eveningEnergyData = sorted.map(r => eveningEnergyMap[r.date] !== undefined ? eveningEnergyMap[r.date] : null);
  const hasEveningData = eveningEnergyData.some(v => v !== null);

  const datasets = [{
    label: "活力（朝）",
    type: "bar",
    data: morningEnergyData,
    backgroundColor: morningEnergyData.map(v =>
      v <= 2 ? "rgba(229,115,115,0.7)" :
      v === 3 ? "rgba(255,213,79,0.7)" :
      "rgba(76,175,80,0.7)"
    ),
    borderRadius: 4,
    order: 2
  }];

  if (hasEveningData) {
    datasets.push({
      label: "活力（夜）",
      type: "line",
      data: eveningEnergyData,
      borderColor: "rgba(92,107,192,0.9)",
      backgroundColor: "rgba(92,107,192,0.2)",
      borderWidth: 2,
      pointRadius: 4,
      tension: 0.3,
      spanGaps: true,
      order: 1
    });
  }

  setTimeout(() => {
  const canvas = document.getElementById("weeklyEnergyChart");
  if (!canvas) {
    console.error("canvas取得失敗");
    return;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.error("context取得失敗");
    return;
  }

  new Chart(ctx, {
    type: "bar",
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { min: 0, max: 5, ticks: { stepSize: 1 } },
        x: { ticks: { maxRotation: 45, font: { size: 9 } } }
      },
      plugins: { legend: { display: hasEveningData } }
    }
  });
 }, 100);

  // 曜日別平均コメント
  const weekLabels = ['月', '火', '水', '木', '金', '土', '日'];
  const validWeek = weekAvg.filter(v => v !== null);
  if (validWeek.length > 0) {
    const minDay = weekAvg.indexOf(Math.min(...weekAvg.filter(v=>v!==null)));
    const maxDay = weekAvg.indexOf(Math.max(...weekAvg.filter(v=>v!==null)));
    const minLabel = weekLabels[minDay];
    const maxLabel = weekLabels[maxDay];
    sec.innerHTML += `<p class="corr-value">曜日別平均（朝）：${weekLabels.map((d,i)=>weekAvg[i]!==null?d+weekAvg[i].toFixed(1):d+'-').join(' / ')}</p>`;
    sec.innerHTML += `<p class="corr-value">最も活力が高い曜日：<strong>${maxLabel}曜日</strong>／最も低い曜日：<strong>${minLabel}曜日</strong></p>`;
  }
}

// ---- 食事回数×活力の相関 ----
function renderMealEnergyAnalysis(eveningRecords) {
  const sec = document.getElementById("sec-meal"); // analysis.htmlにこのIDのdivを作っておく
  if (!sec) return;
  sec.innerHTML = '<h3>🍴 食事回数 × 活力の相関</h3>';

  const stats = {
    "meal_0": { label: "抜き", e: [] },
    "meal_1": { label: "1食", e: [] },
    "meal_2": { label: "2食", e: [] },
    "meal_3": { label: "3食", e: [] }
  };

  eveningRecords.forEach(r => {
    if (!r.factors) return;
    const fList = Array.isArray(r.factors) ? r.factors : r.factors.split(',');
    
    // meal_ で始まるタグを探す
    const mealTag = fList.find(f => f.trim().startsWith("meal_"));
    if (mealTag && stats[mealTag.trim()]) {
      if (r.energy) stats[mealTag.trim()].e.push(Number(r.energy));
    }
  });

  const avg = arr => arr.length > 0 ? (arr.reduce((s,v)=>s+v,0)/arr.length).toFixed(2) : "-";

  sec.innerHTML += `
    <table class="analysis-table">
      <tr><th>食事回数</th><th>件数</th><th>平均活力スコア</th></tr>
      ${Object.entries(stats).map(([id, d]) => `
        <tr>
          <td>${d.label}</td>
          <td>${d.e.length}</td>
          <td style="font-weight:bold; color:#1976d2;">${avg(d.e)}</td>
        </tr>
      `).join("")}
    </table>
    <p class="corr-value" style="font-size:11px; color:#666; margin-top:8px;">
      ※活力が低い傾向にある食事回数を知ることで、意識的な栄養補給の目安になります。
    </p>
  `;
}

// ---- 体と心のズレ ----
function renderBodyMindGap(records, eveningRecords, mergedData) {
  const sec = document.getElementById("sec-bodymind");
  sec.innerHTML = '<h3>🧠 最近のコンディション（体と心のバランス）</h3>';

  // 夜データがある日は「朝→夜の変化」で検出、ない日は朝の体調・メンタルの差で検出
  const hasMerged = mergedData.some(d => d.morning && d.evening);

  let gapDays = [];
  let analysisLabel = "";

  if (hasMerged) {
    // 朝夜比較：体調またはメンタルが朝→夜で大きく変化した日
    analysisLabel = "（朝→夜の変化で分析）";
    mergedData.forEach(d => {
      if (!d.morning || !d.evening) return;
      const mCond = Number(d.morning.condition), eCond = Number(d.evening.condition);
      const mMental = Number(d.morning.mental), eMental = Number(d.evening.mental);
      if (isNaN(mCond) || isNaN(eCond) || isNaN(mMental) || isNaN(eMental)) return;
      const condChange = eCond - mCond;
      const mentalChange = eMental - mMental;
      gapDays.push({
        date: d.date,
        condChange,
        mentalChange,
        type: condChange <= -2 || mentalChange <= -2 ? "deteriorated" :
              condChange >= 2 || mentalChange >= 2 ? "improved" : "stable"
      });
    });
  } else {
    // 夜データなし：朝の体調とメンタルの差
    analysisLabel = "（朝の体調・メンタルの差で分析）";
    const valid = records.filter(r => r.condition && r.mental);
    valid.forEach(r => {
      const gap = Number(r.condition) - Number(r.mental);
      gapDays.push({
        date: r.date,
        condChange: gap,
        mentalChange: -gap,
        type: gap >= 2 ? "bodyHigh" : gap <= -2 ? "mindHigh" : "stable"
      });
    });
  }

  if (gapDays.length < 3) {
    sec.innerHTML += '<p style="color:#888;font-size:13px">データ不足</p>';
    return;
  }

  const deteriorated = gapDays.filter(d => d.type === "deteriorated" || d.type === "bodyHigh");
  const improved     = gapDays.filter(d => d.type === "improved"     || d.type === "mindHigh");
  const stable       = gapDays.filter(d => d.type === "stable");

  const deterioratedLabel = hasMerged ? "😣 午後にしんどくなった日" : "😣 体は元気だけど気分がつらい日";
  const improvedLabel     = hasMerged ? "🌿 午後に楽になった日" : "🌿 気分は良いけど体がしんどい日";

  const summaryMessage = getMindBodySummaryMessage(
  deteriorated.length,
  improved.length,
  stable.length
  );
  
  let html = `<p style="font-size:11px;color:#888;margin-bottom:10px">${analysisLabel}</p>
   <div class="alert-item" style="margin-bottom:10px;font-size:16px;font-weight:bold;">${summaryMessage}</div>`;
  html += `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px">
      <div style="background:#fde8e8;border-radius:10px;padding:10px;text-align:center">
        <div style="font-size:10px;color:#c62828">${deterioratedLabel}</div>
        <div style="font-size:22px;font-weight:bold;color:#c62828">${deteriorated.length}日</div>
      </div>
      <div style="background:#e8f5e9;border-radius:10px;padding:10px;text-align:center">
        <div style="font-size:10px;color:#2e7d32">${improvedLabel}</div>
        <div style="font-size:22px;font-weight:bold;color:#2e7d32">${improved.length}日</div>
      </div>
      <div style="background:#f5f5f5;border-radius:10px;padding:10px;text-align:center">
        <div style="font-size:10px;color:#555">安定していた日</div>
        <div style="font-size:22px;font-weight:bold;color:#555">${stable.length}日</div>
      </div>
    </div>
  `;

  /*if (deteriorated.length > 0) {
    const recent = deteriorated.slice(-3).map(d => d.date.slice(5)).join(', ');
    html += `<div class="alert-item">📍 ${deterioratedLabel}が${deteriorated.length}日あります。直近：${recent}</div>`;
  }
  if (improved.length > 0) {
    const recent = improved.slice(-3).map(d => d.date.slice(5)).join(', ');
    html += `<div class="alert-item">📍 ${improvedLabel}が${improved.length}日あります。直近：${recent}</div>`;
  }*/

  sec.innerHTML += html;
}

// ---- 良い日のパターン自動検出（アップグレード版） ----
function renderGoodDayPattern(records, eveningRecords, mergedData) {
  const sec = document.getElementById("sec-goodday");
  sec.innerHTML = '<h3>✨ 良い日のパターン自動検出</h3>';

  let goodDays = [];
  const hasMerged = mergedData.some(d => d.morning && d.evening);

  if (hasMerged) {
    mergedData.forEach(d => {
      if (!d.morning) return;
      const scores = [];
      if (d.morning.condition) scores.push(Number(d.morning.condition));
      if (d.morning.energy)    scores.push(Number(d.morning.energy));
      if (d.morning.mental)    scores.push(Number(d.morning.mental));
      if (d.evening) {
        if (d.evening.condition) scores.push(Number(d.evening.condition));
        if (d.evening.energy)    scores.push(Number(d.evening.energy));
        if (d.evening.mental)    scores.push(Number(d.evening.mental));
      }
      if (scores.length === 0) return;
      const avg = scores.reduce((s,v)=>s+v,0)/scores.length;
      if (avg >= 4) {
        goodDays.push({
          date: d.date,
          sleepType: d.morning.sleepType,
          weather: d.morning.weather,
          factors: d.evening ? d.evening.factors : (d.morning.factors || "")
        });
      }
    });
  } else {
    goodDays = records.filter(r =>
      r.condition && r.energy && r.mental &&
      Number(r.condition) >= 4 && Number(r.energy) >= 4 && Number(r.mental) >= 4
    ).map(r => ({ date: r.date, sleepType: r.sleepType, weather: r.weather, factors: r.factors || "" }));
  }

  if (goodDays.length < 3) {
    sec.innerHTML += '<p style="color:#888;font-size:13px">良い日が3日未満のため分析できません</p>';
    return;
  }

  // 1. 曜日・睡眠・天気の集計
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
  const dowCount = new Array(7).fill(0);
  goodDays.forEach(r => dowCount[new Date(r.date).getDay()]++);
  const topDow = dowCount.indexOf(Math.max(...dowCount));

  const sleepMap = {};
  goodDays.forEach(r => { if (r.sleepType) sleepMap[r.sleepType] = (sleepMap[r.sleepType] || 0) + 1; });
  const topSleep = Object.entries(sleepMap).sort((a,b)=>b[1]-a[1])[0];

  // 2. ★追加：具体アクションの集計を強化
  const actionIcons = { 
    "alone": "👤 一人の時間",
    "someone": "👥 誰かと過ごす",
    "out": "外出した日",
    "shopping": "🛒 買い物", 
    "hospital": "🏥 通院",
    "outdoor": "🍴 外食",
    "bath": "🛀 お風呂", 
    "eat": "🥗 食事", 
    "dishes": "🍽️ 食器洗い",
    "laundry": "👕 洗濯",
    "housecleaning": "🧹 掃除",
    "nothing": "🛋️ 何もできなかった",
  };
  const factorMap = {};
  goodDays.forEach(r => {
    if (r.factors) {
      r.factors.split(',').forEach(f => {
        const t = f.trim();
        if (t) factorMap[t] = (factorMap[t] || 0) + 1;
      });
    }
  });
  
  // 頻度の高い順にソート
  const topFactors = Object.entries(factorMap).sort((a,b)=>b[1]-a[1]);

  let html = `<p style="font-size:13px;color:#555;margin-bottom:10px">良い日の条件：<strong>${goodDays.length}日分を分析</strong></p>`;
  html += `<table class="analysis-table">`;
  html += `<tr><th>条件</th><th>最も多い内容</th></tr>`;
  html += `<tr><td>曜日</td><td><strong>${dayNames[topDow]}曜日</strong></td></tr>`;
  if (topSleep) html += `<tr><td>睡眠</td><td><strong>${topSleep[0]}</strong></td></tr>`;
  if (topWeather) html += `<tr><td>天気</td><td><strong>${topWeather[0]}</strong></td></tr>`;
  html += `</table>`;

  // 3. ★アクションを表示する部分
  if (topFactors.length > 0) {
    html += `<p style="font-size:13px;font-weight:bold;margin:12px 0 6px">✨ 良い日に共通するアクション：</p>`;
    html += `<div class="sign-list">`;
    topFactors.forEach(([f, n]) => {
      // 登録したアイコン名があればそれを使う、なければそのまま表示
      const label = actionIcons[f] || f;
      const isAction = actionIcons[f] ? "good" : "stable"; // 共通アクションは緑色で強調
      html += `<span class="sign-tag ${isAction}">${label} (${n}回)</span>`;
    });
    html += `</div>`;
  }

  sec.innerHTML += html;
}


// ---- 気温・気圧詳細分析 ----
function renderWeatherDetail(records, eveningRecords) {
  const sec = document.getElementById("sec-weather-detail");
  sec.innerHTML = '<h3>🌡️ 気温・気圧と体調の関係</h3>';

  // 朝・夜の天気データをマージ（サンプル数を増やす）
  const allWeatherRecords = [
    ...records.map(r => ({ ...r, source: "morning" })),
    ...eveningRecords.map(r => ({ ...r, source: "evening" }))
  ];
  const valid = allWeatherRecords.filter(r => r.temp && r.pressure && r.condition && !isNaN(Number(r.temp)) && !isNaN(Number(r.pressure)));
  if (valid.length < 5) {
    sec.innerHTML += '<p style="color:#888;font-size:13px">データ不足（5件以上必要）</p>';
    return;
  }

  // 気温帯別分析
  const cold  = valid.filter(r => Number(r.temp) < 10);
  const cool  = valid.filter(r => Number(r.temp) >= 10 && Number(r.temp) < 20);
  const warm  = valid.filter(r => Number(r.temp) >= 20 && Number(r.temp) < 28);
  const hot   = valid.filter(r => Number(r.temp) >= 28);

  const avgC = arr => arr.length > 0 ? (arr.reduce((s,r)=>s+Number(r.condition),0)/arr.length).toFixed(2) : '-';
  const avgM = arr => arr.length > 0 ? (arr.reduce((s,r)=>s+Number(r.mental),0)/arr.length).toFixed(2) : '-';

  let html = `
    <p style="font-size:13px;font-weight:bold;margin-bottom:8px">気温帯別 体調・メンタル平均</p>
    <table class="analysis-table">
      <tr><th>気温帯</th><th>件数</th><th>体調</th><th>メンタル</th></tr>
      <tr><td>寒い（10℃未満）</td><td>${cold.length}</td><td style="background:${isNaN(avgC(cold))?'#fff':scoreColor(Number(avgC(cold)))}">${avgC(cold)}</td><td style="background:${isNaN(avgM(cold))?'#fff':scoreColor(Number(avgM(cold)))}">${avgM(cold)}</td></tr>
      <tr><td>涼しい（10〜20℃）</td><td>${cool.length}</td><td style="background:${isNaN(avgC(cool))?'#fff':scoreColor(Number(avgC(cool)))}">${avgC(cool)}</td><td style="background:${isNaN(avgM(cool))?'#fff':scoreColor(Number(avgM(cool)))}">${avgM(cool)}</td></tr>
      <tr><td>暖かい（20〜28℃）</td><td>${warm.length}</td><td style="background:${isNaN(avgC(warm))?'#fff':scoreColor(Number(avgC(warm)))}">${avgC(warm)}</td><td style="background:${isNaN(avgM(warm))?'#fff':scoreColor(Number(avgM(warm)))}">${avgM(warm)}</td></tr>
      <tr><td>暑い（28℃以上）</td><td>${hot.length}</td><td style="background:${isNaN(avgC(hot))?'#fff':scoreColor(Number(avgC(hot)))}">${avgC(hot)}</td><td style="background:${isNaN(avgM(hot))?'#fff':scoreColor(Number(avgM(hot)))}">${avgM(hot)}</td></tr>
    </table>
  `;

  // 気温とメンタルの相関
  const tempXs = valid.map(r => Number(r.temp));
  const mentalYs = valid.map(r => Number(r.mental));
  const tempMentalCorr = pearson(tempXs, mentalYs);

  // 気圧変動幅分析（前日比）
  const sortedValid = [...valid].sort((a,b) => a.date.localeCompare(b.date));
  const pressureChanges = [];
  for (let i = 1; i < sortedValid.length; i++) {
    const diff = Number(sortedValid[i].pressure) - Number(sortedValid[i-1].pressure);
    pressureChanges.push({ date: sortedValid[i].date, diff, condition: Number(sortedValid[i].condition), mental: Number(sortedValid[i].mental) });
  }

  const bigDrop = pressureChanges.filter(p => p.diff <= -5); // 気圧が5hPa以上下落
  if (bigDrop.length >= 2) {
    const avgCond = bigDrop.reduce((s,p)=>s+p.condition,0)/bigDrop.length;
    html += `<div class="alert-item alert-warn" style="margin-top:10px">🌧️ 気圧が5hPa以上下落した日（${bigDrop.length}件）の体調平均：${avgCond.toFixed(1)}。気圧変動に注意が必要です。</div>`;
  }

  let corrText = `気温とメンタルの相関係数：${tempMentalCorr.toFixed(3)}`;
  if (tempMentalCorr > 0.3) corrText += '（気温が高いほどメンタルが良い傾向）';
  else if (tempMentalCorr < -0.3) corrText += '（気温が低いほどメンタルが良い傾向）';
  else corrText += '（相関は弱い）';

  html += `<p class="corr-value">${corrText}</p>`;

  sec.innerHTML += html;
}

// ---- ユーティリティ ----
function scoreColor(v) {
  if (v >= 4.5) return "#e8f5e9";
  if (v >= 3.5) return "#f1f8e9";
  if (v >= 2.5) return "#fff8e1";
  if (v >= 1.5) return "#fff3e0";
  return "#fde8e8";
}

function scoreLabel(v) {
  if (v >= 4.5) return "とても良い";
  if (v >= 3.5) return "良い";
  if (v >= 2.5) return "普通";
  if (v >= 1.5) return "悪い";
  return "とても悪い";
}

function pearson(x, y) {
  const n = x.length;
  if (n === 0) return 0;
  const mx = x.reduce((s,v)=>s+v,0)/n;
  const my = y.reduce((s,v)=>s+v,0)/n;
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i]-mx, dy = y[i]-my;
    num += dx*dy; dx2 += dx*dx; dy2 += dy*dy;
  }
  const den = Math.sqrt(dx2*dy2);
  return den === 0 ? 0 : num/den;
}

function showError(msg) {
  document.getElementById("mainContent").innerHTML = `<div class="error-msg">${msg}</div>`;
}

function showUrlForm() {
  document.getElementById("mainContent").innerHTML = `
    <div class="analysis-section">
      <h3>⚙️ GAS URLを設定してください</h3>
      <p style="font-size:13px;color:#555;margin-bottom:12px">
        設定画面でGAS URLを保存するか、以下に直接入力してください。
      </p>
      <div class="gas-url-form">
        <input type="url" id="gasUrlInput" placeholder="https://script.google.com/macros/s/..." />
        <button onclick="saveAndLoad()">読み込む</button>
      </div>
    </div>
  `;
}

function saveAndLoad() {
  const url = document.getElementById("gasUrlInput").value.trim();
  if (!url) return;
  localStorage.setItem(GAS_URL_KEY, url);
  document.getElementById("mainContent").innerHTML = '<div class="loading-msg">データを読み込んでいます...</div>';
  loadData();
}