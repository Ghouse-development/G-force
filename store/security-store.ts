import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// アクセスログ
export interface AccessLog {
  id: string
  userId: string
  userName: string
  action: 'login' | 'logout' | 'view' | 'create' | 'update' | 'delete' | 'export' | 'failed_login'
  resource: string
  resourceId?: string
  ipAddress?: string
  userAgent?: string
  details?: string
  timestamp: string
}

// ロール権限
export interface RolePermission {
  role: 'admin' | 'manager' | 'staff'
  permissions: {
    customers: { view: boolean; create: boolean; edit: boolean; delete: boolean }
    contracts: { view: boolean; create: boolean; edit: boolean; delete: boolean; approve: boolean }
    loans: { view: boolean; create: boolean; edit: boolean; delete: boolean }
    fundPlans: { view: boolean; create: boolean; edit: boolean; delete: boolean }
    admin: { view: boolean; manageUsers: boolean; manageMasterData: boolean; viewLogs: boolean }
    export: { customers: boolean; contracts: boolean; reports: boolean }
  }
}

// セキュリティ設定
export interface SecuritySettings {
  passwordPolicy: {
    minLength: number
    requireUppercase: boolean
    requireLowercase: boolean
    requireNumbers: boolean
    requireSpecialChars: boolean
    expiryDays: number
  }
  sessionPolicy: {
    timeoutMinutes: number
    maxSessions: number
    rememberMeDays: number
  }
  loginPolicy: {
    maxFailedAttempts: number
    lockoutMinutes: number
    requireTwoFactor: boolean
  }
}

interface SecurityState {
  accessLogs: AccessLog[]
  rolePermissions: RolePermission[]
  settings: SecuritySettings
  addAccessLog: (log: Omit<AccessLog, 'id' | 'timestamp'>) => void
  getAccessLogs: (filters?: { userId?: string; action?: AccessLog['action']; startDate?: string; endDate?: string }) => AccessLog[]
  updateRolePermission: (role: RolePermission['role'], permissions: Partial<RolePermission['permissions']>) => void
  updateSettings: (settings: Partial<SecuritySettings>) => void
  clearOldLogs: (daysToKeep: number) => void
}

// デフォルトのロール権限
const defaultRolePermissions: RolePermission[] = [
  {
    role: 'admin',
    permissions: {
      customers: { view: true, create: true, edit: true, delete: true },
      contracts: { view: true, create: true, edit: true, delete: true, approve: true },
      loans: { view: true, create: true, edit: true, delete: true },
      fundPlans: { view: true, create: true, edit: true, delete: true },
      admin: { view: true, manageUsers: true, manageMasterData: true, viewLogs: true },
      export: { customers: true, contracts: true, reports: true },
    },
  },
  {
    role: 'manager',
    permissions: {
      customers: { view: true, create: true, edit: true, delete: false },
      contracts: { view: true, create: true, edit: true, delete: false, approve: true },
      loans: { view: true, create: true, edit: true, delete: false },
      fundPlans: { view: true, create: true, edit: true, delete: false },
      admin: { view: true, manageUsers: false, manageMasterData: true, viewLogs: true },
      export: { customers: true, contracts: true, reports: true },
    },
  },
  {
    role: 'staff',
    permissions: {
      customers: { view: true, create: true, edit: true, delete: false },
      contracts: { view: true, create: true, edit: false, delete: false, approve: false },
      loans: { view: true, create: true, edit: true, delete: false },
      fundPlans: { view: true, create: true, edit: true, delete: false },
      admin: { view: false, manageUsers: false, manageMasterData: false, viewLogs: false },
      export: { customers: false, contracts: false, reports: false },
    },
  },
]

// デフォルトのセキュリティ設定
const defaultSettings: SecuritySettings = {
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
    expiryDays: 90,
  },
  sessionPolicy: {
    timeoutMinutes: 60,
    maxSessions: 3,
    rememberMeDays: 30,
  },
  loginPolicy: {
    maxFailedAttempts: 5,
    lockoutMinutes: 30,
    requireTwoFactor: false,
  },
}

export const useSecurityStore = create<SecurityState>()(
  persist(
    (set, get) => ({
      accessLogs: [],
      rolePermissions: defaultRolePermissions,
      settings: defaultSettings,

      addAccessLog: (log) => {
        const id = `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        const newLog: AccessLog = {
          ...log,
          id,
          timestamp: new Date().toISOString(),
        }
        set((state) => ({
          accessLogs: [newLog, ...state.accessLogs].slice(0, 10000), // 最大10000件保持
        }))
      },

      getAccessLogs: (filters) => {
        let logs = get().accessLogs

        if (filters?.userId) {
          logs = logs.filter((log) => log.userId === filters.userId)
        }
        if (filters?.action) {
          logs = logs.filter((log) => log.action === filters.action)
        }
        if (filters?.startDate) {
          logs = logs.filter((log) => log.timestamp >= filters.startDate!)
        }
        if (filters?.endDate) {
          logs = logs.filter((log) => log.timestamp <= filters.endDate!)
        }

        return logs
      },

      updateRolePermission: (role, permissions) => {
        set((state) => ({
          rolePermissions: state.rolePermissions.map((rp) =>
            rp.role === role
              ? {
                  ...rp,
                  permissions: {
                    ...rp.permissions,
                    ...Object.fromEntries(
                      Object.entries(permissions).map(([key, value]) => [
                        key,
                        { ...rp.permissions[key as keyof RolePermission['permissions']], ...value },
                      ])
                    ),
                  },
                }
              : rp
          ),
        }))
      },

      updateSettings: (settings) => {
        set((state) => ({
          settings: {
            passwordPolicy: { ...state.settings.passwordPolicy, ...settings.passwordPolicy },
            sessionPolicy: { ...state.settings.sessionPolicy, ...settings.sessionPolicy },
            loginPolicy: { ...state.settings.loginPolicy, ...settings.loginPolicy },
          },
        }))
      },

      clearOldLogs: (daysToKeep) => {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
        const cutoffString = cutoffDate.toISOString()

        set((state) => ({
          accessLogs: state.accessLogs.filter((log) => log.timestamp >= cutoffString),
        }))
      },
    }),
    {
      name: 'ghouse-security',
    }
  )
)
