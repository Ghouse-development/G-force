/**
 * 要調査フィールドのテンプレート内セル位置特定スクリプト
 *
 * FundPlanDataのフィールドに対応するセルをテンプレートから探索し、
 * 入力セルか数式かを判定します。
 *
 * 実行方法:
 * npx tsx scripts/investigate-unmapped-fields.ts
 */

import ExcelJS from 'exceljs'
import * as fs from 'fs'
import * as path from 'path'

// 調査対象フィールドとキーワードのマッピング
const FIELD_KEYWORDS: Record<string, string[]> = {
  // 基本情報
  'customerName': ['お客様', '顧客', 'お名前'],
  'constructionName': ['工事名称', '新築工事'],
  'constructionAddress': ['建築場所', '建築地', '住所'],
  'estimateValidDate': ['有効期限', '見積有効'],
  'salesRep': ['営業担当', '担当者'],
  'salesRepPhone': ['連絡先', 'TEL', '電話'],
  'managerName': ['所属長', 'マネージャー', '上長'],

  // incidentalCostA
  'incidentalCostA.confirmationApplicationFee': ['確認申請'],
  'incidentalCostA.longTermHousingApplicationFee': ['長期優良'],
  'incidentalCostA.outdoorElectricWaterDrainageFee': ['屋外電気', '給水', '排水', '雨水'],
  'incidentalCostA.designSupervisionFee': ['設計', '工事監理'],
  'incidentalCostA.safetyMeasuresFee': ['安全対策'],
  'incidentalCostA.temporaryConstructionFee': ['仮設工事', '仮設電気', '仮設水道'],

  // incidentalCostB
  'incidentalCostB.solarPanelKw': ['太陽光', 'kW', 'キロワット'],
  'incidentalCostB.solarPanelCost': ['太陽光発電システム'],
  'incidentalCostB.storageBatteryType': ['蓄電池', 'V2H', 'V2X'],
  'incidentalCostB.storageBatteryCost': ['蓄電池'],
  'incidentalCostB.eaveOverhangArea': ['軒出', 'オーバーハング'],
  'incidentalCostB.eaveOverhangCost': ['軒出', 'オーバーハング'],
  'incidentalCostB.lowerRoofArea': ['下屋'],
  'incidentalCostB.lowerRoofCost': ['下屋'],
  'incidentalCostB.balconyVoidArea': ['バルコニー', '吹抜'],
  'incidentalCostB.balconyVoidCost': ['バルコニー', '吹抜'],
  'incidentalCostB.threeStoryTsubo': ['3階建', '三階建'],
  'incidentalCostB.threeStoryDifference': ['3階建', '三階建'],
  'incidentalCostB.roofLengthExtra': ['屋根長さ'],
  'incidentalCostB.roofLengthNote': ['屋根長さ'],
  'incidentalCostB.narrowRoadExtra': ['前面道路', '4m未満'],
  'incidentalCostB.narrowRoadNote': ['前面道路', '4m未満'],
  'incidentalCostB.areaSizeTsubo': ['坪未満', '坪以上'],
  'incidentalCostB.areaSizeExtra': ['坪未満', '坪以上'],
  'incidentalCostB.lightingCost': ['照明器具'],
  'incidentalCostB.optionCost': ['オプション工事'],

  // incidentalCostC
  'incidentalCostC.fireProtectionCost': ['準防火地域', '防火地域'],
  'incidentalCostC.demolitionCost': ['解体工事'],
  'incidentalCostC.applicationManagementFee': ['申請管理'],
  'incidentalCostC.waterDrainageFee': ['給排水引き込み'],
  'incidentalCostC.groundImprovementFee': ['地盤改良'],
  'incidentalCostC.soilDisposalFee': ['残土処理'],
  'incidentalCostC.electricProtectionPipe': ['電線防護管'],
  'incidentalCostC.electricProtectionPipeExists': ['電線防護管'],
  'incidentalCostC.narrowRoadCubicExists': ['狭小道路', '㎥車'],
  'incidentalCostC.narrowRoadCubicExtra': ['狭小道路', '㎥車'],
  'incidentalCostC.deepFoundationLength': ['深基礎'],
  'incidentalCostC.deepFoundationExtraHeight': ['深基礎'],
  'incidentalCostC.deepFoundationExtra': ['深基礎'],
  'incidentalCostC.elevationExists': ['高台', '高低差'],
  'incidentalCostC.elevationExtra': ['高台', '高低差'],
  'incidentalCostC.flagLotExists': ['旗竿地'],
  'incidentalCostC.flagLotExtra': ['旗竿地'],
  'incidentalCostC.skyFactorSides': ['天空率'],
  'incidentalCostC.skyFactorExtra': ['天空率'],
  'incidentalCostC.quasiFireproofExists': ['準耐火建築物'],
  'incidentalCostC.quasiFireproofExtra': ['準耐火建築物'],
  'incidentalCostC.roadTimeRestrictionExists': ['通行時間制限'],
  'incidentalCostC.roadTimeRestrictionExtra': ['通行時間制限'],

  // miscellaneousCosts
  'miscellaneousCosts.housingLoanFee': ['住宅ローン諸費用', '保証料', '手数料'],
  'miscellaneousCosts.advanceConstruction': ['先行工事'],
  'miscellaneousCosts.customConstruction': ['造作工事'],

  // landCosts
  'landCosts.propertyTaxSettlement': ['固定資産税', '清算金'],

  // schedule
  'schedule.initialPlanHearing': ['初回間取', 'ヒアリング'],
  'schedule.landSettlement': ['土地決済'],
  'schedule.planFinalized': ['間取確定'],
  'schedule.finalPaymentDate': ['最終金', 'お支払い'],
}

