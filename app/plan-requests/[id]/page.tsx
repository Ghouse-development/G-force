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
  FileText,
  MapPin,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  MessageSquare,
  Package,
  Users,
  Search,
  FileCheck,
  ClipboardCheck,
  Ruler,
  Presentation,
  Eye,
  Droplets,
  Hammer,
  Flag,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  type PlanRequestStatus,
  type DesignOffice,
  PLAN_REQUEST_STATUS_ORDER,
  PLAN_REQUEST_STATUS_CONFIG,
  DESIGN_OFFICE_CONFIG,
} from '@/types/database'
import { usePlanRequestStore } from '@/store'

// アイコンマッピング
const ICON_MAP = {
  FileText,
  Search,
  FileCheck,
  ClipboardCheck,
  Users,
  Ruler,
  Presentation,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
}

export default function PlanRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [newComment, setNewComment] = useState('')

  const { getPlanRequest, updatePlanRequestStatus, assignDesignOffice } = usePlanRequestStore()

  const planRequest = getPlanRequest(resolvedParams.id)

  // コメントを別途管理（モック）
  const [comments, setComments] = useState([
    {
      id: '1',
      user_name: '設計 一郎',
      department: '設計部',
      content: 'プラン作成を開始しました。',
      created_at: '2024-12-17T09:00:00Z',
    },
  ])

  if (!planRequest) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto text-center py-12">
          <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">プラン依頼が見つかりません</h2>
          <p className="text-gray-500 mb-4">指定されたプラン依頼は存在しないか、削除されました。</p>
          <Button onClick={() => router.push('/plan-requests')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            一覧に戻る
          </Button>
        </div>
      </Layout>
    )
  }

  const statusConfig = PLAN_REQUEST_STATUS_CONFIG[planRequest.status as PlanRequestStatus]
  const IconComponent = ICON_MAP[statusConfig.icon as keyof typeof ICON_MAP] || FileText
  const isOverdue = planRequest.deadline && new Date(planRequest.deadline) < new Date() && planRequest.status !== '完了'

  const handleStatusChange = async (newStatus: PlanRequestStatus) => {
    setIsUpdating(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 300))
      updatePlanRequestStatus(planRequest.id, newStatus)
      toast.success(`ステータスを「${PLAN_REQUEST_STATUS_CONFIG[newStatus].label}」に更新しました`)
    } catch {
      toast.error('更新に失敗しました')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleAssignOffice = async (office: DesignOffice) => {
    setIsUpdating(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 300))
      assignDesignOffice(planRequest.id, office)
      toast.success(`${office}に割り振りました`)
    } catch {
      toast.error('割り振りに失敗しました')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    setIsUpdating(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 300))
      setComments([
        ...comments,
        {
          id: `c-${Date.now()}`,
          user_name: '現在のユーザー',
          department: '設計部',
          content: newComment,
          created_at: new Date().toISOString(),
        },
      ])
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
                  {planRequest.tei_name}
                </h1>
                <Badge
                  variant="outline"
                  className={`${statusConfig.bgColor} ${statusConfig.color} border-0`}
                >
                  <IconComponent className="w-3 h-3 mr-1" />
                  {statusConfig.label}
                </Badge>
                {isOverdue && (
                  <Badge variant="destructive">期限超過</Badge>
                )}
              </div>
              <p className="text-gray-500">プラン依頼詳細</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* 設計事務所割り振り */}
            {(planRequest.status === '役調完了' || planRequest.status === 'チェック待ち') && !planRequest.design_office && (
              <Select
                onValueChange={(value) => handleAssignOffice(value as DesignOffice)}
                disabled={isUpdating}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="事務所を割り振り" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(DESIGN_OFFICE_CONFIG) as DesignOffice[]).map((office) => (
                    <SelectItem key={office} value={office}>
                      {office}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* ステータス変更 */}
            <Select
              value={planRequest.status}
              onValueChange={(value) => handleStatusChange(value as PlanRequestStatus)}
              disabled={isUpdating}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLAN_REQUEST_STATUS_ORDER.map((s) => (
                  <SelectItem key={s} value={s}>
                    {PLAN_REQUEST_STATUS_CONFIG[s].label}
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
                  {planRequest.customer_name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">設計事務所</p>
                <p className="font-medium">
                  {planRequest.design_office || '未割当'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">担当設計</p>
                <p className="font-medium">
                  {planRequest.designer_name || '未割当'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">期限</p>
                <p className={`font-medium flex items-center ${isOverdue ? 'text-red-600' : ''}`}>
                  <Clock className="w-4 h-4 mr-1 text-gray-400" />
                  {planRequest.deadline
                    ? new Date(planRequest.deadline).toLocaleDateString('ja-JP')
                    : '未設定'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 商品・仕上がり */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Package className="w-5 h-5 mr-2 text-orange-500" />
              商品・仕上がり
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-xs text-gray-500 mb-1">商品</p>
                <p className="font-medium">{planRequest.product_name || '未設定'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">仕上がり</p>
                <p className="font-medium">{planRequest.deliverable_type || '未設定'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">提案日</p>
                <p className="font-medium">
                  {planRequest.proposal_date
                    ? new Date(planRequest.proposal_date).toLocaleDateString('ja-JP')
                    : '未設定'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">契約予定日</p>
                <p className="font-medium">
                  {planRequest.contract_date
                    ? new Date(planRequest.contract_date).toLocaleDateString('ja-JP')
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
                <p className="text-xs text-gray-500 mb-1">建築地</p>
                <p className="font-medium">{planRequest.land_address || '未設定'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">地番</p>
                <p className="font-medium">{planRequest.land_lot_number || '未設定'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">施工面積</p>
                <p className="font-medium">{planRequest.building_area ? `${planRequest.building_area}坪` : '未設定'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">階数</p>
                <p className="font-medium">{planRequest.floors ? `${planRequest.floors}階建て` : '未設定'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 調査関連 */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Search className="w-5 h-5 mr-2 text-orange-500" />
              調査関連
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-xs text-gray-500 mb-1">役所調査</p>
                <p className="font-medium">{planRequest.investigation_type || '未設定'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">水道調査</p>
                <p className="font-medium flex items-center">
                  <Droplets className="w-4 h-4 mr-1 text-blue-400" />
                  {planRequest.water_survey_needed ? '必要' : '不要'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">解体</p>
                <p className="font-medium flex items-center">
                  <Hammer className="w-4 h-4 mr-1 text-gray-400" />
                  {planRequest.demolition_needed ? '必要' : '不要'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">役調期限</p>
                <p className="font-medium">
                  {planRequest.investigation_deadline
                    ? new Date(planRequest.investigation_deadline).toLocaleDateString('ja-JP')
                    : '未設定'}
                </p>
              </div>
            </div>
            {planRequest.investigation_notes && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">役調備考</p>
                <p className="text-sm text-gray-700">{planRequest.investigation_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 競合情報 */}
        {planRequest.has_competitor && (
          <Card className="border-0 shadow-lg border-l-4 border-l-red-400">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Flag className="w-5 h-5 mr-2 text-red-500" />
                競合情報
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-red-700">{planRequest.competitor_name || '競合あり（詳細未設定）'}</p>
            </CardContent>
          </Card>
        )}

        {/* 備考 */}
        {(planRequest.request_details || planRequest.notes) && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">備考・特記事項</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-gray-700">
                {planRequest.request_details || planRequest.notes || '特記事項なし'}
              </div>
            </CardContent>
          </Card>
        )}

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
              {comments.map((comment) => (
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
