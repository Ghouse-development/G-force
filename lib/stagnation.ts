/**
 * 停滞検知モジュール
 *
 * 顧客の進捗が停滞しているかを検知し、アラートを表示する
 */

import {
  type Customer,
  type PreContractStatus,
  PRE_CONTRACT_STATUS_ORDER,
} from '@/types/database'

// ステータスごとの標準滞在日数（これを超えると停滞とみなす）
export const STAGNATION_THRESHOLDS: Record<PreContractStatus, {
  warningDays: number   // 注意レベル
  dangerDays: number    // 危険レベル
  label: string
  recommendedActions: string[]
}> = {
  '限定会員': {
    warningDays: 7,
    dangerDays: 14,
    label: '限定会員',
    recommendedActions: [
      '電話でのフォローアップ',
      '土地情報の送付',
      'イベント案内の送付',
    ],
  },
  '面談': {
    warningDays: 14,
    dangerDays: 30,
    label: '面談',
    recommendedActions: [
      '次回面談日程の調整',
      '土地案内の実施',
      'プラン提案の準備',
    ],
  },
  '建築申込': {
    warningDays: 21,
    dangerDays: 45,
    label: '建築申込',
    recommendedActions: [
      'プラン依頼の確認',
      '資金計画の見直し',
      '土地決定の確認',
    ],
  },
  'プラン提出': {
    warningDays: 14,
    dangerDays: 30,
    label: 'プラン提出',
    recommendedActions: [
      'プラン修正の確認',
      '見積もりの再提示',
      '競合状況の確認',
    ],
  },
  '内定': {
    warningDays: 14,
    dangerDays: 30,
    label: '内定',
    recommendedActions: [
      '契約日程の調整',
      'ローン審査状況の確認',
      '契約書類の準備',
    ],
  },
  'ボツ・他決': {
    warningDays: 9999,
    dangerDays: 9999,
    label: 'ボツ・他決',
    recommendedActions: [],
  },
}

// 停滞レベル
export type StagnationLevel = 'normal' | 'warning' | 'danger'

// 停滞情報
export interface StagnationInfo {
  customerId: string
  customerName: string
  teiName?: string
  currentStatus: PreContractStatus
  daysInStatus: number
  level: StagnationLevel
  recommendedActions: string[]
  lastContactDate?: string
}

/**
 * 顧客の停滞状況を計算
 */
export function calculateStagnation(customer: Partial<Customer>): StagnationInfo | null {
  const status = customer.pipeline_status as PreContractStatus
  if (!PRE_CONTRACT_STATUS_ORDER.includes(status)) {
    return null // 契約前顧客でない場合
  }

  const threshold = STAGNATION_THRESHOLDS[status]
  if (!threshold) return null

  // ステータスに入った日を推定
  let statusEnteredDate: Date | null = null

  switch (status) {
    case '限定会員':
      statusEnteredDate = customer.member_date ? new Date(customer.member_date) : null
      break
    case '面談':
      statusEnteredDate = customer.meeting_date ? new Date(customer.meeting_date) : null
      break
    case '建築申込':
      statusEnteredDate = customer.application_date ? new Date(customer.application_date) : null
      break
    case 'プラン提出':
      // プラン提出日は別途管理が必要。暫定でapplication_dateを使用
      statusEnteredDate = customer.application_date ? new Date(customer.application_date) : null
      break
    case '内定':
      statusEnteredDate = customer.decision_date ? new Date(customer.decision_date) : null
      break
    default:
      break
  }

  // 日付がない場合はupdated_atを使用
  if (!statusEnteredDate && customer.updated_at) {
    statusEnteredDate = new Date(customer.updated_at)
  }

  if (!statusEnteredDate) return null

  const now = new Date()
  const daysInStatus = Math.floor((now.getTime() - statusEnteredDate.getTime()) / (1000 * 60 * 60 * 24))

  let level: StagnationLevel = 'normal'
  if (daysInStatus >= threshold.dangerDays) {
    level = 'danger'
  } else if (daysInStatus >= threshold.warningDays) {
    level = 'warning'
  }

  return {
    customerId: customer.id || '',
    customerName: customer.name || '',
    teiName: customer.tei_name || undefined,
    currentStatus: status,
    daysInStatus,
    level,
    recommendedActions: threshold.recommendedActions,
    lastContactDate: customer.updated_at,
  }
}

/**
 * 複数の顧客から停滞している顧客を抽出
 */
export function findStagnantCustomers(
  customers: Partial<Customer>[],
  minLevel: StagnationLevel = 'warning'
): StagnationInfo[] {
  const results: StagnationInfo[] = []

  for (const customer of customers) {
    const info = calculateStagnation(customer)
    if (!info) continue

    if (minLevel === 'normal' ||
        (minLevel === 'warning' && (info.level === 'warning' || info.level === 'danger')) ||
        (minLevel === 'danger' && info.level === 'danger')) {
      results.push(info)
    }
  }

  // 危険度順（danger > warning）、日数順（長い順）でソート
  return results.sort((a, b) => {
    if (a.level === 'danger' && b.level !== 'danger') return -1
    if (a.level !== 'danger' && b.level === 'danger') return 1
    return b.daysInStatus - a.daysInStatus
  })
}

/**
 * ステータスごとの停滞集計
 */
export function summarizeStagnation(customers: Partial<Customer>[]): {
  status: PreContractStatus
  total: number
  warning: number
  danger: number
}[] {
  const summary: Record<PreContractStatus, { total: number; warning: number; danger: number }> = {} as Record<PreContractStatus, { total: number; warning: number; danger: number }>

  for (const status of PRE_CONTRACT_STATUS_ORDER) {
    summary[status] = { total: 0, warning: 0, danger: 0 }
  }

  for (const customer of customers) {
    const status = customer.pipeline_status as PreContractStatus
    if (!PRE_CONTRACT_STATUS_ORDER.includes(status)) continue

    summary[status].total++

    const info = calculateStagnation(customer)
    if (info) {
      if (info.level === 'warning') summary[status].warning++
      if (info.level === 'danger') summary[status].danger++
    }
  }

  return PRE_CONTRACT_STATUS_ORDER.map(status => ({
    status,
    ...summary[status],
  }))
}
