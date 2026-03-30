//=============================
// 分析ページのメッセージ定義
//=============================

export const messages = {
  /*体調アラート内*/
  lowScore: (label, count) =>
    `⚠️ 直近7日間で${label}スコアが低い日が${count}日あります。無理のない範囲で振り返ってみましょう。`,

  sleepMental: (avg) =>
    `😴 「眠れなかった」日のメンタル平均が${avg.toFixed(1)}です。睡眠とメンタルに関係がある可能性があります`,

  lowPressure: (count, avg) =>
    `🌧️ 低気圧の日(${count}件)の体調平均が${avg.toFixed(1)}です。体調に影響がある可能性があります`,

  noIssues: () =>
    "✅ 現時点で特に注意が必要なパターンは見られていません",

  /*気圧×体調スコアの相関内*/
  correlation: (label, level) => {
    if (level === "positive") {
    return `${label}に関係がある可能性があります`;
    } else if (level === "negative") {
    return `${label}に関係がある可能性があります（低いと影響が出やすい傾向）`;
    } else {
    return `${label}にははっきりした関係は見られていません`;
    }
  }
};

export function getMindBodySummaryMessage(high, low, balanced) {
  if (high > low && high > balanced) {
    return "⚠️ 無理している日が多い傾向です";
  }
  if (low > high && low > balanced) {
    return "💭 気分が落ちやすい傾向があります";
  }
  return "✅ 安定して過ごせています";
}