'use client'

import { useState, use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Layout } from '@/components/layout/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  ArrowLeft,
  FileSignature,
  Home,
  Wallet,
  User,
  Users,
  FileEdit,
  FileSearch,
  UserCheck,
  CheckCircle2,
  Download,
  Printer,
  Edit,
  Send,
  Check,
  RotateCcw,
  AlertTriangle,
  FileText,
  CreditCard,
  Shield,
  History,
  MessageSquare,
  Building,
  MapPin,
  FileSpreadsheet,
} from 'lucide-react'
import { toast } from 'sonner'
import { useContractStore, useNotificationStore } from '@/store'
import { useAuthStore } from '@/store'
import { ContractAttachments } from '@/components/contracts/contract-attachments'
import type { ContractStatus, UserRole } from '@/types/database'
import {
  CONTRACT_STATUS_CONFIG,
  CONTRACT_STATUS_TRANSITIONS,
  getAvailableContractActions,
  checkContractPermission,
} from '@/types/database'
import { generateContractPDF } from '@/lib/contract/pdf-generator'
import { exportContractToExcel, type ContractData } from '@/lib/excel-export'
import { RelatedDocuments } from '@/components/documents/related-documents'

// アイコンマッピング
const STATUS_ICONS: Record<ContractStatus, typeof FileEdit> = {
  '作成中': FileEdit,
  '書類確認': FileSearch,
  '上長承認待ち': UserCheck,
  '契約完了': CheckCircle2,
}

