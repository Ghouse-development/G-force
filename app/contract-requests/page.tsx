'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Layout } from '@/components/layout/layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import {
  FileEdit,
  Plus,
  Search,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Calendar,
  Building,
} from 'lucide-react'
import { useAuthStore } from '@/store'
import type { ContractRequestStatus, UserRole } from '@/types/database'
import { ROLE_CONFIG } from '@/types/database'

// 契約依頼ステータス設定
const CONTRACT_REQUEST_STATUS_CONFIG: Record<ContractRequestStatus, {
  label: string
  color: string
  bgColor: string
  icon: typeof Clock
}> = {
  draft: { label: '下書き', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: FileEdit },
  pending_leader: { label: '営業リーダー確認待ち', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Clock },
  pending_managers: { label: '部門長確認待ち', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: Clock },
  revision: { label: '修正中', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: AlertCircle },
  approved: { label: '承認完了', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle2 },
  rejected: { label: '却下', color: 'text-red-600', bgColor: 'bg-red-100', icon: XCircle },
}

// モック契約依頼データ
interface ContractRequest {
  id: string
  customer_id: string
  customer_name: string
  tei_name: string
  status: ContractRequestStatus
  product_name: string
  total_amount: number
  created_by: string
  created_by_name: string
  created_at: string
  updated_at: string
}

const mockContractRequests: ContractRequest[] = [
  {
    id: '1',
    customer_id: 'cust-001',
    customer_name: '山田 太郎',
    tei_name: '山田様邸',
    status: 'pending_leader',
    product_name: 'LIFE+ Limited',
    total_amount: 42000000,
    created_by: '00000000-0000-0000-0000-000000000101',
    created_by_name: '田畑 美香',
    created_at: '2024-12-15T10:00:00Z',
    updated_at: '2024-12-15T10:00:00Z',
  },
  {
    id: '2',
    customer_id: 'cust-002',
    customer_name: '佐藤 花子',
    tei_name: '佐藤様邸',
    status: 'pending_managers',
    product_name: 'LIFE+ Standard',
    total_amount: 38000000,
    created_by: '00000000-0000-0000-0000-000000000101',
    created_by_name: '田畑 美香',
    created_at: '2024-12-14T14:30:00Z',
    updated_at: '2024-12-15T09:00:00Z',
  },
  {
    id: '3',
    customer_id: 'cust-003',
    customer_name: '鈴木 一郎',
    tei_name: '鈴木様邸',
    status: 'approved',
    product_name: 'LIFE+ Limited',
    total_amount: 45000000,
    created_by: '00000000-0000-0000-0000-000000000101',
    created_by_name: '田畑 美香',
    created_at: '2024-12-10T11:00:00Z',
    updated_at: '2024-12-14T16:00:00Z',
  },
  {
    id: '4',
    customer_id: 'cust-004',
    customer_name: '田中 次郎',
    tei_name: '田中様邸',
    status: 'revision',
    product_name: 'LIFE+ Basic',
    total_amount: 32000000,
    created_by: '00000000-0000-0000-0000-000000000101',
    created_by_name: '田畑 美香',
    created_at: '2024-12-13T09:00:00Z',
    updated_at: '2024-12-15T08:00:00Z',
  },
  {
    id: '5',
    customer_id: 'cust-005',
    customer_name: '高橋 三郎',
    tei_name: '高橋様邸',
    status: 'draft',
    product_name: 'LIFE+ Limited',
    total_amount: 48000000,
    created_by: '00000000-0000-0000-0000-000000000101',
    created_by_name: '田畑 美香',
    created_at: '2024-12-16T10:00:00Z',
    updated_at: '2024-12-16T10:00:00Z',
  },
]

