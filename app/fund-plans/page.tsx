'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Layout } from '@/components/layout/layout'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { TableSkeleton } from '@/components/ui/skeleton-loaders'
import { HelpTooltip } from '@/components/ui/help-tooltip'
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
import { downloadSampleFundPlan } from '@/lib/sample-excel-export'
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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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
        <Breadcrumb items={[{ label: '資金計画書' }]} />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">資金計画書</h1>
              <HelpTooltip content="お客様向けの資金計画書を作成・管理します。建物価格、諸費用、ローン計画などを計算できます。" />
            </div>
            <p className="text-gray-600 mt-1">資金計画書の作成・管理</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  toast.info('サンプルExcelを生成中...')
                  await downloadSampleFundPlan()
                  toast.success('サンプルをダウンロードしました')
                } catch {
                  toast.error('ダウンロードに失敗しました')
                }
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              サンプル
            </Button>
            <Link href="/customers">
              <Button className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600">
                <Plus className="w-4 h-4 mr-2" />
                新規作成
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">総数</p>
                  <p className="text-2xl font-bold">{fundPlans.length}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">下書き</p>
                  <p className="text-2xl font-bold">
                    {fundPlans.filter((p) => p.status === 'draft').length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Edit className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">提出済</p>
                  <p className="text-2xl font-bold">
                    {fundPlans.filter((p) => p.status === 'submitted').length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Eye className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">承認済</p>
                  <p className="text-2xl font-bold">
                    {fundPlans.filter((p) => p.status === 'approved').length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
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
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-700 text-base mb-2">
                  {searchQuery ? '該当する資金計画書がありません' : '資金計画書がありません'}
                </p>
                <p className="text-gray-600 text-sm mb-4">
                  {searchQuery ? '検索条件を変更してお試しください' : '新規作成ボタンから資金計画書を作成してください'}
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
                            <div className="flex items-center gap-1 text-sm text-gray-700">
                              <User className="w-4 h-4" />
                              {plan.customerName}
                            </div>
                          ) : (
                            <span className="text-gray-500">-</span>
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
                          <div className="flex items-center gap-1 text-sm text-gray-700">
                            <Calendar className="w-4 h-4" />
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
