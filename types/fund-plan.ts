// 資金計画書の型定義（Excelテンプレート完全準拠）

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
export type FireProtectionZone = '防火地域' | '準防火地域' | '法22条地域' | 'なし'

// 建物構造
export type BuildingStructure = '木造軸組工法 ガルバリウム鋼板葺' | 'テクノストラクチャー工法'

// 階数
export type FloorCount = 1 | 2 | 3

// 蓄電池タイプ
export type StorageBatteryType = 'なし' | '蓄電池' | 'V2H/V2X'

// 金利タイプ
export type InterestRateType = '固定' | '変動'

// 支払計画の1項目
export interface PaymentPlanItem {
  standardRate: number // 基準（割合: 0.1 = 10%など、または「3万円」などの固定額の場合は金額）
  customerAmount: number // お客様金額
  paymentDate: string // 支払予定日（ISO形式）
  totalAmount: number // 支払金額（A+B）
  selfFunding: number // 自己資金（A）
  bankLoan: number // 銀行融資（B）
}

// 工程スケジュールの1項目
export interface ScheduleItem {
  name: string // 工程名
  plannedDate: string // 予定日（ISO形式）
}

// 借入計画の1銀行分
export interface BankLoanPlan {
  bankName: string // 銀行名
  amount: number // 借入額
  interestRate: number // 金利（年利: 0.0082 = 0.82%など）
  rateType: InterestRateType // 固定/変動
  loanYears: number // 借入年数
  principalMonthly: number // 返済元金（毎月分）
  principalBonus: number // 返済元金（ボーナス時分）
  paymentMonthly: number // 返済額（毎月）
  paymentBonus: number // 返済額（ボーナス時）
}

// つなぎ融資の1項目
export interface BridgeLoanItem {
  name: string // 名称（土地つなぎ、建物着工つなぎ等）
  amount: number // 借入額
  interestRate: number // 金利
  months: number // つなぎ予定期間（月）
  monthlyInterest: number // 毎月の金利息
  totalInterest: number // 期間合計の金利息
}

// 現在の住居費
export interface CurrentHousingCost {
  rent: number // 家賃
  electricity: number // 電気代
  gasOil: number // ガス・灯油代
  parking: number // 駐車場・その他
}

// 太陽光発電経済効果計算
export interface SolarEconomyCalculation {
  panelCapacityKw: number // 太陽光パネル容量（kW）
  annualProductionPerKw: number // 1kWあたりの年間予測発電量
  annualProduction: number // 年間予測発電量（kWh）
  dailyProduction: number // 1日の予測発電量（kWh）
  dailyConsumption: number // 日中の消費電力（kWh）
  batteryCharge: number // 蓄電池への充電（kWh）
  dailySale: number // 1日の売電量（kWh）
  monthlySale: number // 1ヶ月の売電量（kWh）
  salePrice: number // 売電単価（円/kWh）
  monthlySaleIncome: number // 1ヶ月の売電収入
  monthlyTotalEffect: number // トータル経済効果（月額）
  tenYearTotalEffect: number // 10年間のトータル経済効果
  returnRate: number // 利回り
}

// 資金計画書メインデータ
export interface FundPlanData {
  // === 基本情報 ===
  customerName: string // 顧客名
  teiName: string // ○○様邸
  constructionName: string // 工事名称（○○様邸　新築工事）
  constructionAddress: string // 建築場所
  fireProtectionZone: FireProtectionZone // 防火区分
  buildingStructure: BuildingStructure // 建物構造
  constructionArea: number // 施工面積（坪）
  floorCount: FloorCount // 階数
  estimateDate: string // 見積作成日
  estimateValidDate: string // 見積有効期限
  salesRep: string // 営業担当者名
  salesRepPhone: string // 営業担当者連絡先
  managerName: string // 所属長名

  // === 商品・仕様 ===
  productType: ProductType // 商品タイプ
  pricePerTsubo: number // 坪単価

  // === ➊建物本体工事 ===
  // 計算値: 施工面積 × 坪単価

