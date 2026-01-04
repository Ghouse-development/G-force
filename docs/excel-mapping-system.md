# Excel セルマッピングシステム

## 概要

資金計画書Excelテンプレートのセルマッピングを管理・検証するシステムです。

## ファイル構成

```
lib/fund-plan/
  └── cell-mapping.ts      # セルマッピング設定（メイン）

scripts/
  ├── verify-mappings.ts           # セルマッピング検証
  ├── validate-mapping-coverage.ts # FundPlanData型との照合
  ├── investigate-unmapped-fields.ts # 未マッピングフィールド調査
  ├── analyze-template-deep.ts     # テンプレート深層分析
  ├── analyze-input-cells.ts       # 入力セル検出
  ├── analyze-costs.ts             # 費用セクション分析
  └── analyze-remaining.ts         # 残りセクション分析
```

## 検証コマンド

```bash
# セルマッピングの検証（cell-mapping.ts の verified フラグ確認）
npx tsx scripts/verify-mappings.ts

# FundPlanData型との照合（型とマッピングの整合性確認）
npx tsx scripts/validate-mapping-coverage.ts

# 未マッピングフィールドの調査（テンプレートからセル位置を探索）
npx tsx scripts/investigate-unmapped-fields.ts
```

## 現在の状態（2026/01/04）

### セルマッピング

| 項目 | 状態 |
|---|---|
| 総セル数 | 50 |
| 検証済み | 50 (100%) |
| 未検証 | 0 |

### 型カバレッジ

| 項目 | 数 |
|---|---|
| FundPlanData総フィールド | 214 |
| マッピング済み | 50 |
| 除外（数式/複雑オブジェクト） | 157 |
| 要調査 | 7 |
| カバー率 | 96.7% |

### 要調査フィールド（ラベルは存在するが入力セル未発見）

| フィールド | 備考 |
|---|---|
| customerName | teiNameと同一の可能性 |
| constructionName | 工事名称 |
| constructionAddress | 建築場所 |
| salesRep | 営業担当者 |
| managerName | 所属長 |
| storageBatteryType | 蓄電池タイプ（A48ラベル） |
| propertyTaxSettlement | 固定資産税清算金 |

## セクション別マッピング

### ヘッダー（1行目）- 7セル
- AH1: 邸名（A1〜E1は =AH1 を参照）
- N1: 商品タイプ
- CA1: 施工面積（坪）
- CJ1: 階数
- BG1: 準防火地域（〇 or ×）
- BM1: 建物構造
- DA1: 見積日

### 付帯工事費用A（33-41行目）- 8セル
- O35: 構造計算
- O37: 構造図作成費用
- O39: BELS評価書申請費用
- AI33: 屋外電気・給水・排水・雨水工事
- AI35: 瑕疵保険・地盤保証・シロアリ保証
- AI37: 設計・工事監理費用
- AI39: 安全対策費用
- AI41: 仮設工事費用

### 付帯工事費用B（46-54行目）- 2セル
- G46: 太陽光パネル枚数
- AI54: オプション工事費用

### 付帯工事費用C（69行目）- 1セル
- O69: 残土処理工事費用
- ※ O59, O61, O67等は数式で自動計算

### 諸費用（82-98行目）- 8セル
- O82: 建物登記費用
- O86: つなぎローン諸費用
- O88: 金銭消費貸借契約印紙代
- O90: 建物請負工事契約印紙代
- O92: 火災保険料
- O94: 先行工事
- O96: 外構工事
- O98: 造作工事

### 土地費用（AI列 82-92行目）- 5セル
- AI82: 土地売買代金
- AI86: 土地売買契約印紙代
- AI88: 土地仲介手数料
- AI90: 土地登記費用
- AI92: 滅失登記費用

### 借入計画（33-37行目）- 9セル
- BA33/BG33/BO33: A銀行（借入額/金利/年数）
- BA35/BG35/BO35: B銀行
- BA37/BG37/BO37: C銀行

### 工程スケジュール（DA列 8-26行目）- 7セル
- DA8: 土地契約日
- DA10: 建物契約日
- DA18: 仕様最終打合せ
- DA20: 変更契約
- DA22: 着工
- DA24: 上棟
- DA26: 竣工

### 支払計画（BG列 18-22行目）- 3セル
- BG18: 契約金割合（0.1 = 10%）
- BG20: 中間時金(1)割合（0.3 = 30%）
- BG22: 中間時金(2)割合（0.3 = 30%）

## 自動計算セル（入力不要）

以下のセルは数式で自動計算されるため、マッピング不要：

- X28: 坪単価（商品タイプN1から自動計算）
- O33: 確認申請費用
- O41: 長期優良住宅申請費用
- O46: 太陽光発電システム費用
- O48: 蓄電池費用
- O59: 準防火地域費用
- O61: 解体工事費用
- O67: 地盤改良工事費用
- その他多数（investigate-unmapped-fields.ts の FORMULA_FIELDS 参照）

## テンプレート変更時の対応

1. `analyze-template-deep.ts` でテンプレート構造を分析
2. `investigate-unmapped-fields.ts` で変更箇所を特定
3. `cell-mapping.ts` のセル位置を更新
4. `verify-mappings.ts` で検証
5. `validate-mapping-coverage.ts` で型との整合性確認

## 設計原則

1. **検証済みのみ書き込み**: `verified: true` のセルのみエクスポート時に書き込む
2. **型安全**: `dataPath` は `FundPlanData` 型に存在するパスのみ
3. **自動検出**: スクリプトによる自動検出で人的ミスを削減
4. **ドキュメント化**: 全てのセル位置と備考を記録
