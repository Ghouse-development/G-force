'use client'

import { useState, useEffect, useMemo } from 'react'
import { Layout } from '@/components/layout/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Users,
  Search,
  Download,
  FileCheck,
  LayoutGrid,
  ClipboardList,
} from 'lucide-react'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { CustomerListSkeleton } from '@/components/ui/skeleton-loaders'
import { exportToCSV, customerExportColumns } from '@/lib/export'
import {
  type Customer,
  type PipelineStatus,
  type PostContractStatus,
  type ChecklistItemStatus,
  type CustomerChecklistProgress,
  PIPELINE_CONFIG,
  POST_CONTRACT_STATUS_ORDER,
  POST_CONTRACT_CHECKLIST_ITEMS,
  getCurrentFiscalYear,
} from '@/types/database'
import { PipelineKanban } from '@/components/customers/pipeline-kanban'
import { PostContractChecklist } from '@/components/post-contract/post-contract-checklist'
import { useCustomerStore } from '@/store'
import { useDemoModeStore, DEMO_CUSTOMERS } from '@/store/demo-store'

export default function PostContractPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [checklistProgress, setChecklistProgress] = useState<Record<string, CustomerChecklistProgress[]>>({})
  const fiscalYear = getCurrentFiscalYear()

  useEffect(() => {
    setMounted(true)
  }, [])

  const { customers: realCustomers, updateCustomerStatus } = useCustomerStore()
  const { isDemoMode } = useDemoModeStore()

  // デモモードに応じてデータを選択
  const storeCustomers = isDemoMode ? DEMO_CUSTOMERS : realCustomers

  // 契約後お客様のみフィルタリング
  const postContractCustomers = useMemo(() => {
    return storeCustomers.filter((customer) => {
      const status = customer.pipeline_status as PostContractStatus
      return POST_CONTRACT_STATUS_ORDER.includes(status)
    })
  }, [storeCustomers])

  const filteredCustomers = postContractCustomers.filter((customer) => {
    return (
      customer.tei_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.includes(searchQuery)
    )
  })

  // ステータスごとの件数
  const statusCounts = useMemo(() => {
    const counts: Record<PostContractStatus, number> = {} as Record<PostContractStatus, number>
    for (const status of POST_CONTRACT_STATUS_ORDER) {
      counts[status] = postContractCustomers.filter(c => c.pipeline_status === status).length
    }
    return counts
  }, [postContractCustomers])

  // 契約金額合計
  const totalContractAmount = useMemo(() => {
    return postContractCustomers.reduce((sum, c) => sum + (c.contract_amount || 0), 0)
  }, [postContractCustomers])

  // 選択中の顧客
  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerId) return null
    return postContractCustomers.find(c => c.id === selectedCustomerId) || null
  }, [selectedCustomerId, postContractCustomers])

  // チェックリスト進捗更新
  const handleUpdateProgress = (customerId: string) => (itemCode: string, status: ChecklistItemStatus, notes?: string) => {
    setChecklistProgress(prev => {
      const customerProgress = prev[customerId] || []
      const existingIndex = customerProgress.findIndex(p => p.itemCode === itemCode)
      const newProgress: CustomerChecklistProgress = {
        customerId,
        itemCode,
        status,
        notes,
        completedAt: status === 'completed' ? new Date().toISOString() : undefined,
        updatedAt: new Date().toISOString(),
      }

      if (existingIndex >= 0) {
        const updated = [...customerProgress]
        updated[existingIndex] = newProgress
        return { ...prev, [customerId]: updated }
      } else {
        return { ...prev, [customerId]: [...customerProgress, newProgress] }
      }
    })
  }

  // 遅延タスク数を計算
  const overdueTasksCount = useMemo(() => {
    let count = 0
    postContractCustomers.forEach(customer => {
      const contractDate = customer.contract_date ? new Date(customer.contract_date) : null
      if (!contractDate) return

      const progress = checklistProgress[customer.id] || []
      POST_CONTRACT_CHECKLIST_ITEMS.forEach(item => {
        if (!item.isRequired) return
        const p = progress.find(pr => pr.itemCode === item.code)
        if (p?.status === 'completed' || p?.status === 'skipped') return

        if (item.daysFromContract) {
          const targetDate = new Date(contractDate)
          targetDate.setDate(targetDate.getDate() + item.daysFromContract)
          if (targetDate < new Date()) count++
        }
      })
    })
    return count
  }, [postContractCustomers, checklistProgress])

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

        <Breadcrumb items={[{ label: '契約後お客様管理' }]} />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">契約後お客様管理</h1>
            <p className="text-gray-600 mt-1">
              {fiscalYear}期 | 全{postContractCustomers.length}件
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => exportToCSV(
                filteredCustomers as Record<string, unknown>[],
                customerExportColumns,
                `契約後お客様_${new Date().toISOString().split('T')[0]}.csv`
              )}
            >
              <Download className="w-4 h-4 mr-2" />
              CSV出力
            </Button>
          </div>
        </div>

        {/* サマリーカード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 合計契約金額 */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-50 to-amber-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">契約金額合計</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">
                    ¥{totalContractAmount.toLocaleString()}
                  </p>
                </div>
                <FileCheck className="w-10 h-10 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          {/* ステータス別 */}
          {POST_CONTRACT_STATUS_ORDER.map((status) => {
            const config = PIPELINE_CONFIG[status]
            return (
              <Card key={status} className={`${config.bgColor} border-0 shadow-lg`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm ${config.color}`}>{config.label}</p>
                      <p className="text-2xl font-bold mt-1">{statusCounts[status]}</p>
                    </div>
                    <Badge variant="secondary" className="text-lg">
                      {statusCounts[status]}件
                    </Badge>
                  </div>
                </CardContent>
              </Card>
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

        {/* メインコンテンツ */}
        {filteredCustomers.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-700 text-base">契約後お客様がいません</p>
              <p className="text-gray-600 text-sm mt-2">契約が完了すると表示されます</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="kanban" className="space-y-4">
            <TabsList>
              <TabsTrigger value="kanban" className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4" />
                カンバン
              </TabsTrigger>
              <TabsTrigger value="checklist" className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                チェックリスト
                {overdueTasksCount > 0 && (
                  <Badge variant="destructive" className="ml-1 text-[10px] px-1">
                    {overdueTasksCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="kanban">
              <div className="bg-white rounded-xl shadow-lg p-4">
                <PipelineKanban
                  customers={filteredCustomers as Partial<Customer>[]}
                  statuses={POST_CONTRACT_STATUS_ORDER as PipelineStatus[]}
                  onStatusChange={(customerId, newStatus) => {
                    updateCustomerStatus(customerId, newStatus)
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="checklist">
              {/* 顧客選択 */}
              {!selectedCustomerId ? (
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <ClipboardList className="w-5 h-5 text-orange-500" />
                      業務チェックリスト
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">チェックリストを表示する顧客を選択してください</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {filteredCustomers.map(customer => {
                        const progress = checklistProgress[customer.id] || []
                        const completedCount = progress.filter(p =>
                          p.status === 'completed' || p.status === 'skipped'
                        ).length
                        const requiredCount = POST_CONTRACT_CHECKLIST_ITEMS.filter(i => i.isRequired).length
                        const progressPercent = requiredCount > 0
                          ? Math.round((completedCount / requiredCount) * 100)
                          : 0

                        return (
                          <button
                            key={customer.id}
                            onClick={() => setSelectedCustomerId(customer.id)}
                            className="text-left p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors"
                          >
                            <div className="font-medium text-gray-900">{customer.tei_name || customer.name}</div>
                            <div className="text-sm text-gray-500 mt-1">{customer.name}</div>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-400">進捗</span>
                              <Badge variant="secondary">{progressPercent}%</Badge>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* 戻るボタン */}
                  <Button
                    variant="outline"
                    onClick={() => setSelectedCustomerId(null)}
                    className="mb-2"
                  >
                    顧客一覧に戻る
                  </Button>

                  {/* チェックリスト */}
                  {selectedCustomer && (
                    <PostContractChecklist
                      customerId={selectedCustomer.id}
                      customerName={selectedCustomer.tei_name || selectedCustomer.name}
                      contractDate={selectedCustomer.contract_date || undefined}
                      handoverDate={selectedCustomer.handover_date || undefined}
                      progress={checklistProgress[selectedCustomer.id] || []}
                      onUpdateProgress={handleUpdateProgress(selectedCustomer.id)}
                    />
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  )
}
