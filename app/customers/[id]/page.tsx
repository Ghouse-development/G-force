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
  Phone,
  Mail,
  MapPin,
  Home,
  User,
  Users as UsersIcon,
  FileText,
  Calendar,
  FileEdit,
  FileSignature,
  Megaphone,
  TrendingUp,
  ClipboardCheck,
  Map,
  ClipboardList,
  FileQuestion,
} from 'lucide-react'
import { CustomerChecklist } from '@/components/customers/customer-checklist'
import { JourneyMap } from '@/components/customers/journey-map'
import { JourneyEventDialog } from '@/components/customers/journey-event-dialog'
import { LandStatusDialog } from '@/components/customers/land-status-dialog'
import { LandConditionsEditor } from '@/components/land/land-conditions-editor'
import { LandMatchList } from '@/components/land/land-match-list'
import { ReceptionRecordView } from '@/components/kintone/reception-record-view'
import { HearingSheetView } from '@/components/kintone/hearing-sheet-view'
import { DocumentManager } from '@/components/customers/document-manager'
import { useKintoneStore } from '@/store/kintone-store'
import { toast } from 'sonner'
import {
  type Customer,
  type PipelineStatus,
  type FundPlan,
  type CustomerJourneyEvent,
  type CustomerLandStatus,
  type JourneyEventType,
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

// モックジャーニーイベント
const mockJourneyEvents: CustomerJourneyEvent[] = [
  {
    id: 'je-1',
    customer_id: '1',
    event_type: '資料請求',
    event_date: '2024-12-01',
    notes: 'HPからの資料請求。豊中市内での建築を検討中。',
    outcome: '良好',
    next_action: 'MH見学会への案内',
    next_action_date: '2024-12-05',
    created_at: '2024-12-01T10:00:00Z',
    updated_at: '2024-12-01T10:00:00Z',
  },
  {
    id: 'je-2',
    customer_id: '1',
    event_type: 'MH見学会予約',
    event_date: '2024-12-05',
    location: '高槻MH',
    staff_name: '田中',
    notes: '12/10の見学会を予約',
    outcome: '良好',
    created_at: '2024-12-05T10:00:00Z',
    updated_at: '2024-12-05T10:00:00Z',
  },
  {
    id: 'je-3',
    customer_id: '1',
    event_type: 'MH見学会参加',
    event_date: '2024-12-10',
    location: '高槻MH',
    staff_name: '田中',
    notes: 'モデルハウス見学会に参加。LIFEシリーズに興味あり。吹き抜けに感動されていた。',
    outcome: '良好',
    next_action: '面談日程調整',
    next_action_date: '2024-12-12',
    created_at: '2024-12-10T10:00:00Z',
    updated_at: '2024-12-10T10:00:00Z',
  },
  {
    id: 'je-4',
    customer_id: '1',
    event_type: '初回面談',
    event_date: '2024-12-15',
    staff_name: '田中',
    notes: '初回面談を実施。南向きリビングと駐車場2台分のご要望確認。テレワーク部屋も希望。',
    outcome: '良好',
    next_action: '土地情報の紹介',
    next_action_date: '2024-12-20',
    created_at: '2024-12-15T14:00:00Z',
    updated_at: '2024-12-15T14:00:00Z',
  },
]

// アクティブステータス（ボツ・他決以外）
const activeStatuses: PipelineStatus[] = [...PIPELINE_ORDER]

export default function CustomerDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [fundPlans, setFundPlans] = useState<Partial<FundPlan>[]>([])
  const [journeyEvents, setJourneyEvents] = useState<CustomerJourneyEvent[]>([])
  const [landStatus, setLandStatus] = useState<CustomerLandStatus>('土地探し中')
  const [isLoading, setIsLoading] = useState(true)
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [showLandStatusDialog, setShowLandStatusDialog] = useState(false)

  useEffect(() => {
    // Simulate loading customer data
    setTimeout(() => {
      setCustomer(mockCustomer)
      setFundPlans(mockFundPlans)
      setJourneyEvents(mockJourneyEvents)
      setLandStatus('土地探し中')
      setIsLoading(false)
    }, 300)
  }, [params.id])

  const handleAddEvent = async (event: {
    event_type: JourneyEventType
    event_date: string
    location?: string
    notes?: string
    outcome?: string
    next_action?: string
    next_action_date?: string
  }) => {
    const newEvent: CustomerJourneyEvent = {
      id: `je-${Date.now()}`,
      customer_id: customer?.id || '',
      event_type: event.event_type,
      event_date: event.event_date,
      location: event.location,
      notes: event.notes,
      outcome: event.outcome,
      next_action: event.next_action,
      next_action_date: event.next_action_date,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setJourneyEvents([...journeyEvents, newEvent])
    toast.success('イベントを追加しました')
  }

  const handleUpdateLandStatus = async (status: CustomerLandStatus) => {
    setLandStatus(status)
    toast.success(`土地状況を「${status}」に変更しました`)
  }

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

  const statusConfig = PIPELINE_CONFIG[customer.pipeline_status] || {
    label: customer.pipeline_status || '未設定',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  }
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
          <div className="flex items-center gap-2">
            {/* クイックアクション */}
            <div className="hidden md:flex gap-2">
              <Link href={`/fund-plans/new?customer=${customer.id}`}>
                <Button variant="outline" size="sm">
                  <FileText className="w-4 h-4 mr-1.5 text-blue-500" />
                  資金計画
                </Button>
              </Link>
              {fundPlans.length > 0 && (
                <>
                  <Link href={`/plan-requests/new?customer=${customer.id}`}>
                    <Button variant="outline" size="sm">
                      <FileEdit className="w-4 h-4 mr-1.5 text-orange-500" />
                      プラン依頼
                    </Button>
                  </Link>
                  <Link href={`/contract-requests/new?customer=${customer.id}`}>
                    <Button variant="outline" size="sm">
                      <FileSignature className="w-4 h-4 mr-1.5 text-purple-500" />
                      契約書
                    </Button>
                  </Link>
                </>
              )}
            </div>
            <Select
              value={customer.pipeline_status}
              onValueChange={(value) => handleStatusChange(value as PipelineStatus)}
            >
              <SelectTrigger className="w-[140px]">
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
            <Tabs defaultValue="journey" className="w-full">
              <TabsList className="mb-4 flex-wrap">
                <TabsTrigger value="journey" className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  ジャーニー
                </TabsTrigger>
                <TabsTrigger value="checklist" className="flex items-center gap-1">
                  <ClipboardCheck className="w-4 h-4" />
                  チェックリスト
                </TabsTrigger>
                <TabsTrigger value="reception" className="flex items-center gap-1">
                  <ClipboardList className="w-4 h-4" />
                  受付台帳
                </TabsTrigger>
                <TabsTrigger value="hearing" className="flex items-center gap-1">
                  <FileQuestion className="w-4 h-4" />
                  ヒアリング
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  書類
                </TabsTrigger>
                <TabsTrigger value="land" className="flex items-center gap-1">
                  <Map className="w-4 h-4" />
                  土地条件
                </TabsTrigger>
                <TabsTrigger value="notes">メモ</TabsTrigger>
              </TabsList>

              <TabsContent value="journey">
                <JourneyMap
                  customerId={customer.id}
                  customerName={customer.name}
                  landStatus={landStatus}
                  events={journeyEvents}
                  pipelineStatus={customer.pipeline_status}
                  onAddEvent={() => setShowEventDialog(true)}
                  onEditLandStatus={() => setShowLandStatusDialog(true)}
                />
              </TabsContent>

              <TabsContent value="checklist">
                <CustomerChecklist
                  customerId={customer.id}
                  currentStatus={customer.pipeline_status}
                />
              </TabsContent>

              <TabsContent value="reception" className="space-y-4">
                <ReceptionRecordSection customerId={customer.id} />
              </TabsContent>

              <TabsContent value="hearing" className="space-y-4">
                <HearingSheetSection customerId={customer.id} />
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                <DocumentManager
                  customerId={customer.id}
                  landStatus={landStatus}
                />
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

      {/* イベント追加ダイアログ */}
      <JourneyEventDialog
        open={showEventDialog}
        onOpenChange={setShowEventDialog}
        customerId={customer.id}
        onSave={handleAddEvent}
      />

      {/* 土地状況変更ダイアログ */}
      <LandStatusDialog
        open={showLandStatusDialog}
        onOpenChange={setShowLandStatusDialog}
        currentStatus={landStatus}
        onSave={handleUpdateLandStatus}
      />
    </Layout>
  )
}