export default function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [showReturnDialog, setShowReturnDialog] = useState(false)
  const [comment, setComment] = useState('')
  const [returnReason, setReturnReason] = useState('')

  const { getContract, submitForApproval, approveContract, returnContract } = useContractStore()
  const { user } = useAuthStore()
  const { addContractNotification } = useNotificationStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  const contract = mounted ? getContract(resolvedParams.id) : null

  if (!mounted) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
        </div>
      </Layout>
    )
  }

  if (!contract) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <FileSignature className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">契約書が見つかりません</p>
              <Link href="/contracts">
                <Button className="mt-4" variant="outline">
                  一覧に戻る
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </Layout>
    )
  }

  const statusConfig = CONTRACT_STATUS_CONFIG[contract.status] || {
    label: contract.status || '未設定',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: 'FileText',
  }
  const StatusIcon = STATUS_ICONS[contract.status] || FileText
  // transitions available for future use
  const _transitions = CONTRACT_STATUS_TRANSITIONS[contract.status]

  // 権限に基づく利用可能なアクションを取得
  const userRole = (user?.role || 'staff') as UserRole
  const userId = user?.id || 'unknown'
  const availableActionsWithPermission = getAvailableContractActions(
    contract.status,
    userRole,
    userId,
    contract.created_by,
    contract.checked_by
  )

  // 有効なアクション（許可されているもの）
  const enabledActions = availableActionsWithPermission.filter(a => a.enabled)
  // 無効なアクション（権限不足など）
  const disabledActions = availableActionsWithPermission.filter(a => !a.enabled)

  // 承認申請
  const handleSubmitForApproval = async () => {
    // 権限チェック
    const permission = checkContractPermission({
      userRole,
      userId,
      contractStatus: contract.status,
      action: '承認申請',
      contractCreatedBy: contract.created_by,
      contractCheckedBy: contract.checked_by,
    })
    if (!permission.allowed) {
      toast.error(permission.reason || '権限がありません')
      return
    }

    setIsSubmitting(true)
    try {
      const success = submitForApproval(
        contract.id,
        user?.id || 'unknown',
        user?.name || '不明'
      )
      if (success) {
        // 通知を送信
        addContractNotification({
          contractId: contract.id,
          contractNumber: contract.contract_number || '',
          teiName: contract.tei_name || '',
          action: 'submitted',
          actorName: user?.name || '不明',
        })
        toast.success('承認申請を送信しました')
      } else {
        toast.error('承認申請に失敗しました')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // 承認
  const handleApprove = async () => {
    // 権限チェック
    const permission = checkContractPermission({
      userRole,
      userId,
      contractStatus: contract.status,
      action: '承認',
      contractCreatedBy: contract.created_by,
      contractCheckedBy: contract.checked_by,
    })
    if (!permission.allowed) {
      toast.error(permission.reason || '権限がありません')
      setShowApprovalDialog(false)
      return
    }

    setIsSubmitting(true)
    try {
      const success = approveContract(
        contract.id,
        user?.id || 'unknown',
        user?.name || '不明',
        comment
      )
      if (success) {
        // 次のステータスが「契約完了」かどうかで通知タイプを分ける
        const nextStatus = CONTRACT_STATUS_TRANSITIONS[contract.status].next
        const notificationAction = nextStatus === '契約完了' ? 'completed' : 'approved'

        addContractNotification({
          contractId: contract.id,
          contractNumber: contract.contract_number || '',
          teiName: contract.tei_name || '',
          action: notificationAction,
          actorName: user?.name || '不明',
          comment: comment || undefined,
        })
        toast.success('承認しました')
        setShowApprovalDialog(false)
        setComment('')
      } else {
        toast.error('承認に失敗しました')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // 差戻し
  const handleReturn = async () => {
    if (!returnReason.trim()) {
      toast.error('差戻し理由を入力してください')
      return
    }

    // 権限チェック
    const permission = checkContractPermission({
      userRole,
      userId,
      contractStatus: contract.status,
      action: '差戻し',
      contractCreatedBy: contract.created_by,
      contractCheckedBy: contract.checked_by,
    })
    if (!permission.allowed) {
      toast.error(permission.reason || '権限がありません')
      setShowReturnDialog(false)
      return
    }

    setIsSubmitting(true)
    try {
      const success = returnContract(
        contract.id,
        user?.id || 'unknown',
        user?.name || '不明',
        returnReason
      )
      if (success) {
        // 通知を送信
        addContractNotification({
          contractId: contract.id,
          contractNumber: contract.contract_number || '',
          teiName: contract.tei_name || '',
          action: 'returned',
          actorName: user?.name || '不明',
          comment: returnReason,
        })
        toast.success('差戻ししました')
        setShowReturnDialog(false)
        setReturnReason('')
      } else {
        toast.error('差戻しに失敗しました')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePrint = () => {
    toast.success('印刷プレビューを開きます')
    window.print()
  }

  const handleDownloadPDF = async () => {
    if (!contract) return
    try {
      toast.info('PDFを生成しています...')
      await generateContractPDF(contract, {
        filename: `請負契約書_${contract.tei_name || '未設定'}_${contract.contract_number || ''}.pdf`
      })
      toast.success('PDFをダウンロードしました')
    } catch (error) {
      console.error('PDF生成エラー:', error)
      toast.error('PDF生成に失敗しました')
    }
  }

  const handleDownloadExcel = () => {
    if (!contract) return
    try {
      const totalAmount = contract.total_amount || 0
      const contractData: ContractData = {
        contractNumber: contract.contract_number || '',
        contractDate: contract.contract_date || new Date().toISOString(),
        customerName: contract.customer_name || '',
        customerAddress: contract.land_address || '',
        customerPhone: undefined,
        teiName: contract.tei_name || '',
        constructionAddress: contract.land_address || '',
        constructionArea: contract.building_area || 0,
        contractAmount: Math.floor(totalAmount / 1.1),
        taxAmount: contract.tax_amount || Math.floor(totalAmount * 0.1 / 1.1),
        totalAmount: totalAmount,
        startDate: '',
        completionDate: '',
        deliveryDate: '',
        paymentTerms: {
          atContract: { amount: contract.payment_at_contract || 0, date: contract.contract_date || '' },
          atStart: { amount: contract.payment_at_start || 0, date: '' },
          atFraming: { amount: contract.payment_at_frame || 0, date: '' },
          atCompletion: { amount: contract.payment_at_completion || 0, date: '' },
        },
        specifications: contract.product_name || undefined,
        notes: undefined,
        salesRep: contract.sales_person || '',
        managerName: '',
      }
      exportContractToExcel(contractData)
      toast.success('Excelをダウンロードしました')
    } catch (error) {
      console.error('Excel生成エラー:', error)
      toast.error('Excel生成に失敗しました')
    }
  }

  // 金額フォーマット
  const formatCurrency = (amount: number | null | undefined) => {
    if (amount == null) return '-'
    return `¥${amount.toLocaleString()}`
  }

  // 日付フォーマット
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('ja-JP')
  }

  const formatDateTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('ja-JP')
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {contract.tei_name || '未設定'}
                </h1>
                <Badge
                  variant="outline"
                  className={`${statusConfig.bgColor} ${statusConfig.color} border-0`}
                >
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusConfig.label}
                </Badge>
                {contract.contract_number && (
                  <span className="text-gray-500 text-sm">
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
              <p className="text-gray-500">請負契約書 - {statusConfig.description}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              印刷
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadExcel}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Excel
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>

        {/* 承認フロー進捗 */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              {(['作成中', '書類確認', '上長承認待ち', '契約完了'] as ContractStatus[]).map((status, index) => {
                const config = CONTRACT_STATUS_CONFIG[status]
                const Icon = STATUS_ICONS[status]
                const isActive = contract.status === status
                const isPassed = ['作成中', '書類確認', '上長承認待ち', '契約完了'].indexOf(contract.status) > index

                return (
                  <div key={status} className="flex items-center flex-1">
                    <div className={`flex flex-col items-center flex-1 ${index > 0 ? 'ml-4' : ''}`}>
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isActive
                            ? `${config.bgColor} ring-4 ring-offset-2 ring-${config.color.replace('text-', '')}`
                            : isPassed
                            ? 'bg-green-100'
                            : 'bg-gray-100'
                        }`}
                      >
                        {isPassed ? (
                          <Check className="w-5 h-5 text-green-600" />
                        ) : (
                          <Icon className={`w-5 h-5 ${isActive ? config.color : 'text-gray-400'}`} />
                        )}
                      </div>
                      <span className={`text-xs mt-2 ${isActive ? 'font-bold ' + config.color : 'text-gray-500'}`}>
                        {config.label}
                      </span>
                    </div>
                    {index < 3 && (
                      <div className={`h-0.5 flex-1 ${isPassed ? 'bg-green-300' : 'bg-gray-200'}`} />
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* 差戻しコメント表示 */}
        {contract.return_comment && (
          <Card className="border-0 shadow-lg border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-700">差戻しコメント</p>
                  <p className="text-gray-700 mt-1">{contract.return_comment}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {contract.returned_by_name} - {formatDateTime(contract.returned_at)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* アクションボタン */}
        {availableActionsWithPermission.length > 0 && (
          <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-50 to-yellow-50">
            <CardContent className="p-4">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">アクション</p>
                    <p className="text-sm text-gray-500">
                      現在のステータス: {statusConfig.label}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    {/* 編集ボタン（保存権限がある場合） */}
                    {enabledActions.find(a => a.action === '保存') && contract.status === '作成中' && (
                      <Link href={`/contracts/${contract.id}/edit`}>
                        <Button variant="outline">
                          <Edit className="w-4 h-4 mr-2" />
                          編集
                        </Button>
                      </Link>
                    )}
                    {/* 承認申請ボタン */}
                    {enabledActions.find(a => a.action === '承認申請') && (
                      <Button
                        onClick={handleSubmitForApproval}
                        disabled={isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        承認申請
                      </Button>
                    )}
                    {/* 差戻しボタン */}
                    {enabledActions.find(a => a.action === '差戻し') && (
                      <Button
                        variant="destructive"
                        onClick={() => setShowReturnDialog(true)}
                        disabled={isSubmitting}
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        差戻し
                      </Button>
                    )}
                    {/* 承認ボタン */}
                    {enabledActions.find(a => a.action === '承認') && (
                      <Button
                        onClick={() => setShowApprovalDialog(true)}
                        disabled={isSubmitting}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        承認
                      </Button>
                    )}
                  </div>
                </div>

                {/* 権限がないアクションの説明 */}
                {disabledActions.length > 0 && enabledActions.length === 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">
                          このステータスで実行できるアクションがありません
                        </p>
                        <ul className="text-xs text-yellow-700 mt-1 space-y-0.5">
                          {disabledActions.map(({ action, reason }) => (
                            <li key={action}>• {action}: {reason}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* タブでセクション分割 */}
        <Tabs defaultValue="basic" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="basic">基本情報</TabsTrigger>
            <TabsTrigger value="amount">金額情報</TabsTrigger>
            <TabsTrigger value="verification">本人確認・ローン</TabsTrigger>
            <TabsTrigger value="files">添付ファイル</TabsTrigger>
            <TabsTrigger value="approval">承認情報</TabsTrigger>
            <TabsTrigger value="history">履歴</TabsTrigger>
          </TabsList>

          {/* 基本情報タブ */}
          <TabsContent value="basic" className="space-y-6">
            {/* 契約者情報 */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <User className="w-5 h-5 mr-2 text-orange-500" />
                  契約者情報
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">契約者名</p>
                    <p className="font-medium">{contract.customer_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">共有者名</p>
                    <p className="font-medium">{contract.partner_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">名義</p>
                    <p className="font-medium">{contract.ownership_type || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 担当者情報 */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Users className="w-5 h-5 mr-2 text-orange-500" />
                  担当者情報
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">営業担当</p>
                    <p className="font-medium">{contract.sales_person || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">設計担当</p>
                    <p className="font-medium">{contract.design_person || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">工事担当</p>
                    <p className="font-medium">{contract.construction_person || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">IC担当</p>
                    <p className="font-medium">{contract.ic_person || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 物件情報 */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Home className="w-5 h-5 mr-2 text-orange-500" />
                  物件情報
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="col-span-2 md:col-span-3">
                    <p className="text-xs text-gray-500 mb-1">建築地住所</p>
                    <p className="font-medium flex items-center">
                      <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                      {contract.land_address || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">土地面積</p>
                    <p className="font-medium">{contract.land_area ? `${contract.land_area}坪` : '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">建物面積</p>
                    <p className="font-medium">{contract.building_area ? `${contract.building_area}坪` : '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">商品名</p>
                    <p className="font-medium">{contract.product_name || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 金額情報タブ */}
          <TabsContent value="amount" className="space-y-6">
            {/* 見積・金額情報 */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <CreditCard className="w-5 h-5 mr-2 text-orange-500" />
                  見積・金額情報
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-500 mb-1">建物本体価格</p>
                      <p className="font-bold text-lg">{formatCurrency(contract.building_price)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-500 mb-1">オプション価格</p>
                      <p className="font-bold text-lg">{formatCurrency(contract.option_price)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-500 mb-1">外構価格</p>
                      <p className="font-bold text-lg">{formatCurrency(contract.exterior_price)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-500 mb-1">その他費用</p>
                      <p className="font-bold text-lg">{formatCurrency(contract.other_price)}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4">
                      <p className="text-xs text-gray-500 mb-1">値引額</p>
                      <p className="font-bold text-lg text-red-600">-{formatCurrency(contract.discount_amount)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-500 mb-1">消費税</p>
                      <p className="font-bold text-lg">{formatCurrency(contract.tax_amount)}</p>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <div className="bg-orange-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-500 mb-1">合計金額（税込）</p>
                      <p className="font-bold text-3xl text-orange-600">{formatCurrency(contract.total_amount)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 支払条件 */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Wallet className="w-5 h-5 mr-2 text-orange-500" />
                  支払条件
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">契約時</p>
                    <p className="font-bold text-blue-700">{formatCurrency(contract.payment_at_contract)}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">着工時</p>
                    <p className="font-bold text-purple-700">{formatCurrency(contract.payment_at_start)}</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">上棟時</p>
                    <p className="font-bold text-orange-700">{formatCurrency(contract.payment_at_frame)}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">完了時</p>
                    <p className="font-bold text-green-700">{formatCurrency(contract.payment_at_completion)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 本人確認・ローンタブ */}
          <TabsContent value="verification" className="space-y-6">
            {/* 本人確認 */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Shield className="w-5 h-5 mr-2 text-orange-500" />
                  本人確認
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">確認状況</p>
                    <Badge className={contract.identity_verified ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                      {contract.identity_verified ? '確認済' : '未確認'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">書類種類</p>
                    <p className="font-medium">{contract.identity_doc_type || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">確認日</p>
                    <p className="font-medium">{formatDate(contract.identity_verified_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">確認者</p>
                    <p className="font-medium">{contract.identity_verified_by || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 住宅ローン */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Building className="w-5 h-5 mr-2 text-orange-500" />
                  住宅ローン
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">ローン種類</p>
                    <p className="font-medium">{contract.loan_type || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">金融機関</p>
                    <p className="font-medium">{contract.loan_bank || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">借入額</p>
                    <p className="font-bold">{formatCurrency(contract.loan_amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">承認状況</p>
                    <Badge className={contract.loan_approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                      {contract.loan_approved ? '承認済' : '申請中'}
                    </Badge>
                  </div>
                  {contract.loan_approved && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">承認日</p>
                      <p className="font-medium">{formatDate(contract.loan_approved_date)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 重要事項説明 */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <FileText className="w-5 h-5 mr-2 text-orange-500" />
                  重要事項説明
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">説明状況</p>
                    <Badge className={contract.important_notes ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                      {contract.important_notes || '未実施'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">説明日</p>
                    <p className="font-medium">{formatDate(contract.important_notes_date)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 添付ファイルタブ */}
          <TabsContent value="files" className="space-y-6">
            <ContractAttachments
              contractId={contract.id}
              editable={contract.status === '作成中'}
            />
          </TabsContent>

          {/* 承認情報タブ */}
          <TabsContent value="approval" className="space-y-6">
            {/* 指定承認者 */}
            {(contract.designated_checker_name || contract.designated_approver_name) && (
              <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <UserCheck className="w-5 h-5 mr-2 text-indigo-500" />
                    指定承認者
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">書類確認者（指定）</p>
                      <p className="font-medium text-indigo-700">
                        {contract.designated_checker_name || '未指定（ロール権限で対応）'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">上長承認者（指定）</p>
                      <p className="font-medium text-indigo-700">
                        {contract.designated_approver_name || '未指定（ロール権限で対応）'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 作成者情報 */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <FileEdit className="w-5 h-5 mr-2 text-blue-500" />
                  作成者情報
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">作成者</p>
                    <p className="font-medium">{contract.created_by_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">作成日時</p>
                    <p className="font-medium">{formatDateTime(contract.created_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 書類確認情報 */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <FileSearch className="w-5 h-5 mr-2 text-purple-500" />
                  書類確認情報
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">確認者</p>
                    <p className="font-medium">{contract.checked_by_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">確認日時</p>
                    <p className="font-medium">{formatDateTime(contract.checked_at)}</p>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <p className="text-xs text-gray-500 mb-1">コメント</p>
                    <p className="font-medium">{contract.check_comment || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 上長承認情報 */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <UserCheck className="w-5 h-5 mr-2 text-orange-500" />
                  上長承認情報
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">承認者</p>
                    <p className="font-medium">{contract.approved_by_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">承認日時</p>
                    <p className="font-medium">{formatDateTime(contract.approved_at)}</p>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <p className="text-xs text-gray-500 mb-1">コメント</p>
                    <p className="font-medium">{contract.approval_comment || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 履歴タブ */}
          <TabsContent value="history" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <History className="w-5 h-5 mr-2 text-orange-500" />
                  ステータス変更履歴
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contract.history && contract.history.length > 0 ? (
                    [...contract.history].reverse().map((entry, index) => (
                      <div
                        key={entry.id}
                        className={`flex items-start space-x-4 pb-4 ${
                          index < contract.history.length - 1 ? 'border-b' : ''
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          entry.action === '承認' ? 'bg-green-100' :
                          entry.action === '差戻し' ? 'bg-red-100' :
                          entry.action === '承認申請' ? 'bg-blue-100' :
                          'bg-gray-100'
                        }`}>
                          {entry.action === '承認' && <Check className="w-4 h-4 text-green-600" />}
                          {entry.action === '差戻し' && <RotateCcw className="w-4 h-4 text-red-600" />}
                          {entry.action === '承認申請' && <Send className="w-4 h-4 text-blue-600" />}
                          {entry.action === 'ステータス変更' && <FileEdit className="w-4 h-4 text-gray-600" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold">{entry.action}</span>
                            <span className="text-gray-400">-</span>
                            <Badge variant="outline" className="text-xs">
                              {entry.fromStatus} → {entry.toStatus}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{entry.comment}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {entry.userName} - {formatDateTime(entry.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-8">履歴がありません</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 備考 */}
        {contract.notes && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <MessageSquare className="w-5 h-5 mr-2 text-orange-500" />
                備考・特記事項
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-gray-700">
                {contract.notes}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 関連書類 */}
        {contract.customer_id && (
          <RelatedDocuments
            customerId={contract.customer_id}
            currentType="contract"
            currentId={contract.id}
          />
        )}

        {/* 更新履歴 */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>作成: {formatDateTime(contract.created_at)} ({contract.created_by_name || '不明'})</span>
              <span>更新: {formatDateTime(contract.updated_at)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 承認ダイアログ */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>契約を承認</DialogTitle>
            <DialogDescription>
              この契約を承認します。コメントを追加できます。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>コメント（任意）</Label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="承認コメントを入力..."
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              キャンセル
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="w-4 h-4 mr-2" />
              承認する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 差戻しダイアログ */}
      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>契約を差戻し</DialogTitle>
            <DialogDescription>
              この契約を前のステータスに差戻します。理由を入力してください。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>差戻し理由 <span className="text-red-500">*</span></Label>
              <Textarea
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="差戻しの理由を入力してください..."
                className="mt-2"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReturnDialog(false)}>
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleReturn}
              disabled={isSubmitting || !returnReason.trim()}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              差戻す
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  )
}
