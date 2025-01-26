// シート名定数
const SHEETS = {
    EXPENSE: '支出記録',
    CATEGORY: 'カテゴリ'
};

// シート初期化関数
function initializeSheet(sheetName) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
        sheet = ss.insertSheet(sheetName);
        if (sheetName === SHEETS.EXPENSE) {
            sheet.appendRow(['日付', 'カテゴリ', '金額']);
        }
    }
    return sheet;
}

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

    const sheet = initializeSheet(SHEETS.EXPENSE);
    sheet.appendRow([new Date(), category, Number(amount)]);
}

function getCategories() {
    const sheet = initializeSheet(SHEETS.CATEGORY);
    return sheet.getRange(1, 1, sheet.getLastRow(), 1)
        .getValues()
        .flat()
        .filter(Boolean);
}

function saveCategory(category) {
    if (!category) throw 'カテゴリ名を入力してください';

    const sheet = initializeSheet(SHEETS.CATEGORY);
    const categories = sheet.getDataRange().getValues().flat();

    if (categories.includes(category)) throw '既に存在するカテゴリです';
    sheet.appendRow([category]);
}

function deleteCategory(category) {
    const sheet = initializeSheet(SHEETS.CATEGORY);
    const data = sheet.getDataRange().getValues().flat();
    const index = data.indexOf(category);

    if (index === -1) throw 'カテゴリが見つかりません';
    sheet.deleteRow(index + 1);
}

function getChartData(type) {
    const data = getExpenseData();
    return type === 'category' ?
        buildCategoryData(data) :
        buildTimePeriodData(data, type);
}

function validateInput(category, amount) {
    const errors = [];
    if (!category) errors.push('カテゴリを選択してください');
    if (!amount || isNaN(amount) || amount <= 0) errors.push('有効な金額を入力してください');
    if (errors.length > 0) throw errors.join('\n');
}

function getExpenseData() {
    const sheet = initializeSheet(SHEETS.EXPENSE);
    return sheet.getRange(2, 1, sheet.getLastRow()-1, 3)
        .getValues()
        .filter(row => row[0] && row[1] && row[2])
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
        week: date => {
            const year = date.getFullYear();
            return `${year}-W${getISOWeek(date).toString().padStart(2, '0')}`;
        },
        month: date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        year: date => date.getFullYear()
    };

    const summary = data.reduce((acc, {date, amount}) => {
        const key = getKey[period](date);
        acc[key] = (acc[key] || 0) + amount;
        return acc;
    }, {});

    const header = period === 'week' ? '週' :
        period === 'month' ? '月' : '年';

    return [
        [header, '金額'],
        ...Object.entries(summary).sort()
    ];
}

// ISO週番号計算関数
function getISOWeek(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}