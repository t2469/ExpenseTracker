// ウェブアプリとしてアクセスされたときに実行される関数
function doGet(e) {
    return HtmlService.createHtmlOutputFromFile('index')
        .setTitle('支出入力ウェブアプリ');
}

// 入力ダイアログを表示する関数
function showInputDialog() {
    const html = HtmlService.createHtmlOutputFromFile('dialog')
        .setWidth(300)
        .setHeight(200);
    SpreadsheetApp.getUi().showModalDialog(html, '支出入力');
}

// 支出データを保存する関数
function saveExpense(category, amount) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('支出記録');
    sheet.appendRow([new Date(), category, Number(amount)]);
}
