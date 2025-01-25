// スプレッドシート起動時に実行される関数
function onOpen() {
    const ui = SpreadsheetApp.getUi();

    // カスタムメニューを作成
    ui.createMenu('支出管理')
        .addItem('入力', 'showInputDialog')
        .addToUi();
}

// 入力ダイアログを表示する関数
function showInputDialog() {
    const html = HtmlService.createHtmlOutput(`
    <div style="padding: 20px;">
      <h3>支出入力</h3>
      <input type="text" id="category" placeholder="カテゴリ" style="margin: 5px;">
      <input type="number" id="amount" placeholder="金額" style="margin: 5px;">
      <button onclick="submit()" style="margin: 5px;">保存</button>
    </div>

    <script>
      function submit() {
        const category = document.getElementById('category').value;
        const amount = document.getElementById('amount').value;
        google.script.run.saveExpense(category, amount);
        google.script.host.close();
      }
    </script>
  `).setWidth(300).setHeight(200);
    SpreadsheetApp.getUi().showModalDialog(html, '支出入力');
}

// 支出データを保存する関数
function saveExpense(category, amount) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('支出記録');
    sheet.appendRow([new Date(), category, Number(amount)]);
}
