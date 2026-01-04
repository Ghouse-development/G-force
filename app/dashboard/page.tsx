'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Layout } from '@/components/layout/layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore, useCustomerStore, usePlanRequestStore, useContractStore } from '@/store'
import { useDemoData } from '@/hooks/use-demo-data'
import {
  UserPlus,
  AlertTriangle,
  ChevronRight,
  FileText,
  ClipboardList,
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { DashboardSkeleton } from '@/components/ui/skeleton-loaders'
import { WelcomeGuide } from '@/components/onboarding/welcome-guide'
import {
  type PipelineStatus,
  PIPELINE_CONFIG,
  getCurrentFiscalYear,
} from '@/types/database'

export default function DashboardPage() {
  const { user: authUser } = useAuthStore()
  const { customers: storeCustomers } = useCustomerStore()
  const { planRequests: storePlanRequests } = usePlanRequestStore()
  const { contracts: storeContracts } = useContractStore()

  const { isDemoMode, customers: demoCustomers, contracts: demoContracts, planRequests: demoPlanRequests, user: demoUser } = useDemoData()

  const user = isDemoMode ? demoUser : authUser
  const customers = isDemoMode ? demoCustomers : storeCustomers
  const contracts = isDemoMode ? demoContracts : storeContracts
  const planRequests = isDemoMode ? demoPlanRequests : storePlanRequests

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const fiscalYear = getCurrentFiscalYear()

  // 今期目標
  const fiscalGoals = useMemo(() => ({
    contracts: 12,
    handovers: 10,
  }), [])

  // 自分の担当顧客
  const myCustomers = useMemo(() => {
    if (!mounted || !user?.id) return customers
    return customers.filter(c => c.assigned_to === user.id)
  }, [mounted, customers, user?.id])

  // アラート件数
  const alerts = useMemo(() => {
    if (!mounted) return { overdue: 0, pending: 0, needFollow: 0 }

    const overdue = planRequests.filter(p => {
      if (!p.deadline || p.status === '完了') return false
      return new Date(p.deadline) < new Date()
    }).length

    const pending = contracts.filter(c =>
      c.status === '上長承認待ち' || c.status === '書類確認'
    ).length

    const needFollow = customers.filter(c => {
      if (c.pipeline_status !== '限定会員') return false
      if (!c.updated_at) return false
      const daysSince = Math.floor((Date.now() - new Date(c.updated_at).getTime()) / (1000 * 60 * 60 * 24))
      return daysSince >= 7
    }).length

    return { overdue, pending, needFollow }
  }, [mounted, planRequests, contracts, customers])

  const totalAlerts = alerts.overdue + alerts.pending + alerts.needFollow

  // 今期の実績
  const fiscalStats = useMemo(() => {
    if (!mounted) return { contracts: 0, handovers: 0, active: 0 }

    const contracted = myCustomers.filter(c =>
      ['変更契約前', '変更契約後', 'オーナー'].includes(c.pipeline_status)
    ).length

    const handovers = myCustomers.filter(c => c.pipeline_status === 'オーナー').length

    const active = myCustomers.filter(c =>
      ['限定会員', '面談', '建築申込', 'プラン提出', '内定'].includes(c.pipeline_status)
    ).length

    return { contracts: contracted, handovers, active }
  }, [mounted, myCustomers])

  // パイプライン
  const pipeline = useMemo(() => {
    if (!mounted) return []
    const statuses: PipelineStatus[] = ['限定会員', '面談', '建築申込', 'プラン提出', '内定']
    return statuses.map(status => ({
      status,
      count: myCustomers.filter(c => c.pipeline_status === status).length,
      config: PIPELINE_CONFIG[status],
    }))
  }, [mounted, myCustomers])

  if (!mounted) {
    return <Layout><DashboardSkeleton /></Layout>
  }

  return (
    <Layout>
      <WelcomeGuide />

      <div className="space-y-6 max-w-5xl mx-auto">
        {/* デモバナー */}
        {isDemoMode && (
          <div className="bg-purple-600 text-white px-4 py-2 rounded-lg text-center text-sm font-medium">
            デモモード
          </div>
        )}

        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{user?.name || 'ゲスト'}</h1>
            <p className="text-sm text-gray-500">{fiscalYear}期</p>
          </div>
          <Link href="/customers/new">
            <Button className="bg-orange-500 hover:bg-orange-600">
              <UserPlus className="w-4 h-4 mr-1" />
              新規登録
            </Button>
          </Link>
        </div>

        {/* アラート */}
        {totalAlerts > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="font-medium text-red-700">要対応 {totalAlerts}件</span>
              <span className="text-sm text-red-600">
                {alerts.overdue > 0 && `期限超過${alerts.overdue}`}
                {alerts.pending > 0 && ` 承認待ち${alerts.pending}`}
                {alerts.needFollow > 0 && ` 要フォロー${alerts.needFollow}`}
              </span>
            </div>
            <Link href="/plan-requests">
              <Button variant="ghost" size="sm" className="text-red-600">
                確認 <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        )}

        {/* 目標進捗（コンパクト） */}
        <div className="bg-white border rounded-lg p-4">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-500">契約</span>
                <span className="text-xs text-gray-400">{fiscalStats.contracts}/{fiscalGoals.contracts}</span>
              </div>
              <Progress value={(fiscalStats.contracts / fiscalGoals.contracts) * 100} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-500">引渡</span>
                <span className="text-xs text-gray-400">{fiscalStats.handovers}/{fiscalGoals.handovers}</span>
              </div>
              <Progress value={(fiscalStats.handovers / fiscalGoals.handovers) * 100} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-500">商談中</span>
                <span className="text-xs text-gray-400">{fiscalStats.active}件</span>
              </div>
              <Progress value={Math.min((fiscalStats.active / 20) * 100, 100)} className="h-2" />
            </div>
          </div>
        </div>

        {/* パイプライン */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900">パイプライン</h2>
            <Link href="/customers" className="text-sm text-orange-600 hover:underline">
              すべて見る
            </Link>
          </div>
          <div className="flex gap-2">
            {pipeline.map(({ status, count, config }) => (
              <Link
                key={status}
                href={`/customers?status=${status}`}
                className="flex-1 text-center p-3 rounded-lg border hover:border-orange-300 hover:bg-orange-50/50 transition-colors"
              >
                <div className={`text-2xl font-bold ${config?.color || 'text-gray-600'}`}>
                  {count}
                </div>
                <div className="text-xs text-gray-500 mt-1">{config?.label || status}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* クイックアクション */}
        <div className="grid grid-cols-3 gap-3">
          <Link href="/fund-plans">
            <div className="bg-white border rounded-lg p-4 hover:border-orange-300 hover:bg-orange-50/50 transition-colors flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">資金計画書</div>
                <div className="text-xs text-gray-500">作成・管理</div>
              </div>
            </div>
          </Link>
          <Link href="/plan-requests">
            <div className="bg-white border rounded-lg p-4 hover:border-orange-300 hover:bg-orange-50/50 transition-colors flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">プラン依頼</div>
                <div className="text-xs text-gray-500">設計部へ依頼</div>
              </div>
            </div>
          </Link>
          <Link href="/events">
            <div className="bg-white border rounded-lg p-4 hover:border-orange-300 hover:bg-orange-50/50 transition-colors flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">イベント</div>
                <div className="text-xs text-gray-500">見学会管理</div>
              </div>
            </div>
          </Link>
        </div>

        {/* 最近の顧客 */}
        <div className="bg-white border rounded-lg">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-bold text-gray-900">最近の顧客</h2>
            <Link href="/customers" className="text-sm text-orange-600 hover:underline">
              すべて見る
            </Link>
          </div>
          <div className="divide-y">
            {customers.slice(0, 5).map((customer) => {
              const config = PIPELINE_CONFIG[customer.pipeline_status]
              return (
                <Link key={customer.id} href={`/customers/${customer.id}`}>
                  <div className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-orange-600">{customer.name?.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{customer.tei_name || customer.name}</p>
                        <p className="text-xs text-gray-500">{customer.name}</p>
                      </div>
                    </div>
                    <Badge className={`${config?.bgColor || 'bg-gray-100'} ${config?.color || 'text-gray-600'} border-0 text-xs`}>
                      {config?.label || customer.pipeline_status}
                    </Badge>
                  </div>
                </Link>
              )
            })}
            {customers.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                顧客がいません
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
