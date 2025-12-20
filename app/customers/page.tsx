'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Layout } from '@/components/layout/layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Search,
  Plus,
  Phone,
  ChevronRight,
  Calendar,
  ArrowRight,
  TrendingUp,
  Download,
  LayoutList,
  LayoutGrid,
} from 'lucide-react'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { CustomerListSkeleton } from '@/components/ui/skeleton-loaders'
import { HelpTooltip, PIPELINE_STATUS_HELP } from '@/components/ui/help-tooltip'
import { exportToCSV, customerExportColumns } from '@/lib/export'
import {
  type Customer,
  type PipelineStatus,
  PIPELINE_CONFIG,
  PIPELINE_ORDER,
  PIPELINE_LOST,
  getCurrentFiscalYear,
} from '@/types/database'
import { PipelineKanban } from '@/components/customers/pipeline-kanban'
import { useCustomerStore } from '@/store'
import { sampleCustomers } from '@/lib/sample-data'
import { Database } from 'lucide-react'
import { toast } from 'sonner'

// モックデータ（パイプライン対応版）- 初期データ用
const initialMockCustomers: Partial<Customer>[] = [
  {
    id: '1',
    name: '山田 太郎',
    tei_name: '山田様邸',
    phone: '090-1234-5678',
    pipeline_status: '面談',
    lead_source: '資料請求',
    lead_date: '2024-12-01',
    meeting_date: '2024-12-10',
    assigned_to: 'sales-001',
    estimated_amount: 35000000,
  },
  {
    id: '2',
    name: '佐藤 花子',
    tei_name: '佐藤様邸',
    phone: '090-2345-6789',
    pipeline_status: '建築申込',
    lead_source: 'モデルハウス見学会予約',
    lead_date: '2024-11-15',
    application_date: '2024-12-15',
    assigned_to: 'sales-001',
    estimated_amount: 42000000,
  },
  {
    id: '3',
    name: '鈴木 一郎',
    tei_name: '鈴木様邸',
    phone: '090-3456-7890',
    pipeline_status: '契約',
    lead_source: 'オーナー紹介',
    lead_date: '2024-10-01',
    contract_date: '2024-12-01',
    contract_amount: 38000000,
    assigned_to: 'sales-001',
  },
  {
    id: '4',
    name: '田中 次郎',
    tei_name: '田中様邸',
    phone: '090-4567-8901',
    pipeline_status: '反響',
    lead_source: 'Instagram',
    lead_date: '2024-12-16',
    assigned_to: 'sales-001',
  },
  {
    id: '5',
    name: '高橋 三郎',
    tei_name: '高橋様邸',
    phone: '090-5678-9012',
    pipeline_status: 'イベント参加',
    lead_source: 'HP問合せ',
    lead_date: '2024-12-10',
    event_date: '2024-12-14',
    assigned_to: 'sales-002',
  },
  {
    id: '6',
    name: '伊藤 四郎',
    tei_name: '伊藤様邸',
    phone: '090-6789-0123',
    pipeline_status: '内定',
    lead_source: '業者紹介',
    lead_date: '2024-09-20',
    decision_date: '2024-12-10',
    estimated_amount: 45000000,
    assigned_to: 'sales-001',
  },
  {
    id: '7',
    name: '渡辺 五郎',
    tei_name: '渡辺様邸',
    phone: '090-7890-1234',
    pipeline_status: '他決',
    lead_source: 'TEL問合せ',
    lead_date: '2024-08-15',
    lost_date: '2024-12-05',
    lost_reason: '他社で建築',
    assigned_to: 'sales-002',
  },
  {
    id: '8',
    name: '小林 六郎',
    tei_name: '小林様邸',
    phone: '090-8901-2345',
    pipeline_status: '着工',
    lead_source: '社員紹介',
    lead_date: '2024-07-01',
    contract_date: '2024-10-01',
    groundbreaking_date: '2024-12-01',
    contract_amount: 40000000,
    assigned_to: 'sales-001',
  },
]

