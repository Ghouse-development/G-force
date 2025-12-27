export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Enums
export type UserRole =
  | 'sales'               // 営業
  | 'sales_leader'        // 営業リーダー
  | 'sales_office'        // 営業事務
  | 'design_manager'      // 設計部門長
  | 'construction_manager' // 工事部門長
  | 'design'              // 設計
  | 'cad'                 // CAD担当
  | 'ic'                  // IC
  | 'supervisor'          // 現場監督
  | 'exterior'            // 外構担当
  | 'admin'               // 本部/管理者

export type Department = '営業部' | '営業事務部' | '設計部' | 'IC' | '工事部' | '本部'

// ノーコード基盤のフィールドタイプ
export type FieldType =
  | 'text'           // テキスト
  | 'number'         // 数値
  | 'currency'       // 金額
  | 'date'           // 日付
  | 'datetime'       // 日時
  | 'select'         // 単一選択
  | 'multiselect'    // 複数選択
  | 'checkbox'       // チェックボックス
  | 'textarea'       // テキストエリア
  | 'file'           // ファイル
  | 'calculated'     // 計算フィールド
  | 'reference'      // 他テーブル参照
  | 'user'           // ユーザー参照
  | 'section'        // セクション（グループ化用）

// ワークフローステップタイプ
export type WorkflowStepType =
  | 'approval'           // 単一承認
  | 'parallel_approval'  // 並列承認
  | 'revision'           // 修正
  | 'notify'             // 通知
  | 'auto'               // 自動処理

// ワークフロー担当者タイプ
export type WorkflowAssigneeType =
  | 'role'     // ロール（sales_leader等）
  | 'user'     // 特定ユーザー
  | 'creator'  // 作成者
  | 'field'    // フィールド値から参照

// ワークフローインスタンスステータス
export type WorkflowInstanceStatus =
  | 'pending'     // 待機中
  | 'in_progress' // 進行中
  | 'completed'   // 完了
  | 'rejected'    // 却下
  | 'cancelled'   // キャンセル

// 契約依頼ステータス
export type ContractRequestStatus =
  | 'draft'              // 下書き
  | 'pending_leader'     // 営業リーダー確認待ち
  | 'pending_managers'   // 設計・工事部門長確認待ち
  | 'revision'           // 修正中
  | 'approved'           // 承認完了
  | 'rejected'           // 却下

// プラン依頼競合結果
export type CompetitorResult =
  | 'pending'   // 未確定
  | 'won'       // 勝ち
  | 'lost'      // 負け
export type OwnershipType = '単独' | '共有'
export type DocumentStatus = 'draft' | 'submitted' | 'approved' | 'rejected'

// 顧客パイプラインステータス

// 限定会員前顧客
export type PreMemberStatus =
  | '資料請求'        // 資料請求
  | 'イベント予約'     // イベント予約
  | 'イベント参加'     // イベント参加（非会員）

// 契約前顧客
export type PreContractStatus =
  | '限定会員'        // 会員登録
  | '面談'           // 商談・打合せ
  | '建築申込'        // 申込済み
  | 'プラン提出'      // プラン提出
  | '内定'           // 契約予定
  | 'ボツ・他決'      // 失注（ボツ・他決統合）

// 契約後顧客
export type PostContractStatus =
  | '変更契約前'      // 変更契約前
  | '変更契約後'      // 変更契約後

// オーナー
export type OwnerStatus =
  | 'オーナー'        // 引き渡し後

// 全ステータス統合型
export type PipelineStatus =
  | PreMemberStatus
  | PreContractStatus
  | PostContractStatus
  | OwnerStatus

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

// プラン依頼ステータス（詳細ワークフロー）
export type PlanRequestStatus =
  | '新規依頼'       // 営業から依頼が来た
  | '役調依頼中'     // 役所調査を依頼中
  | '役調完了'       // 役所調査完了、チェック待ち
  | 'チェック待ち'   // 役調チェック待ち
  | '設計割り振り'   // 設計事務所割り振り完了
  | '設計中'         // プラン作成中
  | 'プレゼン作成中' // パース・プレゼン作成中
  | '確認待ち'       // 営業確認待ち
  | '修正依頼'       // 修正が必要
  | '完了'           // 完了

// 役所調査タイプ
export type InvestigationType = 'ネット/TEL調査' | '役所往訪'

// 仕上がりタイプ
export type DeliverableType = '手描きラフ' | 'プレゼン（パース外観のみ）' | 'プレゼン（パース有）' | '契約図'

// 施工エリア
export type ConstructionArea = 'Gハウス施工' | 'ファブレス施工'

// 土地の状況（プラン依頼用）
export type LandStatus = 'お客様所有' | '契約済（決済前）' | '買付提出済'

// =============================================
// カスタマージャーニー（顧客行動履歴）
// =============================================

// 顧客の土地状況
export type CustomerLandStatus =
  | '土地あり'         // 自己所有または親族所有
  | '土地探し中'       // 土地を探している
  | '土地契約済'       // 土地の売買契約済（決済前）
  | '土地決済済'       // 土地の決済完了

// カスタマージャーニーイベント種別
export type JourneyEventType =
  // === 初期接触 ===
  | '資料請求'              // 資料請求
  | 'HP問合せ'              // ホームページからの問合せ
  | 'TEL問合せ'             // 電話での問合せ
  | 'Instagram問合せ'       // Instagram経由
  // === イベント参加 ===
  | 'MH見学会予約'          // モデルハウス見学説明会予約
  | 'MH見学会参加'          // モデルハウス見学説明会参加
  | '構造見学会予約'        // 構造見学会予約
  | '構造見学会参加'        // 構造見学会参加
  | 'OB見学会予約'          // オーナーズハウス見学会予約
  | 'OB見学会参加'          // オーナーズハウス見学会参加
  | '完成見学会予約'        // 完成見学会予約
  | '完成見学会参加'        // 完成見学会参加
  // === 商談・面談 ===
  | '初回面談'              // 初回の面談
  | '面談'                  // 2回目以降の面談
  | 'オンライン面談'        // オンラインでの面談
  | '電話フォロー'          // 電話でのフォローアップ
  // === 土地関連 ===
  | '土地紹介'              // 土地情報の紹介
  | '土地案内'              // 土地への案内・現地確認
  | '土地決定'              // 土地の決定
  // === 契約プロセス ===
  | '限定会員登録'          // 限定会員への登録
  | 'プラン提案'            // プラン提案
  | '見積提示'              // 見積もりの提示
  | '資金計画提示'          // 資金計画書の提示
  | '建築申込'              // 建築申込書の受領
  | '内定'                  // 契約内定
  | '契約'                  // 請負契約締結
  // === 着工後 ===
  | '着工'                  // 着工
  | '上棟'                  // 上棟
  | '引渡'                  // 引渡完了
  // === その他 ===
  | '紹介受領'              // OB・業者からの紹介
  | 'その他'                // その他のイベント

