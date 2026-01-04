/**
 * FundPlanData型とcell-mappingの網羅性検証スクリプト
 *
 * このスクリプトは以下を検証します：
 * 1. FundPlanDataの各フィールドがcell-mappingに存在するか
 * 2. cell-mappingのdataPathがFundPlanData型に存在するか
 * 3. マッピングされていないフィールドの一覧
 *
 * 実行方法:
 * npx tsx scripts/validate-mapping-coverage.ts
 */

import { FUND_PLAN_SECTIONS } from '../lib/fund-plan/cell-mapping'
import { createDefaultFundPlanData } from '../types/fund-plan'

// FundPlanDataの全フィールドパスを再帰的に取得
function getAllFieldPaths(obj: Record<string, unknown>, prefix = ''): string[] {
  const paths: string[] = []

  for (const [key, value] of Object.entries(obj)) {
    const currentPath = prefix ? `${prefix}.${key}` : key

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      // ネストされたオブジェクトは再帰的に処理
      // ただし、特定の深さで止める（PaymentPlanItem等の詳細は除外）
      const nestedPaths = getAllFieldPaths(value as Record<string, unknown>, currentPath)
      paths.push(...nestedPaths)
    } else {
      paths.push(currentPath)
    }
  }

  return paths
}

// cell-mappingから全dataPathを取得
function getAllMappedPaths(): Set<string> {
  const paths = new Set<string>()

  for (const section of FUND_PLAN_SECTIONS) {
    for (const cell of section.cells) {
      paths.add(cell.dataPath)
    }
  }

  return paths
}

// 除外するフィールド（自動計算、配列、複雑なオブジェクト等）
const EXCLUDED_FIELDS = new Set([
  // 自動計算されるフィールド
  'pricePerTsubo', // X28は数式

  // 複雑なオブジェクト（個別にマッピングが必要）
  'paymentPlanOutside.landPurchase.standardRate',
  'paymentPlanOutside.landPurchase.customerAmount',
  'paymentPlanOutside.landPurchase.paymentDate',
  'paymentPlanOutside.landPurchase.totalAmount',
  'paymentPlanOutside.landPurchase.selfFunding',
  'paymentPlanOutside.landPurchase.bankLoan',
  'paymentPlanOutside.miscellaneous.standardRate',
  'paymentPlanOutside.miscellaneous.customerAmount',
  'paymentPlanOutside.miscellaneous.paymentDate',
  'paymentPlanOutside.miscellaneous.totalAmount',
  'paymentPlanOutside.miscellaneous.selfFunding',
  'paymentPlanOutside.miscellaneous.bankLoan',

  // paymentPlanConstructionの詳細（standardRate以外）
  'paymentPlanConstruction.applicationFee.standardRate',
  'paymentPlanConstruction.applicationFee.customerAmount',
  'paymentPlanConstruction.applicationFee.paymentDate',
  'paymentPlanConstruction.applicationFee.totalAmount',
  'paymentPlanConstruction.applicationFee.selfFunding',
  'paymentPlanConstruction.applicationFee.bankLoan',
  'paymentPlanConstruction.contractFee.customerAmount',
  'paymentPlanConstruction.contractFee.paymentDate',
  'paymentPlanConstruction.contractFee.totalAmount',
  'paymentPlanConstruction.contractFee.selfFunding',
  'paymentPlanConstruction.contractFee.bankLoan',
  'paymentPlanConstruction.interimPayment1.customerAmount',
  'paymentPlanConstruction.interimPayment1.paymentDate',
  'paymentPlanConstruction.interimPayment1.totalAmount',
  'paymentPlanConstruction.interimPayment1.selfFunding',
  'paymentPlanConstruction.interimPayment1.bankLoan',
  'paymentPlanConstruction.interimPayment2.customerAmount',
  'paymentPlanConstruction.interimPayment2.paymentDate',
  'paymentPlanConstruction.interimPayment2.totalAmount',
  'paymentPlanConstruction.interimPayment2.selfFunding',
  'paymentPlanConstruction.interimPayment2.bankLoan',
  'paymentPlanConstruction.finalPayment.standardRate',
  'paymentPlanConstruction.finalPayment.customerAmount',
  'paymentPlanConstruction.finalPayment.paymentDate',
  'paymentPlanConstruction.finalPayment.totalAmount',
  'paymentPlanConstruction.finalPayment.selfFunding',
  'paymentPlanConstruction.finalPayment.bankLoan',

  // loanPlanの詳細（amount, interestRate, loanYears以外）
  'loanPlan.bankA.bankName',
  'loanPlan.bankA.rateType',
  'loanPlan.bankA.principalMonthly',
  'loanPlan.bankA.principalBonus',
  'loanPlan.bankA.paymentMonthly',
  'loanPlan.bankA.paymentBonus',
  'loanPlan.bankB.bankName',
  'loanPlan.bankB.rateType',
  'loanPlan.bankB.principalMonthly',
  'loanPlan.bankB.principalBonus',
  'loanPlan.bankB.paymentMonthly',
  'loanPlan.bankB.paymentBonus',
  'loanPlan.bankC.bankName',
  'loanPlan.bankC.rateType',
  'loanPlan.bankC.principalMonthly',
  'loanPlan.bankC.principalBonus',
  'loanPlan.bankC.paymentMonthly',
  'loanPlan.bankC.paymentBonus',

  // bridgeLoan（テンプレートで確認必要）
  'bridgeLoan.landBridge.name',
  'bridgeLoan.landBridge.amount',
  'bridgeLoan.landBridge.interestRate',
  'bridgeLoan.landBridge.months',
  'bridgeLoan.landBridge.monthlyInterest',
  'bridgeLoan.landBridge.totalInterest',
  'bridgeLoan.constructionStartBridge.name',
  'bridgeLoan.constructionStartBridge.amount',
  'bridgeLoan.constructionStartBridge.interestRate',
  'bridgeLoan.constructionStartBridge.months',
  'bridgeLoan.constructionStartBridge.monthlyInterest',
  'bridgeLoan.constructionStartBridge.totalInterest',
  'bridgeLoan.constructionInterimBridge.name',
  'bridgeLoan.constructionInterimBridge.amount',
  'bridgeLoan.constructionInterimBridge.interestRate',
  'bridgeLoan.constructionInterimBridge.months',
  'bridgeLoan.constructionInterimBridge.monthlyInterest',
  'bridgeLoan.constructionInterimBridge.totalInterest',

  // currentHousingCost（別セクション？）
  'currentHousingCost.rent',
  'currentHousingCost.electricity',
  'currentHousingCost.gasOil',
  'currentHousingCost.parking',

  // solarEffect（計算結果）
  'solarOnlyEffect.panelCapacityKw',
  'solarOnlyEffect.annualProductionPerKw',
  'solarOnlyEffect.annualProduction',
  'solarOnlyEffect.dailyProduction',
  'solarOnlyEffect.dailyConsumption',
  'solarOnlyEffect.batteryCharge',
  'solarOnlyEffect.dailySale',
  'solarOnlyEffect.monthlySale',
  'solarOnlyEffect.salePrice',
  'solarOnlyEffect.monthlySaleIncome',
  'solarOnlyEffect.monthlyTotalEffect',
  'solarOnlyEffect.tenYearTotalEffect',
  'solarOnlyEffect.returnRate',
  'solarBatteryEffect.panelCapacityKw',
  'solarBatteryEffect.annualProductionPerKw',
  'solarBatteryEffect.annualProduction',
  'solarBatteryEffect.dailyProduction',
  'solarBatteryEffect.dailyConsumption',
  'solarBatteryEffect.batteryCharge',
  'solarBatteryEffect.dailySale',
  'solarBatteryEffect.monthlySale',
  'solarBatteryEffect.salePrice',
  'solarBatteryEffect.monthlySaleIncome',
  'solarBatteryEffect.monthlyTotalEffect',
  'solarBatteryEffect.tenYearTotalEffect',
  'solarBatteryEffect.returnRate',

  // その他
  'remarks', // 備考欄
  'contractTotalAtSigning', // 計算値
])