  // === ➋付帯工事費用A（建物本体工事以外にかかる費用） ===
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
    temporaryConstructionFee: number // 仮設工事費用（仮設電気、仮設水道含む）
  }

  // === ➌付帯工事費用B（間取・オプションによって変わる費用） ===
  incidentalCostB: {
    // 太陽光発電システム
    solarPanelCount: number // 太陽光パネル枚数
    solarPanelKw: number // 太陽光 kW
    solarPanelCost: number // 太陽光発電システム費用

    // 蓄電池
    storageBatteryType: StorageBatteryType // 蓄電池タイプ
    storageBatteryCost: number // 蓄電池費用

    // 軒出工事・オーバーハング工事
    eaveOverhangArea: number // 面積（㎡）
    eaveOverhangCost: number // 費用（42,000円/㎡）

    // 下屋工事
    lowerRoofArea: number // 面積（㎡）
    lowerRoofCost: number // 費用（30,000円/㎡）

    // バルコニー工事・吹抜工事
    balconyVoidArea: number // 面積（㎡）
    balconyVoidCost: number // 費用（66,000円/㎡）

    // 3階建て差額
    threeStoryTsubo: number // 坪数
    threeStoryDifference: number // 差額（+40,000円/坪）

    // 屋根長さ割増
    roofLengthExtra: number // 屋根長さ割増費用
    roofLengthNote: string // 備考

    // 前面道路4m未満
    narrowRoadExtra: number // 費用
    narrowRoadNote: string // 備考（要相談など）

    // 30坪未満割増/30坪以上割増
    areaSizeTsubo: number // 坪数
    areaSizeExtra: number // 割増費用

    // 照明器具費用
    lightingCost: number // 照明器具費用

    // オプション工事
    optionCost: number // オプション工事費用
  }

  // === ➍付帯工事費用C（土地によってかかる費用） ===
  incidentalCostC: {
    // 防火地域関連
    fireProtectionCost: number // 防火地域/準防火地域追加費用

    // 解体工事
    demolitionCost: number // 解体工事費用

    // 各種申請管理費用
    applicationManagementFee: number // 各種申請管理費用

    // 給排水引き込み工事
    waterDrainageFee: number // 給排水引き込み工事費用

    // 地盤改良工事
    groundImprovementFee: number // 地盤改良工事費用

    // 残土処理工事
    soilDisposalFee: number // 残土処理工事費用

    // 電線防護管
    electricProtectionPipe: number // 電線防護管費用
    electricProtectionPipeExists: boolean // 有無

    // 狭小道路割増+㎥車指定
    narrowRoadCubicExists: boolean // 有無
    narrowRoadCubicExtra: number // 費用

    // 深基礎割増
    deepFoundationLength: number // 深基礎長さ（m）
    deepFoundationExtraHeight: number // 追加深基礎高さ（m）
    deepFoundationExtra: number // 費用

    // 高台割増（高低差1000mm以上）
    elevationExists: boolean // 有無
    elevationExtra: number // 費用

    // 旗竿地（道路幅4m以上）
    flagLotExists: boolean // 有無
    flagLotExtra: number // 費用

    // 天空率
    skyFactorSides: number // 面数（1面、2面など）
    skyFactorExtra: number // 費用

    // 準耐火建築物
    quasiFireproofExists: boolean // 有無
    quasiFireproofExtra: number // 費用

    // 道路通行時間制限区域
    roadTimeRestrictionExists: boolean // 有無
    roadTimeRestrictionExtra: number // 費用
  }

  // === ➎諸費用 ===
  miscellaneousCosts: {
    buildingRegistrationFee: number // 建物登記費用
    housingLoanFee: number // 住宅ローン諸費用（保証料、手数料等）
    bridgeLoanFee: number // つなぎローン諸費用（金利、手数料等）
    loanContractStampDuty: number // 金銭消費貸借契約 印紙代
    constructionContractStampDuty: number // 建物請負工事契約 印紙代（電子契約の場合0）
    fireInsurance: number // 火災保険料
    advanceConstruction: number // 先行工事（税込）
    exteriorConstruction: number // 外構工事（税込）
    customConstruction: number // 造作工事（税込）
  }

  // === ➏土地費用 ===
  landCosts: {
    landPrice: number // 土地売買代金
    propertyTaxSettlement: number // 固定資産税清算金
    landContractStampDuty: number // 土地売買契約 印紙代
    brokerageFee: number // 土地仲介手数料
    landRegistrationFee: number // 土地登記費用
    extinctionRegistrationFee: number // 滅失登記費用
  }

  // === 支払計画（工事請負金額以外） ===
  paymentPlanOutside: {
    landPurchase: PaymentPlanItem // 土地購入費用
    miscellaneous: PaymentPlanItem // 諸費用
  }

  // === 支払計画（工事請負金額） ===
  paymentPlanConstruction: {
    applicationFee: PaymentPlanItem // 建築申込金（3万円固定）
    contractFee: PaymentPlanItem // 契約金（10%）
    interimPayment1: PaymentPlanItem // 中間時金(1)（30%）
    interimPayment2: PaymentPlanItem // 中間時金(2)（30%）
    finalPayment: PaymentPlanItem // 最終金（残代金）
  }

  // === 工程スケジュール ===
  schedule: {
    landContract: string // 土地契約
    buildingContract: string // 建物契約
    initialPlanHearing: string // 初回間取ヒアリング
    landSettlement: string // 土地決済
    planFinalized: string // 間取確定
    finalSpecMeeting: string // 仕様最終打合せ
    changeContract: string // 変更契約
    constructionStart: string // 着工
    roofRaising: string // 上棟
    completion: string // 竣工（完了検査）
    finalPaymentDate: string // 最終金お支払い
  }

  // === 借入計画 ===
  loanPlan: {
    bankA: BankLoanPlan
    bankB: BankLoanPlan
    bankC: BankLoanPlan
  }

  // === つなぎ融資 ===
  bridgeLoan: {
    landBridge: BridgeLoanItem // 土地つなぎ
    constructionStartBridge: BridgeLoanItem // 建物着工つなぎ
    constructionInterimBridge: BridgeLoanItem // 建物中間つなぎ
  }

  // === 現在の住居費 ===
  currentHousingCost: CurrentHousingCost

  // === 太陽光発電経済効果（太陽光パネルのみ） ===
  solarOnlyEffect: SolarEconomyCalculation

  // === 太陽光発電経済効果（太陽光+蓄電池） ===
  solarBatteryEffect: SolarEconomyCalculation

  // === 備考 ===
  remarks: string

  // === 請負契約時情報 ===
  contractTotalAtSigning: number // 請負契約時の総額
}

