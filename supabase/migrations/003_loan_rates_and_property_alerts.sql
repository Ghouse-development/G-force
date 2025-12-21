-- =============================================
-- 住宅ローン金利・不動産アラート機能
-- 統合マイグレーション
-- =============================================

-- =============================================
-- 住宅ローン金利情報テーブル
-- =============================================

CREATE TABLE IF NOT EXISTS loan_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name TEXT NOT NULL,
  bank_code TEXT,
  rate_type TEXT NOT NULL,
  rate DECIMAL(5, 3) NOT NULL,
  rate_date DATE NOT NULL,
  previous_rate DECIMAL(5, 3),
  rate_change DECIMAL(5, 3),
  source_url TEXT,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(bank_name, rate_type, rate_date)
);

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
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  source TEXT NOT NULL,
  source_url TEXT,
  published_at DATE,
  category TEXT,
  importance TEXT DEFAULT 'normal',
  is_notified BOOLEAN DEFAULT FALSE,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 不動産物件アラート（お客様の条件）
-- =============================================

CREATE TABLE IF NOT EXISTS property_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  alert_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  areas JSONB,
  min_price INTEGER,
  max_price INTEGER,
  min_land_area DECIMAL(10, 2),
  max_land_area DECIMAL(10, 2),
  land_shape_preferences JSONB,
  road_width_min DECIMAL(5, 2),
  building_coverage_max DECIMAL(5, 2),
  floor_area_ratio_min DECIMAL(5, 2),
  station_walk_max INTEGER,
  keywords JSONB,
  exclude_keywords JSONB,
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
  source TEXT NOT NULL,
  source_id TEXT NOT NULL,
  source_url TEXT NOT NULL,
  title TEXT,
  price INTEGER,
  address TEXT,
  area TEXT,
  land_area DECIMAL(10, 2),
  building_area DECIMAL(10, 2),
  building_coverage DECIMAL(5, 2),
  floor_area_ratio DECIMAL(5, 2),
  road_width DECIMAL(5, 2),
  road_direction TEXT,
  land_shape TEXT,
  station_name TEXT,
  station_walk INTEGER,
  images JSONB,
  raw_data JSONB,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  is_available BOOLEAN DEFAULT TRUE,
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
  match_score DECIMAL(5, 2),
  match_details JSONB,
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
  crawl_type TEXT NOT NULL,
  source TEXT,
  status TEXT NOT NULL,
  items_fetched INTEGER DEFAULT 0,
  items_new INTEGER DEFAULT 0,
  items_updated INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- インデックス
-- =============================================

CREATE INDEX IF NOT EXISTS idx_loan_rates_bank_date ON loan_rates(bank_name, rate_date);
CREATE INDEX IF NOT EXISTS idx_loan_rates_type ON loan_rates(rate_type);
CREATE INDEX IF NOT EXISTS idx_loan_news_published ON loan_news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_property_alerts_customer ON property_alerts(customer_id);
CREATE INDEX IF NOT EXISTS idx_property_alerts_active ON property_alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_crawled_properties_area ON crawled_properties(area);
CREATE INDEX IF NOT EXISTS idx_crawled_properties_price ON crawled_properties(price);
CREATE INDEX IF NOT EXISTS idx_crawled_properties_available ON crawled_properties(is_available);
CREATE INDEX IF NOT EXISTS idx_property_notifications_customer ON property_notifications(customer_id, is_read);

-- =============================================
-- RLS
-- =============================================

ALTER TABLE loan_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_rate_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawled_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawl_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- ポリシー（認証ユーザーは全てアクセス可能）
-- =============================================

CREATE POLICY "Allow authenticated" ON loan_rates FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON loan_rate_history FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON loan_news FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON property_alerts FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON crawled_properties FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON property_notifications FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON crawl_logs FOR ALL TO authenticated USING (true);

-- =============================================
-- サンプルデータ: 住宅ローン金利
-- =============================================

