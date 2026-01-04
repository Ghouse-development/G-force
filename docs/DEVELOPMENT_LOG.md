# G-force 開発記録

## 2026年1月4日 - UI全画面シンプル化（第2弾）

### 概要

スクリーンショット評価に基づき、全画面のUI簡素化を完了。グラデーションとカラフルなカードをインラインテキスト表示に統一。

### 修正した画面

| 画面 | 主な変更 |
|------|----------|
| 限定会員前お客様 | ステータスカード → インラインテキスト、グラデーションボタン削除 |
| 契約後お客様管理 | サマリーカード → インラインテキスト、デモバナー簡素化 |
| オーナー | 3枚のグラデーションカード → インラインテキスト、アイコングラデーション削除 |
| プラン依頼 | 5枚の統計カード → インラインテキスト、グラデーションボタン削除 |
| 管理画面 | 4枚の統計カード → インラインテキスト、メニューアイコングラデーション削除 |
| 顧客詳細 | 次アクションガイドのグラデーション枠 → シンプル枠線、情報カードの背景色統一 |

### 変更パターン

**Before:**
```tsx
<Card className="bg-gradient-to-r from-orange-50 to-amber-50">
  <CardContent className="p-6">
    <p className="text-sm text-gray-600">ラベル</p>
    <p className="text-2xl font-bold text-orange-600">値</p>
  </CardContent>
</Card>
```

**After:**
```tsx
<div className="flex items-center gap-2">
  <span className="text-sm text-gray-500">ラベル</span>
  <span className="text-xl font-bold text-gray-900">値</span>
</div>
```

### 削除したグラデーション

- `bg-gradient-to-r from-purple-600 to-indigo-600` → `bg-gray-700`（デモバナー）
- `bg-gradient-to-r from-orange-500 to-yellow-500` → `bg-orange-500`（ボタン）
- `bg-gradient-to-r from-orange-50 to-amber-50` → `bg-gray-50`（カード背景）
- `bg-gradient-to-br ${menu.color}` → `bg-gray-100`（管理画面アイコン）

### 変更ファイル

- `app/pre-members/page.tsx` - デモバナー、ボタン、ステータスサマリー
- `app/post-contract/page.tsx` - デモバナー、サマリーカード
- `app/owners/page.tsx` - デモバナー、サマリーカード、オーナーカードアイコン
- `app/plan-requests/page.tsx` - 統計カード、グラデーションボタン2箇所
- `app/admin/page.tsx` - 統計カード、メニューアイコン
- `app/customers/[id]/page.tsx` - 次アクションガイド枠、情報カード背景

---

## 2026年1月4日 - UI/UX全体シンプル化・Excel完全一致ビュー

### 概要

システム全体のUI/UXを大幅にシンプル化。グラデーションを削除し、カラーパレットを統一。Handsontable によるExcel完全一致ビューを追加。

### 成果

| 項目 | Before | After |
|------|--------|-------|
| グラデーション使用数 | 10種類以上 | 0 |
| カラーパレット | 6色以上（青/紫/緑/オレンジ等） | 2色（orange-500, gray系） |
| ダッシュボードカード | グラデーション背景・shadow-lg | フラット・shadow-md |
| お客様一覧サマリ | 5枚のカード | インラインテキスト |
| ナビゲーションアクティブ | グラデーション＋shadow | 単色orange-500 |

### 変更ファイル

**UI整理:**
- `app/dashboard/page.tsx` - グラデーション削除、クイックアクション統一
- `app/customers/page.tsx` - サマリーカードをインライン表示に簡素化
- `components/layout/header.tsx` - ロゴ・ナビのグラデーション削除

**Excel完全一致ビュー（新規）:**
- `components/fund-plans/fund-plan-excel-view.tsx` - Handsontable使用
  - 105列×100行のExcelテンプレート完全再現
  - セクションナビゲーション（ヘッダー/付帯A/借入/工程等）
  - 現在セル位置表示（例: O35）
  - 50セルの編集可能セルをハイライト
  - ズーム機能（50%〜150%）

**フォーム統合:**
- `components/fund-plans/fund-plan-form.tsx` - Excel表示切替でExcelViewを使用

### カラーパレット統一

```
メインカラー: orange-500
背景（ホバー）: gray-100
テキスト: gray-600 / gray-900
ヘッダー: gray-800（目標達成等）
アクセント: なし（オレンジのみ）
```

### 視覚的改善点