// 計算結果
export interface FundPlanCalculation {
  // 小計
  subtotalBuildingMain: number // ➊建物本体工事 小計（税抜）
  subtotalIncidentalA: number // ➋付帯工事A 小計（税抜）
  subtotalIncidentalB: number // ➌付帯工事B 小計（税抜）
  subtotalIncidentalC: number // ➍付帯工事C 小計（税抜）
  subtotalMiscellaneous: number // ➎諸費用 小計
  subtotalLand: number // ➏土地費用 小計

  // 最終建物工事費用
  totalBuildingConstruction: number // ❶+❷+❸+❹（税抜）
  consumptionTax: number // 消費税
  totalBuildingConstructionWithTax: number // ❶+❷+❸+❹（税込）

  // 工事請負金額以外
  totalOutsideConstruction: number // 土地購入費用 + 諸費用

  // 支払合計
  paymentTotal: number // 支払合計
  selfFundingTotal: number // 自己資金合計
  bankLoanTotal: number // 銀行融資合計

  // 最終合計
  grandTotal: number // 最終建物工事費用+諸費用+土地費用 合計（税込）

  // 請負契約時からの差額
  differenceFromContract: number // 請負契約時からの差額

  // 月々返済額
  monthlyPaymentA: number
  monthlyPaymentB: number
  monthlyPaymentC: number
  totalMonthlyPayment: number

  // ボーナス時返済額
  bonusPaymentA: number
  bonusPaymentB: number
  bonusPaymentC: number
  totalBonusPayment: number

  // つなぎ利息
  bridgeLoanInterestTotal: number

