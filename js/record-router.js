// ============================================
// record-router.js — 記録タブの自動切り替えロジック
// デバイス間同期対応版 + 猶予時間対応（午前0〜4時は前日扱い）
// ============================================

const GAS_URL = APP_CONFIG.GAS_URL;

// ============================================
// 日付ユーティリティ
// ============================================

// 「論理日付」を返す：午前0〜3:59は前日扱い、午前4時以降は当日
function getLogicalDate( ) {
  const now = new Date();
  if (now.getHours() < 4) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return formatDateKey(yesterday);
  }
  return formatDateKey(now);
}

// 「実際の今日の日付」を返す（猶予時間を考慮しない）
function getActualToday() {
  return formatDateKey(new Date());
}

// Date → "yyyy-MM-dd" 文字列
function formatDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

// 前日の日付キーを返す
function getYesterdayKey() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return formatDateKey(yesterday);
}

// 午前0〜3:59の猶予時間帯かどうか
function isGracePeriod() {
  return new Date().getHours() < 4;
}

// 遷移判断と実行
function decideNavigation(currentPage, statusSet) {
  const { isGrace, todayStatus, yesterdayStatus, logicalStatus } = statusSet;

  // ===== index.html =====
  if (currentPage === "index.html") {

    if (isGrace) {
      // 🌙 深夜帯は論理日付の夜を優先
      if (!logicalStatus.eveningDone) {
        return { page: "evening.html", date: "logical" };
      }
      return null;
    }

    // 🌙 昨日の夜が未完なら優先
    if (!yesterdayStatus.eveningDone) {
      return { page: "evening.html", date: "yesterday" };
    }

    // 🌙 今日の夜が未完なら
    if (!todayStatus.eveningDone) {
      return { page: "evening.html", date: "today" };
    }

    return null;
  }

  // ===== evening.html =====
  if (currentPage === "evening.html") {

    const urlParams = new URLSearchParams(window.location.search);
    const urlDate = urlParams.get("date");

    let status;

    // 🔴 URLに日付がある場合 → その日付を優先
    if (urlDate) {
      if (urlDate === yesterdayStatus.dateKey) {
        status = yesterdayStatus;
      } else if (urlDate === logicalStatus.dateKey) {
        status = logicalStatus;
      } else {
        status = todayStatus;
      }
    } else {
      // 🔴 URLなし → 時間帯で判断
      status = isGrace ? logicalStatus : todayStatus;
    }

    console.log("evening判定:", status);

    // 🔴 夜完了 → 朝へ戻す
    if (status.eveningDone) {
      return { page: "index.html" };
    }

    return null;
  }

 return null;
}

// 遷移実行
function executeNavigation(decision, dates) {
  if (!decision) return;

  let target = decision.page;

  if (decision.date === "logical") {
    target += "?date=" + dates.logical;
  } else if (decision.date === "yesterday") {
    target += "?date=" + dates.yesterday;
  }

  const current = window.location.pathname.split("/").pop();

  if (current === decision.page) return;

  console.log("遷移:", target);
  window.location.href = target;
}

// ============================================
// localStorageから記録状態を判定する（フォールバック用）
// ★★★ 修正点 ★★★
// "_done" キーのみで判定する。データ本体のキーは使わない。
// データ本体（evening_YYYY-MM-DD）は朝の比較バナー表示用であり、
// 記録完了の判定には使うべきではない。
// ============================================
// 例: morning_2024-06-01_done が存在すれば朝の記録は完了とみなす
function getLocalRecordStatus(dateKey) {
  const morningDone = !!localStorage.getItem("morning_" + dateKey + "_done");
  const eveningDone = !!localStorage.getItem("evening_" + dateKey + "_done");

  // 🔴 追加：dateKeyも一緒に返す
  return {
    morningDone,
    eveningDone,
    dateKey: dateKey // ← どの日付の状態か識別するため
  };
}

// ============================================
// GASから記録状態を取得する
// 取得できない場合はlocalStorageにフォールバック
// ============================================
async function fetchRecordStatus(dateKey) {
  try {
    const res = await fetch(`${GAS_URL}?action=getRecordStatus&date=${dateKey}`);
    const data = await res.json();

    if (data.status === "ok") {
      const morningDone = !!data.morningDone;
      const eveningDone = !!data.eveningDone;

      // localStorage同期
      /*
      if (morningDone) {
        localStorage.setItem("morning_" + dateKey + "_done", "1");
      } else {
        localStorage.removeItem("morning_" + dateKey + "_done");
      }

      if (eveningDone) {
        localStorage.setItem("evening_" + dateKey + "_done", "1");
      } else {
        localStorage.removeItem("evening_" + dateKey + "_done");
      }

      */
      const local = getLocalRecordStatus(dateKey);

      return {
        // 🔴 ローカル優先（trueなら絶対true）
        morningDone: local.morningDone || morningDone,
        eveningDone: local.eveningDone || eveningDone,
        dateKey: dateKey
      };
    }
  } catch (e) {
    console.warn("記録状態の取得に失敗しました（localStorageで判定します）:", e);
  }

  // フォールバックも同じ形式にする
  return getLocalRecordStatus(dateKey);
}

