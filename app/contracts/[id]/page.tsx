'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { Layout } from '@/components/layout/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  FileSignature,
  Home,
  Wallet,
  Calendar,
  User,
  FileEdit,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Printer,
  Edit,
} from 'lucide-react'
import { toast } from 'sonner'
import type { ContractStatus } from '@/types/database'

// ステータス設定
const STATUS_CONFIG: Record<ContractStatus, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  '作成中': { label: '作成中', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: FileEdit },
  '確認中': { label: '確認中', color: 'text-orange-700', bgColor: 'bg-orange-100', icon: Clock },
  '承認待ち': { label: '承認待ち', color: 'text-purple-700', bgColor: 'bg-purple-100', icon: AlertCircle },
  '締結済': { label: '締結済', color: 'text-green-700', bgColor: 'bg-green-100', icon: CheckCircle },
}

// モックデータ
const mockContract = {
  id: '1',
  contract_number: 'C-2024-001',
  customer_id: '1',
  customer_name: '山田 太郎',
  customer_address: '大阪府豊中市〇〇町1-2-3',
  customer_phone: '090-1234-5678',
  tei_name: '山田様邸',
  status: '確認中' as ContractStatus,
  sales_staff_name: '営業 太郎',
  contract_date: '2024-12-16',
  contract_amount: 38000000,
  tax_amount: 3454545,
  building_address: '大阪府豊中市〇〇町1-2-3',
  building_area: 35.5,
  floors: 2,
  structure: '木造',
  groundbreaking_date: '2025-02-01',
  completion_date: '2025-06-30',
  handover_date: '2025-07-15',
  payment_schedule: '契約時: 10%（380万円）\n着工時: 30%（1,140万円）\n上棟時: 30%（1,140万円）\n引渡時: 30%（1,140万円）',
  notes: '・駐車場2台分確保\n・外構工事は別途契約予定',
  created_at: '2024-12-16T10:00:00Z',
  created_by_name: '営業 太郎',
  updated_at: '2024-12-17T15:00:00Z',
}

export default function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [status, setStatus] = useState<ContractStatus>(mockContract.status)

  const statusConfig = STATUS_CONFIG[status]
  const StatusIcon = statusConfig.icon

  const handleStatusChange = async (newStatus: ContractStatus) => {
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
                  {mockContract.tei_name}
                </h1>
                <Badge
                  variant="outline"
                  className={`${statusConfig.bgColor} ${statusConfig.color} border-0`}
                >
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusConfig.label}
                </Badge>
                {mockContract.contract_number && (
                  <span className="text-gray-500 text-sm">
                    {mockContract.contract_number}
                  </span>
                )}
              </div>
              <p className="text-gray-500">請負契約書</p>
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
              onValueChange={(value) => handleStatusChange(value as ContractStatus)}
              disabled={isUpdating}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUS_CONFIG) as ContractStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_CONFIG[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

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
                <p className="font-medium">{mockContract.customer_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">電話番号</p>
                <p className="font-medium">{mockContract.customer_phone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">営業担当</p>
                <p className="font-medium">{mockContract.sales_staff_name}</p>
              </div>
              <div className="col-span-2 md:col-span-3">
                <p className="text-xs text-gray-500 mb-1">住所</p>
                <p className="font-medium">{mockContract.customer_address}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 契約情報 */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <FileSignature className="w-5 h-5 mr-2 text-orange-500" />
              契約情報
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-gray-500 mb-1">契約番号</p>
                <p className="font-medium">{mockContract.contract_number}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">契約日</p>
                <p className="font-medium flex items-center">
                  <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                  {new Date(mockContract.contract_date).toLocaleDateString('ja-JP')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">契約金額（税込）</p>
                <p className="font-bold text-xl text-orange-600">
                  ¥{mockContract.contract_amount.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 建物情報 */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Home className="w-5 h-5 mr-2 text-orange-500" />
              建物情報
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div className="col-span-2 md:col-span-3">
                <p className="text-xs text-gray-500 mb-1">建築地住所</p>
                <p className="font-medium">{mockContract.building_address}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">延床面積</p>
                <p className="font-medium">{mockContract.building_area}坪</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">階数</p>
                <p className="font-medium">{mockContract.floors}階建て</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">構造</p>
                <p className="font-medium">{mockContract.structure}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 工事スケジュール */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Calendar className="w-5 h-5 mr-2 text-orange-500" />
              工事スケジュール
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">着工予定日</p>
                <p className="font-bold text-blue-700">
                  {mockContract.groundbreaking_date
                    ? new Date(mockContract.groundbreaking_date).toLocaleDateString('ja-JP')
                    : '未定'}
                </p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">完成予定日</p>
                <p className="font-bold text-orange-700">
                  {mockContract.completion_date
                    ? new Date(mockContract.completion_date).toLocaleDateString('ja-JP')
                    : '未定'}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">引渡予定日</p>
                <p className="font-bold text-green-700">
                  {mockContract.handover_date
                    ? new Date(mockContract.handover_date).toLocaleDateString('ja-JP')
                    : '未定'}
                </p>
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
            <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-gray-700">
              {mockContract.payment_schedule || '支払条件未設定'}
            </div>
          </CardContent>
        </Card>

        {/* 備考 */}
        {mockContract.notes && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">備考・特記事項</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-gray-700">
                {mockContract.notes}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 更新履歴 */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>
                作成: {new Date(mockContract.created_at).toLocaleString('ja-JP')} ({mockContract.created_by_name})
              </span>
              <span>
                更新: {new Date(mockContract.updated_at).toLocaleString('ja-JP')}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* アクション */}
        <div className="flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/contracts/${resolvedParams.id}/edit`)}
          >
            <Edit className="w-4 h-4 mr-2" />
            編集
          </Button>
          {status !== '締結済' && (
            <Button
              onClick={() => handleStatusChange('締結済')}
              disabled={isUpdating}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              契約締結
            </Button>
          )}
        </div>
      </div>
    </Layout>
  )
}
