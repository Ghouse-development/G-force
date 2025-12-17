'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Layout } from '@/components/layout/layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  FileEdit,
  Search,
  Plus,
  ChevronRight,
  Calendar,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import type { PlanRequest, PlanRequestStatus } from '@/types/database'

// ステータス設定
const STATUS_CONFIG: Record<PlanRequestStatus, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  '依頼中': { label: '依頼中', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: Clock },
  '作成中': { label: '作成中', color: 'text-orange-700', bgColor: 'bg-orange-100', icon: FileEdit },
  '確認待ち': { label: '確認待ち', color: 'text-purple-700', bgColor: 'bg-purple-100', icon: AlertCircle },
  '修正依頼': { label: '修正依頼', color: 'text-red-700', bgColor: 'bg-red-100', icon: AlertCircle },
  '完了': { label: '完了', color: 'text-green-700', bgColor: 'bg-green-100', icon: CheckCircle },
}

// モックデータ
const mockPlanRequests: (Partial<PlanRequest> & { customer_name: string; tei_name: string; designer_name?: string })[] = [
  {
    id: '1',
    customer_id: '1',
    customer_name: '山田 太郎',
    tei_name: '山田様邸',
    status: '依頼中',
    land_address: '大阪府豊中市〇〇町1-2-3',
    land_area: 50,
    budget_min: 30000000,
    budget_max: 35000000,
    preferred_rooms: '4LDK',
    deadline: '2024-12-25',
    created_at: '2024-12-16T10:00:00Z',
  },
  {
    id: '2',
    customer_id: '2',
    customer_name: '佐藤 花子',
    tei_name: '佐藤様邸',
    status: '作成中',
    designer_name: '設計 一郎',
    land_address: '大阪府吹田市〇〇町4-5-6',
    land_area: 45,
    budget_min: 35000000,
    budget_max: 42000000,
    preferred_rooms: '3LDK+書斎',
    deadline: '2024-12-20',
    created_at: '2024-12-14T09:00:00Z',
  },
  {
    id: '3',
    customer_id: '3',
    customer_name: '鈴木 一郎',
    tei_name: '鈴木様邸',
    status: '確認待ち',
    designer_name: '設計 二郎',
    land_address: '奈良県奈良市〇〇町7-8-9',
    land_area: 55,
    budget_min: 38000000,
    budget_max: 45000000,
    preferred_rooms: '4LDK+ガレージ',
    deadline: '2024-12-18',
    created_at: '2024-12-10T14:00:00Z',
    completed_at: '2024-12-15T16:00:00Z',
  },
  {
    id: '4',
    customer_id: '4',
    customer_name: '田中 次郎',
    tei_name: '田中様邸',
    status: '完了',
    designer_name: '設計 一郎',
    land_address: '大阪府堺市〇〇町10-11-12',
    land_area: 40,
    budget_min: 28000000,
    budget_max: 32000000,
    preferred_rooms: '3LDK',
    deadline: '2024-12-15',
    created_at: '2024-12-05T11:00:00Z',
    completed_at: '2024-12-12T15:00:00Z',
  },
]

export default function PlanRequestsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<PlanRequestStatus | 'all'>('all')

  const filteredRequests = mockPlanRequests.filter((request) => {
    const matchesSearch =
      request.tei_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.customer_name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' || request.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const statusCounts: Record<PlanRequestStatus | 'all', number> = {
    all: mockPlanRequests.length,
    '依頼中': mockPlanRequests.filter(r => r.status === '依頼中').length,
    '作成中': mockPlanRequests.filter(r => r.status === '作成中').length,
    '確認待ち': mockPlanRequests.filter(r => r.status === '確認待ち').length,
    '修正依頼': mockPlanRequests.filter(r => r.status === '修正依頼').length,
    '完了': mockPlanRequests.filter(r => r.status === '完了').length,
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">プラン依頼</h1>
            <p className="text-gray-500 mt-1">
              設計部へのプラン作成依頼を管理
            </p>
          </div>
          <Link href="/plan-requests/new">
            <Button className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600">
              <Plus className="w-4 h-4 mr-2" />
              新規依頼
            </Button>
          </Link>
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
          {(Object.keys(STATUS_CONFIG) as PlanRequestStatus[]).map((status) => {
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

        {/* Request List */}
        <div className="space-y-3">
          {filteredRequests.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <FileEdit className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">プラン依頼がありません</p>
              </CardContent>
            </Card>
          ) : (
            filteredRequests.map((request) => {
              const statusConfig = STATUS_CONFIG[request.status as PlanRequestStatus]
              const StatusIcon = statusConfig.icon
              const isOverdue = request.deadline && new Date(request.deadline) < new Date() && request.status !== '完了'

              return (
                <Link key={request.id} href={`/plan-requests/${request.id}`}>
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
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span className="flex items-center">
                                <User className="w-3 h-3 mr-1" />
                                {request.customer_name}
                              </span>
                              <span>{request.preferred_rooms}</span>
                              <span>{request.land_area}坪</span>
                              {request.deadline && (
                                <span className={`flex items-center ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                                  <Calendar className="w-3 h-3 mr-1" />
                                  希望: {new Date(request.deadline).toLocaleDateString('ja-JP')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          {request.designer_name && (
                            <div className="text-right hidden md:block">
                              <p className="text-xs text-gray-500">担当設計</p>
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
      </div>
    </Layout>
  )
}
