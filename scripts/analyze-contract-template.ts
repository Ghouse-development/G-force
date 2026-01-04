/**
 * 請負契約書テンプレート分析スクリプト
 *
 * 実行方法:
 * npx tsx scripts/analyze-contract-template.ts
 */

import ExcelJS from 'exceljs'
import * as fs from 'fs'
import * as path from 'path'

async function analyzeContractTemplate() {
  const templatePath = path.join(__dirname, '../public/templates/請負契約書のコピー.xlsx')

  if (!fs.existsSync(templatePath)) {
    console.error('テンプレートファイルが見つかりません:', templatePath)
    process.exit(1)
  }

  console.log('======================================')
  console.log('請負契約書テンプレート分析')
  console.log('======================================\n')

  const workbook = new ExcelJS.Workbook()

  try {
    await workbook.xlsx.readFile(templatePath)
  } catch (e) {
    console.error('ファイル読み込みエラー:', e)
    process.exit(1)
  }

  console.log('=== シート一覧 ===')
  workbook.worksheets.forEach((sheet, i) => {
    console.log(`${i + 1}. ${sheet.name} (行数: ${sheet.rowCount}, 列数: ${sheet.columnCount})`)
  })
  console.log('')

  // ヘルパー関数
  function getColLetter(col: number): string {
    let letter = ''
    let c = col
    while (c > 0) {
      const mod = (c - 1) % 26
      letter = String.fromCharCode(65 + mod) + letter
      c = Math.floor((c - 1) / 26)
    }
    return letter
  }

  function getCellText(sheet: ExcelJS.Worksheet, row: number, col: number): string {
    const cell = sheet.getCell(row, col)
    if (!cell.value) return ''
    if (typeof cell.value === 'object' && 'richText' in cell.value) {
      return (cell.value as { richText: Array<{ text: string }> }).richText
        .map(rt => rt.text).join('')
    }
    return String(cell.value)
  }

  // 各シートを分析
  for (const sheet of workbook.worksheets) {
    console.log(`\n=== ${sheet.name} ===\n`)

    // 最初の50行をスキャン
    const maxRow = Math.min(50, sheet.rowCount)
    const maxCol = Math.min(30, sheet.columnCount)

    for (let row = 1; row <= maxRow; row++) {
      const rowData: string[] = []

      for (let col = 1; col <= maxCol; col++) {
        const cell = sheet.getCell(row, col)
        if (cell.value !== null && cell.value !== undefined) {
          const colLetter = getColLetter(col)
          let val: string

          if (cell.formula) {
            val = `[式]`
          } else if (typeof cell.value === 'number') {
            val = `[${cell.value}]`
          } else if (typeof cell.value === 'object' && 'richText' in cell.value) {
            const text = (cell.value as { richText: Array<{ text: string }> }).richText
              .map(rt => rt.text).join('')
            val = text.substring(0, 15)
          } else {
            val = String(cell.value).substring(0, 15)
          }

          if (val.trim() && val !== '[object Object]') {
            rowData.push(`${colLetter}${row}:${val}`)
          }
        }
      }

      if (rowData.length > 0) {
        console.log(`Row ${row}: ${rowData.slice(0, 6).join(' | ')}`)
        if (rowData.length > 6) {
          console.log(`       ${rowData.slice(6, 12).join(' | ')}`)
        }
      }
    }
  }

  // 入力セル（数値で数式でないもの）を探す
  console.log('\n\n=== 入力可能セル候補 ===\n')

  for (const sheet of workbook.worksheets) {
    console.log(`\n--- ${sheet.name} ---`)

    const inputCells: Array<{ address: string; value: unknown; label: string }> = []

    for (let row = 1; row <= Math.min(100, sheet.rowCount); row++) {
      for (let col = 1; col <= Math.min(50, sheet.columnCount); col++) {
        const cell = sheet.getCell(row, col)

        // 数値で数式でないセルを探す
        if (typeof cell.value === 'number' && !cell.formula) {
          const colLetter = getColLetter(col)

          // 左側のラベルを探す
          let label = ''
          for (let c = col - 1; c >= 1 && c >= col - 5; c--) {
            const text = getCellText(sheet, row, c)
            if (text && text.length > 1) {
              label = text.substring(0, 20)
              break
            }
          }

          inputCells.push({
            address: `${colLetter}${row}`,
            value: cell.value,
            label,
          })
        }
      }
    }

    for (const ic of inputCells.slice(0, 30)) {
      console.log(`  ${ic.address}: ${ic.value} ← ${ic.label}`)
    }

    if (inputCells.length > 30) {
      console.log(`  ... 他 ${inputCells.length - 30} セル`)
    }
  }

  console.log('\n======================================')
  console.log('分析完了')
  console.log('======================================')
}

analyzeContractTemplate().catch(console.error)
