// ============================================
// 02_api.gs — API エンドポイント・データ受信・設定管理
// ============================================

// ============================================
// doPost: フロントエンドからのデータ受信
// ============================================
function doPost(e) {
  try {
    var params = e.parameter;
    var recordType = params.recordType || "morning";

    if (recordType === "settings") {
      return saveSettings(params);
    } else if (recordType === "evening") {
      var result = saveEveningRecord(params);
      // 記録状態を更新
      markRecordDone(params.date || "", "evening");
      return result;
    } else {
      var result = saveMorningRecord(params);
      // 記録状態を更新
      markRecordDone(params.date || "", "morning");
      return result;
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================
// doGet: 分析ページ用データ取得API
// ============================================
function doGet(e) {
  var action = e && e.parameter ? e.parameter.action : "";

  if (action === "getData") {
    return getAnalysisData();
  }

  if (action === "getSettings") {
    return getSettings();
  }

  if (action === "getRecordStatus") {
    var date = e.parameter.date || "";
    return getRecordStatus(date);
  }

  return ContentService.createTextOutput(JSON.stringify({ status: "ok", message: "コンディションノートAPI稼働中" }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// 朝の記録を保存
// ============================================
function saveMorningRecord(params) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("朝の記録");
  if (!sheet) {
    setupMorningHeaders();
    sheet = ss.getSheetByName("朝の記録");
  }

  // 就寝・起床時刻の組み立て
  var bedtime = "";
  if (params.bedtimeHour !== "" && params.bedtimeMinute !== "") {
    bedtime = params.bedtimeHour + "時" + (params.bedtimeMinute === "0" ? "00" : params.bedtimeMinute) + "分";
  }
  var wakeuptime = "";
  if (params.wakeuptimeHour !== "" && params.wakeuptimeMinute !== "") {
    wakeuptime = params.wakeuptimeHour + "時" + (params.wakeuptimeMinute === "0" ? "00" : params.wakeuptimeMinute) + "分";
  }

  // 総睡眠時間の計算
  var sleepTime = "";
  var bh = parseInt(params.bedtimeHour), bm = parseInt(params.bedtimeMinute) || 0;
  var wh = parseInt(params.wakeuptimeHour), wm = parseInt(params.wakeuptimeMinute) || 0;
  var wakeupDur = parseInt(params.wakeupDuration) || 0;
  if (!isNaN(bh) && !isNaN(wh)) {
    var bedMin = bh * 60 + bm;
    var wakeMin = wh * 60 + wm;
    if (wakeMin <= bedMin) wakeMin += 24 * 60;
    var totalMin = wakeMin - bedMin - wakeupDur;
    if (totalMin < 0) totalMin = 0;
    sleepTime = Math.floor(totalMin / 60) + "時間" + (totalMin % 60) + "分";
  }

  // 昨日との比較の日本語変換
  var compareMap = { "better": "良い", "same": "同じ", "worse": "悪い" };
  var compareLabel = compareMap[params.compareYesterday] || params.compareYesterday || "";

  var now = new Date();
  var row = [
    Utilities.formatDate(now, "Asia/Tokyo", "yyyy-MM-dd HH:mm:ss"),
    "朝の記録",
    params.condition  || "",
    params.energy     || "",
    params.mental     || "",
    compareLabel,
    params.weather    || "",
    params.temp       || "",
    params.pressure   || "",
    params.pressureWarning || "",
    params.sleepType  || "",
    bedtime,
    wakeuptime,
    params.wakeupDuration || "",
    sleepTime,
    params.goodSigns  || "",
    params.badSigns   || "",
    params.comment    || ""
  ];

  sheet.appendRow(row);

  return ContentService.createTextOutput(JSON.stringify({ status: "ok", type: "morning" }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// 夜の振り返りを保存
// ============================================
function saveEveningRecord(params) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("夜の振り返り");
  if (!sheet) {
    setupEveningHeaders();
    sheet = ss.getSheetByName("夜の振り返り");
  }

  var row = [
    params.date || Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyy-MM-dd"),
    "夜の振り返り",
    params.attendance || "",
    params.weather    || "",
    params.temp       || "",
    params.pressure   || "",
    params.pressureWarning || "",
    params.condition  || "",
    params.energy     || "",
    params.mental     || "",
    params.factors    || "",
    params.comment    || ""
  ];

  sheet.appendRow(row);

  return ContentService.createTextOutput(JSON.stringify({ status: "ok", type: "evening" }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// 設定の保存
// ============================================
function saveSettings(params) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("設定");
  if (!sheet) {
    sheet = ss.insertSheet("設定");
    sheet.getRange("A1:B1").setValues([["キー", "値"]]);
    sheet.getRange("A1:B1").setBackground("#37474f").setFontColor("white").setFontWeight("bold");
  } else {
    // ヘッダー行以外をクリア
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, 2).clearContent();
  }

  var keys = [
    "zipcode", "goodSigns", "badSigns",
    "sleepTypes", "sleepSymbols"
  ];

  var rows = keys.map(function(key) {
    return [key, params[key] || ""];
  });

  sheet.getRange(2, 1, rows.length, 2).setValues(rows);

  return ContentService.createTextOutput(JSON.stringify({ status: "ok", type: "settings" }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// 設定の取得
// ============================================
function getSettings() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("設定");
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ status: "empty", settings: {} }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify({ status: "empty", settings: {} }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var settings = {};
  data.slice(1).forEach(function(row) {
    if (row[0]) settings[row[0]] = row[1] || "";
  });

  return ContentService.createTextOutput(JSON.stringify({ status: "ok", settings: settings }))
    .setMimeType(ContentService.MimeType.JSON);
}

