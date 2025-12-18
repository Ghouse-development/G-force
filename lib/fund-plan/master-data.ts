import type { ProductType, FireProtectionZone, BuildingStructure, FloorCount, StorageBatteryType } from '@/types/fund-plan'

// 商品マスタ（坪単価）
export const productMaster: Record<ProductType, number> = {
  'LIFE': 550000,
  'LIFE +': 600000,
  'HOURS': 680000,
  'LACIE': 630000,
  'LIFE choose': 580000,
  'LIFE X(28～30坪)': 620000,
  'LIFE X(30～33坪)': 600000,
  'LIFE X(33～35坪)': 580000,
  'LIFE X(35～38坪)': 560000,
  'LIFE Limited': 500000,
  'LIFE+ Limited': 550000,
  'G-SMART平屋': 650000,
  'G-SMART平屋 Limited': 600000,
  'G-SMART平屋+': 700000,
  'G-SMART平屋+ Limited': 650000,
}

// 商品リスト
export const productList: ProductType[] = [
  'LIFE',
  'LIFE +',
  'HOURS',
  'LACIE',
  'LIFE choose',
  'LIFE X(28～30坪)',
  'LIFE X(30～33坪)',
  'LIFE X(33～35坪)',
  'LIFE X(35～38坪)',
  'LIFE Limited',
  'LIFE+ Limited',
  'G-SMART平屋',
  'G-SMART平屋 Limited',
  'G-SMART平屋+',
  'G-SMART平屋+ Limited',
]

// 防火区分マスタ
export const fireProtectionZones: FireProtectionZone[] = [
  'なし',
  '防火地域',
  '準防火地域',
  '法22条地域',
]

// 建物構造マスタ
export const buildingStructures: BuildingStructure[] = [
  '木造軸組工法 ガルバリウム鋼板葺',
  'テクノストラクチャー工法',
]

// 階数マスタ
export const floorCounts: FloorCount[] = [1, 2, 3]

// 営業担当マスタ
export const salesRepMaster = [
  { name: '田畑　美香', phone: '090-2280-4404' },
  { name: '佐古　祐太', phone: '080-6854-8207' },
  { name: '德田　耕明', phone: '090-8327-0698' },
  { name: '西野　秀樹', phone: '070-3788-3295' },
  { name: '吉田　祐', phone: '090-9617-2040' },
  { name: '杉村　悠斗', phone: '090-4203-9124' },
  { name: '西　俊幸', phone: '080-5866-1887' },
  { name: '金村　晃功', phone: '080-6982-1609' },
  { name: '葉山　一輝', phone: '080-5918-0191' },
  { name: '小松　大樹', phone: '090-4219-0079' },
  { name: '稲尾　拓慎', phone: '080-5989-3582' },
  { name: '阿部　澄人', phone: '080-6559-4459' },
  { name: '湯谷　憲一', phone: '080-6559-4468' },
  { name: '舟橋　裕也', phone: '080-6559-4418' },
  { name: '光川　実緒', phone: '080-6563-2497' },
  { name: '西村　貴裕', phone: '080-6644-3586' },
  { name: '髙木　徹', phone: '080-6615-9793' },
]

// 付帯工事費用Aのデフォルト値
export const defaultIncidentalCostA = {
  confirmationApplicationFee: 400000, // 確認申請費用
  structuralCalculation: 200000, // 構造計算
  structuralDrawingFee: 300000, // 構造図作成費用
  belsApplicationFee: 200000, // BELS評価書申請費用
  longTermHousingApplicationFee: 400000, // 長期優良住宅申請費用
  outdoorElectricWaterDrainageFee: 900000, // 屋外電気・給水・排水・雨水工事
  defectInsuranceGroundTermiteWarranty: 300000, // 瑕疵保険・地盤保証・シロアリ保証
  designSupervisionFee: 950000, // 設計・工事監理費用
  safetyMeasuresFee: 250000, // 安全対策費用
  temporaryConstructionFee: 300000, // 仮設工事費用
}

// === 付帯工事費用B 関連 ===

// 太陽光パネル単価（1kWあたり）
export const solarPanelPricePerKw = 209500

// 太陽光パネル1枚あたりのkW
export const solarPanelKwPerUnit = 0.465 // 約465W/枚

// 蓄電池タイプリスト
export const storageBatteryTypes: StorageBatteryType[] = [
  'なし',
  '蓄電池',
  'V2H/V2X',
]

// 蓄電池価格
export const storageBatteryPrices: Record<StorageBatteryType, number> = {
  'なし': 0,
  '蓄電池': 1500000,
  'V2H/V2X': 2000000,
}

// 軒出工事・オーバーハング工事 単価（円/㎡）
export const eaveOverhangPricePerSqm = 42000

// 下屋工事 単価（円/㎡）
export const lowerRoofPricePerSqm = 30000

// バルコニー工事・吹抜工事 単価（円/㎡）
export const balconyVoidPricePerSqm = 66000

