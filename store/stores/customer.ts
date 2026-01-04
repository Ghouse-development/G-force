import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Customer, PipelineStatus } from '@/types/database'

interface CustomerState {
  customers: Customer[]
  challengeCustomerIds: string[]
  isLoading: boolean
  addCustomer: (customer: Partial<Omit<Customer, 'id' | 'created_at' | 'updated_at'>> & { name: string; pipeline_status: PipelineStatus }) => string
  updateCustomer: (id: string, updates: Partial<Customer>) => void
  updateCustomerStatus: (id: string, status: PipelineStatus) => void
  deleteCustomer: (id: string) => void
  getCustomer: (id: string) => Customer | undefined
  setCustomers: (customers: Customer[]) => void
  setLoading: (loading: boolean) => void
  toggleChallenge: (id: string) => void
  isChallenge: (id: string) => boolean
  getChallengeCustomers: () => Customer[]
}

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set, get) => ({
      customers: [],
      challengeCustomerIds: [],
      isLoading: false,
      addCustomer: (customer) => {
        const id = `cust-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        const now = new Date().toISOString()
        const newCustomer: Customer = {
          ...customer,
          id,
          created_at: now,
          updated_at: now,
        } as Customer
        set((state) => ({
          customers: [newCustomer, ...state.customers],
        }))
        return id
      },
      updateCustomer: (id, updates) => {
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === id
              ? { ...c, ...updates, updated_at: new Date().toISOString() }
              : c
          ),
        }))
      },
      updateCustomerStatus: (id, status) => {
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === id
              ? { ...c, pipeline_status: status, updated_at: new Date().toISOString() }
              : c
          ),
        }))
      },
      deleteCustomer: (id) => {
        set((state) => ({
          customers: state.customers.filter((c) => c.id !== id),
          challengeCustomerIds: state.challengeCustomerIds.filter((cid) => cid !== id),
        }))
      },
      getCustomer: (id) => {
        return get().customers.find((c) => c.id === id)
      },
      setCustomers: (customers) => set({ customers }),
      setLoading: (loading) => set({ isLoading: loading }),
      toggleChallenge: (id) => {
        set((state) => {
          const isCurrentlyChallenge = state.challengeCustomerIds.includes(id)
          return {
            challengeCustomerIds: isCurrentlyChallenge
              ? state.challengeCustomerIds.filter((cid) => cid !== id)
              : [...state.challengeCustomerIds, id],
          }
        })
      },
      isChallenge: (id) => {
        return get().challengeCustomerIds.includes(id)
      },
      getChallengeCustomers: () => {
        const { customers, challengeCustomerIds } = get()
        return customers.filter((c) => challengeCustomerIds.includes(c.id))
      },
    }),
    {
      name: 'ghouse-customers',
    }
  )
)