INSERT INTO loan_rates (bank_name, bank_code, rate_type, rate, rate_date, previous_rate, rate_change) VALUES
  ('住信SBIネット銀行', 'sbi', '変動', 0.298, CURRENT_DATE, 0.320, -0.022),
  ('住信SBIネット銀行', 'sbi', '固定10年', 1.050, CURRENT_DATE, 1.100, -0.050),
  ('住信SBIネット銀行', 'sbi', '固定35年', 1.580, CURRENT_DATE, 1.620, -0.040),
  ('auじぶん銀行', 'aujibun', '変動', 0.319, CURRENT_DATE, 0.340, -0.021),
  ('auじぶん銀行', 'aujibun', '固定10年', 1.080, CURRENT_DATE, 1.120, -0.040),
  ('PayPay銀行', 'paypay', '変動', 0.380, CURRENT_DATE, 0.380, 0.000),
  ('PayPay銀行', 'paypay', '固定10年', 1.200, CURRENT_DATE, 1.180, 0.020),
  ('楽天銀行', 'rakuten', '変動', 0.550, CURRENT_DATE, 0.550, 0.000),
  ('ソニー銀行', 'sony', '変動', 0.397, CURRENT_DATE, 0.397, 0.000),
  ('イオン銀行', 'aeon', '変動', 0.380, CURRENT_DATE, 0.380, 0.000),
  ('SBI新生銀行', 'sbi_shinsei', '変動', 0.420, CURRENT_DATE, 0.450, -0.030),
  ('三菱UFJ銀行', 'mufg', '変動', 0.345, CURRENT_DATE, 0.345, 0.000),
  ('三菱UFJ銀行', 'mufg', '固定10年', 1.150, CURRENT_DATE, 1.150, 0.000),
  ('三菱UFJ銀行', 'mufg', '固定35年', 1.870, CURRENT_DATE, 1.870, 0.000),
  ('三井住友銀行', 'smbc', '変動', 0.475, CURRENT_DATE, 0.475, 0.000),
  ('三井住友銀行', 'smbc', '固定10年', 1.200, CURRENT_DATE, 1.200, 0.000),
  ('みずほ銀行', 'mizuho', '変動', 0.375, CURRENT_DATE, 0.375, 0.000),
  ('みずほ銀行', 'mizuho', '固定10年', 1.180, CURRENT_DATE, 1.180, 0.000),
  ('りそな銀行', 'resona', '変動', 0.340, CURRENT_DATE, 0.340, 0.000),
  ('りそな銀行', 'resona', '固定10年', 1.100, CURRENT_DATE, 1.100, 0.000),
  ('関西みらい銀行', 'kansai_mirai', '変動', 0.475, CURRENT_DATE, 0.475, 0.000),
  ('関西みらい銀行', 'kansai_mirai', '固定10年', 1.350, CURRENT_DATE, 1.350, 0.000),
  ('池田泉州銀行', 'senshu_ikeda', '変動', 0.525, CURRENT_DATE, 0.525, 0.000),
  ('京都銀行', 'kyoto', '変動', 0.475, CURRENT_DATE, 0.475, 0.000),
  ('滋賀銀行', 'shiga', '変動', 0.525, CURRENT_DATE, 0.525, 0.000),
  ('南都銀行', 'nanto', '変動', 0.550, CURRENT_DATE, 0.550, 0.000),
  ('紀陽銀行', 'kiyo', '変動', 0.525, CURRENT_DATE, 0.525, 0.000),
  ('大阪信用金庫', 'osaka_shinkin', '変動', 0.625, CURRENT_DATE, 0.625, 0.000),
  ('大阪シティ信用金庫', 'osaka_city_shinkin', '変動', 0.650, CURRENT_DATE, 0.650, 0.000),
  ('尼崎信用金庫', 'amagasaki_shinkin', '変動', 0.600, CURRENT_DATE, 0.600, 0.000),
  ('京都中央信用金庫', 'kyoto_chuo_shinkin', '変動', 0.625, CURRENT_DATE, 0.625, 0.000),
  ('住宅金融支援機構（フラット35）', 'jhf', 'フラット35（21-35年）', 1.840, CURRENT_DATE, 1.870, -0.030),
  ('住宅金融支援機構（フラット35）', 'jhf', 'フラット35（15-20年）', 1.430, CURRENT_DATE, 1.460, -0.030),
  ('住宅金融支援機構（フラット35）', 'jhf', 'フラット35S（21-35年）', 1.590, CURRENT_DATE, 1.620, -0.030)
ON CONFLICT (bank_name, rate_type, rate_date) DO UPDATE SET
  rate = EXCLUDED.rate,
  previous_rate = EXCLUDED.previous_rate,
  rate_change = EXCLUDED.rate_change,
  updated_at = NOW();

-- =============================================
-- サンプルデータ: 住宅ローンニュース
-- =============================================

INSERT INTO loan_news (title, summary, source, category, importance, published_at) VALUES
  ('2024年1月の住宅ローン金利動向', 'ネット銀行を中心に変動金利の引き下げが続く', '住宅金融支援機構', '金利動向', 'high', CURRENT_DATE),
  ('フラット35 金利引き下げ', '住宅金融支援機構がフラット35の金利を0.03%引き下げ', '住宅金融支援機構', '金利変更', 'high', CURRENT_DATE - INTERVAL '1 day'),
  ('住信SBIネット銀行 キャンペーン実施中', '新規借入で変動金利0.298%〜。業界最低水準', '住信SBIネット銀行', 'キャンペーン', 'normal', CURRENT_DATE - INTERVAL '3 day'),
  ('日銀政策決定会合の結果について', '短期金利は据え置き。住宅ローン変動金利への影響は限定的', '日本銀行', '金融政策', 'high', CURRENT_DATE - INTERVAL '5 day'),
  ('関西みらい銀行 住宅ローン新プラン発表', '子育て世帯向けの優遇金利プランを新設', '関西みらい銀行', '新商品', 'normal', CURRENT_DATE - INTERVAL '7 day')
ON CONFLICT DO NOTHING;

-- =============================================
-- サンプルデータ: 土地物件
-- =============================================

