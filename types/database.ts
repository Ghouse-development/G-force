export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Enums
export type UserRole = 'admin' | 'manager' | 'staff'
export type Department = '営業部' | '設計部' | 'IC' | '工事部'
export type OwnershipType = '単独' | '共有'
export type DocumentStatus = 'draft' | 'submitted' | 'approved' | 'rejected'

// 顧客パイプラインステータス（反響→契約→引渡の全フロー）
export type PipelineStatus =
  | '反響'           // 初期反響
  | 'イベント参加'    // モデルハウス見学会など
  | '限定会員'        // 会員登録
  | '面談'           // 商談・打合せ
  | '建築申込'        // 申込済み
  | '内定'           // 契約予定
  | 'ボツ'           // 失注（自社都合）
  | '他決'           // 失注（他社決定）
  | '契約'           // 契約締結
  | '着工'           // 工事開始
  | '引渡'           // 完了
  | '引渡済'         // 期をまたいだ過去案件

// 反響経路（リードソース）
export type LeadSource =
  | '資料請求'
  | 'モデルハウス見学会予約'
  | 'オーナー紹介'
  | '社員紹介'
  | '業者紹介'
  | 'TEL問合せ'
  | 'HP問合せ'
  | 'Instagram'
  | 'その他'

// プラン依頼ステータス
export type PlanRequestStatus =
  | '依頼中'
  | '作成中'
  | '確認待ち'
  | '修正依頼'
  | '完了'

