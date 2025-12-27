/**
 * メール反響自動取り込み
 * GAS（Google Apps Script）と連携してメール反響を自動登録
 *
 * フロー:
 * 1. GASがGmailから反響メールを検出
 * 2. GASがメール内容を解析してスプレッドシートに記録
 * 3. このシステムがスプレッドシートからデータを取得
 * 4. 生成AIで顧客情報を抽出し、自動登録
 */

// 反響メールソース
export type EmailSource = 'suumo' | 'homes' | 'hp_contact' | 'hp_document_request' | 'other'

// 反響メールデータ
export interface EmailLeadData {
  id: string
  source: EmailSource
  receivedAt: string
  subject: string
  body: string
  senderEmail: string
  senderName: string | null
  // 抽出された顧客情報
  extractedData: ExtractedCustomerData | null
  // 処理状態
  status: 'pending' | 'processed' | 'failed' | 'ignored'
  processedAt: string | null
  customerId: string | null // 紐づけられた顧客ID
  errorMessage: string | null
}

// メールから抽出された顧客情報
export interface ExtractedCustomerData {
  name: string | null
  nameKana: string | null
  phone: string | null
  email: string | null
  postalCode: string | null
  address: string | null
  // 希望条件
  desiredArea: string | null
  budget: number | null
  timeline: string | null
  familyStructure: string | null
  notes: string | null
}

// Google Sheets API設定
export interface GoogleSheetsConfig {
  spreadsheetId: string
  sheetName: string
  apiKey: string // または OAuth2トークン
}

/**
 * メール本文から顧客情報を抽出（パターンマッチング）
 */
