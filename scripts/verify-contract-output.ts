/**
 * 請負契約書出力Excelファイルの検証スクリプト
 *
 * 出力ファイルのセル値を読み取り、期待値と比較します。
 *
 * 実行方法:
 * npx tsx scripts/verify-contract-output.ts
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

async function verifyContractOutput() {
  console.log('======================================')
  console.log('請負契約書出力Excelファイル検証')
  console.log('======================================\n')

  const outputPath = path.join(__dirname, '../test-output-contract.xlsx')

  if (!fs.existsSync(outputPath)) {
    console.error('出力ファイルが見つかりません:', outputPath)
    console.error('先に npx tsx scripts/test-contract-export-node.ts を実行してください')
    process.exit(1)
  }

  // 出力ファイルを読み込み
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(outputPath)

  const sheet = workbook.getWorksheet('初期入力')
  if (!sheet) {
    throw new Error('初期入力シートが見つかりません')
  }

  // 検証対象のセルと期待値
  const expectations: Array<{ address: string; expected: unknown; description: string }> = [
    // 基本情報
    { address: 'B3', expected: '大阪市旭区新森　テスト太郎様邸新築工事', description: '工事名称' },
    { address: 'B4', expected: 'テスト太郎', description: '客先氏名' },
    { address: 'B5', expected: '大阪府大阪市中央区本町1-1-1', description: '客先住所' },
    { address: 'B6', expected: 'テスト花子', description: '客先氏名2' },

    // 担当者情報
    { address: 'B8', expected: '田中　聡', description: '重要事項説明者' },
    { address: 'B11', expected: '共有', description: '単独/共有' },
    { address: 'B12', expected: '田畑　美香', description: '営業担当' },

    // 契約日
    { address: 'C13', expected: 2026, description: '請負契約年' },
    { address: 'E13', expected: 1, description: '請負契約月' },
    { address: 'G13', expected: 15, description: '請負契約日' },

    // 建物情報
    { address: 'B15', expected: '大阪府大阪市旭区新森1-2-3', description: '工事場所' },
    { address: 'B16', expected: '木造軸組工法', description: '構造' },
    { address: 'B17', expected: 2, description: '建物階数' },
    { address: 'B18', expected: 1, description: '棟数' },
    { address: 'B19', expected: 49.04, description: '1階床面積' },
    { address: 'B20', expected: '〇', description: '1階対象フラグ' },
    { address: 'B21', expected: 44.81, description: '2階床面積' },
    { address: 'B22', expected: '〇', description: '2階対象フラグ' },
    { address: 'B25', expected: 28.4, description: '施工面積' },

    // 金額
    { address: 'B31', expected: 25208700, description: '工事価格（税抜き）' },

    // 支払計画
    { address: 'B34', expected: 100000, description: '1回金' },
    { address: 'B36', expected: 1000000, description: '2回金' },
    { address: 'B38', expected: 8300000, description: '3回金' },
    { address: 'B40', expected: 8300000, description: '4回金' },

    // その他
    { address: 'B44', expected: '103999', description: '契約番号' },

    // 変更契約
    { address: 'C14', expected: 2026, description: '変更契約年' },
    { address: 'E14', expected: 3, description: '変更契約月' },
    { address: 'G14', expected: 15, description: '変更契約日' },
  ]

  const results: VerificationResult[] = []
  let passCount = 0
  let failCount = 0

  console.log('【初期入力シート セル値検証】\n')

  for (const exp of expectations) {
    const cell = sheet.getCell(exp.address)
    let actual = cell.value

    // 数値の場合、誤差を考慮
    let match = false
    if (typeof actual === 'number' && typeof exp.expected === 'number') {
      match = Math.abs(actual - exp.expected) < 0.0001
    } else if (actual instanceof Date && typeof exp.expected === 'string') {
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

  // 数式の動作確認（他シートへの反映）
  console.log('\n【他シートへの反映確認】\n')

  const contractSheet = workbook.getWorksheet('工事請負契約書')
  if (contractSheet) {
    console.log('  工事請負契約書シート: 存在')
    // 契約番号セルの確認
    const noCell = contractSheet.getCell('C2')
    console.log(`    C2 (契約番号): ${noCell.formula ? '数式あり =' + noCell.formula?.substring(0, 30) : noCell.value}`)
  } else {
    console.log('  工事請負契約書シート: 見つかりません')
  }

  const importantSheet = workbook.getWorksheet('★重要事項説明書・省エネ説明義務化')
  if (importantSheet) {
    console.log('  重要事項説明書シート: 存在')
  } else {
    console.log('  重要事項説明書シート: 見つかりません')
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
  console.log('  1. test-output-contract.xlsx をExcelで開く')
  console.log('  2. 工事請負契約書シートに数式で反映されているか確認')
  console.log('  3. 重要事項説明書シートに数式で反映されているか確認')
  console.log('  4. 印刷プレビューを確認')
}

verifyContractOutput().catch(console.error)
