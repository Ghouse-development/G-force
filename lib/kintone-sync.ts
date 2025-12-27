/**
 * Kintone 双方向同期サービス
 * G-force と Kintone 間のデータ同期を管理
 */

import { getKintoneConfig, type KintoneRecord } from './kintone'
import { customerDb } from './db'
import type { Customer } from '@/types/database'

// 同期ログをローカルに保存
const SYNC_LOG_KEY = 'ghouse-kintone-sync-log'

interface SyncLogEntry {
  id: string
  entityType: 'customer' | 'planRequest' | 'contract'
  entityId: string
  kintoneRecordId: string | null
  direction: 'to_kintone' | 'from_kintone'
  status: 'success' | 'failed'
  error?: string
  syncedAt: string
}

// ============================================
// FIELD MAPPINGS
// ============================================

// 顧客フィールドマッピング（G-force → Kintone）
const CUSTOMER_FIELD_MAP: Record<string, string> = {
  name: '顧客名',
  name_kana: 'フリガナ',
  phone: '電話番号',
  email: 'メールアドレス',
  address: '住所',
  pipeline_status: 'ステータス',
  lead_source: '反響経路',
  lead_date: '反響日',
  assigned_to: '担当者',
  notes: '備考'
}

// Kintone → G-force の逆マッピング
const KINTONE_TO_CUSTOMER_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(CUSTOMER_FIELD_MAP).map(([k, v]) => [v, k])
)

// ============================================
// SYNC FUNCTIONS
// ============================================

/**
 * 顧客データをKintoneに同期
 */
