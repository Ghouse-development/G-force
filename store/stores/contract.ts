import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ContractStatus, ContractHistoryEntry, OwnershipType } from '@/types/database'
import { CONTRACT_STATUS_TRANSITIONS } from '@/types/database'

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
  designated_checker_id: string | null
  designated_checker_name: string | null
  designated_approver_id: string | null
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
