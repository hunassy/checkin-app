// ============================================
// 03_sync.gs — 記録状態の管理（デバイス間同期用）
// ============================================

// 「記録状態」シートに朝/夜の完了フラグを書き込む
function markRecordDone(dateStr, type) {
  if (!dateStr) {
    dateStr = Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyy-MM-dd");
  }
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("記録状態");
  if (!sheet) {
    sheet = ss.insertSheet("記録状態");
    sheet.getRange("A1:C1").setValues([["日付", "朝の記録", "夜の振り返り"]]);
    sheet.getRange("A1:C1").setBackground("#37474f").setFontColor("white").setFontWeight("bold");
    sheet.setFrozenRows(1);
  }

  // 既存行を検索
  var data = sheet.getDataRange().getValues();
  var targetRow = -1;
  for (var i = 1; i < data.length; i++) {
    // 日付列が文字列でも Date でも対応
    var cellDate = data[i][0];
    var cellDateStr = "";
    if (cellDate instanceof Date) {
      cellDateStr = Utilities.formatDate(cellDate, "Asia/Tokyo", "yyyy-MM-dd");
    } else {
      cellDateStr = String(cellDate).substring(0, 10);
    }
    if (cellDateStr === dateStr) {
      targetRow = i + 1; // 1-indexed
      break;
    }
  }

  if (targetRow === -1) {
    // 新規行を追加
    var newRow = [dateStr, false, false];
    if (type === "morning") newRow[1] = true;
    if (type === "evening") newRow[2] = true;
    if (type) sheet.appendRow(newRow);
  } else {
    // 既存行を更新
    if (type === "morning") sheet.getRange(targetRow, 2).setValue(true);
    if (type === "evening") sheet.getRange(targetRow, 3).setValue(true);
  }
}

// ============================================
// 指定日の記録状態を返す
// 「記録状態」シートのみで判定する（シンプル＆確実）
//
// ★★★ 修正点 ★★★
// フォールバック（「朝の記録」「夜の振り返り」シートの直接参照）を廃止。
// 理由：これらのシートの日付列には「送信時刻」が入っており、
// 前日の記録を翌日に送信した場合、日付がずれて誤判定の原因になる。
// 記録状態は doPost 内の markRecordDone で params.date を使って
// 正確に書き込まれるため、「記録状態」シートだけで十分。
// ============================================
function getRecordStatus(dateStr) {
  if (!dateStr) {
    dateStr = Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyy-MM-dd");
  }
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var morningDone = false;
  var eveningDone = false;

  // 「記録状態」シートを確認
  var statusSheet = ss.getSheetByName("記録状態");
  if (statusSheet) {
    var statusData = statusSheet.getDataRange().getValues();
    for (var i = 1; i < statusData.length; i++) {
      // 日付列が文字列でも Date でも対応
      var cellDate = statusData[i][0];
      var cellDateStr = "";
      if (cellDate instanceof Date) {
        cellDateStr = Utilities.formatDate(cellDate, "Asia/Tokyo", "yyyy-MM-dd");
      } else {
        cellDateStr = String(cellDate).substring(0, 10);
      }
      if (cellDateStr === dateStr) {
        morningDone = !!statusData[i][1];
        eveningDone = !!statusData[i][2];
        break;
      }
    }
  }

  return ContentService.createTextOutput(JSON.stringify({
    status: "ok",
    date: dateStr,
    morningDone: morningDone,
    eveningDone: eveningDone
  })).setMimeType(ContentService.MimeType.JSON);
}
