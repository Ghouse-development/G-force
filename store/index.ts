import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types/database'

// 通知タイプ
export type NotificationType = 'info' | 'success' | 'warning' | 'error'
export type NotificationCategory = 'system' | 'contract' | 'plan_request' | 'customer'

// Local notification type for app state
interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  category: NotificationCategory
  read: boolean
  createdAt: string
  // 関連リンク
  linkUrl?: string
  linkLabel?: string
  // 関連データ
  relatedId?: string // 関連する契約ID等
  relatedType?: string // 'contract' | 'plan_request' etc
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
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => string
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  deleteNotification: (id: string) => void
  clearAll: () => void
  getUnreadByCategory: (category: NotificationCategory) => Notification[]
  // 契約承認関連の通知を追加するヘルパー
  addContractNotification: (params: {
    contractId: string
    contractNumber: string
    teiName: string
    action: 'submitted' | 'approved' | 'returned' | 'completed'
    actorName: string
    comment?: string
  }) => void
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      addNotification: (notification) => {
        const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        const newNotification: Notification = {
          ...notification,
          id,
          read: false,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 100), // 最大100件
          unreadCount: state.unreadCount + 1,
        }))
        return id
      },
      markAsRead: (id) =>
        set((state) => {
          const notification = state.notifications.find(n => n.id === id)
          if (!notification || notification.read) return state
          return {
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          }
        }),
      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        })),
      deleteNotification: (id) =>
        set((state) => {
          const notification = state.notifications.find(n => n.id === id)
          return {
            notifications: state.notifications.filter((n) => n.id !== id),
            unreadCount: notification && !notification.read
              ? Math.max(0, state.unreadCount - 1)
              : state.unreadCount,
          }
        }),
      clearAll: () => set({ notifications: [], unreadCount: 0 }),
      getUnreadByCategory: (category) => {
        return get().notifications.filter((n) => !n.read && n.category === category)
      },
      // 契約承認関連の通知を追加するヘルパー
      addContractNotification: ({ contractId, contractNumber, teiName, action, actorName, comment }) => {
        const configs: Record<string, { title: string; message: string; type: NotificationType }> = {
          submitted: {
            title: '承認申請',
            message: `${teiName || contractNumber} の承認申請が${actorName}から送信されました`,
            type: 'info',
          },
          approved: {
            title: '承認完了',
            message: `${teiName || contractNumber} が${actorName}により承認されました${comment ? `: ${comment}` : ''}`,
            type: 'success',
          },
          returned: {
            title: '差戻し',
            message: `${teiName || contractNumber} が${actorName}により差戻されました: ${comment || ''}`,
            type: 'warning',
          },
          completed: {
            title: '契約完了',
            message: `${teiName || contractNumber} の承認フローが完了しました`,
            type: 'success',
          },
        }

        const config = configs[action]
        if (!config) return

        get().addNotification({
          title: config.title,
          message: config.message,
          type: config.type,
          category: 'contract',
          linkUrl: `/contracts/${contractId}`,
          linkLabel: '詳細を見る',
          relatedId: contractId,
          relatedType: 'contract',
        })
      },
    }),
    {
      name: 'ghouse-notifications',
    }
  )
)

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

// ロックタイプ
export type FundPlanLockType = 'contract' | 'change_contract' | null

