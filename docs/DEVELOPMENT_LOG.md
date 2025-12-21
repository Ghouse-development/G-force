# G-force 開発記録

## 2024年12月22日 - 外部連携機能・マッチング通知機能追加

### 実装した機能

#### 1. 外部連携管理画面

**画面:** `/admin/integrations`

- kintone連携の設定・同期
- Formbridge Webhook設定
- Googleスプレッドシート連携設定
- 接続ステータスの表示

#### 2. kintone連携強化

**APIエンドポイント:**
- `POST /api/kintone/sync` - 顧客データの双方向同期

**機能:**
- G-force → kintone へのデータ同期
- kintone → G-force へのデータ同期
- 同期ログの表示

#### 3. Formbridge Webhook連携

**APIエンドポイント:** `/api/webhooks/formbridge`

**機能:**
- Formbridgeからのアンケート・ヒアリングデータを受信
- 電話番号・メールで既存顧客を照合
- 新規顧客の自動作成
- アンケート回答をsurvey_dataフィールドに保存

**フィールドマッピング:**
- 顧客名、電話番号、メール、住所
- 来場きっかけ、希望エリア、建築予定時期など

#### 4. Googleスプレッドシート連携

**APIエンドポイント:** `/api/spreadsheet/import`

**機能:**
- 来場予約シートからインポート
- 問い合わせシートからインポート
- 資料請求シートからインポート
- 重複チェック（電話番号・メール）

**環境変数:**
```
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@xxx.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
GOOGLE_SPREADSHEET_ID=your-spreadsheet-id
```

#### 5. 土地マッチング通知（ダッシュボード）

**コンポーネント:** `PropertyMatchAlerts`

**機能:**
- 顧客ごとのマッチング通知を表示
- マッチスコア（70%以上）を表示
- 物件詳細へのリンク
- SUUMOへの外部リンク

**APIエンドポイント:** `/api/property-notifications`

#### 6. 管理画面メニュー更新

- 「外部連携」メニューを追加（アイコン: Link2）
- kintone・Formbridge・スプレッドシートの説明

### 環境変数一覧

```
# kintone連携
KINTONE_DOMAIN=your-subdomain.cybozu.com
KINTONE_API_TOKEN=your-api-token
KINTONE_APP_ID=123

# Formbridge Webhook（オプション）
FORMBRIDGE_WEBHOOK_SECRET=your-secret

# Googleスプレッドシート
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@xxx.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
GOOGLE_SPREADSHEET_ID=your-spreadsheet-id
```

---

## 2024年12月22日 - クロール設定・管理画面追加

### 実装した機能

#### 1. クロール設定・管理画面

**画面:** `/crawl-settings`

- クロール実行ステータスのリアルタイム表示
- 手動クロール実行ボタン（土地情報 / 金利情報 選択可能）
- 1日の実行上限設定（最大2回/日 - API負荷軽減のため）
- クロール実行ログの履歴表示
- 顧客紐付け・通知フローの説明

**統計ダッシュボード:**
- 取得済み物件数
- 本日のクロール回数 / 上限
- 最終実行日時
- マッチした通知数（未読）

#### 2. ナビゲーション更新

**ヘッダーに「情報収集」メニュー追加:**
- 土地情報アラート (`/property-alerts`)
- 住宅ローン金利 (`/loan-rates`)
- クロール設定 (`/crawl-settings`)

#### 3. 新規 API エンドポイント

| エンドポイント | メソッド | 機能 |
|---------------|---------|------|
| `/api/crawl-logs` | GET | クロールログ・統計取得 |

### 顧客紐付け・通知フロー

1. 顧客ごとに「物件アラート」を設定
2. Vercel Cronで毎日10時に自動クロール実行
3. 新規物件と顧客条件をマッチング
4. 条件に合う物件を通知一覧に自動追加

### 動作確認方法

1. `/crawl-settings` で「今すぐ実行」ボタンをクリック
2. 実行ログで「成功」ステータスを確認
3. `/property-alerts` で取得した物件を確認
4. Vercel ダッシュボード → Functions → Cron Jobs で自動実行を確認

---

## 2024年12月21日 - 住宅ローン金利・土地情報クロール機能リリース

### 実装した機能

#### 1. 住宅ローン金利情報

**画面:** `/loan-rates`

- 関西の銀行を中心とした住宅ローン金利一覧
- カテゴリ別タブ（ネット銀行、メガバンク、地方銀行、信用金庫、フラット35）
- 金利変動の可視化（上昇: 赤、下降: 緑）
- 最低金利のサマリー表示

**対応銀行（25行）:**
- ネット銀行: 住信SBI、auじぶん、PayPay、楽天、ソニー、イオン、SBI新生
- メガバンク: 三菱UFJ、三井住友、みずほ、りそな
- 関西地銀: 関西みらい、池田泉州、京都、滋賀、南都、紀陽
- 信用金庫: 大阪、大阪シティ、尼崎、京都中央
- フラット35: 住宅金融支援機構

#### 2. 土地情報アラート

**画面:** `/property-alerts`

- 条件に合う土地物件の自動通知
- 関西エリアの市区町村選択
- 価格・面積・駅徒歩のスライダー設定
- マッチ度スコア表示
- お気に入り・既読管理

#### 3. SUUMOクローラー

**ファイル:** `lib/crawl/property-crawler.ts`

- SUUMOの土地検索ページからHTMLをパース
- 物件情報を抽出してデータベースに保存
- 関西全域（大阪・兵庫・京都・奈良・滋賀）対応
- サーバー負荷軽減のためリクエスト間隔2秒

#### 4. API エンドポイント

| エンドポイント | メソッド | 機能 |
|---------------|---------|------|
| `/api/cron/loan-rates` | GET | 金利一覧取得 |
| `/api/cron/loan-rates` | POST | 金利クロール実行 |
| `/api/cron/properties` | GET | 物件統計取得 |
| `/api/cron/properties` | POST | 物件クロール・マッチング |
| `/api/properties` | GET | 物件一覧取得 |

#### 5. Vercel Cron設定

**ファイル:** `vercel.json`

```json
{
  "crons": [
    { "path": "/api/cron/loan-rates", "schedule": "0 9 * * *" },
    { "path": "/api/cron/properties", "schedule": "0 10 * * *" }
  ]
}
```

### データベーステーブル

**ファイル:** `supabase/migrations/003_loan_rates_and_property_alerts.sql`

- `loan_rates` - 住宅ローン金利
- `loan_rate_history` - 金利変更履歴
- `loan_news` - 住宅ローンニュース
- `property_alerts` - 物件アラート条件
- `crawled_properties` - クロール済み物件
- `property_notifications` - マッチング通知
- `crawl_logs` - クロール実行ログ

### セットアップ手順

1. Supabase SQL EditorでマイグレーションSQLを実行
2. `npm run dev` でアプリ起動
3. `/loan-rates` で金利情報確認
4. `/property-alerts` → 「物件検索」タブ → 「今すぐ取得」でクロール実行

### 注意事項

- SUUMOクロールは利用規約に注意して使用
- 本番環境では `CRON_SECRET` 環境変数を設定
- クロール頻度は1日1回程度に抑える

---

## 既存機能

- 顧客管理 (`/customers`)
- プラン依頼 (`/plan-requests`)
- 契約管理 (`/contracts`)
- 資金計画書 (`/fund-plans`)
- ダッシュボード (`/dashboard`)
