-- ============================================
-- G-force Database Schema
-- Gハウス業務システム - 統合スキーマ
-- ============================================

-- 既存テーブルの削除（再作成用）
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS approval_history CASCADE;
DROP TABLE IF EXISTS workflow_instances CASCADE;
DROP TABLE IF EXISTS workflow_steps CASCADE;
DROP TABLE IF EXISTS workflow_definitions CASCADE;
DROP TABLE IF EXISTS field_definitions CASCADE;
DROP TABLE IF EXISTS form_definitions CASCADE;
DROP TABLE IF EXISTS page_definitions CASCADE;
DROP TABLE IF EXISTS handover_viewers CASCADE;
DROP TABLE IF EXISTS handovers CASCADE;
DROP TABLE IF EXISTS plan_request_competitors CASCADE;
DROP TABLE IF EXISTS plan_requests CASCADE;
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS contract_request_attachments CASCADE;
DROP TABLE IF EXISTS contract_requests CASCADE;
DROP TABLE IF EXISTS fund_plans CASCADE;
DROP TABLE IF EXISTS customer_activities CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS campaign_products CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS banks CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- ============================================
-- 1. 基本テーブル
-- ============================================

-- テナント（会社）
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ユーザー
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  department VARCHAR(100),
  role VARCHAR(50) NOT NULL DEFAULT 'staff',
  -- roles: staff, sales_leader, sales_admin, design_manager, construction_manager, design, cad, ic, site_supervisor, exterior, headquarters
  permissions JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

-- ============================================
-- 2. マスタテーブル
-- ============================================

-- 商品マスタ
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code VARCHAR(50),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  base_price DECIMAL(15, 2),
  price_per_tsubo DECIMAL(15, 2),
  description TEXT,
  specifications JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- キャンペーンマスタ
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code VARCHAR(50),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  discount_type VARCHAR(50), -- 'fixed', 'percentage', 'gift'
  discount_value DECIMAL(15, 2),
  conditions JSONB DEFAULT '{}',
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- キャンペーン対象商品
CREATE TABLE campaign_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campaign_id, product_id)
);

-- 銀行マスタ
CREATE TABLE banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code VARCHAR(50),
  name VARCHAR(255) NOT NULL,
  branch_name VARCHAR(255),
  loan_types JSONB DEFAULT '[]',
  interest_rates JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. 顧客管理
-- ============================================

-- 顧客
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- 基本情報
  customer_number VARCHAR(50),
  name VARCHAR(255) NOT NULL,
  name_kana VARCHAR(255),
  partner_name VARCHAR(255),
  partner_name_kana VARCHAR(255),

  -- 連絡先
  email VARCHAR(255),
  phone VARCHAR(50),
  mobile_phone VARCHAR(50),

  -- 住所
  postal_code VARCHAR(10),
  prefecture VARCHAR(50),
  city VARCHAR(100),
  address VARCHAR(255),
  building VARCHAR(255),

  -- 建築予定地
  land_postal_code VARCHAR(10),
  land_prefecture VARCHAR(50),
  land_city VARCHAR(100),
  land_address VARCHAR(255),

  -- 物件情報
  tei_name VARCHAR(255),
  land_area DECIMAL(10, 2),
  building_area DECIMAL(10, 2),

  -- 希望・予算
  budget_min DECIMAL(15, 2),
  budget_max DECIMAL(15, 2),
  desired_move_date DATE,
  family_size INTEGER,

  -- 営業情報
  pipeline_status VARCHAR(50) DEFAULT '新規問合せ',
  -- statuses: 新規問合せ, アポ取得, ヒアリング, プラン提案, 見積提出, 契約交渉, 契約, 失注
  rank VARCHAR(10),
  source VARCHAR(100),
  assigned_to UUID REFERENCES users(id),

  -- Formbridge/外部連携
  formbridge_id VARCHAR(100),
  external_data JSONB DEFAULT '{}',

  -- メモ・タグ
  notes TEXT,
  tags JSONB DEFAULT '[]',

  -- メタ情報
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 顧客活動履歴
CREATE TABLE customer_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL, -- 'call', 'visit', 'email', 'meeting', 'other'
  activity_date TIMESTAMP WITH TIME ZONE NOT NULL,
  title VARCHAR(255),
  description TEXT,
  result VARCHAR(100),
  next_action VARCHAR(255),
  next_action_date DATE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. 資金計画書
