'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  FileText,
  Image as ImageIcon,
  Check,
  MapPin,
  CreditCard,
  User,
  FileSignature,
  Eye,
  Trash2,
  Banknote,
  Loader2,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuthStore } from '@/store'
import { toast } from 'sonner'
import type { CustomerLandStatus } from '@/types/database'

// 書類カテゴリの型定義
type DocumentCategory =
  // 本人確認書類
  | 'drivers_license_front'
  | 'drivers_license_back'
  | 'health_insurance'
  | 'mynumber_front'
  | 'mynumber_back'
  | 'residence_certificate'
  | 'seal_certificate'
  // 収入証明書類
  | 'income_certificate'
  | 'tax_return'
  | 'tax_certificate'
  | 'salary_slip'
  // 土地関係書類
  | 'land_registry'
  | 'adjacent_land_registry'
  | 'building_registry'
  | 'cadastral_map'
  | 'road_boundary_map'
  | 'land_survey'
  | 'land_sales_material'
  | 'land_explanation'
  | 'land_contract'
  | 'site_map'
  | 'site_photos'
  | 'site_photos_marked'
  // 開発・道路関係
  | 'development_permit'
  | 'development_inspection'
  | 'designated_road_map'
  | 'article43_permit'
  // ローン関係書類
  | 'loan_preapproval'
  | 'loan_approval'
  | 'loan_contract'
  // 契約関係書類
  | 'building_number_doc'
  | 'fund_plan_excel'
  | 'fund_plan_pdf'
  | 'presentation'
  | 'estimate_excel'
  | 'estimate_pdf'
  | 'estimate_checklist'
  | 'hearing_sheet'
  | 'government_survey'
  | 'design_cost_estimate'
  | 'water_estimate'
  | 'demolition_estimate'
  | 'demolition_meeting'
  | 'exterior_estimate'
  // 建築関係書類
  | 'construction_application'
  | 'construction_contract'
  | 'design_drawings'
  | 'building_confirmation'
  | 'building_inspection'
  // その他
  | 'meeting_records'
  | 'business_card'
  | 'other1'
  | 'other2'

// APIから返ってくるドキュメントの型
interface ApiDocument {
  id: string
  customer_id: string
  category: DocumentCategory
  file_name: string
  file_type: string
  file_size: number
  storage_path: string
  uploaded_by: string | null
  uploaded_at: string
  url: string | null
}

// 書類グループ定義
type DocumentGroup = 'identity' | 'income' | 'land' | 'road' | 'loan' | 'contract' | 'construction' | 'other'

const DOCUMENT_GROUPS: Record<DocumentGroup, { label: string; order: number }> = {
  identity: { label: '本人確認書類', order: 1 },
  income: { label: '収入証明書類', order: 2 },
  loan: { label: 'ローン関係', order: 3 },
  contract: { label: '契約関係書類', order: 4 },
  land: { label: '土地関係書類', order: 5 },
  road: { label: '開発・道路関係', order: 6 },
  construction: { label: '建築関係書類', order: 7 },
  other: { label: 'その他', order: 8 },
}

// 条件タイプ定義
type DocumentCondition =
  | 'always'           // 常に必須
  | 'has_land'         // 土地あり/契約済/決済済の場合
  | 'has_demolition'   // 解体工事ありの場合
  | 'has_water_work'   // 水道工事ありの場合
  | 'has_exterior'     // 外構工事ありの場合
  | 'has_design_cost'  // 設計費用ありの場合
  | 'has_development'  // 開発許可が必要な場合
  | 'has_road_designation' // 位置指定道路の場合
  | 'has_article43'    // 43条認定の場合
  | 'has_existing_building' // 既存建物ありの場合
  | 'optional'         // 任意

// 条件の表示名
const CONDITION_LABELS: Record<DocumentCondition, string> = {
  always: '必須',
  has_land: '土地あり',
  has_demolition: '解体工事あり',
  has_water_work: '水道工事あり',
  has_exterior: '外構工事あり',
  has_design_cost: '設計費用あり',
  has_development: '開発許可必要',
  has_road_designation: '位置指定道路',
  has_article43: '43条認定',
  has_existing_building: '既存建物あり',
  optional: '任意',
}

// 書類定義（条件付き）
interface DocumentTypeConfig {
  label: string
  icon: typeof FileText
  group: DocumentGroup
}

