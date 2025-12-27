-- =============================================
-- ノーコード設定基盤
-- 管理者がコード変更なしで設定を変更できる
-- =============================================

-- =============================================
-- パイプラインステータス設定
-- =============================================
CREATE TABLE IF NOT EXISTS pipeline_status_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),

  -- ステータス情報
  status_key TEXT NOT NULL,  -- 内部キー
  label TEXT NOT NULL,       -- 表示名
  category TEXT NOT NULL,    -- カテゴリ（pre_member, pre_contract, post_contract, owner, lost）

  -- 表示設定
  color TEXT DEFAULT 'gray',
  bg_color TEXT DEFAULT 'bg-gray-100',
  icon TEXT DEFAULT 'Circle',

  -- 順序・フラグ
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  is_lost BOOLEAN DEFAULT FALSE,  -- ボツ・他決かどうか

  -- メタ情報
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(tenant_id, status_key)
);

-- デフォルトステータスを挿入
INSERT INTO pipeline_status_settings (status_key, label, category, color, bg_color, sort_order) VALUES
-- 限定会員前
('資料請求', '資料請求', 'pre_member', 'text-slate-600', 'bg-slate-100', 10),
('イベント予約', 'イベント予約', 'pre_member', 'text-purple-600', 'bg-purple-100', 20),
('イベント参加', 'イベント参加', 'pre_member', 'text-purple-700', 'bg-purple-200', 30),
-- 契約前
('限定会員', '限定会員', 'pre_contract', 'text-blue-600', 'bg-blue-100', 40),
('面談', '面談', 'pre_contract', 'text-indigo-600', 'bg-indigo-100', 50),
('建築申込', '建築申込', 'pre_contract', 'text-orange-600', 'bg-orange-100', 60),
('プラン提出', 'プラン提出', 'pre_contract', 'text-amber-600', 'bg-amber-100', 70),
('内定', '内定', 'pre_contract', 'text-red-600', 'bg-red-100', 80),
-- 契約後
('変更契約前', '変更契約前', 'post_contract', 'text-emerald-600', 'bg-emerald-100', 90),
('変更契約後', '変更契約後', 'post_contract', 'text-green-600', 'bg-green-100', 100),
-- オーナー
('オーナー', 'オーナー', 'owner', 'text-teal-700', 'bg-teal-200', 110),
-- ボツ
('ボツ・他決', 'ボツ・他決', 'lost', 'text-gray-500', 'bg-gray-200', 999)
ON CONFLICT DO NOTHING;

-- =============================================
-- ジャーニーイベント種別設定
-- =============================================
CREATE TABLE IF NOT EXISTS journey_event_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),

  -- イベント情報
  event_key TEXT NOT NULL,
  label TEXT NOT NULL,
  category TEXT NOT NULL,  -- 初期接触, イベント, 商談, 土地, 契約プロセス, 着工後, その他

  -- 表示設定
  color TEXT DEFAULT 'text-gray-600',
  bg_color TEXT DEFAULT 'bg-gray-100',
  icon TEXT DEFAULT 'Circle',

  -- 順序・フラグ
  sort_order INTEGER DEFAULT 0,
  is_key_milestone BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,

  -- メタ情報
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(tenant_id, event_key)
);

-- =============================================
-- チェックリスト項目設定
-- =============================================
CREATE TABLE IF NOT EXISTS checklist_item_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),

  -- 項目情報
  item_key TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,

  -- 表示条件
  target_status TEXT,  -- どのステータスで表示するか（NULLは全て）
  target_category TEXT,  -- pre_member, pre_contract, post_contract, owner

  -- 順序・フラグ
  sort_order INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,

  -- メタ情報
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(tenant_id, item_key)
);

-- =============================================
-- 土地条件オプション設定
-- =============================================
CREATE TABLE IF NOT EXISTS land_condition_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),

  -- オプション情報
  option_key TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,  -- shape(形状), condition(条件), exclusion(除外)

  -- 順序・フラグ
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  default_value BOOLEAN DEFAULT FALSE,  -- デフォルトでチェックされるか

  -- メタ情報
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(tenant_id, option_key)
);

-- デフォルトの土地条件オプション
INSERT INTO land_condition_options (option_key, label, description, category, sort_order, default_value) VALUES
-- 形状
('整形地', '整形地', '長方形・正方形の土地', 'shape', 10, true),
('旗竿地', '旗竿地', '旗竿状の形状の土地', 'shape', 20, false),
('不整形地', '不整形地', 'L字型など変形地', 'shape', 30, false),
('傾斜地', '傾斜地', '傾斜のある土地', 'shape', 40, false),
-- 条件
('建築条件付き', '建築条件付き土地OK', '建築条件付きでも検討可', 'condition', 50, false),
('古家付き', '古家付きOK', '解体が必要な古家があってもOK', 'condition', 60, true),
('セットバック', 'セットバックあり可', 'セットバックが必要な土地も可', 'condition', 70, true),
-- 除外
('崖地除外', '崖地は除外', '急傾斜地は検討対象外', 'exclusion', 80, true),
('再建築不可除外', '再建築不可は除外', '再建築不可物件は除外', 'exclusion', 90, true)
ON CONFLICT DO NOTHING;

-- =============================================
-- フォーム項目設定（将来の拡張用）
-- =============================================
CREATE TABLE IF NOT EXISTS form_field_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),

  -- フォーム情報
  form_key TEXT NOT NULL,  -- plan_request, contract_request, fund_plan
  field_key TEXT NOT NULL,
  label TEXT NOT NULL,
  field_type TEXT NOT NULL,  -- text, number, date, select, multiselect, checkbox

  -- オプション
  options JSONB,  -- 選択肢（select/multiselectの場合）
  placeholder TEXT,
  default_value TEXT,

  -- バリデーション
  is_required BOOLEAN DEFAULT FALSE,
  validation_rules JSONB,

  -- 表示設定
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  show_in_list BOOLEAN DEFAULT FALSE,  -- 一覧画面に表示するか

  -- メタ情報
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(tenant_id, form_key, field_key)
);

-- RLSポリシー
ALTER TABLE pipeline_status_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_event_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_item_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE land_condition_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_field_settings ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが閲覧可能
CREATE POLICY "Anyone can view settings" ON pipeline_status_settings FOR SELECT USING (true);
CREATE POLICY "Anyone can view journey settings" ON journey_event_settings FOR SELECT USING (true);
CREATE POLICY "Anyone can view checklist settings" ON checklist_item_settings FOR SELECT USING (true);
CREATE POLICY "Anyone can view land options" ON land_condition_options FOR SELECT USING (true);
CREATE POLICY "Anyone can view form settings" ON form_field_settings FOR SELECT USING (true);

-- 管理者のみ編集可能（将来実装）
-- CREATE POLICY "Admins can edit settings" ON pipeline_status_settings FOR ALL USING (is_admin());

-- コメント
COMMENT ON TABLE pipeline_status_settings IS 'パイプラインステータスの設定（ノーコード管理）';
COMMENT ON TABLE journey_event_settings IS 'ジャーニーイベント種別の設定（ノーコード管理）';
COMMENT ON TABLE checklist_item_settings IS 'チェックリスト項目の設定（ノーコード管理）';
COMMENT ON TABLE land_condition_options IS '土地条件オプションの設定（ノーコード管理）';
COMMENT ON TABLE form_field_settings IS 'フォーム項目の設定（ノーコード管理）';