1. **グラデーション全廃** - 視覚的ノイズを削減
2. **カード統一** - border + shadow-md に統一
3. **ホバー統一** - hover:bg-gray-100 に統一
4. **余白確保** - 情報密度を下げて見やすく

---

## 2026年1月4日 - Excelセルマッピング完全検証・システム化

### 概要

資金計画書Excelテンプレートのセルマッピングを完全に検証し、システム化しました。

### 成果

| 項目 | 結果 |
|---|---|
| マッピング済みセル | 50セル（100%検証済み） |
| 型カバレッジ | 96.7%（50マッピング + 157除外 / 214フィールド） |
| TypeScript/ESLint | エラー0件 |
| Excel出力テスト | 合格（21/21セル検証） |

### 新規作成ファイル

**セルマッピング設定:**
- `lib/fund-plan/cell-mapping.ts` - 50セルの検証済みマッピング

**検証スクリプト:**
- `scripts/verify-mappings.ts` - セルマッピング検証
- `scripts/validate-mapping-coverage.ts` - FundPlanData型との照合
- `scripts/investigate-unmapped-fields.ts` - 未マッピングフィールド調査
- `scripts/test-excel-export-node.ts` - Excel出力テスト（Node.js版）
- `scripts/verify-excel-output.ts` - 出力ファイル検証

**分析スクリプト:**
- `scripts/analyze-template-deep.ts` - テンプレート深層分析
- `scripts/analyze-input-cells.ts` - 入力セル検出
- `scripts/analyze-costs.ts` - 費用セクション分析
- `scripts/analyze-remaining.ts` - 残りセクション分析

**ドキュメント:**
- `docs/excel-mapping-system.md` - システム全体ガイド

### セルマッピング詳細

```
■ ヘッダー（1行目）- 7セル
  AH1: 邸名, N1: 商品タイプ, CA1: 施工面積
  CJ1: 階数, BG1: 準防火地域, BM1: 建物構造, DA1: 見積日

■ 付帯工事費用A（33-41行目）- 8セル
  O35: 構造計算, O37: 構造図, O39: BELS申請
  AI33: 屋外電気・給水, AI35: 瑕疵保険等
  AI37: 設計監理, AI39: 安全対策, AI41: 仮設工事

■ 付帯工事費用B（46-54行目）- 2セル
  G46: 太陽光パネル枚数, AI54: オプション工事

■ 付帯工事費用C（69行目）- 1セル
  O69: 残土処理工事

■ 諸費用（82-98行目）- 8セル
  O82: 建物登記, O86: つなぎローン, O88: 印紙代
  O90: 建物請負印紙, O92: 火災保険, O94: 先行工事
  O96: 外構工事, O98: 造作工事

■ 土地費用（AI列 82-92行目）- 5セル
  AI82: 土地売買代金, AI86: 土地契約印紙, AI88: 仲介手数料
  AI90: 土地登記費用, AI92: 滅失登記費用

■ 借入計画（33-37行目）- 9セル
  BA/BG/BO 33: A銀行, 35: B銀行, 37: C銀行

■ 工程スケジュール（DA列 8-26行目）- 7セル
  DA8: 土地契約, DA10: 建物契約, DA18: 仕様最終打合せ
  DA20: 変更契約, DA22: 着工, DA24: 上棟, DA26: 竣工

■ 支払計画（BG列 18-22行目）- 3セル
  BG18: 契約金(10%), BG20: 中間時金1(30%), BG22: 中間時金2(30%)
```

### 自動計算セル（入力不要）

- 坪単価(X28): 商品タイプから自動計算
- 確認申請(O33), 長期優良(O41): 数式
- 太陽光費用(O46), 蓄電池(O48): 数式
- 準防火(O59), 解体(O61), 地盤改良(O67): 数式

### 検証コマンド

```bash
# セルマッピングの検証
npx tsx scripts/verify-mappings.ts

# 型との照合
npx tsx scripts/validate-mapping-coverage.ts

# Excel出力テスト
npx tsx scripts/test-excel-export-node.ts

# 出力ファイル検証
npx tsx scripts/verify-excel-output.ts
```

### 修正内容

