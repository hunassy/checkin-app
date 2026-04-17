// ============================================
// sync.js — 起動時にGASから設定を自動同期する
// ============================================

(function() {
  const gasUrl = APP_CONFIG.GAS_URL;

  // 設定をGASから取得してlocalStorageに反映
  fetch(gasUrl + "?action=getSettings&t=" + Date.now(), {
  cache: "no-store"
})
  .then(res => res.text())
  .then(text => {
    try {
      const data = JSON.parse(text);

      if (data.status !== "ok" || !data.settings) return;
      const s = data.settings;

      if (s.zipcode) localStorage.setItem("zipcode", s.zipcode);
      if (s.goodSigns) localStorage.setItem("goodSigns", s.goodSigns);
      if (s.badSigns) localStorage.setItem("badSigns", s.badSigns);
      if (s.sleepTypes) localStorage.setItem("sleepTypes", s.sleepTypes);
      if (s.sleepSymbols) localStorage.setItem("sleepSymbols", s.sleepSymbols);

      console.log("設定をサーバーから同期しました。");
    } catch (e) {
      console.warn("JSONじゃないレスポンス:", text);
    }
  })
  .catch(err => {
    console.warn("設定の同期に失敗しました:", err);
  });
})();