/**
 * クロール関連の型定義
 */

// =============================================
// 住宅ローン金利
// =============================================

export interface LoanRate {
  id: string
  bankName: string
  bankCode?: string
  rateType: string           // 変動, 固定10年, 固定35年 等
  rate: number               // 金利（%）
  rateDate: string           // YYYY-MM-DD
  previousRate?: number
  rateChange?: number
  sourceUrl?: string
  fetchedAt: string
  createdAt: string
  updatedAt: string
}

export interface LoanRateHistory {
  id: string
  bankName: string
  rateType: string
  oldRate?: number
  newRate?: number
  changeAmount?: number
  changeDate: string
  createdAt: string
}

// =============================================
// 住宅ローンニュース
// =============================================

export interface LoanNews {
  id: string
  title: string
  summary?: string
  content?: string
  source: string             // 住宅金融支援機構, 各銀行名
  sourceUrl?: string
  publishedAt?: string
  category?: string          // 金利変更, 制度変更, キャンペーン
  importance: 'high' | 'normal' | 'low'
  isNotified: boolean
  fetchedAt: string
  createdAt: string
}

// =============================================
// 不動産物件アラート
// =============================================

export interface PropertyAlert {
  id: string
  customerId: string
  alertName: string
  isActive: boolean

  // ===== 条件 =====
  // エリア条件
  areas?: string[]               // エリア（市区町村）
  schoolDistricts?: string[]     // 学校区（希望の学区）

  // 沿線条件
  trainLines?: {                 // 沿線条件
    lineName: string             // 路線名（例: JR東海道線）
    stationFrom?: string         // 開始駅（例: 大阪駅）
    stationTo?: string           // 終了駅（例: 神戸駅）
  }[]
  stationWalkMax?: number        // 駅徒歩（分）

  // 価格条件
  minPrice?: number              // 最低価格（万円）
  maxPrice?: number              // 最高価格（万円）

  // 土地条件
  minLandArea?: number           // 最低土地面積（㎡）
  maxLandArea?: number           // 最高土地面積（㎡）
  landShapePreferences?: string[]// 土地形状の希望
  allowFlagLot?: boolean         // 旗竿地OK（デフォルト: false）
  roadWidthMin?: number          // 前面道路幅員（m）

  // 建築条件
  buildingCoverageMax?: number   // 建ぺい率（%）
  floorAreaRatioMin?: number     // 容積率（%）
  allowBuildingCondition?: boolean // 建築条件付き土地OK（デフォルト: false）

  // キーワード
  keywords?: string[]            // キーワード
  excludeKeywords?: string[]     // 除外キーワード

  // ===== 通知設定 =====
  notifyEmail: boolean
  notifyApp: boolean

  createdAt: string
  updatedAt: string
}

// =============================================
// クロールした物件情報
// =============================================

export interface CrawledProperty {
  id: string
  source: string             // suumo, athome 等
  sourceId: string           // 元サイトでのID
  sourceUrl: string

  // 物件情報
  title?: string
  price?: number             // 価格（万円）
  address?: string
  area?: string              // 市区町村
  landArea?: number          // 土地面積（㎡）
  buildingArea?: number      // 建物面積（㎡）
  buildingCoverage?: number  // 建ぺい率（%）
  floorAreaRatio?: number    // 容積率（%）
  roadWidth?: number         // 前面道路幅員（m）
  roadDirection?: string     // 道路方向
  landShape?: string         // 土地形状
  stationName?: string       // 最寄り駅
  stationWalk?: number       // 駅徒歩（分）

  // メタ情報
  images?: string[]
  rawData?: Record<string, unknown>
  firstSeenAt: string
  lastSeenAt: string
  isAvailable: boolean

  createdAt: string
  updatedAt: string
}

// =============================================
// 物件通知
// =============================================

export interface PropertyNotification {
  id: string
  alertId: string
  propertyId: string
  customerId: string
  matchScore?: number        // マッチ度（%）
  matchDetails?: {
    matchedConditions: string[]
    unmatchedConditions: string[]
  }
  isRead: boolean
  isSent: boolean
  sentAt?: string
  readAt?: string
  createdAt: string

