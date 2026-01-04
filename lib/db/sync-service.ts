/**
 * Sync Service
 * LocalStorage (Zustand) とSupabaseデータベースの同期を管理
 */

import { customerDb, planRequestDb, contractDb, fundPlanDb, handoverDb, fileDb } from './index'
import {
  useCustomerStore,
  usePlanRequestStore,
  useContractStore,
  useFundPlanStore,
  useHandoverStore,
} from '@/store'
import type { Customer, PlanRequest } from '@/types/database'
import type { StoredContract, StoredFundPlan, StoredHandover } from '@/store'

// 同期状態
export interface SyncState {
  lastSyncAt: string | null
  isSyncing: boolean
  syncError: string | null
  pendingChanges: number
}

// 変更追跡用のキー
const SYNC_STATE_KEY = 'ghouse-sync-state'
const PENDING_CHANGES_KEY = 'ghouse-pending-changes'

interface PendingChange {
  id: string
  entity: 'customer' | 'planRequest' | 'contract' | 'fundPlan' | 'handover' | 'file'
  action: 'create' | 'update' | 'delete'
  data: unknown
  timestamp: string
}

// ============================================
// SYNC STATE MANAGEMENT
// ============================================
export function getSyncState(): SyncState {
  if (typeof window === 'undefined') {
    return { lastSyncAt: null, isSyncing: false, syncError: null, pendingChanges: 0 }
  }

  const stored = localStorage.getItem(SYNC_STATE_KEY)
  if (stored) {
    return JSON.parse(stored)
  }
  return { lastSyncAt: null, isSyncing: false, syncError: null, pendingChanges: 0 }
}

export function setSyncState(state: Partial<SyncState>): void {
  if (typeof window === 'undefined') return

  const current = getSyncState()
  const updated = { ...current, ...state }
  localStorage.setItem(SYNC_STATE_KEY, JSON.stringify(updated))
}

// ============================================
// PENDING CHANGES (OFFLINE SUPPORT)
// ============================================
export function getPendingChanges(): PendingChange[] {
  if (typeof window === 'undefined') return []

  const stored = localStorage.getItem(PENDING_CHANGES_KEY)
  if (stored) {
    return JSON.parse(stored)
  }
  return []
}

