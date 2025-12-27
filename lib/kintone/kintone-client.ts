/**
 * kintone REST API クライアント
 * 初回受付台帳・ヒアリングシートのデータ取得と顧客紐づけ
 */

// kintone設定
export interface KintoneConfig {
  domain: string // example.cybozu.com
  apiToken: string // APIトークン
  receptionAppId: string // 初回受付台帳アプリID
  hearingSheetAppId: string // ヒアリングシートアプリID
}

// 初回受付台帳レコード
export interface ReceptionRecord {
  id: string
  recordNumber: string
  // 顧客情報
  customerName: string
  customerNameKana: string
  partnerName: string | null
  partnerNameKana: string | null
  // 連絡先
  phone: string
  phone2: string | null
  email: string
  // 住所
  postalCode: string
  address: string
  // その他
  leadSource: string
  eventDate: string | null
  notes: string
  // メタデータ
  createdAt: string
  updatedAt: string
}

// ヒアリングシートレコード
export interface HearingSheetRecord {
  id: string
  recordNumber: string
  // 顧客情報
  customerName: string
  phone: string
  email: string
  // ヒアリング内容
  familyStructure: string
  currentResidence: string
  budget: number | null
  desiredArea: string
  desiredLocation: string
  landRequirements: string
  buildingRequirements: string
  timeline: string
  notes: string
  // メタデータ
  createdAt: string
  updatedAt: string
}

// 紐づけ候補
export interface MatchCandidate {
  customerId: string
  customerName: string
  matchScore: number // 0-100
  matchReasons: string[]
}

// kintone APIレスポンス
interface KintoneRecordResponse {
  records: KintoneRecord[]
  totalCount?: string
}

interface KintoneRecord {
  $id: { value: string }
  $revision: { value: string }
  [key: string]: { value: unknown }
}

export class KintoneClient {
  private config: KintoneConfig

  constructor(config: KintoneConfig) {
    this.config = config
  }

  private get baseUrl(): string {
    return `https://${this.config.domain}/k/v1`
  }

  private get headers(): HeadersInit {
    return {
      'X-Cybozu-API-Token': this.config.apiToken,
      'Content-Type': 'application/json',
    }
  }

  /**
   * kintoneからレコードを取得
   */
  private async fetchRecords(appId: string, query?: string): Promise<KintoneRecord[]> {
    const url = new URL(`${this.baseUrl}/records.json`)
    url.searchParams.set('app', appId)
    if (query) {
      url.searchParams.set('query', query)
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.headers,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`kintone API error: ${error.message || response.statusText}`)
    }