// ジャーニーイベントのカテゴリ
export type JourneyEventCategory =
  | '初期接触'
  | 'イベント'
  | '商談'
  | '土地'
  | '契約プロセス'
  | '着工後'
  | 'その他'

// イベント種別の設定
export const JOURNEY_EVENT_CONFIG: Record<JourneyEventType, {
  label: string
  category: JourneyEventCategory
  icon: string
  color: string
  bgColor: string
  order: number  // 契約への近さ（大きいほど契約に近い）
  isKeyMilestone: boolean  // 重要マイルストーン
}> = {
  // 初期接触
  '資料請求': { label: '資料請求', category: '初期接触', icon: 'FileText', color: 'text-slate-600', bgColor: 'bg-slate-100', order: 10, isKeyMilestone: false },
  'HP問合せ': { label: 'HP問合せ', category: '初期接触', icon: 'Globe', color: 'text-blue-600', bgColor: 'bg-blue-100', order: 10, isKeyMilestone: false },
  'TEL問合せ': { label: 'TEL問合せ', category: '初期接触', icon: 'Phone', color: 'text-green-600', bgColor: 'bg-green-100', order: 10, isKeyMilestone: false },
  'Instagram問合せ': { label: 'Instagram', category: '初期接触', icon: 'Instagram', color: 'text-pink-600', bgColor: 'bg-pink-100', order: 10, isKeyMilestone: false },
  // イベント
  'MH見学会予約': { label: 'MH予約', category: 'イベント', icon: 'CalendarCheck', color: 'text-purple-600', bgColor: 'bg-purple-100', order: 20, isKeyMilestone: false },
  'MH見学会参加': { label: 'MH参加', category: 'イベント', icon: 'Home', color: 'text-purple-700', bgColor: 'bg-purple-200', order: 25, isKeyMilestone: true },
  '構造見学会予約': { label: '構造予約', category: 'イベント', icon: 'CalendarCheck', color: 'text-amber-600', bgColor: 'bg-amber-100', order: 30, isKeyMilestone: false },
  '構造見学会参加': { label: '構造参加', category: 'イベント', icon: 'Hammer', color: 'text-amber-700', bgColor: 'bg-amber-200', order: 35, isKeyMilestone: true },
  'OB見学会予約': { label: 'OB予約', category: 'イベント', icon: 'CalendarCheck', color: 'text-teal-600', bgColor: 'bg-teal-100', order: 40, isKeyMilestone: false },
  'OB見学会参加': { label: 'OB参加', category: 'イベント', icon: 'Users', color: 'text-teal-700', bgColor: 'bg-teal-200', order: 45, isKeyMilestone: true },
  '完成見学会予約': { label: '完成予約', category: 'イベント', icon: 'CalendarCheck', color: 'text-cyan-600', bgColor: 'bg-cyan-100', order: 42, isKeyMilestone: false },
  '完成見学会参加': { label: '完成参加', category: 'イベント', icon: 'Building', color: 'text-cyan-700', bgColor: 'bg-cyan-200', order: 47, isKeyMilestone: true },
  // 商談
  '初回面談': { label: '初回面談', category: '商談', icon: 'MessageSquare', color: 'text-indigo-600', bgColor: 'bg-indigo-100', order: 50, isKeyMilestone: true },
  '面談': { label: '面談', category: '商談', icon: 'MessageCircle', color: 'text-indigo-500', bgColor: 'bg-indigo-50', order: 55, isKeyMilestone: false },
  'オンライン面談': { label: 'オンライン', category: '商談', icon: 'Video', color: 'text-indigo-400', bgColor: 'bg-indigo-50', order: 53, isKeyMilestone: false },
  '電話フォロー': { label: 'TELフォロー', category: '商談', icon: 'PhoneCall', color: 'text-gray-500', bgColor: 'bg-gray-100', order: 52, isKeyMilestone: false },
  // 土地
  '土地紹介': { label: '土地紹介', category: '土地', icon: 'MapPin', color: 'text-lime-600', bgColor: 'bg-lime-100', order: 60, isKeyMilestone: false },
  '土地案内': { label: '土地案内', category: '土地', icon: 'Navigation', color: 'text-lime-700', bgColor: 'bg-lime-200', order: 65, isKeyMilestone: true },
  '土地決定': { label: '土地決定', category: '土地', icon: 'MapPinned', color: 'text-green-700', bgColor: 'bg-green-200', order: 70, isKeyMilestone: true },
  // 契約プロセス
  '限定会員登録': { label: '会員登録', category: '契約プロセス', icon: 'UserPlus', color: 'text-sky-600', bgColor: 'bg-sky-100', order: 48, isKeyMilestone: true },
  'プラン提案': { label: 'プラン提案', category: '契約プロセス', icon: 'FileImage', color: 'text-orange-600', bgColor: 'bg-orange-100', order: 75, isKeyMilestone: true },
  '見積提示': { label: '見積提示', category: '契約プロセス', icon: 'Calculator', color: 'text-orange-700', bgColor: 'bg-orange-200', order: 78, isKeyMilestone: false },
  '資金計画提示': { label: '資金計画', category: '契約プロセス', icon: 'Wallet', color: 'text-yellow-700', bgColor: 'bg-yellow-200', order: 80, isKeyMilestone: true },
  '建築申込': { label: '建築申込', category: '契約プロセス', icon: 'FileSignature', color: 'text-red-600', bgColor: 'bg-red-100', order: 85, isKeyMilestone: true },
  '内定': { label: '内定', category: '契約プロセス', icon: 'Award', color: 'text-red-700', bgColor: 'bg-red-200', order: 90, isKeyMilestone: true },
  '契約': { label: '契約', category: '契約プロセス', icon: 'CheckCircle2', color: 'text-emerald-700', bgColor: 'bg-emerald-200', order: 100, isKeyMilestone: true },
  // 着工後
  '着工': { label: '着工', category: '着工後', icon: 'Hammer', color: 'text-blue-700', bgColor: 'bg-blue-200', order: 110, isKeyMilestone: true },
  '上棟': { label: '上棟', category: '着工後', icon: 'Building2', color: 'text-blue-800', bgColor: 'bg-blue-300', order: 120, isKeyMilestone: true },
  '引渡': { label: '引渡', category: '着工後', icon: 'Key', color: 'text-green-800', bgColor: 'bg-green-300', order: 130, isKeyMilestone: true },
  // その他
  '紹介受領': { label: '紹介', category: 'その他', icon: 'UserCheck', color: 'text-pink-600', bgColor: 'bg-pink-100', order: 5, isKeyMilestone: false },
  'その他': { label: 'その他', category: 'その他', icon: 'MoreHorizontal', color: 'text-gray-500', bgColor: 'bg-gray-100', order: 0, isKeyMilestone: false },
}

