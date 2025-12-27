/**
 * kintone連携ストア
 * 初回受付台帳・ヒアリングシートのデータ管理と顧客紐づけ
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  KintoneConfig,
  ReceptionRecord,
  HearingSheetRecord,
  MatchCandidate,
} from '@/lib/kintone/kintone-client'

// 紐づけステータス
export type LinkStatus = 'pending' | 'linked' | 'manual_review' | 'rejected'

// 紐づけ済みレコード
export interface LinkedRecord {
  kintoneRecordId: string
  kintoneRecordType: 'reception' | 'hearing_sheet'
  customerId: string | null
  status: LinkStatus
  matchScore: number
  matchReasons: string[]
  linkedAt: string | null
  linkedBy: string | null
  aiSuggestions: MatchCandidate[]
}

// 限定会員BOX（未割り振り）のアイテム
export interface LimitedMemberBoxItem {
  id: string
  receptionRecord: ReceptionRecord
  hearingSheetRecord: HearingSheetRecord | null
  status: 'new' | 'assigned' | 'converted'
  assignedTo: string | null
  assignedAt: string | null
  assignedBy: string | null
  customerId: string | null // 変換後の顧客ID
  createdAt: string
}

interface KintoneState {
  // 設定
  config: KintoneConfig | null
  isConfigured: boolean

  // 同期状態
  lastSyncAt: string | null
  isSyncing: boolean
  syncError: string | null

  // 受付台帳データ
  receptionRecords: ReceptionRecord[]

  // ヒアリングシートデータ
  hearingSheetRecords: HearingSheetRecord[]

  // 紐づけ情報
  linkedRecords: LinkedRecord[]

  // 限定会員BOX
  limitedMemberBox: LimitedMemberBoxItem[]

  // アクション
  setConfig: (config: KintoneConfig) => void
  clearConfig: () => void

  // 同期
  setSyncing: (syncing: boolean) => void
  setSyncError: (error: string | null) => void
  setLastSyncAt: (date: string) => void

  // 受付台帳
  setReceptionRecords: (records: ReceptionRecord[]) => void
  addReceptionRecords: (records: ReceptionRecord[]) => void

  // ヒアリングシート
  setHearingSheetRecords: (records: HearingSheetRecord[]) => void
  addHearingSheetRecords: (records: HearingSheetRecord[]) => void

  // 紐づけ
  setLinkedRecord: (record: LinkedRecord) => void
  updateLinkStatus: (kintoneRecordId: string, status: LinkStatus, customerId?: string, linkedBy?: string) => void
  getLinkedRecord: (kintoneRecordId: string) => LinkedRecord | undefined

  // 限定会員BOX
  addToLimitedMemberBox: (item: Omit<LimitedMemberBoxItem, 'id' | 'createdAt'>) => string
  assignLimitedMember: (id: string, assignedTo: string, assignedBy: string) => void
  convertToCustomer: (id: string, customerId: string) => void
  removeLimitedMember: (id: string) => void
  getUnassignedLimitedMembers: () => LimitedMemberBoxItem[]
  getAssignedLimitedMembers: (assignedTo?: string) => LimitedMemberBoxItem[]
}

export const useKintoneStore = create<KintoneState>()(
  persist(
    (set, get) => ({
      // 初期状態
      config: null,
      isConfigured: false,
      lastSyncAt: null,
      isSyncing: false,
      syncError: null,
      receptionRecords: [],
      hearingSheetRecords: [],
      linkedRecords: [],
      limitedMemberBox: [],

      // 設定
      setConfig: (config) => set({ config, isConfigured: true }),
      clearConfig: () => set({
        config: null,
        isConfigured: false,
        receptionRecords: [],
        hearingSheetRecords: [],
        linkedRecords: [],
      }),

      // 同期
      setSyncing: (syncing) => set({ isSyncing: syncing }),
      setSyncError: (error) => set({ syncError: error }),
      setLastSyncAt: (date) => set({ lastSyncAt: date }),

      // 受付台帳
      setReceptionRecords: (records) => set({ receptionRecords: records }),
      addReceptionRecords: (records) => set((state) => ({
        receptionRecords: [
          ...records.filter(r => !state.receptionRecords.some(er => er.id === r.id)),
          ...state.receptionRecords,
        ],
      })),

      // ヒアリングシート
      setHearingSheetRecords: (records) => set({ hearingSheetRecords: records }),
      addHearingSheetRecords: (records) => set((state) => ({
        hearingSheetRecords: [
          ...records.filter(r => !state.hearingSheetRecords.some(er => er.id === r.id)),
          ...state.hearingSheetRecords,
        ],
      })),

      // 紐づけ
      setLinkedRecord: (record) => set((state) => {
        const existing = state.linkedRecords.findIndex(r => r.kintoneRecordId === record.kintoneRecordId)
        if (existing >= 0) {
          const updated = [...state.linkedRecords]
          updated[existing] = record
          return { linkedRecords: updated }
        }
        return { linkedRecords: [...state.linkedRecords, record] }
      }),

      updateLinkStatus: (kintoneRecordId, status, customerId, linkedBy) => set((state) => ({
        linkedRecords: state.linkedRecords.map((r) =>
          r.kintoneRecordId === kintoneRecordId
            ? {
                ...r,
                status,
                customerId: customerId ?? r.customerId,
                linkedAt: status === 'linked' ? new Date().toISOString() : r.linkedAt,
                linkedBy: linkedBy ?? r.linkedBy,
              }
            : r
        ),
      })),

      getLinkedRecord: (kintoneRecordId) => {
        return get().linkedRecords.find(r => r.kintoneRecordId === kintoneRecordId)
      },

      // 限定会員BOX
      addToLimitedMemberBox: (item) => {
        const id = `lmb-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        const newItem: LimitedMemberBoxItem = {
          ...item,
          id,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          limitedMemberBox: [newItem, ...state.limitedMemberBox],
        }))
        return id
      },

      assignLimitedMember: (id, assignedTo, assignedBy) => set((state) => ({
        limitedMemberBox: state.limitedMemberBox.map((item) =>
          item.id === id
            ? {
                ...item,
                status: 'assigned' as const,
                assignedTo,
                assignedAt: new Date().toISOString(),
                assignedBy,
              }
            : item
        ),
      })),

      convertToCustomer: (id, customerId) => set((state) => ({
        limitedMemberBox: state.limitedMemberBox.map((item) =>
          item.id === id
            ? {
                ...item,
                status: 'converted' as const,
                customerId,
              }
            : item
        ),
      })),

      removeLimitedMember: (id) => set((state) => ({
        limitedMemberBox: state.limitedMemberBox.filter((item) => item.id !== id),
      })),

      getUnassignedLimitedMembers: () => {
        return get().limitedMemberBox.filter(item => item.status === 'new')
      },

      getAssignedLimitedMembers: (assignedTo) => {
        const items = get().limitedMemberBox.filter(item => item.status === 'assigned')
        if (assignedTo) {
          return items.filter(item => item.assignedTo === assignedTo)
        }
        return items
      },
    }),
    {
      name: 'ghouse-kintone',
    }
  )
)

/**
 * kintoneからデータを同期するサービス関数
 */
