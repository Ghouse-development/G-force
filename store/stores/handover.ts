import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DocumentStatus } from '@/types/database'

export interface StoredHandover {
  id: string
  customer_id: string
  contract_id: string | null
  from_user_id: string | null
  from_user_name: string | null
  to_user_id: string | null
  to_user_name: string | null
  status: DocumentStatus
  customer_name: string | null
  tei_name: string | null
  customer_notes: string | null
  site_notes: string | null
  schedule_notes: string | null
  special_notes: string | null
  checklist: {
    category: string
    items: { label: string; checked: boolean }[]
  }[]
  confirmed_by: string | null
  confirmed_by_name: string | null
  confirmed_at: string | null
  created_at: string
  updated_at: string
}

interface HandoverState {
  handovers: StoredHandover[]
  isLoading: boolean
  addHandover: (handover: Omit<StoredHandover, 'id' | 'created_at' | 'updated_at'>) => string
  updateHandover: (id: string, updates: Partial<StoredHandover>) => void
  updateHandoverStatus: (id: string, status: DocumentStatus) => void
  confirmHandover: (id: string, userId: string, userName: string) => void
  deleteHandover: (id: string) => void
  getHandover: (id: string) => StoredHandover | undefined
  getHandoversByCustomer: (customerId: string) => StoredHandover[]
  getHandoversByStatus: (status: DocumentStatus) => StoredHandover[]
  setHandovers: (handovers: StoredHandover[]) => void
  setLoading: (loading: boolean) => void
}

export const useHandoverStore = create<HandoverState>()(
  persist(
    (set, get) => ({
      handovers: [],
      isLoading: false,
      addHandover: (handover) => {
        const id = `handover-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        const now = new Date().toISOString()
        const newHandover: StoredHandover = {
          ...handover,
          id,
          created_at: now,
          updated_at: now,
        }
        set((state) => ({
          handovers: [newHandover, ...state.handovers],
        }))
        return id
      },
      updateHandover: (id, updates) => {
        set((state) => ({
          handovers: state.handovers.map((h) =>
            h.id === id
              ? { ...h, ...updates, updated_at: new Date().toISOString() }
              : h
          ),
        }))
      },
      updateHandoverStatus: (id, status) => {
        set((state) => ({
          handovers: state.handovers.map((h) =>
            h.id === id
              ? { ...h, status, updated_at: new Date().toISOString() }
              : h
          ),
        }))
      },
      confirmHandover: (id, userId, userName) => {
        const now = new Date().toISOString()
        set((state) => ({
          handovers: state.handovers.map((h) =>
            h.id === id
              ? {
                  ...h,
                  status: 'approved' as DocumentStatus,
                  confirmed_by: userId,
                  confirmed_by_name: userName,
                  confirmed_at: now,
                  updated_at: now,
                }
              : h
          ),
        }))
      },
      deleteHandover: (id) => {
        set((state) => ({
          handovers: state.handovers.filter((h) => h.id !== id),
        }))
      },
      getHandover: (id) => {
        return get().handovers.find((h) => h.id === id)
      },
      getHandoversByCustomer: (customerId) => {
        return get().handovers.filter((h) => h.customer_id === customerId)
      },
      getHandoversByStatus: (status) => {
        return get().handovers.filter((h) => h.status === status)
      },
      setHandovers: (handovers) => set({ handovers }),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'ghouse-handovers',
    }
  )
)
