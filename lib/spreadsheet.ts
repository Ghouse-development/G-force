/**
 * Googleスプレッドシート連携モジュール
 *
 * Google Sheets APIを使用してスプレッドシートからデータをインポートします。
 *
 * 使用方法:
 * 1. Google Cloud Consoleでサービスアカウントを作成
 * 2. Google Sheets APIを有効化
 * 3. サービスアカウントの認証情報をダウンロード
 * 4. 環境変数を設定:
 *    - GOOGLE_SERVICE_ACCOUNT_EMAIL
 *    - GOOGLE_PRIVATE_KEY
 *    - GOOGLE_SPREADSHEET_ID
 */

export interface SpreadsheetConfig {
  serviceAccountEmail: string
  privateKey: string
  spreadsheetId: string
}

export interface SheetRow {
  [key: string]: string | number | boolean | null
}

export interface ImportResult {
  sheetName: string
  imported: number
  skipped: number
  errors: string[]
}

// フィールドマッピング（スプレッドシートのヘッダー → G-forceフィールド）
export const SPREADSHEET_FIELD_MAPPING: Record<string, string> = {
  // 基本情報
  '顧客名': 'name',
  'お名前': 'name',
  '氏名': 'name',
  'フリガナ': 'name_kana',
  '電話番号': 'phone',
  'TEL': 'phone',
  'メールアドレス': 'email',
  'Email': 'email',
  '住所': 'address',
  '郵便番号': 'postal_code',

  // 来場予約
  '来場希望日': 'visit_date',
  '来場日': 'visit_date',
  '予約日時': 'visit_date',
  '来場時間': 'visit_time',
  '来場目的': 'visit_purpose',
  '来場きっかけ': 'lead_source',

  // 問い合わせ・資料請求
  '問い合わせ日': 'inquiry_date',
  '問い合わせ内容': 'inquiry_content',
  '資料請求日': 'request_date',
  '希望資料': 'requested_materials',
  '反響媒体': 'lead_source',

  // その他
  '備考': 'notes',
  'メモ': 'notes',
  '登録日': 'created_at',
}

// シート別のインポート種別
export const SHEET_TYPES = {
  '来場予約': 'visit_reservation',
  '問い合わせ': 'inquiry',
  '資料請求': 'material_request',
} as const

/**
 * スプレッドシート設定を取得
 */
export function getSpreadsheetConfig(): SpreadsheetConfig | null {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID

  if (!serviceAccountEmail || !privateKey || !spreadsheetId) {
    return null
  }

  return { serviceAccountEmail, privateKey, spreadsheetId }
}

/**
 * スプレッドシート連携が有効かどうか
 */
export function isSpreadsheetEnabled(): boolean {
  return getSpreadsheetConfig() !== null
}

/**
 * Google Sheets APIのアクセストークンを取得
 */
async function getAccessToken(config: SpreadsheetConfig): Promise<string> {
  // JWTを使用してアクセストークンを取得
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  }

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: config.serviceAccountEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }

  // base64url encode
  const base64url = (str: string) => {
    return Buffer.from(str)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }

  const headerEncoded = base64url(JSON.stringify(header))
  const payloadEncoded = base64url(JSON.stringify(payload))
  const signatureInput = `${headerEncoded}.${payloadEncoded}`

  // Node.js crypto を使用して署名
  const crypto = await import('crypto')
  const sign = crypto.createSign('RSA-SHA256')
  sign.update(signatureInput)
  const signature = sign.sign(config.privateKey, 'base64')
  const signatureEncoded = signature
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')

  const jwt = `${headerEncoded}.${payloadEncoded}.${signatureEncoded}`

  // トークンエンドポイントにリクエスト
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get access token: ${error}`)
  }

  const data = await response.json()
  return data.access_token
}

/**
 * スプレッドシートからデータを取得
 */
export async function getSheetData(
  sheetName: string,
  range?: string
): Promise<SheetRow[]> {
  const config = getSpreadsheetConfig()
  if (!config) {
    throw new Error('Googleスプレッドシートの設定がありません')
  }

  const accessToken = await getAccessToken(config)
  const sheetRange = range || `${sheetName}!A:Z`

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(sheetRange)}`

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to fetch sheet data: ${error}`)
  }

  const data = await response.json()
  const values = data.values as string[][]

  if (!values || values.length < 2) {
    return []
  }

  // 1行目をヘッダーとして扱う
  const headers = values[0]
  const rows: SheetRow[] = []

  for (let i = 1; i < values.length; i++) {
    const row: SheetRow = {}
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j]
      const value = values[i][j] || null
      row[header] = value
    }
    rows.push(row)
  }

  return rows
}

/**
 * スプレッドシートの行をG-force形式に変換
 */
export function mapRowToCustomer(
  row: SheetRow,
  sheetType: string
): Record<string, unknown> {
  const customer: Record<string, unknown> = {}

  for (const [sheetField, value] of Object.entries(row)) {
    const gforceField = SPREADSHEET_FIELD_MAPPING[sheetField]
    if (gforceField && value !== null && value !== '') {
      customer[gforceField] = value
    }
  }

  // シート種別に応じた追加情報
  switch (sheetType) {
    case 'visit_reservation':
      customer.lead_source = customer.lead_source || '来場予約'
      customer.pipeline_status = 'visit_scheduled'
      break
    case 'inquiry':
      customer.lead_source = customer.lead_source || '問い合わせ'
      customer.pipeline_status = 'new'
      break
    case 'material_request':
      customer.lead_source = customer.lead_source || '資料請求'
      customer.pipeline_status = 'new'
      break
  }

  // 反響日を設定
  customer.lead_date =
    customer.visit_date ||
    customer.inquiry_date ||
    customer.request_date ||
    new Date().toISOString()

  return customer
}

/**
 * スプレッドシート接続テスト
 */
export async function checkSpreadsheetConnection(): Promise<{
  connected: boolean
  spreadsheetTitle?: string
  sheets?: string[]
  error?: string
}> {
  const config = getSpreadsheetConfig()
  if (!config) {
    return { connected: false, error: '設定が見つかりません' }
  }

  try {
    const accessToken = await getAccessToken(config)

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}`
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to connect to spreadsheet')
    }

    const data = await response.json()

    return {
      connected: true,
      spreadsheetTitle: data.properties.title,
      sheets: data.sheets.map((s: { properties: { title: string } }) => s.properties.title),
    }
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
