// ============================================
// 04_dashboard.gs — ダッシュボード更新・分析データ取得
// ============================================

// ============================================
// 分析ページ用データ取得
// ============================================
function getAnalysisData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var morningSheet = ss.getSheetByName("朝の記録");

  if (!morningSheet) {
    return ContentService.createTextOutput(JSON.stringify({ error: "朝の記録シートが見つかりません" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var data = morningSheet.getDataRange().getValues();
  if (data.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify({ records: [], count: 0 }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var rows = data.slice(1);
  // 直近90件のみ返す
  var recent = rows.slice(-90);

  var records = recent.map(function(row) {
    // ヘッダー順: 記録日時[0] 記録種別[1] 体調[2] 活力[3] メンタル[4]
    // 昨日比較[5] 天気[6] 気温[7] 気圧[8] 気圧注意度[9]
    // 睡眠タイプ[10] 就寝[11] 起床[12] 途中起床[13] 総睡眠[14]
    // Good[15] Bad[16] コメント[17]
    return {
      date:             row[0] ? Utilities.formatDate(new Date(row[0]), "Asia/Tokyo", "yyyy-MM-dd") : "",
      recordType:       row[1] || "morning",
      condition:        parseFloat(row[2]) || null,
      energy:           parseFloat(row[3]) || null,
      mental:           parseFloat(row[4]) || null,
      compareYesterday: row[5] || "",
      weather:          row[6] || "",
      temp:             parseFloat(row[7]) || null,
      pressure:         parseFloat(row[8]) || null,
      pressureWarning:  row[9] || "",
      sleepType:        row[10] || "",
      bedtime:          row[11] || "",
      wakeuptime:       row[12] || "",
      wakeupDuration:   parseFloat(row[13]) || null,
      sleepTime:        row[14] || "",
      good:             row[15] || "",
      bad:              row[16] || "",
      comment:          row[17] || ""
    };
  });

  // 夜の振り返りデータも取得
  var eveningSheet = ss.getSheetByName("夜の振り返り");
  var eveningRecords = [];
  if (eveningSheet) {
    var eData = eveningSheet.getDataRange().getValues();
    if (eData.length > 1) {
      eveningRecords = eData.slice(1).slice(-90).map(function(row) {
        // ヘッダー順: 記録日時[0] 記録種別[1] 通所/在宅[2]
        // 天気[3] 気温[4] 気圧[5] 気圧注意度[6]
        // 体調[7] 活力[8] メンタル[9] 影響要因[10] コメント[11]
        return {
          date:            row[0] ? Utilities.formatDate(new Date(row[0]), "Asia/Tokyo", "yyyy-MM-dd") : "",
          recordType:      "evening",
          attendance:      row[2] || "",
          weather:         row[3] || "",
          temp:            parseFloat(row[4]) || null,
          pressure:        parseFloat(row[5]) || null,
          pressureWarning: row[6] || "",
          condition:       parseFloat(row[7]) || null,
          energy:          parseFloat(row[8]) || null,
          mental:          parseFloat(row[9]) || null,
          factors:         row[10] || "",
          comment:         row[11] || ""
        };
      });
    }
  }

  // 朝夜マージデータ（日付をキーに朝・夜を紐付け）
  var mergedByDate = buildMergedData(records, eveningRecords);

  return ContentService.createTextOutput(JSON.stringify({
    records: records,
    eveningRecords: eveningRecords,
    mergedByDate: mergedByDate,
    count: records.length
  })).setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// ダッシュボード更新（朝・夜の比較分析を含む）
// ============================================
function updateDashboard() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var morningSheet = ss.getSheetByName("朝の記録");
  if (!morningSheet) {
    try { SpreadsheetApp.getUi().alert("「朝の記録」シートが見つかりません。先にヘッダーを初期設定してください。"); } catch(e) {}
    return;
  }

  var data = morningSheet.getDataRange().getValues();
  if (data.length <= 1) {
    try { SpreadsheetApp.getUi().alert("データがまだありません。記録を送信してください。"); } catch(e) {}
    return;
  }

  var morningRows = data.slice(1);

  // 夜の振り返りデータ取得
  var eveningRows = [];
  var eveningSheet = ss.getSheetByName("夜の振り返り");
  if (eveningSheet) {
    var eData = eveningSheet.getDataRange().getValues();
    if (eData.length > 1) eveningRows = eData.slice(1);
  }

  var dashSheet = ss.getSheetByName("ダッシュボード");
  if (!dashSheet) {
    dashSheet = ss.insertSheet("ダッシュボード");
  } else {
    dashSheet.clearContents();
    dashSheet.clearFormats();
    dashSheet.getCharts().forEach(function(c) { dashSheet.removeChart(c); });
  }

  var now = new Date();
  dashSheet.getRange("A1").setValue("📊 コンディションノート ダッシュボード");
  dashSheet.getRange("A1").setFontSize(16).setFontWeight("bold").setFontColor("#2e7d32");
  dashSheet.getRange("A2").setValue("最終更新：" + Utilities.formatDate(now, "Asia/Tokyo", "yyyy年MM月dd日 HH:mm"));
  dashSheet.getRange("A2").setFontColor("#757575").setFontSize(10);

  var currentRow = 4;

  // --- 直近7日間の平均スコア（朝） ---
  var last7morning = morningRows.slice(-7);
  var avgMorning = calcAverages(last7morning, 2, 3, 4);

  dashSheet.getRange(currentRow, 1).setValue("📅 直近7日間の平均スコア（朝）");
  dashSheet.getRange(currentRow, 1).setFontSize(13).setFontWeight("bold");
  currentRow++;

  var morningAvgData = [
    ["体調", avgMorning.condition.toFixed(1), getScoreLabel(avgMorning.condition)],
    ["活力", avgMorning.energy.toFixed(1), getScoreLabel(avgMorning.energy)],
    ["メンタル", avgMorning.mental.toFixed(1), getScoreLabel(avgMorning.mental)]
  ];
  dashSheet.getRange(currentRow, 1, 1, 3).setValues([["項目", "平均スコア", "評価"]]);
  dashSheet.getRange(currentRow, 1, 1, 3).setBackground("#e8f5e9").setFontWeight("bold").setHorizontalAlignment("center");
  currentRow++;
  dashSheet.getRange(currentRow, 1, 3, 3).setValues(morningAvgData);
  dashSheet.getRange(currentRow, 1, 3, 3).setHorizontalAlignment("center").setBorder(true,true,true,true,true,true);
  for (var i = 0; i < 3; i++) {
    var c = getScoreColor(parseFloat(morningAvgData[i][1]));
    dashSheet.getRange(currentRow + i, 2).setBackground(c);
    dashSheet.getRange(currentRow + i, 3).setBackground(c);
  }
  currentRow += 4;

  // --- 直近7日間の平均スコア（夜） ---
  if (eveningRows.length > 0) {
    var last7evening = eveningRows.slice(-7);
    var avgEvening = calcAverages(last7evening, 7, 8, 9);

    dashSheet.getRange(currentRow, 1).setValue("🌙 直近7日間の平均スコア（夜）");
    dashSheet.getRange(currentRow, 1).setFontSize(13).setFontWeight("bold");
    currentRow++;

    var eveningAvgData = [
      ["体調", avgEvening.condition.toFixed(1), getScoreLabel(avgEvening.condition)],
      ["活力", avgEvening.energy.toFixed(1), getScoreLabel(avgEvening.energy)],
      ["メンタル", avgEvening.mental.toFixed(1), getScoreLabel(avgEvening.mental)]
    ];
    dashSheet.getRange(currentRow, 1, 1, 3).setValues([["項目", "平均スコア", "評価"]]);
    dashSheet.getRange(currentRow, 1, 1, 3).setBackground("#ede7f6").setFontWeight("bold").setHorizontalAlignment("center");
    currentRow++;
    dashSheet.getRange(currentRow, 1, 3, 3).setValues(eveningAvgData);
    dashSheet.getRange(currentRow, 1, 3, 3).setHorizontalAlignment("center").setBorder(true,true,true,true,true,true);
    for (var j = 0; j < 3; j++) {
      var ec = getScoreColor(parseFloat(eveningAvgData[j][1]));
      dashSheet.getRange(currentRow + j, 2).setBackground(ec);
      dashSheet.getRange(currentRow + j, 3).setBackground(ec);
    }
    currentRow += 4;
  }

  // --- 朝夜比較：スコアの変化が大きかった日（体と心のズレ） ---
  var mergedData = buildMergedDataFromRows(morningRows, eveningRows);
  var bigChangeDays = [];
  mergedData.forEach(function(d) {
    if (!d.morning || !d.evening) return;
    var mCond = parseFloat(d.morning[2]);
    var eCond = parseFloat(d.evening[7]);
    var mMental = parseFloat(d.morning[4]);
    var eMental = parseFloat(d.evening[9]);
    if (isNaN(mCond) || isNaN(eCond) || isNaN(mMental) || isNaN(eMental)) return;
    var condDiff = Math.abs(eCond - mCond);
    var mentalDiff = Math.abs(eMental - mMental);
    if (condDiff >= 2 || mentalDiff >= 2) {
      bigChangeDays.push({
        date: d.date,
        condChange: (eCond - mCond).toFixed(1),
        mentalChange: (eMental - mMental).toFixed(1)
      });
    }
  });

  if (bigChangeDays.length > 0) {
    dashSheet.getRange(currentRow, 1).setValue("⚠️ 朝→夜でスコアが大きく変化した日（直近30日）");
    dashSheet.getRange(currentRow, 1).setFontSize(13).setFontWeight("bold");
    currentRow++;
    dashSheet.getRange(currentRow, 1, 1, 3).setValues([["日付", "体調の変化", "メンタルの変化"]]);
    dashSheet.getRange(currentRow, 1, 1, 3).setBackground("#fff3e0").setFontWeight("bold").setHorizontalAlignment("center");
    currentRow++;
    var changeData = bigChangeDays.slice(-10).map(function(d) {
      return [
        d.date,
        (parseFloat(d.condChange) > 0 ? "+" : "") + d.condChange,
        (parseFloat(d.mentalChange) > 0 ? "+" : "") + d.mentalChange
      ];
    });
    dashSheet.getRange(currentRow, 1, changeData.length, 3).setValues(changeData);
    dashSheet.getRange(currentRow, 1, changeData.length, 3).setHorizontalAlignment("center");
    currentRow += changeData.length + 2;
  }

  // --- 低空飛行期間（朝・夜の平均スコアで判定） ---
  var lowFlightDays = detectLowFlightPeriods(mergedData);
  if (lowFlightDays.length > 0) {
    dashSheet.getRange(currentRow, 1).setValue("📉 低空飛行期間（3日以上スコア平均2以下）");
    dashSheet.getRange(currentRow, 1).setFontSize(13).setFontWeight("bold");
    currentRow++;
    dashSheet.getRange(currentRow, 1, 1, 3).setValues([["開始日", "終了日", "日数"]]);
    dashSheet.getRange(currentRow, 1, 1, 3).setBackground("#fde8e8").setFontWeight("bold").setHorizontalAlignment("center");
    currentRow++;
    var lowData = lowFlightDays.map(function(p) { return [p.start, p.end, p.days + "日間"]; });
    dashSheet.getRange(currentRow, 1, lowData.length, 3).setValues(lowData);
    dashSheet.getRange(currentRow, 1, lowData.length, 3).setHorizontalAlignment("center");
    currentRow += lowData.length + 2;
  }

  dashSheet.autoResizeColumns(1, 4);
  try { ss.setActiveSheet(dashSheet); } catch(e) {}
  try { SpreadsheetApp.getUi().alert("ダッシュボードを更新しました！"); } catch(e) {}
}
