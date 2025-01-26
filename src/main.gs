function onOpen() {
    const ui = SpreadsheetApp.getUi();
    ui.createMenu('支出管理')
        .addItem('支出入力', 'showInputDialog')
        .addToUi();
}

function doGet() {
    return HtmlService.createTemplateFromFile('index')
        .evaluate()
        .setTitle('支出管理ダッシュボード')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function showInputDialog() {
    const html = HtmlService.createHtmlOutputFromFile('dialog')
        .setWidth(400)
        .setHeight(300);
    SpreadsheetApp.getUi().showModalDialog(html, '新しい支出');
}

function saveExpense(category, amount) {
    validateInput(category, amount);

    SpreadsheetApp.getActiveSpreadsheet()
        .getSheetByName('支出記録')
        .appendRow([new Date(), category, Number(amount)]);
}

function getCategories() {
    return SpreadsheetApp.getActiveSpreadsheet()
        .getSheetByName('カテゴリ')
        .getDataRange()
        .getValues()
        .flat()
        .filter(Boolean);
}

function saveCategory(category) {
    if (!category) throw 'カテゴリ名を入力してください';

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('カテゴリ');
    const categories = sheet.getDataRange().getValues().flat();

    if (categories.includes(category)) throw '既に存在するカテゴリです';
    sheet.appendRow([category]);
}

function deleteCategory(category) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('カテゴリ');
    const data = sheet.getDataRange().getValues().flat();
    const index = data.indexOf(category);

    if (index === -1) throw 'カテゴリが見つかりません';
    sheet.deleteRow(index + 1);
}

function getChartData(type) {
    const data = getExpenseData();
    return data.length === 0 ? null :
        type === 'category' ? buildCategoryData(data) : buildTimePeriodData(data, type);
}

function validateInput(category, amount) {
    const errors = [];
    if (!category) errors.push('カテゴリを選択してください');
    if (!amount || isNaN(amount) || amount <= 0) errors.push('有効な金額を入力してください');
    if (errors.length > 0) throw errors.join('\n');
}

function getExpenseData() {
    return SpreadsheetApp.getActiveSpreadsheet()
        .getSheetByName('支出記録')
        .getDataRange()
        .getValues()
        .slice(1)
        .map(row => ({
            date: new Date(row[0]),
            category: row[1],
            amount: Number(row[2])
        }));
}

function buildCategoryData(data) {
    const summary = data.reduce((acc, {category, amount}) => {
        acc[category] = (acc[category] || 0) + amount;
        return acc;
    }, {});

    return [['カテゴリ', '金額'], ...Object.entries(summary)];
}

function buildTimePeriodData(data, period) {
    const getKey = {
        week: date => `${date.getFullYear()}-W${String(date.getWeek()).padStart(2, '0')}`,
        month: date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        year: date => date.getFullYear()
    };

    const summary = data.reduce((acc, {date, amount}) => {
        const key = getKey[period](date);
        acc[key] = (acc[key] || 0) + amount;
        return acc;
    }, {});

    return [
        [period === 'week' ? '週' : period === 'month' ? '月' : '年', '金額'],
        ...Object.entries(summary).sort()
    ];
}

Date.prototype.getWeek = function() {
    const date = new Date(this);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};