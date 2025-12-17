'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { Layout } from '@/components/layout/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  FileEdit,
  MapPin,
  Home,
  Wallet,
  User,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  MessageSquare,
} from 'lucide-react'
import { toast } from 'sonner'
import type { PlanRequestStatus } from '@/types/database'

// ステータス設定
const STATUS_CONFIG: Record<PlanRequestStatus, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  '依頼中': { label: '依頼中', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: Clock },
  '作成中': { label: '作成中', color: 'text-orange-700', bgColor: 'bg-orange-100', icon: FileEdit },
  '確認待ち': { label: '確認待ち', color: 'text-purple-700', bgColor: 'bg-purple-100', icon: AlertCircle },
  '修正依頼': { label: '修正依頼', color: 'text-red-700', bgColor: 'bg-red-100', icon: AlertCircle },
  '完了': { label: '完了', color: 'text-green-700', bgColor: 'bg-green-100', icon: CheckCircle },
}

// モックデータ
const mockPlanRequest = {
  id: '1',
  customer_id: '1',
  customer_name: '山田 太郎',
  tei_name: '山田様邸',
  status: '作成中' as PlanRequestStatus,
  designer_name: '設計 一郎',
  land_address: '大阪府豊中市〇〇町1-2-3',
  land_area: 50,
  budget_min: 30000000,
  budget_max: 35000000,
  preferred_rooms: '4LDK',
  preferred_style: 'modern',
  request_details: '・リビングは南向きで20畳以上希望\n・書斎スペースが欲しい\n・駐車場は2台分\n・将来的に2世帯も視野に',
  deadline: '2024-12-25',
  created_at: '2024-12-16T10:00:00Z',
  created_by_name: '営業 太郎',
  comments: [
    {
      id: '1',
      user_name: '設計 一郎',
      department: '設計部',
      content: 'プラン作成を開始しました。ご要望の南向きリビングを優先して配置します。',
      created_at: '2024-12-17T09:00:00Z',
    },
    {
      id: '2',
      user_name: '営業 太郎',
      department: '営業部',
      content: '2世帯については、当面は不要とのことです。ただし将来対応できる構造にしてほしいとのこと。',
      created_at: '2024-12-17T14:00:00Z',
    },
  ],
}

const styleLabels: Record<string, string> = {
  modern: 'モダン',
  natural: 'ナチュラル',
  japanese: '和モダン',
  minimal: 'シンプル・ミニマル',
  industrial: 'インダストリアル',
}

export default function PlanRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [status, setStatus] = useState<PlanRequestStatus>(mockPlanRequest.status)

  const statusConfig = STATUS_CONFIG[status]
  const StatusIcon = statusConfig.icon
  const isOverdue = mockPlanRequest.deadline && new Date(mockPlanRequest.deadline) < new Date() && status !== '完了'

  const handleStatusChange = async (newStatus: PlanRequestStatus) => {
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

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    setIsUpdating(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 300))
      toast.success('コメントを追加しました')
      setNewComment('')
    } catch {
      toast.error('コメントの追加に失敗しました')
    } finally {
      setIsUpdating(false)
    }
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
                  {mockPlanRequest.tei_name}
                </h1>
                <Badge
                  variant="outline"
                  className={`${statusConfig.bgColor} ${statusConfig.color} border-0`}
                >
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusConfig.label}
                </Badge>
                {isOverdue && (
                  <Badge variant="destructive">期限超過</Badge>
                )}
              </div>
              <p className="text-gray-500">プラン依頼詳細</p>
            </div>
          </div>

          <Select
            value={status}
            onValueChange={(value) => handleStatusChange(value as PlanRequestStatus)}
            disabled={isUpdating}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(STATUS_CONFIG) as PlanRequestStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_CONFIG[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 基本情報 */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <FileEdit className="w-5 h-5 mr-2 text-orange-500" />
              基本情報
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-xs text-gray-500 mb-1">顧客名</p>
                <p className="font-medium flex items-center">
                  <User className="w-4 h-4 mr-1 text-gray-400" />
                  {mockPlanRequest.customer_name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">担当設計</p>
                <p className="font-medium">
                  {mockPlanRequest.designer_name || '未割当'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">依頼日</p>
                <p className="font-medium flex items-center">
                  <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                  {new Date(mockPlanRequest.created_at).toLocaleDateString('ja-JP')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">希望納期</p>
                <p className={`font-medium flex items-center ${isOverdue ? 'text-red-600' : ''}`}>
                  <Clock className="w-4 h-4 mr-1 text-gray-400" />
                  {mockPlanRequest.deadline
                    ? new Date(mockPlanRequest.deadline).toLocaleDateString('ja-JP')
                    : '未設定'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 土地情報 */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <MapPin className="w-5 h-5 mr-2 text-orange-500" />
              土地情報
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-500 mb-1">土地住所</p>
                <p className="font-medium">{mockPlanRequest.land_address}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">土地面積</p>
                <p className="font-medium">{mockPlanRequest.land_area}坪</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 希望条件 */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Home className="w-5 h-5 mr-2 text-orange-500" />
              希望条件
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-500 mb-1">希望間取り</p>
                <p className="font-medium">{mockPlanRequest.preferred_rooms || '未設定'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">希望スタイル</p>
                <p className="font-medium">
                  {mockPlanRequest.preferred_style
                    ? styleLabels[mockPlanRequest.preferred_style]
                    : '未設定'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 予算 */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Wallet className="w-5 h-5 mr-2 text-orange-500" />
              予算
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-500 mb-1">予算下限</p>
                <p className="font-medium text-lg">
                  {mockPlanRequest.budget_min
                    ? `¥${mockPlanRequest.budget_min.toLocaleString()}`
                    : '未設定'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">予算上限</p>
                <p className="font-medium text-lg">
                  {mockPlanRequest.budget_max
                    ? `¥${mockPlanRequest.budget_max.toLocaleString()}`
                    : '未設定'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 依頼詳細 */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">依頼詳細・特記事項</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-gray-700">
              {mockPlanRequest.request_details || '特記事項なし'}
            </div>
          </CardContent>
        </Card>

        {/* コメント・やりとり */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <MessageSquare className="w-5 h-5 mr-2 text-orange-500" />
              コメント・やりとり
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* コメント一覧 */}
            <div className="space-y-3">
              {mockPlanRequest.comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{comment.user_name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {comment.department}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleString('ja-JP')}
                    </span>
                  </div>
                  <p className="text-gray-700">{comment.content}</p>
                </div>
              ))}
            </div>

            {/* 新規コメント入力 */}
            <div className="flex space-x-3">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="コメントを入力..."
                rows={2}
                className="flex-1"
              />
              <Button
                onClick={handleAddComment}
                disabled={isUpdating || !newComment.trim()}
                className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
