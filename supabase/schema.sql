-- Gハウス業務システム データベーススキーマ v2
-- Supabase SQL Editor で実行してください
-- 期首: 8月1日、期末: 7月31日（引渡ベース）

-- ========================================
-- 既存テーブル削除（開発環境のみ）
-- ========================================
-- DROP TABLE IF EXISTS activities CASCADE;
-- DROP TABLE IF EXISTS handovers CASCADE;
-- DROP TABLE IF EXISTS contracts CASCADE;
-- DROP TABLE IF EXISTS plan_requests CASCADE;
-- DROP TABLE IF EXISTS fund_plans CASCADE;
-- DROP TABLE IF EXISTS sales_targets CASCADE;
-- DROP TABLE IF EXISTS customers CASCADE;
-- DROP TABLE IF EXISTS products CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP TABLE IF EXISTS tenants CASCADE;

-- ========================================
-- テナント（マルチテナント対応）
-- ========================================
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#F97316',
  fiscal_year_start_month INTEGER DEFAULT 8, -- 期首月（Gハウスは8月）
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- ユーザー
-- ========================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  department TEXT CHECK (department IN ('営業部', '設計部', 'IC', '工事部')),
  role TEXT CHECK (role IN ('admin', 'manager', 'staff')) DEFAULT 'staff',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 商品マスタ
-- ========================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  price_per_tsubo INTEGER, -- 坪単価（税込）
  base_price_per_tsubo INTEGER, -- 基本坪単価
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 顧客（パイプライン管理）
-- ========================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,

  -- 基本情報
  tei_name TEXT, -- 〇〇様邸
  name TEXT NOT NULL,
  name_kana TEXT,
  partner_name TEXT,
  partner_name_kana TEXT,
  ownership_type TEXT CHECK (ownership_type IN ('単独', '共有')) DEFAULT '単独',

  -- 連絡先
  phone TEXT,
  phone2 TEXT,
  email TEXT,
  postal_code TEXT,
  address TEXT,

  -- パイプライン管理（反響→契約→引渡）
  pipeline_status TEXT CHECK (pipeline_status IN (
    '反響', 'イベント参加', '限定会員', '面談', '建築申込',
    '内定', 'ボツ', '他決', '契約', '着工', '引渡', '引渡済'
  )) DEFAULT '反響',

  -- 反響経路
  lead_source TEXT CHECK (lead_source IN (
    '資料請求', 'モデルハウス見学会予約', 'オーナー紹介', '社員紹介',
    '業者紹介', 'TEL問合せ', 'HP問合せ', 'Instagram', 'その他'
  )),

  -- 各ステージの日付（遷移率計算に使用）
  lead_date DATE, -- 反響日
  event_date DATE, -- イベント参加日
  member_date DATE, -- 会員登録日
  meeting_date DATE, -- 面談日
  application_date DATE, -- 建築申込日
  decision_date DATE, -- 内定日
  contract_date DATE, -- 契約日
  groundbreaking_date DATE, -- 着工日
  handover_date DATE, -- 引渡日（★期の判定に使用）
  lost_date DATE, -- ボツ・他決日
  lost_reason TEXT, -- 失注理由

  -- 担当
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  sub_assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,

  -- 物件情報
  land_area DECIMAL(10,2), -- 土地面積（坪）
  building_area DECIMAL(10,2), -- 建物面積（坪）
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,

  -- 金額
  estimated_amount BIGINT, -- 見込み金額
  contract_amount BIGINT, -- 契約金額

  -- その他
  notes TEXT,
  kintone_record_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- プラン依頼（営業→設計）
