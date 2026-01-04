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
          <div className="bg-gray-800 text-white px-4 py-2 rounded-lg text-center text-sm">
            デモモード：サンプルデータを表示中
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
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus className="w-4 h-4 mr-2" />
                新規登録
              </Button>
            </Link>
          </div>
        </div>

        {/* サマリー */}
        <div className="flex flex-wrap items-center gap-6 py-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">契約済（当月）</span>
            <span className="text-xl font-bold text-gray-900">{contractedThisMonth}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">内定</span>
            <span className="text-xl font-bold text-orange-600">{naiteCustomers.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">チャレンジ</span>
            <span className="text-xl font-bold text-gray-900">{challengeCustomers.length}</span>
          </div>
          <div className="hidden md:flex items-center gap-3 text-sm text-gray-500 border-l pl-6">
            <span>遷移率:</span>
            <span>会員→面談 <b className="text-gray-900">{conversionRates.memberToMeeting}%</b></span>
            <span>→申込 <b className="text-gray-900">{conversionRates.meetingToApplication}%</b></span>
            <span>→内定 <b className="text-gray-900">{conversionRates.applicationToDecision}%</b></span>
          </div>
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
              <div className="w-16 h-16 mx-auto mb-4 bg-orange-50 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-orange-400" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">
                {searchQuery ? '検索結果がありません' : 'お客様がまだ登録されていません'}
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                {searchQuery
                  ? '検索条件を変更してお試しください'
                  : '新しいお問い合わせを登録して、お客様管理を始めましょう'
                }
              </p>
              {!searchQuery && (
                <Link href="/customers/new">
                  <Button className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600">
                    <Plus className="w-4 h-4 mr-2" />
                    最初のお客様を登録する
                  </Button>
                </Link>
              )}
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
