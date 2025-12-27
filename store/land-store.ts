/**
 * 土地探し条件ストア
 * 条件管理・物件管理・マッチング結果管理
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  LandSearchConditions,
  LandProperty,
  LandMatchResult,
} from '@/lib/land/land-conditions'
import {
  calculateLandMatch,
  createDefaultLandConditions,
  mergeConditions,
} from '@/lib/land/land-conditions'

// アラート
export interface LandAlert {
  id: string
  matchResult: LandMatchResult
  property: LandProperty
  conditions: LandSearchConditions
  customerName: string
  createdAt: string
  status: 'new' | 'notified' | 'contacted' | 'dismissed'
  notifiedAt: string | null
  contactedAt: string | null
  contactedBy: string | null
  notes: string
}

interface LandState {
  // 条件
  conditions: LandSearchConditions[]
  // 物件
  properties: LandProperty[]
  // マッチング結果
  matchResults: LandMatchResult[]
  // アラート
  alerts: LandAlert[]
  // 最終更新
  lastMatchedAt: string | null

  // 条件アクション
  getConditionsByCustomer: (customerId: string) => LandSearchConditions | undefined
  setConditions: (conditions: LandSearchConditions) => void
  updateConditions: (customerId: string, updates: Partial<LandSearchConditions>) => void
  createConditionsForCustomer: (customerId: string) => LandSearchConditions
  deleteConditions: (customerId: string) => void

  // 物件アクション
  setProperties: (properties: LandProperty[]) => void
  addProperties: (properties: LandProperty[]) => void
  updateProperty: (id: string, updates: Partial<LandProperty>) => void
  deleteProperty: (id: string) => void
  getPropertyById: (id: string) => LandProperty | undefined

  // マッチングアクション
  runMatching: (customerNames: Map<string, string>) => void
  getMatchesForCustomer: (customerId: string) => LandMatchResult[]
  getMatchesForProperty: (propertyId: string) => LandMatchResult[]

  // アラートアクション
  getAlerts: (status?: LandAlert['status']) => LandAlert[]
  getAlertsForCustomer: (customerId: string) => LandAlert[]
  markAlertNotified: (alertId: string) => void
  markAlertContacted: (alertId: string, contactedBy: string, notes?: string) => void
  dismissAlert: (alertId: string) => void
  clearAlerts: () => void
}

export const useLandStore = create<LandState>()(
  persist(
    (set, get) => ({
      conditions: [],
      properties: [],
      matchResults: [],
      alerts: [],
      lastMatchedAt: null,

      // 条件取得
      getConditionsByCustomer: (customerId) => {
        return get().conditions.find(c => c.customerId === customerId)
      },

      // 条件設定
      setConditions: (conditions) => {
        set((state) => {
          const existing = state.conditions.findIndex(c => c.customerId === conditions.customerId)
          if (existing >= 0) {
            const updated = [...state.conditions]
            updated[existing] = conditions
            return { conditions: updated }
          }
          return { conditions: [...state.conditions, conditions] }
        })
      },

      // 条件更新
      updateConditions: (customerId, updates) => {
        set((state) => {
          const existing = state.conditions.find(c => c.customerId === customerId)
          if (!existing) return state

          const merged = mergeConditions(existing, updates)
          return {
            conditions: state.conditions.map(c =>
              c.customerId === customerId ? merged : c
            ),
          }
        })
      },

      // 新規条件作成
      createConditionsForCustomer: (customerId) => {
        const newConditions = createDefaultLandConditions(customerId)
        set((state) => ({
          conditions: [...state.conditions, newConditions],
        }))
        return newConditions
      },

      // 条件削除
      deleteConditions: (customerId) => {
        set((state) => ({
          conditions: state.conditions.filter(c => c.customerId !== customerId),
        }))
      },

      // 物件設定
      setProperties: (properties) => set({ properties }),

      // 物件追加
      addProperties: (properties) => {
        set((state) => {
          const newProps = properties.filter(
            p => !state.properties.some(ep => ep.id === p.id)
          )
          return { properties: [...state.properties, ...newProps] }
        })
      },

      // 物件更新
      updateProperty: (id, updates) => {
        set((state) => ({
          properties: state.properties.map(p =>
            p.id === id ? { ...p, ...updates } : p
          ),
        }))
      },

      // 物件削除
      deleteProperty: (id) => {
        set((state) => ({
          properties: state.properties.filter(p => p.id !== id),
        }))
      },

      // 物件取得
      getPropertyById: (id) => {
        return get().properties.find(p => p.id === id)
      },

      // マッチング実行
      runMatching: (customerNames) => {
        const state = get()
        const newResults: LandMatchResult[] = []
        const newAlerts: LandAlert[] = []

        for (const conditions of state.conditions) {
          for (const property of state.properties) {
            // 販売中の物件のみ
            if (property.status !== 'available') continue

            const match = calculateLandMatch(conditions, property)

            // 50%以上のマッチを記録
            if (match.matchScore >= 50) {
              newResults.push(match)

              // 70%以上でアラート生成（既存アラートがなければ）
              if (match.alertLevel === 'high') {
                const existingAlert = state.alerts.find(
                  a =>
                    a.matchResult.customerId === match.customerId &&
                    a.matchResult.propertyId === match.propertyId
                )

                if (!existingAlert) {
                  newAlerts.push({
                    id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                    matchResult: match,
                    property,
                    conditions,
                    customerName: customerNames.get(conditions.customerId) || '不明',
                    createdAt: new Date().toISOString(),
                    status: 'new',
                    notifiedAt: null,
                    contactedAt: null,
                    contactedBy: null,
                    notes: '',
                  })
                }
              }
            }
          }
        }

        set({
          matchResults: newResults,
          alerts: [...state.alerts, ...newAlerts],
          lastMatchedAt: new Date().toISOString(),
        })
      },

      // 顧客別マッチング取得
      getMatchesForCustomer: (customerId) => {
        return get()
          .matchResults.filter(m => m.customerId === customerId)
          .sort((a, b) => b.matchScore - a.matchScore)
      },

      // 物件別マッチング取得
      getMatchesForProperty: (propertyId) => {
        return get()
          .matchResults.filter(m => m.propertyId === propertyId)
          .sort((a, b) => b.matchScore - a.matchScore)
      },

      // アラート取得
      getAlerts: (status) => {
        const alerts = get().alerts
        if (status) {
          return alerts.filter(a => a.status === status)
        }
        return alerts.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      },

      // 顧客別アラート
      getAlertsForCustomer: (customerId) => {
        return get().alerts.filter(a => a.matchResult.customerId === customerId)
      },

      // アラート通知済み
      markAlertNotified: (alertId) => {
        set((state) => ({
          alerts: state.alerts.map(a =>
            a.id === alertId
              ? { ...a, status: 'notified' as const, notifiedAt: new Date().toISOString() }
              : a
          ),
        }))
      },

      // アラート連絡済み
      markAlertContacted: (alertId, contactedBy, notes) => {
        set((state) => ({
          alerts: state.alerts.map(a =>
            a.id === alertId
              ? {
                  ...a,
                  status: 'contacted' as const,
                  contactedAt: new Date().toISOString(),
                  contactedBy,
                  notes: notes || a.notes,
                }
              : a
          ),
        }))
      },

      // アラート却下
      dismissAlert: (alertId) => {
        set((state) => ({
          alerts: state.alerts.map(a =>
            a.id === alertId ? { ...a, status: 'dismissed' as const } : a
          ),
        }))
      },

      // アラートクリア
      clearAlerts: () => {
        set({ alerts: [] })
      },
    }),
    {
      name: 'ghouse-land',
    }
  )
)
