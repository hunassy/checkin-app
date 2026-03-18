// ============================================
// 05_report.gs — 月次レポート生成・ユーティリティ関数
// ============================================

// ============================================
// 月次レポート生成
// ============================================
function generateMonthlyReport() {
  generateMonthlyReportForDate(new Date());
}

function generateMonthlyReportForDate(targetDate) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var morningSheet = ss.getSheetByName("朝の記録");
  if (!morningSheet) {
    try { SpreadsheetApp.getUi().alert("「朝の記録」シートが見つかりません。"); } catch(e) {}
    return;
  }

  var data = morningSheet.getDataRange().getValues();
  if (data.length <= 1) {
    try { SpreadsheetApp.getUi().alert("データがまだありません。"); } catch(e) {}
    return;
  }

  var morningRows = data.slice(1);
  var thisMonth = targetDate.getMonth();
  var thisYear = targetDate.getFullYear();

  var monthMorningRows = morningRows.filter(function(row) {
    if (!row[0]) return false;
    var d = new Date(row[0]);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  if (monthMorningRows.length === 0) {
    try { SpreadsheetApp.getUi().alert("対象月のデータがまだありません。"); } catch(e) {}
    return;
  }

  // 夜のデータも取得
  var eveningRows = [];
  var eveningSheet = ss.getSheetByName("夜の振り返り");
  if (eveningSheet) {
    var eData = eveningSheet.getDataRange().getValues();
    if (eData.length > 1) {
      eveningRows = eData.slice(1).filter(function(row) {
        if (!row[0]) return false;
        var d = new Date(row[0]);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      });
    }
  }

  var monthName = Utilities.formatDate(targetDate, "Asia/Tokyo", "yyyy年MM月");
  var reportSheetName = monthName + "レポート";
  var reportSheet = ss.getSheetByName(reportSheetName);
  if (reportSheet) ss.deleteSheet(reportSheet);
  reportSheet = ss.insertSheet(reportSheetName);

  reportSheet.getRange("A1").setValue("📋 " + monthName + " 月次レポート");
  reportSheet.getRange("A1").setFontSize(16).setFontWeight("bold").setFontColor("#1a237e");
  reportSheet.getRange("A2").setValue("朝の記録日数：" + monthMorningRows.length + "日　夜の振り返り日数：" + eveningRows.length + "日");

  // 朝の平均スコア
  var avgMorning = calcAverages(monthMorningRows, 2, 3, 4);
  var avgData = [
    ["体調（朝）", avgMorning.condition.toFixed(1), getScoreLabel(avgMorning.condition)],
    ["活力（朝）", avgMorning.energy.toFixed(1), getScoreLabel(avgMorning.energy)],
    ["メンタル（朝）", avgMorning.mental.toFixed(1), getScoreLabel(avgMorning.mental)]
  ];

  // 夜の平均スコアも追加
  if (eveningRows.length > 0) {
    var avgEvening = calcAverages(eveningRows, 7, 8, 9);
    avgData.push(
      ["体調（夜）", avgEvening.condition.toFixed(1), getScoreLabel(avgEvening.condition)],
      ["活力（夜）", avgEvening.energy.toFixed(1), getScoreLabel(avgEvening.energy)],
      ["メンタル（夜）", avgEvening.mental.toFixed(1), getScoreLabel(avgEvening.mental)]
    );
  }

  reportSheet.getRange("A4").setValue("📊 月間平均スコア");
  reportSheet.getRange("A4").setFontSize(13).setFontWeight("bold");
  reportSheet.getRange(5, 1, 1, 3).setValues([["項目", "平均", "評価"]]);
  reportSheet.getRange(5, 1, 1, 3).setBackground("#283593").setFontColor("white").setFontWeight("bold").setHorizontalAlignment("center");
  reportSheet.getRange(6, 1, avgData.length, 3).setValues(avgData);
  reportSheet.getRange(6, 1, avgData.length, 3).setHorizontalAlignment("center");
  for (var i = 0; i < avgData.length; i++) {
    var color = getScoreColor(parseFloat(avgData[i][1]));
    reportSheet.getRange(6 + i, 2).setBackground(color);
    reportSheet.getRange(6 + i, 3).setBackground(color);
  }

  var nextRow = 6 + avgData.length + 2;

  // 朝夜比較：スコア変化が大きかった日
  var mergedData = buildMergedDataFromRows(monthMorningRows, eveningRows);
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
    reportSheet.getRange(nextRow, 1).setValue("⚠️ 朝→夜でスコアが大きく変化した日");
    reportSheet.getRange(nextRow, 1).setFontSize(13).setFontWeight("bold");
    nextRow++;
    reportSheet.getRange(nextRow, 1, 1, 3).setValues([["日付", "体調の変化", "メンタルの変化"]]);
    reportSheet.getRange(nextRow, 1, 1, 3).setBackground("#fff3e0").setFontWeight("bold").setHorizontalAlignment("center");
    nextRow++;
    var changeData = bigChangeDays.map(function(d) {
      return [
        d.date,
        (parseFloat(d.condChange) > 0 ? "+" : "") + d.condChange,
        (parseFloat(d.mentalChange) > 0 ? "+" : "") + d.mentalChange
      ];
    });
    reportSheet.getRange(nextRow, 1, changeData.length, 3).setValues(changeData);
    reportSheet.getRange(nextRow, 1, changeData.length, 3).setHorizontalAlignment("center");
    nextRow += changeData.length + 2;
  }

  // 日別データ（朝）
  reportSheet.getRange(nextRow, 1).setValue("📅 日別データ（朝の記録）");
  reportSheet.getRange(nextRow, 1).setFontSize(13).setFontWeight("bold");
  nextRow++;

  var dayHeaders = [["日付", "体調", "活力", "メンタル", "昨日との比較", "睡眠タイプ", "総睡眠時間", "Goodサイン", "Badサイン"]];
  reportSheet.getRange(nextRow, 1, 1, 9).setValues(dayHeaders);
  reportSheet.getRange(nextRow, 1, 1, 9).setBackground("#e8eaf6").setFontWeight("bold").setHorizontalAlignment("center");
  nextRow++;

  var dayData = monthMorningRows.map(function(row) {
    return [
      row[0] ? Utilities.formatDate(new Date(row[0]), "Asia/Tokyo", "MM/dd(E)") : "",
      row[2] || "", row[3] || "", row[4] || "",
      row[5] || "",
      row[10] || "",
      row[14] || "",
      row[15] || "", row[16] || ""
    ];
  });

  if (dayData.length > 0) {
    reportSheet.getRange(nextRow, 1, dayData.length, 9).setValues(dayData);
    reportSheet.getRange(nextRow, 1, dayData.length, 9).setHorizontalAlignment("center");
    nextRow += dayData.length + 2;
  }

  // 日別データ（夜）
  if (eveningRows.length > 0) {
    reportSheet.getRange(nextRow, 1).setValue("🌙 日別データ（夜の振り返り）");
    reportSheet.getRange(nextRow, 1).setFontSize(13).setFontWeight("bold");
    nextRow++;

    var eveningHeaders = [["日付", "通所/在宅", "体調", "活力", "メンタル", "影響要因", "コメント"]];
    reportSheet.getRange(nextRow, 1, 1, 7).setValues(eveningHeaders);
    reportSheet.getRange(nextRow, 1, 1, 7).setBackground("#ede7f6").setFontWeight("bold").setHorizontalAlignment("center");
    nextRow++;

    var eveningDayData = eveningRows.map(function(row) {
      return [
        row[0] ? Utilities.formatDate(new Date(row[0]), "Asia/Tokyo", "MM/dd(E)") : "",
        row[2] || "",
        row[7] || "", row[8] || "", row[9] || "",
        row[10] || "",
        row[11] || ""
      ];
    });

    reportSheet.getRange(nextRow, 1, eveningDayData.length, 7).setValues(eveningDayData);
    reportSheet.getRange(nextRow, 1, eveningDayData.length, 7).setHorizontalAlignment("center");
  }

  reportSheet.autoResizeColumns(1, 9);
  try { ss.setActiveSheet(reportSheet); } catch(e) {}
  try { SpreadsheetApp.getUi().alert(monthName + "の月次レポートを生成しました！"); } catch(e) {}
}

