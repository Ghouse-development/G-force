'use client'

import { useState } from 'react'
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
  FileEdit,
  CheckCircle,
  Clock,
  Send,
} from 'lucide-react'
import type { DocumentStatus } from '@/types/database'

// ステータス設定
const STATUS_CONFIG: Record<DocumentStatus, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  'draft': { label: '下書き', color: 'text-gray-700', bgColor: 'bg-gray-100', icon: FileEdit },
  'submitted': { label: '提出済', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: Send },
  'approved': { label: '承認済', color: 'text-green-700', bgColor: 'bg-green-100', icon: CheckCircle },
  'rejected': { label: '差戻し', color: 'text-red-700', bgColor: 'bg-red-100', icon: Clock },
}

// モックデータ
const mockHandovers = [
  {
    id: '1',
    customer_name: '山田 太郎',
    tei_name: '山田様邸',
    status: 'draft' as DocumentStatus,
    handover_date: null,
    sales_staff_name: '営業 太郎',
    construction_manager_name: '工事 一郎',
    created_at: '2024-12-16T10:00:00Z',
  },
  {
    id: '2',
    customer_name: '佐藤 花子',
    tei_name: '佐藤様邸',
    status: 'submitted' as DocumentStatus,
    handover_date: '2024-12-20',
    sales_staff_name: '営業 次郎',
    construction_manager_name: '工事 二郎',
    created_at: '2024-12-14T09:00:00Z',
  },
  {
    id: '3',
    customer_name: '鈴木 一郎',
    tei_name: '鈴木様邸',
    status: 'approved' as DocumentStatus,
    handover_date: '2024-12-10',
    sales_staff_name: '営業 太郎',
    construction_manager_name: '工事 三郎',
    created_at: '2024-12-05T14:00:00Z',
  },
]

export default function HandoversPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('all')

  const filteredHandovers = mockHandovers.filter((handover) => {
    const matchesSearch =
      handover.tei_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      handover.customer_name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' || handover.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const statusCounts: Record<DocumentStatus | 'all', number> = {
    all: mockHandovers.length,
    draft: mockHandovers.filter(h => h.status === 'draft').length,
    submitted: mockHandovers.filter(h => h.status === 'submitted').length,
    approved: mockHandovers.filter(h => h.status === 'approved').length,
    rejected: mockHandovers.filter(h => h.status === 'rejected').length,
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">引継書</h1>
            <p className="text-gray-500 mt-1">
              営業→工事への引継書を管理
            </p>
          </div>
          <Link href="/handovers/new">
            <Button className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600">
              <Plus className="w-4 h-4 mr-2" />
              新規作成
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
        <div className="space-y-3">
          {filteredHandovers.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">引継書がありません</p>
              </CardContent>
            </Card>
          ) : (
            filteredHandovers.map((handover) => {
              const statusConfig = STATUS_CONFIG[handover.status]
              const StatusIcon = statusConfig.icon

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
                                {handover.tei_name}
                              </h3>
                              <Badge
                                variant="outline"
                                className={`${statusConfig.bgColor} ${statusConfig.color} border-0`}
                              >
                                {statusConfig.label}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span className="flex items-center">
                                <User className="w-3 h-3 mr-1" />
                                {handover.customer_name}
                              </span>
                              {handover.handover_date && (
                                <span className="flex items-center">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  引渡: {new Date(handover.handover_date).toLocaleDateString('ja-JP')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right hidden md:block">
                            <p className="text-xs text-gray-500">営業</p>
                            <p className="font-medium text-gray-900">{handover.sales_staff_name}</p>
                          </div>
                          <div className="text-right hidden md:block">
                            <p className="text-xs text-gray-500">工事</p>
                            <p className="font-medium text-gray-900">{handover.construction_manager_name}</p>
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
      </div>
    </Layout>
  )
}
