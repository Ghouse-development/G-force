'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { SelectionCard, MultiSelectCard, ConfirmationCard } from './selection-card'
import { SmartSelection, SmartConfirmation } from '@/components/ui/smart-selection'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  ArrowRight,
  User,
  Package,
  Gift,
  Hammer,
  Users,
  FileText,
  CheckCircle,
  FileSignature,
  AlertCircle,
  Calendar,
  MapPin,
  DollarSign,
  FileCheck,
  Download,
  Building,
  CreditCard,
  Image as ImageIcon,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useContractStore, useAuthStore, useCustomerStore, useFundPlanStore, useFileStore } from '@/store'
import {
  PRODUCT_LIST,
  CAMPAIGN_LIST,
  CONSTRUCTION_METHOD_LIST,
  REFERRAL_LIST,
  IMPORTANT_MATTER_EXPLAINER_LIST,
} from '@/types/database'
import type { OwnershipType, Customer, ImportantMatterExplainer } from '@/types/database'

interface ContractWizardProps {
  customerId?: string
  fundPlanId?: string
}

type WizardStep = 'ownership' | 'product' | 'campaign' | 'method' | 'referral' | 'import' | 'handover' | 'explainer' | 'documents' | 'confirm'

const STEPS: { key: WizardStep; label: string; icon: React.ReactNode }[] = [
  { key: 'ownership', label: '名義', icon: <User className="w-4 h-4" /> },
  { key: 'product', label: '商品', icon: <Package className="w-4 h-4" /> },
  { key: 'campaign', label: 'キャンペーン', icon: <Gift className="w-4 h-4" /> },
  { key: 'method', label: '工法', icon: <Hammer className="w-4 h-4" /> },
  { key: 'referral', label: '紹介', icon: <Users className="w-4 h-4" /> },
  { key: 'import', label: '情報取込', icon: <Download className="w-4 h-4" /> },
  { key: 'handover', label: '引継書', icon: <FileSignature className="w-4 h-4" /> },
  { key: 'explainer', label: '重説者', icon: <User className="w-4 h-4" /> },
  { key: 'documents', label: '書類確認', icon: <FileCheck className="w-4 h-4" /> },
  { key: 'confirm', label: '確認', icon: <CheckCircle className="w-4 h-4" /> },
]

// 必要書類リスト（DocumentManagerと連携）
const REQUIRED_DOCUMENTS = [
  { id: 'drivers_license', label: '運転免許証', icon: CreditCard },
  { id: 'health_insurance', label: '健康保険証', icon: User },
  { id: 'loan_preapproval', label: 'ローン事前審査', icon: FileText },
  { id: 'land_registry', label: '土地謄本', icon: FileText },
  { id: 'cadastral_map', label: '公図', icon: MapPin },
  { id: 'land_survey', label: '地積測量図', icon: FileText },
  { id: 'site_photos', label: '建築地写真', icon: ImageIcon },
]

