'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Layout } from '@/components/layout/layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users, Search, Plus, Download } from 'lucide-react'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { CustomerListSkeleton } from '@/components/ui/skeleton-loaders'
import { exportToCSV, customerExportColumns } from '@/lib/export'
import {
  type Customer,
  type PipelineStatus,
  type PreContractStatus,
  PRE_CONTRACT_STATUS_ORDER,
  PRE_CONTRACT_LOST,
} from '@/types/database'
import { PipelineKanban } from '@/components/customers/pipeline-kanban'
import { useCustomerStore, useContractStore } from '@/store'
import { useDemoModeStore, DEMO_CUSTOMERS } from '@/store/demo-store'

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

        <Breadcrumb items={[{ label: '契約前' }]} />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">契約前</h1>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-500">{activeCustomers.length}件</span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-400">ボツ {lostCustomers.length}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => exportToCSV(
                filteredCustomers as Record<string, unknown>[],
                customerExportColumns,
                `契約前_${new Date().toISOString().split('T')[0]}.csv`
              )}
            >
              <Download className="w-4 h-4" />
            </Button>
            <Link href="/customers/new">
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                <Plus className="w-4 h-4 mr-1" />
                新規
              </Button>
            </Link>
          </div>
        </div>

        {/* サマリー */}
        <div className="flex items-center gap-4 text-sm">
          <span>契約 <b className="text-lg">{contractedThisMonth}</b></span>
          <span>内定 <b className="text-lg text-orange-600">{naiteCustomers.length}</b></span>
          <span>チャレンジ <b className="text-lg">{challengeCustomers.length}</b></span>
          <span className="hidden md:inline text-gray-400 ml-2">
            遷移: {conversionRates.memberToMeeting}% → {conversionRates.meetingToApplication}% → {conversionRates.applicationToDecision}%
          </span>
        </div>

        {/* 検索 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {/* カンバンビュー */}
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>{searchQuery ? '該当なし' : 'お客様なし'}</p>
          </div>
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
