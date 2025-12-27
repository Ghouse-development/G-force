'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Layout } from '@/components/layout/layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore, useCustomerStore, usePlanRequestStore, useContractStore } from '@/store'
import { useDemoData } from '@/hooks/use-demo-data'
import {
  Users,
  FileText,
  UserPlus,
  Clock,
  Calendar,
  FileSignature,
  FileEdit,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Phone,
  ChevronRight,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react'
import { DashboardSkeleton } from '@/components/ui/skeleton-loaders'
import { StagnationAlerts } from '@/components/dashboard/stagnation-alerts'
import {
  type Customer,
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

  // 今日やることリスト
  const todayTasks = useMemo(() => {
    if (!mounted) return []
    const tasks: Array<{
      id: string
      type: 'urgent' | 'warning' | 'normal'
      title: string
      description: string
      count: number
      href: string
      icon: React.ReactNode
    }> = []

    // 期限超過のプラン依頼
    const overduePlans = planRequests.filter(p => {
      if (!p.deadline || p.status === '完了') return false
      return new Date(p.deadline) < new Date()
    })
    if (overduePlans.length > 0) {
      tasks.push({
        id: 'overdue-plans',
        type: 'urgent',
        title: '期限超過のプラン依頼',
        description: '至急対応が必要です',
        count: overduePlans.length,
        href: '/plan-requests',
        icon: <AlertTriangle className="w-5 h-5" />,
      })
    }

    // 承認待ちの契約
    const pendingContracts = contracts.filter(c =>
      c.status === '上長承認待ち' || c.status === '書類確認'
    )
    if (pendingContracts.length > 0 && (user?.role === 'sales_leader' || user?.role === 'sales_manager' || user?.role === 'admin')) {
      tasks.push({
        id: 'pending-contracts',
        type: 'warning',
        title: '承認待ちの契約書',
        description: '確認してください',
        count: pendingContracts.length,
        href: '/contracts',
        icon: <FileSignature className="w-5 h-5" />,
      })
    }

    // 7日以上フォローがない限定会員
    const needFollow = customers.filter(c => {
      if (c.pipeline_status !== '限定会員') return false
      if (!c.updated_at) return false
      const daysSince = Math.floor((Date.now() - new Date(c.updated_at).getTime()) / (1000 * 60 * 60 * 24))
      return daysSince >= 7
    })
    if (needFollow.length > 0) {
      tasks.push({
        id: 'need-follow',
        type: 'normal',
        title: 'フォローが必要なお客様',
        description: '7日以上連絡なし',
        count: needFollow.length,
        href: '/customers',
        icon: <Phone className="w-5 h-5" />,
      })
    }

    // 今週の面談予定
    const thisWeekMeetings = customers.filter(c => {
      if (!c.meeting_date) return false
      const meetingDate = new Date(c.meeting_date)
      const today = new Date()
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
      return meetingDate >= today && meetingDate <= weekFromNow
    })
    if (thisWeekMeetings.length > 0) {
      tasks.push({
        id: 'this-week-meetings',
        type: 'normal',
        title: '今週の面談予定',
        description: '準備を確認しましょう',
        count: thisWeekMeetings.length,
        href: '/customers',
        icon: <Calendar className="w-5 h-5" />,
      })
    }

    return tasks
  }, [mounted, planRequests, contracts, customers, user?.role])

  // 自分の担当顧客
  const myCustomers = useMemo(() => {
    if (!mounted || !user?.id) return customers
    return customers.filter(c => c.assigned_to === user.id)
  }, [mounted, customers, user?.id])

  // パイプライン概要（自分の顧客のみ）
  const pipelineSummary = useMemo(() => {
    if (!mounted) return []
    const statuses: PipelineStatus[] = ['限定会員', '面談', '建築申込', 'プラン提出', '内定']
    return statuses.map(status => {
      const statusCustomers = myCustomers.filter(c => c.pipeline_status === status)
      const count = statusCustomers.length
      const amount = statusCustomers.reduce((sum, c) => sum + (c.estimated_amount || 0), 0)
      const config = PIPELINE_CONFIG[status]
      // 内定の場合は顧客詳細も返す
      const customers = status === '内定' ? statusCustomers : []
      return { status, count, amount, config, customers }
    })
  }, [mounted, myCustomers])

  // 今期の実績（自分の担当のみ）
  const fiscalStats = useMemo(() => {
    if (!mounted) return {
      contracts: 0,
      contractAmount: 0,
      handovers: 0,
      handoverAmount: 0,
      activeCustomers: 0,
      estimatedAmount: 0,
    }

    // 契約済み顧客（変更契約前以降）
    const contractedCustomers = myCustomers.filter(c =>
      ['変更契約前', '変更契約後', 'オーナー'].includes(c.pipeline_status) &&
      c.contract_amount
    )

    // 引渡し済み顧客
    const handoverCustomers = myCustomers.filter(c =>
      c.pipeline_status === 'オーナー' && c.contract_amount
    )

    // 商談中顧客
    const activeCustomers = myCustomers.filter(c =>
      ['限定会員', '面談', '建築申込', 'プラン提出', '内定'].includes(c.pipeline_status)
    )

    return {
      contracts: contractedCustomers.length,
      contractAmount: contractedCustomers.reduce((sum, c) => sum + (c.contract_amount || 0), 0),
      handovers: handoverCustomers.length,
      handoverAmount: handoverCustomers.reduce((sum, c) => sum + (c.contract_amount || 0), 0),
      activeCustomers: activeCustomers.length,
      estimatedAmount: activeCustomers.reduce((sum, c) => sum + (c.estimated_amount || 0), 0),
    }
  }, [mounted, myCustomers])

  // 金額フォーマット（税別・万円）
  const formatAmount = (amount: number) => {
    const man = Math.round(amount / 10000)
    return man.toLocaleString()
  }

  // 挨拶
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'おはようございます'
    if (hour < 18) return 'こんにちは'
    return 'おつかれさまです'
  }

  if (!mounted) {
    return (
      <Layout>
        <DashboardSkeleton />
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* デモモードバナー */}
        {isDemoMode && (
          <div className="bg-purple-600 text-white px-4 py-3 rounded-xl text-center font-medium">
            デモモード：サンプルデータを表示中
          </div>
        )}

        {/* ヘッダー：シンプルに */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {getGreeting()}、{user?.name || 'ゲスト'}さん
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-0.5">
              {new Date().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'long' })}
              <span className="ml-2 text-orange-600 font-medium">{fiscalYear}期</span>
            </p>
          </div>
          <Link href="/customers/new" className="shrink-0">
            <Button size="lg" className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white shadow-lg">
              <UserPlus className="w-5 h-5 mr-2" />
              新規登録
            </Button>
          </Link>
        </div>

        {/* 今日やること：最重要 */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4">
            <h2 className="text-white font-bold text-lg flex items-center">
              <Sparkles className="w-5 h-5 mr-2" />
              今日やること
            </h2>
          </div>
          <CardContent className="p-0">
            {todayTasks.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-3" />
                <p className="font-medium text-gray-900">すべて完了しています！</p>
                <p className="text-gray-600 text-sm mt-1">新しいお客様を登録しましょう</p>
              </div>
            ) : (
              <div className="divide-y">
                {todayTasks.map((task) => (
                  <Link key={task.id} href={task.href}>
                    <div className={`p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                      task.type === 'urgent' ? 'bg-red-50' :
                      task.type === 'warning' ? 'bg-amber-50' : ''
                    }`}>
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          task.type === 'urgent' ? 'bg-red-100 text-red-600' :
                          task.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {task.icon}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-gray-900">{task.title}</span>
                            <Badge className={
                              task.type === 'urgent' ? 'bg-red-500' :
                              task.type === 'warning' ? 'bg-amber-500' :
                              'bg-blue-500'
                            }>
                              {task.count}件
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{task.description}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 今期実績：棟数と金額 */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-3 sm:p-4 text-center">
              <p className="text-blue-100 text-[10px] sm:text-sm">商談中</p>
              <p className="text-2xl sm:text-4xl font-bold mt-0.5 sm:mt-1">{fiscalStats.activeCustomers}<span className="text-base sm:text-lg ml-0.5">件</span></p>
              <p className="text-blue-200 text-[9px] sm:text-xs mt-1">
                {formatAmount(fiscalStats.estimatedAmount)}万円
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-3 sm:p-4 text-center">
              <p className="text-green-100 text-[10px] sm:text-sm">今期契約</p>
              <p className="text-2xl sm:text-4xl font-bold mt-0.5 sm:mt-1">{fiscalStats.contracts}<span className="text-base sm:text-lg ml-0.5">棟</span></p>
              <p className="text-green-200 text-[9px] sm:text-xs mt-1">
                {formatAmount(fiscalStats.contractAmount)}万円（税別）
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-3 sm:p-4 text-center">
              <p className="text-orange-100 text-[10px] sm:text-sm">今期引渡</p>
              <p className="text-2xl sm:text-4xl font-bold mt-0.5 sm:mt-1">{fiscalStats.handovers}<span className="text-base sm:text-lg ml-0.5">棟</span></p>
              <p className="text-orange-200 text-[9px] sm:text-xs mt-1">
                {formatAmount(fiscalStats.handoverAmount)}万円（税別）
              </p>
            </CardContent>
          </Card>
        </div>

        {/* パイプライン：カード形式 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-orange-500" />
              自分のパイプライン
            </h3>
            <Link href="/customers">
              <Button variant="ghost" size="sm" className="text-orange-600">
                すべて見る <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
            {pipelineSummary.map(({ status, count, amount, config, customers: statusCustomers }) => (
              <Link key={status} href={`/customers?status=${status}`}>
                <Card className={`border-0 shadow-md hover:shadow-lg transition-all cursor-pointer h-full ${
                  count > 0 ? '' : 'opacity-50'
                }`}>
                  <CardContent className="p-3 sm:p-4">
                    <div className={`w-10 h-10 rounded-xl ${config?.bgColor || 'bg-gray-100'} flex items-center justify-center mb-2`}>
                      <span className={`text-lg font-bold ${config?.color || 'text-gray-600'}`}>{count}</span>
                    </div>
                    <p className="font-bold text-sm text-gray-900">{config?.label || status}</p>
                    {amount > 0 && (
                      <p className="text-xs text-gray-500 mt-0.5">{formatAmount(amount)}万円</p>
                    )}
                    {/* 内定の場合は契約予定日を表示 */}
                    {status === '内定' && statusCustomers && statusCustomers.length > 0 && (
                      <div className="mt-2 pt-2 border-t space-y-1">
                        {statusCustomers.slice(0, 3).map((c) => (
                          <div key={c.id} className="text-[10px] sm:text-xs">
                            <span className="text-gray-600 truncate block">{c.tei_name || c.name}</span>
                            <span className="text-purple-600 font-medium">
                              {c.contract_date
                                ? new Date(c.contract_date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })
                                : '日程未定'}
                            </span>
                          </div>
                        ))}
                        {statusCustomers.length > 3 && (
                          <p className="text-[10px] text-gray-400">他{statusCustomers.length - 3}件</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* 停滞アラート */}
        <StagnationAlerts customers={customers as Partial<Customer>[]} maxItems={3} />

        {/* クイックアクション：大きなボタン */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <Link href="/fund-plans/new">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer h-full">
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="w-10 h-10 sm:w-14 sm:h-14 mx-auto bg-blue-100 rounded-xl flex items-center justify-center mb-2 sm:mb-3">
                  <FileText className="w-5 h-5 sm:w-7 sm:h-7 text-blue-600" />
                </div>
                <p className="font-bold text-sm sm:text-base text-gray-900">資金計画書</p>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">作成する</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/plan-requests/new">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer h-full">
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="w-10 h-10 sm:w-14 sm:h-14 mx-auto bg-orange-100 rounded-xl flex items-center justify-center mb-2 sm:mb-3">
                  <FileEdit className="w-5 h-5 sm:w-7 sm:h-7 text-orange-600" />
                </div>
                <p className="font-bold text-sm sm:text-base text-gray-900">プラン依頼</p>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">作成する</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/contract-requests/new">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer h-full">
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="w-10 h-10 sm:w-14 sm:h-14 mx-auto bg-green-100 rounded-xl flex items-center justify-center mb-2 sm:mb-3">
                  <FileSignature className="w-5 h-5 sm:w-7 sm:h-7 text-green-600" />
                </div>
                <p className="font-bold text-sm sm:text-base text-gray-900">契約依頼</p>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">作成する</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/handovers/new">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer h-full">
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="w-10 h-10 sm:w-14 sm:h-14 mx-auto bg-purple-100 rounded-xl flex items-center justify-center mb-2 sm:mb-3">
                  <Target className="w-5 h-5 sm:w-7 sm:h-7 text-purple-600" />
                </div>
                <p className="font-bold text-sm sm:text-base text-gray-900">引継書</p>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">作成する</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* 最近の動き：コンパクトに */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-gray-500" />
                最近の動き
              </h3>
              <Link href="/customers">
                <Button variant="ghost" size="sm" className="text-orange-600">
                  すべて見る <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="space-y-2">
              {customers.slice(0, 5).map((customer) => {
                const config = PIPELINE_CONFIG[customer.pipeline_status] || { label: '未設定', bgColor: 'bg-gray-100', color: 'text-gray-600' }
                return (
                  <Link key={customer.id} href={`/customers/${customer.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <span className="font-bold text-orange-600">{customer.name?.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{customer.tei_name || customer.name}</p>
                          <p className="text-xs text-gray-500">{customer.name}</p>
                        </div>
                      </div>
                      <Badge className={`${config.bgColor} ${config.color} border-0`}>
                        {config.label}
                      </Badge>
                    </div>
                  </Link>
                )
              })}
              {customers.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-600">お客様がまだいません</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
