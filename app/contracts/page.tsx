'use client'

import { useState, useEffect, useMemo } from 'react'
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
  FileSearch,
  UserCheck,
  CheckCircle2,
  RotateCcw,
  Clock,
  TrendingUp,
  Download,
  LayoutList,
  LayoutGrid,
  FileText,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useContractStore, type StoredContract } from '@/store'
import type { ContractStatus } from '@/types/database'
import { CONTRACT_STATUS_CONFIG, CONTRACT_STATUS_ORDER } from '@/types/database'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { TableSkeleton } from '@/components/ui/skeleton-loaders'
import { HelpTooltip } from '@/components/ui/help-tooltip'

// アイコンマッピング
const STATUS_ICONS: Record<ContractStatus, typeof FileEdit> = {
  '作成中': FileEdit,
  '書類確認': FileSearch,
  '上長承認待ち': UserCheck,
  '契約完了': CheckCircle2,
}

// モックデータ（初期データ）
const createMockContracts = (): Omit<StoredContract, 'id' | 'created_at' | 'updated_at' | 'history' | 'return_count'>[] => [
  {
    customer_id: 'cust-1',
    fund_plan_id: null,
    status: '作成中',
    contract_number: null,
    contract_date: null,
    tei_name: '山田様邸',
    customer_name: '山田 太郎',
    partner_name: null,
    ownership_type: '単独',
    sales_person: '営業一郎',
    design_person: '設計花子',
    construction_person: null,
    ic_person: null,
    land_address: '東京都世田谷区1-2-3',
    land_area: 50,
    building_area: 35,
    product_name: 'LIFE+ Limited',
    building_price: 35000000,
    option_price: 2000000,
    exterior_price: 1500000,
    other_price: 500000,
    discount_amount: 1000000,
    tax_amount: 3800000,
    total_amount: 41800000,
    payment_at_contract: 5000000,
    payment_at_start: 10000000,
    payment_at_frame: 15000000,
    payment_at_completion: 11800000,
    identity_verified: false,
    identity_doc_type: null,
    identity_verified_date: null,
    identity_verified_by: null,
    loan_type: '銀行ローン',
    loan_bank: 'みずほ銀行',
    loan_amount: 35000000,
    loan_approved: false,
    loan_approved_date: null,
    important_notes: null,
    important_notes_date: null,
    attachments: null,
    created_by: 'user-1',
    created_by_name: '営業一郎',
    checked_by: null,
    checked_by_name: null,
    checked_at: null,
    check_comment: null,
    approved_by: null,
    approved_by_name: null,
    approved_at: null,
    approval_comment: null,
    returned_by: null,
    returned_by_name: null,
    returned_at: null,
    return_comment: null,
    designated_checker_id: null,
    designated_checker_name: null,
    designated_approver_id: null,
    designated_approver_name: null,
    notes: null,
  },
  {
    customer_id: 'cust-2',
    fund_plan_id: null,
    status: '書類確認',
    contract_number: 'C-2024-0002',
    contract_date: '2024-12-15',
    tei_name: '佐藤様邸',
    customer_name: '佐藤 花子',
    partner_name: '佐藤 次郎',
    ownership_type: '共有',
    sales_person: '営業二郎',
    design_person: '設計太郎',
    construction_person: '工事一郎',
    ic_person: 'IC花子',
    land_address: '神奈川県横浜市中区1-1-1',
    land_area: 60,
    building_area: 42,
    product_name: 'LIFE+ Standard',
    building_price: 42000000,
    option_price: 3000000,
    exterior_price: 2000000,
    other_price: 800000,
    discount_amount: 1500000,
    tax_amount: 4630000,
    total_amount: 50930000,
    payment_at_contract: 8000000,
    payment_at_start: 15000000,
    payment_at_frame: 18000000,
    payment_at_completion: 9930000,
    identity_verified: true,
    identity_doc_type: '免許証',
    identity_verified_date: '2024-12-14',
    identity_verified_by: '営業二郎',
    loan_type: 'フラット35',
    loan_bank: '住宅金融支援機構',
    loan_amount: 40000000,
    loan_approved: true,
    loan_approved_date: '2024-12-10',
    important_notes: '説明済',
    important_notes_date: '2024-12-14',
    attachments: null,
    created_by: 'user-2',
    created_by_name: '営業二郎',
    checked_by: null,
    checked_by_name: null,
    checked_at: null,
    check_comment: null,
    approved_by: null,
    approved_by_name: null,
    approved_at: null,
    approval_comment: null,
    returned_by: null,
    returned_by_name: null,
    returned_at: null,
    return_comment: null,
    designated_checker_id: 'user-4',
    designated_checker_name: '確認担当',
    designated_approver_id: null,
    designated_approver_name: null,
    notes: '来月着工予定',
  },
  {
    customer_id: 'cust-3',
    fund_plan_id: null,
    status: '上長承認待ち',
    contract_number: 'C-2024-0003',
    contract_date: '2024-12-12',
    tei_name: '鈴木様邸',
    customer_name: '鈴木 一郎',
    partner_name: null,
    ownership_type: '単独',
    sales_person: '営業三郎',
    design_person: '設計花子',
    construction_person: '工事二郎',
    ic_person: null,
    land_address: '埼玉県さいたま市大宮区2-3-4',
    land_area: 45,
    building_area: 32,
    product_name: 'LIFE+ Basic',
    building_price: 32000000,
    option_price: 1500000,
    exterior_price: 1200000,
    other_price: 400000,
    discount_amount: 500000,
    tax_amount: 3460000,
    total_amount: 38060000,
    payment_at_contract: 5000000,
    payment_at_start: 10000000,
    payment_at_frame: 15000000,
    payment_at_completion: 8060000,
    identity_verified: true,
    identity_doc_type: 'マイナンバーカード',
    identity_verified_date: '2024-12-11',
    identity_verified_by: '営業三郎',
    loan_type: '銀行ローン',
    loan_bank: '三井住友銀行',
    loan_amount: 30000000,
    loan_approved: true,
    loan_approved_date: '2024-12-08',
    important_notes: '説明済',
    important_notes_date: '2024-12-11',
    attachments: null,
    created_by: 'user-3',
    created_by_name: '営業三郎',
    checked_by: 'user-4',
    checked_by_name: '確認担当',
    checked_at: '2024-12-13T10:00:00Z',
    check_comment: '問題なし',
    approved_by: null,
    approved_by_name: null,
    approved_at: null,
    approval_comment: null,
    returned_by: null,
    returned_by_name: null,
    returned_at: null,
    return_comment: null,
    designated_checker_id: 'user-4',
    designated_checker_name: '確認担当',
    designated_approver_id: 'user-5',
    designated_approver_name: '部長',
    notes: null,
  },
  {
    customer_id: 'cust-4',
    fund_plan_id: null,
    status: '契約完了',
    contract_number: 'C-2024-0001',
    contract_date: '2024-12-01',
    tei_name: '田中様邸',
    customer_name: '田中 健太',
    partner_name: '田中 美咲',
    ownership_type: '共有',
    sales_person: '営業一郎',
    design_person: '設計太郎',
    construction_person: '工事一郎',
    ic_person: 'IC太郎',
    land_address: '千葉県船橋市本町3-4-5',
    land_area: 55,
    building_area: 38,
    product_name: 'LIFE+ Limited',
    building_price: 38000000,
    option_price: 2500000,
    exterior_price: 1800000,
    other_price: 600000,
    discount_amount: 800000,
    tax_amount: 4210000,
    total_amount: 46310000,
    payment_at_contract: 7000000,
    payment_at_start: 12000000,
    payment_at_frame: 18000000,
    payment_at_completion: 9310000,
    identity_verified: true,
    identity_doc_type: '免許証',
    identity_verified_date: '2024-11-28',
    identity_verified_by: '営業一郎',
    loan_type: '銀行ローン',
    loan_bank: '三菱UFJ銀行',
    loan_amount: 38000000,
    loan_approved: true,
    loan_approved_date: '2024-11-25',
    important_notes: '説明済',
    important_notes_date: '2024-11-28',
    attachments: null,
    created_by: 'user-1',
    created_by_name: '営業一郎',
    checked_by: 'user-4',
    checked_by_name: '確認担当',
    checked_at: '2024-11-29T10:00:00Z',
    check_comment: '問題なし',
    approved_by: 'user-5',
    approved_by_name: '部長',
    approved_at: '2024-12-01T14:00:00Z',
    approval_comment: '承認します',
    returned_by: null,
    returned_by_name: null,
    returned_at: null,
    return_comment: null,
    designated_checker_id: null,
    designated_checker_name: null,
    designated_approver_id: null,
    designated_approver_name: null,
    notes: '着工開始済み',
  },
]