// バージョン履歴アイテム
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
  // バージョン管理・ロック機能
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
  // バージョン管理・ロック機能
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
            // ロックされている場合は更新不可
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
      // バージョン管理・ロック機能
      lockFundPlan: (id, lockType, lockedBy, note) => {
        set((state) => ({
          fundPlans: state.fundPlans.map((plan) => {
            if (plan.id !== id) return plan
            const now = new Date().toISOString()
            // 現在のデータをバージョン履歴に追加（ロック時点を記録）
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
            // ロックされたバージョンは復元できない（閲覧のみ）
            // 新しいバージョンとして復元データを保存
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
            if (plan.isLocked) return plan // ロック中は新バージョン作成不可
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

// Customer Store - 顧客データの永続化
import type { Customer, PipelineStatus } from '@/types/database'

interface CustomerState {
  customers: Customer[]
  challengeCustomerIds: string[] // チャレンジ（当月見込）フラグを持つ顧客ID
  isLoading: boolean
  addCustomer: (customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => string
  updateCustomer: (id: string, updates: Partial<Customer>) => void
  updateCustomerStatus: (id: string, status: PipelineStatus) => void
  deleteCustomer: (id: string) => void
  getCustomer: (id: string) => Customer | undefined
  setCustomers: (customers: Customer[]) => void
  setLoading: (loading: boolean) => void
  // チャレンジフラグ操作
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
      // チャレンジフラグ操作
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

// Plan Request Store - プラン依頼管理
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

// Contract Store - 契約書管理（承認フロー対応）
import type { ContractStatus, ContractHistoryEntry, OwnershipType } from '@/types/database'
import { CONTRACT_STATUS_TRANSITIONS } from '@/types/database'

// StoredContract - ストア用の契約型（historyを明示的に型指定）
export interface StoredContract {
  id: string
  customer_id: string
  fund_plan_id: string | null
  status: ContractStatus
  contract_number: string | null
  contract_date: string | null
  tei_name: string | null
  customer_name: string | null
  partner_name: string | null
  ownership_type: OwnershipType
  sales_person: string | null
  design_person: string | null
  construction_person: string | null
  ic_person: string | null
  land_address: string | null
  land_area: number | null
  building_area: number | null
  product_name: string | null
  building_price: number | null
  option_price: number | null
  exterior_price: number | null
  other_price: number | null
  discount_amount: number | null
  tax_amount: number | null
  total_amount: number | null
  payment_at_contract: number | null
  payment_at_start: number | null
  payment_at_frame: number | null
  payment_at_completion: number | null
  identity_verified: boolean
  identity_doc_type: string | null
  identity_verified_date: string | null
  identity_verified_by: string | null
  loan_type: string | null
  loan_bank: string | null
  loan_amount: number | null
  loan_approved: boolean
  loan_approved_date: string | null
  important_notes: string | null
  important_notes_date: string | null
  attachments: unknown | null
  created_by: string | null
  created_by_name: string | null
  checked_by: string | null
  checked_by_name: string | null
  checked_at: string | null
  check_comment: string | null
  approved_by: string | null
  approved_by_name: string | null
  approved_at: string | null
  approval_comment: string | null
  returned_by: string | null
  returned_by_name: string | null
  returned_at: string | null
  return_comment: string | null
  return_count: number
  history: ContractHistoryEntry[]
  notes: string | null
  // 指定承認者
  designated_checker_id: string | null // 書類確認者を指定
  designated_checker_name: string | null
  designated_approver_id: string | null // 上長承認者を指定
  designated_approver_name: string | null
  created_at: string
  updated_at: string
}

interface ContractState {
  contracts: StoredContract[]
  isLoading: boolean
  addContract: (contract: Omit<StoredContract, 'id' | 'created_at' | 'updated_at' | 'history' | 'return_count'>) => string
  updateContract: (id: string, updates: Partial<StoredContract>) => void
  deleteContract: (id: string) => void
  getContract: (id: string) => StoredContract | undefined
  getContractsByCustomer: (customerId: string) => StoredContract[]
  getContractsByStatus: (status: ContractStatus) => StoredContract[]
  // 承認フローアクション
  submitForApproval: (id: string, userId: string, userName: string) => boolean
  approveContract: (id: string, userId: string, userName: string, comment?: string) => boolean
  returnContract: (id: string, userId: string, userName: string, comment: string) => boolean
  setContracts: (contracts: StoredContract[]) => void
  setLoading: (loading: boolean) => void
}

export const useContractStore = create<ContractState>()(
  persist(
    (set, get) => ({
      contracts: [],
      isLoading: false,
      addContract: (contract) => {
        const id = `contract-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        const now = new Date().toISOString()
        const contractNumber = `C-${new Date().getFullYear()}-${String(get().contracts.length + 1).padStart(4, '0')}`
        const newContract: StoredContract = {
          ...contract,
          id,
          contract_number: contractNumber,
          status: '作成中',
          return_count: 0,
          history: [{
            id: `hist-${Date.now()}`,
            action: 'ステータス変更',
            fromStatus: '作成中',
            toStatus: '作成中',
            userId: contract.created_by || null,
            userName: contract.created_by_name || null,
            comment: '契約書を作成しました',
            timestamp: now,
          }],
          created_at: now,
          updated_at: now,
        }
        set((state) => ({
          contracts: [newContract, ...state.contracts],
        }))
        return id
      },
      updateContract: (id, updates) => {
        set((state) => ({
          contracts: state.contracts.map((c) =>
            c.id === id
              ? { ...c, ...updates, updated_at: new Date().toISOString() }
              : c
          ),
        }))
      },
      deleteContract: (id) => {
        set((state) => ({
          contracts: state.contracts.filter((c) => c.id !== id),
        }))
      },
      getContract: (id) => {
        return get().contracts.find((c) => c.id === id)
      },
      getContractsByCustomer: (customerId) => {
        return get().contracts.filter((c) => c.customer_id === customerId)
      },
      getContractsByStatus: (status) => {
        return get().contracts.filter((c) => c.status === status)
      },
      // 承認申請
      submitForApproval: (id, userId, userName) => {
        const contract = get().getContract(id)
        if (!contract || contract.status !== '作成中') return false

        const now = new Date().toISOString()
        const nextStatus = CONTRACT_STATUS_TRANSITIONS['作成中'].next
        if (!nextStatus) return false

        const historyEntry: ContractHistoryEntry = {
          id: `hist-${Date.now()}`,
          action: '承認申請',
          fromStatus: '作成中',
          toStatus: nextStatus,
          userId,
          userName,
          comment: '承認申請を送信しました',
          timestamp: now,
        }

        set((state) => ({
          contracts: state.contracts.map((c) =>
            c.id === id
              ? {
                  ...c,
                  status: nextStatus,
                  history: [...c.history, historyEntry],
                  updated_at: now,
                }
              : c
          ),
        }))
        return true
      },
      // 承認
      approveContract: (id, userId, userName, comment) => {
        const contract = get().getContract(id)
        if (!contract) return false

        const currentStatus = contract.status as ContractStatus
        const transition = CONTRACT_STATUS_TRANSITIONS[currentStatus]
        if (!transition.next) return false

        const now = new Date().toISOString()
        const historyEntry: ContractHistoryEntry = {
          id: `hist-${Date.now()}`,
          action: '承認',
          fromStatus: currentStatus,
          toStatus: transition.next,
          userId,
          userName,
          comment: comment || '承認しました',
          timestamp: now,
        }

        const updates: Partial<StoredContract> = {
          status: transition.next,
          history: [...contract.history, historyEntry],
          updated_at: now,
        }

        // ステータスに応じて承認者情報を設定
        if (currentStatus === '書類確認') {
          updates.checked_by = userId
          updates.checked_by_name = userName
          updates.checked_at = now
          updates.check_comment = comment || null
        } else if (currentStatus === '上長承認待ち') {
          updates.approved_by = userId
          updates.approved_by_name = userName
          updates.approved_at = now
          updates.approval_comment = comment || null
        }

        set((state) => ({
          contracts: state.contracts.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }))
        return true
      },
      // 差戻し
      returnContract: (id, userId, userName, comment) => {
        const contract = get().getContract(id)
        if (!contract) return false

        const currentStatus = contract.status as ContractStatus
        const transition = CONTRACT_STATUS_TRANSITIONS[currentStatus]
        if (!transition.prev) return false

        const now = new Date().toISOString()
        const historyEntry: ContractHistoryEntry = {
          id: `hist-${Date.now()}`,
          action: '差戻し',
          fromStatus: currentStatus,
          toStatus: transition.prev,
          userId,
          userName,
          comment,
          timestamp: now,
        }

        set((state) => ({
          contracts: state.contracts.map((c) =>
            c.id === id
              ? {
                  ...c,
                  status: transition.prev!,
                  returned_by: userId,
                  returned_by_name: userName,
                  returned_at: now,
                  return_comment: comment,
                  return_count: c.return_count + 1,
                  history: [...c.history, historyEntry],
                  updated_at: now,
                }
              : c
          ),
        }))
        return true
      },
      setContracts: (contracts) => set({ contracts }),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'ghouse-contracts',
    }
  )
)

// File Store - ファイルアップロード管理
export type FileCategory = 'document' | 'audio' | 'image' | 'memo'

// 書類の詳細カテゴリ
export type DocumentCategory =
  | 'land_registry' // 土地謄本
  | 'cadastral_map' // 公図
  | 'land_survey' // 地積測量図
  | 'land_explanation' // 土地重説
  | 'land_contract' // 土地契約書
  | 'road_designation' // 位置指定道路
  | 'drivers_license' // 運転免許証
  | 'health_insurance' // 健康保険証
  | 'loan_preapproval' // ローン事前審査
  | 'site_photos' // 建築地写真
  | 'housing_map' // 住宅地図
  | 'meeting_records' // 議事録
  | 'other' // その他

export interface StoredFile {
  id: string
  customerId: string
  name: string
  type: string
  size: number
  dataUrl: string // Base64 data URL
  category: FileCategory // ファイルカテゴリ
  documentCategory?: DocumentCategory // 書類の詳細カテゴリ
  uploadedAt: string
  uploadedBy: string | null
  // テキストメモ用
  memoContent?: string
  // AI分析結果（将来用）
  aiAnalysis?: {
    summary?: string
    sentiment?: 'positive' | 'neutral' | 'negative'
    keywords?: string[]
    analyzedAt?: string
  }
}

interface FileState {
  files: StoredFile[]
  addFile: (file: Omit<StoredFile, 'id' | 'uploadedAt'>) => string
  addMemo: (customerId: string, content: string, uploadedBy: string | null) => string
  updateMemo: (id: string, content: string) => void
  deleteFile: (id: string) => void
  getFilesByCustomer: (customerId: string) => StoredFile[]
  getFilesByCategory: (customerId: string, category: FileCategory) => StoredFile[]
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
      addMemo: (customerId, content, uploadedBy) => {
        const id = `memo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        const now = new Date()
        const newMemo: StoredFile = {
          id,
          customerId,
          name: `メモ ${now.toLocaleDateString('ja-JP')} ${now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}`,
          type: 'text/plain',
          size: new Blob([content]).size,
          dataUrl: '',
          category: 'memo',
          uploadedAt: now.toISOString(),
          uploadedBy,
          memoContent: content,
        }
        set((state) => ({
          files: [newMemo, ...state.files],
        }))
        return id
      },
      updateMemo: (id, content) => {
        set((state) => ({
          files: state.files.map((f) =>
            f.id === id
              ? { ...f, memoContent: content, size: new Blob([content]).size }
              : f
          ),
        }))
      },
      deleteFile: (id) => {
        set((state) => ({
          files: state.files.filter((f) => f.id !== id),
        }))
      },
      getFilesByCustomer: (customerId) => {
        return get().files
          .filter((f) => f.customerId === customerId)
          .map((f) => ({
            ...f,
            // 古いデータとの互換性: categoryがない場合はtypeから判定
            category: f.category || (
              f.type.startsWith('audio/') ? 'audio' :
              f.type.startsWith('image/') ? 'image' :
              f.memoContent ? 'memo' : 'document'
            ) as FileCategory,
          }))
      },
      getFilesByCategory: (customerId, category) => {
        return get().files.filter((f) => f.customerId === customerId && f.category === category)
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
