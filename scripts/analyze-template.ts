/**
 * テンプレート分析スクリプト
 *
 * 実行方法:
 * npx tsx scripts/analyze-template.ts
 */

import ExcelJS from 'exceljs'
import * as fs from 'fs'
import * as path from 'path'

interface CellInfo {
  address: string
  row: number
  col: number
  value: unknown
  formula?: string
  type: string
  isMerged: boolean
}

interface SheetAnalysis {
  name: string
  rowCount: number
  columnCount: number
  cells: CellInfo[]
  mergedRanges: string[]
  printArea?: string
}

async function analyzeTemplate() {
  const templatePath = path.join(__dirname, '../public/templates/fund-plan-template.xlsx')

  if (!fs.existsSync(templatePath)) {
    console.error('テンプレートファイルが見つかりません:', templatePath)
    process.exit(1)
  }

  console.log('テンプレートを読み込み中...')

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(templatePath)

  console.log('\n========================================')
  console.log('テンプレート分析結果')
  console.log('========================================\n')

  const analyses: SheetAnalysis[] = []

  workbook.eachSheet((sheet, sheetId) => {
    console.log(`\n=== シート ${sheetId}: ${sheet.name} ===`)
    console.log(`行数: ${sheet.rowCount}, 列数: ${sheet.columnCount}`)

    const analysis: SheetAnalysis = {
      name: sheet.name,
      rowCount: sheet.rowCount,
      columnCount: sheet.columnCount,
      cells: [],
      mergedRanges: [],
    }

    // 印刷範囲
    if (sheet.pageSetup.printArea) {
      analysis.printArea = sheet.pageSetup.printArea
      console.log(`印刷範囲: ${sheet.pageSetup.printArea}`)
    }

    // 結合セル
    const merges = Object.keys(sheet.model.merges || {})
    if (merges.length > 0) {
      analysis.mergedRanges = merges
      console.log(`結合セル: ${merges.length} 箇所`)
    }

    // 資金計画書シートのみ詳細分析
    if (sheet.name === '【資金計画書】') {
      console.log('\n--- 詳細セル分析 ---')

      // 1行目〜100行目を分析
      for (let row = 1; row <= Math.min(100, sheet.rowCount); row++) {
        for (let col = 1; col <= Math.min(120, sheet.columnCount); col++) {
          const cell = sheet.getCell(row, col)

          if (cell.value !== null && cell.value !== undefined) {
            const cellInfo: CellInfo = {
              address: cell.address,
              row,
              col,
              value: cell.value,
              type: typeof cell.value,
              isMerged: cell.isMerged,
            }

            if (cell.formula) {
              cellInfo.formula = cell.formula
              cellInfo.type = 'formula'
            }

            // 値がオブジェクトの場合（リッチテキストなど）
            if (typeof cell.value === 'object' && cell.value !== null) {
              if ('richText' in cell.value) {
                cellInfo.value = (cell.value as { richText: Array<{ text: string }> }).richText
                  .map(rt => rt.text)
                  .join('')
                cellInfo.type = 'richText'
              } else if ('formula' in cell.value) {
                cellInfo.formula = (cell.value as { formula: string }).formula
                cellInfo.value = (cell.value as { result?: unknown }).result
                cellInfo.type = 'formula'
              }
            }

            analysis.cells.push(cellInfo)
          }
        }
      }

      // ラベルとデータ入力セルを分類
      console.log('\n【ラベルセル（テキスト）】')
      const labelCells = analysis.cells.filter(c =>
        c.type === 'string' || c.type === 'richText'
      ).slice(0, 50)
      labelCells.forEach(c => {
        const val = String(c.value).substring(0, 30)
        console.log(`  ${c.address}: "${val}"${c.formula ? ` (式: ${c.formula})` : ''}`)
      })

      console.log('\n【数値セル】')
      const numericCells = analysis.cells.filter(c => c.type === 'number').slice(0, 30)
      numericCells.forEach(c => {
        console.log(`  ${c.address}: ${c.value}`)
      })

      console.log('\n【数式セル】')
      const formulaCells = analysis.cells.filter(c => c.formula).slice(0, 50)
      formulaCells.forEach(c => {
        console.log(`  ${c.address}: =${c.formula} (結果: ${c.value})`)
      })

      // 特定のキーワードを含むセルを検索
      console.log('\n【重要なラベルセル】')
      const keywords = [
        '太陽光', '蓄電池', '確認申請', '構造計算', '地盤', '解体',
        '借入', '銀行', '金利', '返済', '着工', '上棟', '竣工', '契約',
        '坪単価', '施工面積', '防火', '準防火', '邸', '様', '商品'
      ]

      analysis.cells.forEach(c => {
        const val = String(c.value)
        for (const keyword of keywords) {
          if (val.includes(keyword)) {
            console.log(`  ${c.address}: "${val.substring(0, 40)}"`)
            break
          }
        }
      })
    }

    analyses.push(analysis)
  })

  // JSON形式で出力
  const outputPath = path.join(__dirname, '../docs/template-analysis.json')
  fs.writeFileSync(outputPath, JSON.stringify(analyses, null, 2), 'utf-8')
  console.log(`\n分析結果を保存: ${outputPath}`)

  // マッピング候補を生成
  console.log('\n\n========================================')
  console.log('セルマッピング候補')
  console.log('========================================\n')

  const fundPlanAnalysis = analyses.find(a => a.name === '【資金計画書】')
  if (fundPlanAnalysis) {
    generateMappingSuggestions(fundPlanAnalysis)
  }
}