  // 新居の住居費
  newMonthlyPayment: number // 月々の返済額
  effectiveUtilityCost: number // 実質支払い光熱費
  totalNewMonthlyCost: number // 毎月のお支払い
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

// デフォルト値生成用
export const createDefaultFundPlanData = (): FundPlanData => ({
  // 基本情報
  customerName: '',
  teiName: '',
  constructionName: '',
  constructionAddress: '',
  fireProtectionZone: '準防火地域',
  buildingStructure: '木造軸組工法 ガルバリウム鋼板葺',
  constructionArea: 30,
  floorCount: 2,
  estimateDate: new Date().toISOString().split('T')[0],
  estimateValidDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  salesRep: '',
  salesRepPhone: '',
  managerName: '',

  // 商品・仕様
  productType: 'LIFE',
  pricePerTsubo: 550000,

  // 付帯工事費用A
  incidentalCostA: {
    confirmationApplicationFee: 400000,
    structuralCalculation: 200000,
    structuralDrawingFee: 300000,
    belsApplicationFee: 200000,
    longTermHousingApplicationFee: 400000,
    outdoorElectricWaterDrainageFee: 900000,
    defectInsuranceGroundTermiteWarranty: 300000,
    designSupervisionFee: 950000,
    safetyMeasuresFee: 250000,
    temporaryConstructionFee: 300000,
  },

  // 付帯工事費用B
  incidentalCostB: {
    solarPanelCount: 18,
    solarPanelKw: 8.37,
    solarPanelCost: 1753300,
    storageBatteryType: 'なし',
    storageBatteryCost: 0,
    eaveOverhangArea: 0,
    eaveOverhangCost: 0,
    lowerRoofArea: 0,
    lowerRoofCost: 0,
    balconyVoidArea: 0,
    balconyVoidCost: 0,
    threeStoryTsubo: 0,
    threeStoryDifference: 0,
    roofLengthExtra: 0,
    roofLengthNote: '',
    narrowRoadExtra: 0,
    narrowRoadNote: '',
    areaSizeTsubo: 0,
    areaSizeExtra: 0,
    lightingCost: 300000,
    optionCost: 2500000,
  },

  // 付帯工事費用C
  incidentalCostC: {
    fireProtectionCost: 900000,
    demolitionCost: 0,
    applicationManagementFee: 0,
    waterDrainageFee: 600000,
    groundImprovementFee: 600000,
    soilDisposalFee: 0,
    electricProtectionPipe: 0,
    electricProtectionPipeExists: false,
    narrowRoadCubicExists: false,
    narrowRoadCubicExtra: 0,
    deepFoundationLength: 0,
    deepFoundationExtraHeight: 0,
    deepFoundationExtra: 0,
    elevationExists: false,
    elevationExtra: 0,
    flagLotExists: false,
    flagLotExtra: 0,
    skyFactorSides: 1,
    skyFactorExtra: 50000,
    quasiFireproofExists: false,
    quasiFireproofExtra: 0,
    roadTimeRestrictionExists: false,
    roadTimeRestrictionExtra: 0,
  },

  // 諸費用
  miscellaneousCosts: {
    buildingRegistrationFee: 300000,
    housingLoanFee: 1210000,
    bridgeLoanFee: 200000,
    loanContractStampDuty: 40000,
    constructionContractStampDuty: 0,
    fireInsurance: 200000,
    advanceConstruction: 0,
    exteriorConstruction: 2000000,
    customConstruction: 0,
  },

  // 土地費用
  landCosts: {
    landPrice: 30000000,
    propertyTaxSettlement: 100000,
    landContractStampDuty: 10000,
    brokerageFee: 1056000,
    landRegistrationFee: 400000,
    extinctionRegistrationFee: 0,
  },

  // 支払計画（工事請負金額以外）
  paymentPlanOutside: {
    landPurchase: {
      standardRate: 0,
      customerAmount: 30000000,
      paymentDate: '',
      totalAmount: 30000000,
      selfFunding: 0,
      bankLoan: 30000000,
    },
    miscellaneous: {
      standardRate: 0,
      customerAmount: 5516000,
      paymentDate: '',
      totalAmount: 5516000,
      selfFunding: 0,
      bankLoan: 5516000,
    },
  },

  // 支払計画（工事請負金額）
  paymentPlanConstruction: {
    applicationFee: {
      standardRate: 30000,
      customerAmount: 30000,
      paymentDate: '',
      totalAmount: 30000,
      selfFunding: 30000,
      bankLoan: 0,
    },
    contractFee: {
      standardRate: 0.1,
      customerAmount: 3000000,
      paymentDate: '',
      totalAmount: 3000000,
      selfFunding: 3000000,
      bankLoan: 0,
    },
    interimPayment1: {
      standardRate: 0.3,
      customerAmount: 9000000,
      paymentDate: '',
      totalAmount: 9000000,
      selfFunding: 0,
      bankLoan: 9000000,
    },
    interimPayment2: {
      standardRate: 0.3,
      customerAmount: 9000000,
      paymentDate: '',
      totalAmount: 9000000,
      selfFunding: 0,
      bankLoan: 9000000,
    },
    finalPayment: {
      standardRate: 0,
      customerAmount: 0,
      paymentDate: '',
      totalAmount: 0,
      selfFunding: 0,
      bankLoan: 0,
    },
  },

  // 工程スケジュール
  schedule: {
    landContract: '',
    buildingContract: '',
    initialPlanHearing: '',
    landSettlement: '',
    planFinalized: '',
    finalSpecMeeting: '',
    changeContract: '',
    constructionStart: '',
    roofRaising: '',
    completion: '',
    finalPaymentDate: '',
  },

  // 借入計画
  loanPlan: {
    bankA: {
      bankName: 'A銀行',
      amount: 55000000,
      interestRate: 0.0082,
      rateType: '変動',
      loanYears: 35,
      principalMonthly: 55000000,
      principalBonus: 0,
      paymentMonthly: 0,
      paymentBonus: 0,
    },
    bankB: {
      bankName: 'B銀行',
      amount: 0,
      interestRate: 0.0082,
      rateType: '変動',
      loanYears: 40,
      principalMonthly: 0,
      principalBonus: 0,
      paymentMonthly: 0,
      paymentBonus: 0,
    },
    bankC: {
      bankName: 'C銀行',
      amount: 0,
      interestRate: 0.0082,
      rateType: '変動',
      loanYears: 30,
      principalMonthly: 0,
      principalBonus: 0,
      paymentMonthly: 0,
      paymentBonus: 0,
    },
  },

  // つなぎ融資
  bridgeLoan: {
    landBridge: {
      name: '土地つなぎ',
      amount: 35516000,
      interestRate: 0.02,
      months: 7.37,
      monthlyInterest: 0,
      totalInterest: 0,
    },
    constructionStartBridge: {
      name: '建物着工つなぎ',
      amount: 9000000,
      interestRate: 0.02,
      months: 4.67,
      monthlyInterest: 0,
      totalInterest: 0,
    },
    constructionInterimBridge: {
      name: '建物中間つなぎ',
      amount: 9000000,
      interestRate: 0.02,
      months: 3.33,
      monthlyInterest: 0,
      totalInterest: 0,
    },
  },

  // 現在の住居費
  currentHousingCost: {
    rent: 0,
    electricity: 0,
    gasOil: 0,
    parking: 0,
  },

  // 太陽光発電経済効果（太陽光パネルのみ）
  solarOnlyEffect: {
    panelCapacityKw: 8.37,
    annualProductionPerKw: 1200,
    annualProduction: 10044,
    dailyProduction: 27.51,
    dailyConsumption: 5,
    batteryCharge: 10,
    dailySale: 12.51,
    monthlySale: 380.51,
    salePrice: 24,
    monthlySaleIncome: 9132,
    monthlyTotalEffect: 25665,
    tenYearTotalEffect: 2649705,
    returnRate: 0.0494,
  },

  // 太陽光発電経済効果（太陽光+蓄電池）
  solarBatteryEffect: {
    panelCapacityKw: 8.37,
    annualProductionPerKw: 1200,
    annualProduction: 10044,
    dailyProduction: 27.51,
    dailyConsumption: 5,
    batteryCharge: 0,
    dailySale: 22.51,
    monthlySale: 684.68,
    salePrice: 24,
    monthlySaleIncome: 16432,
    monthlyTotalEffect: 22965,
    tenYearTotalEffect: 1981875,
    returnRate: 0.0801,
  },

  // 備考
  remarks: '',

  // 請負契約時情報
  contractTotalAtSigning: 0,
})