// 契約書ステータス
export type ContractStatus =
  | '作成中'
  | '確認中'
  | '承認待ち'
  | '締結済'

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          subdomain: string | null
          logo_url: string | null
          primary_color: string
          fiscal_year_start_month: number // 期首月（Gハウスは8）
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          subdomain?: string | null
          logo_url?: string | null
          primary_color?: string
          fiscal_year_start_month?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          subdomain?: string | null
          logo_url?: string | null
          primary_color?: string
          fiscal_year_start_month?: number
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          tenant_id: string | null
          email: string
          name: string
          phone: string | null
          department: Department | null
          role: UserRole
          is_active: boolean
          created_at: string
        }
        Insert: {
          id: string
          tenant_id?: string | null
          email: string
          name: string
          phone?: string | null
          department?: Department | null
          role?: UserRole
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string | null
          email?: string
          name?: string
          phone?: string | null
          department?: Department | null
          role?: UserRole
          is_active?: boolean
          created_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          tenant_id: string | null
          tei_name: string | null
          name: string
          name_kana: string | null
          partner_name: string | null
          partner_name_kana: string | null
          ownership_type: OwnershipType
          phone: string | null
          phone2: string | null
          email: string | null
          postal_code: string | null
          address: string | null
          // パイプライン管理
          pipeline_status: PipelineStatus
          lead_source: LeadSource | null
          lead_date: string | null // 反響日
          event_date: string | null // イベント参加日
          member_date: string | null // 会員登録日
          meeting_date: string | null // 面談日
          application_date: string | null // 建築申込日
          decision_date: string | null // 内定日
          contract_date: string | null // 契約日
          groundbreaking_date: string | null // 着工日
          handover_date: string | null // 引渡日（期の判定に使用）
          lost_date: string | null // ボツ・他決日
          lost_reason: string | null // 失注理由
          // 担当
          assigned_to: string | null
          sub_assigned_to: string | null // サブ担当
          // 物件情報
          land_area: number | null // 土地面積（坪）
          building_area: number | null // 建物面積（坪）
          product_id: string | null
          // 金額
          estimated_amount: number | null // 見込み金額
          contract_amount: number | null // 契約金額
          // その他
          notes: string | null
          kintone_record_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id?: string | null
          tei_name?: string | null
          name: string
          name_kana?: string | null
          partner_name?: string | null
          partner_name_kana?: string | null
          ownership_type?: OwnershipType
          phone?: string | null
          phone2?: string | null
          email?: string | null
          postal_code?: string | null
          address?: string | null
          pipeline_status?: PipelineStatus
          lead_source?: LeadSource | null
          lead_date?: string | null
          event_date?: string | null
          member_date?: string | null
          meeting_date?: string | null
          application_date?: string | null
          decision_date?: string | null
          contract_date?: string | null
          groundbreaking_date?: string | null
          handover_date?: string | null
          lost_date?: string | null
          lost_reason?: string | null
          assigned_to?: string | null
          sub_assigned_to?: string | null
          land_area?: number | null
          building_area?: number | null
          product_id?: string | null
          estimated_amount?: number | null
          contract_amount?: number | null
          notes?: string | null
          kintone_record_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string | null
          tei_name?: string | null
          name?: string
          name_kana?: string | null
          partner_name?: string | null
          partner_name_kana?: string | null
          ownership_type?: OwnershipType
          phone?: string | null
          phone2?: string | null
          email?: string | null
          postal_code?: string | null
          address?: string | null
          pipeline_status?: PipelineStatus
          lead_source?: LeadSource | null
          lead_date?: string | null
          event_date?: string | null
          member_date?: string | null
          meeting_date?: string | null
          application_date?: string | null
          decision_date?: string | null
          contract_date?: string | null
          groundbreaking_date?: string | null
          handover_date?: string | null
          lost_date?: string | null
          lost_reason?: string | null
          assigned_to?: string | null
          sub_assigned_to?: string | null
          land_area?: number | null
          building_area?: number | null
          product_id?: string | null
          estimated_amount?: number | null
          contract_amount?: number | null
          notes?: string | null
          kintone_record_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          tenant_id: string | null
          name: string
          price_per_tsubo: number | null
          base_price_per_tsubo: number | null
          is_active: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id?: string | null
          name: string
          price_per_tsubo?: number | null
          base_price_per_tsubo?: number | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string | null
          name?: string
          price_per_tsubo?: number | null
          base_price_per_tsubo?: number | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
      }
      // プラン依頼
      plan_requests: {
        Row: {
          id: string
          tenant_id: string | null
          customer_id: string
          requested_by: string | null // 依頼者（営業）
          assigned_to: string | null // 担当設計士
          status: PlanRequestStatus
          // 依頼内容
          land_address: string | null
          land_area: number | null
          request_details: string | null
          budget_min: number | null
          budget_max: number | null
          preferred_rooms: string | null
          preferred_style: string | null
          deadline: string | null
          // 添付ファイル
          attachments: Json | null
          // 完了情報
          completed_at: string | null
          plan_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id?: string | null
          customer_id: string
          requested_by?: string | null
          assigned_to?: string | null
          status?: PlanRequestStatus
          land_address?: string | null
          land_area?: number | null
          request_details?: string | null
          budget_min?: number | null
          budget_max?: number | null
          preferred_rooms?: string | null
          preferred_style?: string | null
          deadline?: string | null
          attachments?: Json | null
          completed_at?: string | null
          plan_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string | null
          customer_id?: string
          requested_by?: string | null
          assigned_to?: string | null
          status?: PlanRequestStatus
          land_address?: string | null
          land_area?: number | null
          request_details?: string | null
          budget_min?: number | null
          budget_max?: number | null
          preferred_rooms?: string | null
          preferred_style?: string | null
          deadline?: string | null
          attachments?: Json | null
          completed_at?: string | null
          plan_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // 資金計画書
      fund_plans: {
        Row: {
          id: string
          customer_id: string | null
          tenant_id: string | null
          product_id: string | null
          status: DocumentStatus
          version: number
          data: Json
          created_by: string | null
          approved_by: string | null
          approved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id?: string | null
          tenant_id?: string | null
          product_id?: string | null
          status?: DocumentStatus
          version?: number
          data?: Json
          created_by?: string | null
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string | null
          tenant_id?: string | null
          product_id?: string | null
          status?: DocumentStatus
          version?: number
          data?: Json
          created_by?: string | null
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // 契約書
      contracts: {
        Row: {
          id: string
          customer_id: string
          tenant_id: string | null
          fund_plan_id: string | null
          status: ContractStatus
          contract_number: string | null
          contract_date: string | null
          contract_amount: number | null
          // 契約内容
          data: Json
          // 承認フロー
          created_by: string | null
          checked_by: string | null
          approved_by: string | null
          approved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          tenant_id?: string | null
          fund_plan_id?: string | null
          status?: ContractStatus
          contract_number?: string | null
          contract_date?: string | null
          contract_amount?: number | null
          data?: Json
          created_by?: string | null
          checked_by?: string | null
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          tenant_id?: string | null
          fund_plan_id?: string | null
          status?: ContractStatus
          contract_number?: string | null
          contract_date?: string | null
          contract_amount?: number | null
          data?: Json
          created_by?: string | null
          checked_by?: string | null
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // 引継書
      handovers: {
        Row: {
          id: string
          customer_id: string
          tenant_id: string | null
          contract_id: string | null
          from_user_id: string | null // 引継ぎ元（営業）
          to_user_id: string | null // 引継ぎ先（工事）
          status: DocumentStatus
          // 引継ぎ内容
          customer_notes: string | null // お客様情報
          site_notes: string | null // 現場情報
          schedule_notes: string | null // スケジュール
          special_notes: string | null // 特記事項
          checklist: Json | null // チェックリスト
          // 確認
          confirmed_by: string | null
          confirmed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          tenant_id?: string | null
          contract_id?: string | null
          from_user_id?: string | null
          to_user_id?: string | null
          status?: DocumentStatus
          customer_notes?: string | null
          site_notes?: string | null
          schedule_notes?: string | null
          special_notes?: string | null
          checklist?: Json | null
          confirmed_by?: string | null
          confirmed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          tenant_id?: string | null
          contract_id?: string | null
          from_user_id?: string | null
          to_user_id?: string | null
          status?: DocumentStatus
          customer_notes?: string | null
          site_notes?: string | null
          schedule_notes?: string | null
          special_notes?: string | null
          checklist?: Json | null
          confirmed_by?: string | null
          confirmed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // 活動履歴（顧客とのやりとり記録）
      activities: {
        Row: {
          id: string
          customer_id: string
          tenant_id: string | null
          user_id: string | null
          activity_type: string // 電話、メール、来店、訪問など
          title: string
          description: string | null
          activity_date: string
          next_action: string | null
          next_action_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          tenant_id?: string | null
          user_id?: string | null
          activity_type: string
          title: string
          description?: string | null
          activity_date: string
          next_action?: string | null
          next_action_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          tenant_id?: string | null
          user_id?: string | null
          activity_type?: string
          title?: string
          description?: string | null
          activity_date?: string
          next_action?: string | null
          next_action_date?: string | null
          created_at?: string
        }
      }
      // 営業目標
      sales_targets: {
        Row: {
          id: string
          tenant_id: string | null
          user_id: string | null
          fiscal_year: number // 期（例：2024期は2024年8月〜2025年7月）
          month: number // 1-12
          target_leads: number // 反響目標
          target_meetings: number // 面談目標
          target_applications: number // 申込目標
          target_contracts: number // 契約目標
          target_amount: number // 金額目標
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id?: string | null
          user_id?: string | null
          fiscal_year: number
          month: number
          target_leads?: number
          target_meetings?: number
          target_applications?: number
          target_contracts?: number
          target_amount?: number
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string | null
          user_id?: string | null
          fiscal_year?: number
          month?: number
          target_leads?: number
          target_meetings?: number
          target_applications?: number
          target_contracts?: number
          target_amount?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Convenience types
export type Tenant = Tables<'tenants'>
export type User = Tables<'users'>
export type Customer = Tables<'customers'>
export type Product = Tables<'products'>
export type PlanRequest = Tables<'plan_requests'>
export type FundPlan = Tables<'fund_plans'>
export type Contract = Tables<'contracts'>
export type Handover = Tables<'handovers'>
export type Activity = Tables<'activities'>
export type SalesTarget = Tables<'sales_targets'>

// パイプライン順序（遷移率計算用）
export const PIPELINE_ORDER: PipelineStatus[] = [
  '反響',
  'イベント参加',
  '限定会員',
  '面談',
  '建築申込',
  '内定',
  '契約',
  '着工',
  '引渡',
  '引渡済',
]

export const PIPELINE_LOST: PipelineStatus[] = ['ボツ', '他決']

// パイプラインステータスの表示設定
export const PIPELINE_CONFIG: Record<PipelineStatus, { label: string; color: string; bgColor: string }> = {
  '反響': { label: '反響', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  'イベント参加': { label: 'イベント', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  '限定会員': { label: '限定会員', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  '面談': { label: '面談', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
  '建築申込': { label: '申込', color: 'text-teal-700', bgColor: 'bg-teal-100' },
  '内定': { label: '内定', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  'ボツ': { label: 'ボツ', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  '他決': { label: '他決', color: 'text-red-700', bgColor: 'bg-red-100' },
  '契約': { label: '契約', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  '着工': { label: '着工', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  '引渡': { label: '引渡', color: 'text-green-700', bgColor: 'bg-green-100' },
  '引渡済': { label: '引渡済', color: 'text-gray-500', bgColor: 'bg-gray-50' },
}

// 反響経路の表示設定
export const LEAD_SOURCE_CONFIG: Record<LeadSource, { label: string; icon: string }> = {
  '資料請求': { label: '資料請求', icon: 'FileText' },
  'モデルハウス見学会予約': { label: 'MH予約', icon: 'Home' },
  'オーナー紹介': { label: 'OB紹介', icon: 'Users' },
  '社員紹介': { label: '社員紹介', icon: 'UserPlus' },
  '業者紹介': { label: '業者紹介', icon: 'Building' },
  'TEL問合せ': { label: 'TEL', icon: 'Phone' },
  'HP問合せ': { label: 'HP', icon: 'Globe' },
  'Instagram': { label: 'Insta', icon: 'Instagram' },
  'その他': { label: 'その他', icon: 'MoreHorizontal' },
}

// 期（Fiscal Year）ヘルパー関数
export function getFiscalYear(date: Date, fiscalStartMonth: number = 8): number {
  const month = date.getMonth() + 1 // 0-indexed to 1-indexed
  const year = date.getFullYear()

  // 期首月より前なら前年度
  if (month < fiscalStartMonth) {
    return year - 1
  }
  return year
}

export function getFiscalYearRange(fiscalYear: number, fiscalStartMonth: number = 8): { start: string; end: string } {
  const startDate = new Date(fiscalYear, fiscalStartMonth - 1, 1) // 期首
  const endDate = new Date(fiscalYear + 1, fiscalStartMonth - 1, 0) // 期末（翌年の期首月の前日）
  return {
    start: `${startDate.getFullYear()}/${startDate.getMonth() + 1}/${startDate.getDate()}`,
    end: `${endDate.getFullYear()}/${endDate.getMonth() + 1}/${endDate.getDate()}`,
  }
}

// 現在の期を取得
export function getCurrentFiscalYear(fiscalStartMonth: number = 8): number {
  return getFiscalYear(new Date(), fiscalStartMonth)
}
