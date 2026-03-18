// ============================================
// factors.js — 影響要因チェックリスト
// ============================================

const DEFAULT_FACTORS = [
  // 人との関わり
  { id: "人と話した",  label: "人と話した",  category: "social" },
  { id: "ひとりで過ごした",  label: "ひとりで過ごした",  category: "social" },
  { id: "人と過ごした",  label: "人と過ごした", category: "social" },
  // 活動
  { id: "外出した",   label: "外出した",  category: "activity" },
  { id: "家事をした",  label: "家事をした",  category: "activity" },
  { id: "何もできなかった",label: "何もできなかった",  category: "activity" },
  { id: "お風呂に入った",  label: "お風呂に入った",   category: "activity" },
  // 環境・予定
  { id: "予定が多かった",  label: "予定が多かった",  category: "schedule" },
  { id: "急な予定変更があった",  label: "急な予定変更があった",category: "schedule" },
  { id: "静かに過ごせた",  label: "静かに過ごせた",  category: "schedule" },
  // 身体
  { id: "よく食べられた",   label: "よく食べられた",  category: "body" },
  { id: "食欲がなかった",label: "食欲がなかった",  category: "body" },
  { id: "日光を浴びた",   label: "日光を浴びた",  category: "body" },
  // 出来事
  { id: "嫌なことがあった",  label: "嫌なことがあった",  category: "event" },
  { id: "うれしいことがあった", label: "うれしいことがあった",category: "event" },
  { id: "ストレスを感じた",  label: "ストレスを感じた",  category: "event" },
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
});