// ============================================
// ボトムナビの「記録」タブをタップしたときの処理
// ============================================
async function navigateToRecord() {
  const status = await fetchRecordStatus(logicalDate);
  const { morningDone, eveningDone } = status;

  if (isGracePeriod() && morningDone && !eveningDone) {
    window.location.href = "evening.html?date=" + logicalDate;
  } else if (!morningDone) {
    window.location.href = "index.html";
  } else if (!eveningDone) {
    window.location.href = "evening.html";
  } else {
    showRecordCompleteMessage();
  }
}

function showRecordCompleteMessage() {
  const msg = "✅ 今日の記録はすべて完了しています！\n\n朝の記録を修正する場合は「朝の記録」、\n夜の振り返りを修正する場合は「夜の振り返り」を選んでください。";
  if (confirm(msg + "\n\n朝の記録を開きますか？（キャンセルで夜の振り返りを開きます）")) {
    window.location.href = "index.html";
  } else {
    window.location.href = "evening.html";
  }
}

// ============================================
// ページ読み込み時：状態を取得してバナー表示
// ============================================
document.addEventListener("DOMContentLoaded", async function() {

  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  const actualToday = getActualToday();
  const logicalDate = getLogicalDate();
  const yesterdayKey = getYesterdayKey();

  const [todayStatus, logicalStatus, yesterdayStatus] = await Promise.all([
    fetchRecordStatus(actualToday),
    fetchRecordStatus(logicalDate),
    fetchRecordStatus(yesterdayKey)
  ]);

  const decision = decideNavigation(currentPage, {
    isGrace: isGracePeriod(),
    todayStatus,
    logicalStatus,
    yesterdayStatus
  });

  executeNavigation(decision, {
    today: actualToday,
    logical: logicalDate,
    yesterday: yesterdayKey
  });
});

// ============================================
// バナー表示関数
// ============================================

function showYesterdayEveningBanner(dateKey) {
  const banner = createBanner(
    "🌙 " + dateKey + " の夜の振り返りが未完了です",
    "タップして振り返りを記録しましょう。",
    "#fff8e1",
    "#f57f17"
  );
  banner.style.cursor = "pointer";
  banner.onclick = () => {
    window.location.href = "evening.html?date=" + dateKey;
  };

  const container = document.querySelector(".container");
  if (container) {
    const dateSection = document.getElementById("dateSection");
    if (dateSection && dateSection.nextSibling) {
      container.insertBefore(banner, dateSection.nextSibling);
    } else {
      container.insertBefore(banner, container.firstChild);
    }
  }
}

function showEveningPromptBanner() {
  const banner = createBanner(
    "🌙 夜の振り返りへ",
    "朝の記録は完了しています。夜の振り返りを入力しましょう。",
    "#e8f5e9",
    "#2e7d32"
  );
  banner.style.cursor = "pointer";
  banner.onclick = () => { window.location.href = "evening.html"; };

  const container = document.querySelector(".container");
  if (container) {
    const dateSection = document.getElementById("dateSection");
    if (dateSection && dateSection.nextSibling) {
      container.insertBefore(banner, dateSection.nextSibling);
    } else {
      container.insertBefore(banner, container.firstChild);
    }
  }
}

function showAllDoneBanner() {
  const banner = createBanner(
    "✅ 今日の記録は完了しています",
    "朝・夜ともに記録済みです。お疲れさまでした！",
    "#e3f2fd",
    "#1565c0"
  );

  const container = document.querySelector(".container");
  if (container) {
    const dateSection = document.getElementById("dateSection");
    if (dateSection && dateSection.nextSibling) {
      container.insertBefore(banner, dateSection.nextSibling);
    } else {
      container.insertBefore(banner, container.firstChild);
    }
  }
}

function createBanner(title, message, bgColor, textColor) {
  const banner = document.createElement("div");
  banner.style.cssText = `
    background: ${bgColor};
    border: 1px solid ${textColor}44;
    border-radius: 10px;
    padding: 12px 16px;
    margin: 12px 0;
    font-size: 14px;
    color: ${textColor};
  `;
  banner.innerHTML = `<strong>${title}</strong>  
${message}`;
  return banner;
}

// ============================================
// 定期的に記録状態をチェックし、自動遷移する（30秒ごと）
// ============================================
function runAutoSync() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  const actualToday = getActualToday();
  const logicalDate = getLogicalDate();
  const yesterdayKey = getYesterdayKey();

  Promise.all([
    fetchRecordStatus(actualToday),
    fetchRecordStatus(logicalDate),
    fetchRecordStatus(yesterdayKey)
  ]).then(([todayStatus, logicalStatus, yesterdayStatus]) => {

    const decision = decideNavigation(currentPage, {
      isGrace: isGracePeriod(),
      todayStatus,
      logicalStatus,
      yesterdayStatus
    });

    executeNavigation(decision, {
      today: actualToday,
      logical: logicalDate,
      yesterday: yesterdayKey
    });

  });
}

setInterval(runAutoSync, 30000);

window.getLogicalDate = getLogicalDate;
