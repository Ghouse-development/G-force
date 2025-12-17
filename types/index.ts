// Re-export database types
export * from './database'

// Notification types
export interface Notification {
  id: string
  userId: string
  type: 'customer_created' | 'fund_plan_submitted' | 'fund_plan_approved' | 'system'
  title: string
  message: string
  read: boolean
  createdAt: Date
}

// Fund Plan Data structure (JSONB content)
export interface FundPlanData {
  // 基本情報
  constructionArea: number // 施工面積（坪）
  floors: number // 階数
  firePreventionZone: '防火地域' | '準防火地域' | '法22条地域' | ''
  buildingStructure: '在来軸組工法 ガルバリウム鋼板葺' | 'テクノストラクチャー工法' | ''

  // 建物本体
  buildingPrice: number

  // 付帯工事A（建物本体以外）
  ancillaryA: {
    solarPanel: number // 太陽光
    battery: number // 蓄電池
    airConditioner: number // エアコン
    curtain: number // カーテン
    other: number
  }

  // 付帯工事B（間取・オプション）
  ancillaryB: {
    balcony: number // バルコニー
    eaves: number // 軒出
    other: number
  }

  // 付帯工事C（土地条件）
  ancillaryC: {
    demolition: number // 解体
    groundWork: number // 地盤改良
    exteriorWork: number // 外構
    other: number
  }

  // 諸費用
  expenses: {
    registration: number // 登記
    loan: number // ローン関連
    fire_insurance: number // 火災保険
    other: number
  }

  // 土地
  land: {
    price: number // 土地代
    brokerage: number // 仲介手数料
    other: number
  }

  // 日程
  schedule: {
    contractDate: string | null // 契約日
    startDate: string | null // 着工日
    completionDate: string | null // 完成日
    deliveryDate: string | null // 引渡日
  }

  // 支払い
  payment: {
    contractDeposit: number // 契約金
    startDeposit: number // 着工金
    framingDeposit: number // 上棟金
    finalPayment: number // 残金
  }

  // 融資
  loan: {
    amount: number // 借入額
    interestRate: number // 金利
    years: number // 返済年数
    monthlyPayment: number // 月々返済額
  }
}

// Dashboard statistics
export interface DashboardStats {
  totalCustomers: number
  newCustomers: number
  inNegotiation: number
  contracted: number
  lost: number
  conversionRate: number
  monthlyTarget: number
  monthlyActual: number
}

// Sales representative info from Excel
export interface SalesRep {
  name: string
  phone: string
}

// Campaign info
export interface Campaign {
  id: string
  name: string
  conditions: string[]
  isActive: boolean
}
