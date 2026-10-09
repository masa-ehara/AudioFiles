/**
 * わいわい広場 音声資料登録台帳 - Google Sheets版
 * 複数レコードを1ブロックにまとめてHTML生成
 *
 * A 処理対象（チェックボックス）
 * B No.
 * C 使用中
 * D 資料タイトル
 * E 文字サイズ
 * F 音声ファイル（空欄可）
 * G PDF URL
 * H 表示モード（空欄＝通常、U＝音声と資料表示を分離）
 * I 登録日
 * J 修正日
 * K 記事
 * L HTMLコード
 */

const SHEET_NAME = '資料登録台帳';
const HEADER_ROW = 3;
const FIRST_DATA_ROW = 4;
const LAST_DATA_ROW = 103;

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('わいわい広場')
    .addItem('HTML作成（チェック行）', 'createHtml')
    .addItem('処理対象チェックボックスを設定', 'setupCheckboxes')
    .addToUi();
}

function setupCheckboxes() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    SpreadsheetApp.getUi().alert('「資料登録台帳」シートが見つかりません。');
    return;
  }
  sheet.getRange(FIRST_DATA_ROW, 1, LAST_DATA_ROW - FIRST_DATA_ROW + 1, 1).insertCheckboxes();
  SpreadsheetApp.getUi().alert('A列に処理対象チェックボックスを設定しました。');
}

function createHtml() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    SpreadsheetApp.getUi().alert('「資料登録台帳」シートが見つかりません。');
    return;
  }

  const lastRow = Math.max(sheet.getLastRow(), FIRST_DATA_ROW);
  const endRow = Math.min(lastRow, LAST_DATA_ROW);
  const values = sheet.getRange(FIRST_DATA_ROW, 1, endRow - FIRST_DATA_ROW + 1, 12).getValues();

  let htmlParts = [];
  let selectedRows = [];

  values.forEach((row, index) => {
    const rowNumber = FIRST_DATA_ROW + index;
    const target = row[0] === true || String(row[0]).toUpperCase() === 'TRUE';
    if (!target) return;

    const no = row[1];
    const title = String(row[3] ?? '').trim();
    const fontSize = String(row[4] ?? '').trim() || '20px';
    const audioFile = String(row[5] ?? '').trim();
    const pdfUrl = String(row[6] ?? '').trim();
    const displayMode = String(row[7] ?? '').trim().toUpperCase();

    if (!title) throw new Error(`No.${no} の「資料タイトル」が入力されていません。`);

    // 音声ファイルは空欄でも可。
    // 空欄の場合は data-noaudio="true" を付けて音声なし資料として処理する。
    if (displayMode !== '' && displayMode !== 'U') {
      throw new Error(`No.${no} の「表示モード」は空欄または U を入力してください。`);
    }
    if (displayMode === 'U' && !pdfUrl) {
      throw new Error(`No.${no} は表示モードが U のため、「PDF URL」が必須です。`);
    }

    htmlParts.push(buildHtml(title, pdfUrl, audioFile, fontSize, displayMode));
    selectedRows.push(rowNumber);
  });

  if (selectedRows.length === 0) {
    SpreadsheetApp.getUi().alert('A列の「処理対象」にチェックされたレコードがありません。');
    return;
  }

  // 複数レコードを1つのHTMLにまとめる
  let html = htmlParts.join('\n');

  // 音声再生・PDF表示用共通スクリプトを追加
  html += '\n\n<script src="https://masa-ehara.github.io/AudioFiles/common-audio5.js"></script>';

  const firstRow = selectedRows[0];

  // 複数レコードをまとめたHTMLは最初の対象行のL列へ保存
  sheet.getRange(firstRow, 12).setValue(html);

  // 選択された各レコードの修正日を更新
  selectedRows.forEach(row => {
    sheet.getRange(row, 10).setValue(new Date());
    sheet.getRange(row, 10).setNumberFormat('yyyy/mm/dd');
  });

  showHtmlDialog(html, `${selectedRows.length}件のHTML`);
}

function buildHtml(title, pdfUrl, audioFile, fontSize, displayMode) {
  let html =
    '<div class="audio-player"\n' +
    '     data-title="' + htmlAttr(title) + '"\n' +
    '     data-fntsize="' + htmlAttr(fontSize) + '"';

  if (audioFile) {
    html += '\n     data-audio="' + htmlAttr(audioFile) + '"';
  } else {
    html += '\n     data-noaudio="true"';
  }

  if (pdfUrl) html += '\n     data-pdf="' + htmlAttr(pdfUrl) + '"';
  if (displayMode === 'U') html += '\n     data-mode="U"';

  return html + '>\n</div>';
}

function htmlAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function showHtmlDialog(html, title) {
  // 生成HTML内に <script> が含まれるため、< を Unicode escape して
  // ダイアログ側の <script> を途中で閉じないようにする。
  const escapedHtml = JSON.stringify(html).replace(/</g, '\\u003c');

  const output = HtmlService.createHtmlOutput(
    '<!doctype html><html><head><meta charset="UTF-8"><style>' +
    'body{font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue",sans-serif;margin:18px;}' +
    'h3{margin:0 0 12px;font-size:18px;}' +
    'textarea{width:100%;height:300px;box-sizing:border-box;font-family:ui-monospace,Menlo,monospace;font-size:13px;}' +
    'button{margin-top:12px;padding:8px 18px;font-size:14px;cursor:pointer;}' +
    '#msg{margin-left:10px;color:#555;}' +
    '</style></head><body>' +
    '<h3>HTML確認：' + escapeForHtmlTitle(title) + '</h3>' +
    '<textarea id="html" spellcheck="false"></textarea><br>' +
    '<button onclick="copyHtml()">HTMLをコピー</button><span id="msg"></span>' +
    '<script>' +
    'const htmlText=' + escapedHtml + ';' +
    'document.getElementById("html").value=htmlText;' +
    'async function copyHtml(){try{await navigator.clipboard.writeText(htmlText);document.getElementById("msg").textContent="コピーしました。";}catch(e){const t=document.getElementById("html");t.focus();t.select();document.getElementById("msg").textContent="自動コピーできない場合は、選択された文字列をコピーしてください。";}}' +
    '</script></body></html>'
  ).setWidth(760).setHeight(460);

  SpreadsheetApp.getUi().showModalDialog(output, 'HTML確認・コピー');
}

function escapeForHtmlTitle(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
