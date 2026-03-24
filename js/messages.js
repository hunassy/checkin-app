/*分析画面のコメント関連*/

/*体調アラートのメッセージ設定*/
export const messages = { 
  lowScore: (label, count) =>
    `⚠️ 直近7日間で${label}スコアが低い日が${count}日あります。無理のない範囲で振り返ってみましょう。`
};
sleepMental: (avg) =>
  `😴 「眠れなかった」日のメンタル平均が${avg.toFixed(1)}です。睡眠とメンタルに関係がある可能性があります`
noIssues: () =>
  "✅ 現時点で特に注意が必要なパターンは見られていません"