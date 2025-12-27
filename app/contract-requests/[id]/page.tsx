'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Layout } from '@/components/layout/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  FileEdit,
  User,
  Building,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Send,
  Edit,
  FileOutput,
  Plus,
} from 'lucide-react'
import { useAuthStore } from '@/store'
import { toast } from 'sonner'
import type { ContractRequestStatus, UserRole } from '@/types/database'
import { ROLE_CONFIG } from '@/types/database'

// 承認フローのステップ定義
const APPROVAL_STEPS = [
  { id: 'leader_review', name: '営業リーダー確認', role: 'sales_leader' as UserRole, description: '内容確認・書類チェック' },
  { id: 'manager_review', name: '設計・工事部門長確認', roles: ['design_manager', 'construction_manager'] as UserRole[], description: '図面・金額・工期確認' },
  { id: 'complete', name: '承認完了', description: '営業事務へ通知' },
]

// モック詳細データ
interface ContractRequestDetail {
  id: string
  customer_id: string
  customer_name: string
  customer_phone: string
  customer_email: string
  customer_address: string
  tei_name: string
  status: ContractRequestStatus
  product_name: string
  building_area: number
  total_amount: number
  building_price: number
  option_price: number
  exterior_price: number
  discount_amount: number
  tax_amount: number
  contract_date: string
  groundbreaking_date: string
  handover_date: string
  fund_plan_id: string
  handover_id: string
  notes: string
  created_by: string
  created_by_name: string
  created_at: string
  updated_at: string
  // 承認履歴
  approval_history: {
    step_id: string
    action: 'approve' | 'reject'
    actor_id: string
    actor_name: string
    actor_role: UserRole
    comment: string
    created_at: string
  }[]
}

const mockDetail: ContractRequestDetail = {
  id: '1',
  customer_id: 'cust-001',
  customer_name: '山田 太郎',
  customer_phone: '090-1234-5678',
  customer_email: 'yamada@example.com',
  customer_address: '愛知県名古屋市中区栄1-1-1',
  tei_name: '山田様邸',
  status: 'pending_leader',
  product_name: 'LIFE+ Limited',
  building_area: 35.5,
  total_amount: 42000000,
  building_price: 38000000,
  option_price: 2500000,
  exterior_price: 1500000,
  discount_amount: 500000,
  tax_amount: 3800000,
  contract_date: '2024-12-20',
  groundbreaking_date: '2025-02-01',
  handover_date: '2025-08-15',
  fund_plan_id: 'fp-001',
  handover_id: 'ho-001',
  notes: '特記事項：土地の北側に電柱あり。',
  created_by: '00000000-0000-0000-0000-000000000101',
  created_by_name: '田畑 美香',
  created_at: '2024-12-15T10:00:00Z',
  updated_at: '2024-12-15T10:00:00Z',
  approval_history: [],
}

// ステータス設定
const STATUS_CONFIG: Record<ContractRequestStatus, {
  label: string
  color: string
  bgColor: string
  icon: typeof Clock
}> = {
  draft: { label: '下書き', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: FileEdit },
  pending_leader: { label: '営業リーダー確認待ち', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Clock },
  pending_managers: { label: '部門長確認待ち', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: Clock },
  revision: { label: '修正中', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: AlertCircle },
  approved: { label: '承認完了', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle2 },
  rejected: { label: '却下', color: 'text-red-600', bgColor: 'bg-red-100', icon: XCircle },
}

