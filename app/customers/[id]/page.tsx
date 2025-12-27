'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Layout } from '@/components/layout/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  MapPin,
  Home,
  User,
  Users as UsersIcon,
  FileText,
  Plus,
  Calendar,
  Clock,
  FileEdit,
  FileSignature,
  Megaphone,
  TrendingUp,
  Upload,
  ClipboardCheck,
  Map,
  ClipboardList,
  FileQuestion,
} from 'lucide-react'
import { MeetingRecordDropzone } from '@/components/customers/meeting-record-dropzone'
import { CustomerChecklist } from '@/components/customers/customer-checklist'
import { LandConditionsEditor } from '@/components/land/land-conditions-editor'
import { LandMatchList } from '@/components/land/land-match-list'
import { ReceptionRecordView } from '@/components/kintone/reception-record-view'
import { HearingSheetView } from '@/components/kintone/hearing-sheet-view'
import { useLandStore } from '@/store/land-store'
import { useKintoneStore } from '@/store/kintone-store'
import { toast } from 'sonner'
import {
  type Customer,
  type PipelineStatus,
  type LeadSource,
  type FundPlan,
  PIPELINE_CONFIG,
  PIPELINE_ORDER,
  PIPELINE_LOST,
  LEAD_SOURCE_CONFIG,
} from '@/types/database'

// Mock data
const mockCustomer: Customer = {
  id: '1',
  tenant_id: '00000000-0000-0000-0000-000000000001',
  name: '山田 太郎',
  name_kana: 'ヤマダ タロウ',
  tei_name: '山田様邸',
  partner_name: '山田 花子',
  partner_name_kana: 'ヤマダ ハナコ',
  ownership_type: '共有',
  phone: '090-1234-5678',
  phone2: null,
  email: 'yamada@example.com',
  postal_code: '530-0001',
  address: '大阪府大阪市北区梅田1-1-1',
  pipeline_status: '面談',
  lead_source: '資料請求',
  lead_date: '2024-12-01',
  event_date: '2024-12-10',
  member_date: null,
  meeting_date: '2024-12-15',
  application_date: null,
  decision_date: null,
  contract_date: null,
  groundbreaking_date: null,
  handover_date: null,
  lost_date: null,
  lost_reason: null,
  assigned_to: 'dev-sales-001',
  sub_assigned_to: null,
  land_area: 50,
  building_area: 35,
  product_id: null,
  estimated_amount: 35000000,
  contract_amount: null,
  notes: '南向きリビング希望。駐車場2台分必要。',
  kintone_record_id: null,
  created_at: '2024-12-01T10:00:00Z',
  updated_at: '2024-12-15T14:00:00Z',
}

const mockFundPlans: Partial<FundPlan>[] = [
  {
    id: 'fp-1',
    status: 'draft',
    version: 1,
    created_at: '2024-12-14T10:00:00Z',
  },
]

// アクティブステータス（ボツ・他決以外）
const activeStatuses: PipelineStatus[] = [...PIPELINE_ORDER]