  // 結合データ
  property?: CrawledProperty
  alert?: PropertyAlert
}

// =============================================
// クロールログ
// =============================================

export interface CrawlLog {
  id: string
  crawlType: 'loan_rates' | 'loan_news' | 'properties'
  source?: string
  status: 'success' | 'error' | 'partial'
  itemsFetched: number
  itemsNew: number
  itemsUpdated: number
  errorMessage?: string
  startedAt: string
  finishedAt?: string
  createdAt: string
}

// =============================================
// 銀行マスタ（クロール対象）
// =============================================

export interface BankCrawlConfig {
  bankName: string
  bankCode: string
  ratePageUrl: string
  enabled: boolean
  selectors?: {
    variableRate?: string
    fixed10Rate?: string
    fixed35Rate?: string
  }
}

// 銀行カテゴリ
export type BankCategory = 'flat35' | 'mega' | 'kansai_regional' | 'credit_union' | 'net'

export interface BankCrawlConfigExtended extends BankCrawlConfig {
  category: BankCategory
}

// 主要銀行の設定（関西中心）
export const BANK_CRAWL_CONFIGS: BankCrawlConfigExtended[] = [
  // ===== フラット35 =====
  {
    bankName: '住宅金融支援機構（フラット35）',
    bankCode: 'jhf',
    ratePageUrl: 'https://www.flat35.com/loan/rate/index.html',
    enabled: true,
    category: 'flat35',
  },

  // ===== メガバンク =====
  {
    bankName: '三菱UFJ銀行',
    bankCode: 'mufg',
    ratePageUrl: 'https://www.bk.mufg.jp/kariru/jutaku/yuuguu/index.html',
    enabled: true,
    category: 'mega',
  },
  {
    bankName: '三井住友銀行',
    bankCode: 'smbc',
    ratePageUrl: 'https://www.smbc.co.jp/kojin/jutaku_loan/',
    enabled: true,
    category: 'mega',
  },
  {
    bankName: 'みずほ銀行',
    bankCode: 'mizuho',
    ratePageUrl: 'https://www.mizuhobank.co.jp/retail/products/loan/housing/',
    enabled: true,
    category: 'mega',
  },
  {
    bankName: 'りそな銀行',
    bankCode: 'resona',
    ratePageUrl: 'https://www.resonabank.co.jp/kojin/jutaku/',
    enabled: true,
    category: 'mega',
  },

  // ===== 関西の地方銀行 =====
  {
    bankName: '関西みらい銀行',
    bankCode: 'kansai_mirai',
    ratePageUrl: 'https://www.kansaimiraibank.co.jp/kojin/loan/housing/',
    enabled: true,
    category: 'kansai_regional',
  },
  {
    bankName: '池田泉州銀行',
    bankCode: 'senshu_ikeda',
    ratePageUrl: 'https://www.sihd-bk.jp/personal/loan/housing/',
    enabled: true,
    category: 'kansai_regional',
  },
  {
    bankName: '京都銀行',
    bankCode: 'kyoto',
    ratePageUrl: 'https://www.kyotobank.co.jp/kojin/kariru/jutaku/',
    enabled: true,
    category: 'kansai_regional',
  },
  {
    bankName: '滋賀銀行',
    bankCode: 'shiga',
    ratePageUrl: 'https://www.shigagin.com/personal/loan/housing/',
    enabled: true,
    category: 'kansai_regional',
  },
  {
    bankName: '南都銀行',
    bankCode: 'nanto',
    ratePageUrl: 'https://www.nantobank.co.jp/kojin/kariru/jutaku/',
    enabled: true,
    category: 'kansai_regional',
  },
  {
    bankName: '紀陽銀行',
    bankCode: 'kiyo',
    ratePageUrl: 'https://www.kiyobank.co.jp/personal/loan/housing/',
    enabled: true,
    category: 'kansai_regional',
  },
  {
    bankName: '但馬銀行',
    bankCode: 'tajima',
    ratePageUrl: 'https://www.tajimabank.co.jp/personal/loan/jutaku/',
    enabled: true,
    category: 'kansai_regional',
  },
  {
    bankName: '近畿大阪銀行',
    bankCode: 'kinki_osaka',
    ratePageUrl: 'https://www.kinkiosakabank.co.jp/kojin/loan/housing/',
    enabled: true,
    category: 'kansai_regional',
  },

  // ===== 信用金庫（関西） =====
  {
    bankName: '大阪信用金庫',
    bankCode: 'osaka_shinkin',
    ratePageUrl: 'https://www.osaka-shinkin.co.jp/kojin/loan/housing/',
    enabled: true,
    category: 'credit_union',
  },
  {
    bankName: '大阪シティ信用金庫',
    bankCode: 'osaka_city_shinkin',
    ratePageUrl: 'https://www.osaka-city-shinkin.co.jp/kojin/loan/housing/',
    enabled: true,
    category: 'credit_union',
  },
  {
    bankName: '尼崎信用金庫',
    bankCode: 'amagasaki_shinkin',
    ratePageUrl: 'https://www.amashin.co.jp/kojin/loan/housing/',
    enabled: true,
    category: 'credit_union',
  },
  {
    bankName: '北おおさか信用金庫',
    bankCode: 'kitaosaka_shinkin',
    ratePageUrl: 'https://www.kitaosaka-shinkin.co.jp/kojin/loan/housing/',
    enabled: true,
    category: 'credit_union',
  },
  {
    bankName: '兵庫信用金庫',
    bankCode: 'hyogo_shinkin',
    ratePageUrl: 'https://www.shinkin.co.jp/hyogoshinkin/kojin/loan/housing/',
    enabled: true,
    category: 'credit_union',
  },
  {
    bankName: '京都中央信用金庫',
    bankCode: 'kyoto_chuo_shinkin',
    ratePageUrl: 'https://www.chushin.co.jp/kojin/loan/housing/',
    enabled: true,
    category: 'credit_union',
  },
  {
    bankName: '大阪厚生信用金庫',
    bankCode: 'osaka_kosei_shinkin',
    ratePageUrl: 'https://www.osaka-kosei.co.jp/kojin/loan/housing/',
    enabled: true,
    category: 'credit_union',
  },

  // ===== ネット銀行 =====
  {
    bankName: '住信SBIネット銀行',
    bankCode: 'sbi',
    ratePageUrl: 'https://www.netbk.co.jp/contents/lineup/home-loan/',
    enabled: true,
    category: 'net',
  },
  {
    bankName: '楽天銀行',
    bankCode: 'rakuten',
    ratePageUrl: 'https://www.rakuten-bank.co.jp/home-loan/',
    enabled: true,
    category: 'net',
  },
  {
    bankName: 'auじぶん銀行',
    bankCode: 'aujibun',
    ratePageUrl: 'https://www.jibunbank.co.jp/products/homeloan/',
    enabled: true,
    category: 'net',
  },
  {
    bankName: 'PayPay銀行',
    bankCode: 'paypay',
    ratePageUrl: 'https://www.paypay-bank.co.jp/mortgage/',
    enabled: true,
    category: 'net',
  },
  {
    bankName: 'イオン銀行',
    bankCode: 'aeon',
    ratePageUrl: 'https://www.aeonbank.co.jp/housing_loan/',
    enabled: true,
    category: 'net',
  },
  {
    bankName: 'ソニー銀行',
    bankCode: 'sony',
    ratePageUrl: 'https://moneykit.net/visitor/hl/',
    enabled: true,
    category: 'net',
  },
  {
    bankName: 'SBI新生銀行',
    bankCode: 'sbi_shinsei',
    ratePageUrl: 'https://www.sbishinseibank.co.jp/retail/housing/',
    enabled: true,
    category: 'net',
  },
]

// カテゴリ別にグループ化するヘルパー
export function getBanksByCategory(category: BankCategory): BankCrawlConfigExtended[] {
  return BANK_CRAWL_CONFIGS.filter(b => b.category === category && b.enabled)
}

// カテゴリ名の日本語表示
export const BANK_CATEGORY_LABELS: Record<BankCategory, string> = {
  flat35: 'フラット35',
  mega: 'メガバンク',
  kansai_regional: '関西の地方銀行',
  credit_union: '信用金庫',
  net: 'ネット銀行',
}
