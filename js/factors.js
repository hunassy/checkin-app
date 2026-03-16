// ============================================
// factors.js — 影響要因チェックリスト
// ============================================

const DEFAULT_FACTORS = [
  // 人との関わり
  { id: "talked",     label: "人と話した",       category: "social" },
  { id: "alone",      label: "ひとりで過ごした",  category: "social" },
  { id: "crowded",    label: "人が多い場所にいた", category: "social" },
  // 活動
  { id: "went_out",   label: "外出した",          category: "activity" },
  { id: "exercised",  label: "体を動かした",       category: "activity" },
  { id: "did_nothing",label: "何もできなかった",   category: "activity" },
  // 環境・予定
  { id: "busy",       label: "予定が多かった",     category: "schedule" },
  { id: "changed",    label: "急な予定変更があった",category: "schedule" },
  { id: "quiet",      label: "静かに過ごせた",     category: "schedule" },
  // 身体
  { id: "ate_well",   label: "よく食べられた",     category: "body" },
  { id: "no_appetite",label: "食欲がなかった",     category: "body" },
  { id: "sunlight",   label: "日光を浴びた",       category: "body" },
  // 出来事
  { id: "bad_event",  label: "嫌なことがあった",   category: "event" },
  { id: "good_event", label: "うれしいことがあった",category: "event" },
  { id: "stressed",   label: "ストレスを感じた",   category: "event" },
];

// カテゴリ色
const FACTOR_CATEGORY_COLOR = {
  social:   "#e3f2fd",
  activity: "#e8f5e9",
  schedule: "#fff3e0",
  body:     "#fce4ec",
  event:    "#f3e5f5",
};

function renderFactorList(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";

  DEFAULT_FACTORS.forEach(factor => {
    const label = document.createElement("label");
    label.className = "factor-item";
    label.style.background = FACTOR_CATEGORY_COLOR[factor.category] || "#f5f5f5";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.id = "factor_" + factor.id;
    cb.value = factor.id;
    cb.name = "factor";

    label.appendChild(cb);
    label.appendChild(document.createTextNode(" " + factor.label));
    container.appendChild(label);
  });
}

function getSelectedFactors() {
  return [...document.querySelectorAll("#factorList input:checked")].map(cb => cb.value);
}

function getFactorLabel(id) {
  const f = DEFAULT_FACTORS.find(f => f.id === id);
  return f ? f.label : id;
}

// ページ読み込み時に描画
document.addEventListener("DOMContentLoaded", function() {
  renderFactorList("factorList");

  // 昨日との比較ボタンのクリック処理
  const compareBtns = document.querySelectorAll(".compare-btn");
  compareBtns.forEach(btn => {
    btn.addEventListener("click", function() {
      compareBtns.forEach(b => b.classList.remove("active"));
      this.classList.add("active");
    });
  });
});