export async function syncKintoneData(
  client: import('@/lib/kintone/kintone-client').KintoneClient,
  store: KintoneState,
  customers: Array<{ id: string; name: string; phone: string | null; email: string | null }>
): Promise<{ success: boolean; error?: string }> {
  try {
    store.setSyncing(true)
    store.setSyncError(null)

    // 前回の同期日時を取得
    const lastSync = store.lastSyncAt

    // 初回受付台帳を取得
    const receptionRecords = await client.getReceptionRecords({
      limit: 100,
      since: lastSync || undefined,
    })
    store.addReceptionRecords(receptionRecords)

    // ヒアリングシートを取得
    const hearingRecords = await client.getHearingSheetRecords({
      limit: 100,
      since: lastSync || undefined,
    })
    store.addHearingSheetRecords(hearingRecords)

    // 新規レコードの紐づけ候補を生成
    const { findMatchingCustomers } = await import('@/lib/kintone/kintone-client')

    for (const record of receptionRecords) {
      const existing = store.getLinkedRecord(record.id)
      if (!existing) {
        const candidates = findMatchingCustomers(record, customers)
        const linkedRecord: LinkedRecord = {
          kintoneRecordId: record.id,
          kintoneRecordType: 'reception',
          customerId: candidates.length > 0 && candidates[0].matchScore >= 80 ? candidates[0].customerId : null,
          status: candidates.length > 0 && candidates[0].matchScore >= 80 ? 'linked' : 'pending',
          matchScore: candidates.length > 0 ? candidates[0].matchScore : 0,
          matchReasons: candidates.length > 0 ? candidates[0].matchReasons : [],
          linkedAt: candidates.length > 0 && candidates[0].matchScore >= 80 ? new Date().toISOString() : null,
          linkedBy: candidates.length > 0 && candidates[0].matchScore >= 80 ? 'AI自動紐づけ' : null,
          aiSuggestions: candidates.slice(0, 5), // 上位5件を保持
        }
        store.setLinkedRecord(linkedRecord)

        // スコアが低い場合は限定会員BOXに追加
        if (linkedRecord.status === 'pending') {
          store.addToLimitedMemberBox({
            receptionRecord: record,
            hearingSheetRecord: null,
            status: 'new',
            assignedTo: null,
            assignedAt: null,
            assignedBy: null,
            customerId: null,
          })
        }
      }
    }

    for (const record of hearingRecords) {
      const existing = store.getLinkedRecord(record.id)
      if (!existing) {
        const candidates = findMatchingCustomers(record, customers)
        const linkedRecord: LinkedRecord = {
          kintoneRecordId: record.id,
          kintoneRecordType: 'hearing_sheet',
          customerId: candidates.length > 0 && candidates[0].matchScore >= 80 ? candidates[0].customerId : null,
          status: candidates.length > 0 && candidates[0].matchScore >= 80 ? 'linked' : 'pending',
          matchScore: candidates.length > 0 ? candidates[0].matchScore : 0,
          matchReasons: candidates.length > 0 ? candidates[0].matchReasons : [],
          linkedAt: candidates.length > 0 && candidates[0].matchScore >= 80 ? new Date().toISOString() : null,
          linkedBy: candidates.length > 0 && candidates[0].matchScore >= 80 ? 'AI自動紐づけ' : null,
          aiSuggestions: candidates.slice(0, 5),
        }
        store.setLinkedRecord(linkedRecord)
      }
    }

    store.setLastSyncAt(new Date().toISOString())
    store.setSyncing(false)

    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    store.setSyncError(errorMessage)
    store.setSyncing(false)
    return { success: false, error: errorMessage }
  }
}
