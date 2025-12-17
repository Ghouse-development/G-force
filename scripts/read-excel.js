const XLSX = require('xlsx');
const path = require('path');

// Read the Excel file
const filePath = 'c:\\Users\\nishino\\Desktop\\【資金計画書※必ずコピーして使用する事】　20251207.xlsx';
const workbook = XLSX.readFile(filePath);

console.log('=== シート一覧 ===');
console.log(workbook.SheetNames);
console.log('');

// Analyze each sheet
workbook.SheetNames.forEach(sheetName => {
  console.log(`\n=== ${sheetName} ===`);
  const sheet = workbook.Sheets[sheetName];

  // Get the range of the sheet
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  console.log(`範囲: ${sheet['!ref']}`);
  console.log(`行数: ${range.e.r - range.s.r + 1}, 列数: ${range.e.c - range.s.c + 1}`);

  // Convert to JSON for first 50 rows
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  // Show first 30 rows with content
  console.log('\n--- データ（最初の30行）---');
  data.slice(0, 30).forEach((row, i) => {
    const filteredRow = row.filter(cell => cell !== '');
    if (filteredRow.length > 0) {
      console.log(`行${i + 1}: ${JSON.stringify(row.slice(0, 20))}`);
    }
  });

  // Show formulas
  console.log('\n--- 数式（一部）---');
  let formulaCount = 0;
  Object.keys(sheet).forEach(key => {
    if (key[0] !== '!' && sheet[key].f && formulaCount < 20) {
      console.log(`${key}: ${sheet[key].f}`);
      formulaCount++;
    }
  });
});
