// バックアップ・エクスポートユーティリティ

export interface BackupData {
  version: string
  exportedAt: string
  exportedBy: string
  data: {
    customers?: unknown[]
    contracts?: unknown[]
    loans?: unknown[]
    fundPlans?: unknown[]
    masterData?: unknown
    users?: unknown[]
  }
}

// LocalStorageからデータを収集
export function collectBackupData(): BackupData {
  const data: BackupData['data'] = {}

  // 顧客データ
  const customersData = localStorage.getItem('ghouse-customers')
  if (customersData) {
    try {
      const parsed = JSON.parse(customersData)
      data.customers = parsed.state?.customers || []
    } catch (e) {
      console.error('Failed to parse customers data', e)
    }
  }

  // 契約データ
  const contractsData = localStorage.getItem('ghouse-contracts')
  if (contractsData) {
    try {
      const parsed = JSON.parse(contractsData)
      data.contracts = parsed.state?.contracts || []
    } catch (e) {
      console.error('Failed to parse contracts data', e)
    }
  }

  // ローンデータ
  const loansData = localStorage.getItem('ghouse-loans')
  if (loansData) {
    try {
      const parsed = JSON.parse(loansData)
      data.loans = parsed.state?.loans || []
    } catch (e) {
      console.error('Failed to parse loans data', e)
    }
  }

  // マスターデータ
  const masterData = localStorage.getItem('ghouse-master-data')
  if (masterData) {
    try {
      const parsed = JSON.parse(masterData)
      data.masterData = parsed.state?.masterData || {}
    } catch (e) {
      console.error('Failed to parse master data', e)
    }
  }

  // ユーザーデータ
  const usersData = localStorage.getItem('ghouse-users')
  if (usersData) {
    try {
      const parsed = JSON.parse(usersData)
      data.users = parsed.state?.users || []
    } catch (e) {
      console.error('Failed to parse users data', e)
    }
  }

  return {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    exportedBy: 'G-force System',
    data,
  }
}

// バックアップファイルをダウンロード
export function downloadBackup(data: BackupData, filename?: string) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename || `gforce-backup-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// CSVエクスポート
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
) {
  if (data.length === 0) {
    throw new Error('エクスポートするデータがありません')
  }

  const headers = columns
    ? columns.map((c) => c.label)
    : Object.keys(data[0] as Record<string, unknown>)

  const keys = columns
    ? columns.map((c) => c.key)
    : (Object.keys(data[0] as Record<string, unknown>) as (keyof T)[])

  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      keys
        .map((key) => {
          const value = row[key]
          if (value === null || value === undefined) return ''
          if (typeof value === 'string') {
            // カンマや改行を含む場合はダブルクォートで囲む
            if (value.includes(',') || value.includes('\n') || value.includes('"')) {
              return `"${value.replace(/"/g, '""')}"`
            }
            return value
          }
          return String(value)
        })
        .join(',')
    ),
  ].join('\n')

  // BOMを追加してExcelで文字化けしないようにする
  const bom = new Uint8Array([0xef, 0xbb, 0xbf])
  const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// バックアップデータを検証
export function validateBackupData(data: unknown): data is BackupData {
  if (!data || typeof data !== 'object') return false

  const backup = data as BackupData
  if (!backup.version || !backup.exportedAt || !backup.data) return false
  if (typeof backup.data !== 'object') return false

  return true
}

// バックアップからデータを復元
export function restoreFromBackup(backup: BackupData): { success: boolean; errors: string[] } {
  const errors: string[] = []

  try {
    // 顧客データ
    if (backup.data.customers) {
      const existing = localStorage.getItem('ghouse-customers')
      const parsed = existing ? JSON.parse(existing) : { state: {} }
      parsed.state.customers = backup.data.customers
      localStorage.setItem('ghouse-customers', JSON.stringify(parsed))
    }

    // 契約データ
    if (backup.data.contracts) {
      const existing = localStorage.getItem('ghouse-contracts')
      const parsed = existing ? JSON.parse(existing) : { state: {} }
      parsed.state.contracts = backup.data.contracts
      localStorage.setItem('ghouse-contracts', JSON.stringify(parsed))
    }

    // ローンデータ
    if (backup.data.loans) {
      const existing = localStorage.getItem('ghouse-loans')
      const parsed = existing ? JSON.parse(existing) : { state: {} }
      parsed.state.loans = backup.data.loans
      localStorage.setItem('ghouse-loans', JSON.stringify(parsed))
    }

    // マスターデータ
    if (backup.data.masterData) {
      const existing = localStorage.getItem('ghouse-master-data')
      const parsed = existing ? JSON.parse(existing) : { state: {} }
      parsed.state.masterData = backup.data.masterData
      localStorage.setItem('ghouse-master-data', JSON.stringify(parsed))
    }

    // ユーザーデータ
    if (backup.data.users) {
      const existing = localStorage.getItem('ghouse-users')
      const parsed = existing ? JSON.parse(existing) : { state: {} }
      parsed.state.users = backup.data.users
      localStorage.setItem('ghouse-users', JSON.stringify(parsed))
    }

    return { success: true, errors }
  } catch (e) {
    errors.push(`復元中にエラーが発生しました: ${e}`)
    return { success: false, errors }
  }
}

// ストレージ使用量を計算
export function calculateStorageUsage(): {
  total: number
  used: number
  breakdown: { key: string; size: number }[]
} {
  const breakdown: { key: string; size: number }[] = []
  let used = 0

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('ghouse-')) {
      const value = localStorage.getItem(key) || ''
      const size = new Blob([value]).size
      breakdown.push({ key, size })
      used += size
    }
  }

  // LocalStorageの一般的な上限は5MB
  const total = 5 * 1024 * 1024

  return {
    total,
    used,
    breakdown: breakdown.sort((a, b) => b.size - a.size),
  }
}

// ストレージをクリア
export function clearAllData(): void {
  const keys = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('ghouse-')) {
      keys.push(key)
    }
  }
  keys.forEach((key) => localStorage.removeItem(key))
}
