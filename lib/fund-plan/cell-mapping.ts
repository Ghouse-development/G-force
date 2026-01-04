/**
 * 資金計画書Excelテンプレートのセルマッピング設定
 *
 * テンプレートが変更された場合は、このファイルのセル位置を更新してください。
 * セル位置はExcelで確認できます（例：AH1 = 列AH, 行1）
 *
 * 検証コマンド:
 * - npx tsx scripts/verify-mappings.ts           # セルマッピング検証
 * - npx tsx scripts/validate-mapping-coverage.ts # 型との照合
 *
 * ====================================================================
 * 分析結果 (2026/01/04 - テンプレート深層分析による完全更新)
 * ====================================================================
 *
 * 【検証済みセル一覧】50セル - 検証率100%
 * 【型カバレッジ】96.7% (50マッピング + 157除外 / 214フィールド)
 *
 * ■ ヘッダー（1行目）- 7セル
 * - AH1: 邸名, N1: 商品タイプ, CA1: 施工面積
 * - CJ1: 階数, BG1: 準防火地域, BM1: 建物構造, DA1: 見積日
 *
 * ■ 付帯工事費用A（33-41行目）- 8セル
 * - O35: 構造計算, O37: 構造図, O39: BELS申請
 * - AI33: 屋外電気・給水, AI35: 瑕疵保険等
 * - AI37: 設計監理, AI39: 安全対策, AI41: 仮設工事
 *
 * ■ 付帯工事費用B（46-54行目）- 2セル
 * - G46: 太陽光パネル枚数, AI54: オプション工事
 *
 * ■ 付帯工事費用C（69行目）- 1セル
 * - O69: 残土処理工事（他は数式で自動計算）
 *
 * ■ 諸費用（82-98行目）- 8セル
 * - O82: 建物登記, O86: つなぎローン, O88: 金銭消費貸借印紙
 * - O90: 建物請負印紙, O92: 火災保険, O94: 先行工事
 * - O96: 外構工事, O98: 造作工事
 *
 * ■ 土地費用（AI列 82-92行目）- 5セル
 * - AI82: 土地売買代金, AI86: 土地契約印紙, AI88: 仲介手数料
 * - AI90: 土地登記費用, AI92: 滅失登記費用
 *
 * ■ 借入計画（33-37行目）- 9セル
 * - BA/BG/BO 33: A銀行, 35: B銀行, 37: C銀行
 *
 * ■ 工程スケジュール（DA列 8-26行目）- 7セル
 * - DA8: 土地契約, DA10: 建物契約, DA18: 仕様最終打合せ
 * - DA20: 変更契約, DA22: 着工, DA24: 上棟, DA26: 竣工
 *
 * ■ 支払計画（BG列 18-22行目）- 3セル
 * - BG18: 契約金(10%), BG20: 中間時金1(30%), BG22: 中間時金2(30%)
 *
 * ■ 自動計算セクション（入力不要）
 * - 坪単価(X28), 確認申請(O33), 長期優良(O41), 太陽光費用(O46)
 * - 蓄電池(O48), 準防火(O59), 解体(O61), 地盤改良(O67) 等
 *
 * 詳細: docs/excel-mapping-system.md
 * ====================================================================
 */

export interface CellMapping {
  /** セルアドレス (例: 'AH1') */
  address: string
  /** データフィールドへのパス (例: 'incidentalCostA.confirmationApplicationFee') */
  dataPath: string
  /** 説明 */
  description: string
  /** 値の型 */
  type: 'string' | 'number' | 'date' | 'boolean' | 'formula'
  /** 必須かどうか */
  required?: boolean
  /** 検証済みかどうか（テンプレートで確認済み） */
  verified: boolean
  /** 備考 */
  note?: string
}

export interface SectionMapping {
  /** セクション名 */
  name: string
  /** セクション説明 */
  description: string
  /** セルマッピング一覧 */
  cells: CellMapping[]
}

/**
 * 【資金計画書】シートのセルマッピング（セクション別）
 */