function generateMappingSuggestions(analysis: SheetAnalysis) {
  // 特定のパターンでセルを分類
  const mappings: Record<string, { labelCell: string; inputCell: string; label: string }[]> = {
    header: [],
    incidentalCostA: [],
    incidentalCostB: [],
    incidentalCostC: [],
    miscellaneous: [],
    landCosts: [],
    loanPlan: [],
    schedule: [],
    paymentPlan: [],
  }

  // 1行目のセルを分析（ヘッダー情報）
  console.log('【1行目（ヘッダー）のセル】')
  const row1Cells = analysis.cells.filter(c => c.row === 1)
  row1Cells.forEach(c => {
    console.log(`  ${c.address}: ${c.type === 'formula' ? `=${c.formula}` : String(c.value).substring(0, 30)}`)
  })

  // ラベルとその右隣のセルをペアで探す
  console.log('\n【ラベル-入力セル ペア候補】')
  const labelKeywords = [
    { keyword: '太陽光', section: 'incidentalCostB' },
    { keyword: '蓄電池', section: 'incidentalCostB' },
    { keyword: '確認申請', section: 'incidentalCostA' },
    { keyword: '構造計算', section: 'incidentalCostA' },
    { keyword: '構造図', section: 'incidentalCostA' },
    { keyword: 'BELS', section: 'incidentalCostA' },
    { keyword: '長期優良', section: 'incidentalCostA' },
    { keyword: '地盤', section: 'incidentalCostC' },
    { keyword: '解体', section: 'incidentalCostC' },
    { keyword: '防火', section: 'incidentalCostC' },
    { keyword: '銀行', section: 'loanPlan' },
    { keyword: '借入', section: 'loanPlan' },
    { keyword: '金利', section: 'loanPlan' },
    { keyword: '返済', section: 'loanPlan' },
    { keyword: '着工', section: 'schedule' },
    { keyword: '上棟', section: 'schedule' },
    { keyword: '竣工', section: 'schedule' },
    { keyword: '契約', section: 'paymentPlan' },
    { keyword: '中間', section: 'paymentPlan' },
    { keyword: '最終金', section: 'paymentPlan' },
    { keyword: '登記', section: 'miscellaneous' },
    { keyword: '印紙', section: 'miscellaneous' },
    { keyword: '火災保険', section: 'miscellaneous' },
    { keyword: '外構', section: 'miscellaneous' },
    { keyword: '土地', section: 'landCosts' },
    { keyword: '仲介', section: 'landCosts' },
  ]

  for (const cell of analysis.cells) {
    if (cell.type !== 'string' && cell.type !== 'richText') continue

    const val = String(cell.value)
    for (const { keyword, section } of labelKeywords) {
      if (val.includes(keyword)) {
        console.log(`  [${section}] ${cell.address}: "${val.substring(0, 40)}"`)
        break
      }
    }
  }

  console.log('\n【推奨アクション】')
  console.log('1. 上記の分析結果を参考に、lib/fund-plan/cell-mapping.ts のセルアドレスを更新')
  console.log('2. 各セクションのラベルセルの右隣または下のセルが入力セルの可能性が高い')
  console.log('3. 数式セルはそのまま保持し、値のみを入力するセルを特定する')
}

// 実行
analyzeTemplate().catch(console.error)
