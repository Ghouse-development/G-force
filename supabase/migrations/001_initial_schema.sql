-- G-force Initial Schema Migration
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TENANTS (テナント)
-- ============================================
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#f97316',
  fiscal_year_start_month INTEGER DEFAULT 8,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USERS (ユーザー)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  department TEXT CHECK (department IN ('営業部', '設計部', 'IC', '工事部')),
  role TEXT DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PRODUCTS (商品マスタ)
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_per_tsubo INTEGER,
  base_price_per_tsubo INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CUSTOMERS (顧客)
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  tei_name TEXT,
  name TEXT NOT NULL,
  name_kana TEXT,
  partner_name TEXT,
  partner_name_kana TEXT,
  ownership_type TEXT DEFAULT '単独' CHECK (ownership_type IN ('単独', '共有')),
  phone TEXT,
  phone2 TEXT,
  email TEXT,
  postal_code TEXT,
  address TEXT,
  -- パイプライン
  pipeline_status TEXT DEFAULT '反響' CHECK (pipeline_status IN (
    '反響', 'イベント参加', '限定会員', '面談', '建築申込', '内定',
    'ボツ', '他決', '契約', '着工', '引渡', '引渡済'
  )),
  lead_source TEXT CHECK (lead_source IN (
    '資料請求', 'モデルハウス見学会予約', 'オーナー紹介', '社員紹介',
    '業者紹介', 'TEL問合せ', 'HP問合せ', 'Instagram', 'その他'
  )),
  lead_date DATE,
  event_date DATE,
  member_date DATE,
  meeting_date DATE,
  application_date DATE,
  decision_date DATE,
  contract_date DATE,
  groundbreaking_date DATE,
  handover_date DATE,
  lost_date DATE,
  lost_reason TEXT,
  -- 担当
  assigned_to UUID REFERENCES users(id),
  sub_assigned_to UUID REFERENCES users(id),
  -- 物件
  land_area NUMERIC,
  building_area NUMERIC,
  product_id UUID REFERENCES products(id),
  estimated_amount BIGINT,
  contract_amount BIGINT,
  -- その他
  notes TEXT,
  kintone_record_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PLAN_REQUESTS (プラン依頼)
-- ============================================
CREATE TABLE IF NOT EXISTS plan_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tei_name TEXT,
  customer_name TEXT,
  partner_name TEXT,
  ownership_type TEXT DEFAULT '単独',
  requested_by UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  designer_name TEXT,
  presenter_name TEXT,
  design_office TEXT CHECK (design_office IN (
    'ラリーケー', 'ライフプラス', 'Nデザイン', 'L&A', 'JIN', 'その他'
  )),
  status TEXT DEFAULT '新規依頼' CHECK (status IN (
    '新規依頼', '役調依頼中', '役調完了', 'チェック待ち', '設計割り振り',
    '設計中', 'プレゼン作成中', '確認待ち', '修正依頼', '完了'
  )),
  -- 日程
  proposal_date DATE,
  contract_date DATE,
  deadline DATE,
  investigation_deadline DATE,
  -- 商品・仕上がり
  product_name TEXT,
  deliverable_type TEXT CHECK (deliverable_type IN (
    'ラフプラン', 'プレゼン（パース無）', 'プレゼン（パース有）', '契約図'
  )),
  -- 土地情報
  land_address TEXT,
  land_lot_number TEXT,
  land_area NUMERIC,
  building_area NUMERIC,
  floors INTEGER,
  land_status TEXT CHECK (land_status IN ('決済済', '買付提出済', '土地検討中', '所有地')),
  construction_area TEXT CHECK (construction_area IN ('Gハウス施工', '業者施工')),
  land_marked BOOLEAN DEFAULT FALSE,
  -- 調査関連
  investigation_type TEXT CHECK (investigation_type IN ('ネット/TEL調査', '役所往訪')),
  water_survey_needed BOOLEAN DEFAULT FALSE,
  demolition_needed BOOLEAN DEFAULT FALSE,
  land_development_needed BOOLEAN DEFAULT FALSE,
  -- 競合
  has_competitor BOOLEAN DEFAULT FALSE,
  competitor_name TEXT,
  -- 世帯
  household_type TEXT,
  -- 希望条件
  preferred_rooms TEXT,
  preferred_style TEXT,
  budget_min BIGINT,
  budget_max BIGINT,
  -- 備考
  request_details TEXT,
  notes TEXT,
  -- ファイル関連
  photo_date DATE,
  hearing_sheet_date DATE,
  attachments JSONB,
  drive_folder_url TEXT,
  -- 役調関連
  investigation_notes TEXT,
  investigation_completed_at TIMESTAMPTZ,
  investigation_pdf_url TEXT,
  -- 完了情報
  completed_at TIMESTAMPTZ,
  plan_url TEXT,
  presentation_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FUND_PLANS (資金計画書)