export function ContractWizard({ customerId, fundPlanId }: ContractWizardProps) {
  const router = useRouter()
  const { user } = useAuthStore()
  const { customers, updateCustomer } = useCustomerStore()
  const { fundPlans } = useFundPlanStore()
  const { files } = useFileStore()
  const { addContract } = useContractStore()

  const [currentStep, setCurrentStep] = useState<WizardStep>('ownership')
  const [isLoading, setIsLoading] = useState(false)

  // 選択データの状態
  const [selections, setSelections] = useState({
    ownership_type: '単独' as OwnershipType,
    showOwnershipOptions: false,
    partner_name: '',
    product_name: '',
    showProductOptions: false,
    campaigns: [] as string[],
    construction_method: 'conventional',
    showMethodOptions: false,
    referral: 'none',
    // 取り込みデータ（資金計画書・顧客情報から）
    importConfirmed: false,
    total_amount: 0,
    construction_start: '',
    construction_end: '',
    customer_address: '',
    land_address: '',
    // 引継書
    handoverCreated: false,
    // 重要事項説明者
    explainer_id: '',
  })

  // 顧客データ取得
  const customer = useMemo(() => {
    return customers.find(c => c.id === customerId)
  }, [customers, customerId])

  // 最新の資金計画書を取得
  const fundPlan = useMemo(() => {
    if (fundPlanId) {
      return fundPlans.find(fp => fp.id === fundPlanId)
    }
    // 顧客に紐づく最新の資金計画書を探す
    if (customerId) {
      const customerPlans = fundPlans.filter(fp => fp.customerId === customerId)
      if (customerPlans.length > 0) {
        return customerPlans.sort((a, b) =>
          new Date(b.updatedAt || b.createdAt || 0).getTime() -
          new Date(a.updatedAt || a.createdAt || 0).getTime()
        )[0]
      }
    }
    return null
  }, [fundPlans, fundPlanId, customerId])

  // 顧客のファイルを取得
  const customerFiles = useMemo(() => {
    return files.filter(f => f.customerId === customerId)
  }, [files, customerId])

  // 書類の有無をチェック（DocumentManagerと連携）
  const documentStatus = useMemo(() => {
    const status: Record<string, boolean> = {}
    for (const doc of REQUIRED_DOCUMENTS) {
      status[doc.id] = customerFiles.some(f => f.documentCategory === doc.id)
    }
    return status
  }, [customerFiles])

  // 顧客データから初期値を設定
  useEffect(() => {
    if (customer) {
      setSelections(prev => ({
        ...prev,
        ownership_type: customer.ownership_type || '単独',
        partner_name: customer.partner_name || '',
        product_name: fundPlan?.data?.productType || '',
        construction_method: 'conventional',
        customer_address: customer.address || '',
        land_address: customer.address || '',
      }))
    }
    if (fundPlan) {
      // FundPlanDataから値を取得
      const data = fundPlan.data
      setSelections(prev => ({
        ...prev,
        product_name: prev.product_name || data?.productType || '',
        total_amount: data ? calculateTotalFromData(data) : 0,
        construction_start: data?.schedule?.constructionStart || '',
        construction_end: data?.schedule?.completion || '',
      }))
    }
  }, [customer, fundPlan])

  // FundPlanDataから合計金額を計算
  const calculateTotalFromData = (data: any): number => {
    if (!data) return 0
    const buildingPrice = data.constructionArea * (data.pricePerTsubo || 0)
    const incidentalA = Object.values(data.incidentalCostA || {}).reduce((sum: number, v: any) => sum + (Number(v) || 0), 0)
    const incidentalB = Object.values(data.incidentalCostB || {}).reduce((sum: number, v: any) => sum + (Number(v) || 0), 0)
    const incidentalC = Object.values(data.incidentalCostC || {}).reduce((sum: number, v: any) => sum + (Number(v) || 0), 0)
    return buildingPrice + incidentalA + incidentalB + incidentalC
  }

  // 現在のステップインデックス
  const currentStepIndex = STEPS.findIndex(s => s.key === currentStep)
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100

  // 次のステップへ
  const nextStep = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].key)
    }
  }

  // 前のステップへ
  const prevStep = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].key)
    }
  }

  // キャンペーンのトグル
  const toggleCampaign = (campaignValue: string) => {
    setSelections(prev => {
      if (campaignValue === 'none') {
        return { ...prev, campaigns: prev.campaigns.includes('none') ? [] : ['none'] }
      }
      const newCampaigns = prev.campaigns.filter(c => c !== 'none')
      if (newCampaigns.includes(campaignValue)) {
        return { ...prev, campaigns: newCampaigns.filter(c => c !== campaignValue) }
      } else {
        return { ...prev, campaigns: [...newCampaigns, campaignValue] }
      }
    })
  }

  // 顧客情報を更新
  const updateCustomerInfo = () => {
    if (customerId && customer) {
      updateCustomer(customerId, {
        ownership_type: selections.ownership_type,
        partner_name: selections.partner_name || null,
        address: selections.customer_address,
      })
    }
  }

  // 選択された重要事項説明者を取得
  const selectedExplainer = useMemo(() => {
    return IMPORTANT_MATTER_EXPLAINER_LIST.find(e => e.id === selections.explainer_id)
  }, [selections.explainer_id])

  // 契約書作成処理
  const handleSubmit = async () => {
    setIsLoading(true)

    try {
      // 顧客情報を更新
      updateCustomerInfo()

      const fpData = fundPlan?.data
      const id = addContract({
        customer_id: customerId || `temp-${Date.now()}`,
        fund_plan_id: fundPlanId || fundPlan?.id || null,
        status: '作成中',
        contract_number: null,
        contract_date: new Date().toISOString().split('T')[0],
        tei_name: customer?.tei_name || '',
        customer_name: customer?.name || '',
        partner_name: selections.ownership_type === '共有' ? selections.partner_name : null,
        ownership_type: selections.ownership_type,
        sales_person: user?.name || null,
        design_person: null,
        construction_person: null,
        ic_person: null,
        land_address: selections.land_address,
        land_area: customer?.land_area || null,
        building_area: customer?.building_area || null,
        product_name: selections.product_name,
        building_price: fpData ? fpData.constructionArea * (fpData.pricePerTsubo || 0) : null,
        option_price: null,
        exterior_price: null,
        other_price: null,
        discount_amount: null,
        tax_amount: null,
        total_amount: selections.total_amount || null,
        payment_at_contract: fpData?.paymentPlanConstruction?.contractFee?.totalAmount || null,
        payment_at_start: fpData?.paymentPlanConstruction?.interimPayment1?.totalAmount || null,
        payment_at_frame: fpData?.paymentPlanConstruction?.interimPayment2?.totalAmount || null,
        payment_at_completion: fpData?.paymentPlanConstruction?.finalPayment?.totalAmount || null,
        identity_verified: false,
        identity_doc_type: null,
        identity_verified_date: null,
        identity_verified_by: null,
        loan_type: fpData?.loanPlan?.bankA?.amount ? '住宅ローン' : null,
        loan_bank: fpData?.loanPlan?.bankA?.bankName || null,
        loan_amount: fpData?.loanPlan?.bankA?.amount || null,
        loan_approved: false,
        loan_approved_date: null,
        important_notes: null,
        important_notes_date: null,
        attachments: null,
        created_by: user?.id || null,
        created_by_name: user?.name || null,
        checked_by: null,
        checked_by_name: null,
        checked_at: null,
        check_comment: null,
        approved_by: null,
        approved_by_name: null,
        approved_at: null,
        approval_comment: null,
        returned_by: null,
        returned_by_name: null,
        returned_at: null,
        return_comment: null,
        designated_checker_id: null,
        designated_checker_name: null,
        designated_approver_id: null,
        designated_approver_name: null,
        notes: JSON.stringify({
          campaigns: selections.campaigns,
          construction_method: selections.construction_method,
          referral: selections.referral,
          construction_start: selections.construction_start,
          construction_end: selections.construction_end,
          customer_address: selections.customer_address,
        }),
      })

      toast.success('契約書を作成しました')
      router.push(`/contracts/${id}`)
    } catch {
      toast.error('契約書の作成に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  // ステップごとのコンテンツ
  const renderStepContent = () => {
    switch (currentStep) {
      case 'ownership':
        const isCurrentlyShared = customer?.ownership_type === '共有'
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">名義の確認</h2>
              <p className="text-gray-600">契約の名義形態を確認してください</p>
            </div>

            {!selections.showOwnershipOptions ? (
              <div className="grid grid-cols-2 gap-4">
                <SelectionCard
                  value="keep"
                  label={isCurrentlyShared ? '共有名義でOK' : '単独名義でOK'}
                  description="現在の登録のまま進める"
                  icon={isCurrentlyShared ? <Users className="w-6 h-6" /> : <User className="w-6 h-6" />}
                  selected={false}
                  onClick={() => {
                    setSelections(prev => ({
                      ...prev,
                      ownership_type: isCurrentlyShared ? '共有' : '単独',
                      showOwnershipOptions: false,
                    }))
                    nextStep()
                  }}
                />
                <SelectionCard
                  value="change"
                  label={isCurrentlyShared ? '単独名義に変更する' : '共有名義に変更する'}
                  description="名義を変更して進める"
                  icon={isCurrentlyShared ? <User className="w-6 h-6" /> : <Users className="w-6 h-6" />}
                  selected={false}
                  onClick={() => setSelections(prev => ({ ...prev, showOwnershipOptions: true }))}
                />
              </div>
            ) : (
              <Card className="border-0 shadow-lg p-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    {isCurrentlyShared ? '単独名義への変更' : '共有名義への変更'}
                  </h3>
                  {!isCurrentlyShared && (
                    <div className="space-y-2">
                      <Label htmlFor="partner_name">共有者名（フルネーム）</Label>
                      <Input
                        id="partner_name"
                        value={selections.partner_name}
                        onChange={(e) => setSelections(prev => ({ ...prev, partner_name: e.target.value }))}
                        placeholder="例: 山田 花子"
                      />
                    </div>
                  )}
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setSelections(prev => ({ ...prev, showOwnershipOptions: false }))}
                    >
                      キャンセル
                    </Button>
                    <Button
                      className="bg-gradient-to-r from-orange-500 to-yellow-500"
                      onClick={() => {
                        setSelections(prev => ({
                          ...prev,
                          ownership_type: isCurrentlyShared ? '単独' : '共有',
                          showOwnershipOptions: false,
                        }))
                        nextStep()
                      }}
                      disabled={!isCurrentlyShared && !selections.partner_name}
                    >
                      変更して次へ
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )

      case 'product':
        const currentProduct = fundPlan?.data?.productType || ''
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">商品の確認</h2>
              <p className="text-gray-600">
                {currentProduct
                  ? `資金計画書の商品: ${currentProduct}`
                  : '商品を選択してください'}
              </p>
            </div>

            {currentProduct ? (
              <SmartSelection
                currentValue={currentProduct}
                currentLabel={currentProduct}
                currentDescription="資金計画書の商品をそのまま使用"
                currentIcon={<Package className="w-6 h-6" />}
                options={PRODUCT_LIST.map(p => ({
                  value: p.value,
                  label: p.label,
                  icon: <Package className="w-5 h-5" />,
                }))}
                onSelect={(value) => {
                  setSelections(prev => ({ ...prev, product_name: value }))
                  nextStep()
                }}
              />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {PRODUCT_LIST.map((product) => (
                  <SelectionCard
                    key={product.value}
                    value={product.value}
                    label={product.label}
                    icon={<Package className="w-6 h-6" />}
                    selected={selections.product_name === product.value}
                    onClick={() => {
                      setSelections(prev => ({ ...prev, product_name: product.value }))
                      nextStep()
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )

      case 'campaign':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">キャンペーン選択</h2>
              <p className="text-gray-600">適用するキャンペーンを選択してください（複数選択可）</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CAMPAIGN_LIST.map((campaign) => (
                <MultiSelectCard
                  key={campaign.value}
                  value={campaign.value}
                  label={campaign.label}
                  description={campaign.description}
                  icon={<Gift className="w-5 h-5" />}
                  selected={selections.campaigns.includes(campaign.value)}
                  onClick={() => toggleCampaign(campaign.value)}
                />
              ))}
            </div>

            {selections.campaigns.length > 0 && selections.campaigns[0] !== 'none' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-700 font-medium">
                  選択中: {selections.campaigns.map(c =>
                    CAMPAIGN_LIST.find(camp => camp.value === c)?.label
                  ).join('、')}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button onClick={nextStep} className="bg-gradient-to-r from-orange-500 to-yellow-500">
                次へ進む
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )

      case 'method':
        const currentMethod = selections.construction_method || 'conventional'
        const isCurrentlyTechno = currentMethod === 'technostructure'
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">工法の選択</h2>
              <p className="text-gray-600">建築工法を確認してください</p>
            </div>

            {!selections.showMethodOptions ? (
              <div className="grid grid-cols-2 gap-4">
                <SelectionCard
                  value="keep"
                  label={isCurrentlyTechno ? 'テクノストラクチャーでOK' : '在来軸組工法でOK'}
                  description="現在の登録のまま進める"
                  icon={<Hammer className="w-6 h-6" />}
                  selected={false}
                  onClick={() => {
                    setSelections(prev => ({ ...prev, construction_method: currentMethod }))
                    nextStep()
                  }}
                />
                <SelectionCard
                  value="change"
                  label={isCurrentlyTechno ? '在来軸組工法に変更する' : 'テクノストラクチャーに変更する'}
                  description="工法を変更して進める"
                  icon={<Hammer className="w-6 h-6" />}
                  selected={false}
                  onClick={() => {
                    setSelections(prev => ({
                      ...prev,
                      construction_method: isCurrentlyTechno ? 'conventional' : 'technostructure',
                    }))
                    nextStep()
                  }}
                />
              </div>
            ) : null}
          </div>
        )

      case 'referral':
        // 紹介なし vs 紹介あり の2択
        const referralOptions = REFERRAL_LIST.filter(r => r.value !== 'none')
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">紹介の有無</h2>
              <p className="text-gray-600">ご紹介はありますか？</p>
            </div>

            <SmartSelection
              currentValue="none"
              currentLabel="紹介なし"
              currentDescription="通常の契約（紹介なし）"
              currentIcon={<User className="w-6 h-6" />}
              options={referralOptions.map(ref => ({
                value: ref.value,
                label: ref.label,
                description: ref.description,
                icon: <Users className="w-5 h-5" />,
              }))}
              otherLabel="紹介元を選択"
              onSelect={(value) => {
                setSelections(prev => ({ ...prev, referral: value }))
                nextStep()
              }}
            />
          </div>
        )

      case 'import':
        // 資金計画書・顧客情報の取り込みプレビュー
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">情報の取り込み</h2>
              <p className="text-gray-600">資金計画書・顧客情報から契約書に必要な情報を取り込みます</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 資金計画書からの取り込み */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-orange-500" />
                    資金計画書より
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {fundPlan ? (
                    <>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600 text-sm">契約金額（税込）</span>
                        <span className="font-bold text-orange-600">
                          ¥{calculateTotalFromData(fundPlan.data).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600 text-sm">着工予定日</span>
                        <span className="font-medium">{fundPlan.data?.schedule?.constructionStart || '未設定'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600 text-sm">竣工予定日</span>
                        <span className="font-medium">{fundPlan.data?.schedule?.completion || '未設定'}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600 text-sm">商品名</span>
                        <span className="font-medium">{fundPlan.data?.productType || '未設定'}</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <AlertCircle className="w-12 h-12 mx-auto mb-3 text-yellow-500" />
                      <p>資金計画書が見つかりません</p>
                      <p className="text-xs mt-1">先に資金計画書を作成してください</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 顧客情報からの取り込み */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-500" />
                    顧客情報より
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {customer ? (
                    <>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600 text-sm">邸名</span>
                        <span className="font-bold">{customer.tei_name || customer.name}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600 text-sm">お客様住所</span>
                        <span className="font-medium text-right text-sm max-w-[200px]">{customer.address || '未設定'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600 text-sm">建築地の地番</span>
                        <span className="font-medium text-right text-sm max-w-[200px]">{customer.address || '未設定'}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600 text-sm">電話番号</span>
                        <span className="font-medium">{customer.phone || '未設定'}</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <AlertCircle className="w-12 h-12 mx-auto mb-3 text-yellow-500" />
                      <p>顧客情報が見つかりません</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {(fundPlan || customer) && (
              <div className="flex justify-center pt-4">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
                  onClick={() => {
                    // データを取り込む
                    setSelections(prev => ({
                      ...prev,
                      importConfirmed: true,
                      total_amount: fundPlan ? calculateTotalFromData(fundPlan.data) : 0,
                      construction_start: fundPlan?.data?.schedule?.constructionStart || '',
                      construction_end: fundPlan?.data?.schedule?.completion || '',
                      customer_address: customer?.address || '',
                      land_address: customer?.address || '',
                    }))
                    toast.success('情報を取り込みました')
                    nextStep()
                  }}
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  この内容で取り込む
                </Button>
              </div>
            )}
          </div>
        )

      case 'handover':
        // 引継書作成
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">引継書の作成</h2>
              <p className="text-gray-600">工事部門への引継書を作成します</p>
            </div>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="text-center py-8">
                  {selections.handoverCreated ? (
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      </div>
                      <p className="text-lg font-medium text-green-700">引継書を作成済みです</p>
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/handovers/new?customer_id=${customerId}`)}
                      >
                        引継書を確認・編集する
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                        <FileSignature className="w-8 h-8 text-orange-600" />
                      </div>
                      <p className="text-gray-600">
                        引継書を作成して工事部門に必要な情報を伝えましょう
                      </p>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left max-w-md mx-auto">
                        <p className="text-sm text-blue-700 font-medium mb-2">自動で引き継がれる情報:</p>
                        <ul className="text-sm text-blue-600 space-y-1">
                          <li>• 顧客情報（邸名、住所、連絡先）</li>
                          <li>• 商品・工法</li>
                          <li>• 契約金額・工期</li>
                          <li>• キャンペーン適用</li>
                        </ul>
                      </div>
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
                        onClick={() => {
                          // 引継書作成ページに遷移（クエリパラメータで必要な情報を渡す）
                          const params = new URLSearchParams({
                            customer_id: customerId || '',
                            product: selections.product_name,
                            method: selections.construction_method,
                            amount: selections.total_amount.toString(),
                            campaigns: selections.campaigns.join(','),
                          })
                          router.push(`/handovers/new?${params.toString()}`)
                        }}
                      >
                        <FileSignature className="w-5 h-5 mr-2" />
                        引継書を作成する
                      </Button>
                      <div className="pt-4">
                        <Button
                          variant="ghost"
                          className="text-gray-500"
                          onClick={() => {
                            setSelections(prev => ({ ...prev, handoverCreated: false }))
                            nextStep()
                          }}
                        >
                          後で作成する（スキップ）
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'explainer':
        // 重要事項説明者選択
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">重要事項説明者の選択</h2>
              <p className="text-gray-600">重要事項説明を行う担当者を選択してください</p>
            </div>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Label className="flex items-center gap-2 text-lg">
                    <User className="w-5 h-5 text-indigo-500" />
                    重要事項説明者
                  </Label>
                  <Select
                    value={selections.explainer_id}
                    onValueChange={(value) => setSelections(prev => ({ ...prev, explainer_id: value }))}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="重要事項説明者を選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {IMPORTANT_MATTER_EXPLAINER_LIST.map((explainer) => (
                        <SelectItem key={explainer.id} value={explainer.id}>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span>{explainer.name}</span>
                            <span className="text-xs text-gray-500">（{explainer.license_number}）</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedExplainer && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                      <p className="text-sm text-green-700 font-medium">選択中:</p>
                      <p className="text-lg font-bold text-green-800 mt-1">
                        {selectedExplainer.name}
                      </p>
                      <p className="text-sm text-green-600">{selectedExplainer.license_number}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'documents':
        const allDocsReady = Object.values(documentStatus).every(v => v)
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">書類の確認</h2>
              <p className="text-gray-600">必要書類が登録されているか確認してください</p>
            </div>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {REQUIRED_DOCUMENTS.map((doc) => {
                    const Icon = doc.icon
                    const isReady = documentStatus[doc.id]
                    return (
                      <div
                        key={doc.id}
                        className={`p-4 rounded-lg border-2 ${
                          isReady
                            ? 'border-green-300 bg-green-50'
                            : 'border-red-300 bg-red-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Icon className={`w-5 h-5 ${isReady ? 'text-green-600' : 'text-red-600'}`} />
                          {isReady ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <p className={`text-sm font-medium ${isReady ? 'text-green-700' : 'text-red-700'}`}>
                          {doc.label}
                        </p>
                        <p className={`text-xs mt-1 ${isReady ? 'text-green-600' : 'text-red-600'}`}>
                          {isReady ? '登録済み' : '未登録'}
                        </p>
                      </div>
                    )
                  })}
                </div>

                {!allDocsReady && (
                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-yellow-700 font-medium">一部の書類が未登録です</p>
                        <p className="text-xs text-yellow-600 mt-1">
                          契約書作成後に顧客詳細ページから書類をアップロードできます
                        </p>
                        <Button
                          variant="link"
                          className="text-xs text-yellow-700 p-0 h-auto mt-2"
                          onClick={() => router.push(`/customers/${customerId}`)}
                        >
                          顧客詳細ページで書類をアップロード →
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )

      case 'confirm':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">最終確認</h2>
              <p className="text-gray-600">以下の内容で契約書を作成します</p>
            </div>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileSignature className="w-5 h-5 mr-2 text-orange-500" />
                  契約内容
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {customer && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">顧客</span>
                    <span className="font-medium">{customer.tei_name || customer.name}</span>
                  </div>
                )}

                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">名義</span>
                  <span className="font-medium">
                    {selections.ownership_type}名義
                    {selections.ownership_type === '共有' && selections.partner_name && (
                      <span className="text-gray-500">（{selections.partner_name}）</span>
                    )}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">商品</span>
                  <span className="font-medium">{selections.product_name}</span>
                </div>

                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">キャンペーン</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {selections.campaigns.length === 0 || selections.campaigns.includes('none') ? (
                      <Badge variant="secondary">なし</Badge>
                    ) : (
                      selections.campaigns.map(c => (
                        <Badge key={c} className="bg-green-100 text-green-700">
                          {CAMPAIGN_LIST.find(camp => camp.value === c)?.label}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">工法</span>
                  <span className="font-medium">
                    {CONSTRUCTION_METHOD_LIST.find(m => m.value === selections.construction_method)?.label}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">紹介</span>
                  <span className="font-medium">
                    {REFERRAL_LIST.find(r => r.value === selections.referral)?.label}
                  </span>
                </div>

                {selections.total_amount > 0 && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">契約金額</span>
                    <span className="font-bold text-orange-600">
                      ¥{selections.total_amount.toLocaleString()}
                    </span>
                  </div>
                )}

                {(selections.construction_start || selections.construction_end) && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">工期</span>
                    <span className="font-medium">
                      {selections.construction_start} ～ {selections.construction_end}
                    </span>
                  </div>
                )}

                {selectedExplainer && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">重要事項説明者</span>
                    <span className="font-medium">
                      {selectedExplainer.name}（{selectedExplainer.license_number}）
                    </span>
                  </div>
                )}

                {selections.land_address && (
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">建築地</span>
                    <span className="font-medium text-right max-w-xs">{selections.land_address}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-3 justify-center pt-4">
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Excel出力
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                PDF出力
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* ステップインジケーター */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((step, index) => (
            <div
              key={step.key}
              className={`flex items-center ${index < STEPS.length - 1 ? 'flex-1' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                  index < currentStepIndex
                    ? 'bg-green-500 text-white'
                    : index === currentStepIndex
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {index < currentStepIndex ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  step.icon
                )}
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-1 ${
                    index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-gray-500">
          {STEPS.map((step) => (
            <span key={step.key} className={currentStep === step.key ? 'text-orange-600 font-medium' : ''}>
              {step.label}
            </span>
          ))}
        </div>
      </div>

      {/* プログレスバー */}
      <Progress value={progress} className="h-2 mb-8" />

      {/* ステップコンテンツ */}
      <div className="min-h-[400px]">
        {renderStepContent()}
      </div>

      {/* ナビゲーションボタン */}
      <div className="flex justify-between mt-8 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={currentStepIndex === 0 ? () => router.back() : prevStep}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {currentStepIndex === 0 ? 'キャンセル' : '戻る'}
        </Button>

        {currentStep === 'confirm' ? (
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                作成中...
              </>
            ) : (
              <>
                <FileSignature className="w-4 h-4 mr-2" />
                契約書を作成
              </>
            )}
          </Button>
        ) : currentStep !== 'campaign' ? (
          <Button
            onClick={nextStep}
            className="bg-gradient-to-r from-orange-500 to-yellow-500"
          >
            次へ
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : null}
      </div>
    </div>
  )
}
