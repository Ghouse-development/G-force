-- =============================================
-- 住宅ローン金利情報テーブル
-- =============================================

CREATE TABLE IF NOT EXISTS loan_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name TEXT NOT NULL,                    -- 銀行名
  bank_code TEXT,                             -- 銀行コード
  rate_type TEXT NOT NULL,                    -- 金利タイプ（変動、固定10年、固定35年等）
  rate DECIMAL(5, 3) NOT NULL,                -- 金利（%）
  rate_date DATE NOT NULL,                    -- 金利適用日
  previous_rate DECIMAL(5, 3),                -- 前回金利
  rate_change DECIMAL(5, 3),                  -- 変動幅
  source_url TEXT,                            -- 情報取得元URL
  fetched_at TIMESTAMPTZ DEFAULT NOW(),       -- 取得日時
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(bank_name, rate_type, rate_date)
);

-- 金利変更履歴テーブル
CREATE TABLE IF NOT EXISTS loan_rate_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name TEXT NOT NULL,
  rate_type TEXT NOT NULL,
  old_rate DECIMAL(5, 3),
  new_rate DECIMAL(5, 3),
  change_amount DECIMAL(5, 3),
  change_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 住宅ローンニュース
-- =============================================

CREATE TABLE IF NOT EXISTS loan_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,                        -- ニュースタイトル
  summary TEXT,                               -- 要約
  content TEXT,                               -- 本文
  source TEXT NOT NULL,                       -- 情報源（住宅金融支援機構、銀行名等）
  source_url TEXT,                            -- 元記事URL
  published_at DATE,                          -- 公開日
  category TEXT,                              -- カテゴリ（金利変更、制度変更、キャンペーン等）
  importance TEXT DEFAULT 'normal',           -- 重要度（high, normal, low）
  is_notified BOOLEAN DEFAULT FALSE,          -- 通知済みフラグ
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 不動産物件アラート（お客様の条件）
-- =============================================

CREATE TABLE IF NOT EXISTS property_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  alert_name TEXT NOT NULL,                   -- アラート名
  is_active BOOLEAN DEFAULT TRUE,

  -- 条件
  areas JSONB,                                -- エリア条件（市区町村リスト）
  min_price INTEGER,                          -- 最低価格
  max_price INTEGER,                          -- 最高価格
  min_land_area DECIMAL(10, 2),               -- 最低土地面積（㎡）
  max_land_area DECIMAL(10, 2),               -- 最高土地面積（㎡）
  land_shape_preferences JSONB,               -- 土地形状の希望（整形地等）
  road_width_min DECIMAL(5, 2),               -- 前面道路幅員（最低）
  building_coverage_max DECIMAL(5, 2),        -- 建ぺい率（最大）
  floor_area_ratio_min DECIMAL(5, 2),         -- 容積率（最低）
  station_walk_max INTEGER,                   -- 駅徒歩（最大分）
  keywords JSONB,                             -- キーワード
  exclude_keywords JSONB,                     -- 除外キーワード

  -- 通知設定
  notify_email BOOLEAN DEFAULT TRUE,
  notify_app BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 物件情報（クロールした物件）
-- =============================================

CREATE TABLE IF NOT EXISTS crawled_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,                       -- 情報源（suumo, athome等）
  source_id TEXT NOT NULL,                    -- 元サイトでのID
  source_url TEXT NOT NULL,                   -- 物件URL

  -- 物件情報
  title TEXT,
  price INTEGER,                              -- 価格（万円）
  address TEXT,                               -- 住所
  area TEXT,                                  -- エリア（市区町村）
  land_area DECIMAL(10, 2),                   -- 土地面積（㎡）
  building_area DECIMAL(10, 2),               -- 建物面積（㎡）
  building_coverage DECIMAL(5, 2),            -- 建ぺい率（%）
  floor_area_ratio DECIMAL(5, 2),             -- 容積率（%）
  road_width DECIMAL(5, 2),                   -- 前面道路幅員（m）
  road_direction TEXT,                        -- 道路方向
  land_shape TEXT,                            -- 土地形状
  station_name TEXT,                          -- 最寄り駅
  station_walk INTEGER,                       -- 駅徒歩（分）

  -- メタ情報
  images JSONB,                               -- 画像URL配列
  raw_data JSONB,                             -- 生データ
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),    -- 初回発見日時
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),     -- 最終確認日時
  is_available BOOLEAN DEFAULT TRUE,          -- 掲載中フラグ

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(source, source_id)
);

-- =============================================
-- 物件マッチング通知
-- =============================================

CREATE TABLE IF NOT EXISTS property_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES property_alerts(id) ON DELETE CASCADE,
  property_id UUID REFERENCES crawled_properties(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,

  match_score DECIMAL(5, 2),                  -- マッチ度（%）
  match_details JSONB,                        -- マッチした条件の詳細

  is_read BOOLEAN DEFAULT FALSE,
  is_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(alert_id, property_id)
);

-- =============================================
-- クロール実行ログ
-- =============================================

CREATE TABLE IF NOT EXISTS crawl_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crawl_type TEXT NOT NULL,                   -- loan_rates, loan_news, properties
  source TEXT,                                -- 取得元
  status TEXT NOT NULL,                       -- success, error, partial
  items_fetched INTEGER DEFAULT 0,
  items_new INTEGER DEFAULT 0,
  items_updated INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_loan_rates_bank_date ON loan_rates(bank_name, rate_date);
CREATE INDEX IF NOT EXISTS idx_loan_news_published ON loan_news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_property_alerts_customer ON property_alerts(customer_id);
CREATE INDEX IF NOT EXISTS idx_crawled_properties_area ON crawled_properties(area);
CREATE INDEX IF NOT EXISTS idx_crawled_properties_price ON crawled_properties(price);
CREATE INDEX IF NOT EXISTS idx_property_notifications_customer ON property_notifications(customer_id, is_read);

-- RLS
ALTER TABLE loan_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_rate_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawled_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawl_logs ENABLE ROW LEVEL SECURITY;

-- ポリシー（認証ユーザーは閲覧可能）
CREATE POLICY "Authenticated users can view loan_rates" ON loan_rates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view loan_news" ON loan_news FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage own property_alerts" ON property_alerts FOR ALL TO authenticated
  USING (customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()));
CREATE POLICY "Authenticated users can view crawled_properties" ON crawled_properties FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view own property_notifications" ON property_notifications FOR SELECT TO authenticated
  USING (customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()));
