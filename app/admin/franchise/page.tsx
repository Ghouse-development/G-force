'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Building,
  Plus,
  Search,
  Pencil,
  Trash2,
  Users,
  TrendingUp,
  MapPin,
  Calendar,
  Check,
  MoreHorizontal,
  Building2,
  Crown,
  Shield,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { useFranchiseStore, Tenant } from '@/store/franchise-store'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

const planLabels: Record<Tenant['plan'], string> = {
  basic: 'ベーシック',
  standard: 'スタンダード',
  premium: 'プレミアム',
}

const planColors: Record<Tenant['plan'], string> = {
  basic: 'bg-gray-100 text-gray-700',
  standard: 'bg-blue-100 text-blue-700',
  premium: 'bg-amber-100 text-amber-700',
}

const planIcons: Record<Tenant['plan'], React.ComponentType<{ className?: string }>> = {
  basic: Shield,
  standard: Star,
  premium: Crown,
}

const statusLabels: Record<Tenant['status'], string> = {
  active: '稼働中',
  suspended: '一時停止',
  terminated: '解約済み',
}

const statusColors: Record<Tenant['status'], string> = {
  active: 'bg-green-100 text-green-700',
  suspended: 'bg-yellow-100 text-yellow-700',
  terminated: 'bg-red-100 text-red-700',
}

