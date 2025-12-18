/**
 * kintone連携モジュール
 *
 * このモジュールはkintoneとの双方向データ同期を提供します。
 *
 * 使用方法:
 * 1. 環境変数の設定:
 *    - KINTONE_DOMAIN: kintoneのドメイン (例: your-subdomain.cybozu.com)
 *    - KINTONE_API_TOKEN: APIトークン
 *    - KINTONE_APP_ID: アプリID
 *
 * 2. .env.localに以下を追加:
 *    KINTONE_DOMAIN=your-subdomain.cybozu.com
 *    KINTONE_API_TOKEN=your-api-token
 *    KINTONE_APP_ID=123
 */

export interface KintoneConfig {
  domain: string
  apiToken: string
  appId: string
}

export interface KintoneRecord {
  $id?: { type: '__ID__'; value: string }
  $revision?: { type: '__REVISION__'; value: string }
  [fieldCode: string]: { type: string; value: unknown } | undefined
}

export interface KintoneResponse {
  id?: string
  revision?: string
  record?: KintoneRecord
  records?: KintoneRecord[]
  totalCount?: string
}

// kintoneフィールドマッピング（G-force → kintone）
export const FIELD_MAPPING = {
  // 顧客情報
  name: '顧客名',
  tei_name: '邸名',
  phone: '電話番号',
  email: 'メールアドレス',
  postal_code: '郵便番号',
  address: '住所',

  // パイプライン情報
  pipeline_status: 'ステータス',
  lead_source: '反響媒体',
  lead_date: '反響日',

  // 担当者情報
  sales_rep_name: '営業担当',
  designer_name: '設計担当',
  coordinator_name: 'コーディネーター',

  // 金額情報
  estimated_amount: '見積金額',
  contract_amount: '契約金額',

  // 日程
  contract_date: '契約日',
  construction_start_date: '着工日',
  handover_date: '引渡日',
}

/**
 * kintone設定を取得
 */
export function getKintoneConfig(): KintoneConfig | null {
  const domain = process.env.KINTONE_DOMAIN
  const apiToken = process.env.KINTONE_API_TOKEN
  const appId = process.env.KINTONE_APP_ID

  if (!domain || !apiToken || !appId) {
    console.warn('kintone設定が不完全です。環境変数を確認してください。')
    return null
  }

  return { domain, apiToken, appId }
}

/**
 * kintoneが有効かどうかを確認
 */
export function isKintoneEnabled(): boolean {
  return getKintoneConfig() !== null
}

/**
 * kintone APIにリクエストを送信
 */
