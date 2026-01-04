/**
 * Excel出力テストスクリプト（Node.js版）
 *
 * ブラウザ用のexportFundPlanWithExcelJSではなく、
 * 直接ExcelJSを使用してファイルを読み書きします。
 *
 * 実行方法:
 * npx tsx scripts/test-excel-export-node.ts
 */

import ExcelJS from 'exceljs'
import * as fs from 'fs'
import * as path from 'path'
import { createDefaultFundPlanData } from '../types/fund-plan'
import {
  FUND_PLAN_SECTIONS,
  getNestedValue,
} from '../lib/fund-plan/cell-mapping'

async function testExcelExportNode() {
  console.log('======================================')
  console.log('Excel出力テスト（Node.js版）')
  console.log('======================================\n')

  const templatePath = path.join(__dirname, '../public/templates/fund-plan-template.xlsx')
  const outputPath = path.join(__dirname, '../test-output-fund-plan.xlsx')

  if (!fs.existsSync(templatePath)) {
    console.error('テンプレートファイルが見つかりません:', templatePath)
    process.exit(1)
  }

  // テストデータを作成
  const testData = createDefaultFundPlanData()
  testData.teiName = 'テスト太郎様邸'
  testData.customerName = 'テスト太郎'
  testData.productType = 'LIFE'
  testData.constructionArea = 32.5
  testData.floorCount = 2
  testData.fireProtectionZone = '準防火地域'
  testData.buildingStructure = '木造軸組工法 ガルバリウム鋼板葺'
  testData.estimateDate = '2026-01-04'

  // 付帯工事費用A
  testData.incidentalCostA.structuralCalculation = 200000
  testData.incidentalCostA.structuralDrawingFee = 300000
  testData.incidentalCostA.belsApplicationFee = 200000
  testData.incidentalCostA.defectInsuranceGroundTermiteWarranty = 300000
  testData.incidentalCostA.outdoorElectricWaterDrainageFee = 900000
  testData.incidentalCostA.designSupervisionFee = 950000
  testData.incidentalCostA.safetyMeasuresFee = 250000
  testData.incidentalCostA.temporaryConstructionFee = 300000

  // 付帯工事費用B
  testData.incidentalCostB.solarPanelCount = 18
  testData.incidentalCostB.optionCost = 2500000

  // 付帯工事費用C
  testData.incidentalCostC.soilDisposalFee = 100000 // 値を入れてテスト

  // 諸費用
  testData.miscellaneousCosts.buildingRegistrationFee = 300000
  testData.miscellaneousCosts.bridgeLoanFee = 200000
  testData.miscellaneousCosts.loanContractStampDuty = 40000
  testData.miscellaneousCosts.constructionContractStampDuty = 0
  testData.miscellaneousCosts.fireInsurance = 200000
  testData.miscellaneousCosts.advanceConstruction = 50000
  testData.miscellaneousCosts.exteriorConstruction = 2000000
  testData.miscellaneousCosts.customConstruction = 100000

  // 土地費用
  testData.landCosts.landPrice = 30000000
  testData.landCosts.landContractStampDuty = 10000
  testData.landCosts.brokerageFee = 1056000
  testData.landCosts.landRegistrationFee = 400000
  testData.landCosts.extinctionRegistrationFee = 50000

  // 借入計画
  testData.loanPlan.bankA.amount = 55000000
  testData.loanPlan.bankA.interestRate = 0.0082
  testData.loanPlan.bankA.loanYears = 35
  testData.loanPlan.bankB.amount = 10000000
  testData.loanPlan.bankB.interestRate = 0.0095
  testData.loanPlan.bankB.loanYears = 40
  testData.loanPlan.bankC.amount = 0
  testData.loanPlan.bankC.interestRate = 0.01
  testData.loanPlan.bankC.loanYears = 30

  // スケジュール
  testData.schedule.landContract = '2026-01-15'
  testData.schedule.buildingContract = '2026-02-01'
  testData.schedule.finalSpecMeeting = '2026-03-15'
  testData.schedule.changeContract = '2026-04-01'
  testData.schedule.constructionStart = '2026-05-01'
  testData.schedule.roofRaising = '2026-06-15'
  testData.schedule.completion = '2026-09-30'

  // 支払計画
  testData.paymentPlanConstruction.contractFee.standardRate = 0.1
  testData.paymentPlanConstruction.interimPayment1.standardRate = 0.3
  testData.paymentPlanConstruction.interimPayment2.standardRate = 0.3

  console.log('テストデータ:')
  console.log('  邸名:', testData.teiName)
  console.log('  商品:', testData.productType)
  console.log('  面積:', testData.constructionArea, '坪')
  console.log('  階数:', testData.floorCount)
  console.log('')

  try {
    // テンプレートを読み込み
    console.log('テンプレート読み込み中...')
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(templatePath)

    const sheet = workbook.getWorksheet('【資金計画書】')
    if (!sheet) {
      throw new Error('【資金計画書】シートが見つかりません')
    }

    // セルに値を書き込み
    console.log('セルに値を書き込み中...')
    let writtenCount = 0
    const writtenCells: string[] = []

    for (const section of FUND_PLAN_SECTIONS) {
      for (const cellMapping of section.cells) {
        if (!cellMapping.verified) continue

        const value = getNestedValue(testData as unknown as Record<string, unknown>, cellMapping.dataPath)
        if (value === undefined || value === null || value === '') continue

        const cell = sheet.getCell(cellMapping.address)

        // 元の書式を保持しながら値を設定
        const originalStyle = cell.style

        if (cellMapping.type === 'date' && typeof value === 'string') {
          // 日付の場合
          cell.value = new Date(value)
        } else {
          cell.value = value as ExcelJS.CellValue
        }

        // 書式を復元
        cell.style = originalStyle

        writtenCells.push(`${cellMapping.address}: ${value}`)
        writtenCount++
      }
    }

    console.log(`  書き込み完了: ${writtenCount}セル`)
    console.log('')

    // ファイルを保存
    console.log('ファイル保存中...')
    await workbook.xlsx.writeFile(outputPath)

    console.log('')
    console.log('======================================')
    console.log('出力完了!')
    console.log('======================================')
    console.log('')
    console.log('出力ファイル:', outputPath)
    console.log('')
    console.log('【書き込んだセル一覧】')
    for (const cell of writtenCells) {
      console.log('  ', cell)
    }
    console.log('')
    console.log('【確認手順】')
    console.log('1. 出力ファイルをExcelで開く')
    console.log('2. 元テンプレートと比較')
    console.log('3. 以下を確認:')
    console.log('   - セルに値が正しく入っているか')
    console.log('   - 数式が正しく動作しているか')
    console.log('   - 書式・レイアウトが保持されているか')
    console.log('   - 印刷プレビューが正常か')

  } catch (error) {
    console.error('出力エラー:', error)
    process.exit(1)
  }
}

testExcelExportNode().catch(console.error)
