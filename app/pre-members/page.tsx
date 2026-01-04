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
  Download,
} from 'lucide-react'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { CustomerListSkeleton } from '@/components/ui/skeleton-loaders'
import { exportToCSV, customerExportColumns } from '@/lib/export'
import {
  type Customer,
  type PipelineStatus,
  type PreMemberStatus,
  PIPELINE_CONFIG,
  PRE_MEMBER_STATUS_ORDER,
  getCurrentFiscalYear,
} from '@/types/database'
import { PipelineKanban } from '@/components/customers/pipeline-kanban'
import { useCustomerStore } from '@/store'
import { useDemoModeStore, DEMO_CUSTOMERS } from '@/store/demo-store'

export default function PreMembersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)
  const fiscalYear = getCurrentFiscalYear()

  useEffect(() => {
    setMounted(true)
  }, [])

  const { customers: realCustomers, updateCustomerStatus } = useCustomerStore()
  const { isDemoMode } = useDemoModeStore()

  // デモモードに応じてデータを選択
  const storeCustomers = isDemoMode ? DEMO_CUSTOMERS : realCustomers

  // 限定会員前お客様のみフィルタリング
  const preMemberCustomers = useMemo(() => {
    return storeCustomers.filter((customer) => {
      const status = customer.pipeline_status as PreMemberStatus
      return PRE_MEMBER_STATUS_ORDER.includes(status)
    })
  }, [storeCustomers])

  const filteredCustomers = preMemberCustomers.filter((customer) => {
    const matchesSearch =
      customer.tei_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.includes(searchQuery)

    return matchesSearch
  })

  // ステータスごとの件数
  const statusCounts = useMemo(() => {
    const counts: Record<PreMemberStatus, number> = {} as Record<PreMemberStatus, number>
    for (const status of PRE_MEMBER_STATUS_ORDER) {
      counts[status] = preMemberCustomers.filter(c => c.pipeline_status === status).length
    }
    return counts
  }, [preMemberCustomers])

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
          <div className="bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2">
            <span className="font-medium">デモモード：サンプルデータを表示中</span>
          </div>
        )}

        <Breadcrumb items={[{ label: '限定会員前お客様' }]} />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">限定会員前お客様</h1>
            <p className="text-gray-600 mt-1">
              {fiscalYear}期 | 全{preMemberCustomers.length}件
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => exportToCSV(
                filteredCustomers as Record<string, unknown>[],
                customerExportColumns,
                `限定会員前お客様_${new Date().toISOString().split('T')[0]}.csv`
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

        {/* ステータスサマリー */}
        <div className="flex flex-wrap items-center gap-6 py-2 border-b">
          {PRE_MEMBER_STATUS_ORDER.map((status) => {
            const config = PIPELINE_CONFIG[status]
            return (
              <div key={status} className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{config.label}</span>
                <span className="text-xl font-bold text-gray-900">{statusCounts[status]}</span>
              </div>
            )
          })}
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
              <p className="text-gray-700 text-base">限定会員前お客様がいません</p>
              <p className="text-gray-600 text-sm mt-2">新規登録してください</p>
            </CardContent>
          </Card>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-4">
            <PipelineKanban
              customers={filteredCustomers as Partial<Customer>[]}
              statuses={PRE_MEMBER_STATUS_ORDER as PipelineStatus[]}
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
