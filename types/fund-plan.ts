// 資金計画書の型定義

// 商品タイプ
export type ProductType =
  | 'LIFE'
  | 'LIFE +'
  | 'HOURS'
  | 'LACIE'
  | 'LIFE choose'
  | 'LIFE X(28～30坪)'
  | 'LIFE X(30～33坪)'
  | 'LIFE X(33～35坪)'
  | 'LIFE X(35～38坪)'
  | 'LIFE Limited'
  | 'LIFE+ Limited'
  | 'G-SMART平屋'
  | 'G-SMART平屋 Limited'
  | 'G-SMART平屋+'
  | 'G-SMART平屋+ Limited'

// 防火区分
export type FireProtectionZone = '防火地域' | '準防火地域' | '法22条地域'

// 建物構造
export type BuildingStructure = '在来軸組工法 ガルバリウム鋼板葺' | 'テクノストラクチャー工法'

// 階数
export type FloorCount = 1 | 2 | 3

// 資金計画書メインデータ
export interface FundPlanData {
  // 基本情報
  customerName: string // 顧客名
  teiName: string // ○○様邸
  constructionAddress: string // 建築場所
  fireProtectionZone: FireProtectionZone // 防火区分
  buildingStructure: BuildingStructure // 建物構造
  floorCount: FloorCount // 階数
  estimateValidDate: string // 見積有効期限

  // 商品・仕様
  productType: ProductType // 商品タイプ
  constructionArea: number // 施工面積（坪）
  pricePerTsubo: number // 坪単価

  // ➊建物本体工事
  buildingMainCost: number // 計算値: 施工面積 × 坪単価

  // ➋付帯工事費用A（建物本体工事以外にかかる費用）
  incidentalCostA: {
    confirmationApplicationFee: number // 確認申請費用
    structuralCalculation: number // 構造計算
    structuralDrawingFee: number // 構造図作成費用
    belsApplicationFee: number // BELS評価書申請費用
    longTermHousingApplicationFee: number // 長期優良住宅申請費用
    outdoorElectricWaterDrainageFee: number // 屋外電気・給水・排水・雨水工事
    defectInsuranceGroundTermiteWarranty: number // 瑕疵保険・地盤保証・シロアリ保証
    designSupervisionFee: number // 設計・工事監理費用
    safetyMeasuresFee: number // 安全対策費用
    temporaryConstructionFee: number // 仮設工事費用
  }

  // ➌付帯工事費用B（間取・オプションによって変わる費用）
  incidentalCostB: {
    solarPanelCount: number // 太陽光パネル枚数
    solarPanelKw: number // 太陽光 kW
    solarPanelCost: number // 太陽光発電システム費用
    storageBatteryCost: number // 蓄電池費用
    eaveOverhangArea: number // 軒出・オーバーハング面積
    eaveOverhangCost: number // 軒出・オーバーハング費用
    threeStoryDifference: number // 3階建て差額
    roofLengthExtra: number // 屋根長さ割増
    narrowRoadExtra: number // 前面道路4m未満
    areaSizeExtra: number // 30坪未満/以上割増
  }

  // ➍付帯工事費用C（土地条件によって変わる費用）
  incidentalCostC: {
    landSurveyFee: number // 土地測量費用
    groundImprovementFee: number // 地盤改良費用
    demolitionFee: number // 解体工事費用
    retainingWallFee: number // 擁壁工事費用
    exteriorFee: number // 外構工事費用
    otherFee: number // その他費用
  }

  // ➎諸費用
  miscellaneousCosts: {
    registrationFee: number // 登記費用
    stampDuty: number // 印紙代
    loanFee: number // ローン手数料
    fireInsurance: number // 火災保険
    bridgeLoanInterest: number // つなぎ融資利息
    otherFee: number // その他
  }

  // ➏土地費用
  landCosts: {
    landPrice: number // 土地価格
    brokerageFee: number // 仲介手数料
    propertyTaxSettlement: number // 固定資産税精算金
    landRegistrationFee: number // 土地登記費用
  }

  // 支払計画
  paymentPlan: {
    applicationFee: { date: string; amount: number } // 建築申込金
    contractFee: { date: string; amount: number } // 契約金
    interimPayment1: { date: string; amount: number } // 中間時金(1)
    interimPayment2: { date: string; amount: number } // 中間時金(2)
    finalPayment: { date: string; amount: number } // 最終金
  }

  // 借入計画
  loanPlan: {
    bankA: {
      bankName: string
      amount: number
      interestRate: number
      fixedOrVariable: '固定' | '変動'
      loanYears: number
    }
    bankB: {
      bankName: string
      amount: number
      interestRate: number
      fixedOrVariable: '固定' | '変動'
      loanYears: number
    }
    bankC: {
      bankName: string
      amount: number
      interestRate: number
      fixedOrVariable: '固定' | '変動'
      loanYears: number
    }
  }

  // つなぎ融資
  bridgeLoan: {
    landBridge: {
      amount: number
      interestRate: number
      months: number
    }
    constructionBridge: {
      amount: number
      interestRate: number
      months: number
    }
  }
}

// 計算結果
export interface FundPlanCalculation {
  // 小計
  subtotalBuildingMain: number // ➊建物本体工事 小計
  subtotalIncidentalA: number // ➋付帯工事A 小計
  subtotalIncidentalB: number // ➌付帯工事B 小計
  subtotalIncidentalC: number // ➍付帯工事C 小計
  subtotalMiscellaneous: number // ➎諸費用 小計
  subtotalLand: number // ➏土地費用 小計

  // 合計
  totalConstruction: number // 工事請負金額合計（税抜）
  totalConstructionWithTax: number // 工事請負金額合計（税込）
  totalLandAndBuilding: number // 土地建物総額
  grandTotal: number // 総合計

  // 月々返済額
  monthlyPaymentA: number
  monthlyPaymentB: number
  monthlyPaymentC: number
  totalMonthlyPayment: number

  // つなぎ利息
  bridgeLoanInterestTotal: number
}

// マスタデータ
export interface ProductMaster {
  name: ProductType
  pricePerTsubo: number
}

export interface SalesRepMaster {
  name: string
  phone: string
}