// パイプラインステージごとの件数を計算
function getPipelineCounts(customers: Partial<Customer>[]) {
  const counts: Record<PipelineStatus, number> = {} as Record<PipelineStatus, number>
  for (const status of [...PIPELINE_ORDER, ...PIPELINE_LOST]) {
    counts[status] = customers.filter(c => c.pipeline_status === status).length
  }
  return counts
}

// 遷移率を計算
function calculateConversionRates(customers: Partial<Customer>[]) {
  const total = customers.filter(c => c.lead_date).length
  const meetings = customers.filter(c => c.meeting_date).length
  const applications = customers.filter(c => c.application_date).length
  const contracts = customers.filter(c => c.contract_date).length

  return {
    leadToMeeting: total > 0 ? ((meetings / total) * 100).toFixed(1) : '0',
    meetingToApplication: meetings > 0 ? ((applications / meetings) * 100).toFixed(1) : '0',
    applicationToContract: applications > 0 ? ((contracts / applications) * 100).toFixed(1) : '0',
    total,
  }
}

type ViewMode = 'list' | 'kanban'

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<PipelineStatus | 'all'>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [mounted, setMounted] = useState(false)
  const fiscalYear = getCurrentFiscalYear()

  // クライアントマウント確認
  useEffect(() => {
    setMounted(true)
  }, [])

  const { customers: storeCustomers, setCustomers, addCustomer, updateCustomerStatus } = useCustomerStore()

  // サンプルデータを読み込む
  const handleLoadSampleData = () => {
    let count = 0
    for (const customer of sampleCustomers) {
      // 重複チェック（同じ名前がすでに存在するかどうか）
      const exists = storeCustomers.some(c => c.name === customer.name)
      if (!exists) {
        addCustomer(customer)
        count++
      }
    }
    if (count > 0) {
      toast.success(`${count}件のサンプル顧客データを追加しました`)
    } else {
      toast.info('すでにすべてのサンプルデータが存在します')
    }
  }

  // 初期データの読み込み（ストアが空の場合のみ）
  useEffect(() => {
    if (storeCustomers.length === 0) {
      setCustomers(initialMockCustomers as Customer[])
    }
  }, [storeCustomers.length, setCustomers])

  // ストアのデータを使用（空の場合はモックデータ）
  const customers = useMemo(() => {
    return storeCustomers.length > 0 ? storeCustomers : initialMockCustomers
  }, [storeCustomers])

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.tei_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.includes(searchQuery)

    const matchesStatus =
      selectedStatus === 'all' || customer.pipeline_status === selectedStatus

    return matchesSearch && matchesStatus
  })

  const pipelineCounts = getPipelineCounts(customers as Partial<Customer>[])
  const conversionRates = calculateConversionRates(customers as Partial<Customer>[])

  // アクティブなパイプライン（ボツ・他決・引渡済を除く）
  const activeStatuses: PipelineStatus[] = ['反響', 'イベント参加', '限定会員', '面談', '建築申込', '内定', '契約', '着工', '引渡']

  // スケルトンローディング
  if (!mounted) {
    return (
      <Layout>
        <CustomerListSkeleton count={6} />
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* パンくずリスト */}
        <Breadcrumb items={[{ label: '顧客管理' }]} />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">顧客管理</h1>
            <p className="text-gray-600 mt-1">
              {fiscalYear}期 | 全{customers.length}件の顧客
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* ビュー切り替え */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-white shadow-sm' : ''}
              >
                <LayoutList className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('kanban')}
                className={viewMode === 'kanban' ? 'bg-white shadow-sm' : ''}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={handleLoadSampleData}
            >
              <Database className="w-4 h-4 mr-2" />
              サンプルデータ
            </Button>
            <Button
              variant="outline"
              onClick={() => exportToCSV(
                filteredCustomers as Record<string, unknown>[],
                customerExportColumns,
                `顧客一覧_${new Date().toISOString().split('T')[0]}.csv`
              )}
            >
              <Download className="w-4 h-4 mr-2" />
              CSV出力
            </Button>
            <Link href="/customers/new">
              <Button className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600">
                <Plus className="w-4 h-4 mr-2" />
                新規反響登録
              </Button>
            </Link>
          </div>
        </div>

        {/* 遷移率サマリ */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-800">遷移率</span>
                <HelpTooltip content="各ステージへの遷移率です。反響から契約までの転換率を表示しています。" />
              </div>
              <div className="flex items-center space-x-4 md:space-x-8 text-sm flex-wrap">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-700">反響→面談</span>
                  <span className="font-bold text-blue-600">{conversionRates.leadToMeeting}%</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 hidden md:block" />
                <div className="flex items-center space-x-2">
                  <span className="text-gray-700">面談→申込</span>
                  <span className="font-bold text-blue-600">{conversionRates.meetingToApplication}%</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 hidden md:block" />
                <div className="flex items-center space-x-2">
                  <span className="text-gray-700">申込→契約</span>
                  <span className="font-bold text-blue-600">{conversionRates.applicationToContract}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* パイプラインステージ（横スクロール） */}
        <div className="overflow-x-auto pb-2">
          <div className="flex space-x-2 min-w-max">
            <Button
              variant={selectedStatus === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus('all')}
              className={selectedStatus === 'all' ? 'bg-gray-800' : ''}
            >
              全て ({customers.length})
            </Button>
            {activeStatuses.map((status) => {
              const config = PIPELINE_CONFIG[status]
              const count = pipelineCounts[status]
              return (
                <Button
                  key={status}
                  variant={selectedStatus === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedStatus(status)}
                  className={selectedStatus === status ? `${config.bgColor} ${config.color} border-0` : ''}
                >
                  <span className={selectedStatus !== status ? config.color : ''}>
                    {config.label}
                  </span>
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {count}
                  </Badge>
                </Button>
              )
            })}
            <div className="border-l mx-2" />
            {PIPELINE_LOST.map((status) => {
              const config = PIPELINE_CONFIG[status]
              const count = pipelineCounts[status]
              return (
                <Button
                  key={status}
                  variant={selectedStatus === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedStatus(status)}
                >
                  <span className={config.color}>{config.label}</span>
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {count}
                  </Badge>
                </Button>
              )
            })}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="邸名、顧客名、電話番号で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 text-base rounded-xl border-gray-200"
          />
        </div>

        {/* Customers View */}
        {viewMode === 'kanban' ? (
          /* カンバンビュー */
          <div className="bg-white rounded-xl shadow-lg p-4">
            <PipelineKanban
              customers={filteredCustomers as Partial<Customer>[]}
              onStatusChange={(customerId, newStatus) => {
                updateCustomerStatus(customerId, newStatus)
              }}
            />
          </div>
        ) : (
          /* リストビュー */
          <div className="space-y-3">
            {filteredCustomers.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-12 text-center">
                  <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-700 text-base">顧客が見つかりません</p>
                  <p className="text-gray-600 text-sm mt-2">検索条件を変更してお試しください</p>
                </CardContent>
              </Card>
            ) : (
              filteredCustomers.map((customer) => {
                const statusConfig = PIPELINE_CONFIG[customer.pipeline_status as PipelineStatus]
                return (
                  <Link key={customer.id} href={`/customers/${customer.id}`}>
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-xl flex items-center justify-center shrink-0">
                              <Users className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-3 mb-1">
                                <h3 className="text-lg font-bold text-gray-900">
                                  {customer.tei_name}
                                </h3>
                                <Badge
                                  variant="outline"
                                  className={`${statusConfig?.bgColor} ${statusConfig?.color} border-0`}
                                >
                                  {statusConfig?.label}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-700">
                                <span>{customer.name}</span>
                                {customer.phone && (
                                  <span className="flex items-center">
                                    <Phone className="w-4 h-4 mr-1" />
                                    {customer.phone}
                                  </span>
                                )}
                                {customer.lead_date && (
                                  <span className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    反響: {new Date(customer.lead_date).toLocaleDateString('ja-JP')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            {(customer.estimated_amount || customer.contract_amount) && (
                              <div className="text-right hidden md:block">
                                <p className="text-sm text-gray-600">
                                  {customer.contract_amount ? '契約金額' : '見込金額'}
                                </p>
                                <p className="font-bold text-gray-900">
                                  ¥{((customer.contract_amount || customer.estimated_amount) ?? 0).toLocaleString()}
                                </p>
                              </div>
                            )}
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