// テンプレートで確認が必要なフィールド（要調査）
// ※ 調査完了したものは EXCLUDED_FIELDS か マッピング追加済み
const NEEDS_INVESTIGATION = new Set([
  // 基本情報（ラベルは存在するが入力セル未発見）
  'customerName', // 顧客名（AH1のteiNameと同一の可能性）
  'constructionName', // 工事名称
  'constructionAddress', // 建築場所
  'salesRep', // 営業担当者
  'managerName', // 所属長

  // incidentalCostB（ラベルは存在するが入力セル未発見）
  'incidentalCostB.storageBatteryType', // 蓄電池タイプ（A48ラベル）

  // landCosts（ラベルは存在するが入力セル未発見）
  'landCosts.propertyTaxSettlement', // 固定資産税清算金
])

// 数式で自動計算されるフィールド（調査完了）
const FORMULA_FIELDS = new Set([
  'estimateValidDate', // DA3=数式
  'salesRepPhone', // CD103=数式
  'incidentalCostA.confirmationApplicationFee', // O33=数式
  'incidentalCostA.longTermHousingApplicationFee', // L20=数式
  'incidentalCostB.solarPanelKw', // G46はsolarPanelCount用
  'incidentalCostB.solarPanelCost', // O46=数式
  'incidentalCostB.storageBatteryCost', // O48=数式
  'incidentalCostB.eaveOverhangArea', // J50は共用
  'incidentalCostB.eaveOverhangCost', // J50=数式
  'incidentalCostB.lowerRoofArea', // J52=数式
  'incidentalCostB.lowerRoofCost', // J52=数式
  'incidentalCostB.balconyVoidArea', // O54=数式
  'incidentalCostB.balconyVoidCost', // O54=数式
  'incidentalCostB.threeStoryTsubo', // AE46=数式
  'incidentalCostB.threeStoryDifference', // AE46=数式
  'incidentalCostB.roofLengthExtra', // AI48=数式
  'incidentalCostB.roofLengthNote', // AI48=数式
  'incidentalCostB.narrowRoadExtra', // AI48=数式
  'incidentalCostB.narrowRoadNote', // AI48=数式
  'incidentalCostB.areaSizeTsubo', // AE50=数式
  'incidentalCostB.areaSizeExtra', // AE50=数式
  'incidentalCostB.lightingCost', // AI52=数式
  'incidentalCostC.fireProtectionCost', // O59=数式
  'incidentalCostC.demolitionCost', // O61=数式
  'incidentalCostC.applicationManagementFee', // O63=数式
  'incidentalCostC.waterDrainageFee', // O65=数式
  'incidentalCostC.groundImprovementFee', // O67=数式
  'incidentalCostC.electricProtectionPipe', // O71=数式
  'incidentalCostC.electricProtectionPipeExists', // O71=数式
  'incidentalCostC.narrowRoadCubicExists', // AI59=数式
  'incidentalCostC.narrowRoadCubicExtra', // AI59=数式
  'incidentalCostC.deepFoundationLength', // AI61=数式
  'incidentalCostC.deepFoundationExtraHeight', // AI61=数式
  'incidentalCostC.deepFoundationExtra', // AI61=数式
  'incidentalCostC.elevationExists', // AI63=数式
  'incidentalCostC.elevationExtra', // AI63=数式
  'incidentalCostC.flagLotExists', // AI65=数式
  'incidentalCostC.flagLotExtra', // AI65=数式
  'incidentalCostC.skyFactorSides', // AI67=数式
  'incidentalCostC.skyFactorExtra', // AI67=数式
  'incidentalCostC.quasiFireproofExists', // AI69=数式
  'incidentalCostC.quasiFireproofExtra', // AI69=数式
  'incidentalCostC.roadTimeRestrictionExists', // AI71=数式
  'incidentalCostC.roadTimeRestrictionExtra', // AI71=数式
  'miscellaneousCosts.housingLoanFee', // O84=数式
  'schedule.initialPlanHearing', // DA12=数式
  'schedule.landSettlement', // DA14=数式
  'schedule.planFinalized', // DA16=数式
  'schedule.finalPaymentDate', // BO24=数式
])

