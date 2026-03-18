// ============================================
// sync.js — 起動時にGASから設定を自動同期する
// ============================================

(function() {
  const gasUrl = APP_CONFIG.GAS_URL;

  // 設定をGASから取得してlocalStorageに反映
  fetch(gasUrl + "?action=getSettings" )
    .then(res => res.json())
    .then(data => {
      if (data.status !== "ok" || !data.settings) return;
      const s = data.settings;

      // zipcode
      if (s.zipcode) localStorage.setItem("zipcode", s.zipcode);

      // goodSigns（JSON文字列として保存されている）
      if (s.goodSigns) localStorage.setItem("goodSigns", s.goodSigns);

      // badSigns
      if (s.badSigns) localStorage.setItem("badSigns", s.badSigns);

      // sleepTypes
      if (s.sleepTypes) localStorage.setItem("sleepTypes", s.sleepTypes);

      // sleepSymbols
      if (s.sleepSymbols) localStorage.setItem("sleepSymbols", s.sleepSymbols);

      console.log("設定をサーバーから同期しました。");
    })
    .catch(err => {
      // 同期失敗はサイレントに無視（localStorageの値をそのまま使う）
      console.warn("設定の同期に失敗しました:", err);
    });
})();
