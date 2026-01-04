/**
 * Store Index
 *
 * 各ストアを個別ファイルから再エクスポート
 * 1117行 → 個別ファイルに分割
 */

// Auth Store
export { useAuthStore } from './stores/auth'

// UI Store
export { useUIStore } from './stores/ui'

// Notification Store
export {
  useNotificationStore,
  type NotificationType,
  type NotificationCategory,
  type Notification,
} from './stores/notification'

// Fund Plan Store
export {
  useFundPlanStore,
  type FundPlanLockType,
  type FundPlanVersionHistory,
  type StoredFundPlan,
} from './stores/fund-plan'

// Customer Store
export { useCustomerStore } from './stores/customer'

// Plan Request Store
export { usePlanRequestStore } from './stores/plan-request'

// Contract Store
export {
  useContractStore,
  type StoredContract,
} from './stores/contract'

// File Store
export {
  useFileStore,
  type FileCategory,
  type DocumentCategory,
  type StoredFile,
} from './stores/file'

// Handover Store
export {
  useHandoverStore,
  type StoredHandover,
} from './stores/handover'
