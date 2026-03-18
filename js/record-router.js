// ============================================
// record-router.js — 記録タブの自動切り替えロジック
// デバイス間同期対応版 + 猶予時間対応（午前0〜4時は前日扱い）
// ============================================

const GAS_URL = "https://script.google.com/macros/s/AKfycbxGIYLe3G7Z74wWUVnzb1GGPOT-eVgaCJuIlbnoxbSyTtPI4cr_5z5RSH56XGpfXlzmIA/exec";

// ============================================
// 日付ユーティリティ
// ============================================

// 「論理日付」を返す：午前0〜3:59は前日扱い、午前4時以降は当日
function getLogicalDate( ) {
  const now = new Date();
  if (now.getHours() < 4) {
    // 前日の日付を返す
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

// ============================================
// GASから記録状態を取得する
// 取得できない場合はlocalStorageにフォールバック
// ============================================
async function fetchRecordStatus(dateKey) {
  try {
    const res = await fetch(`${GAS_URL}?action=getRecordStatus&date=${dateKey}`);
    const data = await res.json();
    if (data.status === "ok") {
      // localStorageも同期
      if (data.morningDone) localStorage.setItem("morning_" + dateKey, "1");
      if (data.eveningDone) localStorage.setItem("evening_" + dateKey, "1");
      return { morningDone: data.morningDone, eveningDone: data.eveningDone };
    }
  } catch (e) {
    console.warn("記録状態の取得に失敗しました（localStorageで判定します）:", e);
  }
  return {
    morningDone: !!localStorage.getItem("morning_" + dateKey),
    eveningDone: !!localStorage.getItem("evening_" + dateKey)
  };
}

// ============================================
// ボトムナビの「記録」タブをタップしたときの処理
// ============================================
async function navigateToRecord() {
  const logicalDate = getLogicalDate();
  const { morningDone, eveningDone } = await fetchRecordStatus(logicalDate);

  if (isGracePeriod() && morningDone && !eveningDone) {
    // 猶予時間帯：前日の夜の振り返りが未完了 → 夜の振り返りへ（前日日付付き）
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
  const actualToday = getActualToday();
  const yesterdayKey = getYesterdayKey();
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  // index.html の場合のバナー表示ロジック
  if (currentPage === "index.html") {

    // --- 猶予時間帯（午前0〜4時）---
    if (isGracePeriod()) {
      // 猶予時間帯では「前日」の状態を確認
      const logicalDate = getLogicalDate(); // = 前日
      const { morningDone, eveningDone } = await fetchRecordStatus(logicalDate);

      if (morningDone && !eveningDone) {
        // 前日の朝は済み、夜がまだ → 夜の振り返りを促す
        showYesterdayEveningBanner(logicalDate);
        return;
      }
      if (morningDone && eveningDone) {
        // 前日の朝・夜ともに完了 → 完了バナー
        showAllDoneBanner();
        return;
      }
      // 前日の朝もまだ → 通常表示（朝の記録フォームをそのまま表示）
      return;
    }

    // --- 午前4時以降の通常処理 ---

    // 1) まず昨日の夜が未完了かチェック
    const yesterdayStatus = await fetchRecordStatus(yesterdayKey);
    if (yesterdayStatus.morningDone && !yesterdayStatus.eveningDone) {
      showYesterdayEveningBanner(yesterdayKey);
    }

    // 2) 今日の記録状態をチェック
    const todayStatus = await fetchRecordStatus(actualToday);

    if (todayStatus.morningDone && todayStatus.eveningDone) {
      // 今日は朝・夜ともに完了
      showAllDoneBanner();
    } else if (todayStatus.morningDone && !todayStatus.eveningDone) {
      // 今日の朝は完了、夜はまだ
      showEveningPromptBanner();
    }
    // 朝がまだの場合は何も表示しない（そのまま朝の記録フォーム）
  }

  // evening.html を開いたが、朝の記録がまだの場合（猶予時間帯以外）
  if (currentPage === "evening.html" && !isGracePeriod()) {
    const todayStatus = await fetchRecordStatus(actualToday);
    // URLに?date=パラメータがない場合のみ警告
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.get("date") && !todayStatus.morningDone) {
      const banner = createBanner(
        "⚠️ 朝の記録がまだです",
        "先に朝の記録を入力してください。",
        "#fff3e0",
        "#e65100"
      );
      const container = document.querySelector(".container");
      if (container) {
        container.insertBefore(banner, container.firstChild.nextSibling);
      }
    }
  }
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
    // 前日日付を evening.html に渡す
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
