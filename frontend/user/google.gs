
/**
 * Ngolab Sync System v8.0 - ROBUST TRANSACTION SYNC
 */

const SPREADSHEET_ID = "1PGUwYgrQFtpv2hHpr_sDAqdsp9pJFMQtGvzjn_u9LPQ";

function pastikanString(data) {
  if (data === null || data === undefined) return "";
  if (typeof data === 'object') return JSON.stringify(data);
  return data.toString();
}

function doPost(e) {
  var ss;
  try {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "ID Spreadsheet tidak valid" })).setMimeType(ContentService.MimeType.JSON);
  }

  var sheetOrders = ss.getSheetByName("Orders") || ss.insertSheet("Orders");
  var sheetDetails = ss.getSheetByName("Transaction_Details") || ss.insertSheet("Transaction_Details");
  var sheetMembers = ss.getSheetByName("Members") || ss.insertSheet("Members");

  try {
    var rawData = JSON.parse(e.postData.contents);
    var action = rawData.action;
    
    if (action === "SYNC_TRANSACTION") {
      // 1. Simpan ke Sheet Orders
      var barisUtama = [
        new Date(),
        pastikanString(rawData.transactionId),
        pastikanString(rawData.customerType),
        pastikanString(rawData.customerName),
        pastikanString(rawData.itemsSummary),
        pastikanString(rawData.paymentMethod),
        Number(rawData.subtotal) || 0,
        pastikanString(rawData.voucherName),
        Number(rawData.voucherDiscount) || 0,
        Number(rawData.pointsDiscount) || 0,
        Number(rawData.tax) || 0,
        Number(rawData.totalPaid) || 0,
        Number(rawData.pointsEarned) || 0
      ];
      sheetOrders.appendRow(barisUtama);

      // 2. Simpan ke Sheet Transaction_Details (Detail Barang)
      var items = rawData.items;
      // Jika items terkirim sebagai string (karena JSON.stringify ganda), parse kembali
      if (typeof items === 'string') {
        try { items = JSON.parse(items); } catch(e) {}
      }

      if (items && Array.isArray(items) && items.length > 0) {
        items.forEach(function(item) {
          sheetDetails.appendRow([
            pastikanString(rawData.transactionId), 
            pastikanString(item.name), 
            Number(item.price) || 0, 
            Number(item.qty) || 1, 
            Number(item.total) || 0,
            pastikanString(rawData.paymentMethod)
          ]);
        });
      }

      // 3. Update Poin Member
      if (rawData.customerType === "MEMBER" && rawData.memberId) {
        var memberRows = sheetMembers.getDataRange().getValues();
        for (var j = 1; j < memberRows.length; j++) {
          if (memberRows[j][0].toString() === rawData.memberId.toString()) {
            var ptsSekarang = Number(memberRows[j][3]) || 0;
            var ptsUpdate = ptsSekarang - (Number(rawData.pointsDiscount) || 0) + (Number(rawData.pointsEarned) || 0);
            sheetMembers.getRange(j + 1, 4).setValue(ptsUpdate);
            break;
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
    }

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Fungsi doGet tetap sama untuk GET_PRODUCTS dan GET_MEMBER
function doGet(e) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var action = e.parameter.action;

  if (action === "GET_PRODUCTS") {
    var sheet = ss.getSheetByName("Products");
    if (!sheet) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var products = [];
    for (var i = 1; i < data.length; i++) {
      var obj = {};
      headers.forEach(function(header, index) {
        var key = header.toLowerCase().replace(/ /g, "_");
        obj[key] = data[i][index];
      });
      products.push(obj);
    }
    return ContentService.createTextOutput(JSON.stringify(products)).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "GET_MEMBER") {
    var memberId = e.parameter.id;
    var sheet = ss.getSheetByName("Members");
    if (!sheet) return ContentService.createTextOutput(JSON.stringify({ status: "error" })).setMimeType(ContentService.MimeType.JSON);
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString() === memberId) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "success",
          data: { id: data[i][0].toString(), name: data[i][1].toString(), tier: data[i][2].toString(), points: Number(data[i][3]) || 0 }
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ status: "not_found" })).setMimeType(ContentService.MimeType.JSON);
  }
  return HtmlService.createHtmlOutput("Ngolab API v8.0 Ready");
}
