/**
 * ドキュメントフロー管理
 *
 * 資金計画書 → 請負契約書 → 引継書 のデータ連携を自動化
 *
 * フロー:
 * 1. 顧客情報入力
 * 2. 資金計画書作成
 * 3. プラン依頼（設計事務所へ）
 * 4. 請負契約書作成（資金計画書から自動生成）
 * 5. 引継書作成（契約情報から自動生成）
 */

import type { FundPlanData } from '@/types/fund-plan'
import type { ContractData } from '@/types/contract'
import { createContractDataFromFundPlan, createDefaultContractData } from '@/types/contract'

// ============================================
// 顧客ステータス定義
// ============================================

export type CustomerPipelineStatus =
  | '新規'
  | '資金計画作成中'
  | 'プラン依頼中'
  | '設計中'
  | '契約準備'
  | '内定'
  | '変更契約前'
  | '変更契約後'
  | 'オーナー'

export const CUSTOMER_PIPELINE_FLOW: CustomerPipelineStatus[] = [
  '新規',
  '資金計画作成中',
  'プラン依頼中',
  '設計中',
  '契約準備',
  '内定',
  '変更契約前',
  '変更契約後',
  'オーナー',
]

// ============================================
// 次のアクション自動判定
// ============================================

export interface NextAction {
  type: 'create_fund_plan' | 'create_plan_request' | 'create_contract' | 'create_handover' | 'export_documents' | 'none'
  label: string
  description: string
  enabled: boolean
  path?: string
}

export function getNextActions(
  customerStatus: CustomerPipelineStatus,
  hasFundPlan: boolean,
  hasPlanRequest: boolean,
  hasContract: boolean,
  hasHandover: boolean
): NextAction[] {
  const actions: NextAction[] = []

  // 資金計画書がなければ作成
  if (!hasFundPlan) {
    actions.push({
      type: 'create_fund_plan',
      label: '資金計画書を作成',
      description: '顧客の資金計画を作成します',
      enabled: true,
      path: '/fund-plans/new',
    })
  }

  // 資金計画書があればプラン依頼
  if (hasFundPlan && !hasPlanRequest) {
    actions.push({
      type: 'create_plan_request',
      label: 'プラン依頼を作成',
      description: '設計事務所へプラン依頼を送信します',
      enabled: true,
      path: '/plan-requests/new',
    })
  }

  // 契約準備以降で契約書作成
  const contractReadyStatuses: CustomerPipelineStatus[] = ['契約準備', '内定', '変更契約前', '変更契約後', 'オーナー']
  if (hasFundPlan && contractReadyStatuses.includes(customerStatus) && !hasContract) {
    actions.push({
      type: 'create_contract',
      label: '請負契約書を作成',
      description: '資金計画書から請負契約書を自動生成します',
      enabled: true,
      path: '/contracts/new',
    })
  }

  // 内定以降で引継書作成
  const handoverReadyStatuses: CustomerPipelineStatus[] = ['内定', '変更契約前', '変更契約後', 'オーナー']
  if (hasContract && handoverReadyStatuses.includes(customerStatus) && !hasHandover) {
    actions.push({
      type: 'create_handover',
      label: '引継書を作成',
      description: '工事部門への引継書を作成します',
      enabled: true,
      path: '/handovers/new',
    })
  }

  // ドキュメント出力
  if (hasFundPlan) {
    actions.push({
      type: 'export_documents',
      label: '書類を出力',
      description: 'Excel/PDF形式で書類を出力します',
      enabled: true,
    })
  }

  if (actions.length === 0) {
    actions.push({
      type: 'none',
      label: '次のアクションなし',
      description: '現在必要なアクションはありません',
      enabled: false,
    })
  }

  return actions
}

// ============================================
// 資金計画書 → 請負契約書 変換
// ============================================

/**
 * 資金計画書から請負契約書データを完全生成
 */