interface FieldResult {
  field: string
  found: boolean
  cellType: 'input' | 'formula' | 'label' | 'not_found'
  address?: string
  value?: unknown
  keywords: string[]
  row?: number
}

async function investigateFields() {
  const templatePath = path.join(__dirname, '../public/templates/fund-plan-template.xlsx')

  if (!fs.existsSync(templatePath)) {
    console.error('テンプレートファイルが見つかりません:', templatePath)
    process.exit(1)
  }

  console.log('======================================')
  console.log('要調査フィールドのテンプレート調査')
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

  const results: FieldResult[] = []

  for (const [field, keywords] of Object.entries(FIELD_KEYWORDS)) {
    const result: FieldResult = {
      field,
      found: false,
      cellType: 'not_found',
      keywords,
    }

    // キーワードでセルを検索
    outerLoop:
    for (let row = 1; row <= 120; row++) {
      for (let col = 1; col <= 120; col++) {
        const text = getCellText(row, col)

        for (const keyword of keywords) {
          if (text.includes(keyword)) {
            result.found = true
            result.row = row

            // 右側のセルを探索して入力セルまたは数式を見つける
            for (let c2 = col + 1; c2 <= col + 30; c2++) {
              const cell = sheet.getCell(row, c2)
              if (cell.value !== null && cell.value !== undefined) {
                const colLetter = getColLetter(c2)
                const address = `${colLetter}${row}`

                if (cell.formula) {
                  result.cellType = 'formula'
                  result.address = address
                  result.value = `=Formula`
                  break outerLoop
                } else if (typeof cell.value === 'number') {
                  result.cellType = 'input'
                  result.address = address
                  result.value = cell.value
                  break outerLoop
                }
              }
            }

            // 入力セルが見つからない場合はラベルのみ
            result.cellType = 'label'
            result.address = `${getColLetter(col)}${row}`
            break outerLoop
          }
        }
      }
    }

    results.push(result)
  }

  // 結果を分類
  const inputFields = results.filter(r => r.cellType === 'input')
  const formulaFields = results.filter(r => r.cellType === 'formula')
  const labelOnlyFields = results.filter(r => r.cellType === 'label')
  const notFoundFields = results.filter(r => r.cellType === 'not_found')

  console.log(`【サマリー】`)
  console.log(`  調査フィールド数: ${results.length}`)
  console.log(`  入力セル発見: ${inputFields.length}`)
  console.log(`  数式セル: ${formulaFields.length}`)
  console.log(`  ラベルのみ: ${labelOnlyFields.length}`)
  console.log(`  未発見: ${notFoundFields.length}`)

  if (inputFields.length > 0) {
    console.log('\n【入力セル発見】マッピング追加が必要')
    for (const r of inputFields) {
      console.log(`  ★ ${r.field}`)
      console.log(`    → ${r.address}: ${r.value}`)
    }
  }

  if (formulaFields.length > 0) {
    console.log('\n【数式セル】入力不要（除外リストに追加）')
    for (const r of formulaFields) {
      console.log(`  = ${r.field}`)
      console.log(`    → ${r.address}: 数式`)
    }
  }

  if (labelOnlyFields.length > 0) {
    console.log('\n【ラベルのみ】入力セルが見つからない')
    for (const r of labelOnlyFields) {
      console.log(`  ? ${r.field}`)
      console.log(`    → Row ${r.row}: ラベルは存在するが入力セル未発見`)
    }
  }

  if (notFoundFields.length > 0) {
    console.log('\n【未発見】テンプレートに該当セルなし')
    for (const r of notFoundFields) {
      console.log(`  ✗ ${r.field}`)
      console.log(`    キーワード: ${r.keywords.join(', ')}`)
    }
  }

  // マッピング追加用のコード生成
  if (inputFields.length > 0) {
    console.log('\n======================================')
    console.log('【追加マッピングコード】')
    console.log('======================================')
    for (const r of inputFields) {
      console.log(`{
  address: '${r.address}',
  dataPath: '${r.field}',
  description: '${r.field.split('.').pop()}',
  type: 'number',
  verified: true,
  note: '自動検出',
},`)
    }
  }

  console.log('\n======================================')
  console.log('調査完了')
  console.log('======================================')
}

investigateFields().catch(console.error)
