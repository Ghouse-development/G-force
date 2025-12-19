import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types/database'

// Local notification type for app state
interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  createdAt: string
}

// Auth Store - Simple auth state for dev mode
interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      setUser: (user) => set({
        user,
        isAuthenticated: !!user,
        isLoading: false
      }),
      setLoading: (loading) => set({ isLoading: loading }),
      logout: () => set({
        user: null,
        isAuthenticated: false,
        isLoading: false
      }),
    }),
    {
      name: 'ghouse-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
)

// Notification Store
interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void
  markAsRead: (id: string) => void
  clearAll: () => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  addNotification: (notification) =>
    set((state) => {
      const newNotification: Notification = {
        ...notification,
        id: Math.random().toString(36).substring(2, 11),
        read: false,
        createdAt: new Date().toISOString(),
      }
      return {
        notifications: [newNotification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      }
    }),
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}))

// UI Store for global UI state
interface UIState {
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))

// Fund Plan Store - 資金計画書の永続化
import type { FundPlanData } from '@/types/fund-plan'
import type { DocumentStatus } from '@/types/database'

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
}

interface FundPlanState {
  fundPlans: StoredFundPlan[]
  isLoading: boolean
  addFundPlan: (plan: Omit<StoredFundPlan, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => string
  updateFundPlan: (id: string, updates: Partial<Omit<StoredFundPlan, 'id' | 'createdAt'>>) => void
  deleteFundPlan: (id: string) => void
  getFundPlan: (id: string) => StoredFundPlan | undefined
  getFundPlansByCustomer: (customerId: string) => StoredFundPlan[]
  setLoading: (loading: boolean) => void
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
        }
        set((state) => ({
          fundPlans: [newPlan, ...state.fundPlans],
        }))
        return id
      },
      updateFundPlan: (id, updates) => {
        set((state) => ({
          fundPlans: state.fundPlans.map((plan) =>
            plan.id === id
              ? {
                  ...plan,
                  ...updates,
                  version: plan.version + 1,
                  updatedAt: new Date().toISOString(),
                }
              : plan
          ),
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
    }),
    {
      name: 'ghouse-fund-plans',
    }
  )
)

// Customer Store - 顧客データの永続化
import type { Customer, PipelineStatus } from '@/types/database'

interface CustomerState {
  customers: Customer[]
  isLoading: boolean
  addCustomer: (customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => string
  updateCustomer: (id: string, updates: Partial<Customer>) => void
  updateCustomerStatus: (id: string, status: PipelineStatus) => void
  deleteCustomer: (id: string) => void
  getCustomer: (id: string) => Customer | undefined
  setCustomers: (customers: Customer[]) => void
  setLoading: (loading: boolean) => void
}

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set, get) => ({
      customers: [],
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
        }))
      },
      getCustomer: (id) => {
        return get().customers.find((c) => c.id === id)
      },
      setCustomers: (customers) => set({ customers }),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'ghouse-customers',
    }
  )
)

// File Store - ファイルアップロード管理
export interface StoredFile {
  id: string
  customerId: string
  name: string
  type: string
  size: number
  dataUrl: string // Base64 data URL
  uploadedAt: string
  uploadedBy: string | null
}

interface FileState {
  files: StoredFile[]
  addFile: (file: Omit<StoredFile, 'id' | 'uploadedAt'>) => string
  deleteFile: (id: string) => void
  getFilesByCustomer: (customerId: string) => StoredFile[]
  getFile: (id: string) => StoredFile | undefined
}

export const useFileStore = create<FileState>()(
  persist(
    (set, get) => ({
      files: [],
      addFile: (file) => {
        const id = `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        const newFile: StoredFile = {
          ...file,
          id,
          uploadedAt: new Date().toISOString(),
        }
        set((state) => ({
          files: [newFile, ...state.files],
        }))
        return id
      },
      deleteFile: (id) => {
        set((state) => ({
          files: state.files.filter((f) => f.id !== id),
        }))
      },
      getFilesByCustomer: (customerId) => {
        return get().files.filter((f) => f.customerId === customerId)
      },
      getFile: (id) => {
        return get().files.find((f) => f.id === id)
      },
    }),
    {
      name: 'ghouse-files',
    }
  )
)