// 土地状況の設定
export const CUSTOMER_LAND_STATUS_CONFIG: Record<CustomerLandStatus, {
  label: string
  icon: string
  color: string
  bgColor: string
  description: string
}> = {
  '土地あり': {
    label: '土地あり',
    icon: 'CheckCircle',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    description: '自己所有または親族所有の土地がある',
  },
  '土地探し中': {
    label: '土地探し中',
    icon: 'Search',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    description: '土地を探している',
  },
  '土地契約済': {
    label: '土地契約済',
    icon: 'FileCheck',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    description: '土地の売買契約済（決済前）',
  },
  '土地決済済': {
    label: '土地決済済',
    icon: 'BadgeCheck',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100',
    description: '土地の決済完了',
  },
}

// カスタマージャーニーイベント
export interface CustomerJourneyEvent {
  id: string
  customer_id: string
  event_type: JourneyEventType
  event_date: string
  event_time?: string  // 時刻（オプション）
  location?: string    // 場所（MH名など）
  staff_id?: string    // 対応スタッフ
  staff_name?: string  // 対応スタッフ名
  notes?: string       // メモ
  outcome?: string     // 結果・感触（良好/普通/要フォロー）
  next_action?: string // 次のアクション
  next_action_date?: string // 次アクション予定日
  created_at: string
  updated_at: string
}

// 顧客ジャーニーサマリー（分析用）
export interface CustomerJourneySummary {
  customer_id: string
  first_contact_date: string       // 初回接触日
  first_contact_type: JourneyEventType  // 初回接触種別
  land_status: CustomerLandStatus  // 土地状況
  total_events: number             // 総イベント数
  total_meetings: number           // 面談回数
  total_site_visits: number        // 見学会参加回数
  days_to_member?: number          // 初回接触→会員登録までの日数
  days_to_application?: number     // 初回接触→申込までの日数
  days_to_contract?: number        // 初回接触→契約までの日数
  current_stage: PipelineStatus    // 現在のステージ
  journey_path: JourneyEventType[] // 経路（イベント種別の配列）
  conversion_probability?: number  // AI算出の契約確率
  recommended_action?: string      // AI推奨アクション
}

// 設計事務所
export type DesignOffice =
  | 'ラリーケー'
  | 'ライフプラス'
  | 'Nデザイン'
  | 'L&A'
  | 'JIN'
  | 'その他'

// 契約書ステータス（kintone承認フロー準拠）
export type ContractStatus =
  | '作成中'       // 初期状態：営業が作成
  | '書類確認'     // 書類確認者が確認中
  | '上長承認待ち'  // 上長の承認待ち
  | '契約完了'     // 承認済み・契約完了

// 契約書アクション
export type ContractAction =
  | '承認申請'     // 作成中 → 書類確認
  | '承認'         // 各ステータスの承認
  | '差戻し'       // 前のステータスに戻す
  | '保存'         // 一時保存

// 支払い条件タイプ
export type PaymentTermType =
  | '契約時'
  | '着工時'
  | '上棟時'
  | '完了時'
  | 'その他'

// 本人確認書類タイプ
export type IdentityDocType =
  | '免許証'
  | 'パスポート'
  | 'マイナンバーカード'
  | '住民票'
  | 'その他'

