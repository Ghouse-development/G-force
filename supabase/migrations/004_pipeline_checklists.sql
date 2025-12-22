-- =============================================
-- パイプラインチェックリスト機能
-- 各ステージでやるべきことを管理
-- =============================================

-- =============================================
-- チェックリストテンプレート（管理者が設定）
-- =============================================

CREATE TABLE IF NOT EXISTS pipeline_checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_status TEXT NOT NULL,
  item_order INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  description TEXT,
  is_required BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 顧客別チェックリスト進捗
-- =============================================

CREATE TABLE IF NOT EXISTS customer_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES pipeline_checklist_templates(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, template_id)
);

-- =============================================
-- インデックス
-- =============================================

CREATE INDEX IF NOT EXISTS idx_checklist_templates_status ON pipeline_checklist_templates(pipeline_status, item_order);
CREATE INDEX IF NOT EXISTS idx_checklist_templates_active ON pipeline_checklist_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_customer_checklist_customer ON customer_checklist_items(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_checklist_template ON customer_checklist_items(template_id);

-- =============================================
-- RLS
-- =============================================

ALTER TABLE pipeline_checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_checklist_items ENABLE ROW LEVEL SECURITY;

-- ポリシー
DROP POLICY IF EXISTS "Allow authenticated" ON pipeline_checklist_templates;
DROP POLICY IF EXISTS "Allow authenticated" ON customer_checklist_items;

CREATE POLICY "Allow authenticated" ON pipeline_checklist_templates FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON customer_checklist_items FOR ALL TO authenticated USING (true);

-- =============================================
-- デフォルトチェックリストテンプレート
-- =============================================

INSERT INTO pipeline_checklist_templates (pipeline_status, item_order, title, description, is_required) VALUES
  -- 反響
  ('反響', 1, '反響登録完了', '顧客情報をシステムに登録', TRUE),
  ('反響', 2, '初回電話連絡', '反響から24時間以内に電話', TRUE),
  ('反響', 3, '資料送付', 'パンフレット・会社案内を送付', FALSE),
  ('反響', 4, 'イベント案内', '見学会・相談会の案内', FALSE),

  -- イベント参加
  ('イベント参加', 1, '来場受付完了', '来場時のアンケート記入', TRUE),
  ('イベント参加', 2, '担当者挨拶', '担当営業として自己紹介', TRUE),
  ('イベント参加', 3, 'モデルハウス案内', '施工事例・モデルハウスの説明', FALSE),
  ('イベント参加', 4, '次回アポ取得', '個別面談の日程調整', TRUE),

  -- 限定会員
  ('限定会員', 1, '会員登録完了', '限定会員として登録', TRUE),
  ('限定会員', 2, '会員特典説明', '会員限定情報・特典の案内', FALSE),
  ('限定会員', 3, '土地情報提供開始', '希望条件に合う土地情報の提供', FALSE),
  ('限定会員', 4, '面談日程調整', '詳細ヒアリングの日程調整', TRUE),

  -- 面談
  ('面談', 1, '要望ヒアリング', '建物・土地・予算の希望を確認', TRUE),
  ('面談', 2, '土地条件整理', '土地探しの条件をシステム登録', TRUE),
  ('面談', 3, '資金計画書作成', '概算の資金計画書を作成', TRUE),
  ('面談', 4, 'ローン事前審査', '銀行への事前審査申込', FALSE),
  ('面談', 5, 'プラン提案', '間取りプランの提案', TRUE),
  ('面談', 6, '見積提示', '概算見積の提示', TRUE),
  ('面談', 7, '建築申込の案内', '申込の流れ・特典を説明', TRUE),

  -- 建築申込
  ('建築申込', 1, '申込書受領', '建築申込書に署名・押印', TRUE),
  ('建築申込', 2, '申込金入金確認', '申込金の入金確認', TRUE),
  ('建築申込', 3, '詳細プラン打合せ', '間取り・仕様の詳細決定', TRUE),
  ('建築申込', 4, '最終見積作成', '確定仕様での見積作成', TRUE),
  ('建築申込', 5, 'ローン本審査', '銀行への本審査申込', FALSE),
  ('建築申込', 6, '契約日程調整', '契約締結の日程調整', TRUE),

  -- 契約
  ('契約', 1, '契約書作成', '請負契約書の作成', TRUE),
  ('契約', 2, '重要事項説明', '重要事項の説明・確認', TRUE),
  ('契約', 3, '契約締結', '契約書への署名・押印', TRUE),
  ('契約', 4, '契約金入金確認', '契約金の入金確認', TRUE),
  ('契約', 5, '着工打合せ日程調整', '着工に向けた打合せ日程', TRUE),

  -- 着工
  ('着工', 1, '工事部引継完了', '営業から工事部への引継', TRUE),
  ('着工', 2, '近隣挨拶', '近隣への工事挨拶', TRUE),
  ('着工', 3, '地鎮祭', '地鎮祭の実施', FALSE),
  ('着工', 4, '着工金入金確認', '着工金の入金確認', TRUE),
  ('着工', 5, '基礎工事完了', '基礎工事の完了確認', TRUE),
  ('着工', 6, '上棟', '上棟式の実施', TRUE),
  ('着工', 7, '中間金入金確認', '中間金の入金確認', TRUE),
  ('着工', 8, '完了検査', '完了検査の実施', TRUE),

  -- 引渡
  ('引渡', 1, '完成立会', 'お客様との完成立会', TRUE),
  ('引渡', 2, '残代金入金確認', '残代金の入金確認', TRUE),
  ('引渡', 3, '鍵引渡', '鍵の引渡し', TRUE),
  ('引渡', 4, '引渡書類説明', '保証書・取扱説明書の説明', TRUE),
  ('引渡', 5, 'アフター案内', 'アフターサービスの案内', TRUE)
ON CONFLICT DO NOTHING;
