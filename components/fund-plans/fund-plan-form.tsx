'use client'

import { useState, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Save, FileText, LayoutGrid, List, Building2, Wallet, CreditCard, Calendar, Calculator, Sun, Home, ClipboardList } from 'lucide-react'
import { BasicInfoSection } from './sections/basic-info-section'
import { BuildingCostSection } from './sections/building-cost-section'
import { LandMiscSection } from './sections/land-misc-section'
import { LoanSection } from './sections/loan-section'
import { PaymentSection } from './sections/payment-section'
import { SolarEffectSection } from './sections/solar-effect-section'
import { HousingComparisonSection } from './sections/housing-comparison-section'
import { RemarksSection } from './sections/remarks-section'
import type { FundPlanData, FundPlanCalculation } from '@/types/fund-plan'
import { createDefaultFundPlanData } from '@/types/fund-plan'
import { calculateFundPlan, formatCurrency } from '@/lib/fund-plan/calculations'

interface FundPlanFormProps {
  initialData?: FundPlanData
  onSave: (data: FundPlanData) => void
  onExportPDF: (data: FundPlanData, calculation: FundPlanCalculation) => void
  customerId?: string
  customerName?: string
}

export function FundPlanForm({ initialData, onSave, onExportPDF, customerId, customerName }: FundPlanFormProps) {
  const [data, setData] = useState<FundPlanData>(initialData || createDefaultFundPlanData())
  const [viewMode, setViewMode] = useState<'section' | 'full'>('section')
  const [activeTab, setActiveTab] = useState('basic')

  const calculation = useMemo(() => calculateFundPlan(data), [data])

  const handleChange = useCallback((updates: Partial<FundPlanData>) => {
    setData((prev) => ({ ...prev, ...updates }))
  }, [])

  const buildingSubtotals = useMemo(
    () => ({
      buildingMain: calculation.subtotalBuildingMain,
      incidentalA: calculation.subtotalIncidentalA,
      incidentalB: calculation.subtotalIncidentalB,
      incidentalC: calculation.subtotalIncidentalC,
      total: calculation.totalBuildingConstruction,
      tax: calculation.consumptionTax,
      totalWithTax: calculation.totalBuildingConstructionWithTax,
    }),
    [calculation]
  )

  const landMiscSubtotals = useMemo(
    () => ({
      miscellaneous: calculation.subtotalMiscellaneous,
      land: calculation.subtotalLand,
      grandTotal: calculation.grandTotal,
    }),
    [calculation]
  )

  const loanCalculations = useMemo(
    () => ({
      monthlyPaymentA: calculation.monthlyPaymentA,
      monthlyPaymentB: calculation.monthlyPaymentB,
      monthlyPaymentC: calculation.monthlyPaymentC,
      totalMonthlyPayment: calculation.totalMonthlyPayment,
      bonusPaymentA: calculation.bonusPaymentA,
      bonusPaymentB: calculation.bonusPaymentB,
      bonusPaymentC: calculation.bonusPaymentC,
      totalBonusPayment: calculation.totalBonusPayment,
      bridgeLoanInterestTotal: calculation.bridgeLoanInterestTotal,
    }),
    [calculation]
  )

  const paymentTotals = useMemo(
    () => ({
      paymentTotal: calculation.paymentTotal,
      selfFundingTotal: calculation.selfFundingTotal,
      bankLoanTotal: calculation.bankLoanTotal,
    }),
    [calculation]
  )

  return (
    <div className="space-y-4">
      {/* ヘッダー: 合計表示 & アクション */}
      <Card className="sticky top-0 z-10 bg-white shadow-md">
        <CardContent className="py-3 px-4">
          <div className="flex items-center justify-between">
            {/* 計算結果サマリー */}
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-gray-500">建物工事費用（税込）</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(calculation.totalBuildingConstructionWithTax)}円
                </p>
              </div>
              <div className="text-gray-300">+</div>
              <div>
                <p className="text-xs text-gray-500">諸費用+土地費用</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(calculation.totalOutsideConstruction)}円
                </p>
              </div>
              <div className="text-gray-300">=</div>
              <div className="bg-orange-100 px-4 py-2 rounded-lg">
                <p className="text-xs text-orange-600">総合計</p>
                <p className="text-xl font-bold text-orange-700">
                  {formatCurrency(calculation.grandTotal)}円
                </p>
              </div>
              <div className="border-l pl-6 ml-2">
                <p className="text-xs text-gray-500">月々返済額</p>
                <p className="text-lg font-bold text-blue-600">
                  {formatCurrency(calculation.totalMonthlyPayment)}円
                </p>
              </div>
            </div>

            {/* アクションボタン */}
            <div className="flex items-center gap-2">
              {/* ビュー切り替え */}
              <div className="flex items-center border rounded-lg p-1">
                <Button
                  variant={viewMode === 'section' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('section')}
                  className="h-7"
                >
                  <List className="w-4 h-4 mr-1" />
                  セクション
                </Button>
                <Button
                  variant={viewMode === 'full' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('full')}
                  className="h-7"
                >
                  <LayoutGrid className="w-4 h-4 mr-1" />
                  全体表示
                </Button>
              </div>

              <Button variant="outline" size="sm" onClick={() => onExportPDF(data, calculation)}>
                <FileText className="w-4 h-4 mr-1" />
                PDF出力
              </Button>
              <Button size="sm" onClick={() => onSave(data)}>
                <Save className="w-4 h-4 mr-1" />
                保存
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* セクション別ビュー */}
      {viewMode === 'section' && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="basic" className="text-xs">
              <Building2 className="w-3 h-3 mr-1" />
              基本情報
            </TabsTrigger>
            <TabsTrigger value="building" className="text-xs">
              <Calculator className="w-3 h-3 mr-1" />
              建物費用
            </TabsTrigger>
            <TabsTrigger value="land" className="text-xs">
              <Wallet className="w-3 h-3 mr-1" />
              土地・諸費用
            </TabsTrigger>
            <TabsTrigger value="payment" className="text-xs">
              <Calendar className="w-3 h-3 mr-1" />
              支払計画
            </TabsTrigger>
            <TabsTrigger value="loan" className="text-xs">
              <CreditCard className="w-3 h-3 mr-1" />
              借入計画
            </TabsTrigger>
            <TabsTrigger value="solar" className="text-xs">
              <Sun className="w-3 h-3 mr-1" />
              太陽光効果
            </TabsTrigger>
            <TabsTrigger value="housing" className="text-xs">
              <Home className="w-3 h-3 mr-1" />
              住居費比較
            </TabsTrigger>
            <TabsTrigger value="remarks" className="text-xs">
              <ClipboardList className="w-3 h-3 mr-1" />
              備考・仕様
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="mt-4">
            <BasicInfoSection data={data} onChange={handleChange} />
          </TabsContent>

          <TabsContent value="building" className="mt-4">
            <BuildingCostSection data={data} onChange={handleChange} subtotals={buildingSubtotals} />
          </TabsContent>

          <TabsContent value="land" className="mt-4">
            <LandMiscSection data={data} onChange={handleChange} subtotals={landMiscSubtotals} />
          </TabsContent>

          <TabsContent value="payment" className="mt-4">
            <PaymentSection data={data} onChange={handleChange} totals={paymentTotals} />
          </TabsContent>

          <TabsContent value="loan" className="mt-4">
            <LoanSection data={data} onChange={handleChange} calculations={loanCalculations} />
          </TabsContent>

          <TabsContent value="solar" className="mt-4">
            <SolarEffectSection data={data} onChange={handleChange} />
          </TabsContent>

          <TabsContent value="housing" className="mt-4">
            <HousingComparisonSection data={data} onChange={handleChange} calculation={calculation} />
          </TabsContent>

          <TabsContent value="remarks" className="mt-4">
            <RemarksSection data={data} onChange={handleChange} />
          </TabsContent>
        </Tabs>
      )}

      {/* 全体表示ビュー（Excel風） */}
      {viewMode === 'full' && (
        <FullSheetView data={data} calculation={calculation} onChange={handleChange} />
      )}
    </div>
  )
}