1. **paymentPlan dataPath修正**: `paymentPlanConstruction.contractFeeRatio` → `paymentPlanConstruction.contractFee.standardRate`
2. **坪単価(X28)**: 数式と判明、マッピングから除外
3. **土地費用追加**: AI82, AI86, AI88, AI90, AI92
4. **諸費用追加**: O82, O94, O98
5. **付帯工事費用A追加**: AI33, AI37, AI39, AI41
6. **付帯工事費用B追加**: AI54
7. **付帯工事費用C追加**: O69
8. **レガシーコード削除**: fillFundPlanSheet関数

---

## 2025年1月4日 - ExcelJS導入・Excel完全コピー対応

### ExcelJS導入

**目的**: Excelテンプレートの書式・数式・印刷設定を完全に保持したままエクスポート

**従来の問題（SheetJS無料版）**:
- 数式が消える
- 塗りつぶし・フォント・罫線が保持されない
- 印刷範囲が消える
- 行の高さ・列の幅が一部消える

**ExcelJSで対応可能になった項目**:
| 項目 | 対応状況 |
|-----|---------|
| セル値 | ✅ |
| 数式 | ✅ 保持 |
| 塗りつぶし・フォント | ✅ |
| 罫線 | ✅ |
| 行の高さ・列の幅 | ✅ |
| 印刷範囲 | ✅ |
| 結合セル | ✅ |

**新規ファイル**: `lib/excel-export-exceljs.ts`

**変更ファイル**: `lib/excel-export.ts`
- `exportFundPlanFromTemplate()` が内部でExcelJS版を使用するように変更
- 下位互換性のため `exportFundPlanFromTemplateSheetJS()` を残存

### システム全体確認・修正

- パイプラインステータス定義の統一（admin/checklists, customer-checklist）
- APIエラーハンドリング改善（customer-checklist）

---

## 2025年1月4日 - UI/UX統一タスク完了

### 完了した残タスク

開発記録に記載されていた「SmartSelection/カード選択UI適用」の残タスクを完了しました。

#### 確認・対応結果

| 画面 | 対象項目 | 状態 |
|-----|---------|------|
| プラン依頼 `/plan-requests/new` | 商品選択 | 適用済み（SmartSelection） |
| 契約ウィザード `/contract-requests/new` | 商品・紹介選択 | 適用済み（SmartSelection） |
| 顧客詳細 `/customers/[id]` | 土地状況 | 適用済み（カード選択UI） |
| 資金計画書作成 `/fund-plans/new` | 商品選択 | **今回対応**（カード選択UI） |

#### 資金計画書の商品選択UI改善

**ファイル:** `components/fund-plans/sections/basic-info-section.tsx`

- 主要商品（LIFE, LIFE+, HOURS, LACIE, G-SMART平屋）をカード形式で表示
- その他10種類の商品は「その他の商品を選択」で折りたたみ表示
- 坪単価を商品カードに表示（例: 55.0万/坪）
- 選択中の商品はオレンジ色でハイライト

**UI構成:**
```
┌─────┬─────┬─────┬─────┬─────────┐
│LIFE │LIFE+│HOURS│LACIE│G-SMART平屋│  ← 主要商品カード
└─────┴─────┴─────┴─────┴─────────┘
┌──────────────────────────────────┐
│ ▼ その他の商品を選択             │  ← 折りたたみ
└──────────────────────────────────┘
```

---

## 2024年12月27日（夜） - サンプルデータ充実化・エラー修正

### 実装した機能

#### 1. デモ顧客データの充実化

**ファイル:** `store/demo-store.ts`

リアルな営業活動を反映した23件の顧客データ:

| パイプライン | 件数 | 説明 |
|-------------|------|------|
| 資料請求 | 2件 | HP・Instagram経由 |
| イベント予約 | 1件 | MH見学予約済み |
| イベント参加 | 1件 | 見学会参加後のフォロー中 |
| 限定会員 | 2件 | オーナー紹介・HP問合せ |
| 面談 | 2件 | 土地案内・プラン検討中 |
| 建築申込 | 2件 | 土地決済完了・プラン設計中 |
| プラン提出 | 2件 | 金額調整・最終確認中 |
| 内定 | 2件 | 契約予定日確定 |
| ボツ・他決 | 2件 | 他社契約・予算合わず |
| 変更契約前 | 2件 | 着工準備中 |
| 変更契約後 | 2件 | 建築中（上棟済み等） |
| オーナー | 3件 | 引渡済み・紹介実績あり |

**データの特徴:**
- リアルな日本人名（関西圏）
- 詳細な商談メモ（次回アクション含む）
- 土地状況・金額・反響経路の多様性
- オーナー紹介のつながり