async function kintoneRequest(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  body?: unknown
): Promise<KintoneResponse> {
  const config = getKintoneConfig()
  if (!config) {
    throw new Error('kintone設定が見つかりません')
  }

  const url = `https://${config.domain}/k/v1/${endpoint}`

  const response = await fetch(url, {
    method,
    headers: {
      'X-Cybozu-API-Token': config.apiToken,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`kintone API error: ${JSON.stringify(error)}`)
  }

  return response.json()
}

/**
 * G-forceのデータをkintone形式に変換
 */
export function toKintoneRecord(
  data: Record<string, unknown>
): Record<string, { value: unknown }> {
  const record: Record<string, { value: unknown }> = {}

  for (const [gforceField, kintoneField] of Object.entries(FIELD_MAPPING)) {
    if (data[gforceField] !== undefined && data[gforceField] !== null) {
      record[kintoneField] = { value: data[gforceField] }
    }
  }

  return record
}

/**
 * kintoneのデータをG-force形式に変換
 */
export function fromKintoneRecord(
  record: KintoneRecord
): Record<string, unknown> {
  const data: Record<string, unknown> = {}

  // kintone_record_idを設定
  if (record.$id) {
    data.kintone_record_id = record.$id.value
  }

  // 逆マッピング（kintone → G-force）
  const reverseMapping = Object.fromEntries(
    Object.entries(FIELD_MAPPING).map(([k, v]) => [v, k])
  )

  for (const [fieldCode, field] of Object.entries(record)) {
    if (fieldCode.startsWith('$')) continue
    if (!field) continue

    const gforceField = reverseMapping[fieldCode]
    if (gforceField) {
      data[gforceField] = field.value
    }
  }

  return data
}

/**
 * 新規レコードをkintoneに作成
 */
export async function createKintoneRecord(
  data: Record<string, unknown>
): Promise<string> {
  const config = getKintoneConfig()
  if (!config) {
    throw new Error('kintone設定が見つかりません')
  }

  const record = toKintoneRecord(data)

  const response = await kintoneRequest('record.json', 'POST', {
    app: config.appId,
    record,
  })

  return response.id || ''
}

/**
 * kintoneレコードを更新
 */
export async function updateKintoneRecord(
  recordId: string,
  data: Record<string, unknown>
): Promise<void> {
  const config = getKintoneConfig()
  if (!config) {
    throw new Error('kintone設定が見つかりません')
  }

  const record = toKintoneRecord(data)

  await kintoneRequest('record.json', 'PUT', {
    app: config.appId,
    id: recordId,
    record,
  })
}

/**
 * kintoneからレコードを取得
 */
export async function getKintoneRecord(
  recordId: string
): Promise<Record<string, unknown>> {
  const config = getKintoneConfig()
  if (!config) {
    throw new Error('kintone設定が見つかりません')
  }

  const response = await kintoneRequest(
    `record.json?app=${config.appId}&id=${recordId}`,
    'GET'
  )

  if (!response.record) {
    throw new Error('レコードが見つかりません')
  }

  return fromKintoneRecord(response.record)
}

/**
 * kintoneからレコード一覧を取得
 */
export async function getKintoneRecords(
  query?: string,
  limit = 100,
  offset = 0
): Promise<Record<string, unknown>[]> {
  const config = getKintoneConfig()
  if (!config) {
    throw new Error('kintone設定が見つかりません')
  }

  const params = new URLSearchParams({
    app: config.appId,
    totalCount: 'true',
  })

  if (query) {
    params.append('query', `${query} limit ${limit} offset ${offset}`)
  } else {
    params.append('query', `limit ${limit} offset ${offset}`)
  }

  const response = await kintoneRequest(`records.json?${params}`, 'GET')

  return (response.records || []).map(fromKintoneRecord)
}

/**
 * kintoneレコードを削除
 */
export async function deleteKintoneRecord(recordId: string): Promise<void> {
  const config = getKintoneConfig()
  if (!config) {
    throw new Error('kintone設定が見つかりません')
  }

  await kintoneRequest('records.json', 'DELETE', {
    app: config.appId,
    ids: [recordId],
  })
}

/**
 * G-forceとkintoneのデータを同期
 * (G-force → kintone方向)
 */
export async function syncToKintone(
  customerId: string,
  data: Record<string, unknown>,
  existingKintoneId: string | null
): Promise<string> {
  if (existingKintoneId) {
    // 既存レコードを更新
    await updateKintoneRecord(existingKintoneId, data)
    return existingKintoneId
  } else {
    // 新規レコードを作成
    const newId = await createKintoneRecord(data)
    return newId
  }
}

/**
 * kintoneステータス確認用のヘルスチェック
 */
export async function checkKintoneConnection(): Promise<{
  connected: boolean
  message: string
}> {
  const config = getKintoneConfig()

  if (!config) {
    return {
      connected: false,
      message:
        'kintone設定が見つかりません。環境変数（KINTONE_DOMAIN, KINTONE_API_TOKEN, KINTONE_APP_ID）を設定してください。',
    }
  }

  try {
    // アプリ情報を取得してテスト
    await kintoneRequest(`app.json?id=${config.appId}`, 'GET')
    return {
      connected: true,
      message: `kintoneに接続しました（アプリID: ${config.appId}）`,
    }
  } catch (error) {
    return {
      connected: false,
      message: `kintone接続エラー: ${error instanceof Error ? error.message : '不明なエラー'}`,
    }
  }
}