const DOCUMENT_TYPES: Record<DocumentCategory, DocumentTypeConfig> = {
  // 本人確認書類
  drivers_license_front: { label: '運転免許証（オモテ）', icon: CreditCard, group: 'identity' },
  drivers_license_back: { label: '運転免許証（ウラ）', icon: CreditCard, group: 'identity' },
  health_insurance: { label: '健康保険証', icon: User, group: 'identity' },
  mynumber_front: { label: 'マイナンバー（オモテ）', icon: CreditCard, group: 'identity' },
  mynumber_back: { label: 'マイナンバー（ウラ）', icon: CreditCard, group: 'identity' },
  residence_certificate: { label: '住民票', icon: FileText, group: 'identity' },
  seal_certificate: { label: '印鑑証明書', icon: FileSignature, group: 'identity' },
  // 収入証明書類
  income_certificate: { label: '源泉徴収票', icon: Banknote, group: 'income' },
  tax_return: { label: '確定申告書', icon: FileText, group: 'income' },
  tax_certificate: { label: '課税証明書', icon: FileText, group: 'income' },
  salary_slip: { label: '給与明細', icon: Banknote, group: 'income' },
  // 土地関係書類
  land_registry: { label: '計画地土地謄本', icon: FileText, group: 'land' },
  adjacent_land_registry: { label: '隣接地土地謄本（前面道路）', icon: FileText, group: 'land' },
  building_registry: { label: '建物謄本', icon: FileText, group: 'land' },
  cadastral_map: { label: '公図', icon: MapPin, group: 'land' },
  road_boundary_map: { label: '道路界公図', icon: MapPin, group: 'land' },
  land_survey: { label: '測量図', icon: FileText, group: 'land' },
  land_sales_material: { label: '土地販売資料', icon: FileText, group: 'land' },
  land_explanation: { label: '土地重要事項説明書', icon: FileSignature, group: 'land' },
  land_contract: { label: '土地売買契約書', icon: FileText, group: 'land' },
  site_map: { label: '現地地図（住所がわかる資料）', icon: MapPin, group: 'land' },
  site_photos: { label: '現地写真', icon: ImageIcon, group: 'land' },
  site_photos_marked: { label: '現地写真（赤枠囲い）', icon: ImageIcon, group: 'land' },
  // 開発・道路関係
  development_permit: { label: '開発許可証・図面', icon: FileText, group: 'road' },
  development_inspection: { label: '開発検査済証', icon: Check, group: 'road' },
  designated_road_map: { label: '位置指定道路図', icon: MapPin, group: 'road' },
  article43_permit: { label: '43条認定 建築確認取得書', icon: FileText, group: 'road' },
  // ローン関係書類
  loan_preapproval: { label: '住宅ローン事前審査承認通知書', icon: Banknote, group: 'loan' },
  loan_approval: { label: 'ローン本審査承認書', icon: Banknote, group: 'loan' },
  loan_contract: { label: '金銭消費貸借契約書', icon: FileSignature, group: 'loan' },
  // 契約関係書類
  building_number_doc: { label: '号棟書', icon: FileText, group: 'contract' },
  fund_plan_excel: { label: '資金計画書（Excel）', icon: FileText, group: 'contract' },
  fund_plan_pdf: { label: '資金計画書（PDF）', icon: FileText, group: 'contract' },
  presentation: { label: 'プレゼン', icon: FileText, group: 'contract' },
  estimate_excel: { label: '見積書（Excel）', icon: FileText, group: 'contract' },
  estimate_pdf: { label: '見積書（PDF）', icon: FileText, group: 'contract' },
  estimate_checklist: { label: '見積書チェックリスト', icon: Check, group: 'contract' },
  hearing_sheet: { label: 'ヒアリングシート', icon: FileText, group: 'contract' },
  government_survey: { label: '役所調査書', icon: FileText, group: 'contract' },
  design_cost_estimate: { label: '設計費用見積書', icon: Banknote, group: 'contract' },
  water_estimate: { label: '水道見積もり', icon: Banknote, group: 'contract' },
  demolition_estimate: { label: '解体見積もり', icon: Banknote, group: 'contract' },
  demolition_meeting: { label: '解体業者打合せ記録', icon: FileText, group: 'contract' },
  exterior_estimate: { label: '外構概算見積', icon: Banknote, group: 'contract' },
  // 建築関係書類
  construction_application: { label: '建築申込書', icon: FileText, group: 'construction' },
  construction_contract: { label: '建築請負契約書', icon: FileSignature, group: 'construction' },
  design_drawings: { label: '設計図面', icon: FileText, group: 'construction' },
  building_confirmation: { label: '確認済証', icon: Check, group: 'construction' },
  building_inspection: { label: '検査済証', icon: Check, group: 'construction' },
  // その他
  meeting_records: { label: '議事録・打合せ記録', icon: FileText, group: 'other' },
  business_card: { label: '名刺', icon: User, group: 'other' },
  other1: { label: 'その他1', icon: FileText, group: 'other' },
  other2: { label: 'その他2', icon: FileText, group: 'other' },
}

