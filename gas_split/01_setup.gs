// ============================================
// 01_setup.gs — メニュー・トリガー・ヘッダー初期設定
// ============================================

// メニューを追加
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("📊 コンディションノート")
    .addItem("ヘッダーを初期設定", "setupAllHeaders")
    .addSeparator()
    .addItem("ダッシュボードを更新", "updateDashboard")
    .addItem("月次レポートを生成", "generateMonthlyReport")
    .addSeparator()
    .addItem("自動実行トリガーを設定", "setupTriggers")
    .addItem("自動実行トリガーを削除", "deleteTriggers")
    .addToUi();
}

// ============================================
// トリガー設定
// ============================================
function setupTriggers() {
  // 既存のトリガーを削除してから再設定
  deleteTriggers();

  // 毎日午前2時にダッシュボードを更新
  ScriptApp.newTrigger("updateDashboard")
    .timeBased()
    .everyDays(1)
    .atHour(2)
    .create();

  // 毎月1日 午前9時に月次レポートを生成
  ScriptApp.newTrigger("generateMonthlyReportAuto")
    .timeBased()
    .onMonthDay(1)
    .atHour(9)
    .create();

  SpreadsheetApp.getUi().alert(
    "✅ 自動実行トリガーを設定しました！\n\n" +
    "・毎日 午前2時 → ダッシュボードを自動更新\n" +
    "・毎月1日 午前9時 → 先月の月次レポートを自動生成"
  );
}

function deleteTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(trigger) {
    var fn = trigger.getHandlerFunction();
    if (fn === "updateDashboard" || fn === "generateMonthlyReportAuto") {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}

// トリガーから呼ばれる月次レポート生成（先月分を生成）
function generateMonthlyReportAuto() {
  var today = new Date();
  var lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  generateMonthlyReportForDate(lastMonth);
}

// ============================================
// シートのヘッダーを初期設定
// ============================================
function setupAllHeaders() {
  setupMorningHeaders();
  setupEveningHeaders();
  SpreadsheetApp.getUi().alert("朝の記録・夜の振り返りのヘッダーを設定しました！");
}

function setupMorningHeaders() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("朝の記録");
  if (!sheet) sheet = ss.insertSheet("朝の記録");

  var headers = [
    "記録日時", "記録種別",
    "体調(1-5)", "活力(1-5)", "メンタル(1-5)",
    "昨日との比較",
    "天気", "気温", "気圧", "気圧注意度",
    "睡眠タイプ",
    "就寝時刻", "起床時刻", "途中起床(分)", "総睡眠時間",
    "Goodサイン", "Badサイン",
    "コメント"
  ];

  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setBackground("#4CAF50");
  headerRange.setFontColor("white");
  headerRange.setFontWeight("bold");
  headerRange.setHorizontalAlignment("center");
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

function setupEveningHeaders() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("夜の振り返り");
  if (!sheet) sheet = ss.insertSheet("夜の振り返り");

  var headers = [
    "記録日時", "記録種別",
    "通所/在宅",
    "天気", "気温", "気圧", "気圧注意度",
    "体調(1-5)", "活力(1-5)", "メンタル(1-5)",
    "影響要因",
    "コメント"
  ];

  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setBackground("#5C6BC0");
  headerRange.setFontColor("white");
  headerRange.setFontWeight("bold");
  headerRange.setHorizontalAlignment("center");
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