// 初回受付台帳セクション
function ReceptionRecordSection({ customerId }: { customerId: string }) {
  const { receptionRecords, linkedRecords } = useKintoneStore()

  // 顧客に紐づくレコードを検索
  const linkedRecord = linkedRecords.find(lr => lr.customerId === customerId && lr.kintoneRecordType === 'reception')
  const receptionRecord = linkedRecord
    ? receptionRecords.find(r => r.id === linkedRecord.kintoneRecordId)
    : undefined

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

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <ClipboardList className="w-5 h-5 mr-2 text-orange-500" />
          初回受付台帳
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ReceptionRecordView record={receptionRecord || mockReceptionRecord} />
      </CardContent>
    </Card>
  )
}

// ヒアリングシートセクション
function HearingSheetSection({ customerId }: { customerId: string }) {
  const { hearingSheetRecords, linkedRecords } = useKintoneStore()

  // 顧客に紐づくレコードを検索
  const linkedRecord = linkedRecords.find(lr => lr.customerId === customerId && lr.kintoneRecordType === 'hearing_sheet')
  const hearingSheet = linkedRecord
    ? hearingSheetRecords.find(r => r.id === linkedRecord.kintoneRecordId)
    : undefined

  // デモ用のモックデータ
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
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <FileQuestion className="w-5 h-5 mr-2 text-indigo-500" />
          ヒアリングシート
        </CardTitle>
      </CardHeader>
      <CardContent>
        <HearingSheetView record={hearingSheet || mockHearingSheet} />
      </CardContent>
    </Card>
  )
}