export const FUND_PLAN_SECTIONS: SectionMapping[] = [
  // ========================================
  // ヘッダー部分（1行目〜3行目）
  // ========================================
  {
    name: 'header',
    description: 'ヘッダー情報（邸名、商品、施工面積等）',
    cells: [
      {
        address: 'AH1',
        dataPath: 'teiName',
        description: '邸名（○○様邸）',
        type: 'string',
        required: true,
        verified: true,
        note: 'A1〜E1は =AH1 を参照している',
      },
      {
        address: 'N1',
        dataPath: 'productType',
        description: '商品タイプ（LIFE, LIFE+, HOURS等）',
        type: 'string',
        required: true,
        verified: true,
      },
      {
        address: 'CA1',
        dataPath: 'constructionArea',
        description: '施工面積（坪）',
        type: 'number',
        required: true,
        verified: true,
      },
      {
        address: 'CJ1',
        dataPath: 'floorCount',
        description: '階数（1, 2, 3）',
        type: 'number',
        verified: true,
      },
      {
        address: 'BG1',
        dataPath: 'fireProtectionZone',
        description: '準防火地域（〇 or ×）',
        type: 'string',
        verified: true,
        note: '準防火地域の場合は〇、それ以外は×',
      },
      {
        address: 'BM1',
        dataPath: 'buildingStructure',
        description: '建物構造',
        type: 'string',
        verified: true,
      },
      {
        address: 'DA1',
        dataPath: 'estimateDate',
        description: '見積作成日',
        type: 'date',
        verified: true,
        note: 'デフォルトは =TODAY() 数式。固定日付を設定する場合のみ上書き',
      },
    ],
  },

  // ========================================
  // 坪単価・建物本体（28-30行目付近）
  // 分析結果: X28は数式（商品タイプN1から自動計算）
  // ========================================
  {
    name: 'buildingMain',
    description: '建物本体工事（坪単価・施工面積）- 自動計算',
    cells: [
      // 注: X28（坪単価）は数式で自動計算されるため入力不要
      // 商品タイプ（N1）を変更すると自動的に坪単価が決まる
    ],
  },

  // ========================================
  // ➋付帯工事費用A（33-42行目付近）
  // 分析結果: ラベルA-L列、金額入力O列（結合セル）
  // ========================================
  {
    name: 'incidentalCostA',
    description: '付帯工事費用A（建物本体工事以外にかかる費用）',
    cells: [
      // 確認申請費用: O33は数式（=IF(CJ1=3, 500000, 400000)）なので入力不要
      {
        address: 'O35',
        dataPath: 'incidentalCostA.structuralCalculation',
        description: '構造計算',
        type: 'number',
        verified: true,
        note: 'ラベルA35-L36「構造計算」、O35=200000（入力セル確認済み）',
      },
      {
        address: 'O37',
        dataPath: 'incidentalCostA.structuralDrawingFee',
        description: '構造図作成費用',
        type: 'number',
        verified: true,
        note: 'ラベルA37-L38「構造図作成費用」、O37=300000（入力セル確認済み）',
      },
      {
        address: 'O39',
        dataPath: 'incidentalCostA.belsApplicationFee',
        description: 'BELS評価書申請費用',
        type: 'number',
        verified: true,
        note: 'ラベルA39-L40「BELS評価書申請費用」、O39=200000（入力セル確認済み）',
      },
      // 長期優良住宅申請費用: O41は数式なので入力不要
      {
        address: 'AI33',
        dataPath: 'incidentalCostA.outdoorElectricWaterDrainageFee',
        description: '屋外電気・給水・排水・雨水工事',
        type: 'number',
        verified: true,
        note: 'AI33=900000（自動検出による検証済み）',
      },
      {
        address: 'AI35',
        dataPath: 'incidentalCostA.defectInsuranceGroundTermiteWarranty',
        description: '瑕疵保険・地盤保証・シロアリ保証',
        type: 'number',
        verified: true,
        note: 'ラベルU35-AF36「瑕疵保険・地盤保証・シロアリ保証」、AI35=300000（入力セル確認済み）',
      },
      {
        address: 'AI37',
        dataPath: 'incidentalCostA.designSupervisionFee',
        description: '設計・工事監理費用',
        type: 'number',
        verified: true,
        note: 'AI37=950000（自動検出による検証済み）',
      },
      {
        address: 'AI39',
        dataPath: 'incidentalCostA.safetyMeasuresFee',
        description: '安全対策費用',
        type: 'number',
        verified: true,
        note: 'AI39=250000（自動検出による検証済み）',
      },
      {
        address: 'AI41',
        dataPath: 'incidentalCostA.temporaryConstructionFee',
        description: '仮設工事費用',
        type: 'number',
        verified: true,
        note: 'AI41=300000（自動検出による検証済み）',
      },
    ],
  },

  // ========================================
  // ➌付帯工事費用B（46-58行目付近）
  // 分析結果: 太陽光は枚数入力、金額は数式で自動計算
  // ========================================
  {
    name: 'incidentalCostB',
    description: '付帯工事費用B（間取・オプションによって変わる費用）',
    cells: [
      {
        address: 'G46',
        dataPath: 'incidentalCostB.solarPanelCount',
        description: '太陽光パネル枚数',
        type: 'number',
        verified: true,
        note: 'ラベルA46-F47「太陽光発電システム」、G46=18（枚数入力確認済み）。金額O46は数式で自動計算',
      },
      // 蓄電池: O48は数式（_xlfn.IFS($A$48="蓄電池...）で自動計算のため入力不要
      // 蓄電池タイプはA48のラベル文字列で決まる（V2H/V2X設置なし等）
      {
        address: 'AI54',
        dataPath: 'incidentalCostB.optionCost',
        description: 'オプション工事費用',
        type: 'number',
        verified: true,
        note: 'AI54=2500000（自動検出による検証済み）',
      },
    ],
  },

  // ========================================
  // ➍付帯工事費用C（59-80行目付近）
  // 分析結果: O59, O61, O67等は数式で自動計算、O69は入力セル
  // ========================================
  {
    name: 'incidentalCostC',
    description: '付帯工事費用C（土地によってかかる費用）',
    cells: [
      // 注: 準防火地域(O59)、解体工事(O61)、地盤改良(O67)等は数式
      {
        address: 'O69',
        dataPath: 'incidentalCostC.soilDisposalFee',
        description: '残土処理工事費用',
        type: 'number',
        verified: true,
        note: 'O69=0（自動検出による検証済み）',
      },
    ],
  },

  // ========================================
  // ➎諸費用（82-97行目）
  // 分析結果: O列が入力セル
  // ========================================
  {
    name: 'miscellaneousCosts',
    description: '諸費用',
    cells: [
      {
        address: 'O82',
        dataPath: 'miscellaneousCosts.buildingRegistrationFee',
        description: '建物登記費用',
        type: 'number',
        verified: true,
        note: 'ラベルA82-L83「建物登記費用」（入力セル確認済み）',
      },
      {
        address: 'O86',
        dataPath: 'miscellaneousCosts.bridgeLoanFee',
        description: 'つなぎローン諸費用(金利、手数料等)',
        type: 'number',
        verified: true,
        note: 'ラベルA86-L87、O86=200000（入力セル確認済み）',
      },
      {
        address: 'O88',
        dataPath: 'miscellaneousCosts.loanContractStampDuty',
        description: '金銭消費貸借契約 印紙代',
        type: 'number',
        verified: true,
        note: 'ラベルA88-L89、O88=40000（入力セル確認済み）',
      },
      {
        address: 'O90',
        dataPath: 'miscellaneousCosts.constructionContractStampDuty',
        description: '建物請負工事契約 印紙代（電子契約）',
        type: 'number',
        verified: true,
        note: 'ラベルA90-L91、O90=0（入力セル確認済み）',
      },
      {
        address: 'O92',
        dataPath: 'miscellaneousCosts.fireInsurance',
        description: '火災保険料',
        type: 'number',
        verified: true,
        note: 'ラベルA92-L93、O92=200000（入力セル確認済み）',
      },
      {
        address: 'O94',
        dataPath: 'miscellaneousCosts.advanceConstruction',
        description: '先行工事（税込）',
        type: 'number',
        verified: true,
        note: 'O94=0（自動検出による検証済み）',
      },
      {
        address: 'O96',
        dataPath: 'miscellaneousCosts.exteriorConstruction',
        description: '外構工事（税込）',
        type: 'number',
        verified: true,
        note: 'ラベルA96-L97、O96=2000000（入力セル確認済み）',
      },
      {
        address: 'O98',
        dataPath: 'miscellaneousCosts.customConstruction',
        description: '造作工事（税込）',
        type: 'number',
        verified: true,
        note: 'O98=0（自動検出による検証済み）',
      },
    ],
  },

  // ========================================
  // ➏土地費用（AI列 82-93行目）
  // 分析結果: 左側O列が諸費用、右側AI列が土地費用
  // ========================================
  {
    name: 'landCosts',
    description: '土地費用',
    cells: [
      {
        address: 'AI82',
        dataPath: 'landCosts.landPrice',
        description: '土地売買代金',
        type: 'number',
        verified: true,
        note: 'ラベルU82-AF83「土地売買代金」、AI82=30000000（入力セル確認済み）',
      },
      {
        address: 'AI86',
        dataPath: 'landCosts.landContractStampDuty',
        description: '土地売買契約 印紙代',
        type: 'number',
        verified: true,
        note: 'ラベルU86-AF87「土地売買契約 印紙代」（入力セル確認済み）',
      },
      {
        address: 'AI88',
        dataPath: 'landCosts.brokerageFee',
        description: '土地仲介手数料',
        type: 'number',
        verified: true,
        note: 'ラベルU88-AF89「土地仲介手数料」（入力セル確認済み）',
      },
      {
        address: 'AI90',
        dataPath: 'landCosts.landRegistrationFee',
        description: '土地登記費用',
        type: 'number',
        verified: true,
        note: 'ラベルU90-AF91「土地登記費用」（入力セル確認済み）',
      },
      {
        address: 'AI92',
        dataPath: 'landCosts.extinctionRegistrationFee',
        description: '滅失登記費用',
        type: 'number',
        verified: true,
        note: 'ラベルU92-AF93「滅失登記費用」（入力セル確認済み）',
      },
    ],
  },

  // ========================================
  // 借入計画（31-38行目）
  // ========================================
  {
    name: 'loanPlan',
    description: '借入計画（銀行A/B/C）',
    cells: [
      // A銀行（33-34行目）
      {
        address: 'BA33',
        dataPath: 'loanPlan.bankA.amount',
        description: 'A銀行 借入額',
        type: 'number',
        verified: true,
        note: 'AR33-AZ34にラベル「A銀行」、BA33以降が入力',
      },
      {
        address: 'BG33',
        dataPath: 'loanPlan.bankA.interestRate',
        description: 'A銀行 金利',
        type: 'number',
        verified: true,
        note: '金利は小数（例: 0.0082 = 0.82%）',
      },
      {
        address: 'BO33',
        dataPath: 'loanPlan.bankA.loanYears',
        description: 'A銀行 借入年数',
        type: 'number',
        verified: true,
      },
      // B銀行（35-36行目）
      {
        address: 'BA35',
        dataPath: 'loanPlan.bankB.amount',
        description: 'B銀行 借入額',
        type: 'number',
        verified: true,
        note: 'AR35-AZ36にラベル「B銀行」',
      },
      {
        address: 'BG35',
        dataPath: 'loanPlan.bankB.interestRate',
        description: 'B銀行 金利',
        type: 'number',
        verified: true,
      },
      {
        address: 'BO35',
        dataPath: 'loanPlan.bankB.loanYears',
        description: 'B銀行 借入年数',
        type: 'number',
        verified: true,
      },
      // C銀行（37-38行目）
      {
        address: 'BA37',
        dataPath: 'loanPlan.bankC.amount',
        description: 'C銀行 借入額',
        type: 'number',
        verified: true,
        note: 'AR37-AZ38にラベル「C銀行」',
      },
      {
        address: 'BG37',
        dataPath: 'loanPlan.bankC.interestRate',
        description: 'C銀行 金利',
        type: 'number',
        verified: true,
      },
      {
        address: 'BO37',
        dataPath: 'loanPlan.bankC.loanYears',
        description: 'C銀行 借入年数',
        type: 'number',
        verified: true,
      },
    ],
  },

  // ========================================
  // 工程スケジュール（CT列 8-27行目）
  // ========================================
  {
    name: 'schedule',
    description: '工程スケジュール',
    cells: [
      {
        address: 'DA8',
        dataPath: 'schedule.landContract',
        description: '土地契約日',
        type: 'date',
        verified: true,
        note: 'ラベルCT8-CZ9「土地契約」',
      },
      {
        address: 'DA10',
        dataPath: 'schedule.buildingContract',
        description: '建物契約日',
        type: 'date',
        verified: true,
        note: 'ラベルCT10-CZ11「建物契約」',
      },
      {
        address: 'DA18',
        dataPath: 'schedule.finalSpecMeeting',
        description: '仕様最終打合せ日',
        type: 'date',
        verified: true,
        note: 'ラベルCT18-CZ19「仕様最終打合せ」',
      },
      {
        address: 'DA20',
        dataPath: 'schedule.changeContract',
        description: '変更契約日',
        type: 'date',
        verified: true,
        note: 'ラベルCT20-CZ21「変更契約」',
      },
      {
        address: 'DA22',
        dataPath: 'schedule.constructionStart',
        description: '着工日',
        type: 'date',
        verified: true,
        note: 'ラベルCT22-CZ23「着工」',
      },
      {
        address: 'DA24',
        dataPath: 'schedule.roofRaising',
        description: '上棟日',
        type: 'date',
        verified: true,
        note: 'ラベルCT24-CZ25「上棟」',
      },
      {
        address: 'DA26',
        dataPath: 'schedule.completion',
        description: '竣工（完了検査）日',
        type: 'date',
        verified: true,
        note: 'ラベルCT26-CZ27「竣工（完了検査）」',
      },
    ],
  },

  // ========================================
  // 支払計画
  // 分析結果: BA列にラベル、BG列に割合（0.1=10%, 0.3=30%等）
  // ========================================
  {
    name: 'paymentPlan',
    description: '支払計画',
    cells: [
      {
        address: 'BG18',
        dataPath: 'paymentPlanConstruction.contractFee.standardRate',
        description: '契約金（割合）',
        type: 'number',
        verified: true,
        note: 'ラベルBA18-BF19「契約金」、BG18=0.1（10%）（入力セル確認済み）',
      },
      {
        address: 'BG20',
        dataPath: 'paymentPlanConstruction.interimPayment1.standardRate',
        description: '中間時金(1)（割合）',
        type: 'number',
        verified: true,
        note: 'ラベルBA20-BF21「中間時金(1)」、BG20=0.3（30%）（入力セル確認済み）',
      },
      {
        address: 'BG22',
        dataPath: 'paymentPlanConstruction.interimPayment2.standardRate',
        description: '中間時金(2)（割合）',
        type: 'number',
        verified: true,
        note: 'ラベルBA22-BF23「中間時金(2)」、BG22=0.3（30%）（入力セル確認済み）',
      },
      // 最終金はBG24以降で計算式により自動計算される可能性あり（要確認）
    ],
  },

  // ========================================
  // 担当者情報
  // ========================================
  {
    name: 'staff',
    description: '担当者情報',
    cells: [
      // TODO: テンプレート分析で位置特定後に追加
    ],
  },
]