-- ============================================
CREATE TABLE IF NOT EXISTS fund_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  version INTEGER DEFAULT 1,
  data JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONTRACTS (契約書)
-- ============================================
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  fund_plan_id UUID REFERENCES fund_plans(id),
  status TEXT DEFAULT '作成中' CHECK (status IN ('作成中', '書類確認', '上長承認待ち', '契約完了')),
  contract_number TEXT,
  contract_date DATE,
  tei_name TEXT,
  customer_name TEXT,
  partner_name TEXT,
  ownership_type TEXT DEFAULT '単独',
  -- 担当者
  sales_person TEXT,
  design_person TEXT,
  construction_person TEXT,
  ic_person TEXT,
  -- 物件情報
  land_address TEXT,
  land_area NUMERIC,
  building_area NUMERIC,
  product_name TEXT,
  -- 金額
  building_price BIGINT,
  option_price BIGINT,
  exterior_price BIGINT,
  other_price BIGINT,
  discount_amount BIGINT,
  tax_amount BIGINT,
  total_amount BIGINT,
  -- 支払い条件
  payment_at_contract BIGINT,
  payment_at_start BIGINT,
  payment_at_frame BIGINT,
  payment_at_completion BIGINT,
  -- 本人確認
  identity_verified BOOLEAN DEFAULT FALSE,
  identity_doc_type TEXT,
  identity_verified_date DATE,
  identity_verified_by UUID REFERENCES users(id),
  -- ローン
  loan_type TEXT,
  loan_bank TEXT,
  loan_amount BIGINT,
  loan_approved BOOLEAN DEFAULT FALSE,
  loan_approved_date DATE,
  -- 重要事項
  important_notes TEXT,
  important_notes_date DATE,
  -- 添付ファイル
  attachments JSONB,
  -- 承認フロー
  created_by UUID REFERENCES users(id),
  created_by_name TEXT,
  checked_by UUID REFERENCES users(id),
  checked_by_name TEXT,
  checked_at TIMESTAMPTZ,
  check_comment TEXT,
  approved_by UUID REFERENCES users(id),
  approved_by_name TEXT,
  approved_at TIMESTAMPTZ,
  approval_comment TEXT,
  returned_by UUID REFERENCES users(id),
  returned_by_name TEXT,
  returned_at TIMESTAMPTZ,
  return_comment TEXT,
  return_count INTEGER DEFAULT 0,
  -- 指定承認者
  designated_checker_id UUID REFERENCES users(id),
  designated_checker_name TEXT,
  designated_approver_id UUID REFERENCES users(id),
  designated_approver_name TEXT,
  -- 履歴
  history JSONB DEFAULT '[]',
  notes TEXT,
  kintone_record_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- HANDOVERS (引継書)
-- ============================================
CREATE TABLE IF NOT EXISTS handovers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(id),
  from_user_id UUID REFERENCES users(id),
  to_user_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  customer_notes TEXT,
  site_notes TEXT,
  schedule_notes TEXT,
  special_notes TEXT,
  checklist JSONB,
  confirmed_by UUID REFERENCES users(id),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ACTIVITIES (活動履歴)
-- ============================================
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  activity_date DATE NOT NULL,
  next_action TEXT,
  next_action_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SALES_TARGETS (営業目標)
-- ============================================
CREATE TABLE IF NOT EXISTS sales_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  fiscal_year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  target_leads INTEGER DEFAULT 0,
  target_meetings INTEGER DEFAULT 0,
  target_applications INTEGER DEFAULT 0,
  target_contracts INTEGER DEFAULT 0,
  target_amount BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, user_id, fiscal_year, month)
);

-- ============================================
-- FILES (ファイル管理)
-- ============================================
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  category TEXT DEFAULT 'document' CHECK (category IN ('document', 'audio', 'image', 'memo')),
  memo_content TEXT,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BACKUPS (バックアップ履歴)