// 全体表示コンポーネント
function FullSheetView({
  data,
  calculation,
}: {
  data: FundPlanData
  calculation: FundPlanCalculation
  onChange: (updates: Partial<FundPlanData>) => void
}) {
  return (
    <div className="bg-white border rounded-lg overflow-auto">
      {/* Excel風の全体レイアウト */}
      <div className="p-4 min-w-[1200px]">
        {/* ヘッダー部 */}
        <div className="grid grid-cols-12 gap-4 mb-4 pb-4 border-b">
          {/* 左: 邸名・仕様情報 */}
          <div className="col-span-3">
            <div className="text-lg font-bold text-gray-900 mb-2">
              {data.teiName || '○○様邸'} 資金計画書
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">{data.productType}</span> 仕様
            </div>
          </div>

          {/* 中央: 建物情報 */}
          <div className="col-span-5 grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-gray-500">工事名称: </span>
              <span className="font-medium">{data.constructionName || `${data.teiName}　新築工事`}</span>
            </div>
            <div>
              <span className="text-gray-500">建築場所: </span>
              <span className="font-medium">{data.constructionAddress}</span>
            </div>
            <div>
              <span className="text-gray-500">防火区分: </span>
              <span className="font-medium">{data.fireProtectionZone}</span>
            </div>
            <div>
              <span className="text-gray-500">建物構造: </span>
              <span className="font-medium">{data.buildingStructure}</span>
            </div>
            <div>
              <span className="text-gray-500">施工面積: </span>
              <span className="font-medium">{data.constructionArea}坪</span>
            </div>
            <div>
              <span className="text-gray-500">階数: </span>
              <span className="font-medium">{data.floorCount}階</span>
            </div>
          </div>

          {/* 右: 見積情報 */}
          <div className="col-span-4 text-xs text-right">
            <div>見積作成日: {data.estimateDate}</div>
            <div>見積有効期限: {data.estimateValidDate}</div>
          </div>
        </div>

        {/* メインコンテンツ: 3カラムレイアウト */}
        <div className="grid grid-cols-12 gap-4">
          {/* 左カラム: 標準仕様 + 建築費用 */}
          <div className="col-span-4 space-y-4">
            {/* 標準仕様 */}
            <div className="border rounded p-2">
              <h3 className="text-xs font-bold mb-2 bg-gray-100 px-2 py-1 -mx-2 -mt-2">標準仕様</h3>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <p className="font-semibold text-orange-600 mb-1">高性能</p>
                  <ul className="space-y-0.5 text-gray-600">
                    <li>● 木造ハイブリッド工法</li>
                    <li>● ベタ基礎</li>
                    <li>● 耐震等級３(最高ランク)※</li>
                    <li>● 制振システム evoltz</li>
                    <li>● 長期優良認定住宅※</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-blue-600 mb-1">断熱・気密</p>
                  <ul className="space-y-0.5 text-gray-600">
                    <li>● ZEH仕様(BELS★★★★★)</li>
                    <li>● 防湿気密シート施工</li>
                    <li>● Ua値 0.46 W/㎡K※</li>
                    <li>● 平均C値0.24 ㎠/㎡※</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 建築費用 */}
            <div className="border rounded p-2">
              <h3 className="text-xs font-bold mb-2 bg-orange-100 px-2 py-1 -mx-2 -mt-2">建築費用</h3>

              {/* ❶建物本体 */}
              <div className="mb-2 pb-2 border-b">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">❶建物本体工事</span>
                  <span className="font-bold">{formatCurrency(calculation.subtotalBuildingMain)}円</span>
                </div>
                <div className="text-[10px] text-gray-500 ml-2">
                  {data.productType} × {data.constructionArea}坪 × {formatCurrency(data.pricePerTsubo)}円
                </div>
              </div>

              {/* ❷付帯A */}
              <div className="mb-2 pb-2 border-b">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">❷付帯工事費用A</span>
                  <span className="font-bold">{formatCurrency(calculation.subtotalIncidentalA)}円</span>
                </div>
                <div className="text-[10px] text-gray-500 ml-2 grid grid-cols-2 gap-x-2">
                  <span>確認申請費用: {formatCurrency(data.incidentalCostA.confirmationApplicationFee)}</span>
                  <span>構造計算: {formatCurrency(data.incidentalCostA.structuralCalculation)}</span>
                  <span>設計・監理: {formatCurrency(data.incidentalCostA.designSupervisionFee)}</span>
                  <span>仮設工事: {formatCurrency(data.incidentalCostA.temporaryConstructionFee)}</span>
                </div>
              </div>

              {/* ❸付帯B */}
              <div className="mb-2 pb-2 border-b">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">❸付帯工事費用B</span>
                  <span className="font-bold">{formatCurrency(calculation.subtotalIncidentalB)}円</span>
                </div>
                <div className="text-[10px] text-gray-500 ml-2">
                  太陽光: {formatCurrency(data.incidentalCostB.solarPanelCost)} |
                  オプション: {formatCurrency(data.incidentalCostB.optionCost)}
                </div>
              </div>

              {/* ❹付帯C */}
              <div className="mb-2 pb-2 border-b">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">❹付帯工事費用C</span>
                  <span className="font-bold">{formatCurrency(calculation.subtotalIncidentalC)}円</span>
                </div>
                <div className="text-[10px] text-gray-500 ml-2">
                  地盤改良: {formatCurrency(data.incidentalCostC.groundImprovementFee)} |
                  給排水: {formatCurrency(data.incidentalCostC.waterDrainageFee)}
                </div>
              </div>

              {/* 合計 */}
              <div className="bg-orange-50 p-2 rounded text-xs">
                <div className="flex justify-between mb-1">
                  <span>最終建物工事費用（税抜）</span>
                  <span>{formatCurrency(calculation.totalBuildingConstruction)}円</span>
                </div>
                <div className="flex justify-between mb-1 text-gray-500">
                  <span>消費税（10%）</span>
                  <span>{formatCurrency(calculation.consumptionTax)}円</span>
                </div>
                <div className="flex justify-between font-bold text-orange-700 pt-1 border-t border-orange-200">
                  <span>最終建物工事費用（税込）</span>
                  <span>{formatCurrency(calculation.totalBuildingConstructionWithTax)}円</span>
                </div>
              </div>
            </div>

            {/* 諸費用・土地費用 */}
            <div className="border rounded p-2">
              <div className="flex justify-between text-xs mb-2">
                <span className="font-medium">❺諸費用</span>
                <span className="font-bold">{formatCurrency(calculation.subtotalMiscellaneous)}円</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-medium">❻土地費用</span>
                <span className="font-bold">{formatCurrency(calculation.subtotalLand)}円</span>
              </div>
            </div>

            {/* 総合計 */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-3 rounded text-center">
              <div className="text-xs opacity-90">最終合計（税込）</div>
              <div className="text-xl font-bold">{formatCurrency(calculation.grandTotal)}円</div>
            </div>
          </div>

          {/* 中央カラム: 支払計画 + 工程 */}
          <div className="col-span-4 space-y-4">
            {/* 支払計画 */}
            <div className="border rounded p-2">
              <h3 className="text-xs font-bold mb-2 bg-blue-100 px-2 py-1 -mx-2 -mt-2">支払計画</h3>

              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1">項目</th>
                    <th className="text-right py-1">支払金額</th>
                    <th className="text-right py-1">自己資金</th>
                    <th className="text-right py-1">銀行融資</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-1 text-gray-600">土地購入費用</td>
                    <td className="text-right">{formatCurrency(data.paymentPlanOutside.landPurchase.totalAmount)}</td>
                    <td className="text-right">{formatCurrency(data.paymentPlanOutside.landPurchase.selfFunding)}</td>
                    <td className="text-right">{formatCurrency(data.paymentPlanOutside.landPurchase.bankLoan)}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-1 text-gray-600">諸費用</td>
                    <td className="text-right">{formatCurrency(data.paymentPlanOutside.miscellaneous.totalAmount)}</td>
                    <td className="text-right">{formatCurrency(data.paymentPlanOutside.miscellaneous.selfFunding)}</td>
                    <td className="text-right">{formatCurrency(data.paymentPlanOutside.miscellaneous.bankLoan)}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-1 text-gray-600">建築申込金</td>
                    <td className="text-right">{formatCurrency(data.paymentPlanConstruction.applicationFee.totalAmount)}</td>
                    <td className="text-right">{formatCurrency(data.paymentPlanConstruction.applicationFee.selfFunding)}</td>
                    <td className="text-right">{formatCurrency(data.paymentPlanConstruction.applicationFee.bankLoan)}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-1 text-gray-600">契約金</td>
                    <td className="text-right">{formatCurrency(data.paymentPlanConstruction.contractFee.totalAmount)}</td>
                    <td className="text-right">{formatCurrency(data.paymentPlanConstruction.contractFee.selfFunding)}</td>
                    <td className="text-right">{formatCurrency(data.paymentPlanConstruction.contractFee.bankLoan)}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-1 text-gray-600">中間時金(1)</td>
                    <td className="text-right">{formatCurrency(data.paymentPlanConstruction.interimPayment1.totalAmount)}</td>
                    <td className="text-right">{formatCurrency(data.paymentPlanConstruction.interimPayment1.selfFunding)}</td>
                    <td className="text-right">{formatCurrency(data.paymentPlanConstruction.interimPayment1.bankLoan)}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-1 text-gray-600">中間時金(2)</td>
                    <td className="text-right">{formatCurrency(data.paymentPlanConstruction.interimPayment2.totalAmount)}</td>
                    <td className="text-right">{formatCurrency(data.paymentPlanConstruction.interimPayment2.selfFunding)}</td>
                    <td className="text-right">{formatCurrency(data.paymentPlanConstruction.interimPayment2.bankLoan)}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-1 text-gray-600">最終金</td>
                    <td className="text-right">{formatCurrency(data.paymentPlanConstruction.finalPayment.totalAmount)}</td>
                    <td className="text-right">{formatCurrency(data.paymentPlanConstruction.finalPayment.selfFunding)}</td>
                    <td className="text-right">{formatCurrency(data.paymentPlanConstruction.finalPayment.bankLoan)}</td>
                  </tr>
                  <tr className="bg-gray-50 font-bold">
                    <td className="py-1">合計</td>
                    <td className="text-right">{formatCurrency(calculation.paymentTotal)}</td>
                    <td className="text-right">{formatCurrency(calculation.selfFundingTotal)}</td>
                    <td className="text-right">{formatCurrency(calculation.bankLoanTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 工程 */}
            <div className="border rounded p-2">
              <h3 className="text-xs font-bold mb-2 bg-green-100 px-2 py-1 -mx-2 -mt-2">工程</h3>
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-gray-500">土地契約</span>
                  <span>{data.schedule.landContract || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">建物契約</span>
                  <span>{data.schedule.buildingContract || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">土地決済</span>
                  <span>{data.schedule.landSettlement || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">間取確定</span>
                  <span>{data.schedule.planFinalized || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">着工</span>
                  <span>{data.schedule.constructionStart || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">上棟</span>
                  <span>{data.schedule.roofRaising || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">竣工</span>
                  <span>{data.schedule.completion || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">最終金</span>
                  <span>{data.schedule.finalPaymentDate || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 右カラム: 借入計画 + 経済効果 */}
          <div className="col-span-4 space-y-4">
            {/* 借入計画 */}
            <div className="border rounded p-2">
              <h3 className="text-xs font-bold mb-2 bg-purple-100 px-2 py-1 -mx-2 -mt-2">借入計画</h3>

              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1">銀行</th>
                    <th className="text-right py-1">借入額</th>
                    <th className="text-right py-1">金利</th>
                    <th className="text-right py-1">年数</th>
                    <th className="text-right py-1">月々返済</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-1">{data.loanPlan.bankA.bankName}</td>
                    <td className="text-right">{formatCurrency(data.loanPlan.bankA.amount)}</td>
                    <td className="text-right">{(data.loanPlan.bankA.interestRate * 100).toFixed(2)}%</td>
                    <td className="text-right">{data.loanPlan.bankA.loanYears}年</td>
                    <td className="text-right font-bold">{formatCurrency(calculation.monthlyPaymentA)}</td>
                  </tr>
                  {data.loanPlan.bankB.amount > 0 && (
                    <tr className="border-b border-gray-100">
                      <td className="py-1">{data.loanPlan.bankB.bankName}</td>
                      <td className="text-right">{formatCurrency(data.loanPlan.bankB.amount)}</td>
                      <td className="text-right">{(data.loanPlan.bankB.interestRate * 100).toFixed(2)}%</td>
                      <td className="text-right">{data.loanPlan.bankB.loanYears}年</td>
                      <td className="text-right font-bold">{formatCurrency(calculation.monthlyPaymentB)}</td>
                    </tr>
                  )}
                  {data.loanPlan.bankC.amount > 0 && (
                    <tr className="border-b border-gray-100">
                      <td className="py-1">{data.loanPlan.bankC.bankName}</td>
                      <td className="text-right">{formatCurrency(data.loanPlan.bankC.amount)}</td>
                      <td className="text-right">{(data.loanPlan.bankC.interestRate * 100).toFixed(2)}%</td>
                      <td className="text-right">{data.loanPlan.bankC.loanYears}年</td>
                      <td className="text-right font-bold">{formatCurrency(calculation.monthlyPaymentC)}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="bg-blue-50 p-2 rounded mt-2 flex justify-between items-center">
                <span className="text-xs font-medium">月々返済額合計</span>
                <span className="text-lg font-bold text-blue-700">{formatCurrency(calculation.totalMonthlyPayment)}円</span>
              </div>
            </div>

            {/* つなぎ融資 */}
            <div className="border rounded p-2">
              <h3 className="text-xs font-bold mb-2 bg-yellow-100 px-2 py-1 -mx-2 -mt-2">つなぎ融資</h3>

              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span>土地つなぎ</span>
                  <span>{formatCurrency(data.bridgeLoan.landBridge.amount)}円 × {(data.bridgeLoan.landBridge.interestRate * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>建物着工つなぎ</span>
                  <span>{formatCurrency(data.bridgeLoan.constructionStartBridge.amount)}円</span>
                </div>
                <div className="flex justify-between">
                  <span>建物中間つなぎ</span>
                  <span>{formatCurrency(data.bridgeLoan.constructionInterimBridge.amount)}円</span>
                </div>
              </div>

              <div className="bg-yellow-50 p-2 rounded mt-2 flex justify-between items-center">
                <span className="text-xs font-medium">つなぎ金利息合計</span>
                <span className="font-bold">{formatCurrency(calculation.bridgeLoanInterestTotal)}円</span>
              </div>
            </div>

            {/* 太陽光経済効果 */}
            <div className="border rounded p-2">
              <h3 className="text-xs font-bold mb-2 bg-green-100 px-2 py-1 -mx-2 -mt-2">太陽光発電＆蓄電システム経済効果</h3>

              <div className="text-[10px] space-y-1">
                <div className="flex justify-between">
                  <span>太陽光パネル容量</span>
                  <span>{data.incidentalCostB.solarPanelKw} kW</span>
                </div>
                <div className="flex justify-between">
                  <span>年間予測発電量</span>
                  <span>{formatCurrency(data.solarOnlyEffect.annualProduction)} kWh</span>
                </div>
                <div className="flex justify-between">
                  <span>売電単価</span>
                  <span>{data.solarOnlyEffect.salePrice}円/kWh</span>
                </div>
              </div>

              <div className="bg-green-50 p-2 rounded mt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium">トータル経済効果（月額）</span>
                  <span className="font-bold text-green-700">{formatCurrency(data.solarOnlyEffect.monthlyTotalEffect)}円</span>
                </div>
              </div>
            </div>

            {/* 担当者情報 */}
            <div className="border rounded p-2 text-[10px]">
              <div className="font-bold mb-1">株式会社Gハウス</div>
              <div className="text-gray-600">〒535-0022 大阪市旭区新森２丁目２３−１２</div>
              <div className="mt-2 flex gap-4">
                <div>
                  <span className="text-gray-500">担当者: </span>
                  <span className="font-medium">{data.salesRep}</span>
                </div>
                <div>
                  <span className="text-gray-500">連絡先: </span>
                  <span>{data.salesRepPhone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
