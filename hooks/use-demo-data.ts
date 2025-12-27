import { useMemo } from 'react'
import { useCustomerStore, useContractStore, usePlanRequestStore, useAuthStore } from '@/store'
import {
  useDemoModeStore,
  DEMO_CUSTOMERS,
  DEMO_CONTRACTS,
  DEMO_PLAN_REQUESTS,
  DEMO_USER,
} from '@/store/demo-store'
// Types imported for reference, actual inference from demo data
// import type { Customer, PlanRequest } from '@/types/database'
// import type { StoredContract } from '@/store'

// デモモードに応じてデータを返すフック
export function useDemoCustomers() {
  const { isDemoMode } = useDemoModeStore()
  const { customers: realCustomers } = useCustomerStore()

  return useMemo(() => {
    if (isDemoMode) {
      return DEMO_CUSTOMERS
    }
    return realCustomers
  }, [isDemoMode, realCustomers])
}

export function useDemoContracts() {
  const { isDemoMode } = useDemoModeStore()
  const { contracts: realContracts } = useContractStore()

  return useMemo(() => {
    if (isDemoMode) {
      return DEMO_CONTRACTS
    }
    return realContracts
  }, [isDemoMode, realContracts])
}

export function useDemoPlanRequests() {
  const { isDemoMode } = useDemoModeStore()
  const { planRequests: realPlanRequests } = usePlanRequestStore()

  return useMemo(() => {
    if (isDemoMode) {
      return DEMO_PLAN_REQUESTS
    }
    return realPlanRequests
  }, [isDemoMode, realPlanRequests])
}

export function useDemoUser() {
  const { isDemoMode } = useDemoModeStore()
  const { user: realUser } = useAuthStore()

  return useMemo(() => {
    if (isDemoMode) {
      return DEMO_USER
    }
    return realUser
  }, [isDemoMode, realUser])
}

// 複合フック：すべてのデモデータを一括で取得
export function useDemoData() {
  const { isDemoMode } = useDemoModeStore()
  const customers = useDemoCustomers()
  const contracts = useDemoContracts()
  const planRequests = useDemoPlanRequests()
  const user = useDemoUser()

  return {
    isDemoMode,
    customers,
    contracts,
    planRequests,
    user,
  }
}