export default function ContractsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'all'>('all')
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
  const [mounted, setMounted] = useState(false)

  const { contracts, addContract } = useContractStore()

  // クライアントサイドでのみマウント
  useEffect(() => {
    setMounted(true)
  }, [])

  // 初期データがなければモックデータを追加
  useEffect(() => {
    if (mounted && contracts.length === 0) {
      const mockData = createMockContracts()
      mockData.forEach((c) => addContract(c))
    }
  }, [mounted, contracts.length, addContract])

  // フィルタリング
  const filteredContracts = useMemo(() => {
    if (!mounted) return []
    return contracts.filter((contract) => {
      const matchesSearch =
        contract.tei_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.contract_number?.includes(searchQuery)

      const matchesStatus =
        statusFilter === 'all' || contract.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [contracts, searchQuery, statusFilter, mounted])

  // ステータスごとのカウント
  const statusCounts = useMemo(() => {
    if (!mounted) return { all: 0, '作成中': 0, '書類確認': 0, '上長承認待ち': 0, '契約完了': 0 }
    return {
      all: contracts.length,
      '作成中': contracts.filter((c) => c.status === '作成中').length,
      '書類確認': contracts.filter((c) => c.status === '書類確認').length,
      '上長承認待ち': contracts.filter((c) => c.status === '上長承認待ち').length,
      '契約完了': contracts.filter((c) => c.status === '契約完了').length,
    }
  }, [contracts, mounted])

  // サマリー統計
  const stats = useMemo(() => {
    if (!mounted) return { total: 0, pending: 0, completed: 0, totalAmount: 0 }
    return {
      total: contracts.length,
      pending: contracts.filter((c) => c.status !== '契約完了').length,
      completed: contracts.filter((c) => c.status === '契約完了').length,
      totalAmount: contracts
        .filter((c) => c.status === '契約完了')
        .reduce((sum, c) => sum + (c.total_amount || 0), 0),
    }
  }, [contracts, mounted])

  // CSVエクスポート
  const exportToCsv = () => {
    const headers = ['契約番号', '邸名', '顧客名', 'ステータス', '契約金額', '契約日', '作成日']
    const rows = filteredContracts.map((c) => [
      c.contract_number || '-',
      c.tei_name || '-',
      c.customer_name || '-',
      c.status,
      c.total_amount?.toLocaleString() || '0',
      c.contract_date || '-',
      new Date(c.created_at).toLocaleDateString('ja-JP'),
    ])

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contracts_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!mounted) {
    return (
      <Layout>
        <TableSkeleton rows={5} columns={5} />
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* パンくずリスト */}
        <Breadcrumb items={[{ label: '契約書管理' }]} />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">契約書管理</h1>
              <HelpTooltip content="請負契約書の作成から承認までのフローを管理します。ステータスで進捗を確認できます。" />
            </div>
            <p className="text-gray-600 mt-1">請負契約書の作成・承認フロー管理</p>
          </div>
          <div className="flex items-center space-x-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  エクスポート
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={exportToCsv}>
                  CSV形式でダウンロード
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link href="/contracts/new">
              <Button className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600">
                <Plus className="w-4 h-4 mr-2" />
                新規作成
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">全契約</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FileSignature className="w-6 h-6 text-blue-600" />
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
                <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
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
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">契約総額</p>
                  <p className="text-xl font-bold text-gray-900">
                    ¥{(stats.totalAmount / 10000).toLocaleString()}万
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & View Toggle */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex space-x-2 overflow-x-auto pb-2 md:pb-0">
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
            {CONTRACT_STATUS_ORDER.map((status) => {
              const config = CONTRACT_STATUS_CONFIG[status]
              const Icon = STATUS_ICONS[status]
              return (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className={statusFilter === status ? `${config.bgColor} ${config.color} border-0` : ''}
                >
                  <Icon className={`w-3 h-3 mr-1 ${statusFilter !== status ? config.color : ''}`} />
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

          {/* View Toggle */}
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <LayoutList className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('kanban')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
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

        {/* List View */}
        {viewMode === 'list' && (
          <div className="space-y-3">
            {filteredContracts.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-12 text-center">
                  <FileSignature className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-700 text-base">契約書がありません</p>
                  <p className="text-gray-600 text-sm mt-2">新規作成ボタンから契約書を作成してください</p>
                </CardContent>
              </Card>
            ) : (
              filteredContracts.map((contract) => {
                const statusConfig = CONTRACT_STATUS_CONFIG[contract.status] || {
                  label: contract.status || '未設定',
                  color: 'text-gray-600',
                  bgColor: 'bg-gray-100',
                }
                const StatusIcon = STATUS_ICONS[contract.status] || FileText

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
                                  {contract.tei_name || '未設定'}
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
                                {contract.return_count > 0 && (
                                  <Badge variant="destructive" className="text-xs">
                                    <RotateCcw className="w-3 h-3 mr-1" />
                                    差戻し{contract.return_count}回
                                  </Badge>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-700">
                                <span className="flex items-center">
                                  <User className="w-4 h-4 mr-1" />
                                  {contract.customer_name || '未設定'}
                                </span>
                                {contract.contract_date && (
                                  <span className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    契約日: {new Date(contract.contract_date).toLocaleDateString('ja-JP')}
                                  </span>
                                )}
                                <span className="text-gray-600">
                                  作成者: {contract.created_by_name || '不明'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right hidden md:block">
                              <p className="text-sm text-gray-600">契約金額</p>
                              <p className="font-bold text-gray-900">
                                ¥{(contract.total_amount || 0).toLocaleString()}
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
        )}

        {/* Kanban View */}
        {viewMode === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {CONTRACT_STATUS_ORDER.map((status) => {
              const config = CONTRACT_STATUS_CONFIG[status]
              const StatusIcon = STATUS_ICONS[status]
              const statusContracts = contracts.filter((c) => c.status === status)

              return (
                <div key={status} className="space-y-3">
                  <div className={`flex items-center space-x-2 p-3 rounded-lg ${config.bgColor}`}>
                    <StatusIcon className={`w-5 h-5 ${config.color}`} />
                    <span className={`font-semibold ${config.color}`}>{config.label}</span>
                    <Badge variant="secondary">{statusContracts.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {statusContracts.map((contract) => (
                      <Link key={contract.id} href={`/contracts/${contract.id}`}>
                        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                          <CardContent className="p-4">
                            <h4 className="font-semibold text-gray-900 mb-1">
                              {contract.tei_name || '未設定'}
                            </h4>
                            <p className="text-sm text-gray-700 mb-2">
                              {contract.customer_name || '未設定'}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">
                                {contract.contract_number || '-'}
                              </span>
                              <span className="text-sm font-semibold text-gray-800">
                                ¥{((contract.total_amount || 0) / 10000).toFixed(0)}万
                              </span>
                            </div>
                            {contract.return_count > 0 && (
                              <Badge variant="destructive" className="mt-2 text-xs">
                                <RotateCcw className="w-3 h-3 mr-1" />
                                差戻し{contract.return_count}回
                              </Badge>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                    {statusContracts.length === 0 && (
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
