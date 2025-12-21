import { NextResponse } from 'next/server'
import { customerDb } from '@/lib/db'

/**
 * Formbridge Webhook受信エンドポイント
 *
 * Formbridgeからのアンケート・ヒアリングデータを受信し、
 * 顧客データに紐付けて保存します。
 *
 * 設定方法:
 * 1. FormbridgeのWebhook設定で送信先URLにこのエンドポイントを登録
 * 2. 送信タイミング: レコード追加時
 * 3. 送信フォーマット: JSON
 */

// Formbridgeから送信されるデータの型
interface FormbridgePayload {
  record: {
    [fieldCode: string]: {
      type: string
      value: unknown
    }
  }
  app: {
    id: string
    name: string
  }
  meta?: {
    recordId?: string
    createdAt?: string
  }
}

// フィールドマッピング（Formbridgeフィールドコード → G-forceフィールド）
const FIELD_MAPPING: Record<string, string> = {
  // 基本情報
  '顧客名': 'name',
  'お名前': 'name',
  'フリガナ': 'name_kana',
  '電話番号': 'phone',
  'メールアドレス': 'email',
  'メール': 'email',
  '住所': 'address',
  '郵便番号': 'postal_code',

  // アンケート関連
  '来場きっかけ': 'lead_source',
  '反響媒体': 'lead_source',
  '希望エリア': 'preferred_area',
  '希望予算': 'budget_range',
  '建築予定時期': 'construction_timing',
  '家族構成': 'family_structure',
  '要望・質問': 'requirements',
  '備考': 'notes',

  // 来場予約
  '希望日時': 'visit_date',
  '来場目的': 'visit_purpose',
}

// アンケート回答をまとめて保存するフィールド
const SURVEY_FIELDS = [
  '希望エリア',
  '希望予算',
  '建築予定時期',
  '家族構成',
  '要望・質問',
  '来場きっかけ',
  '来場目的',
]

export async function POST(request: Request) {
  try {
    // Webhook認証（オプション）
    const authHeader = request.headers.get('X-Formbridge-Signature')
    const webhookSecret = process.env.FORMBRIDGE_WEBHOOK_SECRET

    if (webhookSecret && authHeader !== webhookSecret) {
      console.warn('Formbridge webhook: 認証失敗')
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const payload: FormbridgePayload = await request.json()

    console.log('Formbridge webhook received:', JSON.stringify(payload, null, 2))

    if (!payload.record) {
      return NextResponse.json(
        { success: false, error: 'Invalid payload: record is missing' },
        { status: 400 }
      )
    }

    // フィールドをマッピング
    const customerData: Record<string, unknown> = {}
    const surveyData: Record<string, unknown> = {}

    for (const [fieldCode, field] of Object.entries(payload.record)) {
      const gforceField = FIELD_MAPPING[fieldCode]
      const value = field.value

      if (gforceField) {
        customerData[gforceField] = value
      }

      // アンケートフィールドはsurvey_dataにまとめる
      if (SURVEY_FIELDS.includes(fieldCode)) {
        surveyData[fieldCode] = value
      }
    }

    // アンケートデータを追加
    if (Object.keys(surveyData).length > 0) {
      customerData.survey_data = JSON.stringify(surveyData)
    }

    // 反響日を設定
    customerData.lead_date = payload.meta?.createdAt || new Date().toISOString()

    // 名前が必須
    if (!customerData.name) {
      customerData.name = '名前未設定（Formbridge）'
    }

    // パイプラインステータスを初期値に設定
    customerData.pipeline_status = 'new'

    // 既存顧客の検索（電話番号またはメールで照合）
    let existingCustomer = null
    const allCustomers = await customerDb.getAll()

    if (customerData.phone) {
      existingCustomer = allCustomers.find(
        (c) => c.phone === customerData.phone
      )
    }
    if (!existingCustomer && customerData.email) {
      existingCustomer = allCustomers.find(
        (c) => c.email === customerData.email
      )
    }

    let result

    if (existingCustomer) {
      // 既存顧客を更新
      result = await customerDb.update(existingCustomer.id, customerData)
      console.log('Formbridge: 既存顧客を更新', existingCustomer.id)
    } else {
      // 新規顧客を作成
      result = await customerDb.create(customerData as Parameters<typeof customerDb.create>[0])
      console.log('Formbridge: 新規顧客を作成', result.id)
    }

    // Webhook受信ログを保存
    logWebhookReceived({
      source: 'formbridge',
      appId: payload.app.id,
      appName: payload.app.name,
      customerId: result.id,
      isNew: !existingCustomer,
      receivedAt: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      customerId: result.id,
      isNew: !existingCustomer,
      message: existingCustomer ? '既存顧客を更新しました' : '新規顧客を作成しました',
    })
  } catch (error) {
    console.error('Formbridge webhook error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Webhook受信ログをローカルストレージに保存（サーバーサイドでは動作しないのでconsole.logで代用）
function logWebhookReceived(data: {
  source: string
  appId: string
  appName: string
  customerId: string
  isNew: boolean
  receivedAt: string
}) {
  console.log('Webhook log:', data)
  // TODO: データベースにログを保存する場合はここに実装
}

// GET: Webhookの設定確認用
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    message: 'Formbridge Webhook endpoint is ready',
    expectedFields: Object.keys(FIELD_MAPPING),
    surveyFields: SURVEY_FIELDS,
  })
}