-- ============================================

CREATE TABLE fund_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,

  -- 基本情報
  plan_number VARCHAR(50),
  tei_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'submitted', 'approved'
  version INTEGER DEFAULT 1,

  -- フォームデータ（JSON - Excel形式のデータをそのまま保存）
  data JSONB NOT NULL DEFAULT '{}',

  -- 計算結果（キャッシュ）
  calculation JSONB DEFAULT '{}',

  -- メタ情報
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. 契約依頼・承認フロー
-- ============================================

-- 契約依頼
CREATE TABLE contract_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  fund_plan_id UUID REFERENCES fund_plans(id) ON DELETE SET NULL,

  -- 依頼番号
  request_number VARCHAR(50),

  -- 基本情報
  tei_name VARCHAR(255),
  customer_name VARCHAR(255),
  partner_name VARCHAR(255),
  ownership_type VARCHAR(50),

  -- 担当者
  sales_person VARCHAR(100),
  sales_person_id UUID REFERENCES users(id),
  design_person VARCHAR(100),
  construction_person VARCHAR(100),
  ic_person VARCHAR(100),

  -- 物件情報
  land_address TEXT,
  land_area DECIMAL(10, 2),
  building_area DECIMAL(10, 2),
  product_id UUID REFERENCES products(id),
  product_name VARCHAR(255),

  -- 金額情報
  building_price DECIMAL(15, 2),
  option_price DECIMAL(15, 2),
  exterior_price DECIMAL(15, 2),
  other_price DECIMAL(15, 2),
  discount_amount DECIMAL(15, 2),
  tax_amount DECIMAL(15, 2),
  total_amount DECIMAL(15, 2),

  -- 支払条件
  payment_at_contract DECIMAL(15, 2),
  payment_at_start DECIMAL(15, 2),
  payment_at_frame DECIMAL(15, 2),
  payment_at_completion DECIMAL(15, 2),

  -- ローン情報
  loan_type VARCHAR(100),
  loan_bank VARCHAR(255),
  loan_amount DECIMAL(15, 2),
  loan_approved BOOLEAN DEFAULT FALSE,
  loan_approved_date DATE,

  -- キャンペーン
  campaign_id UUID REFERENCES campaigns(id),
  campaign_name VARCHAR(255),

  -- スケジュール
  contract_date DATE,
  construction_start_date DATE,
  construction_end_date DATE,
  handover_date DATE,

  -- 引継書（契約依頼の必須書類）
  handover_id UUID, -- 後でFKを追加

  -- 承認フロー状態
  workflow_status VARCHAR(50) DEFAULT 'draft',
  -- statuses: draft, pending_leader, pending_managers, revision, approved, rejected
  current_step VARCHAR(100),

  -- 差戻し情報
  return_count INTEGER DEFAULT 0,
  return_comment TEXT,
  returned_by UUID REFERENCES users(id),
  returned_at TIMESTAMP WITH TIME ZONE,

  -- 備考
  notes TEXT,

  -- メタ情報
  created_by UUID REFERENCES users(id),
  created_by_name VARCHAR(255),
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 契約依頼添付ファイル
CREATE TABLE contract_request_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_request_id UUID NOT NULL REFERENCES contract_requests(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100),
  file_size INTEGER,
  storage_path TEXT,
  category VARCHAR(100), -- 'identity', 'drawing', 'other'
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. 請負契約書
-- ============================================

CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contract_request_id UUID REFERENCES contract_requests(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,

  -- 契約番号
  contract_number VARCHAR(50),

  -- 契約依頼からコピーされるデータ
  tei_name VARCHAR(255),
  customer_name VARCHAR(255),
  partner_name VARCHAR(255),

  -- 契約書固有のデータ
  contract_data JSONB NOT NULL DEFAULT '{}',

  -- ステータス
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'completed'

  -- 本人確認
  identity_verified BOOLEAN DEFAULT FALSE,
  identity_doc_type VARCHAR(100),
  identity_verified_date DATE,
  identity_verified_by VARCHAR(255),

  -- 重要事項説明
  important_notes_completed BOOLEAN DEFAULT FALSE,
  important_notes_date DATE,

  -- メタ情報
  created_by UUID REFERENCES users(id),
  created_by_name VARCHAR(255),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 7. プラン依頼
-- ============================================

CREATE TABLE plan_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,

  -- 依頼番号
  request_number VARCHAR(50),

  -- 基本情報
  tei_name VARCHAR(255),
  customer_name VARCHAR(255),

  -- 依頼内容
  request_type VARCHAR(50), -- 'new', 'revision'
  priority VARCHAR(20) DEFAULT 'normal', -- 'high', 'normal', 'low'

  -- 物件情報
  land_address TEXT,
  land_area DECIMAL(10, 2),
  building_area DECIMAL(10, 2),
  floor_count INTEGER,

  -- 要望
  requirements TEXT,
  attached_files JSONB DEFAULT '[]',

  -- ステータス
  status VARCHAR(50) DEFAULT 'draft',
  -- statuses: draft, submitted, in_progress, completed, cancelled

  -- 担当
  requested_by UUID REFERENCES users(id),
  requested_by_name VARCHAR(255),
  assigned_to UUID REFERENCES users(id),
  assigned_to_name VARCHAR(255),

  -- 期限
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- 結果（競合情報）
  result VARCHAR(50), -- 'win', 'lose', 'pending'
  result_reason TEXT,
  competitor_info TEXT,

  -- メタ情報
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- プラン依頼の競合情報
CREATE TABLE plan_request_competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_request_id UUID NOT NULL REFERENCES plan_requests(id) ON DELETE CASCADE,
  competitor_name VARCHAR(255),
  competitor_price DECIMAL(15, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 8. 引継書
-- ============================================

CREATE TABLE handovers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  contract_request_id UUID REFERENCES contract_requests(id) ON DELETE SET NULL,

  -- 引継番号
  handover_number VARCHAR(50),

  -- 基本情報
  tei_name VARCHAR(255),
  customer_name VARCHAR(255),

  -- 引継内容（JSON - 柔軟なフォーム）
  handover_data JSONB NOT NULL DEFAULT '{}',

  -- ステータス
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'submitted'

  -- 担当
  sales_person VARCHAR(100),
  sales_person_id UUID REFERENCES users(id),

  -- メタ情報
  created_by UUID REFERENCES users(id),
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 引継書閲覧者（契約後に閲覧可能になる）
CREATE TABLE handover_viewers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handover_id UUID NOT NULL REFERENCES handovers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50), -- 'design', 'ic', 'site_supervisor', 'exterior'
  viewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(handover_id, user_id)
);

-- 契約依頼に引継書のFKを追加
ALTER TABLE contract_requests
  ADD CONSTRAINT fk_contract_requests_handover
  FOREIGN KEY (handover_id) REFERENCES handovers(id) ON DELETE SET NULL;

-- ============================================
-- 9. ノーコード基盤
-- ============================================

-- フォーム定義
CREATE TABLE form_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  entity_type VARCHAR(100), -- 'customer', 'contract_request', 'fund_plan', etc.
  layout JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, code)
);

