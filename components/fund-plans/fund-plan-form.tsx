'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calculator, Building, Wallet, FileText, Home, Landmark, CreditCard } from 'lucide-react'
import type { FundPlanData, FundPlanCalculation, ProductType, FireProtectionZone, BuildingStructure, FloorCount } from '@/types/fund-plan'
import {
  productMaster,
  productList,
  fireProtectionZones,
  buildingStructures,
  floorCounts,
  defaultIncidentalCostA,
  salesRepMaster,
} from '@/lib/fund-plan/master-data'
import { calculateFundPlan, formatCurrency } from '@/lib/fund-plan/calculations'

interface FundPlanFormProps {
  initialData?: Partial<FundPlanData>
  onSave?: (data: FundPlanData) => void
  onExportPDF?: (data: FundPlanData, calculation: FundPlanCalculation) => void
}

const getDefaultData = (): FundPlanData => ({
  customerName: '',
  teiName: '',
  constructionAddress: '',
  fireProtectionZone: '準防火地域',
  buildingStructure: '在来軸組工法 ガルバリウム鋼板葺',
  floorCount: 2,
  estimateValidDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  productType: 'LIFE',
  constructionArea: 30,
  pricePerTsubo: 550000,
  buildingMainCost: 16500000,
  incidentalCostA: { ...defaultIncidentalCostA },
  incidentalCostB: {
    solarPanelCount: 18,
    solarPanelKw: 8.37,
    solarPanelCost: 1753300,
    storageBatteryCost: 0,
    eaveOverhangArea: 0,
    eaveOverhangCost: 0,
    threeStoryDifference: 0,
    roofLengthExtra: 0,
    narrowRoadExtra: 0,
    areaSizeExtra: 0,
  },
  incidentalCostC: {
    landSurveyFee: 0,
    groundImprovementFee: 0,
    demolitionFee: 0,
    retainingWallFee: 0,
    exteriorFee: 0,
    otherFee: 0,
  },
  miscellaneousCosts: {
    registrationFee: 500000,
    stampDuty: 30000,
    loanFee: 800000,
    fireInsurance: 200000,
    bridgeLoanInterest: 0,
    otherFee: 0,
  },
  landCosts: {
    landPrice: 30000000,
    brokerageFee: 1000000,
    propertyTaxSettlement: 100000,
    landRegistrationFee: 400000,
  },
  paymentPlan: {
    applicationFee: { date: '', amount: 30000 },
    contractFee: { date: '', amount: 3000000 },
    interimPayment1: { date: '', amount: 9000000 },
    interimPayment2: { date: '', amount: 9000000 },
    finalPayment: { date: '', amount: 0 },
  },
  loanPlan: {
    bankA: { bankName: '', amount: 55000000, interestRate: 0.0082, fixedOrVariable: '変動', loanYears: 35 },
    bankB: { bankName: '', amount: 0, interestRate: 0, fixedOrVariable: '変動', loanYears: 35 },
    bankC: { bankName: '', amount: 0, interestRate: 0, fixedOrVariable: '変動', loanYears: 35 },
  },
  bridgeLoan: {
    landBridge: { amount: 35516000, interestRate: 0.02, months: 7 },
    constructionBridge: { amount: 9000000, interestRate: 0.02, months: 5 },
  },
})