#### 2. Service Workerエラー修正

**ファイル:** `public/sw.js`

以下のリクエストをキャッシュ対象から除外:
- `chrome-extension://` スキーム
- Supabase APIリクエスト
- 非HTTPSスキーム

#### 3. UI/UX統一の完了確認

以下の画面でSelectionCard/SmartSelection適用済み:
- ✅ プラン依頼 `/plan-requests/new`
- ✅ 契約ウィザード `/contract-requests/new`
- ✅ 新規反響登録 `/customers/new`

---

## 2024年12月27日（午後） - UI/UX統一・Supabase Storage API接続

### 実装した機能

#### 1. SmartSelectionコンポーネント

**ファイル:** `components/ui/smart-selection.tsx`

「現在の値」vs「それ以外」の2択UIパターン:
- 営業が考えなくて済む仕組み
- 資金計画書の値を推奨として表示
- それ以外を選ぶ場合のみ選択肢を展開

#### 2. 書類アップロードAPI（Supabase Storage）

**ファイル:** `app/api/documents/route.ts`

| メソッド | 機能 |
|---------|------|
| GET | 顧客の書類一覧取得（署名付きURL付き） |
| POST | ファイルアップロード（Storage + DB記録） |
| DELETE | ファイル削除（Storage + DB） |

**バケット:** `customer-documents`
**テーブル:** `customer_documents`

#### 3. DocumentManager → API接続

**ファイル:** `components/customers/document-manager.tsx`

- ローカルストレージ → Supabase Storage APIへ変更
- 署名付きURLでセキュアなプレビュー
- ローディング状態の表示

#### 4. 契約ウィザードのSmartSelection適用

**ファイル:** `components/contracts/contract-wizard.tsx`

- 商品選択: 資金計画書の商品 vs それ以外
- 紹介元選択: 紹介なし vs 紹介あり（オーナー/社員/業者）

#### 5. 新規反響登録のカード選択化

**ファイル:** `app/customers/new/page.tsx`

- 反響経路をドロップダウン → 8枚のアイコンカードに変更
- 直感的なタップ操作

#### 6. TypeScriptエラー・未使用インポート修正

10ファイル以上の未使用インポートを削除:
- contract-requests/page.tsx
- contract-requests/[id]/page.tsx
- contracts/page.tsx, new/page.tsx, [id]/page.tsx
- customers/page.tsx, new/page.tsx, [id]/page.tsx
- contracts/contract-wizard.tsx
- api/documents/route.ts

### 残タスク（UI/UX統一の継続） → 2025年1月4日に完了

以下の画面にSmartSelection/カード選択UIを適用する必要あり:

| 画面 | 対象項目 | 状態 |
|-----|---------|------|
| プラン依頼 `/plan-requests/new` | 商品、工法など | ✅ 完了（SmartSelection適用済み） |
| 顧客詳細 `/customers/[id]` | 土地状況、ステータス変更 | ✅ 完了（カード選択UI適用済み） |
| 契約依頼 `/contract-requests/new` | 各選択項目 | ✅ 完了（SmartSelection適用済み） |
| 資金計画書作成 | 商品、ローン先など | ✅ 完了（カード選択UI適用） |

---

## 2024年12月27日 - 書類管理機能・契約ウィザード改善・TypeScript修正

### 実装した機能

#### 1. 顧客書類管理（DocumentManager）

**ファイル:** `components/customers/document-manager.tsx`

土地の状況に応じた書類アップロード機能:

| 土地状況 | 必要書類 |
|---------|---------|
| 土地あり | 土地謄本、公図、地積測量図、運転免許証、健康保険証、ローン事前審査、建築地写真、住宅地図 |
| 土地探し中 | 運転免許証、健康保険証、ローン事前審査 |
| 土地契約済 | 土地謄本、公図、地積測量図、土地重説、土地契約書、運転免許証、健康保険証、ローン事前審査、建築地写真、住宅地図 |
| 土地決済済 | 全書類（位置指定道路含む） |

**機能:**
- カード型UIで直感的な操作
- ドラッグ＆ドロップ対応
- アップロード済み書類は緑表示
- 契約ウィザードと連携

#### 2. 契約ウィザードの改善

**ファイル:** `components/contracts/contract-wizard.tsx`

- 資金計画書（FundPlanData）からのデータ取り込み修正
- スケジュール情報の正確な取得（着工日・竣工日）
- 支払計画・ローン情報の連携修正
- 書類確認ステップでDocumentManagerと連携

