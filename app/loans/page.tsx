'use client'

import { useState, useEffect } from 'react'
import { Layout } from '@/components/layout/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Landmark,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Calendar,
  DollarSign,
  Percent,
  Building2,
  FileText,
  Edit,
  Trash2,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { useLoanStore, type Loan, type LoanStatus } from '@/store/loan-store'
import { useCustomerStore } from '@/store'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { TableSkeleton } from '@/components/ui/skeleton-loaders'
import { HelpTooltip } from '@/components/ui/help-tooltip'

const LOAN_STATUS_CONFIG: Record<LoanStatus, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  '事前審査中': { label: '事前審査中', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: Clock },
  '事前審査通過': { label: '事前審査通過', color: 'text-green-700', bgColor: 'bg-green-100', icon: CheckCircle2 },
  '事前審査否決': { label: '事前審査否決', color: 'text-red-700', bgColor: 'bg-red-100', icon: XCircle },
  '本審査中': { label: '本審査中', color: 'text-indigo-700', bgColor: 'bg-indigo-100', icon: Clock },
  '本審査通過': { label: '本審査通過', color: 'text-emerald-700', bgColor: 'bg-emerald-100', icon: CheckCircle2 },
  '本審査否決': { label: '本審査否決', color: 'text-red-700', bgColor: 'bg-red-100', icon: XCircle },
  '融資実行待ち': { label: '融資実行待ち', color: 'text-amber-700', bgColor: 'bg-amber-100', icon: Clock },
  '融資実行済み': { label: '融資実行済み', color: 'text-green-700', bgColor: 'bg-green-100', icon: CheckCircle2 },
  'キャンセル': { label: 'キャンセル', color: 'text-gray-700', bgColor: 'bg-gray-100', icon: XCircle },
}

const BANKS = [
  '住宅金融支援機構（フラット35）',
  '三菱UFJ銀行',
  '三井住友銀行',
  'みずほ銀行',
  'りそな銀行',
  '関西みらい銀行',
  '池田泉州銀行',
  '紀陽銀行',
  '近畿大阪銀行',
  'イオン銀行',
  '住信SBIネット銀行',
  '楽天銀行',
  'auじぶん銀行',
  'PayPay銀行',
  'その他',
]

const LOAN_TYPES = [
  '変動金利',
  '固定金利（全期間）',
  '固定金利（10年）',
  '固定金利（20年）',
  'フラット35',
  'フラット35S',
  'ミックス型',
]

