'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
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
} from 'lucide-react'
import { toast } from 'sonner'
import type { DocumentStatus } from '@/types/database'

// ステータス設定
const STATUS_CONFIG: Record<DocumentStatus, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  'draft': { label: '下書き', color: 'text-gray-700', bgColor: 'bg-gray-100', icon: FileEdit },
  'submitted': { label: '提出済', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: Send },
  'approved': { label: '承認済', color: 'text-green-700', bgColor: 'bg-green-100', icon: CheckCircle },
  'rejected': { label: '差戻し', color: 'text-red-700', bgColor: 'bg-red-100', icon: Clock },
}

// 引継チェックリスト項目
const checklistItems = [
  { id: 'contract_confirmed', label: '契約内容確認', category: '契約関連' },
  { id: 'drawings_handed', label: '図面引渡', category: '契約関連' },
  { id: 'specifications_confirmed', label: '仕様確認', category: '契約関連' },
  { id: 'schedule_confirmed', label: '工程確認', category: 'スケジュール' },
  { id: 'groundbreaking_date_set', label: '着工日確定', category: 'スケジュール' },
  { id: 'completion_date_set', label: '完成予定日確定', category: 'スケジュール' },
  { id: 'customer_preferences', label: '顧客要望共有', category: '顧客情報' },
  { id: 'special_notes', label: '特記事項共有', category: '顧客情報' },
  { id: 'neighbor_info', label: '近隣情報共有', category: '現場情報' },
  { id: 'site_access', label: '現場アクセス確認', category: '現場情報' },
]

// モックデータ
const mockHandover = {
  id: '1',
  customer_id: '1',
  customer_name: '山田 太郎',
  customer_phone: '090-1234-5678',
  tei_name: '山田様邸',
  status: 'submitted' as DocumentStatus,
  sales_staff_name: '営業 太郎',
  construction_manager_name: '工事 一郎',
  handover_date: '2024-12-20',
  contract_summary: '・木造2階建て\n・延床面積: 35.5坪\n・契約金額: 3,800万円（税込）\n・着工: 2025/2/1、完成: 2025/6/30',
  customer_character: '細かいことを気にされる方。連絡はメールより電話を好む。返信は遅め（1-2日）。',
  special_requests: '・収納スペースへの強いこだわり\n・北側の窓は大きめに\n・キッチンは対面式必須\n・将来的な2世帯への拡張を視野に',
  site_notes: '・近隣への配慮が必要（特に北側の〇〇様）\n・駐車スペースは前面道路のみ\n・工事車両の進入は北側から',
  checklist_completed: ['contract_confirmed', 'drawings_handed', 'specifications_confirmed', 'schedule_confirmed', 'groundbreaking_date_set', 'customer_preferences'],
  created_at: '2024-12-16T10:00:00Z',
  created_by_name: '営業 太郎',
  updated_at: '2024-12-17T15:00:00Z',
}

export default function HandoverDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [status, setStatus] = useState<DocumentStatus>(mockHandover.status)
  const [checklistCompleted, setChecklistCompleted] = useState<string[]>(mockHandover.checklist_completed)

  const statusConfig = STATUS_CONFIG[status]
  const StatusIcon = statusConfig.icon

  const handleStatusChange = async (newStatus: DocumentStatus) => {
    setIsUpdating(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 300))
      setStatus(newStatus)
      toast.success(`ステータスを「${STATUS_CONFIG[newStatus].label}」に更新しました`)
    } catch {
      toast.error('更新に失敗しました')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleChecklistChange = async (itemId: string, checked: boolean) => {
    const newChecklist = checked
      ? [...checklistCompleted, itemId]
      : checklistCompleted.filter(id => id !== itemId)

    setChecklistCompleted(newChecklist)
    toast.success('チェックリストを更新しました')
  }

  const handlePrint = () => {
    toast.success('印刷プレビューを開きます')
    window.print()
  }

  const handleDownloadPDF = () => {
    toast.success('PDFをダウンロードしています...')
  }

  // チェックリストをカテゴリ別にグループ化
  const groupedChecklist = checklistItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, typeof checklistItems>)

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
                  {mockHandover.tei_name}
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
              value={status}
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
                  {mockHandover.customer_name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">電話番号</p>
                <p className="font-medium">{mockHandover.customer_phone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">営業担当</p>
                <p className="font-medium">{mockHandover.sales_staff_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">工事担当</p>
                <p className="font-medium">{mockHandover.construction_manager_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">引渡予定日</p>
                <p className="font-medium flex items-center">
                  <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                  {mockHandover.handover_date
                    ? new Date(mockHandover.handover_date).toLocaleDateString('ja-JP')
                    : '未定'}
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
                {checklistCompleted.length} / {checklistItems.length} 完了
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(groupedChecklist).map(([category, items]) => (
                <div key={category}>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">{category}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={item.id}
                          checked={checklistCompleted.includes(item.id)}
                          onCheckedChange={(checked) => handleChecklistChange(item.id, checked as boolean)}
                        />
                        <Label
                          htmlFor={item.id}
                          className={`text-sm cursor-pointer ${
                            checklistCompleted.includes(item.id)
                              ? 'text-green-700 line-through'
                              : ''
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
              <div className="bg-yellow-50 rounded-lg p-4 text-gray-700">
                {mockHandover.customer_character || '記載なし'}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2">特別なご要望・こだわり</p>
              <div className="bg-blue-50 rounded-lg p-4 whitespace-pre-wrap text-gray-700">
                {mockHandover.special_requests || '記載なし'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 契約概要 */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Home className="w-5 h-5 mr-2 text-orange-500" />
              契約概要
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-gray-700">
              {mockHandover.contract_summary || '記載なし'}
            </div>
          </CardContent>
        </Card>

        {/* 現場情報 */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Calendar className="w-5 h-5 mr-2 text-orange-500" />
              現場情報・注意事項
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 rounded-lg p-4 whitespace-pre-wrap text-gray-700">
              {mockHandover.site_notes || '記載なし'}
            </div>
          </CardContent>
        </Card>

        {/* 更新履歴 */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>
                作成: {new Date(mockHandover.created_at).toLocaleString('ja-JP')} ({mockHandover.created_by_name})
              </span>
              <span>
                更新: {new Date(mockHandover.updated_at).toLocaleString('ja-JP')}
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
          {status === 'draft' && (
            <Button
              onClick={() => handleStatusChange('submitted')}
              disabled={isUpdating}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
            >
              <Send className="w-4 h-4 mr-2" />
              提出する
            </Button>
          )}
          {status === 'submitted' && (
            <Button
              onClick={() => handleStatusChange('approved')}
              disabled={isUpdating}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              承認
            </Button>
          )}
        </div>
      </div>
    </Layout>
  )
}