#### 3. TypeScriptエラー修正

**修正ファイル:**
- `components/contracts/contract-wizard.tsx` - FundPlanDataプロパティアクセス修正
- `app/plan-requests/new/page.tsx` - constructionArea参照修正
- `components/customers/customer-checklist.tsx` - PipelineStatus値修正
- `components/dashboard/pipeline-funnel.tsx` - PipelineStatus値修正
- `app/dashboard/page.tsx` - 無効なプロパティ参照削除
- `store/demo-store.ts` - 型キャスト修正
- `store/index.ts` - DocumentCategory型更新

**主な修正内容:**
- `fundPlan.xxx` → `fundPlan.data.xxx` へのアクセス修正
- `schedule.contractDate` → `schedule.constructionStart` 修正
- `payment.xxx` → `paymentPlanConstruction.xxx.totalAmount` 修正
- `funding.xxx` → `loanPlan.bankA.xxx` 修正

### ファイル変更

| ファイル | 変更内容 |
|---------|---------|
| `components/customers/document-manager.tsx` | 新規作成 - 書類管理コンポーネント |
| `app/customers/[id]/page.tsx` | 書類タブ追加 |
| `components/contracts/contract-wizard.tsx` | FundPlanData連携修正 |
| `app/plan-requests/new/page.tsx` | プロパティ名修正 |
| `store/index.ts` | DocumentCategory型追加 |
| `store/demo-store.ts` | 型キャスト修正 |

---

## 2024年12月26日 - 顧客管理画面の分離・ナビゲーション改善

### 実装した機能

#### 1. 顧客管理画面の分離

**契約前・契約後でページを分離:**

| ページ | URL | 対象ステータス | UI |
|--------|-----|---------------|-----|
| 限定会員前顧客 | `/pre-members` | 資料請求→イベント予約→イベント参加 | カンバン（D&D対応） |
| 契約前顧客管理 | `/customers` | 限定会員→面談→建築申込→プラン提出→内定 / ボツ・他決 | カンバン（D&D対応） |
| 契約後顧客管理 | `/post-contract` | 変更契約前→変更契約後 | カンバン（D&D対応） |
| オーナー | `/owners` | 引渡済み | リスト表示 |

**新しいパイプラインステータス:**

```typescript
// 限定会員前顧客
type PreMemberStatus = '資料請求' | 'イベント予約' | 'イベント参加'

// 契約前顧客
type PreContractStatus = '限定会員' | '面談' | '建築申込' | 'プラン提出' | '内定' | 'ボツ・他決'

// 契約後顧客
type PostContractStatus = '変更契約前' | '変更契約後'

// オーナー
type OwnerStatus = 'オーナー'
```

#### 2. ナビゲーションメニューの改善

**顧客管理ドロップダウン:**
- 限定会員前顧客
- 契約前顧客管理
- 契約後顧客管理
- オーナー

**書類作成ドロップダウン（整理）:**
- 資金計画書
- プラン依頼
- 契約依頼（引継書を統合）

#### 3. 土地情報アラートの改善

- 物件カードにURLを直接表示
- 物件検索タブにもURL表示を追加

### ファイル変更

| ファイル | 変更内容 |
|---------|---------|
| `types/database.ts` | パイプラインステータス型の再構成 |
| `app/pre-members/page.tsx` | 新規作成 |
| `app/customers/page.tsx` | 契約前顧客のみ表示に変更 |
| `app/post-contract/page.tsx` | 新規作成 |
| `app/owners/page.tsx` | 新規作成 |
| `components/layout/header.tsx` | ナビゲーション更新 |
| `app/property-alerts/page.tsx` | カードにURL表示を追加 |

---

## 2024年12月22日 - パイプラインチェックリスト機能

### 実装した機能

#### 1. パイプラインチェックリスト

**概要:**
「順番にこなしていくと契約できる」というステップバイステップの営業支援システム。
各パイプラインステージ（反響→イベント参加→...→引渡）でやるべきことを管理。

**データベース:** `supabase/migrations/004_pipeline_checklists.sql`

- `pipeline_checklist_templates` - 管理者が設定するテンプレート
- `customer_checklist_items` - 顧客別の進捗管理

**管理画面:** `/admin/checklists`

- ステージごとにチェック項目を設定
- 項目の追加・編集・削除
- 必須項目の設定
- 順序の管理

**顧客詳細ページ:**

