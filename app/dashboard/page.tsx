'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Layout } from '@/components/layout/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useAuthStore, useCustomerStore, usePlanRequestStore, useContractStore } from '@/store'
import {
  Users,
  FileText,
  TrendingUp,
  Target,
  Plus,
  ArrowRight,
  UserPlus,
  Clock,
  Calendar,
  FileSignature,
  FileEdit,
  Download,
  RefreshCw,
} from 'lucide-react'
import {
  type Customer,
  type PipelineStatus,
  PIPELINE_CONFIG,
  getCurrentFiscalYear,
  getFiscalYearRange,
} from '@/types/database'
import { PipelineFunnel } from '@/components/dashboard/pipeline-funnel'
import { DeadlineAlerts } from '@/components/dashboard/deadline-alerts'
import { PendingApprovals } from '@/components/dashboard/pending-approvals'
import { OnboardingGuide, HelpButton } from '@/components/help/onboarding-guide'
import { getSyncState } from '@/lib/db/sync-service'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { customers } = useCustomerStore()
  const { planRequests } = usePlanRequestStore()
  const { contracts } = useContractStore()
  const [mounted, setMounted] = useState(false)
  const [syncState, setSyncState] = useState({ lastSyncAt: null as string | null })

  useEffect(() => {
    setMounted(true)
    setSyncState(getSyncState())
  }, [])

  // 今期の期間を取得
  const fiscalYear = getCurrentFiscalYear()
  const fiscalYearRange = getFiscalYearRange(fiscalYear)

  // パイプラインステージごとの件数（実データから計算）
  const pipelineCounts = useMemo(() => {
    if (!mounted) return {} as Record<PipelineStatus, number>

    const counts: Record<string, number> = {
      '反響': 0,
      'イベント参加': 0,
      '限定会員': 0,
      '面談': 0,
      '建築申込': 0,
      '内定': 0,
      'ボツ': 0,
      '他決': 0,
      '契約': 0,
      '着工': 0,
      '引渡': 0,
      '引渡済': 0,
    }

    customers.forEach(customer => {
      if (customer.pipeline_status) {
        counts[customer.pipeline_status] = (counts[customer.pipeline_status] || 0) + 1
      }
    })

    return counts as Record<PipelineStatus, number>
  }, [customers, mounted])

  // 今期の詳細統計（実データから計算）
  const fiscalYearDetailStats = useMemo(() => {
    if (!mounted) {
      return {
        limitedMembers: 0,
        thisMonthMeetings: 0,
        buildingApplications: 0,
        newContracts: 0,
        newContractsAmount: 0,
        changeContracts: 0,
        changeContractsAmount: 0,
        completedHandovers: 0,
      }
    }

    const now = new Date()
    const thisMonth = now.getMonth()
    const thisYear = now.getFullYear()

    return {
      limitedMembers: customers.filter(c => c.pipeline_status === '限定会員').length,
      thisMonthMeetings: customers.filter(c => {
        if (!c.meeting_date) return false
        const meetingDate = new Date(c.meeting_date)
        return meetingDate.getMonth() === thisMonth && meetingDate.getFullYear() === thisYear
      }).length,
      buildingApplications: customers.filter(c =>
        ['建築申込', '内定', '契約', '着工', '引渡', '引渡済'].includes(c.pipeline_status)
      ).length,
      newContracts: contracts.filter(c => c.status === '契約完了').length,
      newContractsAmount: contracts.reduce((sum, c) =>
        c.status === '契約完了' ? sum + (c.total_amount || 0) : sum, 0
      ),
      changeContracts: 0, // TODO: 変更契約の追跡が必要
      changeContractsAmount: 0,
      completedHandovers: customers.filter(c => c.pipeline_status === '引渡済').length,
    }
  }, [customers, contracts, mounted])

  // 今期の実績（引渡ベース）
  const fiscalYearStats = useMemo(() => {
    const actualHandovers = pipelineCounts['引渡済'] || 0
    const actualAmount = fiscalYearDetailStats.newContractsAmount

    return {
      targetHandovers: 24,     // 目標引渡数（設定可能にする予定）
      actualHandovers,
      targetAmount: 960000000, // 目標金額（9.6億）
      actualAmount,
    }
  }, [pipelineCounts, fiscalYearDetailStats])

  // 遷移率の計算（実データから）
  const conversionRates = useMemo(() => {
    const total = customers.length || 1
    const contracted = pipelineCounts['契約'] || 0
    const limitedMembers = pipelineCounts['限定会員'] || 1
    const applications = pipelineCounts['建築申込'] || 1

    return {
      memberToApp: Math.round((applications / limitedMembers) * 100) || 0,
      appToContract: Math.round((contracted / applications) * 100) || 0,
      memberToContract: Math.round((contracted / limitedMembers) * 100) || 0,
      lecturerToMember: 33.3, // TODO: 講師データの追跡
      lecturerToContract: 8.3,
      totalConversion: Math.round((contracted / total) * 100) || 0,
    }
  }, [customers, pipelineCounts])

  // 最近の顧客（実データから）
  const recentCustomers = useMemo(() => {
    if (!mounted) return []
    return [...customers]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
  }, [customers, mounted])

  // 待機中のタスク（実データから）
  const pendingTasks = useMemo(() => ({
    planRequests: planRequests.filter(p => p.status === '確認待ち').length,
    contracts: contracts.filter(c => c.status === '上長承認待ち' || c.status === '書類確認').length,
    handovers: 0, // TODO: 引継書ストアから取得
  }), [planRequests, contracts])

  // ファネルデータ
  const funnelData = useMemo(() => [
    { status: '反響' as PipelineStatus, count: pipelineCounts['反響'] || 0, amount: 0 },
    { status: 'イベント参加' as PipelineStatus, count: pipelineCounts['イベント参加'] || 0, amount: 0 },
    { status: '限定会員' as PipelineStatus, count: pipelineCounts['限定会員'] || 0, amount: 0 },
    { status: '面談' as PipelineStatus, count: pipelineCounts['面談'] || 0, amount: 0 },
    { status: '建築申込' as PipelineStatus, count: pipelineCounts['建築申込'] || 0, amount: 0 },
    { status: '契約' as PipelineStatus, count: pipelineCounts['契約'] || 0, amount: fiscalYearDetailStats.newContractsAmount },
  ], [pipelineCounts, fiscalYearDetailStats])

  // 期限アラート（実データから）
  const deadlineItems = useMemo(() => {
    const items: Array<{
      id: string
      type: 'plan_request' | 'contract' | 'handover'
      title: string
      deadline: string
      customerName: string
      href: string
    }> = []

    planRequests
      .filter(p => p.deadline && p.status !== '完了')
      .forEach(p => {
        items.push({
          id: p.id,
          type: 'plan_request',
          title: `${p.tei_name || '未設定'}プラン`,
          deadline: p.deadline!,
          customerName: p.customer_name || '',
          href: `/plan-requests/${p.id}`,
        })
      })

    return items.slice(0, 4)
  }, [planRequests])

  const handoverProgress = (fiscalYearStats.actualHandovers / fiscalYearStats.targetHandovers) * 100

  // 今日の挨拶
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'おはようございます'
    if (hour < 18) return 'こんにちは'
    return 'おつかれさまです'
  }

  // アクティブパイプラインの合計
  const activePipelineTotal =
    (pipelineCounts['反響'] || 0) +
    (pipelineCounts['イベント参加'] || 0) +
    (pipelineCounts['限定会員'] || 0) +
    (pipelineCounts['面談'] || 0) +
    (pipelineCounts['建築申込'] || 0) +
    (pipelineCounts['内定'] || 0)

  if (!mounted) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {getGreeting()}、{user?.name || 'ゲスト'}さん
            </h1>
            <p className="text-gray-500 mt-1 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              {new Date().toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
              <span className="mx-2">|</span>
              <span className="text-orange-600 font-medium">{fiscalYear}期</span>
              {syncState.lastSyncAt && (
                <>
                  <span className="mx-2">|</span>
                  <span className="text-xs text-gray-400">
                    最終同期: {new Date(syncState.lastSyncAt).toLocaleTimeString('ja-JP')}
                  </span>
                </>
              )}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <HelpButton />
            <Link href="/customers/new">
              <Button className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600">
                <UserPlus className="w-4 h-4 mr-2" />
                新規反響登録
              </Button>
            </Link>
          </div>
        </div>

        {/* オンボーディングガイド */}
        <OnboardingGuide />

        {/* 今期目標カード */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="flex items-center">
                  <Target className="w-5 h-5 mr-2 text-orange-500" />
                  {fiscalYear}期 引渡目標
                </span>
                <Badge variant="outline" className="text-xs">
                  {fiscalYearRange.start} 〜 {fiscalYearRange.end}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-5xl font-bold text-gray-900">
                    {fiscalYearStats.actualHandovers}
                    <span className="text-2xl text-gray-400 font-normal">
                      / {fiscalYearStats.targetHandovers}件
                    </span>
                  </p>
                </div>
                <p className="text-sm text-gray-500">
                  達成率 <span className="font-bold text-orange-600">{Math.round(handoverProgress)}%</span>
                </p>
              </div>
              <Progress value={handoverProgress} className="h-3" />
              <div className="flex justify-between text-sm text-gray-500">
                <span>あと{fiscalYearStats.targetHandovers - fiscalYearStats.actualHandovers}件で目標達成</span>
                <span className="text-gray-400">
                  金額: ¥{(fiscalYearStats.actualAmount / 100000000).toFixed(1)}億 / ¥{(fiscalYearStats.targetAmount / 100000000).toFixed(1)}億
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 遷移率サマリ */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                パイプライン遷移率
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 mb-2">パイプライン遷移</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">限定会員→建築申込</span>
                    <span className="font-bold text-blue-600">{conversionRates.memberToApp}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">建築申込→契約</span>
                    <span className="font-bold text-blue-600">{conversionRates.appToContract}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">限定会員→契約</span>
                    <span className="font-bold text-emerald-600">{conversionRates.memberToContract}%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 mb-2">講師起点の遷移率</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">講師→限定会員</span>
                    <span className="font-bold text-purple-600">{conversionRates.lecturerToMember}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">講師→契約</span>
                    <span className="font-bold text-purple-600">{conversionRates.lecturerToContract}%</span>
                  </div>
                </div>
                <div className="flex flex-col justify-center items-center bg-white rounded-lg p-3">
                  <span className="text-xs text-gray-500 mb-1">全体契約率</span>
                  <span className="font-bold text-3xl text-indigo-600">{conversionRates.totalConversion}%</span>
                  <span className="text-[10px] text-gray-400">反響→契約</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards - 6つの主要指標 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-5">
              <div className="flex flex-col">
                <p className="text-blue-100 text-base font-medium">限定会員数</p>
                <p className="text-5xl font-bold mt-2">{fiscalYearDetailStats.limitedMembers}</p>
                <p className="text-blue-200 text-sm mt-2">累計</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-cyan-500 to-teal-500 text-white">
            <CardContent className="p-5">
              <div className="flex flex-col">
                <p className="text-cyan-100 text-base font-medium">今月面談数</p>
                <p className="text-5xl font-bold mt-2">{fiscalYearDetailStats.thisMonthMeetings}</p>
                <p className="text-cyan-200 text-sm mt-2">{new Date().getMonth() + 1}月</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white">
            <CardContent className="p-5">
              <div className="flex flex-col">
                <p className="text-amber-100 text-base font-medium">建築申込数</p>
                <p className="text-5xl font-bold mt-2">{fiscalYearDetailStats.buildingApplications}</p>
                <p className="text-amber-200 text-sm mt-2">今期</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-green-600 text-white">
            <CardContent className="p-5">
              <div className="flex flex-col">
                <p className="text-green-100 text-base font-medium">今期請負契約</p>
                <p className="text-4xl font-bold mt-2">{fiscalYearDetailStats.newContracts}<span className="text-xl ml-1">棟</span></p>
                <p className="text-green-200 text-sm mt-2">¥{(fiscalYearDetailStats.newContractsAmount / 100000000).toFixed(2)}億(税別)</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
            <CardContent className="p-5">
              <div className="flex flex-col">
                <p className="text-purple-100 text-base font-medium">今期変更契約</p>
                <p className="text-4xl font-bold mt-2">{fiscalYearDetailStats.changeContracts}<span className="text-xl ml-1">棟</span></p>
                <p className="text-purple-200 text-sm mt-2">¥{(fiscalYearDetailStats.changeContractsAmount / 10000).toLocaleString()}万(税別)</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-rose-500 to-pink-600 text-white">
            <CardContent className="p-5">
              <div className="flex flex-col">
                <p className="text-rose-100 text-base font-medium">今期引渡済</p>
                <p className="text-5xl font-bold mt-2">{fiscalYearDetailStats.completedHandovers}</p>
                <p className="text-rose-200 text-sm mt-2">今期</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* パイプライン概要（横並び） */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-orange-500" />
                パイプライン概要
                <Badge variant="outline" className="ml-2 text-xs">
                  合計 {customers.length}件
                </Badge>
              </span>
              <Link href="/customers">
                <Button variant="ghost" size="sm" className="text-orange-500">
                  詳細を見る
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between overflow-x-auto pb-2">
              {(['反響', 'イベント参加', '限定会員', '面談', '建築申込', '内定', '契約', '着工', '引渡'] as PipelineStatus[]).map((status, index) => {
                const config = PIPELINE_CONFIG[status]
                const count = pipelineCounts[status] || 0
                return (
                  <div key={status} className="flex items-center">
                    <div className="text-center px-3">
                      <div className={`w-12 h-12 rounded-xl ${config.bgColor} flex items-center justify-center mb-2 mx-auto`}>
                        <span className={`text-lg font-bold ${config.color}`}>{count}</span>
                      </div>
                      <p className="text-xs text-gray-600 whitespace-nowrap">{config.label}</p>
                    </div>
                    {index < 8 && (
                      <ArrowRight className="w-4 h-4 text-gray-300 mx-1" />
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* ファネルグラフ・期限アラート・承認待ち */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <PipelineFunnel data={funnelData} title="今期遷移率ファネル" />
          <DeadlineAlerts items={deadlineItems} maxItems={4} />
          <PendingApprovals maxItems={5} />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 待機タスク */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <Clock className="w-5 h-5 mr-2 text-orange-500" />
                対応待ちタスク
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/plan-requests?status=確認待ち" className="block">
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-orange-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <FileEdit className="w-5 h-5 text-orange-500" />
                    <span className="text-gray-700">プラン依頼（確認待ち）</span>
                  </div>
                  <Badge className="bg-orange-100 text-orange-700">{pendingTasks.planRequests}</Badge>
                </div>
              </Link>
              <Link href="/contracts?status=承認待ち" className="block">
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-purple-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <FileSignature className="w-5 h-5 text-purple-500" />
                    <span className="text-gray-700">契約書（承認待ち）</span>
                  </div>
                  <Badge className="bg-purple-100 text-purple-700">{pendingTasks.contracts}</Badge>
                </div>
              </Link>
              <Link href="/handovers?status=draft" className="block">
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-700">引継書（下書き）</span>
                  </div>
                  <Badge className="bg-gray-100 text-gray-700">{pendingTasks.handovers}</Badge>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* クイックアクション - 書類作成 */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <Plus className="w-5 h-5 mr-2 text-orange-500" />
                書類作成
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/fund-plans/new" className="block">
                <Button variant="outline" className="w-full justify-start hover:bg-orange-50 hover:border-orange-300">
                  <FileText className="w-4 h-4 mr-3 text-orange-500" />
                  資金計画書作成
                </Button>
              </Link>
              <Link href="/plan-requests/new" className="block">
                <Button variant="outline" className="w-full justify-start hover:bg-orange-50 hover:border-orange-300">
                  <FileEdit className="w-4 h-4 mr-3 text-orange-500" />
                  新規プラン依頼
                </Button>
              </Link>
              <Link href="/handovers/new" className="block">
                <Button variant="outline" className="w-full justify-start hover:bg-orange-50 hover:border-orange-300">
                  <Download className="w-4 h-4 mr-3 text-orange-500" />
                  引継書作成
                </Button>
              </Link>
              <Link href="/contracts/new" className="block">
                <Button variant="outline" className="w-full justify-start hover:bg-orange-50 hover:border-orange-300">
                  <FileSignature className="w-4 h-4 mr-3 text-orange-500" />
                  請負契約書作成
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* ボツ・他決（今期） */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <TrendingUp className="w-5 h-5 mr-2 text-gray-500" />
                失注分析（今期）
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">ボツ（見込み薄）</span>
                  <span className="font-bold text-gray-700">{pipelineCounts['ボツ'] || 0}件</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <span className="text-gray-600">他決（競合負け）</span>
                  <span className="font-bold text-red-700">{pipelineCounts['他決'] || 0}件</span>
                </div>
                <div className="pt-2 border-t text-center">
                  <p className="text-sm text-gray-500">
                    失注率: {(((pipelineCounts['ボツ'] || 0) + (pipelineCounts['他決'] || 0)) / Math.max(1, activePipelineTotal + (pipelineCounts['契約'] || 0) + (pipelineCounts['ボツ'] || 0) + (pipelineCounts['他決'] || 0)) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 最近の顧客 */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center text-lg">
              <Users className="w-5 h-5 mr-2 text-orange-500" />
              最近の反響
            </CardTitle>
            <Link href="/customers">
              <Button variant="ghost" className="text-orange-500 hover:text-orange-600 hover:bg-orange-50">
                すべて見る
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentCustomers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>まだ顧客データがありません</p>
                <Link href="/customers/new">
                  <Button className="mt-4" variant="outline">
                    <UserPlus className="w-4 h-4 mr-2" />
                    最初の顧客を登録
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCustomers.map((customer) => {
                  const statusConfig = PIPELINE_CONFIG[customer.pipeline_status]
                  return (
                    <Link
                      key={customer.id}
                      href={`/customers/${customer.id}`}
                      className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-xl flex items-center justify-center">
                          <span className="text-lg font-bold text-orange-600">
                            {customer.name?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{customer.tei_name || customer.name}</p>
                          <p className="text-sm text-gray-500">{customer.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge className={`${statusConfig.bgColor} ${statusConfig.color} border-0`}>
                          {statusConfig.label}
                        </Badge>
                        <span className="text-sm text-gray-400">
                          {customer.lead_date && new Date(customer.lead_date).toLocaleDateString('ja-JP')}
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
