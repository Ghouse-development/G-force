'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Layout } from '@/components/layout/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useAuthStore } from '@/store'
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
  Home,
  Building,
  Download,
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
import { OnboardingGuide, HelpButton } from '@/components/help/onboarding-guide'

// 今期の期間を取得
const fiscalYear = getCurrentFiscalYear()
const fiscalYearRange = getFiscalYearRange(fiscalYear)

// パイプラインステージごとの件数（モックデータ）
const pipelineCounts: Record<PipelineStatus, number> = {
  '反響': 5,
  'イベント参加': 3,
  '限定会員': 2,
  '面談': 8,
  '建築申込': 4,
  '内定': 3,
  'ボツ': 2,
  '他決': 1,
  '契約': 6,
  '着工': 4,
  '引渡': 2,
  '引渡済': 8,
}

// 遷移率データ（モックデータ）
const conversionRates = {
  leadToEvent: 60.0,      // 反響→イベント参加
  eventToMember: 66.7,    // イベント参加→限定会員
  memberToMeeting: 100.0, // 限定会員→面談
  meetingToApp: 50.0,     // 面談→建築申込
  appToContract: 75.0,    // 建築申込→契約
  totalConversion: 12.5,  // 反響→契約（全体）
}

// 今期の実績（引渡ベース）
const fiscalYearStats = {
  targetHandovers: 24,     // 目標引渡数
  actualHandovers: 8,      // 実績引渡数
  targetAmount: 960000000, // 目標金額（9.6億）
  actualAmount: 320000000, // 実績金額（3.2億）
}

// 最近の顧客（モックデータ）
const mockRecentCustomers: (Partial<Customer> & { pipeline_status: PipelineStatus })[] = [
  { id: '1', name: '山田 太郎', pipeline_status: '面談', tei_name: '山田様邸', lead_date: '2024-12-15' },
  { id: '2', name: '佐藤 花子', pipeline_status: '建築申込', tei_name: '佐藤様邸', lead_date: '2024-12-14' },
  { id: '3', name: '鈴木 一郎', pipeline_status: '契約', tei_name: '鈴木様邸', lead_date: '2024-12-13' },
  { id: '4', name: '田中 美咲', pipeline_status: '内定', tei_name: '田中様邸', lead_date: '2024-12-12' },
  { id: '5', name: '高橋 健太', pipeline_status: '反響', tei_name: '高橋様邸', lead_date: '2024-12-11' },
]

// 待機中のタスク（モックデータ）
const pendingTasks = {
  planRequests: 3,  // プラン依頼（確認待ち）
  contracts: 2,     // 契約書（承認待ち）
  handovers: 1,     // 引継書（未提出）
}

// ファネルデータ（遷移率グラフ用）
const funnelData = [
  { status: '反響' as PipelineStatus, count: 48, amount: 0 },
  { status: 'イベント参加' as PipelineStatus, count: 32, amount: 0 },
  { status: '限定会員' as PipelineStatus, count: 24, amount: 0 },
  { status: '面談' as PipelineStatus, count: 18, amount: 540000000 },
  { status: '建築申込' as PipelineStatus, count: 10, amount: 400000000 },
  { status: '契約' as PipelineStatus, count: 6, amount: 240000000 },
]

// 期限アラート（モックデータ）
const deadlineItems = [
  {
    id: '1',
    type: 'plan_request' as const,
    title: '山田様邸プラン',
    deadline: new Date(Date.now() - 86400000).toISOString(), // 昨日（期限超過）
    customerName: '山田 太郎',
    href: '/plan-requests/1',
  },
  {
    id: '2',
    type: 'contract' as const,
    title: '佐藤様邸契約書',
    deadline: new Date().toISOString(), // 今日
    customerName: '佐藤 花子',
    href: '/contracts/2',
  },
  {
    id: '3',
    type: 'plan_request' as const,
    title: '鈴木様邸プラン',
    deadline: new Date(Date.now() + 86400000 * 2).toISOString(), // 2日後
    customerName: '鈴木 一郎',
    href: '/plan-requests/3',
  },
  {
    id: '4',
    type: 'handover' as const,
    title: '田中様邸引継書',
    deadline: new Date(Date.now() + 86400000 * 5).toISOString(), // 5日後
    customerName: '田中 美咲',
    href: '/handovers/4',
  },
]