-- ========================================
CREATE TABLE IF NOT EXISTS plan_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- 依頼者・担当
  requested_by UUID REFERENCES users(id) ON DELETE SET NULL, -- 依頼者（営業）
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL, -- 担当設計士

  -- ステータス
  status TEXT CHECK (status IN ('依頼中', '作成中', '確認待ち', '修正依頼', '完了')) DEFAULT '依頼中',

  -- 依頼内容
  land_address TEXT, -- 土地住所
  land_area DECIMAL(10,2), -- 土地面積
  request_details TEXT, -- 依頼詳細
  budget_min BIGINT, -- 予算下限
  budget_max BIGINT, -- 予算上限
  preferred_rooms TEXT, -- 希望間取り
  preferred_style TEXT, -- 希望スタイル
  deadline DATE, -- 希望納期

  -- 添付ファイル（JSONで管理）
  attachments JSONB,

  -- 完了情報
  completed_at TIMESTAMPTZ,
  plan_url TEXT, -- 完成プランのURL

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 資金計画書
-- ========================================
CREATE TABLE IF NOT EXISTS fund_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,

  status TEXT CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')) DEFAULT 'draft',
  version INTEGER DEFAULT 1,

  -- 計算データ（JSONB）
  data JSONB NOT NULL DEFAULT '{}',

  -- 承認フロー
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 契約書
-- ========================================
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  fund_plan_id UUID REFERENCES fund_plans(id) ON DELETE SET NULL,

  status TEXT CHECK (status IN ('作成中', '確認中', '承認待ち', '締結済')) DEFAULT '作成中',

  -- 契約情報
  contract_number TEXT, -- 契約番号
  contract_date DATE, -- 契約日
  contract_amount BIGINT, -- 契約金額

  -- 契約詳細（JSONB）
  data JSONB NOT NULL DEFAULT '{}',

  -- 承認フロー
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  checked_by UUID REFERENCES users(id) ON DELETE SET NULL, -- 確認者
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL, -- 承認者
  approved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 引継書（営業→工事）
-- ========================================
CREATE TABLE IF NOT EXISTS handovers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,

  -- 引継ぎ者
  from_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- 営業担当
  to_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- 工事担当

  status TEXT CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')) DEFAULT 'draft',

  -- 引継ぎ内容
  customer_notes TEXT, -- お客様情報
  site_notes TEXT, -- 現場情報
  schedule_notes TEXT, -- スケジュール
  special_notes TEXT, -- 特記事項
  checklist JSONB, -- チェックリスト

  -- 確認
  confirmed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  confirmed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 活動履歴（顧客とのやりとり）
-- ========================================
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- 活動内容
  activity_type TEXT NOT NULL, -- 電話, メール, 来店, 訪問, MH見学, 打合せ
  title TEXT NOT NULL,
  description TEXT,
  activity_date DATE NOT NULL,

  -- 次回アクション
  next_action TEXT,
  next_action_date DATE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 営業目標（期・月別）
-- ========================================
CREATE TABLE IF NOT EXISTS sales_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- 期と月
  fiscal_year INTEGER NOT NULL, -- 期（2024 = 2024年8月〜2025年7月）
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12), -- 月

  -- 目標
  target_leads INTEGER DEFAULT 0, -- 反響目標
  target_meetings INTEGER DEFAULT 0, -- 面談目標
  target_applications INTEGER DEFAULT 0, -- 申込目標
  target_contracts INTEGER DEFAULT 0, -- 契約目標
  target_amount BIGINT DEFAULT 0, -- 金額目標

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- ユニーク制約
  UNIQUE(tenant_id, user_id, fiscal_year, month)
);

-- ========================================
-- インデックス
-- ========================================
CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(pipeline_status);
CREATE INDEX IF NOT EXISTS idx_customers_assigned ON customers(assigned_to);
CREATE INDEX IF NOT EXISTS idx_customers_lead_date ON customers(lead_date);
CREATE INDEX IF NOT EXISTS idx_customers_handover_date ON customers(handover_date);

CREATE INDEX IF NOT EXISTS idx_plan_requests_customer ON plan_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_plan_requests_status ON plan_requests(status);

CREATE INDEX IF NOT EXISTS idx_fund_plans_customer ON fund_plans(customer_id);
CREATE INDEX IF NOT EXISTS idx_fund_plans_status ON fund_plans(status);

CREATE INDEX IF NOT EXISTS idx_contracts_customer ON contracts(customer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);

CREATE INDEX IF NOT EXISTS idx_activities_customer ON activities(customer_id);
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(activity_date);

CREATE INDEX IF NOT EXISTS idx_sales_targets_fiscal ON sales_targets(fiscal_year, month);

-- ========================================
-- RLS（Row Level Security）ポリシー
-- ========================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE handovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_targets ENABLE ROW LEVEL SECURITY;

