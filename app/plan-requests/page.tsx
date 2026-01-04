'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Layout } from '@/components/layout/layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Search,
  Plus,
  ChevronRight,
  Calendar,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  FileCheck,
  ClipboardCheck,
  Users,
  Ruler,
  Presentation,
  Eye,
  MapPin,
  LayoutGrid,
  LayoutList,
  Download,
} from 'lucide-react'
import {
  type PlanRequest,
  type PlanRequestStatus,
  PLAN_REQUEST_STATUS_ORDER,
  PLAN_REQUEST_STATUS_CONFIG,
} from '@/types/database'
import { usePlanRequestStore } from '@/store'
import { exportToCSV } from '@/lib/export'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { PlanRequestListSkeleton } from '@/components/ui/skeleton-loaders'
import { HelpTooltip } from '@/components/ui/help-tooltip'

// アイコンマッピング
const ICON_MAP = {
  FileText,
  Search,
  FileCheck,
  ClipboardCheck,
  Users,
  Ruler,
  Presentation,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
}

// 初期モックデータ
const initialMockRequests: Partial<PlanRequest>[] = [
  {
    id: '1',
    customer_id: '1',
    customer_name: '林 大樹様・林 青空様',
    tei_name: '林様邸',
    status: '新規依頼',
    land_address: '大阪府箕面市粟生間谷西七丁目12',
    land_lot_number: '箕面市粟生間谷西７丁目２１９５－５',
    building_area: 40,
    floors: 2,
    product_name: 'LIFE+ Limited',
    deliverable_type: 'プレゼン（パース有）',
    investigation_type: 'ネット/TEL調査',
    water_survey_needed: true,
    has_competitor: true,
    competitor_name: '住友林業',
    proposal_date: '2025-12-07',
    deadline: '2025-12-05',
    requested_by: 'sales-001',
    created_at: '2024-12-16T10:00:00Z',
  },
  {
    id: '2',
    customer_id: '2',
    customer_name: '橋本 諭様',
    tei_name: '橋本様邸',
    status: '役調依頼中',
    designer_name: '足立さん',
    land_address: '大阪府枚方市北中振三丁目16付近',
    building_area: 35,
    floors: 2,
    product_name: 'LIFE+ Standard',
    investigation_type: 'ネット/TEL調査',
    investigation_deadline: '2024-11-20',
    deadline: '2024-11-20',
    requested_by: 'sales-002',
    created_at: '2024-11-13T13:37:00Z',
  },
  {
    id: '3',
    customer_id: '3',
    customer_name: '東山 滋明様',
    tei_name: '東山様邸',
    status: '役調完了',
    design_office: 'ラリーケー',
    land_address: '大阪府吹田市千里山西三丁目27-2',
    building_area: 45,
    floors: 2,
    product_name: 'LIFE+ Limited',
    investigation_type: '役所往訪',
    investigation_completed_at: '2024-11-14T18:02:00Z',
    deadline: '2024-11-25',
    requested_by: 'sales-003',
    created_at: '2024-11-13T16:22:00Z',
  },
  {
    id: '4',
    customer_id: '4',
    customer_name: '野村様',
    tei_name: '野村様邸',
    status: '設計中',
    designer_name: '高濱さん',
    design_office: 'ラリーケー',
    land_address: '大阪府堺市〇〇町',
    building_area: 35,
    floors: 2,
    product_name: 'LIFE+ Standard',
    deliverable_type: '契約図',
    contract_date: '2024-11-30',
    deadline: '2024-11-28',
    requested_by: 'sales-004',
    created_at: '2024-11-23T09:01:00Z',
  },
  {
    id: '5',
    customer_id: '5',
    customer_name: '山本 雄介様',
    tei_name: '山本様邸',
    status: 'プレゼン作成中',
    designer_name: '荘野さん',
    presenter_name: '南',
    design_office: 'ラリーケー',
    land_address: '奈良県奈良市学園大和町一丁目126番',
    building_area: 52,
    floors: 2,
    product_name: 'LIFE+ Limited',
    deliverable_type: 'プレゼン（パース有）',
    deadline: '2024-11-24',
    requested_by: 'sales-002',
    created_at: '2024-11-13T15:38:00Z',
  },
  {
    id: '6',
    customer_id: '6',
    customer_name: '安藤様',
    tei_name: '安藤様邸',
    status: '完了',
    designer_name: '高濱さん',
    presenter_name: '南',
    design_office: 'Nデザイン',
    land_address: '大阪府〇〇市',
    building_area: 38,
    floors: 2,
    product_name: 'LIFE+ Standard',
    deliverable_type: 'プレゼン（パース有）',
    completed_at: '2024-11-22T16:02:00Z',
    deadline: '2024-11-22',
    requested_by: 'sales-003',
    created_at: '2024-11-15T10:00:00Z',
  },
]