export default function DashboardPage() {
  const { user } = useAuthStore()

  const handoverProgress = (fiscalYearStats.actualHandovers / fiscalYearStats.targetHandovers) * 100
  const amountProgress = (fiscalYearStats.actualAmount / fiscalYearStats.targetAmount) * 100

  // 今日の挨拶
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'おはようございます'
    if (hour < 18) return 'こんにちは'
    return 'おつかれさまです'
  }

  // アクティブパイプラインの合計
  const activePipelineTotal =
    pipelineCounts['反響'] +
    pipelineCounts['イベント参加'] +
    pipelineCounts['限定会員'] +
    pipelineCounts['面談'] +
    pipelineCounts['建築申込'] +
    pipelineCounts['内定']

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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">反響→イベント</span>
                    <span className="font-bold text-blue-600">{conversionRates.leadToEvent}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">イベント→会員</span>
                    <span className="font-bold text-blue-600">{conversionRates.eventToMember}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">面談→申込</span>
                    <span className="font-bold text-blue-600">{conversionRates.meetingToApp}%</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">申込→契約</span>
                    <span className="font-bold text-blue-600">{conversionRates.appToContract}%</span>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">全体契約率</span>
                      <span className="font-bold text-xl text-indigo-600">{conversionRates.totalConversion}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs font-medium">商談中</p>
                  <p className="text-3xl font-bold mt-1">{activePipelineTotal}</p>
                </div>
                <Users className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-yellow-500 text-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-xs font-medium">今期契約</p>
                  <p className="text-3xl font-bold mt-1">{pipelineCounts['契約']}</p>
                </div>
                <FileSignature className="w-8 h-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-green-500 text-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-xs font-medium">着工中</p>
                  <p className="text-3xl font-bold mt-1">{pipelineCounts['着工']}</p>
                </div>
                <Building className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-indigo-500 text-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-xs font-medium">今期引渡</p>
                  <p className="text-3xl font-bold mt-1">{fiscalYearStats.actualHandovers}</p>
                </div>
                <Home className="w-8 h-8 text-purple-200" />
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
                const count = pipelineCounts[status]
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

        {/* ファネルグラフと期限アラート */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PipelineFunnel data={funnelData} title="今期遷移率ファネル" />
          <DeadlineAlerts items={deadlineItems} maxItems={4} />
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

          {/* クイックアクション */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <Plus className="w-5 h-5 mr-2 text-orange-500" />
                クイックアクション
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/customers/new" className="block">
                <Button variant="outline" className="w-full justify-start hover:bg-orange-50 hover:border-orange-300">
                  <UserPlus className="w-4 h-4 mr-3 text-orange-500" />
                  新規反響登録
                </Button>
              </Link>
              <Link href="/plan-requests/new" className="block">
                <Button variant="outline" className="w-full justify-start hover:bg-orange-50 hover:border-orange-300">
                  <FileEdit className="w-4 h-4 mr-3 text-orange-500" />
                  プラン依頼作成
                </Button>
              </Link>
              <Link href="/contracts/new" className="block">
                <Button variant="outline" className="w-full justify-start hover:bg-orange-50 hover:border-orange-300">
                  <FileSignature className="w-4 h-4 mr-3 text-orange-500" />
                  契約書作成
                </Button>
              </Link>
              <Link href="/fund-plans/new" className="block">
                <Button variant="outline" className="w-full justify-start hover:bg-orange-50 hover:border-orange-300">
                  <FileText className="w-4 h-4 mr-3 text-orange-500" />
                  資金計画書作成
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
                  <span className="font-bold text-gray-700">{pipelineCounts['ボツ']}件</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <span className="text-gray-600">他決（競合負け）</span>
                  <span className="font-bold text-red-700">{pipelineCounts['他決']}件</span>
                </div>
                <div className="pt-2 border-t text-center">
                  <p className="text-sm text-gray-500">
                    失注率: {((pipelineCounts['ボツ'] + pipelineCounts['他決']) / (activePipelineTotal + pipelineCounts['契約'] + pipelineCounts['ボツ'] + pipelineCounts['他決']) * 100).toFixed(1)}%
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
            <div className="space-y-3">
              {mockRecentCustomers.map((customer) => {
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
                        <p className="font-semibold text-gray-900">{customer.tei_name}</p>
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
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