export function generateContractFromFundPlan(
  fundPlan: FundPlanData,
  overrides?: Partial<ContractData>
): ContractData {
  const baseContract = createDefaultContractData()
  const autoContract = createContractDataFromFundPlan(fundPlan) as Partial<ContractData>

  // 工事価格を計算（建物本体 + 付帯工事A + 付帯工事B + 付帯工事C）
  const buildingMainCost = fundPlan.constructionArea * fundPlan.pricePerTsubo
  const incidentalA = Object.values(fundPlan.incidentalCostA).reduce(
    (sum, v) => sum + (typeof v === 'number' ? v : 0),
    0
  )
  const incidentalB =
    (fundPlan.incidentalCostB.solarPanelCost || 0) +
    (fundPlan.incidentalCostB.storageBatteryCost || 0) +
    (fundPlan.incidentalCostB.eaveOverhangCost || 0) +
    (fundPlan.incidentalCostB.lowerRoofCost || 0) +
    (fundPlan.incidentalCostB.balconyVoidCost || 0) +
    (fundPlan.incidentalCostB.threeStoryDifference || 0) +
    (fundPlan.incidentalCostB.roofLengthExtra || 0) +
    (fundPlan.incidentalCostB.narrowRoadExtra || 0) +
    (fundPlan.incidentalCostB.areaSizeExtra || 0) +
    (fundPlan.incidentalCostB.lightingCost || 0) +
    (fundPlan.incidentalCostB.optionCost || 0)
  const incidentalC = Object.entries(fundPlan.incidentalCostC).reduce((sum, [key, v]) => {
    if (key.includes('Exists') || key.includes('Note') || key.includes('Length') || key.includes('Height') || key.includes('Sides')) {
      return sum
    }
    return sum + (typeof v === 'number' ? v : 0)
  }, 0)

  const constructionPrice = buildingMainCost + incidentalA + incidentalB + incidentalC

  // 支払計画を計算
  const totalWithTax = Math.floor(constructionPrice * 1.1)
  const applicationFee = fundPlan.paymentPlanConstruction.applicationFee.customerAmount || 30000
  const contractFee = Math.floor(totalWithTax * (fundPlan.paymentPlanConstruction.contractFee.standardRate || 0.1))
  const interimPayment1 = Math.floor(totalWithTax * (fundPlan.paymentPlanConstruction.interimPayment1.standardRate || 0.3))
  const interimPayment2 = Math.floor(totalWithTax * (fundPlan.paymentPlanConstruction.interimPayment2.standardRate || 0.3))

  // 契約日を年月日に分解
  let contractYear = new Date().getFullYear()
  let contractMonth = new Date().getMonth() + 1
  let contractDay = new Date().getDate()

  if (fundPlan.schedule.buildingContract) {
    const date = new Date(fundPlan.schedule.buildingContract)
    contractYear = date.getFullYear()
    contractMonth = date.getMonth() + 1
    contractDay = date.getDate()
  }

  return {
    ...baseContract,
    ...autoContract,
    // 自動計算値
    constructionPrice,
    payment1Amount: applicationFee,
    payment1Date: fundPlan.paymentPlanConstruction.applicationFee.paymentDate,
    payment2Amount: contractFee,
    payment2Date: fundPlan.paymentPlanConstruction.contractFee.paymentDate,
    payment3Amount: interimPayment1,
    payment3Date: fundPlan.paymentPlanConstruction.interimPayment1.paymentDate,
    payment4Amount: interimPayment2,
    payment4Date: fundPlan.paymentPlanConstruction.interimPayment2.paymentDate,
    // 日付分解
    contractYear,
    contractMonth,
    contractDay,
    // オーバーライド
    ...overrides,
  } as ContractData
}

// ============================================
// 請負契約書 → 引継書 変換
// ============================================

export interface HandoverData {
  customerId: string
  customerName: string
  contractId: string
  handoverDate: string
  constructionManager: string
  contractSummary: string
  customerCharacter: string
  specialRequests: string
  siteNotes: string
  checklist: {
    contractConfirmed: boolean
    drawingsReceived: boolean
    specificationsConfirmed: boolean
    scheduleConfirmed: boolean
    startDateConfirmed: boolean
    completionDateConfirmed: boolean
    preferencesNoted: boolean
    specialNotesRecorded: boolean
    neighborInfoCollected: boolean
    accessConfirmed: boolean
  }
}

/**
 * 契約データから引継書の初期データを生成
 */
export function generateHandoverFromContract(
  contract: ContractData,
  customerId: string,
  contractId: string
): Partial<HandoverData> {
  return {
    customerId,
    customerName: contract.customerName,
    contractId,
    contractSummary: `
工事名称: ${contract.constructionName}
工事場所: ${contract.constructionSite}
構造: ${contract.structure}
階数: ${contract.floorCount}階建
施工面積: ${contract.constructionArea}坪
工事価格: ¥${contract.constructionPrice.toLocaleString()}（税抜）
着工予定: ${contract.startDate}
竣工予定: ${contract.completionDate}
引渡予定: ${contract.deliveryDate}
    `.trim(),
    checklist: {
      contractConfirmed: false,
      drawingsReceived: false,
      specificationsConfirmed: false,
      scheduleConfirmed: false,
      startDateConfirmed: false,
      completionDateConfirmed: false,
      preferencesNoted: false,
      specialNotesRecorded: false,
      neighborInfoCollected: false,
      accessConfirmed: false,
    },
  }
}

// ============================================
// ドキュメント完成度チェック
// ============================================

export interface DocumentCompleteness {
  percentage: number
  missingFields: string[]
  warnings: string[]
}

/**
 * 資金計画書の完成度をチェック
 */
