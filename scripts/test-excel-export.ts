/**
 * Excel出力テストスクリプト
 *
 * 実際にExcelファイルを出力し、元テンプレートと比較できる状態にします。
 *
 * 実行方法:
 * npx tsx scripts/test-excel-export.ts
 */

import { exportFundPlanWithExcelJS } from '../lib/excel-export-exceljs'
import { createDefaultFundPlanData } from '../types/fund-plan'
import * as fs from 'fs'
import * as path from 'path'

async function testExcelExport() {
  console.log('======================================')
  console.log('Excel出力テスト')
  console.log('======================================\n')

  // テストデータを作成
  const testData = createDefaultFundPlanData()

  // テスト用にわかりやすい値を設定
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
  testData.incidentalCostC.soilDisposalFee = 0

  // 諸費用
  testData.miscellaneousCosts.buildingRegistrationFee = 300000
  testData.miscellaneousCosts.bridgeLoanFee = 200000
  testData.miscellaneousCosts.loanContractStampDuty = 40000
  testData.miscellaneousCosts.constructionContractStampDuty = 0
  testData.miscellaneousCosts.fireInsurance = 200000
  testData.miscellaneousCosts.advanceConstruction = 0
  testData.miscellaneousCosts.exteriorConstruction = 2000000
  testData.miscellaneousCosts.customConstruction = 0

  // 土地費用
  testData.landCosts.landPrice = 30000000
  testData.landCosts.landContractStampDuty = 10000
  testData.landCosts.brokerageFee = 1056000
  testData.landCosts.landRegistrationFee = 400000
  testData.landCosts.extinctionRegistrationFee = 0

  // 借入計画
  testData.loanPlan.bankA.amount = 55000000
  testData.loanPlan.bankA.interestRate = 0.0082
  testData.loanPlan.bankA.loanYears = 35
  testData.loanPlan.bankB.amount = 0
  testData.loanPlan.bankB.interestRate = 0.0082
  testData.loanPlan.bankB.loanYears = 40
  testData.loanPlan.bankC.amount = 0
  testData.loanPlan.bankC.interestRate = 0.0082
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
    // Excel出力を実行
    console.log('Excel出力中...')
    const buffer = await exportFundPlanWithExcelJS(testData, {
      skipUnverified: true,
      logWarnings: true,
    })

    // ファイルに保存
    const outputPath = path.join(__dirname, '../test-output-fund-plan.xlsx')
    fs.writeFileSync(outputPath, Buffer.from(buffer))

    console.log('')
    console.log('======================================')
    console.log('出力完了!')
    console.log('======================================')
    console.log('')
    console.log('出力ファイル:', outputPath)
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

testExcelExport().catch(console.error)
