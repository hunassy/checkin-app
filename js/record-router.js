// ============================================
// record-router.js — 記録タブの自動切り替えロジック
// デバイス間同期対応版：GASから今日の記録状態を取得して判定
// ============================================

const GAS_URL = "https://script.google.com/macros/s/AKfycbxGIYLe3G7Z74wWUVnzb1GGPOT-eVgaCJuIlbnoxbSyTtPI4cr_5z5RSH56XGpfXlzmIA/exec";

function getTodayKeyForRouter( ) {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
}

// ============================================
// GASから今日の記録状態を取得する
// 取得できない場合はlocalStorageにフォールバック
// ============================================
async function fetchTodayStatus(today) {
  try {
    const res = await fetch(`${GAS_URL}?action=getRecordStatus&date=${today}`);
    const data = await res.json();
    if (data.status === "ok") {
      // GASの値でlocalStorageを上書き（同期）
      if (data.morningDone) {
        localStorage.setItem("morning_" + today, "1");
      }
      if (data.eveningDone) {
        localStorage.setItem("evening_" + today, "1");
      }
      return { morningDone: data.morningDone, eveningDone: data.eveningDone };
    }
  } catch (e) {
    console.warn("記録状態の取得に失敗しました（localStorageで判定します）:", e);
  }
  // フォールバック：localStorageで判定
  return {
    morningDone: !!localStorage.getItem("morning_" + today),
    eveningDone: !!localStorage.getItem("evening_" + today)
  };
}

// ============================================
// ボトムナビの「記録」タブをタップしたときの処理
// ============================================
async function navigateToRecord() {
  const today = getTodayKeyForRouter();
  const { morningDone, eveningDone } = await fetchTodayStatus(today);

  if (!morningDone) {
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
// ページ読み込み時：GASから状態を取得してバナー表示
// ============================================
document.addEventListener("DOMContentLoaded", async function() {
  const today = getTodayKeyForRouter();
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  // GASから状態を取得（localStorageも同期される）
  const { morningDone, eveningDone } = await fetchTodayStatus(today);

  // index.html（朝の記録）を開いたが、朝は済んでいて夜がまだの場合
  if (currentPage === "index.html" && morningDone && !eveningDone) {
    showEveningPromptBanner();
  }

  // index.html を開いたが、両方済んでいる場合
  if (currentPage === "index.html" && morningDone && eveningDone) {
    showAllDoneBanner();
  }

  // evening.html を開いたが、朝の記録がまだの場合
  if (currentPage === "evening.html" && !morningDone) {
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
});

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
