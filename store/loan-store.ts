import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ローンステータス
export type LoanStatus =
  | '事前審査中'
  | '事前審査通過'
  | '事前審査否決'
  | '本審査中'
  | '本審査通過'
  | '本審査否決'
  | '融資実行待ち'
  | '融資実行済み'
  | 'キャンセル'

// ローン情報
export interface Loan {
  id: string
  customerId: string
  customerName: string
  teiName: string | null
  bank: string
  loanType: string
  amount: number
  interestRate: number
  years: number
  monthlyPayment?: number
  status: LoanStatus
  preApprovalDate: string | null
  mainApprovalDate: string | null
  executionDate: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

interface LoanState {
  loans: Loan[]
  addLoan: (loan: Omit<Loan, 'id' | 'createdAt' | 'updatedAt' | 'monthlyPayment'>) => string
  updateLoan: (id: string, updates: Partial<Omit<Loan, 'id' | 'createdAt'>>) => void
  deleteLoan: (id: string) => void
  getLoan: (id: string) => Loan | undefined
  getLoansByCustomer: (customerId: string) => Loan[]
  getLoansByStatus: (status: LoanStatus) => Loan[]
}

// 月々返済額を計算（元利均等返済）
function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  years: number
): number {
  if (annualRate === 0) {
    return principal / (years * 12)
  }
  const monthlyRate = annualRate / 100 / 12
  const numPayments = years * 12
  const payment =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1)
  return Math.round(payment)
}

export const useLoanStore = create<LoanState>()(
  persist(
    (set, get) => ({
      loans: [],
      addLoan: (loan) => {
        const id = `loan-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        const now = new Date().toISOString()
        const monthlyPayment = calculateMonthlyPayment(
          loan.amount,
          loan.interestRate,
          loan.years
        )
        const newLoan: Loan = {
          ...loan,
          id,
          monthlyPayment,
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({
          loans: [newLoan, ...state.loans],
        }))
        return id
      },
      updateLoan: (id, updates) => {
        set((state) => ({
          loans: state.loans.map((loan) => {
            if (loan.id !== id) return loan
            const updatedLoan = { ...loan, ...updates, updatedAt: new Date().toISOString() }
            // 金額、金利、期間が変更された場合は月々返済額を再計算
            if (updates.amount !== undefined || updates.interestRate !== undefined || updates.years !== undefined) {
              updatedLoan.monthlyPayment = calculateMonthlyPayment(
                updates.amount ?? loan.amount,
                updates.interestRate ?? loan.interestRate,
                updates.years ?? loan.years
              )
            }
            return updatedLoan
          }),
        }))
      },
      deleteLoan: (id) => {
        set((state) => ({
          loans: state.loans.filter((loan) => loan.id !== id),
        }))
      },
      getLoan: (id) => {
        return get().loans.find((loan) => loan.id === id)
      },
      getLoansByCustomer: (customerId) => {
        return get().loans.filter((loan) => loan.customerId === customerId)
      },
      getLoansByStatus: (status) => {
        return get().loans.filter((loan) => loan.status === status)
      },
    }),
    {
      name: 'ghouse-loans',
    }
  )
)
