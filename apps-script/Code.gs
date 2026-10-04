/**
 * 五甲港口宮 線上求籤 — 信眾紀錄接收程式
 * 貼到 Google 試算表的「擴充功能 → Apps Script」，部署為網頁應用程式。
 * 每次有人求籤，網頁會送一筆資料過來，這裡把它寫成試算表的一列。
 */
const SHEET_NAME = '求籤紀錄';
const HEADERS = ['時間', '姓名', '出生日期', '性別', '電話', '類別', '神明', '時令', '籤號', '籤等', '氣數', '八字（年月日）', '人格'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse(e.postData.contents || '{}');
    if (!d.name || !d.birth) return reply({ ok: false, error: 'missing fields' });

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sh.getLastRow() === 0) {
      sh.appendRow(HEADERS);
      sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
      sh.setFrozenRows(1);
      sh.getRange('C:E').setNumberFormat('@'); // 生日、性別、電話以文字保存，電話開頭的 0 不會消失
    }
    sh.appendRow([
      new Date(),
      clean(d.name, 20), clean(d.birth, 10), clean(d.gender, 2), clean(d.phone, 20),
      clean(d.category, 4), clean(d.deity, 6), clean(d.season, 8),
      num(d.poemNo), clean(d.level, 2), num(d.score), clean(d.bazi, 12), num(d.renGe),
    ]);
    return reply({ ok: true });
  } catch (err) {
    return reply({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// 用瀏覽器打開部署網址時顯示，用來確認部署成功
function doGet() {
  return ContentService.createTextOutput('求籤紀錄接收程式運作中');
}

// 截斷長度，並防止「=、+、-、@」開頭的內容被試算表當成公式執行
function clean(v, max) {
  let s = String(v == null ? '' : v).slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}
function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : '';
}
function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
