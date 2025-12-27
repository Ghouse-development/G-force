/**
 * Excel出力ユーティリティ
 * 資金計画書・請負契約書のExcel出力
 */

import * as XLSX from 'xlsx'
import type { FundPlanData } from '@/types/fund-plan'

// ============================================
// テンプレートベースExcel出力（完全一致版）
// ============================================

/**
 * テンプレートを使用して資金計画書をExcel出力（完全一致版）
 */
export async function exportFundPlanFromTemplate(
  data: FundPlanData,
  filename?: string
): Promise<void> {
  try {
    // テンプレートファイルを読み込み
    const templatePath = '/templates/fund-plan-template.xlsx'
    const response = await fetch(templatePath)

    if (!response.ok) {
      throw new Error(`テンプレートファイルの読み込みに失敗しました: ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })

    // 資金計画書シートを取得
    const sheetName = '【資金計画書】'
    const sheet = workbook.Sheets[sheetName]

    if (!sheet) {
      throw new Error(`シート「${sheetName}」が見つかりません`)
    }

    // データをセルに書き込み
    fillFundPlanData(sheet, data)

    // 契約のご案内シートにもデータを書き込み
    const guideSheet = workbook.Sheets['契約のご案内（お客様用）']
    if (guideSheet) {
      fillContractGuideData(guideSheet, data)
    }

    // 資金の流れシートにもデータを書き込み
    const flowSheet = workbook.Sheets['資金の流れ（LIFE・LIFE＋）']
    if (flowSheet) {
      fillFundFlowData(flowSheet, data)
    }

    // ダウンロード
    const defaultFilename = `資金計画書_${data.teiName || data.customerName}_${new Date().toISOString().split('T')[0]}`
    downloadWorkbook(workbook, filename || defaultFilename)

  } catch (error) {
    console.error('Excel出力エラー:', error)
    throw error
  }
}

/**
 * 資金計画書シートにデータを書き込み
 */
function fillFundPlanData(sheet: XLSX.WorkSheet, data: FundPlanData): void {
  // 顧客名（AH1 → F1の「様邸 資金計画書」の前に入る）
  if (data.customerName) {
    setCellValue(sheet, 'AH1', data.customerName)
  }

  // 商品タイプ
  if (data.productType) {
    setCellValue(sheet, 'N1', data.productType)
  }

  // 施工面積（坪）
  if (data.constructionArea) {
    setCellValue(sheet, 'CA1', data.constructionArea)
  }

  // 防火区分（準防火地域なら〇）
  if (data.fireProtectionZone) {
    const isQuasiFireProof = data.fireProtectionZone.includes('準防火')
    setCellValue(sheet, 'BG1', isQuasiFireProof ? '〇' : '×')
  }

  // 階数
  if (data.floorCount) {
    setCellValue(sheet, 'CJ1', data.floorCount)
  }

  // 建物構造
  if (data.buildingStructure) {
    setCellValue(sheet, 'BM1', data.buildingStructure)
  }

  // 太陽光パネル枚数
  if (data.incidentalCostB?.solarPanelCount) {
    setCellValue(sheet, 'G46', data.incidentalCostB.solarPanelCount)
  }

  // 付帯工事費用A
  if (data.incidentalCostA) {
    const costA = data.incidentalCostA
    setCellValue(sheet, 'O33', costA.confirmationApplicationFee)
    setCellValue(sheet, 'O35', costA.structuralCalculation)
    setCellValue(sheet, 'O37', costA.structuralDrawingFee)
    setCellValue(sheet, 'O39', costA.belsApplicationFee)
  }

  // 諸費用
  if (data.miscellaneousCosts) {
    const misc = data.miscellaneousCosts
    setCellValue(sheet, 'O86', misc.bridgeLoanFee)
    setCellValue(sheet, 'O88', misc.loanContractStampDuty)
    setCellValue(sheet, 'O92', misc.fireInsurance)
    setCellValue(sheet, 'O96', misc.exteriorConstruction)
  }

  // 借入計画
  if (data.loanPlan) {
    const { bankA, bankB, bankC } = data.loanPlan

    if (bankA) {
      setCellValue(sheet, 'BA33', bankA.amount)
      setCellValue(sheet, 'BG33', bankA.interestRate)
      setCellValue(sheet, 'BO33', bankA.loanYears)
    }
    if (bankB) {
      setCellValue(sheet, 'BA35', bankB.amount)
      setCellValue(sheet, 'BG35', bankB.interestRate)
      setCellValue(sheet, 'BO35', bankB.loanYears)
    }
    if (bankC) {
      setCellValue(sheet, 'BA37', bankC.amount)
      setCellValue(sheet, 'BG37', bankC.interestRate)
      setCellValue(sheet, 'BO37', bankC.loanYears)
    }
  }
}

/**
 * 契約のご案内シートにデータを書き込み
 */
function fillContractGuideData(sheet: XLSX.WorkSheet, data: FundPlanData): void {
  // 顧客名
  if (data.customerName) {
    setCellValue(sheet, 'B3', `${data.customerName}　様`)
  }

  // 契約金（通常100万円）
  if (data.paymentPlanConstruction?.contractFee) {
    setCellValue(sheet, 'D20', data.paymentPlanConstruction.contractFee.totalAmount)
  }
}

/**
 * 資金の流れシートにデータを書き込み
 */
function fillFundFlowData(sheet: XLSX.WorkSheet, data: FundPlanData): void {
  // 顧客名
  if (data.customerName) {
    setCellValue(sheet, 'C2', `${data.customerName}様　資金の流れ`)
  }

  // 各支払段階の金額を設定
  if (data.paymentPlanConstruction) {
    const plan = data.paymentPlanConstruction

    // 建物契約金
    if (plan.contractFee) {
      setCellValue(sheet, 'F14', plan.contractFee.totalAmount)
    }
  }
}

/**
 * セルに値を設定するヘルパー
 */
function setCellValue(
  sheet: XLSX.WorkSheet,
  address: string,
  value: string | number | null | undefined
): void {
  if (value === null || value === undefined) return

  // セルが存在しない場合は作成
  if (!sheet[address]) {
    sheet[address] = {}
  }

  // 数値の場合
  if (typeof value === 'number') {
    sheet[address] = { t: 'n', v: value }
  } else {
    sheet[address] = { t: 's', v: String(value) }
  }
}

// ============================================
// 共通ユーティリティ
// ============================================

/**
 * ワークブックをダウンロード
 */
export function downloadWorkbook(workbook: XLSX.WorkBook, filename: string): void {
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 金額をフォーマット
 */
function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null) return ''
  return `¥${value.toLocaleString()}`
}

/**
 * 日付をフォーマット
 */
function formatDate(value: string | undefined | null): string {
  if (!value) return ''
  return new Date(value).toLocaleDateString('ja-JP')
}

// ============================================
// 資金計画書Excel出力
// ============================================

/**
 * 資金計画書をExcelに出力
 */
export function exportFundPlanToExcel(data: FundPlanData, filename?: string): void {
  const workbook = XLSX.utils.book_new()

  // シート1: 基本情報・費用一覧
  const mainSheet = createFundPlanMainSheet(data)
  XLSX.utils.book_append_sheet(workbook, mainSheet, '資金計画書')

  // シート2: 支払計画
  const paymentSheet = createPaymentPlanSheet(data)
  XLSX.utils.book_append_sheet(workbook, paymentSheet, '支払計画')

  // シート3: 借入計画
  const loanSheet = createLoanPlanSheet(data)
  XLSX.utils.book_append_sheet(workbook, loanSheet, '借入計画')

  // ダウンロード
  const defaultFilename = `資金計画書_${data.teiName}_${new Date().toISOString().split('T')[0]}`
  downloadWorkbook(workbook, filename || defaultFilename)
}

/**
 * 資金計画書メインシート作成
 */
function createFundPlanMainSheet(data: FundPlanData): XLSX.WorkSheet {
  const rows: (string | number | null)[][] = []

  // ヘッダー
  rows.push(['資金計画書'])
  rows.push([])

  // 基本情報
  rows.push(['【基本情報】'])
  rows.push(['顧客名', data.customerName])
  rows.push(['邸名', data.teiName])
  rows.push(['工事名称', data.constructionName])
  rows.push(['建築場所', data.constructionAddress])
  rows.push(['防火区分', data.fireProtectionZone])
  rows.push(['建物構造', data.buildingStructure])
  rows.push(['施工面積', `${data.constructionArea}坪`])
  rows.push(['階数', `${data.floorCount}階`])
  rows.push(['見積作成日', formatDate(data.estimateDate)])
  rows.push(['見積有効期限', formatDate(data.estimateValidDate)])
  rows.push(['営業担当', data.salesRep])
  rows.push(['連絡先', data.salesRepPhone])
  rows.push([])

  // 商品情報
  rows.push(['【商品・仕様】'])
  rows.push(['商品タイプ', data.productType])
  rows.push(['坪単価', formatCurrency(data.pricePerTsubo)])
  rows.push([])

  // 費用一覧
  rows.push(['【費用内訳】', '項目', '金額'])

  // ➊建物本体工事
  const buildingCost = data.constructionArea * data.pricePerTsubo
  rows.push(['➊ 建物本体工事', '', formatCurrency(buildingCost)])
  rows.push(['', `${data.constructionArea}坪 × ${formatCurrency(data.pricePerTsubo)}`, ''])
  rows.push([])

  // ➋付帯工事費用A
  rows.push(['➋ 付帯工事費用A（建物本体以外）'])
  const costA = data.incidentalCostA
  rows.push(['', '確認申請費用', formatCurrency(costA.confirmationApplicationFee)])
  rows.push(['', '構造計算', formatCurrency(costA.structuralCalculation)])
  rows.push(['', '構造図作成費用', formatCurrency(costA.structuralDrawingFee)])
  rows.push(['', 'BELS評価書申請費用', formatCurrency(costA.belsApplicationFee)])
  rows.push(['', '長期優良住宅申請費用', formatCurrency(costA.longTermHousingApplicationFee)])
  rows.push(['', '屋外電気・給排水工事', formatCurrency(costA.outdoorElectricWaterDrainageFee)])
  rows.push(['', '瑕疵保険・地盤保証', formatCurrency(costA.defectInsuranceGroundTermiteWarranty)])
  rows.push(['', '設計・工事監理費用', formatCurrency(costA.designSupervisionFee)])
  rows.push(['', '安全対策費用', formatCurrency(costA.safetyMeasuresFee)])
  rows.push(['', '仮設工事費用', formatCurrency(costA.temporaryConstructionFee)])

  const totalA = Object.values(costA).reduce((sum, v) => sum + (typeof v === 'number' ? v : 0), 0)
  rows.push(['', '小計', formatCurrency(totalA)])
  rows.push([])

  // ➌付帯工事費用B
  rows.push(['➌ 付帯工事費用B（間取・オプション）'])
  const costB = data.incidentalCostB
  rows.push(['', `太陽光発電システム（${costB.solarPanelKw}kW）`, formatCurrency(costB.solarPanelCost)])
  rows.push(['', `蓄電池（${costB.storageBatteryType}）`, formatCurrency(costB.storageBatteryCost)])
  rows.push(['', `軒出・オーバーハング（${costB.eaveOverhangArea}㎡）`, formatCurrency(costB.eaveOverhangCost)])
  rows.push(['', `下屋工事（${costB.lowerRoofArea}㎡）`, formatCurrency(costB.lowerRoofCost)])
  rows.push(['', `バルコニー・吹抜（${costB.balconyVoidArea}㎡）`, formatCurrency(costB.balconyVoidCost)])
  rows.push(['', `3階建て差額（${costB.threeStoryTsubo}坪）`, formatCurrency(costB.threeStoryDifference)])
  rows.push(['', '屋根長さ割増', formatCurrency(costB.roofLengthExtra)])
  rows.push(['', '前面道路4m未満', formatCurrency(costB.narrowRoadExtra)])
  rows.push(['', '面積割増', formatCurrency(costB.areaSizeExtra)])
  rows.push(['', '照明器具費用', formatCurrency(costB.lightingCost)])
  rows.push(['', 'オプション工事', formatCurrency(costB.optionCost)])

  const totalB = costB.solarPanelCost + costB.storageBatteryCost + costB.eaveOverhangCost +
    costB.lowerRoofCost + costB.balconyVoidCost + costB.threeStoryDifference +
    costB.roofLengthExtra + costB.narrowRoadExtra + costB.areaSizeExtra +
    costB.lightingCost + costB.optionCost
  rows.push(['', '小計', formatCurrency(totalB)])
  rows.push([])

  // ➍付帯工事費用C
  rows.push(['➍ 付帯工事費用C（土地関連）'])
  const costC = data.incidentalCostC
  rows.push(['', '防火地域追加費用', formatCurrency(costC.fireProtectionCost)])
  rows.push(['', '解体工事', formatCurrency(costC.demolitionCost)])
  rows.push(['', '各種申請管理費用', formatCurrency(costC.applicationManagementFee)])
  rows.push(['', '給排水引き込み工事', formatCurrency(costC.waterDrainageFee)])
  rows.push(['', '地盤改良工事', formatCurrency(costC.groundImprovementFee)])
  rows.push(['', '残土処理工事', formatCurrency(costC.soilDisposalFee)])
  rows.push(['', '電線防護管', formatCurrency(costC.electricProtectionPipe)])
  rows.push(['', '狭小道路割増', formatCurrency(costC.narrowRoadCubicExtra)])
  rows.push(['', '深基礎割増', formatCurrency(costC.deepFoundationExtra)])
  rows.push(['', '高台割増', formatCurrency(costC.elevationExtra)])
  rows.push(['', '旗竿地', formatCurrency(costC.flagLotExtra)])
  rows.push(['', '天空率', formatCurrency(costC.skyFactorExtra)])
  rows.push(['', '準耐火建築物', formatCurrency(costC.quasiFireproofExtra)])
  rows.push(['', '道路通行時間制限', formatCurrency(costC.roadTimeRestrictionExtra)])

  const totalC = costC.fireProtectionCost + costC.demolitionCost + costC.applicationManagementFee +
    costC.waterDrainageFee + costC.groundImprovementFee + costC.soilDisposalFee +
    costC.electricProtectionPipe + costC.narrowRoadCubicExtra + costC.deepFoundationExtra +
    costC.elevationExtra + costC.flagLotExtra + costC.skyFactorExtra +
    costC.quasiFireproofExtra + costC.roadTimeRestrictionExtra
  rows.push(['', '小計', formatCurrency(totalC)])
  rows.push([])

  // ➎諸費用
  rows.push(['➎ 諸費用'])
  const misc = data.miscellaneousCosts
  rows.push(['', '建物登記費用', formatCurrency(misc.buildingRegistrationFee)])
  rows.push(['', '住宅ローン諸費用', formatCurrency(misc.housingLoanFee)])
  rows.push(['', 'つなぎローン諸費用', formatCurrency(misc.bridgeLoanFee)])
  rows.push(['', '金銭消費貸借契約印紙代', formatCurrency(misc.loanContractStampDuty)])
  rows.push(['', '建物請負工事契約印紙代', formatCurrency(misc.constructionContractStampDuty)])
  rows.push(['', '火災保険料', formatCurrency(misc.fireInsurance)])
  rows.push(['', '先行工事', formatCurrency(misc.advanceConstruction)])
  rows.push(['', '外構工事', formatCurrency(misc.exteriorConstruction)])
  rows.push(['', '造作工事', formatCurrency(misc.customConstruction)])

  const totalMisc = Object.values(misc).reduce((sum, v) => sum + (typeof v === 'number' ? v : 0), 0)
  rows.push(['', '小計', formatCurrency(totalMisc)])
  rows.push([])

  // 合計
  const grandTotal = buildingCost + totalA + totalB + totalC + totalMisc
  rows.push(['【合計金額】', '', formatCurrency(grandTotal)])

  const ws = XLSX.utils.aoa_to_sheet(rows)

  // 列幅設定
  ws['!cols'] = [
    { wch: 30 },
    { wch: 35 },
    { wch: 20 }
  ]

  return ws
}

/**
 * 支払計画シート作成
 */
function createPaymentPlanSheet(data: FundPlanData): XLSX.WorkSheet {
  const rows: (string | number | null)[][] = []

  rows.push(['支払計画'])
  rows.push([])

  // 建築費支払計画
  rows.push(['【建築費支払計画】'])
  rows.push(['項目', '基準', '金額', '支払予定日', '自己資金', '銀行融資'])

  if (data.paymentPlanConstruction) {
    const plan = data.paymentPlanConstruction
    const items = [
      { name: '建築申込金', item: plan.applicationFee },
      { name: '契約金（10%）', item: plan.contractFee },
      { name: '中間時金(1)（30%）', item: plan.interimPayment1 },
      { name: '中間時金(2)（30%）', item: plan.interimPayment2 },
      { name: '最終金（残代金）', item: plan.finalPayment },
    ]

    items.forEach(({ name, item }) => {
      if (item) {
        rows.push([
          name,
          typeof item.standardRate === 'number' ? `${item.standardRate * 100}%` : '',
          formatCurrency(item.totalAmount),
          formatDate(item.paymentDate),
          formatCurrency(item.selfFunding),
          formatCurrency(item.bankLoan)
        ])
      }
    })
  }

  rows.push([])

  // 建築費以外の支払計画
  rows.push(['【建築費以外の支払計画】'])
  rows.push(['項目', '基準', '金額', '支払予定日', '自己資金', '銀行融資'])

  if (data.paymentPlanOutside) {
    const plan = data.paymentPlanOutside
    const items = [
      { name: '土地購入費用', item: plan.landPurchase },
      { name: '諸費用', item: plan.miscellaneous },
    ]

    items.forEach(({ name, item }) => {
      if (item) {
        rows.push([
          name,
          '',
          formatCurrency(item.totalAmount),
          formatDate(item.paymentDate),
          formatCurrency(item.selfFunding),
          formatCurrency(item.bankLoan)
        ])
      }
    })
  }

  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [
    { wch: 20 },
    { wch: 12 },
    { wch: 18 },
    { wch: 15 },
    { wch: 18 },
    { wch: 18 }
  ]

  return ws
}

/**
 * 借入計画シート作成
 */
function createLoanPlanSheet(data: FundPlanData): XLSX.WorkSheet {
  const rows: (string | number | null)[][] = []

  rows.push(['借入計画'])
  rows.push([])
  rows.push(['銀行名', '借入額', '金利', '金利タイプ', '借入年数', '毎月返済額', 'ボーナス時返済額'])

  if (data.loanPlan) {
    const plans = [
      { name: '銀行A', plan: data.loanPlan.bankA },
      { name: '銀行B', plan: data.loanPlan.bankB },
      { name: '銀行C', plan: data.loanPlan.bankC },
    ]

    plans.forEach(({ name, plan }) => {
      if (plan && plan.amount > 0) {
        rows.push([
          plan.bankName || name,
          formatCurrency(plan.amount),
          `${(plan.interestRate * 100).toFixed(2)}%`,
          plan.rateType,
          `${plan.loanYears}年`,
          formatCurrency(plan.paymentMonthly),
          formatCurrency(plan.paymentBonus)
        ])
      }
    })
  }

  rows.push([])
  rows.push(['つなぎ融資'])
  rows.push(['名称', '借入額', '金利', '期間（月）', '毎月金利息', '合計金利息'])

  if (data.bridgeLoan) {
    const bridge = data.bridgeLoan
    const items = [
      bridge.landBridge,
      bridge.constructionStartBridge,
      bridge.constructionInterimBridge,
    ]

    items.forEach(item => {
      if (item.amount > 0) {
        rows.push([
          item.name,
          formatCurrency(item.amount),
          `${(item.interestRate * 100).toFixed(2)}%`,
          item.months,
          formatCurrency(item.monthlyInterest),
          formatCurrency(item.totalInterest)
        ])
      }
    })
  }

  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [
    { wch: 20 },
    { wch: 18 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 18 },
    { wch: 18 }
  ]

  return ws
}

// ============================================
// 請負契約書Excel出力
// ============================================

export interface ContractData {
  contractNumber: string
  contractDate: string
  customerName: string
  customerAddress: string
  customerPhone?: string
  teiName: string
  constructionAddress: string
  constructionArea: number
  contractAmount: number
  taxAmount: number
  totalAmount: number
  startDate: string
  completionDate: string
  deliveryDate: string
  paymentTerms: {
    atContract: { amount: number; date: string }
    atStart: { amount: number; date: string }
    atFraming: { amount: number; date: string }
    atCompletion: { amount: number; date: string }
  }
  specifications?: string
  notes?: string
  salesRep: string
  managerName: string
}

/**
 * 請負契約書をExcelに出力
 */
export function exportContractToExcel(data: ContractData, filename?: string): void {
  const workbook = XLSX.utils.book_new()

  // シート1: 契約書
  const contractSheet = createContractSheet(data)
  XLSX.utils.book_append_sheet(workbook, contractSheet, '請負契約書')

  // シート2: 支払条件
  const paymentSheet = createContractPaymentSheet(data)
  XLSX.utils.book_append_sheet(workbook, paymentSheet, '支払条件')

  // ダウンロード
  const defaultFilename = `請負契約書_${data.teiName}_${data.contractNumber}`
  downloadWorkbook(workbook, filename || defaultFilename)
}

/**
 * 契約書シート作成
 */
function createContractSheet(data: ContractData): XLSX.WorkSheet {
  const rows: (string | number | null)[][] = []

  rows.push(['建物請負工事契約書'])
  rows.push([])
  rows.push(['契約番号', data.contractNumber])
  rows.push(['契約日', formatDate(data.contractDate)])
  rows.push([])

  rows.push(['【発注者（甲）】'])
  rows.push(['氏名', data.customerName])
  rows.push(['住所', data.customerAddress])
  if (data.customerPhone) {
    rows.push(['電話番号', data.customerPhone])
  }
  rows.push([])

  rows.push(['【受注者（乙）】'])
  rows.push(['商号', '株式会社Gハウス'])
  rows.push(['代表者', '代表取締役 ○○○○'])
  rows.push(['住所', '○○県○○市○○町1-2-3'])
  rows.push([])

  rows.push(['【工事概要】'])
  rows.push(['工事名称', `${data.teiName} 新築工事`])
  rows.push(['建築場所', data.constructionAddress])
  rows.push(['施工面積', `${data.constructionArea}坪`])
  rows.push([])

  rows.push(['【契約金額】'])
  rows.push(['工事価格（税抜）', formatCurrency(data.contractAmount)])
  rows.push(['消費税', formatCurrency(data.taxAmount)])
  rows.push(['契約金額（税込）', formatCurrency(data.totalAmount)])
  rows.push([])

  rows.push(['【工期】'])
  rows.push(['着工予定日', formatDate(data.startDate)])
  rows.push(['完工予定日', formatDate(data.completionDate)])
  rows.push(['引渡予定日', formatDate(data.deliveryDate)])
  rows.push([])

  if (data.specifications) {
    rows.push(['【仕様】'])
    rows.push([data.specifications])
    rows.push([])
  }

  if (data.notes) {
    rows.push(['【備考】'])
    rows.push([data.notes])
    rows.push([])
  }

  rows.push(['【担当者】'])
  rows.push(['営業担当', data.salesRep])
  rows.push(['責任者', data.managerName])

  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [
    { wch: 25 },
    { wch: 40 }
  ]

  return ws
}

/**
 * 支払条件シート作成
 */
function createContractPaymentSheet(data: ContractData): XLSX.WorkSheet {
  const rows: (string | number | null)[][] = []

  rows.push(['支払条件'])
  rows.push([])
  rows.push(['時期', '金額', '支払期日'])

  const terms = data.paymentTerms
  rows.push(['契約時', formatCurrency(terms.atContract.amount), formatDate(terms.atContract.date)])
  rows.push(['着工時', formatCurrency(terms.atStart.amount), formatDate(terms.atStart.date)])
  rows.push(['上棟時', formatCurrency(terms.atFraming.amount), formatDate(terms.atFraming.date)])
  rows.push(['竣工時', formatCurrency(terms.atCompletion.amount), formatDate(terms.atCompletion.date)])
  rows.push([])

  const total = terms.atContract.amount + terms.atStart.amount +
    terms.atFraming.amount + terms.atCompletion.amount
  rows.push(['合計', formatCurrency(total), ''])

  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [
    { wch: 15 },
    { wch: 20 },
    { wch: 15 }
  ]

  return ws
}