// ステージ別の書類要件定義
interface StageDocumentRequirement {
  category: DocumentCategory
  condition: DocumentCondition
}

// 新規プラン依頼時の必要書類
const PLAN_REQUEST_DOCS: StageDocumentRequirement[] = [
  // 必須
  { category: 'drivers_license_front', condition: 'always' },
  { category: 'drivers_license_back', condition: 'always' },
  { category: 'health_insurance', condition: 'always' },
  { category: 'hearing_sheet', condition: 'always' },
  // 土地ありの場合
  { category: 'land_registry', condition: 'has_land' },
  { category: 'cadastral_map', condition: 'has_land' },
  { category: 'land_survey', condition: 'has_land' },
  { category: 'site_map', condition: 'has_land' },
  { category: 'site_photos', condition: 'has_land' },
  // 任意
  { category: 'business_card', condition: 'optional' },
]

// 請負契約時の必要書類
const CONTRACT_DOCS: StageDocumentRequirement[] = [
  // === 常に必須 ===
  // 本人確認
  { category: 'drivers_license_front', condition: 'always' },
  { category: 'drivers_license_back', condition: 'always' },
  { category: 'health_insurance', condition: 'always' },
  // ローン
  { category: 'loan_preapproval', condition: 'always' },
  // 契約関係（常に必須）
  { category: 'building_number_doc', condition: 'always' },
  { category: 'fund_plan_excel', condition: 'always' },
  { category: 'fund_plan_pdf', condition: 'always' },
  { category: 'presentation', condition: 'always' },
  { category: 'estimate_excel', condition: 'always' },
  { category: 'estimate_pdf', condition: 'always' },
  { category: 'estimate_checklist', condition: 'always' },
  { category: 'hearing_sheet', condition: 'always' },
  { category: 'government_survey', condition: 'always' },
  // 土地関係（常に必須）
  { category: 'land_registry', condition: 'always' },
  { category: 'adjacent_land_registry', condition: 'always' },
  { category: 'cadastral_map', condition: 'always' },
  { category: 'land_survey', condition: 'always' },
  { category: 'site_map', condition: 'always' },
  { category: 'site_photos', condition: 'always' },
  { category: 'site_photos_marked', condition: 'always' },

  // === 条件付き必須 ===
  // 土地購入の場合
  { category: 'land_sales_material', condition: 'has_land' },
  { category: 'land_contract', condition: 'has_land' },
  // 既存建物ありの場合
  { category: 'building_registry', condition: 'has_existing_building' },
  // 解体工事ありの場合
  { category: 'demolition_estimate', condition: 'has_demolition' },
  { category: 'demolition_meeting', condition: 'has_demolition' },
  // 水道工事ありの場合
  { category: 'water_estimate', condition: 'has_water_work' },
  // 外構工事ありの場合
  { category: 'exterior_estimate', condition: 'has_exterior' },
  // 設計費用ありの場合
  { category: 'design_cost_estimate', condition: 'has_design_cost' },
  // 開発許可必要の場合
  { category: 'development_permit', condition: 'has_development' },
  { category: 'development_inspection', condition: 'has_development' },
  // 位置指定道路の場合
  { category: 'designated_road_map', condition: 'has_road_designation' },
  { category: 'road_boundary_map', condition: 'has_road_designation' },
  // 43条認定の場合
  { category: 'article43_permit', condition: 'has_article43' },

  // === 任意 ===
  { category: 'other1', condition: 'optional' },
  { category: 'other2', condition: 'optional' },
]

