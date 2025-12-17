import { z } from 'zod'

// 電話番号の正規表現（ハイフンあり・なし両対応）
const phoneRegex = /^(0\d{1,4}-?\d{1,4}-?\d{4}|0\d{9,10})$/

// 郵便番号の正規表現
const postalCodeRegex = /^\d{3}-?\d{4}$/

export const customerSchema = z.object({
  // 基本情報（必須）
  name: z.string()
    .min(1, '顧客名は必須です')
    .max(50, '顧客名は50文字以内で入力してください'),

  name_kana: z.string()
    .max(100, 'フリガナは100文字以内で入力してください')
    .optional()
    .nullable(),

  tei_name: z.string()
    .max(50, '邸名は50文字以内で入力してください')
    .optional()
    .nullable(),

  // 配偶者情報
  partner_name: z.string()
    .max(50, '配偶者名は50文字以内で入力してください')
    .optional()
    .nullable(),

  partner_name_kana: z.string()
    .max(100, 'フリガナは100文字以内で入力してください')
    .optional()
    .nullable(),

  ownership_type: z.enum(['単独', '共有']).default('単独'),

  // 連絡先
  phone: z.string()
    .regex(phoneRegex, '電話番号の形式が正しくありません（例：090-1234-5678）')
    .optional()
    .nullable()
    .or(z.literal('')),

  phone2: z.string()
    .regex(phoneRegex, '電話番号の形式が正しくありません')
    .optional()
    .nullable()
    .or(z.literal('')),

  email: z.string()
    .email('メールアドレスの形式が正しくありません')
    .optional()
    .nullable()
    .or(z.literal('')),

  // 住所
  postal_code: z.string()
    .regex(postalCodeRegex, '郵便番号の形式が正しくありません（例：530-0001）')
    .optional()
    .nullable()
    .or(z.literal('')),

  address: z.string()
    .max(200, '住所は200文字以内で入力してください')
    .optional()
    .nullable(),

  // パイプライン
  pipeline_status: z.enum([
    '反響', 'イベント参加', '限定会員', '面談', '建築申込',
    '内定', 'ボツ', '他決', '契約', '着工', '引渡', '引渡済'
  ]).default('反響'),

  lead_source: z.enum([
    '資料請求', 'モデルハウス見学会予約', 'オーナー紹介', '社員紹介',
    '業者紹介', 'TEL問合せ', 'HP問合せ', 'Instagram', 'その他'
  ]).optional().nullable(),

  lead_date: z.string().optional().nullable(),

  // 物件情報
  land_area: z.number()
    .min(0, '土地面積は0以上で入力してください')
    .max(9999, '土地面積が大きすぎます')
    .optional()
    .nullable(),

  building_area: z.number()
    .min(0, '建物面積は0以上で入力してください')
    .max(9999, '建物面積が大きすぎます')
    .optional()
    .nullable(),

  // 金額
  estimated_amount: z.number()
    .min(0, '見込金額は0以上で入力してください')
    .optional()
    .nullable(),

  contract_amount: z.number()
    .min(0, '契約金額は0以上で入力してください')
    .optional()
    .nullable(),

  // 失注理由（ボツ・他決の場合は必須）
  lost_reason: z.string()
    .max(500, '失注理由は500文字以内で入力してください')
    .optional()
    .nullable(),

  notes: z.string()
    .max(2000, 'メモは2000文字以内で入力してください')
    .optional()
    .nullable(),
}).refine((data) => {
  // ボツ・他決の場合は失注理由が必須
  if ((data.pipeline_status === 'ボツ' || data.pipeline_status === '他決') && !data.lost_reason) {
    return false
  }
  return true
}, {
  message: 'ボツ・他決の場合は失注理由を入力してください',
  path: ['lost_reason'],
})

export type CustomerFormData = z.infer<typeof customerSchema>

// プラン依頼のバリデーション
export const planRequestSchema = z.object({
  customer_id: z.string().min(1, '顧客を選択してください'),

  land_address: z.string()
    .min(1, '土地住所は必須です')
    .max(200, '土地住所は200文字以内で入力してください'),

  land_area: z.number()
    .min(1, '土地面積は必須です')
    .max(9999, '土地面積が大きすぎます'),

  budget_min: z.number()
    .min(0, '予算下限は0以上で入力してください')
    .optional()
    .nullable(),

  budget_max: z.number()
    .min(0, '予算上限は0以上で入力してください')
    .optional()
    .nullable(),

  preferred_rooms: z.string()
    .max(50, '希望間取りは50文字以内で入力してください')
    .optional()
    .nullable(),

  preferred_style: z.string()
    .max(100, '希望スタイルは100文字以内で入力してください')
    .optional()
    .nullable(),

  request_details: z.string()
    .max(2000, '依頼内容は2000文字以内で入力してください')
    .optional()
    .nullable(),

  deadline: z.string().optional().nullable(),
}).refine((data) => {
  if (data.budget_min && data.budget_max && data.budget_min > data.budget_max) {
    return false
  }
  return true
}, {
  message: '予算下限は上限以下の金額を入力してください',
  path: ['budget_min'],
})

export type PlanRequestFormData = z.infer<typeof planRequestSchema>

// 契約書のバリデーション
export const contractSchema = z.object({
  customer_id: z.string().min(1, '顧客を選択してください'),

  contract_date: z.string().min(1, '契約日は必須です'),

  contract_amount: z.number()
    .min(1, '契約金額は必須です'),

  // 建物情報
  building_address: z.string()
    .min(1, '建築地住所は必須です')
    .max(200, '住所は200文字以内で入力してください'),

  building_area: z.number()
    .min(1, '建物面積は必須です'),

  land_area: z.number()
    .min(1, '土地面積は必須です'),

  // 工期
  start_date: z.string().min(1, '着工予定日は必須です'),
  completion_date: z.string().min(1, '完工予定日は必須です'),
}).refine((data) => {
  if (data.start_date && data.completion_date) {
    return new Date(data.start_date) < new Date(data.completion_date)
  }
  return true
}, {
  message: '着工予定日は完工予定日より前の日付を選択してください',
  path: ['start_date'],
})

export type ContractFormData = z.infer<typeof contractSchema>
