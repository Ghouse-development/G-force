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
  type PreMemberStatus,
  PIPELINE_CONFIG,
  PRE_MEMBER_STATUS_ORDER,
} from '@/types/database'
import { PipelineKanban } from '@/components/customers/pipeline-kanban'
import { useCustomerStore } from '@/store'
import { useDemoModeStore, DEMO_CUSTOMERS } from '@/store/demo-store'

export default function PreMembersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)

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

        <Breadcrumb items={[{ label: '限定会員前' }]} />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">限定会員前</h1>
            <span className="text-sm text-gray-500">{preMemberCustomers.length}件</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => exportToCSV(
                filteredCustomers as Record<string, unknown>[],
                customerExportColumns,
                `限定会員前_${new Date().toISOString().split('T')[0]}.csv`
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

        {/* ステータスサマリー */}
        <div className="flex items-center gap-4 text-sm">
          {PRE_MEMBER_STATUS_ORDER.map((status) => (
            <span key={status}>{PIPELINE_CONFIG[status].label} <b className="text-lg">{statusCounts[status]}</b></span>
          ))}
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