-- テナント分離ポリシー（全テーブル共通）
CREATE POLICY "tenant_isolation" ON customers
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "tenant_isolation" ON products
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "tenant_isolation" ON plan_requests
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "tenant_isolation" ON fund_plans
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "tenant_isolation" ON contracts
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "tenant_isolation" ON handovers
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "tenant_isolation" ON activities
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "tenant_isolation" ON sales_targets
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- ========================================
-- 自動更新トリガー
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER plan_requests_updated_at
  BEFORE UPDATE ON plan_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER fund_plans_updated_at
  BEFORE UPDATE ON fund_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER handovers_updated_at
  BEFORE UPDATE ON handovers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ========================================
-- 初期データ（Gハウス）
-- ========================================
INSERT INTO tenants (id, name, subdomain, primary_color, fiscal_year_start_month)
VALUES ('00000000-0000-0000-0000-000000000001', 'Gハウス', 'ghouse', '#F97316', 8)
ON CONFLICT DO NOTHING;

-- 商品マスタ（Excelより）
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
('00000000-0000-0000-0000-000000000001', 'G-SMART平屋+ Limited', NULL, 710000, 10),
('00000000-0000-0000-0000-000000000001', 'LIFE X(28～30坪)', NULL, NULL, 11),
('00000000-0000-0000-0000-000000000001', 'LIFE X(30～33坪)', NULL, NULL, 12),
('00000000-0000-0000-0000-000000000001', 'LIFE X(33～35坪)', NULL, NULL, 13),
('00000000-0000-0000-0000-000000000001', 'LIFE X(35～38坪)', NULL, NULL, 14)
ON CONFLICT DO NOTHING;

-- ========================================
-- ビュー（遷移率計算用）
-- ========================================
CREATE OR REPLACE VIEW pipeline_stats AS
SELECT
  tenant_id,
  assigned_to,
  EXTRACT(YEAR FROM lead_date) AS lead_year,
  EXTRACT(MONTH FROM lead_date) AS lead_month,
  pipeline_status,
  lead_source,
  COUNT(*) AS count,
  SUM(CASE WHEN pipeline_status = '反響' THEN 1 ELSE 0 END) AS leads,
  SUM(CASE WHEN pipeline_status = 'イベント参加' THEN 1 ELSE 0 END) AS events,
  SUM(CASE WHEN pipeline_status = '限定会員' THEN 1 ELSE 0 END) AS members,
  SUM(CASE WHEN pipeline_status = '面談' THEN 1 ELSE 0 END) AS meetings,
  SUM(CASE WHEN pipeline_status = '建築申込' THEN 1 ELSE 0 END) AS applications,
  SUM(CASE WHEN pipeline_status = '内定' THEN 1 ELSE 0 END) AS decisions,
  SUM(CASE WHEN pipeline_status = '契約' THEN 1 ELSE 0 END) AS contracts,
  SUM(CASE WHEN pipeline_status IN ('ボツ', '他決') THEN 1 ELSE 0 END) AS lost
FROM customers
WHERE lead_date IS NOT NULL
GROUP BY tenant_id, assigned_to, EXTRACT(YEAR FROM lead_date), EXTRACT(MONTH FROM lead_date), pipeline_status, lead_source;

-- 引渡実績ビュー（期の実績計算用）
CREATE OR REPLACE VIEW handover_stats AS
SELECT
  tenant_id,
  assigned_to,
  -- 期の計算（8月始まり）
  CASE
    WHEN EXTRACT(MONTH FROM handover_date) >= 8 THEN EXTRACT(YEAR FROM handover_date)
    ELSE EXTRACT(YEAR FROM handover_date) - 1
  END AS fiscal_year,
  EXTRACT(MONTH FROM handover_date) AS handover_month,
  COUNT(*) AS handover_count,
  SUM(contract_amount) AS total_amount
FROM customers
WHERE handover_date IS NOT NULL
GROUP BY tenant_id, assigned_to,
  CASE
    WHEN EXTRACT(MONTH FROM handover_date) >= 8 THEN EXTRACT(YEAR FROM handover_date)
    ELSE EXTRACT(YEAR FROM handover_date) - 1
  END,
  EXTRACT(MONTH FROM handover_date);