export async function syncCustomerToKintone(customer: Customer): Promise<string | null> {
  const config = getKintoneConfig()
  if (!config) {
    console.warn('Kintone configuration not found')
    return null
  }

  try {
    const kintoneFields: Record<string, { value: unknown }> = {}

    // フィールドマッピングを適用
    for (const [gforceField, kintoneField] of Object.entries(CUSTOMER_FIELD_MAP)) {
      const value = customer[gforceField as keyof Customer]
      if (value !== undefined && value !== null) {
        kintoneFields[kintoneField] = { value: String(value) }
      }
    }

    // Kintone API呼び出し
    const endpoint = customer.kintone_record_id
      ? `https://${config.domain}/k/v1/record.json` // 更新
      : `https://${config.domain}/k/v1/record.json` // 新規作成

    const method = customer.kintone_record_id ? 'PUT' : 'POST'
    const body = customer.kintone_record_id
      ? {
          app: config.appId,
          id: customer.kintone_record_id,
          record: kintoneFields
        }
      : {
          app: config.appId,
          record: kintoneFields
        }

    const response = await fetch(endpoint, {
      method,
      headers: {
        'X-Cybozu-API-Token': config.apiToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Kintone API error: ${error}`)
    }

    const result = await response.json()
    const kintoneRecordId = result.id || customer.kintone_record_id

    // G-forceのレコードを更新
    if (kintoneRecordId && !customer.kintone_record_id) {
      await customerDb.update(customer.id, { kintone_record_id: kintoneRecordId })
    }

    logSync({
      entityType: 'customer',
      entityId: customer.id,
      kintoneRecordId,
      direction: 'to_kintone',
      status: 'success'
    })

    return kintoneRecordId
  } catch (error) {
    console.error('Failed to sync customer to Kintone:', error)

    logSync({
      entityType: 'customer',
      entityId: customer.id,
      kintoneRecordId: null,
      direction: 'to_kintone',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    return null
  }
}

/**
 * Kintoneから顧客データを取得
 */
export async function syncCustomerFromKintone(kintoneRecordId: string): Promise<Customer | null> {
  const config = getKintoneConfig()
  if (!config) return null

  try {
    const response = await fetch(
      `https://${config.domain}/k/v1/record.json?app=${config.appId}&id=${kintoneRecordId}`,
      {
        headers: {
          'X-Cybozu-API-Token': config.apiToken
        }
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch from Kintone')
    }

    const data = await response.json()
    const record = data.record as KintoneRecord

    // Kintoneのフィールドを G-force形式に変換
    const customerData: Partial<Customer> = {
      kintone_record_id: kintoneRecordId
    }

    for (const [kintoneField, gforceField] of Object.entries(KINTONE_TO_CUSTOMER_MAP)) {
      if (record[kintoneField]) {
        (customerData as Record<string, unknown>)[gforceField] = record[kintoneField].value
      }
    }

    // 既存の顧客を検索して更新、なければ新規作成
    const existingCustomers = await customerDb.getAll()
    const existing = existingCustomers.find(c => c.kintone_record_id === kintoneRecordId)

    if (existing) {
      const updated = await customerDb.update(existing.id, customerData)
      logSync({
        entityType: 'customer',
        entityId: existing.id,
        kintoneRecordId,
        direction: 'from_kintone',
        status: 'success'
      })
      return updated
    } else {
      // 新規作成には name が必須
      if (!customerData.name) {
        customerData.name = '名前未設定'
      }
      const created = await customerDb.create(customerData as Customer)
      logSync({
        entityType: 'customer',
        entityId: created.id,
        kintoneRecordId,
        direction: 'from_kintone',
        status: 'success'
      })
      return created
    }
  } catch (error) {
    console.error('Failed to sync from Kintone:', error)
    return null
  }
}

/**
 * 全顧客をKintoneに一括同期
 */
export async function syncAllCustomersToKintone(): Promise<{
  success: number
  failed: number
}> {
  const customers = await customerDb.getAll()
  let success = 0
  let failed = 0

  for (const customer of customers) {
    const result = await syncCustomerToKintone(customer)
    if (result) {
      success++
    } else {
      failed++
    }

    // レート制限対策
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return { success, failed }
}

/**
 * Kintoneから全レコードを取得して同期
 */
export async function syncAllFromKintone(): Promise<{
  success: number
  failed: number
}> {
  const config = getKintoneConfig()
  if (!config) return { success: 0, failed: 0 }

  let success = 0
  let failed = 0

  try {
    // Kintoneから全レコードを取得
    const response = await fetch(
      `https://${config.domain}/k/v1/records.json?app=${config.appId}`,
      {
        headers: {
          'X-Cybozu-API-Token': config.apiToken
        }
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch records from Kintone')
    }

    const data = await response.json()
    const records = data.records as Array<KintoneRecord & { $id: { value: string } }>

    for (const record of records) {
      const result = await syncCustomerFromKintone(record.$id.value)
      if (result) {
        success++
      } else {
        failed++
      }
    }
  } catch (error) {
    console.error('Failed to sync all from Kintone:', error)
  }

  return { success, failed }
}

// ============================================
// SYNC LOG
// ============================================

function logSync(entry: Omit<SyncLogEntry, 'id' | 'syncedAt'>): void {
  if (typeof window === 'undefined') return

  const logs = getSyncLogs()
  logs.unshift({
    ...entry,
    id: `log-${Date.now()}`,
    syncedAt: new Date().toISOString()
  })

  // 最新100件のみ保持
  localStorage.setItem(SYNC_LOG_KEY, JSON.stringify(logs.slice(0, 100)))
}

export function getSyncLogs(): SyncLogEntry[] {
  if (typeof window === 'undefined') return []

  const stored = localStorage.getItem(SYNC_LOG_KEY)
  if (stored) {
    return JSON.parse(stored)
  }
  return []
}

export function clearSyncLogs(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(SYNC_LOG_KEY)
}

// ============================================
// CONNECTION CHECK
// ============================================

export async function checkKintoneConnection(): Promise<{
  connected: boolean
  appName?: string
  error?: string
}> {
  const config = getKintoneConfig()
  if (!config) {
    return { connected: false, error: 'Kintone configuration not found' }
  }

  try {
    const response = await fetch(
      `https://${config.domain}/k/v1/app.json?id=${config.appId}`,
      {
        headers: {
          'X-Cybozu-API-Token': config.apiToken
        }
      }
    )

    if (!response.ok) {
      throw new Error('Connection failed')
    }

    const data = await response.json()
    return { connected: true, appName: data.name }
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