export default function ContractRequestsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<ContractRequestStatus | 'all'>('all')
  const [requests, setRequests] = useState<ContractRequest[]>(mockContractRequests)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // フィルタリング
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const matchesSearch =
        req.tei_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = selectedStatus === 'all' || req.status === selectedStatus
      return matchesSearch && matchesStatus
    })
  }, [requests, searchQuery, selectedStatus])

  // ステータスごとの件数
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: requests.length }
    for (const status of Object.keys(CONTRACT_REQUEST_STATUS_CONFIG)) {
      counts[status] = requests.filter(r => r.status === status).length
    }
    return counts
  }, [requests])

  // ユーザーがアクション可能な依頼を判定
  const canActOnRequest = (req: ContractRequest): boolean => {
    if (!user) return false
    const role = user.role as UserRole

    switch (req.status) {
      case 'draft':
        // 作成者のみ編集可能
        return req.created_by === user.id
      case 'pending_leader':
        // 営業リーダーが承認可能
        return role === 'sales_leader' || role === 'admin'
      case 'pending_managers':
        // 設計部門長・工事部門長が承認可能
        return role === 'design_manager' || role === 'construction_manager' || role === 'admin'
      case 'revision':
        // 作成者が修正可能
        return req.created_by === user.id
      default:
        return false
    }
  }

  if (!mounted) {
    return (
      <Layout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-12 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <Breadcrumb items={[{ label: '契約依頼' }]} />

        {/* ヘッダー */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">契約依頼</h1>
            <p className="text-gray-600 mt-1">
              契約依頼の作成・承認フロー管理
            </p>
          </div>
          <Link href="/contract-requests/new">
            <Button className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600">
              <Plus className="w-4 h-4 mr-2" />
              新規契約依頼
            </Button>
          </Link>
        </div>

        {/* ステータスフィルター */}
        <div className="overflow-x-auto pb-2">
          <div className="flex space-x-2 min-w-max">
            <Button
              variant={selectedStatus === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus('all')}
              className={selectedStatus === 'all' ? 'bg-gray-800' : ''}
            >
              全て ({statusCounts.all})
            </Button>
            {Object.entries(CONTRACT_REQUEST_STATUS_CONFIG).map(([status, config]) => (
              <Button
                key={status}
                variant={selectedStatus === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus(status as ContractRequestStatus)}
                className={selectedStatus === status ? `${config.bgColor} ${config.color} border-0` : ''}
              >
                <config.icon className={`w-3 h-3 mr-1 ${selectedStatus !== status ? config.color : ''}`} />
                <span className={selectedStatus !== status ? config.color : ''}>
                  {config.label}
                </span>
                <Badge variant="secondary" className="ml-2 text-xs">
                  {statusCounts[status] || 0}
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        {/* 検索 */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="邸名、顧客名で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 text-base rounded-xl border-gray-200"
          />
        </div>

        {/* 契約依頼リスト */}
        <div className="space-y-3">
          {filteredRequests.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <FileEdit className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-700 text-base">契約依頼が見つかりません</p>
                <p className="text-gray-600 text-sm mt-2">検索条件を変更するか、新規契約依頼を作成してください</p>
              </CardContent>
            </Card>
          ) : (
            filteredRequests.map((request) => {
              const statusConfig = CONTRACT_REQUEST_STATUS_CONFIG[request.status]
              const canAct = canActOnRequest(request)
              const StatusIcon = statusConfig.icon

              return (
                <Link key={request.id} href={`/contract-requests/${request.id}`}>
                  <Card className={`border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group ${canAct ? 'ring-2 ring-orange-200' : ''}`}>
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
                              {canAct && (
                                <Badge className="bg-orange-500 text-white">
                                  要対応
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-700">
                              <span className="flex items-center">
                                <User className="w-4 h-4 mr-1" />
                                {request.customer_name}
                              </span>
                              <span className="flex items-center">
                                <Building className="w-4 h-4 mr-1" />
                                {request.product_name}
                              </span>
                              <span className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {new Date(request.created_at).toLocaleDateString('ja-JP')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right hidden md:block">
                            <p className="text-sm text-gray-600">契約金額</p>
                            <p className="font-bold text-gray-900">
                              ¥{request.total_amount.toLocaleString()}
                            </p>
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
