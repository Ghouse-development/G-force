// 請負契約書の型定義（Excelテンプレート完全準拠）

import type { ProductType, FloorCount, BuildingStructure } from './fund-plan'

// 建築士の種類
export type ArchitectType = '一級' | '二級'

// 建築士登録区分
export type ArchitectRegistration = '大臣' | '都道府県知事'

// 単独/共有
export type OwnershipType = '単独' | '共有'

// 重要事項説明者情報
export interface ImportantMatterExplainer {
  name: string // 説明者氏名
  architectType: ArchitectType // 建築士の種類
  registrationNumber: string // 登録番号
  registrationAuthority: ArchitectRegistration // 登録区分（大臣/都道府県知事）
}

// 支払計画項目
export interface ContractPaymentItem {
  amount: number // 金額
  paymentDate: string // 支払予定日（ISO形式）
}

// 太陽光契約情報
export interface SolarContractInfo {
  contractYear: number // 契約年
  contractMonth: number // 契約月
  contractDay: number // 契約日
  payment1: number // 1回金　請負時
  payment1Date: string // 支払予定日
  payment2: number // 2回金　引渡時
  payment2Date: string // 支払予定日
}

// 変更契約日付情報
export interface ChangeContractDate {
  changeContractYear: number
  changeContractMonth: number
  changeContractDay: number
}

// 変更契約情報
export interface ChangeContractInfo {
  changeContractYear: number // 変更契約年
  changeContractMonth: number // 変更契約月
  changeContractDay: number // 変更契約日
  floorCount: FloorCount // 変更後の階数
  buildingCount: number // 変更後の棟数
  floor1Area: number // 変更後の1階床面積
  floor1Included: boolean // 対象
  floor2Area: number // 変更後の2階床面積
  floor2Included: boolean // 対象
  floor3Area: number // 変更後の3階床面積
  floor3Included: boolean // 対象
  constructionArea: number // 変更後の施工面積
  constructionAreaIncluded: boolean // 対象
  startDate: string // 変更後の着手期日
  completionDate: string // 変更後の完成期日
  deliveryDate: string // 変更後の引渡期日
  contractDate: string // 変更後の契約日
  constructionPrice: number // 変更後の工事価格（税抜き）
  payment1: number // 変更後の1回金
  payment1Date: string
  payment2: number // 変更後の2回金
  payment2Date: string
  payment3: number // 変更後の3回金
  payment3Date: string
  payment4: number // 変更後の4回金
  payment4Date: string
}

// 請負契約書メインデータ
export interface ContractData {
  // === 基本情報 ===
  constructionName: string // 工事名称（○○様邸新築工事）
  customerName: string // 客先氏名
  customerAddress: string // 客先住所
  customerName2: string // 客先氏名2（連名の場合）
  customerAddress2: string // 客先住所2

  // === 担当者情報 ===
  importantMatterExplainer: ImportantMatterExplainer // 重要事項説明者
  ownershipType: OwnershipType // 単独/共有
  salesRep: string // 営業担当

  // === 契約日 ===
  contractYear: number // 請負契約年
  contractMonth: number // 請負契約月
  contractDay: number // 請負契約日

  // === 建物情報 ===
  constructionSite: string // 工事場所
  structure: BuildingStructure | string // 構造
  floorCount: FloorCount // 建物階数
  buildingCount: number // 棟数
  floor1Area: number // 1階床面積（㎡）
  floor1Included: boolean // 対象の場合〇
  floor2Area: number // 2階床面積（㎡）
  floor2Included: boolean // 対象の場合〇
  floor3Area: number // 3階床面積（㎡）
  floor3Included: boolean // 対象の場合〇
  constructionArea: number // 施工面積（坪）
  constructionAreaIncluded: boolean // 対象の場合〇

  // === 工期 ===
  startDate: string // 着手期日（ISO形式）
  completionDate: string // 完成期日（ISO形式）
  deliveryDate: string // 引渡期日（ISO形式）
  contractDate: string // 契約日（ISO形式）

  // === 金額 ===
  constructionPrice: number // 工事価格（税抜き）
  // 消費税、合計額は数式で計算

  // === 支払計画 ===
  payment1Amount: number // 1回金　建築申込時
  payment1Date: string // 支払予定日
  payment2Amount: number // 2回金　請負契約時
  payment2Date: string // 支払予定日
  payment3Amount: number // 3回金　着工時
  payment3Date: string // 支払予定日
  payment4Amount: number // 4回金　上棟時
  payment4Date: string // 支払予定日
  // 5回金（引渡時）と支払予定日は数式で計算

  // === その他 ===
  contractNumber: string // 契約番号
  noWorkDays: string // 工事をしない日
  noWorkHours: string // 工事しない時間帯
  defectInsuranceCompany: string // 瑕疵保険会社

  // === 太陽光契約 ===
  solarContract: SolarContractInfo

  // === 変更契約 ===
  changeContract: ChangeContractInfo

