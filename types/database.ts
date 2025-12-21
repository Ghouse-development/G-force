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
export type DeliverableType = 'ラフプラン' | 'プレゼン（パース無）' | 'プレゼン（パース有）' | '契約図'

// 施工エリア
export type ConstructionArea = 'Gハウス施工' | '業者施工'

// 土地の状況
export type LandStatus = '決済済' | '買付提出済' | '土地検討中' | '所有地'

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

// 商品リスト（仮）
export const PRODUCT_LIST = [
  { value: 'LIFE+ Limited', label: 'LIFE+ Limited（55万/坪）' },
  { value: 'LIFE+ Standard', label: 'LIFE+ Standard（50万/坪）' },
  { value: 'LIFE+ Basic', label: 'LIFE+ Basic（45万/坪）' },
  { value: 'Custom', label: 'カスタム仕様' },
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
