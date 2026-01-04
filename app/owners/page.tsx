'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Layout } from '@/components/layout/layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Users, Search, Download, Home, Phone, Calendar, ChevronRight } from 'lucide-react'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { CustomerListSkeleton } from '@/components/ui/skeleton-loaders'
import { exportToCSV, customerExportColumns } from '@/lib/export'
import {
  type OwnerStatus,
  OWNER_STATUS,
  getCurrentFiscalYear,
} from '@/types/database'
import { useCustomerStore } from '@/store'
import { useDemoModeStore, DEMO_CUSTOMERS } from '@/store/demo-store'

export default function OwnersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)
  const fiscalYear = getCurrentFiscalYear()

  useEffect(() => {
    setMounted(true)
  }, [])

  const { customers: realCustomers } = useCustomerStore()
  const { isDemoMode } = useDemoModeStore()

  // デモモードに応じてデータを選択
  const storeCustomers = isDemoMode ? DEMO_CUSTOMERS : realCustomers

  // オーナーのみフィルタリング
  const owners = useMemo(() => {
    return storeCustomers.filter((customer) => {
      const status = customer.pipeline_status as OwnerStatus
      return OWNER_STATUS.includes(status)
    })
  }, [storeCustomers])

  const filteredOwners = owners.filter((customer) => {
    return (
      customer.tei_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.includes(searchQuery)
    )
  })

  // 契約金額合計
  const totalContractAmount = useMemo(() => {
    return owners.reduce((sum, c) => sum + (c.contract_amount || 0), 0)
  }, [owners])

  // 年度別オーナー数
  const ownersByYear = useMemo(() => {
    const byYear: Record<string, number> = {}
    owners.forEach((owner) => {
      if (owner.handover_date) {
        const year = new Date(owner.handover_date).getFullYear()
        byYear[year] = (byYear[year] || 0) + 1
      }
    })
    return byYear
  }, [owners])

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

        <Breadcrumb items={[{ label: 'オーナー' }]} />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">オーナー</h1>
            <span className="text-sm text-gray-500">{owners.length}件</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => exportToCSV(
              filteredOwners as Record<string, unknown>[],
              customerExportColumns,
              `オーナー_${new Date().toISOString().split('T')[0]}.csv`
            )}
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>

        {/* サマリー */}
        <div className="flex items-center gap-4 text-sm">
          <span>合計 <b className="text-lg">¥{(totalContractAmount / 10000).toFixed(0)}万</b></span>
          <span>今期引渡 <b className="text-lg">{ownersByYear[fiscalYear] || 0}</b></span>
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

        {/* オーナーリスト */}
        {filteredOwners.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>{searchQuery ? '該当なし' : 'オーナーなし'}</p>
          </div>
        ) : (
          <div className="bg-white border rounded-lg divide-y">
            {filteredOwners.map((owner) => (
              <Link key={owner.id} href={`/customers/${owner.id}`}>
                <div className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Home className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{owner.tei_name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{owner.name}</span>
                        {owner.phone && (
                          <span className="flex items-center">
                            <Phone className="w-3 h-3 mr-0.5" />
                            {owner.phone}
                          </span>
                        )}
                        {owner.handover_date && (
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-0.5" />
                            {new Date(owner.handover_date).toLocaleDateString('ja-JP')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {owner.contract_amount && (
                      <span className="text-sm font-medium text-gray-700 hidden md:block">
                        ¥{(owner.contract_amount / 10000).toFixed(0)}万
                      </span>
                    )}
                    <Badge className="bg-green-100 text-green-700 border-0 text-xs">オーナー</Badge>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