export function extractCustomerDataFromEmail(
  body: string,
  _source: EmailSource
): ExtractedCustomerData {
  const result: ExtractedCustomerData = {
    name: null,
    nameKana: null,
    phone: null,
    email: null,
    postalCode: null,
    address: null,
    desiredArea: null,
    budget: null,
    timeline: null,
    familyStructure: null,
    notes: null,
  }

  // 電話番号抽出
  const phonePatterns = [
    /電話[番号]*\s*[:：]?\s*([\d\-()（）]+)/,
    /TEL\s*[:：]?\s*([\d\-()（）]+)/i,
    /連絡先\s*[:：]?\s*([\d\-()（）]+)/,
    /(\d{2,4}[-\s]?\d{2,4}[-\s]?\d{3,4})/,
  ]
  for (const pattern of phonePatterns) {
    const match = body.match(pattern)
    if (match && match[1]) {
      result.phone = match[1].replace(/\s/g, '')
      break
    }
  }

  // メールアドレス抽出
  const emailPattern = /[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/
  const emailMatch = body.match(emailPattern)
  if (emailMatch) {
    result.email = emailMatch[0]
  }

  // 名前抽出
  const namePatterns = [
    /お名前\s*[:：]?\s*([^\n\r]+)/,
    /氏名\s*[:：]?\s*([^\n\r]+)/,
    /ご氏名\s*[:：]?\s*([^\n\r]+)/,
    /Name\s*[:：]?\s*([^\n\r]+)/i,
  ]
  for (const pattern of namePatterns) {
    const match = body.match(pattern)
    if (match && match[1]) {
      result.name = match[1].trim()
      break
    }
  }

  // カナ名抽出
  const kanaPatterns = [
    /フリガナ\s*[:：]?\s*([^\n\r]+)/,
    /ふりがな\s*[:：]?\s*([^\n\r]+)/,
    /カナ\s*[:：]?\s*([^\n\r]+)/,
  ]
  for (const pattern of kanaPatterns) {
    const match = body.match(pattern)
    if (match && match[1]) {
      result.nameKana = match[1].trim()
      break
    }
  }

  // 郵便番号抽出
  const postalPatterns = [
    /〒?\s*(\d{3}[-−]?\d{4})/,
    /郵便番号\s*[:：]?\s*(\d{3}[-−]?\d{4})/,
  ]
  for (const pattern of postalPatterns) {
    const match = body.match(pattern)
    if (match && match[1]) {
      result.postalCode = match[1]
      break
    }
  }

  // 住所抽出
  const addressPatterns = [
    /住所\s*[:：]?\s*([^\n\r]+)/,
    /ご住所\s*[:：]?\s*([^\n\r]+)/,
    /現住所\s*[:：]?\s*([^\n\r]+)/,
  ]
  for (const pattern of addressPatterns) {
    const match = body.match(pattern)
    if (match && match[1]) {
      result.address = match[1].trim()
      break
    }
  }

  // 希望エリア抽出
  const areaPatterns = [
    /希望エリア\s*[:：]?\s*([^\n\r]+)/,
    /建築希望地\s*[:：]?\s*([^\n\r]+)/,
    /建築予定地\s*[:：]?\s*([^\n\r]+)/,
  ]
  for (const pattern of areaPatterns) {
    const match = body.match(pattern)
    if (match && match[1]) {
      result.desiredArea = match[1].trim()
      break
    }
  }

  // 予算抽出
  const budgetPatterns = [
    /予算\s*[:：]?\s*(\d+)[万円]?/,
    /ご予算\s*[:：]?\s*(\d+)[万円]?/,
    /(\d{4})\s*万円/,
  ]
  for (const pattern of budgetPatterns) {
    const match = body.match(pattern)
    if (match && match[1]) {
      result.budget = parseInt(match[1], 10) * 10000 // 万円を円に変換
      break
    }
  }

  // 建築時期抽出
  const timelinePatterns = [
    /建築時期\s*[:：]?\s*([^\n\r]+)/,
    /ご検討時期\s*[:：]?\s*([^\n\r]+)/,
    /いつ頃\s*[:：]?\s*([^\n\r]+)/,
  ]
  for (const pattern of timelinePatterns) {
    const match = body.match(pattern)
    if (match && match[1]) {
      result.timeline = match[1].trim()
      break
    }
  }

  // 家族構成抽出
  const familyPatterns = [
    /家族構成\s*[:：]?\s*([^\n\r]+)/,
    /ご家族\s*[:：]?\s*([^\n\r]+)/,
    /世帯\s*[:：]?\s*([^\n\r]+)/,
  ]
  for (const pattern of familyPatterns) {
    const match = body.match(pattern)
    if (match && match[1]) {
      result.familyStructure = match[1].trim()
      break
    }
  }

  // 備考・その他抽出
  const notesPatterns = [
    /備考\s*[:：]?\s*([^\n\r]+)/,
    /その他\s*[:：]?\s*([^\n\r]+)/,
    /ご要望\s*[:：]?\s*([^\n\r]+)/,
    /ご質問\s*[:：]?\s*([^\n\r]+)/,
  ]
  for (const pattern of notesPatterns) {
    const match = body.match(pattern)
    if (match && match[1]) {
      result.notes = match[1].trim()
      break
    }
  }

  return result
}

/**
 * メールソースを判定
 */
export function detectEmailSource(senderEmail: string, subject: string, _body: string): EmailSource {
  const senderLower = senderEmail.toLowerCase()
  const subjectLower = subject.toLowerCase()

  // SUUMO
  if (senderLower.includes('suumo') || subjectLower.includes('suumo')) {
    return 'suumo'
  }

  // HOME'S
  if (senderLower.includes('homes') || senderLower.includes('lifull') || subjectLower.includes("home's")) {
    return 'homes'
  }

  // 自社HP問い合わせ
  if (subjectLower.includes('問い合わせ') || subjectLower.includes('お問合せ')) {
    return 'hp_contact'
  }

  // 自社HP資料請求
  if (subjectLower.includes('資料請求') || subjectLower.includes('カタログ')) {
    return 'hp_document_request'
  }

  return 'other'
}

/**
 * GASスクリプト（参考用）
 * このスクリプトをGoogleスプレッドシートのApps Scriptにコピーして使用
 */
export const GAS_SCRIPT_TEMPLATE = `
/**
 * 反響メール自動取得GASスクリプト
 * 使い方:
 * 1. Googleスプレッドシートを作成
 * 2. 拡張機能 > Apps Script を開く
 * 3. このスクリプトをコピー&ペースト
 * 4. SETTINGS を編集（検索クエリ、ラベル等）
 * 5. トリガーを設定（時間主導型、5分おき等）
 */

const SETTINGS = {
  // 反響メールを検索するGmailの検索クエリ
  SEARCH_QUERIES: [
    'from:suumo subject:お問い合わせ is:unread',
    'from:homes subject:資料請求 is:unread',
    'subject:問い合わせ is:unread -label:processed',
    'subject:資料請求 is:unread -label:processed',
  ],
  // 処理済みラベル
  PROCESSED_LABEL: 'G-force_処理済み',
  // 出力するシート名
  SHEET_NAME: '反響メール',
};

function processInquiryEmails() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SETTINGS.SHEET_NAME);
  if (!sheet) {
    throw new Error('シート "' + SETTINGS.SHEET_NAME + '" が見つかりません');
  }

  // ヘッダーが無ければ追加
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'ID', '受信日時', '送信者メール', '送信者名', '件名', '本文', 'ソース', 'ステータス', '処理日時', 'エラー'
    ]);
  }

  const processedLabel = GmailApp.getUserLabelByName(SETTINGS.PROCESSED_LABEL)
    || GmailApp.createLabel(SETTINGS.PROCESSED_LABEL);

  for (const query of SETTINGS.SEARCH_QUERIES) {
    const threads = GmailApp.search(query, 0, 50);

    for (const thread of threads) {
      const messages = thread.getMessages();

      for (const message of messages) {
        const id = message.getId();
        const receivedAt = message.getDate().toISOString();
        const senderEmail = message.getFrom().match(/<([^>]+)>/)?.[1] || message.getFrom();
        const senderName = message.getFrom().replace(/<[^>]+>/, '').trim();
        const subject = message.getSubject();
        const body = message.getPlainBody();
        const source = detectSource(senderEmail, subject);

        // スプレッドシートに追加
        sheet.appendRow([
          id, receivedAt, senderEmail, senderName, subject, body, source, 'pending', '', ''
        ]);

        // 既読にしてラベル付け
        message.markRead();
        thread.addLabel(processedLabel);
      }
    }
  }
}

function detectSource(senderEmail, subject) {
  const senderLower = senderEmail.toLowerCase();
  const subjectLower = subject.toLowerCase();

  if (senderLower.includes('suumo')) return 'suumo';
  if (senderLower.includes('homes') || senderLower.includes('lifull')) return 'homes';
  if (subjectLower.includes('問い合わせ')) return 'hp_contact';
  if (subjectLower.includes('資料請求')) return 'hp_document_request';
  return 'other';
}

// 5分おきに実行するトリガーを設定
function createTrigger() {
  ScriptApp.newTrigger('processInquiryEmails')
    .timeBased()
    .everyMinutes(5)
    .create();
}
`

/**
 * Google Sheetsからデータを取得（Sheets API使用）
 */
export async function fetchEmailLeadsFromSheets(
  config: GoogleSheetsConfig
): Promise<EmailLeadData[]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${config.sheetName}?key=${config.apiKey}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Google Sheets API error: ${response.statusText}`)
  }

  const data = await response.json()
  const rows: string[][] = data.values || []

  // ヘッダー行をスキップ
  if (rows.length <= 1) return []

  const leads: EmailLeadData[] = []
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (row.length < 7) continue

    const id = row[0]
    const source = row[6] as EmailSource
    const body = row[5]

    leads.push({
      id,
      source,
      receivedAt: row[1],
      senderEmail: row[2],
      senderName: row[3] || null,
      subject: row[4],
      body,
      extractedData: extractCustomerDataFromEmail(body, source),
      status: (row[7] as EmailLeadData['status']) || 'pending',
      processedAt: row[8] || null,
      customerId: null,
      errorMessage: row[9] || null,
    })
  }

  return leads
}

/**
 * メール反響設定を保存
 */
export const EMAIL_IMPORT_CONFIG_KEY = 'ghouse-email-import-config'

export function saveEmailImportConfig(config: GoogleSheetsConfig): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(EMAIL_IMPORT_CONFIG_KEY, JSON.stringify(config))
  }
}

export function getEmailImportConfig(): GoogleSheetsConfig | null {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(EMAIL_IMPORT_CONFIG_KEY)
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