  // === 商品タイプ（制約事項シート用） ===
  productType: ProductType
}

// デフォルト値生成
export const createDefaultContractData = (): ContractData => {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth() + 1
  const day = today.getDate()

  return {
    // 基本情報
    constructionName: '',
    customerName: '',
    customerAddress: '',
    customerName2: '',
    customerAddress2: '',

    // 担当者情報
    importantMatterExplainer: {
      name: '',
      architectType: '一級',
      registrationNumber: '',
      registrationAuthority: '大臣',
    },
    ownershipType: '単独',
    salesRep: '',

    // 契約日
    contractYear: year,
    contractMonth: month,
    contractDay: day,

    // 建物情報
    constructionSite: '',
    structure: '木造軸組工法',
    floorCount: 2,
    buildingCount: 1,
    floor1Area: 0,
    floor1Included: true,
    floor2Area: 0,
    floor2Included: true,
    floor3Area: 0,
    floor3Included: false,
    constructionArea: 30,
    constructionAreaIncluded: true,

    // 工期
    startDate: '',
    completionDate: '',
    deliveryDate: '',
    contractDate: today.toISOString().split('T')[0],

    // 金額
    constructionPrice: 0,

    // 支払計画
    payment1Amount: 100000, // 建築申込金
    payment1Date: '',
    payment2Amount: 1000000, // 契約金
    payment2Date: '',
    payment3Amount: 0, // 着工金
    payment3Date: '',
    payment4Amount: 0, // 上棟金
    payment4Date: '',

    // その他
    contractNumber: '',
    noWorkDays: '',
    noWorkHours: '',
    defectInsuranceCompany: '株式会社　日本住宅保証検査機構',

    // 太陽光契約
    solarContract: {
      contractYear: 0,
      contractMonth: 0,
      contractDay: 0,
      payment1: 0,
      payment1Date: '',
      payment2: 0,
      payment2Date: '',
    },

    // 変更契約
    changeContract: {
      changeContractYear: 0,
      changeContractMonth: 0,
      changeContractDay: 0,
      floorCount: 2,
      buildingCount: 1,
      floor1Area: 0,
      floor1Included: true,
      floor2Area: 0,
      floor2Included: true,
      floor3Area: 0,
      floor3Included: false,
      constructionArea: 0,
      constructionAreaIncluded: true,
      startDate: '',
      completionDate: '',
      deliveryDate: '',
      contractDate: '',
      constructionPrice: 0,
      payment1: 0,
      payment1Date: '',
      payment2: 0,
      payment2Date: '',
      payment3: 0,
      payment3Date: '',
      payment4: 0,
      payment4Date: '',
    },

    // 商品タイプ
    productType: 'LIFE',
  }
}

// 資金計画書データから請負契約書データを生成
export const createContractDataFromFundPlan = (
  fundPlan: {
    customerName: string
    teiName: string
    constructionAddress: string
    buildingStructure: string
    floorCount: number
    constructionArea: number
    fireProtectionZone: string
    productType: string
    salesRep: string
    schedule: {
      buildingContract: string
      constructionStart: string
      completion: string
    }
    paymentPlanConstruction: {
      applicationFee: { customerAmount: number; paymentDate: string }
      contractFee: { customerAmount: number; paymentDate: string }
      interimPayment1: { customerAmount: number; paymentDate: string }
      interimPayment2: { customerAmount: number; paymentDate: string }
    }
  }
): Partial<ContractData> => {
  // 建物契約日から年月日を抽出
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
    constructionName: `${fundPlan.teiName}新築工事`,
    customerName: fundPlan.customerName,
    constructionSite: fundPlan.constructionAddress,
    structure: fundPlan.buildingStructure,
    floorCount: fundPlan.floorCount as FloorCount,
    constructionArea: fundPlan.constructionArea,
    salesRep: fundPlan.salesRep,
    productType: fundPlan.productType as ProductType,

    contractYear,
    contractMonth,
    contractDay,
    contractDate: fundPlan.schedule.buildingContract,

    startDate: fundPlan.schedule.constructionStart,
    completionDate: fundPlan.schedule.completion,

    payment1Amount: fundPlan.paymentPlanConstruction.applicationFee.customerAmount,
    payment1Date: fundPlan.paymentPlanConstruction.applicationFee.paymentDate,
    payment2Amount: fundPlan.paymentPlanConstruction.contractFee.customerAmount,
    payment2Date: fundPlan.paymentPlanConstruction.contractFee.paymentDate,
    payment3Amount: fundPlan.paymentPlanConstruction.interimPayment1.customerAmount,
    payment3Date: fundPlan.paymentPlanConstruction.interimPayment1.paymentDate,
    payment4Amount: fundPlan.paymentPlanConstruction.interimPayment2.customerAmount,
    payment4Date: fundPlan.paymentPlanConstruction.interimPayment2.paymentDate,
  }
}
