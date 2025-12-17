'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Layout } from '@/components/layout/layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  FileSignature,
  Search,
  Plus,
  ChevronRight,
  Calendar,
  User,
  FileEdit,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react'
import type { ContractStatus } from '@/types/database'

// ステータス設定
const STATUS_CONFIG: Record<ContractStatus, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  '作成中': { label: '作成中', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: FileEdit },
  '確認中': { label: '確認中', color: 'text-orange-700', bgColor: 'bg-orange-100', icon: Clock },
  '承認待ち': { label: '承認待ち', color: 'text-purple-700', bgColor: 'bg-purple-100', icon: AlertCircle },
  '締結済': { label: '締結済', color: 'text-green-700', bgColor: 'bg-green-100', icon: CheckCircle },
}

// モックデータ
const mockContracts = [
  {
    id: '1',
    customer_name: '山田 太郎',
    tei_name: '山田様邸',
    status: '作成中' as ContractStatus,
    contract_number: null,
    contract_date: null,
    contract_amount: 38000000,
    created_at: '2024-12-16T10:00:00Z',
  },
  {
    id: '2',
    customer_name: '佐藤 花子',
    tei_name: '佐藤様邸',
    status: '確認中' as ContractStatus,
    contract_number: 'C-2024-002',
    contract_date: null,
    contract_amount: 42000000,
    created_at: '2024-12-14T09:00:00Z',
  },
  {
    id: '3',
    customer_name: '鈴木 一郎',
    tei_name: '鈴木様邸',
    status: '締結済' as ContractStatus,
    contract_number: 'C-2024-001',
    contract_date: '2024-12-10',
    contract_amount: 40000000,
    created_at: '2024-12-05T14:00:00Z',
  },
]

export default function ContractsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'all'>('all')

  const filteredContracts = mockContracts.filter((contract) => {
    const matchesSearch =
      contract.tei_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.contract_number?.includes(searchQuery)

    const matchesStatus =
      statusFilter === 'all' || contract.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const statusCounts: Record<ContractStatus | 'all', number> = {
    all: mockContracts.length,
    '作成中': mockContracts.filter(c => c.status === '作成中').length,
    '確認中': mockContracts.filter(c => c.status === '確認中').length,
    '承認待ち': mockContracts.filter(c => c.status === '承認待ち').length,
    '締結済': mockContracts.filter(c => c.status === '締結済').length,
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">契約書</h1>
            <p className="text-gray-500 mt-1">
              請負契約書の作成・管理
            </p>
          </div>
          <Link href="/contracts/new">
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
          {(Object.keys(STATUS_CONFIG) as ContractStatus[]).map((status) => {
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
            placeholder="邸名、顧客名、契約番号で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 text-base rounded-xl border-gray-200"
          />
        </div>

        {/* Contracts List */}
        <div className="space-y-3">
          {filteredContracts.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <FileSignature className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">契約書がありません</p>
              </CardContent>
            </Card>
          ) : (
            filteredContracts.map((contract) => {
              const statusConfig = STATUS_CONFIG[contract.status]
              const StatusIcon = statusConfig.icon

              return (
                <Link key={contract.id} href={`/contracts/${contract.id}`}>
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
                                {contract.tei_name}
                              </h3>
                              <Badge
                                variant="outline"
                                className={`${statusConfig.bgColor} ${statusConfig.color} border-0`}
                              >
                                {statusConfig.label}
                              </Badge>
                              {contract.contract_number && (
                                <span className="text-sm text-gray-500">
                                  {contract.contract_number}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span className="flex items-center">
                                <User className="w-3 h-3 mr-1" />
                                {contract.customer_name}
                              </span>
                              {contract.contract_date && (
                                <span className="flex items-center">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  契約日: {new Date(contract.contract_date).toLocaleDateString('ja-JP')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right hidden md:block">
                            <p className="text-xs text-gray-500">契約金額</p>
                            <p className="font-bold text-gray-900">
                              ¥{contract.contract_amount.toLocaleString()}
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