    const data: KintoneRecordResponse = await response.json()
    return data.records
  }

  /**
   * 初回受付台帳からレコードを取得
   */
  async getReceptionRecords(options?: {
    limit?: number
    offset?: number
    since?: string // ISO日付
  }): Promise<ReceptionRecord[]> {
    let query = 'order by 更新日時 desc'
    if (options?.since) {
      query = `更新日時 >= "${options.since}" ${query}`
    }
    if (options?.limit) {
      query += ` limit ${options.limit}`
    }
    if (options?.offset) {
      query += ` offset ${options.offset}`
    }

    const records = await this.fetchRecords(this.config.receptionAppId, query)

    return records.map(record => this.mapReceptionRecord(record))
  }

  /**
   * ヒアリングシートからレコードを取得
   */
  async getHearingSheetRecords(options?: {
    limit?: number
    offset?: number
    since?: string
  }): Promise<HearingSheetRecord[]> {
    let query = 'order by 更新日時 desc'
    if (options?.since) {
      query = `更新日時 >= "${options.since}" ${query}`
    }
    if (options?.limit) {
      query += ` limit ${options.limit}`
    }
    if (options?.offset) {
      query += ` offset ${options.offset}`
    }

    const records = await this.fetchRecords(this.config.hearingSheetAppId, query)

    return records.map(record => this.mapHearingSheetRecord(record))
  }

  /**
   * 電話番号で検索
   */
  async searchByPhone(appId: string, phone: string): Promise<KintoneRecord[]> {
    const normalizedPhone = this.normalizePhone(phone)
    const query = `電話番号 like "${normalizedPhone}" or 電話番号2 like "${normalizedPhone}"`
    return this.fetchRecords(appId, query)
  }

  /**
   * メールアドレスで検索
   */
  async searchByEmail(appId: string, email: string): Promise<KintoneRecord[]> {
    const query = `メールアドレス = "${email}"`
    return this.fetchRecords(appId, query)
  }

  /**
   * 初回受付台帳レコードをマッピング
   */
  private mapReceptionRecord(record: KintoneRecord): ReceptionRecord {
    return {
      id: String(record.$id.value),
      recordNumber: String(record['レコード番号']?.value || ''),
      customerName: String(record['お客様名']?.value || record['顧客名']?.value || ''),
      customerNameKana: String(record['お客様名カナ']?.value || record['顧客名カナ']?.value || ''),
      partnerName: record['配偶者名']?.value ? String(record['配偶者名'].value) : null,
      partnerNameKana: record['配偶者名カナ']?.value ? String(record['配偶者名カナ'].value) : null,
      phone: String(record['電話番号']?.value || ''),
      phone2: record['電話番号2']?.value ? String(record['電話番号2'].value) : null,
      email: String(record['メールアドレス']?.value || ''),
      postalCode: String(record['郵便番号']?.value || ''),
      address: String(record['住所']?.value || ''),
      leadSource: String(record['反響経路']?.value || record['来場経路']?.value || ''),
      eventDate: record['イベント日']?.value ? String(record['イベント日'].value) : null,
      notes: String(record['備考']?.value || ''),
      createdAt: String(record['作成日時']?.value || ''),
      updatedAt: String(record['更新日時']?.value || ''),
    }
  }

  /**
   * ヒアリングシートレコードをマッピング
   */
  private mapHearingSheetRecord(record: KintoneRecord): HearingSheetRecord {
    return {
      id: String(record.$id.value),
      recordNumber: String(record['レコード番号']?.value || ''),
      customerName: String(record['お客様名']?.value || record['顧客名']?.value || ''),
      phone: String(record['電話番号']?.value || ''),
      email: String(record['メールアドレス']?.value || ''),
      familyStructure: String(record['家族構成']?.value || ''),
      currentResidence: String(record['現在のお住まい']?.value || ''),
      budget: record['ご予算']?.value ? Number(record['ご予算'].value) : null,
      desiredArea: String(record['希望坪数']?.value || ''),
      desiredLocation: String(record['希望エリア']?.value || ''),
      landRequirements: String(record['土地の条件']?.value || ''),
      buildingRequirements: String(record['建物の条件']?.value || ''),
      timeline: String(record['建築時期']?.value || ''),
      notes: String(record['備考']?.value || ''),
      createdAt: String(record['作成日時']?.value || ''),
      updatedAt: String(record['更新日時']?.value || ''),
    }
  }

  /**
   * 電話番号の正規化
   */
  private normalizePhone(phone: string): string {
    return phone.replace(/[-\s()（）]/g, '')
  }
}

/**
 * 顧客とのマッチングを行う
 */
export function findMatchingCustomers(
  record: ReceptionRecord | HearingSheetRecord,
  customers: Array<{ id: string; name: string; phone: string | null; email: string | null }>
): MatchCandidate[] {
  const candidates: MatchCandidate[] = []

  for (const customer of customers) {
    let score = 0
    const reasons: string[] = []

    // 電話番号マッチング
    if (record.phone && customer.phone) {
      const normalizedRecordPhone = record.phone.replace(/[-\s()（）]/g, '')
      const normalizedCustomerPhone = customer.phone.replace(/[-\s()（）]/g, '')
      if (normalizedRecordPhone === normalizedCustomerPhone) {
        score += 50
        reasons.push('電話番号一致')
      } else if (normalizedRecordPhone.includes(normalizedCustomerPhone) ||
                 normalizedCustomerPhone.includes(normalizedRecordPhone)) {
        score += 30
        reasons.push('電話番号部分一致')
      }
    }

    // メールアドレスマッチング
    if (record.email && customer.email) {
      if (record.email.toLowerCase() === customer.email.toLowerCase()) {
        score += 50
        reasons.push('メールアドレス一致')
      }
    }

    // 名前マッチング
    if (record.customerName && customer.name) {
      if (record.customerName === customer.name) {
        score += 30
        reasons.push('名前完全一致')
      } else if (record.customerName.includes(customer.name) ||
                 customer.name.includes(record.customerName)) {
        score += 15
        reasons.push('名前部分一致')
      }
    }

    if (score > 0) {
      candidates.push({
        customerId: customer.id,
        customerName: customer.name,
        matchScore: Math.min(score, 100),
        matchReasons: reasons,
      })
    }
  }

  // スコア降順でソート
  return candidates.sort((a, b) => b.matchScore - a.matchScore)
}

/**
 * kintone設定を保存・取得するためのストレージキー
 */
export const KINTONE_CONFIG_KEY = 'ghouse-kintone-config'

/**
 * kintone設定を保存
 */
export function saveKintoneConfig(config: KintoneConfig): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(KINTONE_CONFIG_KEY, JSON.stringify(config))
  }
}

/**
 * kintone設定を取得
 */
export function getKintoneConfig(): KintoneConfig | null {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(KINTONE_CONFIG_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return null
      }
    }
  }
  return null
}