export default function CustomerDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [fundPlans, setFundPlans] = useState<Partial<FundPlan>[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading customer data
    setTimeout(() => {
      setCustomer(mockCustomer)
      setFundPlans(mockFundPlans)
      setIsLoading(false)
    }, 300)
  }, [params.id])

  const handleStatusChange = async (newStatus: PipelineStatus) => {
    if (!customer) return

    try {
      setCustomer({ ...customer, pipeline_status: newStatus })
      toast.success(`ステータスを「${PIPELINE_CONFIG[newStatus].label}」に変更しました`)
    } catch (error) {
      toast.error('ステータスの変更に失敗しました')
    }
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  if (!customer) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">顧客が見つかりません</p>
          <Button onClick={() => router.push('/customers')} className="mt-4">
            顧客一覧に戻る
          </Button>
        </div>
      </Layout>
    )
  }

  const statusConfig = PIPELINE_CONFIG[customer.pipeline_status]
  const leadSourceConfig = customer.lead_source ? LEAD_SOURCE_CONFIG[customer.lead_source] : null

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/customers')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {customer.tei_name}
                </h1>
                <Badge className={`${statusConfig.bgColor} ${statusConfig.color} border-0`}>
                  {statusConfig.label}
                </Badge>
              </div>
              <p className="text-gray-500 mt-1">
                {customer.name}
                {customer.partner_name && ` / ${customer.partner_name}`}
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Select
              value={customer.pipeline_status}
              onValueChange={(value) => handleStatusChange(value as PipelineStatus)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {activeStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {PIPELINE_CONFIG[status].label}
                  </SelectItem>
                ))}
                <div className="border-t my-1" />
                {PIPELINE_LOST.map((status) => (
                  <SelectItem key={status} value={status}>
                    {PIPELINE_CONFIG[status].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              編集
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* 反響情報 */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Megaphone className="w-5 h-5 mr-2 text-orange-500" />
                  反響情報
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">反響経路</p>
                    <p className="font-medium">
                      {leadSourceConfig?.label || '未設定'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">反響日</p>
                    <p className="font-medium">
                      {customer.lead_date
                        ? new Date(customer.lead_date).toLocaleDateString('ja-JP')
                        : '未設定'}
                    </p>
                  </div>
                </div>
                {customer.estimated_amount && (
                  <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">見込金額</p>
                    <p className="font-bold text-lg text-orange-600">
                      ¥{customer.estimated_amount.toLocaleString()}
                    </p>
                  </div>
                )}
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
                <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl">
                  <Home className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-500">邸名</p>
                    <p className="font-semibold">{customer.tei_name}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <UsersIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">名義</p>
                      <p className="font-medium">
                        {customer.ownership_type === '共有' ? '共有名義' : '単独名義'}
                      </p>
                    </div>
                  </div>

                  {customer.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">電話番号</p>
                        <a href={`tel:${customer.phone}`} className="font-medium text-blue-600">
                          {customer.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {customer.email && (
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">メール</p>
                        <a href={`mailto:${customer.email}`} className="font-medium text-blue-600">
                          {customer.email}
                        </a>
                      </div>
                    </div>
                  )}

                  {customer.address && (
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">住所</p>
                        <p className="font-medium">{customer.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 進捗タイムライン */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <TrendingUp className="w-5 h-5 mr-2 text-orange-500" />
                  進捗タイムライン
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {customer.lead_date && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">
                      反響: {new Date(customer.lead_date).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                )}
                {customer.event_date && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-purple-500" />
                    <span className="text-sm">
                      イベント参加: {new Date(customer.event_date).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                )}
                {customer.meeting_date && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-orange-500" />
                    <span className="text-sm">
                      面談: {new Date(customer.meeting_date).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                )}
                {customer.application_date && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm">
                      建築申込: {new Date(customer.application_date).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                )}
                {customer.contract_date && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-green-500" />
                    <span className="text-sm">
                      契約: {new Date(customer.contract_date).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tabs Section */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="checklist" className="w-full">
              <TabsList className="mb-4 flex-wrap">
                <TabsTrigger value="checklist" className="flex items-center gap-1">
                  <ClipboardCheck className="w-4 h-4" />
                  チェックリスト
                </TabsTrigger>
                <TabsTrigger value="kintone" className="flex items-center gap-1">
                  <ClipboardList className="w-4 h-4" />
                  受付・ヒアリング
                </TabsTrigger>
                <TabsTrigger value="documents">関連書類</TabsTrigger>
                <TabsTrigger value="land" className="flex items-center gap-1">
                  <Map className="w-4 h-4" />
                  土地条件
                </TabsTrigger>
                <TabsTrigger value="activity">活動履歴</TabsTrigger>
                <TabsTrigger value="notes">メモ</TabsTrigger>
              </TabsList>

              <TabsContent value="checklist">
                <CustomerChecklist
                  customerId={customer.id}
                  currentStatus={customer.pipeline_status}
                />
              </TabsContent>

              <TabsContent value="kintone" className="space-y-4">
                <KintoneRecordsSection customerId={customer.id} />
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                {/* Quick Actions */}
                <div className="grid grid-cols-3 gap-3">
                  <Link href={`/fund-plans/new?customer=${customer.id}`}>
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="w-4 h-4 mr-2 text-blue-500" />
                      資金計画書
                    </Button>
                  </Link>
                  {fundPlans.length > 0 ? (
                    <Link href={`/plan-requests/new?customer=${customer.id}`}>
                      <Button variant="outline" className="w-full justify-start">
                        <FileEdit className="w-4 h-4 mr-2 text-orange-500" />
                        プラン依頼
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="outline" className="w-full justify-start" disabled title="資金計画書を作成してください">
                      <FileEdit className="w-4 h-4 mr-2 text-gray-400" />
                      プラン依頼
                    </Button>
                  )}
                  {fundPlans.length > 0 ? (
                    <Link href={`/contract-requests/new?customer=${customer.id}`}>
                      <Button variant="outline" className="w-full justify-start">
                        <FileSignature className="w-4 h-4 mr-2 text-purple-500" />
                        契約書作成
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="outline" className="w-full justify-start" disabled title="資金計画書を作成してください">
                      <FileSignature className="w-4 h-4 mr-2 text-gray-400" />
                      契約書作成
                    </Button>
                  )}
                </div>

                {/* Fund Plans */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center text-lg">
                      <FileText className="w-5 h-5 mr-2 text-orange-500" />
                      資金計画書
                    </CardTitle>
                    <Link href={`/fund-plans/new?customer=${customer.id}`}>
                      <Button size="sm" className="bg-gradient-to-r from-orange-500 to-yellow-500">
                        <Plus className="w-4 h-4 mr-1" />
                        作成
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    {fundPlans.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">
                        資金計画書がありません
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {fundPlans.map((plan) => (
                          <Link key={plan.id} href={`/fund-plans/${plan.id}`}>
                            <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                              <div className="flex items-center space-x-3">
                                <FileText className="w-5 h-5 text-gray-400" />
                                <div>
                                  <p className="font-medium">
                                    v{plan.version}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {plan.created_at && new Date(plan.created_at).toLocaleDateString('ja-JP')}
                                  </p>
                                </div>
                              </div>
                              <Badge variant="outline">
                                {plan.status === 'draft' ? '下書き' : plan.status === 'submitted' ? '提出済' : '承認済'}
                              </Badge>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="land" className="space-y-4">
                {/* 土地条件エディタ */}
                <LandConditionsEditor
                  customerId={customer.id}
                  customerName={customer.name}
                  onSave={() => toast.success('土地条件を保存しました')}
                />

                {/* マッチング物件一覧 */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <MapPin className="w-5 h-5 mr-2 text-green-500" />
                      マッチング物件
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <LandMatchList customerId={customer.id} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity" className="space-y-4">
                {/* 商談記録ドロップゾーン */}
                <MeetingRecordDropzone customerId={customer.id} />

                {/* 活動履歴 */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Clock className="w-5 h-5 mr-2 text-orange-500" />
                      活動履歴
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Clock className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">面談実施</p>
                          <p className="text-sm text-gray-500">2024/12/15 14:00</p>
                          <p className="text-sm text-gray-600 mt-1">
                            初回面談を実施。南向きリビングと駐車場2台分のご要望確認。
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <Clock className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium">イベント参加</p>
                          <p className="text-sm text-gray-500">2024/12/10 10:00</p>
                          <p className="text-sm text-gray-600 mt-1">
                            モデルハウス見学会に参加。LIFEシリーズに興味あり。
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Clock className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">反響登録</p>
                          <p className="text-sm text-gray-500">2024/12/01 10:00</p>
                          <p className="text-sm text-gray-600 mt-1">
                            HPからの資料請求。豊中市内での建築を検討中。
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notes">
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap">
                      {customer.notes || 'メモがありません'}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  )
}

// kintoneレコード表示セクション
function KintoneRecordsSection({ customerId }: { customerId: string }) {
  const { receptionRecords, hearingSheetRecords, linkedRecords } = useKintoneStore()

  // 顧客に紐づくレコードを検索
  const linkedRecord = linkedRecords.find(lr => lr.customerId === customerId)

  // 紐づいたレコードを取得
  const receptionRecord = linkedRecord?.kintoneRecordType === 'reception'
    ? receptionRecords.find(r => r.id === linkedRecord.kintoneRecordId)
    : receptionRecords.find(r => {
        // 電話番号やメールで検索（デモ用）
        return false
      })

  const hearingSheet = linkedRecord?.kintoneRecordType === 'hearing_sheet'
    ? hearingSheetRecords.find(r => r.id === linkedRecord.kintoneRecordId)
    : hearingSheetRecords.find(r => {
        return false
      })

  // デモ用のモックデータ
  const mockReceptionRecord = {
    id: 'demo-1',
    recordNumber: '001',
    customerName: '山田 太郎',
    customerNameKana: 'ヤマダ タロウ',
    partnerName: '山田 花子',
    partnerNameKana: 'ヤマダ ハナコ',
    phone: '090-1234-5678',
    phone2: null,
    email: 'yamada@example.com',
    postalCode: '530-0001',
    address: '大阪府大阪市北区梅田1-1-1',
    leadSource: '資料請求',
    eventDate: '2024-12-10',
    notes: '南向きリビング希望。駐車場2台分必要。\n豊中市周辺で土地を探している。',
    createdAt: '2024-12-01T10:00:00Z',
    updatedAt: '2024-12-15T14:00:00Z',
  }

  const mockHearingSheet = {
    id: 'demo-hs-1',
    recordNumber: 'HS-001',
    customerName: '山田 太郎',
    phone: '090-1234-5678',
    email: 'yamada@example.com',
    familyStructure: '夫婦＋子供2人（5歳、3歳）',
    currentResidence: '賃貸マンション（2LDK）',
    budget: 3500,
    desiredArea: '40〜50坪',
    desiredLocation: '豊中市、箕面市、池田市',
    landRequirements: '駅徒歩15分以内、南向き希望、角地があれば尚良し',
    buildingRequirements: 'LDK20帖以上、4LDK、吹き抜け、ウォークインクローゼット',
    timeline: '2025年中に入居希望',
    notes: 'テレワーク部屋が欲しい。庭で子供が遊べるスペースがあると良い。',
    createdAt: '2024-12-15T10:00:00Z',
    updatedAt: '2024-12-15T14:00:00Z',
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ReceptionRecordView record={receptionRecord || mockReceptionRecord} />
      <HearingSheetView record={hearingSheet || mockHearingSheet} />
    </div>
  )
}