// ============================================
// データマージ（生データ行から — ダッシュボード・レポート用）
// ============================================
function buildMergedDataFromRows(morningRows, eveningRows) {
  var map = {};

  morningRows.forEach(function(row) {
    if (!row[0]) return;
    var date = Utilities.formatDate(new Date(row[0]), "Asia/Tokyo", "yyyy-MM-dd");
    if (!map[date]) map[date] = { date: date };
    map[date].morning = row;
  });

  eveningRows.forEach(function(row) {
    if (!row[0]) return;
    var date = Utilities.formatDate(new Date(row[0]), "Asia/Tokyo", "yyyy-MM-dd");
    if (!map[date]) map[date] = { date: date };
    map[date].evening = row;
  });

  return Object.keys(map).sort().map(function(date) {
    return map[date];
  });
}

// ============================================
// データマージ（オブジェクト形式 — getAnalysisData用）
// ============================================
function buildMergedData(morningRecords, eveningRecords) {
  var map = {};

  morningRecords.forEach(function(r) {
    if (!r.date) return;
    if (!map[r.date]) map[r.date] = { date: r.date };
    map[r.date].morning = r;
  });

  eveningRecords.forEach(function(r) {
    if (!r.date) return;
    if (!map[r.date]) map[r.date] = { date: r.date };
    map[r.date].evening = r;
  });

  return Object.keys(map).sort().map(function(date) {
    return map[date];
  });
}

