const XLSX = require('xlsx');
const workbook = XLSX.readFile('c:/Users/nishino/Desktop/【資金計画書※必ずコピーして使用する事】　20251207.xlsx');

// シート1: 資金計画書の全データを取得
const sheet1 = workbook.Sheets['【資金計画書】'];
const data1 = XLSX.utils.sheet_to_json(sheet1, { header: 1, defval: '' });

console.log('=== 【資金計画書】シート 全行 ===\n');
data1.forEach((row, i) => {
  const filtered = row.map((cell, j) => {
    if (cell !== '' && cell !== null && cell !== undefined) {
      return `[${j}]${String(cell).substring(0, 30)}`;
    }
    return null;
  }).filter(Boolean);
  if (filtered.length > 0) {
    console.log(`Row ${i}: ${filtered.join(' | ')}`);
  }
});