/**
 * 旧形式との互換性のためのフラットなマッピング
 */
export const FUND_PLAN_SHEET_MAPPING: Record<string, { address: string; description: string; type: string; required?: boolean }> = {
  teiName: {
    address: 'AH1',
    description: '邸名（○○様邸）',
    type: 'string',
    required: true,
  },
  productType: {
    address: 'N1',
    description: '商品タイプ（LIFE, LIFE+, HOURS等）',
    type: 'string',
    required: true,
  },
  constructionArea: {
    address: 'CA1',
    description: '施工面積（坪）',
    type: 'number',
    required: true,
  },
  floorCount: {
    address: 'CJ1',
    description: '階数（1, 2, 3）',
    type: 'number',
  },
  isQuasiFireProof: {
    address: 'BG1',
    description: '準防火地域（〇 or ×）',
    type: 'string',
  },
  buildingStructure: {
    address: 'BM1',
    description: '建物構造',
    type: 'string',
  },
  estimateDate: {
    address: 'DA1',
    description: '見積作成日',
    type: 'date',
  },
  pricePerTsubo: {
    address: 'X28',
    description: '坪単価（円）',
    type: 'number',
  },
}

// ============================================
// ユーティリティ関数
// ============================================

/**
 * セルアドレスからデータパスを取得
 */