// ============================================
// 低空飛行期間の検出（朝・夜の平均スコアで判定）
// ============================================
function detectLowFlightPeriods(mergedData) {
  var periods = [];
  var inLow = false;
  var startDate = null;
  var count = 0;

  mergedData.forEach(function(d) {
    var scores = [];
    if (d.morning) {
      var mc = parseFloat(d.morning[2]);
      var me = parseFloat(d.morning[3]);
      var mm = parseFloat(d.morning[4]);
      if (!isNaN(mc)) scores.push(mc);
      if (!isNaN(me)) scores.push(me);
      if (!isNaN(mm)) scores.push(mm);
    }
    if (d.evening) {
      var ec = parseFloat(d.evening[7]);
      var ee = parseFloat(d.evening[8]);
      var em = parseFloat(d.evening[9]);
      if (!isNaN(ec)) scores.push(ec);
      if (!isNaN(ee)) scores.push(ee);
      if (!isNaN(em)) scores.push(em);
    }

    if (scores.length === 0) return;
    var avg = scores.reduce(function(a, b) { return a + b; }, 0) / scores.length;

    if (avg <= 2) {
      if (!inLow) { inLow = true; startDate = d.date; count = 0; }
      count++;
    } else {
      if (inLow && count >= 3) {
        periods.push({ start: startDate, end: d.date, days: count });
      }
      inLow = false; startDate = null; count = 0;
    }
  });

  if (inLow && count >= 3) {
    periods.push({ start: startDate, end: mergedData[mergedData.length - 1].date, days: count });
  }

  return periods;
}

// ============================================
// ユーティリティ関数
// ============================================
function calcAverages(rows, condIdx, energyIdx, mentalIdx) {
  var condSum = 0, energySum = 0, mentalSum = 0, count = 0;
  rows.forEach(function(row) {
    var c = parseFloat(row[condIdx]);
    var e = parseFloat(row[energyIdx]);
    var m = parseFloat(row[mentalIdx]);
    if (!isNaN(c) && !isNaN(e) && !isNaN(m)) {
      condSum += c; energySum += e; mentalSum += m; count++;
    }
  });
  if (count === 0) return { condition: 0, energy: 0, mental: 0 };
  return { condition: condSum/count, energy: energySum/count, mental: mentalSum/count };
}

function getScoreLabel(score) {
  if (score >= 4.5) return "とても良い ✨";
  if (score >= 3.5) return "良い 😊";
  if (score >= 2.5) return "普通 🙂";
  if (score >= 1.5) return "悪い 😷";
  return "とても悪い 🤧";
}

function getScoreColor(score) {
  if (score >= 4.5) return "#e8f5e9";
  if (score >= 3.5) return "#f1f8e9";
  if (score >= 2.5) return "#fff8e1";
  if (score >= 1.5) return "#fff3e0";
  return "#fde8e8";
}
