'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Layout } from '@/components/layout/layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { FileText, Search, Plus, ChevronRight, Calendar, User } from 'lucide-react'
import type { FundPlan, DocumentStatus } from '@/types/database'

// Mock data
const mockFundPlans: (FundPlan & { customer_name: string; tei_name: string })[] = [
  {
    id: 'fp-1',
    customer_id: '1',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    product_id: '1',
    status: 'draft',
    version: 1,
    data: {},
    created_by: 'dev-sales-001',
    approved_by: null,
    approved_at: null,
    created_at: '2024-12-15T10:00:00Z',
    updated_at: '2024-12-15T10:00:00Z',
    customer_name: '山田 太郎',
    tei_name: '山田様邸',
  },
  {
    id: 'fp-2',
    customer_id: '3',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    product_id: '2',
    status: 'approved',
    version: 2,
    data: {},
    created_by: 'dev-sales-001',
    approved_by: 'dev-manager-001',
    approved_at: '2024-12-12T14:00:00Z',
    created_at: '2024-12-10T09:00:00Z',
    updated_at: '2024-12-12T14:00:00Z',
    customer_name: '鈴木 一郎',
    tei_name: '鈴木様邸',
  },
]

const statusColors: Record<DocumentStatus, string> = {
  draft: 'bg-gray-100 text-gray-600 border-gray-200',
  submitted: 'bg-blue-100 text-blue-700 border-blue-200',
  approved: 'bg-green-100 text-green-700 border-green-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
}

const statusLabels: Record<DocumentStatus, string> = {
  draft: '下書き',
  submitted: '提出済',
  approved: '承認済',
  rejected: '差戻し',
}

export default function FundPlansPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredPlans = mockFundPlans.filter((plan) =>
    plan.tei_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plan.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">資金計画書</h1>
            <p className="text-gray-500 mt-1">
              全{mockFundPlans.length}件の資金計画書
            </p>
          </div>
          <Link href="/fund-plans/new">
            <Button className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600">
              <Plus className="w-4 h-4 mr-2" />
              新規作成
            </Button>
          </Link>
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

        {/* Fund Plans List */}
        <div className="space-y-4">
          {filteredPlans.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">資金計画書がありません</p>
              </CardContent>
            </Card>
          ) : (
            filteredPlans.map((plan) => (
              <Link key={plan.id} href={`/fund-plans/${plan.id}`}>
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-5">
                        <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-xl flex items-center justify-center shrink-0">
                          <FileText className="w-7 h-7 text-orange-600" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-3 mb-1">
                            <h3 className="text-lg font-bold text-gray-900">
                              {plan.tei_name}
                            </h3>
                            <Badge
                              variant="outline"
                              className={statusColors[plan.status]}
                            >
                              {statusLabels[plan.status]}
                            </Badge>
                            <span className="text-sm text-gray-400">
                              v{plan.version}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <User className="w-4 h-4 mr-1" />
                              {plan.customer_name}
                            </span>
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {new Date(plan.updated_at).toLocaleDateString('ja-JP')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </Layout>
  )
}