export function getDataPathByAddress(address: string): string | undefined {
  for (const section of FUND_PLAN_SECTIONS) {
    const cell = section.cells.find(c => c.address === address)
    if (cell) return cell.dataPath
  }
  return undefined
}

/**
 * データパスからセルアドレスを取得
 */
export function getAddressByDataPath(dataPath: string): string | undefined {
  for (const section of FUND_PLAN_SECTIONS) {
    const cell = section.cells.find(c => c.dataPath === dataPath)
    if (cell) return cell.address
  }
  return undefined
}

/**
 * 検証済みのマッピングのみ取得
 */
export function getVerifiedMappings(): CellMapping[] {
  const verified: CellMapping[] = []
  for (const section of FUND_PLAN_SECTIONS) {
    verified.push(...section.cells.filter(c => c.verified))
  }
  return verified
}

/**
 * 未検証のマッピングを取得
 */
export function getUnverifiedMappings(): CellMapping[] {
  const unverified: CellMapping[] = []
  for (const section of FUND_PLAN_SECTIONS) {
    unverified.push(...section.cells.filter(c => !c.verified))
  }
  return unverified
}

/**
 * マッピング状況のサマリーを取得
 */
export function getMappingSummary(): {
  totalSections: number
  totalCells: number
  verifiedCells: number
  unverifiedCells: number
  emptySections: string[]
} {
  let totalCells = 0
  let verifiedCells = 0
  const emptySections: string[] = []

  for (const section of FUND_PLAN_SECTIONS) {
    totalCells += section.cells.length
    verifiedCells += section.cells.filter(c => c.verified).length
    if (section.cells.length === 0) {
      emptySections.push(section.name)
    }
  }

  return {
    totalSections: FUND_PLAN_SECTIONS.length,
    totalCells,
    verifiedCells,
    unverifiedCells: totalCells - verifiedCells,
    emptySections,
  }
}

