import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PlanRequest, PlanRequestStatus, DesignOffice } from '@/types/database'

interface PlanRequestState {
  planRequests: PlanRequest[]
  isLoading: boolean
  addPlanRequest: (request: Omit<PlanRequest, 'id' | 'created_at' | 'updated_at'>) => string
  updatePlanRequest: (id: string, updates: Partial<PlanRequest>) => void
  updatePlanRequestStatus: (id: string, status: PlanRequestStatus) => void
  assignDesignOffice: (id: string, office: DesignOffice, designerName?: string) => void
  deletePlanRequest: (id: string) => void
  getPlanRequest: (id: string) => PlanRequest | undefined
  getPlanRequestsByCustomer: (customerId: string) => PlanRequest[]
  setPlanRequests: (requests: PlanRequest[]) => void
  setLoading: (loading: boolean) => void
}

export const usePlanRequestStore = create<PlanRequestState>()(
  persist(
    (set, get) => ({
      planRequests: [],
      isLoading: false,
      addPlanRequest: (request) => {
        const id = `pr-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        const now = new Date().toISOString()
        const newRequest: PlanRequest = {
          ...request,
          id,
          created_at: now,
          updated_at: now,
        } as PlanRequest
        set((state) => ({
          planRequests: [newRequest, ...state.planRequests],
        }))
        return id
      },
      updatePlanRequest: (id, updates) => {
        set((state) => ({
          planRequests: state.planRequests.map((r) =>
            r.id === id
              ? { ...r, ...updates, updated_at: new Date().toISOString() }
              : r
          ),
        }))
      },
      updatePlanRequestStatus: (id, status) => {
        set((state) => ({
          planRequests: state.planRequests.map((r) =>
            r.id === id
              ? { ...r, status, updated_at: new Date().toISOString() }
              : r
          ),
        }))
      },
      assignDesignOffice: (id, office, designerName) => {
        set((state) => ({
          planRequests: state.planRequests.map((r) =>
            r.id === id
              ? {
                  ...r,
                  design_office: office,
                  designer_name: designerName || r.designer_name,
                  status: '設計割り振り' as PlanRequestStatus,
                  updated_at: new Date().toISOString(),
                }
              : r
          ),
        }))
      },
      deletePlanRequest: (id) => {
        set((state) => ({
          planRequests: state.planRequests.filter((r) => r.id !== id),
        }))
      },
      getPlanRequest: (id) => {
        return get().planRequests.find((r) => r.id === id)
      },
      getPlanRequestsByCustomer: (customerId) => {
        return get().planRequests.filter((r) => r.customer_id === customerId)
      },
      setPlanRequests: (requests) => set({ planRequests: requests }),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'ghouse-plan-requests',
    }
  )
)
