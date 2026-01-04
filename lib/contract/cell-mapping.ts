/**
 * 請負契約書 Excel セルマッピング定義
 *
 * 「初期入力」シートにデータを入力すると、他のシートに数式で反映される構造
 * 資金計画書と同様のパターンで実装
 */

// セル情報の型定義
export interface ContractCellMapping {
  address: string // Excelセルアドレス（例: 'B3'）
  dataPath: string // ContractDataオブジェクトのパス（例: 'constructionName'）
  description: string // 日本語説明
  type: 'string' | 'number' | 'date' | 'boolean' | 'dateSerial'
  verified: boolean // 検証済みフラグ
  note?: string // 備考
}

// セクション定義
export interface ContractCellSection {
  name: string
  sheetName: string
  cells: ContractCellMapping[]
}

/**
 * 請負契約書セルマッピング定義
 * シート: 初期入力
 */
export const CONTRACT_SECTIONS: ContractCellSection[] = [
  {
    name: '基本情報',
    sheetName: '初期入力',
    cells: [
      {
        address: 'B3',
        dataPath: 'constructionName',
        description: '工事名称',
        type: 'string',
        verified: true,
        note: '結合セル B3:H3',
      },
      {
        address: 'B4',
        dataPath: 'customerName',
        description: '客先氏名',
        type: 'string',
        verified: true,
        note: '結合セル B4:H4',
      },
      {
        address: 'B5',
        dataPath: 'customerAddress',
        description: '客先住所',
        type: 'string',
        verified: true,
        note: '結合セル B5:H5',
      },
      {
        address: 'B6',
        dataPath: 'customerName2',
        description: '客先氏名2（連名の場合）',
        type: 'string',
        verified: true,
        note: '連名の場合のみ入力',
      },
      {
        address: 'B7',
        dataPath: 'customerAddress2',
        description: '客先住所2',
        type: 'string',
        verified: true,
        note: '連名の場合のみ入力',
      },
    ],
  },
  {
    name: '担当者情報',
    sheetName: '初期入力',
    cells: [
      {
        address: 'B8',
        dataPath: 'importantMatterExplainer.name',
        description: '重要事項説明者',
        type: 'string',
        verified: true,
        note: '結合セル B8:H8、プルダウン選択',
      },
      {
        address: 'B11',
        dataPath: 'ownershipType',
        description: '単独/共有',
        type: 'string',
        verified: true,
        note: 'プルダウン選択',
      },
      {
        address: 'B12',
        dataPath: 'salesRep',
        description: '営業担当',
        type: 'string',
        verified: true,
        note: '結合セル B12:H12、プルダウン選択',
      },
    ],
  },
  {
    name: '契約日',
    sheetName: '初期入力',
    cells: [
      {
        address: 'C13',
        dataPath: 'contractYear',
        description: '請負契約年',
        type: 'number',
        verified: true,
        note: '数字のみ入力',
      },
      {
        address: 'E13',
        dataPath: 'contractMonth',
        description: '請負契約月',
        type: 'number',
        verified: true,
        note: '数字のみ入力',
      },
      {
        address: 'G13',
        dataPath: 'contractDay',
        description: '請負契約日',
        type: 'number',
        verified: true,
        note: '数字のみ入力',
      },
    ],
  },
  {
    name: '建物情報',
    sheetName: '初期入力',
    cells: [
      {
        address: 'B15',
        dataPath: 'constructionSite',
        description: '工事場所',
        type: 'string',
        verified: true,
        note: '地番記載、謄本通りの書き方',
      },
      {
        address: 'B16',
        dataPath: 'structure',
        description: '構造',
        type: 'string',
        verified: true,
        note: '結合セル B16:H16',
      },
      {
        address: 'B17',
        dataPath: 'floorCount',
        description: '建物階数',
        type: 'number',
        verified: true,
        note: 'プルダウン選択',
      },
      {
        address: 'B18',
        dataPath: 'buildingCount',
        description: '棟数',
        type: 'number',
        verified: true,
        note: 'プルダウン選択',
      },
      {
        address: 'B19',
        dataPath: 'floor1Area',
        description: '1階床面積',
        type: 'number',
        verified: true,
        note: '面積表通り記載',
      },
      {
        address: 'B20',
        dataPath: 'floor1Included',
        description: '1階対象フラグ',
        type: 'boolean',
        verified: true,
        note: '対象の場合〇入力',
      },
      {
        address: 'B21',
        dataPath: 'floor2Area',
        description: '2階床面積',
        type: 'number',
        verified: true,
        note: '面積表通り記載',
      },
      {
        address: 'B22',
        dataPath: 'floor2Included',
        description: '2階対象フラグ',
        type: 'boolean',
        verified: true,
        note: '対象の場合〇入力',
      },
      {
        address: 'B23',
        dataPath: 'floor3Area',
        description: '3階床面積',
        type: 'number',
        verified: true,
        note: '面積表通り記載',
      },
      {
        address: 'B24',
        dataPath: 'floor3Included',
        description: '3階対象フラグ',
        type: 'boolean',
        verified: true,
        note: '対象の場合〇入力',
      },
      {
        address: 'B25',
        dataPath: 'constructionArea',
        description: '施工面積',
        type: 'number',
        verified: true,
        note: '坪数',
      },
      {
        address: 'B26',
        dataPath: 'constructionAreaIncluded',
        description: '施工面積対象フラグ',
        type: 'boolean',
        verified: true,
        note: '対象の場合〇入力',
      },
    ],
  },
  {
    name: '工期',
    sheetName: '初期入力',
    cells: [
      {
        address: 'B27',
        dataPath: 'startDate',
        description: '着手期日',
        type: 'dateSerial',
        verified: true,
        note: '日付シリアル値',
      },
      {
        address: 'B28',
        dataPath: 'completionDate',
        description: '完成期日',
        type: 'dateSerial',
        verified: true,
        note: '日付シリアル値',
      },
      {
        address: 'B29',
        dataPath: 'deliveryDate',
        description: '引渡期日',
        type: 'dateSerial',
        verified: true,
        note: '日付シリアル値',
      },
      {
        address: 'B30',
        dataPath: 'contractDate',
        description: '契約日',
        type: 'date',
        verified: true,
        note: '日付型',
      },
    ],
  },
  {
    name: '金額',
    sheetName: '初期入力',
    cells: [
      {
        address: 'B31',
        dataPath: 'constructionPrice',
        description: '工事価格（税抜き）',
        type: 'number',
        verified: true,
        note: '数字間違い、位間違い注意',
      },
    ],
  },
  {
    name: '支払計画',
    sheetName: '初期入力',
    cells: [
      {
        address: 'B34',
        dataPath: 'payment1Amount',
        description: '1回金　建築申込時',
        type: 'number',
        verified: true,
      },
      {
        address: 'B35',
        dataPath: 'payment1Date',
        description: '1回金　支払予定日',
        type: 'dateSerial',
        verified: true,
      },
      {
        address: 'B36',
        dataPath: 'payment2Amount',
        description: '2回金　請負契約時',
        type: 'number',
        verified: true,
      },
      {
        address: 'B37',
        dataPath: 'payment2Date',
        description: '2回金　支払予定日',
        type: 'dateSerial',
        verified: true,
      },
      {
        address: 'B38',
        dataPath: 'payment3Amount',
        description: '3回金　着工時',
        type: 'number',
        verified: true,
      },
      {
        address: 'B39',
        dataPath: 'payment3Date',
        description: '3回金　支払予定日',
        type: 'dateSerial',
        verified: true,
      },
      {
        address: 'B40',
        dataPath: 'payment4Amount',
        description: '4回金　上棟時',
        type: 'number',
        verified: true,
      },
      {
        address: 'B41',
        dataPath: 'payment4Date',
        description: '4回金　支払予定日',
        type: 'dateSerial',
        verified: true,
      },
    ],
  },
  {
    name: 'その他',
    sheetName: '初期入力',
    cells: [
      {
        address: 'B44',
        dataPath: 'contractNumber',
        description: '契約番号',
        type: 'string',
        verified: true,
        note: '例: 103824',
      },
      {
        address: 'B45',
        dataPath: 'noWorkDays',
        description: '工事をしない日',
        type: 'string',
        verified: true,
      },
      {
        address: 'B46',
        dataPath: 'noWorkHours',
        description: '工事しない時間帯',
        type: 'string',
        verified: true,
      },
      {
        address: 'B47',
        dataPath: 'defectInsuranceCompany',
        description: '瑕疵保険会社',
        type: 'string',
        verified: true,
        note: 'プルダウン選択',
      },
    ],
  },
  {
    name: '太陽光契約',
    sheetName: '初期入力',
    cells: [
      {
        address: 'C49',
        dataPath: 'solarContract.contractYear',
        description: '太陽光契約年',
        type: 'number',
        verified: true,
      },
      {
        address: 'E49',
        dataPath: 'solarContract.contractMonth',
        description: '太陽光契約月',
        type: 'number',
        verified: true,
      },
      {
        address: 'G49',
        dataPath: 'solarContract.contractDay',
        description: '太陽光契約日',
        type: 'number',
        verified: true,
      },
      {
        address: 'B50',
        dataPath: 'solarContract.payment1',
        description: '太陽光1回金　請負時',
        type: 'number',
        verified: true,
      },
    ],
  },
  {
    name: '変更契約（E列）',
    sheetName: '初期入力',
    cells: [
      {
        address: 'C14',
        dataPath: 'changeContract.changeContractYear',
        description: '変更契約年',
        type: 'number',
        verified: true,
      },
      {
        address: 'E14',
        dataPath: 'changeContract.changeContractMonth',
        description: '変更契約月',
        type: 'number',
        verified: true,
      },
      {
        address: 'G14',
        dataPath: 'changeContract.changeContractDay',
        description: '変更契約日',
        type: 'number',
        verified: true,
      },
      {
        address: 'F17',
        dataPath: 'changeContract.floorCount',
        description: '変更後の建物階数',
        type: 'number',
        verified: true,
      },
      {
        address: 'F18',
        dataPath: 'changeContract.buildingCount',
        description: '変更後の棟数',
        type: 'number',
        verified: true,
      },
    ],
  },
]

