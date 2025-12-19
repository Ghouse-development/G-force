'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Layout } from '@/components/layout/layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  Plus,
  Search,
  FileText,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Download,
  User,
  Calendar,
} from 'lucide-react'
import { useFundPlanStore } from '@/store'
import { formatCurrency, calculateFundPlan } from '@/lib/fund-plan/calculations'
import { toast } from 'sonner'

const statusConfig = {
  draft: { label: '下書き', color: 'bg-gray-100 text-gray-700' },
  submitted: { label: '提出済', color: 'bg-blue-100 text-blue-700' },
  approved: { label: '承認済', color: 'bg-green-100 text-green-700' },
  rejected: { label: '却下', color: 'bg-red-100 text-red-700' },
}

export default function FundPlansPage() {
  const router = useRouter()
  const { fundPlans, deleteFundPlan } = useFundPlanStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const filteredPlans = useMemo(() => {
    if (!searchQuery) return fundPlans
    const query = searchQuery.toLowerCase()
    return fundPlans.filter(
      (plan) =>
        plan.teiName.toLowerCase().includes(query) ||
        plan.customerName?.toLowerCase().includes(query) ||
        plan.data.constructionAddress?.toLowerCase().includes(query)
    )
  }, [fundPlans, searchQuery])

  const handleDelete = () => {
    if (deleteTarget) {
      deleteFundPlan(deleteTarget)
      toast.success('資金計画書を削除しました')
      setDeleteTarget(null)
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">資金計画書</h1>
            <p className="text-gray-500">資金計画書の作成・管理</p>
          </div>
          <Link href="/fund-plans/new">
            <Button className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600">
              <Plus className="w-4 h-4 mr-2" />
              新規作成
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">総数</p>
                  <p className="text-2xl font-bold">{fundPlans.length}</p>
                </div>
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">下書き</p>
                  <p className="text-2xl font-bold">
                    {fundPlans.filter((p) => p.status === 'draft').length}
                  </p>
                </div>
                <Edit className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">提出済</p>
                  <p className="text-2xl font-bold">
                    {fundPlans.filter((p) => p.status === 'submitted').length}
                  </p>
                </div>
                <Eye className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">承認済</p>
                  <p className="text-2xl font-bold">
                    {fundPlans.filter((p) => p.status === 'approved').length}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">一覧</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredPlans.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  {searchQuery ? '該当する資金計画書がありません' : '資金計画書がありません'}
                </p>
                <Link href="/fund-plans/new">
                  <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    新規作成
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>邸名</TableHead>
                    <TableHead>顧客</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead className="text-right">合計金額</TableHead>
                    <TableHead>作成日</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlans.map((plan) => {
                    const calculation = calculateFundPlan(plan.data)
                    return (
                      <TableRow
                        key={plan.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => router.push(`/fund-plans/${plan.id}`)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-orange-500" />
                            <span className="font-medium">{plan.teiName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {plan.customerName ? (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <User className="w-3 h-3" />
                              {plan.customerName}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig[plan.status].color}>
                            {statusConfig[plan.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(calculation.grandTotal)}円
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Calendar className="w-3 h-3" />
                            {new Date(plan.createdAt).toLocaleDateString('ja-JP')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  router.push(`/fund-plans/${plan.id}`)
                                }}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                編集
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  router.push(`/fund-plans/${plan.id}?export=true`)
                                }}
                              >
                                <Download className="w-4 h-4 mr-2" />
                                PDF出力
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDeleteTarget(plan.id)
                                }}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                削除
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>資金計画書を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。資金計画書が完全に削除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  )
}
