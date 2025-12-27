'use client'

import { useState, useMemo, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Layout } from '@/components/layout/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SelectionCard } from '@/components/contracts/selection-card'
import { SmartSelection } from '@/components/ui/smart-selection'
import {
  ArrowLeft,
  Save,
  MapPin,
  User,
  Calendar as CalendarIcon,
  Package,
  Paintbrush,
  Building2,
  Landmark,
  Mountain,
  Search,
  Droplets,
  Trash2,
  Camera,
  FileText,
  ClipboardList,
  Ruler,
  Layers,
  Users,
  Trophy,
  Home,
  MessageSquare,
  Upload,
  X,
  Image as ImageIcon,
  FileCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { useCustomerStore, useAuthStore, usePlanRequestStore, useFundPlanStore } from '@/store'
import { useDropzone } from 'react-dropzone'
import {
  PRODUCT_LIST,
  DELIVERABLE_TYPE_LIST,
  CONSTRUCTION_AREA_LIST,
  LAND_STATUS_LIST,
  LAND_DEVELOPMENT_LIST,
  INVESTIGATION_TYPE_LIST,
  INVESTIGATION_REASON_LIST,
  WATER_SURVEY_LIST,
  DEMOLITION_LIST,
  COMPETITION_LIST,
  COMPETITOR_LIST,
  FLOOR_LIST,
  HOUSEHOLD_TYPE_LIST,
} from '@/types/database'
import type { OwnershipType, DeliverableType, ConstructionArea, LandStatus, InvestigationType } from '@/types/database'

// モックの営業担当データ
const mockSalesPersons = [
  { id: 'dev-sales-001', name: '田中 一郎' },
  { id: 'dev-sales-002', name: '山田 花子' },
  { id: 'dev-sales-003', name: '佐藤 健太' },
  { id: 'dev-sales-004', name: '鈴木 美咲' },
  { id: 'dev-sales-005', name: '高橋 翔太' },
]

// 担当者IDから名前を取得
const getSalesPersonName = (id: string | null | undefined): string => {
  if (!id) return ''
  const person = mockSalesPersons.find(p => p.id === id)
  return person?.name || ''
}

function NewPlanRequestForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuthStore()
  const { customers, updateCustomer } = useCustomerStore()
  const { addPlanRequest } = usePlanRequestStore()
  const { fundPlans } = useFundPlanStore()
  const [isLoading, setIsLoading] = useState(false)

  // 選択された顧客
  const customerId = searchParams.get('customer') || ''
  const customer = useMemo(() => {
    return customers.find(c => c.id === customerId)
  }, [customers, customerId])

  // 最新の資金計画書を取得
  const latestFundPlan = useMemo(() => {
    if (!customerId) return null
    const customerPlans = fundPlans.filter(fp => fp.customerId === customerId)
    if (customerPlans.length === 0) return null
    return customerPlans.sort((a, b) =>
      new Date(b.updatedAt || b.createdAt || 0).getTime() -
      new Date(a.updatedAt || a.createdAt || 0).getTime()
    )[0]
  }, [fundPlans, customerId])

  // 資金計画書から商品名を取得
  const fundPlanProductName = useMemo(() => {
    return latestFundPlan?.data?.productType || ''
  }, [latestFundPlan])

  // 資金計画書から施工面積を取得
  const fundPlanBuildingArea = useMemo(() => {
    return latestFundPlan?.data?.constructionArea?.toString() || ''
  }, [latestFundPlan])

  // フォームデータ
  const [formData, setFormData] = useState({
    // 基本情報
    customerId: customerId,
    customerName: customer?.name || '',

    // 名義
    ownershipType: (customer?.ownership_type || '単独') as OwnershipType,
    partnerName: customer?.partner_name || '',

    // 営業担当（お客様の担当者を優先）
    salesPersonType: (customer?.assigned_to ? 'customer' : 'current') as 'customer' | 'current' | 'other',
    salesPersonId: customer?.assigned_to || user?.id || '',

    // 日程（日付と時間を分離）
    proposalDate: '',
    proposalTime: '',
    contractDateType: 'undecided' as 'decided' | 'undecided',
    contractDate: '',
    contractTime: '',

    // 商品・仕上がり
    productType: 'current' as 'current' | 'other',  // 資金計画書の商品でOKか変更するか
    productName: '',
    deliverableType: '' as DeliverableType | '',

    // 土地情報
    landAddress: customer?.address || '',
    landLotNumber: '',
    constructionArea: '' as ConstructionArea | '',
    landStatus: '' as LandStatus | '',
    landDevelopmentNeeded: '',

    // 調査
    investigationType: '' as InvestigationType | '',
    investigationReasons: [] as string[],
    waterSurveyNeeded: '',

    // 解体
    demolitionStatus: '',

    // 写真・ヒアリング
    photoDate: '',
    hearingSheetDate: '',

    // 面積・階数
    buildingArea: '',
    floors: '',

    // 競合
    hasCompetitor: '',
    competitors: [] as string[],
    competitorOther: '',

    // 世帯
    householdType: '',

    // 備考
    notes: '',
  })

  // アップロードされたファイル
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

  // 選択された顧客が変わったら更新
  useMemo(() => {
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customerId: customer.id,
        customerName: customer.name,
        ownershipType: customer.ownership_type || '単独',
        partnerName: customer.partner_name || '',
        landAddress: customer.address || '',
        landLotNumber: prev.landLotNumber || '',  // 地番は初期空欄
        // お客様の担当者を優先
        salesPersonType: customer.assigned_to ? 'customer' : 'current',
        salesPersonId: customer.assigned_to || user?.id || '',
      }))
    }
  }, [customer, user?.id])

  // お客様の担当者名を取得
  const customerSalesPersonName = useMemo(() => {
    return getSalesPersonName(customer?.assigned_to)
  }, [customer?.assigned_to])

  // 資金計画書の商品・施工面積が変わったら更新
  useMemo(() => {
    if (fundPlanProductName || fundPlanBuildingArea) {
      setFormData(prev => ({
        ...prev,
        ...(fundPlanProductName && { productName: fundPlanProductName }),
        ...(fundPlanBuildingArea && { buildingArea: fundPlanBuildingArea }),
      }))
    }
  }, [fundPlanProductName, fundPlanBuildingArea])

  // 現在ログインしているユーザー名を取得
  const currentUserName = useMemo(() => {
    return user?.name || '担当者'
  }, [user?.name])

  // ファイルドロップハンドラ
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadedFiles(prev => [...prev, ...acceptedFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/pdf': ['.pdf'],
    },
    multiple: true,
  })

  // ファイル削除
  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // 送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // バリデーション
    if (!formData.customerId) {
      toast.error('顧客を選択してください')
      return
    }
    if (!formData.proposalDate) {
      toast.error('提案日を選択してください')
      return
    }
    if (!formData.deliverableType) {
      toast.error('仕上がりを選択してください')
      return
    }

    setIsLoading(true)

    try {
      // 顧客情報を更新（建築地住所と地番の同期）
      if (customer) {
        updateCustomer(customer.id, {
          address: formData.landAddress,
          ownership_type: formData.ownershipType,
          partner_name: formData.partnerName,
        })
      }

      // プラン依頼を作成
      const newPlanRequest = {
        tenant_id: null,
        customer_id: formData.customerId,
        customer_name: formData.customerName,
        tei_name: customer?.tei_name || `${formData.customerName}様邸`,
        ownership_type: formData.ownershipType,
        partner_name: formData.partnerName || null,
        requested_by: formData.salesPersonId || null,
        assigned_to: null,
        designer_name: null,
        presenter_name: null,
        design_office: null,
        status: '新規依頼' as const,
        proposal_date: formData.proposalDate
          ? `${formData.proposalDate}${formData.proposalTime ? 'T' + formData.proposalTime : ''}`
          : null,
        contract_date: formData.contractDateType === 'decided' && formData.contractDate
          ? `${formData.contractDate}${formData.contractTime ? 'T' + formData.contractTime : ''}`
          : null,
        deadline: null,
        investigation_deadline: null,
        product_name: formData.productName || null,
        deliverable_type: (formData.deliverableType as DeliverableType) || null,
        land_address: formData.landAddress || null,
        land_lot_number: formData.landLotNumber || null,
        land_area: null,
        building_area: formData.buildingArea ? parseFloat(formData.buildingArea) : null,
        floors: formData.floors ? parseInt(formData.floors) : null,
        land_status: (formData.landStatus as LandStatus) || null,
        construction_area: (formData.constructionArea as ConstructionArea) || null,
        land_marked: false,
        investigation_type: (formData.investigationType as InvestigationType) || null,
        water_survey_needed: formData.waterSurveyNeeded === 'required',
        demolition_needed: formData.demolitionStatus === 'required',
        land_development_needed: formData.landDevelopmentNeeded === 'required',
        has_competitor: formData.hasCompetitor === 'exists',
        competitor_name: formData.hasCompetitor === 'exists'
          ? [...formData.competitors.filter(c => c !== 'other').map(c => COMPETITOR_LIST.find(cl => cl.value === c)?.label || c), formData.competitorOther].filter(Boolean).join(', ')
          : null,
        household_type: formData.householdType || null,
        preferred_rooms: null,
        preferred_style: null,
        budget_min: null,
        budget_max: null,
        request_details: null,
        notes: formData.notes || null,
        photo_date: formData.photoDate || null,
        hearing_sheet_date: formData.hearingSheetDate || null,
        attachments: null,
        drive_folder_url: null,
        investigation_notes: null,
        investigation_completed_at: null,
        investigation_pdf_url: null,
        completed_at: null,
        plan_url: null,
        presentation_url: null,
      }

      addPlanRequest(newPlanRequest)
      toast.success('プラン依頼を作成しました')
      router.push('/plan-requests')
    } catch {
      toast.error('作成に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">新規プラン依頼</h1>
          <p className="text-gray-500">設計部への新規プラン作成依頼</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* お客様名 */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <User className="w-5 h-5 mr-2 text-orange-500" />
              お客様名
              {customer && (
                <Badge variant="outline" className="ml-2 text-xs bg-green-50 text-green-700 border-green-200">
                  自動入力
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Select
                value={formData.customerId}
                onValueChange={(value) => {
                  const selectedCustomer = customers.find(c => c.id === value)
                  setFormData(prev => ({
                    ...prev,
                    customerId: value,
                    customerName: selectedCustomer?.name || '',
                    ownershipType: selectedCustomer?.ownership_type || '単独',
                    partnerName: selectedCustomer?.partner_name || '',
                    landAddress: selectedCustomer?.address || '',
                    salesPersonId: selectedCustomer?.assigned_to || user?.id || '',
                  }))
                }}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="顧客を選択" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.tei_name || c.name} ({c.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {customer && (
                <Badge variant="outline" className="text-sm">
                  選択中: {customer.tei_name || customer.name}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 名義 */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Users className="w-5 h-5 mr-2 text-orange-500" />
              名義
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <SelectionCard
                value="単独"
                label={formData.ownershipType === '単独' ? '単独名義でOK' : '単独名義に変更する'}
                description="お一人での名義"
                selected={formData.ownershipType === '単独'}
                onClick={() => setFormData(prev => ({ ...prev, ownershipType: '単独', partnerName: '' }))}
                icon={<User className="w-6 h-6" />}
              />
              <SelectionCard
                value="共有"
                label={formData.ownershipType === '共有' ? '共有名義でOK' : '共有名義に変更する'}
                description="複数人での名義"
                selected={formData.ownershipType === '共有'}
                onClick={() => setFormData(prev => ({ ...prev, ownershipType: '共有' }))}
                icon={<Users className="w-6 h-6" />}
              />
            </div>
            {formData.ownershipType === '共有' && (
              <div className="mt-4 space-y-2">
                <Label>共有者名</Label>
                <Input
                  value={formData.partnerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, partnerName: e.target.value }))}
                  placeholder="共有者のお名前を入力"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* 営業担当 */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <User className="w-5 h-5 mr-2 text-orange-500" />
              営業担当
              {customerSalesPersonName && (
                <Badge variant="outline" className="ml-2 text-xs bg-green-50 text-green-700 border-green-200">
                  自動: {customerSalesPersonName}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {/* お客様の担当者がいる場合は第一選択肢に */}
              {customerSalesPersonName ? (
                <>
                  <SelectionCard
                    value="customer"
                    label={customerSalesPersonName}
                    description="このお客様の担当者"
                    selected={formData.salesPersonType === 'customer'}
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      salesPersonType: 'customer',
                      salesPersonId: customer?.assigned_to || ''
                    }))}
                    icon={<User className="w-6 h-6" />}
                  />
                  <SelectionCard
                    value="other"
                    label="別の担当者"
                    description="他の担当者を選択"
                    selected={formData.salesPersonType === 'other'}
                    onClick={() => setFormData(prev => ({ ...prev, salesPersonType: 'other' }))}
                    icon={<Users className="w-6 h-6" />}
                  />
                </>
              ) : (
                <>
                  <SelectionCard
                    value="current"
                    label={currentUserName}
                    description="現在ログイン中の担当者"
                    selected={formData.salesPersonType === 'current'}
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      salesPersonType: 'current',
                      salesPersonId: user?.id || ''
                    }))}
                    icon={<User className="w-6 h-6" />}
                  />
                  <SelectionCard
                    value="other"
                    label="別の担当者"
                    description="他の担当者を選択"
                    selected={formData.salesPersonType === 'other'}
                    onClick={() => setFormData(prev => ({ ...prev, salesPersonType: 'other' }))}
                    icon={<Users className="w-6 h-6" />}
                  />
                </>
              )}
            </div>
            {formData.salesPersonType === 'other' && (
              <div className="mt-4 space-y-2">
                <Label>営業担当を選択</Label>
                <Select
                  value={formData.salesPersonId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, salesPersonId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="担当者を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockSalesPersons.map((person) => (
                      <SelectItem key={person.id} value={person.id}>
                        {person.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 提案日時 */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <CalendarIcon className="w-5 h-5 mr-2 text-orange-500" />
              提案日時
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>日付</Label>
                <Input
                  type="date"
                  value={formData.proposalDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, proposalDate: e.target.value }))}
                  className="h-12 text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label>時間</Label>
                <Input
                  type="time"
                  value={formData.proposalTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, proposalTime: e.target.value }))}
                  className="h-12 text-lg"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 契約日時 */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <CalendarIcon className="w-5 h-5 mr-2 text-orange-500" />
              契約日時
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <SelectionCard
                value="decided"
                label="決定済"
                description="契約日が決まっている"
                selected={formData.contractDateType === 'decided'}
                onClick={() => setFormData(prev => ({ ...prev, contractDateType: 'decided' }))}
                icon={<CalendarIcon className="w-6 h-6" />}
              />
              <SelectionCard
                value="undecided"
                label="未定"
                description="契約日は未定"
                selected={formData.contractDateType === 'undecided'}
                onClick={() => setFormData(prev => ({ ...prev, contractDateType: 'undecided', contractDate: '', contractTime: '' }))}
                icon={<CalendarIcon className="w-6 h-6" />}
              />
            </div>
            {formData.contractDateType === 'decided' && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>日付</Label>
                  <Input
                    type="date"
                    value={formData.contractDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, contractDate: e.target.value }))}
                    className="h-12 text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label>時間</Label>
                  <Input
                    type="time"
                    value={formData.contractTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, contractTime: e.target.value }))}
                    className="h-12 text-lg"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 商品 */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Package className="w-5 h-5 mr-2 text-orange-500" />
              商品
              {fundPlanProductName && (
                <Badge variant="outline" className="ml-2 text-xs">資金計画書: {fundPlanProductName}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {fundPlanProductName ? (
              <SmartSelection
                currentValue={fundPlanProductName}
                currentLabel={fundPlanProductName}
                currentDescription="資金計画書の商品をそのまま使用"
                currentIcon={<Package className="w-6 h-6" />}
                options={PRODUCT_LIST.filter(p => p.value !== fundPlanProductName).map(p => ({
                  value: p.value,
                  label: p.label,
                  icon: <Package className="w-5 h-5" />
                }))}
                onSelect={(value) => setFormData(prev => ({ ...prev, productName: value, productType: value === fundPlanProductName ? 'current' : 'other' }))}
              />
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {PRODUCT_LIST.map((product) => (
                  <SelectionCard
                    key={product.value}
                    value={product.value}
                    label={product.label}
                    selected={formData.productName === product.value}
                    onClick={() => setFormData(prev => ({ ...prev, productName: product.value }))}
                    icon={<Package className="w-6 h-6" />}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 仕上がり */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Paintbrush className="w-5 h-5 mr-2 text-orange-500" />
              仕上がり
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {DELIVERABLE_TYPE_LIST.map((type) => (
                <SelectionCard
                  key={type.value}
                  value={type.value}
                  label={type.label}
                  description={type.description}
                  selected={formData.deliverableType === type.value}
                  onClick={() => setFormData(prev => ({ ...prev, deliverableType: type.value as DeliverableType }))}
                  icon={<Paintbrush className="w-6 h-6" />}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 建築地の住所 */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <MapPin className="w-5 h-5 mr-2 text-orange-500" />
              建築地の住所
              {customer?.address && (
                <Badge variant="outline" className="ml-2 text-xs bg-green-50 text-green-700 border-green-200">
                  自動入力・顧客情報と同期
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={formData.landAddress}
              onChange={(e) => setFormData(prev => ({ ...prev, landAddress: e.target.value }))}
              placeholder="例: 大阪府豊中市〇〇町1-2-3"
              className="h-12"
            />
            {customer?.address && formData.landAddress === customer.address && (
              <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                <FileCheck className="w-4 h-4" />
                顧客情報から自動入力されました（編集すると顧客情報にも反映されます）
              </p>
            )}
            {customer?.address && formData.landAddress !== customer.address && (
              <p className="text-sm text-amber-600 mt-2">
                編集した内容は顧客情報にも反映されます
              </p>
            )}
          </CardContent>
        </Card>

        {/* 地番or分譲地の号地 */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <MapPin className="w-5 h-5 mr-2 text-orange-500" />
              地番or分譲地の号地を入力
              <Badge variant="outline" className="ml-2 text-xs">顧客情報と同期</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={formData.landLotNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, landLotNumber: e.target.value }))}
              placeholder="例: 〇〇分譲地 12号地 または 地番: 123-4"
              className="h-12"
            />
          </CardContent>
        </Card>

        {/* 計画土地について */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <ImageIcon className="w-5 h-5 mr-2 text-orange-500" />
              計画土地について
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50/50'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">
                画像またはPDFをドラッグ＆ドロップ
              </p>
              <p className="text-sm text-gray-500">
                または クリックしてファイルを選択
              </p>
            </div>

            {/* アップロードされたファイル一覧 */}
            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <Label>アップロードされたファイル</Label>
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {file.type.includes('image') ? (
                        <ImageIcon className="w-5 h-5 text-blue-500" />
                      ) : (
                        <FileText className="w-5 h-5 text-red-500" />
                      )}
                      <span className="text-sm truncate max-w-xs">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 施工対応エリア */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Building2 className="w-5 h-5 mr-2 text-orange-500" />
              施工対応エリア
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {CONSTRUCTION_AREA_LIST.map((area) => (
                <SelectionCard
                  key={area.value}
                  value={area.value}
                  label={area.label}
                  description={area.description}
                  selected={formData.constructionArea === area.value}
                  onClick={() => setFormData(prev => ({ ...prev, constructionArea: area.value as ConstructionArea }))}
                  icon={<Building2 className="w-6 h-6" />}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 土地の状況 */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Landmark className="w-5 h-5 mr-2 text-orange-500" />
              土地の状況
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {LAND_STATUS_LIST.map((status) => (
                <SelectionCard
                  key={status.value}
                  value={status.value}
                  label={status.label}
                  description={status.description}
                  selected={formData.landStatus === status.value}
                  onClick={() => setFormData(prev => ({ ...prev, landStatus: status.value as LandStatus }))}
                  icon={<Landmark className="w-6 h-6" />}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 宅地造成の相談について */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Mountain className="w-5 h-5 mr-2 text-orange-500" />
              宅地造成の相談について
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {LAND_DEVELOPMENT_LIST.map((option) => (
                <SelectionCard
                  key={option.value}
                  value={option.value}
                  label={option.label}
                  description={option.description}
                  selected={formData.landDevelopmentNeeded === option.value}
                  onClick={() => setFormData(prev => ({ ...prev, landDevelopmentNeeded: option.value }))}
                  icon={<Mountain className="w-6 h-6" />}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 役所調査 */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Search className="w-5 h-5 mr-2 text-orange-500" />
              役所調査
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {INVESTIGATION_TYPE_LIST.map((type) => (
                <SelectionCard
                  key={type.value}
                  value={type.value}
                  label={type.label}
                  description={type.description}
                  selected={formData.investigationType === type.value}
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    investigationType: type.value as InvestigationType,
                    investigationReasons: type.value === 'ネット/TEL調査' ? [] : prev.investigationReasons
                  }))}
                  icon={<Search className="w-6 h-6" />}
                />
              ))}
            </div>
            {formData.investigationType === '役所往訪' && (
              <div className="mt-4 space-y-3">
                <Label>往訪理由を選択（複数可）</Label>
                <div className="grid grid-cols-3 gap-3">
                  {INVESTIGATION_REASON_LIST.map((reason) => (
                    <button
                      key={reason.value}
                      type="button"
                      onClick={() => {
                        setFormData(prev => {
                          const reasons = prev.investigationReasons.includes(reason.value)
                            ? prev.investigationReasons.filter(r => r !== reason.value)
                            : [...prev.investigationReasons, reason.value]
                          return { ...prev, investigationReasons: reasons }
                        })
                      }}
                      className={`p-3 rounded-lg border-2 text-center transition-all ${
                        formData.investigationReasons.includes(reason.value)
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-200 hover:border-orange-300'
                      }`}
                    >
                      {reason.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 水道調査 */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Droplets className="w-5 h-5 mr-2 text-orange-500" />
              水道調査
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {WATER_SURVEY_LIST.map((option) => (
                <SelectionCard
                  key={option.value}
                  value={option.value}
                  label={option.label}
                  description={option.description}
                  selected={formData.waterSurveyNeeded === option.value}
                  onClick={() => setFormData(prev => ({ ...prev, waterSurveyNeeded: option.value }))}
                  icon={<Droplets className="w-6 h-6" />}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 現状（解体について） */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Trash2 className="w-5 h-5 mr-2 text-orange-500" />
              現状（解体について）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {DEMOLITION_LIST.map((option) => (
                <SelectionCard
                  key={option.value}
                  value={option.value}
                  label={option.label}
                  selected={formData.demolitionStatus === option.value}
                  onClick={() => setFormData(prev => ({ ...prev, demolitionStatus: option.value }))}
                  icon={<Trash2 className="w-6 h-6" />}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 写真格納予定日 */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Camera className="w-5 h-5 mr-2 text-orange-500" />
              写真格納予定日
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {(() => {
                const dates = []
                for (let i = 0; i < 3; i++) {
                  const date = new Date()
                  date.setDate(date.getDate() + i)
                  const dateStr = date.toISOString().split('T')[0]
                  const dayNames = ['日', '月', '火', '水', '木', '金', '土']
                  const dayLabel = i === 0 ? '本日' : i === 1 ? '明日' : '明後日'
                  const fullLabel = `${dayLabel} (${date.getMonth() + 1}/${date.getDate()} ${dayNames[date.getDay()]})`
                  dates.push({ value: dateStr, label: fullLabel })
                }
                return dates.map((d) => (
                  <SelectionCard
                    key={d.value}
                    value={d.value}
                    label={d.label}
                    selected={formData.photoDate === d.value}
                    onClick={() => setFormData(prev => ({ ...prev, photoDate: d.value }))}
                    icon={<Camera className="w-6 h-6" />}
                  />
                ))
              })()}
            </div>
          </CardContent>
        </Card>

        {/* ヒアリングシート格納予定日 */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <ClipboardList className="w-5 h-5 mr-2 text-orange-500" />
              ヒアリングシート格納予定日
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {(() => {
                const dates = []
                for (let i = 0; i < 3; i++) {
                  const date = new Date()
                  date.setDate(date.getDate() + i)
                  const dateStr = date.toISOString().split('T')[0]
                  const dayNames = ['日', '月', '火', '水', '木', '金', '土']
                  const dayLabel = i === 0 ? '本日' : i === 1 ? '明日' : '明後日'
                  const fullLabel = `${dayLabel} (${date.getMonth() + 1}/${date.getDate()} ${dayNames[date.getDay()]})`
                  dates.push({ value: dateStr, label: fullLabel })
                }
                return dates.map((d) => (
                  <SelectionCard
                    key={d.value}
                    value={d.value}
                    label={d.label}
                    selected={formData.hearingSheetDate === d.value}
                    onClick={() => setFormData(prev => ({ ...prev, hearingSheetDate: d.value }))}
                    icon={<ClipboardList className="w-6 h-6" />}
                  />
                ))
              })()}
            </div>
          </CardContent>
        </Card>

        {/* 施工面積（坪） */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Ruler className="w-5 h-5 mr-2 text-orange-500" />
              施工面積（坪）
              {fundPlanBuildingArea && (
                <Badge variant="outline" className="ml-2 text-xs bg-green-50 text-green-700 border-green-200">
                  資金計画書: {fundPlanBuildingArea}坪
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="number"
              step="0.1"
              value={formData.buildingArea}
              onChange={(e) => setFormData(prev => ({ ...prev, buildingArea: e.target.value }))}
              placeholder="例: 35"
              className="h-12"
            />
            {fundPlanBuildingArea && formData.buildingArea === fundPlanBuildingArea && (
              <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                <FileCheck className="w-4 h-4" />
                資金計画書から自動入力されました
              </p>
            )}
          </CardContent>
        </Card>

        {/* 階数 */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Layers className="w-5 h-5 mr-2 text-orange-500" />
              階数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {FLOOR_LIST.map((floor) => (
                <SelectionCard
                  key={floor.value}
                  value={floor.value}
                  label={floor.label}
                  selected={formData.floors === floor.value}
                  onClick={() => setFormData(prev => ({ ...prev, floors: floor.value }))}
                  icon={<Layers className="w-6 h-6" />}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 競合有無 */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Trophy className="w-5 h-5 mr-2 text-orange-500" />
              競合有無
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {COMPETITION_LIST.map((option) => (
                <SelectionCard
                  key={option.value}
                  value={option.value}
                  label={option.label}
                  selected={formData.hasCompetitor === option.value}
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    hasCompetitor: option.value,
                    competitors: option.value === 'none' ? [] : prev.competitors,
                    competitorOther: option.value === 'none' ? '' : prev.competitorOther
                  }))}
                  icon={<Trophy className="w-6 h-6" />}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 競合先（競合ありの場合のみ表示） */}
        {formData.hasCompetitor === 'exists' && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Trophy className="w-5 h-5 mr-2 text-orange-500" />
                競合先（複数選択可）
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {COMPETITOR_LIST.map((competitor) => (
                  <button
                    key={competitor.value}
                    type="button"
                    onClick={() => {
                      setFormData(prev => {
                        const competitors = prev.competitors.includes(competitor.value)
                          ? prev.competitors.filter(c => c !== competitor.value)
                          : [...prev.competitors, competitor.value]
                        return { ...prev, competitors }
                      })
                    }}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      formData.competitors.includes(competitor.value)
                        ? 'border-orange-500 bg-orange-50 text-orange-700 font-semibold'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    {competitor.label}
                  </button>
                ))}
              </div>
              {formData.competitors.includes('other') && (
                <div className="mt-4 space-y-2">
                  <Label>その他の競合先</Label>
                  <Input
                    value={formData.competitorOther}
                    onChange={(e) => setFormData(prev => ({ ...prev, competitorOther: e.target.value }))}
                    placeholder="競合先のハウスメーカー名を入力"
                    className="h-12"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 世帯数 */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Home className="w-5 h-5 mr-2 text-orange-500" />
              世帯数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {HOUSEHOLD_TYPE_LIST.map((option) => (
                <SelectionCard
                  key={option.value}
                  value={option.value}
                  label={option.label}
                  description={option.description}
                  selected={formData.householdType === option.value}
                  onClick={() => setFormData(prev => ({ ...prev, householdType: option.value }))}
                  icon={<Home className="w-6 h-6" />}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 備考 */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <MessageSquare className="w-5 h-5 mr-2 text-orange-500" />
              備考
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="その他の注意事項、特記事項などを記入してください..."
              rows={5}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end space-x-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                依頼中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                依頼する
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default function NewPlanRequestPage() {
  return (
    <Layout>
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <NewPlanRequestForm />
      </Suspense>
    </Layout>
  )
}
