'use client'

import { useState, use, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Layout } from '@/components/layout/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  FileText,
  User,
  Home,
  Calendar,
  AlertTriangle,
  FileEdit,
  CheckCircle,
  Clock,
  Send,
  Download,
  Printer,
  Edit,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { useHandoverStore, useCustomerStore, useAuthStore } from '@/store'
import { useDemoData } from '@/hooks/use-demo-data'
import { RelatedDocuments } from '@/components/documents/related-documents'
import type { DocumentStatus } from '@/types/database'

// ステータス設定
const STATUS_CONFIG: Record<DocumentStatus, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  'draft': { label: '下書き', color: 'text-gray-700', bgColor: 'bg-gray-100', icon: FileEdit },
  'submitted': { label: '提出済', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: Send },
  'approved': { label: '承認済', color: 'text-green-700', bgColor: 'bg-green-100', icon: CheckCircle },
  'rejected': { label: '差戻し', color: 'text-red-700', bgColor: 'bg-red-100', icon: Clock },
}

export default function HandoverDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)

  // ストア
  const { user: authUser } = useAuthStore()
  const { handovers, updateHandover, updateHandoverStatus, confirmHandover } = useHandoverStore()
  const { customers: storeCustomers } = useCustomerStore()
  const { isDemoMode, customers: demoCustomers, user: demoUser } = useDemoData()

  const user = isDemoMode ? demoUser : authUser
  const customers = isDemoMode ? demoCustomers : storeCustomers

  // 引継書データを取得
  const handover = useMemo(() => {
    return handovers.find(h => h.id === resolvedParams.id)
  }, [handovers, resolvedParams.id])

  // 関連顧客
  const customer = useMemo(() => {
    if (!handover?.customer_id) return null
    return customers.find(c => c.id === handover.customer_id)
  }, [customers, handover?.customer_id])

  // チェックリスト完了数（handoverがない場合はデフォルト値）
  const checklistStats = useMemo(() => {
    if (!handover) return { total: 0, completed: 0 }
    const total = handover.checklist.reduce((sum, cat) => sum + cat.items.length, 0)
    const completed = handover.checklist.reduce(
      (sum, cat) => sum + cat.items.filter(i => i.checked).length,
      0
    )
    return { total, completed }
  }, [handover])

  // 引継書が見つからない場合
  if (!handover) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto text-center py-12">
          <p className="text-gray-500 mb-4">引継書が見つかりません</p>
          <Button onClick={() => router.push('/handovers')}>
            一覧に戻る
          </Button>
        </div>
      </Layout>
    )
  }

  const statusConfig = STATUS_CONFIG[handover.status]
  const StatusIcon = statusConfig.icon

  const handleStatusChange = async (newStatus: DocumentStatus) => {
    setIsUpdating(true)
    try {
      updateHandoverStatus(handover.id, newStatus)
      toast.success(`ステータスを「${STATUS_CONFIG[newStatus].label}」に更新しました`)
    } catch {
      toast.error('更新に失敗しました')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleChecklistChange = async (categoryIndex: number, itemIndex: number, checked: boolean) => {
    const newChecklist = handover.checklist.map((cat, cIdx) => {
      if (cIdx !== categoryIndex) return cat
      return {
        ...cat,
        items: cat.items.map((item, iIdx) => {
          if (iIdx !== itemIndex) return item
          return { ...item, checked }
        }),
      }
    })
    updateHandover(handover.id, { checklist: newChecklist })
    toast.success('チェックリストを更新しました')
  }

  const handleConfirm = () => {
    if (!user) return
    confirmHandover(handover.id, user.id, user.name)
    toast.success('引継書を承認しました')
  }

  const handlePrint = () => {
    toast.success('印刷プレビューを開きます')
    window.print()
  }

  const handleDownloadPDF = () => {
    toast.success('PDFをダウンロードしています...')
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {handover.tei_name || '引継書'}
                </h1>
                <Badge
                  variant="outline"
                  className={`${statusConfig.bgColor} ${statusConfig.color} border-0`}
                >
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusConfig.label}
                </Badge>
              </div>
              <p className="text-gray-500">引継書</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              印刷
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Select
              value={handover.status}
              onValueChange={(value) => handleStatusChange(value as DocumentStatus)}
              disabled={isUpdating}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUS_CONFIG) as DocumentStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_CONFIG[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 基本情報 */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <FileText className="w-5 h-5 mr-2 text-orange-500" />
              基本情報
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-xs text-gray-500 mb-1">顧客名</p>
                <p className="font-medium flex items-center">
                  <User className="w-4 h-4 mr-1 text-gray-400" />
                  {handover.customer_name || '未設定'}
                  {customer && (
                    <Link href={`/customers/${customer.id}`}>
                      <ExternalLink className="w-3 h-3 ml-1 text-blue-500" />
                    </Link>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">電話番号</p>
                <p className="font-medium">{customer?.phone || '未設定'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">営業担当（引継元）</p>
                <p className="font-medium">{handover.from_user_name || '未設定'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">工事担当（引継先）</p>
                <p className="font-medium">{handover.to_user_name || '未設定'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">スケジュール</p>
                <p className="font-medium flex items-center">
                  <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                  {handover.schedule_notes || '未定'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 引継チェックリスト */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
                引継チェックリスト
              </span>
              <span className="text-sm font-normal text-gray-500">
                {checklistStats.completed} / {checklistStats.total} 完了
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {handover.checklist.map((category, catIdx) => (
                <div key={category.category}>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">{category.category}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {category.items.map((item, itemIdx) => (
                      <div key={`${catIdx}-${itemIdx}`} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${catIdx}-${itemIdx}`}
                          checked={item.checked}
                          onCheckedChange={(checked) => handleChecklistChange(catIdx, itemIdx, checked as boolean)}
                        />
                        <Label
                          htmlFor={`${catIdx}-${itemIdx}`}
                          className={`text-sm cursor-pointer ${
                            item.checked ? 'text-green-700 line-through' : ''
                          }`}
                        >
                          {item.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 顧客情報 */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <User className="w-5 h-5 mr-2 text-orange-500" />
              顧客情報
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 mb-2">お客様の性格・傾向</p>
              <div className="bg-yellow-50 rounded-lg p-4 text-gray-700 whitespace-pre-wrap">
                {handover.customer_notes || '記載なし'}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2">特別なご要望・こだわり</p>
              <div className="bg-blue-50 rounded-lg p-4 whitespace-pre-wrap text-gray-700">
                {handover.special_notes || '記載なし'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 現場情報 */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Home className="w-5 h-5 mr-2 text-orange-500" />
              現場情報・注意事項
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 rounded-lg p-4 whitespace-pre-wrap text-gray-700">
              {handover.site_notes || '記載なし'}
            </div>
          </CardContent>
        </Card>

        {/* 確認情報 */}
        {handover.confirmed_at && (
          <Card className="border-0 shadow-lg bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center text-green-700">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span>
                  {handover.confirmed_by_name} が {new Date(handover.confirmed_at).toLocaleString('ja-JP')} に確認しました
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 関連書類 */}
        {handover.customer_id && (
          <RelatedDocuments
            customerId={handover.customer_id}
            currentType="handover"
            currentId={handover.id}
          />
        )}

        {/* 更新履歴 */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>
                作成: {new Date(handover.created_at).toLocaleString('ja-JP')} ({handover.from_user_name || '不明'})
              </span>
              <span>
                更新: {new Date(handover.updated_at).toLocaleString('ja-JP')}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* アクション */}
        <div className="flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/handovers/${resolvedParams.id}/edit`)}
          >
            <Edit className="w-4 h-4 mr-2" />
            編集
          </Button>
          {handover.status === 'draft' && (
            <Button
              onClick={() => handleStatusChange('submitted')}
              disabled={isUpdating}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
            >
              <Send className="w-4 h-4 mr-2" />
              提出する
            </Button>
          )}
          {handover.status === 'submitted' && !handover.confirmed_at && (
            <Button
              onClick={handleConfirm}
              disabled={isUpdating}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              確認完了
            </Button>
          )}
        </div>
      </div>
    </Layout>
  )
}