export function FundPlanForm({ initialData, onSave, onExportPDF }: FundPlanFormProps) {
  const [data, setData] = useState<FundPlanData>(() => ({
    ...getDefaultData(),
    ...initialData,
  }))
  const [calculation, setCalculation] = useState<FundPlanCalculation | null>(null)

  // 計算を実行
  useEffect(() => {
    const calc = calculateFundPlan(data)
    setCalculation(calc)
  }, [data])

  // 商品タイプ変更時に坪単価を更新
  const handleProductChange = (productType: ProductType) => {
    const pricePerTsubo = productMaster[productType]
    setData(prev => ({
      ...prev,
      productType,
      pricePerTsubo,
      buildingMainCost: prev.constructionArea * pricePerTsubo,
    }))
  }

  // 施工面積変更時に建物本体価格を更新
  const handleAreaChange = (area: number) => {
    setData(prev => ({
      ...prev,
      constructionArea: area,
      buildingMainCost: area * prev.pricePerTsubo,
    }))
  }

  // 汎用的な更新関数
  const updateField = <K extends keyof FundPlanData>(key: K, value: FundPlanData[K]) => {
    setData(prev => ({ ...prev, [key]: value }))
  }

  // ネストしたオブジェクトの更新
  const updateNestedField = <K extends keyof FundPlanData>(
    parentKey: K,
    childKey: string,
    value: number | string
  ) => {
    setData(prev => ({
      ...prev,
      [parentKey]: {
        ...(prev[parentKey] as Record<string, unknown>),
        [childKey]: value,
      },
    }))
  }

  return (
    <div className="space-y-6">
      {/* 計算結果サマリー */}
      {calculation && (
        <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">建物本体工事</p>
                <p className="text-xl font-bold text-orange-600">
                  {formatCurrency(calculation.subtotalBuildingMain)}円
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">工事請負合計(税込)</p>
                <p className="text-xl font-bold text-orange-600">
                  {formatCurrency(calculation.totalConstructionWithTax)}円
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">土地建物総額</p>
                <p className="text-xl font-bold text-orange-600">
                  {formatCurrency(calculation.totalLandAndBuilding)}円
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">月々返済額</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(calculation.totalMonthlyPayment)}円
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="basic" className="text-xs">
            <Home className="w-4 h-4 mr-1" />
            基本
          </TabsTrigger>
          <TabsTrigger value="building" className="text-xs">
            <Building className="w-4 h-4 mr-1" />
            建物
          </TabsTrigger>
          <TabsTrigger value="incidental" className="text-xs">
            <FileText className="w-4 h-4 mr-1" />
            付帯工事
          </TabsTrigger>
          <TabsTrigger value="land" className="text-xs">
            <Landmark className="w-4 h-4 mr-1" />
            土地・諸費用
          </TabsTrigger>
          <TabsTrigger value="payment" className="text-xs">
            <Wallet className="w-4 h-4 mr-1" />
            支払
          </TabsTrigger>
          <TabsTrigger value="loan" className="text-xs">
            <CreditCard className="w-4 h-4 mr-1" />
            借入
          </TabsTrigger>
        </TabsList>

        {/* 基本情報タブ */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5" />
                基本情報
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label>顧客名</Label>
                <Input
                  value={data.customerName}
                  onChange={e => updateField('customerName', e.target.value)}
                  placeholder="山田 太郎"
                />
              </div>
              <div>
                <Label>邸名</Label>
                <Input
                  value={data.teiName}
                  onChange={e => updateField('teiName', e.target.value)}
                  placeholder="山田様邸"
                />
              </div>
              <div className="col-span-2">
                <Label>建築場所</Label>
                <Input
                  value={data.constructionAddress}
                  onChange={e => updateField('constructionAddress', e.target.value)}
                  placeholder="大阪府大阪市..."
                />
              </div>
              <div>
                <Label>防火区分</Label>
                <Select
                  value={data.fireProtectionZone}
                  onValueChange={(v) => updateField('fireProtectionZone', v as FireProtectionZone)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fireProtectionZones.map(zone => (
                      <SelectItem key={zone} value={zone}>{zone}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>建物構造</Label>
                <Select
                  value={data.buildingStructure}
                  onValueChange={(v) => updateField('buildingStructure', v as BuildingStructure)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {buildingStructures.map(structure => (
                      <SelectItem key={structure} value={structure}>{structure}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>階数</Label>
                <Select
                  value={String(data.floorCount)}
                  onValueChange={(v) => updateField('floorCount', Number(v) as FloorCount)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {floorCounts.map(count => (
                      <SelectItem key={count} value={String(count)}>{count}階建て</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>見積有効期限</Label>
                <Input
                  type="date"
                  value={data.estimateValidDate}
                  onChange={e => updateField('estimateValidDate', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 建物タブ */}
        <TabsContent value="building">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                建物本体工事
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>商品タイプ</Label>
                  <Select
                    value={data.productType}
                    onValueChange={(v) => handleProductChange(v as ProductType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {productList.map(product => (
                        <SelectItem key={product} value={product}>
                          {product} ({formatCurrency(productMaster[product])}円/坪)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>施工面積（坪）</Label>
                  <Input
                    type="number"
                    value={data.constructionArea}
                    onChange={e => handleAreaChange(Number(e.target.value))}
                    min={0}
                    step={0.5}
                  />
                </div>
                <div>
                  <Label>坪単価（円）</Label>
                  <Input
                    type="number"
                    value={data.pricePerTsubo}
                    onChange={e => {
                      const price = Number(e.target.value)
                      setData(prev => ({
                        ...prev,
                        pricePerTsubo: price,
                        buildingMainCost: prev.constructionArea * price,
                      }))
                    }}
                  />
                </div>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600">建物本体工事 小計（税抜）</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(data.constructionArea * data.pricePerTsubo)}円
                </p>
                <p className="text-sm text-gray-500">
                  {data.constructionArea}坪 × {formatCurrency(data.pricePerTsubo)}円
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 付帯工事タブ */}
        <TabsContent value="incidental">
          <div className="space-y-4">
            {/* 付帯工事A */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">付帯工事費用A（建物本体以外）</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                {Object.entries(data.incidentalCostA).map(([key, value]) => (
                  <div key={key}>
                    <Label className="text-xs">
                      {key === 'confirmationApplicationFee' && '確認申請費用'}
                      {key === 'structuralCalculation' && '構造計算'}
                      {key === 'structuralDrawingFee' && '構造図作成費用'}
                      {key === 'belsApplicationFee' && 'BELS評価書申請費用'}
                      {key === 'longTermHousingApplicationFee' && '長期優良住宅申請費用'}
                      {key === 'outdoorElectricWaterDrainageFee' && '屋外電気・給排水工事'}
                      {key === 'defectInsuranceGroundTermiteWarranty' && '瑕疵保険・地盤・シロアリ保証'}
                      {key === 'designSupervisionFee' && '設計・工事監理費用'}
                      {key === 'safetyMeasuresFee' && '安全対策費用'}
                      {key === 'temporaryConstructionFee' && '仮設工事費用'}
                    </Label>
                    <Input
                      type="number"
                      value={value}
                      onChange={e => updateNestedField('incidentalCostA', key, Number(e.target.value))}
                      className="h-8"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* 付帯工事B */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">付帯工事費用B（間取・オプション）</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">太陽光パネル枚数</Label>
                  <Input
                    type="number"
                    value={data.incidentalCostB.solarPanelCount}
                    onChange={e => updateNestedField('incidentalCostB', 'solarPanelCount', Number(e.target.value))}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">太陽光発電システム費用</Label>
                  <Input
                    type="number"
                    value={data.incidentalCostB.solarPanelCost}
                    onChange={e => updateNestedField('incidentalCostB', 'solarPanelCost', Number(e.target.value))}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">蓄電池費用</Label>
                  <Input
                    type="number"
                    value={data.incidentalCostB.storageBatteryCost}
                    onChange={e => updateNestedField('incidentalCostB', 'storageBatteryCost', Number(e.target.value))}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">3階建て差額</Label>
                  <Input
                    type="number"
                    value={data.incidentalCostB.threeStoryDifference}
                    onChange={e => updateNestedField('incidentalCostB', 'threeStoryDifference', Number(e.target.value))}
                    className="h-8"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 付帯工事C */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">付帯工事費用C（土地条件）</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">地盤改良費用</Label>
                  <Input
                    type="number"
                    value={data.incidentalCostC.groundImprovementFee}
                    onChange={e => updateNestedField('incidentalCostC', 'groundImprovementFee', Number(e.target.value))}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">解体工事費用</Label>
                  <Input
                    type="number"
                    value={data.incidentalCostC.demolitionFee}
                    onChange={e => updateNestedField('incidentalCostC', 'demolitionFee', Number(e.target.value))}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">外構工事費用</Label>
                  <Input
                    type="number"
                    value={data.incidentalCostC.exteriorFee}
                    onChange={e => updateNestedField('incidentalCostC', 'exteriorFee', Number(e.target.value))}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">その他費用</Label>
                  <Input
                    type="number"
                    value={data.incidentalCostC.otherFee}
                    onChange={e => updateNestedField('incidentalCostC', 'otherFee', Number(e.target.value))}
                    className="h-8"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 土地・諸費用タブ */}
        <TabsContent value="land">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">土地費用</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">土地価格</Label>
                  <Input
                    type="number"
                    value={data.landCosts.landPrice}
                    onChange={e => updateNestedField('landCosts', 'landPrice', Number(e.target.value))}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">仲介手数料</Label>
                  <Input
                    type="number"
                    value={data.landCosts.brokerageFee}
                    onChange={e => updateNestedField('landCosts', 'brokerageFee', Number(e.target.value))}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">固定資産税精算金</Label>
                  <Input
                    type="number"
                    value={data.landCosts.propertyTaxSettlement}
                    onChange={e => updateNestedField('landCosts', 'propertyTaxSettlement', Number(e.target.value))}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">土地登記費用</Label>
                  <Input
                    type="number"
                    value={data.landCosts.landRegistrationFee}
                    onChange={e => updateNestedField('landCosts', 'landRegistrationFee', Number(e.target.value))}
                    className="h-8"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">諸費用</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">登記費用</Label>
                  <Input
                    type="number"
                    value={data.miscellaneousCosts.registrationFee}
                    onChange={e => updateNestedField('miscellaneousCosts', 'registrationFee', Number(e.target.value))}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">印紙代</Label>
                  <Input
                    type="number"
                    value={data.miscellaneousCosts.stampDuty}
                    onChange={e => updateNestedField('miscellaneousCosts', 'stampDuty', Number(e.target.value))}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">ローン手数料</Label>
                  <Input
                    type="number"
                    value={data.miscellaneousCosts.loanFee}
                    onChange={e => updateNestedField('miscellaneousCosts', 'loanFee', Number(e.target.value))}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">火災保険</Label>
                  <Input
                    type="number"
                    value={data.miscellaneousCosts.fireInsurance}
                    onChange={e => updateNestedField('miscellaneousCosts', 'fireInsurance', Number(e.target.value))}
                    className="h-8"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 支払タブ */}
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                支払計画
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'applicationFee', label: '建築申込金' },
                { key: 'contractFee', label: '契約金' },
                { key: 'interimPayment1', label: '中間時金(1)' },
                { key: 'interimPayment2', label: '中間時金(2)' },
                { key: 'finalPayment', label: '最終金' },
              ].map(({ key, label }) => (
                <div key={key} className="grid grid-cols-3 gap-3 items-center">
                  <Label>{label}</Label>
                  <Input
                    type="date"
                    value={(data.paymentPlan as Record<string, { date: string; amount: number }>)[key].date}
                    onChange={e => {
                      setData(prev => ({
                        ...prev,
                        paymentPlan: {
                          ...prev.paymentPlan,
                          [key]: { ...(prev.paymentPlan as Record<string, { date: string; amount: number }>)[key], date: e.target.value },
                        },
                      }))
                    }}
                    className="h-8"
                  />
                  <Input
                    type="number"
                    value={(data.paymentPlan as Record<string, { date: string; amount: number }>)[key].amount}
                    onChange={e => {
                      setData(prev => ({
                        ...prev,
                        paymentPlan: {
                          ...prev.paymentPlan,
                          [key]: { ...(prev.paymentPlan as Record<string, { date: string; amount: number }>)[key], amount: Number(e.target.value) },
                        },
                      }))
                    }}
                    className="h-8"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 借入タブ */}
        <TabsContent value="loan">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                借入計画
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {['bankA', 'bankB', 'bankC'].map((bankKey, index) => (
                <div key={bankKey} className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">借入先 {index + 1}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div>
                      <Label className="text-xs">銀行名</Label>
                      <Input
                        value={(data.loanPlan as Record<string, { bankName: string; amount: number; interestRate: number; fixedOrVariable: string; loanYears: number }>)[bankKey].bankName}
                        onChange={e => {
                          setData(prev => ({
                            ...prev,
                            loanPlan: {
                              ...prev.loanPlan,
                              [bankKey]: { ...(prev.loanPlan as Record<string, { bankName: string; amount: number; interestRate: number; fixedOrVariable: string; loanYears: number }>)[bankKey], bankName: e.target.value },
                            },
                          }))
                        }}
                        className="h-8"
                        placeholder="○○銀行"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">借入額</Label>
                      <Input
                        type="number"
                        value={(data.loanPlan as Record<string, { bankName: string; amount: number; interestRate: number; fixedOrVariable: string; loanYears: number }>)[bankKey].amount}
                        onChange={e => {
                          setData(prev => ({
                            ...prev,
                            loanPlan: {
                              ...prev.loanPlan,
                              [bankKey]: { ...(prev.loanPlan as Record<string, { bankName: string; amount: number; interestRate: number; fixedOrVariable: string; loanYears: number }>)[bankKey], amount: Number(e.target.value) },
                            },
                          }))
                        }}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">金利(%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={((data.loanPlan as Record<string, { bankName: string; amount: number; interestRate: number; fixedOrVariable: string; loanYears: number }>)[bankKey].interestRate * 100).toFixed(2)}
                        onChange={e => {
                          setData(prev => ({
                            ...prev,
                            loanPlan: {
                              ...prev.loanPlan,
                              [bankKey]: { ...(prev.loanPlan as Record<string, { bankName: string; amount: number; interestRate: number; fixedOrVariable: string; loanYears: number }>)[bankKey], interestRate: Number(e.target.value) / 100 },
                            },
                          }))
                        }}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">固定/変動</Label>
                      <Select
                        value={(data.loanPlan as Record<string, { bankName: string; amount: number; interestRate: number; fixedOrVariable: string; loanYears: number }>)[bankKey].fixedOrVariable}
                        onValueChange={v => {
                          setData(prev => ({
                            ...prev,
                            loanPlan: {
                              ...prev.loanPlan,
                              [bankKey]: { ...(prev.loanPlan as Record<string, { bankName: string; amount: number; interestRate: number; fixedOrVariable: string; loanYears: number }>)[bankKey], fixedOrVariable: v as '固定' | '変動' },
                            },
                          }))
                        }}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="固定">固定</SelectItem>
                          <SelectItem value="変動">変動</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">借入年数</Label>
                      <Input
                        type="number"
                        value={(data.loanPlan as Record<string, { bankName: string; amount: number; interestRate: number; fixedOrVariable: string; loanYears: number }>)[bankKey].loanYears}
                        onChange={e => {
                          setData(prev => ({
                            ...prev,
                            loanPlan: {
                              ...prev.loanPlan,
                              [bankKey]: { ...(prev.loanPlan as Record<string, { bankName: string; amount: number; interestRate: number; fixedOrVariable: string; loanYears: number }>)[bankKey], loanYears: Number(e.target.value) },
                            },
                          }))
                        }}
                        className="h-8"
                      />
                    </div>
                  </div>
                  {calculation && (
                    <div className="mt-2 text-right">
                      <span className="text-sm text-gray-600">月々返済額: </span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(
                          index === 0 ? calculation.monthlyPaymentA :
                          index === 1 ? calculation.monthlyPaymentB :
                          calculation.monthlyPaymentC
                        )}円
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* アクションボタン */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => onSave?.(data)}>
          保存
        </Button>
        <Button
          onClick={() => calculation && onExportPDF?.(data, calculation)}
          className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white"
        >
          <FileText className="w-4 h-4 mr-2" />
          PDF出力
        </Button>
      </div>
    </div>
  )
}