function validateMappingCoverage() {
  console.log('======================================')
  console.log('FundPlanData型 vs cell-mapping 照合結果')
  console.log('======================================\n')

  const defaultData = createDefaultFundPlanData()
  const allFieldPaths = getAllFieldPaths(defaultData as unknown as Record<string, unknown>)
  const mappedPaths = getAllMappedPaths()

  // マッピング済みフィールド
  const mapped: string[] = []
  // 除外フィールド（自動計算等）
  const excluded: string[] = []
  // 要調査フィールド
  const needsInvestigation: string[] = []
  // 未マッピングフィールド（問題）
  const unmapped: string[] = []

  for (const field of allFieldPaths) {
    if (mappedPaths.has(field)) {
      mapped.push(field)
    } else if (EXCLUDED_FIELDS.has(field)) {
      excluded.push(field)
    } else if (FORMULA_FIELDS.has(field)) {
      excluded.push(field) // 数式フィールドも除外扱い
    } else if (NEEDS_INVESTIGATION.has(field)) {
      needsInvestigation.push(field)
    } else {
      unmapped.push(field)
    }
  }

  // マッピングに存在するがFundPlanDataにないパス
  const orphanMappings: string[] = []
  for (const path of mappedPaths) {
    if (!allFieldPaths.includes(path)) {
      orphanMappings.push(path)
    }
  }

  console.log(`【サマリー】`)
  console.log(`  FundPlanData総フィールド数: ${allFieldPaths.length}`)
  console.log(`  マッピング済み: ${mapped.length}`)
  console.log(`  除外（自動計算等）: ${excluded.length}`)
  console.log(`  要調査: ${needsInvestigation.length}`)
  console.log(`  未マッピング: ${unmapped.length}`)
  console.log(`  孤立マッピング: ${orphanMappings.length}`)

  const coverage = ((mapped.length + excluded.length) / allFieldPaths.length * 100).toFixed(1)
  console.log(`\n  カバー率: ${coverage}% (マッピング済み + 除外)`)

  if (mapped.length > 0) {
    console.log('\n【マッピング済み】')
    for (const field of mapped.sort()) {
      console.log(`  ✓ ${field}`)
    }
  }

  if (needsInvestigation.length > 0) {
    console.log('\n【要調査】テンプレートで確認が必要')
    for (const field of needsInvestigation.sort()) {
      console.log(`  ? ${field}`)
    }
  }

  if (unmapped.length > 0) {
    console.log('\n【未マッピング】対応が必要')
    for (const field of unmapped.sort()) {
      console.log(`  ✗ ${field}`)
    }
  }

  if (orphanMappings.length > 0) {
    console.log('\n【孤立マッピング】FundPlanData型に存在しないパス')
    for (const path of orphanMappings.sort()) {
      console.log(`  ! ${path}`)
    }
  }

  console.log('\n======================================')
  console.log('照合完了')
  console.log('======================================')

  // 終了コード
  if (unmapped.length > 0 || orphanMappings.length > 0) {
    process.exit(1)
  }
}

validateMappingCoverage()