-- フィールド定義
CREATE TABLE field_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES form_definitions(id) ON DELETE CASCADE,
  code VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  field_type VARCHAR(50) NOT NULL,
  -- types: text, number, currency, date, datetime, select, multiselect, checkbox, textarea, file, calculated, reference
  options JSONB DEFAULT '{}', -- 選択肢、参照先、計算式など
  validation JSONB DEFAULT '{}', -- required, min, max, pattern, etc.
  layout JSONB DEFAULT '{}', -- column, row, width, etc.
  default_value TEXT,
  is_required BOOLEAN DEFAULT FALSE,
  is_readonly BOOLEAN DEFAULT FALSE,
  is_hidden BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(form_id, code)
);

-- ワークフロー定義
CREATE TABLE workflow_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  entity_type VARCHAR(100), -- 'contract_request', etc.
  trigger_conditions JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, code)
);

-- ワークフローステップ定義
CREATE TABLE workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
  code VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  step_type VARCHAR(50) NOT NULL, -- 'approval', 'parallel_approval', 'revision', 'notify', 'auto'
  assignee_type VARCHAR(50), -- 'role', 'user', 'creator', 'field'
  assignee_value TEXT, -- ロール名、ユーザーID、フィールド名など
  assignees JSONB DEFAULT '[]', -- 並行承認時の複数承認者
  require_all BOOLEAN DEFAULT TRUE, -- 並行承認時、全員必要か
  actions JSONB DEFAULT '["approve", "reject"]',
  next_steps JSONB DEFAULT '{}', -- { "approve": "step_2", "reject": "step_revision" }
  notification_settings JSONB DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workflow_id, code)
);

-- ワークフロー実行インスタンス
CREATE TABLE workflow_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID NOT NULL,
  current_step_id UUID REFERENCES workflow_steps(id),
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'cancelled'
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 画面定義
CREATE TABLE page_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  path VARCHAR(255), -- URL path
  page_type VARCHAR(50), -- 'list', 'detail', 'form', 'dashboard'
  entity_type VARCHAR(100),
  layout JSONB DEFAULT '{}',
  components JSONB DEFAULT '[]',
  permissions JSONB DEFAULT '[]', -- 閲覧可能なロール
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, code)
);

-- ============================================
-- 10. 承認履歴・通知・ログ
-- ============================================

-- 承認履歴
CREATE TABLE approval_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_instance_id UUID REFERENCES workflow_instances(id) ON DELETE CASCADE,
  step_id UUID REFERENCES workflow_steps(id),
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'submit', 'approve', 'reject', 'revision'
  from_status VARCHAR(100),
  to_status VARCHAR(100),
  comment TEXT,
  acted_by UUID REFERENCES users(id),
  acted_by_name VARCHAR(255),
  acted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 通知
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  notification_type VARCHAR(50) DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
  category VARCHAR(50), -- 'contract_request', 'plan_request', 'system'
  entity_type VARCHAR(100),
  entity_id UUID,
  link_url TEXT,
  link_label VARCHAR(100),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 操作ログ
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 11. インデックス
-- ============================================

-- 顧客
CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_customers_pipeline_status ON customers(tenant_id, pipeline_status);
CREATE INDEX idx_customers_assigned_to ON customers(assigned_to);
CREATE INDEX idx_customers_name ON customers(tenant_id, name);

-- 資金計画書
CREATE INDEX idx_fund_plans_tenant ON fund_plans(tenant_id);
CREATE INDEX idx_fund_plans_customer ON fund_plans(customer_id);

-- 契約依頼
CREATE INDEX idx_contract_requests_tenant ON contract_requests(tenant_id);
CREATE INDEX idx_contract_requests_customer ON contract_requests(customer_id);
CREATE INDEX idx_contract_requests_status ON contract_requests(tenant_id, workflow_status);

-- 契約書
CREATE INDEX idx_contracts_tenant ON contracts(tenant_id);
CREATE INDEX idx_contracts_customer ON contracts(customer_id);