/**
 * セルマッピングからデータキーを取得（互換性用）
 */
export function getCellAddress(key: string): string | undefined {
  return FUND_PLAN_SHEET_MAPPING[key]?.address
}

/**
 * マッピング情報を取得（互換性用）
 */
export function getCellMapping(key: string): { address: string; description: string; type: string; required?: boolean } | undefined {
  return FUND_PLAN_SHEET_MAPPING[key]
}

/**
 * 全マッピングのセルアドレス一覧を取得
 */
export function getAllCellAddresses(): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, mapping] of Object.entries(FUND_PLAN_SHEET_MAPPING)) {
    result[key] = mapping.address
  }
  return result
}

/**
 * マッピングの検証（必須項目のチェック）
 */
export function validateMapping(data: Record<string, unknown>): string[] {
  const errors: string[] = []

  for (const [key, mapping] of Object.entries(FUND_PLAN_SHEET_MAPPING)) {
    if (mapping.required && (data[key] === undefined || data[key] === null || data[key] === '')) {
      errors.push(`必須項目「${mapping.description}」が未設定です（セル: ${mapping.address}）`)
    }
  }

  return errors
}

/**
 * ネストされたオブジェクトから値を取得
 */
export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.')
  let current: unknown = obj

  for (const key of keys) {
    if (current === null || current === undefined) return undefined
    if (typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[key]
  }

  return current
}

