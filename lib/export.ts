/**
 * CSVエクスポートユーティリティ
 */

// BOM付きUTF-8でエクスポート（Excelで開くため）
const BOM = '\uFEFF'

interface ExportColumn<T> {
  key: keyof T | string
  header: string
  formatter?: (value: unknown, row: T) => string
}

/**
 * データをCSVに変換
 */
export function toCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[]
): string {
  // ヘッダー行
  const headers = columns.map(col => `"${col.header}"`).join(',')

  // データ行
  const rows = data.map(row => {
    return columns.map(col => {
      const value = getNestedValue(row, col.key as string)
      const formatted = col.formatter ? col.formatter(value, row) : formatValue(value)
      return `"${formatted.replace(/"/g, '""')}"`
    }).join(',')
  })

  return BOM + [headers, ...rows].join('\r\n')
}

/**
 * ネストされたオブジェクトの値を取得
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current: unknown, key: string) => {
    if (current === null || current === undefined) return ''
    return (current as Record<string, unknown>)[key]
  }, obj)
}

/**
 * 値をフォーマット
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value.toLocaleDateString('ja-JP')
  if (typeof value === 'boolean') return value ? 'はい' : 'いいえ'
  if (typeof value === 'number') return value.toLocaleString()
  return String(value)
}

/**
 * CSVファイルをダウンロード
 */
export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * データをCSVとしてダウンロード
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string
): void {
  const csv = toCSV(data, columns)
  downloadCSV(csv, filename)
}

// 顧客エクスポート用カラム定義
export const customerExportColumns = [
  { key: 'tei_name', header: '邸名' },
  { key: 'name', header: '顧客名' },
  { key: 'name_kana', header: 'フリガナ' },
  { key: 'partner_name', header: '配偶者名' },
  { key: 'ownership_type', header: '名義区分' },
  { key: 'phone', header: '電話番号' },
  { key: 'email', header: 'メール' },
  { key: 'postal_code', header: '郵便番号' },
  { key: 'address', header: '住所' },
  { key: 'pipeline_status', header: 'ステータス' },
  { key: 'lead_source', header: '反響経路' },
  { key: 'lead_date', header: '反響日', formatter: (v: unknown) => v ? new Date(v as string).toLocaleDateString('ja-JP') : '' },
  { key: 'meeting_date', header: '面談日', formatter: (v: unknown) => v ? new Date(v as string).toLocaleDateString('ja-JP') : '' },
  { key: 'contract_date', header: '契約日', formatter: (v: unknown) => v ? new Date(v as string).toLocaleDateString('ja-JP') : '' },
  { key: 'land_area', header: '土地面積(坪)', formatter: (v: unknown) => v ? `${v}` : '' },
  { key: 'building_area', header: '建物面積(坪)', formatter: (v: unknown) => v ? `${v}` : '' },
  { key: 'estimated_amount', header: '見込金額', formatter: (v: unknown) => v ? `¥${(v as number).toLocaleString()}` : '' },
  { key: 'contract_amount', header: '契約金額', formatter: (v: unknown) => v ? `¥${(v as number).toLocaleString()}` : '' },
  { key: 'notes', header: 'メモ' },
  { key: 'created_at', header: '登録日', formatter: (v: unknown) => v ? new Date(v as string).toLocaleDateString('ja-JP') : '' },
]

// プラン依頼エクスポート用カラム定義
export const planRequestExportColumns = [
  { key: 'id', header: '依頼ID' },
  { key: 'customer_name', header: '顧客名' },
  { key: 'tei_name', header: '邸名' },
  { key: 'status', header: 'ステータス' },
  { key: 'land_address', header: '土地住所' },
  { key: 'land_area', header: '土地面積(坪)' },
  { key: 'budget_min', header: '予算下限', formatter: (v: unknown) => v ? `¥${(v as number).toLocaleString()}` : '' },
  { key: 'budget_max', header: '予算上限', formatter: (v: unknown) => v ? `¥${(v as number).toLocaleString()}` : '' },
  { key: 'preferred_rooms', header: '希望間取り' },
  { key: 'deadline', header: '希望納期', formatter: (v: unknown) => v ? new Date(v as string).toLocaleDateString('ja-JP') : '' },
  { key: 'designer_name', header: '担当設計' },
  { key: 'created_at', header: '依頼日', formatter: (v: unknown) => v ? new Date(v as string).toLocaleDateString('ja-JP') : '' },
]

// 契約書エクスポート用カラム定義
export const contractExportColumns = [
  { key: 'contract_number', header: '契約番号' },
  { key: 'customer_name', header: '顧客名' },
  { key: 'tei_name', header: '邸名' },
  { key: 'status', header: 'ステータス' },
  { key: 'contract_date', header: '契約日', formatter: (v: unknown) => v ? new Date(v as string).toLocaleDateString('ja-JP') : '' },
  { key: 'contract_amount', header: '契約金額', formatter: (v: unknown) => v ? `¥${(v as number).toLocaleString()}` : '' },
  { key: 'building_area', header: '建物面積(坪)' },
  { key: 'start_date', header: '着工予定', formatter: (v: unknown) => v ? new Date(v as string).toLocaleDateString('ja-JP') : '' },
  { key: 'completion_date', header: '完工予定', formatter: (v: unknown) => v ? new Date(v as string).toLocaleDateString('ja-JP') : '' },
  { key: 'created_at', header: '作成日', formatter: (v: unknown) => v ? new Date(v as string).toLocaleDateString('ja-JP') : '' },
]
