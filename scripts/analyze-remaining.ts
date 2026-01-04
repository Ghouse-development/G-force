/**
 * 残り未検証セクションの分析
 *
 * 実行方法:
 * npx tsx scripts/analyze-remaining.ts
 */

import ExcelJS from 'exceljs'
import * as fs from 'fs'
import * as path from 'path'

async function analyzeRemaining() {
  const templatePath = path.join(__dirname, '../public/templates/fund-plan-template.xlsx')

  if (!fs.existsSync(templatePath)) {
    console.error('テンプレートファイルが見つかりません:', templatePath)
    process.exit(1)
  }

  console.log('======================================')
  console.log('残り未検証セクション分析')
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

  // 付帯工事費C（Row 59-80付近）を分析
  console.log('=== 付帯工事費C（解体・地盤改良等）===\n')

  const incidentalCKeywords = [
    { keyword: '準防火地域', dataPath: 'incidentalCostC.fireProtectionCost' },
    { keyword: '解体工事', dataPath: 'incidentalCostC.demolitionCost' },
    { keyword: '地盤改良', dataPath: 'incidentalCostC.groundImprovementFee' },
    { keyword: '外部給排水', dataPath: 'incidentalCostC.externalPlumbing' },
    { keyword: 'エアコン', dataPath: 'incidentalCostC.airConditioner' },
    { keyword: 'カーテン', dataPath: 'incidentalCostC.curtain' },
  ]

  for (let row = 50; row <= 80; row++) {
    for (let col = 1; col <= 50; col++) {
      const text = getCellText(row, col)
      for (const kw of incidentalCKeywords) {
        if (text.includes(kw.keyword)) {
          console.log(`Row ${row}: "${text.substring(0, 30)}"`)
          // 右側を探す
          for (let c2 = col + 1; c2 <= col + 30; c2++) {
            const cell = sheet.getCell(row, c2)
            if (cell.value !== null && cell.value !== undefined) {
              const colLetter = getColLetter(c2)
              if (typeof cell.value === 'number' && !cell.formula) {
                console.log(`  → ${colLetter}${row}: ${cell.value} (入力セル)`)
              } else if (cell.formula) {
                console.log(`  → ${colLetter}${row}: 数式`)
              }
            }
          }
          break
        }
      }
    }
  }

  // 諸費用セクション（Row 80-100付近）を分析
  console.log('\n=== 諸費用セクション ===\n')

  const miscKeywords = [
    { keyword: 'つなぎローン', dataPath: 'miscellaneousCosts.bridgeLoanFee' },
    { keyword: '印紙', dataPath: 'miscellaneousCosts.stampDuty' },
    { keyword: '火災保険', dataPath: 'miscellaneousCosts.fireInsurance' },
    { keyword: '外構工事', dataPath: 'miscellaneousCosts.exteriorConstruction' },
    { keyword: '登記', dataPath: 'miscellaneousCosts.registrationFee' },
  ]

  for (let row = 80; row <= 100; row++) {
    for (let col = 1; col <= 60; col++) {
      const text = getCellText(row, col)
      for (const kw of miscKeywords) {
        if (text.includes(kw.keyword)) {
          console.log(`Row ${row}: "${text.substring(0, 40)}"`)
          // 右側を探す
          for (let c2 = col + 1; c2 <= col + 30; c2++) {
            const cell = sheet.getCell(row, c2)
            if (cell.value !== null && cell.value !== undefined) {
              const colLetter = getColLetter(c2)
              if (typeof cell.value === 'number' && !cell.formula) {
                console.log(`  → ${colLetter}${row}: ${cell.value} (入力セル)`)
              } else if (cell.formula) {
                console.log(`  → ${colLetter}${row}: 数式`)
              }
            }
          }
          break
        }
      }
    }
  }

  // 土地関連セクションを分析
  console.log('\n=== 土地関連費用セクション ===\n')

  const landKeywords = [
    { keyword: '土地売買代金', dataPath: 'landCosts.landPrice' },
    { keyword: '土地売買契約', dataPath: 'landCosts.landContractStampDuty' },
    { keyword: '土地仲介', dataPath: 'landCosts.brokerageFee' },
    { keyword: '土地登記', dataPath: 'landCosts.landRegistrationFee' },
  ]

  for (let row = 1; row <= 100; row++) {
    for (let col = 1; col <= 100; col++) {
      const text = getCellText(row, col)
      for (const kw of landKeywords) {
        if (text.includes(kw.keyword)) {
          console.log(`Row ${row}: "${text.substring(0, 40)}"`)
          // 右側を探す
          for (let c2 = col + 1; c2 <= col + 30; c2++) {
            const cell = sheet.getCell(row, c2)
            if (cell.value !== null && cell.value !== undefined) {
              const colLetter = getColLetter(c2)
              if (typeof cell.value === 'number' && !cell.formula) {
                console.log(`  → ${colLetter}${row}: ${cell.value} (入力セル)`)
              } else if (cell.formula) {
                console.log(`  → ${colLetter}${row}: 数式`)
              }
            }
          }
          break
        }
      }
    }
  }

  // 坪単価の位置を特定
  console.log('\n=== 坪単価セクション ===\n')

  for (let row = 20; row <= 35; row++) {
    for (let col = 1; col <= 60; col++) {
      const text = getCellText(row, col)
      if (text.includes('坪単価')) {
        console.log(`Row ${row}: "${text.substring(0, 40)}"`)
        // 右側を探す
        for (let c2 = col + 1; c2 <= col + 20; c2++) {
          const cell = sheet.getCell(row, c2)
          if (cell.value !== null && cell.value !== undefined) {
            const colLetter = getColLetter(c2)
            if (typeof cell.value === 'number' && !cell.formula) {
              console.log(`  → ${colLetter}${row}: ${cell.value} (入力セル)`)
            } else if (cell.formula) {
              console.log(`  → ${colLetter}${row}: 数式`)
            }
          }
        }
        break
      }
    }
  }
}

analyzeRemaining().catch(console.error)
