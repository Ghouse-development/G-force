/**
 * 出力Excelファイルの検証スクリプト
 *
 * 出力ファイルのセル値を読み取り、期待値と比較します。
 *
 * 実行方法:
 * npx tsx scripts/verify-excel-output.ts
 */

import ExcelJS from 'exceljs'
import * as fs from 'fs'
import * as path from 'path'

interface VerificationResult {
  address: string
  expected: unknown
  actual: unknown
  match: boolean
  hasFormula: boolean
}

async function verifyExcelOutput() {
  console.log('======================================')
  console.log('出力Excelファイル検証')
  console.log('======================================\n')

  const outputPath = path.join(__dirname, '../test-output-fund-plan.xlsx')

  if (!fs.existsSync(outputPath)) {
    console.error('出力ファイルが見つかりません:', outputPath)
    console.error('先に npx tsx scripts/test-excel-export-node.ts を実行してください')
    process.exit(1)
  }

  // 出力ファイルを読み込み
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(outputPath)

  const sheet = workbook.getWorksheet('【資金計画書】')
  if (!sheet) {
    throw new Error('【資金計画書】シートが見つかりません')
  }

  // 検証対象のセルと期待値
  const expectations: Array<{ address: string; expected: unknown; description: string }> = [
    // ヘッダー
    { address: 'AH1', expected: 'テスト太郎様邸', description: '邸名' },
    { address: 'N1', expected: 'LIFE', description: '商品タイプ' },
    { address: 'CA1', expected: 32.5, description: '施工面積' },
    { address: 'CJ1', expected: 2, description: '階数' },

    // 付帯工事費用A
    { address: 'O35', expected: 200000, description: '構造計算' },
    { address: 'O37', expected: 300000, description: '構造図作成費用' },
    { address: 'AI33', expected: 900000, description: '屋外電気・給水' },
    { address: 'AI37', expected: 950000, description: '設計・工事監理費用' },

    // 付帯工事費用B
    { address: 'G46', expected: 18, description: '太陽光パネル枚数' },
    { address: 'AI54', expected: 2500000, description: 'オプション工事費用' },

    // 諸費用
    { address: 'O82', expected: 300000, description: '建物登記費用' },
    { address: 'O86', expected: 200000, description: 'つなぎローン' },
    { address: 'O96', expected: 2000000, description: '外構工事' },

    // 土地費用
    { address: 'AI82', expected: 30000000, description: '土地売買代金' },
    { address: 'AI88', expected: 1056000, description: '土地仲介手数料' },

    // 借入計画
    { address: 'BA33', expected: 55000000, description: 'A銀行借入額' },
    { address: 'BG33', expected: 0.0082, description: 'A銀行金利' },
    { address: 'BO33', expected: 35, description: 'A銀行年数' },
    { address: 'BA35', expected: 10000000, description: 'B銀行借入額' },

    // 支払計画
    { address: 'BG18', expected: 0.1, description: '契約金割合' },
    { address: 'BG20', expected: 0.3, description: '中間時金1割合' },
  ]

  const results: VerificationResult[] = []
  let passCount = 0
  let failCount = 0

  console.log('【セル値検証】\n')

  for (const exp of expectations) {
    const cell = sheet.getCell(exp.address)
    let actual = cell.value

    // 数値の場合、誤差を考慮
    let match = false
    if (typeof actual === 'number' && typeof exp.expected === 'number') {
      match = Math.abs(actual - exp.expected) < 0.0001
    } else if (actual instanceof Date && typeof exp.expected === 'string') {
      // 日付の比較
      const expectedDate = new Date(exp.expected)
      match = actual.getTime() === expectedDate.getTime()
    } else {
      match = actual === exp.expected
    }

    const hasFormula = !!cell.formula

    results.push({
      address: exp.address,
      expected: exp.expected,
      actual,
      match,
      hasFormula,
    })

    const icon = match ? '✓' : '✗'
    const formulaNote = hasFormula ? ' (数式あり)' : ''

    if (match) {
      console.log(`  ${icon} ${exp.address}: ${exp.description}`)
      passCount++
    } else {
      console.log(`  ${icon} ${exp.address}: ${exp.description}`)
      console.log(`      期待: ${exp.expected}`)
      console.log(`      実際: ${actual}${formulaNote}`)
      failCount++
    }
  }

  // 数式の動作確認
  console.log('\n【数式セル確認】\n')

  const formulaCells = [
    { address: 'X28', description: '坪単価（商品タイプから自動計算）' },
    { address: 'O33', description: '確認申請費用（階数から自動計算）' },
    { address: 'O46', description: '太陽光発電システム費用（枚数から計算）' },
    { address: 'O59', description: '準防火地域費用' },
    { address: 'O61', description: '解体工事費用' },
    { address: 'O67', description: '地盤改良工事費用' },
  ]

  for (const fc of formulaCells) {
    const cell = sheet.getCell(fc.address)
    const hasFormula = !!cell.formula
    const value = cell.value

    if (hasFormula) {
      console.log(`  ✓ ${fc.address}: ${fc.description}`)
      console.log(`      数式: =${cell.formula?.substring(0, 40)}...`)
      console.log(`      計算値: ${typeof value === 'number' ? value : '(計算結果なし)'}`)
    } else {
      console.log(`  ? ${fc.address}: ${fc.description}`)
      console.log(`      値: ${value}`)
    }
  }

  console.log('\n======================================')
  console.log('【検証結果サマリー】')
  console.log('======================================')
  console.log(`  合格: ${passCount}/${expectations.length}`)
  console.log(`  不合格: ${failCount}/${expectations.length}`)
  console.log(`  合格率: ${((passCount / expectations.length) * 100).toFixed(1)}%`)

  if (failCount === 0) {
    console.log('\n  → 全てのセル値が正しく書き込まれています！')
  } else {
    console.log('\n  → 不合格のセルを確認してください')
  }

  console.log('\n【次のステップ】')
  console.log('  1. test-output-fund-plan.xlsx をExcelで開く')
  console.log('  2. 数式が正しく動作しているか確認')
  console.log('  3. 書式・レイアウトが保持されているか確認')
  console.log('  4. 印刷プレビューを確認')
}

verifyExcelOutput().catch(console.error)