// ローンタイプ
export type LoanType =
  | '銀行ローン'
  | 'フラット35'
  | '自己資金'
  | 'その他'

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
      // プラン依頼（拡張版）
      plan_requests: {
        Row: {
          id: string
          tenant_id: string | null
          customer_id: string
          tei_name: string | null // 邸名
          customer_name: string | null // 顧客名
          partner_name: string | null // 共有者名
          ownership_type: OwnershipType // 名義
          requested_by: string | null // 依頼者（営業）
          assigned_to: string | null // 担当設計士
          designer_name: string | null // 設計担当者名
          presenter_name: string | null // プレゼン担当者名
          design_office: DesignOffice | null // 設計事務所
          status: PlanRequestStatus
          // 日程
          proposal_date: string | null // 提案日
          contract_date: string | null // 契約日
          deadline: string | null // 依頼期限
          investigation_deadline: string | null // 役調期限
          // 商品・仕上がり
          product_name: string | null // 商品名（LIFE+, Limited等）
          deliverable_type: DeliverableType | null // 仕上がり
          // 土地情報
          land_address: string | null // 建築地住所
          land_lot_number: string | null // 地番/号地
          land_area: number | null // 土地面積（坪）
          building_area: number | null // 施工面積（坪）
          floors: number | null // 階数
          land_status: LandStatus | null // 土地の状況
          construction_area: ConstructionArea | null // 施工対応エリア
          land_marked: boolean // 計画土地赤枠済
          // 調査関連
          investigation_type: InvestigationType | null // 役所調査タイプ
          water_survey_needed: boolean // 水道調査
          demolition_needed: boolean // 解体必要
          land_development_needed: boolean // 宅地造成必要
          // 競合
          has_competitor: boolean // 競合有無
          competitor_name: string | null // 競合先
          // 世帯
          household_type: string | null // 世帯数（単一世帯/二世帯等）
          // 希望条件
          preferred_rooms: string | null
          preferred_style: string | null
          budget_min: number | null
          budget_max: number | null
          // 備考・詳細
          request_details: string | null // 依頼詳細
          notes: string | null // 備考
          // ファイル関連
          photo_date: string | null // 写真撮影日
          hearing_sheet_date: string | null // ヒアリングシート日
          attachments: Json | null // 添付ファイル
          drive_folder_url: string | null // Googleドライブフォルダ
          // 役調関連
          investigation_notes: string | null // 役調備考
          investigation_completed_at: string | null // 役調完了日
          investigation_pdf_url: string | null // 役調書PDF
          // 完了情報
          completed_at: string | null
          plan_url: string | null
          presentation_url: string | null // プレゼンURL
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id?: string | null
          customer_id: string
          tei_name?: string | null
          customer_name?: string | null
          partner_name?: string | null
          ownership_type?: OwnershipType
          requested_by?: string | null
          assigned_to?: string | null
          designer_name?: string | null
          presenter_name?: string | null
          design_office?: DesignOffice | null
          status?: PlanRequestStatus
          proposal_date?: string | null
          contract_date?: string | null
          deadline?: string | null
          investigation_deadline?: string | null
          product_name?: string | null
          deliverable_type?: DeliverableType | null
          land_address?: string | null
          land_lot_number?: string | null
          land_area?: number | null
          building_area?: number | null
          floors?: number | null
          land_status?: LandStatus | null
          construction_area?: ConstructionArea | null
          land_marked?: boolean
          investigation_type?: InvestigationType | null
          water_survey_needed?: boolean
          demolition_needed?: boolean
          land_development_needed?: boolean
          has_competitor?: boolean
          competitor_name?: string | null
          household_type?: string | null
          preferred_rooms?: string | null
          preferred_style?: string | null
          budget_min?: number | null
          budget_max?: number | null
          request_details?: string | null
          notes?: string | null
          photo_date?: string | null
          hearing_sheet_date?: string | null
          attachments?: Json | null
          drive_folder_url?: string | null
          investigation_notes?: string | null
          investigation_completed_at?: string | null
          investigation_pdf_url?: string | null
          completed_at?: string | null
          plan_url?: string | null
          presentation_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string | null
          customer_id?: string
          tei_name?: string | null
          customer_name?: string | null
          partner_name?: string | null
          ownership_type?: OwnershipType
          requested_by?: string | null
          assigned_to?: string | null
          designer_name?: string | null
          presenter_name?: string | null
          design_office?: DesignOffice | null
          status?: PlanRequestStatus
          proposal_date?: string | null
          contract_date?: string | null
          deadline?: string | null
          investigation_deadline?: string | null
          product_name?: string | null
          deliverable_type?: DeliverableType | null
          land_address?: string | null
          land_lot_number?: string | null
          land_area?: number | null
          building_area?: number | null
          floors?: number | null
          land_status?: LandStatus | null
          construction_area?: ConstructionArea | null
          land_marked?: boolean
          investigation_type?: InvestigationType | null
          water_survey_needed?: boolean
          demolition_needed?: boolean
          land_development_needed?: boolean
          has_competitor?: boolean
          competitor_name?: string | null
          household_type?: string | null
          preferred_rooms?: string | null
          preferred_style?: string | null
          budget_min?: number | null
          budget_max?: number | null
          request_details?: string | null
          notes?: string | null
          photo_date?: string | null
          hearing_sheet_date?: string | null
          attachments?: Json | null
          drive_folder_url?: string | null
          investigation_notes?: string | null
          investigation_completed_at?: string | null
          investigation_pdf_url?: string | null
          completed_at?: string | null
          plan_url?: string | null
          presentation_url?: string | null
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
      // 契約書（kintone承認フロー対応）
      contracts: {
        Row: {
          id: string
          customer_id: string
          tenant_id: string | null
          fund_plan_id: string | null
          status: ContractStatus
          contract_number: string | null
          // === 基本情報 ===
          contract_date: string | null // 契約日
          tei_name: string | null // 邸名
          customer_name: string | null // お客様名
          partner_name: string | null // 共有者名
          ownership_type: OwnershipType // 名義
          // === 受注情報 ===
          sales_person: string | null // 営業担当
          design_person: string | null // 設計担当
          construction_person: string | null // 工事担当
          ic_person: string | null // IC担当
          // === 物件情報 ===
          land_address: string | null // 建築地住所
          land_area: number | null // 土地面積（坪）
          building_area: number | null // 建物面積（坪）
          product_name: string | null // 商品名
          // === 見積・金額情報 ===
          building_price: number | null // 建物本体価格
          option_price: number | null // オプション価格
          exterior_price: number | null // 外構価格
          other_price: number | null // その他費用
          discount_amount: number | null // 値引額
          tax_amount: number | null // 消費税
          total_amount: number | null // 合計金額
          // === 支払い条件 ===
          payment_at_contract: number | null // 契約時金
          payment_at_start: number | null // 着工時金
          payment_at_frame: number | null // 上棟時金
          payment_at_completion: number | null // 完了時金
          // === 本人確認 ===
          identity_verified: boolean // 本人確認済
          identity_doc_type: string | null // 本人確認書類種類
          identity_verified_date: string | null // 確認日
          identity_verified_by: string | null // 確認者
          // === 住宅ローン関連 ===
          loan_type: string | null // ローン種類
          loan_bank: string | null // 金融機関名
          loan_amount: number | null // 借入額
          loan_approved: boolean // ローン承認済
          loan_approved_date: string | null // ローン承認日
          // === 重要事項 ===
          important_notes: string | null // 重要事項説明済
          important_notes_date: string | null // 説明日
          // === 添付ファイル ===
          attachments: Json | null // 添付ファイル情報
          // === 承認フロー ===
          created_by: string | null // 作成者
          created_by_name: string | null // 作成者名
          // 書類確認
          checked_by: string | null // 書類確認者
          checked_by_name: string | null // 書類確認者名
          checked_at: string | null // 確認日時
          check_comment: string | null // 確認コメント
          // 上長承認
          approved_by: string | null // 承認者
          approved_by_name: string | null // 承認者名
          approved_at: string | null // 承認日時
          approval_comment: string | null // 承認コメント
          // 差戻し情報
          returned_by: string | null // 差戻し者
          returned_by_name: string | null // 差戻し者名
          returned_at: string | null // 差戻し日時
          return_comment: string | null // 差戻しコメント
          return_count: number // 差戻し回数
          // === 履歴 ===
          history: Json | null // ステータス変更履歴
          // === その他 ===
          notes: string | null // 備考
          kintone_record_id: string | null // kintoneレコードID
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
          tei_name?: string | null
          customer_name?: string | null
          partner_name?: string | null
          ownership_type?: OwnershipType
          sales_person?: string | null
          design_person?: string | null
          construction_person?: string | null
          ic_person?: string | null
          land_address?: string | null
          land_area?: number | null
          building_area?: number | null
          product_name?: string | null
          building_price?: number | null
          option_price?: number | null
          exterior_price?: number | null
          other_price?: number | null
          discount_amount?: number | null
          tax_amount?: number | null
          total_amount?: number | null
          payment_at_contract?: number | null
          payment_at_start?: number | null
          payment_at_frame?: number | null
          payment_at_completion?: number | null
          identity_verified?: boolean
          identity_doc_type?: string | null
          identity_verified_date?: string | null
          identity_verified_by?: string | null
          loan_type?: string | null
          loan_bank?: string | null
          loan_amount?: number | null
          loan_approved?: boolean
          loan_approved_date?: string | null
          important_notes?: string | null
          important_notes_date?: string | null
          attachments?: Json | null
          created_by?: string | null
          created_by_name?: string | null
          checked_by?: string | null
          checked_by_name?: string | null
          checked_at?: string | null
          check_comment?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          approved_at?: string | null
          approval_comment?: string | null
          returned_by?: string | null
          returned_by_name?: string | null
          returned_at?: string | null
          return_comment?: string | null
          return_count?: number
          history?: Json | null
          notes?: string | null
          kintone_record_id?: string | null
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
          tei_name?: string | null
          customer_name?: string | null
          partner_name?: string | null
          ownership_type?: OwnershipType
          sales_person?: string | null
          design_person?: string | null
          construction_person?: string | null
          ic_person?: string | null
          land_address?: string | null
          land_area?: number | null
          building_area?: number | null
          product_name?: string | null
          building_price?: number | null
          option_price?: number | null
          exterior_price?: number | null
          other_price?: number | null
          discount_amount?: number | null
          tax_amount?: number | null
          total_amount?: number | null
          payment_at_contract?: number | null
          payment_at_start?: number | null
          payment_at_frame?: number | null
          payment_at_completion?: number | null
          identity_verified?: boolean
          identity_doc_type?: string | null
          identity_verified_date?: string | null
          identity_verified_by?: string | null
          loan_type?: string | null
          loan_bank?: string | null
          loan_amount?: number | null
          loan_approved?: boolean
          loan_approved_date?: string | null
          important_notes?: string | null
          important_notes_date?: string | null
          attachments?: Json | null
          created_by?: string | null
          created_by_name?: string | null
          checked_by?: string | null
          checked_by_name?: string | null
          checked_at?: string | null
          check_comment?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          approved_at?: string | null
          approval_comment?: string | null
          returned_by?: string | null
          returned_by_name?: string | null
          returned_at?: string | null
          return_comment?: string | null
          return_count?: number
          history?: Json | null
          notes?: string | null
          kintone_record_id?: string | null
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

// 限定会員前顧客のステータス順序
export const PRE_MEMBER_STATUS_ORDER: PreMemberStatus[] = [
  '資料請求',
  'イベント予約',
  'イベント参加',
]

// 契約前顧客のステータス順序
export const PRE_CONTRACT_STATUS_ORDER: PreContractStatus[] = [
  '限定会員',
  '面談',
  '建築申込',
  'プラン提出',
  '内定',
]

// 契約前顧客の失注ステータス
export const PRE_CONTRACT_LOST: PreContractStatus[] = ['ボツ・他決']

// 契約後顧客のステータス順序
export const POST_CONTRACT_STATUS_ORDER: PostContractStatus[] = [
  '変更契約前',
  '変更契約後',
]

// オーナーステータス
export const OWNER_STATUS: OwnerStatus[] = ['オーナー']

// 全パイプライン順序（遷移率計算用）
export const PIPELINE_ORDER: PipelineStatus[] = [
  ...PRE_MEMBER_STATUS_ORDER,
  ...PRE_CONTRACT_STATUS_ORDER,
  ...POST_CONTRACT_STATUS_ORDER,
  ...OWNER_STATUS,
]

export const PIPELINE_LOST: PipelineStatus[] = ['ボツ・他決']

// パイプラインステータスの表示設定
export const PIPELINE_CONFIG: Record<PipelineStatus, { label: string; color: string; bgColor: string }> = {
  // 限定会員前顧客
  '資料請求': { label: '資料請求', color: 'text-slate-700', bgColor: 'bg-slate-100' },
  'イベント予約': { label: 'イベント予約', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  'イベント参加': { label: 'イベント参加', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  // 契約前顧客
  '限定会員': { label: '限定会員', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  '面談': { label: '面談', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
  '建築申込': { label: '建築申込', color: 'text-teal-700', bgColor: 'bg-teal-100' },
  'プラン提出': { label: 'プラン提出', color: 'text-sky-700', bgColor: 'bg-sky-100' },
  '内定': { label: '内定', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  'ボツ・他決': { label: 'ボツ・他決', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  // 契約後顧客
  '変更契約前': { label: '変更契約前', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  '変更契約後': { label: '変更契約後', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  // オーナー
  'オーナー': { label: 'オーナー', color: 'text-green-700', bgColor: 'bg-green-100' },
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

// プラン依頼ステータス順序
export const PLAN_REQUEST_STATUS_ORDER: PlanRequestStatus[] = [
  '新規依頼',
  '役調依頼中',
  '役調完了',
  'チェック待ち',
  '設計割り振り',
  '設計中',
  'プレゼン作成中',
  '確認待ち',
  '修正依頼',
  '完了',
]

// プラン依頼ステータスの表示設定
export const PLAN_REQUEST_STATUS_CONFIG: Record<PlanRequestStatus, { label: string; color: string; bgColor: string; icon: string }> = {
  '新規依頼': { label: '新規', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: 'FileText' },
  '役調依頼中': { label: '役調中', color: 'text-purple-700', bgColor: 'bg-purple-100', icon: 'Search' },
  '役調完了': { label: '役調完了', color: 'text-indigo-700', bgColor: 'bg-indigo-100', icon: 'FileCheck' },
  'チェック待ち': { label: 'チェック待', color: 'text-cyan-700', bgColor: 'bg-cyan-100', icon: 'ClipboardCheck' },
  '設計割り振り': { label: '割振済', color: 'text-teal-700', bgColor: 'bg-teal-100', icon: 'Users' },
  '設計中': { label: '設計中', color: 'text-orange-700', bgColor: 'bg-orange-100', icon: 'Ruler' },
  'プレゼン作成中': { label: 'プレゼン中', color: 'text-amber-700', bgColor: 'bg-amber-100', icon: 'Presentation' },
  '確認待ち': { label: '確認待', color: 'text-yellow-700', bgColor: 'bg-yellow-100', icon: 'Eye' },
  '修正依頼': { label: '修正', color: 'text-red-700', bgColor: 'bg-red-100', icon: 'AlertCircle' },
  '完了': { label: '完了', color: 'text-green-700', bgColor: 'bg-green-100', icon: 'CheckCircle' },
}

// 設計事務所の設定
export const DESIGN_OFFICE_CONFIG: Record<DesignOffice, { label: string; color: string }> = {
  'ラリーケー': { label: 'ラリーケー', color: 'text-blue-600' },
  'ライフプラス': { label: 'ライフプラス', color: 'text-green-600' },
  'Nデザイン': { label: 'Nデザイン', color: 'text-purple-600' },
  'L&A': { label: 'L&A', color: 'text-orange-600' },
  'JIN': { label: 'JIN', color: 'text-red-600' },
  'その他': { label: 'その他', color: 'text-gray-600' },
}

// 商品リスト
export const PRODUCT_LIST = [
  { value: 'LIFE+ Limited', label: 'LIFE+ Limited（55万/坪）' },
  { value: 'LIFE+ Standard', label: 'LIFE+ Standard（50万/坪）' },
  { value: 'LIFE+ Basic', label: 'LIFE+ Basic（45万/坪）' },
  { value: 'Custom', label: 'カスタム仕様' },
]

// キャンペーンリスト
export const CAMPAIGN_LIST = [
  { value: 'none', label: 'キャンペーンなし', description: '通常価格での契約' },
  { value: 'limited', label: 'Limitedキャンペーン', description: '期間限定の特別価格' },
  { value: 'solar', label: '太陽光載せ放題キャンペーン', description: '太陽光パネル無料設置' },
  { value: 'ground', label: '地盤改良キャンペーン', description: '地盤改良費用サポート' },
]

// 工法リスト
export const CONSTRUCTION_METHOD_LIST = [
  { value: 'conventional', label: '在来軸組工法', description: '日本の伝統的な木造軸組工法' },
  { value: 'technostructure', label: 'テクノストラクチャー', description: 'パナソニック製の耐震住宅工法' },
]

// 紹介の有無
export const REFERRAL_LIST = [
  { value: 'none', label: '紹介無し', description: '自己来場・広告経由' },
  { value: 'owner', label: 'オーナー紹介あり', description: '既存オーナー様からの紹介' },
  { value: 'vendor', label: '業者紹介あり', description: '不動産会社・金融機関からの紹介' },
]

// 設計者マスタ（管理者モードで追加可能）
export interface Designer {
  id: string
  name: string
  license_number: string
}

export const DESIGNER_LIST: Designer[] = [
  { id: 'designer-001', name: '山田 一郎', license_number: '一級建築士 第123456号' },
  { id: 'designer-002', name: '佐藤 二郎', license_number: '一級建築士 第234567号' },
  { id: 'designer-003', name: '鈴木 三郎', license_number: '二級建築士 第345678号' },
]

// ===== プラン依頼用定数 =====

// 仕上がりタイプリスト
export const DELIVERABLE_TYPE_LIST = [
  { value: '手描きラフ', label: '手描きラフ', description: '手書きの簡易プラン' },
  { value: 'プレゼン（パース外観のみ）', label: 'プレゼン（パース外観のみ）', description: '外観パースのみ作成' },
  { value: 'プレゼン（パース有）', label: 'プレゼン（パース有）', description: '外観・内観パース付き' },
]

// 施工対応エリアリスト
export const CONSTRUCTION_AREA_LIST = [
  { value: 'Gハウス施工', label: 'Gハウス施工', description: '自社施工エリア' },
  { value: 'ファブレス施工', label: 'ファブレス施工', description: '協力業者施工エリア' },
]

// 土地の状況リスト
export const LAND_STATUS_LIST = [
  { value: 'お客様所有', label: 'お客様所有', description: '既に土地を所有している' },
  { value: '契約済（決済前）', label: '契約済（決済前）', description: '土地の売買契約は完了、決済前' },
  { value: '買付提出済', label: '買付提出済', description: '買付証明書を提出済み' },
]

// 宅地造成の相談について
export const LAND_DEVELOPMENT_LIST = [
  { value: 'required', label: '要', description: '例：高低差がある物件は必要' },
  { value: 'not_required', label: '不要', description: '造成工事不要' },
]

// 役所調査タイプリスト
export const INVESTIGATION_TYPE_LIST = [
  { value: 'ネット/TEL調査', label: 'ネット/TEL調査', description: 'ネットや電話での調査' },
  { value: '役所往訪', label: '役所往訪', description: '役所へ直接訪問して調査' },
]

// 役所往訪の理由リスト
export const INVESTIGATION_REASON_LIST = [
  { value: 'urbanization_control_area', label: '市街化調整区域', description: '' },
  { value: 'retaining_wall', label: '擁壁あり', description: '' },
  { value: 'article_43', label: '43条申請', description: '' },
]

// 水道調査リスト
export const WATER_SURVEY_LIST = [
  { value: 'required', label: '要', description: '' },
  { value: 'not_required', label: '不要', description: '' },
]

// 解体についてリスト（現状）
export const DEMOLITION_LIST = [
  { value: 'none', label: '不要（現状更地）', description: '' },
  { value: 'ghouse', label: 'Gハウス手配（古家付）', description: '' },
  { value: 'customer', label: 'お客様手配（古家付）', description: '' },
  { value: 'seller', label: '売主手配（古家付）', description: '' },
]

// 競合有無リスト
export const COMPETITION_LIST = [
  { value: 'exists', label: '有り', description: '' },
  { value: 'none', label: '無し', description: '' },
]

// 競合先マスタ
export const COMPETITOR_LIST = [
  { value: 'ai_koumuten', label: 'アイ工務店' },
  { value: 'ichijo', label: '一条工務店' },
  { value: 'senboku', label: '泉北ホーム' },
  { value: 'yamato', label: 'ヤマト住建' },
  { value: 'sekisui_house', label: '積水ハウス' },
  { value: 'sumitomo', label: '住友林業' },
  { value: 'sekisui_heim', label: 'セキスイハイム' },
  { value: 'hebel', label: 'ヘーベルハウス' },
  { value: 'tamahome', label: 'タマホーム' },
  { value: 'hikari', label: 'ひかり工務店' },
  { value: 'other', label: 'その他' },
]

// 階数リスト
export const FLOOR_LIST = [
  { value: '1', label: '平屋', description: '' },
  { value: '2', label: '2階', description: '' },
  { value: '3', label: '3階', description: '' },
]

// 世帯数リスト
export const HOUSEHOLD_TYPE_LIST = [
  { value: 'single', label: '単世帯', description: '' },
  { value: 'two_generation', label: '二世帯（完全分離）', description: '' },
  { value: 'two_generation_partial', label: '二世帯（一部共有）', description: '' },
]

// 重要事項説明者マスタ（管理者モードで追加可能）
export interface ImportantMatterExplainer {
  id: string
  name: string
  license_number: string
}

export const IMPORTANT_MATTER_EXPLAINER_LIST: ImportantMatterExplainer[] = [
  { id: 'explainer-001', name: '田中 太郎', license_number: '宅地建物取引士 第123456号' },
  { id: 'explainer-002', name: '高橋 次郎', license_number: '宅地建物取引士 第234567号' },
  { id: 'explainer-003', name: '伊藤 三郎', license_number: '宅地建物取引士 第345678号' },
]

// === 契約承認フロー設定 ===

// 契約ステータス順序
export const CONTRACT_STATUS_ORDER: ContractStatus[] = [
  '作成中',
  '書類確認',
  '上長承認待ち',
  '契約完了',
]

// 契約ステータスの表示設定
export const CONTRACT_STATUS_CONFIG: Record<ContractStatus, {
  label: string
  color: string
  bgColor: string
  icon: string
  description: string
}> = {
  '作成中': {
    label: '作成中',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: 'FileEdit',
    description: '営業担当が契約書を作成中',
  },
  '書類確認': {
    label: '書類確認',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    icon: 'FileSearch',
    description: '書類確認者が内容を確認中',
  },
  '上長承認待ち': {
    label: '上長承認待ち',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    icon: 'UserCheck',
    description: '上長の承認を待っています',
  },
  '契約完了': {
    label: '契約完了',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: 'CheckCircle2',
    description: '承認完了・契約締結済み',
  },
}

// 契約アクションの設定
export const CONTRACT_ACTION_CONFIG: Record<ContractAction, {
  label: string
  color: string
  bgColor: string
  icon: string
  confirmMessage: string
}> = {
  '承認申請': {
    label: '承認申請',
    color: 'text-blue-700',
    bgColor: 'bg-blue-600',
    icon: 'Send',
    confirmMessage: '承認申請を送信しますか？',
  },
  '承認': {
    label: '承認',
    color: 'text-green-700',
    bgColor: 'bg-green-600',
    icon: 'Check',
    confirmMessage: 'この契約を承認しますか？',
  },
  '差戻し': {
    label: '差戻し',
    color: 'text-red-700',
    bgColor: 'bg-red-600',
    icon: 'RotateCcw',
    confirmMessage: 'この契約を差戻しますか？理由を入力してください。',
  },
  '保存': {
    label: '保存',
    color: 'text-gray-700',
    bgColor: 'bg-gray-600',
    icon: 'Save',
    confirmMessage: '変更を保存しますか？',
  },
}

// ステータスごとに実行可能なアクション
export const CONTRACT_STATUS_ACTIONS: Record<ContractStatus, ContractAction[]> = {
  '作成中': ['保存', '承認申請'],
  '書類確認': ['承認', '差戻し'],
  '上長承認待ち': ['承認', '差戻し'],
  '契約完了': [], // 完了後はアクションなし
}

// 承認フローの遷移マップ
export const CONTRACT_STATUS_TRANSITIONS: Record<ContractStatus, {
  next: ContractStatus | null // 承認時の次のステータス
  prev: ContractStatus | null // 差戻し時の前のステータス
}> = {
  '作成中': { next: '書類確認', prev: null },
  '書類確認': { next: '上長承認待ち', prev: '作成中' },
  '上長承認待ち': { next: '契約完了', prev: '書類確認' },
  '契約完了': { next: null, prev: null },
}

// 契約履歴エントリの型
export interface ContractHistoryEntry {
  id: string
  action: ContractAction | 'ステータス変更'
  fromStatus: ContractStatus
  toStatus: ContractStatus
  userId: string | null
  userName: string | null
  comment: string | null
  timestamp: string
}

// 本人確認書類タイプリスト
export const IDENTITY_DOC_TYPES = [
  { value: '免許証', label: '運転免許証' },
  { value: 'パスポート', label: 'パスポート' },
  { value: 'マイナンバーカード', label: 'マイナンバーカード' },
  { value: '住民票', label: '住民票' },
  { value: 'その他', label: 'その他' },
]

// ローンタイプリスト
export const LOAN_TYPES = [
  { value: '銀行ローン', label: '銀行ローン' },
  { value: 'フラット35', label: 'フラット35' },
  { value: '自己資金', label: '自己資金' },
  { value: 'その他', label: 'その他' },
]

// === 契約承認権限設定 ===

// 承認権限ロール
export type ContractApprovalRole =
  | '作成者'       // 契約書を作成した人
  | '書類確認者'   // 書類確認を行う人（事務・管理）
  | '承認者'       // 最終承認者（上長・マネージャー）

// ユーザーロールと承認権限のマッピング
export const USER_ROLE_TO_APPROVAL_ROLES: Record<UserRole, ContractApprovalRole[]> = {
  'admin': ['作成者', '書類確認者', '承認者'],
  'sales': ['作成者'],
  'sales_leader': ['作成者', '書類確認者', '承認者'],
  'sales_office': ['書類確認者'],
  'design_manager': ['承認者'],
  'construction_manager': ['承認者'],
  'design': [],
  'cad': [],
  'ic': [],
  'supervisor': [],
  'exterior': [],
}

// 各ステータスでアクションを実行できる権限
export const CONTRACT_ACTION_PERMISSIONS: Record<ContractStatus, {
  actions: Record<ContractAction, {
    allowedRoles: ContractApprovalRole[]
    allowCreator?: boolean // 作成者本人のみ可能か
    requireDifferentUser?: boolean // 別ユーザーが必要か（自己承認禁止）
  }>
}> = {
  '作成中': {
    actions: {
      '保存': {
        allowedRoles: ['作成者'],
        allowCreator: true, // 作成者のみ保存可能
      },
      '承認申請': {
        allowedRoles: ['作成者'],
        allowCreator: true, // 作成者のみ申請可能
      },
      '承認': { allowedRoles: [] }, // このステータスでは不可
      '差戻し': { allowedRoles: [] }, // このステータスでは不可
    },
  },
  '書類確認': {
    actions: {
      '保存': { allowedRoles: [] }, // 編集不可
      '承認申請': { allowedRoles: [] }, // 不可
      '承認': {
        allowedRoles: ['書類確認者', '承認者'],
        requireDifferentUser: true, // 作成者以外が確認
      },
      '差戻し': {
        allowedRoles: ['書類確認者', '承認者'],
        requireDifferentUser: true,
      },
    },
  },
  '上長承認待ち': {
    actions: {
      '保存': { allowedRoles: [] },
      '承認申請': { allowedRoles: [] },
      '承認': {
        allowedRoles: ['承認者'],
        requireDifferentUser: true, // 作成者・確認者以外が承認
      },
      '差戻し': {
        allowedRoles: ['承認者'],
        requireDifferentUser: true,
      },
    },
  },
  '契約完了': {
    actions: {
      '保存': { allowedRoles: [] },
      '承認申請': { allowedRoles: [] },
      '承認': { allowedRoles: [] },
      '差戻し': { allowedRoles: [] },
    },
  },
}

// 権限チェックのインターフェース
export interface ContractPermissionCheckParams {
  userRole: UserRole
  userId: string
  contractStatus: ContractStatus
  action: ContractAction
  contractCreatedBy?: string | null // 契約作成者
  contractCheckedBy?: string | null // 書類確認者
}

// 権限チェック結果
export interface ContractPermissionResult {
  allowed: boolean
  reason?: string // 許可されない理由
}

// 権限チェック関数
export function checkContractPermission(params: ContractPermissionCheckParams): ContractPermissionResult {
  const { userRole, userId, contractStatus, action, contractCreatedBy, contractCheckedBy } = params

  // ステータスに対応するアクションを取得
  const statusConfig = CONTRACT_ACTION_PERMISSIONS[contractStatus]
  if (!statusConfig) {
    return { allowed: false, reason: '無効なステータスです' }
  }

  const actionConfig = statusConfig.actions[action]
  if (!actionConfig) {
    return { allowed: false, reason: '無効なアクションです' }
  }

  // 許可されたロールがない場合
  if (actionConfig.allowedRoles.length === 0) {
    return { allowed: false, reason: `${contractStatus}のステータスでは${action}は実行できません` }
  }

  // ユーザーの承認権限を取得
  const userApprovalRoles = USER_ROLE_TO_APPROVAL_ROLES[userRole]

  // 作成者のみ許可の場合
  if (actionConfig.allowCreator) {
    if (contractCreatedBy && userId !== contractCreatedBy) {
      return { allowed: false, reason: '作成者のみがこの操作を行えます' }
    }
  }

  // 別ユーザー必須の場合（自己承認禁止）
  if (actionConfig.requireDifferentUser) {
    if (contractCreatedBy && userId === contractCreatedBy) {
      return { allowed: false, reason: '自分が作成した契約は承認できません' }
    }
    if (contractStatus === '上長承認待ち' && contractCheckedBy && userId === contractCheckedBy) {
      return { allowed: false, reason: '書類確認者は上長承認できません' }
    }
  }

  // ロールチェック
  const hasPermission = actionConfig.allowedRoles.some(role => userApprovalRoles.includes(role))
  if (!hasPermission) {
    return { allowed: false, reason: `この操作には${actionConfig.allowedRoles.join('または')}の権限が必要です` }
  }

  return { allowed: true }
}

// ステータスごとに実行可能なアクションを取得（権限フィルター付き）
export function getAvailableContractActions(
  status: ContractStatus,
  userRole: UserRole,
  userId: string,
  contractCreatedBy?: string | null,
  contractCheckedBy?: string | null
): { action: ContractAction; enabled: boolean; reason?: string }[] {
  const allActions = CONTRACT_STATUS_ACTIONS[status]

  return allActions.map(action => {
    const result = checkContractPermission({
      userRole,
      userId,
      contractStatus: status,
      action,
      contractCreatedBy,
      contractCheckedBy,
    })
    return {
      action,
      enabled: result.allowed,
      reason: result.reason,
    }
  })
}

// ========================================
// ノーコード基盤の型定義
// ========================================

// フィールド定義
export interface FieldDefinition {
  id: string
  form_id: string
  code: string
  name: string
  field_type: FieldType
  is_required: boolean
  default_value?: Json
  options?: Json // select/multiselectの選択肢
  validation?: Json // バリデーションルール
  calculated_formula?: string // calculated用の計算式
  reference_table?: string // reference用の参照テーブル
  reference_display_field?: string // 参照時の表示フィールド
  layout?: {
    column?: number
    row?: number
    width?: 'full' | 'half' | 'third' | 'quarter'
    section?: string
  }
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// フォーム定義
export interface FormDefinition {
  id: string
  tenant_id: string
  code: string
  name: string
  description?: string
  table_name: string // 対応するデータベーステーブル
  layout?: Json
  settings?: Json
  is_active: boolean
  created_at: string
  updated_at: string
  fields?: FieldDefinition[]
}

// ワークフローステップ定義
export interface WorkflowStep {
  id: string
  workflow_id: string
  code: string
  name: string
  step_type: WorkflowStepType
  assignee_type: WorkflowAssigneeType
  assignee_value?: string // role名、user_id、フィールド名など
  assignee_roles?: UserRole[] // parallel_approval用の複数ロール
  actions: string[] // ['approve', 'reject'] など
  next_steps: Record<string, string> // { 'approve': 'step_2', 'reject': 'revision' }
  conditions?: Json // 条件分岐の設定
  notification_settings?: Json // 通知設定
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// ワークフロー定義
export interface WorkflowDefinition {
  id: string
  tenant_id: string
  code: string
  name: string
  description?: string
  target_table: string // 対象テーブル
  trigger_conditions?: Json // ワークフロー開始条件
  is_active: boolean
  created_at: string
  updated_at: string
  steps?: WorkflowStep[]
}

// ワークフローインスタンス（実行中のワークフロー）
export interface WorkflowInstance {
  id: string
  workflow_id: string
  tenant_id: string
  record_id: string // 対象レコードのID
  record_table: string // 対象テーブル
  current_step_id?: string
  status: WorkflowInstanceStatus
  started_by?: string
  started_at: string
  completed_at?: string
  data?: Json // ワークフロー実行中のデータ
  created_at: string
  updated_at: string
}

// 承認履歴
export interface ApprovalHistory {
  id: string
  workflow_instance_id: string
  step_id: string
  action: string // 'approve', 'reject', 'submit'など
  actor_id: string
  actor_name?: string
  comment?: string
  created_at: string
}

// 通知
export interface Notification {
  id: string
  tenant_id: string
  user_id: string
  type: string
  title: string
  message?: string
  link?: string
  is_read: boolean
  created_at: string
  read_at?: string
}

// 画面定義
export interface PageDefinition {
  id: string
  tenant_id: string
  code: string
  name: string
  path: string // URLパス
  page_type: 'list' | 'detail' | 'form' | 'dashboard' | 'custom'
  layout?: Json
  components?: PageComponent[]
  permissions?: {
    view: UserRole[]
    edit?: UserRole[]
    delete?: UserRole[]
  }
  is_active: boolean
  created_at: string
  updated_at: string
}

// 画面コンポーネント
export interface PageComponent {
  id: string
  type: 'table' | 'form' | 'chart' | 'card' | 'stats' | 'kanban' | 'calendar' | 'custom'
  title?: string
  data_source?: string // テーブル名またはAPI
  form_id?: string // フォーム定義への参照
  settings?: Json
  layout?: {
    x?: number
    y?: number
    width?: number
    height?: number
  }
}

// ロール設定
export const ROLE_CONFIG: Record<UserRole, {
  label: string
  description: string
  color: string
  permissions: string[]
}> = {
  sales: {
    label: '営業',
    description: '顧客管理、資金計画書作成、契約依頼作成',
    color: 'bg-blue-100 text-blue-700',
    permissions: ['customer:create', 'customer:read', 'fund_plan:create', 'contract_request:create'],
  },
  sales_leader: {
    label: '営業リーダー',
    description: '営業の権限 + 契約依頼の内容確認',
    color: 'bg-blue-200 text-blue-800',
    permissions: ['customer:*', 'fund_plan:*', 'contract_request:approve_leader'],
  },
  sales_office: {
    label: '営業事務',
    description: '請負契約書作成、契約依頼閲覧',
    color: 'bg-purple-100 text-purple-700',
    permissions: ['contract:create', 'contract_request:read'],
  },
  design_manager: {
    label: '設計部門長',
    description: '契約依頼承認（図面・金額確認）、プラン依頼管理',
    color: 'bg-orange-100 text-orange-700',
    permissions: ['contract_request:approve_design', 'plan_request:*'],
  },
  construction_manager: {
    label: '工事部門長',
    description: '契約依頼承認（工期・運搬経路確認）',
    color: 'bg-yellow-100 text-yellow-700',
    permissions: ['contract_request:approve_construction'],
  },
  design: {
    label: '設計',
    description: 'プラン依頼対応、引継書閲覧',
    color: 'bg-teal-100 text-teal-700',
    permissions: ['plan_request:update', 'handover:read'],
  },
  cad: {
    label: 'CAD担当',
    description: 'プラン依頼対応',
    color: 'bg-cyan-100 text-cyan-700',
    permissions: ['plan_request:update'],
  },
  ic: {
    label: 'IC',
    description: '引継書閲覧',
    color: 'bg-pink-100 text-pink-700',
    permissions: ['handover:read'],
  },
  supervisor: {
    label: '現場監督',
    description: '引継書閲覧',
    color: 'bg-amber-100 text-amber-700',
    permissions: ['handover:read'],
  },
  exterior: {
    label: '外構担当',
    description: '引継書閲覧',
    color: 'bg-lime-100 text-lime-700',
    permissions: ['handover:read'],
  },
  admin: {
    label: '本部',
    description: '全体閲覧、マスタ管理、ノーコード設定',
    color: 'bg-green-100 text-green-700',
    permissions: ['*'],
  },
}

// 権限チェック関数
export function hasPermission(userRole: UserRole, requiredPermission: string): boolean {
  const roleConfig = ROLE_CONFIG[userRole]
  if (!roleConfig) return false

  // adminは全権限
  if (roleConfig.permissions.includes('*')) return true

  // 完全一致
  if (roleConfig.permissions.includes(requiredPermission)) return true

  // ワイルドカードチェック（例: customer:* は customer:read にマッチ）
  const [resource, action] = requiredPermission.split(':')
  if (roleConfig.permissions.includes(`${resource}:*`)) return true

  return false
}

// ロールが特定のアクションを実行できるかチェック
export function canPerformAction(
  userRole: UserRole,
  action: 'create' | 'read' | 'update' | 'delete' | 'approve',
  resource: string
): boolean {
  return hasPermission(userRole, `${resource}:${action}`)
}