export default function FranchisePage() {
  const router = useRouter()
  const {
    tenants,
    currentTenantId,
    addTenant,
    updateTenant,
    deleteTenant,
    setCurrentTenant,
    getTenantStats,
  } = useFranchiseStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<Tenant['status'] | 'all'>('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // 新規テナントフォーム
  const [newTenant, setNewTenant] = useState({
    code: '',
    name: '',
    companyName: '',
    representativeName: '',
    phone: '',
    email: '',
    address: '',
    prefecture: '',
    contractDate: format(new Date(), 'yyyy-MM-dd'),
    status: 'active' as Tenant['status'],
    plan: 'basic' as Tenant['plan'],
    maxUsers: 10,
    monthlyFee: 30000,
    notes: '',
  })

  // フィルタリング
  const filteredTenants = useMemo(() => {
    return tenants.filter((tenant) => {
      const matchesSearch =
        tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.companyName.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [tenants, searchTerm, statusFilter])

  // 統計
  const stats = useMemo(() => {
    const activeTenants = tenants.filter((t) => t.status === 'active')
    return {
      total: tenants.length,
      active: activeTenants.length,
      totalUsers: tenants.reduce((sum, t) => sum + t.currentUsers, 0),
      totalRevenue: activeTenants.reduce((sum, t) => sum + t.monthlyFee, 0),
    }
  }, [tenants])

  const handleAdd = () => {
    if (!newTenant.code || !newTenant.name || !newTenant.companyName) {
      toast.error('必須項目を入力してください')
      return
    }

    addTenant({
      ...newTenant,
      notes: newTenant.notes || null,
    })

    setNewTenant({
      code: '',
      name: '',
      companyName: '',
      representativeName: '',
      phone: '',
      email: '',
      address: '',
      prefecture: '',
      contractDate: format(new Date(), 'yyyy-MM-dd'),
      status: 'active',
      plan: 'basic',
      maxUsers: 10,
      monthlyFee: 30000,
      notes: '',
    })
    setIsAddDialogOpen(false)
    toast.success('加盟店を登録しました')
  }

  const handleEdit = () => {
    if (!editingTenant) return

    updateTenant(editingTenant.id, {
      code: editingTenant.code,
      name: editingTenant.name,
      companyName: editingTenant.companyName,
      representativeName: editingTenant.representativeName,
      phone: editingTenant.phone,
      email: editingTenant.email,
      address: editingTenant.address,
      prefecture: editingTenant.prefecture,
      contractDate: editingTenant.contractDate,
      status: editingTenant.status,
      plan: editingTenant.plan,
      maxUsers: editingTenant.maxUsers,
      monthlyFee: editingTenant.monthlyFee,
      notes: editingTenant.notes,
    })

    setEditingTenant(null)
    setIsEditDialogOpen(false)
    toast.success('加盟店情報を更新しました')
  }

  const handleDelete = (id: string) => {
    deleteTenant(id)
    setDeleteConfirmId(null)
    toast.success('加盟店を削除しました')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => router.push('/admin')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            管理画面へ戻る
          </Button>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-lg">
              <Building className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">FC（フランチャイズ）管理</h1>
              <p className="text-gray-500">加盟店・テナントを管理</p>
            </div>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            新規登録
          </Button>
        </div>

        {/* 統計 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">加盟店数</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Building className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">稼働中</p>
                  <p className="text-3xl font-bold text-green-600">{stats.active}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">総ユーザー数</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">月額収益</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatCurrency(stats.totalRevenue)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* フィルター */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="加盟店コード、店舗名、会社名で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="ステータス" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="active">稼働中</SelectItem>
              <SelectItem value="suspended">一時停止</SelectItem>
              <SelectItem value="terminated">解約済み</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* テナント一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTenants.map((tenant) => {
            const tenantStats = getTenantStats(tenant.id)
            const PlanIcon = planIcons[tenant.plan]
            const isCurrent = tenant.id === currentTenantId

            return (
              <Card
                key={tenant.id}
                className={cn(
                  'relative overflow-hidden transition-all hover:shadow-lg',
                  isCurrent && 'ring-2 ring-orange-500'
                )}
              >
                {isCurrent && (
                  <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs px-3 py-1 rounded-bl-lg">
                    現在のテナント
                  </div>
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow">
                        <Building2 className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{tenant.name}</CardTitle>
                        <CardDescription>{tenant.code}</CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingTenant(tenant)
                            setIsEditDialogOpen(true)
                          }}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          編集
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setCurrentTenant(tenant.id)}>
                          <Check className="h-4 w-4 mr-2" />
                          現在のテナントに設定
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => setDeleteConfirmId(tenant.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          削除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className={cn(statusColors[tenant.status])}>
                      {statusLabels[tenant.status]}
                    </Badge>
                    <Badge className={cn('gap-1', planColors[tenant.plan])}>
                      <PlanIcon className="h-3 w-3" />
                      {planLabels[tenant.plan]}
                    </Badge>
                  </div>

                  <div className="text-sm space-y-1">
                    <p className="font-medium text-gray-900">{tenant.companyName}</p>
                    <div className="flex items-center gap-2 text-gray-500">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{tenant.prefecture}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {format(new Date(tenant.contractDate), 'yyyy年MM月', { locale: ja })}加盟
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                    <div>
                      <p className="text-xs text-gray-500">ユーザー</p>
                      <p className="font-medium">
                        {tenant.currentUsers} / {tenant.maxUsers}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">月額利用料</p>
                      <p className="font-medium">{formatCurrency(tenant.monthlyFee)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-3 border-t text-sm">
                    <div>
                      <p className="text-xs text-gray-500">顧客数</p>
                      <p className="font-medium">{tenantStats.totalCustomers}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">契約数</p>
                      <p className="font-medium">{tenantStats.totalContracts}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {filteredTenants.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              該当する加盟店がありません
            </div>
          )}
        </div>
      </div>

      {/* 追加ダイアログ */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新規加盟店登録</DialogTitle>
            <DialogDescription>
              新しい加盟店を登録します
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>加盟店コード *</Label>
              <Input
                value={newTenant.code}
                onChange={(e) => setNewTenant({ ...newTenant, code: e.target.value })}
                placeholder="例: GH-004"
              />
            </div>
            <div className="space-y-2">
              <Label>店舗名 *</Label>
              <Input
                value={newTenant.name}
                onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                placeholder="例: Gハウス静岡店"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>会社名 *</Label>
              <Input
                value={newTenant.companyName}
                onChange={(e) => setNewTenant({ ...newTenant, companyName: e.target.value })}
                placeholder="例: 株式会社静岡ホームズ"
              />
            </div>
            <div className="space-y-2">
              <Label>代表者名</Label>
              <Input
                value={newTenant.representativeName}
                onChange={(e) =>
                  setNewTenant({ ...newTenant, representativeName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>電話番号</Label>
              <Input
                value={newTenant.phone}
                onChange={(e) => setNewTenant({ ...newTenant, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>メールアドレス</Label>
              <Input
                type="email"
                value={newTenant.email}
                onChange={(e) => setNewTenant({ ...newTenant, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>都道府県</Label>
              <Input
                value={newTenant.prefecture}
                onChange={(e) => setNewTenant({ ...newTenant, prefecture: e.target.value })}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>住所</Label>
              <Input
                value={newTenant.address}
                onChange={(e) => setNewTenant({ ...newTenant, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>加盟契約日</Label>
              <Input
                type="date"
                value={newTenant.contractDate}
                onChange={(e) => setNewTenant({ ...newTenant, contractDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>プラン</Label>
              <Select
                value={newTenant.plan}
                onValueChange={(v) => setNewTenant({ ...newTenant, plan: v as Tenant['plan'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">ベーシック</SelectItem>
                  <SelectItem value="standard">スタンダード</SelectItem>
                  <SelectItem value="premium">プレミアム</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>最大ユーザー数</Label>
              <Input
                type="number"
                value={newTenant.maxUsers}
                onChange={(e) =>
                  setNewTenant({ ...newTenant, maxUsers: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>月額利用料</Label>
              <Input
                type="number"
                value={newTenant.monthlyFee}
                onChange={(e) =>
                  setNewTenant({ ...newTenant, monthlyFee: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>備考</Label>
              <Textarea
                value={newTenant.notes}
                onChange={(e) => setNewTenant({ ...newTenant, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              登録
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 編集ダイアログ */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>加盟店情報の編集</DialogTitle>
          </DialogHeader>
          {editingTenant && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>加盟店コード</Label>
                <Input
                  value={editingTenant.code}
                  onChange={(e) =>
                    setEditingTenant({ ...editingTenant, code: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>店舗名</Label>
                <Input
                  value={editingTenant.name}
                  onChange={(e) =>
                    setEditingTenant({ ...editingTenant, name: e.target.value })
                  }
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>会社名</Label>
                <Input
                  value={editingTenant.companyName}
                  onChange={(e) =>
                    setEditingTenant({ ...editingTenant, companyName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>ステータス</Label>
                <Select
                  value={editingTenant.status}
                  onValueChange={(v) =>
                    setEditingTenant({ ...editingTenant, status: v as Tenant['status'] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">稼働中</SelectItem>
                    <SelectItem value="suspended">一時停止</SelectItem>
                    <SelectItem value="terminated">解約済み</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>プラン</Label>
                <Select
                  value={editingTenant.plan}
                  onValueChange={(v) =>
                    setEditingTenant({ ...editingTenant, plan: v as Tenant['plan'] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">ベーシック</SelectItem>
                    <SelectItem value="standard">スタンダード</SelectItem>
                    <SelectItem value="premium">プレミアム</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>最大ユーザー数</Label>
                <Input
                  type="number"
                  value={editingTenant.maxUsers}
                  onChange={(e) =>
                    setEditingTenant({
                      ...editingTenant,
                      maxUsers: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>月額利用料</Label>
                <Input
                  type="number"
                  value={editingTenant.monthlyFee}
                  onChange={(e) =>
                    setEditingTenant({
                      ...editingTenant,
                      monthlyFee: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>備考</Label>
                <Textarea
                  value={editingTenant.notes || ''}
                  onChange={(e) =>
                    setEditingTenant({ ...editingTenant, notes: e.target.value })
                  }
                  rows={2}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleEdit}>
              <Check className="h-4 w-4 mr-2" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 削除確認 */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>加盟店を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。この加盟店に関連するすべてのデータへのアクセスが失われる可能性があります。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