/**
 * 検証済みマッピングのみ取得
 */
export function getVerifiedContractMappings(): ContractCellMapping[] {
  const mappings: ContractCellMapping[] = []
  for (const section of CONTRACT_SECTIONS) {
    for (const cell of section.cells) {
      if (cell.verified) {
        mappings.push(cell)
      }
    }
  }
  return mappings
}

/**
 * ネストされたオブジェクトから値を取得
 */
export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.')
  let current: unknown = obj

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined
    }
    if (typeof current === 'object' && key in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[key]
    } else {
      return undefined
    }
  }

  return current
}

/**
 * ISO日付文字列をExcelシリアル値に変換
 */
export function dateToExcelSerial(isoDate: string): number {
  if (!isoDate) return 0
  const date = new Date(isoDate)
  // Excel日付シリアル値の基準: 1900年1月1日 = 1
  // JavaScriptの基準: 1970年1月1日
  const excelEpoch = new Date(1899, 11, 30) // 1899/12/30
  const diffDays = Math.floor((date.getTime() - excelEpoch.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays
}

/**
 * booleanを〇/空白に変換
 */
export function booleanToCircle(value: boolean): string {
  return value ? '〇' : ''
}

/**
 * セルマッピングの統計情報を取得
 */
export function getContractMappingStats(): {
  total: number
  verified: number
  unverified: number
  bySection: { name: string; total: number; verified: number }[]
} {
  const bySection: { name: string; total: number; verified: number }[] = []
  let total = 0
  let verified = 0

  for (const section of CONTRACT_SECTIONS) {
    const sectionVerified = section.cells.filter((c) => c.verified).length
    bySection.push({
      name: section.name,
      total: section.cells.length,
      verified: sectionVerified,
    })
    total += section.cells.length
    verified += sectionVerified
  }

  return {
    total,
    verified,
    unverified: total - verified,
    bySection,
  }
}