-- ============================================
CREATE TABLE IF NOT EXISTS backups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  backup_type TEXT NOT NULL CHECK (backup_type IN ('full', 'incremental', 'manual')),
  storage_path TEXT NOT NULL,
  size_bytes BIGINT,
  tables_included TEXT[],
  record_counts JSONB,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  error_message TEXT
);

-- ============================================
-- KINTONE_SYNC_LOG (Kintone同期ログ)
-- ============================================
CREATE TABLE IF NOT EXISTS kintone_sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  kintone_record_id TEXT,
  sync_direction TEXT NOT NULL CHECK (sync_direction IN ('to_kintone', 'from_kintone')),
  sync_status TEXT NOT NULL CHECK (sync_status IN ('pending', 'success', 'failed')),
  error_message TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_pipeline ON customers(pipeline_status);
CREATE INDEX IF NOT EXISTS idx_customers_assigned ON customers(assigned_to);
CREATE INDEX IF NOT EXISTS idx_plan_requests_customer ON plan_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_plan_requests_status ON plan_requests(status);
CREATE INDEX IF NOT EXISTS idx_contracts_customer ON contracts(customer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_fund_plans_customer ON fund_plans(customer_id);
CREATE INDEX IF NOT EXISTS idx_activities_customer ON activities(customer_id);
CREATE INDEX IF NOT EXISTS idx_files_customer ON files(customer_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE handovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;

-- Policies (簡易版 - 全てのauthenticated userにアクセス許可)
CREATE POLICY "Allow authenticated users" ON tenants FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users" ON users FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users" ON customers FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users" ON products FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users" ON plan_requests FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users" ON fund_plans FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users" ON contracts FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users" ON handovers FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users" ON activities FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users" ON sales_targets FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users" ON files FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users" ON backups FOR ALL TO authenticated USING (true);

-- ============================================
-- TRIGGERS FOR updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER plan_requests_updated_at BEFORE UPDATE ON plan_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER fund_plans_updated_at BEFORE UPDATE ON fund_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER contracts_updated_at BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER handovers_updated_at BEFORE UPDATE ON handovers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- INITIAL DATA (Default Tenant)
-- ============================================
INSERT INTO tenants (id, name, subdomain, fiscal_year_start_month)
VALUES ('00000000-0000-0000-0000-000000000001', 'Gハウス', 'ghouse', 8)
ON CONFLICT (id) DO NOTHING;

-- Default Products
INSERT INTO products (tenant_id, name, price_per_tsubo, base_price_per_tsubo, sort_order) VALUES
('00000000-0000-0000-0000-000000000001', 'LIFE', 760000, 550000, 1),
('00000000-0000-0000-0000-000000000001', 'LIFE+', 710000, 630000, 2),
('00000000-0000-0000-0000-000000000001', 'HOURS', 680000, NULL, 3),
('00000000-0000-0000-0000-000000000001', 'LACIE', 630000, NULL, 4),
('00000000-0000-0000-0000-000000000001', 'LIFE Limited', 500000, 500000, 5),
('00000000-0000-0000-0000-000000000001', 'LIFE+ Limited', 550000, 550000, 6),
('00000000-0000-0000-0000-000000000001', 'G-SMART平屋', NULL, 680000, 7),
('00000000-0000-0000-0000-000000000001', 'G-SMART平屋 Limited', NULL, 630000, 8),
('00000000-0000-0000-0000-000000000001', 'G-SMART平屋+', NULL, 760000, 9),
('00000000-0000-0000-0000-000000000001', 'G-SMART平屋+ Limited', NULL, 710000, 10)
ON CONFLICT DO NOTHING;

-- Default Users
INSERT INTO users (id, tenant_id, email, name, department, role) VALUES
('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'tabata@g-house.com', '田畑 美香', '営業部', 'staff'),
('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', 'sako@g-house.com', '佐古 祐太', '営業部', 'staff'),
('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001', 'tokuda@g-house.com', '德田 耕明', '営業部', 'staff'),
('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000001', 'nishino@g-house.com', '西野 秀樹', '営業部', 'manager'),
('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000001', 'admin@g-house.com', '管理者', NULL, 'admin')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE BUCKET FOR FILES
-- ============================================
-- Run this separately in Supabase Dashboard > Storage
-- INSERT INTO storage.buckets (id, name, public) VALUES ('gforce-files', 'gforce-files', false);