export function addPendingChange(change: Omit<PendingChange, 'id' | 'timestamp'>): void {
  if (typeof window === 'undefined') return

  const changes = getPendingChanges()
  const newChange: PendingChange = {
    ...change,
    id: `change-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString()
  }
  changes.push(newChange)
  localStorage.setItem(PENDING_CHANGES_KEY, JSON.stringify(changes))
  setSyncState({ pendingChanges: changes.length })
}

export function clearPendingChanges(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(PENDING_CHANGES_KEY)
  setSyncState({ pendingChanges: 0 })
}

// ============================================
// SYNC OPERATIONS
// ============================================

/**
 * データベースからストアへの初期同期
 */
export async function syncFromDatabase(): Promise<void> {
  setSyncState({ isSyncing: true, syncError: null })

  try {
    // 並列でデータを取得
    const [customers, planRequests, contracts, fundPlans, handovers, files] = await Promise.all([
      customerDb.getAll().catch(() => [] as Customer[]),
      planRequestDb.getAll().catch(() => [] as PlanRequest[]),
      contractDb.getAll().catch(() => []),
      fundPlanDb.getAll().catch(() => []),
      handoverDb.getAll().catch(() => []),
      fileDb.getAll().catch(() => []),
    ])

    // ストアを更新
    const customerStore = useCustomerStore.getState()
    const planRequestStore = usePlanRequestStore.getState()
    const contractStore = useContractStore.getState()
    const fundPlanStore = useFundPlanStore.getState()
    const handoverStore = useHandoverStore.getState()

    if (customers.length > 0) {
      customerStore.setCustomers(customers)
    }

    if (planRequests.length > 0) {
      planRequestStore.setPlanRequests(planRequests)
    }

    if (contracts.length > 0) {
      contractStore.setContracts(contracts as StoredContract[])
    }

    if (fundPlans.length > 0) {
      fundPlanStore.fundPlans = fundPlans as StoredFundPlan[]
    }

    if (handovers.length > 0) {
      handoverStore.setHandovers(handovers as StoredHandover[])
    }

    // ファイルはdataUrlが大きいためDBからの全量取得は行わない
    // （メタデータのみ同期、実データはオンデマンド取得）
    if (files.length > 0) {
      // ファイルストアには直接setFilesがないため、個別に追加処理が必要
      // 現時点ではスキップ（ファイルはローカル優先）
      console.log(`[Sync] ${files.length} files found in database (local-first mode)`)
    }

    setSyncState({
      isSyncing: false,
      lastSyncAt: new Date().toISOString(),
      syncError: null
    })

    console.log('Sync from database completed:', {
      customers: customers.length,
      planRequests: planRequests.length,
      contracts: contracts.length,
      fundPlans: fundPlans.length,
      handovers: handovers.length,
      files: files.length,
    })
  } catch (error) {
    console.error('Sync from database failed:', error)
    setSyncState({
      isSyncing: false,
      syncError: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

/**
 * ストアからデータベースへの同期
 */
export async function syncToDatabase(): Promise<void> {
  setSyncState({ isSyncing: true, syncError: null })

  try {
    const customerStore = useCustomerStore.getState()
    const planRequestStore = usePlanRequestStore.getState()

    // ローカルデータを取得
    const localCustomers = customerStore.customers
    const localPlanRequests = planRequestStore.planRequests

    // データベースのデータを取得
    const [dbCustomers, dbPlanRequests] = await Promise.all([
      customerDb.getAll().catch(() => [] as Customer[]),
      planRequestDb.getAll().catch(() => [] as PlanRequest[]),
    ])

    // 差分を計算してアップロード
    const customerChanges = await syncCustomers(localCustomers, dbCustomers)
    const planRequestChanges = await syncPlanRequests(localPlanRequests, dbPlanRequests)

    setSyncState({
      isSyncing: false,
      lastSyncAt: new Date().toISOString(),
      syncError: null
    })

    console.log('Sync to database completed:', {
      customers: customerChanges,
      planRequests: planRequestChanges
    })
  } catch (error) {
    console.error('Sync to database failed:', error)
    setSyncState({
      isSyncing: false,
      syncError: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function syncCustomers(
  local: Customer[],
  remote: Customer[]
): Promise<{ created: number; updated: number }> {
  let created = 0
  let updated = 0

  const remoteMap = new Map(remote.map(c => [c.id, c]))

  for (const customer of local) {
    try {
      if (!remoteMap.has(customer.id)) {
        // 新規作成
        await customerDb.create(customer)
        created++
      } else {
        // 更新チェック
        const remoteCustomer = remoteMap.get(customer.id)!
        if (new Date(customer.updated_at) > new Date(remoteCustomer.updated_at)) {
          await customerDb.update(customer.id, customer)
          updated++
        }
      }
    } catch (error) {
      console.error('Failed to sync customer:', customer.id, error)
    }
  }

  return { created, updated }
}

async function syncPlanRequests(
  local: PlanRequest[],
  remote: PlanRequest[]
): Promise<{ created: number; updated: number }> {
  let created = 0
  let updated = 0

  const remoteMap = new Map(remote.map(r => [r.id, r]))

  for (const request of local) {
    try {
      if (!remoteMap.has(request.id)) {
        await planRequestDb.create(request)
        created++
      } else {
        const remoteRequest = remoteMap.get(request.id)!
        if (new Date(request.updated_at) > new Date(remoteRequest.updated_at)) {
          await planRequestDb.update(request.id, request)
          updated++
        }
      }
    } catch (error) {
      console.error('Failed to sync plan request:', request.id, error)
    }
  }

  return { created, updated }
}

/**
 * 双方向同期（マージ）
 */
export async function syncBidirectional(): Promise<void> {
  setSyncState({ isSyncing: true, syncError: null })

  try {
    // まずリモートから取得
    await syncFromDatabase()

    // 保留中の変更があれば適用
    const pendingChanges = getPendingChanges()
    if (pendingChanges.length > 0) {
      for (const change of pendingChanges) {
        await applyPendingChange(change)
      }
      clearPendingChanges()
    }

    // ローカルの変更をプッシュ
    await syncToDatabase()

    setSyncState({
      isSyncing: false,
      lastSyncAt: new Date().toISOString(),
      syncError: null
    })
  } catch (error) {
    console.error('Bidirectional sync failed:', error)
    setSyncState({
      isSyncing: false,
      syncError: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function applyPendingChange(change: PendingChange): Promise<void> {
  try {
    switch (change.entity) {
      case 'customer':
        if (change.action === 'create') {
          await customerDb.create(change.data as Customer)
        } else if (change.action === 'update') {
          const { id, ...updates } = change.data as Customer
          await customerDb.update(id, updates)
        } else if (change.action === 'delete') {
          await customerDb.delete((change.data as { id: string }).id)
        }
        break
      case 'planRequest':
        if (change.action === 'create') {
          await planRequestDb.create(change.data as PlanRequest)
        } else if (change.action === 'update') {
          const { id, ...updates } = change.data as PlanRequest
          await planRequestDb.update(id, updates)
        } else if (change.action === 'delete') {
          await planRequestDb.delete((change.data as { id: string }).id)
        }
        break
      // 他のエンティティも同様...
    }
  } catch (error) {
    console.error('Failed to apply pending change:', change, error)
    throw error
  }
}

// ============================================
// AUTO SYNC HOOKS
// ============================================

/**
 * 自動同期を開始
 * @param intervalMs 同期間隔（ミリ秒）
 */
export function startAutoSync(intervalMs = 30000): () => void {
  const intervalId = setInterval(() => {
    const state = getSyncState()
    if (!state.isSyncing) {
      syncBidirectional().catch(console.error)
    }
  }, intervalMs)

  // クリーンアップ関数を返す
  return () => clearInterval(intervalId)
}

/**
 * 初回ロード時の同期
 */
export async function initialSync(): Promise<void> {
  const state = getSyncState()

  // 最後の同期から1時間以上経過していたら再同期
  if (state.lastSyncAt) {
    const lastSync = new Date(state.lastSyncAt)
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000)
    if (lastSync < hourAgo) {
      await syncFromDatabase()
    }
  } else {
    // 初回同期
    await syncFromDatabase()
  }
}

// ============================================
// STORE SUBSCRIPTION FOR REAL-TIME SYNC
// ============================================

/**
 * ストアの変更を監視してデータベースに同期
 */
export function subscribeToStoreChanges(): () => void {
  const unsubscribers: (() => void)[] = []

  // Customer store subscription
  const unsubCustomer = useCustomerStore.subscribe(
    (state, prevState) => {
      if (state.customers !== prevState.customers) {
        // 変更を検出してDBに同期
        debouncedSync()
      }
    }
  )
  unsubscribers.push(unsubCustomer)

  // Plan request store subscription
  const unsubPlanRequest = usePlanRequestStore.subscribe(
    (state, prevState) => {
      if (state.planRequests !== prevState.planRequests) {
        debouncedSync()
      }
    }
  )
  unsubscribers.push(unsubPlanRequest)

  // Contract store subscription
  const unsubContract = useContractStore.subscribe(
    (state, prevState) => {
      if (state.contracts !== prevState.contracts) {
        debouncedSync()
      }
    }
  )
  unsubscribers.push(unsubContract)

  // Fund plan store subscription
  const unsubFundPlan = useFundPlanStore.subscribe(
    (state, prevState) => {
      if (state.fundPlans !== prevState.fundPlans) {
        debouncedSync()
      }
    }
  )
  unsubscribers.push(unsubFundPlan)

  // Handover store subscription
  const unsubHandover = useHandoverStore.subscribe(
    (state, prevState) => {
      if (state.handovers !== prevState.handovers) {
        debouncedSync()
      }
    }
  )
  unsubscribers.push(unsubHandover)

  return () => {
    unsubscribers.forEach(unsub => unsub())
  }
}

// デバウンス付き同期
let syncTimeout: NodeJS.Timeout | null = null
function debouncedSync(): void {
  if (syncTimeout) {
    clearTimeout(syncTimeout)
  }
  syncTimeout = setTimeout(() => {
    syncToDatabase().catch(console.error)
  }, 2000) // 2秒後に同期
}
