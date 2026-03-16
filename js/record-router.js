// ============================================
// record-router.js — 記録タブの自動切り替えロジック
// ============================================
// 使用方法：
//   ボトムナビの「記録」タブのリンクを href="javascript:void(0)" にして
//   onclick="navigateToRecord()" を呼び出す

function getTodayKeyForRouter() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
}

function navigateToRecord() {
  const today = getTodayKeyForRouter();
  const morningDone = !!localStorage.getItem("morning_" + today);
  const eveningDone = !!localStorage.getItem("evening_" + today);

  if (!morningDone) {
    // 朝の記録がまだ → 朝の記録へ
    window.location.href = "index.html";
  } else if (!eveningDone) {
    // 朝は済んでいるが夜がまだ → 夜の振り返りへ
    window.location.href = "evening.html";
  } else {
    // 両方済んでいる → 完了メッセージ
    showRecordCompleteMessage();
  }
}

function showRecordCompleteMessage() {
  // すでに完了ページにいる場合はメッセージを表示
  const msg = "✅ 今日の記録はすべて完了しています！\n\n朝の記録を修正する場合は「朝の記録」、\n夜の振り返りを修正する場合は「夜の振り返り」を選んでください。";
  if (confirm(msg + "\n\n朝の記録を開きますか？（キャンセルで夜の振り返りを開きます）")) {
    window.location.href = "index.html";
  } else {
    window.location.href = "evening.html";
  }
}

// ページ読み込み時に現在のページが適切かチェック（自動リダイレクト）
document.addEventListener("DOMContentLoaded", function() {
  const today = getTodayKeyForRouter();
  const morningDone = !!localStorage.getItem("morning_" + today);
  const eveningDone = !!localStorage.getItem("evening_" + today);
  const currentPage = window.location.pathname.split("/").pop();

  // index.html（朝の記録）を開いたが、朝は済んでいて夜がまだの場合
  if (currentPage === "index.html" && morningDone && !eveningDone) {
    // 自動リダイレクトはせず、バナーで案内する
    showEveningPromptBanner();
  }

  // evening.html を開いたが、朝の記録がまだの場合
  if (currentPage === "evening.html" && !morningDone) {
    const banner = createBanner(
      "⚠️ 朝の記録がまだです",
      "先に朝の記録を入力してください。",
      "#fff3e0",
      "#e65100"
    );
    document.querySelector(".container").insertBefore(banner, document.querySelector(".container").firstChild.nextSibling);
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
    // 日付セクションの後に挿入
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
  banner.innerHTML = `<strong>${title}</strong><br>${message}`;
  return banner;
}