export default function ContractRequestDetailPage() {
  const params = useParams()
  const { user } = useAuthStore()
  const [detail, setDetail] = useState<ContractRequestDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showActionDialog, setShowActionDialog] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // モックデータを読み込み
    setTimeout(() => {
      setDetail(mockDetail)
      setIsLoading(false)
    }, 500)
  }, [params.id])

  // ユーザーがアクション可能か判定
  const canAct = (): boolean => {
    if (!detail || !user) return false
    const role = user.role as UserRole

    switch (detail.status) {
      case 'draft':
        return detail.created_by === user.id
      case 'pending_leader':
        return role === 'sales_leader' || role === 'admin'
      case 'pending_managers':
        return role === 'design_manager' || role === 'construction_manager' || role === 'admin'
      case 'revision':
        return detail.created_by === user.id
      default:
        return false
    }
  }

  // アクション実行
  const handleAction = async () => {
    if (!detail || !actionType || !user) return

    setIsSubmitting(true)
    try {
      // TODO: 実際のAPIコール
      await new Promise(resolve => setTimeout(resolve, 1000))

      // ステータス更新（モック）
      let newStatus: ContractRequestStatus = detail.status
      if (actionType === 'approve') {
        if (detail.status === 'pending_leader') {
          newStatus = 'pending_managers'
        } else if (detail.status === 'pending_managers') {
          newStatus = 'approved'
        } else if (detail.status === 'draft' || detail.status === 'revision') {
          newStatus = 'pending_leader'
        }
      } else {
        newStatus = 'revision'
      }

      setDetail({
        ...detail,
        status: newStatus,
        approval_history: [
          ...detail.approval_history,
          {
            step_id: detail.status,
            action: actionType,
            actor_id: user.id,
            actor_name: user.name,
            actor_role: user.role as UserRole,
            comment,
            created_at: new Date().toISOString(),
          },
        ],
        updated_at: new Date().toISOString(),
      })

      toast.success(
        actionType === 'approve'
          ? '承認しました'
          : '差戻ししました'
      )

      setShowActionDialog(false)
      setActionType(null)
      setComment('')
    } catch (error) {
      toast.error('エラーが発生しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 申請ボタン
  const handleSubmit = () => {
    setActionType('approve')
    setShowActionDialog(true)
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </Layout>
    )
  }

  if (!detail) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600">契約依頼が見つかりません</p>
          <Link href="/contract-requests">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              一覧に戻る
            </Button>
          </Link>
        </div>
      </Layout>
    )
  }

  const statusConfig = STATUS_CONFIG[detail.status]
  const StatusIcon = statusConfig.icon

  // 現在のステップを判定
  const getCurrentStepIndex = (): number => {
    switch (detail.status) {
      case 'draft':
      case 'revision':
        return -1
      case 'pending_leader':
        return 0
      case 'pending_managers':
        return 1
      case 'approved':
        return 2
      default:
        return -1
    }
  }

  const currentStepIndex = getCurrentStepIndex()

  return (
    <Layout>
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: '契約依頼', href: '/contract-requests' },
            { label: detail.tei_name },
          ]}
        />

        {/* ヘッダー */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${statusConfig.bgColor}`}>
              <StatusIcon className={`w-7 h-7 ${statusConfig.color}`} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {detail.tei_name}
                </h1>
                <Badge className={`${statusConfig.bgColor} ${statusConfig.color}`}>
                  {statusConfig.label}
                </Badge>
              </div>
              <p className="text-gray-600 mt-1">
                作成: {detail.created_by_name} | {new Date(detail.created_at).toLocaleDateString('ja-JP')}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {(detail.status === 'draft' || detail.status === 'revision') && canAct() && (
              <>
                <Link href={`/contract-requests/${detail.id}/edit`}>
                  <Button variant="outline">
                    <Edit className="w-4 h-4 mr-2" />
                    編集
                  </Button>
                </Link>
                <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
                  <Send className="w-4 h-4 mr-2" />
                  {detail.status === 'revision' ? '再申請' : '承認申請'}
                </Button>
              </>
            )}
            {(detail.status === 'pending_leader' || detail.status === 'pending_managers') && canAct() && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setActionType('reject')
                    setShowActionDialog(true)
                  }}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  差戻し
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setActionType('approve')
                    setShowActionDialog(true)
                  }}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  承認
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* メインコンテンツ */}
          <div className="lg:col-span-2 space-y-6">
            {/* 顧客情報 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5" />
                  顧客情報
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">顧客名</p>
                  <p className="font-medium">{detail.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> 電話番号
                  </p>
                  <p className="font-medium">{detail.customer_phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> メールアドレス
                  </p>
                  <p className="font-medium">{detail.customer_email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> 住所
                  </p>
                  <p className="font-medium">{detail.customer_address}</p>
                </div>
              </CardContent>
            </Card>

            {/* 物件・契約情報 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  物件・契約情報
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">商品名</p>
                    <p className="font-medium">{detail.product_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">施工面積</p>
                    <p className="font-medium">{detail.building_area}坪</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">契約予定日</p>
                    <p className="font-medium">
                      {new Date(detail.contract_date).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">着工予定日</p>
                    <p className="font-medium">
                      {new Date(detail.groundbreaking_date).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">引渡予定日</p>
                    <p className="font-medium">
                      {new Date(detail.handover_date).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                </div>

                {/* 金額明細 */}
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium mb-3">金額明細</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">建物本体価格</span>
                      <span>¥{detail.building_price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">オプション</span>
                      <span>¥{detail.option_price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">外構工事</span>
                      <span>¥{detail.exterior_price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>値引き</span>
                      <span>-¥{detail.discount_amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">消費税</span>
                      <span>¥{detail.tax_amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>合計</span>
                      <span>¥{detail.total_amount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 備考 */}
            {detail.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">備考</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{detail.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* 関連書類 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileOutput className="w-5 h-5" />
                  関連書類
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {detail.fund_plan_id ? (
                  <Link href={`/fund-plans/${detail.fund_plan_id}`}>
                    <Button variant="outline" className="w-full justify-start">
                      <FileEdit className="w-4 h-4 mr-2" />
                      資金計画書を確認
                    </Button>
                  </Link>
                ) : (
                  <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
                    資金計画書が紐づいていません
                  </div>
                )}

                {/* 引継書セクション */}
                {detail.handover_id ? (
                  <Link href={`/handovers/${detail.handover_id}`}>
                    <Button variant="outline" className="w-full justify-start">
                      <FileOutput className="w-4 h-4 mr-2" />
                      引継書を確認
                    </Button>
                  </Link>
                ) : (
                  <Link href={`/handovers/new?customer_id=${detail.customer_id}&contract_id=${detail.id}`}>
                    <Button
                      className="w-full justify-start bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      引継書を作成
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>

          {/* サイドバー - 承認フロー */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  承認フロー
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {APPROVAL_STEPS.map((step, index) => {
                    const isCompleted = index < currentStepIndex
                    const isCurrent = index === currentStepIndex
                    const isPending = index > currentStepIndex

                    return (
                      <div key={step.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              isCompleted
                                ? 'bg-green-100 text-green-600'
                                : isCurrent
                                ? 'bg-orange-100 text-orange-600'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : isCurrent ? (
                              <Clock className="w-5 h-5" />
                            ) : (
                              <div className="w-3 h-3 rounded-full bg-current" />
                            )}
                          </div>
                          {index < APPROVAL_STEPS.length - 1 && (
                            <div
                              className={`w-0.5 h-8 ${
                                isCompleted ? 'bg-green-200' : 'bg-gray-200'
                              }`}
                            />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className={`font-medium ${isCurrent ? 'text-orange-600' : ''}`}>
                            {step.name}
                          </p>
                          <p className="text-sm text-gray-500">{step.description}</p>
                          {'role' in step && step.role && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              {ROLE_CONFIG[step.role as keyof typeof ROLE_CONFIG]?.label}
                            </Badge>
                          )}
                          {'roles' in step && step.roles && Array.isArray(step.roles) && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {step.roles.map((role: string) => (
                                <Badge key={role} variant="outline" className="text-xs">
                                  {ROLE_CONFIG[role as keyof typeof ROLE_CONFIG]?.label}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* 承認履歴 */}
            {detail.approval_history.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">承認履歴</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {detail.approval_history.map((history, index) => (
                      <div key={index} className="border-b pb-3 last:border-0">
                        <div className="flex items-center gap-2">
                          <Badge
                            className={
                              history.action === 'approve'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }
                          >
                            {history.action === 'approve' ? '承認' : '差戻し'}
                          </Badge>
                          <span className="font-medium">{history.actor_name}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {ROLE_CONFIG[history.actor_role]?.label} |{' '}
                          {new Date(history.created_at).toLocaleString('ja-JP')}
                        </p>
                        {history.comment && (
                          <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-2 rounded">
                            {history.comment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* アクションダイアログ */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? '承認の確認' : '差戻しの確認'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve'
                ? 'この契約依頼を承認しますか？'
                : '差戻し理由を入力してください。'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Textarea
              placeholder={actionType === 'approve' ? 'コメント（任意）' : '差戻し理由（必須）'}
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowActionDialog(false)
                setActionType(null)
                setComment('')
              }}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleAction}
              disabled={isSubmitting || (actionType === 'reject' && !comment)}
              className={
                actionType === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }
            >
              {isSubmitting ? '処理中...' : actionType === 'approve' ? '承認' : '差戻し'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  )
}