// 3階建て差額（1坪あたり）
export const threeStoryExtraPerTsubo = 40000

// === 付帯工事費用C 関連 ===

// 準防火地域追加費用
export const quasiFireProofZoneCost = 900000

// 天空率費用（1面あたり）
export const skyFactorCostPerSide = 50000

// 電線防護管設置費
export const electricProtectionPipeCosts = {
  standard: 250000, // 標準（接道1面）
  corner: 400000, // 角地（接道2面）
}

// 狭小道路割増（レッカー車不可・手揚げ工事）
export const narrowRoadHandLiftCost = 450000

// 時間指定費用（1時間あたり）
export const timeRestrictionCostPerHour = 250000

// === 借入計画 関連 ===

// 金利タイプ
export const interestRateTypes = ['固定', '変動'] as const

// デフォルト金利
export const defaultInterestRate = 0.0082 // 0.82%

// つなぎ融資デフォルト金利
export const defaultBridgeLoanRate = 0.02 // 2%

// === 太陽光経済効果 関連 ===

// 1kWあたりの年間予測発電量（kWh）
export const annualProductionPerKw = 1200

// 売電単価（円/kWh）- 2025年10月以降（10kW未満）
export const feedInTariffPrice = 24

// 夜間電力比率（平均電気代の試算用）
export const nightPowerRatio = 0.624

// 平均電気代（試算用）
export const averageElectricityCost = 16533

// 消費税率
export const taxRate = 0.10

// 粗利益率（概算用）
export const grossProfitRate = 0.30

// 標準仕様（表示用）
export const standardSpecifications = {
  highPerformance: [
    '木造ハイブリッド工法',
    'ベタ基礎',
    '地盤調査',
    '許容応力度構造計算',
    '耐震等級３(最高ランク)※',
    '制振システム evoltz',
    '長期優良認定住宅※',
    '外壁 セルフクリーニング機能付',
  ],
  insulationAirtight: [
    'ZEH仕様(BELS★★★★★)',
    '防湿気密シート施工',
    '高断熱玄関ドア(D2仕様)',
    'オール樹脂ペアガラス アルミスペーサー',
    '床断熱100mm・屋根断熱225mm',
    'Ua値 0.46 W/㎡K※',
    '平均C値0.24 ㎠/㎡※',
  ],
  durability: [
    '二重防水構造',
    '省令準耐火構造',
    '10年建物瑕疵保証',
    '20年地盤保証',
    '60年長期保証',
    '劣化対策等級３相当(最高ランク)',
    '維持管理対策等級３相当(最高ランク)',
  ],
  technology: [
    '熱交換型第一種換気システム',
    'ホームIoT標準',
    '太陽光発電システム 推奨',
    '蓄電システム or V2H 推奨',
  ],
}

// 標準仕様の注釈
export const specificationNotes = [
  '※平均C値は2024年8月～2025年7月時点完工実績。建物形状や窓位置により変動',
  '※３階建てや建物形状・窓位置によっては耐震等級3・長期優良認定を取得できない場合があります',
]

// 工程スケジュールの項目名
export const scheduleItems = [
  { key: 'landContract', label: '土地契約' },
  { key: 'buildingContract', label: '建物契約' },
  { key: 'initialPlanHearing', label: '初回間取ヒアリング' },
  { key: 'landSettlement', label: '土地決済' },
  { key: 'planFinalized', label: '間取確定' },
  { key: 'finalSpecMeeting', label: '仕様最終打合せ' },
  { key: 'changeContract', label: '変更契約' },
  { key: 'constructionStart', label: '着工' },
  { key: 'roofRaising', label: '上棟' },
  { key: 'completion', label: '竣工（完了検査）' },
  { key: 'finalPaymentDate', label: '最終金お支払い' },
] as const

// 支払計画（工事請負金額）の項目
export const paymentPlanConstructionItems = [
  { key: 'applicationFee', label: '建築申込金', standardLabel: '3万円', standardValue: 30000 },
  { key: 'contractFee', label: '契約金', standardLabel: '10%', standardRate: 0.1 },
  { key: 'interimPayment1', label: '中間時金(1)', standardLabel: '30%', standardRate: 0.3 },
  { key: 'interimPayment2', label: '中間時金(2)', standardLabel: '30%', standardRate: 0.3 },
  { key: 'finalPayment', label: '最終金', standardLabel: '残代金', standardRate: 0 },
] as const

// 会社情報
export const companyInfo = {
  name: '株式会社Gハウス',
  postalCode: '535-0022',
  address: '大阪市旭区新森２丁目２３−１２',
}

// 備考の固定文言
export const defaultRemarks = [
  '打合せの結果、計画が変更となった場合は、構造検討の結果により追加費用が発生する場合があります',
  '地中障害物が判明した際の撤去費用は、本見積には含まれておりません',
  '※ 本資金計画は概算です。実際の費用は条件により変動します',
]
