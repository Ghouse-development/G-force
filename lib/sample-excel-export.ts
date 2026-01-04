/**
 * サンプルExcelダウンロード機能
 *
 * ダミーデータを含むサンプルExcelファイルをダウンロードします。
 * フォーマットの確認や、新規作成の参考として使用できます。
 */

import { createDefaultFundPlanData } from '@/types/fund-plan'
import { createDefaultContractData } from '@/types/contract'
import { exportFundPlanWithExcelJS } from './excel-export-exceljs'
import { exportContractWithExcelJS } from './excel-export-contract'

/**
 * サンプル資金計画書データを作成
 * 実際の入力例として参考になるダミーデータを設定
 */
function createSampleFundPlanData() {
  const data = createDefaultFundPlanData()

  // サンプル顧客情報
  data.customerName = '山田 太郎'
  data.teiName = '山田様邸'
  data.constructionName = '山田様邸　新築工事'
  data.constructionAddress = '大阪府豊中市〇〇町1-2-3'

  // サンプル営業担当
  data.salesRep = '営業担当 一郎'
  data.salesRepPhone = '090-0000-0000'
  data.managerName = '所長 次郎'

  // サンプル仕様
  data.productType = 'LIFE'
  data.constructionArea = 32
  data.pricePerTsubo = 550000
  data.floorCount = 2

  // サンプル付帯工事（太陽光）
  data.incidentalCostB.solarPanelCount = 18
  data.incidentalCostB.solarPanelKw = 8.37
  data.incidentalCostB.solarPanelCost = 1753300
  data.incidentalCostB.lightingCost = 350000
  data.incidentalCostB.optionCost = 2800000

  // サンプル土地情報
  data.landCosts.landPrice = 28000000
  data.landCosts.brokerageFee = 980000

  return data
}

/**
 * サンプル請負契約書データを作成
 * 実際の入力例として参考になるダミーデータを設定
 */
function createSampleContractData() {
  const data = createDefaultContractData()

  // サンプル顧客情報
  data.customerName = '山田 太郎'
  data.customerAddress = '大阪府豊中市〇〇町1-2-3'
  data.constructionName = '山田様邸　新築工事'
  data.constructionSite = '大阪府豊中市〇〇町1-2-3'

  // サンプル担当者
  data.salesRep = '営業担当 一郎'
  data.importantMatterExplainer.name = '設計 花子'
  data.importantMatterExplainer.registrationNumber = '第123456号'

  // サンプル仕様
  data.structure = '木造軸組工法'
  data.floorCount = 2
  data.constructionArea = 32
  data.productType = 'LIFE'

  // サンプル面積
  data.floor1Area = 54.5
  data.floor2Area = 45.5
  data.floor1Included = true
  data.floor2Included = true

  // サンプル金額（税額と合計額はExcel数式で計算される）
  data.constructionPrice = 35000000

  // サンプル支払い
  data.payment1Amount = 100000 // 申込金
  data.payment2Amount = 3000000 // 契約金
  data.payment3Amount = 10000000 // 着工金
  data.payment4Amount = 25400000 // 残金

  // サンプル工期
  const today = new Date()
  const startDate = new Date(today.getFullYear(), today.getMonth() + 2, 1)
  const completionDate = new Date(today.getFullYear(), today.getMonth() + 8, 15)
  data.startDate = startDate.toISOString().split('T')[0]
  data.completionDate = completionDate.toISOString().split('T')[0]

  return data
}

/**
 * サンプル資金計画書をダウンロード
 */
export async function downloadSampleFundPlan() {
  const sampleData = createSampleFundPlanData()
  await exportFundPlanWithExcelJS(
    sampleData,
    'サンプル_資金計画書',
    { showWarnings: false }
  )
}

/**
 * サンプル請負契約書をダウンロード
 */
export async function downloadSampleContract() {
  const sampleData = createSampleContractData()
  await exportContractWithExcelJS(
    sampleData,
    'サンプル_請負契約書',
    { showWarnings: false }
  )
}