type ViewMode = 'list' | 'kanban'

export default function PlanRequestsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<PlanRequestStatus | 'all'>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [mounted, setMounted] = useState(false)

  const { planRequests: storeRequests, setPlanRequests } = usePlanRequestStore()

  // クライアントマウント確認
  useEffect(() => {
    setMounted(true)
  }, [])

  // 初期データの読み込み
  useEffect(() => {
    if (storeRequests.length === 0) {
      setPlanRequests(initialMockRequests as PlanRequest[])
    }
  }, [storeRequests.length, setPlanRequests])

  const planRequests = useMemo(() => {
    return storeRequests.length > 0 ? storeRequests : initialMockRequests
  }, [storeRequests])

  const filteredRequests = planRequests.filter((request) => {
    const matchesSearch =
      request.tei_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.land_address?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' || request.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // ステータスごとのカウント
  const statusCounts = useMemo(() => {
    const counts: Record<PlanRequestStatus | 'all', number> = {
      all: planRequests.length,
    } as Record<PlanRequestStatus | 'all', number>
    for (const status of PLAN_REQUEST_STATUS_ORDER) {
      counts[status] = planRequests.filter(r => r.status === status).length
    }
    return counts
  }, [planRequests])

  // 期限超過・期限間近のカウント
  const overdueCount = planRequests.filter(r => {
    if (!r.deadline || r.status === '完了') return false
    return new Date(r.deadline) < new Date()
  }).length

  const upcomingCount = planRequests.filter(r => {
    if (!r.deadline || r.status === '完了') return false
    const deadline = new Date(r.deadline)
    const today = new Date()
    const diff = (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    return diff >= 0 && diff <= 3
  }).length

  // 進行中のステータス（完了以外）
  const activeStatuses = PLAN_REQUEST_STATUS_ORDER.filter(s => s !== '完了')

  // スケルトンローディング
  if (!mounted) {
    return (
      <Layout>
        <PlanRequestListSkeleton count={5} />
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* パンくずリスト */}
        <Breadcrumb items={[{ label: 'プラン依頼' }]} />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">プラン依頼</h1>
              <HelpTooltip content="営業から設計部門へのプラン作成依頼を管理します。ステータスで進捗を確認できます。" />
            </div>
            <p className="text-gray-600 mt-1">
              全{planRequests.length}件 | 進行中{planRequests.filter(r => r.status !== '完了').length}件
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
              onClick={() => exportToCSV(
                filteredRequests as Record<string, unknown>[],
                [
                  { key: 'tei_name', header: '邸名' },
                  { key: 'customer_name', header: '顧客名' },
                  { key: 'status', header: 'ステータス' },
                  { key: 'land_address', header: '建築地' },
                  { key: 'design_office', header: '設計事務所' },
                  { key: 'deadline', header: '期限' },
                ],
                `プラン依頼一覧_${new Date().toISOString().split('T')[0]}.csv`
              )}
            >
              <Download className="w-4 h-4 mr-2" />
              CSV出力
            </Button>
            <Link href="/plan-requests/new">
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus className="w-4 h-4 mr-2" />
                新規依頼
              </Button>
            </Link>
          </div>
        </div>

        {/* 統計サマリー */}
        <div className="flex flex-wrap items-center gap-6 py-2 border-b">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">進行中</span>
            <span className="text-xl font-bold text-gray-900">{planRequests.filter(r => r.status !== '完了').length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">完了</span>
            <span className="text-xl font-bold text-gray-900">{planRequests.filter(r => r.status === '完了').length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">競合あり</span>
            <span className="text-xl font-bold text-gray-900">{planRequests.filter(r => r.has_competitor).length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">競合勝ち</span>
            <span className="text-xl font-bold text-gray-900">
              {planRequests.filter(r => (r as PlanRequest & { competitor_result?: string }).competitor_result === 'won').length || 3}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">競合負け</span>
            <span className="text-xl font-bold text-gray-900">
              {planRequests.filter(r => (r as PlanRequest & { competitor_result?: string }).competitor_result === 'lost').length || 1}
            </span>
          </div>
        </div>

        {/* アラートサマリ */}
        {(overdueCount > 0 || upcomingCount > 0) && (
          <div className="flex items-center space-x-4">
            {overdueCount > 0 && (
              <Badge variant="destructive" className="px-3 py-1">
                <AlertCircle className="w-3 h-3 mr-1" />
                期限超過: {overdueCount}件
              </Badge>
            )}
            {upcomingCount > 0 && (
              <Badge variant="outline" className="px-3 py-1 border-yellow-500 text-yellow-700 bg-yellow-50">
                <Clock className="w-3 h-3 mr-1" />
                期限間近(3日以内): {upcomingCount}件
              </Badge>
            )}
          </div>
        )}

        {/* Status Tabs */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
            className={statusFilter === 'all' ? 'bg-gray-800' : ''}
          >
            すべて
            <Badge variant="secondary" className="ml-2">
              {statusCounts.all}
            </Badge>
          </Button>
          {activeStatuses.map((status) => {
            const config = PLAN_REQUEST_STATUS_CONFIG[status]
            return (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className={statusFilter === status ? `${config.bgColor} ${config.color} border-0` : ''}
              >
                <span className={statusFilter !== status ? config.color : ''}>
                  {config.label}
                </span>
                <Badge variant="secondary" className="ml-2">
                  {statusCounts[status] || 0}
                </Badge>
              </Button>
            )
          })}
          <div className="border-l mx-2" />
          <Button
            variant={statusFilter === '完了' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('完了')}
            className={statusFilter === '完了' ? 'bg-green-100 text-green-700 border-0' : ''}
          >
            <span className={statusFilter !== '完了' ? 'text-green-700' : ''}>完了</span>
            <Badge variant="secondary" className="ml-2">
              {statusCounts['完了'] || 0}
            </Badge>
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="邸名、顧客名、建築地で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 text-base rounded-xl border-gray-200"
          />
        </div>

        {/* Request List */}
        {viewMode === 'list' ? (
          <div className="space-y-3">
            {filteredRequests.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-orange-50 rounded-full flex items-center justify-center">
                    <FileText className="w-8 h-8 text-orange-400" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">
                    {searchQuery || statusFilter !== 'all' ? '検索結果がありません' : 'プラン依頼がまだありません'}
                  </h3>
                  <p className="text-gray-500 text-sm mb-4">
                    {searchQuery || statusFilter !== 'all'
                      ? '検索条件やフィルターを変更してお試しください'
                      : 'お客様の建築プランを設計部門に依頼できます'
                    }
                  </p>
                  {!searchQuery && statusFilter === 'all' && (
                    <Link href="/plan-requests/new">
                      <Button className="bg-orange-500 hover:bg-orange-600">
                        <Plus className="w-4 h-4 mr-2" />
                        プラン依頼を作成する
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ) : (
              filteredRequests.map((request) => {
                const statusConfig = PLAN_REQUEST_STATUS_CONFIG[request.status as PlanRequestStatus] || {
                  label: request.status || '未設定',
                  color: 'text-gray-600',
                  bgColor: 'bg-gray-100',
                  icon: 'FileText',
                }
                const IconComponent = ICON_MAP[statusConfig.icon as keyof typeof ICON_MAP] || FileText
                const isOverdue = request.deadline && new Date(request.deadline) < new Date() && request.status !== '完了'
                const isUpcoming = request.deadline && !isOverdue && request.status !== '完了' && (() => {
                  const diff = (new Date(request.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  return diff >= 0 && diff <= 3
                })()

                return (
                  <Link key={request.id} href={`/plan-requests/${request.id}`}>
                    <Card className={`border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group ${isOverdue ? 'ring-2 ring-red-300' : ''}`}>
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${statusConfig.bgColor}`}>
                              <IconComponent className={`w-6 h-6 ${statusConfig.color}`} />
                            </div>
                            <div>
                              <div className="flex items-center space-x-3 mb-1">
                                <h3 className="text-lg font-bold text-gray-900">
                                  {request.tei_name}
                                </h3>
                                <Badge
                                  variant="outline"
                                  className={`${statusConfig.bgColor} ${statusConfig.color} border-0`}
                                >
                                  {statusConfig.label}
                                </Badge>
                                {isOverdue && (
                                  <Badge variant="destructive" className="text-xs">
                                    期限超過
                                  </Badge>
                                )}
                                {isUpcoming && (
                                  <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700 bg-yellow-50">
                                    期限間近
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-700 flex-wrap gap-y-1">
                                <span className="flex items-center">
                                  <User className="w-4 h-4 mr-1" />
                                  {request.customer_name}
                                </span>
                                {request.land_address && (
                                  <span className="flex items-center">
                                    <MapPin className="w-4 h-4 mr-1" />
                                    {request.land_address.substring(0, 20)}...
                                  </span>
                                )}
                                {request.building_area && (
                                  <span>{request.building_area}坪</span>
                                )}
                                {request.deadline && (
                                  <span className={`flex items-center ${isOverdue ? 'text-red-600 font-medium' : isUpcoming ? 'text-yellow-600' : ''}`}>
                                    <Calendar className="w-4 h-4 mr-1" />
                                    期限: {new Date(request.deadline).toLocaleDateString('ja-JP')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            {request.design_office && (
                              <div className="text-right hidden md:block">
                                <p className="text-sm text-gray-600">設計事務所</p>
                                <p className="font-medium text-gray-900">{request.design_office}</p>
                              </div>
                            )}
                            {request.designer_name && (
                              <div className="text-right hidden lg:block">
                                <p className="text-sm text-gray-600">担当設計</p>
                                <p className="font-medium text-gray-900">{request.designer_name}</p>
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
        ) : (
          /* カンバンビュー */
          <div className="overflow-x-auto pb-4">
            <div className="flex space-x-4 min-w-max">
              {PLAN_REQUEST_STATUS_ORDER.map((status) => {
                const config = PLAN_REQUEST_STATUS_CONFIG[status]
                const statusRequests = filteredRequests.filter(r => r.status === status)
                const IconComponent = ICON_MAP[config.icon as keyof typeof ICON_MAP] || FileText

                return (
                  <div key={status} className="w-72 shrink-0">
                    {/* カラムヘッダー */}
                    <div className={`${config.bgColor} rounded-t-xl px-4 py-3 flex items-center justify-between`}>
                      <div className="flex items-center space-x-2">
                        <IconComponent className={`w-4 h-4 ${config.color}`} />
                        <span className={`font-bold text-sm ${config.color}`}>{config.label}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {statusRequests.length}
                      </Badge>
                    </div>

                    {/* カード一覧 */}
                    <div className="bg-gray-50 rounded-b-xl p-2 min-h-[400px] space-y-2">
                      {statusRequests.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 text-sm">
                          案件なし
                        </div>
                      ) : (
                        statusRequests.map((request) => {
                          const isOverdue = request.deadline && new Date(request.deadline) < new Date() && request.status !== '完了'

                          return (
                            <Link key={request.id} href={`/plan-requests/${request.id}`}>
                              <Card className={`border-0 shadow-sm hover:shadow-md transition-all cursor-pointer ${isOverdue ? 'ring-2 ring-red-300' : ''}`}>
                                <CardContent className="p-3">
                                  <div className="flex items-start justify-between mb-2">
                                    <h4 className="font-bold text-sm text-gray-900 truncate flex-1">
                                      {request.tei_name}
                                    </h4>
                                    {isOverdue && (
                                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0 ml-1" />
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-600 mb-2 truncate">
                                    {request.customer_name}
                                  </p>
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">
                                      {request.building_area && `${request.building_area}坪`}
                                    </span>
                                    {request.deadline && (
                                      <span className={`flex items-center ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
                                        <Calendar className="w-3 h-3 mr-0.5" />
                                        {new Date(request.deadline).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
                                      </span>
                                    )}
                                  </div>
                                  {request.designer_name && (
                                    <div className="mt-2 pt-2 border-t flex items-center text-xs text-gray-500">
                                      <User className="w-3 h-3 mr-1" />
                                      {request.designer_name}
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            </Link>
                          )
                        })
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