// 条件選択肢の定義
interface ConditionOption {
  key: DocumentCondition
  label: string
  description: string
}

const SELECTABLE_CONDITIONS: ConditionOption[] = [
  { key: 'has_land', label: '土地購入', description: '土地を購入する場合' },
  { key: 'has_existing_building', label: '既存建物あり', description: '敷地内に既存建物がある場合' },
  { key: 'has_demolition', label: '解体工事あり', description: '解体工事を行う場合' },
  { key: 'has_water_work', label: '水道工事あり', description: '水道引込み工事がある場合' },
  { key: 'has_exterior', label: '外構工事あり', description: '外構工事を行う場合' },
  { key: 'has_design_cost', label: '設計費用あり', description: '設計費用が発生する場合' },
  { key: 'has_development', label: '開発許可必要', description: '開発許可が必要な土地の場合' },
  { key: 'has_road_designation', label: '位置指定道路', description: '位置指定道路に接する場合' },
  { key: 'has_article43', label: '43条認定', description: '建築基準法43条認定が必要な場合' },
]

// 書類ステージタイプ
type DocumentStage = 'plan_request' | 'contract'

// ステージ別の書類要件を取得
function getStageDocuments(stage: DocumentStage): StageDocumentRequirement[] {
  return stage === 'plan_request' ? PLAN_REQUEST_DOCS : CONTRACT_DOCS
}

// 条件に基づいてフィルタリング
function filterDocumentsByConditions(
  requirements: StageDocumentRequirement[],
  activeConditions: Set<DocumentCondition>,
  showOptional: boolean
): StageDocumentRequirement[] {
  return requirements.filter(req => {
    if (req.condition === 'always') return true
    if (req.condition === 'optional') return showOptional
    return activeConditions.has(req.condition)
  })
}

interface DocumentManagerProps {
  customerId: string
  landStatus: CustomerLandStatus
  pipelineStatus?: string
}

