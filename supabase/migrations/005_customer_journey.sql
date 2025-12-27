-- =============================================
-- カスタマージャーニー（顧客行動履歴）
-- 契約数を増やすための分析基盤
-- =============================================

-- 顧客テーブルに土地状況を追加
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS land_status TEXT DEFAULT '土地探し中';

-- カスタマージャーニーイベントテーブル
CREATE TABLE IF NOT EXISTS customer_journey_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id),

  -- イベント情報
  event_type TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME,
  location TEXT,  -- MH名、見学会場所など

  -- 担当者
  staff_id UUID REFERENCES users(id),
  staff_name TEXT,

  -- 詳細
  notes TEXT,
  outcome TEXT,  -- 良好/普通/要フォロー

  -- 次のアクション
  next_action TEXT,
  next_action_date DATE,

  -- メタ情報
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_journey_events_customer ON customer_journey_events(customer_id);
CREATE INDEX IF NOT EXISTS idx_journey_events_date ON customer_journey_events(event_date);
CREATE INDEX IF NOT EXISTS idx_journey_events_type ON customer_journey_events(event_type);

-- ジャーニーサマリーテーブル（分析用・キャッシュ）
CREATE TABLE IF NOT EXISTS customer_journey_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID UNIQUE NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id),

  -- 接触情報
  first_contact_date DATE,
  first_contact_type TEXT,

  -- カウント
  total_events INTEGER DEFAULT 0,
  total_meetings INTEGER DEFAULT 0,
  total_site_visits INTEGER DEFAULT 0,

  -- 期間（日数）
  days_to_member INTEGER,
  days_to_application INTEGER,
  days_to_contract INTEGER,

  -- 経路（JSON配列）
  journey_path JSONB DEFAULT '[]',

  -- AI分析
  conversion_probability DECIMAL(5, 2),
  recommended_action TEXT,
  analysis_updated_at TIMESTAMPTZ,

  -- メタ情報
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 分析用ビュー：契約パターン分析
CREATE OR REPLACE VIEW journey_conversion_patterns AS
SELECT
  c.land_status,
  COUNT(*) FILTER (WHERE c.pipeline_status = '契約' OR c.pipeline_status IN ('変更契約前', '変更契約後', 'オーナー')) as contracted_count,
  COUNT(*) as total_count,
  ROUND(
    COUNT(*) FILTER (WHERE c.pipeline_status = '契約' OR c.pipeline_status IN ('変更契約前', '変更契約後', 'オーナー'))::DECIMAL
    / NULLIF(COUNT(*), 0) * 100, 1
  ) as conversion_rate,
  AVG(s.days_to_contract) FILTER (WHERE s.days_to_contract IS NOT NULL) as avg_days_to_contract
FROM customers c
LEFT JOIN customer_journey_summaries s ON c.id = s.customer_id
GROUP BY c.land_status;

-- 営業成績ビュー
CREATE OR REPLACE VIEW sales_performance AS
SELECT
  u.id as user_id,
  u.name as user_name,
  u.department,

  -- 今期の実績
  COUNT(*) FILTER (WHERE c.pipeline_status IN ('限定会員', '面談', '建築申込', 'プラン提出', '内定', '変更契約前', '変更契約後', 'オーナー')) as active_customers,
  COUNT(*) FILTER (WHERE c.pipeline_status = '建築申込') as applications,
  COUNT(*) FILTER (WHERE c.pipeline_status = '内定') as pending_contracts,
  COUNT(*) FILTER (WHERE c.pipeline_status IN ('変更契約前', '変更契約後', 'オーナー')) as contracts,

  -- 金額
  COALESCE(SUM(c.contract_amount) FILTER (WHERE c.contract_amount IS NOT NULL), 0) as total_contract_amount,

  -- 効率指標
  AVG(s.days_to_contract) FILTER (WHERE s.days_to_contract IS NOT NULL) as avg_days_to_contract,
  AVG(s.total_meetings) as avg_meetings_per_customer

FROM users u
LEFT JOIN customers c ON c.assigned_to = u.id
LEFT JOIN customer_journey_summaries s ON c.id = s.customer_id
WHERE u.role IN ('sales', 'sales_leader')
GROUP BY u.id, u.name, u.department;

-- RLSポリシー
ALTER TABLE customer_journey_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_journey_summaries ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが閲覧可能（自社テナント内）
CREATE POLICY "Users can view journey events" ON customer_journey_events
  FOR SELECT USING (true);

CREATE POLICY "Users can insert journey events" ON customer_journey_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update journey events" ON customer_journey_events
  FOR UPDATE USING (true);

CREATE POLICY "Users can view journey summaries" ON customer_journey_summaries
  FOR SELECT USING (true);

-- サマリー更新用トリガー関数
CREATE OR REPLACE FUNCTION update_journey_summary()
RETURNS TRIGGER AS $$
BEGIN
  -- サマリーが存在しなければ作成
  INSERT INTO customer_journey_summaries (customer_id, tenant_id)
  SELECT NEW.customer_id, NEW.tenant_id
  WHERE NOT EXISTS (
    SELECT 1 FROM customer_journey_summaries WHERE customer_id = NEW.customer_id
  );

  -- サマリーを更新
  UPDATE customer_journey_summaries
  SET
    total_events = (SELECT COUNT(*) FROM customer_journey_events WHERE customer_id = NEW.customer_id),
    total_meetings = (
      SELECT COUNT(*) FROM customer_journey_events
      WHERE customer_id = NEW.customer_id
      AND event_type IN ('初回面談', '面談', 'オンライン面談')
    ),
    total_site_visits = (
      SELECT COUNT(*) FROM customer_journey_events
      WHERE customer_id = NEW.customer_id
      AND event_type IN ('MH見学会参加', '構造見学会参加', 'OB見学会参加', '完成見学会参加')
    ),
    first_contact_date = (
      SELECT MIN(event_date) FROM customer_journey_events WHERE customer_id = NEW.customer_id
    ),
    first_contact_type = (
      SELECT event_type FROM customer_journey_events
      WHERE customer_id = NEW.customer_id
      ORDER BY event_date, created_at LIMIT 1
    ),
    journey_path = (
      SELECT jsonb_agg(event_type ORDER BY event_date, created_at)
      FROM customer_journey_events WHERE customer_id = NEW.customer_id
    ),
    updated_at = NOW()
  WHERE customer_id = NEW.customer_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー
DROP TRIGGER IF EXISTS journey_event_summary_trigger ON customer_journey_events;
CREATE TRIGGER journey_event_summary_trigger
  AFTER INSERT OR UPDATE OR DELETE ON customer_journey_events
  FOR EACH ROW
  EXECUTE FUNCTION update_journey_summary();

-- コメント
COMMENT ON TABLE customer_journey_events IS 'カスタマージャーニーイベント - 顧客の行動履歴を記録';
COMMENT ON TABLE customer_journey_summaries IS 'ジャーニーサマリー - 分析用の集計データ';
COMMENT ON VIEW journey_conversion_patterns IS '契約パターン分析 - 土地状況別の契約率';
COMMENT ON VIEW sales_performance IS '営業成績 - 担当者別の実績';
