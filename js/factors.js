// factors.js — 階層化された影響要因
const FACTOR_STEPS = {
  // ステップ1: 誰と過ごしたか（常に表示）
  social: [
    { id: "alone", label: "一人で過ごした", category: "social" },
    { id: "someone", label: "誰かと過ごした", category: "social" }
  ],
  // ステップ2: 場所（常に表示）
  location: [
    { id: "out", label: "外出した", category: "activity" },
    { id: "home", label: "家で過ごした", category: "activity" }
  ],
  // ステップ3: 外出時のみ表示する詳細項目
  outDetails: [
    { id: "shopping", label: "買い物", category: "event" },
    { id: "hospital", label: "通院", category: "event" }
  ]
};

const FACTOR_CATEGORY_COLOR = {
  social:   "#e3f2fd",
  activity: "#e8f5e9",
  event:    "#f3e5f5",
};

// 互換性のために空の関数を置いておきます（エラー防止）
function renderFactorList(containerId) {
  // evening.js側で新しい描画ロジックを動かすため、ここは空でOK
}