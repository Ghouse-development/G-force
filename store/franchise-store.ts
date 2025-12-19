import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// テナント（加盟店）
export interface Tenant {
  id: string
  code: string           // 加盟店コード
  name: string           // 加盟店名
  companyName: string    // 会社名
  representativeName: string  // 代表者名
  phone: string
  email: string
  address: string
  prefecture: string
  contractDate: string   // 加盟契約日
  status: 'active' | 'suspended' | 'terminated'
  plan: 'basic' | 'standard' | 'premium'
  maxUsers: number       // 最大ユーザー数
  currentUsers: number   // 現在のユーザー数
  monthlyFee: number     // 月額利用料
  notes: string | null
  createdAt: string
  updatedAt: string
}

// テナント統計
export interface TenantStats {
  totalCustomers: number
  totalContracts: number
  monthlyRevenue: number
  lastActivityAt: string | null
}

interface FranchiseState {
  tenants: Tenant[]
  currentTenantId: string | null
  addTenant: (tenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt' | 'currentUsers'>) => string
  updateTenant: (id: string, updates: Partial<Omit<Tenant, 'id' | 'createdAt'>>) => void
  deleteTenant: (id: string) => void
  getTenant: (id: string) => Tenant | undefined
  getTenantByCode: (code: string) => Tenant | undefined
  setCurrentTenant: (id: string | null) => void
  getTenantsByStatus: (status: Tenant['status']) => Tenant[]
  getTenantStats: (id: string) => TenantStats
}

// デモ用の初期テナント
const defaultTenants: Tenant[] = [
  {
    id: 'tenant-1',
    code: 'GH-001',
    name: 'Gハウス本店',
    companyName: '株式会社Gハウス',
    representativeName: '山田太郎',
    phone: '052-123-4567',
    email: 'info@ghouse.co.jp',
    address: '愛知県名古屋市中区栄1-1-1',
    prefecture: '愛知県',
    contractDate: '2020-04-01',
    status: 'active',
    plan: 'premium',
    maxUsers: 50,
    currentUsers: 24,
    monthlyFee: 100000,
    notes: '本部直営店',
    createdAt: '2020-04-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tenant-2',
    code: 'GH-002',
    name: 'Gハウス岐阜店',
    companyName: '株式会社岐阜ホームズ',
    representativeName: '佐藤次郎',
    phone: '058-234-5678',
    email: 'info@gifu-homes.co.jp',
    address: '岐阜県岐阜市神田町1-1',
    prefecture: '岐阜県',
    contractDate: '2021-07-01',
    status: 'active',
    plan: 'standard',
    maxUsers: 20,
    currentUsers: 12,
    monthlyFee: 50000,
    notes: null,
    createdAt: '2021-07-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tenant-3',
    code: 'GH-003',
    name: 'Gハウス三重店',
    companyName: '有限会社三重建設',
    representativeName: '鈴木三郎',
    phone: '059-345-6789',
    email: 'info@mie-kensetsu.co.jp',
    address: '三重県津市栄町1-1',
    prefecture: '三重県',
    contractDate: '2022-01-15',
    status: 'active',
    plan: 'basic',
    maxUsers: 10,
    currentUsers: 5,
    monthlyFee: 30000,
    notes: '新規加盟店',
    createdAt: '2022-01-15T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
]

export const useFranchiseStore = create<FranchiseState>()(
  persist(
    (set, get) => ({
      tenants: defaultTenants,
      currentTenantId: 'tenant-1', // デフォルトは本店

      addTenant: (tenant) => {
        const id = `tenant-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        const now = new Date().toISOString()
        const newTenant: Tenant = {
          ...tenant,
          id,
          currentUsers: 0,
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({
          tenants: [...state.tenants, newTenant],
        }))
        return id
      },

      updateTenant: (id, updates) => {
        set((state) => ({
          tenants: state.tenants.map((tenant) =>
            tenant.id === id
              ? { ...tenant, ...updates, updatedAt: new Date().toISOString() }
              : tenant
          ),
        }))
      },

      deleteTenant: (id) => {
        set((state) => ({
          tenants: state.tenants.filter((tenant) => tenant.id !== id),
          currentTenantId:
            state.currentTenantId === id ? null : state.currentTenantId,
        }))
      },

      getTenant: (id) => {
        return get().tenants.find((tenant) => tenant.id === id)
      },

      getTenantByCode: (code) => {
        return get().tenants.find((tenant) => tenant.code === code)
      },

      setCurrentTenant: (id) => {
        set({ currentTenantId: id })
      },

      getTenantsByStatus: (status) => {
        return get().tenants.filter((tenant) => tenant.status === status)
      },

      getTenantStats: (id) => {
        // デモ用のモックデータ
        // 本番環境では実際のデータベースから集計
        const tenant = get().tenants.find((t) => t.id === id)
        if (!tenant) {
          return {
            totalCustomers: 0,
            totalContracts: 0,
            monthlyRevenue: 0,
            lastActivityAt: null,
          }
        }

        // シミュレーション: ユーザー数に基づいてデータを生成
        const baseCustomers = tenant.currentUsers * 10
        const baseContracts = Math.floor(baseCustomers * 0.3)
        const baseRevenue = baseContracts * 3500 // 平均坪単価

        return {
          totalCustomers: baseCustomers + Math.floor(Math.random() * 20),
          totalContracts: baseContracts + Math.floor(Math.random() * 5),
          monthlyRevenue: baseRevenue * 10000,
          lastActivityAt: new Date().toISOString(),
        }
      },
    }),
    {
      name: 'ghouse-franchise',
    }
  )
)