export function DocumentManager({ customerId, landStatus }: DocumentManagerProps) {
  const { user } = useAuthStore()
  const [documents, setDocuments] = useState<ApiDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [uploadingTo, setUploadingTo] = useState<DocumentCategory | null>(null)
  const [previewDoc, setPreviewDoc] = useState<ApiDocument | null>(null)

  // ステージ選択（新規プラン依頼 or 請負契約）
  const [stage, setStage] = useState<DocumentStage>('plan_request')
  // 条件選択
  const [activeConditions, setActiveConditions] = useState<Set<DocumentCondition>>(new Set())
  // 任意書類を表示するか
  const [showOptional, setShowOptional] = useState(false)

  // 土地状況から初期条件を設定
  useEffect(() => {
    const initialConditions = new Set<DocumentCondition>()
    if (landStatus !== '土地探し中') {
      initialConditions.add('has_land')
    }
    setActiveConditions(initialConditions)
  }, [landStatus])

  // ドキュメントをAPIから取得
  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch(`/api/documents?customerId=${customerId}`)
      const data = await res.json()
      setDocuments(data.documents || [])
    } catch (error) {
      console.error('Failed to fetch documents:', error)
      setDocuments([])
    } finally {
      setIsLoading(false)
    }
  }, [customerId])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  // 書類タイプごとのドキュメント
  const getDocsForType = (typeId: DocumentCategory) => {
    return documents.filter(d => d.category === typeId)
  }

  // 条件トグル
  const toggleCondition = (condition: DocumentCondition) => {
    setActiveConditions(prev => {
      const next = new Set(prev)
      if (next.has(condition)) {
        next.delete(condition)
      } else {
        next.add(condition)
      }
      return next
    })
  }

  // フィルタリングされた書類リスト
  const stageRequirements = getStageDocuments(stage)
  const filteredRequirements = filterDocumentsByConditions(stageRequirements, activeConditions, showOptional)

  // グループ別に整理
  const groupedDocs = filteredRequirements.reduce((acc, req) => {
    const group = DOCUMENT_TYPES[req.category].group
    if (!acc[group]) acc[group] = []
    acc[group].push(req)
    return acc
  }, {} as Record<DocumentGroup, StageDocumentRequirement[]>)

  // グループをorder順にソート
  const sortedGroups = (Object.keys(groupedDocs) as DocumentGroup[])
    .sort((a, b) => DOCUMENT_GROUPS[a].order - DOCUMENT_GROUPS[b].order)

  // 進捗計算（必須のみ）
  const requiredDocs = filteredRequirements.filter(r => r.condition === 'always')
  const completedRequired = requiredDocs.filter(r => getDocsForType(r.category).length > 0).length
  const requiredProgress = requiredDocs.length > 0 ? Math.round((completedRequired / requiredDocs.length) * 100) : 100

  // 全体進捗
  const totalDocs = filteredRequirements.length
  const completedDocs = filteredRequirements.filter(r => getDocsForType(r.category).length > 0).length
  const totalProgress = totalDocs > 0 ? Math.round((completedDocs / totalDocs) * 100) : 0

  // アップロード処理
  const handleUpload = useCallback(async (files: File[], typeId: DocumentCategory) => {
    setUploadingTo(typeId)

    for (const file of files) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('customerId', customerId)
        formData.append('category', typeId)
        if (user?.id) {
          formData.append('uploadedBy', user.id)
        }

        const res = await fetch('/api/documents', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) {
          throw new Error('Upload failed')
        }

        const data = await res.json()
        if (data.document) {
          setDocuments(prev => [data.document, ...prev])
        }

        toast.success(`${DOCUMENT_TYPES[typeId].label}をアップロードしました`)
      } catch (error) {
        console.error('Upload error:', error)
        toast.error('アップロードに失敗しました')
      }
    }

    setUploadingTo(null)
  }, [customerId, user])

  // 削除処理
  const handleDelete = async (doc: ApiDocument) => {
    try {
      const res = await fetch(`/api/documents?id=${doc.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Delete failed')
      }

      setDocuments(prev => prev.filter(d => d.id !== doc.id))
      toast.success('削除しました')
      setPreviewDoc(null)
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('削除に失敗しました')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ステージ選択タブ */}
      <div className="flex gap-2">
        <Button
          variant={stage === 'plan_request' ? 'default' : 'outline'}
          onClick={() => setStage('plan_request')}
          className={stage === 'plan_request' ? 'bg-orange-500 hover:bg-orange-600' : ''}
        >
          新規プラン依頼
        </Button>
        <Button
          variant={stage === 'contract' ? 'default' : 'outline'}
          onClick={() => setStage('contract')}
          className={stage === 'contract' ? 'bg-orange-500 hover:bg-orange-600' : ''}
        >
          請負契約
        </Button>
      </div>

      {/* 条件選択パネル */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800">該当する条件を選択</h3>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showOptional}
                onChange={(e) => setShowOptional(e.target.checked)}
                className="rounded"
              />
              任意書類も表示
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {SELECTABLE_CONDITIONS.map(option => (
              <button
                key={option.key}
                onClick={() => toggleCondition(option.key)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                  activeConditions.has(option.key)
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
                title={option.description}
              >
                {option.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 進捗サマリー */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-blue-800">
                {stage === 'plan_request' ? '新規プラン依頼' : '請負契約'}の書類
              </span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-blue-600">{requiredProgress}%</span>
              <span className="text-sm text-blue-500 ml-1">必須</span>
            </div>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-3 mb-2">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all"
              style={{ width: `${requiredProgress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-700">
              必須: {completedRequired}/{requiredDocs.length} 完了
            </span>
            <span className="text-gray-500">
              全体: {completedDocs}/{totalDocs} ({totalProgress}%)
            </span>
          </div>
        </CardContent>
      </Card>

      {/* グループ別書類カード */}
      {sortedGroups.map(group => {
        const groupConfig = DOCUMENT_GROUPS[group]
        const requirements = groupedDocs[group]
        const groupCompleted = requirements.filter(r => getDocsForType(r.category).length > 0).length
        const groupTotal = requirements.length

        return (
          <div key={group} className="space-y-3">
            {/* グループヘッダー */}
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <span className={cn(
                  'w-2 h-2 rounded-full',
                  groupCompleted === groupTotal ? 'bg-green-500' : 'bg-gray-300'
                )} />
                {groupConfig.label}
              </h3>
              <span className={cn(
                'text-sm font-medium px-2 py-0.5 rounded',
                groupCompleted === groupTotal
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              )}>
                {groupCompleted}/{groupTotal}
              </span>
            </div>

            {/* 書類カード */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {requirements.map(req => {
                const config = DOCUMENT_TYPES[req.category]
                const typeDocs = getDocsForType(req.category)
                const hasDoc = typeDocs.length > 0
                const Icon = config.icon

                return (
                  <DocumentCard
                    key={req.category}
                    label={config.label}
                    icon={<Icon className="w-6 h-6" />}
                    hasFile={hasDoc}
                    fileCount={typeDocs.length}
                    onUpload={(files) => handleUpload(files, req.category)}
                    onView={() => hasDoc && setPreviewDoc(typeDocs[0])}
                    isUploading={uploadingTo === req.category}
                    isRequired={req.condition === 'always'}
                    conditionLabel={req.condition !== 'always' && req.condition !== 'optional' ? CONDITION_LABELS[req.condition] : undefined}
                  />
                )
              })}
            </div>
          </div>
        )
      })}

      {/* プレビューダイアログ */}
      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-8">
              <span className="truncate">{previewDoc?.file_name}</span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500"
                  onClick={() => {
                    if (previewDoc) {
                      handleDelete(previewDoc)
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 overflow-auto max-h-[70vh]">
            {previewDoc?.url ? (
              previewDoc.file_type.startsWith('image/') ? (
                <img
                  src={previewDoc.url}
                  alt={previewDoc.file_name}
                  className="w-full h-auto object-contain"
                />
              ) : previewDoc.file_type === 'application/pdf' ? (
                <iframe
                  src={previewDoc.url}
                  className="w-full h-[65vh]"
                  title={previewDoc.file_name}
                />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>プレビューできません</p>
                  <a
                    href={previewDoc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline mt-2 inline-block"
                  >
                    ダウンロード
                  </a>
                </div>
              )
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>ファイルを読み込めません</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// 個別の書類カード
interface DocumentCardProps {
  label: string
  icon: React.ReactNode
  hasFile: boolean
  fileCount: number
  onUpload: (files: File[]) => void
  onView: () => void
  isUploading: boolean
  isRequired?: boolean
  conditionLabel?: string
}

function DocumentCard({
  label,
  icon,
  hasFile,
  fileCount,
  onUpload,
  onView,
  isUploading,
  isRequired,
  conditionLabel,
}: DocumentCardProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onUpload,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png', '.heic'],
    },
    disabled: isUploading,
  })

  return (
    <Card
      className={cn(
        'relative transition-all cursor-pointer overflow-hidden',
        hasFile
          ? 'border-green-300 bg-green-50 hover:border-green-400'
          : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50',
        isDragActive && 'border-orange-500 bg-orange-100',
        isUploading && 'opacity-50'
      )}
    >
      <CardContent className="p-0">
        <div
          {...getRootProps()}
          onClick={(e) => {
            if (hasFile) {
              e.stopPropagation()
              onView()
            }
          }}
          className="p-4 text-center"
        >
          <input {...getInputProps()} />

          {/* アイコンエリア */}
          <div className={cn(
            'w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2',
            hasFile ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
          )}>
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : hasFile ? (
              <Check className="w-6 h-6" />
            ) : (
              icon
            )}
          </div>

          {/* ラベル */}
          <p className={cn(
            'text-sm font-medium leading-tight',
            hasFile ? 'text-green-700' : 'text-gray-700'
          )}>
            {label}
          </p>

          {/* ステータス */}
          <p className={cn(
            'text-xs mt-1',
            hasFile ? 'text-green-600' : 'text-gray-400'
          )}>
            {hasFile ? (fileCount > 1 ? `${fileCount}件` : '登録済') : 'タップで登録'}
          </p>
        </div>

        {/* 必須/条件バッジ */}
        <div className="absolute top-1 left-1 flex gap-1">
          {isRequired && !hasFile && (
            <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-medium">
              必須
            </span>
          )}
          {conditionLabel && (
            <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
              {conditionLabel}
            </span>
          )}
        </div>

        {/* 登録済みの場合のアクション */}
        {hasFile && (
          <div className="absolute top-2 right-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 bg-white/80 hover:bg-white"
              onClick={(e) => {
                e.stopPropagation()
                onView()
              }}
            >
              <Eye className="w-3 h-3" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
