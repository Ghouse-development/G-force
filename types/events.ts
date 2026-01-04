// イベント予約管理の型定義

// モデルハウス（会場）
export interface ModelHouse {
  id: string
  name: string
  address: string
  capacity: number // デフォルト枠数
}

// 予約ステータス
export type BookingStatus =
  | '予約済'      // 予約完了
  | '確認済'      // 再確認完了
  | '参加'        // 当日参加
  | '不参加'      // 当日不参加（無断キャンセル）
  | 'キャンセル'  // 事前キャンセル

// 限定会員化ステータス
export type MemberConversionStatus =
  | '未確認'
  | '会員化'
  | '見送り'

// イベント（1日の1会場の1時間帯）
export interface Event {
  id: string
  date: string              // YYYY-MM-DD
  model_house_id: string
  model_house_name: string
  start_time: string        // HH:MM
  end_time: string          // HH:MM
  slots: number             // 枠数
  instructor_id: string | null
  instructor_name: string | null
  event_type: EventType
  notes: string | null
  created_at: string
  updated_at: string
}

// イベント種別
export type EventType =
  | 'MH見学会'
  | '構造見学会'
  | '完成見学会'
  | 'セミナー'
  | '相談会'
  | 'その他'

// 予約
export interface EventBooking {
  id: string
  event_id: string
  customer_id: string | null  // 既存顧客の場合
  customer_name: string
  customer_phone: string
  customer_email: string | null
  party_size: number          // 参加人数
  status: BookingStatus
  confirmed_at: string | null      // 再確認日時
  confirmed_by: string | null      // 再確認担当者
  attended_at: string | null       // 参加記録日時
  member_conversion: MemberConversionStatus
  converted_customer_id: string | null  // 限定会員化した場合の顧客ID
  notes: string | null
  created_at: string
  updated_at: string
}

// イベントのサマリー（一覧表示用）
export interface EventSummary {
  id: string
  date: string
  model_house_name: string
  start_time: string
  end_time: string
  event_type: EventType
  slots: number
  booked_count: number
  confirmed_count: number
  attended_count: number
  cancelled_count: number
  instructor_name: string | null
}

// 月間カレンダー用のデータ
export interface CalendarDay {
  date: string
  events: EventSummary[]
}

// イベント作成用
export interface CreateEventInput {
  date: string
  model_house_id: string
  start_time: string
  end_time: string
  slots: number
  instructor_id?: string
  event_type: EventType
  notes?: string
}

// 予約作成用
export interface CreateBookingInput {
  event_id: string
  customer_id?: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  party_size: number
  notes?: string
}

// 設定
export const EVENT_TYPE_CONFIG: Record<EventType, { label: string; color: string; bgColor: string }> = {
  'MH見学会': { label: 'MH見学会', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  '構造見学会': { label: '構造見学会', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  '完成見学会': { label: '完成見学会', color: 'text-green-700', bgColor: 'bg-green-100' },
  'セミナー': { label: 'セミナー', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  '相談会': { label: '相談会', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
  'その他': { label: 'その他', color: 'text-gray-700', bgColor: 'bg-gray-100' },
}

export const BOOKING_STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bgColor: string }> = {
  '予約済': { label: '予約済', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  '確認済': { label: '確認済', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  '参加': { label: '参加', color: 'text-green-700', bgColor: 'bg-green-100' },
  '不参加': { label: '不参加', color: 'text-red-700', bgColor: 'bg-red-100' },
  'キャンセル': { label: 'キャンセル', color: 'text-gray-700', bgColor: 'bg-gray-100' },
}

export const MEMBER_CONVERSION_CONFIG: Record<MemberConversionStatus, { label: string; color: string; bgColor: string }> = {
  '未確認': { label: '未確認', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  '会員化': { label: '会員化', color: 'text-green-700', bgColor: 'bg-green-100' },
  '見送り': { label: '見送り', color: 'text-orange-700', bgColor: 'bg-orange-100' },
}

// モデルハウス（会場）データ
export const MODEL_HOUSES: ModelHouse[] = [
  { id: 'mh-toyonaka', name: '豊中', address: '大阪府豊中市〇〇町', capacity: 4 },
  { id: 'mh-asahi', name: '旭区', address: '大阪市旭区〇〇町', capacity: 4 },
  { id: 'mh-nagaokakyo', name: '長岡京', address: '京都府長岡京市〇〇町', capacity: 4 },
  { id: 'mh-nishinomiya', name: '西宮', address: '兵庫県西宮市〇〇町', capacity: 4 },
]

// 時間枠
export const TIME_SLOTS = [
  { id: 'slot-1', start: '10:00', end: '12:00', label: '10:00〜' },
  { id: 'slot-2', start: '12:30', end: '14:30', label: '12:30〜' },
  { id: 'slot-3', start: '15:00', end: '17:00', label: '15:00〜' },
]

// 1枠あたりの定員
export const SLOT_CAPACITY = 4

// モック講師データ
export const INSTRUCTORS = [
  { id: 'inst-001', name: '田中 一郎' },
  { id: 'inst-002', name: '山田 花子' },
  { id: 'inst-003', name: '佐藤 健太' },
  { id: 'inst-004', name: '鈴木 美咲' },
]
