'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Layout } from '@/components/layout/layout'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { PlanRequestListSkeleton } from '@/components/ui/skeleton-loaders'
import { HelpTooltip } from '@/components/ui/help-tooltip'
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
  FileEdit,
  CheckCircle,
  Clock,
  Send,
  LayoutList,
  LayoutGrid,
  ClipboardList,
} from 'lucide-react'
import { useHandoverStore } from '@/store'
import type { DocumentStatus } from '@/types/database'

// ステータス設定
const STATUS_CONFIG: Record<DocumentStatus, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  'draft': { label: '下書き', color: 'text-gray-700', bgColor: 'bg-gray-100', icon: FileEdit },
  'submitted': { label: '提出済', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: Send },
  'approved': { label: '承認済', color: 'text-green-700', bgColor: 'bg-green-100', icon: CheckCircle },
  'rejected': { label: '差戻し', color: 'text-red-700', bgColor: 'bg-red-100', icon: Clock },
}

type ViewMode = 'list' | 'kanban'

export default function HandoversPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [mounted, setMounted] = useState(false)

  const { handovers } = useHandoverStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  const filteredHandovers = useMemo(() => {
    return handovers.filter((handover) => {
      const matchesSearch =
        (handover.tei_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (handover.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus =
        statusFilter === 'all' || handover.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [handovers, searchQuery, statusFilter])

  const statusCounts = useMemo(() => ({
    all: handovers.length,
    draft: handovers.filter(h => h.status === 'draft').length,
    submitted: handovers.filter(h => h.status === 'submitted').length,
    approved: handovers.filter(h => h.status === 'approved').length,
    rejected: handovers.filter(h => h.status === 'rejected').length,
  }), [handovers])

  const stats = useMemo(() => ({
    total: handovers.length,
    pending: handovers.filter(h => h.status === 'draft' || h.status === 'submitted').length,
    completed: handovers.filter(h => h.status === 'approved').length,
  }), [handovers])

  if (!mounted) {
    return (
      <Layout>
        <PlanRequestListSkeleton count={4} />
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* パンくずリスト */}
        <Breadcrumb items={[{ label: '引継書' }]} />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">引継書</h1>
              <HelpTooltip content="営業から工事への引継書を作成・管理します。契約後、工事開始前に必要な情報を共有します。" />
            </div>
            <p className="text-gray-600 mt-1">
              全{stats.total}件 | 処理中{stats.pending}件 | 完了{stats.completed}件
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
            <Link href="/handovers/new">
              <Button className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600">
                <Plus className="w-4 h-4 mr-2" />
                新規作成
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">全引継書</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">処理中</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">完了</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
          {(Object.keys(STATUS_CONFIG) as DocumentStatus[]).map((status) => {
            const config = STATUS_CONFIG[status]
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
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="邸名、顧客名で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 text-base rounded-xl border-gray-200"
          />
        </div>

        {/* Handovers List */}
        {viewMode === 'list' ? (
          <div className="space-y-3">
            {filteredHandovers.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-orange-50 rounded-full flex items-center justify-center">
                    <FileText className="w-8 h-8 text-orange-400" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">
                    {searchQuery || statusFilter !== 'all' ? '検索結果がありません' : '引継書がまだありません'}
                  </h3>
                  <p className="text-gray-500 text-sm mb-4">
                    {searchQuery || statusFilter !== 'all'
                      ? '検索条件やフィルターを変更してお試しください'
                      : '営業から工事部門への引継書を作成できます'
                    }
                  </p>
                  {!searchQuery && statusFilter === 'all' && (
                    <Link href="/handovers/new">
                      <Button className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600">
                        <Plus className="w-4 h-4 mr-2" />
                        引継書を作成する
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ) : (
              filteredHandovers.map((handover) => {
                const defaultConfig = { label: handover.status || '未設定', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: Clock }
                const statusConfig = STATUS_CONFIG[handover.status] || defaultConfig
                const StatusIcon = statusConfig.icon || Clock

                return (
                  <Link key={handover.id} href={`/handovers/${handover.id}`}>
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${statusConfig.bgColor}`}>
                              <StatusIcon className={`w-6 h-6 ${statusConfig.color}`} />
                            </div>
                            <div>
                              <div className="flex items-center space-x-3 mb-1">
                                <h3 className="text-lg font-bold text-gray-900">
                                  {handover.tei_name || '未設定'}
                                </h3>
                                <Badge
                                  variant="outline"
                                  className={`${statusConfig.bgColor} ${statusConfig.color} border-0`}
                                >
                                  {statusConfig.label}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-700">
                                <span className="flex items-center">
                                  <User className="w-4 h-4 mr-1" />
                                  {handover.customer_name || '未設定'}
                                </span>
                                {handover.schedule_notes && (
                                  <span className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    {handover.schedule_notes}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right hidden md:block">
                              <p className="text-sm text-gray-600">営業</p>
                              <p className="font-medium text-gray-900">{handover.from_user_name || '-'}</p>
                            </div>
                            <div className="text-right hidden md:block">
                              <p className="text-sm text-gray-600">工事</p>
                              <p className="font-medium text-gray-900">{handover.to_user_name || '-'}</p>
                            </div>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {(Object.keys(STATUS_CONFIG) as DocumentStatus[]).map((status) => {
              const config = STATUS_CONFIG[status]
              const StatusIcon = config.icon
              const statusHandovers = filteredHandovers.filter(h => h.status === status)

              return (
                <div key={status} className="space-y-3">
                  <div className={`flex items-center space-x-2 p-3 rounded-lg ${config.bgColor}`}>
                    <StatusIcon className={`w-5 h-5 ${config.color}`} />
                    <span className={`font-semibold ${config.color}`}>{config.label}</span>
                    <Badge variant="secondary">{statusHandovers.length}</Badge>
                  </div>
                  <div className="space-y-2 min-h-[200px]">
                    {statusHandovers.map((handover) => (
                      <Link key={handover.id} href={`/handovers/${handover.id}`}>
                        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                          <CardContent className="p-4">
                            <h4 className="font-semibold text-gray-900 mb-1">
                              {handover.tei_name || '未設定'}
                            </h4>
                            <p className="text-sm text-gray-700 mb-2">
                              {handover.customer_name || '未設定'}
                            </p>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>{handover.from_user_name || '-'}</span>
                              <span>→</span>
                              <span>{handover.to_user_name || '-'}</span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                    {statusHandovers.length === 0 && (
                      <div className="text-center py-8 text-gray-600 text-sm">
                        データなし
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