-- プラン依頼
CREATE INDEX idx_plan_requests_tenant ON plan_requests(tenant_id);
CREATE INDEX idx_plan_requests_customer ON plan_requests(customer_id);
CREATE INDEX idx_plan_requests_status ON plan_requests(tenant_id, status);
CREATE INDEX idx_plan_requests_assigned ON plan_requests(assigned_to);

-- 引継書
CREATE INDEX idx_handovers_tenant ON handovers(tenant_id);
CREATE INDEX idx_handovers_customer ON handovers(customer_id);

-- 通知
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(user_id, created_at DESC);

-- ワークフロー
CREATE INDEX idx_workflow_instances_entity ON workflow_instances(entity_type, entity_id);

-- ============================================
-- 12. 初期データ
-- ============================================

-- デフォルトテナント
INSERT INTO tenants (id, name, code) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Gハウス', 'ghouse');

-- デフォルトユーザー（開発用）
INSERT INTO users (id, tenant_id, email, name, department, role) VALUES
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'sales@g-house.com', '田畑 美香', '営業部', 'staff'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', 'leader@g-house.com', '佐藤 部長', '営業部', 'sales_leader'),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001', 'admin@g-house.com', '営業事務', '営業部', 'sales_admin'),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000001', 'design_mgr@g-house.com', '設計部門長', '設計部', 'design_manager'),
  ('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000001', 'const_mgr@g-house.com', '工事部門長', '工事部', 'construction_manager'),
  ('00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000001', 'design@g-house.com', '設計担当', '設計部', 'design'),
  ('00000000-0000-0000-0000-000000000107', '00000000-0000-0000-0000-000000000001', 'cad@g-house.com', 'CAD担当', '設計部', 'cad'),
  ('00000000-0000-0000-0000-000000000108', '00000000-0000-0000-0000-000000000001', 'ic@g-house.com', 'IC担当', '設計部', 'ic'),
  ('00000000-0000-0000-0000-000000000109', '00000000-0000-0000-0000-000000000001', 'site@g-house.com', '現場監督', '工事部', 'site_supervisor'),
  ('00000000-0000-0000-0000-000000000110', '00000000-0000-0000-0000-000000000001', 'exterior@g-house.com', '外構担当', '工事部', 'exterior'),
  ('00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000001', 'hq@g-house.com', '本部管理者', '本部', 'headquarters');

-- デフォルトワークフロー（契約依頼）
INSERT INTO workflow_definitions (id, tenant_id, code, name, entity_type) VALUES
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000001', 'contract_request_approval', '契約依頼承認フロー', 'contract_request');

INSERT INTO workflow_steps (id, workflow_id, code, name, step_type, assignee_type, assignee_value, actions, next_steps, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000201', 'leader_review', '営業リーダー確認', 'approval', 'role', 'sales_leader', '["approve", "reject"]', '{"approve": "manager_review", "reject": "revision"}', 1),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000201', 'manager_review', '設計・工事部門長確認', 'parallel_approval', 'role', null, '["approve", "reject"]', '{"approve": "complete", "reject": "revision"}', 2),
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000201', 'revision', '修正', 'revision', 'creator', null, '["submit"]', '{"submit": "leader_review"}', 3),
  ('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000201', 'complete', '完了', 'notify', 'role', 'sales_admin', '[]', '{}', 4);

-- manager_review の並行承認者を設定
UPDATE workflow_steps
SET assignees = '[{"role": "design_manager"}, {"role": "construction_manager"}]'::jsonb,
    require_all = TRUE
WHERE id = '00000000-0000-0000-0000-000000000302';

-- ============================================
-- 13. RLSポリシー（Row Level Security）
-- ============================================

-- RLSを有効化
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE handovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 開発中はRLSポリシーを緩めに設定（全アクセス許可）
-- 本番環境では適切なポリシーに変更すること

CREATE POLICY "Allow all for development" ON tenants FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON users FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON customers FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON fund_plans FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON contract_requests FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON contracts FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON plan_requests FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON handovers FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON notifications FOR ALL USING (true);