INSERT INTO crawled_properties (source, source_id, source_url, title, price, address, area, land_area, building_coverage, floor_area_ratio, road_width, road_direction, land_shape, station_name, station_walk, is_available, first_seen_at) VALUES
  ('suumo', 'demo_001', 'https://suumo.jp/demo/001', '【新着】豊中市・閑静な住宅街の整形地', 3980, '大阪府豊中市本町3丁目', '豊中市', 125.50, 60, 200, 6.0, '南', '整形地', '豊中駅', 8, true, NOW()),
  ('suumo', 'demo_002', 'https://suumo.jp/demo/002', '吹田市江坂・駅徒歩5分の好立地', 4580, '大阪府吹田市江坂町2丁目', '吹田市', 98.75, 60, 200, 5.5, '東', '整形地', '江坂駅', 5, true, NOW()),
  ('suumo', 'demo_003', 'https://suumo.jp/demo/003', '高槻市・新快速停車駅徒歩10分', 2980, '大阪府高槻市芥川町1丁目', '高槻市', 145.20, 60, 200, 4.5, '南西', 'ほぼ整形', '高槻駅', 10, true, NOW()),
  ('suumo', 'demo_004', 'https://suumo.jp/demo/004', '茨木市・小学校徒歩3分のファミリー向け', 3280, '大阪府茨木市春日3丁目', '茨木市', 132.00, 60, 200, 5.0, '南', '整形地', '茨木駅', 12, true, NOW()),
  ('suumo', 'demo_005', 'https://suumo.jp/demo/005', '西宮市・甲子園エリアの人気物件', 5280, '兵庫県西宮市甲子園口2丁目', '西宮市', 115.80, 60, 200, 6.0, '南', '整形地', '甲子園口駅', 6, true, NOW()),
  ('suumo', 'demo_006', 'https://suumo.jp/demo/006', '芦屋市・高級住宅街の希少物件', 8980, '兵庫県芦屋市東山町', '芦屋市', 180.00, 50, 100, 7.0, '南東', '整形地', '芦屋駅', 15, true, NOW()),
  ('suumo', 'demo_007', 'https://suumo.jp/demo/007', '宝塚市・山手台の眺望良好地', 2480, '兵庫県宝塚市山手台東2丁目', '宝塚市', 195.50, 50, 100, 6.0, '南', '傾斜地', '山本駅', 20, true, NOW()),
  ('suumo', 'demo_008', 'https://suumo.jp/demo/008', '尼崎市・JR塚口駅徒歩圏内', 2180, '兵庫県尼崎市塚口本町3丁目', '尼崎市', 88.50, 60, 200, 4.0, '西', '整形地', '塚口駅', 8, true, NOW()),
  ('suumo', 'demo_009', 'https://suumo.jp/demo/009', '京都市左京区・北山エリアの静かな住宅地', 6500, '京都府京都市左京区下鴨北野々神町', '京都市左京区', 155.00, 60, 200, 5.5, '北', '整形地', '北山駅', 10, true, NOW()),
  ('suumo', 'demo_010', 'https://suumo.jp/demo/010', '奈良市・学園前の文教地区', 3680, '奈良県奈良市学園北1丁目', '奈良市', 142.30, 60, 200, 6.0, '南', '整形地', '学園前駅', 7, true, NOW()),
  ('suumo', 'demo_011', 'https://suumo.jp/demo/011', '枚方市・くずは駅徒歩8分', 2780, '大阪府枚方市楠葉花園町', '枚方市', 110.00, 60, 200, 5.0, '南', '整形地', 'くずは駅', 8, true, NOW()),
  ('suumo', 'demo_012', 'https://suumo.jp/demo/012', '堺市北区・地下鉄駅近の利便性抜群物件', 2580, '大阪府堺市北区中百舌鳥町', '堺市北区', 95.00, 60, 200, 4.5, '東', '整形地', 'なかもず駅', 5, true, NOW()),
  ('suumo', 'demo_013', 'https://suumo.jp/demo/013', '川西市・能勢電鉄沿線の閑静な住宅地', 1980, '兵庫県川西市平野3丁目', '川西市', 165.00, 60, 150, 5.0, '南', '整形地', '平野駅', 6, true, NOW()),
  ('suumo', 'demo_014', 'https://suumo.jp/demo/014', '大津市・琵琶湖徒歩圏の絶好ロケーション', 2280, '滋賀県大津市におの浜2丁目', '大津市', 120.50, 60, 200, 5.5, '南', '整形地', 'におの浜駅', 12, true, NOW()),
  ('suumo', 'demo_015', 'https://suumo.jp/demo/015', '伊丹市・阪急伊丹駅徒歩10分', 3180, '兵庫県伊丹市中央4丁目', '伊丹市', 105.00, 60, 200, 5.0, '南西', '整形地', '伊丹駅', 10, true, NOW())
ON CONFLICT (source, source_id) DO UPDATE SET
  title = EXCLUDED.title,
  price = EXCLUDED.price,
  last_seen_at = NOW(),
  updated_at = NOW();