- 新しい「チェックリスト」タブ（デフォルト表示）
- 全体進捗バー（契約への道のり）
- ステージごとの進捗表示
- 現在のステータスをハイライト
- チェックのON/OFF切り替え
- 必須項目の表示

**デフォルトチェック項目（各ステージ）:**

| ステージ | 項目例 |
|---------|-------|
| 反響 | 反響登録完了、初回電話連絡、資料送付 |
| イベント参加 | 来場受付完了、担当者挨拶、次回アポ取得 |
| 面談 | 要望ヒアリング、土地条件整理、資金計画書作成 |
| 建築申込 | 申込書受領、申込金入金確認、詳細プラン打合せ |
| 契約 | 契約書作成、重要事項説明、契約締結 |
| 着工 | 工事部引継完了、近隣挨拶、基礎工事完了 |
| 引渡 | 完成立会、残代金入金確認、鍵引渡 |

**APIエンドポイント:**

| エンドポイント | メソッド | 機能 |
|---------------|---------|------|
| `/api/checklist-templates` | GET | テンプレート一覧取得 |
| `/api/checklist-templates` | POST | テンプレート作成 |
| `/api/checklist-templates` | PATCH | テンプレート更新 |
| `/api/checklist-templates` | DELETE | テンプレート削除 |
| `/api/customer-checklists` | GET | 顧客のチェックリスト取得 |
| `/api/customer-checklists` | POST | チェック状態の更新 |

**使い方:**
1. 管理者: `/admin/checklists` でテンプレートを設定
2. 営業: 顧客詳細ページの「チェックリスト」タブで進捗管理
3. チェック項目を順番にこなして契約へ

---

## 2024年12月22日 - AI土地条件抽出・PWA対応

### 実装した機能

#### 1. AI土地条件抽出機能

**ファイル:** `lib/ai-analysis.ts`

議事録やメモから土地探し条件を自動抽出:
- エリア（関西の市区町村）
- 価格帯（「3000万円以下」「予算3500万くらい」など）
- 土地面積（「40坪」「130㎡」など）
- 駅徒歩（「駅10分以内」「駅近」など）
- 方角（「南向き希望」「日当たり」など）
- その他条件（整形地、角地、駐車場2台、小学校近くなど）

**使い方:**
1. 顧客詳細 → 活動履歴タブ
2. 議事録をドラッグ＆ドロップ or メモ入力
3. 「AI分析を実行」ボタン
4. 土地探し条件が自動抽出される
5. 「この条件でアラートを登録」でワンクリック登録

#### 2. 物件アラートAPI

**APIエンドポイント:** `/api/property-alerts`

| メソッド | 機能 |
|---------|------|
| GET | アラート一覧取得 |
| POST | 新規アラート登録 |
| PATCH | アラート更新 |
| DELETE | アラート削除 |

#### 3. マルチソースクローラー

**ファイル:** `lib/crawl/multi-source-crawler.ts`

- SUUMO、athome、LIFULL HOME'Sから土地情報を取得
- 同一物件の重複判定（住所・価格で判定）
- SUUMOを優先してデータを一元管理

#### 4. レインズCSVインポート

**ファイル:** `lib/crawl/reins-importer.ts`

- レインズ会員としてダウンロードしたCSVをインポート
- フィールド自動マッピング
- マッチング処理と連携

#### 5. PWA対応

**ファイル:** `public/manifest.json`, `public/sw.js`

- ホーム画面に追加可能
- オフライン対応（Service Worker）
- スマホアプリバッジ（未読件数表示）
- プッシュ通知の基盤

**スマホでの使い方:**
1. Chrome/Safariで開く
2. 「ホーム画面に追加」
3. アプリアイコンにバッジ表示

#### 6. 通知バッジ統合

**ヘッダーのベルアイコン:**
- ローカル通知（契約承認など）+ 物件マッチング通知を合算
- 1分ごとに自動更新
- PWAバッジと連動

### 通知フロー（完成版）

```
1. Formbridge → 初回受付データ → 顧客登録
2. 営業が議事録を入力
3. AI分析 → 土地条件を抽出
4. ワンクリックでアラート登録
5. 毎日10時に自動クロール（SUUMO/athome/LIFULL）
6. 顧客条件とマッチング（70%以上で通知）
7. ダッシュボード + ヘッダーバッジ + スマホバッジで営業に通知
8. 営業がお客様に提案 → 契約率UP
```

---

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