export function checkFundPlanCompleteness(data: FundPlanData): DocumentCompleteness {
  const missingFields: string[] = []
  const warnings: string[] = []

  // 必須フィールドチェック
  if (!data.customerName) missingFields.push('顧客名')
  if (!data.teiName) missingFields.push('邸名')
  if (!data.constructionAddress) missingFields.push('建築場所')
  if (!data.constructionArea || data.constructionArea <= 0) missingFields.push('施工面積')
  if (!data.productType) missingFields.push('商品タイプ')

  // 警告チェック
  if (!data.schedule.buildingContract) warnings.push('建物契約日が未設定')
  if (!data.schedule.constructionStart) warnings.push('着工日が未設定')
  if (!data.schedule.completion) warnings.push('竣工日が未設定')
  if (data.loanPlan.bankA.amount <= 0) warnings.push('借入計画が未設定')

  const totalFields = 15
  const filledFields = totalFields - missingFields.length
  const percentage = Math.round((filledFields / totalFields) * 100)

  return { percentage, missingFields, warnings }
}

/**
 * 請負契約書の完成度をチェック
 */
export function checkContractCompleteness(data: ContractData): DocumentCompleteness {
  const missingFields: string[] = []
  const warnings: string[] = []

  // 必須フィールドチェック
  if (!data.constructionName) missingFields.push('工事名称')
  if (!data.customerName) missingFields.push('顧客名')
  if (!data.customerAddress) missingFields.push('顧客住所')
  if (!data.constructionSite) missingFields.push('工事場所')
  if (!data.constructionPrice || data.constructionPrice <= 0) missingFields.push('工事価格')
  if (!data.startDate) missingFields.push('着工日')
  if (!data.completionDate) missingFields.push('竣工日')
  if (!data.salesRep) missingFields.push('営業担当')

  // 警告チェック
  if (!data.importantMatterExplainer.name) warnings.push('重要事項説明者が未設定')
  if (!data.contractNumber) warnings.push('契約番号が未設定')

  const totalFields = 12
  const filledFields = totalFields - missingFields.length
  const percentage = Math.round((filledFields / totalFields) * 100)

  return { percentage, missingFields, warnings }
}

// ============================================
// マスターデータ
// ============================================

// 設計事務所一覧
export const DESIGN_OFFICES = [
  { id: 'larry-k', name: 'ラリーケー' },
  { id: 'life-plus', name: 'ライフプラス' },
  { id: 'n-design', name: 'Nデザイン' },
  { id: 'l-and-a', name: 'L&A' },
  { id: 'jin', name: 'JIN' },
  { id: 'other', name: 'その他' },
] as const

// 重要事項説明者一覧
export const IMPORTANT_MATTER_EXPLAINERS = [
  { name: '田中　聡', architectType: '一級' as const, registrationNumber: '253424', registrationAuthority: '大臣' as const },
  { name: '北村　晃平', architectType: '一級' as const, registrationNumber: '362717', registrationAuthority: '大臣' as const },
  { name: '林　恭生', architectType: '二級' as const, registrationNumber: '6667', registrationAuthority: '和歌山県知事' as const },
  { name: '箕浦　三四郎', architectType: '一級' as const, registrationNumber: '354989', registrationAuthority: '大臣' as const },
  { name: '荘野　善宏', architectType: '二級' as const, registrationNumber: '10409', registrationAuthority: '三重県知事' as const },
  { name: '内藤　智之', architectType: '二級' as const, registrationNumber: '44439', registrationAuthority: '大阪府知事' as const },
  { name: '足立　雅哉', architectType: '一級' as const, registrationNumber: '319770', registrationAuthority: '大臣' as const },
  { name: '若狹 龍成', architectType: '二級' as const, registrationNumber: '9571', registrationAuthority: '愛媛県知事' as const },
  { name: '髙濱 洋文', architectType: '一級' as const, registrationNumber: '305600', registrationAuthority: '大臣' as const },
  { name: '佐古　祐太', architectType: '二級' as const, registrationNumber: '58870', registrationAuthority: '大阪府知事' as const },
  { name: '古久保　知佳子', architectType: '二級' as const, registrationNumber: '56598', registrationAuthority: '大阪府知事' as const },
] as const

// 瑕疵保険会社一覧
export const DEFECT_INSURANCE_COMPANIES = [
  '株式会社　日本住宅保証検査機構',
  '住宅あんしん保証',
  'ハウスジーメン',
] as const

// 営業担当者一覧（サンプル）
export const SALES_REPS = [
  { name: '田畑　美香', phone: '06-1234-5678' },
  { name: '山田　太郎', phone: '06-2345-6789' },
  { name: '鈴木　花子', phone: '06-3456-7890' },
] as const

// 工事担当者一覧（サンプル）
export const CONSTRUCTION_MANAGERS = [
  { name: '佐藤　一郎', phone: '06-4567-8901' },
  { name: '田中　次郎', phone: '06-5678-9012' },
  { name: '高橋　三郎', phone: '06-6789-0123' },
] as const
