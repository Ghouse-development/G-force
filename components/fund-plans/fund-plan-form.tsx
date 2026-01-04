'use client'

import { useState, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Save, FileText, List, Building2, Wallet, CreditCard, Calendar, Calculator, Sun, Home, ClipboardList, FileSpreadsheet, FileCheck } from 'lucide-react'
import { exportFundPlanFromTemplate, exportContractFromFundPlan } from '@/lib/excel-export'
import { BasicInfoSection } from './sections/basic-info-section'
import { BuildingCostSection } from './sections/building-cost-section'
import { LandMiscSection } from './sections/land-misc-section'
import { LoanSection } from './sections/loan-section'
import { PaymentSection } from './sections/payment-section'
import { SolarEffectSection } from './sections/solar-effect-section'
import { HousingComparisonSection } from './sections/housing-comparison-section'
import { RemarksSection } from './sections/remarks-section'
import { FundPlanExcelView } from './fund-plan-excel-view'
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

export function FundPlanForm({ initialData, onSave, onExportPDF }: FundPlanFormProps) {
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
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* 計算結果サマリー */}
            <div className="flex flex-wrap items-center gap-4 lg:gap-6">
              <div>
                <p className="text-sm text-gray-600">建物工事費用（税込）</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(calculation.totalBuildingConstructionWithTax)}円
                </p>
              </div>
              <div className="text-gray-400 hidden lg:block">+</div>
              <div>
                <p className="text-sm text-gray-600">諸費用+土地費用</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(calculation.totalOutsideConstruction)}円
                </p>
              </div>
              <div className="text-gray-400 hidden lg:block">=</div>
              <div className="bg-orange-100 px-4 py-2 rounded-lg">
                <p className="text-sm text-orange-600">総合計</p>
                <p className="text-xl font-bold text-orange-700">
                  {formatCurrency(calculation.grandTotal)}円
                </p>
              </div>
              <div className="border-l pl-4 lg:pl-6 lg:ml-2">
                <p className="text-sm text-gray-600">月々返済額</p>
                <p className="text-lg font-bold text-blue-600">
                  {formatCurrency(calculation.totalMonthlyPayment)}円
                </p>
              </div>
            </div>

            {/* アクションボタン */}
            <div className="flex items-center gap-2">
              {/* ビュー切り替え */}
              <div className="flex items-center border-2 border-orange-200 rounded-lg p-1 bg-orange-50">
                <Button
                  variant={viewMode === 'section' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('section')}
                  className={`h-7 ${viewMode === 'section' ? 'bg-white shadow-sm' : ''}`}
                >
                  <List className="w-4 h-4 mr-1" />
                  フォーム
                </Button>
                <Button
                  variant={viewMode === 'full' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('full')}
                  className={`h-7 ${viewMode === 'full' ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white' : ''}`}
                >
                  <FileSpreadsheet className="w-4 h-4 mr-1" />
                  Excel表示
                </Button>
              </div>

              <Button variant="outline" size="sm" onClick={() => exportFundPlanFromTemplate(data)}>
                <FileSpreadsheet className="w-4 h-4 mr-1" />
                資金計画書
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportContractFromFundPlan(data)}>
                <FileCheck className="w-4 h-4 mr-1" />
                請負契約書
              </Button>
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
          <div className="overflow-x-auto pb-2">
            <TabsList className="inline-flex gap-1 min-w-max">
              <TabsTrigger value="basic" className="text-sm px-3 py-2 min-w-[100px]">
                <Building2 className="w-4 h-4 mr-1.5" />
                基本情報
              </TabsTrigger>
              <TabsTrigger value="building" className="text-sm px-3 py-2 min-w-[100px]">
                <Calculator className="w-4 h-4 mr-1.5" />
                建物費用
              </TabsTrigger>
              <TabsTrigger value="land" className="text-sm px-3 py-2 min-w-[110px]">
                <Wallet className="w-4 h-4 mr-1.5" />
                土地・諸費用
              </TabsTrigger>
              <TabsTrigger value="payment" className="text-sm px-3 py-2 min-w-[100px]">
                <Calendar className="w-4 h-4 mr-1.5" />
                支払計画
              </TabsTrigger>
              <TabsTrigger value="loan" className="text-sm px-3 py-2 min-w-[100px]">
                <CreditCard className="w-4 h-4 mr-1.5" />
                借入計画
              </TabsTrigger>
              <TabsTrigger value="solar" className="text-sm px-3 py-2 min-w-[100px]">
                <Sun className="w-4 h-4 mr-1.5" />
                太陽光効果
              </TabsTrigger>
              <TabsTrigger value="housing" className="text-sm px-3 py-2 min-w-[100px]">
                <Home className="w-4 h-4 mr-1.5" />
                住居費比較
              </TabsTrigger>
              <TabsTrigger value="remarks" className="text-sm px-3 py-2 min-w-[100px]">
                <ClipboardList className="w-4 h-4 mr-1.5" />
                備考・仕様
              </TabsTrigger>
            </TabsList>
          </div>

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

      {/* Excel完全一致ビュー */}
      {viewMode === 'full' && (
        <FundPlanExcelView
          initialData={data}
          onSave={(newData) => {
            setData(newData)
            onSave(newData)
          }}
        />
      )}
    </div>
  )
}
