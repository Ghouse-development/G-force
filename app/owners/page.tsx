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
  Download,
  Home,
  Phone,
  Calendar,
  ChevronRight,
  Award,
} from 'lucide-react'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { CustomerListSkeleton } from '@/components/ui/skeleton-loaders'
import { exportToCSV, customerExportColumns } from '@/lib/export'
import {
  type OwnerStatus,
  PIPELINE_CONFIG,
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
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-lg">
            <span className="text-lg">🧪</span>
            <span className="font-medium">デモモード：サンプルデータを表示中</span>
          </div>
        )}

        <Breadcrumb items={[{ label: 'オーナー' }]} />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">オーナー</h1>
            <p className="text-gray-600 mt-1">
              引渡済み | 全{owners.length}件
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => exportToCSV(
                filteredOwners as Record<string, unknown>[],
                customerExportColumns,
                `オーナー_${new Date().toISOString().split('T')[0]}.csv`
              )}
            >
              <Download className="w-4 h-4 mr-2" />
              CSV出力
            </Button>
          </div>
        </div>

        {/* サマリーカード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* オーナー数 */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">オーナー数</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {owners.length}件
                  </p>
                </div>
                <Award className="w-10 h-10 text-green-400" />
              </div>
            </CardContent>
          </Card>

          {/* 契約金額合計 */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-50 to-amber-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">契約金額合計</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">
                    ¥{totalContractAmount.toLocaleString()}
                  </p>
                </div>
                <Home className="w-10 h-10 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          {/* 今期引渡 */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{fiscalYear}期引渡</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {ownersByYear[fiscalYear] || 0}件
                  </p>
                </div>
                <Calendar className="w-10 h-10 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 検索 */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="邸名、顧客名、電話番号で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 text-base rounded-xl border-gray-200"
          />
        </div>

        {/* オーナーリスト */}
        {filteredOwners.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-700 text-base">オーナーがいません</p>
              <p className="text-gray-600 text-sm mt-2">引渡が完了するとオーナーとして表示されます</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredOwners.map((owner) => {
              const statusConfig = PIPELINE_CONFIG['オーナー']
              return (
                <Link key={owner.id} href={`/customers/${owner.id}`}>
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                            <Home className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-3 mb-1">
                              <h3 className="text-lg font-bold text-gray-900">
                                {owner.tei_name}
                              </h3>
                              <Badge
                                variant="outline"
                                className={`${statusConfig?.bgColor} ${statusConfig?.color} border-0`}
                              >
                                {statusConfig?.label}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-700">
                              <span>{owner.name}</span>
                              {owner.phone && (
                                <span className="flex items-center">
                                  <Phone className="w-4 h-4 mr-1" />
                                  {owner.phone}
                                </span>
                              )}
                              {owner.handover_date && (
                                <span className="flex items-center">
                                  <Calendar className="w-4 h-4 mr-1" />
                                  引渡: {new Date(owner.handover_date).toLocaleDateString('ja-JP')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          {owner.contract_amount && (
                            <div className="text-right hidden md:block">
                              <p className="text-sm text-gray-600">契約金額</p>
                              <p className="font-bold text-gray-900">
                                ¥{owner.contract_amount.toLocaleString()}
                              </p>
                            </div>
                          )}
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