export default function LoansPage() {
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null)

  const { loans, addLoan, updateLoan, deleteLoan } = useLoanStore()
  const { customers } = useCustomerStore()

  // フォーム state
  const [formData, setFormData] = useState({
    customerId: '',
    bank: '',
    loanType: '',
    amount: '',
    interestRate: '',
    years: '35',
    status: '事前審査中' as LoanStatus,
    preApprovalDate: '',
    mainApprovalDate: '',
    executionDate: '',
    notes: '',
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  const resetForm = () => {
    setFormData({
      customerId: '',
      bank: '',
      loanType: '',
      amount: '',
      interestRate: '',
      years: '35',
      status: '事前審査中',
      preApprovalDate: '',
      mainApprovalDate: '',
      executionDate: '',
      notes: '',
    })
    setEditingLoan(null)
  }

  const handleSubmit = () => {
    if (!formData.customerId || !formData.bank || !formData.amount) {
      toast.error('必須項目を入力してください')
      return
    }

    const customer = customers.find(c => c.id === formData.customerId)
    const loanData = {
      customerId: formData.customerId,
      customerName: customer?.name || '',
      teiName: customer?.tei_name || '',
      bank: formData.bank,
      loanType: formData.loanType,
      amount: parseFloat(formData.amount) || 0,
      interestRate: parseFloat(formData.interestRate) || 0,
      years: parseInt(formData.years) || 35,
      status: formData.status,
      preApprovalDate: formData.preApprovalDate || null,
      mainApprovalDate: formData.mainApprovalDate || null,
      executionDate: formData.executionDate || null,
      notes: formData.notes || null,
    }

    if (editingLoan) {
      updateLoan(editingLoan.id, loanData)
      toast.success('ローン情報を更新しました')
    } else {
      addLoan(loanData)
      toast.success('ローンを登録しました')
    }

    setShowAddDialog(false)
    resetForm()
  }

  const handleEdit = (loan: Loan) => {
    setFormData({
      customerId: loan.customerId,
      bank: loan.bank,
      loanType: loan.loanType,
      amount: loan.amount.toString(),
      interestRate: loan.interestRate.toString(),
      years: loan.years.toString(),
      status: loan.status,
      preApprovalDate: loan.preApprovalDate || '',
      mainApprovalDate: loan.mainApprovalDate || '',
      executionDate: loan.executionDate || '',
      notes: loan.notes || '',
    })
    setEditingLoan(loan)
    setShowAddDialog(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('このローン情報を削除しますか？')) {
      deleteLoan(id)
      toast.success('ローン情報を削除しました')
    }
  }

  // フィルタリング
  const filteredLoans = mounted ? loans.filter((loan) => {
    const matchesSearch =
      loan.customerName.includes(searchQuery) ||
      loan.teiName?.includes(searchQuery) ||
      loan.bank.includes(searchQuery)
    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter
    return matchesSearch && matchesStatus
  }) : []

  // 統計
  const stats = {
    total: loans.length,
    inProgress: loans.filter(l => ['事前審査中', '本審査中', '融資実行待ち'].includes(l.status)).length,
    approved: loans.filter(l => ['事前審査通過', '本審査通過', '融資実行済み'].includes(l.status)).length,
    rejected: loans.filter(l => ['事前審査否決', '本審査否決', 'キャンセル'].includes(l.status)).length,
    totalAmount: loans.reduce((sum, l) => sum + l.amount, 0),
  }

  if (!mounted) {
    return (
      <Layout>
        <TableSkeleton rows={5} columns={6} />
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* パンくずリスト */}
        <Breadcrumb items={[{ label: 'ローン管理' }]} />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">ローン管理</h1>
              <HelpTooltip content="住宅ローンの審査状況を管理します。事前審査から融資実行までの進捗を追跡できます。" />
            </div>
            <p className="text-gray-600 mt-1">住宅ローンの審査状況を一元管理</p>
          </div>
          <Button
            className="bg-gradient-to-r from-orange-500 to-yellow-500"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            ローン登録
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">総件数</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Landmark className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">審査中</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.inProgress}</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">承認済み</p>
                  <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">否決/取消</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md col-span-2 md:col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">総借入額</p>
                  <p className="text-lg font-bold text-gray-900">
                    {(stats.totalAmount / 10000).toLocaleString()}万
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="顧客名、邸名、銀行名で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="ステータス" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              {Object.entries(LOAN_STATUS_CONFIG).map(([status, config]) => (
                <SelectItem key={status} value={status}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Loans Table */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>顧客</TableHead>
                  <TableHead>金融機関</TableHead>
                  <TableHead>借入額</TableHead>
                  <TableHead>金利</TableHead>
                  <TableHead>期間</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>更新日</TableHead>
                  <TableHead className="w-[100px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLoans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <Landmark className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-700 text-base">ローン情報がありません</p>
                      <p className="text-gray-600 text-sm mt-2">「ローン登録」ボタンから新規登録してください</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLoans.map((loan) => {
                    const statusConfig = LOAN_STATUS_CONFIG[loan.status]
                    const StatusIcon = statusConfig.icon
                    return (
                      <TableRow key={loan.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div>
                            <p className="font-medium">{loan.teiName || loan.customerName}</p>
                            <p className="text-sm text-gray-600">{loan.customerName}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{loan.bank}</p>
                            <p className="text-sm text-gray-600">{loan.loanType}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {(loan.amount / 10000).toLocaleString()}万円
                        </TableCell>
                        <TableCell>{loan.interestRate}%</TableCell>
                        <TableCell>{loan.years}年</TableCell>
                        <TableCell>
                          <Badge className={`${statusConfig.bgColor} ${statusConfig.color} border-0`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-700">
                          {new Date(loan.updatedAt).toLocaleDateString('ja-JP')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleEdit(loan)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-red-100"
                              onClick={() => handleDelete(loan.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={showAddDialog} onOpenChange={(open) => {
          setShowAddDialog(open)
          if (!open) resetForm()
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingLoan ? 'ローン情報を編集' : '新規ローン登録'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="col-span-2">
                <Label>顧客 *</Label>
                <Select
                  value={formData.customerId}
                  onValueChange={(value) => setFormData({ ...formData, customerId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="顧客を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.tei_name || customer.name} ({customer.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>金融機関 *</Label>
                <Select
                  value={formData.bank}
                  onValueChange={(value) => setFormData({ ...formData, bank: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="銀行を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {BANKS.map((bank) => (
                      <SelectItem key={bank} value={bank}>
                        {bank}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>ローンタイプ</Label>
                <Select
                  value={formData.loanType}
                  onValueChange={(value) => setFormData({ ...formData, loanType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="タイプを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOAN_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>借入額（円） *</Label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="例: 35000000"
                />
              </div>
              <div>
                <Label>金利（%）</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.interestRate}
                  onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                  placeholder="例: 0.5"
                />
              </div>
              <div>
                <Label>返済期間（年）</Label>
                <Input
                  type="number"
                  value={formData.years}
                  onChange={(e) => setFormData({ ...formData, years: e.target.value })}
                  placeholder="例: 35"
                />
              </div>
              <div>
                <Label>ステータス</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as LoanStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(LOAN_STATUS_CONFIG).map(([status, config]) => (
                      <SelectItem key={status} value={status}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>事前審査日</Label>
                <Input
                  type="date"
                  value={formData.preApprovalDate}
                  onChange={(e) => setFormData({ ...formData, preApprovalDate: e.target.value })}
                />
              </div>
              <div>
                <Label>本審査日</Label>
                <Input
                  type="date"
                  value={formData.mainApprovalDate}
                  onChange={(e) => setFormData({ ...formData, mainApprovalDate: e.target.value })}
                />
              </div>
              <div>
                <Label>融資実行日</Label>
                <Input
                  type="date"
                  value={formData.executionDate}
                  onChange={(e) => setFormData({ ...formData, executionDate: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label>備考</Label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="備考があれば入力"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowAddDialog(false)
                resetForm()
              }}>
                キャンセル
              </Button>
              <Button
                className="bg-gradient-to-r from-orange-500 to-yellow-500"
                onClick={handleSubmit}
              >
                {editingLoan ? '更新' : '登録'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  )
}
