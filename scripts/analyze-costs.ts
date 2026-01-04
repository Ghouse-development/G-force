/**
 * 費用セクション詳細分析スクリプト
 *
 * 行2-30の費用関連セルを詳細に分析
 *
 * 実行方法:
 * npx tsx scripts/analyze-costs.ts
 */

import ExcelJS from 'exceljs'
import * as fs from 'fs'
import * as path from 'path'

async function analyzeCosts() {
  const templatePath = path.join(__dirname, '../public/templates/fund-plan-template.xlsx')

  if (!fs.existsSync(templatePath)) {
    console.error('テンプレートファイルが見つかりません:', templatePath)
    process.exit(1)
  }

  console.log('======================================')
  console.log('費用セクション詳細分析')
  console.log('======================================\n')

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(templatePath)

  const sheetOrUndef = workbook.getWorksheet('【資金計画書】')
  if (!sheetOrUndef) {
    console.error('【資金計画書】シートが見つかりません')
    process.exit(1)
  }
  const sheet = sheetOrUndef

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

  function getCellText(row: number, col: number): string {
    const cell = sheet.getCell(row, col)
    if (!cell.value) return ''
    if (typeof cell.value === 'object' && 'richText' in cell.value) {
      return (cell.value as { richText: Array<{ text: string }> }).richText
        .map(rt => rt.text).join('')
    }
    return String(cell.value)
  }

  // 行2-50の全セルを出力
  console.log('=== 行2-50の詳細スキャン ===\n')

  for (let row = 2; row <= 50; row++) {
    const rowData: string[] = []
    for (let col = 1; col <= 80; col++) {
      const cell = sheet.getCell(row, col)
      if (cell.value !== null && cell.value !== undefined) {
        const colLetter = getColLetter(col)
        let val: string
        if (cell.formula) {
          val = `=${cell.formula.substring(0, 20)}`
        } else if (typeof cell.value === 'number') {
          val = `[NUM:${cell.value}]`
        } else if (typeof cell.value === 'object' && 'richText' in cell.value) {
          const text = (cell.value as { richText: Array<{ text: string }> }).richText
            .map(rt => rt.text).join('')
          val = text.substring(0, 20)
        } else {
          val = String(cell.value).substring(0, 20)
        }
        rowData.push(`${colLetter}${row}:${val}`)
      }
    }
    if (rowData.length > 0) {
      console.log(`Row ${row}: ${rowData.slice(0, 8).join(' | ')}`)
      if (rowData.length > 8) {
        console.log(`       ${rowData.slice(8, 16).join(' | ')}`)
      }
    }
  }

  // 特定のキーワードを含むセルを検索
  console.log('\n\n=== キーワード検索結果 ===\n')

  const keywords = [
    '確認申請', '構造計算', '構造図', 'BELS', '長期優良',
    '瑕疵保険', '地盤保証', 'シロアリ',
    '太陽光', '蓄電池',
    '準防火地域', '解体工事', '地盤改良',
    'つなぎローン', '印紙', '火災保険', '外構工事', '登記',
    '土地売買', '仲介', '坪単価', '建物本体'
  ]

  for (const keyword of keywords) {
    console.log(`--- "${keyword}" ---`)
    for (let row = 1; row <= 50; row++) {
      for (let col = 1; col <= 100; col++) {
        const text = getCellText(row, col)
        if (text.includes(keyword)) {
          const colLetter = getColLetter(col)
          // このセルの右側を10列分調べる
          const rightCells: string[] = []
          for (let c2 = col + 1; c2 <= col + 15; c2++) {
            const cell2 = sheet.getCell(row, c2)
            if (cell2.value !== null && cell2.value !== undefined) {
              const colLetter2 = getColLetter(c2)
              if (typeof cell2.value === 'number') {
                rightCells.push(`${colLetter2}${row}=[${cell2.value}]`)
              } else if (cell2.formula) {
                rightCells.push(`${colLetter2}${row}=式`)
              }
            }
          }
          console.log(`  ${colLetter}${row}: "${text.substring(0, 30)}"`)
          if (rightCells.length > 0) {
            console.log(`    → ${rightCells.join(', ')}`)
          }
        }
      }
    }
  }

  // 数値セルのみを抽出（数式でないもの）
  console.log('\n\n=== 入力可能な数値セル一覧 ===\n')

  const inputNumbers: Array<{ address: string; value: number; row: number; col: number }> = []

  for (let row = 1; row <= 50; row++) {
    for (let col = 1; col <= 100; col++) {
      const cell = sheet.getCell(row, col)
      if (typeof cell.value === 'number' && !cell.formula && !cell.isMerged) {
        const colLetter = getColLetter(col)
        inputNumbers.push({
          address: `${colLetter}${row}`,
          value: cell.value,
          row,
          col
        })
      }
    }
  }

  // 行でグループ化
  const byRow = new Map<number, typeof inputNumbers>()
  for (const item of inputNumbers) {
    if (!byRow.has(item.row)) {
      byRow.set(item.row, [])
    }
    byRow.get(item.row)!.push(item)
  }

  for (const [row, items] of byRow) {
    // その行の左側のラベルを探す
    let label = ''
    for (let col = 1; col <= 50; col++) {
      const text = getCellText(row, col)
      if (text && text.length > 2) {
        label = text.substring(0, 30)
        break
      }
    }
    console.log(`Row ${row}: ${label}`)
    for (const item of items) {
      console.log(`  ${item.address}: ${item.value}`)
    }
  }
}

analyzeCosts().catch(console.error)
