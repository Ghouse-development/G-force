import type { ProductType, FireProtectionZone, BuildingStructure, FloorCount } from '@/types/fund-plan'

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
  '防火地域',
  '準防火地域',
  '法22条地域',
]

// 建物構造マスタ
export const buildingStructures: BuildingStructure[] = [
  '在来軸組工法 ガルバリウム鋼板葺',
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

// 太陽光パネル単価（1kWあたり）
export const solarPanelPricePerKw = 209500

// 蓄電池価格
export const storageBatteryPrices = {
  none: 0,
  standard: 1500000,
  v2h: 2000000,
}

// 3階建て差額（1坪あたり）
export const threeStoryExtraPerTsubo = 40000

// 消費税率
export const taxRate = 0.10

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