/**
 * 検証済みマッピングを使ってデータからセル値のマップを生成
 */
export function generateCellValueMap(data: Record<string, unknown>): Map<string, unknown> {
  const cellValues = new Map<string, unknown>()

  for (const section of FUND_PLAN_SECTIONS) {
    for (const cell of section.cells) {
      if (!cell.verified) continue

      const value = getNestedValue(data, cell.dataPath)
      if (value !== undefined && value !== null && value !== '') {
        cellValues.set(cell.address, value)
      }
    }
  }

  return cellValues
}

/**
 * マッピング状況を表示（デバッグ用）
 */
export function printMappingStatus(): void {
  const summary = getMappingSummary()

  console.log('\n========================================')
  console.log('セルマッピング状況')
  console.log('========================================')
  console.log(`総セクション数: ${summary.totalSections}`)
  console.log(`総セル数: ${summary.totalCells}`)
  console.log(`  - 検証済み: ${summary.verifiedCells}`)
  console.log(`  - 未検証: ${summary.unverifiedCells}`)

  if (summary.emptySections.length > 0) {
    console.log(`\n空のセクション: ${summary.emptySections.join(', ')}`)
  }

  console.log('\n【セクション別】')
  for (const section of FUND_PLAN_SECTIONS) {
    const verified = section.cells.filter(c => c.verified).length
    const total = section.cells.length
    const status = total === 0 ? '(空)' : `${verified}/${total} 検証済み`
    console.log(`  ${section.name}: ${status}`)
  }
}
