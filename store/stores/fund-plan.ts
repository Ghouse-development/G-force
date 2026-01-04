import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FundPlanData } from '@/types/fund-plan'
import type { DocumentStatus } from '@/types/database'

export type FundPlanLockType = 'contract' | 'change_contract' | null

export interface FundPlanVersionHistory {
  version: number
  data: FundPlanData
  savedAt: string
  savedBy: string | null
  lockType: FundPlanLockType
  note?: string
}

export interface StoredFundPlan {
  id: string
  customerId: string | null
  customerName: string | null
  teiName: string
  status: DocumentStatus
  version: number
  data: FundPlanData
  createdBy: string | null
  createdAt: string
  updatedAt: string
  isLocked: boolean
  lockType: FundPlanLockType
  lockedAt: string | null
  lockedBy: string | null
  versionHistory: FundPlanVersionHistory[]
}

interface FundPlanState {
  fundPlans: StoredFundPlan[]
  isLoading: boolean
  addFundPlan: (plan: Omit<StoredFundPlan, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'isLocked' | 'lockType' | 'lockedAt' | 'lockedBy' | 'versionHistory'>) => string
  updateFundPlan: (id: string, updates: Partial<Omit<StoredFundPlan, 'id' | 'createdAt'>>) => void
  deleteFundPlan: (id: string) => void
  getFundPlan: (id: string) => StoredFundPlan | undefined
  getFundPlansByCustomer: (customerId: string) => StoredFundPlan[]
  setLoading: (loading: boolean) => void
  lockFundPlan: (id: string, lockType: FundPlanLockType, lockedBy: string | null, note?: string) => void
  unlockFundPlan: (id: string) => void
  getVersionHistory: (id: string) => FundPlanVersionHistory[]
  restoreVersion: (id: string, version: number) => void
  createNewVersion: (id: string, data: FundPlanData, savedBy: string | null) => void
}

export const useFundPlanStore = create<FundPlanState>()(
  persist(
    (set, get) => ({
      fundPlans: [],
      isLoading: false,
      addFundPlan: (plan) => {
        const id = `fp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        const now = new Date().toISOString()
        const newPlan: StoredFundPlan = {
          ...plan,
          id,
          version: 1,
          createdAt: now,
          updatedAt: now,
          isLocked: false,
          lockType: null,
          lockedAt: null,
          lockedBy: null,
          versionHistory: [{
            version: 1,
            data: plan.data,
            savedAt: now,
            savedBy: plan.createdBy,
            lockType: null,
          }],
        }
        set((state) => ({
          fundPlans: [newPlan, ...state.fundPlans],
        }))
        return id
      },
      updateFundPlan: (id, updates) => {
        set((state) => ({
          fundPlans: state.fundPlans.map((plan) => {
            if (plan.id !== id) return plan
            if (plan.isLocked) return plan
            return {
              ...plan,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          }),
        }))
      },
      deleteFundPlan: (id) => {
        set((state) => ({
          fundPlans: state.fundPlans.filter((plan) => plan.id !== id),
        }))
      },
      getFundPlan: (id) => {
        return get().fundPlans.find((plan) => plan.id === id)
      },
      getFundPlansByCustomer: (customerId) => {
        return get().fundPlans.filter((plan) => plan.customerId === customerId)
      },
      setLoading: (loading) => set({ isLoading: loading }),
      lockFundPlan: (id, lockType, lockedBy, note) => {
        set((state) => ({
          fundPlans: state.fundPlans.map((plan) => {
            if (plan.id !== id) return plan
            const now = new Date().toISOString()
            const newVersion = plan.version + 1
            const newHistoryItem: FundPlanVersionHistory = {
              version: newVersion,
              data: { ...plan.data },
              savedAt: now,
              savedBy: lockedBy,
              lockType: lockType,
              note: note || (lockType === 'contract' ? '請負契約時' : lockType === 'change_contract' ? '変更契約時' : undefined),
            }
            return {
              ...plan,
              version: newVersion,
              isLocked: true,
              lockType: lockType,
              lockedAt: now,
              lockedBy: lockedBy,
              updatedAt: now,
              versionHistory: [...plan.versionHistory, newHistoryItem],
            }
          }),
        }))
      },
      unlockFundPlan: (id) => {
        set((state) => ({
          fundPlans: state.fundPlans.map((plan) =>
            plan.id === id
              ? {
                  ...plan,
                  isLocked: false,
                  lockType: null,
                  lockedAt: null,
                  lockedBy: null,
                  updatedAt: new Date().toISOString(),
                }
              : plan
          ),
        }))
      },
      getVersionHistory: (id) => {
        const plan = get().fundPlans.find((p) => p.id === id)
        return plan?.versionHistory || []
      },
      restoreVersion: (id, version) => {
        set((state) => ({
          fundPlans: state.fundPlans.map((plan) => {
            if (plan.id !== id) return plan
            const historyItem = plan.versionHistory.find((h) => h.version === version)
            if (!historyItem) return plan
            const now = new Date().toISOString()
            const newVersion = plan.version + 1
            return {
              ...plan,
              data: { ...historyItem.data },
              version: newVersion,
              updatedAt: now,
              versionHistory: [...plan.versionHistory, {
                version: newVersion,
                data: { ...historyItem.data },
                savedAt: now,
                savedBy: null,
                lockType: null,
                note: `v${version}から復元`,
              }],
            }
          }),
        }))
      },
      createNewVersion: (id, data, savedBy) => {
        set((state) => ({
          fundPlans: state.fundPlans.map((plan) => {
            if (plan.id !== id) return plan
            if (plan.isLocked) return plan
            const now = new Date().toISOString()
            const newVersion = plan.version + 1
            return {
              ...plan,
              data: data,
              version: newVersion,
              updatedAt: now,
              versionHistory: [...plan.versionHistory, {
                version: newVersion,
                data: data,
                savedAt: now,
                savedBy: savedBy,
                lockType: null,
              }],
            }
          }),
        }))
      },
    }),
    {
      name: 'ghouse-fund-plans',
    }
  )
)
