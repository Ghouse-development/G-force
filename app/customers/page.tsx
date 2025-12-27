'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Layout } from '@/components/layout/layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Users,
  Search,
  Plus,
  Download,
  TrendingUp,
  ArrowRight,
  Target,
} from 'lucide-react'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { CustomerListSkeleton } from '@/components/ui/skeleton-loaders'
import { exportToCSV, customerExportColumns } from '@/lib/export'
import {
  type Customer,
  type PipelineStatus,
  type PreContractStatus,
  PRE_CONTRACT_STATUS_ORDER,
  PRE_CONTRACT_LOST,
  getCurrentFiscalYear,
} from '@/types/database'
import { PipelineKanban } from '@/components/customers/pipeline-kanban'
import { useCustomerStore, useContractStore } from '@/store'
import { useDemoModeStore, DEMO_CUSTOMERS } from '@/store/demo-store'
import { FileSignature } from 'lucide-react'

// 遷移率を計算
function calculateConversionRates(customers: Partial<Customer>[]) {
  const members = customers.filter(c => c.pipeline_status === '限定会員' || c.meeting_date).length
  const meetings = customers.filter(c => c.meeting_date).length
  const applications = customers.filter(c => c.application_date).length
  const decisions = customers.filter(c => c.decision_date).length

  return {
    memberToMeeting: members > 0 ? ((meetings / members) * 100).toFixed(1) : '0',
    meetingToApplication: meetings > 0 ? ((applications / meetings) * 100).toFixed(1) : '0',
    applicationToDecision: applications > 0 ? ((decisions / applications) * 100).toFixed(1) : '0',
    total: customers.length,
  }
}

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)
  const fiscalYear = getCurrentFiscalYear()

  useEffect(() => {
    setMounted(true)
  }, [])

  const { customers: realCustomers, updateCustomerStatus, challengeCustomerIds } = useCustomerStore()
  const { contracts } = useContractStore()
  const { isDemoMode } = useDemoModeStore()

  // 今月の契約済み件数を計算
  const contractedThisMonth = useMemo(() => {
    const now = new Date()
    const thisMonth = now.getMonth()
    const thisYear = now.getFullYear()
    return contracts.filter(c => {
      if (!c.contract_date || c.status !== '契約完了') return false
      const contractDate = new Date(c.contract_date)
      return contractDate.getMonth() === thisMonth && contractDate.getFullYear() === thisYear
    }).length
  }, [contracts])

  // デモモードに応じてデータを選択
  const storeCustomers = isDemoMode ? DEMO_CUSTOMERS : realCustomers

  // 契約前顧客のみフィルタリング（ボツ・他決含む）
  const preContractCustomers = useMemo(() => {
    const allStatuses = [...PRE_CONTRACT_STATUS_ORDER, ...PRE_CONTRACT_LOST]
    return storeCustomers.filter((customer) => {
      const status = customer.pipeline_status as PreContractStatus
      return allStatuses.includes(status)
    })
  }, [storeCustomers])

  // アクティブな顧客（ボツ・他決以外）
  const activeCustomers = useMemo(() => {
    return preContractCustomers.filter(c => !PRE_CONTRACT_LOST.includes(c.pipeline_status as PreContractStatus))
  }, [preContractCustomers])

  // ボツ・他決顧客
  const lostCustomers = useMemo(() => {
    return preContractCustomers.filter(c => PRE_CONTRACT_LOST.includes(c.pipeline_status as PreContractStatus))
  }, [preContractCustomers])

  // チャレンジ顧客（契約前顧客のうちチャレンジフラグが立っているもの）
  const challengeCustomers = useMemo(() => {
    return preContractCustomers.filter(c => challengeCustomerIds.includes(c.id))
  }, [preContractCustomers, challengeCustomerIds])

  // 内定顧客（契約日が決まっている）
  const naiteCustomers = useMemo(() => {
    return preContractCustomers.filter(c => c.pipeline_status === '内定')
  }, [preContractCustomers])

  const filteredCustomers = preContractCustomers.filter((customer) => {
    return (
      customer.tei_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.includes(searchQuery)
    )
  })

  const conversionRates = calculateConversionRates(activeCustomers as Partial<Customer>[])

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
        {/* Demo Mode Banner */}
        {isDemoMode && (
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-lg">
            <span className="text-lg">🧪</span>
            <span className="font-medium">デモモード：サンプルデータを表示中</span>
          </div>
        )}

        <Breadcrumb items={[{ label: '契約前お客様管理' }]} />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">契約前お客様管理</h1>
            <p className="text-gray-600 mt-1">
              {fiscalYear}期 | アクティブ {activeCustomers.length}件 / ボツ・他決 {lostCustomers.length}件
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => exportToCSV(
                filteredCustomers as Record<string, unknown>[],
                customerExportColumns,
                `契約前お客様_${new Date().toISOString().split('T')[0]}.csv`
              )}
            >
              <Download className="w-4 h-4 mr-2" />
              CSV出力
            </Button>
            <Link href="/customers/new">
              <Button className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600">
                <Plus className="w-4 h-4 mr-2" />
                新規登録
              </Button>
            </Link>
          </div>
        </div>

        {/* 当月契約予測サマリ */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-600 font-medium">契約済（当月）</p>
                  <p className="text-2xl font-bold text-blue-700">{contractedThisMonth}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileSignature className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-r from-emerald-50 to-green-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-emerald-600 font-medium">内定</p>
                  <p className="text-2xl font-bold text-emerald-700">{naiteCustomers.length}</p>
                </div>
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-50 to-amber-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-orange-600 font-medium">チャレンジ</p>
                  <p className="text-2xl font-bold text-orange-700">{challengeCustomers.length}</p>
                </div>
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Target className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-violet-50 md:col-span-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-gray-800 text-sm">遷移率</span>
                </div>
                <div className="flex items-center space-x-3 text-xs flex-wrap">
                  <div className="flex items-center space-x-1">
                    <span className="text-gray-600">会員→面談</span>
                    <span className="font-bold text-purple-600">{conversionRates.memberToMeeting}%</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-gray-400 hidden md:block" />
                  <div className="flex items-center space-x-1">
                    <span className="text-gray-600">面談→申込</span>
                    <span className="font-bold text-purple-600">{conversionRates.meetingToApplication}%</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-gray-400 hidden md:block" />
                  <div className="flex items-center space-x-1">
                    <span className="text-gray-600">申込→内定</span>
                    <span className="font-bold text-purple-600">{conversionRates.applicationToDecision}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 検索 */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="邸名、お客様名、電話番号で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 text-base rounded-xl border-gray-200"
          />
        </div>

        {/* カンバンビュー */}
        {filteredCustomers.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-700 text-base">契約前お客様がいません</p>
              <p className="text-gray-600 text-sm mt-2">新規登録してください</p>
            </CardContent>
          </Card>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-4">
            <PipelineKanban
              customers={filteredCustomers as Partial<Customer>[]}
              statuses={[...PRE_CONTRACT_STATUS_ORDER, ...PRE_CONTRACT_LOST] as PipelineStatus[]}
              onStatusChange={(customerId, newStatus) => {
                updateCustomerStatus(customerId, newStatus)
              }}
            />
          </div>
        )}
      </div>
    </Layout>
  )
}
